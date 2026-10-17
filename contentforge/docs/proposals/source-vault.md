# Source Vault

**Status:** Phases 1–2 implemented (2026-08-08) — vault, import, usage
logging, channel sync, and the Mimir scouting chat (the "what should I write
next?" experience, reached from the composer's YouTube card).
**Problem:** Choosing source material was cumbersome: check YouTube, cross-check
a hand-maintained markdown log (`content-pipeline/transcripts/
transcript_usage_log.md`) to avoid reuse, update the log manually after writing.

## Design

- **Workspace-scoped vault** (`content_pipeline_vault`): every reusable
  source — imported corpus transcripts, hand-staged videos, watched-channel
  uploads — with full text snapshots and a `usedIn` ledger. Entries carry
  `workspaceIds` (one or several): the vault page lives inside each workspace
  (Source Vault tab), access follows workspaceAccess, and a source shared by
  several properties (the old log tracked one corpus across Moguls blog,
  Medium, and the Real Rep newsletter) exists ONCE with one ledger, assigned
  to each. Staging an already-vaulted video from another workspace shares it
  rather than duplicating; watched channels belong to a workspace.
- **Compose from the vault**: a "From vault" picker in the Forge composer
  (multi-select, unused-first, instant — no re-fetching). The `vault` source
  type resolves from stored text; generation appends usage records
  automatically. The manual "move the row to the Used table" ritual is gone.
- **Reuse guard**: pasting a YouTube URL the vault knows warns inline
  ("Already used in ...").
- **Staging**: bank transcripts before needing them (paste up to 20 URLs on
  the Vault page; Supadata fetches transcripts immediately).
- **Channel sync**: watched channels (admin-configured) are checked for new
  uploads via Supadata's channel-videos endpoint (no new credential); new
  videos land as unused entries with transcripts. Cadence: auto-sync on any
  vault visit when the last sync is >7 days old, plus a manual button.
  A Cloud Scheduler cron is the hardening upgrade if clockwork matters.
- **URL composing stays**: the vault adds a path; it replaces nothing.

## Import (one-time, sign-off required)

`backend/scripts/import-source-vault.js` (dry-run default, `--apply` writes):
reads the legacy corpus (107 Storage 100 transcripts grouped by course
section + Successful Idiots episodes), parses the usage log's Used table into
external usage records (fuzzy title matching covers slug-named files and
punctuation drift), and backfills usage from existing ContentForge library
items by source-title match. The corpus directory is never modified.

## Phase 2 — Mimir, the vault scout (implemented 2026-08-08)

A dedicated ideator agent (Mimir, in odin-agent — per TECH_DEBT #3's
"separate ideator agent that feeds the compose lane" rule) converses over the
workspace's vault digest (titles, groups, per-workspace usage, excerpts —
never full transcripts) plus recent article titles and the persona.
Entry point: the composer's YouTube card shows "Scout the vault — N unused
transcripts" when material exists; the session ends with a hard-grounded
propose_sources call (only digest ids survive) rendered as a proposal card
whose "Use these" drops vault source cards into the composer. Generation
then logs usage automatically. Replicates the old IDE-agent ritual inside
the product with perfect ledger knowledge.
