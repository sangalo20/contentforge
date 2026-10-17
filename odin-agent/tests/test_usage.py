# Usage accounting: attribution context, the litellm success callback's
# provider/token/cost extraction, manual image records, and the per-request
# cost summary. Firestore writes are stubbed; everything else runs for real.
import asyncio
import types

import pytest

import usage
from obs import request_ctx


@pytest.fixture()
def captured(monkeypatch):
    """Stub the blocking Firestore write and capture records."""
    records = []
    monkeypatch.setattr(usage, "_write_record", records.append)
    return records


def run(coro):
    return asyncio.run(coro)


def _response(model="anthropic/claude-x", prompt_tokens=100, completion_tokens=50):
    return types.SimpleNamespace(
        model=model,
        usage=types.SimpleNamespace(prompt_tokens=prompt_tokens, completion_tokens=completion_tokens),
    )


def test_llm_callback_records_provider_tokens_and_context(captured):
    token = request_ctx.set({"uid": "u1", "workspaceId": "ws1", "itemId": "i1"})
    try:
        usage.set_agent("loki")
        run(usage._litellm_success(
            {"model": "anthropic/claude-x", "litellm_params": {}},
            _response(), None, None,
        ))
    finally:
        request_ctx.reset(token)

    assert len(captured) == 1
    r = captured[0]
    assert r["kind"] == "llm"
    assert r["provider"] == "anthropic"
    assert r["promptTokens"] == 100 and r["completionTokens"] == 50
    assert (r["agent"], r["uid"], r["workspaceId"], r["itemId"]) == ("loki", "u1", "ws1", "i1")


def test_vertex_provider_normalizes_to_google(captured):
    run(usage._litellm_success(
        {"model": "gemini-pro", "litellm_params": {"custom_llm_provider": "vertex_ai"}},
        _response(model="gemini-pro"), None, None,
    ))
    assert captured[0]["provider"] == "google"


def test_callback_failures_never_raise(captured):
    # A pathological response must not break generation (fire-and-forget).
    run(usage._litellm_success(None, None, None, None))


def test_image_records_flat_cost_and_skips_failures(captured):
    run(usage.record_image(ok=False, ms=100))
    assert captured == []
    run(usage.record_image(ok=True, ms=1200))
    assert len(captured) == 1
    assert captured[0]["kind"] == "image"
    assert captured[0]["provider"] == "google"
    assert captured[0]["costUsd"] == usage.IMAGE_COST_USD


def test_request_usage_summary_rolls_up_by_agent(captured):
    token = request_ctx.set({"uid": "u1"})
    try:
        assert usage.request_usage_summary() is None
        usage.set_agent("oscar")
        run(usage._litellm_success({"model": "anthropic/claude-x", "litellm_params": {}}, _response(), None, None))
        usage.set_agent("heimdall")
        run(usage._litellm_success({"model": "anthropic/claude-x", "litellm_params": {}}, _response(), None, None))
        summary = usage.request_usage_summary()
    finally:
        request_ctx.reset(token)

    assert summary["calls"] == 2
    assert set(summary["byAgent"]) == {"oscar", "heimdall"}
