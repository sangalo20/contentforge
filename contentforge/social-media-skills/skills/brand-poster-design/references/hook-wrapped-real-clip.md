# Hook-Wrapped Real Clip — the high-retention SM video format (proven SM Ep04, June 2026)

> ⚠️ SCOPE (Joe, Ep04): this format is PROMOTIONAL content — it sells/teases the episode
> (hook → footage → "come to storagemoguls.ai"). Use it ONLY when the ask is promotion.
> When Joe asks for EDUCATIONAL content from an episode, do NOT reach for this — build
> teaching pieces (lightweight posters that stand alone and make the reader smarter about
> storage, no episode-selling). Keep the two lanes clearly separate.

## Why this exists
Joe flagged that our videos "don't really convert and are not really watched."
FB data: multi-scene TYPOGRAPHIC builds (words on navy) average **0:06** watch
time; the hand-drawn rising-graph GIF got **0:14**. Pure-text videos fail because
there's no human and nothing to watch — viewers read the first card and bounce.

The fix is NOT a better text video. It's to use the **real conversation footage**
that already sits in each episode's Drive `/Promos` folder (Joe + guest on camera,
already vertical 9:16, already captioned) and wrap it in a retention structure the
bare clip lacks. A real face + voice + captions is the single biggest watch-time
lever on muted autoplay feeds.

## The one flaw the raw promo clips have
They open **COLD** — frame 0 is the guest mid-sentence, no hook, no context. Same
weak-first-second problem as the text videos. They also just cut off at the end
(no CTA). So the wrap fixes exactly those two things.

## The format (4 parts)
1. **HOOK CARD on frame 0** — fully composed, instantly readable (NO blank, NO
   words flying in). A bold open-loop claim/question + a context sub-line (characters
   + stakes) + a "Here's the story →" cue. This is the scroll-stopper. **≥2.8s** so it
   can actually be read (Joe: 1.6s "flashed by"). Serif headline on the SM navy spine.
   See the "Establish the CHARACTERS" + "BOTTOM THIRD name tag" + "CUT the clip's OWN
   ending" sections below — those three Joe corrections are part of the format, not extras.
2. **Crossfade (0.3s, no black gap)** into the real clip.
3. **Real footage plays** with a subtle persistent SM brand frame overlaid (top
   masthead scrim strip + a `storagemoguls.ai` chip low at the bottom) — must NOT
   cover the face or the clip's existing captions (those sit ~65–75% height).
4. **CTA end card** (~2.6s): question + `storagemoguls.ai` as the typographic hero
   + a "Start free →" button + "New episodes every Monday." (⛔ cadence is MONDAY as of
   Ep11 July 2026, not Tuesday — do not copy an old "Tuesday" outro). Crossfade in.

## Build pipeline (ffmpeg — footage is real video, NOT Remotion)
Source clips: download from Drive `/Promos` (already 1080×1920, with audio +
burned-in captions). Transcribe with faster_whisper (`C:/Python313/python.exe`) to
pick the hook + caption accurately. Pick the clip whose story matches the episode's
backbone message.

Assets: author hook + outro as opaque 1080×1920 HTML→PNG (SM spine: navy `#0B1322`,
blue `#2E7DF6`/`#6FA6FF`, Fraunces serif, Barlow Condensed masthead, Montserrat,
"PRACTITIONERS, NOT PROFESSORS." + storagemoguls.ai). Author the brand bar as a
**transparent** PNG (render Chrome headless with `--default-background-color=00000000`).

```bash
W=1080;H=1920;FPS=30
# hook intro (subtle zoompan for life) + silent audio. ≥2.8s (Joe: 1.6s flashed by). d = secs*fps = 84.
ffmpeg -y -loop 1 -i hook.png -f lavfi -i anullsrc=r=44100:cl=stereo -t 2.8 \
  -vf "scale=2160:-1,zoompan=z='min(zoom+0.0005,1.05)':d=84:s=${W}x${H}:fps=${FPS},format=yuv420p" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r $FPS -c:a aac -b:a 192k -shortest hook_clip.mp4
# outro (static CTA) + silent audio
ffmpeg -y -loop 1 -i cta_outro.png -f lavfi -i anullsrc=r=44100:cl=stereo -t 2.6 \
  -vf "scale=${W}x${H},format=yuv420p" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r $FPS -c:a aac -b:a 192k -shortest outro_clip.mp4
# brand the real footage: overlay transparent bar + normalize loudness to -14 LUFS
ffmpeg -y -i clip.mp4 -i brandbar.png \
  -filter_complex "[0:v]scale=${W}x${H},fps=${FPS}[v];[v][1:v]overlay=0:0,format=yuv420p[out]" \
  -map "[out]" -map 0:a -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r $FPS -c:a aac -b:a 192k main_branded.mp4
# concat with crossfades (NO black gaps). offsets = cumulative len minus xfade dur.
# hook 2.8 -> main: offset 2.5 ; (2.8+MAIN-0.3-0.3) main -> outro: offset = 2.8+MAIN-0.6
ffmpeg -y -i hook_clip.mp4 -i main_branded.mp4 -i outro_clip.mp4 -filter_complex "\
[0:v][1:v]xfade=transition=fade:duration=0.3:offset=2.5[v01];\
[v01][2:v]xfade=transition=fade:duration=0.3:offset=<2.8+MAIN-0.6>[vout];\
[0:a][1:a]acrossfade=d=0.3[a01];[a01][2:a]acrossfade=d=0.3[aout]" \
  -map "[vout]" -map "[aout]" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k FINAL.mp4
```
All three segments MUST share W/H/FPS/audio-codec or xfade/concat misbehaves.

