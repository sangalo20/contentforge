# Content Generation Pipeline

**Audience:** Engineers and operators.  
**Purpose:** Walk through every step of the content generation flow, from source input to a saved library draft.

---

## High-level flow

```
Operator stacks sources in The Forge tab (Source Composer):
YouTube video(s) / web article(s) / pasted text or code / GitHub repo(s) /
Source Vault entries — mixed freely, up to 10
        │
        ▼
POST /api/generate/content/stream  (SSE)
        │
        ├─ 1. Duplicate check (sourceSignature; legacy items by youtubeUrls)
        ├─ 2. Resolve each source via lib/sources/ registry:
        │       youtube → oEmbed title + Supadata transcript (cache-aware)
        │       url     → SSRF-guarded fetch + readable-text extraction
        │       text    → passthrough (validation + caps)
        ├─ 3. Enforce the context budget (60k/source, 240k total)
        ├─ 4. Compose the labeled source blob (=== SOURCE N (type): title ===)
        ├─ 5. Build system prompt (workspace persona + word count)
        ├─ 6. POST /api/v1/tasks/generate-campaign → Odin Agent
        │         └─ OdinAgent → OscarAgent (litellm → Gemini/Claude)
        └─ 7. Save to Firestore (status: draft; sources[] + legacy fields)
                │
                ▼
        SSE: {type: done, libraryId}
        Browser navigates to library
```

The pipeline itself lives in **`lib/generationPipeline.js`** with an injectable
stage callback; three entry points adapt it: the SSE route above (The Forge),
the blocking `POST /api/generate/content`, and the machine-facing
`POST /api/v1/generations`, which runs it as an async job
(`lib/jobs.js` → `content_pipeline_jobs`, polled via `GET /api/v1/jobs/:id`)
with the same stage lines recorded on the job document. Machine callers
(API keys) skip bell notifications; everything else is identical.

---

## Step-by-step

### 1. Duplicate check

Before fetching anything, the backend compares the incoming stack's `sourceSignature` (order-insensitive hash of urls/text) against the workspace's items. Legacy items without a signature are matched by their sorted `youtubeUrls` when the incoming stack is all-YouTube. If found, it returns the existing `libraryId` immediately — no generation happens.

### 2. Source resolution (`lib/sources/`)

Each source resolves through its type's module, all behind one contract (`resolve(input, ctx) → { title, text }`):

- **youtube** — title via the YouTube oEmbed API (non-fatal on failure: `"Unknown Video"`), then the transcript: a legacy single-URL cache in Firestore (`where youtubeUrl == url`) is checked first; on a miss, Supadata fetches the transcript (proxying + Whisper fallback for caption-less videos).
- **url** — SSRF-guarded fetch (https-only, private/metadata IPs refused, every redirect hop re-validated) followed by Readability extraction with a plain-text fallback. Paywalled/script-rendered pages fail with a "paste the text instead" message.
- **text** — pasted content passes through with validation.
- **github** — GitHub API: repo description + README + `docs/` tree (documentation files, capped) + up to 10 hand-picked repo-relative files. Deliberately not whole-repo ingestion. Repos are fetched as the **generating user** via their personal fine-grained PAT (Settings → Integrations); without a connection, public repos only. (The shared `GITHUB_TOKEN` env was removed.)
- **code** — pasted code with an optional language tag; the composed source fences it so the model reads it as code, and Oscar gets a prompt hint to explain rather than reproduce it.
- **vault** — a previously-ingested transcript from the Source Vault (by `vaultId`); cap-exempt like live YouTube fetches. After a successful generation, every vault entry that fed the item gets a usage record (the automatic "move to the Used table").

### 3. Context budget

Pasted sources hard-reject over **60,000 chars** (the user can trim); fetched articles truncate at 60k with a visible marker and a warning stage; YouTube transcripts are exempt from the per-source cap (hour-plus videos predate it). The **240,000-char total** hard-rejects with a per-source breakdown. Nothing is ever truncated silently.

### 4. Composition

A single source stays clean (no markers). Blends are labeled `=== SOURCE N (type): title ===` — the same convention Oscar's MULTI-SOURCE SYNTHESIS instruction has always consumed, now typed.

### 5. System prompt construction

The workspace's `systemPrompt` is enhanced with:
- `TARGET WORD COUNT: Exactly <wordCount> words.` (if set)
- For the Moguls workspace: mandatory Markdown heading structure and a required `Categories:` line

### 6. Odin Agent delegation

The backend POSTs to the Odin Agent:
```
POST http://localhost:8000/api/v1/tasks/generate-campaign
{
  "transcript": "=== SOURCE 1: Title ===\n...",
  "systemPrompt": "...",
  "description": "...",
  "wordCount": "800-1200",
  "aiProvider": "Anthropic",
  "aiModel": "claude-sonnet-4-6"
}
```

