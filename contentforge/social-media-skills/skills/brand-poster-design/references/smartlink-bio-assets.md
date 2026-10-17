# Metricool SmartLink / link-in-bio VISUAL ASSETS (proven SI, June 2026)

A SmartLink (Metricool's link-in-bio page) is its own asset class — NOT a feed
poster, NOT a story. Trigger: "style my SmartLink", "design the bio link", "I made
a smart link on Metricool, style it".

## HARD CONSTRAINT — SmartLink styling is UI-ONLY (state this up front)
There is **no Metricool API / MCP tool to push SmartLink styling** (avatar,
background, button colors, title/bio). The deliverable is therefore: (1) BUILD the
image assets, (2) hand Joe the exact "click here in the editor" recipe with hex
values. Don't probe `getScheduledPosts`/the MCP for a SmartLink — it isn't there.
Offer two modes via `clarify`: (A) build assets + recipe, Joe applies; (B) drive the
Metricool editor in-browser logged in as Joe. (A) is the usual pick.

## What a SmartLink lets you style (so build to these)
- **Avatar / profile image** — shown as a CIRCLE at the top. Build 1080×1080,
  circle-safe (everything important inside a centered circle; add a thick brand-ink
  ring so the crop reads intentional).
- **Background** — solid color, gradient, or a custom IMAGE. Build 1080×1920 (9:16,
  the mobile bio shape). CRITICAL: the page overlays title + bio + BUTTONS on top, so
  put art/title in the TOP ~third and leave the middle-to-lower ~60% as clean brand
  texture (grid/flat) so buttons sit on empty space, not on the characters.
- **Optional wide cover banner** — some SmartLink layouts use a wide header instead of
  a round avatar. Build 1640×624 (same as the FB-cover size), copy left/center-safe,
  characters pushed to the far right.
- **Title / bio text + button colors** — picked in the editor, NOT baked into images.
  Give Joe the hex list to type in.

## Build recipe (SI sticker-pop example, fully verified)
Render with the standard headless-Chrome pipeline (forward-slash paths, temp→`mv -f`,
size-check). Save under `BrandAssets/{Brand}/SmartLink/{BRAND}_SmartLink_{avatar|background|banner}_v{N}.{html,png}`.
- Yellow `#FDE801` + black graph-paper grid (`linear-gradient` 2px lines, 60–64px
  cell); soft white radial ground-glow behind the duo cutout so it doesn't float;
  green `#16A34A` kicker pill (`-2deg`, hard border + offset shadow); Oswald caps
  title; near-black `#15151F` footer band carrying `successfulidiots.ai`.
- Avatar: use a SQUARER duo cutout (`SI_char_duo_thumbsup_point_T.png` 996×880) so it
  fits the circle better than the WIDE `_at_mic_T.png` (963×581).
- Background/banner: the wide `_at_mic_T.png` is fine because it sits in a wide zone.

## Editor recipe to hand Joe (SI palette)
- Background type = Image → upload the 1080×1920 background (or solid `#FDE801`).
- Avatar → upload the 1080×1080.
- Button background `#15151F`, button text `#FDE801` (or white), title text `#15151F`,
  accent/secondary `#16A34A`. Square/slightly-rounded buttons with a hard border = the
  sticker-pop look.
- Note to Joe: the background already carries the title+characters up top, so keep the
  editor title text minimal or off to avoid doubling up.

## Per-brand spine still applies
SI = yellow/green/navy sticker-pop OR dark CASE FILE (navy+dot-grid+yellow/green). SM =
navy+electric-blue editorial. JD = navy+electric-blue+mono. Confirm the look with
`clarify` before rendering (Joe picked bright sticker-pop for the SI SmartLink). Same
golden rules as feed posters: humanize any baked-in text, vision-QA every render
(circle-safe? open button zone? footer band clean? no white-line artifacts on cutout?).