## QA (locked rule — audit the rendered MP4, never cherry-picked stills)
`ffmpeg -y -i FINAL.mp4 -vf "fps=1/2" audit/s_%02d.png` plus explicit frames at
0.0 (the watch-time test — MUST be the composed hook, not blank), the hook→footage
seam (~1.55s, must be a clean crossfade not black), and the footage→outro seam.
Vision-QA: frame 0 legible? brand bar/chip NOT covering face or existing captions?
seams not black? Confirm an audio stream survives (`ffprobe ... codec_type=audio`).

## Deliver
Copy FINAL.mp4 + the hook/outro PNGs to `~/Downloads/SM_Ep04.../` for review with a
written rationale. Do NOT upload to Cloudinary / schedule until Joe approves the
format. Once approved: wrap all of the episode's `/Promos` clips (one hook + CTA
each) = N ready Reels/Shorts per episode, and make this the standard SM video format
(retire the pure-typographic builds).

## ⛔ LIGHT intro-card variant — sometimes Joe wants the OPPOSITE of the full setup (Joe, Ep11 July 2026)
The "Establish the CHARACTERS" section below is the DEFAULT (Ep04). But Joe may explicitly ask for a
much lighter intro: *"the intro should have very little text — just the main understanding point, or
something short explaining what the guy is talking about, e.g. 'Jason Mandel on the cost of waiting.'"*
When he does, the hook card is a clean **kicker + ONE big message line + a single short subline
(speaker + topic) + "HERE'S THE STORY →"** — NOT the multi-line character/stakes setup. Everything
else holds: ≥2.8s, slow zoompan, SM navy spine, crossfade in. Confirm which weight he wants; don't
assume the heavy setup. Proven Ep11 (4 clips, Jason Mandel): `C:\Users\somea\SM_Ep11\video\gen_cards.py`
+ `assemble.sh`. Chrome for PNG render = full path `C:\Program Files\Google\Chrome\Application\chrome.exe`
(not on PATH as `chrome`). Confirm the brandbar is truly transparent via a PIL alpha check (center
alpha 0, text areas opaque) before assembling — a non-transparent bar blacks out the footage.

## ⛔ FACE ≠ SPEAKER — the attribution pitfall (Joe, Ep11 July 2026 — cost several vision-QA rounds)
The `/Promos` cuts frequently show the HOST on camera (a reaction/recap shot) while the AUDIO is the
GUEST's line. So the person you SEE is not reliably the person whose insight it is. Do NOT name the
intro card (or a name tag) by the on-screen face. Resolve cleanly: (1) map audio → transcript speaker
(unambiguous); (2) identify faces via the `/YouTube` thumbnail, which labels host vs guest — crop the
two headshots and compare to a clean clip face frame; (3) attribute the card by **topic + INSIGHT-OWNER**
(whose expertise the point belongs to), correct regardless of the cut — e.g. Ep11 the DD/legal insight
is Jason Mandel's, so cards read "Jason Mandel on [topic]" though Joe is the on-camera face. Then FLAG
the framing to the user for a yes/no before rendering N videos. Same "verify identity before labelling /
don't mislabel host vs guest" rule as the name-tag section — applied to the hook card.

