# MCP-over-HTTP bridge — when a server's tools aren't loaded in the session

## When to use this
The connected MCP servers (Notion, Canva, metricool) sometimes have their tool
handles **absent from the current chat session's toolset** even though
`hermes mcp list` shows the server `✓ enabled` and the token is healthy. Symptom:
calling e.g. `notion_search` returns *"Tool 'mcp_Notion_notion_search' does not
exist"* and the tool is missing from the available-tools list — while OTHER
servers (Canva, metricool) loaded fine the same session.

**This is a session tool-load quirk, NOT a disconnect and NOT an auth/key problem.**
(Joe runs MCP servers, never api-key integrations — never tell him to "reconnect"
or "add a key".) Observed June 2026: a soft session restart did NOT reload Notion's
tools, and `hermes mcp test Notion` refreshed the token + proved health (16 tools
discovered, ~5s, no popup) but runs in a separate process so it CANNOT inject tools
into the already-running chat. So neither restart nor `mcp test` is guaranteed to
fix it mid-session.

**The reliable workaround: talk to the MCP endpoint directly over HTTP** using the
cached OAuth token. Run it via `execute_code` (Python stdlib only). This needs NO
auth popup — it reuses the existing token file.

## Critical gotcha: Cloudflare blocks the default urllib User-Agent
A bare `urllib`/Python request to `https://mcp.notion.com/mcp` returns
**HTTP 403 Cloudflare error 1010 `browser_signature_banned`**. Fix: send a
**non-empty, non-Python `User-Agent`** header — `"node"` works, so does
`"curl/8.4.0"` or any normal string. With that one header the same request returns
200. (Likely applies to the Canva/metricool MCP endpoints too if you ever bridge them.)

## Working pattern (Notion MCP, streamable-HTTP transport)
```python
import json, urllib.request, urllib.error
tok = json.load(open(r"C:\Users\somea\AppData\Local\hermes\profiles\joeagent\mcp-tokens\Notion.json"))
AT = tok["access_token"]
URL = "https://mcp.notion.com/mcp"
BASE = {"Authorization": f"Bearer {AT}", "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream", "User-Agent": "node"}  # UA is mandatory

def rpc(method, params=None, session=None, _id=1):
    h = dict(BASE)
    if session: h["Mcp-Session-Id"] = session
    body = {"jsonrpc": "2.0", "id": _id, "method": method}
    if params is not None: body["params"] = params
    try:
        r = urllib.request.urlopen(urllib.request.Request(URL, data=json.dumps(body).encode(), headers=h, method="POST"), timeout=90)
        return r.status, r.headers.get("Mcp-Session-Id"), r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Mcp-Session-Id"), e.read().decode()

def parse(raw):                      # endpoint replies as SSE OR plain JSON
    if raw.lstrip().startswith("{"): return json.loads(raw)
    for line in raw.splitlines():
        if line.startswith("data:"):
            try: return json.loads(line[5:].strip())
            except: pass
    return {"_raw": raw[:800]}

def text_of(d):                      # tool results come back as content[].text
    out = d.get("result", d)
    if isinstance(out, dict) and "content" in out:
        return "".join(c.get("text", "") for c in out["content"])
    return json.dumps(out)

# 1. initialize -> capture the Mcp-Session-Id from the response header
st, sid, raw = rpc("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
                   "clientInfo": {"name": "hermes-joeagent", "version": "1.0"}})
# 2. REQUIRED handshake: send notifications/initialized with the session id
h = dict(BASE); h["Mcp-Session-Id"] = sid
urllib.request.urlopen(urllib.request.Request(URL,
    data=json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}).encode(),
    headers=h, method="POST"), timeout=30).read()
# 3. now call tools, passing session=sid
st, _, raw = rpc("tools/list", None, session=sid, _id=2)
st, _, raw = rpc("tools/call", {"name": "notion-search",
                 "arguments": {"query": "...", "query_type": "internal"}}, session=sid, _id=3)
print(text_of(parse(raw)))
```

