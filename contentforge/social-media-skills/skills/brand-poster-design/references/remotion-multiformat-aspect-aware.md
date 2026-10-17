# Render ONE Remotion video in ALL social aspect ratios (9:16 / 16:9 / 1:1)

Proven June 2026 on the SM 001 cinematic. When Joe says "structure it for all socials / make it the right
size for each platform," he means RENDER THE VIDEO ITSELF in each platform's dimensions — NOT schedule it.
(He corrected exactly this: "I meant create the video in formats for the social, not to metricool.") Don't
jump to Metricool; produce the format variants.

## The platform → dimension map
- **9:16 vertical 1080×1920** → Instagram Reel, Facebook Reel, **YouTube Short**, TikTok, IG/FB Stories
- **16:9 landscape 1920×1080** → **YouTube full video**, LinkedIn feed, Facebook landscape feed
- **1:1 square 1080×1080** → Instagram feed post, Facebook square feed
One 9:16 + one 16:9 + one 1:1 covers every platform. (YouTube wants BOTH: 16:9 as the full video, 9:16 as a Short.)

## Make the composition ASPECT-AWARE (the core technique)
A composition hand-built for one canvas has hardcoded `W`/`H` constants and absolutely-positioned / SVG-sized
elements pinned to that size — rendering it at a different `width`/`height` in `Root.tsx` will clip or squish it.
Fix = make the SAME component reflow by reading live dims:
- Inside any helper that used module-level `W`/`H`/`CX`/`CY` (background grid, particle system, network-map SVG,
  any centered absolute element), pull `const { width: W, height: H } = useVideoConfig();` and derive
  `CX=W/2, CY=H/2` locally. Compute grid cols/rows from W/H (`cols = Math.max(6, round(W/120))`,
  `rows = ceil((H+240)/rh)`) instead of fixed counts.
- Center absolute elements with `left:"50%"; top:"50%"; marginLeft:-w/2; marginTop:-h/2` (or flexbox) instead of
  `left: CX-18` math, so they sit dead-center at any ratio.
- Scene CONTENT that's already flexbox-centered (the usual case) adapts for free — only the W/H-pinned helpers
  need touching. This is a small, surgical refactor, not a rewrite.

## Register the variants in Root.tsx (same component, 3 sizes)
```tsx
<Composition id="X"        component={Comp} width={1080} height={1920} ... />  // 9:16
<Composition id="XWide"    component={Comp} width={1920} height={1080} ... />  // 16:9
<Composition id="XSquare"  component={Comp} width={1080} height={1080} ... />  // 1:1
```
Same `durationInFrames`, `fps`, `defaultProps`. One component, three IDs.

## QA the two NEW ratios before rendering full
Render a content-heavy frame (a stat/counter scene) AND the CTA finale at each new ratio with `remotion still`,
vision-check that everything is centered and nothing is clipped/overflowing. The 9:16 was already verified; the
landscape and square are the ones at risk. (When done right they reflow cleanly — verified: the "20 FACILITIES"
network and the storagemoguls.ai/JOIN FREE finale both recentered perfectly in 16:9 and 1:1.)

## Render + deliver
- `npx remotion render XWide "<...>_16x9_youtube.mp4"` and `XSquare "<...>_1x1_square.mp4"`.
- ffprobe each: confirm width/height AND an audio stream (`codec_type=audio`) + matching duration.
- Copy to Downloads with PLATFORM-OBVIOUS names so Joe knows which is which, e.g.
  `SM_001_VERTICAL_9x16_reels-tiktok-short.mp4`, `SM_001_LANDSCAPE_16x9_youtube.mp4`, `SM_001_SQUARE_1x1_feed.mp4`,
  and hand him a one-line per-platform cheat-sheet (which file → which platform).

## Delivery / sharing
Joe can't open `MEDIA:C:\...` links reliably from chat ("every time I click the link it says no such path").
Deliver via (a) a copy in his Downloads folder he opens in Explorer, and/or (b) a Cloudinary upload for a
clickable web URL — but DON'T upload to Cloudinary on every iteration; only on a final / when he needs a link
(he said: "don't upload to cloudinary every time until we get the final output"). Local Downloads copy is the
default during iteration.

*Source: SM 001 multi-format, June 2026. Companion: remotion-threejs-3d.md, remotion-podcast-audiogram.md, jd-remotion-pipeline.md (the JD 1:1/9:16/16:9 reflow note).*
