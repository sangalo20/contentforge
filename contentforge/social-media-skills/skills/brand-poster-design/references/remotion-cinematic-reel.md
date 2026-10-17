# Remotion Cinematic Multi-Scene Reel (from a motion-design SCRIPT, NO captions)

A distinct motion FORMAT from the audiogram (`remotion-podcast-audiogram.md`) and the short stat
reels (`jd-remotion-pipeline.md`). This one is built when the user hands you a **timed motion-design
script** ("[0:00–3.2s] cold open: particle burst → logo… [6.7s] counter 0→20…") and wants a fully
animated branded reel — particles, kinetic type, count-ups, badge draw-ons, light-ray reveals,
pillars→gateway. The audio is still embedded and scenes land on the voiceover beats, but the visuals
are CINEMATIC SET-PIECES, not synced caption cards.

Proven June 2026 on **SM 001 (Blunk)** first 39s → `src/SM001Cinematic.tsx` (1080×1920, 40.2s / 1206
frames, H.264 + AAC, ~7.4 MB, ~1 min render). Reuse as the template. NOTE there are TWO valid SM 001
shorts in `Storage-Moguls/Podcast/`: `_signup-cta_v2` (the caption-synced version) and `_cinematic_v1`
(this one) — keep both; they're different formats for the same clip.

## When to use this vs the other two motion formats
- **This (cinematic):** user gives a beat-timed SCRIPT with described animations (bursts, morphs,
  kinetic type, reveals). Visual variety per scene is the point. No on-screen caption track.
- **Audiogram** (`remotion-podcast-audiogram.md`): the AUDIO is the content; sync readable caption
  cards + a waveform to the spoken words. Use when asked to "make a video to complement N min of audio".
- **Short stat reel** (`jd-remotion-pipeline.md` `JDStatReel` etc.): a single number/quote, 3-act, no
  embedded audio.

## Pipeline (verified)
1. Cut the audio span to `public/<brand>/<clip>.m4a` (`ffmpeg -t 39 -c:a aac -b:a 192k`), embed via
   `<Audio src={staticFile(...)}/>` at the top of the root `AbsoluteFill`.
2. Build ONE composition file with a component PER SCENE, each gated on `local = t(frame) - sceneStart`
   and `if (local < 0 || local > dur) return null;`. Stack them in render order in the root component.
   Each scene fades itself in/out with a `sceneOp` interpolate so overlaps cross-dissolve.
3. Register at 1080×1920, `durationInFrames = Math.round(SECONDS * FPS)`. The OUTRO usually runs a beat
   past the audio end — budget ~1–2s extra frames beyond the audio duration (audio 39s → comp 40.2s).
4. **QA every scene's key beat** with `npx remotion still <Comp> out/qac/fN.png --frame=N` BEFORE the
   full render. Pick a frame INSIDE each scene (mid-animation), one per scene — a 7-scene reel = ~10
   stills. Vision-check each. Catches the set-piece bugs below in seconds, not after a full render.
5. Render to `BrandAssets/{Brand}/Podcast/{NAME}.mp4`; ffprobe to confirm an `aac` audio stream + the
   right `width/height` + duration.

## Reusable set-piece idioms (all in SM001Cinematic.tsx)
- **Particle system** (`Particles`): seeded `random()` angles, a spark→burst→contract→form timeline in
  local seconds (`sparkEnd`/`burstEnd`/`contractEnd`/`formRadius`/`maxR`). Burst uses `Easing.out(cubic)`,
  contract uses `Easing.inOut(cubic)`; opacity fades as they form the target circle. Reused for the cold
  open (form a logo) AND the final URL burst.
- **Kinetic type**: per-character `spring()` with a staggered `frame: (local - (base + i*0.07))*fps`,
  `translateY` overshoot via `interpolate(s,[0,0.7,1],[-90,14,0])`, then a rule that wipes L→R as a
  width %.
- **Count-up / slam stat**: `interpolate(local,[start,end],[0,N],{easing:Easing.out(cubic)})` rounded;
  pulse once on landing with a short `sin` term; the second figure SLAMS in via a high-stiffness spring
  `scale [0.4,1.1,1]`.
- **Badge draw-on**: an SVG `rect` with `strokeDasharray={perimeter}` and `strokeDashoffset` animated
  perimeter→0 — the border "draws itself". A ribbon `polygon` fades in after.
- **Light-ray crack**: a thin tall `div` whose `width` grows 0→~60px with a
  `linear-gradient(90deg, transparent, HOT, accent, HOT, transparent)` + `blur(6px)`, over black.
