# Episode Ingestion — pulling podcast episodes from Drive into the Episode Library DBs

The repeatable recipe for backfilling/maintaining the per-brand **Episode Library** databases
(see `live-ids.md` for the DB IDs and schema). One row per episode; full insights in the page
body + a `Key Insights` summary property. Episodes are "light storage, mine later" — NOT evergreen
Knowledge.

## Workflow (verified June 2026, SI 001–030 + SM 001–008)

1. **Enumerate folders.** From the brand's Drive episode tree, list each episode folder
   (`drive search "'<folderId>' in parents" --raw-query`). Recent eps + an `Older Episodes/` archive subfolder.
2. **Pick the best source doc per episode.** Preference order differs by brand — see gotchas below.
3. **Batch-download** the chosen `.docx` per episode to `C:\Users\somea\<name>.docx`
   (`$GAPI drive download <id> --output ...`). Doing this in one `execute_code` loop with the
   `terminal()` helper is far faster than one tool call per file.
4. **Extract** all docs in one pass with a tiny python-docx script run via **`C:/Python313/python.exe`**
   (the ONLY interpreter on this machine with python-docx — the venv/sandbox pythons raise
   `ModuleNotFoundError: No module named 'docx'`). Print `chars=len` per file first to spot empty stubs.
5. **Create rows in batches** of ~8–14 via `notion-create-pages` against the Episode Library data_source_id.
6. **Clean up** temp `.docx` + extractor scripts when done.

## Source-doc gotchas (these cost real rework — check first)

- **SM 'Show Notes.docx' are EMPTY stubs** (just a header line). Use **'BLOG.docx'** for Storage Moguls
  episode substance. **SI Show Notes ARE fully populated** (1–3K chars) — use them for SI.
- **Duplicate copy-paste docs across folders.** Some episode's source doc is a verbatim duplicate of the
  PREVIOUS episode (seen: SM Ep 004 BLOG == Ep 003; SI Ep 022 Show Notes == Ep 021). ALWAYS sanity-check
  the body matches the folder name/number. When it doesn't, create the row with the correct title/guest
  from the folder, set **Status = Needs Review**, put a "NEEDS RE-PULL from transcript" note in the body,
  and DO NOT fill it with the wrong episode's content.
- **Header episode numbers can be wrong** inside the doc (SI 008's doc said "#007"). The Drive FOLDER
  number/name is authoritative, not the doc header.
- **Typos in source** ("Successful Moguls" for Storage Moguls in SM 001 blog) — transcribe the insight, not the typo.
- **Topic multi-select must already exist** on the DB or `create-pages` 400s
  (`Invalid multi_select value ... must be one of`). Add the option first with
  `update-data-source ALTER COLUMN "Topics" SET MULTI_SELECT(...)` (ADD never rebuild), then retry.

## Grain / depth guidance

- Active-pipeline episodes (the few most recent) → deep rows (full insight breakdown + timestamps).
- Back catalog → lighter rows (title, hook, 2–3 key insights) are enough for the "mine later" purpose.
- Attribution hard rule still applies: a result/number/story belongs to the host who actually said it
  (Peter's $30K/$50K results are Peter's; Joe's $400K/$62K deals are Joe's). Never reassign or fabricate.

## Format conventions used in rows
Title `SM Ep 0NN — Guest: Hook` / `SI Ep 0NN — Title`. Body = `# heading` + `## Mineable Insights`
bullets + optional `## Key Timestamps` + links. `Hosts` = `Joe Downs (guest: X)` for SM interviews,
`Joe Downs + Peter Swain` for SI. `Source` = the brand site; `Drive Folder` = the episode folder URL.
