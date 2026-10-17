# Three.js-in-Remotion + cinematic motion (3D, audits, continuity, copy)

Hard-won on the SM 001 podcast-intro Short, June 2026. Joe iterated a 39s vertical
intro video through SIX versions (caption cut → CSS "cinematic" → Three.js → a
hand-coded door film → fixes). This captures what's reusable and the corrections.

## @remotion/three IS installed and works — use it for genuine 3D
- Installed in `_remotion`: `@remotion/three@4.0.481` + `three` (r184) + `@types/three`.
  Install matched to Remotion version: `npm install @remotion/three@<remotionVer> three@latest @types/three@latest`.
- `@remotion/three` exports `ThreeCanvas` (a Remotion-aware React-Three-Fiber canvas),
  `useVideoTexture`, `useOffthreadVideoTexture`.
- Pattern: ONE `<ThreeCanvas width height camera={{fov,position,rotation}} gl={{antialias,alpha:true}}>`
  with `alpha:true` so it composites over a Remotion gradient/`AbsoluteFill` behind it. Drive every
  3D scene off the global `sec = useCurrentFrame()/fps`; conditionally render each scene's group by
  its time window. Layer Remotion typography (captions, counters, kicker, URL) ON TOP in normal
  absolutely-positioned divs. This split — **Three.js for dimensional stuff, Remotion for type** — is
  the right division of labor and is what Joe proposed.
- `document.createElement("canvas")` works inside the render (headless Chrome), so you can build a
  `THREE.CanvasTexture` at runtime (used for the particle glow sprite, below).
- Lighting that reads clean without looking like a game engine: `ambientLight intensity~0.45` +
  one `directionalLight` at 45° (`position={[-6,8,6]} intensity~1.0`) + optional dim cool fill.
  Use `MeshLambertMaterial`/`MeshBasicMaterial`, NOT `MeshStandardMaterial` (PBR is overkill/slow here).

## What Three.js does WELL vs what it CANNOT do by hand (Joe proved both)
- **WORKS great** (geometric abstractions — they ARE just primitives):
  - Real rotating cube with shaded faces / isometric tumble (`<boxGeometry>` + per-face
    `attach="material-N"`). This fixed the "18s→end not smooth" jank the CSS flip-panel had.
  - Particle burst/reconverge as a `THREE.Points` with a soft round glow sprite + `AdditiveBlending`
    (see below) — reads as weighty energy motes, not hard pixels.
  - Aerial grid of facility-roof boxes lighting up in a ripple; slow camera rotate = "satellite view."
  - A "gateway" of 3 box pillars + a top bar; floating-cube "galaxy"; tilted wireframe grid floor
    (`EdgesGeometry` on a `PlaneGeometry`, `lineSegments`, low opacity, drifting on Y).
- **CANNOT reliably build by hand** (needs modeled+textured assets / a real 3D tool):
  - Believable ENVIRONMENTS — a storage-unit interior, a corridor that reads as architecture, a
    "glowing UI/dashboard." Joe's hand-coded door film came out flat/placeholder/glitchy (gray planes
    floating on black, a broken semicircle "interface," stray lines). He was right: *"the 3d doesnt
    even work, I don't think you can make it yourself."*
  - The honest routing: abstractions → do it in Three.js; cinematic environments → an AI video
    generator (Runway/Kling/Sora) fed the script + brand stills, or a Blender artist. Offer to WRITE
    the prompt/brief; don't keep hand-coding primitives toward photoreal and claiming it works.

## Particle glow sprite recipe (weighty motes, not pixels)
Plain `pointsMaterial size:0.07` renders as tiny hard squares ("stars"). Fix:
```
const makeGlow = () => { const c=document.createElement("canvas"); c.width=c.height=64;
  const x=c.getContext("2d"); const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.25,"rgba(220,233,255,.95)");
  g.addColorStop(.55,"rgba(111,166,255,.45)"); g.addColorStop(1,"rgba(46,125,246,0)");
  x.fillStyle=g; x.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); };
// <pointsMaterial map={glow} size={0.34} sizeAttenuation transparent depthWrite={false}
//   blending={THREE.AdditiveBlending} />
```
Burst = each particle along a random dir vector; `easeOutExpo` out, `easeInQuart` back for reconverge.

