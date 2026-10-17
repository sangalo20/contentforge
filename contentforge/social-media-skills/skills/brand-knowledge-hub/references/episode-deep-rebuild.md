# Episode Library DEEP-REBUILD pass — upgrading shallow rows to the full method

Companion to `episode-ingestion.md`. That file covers the FIRST pass (bulk-ingest a back catalog
into light rows). THIS file covers the SECOND pass Joe later asked for (June 2026): upgrading the
shallow bulk-ingested rows to the deep, fully-mined "new understanding method" — the same depth as
the hand-built SI 028/029/030 records.

## When to run this
Joe: "find the episodes with shallow data and delete them, then rebuild one by one with our new
understanding method." Trigger on any "rebuild / deepen / upgrade the episode knowledge" request.

## STEP 0 — assess depth by EVIDENCE, present a list, do NOT delete-first

1. **Sample, don't assume.** Pull a known-DEEP benchmark (028/030), a couple of bulk-ingested rows,
   and any flagged duplicates. Measure depth by structure, not vibes. The three tiers that emerged:
   - **DEEP** ✅ — Hook · per-insight breakdowns · proof points · timestamps · quotes · attribution.
   - **SOLID** ✅ — guest bio + hook + 5–6 substantive insights with real numbers/frameworks. **SM 001–008
     are ALL solid — they were NOT shallow.** Do not blind-delete a whole brand; audit first.
   - **SHALLOW** ⚠️ — hook + one blurb paragraph + a one-line semicolon `Key Insights`. (SI 001–027.)
2. **Rebuild IN-PLACE, not delete-then-recreate** (push back on "delete first" — Joe accepted this):
   - The Notion MCP token CANNOT hard-delete (only rename to "🗑️ DELETE ME" for manual trash), so
     "delete" isn't clean anyway.
   - Delete-first creates a DATA GAP — even a shallow row has a usable hook + tags. Overwriting the
     row (update properties + `replace_content`) means it's never empty and "done" = visibly deep.
3. **Present the audit + the cut line for approval BEFORE touching anything** (deletion/overwrite of
   many rows is high-consequence). State which brand is already solid so it's not touched.

## The deep-record TEMPLATE (match SI 028/030 shape)
Page body, in this order:
- **Hosts + Hook** (one line each). For interviews, a `**Guest:**` bio line.
- `## Mineable Insights` — numbered, each with a 2–4 sentence explanation (the mechanic, not a label).
- `## Concrete proof points` — the hard numbers as a bullet list.
- `## Standalone-strong quotes (safe verbatim)` — quotable lines.
- `## Key Timestamps` — even approximate (older transcripts have minute-marks, not clean labels — say "approx.").
- `**Attribution:**` line — who owns which result/story (hard rule, see below).
- `**Links:**` brand site + email.

## The 3 STRUCTURED fields (added to the Episode Library schema, June 2026)
`update-data-source ADD COLUMN ... RICH_TEXT` (ADD never rebuild). Populate all three per row:
- **Keywords / Phrases** — searchable terms + signature VERBATIM lines (find an episode by the phrase you remember).
- **Frameworks** — named reusable-IP concepts (Three-Prompt System, Parlor Trick, Date Your AI, Board of Advisors).
- **Proof Points** — the hard numbers/stats that make content hooks.
Keep **Frameworks as TEXT during the rebuild**; promote to MULTI_SELECT only AFTER all episodes are
done and the full vocabulary is known (a multi-select built from 5 episodes gets restructured repeatedly).
Set `Status = Verified` on a genuinely deep row; `Needs Review` when the source was insufficient (below).

## Source-acquisition for the deep pass
TRANSCRIPT is the richest source (timestamps + verbatim quotes) — prefer it over Show Notes/Blog here.
Per episode: `drive search "'<folderId>' in parents" --raw-query` → find `Transcript*.docx` → download →
extract via `C:/Python313/python.exe` + python-docx (the ONLY interpreter with the module; the
execute_code sandbox python lacks it — run the extractor through `terminal` instead, `PYTHONPATH=` cleared).

### ⚠️ Empty-stub gotcha extends to TRANSCRIPTS too
Not just SM Show Notes — a transcript itself can be a **0-byte / empty file in Drive** (hit on SI 002:
both Transcript AND Blog were empty; only the 24-line Show Notes had content). When the deep source is
missing: build the best record the available source allows, mark **Status = Needs Review**, and put a
`⚠️ SOURCE NOTE: transcript empty in Drive — re-transcribe <MP3 name>` banner at the top of the body.
Do NOT fabricate transcript-level depth that isn't in the source (Joe values honest gaps over fake depth).

## Process the source into UNDERSTANDING — never stitch transcript phrases
Same rule as the `*-podcast` skills: read the transcript, then WRITE the insight from its meaning in
the brand's analytical voice. Don't paste spoken fragments. Verify facts against the transcript, not the
old shallow property (e.g. the old SI 004 prop said "Joe's $400K deal"; the transcript showed it was a
$605K offer on a ~$1M facility — fix to the truth).

## Attribution (hard rule)
A result/number/story belongs to whoever actually said it. Peter's $30K/$50K, 110-lb loss, webinar
0→38%, $400M booking engine = Peter's. Joe's $605K storage offer + company GPT, Belrose/StorPro/Academy =
Joe's. Never reassign or fabricate.

## Close-out
Clean up temp `.docx`/`.txt`/extractor files. Log the batch in the Production Map (§ new section):
which eps done, which flagged Needs Review + why, what remains. Present batch to Joe, then continue in
batches of ~5 on request (27 episodes = a multi-session effort — set expectations, don't promise one pass).
