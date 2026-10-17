"""Build the DevFest deck (v2, 14 slides, no notes) from the official template.

    ../odin-agent/venv/bin/python build_deck.py
"""
import copy
import io
import json
from pathlib import Path

from lxml import etree
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEMO = ROOT / "demo" / "2026-10-03_041856"
TEMPLATE = HERE / "template.pptx"
OUT = HERE / "human-is-the-reviewer.pptx"
ASSETS = HERE / "assets"
ASSETS.mkdir(exist_ok=True)

INK = RGBColor(0x1E, 0x1E, 0x1E)
PAPER = RGBColor(0xF0, 0xEF, 0xEE)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
CODE_BG = RGBColor(0x1E, 0x1E, 0x1E)
CODE_FG = RGBColor(0xE8, 0xEA, 0xED)
CODE_CMT = RGBColor(0x9A, 0xA0, 0xA6)
BLUE = RGBColor(0x42, 0x85, 0xF4)
GREEN = RGBColor(0x34, 0xA8, 0x53)
YELLOW = RGBColor(0xFB, 0xBC, 0x04)
RED = RGBColor(0xEA, 0x43, 0x35)
LIGHT = RGBColor(0xE8, 0xEA, 0xED)

T_TITLE = 4
T_CARD = 20
T_SPLIT = 41

REPO_URL = "https://github.com/Prescott-Data/jarviscore-framework"

# Usable area inside the template-20 card (GDG logo cut-out is bottom-right).
CARD_L, CARD_R, CARD_T, CARD_B = 0.9, 9.3, 0.8, 5.1
CUTOUT_X, CUTOUT_Y = 7.0, 4.3
# Right photo card on template 41.
SLOT_L, SLOT_T, SLOT_W, SLOT_H = 5.2, 0.35, 4.45, 4.9


# --------------------------------------------------------------------- helpers
def clone_slide(prs, src_idx):
    src = prs.slides[src_idx - 1]
    dst = prs.slides.add_slide(src.slide_layout)
    for sh in list(dst.shapes):
        sh._element.getparent().remove(sh._element)
    rid_map = {}
    for rel in src.part.rels.values():
        if rel.reltype.endswith("/image"):
            rid_map[rel.rId] = dst.part.rels.get_or_add(rel.reltype, rel.target_part)
    for el in src.shapes._spTree:
        if el.tag.endswith("}nvGrpSpPr") or el.tag.endswith("}grpSpPr"):
            continue
        new_el = copy.deepcopy(el)
        for node in new_el.iter():
            for attr in (qn("r:embed"), qn("r:link")):
                if attr in node.attrib and node.attrib[attr] in rid_map:
                    node.attrib[attr] = rid_map[node.attrib[attr]]
        dst.shapes._spTree.append(new_el)
    # The template's frame / "@DevFest" bracket is a slide *background* image.
    src_bg = src._element.find(qn("p:cSld")).find(qn("p:bg"))
    if src_bg is not None:
        new_bg = copy.deepcopy(src_bg)
        for node in new_bg.iter():
            for attr in (qn("r:embed"), qn("r:link")):
                if attr in node.attrib and node.attrib[attr] in rid_map:
                    node.attrib[attr] = rid_map[node.attrib[attr]]
        dst_cSld = dst._element.find(qn("p:cSld"))
        old = dst_cSld.find(qn("p:bg"))
        if old is not None:
            dst_cSld.remove(old)
        dst_cSld.insert(0, new_bg)
    return dst


def shape_by_text(slide, startswith):
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip().lower().startswith(startswith.lower()):
            return sh
    raise KeyError(startswith)


def remove_shape(shape):
    shape._element.getparent().remove(shape._element)