## ⛔ THE #1 WORKFLOW CORRECTION — audit the ACTUAL rendered MP4, not cherry-picked stills
Joe caught broken output MULTIPLE times because I declared scenes "working" off `remotion still`
frames I hand-picked at favorable timestamps. `remotion still` is fine for fast iteration, but a
single sampled frame HIDES: dead-black gaps between scenes, a scene that's empty for its first
~1.5s while text blurs in, an animation caught mid-flip, a broken layout that only shows at certain
frames. **Before telling Joe anything "works," extract real frames across the whole finished video:**
```
ffmpeg -y -ss <start> -i "<final>.mp4" -vf "fps=1" out/audit/f_%02d.png   # 1 frame/sec
# or fps=1/4 for a sparse spread across a 40s clip
```
Then vision-QA a SPREAD (every few seconds), especially scene SEAMS and the first ~1s of each scene.
This is how the dead-black "THAT'S WHAT DROVE US" gap and the broken gateway were actually found.
Cherry-picked QA stills = how they were MISSED. Joe: *"The 3d doesnt even work"* came after I'd
claimed scene-by-scene it was fine. Make the full-video frame audit a required final step.

## Continuity / seam rules for multi-scene motion (Joe: "not seamless, plus it black breaking continuity")
- **All scenes share ONE background spine.** A scene on a solid `#000`/`#04060C` fill HARD-CUTS
  against the next scene's navy. Give every scene the SAME `BaseBG` (navy gradient + grid) so the
  background never changes color between scenes.
- **Cross-dissolve adjacent scenes; never leave a gap.** If scene A fades out 28.6→29.3 and scene B
  fades in starting 29.4, you get a black flash in the gap. Fix: start B EARLIER (overlap), so B is
  already fading up while A fades down, and key B's intro fade quick. Verify the exact mid-dissolve
  frame on the rendered MP4 (e.g. 29.3s) shows BOTH layers on continuous navy, no black.
- An unused leftover `<Outro>` that runs past the new ending will collide — drop it from the root
  render when a later scene now owns the end.

## COPY / message rules Joe gave for the ending (message over spectacle)
- **No giant cryptic title + glow.** Joe rejected "THAT'S WHAT DROVE US" set huge with a blue glow:
  *"that... in large letters is not useful, that glow... is just not useful."* A blown-up vague phrase
  does NOT carry the message, and decorative glow on text is noise.
- **State the REASON plainly, lead into the URL.** Replaced it with a calm two-part serif beat:
  muted setup line → blue accent rule → bold bright answer ("We couldn't find the right way in." /
  "So we built one."). Normal sizes, no glow, on the navy spine. Reads as a real brand message and
  hands off to the CTA. Copy is easy to swap — offer alternates.
- **Distinct icons on a multi-face card.** Two of the four flip-panel icons (a blob "handshake" + a
  sparse line "chart") read too similar. Joe: *"it has two similar faces, the last two."* Make each
  face visually distinct — a `<circle>`+`$` dollar coin (value) and FILLED `<rect>` bars + arrow
  (growth) are unmistakable vs a building and a grad cap. Generic thin-line icons blur together.

## Deliver/iterate logistics for video (vs posters)
- Joe's chat client can't open a `MEDIA:C:\...` Windows path for VIDEO reliably — when he says "the
  link is wrong / no such path," the file IS there; the chat link just won't play. Default for video
  review: **copy the MP4 to `C:\Users\somea\Downloads\` with a clean name** so he opens it from File
  Explorer. Only upload to Cloudinary at FINAL sign-off (Joe: "don't upload to cloudinary every time
  until we get the final output"). A Cloudinary URL is the one reliably-clickable web link when needed.
- Keep each iteration as its own versioned comp/file (`_v1/_v2/...`) so prior cuts survive for
  comparison; don't overwrite a working cut in place while iterating.
- Verify EVERY render with `ffprobe -show_entries format=duration:stream=codec_type,codec_name,width,height`
  — confirm an `aac` audio stream is present and width/height are the intended aspect.

## Scheduling the finished video across socials (ties into metricool-scheduling)
- **Storage Moguls connected networks = Facebook + Instagram + LinkedIn ONLY** (no YouTube, no X,
  no TikTok). So a "post to all socials" = ONE Metricool post with those 3 providers (IG `type:REEL`,
  FB `type:REEL`, LinkedIn video), plus the **YouTube Short uploaded manually** (vertical <60s = a
  Short automatically) — give Joe a title + description to paste. Always `getBrandSettings` to confirm
  connections; don't assume YouTube/X/TikTok exist.
- Video needs a public URL to attach → this is the moment Cloudinary upload IS appropriate (final).
- Respect the existing planner: a full read showed Jun 23 already packed with an approved campaign in
  Joe's approval pipeline. Don't collide (3-hr same-platform rule) and don't touch approval-pipeline
  posts — schedule the new one on an open day at the universal best slot (11 AM ET) as a DRAFT.

*Source: SM 001 podcast-intro Short, 6 iterations, June 2026. Companions: remotion-podcast-audiogram.md,
jd-remotion-pipeline.md, metricool-scheduling skill.*
