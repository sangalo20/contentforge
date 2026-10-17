# Joe Downs — poster TYPES, locked styles & photo library

Distinguish two axes:
- **STYLE** = aesthetic treatment (minimalist, photo-centric, etc.) — see `style-recipes.md`.
- **TYPE / PURPOSE** = what the poster is FOR (advertise, event, inform, rally, tease). This file. Same brand spine, different job.

## LOCKED: JD uses only TWO styles (decided by Joe, June 2026)
For personal-brand consistency, Joe's posters use exactly two styles. Do NOT introduce others for JD without his say-so.
1. **Photo-centric = PRIMARY** (use most). Builds face recognition; most native to joedowns.ai. Joe's own dark studio photos blend into the `#0A0E16` bg so the photo→canvas seam disappears.
2. **Minimalist = WORKHORSE** (no good photo, or a pure stat/quote/lesson).

Considered and DE-SCOPED for JD: vintage (drops his electric-blue accent → off-brand), bold & graphic (loudest, least "measured operator", and decorative blobs clip text), hand-drawn (reads "creative coach / indie maker", softer than his operator authority), art-deco (nice but a third register he didn't pick). Hand-drawn may be an *occasional* change-up at most — never core.

**Brand spine that must persist across BOTH styles AND every type:** near-black navy `#0A0E16`; electric blue `#2E6BFF`/`#3D7BFF`; Inter headlines; JetBrains/Space Mono `[ BRACKET LABELS ]` + meta; `Joe Downs.` wordmark (blue period); footer = `The Real Reps / Weekly operator breakdown` + `joedowns.ai`.

## The 5 poster TYPES (proven recipes, all 1080×1350, all QA'd 8.5–9/10)
Working test files: `BrandAssets/Joe-Downs/LinkedIn/_type-tests/JD_type{1-5}_*.html` — copy + modify.

1. **Advertising / Promotional** (`JD_type1_advertising`) — style: photo-centric. Photo pinned right (660px), horizontal scrim `linear-gradient(90deg,#0A0E16 0%→transparent)` so text reads on the left dark side; headline + supporting line + a solid **blue CTA button** (`Subscribe free →`) with glow. For selling/driving action.
2. **Event Poster** (`JD_type2_event`) — style: photo-centric (medallion). Circular photo medallion (`border-radius:50%`, 4px blue border, radial blue glow behind), `● LIVE` kicker, two-tone title, then a **3-column WHEN / WHERE / COST** bar (flex, divider borders). Town-crier hierarchy.
3. **Informational / Educational** (`JD_type3_informational`) — style: minimalist. Built-in **CSS bar-graph infographic**: a flex row of `.col`s with `%`-height `.bar`s against an axis (`border-left`+`border-bottom`) and faint gridlines (absolutely-positioned 1px bars at 25/50/75/99%); value label above each bar, caption below. Renders a clean 1x→10x comparison with NO chart library. Reuse this pattern for any data poster.
4. **Social / Manifesto** (`JD_type4_manifesto`) — style: minimalist + shapes. Big two-tone statement headline; background = concentric `.ring`s (`border-radius:50%`, faint blue borders) + glowing `.dot`s (small circles w/ box-shadow); a `border-left` quote-bar near the footer. Tasteful depth without clutter.
5. **Movie & Art / Teaser** (`JD_type5_movie`) — style: photo-centric, cinematic. Full-bleed photo, heavy multi-stop vertical `.grade` scrim for legibility, thin letterbox `.bar`s top/bottom, Anton condensed title with silver gradient text-fill, kicker + tagline + a faux **credits block** ("STARRING THE MISTAKES SO YOU DON'T MAKE THEM"). Dramatic, still on-brand.

Creative components Joe explicitly wants used (within brand rules): real infographics/graphs, shapes (rings/blobs/medallions), grids, glowing accents, cinematic grading. Variety is good; the spine keeps it consistent.

## Photo library (Drive folder 1x8L1j-cXClikXlVRg11rZRLUonmCJtO8 → saved `BrandAssets/_source-images/img1..8.png`)
- **img8** — Joe, navy blazer, seated, dark moody studio with warm Edison-bulb glow. **Premium HERO** → advertising, movie/art. Dark bg blends into brand navy; natural left text space.
- **img1, img3** — Joe, light-blue hoodie, Shure mic, home/facility studio, warm + smiling. **Approachable** → event medallion, community/live.
- **img2** — **Peter Swain (SI co-host), NOT Joe.** "ON AIR", black tee, dark studio. Use for SI co-host content, never as a solo Joe portrait.
- img4–img7: secondary; verify subject before use.

## Photo pitfalls
- **Full-bleed photos must cover the full 1080px width** or a dark/blank strip shows at the right edge. Set the photo layer to the full canvas width (or `background-size:cover` on a full-inset element), not a sub-1080 fixed width. (Observed thin right-edge bleed on the 660px-photo ad/movie tests — cosmetic but fix before publishing.)
- Verify real pixel size with PIL and spot-check edge columns if unsure; the inset *frame border* leaves intended navy beyond it — that is NOT a defect, distinguish it from an actual photo gap.
- Confirm WHICH person is in a photo before using it (img2 trap). Vision-check the library, don't assume by filename.