def set_text(shape, lines, size=None, bold=None, bullets=False, font=None, space_after=None):
    if isinstance(lines, str):
        lines = [lines]
    txBody = shape.text_frame._txBody
    paras = txBody.findall(qn("a:p"))
    proto = paras[0]
    proto_r = proto.find(qn("a:r"))
    proto_rPr = proto_r.find(qn("a:rPr")) if proto_r is not None else None
    if proto_rPr is None:
        end = proto.find(qn("a:endParaRPr"))
        proto_rPr = etree.Element(qn("a:rPr"))
        if end is not None:
            for ch in end:
                proto_rPr.append(copy.deepcopy(ch))
            for k, v in end.attrib.items():
                proto_rPr.set(k, v)
    for p in paras:
        txBody.remove(p)
    for line in lines:
        p = copy.deepcopy(proto)
        for child in list(p):
            if child.tag in (qn("a:r"), qn("a:br"), qn("a:fld")):
                p.remove(child)
        pPr = p.find(qn("a:pPr"))
        if pPr is not None:
            if not bullets:
                for bu in pPr.findall(qn("a:buChar")):
                    pPr.remove(bu)
                pPr.set("marL", "0"); pPr.set("indent", "0")
            if space_after is not None:
                sa = pPr.find(qn("a:spcAft"))
                if sa is not None:
                    pPr.remove(sa)
                sa = etree.SubElement(pPr, qn("a:spcAft"))
                etree.SubElement(sa, qn("a:spcPts")).set("val", str(int(space_after * 100)))
        r = etree.SubElement(p, qn("a:r"))
        rPr = copy.deepcopy(proto_rPr)
        rPr.set("lang", "en")
        if size is not None:
            rPr.set("sz", str(int(size * 100)))
        if bold is not None:
            rPr.set("b", "1" if bold else "0")
        if font:
            for tag in ("a:latin", "a:ea", "a:cs", "a:sym"):
                el = rPr.find(qn(tag))
                if el is not None:
                    el.set("typeface", font)
        r.append(rPr)
        etree.SubElement(r, qn("a:t")).text = line
        end = p.find(qn("a:endParaRPr"))
        if end is not None:
            p.remove(end); p.append(end)
        txBody.append(p)


