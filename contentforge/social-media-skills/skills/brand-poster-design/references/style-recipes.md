# Poster style recipes (CSS techniques)

## ⚠️ READ FIRST — apply design principles by INTENT, not literally (Joe, June 2026)

Design principles are reasoning tools, not literal placement instructions. The recurring failure this session was pattern-matching the *label* onto the canvas instead of serving the *purpose*:
- **"The eye reads left-to-right"** does NOT mean "put one element hard-left and another hard-right." It means: when related elements sit together, ORDER and align them along the reading path. Taken literally it scatters things to opposite edges and FIGHTS the alignment principle (disconnected = harder to scan, not easier).
- **"Balance"** does NOT mean "equal weight pinned to opposite corners." It means the composition feels stable as a whole — often achieved by grouping + alignment + intentional negative space.
- **"Negative space"** is PART of the design, not a defect to eliminate. Don't oversize a hero to "fill the void" — that breaks hierarchy. Frame the composition with space.

ALL the principles point at ONE outcome: **make the design effortless to read and visually coherent.** If two principles seem to conflict, you've misread at least one — they never actually fight, because they share that goal. So before placing anything, ask *"what is this principle trying to ACHIEVE here?"* and apply judgment. Pick a real composition (centered-stack, diagonal flow, grid) and execute its intent — don't nudge elements around by feel or obey vocabulary literally.

---

## Poster style recipes

Proven against the JD brand, June 2026 (6-style test on identical copy). Each holds brand voice + copy constant and changes only the aesthetic. Canvas 1080×1350. Fonts via Google Fonts `<link>`. Always keep ONE focal point + generous whitespace; never overcrowd.

## 1. Minimalist (corporate / high-end)
- Light bg (`#F4F5F7`), brand ink + ONE accent. Huge top/side padding (~120px). Headline 90–100px, `letter-spacing:-2.5px`.
- Inter family; mono only for tiny meta labels. Thin `1px` divider rule above footer. No shapes, no texture.
- Polish lever: white space is the design. Resist adding anything.

## 2. Vintage / Retro
- Muted/cream bg (`#E8DFC8`), sepia ink (`#2B2218`), one period accent (rust `#9A3B2E`).
- **Grain** via inline SVG turbulence at low opacity:
  `background-image:url("data:image/svg+xml;utf8,<svg ...><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")` at `opacity:.10`.
- **Vignette**: `radial-gradient(circle at 50% 40%, transparent 55%, rgba(60,45,28,0.28))`.
- Double-rule border (`border:3px double`), centered Oswald caps headline + italic serif (Bitter) sub. NOTE: usually drops the brand's signature accent for the era → flag as least-on-brand.

## 3. Bold & Graphic (loud / youth / events)
- Saturated brand color as the FULL bg, secondary high-contrast (yellow `#FFE600`) + black.
- Absolute-positioned `border-radius:50%` blobs + a rotated stripe. Archivo Black headline, `-webkit-text-stroke:3px` outline.
- ⚠️ PITFALL: blobs/stripes clip footer/edge text. Put text containers at `z-index:3` and KEEP decorative shapes out of the bottom band. QA the footer.

## 4. Photo-Centric
- Full-bleed photo (`background-size:cover; background-position:center top`). Joe's LinkedIn headshot URL works as a hero (loads fine in headless Chrome).
- **Legibility scrim** bottom-up gradient: `linear-gradient(180deg, rgba(10,14,22,.30) 0%, rgba(10,14,22,.20) 40%, rgba(10,14,22,.85) 72%, <bg> 100%)`.
- Text sits in the bottom third over the scrim; `text-shadow:0 2px 30px rgba(0,0,0,.5)` on headline. Most "human" option.

