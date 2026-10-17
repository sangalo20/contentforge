# Data Model

**Audience:** Engineers and maintainers.  
**Purpose:** Document every schema — Firestore, Firebase Storage, and Sanity.

---

## Firestore — `content_pipeline_library`

Each document represents one generated library item. The Firestore document ID is used as the canonical identifier throughout the app (library URL, storage path, Sanity `_id` prefix).

### Document schema

```jsonc
{
  // --- Identity ---
  "workspaceId": "the-moguls-medium-blogs",  // FK → workspaces.json id
  
  // --- Source ---
  // Two item kinds share this collection. Article items (the default) come from
  // the YouTube pipeline and carry the fields below. Original items (sourceType
  // "original", created by POST /api/socials/compose) are social-only: they
  // carry `idea` + `title` instead, are excluded from the article library and
  // dashboard funnel, and surface only through their `socials` map.
  "sourceType": "original",                  // absent on article items
  "idea": "the creator's idea brief",        // original items only (Loki's grounding text)
  "title": "first line of the idea",         // original items only (display title)
  "createdBy": "<uid>",                       // original items only (who composed it)
  // The source stack (multi-source: YouTube / web article / pasted text; see
  // lib/sources/). Each entry snapshots its resolved text at add-time.
  "sources": [
    { "type": "youtube", "url": "https://youtu.be/abc", "title": "Video Title", "text": "<transcript>", "chars": 14203 },
    { "type": "url", "url": "https://blog.example/post", "title": "Article Title", "text": "<extracted>", "chars": 6210 },
    { "type": "text", "label": "API docs excerpt", "title": "API docs excerpt", "text": "...", "chars": 900 }
  ],
  "sourceSignature": "<sha256>",              // order-insensitive stack identity (duplicate detection)
  // Legacy source fields — still written for backward compatibility (TECH_DEBT #1):
  "youtubeUrls": ["https://youtu.be/abc"],   // urls of the YouTube sources only
  "youtubeUrl":  "https://youtu.be/abc",     // legacy single-URL field (kept for cache queries)
  "titles": ["YouTube Video Title"],          // title of every source
  "transcript": "raw combined source text...", // the concatenated blob Oscar consumed
  
  // --- Generated content ---
  "draft": "# Blog Title\n\n...",             // Markdown blog post
  "imagePrompt": "Cinematic drone shot...",   // Extracted from Oscar's <image_prompt> tags
  
  // --- Cover image ---
  "coverImage": {
    "storagePath": "content-pipeline/covers/<id>.jpg",   // Firebase Storage path
    "contentType": "image/jpeg",                          // MIME type
    "source": "https://imgen.x.ai/xai-tmp-imgen-...",   // original Grok URL (for reference)
    "url": "http://localhost:3005/api/library/<id>/cover/image?t=1782668851968"
    // ^ backend proxy URL (includes cache-buster)
  },
  
  // --- Sanity publish ---
  "sanityId": "cp-<firestoreDocId>",         // set after publish; null until then
  
  // --- Status lifecycle ---
  "status": "draft",                          // see lifecycle below
  
  // --- Social content (one entry per generated piece) ---
  // Keys: `<channel>` for text, `<channel>_<kind>` for carousels/posters
  // (linkedin, x, linkedin_carousel, x_poster, ...). See lib/reviewTargets.js.
  "socials": {
    "linkedin_poster": {
      // content fields per kind (post/thread, slides+cta, or poster fields)...
      "status": "approved",                  // draft → finalized → in_review → approved
                                              // (absent on legacy entries — readers default to approved)
      "review": {                             // set by the review workflow (routes/reviews.js)
        "requestedBy": "<uid>", "reviewers": ["<uid>"],
        "decision": "approve", "decidedBy": "<uid>", "decidedByEmail": "reviewer@x.com"
      },
      "fileId": "<render-store id>",         // carousels/posters: set at finalize (rendered artifact)
      "archived": true,                        // approved-only: hidden from the Social Library, reversible
      "archivedBy": "<uid>",                  // who archived (approver or admin; see lib/deletionPolicy.js)
      "archivedAt": { "_seconds": 1782668851, "_nanoseconds": 0 }
    }
  },

  // --- Timestamps (Firestore ServerTimestamp) ---
  "createdAt": { "_seconds": 1782668851, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1782668851, "_nanoseconds": 0 }
}
```

