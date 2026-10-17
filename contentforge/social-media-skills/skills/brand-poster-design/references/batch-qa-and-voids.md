# Batch poster QA — the recurring defects (proven on SI Ep030, 18-poster build)

When generating a large poster batch with the absolute-position generator pattern
(each block pinned by a fixed `top:`/`bottom:`), the SAME defects recur. Engineer
against them BEFORE rendering, and vision-QA every poster for them specifically.

## ⛔ #1 defect: the DEAD VOID (hit 7+ of 18 posters in one batch)
**Symptom:** content is anchored to the top (kicker → headline → one block) and the
lower third-to-half of the 1080×1350 canvas is empty — a big bare band before the
footer. The footer is pinned to the bottom, the content sits up top, nothing bridges
the gap. Joe rejects this ("looks good but empty/plain").

**Root cause:** absolute `top:` positioning does NOT reflow or vertically center. A
block sized for the upper canvas just leaves everything below it empty.

**The fix (apply by intent, not one rote value):**
- Push the main content block DOWN toward optical center (raise its `top:`), and/or
- ENLARGE the focal element (bigger chart/cards/character/objects + more padding/gap), and/or
- Add ONE supporting block that earns its place in the gap — a one-line takeaway
  `.cap`, an italic standalone quote, a stat strip, a "how? 3 moves" list. It must
  ELABORATE the single idea, not introduce a second one.
- For multi-item layouts (steps, bars, cards): increase the inter-item `gap` and item
  `padding` so the group fills the vertical space instead of clustering at the top.
- Concrete moves that worked on Ep030: numbered-steps `gap:24→40px`; comparison
  columns `top:430→500` + `padding:34→44`; dossier FINDING box raised + an italic
  quote added below it; icon-pair cards `top:440→520` enlarged + a caption at
  `top:1010`; cup/bulb objects `230→300px` + headline/sub pulled down; pain→pleasure
  track/labels lowered + caption pulled UP to sit near them (don't pin caption to
  `bottom:` while labels float mid-page — that re-opens the void between them).

**Acceptable vs defect:** breathing room around ONE focal hero (e.g. a character with
intentional negative space, a CASE FILE dossier) is fine. A bare horizontal band
>~200px between two content blocks with nothing in it is a defect. Vision-QA each
poster: "is there a big empty band, and if so is it intentional framing or a hole?"

## ⛔ #2: highlighted headline word box overlaps neighboring lines (recurs)
A colored highlight `<span>` (e.g. green BUILT box) inside an Oswald caps headline
collides with the line above/below when `line-height` is tight. FIX = headline
`line-height ≈ 1.18–1.22` + on the span: `padding:2px 10px` and
`-webkit-box-decoration-break:clone; box-decoration-break:clone`. Always vision-QA a
highlighted headline word for a box eating the adjacent line. (Hit on Ep030 #01.)

## ⛔ #3: oversized-headline ↔ subtext collision
A big multi-line headline that wraps to one more line than budgeted runs UNDER the
next absolutely-positioned block (subtext/cards), hiding a line. FIX = drop headline
font-size so it wraps to the intended line count AND push the next block's `top:`
down to clear the REAL wrapped height. (Hit on Ep030 #05: 118→104px + subtext
`top:880→980`.) Budget the headline band for the actual wrapped line count.

## ⛔ #4: VERIFY a cutout's contents visually — never trust the filename
A file named `SI_char_solo_gesturing_T.png` was actually a DUO (two characters +
name-label boxes). Using it as a "solo" hero would have put two duo posters in the
batch (breaking variety) and the baked-in label boxes clipped oddly when scaled.
ALWAYS vision-check a character cutout (how many people? clean edges? baked-in
labels/artifacts?) before composing with it. Filenames in this asset set are not
reliable. The genuinely clean solos verified on Ep030 were
`SI_char_solo_arms_crossed_T.png` and `SI_char_solo_capped_T.png`.

## Headless-render gotcha: use ABSOLUTE paths for --screenshot
A render loop with a RELATIVE `--screenshot="$png"` silently writes nothing (Chrome
resolves it against its own cwd, not the shell's) — the loop "succeeds" but produces
0 PNGs. ALWAYS pass an absolute output path: `--screenshot="$DIR/$png"` with
`--virtual-time-budget=10000` and `file:///$DIR/$f` as input. Verify with a count +
PIL size check (`(1080,1350)`) after the loop, don't assume it wrote.

⚠️ **Even an ABSOLUTE path silently fails if it uses double-backslashes inside a
bash double-quoted string.** `--screenshot="C:\Users\somea\...\$f.png"` writes
0 bytes, exit code 0, no error — the `\U` etc. get mangled by the shell before Chrome
sees them (this git-bash/MSYS shell, June 2026; cost a wasted render pass on the
SI Ep030 Idea-1 build). FIX = use a FORWARD-SLASH absolute path in a variable and
reference it: `D="C:/Users/somea/BrandAssets/.../LinkedIn"; --screenshot="$D/$f.png"
"file:///$D/$f.html"`. Forward slashes work fine for both `--screenshot` and the
`file:///` URL on Windows Chrome. Same rule for the PIL verify glob — backslash
globs in git-bash can also no-match. Always `ls -la *.png | awk '{print $5,$9}'`
after the loop to confirm non-zero byte sizes before trusting the renders.

## Process: QA in batches of 3, fix in the GENERATOR, re-render only the fixed ones
1. Render all → vision-QA 3 at a time (most failure-prone first: characters, big
   numbers, illustrations, anything with a highlight span).
2. Fix defects in the single generator script (not the per-poster HTML), regenerate
   all HTML, re-render ONLY the changed posters.
3. Re-QA the fixed ones until clean. A batch of 18 typically needs 2–3 fix passes;
   dead voids and highlight overlaps are the usual culprits.
