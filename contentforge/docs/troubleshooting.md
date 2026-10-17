# Troubleshooting

**Audience:** Engineers and operators.  
**Purpose:** Symptom → cause → fix for every known failure mode.

---

## Backend issues

### `Cannot PUT /api/library/:id/cover` — HTTP 404

**Cause:** The running `node server.js` process is stale — it was started before the cover route was added to `server.js`.

**Fix:** Restart the ContentForge backend.
```bash
lsof -ti :3005 | xargs kill && sleep 1 && node server.js
```

---

### `permission "create" required` at publish

**Cause:** The Sanity token in `.env` is read-only (Viewer). Uploading image assets and creating documents requires an **Editor** token.

**Fix:** Replace `SANITY_API_TOKEN_MOGULS` (or `_REAL_REP`) with an Editor token from manage.sanity.io → project → API → Tokens. Restart the backend. See [`configuration.md`](configuration.md#how-to-create-an-editor-token).

---

### `Failed to fetch library items` / Firestore FAILED_PRECONDITION

**Cause:** The Firestore composite index for `content_pipeline_library` (`workspaceId` + `createdAt desc`) does not exist yet.

**Fix:** Click the auto-index link in the error message (displayed in the browser console), or go to Firebase Console → Firestore → Indexes → create a composite index on `workspaceId` (ascending) + `createdAt` (descending) for the `content_pipeline_library` collection.

---

### Backend starts but ignores `.env` changes

**Cause:** `dotenv.config()` only reads the file at startup. Environment variable changes require a full restart.

**Fix:** Kill and restart `node server.js`.

---

## Odin Agent issues

### SSE replies not streaming (modal spins indefinitely)

**Causes (check in order):**
1. Odin Agent is not running on port 8000.
2. Odin was restarted without `source venv/bin/activate` — wrong Python environment.
3. A model or API key is missing from `.env`.

**Fix:**
```bash
lsof -ti :8000   # should return a PID
# If not running:
cd odin-agent && source venv/bin/activate
uvicorn main:app --port 8000 --reload
```

---

### Grok image generation returns 400

**Cause:** The xAI images endpoint (`/v1/images/generations`) does not accept a `size` parameter. Sending `size` causes a 400. It also requires `model` explicitly.

**Fix:** The payload must be exactly:
```json
{ "model": "grok-imagine-image-quality", "prompt": "...", "n": 1, "response_format": "url" }
```
No other fields. The current `agents.py` `generate_grok_image` method is already correct. If you see this error, check that no other code path is constructing the payload.

---

### Odin does not call `delegate_to_hermes` / never generates an image

**Cause:** The user's message didn't clearly approve a concept. Odin only calls the tool after explicit approval.

**Fix:** Send a message like *"Yes, let's go with that one"* or *"Generate it"*. Odin's few-shot examples in `prompts/odin.xml` demonstrate the expected flow.

**Alternative cause:** The Gemini model rejected the tool call schema. Check the Odin terminal logs for a litellm error.

---

### `HermesAgent not available in the mesh`

**Cause:** Odin's mesh was initialized without Hermes. This happens if `hermes = HermesAgent()` is missing from `main.py`'s lifespan list.

**Fix:** Confirm `main.py` includes both `odin` and `hermes` in the lifespan:
```python
app = FastAPI(lifespan=JarvisLifespan([odin, OscarAgent(), hermes, LokiAgent()], mode="p2p"))
```

---

### `.env` changes not picked up after `--reload`

**Cause:** `uvicorn --reload` watches Python file changes only, not `.env`.

**Fix:** Always do a full kill + restart after changing `.env`. See [`operations.md`](operations.md#odin-agent).

---

### Studio chat says "The AI service is briefly overloaded" / Loki switched models mid-chat

**Cause:** The primary model's provider returned a transient error (e.g. Anthropic 529 "Overloaded"). Loki retries via litellm, then fails over once to the fallback model (`LOKI_FALLBACK_MODEL`, defaulting to Gemini). During a mid-stream failover the chat clears the half-streamed reply and shows a "retrying with the backup model" status; the studio chat also offers a **Try again** button when both attempts fail.

**How to confirm:** Every failover emits a WARNING line and a structured `llm.fallback` event (with `primary`, `fallback`, and the raw error) in the Odin logs. Raw provider exceptions are never shown in the UI — check the logs for the underlying error.

**Fix:** Nothing to do for a one-off blip. If failovers are frequent, check Anthropic status or point `LOKI_MODEL`/`LOKI_FALLBACK_MODEL` at healthier models (see `../../odin-agent/docs/configuration.md`).

---

## Cover image issues

### Cover image saves but is not visible in the library card

**Cause:** The library data was loaded before the cover was approved. The `WorkspaceLibrary` component fetches on mount only.

**Fix:** Navigate away from the library tab and back, triggering a fresh `GET /api/library/:workspaceId` fetch.

---

### Cover proxy returns 404

**Cause:** The `coverImage.storagePath` on the Firestore doc refers to a Storage file that was deleted, or the Firestore `coverImage` field was cleared.

**Fix:** Re-approve a cover image to re-upload and update the reference.

---

### `Failed to download image (status 4xx/5xx)`

**Cause:** The Grok image URL expired before `PUT /api/library/:id/cover` was called. Grok temporary URLs (`xai-tmp-imgen-...`) have a short TTL.

**Fix:** Generate a new image in the Odin chat and approve it promptly.

---

## Frontend issues

### Odin's replies show raw `**bold**` / `## headings` instead of rendered Markdown

**Cause:** The `ImageChatModal` was rendering `msg.content` inside a plain `<p>` tag, bypassing the `ReactMarkdown` component.

**Status:** Fixed — `react-markdown` with `remark-gfm` is now used for all assistant messages in the chat modal.

---

### Toast notifications not showing

**Cause:** `<Toaster>` from `react-hot-toast` is not mounted. It must be inside the React tree.

**Fix:** Confirm `<Toaster position="bottom-right" />` is present in `src/App.jsx`'s `AppLayout` component.

---

## External API / MCP issues

### Every API call returns 401

**Cause:** Missing or invalid bearer credential — every `/api/*` route (minus the small public set) requires one. For scripts that's a `cfk_` key; `Invalid or revoked API key` means exactly that (revoked keys are rejected immediately).

**Fix:** Send `Authorization: Bearer cfk_...` with a key from Settings → API Keys. If it was revoked, mint a new one — plaintext keys are never recoverable.

---

### API key gets 403 on everything useful

**Cause (in order):** the key's `workspaceAccess` is empty (the default at mint — no legacy "all" fallback); the action is human-only (any delete, or credential management — keys are rejected there **by design**, regardless of role); or publish requires the `admin` role the key doesn't carry.

**Fix:** Re-mint with the right workspace scope/role. Deletion has no fix — it is deliberately impossible for keys.

---

### v1 generation job stuck in `queued` / `running`

**Cause:** Jobs run in-process; a backend restart mid-job orphans it, and Cloud Run request-based CPU throttling stalls it between requests.

**Fix:** Resubmit (duplicate detection makes this safe). For the throttling case, deploy with CPU always allocated — see [`operations.md`](operations.md#a-v1-generation-job-looks-stuck).

---

### MCP client can't connect to `/api/v1/mcp`

**Causes:** the client isn't sending the Authorization header (Claude Code needs `--transport http ... --header "Authorization: Bearer cfk_..."`); or the client doesn't support custom headers on remote servers at all (some Claude Desktop / claude.ai connector setups) — bridge with `npx mcp-remote <url> --header ...`. Also note the endpoint speaks MCP JSON-RPC only; a plain GET returning 405 is correct behavior.

---

## General

### Port already in use

```bash
# Find what's on the port
lsof -ti :3005   # or :8000
ps -o pid,command -p <PID>

# Kill it
kill <PID>          # graceful
kill -9 <PID>       # force
```

### gcloud ADC expired

```bash
gcloud auth application-default login
```
Re-run if you see `UNAUTHENTICATED` or `credentials expired` errors from firebase-admin.
