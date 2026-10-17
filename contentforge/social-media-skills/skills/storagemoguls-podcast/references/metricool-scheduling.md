# Metricool scheduling — verified worked recipe (SM Ep10 posters, July 2026; video + resume shapes added Ep11)

The end-to-end path from finished posters + captions to scheduled Metricool drafts.
SM brand `6425193` = LinkedIn + Instagram + Facebook only (no X). All 12 Ep10 posts
(4 ideas × 3 platforms) scheduled clean with the shapes below.

## 0. Preconditions
- MCP loads at STARTUP. If `mcp_metricool_*` tools are present, schedule in-session — don't
  make the user restart. If absent: `hermes config set mcp_servers.metricool.enabled true`,
  user opens a new chat, then the tools are live.
- Confirm the tools loaded + get the brand's connected networks + timezone with
  `getBrandSettings` (no args). SM = id `6425193`, tz `America/New_York`,
  networksData shows linkedin/instagram/facebook, NO twitter.

## ⛔ ROUTE BY BRAND — personal content goes to JOE'S PERSONAL Metricool brand, NOT `6425193` (Joe, Ep10 July 2026)
`6425193` is the STORAGE MOGULS brand. Joe ALSO has his own PERSONAL brand connected in Metricool.
When the content is Joe's personal (joedowns.ai footer, "join my community" CTA, "for his socials"),
it schedules to his PERSONAL brand, not the SM brand. ⛔ Do NOT assume the only connected brand is
SM and do NOT ask Joe "is there a personal account?" — he pushed back hard: *"what sort of question
are you asking, dont you know metricool has Joes account?"* Instead: call `getBrandSettings` (returns
ALL connected brands with their ids) and PICK the personal one by name. Only ask which brand if the
returned list is genuinely ambiguous. The SM-specific `6425193` / `America/New_York` shapes below
apply to whichever brand id you route to — swap the id.

### Metricool MCP transport DOWN (Ep10) — don't loop, wait, then browser-auth
`getBrandSettings` can return `{"error":"MCP server 'metricool' transport is down; reconnect
requested. Do NOT retry immediately"}`. Handling that worked: (1) do NOT hammer it — the runtime
flags a `repeated_exact_failure_warning` loop after ~2-3 identical retries; (2) `sleep ~20s` and try
once more; (3) if still down, Joe's fix was *"just open browser window to authenticate"* —
`browser_navigate https://app.metricool.com/` and let JOE log in (Google/Facebook/email; do NOT enter
his credentials). Browser login authenticates the web app; the MCP token is separate, so browser
login may or may not revive the MCP — if the MCP stays down, fall back to scheduling the drafts
manually IN the browser planner. Dates: use Python `zoneinfo` to compute the real target days (e.g.
"next week Mon–Thu" = next Monday strictly after today through Thursday, in `America/New_York`).