> Deleting social assets: `draft`/`finalized` entries are removed outright by
> `POST /api/socials/delete`; `approved` entries are only ever archived
> (`POST /api/socials/archive`) so the record of what was posted survives.

### Status lifecycle (articles)

```
draft → finalized → in_review → approved → published
              └─────────────────────────────┘
     (workspaces without requireReview may publish from finalized)
```

| Status | Meaning | Triggered by |
| --- | --- | --- |
| `draft` | Generated (or sent back with changes requested) | the generation pipeline; `POST /api/reviews/decide` (request_changes) |
| `finalized` | Creator done editing | `PUT /api/library/:id/approve` (legacy path name) or `POST /api/v1/items/:id/finalize` |
| `in_review` | Submitted to tagged reviewers | `POST /api/reviews/submit` / `POST /api/v1/items/:id/review` |
| `approved` | Reviewer approved | `POST /api/reviews/decide` (approve) |
| `published` | Pushed to Sanity CMS | `POST /api/publish` / `POST /api/v1/items/:id/publish` |

Legacy data generations still in the collection (until the TECH_DEBT #1
migration is applied): `pending_approval` reads as `draft`, and items with no
`status` at all predate the review gate and read as `approved`. The `/api/v1`
surface normalizes these before they ever reach an external caller.

> Cover image approval is independent of draft approval. A draft can be published without a cover image (Sanity `mainImage` will simply be absent).

### Composite index requirement

The library query uses `workspaceId` + `orderBy createdAt desc`. Firestore requires a composite index for this. If you see a `FAILED_PRECONDITION` error when loading the library, follow the link in the error message to auto-create the index in the Firebase console.

---

## Firestore — `content_pipeline_vault`

The Source Vault: one document per reusable source (see `docs/proposals/source-vault.md`).

```jsonc
{
  "title": "Day 018 - The 3-Mile Radius - Sacred Cow of Self Storage",
  "group": "Storage 100 — Section 2: Market Analysis",   // or a channel label / "Staged"
  "workspaceIds": ["the-moguls-medium-blogs"],            // scoping: which workspaces see this entry
  "type": "youtube",                        // youtube | text
  "url": "https://youtu.be/...",           // youtube entries
  "videoId": "abc123",                      // identity for dedup + reuse warnings
  "textHash": "<sha256>",                   // identity for text entries
  "text": "<full transcript>",              // compose without re-fetching
  "chars": 7675,
  "origin": "import",                       // import | staged | channel-sync
  "addedAt": "<serverTimestamp>", "addedBy": "<uid>",
  "usedIn": [                                // the usage ledger
    { "itemId": "...", "workspaceId": "...", "title": "The Article", "kind": "article", "date": "2026-08-07" },
    { "title": "Legacy piece", "kind": "Newsletter", "issue": "#2", "date": "2026-05", "slug": "...", "external": true }
  ]
}
```

Watched channels and sync state live in `content_pipeline_config/vault`
(`{ channels: [{ id, label, workspaceId }], lastSyncAt }`).

---

## Firestore — `content_pipeline_api_keys`

Machine credentials for scripts/workbenches calling the API (see the Authentication section of [api-reference.md](api-reference.md)). One doc per key; only the SHA-256 hash of the token is stored — the plaintext (`cfk_…`) is shown once at mint time.

```jsonc
{
  "name": "Sam's workbench",              // admin-chosen label
  "tokenHash": "<sha256 hex>",            // the only stored form of the secret
  "display": "cfk_ab12cd34…wxyz",        // non-secret handle for the UI
  "role": "creator",                      // "admin" | "creator" — never "owner"
  "workspaceAccess": ["ws-id"],           // "all" | [ids]; absent/[] = no access (no legacy default)
  "reviewerWorkspaces": [],                // "all" | [ids]
  "createdBy": "admin@x.com",
  "createdAt": "<serverTimestamp>",
  "lastUsedAt": "<serverTimestamp|null>", // stamped at most hourly on use
  "revokedAt": "<serverTimestamp|null>",  // soft revocation; doc kept for audit
  "revokedBy": "admin@x.com"
}
```

---

## Firestore — `content_pipeline_jobs`

