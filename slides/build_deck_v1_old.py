"""Build the DevFest deck from the official template by cloning its sample
slides and rewriting their text.  Run:

    ../odin-agent/venv/bin/python build_deck.py

Output: human-is-the-reviewer.pptx (template slides removed, ours kept).
"""
import copy
import json
import sys
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
DEMO = ROOT / "demo" / "2026-10-03_041856"
TEMPLATE = HERE / "template.pptx"
OUT = HERE / "human-is-the-reviewer.pptx"

INK = RGBColor(0x1E, 0x1E, 0x1E)
CODE_BG = RGBColor(0x1E, 0x1E, 0x1E)
CODE_FG = RGBColor(0xE8, 0xEA, 0xED)
CODE_ACCENT = RGBColor(0x8A, 0xB4, 0xF8)

# Template sample slides we clone (1-based indices in the template).
T_TITLE = 3        # long title, name box, "Mauritius 2026", "Track"
T_SECTION = [6, 7, 8, 9, 10]   # numbered dividers 01..05
T_STATEMENT = 21   # big statement + Track/Mauritius
T_TITLE_BULLETS = 20
T_BIGNUM = 32      # 50% + top/bottom captions + picture right
T_PIC_BULLETS = 41 # title + bullets left, picture right
T_TEXTBLOCK = 17   # large text + subhead


# --------------------------------------------------------------------- helpers
def clone_slide(prs, src_idx):
    """Deep-copy template slide `src_idx` (1-based) as a new slide at the end,
    including picture relationships."""
    src = prs.slides[src_idx - 1]
    dst = prs.slides.add_slide(src.slide_layout)
    for sh in list(dst.shapes):
        sh._element.getparent().remove(sh._element)
    rid_map = {}
    for rel in src.part.rels.values():
        if rel.reltype.endswith("/image") or rel.reltype.endswith("/hyperlink"):
            if rel.is_external:
                new_rid = dst.part.rels.get_or_add_ext_rel(rel.reltype, rel.target_ref)
            else:
                new_rid = dst.part.rels.get_or_add(rel.reltype, rel.target_part)
            rid_map[rel.rId] = new_rid
    for el in src.shapes._spTree:
        if el.tag.endswith("}nvGrpSpPr") or el.tag.endswith("}grpSpPr"):
            continue
        new_el = copy.deepcopy(el)
        for node in new_el.iter():
            for attr in (qn("r:embed"), qn("r:link"), qn("r:id")):
                if attr in node.attrib and node.attrib[attr] in rid_map:
                    node.attrib[attr] = rid_map[node.attrib[attr]]
        dst.shapes._spTree.append(new_el)
    return dst


def shape_by_text(slide, startswith):
    for sh in slide.shapes:
        if sh.has_text_frame and sh.text_frame.text.strip().lower().startswith(startswith.lower()):
            return sh
    raise KeyError(f"no shape starting with {startswith!r} on slide")


def set_text(shape, lines, size=None, bold=None, keep_bullets=False):
    """Replace all text, keeping the first paragraph/run formatting."""
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
        if not keep_bullets:
            pPr = p.find(qn("a:pPr"))
            if pPr is not None:
                for bu in pPr.findall(qn("a:buChar")):
                    pPr.remove(bu)
        r = etree.SubElement(p, qn("a:r"))
        rPr = copy.deepcopy(proto_rPr)
        rPr.set("lang", "en")
        if size is not None:
            rPr.set("sz", str(int(size * 100)))
        if bold is not None:
            rPr.set("b", "1" if bold else "0")
        r.append(rPr)
        t = etree.SubElement(r, qn("a:t"))
        t.text = line
        end = p.find(qn("a:endParaRPr"))
        if end is not None:
            p.remove(end)
            p.append(end)
        txBody.append(p)


def remove_shape(shape):
    shape._element.getparent().remove(shape._element)


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text.strip()


