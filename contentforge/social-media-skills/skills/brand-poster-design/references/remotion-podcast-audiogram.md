# Remotion Podcast Audiogram (caption-synced reel WITH embedded audio)

A distinct motion FORMAT from the short stat/quote reels in `jd-remotion-pipeline.md`: a long-form
audiogram that plays a real audio clip and syncs on-brand visuals to the spoken words, beat-for-beat.
Proven June 2026 on **SM 001 (Blunk cold open)** — first 3:30 of the episode, 1080×1350, 6300 frames /
210s, H.264 + embedded AAC, 31.6 MB, rendered in ~3 min (setConcurrency null).
Composition lives at `src/SM001ColdOpen.tsx`; caption data at `src/sm001Captions.ts`. Reuse as the template.

## When to use this format
- "Make a video to complement [N min/sec] of this audio" / "add the audio to the video".
- Podcast cold opens, monologue clips, testimonial audio — anything where the AUDIO is the content and
  the visuals are a synced complement (NOT a silent stat reel).
- Pick THIS over the short reels (JDStatReel etc.) whenever there's a real audio track to embed and follow.

## Pipeline (all steps verified)
1. **Cut the requested span** with ffmpeg into `_remotion/public/<brand>/<clip>.m4a` (Remotion `staticFile`
   needs it under `public/`). AAC: `ffmpeg -y -i "<src.mp3>" -t 210 -c:a aac -b:a 192k public/sm/clip.m4a`.
   Confirm with `ffprobe ... format=duration`.
2. **Transcribe with timestamps** — `faster_whisper` is installed under `C:/Python313/python.exe` (git-bash
   `python`/`whisper` is NOT). `WhisperModel("base.en", device="cpu", compute_type="int8")`,
   `transcribe(path, beam_size=5, vad_filter=True)`; each segment has `.start/.end/.text`. base.en on CPU does
   3:30 in a couple minutes. A reusable `transcribe.py` pattern was saved beside the clip.
3. **CLEAN the transcript by hand** — Whisper mangles brand/proper nouns (it heard "Storage Moguls" as
   "Muggles/Mowgos", misspelled "Christin"). ALWAYS correct names, brand terms, and numbers before they go
   on screen. This is a required step, not optional.
4. **Author a captions data module** (`src/<clip>Captions.ts`): an array of `{start,end,text,phase}` chunks
   (merge whisper segments into readable 1–2 sentence cards; times in SECONDS) PLUS an `EMPHASIS[]` array of
   big overlay elements keyed to their own time windows (chips, a big question, a count-up/down stat,
   verticals row). Keep timing as DATA so re-syncing = editing numbers, not code.
5. **Author the composition** (`src/<Clip>.tsx`): `<Audio src={staticFile("...")}/>` at the top of the
   `AbsoluteFill`, then a persistent `<BG>`, `<Masthead>`, a `<CaptionCard>` that looks up the active caption
   by `useCurrentFrame()/fps`, an `<EmphasisLayer>`, and a `<Footer>` with a live waveform + progress bar.
6. **Register** in `Root.tsx`: `durationInFrames={SECONDS * FPS}` (210*30 = 6300), 1080×1350, `defaultProps={{}}`.
7. **QA cheaply FIRST**: `npx remotion still <Comp> out/qa/fN.png --frame=N` at ~6 key beats (title, chips,
   the emotional stat, recovery stat, a long caption, outro) and vision-check BEFORE the full 6300-frame
   render. Catches layout/overflow bugs in seconds instead of after a 3-min render.