## 5. Hand-Drawn / Illustrated
- Off-white bg, **dot grid** `radial-gradient(#cfd6e0 1.6px,transparent 1.6px); background-size:38px 38px`.
- Rounded "hand" border with offset shadow `box-shadow:10px 10px 0 rgba(...,0.12)`. Caveat (script) headline + Patrick Hand body.
- Hand-drawn circle around key words: absolutely-position a `border:4px solid <accent>` with an irregular `border-radius:48% 52% 50% 50%/60% 55% 45% 40%` + slight `rotate(-3deg)`. Dashed footer divider. Max ONE meaningful emoji (Joe's rule).
- Watch lower-half emptiness — tighten or add a small annotation.

## 6. Art Deco (geometric luxury)
- Gold (`#C7A55A`) on dark; keep the brand's dark navy so it stays subtly on-brand. Cinzel caps headline (symmetric, centered), Poiret One body.
- **Ray motif**: `conic-gradient(from 180deg at 50% 0, rgba(199,165,90,.10) 0 6deg, transparent 6deg 18deg, ...)`. Double gold frame (two stacked `border` insets). Diamond `◆◆◆` + bar-with-diamond-ends divider (`::before/::after` content:"◆").
- Rephrase copy slightly for period elegance (e.g. "tenfold" vs "10x") while keeping meaning.

## 5b. Hand-Drawn adapted to a DARK brand spine (preferred for JD)
Joe chose handwritten as the infographic treatment but on his DARK brand, NOT cream paper. Recipe to keep a casual style on-brand:
- Dark brand bg (`#0A0E16`), light ink (`#EAF0FA`); dot grid in the BRAND accent at low alpha: `radial-gradient(rgba(46,107,255,.10) 1.5px,transparent 1.5px); background-size:42px`.
- Caveat/Patrick Hand fonts, but the headline accent word stays brand electric-blue; use ONE warm secondary (orange `#F5A623`) ONLY for hand-drawn annotations/arrows/underlines so the brand-blue stays dominant.
- Hand "underline" on key words: `border-bottom:6px solid <warm>; border-radius:50%; rotate(-1.5deg)`.
- General rule proven here: a casual/illustrated style can be made brand-native by swapping its default light palette for the brand's dark palette + accent, keeping only the hand-drawn *forms* (script font, sketch borders, arrows). Don't import the cream-paper look onto a dark brand.

## Infographics in pure HTML/CSS (no chart lib)
A real comparison bar chart, two bars: flex row, `align-items:flex-end`, fixed `height`, left `border-left` + bottom `border-bottom` as axes, gridlines = absolutely-positioned `1px` rows. Bars = divs with `%` height (e.g. 12% vs 96–100%), value label absolutely-positioned `top:-Npx`. Hand-drawn variant: stripe-fill via `repeating-linear-gradient(45deg,...)` + sketch arrow (unicode `⤴`/`↗`) + rotated annotation. Keep the data honest and the axis labeled.

## FIXING "looks good but empty / plain" (user's #1 layout complaint)
A clean minimalist/infographic poster with one chart can leave a big dead band between the focal element and the footer. The fix is NOT to enlarge the headline or scatter shapes (that overcrowds) — it is to add ONE structured supporting block in the dead space that EARNS its place:
- A short **"how? three moves:"** numbered list (3 items, parallel phrasing) — adds substance + reinforces Joe's operator voice.
- Or a labelled stat strip / a one-line takeaway in a quote-bar.
Technique: wrap content as `[spacer] [supporting block] [spacer] [kicker] [footer]` (two flex spacers) so the new block sits centered in the gap and the footer stays pinned. Shrink the chart slightly (e.g. height 430→360px) to make room. Re-QA: the page should read full top-to-bottom with no >1 screen-height of empty navy. Still obey "one dominant idea" — the supporting block elaborates the idea, it doesn't introduce a second one.

## Photo-centric — TWO proven layouts (give Joe options)
1. **Photo-on-side** (ad/promo): photo pinned right covering FULL 1080 width, side+bottom scrim, text on the left. Strong for CTAs.
2. **Top-bleed** (editorial): photo fills the top ~63%, fades into a dark headline panel at the bottom via `linear-gradient(180deg, ... ,<bg> 100%)`, blue accent bar marks the fold. More magazine/editorial. Distinct enough from #1 to offer both as variations.
Both: the photo layer MUST span the full 1080 width (see SKILL pitfall on right-edge strip). Source photo ~1024px → use `background-size:cover` on a full-1080 element, never a fixed sub-1080 width.

## Process
Render all variants to `BrandAssets/{Brand}/{Platform}/_style-tests/` (or `_type-tests/` for poster-purpose tests), QA each with browser_vision, present a comparison table: style/type · polish (1-10) · on-brand? · notes. Recommend the 2-3 most brand-native; call out off-brand outliers honestly. NOTE: the live browser preview is often wider than the 1080 canvas, showing a phantom black strip on the right — ALWAYS confirm the actual edge by sampling the saved PNG's pixels (PIL) before reporting a "right-edge gap" defect.
