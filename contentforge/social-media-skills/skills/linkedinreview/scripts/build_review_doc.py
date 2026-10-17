#!/usr/bin/env python
"""build_review_doc.py — Create a weekly LinkedIn review Google Doc.

Builds a sectioned doc: TITLE + clickable Contents (TOC) + one section per article
(Heading-1 headline, italic theme label, full body) with page breaks between sections.

Usage:
  python build_review_doc.py --title "<title>" --articles <articles.json> [--token <path>]

articles.json: a JSON list of objects: [{"theme": "...", "headline": "...", "body": "..."}]

Prints JSON: {"id", "name", "webViewLink"}.
Native Google Docs sidebar tabs are NOT supported by the API wrapper, so we use
sections + page breaks + a TOC instead. Verify output with: google_api.py docs get <id>.
"""
import argparse, json, sys

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DEFAULT_TOKEN = r"C:/Users/somea/AppData/Local/hermes/profiles/joeagent/google_token.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--articles", required=True, help="path to JSON list of {theme,headline,body}")
    ap.add_argument("--token", default=DEFAULT_TOKEN)
    ap.add_argument("--folder", default=None, help="Drive folder ID to place the doc in (else Drive root)")
    args = ap.parse_args()

    with open(args.articles, encoding="utf-8") as f:
        articles = json.load(f)
    if not isinstance(articles, list) or not articles:
        sys.exit("articles JSON must be a non-empty list")

    creds = Credentials.from_authorized_user_file(args.token)
    docs = build("docs", "v1", credentials=creds)
    drive = build("drive", "v3", credentials=creds)

    doc_id = docs.documents().create(body={"title": args.title}).execute()["documentId"]

    # Assemble segments: (text, style) ; style 'rule' => page break (no text)
    segments = []
    segments.append((args.title + "\n", "title"))
    segments.append(("\n", "body"))
    segments.append(("Contents\n", "toc_head"))
    for i, a in enumerate(articles, 1):
        segments.append((f"{i}. {a['headline']}  \u2014  {a['theme']}\n", "toc_item"))
    segments.append(("\n", "body"))

    for i, a in enumerate(articles, 1):
        segments.append((f"{i}. {a['headline']}\n", "h1"))
        segments.append((f"{a['theme']}\n", "theme"))
        segments.append(("\n", "body"))
        segments.append((a["body"].rstrip() + "\n", "body"))
        if i != len(articles):
            segments.append(("", "rule"))
            segments.append(("\n", "body"))

    index = 1
    insert_reqs = []
    style_ranges = []
    for text, style in segments:
        if style == "rule":
            insert_reqs.append({"insertPageBreak": {"location": {"index": index}}})
            index += 1
            continue
        if not text:
            continue
        insert_reqs.append({"insertText": {"location": {"index": index}, "text": text}})
        style_ranges.append((index, index + len(text), style))
        index += len(text)

    docs.documents().batchUpdate(documentId=doc_id, body={"requests": insert_reqs}).execute()

    style_reqs = []
    for start, end, style in style_ranges:
        if style == "title":
            style_reqs.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"namedStyleType": "TITLE"}, "fields": "namedStyleType"}})
        elif style == "toc_head":
            style_reqs.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"namedStyleType": "HEADING_2"}, "fields": "namedStyleType"}})
        elif style == "h1":
            style_reqs.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"namedStyleType": "HEADING_1"}, "fields": "namedStyleType"}})
        elif style == "theme":
            style_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"italic": True, "foregroundColor": {"color": {"rgbColor": {"red": 0.4, "green": 0.4, "blue": 0.4}}}}, "fields": "italic,foregroundColor"}})

    if style_reqs:
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": style_reqs}).execute()

    if args.folder:
        f = drive.files().get(fileId=doc_id, fields="parents").execute()
        prev = ",".join(f.get("parents", []))
        drive.files().update(fileId=doc_id, addParents=args.folder, removeParents=prev, fields="id").execute()

    meta = drive.files().get(fileId=doc_id, fields="id,name,webViewLink").execute()
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
