# Metricool media attach + OAuth (operational notes)

## DEFAULT POLICY — keep the connector OFF when not scheduling (Joe, verified Jun 2026)

**Joe's standing preference: the Metricool MCP stays DISABLED by default.** The popups (every few minutes, sometimes shorter) annoy him more than the convenience is worth when we're not actively scheduling/analyzing.

- **At the START of every session, ASK Joe: "Touching Metricool today?"**
  - If **NO** → leave it disabled, stay quiet about it.
  - If **YES** → enable it, and he restarts the session once (toggle needs a restart to load).
- Enable/disable (agent-guarded config — MUST use `hermes config set`, NOT patch/write_file):
  ```
  hermes config set mcp_servers.metricool.enabled false   # disable (default state)
  hermes config set mcp_servers.metricool.enabled true    # re-enable for a scheduling session
  ```
- ⚠️ **Toggling needs a SESSION RESTART to take effect.** The running session keeps the old connector (and its popup loop) in memory until reload. After `set enabled false`, the current popup loop won't stop until Joe restarts once — tell him that explicitly.
- Verify the write landed: `hermes config show | grep -iA6 metricool:` is unreliable (formatting), instead read `config.yaml` lines under `mcp_servers: → metricool:` for `enabled: false`.
- Why disabling is the only thing that FULLY stops popups: the timeout config below helps *login* survive the slow handshake, but it does NOT stop the steady-state churn. Metricool's ~179s access token + rotating refresh token means the connector re-auths constantly while loaded; any hiccup persisting the rotated RT → popup. Turning the connector off is the clean kill.

## OAuth popup loop — ROOT CAUSE + FIX (verified Jun 2026)

Symptom: Metricool MCP keeps opening the browser to re-authenticate.

> ⚠️ CORRECTION (Jun 2026): an earlier note called the connect-timeout probe the "real root cause" of the popups. That is WRONG for the steady-state case. Verified this session: popups still recur **even with `connect_timeout:120` + `timeout:180` already in config**, because the ~179s token + rotating-RT churn (see the bottom "Root cause" section) keeps the connector cycling. The timeout fix only matters for surviving a slow *login* handshake — it does not stop background popups. The durable answer for the not-scheduling case is the DEFAULT POLICY above (disable the connector).

