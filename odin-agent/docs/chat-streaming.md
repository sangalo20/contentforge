# Chat Streaming — SSE Protocol

**Audience:** Engineers.  
**Purpose:** Document the `POST /api/v1/chat/stream` endpoint — request shape, event types, and how the frontend consumes it.

---

## Endpoint

```
POST http://localhost:8000/api/v1/chat/stream
Content-Type: application/json
```

Returns `Content-Type: text/event-stream` with headers:
```
Cache-Control: no-cache
X-Accel-Buffering: no
Connection: keep-alive
```

---

## Request body

```jsonc
{
  "message": "Hello Odin, I need a cover image...",
  "system_prompt": "You are Odin, the orchestrator...\n\n--- BLOG DRAFT ---\n...",
  "workflow_id": null,          // optional — for session continuity (not currently used)
  "agent_id": "odin",          // always "odin"
  "context": {
    "history": [               // prior conversation turns
      { "role": "assistant", "content": "..." },
      { "role": "user", "content": "..." }
    ]
  }
}
```

The `system_prompt` is constructed by the frontend (`ImageChatModal`) and includes the full blog draft between `--- BLOG DRAFT ---` delimiters. This gives Odin full context to propose relevant visual concepts.

---

## SSE event types

Each `data:` line is a JSON object. The stream closes after the final event.

### `text`

Incremental answer token from Odin. Append to the current assistant bubble.

```json
{ "type": "text", "content": "I see this article is about self-storage risk management." }
```

Multiple `text` events arrive in sequence and should be concatenated.

### `status`

A progress message shown while Odin is executing an action (e.g. waiting for Hermes). Display as a spinner pill; replace with new content as subsequent events arrive.

```json
{ "type": "status", "content": "Delegating to Hermes to generate the cover image..." }
```

### `image`

A generated cover image is ready. Display as an inline preview with Approve and Download buttons.

```json
{ "type": "image", "url": "https://imgen.x.ai/xai-imgen/xai-tmp-imgen-....jpeg" }
```

> **Important:** This URL is temporary. The user must click Approve promptly to trigger `PUT /api/library/:id/cover`, which downloads and permanently stores the bytes.

### `error`

A fatal error occurred. Append to the current assistant bubble as `**Error:** <content>`.

```json
{ "type": "error", "content": "400 from xAI: model not found" }
```

---

## Typical conversation flow

```
POST /api/v1/chat/stream
  "Hello Odin, I need a cover image for my blog post."

→ text: "I see this article is about..." (multiple tokens)
→ text: " I have two concept directions for you:\n\n1. ..."

[user replies: "I love concept 1, let's go"]

POST /api/v1/chat/stream (with history)
  "I love concept 1, let's go"

→ status: "Delegating to Hermes to generate the cover image..."
→ text:   "Here is the cover image I generated."
→ image:  { url: "https://imgen.x.ai/..." }
```

---

## Frontend integration (ImageChatModal)

The `streamChat` function in `ImageChatModal.jsx` consumes the stream:

```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split('\n');
  buffer = lines.pop() || '';   // keep incomplete line in buffer

  for (const line of lines) {
    if (!line.trim().startsWith('data:')) continue;
    const event = JSON.parse(line.trim().slice(5).trim());

    if (event.type === 'status') updateLast({ status: event.content });
    if (event.type === 'text')   { answer += event.content; updateLast({ content: answer, status: null }); }
    if (event.type === 'image')  updateLast({ imageUrl: event.url, status: null });
    if (event.type === 'error')  { answer += `\n\n**Error:** ${event.content}`; updateLast({ content: answer, status: null }); }
  }
}
```

`updateLast` mutates the last message in the `messages` array (the in-flight assistant bubble).

---

## Non-streaming fallback

The jarviscore router also mounts `POST /api/v1/chat` (non-streaming). This returns the complete `ChatResponse` JSON after the full response is ready. It is still accessible but the UI uses the streaming endpoint exclusively.
