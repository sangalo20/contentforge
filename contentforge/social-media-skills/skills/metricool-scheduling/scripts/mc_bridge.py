"""Metricool MCP HTTP bridge (stateless) with on-demand token auto-refresh.

Why this exists: the in-session metricool_* MCP tools sometimes read "not connected"
even with a healthy token (session tool-load quirk). This talks to the Metricool MCP
endpoint directly over HTTP using the cached OAuth token, auto-refreshing it when it's
about to expire (~179s life, rotating refresh token persisted atomically).

Usage (run with C:/Python313/python.exe):
    import sys; sys.path.insert(0, r"C:\\Users\\somea\\BrandAssets\\_scripts")  # or this skill's scripts dir
    from mc_bridge import mcall
    print(mcall("getBrandSettings", {}))
    print(mcall("getScheduledPosts", {"brandId":"6374077",
        "fromDate":"2026-06-21T00:00:00-04:00","toDate":"2026-06-24T23:59:59-04:00",
        "timezone":"America/New_York"}))

Notes:
- Metricool MCP is STATELESS — no Mcp-Session-Id needed.
- User-Agent header is mandatory (Cloudflare blocks default urllib UA).
- Date args to get/createScheduledPost MUST carry an offset (-04:00 EDT / -05:00 EST).
- CID is the public PKCE client_id (also in metricool.client.json); refresh grant needs no secret.
"""
import json, urllib.request, urllib.error, urllib.parse, time, os, tempfile

TOKP = r"C:\Users\somea\AppData\Local\hermes\profiles\joeagent\mcp-tokens\metricool.json"
URL = "https://ai.metricool.com/mcp"
TE = "https://app.metricool.com/oauth/token"
CID = "client_986a627a1c2648b78072eeb0ee1642c2"  # re-read from metricool.client.json if it changes

def _refresh_if_needed():
    tok = json.load(open(TOKP))
    if float(tok.get("expires_at", 0)) - time.time() > 30:
        return
    data = urllib.parse.urlencode({"grant_type": "refresh_token",
        "refresh_token": tok["refresh_token"], "client_id": CID}).encode()
    req = urllib.request.Request(TE, data=data, method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded",
                 "Accept": "application/json", "User-Agent": "node"})
    new = json.loads(urllib.request.urlopen(req, timeout=30).read().decode())
    tok["access_token"] = new["access_token"]
    if new.get("refresh_token"): tok["refresh_token"] = new["refresh_token"]
    if new.get("expires_in"): tok["expires_at"] = time.time() + float(new["expires_in"]) - 10
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(TOKP), suffix=".tmp")
    with os.fdopen(fd, "w") as f: json.dump(tok, f, indent=2)
    os.replace(tmp, TOKP)

def _at():
    _refresh_if_needed()
    return json.load(open(TOKP))["access_token"]

def _hdrs():
    return {"Authorization": f"Bearer {_at()}", "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream", "User-Agent": "node"}

def _rpc(method, params=None, _id=1):
    body = {"jsonrpc": "2.0", "id": _id, "method": method}
    if params is not None: body["params"] = params
    try:
        r = urllib.request.urlopen(urllib.request.Request(URL, data=json.dumps(body).encode(),
            headers=_hdrs(), method="POST"), timeout=120)
        return r.read().decode()
    except urllib.error.HTTPError as e:
        return e.read().decode()

def _parse(raw):
    if raw.lstrip().startswith("{"): return json.loads(raw)
    for line in raw.splitlines():
        if line.startswith("data:"):
            try: return json.loads(line[5:].strip())
            except: pass
    return {"_raw": raw[:1000]}

_init_done = False
def _init():
    global _init_done
    if _init_done: return
    _rpc("initialize", {"protocolVersion": "2024-11-05", "capabilities": {},
         "clientInfo": {"name": "hermes-joeagent", "version": "1.0"}})
    _init_done = True

def mcall(tool, args, _id=99):
    """Call a Metricool MCP tool; return the text result (or JSON string)."""
    _init()
    raw = _rpc("tools/call", {"name": tool, "arguments": args}, _id)
    d = _parse(raw)
    out = d.get("result", d)
    if isinstance(out, dict) and "content" in out:
        return "".join(c.get("text", "") for c in out["content"])
    return json.dumps(out)

if __name__ == "__main__":
    print(mcall("getBrandSettings", {}))