def add_code(slide, code, left=0.9, top=1.9, width=8.2, height=3.3, size=11):
    box = slide.shapes.add_shape(1, Inches(left), Inches(top), Inches(width), Inches(height))
    box.fill.solid()
    box.fill.fore_color.rgb = CODE_BG
    box.line.fill.background()
    box.shadow.inherit = False
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.TOP
    tf.margin_left = tf.margin_right = Inches(0.25)
    tf.margin_top = tf.margin_bottom = Inches(0.18)
    first = True
    for line in code.strip("\n").split("\n"):
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(0)
        p.line_spacing = 1.05
        r = p.add_run()
        r.text = line if line else " "
        f = r.font
        f.name = "Roboto Mono"
        f.size = Pt(size)
        f.color.rgb = CODE_ACCENT if line.lstrip().startswith("#") else CODE_FG
    return box


def add_picture_fit(slide, path, left, top, max_w, max_h):
    from PIL import Image
    with Image.open(path) as im:
        w, h = im.size
    scale = min(max_w / w, max_h / h)
    pw, ph = w * scale, h * scale
    return slide.shapes.add_picture(str(path), Inches(left + (max_w - pw) / 2), Inches(top + (max_h - ph) / 2), Inches(pw), Inches(ph))


def swap_picture(slide, path, picture_index=0):
    """Replace a template picture's image blob in place (keeps position/crop)."""
    pics = [sh for sh in slide.shapes if sh.shape_type == 13]
    pic = pics[picture_index]
    img_part, rid = slide.part.get_or_add_image_part(str(path))
    pic._element.blipFill.blip.rEmbed = rid
    return pic


# ----------------------------------------------------------------- slide kinds
def slide_title(prs, title, event, track):
    s = clone_slide(prs, T_TITLE)
    set_text(shape_by_text(s, "Use this template"), title, size=34)
    set_text(shape_by_text(s, "Name Lastname"), event)
    set_text(shape_by_text(s, "Mauritius 2026"), "")
    set_text(shape_by_text(s, "Track"), track)
    return s


def slide_section(prs, n, title, sub):
    s = clone_slide(prs, T_SECTION[n - 1])
    for sh in list(s.shapes):
        t = sh.text_frame.text.strip() if sh.has_text_frame else ""
        if t == f"{n:02d}":
            continue
        if "subhead" in t.lower():
            set_text(sh, sub)
        elif sh.has_text_frame:
            set_text(sh, title, size=40, bold=True)
    return s


def slide_statement(prs, text, track="", size=28):
    s = clone_slide(prs, T_STATEMENT)
    set_text(shape_by_text(s, "Simple"), text, size=size)
    set_text(shape_by_text(s, "Mauritius 2026"), "DevFest 2026")
    set_text(shape_by_text(s, "Track"), track)
    # widen the statement box
    sh = shape_by_text(s, text[:10])
    sh.left, sh.top, sh.width, sh.height = Inches(0.9), Inches(1.4), Inches(6.2), Inches(3.0)
    return s


def slide_bullets(prs, title, bullets, size=20):
    s = clone_slide(prs, T_TITLE_BULLETS)
    set_text(shape_by_text(s, "Example with slide title"), title, size=28)
    set_text(shape_by_text(s, "Bullet one"), bullets, size=size, keep_bullets=True)
    return s


def slide_code(prs, title, code, caption=None, size=11):
    s = clone_slide(prs, T_TITLE_BULLETS)
    set_text(shape_by_text(s, "Example with slide title"), title, size=26)
    remove_shape(shape_by_text(s, "Bullet one"))
    lines = code.count("\n") + 1
    h = min(3.2, 0.45 + lines * (size * 1.45 / 72))
    add_code(s, code, top=1.7, height=h, size=size)
    if caption:
        tb = s.shapes.add_textbox(Inches(0.9), Inches(1.7 + h + 0.05), Inches(8.2), Inches(0.35))
        p = tb.text_frame.paragraphs[0]
        r = p.add_run(); r.text = caption
        r.font.size = Pt(13); r.font.name = "Google Sans"; r.font.color.rgb = INK
    return s


def slide_bignum(prs, number, top_caption, bottom_caption, picture=None):
    s = clone_slide(prs, T_BIGNUM)
    set_text(shape_by_text(s, "50%"), number, size=72)
    set_text(shape_by_text(s, "Use more than"), top_caption)
    set_text(shape_by_text(s, "of this large"), bottom_caption)
    if picture:
        swap_picture(s, picture, picture_index=-1)
    return s


