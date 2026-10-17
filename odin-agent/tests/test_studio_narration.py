# Studio stage narration: a revision turn streams back as one big
# apply_content_updates tool call, so Loki must narrate while the arguments
# accumulate — announce the rework once, then tick per slide/post — or the
# reviewer stares at a stale spinner until the canvas updates. No live API.
import asyncio
import logging
import types

import agents


def make_loki():
    loki = agents.LokiAgent.__new__(agents.LokiAgent)
    loki.system_prompt = "BASE PROMPT"
    loki._logger = logging.getLogger("test-loki")
    return loki


def _tool_chunk(name=None, args="", idx=0):
    fn = types.SimpleNamespace(name=name, arguments=args)
    tc = types.SimpleNamespace(index=idx, id=None, function=fn)
    delta = types.SimpleNamespace(content=None, tool_calls=[tc])
    return types.SimpleNamespace(choices=[types.SimpleNamespace(delta=delta)])


class _Stream:
    def __init__(self, chunks):
        self._chunks = list(chunks)

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not self._chunks:
            raise StopAsyncIteration
        return self._chunks.pop(0)


def _events(monkeypatch, msg_data, chunks):
    monkeypatch.setenv("LOKI_MODEL", "claude-sonnet-5")
    monkeypatch.setenv("LOKI_FALLBACK_MODEL", "gemini/gemini-3.1-pro")

    async def fake(**kwargs):
        return _Stream(chunks)

    monkeypatch.setattr(agents.litellm, "acompletion", fake)

    async def collect():
        return [e async for e in make_loki().stream_studio_chat(agents.PeerMessage(msg_data))]

    return asyncio.run(collect())


def test_carousel_revision_narrates_rework_and_slide_ticks(monkeypatch):
    events = _events(monkeypatch, {
        "task": "studio_chat",
        "kind": "carousel",
        "channel": "linkedin",
        "content": {"slides": [
            {"kind": "hook", "heading": "A", "body": "a"},
            {"kind": "cta", "heading": "B", "body": "b"},
        ], "cta": "x"},
        "draft": "SOURCE",
        "message": "punchier",
    }, [
        _tool_chunk(name="apply_content_updates", args='{"slides": [{"kind": "hook", "heading": "H1", "body": "B1"}'),
        _tool_chunk(args=', {"kind": "point", "heading": "H2", "body": "B2"}'),
        _tool_chunk(args='], "cta": "Follow along"}'),
    ])

    statuses = [e["content"] for e in events if e["type"] == "status"]
    assert statuses[0] == "Odin → Loki: reworking the carousel..."
    assert "Odin → Loki: writing slide 1 of ~2..." in statuses
    assert "Odin → Loki: writing slide 2 of ~2..." in statuses

    # Narration precedes the canvas update, and the update still lands intact.
    contents = [e for e in events if e["type"] == "content"]
    assert len(contents) == 1
    assert [s["heading"] for s in contents[0]["content"]["slides"]] == ["H1", "H2"]
    assert events.index(contents[0]) > max(i for i, e in enumerate(events) if e["type"] == "status")


def test_x_thread_revision_ticks_per_post(monkeypatch):
    events = _events(monkeypatch, {
        "task": "studio_chat",
        "kind": "text",
        "channel": "x",
        "content": {"thread": ["one", "two", "three"], "cta": None},
        "draft": "SOURCE",
        "message": "tighter",
    }, [
        _tool_chunk(name="apply_content_updates", args='{"thread": ["post one",'),
        _tool_chunk(args=' "post two",'),
        _tool_chunk(args=' "post three"], "cta": "follow"}'),
    ])

    statuses = [e["content"] for e in events if e["type"] == "status"]
    assert statuses[0] == "Odin → Loki: reworking the post..."
    assert "Odin → Loki: writing post 1 of ~3..." in statuses
    assert "Odin → Loki: writing post 2 of ~3..." in statuses
    assert [e for e in events if e["type"] == "content"]


def test_single_post_gets_one_stage_line_without_ticks(monkeypatch):
    events = _events(monkeypatch, {
        "task": "studio_chat",
        "kind": "text",
        "channel": "linkedin",
        "content": {"post": "current draft", "cta": None},
        "draft": "SOURCE",
        "message": "punchier",
    }, [
        _tool_chunk(name="apply_content_updates", args='{"post": "revised '),
        _tool_chunk(args='draft", "cta": "follow"}'),
    ])

    statuses = [e["content"] for e in events if e["type"] == "status"]
    assert statuses == ["Odin → Loki: reworking the post..."]