## 1. Upload posters to Cloudinary → get secure_url
Creds live in `BrandAssets/_scripts/upload_jd_posters.py` (cloud `dhi6klgd0`).
`pip install cloudinary` if the import fails (it's not always present in the git-bash python).
```python
import cloudinary, cloudinary.uploader, json
cloudinary.config(cloud_name='dhi6klgd0', api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"], secure=True)
r = cloudinary.uploader.upload('edu1_never_money.png',
    public_id='SM_Ep10_edu1_never_money', overwrite=True)
print(r['secure_url'])   # -> https://res.cloudinary.com/dhi6klgd0/image/upload/vNNN/SM_Ep10_edu1_never_money.png
```
Put that `secure_url` in `info.media` — Metricool re-hosts the bytes to `static.metricool.com`.

## 2. createScheduledPost — the arg shapes that actually work
⛔ Top-level `date` needs a REAL ET offset or it errors `could not be parsed at index 19`.
   EDT (Mar–Nov) = `-04:00`, EST (Nov–Mar) = `-05:00`.
⛔ NO `user_intent` arg (breaks schema).
⛔ Nested `info.publicationDate.dateTime` is offset-free + carries `timezone`.
Schedule as `draft:true`. One call per platform (same time across networks = no collision).

LinkedIn:
```
blogId "6425193"
date   "2026-07-03T12:00:00-04:00"
info   {"autoPublish":true,"draft":true,
        "media":["https://res.cloudinary.com/dhi6klgd0/image/upload/vNNN/....png"],
        "providers":[{"network":"linkedin"}],
        "publicationDate":{"dateTime":"2026-07-03T12:00:00","timezone":"America/New_York"},
        "text":"...caption...",
        "linkedinData":{"documentTitle":"","previewIncluded":true,"type":"post"}}
```
Instagram: `"providers":[{"network":"instagram"}]` + `"instagramData":{"type":"POST","showReelOnFeed":true}`
Facebook:  `"providers":[{"network":"facebook"}]`  + `"facebookData":{"type":"POST"}`

### VIDEO posts (verified Ep11, July 2026 — a batch mixing 4 videos + 5 posters)
When the media is an mp4 (the `/Promos` hook-wrapped clips), the ONLY change from an image post
is the per-network `type`, and you can fire all 3 networks in ONE `createScheduledPost` call by
listing all three providers together (verified — no need for one call per network):
```
"providers":[{"network":"linkedin"},{"network":"instagram"},{"network":"facebook"}]
"linkedinData":{"documentTitle":"","previewIncluded":true,"type":"post"}   # LI: same "post"
"instagramData":{"type":"REEL","showReelOnFeed":true}                       # IG: REEL for video
"facebookData":{"type":"REEL"}                                              # FB: REEL for video
"media":["https://res.cloudinary.com/dhi6klgd0/video/upload/vNNN/....mp4"]  # /video/upload/ path
```
Posters in the SAME batch keep `instagramData.type:"POST"` + `facebookData.type:"POST"`. The
return shows `media:["https://static.metricool.com/planner/...mp4"]` (an `.mp4` = video rehosted
OK). Do NOT include a `twitterData` block — SM has no X connected and a stray `twitterData` from a
copied payload hard-errors `networkData contains data for network 'twitter' not listed in providers`.

### Resume a PRE-STAGED plan + reschedule to a new start day (verified Ep11, July 2026)
Common flow: a prior session built everything and wrote a `SCHEDULE_READY.md` + Cloudinary
manifest, but couldn't push (Metricool tools weren't loaded that session). On resume Joe often
also changes the start ("do it starting tomorrow at 8am"). Steps:
1. Read the staged `SM_Ep<NN>/SCHEDULE_READY.md` (captions + slug→type map) and the manifest
   `BrandAssets/_manifests/SM_Ep<NN>_manifest.json` (slug→Cloudinary secure_url). Everything is
   already uploaded — do NOT re-upload.
2. `getBrandSettings` to confirm the tools loaded this session (they usually have, if enabled at
   startup — don't tell Joe to restart again).
3. Print real ET now with `zoneinfo`, then RE-LAY the staged slugs onto the new start. Keep the
   staged cadence shape (video+poster mix each day, 3 ideas/day at 8am / 12pm / 4pm ET, >3hr
   same-platform gaps, daytime only). "Starting tomorrow at 8am" = day+1 08:00 as slot 1.
4. Fire the create calls straight from the manifest URLs (video shapes above for the mp4 slugs,
   poster shapes for the png slugs), then the getScheduledPosts sweep.
Cheap to redo — you're just building fresh `date`/`publicationDate` values over staged content;
no asset regeneration.

Each successful call returns `data.id`, `data.uuid`, a `plannerUrl`, and
`media:["https://static.metricool.com/planner/...png"]` — the static.metricool URL is the
proof it rehosted. Show Joe the plannerUrl.

## 3. Final collision / dupe / gap sweep (mandatory — Joe QAs the planner himself)
```
getScheduledPosts
  brandId  "6425193"            # NOTE: brandId, NOT blogId (blogId fails schema)
  fromDate "2026-07-03T00:00:00-04:00"   # offset required here too
  toDate   "2026-07-04T23:59:59-04:00"
  timezone "America/New_York"
```
Confirm exact expected count, no two same-network posts at the same minute, no gaps.

## TZ trap
Host clock = EAT (UTC+3), Metricool = ET. Use Python `zoneinfo` (`America/New_York`) to get
real ET before deciding whether a target slot (e.g. 8am ET) has already passed. On Ep10 it was
10am ET when scheduling started, so the 8am slot was gone → confirm the day-split with Joe.

## Cadence Joe uses
draft:true, one idea per day, all 3 platforms at the same time. Default 8am ET; but Joe sets
the split explicitly (Ep10: 2 ideas today at 12pm & 4pm, 2 tomorrow at 8am & 12pm). Place items
LITERALLY where he says — confirm the day/time split before pushing when a default slot passed.
