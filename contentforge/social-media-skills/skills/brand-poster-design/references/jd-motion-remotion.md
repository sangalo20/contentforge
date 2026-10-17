# JD Motion Graphics — Remotion pipeline (PRIMARY, replaces the Chrome-screenshot loop)

Remotion is the house tool for Joe's motion graphics. It is faster (parallel, all cores — ~90s for ~10s of video vs ~6min), has a live visual editor (Remotion Studio), real spring physics, multi-scene sequencing, animated counters, and Ken Burns photo motion. The old HTML+Chrome-screenshot method (jd-motion-graphics.md) is deprecated — keep it only as a zero-dependency fallback.

## Project location
`C:\Users\somea\BrandAssets\_remotion\` — a standard Remotion project.
- `src/index.ts` → registerRoot
- `src/Root.tsx` → registers every `<Composition>` (id, component, duration, fps, 1080x1350, zod schema, defaultProps)
- `src/JDInfographic.tsx` → handwritten dark-spine infographic (chart grow, underline draw, numbered "how" list)
- `src/JDStatReel.tsx` → 3-scene story reel (word-reveal hook → count-up number + Ken Burns photo → CTA underline sweep). Showcase of `<Series>`, animated counter, `Img` motion.
- `src/JDPhotoStatReel.tsx` → photo-TOP / stat-BELOW reel (face-safe: photo fills top 56%, face-anchored micro-zoom, stat + body + handwritten punch in the navy below). Built specifically to stop face-cropping. Props include `photo`, `photoPos`, `zoomOrigin` so framing is derived from each image.
- `public/` → images referenced via `staticFile("name.png")` (copy source photos here first)
- `out/` → rendered MP4s

## Commands (run from the project dir; git-bash `npx`/`npm` work here)
- **Live editor (for Joe/Gisele to scrub + tweak):** `cd /c/Users/somea/BrandAssets/_remotion && npm run dev` → opens Remotion Studio in browser.
- **Render one composition:** `npx remotion render <CompositionId> out/<NAME>.mp4`
  - Name MP4s by the asset convention: `JD_LinkedIn_Motion_<ref>_<slug>_vN.mp4`.
- **List comps / versions:** `npx remotion compositions` · `npx remotion versions`
- **Upgrade:** `npx remotion upgrade` figures out the matched version set, BUT in this headless shell it fails to spawn npm (`spawn npm ENOENT`). Workaround: copy the `npm i --save-exact ... @remotion/cli@X remotion@X @remotion/google-fonts@X` line it prints and run that directly. All `@remotion/*` packages MUST share the exact same version.

## Brand spine in Remotion (keep identical to static posters)
Colors NAVY #0A0E16, BLUE #2E6BFF, BLUEB #3D7BFF, BLUEL #6FA0FF, AMBER #F5A623 (handwritten only), INK #EAF0FA, MUTE #8A93A6.
Fonts via `@remotion/google-fonts`: `import {loadFont} from "@remotion/google-fonts/Inter"` (also Caveat, PatrickHand, JetBrainsMono) → `const {fontFamily}=loadFont();`. Always reuse: technical grid bg, drifting glow sphere, `[ BRACKET LABELS ]`, inset 1px frame. FOOTER = `joedowns.ai` by default; only add the "The Real Reps" CTA on newsletter-fit content (see jd-design-system.md footer rule — Joe corrected the over-use).

## Animation idioms that fit JD (calm/premium, entrances only)
- `spring({frame: frame-DELAY, fps, config:{damping:200}})` for fadeUp text (stagger by ~4-8 frames).
- `spring(config:{damping:10-14, stiffness:120-160})` for pop/overshoot on numbers, circles, buttons.
- `interpolate(frame,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)})` for underline/line draws (scaleX) and count-ups.
- Count-up number: `Math.round(value * t)` then `.toLocaleString('en-US')`.
- Ken Burns: keep it TINY and FACE-ANCHORED — `interpolate(frame,[0,dur],[1.0,1.05])` as photo `scale` with `transformOrigin` set to the FACE coords (e.g. `"50% 28%"`), inside `overflow:hidden`, with a navy gradient scrim. Do NOT use a big zoom (1.08→1.22) on a strip containing the face — Joe flagged this; it pushes the face out of frame. Anchor at the face so the zoom expands into the background only.
- Multi-scene: `<Series><Series.Sequence durationInFrames={2.6*fps}>…</Series.Sequence>…</Series>`.

## Props-driven, BUT keep a LIBRARY of distinct formats (don't reuse one template for every video)
Joe corrected this (June 2026): running every video through the SAME composition (e.g. JDStatReel for both the $933K and GEO reels) makes the feed monotonous — same 3-act structure every time. Swapping text props is NOT enough variety.
- Maintain SEVERAL distinct motion formats and pick by what the content IS (same discipline as choosing a poster layout by the photo): **stat reel** (single punchy number), **photo-stat** (photo-top + number, face-safe), **quote/manifesto** (kinetic typography, no number), **list/steps reveal**, **chart-in-motion** (animated infographic), **photo-story** (image-led, minimal motion).
- Each format is still props-driven internally (zod schema + defaultProps) so one format covers many topics — but rotate FORMATS across posts, don't ship the identical structure repeatedly.
- When asked for "another video", prefer a DIFFERENT format (and a different photo) over re-skinning the last one.

## Animated characters / avatars (flat-vector, on-brand)
Inline-SVG cartoon characters animate cleanly in Remotion and are fully brand-controlled (no image-gen needed). Pattern proven for SI hosts (June 2026): build each character as an `<svg viewBox>` React component taking a `bob` prop; apply a gentle idle motion with `Math.sin((frame/fps)*speed)*amp` (offset per character so they don't bob in sync), plus a spring slide-in (`translateY` from ~60→0). Differentiate people by hair/beard/glasses/color + a nameplate, not photo accuracy. Working `JoeChar`/`PeterChar` live in `src/SIReel.tsx`. Use when: a host/person should appear but there's no good photo, or the brand has a mascot aesthetic (SI). For true likeness, use image-gen instead — vector avatars are stylized by design.

## Posting motion to Metricool
Upload the MP4 to Cloudinary (`cloudinary.uploader.upload(path, resource_type="video")`) → use the secure_url in Metricool `media[]` exactly like an image (LinkedIn/FB accept video; IG Reels require it). Keep a PNG of the final frame as thumbnail/fallback (extract via `ffmpeg -i out.mp4 -vf "select=eq(n\,LAST)" -vframes 1 thumb.png`).

## Pitfalls
- zod v4 may install as an "extra package"; it worked fine for schemas here (4.0.481 + zod 4.3.6). If `z.infer`/defaultProps ever break, pin zod@3.
- First render downloads a bundled Chromium (one-time, slow); subsequent renders are fast.
- Verify output with `ffprobe` (width/height/nb_frames) + extract a few frames for vision QA — can't watch playback directly, so check per-scene frames AND tell Joe to play it for pacing.
- Photos must live in `public/` and load via `staticFile()`, not absolute paths.

*Source: Joe sessions, June 2026. Supersedes jd-motion-graphics.md (Chrome-screenshot fallback).*
