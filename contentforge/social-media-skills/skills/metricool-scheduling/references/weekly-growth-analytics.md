# Weekly Growth Analytics — the feedback loop (verified June 2026)

This is the operational recipe for Joe's recurring **weekly growth scorecard** — the
"measure → feed back" half of the content factory (brand-knowledge-hub calls the loop
out as a design goal; this is how you actually run it). Built + shipped as a cron June 2026.

## Joe's north-star (LOCKED — judgment rules, not just metrics)
Success = **week-over-week GROWTH** in three things, on **every** connected platform:
1. **Views / reach** (is it reaching people)
2. **Engagement** (do they care)
3. **Followers** (are we keeping the right people)

CRUCIAL judgment rule Joe stated explicitly: **judge content on ROLLING WEEKLY TRENDS,
never day-one numbers.** His words: *"content has value but not everyone sees it after
one day."* A post still gaining steam is **not** a failure — frame it as "still gathering
steam," compare this-week vs last-week (and the 4-week trend once it exists), never a single day.

And every brief MUST **end with concrete, tailored SUGGESTIONS** (not just a number dump) —
at least one aimed at follower growth, one at reach/views, each tied to the specific
number that triggered it and the specific brand/platform/format it applies to.

## The metric field IDs (per network, connector="evolution")
Always confirm with `getAnalyticsAvailableMetrics(network, connector="evolution")` — IDs
differ per network and Metricool deprecates some (ignore any labelled "Deprecated"/"Do not use").
Instagram, verified June 2026:
| Need | fieldId | metricName | aggregation |
|---|---|---|---|
| Followers (current) | `IGEV01` | followers | LAST |
| Net follows gained/lost | `IGEV03` | follows | SUM |
| Profile views | `IGEV05` | views | SUM |
| Account reach | `IGEV06` | reach | SUM |
| Account post interactions | `IGEV38` | postsInteractions | SUM |
| Engagement (timeline) | `IGEV9999` | totalEngagement | AVG |
| Reels views | `IGEV23` | reelsViews | SUM |
| Avg reach per post / reel | `IGEV19` / `IGEV30` | — | SINGLE |
Find the LinkedIn (`LI…`), Facebook (`FB…`), TikTok (`TK…` — note TK, NOT TT), X (`TW…`)
equivalents the same way — do NOT assume the IG ids carry over. Per-format breakdowns (reels
vs posts vs stories) exist and are what powers format-level suggestions.

**CONFIRMED cross-network fieldIds (verified June 2026, connector="evolution").** These are
the columns the scorecard actually pulls — [followers(LAST), net-follows(SUM), reach(SUM),
interactions(SUM)] per network:
| Network | Followers | Net follows | Reach/Impressions | Interactions |
|---|---|---|---|---|
| Instagram | `IGEV01` | `IGEV03` | `IGEV06` (reach) | `IGEV38` |
| LinkedIn | `LIEV01` | `LIEV08` (deltaFollowers) | `LIEV22` (accountPostImpressions) | `LIEV28` (accountPostInteractions) |
| Facebook | `FBEV17` (fbFollowers) | `FBEV47` (followersAcquired) | `FBEV11` (reach) | `FBEV34` (postsInteractions) |
| TikTok | `TKEV07` | `TKEV08` (newFollowers) | `TKEV02` (views) | `TKEV06` (interactions) |
LinkedIn has NO true account "reach" metric — `LIEV22` accountPostImpressions is the closest
reach proxy and what the scorecard reports. Facebook's old `FBEV01/02/05/06` (pageLikes,
pageImpressions, pageLikesAcquired/Lost) are ALL Deprecated — use the FBEV17/47/11/34 set above.

## Brand blogIds (confirm with getBrandSettings each run — networks change as Joe connects more)
- Successful Idiots `6374077` — **FB, LinkedIn, TikTok ONLY (NO Instagram connected** as of
  June 2026 — `networksData` has facebookData/linkedinData/tiktokData but NO instagramData,
  despite the cron prompt listing IG; report only what getBrandSettings actually shows)
- Storage Moguls `6425193` — FB, IG, LinkedIn (+ X when connected; no X yet June 2026)
- StorPro - Greenville `6425267` — FB, IG, LinkedIn
- Joe Downs `6425321` — IG, LinkedIn
No brand has X/Twitter connected yet (June 2026). Trust `getBrandSettings.networksData`, not
the prompt's brand→network list — they can disagree.
Accounts were first connected ~June 17–18 2026, so early runs are a BASELINE — if a
brand/network is too new for a full "last week," say "baseline week — building history"
instead of forcing a delta. Never fabricate; empty metric → "—" + "data still accruing".

