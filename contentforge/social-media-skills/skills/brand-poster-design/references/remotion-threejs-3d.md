# Three.js (3D) inside Remotion — capabilities, honest limits, pipeline

Proven June 2026 building the SM 001 cinematic Short. `@remotion/three` + `three` give REAL 3D
(geometry, lighting, camera, GPU particles) layered under Remotion typography. But there is a HARD
ceiling on what hand-coded primitives can pull off — read the limits section before promising 3D.

## Install (one-time, per `_remotion` project)
```
npm install @remotion/three@<match remotion version, e.g. 4.0.481> three@latest @types/three@latest
```
`@remotion/three` exports `ThreeCanvas` (the Remotion-aware R3F canvas), `useVideoTexture`,
`useOffthreadVideoTexture`. Check version match: `node -e "console.log(require('./package.json').dependencies)"`.

## Architecture (the split that works)
Two files per piece:
1. `src/<Clip>3d.tsx` — a `Three3DLayer` component = ONE `<ThreeCanvas>` with per-scene 3D chosen by global
   `sec = useCurrentFrame()/fps`. Camera position/rotation switched per scene via the `camera` prop.
   `<ThreeCanvas width height style={{position:"absolute",inset:0}} camera={{fov:55,position:[x,y,z]}} gl={{antialias:true, alpha:true}}>`.
   Lights: one `ambientLight intensity~0.45` + a `directionalLight position={[-6,8,6]} intensity~1.0` (per spec
   "directional + subtle"); add a low cool fill if wanted. Materials = `meshLambertMaterial` (lit) or
   `meshBasicMaterial` (flat/unlit, for glow panels). AVOID `meshStandardMaterial` (PBR) unless you want reflections.
2. `src/<Clip>.tsx` — the composite: navy `Backdrop` (the ThreeCanvas is `alpha:true` so it composites over it),
   `<Three3DLayer/>`, then Remotion typography overlays (captions/counters/URL) as absolutely-positioned divs ON TOP.
   Keep all TEXT in Remotion (crisp), all DIMENSIONAL stuff in Three. This is the right division of labor.

## What Three.js does WELL here (use it for these)
- **Real rotating geometry** — a `boxGeometry` tumbling on combined X+Y rotation reads as a true 3D cube with
  shaded faces (give each face its own `meshLambertMaterial` via `attach={\`material-${i}\`}`). Far better than a CSS flip-hack.
- **GPU particle bursts** — `<points>` with a `bufferGeometry` whose positions you recompute per frame from
  per-particle direction vectors × an eased radius. Burst out (easeOutExpo) then reconverge (easeInQuart).
- **Aerial / iso layouts** — grids of flat `boxGeometry` "rooftops", node networks, pillars. Camera can sit
  top-down (`position:[0,16,0.01], rotation:[-PI/2,0,0]`) for a satellite view, or straight-on for a gateway.
- **Light/glow** — `meshBasicMaterial` planes/circles as "light flooding from a door", dashboard glow, whiteout floods.
- **Slow camera moves** — drift a group on Z, rotate a group on Y for a satellite spin.

## What Three.js (hand-coded) does BADLY — the HONEST CEILING (Joe rejected these)
- **Believable ENVIRONMENTS fail.** "Inside a storage unit looking out", "a glowing UI dashboard", "a real
  place" come out as flat gray planes / random gray blocks / a glitchy semicircle. Primitives + flat lighting
  cannot fake a textured, modeled scene. Joe: "the 3d doesn't even work… I don't think you can make it yourself."
- **The rule:** Three-in-Remotion is for ABSTRACT/GEOMETRIC motion (cubes, particles, node maps, bars, pillars),
  NOT photoreal scenes. If the brief needs modeled+textured environments, say so honestly and route to a real
  tool: **Blender** (modeled/textured/lit scenes) or an **AI video generator** (Runway / Kling / Sora) fed the
  script + brand stills. Do NOT keep iterating hand-coded primitives toward "looks like a real room" — it won't get there.
