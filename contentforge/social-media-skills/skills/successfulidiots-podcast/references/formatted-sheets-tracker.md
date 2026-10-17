# Formatted Google Sheet content tracker (verified SI Ep031, June 2026)

When Joe wants an episode's content tracked in a Google Sheet "formatted nicely
and categorically, easy to understand," the `google-workspace` CLI
(`google_api.py sheets`) only has `create / get / update / append` — **no
formatting commands.** Drive the Sheets API directly with the saved OAuth token.
Reusable across all of Joe's brands; not SI-specific.

## Setup
- Token: `C:\Users\somea\AppData\Local\hermes\profiles\joeagent\google_token.json`
- Both `C:/Python313/python.exe` and the venv python have the google libs.
- Create the sheet first via CLI:
  `google_api.py sheets create --title "..." --sheet-name "Content"` → returns
  `spreadsheetId`.

## Pattern (Python, run with C:/Python313/python.exe)
```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
creds = Credentials.from_authorized_user_file(TOKEN)
ss = build("sheets","v4",credentials=creds).spreadsheets()
gid = ss.get(spreadsheetId=SID).execute()["sheets"][0]["properties"]["sheetId"]
ss.values().update(spreadsheetId=SID, range="Content!A1",
                   valueInputOption="RAW", body={"values": rows}).execute()
ss.batchUpdate(spreadsheetId=SID, body={"requests": reqs}).execute()
```
`reqs` = a list of `repeatCell` (background/text/wrap), `mergeCells` (title +
per-IDEA band rows), `updateSheetProperties` (frozen header), 
`updateDimensionProperties` (column widths / row heights), `updateBorders`, and
`setDataValidation` (status dropdown: Draft→Approved→Scheduled→Posted).

## What "formatted, categorical, easy to understand" means in practice (Joe-approved)
- One row per content PIECE, grouped under a merged colored band per IDEA
  (alternate brand colors per idea so the eye reads the groups). Columns:
  `Idea/Angle | Platform | Type | Visual | Caption summary | Promo Clip | Status`.
- Navy title + subtitle band; navy header row with brand-accent text; frozen
  header (top 4 rows); status dropdown via data validation; wrapped cells.
- Add a separate **Guide tab**: how it's organized, the ideas→clips map, where
  files live (Drive folder, Downloads PNGs), and the follow-CTA bank — so anyone
  glancing at it understands without explanation.

## Two pitfalls (both hit + fixed this session)
1. **`frozenColumnCount` + a merged title/idea band that spans all columns =
   400 error**: *"can't freeze columns which contain only part of a merged
   cell."* FIX: freeze ROWS only (`frozenRowCount`), drop `frozenColumnCount`,
   when your title/idea rows are full-width merges.
2. **Can't browser-preview the result** — the browser isn't signed into Google,
   so `browser_navigate` to the sheet hits a Google sign-in wall. Verify the
   data instead by reading it back via `google_api.py sheets get <id> "Tab!A1:G8"`.
   The batchUpdate returning success + a row count is the confirmation the
   formatting applied.

3. **REBUILDING a sheet that already has merges/old tabs is fragile — build a
   FRESH tab instead of clearing in place** (hit repeatedly, Ep031 rework). A
   prior build leaves full-width merged cells and a tab named e.g. "Ep031
   Content"; re-running the formatter then 400s in three ways: `mergeCells` /
   `unmergeCells` fail with *"must select all cells in a merged range"* when your
   new range width (6 cols) is narrower than the old merge (7 cols), and the
   final rename 400s with *"a sheet with the name X already exists."* RELIABLE
   idempotent recipe: (a) at start, delete any stale tabs named like your temp
   names; (b) `addSheet` a brand-new tab (e.g. "Ep031 Content NEW") — fresh, no
   merge history; (c) rename the OLD tab out of the way (`_old_delete`) so the
   name frees up; (d) write values + all formatting to the NEW tab; (e) rename
   NEW → the real name + set `index:0`; (f) delete the old/guide/_old_delete tabs
   at the end. This avoids every merge/name collision and is safe to re-run.

## Don't leave rejected work in the tracker
If the episode's copy/visuals get rejected and reworked, rebuild the tracker
contents from the APPROVED set — the sheet is a system of record, not a scratchpad.
