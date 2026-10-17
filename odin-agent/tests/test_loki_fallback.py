# Loki's model failover: when the primary model errors — even mid-stream — Loki
# retries once on the fallback model, and a raw provider exception never reaches
# the user-facing event stream (it goes to the logs instead). No live API.
import asyncio
import json
import logging
import types

import agents


def make_loki():
    loki = agents.LokiAgent.__new__(agents.LokiAgent)
    loki.system_prompt = "BASE PROMPT"
    loki._logger = logging.getLogger("test-loki")
    return loki


TEXT_COPY = json.dumps({"channel": "linkedin", "post": "the post", "cta": "the cta"})


def _response(content):
    message = types.SimpleNamespace(content=content)
    return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])


def _text_chunk(text):
    delta = types.SimpleNamespace(content=text, tool_calls=None)
    return types.SimpleNamespace(choices=[types.SimpleNamespace(delta=delta)])


class _Stream:
    """Async chunk iterator; optionally dies mid-stream like a provider 529."""

    def __init__(self, chunks, fail_after=None):
        self._chunks = list(chunks)
        self._fail_after = fail_after
        self._i = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._fail_after is not None and self._i >= self._fail_after:
            raise RuntimeError("litellm.InternalServerError: AnthropicError - Overloaded")
        if self._i >= len(self._chunks):
            raise StopAsyncIteration
        chunk = self._chunks[self._i]
        self._i += 1
        return chunk


def _pin_models(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("LOKI_MODEL", "gemini-3.8-flash")
    monkeypatch.setenv("LOKI_FALLBACK_MODEL", "gemini-3.1-pro-preview")


PRIMARY = "vertex_ai/gemini-3.8-flash"
FALLBACK = "vertex_ai/gemini-3.1-pro-preview"


# --- Model resolution ---------------------------------------------------------

def test_fallback_model_env_override_and_gemini_default(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("LOKI_FALLBACK_MODEL", "gemini-3.5-flash")
    assert agents._loki_fallback_model_str() == "vertex_ai/gemini-3.5-flash"

    monkeypatch.delenv("LOKI_FALLBACK_MODEL")
    monkeypatch.delenv("GEMINI_LITELLM_MODEL", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.1-pro")
    assert agents._loki_fallback_model_str() == "gemini/gemini-3.1-pro"


# --- Non-streaming generation ---------------------------------------------------

def test_generate_falls_back_when_primary_fails(monkeypatch):
    _pin_models(monkeypatch)
    calls = []

    async def fake(**kwargs):
        calls.append(kwargs)
        if kwargs["model"] == PRIMARY:
            raise RuntimeError("AnthropicError - Overloaded")
        return _response(TEXT_COPY)

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    result = asyncio.run(make_loki().on_peer_request(agents.PeerMessage(
        {"task": "generate_social_copy", "draft": "SOURCE", "channel": "linkedin"})))

    assert result["status"] == "success"
    assert [c["model"] for c in calls] == [PRIMARY, FALLBACK]
    # litellm-level retries stay on for both attempts.
    assert all(c["num_retries"] == 2 for c in calls)


def test_generate_error_is_human_readable_when_both_fail(monkeypatch):
    _pin_models(monkeypatch)

    async def fake(**kwargs):
        raise RuntimeError("litellm.InternalServerError: AnthropicError - Overloaded")

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    result = asyncio.run(make_loki().on_peer_request(agents.PeerMessage(
        {"task": "generate_social_copy", "draft": "SOURCE", "channel": "linkedin"})))

    assert "litellm" not in result["error"]
    assert "overloaded" in result["error"].lower()


# --- Studio stream ---------------------------------------------------------------

def studio_events(monkeypatch, fake):
    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    msg = agents.PeerMessage({
        "task": "studio_chat",
        "kind": "text",
        "channel": "linkedin",
        "content": {"post": "current draft", "cta": None},
        "draft": "SOURCE",
        "message": "make it punchier",
    })

    async def collect():
        return [e async for e in make_loki().stream_studio_chat(msg)]

    return asyncio.run(collect())


def test_studio_stream_fails_over_mid_stream(monkeypatch):
    _pin_models(monkeypatch)

    async def fake(**kwargs):
        if kwargs["model"] == PRIMARY:
            return _Stream([_text_chunk("half a re")], fail_after=1)
        return _Stream([_text_chunk("full reply")])

    events = studio_events(monkeypatch, fake)
    kinds = [e["type"] for e in events]

    # The half-streamed primary text is wiped by a reset, then the fallback
    # answers from scratch — and no error reaches the reviewer.
    assert "reset" in kinds
    reset_at = kinds.index("reset")
    assert {"type": "text", "content": "half a re"} in events[:reset_at]
    assert {"type": "text", "content": "full reply"} in events[reset_at:]
    assert "error" not in kinds


def test_studio_stream_error_is_human_readable_when_both_fail(monkeypatch):
    _pin_models(monkeypatch)

    async def fake(**kwargs):
        raise RuntimeError("litellm.MidStreamFallbackError: AnthropicError - Overloaded")

    events = studio_events(monkeypatch, fake)
    errors = [e for e in events if e["type"] == "error"]

    assert len(errors) == 1
    assert "litellm" not in errors[0]["content"]
    assert "overloaded" in errors[0]["content"].lower()
