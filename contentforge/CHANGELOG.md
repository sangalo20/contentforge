# Changelog

Notable changes to ContentForge and its companion Odin agent service.
The log begins 2026-08; earlier history lives in git. Dates are merge-to-main
(production deploys follow automatically via Cloud Build).

## Unreleased (branch `feat/studio-live-event`)

### Brand Studio — Live Event Bill + scannable QR (contentforge)
- New **Live Event Bill** template (1080×1350) in Events & Announcements: the
  whole in-person event flyer on one sheet — kicker, stacked headline,
  standfirst + callout, when/where, agenda, price plate, audience, inclusions —
  with a real **QR code** to the registration link (new `QrCode` atom,
  `qrcode-generator`; payloads verified by decoding the rendered PNGs). Six
  screenshot-verified designs: Bill, Ticket, Blueprint, Receipt, Marquee, Door.
  Seeded with Storage Moguls Live · White Marsh (Oct 16, 2026).
- Content tab labels for the template's `·`-separated field conventions;
  `ctaUrl` doubles as the QR target.
- `render.html` dev harness: one template at true resolution from query
  params, for headless screenshots (documented in `docs/brand-studio.md`).

## 2026-08-29

### External API layer — keys, /api/v1, remote MCP (PR #42)
- `cfk_` API keys: admin-minted machine credentials (Settings → API Keys,
  one-time reveal, workspace scoping, soft revoke); resolve to the standard
  auth context so every guard applies unchanged. Keys can never manage
  credentials — and **deletion is now human-only everywhere** (the delete
  routes reject API keys regardless of role).
- `/api/v1` REST surface: job-style async generation (202 + poll), normalized
  item shapes across the legacy data generations, finalize/publish, reviewer
  listing + review submission, comments with @mentions, socials (list, fetch,
  generate). People params accept uids or member emails.
- Remote MCP endpoint at `/api/v1/mcp` (Streamable HTTP, stateless): the same
  operations as 14 typed tools for agentic workbenches; connect with
  `claude mcp add --transport http … --header "Authorization: Bearer cfk_…"`.
