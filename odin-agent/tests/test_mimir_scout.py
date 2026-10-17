# Mimir's scouting session: the digest framing (usage states, excerpts) in the
# system prompt, streamed text passthrough, proposal grounding (only digest
# ids survive; fabricated ids are rejected), and friendly errors. Stubbed
# litellm; no live API.
import asyncio
import json
import logging
import types

import agents


def make_mimir():
    m = agents.MimirAgent.__new__(agents.MimirAgent)
    m.system_prompt = "BASE PROMPT"
    m._logger = logging.getLogger("test-mimir")
    return m


DIGEST = [
    {"id": "v1", "title": "Day 019 - The Feasibility Study", "group": "Storage 100 — Section 2", "chars": 9000,
     "excerpt": "the gatekeeper of every great deal"},
    {"id": "v2", "title": "EP06 - the easiest place to look", "group": "Successful Idiots", "chars": 40000,
     "excerpt": "the middle of every industry", "usedElsewhere": ["“Issue 6” (Newsletter)"]},
    {"id": "v3", "title": "Day 002 - Busting Myths", "group": "Storage 100 — Section 1", "chars": 23000,
     "excerpt": "myth one", "usedHere": ["“The Three Lies” (Newsletter, 2026-05)"]},
]


def scout(monkeypatch, content_chunks=None, tool_args=None, capture=None,
          tool_name="propose_sources", tool_id=None, history=None,
          message="what should I make next?", memory=None):
    """Stub litellm streaming with optional text chunks and a terminal
    tool call; run a session and return the yielded events."""
    class _Stream:
        def __init__(self):
            self._events = []
            for c in (content_chunks or []):
                self._events.append(types.SimpleNamespace(choices=[types.SimpleNamespace(
                    delta=types.SimpleNamespace(content=c, tool_calls=None))]))
            if tool_args is not None:
                fn = types.SimpleNamespace(name=tool_name, arguments=json.dumps(tool_args))
                tc = types.SimpleNamespace(index=0, id=tool_id, function=fn)
                self._events.append(types.SimpleNamespace(choices=[types.SimpleNamespace(
                    delta=types.SimpleNamespace(content=None, tool_calls=[tc]))]))
            self._i = 0

        def __aiter__(self):
            return self

        async def __anext__(self):
            if self._i >= len(self._events):
                raise StopAsyncIteration
            e = self._events[self._i]
            self._i += 1
            return e

    async def fake(**kwargs):
        if capture is not None:
            capture.append(kwargs)
        return _Stream()

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    msg = agents.PeerMessage({
        "task": "vault_scout",
        "message": message,
        "workspace_name": "Storage 101",
        "persona_prompt": "PERSONA TEXT",
        "vault_digest": DIGEST,
        "recent_content": ["Last Week's Issue"],
        "memory": memory,
        "context": {"history": history or []},
    })

    async def collect():
        return [e async for e in make_mimir().stream_scout_chat(msg)]

    return asyncio.run(collect())


def test_system_prompt_carries_digest_usage_and_persona(monkeypatch):
    captured = []
    scout(monkeypatch, content_chunks=["hi"], capture=captured)
    system = captured[0]["messages"][0]["content"]
    assert "BASE PROMPT" in system
    assert "PERSONA TEXT" in system
    assert "Last Week's Issue" in system
    assert "id=v1" in system and "UNUSED" in system
    assert "unused here, used elsewhere" in system  # v2's caution flag
    assert "USED here" in system                     # v3
    assert "the gatekeeper of every great deal" in system  # excerpts included


def test_streams_text_and_grounded_proposal(monkeypatch):
    events = scout(
        monkeypatch,
        content_chunks=["Here's my pick."],
        tool_args={
            "picks": [
                {"vaultId": "v1", "title": "Day 019", "reason": "untouched section"},
                {"vaultId": "ghost", "title": "Fabricated", "reason": "should be dropped"},
            ],
            "angle": "the gatekeeper deal",
            "workingTitle": "The Study That Saves You",
        },
    )
    assert {"type": "text", "content": "Here's my pick."} in events
    proposals = [e for e in events if e["type"] == "proposal"]
    assert len(proposals) == 1
    assert [p["vaultId"] for p in proposals[0]["content"]["picks"]] == ["v1"]  # ghost dropped
    assert proposals[0]["content"]["workingTitle"] == "The Study That Saves You"


def test_fully_fabricated_proposal_is_rejected(monkeypatch):
    events = scout(monkeypatch, tool_args={
        "picks": [{"vaultId": "ghost", "title": "x", "reason": "y"}],
        "angle": "a", "workingTitle": "b",
    })
    errors = [e for e in events if e["type"] == "error"]
    assert len(errors) == 1
    assert "not in the vault" in errors[0]["content"]


