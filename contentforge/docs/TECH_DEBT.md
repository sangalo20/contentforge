# Tech Debt Register

Known, deliberate debt across ContentForge and odin-agent — things we chose not
to fix yet, with the reason and the trigger that should reopen them. This is a
living document: when you take on new debt, add an entry; when you pay one off,
delete it (git history is the archive).

**Rules of the register:**
- Every entry says *why it's parked* and *when to fix it* — not just what's wrong.
- If a new feature would make an entry worse (e.g. adds to the monolith), that's
  the trigger firing: address the entry first or consciously re-park it here.
- Last reviewed: **2026-07-19** (major payoff pass: the server.js monolith,
  route-level tests, the frontend lint backlog, Odin test coverage, the litellm
  pin, and request-time model config were all cleared — see git history).

---

## 1. Legacy status migration: applied? Delete the read-time normalizers

Four generations of data coexist in `content_pipeline_library`:
`pending_approval` (legacy article status), items with no `status` at all
(pre-review-gate, read as approved), nested `socials.<ch>.copy` shapes
(pre-flattening), and items with `youtubeUrls`/`transcript` but no `sources[]`
(pre-multi-source, 2026-08). `scripts/migrate-legacy-statuses.js` backfills
all four (dry-run by default, `--apply` to write); the 2026-07-19 dry run
found 10 of 15 documents needing the first three. New items still write the
legacy `youtubeUrls`/`titles`/`transcript` fields alongside `sources[]`
(see `itemFieldsFor` in routes/generate.js) until this migration is applied
and the readers are swept.

- **Why parked:** the `--apply` write touches production Firestore and is
  awaiting explicit sign-off.
- **Cost while parked:** every reader must keep the legacy branches:
  `pending_approval` mapping in the dashboard, `.copy` fallbacks in
  routes/socials.js and the frontend `restoredResultFor`, the
  `|| 'approved'` status defaults, and the normalizers in routes/v1.js
  (`articleStatusOf`/`sourcesOf` — added 2026-08 so external clients never see
  the legacy shapes).
- **Fix when:** approval lands — run `--apply`, spot-check the dashboard and
  Social Library, then delete the normalization branches above (original-idea
  items keep no article status by design; that default stays). The v1
  normalizers simplify but their OUTPUT shape must not change — v1 is a
  compatibility surface (see the External API v1 entry).

## 1b. External API v1 is a compatibility obligation

`/api/v1` (routes/v1.js, added 2026-08-29) is the machine-facing surface for
users' workbenches and scripts — the first API external clients build against,
which makes its shapes a promise, not an implementation detail. The documented
contract (api-reference.md → External API v1): job-style generation, normalized
item shapes that hide the legacy Firestore fields, `{ error: { code, message } }`
envelopes.

- **Why an entry:** nothing is broken — this records the obligation so future
  changes don't casually break external callers the way internal routes can be
  reshaped alongside the frontend.
- **Cost while parked:** none day-to-day; every change touching v1 responses
  must be additive (new fields OK, renames/removals are breaking). If a
  breaking change ever becomes necessary, that's `/api/v2`, not a v1 edit.
- **Enforcement (since phase 3, 2026-08):** `docs/openapi.v1.json` is the
  frozen spec and `tests/openapi.contract.test.mjs` gates CI on spec↔router
  agreement. Every verb lives once in `lib/v1Operations.js`, served by both
  the REST router and the MCP endpoint (`/api/v1/mcp`) — MCP tool changes are
  v1 changes and carry the same additive-only rule.
- **Fix when:** never "fixed" — delete this entry only if the external API is
  retired.

## 2. Residual test gaps (harnesses exist; coverage is opportunistic)

All three services now have gating test suites (backend 84, frontend 9,
odin 20) and the infrastructure to grow them cheaply: the backend fake-
Firestore seam (`tests/helpers/fakeFirestore.mjs` + `lib/firebase.js`), the
frontend mock pattern in `SocialMediaSyndication.test.jsx`, and Odin's
bare-`__new__` agent + stubbed `litellm` pattern. Known untested seams:
backend route breadth beyond the security-critical set (publish gate,
review submit/decide, workspace trash), Odin's forwarded-identity handling
(`auth.py`) — and `test_oscar.py` is still a manual smoke script.

- **Why parked:** the expensive part (harness setup) is done; the remaining
  seams change rarely.
- **Cost while parked:** regressions in the unlisted seams surface in manual
  use rather than CI.
- **Fix when:** each seam's next change — add its tests with the established
  pattern as part of that work, never as a separate project.

## 3. Loki source-type handling is inline if/else, one agent by design