def slide_pic_bullets(prs, title, bullets, picture, size=18):
    s = clone_slide(prs, T_PIC_BULLETS)
    set_text(shape_by_text(s, "Title goes here"), title, size=26)
    set_text(shape_by_text(s, "Bullet one"), bullets, size=size, keep_bullets=True)
    # template: two pictures; the first is the right-hand image slot.
    pics = [sh for sh in s.shapes if sh.shape_type == 13]
    for p in pics:
        remove_shape(p)
    add_picture_fit(s, picture, 5.2, 0.5, 4.5, 4.6)
    return s


def slide_table(prs, title, header, rows, col_widths=None, size=12):
    s = clone_slide(prs, T_TITLE_BULLETS)
    set_text(shape_by_text(s, "Example with slide title"), title, size=28)
    remove_shape(shape_by_text(s, "Bullet one"))
    n_rows, n_cols = len(rows) + 1, len(header)
    tbl = s.shapes.add_table(n_rows, n_cols, Inches(0.9), Inches(1.8), Inches(8.2), Inches(0.35 * n_rows)).table
    widths = col_widths or [8.2 / n_cols] * n_cols
    for i, w in enumerate(widths):
        tbl.columns[i].width = Inches(w)
    for c, h in enumerate(header):
        cell = tbl.cell(0, c); cell.text = h
        for p in cell.text_frame.paragraphs:
            for r in p.runs:
                r.font.bold = True; r.font.size = Pt(size); r.font.name = "Google Sans"
    for ri, row in enumerate(rows, start=1):
        for c, v in enumerate(row):
            cell = tbl.cell(ri, c); cell.text = str(v)
            for p in cell.text_frame.paragraphs:
                for r in p.runs:
                    r.font.size = Pt(size); r.font.name = "Google Sans"
    return s


def slide_closing(prs, title, lines, track):
    s = clone_slide(prs, T_TITLE)
    set_text(shape_by_text(s, "Use this template"), title, size=40)
    set_text(shape_by_text(s, "Name Lastname"), lines)
    set_text(shape_by_text(s, "Mauritius 2026"), "")
    set_text(shape_by_text(s, "Track"), track)
    return s


