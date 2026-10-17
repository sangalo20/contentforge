# Per-platform exact scheduling + batch episode-campaign pipeline (Metricool)

This is the **alternative to the unified single-post model** in `cross-platform-unified-posting.md`.
Both are valid; pick by intent (see "Which model" below). Proven end-to-end June 2026 on SI Ep030
(15 drafts: 5 ideas × LI/IG/FB, X held).

## Which model — unified vs per-platform-exact (ASK if unclear)
- **Unified** (one post → all pages, same caption+image): use when Joe says "one post to all pages / for consistency," or for a single ad-hoc piece. Cheaper, simpler.
- **Per-platform-exact** (separate post per network, each its OWN caption + OWN image, each fired at that network's own optimal time): use when the content was BUILT per-platform (distinct visual "species" + distinct copy per network), e.g. an idea-by-idea episode campaign. Joe explicitly chose this for Ep030 — "all with their different captions and images." Do NOT collapse purpose-built per-platform variants into a unified post.
- When the rule that applies isn't obvious from the ask, surface both with `clarify` rather than assuming — the older skill text called unified "locked," but Joe overrode it for purpose-built campaigns.

## Timing: "2 hrs before EACH platform's OWN best-time peak" (Joe rule, June 2026)
Joe wants the post to land just AHEAD of the surge, per network — NOT one blended slot, NOT at the peak.
Do NOT default to a memorized hour; pull `getBestTimeToPostByNetwork` per network and read each curve.
- Read each network's OWN top hours (don't blend/average them away for this model).
- Post time = that network's peak hour − 2.
- **SI observed peaks (June 2026):** LinkedIn peaks **11:00** (post **09:00**); Instagram + Facebook peak **10:00** (post **08:00**). Evening wave: IG/FB ~17:00 (post 15:00), LI ~18:00 (post 16:00).
- Joe's instinct "earlier is better" holds in the 8–10am band (already 85–90% of peak on IG/FB, rising on LI) — but pre-7am is genuinely weak (LI especially still climbing). The morning heat center for this pro/AI audience is 10–11am, so −2hr = 8–9am, not dawn.
- **Cadence:** 2 ideas/day is fine. AM idea at the −2hr morning slots, PM idea at the −2hr evening slots, ≥4h apart.

## ⚠️ HOSTED-SERVER API SHAPE CHANGED (verified June 2026, SI Ep031 — cost real time live)
The hosted Metricool MCP changed its tool schemas. The payloads below were written for the OLD shape; over the bridge the tools now reject the old args. Use THESE shapes:

- **`createScheduledPost`** wants exactly three top-level keys: **`blogId`** (string), **`date`** (full ISO w/ `-04:00` offset), and **`info`** — and `info` MUST be a **JSON-ENCODED STRING**, not a nested object. Do NOT pass `brandId`, `timezone`, `autoPublish`, or `draft` at the top level (they go INSIDE `info`). Verified working call:
  ```python
  info = {... full info dict incl. autoPublish/draft/media/providers/<net>Data/publicationDate/text ...}
  payload = {"blogId": "6374077", "date": "2026-06-29T12:00:00-04:00", "info": json.dumps(info)}
  mcall("createScheduledPost", payload)   # success → {"data":{"id":..., "publicationDate":{...}}}
  ```
  Probe trick to rediscover required keys if it changes again: `mcall("createScheduledPost", {})` returns `required property 'X' not found` for each missing key; `mcall(..., {"info": <object>})` returns `/info: object found, string expected` (that's the json.dumps tell).
- **`getScheduledPosts`** wants **`brandId` as a STRING** + **`timezone`** + **`fromDate`/`toDate`** (full ISO `-04:00`). NOT `blogId`, NOT `start`/`end`. Returns a JSON **string** with `{"data":[...]}` — `json.loads` it.
- The `mc_bridge.mcall` transport is unchanged; only the per-tool arg schemas moved. X/Twitter network name = `"twitter"`, `info["twitterData"]={}`; keep X ≤280 chars (a 5-line caption with the URL ran 283 once — trim).

## 🔑 TOKEN-BURST PATTERN — refresh `--once` in the SAME command as the create batch (verified June 2026)
Metricool's access token lives ~179s and rotates its refresh token, so a multi-call burst can die mid-way with `{"error":"invalid_grant"}` (hit twice this session between re-auth and the create call). FIX: run the token keeper `--once` and the create script **in one chained shell command** so the whole batch fires inside one fresh token window:
```
C:/Python313/python.exe ".../brand-knowledge-hub/scripts/metricool_token_keeper.py" --once >/dev/null 2>&1 && C:/Python313/python.exe sched_batch.py
```
Then for the VERIFY read, chain the keeper again. Do NOT re-auth via browser for an `invalid_grant` mid-session if a valid refresh_token is still on disk — the keeper `--once` reseeds it without a popup. Only `hermes mcp login` (browser) when the refresh token itself is dead.

## The batch pipeline (3 scripts, run with C:/Python313/python.exe)
1. **Upload all assets to Cloudinary once**, write results to a JSON map (`public_id → {url,type,file}`). Carousel = upload each slide separately (`..._s1..s5`); video = `resource_type="video"`. See `metricool-media-and-auth.md` for Cloudinary config + the upload pattern.
2. **Read URLs + captions from JSON**, build a `plan` list of `(idea, platform, date_iso_-04:00, media[list], type)`, create each draft via `mc_bridge.mcall("createScheduledPost", ...)`.
3. **Reconcile read** the whole window per day and assert media extensions are correct.

## Per-network payload shapes that WORKED via the bridge
```python
net = {"LI":"linkedin","IG":"instagram","FB":"facebook"}
info = {
  "autoPublish": False, "draft": True, "shortener": False,
  "media": media_list,                 # 1 url (static) | 5 urls (carousel) | 1 mp4 url (video)
  "mediaAltText": [], "smartLinkData": {"ids": []}, "descendants": [],
  "providers": [{"network": net[plat]}],
  "publicationDate": {"dateTime": date.split("-04:00")[0], "timezone": "America/New_York"},
  "text": caption,
}
# exactly ONE *Data block, matching the single provider:
# LinkedIn static/carousel:  info["linkedinData"]  = {}
# LinkedIn video (MP4):      info["linkedinData"]  = {"type":"post"}
# Instagram static/carousel: info["instagramData"] = {"type":"POST", "showReelOnFeed": True}
# Instagram video (MP4):     info["instagramData"] = {"type":"REEL", "showReelOnFeed": True}
# Facebook static/carousel:  info["facebookData"]  = {"type":"POST"}
# Facebook video (MP4):      info["facebookData"]  = {"type":"REEL"}
```
- **Carousel = just a media array of N image URLs** on a single instagram POST — no special carousel flag needed; reads back as `#media = 5`.
- **Same MP4 reused across LI/IG/FB** as the video asset (Idea-4 cheat-code animation). IG/FB use REEL type, LI uses a normal post with the mp4 in media.
- `date` arg keeps the `-04:00` offset; `publicationDate.dateTime` is the SAME timestamp WITHOUT the offset (Metricool wants both forms).

## Verify before claiming done (Joe expects this)
Re-fetch each day's window and print `date | network | #media | ext | id`. Assert:
- statics → `png`, carousel → `#media == 5`, video → `mp4`. **Any `.html` ext = broken Cloudinary fetch** (see media ref) — do NOT trust it.
- Report the planner URL `https://app.metricool.com/planner/calendar?blogId=<id>` so Joe can approve.

## Avoid the circuit-breaker: TEST ONE FIRST
Before firing the whole batch, create a SINGLE draft (e.g. idea1/LI) and read its media back to confirm payload shape + Cloudinary rehost. Only then run the rest. ~3 consecutive malformed calls trip Metricool's "unreachable after 3 consecutive failures" ~50s cooldown — fix the payload, don't re-fire. (No delete tool exists, so a successful test draft is kept and that one line is skipped in the batch run, not duplicated.)