Async pipeline jobs for the external `/api/v1` surface (see [api-reference.md](api-reference.md) → External API v1). One doc per submitted generation; executed in-process by `lib/jobs.js` and polled via `GET /api/v1/jobs/:id`.

```jsonc
{
  "type": "generation",                       // the only job type so far
  "workspaceId": "ws-id",
  "requestedBy": "uid | apikey:<keyId>",      // synthetic uid for API keys
  "apiKeyId": "<keyId> | null",
  "status": "queued",                         // queued | running | succeeded | failed
  "stages": [                                  // the Forge's progress lines
    { "at": 1756450000000, "level": "info", "message": "Starting pipeline…" }
  ],
  "request": { "sources": [/* normalized inputs */], "brief": {} },
  "result": { "itemId": "…", "existing": false },  // null until succeeded
  "error": null,                              // message when failed
  "errorKind": "source | internal",           // only when failed
  "createdAt": "<serverTimestamp>",
  "startedAt": "<serverTimestamp|null>",
  "finishedAt": "<serverTimestamp|null>"
}
```

---

## Firestore — `content_pipeline_designs`

Saved Brand Studio designs (see [`brand-studio.md`](brand-studio.md) → Design Library). The recipe lives here; image bytes and the thumbnail live in Storage.

```jsonc
{
  "name": "Weekly Episode Art",
  "templateId": "podcast",                    // registry id (frontend/src/brand-studio/registry.js)
  "brandId": "storagemoguls",
  "resolution": "1080x1080",                  // or null (template default)
  "fields": { "title": "…", "variant": "…" }, // every non-image content field, verbatim
  "imageFiles": {                              // keyed by SANITIZED field key
    "uploadedImage": { "key": "uploadedImage", "storagePath": "content-pipeline/brand-studio/designs/<id>/uploadedImage.png", "contentType": "image/png" }
  },
  "thumbFile": { "storagePath": ".../thumb.png", "contentType": "image/png" },
  "createdBy": "<uid>", "createdByEmail": "…",
  "createdAt": "<serverTimestamp>", "updatedAt": "<serverTimestamp>"
}
```

---

## Firebase Storage

All cover images are stored under:

```
content-pipeline/
  covers/
    <firestoreDocId>.jpg    (or .png)
```

Files are stored with:
- `contentType`: from the original download headers (typically `image/jpeg`)
- `cacheControl: no-cache` — ensures re-approved covers are not served stale

Access is via the backend proxy route `GET /api/library/:id/cover/image` (no public bucket access required).

---

## Sanity — `post` schema (Moguls workspace)

Used by the `the-moguls-medium-blogs` workspace (project `fqfrsx19`).

| Field | Type | Source |
| --- | --- | --- |
| `_id` | string | `cp-<firestoreDocId>` |
| `_type` | `"post"` | hardcoded |
| `title` | string | Extracted from first `# Heading` in draft |
| `slug.current` | string | Lowercased, hyphenated title |
| `publishedAt` | datetime | `new Date().toISOString()` at publish |
| `summary` | string | First 150 chars of draft |
| `body` | Portable Text | Converted from Markdown via `htmlToPortableText` |
| `readTime` | number | `ceil(wordCount / 200)` minutes |
| `author` | reference | Existing author, or auto-created `content-pipeline` author |
| `categories` | string[] | Extracted from `Categories: x, y, z` line in draft |
| `mainImage` | image ref | Uploaded from Firebase Storage at publish time |

---

## Sanity — `newsletterIssue` schema (Real Rep workspace)

Used by the `the-real-rep-substack-blogs` workspace (project `l4nrg0gu`).

| Field | Type | Source |
| --- | --- | --- |
| `_id` | string | `cp-<firestoreDocId>` |
| `_type` | `"newsletterIssue"` | hardcoded |
| `title` | string | First title from `titles` array |
| `slug.current` | string | Lowercased, hyphenated title |
| `publishedAt` | datetime | `new Date().toISOString()` |
| `summary` | string | First 150 chars of draft |
| `content` | Portable Text | Converted from Markdown |
| `issueNumber` | number | Auto-incremented from latest existing issue |

> The `newsletterIssue` schema does not have a `mainImage` field. Cover images are stored and displayable in the web app but are not pushed to Sanity for this schema type.

---

## Workspace — `data/workspaces.json`

See [`configuration.md`](configuration.md) for the full field reference. This file is mutated by the API and is not in Firestore.
