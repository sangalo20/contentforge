# Animated GIF pipeline (HTML frame-param → headless Chrome → ffmpeg)

Proven on SI Ep030 Idea 4 ("the cheat code: AI improves itself one notch a day").
Use a GIF — NOT a full Remotion MP4 — when:
- The idea is fundamentally about **change over time / compounding / progression**
  (a still can't *show* compounding; a 5–6s loop can: a bar/curve that climbs day
  by day, a counter ticking, a before→after morph).
- Joe says the feed "is looking the same everywhere" / wants motion on at least one
  piece without the weight of a video production.
- You want one motion asset that **loops natively in-feed on Instagram, LinkedIn,
  AND Facebook** (these three autoplay/loop GIFs well). X converts GIFs to video and
  is the weakest GIF surface — give X the STATIC version instead. (Every platform
  still gets a post: GIF on IG+LI+FB, static on X.)

This is lighter and faster than the Remotion pipeline (`jd-remotion-pipeline.md`),
which stays the right tool for narrated reels, audiograms, spring physics, or audio.

## Pattern: one HTML file, animation driven by a `?f=<frame>` URL param

Author a single self-contained HTML poster (same SI/JD brand CSS as a static).
A `<script>` reads `?f=` from the URL and computes ALL animated state for that one
frame — bar heights, counters, opacity, positions. No CSS @keyframes (you need a
deterministic still per frame to screenshot). Headless Chrome renders each frame as
a PNG; ffmpeg assembles them into the GIF.

Skeleton (the working SI Ep030 file
`Successful-Idiots/LinkedIn/SI_GIF_Ep030_idea4_cheatcode_compounding.html`):
```html
<script>
var f = parseInt(new URLSearchParams(location.search).get('f')||'0');
var TOTAL=90, GROW_END=66, DAYS=30;
var t = Math.min(f,GROW_END)/GROW_END;     // 0..1 progress
var e = 1 - Math.pow(1-t,2);               // ease-out
var curDay = Math.max(1, Math.round(e*DAYS));
// build bars up to curDay; newest bar brighter; compounding height = 1.085^i
// counter text = curDay; payoff text fades in AFTER GROW_END (f>=GROW_END)
document.body.setAttribute('data-ready','1');
</script>
```
Design notes that made it read well:
- **Ease-out** the progress so it decelerates into the final state (feels intentional).
- **Compounding curve** = `Math.pow(base, i)` normalized to max — a literal exponential
  bar chart is the clearest "it compounds" visual.
- Hold the payoff: after growth ends, fade in a one-line takeaway and let it sit.

## Render frames (headless Chrome, ABSOLUTE file:/// paths)

⚠️ The relative-`--screenshot` gotcha applies here too (see "Headless-render gotcha"
in `references/batch-qa-and-voids.md`): a relative output path silently writes
NOTHING. Always use absolute `file:///C:/...` for BOTH the URL and `--screenshot`,
and `rm -f` the target first so a stale PNG can't masquerade as a new render.

```bash
cd "/c/Users/somea/BrandAssets/Successful-Idiots/LinkedIn"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
D="C:/Users/somea/BrandAssets/Successful-Idiots/LinkedIn"
mkdir -p _gif_frames
for i in $(seq 0 89); do
  pad=$(printf "%03d" $i)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1080 --virtual-time-budget=4000 \
    --screenshot="$D/_gif_frames/f_$pad.png" \
    "file:///$D/SI_GIF_Ep030_idea4_cheatcode_compounding.html?f=$i" 2>/dev/null
done
```
- `--virtual-time-budget=4000` is enough once fonts are cached; bump if first frames
  show unstyled text.
- ~90 frames at the SI square 1080×1080. Square (1:1) is a safe GIF canvas for all
  three feeds; portrait 1080×1350 also fine.
- Rendering ~90 frames is a bounded foreground batch (`timeout=300`), not background.

## Assemble with ffmpeg (palettegen/paletteuse = crisp brand colors)

A naive `ffmpeg ... out.gif` produces banded, muddy color. ALWAYS do the two-pass
palette method so SI yellow/green/navy stay clean:
```bash
cd _gif_frames
# hold the final frame ~1.2s (22 dupes at 18fps) so the payoff lands before the loop
for n in $(seq 90 111); do cp f_089.png f_$(printf "%03d" $n).png; done
ffmpeg -y -framerate 18 -i f_%03d.png \
  -vf "fps=18,scale=1080:-1:flags=lanczos,palettegen=stats_mode=full" sipal.png
ffmpeg -y -framerate 18 -i f_%03d.png -i sipal.png \
  -lavfi "fps=18,scale=1080:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a" \
  "$D/SI_GIF_Ep030_idea4_cheatcode_compounding.gif"
```
- **18fps** is plenty for chart/counter motion and keeps the GIF light (~360KB for
  6.2s at 1080²). Bump to 24 only for fast motion.
- **Hold the final frame** (dupe the last PNG ~1–1.5s) so viewers read the payoff
  before the loop restarts — without it the resolution flashes by.
- `dither=sierra2_4a` + `stats_mode=full` palette = clean flat brand fills.

## QA the GIF itself, not just frames

Verify with Pillow (clear PYTHONPATH so the good Pillow loads — see PIL pitfall in
SKILL.md), then vision-QA the actual decoded frames:
```bash
PYTHONPATH= /c/Python313/python.exe -c "
from PIL import Image
im=Image.open('out.gif'); n=im.n_frames
print('size',im.size,'frames',n,'animated',im.is_animated)
d=0
for i in range(n): im.seek(i); d+=im.info.get('duration',0)
print('duration_ms',d)
for i in [0, n//2, n-2]:
    im.seek(i); im.convert('RGB').save(f'_gif_frames/check_{i:03d}.png')
"
```
Then load `check_*.png` into vision: confirm it animates start→end (near-empty →
full), colors crisp (no heavy banding), and text correct.

## Pitfalls hit on the first build
- **`\u2014` in STATIC HTML text renders literally** ("\u2014" not "—"). Escapes only
  interpret inside JS string literals. Put real `—` characters in static HTML;
  `\u2014` is fine only inside a JS `'...'` string.
- **A moving element pinned by a computed `top:` can fly off-canvas** when its anchor
  (e.g. the newest, tallest bar) reaches the top — clamp it (`Math.max(MIN, top)`).
- **A growing chart collides with a counter/label placed where the bars end up.**
  Put the day/stat counter in the corner the bars NEVER reach (for a left→right
  rising chart, that's TOP-LEFT). Joe caught the tall final bar crossing a
  top-right counter — moving it top-left fixed it.
- Same dead-void / overlap QA as static posters applies to every frame.

## Naming + cleanup
- File the GIF (and keep its source `.html` beside it) under the BrandAssets
  convention: `SI_GIF_Ep030_idea4_<slug>.gif`. The GIF is ONE Content Pieces row
  per platform (Type can be `Reel`/`Video` or note "GIF" in the body — there's no
  dedicated GIF Type option in the DB).
- The `_gif_frames/` scratch dir + `sipal.png` are disposable; the GIF + HTML are
  the deliverables. (Deleting scratch is optional — don't block on a destructive rm
  if it needs confirmation; the scratch is harmless.)

*Source: SI Ep030 Idea 4 build, June 2026. Companion: jd-remotion-pipeline.md
(use Remotion instead for narrated/audio/long reels), batch-qa-and-voids.md
(render gotcha + void/overlap QA).*
