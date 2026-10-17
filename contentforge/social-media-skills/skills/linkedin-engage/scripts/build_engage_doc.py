#!/usr/bin/env python
"""build_engage_doc.py — Create a LinkedIn engagement review Google Doc.

Builds a sectioned doc for Joe to review and post comments himself:
  TITLE + clickable Contents (TOC) + one section per post:
    - Heading-1: "{n}. {author} — {role}"
    - gray italic line: the post URL (clickable)
    - "Their post:" label + the post excerpt (so Joe knows what he's replying to)
    - "Joe's comment:" label + the draft comment (what he copies to post)
    - small gray italic "Angle: ..." tag
  with page breaks between sections.

Usage:
  python build_engage_doc.py --title "<title>" --items <items.json> [--folder <id>] [--token <path>]

items.json: a JSON list of objects:
  [{"author": "...", "role": "...", "url": "...",
    "post_excerpt": "...", "comment": "...", "angle": "..."}]
(role and angle are optional; author, url, post_excerpt, comment are required.)

Prints JSON: {"id", "name", "webViewLink"}.
Joe posts approved comments himself — nothing here auto-posts to LinkedIn.
Verify output with: google_api.py docs get <id>.
"""
import argparse, json, sys

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DEFAULT_TOKEN = r"C:/Users/somea/AppData/Local/hermes/profiles/joeagent/google_token.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--items", required=True, help="path to JSON list of post/comment items")
    ap.add_argument("--token", default=DEFAULT_TOKEN)
    ap.add_argument("--folder", default=None, help="Drive folder ID to place the doc in (else Drive root)")
    args = ap.parse_args()

    with open(args.items, encoding="utf-8") as f:
        items = json.load(f)
    if not isinstance(items, list) or not items:
        sys.exit("items JSON must be a non-empty list")
    for i, it in enumerate(items, 1):
        for req in ("author", "url", "post_excerpt", "comment"):
            if not it.get(req):
                sys.exit(f"item {i} missing required field: {req}")

    creds = Credentials.from_authorized_user_file(args.token)
    docs = build("docs", "v1", credentials=creds)
    drive = build("drive", "v3", credentials=creds)

    doc_id = docs.documents().create(body={"title": args.title}).execute()["documentId"]

    def header(it):
        role = it.get("role", "").strip()
        return f"{it['author']} \u2014 {role}" if role else it["author"]

    # Assemble segments: (text, style). style 'rule' => page break (no text).
    segments = []
    segments.append((args.title + "\n", "title"))
    segments.append(("\n", "body"))
    segments.append(("Contents\n", "toc_head"))
    for i, it in enumerate(items, 1):
        segments.append((f"{i}. {header(it)}\n", "toc_item"))
    segments.append(("\n", "body"))

    for i, it in enumerate(items, 1):
        segments.append((f"{i}. {header(it)}\n", "h1"))
        segments.append((it["url"] + "\n", "url"))
        segments.append(("\n", "body"))
        segments.append(("Their post:\n", "label"))
        segments.append((it["post_excerpt"].rstrip() + "\n", "body"))
        segments.append(("\n", "body"))
        segments.append(("Joe's comment:\n", "label"))
        segments.append((it["comment"].rstrip() + "\n", "comment"))
        if it.get("angle"):
            segments.append((f"Angle: {it['angle']}\n", "theme"))
        if i != len(items):
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
        elif style == "label":
            style_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"bold": True}, "fields": "bold"}})
        elif style == "comment":
            # comment body: slight emphasis so it stands apart from the excerpt
            style_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"weightedFontFamily": {"fontFamily": "Georgia"}}, "fields": "weightedFontFamily"}})
        elif style == "url":
            style_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"italic": True, "foregroundColor": {"color": {"rgbColor": {"red": 0.25, "green": 0.4, "blue": 0.85}}}, "link": {"url": None}}, "fields": "italic,foregroundColor"}})
        elif style == "theme":
            style_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"italic": True, "foregroundColor": {"color": {"rgbColor": {"red": 0.4, "green": 0.4, "blue": 0.4}}}}, "fields": "italic,foregroundColor"}})

    # set the real clickable link on url segments (separate pass; needs the url text)
    link_reqs = []
    for (start, end, style), seg in zip(style_ranges, [s for s in segments if s[1] not in ("rule",) and s[0]]):
        if style == "url":
            link_reqs.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"link": {"url": seg[0].rstrip()}}, "fields": "link"}})

    if style_reqs:
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": style_reqs}).execute()
    if link_reqs:
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": link_reqs}).execute()

    if args.folder:
        f = drive.files().get(fileId=doc_id, fields="parents").execute()
        prev = ",".join(f.get("parents", []))
        drive.files().update(fileId=doc_id, addParents=args.folder, removeParents=prev, fields="id").execute()

    meta = drive.files().get(fileId=doc_id, fields="id,name,webViewLink").execute()
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