- **Pillars → gateway → URL**: 3 spring-rising bars (center taller) form an arch; when the URL arrives,
  FADE the pillar labels and DIM the pillars (see pitfall), and seat the URL in the arch OPENING above
  the pillar tops with a dark `textShadow` scrim so it never sits on the bars.
- **Persistent grid motif**: a low-opacity (~0.05–0.06) SVG of abstracted storage-door cells slowly
  drifting upward, carried in every scene's `BaseBG` for visual unity.

## Pitfalls (each cost a QA cycle this session — engineer them in up front)
- **CSS-3D rotating cube garbles its side faces.** A `transformStyle:preserve-3d` cube with 4 icon
  faces at `rotateY 0/90/180/270 + translateZ` looked broken on the rotated/side faces (mirrored,
  distorted handshake). FIX = DON'T do a true 3D cube. Use a SINGLE rounded panel that FLIPS through the
  icons in sequence (`rotateY` 0→180 per icon, swap the SVG at the 90° midpoint, `scaleX(-1)` the
  back-half so it isn't mirrored), with progress dots below. Reads as "rotating reveal" without any
  broken geometry. This is the fallback to reach for ANY time a brief calls for a spinning 3D object.
- **A centered overlay (URL/headline) collides with other centered content in the same scene.** The
  gateway URL rendered ON TOP of the pillar labels (TOOLS/STRUCTURE/GUARDRAILS bled through). Two centered
  `AbsoluteFill`s stack at the same point. FIX = when the hero element arrives, animate the competing
  layer OUT (fade its labels, dim it) AND offset the hero into clear space (`marginTop:-360` to sit in
  the arch opening, not over the bars). Give the hero a dark `textShadow` scrim. Always QA the frame
  where two centered layers coexist.
- **A text block positioned with absolute `bottom:` + an animated wipe `width:%` can render INVISIBLE**
  if the wipe-start timing hasn't been reached at your QA frame, OR if `bottom:` pushes it off-frame.
  The "HUNDREDS OF STUDENTS" reveal showed nothing at first. FIX = move it into the normal flow
  (flex column, `margin:0 auto`) instead of absolute `bottom:`, and verify the wipe `width` actually
  starts at/after the icon sequence completes (set the wipe window to begin right when the prior
  animation ends). Don't QA only the scene's first frame — pick a frame after the reveal should fire.
- **Big number kissing its label.** A 360px count-up with `line-height 0.85` leaves the label riding up\n  into it; add `margin-top` on the label (24px fixed it). Same family as the oversized-number pitfall\n  in the main SKILL.\n- **The pillars→gateway set-piece is FRAGILE — when in doubt, drop it for a clean CTA finale (Joe\n  rejected v1's ending, June 2026).** Even after the URL-collision fix above, the 3 spring-rising pillars\n  rendered in the actual video as a **lopsided broken bar chart** (wrong relative heights, GUARDRAILS a\n  dim stub, URL not visible) — Joe: \"the opening at 28 doesnt work… you need to fix from the 26 second\n  going forward.\" The reliable fix was to **delete the pillars entirely** and replace the ending with the\n  proven CTA finale from the caption cut: kicker → big `storagemoguls.ai` (serif hero) → horizontal\n  feature chips (THE TOOLS / THE STRUCTURE / THE GUARDRAILS) → glowing \"JOIN FREE →\" button → one\n  sub-line → footer, over the persistent BG + an entry particle burst. This is cleaner, on-brand, and\n  ALWAYS works. Prefer it over the gateway unless the gateway is QA'd clean on the full video.\n- **A word-by-word reveal that BLURS in slowly leaves a near-black DEAD frame at the scene start** (the\n  \"THAT'S WHAT DROVE US\" beat: at 26s only a faint blurred word showed; the weak light-ray \"crack\" added\n  nothing). FIX = a FAST word-STOMP (per-word `spring` with high stiffness, all words landed by ~0.5s,\n  scale overshoot `[1.4,0.96,1]`) + a brief bright flash sweep instead of a hairline crack. AND lay the\n  phrase out as **deliberate centered STACKED lines** (e.g. `[["THAT'S","WHAT"],["DROVE","US"]]` in a\n  flex COLUMN), NOT one flex row with `flexWrap` — a wrapping row mid-stagger reads lopsided/left-aligned\n  because later words haven't popped in yet. Stacked centered lines stay balanced at every frame.\n- **When you fix a SECTION of an existing reel, render a NEW version** (`_v2`) and keep the old one; Joe\n  compares cuts. Then AUDIT the fixed span on the actual MP4 (ffmpeg `fps=1` strip + honest vision pass),\n  not just one still — see the main SKILL's \"MOTION QA = AUDIT THE FINAL VIDEO\" rule. A single QA still\n  landing on a clean frame is exactly how v1's broken ending slipped through.

## Scene-to-scene CONTINUITY — no per-scene black fills, cross-dissolve on a shared bg (Joe: "its black breaking continuity")
Each scene fading in/out on its OWN solid `background:"#04060C"` produces a hard black-to-navy CUT
between scenes AND a pure-black GAP whenever one fades out before the next fades in. Joe caught it on
the "THAT'S WHAT DROVE US" → CTA handoff. FIX:
- Every scene uses the SAME shared `BaseBG` (navy + grid), NOT its own black fill — no color cut.
- OVERLAP adjacent scenes and CROSS-DISSOLVE: start scene N+1 ~0.4s BEFORE scene N's text finishes
  fading (separate `textOp` that fades the outgoing words while the incoming scene's `sceneOp` rises),
  so the next element is already coming up as the prior fades. No empty beat.
- Verify the SEAM frame in the full-video audit (the dissolve frame should show outgoing text dimming
  over navy with the next element's glow already rising — never pure black).

## Cinematic COPY + LEGIBILITY (Joe corrections, June 2026)
- **Don't blow up a vague/cryptic phrase to full-screen.** "THAT'S WHAT DROVE US" in giant letters
  "doesn't help pass the message." State the REASON plainly and lead into the CTA. Pattern that landed:
  a calm two-part serif beat — muted setup line ("We couldn't find the right way in.") → short accent
  rule → bold bright answer ("So we built one.") → cross-dissolve to the URL. Normal sizes, not 100px+.
- **No gratuitous glow on message text** ("that glow is just not useful") — drop text-shadow glow on
  the reason/headline beats; keep type clean on the navy spine. (Glow is fine on the URL hero / button.)
- **Icon SETS must be VISUALLY DISTINCT.** A flip-card cycling building/cap/handshake/chart had two
  near-identical sparse line icons (the last two read the same). Replace lookalikes with unmistakable
  forms: a `$` coin in a circle (value) and bold FILLED upward bars + arrow (growth). Always audit an
  icon set for two faces that read alike.
- A caption that looks "dim" in ONE sampled frame is usually just mid fade-in/out — confirm against
  the full-video audit before "fixing" a non-bug.

## Hand-coded 3D scope limit — abstractions YES, environments NO (Joe: "I don't think you can make it yourself")
`@remotion/three` (see `references/remotion-threejs-3d.md`) does clean ABSTRACT 3D (rotating shaded
cubes, particle bursts, box "galaxies", aerial grids that light up, pillar/bar geometry, wireframe
floors). It CANNOT hand-code believable ENVIRONMENTS — a "storage unit interior", a "corridor that
reads as architecture", a "glowing UI/dashboard" come out as gray planes, stray geometry, and
random blocks. When a brief wants a real PLACE or real UI, say so and offer a **Blender** (modeled
scenes) or **AI-video** (Runway / Kling / Sora) brief instead of faking it — don't overpromise and
burn iterations. The caption AUDIOGRAM (`remotion-podcast-audiogram.md`) is the safe professional
fallback when 3D/cinematic overreaches (it's the cut Joe chose when the door-film 3D failed).

## Brand color call — gold/amber request on a NON-amber brand
A script may call for a "gold particle". Storage Moguls (and JD) are navy/blue institutional systems;
amber/gold is reserved (it's the Successful Idiots motion accent + the static-infographic-only amber
rule in MEMORY). CALL = render the spark/particles in the brand BLUE (`#2E7DF6`) with a hot-white core
(`#DCE9FF`) so it still reads as a premium spark, and tell the user you kept it on-palette with the
option to override. Don't silently inject gold into a blue brand.

## No-logo-asset fallback
There's usually no real brand logo PNG on the machine (only host photos). For a "logo lockup" cold open
+ outro, build a TYPOGRAPHIC lockup (circle mark with the brand initials + wordmark + tagline) the
particles form into. Tell the user it's typographic and offer to swap a real logo PNG if they provide one.

*Source: SM 001 Blunk cinematic reel, June 2026. Companions: remotion-podcast-audiogram.md (caption
audiogram), jd-remotion-pipeline.md (short reels), jd-motion-remotion.md.*