**Inside Odin Agent:**
- `OdinAgent.process_campaign` delegates to `OscarAgent` via the jarviscore mesh.
- `OscarAgent.on_peer_request` calls `litellm.acompletion` with the transcript and persona prompt (plus the scout's editorial brief when a proposal was accepted).
- litellm routes to the correct provider (prefixes model string: `anthropic/claude-sonnet-4-6`, `gemini/gemini-3.1-pro-preview`, etc.).
- Oscar's response includes the blog draft plus `<image_prompt>...</image_prompt>` tags at the end.
- **Huginn** (citation research, fail-open) extracts citable claims — never the author's own frameworks — searches the web via Serper, walks the top 5 candidates through gates (blocked domains → trafilatura main-content extraction → thin pages → claim-in-context LLM verification), and weaves survivors in by exact-span replacement (max 4 web citations). It also places up to 3 internal links from the backend-supplied candidate list of the workspace's published articles (connections need a confirmed `articleUrlPattern` — see `lib/sanityConnections.js`). Requires `SERPER_API_KEY`; without it, web citations silently skip.
- **Heimdall** (quality gate, fail-open) reviews correctness, fidelity, tone, and de-AI, returning the corrected draft plus a QA report.
- Odin strips the image prompt, returns `{ draft, imagePrompt, qaReport }`.

### 7. Firestore save

The backend saves a new `content_pipeline_library` document:
```json
{
  "workspaceId": "...",
  "youtubeUrls": ["..."],
  "titles": ["..."],
  "transcript": "...",
  "draft": "# Title\n\n...",
  "imagePrompt": "Cinematic drone shot...",
  "qaReport": "…",
  "status": "draft",
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>"
}
```

(`sources[]` and `sourceSignature` are saved too; the legacy `youtubeUrls`/`titles`/`transcript` fields are still written alongside until the TECH_DEBT #1 migration retires them. `pending_approval` is the *legacy* name for a fresh draft — readers normalize it.)

The resulting Firestore document ID becomes the `libraryId` returned to the browser.

---

## Multi-source generation

Multiple YouTube URLs can be submitted simultaneously. Each is processed sequentially (title + transcript fetch). All transcripts are concatenated into a single `combinedTranscript` string:

```
=== SOURCE 1: First Video Title ===
<transcript 1>

=== SOURCE 2: Second Video Title ===
<transcript 2>
```

Oscar receives the full combined context and writes a single synthesised blog post.

---

## AI provider routing

| `aiProvider` | `aiModel` example | litellm prefix |
| --- | --- | --- |
| `Anthropic` | `claude-sonnet-4-6` | `anthropic/claude-sonnet-4-6` |
| `Google` | `gemini-3.1-pro-preview` | `gemini/gemini-3.1-pro-preview` |
| `OpenAI` | `gpt-4o` | `openai/gpt-4o` |
| `Odin` | `jarviscore-mesh` | Routes through Odin's default model |

The prefix is applied by `OscarAgent` only if the string doesn't already contain one.

---

## SSE stage events reference

The streaming endpoint emits `stage` events throughout:

| Message | Meaning |
| --- | --- |
| `Starting pipeline for "<workspace>"` | Pipeline started |
| `Checking library for existing draft…` | Duplicate check in progress |
| `This exact combination already exists…` | Duplicate found, returning existing item |
| `Fetching video title 1/2…` | oEmbed request in progress |
| `Source 1/2: "<title>"` | Title fetched successfully |
| `Found cached transcript for video 1/2` | Using cached transcript |
| `Extracting transcript from YouTube 1/2…` | Live transcript fetch |
| `Transcript extracted (14,203 characters)` | Transcript fetched |
| `Applying the "<workspace>" AI persona…` | Building system prompt |
| `Generating content with Anthropic (claude-sonnet-4-6)…` | Calling Odin Agent |
| `Odin → Oscar: writing the draft...` | Oscar drafting |
| `Odin → Huginn: researching citations and related articles...` | Citation research pass |
| `Huginn → Odin: verified links woven in.` / `nothing worth linking this time.` | Research outcome (honest zero-link line) |
| `Odin → Heimdall: reviewing accuracy, tone and polish...` | Quality gate |

Final event is `{ type: "done", libraryId: "..." }` or `{ type: "error", message: "..." }`.

---

## Original social content (no article)

The article pipeline above is not the only content source. Social creators can start from an **original idea** instead: the social studio's "From an original idea" mode posts to `POST /api/socials/compose`, which creates a social-only library item (`sourceType: "original"`, holding the idea brief) and hands the idea straight to Loki with idea-specific prompt framing ("develop this idea; add no facts the brief does not contain"). No transcript, no Oscar, no article draft — the result lands in the Social Library and moves through the same studio, revise, and review lifecycle as syndicated content. See [`api-reference.md`](api-reference.md#post-apisocialscompose) and [`data-model.md`](data-model.md) for the item shape.
