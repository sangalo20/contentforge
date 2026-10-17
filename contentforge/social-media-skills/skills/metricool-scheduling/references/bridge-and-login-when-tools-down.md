# Scheduling when the in-session Metricool tools are "not connected"

Verified working June 2026. Use this when `getBrandSettings`/`createScheduledPost` etc.
return `MCP server 'metricool' is not connected` mid-session but a real scheduling
task must proceed. This is the tool-LOAD/short-token hiccup, NOT a credentials problem —
do NOT tell Joe to add keys.

## Two independent fixes you'll usually need together

### 1. Re-auth that actually completes (the 40s probe kills the normal flow)
`hermes mcp login metricool` in a PTY often prints
`✗ Authentication failed: MCP call timed out after 40.0s` — the connect PROBE giving up
mid-handshake (the `connect_timeout 120` config fix only applies after a session restart,
so a running CLI still uses 40s). The OAuth listener may die with it before Joe finishes.

**Fix that worked:** relaunch login with env-var timeout overrides so the probe doesn't fire:
```
HERMES_MCP_TIMEOUT=300 HERMES_MCP_CONNECT_TIMEOUT=300 MCP_TIMEOUT=300 hermes mcp login metricool
```
(PTY, background, watch_patterns ["Open this URL","Authenticated"]). With the longer timeout
the browser callback is captured and it prints `✓ Authenticated — 7 tool(s) available`.
The callback listener still catches the redirect even if you can't paste the URL back into a
dead PTY — completing the browser sign-in is what matters. Verify by reading the token file
(fresh `expires_at`, `refresh_token` present).

### 2. In-session tools STILL say "not connected" after a successful CLI login
The CLI login runs in a separate process; the chat session cached the dead connection and a
restart isn't always available. **Bridge over HTTP** instead (same idea as the Notion bridge,
but Metricool specifics differ):

- Endpoint `https://ai.metricool.com/mcp`, transport **streamable-HTTP but STATELESS** —
  `initialize` returns NO `Mcp-Session-Id` header and you do NOT need to send one on later
  calls (unlike Notion). Just `initialize` once, then `tools/call` directly.
- `User-Agent` header still mandatory (`"node"`), else Cloudflare 403.
- Access token lives only ~179s AND Metricool ROTATES the refresh token every refresh, so a
  multi-call scheduling session MUST refresh-and-persist on demand. Bake it into the bridge:
  before each call, if `expires_at - now < 30s`, POST the refresh grant and atomically write
  back the rotated token set. Token endpoint = `https://app.metricool.com/oauth/token`,
  `grant_type=refresh_token&refresh_token=<rt>&client_id=<from metricool.client.json>`,
  `Content-Type: application/x-www-form-urlencoded`. (This on-demand refresh in the bridge is
  the SOLE consumer when in-session tools are down, so it does NOT race Hermes — the
  "never run a sidecar refresher" rule is about a CONTINUOUS daemon racing the live MCP client,
  not this.)
- Working bridge: `C:\Users\somea\BrandAssets\_scripts\mc_bridge.py` — `from mc_bridge import mcall; mcall("getBrandSettings", {})`. Run with `C:/Python313/python.exe`. It self-refreshes.

## Confirmed SI brand for scheduling (June 2026)
- Successful Idiots brandId **6374077**, tz America/New_York. Networks: facebook (page
  872666572598473), instagram `successful__idiots`, linkedin org 109549460, tiktok.
- Best-times pulled via `getBestTimeToPostByNetwork` (dow: 7=Sun,1=Mon,2=Tue,3=Wed):
  LinkedIn **11:00**, Instagram **10:00**, Facebook **10:00** (Wed 12:00), TikTok **10:00**
  (Mon 18:00) — all ET. One post/network/day at its peak is a clean spread.

## The media blocker that gates "schedule with images across all platforms"
Metricool's API `media:[url]` only accepts a TRULY PUBLIC byte-returning URL. Local files,
Drive, and Canva all fail (documented in metricool-media-and-auth.md). The working route is
**Cloudinary** (cloud `dhi6klgd0`) — BUT the api_secret file (`cloudinary_onboard.py`) can go
missing from the machine; without the secret you cannot upload, so you cannot auto-attach.
Also: **Instagram & TikTok REQUIRE media even on a draft** (hard error), while LinkedIn,
Facebook, and X are text-safe. So when Cloudinary is unavailable, the honest fork to offer Joe:
(A) schedule text-safe networks live + IG/TikTok as drafts for him to attach the PNG (~2 min
each, you hand him file→post mapping); (B) he restores the Cloudinary secret and you attach
everything; (C) LinkedIn+Facebook only now. Surface this with `clarify` — don't schedule 40
image posts that'll land imageless or hard-error.
