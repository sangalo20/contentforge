#!/usr/bin/env python
"""build_tracking_sheet.py — Joe Social Review tracking Sheet (pipeline control panel).

Companion to the review Doc. The DOC is where Joe reads long copy + approves; this SHEET
is the at-a-glance tracker: one row per idea, status, visual thumbnail, link back to the Doc.

Columns: # | Date | Idea | Platforms | Status | Long form (preview) | Short form (X) | Visual | Notes
- Status = data-validation dropdown (Pending / Approved / Scheduled / Posted)
- Visual = =IMAGE(url) thumbnail (Metricool URLs are public)

Usage:
  python build_tracking_sheet.py --title "<title>" --posts <v2.json> --doc-url <url> [--folder <id>]
Prints JSON {id,name,webViewLink}.
"""
import argparse, json, sys
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DEFAULT_TOKEN = r"C:/Users/somea/AppData/Local/hermes/profiles/joeagent/google_token.json"
AMBER = {"red": 0.85, "green": 0.55, "blue": 0.12}
WHITE = {"red": 1, "green": 1, "blue": 1}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--posts", required=True)
    ap.add_argument("--doc-url", default="")
    ap.add_argument("--token", default=DEFAULT_TOKEN)
    ap.add_argument("--folder", default=None)
    args = ap.parse_args()

    ideas = json.load(open(args.posts, encoding="utf-8"))
    creds = Credentials.from_authorized_user_file(args.token)
    sheets = build("sheets", "v4", credentials=creds)
    drive = build("drive", "v3", credentials=creds)

    ss = sheets.spreadsheets().create(body={"properties": {"title": args.title}}).execute()
    sid = ss["spreadsheetId"]
    sheet0 = ss["sheets"][0]["properties"]["sheetId"]

    headers = ["#", "Date", "Idea", "Platforms", "Status", "Long form (preview)", "Short form (X)", "Visual", "Notes"]
    rows = [headers]
    for i, p in enumerate(ideas, 1):
        long_preview = (p.get("long_form", "")[:160] + "…") if len(p.get("long_form", "")) > 160 else p.get("long_form", "")
        img = p.get("images", [""])
        img_url = img[0] if img else ""
        visual = f'=IMAGE("{img_url}")' if img_url else ""
        rows.append([
            str(i),
            p.get("date", "").replace("  (ANCHOR — stays today)", " (ANCHOR)"),
            p.get("idea", ""),
            "LinkedIn · Instagram · Facebook · X",
            "Pending",
            long_preview,
            p.get("short_form", ""),
            visual,
            "",
        ])

    sheets.spreadsheets().values().update(
        spreadsheetId=sid, range="A1", valueInputOption="USER_ENTERED",
        body={"values": rows}).execute()

    n = len(rows)
    reqs = [
        # header styling
        {"repeatCell": {"range": {"sheetId": sheet0, "startRowIndex": 0, "endRowIndex": 1},
            "cell": {"userEnteredFormat": {"backgroundColor": AMBER, "textFormat": {"bold": True, "foregroundColor": WHITE}, "verticalAlignment": "MIDDLE"}},
            "fields": "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)"}},
        {"updateSheetProperties": {"properties": {"sheetId": sheet0, "gridProperties": {"frozenRowCount": 1}}, "fields": "gridProperties.frozenRowCount"}},
        # column widths
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 1}, "properties": {"pixelSize": 36}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 1, "endIndex": 2}, "properties": {"pixelSize": 110}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 2, "endIndex": 3}, "properties": {"pixelSize": 230}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 3, "endIndex": 4}, "properties": {"pixelSize": 220}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 4, "endIndex": 5}, "properties": {"pixelSize": 90}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 5, "endIndex": 6}, "properties": {"pixelSize": 300}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 6, "endIndex": 7}, "properties": {"pixelSize": 320}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 7, "endIndex": 8}, "properties": {"pixelSize": 120}, "fields": "pixelSize"}},
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "COLUMNS", "startIndex": 8, "endIndex": 9}, "properties": {"pixelSize": 200}, "fields": "pixelSize"}},
        # taller rows for the thumbnails
        {"updateDimensionProperties": {"range": {"sheetId": sheet0, "dimension": "ROWS", "startIndex": 1, "endIndex": n}, "properties": {"pixelSize": 96}, "fields": "pixelSize"}},
        # wrap text everywhere, top-align
        {"repeatCell": {"range": {"sheetId": sheet0, "startRowIndex": 1, "endRowIndex": n, "startColumnIndex": 0, "endColumnIndex": 9},
            "cell": {"userEnteredFormat": {"wrapStrategy": "WRAP", "verticalAlignment": "TOP"}},
            "fields": "userEnteredFormat(wrapStrategy,verticalAlignment)"}},
        # Status dropdown
        {"setDataValidation": {"range": {"sheetId": sheet0, "startRowIndex": 1, "endRowIndex": n, "startColumnIndex": 4, "endColumnIndex": 5},
            "rule": {"condition": {"type": "ONE_OF_LIST", "values": [{"userEnteredValue": v} for v in ["Pending", "Approved", "Scheduled", "Posted"]]}, "showCustomUi": True, "strict": False}}},
        # conditional colors on Status
        {"addConditionalFormatRule": {"rule": {"ranges": [{"sheetId": sheet0, "startRowIndex": 1, "endRowIndex": n, "startColumnIndex": 4, "endColumnIndex": 5}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "Approved"}]}, "format": {"backgroundColor": {"red": 0.83, "green": 0.93, "blue": 0.83}}}}, "index": 0}},
        {"addConditionalFormatRule": {"rule": {"ranges": [{"sheetId": sheet0, "startRowIndex": 1, "endRowIndex": n, "startColumnIndex": 4, "endColumnIndex": 5}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "Pending"}]}, "format": {"backgroundColor": {"red": 1.0, "green": 0.95, "blue": 0.80}}}}, "index": 1}},
        {"addConditionalFormatRule": {"rule": {"ranges": [{"sheetId": sheet0, "startRowIndex": 1, "endRowIndex": n, "startColumnIndex": 4, "endColumnIndex": 5}],
            "booleanRule": {"condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "Posted"}]}, "format": {"backgroundColor": {"red": 0.80, "green": 0.87, "blue": 0.95}}}}, "index": 2}},
    ]
    sheets.spreadsheets().batchUpdate(spreadsheetId=sid, body={"requests": reqs}).execute()

    # add a doc-link note in a cell above? simplest: rename via a banner row is messy; put link in title cell A1 tooltip not supported.
    if args.doc_url:
        sheets.spreadsheets().values().update(
            spreadsheetId=sid, range="K1", valueInputOption="USER_ENTERED",
            body={"values": [[f'=HYPERLINK("{args.doc_url}","► Open the review Doc (read + approve here)")']]}).execute()

    if args.folder:
        f = drive.files().get(fileId=sid, fields="parents").execute()
        prev = ",".join(f.get("parents", []))
        drive.files().update(fileId=sid, addParents=args.folder, removeParents=prev, fields="id").execute()

    meta = drive.files().get(fileId=sid, fields="id,name,webViewLink").execute()
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