# ---------------------------------------------------------------------- content
def build():
    prs = Presentation(TEMPLATE)
    n_template = len(prs.slides)
    stages = json.loads((DEMO / "02_stages.json").read_text())
    summary = json.loads((DEMO / "summary.json").read_text())
    usd = summary["usage"]["totalUsd"]

    TITLE = "The Human Is the Reviewer: Shipping a Production Multi-Agent Content Platform on Gemini and Cloud Run"

    # 1 Title
    s = slide_title(prs, TITLE, ["DevFest 2026, Mauritius"], "AI")
    notes(s, """
Open: "Quick show of hands: who has shipped something with an LLM in it to real users? Keep it up if you still trust it to publish without a person looking." That's the talk.
45 minutes total. I'll talk for ~33 and keep 12 for questions. Everything you'll see is running code, not slideware.
""")

    # 2 Hook
    s = slide_statement(prs, "Humans don't write here.\nThey review.", track="AI", size=36)
    notes(s, """
ContentForge: a YouTube link, an article, a webpage or a GitHub repo goes in. A reviewed blog draft, a cover image and a PDF carousel come out.
Nobody on the team writes the first draft anymore. Every single artefact still passes a human before it is published. That constraint shaped every architectural decision you'll see.
""")

    # 3 What goes in / what comes out (demo outputs)
    s = slide_pic_bullets(prs, "One transcript in. Three artefacts out.", [
        "Blog draft, 4,264 chars, edited and QA'd",
        "Cover image, generated on brief",
        "7-slide LinkedIn carousel, PDF, on brand",
        "LinkedIn post copy",
        f"Total model cost for the article: ${usd:.2f}",
    ], DEMO / "03_cover.png")
    notes(s, """
This is the actual output of the run I did this morning on the DevFest project, not a mock-up. The transcript was a talk outline; the agents produced the draft, this cover, the carousel and the post.
Point at the number: sixteen cents per article for the text pipeline. Images are on top of that. Cheap enough that cost is not the constraint — trust is.
""")

    # 4 Section 01
    s = slide_section(prs, 1, "Why one prompt wasn't enough", "The failure modes that pushed us to a mesh")
    notes(s, "Transition: the origin story, briefly.")

    # 5 Problems with the single prompt
    s = slide_bullets(prs, "Version one was a single prompt. It failed in four ways.", [
        "It hallucinated statistics — nobody checked them",
        "It buried the lede — writer and editor were the same voice",
        "Brand colours drifted on every model update",
        "No seams: one failure meant redoing everything",
    ])
    notes(s, """
Each of these is a separate skill: writing, verifying, editing, designing. Asking one context window to hold all four at once gave us the average of all four.
The insight isn't "agents are cool". It's that each concern needs its own prompt, its own model tier, and its own failure handling. That's just separation of concerns applied to LLM calls.
""")

    # 6 Section 02
    s = slide_section(prs, 2, "The architecture", "Three services on Google Cloud")
    notes(s, "")

    # 7 Architecture table
    s = slide_table(prs, "Three services, one review queue", ["Layer", "Tech", "Job"], [
        ["Web app", "React 19 + Vite", "Workspaces, library, review queue, Brand Studio"],
        ["Backend", "Express on Cloud Run", "Auth, Firestore, Storage, Sanity publish, /api/v1 + MCP"],
        ["Agent service", "FastAPI + jarviscore on Cloud Run", "7 agents, Gemini via Vertex AI (ADC)"],
        ["Data", "Firestore / Cloud Storage / Sanity", "Library items, images, published posts"],
    ], col_widths=[1.5, 2.9, 3.8], size=12)
    notes(s, """
Browser talks to the Express backend; the backend talks to the agent service over HTTP, NDJSON and SSE. The agent service is only reachable through Cloud Run IAM; it trusts the forwarded user headers from the backend.
Sanity is written only at publish time. Firestore is the source of truth for everything in review. That split matters: nothing reaches the CMS until a human approves.
Authentication to Gemini is Application Default Credentials, no API keys anywhere in the agent service.
""")

    # 8 Section 03 agents
    s = slide_section(prs, 3, "Meet the seven agents", "A jarviscore P2P mesh, one role each")
    notes(s, "")

    # 9 Agents table
    s = slide_table(prs, "Seven agents, seven jobs", ["Agent", "Role", "Model"], [
        ["Odin", "Orchestrator and art director", "Gemini 3.1 Pro"],
        ["Oscar", "Long-form writer", "Gemini 3.1 Pro (per-workspace override)"],
        ["Huginn", "Citation research, link insertion", "Gemini 3.8 Flash"],
        ["Heimdall", "Editorial QA gate", "Gemini 3.1 Pro"],
        ["Hermes", "Cover images", "Nano Banana Pro (gemini-3-pro-image)"],
        ["Loki", "Social copy, carousel slots, studio chat", "Gemini 3.8 Flash → 3.1 Pro fallback"],
        ["Mimir", "Source Vault scout", "Gemini 3.8 Flash"],
    ], col_widths=[1.3, 3.6, 3.3], size=12)
    notes(s, """
Norse names because the first one was called Odin and it stuck. The useful part is the column on the right.
Each agent is a jarviscore CustomAgent with a role and a capability string. The mesh gives us registration, discovery and lifecycle; delegation is a direct call to a peer by role.
Pro where judgement matters: orchestration, drafting, editing. Flash where volume matters: research makes many small calls, social copy is short and frequent, scouting summarises ten vault entries at a time.
""")

    # 10 Agent definition code
    s = slide_code(prs, "An agent is a class with a role and a handler", '''
class HeimdallAgent(CustomAgent):
    role = "heimdall"
    capabilities = ["quality_assurance"]

    async def on_peer_request(self, msg):
        if msg.data.get("task") == "review_draft":
            return await self.review_draft(msg)

# main.py — the mesh owns lifecycle; FastAPI owns HTTP
app = FastAPI(lifespan=JarvisLifespan(
    agents=[odin, oscar, huginn, heimdall, hermes, loki, mimir],
    mode="p2p",
))
''', caption="agents.py · main.py")
    notes(s, """
That's the whole contract. A role, a capability list, and a handler for peer messages. jarviscore injects the mesh, the logger and the lifecycle.
JarvisLifespan is a FastAPI lifespan: it starts the mesh before the first request and tears it down on shutdown. The readiness probe checks all seven are registered and returns 503 otherwise, so Cloud Run never routes traffic to a half-started instance.
""")

    # 11 Pipeline code
    s = slide_code(prs, "The article pipeline: Odin → Oscar → Huginn → Heimdall", '''
# OdinAgent.process_campaign (abridged)
draft = await oscar.on_peer_request(PeerMessage({"task": "write_blog", ...}))
if draft.get("status") != "success":
    return {"error": f"OscarAgent failed: {draft.get('error')}"}   # hard stop

try:                                                # fail-open from here on
    enriched = await huginn.on_peer_request(PeerMessage({"task": "enrich_citations", ...}))
    if enriched.get("status") == "success": draft_text = enriched["draft"]
except Exception as e:
    logger.warning(f"Huginn failed open: {e}");  await notify("huginn_skipped")

try:
    reviewed = await heimdall.on_peer_request(PeerMessage({"task": "review_draft", ...}))
    if reviewed.get("status") == "success": draft_text, qa_report = reviewed["draft"], reviewed["qa_report"]
except Exception as e:
    logger.warning(f"Heimdall failed open: {e}"); await notify("heimdall_skipped")
''', caption="agents.py · OdinAgent.process_campaign", size=9)
    notes(s, """
Read the shape, not the lines. Oscar is the only hard dependency: no draft, no pipeline. Everything downstream is fail-open: if research or QA fails we keep the last good draft and tell the UI which stage was skipped.
Why fail-open? Because the human is the reviewer. A draft without citations still lands in the review queue and a person sees "Huginn skipped" on it. A pipeline that throws away a $0.06 draft because a search API hiccupped is worse than one that flags it.
Each hand-off emits a progress event — oscar_start, huginn_none, heimdall_done — which streams to the browser as NDJSON.
""")

    # 12 Timeline big number
    s = slide_bignum(prs, f"{stages[-1]['t']:.0f}s", "Transcript to reviewed draft in", "three model calls, three agents", picture=DEMO / "carousel_page-1.png")
    notes(s, f"""
From this morning's run: {', '.join(f"{e['event']} at {e['t']}s" for e in stages)}.
Oscar about 40 seconds, Huginn 17 (it found nothing to cite — the stage event says huginn_none, not huginn_done, because the UI should never claim links were woven in when they weren't), Heimdall 51 seconds.
Heimdall is the slowest and the most expensive call. It is also the one that makes the draft publishable. Worth it.
""")

    # 13 Section 04 routing
    s = slide_section(prs, 4, "Routing by role, surviving preview endpoints", "Gemini 3.1 Pro, Gemini 3.8 Flash, and what happens when they flake")
    notes(s, "")

    # 14 Routing code
    s = slide_code(prs, "Model ids live in env, resolved per call", '''
def _route(m: str) -> str:
    return m if "/" in m else f"{_gemini_litellm_prefix()}{m}"

def _gemini_litellm_prefix() -> str:
    # Vertex AI via ADC on GCP; AI Studio only if a key is present locally
    return "gemini/" if os.getenv("GEMINI_API_KEY") else "vertex_ai/"

def _gemini_model() -> str:        # judgement tier
    return os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")

def _gemini_flash_model() -> str:  # volume tier: Loki, Huginn, Mimir
    return _route(os.getenv("GEMINI_FLASH_MODEL", "gemini-3.8-flash"))

def _heimdall_model_str() -> str:  # per-agent override, same shape everywhere
    m = os.getenv("HEIMDALL_MODEL", "")
    return _route(m) if m else _gemini_litellm_model()
''', caption="agents.py · model routing helpers", size=10)
    notes(s, """
Two tiers and one override per agent. Every helper is resolved per call, not at import, so a model swap is an env change on the Cloud Run revision, no redeploy of code.
This is also how this deck exists: the production system runs a mix of vendors; for today I pointed every role at Gemini by changing six environment variables. Same code.
litellm gives us one call signature across Vertex, AI Studio and anything else. The prefix is the only vendor-specific thing.
""")

    # 15 Fallback code
    s = slide_code(prs, "Retries handle the start of a call. Failover handles the middle.", '''
primary, fallback = self.model_str, _loki_fallback_model_str()
for model in (primary, fallback):
    if model != primary:
        _log_llm_fallback(logger, "studio_chat", primary, model, last_error)
        yield {"type": "reset"}          # wipe the half-streamed reply from the canvas
        yield {"type": "status", "content": "Primary model overloaded — retrying with the backup..."}
    try:
        response = await litellm.acompletion(model=model, messages=messages,
                                             stream=True, num_retries=2)
        async for chunk in response:
            ...                           # stream text / tool-call deltas to the UI
        return
    except Exception as e:
        last_error = e                    # mid-stream failures land here too
''', caption="agents.py · LokiAgent.stream_studio_chat", size=9.5)
    notes(s, """
The bug that taught us this: a preview endpoint returned Overloaded halfway through a streamed carousel revision. num_retries only covers failures before the stream starts. A reviewer saw half a slide and a stack trace.
Fix: the whole call-and-consume loop runs per model. On failover we emit a reset event so the UI clears what it showed, then a status line, then the backup model answers from scratch. Failover is logged at WARNING and as an llm.fallback observability event: never silent.
Honest footnote: Loki has this because Loki streams to a human in real time. Oscar and Heimdall still rely on litellm retries only. That's the next thing I'd harden.
""")

    # 16 Section 05 slots
    s = slide_section(prs, 5, "Model fills slots. Code owns the design.", "How brand output stays deterministic across model upgrades")
    notes(s, "")

    # 17 Slots: Loki output vs renderer
    s = slide_code(prs, "Loki returns slots. The renderer never sees a prompt.", '''
# What Loki (Gemini 3.8 Flash) is allowed to return — nothing else
{"slides": [
  {"kind": "hook",  "heading": "One prompt did four jobs. Badly.", "body": "..."},
  {"kind": "point", "heading": "Route by role, not by vendor.",    "body": "..."},
  {"kind": "cta",   "heading": "Save this for your next pipeline.", "body": ""}
]}

# carousel_pdf.py — brand facts live in code, not in the model
BRAND_THEMES["storage_moguls"] = {
    "bg": "#F5F3EE", "ink": "#0B1322", "accent": "#2E7DF6",
    "heading_font": "Fraunces", "masthead": "STORAGE MOGULS",
}
CANVAS_W, CANVAS_H = 1080, 1350   # fixed; HTML → PDF via WeasyPrint; text is escape()d
''', caption="agents.py · carousel_pdf.py", size=9.5)
    notes(s, """
The model gets a strict tool schema: kind, heading, body. That's it. No colours, no fonts, no layout.
The renderer is deterministic HTML to PDF with the brand palette as a Python dict. Upgrade the model, the carousel looks identical. Change the brand, edit a dict, every future carousel follows.
Because the model never touches markup, every string is HTML-escaped on the way in. Prompt injection via a transcript can change what a slide says; it cannot change what the slide is.
""")

    # 18 Slots result pictures
    s = slide_pic_bullets(prs, "Same renderer, every run", [
        "7 slides from this morning's draft",
        "Model chose words; code chose everything else",
        "draftOnly=true: a human approves the slots before rendering",
        "Render is a separate, idempotent call",
    ], DEMO / "carousel_page-2.png")
    notes(s, """
This is slide two of the carousel the pipeline produced today. Note what the model did not decide: the masthead, the eyebrow, the page counter, the footer line, the fonts.
The two-step flow matters for review: Loki returns slots with draftOnly, the reviewer edits text in the studio, and only then does the backend call /carousel/render. Nobody reviews a PDF; they review text.
""")

    # 19 Review state machine
    s = slide_code(prs, "The review gate is a pure state machine", '''
// reviewLifecycle.js — draft → finalized → in_review → approved → published
const canStartReview   = (status) => ['finalized', 'approved'].includes(status);
const canDecide        = (status) => status === 'in_review';

const statusAfterDecision = (decision) => {
  if (decision === 'approve')         return 'approved';
  if (decision === 'request_changes') return 'draft';     // back to the creator
  return null;
};

// Sanity is written in exactly one place, and only from `approved`.
// cfk_ API keys (machines, MCP) can create and finalize — they can never approve.
''', caption="contentforge/backend/lib/reviewLifecycle.js", size=10.5)
    notes(s, """
This is the whole point of the title. The transitions are pure functions so they're unit-tested; the routes own persistence and notifications.
Two rules make it hold: publishing to the CMS happens in one function and only from approved; and machine credentials, including the MCP endpoint that lets an agentic client drive ContentForge, can create and finalize but never approve. An agent cannot approve another agent's work.
Request-changes sends the item back to draft with the reviewer's note, which the creator can feed to Loki in the studio for a revision.
""")

    # 20 Demo
    s = slide_statement(prs, "Demo: a transcript becomes a reviewed draft, a cover and a carousel.", track="AI", size=30)
    notes(s, """
Live if the network holds: run scripts/smoke_e2e.py against the local service and narrate the stage events as they stream. Expect ~2 minutes for the article, ~25 seconds for the cover, ~12 for the carousel.
If the network does not hold: the next three slides are the outputs from this morning. Say so plainly; the audience will respect it more than a frozen terminal.
""")

    # 21 Backup: draft
    draft_lines = (DEMO / "02_draft.md").read_text().split("\n")
    head = [l for l in draft_lines if l.strip()][:7]
    s = slide_code(prs, "Backup: Heimdall-approved draft (first lines)", "\n".join(head), caption="demo/02_draft.md", size=10)
    notes(s, "Backup slide. Only show if the live demo is down.")

    # 22 Backup: cover + carousel
    s = slide_pic_bullets(prs, "Backup: cover and carousel from the same run", [
        "Cover: Nano Banana Pro, 16:9, from Oscar's <image_prompt>",
        "Carousel: 7 slides, Storage Moguls template",
        "Both sat in the review queue; neither auto-published",
    ], DEMO / "03_cover.png")
    notes(s, "Backup slide.")

    # 23 Takeaways
    s = slide_bullets(prs, "Four things to take home", [
        "Split by concern: one agent, one prompt, one model tier, one failure policy",
        "Fail open downstream of the draft; flag, don't discard",
        "Retries for the start of a call, failover for the middle, and make it loud",
        "The model fills slots; code owns the design and the publish button",
    ], size=19)
    notes(s, """
If you remember one line: the human is the reviewer, so design every stage to produce something a human can review, even when a model is down.
""")

    # 24 What I'd harden next
    s = slide_bullets(prs, "What I'd harden next (honest list)", [
        "Failover for Oscar and Heimdall, not just Loki",
        "A Heimdall-rejects → Oscar-rewrites loop (today QA edits once)",
        "Ownership checks on rendered-file downloads",
        "Pin the jarviscore version; add route-level and mesh tests",
    ], size=19)
    notes(s, """
Production software has a tech-debt register; this is ours, trimmed. Say it out loud before someone asks. Each item is a GitHub issue, not a secret.
""")

    # 25 Closing / Q&A
    s = slide_closing(prs, "Questions?", ["DevFest 2026, Mauritius", "Code: jarviscore + ContentForge"], "AI")
    notes(s, "12 minutes for Q&A. If a question is about a specific line, open agents.py — it's all there.")

    # drop the template's sample slides
    sldIdLst = prs.slides._sldIdLst
    for sldId in list(sldIdLst)[:n_template]:
        prs.part.drop_rel(sldId.rId)
        sldIdLst.remove(sldId)

    prs.save(OUT)
    print(f"wrote {OUT} with {len(prs.slides)} slides")


if __name__ == "__main__":
    build()