Original-content support (July 2026) threads a `sourceType` flag
(`article` | `idea`) from the library item through the backend to Odin, where
`agents.py` branches inline in three places (generate, revise, studio chat) to
swap Loki's prompt framing: condense the article vs. develop the idea brief.
This was chosen over (a) a specialized Loki variant and (b) a declarative
source-type registry — deliberately. One agent keeps the hard-won gate stack
(writing-craft, humanizer, CTA rules in `loki.xml`) as a single source of
truth; a second brain would duplicate it and drift. The rule applied: same job,
different input → prompt lever; different job → different agent.

- **Why parked:** two source types don't earn an abstraction; the inline
  branches mirror how PERSONA/FUNCTION/CHANNEL levers already work.
- **Cost while parked:** adding a source type means finding all three branch
  sites in `agents.py` (plus the Pydantic models in `main.py` and
  `lib/socialSource.js` in the backend).
- **Fix when — trigger 1 (registry, still one agent):** a third source type
  lands (the skill pack anticipates podcast transcripts, Notion notes, KB
  extracts). Promote the branches to a `SOURCE_TYPES` dict beside
  `SOCIAL_FUNCTIONS` mapping type → system block / prompt verb / grounding
  label, so new types are one entry, not a three-site edit.
- **Fix when — trigger 2 (new agent):** origination stops being "develop this
  brief" and becomes a different job — ideation, topic planning, series
  brainstorming (à la the `linkedin-posts` / `joe-shortform-topics` skills).
  Build that as a separate ideator agent that *feeds* the compose lane an idea
  brief; do not fork Loki.

## 4. Duplicated plumbing to fold in when next touched

Identified in the 2026-08-09 architecture review; none is worth a dedicated
project, all should be folded into the next change that touches them:

- **Odin's streaming/tool-accumulation loop exists three times** in
  `agents.py` (Loki studio, Mimir scout, Odin chat) — ~60 identical lines of
  chunk/delta/tool_calls accumulation each. Extract a `stream_llm_events()`
  helper the next time any of the three changes; agents keep their own
  prompts and result handling.
- **Model-resolver copy-paste** (`_loki/_heimdall/_mimir_model_str`) — one
  `_model_from_env(var, default)` when next edited.
- **SSE endpoint boilerplate ×3 in odin main.py** (chat/studio/scout
  StreamingResponse wrappers) — same fold-in rule.
- **Frontend SSE chat loop ×3** (`StudioChat`, `VaultScoutChat`,
  `ImageChatModal`) — extract a `useSSEChat` hook when next touching any
  chat surface.
- **Oscar has no retries/fallback** while Loki does — the one behavioral gap
  from the review: a single provider blip kills a whole generation. Fix
  trigger: the next Oscar change, or the first observed prod failure.

## 5. Moguls internal links blocked by a stale website deployment

Huginn's internal-link pass is wired for both connections but active only for
joedowns.ai. The moguls article URL pattern is confirmed from the
moguls-website source (`storagemoguls.ai/blog/{slug}` — `src/app/blog/[slug]`,
ISR), but the **live Vercel deployment predates that route**: every published
article URL 404s (verified against real slugs, oldest and newest,
2026-08-10). GitHub main has the route; production Vercel is serving an older
build. Until the site redeploys, `articleUrlPattern` for the `storagemoguls`
connection stays `null` (see `lib/sanityConnections.js`) so Huginn never
weaves dead links.

- **Why parked:** the fix lives in the moguls-website Vercel project, not in
  this repo — likely a failed/unpromoted production deployment. Needs the
  Vercel dashboard, which ContentForge tooling doesn't touch.
- **Cost while parked:** Storage 101 articles get no internal links (topic-
  cluster SEO left on the table) — and more urgently, every article
  ContentForge publishes to the moguls Sanity project has **no working public
  URL at all**. Sangalo notes (2026-08-10) the website has been promoted from
  secondary to primary, which raises this from cosmetic to real.
- **Fix when:** the site is redeployed from current main and
  `storagemoguls.ai/blog/<slug>` serves real pages — then set
  `articleUrlPattern: 'https://storagemoguls.ai/blog/{slug}'` and internal
  links go live on the next generation. Verify with one live article URL
  before flipping.

## 6. Operational constraints worth knowing (accepted, not scheduled)

Not scheduled work — documented so nobody "fixes" them into a regression:

- **Heimdall QA gate is fail-open** by design: a QA failure never blocks a
  draft, it annotates it (`qaReport`). Revisit only if unreviewed AI output
  becomes a business risk.
- **Grok image URLs are temporary** — cover images must be downloaded promptly
  after generation (ContentForge does, via the SSRF-guarded fetch). Never
  persist a bare xAI URL as the durable copy.
- **WeasyPrint imports must stay lazy** in odin-agent's service code (native
  libs, cold-start cost). The test suite imports it eagerly — that's fine,
  tests aren't the serving path.