def test_provider_errors_are_human_readable(monkeypatch):
    async def boom(**kwargs):
        raise RuntimeError("litellm.InternalServerError: Overloaded")
    monkeypatch.setattr(agents.litellm, "acompletion", boom)
    msg = agents.PeerMessage({"task": "vault_scout", "message": "hi", "vault_digest": []})

    async def collect():
        return [e async for e in make_mimir().stream_scout_chat(msg)]

    events = asyncio.run(collect())
    assert events[-1]["type"] == "error"
    assert "litellm" not in events[-1]["content"]


def test_memory_block_lands_in_the_system_prompt(monkeypatch):
    captured = []
    scout(monkeypatch, content_chunks=["hi"], capture=captured,
          memory="- Prefers concrete numbers in titles")
    system = captured[0]["messages"][0]["content"]
    assert "REMEMBERED FROM PAST SESSIONS" in system
    assert "concrete numbers in titles" in system

    captured.clear()
    scout(monkeypatch, content_chunks=["hi"], capture=captured)  # no memory
    assert "REMEMBERED FROM PAST SESSIONS" not in captured[0]["messages"][0]["content"]


def test_read_transcript_yields_grounded_tool_call(monkeypatch):
    events = scout(monkeypatch, content_chunks=["Let me check that one."],
                   tool_name="read_transcript", tool_id="call_abc",
                   tool_args={"vaultId": "v2"})
    calls = [e for e in events if e["type"] == "tool_call"]
    assert calls == [{"type": "tool_call", "content": {"id": "call_abc", "name": "read_transcript", "vaultId": "v2"}}]


def test_read_transcript_of_fabricated_id_is_rejected(monkeypatch):
    events = scout(monkeypatch, tool_name="read_transcript", tool_args={"vaultId": "ghost"})
    assert [e for e in events if e["type"] == "tool_call"] == []
    errors = [e for e in events if e["type"] == "error"]
    assert len(errors) == 1 and "not in the vault" in errors[0]["content"]


def test_search_memory_yields_tool_call(monkeypatch):
    events = scout(monkeypatch, tool_name="search_memory", tool_id="call_m9",
                   tool_args={"query": "what did we decide about titles"})
    calls = [e for e in events if e["type"] == "tool_call"]
    assert calls == [{"type": "tool_call", "content": {
        "id": "call_m9", "name": "search_memory", "query": "what did we decide about titles"}}]


def test_tool_round_trip_history_passes_through(monkeypatch):
    captured = []
    scout(monkeypatch, content_chunks=["Read it — here's the verdict."], capture=captured,
          message="",  # tool continuation: no fresh user turn
          history=[
              {"role": "user", "content": "what's in EP06 really?"},
              {"role": "assistant", "content": "", "tool_calls": [
                  {"id": "call_abc", "type": "function",
                   "function": {"name": "read_transcript", "arguments": '{"vaultId": "v2"}'}}]},
              {"role": "tool", "tool_call_id": "call_abc", "content": "FULL TRANSCRIPT SLICE"},
          ])
    messages = captured[0]["messages"]
    assert messages[-1]["role"] == "tool"                      # no empty user turn appended
    assert messages[-1]["tool_call_id"] == "call_abc"
    assert messages[-1]["content"] == "FULL TRANSCRIPT SLICE"
    assert messages[-2]["tool_calls"][0]["id"] == "call_abc"
    assert "read_transcript" in str(captured[0]["tools"])       # the tool is offered


def test_summarize_entries_validates_ids_and_shapes(monkeypatch):
    async def fake(**kwargs):
        content = (
            "id: v1\n"
            'gist: Feasibility studies gate every deal — "go or no-go" in 30 days.\n'
            "It wraps to a second line.\n"
            "topics: feasibility, due diligence\n"
            "\n"
            "id: ghost\n"
            "gist: fabricated entry that must be dropped\n"
            "topics: junk\n"
            "\n"
            "id: v2\n"
            "gist:\n"  # empty gist → dropped
            "topics: nothing"
        )
        message = types.SimpleNamespace(content=content)
        return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])
    monkeypatch.setattr(agents.litellm, "acompletion", fake)

    out = asyncio.run(make_mimir().summarize_entries([
        {"id": "v1", "title": "Day 019", "text": "x" * 6000},
        {"id": "v2", "title": "Day 020", "text": "y" * 6000},
    ]))
    assert out == [{
        "id": "v1",
        "gist": 'Feasibility studies gate every deal — "go or no-go" in 30 days. It wraps to a second line.',
        "topics": ["feasibility", "due diligence"],
    }]
