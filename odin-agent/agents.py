import asyncio
import os
import re
import time
from typing import Any
import requests
from jarviscore.profiles import CustomAgent, AutoAgent
from obs import event as obs_event
from usage import set_agent as usage_set_agent, record_image as usage_record_image, request_usage_summary
import litellm

# Calls that don't pass vertex_project/vertex_location explicitly (Loki, Heimdall) use these.
litellm.vertex_project = os.getenv("GOOGLE_CLOUD_PROJECT") or None
litellm.vertex_location = os.getenv("VERTEX_LOCATION", "global")


# Model config is resolved at REQUEST time (not import) so an env change takes
# effect without a service restart. litellm routes by provider prefix, so bare
# model names get the Gemini prefix (vertex_ai/ on ADC, gemini/ with an API key).
def _route(m: str) -> str:
    return m if "/" in m else f"{_gemini_litellm_prefix()}{m}"


# Fast tier for high-volume agents (Loki, Huginn, Mimir).
def _gemini_flash_model() -> str:
    return _route(os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash"))


# Loki's generation model. Configurable via LOKI_MODEL; defaults to Gemini Flash.
def _loki_model_str() -> str:
    m = os.getenv("LOKI_MODEL", "")
    return _route(m) if m else _gemini_flash_model()


def _search_memory_tool() -> dict:
    """Deliberate recall from Athena, offered to every conversational agent.
    The agent emits the call; ContentForge executes it (tenancy enforced
    server-side) and calls back with the results in history."""
    return {
        "type": "function",
        "function": {
            "name": "search_memory",
            "description": (
                "Search Odin's long-term memory of past sessions in this workspace. "
                "Use when the operator references a prior decision, preference, or "
                "conversation that is not in your remembered context."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "What to look for, phrased as a search query"},
                },
                "required": ["query"],
            },
        },
    }


def _memory_block(msg) -> str:
    """Format the backend-supplied Athena recall (long-term memory of past
    sessions) into a system-prompt section. Empty string when there is
    nothing to remember — prompts stay unchanged for memory-less calls."""
    memory = (msg.data.get("memory") or "").strip()
    if not memory:
        return ""
    return (
        "\n\n[REMEMBERED FROM PAST SESSIONS]\n"
        f"{memory[:2000]}\n"
        "Honor these preferences and facts unless the operator overrides them now."
    )


def _extract_json(text: str) -> dict:
    """Robustly pull a JSON object out of an LLM response. Claude may wrap JSON in
    code fences or add prose, so strip fences then grab the first {...} block."""
    import json as _json
    import re as _re
    t = (text or "").strip()
    fence = _re.search(r"```(?:json)?\s*\n?(.*?)```", t, _re.DOTALL)
    if fence:
        t = fence.group(1).strip()
    obj = _re.search(r"\{.*\}", t, _re.DOTALL)
    if obj:
        t = obj.group(0)
    return _json.loads(t)


# Default model identifiers. Override via environment variables so model
# upgrades never require a code change; resolved per call (see note above).
def _gemini_model() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")


# LiteLLM needs a provider-prefixed model id. On GCP we use Vertex AI via ADC
# ("vertex_ai/"); locally, if a GEMINI_API_KEY is set we use Google AI Studio
# ("gemini/").
def _gemini_litellm_prefix() -> str:
    return "gemini/" if os.getenv("GEMINI_API_KEY") else "vertex_ai/"


def _gemini_litellm_model() -> str:
    return os.getenv("GEMINI_LITELLM_MODEL", f"{_gemini_litellm_prefix()}{_gemini_model()}")


# Loki's fallback model, tried once when the primary still fails after
# litellm's own retries. Configurable via LOKI_FALLBACK_MODEL; defaults to
# Gemini Pro, so a Flash outage fails over to a different model tier.
def _loki_fallback_model_str() -> str:
    m = os.getenv("LOKI_FALLBACK_MODEL", "")
    return _route(m) if m else _gemini_litellm_model()


# A studio revision streams back as one apply_content_updates call, so almost
# the whole turn is tool-call argument tokens the reviewer never sees. These
# count the units already visible in the partial JSON so the stream can tick
# progress: carousel slides are underway once their "body" key lands, X-thread
# posts are complete at their closing '",'. Posters and single posts return 0 —
# they get one stage line, not ticks. Escaped quotes are excluded; this is a
# progress hint, not a parser.
_STUDIO_SLIDE_KEY = re.compile(r'(?<!\\)"body"')
_STUDIO_POST_END = re.compile(r'(?<!\\)",')


def _studio_units_done(kind: str, channel: str, partial_args: str) -> int:
    if kind == "carousel":
        return len(_STUDIO_SLIDE_KEY.findall(partial_args))
    if kind == "text" and channel == "x":
        return len(_STUDIO_POST_END.findall(partial_args))
    return 0


# Provider errors read like stack traces (a raw litellm exception once leaked
# straight into the studio chat). User-facing surfaces get this mapping; the
# raw exception goes to the logs only.
def _friendly_llm_error(e: Exception) -> str:
    s = f"{type(e).__name__}: {e}"
    if any(k in s for k in ("Overloaded", "InternalServerError", "MidStreamFallback",
                            "ServiceUnavailable", "APIConnectionError")):
        return "The AI service is briefly overloaded. Please send that again in a moment."
    if "RateLimit" in s or "Too Many Requests" in s:
        return "The AI service is rate-limiting us. Please try again in a minute or two."
    if "Timeout" in s or "timed out" in s:
        return "The request timed out. Please send that again."
    return "Something went wrong while generating. Please try again."


# Failover is deliberately loud — a WARNING plus an `llm.fallback` obs event —
# so a prod switch to the backup model is always visible, never silent.
def _log_llm_fallback(logger, task: str, primary: str, fallback: str, error: Exception):
    logger.warning(
        f"Loki {task}: primary model {primary} failed after retries ({error}); "
        f"falling back to {fallback}"
    )
    obs_event(
        "llm.fallback",
        agent="loki",
        task=task,
        primary=primary,
        fallback=fallback,
        error=str(error)[:300],
    )


async def _loki_acompletion(logger, task: str, **kwargs):
    """litellm.acompletion with retries on the primary model, then one attempt
    on the fallback model (non-streaming paths; the studio stream has its own
    loop because a stream can die mid-iteration, after acompletion returned)."""
    primary = kwargs.pop("model")
    fallback = _loki_fallback_model_str()
    try:
        return await litellm.acompletion(model=primary, num_retries=2, **kwargs)
    except Exception as e:
        _log_llm_fallback(logger, task, primary, fallback, e)
        response = await litellm.acompletion(model=fallback, num_retries=2, **kwargs)
        logger.info(f"Loki {task}: fallback model {fallback} succeeded")
        return response

class PeerMessage:
    """Lightweight wrapper for inter-agent mesh communication."""
    def __init__(self, data):
        self.data = data

class HermesAgent(CustomAgent):
    role = "designer"
    capabilities = ["image_generation"]

    # Nano Banana Pro on Vertex AI, resolved per call.
    @property
    def image_model(self) -> str:
        return os.getenv("IMAGE_MODEL", "gemini-3-pro-image")

    def _vertex_image_request(self, prompt: str) -> requests.Response:
        import google.auth
        import google.auth.transport.requests

        creds, adc_project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        creds.refresh(google.auth.transport.requests.Request())
        project = os.getenv("GOOGLE_CLOUD_PROJECT") or adc_project
        location = os.getenv("VERTEX_LOCATION", "global")
        host = "aiplatform.googleapis.com" if location == "global" else f"{location}-aiplatform.googleapis.com"
        url = (
            f"https://{host}/v1/projects/{project}/locations/{location}"
            f"/publishers/google/models/{self.image_model}:generateContent"
        )
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseModalities": ["IMAGE"],
                "imageConfig": {"aspectRatio": "16:9"},
            },
        }
        return requests.post(
            url, headers={"Authorization": f"Bearer {creds.token}"}, json=body, timeout=120
        )

    async def generate_image(self, prompt: str) -> dict:
        """Generate a cover with Nano Banana Pro; returns the image as a data URL."""
        try:
            self._logger.info(f"Calling {self.image_model} for prompt: {prompt}")
            started = time.monotonic()
            # Image generation takes 10-30s; keep it off the event loop.
            response = await asyncio.to_thread(self._vertex_image_request, prompt)
            image_ms = int((time.monotonic() - started) * 1000)
            obs_event("hermes.image", ok=response.ok, status=response.status_code, ms=image_ms)
            await usage_record_image(response.ok, image_ms)
            if not response.ok:
                detail = response.text
                try:
                    detail = response.json().get("error", {}).get("message", detail)
                except Exception:
                    pass
                self._logger.error(f"Vertex image API {response.status_code}: {detail}")
                return {"error": f"{response.status_code} from Vertex AI: {detail}"}

            for candidate in response.json().get("candidates", []):
                for part in candidate.get("content", {}).get("parts", []):
                    inline = part.get("inlineData")
                    if inline and inline.get("data"):
                        mime = inline.get("mimeType", "image/png")
                        return {"status": "success", "url": f"data:{mime};base64,{inline['data']}"}
            return {"error": "The image model returned no image (it may have been blocked by safety filters)."}
        except Exception as e:
            self._logger.error(f"Hermes image error: {e}")
            return {"error": str(e)}

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("hermes")
        task = msg.data.get("task")

        # Hermes is now a pure image-generation specialist. Odin owns the
        # conversation and delegates here via a native tool call.
        if task == "generate_image":
            prompt = msg.data.get("prompt") or msg.data.get("optimized_prompt")
            if not prompt:
                return {"error": "No prompt provided for image generation."}
            return await self.generate_image(prompt)

        if task == "generate_hero_image":
            draft = msg.data.get("draft") or ""
            prompt = f"Create a hero image for a blog post. Blog context: {draft[:500]}..."
            return await self.generate_image(prompt)

        return {"error": "Unknown task"}

