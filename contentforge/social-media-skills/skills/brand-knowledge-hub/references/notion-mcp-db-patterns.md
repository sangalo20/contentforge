# Notion MCP — Database Building Patterns & Quirks

Verified recipes for building databases via the **Notion MCP tools** (`notion-create-database`, `notion-update-data-source`, `notion-create-pages`, `notion-update-page`, `notion-fetch`) that are connected to the joeagent profile. These tools use a **SQL-DDL-flavored** interface, distinct from the curl/`ntn` paths in the bundled `notion` skill. Prefer the MCP tools when working inside a session — no API token setup, cleaner output.

## ⚠️ READ FIRST — SQL `query_data_sources` 429 rate-limiting (Joe flagged: "always having issues with SQL", June 2026)

**Symptom:** `notion_query_data_sources` (mode=sql) returns `429 rate_limited` with `rate_limit_reason: "collection_router_upstream_429"` — and KEEPS 429'ing even after waiting 30–120s and even on a trimmed query. The SQL path routes through a separate "collection router" upstream that throttles MUCH harder than the rest of the Notion MCP and is sometimes degraded on Notion's side regardless of your call rate.

**The lesson — what to actually do (don't loop the same call):**
1. **SQL route ≠ SEARCH route — they are DIFFERENT backends.** When SQL 429s, `notion_search(data_source_url=…, query=…)` almost always still works (confirmed June 2026: search returned 25 rows seconds after SQL 429'd 4× in a row). SQL throttling does NOT mean Notion is down.
2. **Bail fast.** First SQL attempt 429s → wait the `retry_after` ONCE → try ONCE more. Second attempt also `collection_router_upstream_429` → STOP retrying SQL. It's the upstream, not your spacing; more retries just re-arm the throttle and burn calls.
3. **Route fallback order:** SQL (date-range/filter/aggregate; best, but bail after 2 fails) → database VIEW query (`mode=view` on a pre-built dated view; different enough to dodge the SQL throttle) → `notion_search` scoped by `data_source_url` (reliable but relevance-ranked, NOT date-sortable; `max_highlight_length:0`, `page_size`≤25) → `notion_fetch` on a known page id.
4. **Keep SQL cheap:** SELECT ≤6 columns, one WHERE range, NO `OR "date" IS NULL` combos (heavier — split into two queries if you truly need undated rows).
5. **If SQL is genuinely down and you need DATE-scoped data:** tell Joe the SQL route is upstream-throttled, deliver what search+fetch give, and offer to re-run the exact date query when it recovers (usually minutes). Never fabricate a "scheduled this week" list you couldn't actually filter by date.
6. **Durable option to avoid SQL entirely for recurring date pulls:** build a Notion DB VIEW filtered to the window once (e.g. "This Week" date filter) and query the view — no SQL, no collection-router throttle.



## Creating a database

`notion-create-database` takes a `CREATE TABLE` statement. Column-name in double quotes, type options in single quotes:

```
CREATE TABLE ("Title" TITLE, "Type" SELECT('A':blue, 'B':green),
  "Topics" MULTI_SELECT('x':red, 'y':gray), "Summary" RICH_TEXT,
  "Source" URL, "Status" SELECT('Draft':yellow, 'Verified':green),
  "Last Synced" DATE)
```

Returns a `data_source_id` (collection://...) — that's what you query/write against. The database also has a separate `database_id`. Parent is `{"page_id": "..."}` or `{"data_source_id": "..."}`.

Colors: default, gray, brown, orange, yellow, green, blue, purple, pink, red.

## QUIRK 1 — DATE columns get a malformed literal name

When you declare `"Last Synced" DATE` in the CREATE TABLE, the tool sometimes creates the property literally named **`date:Last Synced:start`** instead of a clean `Last Synced` date field. Symptom: writing pages fails with:

> Date property "Last Synced" not found in the data source. Editable properties: "date:Last Synced:start" (date).

**Fix immediately after creating the DB:**
```
notion-update-data-source: RENAME COLUMN "date:Last Synced:start" TO "Last Synced"
```
After the rename it behaves as a normal date column.

**Writing date values** (in `notion-create-pages` / `notion-update-page` properties) uses the EXPANDED key regardless:
- `"date:<Column>:start"`: "2026-06-18"
- `"date:<Column>:end"`: optional
- `"date:<Column>:is_datetime"`: 0 or 1

If a date write fails, just drop the date for that call and set it later — it's rarely worth blocking on.

## QUIRK 2 — Relation values must be full page URLs, not bare UUIDs

Setting a RELATION property value with a bare page id fails:

> Invalid agent URL: "383cc74e-..." looks like an invalid compressed URL or shorthand identifier

**Wrong:** `"Parent Campaign": "[\"383cc74ebcf381bf...\"]"`
**Right:** `"Parent Campaign": "[\"https://app.notion.com/p/383cc74ebcf381bf...\"]"`

Always pass the full `https://app.notion.com/p/<id>` URL inside the JSON array.

## QUIRK 3 — Self / dual relations create a duplicate column

Adding a dual relation via DDL, e.g.:
```
ADD COLUMN "Related Content" RELATION('<same_ds_id>', DUAL 'Related Content' 'related_content')
```
creates BOTH `"Related Content"` and `"Related Content 1"` (the auto synced-back side). Clean up with:
```
DROP COLUMN "Related Content 1"
```
Then you have a single tidy self-relation. (A cross-database dual relation behaves the same — drop the extra synced column if you don't want it visible on the child side. For parent↔child, you DO want both, named meaningfully: e.g. `Parent Campaign` on child, `Pieces` on parent.)

## Extending a database (additive — the locked principle)

```
notion-update-data-source:
  ADD COLUMN "Priority" SELECT('High':red, 'Low':green)
  RENAME COLUMN "Old" TO "New"
  DROP COLUMN "Unused"
  ALTER COLUMN "X" SET <type>
```
Multiple statements separated by `;`. None of these disturb existing rows.

## Reading Google Docs as raw material

`notion-fetch` only handles Notion entities — it errors on Google Doc URLs ("URL type webpage not currently supported"). Read Drive docs through the google-workspace CLI:
```
python C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py docs get <FILE_ID>
```
Returns JSON `{title, documentId, body}`. Use absolute Windows path; `$HOME` mis-resolves in git-bash.

## Parent/child content pattern (campaigns → pieces)

- PARENT db (Content Library) row = a campaign/batch (e.g. a weekly LinkedIn batch).
- CHILD db (Content Pieces) row = one individual post, linked back via a relation.
- This gives **per-piece** tracking/approval while keeping a clean high-level campaign view.
- Master post → platform variants: model variants as child pieces linked to the master so the repurposing chain stays connected.

## Deriving approval state — formula field, NOT a DB automation

Common ask: "can Status auto-update when the content is approved?" Important tooling boundary:

- **Native Notion database automations** (the "When property changes → set property" rule, incl. Button automations) are **UI-only**. They are NOT exposed in the Notion API / MCP tools — the agent **cannot create, read, or configure them remotely**. Do NOT promise to wire one; the most you can do is hand the user click-by-click steps to set it up themselves (DB `•••` → Automations → New).
- **What the agent CAN build via API: a FORMULA column** that derives a live, read-only approval readout from the approval checkboxes. It recalculates instantly on every checkbox change — no trigger, no agent, no setup. This is the standalone answer when the user doesn't want to set up an automation.

Verified formula (two-gate model, Joe Approved + Partner Approved checkboxes):
```
ADD COLUMN "Approval State" FORMULA('if(prop("Joe Approved") and prop("Partner Approved"), "🟢 Approved", if(prop("Joe Approved"), "🔵 Joe approved — awaiting partner", if(prop("Partner Approved"), "🟠 Partner approved — awaiting Joe", "🟡 Pending")))')
```
Tradeoff to state plainly: a formula is **read-only and computed** — it canNOT write into a separate `Status` select field (only a UI automation can do that). So you get TWO signals: the manual `Status` (workflow stage) and the auto `Approval State` (gate readout). In practice this is cleaner — approval and workflow stage are genuinely different axes. Filter on `Approval State = 🟢 Approved` for the "cleared to publish" list.