## Run recipe
1. `getBrandSettings` → confirm each brand's currently-connected networks (X/Twitter is
   being added — INCLUDE it the moment it appears; the scorecard auto-detects).
2. Two 7-day windows in America/New_York: THIS WEEK = last 7 full days ending yesterday;
   LAST WEEK = the 7 before that. Compute exact ISO dates (zoneinfo, not git-bash `date`),
   and remember the offset rule on every Metricool date arg (`-04:00` EDT / `-05:00` EST).
3. Per connected network, `getAnalyticsDataByMetrics` for BOTH windows. Compute Δ absolute + %.
   **EXACT ARG SHAPE (verified June 2026 — the docstring's `(brandId, from, to, metrics[])` is
   right but the literal arg names + types bite):** the tool REQUIRES `{"brandId": "<id>",
   "from": "<iso+offset>", "to": "<iso+offset>", "metrics": [...]}` where:
   - `brandId` must be a **STRING** (`"6425193"`), not an int → int gives `/brandId: integer
     found, string expected`.
   - the keys are `brandId`/`from`/`to` — NOT `blogId`/`start`/`end` (those give
     `property 'blogId' is not defined in the schema ... required property 'brandId' not found`).
   - `from`/`to` need the TZ offset like every other Metricool date arg, e.g.
     `"2026-06-22T00:00:00-04:00"` / `"2026-06-28T23:59:59-04:00"`.
   **RESPONSE SHAPE:** returns `{"rows": [[m0,m1,m2,m3, "YYYYMMDD"], ...]}` — one row PER DAY,
   columns in the SAME ORDER you passed `metrics`, last column is the date string, nulls appear
   as `null`/`"null"`. Aggregate yourself by each metric's `dataAggregation`: **followers = LAST**
   (take the latest-date non-null row, NOT a sum — summing daily follower counts is wrong), and
   net-follows / reach / interactions = **SUM** across the 7 daily rows.
4. Output: per-brand compact table `| Network | Followers (Δ) | Views/Reach (Δ) | Engagement (Δ) |`
   with ▲/▼/► arrows, bold the best win + biggest drop, a one-line "Read" per brand, then the
   **"✅ Do this next week"** suggestions section (3–6, tailored, data-tied).

## The cron (the durable artifact)
Job "Weekly Growth Scorecard — all brands", schedule `0 15 * * 1` (= Mon 8am ET; the
scheduler host runs +03:00, so 15:00 host = 08:00 ET — DON'T set `0 8` or it fires ~1am ET).
deliver=origin. Self-contained prompt (no skills attached) carrying all of the above so it
runs autonomously. If Metricool tools aren't callable in the cron session, the prompt says to
report that plainly rather than fail silently.

**CRON-SESSION TOOLING REALITY (verified June 2026 run).** In the actual cron run:
- The named `metricool_*` MCP tools were NOT loaded in the session toolset → fell back to the
  HTTP bridge `C:\Users\somea\BrandAssets\_scripts\mc_bridge.py` (`from mc_bridge import mcall`),
  which self-refreshes the ~179s token with zero auth popup. This is the reliable cron path.
- **`execute_code` is BLOCKED in cron mode** ("runs arbitrary local Python ... Cron jobs run
  without a user present to approve it"). So you CANNOT `from hermes_tools import` to run the
  bridge — instead drive the bridge through the **`terminal` tool** with
  `C:/Python313/python.exe` (heredoc or `-c`), `cd C:/Users/somea/BrandAssets/_scripts` first.
  Date math (zoneinfo windows + offset) likewise runs via terminal `C:/Python313/python.exe`,
  not execute_code.
- Net: cron scorecard = terminal + mc_bridge, never execute_code, never the named MCP tools.
  Token files can't be read with `read_file` (Hermes guards them) — the bridge reads them itself.

## Cadence discipline (Joe, June 2026)
Let a NEW weekly run accumulate ~3 weeks before adding a monthly deeper-dive (best
formats/themes across the month) — a trend line needs data before the deep-dive has anything
to analyze. Don't stack more analytics crons preemptively.