# System-level social FUNCTIONS. The job a post does. Brand-agnostic marketing
# theory, so these live here as a constant rather than per-workspace config. Each
# maps to a snippet injected into Loki's prompt to set the angle and the CTA.
SOCIAL_FUNCTIONS = {
    "teach": (
        "FUNCTION: TEACH. Job: give the reader one useful thing they keep even if "
        "they never click. Lead with the insight in plain words. No sales ask hiding "
        "in it. Close soft or not at all; a save/follow-style nudge at most."
    ),
    "sell": (
        "FUNCTION: SELL. Job: drive the reader to the destination. Still give real "
        "value first, then one clear, soft push to the funnel. This is the only "
        "function that carries the promotional ask. One CTA, in the persona's voice."
    ),
    "entertain": (
        "FUNCTION: ENTERTAIN. Job: earn attention on its own with a story, a sharp "
        "observation, or dry humor. The value is the read. No hard ask; close soft "
        "or land on a punchy statement."
    ),
    "inspire": (
        "FUNCTION: INSPIRE. Job: leave the reader with a firm, resonant takeaway. "
        "Close on a strong line, not a hollow reassurance. A light community nudge "
        "at most, never a hard sell."
    ),
}


class LokiAgent(CustomAgent):
    role = "loki"
    capabilities = ["social_copy"]

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "loki.xml")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    @property
    def model_str(self) -> str:
        return _loki_model_str()  # per-call: env changes apply without restart

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("loki")
        task = msg.data.get("task")

        if task == "revise_social":
            return await self._revise_social(msg)

        # Accept both the new task name and the legacy one for backward compatibility.
        if task not in ("generate_social_copy", "syndicate"):
            return {"error": "Unknown task"}

        draft = msg.data.get("draft")
        if not draft:
            return {"error": "No draft provided for syndication."}

        channel = (msg.data.get("channel") or "linkedin").lower()
        if channel not in ("linkedin", "x"):
            return {"error": f"Unsupported channel: {channel}"}

        persona_prompt = msg.data.get("persona_prompt") or ""
        function_key = (msg.data.get("function") or "teach").lower()
        function_prompt = SOCIAL_FUNCTIONS.get(function_key, SOCIAL_FUNCTIONS["teach"])
        # What the source text is: an approved article (syndication) or the
        # creator's own idea brief (original content). Either way it stays the
        # single source of truth for facts.
        source_type = (msg.data.get("source_type") or "article").lower()
        is_idea = source_type == "idea"
        # Optional structural hint (Text-only, PDF Carousel, etc.).
        content_format = msg.data.get("format") or ""
        _fmt = content_format.lower()
        is_carousel = "carousel" in _fmt
        is_poster = (not is_carousel) and ("poster" in _fmt or "image" in _fmt)
        # Branding for the carousel PDF (from the workspace); design is fixed in code.
        brand_name = msg.data.get("brand_name") or ""
        accent_color = msg.data.get("accent_color") or ""

        # Compose the run-specific system instruction: the base loki.xml brain plus
        # the injected persona (WHO) and function (WHAT) for this specific request.
        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"[CHANNEL]\n{channel}\n\n"
            f"[FUNCTION]\n{function_prompt}\n\n"
            f"[PERSONA]\n{persona_prompt or 'No persona provided; use the default practitioner voice.'}"
        )
        if content_format:
            system_instruction += f"\n\n[FORMAT HINT]\n{content_format}"
        if is_idea:
            system_instruction += (
                "\n\n[SOURCE TYPE]\nOriginal idea. The source below is the creator's own "
                "content idea, not a finished article. Develop it: give it a hook, a "
                "structure, and a landing. Everywhere your rules say \"the article\", "
                "read \"the idea brief\". Do not add facts, numbers, stories, or "
                "attribution the brief does not contain."
            )

        prompt = (
            (
                "Here is the creator's original idea. Develop it into the social copy for the "
                if is_idea else
                "Here is the approved article. Generate the social copy for the "
            )
            + f"[CHANNEL] above, following every gate. Return only the JSON object.\n\n{draft}"
        )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ]
        try:
            response = await _loki_acompletion(
                self._logger,
                "generate_social_copy",
                model=self.model_str,
                messages=messages,
                max_tokens=8192,
            )
            raw_text = response.choices[0].message.content
        except Exception as e:
            self._logger.error(f"Loki LLM error: {e}")
            return {"error": _friendly_llm_error(e)}

        try:
            parsed = _extract_json(raw_text)
        except Exception as e:
            self._logger.error(f"Loki JSON parse error: {e} | raw: {(raw_text or '')[:300]}")
            return {"error": "Syndicator returned malformed output."}

        # For a carousel, Loki produces slide CONTENT. With draft_only the content
        # goes back for human review before anything is hardened; otherwise he calls
        # the deterministic PDF render tool. The model never controls design — only
        # fills slots.
        draft_only = bool(msg.data.get("draft_only"))
        if is_carousel:
            slides = parsed.get("slides") or []
            if not slides:
                return {"error": "Carousel generation returned no slides."}
            result = {
                "status": "success",
                "channel": channel,
                "format": "carousel",
                "slides": slides,
                "cta": parsed.get("cta"),
            }
            if draft_only:
                return result
            from carousel_pdf import render_carousel_pdf
            try:
                # The chosen brand TEMPLATE owns the design; the model never touches it.
                # WeasyPrint is CPU-bound — run it in a worker thread so a render
                # never stalls the event loop for other users.
                template = msg.data.get("template") or "devfest"
                file_id, _path = await asyncio.to_thread(
                    render_carousel_pdf, slides, brand_name, "", template
                )
                result["file_id"] = file_id
                return result
            except Exception as e:
                self._logger.error(f"Carousel render error: {e}")
                return {"error": f"Failed to render carousel PDF: {e}"}

        # A poster is one designed image (PNG). Loki writes the words; the template
        # owns the design. Same deterministic tool pattern as the carousel.
        if is_poster:
            result = {
                "status": "success",
                "channel": channel,
                "format": "poster",
                "poster_type": parsed.get("poster_type") or "statement",
                "stat": parsed.get("stat"),
                "headline": parsed.get("headline"),
                "subline": parsed.get("subline"),
                "cta": parsed.get("cta"),
            }
            if draft_only:
                return result
            from carousel_pdf import render_poster
            try:
                template = msg.data.get("template") or "devfest"
                file_id, _path = await asyncio.to_thread(
                    render_poster, parsed, brand_name, "", template
                )
                result["file_id"] = file_id
                return result
            except Exception as e:
                self._logger.error(f"Poster render error: {e}")
                return {"error": f"Failed to render poster: {e}"}

        import json as _json
        return {"status": "success", "channel": channel, "copy": _json.dumps(parsed)}

    async def _revise_social(self, msg: PeerMessage):
        """Human-in-the-loop revision of an already-drafted carousel or poster.

        Reworks the whole piece, or a single slide when slide_index is given,
        steered by the reviewer's note. Content only — the renderer is never
        called here; hardening happens on explicit approval."""
        usage_set_agent("loki")
        import json as _json

        kind = (msg.data.get("kind") or "").lower()
        if kind not in ("carousel", "poster", "text"):
            return {"error": f"Unsupported revision kind: {kind}"}

        content = msg.data.get("content")
        if not isinstance(content, dict):
            return {"error": "No current content provided to revise."}

        channel = (msg.data.get("channel") or "linkedin").lower()
        note = (msg.data.get("note") or "").strip()
        slide_index = msg.data.get("slide_index")
        article = msg.data.get("draft") or ""
        source_type = (msg.data.get("source_type") or "article").lower()

        persona_prompt = msg.data.get("persona_prompt") or ""
        function_key = (msg.data.get("function") or "teach").lower()
        function_prompt = SOCIAL_FUNCTIONS.get(function_key, SOCIAL_FUNCTIONS["teach"])

        if kind == "carousel":
            format_hint = "PDF Carousel"
        elif kind == "poster":
            format_hint = "Single Image/Poster"
        elif channel == "x":
            _thread = content.get("thread")
            format_hint = "Thread" if (isinstance(_thread, list) and len(_thread) > 1) else "Single Post"
        else:
            format_hint = "Text-only"
        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"[CHANNEL]\n{channel}\n\n"
            f"[FUNCTION]\n{function_prompt}\n\n"
            f"[PERSONA]\n{persona_prompt or 'No persona provided; use the default practitioner voice.'}\n\n"
            f"[FORMAT HINT]\n{format_hint}\n\n"
            "[REVISION MODE]\nYou are revising an existing draft a human reviewer has "
            "read, not writing from scratch. Apply the reviewer's note precisely. "
            "Preserve everything the note does not ask you to change. Every gate "
            "still applies to what you rewrite."
        )

        source_label = (
            "the creator's original idea brief" if source_type == "idea"
            else "the source article"
        )
        source_block = (
            f"\n\nFor fact-grounding, here is {source_label}. Never introduce a "
            f"claim it does not make:\n\n{article}" if article else ""
        )

        if kind == "carousel":
            slides = content.get("slides") or []
            if slide_index is not None:
                try:
                    idx = int(slide_index)
                    target = slides[idx]
                except (ValueError, TypeError, IndexError):
                    return {"error": f"Invalid slide index: {slide_index}"}
                prompt = (
                    "Here is the current carousel draft:\n"
                    f"{_json.dumps({'slides': slides, 'cta': content.get('cta')}, indent=2)}\n\n"
                    f"Rewrite ONLY slide {idx + 1} of {len(slides)} (kind \"{target.get('kind')}\"). "
                    "It must still flow with the slides before and after it.\n"
                    f"Reviewer's note: {note or 'Take a sharper, fresher angle on this slide.'}\n\n"
                    "Return ONLY a JSON object for that single slide: "
                    '{"kind": "...", "heading": "...", "body": "..."}'
                    f"{source_block}"
                )
            else:
                prompt = (
                    "Here is the current carousel draft:\n"
                    f"{_json.dumps({'slides': slides, 'cta': content.get('cta')}, indent=2)}\n\n"
                    f"Revise it. Reviewer's note: {note or 'Take a sharper, fresher pass on the whole carousel.'}\n\n"
                    "Return ONLY the full carousel JSON object in the standard shape "
                    '({"format": "carousel", "slides": [...], "cta": "..."}).'
                    f"{source_block}"
                )
        elif kind == "poster":
            poster = {
                "poster_type": content.get("poster_type") or content.get("posterType") or "statement",
                "stat": content.get("stat") or "",
                "headline": content.get("headline") or "",
                "subline": content.get("subline") or "",
                "cta": content.get("cta") or "",
            }
            prompt = (
                "Here is the current poster draft:\n"
                f"{_json.dumps(poster, indent=2)}\n\n"
                f"Revise it. Reviewer's note: {note or 'Take a sharper, fresher pass on this poster.'}\n\n"
                "Return ONLY the full poster JSON object in the standard shape "
                '({"format": "poster", "poster_type": "...", "stat": "...", "headline": "...", "subline": "...", "cta": "..."}).'
                f"{source_block}"
            )
        elif channel == "x":
            thread = content.get("thread") or []
            if slide_index is not None:
                try:
                    idx = int(slide_index)
                    _ = thread[idx]
                except (ValueError, TypeError, IndexError):
                    return {"error": f"Invalid post index: {slide_index}"}
                prompt = (
                    "Here is the current X thread draft:\n"
                    f"{_json.dumps({'thread': thread, 'cta': content.get('cta')}, indent=2)}\n\n"
                    f"Rewrite ONLY post {idx + 1} of {len(thread)}. It must still flow with the "
                    "posts around it and stay within X length limits.\n"
                    f"Reviewer's note: {note or 'Take a sharper, fresher angle on this post.'}\n\n"
                    'Return ONLY a JSON object: {"post": "the rewritten post text"}'
                    f"{source_block}"
                )
            else:
                prompt = (
                    "Here is the current X thread draft:\n"
                    f"{_json.dumps({'thread': thread, 'cta': content.get('cta')}, indent=2)}\n\n"
                    f"Revise it. Reviewer's note: {note or 'Take a sharper, fresher pass on the whole thread.'}\n\n"
                    "Return ONLY the full JSON object in the standard X shape "
                    '({"channel": "x", "thread": ["...", "..."], "cta": "..."}).'
                    f"{source_block}"
                )
        else:  # linkedin text
            prompt = (
                "Here is the current LinkedIn post draft:\n"
                f"{_json.dumps({'post': content.get('post'), 'cta': content.get('cta')}, indent=2)}\n\n"
                f"Revise it. Reviewer's note: {note or 'Take a sharper, fresher pass on the whole post.'}\n\n"
                "Return ONLY the full JSON object in the standard LinkedIn shape "
                '({"channel": "linkedin", "post": "the full post text", "cta": "..."}).'
                f"{source_block}"
            )

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt},
        ]
        try:
            response = await _loki_acompletion(
                self._logger,
                "revise_social",
                model=self.model_str,
                messages=messages,
                max_tokens=8192,
            )
            raw_text = response.choices[0].message.content
        except Exception as e:
            self._logger.error(f"Loki revision LLM error: {e}")
            return {"error": _friendly_llm_error(e)}

        try:
            parsed = _extract_json(raw_text)
        except Exception as e:
            self._logger.error(f"Loki revision JSON parse error: {e} | raw: {(raw_text or '')[:300]}")
            return {"error": "Syndicator returned malformed output."}

        if kind == "carousel":
            slides = list(content.get("slides") or [])
            if slide_index is not None:
                idx = int(slide_index)
                # Splice the single revised slide back in; the slide's KIND is part of
                # the carousel arc (hook/point/cta), so the original kind is kept.
                slides[idx] = {
                    "kind": slides[idx].get("kind"),
                    "heading": parsed.get("heading") or "",
                    "body": parsed.get("body") or "",
                }
                cta = content.get("cta")
            else:
                revised = parsed.get("slides") or []
                if not revised:
                    return {"error": "Revision returned no slides."}
                slides = revised
                cta = parsed.get("cta")
            return {
                "status": "success",
                "channel": channel,
                "format": "carousel",
                "slides": slides,
                "cta": cta,
            }

        if kind == "poster":
            return {
                "status": "success",
                "channel": channel,
                "format": "poster",
                "poster_type": parsed.get("poster_type") or "statement",
                "stat": parsed.get("stat"),
                "headline": parsed.get("headline"),
                "subline": parsed.get("subline"),
                "cta": parsed.get("cta"),
            }

        # text
        if channel == "x":
            thread = list(content.get("thread") or [])
            if slide_index is not None:
                idx = int(slide_index)
                revised_post = parsed.get("post") or parsed.get("body") or ""
                if idx < len(thread):
                    thread[idx] = revised_post
                cta = content.get("cta")
            else:
                thread = parsed.get("thread") or []
                if not thread:
                    return {"error": "Revision returned no thread posts."}
                cta = parsed.get("cta")
            return {"status": "success", "channel": channel, "format": "text", "thread": thread, "cta": cta}
        return {"status": "success", "channel": channel, "format": "text", "post": parsed.get("post") or "", "cta": parsed.get("cta")}

    def _studio_tool(self, kind: str, channel: str = "linkedin") -> dict:
        """Tool schema Loki uses to push revised content onto the studio canvas."""
        if kind == "carousel":
            params = {
                "type": "object",
                "properties": {
                    "slides": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "kind": {"type": "string", "enum": ["hook", "point", "cta"]},
                                "heading": {"type": "string"},
                                "body": {"type": "string"},
                            },
                            "required": ["kind", "heading", "body"],
                        },
                    },
                    "cta": {
                        "type": "string",
                        "description": "The single caption call-to-action line.",
                    },
                },
                "required": ["slides", "cta"],
            }
            desc = (
                "Apply your revised carousel to the reviewer's canvas. Call this "
                "whenever the reviewer asks for any change to the slides. Always pass "
                "the COMPLETE carousel (every slide, in order), not just the changed "
                "slides."
            )
        elif kind == "poster":
            params = {
                "type": "object",
                "properties": {
                    "poster_type": {"type": "string", "enum": ["statement", "stat"]},
                    "stat": {"type": "string"},
                    "headline": {"type": "string"},
                    "subline": {"type": "string"},
                    "cta": {"type": "string"},
                },
                "required": ["poster_type", "headline"],
            }
            desc = (
                "Apply your revised poster to the reviewer's canvas. Call this "
                "whenever the reviewer asks for any change. Always pass the complete "
                "poster content."
            )
        elif channel == "x":
            params = {
                "type": "object",
                "properties": {
                    "thread": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Every post in the thread, in order. A single post is a one-element array.",
                    },
                    "cta": {"type": "string", "description": "The single call-to-action line."},
                },
                "required": ["thread"],
            }
            desc = (
                "Apply your revised X post/thread to the reviewer's canvas. Call this "
                "whenever the reviewer asks for any change. Always pass the COMPLETE "
                "thread (every post, in order), not just the changed ones."
            )
        else:  # linkedin text
            params = {
                "type": "object",
                "properties": {
                    "post": {"type": "string", "description": "The full LinkedIn post body, with line breaks as \\n."},
                    "cta": {"type": "string", "description": "The single call-to-action line."},
                },
                "required": ["post"],
            }
            desc = (
                "Apply your revised LinkedIn post to the reviewer's canvas. Call this "
                "whenever the reviewer asks for any change. Always pass the complete "
                "post body."
            )
        return {
            "type": "function",
            "function": {"name": "apply_content_updates", "description": desc, "parameters": params},
        }

    def _normalize_studio_update(self, kind: str, channel: str, args: dict, current: dict):
        """Validate a canvas update from the tool call; fall back to the current
        content for fields the model omitted. Returns None if unusable."""
        if kind == "carousel":
            slides = [
                {
                    "kind": s.get("kind") or "point",
                    "heading": s.get("heading") or "",
                    "body": s.get("body") or "",
                }
                for s in (args.get("slides") or [])
                if isinstance(s, dict)
            ]
            if not slides:
                return None
            cta = args.get("cta")
            return {"slides": slides, "cta": cta if cta is not None else current.get("cta")}
        if kind == "poster":
            headline = (args.get("headline") or "").strip()
            if not headline:
                return None
            return {
                "poster_type": args.get("poster_type") or current.get("poster_type") or "statement",
                "stat": args.get("stat") if args.get("stat") is not None else current.get("stat"),
                "headline": headline,
                "subline": args.get("subline") if args.get("subline") is not None else current.get("subline"),
                "cta": args.get("cta") if args.get("cta") is not None else current.get("cta"),
            }
        # text
        cta = args.get("cta") if args.get("cta") is not None else current.get("cta")
        if channel == "x":
            thread = [str(t) for t in (args.get("thread") or []) if str(t).strip()]
            if not thread:
                return None
            return {"thread": thread, "cta": cta}
        post = (args.get("post") or "").strip()
        if not post:
            return None
        return {"post": post, "cta": cta}

    async def stream_studio_chat(self, msg: PeerMessage):
        """Live studio session: converse about a drafted carousel/poster and push
        revisions onto the reviewer's canvas. Yields the same SSE event dicts as
        Odin's stream_chat, plus:
          {"type": "content", "content": {...}}  revised canvas content
        """
        usage_set_agent("loki")
        import json as _json

        kind = (msg.data.get("kind") or "carousel").lower()
        if kind not in ("carousel", "poster", "text"):
            yield {"type": "error", "content": f"Unsupported studio kind: {kind}"}
            return

        content = msg.data.get("content") or {}
        channel = (msg.data.get("channel") or "linkedin").lower()
        article = msg.data.get("draft") or ""
        source_type = (msg.data.get("source_type") or "article").lower()
        persona_prompt = msg.data.get("persona_prompt") or ""
        function_key = (msg.data.get("function") or "teach").lower()
        function_prompt = SOCIAL_FUNCTIONS.get(function_key, SOCIAL_FUNCTIONS["teach"])
        history = (msg.data.get("context") or {}).get("history", [])
        message = msg.data.get("message") or ""

        if kind == "carousel":
            format_hint = "PDF Carousel"
            canvas_noun = "carousel"
        elif kind == "poster":
            format_hint = "Single Image/Poster"
            canvas_noun = "poster"
        elif channel == "x":
            _thread = content.get("thread")
            format_hint = "Thread" if (isinstance(_thread, list) and len(_thread) > 1) else "Single Post"
            canvas_noun = "post"
        else:
            format_hint = "Text-only"
            canvas_noun = "post"
        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"[CHANNEL]\n{channel}\n\n"
            f"[FUNCTION]\n{function_prompt}\n\n"
            f"[PERSONA]\n{persona_prompt or 'No persona provided; use the default practitioner voice.'}\n\n"
            f"[FORMAT HINT]\n{format_hint}\n\n"
            "[STUDIO MODE]\n"
            "You are in a live working session with the human reviewer. The current "
            f"{canvas_noun} draft sits on a canvas beside this chat, and it may include the "
            "reviewer's own manual edits, so ALWAYS work from the CURRENT CONTENT "
            "below, never from earlier turns. When the reviewer asks for any change, "
            "call apply_content_updates with the complete revised content, and keep "
            "your spoken reply to one or two short sentences on what you changed and "
            "why. If the reviewer is only asking a question or thinking out loud, "
            "answer conversationally and do not call the tool. If the reviewer "
            "references a prior decision, preference, or past session that is not "
            "in your remembered context, call search_memory before answering rather "
            "than guessing. Every writing-craft "
            "and humanizer gate applies to everything you put on the canvas. Never "
            "invent facts beyond the source material.\n\n"
            f"[CURRENT CONTENT]\n{_json.dumps(content, indent=2)}\n\n"
            + (
                f"[SOURCE — ORIGINAL IDEA]\nThe creator's own idea brief; develop it, "
                f"never add facts it does not contain.\n{article or 'Not provided.'}"
                if source_type == "idea" else
                f"[SOURCE ARTICLE]\n{article or 'Not provided.'}"
            )
            + _memory_block(msg)
        )

        # History may carry search_memory round-trips appended by the
        # ContentForge proxy (assistant tool_calls + tool results); a
        # continuation turn has no fresh user message.
        messages = [{"role": "system", "content": system_instruction}]
        for h in history:
            entry = {"role": h.get("role", "user"), "content": h.get("content", "")}
            if h.get("tool_calls"):
                entry["tool_calls"] = h["tool_calls"]
            if h.get("tool_call_id"):
                entry["tool_call_id"] = h["tool_call_id"]
            messages.append(entry)
        if message:
            messages.append({"role": "user", "content": message})

        # How many slides/posts the current canvas holds, so progress ticks can
        # say "slide 3 of ~6". Approximate by design: the reviewer may have
        # asked to add or merge units this very turn.
        if kind == "carousel":
            expected_units = len(content.get("slides") or [])
        elif kind == "text" and channel == "x":
            expected_units = len([t for t in (content.get("thread") or []) if t])
        else:
            expected_units = 0

        # A streaming call can fail twice over: before the stream starts
        # (num_retries covers that) or mid-iteration (it doesn't — that's the
        # "Overloaded" MidStreamFallbackError we shipped to a reviewer once).
        # So the whole call-and-consume runs per model: primary first, then the
        # fallback. On failover a "reset" event wipes any half-streamed reply
        # from the canvas chat before the fallback re-answers from scratch.
        primary = self.model_str
        fallback = _loki_fallback_model_str()
        last_error = None
        for model in (primary, fallback):
            if model != primary:
                _log_llm_fallback(self._logger, "studio_chat", primary, model, last_error)
                yield {"type": "reset"}
                yield {"type": "status", "content": "The primary model is overloaded — retrying with the backup model..."}

            tool_calls_acc = {}  # index -> {"id": str, "name": str, "arguments": str}
            streamed_text = False
            rework_announced = False
            memory_announced = False
            units_seen = 0
            try:
                response = await litellm.acompletion(
                    model=model,
                    messages=messages,
                    tools=[self._studio_tool(kind, channel), _search_memory_tool()],
                    tool_choice="auto",
                    stream=True,
                    max_tokens=8192,
                    num_retries=2,
                )

                async for chunk in response:
                    choices = getattr(chunk, "choices", None)
                    if not choices:
                        continue
                    delta = choices[0].delta

                    content_delta = getattr(delta, "content", None)
                    if content_delta:
                        streamed_text = True
                        yield {"type": "text", "content": content_delta}

                    delta_tool_calls = getattr(delta, "tool_calls", None)
                    if delta_tool_calls:
                        for tc in delta_tool_calls:
                            idx = getattr(tc, "index", 0) or 0
                            acc = tool_calls_acc.setdefault(idx, {"id": f"studio_call_{idx}", "name": "", "arguments": ""})
                            if getattr(tc, "id", None):
                                acc["id"] = tc.id
                            fn = getattr(tc, "function", None)
                            if fn is not None:
                                if getattr(fn, "name", None):
                                    acc["name"] = fn.name
                                if getattr(fn, "arguments", None):
                                    acc["arguments"] += fn.arguments
                        # Narrate the silent stretch: without these the reviewer
                        # stares at a stale spinner for the whole revision.
                        for acc in tool_calls_acc.values():
                            if acc["name"] == "search_memory" and not memory_announced:
                                memory_announced = True
                                yield {"type": "status", "content": "Odin is recalling past sessions..."}
                            if acc["name"] != "apply_content_updates":
                                continue
                            if not rework_announced:
                                rework_announced = True
                                yield {"type": "status", "content": f"Odin → Loki: reworking the {canvas_noun}..."}
                            done = _studio_units_done(kind, channel, acc["arguments"])
                            if done > units_seen:
                                units_seen = done
                                unit = "slide" if kind == "carousel" else "post"
                                of = f" of ~{expected_units}" if expected_units >= done else ""
                                yield {"type": "status", "content": f"Odin → Loki: writing {unit} {done}{of}..."}
            except Exception as e:
                last_error = e
                continue

            if model != primary:
                self._logger.info(f"Loki studio_chat: fallback model {model} succeeded")

            for acc in tool_calls_acc.values():
                if acc["name"] == "search_memory":
                    try:
                        query = str(_json.loads(acc["arguments"] or "{}").get("query", "")).strip()
                    except Exception:
                        query = ""
                    if query:
                        yield {"type": "tool_call", "content": {"id": acc["id"], "name": "search_memory", "query": query[:500]}}
                    continue
                if acc["name"] != "apply_content_updates":
                    continue
                try:
                    args = _json.loads(acc["arguments"] or "{}")
                except Exception:
                    yield {"type": "error", "content": "The update came back unreadable; ask again."}
                    continue
                updated = self._normalize_studio_update(kind, channel, args, content)
                if updated is None:
                    yield {"type": "error", "content": "The update came back incomplete; ask again."}
                    continue
                if not streamed_text:
                    yield {"type": "text", "content": "Done. The canvas is updated."}
                yield {"type": "content", "content": updated}
            return

        self._logger.error(f"Loki studio chat failed on primary and fallback: {last_error}")
        yield {"type": "error", "content": _friendly_llm_error(last_error)}

