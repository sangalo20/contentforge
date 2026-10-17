"""
Carousel PDF Generator — the deterministic "tool" Loki calls.

NOT an agent, NO LLM logic. Loki produces the slide CONTENT (headings + body);
this module renders it into a FIXED, on-brand design. Zero design hallucination:
the model fills predefined slots, the layout lives here in code.

Design ported from the brand-poster-design skill's Storage Moguls EDUCATIONAL
recipe (references/sm-educational-poster.md): a light editorial field, not a dark
slide. Warm cream field, navy ink, electric-blue accent, Fraunces serif
headlines, JetBrains Mono meta, Montserrat body, Barlow Condensed masthead.
Message-first: one big idea per slide, generous whitespace.

Brand themes are keyed so other brands (Successful Idiots, Joe Downs) can be added
later without touching the renderer. WeasyPrint is lazy-imported (cold-start safety).
"""
import os
import re
import uuid
import tempfile
from datetime import datetime
from html import escape

_FONTS_DIR = os.path.join(os.path.dirname(__file__), "fonts")


def _font_url(filename: str) -> str:
    return "file://" + os.path.join(_FONTS_DIR, filename)


# Portrait canvas (px) — LinkedIn/Instagram portrait feed size.
CANVAS_W = 1080
CANVAS_H = 1350

# Carousel template registry. Each entry is a full, fixed visual identity
# (palette + fonts + masthead/footer). Add brands here; the renderer never changes.
# `name`/`description` are metadata for the UI. masthead/tag/footer_* may be None,
# in which case the workspace brand_name is used (masthead) or the element is hidden.
BRAND_THEMES = {
    "devfest": {
        "name": "DevFest Mauritius — Light",
        "description": "Clean white field, Google blue accent, Montserrat. Talks and tutorials.",
        "bg": "#FFFFFF", "ink": "#1E1E1E", "accent": "#4285F4", "muted": "#5F6368",
        "cta_bg": "#1E1E1E",
        "heading_font": "Montserrat",
        "masthead": "DEVFEST MAURITIUS", "tag": "2026",
        "footer_a": "BUILD WITH ", "footer_b": "GOOGLE DEVELOPERS.",
        "footer_right": "gdg.community.dev",
    },
    "devfest_dark": {
        "name": "DevFest Mauritius — Dark",
        "description": "Near-black field, Google yellow accent, Montserrat. Stats and bold claims.",
        "bg": "#1E1E1E", "ink": "#F8F9FA", "accent": "#FBBC04", "muted": "#9AA0A6",
        "cta_bg": "#4285F4",
        "heading_font": "Montserrat",
        "masthead": "DEVFEST MAURITIUS", "tag": "2026",
        "footer_a": "BUILD WITH ", "footer_b": "GOOGLE DEVELOPERS.",
        "footer_right": "gdg.community.dev",
    },
    "neutral": {
        "name": "Neutral / Minimal",
        "description": "Clean white field, Montserrat sans, blue accent. Brand-agnostic.",
        "bg": "#FFFFFF", "ink": "#0F172A", "accent": "#2563EB", "muted": "#64748B",
        "cta_bg": "#0F172A",
        "heading_font": "Montserrat",
        "masthead": None, "tag": None,          # masthead falls back to brand_name
        "footer_a": None, "footer_b": None,
        "footer_right": None,
    },
}
DEFAULT_THEME = "devfest"


def list_templates() -> list[dict]:
    """Return template metadata for the UI (id, name, description)."""
    return [
        {"id": k, "name": v["name"], "description": v["description"]}
        for k, v in BRAND_THEMES.items()
    ]


