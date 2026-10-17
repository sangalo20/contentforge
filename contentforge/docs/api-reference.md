# API Reference

**Audience:** Engineers and integrators.  
**Purpose:** Complete reference for every backend route (`contentforge/backend/routes/*.js`, mounted by `server.js`).

Base URL (local): `http://localhost:3005`

---

## Authentication

Every `/api/*` route (minus the small public set in `lib/authenticate.js`: health, config, cover-image proxies, invite validation/acceptance) requires a bearer credential:

```
Authorization: Bearer <credential>
```

Two credential types resolve to the same auth context (`req.user` with `role`, `workspaceAccess`, `reviewerWorkspaces`), so all routes behave identically under either:

- **Firebase ID token** — what the SPA sends; obtained via browser login, ~1 hour lifetime.
- **API key** (`cfk_…`) — long-lived machine credential for scripts/workbenches, minted by an admin in **Settings → API Keys** (or via the routes below). Keys carry their own role (`admin` or `creator`, never `owner`) and workspace scope. Requests authenticated by key have `req.user.apiKey` set and are refused by two route classes regardless of the key's role (`requireHumanSession`): **credential management** (users, invites, API keys — a key can never mint or modify credentials) and **content deletion** (`DELETE /api/library/:id`, `POST /api/socials/delete` — a key can never destroy content; deletion is a human act, done from the UI).

Example:

```bash
curl -H "Authorization: Bearer cfk_xxx" http://localhost:3005/api/library/my-workspace
```

---

## API keys

Admin-only, and only from an interactive session (requests authenticated by an API key get `403`). Backed by `content_pipeline_api_keys` (see [data-model.md](data-model.md)); only the SHA-256 hash of a key is stored.

### `POST /api/api-keys`

Mint a key. The plaintext `token` appears in this response **once** and is never retrievable again.

**Request**
```json
{
  "name": "Sam's workbench",
  "role": "creator",              // "creator" (default) | "admin" — owner is not allowed
  "workspaceAccess": ["ws-id"],   // "all" | array of workspace ids (default: [] — no access)
  "reviewerWorkspaces": []        // optional, same shape; default []
}
```

**Response 201**
```json
{
  "id": "…", "name": "Sam's workbench", "display": "cfk_ab12cd34…wxyz",
  "role": "creator", "workspaceAccess": ["ws-id"], "reviewerWorkspaces": [],
  "createdBy": "admin@x.com", "createdAt": "…", "lastUsedAt": null, "revokedAt": null,
  "token": "cfk_<plaintext — shown only here>"
}
```

### `GET /api/api-keys`

List all keys (active first, newest first). Returns the public shape above **without** `token` or the stored hash; `display` identifies a key after minting.

### `DELETE /api/api-keys/:id`

Revoke a key. Soft delete: the doc keeps its audit fields (`createdBy`, `lastUsedAt`, plus `revokedAt`/`revokedBy`), but authentication rejects the key immediately.

---

## External API v1

The machine-facing pipeline surface (`backend/routes/v1.js`) — a small set of stable verbs meant for scripts and workbenches, usable with either credential type (API keys are the expected one). It differs from the app routes in three deliberate ways:

1. **Job-style async instead of SSE.** Generation returns `202` with a job id; poll `GET /api/v1/jobs/:id`.
2. **Normalized responses.** Item shapes are stable and never expose the legacy Firestore fields (`youtubeUrls`/`titles`/`transcript`, `pending_approval`, missing statuses) — normalization mirrors `scripts/migrate-legacy-statuses.js`, so v1 clients are unaffected when that migration lands (TECH_DEBT #1) **and must stay unaffected after it** (see the v1 compatibility entry in TECH_DEBT).
3. **Structured errors.** Every error is `{ "error": { "code": "...", "message": "..." } }` with codes `invalid_request`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `upstream`, `internal`.

The typical loop: `GET /workspaces` → `POST /generations` → poll `GET /jobs/:id` → `GET /items/:id` → (edit out of band) → `POST /items/:id/finalize` → `POST /items/:id/publish`. Articles written *outside* the forge skip generation entirely: `POST /items` imports a finished draft as-is, then the same finalize/review/publish verbs apply. Where humans are in the loop: `POST /items/:id/review` hands finalized work to tagged reviewers, and `POST /items/:id/comments` tags people on an item. Social syndication: `POST /items/:id/socials` → `GET /items/:id/socials/:channel` / `GET /workspaces/:id/socials`.

**Deliberately not in v1:** deletion (human-only, see Authentication), review *decisions* (approve/request-changes is a human flow in the app), and agent chat (the SSE studio/chat routes technically accept a key but are browser-shaped and not a frozen contract).

**The contract is machine-checked.** `docs/openapi.v1.json` is the frozen v1 spec; `backend/tests/openapi.contract.test.mjs` fails CI if the spec and the router ever disagree. Internally, every verb lives in `lib/v1Operations.js` and is served by two thin surfaces that cannot drift: the REST router (`routes/v1.js`) and the MCP endpoint below (`routes/mcp.js`).

### MCP — `/api/v1/mcp`

The remote MCP endpoint (Streamable HTTP, stateless JSON mode): agentic workbenches connect once and see the pipeline as native tools — no hand-written HTTP calls, no per-session re-explaining. Authentication is the same bearer credential as REST; all key safeguards (workspace scoping, human-only deletion, no credential minting) apply identically, and there deliberately is **no delete tool**.

**Connect from Claude Code** (one command per user, with their own key):
```bash
claude mcp add contentforge --transport http \
  https://contentforge.storagemoguls.ai/api/v1/mcp \
  --header "Authorization: Bearer cfk_xxx"
```

**Clients without custom-header support** (some Claude Desktop / claude.ai connector setups expect OAuth for remote servers): bridge through [`mcp-remote`](https://www.npmjs.com/package/mcp-remote), which runs locally and forwards the header:
```json
{ "mcpServers": { "contentforge": {
  "command": "npx",
  "args": ["mcp-remote", "https://contentforge.storagemoguls.ai/api/v1/mcp",
           "--header", "Authorization: Bearer ${CONTENTFORGE_KEY}"],
  "env": { "CONTENTFORGE_KEY": "cfk_xxx" }
} } }
```

**Tools** (each wraps the v1 operation of the same shape): `list_workspaces`, `submit_generation`, `get_job`, `list_items`, `get_item`, `import_article`, `finalize_item`, `publish_item`, `list_reviewers`, `submit_review`, `list_comments`, `post_comment`, `list_socials`, `get_social`, `generate_social`.

Transport notes: stateless — every POST builds a fresh per-request server bound to the caller's identity, so no session affinity is needed across Cloud Run instances; responses are plain JSON (`enableJsonResponse`); GET/DELETE return 405.

### `GET /api/v1/workspaces`

Workspaces the credential can generate into (non-archived, within its `workspaceAccess`).

**Response 200**
```json
{ "workspaces": [ { "id": "ws-id", "name": "…", "description": null, "requireReview": false } ] }
```

### `POST /api/v1/generations`

Submit sources for generation. Same body contract as `POST /api/generate/content` (`workspaceId`, `sources[]`, optional `brief`); validation failures return synchronously. The duplicate check runs inside the job — resubmitting an already-generated source combination **succeeds** with `result.existing: true`.

Concurrency is capped per instance (`V1_MAX_ACTIVE_JOBS`, default 3); beyond it the submit returns `429 rate_limited` — retry after a running job finishes.

**Rate limiting (all machine traffic):** every request authenticated by an API key — any route, REST or MCP — passes a per-key token bucket (`API_KEY_RATE_LIMIT`, default 120 requests/min per instance). Over the limit: `429` with the standard envelope and a `Retry-After` header. Human sessions are never rate-limited. Social generation additionally carries a concurrency cap (`MAX_ACTIVE_SOCIAL_GENERATIONS`, default 3).

**Response 202**
```json
{ "job": { "id": "…", "status": "queued", "workspaceId": "ws-id" } }
```

### `GET /api/v1/jobs/:id`

Poll a job. `status` is `queued | running | succeeded | failed`. `stages` carries the same progress lines the app shows in the Forge. On failure, `errorKind` is `source` (caller-fixable: bad URL, over budget) or `internal`.

**Response 200**
```json
{
  "job": {
    "id": "…", "type": "generation", "status": "succeeded", "workspaceId": "ws-id",
    "stages": [ { "at": "2026-08-29T10:00:00.000Z", "level": "info", "message": "Starting pipeline…" } ],
    "result": { "itemId": "…", "existing": false },
    "error": null,
    "createdAt": "…", "startedAt": "…", "finishedAt": "…"
  }
}
```

### `GET /api/v1/workspaces/:id/items`

Normalized item summaries, newest first; social-only (original-idea) items are excluded. Query params: `status` (`draft | finalized | in_review | approved | published`, applied after normalization), `limit` (default 50, max 100), `cursor` (the previous page's last item id; `nextCursor` in the response is `null` on the final page).

**Response 200**
```json
{
  "items": [ {
    "id": "…", "workspaceId": "ws-id", "status": "draft", "title": "…",
    "sources": [ { "type": "youtube", "url": "…", "title": "…" } ],
    "coverImageUrl": null, "sanityId": null,
    "createdAt": "…", "updatedAt": "…"
  } ],
  "nextCursor": null
}
```

### `GET /api/v1/items/:id`

One item, the summary shape plus `draft` (markdown), `imagePrompt`, and `qaReport`.

### `POST /api/v1/items`

Import a finished article **as-is** — no AI rewriting, no persona pass. For work written outside the forge (a workbench, another tool). The item lands with `status: "draft"` and `sources: [{ "type": "import", … }]` for provenance, then the normal lifecycle applies (finalize → review → publish, social syndication, covers).

**Request**
```json
{
  "workspaceId": "ws-id",
  "draft": "# My Title\n\nThe article markdown…",   // H1 becomes the title
  "title": "…"                                        // optional fallback when the draft has no H1
}
```

The draft body is stored verbatim (the `title` param is recorded, never injected into the markdown). Max 400,000 characters. `400` when the draft is missing/empty or no title is derivable.

**Response 201:** `{ "item": { …normalized item, "status": "draft" } }`

### `POST /api/v1/items/:id/finalize`

The "done editing" verb. Optional body `{ "draft": "…" }` replaces the draft body; omitted, the stored draft is kept. Only `draft`/`finalized` items may be finalized — `in_review`, `approved`, and `published` return `409 conflict` (reviewer approval is a human flow; v1 never yanks an item out of it).

**Response 200:** `{ "item": { "id": "…", "status": "finalized" } }`

### `POST /api/v1/items/:id/publish`

Publish to the workspace's Sanity site. Admin role required (an API key may carry it). Shares the exact publish implementation and review gate with `POST /api/publish` (`lib/publishArticle.js`): where the workspace has `requireReview`, only `approved`/`published` items pass.

**Response 200:** `{ "item": { "id": "…", "status": "published", "sanityId": "cp-…", "title": "…" } }`

### `GET /api/v1/workspaces/:id/reviewers`

The users holding a reviewer grant for this workspace — the people taggable on a review submission.

**Response 200:** `{ "reviewers": [ { "uid": "…", "email": "…" } ] }`

### `POST /api/v1/items/:id/review`

Submit finalized content for human review. Everywhere v1 takes people (`reviewers` here, `mentions` on comments), entries may be **uids or emails** — emails resolve against the membership; an unknown email is a `400`, never a silent drop.

**Request**
```json
{
  "reviewers": ["reviewer@x.com"],   // required; uids or member emails
  "note": "please check tone",        // optional
  "kind": "article",                  // default; or "text" | "carousel" | "poster" (social pieces)
  "channel": "linkedin"               // required for social kinds ("linkedin" | "x")
}
```

Content must be finalized first (`422 conflict` otherwise). Reviewers must hold a reviewer grant for the workspace. Tagged reviewers get bell + email notifications; the piece moves to `in_review`. Re-submitting while in review updates the active review (requester or admin only). The **decision** (approve / request changes) stays a human flow in the app.

**Response 200:** `{ "review": { "status": "in_review", "reviewers": ["uid"], "note": "…" } }`

### `GET | POST /api/v1/items/:id/comments`

Read an item's comment thread, or post to it. `mentions` (uids or emails) is how a machine tags a person on an article — mentioned members get bell + email notifications.

**POST request:** `{ "text": "…", "mentions": ["reviewer@x.com"] }` (text ≤ 5000 chars)

**Response 201:** `{ "comment": { "id": "…", "authorUid": "…", "text": "…", "mentions": ["uid"], "createdAt": "…" } }` — GET returns `{ "comments": [ … ] }`, oldest first.

### `GET /api/v1/workspaces/:id/socials`

The workspace's flattened social library, newest first: one entry per generated piece (`type`: `text` | `carousel` | `poster`) with preview fields (`preview`/`slideCount`/`headline`…), normalized across the legacy shapes.

### `GET /api/v1/items/:id/socials/:channel`

One social piece with its full content. `channel` is `linkedin` | `x`; query `format` is `text` (default) | `carousel` | `poster`. Text pieces return `post`/`thread`/`cta` (legacy nested `copy` is normalized away).

### `POST /api/v1/items/:id/socials`

Generate social content for an item — article syndication, or idea development on a social-only item. **Blocking** (a single Loki call), unlike article generation. The workspace's social personas and branding apply exactly as in the app; the result lands on the item as a reviewable `draft`.

**Request:** `{ "channel": "linkedin", "function": "teach", "format": "text", "personaId": null, "template": null }` (`channel`/`function` validated against the app's registries; `format` also accepts `carousel` / `poster`)

**Response 201:** `{ "social": { "itemId": "…", "channel": "…", "format": "text", "status": "draft", "post": "…", "thread": null, "cta": "…", "generatedAt": "…" } }`

---

## Health

### `GET /api/health`

Returns a simple liveness check. Use this to verify the backend is running.

**Response 200**
```json
{ "status": "ok", "message": "Backend is running" }
```

---

## Workspaces

Workspaces are stored in `data/workspaces.json` on the server filesystem.

### `GET /api/workspaces`

Returns all workspaces.

**Response 200** — array of workspace objects.

```json
[
  {
    "id": "the-moguls-medium-blogs",
    "name": "The Moguls Medium Blogs",
    "description": "...",
    "theme": "#6366f1",
    "destination": "Sanity",
    "aiProvider": "Anthropic",
    "aiModel": "claude-sonnet-4-6",
    "systemPrompt": "PERSONA: ...",
    "wordCount": "800-1200"
  }
]
```

---

### `POST /api/workspaces`

Creates a new workspace. The `id` is auto-derived from the name (lowercase, hyphens).

**Request body**
```json
{
  "name": "My New Blog",
  "description": "Optional description.",
  "theme": "#2563eb",
  "destination": "Markdown",
  "aiProvider": "Google",
  "aiModel": "gemini-3.1-pro-preview",
  "systemPrompt": "You are an expert writer...",
  "wordCount": "1000"
}
```

**Response 201** — the created workspace object.

**Response 500** — `{ "error": "Failed to create workspace" }`

---

### `PUT /api/workspaces/:id`

Updates an existing workspace. Merges the body into the existing record; `id` cannot be changed.

**Path param:** `id` — workspace ID.

**Request body** — any subset of workspace fields.

**Response 200** — updated workspace object.

**Response 404** — `{ "error": "Workspace not found" }`

---

## Library

Library items are stored in Firestore collection `content_pipeline_library`. See [`data-model.md`](data-model.md) for the full document schema.

### `GET /api/library/:workspaceId`

Returns all library items for a workspace, ordered by `createdAt` descending.

**Path param:** `workspaceId` — workspace ID.

**Response 200** — array of library item objects (with Firestore `id` injected).

**Response 500** — `{ "error": "Failed to fetch library items" }` (can be caused by a missing Firestore composite index — see [`troubleshooting.md`](troubleshooting.md)).

---

### `GET /api/library/item/:id`

Returns a single library item.

**Path param:** `id` — Firestore document ID.

**Response 200** — library item object.

**Response 404** — `{ "error": "Item not found" }`

---

### `PUT /api/library/:id/approve`

Saves an edited draft and sets `status` to `approved`.

**Path param:** `id` — Firestore document ID.

**Request body**
```json
{ "draft": "# Article Title\n\nBody text..." }
```

**Response 200**
```json
{ "success": true, "message": "Draft approved" }
```

---

### `PUT /api/library/:id/cover`

Downloads a generated cover image (e.g. from Grok) and stores it permanently in Firebase Storage. Updates the Firestore doc with storage metadata. Does **not** touch Sanity — that happens at publish.

**Path param:** `id` — Firestore document ID.

**Request body**
```json
{ "imageUrl": "https://imgen.x.ai/xai-imgen/..." }
```

**Process:**
1. Confirms the library item exists.
2. Downloads the image bytes (Grok URLs are temporary, this call must happen promptly).
3. Saves to Firebase Storage at `content-pipeline/covers/<id>.<ext>`.
4. Updates Firestore with `coverImage: { storagePath, contentType, source, url }`.

**Response 200**
```json
{
  "success": true,
  "coverImage": {
    "storagePath": "content-pipeline/covers/abc123.jpg",
    "contentType": "image/jpeg",
    "source": "https://imgen.x.ai/...",
    "url": "http://localhost:3005/api/library/abc123/cover/image?t=1782668851968"
  }
}
```

**Response 400** — `imageUrl` missing.
**Response 404** — Library item not found.
**Response 502** — Failed to download from the image URL.
**Response 500** — Storage or Firestore error.

---

### `GET /api/library/:id/cover/image`

Streams the stored cover image bytes directly from Firebase Storage. Acts as a proxy to avoid public-bucket configuration.

**Path param:** `id` — Firestore document ID.

**Response 200** — image bytes with `Content-Type: image/jpeg` (or `image/png`).

**Response 404** — No item or no cover stored.

> The `url` field in `coverImage` (stored on the Firestore doc) points here with a cache-buster query string (`?t=...`). Refreshing the cover by re-approving a new image automatically invalidates the cache.

---

### `POST /api/publish`

Publishes a library item to its configured Sanity CMS project. This is a multi-step operation:
1. Loads the item from Firestore.
2. Parses title, slug, categories from the draft Markdown.
3. Converts Markdown → Portable Text.
4. If a cover image is stored in Firebase Storage, downloads it and uploads to Sanity as an asset.
5. Creates or replaces the Sanity document (`_id: cp-<libraryId>`).
6. Updates Firestore: `status = "published"`, records `sanityId`.

**Request body**
```json
{ "libraryId": "abc123FirestoreDocId" }
```

**Response 200**
```json
{
  "success": true,
  "message": "Draft published to Sanity successfully!",
  "sanityId": "cp-abc123FirestoreDocId"
}
```

**Response 400** — `libraryId` missing or no Sanity config for workspace.
**Response 404** — Draft not found.
**Response 502** — Cover image upload to Sanity failed (most likely a read-only token — see [`configuration.md`](configuration.md)).
**Response 500** — General Sanity or Firestore error.

---

## Comments

Comments live in Firestore collection `content_pipeline_comments`, keyed to a library item. All comment routes are guarded by workspace membership on the item (403 for non-members, 404 for missing items).

### `GET /api/library/item/:itemId/comments`

Returns the item's comments, oldest first. Each comment carries `authorUid`, `authorName`, `text`, `mentions` (uids), `reactions` (`{ "<emoji>": [uid, ...] }`), and `createdAt` (epoch ms).

---

### `POST /api/library/item/:itemId/comments`

Posts a comment. Mentioned users get an in-app notification (awaited) and an email (fire-and-forget). Self-mentions are stripped.

**Request body**
```json
{ "text": "Looks great @joe", "mentions": ["uid-of-joe"] }
```

**Response 201** — the created comment.
**Response 400** — empty text, or text over 5000 characters.

---

### `POST /api/library/item/:itemId/comments/:commentId/reactions`

Toggles the caller's emoji reaction on a comment. The emoji must be one of the fixed palette `👍 ❤️ 😂 🎉 💡 🔥` (mirrored in `CommentThread.jsx`).

**Request body**
```json
{ "emoji": "👍" }
```

**Response 200** — `{ "id": "<commentId>", "reactions": { "👍": ["uid", "..."] } }` (the full post-toggle map).
**Response 400** — emoji outside the palette.
**Response 404** — comment missing or not on this item.

---

## Content generation

### `POST /api/generate/content`

Synchronous content generation. Identical logic to the streaming variant but returns all at once after completion. Prefer the streaming endpoint for UI interactions.

**Request body** — a stack of up to 10 mixed sources (see `lib/sources/`):
```json
{
  "workspaceId": "the-moguls-medium-blogs",
  "sources": [
    { "type": "youtube", "url": "https://youtu.be/abc" },
    { "type": "url", "url": "https://blog.example.com/post" },
    { "type": "text", "text": "pasted notes or docs...", "label": "API docs excerpt" }
  ]
}
```

Legacy shape — still accepted, mapped to youtube sources:
```json
{ "workspaceId": "...", "youtubeUrls": ["https://youtu.be/abc", "https://youtu.be/def"] }
```

**Source types:** `youtube` (Supadata transcript), `url` (SSRF-guarded fetch + readable-text extraction), `text` (pasted), `github` (`{ url, paths?: ["src/api.py"] }` — README + docs tree + up to 10 hand-picked repo-relative files via the GitHub API; connect GitHub for private repos/rate limits), `code` (`{ text, label?, language? }` — fenced in the composed source so the model reads it as code), `vault` (`{ vaultId }` — composes from a Source Vault entry's stored text, no fetching; generation appends a usage record to the entry). **Budget:** pasted sources (`text`/`code`) hard-reject over 60,000 chars; fetched sources (`url`/`github`) truncate at 60k with a visible marker; YouTube transcripts are exempt from the per-source cap; the combined total rejects over 240k chars with a per-source breakdown.

**Response 200**
```json
{
  "success": true,
  "message": "Content generated successfully!",
  "draft": "# Article Title\n\n...",
  "libraryId": "abc123"
}
```

If the exact source combination already exists in the library (matched by `sourceSignature`, order-insensitive; legacy items by their `youtubeUrls`):
```json
{
  "success": true,
  "existing": true,
  "message": "These sources have already been generated together in the library!",
  "libraryId": "existingDocId"
}
```

**Response 400** — Missing params, unsupported source type, a failed source fetch, or a blown context budget (the message says which source and why).
**Response 404** — Workspace not found.
**Response 500** — Generation failed.

---

### `GET /api/github/repos`

Lists the repositories the **calling user's** GitHub connection can see, for the Source Composer's repo picker. The token itself is never returned. Responses are cached in memory (per token) for 5 minutes.

**Response 200**
```json
{ "configured": true, "repos": [ { "fullName": "org/repo", "url": "https://github.com/org/repo", "private": true, "description": "...", "pushedAt": "2026-08-01T00:00:00Z" } ] }
```

`{ "configured": false, "repos": [] }` when no token is set (the picker shows setup instructions; public-URL mode keeps working).

**Response 502** — GitHub rejected the token (expired/revoked) or the listing failed.

---

### Source Vault — `/api/vault*`

The org-wide ledger of reusable source material (see `docs/proposals/source-vault.md`).

- **GET `/api/vault?workspaceId=...`** — the workspace's entries without text (`{ id, title, group, type, url, chars, origin, usedIn[] }`), watched `channels`, `lastSyncAt`, and `syncStale` (true → the UI auto-triggers a sync).
- **GET `/api/vault/:id/text`** — one entry's full text (on-demand preview).
- **POST `/api/vault/stage`** `{ urls: [1–20 YouTube URLs], workspaceId }` — fetches titles + transcripts now, banks them as unused entries in that workspace; a video already vaulted elsewhere is shared, not duplicated. Returns `{ staged, existed, failed }`.
- **PUT `/api/vault/channels`** (admin) `{ channels: [{ id: "@handle"|url, label, workspaceId }] }` — up to 10 watched channels; synced videos land in their channel workspace.
- **POST `/api/vault/sync`** — pulls new uploads from every watched channel (Supadata channel listing + transcript fetch) as unused entries. Returns `{ channels, added, failed, skippedExisting }`.
- **POST `/api/vault/scout/stream`** `{ workspaceId, message, history }` — SSE scouting session (Mimir agent, branded Odin in the UI) over the workspace's vault digest. Events: `status`, `text`, `proposal` (`{ picks, angle, workingTitle }` — accepted proposals become composer vault cards plus an editorial brief), `error`. The proxy runs an agentic tool loop (`lib/odinStream.js`, shared with the studio): when the agent emits a `read_transcript` tool call, the backend reads that entry's opening 6,000 chars from the vault (workspace-checked, max 3 reads per turn); a `search_memory` call queries Athena MemOS scoped to (workspace, user, odin). Results feed back to Odin as tool round-trips in history; the client sees `status` events ("Odin is reading …", "Odin is searching memory..."). Both chat surfaces also get a turn-start memory snapshot injected into the prompt and store each completed exchange back to Athena (`lib/athena.js`, disabled without `ATHENA_API_URL`/`ATHENA_API_KEY`).

New entries (stage/sync) are distilled into a `gist` + `topics` by Odin (`POST /api/v1/vault/gist` on the agent, best-effort) — the scouting digest shows gists, falling back to a raw excerpt. `scripts/backfill-vault-gists.js` gists a pre-existing corpus.

`GET /api/sources/youtube-title` additionally returns `usedIn` from the vault so the composer can warn about reuse on paste.

---

### `GET | PUT | DELETE /api/integrations/github`

The calling user's **personal** GitHub connection, managed from **Settings → Integrations** (every user connects their own account; the forge acts as them for the repo picker and github-source ingestion). Tokens live on the user's record (`content_pipeline_users.{uid}.githubIntegration`) and never leave the server — responses carry a masked hint (`…abcd`) and the GitHub login only. Each user can manage only their own connection.

- **GET** — status: `{ configured, hint, login, setAt }`.
- **PUT** `{ token }` — validates the token against GitHub (`422` with a clear message if rejected), stores it on the caller's record, clears the repo-picker cache, and returns `{ status, login, ...status }`.
- **DELETE** — removes the caller's stored token. Public repo URLs keep working without a connection.

---

### `POST /api/generate/content/stream`

Streaming version of content generation over Server-Sent Events. Used by the **Forge** tab in the web app for live progress display.

**Request body** — same as above.

**SSE events** (each `data:` line is a JSON object):

| `type` | Fields | Description |
| --- | --- | --- |
| `stage` | `message: string`, `level: "info"\|"success"\|"warn"` | Pipeline progress update |
| `done` | `libraryId: string`, `existing?: boolean` | Generation complete |
| `error` | `message: string` | Fatal error; stream closes |

Example stream:
```
data: {"type":"stage","level":"info","message":"Starting pipeline for \"The Moguls Medium Blogs\"."}
data: {"type":"stage","level":"info","message":"Fetching video title 1/2..."}
data: {"type":"stage","level":"success","message":"Transcript extracted (14,203 characters)."}
data: {"type":"stage","level":"info","message":"Generating content with Anthropic (claude-sonnet-4-6)..."}
data: {"type":"done","libraryId":"abc123"}
```

The connection closes after `done` or `error`.

---

## Brand Studio

### Design Library — `/api/brand-studio/designs*`

Persisted studio work: an editable recipe (Firestore `content_pipeline_designs`) plus stored image bytes and a thumbnail (Firebase Storage). See [`brand-studio.md`](brand-studio.md) and [`data-model.md`](data-model.md).

| Route | What |
| --- | --- |
| `POST /api/brand-studio/designs` | Save. Body: `{ name, templateId, brandId, resolution?, fields, images: { key: dataUrl }, thumbnail? }`. Max 8 images (8MB each), 2MB thumbnail, 100KB fields JSON. → `201 { design: { id, name } }` |
| `GET /api/brand-studio/designs?brand=` | List summaries (id, name, template/brand, timestamps, `thumbnailUrl`), newest first |
| `GET /api/brand-studio/designs/:id` | Load: the summary plus `fields` and `imageUrls` (proxy URLs keyed by original field key) |
| `PUT /api/brand-studio/designs/:id` | Update in place — full replace, old stored files removed. Creator or admin only |
| `DELETE /api/brand-studio/designs/:id` | Delete doc + files. Creator or admin, **human-only** (API keys refused) |
| `GET /api/brand-studio/designs/:id/image/:key` | Public image/thumbnail proxy (`:key` = sanitized field key or `thumb`; loaded via `<img>`) |

### `POST /api/brand-studio/generate-image`

Vertex AI Imagen generation for the Brand Studio (`/brand-studio` in the frontend). The art direction is server-owned per brand (`routes/brandStudio.js` `BRAND_STYLES`): the client sends only the conceptual subject, and the route prepends that brand's style prompt so results land inside the brand's visual language. Authenticates to Vertex with ADC against `GCP_PROJECT_ID` (override with `GOOGLE_CLOUD_PROJECT` if Vertex runs in a different project; the service account/ADC identity needs the **Vertex AI User** role).

**Request body**
```json
{
  "prompt": "a row of storage units at dawn",
  "aspectRatio": "1:1",
  "type": "artistic",
  "brandId": "storagemoguls"
}
```

- `prompt` — required, ≤ 2000 chars.
- `aspectRatio` — optional; one of `1:1`, `3:4`, `4:3`, `9:16`, `16:9` (default `1:1`).
- `type` — `artistic` (full-bleed background) or `centerpiece` (diagram-like focal art); anything else falls back to `artistic`.
- `brandId` — optional; unknown ids use a neutral default style.

**Response 200** — `{ "image": "data:image/jpeg;base64,..." }`
**Response 400** — missing/oversized prompt or unsupported aspect ratio.
**Response 503** — no GCP project configured.
**Response 502** — Vertex call failed or returned no image.

---

## Social content generation

Two entry points hand a source to Loki (via Odin's `/api/v1/tasks/syndicate`) and save the result as a reviewable draft under the item's `socials.<channel>[_<kind>]` key. Both share the same levers and the same review lifecycle (draft → finalized → in_review → approved).

### `POST /api/generate-socials`

Generates platform-native social copy from an existing library item. Article items syndicate their `draft`; original items (see compose below) develop their `idea`.

**Request body:**

| Field | Type | Notes |
| --- | --- | --- |
| `itemId` | string | required — library item to generate from |
| `channel` | string | `linkedin` (default) or `x` |
| `personaId` | string? | a `socialPersonas` id from the workspace config |
| `function` | string | `teach` (default), `sell`, `entertain`, `inspire` |
| `format` | string? | e.g. `Text-only`, `PDF Carousel`, `Single Image/Poster`, `Thread` |
| `template` | string? | carousel/poster design template id |

**Response 200** — `{ itemId, channel, format, status: "draft", ... }` (shape varies by format: `post`/`thread` for text, `slides` for carousels, `headline`/`stat`/... for posters).

**Response 422** — the item has no source text yet (article without a draft).

### `POST /api/socials/compose`

Creates social content from an **original idea** — no source article. Creates a social-only library item (`sourceType: "original"`) holding the idea brief, then runs the same generation as above. The item is excluded from the article library; its content appears in the Social Library and the social review flow.

**Request body:** same levers as `generate-socials`, but instead of `itemId`:

| Field | Type | Notes |
| --- | --- | --- |
| `workspaceId` | string | required |
| `idea` | string | required, ≤ 5,000 chars — the creator's idea brief; its first line becomes the item title |

**Response 200** — same shape as `generate-socials` (includes the new `itemId`).

**Response 400** — missing/oversized idea, unknown channel or function.
**Response 403** — no access to the workspace.

If generation fails, the freshly created item is deleted (no orphans).

### `POST /api/socials/carousel-pdf`

Studio-designed carousels — the carousel twin of `poster-image` below. Persists the chosen design set (e.g. `editorial:field`; empty string clears back to Classic) and, optionally, the client-bound PDF bytes (`pdfData`: base64 `application/pdf` data URL, 10MB max — stored at `content-pipeline/socials/carousels/<itemId>_<channel>.pdf` and recorded as `pdfStoragePath`). The syndication page persists the design on every pick and uploads the PDF when the carousel is **approved**. With a studio design chosen, finalizing skips the legacy Odin render entirely, and `GET /api/socials/carousel/item/:itemId/:channel` streams the frozen bytes; editing a deck (draft/revise) nulls `pdfStoragePath` so a stale render can never ship.

### `POST /api/socials/poster-image`

Studio-designed posters: persists the chosen Brand Studio design and, optionally, the client-rendered PNG bytes for a channel's poster.

**Request body:**

| Field | Type | Notes |
| --- | --- | --- |
| `itemId` | string | required |
| `channel` | string | required |
| `design` | string? | studio design id (e.g. `bignumber:counter`); empty string clears back to Classic |
| `imageData` | string? | base64 PNG data URL, 10MB max — stored at `content-pipeline/socials/posters/<itemId>_<channel>.png` and recorded as `imageStoragePath` |

At least one of `design` / `imageData` is required. The syndication page persists the design on every pick and uploads the bytes when the poster is **approved**, freezing exactly what the reviewer saw. `GET /api/socials/poster/item/:itemId/:channel` streams stored bytes when `imageStoragePath` exists; otherwise it falls back to the legacy Odin re-render.

**Response 200** — `{ success, design, imageStoragePath }`.
**Response 400 / 403 / 404** — bad payload / no workspace access / no poster on that channel.

### `POST /api/socials/delete`

Hard-deletes one social asset (removes `socials.<key>` from the item). Only **disposable** content: `draft` and `finalized` pieces that never went through approval. The rules live in `lib/deletionPolicy.js`.

**Request body:**

| Field | Type | Notes |
| --- | --- | --- |
| `itemId` | string | required |
| `channel` | string | `linkedin` \| `x` |
| `kind` | string | `text` \| `carousel` \| `poster` |

**Response 200** — `{ "status": "success" }`.
**Response 409** — content is `in_review` (withdraw first) or approved (archive instead; legacy status-less assets read as approved).
**Response 403 / 404** — no workspace access / no such asset.

Rendered carousel/poster files (`fileId`) are deliberately left in the render store (see TECH_DEBT).

### `POST /api/socials/archive`

Archives (or restores) an **approved** social asset — reversible: sets `socials.<key>.archived`, keeping the record as the audit trail of what was posted. Approver sign-off rule: only the recorded approver (`review.decidedBy`) or an admin/owner; legacy approved assets with no approver on record are admin-only. When an admin archives someone else's approval, the approver gets a bell notification.

**Request body:** same as `delete`, plus:

| Field | Type | Notes |
| --- | --- | --- |
| `archived` | boolean | optional, default `true`; `false` restores |

**Response 200** — `{ "status": "success", "archived": true|false }`.
**Response 409** — content is not approved (delete drafts directly).
**Response 403** — requester is neither the approver nor an admin (the message names the approver when known).