# Heimdall's editorial model. Configurable via HEIMDALL_MODEL; defaults to
# Gemini Pro: the QA pass runs once per generation on published content,
# so the stronger tier's editorial judgment is worth the small cost delta.
# Resolved per call so env changes apply without a restart.
def _heimdall_model_str() -> str:
    m = os.getenv("HEIMDALL_MODEL", "")
    return _route(m) if m else _gemini_litellm_model()



# Mimir's scouting model. Conversational retrieval over the vault digest, not
# writing — the default Gemini routing is fast and holds the whole digest;
# override via MIMIR_MODEL (resolved per call, env changes need no restart).
def _mimir_model_str() -> str:
    m = os.getenv("MIMIR_MODEL", "")
    return _route(m) if m else _gemini_flash_model()


class MimirAgent(CustomAgent):
    """The Source Vault counselor: a scouting chat that helps the operator
    pick which vault transcripts to build the next piece from. Converses over
    an injected vault digest (titles, groups, usage, excerpts — never full
    transcripts) and ends by calling propose_sources; the frontend turns the
    proposal into composer source cards."""
    role = "mimir"
    capabilities = ["source_scouting"]

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "mimir.xml")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    @property
    def model_str(self) -> str:
        return _mimir_model_str()  # per-call: env changes apply without restart

    def _propose_tool(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": "propose_sources",
                "description": (
                    "Propose which vault transcripts to build the next piece from. "
                    "Call ONLY when the operator has converged or asked you to pick."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "picks": {
                            "type": "array",
                            "minItems": 1,
                            "maxItems": 3,
                            "items": {
                                "type": "object",
                                "properties": {
                                    "vaultId": {"type": "string", "description": "The id exactly as it appears in the vault digest"},
                                    "title": {"type": "string"},
                                    "reason": {"type": "string", "description": "One sentence: why this pick, why now"},
                                },
                                "required": ["vaultId", "title", "reason"],
                            },
                        },
                        "angle": {"type": "string", "description": "The sharp angle for the piece"},
                        "workingTitle": {"type": "string"},
                    },
                    "required": ["picks", "angle", "workingTitle"],
                },
            },
        }

    def _read_tool(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": "read_transcript",
                "description": (
                    "Read the opening slice of one vault transcript when the digest gist "
                    "isn't enough to judge fit. Use sparingly (a few reads per turn at "
                    "most) and only for entries you are seriously considering."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "vaultId": {"type": "string", "description": "The id exactly as it appears in the vault digest"},
                    },
                    "required": ["vaultId"],
                },
            },
        }

    async def summarize_entries(self, entries: list) -> list:
        """Distill transcripts into gists + topic tags for the scouting digest
        (batch of up to 10). The gist captures SUBSTANCE — claims, numbers,
        frameworks, stories — never the greetings and housekeeping that open
        every episode. Returns [{id, gist, topics}], ids validated."""
        usage_set_agent("mimir")
        blocks = []
        for e in entries[:10]:
            text = str(e.get("text") or "")[:5000]
            blocks.append(f"--- id={e.get('id')} | {e.get('title')} ---\n{text}")
        # Line-based output, NOT JSON: Gemini through litellm drops trailing
        # tokens often enough that one bad brace voided whole batches. With
        # labeled lines a mangled entry loses only itself.
        prompt = (
            "You distill raw video transcripts into a scouting index. For EACH entry "
            "below, write a gist of 2-3 sentences capturing the SUBSTANCE (claims, "
            "numbers, frameworks, stories) - skip greetings, housekeeping, and filler - "
            "plus 3-5 short topic tags. Answer in EXACTLY this plain-text format, one "
            "block per entry, nothing else:\n"
            "id: <the id>\n"
            "gist: <the 2-3 sentences>\n"
            "topics: <tag>, <tag>, <tag>\n\n"
            + "\n\n".join(blocks)
        )
        response = await litellm.acompletion(
            model=self.model_str,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4096,
            num_retries=2,
            vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            vertex_location=os.getenv("VERTEX_LOCATION", "global"),
        )
        text = response.choices[0].message.content or ""
        valid = {str(e.get("id")) for e in entries}
        parsed = []
        cur = None
        for line in text.splitlines():
            s = line.strip()
            low = s.lower()
            if low.startswith("id:"):
                cur = {"id": s[3:].strip().strip("*`"), "gist": "", "topics": []}
                parsed.append(cur)
            elif cur and low.startswith("gist:"):
                cur["gist"] = s[5:].strip()
            elif cur and low.startswith("topics:"):
                cur["topics"] = [t.strip()[:40] for t in s[7:].split(",") if t.strip()][:5]
            elif cur and s and cur["gist"] and not cur["topics"]:
                cur["gist"] += " " + s  # a gist the model wrapped across lines
        return [
            {"id": c["id"], "gist": c["gist"][:600], "topics": c["topics"]}
            for c in parsed if c["id"] in valid and c["gist"]
        ]

    async def stream_scout_chat(self, msg: PeerMessage):
        """Scouting session over the vault. Yields the same SSE event dicts as
        the other chat streams, plus:
          {"type": "proposal", "content": {picks, angle, workingTitle}}
        """
        usage_set_agent("mimir")
        import json as _json

        digest = msg.data.get("vault_digest") or []
        recent = msg.data.get("recent_content") or []
        persona = msg.data.get("persona_prompt") or ""
        workspace = msg.data.get("workspace_name") or "this workspace"
        history = (msg.data.get("context") or {}).get("history", [])
        message = msg.data.get("message") or ""

        digest_lines = []
        valid_ids = set()
        for e in digest:
            valid_ids.add(str(e.get("id")))
            if e.get("usedHere"):
                used = "USED here: " + "; ".join(e["usedHere"])[:200]
            elif e.get("usedElsewhere"):
                used = "unused here, used elsewhere: " + "; ".join(e["usedElsewhere"])[:200]
            else:
                used = "UNUSED"
            digest_lines.append(
                f"- id={e.get('id')} | {e.get('title')} | group: {e.get('group')} | "
                f"{e.get('chars', 0)} chars | {used}\n"
                f"  excerpt: {(e.get('excerpt') or '').strip()[:400]}"
            )

        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"[WORKSPACE]\n{workspace}\n\n"
            f"[PERSONA]\n{persona or 'No persona provided.'}\n\n"
            "[RECENT CONTENT - newest first]\n"
            + ("\n".join(f"- {t}" for t in recent) if recent else "(nothing published yet)")
            + f"\n\n[VAULT DIGEST - {len(digest)} entries]\n"
            + ("\n".join(digest_lines) if digest_lines else "(the vault is empty for this workspace)")
            + _memory_block(msg)
        )

        # History may carry tool round-trips appended by the ContentForge proxy
        # (assistant tool_calls + tool results); pass those through verbatim so
        # the model sees its own reads. A tool-continuation turn has no fresh
        # user message.
        messages = [{"role": "system", "content": system_instruction}]
        for h in history:
            entry = {"role": h.get("role", "user"), "content": h.get("content", "")}
            if h.get("tool_calls"):
                entry["tool_calls"] = h["tool_calls"]
            if h.get("tool_call_id"):
                entry["tool_call_id"] = h["tool_call_id"]
            messages.append(entry)
        if message:
            messages.append({"role": "user", "content": message})

        try:
            response = await litellm.acompletion(
                model=self.model_str,
                messages=messages,
                tools=[self._propose_tool(), self._read_tool(), _search_memory_tool()],
                tool_choice="auto",
                stream=True,
                max_tokens=2048,
                num_retries=2,
                # Prod routes Gemini through Vertex; litellm defaults to
                # us-central1, where current models don't live (404).
                vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                vertex_location=os.getenv("VERTEX_LOCATION", "global"),
            )

            tool_calls_acc = {}
            async for chunk in response:
                choices = getattr(chunk, "choices", None)
                if not choices:
                    continue
                delta = choices[0].delta
                content_delta = getattr(delta, "content", None)
                if content_delta:
                    yield {"type": "text", "content": content_delta}
                delta_tool_calls = getattr(delta, "tool_calls", None)
                if delta_tool_calls:
                    for tc in delta_tool_calls:
                        idx = getattr(tc, "index", 0) or 0
                        acc = tool_calls_acc.setdefault(idx, {"id": f"scout_call_{idx}", "name": "", "arguments": ""})
                        if getattr(tc, "id", None):
                            acc["id"] = tc.id
                        fn = getattr(tc, "function", None)
                        if fn is not None:
                            if getattr(fn, "name", None):
                                acc["name"] = fn.name
                            if getattr(fn, "arguments", None):
                                acc["arguments"] += fn.arguments

            for acc in tool_calls_acc.values():
                try:
                    args = _json.loads(acc["arguments"] or "{}")
                except Exception:
                    args = None

                if acc["name"] == "read_transcript":
                    # Mimir is closed-book: the ContentForge proxy executes the
                    # read against the vault and calls back with the result in
                    # history. Grounded to digest ids like proposals.
                    vault_id = str((args or {}).get("vaultId", ""))
                    if not args or vault_id not in valid_ids:
                        yield {"type": "error", "content": "Mimir tried to read material that is not in the vault; ask again."}
                        continue
                    yield {"type": "tool_call", "content": {"id": acc["id"], "name": "read_transcript", "vaultId": vault_id}}
                    continue

                if acc["name"] == "search_memory":
                    query = str((args or {}).get("query", "")).strip()
                    if not query:
                        continue
                    yield {"type": "tool_call", "content": {"id": acc["id"], "name": "search_memory", "query": query[:500]}}
                    continue

                if acc["name"] != "propose_sources":
                    continue
                if args is None:
                    yield {"type": "error", "content": "The proposal came back unreadable; ask again."}
                    continue
                # Hard grounding: only ids from the digest survive.
                picks = [p for p in (args.get("picks") or []) if str(p.get("vaultId")) in valid_ids]
                if not picks:
                    yield {"type": "error", "content": "Mimir proposed material that is not in the vault; ask again."}
                    continue
                yield {"type": "proposal", "content": {
                    "picks": picks,
                    "angle": args.get("angle") or "",
                    "workingTitle": args.get("workingTitle") or "",
                }}
        except Exception as e:
            self._logger.error(f"Mimir scout chat error: {e}")
            yield {"type": "error", "content": _friendly_llm_error(e)}


