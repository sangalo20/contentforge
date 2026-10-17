# Cross-platform unified posting + researched best-times (Metricool)

Joe's rule (June 2026): **one post → all pages, same caption + same image, for consistency.**
NOT per-platform variants. TikTok opt-in only. This ref is the mechanics for that workflow.

## 1. Build a UNIFIED multi-provider post
A single `createScheduledPost` with multiple providers fans the SAME content to every page.
Each listed network needs its matching `*Data` block present, and NO foreign `*Data` block (see pitfall).

```python
info = {
  "autoPublish": False, "draft": True,              # drafts unless Joe says go live
  "providers": [{"network":"linkedin"},{"network":"instagram"},{"network":"facebook"}],
  "text": CAPTION,                                  # identical across all 3
  "media": [PUBLIC_IMAGE_URL],                       # identical across all 3 (Cloudinary secure_url)
  "linkedinData": {}, "instagramData": {"type":"POST"}, "facebookData": {"type":"POST"},
  "publicationDate": {"dateTime": "2026-06-21T11:00:00", "timezone": "America/New_York"},
}
mcall("createScheduledPost", {"date":"2026-06-21T11:00:00-04:00", "blogId":"6374077", "info": json.dumps(info)})
```
- Instagram REQUIRES media even in a unified draft — so a unified post that includes IG must carry an image URL (host on Cloudinary, see metricool-media-and-auth.md / mc_bridge usage).
- Verified result reads back as `providers: [facebook, instagram, linkedin]` with one `media[...].png`.

## 2. Researched best-times — the BLENDED method (don't guess an hour)
When the post hits 3 networks at once, pick the hour strong across ALL three, not one network's peak.
```python
# pull getBestTimeToPostByNetwork per network for the date window, then:
# normalize each network's hours to its own daily max (0..1), SUM across networks per hour (max 3.0)
blended.setdefault(day,{}).setdefault(hour,0); blended[day][hour] += value/daily_max
# rank; pick top for slot 1, then the best slot >=4-5h away for slot 2 (avoid same-feed cannibalization)
```
**SI findings (June 2026), blended max 3.0:**
- 11:00 AM ET = universal #1 every day (Sun 2.72, Mon 2.86, Tue 2.87, Wed 2.86). LinkedIn's sharp peak + top IG/FB.
- 12–1 PM ranks high but only 1–2h after 11 → cannibalizes → DO NOT use as 2nd slot.
- ~6:00 PM ET = the real 2nd wave (IG/FB evening; LinkedIn weak then but harmless). Sun/Mon/Tue ~2.0–2.2; Wed evening softer (~1.8, 5 PM ≈ 6 PM).
- Cadence: multiple posts/day is allowed. 2/day at **11 AM + 6 PM**, distinct content per slot, is the proven spread.

## 3. Draft ↔ live flip + edit pitfalls (learned the hard way this session)
- **"No draft" from Joe = publish AS a draft** (draft:true, autoPublish:false), NOT "skip the draft / go live." If ambiguous, confirm — going live is irreversible/public.
- **No delete tool exists.** To remove unwanted drafts you must do it in the planner UI (give Joe the IDs + `https://app.metricool.com/planner/calendar?blogId=<id>`). `updateScheduledPost` is create-a-new-version under the hood: it returns a NEW id and supersedes the old row, so a flip/edit loop CHURNS ids — always re-read after and reconcile by re-fetching the whole window with `extendedRange:true`.
- **`updateScheduledPost` echo payload carries a `twitterData` (and other) block Metricool auto-adds.** Re-submitting the full echoed `info` as-is fails: `networkData contains data for network 'twitter' not listed in providers`. FIX: before updating, strip every `*Data` block EXCEPT the ones matching the post's actual providers, and rebuild `providers` from the original networks.
- **`updateScheduledPost` can reject the id as the wrong type:** `structuredContent does not match tool outputSchema: /id: integer found, string expected`. Pass `id` as a STRING. If an update keeps failing on a post, a clean `createScheduledPost` of the corrected post (then delete the stale one in UI) is more reliable than fighting the update.
- **TikTok create needs `tiktokData.title`** or it errors `TikTok title is required` (plus a video in `media`). That's why TikTok can't simply join the unified image-only payload.
- After any bulk create/flip, do a final reconcile read and report exact counts: TOTAL / LIVE / NO-IMG / providers-per-post. Don't claim "all set" without the read; and given read-lag, wait a few seconds + use extendedRange before concluding posts are missing.

## 4. Reusable bridge
`mc_bridge.py` (scripts/) self-refreshes the ~179s rotating token on each call and is stateless — use it for all of the above when in-session MCP tools are absent. Run with `C:/Python313/python.exe`.