def _slide_html(slide: dict, index: int, total: int, t: dict, brand_name: str) -> str:
    """Render one slide. hook/point = field; cta = the flipped closing slide."""
    kind = (slide.get("kind") or "point").lower()
    heading = escape(str(slide.get("heading") or "").strip())
    body = escape(str(slide.get("body") or "").strip())
    is_cta = kind == "cta"
    slide_class = "slide cta" if is_cta else "slide"

    body_html = f'<p class="body">{body}</p>' if body else ""
    eyebrow = "THE CLOSE" if is_cta else ("START HERE" if kind == "hook" else "READ THIS")

    masthead_text = t.get("masthead") or (brand_name or "").upper() or "CONTENT"
    tag_html = f'<div class="tag">{escape(t["tag"])}</div>' if t.get("tag") else "<div></div>"

    if t.get("footer_a") is not None:
        foot_left = f'{escape(t["footer_a"])}<span class="foot-accent">{escape(t.get("footer_b") or "")}</span>'
    else:
        foot_left = escape(brand_name or "")
    foot_right_text = t.get("footer_right")
    foot_right = (f'{escape(foot_right_text)} &nbsp;·&nbsp; ' if foot_right_text else "") + f"{index + 1:02d}/{total:02d}"

    return f"""
    <div class="{slide_class}">
      <div class="topbar">
        <div class="masthead">{escape(masthead_text)}<span class="dot">.</span></div>
        {tag_html}
      </div>
      <div class="content">
        <div class="eyebrow">{eyebrow}</div>
        <h1 class="heading">{heading}</h1>
        {body_html}
      </div>
      <div class="footer">
        <div class="foot-brand">{foot_left}</div>
        <div class="foot-right">{foot_right}</div>
      </div>
    </div>"""


def render_carousel_pdf(slides: list[dict], brand_name: str = "", accent_color: str = "", brand: str = DEFAULT_THEME) -> tuple[str, str]:
    """
    Render slide dicts into an on-brand portrait multi-page PDF carousel.

    slides: [{ "kind": "hook|point|cta", "heading": str, "body": str }, ...]
    brand_name: workspace label (used as masthead when the template has none).
    accent_color: optional hex override for the accent.
    brand: which BRAND_THEMES template to use (default devfest).

    Returns (file_id, absolute_pdf_path).
    """
    from weasyprint import HTML  # lazy import (native libs)

    t = dict(BRAND_THEMES.get(brand, BRAND_THEMES[DEFAULT_THEME]))
    if re.match(r"^#[0-9a-fA-F]{6}$", accent_color or ""):
        t["accent"] = accent_color

    total = len(slides)
    slides_html = "\n".join(_slide_html(s, i, total, t, brand_name) for i, s in enumerate(slides))

    # Serif headlines (Fraunces) sit at a lighter weight/tighter tracking than the
    # sans (Montserrat) headline used by the neutral template.
    _serif = t.get("heading_font") == "Fraunces"
    head_weight = 500 if _serif else 800
    head_ls = "-2px" if _serif else "-1px"

    css = f"""
    @font-face {{ font-family: 'Fraunces'; src: url('{_font_url("Fraunces.ttf")}'); font-weight: 400 700; }}
    @font-face {{ font-family: 'Montserrat'; src: url('{_font_url("Montserrat.ttf")}'); font-weight: 300 700; }}
    @font-face {{ font-family: 'JetBrains Mono'; src: url('{_font_url("JetBrainsMono.ttf")}'); font-weight: 400 700; }}
    @font-face {{ font-family: 'Barlow Condensed'; src: url('{_font_url("BarlowCondensed-SemiBold.ttf")}'); font-weight: 600; }}

    @page {{ size: {CANVAS_W}px {CANVAS_H}px; margin: 0; }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}

    .slide {{
        width: {CANVAS_W}px; height: {CANVAS_H}px;
        page-break-after: always;
        background: {t['bg']};
        color: {t['ink']};
        padding: 96px;
        border-top: 8px solid {t['accent']};
        display: flex; flex-direction: column;
        position: relative;
    }}
    .slide.cta {{ background: {t['cta_bg']}; color: {t['bg']}; }}

    .topbar {{ display: flex; justify-content: space-between; align-items: center; }}
    .masthead {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 34px; letter-spacing: 1px; text-transform: uppercase; color: {t['ink']}; }}
    .slide.cta .masthead {{ color: {t['bg']}; }}
    .masthead .dot {{ color: {t['accent']}; }}
    .tag {{ font-family: 'JetBrains Mono', monospace; font-size: 20px; letter-spacing: 3px; text-transform: uppercase; color: {t['accent']}; }}

    .content {{ flex: 1; display: flex; flex-direction: column; justify-content: center; }}
    .eyebrow {{ font-family: 'JetBrains Mono', monospace; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; color: {t['accent']}; margin-bottom: 32px; }}
    .heading {{ font-family: '{t.get('heading_font', 'Fraunces')}', serif; font-weight: {head_weight}; font-size: 88px; line-height: 1.04; letter-spacing: {head_ls}; color: {t['ink']}; }}
    .slide.cta .heading {{ color: {t['bg']}; }}
    .body {{ font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: 36px; line-height: 1.5; margin-top: 36px; color: {t['ink']}; }}
    .slide.cta .body {{ color: {t['bg']}; opacity: 0.92; }}

    .footer {{ display: flex; justify-content: space-between; align-items: center; padding-top: 28px; border-top: 1px solid rgba(11,19,34,0.15); }}
    .slide.cta .footer {{ border-top-color: rgba(245,243,238,0.2); }}
    .foot-brand {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; color: {t['ink']}; }}
    .slide.cta .foot-brand {{ color: {t['bg']}; }}
    .foot-brand .foot-accent {{ color: {t['accent']}; }}
    .foot-right {{ font-family: 'JetBrains Mono', monospace; font-size: 20px; letter-spacing: 1px; color: {t['muted']}; }}
    .slide.cta .foot-right {{ color: rgba(245,243,238,0.7); }}
    """

    html_content = f"<html><head><meta charset='utf-8'><style>{css}</style></head><body>{slides_html}</body></html>"

    temp_dir = tempfile.gettempdir()
    file_id = str(uuid.uuid4())[:8]
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", (brand_name or brand)).strip("_").lower() or "carousel"
    date_str = datetime.now().strftime("%Y-%m-%d")
    pdf_filename = f"carousel_{slug}_{date_str}_{file_id}.pdf"
    pdf_path = os.path.join(temp_dir, pdf_filename)
    HTML(string=html_content).write_pdf(pdf_path)

    # Persist to GCS when configured so any Cloud Run instance can serve it.
    from render_store import store as _store_render
    _store_render(file_id, pdf_path)

    return file_id, pdf_path


