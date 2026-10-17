# System Audit Pass — "analyze everything, make it better"

Joe periodically asks for a full review of the content system + a concrete improvement plan ("look at the database structures, the mind/data maps, the skills, everything, come back with a solid plan"). This is a recurring CLASS of task. Run it as a disciplined pass. Proven June 2026.

## Phase 1 — Inventory (parallel, before forming opinions)
Gather the whole picture FIRST; don't audit from memory. Batch these:
- **Skills:** `skills_list` (+ `skill_view` the content skills in play — brand-knowledge-hub, brand-poster-design).
- **On-disk:** `search_files` for `BrandAssets/**` — posters/HTML/PNG, `_scripts/*` (generators, uploaders), `_remotion/src/*.tsx` (motion comps), `_manifests/*`, any `*_urls.json`.
- **Notion architecture:** fetch the Production Map (`386cc74e-bcf3-81f2-84e3-ca5cf644c510`) + read `references/live-ids.md` (the 4-homes DBs, relations, blogIds).
- **Memory/USER:** what rules are loaded, what's near the cap.

## Phase 2 — Score against the FACTORY LOOP
Joe's model: **generate → approve → publish → MEASURE → feed back.** Check each stage actually runs. The most common high-value finding is an **open loop** — a stage that was designed but never operationalized (the measure→feed-back half was exactly this in June 2026). An open loop usually beats any cosmetic fix on impact.

## Phase 3 — Present a PRIORITIZED PLAN
A scannable table: `# | Issue | Why it costs you | Severity (🔴/🟡/🟢)`. Then group fixes into a few named "moves," recommend the earliest **high-leverage + low-risk** ones to do first, and ask the 1–2 decisions that gate the rest. Joe greenlights fast and often says "do all of it" — be ready to execute the same session.

## Phase 4 — VERIFY by exercising (never assert)
After building anything: actually run it. Render a poster from the new engine and vision-QA it; confirm a new cron is healthy via `cronjob list`; dry-run a script's cred-load. Then **clean up every test artifact** (don't leave `_chk_*` / `_engtest_*` in real asset folders; distinguish YOUR test files from pre-existing ones before deleting). Joe explicitly values verify-before-asserting and is frustrated by unverified claims.

## Phase 5 — Log it
Append a dated "System audit + improvements" section to the Production Map (the work-log home). Behavioral rules → memory (terse) or the relevant skill; the work-log → Notion. Do NOT bloat memory with the audit narrative.

## Recurring gap catalogue (what an audit tends to surface)
1. **Open feedback loop** — analytics tools exist but nothing schedules/uses them. FIX = a recurring scorecard cron (see SKILL "Close the factory loop").
2. **Script sprawl** — each episode spawns a new pile of near-duplicate generators (8 scripts / ~1,458 lines for one episode was the June 2026 state). FIX = the unified spec-driven engine `_scripts/gen_episode.js` + one spec JSON per episode (documented in brand-poster-design SKILL "UNIFIED ENGINE"). ADD-never-rebuild: keep the old scripts as reference, route new work to the engine.
3. **Scattered media-URL tracking** — `*_media_urls.json` / `*_urls.json` strewn around, some stale. FIX = ONE Cloudinary manifest per episode via `_scripts/upload_manifest.py` → `_manifests/{BRAND}_{REF}_manifest.json`.
4. **Stale state never closed** — orphan Notion pages, duplicated source docs flagged "Needs Review" but never re-pulled, doc drift between the Map and live-ids. Close them or re-flag explicitly. (MCP Notion token can't hard-delete — rename orphans "🗑️ DELETE ME" so Joe one-swipe-deletes them.)
5. **Building dead assets** — generating content for a platform not yet connected (e.g. X before it's wired). Confirm with `getBrandSettings`; if Joe says he's connecting it, keep building; otherwise stop until live.
6. **Memory near cap** — reference detail living in always-on memory instead of a skill. FIX = compress memory entries to terse guardrail + pointer; move the full spec into the governing skill's SKILL.md / references. (Memory = behavioral rules + pointers; skills = full procedure.)

## Cadence note
After turning the feedback loop on, let the weekly scorecard run ~3 weeks before adding a monthly deep-dive — a trend needs cycles before deeper analysis has anything to read (Joe directive).
