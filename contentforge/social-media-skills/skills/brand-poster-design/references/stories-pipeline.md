# Stories pipeline (IG + Facebook 9:16, 1080×1920) — proven June 2026

Turning a week's feed posts into paired IG/Facebook **Stories**. Stories are a
glance format: full-bleed, big text, one idea. They are NOT linked to the feed
post that inspired them (a viewer who taps gets nothing), so every story needs a
baked-in CTA cue pointing to where the real content lives.

## Who can run stories (verify per session via getBrandSettings — don't assume)
Stories are an **IG + Facebook** feature only. Check each brand's `networksData`:
- A brand needs IG and/or FB connected. Joe Downs (6425321) has **IG only, NO Facebook** → JD stories are **IG-only**. SM (6425193) + SI (6374077) + StorPro (6425267) have both IG + FB.
- LinkedIn/X have no "stories" — never route a story there.

## The two-track build (Option A, Joe-approved)
Auto-reflowing a 1080×1350 feed poster to 1080×1920 only works for **visual-light**
posters (minimalist statement, quote, single big-stat, photo). **Text-heavy** ones
(checklists, multi-card stat comparisons, dossiers, multi-step infographics) reflow
BADLY — content anchors to the top half and the lower 30–60% is a dead black band,
and inner takeaway boxes get clipped. Joe's directive: don't force the cram.
- **Visual-light → reflow** via `_scripts/storyify.py` (injects `data-fmt="story"`
  story CSS hooks the base CSS lacks: stretch `.p` to 1920, `justify-content:center`
  the `.pad`, hide flex `.spacer`, pin tag top / footer bottom, grow full-bleed photo
  layers to 1920, **hide decorative accent bars** `.fbbar/.tbbar` (they float into the
  headline after recenter and read as a stray line through a word), and inject a CTA
  pill before `</body>`).
- **Text-heavy → purpose-built glanceable story** via `_scripts/gen_story_simple.py`
  (a brand-aware template: kicker + big hook headline + ONE supporting line + CTA pill
  + footer, centered, per-brand spine). Drop the dense list/body — nobody reads a
  checklist in a 5-second story. This centers perfectly where reflow voids.

Both scripts live in `BrandAssets/_scripts/`. Run with `C:/Python313/python.exe`.
Output `<stem>__story.png` (reflow) or `<slug>.png` (purpose-built).

## CTA on stories is MANDATORY (Joe, June 2026)
Because the story isn't linked to its post, bake a CTA cue in (bottom, above footer,
brand-accent outlined pill). Keep it HONEST — story link stickers can't be set via the
Metricool API, so don't write "swipe up"/"tap here" (a lie if there's no link sticker).
Point to where content lives instead:
- JD → `FULL POST ON MY PROFILE →`
- SM → `FULL BREAKDOWN ON OUR PAGE →`
- SI → `FULL STORY ON OUR PAGE →`
Both generators carry the CTA per-brand (gen_story_simple has it in the BRANDS map;
storyify injects `#storyCTA`). Color-match to each spine (JD blue, SM blue, SI yellow).

## Humanize the BAKED-IN text too (Joe, locked)
The poster source HTML written before the de-AI directive still had em-dashes AND
`&mdash;` HTML entities in the visible copy. When building stories you regenerate the
visual anyway, so fix the source: grep BOTH `—` and `&mdash;` across the poster HTML,
recast as commas/periods/colons (never blind-delete), run the humanizer lens. Fixing
the source also quietly improves the existing feed PNG (same file) — Joe approved
touching the source for this. Scope to the actually-scheduled posters; ignore
`_style-tests/ _type-tests/ _amber-test/ _samples/` scratch dirs.

## Video stories MUST be true vertical — no letterbox (Joe's IG/FB standard)
A 1:1 or 16:9 feed video shown as a 9:16 story letterboxes (black bars) = looks broken,
fails the standard. Re-render vertical in Remotion (the motion engine), do NOT drop a
square video into a 9:16 slot.
- **Aspect-aware components reflow for free** — if the component reads
  `useVideoConfig().height` and centers (a `Stage` wrapper with `justifyContent:center`
  + `tall = height/width >= 1.5` padding, masthead `position:absolute` top, footer
  `absolute` bottom), just register a 1080×1920 composition and render. Proven: SM
  `SMFirstTimerEdge` / `SMSelfDisqualify` already had `SMEdgeReel`/`SMSdqReel` variants.
- **A plain top-anchored flex column VOIDS in 9:16** — a single `flex:1` spacer dumps
  all the extra height into one bottom gap → huge dead band, payoff/footer float off.
  Fix the COMPONENT, don't just add a taller canvas: add `tall = height/width >= 1.5`,
  set the content column `justifyContent: tall ? "center" : "flex-start"`, collapse the
  `flex:1` spacer to a fixed small height when tall, and pin top-bar + footer
  `position:absolute` (top:70 / bottom:64) in tall mode so they don't float mid-frame.
  Proven fix: `SICheatCode` (was registered square only; added `SICheatCodeStory`
  1080×1920 + the tall-mode layout branch).
- **QA stills, not just the MP4**: `npx remotion still <Comp> out.png --frame=N`.
  Pick a frame INSIDE a scene — a between-scene frame renders blank (looks like a bug
  but isn't; verify with an in-scene frame like 60 / 200 before calling it broken).
- Render MP4 in the **background** (`terminal background=true notify_on_complete=true`);
  each render is minutes. The completion notification confirms the file wrote even if a
  later kill signal lands.

## Upload + schedule
- Static story PNGs → Cloudinary image upload (reuse `upload_posters.py` pattern;
  manifest to `_manifests/`). Video stories → Cloudinary **video** upload
  (`resource_type="video"`), separate manifest. Overwriting a public_id bumps the
  version in the URL, so a re-uploaded asset gets a fresh URL Metricool will re-fetch.
- Metricool story type: `instagramData.type:"STORY"` (+ `facebookData.type:"STORY"`
  for IG+FB). Media rehosts to `static.metricool.com` — verify the returned `media[]`.
- **Story timing = SAME time as its paired feed post** (Joe). The 3-hour min spacing
  rule does **NOT** apply to stories (different placement, no collision with the feed
  post). For an already-published feed post, the story can't be back-timed (past dates
  rejected) → schedule it for the next clean future slot today instead.
- **If JD has IG stories but no IG FEED posts, the story CTA points at an empty profile.**
  JD's feed was LinkedIn-only; josephmdowns (IG) was connected but unused. Fix = stand
  up JD IG feed posts (poster image + caption adapted from the humanized LinkedIn copy,
  trimmed for IG + hashtags + "link in bio"/"Follow along" cue) so the story CTA is
  true. Native "add post to story" reshare is in-app only (no API) AND needs the feed
  post to exist first — so it can't be a shortcut around this.
