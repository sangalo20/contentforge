# Proposal: Multi-source ContentForge

**Status:** Phases 1–2 implemented (2026-08-07) — youtube/url/text/github/code
resolvers, the Source Composer, budgets, Oscar's code-source prompt hint, and
the migration step are live; Phase 3 (document uploads, per-source toggles)
pending.
**Author:** drafted with Claude, 2026-08-07
**Problem:** The forge only ingests YouTube. A creator may start from an idea,
one article, a string of articles, a block of code, a GitHub repository,
documentation — or any mix. The experience must support composing content
from more than one kind of source.

---

## Why this is smaller than it looks

The deep pipeline is already source-agnostic:

- **Oscar** (the writer) takes a text blob plus `source_count`, and already
  blends multiple `=== SOURCE N: title ===` sections into one seamless
  article ("MULTI-SOURCE SYNTHESIS" instruction in `agents.py`).
- **Heimdall, Loki, Hermes** never see the source at all — they work from the
  draft.

YouTube-ness is concentrated in exactly three places:

1. Ingestion code in `backend/routes/generate.js` (Supadata transcript fetch).
2. The `youtubeUrls` / `transcript` fields on the library item.
3. The `PipelineTrigger` UI (a list of URL inputs).

Those three are what we generalize. Odin barely changes.

---

## 1. Data model — a `sources[]` array on the library item

```jsonc
"sources": [
  { "type": "youtube", "url": "https://youtu.be/abc",        "title": "Video title",   "text": "<transcript>" },
  { "type": "url",     "url": "https://blog.example/post",   "title": "Article title", "text": "<extracted text>" },
  { "type": "text",    "label": "Pasted notes",                                        "text": "..." },
  { "type": "code",    "label": "billing.py", "language": "python",                    "text": "..." },
  { "type": "github",  "url": "https://github.com/org/repo", "title": "org/repo",      "text": "<README + selected docs>" },
  { "type": "idea",                                                                    "text": "creator's brief" }
]
```

- Each source stores its **resolved text at add-time** — an immutable
  snapshot, exactly like transcripts today. Re-resolving is an explicit user
  action, never implicit.
- The combined generation input stays the labeled concatenation Oscar already
  understands, now labeled by type as well as title:
  `=== SOURCE 2 (code): billing.py ===`.
- `youtubeUrls` / `transcript` remain as legacy read paths (the TECH_DEBT #1
  pattern); `scripts/migrate-legacy-statuses.js` grows a step that backfills
  `sources[]` from them.

## 2. Backend — a resolver registry in `lib/sources/`

One contract, one module per type:

```js
// lib/sources/<type>.js
resolve(input) -> { title, text, meta }   // throws a user-safe error on failure
```

| Type | Resolver | Notes |
| --- | --- | --- |
| `youtube` | Existing Supadata fetch, moved out of `routes/generate.js` | Keeps the global transcript cache; the route file loses ~100 lines of ingestion code it shouldn't own |
| `url` | Fetch + readability extraction | **Must go through the existing `lib/ssrf.js` guard** — this is the security-sensitive resolver |
| `text` / `code` / `idea` | Passthrough | Validation + size caps; `code` carries a language tag so Oscar can be told "reference and explain, don't reproduce wholesale" |
| `github` | GitHub API: README + docs tree + user-picked files | Deliberately **not** whole-repo ingestion (see decision 2) |
| `document` | PDF/docx upload → Storage → extraction | Phase 3 — needs upload plumbing |

**API:** `POST /api/generate/content` (and the SSE streaming variant) accepts
`sources: [{ type, ... }]`. `youtubeUrls` stays as an alias that maps to
youtube sources — zero breakage for existing clients.

## 3. Odin — almost nothing

- Oscar's payload gains `source_types`; his prompt gets per-type framing
  hints (e.g. code sources are explained, not pasted).
- This is exactly the trigger **TECH_DEBT #3** predicted: the *third* source
  type promotes Loki's inline article/idea branches to a `SOURCE_TYPES`
  registry beside `SOCIAL_FUNCTIONS` — new types become one dict entry, not a
  three-site edit through `agents.py`.

## 4. UX — PipelineTrigger becomes a Source Composer

- An **"Add source"** picker: YouTube / Web article / Paste text / Code /
  GitHub / Idea.
- Each added source renders as a card: type icon, title, char count, remove
  button (behind the shared confirm dialog).
- One **Generate** button under the stack. Mixed stacks are the point:
  a YouTube video + a docs page + a code snippet → one article.
- The library card's "N videos" badge becomes typed source badges.

## Phasing

| Phase | Scope | Covers |
| --- | --- | --- |
| **1** | `sources[]` model, registry with `youtube`/`url`/`text` resolvers, composer UI, legacy alias + migration step | "an idea, another article, a string of articles, documentation (pasted)" |
| **2** | `code` + `github` resolvers, per-type prompt hints in Oscar, Loki `SOURCE_TYPES` registry in Odin | "a block of code, a github repository" |
| **3** | Document uploads (PDF/docx), per-source include/exclude toggles at re-generation | attachments, iterative regeneration |

## Decisions

1. **Context budget** *(decided 2026-08-07)*: **60k chars per source**
   (~15k tokens — covers a full hour of YouTube transcript), **240k chars
   total per item** (~60k tokens — fits every supported provider including
   Anthropic workspaces, and keeps the blend high-signal). No silent
   truncation: oversized sources are rejected with a clear message, and the
   composer shows a running total meter. A later phase may add an "AI
   condense" action for oversized sources.
2. **GitHub depth** *(decided 2026-08-07)*: **README + `docs/` tree +
   hand-picked files**, each counting against the per-source budget. No
   whole-repo summarization: for content writing the narrative lives in
   README/docs/examples, and illustrative code is covered by the `code`
   source type. A smart repo-digest agent (tree map + selective reads) is
   buildable but is Phase-4-sized Odin work — revisit only with evidence
   that README+docs is insufficient.
3. **The compose lane** *(open — defaulting to idea-only)*: original-idea
   social composition stays idea-only in Phase 1; the composer is built as a
   reusable component so it can be dropped into the compose lane later.