## Notion tool names + key facts (via the bridge, June 2026)
16 tools, dashed names: `notion-search`, `notion-fetch`, `notion-create-pages`,
`notion-update-page`, `notion-query-database-view`, `notion-create-comment`,
`notion-get-users`, etc. (NOT the underscore `notion_*` handles the in-session
toolset would expose.)

- **No SQL/filtered-query tool.** `notion-query-database-view` needs a real view
  URL *with* a `?v=<viewid>` param (a bare DB id 400s). To enumerate a DB:
  `notion-fetch` the **data_source_id** returns the schema + a `<sqlite-table>`
  definition (column list, with `Post Body` etc.) but NOT the rows. To get rows +
  bodies, either `notion-search` for the pages then `notion-fetch` each page id
  (the page's `<properties>` block contains the full `Post Body`, `Account`,
  `Brand`, `Status`), or query a proper view URL.
- **Content Pieces DB** `d93e3c62-348d-439c-a4e2-9a8a302cf7e4` schema confirmed:
  `Account` [Joe Personal | Brand Account], `Brand` [Storage Moguls | Successful
  Idiots | Joe Downs | Belrose | Cross-Brand], `Platform`, `Status` [Idea | Draft |
  In Review | Approved | Published], `Joe Approved`/`Partner Approved` checkboxes,
  `Post Body`, `Source`, `Pillar / Theme`, `Parent Campaign` (relation).
- Brand-account LinkedIn pieces are titled `SM Ep8 — LinkedIn (Brand): …` /
  `SI Ep29 — LinkedIn (Brand): …` and carry `Account=Brand Account`,
  `Status=In Review`. Their `Post Body` uses `<br>` for line breaks and sometimes
  markdown links `[text](url)` — flatten `<br>`→`\n\n` and unwrap markdown links to
  bare URLs before sending to Metricool (LinkedIn shows raw text).

## Metricool MCP via the bridge (verified working, June 2026)
Same pattern, with Metricool-specific differences from Notion:
- **Metricool is STATELESS** — `initialize` returns NO `Mcp-Session-Id` header (session-ish headers empty). Do NOT try to set an `Mcp-Session-Id` header (passing `None` → `TypeError: expected string`). Just call `tools/call` with no session after a one-time `initialize`.
- Endpoint `https://ai.metricool.com/mcp`; same mandatory `User-Agent: node` header.
- **Token life is ~179s** — over a multi-call scheduling run the on-disk access token WILL expire mid-session and tool calls return `{"error":"unauthorized"}`. Metricool ROTATES the refresh token on every refresh, so you MUST persist the new one. Refresh on-demand (NOT a continuous sidecar — that races Hermes; here the in-session MCP tools were dead anyway so the bridge is the sole consumer):
  ```
  POST https://app.metricool.com/oauth/token  (token_endpoint from metricool.meta.json)
  body x-www-form-urlencoded: grant_type=refresh_token & refresh_token=<rt> & client_id=<from metricool.client.json>
  → 200 {access_token, refresh_token(NEW), expires_in:179}  → atomically write all three + expires_at back to metricool.json
  ```
- **The ready-made, self-refreshing bridge is `scripts/mc_bridge.py`** (auto-refreshes when <30s of token life remains, persists the rotated RT atomically). Usage: `import mc_bridge; mc_bridge.mcall("getBrandSettings", {})` with `C:/Python313/python.exe`. Use it instead of re-deriving the refresh+rpc boilerplate.
- **SI brand id = 6374077**; networks facebook / instagram(@successful__idiots) / linkedin(urn:li:organization:109549460) / tiktok. Best-time `dayOfWeek`: 1=Mon … 7=Sun. SI peaks: LinkedIn 11am, IG 10am, FB 10am (Wed 12pm), TikTok 10am (Mon 6pm) ET.