# ── Single poster (image) ─────────────────────────────────────────────
# A poster is one richly-designed slide, output as a PNG (single-image post).
# Same "content = model, design = code" split as the carousel.

POSTER_W = 1080
POSTER_H = 1350


def _font_face_css() -> str:
    return (
        f"@font-face {{ font-family: 'Fraunces'; src: url('{_font_url('Fraunces.ttf')}'); font-weight: 400 700; }}"
        f"@font-face {{ font-family: 'Montserrat'; src: url('{_font_url('Montserrat.ttf')}'); font-weight: 300 700; }}"
        f"@font-face {{ font-family: 'JetBrains Mono'; src: url('{_font_url('JetBrainsMono.ttf')}'); font-weight: 400 700; }}"
        f"@font-face {{ font-family: 'Barlow Condensed'; src: url('{_font_url('BarlowCondensed-SemiBold.ttf')}'); font-weight: 600; }}"
    )


def render_poster(content: dict, brand_name: str = "", accent_color: str = "", brand: str = DEFAULT_THEME) -> tuple[str, str]:
    """
    Render a single on-brand poster as a PNG.

    content: { "poster_type": "statement"|"stat", "stat": str, "headline": str, "subline": str }
    Returns (file_id, absolute_png_path).
    """
    from weasyprint import HTML
    import fitz  # PyMuPDF, for PDF -> PNG

    t = dict(BRAND_THEMES.get(brand, BRAND_THEMES[DEFAULT_THEME]))
    if re.match(r"^#[0-9a-fA-F]{6}$", accent_color or ""):
        t["accent"] = accent_color

    ptype = (content.get("poster_type") or "statement").lower()
    stat = escape(str(content.get("stat") or "").strip())
    headline = escape(str(content.get("headline") or "").strip())
    subline = escape(str(content.get("subline") or "").strip())
    hfont = t.get("heading_font", "Fraunces")

    masthead_text = t.get("masthead") or (brand_name or "").upper() or "CONTENT"
    tag_html = f'<div class="tag">{escape(t["tag"])}</div>' if t.get("tag") else "<div></div>"
    if t.get("footer_a") is not None:
        foot_left = f'{escape(t["footer_a"])}<span class="foot-accent">{escape(t.get("footer_b") or "")}</span>'
    else:
        foot_left = escape(brand_name or "")
    foot_right = escape(t.get("footer_right") or "")

    stat_html = f'<div class="stat">{stat}</div>' if (ptype == "stat" and stat) else ""
    subline_html = f'<p class="subline">{subline}</p>' if subline else ""

    css = f"""
    {_font_face_css()}
    @page {{ size: {POSTER_W}px {POSTER_H}px; margin: 0; }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    .poster {{
        width: {POSTER_W}px; height: {POSTER_H}px;
        background: {t['bg']}; color: {t['ink']};
        padding: 96px; border-top: 8px solid {t['accent']};
        display: flex; flex-direction: column; position: relative;
    }}
    .topbar {{ display: flex; justify-content: space-between; align-items: center; }}
    .masthead {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 34px; letter-spacing: 1px; text-transform: uppercase; }}
    .masthead .dot {{ color: {t['accent']}; }}
    .tag {{ font-family: 'JetBrains Mono', monospace; font-size: 20px; letter-spacing: 3px; text-transform: uppercase; color: {t['accent']}; }}
    .content {{ flex: 1; display: flex; flex-direction: column; justify-content: center; }}
    .stat {{ font-family: '{hfont}', serif; font-weight: 600; font-size: 300px; line-height: 0.9; letter-spacing: -6px; color: {t['accent']}; margin-bottom: 24px; }}
    .headline {{ font-family: '{hfont}', serif; font-weight: 500; font-size: 104px; line-height: 1.02; letter-spacing: -2.5px; color: {t['ink']}; }}
    .subline {{ font-family: 'Montserrat', sans-serif; font-weight: 400; font-size: 40px; line-height: 1.45; margin-top: 40px; color: {t['ink']}; }}
    .footer {{ display: flex; justify-content: space-between; align-items: center; padding-top: 28px; border-top: 1px solid rgba(11,19,34,0.15); }}
    .foot-brand {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 1px; text-transform: uppercase; }}
    .foot-brand .foot-accent {{ color: {t['accent']}; }}
    .foot-right {{ font-family: 'JetBrains Mono', monospace; font-size: 20px; letter-spacing: 1px; color: {t['muted']}; }}
    """

    html_content = (
        f"<html><head><meta charset='utf-8'><style>{css}</style></head><body>"
        f'<div class="poster">'
        f'  <div class="topbar"><div class="masthead">{escape(masthead_text)}<span class="dot">.</span></div>{tag_html}</div>'
        f'  <div class="content">{stat_html}<h1 class="headline">{headline}</h1>{subline_html}</div>'
        f'  <div class="footer"><div class="foot-brand">{foot_left}</div><div class="foot-right">{foot_right}</div></div>'
        f"</div></body></html>"
    )

    temp_dir = tempfile.gettempdir()
    file_id = str(uuid.uuid4())[:8]
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", (brand_name or brand)).strip("_").lower() or "poster"
    date_str = datetime.now().strftime("%Y-%m-%d")
    base = f"poster_{slug}_{date_str}_{file_id}"
    pdf_path = os.path.join(temp_dir, base + ".pdf")
    png_path = os.path.join(temp_dir, base + ".png")

    HTML(string=html_content).write_pdf(pdf_path)
    # Rasterize the single PDF page to a PNG at the target pixel width.
    doc = fitz.open(pdf_path)
    page = doc[0]
    zoom = POSTER_W / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    pix.save(png_path)
    doc.close()
    try:
        os.remove(pdf_path)
    except OSError:
        pass

    from render_store import store as _store_render
    _store_render(file_id, png_path)

    return file_id, png_path