# Huginn's research model. Small classification/extraction calls — the fast
# Gemini routing is right-sized; override via HUGINN_MODEL (per call).
def _huginn_model_str() -> str:
    m = os.getenv("HUGINN_MODEL", "")
    return _route(m) if m else _gemini_flash_model()


class HuginnAgent(CustomAgent):
    """Odin's raven: post-draft citation research. Finds the factual claims
    worth citing, searches the web for authoritative sources (Serper via
    jarviscore's InternetSearch), verifies each candidate page actually
    supports its claim, and weaves verified links into the draft by exact
    span replacement — plus internal links to the workspace's own published
    articles. Strictly fail-open: any failure returns the draft untouched."""
    role = "huginn"
    capabilities = ["citation_research"]

    MAX_WEB_LINKS = 4
    MAX_INTERNAL_LINKS = 3
    BLOCKED_DOMAINS = ("reddit.com", "quora.com", "pinterest.", "facebook.com",
                       "x.com", "twitter.com", "linkedin.com", "medium.com", "youtube.com")

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "huginn.xml")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    @property
    def model_str(self) -> str:
        return _huginn_model_str()  # per-call: env changes apply without restart

    def _search(self):
        """Lazily construct the search client; None disables web citations
        (internal links still work — they need no search)."""
        if not os.getenv("SERPER_API_KEY"):
            return None
        from jarviscore.search.internet_search import InternetSearch
        return InternetSearch()

    async def _extract(self, search, url: str) -> str:
        """Main-content extraction. Trafilatura first — modern blogs hand the
        naive HTML walk nothing but nav chrome and related-post links, which
        made the verifier reject genuinely supporting pages. Falls back to
        the search client's extractor."""
        try:
            import trafilatura
            def _fetch():
                html = trafilatura.fetch_url(url)
                return trafilatura.extract(html) or "" if html else ""
            text = await asyncio.wait_for(asyncio.to_thread(_fetch), timeout=20)
            if len(text) >= 200:
                return text
        except Exception as e:
            self._logger.info(f"Huginn trafilatura extraction failed ({url}): {e}")
        extracted = await search.extract_content(url)
        return (extracted or {}).get("content") or ""

    async def _complete(self, prompt: str, max_tokens: int = 1024) -> str:
        response = await litellm.acompletion(
            model=self.model_str,
            messages=[{"role": "system", "content": self.system_prompt},
                      {"role": "user", "content": prompt}],
            # Thinking models spend the budget on hidden reasoning first — a
            # tiny cap returns None ("finish: length") and every verification
            # silently fails. Floor the budget; short answers stay short.
            max_tokens=max(max_tokens, 2048),
            temperature=0.1,
            num_retries=2,
            vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            vertex_location=os.getenv("VERTEX_LOCATION", "global"),
        )
        return response.choices[0].message.content or ""

    def _plan(self, text: str, internal_links: list) -> tuple[list, list]:
        """Parse the line-based research plan (JSON burned us before)."""
        internal_by_url = {str(l.get("url")): l for l in internal_links}
        claims, internals = [], []
        for line in text.splitlines():
            s = line.strip().lstrip("-* ")
            if s.upper().startswith("CLAIM:") and "| QUERY:" in s:
                span, query = s[6:].split("| QUERY:", 1)
                if span.strip() and query.strip():
                    claims.append({"span": span.strip(), "query": query.strip()[:200]})
            elif s.upper().startswith("INTERNAL:") and "| URL:" in s:
                span, url = s[9:].split("| URL:", 1)
                # Hard grounding: only URLs from the candidate list survive.
                if span.strip() and url.strip() in internal_by_url:
                    internals.append({"span": span.strip(), "url": url.strip()})
        return claims[: self.MAX_WEB_LINKS], internals[: self.MAX_INTERNAL_LINKS]

    @staticmethod
    def _place_link(draft: str, span: str, url: str) -> str | None:
        """Deterministic span replacement: the span must appear exactly once,
        outside existing links and headings. Returns None when unplaceable."""
        if draft.count(span) != 1:
            return None
        idx = draft.find(span)
        line_start = draft.rfind("\n", 0, idx) + 1
        line = draft[line_start:draft.find("\n", idx) if draft.find("\n", idx) != -1 else len(draft)]
        if line.lstrip().startswith("#"):
            return None
        before = draft[max(0, idx - 80):idx]
        if "[" in before and "](" not in before.split("[")[-1]:
            return None  # inside existing link anchor
        return draft[:idx] + f"[{span}]({url})" + draft[idx + len(span):]

    @staticmethod
    def _claim_context(draft: str, span: str, radius: int = 240) -> str:
        """The sentence neighborhood around the span — the verifier needs to
        know what the claim is actually about, not just the anchor words."""
        idx = draft.find(span)
        if idx == -1:
            return span
        return draft[max(0, idx - radius):idx + len(span) + radius].replace("\n", " ").strip()

    async def _verify(self, claim: str, excerpt: str) -> bool:
        out = await self._complete(
            "Does the SOURCE EXCERPT below genuinely support the CLAIM IN CONTEXT? "
            "Supporting means: for factual/numeric claims, the excerpt states or "
            "evidences the same fact (figures in a similar range count); for "
            "industry concepts and aphorisms, the excerpt explains or documents "
            "the same concept. Merely sharing a topic is NOT support. "
            "Respond with only \"true\" or \"false\".\n\n"
            f"CLAIM IN CONTEXT:\n{claim}\n\nSOURCE EXCERPT:\n{excerpt[:4000]}",
            max_tokens=10,
        )
        return out.strip().lower().startswith("true")

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("huginn")
        if msg.data.get("task") != "enrich_citations":
            return {"error": "Unknown task"}
        draft = msg.data.get("draft") or ""
        internal_links = msg.data.get("internal_links") or []
        if not draft.strip():
            return {"status": "success", "draft": draft, "citations": [], "internal": []}

        search = self._search()
        candidates_block = (
            "\n".join(f"- {l.get('title')} | {l.get('url')}" for l in internal_links[:30])
            or "(none available)"
        )
        plan_text = await self._complete(
            "Study the DRAFT. Answer in EXACTLY this plain-text format, one item "
            "per line, nothing else:\n"
            "CLAIM: <exact 2-8 word span copied verbatim from the draft> | QUERY: <web search query to find an authoritative source>\n"
            "The QUERY must carry the claim's full context — always include the "
            "industry/domain terms (e.g. 'self storage'), never a bare phrase: "
            "'four Ds' finds dictionaries; 'self storage demand drivers four Ds "
            "death divorce downsizing' finds industry sources.\n"
            "INTERNAL: <exact 2-8 word span copied verbatim from the draft> | URL: <a url taken ONLY from the internal candidates>\n\n"
            f"Propose up to {self.MAX_WEB_LINKS} CLAIM lines"
            + ("" if search else " (SKIP all CLAIM lines — web search is unavailable)")
            + f" and up to {self.MAX_INTERNAL_LINKS} INTERNAL lines. An article "
            "of this kind usually contains 3-4 citable facts (statistics, costs, "
            "market figures, rules of thumb) — be thorough finding them; only "
            "answer NONE when the draft is genuinely all opinion and story.\n\n"
            f"[INTERNAL CANDIDATES — the workspace's published articles]\n{candidates_block}\n\n"
            f"[DRAFT]\n{draft[:20000]}",
            max_tokens=1024,
        )
        claims, internals = self._plan(plan_text, internal_links)

        citations = []
        if search:
            for c in claims:
                try:
                    results = await search.search(c["query"], max_results=5)
                except Exception as e:
                    self._logger.warning(f"Huginn search failed ('{c['span']}'): {e}")
                    continue
                placed_one = False
                # Walk the candidates: one bad page must not kill the claim.
                for r in (results or [])[:5]:
                    url = str(r.get("url") or "")
                    if not url:
                        continue
                    if any(b in url for b in self.BLOCKED_DOMAINS):
                        self._logger.info(f"Huginn skipped blocked domain for '{c['span']}': {url}")
                        continue
                    try:
                        content = await self._extract(search, url)
                    except Exception as e:
                        self._logger.info(f"Huginn extraction failed for '{c['span']}' ({url}): {e}")
                        continue
                    if len(content) < 200:
                        self._logger.info(f"Huginn skipped thin page for '{c['span']}': {url}")
                        continue
                    # The search snippet is the engine's own claim-relevant
                    # excerpt — auxiliary evidence for the verifier.
                    snippet = str(r.get("snippet") or "")
                    if snippet:
                        content = f"{content}\n\nSEARCH RESULT SNIPPET: {snippet}"
                    if not await self._verify(self._claim_context(draft, c["span"]), content):
                        self._logger.info(f"Huginn dropped unverified source for '{c['span']}': {url}")
                        continue
                    placed = self._place_link(draft, c["span"], url)
                    if placed is None:
                        # A span problem no other URL can fix — stop trying.
                        self._logger.info(f"Huginn couldn't anchor '{c['span']}' (not unique, a heading, or already linked)")
                        break
                    draft = placed
                    citations.append({"span": c["span"], "url": url})
                    placed_one = True
                    break
                if not placed_one:
                    self._logger.info(f"Huginn found no acceptable source for '{c['span']}'")

        internal_placed = []
        for l in internals:
            placed = self._place_link(draft, l["span"], l["url"])
            if placed:
                draft = placed
                internal_placed.append(l)
            else:
                self._logger.info(f"Huginn couldn't anchor internal link '{l['span']}'")

        self._logger.info(
            f"Huginn: {len(claims)} claim(s) + {len(internals)} internal candidate(s) → "
            f"placed {len(citations)} citation(s) + {len(internal_placed)} internal link(s)"
        )
        return {"status": "success", "draft": draft, "citations": citations, "internal": internal_placed}