- **Soft depth-of-field & soft shadows** are expensive/fiddly; fake DOF with scale/opacity, keep shadows subtle.

## ⛔ QA THE ACTUAL RENDERED VIDEO, not cherry-picked stills (Joe corrected HARD)
The single biggest process failure this session: I QA'd hand-picked `remotion still` frames, they looked fine,
I declared scenes "working" — then the full MP4 had broken/empty/glitchy scenes I'd never sampled. Joe caught
every one ("the cube is empty", "the 3d doesn't work"). FIX, mandatory for any 3D / multi-scene video:
- After the full render, extract a frame EVERY SECOND across the whole runtime and vision-audit a spread:
  `ffmpeg -y -ss <start> -i out.mp4 -vf "fps=1" out/audit/sec_%02d.png` (or `fps=1/4` for a coarser pass).
- Look at the REAL frames from the encoded file, especially scene MIDPOINTS and TRANSITIONS, before saying done.
- `remotion still` is for fast iteration DURING build; it is NOT proof the final video is clean. A still at a
  flip's 90° point or a between-scene gap misleads. Never tell Joe "it works" off stills alone.

## SEAMLESS transitions — no black gaps, continuity rule (Joe corrected)
Joe: "the animation section is not seamless into the next scene plus its black breaking continuity."
- A scene with its OWN solid `background:"#04060C"` HARD-CUTS against the next scene's navy, and if scene A
  fades out before scene B fades in you get a pure-black gap. FIX: give every scene the SAME background spine
  (call the shared `BaseBG` navy+grid inside each scene instead of a black fill) so there's never a black slab.
- CROSS-DISSOLVE adjacent scenes: overlap their time windows (start B ~0.4s before A ends), fade A's text down
  while B's content fades up on the same navy. Verify the dissolve frame on the ACTUAL video (e.g. ffmpeg frame
  at the seam) shows content-over-navy, never black.

## MESSAGE > spectacle on a "reason/why" beat (Joe corrected)
Giant cryptic text + a glow does NOT carry a message. Joe rejected "THAT'S WHAT DROVE US" set huge with a
radial glow: "the giant letters don't help pass the message and that glow is just not useful." FIX = state the
REASON plainly in calm serif at NORMAL size, no glow, and lead into the URL. What worked: a muted setup line
("We couldn't find the right way in.") → accent rule → bold answer ("So we built one."), then the CTA. Say the
thing; don't blow up a vague phrase.

## Distinct ICONS — two sparse line-icons read as "the same" (Joe caught)
On a multi-face card/cube, thin sparse line icons (a blob "handshake", a faint polyline "chart") look identical
at a glance. Joe: "it has two similar faces, the last two." FIX = make each icon a visually DISTINCT silhouette:
a filled-stroke building, a grad-cap, a $-in-a-circle COIN, a BOLD bar-chart with an arrow. Solid/recognizable
shapes, not faint lines. Vision-QA each face FACE-ON (a flip mid-rotation at ~90° is edge-on and unreadable —
that's not a defect, sample a face-on frame).

## On-brand color in 3D (Joe locked: "always on brand")
Even when a creative brief literally says "gold", keep the brand palette. SM 3D color language:
value/established glow = warm WHITE / faint amber-tint (NOT gold), future/potential = cool BLUE, unknown = navy
darkness. A "single gold particle" cold open → blue particle with a warm-white hot core. State the substitution
when you make it.

## Particle quality — soft glow sprite, not hard pixels
Default `pointsMaterial` points render as tiny hard squares ("stars"). For "weighty" motes: build a radial-gradient
glow texture once with a canvas (`document.createElement("canvas")` works in Remotion's headless-Chrome render),
`new THREE.CanvasTexture(c)`, set it as the points `map`, bump `size` (~0.34), `transparent`, `depthWrite:false`,
`blending={THREE.AdditiveBlending}`. Now they read as glowing energy.

*Source: SM 001 cinematic Short, June 2026. Companion: remotion-multiformat-aspect-aware.md, remotion-podcast-audiogram.md.*
