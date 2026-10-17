# Stories (9:16 / 1080×1920) — full playbook

Proven June 2026 across JD, SM, SI. Stories are an **IG + Facebook** placement only.

## Locked rules (Joe)
- **Stories all round** — every brand. Verify connections with `getBrandSettings` every time, don't assume. As of June 2026: SM/SI/StorPro = IG+FB; **Joe Downs = IG ONLY** (no FB connected).
- **3-hour min spacing does NOT apply to stories.** Schedule the story at the **same timestamp as its paired feed post**.
- **Stories aren't linked to the feed post** → bake in a CTA cue. NO "swipe up" (link stickers are in-app only, not API-settable). Honest pointer instead.
- **Per-brand CTA wording (locked):**
  - JD: `FULL POST ON MY PROFILE →`
  - SM: `FULL BREAKDOWN ON OUR PAGE →`
  - SI: `FULL STORY ON OUR PAGE →`
  - Color = brand accent (JD blue `#6FA0FF`, SM blue `#2E7DF6`, SI yellow `#FDE801`).
- **IG story ⇒ IG feed post must exist.** If a brand only posts to LinkedIn on the feed, its IG stories point at an empty profile. Stand up IG feed posts (poster image + IG-adapted caption: shorter, hashtagged, "Follow along" link-in-bio cue — not verbatim LinkedIn copy).
- **Posting rule (all brands):** create as `draft:true`; Joe sends for approval himself. Do NOT flip autopublish or touch posts already in his approval pipeline.

## Two render tracks
### 1. Visual-light → reflow (`_scripts/storyify.py`)
Injects `data-fmt="story"` + a `#storyhooks` style block the base CSS lacks:
```
.p{height:1920px!important}
.pad{height:calc(1920px-60px)!important;justify-content:center!important}
.pad .spacer{display:none!important}
.pad .tag,.pad .hwtag{position:absolute;top:64px;left:94px}
.pad .foot{position:absolute;left:94px;right:94px;bottom:70px}
.fbbar,.tbbar{display:none!important}   /* decorative accent bars float into the headline after recenter — looked like a strikethrough through a word */
.fb img{height:1920px!important}        /* + regrade the full-bleed gradient for the taller frame */
.pr,.pr img,.prscrim,.prtext{height:1920px!important}
.tb,.tb img,.tbscrim{height:760px!important}
```
Plus a CTA pill injected before `</body>` (`#storyCTA`, `bottom:150px`, brand accent, semi-opaque bg so it reads over any layer). Works clean for: minimal statement, quote, big-stat, photo full-bleed.

### 2. Text-heavy → purpose-built (`_scripts/gen_story_simple.py`)
Checklists / multi-card stats / dossiers / infographics do NOT reflow — `flex:1` / `margin-top:auto` anchor content to the top, leaving a dead black band in the lower ~40% and CLIPPING the takeaway box. `justify-content:center` can't fix an inner anchored block. Build a glanceable 9:16 from scratch instead: per-brand spine map (bg, accent, headline font, kicker color, kfont, CTA) + kicker + big hook headline + ONE supporting line + CTA pill + footer. Drop the dense list/body. SI dark accent = yellow.

## VIDEO stories (vertical Remotion re-render)
A 1:1 or 16:9 video shown as a 9:16 story **letterboxes** (black bars) — fails Joe's "must fit IG/FB standards" bar. There is NO dimension-swap shortcut for video; re-render the composition at 1080×1920.
- **Make the component aspect-aware**, don't just register a taller `<Composition>`. A naive tall render with a top-anchored flex column + single `flex:1` spacer dumps ALL extra height into one gap → huge dead band (hit on `SICheatCode`). The SM components (`SMSelfDisqualify`, `SMFirstTimerEdge`) were already correct: a `Stage` wrapper with `justifyContent:center` + a `tall = height/width >= 1.5` check that swaps padding and pins masthead-top / footer-bottom absolutely.
- **The aspect-aware fix pattern** (applied to SICheatCode): read `const {width,height}=useVideoConfig(); const tall=height/width>=1.5;` then in tall mode → outer column `justifyContent:center`, top bar `position:absolute;top:70`, footer `position:absolute;bottom:64`, collapse the `flex:1` spacer to a fixed height. Centers the block, no void.
- Register a `<Brand><Name>Story` composition at 1080×1920 alongside the square/portrait one (same component, props).
- QA with `npx remotion still <Comp> out.png --frame=<N>` then vision-check before rendering the full MP4. Watch the chart/lasso kissing the right frame edge on tall canvases.

## Scheduling stories (Metricool MCP)
`createScheduledPost` with `instagramData.type:"STORY"` (+ `facebookData.type:"STORY"` for FB). Empty `text`. JD = IG provider only; SM/SI = both. Confirm the returned `instagramData.type` is `STORY` and media rehosted to `static.metricool.com`.

## Re-pointing media after an edit (CTA add, fix)
Metricool rehosts bytes at schedule time — overwriting the same Cloudinary `public_id` does NOT update an already-scheduled post. Re-upload (URL version bumps), then `updateScheduledPost` each post's `media:[]` to the new URL. uuid is stable; id shifts on every edit — re-pull the schedule if an id 404s. Do NOT do this to posts already sent for approval unless Joe okays it.
