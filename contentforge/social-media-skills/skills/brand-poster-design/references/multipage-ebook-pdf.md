# Multi-page graphic EBOOK → print-ready PDF (Joe, June 2026)

Proven on the **Storage 100 — Beginner's Picture Guide** (a 10-lesson illustrated
ebook for Joe Downs' personal brand). Distinct from the poster / story / motion
pipelines: this produces a **paginated, shareable PDF** (cover + contents +
N lesson pages + back cover), not a single social image.

## When to use
Asked to build an **ebook / guide / picture-book / lookbook / multi-page PDF** —
anything that is several designed PAGES bound into one document, on the brand
spine. Not for single posters (use the poster pipeline) or motion (Remotion).

## Architecture
- ONE self-contained HTML file. Each page = a `<section class="page">` sized to a
  fixed canvas (e.g. `--page-w:880px; --page-h:1180px`), `overflow:hidden`.
- A `@media print` block makes it a real PDF: `@page{size:<w> <h>;margin:0}` and
  `.page{page-break-after:always;break-after:page;height:var(--page-h)}`.
- Brand spine constant across pages (bg, type scale, footer, accent); only the
  per-page focal content changes — same discipline as a poster batch.
- **Even vertical rhythm = ONE gap rule, not hand-tuned margins:**
  `.lesson > * + * { margin-top: var(--gap); }` gives consistent spacing between
  every block on every page. Hand-spacing each element is what produced "spacing
  is off in some places" (Joe caught it) — let the rule do it.

## Render to PDF (headless Chrome)
```
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ABS="C:/Users/.../book.html"   # forward slashes in git-bash (same gotcha as posters)
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="C:/Users/.../book.pdf" "file:///$ABS"
pdfinfo book.pdf | grep -i pages   # confirm page count
```
`--no-pdf-header-footer` removes Chrome's default date/URL chrome. The `@page`
size must MATCH the `.page` px dimensions or pages split/scale wrong.

## QA page-by-page (this is the key technique)
A whole-page browser screenshot only captures the first viewport. To inspect
ANY page, render the PDF to per-page PNGs with **poppler `pdftoppm`** (already on
this machine via WinGet), then `vision_analyze` the PNGs:
```
pdftoppm -png -r 80 -f <firstPage> -l <lastPage> book.pdf qa_pg   # -> qa_pg-NN.png
```
QA the TEXT-HEAVY pages specifically (most bullets / longest copy) — those are
where content overflows the fixed page height. Confirm: nothing clipped at the
bottom edge, even spacing, the CTA/footer fully inside the frame.

To inspect a suspected bottom-edge collision, crop the lower band with Pillow and
re-vision it (don't trust a full-page glance):
```
python -c "from PIL import Image; im=Image.open('qa_pg-07.png'); w,h=im.size; \
im.crop((0,int(h*0.78),w,h)).save('crop.png')"
```

## ⛔ PITFALL — bottom-pinned CTA overlaps the page-number/footer on DENSE pages
The footer (`position:absolute;bottom`) and page number sit in a fixed bottom
zone. A CTA pinned with `margin-top:auto` floats to the bottom of the flex
column — on a content-heavy page that pushes the CTA DOWN into the footer zone,
so the page number ("7") and `joedowns.ai` render ON TOP of the CTA box. Subtle
but real; Joe-grade defect. It is the SAME family as the poster "dead void vs
overflow" tension, just at the bottom.
FIX (per-page, don't change the global rhythm): add a `.tight` modifier to the
one dense page and shrink only its gaps so the CTA clears the footer:
```
.lesson.tight > * + * { margin-top: 24px; }   /* vs the global --gap (e.g. 30px) */
.lesson.tight ul.pts  { gap: 13px; }
```
Then re-render and re-crop the bottom band to confirm the footer sits cleanly
BELOW the CTA. Every other page keeps the normal rhythm — only the offender is
tightened, so the book still reads uniform.

## Clickable links + navigable TOC (works in the PDF too)
- Make `storagemoguls.ai` (and any URL) a real `<a href>` — Chrome's PDF export
  preserves clickable external links.
- Navigable contents = TOC rows are `<a href="#l1">…` anchors and each lesson
  `<section id="l1">`. Internal `#anchor` jumps are preserved as in-PDF page
  jumps. (If Joe wants in-body cross-references like "see Lesson 7" clickable
  too, wrap those in anchors as well — by default only the TOC is wired.)

## Per-page CTA "this is the overview, depth is on the call" emphasis (Joe ask)
Joe wanted each lesson's CTA to make clear the page is just the overview and the
real depth is on the live call. Implement as a styled top line inside each CTA
(`.ov` span, brand-accent color), worded FRESHLY per page (not the same sentence
10×) so it doesn't read canned.

## Delivery
Copy the final `.pdf` AND the editable `.html` to the user's Downloads, present
the PDF with `MEDIA:<path>`. Keep the `.html` beside it so the source is never
orphaned (same rule as posters). Working files this session lived in
`~/sm_tx_work/ebook/`.

## Source-fidelity (carries the global locked-copy rule — see SKILL.md)
Every fact/figure in the ebook came from the actual transcripts / approved
beginner pieces; numbers framed as Joe's ballpark, not audited. When the brief is
"restyle / reformat / new version," the WORDING stays verbatim from the approved
copy — only the LAYOUT changes. Rewording approved copy to fit a layout was
explicitly rejected this session ("the wording should have remained the same").
