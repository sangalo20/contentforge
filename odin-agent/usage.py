"""AI usage & cost tracking.

Every litellm call (all Gemini agents) fires one usage record via litellm's
async success callback — no per-call-site instrumentation. Hermes (Vertex
image REST, not litellm) records manually via
record_image(). Records go to the Firestore collection `content_pipeline_usage`
(fire-and-forget; tracking must never break generation) and are mirrored as
`llm.usage` log events.

Attribution rides on obs.request_ctx: the middleware seeds uid / workspaceId /
itemId from forwarded headers, agents stamp their name via set_agent(), and a
per-request accumulator lets Odin return a cost summary with each campaign.

Costs are ESTIMATES from litellm's price tables — reconcile against provider
invoices; the point is relative attribution (which workspace/agent/model),
not accounting truth.
"""

import asyncio
import contextvars
import datetime
import logging
import os

import litellm

from obs import event as obs_event, request_ctx

logger = logging.getLogger("usage")

# The acting agent, as an immutable contextvar VALUE (not a mutation of the
# shared request dict): litellm fires success callbacks as background tasks,
# which snapshot the context at creation — so the value the callback sees is
# frozen at call time even if another agent runs before the callback does.
current_agent = contextvars.ContextVar("current_agent", default=None)

USAGE_COLLECTION = "content_pipeline_usage"
# Image generation is flat-priced per image; estimate, set IMAGE_COST_USD to your rate card.
IMAGE_COST_USD = float(os.getenv("IMAGE_COST_USD", "0.134"))

_db = None


def _firestore():
    global _db
    if _db is None:
        from google.cloud import firestore
        _db = firestore.Client(project=os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID") or None)
    return _db


def _write_record(record: dict):
    """Blocking Firestore write — call via asyncio.to_thread."""
    _firestore().collection(USAGE_COLLECTION).add(record)


def set_agent(name: str):
    """Agents stamp the context so usage is attributed to them."""
    current_agent.set(name)


def _context_fields():
    ctx = request_ctx.get() or {}
    return {
        "agent": current_agent.get(),
        "uid": ctx.get("uid"),
        "workspaceId": ctx.get("workspaceId"),
        "itemId": ctx.get("itemId"),
    }


def _accumulate(ctx_usage_key: str, record: dict):
    """Append to the per-request accumulator (used for campaign cost summaries)."""
    ctx = request_ctx.get()
    if ctx is not None:
        ctx.setdefault(ctx_usage_key, []).append(record)


async def _record(record: dict):
    record["ts"] = datetime.datetime.now(datetime.timezone.utc)
    obs_event("llm.usage", **{k: v for k, v in record.items() if k != "ts"})
    _accumulate("usage", record)
    try:
        await asyncio.to_thread(_write_record, dict(record))
    except Exception as e:
        logger.warning(f"Usage record not persisted (continuing): {e}")


async def _litellm_success(kwargs, completion_response, start_time, end_time):
    """litellm async success callback — fires once per completed acompletion."""
    try:
        # Streaming calls surface the assembled response separately.
        response = kwargs.get("async_complete_streaming_response") or completion_response
        model = kwargs.get("model") or getattr(response, "model", None) or "unknown"
        # litellm resolves the provider explicitly; fall back to the model prefix.
        provider = (kwargs.get("litellm_params") or {}).get("custom_llm_provider") \
            or (model.split("/")[0] if "/" in model else None) \
            or ("google" if model.startswith("gemini") else "anthropic")
        if provider == "vertex_ai":
            provider = "google"

        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", None) if usage else None
        completion_tokens = getattr(usage, "completion_tokens", None) if usage else None

        cost = None
        try:
            cost = litellm.completion_cost(completion_response=response)
        except Exception:
            pass

        ms = None
        try:
            ms = int((end_time - start_time).total_seconds() * 1000)
        except Exception:
            pass

        await _record({
            "kind": "llm",
            "provider": provider,
            "model": model,
            "promptTokens": prompt_tokens,
            "completionTokens": completion_tokens,
            "costUsd": round(cost, 6) if cost is not None else None,
            "ms": ms,
            **_context_fields(),
        })
    except Exception as e:
        logger.warning(f"Usage callback failed (continuing): {e}")


async def record_image(ok: bool, ms: int):
    """Hermes image generation (Vertex AI REST, outside litellm)."""
    if not ok:
        return
    await _record({
        "kind": "image",
        "provider": "google",
        "model": os.getenv("IMAGE_MODEL", "gemini-3-pro-image"),
        "promptTokens": None,
        "completionTokens": None,
        "costUsd": IMAGE_COST_USD,
        "ms": ms,
        **_context_fields(),
    })


def request_usage_summary():
    """Cost summary for the current request (Odin returns it with campaigns)."""
    ctx = request_ctx.get() or {}
    records = ctx.get("usage") or []
    if not records:
        return None
    by_agent = {}
    total = 0.0
    for r in records:
        cost = r.get("costUsd") or 0.0
        total += cost
        agent = r.get("agent") or "unknown"
        by_agent[agent] = round(by_agent.get(agent, 0.0) + cost, 6)
    return {"totalUsd": round(total, 6), "byAgent": by_agent, "calls": len(records)}


def init_usage_tracking():
    """Register the litellm callback. Call once at startup."""
    if _litellm_success not in litellm._async_success_callback:
        try:
            litellm.logging_callback_manager.add_litellm_async_success_callback(_litellm_success)
        except Exception:
            litellm._async_success_callback.append(_litellm_success)
    logger.info("AI usage tracking initialized.")
