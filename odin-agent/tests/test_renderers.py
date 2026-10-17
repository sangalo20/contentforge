# The deterministic render tools Loki calls: carousel PDFs and poster PNGs.
# The model fills slots; the layout lives in code — so the contract to pin is
# "content in, valid branded artifact out" plus the escaping and fallback
# behavior that keeps model output from breaking the HTML.
import os

import carousel_pdf
import render_store


def test_template_registry_lists_ui_metadata():
    templates = carousel_pdf.list_templates()
    ids = [t["id"] for t in templates]
    assert "devfest" in ids
    for t in templates:
        assert t["name"] and t["description"]


def test_carousel_renders_a_pdf():
    slides = [
        {"kind": "hook", "heading": "The hook", "body": "Why it matters."},
        {"kind": "point", "heading": "Point one", "body": "The substance."},
        {"kind": "cta", "heading": "Do the thing", "body": "One clear action."},
    ]
    file_id, path = carousel_pdf.render_carousel_pdf(slides, "Test Brand")
    assert os.path.exists(path)
    with open(path, "rb") as f:
        header = f.read(5)
    assert header == b"%PDF-"
    assert os.path.getsize(path) > 1000


def test_unknown_template_falls_back_to_default():
    file_id, path = carousel_pdf.render_carousel_pdf(
        [{"kind": "hook", "heading": "H", "body": "B"}], "Brand", brand="no-such-theme"
    )
    assert os.path.exists(path)


def test_slide_html_escapes_model_output():
    theme = carousel_pdf.BRAND_THEMES["devfest"]
    html = carousel_pdf._slide_html(
        {"kind": "point", "heading": "<script>alert(1)</script>", "body": "a & b"},
        1, 3, theme, "Brand",
    )
    assert "<script>" not in html
    assert "&lt;script&gt;" in html
    assert "a &amp; b" in html


def test_poster_renders_a_png_for_both_types():
    for content in (
        {"poster_type": "statement", "headline": "One big message", "subline": "Support"},
        {"poster_type": "stat", "stat": "78%", "headline": "Of deals die here", "subline": ""},
    ):
        file_id, path = carousel_pdf.render_poster(content, "Test Brand")
        with open(path, "rb") as f:
            assert f.read(4) == b"\x89PNG"


def test_render_store_serves_local_renders_without_a_bucket():
    # Local dev has no RENDERS_BUCKET: store() is a no-op and fetch() serves
    # the renderer's temp file back by file_id.
    assert render_store.RENDERS_BUCKET in (None, ""), "test expects local mode"
    file_id, path = carousel_pdf.render_carousel_pdf(
        [{"kind": "hook", "heading": "H", "body": "B"}], "Brand"
    )
    render_store.store(file_id, path)  # no-op, must not raise
    found = render_store.fetch(file_id, ".pdf")
    assert found is not None
    filename, content = found
    assert filename == os.path.basename(path)
    assert content.startswith(b"%PDF-")


def test_render_store_misses_return_none():
    assert render_store.fetch("nope99", ".pdf") is None
