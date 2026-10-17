# JD Remotion Pipeline (PRIMARY motion-graphics engine)

Remotion = React-based programmatic video. Chosen over the Chrome-screenshot loop for speed, props-reuse, spring physics, and a live preview Studio. Proven June 2026: rebuilt the handwritten 10x infographic as `JDInfographic`, rendered 210 frames (1080×1350, 7s, H.264, ~924KB) in well under 2 min (most of that the one-time Chromium download).

## Project location
`C:\Users\somea\BrandAssets\_remotion\` — reuse it; do NOT re-scaffold per video. Add new compositions, render, done.

## Environment
- Node 18+ (session had v24.8, npm 11) — fine. `npm install` pulls ~186 pkgs incl. a bundled Chromium (~50s).
- Run npm/render commands from inside `_remotion/`. First render downloads Chromium (one-time); subsequent renders are fast.
- `npm install` and the FIRST `npx remotion render` are slow → run BACKGROUND (`terminal background=true, notify_on_complete=true`). Later renders can be foreground.

## File layout (all present, copy-as-template for new pieces)
- `package.json` — deps pinned to one Remotion version across `remotion`, `@remotion/cli`, `@remotion/google-fonts` (MUST match or install errors). React 19.
- `remotion.config.ts` — `setConcurrency(null)` (= all cores, the speed win), jpeg frames, overwrite on.
- `tsconfig.json` — jsx: react-jsx, moduleResolution: bundler.
- `src/index.ts` — `registerRoot(RemotionRoot)`.
- `src/Root.tsx` — registers each `<Composition>` (id, component, durationInFrames, fps 30, 1080×1350, zod `schema`, `defaultProps`).
- `src/JDInfographic.tsx` — the composition. **This is the reusable template** — props-driven so new infographics = new `defaultProps`, no code change.

## Brand spine in Remotion (must match jd-design-system.md)
Same constants as the static posters: NAVY `#0A0E16`, BLUE `#2E6BFF`/`#3D7BFF`/`#6FA0FF`, AMBER `#F5A623` (handwritten annotations only), INK `#EAF0FA`, MUTE `#7d8aa3`. Dotted graph-paper bg, inset frame, `[ THE REAL REPS ]` label, footer The Real Reps / joedowns.ai.

## Fonts — use @remotion/google-fonts (NOT a <link>)
```ts
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadHand } from "@remotion/google-fonts/PatrickHand";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
const { fontFamily: CAVEAT } = loadCaveat();
const { fontFamily: HAND } = loadHand();
const { fontFamily: MONO } = loadMono();
```
Package name is the PascalCase font: `PatrickHand`, `JetBrainsMono`. Use the RETURNED `fontFamily` string (robust) rather than hardcoding `'Caveat'`. This guarantees fonts are loaded before render (no half-rendered glyphs — the chronic failure of the screenshot method).

## Frame-driven animation (the intuitive win)
Timing is DATA, not hand-tuned CSS delays. Inside the component:
- `const frame = useCurrentFrame(); const { fps } = useVideoConfig();`
- Entrances: `spring({ frame: frame - delay, fps, config: { damping: 200 } })` → map to opacity + translateY (fadeUp helper).
- Bar growth: `spring(...)` → `transform: scaleY(<spring>)`, `transformOrigin: bottom`.
- Pop (numbers/circles): spring with `damping:10, stiffness:160`, scale overshoot via `interpolate(s,[0,0.7,1],[0.3,1.18,1])`.
- Underline draw: `interpolate(frame,[28,44],[0,1],{easing:Easing.out(Easing.cubic)})` → `scaleX`.
- Stagger lists by index: `frame - (base + i*8)`.
- Cadence: ~4.8s reveal + hold to end of `durationInFrames` so the final frame == the complete static poster (good thumbnail/fallback).
Keep it calm/premium — entrances only, gentle overshoot, no spin/heavy bounce.

## Commands
- Live editor (visual scrubber — hand this to Joe/Gisele): `cd _remotion && npm run dev`  (= `remotion studio`).
- Render: `npx remotion render <CompId> out/<name>.mp4`  (e.g. `JDInfographic`). Naming: follow asset convention, e.g. `JD_LinkedIn_Motion_<topic>_vN.mp4`.
- GIF/thumbnail: extract a frame with ffmpeg (`-vf select=eq(n\,200) -vframes 1`) for QA / static fallback.

## QA (still required)
Can't watch video play from tools → extract 2–3 frames (early/mid/final) with ffmpeg and vision-check fonts, layout, colors, no overlap/cutoff. `ffprobe` to confirm width/height/duration/nb_frames/codec. Then tell Joe to play it to confirm pacing.

## Delivering a video DRAFT to Joe for review (NOT the same as posting) — Joe directive, June 2026
A finished render is for REVIEW first; Joe iterates (wording, pacing, particle density, colors)
before anything ships. Two locked rules from the SM 001 short session:
- **A `MEDIA:C:\Users\...mp4` chat link does NOT open for Joe** ("everytime I click the link it says no such path"). Don't hand him the raw render path as the deliverable. Instead **copy the MP4 to `C:\Users\somea\Downloads\<short-name>.mp4`** (easy to open from File Explorer) and give him that. The render still lives at the BrandAssets convention path; Downloads is just the openable copy.
- **Do NOT upload to Cloudinary on every render** ("dont upload to cloudinary everytime until we get the final output"). Cloudinary is for the FINAL, signed-off output (and for actually posting to Metricool). During iteration, Downloads copy only; upload once Joe calls a final. When you DO upload a video, creds are in `_scripts/upload_posters.py` and it needs `resource_type='video'`.
- Keep prior versions side by side in Downloads (`_v1`, `_v2`, `_cinematic`, `_threejs`) so Joe can compare cuts.