class HeimdallAgent(CustomAgent):
    """Quality gate on Oscar's blog drafts: a copyeditor and fact-checker that
    fixes correctness/fidelity/tone/de-AI issues in one pass and reports what it
    changed. Fail-open by design — callers keep the original draft on error."""
    role = "heimdall"
    capabilities = ["quality_assurance"]

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "heimdall.xml")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    @property
    def model_str(self) -> str:
        return _heimdall_model_str()  # per-call: env changes apply without restart

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("heimdall")
        task = msg.data.get("task")
        if task != "review_draft":
            return {"error": "Unknown task"}

        draft = msg.data.get("draft")
        if not draft or not draft.strip():
            return {"error": "No draft provided for review."}
        transcript = msg.data.get("transcript") or ""
        persona = msg.data.get("system_prompt") or ""

        system_instruction = (
            f"{self.system_prompt}\n\n"
            f"[BRAND PERSONA]\n{persona or 'No persona provided; preserve the draft voice as-is.'}"
        )
        prompt = (
            "Here is the source transcript the draft was written from:\n\n"
            f"--- TRANSCRIPT ---\n{transcript or '(not provided; skip fidelity checks that need it)'}\n--- END TRANSCRIPT ---\n\n"
            "And here is the draft to review:\n\n"
            f"--- DRAFT ---\n{draft}\n--- END DRAFT ---\n\n"
            "Return the complete corrected draft, then the <qa_report> block. "
            "Your very first characters must be the draft's H1 line — no plan, "
            "no preamble, no commentary of any kind before the draft."
        )

        try:
            response = await litellm.acompletion(
                model=self.model_str,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=8192,
            )
            raw = response.choices[0].message.content or ""
        except Exception as e:
            self._logger.error(f"Heimdall LLM error: {e}")
            return {"error": str(e)}

        import re as _re
        report_match = _re.search(r"<qa_report>(.*?)</qa_report>", raw, _re.DOTALL | _re.IGNORECASE)
        qa_report = report_match.group(1).strip() if report_match else None
        corrected = _re.sub(r"<qa_report>.*?</qa_report>", "", raw, flags=_re.DOTALL | _re.IGNORECASE).strip()

        # Despite the "nothing before the draft" mandate, the model sometimes
        # narrates its editing plan first ("I'll review this draft for..."),
        # and that preamble leaked into a published draft once. The output
        # contract guarantees exactly one H1 on the first line, so anything
        # before the first H1 is preamble — strip it deterministically.
        h1 = _re.search(r"^# .+", corrected, _re.MULTILINE)
        if h1 and h1.start() > 0:
            self._logger.warning(
                f"Heimdall emitted {h1.start()} chars of preamble before the draft's H1; stripped."
            )
            corrected = corrected[h1.start():]

        # Sanity guard: a review pass must not shrink the post dramatically. If
        # it did, something went wrong (truncation, over-editing) — fail open.
        if not corrected or len(corrected) < len(draft) * 0.5:
            self._logger.warning(
                f"Heimdall output suspiciously short ({len(corrected)} vs {len(draft)} chars); keeping original draft."
            )
            return {"error": "Review output failed the sanity check."}

        return {"status": "success", "draft": corrected, "qa_report": qa_report}


