#!/usr/bin/env python
"""build_social_review_doc.py — Joe Social Review doc (2-variant format).

Per Joe (June 2026): the review surface shows TWO copy variants per idea, not four:
  LONG FORM  -> used for LinkedIn, Instagram, Facebook (one shared long caption)
  SHORT FORM -> used for X (tight, <280)
Reviewing four near-identical captions per idea is tiresome; long + short is enough to
approve the IDEA. Platform-specific finishing (IG hashtags, Stories, X trim, FB format)
is added AFTER approval, not in the review doc.

Each idea block:
    ───────────────────────────────────────
    [amber bar]  IDEA N — <idea name>   ·   <date>
    ☐  APPROVED
    📲  GOES TO:  LinkedIn · Instagram · Facebook · X
      ── LONG FORM  (LinkedIn · Instagram · Facebook) ──
      <long copy>
      ── SHORT FORM  (X) ──
      <short copy>
    VISUAL
    TYPE: <Poster | Reel | Carousel | Photo>
    <embedded image(s)>  OR  <video link>
    ───────────────────────────────────────

posts.json schema (JSON list):
[
  {"idea":"...", "date":"Tue Jun 23", "long_form":"...", "short_form":"...",
   "visual_type":"Poster", "images":["https://.../p.png"], "video_url":""}
]
"""
import argparse, json, sys, urllib.request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

DEFAULT_TOKEN = r"C:/Users/somea/AppData/Local/hermes/profiles/joeagent/google_token.json"
BAR_RGB = {"red": 0.85, "green": 0.55, "blue": 0.12}
GRAY_RGB = {"red": 0.4, "green": 0.4, "blue": 0.4}
LABEL_RGB = {"red": 0.30, "green": 0.30, "blue": 0.30}

ALL_PLATFORMS = "LinkedIn \u00b7 Instagram \u00b7 Facebook \u00b7 X"


