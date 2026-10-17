#!/usr/bin/env python
"""Create a weekly LinkedIn review Google Doc: TITLE + clickable TOC + one
sectioned article per post with page breaks between them.

Builds via the RAW Google Docs API (not the google-workspace CLI wrapper, which
can't do named styles, page breaks, or text styling). Uses the profile's existing
OAuth token, which already carries documents+drive scopes.

Usage:
    python create_review_doc.py <token_path> <articles_json>

<articles_json> is a path to a JSON file shaped like:
    {
      "title": "Week 25: Jun 15-Jun 21, 2026 - LinkedIn Articles",
      "articles": [
        {"theme": "Theme 6 - Story / Origin",
         "headline": "Why I Got Into Self-Storage",
         "body": "full post text...\n\nmore paragraphs..."},
        ...
      ]
    }

Prints JSON: {id, name, webViewLink}. Then OFFER to share / file into a folder —
do not auto-share. And per the hard rule, do NOT touch Notion until Joe approves.
"""
import sys, json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def build_doc(token_path, spec):
    creds = Credentials.from_authorized_user_file(token_path)
    docs = build("docs", "v1", credentials=creds)
    drive = build("drive", "v3", credentials=creds)

    title = spec["title"]
    articles = spec["articles"]

    doc_id = docs.documents().create(body={"title": title}).execute()["documentId"]

    # Assemble (text, style) segments; "rule" => page break
    segments = [(title + "\n", "title"), ("\n", "body"), ("Contents\n", "toc_head")]
    for i, a in enumerate(articles, 1):
        segments.append((f"{i}. {a['headline']}  \u2014  {a['theme']}\n", "toc_item"))
    segments.append(("\n", "body"))
    for i, a in enumerate(articles, 1):
        segments.append((f"{i}. {a['headline']}\n", "h1"))
        segments.append((f"{a['theme']}\n", "theme"))
        segments.append(("\n", "body"))
        segments.append((a["body"].rstrip("\n") + "\n", "body"))
        if i != len(articles):
            segments.append(("___PAGEBREAK___", "rule"))
            segments.append(("\n", "body"))

    index = 1
    insert_reqs, style_ranges = [], []
    for text, style in segments:
        if style == "rule":
            insert_reqs.append({"insertPageBreak": {"location": {"index": index}}})
            index += 1
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

    return drive.files().get(fileId=doc_id, fields="id,name,webViewLink").execute()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: create_review_doc.py <token_path> <articles_json>", file=sys.stderr)
        sys.exit(2)
    spec = json.load(open(sys.argv[2], encoding="utf-8"))
    print(json.dumps(build_doc(sys.argv[1], spec), indent=2))