class OscarAgent(CustomAgent):
    role = "oscar"
    capabilities = ["writing"]

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "oscar.xml")
        if os.path.exists(prompt_path):
            with open(prompt_path, "r", encoding="utf-8") as f:
                self.base_prompt = f.read()
        else:
            self.base_prompt = ""

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("oscar")
        task = msg.data.get("task")
        transcript = msg.data.get("transcript")
        system_prompt = msg.data.get("system_prompt") or "You are an expert blog writer."
        description = msg.data.get("description") or ""
        word_count = msg.data.get("word_count") or "1000"
        ai_provider = msg.data.get("ai_provider") or "Google"
        ai_model = msg.data.get("ai_model") or _gemini_litellm_model()
        source_count = msg.data.get("source_count") or 1
        source_types = msg.data.get("source_types") or []
        brief = msg.data.get("brief") or None

        # Map provider to LiteLLM model prefix if not already present
        model_str = ai_model
        if ai_provider == "Google" and not (model_str.startswith("gemini/") or model_str.startswith("vertex_ai/")):
            model_str = f"{_gemini_litellm_prefix()}{model_str}"
        elif ai_provider == "OpenAI" and not model_str.startswith("openai/"):
            model_str = f"openai/{model_str}"
        elif ai_provider == "Anthropic" and not model_str.startswith("anthropic/"):
            model_str = f"anthropic/{model_str}"

        if task == "write_blog":
            final_system = f"{self.base_prompt}\n\nWorkspace Persona:\n{system_prompt}\n\nWorkspace Context: {description}\nTarget Word Count: {word_count}\n\nIMPORTANT: At the very end of your response, you MUST generate an optimized prompt for an AI image generator (Gemini image models) to create a cover image for this blog post. Enclose the prompt exactly in <image_prompt>...</image_prompt> tags. Make the prompt highly detailed, specify a 16:9 aspect ratio, and ensure it visually captures the core theme of the blog post."
            if source_count > 1:
                final_system += f"\n\nMULTI-SOURCE SYNTHESIS: This source material combines {source_count} separate sources (videos, articles, notes, code), each marked with a '=== SOURCE N (type): title ===' header. Treat them as distinct inspirations for a SINGLE blog post: weave their ideas together, merge overlapping points, and surface meaningful contrasts where the sources differ. Do NOT mention 'Source 1/2' literally or structure the post by source — the seams between sources should be invisible to the reader."
            if brief and (brief.get("workingTitle") or brief.get("angle")):
                wt = brief.get("workingTitle") or ""
                angle = brief.get("angle") or ""
                final_system += (
                    "\n\nEDITORIAL BRIEF: The operator chose this direction during a "
                    "scouting session over the source material. Honor it."
                    + (f"\nWorking title: {wt} - keep its intent; refine the wording only if you can clearly beat it." if wt else "")
                    + (f"\nAngle: {angle} - build the piece around this angle." if angle else "")
                )
            if any(t in ("code", "github") for t in source_types):
                final_system += "\n\nCODE SOURCES: Some source material is code or a code repository. Explain in prose what the code does, why it matters, and what the reader should take from it. Quote at most short illustrative snippets (a few lines); never reproduce long code blocks, and never let file paths or repository structure leak into the post as filler."
            prompt = f"Here is the raw transcript. Please write the blog post:\n\n{transcript}"
            
            messages = [
                {"role": "system", "content": final_system},
                {"role": "user", "content": prompt}
            ]
            
            try:
                response = await litellm.acompletion(
                    model=model_str,
                    messages=messages,
                    vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                    vertex_location=os.getenv("VERTEX_LOCATION", "global")
                )
                draft = response.choices[0].message.content
                return {"status": "success", "draft": draft}
            except Exception as e:
                self._logger.error(f"LiteLLM error: {e}")
                return {"error": str(e)}
                
        return {"error": "Unknown task"}

