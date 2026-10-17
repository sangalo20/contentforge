# Image Generation

**Audience:** Engineers.  
**Purpose:** Document how Hermes generates images via the xAI Grok API.

---

## Flow

```
OdinAgent.stream_chat
  → litellm streaming (tool_choice: auto)
  → Gemini emits delegate_to_hermes tool call
  → OdinAgent.stream_chat yields {type: status}
  → HermesAgent.on_peer_request {task: generate_image, prompt: optimized_prompt}
  → HermesAgent.generate_grok_image(prompt)
  → POST https://api.x.ai/v1/images/generations
  → returns {status: success, url: "https://imgen.x.ai/..."}
  → OdinAgent yields {type: image, url}
```

---

## API call

```python
POST https://api.x.ai/v1/images/generations
Authorization: Bearer <XAI_API_KEY>
Content-Type: application/json

{
  "model": "grok-imagine-image-quality",
  "prompt": "Cinematic top-down drone shot of a storage facility...",
  "n": 1,
  "response_format": "url"
}
```

### Critical constraints

| Rule | Reason |
| --- | --- |
| `model` is **required** | The endpoint returns 400 without it |
| Do **not** send `size` | Not accepted — causes 400 |
| `response_format: "url"` | Returns a URL instead of base64 |

### Response

```json
{
  "data": [
    { "url": "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-<uuid>.jpeg" }
  ]
}
```

The returned URL is **temporary**. The ContentForge backend (`PUT /api/library/:id/cover`) must download the bytes immediately after the user clicks Approve.

---

## Model selection

The Grok model is configured via:

```env
XAI_IMAGE_MODEL=grok-imagine-image-quality
```

The fallback in `agents.py` is also `grok-imagine-image-quality`. To switch models (e.g. to `grok-imagine-image` for lower quality/faster generation), update the env var and restart Odin.

---

## Error handling

`generate_grok_image` surfaces the xAI error body if the request fails:

```python
if not response.ok:
    detail = response.text
    try:
        detail = response.json().get("error", detail)
    except:
        pass
    return {"error": f"{response.status_code} from xAI: {detail}"}
```

The error is propagated back to OdinAgent's `stream_chat`, which yields it as:
```json
{ "type": "text", "content": "\n\nFailed to generate image: 400 from xAI: ..." }
```

---

## Prompt quality guidelines

Odin's `prompts/odin.xml` encodes the rules for optimized image prompts. Hermes is a pure executor — prompt quality is entirely Odin's responsibility.

A good prompt includes all of:
- **Subject** — what is in the image
- **Medium** — photography, digital art, oil painting, etc.
- **Lighting** — cinematic, golden hour, neon, etc.
- **Mood** — tense, serene, futuristic, etc.
- **Aspect ratio** — always `16:9` or `landscape orientation` for blog covers

Example:
```
Cinematic, top-down drone shot of a massive, modern self-storage facility at golden hour.
Long dramatic shadows, photorealistic, 8k resolution, highly detailed,
architectural photography, 16:9 aspect ratio.
```