def img_dims(url, max_w=380.0):
    try:
        from PIL import Image
        import io
        data = urllib.request.urlopen(url, timeout=25).read()
        im = Image.open(io.BytesIO(data))
        w, h = im.size
        if w > max_w:
            h = h * (max_w / w); w = max_w
        return w, h
    except Exception:
        return max_w, max_w


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--posts", required=True)
    ap.add_argument("--token", default=DEFAULT_TOKEN)
    ap.add_argument("--folder", default=None)
    args = ap.parse_args()

    ideas = json.load(open(args.posts, encoding="utf-8"))
    if not isinstance(ideas, list) or not ideas:
        sys.exit("posts JSON must be a non-empty list")

    creds = Credentials.from_authorized_user_file(args.token)
    docs = build("docs", "v1", credentials=creds)
    drive = build("drive", "v3", credentials=creds)
    doc_id = docs.documents().create(body={"title": args.title}).execute()["documentId"]

    segments = []; image_marks = []
    segments.append((args.title + "\n", "title"))
    segments.append(("Long form goes to LinkedIn, Instagram and Facebook. Short form goes to X. Tick approved when the idea is ready. Hashtags and Stories are added after approval.\n", "subtitle"))
    segments.append(("\n", "body"))
    segments.append(("\n", "body"))

    for i, p in enumerate(ideas, 1):
        # idea heading with an underline rule (clear "new block starts here")
        segments.append((f"{i:02d}   {p.get('idea','—')}\n", "head"))
        # meta row sits in its own subtle shaded zone: date · platforms · checkbox
        segments.append((f"{p.get('date','')}\n", "metatop"))
        segments.append((ALL_PLATFORMS + "\n", "metabox"))
        segments.append(("Approved\n", "approve"))
        segments.append(("\n", "gap"))

        segments.append(("LONG FORM   —   LinkedIn · Instagram · Facebook\n", "zonelabel"))
        segments.append((p.get("long_form", "").rstrip() + "\n", "body"))
        segments.append(("\n", "gap"))
        segments.append(("SHORT FORM   —   X\n", "zonelabel"))
        segments.append((p.get("short_form", "").rstrip() + "\n", "body"))
        segments.append(("\n", "gap"))

        vt = p.get("visual_type", "—")
        segments.append((f"VISUAL   —   {vt}\n", "zonelabel"))
        if vt.lower() in ("reel", "video"):
            vurl = (p.get("video_url") or "").strip()
            segments.append((f"Watch: {vurl}\n" if vurl else "(video link to be added)\n", "link" if vurl else "muted"))
        else:
            imgs = p.get("images", []) or []
            if not imgs:
                segments.append(("(visual to be added)\n", "muted"))
            for url in imgs:
                w, h = img_dims(url)
                image_marks.append((len(segments), url, w, h))
                segments.append(("\n", "imgslot"))

        if i != len(ideas):
            # full-width horizontal rule between blocks (real border, not a character)
            segments.append(("\n", "gap"))
            segments.append((" \n", "hr"))
            segments.append(("\n", "gap"))

    index = 1; insert_reqs = []; style_ranges = []; seg_start_index = {}
    for pos, (text, style) in enumerate(segments):
        seg_start_index[pos] = index
        if style == "rule":
            insert_reqs.append({"insertPageBreak": {"location": {"index": index}}}); index += 1; continue
        if not text: continue
        insert_reqs.append({"insertText": {"location": {"index": index}, "text": text}})
        style_ranges.append((index, index + len(text), style)); index += len(text)
    docs.documents().batchUpdate(documentId=doc_id, body={"requests": insert_reqs}).execute()

    sr = []
    approve_ranges = []
    for start, end, style in style_ranges:
        if style == "title":
            sr.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"namedStyleType": "TITLE"}, "fields": "namedStyleType"}})
        elif style == "subtitle":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 10, "unit": "PT"}, "foregroundColor": {"color": {"rgbColor": GRAY_RGB}}}, "fields": "fontSize,foregroundColor"}})
        elif style == "head":
            # clean heading with a bottom rule = clear "new idea starts here"; number tinted amber
            sr.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"namedStyleType": "HEADING_2", "spaceAbove": {"magnitude": 18, "unit": "PT"}, "spaceBelow": {"magnitude": 4, "unit": "PT"}, "borderBottom": {"width": {"magnitude": 1, "unit": "PT"}, "padding": {"magnitude": 3, "unit": "PT"}, "dashStyle": "SOLID", "color": {"color": {"rgbColor": BAR_RGB}}}}, "fields": "namedStyleType,spaceAbove,spaceBelow,borderBottom"}})
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": start + 2}, "textStyle": {"foregroundColor": {"color": {"rgbColor": BAR_RGB}}}, "fields": "foregroundColor"}})
        elif style == "approve":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 11, "unit": "PT"}, "foregroundColor": {"color": {"rgbColor": {"red": 0.13, "green": 0.13, "blue": 0.13}}}}, "fields": "fontSize,foregroundColor"}})
            approve_ranges.append((start, end))
        elif style == "zonelabel":
            # clear section divider label: small, bold, amber, generous space above
            sr.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"spaceAbove": {"magnitude": 12, "unit": "PT"}, "spaceBelow": {"magnitude": 3, "unit": "PT"}}, "fields": "spaceAbove,spaceBelow"}})
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 9, "unit": "PT"}, "bold": True, "foregroundColor": {"color": {"rgbColor": BAR_RGB}}}, "fields": "fontSize,bold,foregroundColor"}})
        elif style == "metatop":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 10, "unit": "PT"}, "bold": True, "foregroundColor": {"color": {"rgbColor": LABEL_RGB}}}, "fields": "fontSize,bold,foregroundColor"}})
        elif style == "metabox":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 10, "unit": "PT"}, "foregroundColor": {"color": {"rgbColor": LABEL_RGB}}}, "fields": "fontSize,foregroundColor"}})
        elif style == "meta":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 10, "unit": "PT"}, "foregroundColor": {"color": {"rgbColor": LABEL_RGB}}}, "fields": "fontSize,foregroundColor"}})
        elif style == "hr":
            # real full-width horizontal rule via a bottom border on a blank paragraph
            sr.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"borderBottom": {"width": {"magnitude": 1, "unit": "PT"}, "padding": {"magnitude": 0, "unit": "PT"}, "dashStyle": "SOLID", "color": {"color": {"rgbColor": {"red": 0.82, "green": 0.82, "blue": 0.82}}}}}, "fields": "borderBottom"}})
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"fontSize": {"magnitude": 4, "unit": "PT"}}, "fields": "fontSize"}})
        elif style == "muted":
            sr.append({"updateTextStyle": {"range": {"startIndex": start, "endIndex": end - 1}, "textStyle": {"italic": True, "foregroundColor": {"color": {"rgbColor": GRAY_RGB}}}, "fields": "italic,foregroundColor"}})
        elif style == "body":
            # comfortable line spacing for readability
            sr.append({"updateParagraphStyle": {"range": {"startIndex": start, "endIndex": end}, "paragraphStyle": {"lineSpacing": 115}, "fields": "lineSpacing"}})
    if sr:
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": sr}).execute()

    # Convert each "Approved" line into a REAL clickable checkbox list item.
    # createParagraphBullets does not insert characters, so downstream image indices stay valid.
    if approve_ranges:
        bullet_reqs = [{"createParagraphBullets": {"range": {"startIndex": s, "endIndex": e}, "bulletPreset": "BULLET_CHECKBOX"}} for s, e in approve_ranges]
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": bullet_reqs}).execute()

    img_reqs = []
    for seg_pos, url, w, h in sorted(image_marks, key=lambda t: t[0], reverse=True):
        at = seg_start_index[seg_pos]
        img_reqs.append({"insertInlineImage": {"location": {"index": at}, "uri": url, "objectSize": {"width": {"magnitude": w, "unit": "PT"}, "height": {"magnitude": h, "unit": "PT"}}}})
    if img_reqs:
        docs.documents().batchUpdate(documentId=doc_id, body={"requests": img_reqs}).execute()

    if args.folder:
        f = drive.files().get(fileId=doc_id, fields="parents").execute()
        prev = ",".join(f.get("parents", []))
        drive.files().update(fileId=doc_id, addParents=args.folder, removeParents=prev, fields="id").execute()

    meta = drive.files().get(fileId=doc_id, fields="id,name,webViewLink").execute()
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
