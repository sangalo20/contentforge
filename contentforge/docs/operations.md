# Operations

**Audience:** Engineers and operators.  
**Purpose:** Runbooks for common operational tasks.

---

## Restarting services

### ContentForge Backend
```bash
# Find and kill the old process
lsof -ti :3005 | xargs kill 2>/dev/null
sleep 1
# Start fresh
cd contentforge/backend
node server.js
```

### Odin Agent
```bash
lsof -ti :8000 | xargs kill -9 2>/dev/null
sleep 1
cd odin-agent
source venv/bin/activate
uvicorn main:app --port 8000 --reload
```

> **When to restart Odin:** Always restart after editing `agents.py`, `main.py`, or `.env`. The `--reload` flag watches Python files, but does **not** reload `.env` changes.

### Frontend
Press `Ctrl+C` in the Vite terminal, then `npm run dev` again. Hot Module Replacement handles most code changes automatically.

---

## Rotating a Sanity token

1. Go to [manage.sanity.io](https://manage.sanity.io) → select the project.
2. **API → Tokens** → locate the old token → **Revoke**.
3. Click **Add API token** → set permission to **Editor** → copy the new value.
4. Edit `contentforge/backend/.env`:
   ```
   SANITY_API_TOKEN_MOGULS=sk...newtoken...
   ```
5. Restart the ContentForge backend.

Do the same for `SANITY_API_TOKEN_REAL_REP` (project `l4nrg0gu`) if that token also needs rotation.

---

## Rotating an xAI / Grok API key

1. Generate a new key at [console.x.ai](https://console.x.ai).
2. Edit `odin-agent/.env`:
   ```
   XAI_API_KEY=xai-newkey...
   ```
3. Restart the Odin Agent (`.env` change requires full restart, not just `--reload`).

---

## Changing the AI model

### Odin's chat/ideation model (Gemini)

Edit `odin-agent/.env`:
```env
GEMINI_MODEL=gemini-3.1-pro-preview
```
Restart Odin. The model is read at import time via `os.getenv`.

### Oscar's writing model

Controlled per-workspace via `data/workspaces.json` (`aiProvider` + `aiModel` fields), which is editable from the **Config & Persona** screen in the web app. No restart needed.

### Grok image generation model

Edit `odin-agent/.env`:
```env
XAI_IMAGE_MODEL=grok-imagine-image-quality
```
Restart Odin.

---

## Clearing a stuck cover image

If a cover image upload is in a bad state (old Storage file, stale Firestore reference):

1. In the web app, open the library item → click **Generate Cover Image** → generate a new image → approve it.
   - This calls `PUT /api/library/:id/cover` which overwrites the Storage file at the same path and refreshes the Firestore record.

Or manually via the Firebase console:
1. Firebase Console → Storage → `content-pipeline/covers/` → delete `<itemId>.jpg`.
2. Firestore → `content_pipeline_library` → find the document → delete the `coverImage` field.

---

## Clearing/deleting a library item

**Individual social assets** (posts, carousels, posters) are deletable from the
Social Library UI: drafts/finalized pieces hard-delete (trash icon, two-step
confirm); approved pieces archive instead — approver or admin only (see
`docs/api-reference.md` → `/api/socials/delete` and `/api/socials/archive`).

A **whole library item** is deleted from the UI (admin only): the item viewer's
delete action calls `DELETE /api/library/:id`, which also removes the item's
comments and its cover image from Storage. Deletion is **human-only** — the
route rejects API keys regardless of role, so no script or agent can ever
delete content. Already-published Sanity documents are not touched: remove
`_id: cp-<firestoreDocId>` in Sanity Studio separately if needed.

---

## Publishing a draft manually (bypass UI)

Every `/api/*` route requires a bearer credential. For scripting, mint an
admin-role API key (Settings → API Keys) and use the v1 verb:

```bash
curl -X POST http://localhost:3005/api/v1/items/<firestoreDocId>/publish \
  -H 'Authorization: Bearer cfk_...'
```

(The legacy `POST /api/publish` with `{"libraryId": "..."}` works identically —
both run `lib/publishArticle.js`, including the review gate on `requireReview`
workspaces.)

---

## API keys — mint, scope, revoke

1. Web app → **Settings → API Keys** (admin only, and only from a real signed-in
   session — keys cannot manage keys).
2. **Mint**: name it after the holder, pick the role (`creator` unless the key
   must publish → `admin`), scope it to exactly the workspaces it needs
   (default: none).
3. Copy the `cfk_…` token **immediately** — it is shown once and only its hash
   is stored.
4. **Revoke** from the same tab; revoked keys stay listed as an audit trail and
   are rejected at the next request.

Connect an agentic workbench via MCP:
```bash
claude mcp add contentforge --transport http \
  https://<host>/api/v1/mcp --header "Authorization: Bearer cfk_..."
```

---

## A v1 generation job looks stuck

Jobs (`content_pipeline_jobs`) run in-process on the backend instance that
accepted them. A job frozen in `queued`/`running` for far longer than a normal
generation (~10 min worst case) usually means:

1. **The instance was restarted/redeployed mid-job** — the job will never
   finish. Resubmit; the duplicate check makes resubmits safe (an
   already-generated source combination returns the existing item).
2. **Cloud Run is throttling CPU between requests** — jobs need
   **CPU always allocated** (or min-instances with instance billing). See
   [`configuration.md`](configuration.md) → `V1_MAX_ACTIVE_JOBS`.
3. Submits returning `429 rate_limited` mean the per-instance concurrency cap
   (`V1_MAX_ACTIVE_JOBS`, default 3) is full of *live* jobs — wait one out.

---

## Legacy status migration (one-time backfill)

`backend/scripts/migrate-legacy-statuses.js` backfills the four legacy data
generations in `content_pipeline_library` (see TECH_DEBT #1). Dry-run by
default; `--apply` writes to production Firestore and **requires sign-off**:

```bash
cd contentforge/backend
node scripts/migrate-legacy-statuses.js           # dry run — prints every change
node scripts/migrate-legacy-statuses.js --apply   # writes (after sign-off)
```

After applying: spot-check the dashboard and Social Library, then sweep the
read-time normalizers listed in TECH_DEBT #1.

---

## Checking which process is on a port

```bash
lsof -ti :3005   # → PID if occupied
lsof -ti :8000
ps -o pid,command -p <PID>   # → see what the process is
```

---

## Verifying ADC (Application Default Credentials)

```bash
gcloud auth application-default print-access-token
# Should print a token. If it errors, run:
gcloud auth application-default login
```

The backend uses ADC via `firebase-admin`'s `applicationDefault()` for Firestore and Storage access.
