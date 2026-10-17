# Heimdall's output handling: the corrected draft must start at its H1 — any
# narrated preamble ("I'll review this draft for fidelity...") is stripped
# deterministically, the qa_report is extracted, and the too-short sanity
# guard still fails open. Stubbed litellm; no live API.
import asyncio
import logging
import types

import agents


def make_heimdall():
    hm = agents.HeimdallAgent.__new__(agents.HeimdallAgent)
    hm.system_prompt = "BASE PROMPT"
    hm._logger = logging.getLogger("test-heimdall")
    return hm


def stub_response(monkeypatch, content):
    async def fake(**kwargs):
        message = types.SimpleNamespace(content=content)
        return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])
    monkeypatch.setattr(agents.litellm, "acompletion", fake)


DRAFT = "# The Title\n\n" + ("A faithful paragraph about storage. " * 30)
REPORT = "<qa_report>\n- Fixed 2 typos\n</qa_report>"


def review(hm, draft=DRAFT):
    msg = agents.PeerMessage({"task": "review_draft", "draft": draft, "transcript": "the transcript"})
    return asyncio.run(hm.on_peer_request(msg))


def test_clean_output_passes_through(monkeypatch):
    stub_response(monkeypatch, f"{DRAFT}\n\n{REPORT}")
    result = review(make_heimdall())
    assert result["status"] == "success"
    assert result["draft"].startswith("# The Title")
    assert result["qa_report"] == "- Fixed 2 typos"


def test_narrated_preamble_is_stripped(monkeypatch):
    preamble = (
        "I'll review this draft against the transcript for fidelity, then "
        "check tone, mechanics, and AI patterns.\n\nKey fidelity concern: the "
        "draft adds claims the transcript never makes. I need to soften them.\n\n"
    )
    stub_response(monkeypatch, f"{preamble}{DRAFT}\n\n{REPORT}")
    result = review(make_heimdall())
    assert result["status"] == "success"
    assert result["draft"].startswith("# The Title")
    assert "I'll review" not in result["draft"]
    assert "fidelity concern" not in result["draft"]


def test_too_short_output_still_fails_open(monkeypatch):
    stub_response(monkeypatch, f"# Stub\n\ntiny\n\n{REPORT}")
    result = review(make_heimdall())
    assert "error" in result  # caller keeps the original draft
