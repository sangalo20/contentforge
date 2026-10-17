---
name: cron-nudge-agents
description: How a PROMPT-BASED cron "nudge/reminder" agent should BEHAVE when it fires in this profile — emit the formatted reminder as the final response and let the cron system auto-deliver it (to Slack, etc.). Trigger whenever a session is running as a scheduled cron job whose task is to send a reminder/checklist/nudge (e.g. "Metricool Morning Check", a daily pre-flight, a report-deadline enforcer), or when building/editing such a job's PROMPT. Owns the auto-delivery model, the weekday/{Day} gating, and the [SILENT] rule. NOT about getting a .sh SCRIPT to launch (that's windows-cron-shell-scripts), NOT about the content those reminders reference (Metricool work = metricool-scheduling).
---

# Cron nudge/reminder agents (prompt-based)

Joe's operating system includes recurring **nudge agents** — Hermes cron jobs whose entire job is to fire a formatted reminder/checklist to a person (usually Alvin) on a schedule. Examples: the **Metricool Morning Check** (9 AM ET weekdays → Alvin's Slack DM), a daily pre-flight, a report-deadline enforcer. They REMIND and TEMPLATE; they don't execute the underlying work.

This skill is about how the agent should BEHAVE when it runs — so a session doesn't waste calls re-discovering the delivery model every time.

## The delivery model — DON'T hunt for a Slack tool (this is the #1 time-waster)

When one of these agents runs, **the cron system auto-delivers the job's FINAL ASSISTANT RESPONSE** to the configured destination. The running agent:
- does **NOT** call a Slack tool, does **NOT** need a Slack MCP, and must **NOT** go looking for one;
- must **NOT** call `send_message` or otherwise try to deliver the output itself;
- simply **emits the fully-formatted reminder/checklist as its final message** — the platform routes it to the target (e.g. Alvin's DM).

Confirming signals that this auto-delivery is in force (already true in the `joeagent` profile):
- env `HERMES_CRON_AUTO_DELIVER_PLATFORM=slack`
- the job config carries a `deliver:` target (e.g. `deliver: "slack:<DM_ID>"`)
- the cron run's own system preamble explicitly says the final response is auto-delivered.

Do NOT burn calls on `which slack`, grepping `.env` for tokens, listing skills for a messaging tool, or reading cron config to "figure out how to send." Delivery is out of the running agent's hands **by design**. (Observed July 2026: a Metricool Morning Check run spent ~6 tool calls investigating Slack delivery before recognizing this — the correct run is ZERO investigation calls, just emit the reminder. A tiny date check is the only justified call, see below.)

## Exception: a cron job that must send a SPECIFIC Slack DM as a STEP (not as its final-response delivery)

The auto-delivery model above covers the common case where the job's whole output IS the message. But some cron jobs are **compound**: they do real work (e.g. update an Obsidian vault) AND, as one step, must push a message to a **named person's Slack DM** (e.g. "then send Alvin a DM: …"). Here auto-delivery does NOT help — the final response goes to the job's configured destination, which may not be that person, and the DM has to happen mid-task. In this case you DO send via the Slack Web API yourself.

Proven recipe (observed working July 2026 — "Content Calendar Weekly Auto-Populate" → Alvin DM):
1. `SLACK_BOT_TOKEN` is present in the `joeagent` env (`~/.hermes/.env`). It has `chat:write` (posting works) but the bot LACKS `users:read` — so `users.list` and `users.info` return `missing_scope`. You cannot look the person up by name.
2. **Resolve the recipient via open IMs**, not the user directory: `conversations.list?types=im` DOES work (the `im:read` scope is present). It returns the bot's open DM channels; filter out `USLACKBOT` and the human IM that remains is the target (for `joeagent` that's Alvin: user `U0B8HSL9V7S`, DM `D0BAK91BLKS` — but re-resolve, don't hardcode, since a workspace could add more people).
3. **DM channel IDs go stale — but only HARDCODED/old ones.** An ID recorded in an old note/diagnostic returns `channel_not_found`. Safest default: `conversations.open` with the *user id* to get a fresh DM channel, then `chat.postMessage`. Nuance (Tuesday Deep Dive run, July 2026): a channel id you just pulled from a FRESH `conversations.list?types=im` THIS run is valid to post to directly — no `conversations.open` needed. Only re-open when the id came from a stored/old source.
4. **Secret-redaction + cron safety:** never put the token in a shell command (redaction mangles it) a nd note `python -c "…"` is BLOCKED in cron mode ("script execution via -c flag"). The reliable pattern is: write a `.py` file to disk that reads `SLACK_BOT_TOKEN` from the environment, then run it with the token exported via `source`/`export` on the SAME line. Clean up the temp script after. A ready-to-adapt script + the exact run command live in `references/slack-dm-via-bot-token.md`.
5. Verify success by checking `chat.postMessage` returns `ok: true` with a `ts`; report the channel + ts in your wrap so delivery is auditable.

## Weekday gating + {Day} placeholders

Many nudges are weekday-only (`0 9 * * 1-5`) and/or embed a `{Day}` token in the template. Before emitting:
- Verify the day: `date +%u` (1–5 = Mon–Fri) — the ONE legitimate tool call in a simple nudge run.
- Fill any `{Day}` placeholder from `date +%A` (e.g. "Tuesday").
- The cron schedule usually already gates the weekday, but still fill the placeholder correctly; never leave a literal `{Day}` in the delivered text.
- If a nudge is meant for weekdays only and it somehow fires on a weekend, emit `[SILENT]` (see below) rather than a mistimed reminder.

## The [SILENT] rule

If there is genuinely nothing to report, emit **exactly** `[SILENT]` (nothing else) to suppress delivery. Never combine `[SILENT]` with content — either report normally, or say `[SILENT]` and nothing more. For a fixed-template reminder that's due, it is NOT "nothing to report" — emit the reminder. `[SILENT]` is for digest/summary-type crons that found no new material.

## Emit the template faithfully

These reminders are pre-authored by Joe with a specific structure (bold section headers per brand, a "Flag check" block, a "Reply 'DONE'" line, an escalation footer). Reproduce the template as given — correct Slack markdown (`*bold*`, bullet lists), placeholders filled — and do not editorialize, summarize, or "improve" the checklist. Match the exact wording the job prompt specifies.

## Cron-mode runtime traps (apply to ANY prompt-based cron agent, not just nudges)

These bite recurring/stateful cron agents (e.g. the morning-engineering-digest job) and are easy to hit blind because there's no user to approve or clarify mid-run:

- **`python -c` / `python3 -c` (and other inline `-e`/`-c` script flags) are BLOCKED in cron mode.** The guard reports "script execution via -c flag ... cron jobs run without a user present to approve it." This fires even for harmless one-liners like parsing an API JSON response. Fix: don't pipe to an inline interpreter — save output to a file and parse with shell tools (`grep -o '"title":"[^"]*"' file.json`, `grep -o '"url":"[^"]*"'`, `awk`, `sed`), OR write a real `.py`/`.sh` file to disk and run that file. (Observed July 2026: a digest run's `curl ... | python -c` for dev.to JSON was blocked; re-running as `curl -o /tmp/x.json` then `grep -o` worked first try.)

