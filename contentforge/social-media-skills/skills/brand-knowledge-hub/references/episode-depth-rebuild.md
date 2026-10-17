# Episode Library — depth audit + rebuild-in-place + structured mining fields

When Joe says "find the episodes with shallow data and delete/rebuild them with our new
understanding method," this is the procedure. Companion to `episode-ingestion.md` (that one is
first-pass backfill; THIS one is upgrading existing rows to the deep method). Verified June 2026.

## 1. Audit depth by EVIDENCE, never by assumption (Joe's sequencing: assess BEFORE deleting)
Do not run a blind "delete shallow" pass — you will take out good rows. Calibrate first:
- `query_data_sources` SQL is NOT available (needs Notion Enterprise + AI — returns a 400 upsell).
  Enumerate rows via `notion_search` with `data_source_url=collection://<id>` + a broad query +
  `max_highlight_length:0` + `page_size:25`. Then `notion_fetch` a SAMPLE: one known-DEEP benchmark,
  two suspected-shallow, and any known duplicates. Read the page bodies to define the depth bands.
- **The three depth tiers seen (use as the rubric):**
  | Tier | Structure present | Verdict |
  |---|---|---|
  | DEEP (new method) | Hook · per-insight breakdowns · proof points · **Key Timestamps** · verbatim quotes · attribution block · rich multi-clause `Key Insights` | keep |
  | SOLID | guest bio · hook · 5–6 substantive insights with REAL numbers/named frameworks | keep — genuinely mineable |
  | SHALLOW | hook + ONE blurb paragraph · one-line semicolon `Key Insights` · no timestamps/quotes/proof | rebuild target |
- ⚠️ **Guest-interview rows often LOOK short but are SOLID** — SM 001 (Blunk) / SM 008 (Merkin) carry
  hard specifics ($320K, 37% below market, ~70% mom-and-pop, the lender-ready package list) and must
  be KEPT. A blind length/`Key Insights`-char sort would wrongly flag them. Read the body, judge on
  substance (named frameworks + hard numbers + quotable lines), not row length.
- Documented history is a shortcut to the cut line: the few most-recent episodes were built deep
  (e.g. SI 028/029/030); the bulk back-catalog (e.g. SI 001–027) was light-ingested from Show Notes.

## 2. REBUILD-IN-PLACE, do not delete-then-recreate (push back on delete-first)
Joe's instinct is "delete then rebuild," but recommend rebuild-in-place and say why:
1. The Notion MCP token **cannot hard-delete** (scoped to mcp.notion.com; PATCH archive 401s on the
   public API). "Delete" only means renaming to "🗑️ DELETE ME" for Joe to manually trash — not clean.
2. Delete-first **creates a data gap** — even a shallow row has a usable hook + Topics tags; deleting
   27 rows before rebuilding strands the library until every transcript is re-read (multi-session).
**Pattern:** for each episode, OVERWRITE the shallow row in place — read the Drive transcript (see
`episode-ingestion.md` for the `.docx`→`C:/Python313` python-docx path), restructure to the deep
template, `notion-update-page` the body + properties. Row is never empty; "done" = visibly deep.
**Scope discipline:** rebuilding N episodes = reading N transcripts = real multi-session effort.
Offer to do a proving BATCH (~5) on the upgraded template first, get Joe's sign-off, then roll the rest.

## 3. STRUCTURED MINING FIELDS — add these so the library is QUERYABLE (Joe validated, June 2026)
Joe asked "are you adding keywords / tags / phrases? would it help?" — yes, high value. Topics alone
(7-tag taxonomy) means mining requires reading prose. Add these to the Episode Library schema as an
ADD (never rebuild), and populate them during the rebuild:
- **Keywords / Phrases** (text) — exact searchable terms + signature VERBATIM phrases ("no such thing
  as spam, just shitty emails", "do it with it", "self-disqualification"). Lets Joe find the episode
  by the phrase he remembers.
- **Frameworks / Named Concepts** (multi-select) — the reusable IP: Jimmy Prompt, Smoothie Test, GEO,
  mustard-vs-sandwich, premortem, lender-ready package. Taggable + cross-episode pattern-finding.
- **Stat / Proof points** (text) — the hard numbers that become content hooks (24X, $30K, 60% no-click,
  $320K, ~70% mom-and-pop).
Schema add via `update-data-source ALTER COLUMN`/`ADD COLUMN` (DATE-column rename quirk + multi-select
"must already exist" gotcha both still apply — see notion-mcp-db-patterns.md / episode-ingestion.md).
Why it pays off: faster caption/comment mining, cross-episode queries ("every episode mentioning
validation"), and it feeds the content engine directly.

## 4. The deep row template (target shape for every rebuilt episode)
Properties: Title `{BRAND} Ep 0NN — {Title or Guest: Hook}` · Episode · Hosts · Topics(multi) ·
Keywords/Phrases · Frameworks(multi) · Stat-points · Source · Drive Folder · Published · Status.
Body: `**Hook:**` → `## Mineable Insights` (each a `### N. heading` + explanation) →
`## Concrete proof points` → `## Attribution (locked)` → `## Standalone-strong quotes (safe verbatim)`
→ `## Key Timestamps`. Attribution hard rule: a result/number/story belongs to whoever actually said
it (Peter's results are Peter's; Joe's deals are Joe's) — never reassign or fabricate.