def textbox(slide, left, top, width, height, lines, size=14, bold=False, color=INK, font="Google Sans", align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    if isinstance(lines, str):
        lines = [lines]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run(); r.text = line
        r.font.size = Pt(size); r.font.bold = bold; r.font.name = font; r.font.color.rgb = color
    return tb


def add_code(slide, code, left, top, width, height, size=10):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    box.adjustments[0] = 0.04
    box.fill.solid(); box.fill.fore_color.rgb = CODE_BG
    box.line.fill.background(); box.shadow.inherit = False
    tf = box.text_frame
    tf.word_wrap = False
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = tf.margin_right = Inches(0.22)
    tf.margin_top = tf.margin_bottom = Inches(0.14)
    for i, line in enumerate(code.strip("\n").split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(0); p.line_spacing = 1.05
        r = p.add_run(); r.text = line or " "
        r.font.name = "Roboto Mono"; r.font.size = Pt(size)
        r.font.color.rgb = CODE_CMT if line.lstrip().startswith(("#", "//")) else CODE_FG
    return box


def box(slide, left, top, width, height, text, fill=LIGHT, color=INK, size=12, bold=False, font="Google Sans", outline=True):
    s = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    s.adjustments[0] = 0.18
    s.fill.solid(); s.fill.fore_color.rgb = fill
    if outline:
        s.line.color.rgb = INK; s.line.width = Pt(1)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    tf = s.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.08); tf.margin_top = tf.margin_bottom = Inches(0.04)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    lines = text if isinstance(text, list) else [text]
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = line
        r.font.size = Pt(size if i == 0 else max(size - 3, 8)); r.font.bold = bold and i == 0
        r.font.name = font; r.font.color.rgb = color
    return s


def arrow(slide, x1, y1, x2, y2):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = INK; c.line.width = Pt(1.25)
    ln = c.line._get_or_add_ln()
    tail = etree.SubElement(ln, qn("a:tailEnd")); tail.set("type", "triangle"); tail.set("w", "med"); tail.set("len", "med")
    return c


def crop_fill(path, ratio, out):
    with Image.open(path) as im:
        im = im.convert("RGB")
        w, h = im.size
        if w / h > ratio:
            nw = int(h * ratio); left = (w - nw) // 2; im = im.crop((left, 0, left + nw, h))
        else:
            nh = int(w / ratio); top = (h - nh) // 2; im = im.crop((0, top, w, top + nh))
        im.save(out, quality=92)
    return out


def fill_photo_slot(slide, path):
    """Template-41: put our image under the frame in the right-hand card."""
    pics = [sh for sh in slide.shapes if sh.shape_type == 13]
    photo = min(pics, key=lambda p: p.width)  # the magenta placeholder, not the full-bleed frame
    ratio = SLOT_W / SLOT_H
    tmp = ASSETS / f"slot_{Path(path).stem}.jpg"
    crop_fill(path, ratio, tmp)
    _, rid = slide.part.get_or_add_image_part(str(tmp))
    photo._element.blipFill.blip.rEmbed = rid
    srcRect = photo._element.blipFill.find(qn("a:srcRect"))
    if srcRect is not None:
        photo._element.blipFill.remove(srcRect)
    photo.left, photo.top, photo.width, photo.height = Inches(SLOT_L), Inches(SLOT_T), Inches(SLOT_W), Inches(SLOT_H)


def make_qr_card(url, label, out):
    import qrcode
    W, H = 1335, 1470  # SLOT ratio
    card = Image.new("RGB", (W, H), (255, 255, 255))
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(url); qr.make(fit=True)
    img = qr.make_image(fill_color="#1E1E1E", back_color="white").convert("RGB")
    img = img.resize((760, 760), Image.NEAREST)
    from PIL import ImageDraw, ImageFont
    d = ImageDraw.Draw(card)
    try:
        f = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 44)
        f2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 56)
    except Exception:
        f = f2 = ImageFont.load_default()
    # caption on top; QR sits in the upper area so the logo cut-out never clips it
    for i, (txt, ft) in enumerate([(label, f2), (url.replace("https://", ""), f)]):
        bw = d.textlength(txt, font=ft)
        d.text(((W - bw) / 2, 110 + i * 78), txt, fill=(30, 30, 30), font=ft)
    card.paste(img, ((W - 760) // 2, 300))
    card.save(out)
    return out


def style_table(tbl, size=12, header_fill=INK, col_widths=None, row_h=0.34):
    tblPr = tbl._tbl.tblPr
    for k in ("firstRow", "bandRow", "lastRow", "firstCol", "lastCol", "bandCol"):
        tblPr.set(k, "0")
    style = tblPr.find(qn("a:tableStyleId"))
    if style is not None:
        tblPr.remove(style)
    if col_widths:
        for i, w in enumerate(col_widths):
            tbl.columns[i].width = Inches(w)
    for ri, row in enumerate(tbl.rows):
        row.height = Inches(row_h)
        for cell in row.cells:
            cell.margin_left = cell.margin_right = Inches(0.08)
            cell.margin_top = cell.margin_bottom = Inches(0.03)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            cell.fill.fore_color.rgb = header_fill if ri == 0 else (WHITE if ri % 2 else RGBColor(0xF7, 0xF7, 0xF7))
            for p in cell.text_frame.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(size); r.font.name = "Google Sans"
                    r.font.bold = ri == 0
                    r.font.color.rgb = WHITE if ri == 0 else INK


def add_table(slide, header, rows, left, top, width, col_widths=None, size=12, row_h=0.34):
    n_rows, n_cols = len(rows) + 1, len(header)
    shp = slide.shapes.add_table(n_rows, n_cols, Inches(left), Inches(top), Inches(width), Inches(row_h * n_rows))
    tbl = shp.table
    for c, h in enumerate(header):
        tbl.cell(0, c).text = h
    for ri, row in enumerate(rows, start=1):
        for c, v in enumerate(row):
            tbl.cell(ri, c).text = str(v)
    style_table(tbl, size=size, col_widths=col_widths, row_h=row_h)
    return shp


# ----------------------------------------------------------------- slide kinds
def card_slide(prs, title, title_size=28):
    s = clone_slide(prs, T_CARD)
    t = shape_by_text(s, "Example with slide title")
    set_text(t, title, size=title_size)
    t.top, t.height = Inches(0.7), Inches(1.0)
    body = shape_by_text(s, "Bullet one")
    return s, body


def bullets_slide(prs, title, bullets, size=20, top=1.9):
    s, body = card_slide(prs, title)
    set_text(body, bullets, size=size, bullets=True)
    # keep clear of the GDG logo cut-out (bottom-right of the card)
    body.top, body.height, body.width = Inches(top), Inches(CARD_B - top), Inches(6.1)
    return s


def split_slide(prs, title, bullets, picture, size=16, title_size=24, bullets_on=True, body_top=1.9):
    s = clone_slide(prs, T_SPLIT)
    t = shape_by_text(s, "Title goes here")
    set_text(t, title, size=title_size)
    t.top, t.height = Inches(0.6), Inches(1.3)
    b = shape_by_text(s, "Bullet one")
    set_text(b, bullets, size=size, bullets=bullets_on, space_after=4)
    b.top, b.height = Inches(body_top), Inches(5.0 - body_top)
    fill_photo_slot(s, picture)
    return s


# ---------------------------------------------------------------------- content
def build():
    prs = Presentation(TEMPLATE)
    n_template = len(prs.slides)
    stages = json.loads((DEMO / "02_stages.json").read_text())
    usd = json.loads((DEMO / "summary.json").read_text())["usage"]["totalUsd"]
    total_s = stages[-1]["t"]
    qr_png = make_qr_card(REPO_URL, "Star it on GitHub", ASSETS / "qr_jarviscore.png")

    # 1 Title (template 4: bracket, globe arrow, 2026 tile)
    s = clone_slide(prs, T_TITLE)
    set_text(shape_by_text(s, "Use this template"),
             "The Human Is the Reviewer: Shipping a Production Multi-Agent Content Platform on Gemini and Cloud Run", size=30)
    nm = shape_by_text(s, "Name Lastname")
    set_text(nm, ["Sangalo Mwenyinyo", "CTO @ Prescott Data · GDE, Modern & Enterprise Infrastructure"], size=14)
    nm.width = Inches(6.3)
    set_text(shape_by_text(s, "Track"), "")

    # 2 Old normal
    bullets_slide(prs, "One business. Seven platforms. One person doing it all by hand.", [
        "Instagram, Facebook, YouTube, X, TikTok, LinkedIn, your website, your newsletter",
        "Each one wants a different format: a reel, a carousel, a thread, a 1,200-word post",
        "So you write it again. And again. By hand, platform by platform",
        "Most days the content calendar wins and the business loses",
    ], size=17)

    # 3 New normal
    s = split_slide(prs, "Make it once. Syndicate everywhere.", [
        "One source: a YouTube video, an article, a webpage or a GitHub repo",
        "Agents turn it into a blog draft, a cover image, a carousel and platform-native posts",
        "Every piece lands in a review queue. You approve. Then it ships",
        "Humans don't write anymore. They review.",
    ], DEMO / "03_cover.png", size=12.5, title_size=22, body_top=2.0)
    textbox(s, 0.7, 4.72, 4.0, 0.3, "Demo: ContentForge", size=12, bold=True, font="Roboto Mono")

    # 4 Stack
    s, body = card_slide(prs, "Three choices that made this possible")
    remove_shape(body)
    add_table(s, ["Layer", "What we used", "Why"], [
        ["Agent runtime", "jarviscore", "Purpose-built for cooperating agents"],
        ["Models", "Gemini 3.1 Pro · Gemini 3.8 Flash · Nano Banana Pro", "The right model for each job"],
        ["Infrastructure", "Cloud Run, serverless", "Scales to zero, IAM between services, no API keys"],
    ], CARD_L, 1.75, 8.3, col_widths=[1.5, 3.7, 3.1], size=13, row_h=0.5)
    textbox(s, CARD_L, 3.95, 6.0, 0.35, "Models served through Gemini Enterprise Agent Platform, authenticated with ADC", size=11, font="Roboto Mono")

    # 5 Architecture diagram
    s, body = card_slide(prs, "Three services, one review queue")
    remove_shape(body)
    x0, w, h, gap = 0.9, 4.2, 0.6, 0.22
    y1 = 1.6
    y2 = y1 + 0.45 + gap
    y3 = y2 + h + gap
    y4 = y3 + h + gap
    box(s, x0, y1, w, 0.45, ["Browser  ·  React"], fill=LIGHT, size=12, bold=True)
    box(s, x0, y2, w, h, ["ContentForge API  ·  Express on Cloud Run", "Firestore · Cloud Storage · Sanity (publish only) · /api/v1 + MCP"], fill=RGBColor(0xD2, 0xE3, 0xFC), size=11, bold=True)
    box(s, x0, y3, w, h, ["Agent service  ·  FastAPI + JarvisCore on Cloud Run", "Odin · Oscar · Huginn · Heimdall · Hermes · Loki · Mimir"], fill=RGBColor(0xCE, 0xEA, 0xD6), size=11, bold=True)
    box(s, x0, y4, w, h, ["Gemini Enterprise Agent Platform", "Gemini 3.1 Pro · Gemini 3.8 Flash · Nano Banana Pro"], fill=RGBColor(0xFE, 0xEF, 0xC3), size=11, bold=True)
    cx = x0 + w / 2
    arrow(s, cx, y1 + 0.45, cx, y2); arrow(s, cx, y2 + h, cx, y3); arrow(s, cx, y3 + h, cx, y4)
    textbox(s, cx + 0.1, y1 + 0.46, 1.6, 0.2, "HTTP / SSE", size=8, font="Roboto Mono")
    textbox(s, cx + 0.1, y2 + h + 0.01, 1.6, 0.2, "Cloud Run IAM", size=8, font="Roboto Mono")
    textbox(s, cx + 0.1, y3 + h + 0.01, 1.6, 0.2, "ADC", size=8, font="Roboto Mono")
    tb = textbox(s, 5.5, 1.7, 3.7, 2.4, [
        "Firestore is the source of truth while content is in review.",
        "",
        "Sanity, the CMS, is written once, at publish time, only from approved.",
        "",
        "Machines use the same API over REST or MCP with cfk_ keys that can never approve.",
    ], size=14)

    # 6 jarviscore
    split_slide(prs, "JarvisCore: an agent framework and runtime", [
        "Open source, Python, built by Prescott Data",
        "You write a role, a capability and a handler. The runtime does the rest",
        "P2P mesh: agents discover peers by role and delegate with one call",
        "Lifecycle, logging and tracing built in, so FastAPI only owns HTTP",
        "CustomAgent for control, AutoAgent when the kernel should plan",
    ], qr_png, size=12, title_size=20, body_top=1.6)

    # 7 Why many agents
    bullets_slide(prs, "One prompt did four jobs. It did all of them averagely.", [
        "Writing, fact-checking, editing and designing are different skills",
        "One prompt hallucinated numbers, buried the lede and drifted off brand",
        "One agent per concern: one prompt, one model tier, one failure policy each",
        "If research or QA fails, you still get the draft, flagged, in the review queue",
        "Specialists are easier to test, swap and upgrade",
    ], size=15, top=1.8)

    # 8 Seven agents
    s, body = card_slide(prs, "Seven agents. One job each. The right model for each job.", title_size=24)
    remove_shape(body)
    add_table(s, ["Agent", "Job", "Model", "Why this model"], [
        ["Odin", "Orchestrates the pipeline, art-directs the cover", "Gemini 3.1 Pro", "Judgement calls and tool use"],
        ["Oscar", "Writes the long-form draft", "Gemini 3.1 Pro", "Long context, strong prose"],
        ["Huginn", "Researches claims, inserts citations", "Gemini 3.8 Flash", "Many small, fast calls"],
        ["Heimdall", "Editorial QA: tone, fidelity, cuts", "Gemini 3.1 Pro", "The last reader before a human"],
        ["Hermes", "Generates the cover image", "Nano Banana Pro", "Clean text rendering in images"],
        ["Loki", "Social copy, carousel slots, studio chat", "3.8 Flash → 3.1 Pro fallback", "Short, frequent, streamed to a person"],
        ["Mimir", "Scouts the Source Vault for banked material", "Gemini 3.8 Flash", "Summarises in batches of ten"],
    ], CARD_L, 1.6, 8.3, col_widths=[1.0, 3.0, 1.9, 2.4], size=10.5, row_h=0.33)

    # 9 Pipeline
    s, body = card_slide(prs, "One transcript, four hand-offs, one review queue", title_size=24)
    remove_shape(body)
    steps = [("Oscar", "draft", RGBColor(0xD2, 0xE3, 0xFC)), ("Huginn", "citations", RGBColor(0xCE, 0xEA, 0xD6)),
             ("Heimdall", "QA", RGBColor(0xFE, 0xEF, 0xC3)), ("Review queue", "a human", INK),
             ("Hermes · Loki", "cover · carousel", RGBColor(0xFA, 0xD2, 0xCF))]
    bx, bw, gap, by, bh = 0.9, 1.45, 0.28, 2.25, 0.62
    # Odin sits above the three agents it drives
    ow = 3 * bw + 2 * gap
    box(s, bx, 1.5, ow, 0.45, ["Odin  ·  orchestrates"], fill=RGBColor(0xE8, 0xD5, 0xF5), size=12, bold=True)
    for i, (name, sub, fill) in enumerate(steps):
        x = bx + i * (bw + gap)
        box(s, x, by, bw, bh, [name, sub], fill=fill, color=WHITE if fill == INK else INK, size=12, bold=True)
        if i < len(steps) - 1:
            arrow(s, x + bw, by + bh / 2, x + bw + gap, by + bh / 2)
        if i < 3:
            arrow(s, x + bw / 2, 1.95, x + bw / 2, by)
    tb = s.shapes.add_textbox(Inches(0.9), Inches(3.1), Inches(6.0), Inches(2.0))
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate([
        "Oscar is the only hard dependency: no draft, no pipeline",
        "Everything after Oscar fails open: a research or QA failure keeps the last good draft and flags the stage",
        "Each hand-off streams a stage event to the browser: oscar_done · huginn_none · heimdall_done",
        f"This morning's run: {total_s:.0f} seconds and ${usd:.2f} from transcript to reviewed draft",
    ]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(5)
        r = p.add_run(); r.text = "•  " + line
        r.font.size = Pt(14); r.font.name = "Google Sans"; r.font.color.rgb = INK

    # 10 Routing
    s, body = card_slide(prs, "Model IDs live in config, resolved on every call", title_size=26)
    remove_shape(body)
    add_code(s, '''
def _route(m):                       # bare name → Gemini Enterprise Agent Platform via ADC
    return m if "/" in m else f"vertex_ai/{m}"

GEMINI_MODEL       = gemini-3.1-pro-preview   # Odin, Oscar, Heimdall
GEMINI_FLASH_MODEL = gemini-3.8-flash         # Loki, Huginn, Mimir
IMAGE_MODEL        = gemini-3-pro-image       # Hermes
HEIMDALL_MODEL, LOKI_MODEL, ...               # per-agent override, same shape
''', CARD_L, 1.65, 8.3, 1.75, size=10)
    set_bullets = ["Swap a model with an environment change on the Cloud Run revision, no redeploy",
                   "Pro where judgement matters, Flash where volume matters",
                   "The same code ran a different vendor mix last week. Today it's all Gemini"]
    tb = s.shapes.add_textbox(Inches(0.9), Inches(3.55), Inches(6.0), Inches(1.5))
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(set_bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(5)
        r = p.add_run(); r.text = "•  " + line
        r.font.size = Pt(14); r.font.name = "Google Sans"; r.font.color.rgb = INK

    # 11 Slots
    s, body = card_slide(prs, "The model chooses the words. Code chooses everything else.", title_size=24)
    remove_shape(body)
    add_code(s, '''
# What Loki may return — nothing else
{"slides": [{"kind": "hook", "heading": "...", "body": "..."}, ...]}

# carousel_pdf.py — brand facts live in code
BRAND_THEMES["your_brand"] = {
    "bg": "#F5F3EE", "accent": "#2E7DF6",
    "heading_font": "Fraunces", "masthead": "YOUR BRAND"}
CANVAS_W, CANVAS_H = 1080, 1350   # deterministic HTML → PDF
''', CARD_L, 1.6, 8.3, 1.95, size=10)
    tb = s.shapes.add_textbox(Inches(0.9), Inches(3.7), Inches(6.1), Inches(1.4))
    tf = tb.text_frame; tf.word_wrap = True
    for i, line in enumerate(["Upgrade the model: the carousel looks identical",
                              "Change the brand: edit a dict, every future carousel follows",
                              "Every string is escaped on the way in: a transcript can change what a slide says, not what a slide is"]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(4)
        r = p.add_run(); r.text = "•  " + line
        r.font.size = Pt(13); r.font.name = "Google Sans"; r.font.color.rgb = INK

    # 12 Takeaways
    bullets_slide(prs, "Four things to adapt to your brand", [
        "Split by concern: one agent, one prompt, one model tier, one failure policy",
        "Fail open after the draft. Flag, don't discard",
        "Retries for the start of a call, failover for the middle, and make it loud",
        "The model fills slots. Code owns the design and the publish button",
    ], size=18)

    # 13 Questions
    s = split_slide(prs, "Questions?", [
        "Sangalo Mwenyinyo",
        "github.com/sangalo20",
        "linkedin.com/in/sangalo-mwenyinyo-b3803b192",
        "medium.com/@mwenyinyo",
        "substack.com/@sangalom",
    ], qr_png, size=12, title_size=40, bullets_on=False)

    # drop template samples
    sldIdLst = prs.slides._sldIdLst
    for sldId in list(sldIdLst)[:n_template]:
        prs.part.drop_rel(sldId.rId)
        sldIdLst.remove(sldId)

    prs.save(OUT)
    print(f"wrote {OUT} with {len(prs.slides)} slides")


if __name__ == "__main__":
    build()