- `docs/openapi.v1.json` freezes the v1 contract; a CI contract test fails on
  any spec↔router disagreement (TECH_DEBT #1b).
- Internals: pipeline, publish, review submission, comment posting, and social
  generation each extracted to `lib/` — app routes, v1, and MCP share one
  implementation. Deploy note: v1 jobs run in-process → Cloud Run needs CPU
  always allocated.

## 2026-08-27

### Brand Studio upload hardening (PR #41)
- File picker kept in the DOM until it settles (WebKit GC'd detached inputs —
  uploads intermittently did nothing).
- Uploads downscale before state/matting (1600px cutouts, 2560px otherwise);
  unreadable formats (HEIC) now fail with a clear message.
- Background-removal ladder: WebGPU isnet_fp16 → quantized CPU fallback, each
  behind a 90s timeout; the model download warms 3s after the studio loads.

## 2026-08-24

### Studio-rendered social posters (PR #40)
- Pipeline posters can now wear the Brand Studio design system: the chosen
  studio design persists on the asset and approved PNG bytes freeze in
  Firebase Storage; Classic (Odin-rendered) remains available. Carousels stay
  Classic-only for now (TECH_DEBT #8).

## 2026-08-23

### Brand Studio — design wardrobes across the studio (contentforge)
- Every feed-facing template now carries a Design picker: Storage 101,
  Podcast Announcement, and Episode Art at 12 designs each; Speaking,
  Announcement, Office Hours, Myth vs Fact, Blog Cover (rebuilt from
  scratch), Editorial Cover, Quote Card, Newsletter Issue, Webinar, and
  Split Panel at 8; Chart and Partnership at 6 — 150+ distinct designs,
  all screenshot-verified via the preview harness.
- Podcast Announcement joins the portrait pipeline: optional guest
  photos (primary + up to two Additional Guests, AI cutout); presence
  of an upload is the toggle, every design has a finished no-photo form.
- Display Ad and Email Hero each ship 8 rotation-ready creatives that
  hold the message constant and vary the persuasion mechanism; every
  variant keeps its data-cta element so linked-PDF exports stay
  clickable.
- Deliberately locked to one canonical format: YouTube thumbnail
  (4 content-type variants), video title card, lower third, end card —
  their value is repetition; Episode Card renamed Episode Art.
- Shell: per-template variant wiring consolidated into one VARIANT_SETS
  map; multi-speaker support extended so every speaking design seats a
  panel of two or three.

### Brand Studio — Moguls design system, identity, and Brand Kit (contentforge)
- "Operator's ledger" design series for Storage Moguls: 12 original
  templates (brand seal, operator chart, big number, report,
  announcement, partnership, event ticket, speaking bill, office hours,
  podcast announcement, Storage 101 lesson, myth-vs-fact) plus new
  brand atoms (seal, ticker rail, door slats, masthead, ledger rules).
- Two-tier SM identity: the delivered logo kit installed as the display
  tier; a redrawn flat "ledger mark" + outlined-type lockups (fontTools)
  as the functional tier and in-app default. Dev logo lab at
  /logo-lab.html, template gallery at /preview.html.
- Palette wall grown to 24 presets in six families; Daylight (light
  blue + style-guide brand blue) is the working default, video surfaces
  keep navy seeds.
- Brand Kit section: original flat merch mockups (tee, hoodie, cap,
  mug, notebook, bottle) with colorways and identity prints
  (mark/lockup/seal/tagline/slats), auto-contrast ink.
- Studio UX: viewport-pinned shell (only the sidebar scrolls),
  fit-to-pane preview scaling, template selection no longer jumps tabs,
  non-Moguls brands gated as coming soon.

## 2026-08-22

### Brand Studio (contentforge)
- New `/brand-studio` route: an on-brand graphics studio ported from a
  borrowed Prescott-built design tool and fully re-branded around a central
  Belrose brand registry (`frontend/src/brand-studio/brands.js`). Five brands
  ship with verified palettes/fonts/voice — Storage Moguls (first and
  default, with curated practitioner-voice seed copy), Successful Idiots,
  Joe Downs, StorPro, Belrose Group. Twelve templates (blog/editorial covers,
  quote card, split panel, newsletter, episode card, YouTube thumb, title
  card, lower third, end card, display ad, email hero) plus two motion
  exports (animated lower third with alpha PNG sequence, logo sting WebM).
  Exports render client-side; templates fall back to typographic wordmarks
  until brand logo files land in `public/logos/<brandId>/`.
- New `POST /api/brand-studio/generate-image`: Vertex AI Imagen behind the
  existing auth, with server-owned per-brand art direction (Storage Moguls
  gets editorial navy/electric-blue, not the donor repo's cybersecurity
  look). Uses ADC against `GCP_PROJECT_ID`; the donor's hardcoded Prescott
  GCP project and Azure print-pack email endpoint were dropped.
- Brand fonts self-hosted in `public/fonts/` (Barlow Condensed, Montserrat,
  Big Shoulders Display, Fraunces, Oswald, Open Sans, Space Mono, Inter).

## 2026-08-12

### Studio chat stage narration (odin #16)
- The studio chat no longer goes silent while Loki revises: a revision
  streams back as one big tool call, and the reviewer used to stare at a
  stale "Odin is thinking..." spinner until the canvas updated. Loki now
  announces the rework as soon as it starts ("Odin → Loki: reworking the
  carousel...") and ticks progress as slides/thread-posts land ("writing
  slide 3 of ~6..."); memory recall surfaces as its own stage line. No
  frontend or contract change — StudioChat already rendered status events.

### Unshipped social channels hard-gated (contentforge #35)
- Instagram, Facebook, and TikTok tabs now show only the Coming Soon
  notice. Previously the compose surface (source cards, idea box, article
  picker, activity log) rendered on every channel, so the tabs read as
  usable while leading nowhere.

## 2026-08-10

### Huginn — citation research (contentforge #33, odin #15)
- New research pass between Oscar's draft and Heimdall's review: **Huginn**
  extracts citable claims (statistics, market figures, industry concepts —
  never the author's own frameworks), searches the web (Serper), verifies
  each candidate page actually supports the claim, and weaves verified links
  in by exact-span replacement. Max 4 web citations + 3 internal links per
  article; strictly fail-open.
- Internal links draw from the workspace's published articles; active for
  joedowns.ai, pending a site redeploy for storagemoguls.ai (TECH_DEBT #5).
- Forge stage lines narrate the pass, including an honest
  "nothing worth linking this time" when zero links land.

### Agent memory — Athena MemOS integration (contentforge #32/#33)
- Scout and studio chats now **remember past sessions**: a turn-start recall
  block is injected into prompts, and every exchange is stored back. Tenancy:
  workspace → operator → odin.
- A `search_memory` tool lets agents recall deliberately mid-conversation
  ("what did we decide about openers?") via the shared backend tool loop.
- Typed cognitive events: tool moves become `action`/`observation` events,
  ratified judgments (accepted editorial angles, Heimdall QA findings) become
  `thought` events. Full artifacts (drafts, long tool results) ride to GCS
  blob storage via Athena's Claim Check pattern.
- Athena itself (Belrose-Group/athena fork) was made production-real on GCP:
  provider-agnostic LLM calls, ADC/Vertex auth (no API keys), a working GCS
  blob store, nightly graph analytics via Cloud Scheduler, and full
  monitoring/alerting parity (fixes tracked upstream as
  Prescott-Data/athena issues #18–#25).

### Source Vault + Mimir scouting (contentforge #32, odin #14)
- **Scout the vault**: a chat session from the composer's YouTube card
  (Mimir agent, branded Odin) that helps pick transcripts — unused-first
  recommendations, pairings, hard-grounded proposals that become composer
  source cards plus an editorial brief (angle + working title) steering
  Oscar.
- **Gists**: every vault entry gets a 2–3 sentence substance summary + topic
  tags at ingest (201 existing entries backfilled); the scouting digest reads
  gists instead of greeting-text excerpts.
- **Agentic tools**: Mimir reads full transcripts on demand
  (`read_transcript`, workspace-checked, max 3/turn) through the shared
  backend tool loop (`lib/odinStream.js`).
- Hotfix: Mimir's Vertex location forwarding (scout 404'd in prod).

### One assistant face
- The UI presents only **Odin**; specialist agents (Oscar, Heimdall, Hermes,
  Loki, Mimir, Huginn) surface as delegation lines ("Odin → Oscar: writing
  the draft..."). Usage & Cost keeps per-agent names with role labels.

### Usage attribution
- Vault gisting and the cover-image chat now attribute their AI spend to the
  triggering workspace (previously filed under "Unknown" in Usage & Cost).

## 2026-08-09

### Multi-source composer, per-user GitHub, vault foundations (PR #31 and earlier)
- Source Composer: youtube / url / text / github / code sources with a
  240k-char context budget and per-source caps.
- Per-user GitHub connections (Settings → Integrations, fine-grained PATs).
- Source Vault: workspace-scoped transcript ledger with per-workspace usage
  tracking, staging, and bounded weekly channel sync (shorts excluded).
- Loki resilience: retries + Gemini fallback for the studio (mid-stream
  "Overloaded" no longer reaches reviewers); social deletion with approver
  accountability; mention-email links fixed to the public domain.
