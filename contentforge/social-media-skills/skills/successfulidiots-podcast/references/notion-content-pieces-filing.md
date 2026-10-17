# Filing Content Pieces into Notion — the working recipe + the gotchas (verified SI Ep031, June 2026)

When you file episode posts/captions into the **Content Pieces** DB via the
`notion_create_pages` tool, three things will bite you. All verified this session
(cost 3 failed create calls before it went through). Reusable across all of
Joe's brands — the DB and its select options are shared, not SI-specific.

## The IDs (stable)
- **Content Pieces** data source: `d93e3c62-348d-439c-a4e2-9a8a302cf7e4`
  (database page `e80cece169d7484d9b49a631dcd349e8`).
- **Content Library** (campaigns) data source: `2399bec0-1197-422d-a21c-5ff2500fa39d`
  (database page `c223ed2eb32f4191b16142238a257495`).
- Workflow: create the campaign in Content Library FIRST, then file pieces into
  Content Pieces under it. Group all of one episode's pieces under one campaign.

## Content Pieces property schema (use EXACT names + values)
- `Title` (title), `Account` (select), `Brand` (select), `Idea / Angle` (text),
  `Platform` (select), `Type` (select), `Post Body` (text — use `<br><br>` for
  paragraph breaks, the same convention existing Ep030 pieces use),
  `Pillar / Theme` (text), `Source` (url/text), `Status` (select),
  `Joe Approved` / `Partner Approved` (checkbox → `"__YES__"` / `"__NO__"`),
  `Parent Campaign` (relation), `Date` (date).
- **`Platform` select options (fixed):** `LinkedIn`, `Instagram`, `Facebook`,
  `YouTube`, `X / Twitter`, `Newsletter`. There is **NO "Multi" option.**
- **`Type` select options (fixed):** `Poster`, `Reel`, `Carousel`, `Story`,
  `Static`, `Video`, `Description`, `Thread`. There is **NO "Promo Video
  Caption" option** — a promo/video caption files as **`Type: Video`.**

## The 3 gotchas (each = one rejected create call this session)

1. **`Parent Campaign` relation cannot be passed as an array to
   `notion_create_pages`.** Passing `["https://app.notion.com/p/<campaign>"]`
   → `invalid_union ... expected string, received array`. The tool's property
   format wants a scalar for relation fields, and even passing the URL as a bare
   string did not reliably wire the relation. WORKING FALLBACK: omit
   `Parent Campaign` from `properties`, and put the campaign link in the page
   BODY as a line like `**Parent Campaign:** <name> (<url>)`. If a true linked
   relation is needed, set it afterward in the Notion UI or with a dedicated
   relation-update call — don't block the batch create on it.

2. **`Platform` rejects any value not in the fixed list above.** A promo caption
   that runs on several networks has no "Multi" home. File it under the canonical
   asset's platform (for a promo video caption → **`YouTube`**, since the main cut
   lives in the episode's `YouTube/` Drive folder) and note in the body that the
   same copy serves IG/FB Reels. Do NOT invent a select value — it 400s.

3. **`Type` rejects "Promo Video Caption"** for the same reason. Use **`Video`.**

## Transient MCP failure ≠ wrong arguments
Once the arguments were correct, the next call returned *"MCP server 'Notion' is
unreachable after 3 consecutive failures. Auto-retry available in ~16s."* This is
a transient connection blip, not a validation problem. FIX: wait ~20s, then retry
the SAME (now-correct) call. It succeeded on retry. Don't start mutating correct
arguments in response to an unreachable-server message — read the error class
first (validation_error vs unreachable).

## If Joe wants new clean homes for these
The cleanest long-term fix (offer it, don't assume): add a `Promo Video Caption`
option to `Type` and a `Multi` option to `Platform` via `update_data_source` on
`d93e3c62-348d-439c-a4e2-9a8a302cf7e4`, then promo captions track without the
YouTube/Video stand-ins. Only do this if Joe approves a schema change.
