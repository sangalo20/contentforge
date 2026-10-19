author: Google Developer Expert
summary: Add a tested output-contract guard to a multi-agent AI quality gate, while preserving the original draft when review output is malformed.
id: contentforge-human-reviewer
categories: AI, Gemini, Cloud Run
environments: Web
status: Draft
<!-- -->
# The Human Is the Reviewer: Add a Fail-Open Guard to Heimdall

<!-- ------------------------ -->
## Introduction

Duration: 3

In this codelab, you will change and test a real part of ContentForge's multi-agent service. Heimdall reviews an AI-written article, but its response has a contract: it must return a complete draft beginning with an H1. The current code strips a preamble when an H1 exists, but accepts a long response even when the H1 is missing.

You will write a regression test for that malformed response, watch it fail, implement a guard, and run the existing mocked test suite. No Google Cloud project, API key, or live model call is required.

### What you'll build

A deterministic guard that rejects malformed Heimdall output. Odin already treats a failed Heimdall review as fail-open: it retains Oscar's original draft and continues, so a quality-check problem does not discard useful work.

### What you'll learn

- Follow one response through Heimdall and its caller in Odin.
- Use a mocked LLM response to reproduce a failure without calling a model.
- Write a regression test before changing the implementation.
- Preserve the original draft when an optional AI quality pass fails.

### Architecture

```text
Oscar's draft
    -> Heimdall calls the model and parses corrected draft + QA report
        -> valid output: Odin uses Heimdall's corrected draft
        -> error: Odin keeps Oscar's original draft and continues
```

<!-- ------------------------ -->
## Set up the code lab

Duration: 6

You need Git, Python 3.10 or newer, and a terminal. This exercise uses the Odin Agent's existing tests. It does not need Node.js, a running app, Google Cloud credentials, or model API keys.

Clone the repository and enter Odin:

```bash
git clone https://github.com/sangalo20/contentforge.git
cd contentforge/odin-agent
```

Create a virtual environment and install the service dependencies plus pytest:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt pytest
```

On Windows PowerShell, activate with:

```powershell
.venv\Scripts\Activate.ps1
```

<!-- ------------------------ -->
## Run the existing tests

Duration: 3

Run the focused Heimdall tests:

```bash
python -m pytest tests/test_heimdall_output.py -q
```

They should pass. Open `tests/test_heimdall_output.py`. Its `stub_response` helper replaces LiteLLM's async completion call with a fixed response, so the tests are repeatable and make no network request.

Find the existing cases:

- A clean draft and QA report pass through.
- A narrated preamble before the H1 is removed.
- An implausibly short result returns an error so the caller can keep the original draft.

The lab adds one missing case: a response that is long enough to pass the current size check but violates the required H1 contract.

<!-- ------------------------ -->
## Trace the quality gate

Duration: 4

Open `agents.py` and find `HeimdallAgent.on_peer_request`.

Follow the response handling after `litellm.acompletion`:

1. Heimdall extracts the optional `<qa_report>` block.
2. It removes any text before the first H1 because the prompt requires the draft to start there.
3. It rejects an empty or suspiciously short corrected draft.
4. Otherwise it returns success.

Notice the gap: if there is no H1 at all, step 2 does nothing and step 4 can still return success.

Now find `OdinAgent.process_campaign` and the `review_draft` call. When Heimdall does not return `status == "success"`, Odin logs that the review was skipped and does not replace `draft_text`. That is the fail-open behavior you will preserve.

<!-- ------------------------ -->
## Write a failing regression test

Duration: 7

In `tests/test_heimdall_output.py`, add this test after the existing preamble test:

```python
def test_output_without_h1_is_rejected(monkeypatch):
    body = "A faithful paragraph about storage. " * 30
    stub_response(monkeypatch, f"{body}\n\n{REPORT}")

    result = review(make_heimdall())

    assert result.get("error") == "Review output did not start with an H1."
```

Run the focused tests again:

```bash
python -m pytest tests/test_heimdall_output.py -q
```

The new test should fail because the current implementation returns success. The repeated body is deliberate: it is longer than the existing sanity threshold, isolating the missing-H1 bug instead of triggering the short-output check.

<!-- ------------------------ -->
## Implement the contract guard

Duration: 7

In `HeimdallAgent.on_peer_request`, find the H1 preamble-cleanup block. After it strips any preamble, reject output that still does not begin with an H1:

```python
        if not _re.match(r"^# .+", corrected):
            self._logger.warning("Heimdall output did not start with an H1; keeping the original draft.")
            return {"error": "Review output did not start with an H1."}
```

Put the guard before the existing short-output sanity check. The existing H1 search has already removed a preamble when one was present; this guard handles the case where no H1 was returned at all.

Run the focused tests:

```bash
python -m pytest tests/test_heimdall_output.py -q
```

All four tests should pass. The new one verifies malformed output is rejected; the existing short-output test still verifies another fail-open condition.

<!-- ------------------------ -->
## Verify the wider suite

Duration: 5

Run the complete Odin unit suite:

```bash
python -m pytest -q
```

These tests mock model calls and exercise deterministic behavior. If a test fails, read the first failure carefully; do not add credentials or switch to a live model just to make this lab pass.

### Check your understanding

- What happens to the article if Heimdall returns the new error?
- Why is rejecting malformed output safer than accepting it as reviewed?
- Why does the test stub LiteLLM instead of calling Gemini?

Expected: Odin keeps Oscar's original draft; malformed output must not be mistaken for a successful review; a stub makes the regression test fast, deterministic, and credential-free.

<!-- ------------------------ -->
## Optional: observe the product workflow

Duration: 5

If the facilitator provides a workshop deployment, sign in and generate a draft from the supplied sample source. Observe the live agent stages, open the QA report, and review the result before approving it. Then create a LinkedIn post and find it in Social Library.

The UI activity is the product-level view of the same principle you just implemented: specialist agents can draft and review, but a human decides what advances. Do not publish workshop content externally.

<!-- ------------------------ -->
## Wrap up

Duration: 2

You added a guard around an AI agent's output contract, proved the bug with a regression test, and verified that an optional review failure preserves the original draft.

The pattern generalizes: treat model output as untrusted input, validate its shape at the boundary, and define a safe fallback before wiring it into a larger workflow.

### Further reading

- [Heimdall implementation](https://github.com/sangalo20/contentforge/blob/main/odin-agent/agents.py)
- [Heimdall tests](https://github.com/sangalo20/contentforge/blob/main/odin-agent/tests/test_heimdall_output.py)
- [Local project setup](https://github.com/sangalo20/contentforge/blob/main/contentforge/docs/setup.md)