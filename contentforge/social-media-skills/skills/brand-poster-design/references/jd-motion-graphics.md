# JD Motion Graphics — animated posters

Turn any JD poster into a short motion graphic (MP4 for LinkedIn/feed, GIF for previews). Proven June 2026 on the handwritten infographic.

## TWO pipelines — prefer Remotion
- **PRIMARY → Remotion** (React video framework). Use for ongoing/volume work. Faster (parallel render across all cores: ~90s first run incl. one-time Chromium download, ~30–40s after — vs ~6 min for the Chrome-screenshot loop), props-driven (new content = new props, same component), spring physics, and a **live visual Studio** with a scrubber. This is the answer to "is there a better/faster/more intuitive way" → yes, Remotion. Full setup + commands: `references/jd-remotion-pipeline.md`.
- **FALLBACK → Chrome-screenshot loop** (below). Only when you can't add the Node project (zero new deps beyond Chrome+ffmpeg). Slower, harder to tune, but portable.
- **NON-CODE for the team → Canva** (already connected): drag-drop animated posts, no code. Offer when Joe/Gisele want to self-serve.

## Concept (fallback method)
Reuse the exact poster HTML, add CSS `@keyframes` entrance animations, then capture the timeline **deterministically** frame-by-frame and encode with ffmpeg. Deterministic = each frame is an exact, repeatable timeline position (not a live screen-grab race).

## The deterministic-freeze trick (key technique)
In the HTML, read `?t=<ms>` from the URL. For that frame:
1. Add the animating class so all `@keyframes` are applied.
2. For every animated element, set `animationDelay = (currentDelay - t/1000)+'s'` (shift the timeline back by t).
3. Add a `.frozen` class whose CSS sets `* { animation-play-state: paused !important; }`.
Result: loading `poster.html?t=2000` renders the precise state at 2.0s. No `?t` = plays live for browser preview.
(See JD_infographic_handwritten_anim.html for the working script block + keyframes.)

## Animation style that fits JD
- Entrances only, staggered: `fadeUp` (translateY+opacity) for text blocks; `growBar` (scaleY from bottom) for chart bars; `pop`/`wob`/`chkpop` (slight overshoot) for numbers, annotations, circle bullets; `drawLine` (scaleX) for underlines.
- Cadence ~4.8s reveal + ~1.5s hold on the final full frame (so a still frame = the complete poster). Keep it calm/premium — no spinning, no bounce-heavy easing. cubic-bezier(.2,.8,.2,1) for the hero bar.

## Render + encode pipeline
1. **Frames:** `BrandAssets/_scripts/render_motion_frames.py` (edit HTML/OUT paths, FPS, DURATION_MS, HOLD_MS).
   - 30fps × ~6.7s ≈ 200 frames. Chrome cold-start per frame ≈ ~1.8s → ~6 min total. RUN IN BACKGROUND (`terminal background=true, notify_on_complete=true`).
   - Script is **resumable**: pass `--resume` to skip already-written frames (Chrome cold-start is the bottleneck; a 180s foreground call only gets ~90 frames, so resume or background).
   - Each frame: `chrome --headless=new --window-size=1080,1350 --virtual-time-budget=1200 --screenshot=fNNNN.png "file:///...anim.html?t=<ms>"`.
2. **Encode (ffmpeg, installed):**
   - MP4 (LinkedIn/feed, H.264, even dims required):
     `ffmpeg -y -framerate 30 -i _frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -vf "scale=1080:1350" -movflags +faststart OUT.mp4`
   - GIF (preview; palette for quality):
     `ffmpeg -y -framerate 30 -i _frames/f%04d.png -vf "fps=20,scale=540:-1:flags=lanczos,palettegen" palette.png`
     `ffmpeg -y -framerate 30 -i _frames/f%04d.png -i palette.png -lc:v -filter_complex "fps=20,scale=540:-1:flags=lanczos[x];[x][1:v]paletteuse" OUT.gif`
3. **QA:** open the MP4; confirm smooth, no fl. Verify final frame == the static poster.

## Posting motion to Metricool
- Upload the MP4 to Cloudinary (it hosts video too) → use the secure_url in Metricool `media[]` exactly like images. LinkedIn/FB accept video; IG Reels need video.
- Keep a static PNG export of the final frame as a fallback/thumbnail.

## Pitfalls
- Don't foreground the frame render — it'll time out (~90/200 frames in 180s). Background + resume.
- `--virtual-time-budget` must be > web-font load (~1000–1200ms) or fonts/animation states render half-applied.
- Frame count must match ffmpeg `-framerate`; keep numbering zero-padded `f%04d`.
- libx264 needs even width/height — 1080×1350 is fine; if odd, add `scale=...:force_original_aspect_ratio` or pad.