## Establish the CHARACTERS — a clip without them is "a story with no characters" (Joe, Ep04 v2)
Joe's two corrections on v1: the intro was too short, and the footage gave no idea who's
talking or what deal it is. Both are required, not optional:
- **Hook intro ≥ ~2.8s** (v1's 1.6s flashed by). Long enough to actually read the headline +
  context line. Drive it with a slow zoompan so it's not a static hold.
- **The hook card must set up the STORY, not just tease.** Add a context sub-line naming the
  characters + stakes: "Two first-time buyers. A ~$650K facility everyone said to walk away
  from. A year later: over 70% full." Now the footage lands as the payoff to a setup.
- **Add a lower-third NAME TAG** the moment the speaker starts (fade/enable in ~0.5s, hold
  ~4s, out). Name + role: "JACK PEZZINO · Runs the Storage Moguls mentorship program."
  Place it in a CLEAN zone — for a centered talking-head portrait crop the face fills the
  middle and the existing captions sit ~72%, so the safe spot is **upper-left just under the
  top brand bar (~top:185px)**, NOT a true lower-third (that lands on the chin/jacket).
  Build it as a transparent PNG; overlay with `enable='between(t,0.5,4.8)'` (reliable for
  RGBA — the `fade=...:alpha=1` approach silently dropped the overlay once).
- Verify the speaker's identity before labelling (the BSG-logo jacket = Belrose Storage Group
  team; third-person "they/I love that story" recounting a student deal = Jack, who coaches
  the deals). Don't mislabel host vs guest.

## CUT the clip's OWN ending + don't run two CTAs at once (Joe, Ep04 v3)
The raw `/Promos` clips already have their own (weak) end card baked in (e.g. an animated
"Go To StorageMoguls.AI"). Joe: cut it off and replace with OURS — never have both endings
running. Find where their card starts by sampling the tail frame-by-frame
(`ffmpeg -ss <t> -i clip.mp4 -frames:v 1`), then `trim=0:<cut>` the video AND
`atrim=0:<cut>` the audio in the filtergraph so our CTA outro is the only ending. (Ep04: their
card began ~43.5s on a 47.5s clip; cut at 43.2s.)
- ⛔⛔ CUT ON THE FADE-IN START, NOT WHERE THE CARD TEXT IS READABLE (Joe, Ep11 July 2026 — he
  caught ALL 4 videos still carrying the old ending after I'd "trimmed" them). The baked-in end
  card DISSOLVES IN: the face darkens and a dark bokeh background appears ~0.5–1.0s BEFORE the
  "Go To..." TEXT is legible. If you sample the tail and cut at the frame where the text reads
  clearly, you keep the whole dark fade-in — which then bleeds through the 0.3s outro crossfade
  and, because it's the SAME navy-dark palette as our CTA card, is easy to mistake for "our card"
  in a quick vision-QA. FIX: scan the tail densely (every 0.25s) and find the LAST fully-bright
  clean-face frame; the card's dark background begins right after it. Cut ~0.3–0.5s BEFORE that
  (i.e. before ANY darkening/bokeh, not before the readable text). Ep11 examples: readable "Go To"
  text appeared ~0.7–1.0s after the fade actually began (10k clip face-clean at 29.75, dark bg by
  30.0, text readable ~30.5 → cut at 29.9, NOT 31.0; avoid_mistake face-clean 47.05, card by 47.3
  → cut 46.9, NOT 49.0). My first pass cut 0.5–1.8s too late on EVERY clip. QA the FIX by sampling
  the footage→outro seam region (dur-3.3 .. dur-2.5) and confirming NO "Go To" text and no stray
  dark-bokeh frame before our CTA card.
- ⚠️ `loudnorm` (and any `-af`) CANNOT be applied with `-af` when the audio is already routed
  through `-filter_complex` (atrim) — ffmpeg errors "Simple and complex filtering cannot be
  used together for the same stream." Put loudnorm INSIDE the filtergraph chain on that audio
  label instead: `[0:a]atrim=0:43.2,asetpts=PTS-STARTPTS,loudnorm=I=-14:TP=-1.5:LRA=11[aout]`.

## Name-tag placement: BOTTOM THIRD is what Joe wants (Ep04 v3 — overrides the upper-left note)
Joe prefers the name tag in the **bottom third** (lower-left), not upper-left. For the
centered portrait crop the safe slot is `top:~1530px` (≈80% height): that lands BELOW the
clip's existing burned-in caption band (~72%, where the karaoke captions sit) and ABOVE the
storagemoguls.ai chip (`bottom:60`). Verified no collision among caption / tag / chip. Always
vision-QA a frame inside the tag window to confirm the three don't stack.
- Overlay enable window unchanged: `enable='between(t,0.5,4.8)'` on the footage clip's own
  timeline (BEFORE concat), so it's ~0.5–4.8s into the footage regardless of hook length.

## Pitfalls
- Render the brand bar transparent (`--default-background-color=00000000`) or it
  blacks out the footage.
- Keep the bottom URL chip LOW and small; the source promo clips often already have
  their own end-card/CTA — during the 0.3s outro crossfade the two can briefly
  overlap (only visible mid-dissolve; trim the chip earlier if it bothers).
- Place the brand bar in the top scrim only; the clip's existing captions live mid-
  lower — don't stack anything there.
- loudnorm to -14 LUFS (IG/FB/LinkedIn target) so the audio isn't quiet.
