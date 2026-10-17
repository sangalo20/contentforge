# Google Sheets API enablement (tracking-Sheet builder)

## Symptom
`scripts/build_tracking_sheet.py` fails at the very first call (`spreadsheets().create`) with:

```
HttpError 403 when requesting https://sheets.googleapis.com/v4/spreadsheets?alt=json returned
"Google Sheets API has not been used in project 739551657550 before or it is disabled.
Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=739551657550
then retry."
reason: SERVICE_DISABLED, service: sheets.googleapis.com
```

## What this is (and is NOT)
- It is a **one-time API enablement** on the OAuth project the joeagent Google token belongs to (project number `739551657550`). The Docs API and Drive API are already enabled on the same project — only **Sheets** was never switched on.
- It is **NOT** a code bug, NOT a token/auth problem (the same token successfully creates Docs and moves files in Drive in the same run), and NOT "the Sheets builder is broken." Do not record it as a tool failure. The Doc builder works fine alongside it.

## Fix
1. Open: `https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=739551657550`
2. Click **Enable**.
3. Wait ~2 minutes for propagation.
4. Re-run `build_tracking_sheet.py` — it should now create the spreadsheet.

Joe (or whoever owns the Google Cloud project) must do the enable; the agent cannot enable an API from the token alone.

## Fallback if it can't be enabled right now
The tracking Sheet is a convenience, not the approval surface. If Sheets stays disabled:
- Track approvals directly in the **review Doc** (the `☐ APPROVED` checkboxes already exist per idea block).
- Build the Sheet later once the API is on.
Never block an urgent review batch on the Sheet — ship the Doc, add the Sheet after.

*Captured June 2026 (Joe's-socials review revert to Google Docs + tracking Sheet build).*
