#!/bin/zsh
# End-to-end check through the deployed web app: sign in, resolve a YouTube title
# (Supadata), run the generation pipeline from that URL (backend -> Odin), and
# print stage events + result summary. Usage: ./e2e_youtube.sh [youtube_url]
set -euo pipefail
cd "$(dirname "$0")"
export CLOUDSDK_ACTIVE_CONFIG_NAME=gde
YT=${1:-'https://www.youtube.com/watch?v=aircAruvnKk'}
APP=$(terraform output -raw app_url)
API_KEY=$(terraform output -json firebase_web_config | python3 -c 'import json,sys;print(json.load(sys.stdin)["VITE_FIREBASE_API_KEY"])')
EMAIL=$(grep '^email=' .demo_credentials | cut -d= -f2-)
PW=$(grep '^password=' .demo_credentials | cut -d= -f2-)
TOKEN=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\",\"returnSecureToken\":true}" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["idToken"])')
echo "signed in as $EMAIL"
echo "title: $(curl -s -H "Authorization: Bearer $TOKEN" "$APP/api/sources/youtube-title?url=$YT")"
curl -sS -N -m 900 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -X POST "$APP/api/generate/content/stream" \
  -d "{\"workspaceId\":\"devfest-mauritius\",\"sources\":[{\"type\":\"youtube\",\"url\":\"$YT\"}]}" \
| python3 -c '
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line.startswith("data:"):
        continue
    try:
        ev = json.loads(line[5:])
    except Exception:
        print("raw", line[:160]); continue
    t = ev.get("type") or ev.get("event") or ""
    if t in ("stage", "status", "progress"):
        print("stage", ev.get("event") or ev.get("content") or ev.get("message"))
    elif t in ("result", "done", "complete"):
        d = ev.get("data") or ev.get("item") or ev
        print("RESULT id", d.get("id") or d.get("itemId"), "| title:", (d.get("title") or "")[:80],
              "| draft chars", len(d.get("draft") or d.get("content") or ""))
    elif "error" in t.lower():
        print("ERROR", ev)
    else:
        print("ev", t, str(ev)[:140])
'
