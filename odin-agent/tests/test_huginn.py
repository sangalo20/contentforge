# Huginn's citation research: plan parsing (line format), verify-then-link
# gating, deterministic span replacement (unique spans only, never headings),
# internal-link grounding to the candidate list, and graceful behavior with
# no search key. Stubbed litellm and search; no live network.
import asyncio
import logging
import types

import agents


DRAFT = """# The Feasibility Study

Feasibility studies gate every great deal. Industry data shows the average
self storage facility costs about $45 per square foot to build.

Seller financing works best when the owner is retiring."""

INTERNAL = [
    {"title": "How to Package Your Loan Application", "url": "https://joedowns.ai/operator-lessons/loan-application"},
]


def make_huginn():
    h = agents.HuginnAgent.__new__(agents.HuginnAgent)
    h.system_prompt = "BASE PROMPT"
    h._logger = logging.getLogger("test-huginn")
    return h


class FakeSearch:
    """results: list of (url, content) candidates walked in order."""

    def __init__(self, url="https://www.selfstorage.org/report", content="x" * 300,
                 raise_exc=False, results=None):
        self.results = results if results is not None else [(url, content)]
        self.raise_exc = raise_exc
        self.queries = []

    async def search(self, query, max_results=10, **kw):
        self.queries.append(query)
        if self.raise_exc:
            raise RuntimeError("search boom")
        return [{"url": u} for u, _ in self.results]

    async def extract_content(self, url):
        for u, content in self.results:
            if u == url:
                return {"content": content}
        return {"content": ""}


def run_huginn(monkeypatch, plan_text, verify_answers=("true",), search=None, internal=None, draft=DRAFT):
    """Stub the two LLM roles (plan, then verify) and the search client."""
    answers = list(verify_answers)
    calls = {"n": 0}

    async def fake(**kwargs):
        calls["n"] += 1
        content = plan_text if calls["n"] == 1 else (answers.pop(0) if answers else "false")
        message = types.SimpleNamespace(content=content)
        return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    h = make_huginn()
    monkeypatch.setattr(h, "_search", lambda: search)

    # Bypass trafilatura (real network) — route extraction through the fake.
    async def fake_extract(s, url):
        extracted = await s.extract_content(url)
        return (extracted or {}).get("content") or ""
    monkeypatch.setattr(h, "_extract", fake_extract)
    msg = agents.PeerMessage({
        "task": "enrich_citations",
        "draft": draft,
        "internal_links": INTERNAL if internal is None else internal,
    })
    return asyncio.run(h.on_peer_request(msg))


def test_verified_citation_and_grounded_internal_link_are_woven_in(monkeypatch):
    search = FakeSearch()
    out = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: average self storage construction cost per square foot\n"
        "INTERNAL: Seller financing works best | URL: https://joedowns.ai/operator-lessons/loan-application\n"
        "INTERNAL: ghost span | URL: https://evil.example/not-in-list\n",
        verify_answers=("true",),
        search=search,
    )
    assert "[$45 per square foot](https://www.selfstorage.org/report)" in out["draft"]
    assert "[Seller financing works best](https://joedowns.ai/operator-lessons/loan-application)" in out["draft"]
    assert "evil.example" not in out["draft"]  # non-candidate URL dropped
    assert len(out["citations"]) == 1 and len(out["internal"]) == 1


def test_unverified_source_is_dropped(monkeypatch):
    out = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: construction cost\n",
        verify_answers=("false",),
        search=FakeSearch(),
    )
    assert "](https://" not in out["draft"]
    assert out["citations"] == []


def test_blocked_domains_and_thin_pages_are_skipped(monkeypatch):
    out = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: cost\n",
        search=FakeSearch(url="https://www.reddit.com/r/selfstorage/x"),
    )
    assert out["citations"] == []
    out2 = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: cost\n",
        search=FakeSearch(content="tiny"),
    )
    assert out2["citations"] == []


def test_no_search_key_still_places_internal_links(monkeypatch):
    out = run_huginn(
        monkeypatch,
        "INTERNAL: Seller financing works best | URL: https://joedowns.ai/operator-lessons/loan-application\n",
        search=None,
    )
    assert "[Seller financing works best]" in out["draft"]
    assert out["citations"] == []


def test_search_failure_fails_open(monkeypatch):
    out = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: cost\n",
        search=FakeSearch(raise_exc=True),
    )
    assert out["status"] == "success"
    assert out["citations"] == []
    assert "$45 per square foot" in out["draft"]  # untouched


def test_falls_through_bad_candidates_to_a_good_one(monkeypatch):
    search = FakeSearch(results=[
        ("https://www.reddit.com/r/selfstorage/x", "y" * 400),      # blocked
        ("https://thin.example/page", "tiny"),                       # thin
        ("https://www.selfstorage.org/report", "z" * 400),          # verified
    ])
    out = run_huginn(
        monkeypatch,
        "CLAIM: $45 per square foot | QUERY: construction cost\n",
        verify_answers=("true",),
        search=search,
    )
    assert out["citations"] == [{"span": "$45 per square foot", "url": "https://www.selfstorage.org/report"}]
    assert "[$45 per square foot](https://www.selfstorage.org/report)" in out["draft"]


def test_span_rules_headings_and_ambiguity(monkeypatch):
    h = make_huginn()
    # A span inside a heading is never linked.
    assert h._place_link("# The Feasibility Study\nbody", "Feasibility Study", "https://x.example") is None
    # A span appearing twice is ambiguous — skipped.
    assert h._place_link("deal one. deal one.", "deal one", "https://x.example") is None
    # A unique body span links cleanly.
    placed = h._place_link("Storage demand keeps growing fast.", "demand keeps growing", "https://x.example")
    assert placed == "Storage [demand keeps growing](https://x.example) fast."