- **Odin returns raw exception text** (`str(e)`) in 500s and some SSE error
  events. Loki's paths (generation, revision, studio chat) now map provider
  errors to human-readable messages (`_friendly_llm_error`), but Odin's article
  chat stream and JSON 500s still leak `str(e)`. Acceptable while Odin is
  IAM-locked with ContentForge as the only caller; sanitize if any additional
  caller is ever granted invoker.
- **Hard-deleting a social asset orphans its rendered file.** Finalized
  carousels/posters carry a `fileId` pointing at a rendered PDF/PNG in Odin's
  render store; `POST /api/socials/delete` removes the Firestore entry but
  deliberately leaves the file (cheap, and the render store may be shared).
  Fix trigger: if the render store ever grows unbounded or gets billed
  noticeably, add a cleanup call to Odin on delete.
- **`/api/v1` jobs run in-process, not on a queue.** `lib/jobs.js` executes a
  submitted generation inside the same Node process and caps concurrency with
  an in-memory counter (`V1_MAX_ACTIVE_JOBS`, per instance — not global across
  replicas). A crashed/redeployed instance leaves its jobs stuck in
  `queued`/`running` forever; callers should treat a long-stalled job as dead
  and resubmit (the duplicate check makes resubmits safe). The deployment must
  keep CPU allocated between requests (see configuration.md). Fix trigger:
  real multi-instance scaling or a need for restart-surviving jobs — then move
  execution to Cloud Tasks or a Firestore-lease worker loop.
- **The `lib/firebase.js` test seam** (`__CONTENTFORGE_TEST_FIREBASE__`)
  exists because vi.mock cannot intercept native CJS requires. Route tests set
  it before importing modules; production code must never set it.
- **Frontend bundle is one large chunk** (>500 kB minified; Vite warns on
  build). Fine at current team/user scale; code-split if first-load time ever
  matters.

## 7. Brand Studio v1 — deliberately parked pieces

The Brand Studio (`frontend/src/brand-studio/`, added 2026-08-22) is a port of
a borrowed Prescott-built design studio, cut down to the templates our content
business uses. What was consciously left behind, and what's still pending:

- **Logo files are pending for the non-Moguls brands.** Storage Moguls' kit
  landed 2026-08-23 (`frontend/public/logos/storagemoguls/` — color/black
  lockups + icons from the delivered kit; the white marks are generated
  reversed variants via an SVG invert filter). The other four brands'
  `logos: []` stay empty and render the typographic wordmark. Fix trigger:
  each brand's SVG lockups arrive → drop in `frontend/public/logos/<brandId>/`,
  trim viewBoxes to the artwork, list in `brands.js` with `luma` values and a
  `logoFor` dark/light default.
- **Parked template subsystems** (exist in the source repo at
  `../brand-studio`, not ported): the swag mockup engine + vendor print packs
  (~750 lines, needs real logo files to be useful; its print-pack email also
  has a known prod bug — `server/index.mjs` drops `zipBase64`), the isometric
  architecture engine (~520 lines, brand-clean and portable if ever wanted),
  recharts dataviz, terminal/HUD/research templates (Prescott-product-shaped),
  and the Discord kit. Port on demand; don't rebuild from scratch.
- **Per-brand default copy is thin outside Storage Moguls.** SI/JD/StorPro/
  Belrose entries have palettes/fonts/voice facts but mostly generic seed copy
  (`buildDefaults` generic branch). Enrich `brands.js` `copy` blocks as those
  brands start using the studio.

## 8. Social rendering: Classic (Odin) is now legacy-only — retire it

Both social artifact kinds now have full **studio paths** (Brand Studio
designs rendered client-side, bytes frozen in Firebase Storage at approval):
posters since 2026-08-24 (`.../socials/posters/<itemId>_<channel>.png`), and
carousels since 2026-08-30 (slide-kind → design-set mapping in
`socialCarouselDesigns.js`, pages bound with jspdf, PDF frozen at
`.../socials/carousels/<itemId>_<channel>.pdf`; finalize skips Odin entirely
when a studio design is chosen). **Classic** (Odin's `carousel_pdf.py` /
`render_poster`) remains only as: the default for pieces where no design was
picked, and the re-render path for legacy assets that carry just a `fileId`.

- **Why parked:** operators should live with studio carousels briefly before
  Classic is removed from the pickers; and legacy approved assets' bytes
  exist only in Odin's render store.
- **Fix when — the kill sequence:** (1) after a few weeks of studio-only use,
  make a studio design the default for NEW posters and carousels and drop
  "Classic" from both pickers; (2) migrate legacy fileId-only assets (render
  each once more via Odin, freeze the bytes into our Storage) or accept
  losing their re-downloads; (3) retire `carousel_pdf.py`/`render_poster` and
  the render-store routes in odin-agent, plus this repo's render/template
  proxies (`/api/carousel/templates`, the Odin fallbacks in the durable
  download routes) — and delete the orphaned-render-file note in entry #6.
