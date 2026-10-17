# JD batch poster generator + multi-aspect Remotion (proven Joe-personal Ep08 run, June 2026)

Two reusable techniques from generating a 16-poster Joe-personal batch and a 3-aspect-ratio motion piece in one session. Both are FAST and avoid hand-authoring each asset.

## A. Node batch generator for many JD posters in one pass
When you have N finished posts (e.g. all of Joe's Metricool drafts) that each need a visual, do NOT hand-write N HTML files. Write ONE Node generator (`BrandAssets/_scripts/gen_jd_posters.js`) with a shared JD-spine `baseCSS` string + a small set of TYPE BUILDER functions, then a `posters` map of `{name: builder({...})}`. Working builder set (all on the JD dark navy spine — navy `#0A0E16`, electric blue `#2E6BFF`/`#6FA0FF`, `[ BRACKET ]` mono labels, mono footer byline + `joedowns.ai`):
- `minimal({tag, head, headSize, sub, byline})` — big statement/quote/manifesto. Workhorse.
- `list({tag, head, items[], byline})` — numbered "hides 3 things" / steps.
- `big({tag, num, unit, sub, byline, numSize})` — single stat (e.g. `$1.4M`, `60%`).
- `vs({tag, head, a:{l,big,s}, b:{l,big,s}, note, byline})` — two-card comparison, B highlighted blue.
- `photo({img, tag, head, sub, byline})` — top-bleed: photo fills top ~56% (`.photowrap` h≈760px) → scrim fade → navy text panel below. PRIMARY style; builds face recognition.
- `info({tag, head, cols[], note, byline})` — handwritten infographic on the dark spine (Caveat headline, dashed cards, ONE amber accent column). For data/comparison ideas.

Render loop: headless Chrome `--screenshot` per HTML at 1080×1350 (forward-slash paths in git-bash — see SKILL pitfall). QA in batches with vision, fix in the GENERATOR (not per-file), re-render only changed builders.

### ⚠️ The #1 batch defect to engineer out up front: the DEAD VOID
Every builder that anchors content to the top (`list`, `vs`, `big`, `info`) leaves a large empty band in the lower ~40% on the 1350px canvas. FIX baked into the builders: wrap the body between TWO `<div class="spacer"></div>` (flex:1) — a leading spacer above the content and the existing one below — so content sits in the OPTICAL CENTER. The `minimal` builder already did this (spacer above head + below sub) and never voided; copy that shape into the others. `big` needed `<spacer><content><spacer><spacer>` to sit slightly above center. Always vision-QA every top-anchored builder for the void before uploading.

### Footer byline = what Joe DOES (locked rule, do not drift)
Rotate concrete role bylines, never vague adjectives: `CEO, Belrose Group · Founder, Storage Moguls` / `Self-storage acquisitions · syndication · development` / `Host, Self Storage Investing podcast · $29M+ acquired`. (See jd-design-system.md.)

### Photo discipline
Analyze each photo first; Joe's shots (`joe_smile_navy.png` mic/hoodie, `joe_navy_dark.png` blazer) are center-upper faces → top-bleed (crown bleeding off the top is the editorial convention, NOT a miscrop; face/expression stay intact). Rotate the photo across the batch — don't reuse one image. ~5 of 16 photo, rest minimalist/stat/infographic = good variety.

## B. ONE Remotion component → 3 platform aspect ratios
For a motion idea that ships to multiple platforms, build ONE `<Composition>` component and register it THREE times in `Root.tsx` at different `width`/`height` — same `durationInFrames`, same component:
- `1080×1080` (1:1) — LinkedIn in-feed video
- `1080×1920` (9:16) — Instagram Reel / Stories
- `1920×1080` (16:9) — X / wide
Make the component ASPECT-RESPONSIVE off `useVideoConfig().width/height`:
- A shared `Stage` wrapper centers content; give TALL (9:16) frames bigger symmetric vertical padding so the centered content reads as intentional breathing room, NOT a void. Do NOT scale content up to fill a tall frame — `transform: scale()` overflowed the side-by-side cards horizontally (clipped "50" → "0"). Instead, **reflow**: a two-card row should switch to `flex-direction: column` (stack) on tall canvases via the same `height/width >= 1.5` check.
- BG glow/particle positions should be derived from `width`/`height` (fractions), not hardcoded px, so they sit right at every ratio.
Render each id to its own mp4 (`npx remotion render SMEdgeSquare/Reel/Wide …`), `ffprobe` to confirm dimensions, upload all to Cloudinary as `resource_type="video"`. Note for SM: X isn't connected in Metricool, so the 16:9 asset is built+uploaded but parked until X is wired (see metricool-scheduling + storagemoguls-podcast).

## Cloudinary video upload
`cloudinary.uploader.upload_large(path, public_id=..., resource_type="video", overwrite=True)` for mp4; plain `.upload(...)` for png. Run with `PYTHONPATH= C:/Python313/python.exe` (clears the broken venv PIL). Verify each URL is publicly fetchable (`curl -o /dev/null -w "%{http_code} %{content_type}"`) before handing to Metricool — Metricool does an anonymous fetch and rehosts to `static.metricool.com`.
