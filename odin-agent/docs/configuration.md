# Configuration

**Audience:** Engineers and operators.  
**Purpose:** Document all environment variables for the Odin Agent service.

---

## Environment file — `odin-agent/.env`

Copy `.env.example` and fill in the values. The file is gitignored.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | — | Google AI Studio API key. Used by OdinAgent and LokiAgent. |
| `XAI_API_KEY` | Yes | — | xAI API key. Used by HermesAgent for Grok image generation. |
| `ANTHROPIC_API_KEY` | Conditional | — | Anthropic API key. Required if any workspace uses `aiProvider: Anthropic`. Passed through litellm. |
| `GEMINI_MODEL` | No | `gemini-3.1-pro-preview` | Gemini model name used by OdinAgent (chat) and LokiAgent. |
| `GEMINI_LITELLM_MODEL` | No | `gemini/<GEMINI_MODEL>` | LiteLLM-prefixed model string for Odin's litellm calls. Override if you need a non-default prefix. |
| `LOKI_MODEL` | No | `claude-sonnet-5` | Loki's primary generation model (social copy, revisions, studio chat). Bare names get an `anthropic/` prefix. |
| `LOKI_FALLBACK_MODEL` | No | Gemini routing (`gemini/`&#124;`vertex_ai/` + `GEMINI_MODEL`) | Backup model Loki tries once when the primary still fails after litellm retries. Every failover emits a WARNING log and an `llm.fallback` obs event. |
| `HEIMDALL_MODEL` | No | `claude-opus-4-8` | Heimdall's QA/copyedit model. |
| `XAI_IMAGE_MODEL` | No | `grok-imagine-image-quality` | Grok image generation model. |

### `.env.example`

```env
# Required
GEMINI_API_KEY=your-google-ai-studio-key
XAI_API_KEY=xai-...

# Optional — only needed for Claude models
ANTHROPIC_API_KEY=sk-ant-...

# Optional model overrides
GEMINI_MODEL=gemini-3.1-pro-preview
GEMINI_LITELLM_MODEL=gemini/gemini-3.1-pro-preview
LOKI_MODEL=claude-sonnet-5
# Backup model when the primary fails after retries (default: the Gemini routing above)
LOKI_FALLBACK_MODEL=gemini/gemini-3.1-pro-preview
HEIMDALL_MODEL=claude-opus-4-8
XAI_IMAGE_MODEL=grok-imagine-image-quality
```

---

## How model config is resolved

Model identifiers (`GEMINI_MODEL`, `LOKI_MODEL`, `LOKI_FALLBACK_MODEL`, `HEIMDALL_MODEL`, …) are resolved **per request** via the `_*_model_str()` helpers in `agents.py`, so changing them in the environment takes effect without a restart. Note that `.env` itself is only read at process start (`load_dotenv`), so edits to the file still need a restart — but an exported env-var change or a redeploy with new values applies immediately.

One exception, in `HermesAgent.setup()`:
```python
self.xai_image_model = os.getenv("XAI_IMAGE_MODEL", "grok-imagine-image-quality")
```
This is evaluated at agent startup — also requires a restart.

---

## Secrets hygiene

- `.env` is gitignored.
- Never pass API keys in chat messages, PR descriptions, or issue comments.
- Rotate any exposed key immediately: revoke at the provider dashboard, generate a new one, update `.env`, restart Odin.