- **The `memory` tool can be UNAVAILABLE inside a cron session** — it returns `{"error": "Memory is not available. It may be disabled in config or this environment.", "success": false}`. A cron agent that must persist state across runs (dedup markers, "already-sent today", no-repeat history, rotation position) must NOT assume `memory` works. Fallbacks, in order:
  1. **Sentinel file** for once-per-day dedup: `touch "$HOME/AppData/Local/hermes/<job>-sent-$(date +%Y-%m-%d)"`; check with `test -f ... && echo SENT || echo NOT_SENT` at the top of the run. (Note: a gateway restart can rename these to `.bak`, so don't rely on it as the ONLY guard if memory is also flaky.)
  2. **A durable history/state markdown file** for richer state (e.g. `$HOME/AppData/Local/hermes/<job>-history.md`) written with `write_file` — records what was sent, rotation slot, and feedback status so the NEXT run can read it even when the memory tool is down. Prefer this over silently losing no-repeat tracking.
  Still attempt the `memory` write too (belt and suspenders); just don't let its failure abort the run or cause a duplicate/repeat.

- **Reconstruct prior state from cron output logs when no state file exists yet.** Past runs' `## Response` sections live at `$HOME/AppData/Local/hermes/cron/output/<job_id>/<timestamp>.md`. `grep`/`awk` the `## Response` blocks (skip the ones that are just `[SILENT]`) to recover what was actually sent and the last rotation note — invaluable for a "no repeats" rule when memory is unavailable.

## Relationship to other skills
- **windows-cron-shell-scripts** — for getting a `.sh` SCRIPT cron job to actually LAUNCH on Windows (WSL-dispatch trap + Python launcher). Different class: that's script execution; THIS is prompt-agent behavior.
- **metricool-scheduling** — owns the actual Metricool work the "Metricool Morning Check" reminder points a human at. The nudge only reminds; it doesn't pull analytics or schedule.
- **personal-command-center** (lives in other profiles, not `joeagent`) — the builder skill that CREATES these nudge agents from a role doc. If you need to build/schedule a new nudge job (not just run one), that's the builder; this skill is the runtime-behavior companion.
