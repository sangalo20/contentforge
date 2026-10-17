# Turning feed posters into 9:16 Stories (IG + FB) — proven June 2026

When Joe says "give the posts stories on all brands," you are converting this
week's already-built **feed posters** (1080×1350) into **1080×1920 Story**
assets and scheduling each as a `STORY`-type post. Two locked Joe rules govern
the run:

- **Stories all round** — every brand. JD personal = **IG only** (no Facebook
  page connected); SI / SM / StorPro = **IG + FB** (both connected). ALWAYS
  verify connections with `getBrandSettings` before assuming — don't guess.
- **The 3-hour minimum spacing does NOT apply to stories**, and a story
  publishes at the **SAME time** as the feed post it's paired with (different
  placement, no collision). Already-published feed post → the story can still go
  up (near-future slot today; past times are rejected by Metricool).
- **Humanize the baked-in poster TEXT too**, not just captions — but going
  forward only. Don't redo already-uploaded feed posters unless you're
  regenerating them anyway (then fixing the source em-dash is free and also
  improves the live feed PNG).

## The verified split (this is the whole strategy — Joe approved "Option A")
Auto-reflow is NOT uniformly good. Sort each poster into one of two paths:

| Poster type | Path | Why |
|---|---|---|
| Minimalist / quote / big-stat / **photo** | **auto-reflow** via `storyify.py` | visual-light; centering works, fills the tall frame cleanly |
| Checklist / multi-card stat / dossier / long list / SVG-diagram (varies) | **purpose-built** via `gen_story_simple.py` | dense posters leave a dead band + clip the bottom box when force-reflowed |

Rule of thumb from the run: ~70% auto-reflow clean, ~30% need purpose-built.
ALWAYS vision-QA each render before believing it reflowed — the dense ones fail
in predictable ways (below).

## Two runnable scripts (under this skill's `scripts/`)
- `scripts/storyify.py` — inject `data-fmt="story"` CSS hooks into an EXISTING
  poster HTML that lacks them, recenter the `.pad` column, hide flex spacers,
  pin tag→top / footer→bottom, stretch full-bleed/right photo layers to 1920,
  and **hide decorative accent bars** (`.fbbar/.tbbar`) that otherwise float into
  the headline after recenter. Use for the auto-reflow path. (Distinct from the
  skill's `render_formats.py`, which REQUIRES the base CSS to already define the
  story hooks — JD/SM/SI posters do NOT, hence storyify.)
- `scripts/gen_story_simple.py` — brand-spined (JD/SM/SI) glanceable 9:16
  generator: kicker + big hook headline + ONE supporting line + footer,
  optically centered, full-bleed. Use for the dense-poster path. Edit the
  `STORIES` list (brand, slug, kicker, headline HTML with a `<span class='a'>`
  accent, sub, footerL, footerR). Text must already be humanized by the caller.

## Pitfalls hit + fixed this session
- **Dense poster reflow = dead band + clipped bottom box.** A checklist poster
  force-reflowed to 1920 keeps its inner 1350 layout, floats up top, leaves a
  ~30% black band below, AND clips the closing takeaway ("...out of it" cut).
  `justify-content:center` can't fix it because the inner blocks use their own
  flow / `margin-top:auto`. FIX = don't fight it; route to `gen_story_simple.py`.
- **Decorative accent bar slices the headline after recenter.** JD photo
  posters have a `.fbbar` pinned by `bottom:362px`; once story CSS moves the text
  panel, the bar lands ON a headline word and reads as a strikethrough glitch.
  FIX = `.fbbar,.tbbar{display:none}` in story mode (baked into storyify.py).
- **SI statics still bottom-heavy even after storyify.** Files using
  `margin-top:auto` won't center; content sits up top, footer pins to bottom,
  big gap between. For an important brand surface, don't ship "usable but
  gappy" — route SI dense statics through `gen_story_simple.py` too for one
  consistent centered look across all brands.
- **SI accent in the simple template = YELLOW (`#FDE801`), not green.** Green
  (`#16A34A`) is SI's secondary; on a dark SI story the yellow highlight span
  pops harder. (Kicker can be green; the headline accent word is yellow.)
- **Top breathing room on reflows is FINE / intentional** — the IG/FB story UI
  (profile bubble, "your story" chrome) overlays the top band anyway. Don't
  over-engineer to kill it; accept it as house style and keep it consistent.

## Scheduling a Story in Metricool
- Type flags: `instagramData.type:"STORY"` and `facebookData.type:"STORY"`.
  `text:""` (stories carry no caption). Providers `[{network:"instagram"},
  {network:"facebook"}]` (drop facebook for JD).
- JD uses `autoPublish:false` (gated/approval); SI + SM `autoPublish:true`.
- Upload PNGs to Cloudinary first (one manifest, e.g.
  `_manifests/stories_week1_urls.json`), attach the `secure_url`; verify the
  returned `media[]` rehosts to `static.metricool.com`.
- `createScheduledPost` returns a NEW id/uuid each time — capture per response;
  ids shift on every edit (the recurring Metricool id-instability).
- **Scope to THIS WEEK only.** Stories expire after 24h — batching stories for
  posts two-plus weeks out adds zero reach. Build the current week's set; do
  future weeks when those posts are near.

## VIDEO stories — no letterbox (Joe standard)
Feed posts that are MP4 (reels, clips) were built 1:1 / 16:9. A square/landscape
video in a 9:16 story **letterboxes** (black bars) and fails Joe's "must fit IG
and FB story standards" bar. There is NO dimension-swap shortcut for video:
making them true vertical is a **Remotion re-render** (the motion engine — see
`references/jd-remotion-pipeline.md`, the 9:16 reflow = stack content, never
`scale()`). Either re-render vertical (preferred for the most important growth
surface) or substitute a static "watch on feed" 9:16 card — never ship
letterboxed video. QA each vertical render for 1080×1920 + safe top/bottom
margins (story UI chrome) before scheduling.

## Timezone trap that bit this run
The host/execute_code clock is **EAT (UTC+3)**; Metricool posts are **ET**. EAT
is 7h AHEAD. Host `17:25` = `10:25 AM ET`. ALWAYS convert host-EAT → ET (−7h)
before deciding what's already published vs pending — getting this wrong made
me think "most of today already published" when it was actually still morning ET
with most posts pending. (Also in memory.)