## Post to Metricool
Upload MP4 to Cloudinary (hosts video too) → secure_url into Metricool `media[]` exactly like an image. LinkedIn/FB accept video; IG Reels need video. Keep a static PNG of the final frame as fallback/thumbnail.

## Multi-PLATFORM aspect ratios — ONE composition, 3 sizes (proven SM Ep08, June 2026)
When motion goes across platforms, do NOT build a separate component per aspect ratio. Make the composition **aspect-responsive** by reading `const { width, height } = useVideoConfig();`, then register the SAME component three times in `Root.tsx` at the platform sizes:
- **1080×1080 (1:1)** → LinkedIn in-feed video (also fine for FB/IG feed)
- **1080×1920 (9:16)** → Instagram Reel / Stories / TikTok (the vertical video aspect)
- **1920×1080 (16:9)** → X/Twitter in-feed video, YouTube
Confirm each render with `ffprobe -select_streams v:0 -show_entries stream=width,height,duration,nb_frames,codec_name` — verify the aspect actually matches the platform before uploading.

### Aspect-aware LAYOUT — wide content must REFLOW for 9:16, not just shrink (the key fix)
A layout tuned for 1:1/16:9 strands a huge empty band in 9:16, and the naive fix is wrong:
- **DON'T `transform: scale()` wide content up to fill a narrow tall frame** — it overflows the side edges and clips text (e.g. two side-by-side cards got their left/right edges cut off; "50" → "0"). Scaling fixes vertical emptiness by breaking horizontal fit.
- **DO reflow structurally for tall frames.** Detect `const tall = height / width >= 1.5;` and change the layout: side-by-side cards → `flexDirection: tall ? "column" : "row"` (stack vertically), tighten `maxWidth`, and give the `Stage` wrapper aspect-aware vertical padding (`tall ? "230px 70px 230px" : "150px 70px 170px"`) so centered content reads as intentional breathing room, not a void.
- A short centered hook/headline on 9:16 with symmetric padding is fine — vertical breathing room is a reel convention, not a defect. Only *strands of dead space beside/under wide elements* are the problem.

### Fast QA loop — `remotion still` before full render
Render single frames at scene midpoints to QA layout BEFORE committing to 3 full MP4 renders: `npx remotion still <CompId> qa/<name>.png --frame=<N>`. Vision-check each scene at all three aspect ratios, fix in the component, re-still. Only render MP4s once stills are clean. This caught the 9:16 card-overflow and a stamp-timing issue cheaply on Ep08. Short ~10s reels render fast enough to do all 3 aspects foreground after stills pass.

## Multi-scene reels (`<Series>`) — proven pattern
`src/JDStatReel.tsx` = a 3-scene story reel (9.6s) and the canonical multi-scene reference. Structure: a `<Series>` of `<Series.Sequence durationInFrames={s*fps}>` blocks, each a self-contained scene component, sharing reusable `<BG>` (grid + drifting glow + inset frame), `<Brackets label>`, `<Footer>`.
- Scene 1 Hook: word-by-word reveal — `hook.split(" ").map` with `spring({frame: frame-8-i*4})`; mark an accent word (e.g. wrap in `*...*`) to color it blue.
- Scene 2 Number+photo: animated COUNTER `Math.round(value*interpolate(frame,[10,55],[0,1],{easing:Easing.out(Easing.cubic)})).toLocaleString("en-US")`; KEN BURNS `interpolate(frame,[0,durationInFrames],[1.08,1.22])` as photo `scale` inside an `overflow:hidden` strip + side gradient scrim blending to navy. Photo via `<Img src={staticFile("name.png")}/>` — copy the source image into `_remotion/public/` first.
- Scene 3 CTA: underline sweep `width: ${interpolate(frame,[20,42],[0,1])*100}%` + spring-pop button.
Real-story content reads best (e.g. the $933K Ithaca flood-zone walk-away from joedowns.ai) — Joe's voice, not generic.

## Upgrading Remotion (gotcha)
`npx remotion upgrade` picks the right matched versions but in this headless shell FAILS with `spawn npm ENOENT`. FIX: copy the `npm i --save-exact ... @remotion/cli@X remotion@X @remotion/google-fonts@X` line it prints and run THAT directly. Then `npx remotion versions` must say "All packages have the correct version".

## Pitfalls
- Mismatched `remotion` / `@remotion/*` versions → install/runtime errors. Keep them identical. (`npx remotion versions` to verify.)
- `npx remotion upgrade` can't spawn npm here → run its printed `npm i` line directly (see above).
- zod v4 came in as an "extra package" but worked fine with 4.0.481 `z.object`/`z.infer` schemas; only if a schema error appears, pin zod v3.
- Don't re-scaffold the project each time — add a `<Composition>` to `Root.tsx` and a `src/<Name>.tsx`.
- Don't foreground the first install/render (Chromium download) → background it.
- Use `@remotion/google-fonts`, not a CSS `<link>` (link fonts may not be ready at frame render).