class OdinAgent(CustomAgent):
    role = "odin"
    capabilities = ["orchestration"]

    async def setup(self):
        await super().setup()
        prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "odin.xml")
        with open(prompt_path, "r", encoding="utf-8") as f:
            self.system_prompt = f.read()

    async def process_campaign(self, transcript: str, system_prompt: str = None, description: str = None, word_count: str = None, ai_provider: str = None, ai_model: str = None, source_count: int = 1, source_types: list = None, brief: dict = None, internal_links: list = None, progress=None):
        """Main orchestration workflow.

        `progress` is an optional async callable taking an event name; it lets
        callers (the streaming endpoint) surface each agent hand-off live.
        """
        self._logger.info("Odin delegating blog draft to OscarAgent...")

        async def notify(event: str):
            if progress:
                try:
                    await progress(event)
                except Exception:
                    pass  # progress reporting must never break the pipeline

        mesh = self._mesh
        if not mesh:
            return {"error": "Agent mesh not initialized."}

        # 1. Delegate to Oscar
        oscar = mesh.get_agent("oscar")
        draft_text = ""
        image_prompt = ""
        campaign_started = time.monotonic()
        oscar_ms = heimdall_ms = None
        if oscar:
            await notify("oscar_start")
            oscar_started = time.monotonic()
            msg = PeerMessage({
                "task": "write_blog", 
                "transcript": transcript,
                "system_prompt": system_prompt,
                "description": description,
                "word_count": word_count,
                "ai_provider": ai_provider,
                "ai_model": ai_model,
                "source_count": source_count,
                "source_types": source_types or [],
                "brief": brief or None
            })
            oscar_result = await oscar.on_peer_request(msg)
            if oscar_result.get("status") == "success":
                draft_text = oscar_result.get("draft")
                import re
                match = re.search(r"<image_prompt>(.*?)</image_prompt>", draft_text, re.DOTALL | re.IGNORECASE)
                if match:
                    image_prompt = match.group(1).strip()
                    draft_text = draft_text.replace(match.group(0), "").strip()
            else:
                return {"error": f"OscarAgent failed: {oscar_result.get('error')}"}
            oscar_ms = int((time.monotonic() - oscar_started) * 1000)
            await notify("oscar_done")
        else:
            return {"error": "OscarAgent not found in the mesh."}

        # 2. Huginn research pass: verified outbound citations + internal links
        # to the workspace's published articles. Fail-open like everything
        # downstream of Oscar — a research failure never costs the user links'
        # worth of latency or the draft itself.
        huginn = mesh.get_agent("huginn")
        huginn_ms = None
        citation_count = 0
        if huginn and draft_text:
            self._logger.info("Odin sending the draft to Huginn for citation research...")
            await notify("huginn_start")
            huginn_started = time.monotonic()
            try:
                hg_result = await huginn.on_peer_request(PeerMessage({
                    "task": "enrich_citations",
                    "draft": draft_text,
                    "internal_links": internal_links or [],
                }))
                huginn_ms = int((time.monotonic() - huginn_started) * 1000)
                if hg_result.get("status") == "success" and hg_result.get("draft"):
                    draft_text = hg_result["draft"]
                    citation_count = len(hg_result.get("citations") or []) + len(hg_result.get("internal") or [])
                    # Honest stage lines: "woven in" only when links landed.
                    await notify("huginn_done" if citation_count else "huginn_none")
                else:
                    self._logger.warning(f"Huginn research skipped: {hg_result.get('error')}")
                    await notify("huginn_skipped")
            except Exception as e:
                self._logger.warning(f"Huginn research failed open: {e}")
                await notify("huginn_skipped")

        # 3. Heimdall quality gate: correctness, fidelity to the transcript, tone,
        # de-AI. Strictly fail-open — a QA failure never costs the user the draft.
        qa_report = None
        heimdall = mesh.get_agent("heimdall")
        if heimdall and draft_text:
            self._logger.info("Odin passing the draft to Heimdall for review...")
            await notify("heimdall_start")
            heimdall_started = time.monotonic()
            try:
                hm_result = await heimdall.on_peer_request(PeerMessage({
                    "task": "review_draft",
                    "draft": draft_text,
                    "transcript": transcript,
                    "system_prompt": system_prompt,
                }))
                heimdall_ms = int((time.monotonic() - heimdall_started) * 1000)
                if hm_result.get("status") == "success" and hm_result.get("draft"):
                    draft_text = hm_result["draft"]
                    qa_report = hm_result.get("qa_report")
                    await notify("heimdall_done")
                else:
                    self._logger.warning(f"Heimdall review skipped: {hm_result.get('error')}")
                    await notify("heimdall_skipped")
            except Exception as e:
                self._logger.warning(f"Heimdall review failed open: {e}")
                await notify("heimdall_skipped")

        obs_event(
            "campaign.completed",
            sources=source_count,
            draftChars=len(draft_text),
            heimdallReviewed=bool(qa_report),
            citations=citation_count,
            oscarMs=oscar_ms,
            huginnMs=huginn_ms,
            heimdallMs=heimdall_ms,
            totalMs=int((time.monotonic() - campaign_started) * 1000),
        )
        # litellm fires usage callbacks as background tasks; yield briefly so
        # the last call's record lands in the accumulator before we summarize.
        await asyncio.sleep(0.05)
        return {
            "draft": draft_text,
            "imagePrompt": image_prompt,
            "qaReport": qa_report,
            "usage": request_usage_summary(),
            "social": None
        }

    async def on_peer_request(self, msg: PeerMessage):
        usage_set_agent("odin")
        task = msg.data.get("task")
        if task == "chat":
            return await self.handle_chat(msg)
        return {"error": "Unknown task"}

    async def handle_chat(self, msg: PeerMessage):
        """Conversational Art Director. Talks the concept through, and when the
        user approves, delegates generation to Hermes via a native tool call."""
        usage_set_agent("odin")
        message = msg.data.get("message")
        system_prompt = msg.data.get(
            "system_prompt",
            "You are Odin, the orchestrator and Art Director."
        )
        context = msg.data.get("context", {})
        history = context.get("history", [])

        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": message})

        tools = [{
            "type": "function",
            "function": {
                "name": "delegate_to_hermes",
                "description": (
                    "Delegate cover image generation to Hermes, the specialist image "
                    "generation agent. Call this only once the user has approved an image "
                    "concept and wants the image generated."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "optimized_prompt": {
                            "type": "string",
                            "description": (
                                "A highly detailed, optimized image-generation prompt that "
                                "captures the agreed concept. Specify subject, style, mood, "
                                "lighting and a 16:9 aspect ratio."
                            )
                        }
                    },
                    "required": ["optimized_prompt"]
                }
            }
        }]

        try:
            response = await litellm.acompletion(
                model=_gemini_litellm_model(),
                messages=messages,
                tools=tools,
                tool_choice="auto",
                vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                vertex_location=os.getenv("VERTEX_LOCATION", "global")
            )
            choice = response.choices[0].message
            answer = choice.content or ""
            img_url = None

            tool_calls = getattr(choice, "tool_calls", None)
            if tool_calls:
                import json
                for tc in tool_calls:
                    if tc.function.name != "delegate_to_hermes":
                        continue
                    try:
                        args = json.loads(tc.function.arguments or "{}")
                    except Exception:
                        args = {}
                    optimized_prompt = args.get("optimized_prompt", "").strip()
                    if not optimized_prompt:
                        continue

                    mesh = self._mesh
                    hermes = mesh.get_agent("designer") if mesh else None
                    if not hermes:
                        answer += "\n\nHermes (designer) agent is not available in the mesh."
                        continue

                    hermes_msg = PeerMessage({"task": "generate_image", "prompt": optimized_prompt})
                    img_result = await hermes.on_peer_request(hermes_msg)
                    if img_result.get("status") == "success":
                        img_url = img_result.get("url")
                    else:
                        answer += f"\n\nFailed to generate image: {img_result.get('error')}"

                if not answer:
                    answer = "Here is the cover image I generated." if img_url else "I attempted to generate the image."

            response_data = {"status": "success", "answer": answer}
            if img_url:
                response_data["imageUrl"] = img_url
            return response_data
        except Exception as e:
            self._logger.error(f"Odin chat error: {e}")
            return {"error": str(e)}

    def _build_chat_request(self, msg: PeerMessage):
        """Shared message + tool construction for chat and stream_chat."""
        message = msg.data.get("message")
        system_prompt = msg.data.get(
            "system_prompt",
            "You are Odin, the orchestrator and Art Director."
        )
        context = msg.data.get("context", {})
        history = context.get("history", [])

        messages = [{"role": "system", "content": system_prompt}]
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": message})

        tools = [{
            "type": "function",
            "function": {
                "name": "delegate_to_hermes",
                "description": (
                    "Delegate cover image generation to Hermes, the specialist image "
                    "generation agent. Call this only once the user has approved an image "
                    "concept and wants the image generated."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "optimized_prompt": {
                            "type": "string",
                            "description": (
                                "A highly detailed, optimized image-generation prompt that "
                                "captures the agreed concept. Specify subject, style, mood, "
                                "lighting and a 16:9 aspect ratio."
                            )
                        }
                    },
                    "required": ["optimized_prompt"]
                }
            }
        }]
        return messages, tools

    async def stream_chat(self, msg: PeerMessage):
        """Streaming variant of handle_chat. Yields dict events:
          - {"type": "text", "content": str}    incremental answer tokens
          - {"type": "status", "content": str}  delegation / progress notices
          - {"type": "image", "url": str}        generated cover image
          - {"type": "error", "content": str}    failures
        """
        usage_set_agent("odin")
        import json
        messages, tools = self._build_chat_request(msg)

        try:
            response = await litellm.acompletion(
                model=_gemini_litellm_model(),
                messages=messages,
                tools=tools,
                tool_choice="auto",
                stream=True,
                vertex_project=os.getenv("GOOGLE_CLOUD_PROJECT"),
                vertex_location=os.getenv("VERTEX_LOCATION", "global")
            )

            tool_calls_acc = {}  # index -> {"name": str, "arguments": str}
            streamed_text = False

            async for chunk in response:
                choices = getattr(chunk, "choices", None)
                if not choices:
                    continue
                delta = choices[0].delta

                content = getattr(delta, "content", None)
                if content:
                    streamed_text = True
                    yield {"type": "text", "content": content}

                delta_tool_calls = getattr(delta, "tool_calls", None)
                if delta_tool_calls:
                    for tc in delta_tool_calls:
                        idx = getattr(tc, "index", 0) or 0
                        acc = tool_calls_acc.setdefault(idx, {"name": "", "arguments": ""})
                        fn = getattr(tc, "function", None)
                        if fn is not None:
                            if getattr(fn, "name", None):
                                acc["name"] = fn.name
                            if getattr(fn, "arguments", None):
                                acc["arguments"] += fn.arguments

            for acc in tool_calls_acc.values():
                if acc["name"] != "delegate_to_hermes":
                    continue
                try:
                    args = json.loads(acc["arguments"] or "{}")
                except Exception:
                    args = {}
                optimized_prompt = args.get("optimized_prompt", "").strip()
                if not optimized_prompt:
                    continue

                yield {"type": "status", "content": "Delegating to Hermes to generate the cover image..."}

                mesh = self._mesh
                hermes = mesh.get_agent("designer") if mesh else None
                if not hermes:
                    yield {"type": "text", "content": "\n\nHermes (designer) agent is not available in the mesh."}
                    continue

                hermes_msg = PeerMessage({"task": "generate_image", "prompt": optimized_prompt})
                img_result = await hermes.on_peer_request(hermes_msg)
                if img_result.get("status") == "success":
                    if not streamed_text:
                        yield {"type": "text", "content": "Here is the cover image I generated."}
                    yield {"type": "image", "url": img_result.get("url")}
                else:
                    yield {"type": "text", "content": f"\n\nFailed to generate image: {img_result.get('error')}"}
        except Exception as e:
            self._logger.error(f"Odin stream chat error: {e}")
            yield {"type": "error", "content": str(e)}