8. **Render** (background + notify — it's long): `npx remotion render <Comp> "<BrandAssets>/<Brand>/Podcast/<NAME>.mp4"`.
   Verify with ffprobe that an **audio stream is present** (`codec_type=audio`, codec aac) and duration matches.

## Sync mechanism (the core idiom)
Everything keys off elapsed SECONDS, derived once: `const sec = frame / fps;`
- Active caption: `CAPTIONS.find(c => sec >= c.start && sec < c.end)`. Fade in over first ~0.45s of its
  window (`interpolate(local,[0,0.45],[0,1])`), fade out over last ~0.35s (`interpolate(sec,[end-0.35,end],[1,0])`).
- Active emphasis: same `.find` over `EMPHASIS[]`; when one is present, push the caption lower & smaller
  (`bottom: hasEmph ? 250 : 360`, font 40 vs 52) so the big element owns the upper third.
- Count-UP or count-DOWN: `interpolate(sec,[start+1, end-2.5],[0,1],{clamp, easing:Easing.out(cubic)})` then
  `Math.round(from + (to-from)*p)`. (Blunk used a count-DOWN 205→135 lbs for the weight-loss beat.)
- Per-phase accent tone: map each caption `phase` to an accent color so emotional beats can desaturate /
  go warm (amber) while normal beats stay brand-blue — restraint on heavy content is the point.

## Live waveform + progress footer (reused element)
Fake but convincing: a row of N bars whose heights are `sin(frame/fps*6 + i*0.6)`; bars left of
`frame/durationInFrames` use the accent color, the rest are faint — reads as an audio scrubber filling to the
current position. Pair with a thin progress bar of width `prog*100%`. Sits above the brand sign-off line.

## Title card before the VO starts
The first few seconds of podcast audio are usually a music sting / silence before the first word. Put a
centered TITLE CARD (episode label + serif headline + subtitle) over 0→~4s, then swap to the masthead+caption
frame once narration begins (`const showFrame = sec > 4.0`). Gives a clean cold open.

## SHORT / VERTICAL CTA-PROMO variant (9:16 YouTube Short / Reel) — proven June 2026
A second flavor of this format: instead of a long 4:5 caption-walk, build a SHORT vertical promo on the
podcast COLD OPEN (the host's "who I am / why this exists" intro) that ends on a hard signup CTA. Joe's ask:
"intro graphic for a YouTube Short, lots of movement not just text, with an invite CTA." Proven on
**SM 001 short** — first 39s, 1080×1920, 1170 frames, H.264+AAC, ~8.5 MB, rendered in well under a minute.
Composition `src/SM001ShortCTA.tsx`; data `src/sm001Short39.ts`. Keep it SEPARATE from the long-form comp
(`SM001ColdOpen.tsx`) — same audio source, different aspect/pacing/structure; do NOT try to make one comp do both.
- **Cut the SHORT span** (e.g. `-t 39`) into its OWN `public/<brand>/<clip>_shortNN.m4a`; don't reuse the 210s clip.
- **Register at 1080×1920** (`width={1080} height={1920}`, `durationInFrames={SECONDS*FPS}`).
- **The CTA owns the last ~third.** Author a `cta` EMPHASIS window covering the closing pitch (e.g. 26s→end),
  and in the root render: when `inCTA`, swap OUT the masthead+captions+stat overlays and render a dedicated
  full-screen `<CTA>` component (kicker → the URL as the typographic HERO, pulsing → feature chips →
  a glowing "JOIN FREE →" button → one sub-line) over the persistent BG + footer. Keep the footer (waveform +
  url) up the whole time. This is cleaner than trying to caption the CTA — the URL should be the biggest thing
  on screen at the end, not a caption line.
- **"Lots of movement, not just text" = stat MOTION, not bigger fonts.** Across the proof beats use: a count-UP
  (0→20 facilities), a spring "slam" big-figure ($50M+), a staggered pipeline (+3 / +2 rows sliding in from the
  left), a chip row popping in one-by-one, then the CTA. Each keyed to its spoken line via the same `EMPHASIS`
  `.find` mechanism. The animation IS the deliverable when Joe says "not just text."
- **CTA wording is a DECISION to surface, not assume.** Default to low-friction "JOIN FREE →"; after delivery,
  ask whether the verb should be Apply / Get Started / Join the Community / a specific tier, and offer a ~2-min
  re-render. Don't bake a final verb silently.

### 9:16 PITFALL — an oversized display FIGURE overflows the right canvas edge (the 9:16 cousin of the 4:5 number-collision bug)
A big serif/condensed figure sized for a 1080-WIDE-portrait by eye (e.g. `$50M+` at 300px) overflows the
narrower 1080×1920 frame — the trailing glyph (the `+`) clips against the inset border. On a tall canvas the
usable width is the SAME 1080 but the figure reads bigger relative to the frame, so headroom you'd have at 4:5
isn't there. FIX = shrink the figure (300→232px fixed it) and/or nudge its `top` down for balance; vision-QA
every big-number frame for right-edge clipping specifically. (Companion to the SKILL.md "oversized display
NUMBERS collide with the line below" pitfall — that one is vertical collision, this one is horizontal overflow.)

## Brand spine — match the target brand, don't default to JD
This format is brand-agnostic; use the requested brand's system. **Storage Moguls** (the Blunk build):
NAVY `#0B1322`/`#10182B`, BLUE `#2E7DF6`/`#6FA6FF`, serif **Fraunces** headlines, **Barlow Condensed**
masthead ("STORAGE MOGULS / OPERATOR INTELLIGENCE"), **Montserrat** body, sign-off
"PRACTITIONERS, NOT PROFESSORS" + `storagemoguls.ai`. All three fonts ship in `@remotion/google-fonts`
(`Fraunces`, `BarlowCondensed`, `Montserrat`). For JD/SI use their own spines from the other references.

## Pitfalls
- Audio MUST live under `public/` and load via `staticFile()` — absolute paths fail. Output MP4 has no audio
  if you forget the `<Audio>` element; always ffprobe for the audio stream afterward.
- A 6300-frame render is long — ALWAYS background it with notify_on_complete, and QA via `remotion still`
  first (don't discover a bug at frame 6000).
- `process(action=wait)` is clamped to ~180s here — for a multi-minute render, re-issue wait, or rely on the
  completion notification, rather than expecting one long wait to block to the end.
- Caption windows that are too long/dense overflow the card — keep each to 1–2 sentences; let the audio carry
  detail. Verify the longest cards in QA.
- Don't reuse the short-reel comps for this — they have no `<Audio>` and a 3-act structure unsuited to 3+ min.

*Source: SM 001 Blunk audiogram, June 2026. Companion: jd-remotion-pipeline.md (short reels), jd-motion-remotion.md.*
