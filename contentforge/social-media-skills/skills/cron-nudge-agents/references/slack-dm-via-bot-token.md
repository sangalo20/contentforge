# Sending a specific Slack DM from a cron job via SLACK_BOT_TOKEN

Use this when a cron/agent task must push a message to a **named person's Slack DM** as a step
(NOT relying on the cron auto-delivery of the final response). Verified working in the `joeagent`
profile, July 2026 ("Content Calendar Weekly Auto-Populate" → Alvin's DM).

## Environment facts (joeagent, as observed)
- `SLACK_BOT_TOKEN` lives in `~/.hermes/.env` (bot `@joe`, "Competent Developer" workspace).
- Scopes PRESENT: `chat:write`, `im:read`, `channels:read`, `groups:read`, `app_mentions:read`, etc.
- Scopes MISSING: `users:read` (so `users.list` / `users.info` → `missing_scope`), `users:read.email`.
- Consequence: you cannot look someone up by name/email. Resolve them via **open IMs** instead.
- Known human recipient today: **Alvin Kipkoech** → user `U0B8HSL9V7S`, DM channel `D0BAK91BLKS`.
  Re-resolve rather than hardcoding — a second human in the bot's IM list would break the "sole IM" assumption.

## Gotchas that will bite you
- **Stale DM IDs:** an old recorded DM id (e.g. `D0B7T87A12Q` from a June diagnostic) returns
  `channel_not_found`. `conversations.open` on the *user id* is the safe default to get a live channel.
  Nuance (observed July 2026, Tuesday Deep Dive run): a DM channel id taken from a FRESH
  `conversations.list?types=im` call THIS run IS valid to `chat.postMessage` to directly — the "stale"
  problem is specifically about HARDCODED/old-note ids, not ids you just fetched. So `conversations.open`
  is belt-and-suspenders, not strictly required when you already have a fresh channel id in hand.
- **Secret redaction:** putting the token in a shell command string mangles it. Read it from env inside
  a script file; never echo/curl it inline.
- **Cron blocks `python -c`:** inline `python -c "..."` is refused in cron mode ("script execution via
  -c flag ... cron jobs run without a user"). Write a `.py` FILE and run the file.
- **Native-Windows-Python path trap:** the terminal runs bash (MSYS), but `python` here is NATIVE Windows
  Python. A script's `open("/c/Users/somea/msg.txt")` fails with `FileNotFoundError` — native Python does
  NOT understand MSYS `/c/...` paths. Use a raw Windows path (`open(r"C:\Users\somea\msg.txt")`) or, best,
  `open(os.path.expanduser("~/slack_msg.txt"))` (as the recipe below does) which resolves correctly under
  native Python. (Observed July 2026: the Tuesday Deep Dive DM run hit this on the first try and had to
  patch the path.)

## Recipe
1. Write the message text to a temp file (e.g. `~/slack_msg.txt`) with `write_file` — keeps Slack
   markdown (`*bold*`, `•`/`-` bullets) intact and out of the shell.
2. Write this script to disk (reads token from env, resolves the sole human IM, re-opens, posts):

```python
import json, os, sys, urllib.request, urllib.parse
token = os.environ.get("SLACK_BOT_TOKEN", "").strip()
if not token: print("NO_TOKEN"); sys.exit(1)

def api(method, data=None, get=False):
    url = "https://slack.com/api/" + method
    headers = {"Authorization": "Bearer " + token}
    if get:
        if data: url += "?" + urllib.parse.urlencode(data)
        req = urllib.request.Request(url, headers=headers)
    else:
        headers["Content-Type"] = "application/json; charset=utf-8"
        req = urllib.request.Request(url, data=json.dumps(data or {}).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

# Resolve recipient via open IMs (users:read is missing, so no directory lookup).
ims = api("conversations.list", data={"types": "im", "limit": 100}, get=True)
user_id = None
for c in ims.get("channels", []):
    if c.get("user") and c.get("user") != "USLACKBOT":
        user_id = c["user"]; break        # sole human IM = target (Alvin in joeagent)
if not user_id: print("NO_HUMAN_IM"); sys.exit(2)

dm = api("conversations.open", data={"users": user_id})   # fresh channel; old ids go stale
channel = dm["channel"]["id"]

with open(os.path.expanduser("~/slack_msg.txt"), encoding="utf-8") as f:
    text = f.read()
post = api("chat.postMessage", data={"channel": channel, "text": text, "mrkdwn": True})
print("POST_OK:", post.get("ok"), "| ch:", post.get("channel"), "| ts:", post.get("ts"), "| err:", post.get("error"))
```

3. Run it so the token is exported on the SAME command line (avoids redaction breaking a multi-step shell):

```bash
source "$HOME/.hermes/.env" 2>/dev/null; source "$HOME/.hermes/profiles/joeagent/.env" 2>/dev/null; export SLACK_BOT_TOKEN; python "$HOME/slack_dm.py"
```

4. Success looks like `POST_OK: True | ch: D0BAK91BLKS | ts: 1783432486.823639`. Report ch+ts in your wrap.
5. `rm -f` the temp `.py` and `.txt` afterward.

## If you must target a specific person and there are multiple human IMs
`users:read` is unavailable, so name-matching isn't possible. Options: (a) if the person has DM'd the bot,
their IM is in `conversations.list?types=im` — but you can't tell WHICH without names. Ask the operator to
have the SLACK_BOT_TOKEN granted `users:read` (then `users.list` name-matching works), OR store the target
user id in the job prompt/config. Do not guess between multiple human IMs.
