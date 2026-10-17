# Agents

**Audience:** Engineers.  
**Purpose:** Describe each agent's role, what tasks it handles, and which model it uses.

---

## Architecture

All agents are registered on a jarviscore P2P mesh at startup. They communicate via `PeerMessage` objects (a lightweight dict wrapper). Odin is the entry point — external requests arrive at Odin and are dispatched to specialist agents.

```
External caller
      │
      ▼
 OdinAgent (orchestrator)
      ├──► OscarAgent    (writing — via process_campaign)
      ├──► HermesAgent   (image generation — via delegate_to_hermes tool call)
      └──► LokiAgent      (social copy — LinkedIn/X syndication)
```

---

## OdinAgent

**Role:** `"odin"` — Orchestrator and Art Director.

**Responsibilities:**
- Entry point for all external chat requests (`POST /api/v1/chat/stream`).
- Orchestrates the campaign generation flow (`POST /api/v1/tasks/generate-campaign`).
- Acts as Art Director in the cover image chat: proposes visual concepts, then uses the `delegate_to_hermes` native tool call to trigger image generation when the user approves.

**Model:** `GEMINI_MODEL` (default `gemini-3.1-pro-preview`) via `google-genai` for campaign generation; `GEMINI_LITELLM_MODEL` via litellm for chat (tool calls + streaming).

**Key methods:**

| Method | Description |
| --- | --- |
| `process_campaign(transcript, ...)` | Delegates to OscarAgent, extracts `<image_prompt>` tag, returns `{draft, imagePrompt}` |
| `handle_chat(msg)` | Non-streaming conversational chat with `delegate_to_hermes` tool |
| `stream_chat(msg)` | Streaming version — yields `text`/`status`/`image`/`error` events |
| `_build_chat_request(msg)` | Shared message + tool schema construction |

**Persona:** Defined in `prompts/odin.xml`. See [`personas.md`](personas.md).

---

## OscarAgent

**Role:** `"oscar"` — The Writer.

**Responsibilities:**
- Receives a raw transcript and a workspace persona/system prompt.
- Calls litellm to produce a Markdown blog post.
- Appends an `<image_prompt>...</image_prompt>` block at the end for Odin to extract.

**Model:** Configurable per call — uses the workspace's `aiProvider`/`aiModel`. litellm handles routing to Anthropic, Google, or OpenAI based on the provider prefix.

**Task:** `write_blog`

**Key behavior:**
- The system prompt is composed of Oscar's base XML persona + the workspace persona + word count instruction.
- The model string is auto-prefixed (`anthropic/`, `gemini/`, `openai/`) if no prefix is present.
- The `<image_prompt>` tags are stripped from the draft by OdinAgent before saving.

**Persona:** Defined in `prompts/oscar.xml`. See [`personas.md`](personas.md).

---

## HermesAgent

**Role:** `"designer"` — The Image Generator.

**Responsibilities:**
- Receives an image generation prompt from Odin.
- Calls the xAI Grok API (`/v1/images/generations`).
- Returns the generated image URL.

**Model:** `XAI_IMAGE_MODEL` (default `grok-imagine-image-quality`).

**Tasks:**

| Task | Behavior |
| --- | --- |
| `generate_image` | Uses the `prompt` or `optimized_prompt` field directly |
| `generate_hero_image` | Auto-generates a prompt from the first 500 chars of a `draft` |

**API constraints:**
- The xAI endpoint requires `model` — omitting it returns 400.
- Do **not** send a `size` parameter — it is not accepted and causes 400.
- `response_format: "url"` returns a temporary URL (`xai-tmp-imgen-...`). The backend must download the bytes immediately.

**No persona file** — Hermes is a pure tool executor with no conversational behavior.

---

## LokiAgent

**Role:** `"loki"` — The Syndicator.

**Responsibilities:**
- Takes a completed, approved article draft.
- Rewrites it into platform-native social copy for LinkedIn or X.
- Runs a strict pipeline: writing-craft gate -> humanizer gate -> voice (persona) -> CTA (function) -> final cold re-read.

**Model:** `GEMINI_MODEL` via `google-genai`, with `response_mime_type="application/json"`.

**Task:** `generate_social_copy` (legacy alias: `syndicate`)

**Three levers (all read from the request):**

| Field | Meaning | Source |
| --- | --- | --- |
| `persona_prompt` | WHO is speaking (voice, "I" vs "we") | Per-workspace `socialPersonas` |
| `function` | The JOB of the post: `teach` / `sell` / `entertain` / `inspire` | System constant `SOCIAL_FUNCTIONS` |
| `channel` | `linkedin` or `x` | Request |
| `format` | Optional structural hint (Text-only, PDF Carousel, ...) | Request |

**Output:** a JSON object. For LinkedIn: `{channel, post, cta}`. For X: `{channel, thread[], cta}`.

**Persona:** Defined in `prompts/loki.xml`. See [`personas.md`](personas.md).
