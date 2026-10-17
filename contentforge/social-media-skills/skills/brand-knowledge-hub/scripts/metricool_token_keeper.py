#!/usr/bin/env python3
"""
Metricool MCP token keeper.

WHY: Metricool issues a ~179s access token AND rotates the refresh token on every
refresh (each refresh invalidates the previous refresh token). Hermes' MCP client
pops a browser re-auth whenever it finds an expired/invalid token. If a rotated
refresh token is ever not persisted, the next refresh fails -> browser popup loop.

FIX: proactively refresh at ~half-life and atomically persist the FULL rotated
token set (new access_token + new refresh_token + computed expires_at). This keeps
the on-disk token always-valid, so the MCP client never needs to refresh or
re-auth -> no popups.

RUN WITH: C:/Python313/python.exe (stdlib only; any Python 3 works).
    python metricool_token_keeper.py          # run forever (background keeper)
    python metricool_token_keeper.py --once    # single refresh + persist, then exit

NOTE: a manual refresh CONSUMES the on-disk refresh token (rotation). If the RT is
already dead you'll get HTTP 400 invalid_grant -> reseed once with
`hermes mcp login metricool` (PTY, complete login in the same live window).
"""
import json, urllib.request, urllib.parse, urllib.error, time, os, tempfile, sys

BASE = r"C:\Users\somea\AppData\Local\hermes\profiles\joeagent\mcp-tokens"
TOKPATH = os.path.join(BASE, "metricool.json")
CLIENTPATH = os.path.join(BASE, "metricool.client.json")
METAPATH = os.path.join(BASE, "metricool.meta.json")

REFRESH_MARGIN = 0.45   # refresh when <45% of lifetime remains
MIN_SLEEP = 20          # never sleep less than this
MAX_SLEEP = 120         # never sleep more than this


def load(p):
    with open(p) as f:
        return json.load(f)


def atomic_write(path, obj):
    d = os.path.dirname(path)
    fd, tmp = tempfile.mkstemp(dir=d)
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(obj, f, indent=2)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.remove(tmp)
        raise


def refresh_once():
    tok = load(TOKPATH)
    client = load(CLIENTPATH)
    meta = load(METAPATH)
    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": tok["refresh_token"],
        "client_id": client["client_id"],
    }).encode()
    req = urllib.request.Request(
        meta["token_endpoint"], data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp = json.loads(urllib.request.urlopen(req, timeout=20).read())
    merged = dict(tok)            # preserve fields the server didn't echo back
    merged.update(resp)
    merged["expires_at"] = time.time() + int(resp.get("expires_in", 179))
    atomic_write(TOKPATH, merged)
    return merged


def main():
    once = "--once" in sys.argv
    while True:
        try:
            tok = load(TOKPATH)
            life = int(tok.get("expires_in", 179))
            exp = float(tok.get("expires_at", 0))
            remain = exp - time.time()
            if remain <= life * REFRESH_MARGIN:
                merged = refresh_once()
                print(f"[keeper] refreshed; new RT ...{merged['refresh_token'][-6:]} "
                      f"valid {int(merged['expires_at']-time.time())}s", flush=True)
                if once:
                    return 0
                sleep = max(MIN_SLEEP, min(MAX_SLEEP, life * REFRESH_MARGIN))
            else:
                if once:
                    print(f"[keeper] token still valid {int(remain)}s; no refresh needed", flush=True)
                    return 0
                sleep = max(MIN_SLEEP, min(MAX_SLEEP, remain - life * REFRESH_MARGIN))
            time.sleep(sleep)
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:200]
            print(f"[keeper] HTTP {e.code} {body} -- refresh token likely dead; "
                  f"reseed once with `hermes mcp login metricool`.", flush=True)
            return 2
        except FileNotFoundError as e:
            print(f"[keeper] token file missing: {e}", flush=True)
            return 3
        except Exception as e:
            print(f"[keeper] error: {type(e).__name__}: {e}", flush=True)
            if once:
                return 1
            time.sleep(MIN_SLEEP)


if __name__ == "__main__":
    sys.exit(main())
