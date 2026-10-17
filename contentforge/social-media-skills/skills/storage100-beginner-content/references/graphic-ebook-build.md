# Graphic Ebook Build Recipe (KB content → designed illustrated PDF)

Proven June 2026 building "Storage 100 — The Beginner's Field Guide" (13-page PDF
from the 10 beginner pieces), then a "Picture Guide" variant. This is the repeatable recipe.

## Deliverable
A self-contained HTML file rendered to a print-ready PDF, plus the HTML kept so it
stays re-editable. Delivered to `C:\Users\somea\Downloads\`, surfaced via `MEDIA:<path>`.

## Page model (the structural trick)
Model the ebook as fixed-size PAGES, one HTML `<section class="page">` each:
1. Cover (brandmark, title, subtitle, 2–3 stat blocks, a custom SVG illustration).
2. "How to read this" + a 3-phase map + a contents list.
3. One designed page PER lesson (see per-page anatomy).
4. Closing / register-CTA page.

Make each section print as exactly one page with this CSS:
```css
:root{ --page-w:820px; --page-h:1160px; }   /* ~ ebook portrait, A4-ish ratio */
.page{ width:var(--page-w); min-height:var(--page-h); padding:62px 64px 70px;
       position:relative; overflow:hidden; }
@media print{
  @page{ size:820px 1160px; margin:0 }
  html,body{ background:#fff }
  .page{ border:none; box-shadow:none; min-height:var(--page-h); height:var(--page-h);
         page-break-after:always; break-after:page; }
}
```
Screen view stacks the pages with gaps/borders (nice to preview); print view drops
the chrome and paginates. A subtle CSS grid texture masked to a corner +
`radial-gradient` glow gives depth without slop.

## Per-lesson page anatomy
- `[ BRACKET LABEL ]` eyebrow (JetBrains Mono) + big Fraunces chapter number.
- Fraunces serif `<h2>` heading (formal topic title).
- One short lead paragraph (`b` accents in electric blue).
- An `h-eyebrow` mini-header, then **point-form takeaways** as `ul.pts` with a
  rotated-square bullet (`::before`, blue, soft glow). Bold the lead phrase, mute the rest.
- A **definitions callout** (`.define`, amber left border) — a `<dl>` of the term +
  plain-English meaning, pulled from that episode's Key Terms glossary.
- A **custom SVG figure** built from the content (no stock imagery):
  - occupancy bars: two `.bar` divs, the winning one blue + glow, the other muted;
    dollar caption absolutely positioned ABOVE each bar.
  - flow diagram: 3 rounded `<rect>` + arrow `<marker>`, last box highlighted.
  - capital stack: colored swatch rows + a total row.
  - facility types / involvement spectrum: simple labeled SVG shapes.
- The warm **CTA** card (`.cta`, blue-tinted) — one invite, `storagemoguls.ai`.
- `joedowns.ai` footer + page number, absolutely positioned bottom-left/right.

## ⚠️ WORDING FIDELITY — keep the APPROVED copy verbatim (Joe corrected this, June 2026)
When converting already-approved pieces into a designed layout, the #1 mistake is
**rewording/compressing the body text to fit the page design.** Joe caught this directly:
"I like the styling very much, but the wording should have remained the same."

- The DESIGN may change freely (styling, illustrations, page model, picture-book vs editorial).
  The COPY must stay the **exact approved wording** from the source pieces
  (`~/sm_tx_work/kb/beginner_series_01-10.txt`, or whatever the approved artifact is).
- Do NOT paraphrase, tighten, or "make it picture-book-y." Re-read the approved text and
  paste it in. If a designed layout truly can't hold the full wording, change the LAYOUT
  (more pages, smaller figure, looser type) — never cut Joe's words to make it fit.
- Restore method that worked: read the approved source file fresh, then rebuild each page's
  body straight from it. Verify a few sentences match verbatim before rendering.
- Corollary: this is the same fabrication-aversion that drives the truth gate — Joe trusts
  the copy because it was vetted; silently rewriting it breaks that trust even if the new
  wording is "fine."

## ⚠️ EVEN SPACING — don't let elastic flex warp the vertical rhythm (fixed June 2026)
Joe: "the spacing between elements in some places is off." Root cause was a
`.scene{ flex:1 }` (elastic) illustration band that stretched to fill leftover height,
creating a huge gap on text-light pages and squeezing blocks on text-heavy ones.

- **Fix:** give the page a SINGLE consistent gap and apply it uniformly with a sibling
  selector, instead of per-element ad-hoc margins or elastic flex:
  ```css
  :root{ --gap:30px; }
  .lesson > * + *{ margin-top:var(--gap); }   /* even rhythm between every block */
  .scene{ /* fixed, contained band — NOT flex:1 */ padding:22px; border-radius:20px; }
  .cta{ margin-top:auto; }   /* the ONLY auto-margin: pins CTA to a consistent bottom slot */
  ```
- So the recipe is: one shared `--gap` between all blocks + `margin-top:auto` on the CTA only.
  Every page then has identical spacing top-to-bottom and the CTA lands in the same place,
  which reads as deliberate. Avoid `flex:1` on any inner band and avoid bespoke per-element margins.
- The leftover space above a bottom-pinned CTA on a short page is fine (deliberate breathing
  room, CTA in a consistent spot). Offer to let content fill it only if Joe prefers.

## Picture-book ("children's book hybrid") variant
Joe asked for a warmer, airier picture-book feel as an alternative to the dark editorial look:
- Light **cream/paper** background (`#FFFDF8`), navy ink, big rounded shapes, generous whitespace.
- **Color-coded lessons** — each lesson gets its own colored number badge (blue→green→amber→
  coral→navy) like chapters in a kids' book.
- **Emoji-style icon bullets** (🔑 💰 ⏳ 🚗 🛟) render fine in headless Chrome PDF.
- Bigger, simpler SVG illustrations; soft dotted-paper texture.
- Still grown-up content + the same warm CTAs + the same truth/wording gates. Fraunces stays
  for headlines; Nunito (rounded, friendly) works well for body in this variant.

## Brand spine (Joe personal / JD — editorial variant)
navy `#0A0E16` / panels `#121A2B`–`#16203A` / electric blue `#2E6BFF` (+ `#5B8Cff`) /
amber `#F5B33C` accents / ink `#EAF0FF` / muted `#9FB0D0`. Fonts: Fraunces (headlines),
Inter (body), JetBrains Mono (labels). Footer `joedowns.ai`. For Storage Moguls brand
instead: serif/editorial + navy/blue + `storagemoguls.ai` — ask Joe which brand.

## Render + QA commands (Windows, git-bash)
Chrome is at `/c/Program Files/Google/Chrome/Application/chrome.exe`.
```bash
ABS="C:/Users/somea/.../ebook/<name>.html"
# 1) HTML -> PDF (one page per .page section via the print CSS above)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="C:/.../<name>.pdf" "file:///$ABS"
# 2) Rasterize specific pages for visual QA (poppler's pdftoppm is present)
pdftoppm -png -r 90 -f 10 -l 11 "<name>.pdf" "qa_pg"   # pages 10-11 -> qa_pg-10.png ...
```
Then load the PNGs with vision and check: figures not clipped/overflowing, captions
not cut off at the top, CTA box + footer inside the frame. ALWAYS QA the text-HEAVIEST
pages too (the 5-type / 4-bullet lessons) — restoring full wording can push a page to overflow.

## Pitfalls (hit + fixed across sessions)
- **Reworded copy to fit the layout** — see WORDING FIDELITY above. Keep approved text verbatim.
- **Off/uneven spacing from elastic flex** — see EVEN SPACING above. One `--gap` + CTA `margin-top:auto`.
- **Big focal numbers in a flex row overflow/clip.** Use `white-space:nowrap`, step the
  font-size down, position dollar captions with `position:absolute; top:-26px`. Re-screenshot until clear.
- **Stray SVG attribute typos** (e.g. `fill="#5A6party"`) render as black/wrong — they don't error,
  so eyeball the SVG fills, and the vision-QA catches the visual result.
- **`--screenshot` only captures the viewport (the cover).** To QA inner pages, render the
  PDF first, then `pdftoppm` the page you want — don't rely on a full-page screenshot.
- **`pymupdf`/`fitz` may be absent** — `pdftoppm` (poppler, via winget) and PIL were available; prefer those.
- Empty space at the bottom of text-light pages is fine/normal for an ebook — don't pad with filler.

## Clickable links + navigable Table of Contents (Joe asked for this, June 2026)
Joe: "Make the links clickable and the Table of Contents navigable as well."
- **Navigable TOC:** give each lesson `<section>` an id (`id="l1"`…`id="l10"`) and make each
  contents row an `<a class="row" href="#l1">…`. Internal `#anchor` jumps are preserved in the
  Chrome-rendered PDF, so the TOC works in BOTH the HTML and the PDF. Add a hover style
  (`.toc a.row:hover{background:…;padding-left:12px}`) for the HTML.
- **Clickable URLs:** wrap every `storagemoguls.ai` (and any real URL) in
  `<a href="https://storagemoguls.ai" target="_blank" rel="noopener">…</a>`, styled to keep the
  visual (amber/bold). Do it everywhere it appears — CTAs, cover, back page (was 12 spots here).
- Fast way to apply across a finished file: a small Python pass that (a) `.replace`s the known
  `<b>storagemoguls.ai</b>` markup with the anchor, and (b) regexes each lesson `<section>` to
  inject `id="lN"` keyed off its badge number. (Internal cross-references like "see Lesson 7" can
  also be made into `#lN` jumps if Joe wants — offer it.)

## CTA pattern: "this is the overview — the depth is in the call" (Joe asked, June 2026)
Joe wanted every section's CTA to emphasize that the guide is only the overview and the real,
meaty teaching happens on the live call ("Not those exact words but something close").
- Add a short, styled emphasis LINE on top of the existing invite inside each `.cta` (e.g. a
  light-blue `.ov` span, `display:block`), THEN the normal warm invite below it.
- **Vary the wording per lesson** so it never reads canned 10× — tie it to that lesson's topic:
  "This is the overview of the five. We go deep on each one, live, on the call." /
  "This is the headline number. We build out the full money picture on the call." /
  "This page is the map. We actually read live deals together on the call."
- Keep it ONE added line; the invite + single CTA rule still holds. This pairs naturally with the
  `joe-cta` close (warm, but it still closes).

## Updating the REVIEW DOC in place after a restructure (Joe asks for this)
After the designed ebook changes, Joe also wants the **text/copy review Google Doc** updated to
mirror it ("put v1 in the review doc, update it with the new structure and content"). The review
doc here is **"Storage 100 — Beginner ... (Pieces/Lessons)"**, id `1k7QH9Ro2SnB0whiItv3AUmoM7Ekl-egYjH0S59mzTP0`,
in the `Storage100 Knowledge Base` Drive folder. Keep the SAME doc (same id/URL) — don't spin a new one.
- **Mirror the EBOOK copy verbatim.** Build the doc body straight from the v1 HTML wording (same
  fidelity rule), as a plain numbered `#NN — Title` outline with point-form bullets + the CTA line
  per lesson, plus a short top "STRUCTURE NOTE" of what changed and a "NOTES FOR JOE" footer.
- **The google_api.py CLI has only `docs {get,create,append}` — NO in-place replace/clear verb.**
  To overwrite an existing doc's body while preserving its id/URL, drive the Docs API directly via the
  module (don't create a new doc):
  ```python
  import importlib.util
  spec=importlib.util.spec_from_file_location("g", GP); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
  docs=m.build_service('docs','v1'); DID='...'
  doc=docs.documents().get(documentId=DID).execute()
  end=doc['body']['content'][-1].get('endIndex',1)
  reqs=[]
  if end>2: reqs.append({'deleteContentRange':{'range':{'startIndex':1,'endIndex':end-1}}})  # can't delete final newline
  reqs.append({'insertText':{'location':{'index':1},'text':open('body.txt',encoding='utf-8').read()}})
  docs.documents().batchUpdate(documentId=DID, body={'requests':reqs}).execute()
  ```
- **Doc TITLE is separate from body** — `deleteContentRange`+`insertText` won't change the file name.
  If the title is now stale ("Pieces 1–10" after going to 12 lessons), rename via Drive:
  `m.build_service('drive','v3').files().update(fileId=DID, body={'name': new_title}).execute()`.
- **Gate-check trap:** a naive `grep` for em-dashes / "DM me" / "Passive Income Is a Myth" will FALSE-
  POSITIVE on your own STRUCTURE-NOTE/NOTES-FOR-JOE meta text (which quotes the rules). Check the
  LESSON BODIES only: `awk '/^#01 —/{on=1}/^NOTES FOR JOE/{on=0}on'` then grep that slice. The `#NN —`
  header dashes are allowed visual separators (same as the original doc), not body em-dashes.

## Content fidelity
Same truth gate as the rest of this skill: every fact/number/claim must trace to Joe's
transcript (verify against `~/sm_tx_work/downloads/<fileID>.txt`, not your notes); hedge
his ballpark figures ("around"), never put residential-landlord pains in his mouth.

## ⚠️ COMPLETE COVERAGE — expand the count, never drop a topic (Joe corrected this, June 2026)
When you RESTRUCTURE an existing ebook (e.g. adding the goal/vehicle openers to the front),
do NOT silently squeeze the lesson list back to its old round number by cutting topics. Joe
caught exactly this: v1 had quietly dropped two original lessons ("Passive Income"/run-invest-
hybrid AND the "Put It Together" closer) to stay at 10 after adding 2 new openers.
- **Add lessons to fit ALL topics.** v1 went to 12 (10 originals + 2 new openers), back page
  page-count and "Twelve short lessons" subtitle updated to match.
- Before delivering any restructure, **diff the new lesson titles against the master list**
  (`~/sm_tx_work/kb/beginner_series_01-10.txt`) and confirm every original topic still has a home.
  `grep -oE '<h2 class="les">[^<]*' file.html` to list the current lessons fast.
- Renumber everything consistently: badge numbers, `Lesson N` tags, `id="lN"`, TOC rows + anchors,
  per-page `.pagedot` numbers, and the summary bullets on the closing page.

## Parallel versions — keep them consistent
Joe keeps more than one cut of the same ebook as DISTINCT deliverables, both valid:
- **v1** = goal-first roadmap (vehicle idea as Lessons 1–2, 12 lessons). File `Storage100_Picture_Guide.html`.
- **v2** = original 10-lesson order with the vehicle idea dropped into a single slot (#5). File
  `Storage100_Picture_Guide_v2_swap5.html`.
When you change a SHARED lesson in one version (e.g. the "How to Manage It" reframe), OFFER to apply
the same change to the other version so they don't drift. Don't assume; ask which/both.

### ⚠️ WHICH VERSION did Joe pick? Resolve to the FILE, echo the FIRST LESSON, confirm (Joe corrected this, July 2026)
There are THREE ebook files on disk (Field_Guide = original 10-lesson; Picture_Guide = 12-lesson
goal-first; Picture_Guide_v2_swap5 = alt cut). When Joe says "we picked X" / "we're using the first
version" and then builds downstream work (poster prompts, a series, captions) from it, the #1 failure
is **grabbing the wrong version's lesson content.** Joe called this out hard: "why are you doing your
own thing?"
- His shorthand ("the first version", "the one we picked", a label he half-remembers) is often
  AMBIGUOUS against the three real filenames. Do NOT quote your OWN prior label back as if it settles
  it, and do NOT silently pull whichever version you last had in context.
- **Resolve his words to a specific FILE + its actual FIRST LESSON title, state that mapping back in
  one line, and get a yes before writing any content from it.** E.g.: "First version = original
  10-lesson Field Guide, first post = 'What Self-Storage Actually Is' — building Poster 1 from that,
  correct?" The first-lesson title is the fastest disambiguator because the three versions open
  DIFFERENTLY (Field_Guide → "What Self-Storage Actually Is"; Picture_Guide → "What You're Really
  Investing In").
- "First version" most naturally means the ORIGINAL (Field_Guide), not the newest/goal-first one —
  don't assume the most recent file is meant just because it's freshest in your context.
- This is the same one-word-answer discipline in USER.md: make the mapping call, brief it in one line,
  then wait for the explicit go — don't over-explain and don't run ahead.

## Per-page overflow fix — `.tight` modifier for dense pages
The bottom-pinned CTA (`margin-top:auto`) can collide with the page-number/footer when ONE page is
content-heavy (e.g. spectrum diagram + intro + 3 bullets + closing line + 2-line CTA). Fix it on
that page ONLY, without disturbing the others' even rhythm:
```css
.lesson.tight > * + *{ margin-top:24px; }   /* slightly tighter than the global --gap (30px) */
.lesson.tight ul.pts{ gap:13px; }
```
Add `class="page lesson tight"` to just the dense section. Then **crop-and-inspect the bottom ~22%**
of that page to confirm the footer/page-number sits cleanly BELOW the CTA box (no overlap):
```bash
python -c "from PIL import Image; im=Image.open('qa.png'); w,h=im.size; im.crop((0,int(h*0.78),w,h)).save('qa_bottom.png')"
```

## Encouraging reframes — flip deflating angles to investment-forward (Joe, June 2026)
Joe asked to turn the "Passive Income Is a Myth" page into something ENCOURAGING that nudges toward
the investment: retitled **"How to Manage It: Run It, Invest, or Hybrid."** Keep the same three-path
content but lead with empowerment and tie back to the vehicle/time-back theme ("you don't have to run
it full-time... owning the vehicle doesn't have to own your life... you choose how hands-on"). Frame
each option as a freedom (run it = learn it inside out; invest = most hands-off, earn while a pro runs
it; hybrid = buy back your hours), close with "no wrong answer, start one way and shift later." General
rule: when a lesson reads as myth-busting / cautionary, check whether Joe wants it reframed positively —
the personal-brand voice is the encouraging teacher inviting people IN, not warning them off.