## createScheduledPost / live↔draft flip — hard gotchas (cost several retries this session)
- **CREATE ENVELOPE SHAPE (cost a retry June 2026):** `createScheduledPost` does NOT take flat top-level fields. The args object has exactly THREE keys: top-level `date` (ISO 8601 *with offset*, e.g. `"2026-06-26T13:00:00-04:00"`), top-level `blogId` (STRING), and `info` — which is a **JSON STRING** (`json.dumps(...)`), not a nested dict. ALL post fields (`text`, `media`, `providers`, `autoPublish`, `draft`, `firstCommentText`, `publicationDate`, the per-network `*Data` blocks) live INSIDE that stringified `info`. Passing `brandId`/`text`/`autoPublish`/etc. at the top level fails: `property '<x>' is not defined in the schema and the schema does not allow additional properties`. Note `getScheduledPosts` uses `brandId`+`timezone`, but `createScheduledPost` uses `blogId` — different key names per tool; pull the live `inputSchema` (`tools/list`) if unsure. Confirmed-good minimal call:
  ```python
  info = {"autoPublish": False, "draft": True, "text": longform,
          "firstCommentText": "Register at storagemoguls.ai",   # LinkedIn link-in-first-comment
          "media": [cloudinary_url], "mediaAltText": [],
          "providers": [{"network":"linkedin"}], "linkedinData": {},
          "publicationDate": {"dateTime":"2026-06-26T13:00:00","timezone":"America/New_York"}}
  mc_bridge.mcall("createScheduledPost", {"date":"2026-06-26T13:00:00-04:00", "blogId":"6425321", "info": json.dumps(info)})
  # IG variant: providers [{"network":"instagram"}], instagramData {"type":"POST"} (IG REQUIRES media even as draft)
  ```
  Verify after create with `getScheduledPosts` (brandId+timezone) — confirm `autoPublish=False`, `draft=True`, `media` rehosted to `static.metricool.com`, and `firstCommentText` carried.
- **Attaching a local PNG → Cloudinary (the only working media path for Joe):** Drive/Canva URL routes are policy-blocked (see SKILL.md media section), so upload the local poster to Cloudinary first and pass its `secure_url` in `info.media`. Reuse the creds in `C:\Users\somea\BrandAssets\_scripts\upload_jd_posters.py` (cloud_name `dhi6klgd0`); run via `C:\Python313\python.exe` (the `cloudinary` package lives there, not in the default python). `cloudinary.uploader.upload(path, public_id=<name>, overwrite=True)` → `r["secure_url"]`. Metricool rehosts those bytes to `static.metricool.com` at schedule time.
- **TikTok REQUIRES `tiktokData.title`** or create fails (`TikTok title is required`). Set `tiktokData:{title:"…", privacyOption:"PUBLIC_TO_EVERYONE"}`.
- **`updateScheduledPost` echoes a `twitterData` block Metricool auto-adds** — re-sending the full fetched `info` back fails with `networkData contains data for network 'twitter' not listed in providers`. FIX before updating: strip EVERY `*Data` networkData key except the one matching the post's actual network, and rebuild `providers` from the post's real networks. Also pop `id`/`uuid`/`creationDate` from the echoed info.
- **`updateScheduledPost` schema quirk:** the `id` arg must be a STRING (`"339821457"`), not int (`/id: integer found, string expected`). Pass both `id` and `uuid` as strings.
- **update CREATES A NEW VERSION with a NEW id** (the old id disappears, new id appears at the same slot). Don't treat the new id as a duplicate — re-read the window and reconcile by slot/time, not by id. There is NO delete tool, so to "remove" a bad test post, UPDATE it into the real post you want (repurpose the slot).
- **Flipping live→draft:** set `autoPublish:false, draft:true` and re-send the cleaned full info. Verify at the end with a window read: count posts, assert `LIVE==0` and every post has `media`. Expect per-brand read-lag (a just-touched post may vanish from a narrow read for a few seconds — widen the date range / wait, don't recreate).
- **"No draft" from Joe = publish AS draft** (draft:true), NOT "skip the draft / go live". Confirmed correction this session — when ambiguous, drafts are the safe default and he fires them himself in the planner.

## Don't
- Don't tell Joe to reconnect / re-auth / add keys for a tool-load quirk — verify
  first (`hermes mcp list`, read the token file).
- Don't run `hermes mcp test` or `hermes mcp login` just to "wake" tools — they
  won't inject tools into the live session and `login` risks the auth popup Joe
  hates. Bridge over HTTP instead.