What's actually happening:
- Metricool access tokens are short (~179s) AND the server **rotates the refresh token on every refresh** (each refresh invalidates the previous refresh token — `invalid_grant` if you reuse an old one).
- Hermes **does** persist the rotated refresh token correctly on its own. Verified: left alone, the on-disk RT advanced and stayed valid.
- ❌ Do NOT run a sidecar/background token-refresher script. Two refreshers race the single-use rotating refresh token → whichever loses gets `invalid_grant` → popup. A keeper makes it WORSE. (Learned the hard way — my own test refresh killed the file's RT.)
- ✅ Real root cause of the popups = the OAuth/connect probe hitting the default connect timeout (~40–60s) during Metricool's slow handshake.

THE FIX (config-based, applied):
```
hermes config set mcp_servers.metricool.connect_timeout 120
hermes config set mcp_servers.metricool.timeout 180
```
- The Hermes config is **agent-guarded** — `patch`/`write_file` refuse it. MUST use `hermes config set <dotted.key> <value>`.
- Per-server keys live under `mcp_servers.<name>` and are documented in `AppData/Local/hermes/hermes-agent/tools/mcp_tool.py` (readable Python source even though the `hermes` CLI is a compiled binary): `timeout` (per tool-call, default 300), `connect_timeout` (default 60), `ssl_verify`, `transport`.

Re-auth when truly needed: `hermes mcp login metricool` in a PTY terminal, complete the browser login in the SAME window while the listener is live. If the PTY closes before you finish, pasting the `http://127.0.0.1:<port>/callback?code=...&state=...` URL in the browser still reseeds the token directly (the local listener catches it).

**The 40s-probe kills the login before you can finish (recurring) — env-var workaround.** A bare `hermes mcp login metricool` repeatedly printed `✗ Authentication failed: MCP call timed out after 40.0s` and the PTY died before the browser sign-in completed (the `connect_timeout` config fix needs a session restart to take effect, so a RUNNING CLI still uses 40s). FIX that worked this session: launch the login with timeout env overrides so the probe doesn't fire mid-flow:
```
HERMES_MCP_TIMEOUT=300 HERMES_MCP_CONNECT_TIMEOUT=300 MCP_TIMEOUT=300 hermes mcp login metricool
```
→ flow completed, `✓ Authenticated — 7 tool(s) available`, token written. (The browser callback can auto-capture even when the prior attempt's PTY died — just complete the sign-in in the live window.) Note: after CLI re-auth the IN-SESSION metricool_* tools may STILL read "not connected" — that's the tool-load quirk; use the HTTP bridge (`metricool-scheduling/scripts/mc_bridge.py`) rather than restarting.

## Attaching images to Metricool posts (the working route)

Metricool's API `media: [URL]` does a **server-side ANONYMOUS fetch** of the URL — it does NOT use any linked-account auth. Consequences:
- **Google Drive URLs FAIL** — a private Drive file returns Google's HTML interstitial/login page to an anonymous fetch, so Metricool stores a `.html` file or errors "Failed to normalize media". The Drive *integration* you connect in Metricool only powers the **UI picker** (authenticated as you), NOT the API. Two different doors.
- **Workaround that works: Cloudinary** (public image host). Upload the PNG → get the `secure_url` → pass that in `media`. Public bytes, anonymous-readable, attaches cleanly.

### Cloudinary (set up June 2026, Joe's account)
- cloud_name `dhi6klgd0`, api_key `$CLOUDINARY_API_KEY`, api_secret `$CLOUDINARY_API_SECRET` (also stored in `C:\Users\somea\cloudinary_onboard.py` — `import cloudinary_onboard` to auto-config). Secret recorded here too so it survives if that file is deleted again.
- SDK: `pip install cloudinary`; RUN with `C:/Python313/python.exe` (the interpreter that has it — git-bash `python` does NOT).
- Upload pattern:
  ```python
  import cloudinary, cloudinary.uploader
  cloudinary.config(cloud_name="dhi6klgd0", api_key=os.environ["CLOUDINARY_API_KEY"], api_secret="<secret>", secure=True)
  r = cloudinary.uploader.upload("C:/path/poster.png", public_id="SI_LinkedIn_Poster_Ep29_v1")
  print(r["secure_url"])   # → pass this into Metricool media[]
  ```
- Reuse the asset-naming convention as the Cloudinary `public_id` so the three systems cross-reference.

### PROVEN end-to-end pipeline (June 2026, verified working)
1. Render poster HTML → PNG (headless Chrome) under BrandAssets/{Brand}/{Platform}/ with convention name.
2. Upload PNG to Cloudinary with `public_id` = the convention name, `overwrite=True` → grab `secure_url`.
3. `getScheduledPosts` to get the CURRENT post id+uuid (they shift), then `updateScheduledPost` with `media:[secure_url]`.
4. VERIFY: the returned `media[]` must be a `...metricool.com/...png` (Metricool rehosts the bytes). If it comes back `.html`, the source URL wasn't public image bytes — do NOT trust it.
   - Confirmed: Cloudinary secure_url → rehosted as `.png` ✅ (Drive URLs → `.html` ✗).
- Helper script: `C:\Users\somea\upload_posters.py` (edit the uploads dict, run with `C:/Python313/python.exe`).

## Metricool OAuth loop (recurring) — ROOT CAUSE + durable fix

**Root cause (verified June 2026): Metricool ROTATES the refresh token on every refresh.**
Each successful refresh returns a BRAND-NEW `refresh_token` AND invalidates the previous one (single-use refresh tokens). Combined with a ~179s access-token life, the popup loop happens when a rotated refresh token is not persisted: refresh → server issues new RT → if the new RT isn't saved back to disk, the NEXT refresh uses the now-dead RT → `400 invalid_grant` → full browser re-auth pops.
- ⚠️ This means the fix is NOT "stop getting new refresh tokens" (the server forces rotation — you cannot opt out). The fix is **always persist the newest refresh token atomically, every refresh.**
- The token endpoint DOES support the `refresh_token` grant (public PKCE client, `token_endpoint_auth_method: none`). Refresh call shape that works:
  ```
  POST <token_endpoint>  (from metricool.meta.json → token_endpoint = https://app.metricool.com/oauth/token)
  body (x-www-form-urlencoded): grant_type=refresh_token & refresh_token=<rt> & client_id=<from metricool.client.json>
  → 200 {access_token, refresh_token (NEW), expires_in:179, ...}
  ```
- ⚠️ **Doing a manual test refresh CONSUMES the on-disk RT** (rotation) — if you call the token endpoint yourself and don't write the result back, you've just armed a popup. Either always persist, or expect a one-time `hermes mcp login` reseed after probing.

**Durable fix — the token keeper:** `scripts/metricool_token_keeper.py` (under this skill). It proactively refreshes at ~half-life (~80s) and ATOMICALLY persists the FULL rotated token set (new access_token + new refresh_token + recomputed `expires_at`) back to `metricool.json`, so the on-disk token is always valid and the MCP client never needs to refresh/re-auth. Run `--once` for a single refresh+persist, or no args to run forever as a background keeper. Token files live in `C:\Users\somea\AppData\Local\hermes\profiles\joeagent\mcp-tokens\` (`metricool.json` = tokens, `.client.json` = client_id, `.meta.json` = endpoints).

**Reseeding when the RT is already dead** (`invalid_grant`): `hermes mcp login metricool` in a PTY/foreground terminal; complete the login in the SAME live window.
- The `http://127.0.0.1:<PORT>/callback?...` listener is **single-use & ephemeral** — dies when that attempt ends; the PORT changes every attempt (observed 58329 → 55765 → 49830). NEVER reuse or paste an old callback URL; doing so captures nothing and re-triggers the popup.
- During `hermes mcp login`, an `✗ Authentication failed: MCP call timed out after 40s` line can print while the **OAuth listener is still alive and waiting** — that timeout is Hermes's MCP *probe* giving up, NOT the login listener dying. Keep completing the browser login; poll the process to confirm the listener is still running.
- After a successful CLI re-auth, the **in-session MCP client may still say "not connected"** (it cached the dead connection) — needs a **session restart** to load the new token. Same class of quirk as Notion's tool-load.
- Verify health WITHOUT triggering auth: read `metricool.json` — `expires_at` (epoch) + presence of `refresh_token`.

**Concurrency caution:** Hermes appears to cache the MCP token in memory per session (hence the "not connected until restart" behavior). A sidecar keeper that rotates the on-disk RT could in principle collide with Hermes's own in-memory refresh. Safest pattern: run the keeper to keep disk fresh, but if both race on the same single-use RT you can still get one `invalid_grant`; the keeper recovers on its next loop, but a hard collision needs a reseed. Prefer `--once` around known tool-call bursts if you don't want a long-running daemon.

*Source: Joe sessions, June 2026.*
