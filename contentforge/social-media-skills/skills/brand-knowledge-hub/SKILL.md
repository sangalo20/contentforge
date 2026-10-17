---
name: brand-knowledge-hub
description: Build and extend Joe Downs' Brand Knowledge Hub in Notion — the multi-brand "factory" that turns raw Google Drive material (podcast transcripts, captions, notes) into structured Notion finished goods (reusable KNOWLEDGE + publishable CONTENT). Trigger when asked to "add to the knowledge hub", "create a knowledge/content database", "file this into Notion", "add a brand to the hub", "track content approval", "repurpose this post to other platforms", "connect Canva / another MCP server", or any work extending the Hub's databases. Covers the architecture, the Notion-MCP database-building quirks, the per-piece approval model, and the MCP servers behind the factory (Notion = store, Canva = design/repurpose engine). Built on the Notion + Canva MCP servers (connected to the joeagent profile) and the google-workspace CLI for reading Drive source docs.
metadata:
  hermes:
    tags: [Notion, Knowledge-Base, Content-Pipeline, Multi-Brand, Approval-Workflow]
    related_skills: [notion, google-workspace, linkedin-posts, joe-from-podcasts, storagemoguls-podcast, successfulidiots-podcast]
---

# Brand Knowledge Hub

Joe's single source of truth in Notion for **all** his brands, living on **one** profile (joeagent) — explicitly NOT separated into different Hermes profiles. This skill governs how to build and extend it.

## The mental model (Joe's own analogy — use it)

A pipeline is valuable the way an **industry** is valuable: it takes **raw materials** and produces **finished goods**.

```
RAW MATERIAL              FACTORY                  FINISHED GOODS (Notion)
Google Drive         →    Hermes + skills     →    🧠 Brand Knowledge Hub
(transcripts,             (extract, reframe         ├─ Knowledge DBs (per brand)
 captions docs,            to Joe's voice,          ├─ Content Library (campaigns)
 raw notes; sometimes      split by brand/          └─ Content Pieces (per-post)
 already-finished)         account, repurpose)
```

Two product lines off the same line:
1. **KNOWLEDGE** — reusable insight for replying to comments, writing articles, prepping calls.
2. **CONTENT** — publishable goods (the posts), tracked through approval to published.

The value is never the raw material — it's what we process it into. A transcript is iron ore; a Joe-voice LinkedIn post is the steel beam.

### ⚠️ KNOWLEDGE ≠ episode archive (Joe corrected this — June 2026)

A Knowledge DB holds **durable, brand-level reference** that you pull from over and over: brand voice/tone, content pillars, audience & positioning, style guide (colors/fonts/logos), mission, pricing facts. It is NOT a place to mirror per-episode takeaways.

The mistake to avoid: when asked to "populate the Successful Idiots Knowledge area," I dumped ~8 **episode-by-episode summary entries** ("The Jimmy Prompt (Ep 028)", "GEO (Ep 029)", etc.). Joe pushed back: *"I don't understand why you are putting episode content in the knowledge area?"* Episode recaps are closer to **raw material** than processed reusable knowledge — they turn the DB into an archive/dumping ground, not a reference.

**The fix / the standard:** Before adding rows to ANY brand Knowledge DB, fetch the **Storage Moguls — Knowledge** DB and copy its shape. SM is the reference example — its entries are exactly:
- **Brand Voice & Tone** — tagline, personality, DO / DON'T, mission
- **Content Pillars** — the recurring social framework (the N pillars + platforms + handle convention)
- **Audience & Positioning** (SM calls it "Membership Tiers & Audience Segments")
- **Brand Style Guide** — colors (hex), fonts, logo lockups (Verified status; lifted from the official guide)

Episode insights DO belong in the pipeline — but NOT as Knowledge rows. When a new brand's Knowledge DB is empty, build these ~4 evergreen reference pages, not episode entries.

Rule of thumb: if an entry's title needs an episode number to make sense, it does not belong in Knowledge.

### The Episode Library DB — the THIRD home (Joe's design, June 2026)

After the Knowledge-vs-episode correction, Joe clarified he still wants episodes captured — just in their own place. He liked the per-episode entries as a way to **store an episode lightly before extracting content from it for a specific use** (a comment, a caption, etc.). So episodes get a dedicated **Episode Library DB per brand**, sitting alongside that brand's Knowledge DB under the Hub. This keeps Knowledge evergreen-only AND gives episodes a clean staging home (Joe explicitly chose a separate DB over a Type tag inside Knowledge, and over per-insight fragments).

**Grain: 1 row per EPISODE** (not 1 row per insight). Each row's page body holds all that episode's mineable insights, timestamps, and links; a `Key Insights` property carries a one-line index. Build the fragments INTO the episode page — don't scatter "Jimmy Prompt", "Smoothie Test" as separate rows.

Episode Library schema (per brand): Title · Episode · Status · Topics(multi) · Key Insights · Hosts · Drive Folder(url) · Source(url) · Published(date). Same DATE-column quirk applies — rename `date:Published` → `Published` right after create. **Plus 3 structured mining fields added June 2026 (SI Episode Library; apply to SM on next pass): `Keywords / Phrases`, `Frameworks`, `Proof Points` (all RICH_TEXT) — make the library queryable/mineable, not just readable.**

Two distinct ingest passes, two reference recipes: (1) bulk-backfill a back catalog into LIGHT rows → `references/episode-ingestion.md`; (2) DEEP-REBUILD shallow rows to the full 028/030 method (rebuild IN-PLACE not delete-first; the 3 structured fields; transcript-as-source; empty-stub→Needs Review; ~5/batch) → `references/episode-deep-rebuild.md`.

So the full home map for any extracted material:
- **Evergreen brand reference** → Knowledge DB (~4 pages, SM shape)
- **Episode capture, mine-later** → Episode Library DB (1 row/episode)
- **Publishable posts** → Content Pieces (via the `*-podcast` skills)

Live Episode Library + new-brand Knowledge DB IDs (SI, SM, Belrose, StorPro) are in `references/live-ids.md`. Note: Belrose and StorPro are **brands WITHOUT podcasts** — they still get a Knowledge DB (style guide + positioning) but no Episode Library.

### Batch episode ingestion (verified workflow, June 2026)

Backfilling a whole back catalog (e.g. SI 001–027, SM 001–008) is mechanical and token-heavy if done one episode at a time. The efficient path that worked (full recipe in `references/episode-ingestion.md`):
1. **Enumerate folders → pick the best source doc per episode in ONE `execute_code` pass.** Loop episode folders, call Drive CLI `drive search "'<folderId>' in parents" --raw-query`, pick `Show Notes.docx` (preferred) else `BLOG.docx`. Collect `{ep: fileId}` and print it.
2. **Batch-download** all chosen docs in a second loop (`drive download <id> --output /c/Users/somea/XX_<ep>.docx`).
3. **Extract ALL with ONE python-docx script** via `C:/Python313/python.exe` (only interpreter with `python-docx`). Print each file's char-count first to spot empty stubs.
4. **Verify content before trusting it** (gotchas below), then create rows in **batches of ~12 `notion-create-pages`**.
5. Clean up temp `.docx` + extractor script.

Source-doc gotchas this surfaced (also in `references/live-ids.md`):
- **SM `Show Notes.docx` are EMPTY stubs** (header line only) — use `BLOG.docx` for SM substance. SI Show Notes ARE populated. So \"best doc\" is brand-dependent; check char-count.
- **Copy-paste duplicates:** some folders hold a doc duplicating the previous episode (SM 004 BLOG = SM 003; SI 022 Show Notes = SI 021). Folder name/number is authoritative — when body ≠ folder, file the row **Status = Needs Review** with a re-pull note, never guess or silently use wrong content.
- **`Topics` multi-select rejects unknown options.** If an episode needs a tag not in schema, `ALTER COLUMN "Topics" SET MULTI_SELECT(...all existing..., 'New Tag':color)` first (ADD never rebuild), then retry.

### Website-reference pass

Each brand's live website is a first-class KNOWLEDGE source (distinct from style guide and episodes). Pull it with the browser and file ONE **Website Reference** entry (Type = Reference/Facts, Status = Verified) per brand into that brand's Knowledge DB: tagline, positioning, product/tiers, distribution channels, newsletter, structure. Brand sites: successfulidiots.ai, storagemoguls.ai, **belrosegrp.com** (belroseam.com redirects there — Belrose Asset Management rebranded to Belrose Group; 3 divisions Storage/Consulting/Development, Development built StorPro), storpro.com. The four brands interlock — Storage Moguls (education) + Belrose (investment/consulting/development) + StorPro (the physical product Belrose Development builds).

## 🧱 CONTENT STRUCTURE — IDEA → PLATFORM → TYPE → CONTENT+VISUAL (Joe locked, June 2026, ALL brands)

This is the production model for every brand's episode content. Joe corrected the old flat "N pieces" approach hard: re-skinning ONE idea into many platform pieces is **repetition, not range**.

**The hierarchy (build in this order):**
```
IDEA / intuition / story   (the distinct insight — e.g. "Peter's email workflow")
 └─ PLATFORM               (LinkedIn, Instagram, X, Facebook, YouTube)
     └─ TYPE               (poster, reel, carousel, story, static, video, description, thread)
         └─ CONTENT + VISUAL   (caption paired with its asset)
```

**Rules:**
1. **COVERAGE is fixed; TYPE is idea-driven. Two separate decisions — do not conflate them (Joe locked, June 2026).**
   - **COVERAGE (NOT negotiable): EVERY idea gets a post on ALL FOUR core platforms — LinkedIn, Instagram, X/Twitter, Facebook.** Never skip a platform. Joe corrected this directly after I dropped Facebook from one idea to "prove the spread was idea-driven": *"Every platform should always have a post."* So a complete idea = 4 platform pieces minimum (YouTube description stays episode-level, not per-idea). Do NOT decide a platform "doesn't fit" and omit it — that's the mistake.
   - **TYPE/FORMAT (this is what the idea drives):** WITHIN that fixed 4-platform coverage, choose the FORMAT that fits the idea — poster vs static vs carousel vs quote-card vs video vs reel. This is where range lives, not in dropping platforms. A conceptual reframe → posters/quote cards on all 4. A rich sequential story with proof points → a CAROUSEL earns its place (usually IG) PLUS posters on the other 3. A method/how-to → a numbered-process visual. The same idea legitimately wears different formats per platform; that variety is the point.
   - **Only rich, sequential, step-by-step ideas warrant a carousel** (and then build EVERY slide). Most ideas are posters/statics/quote cards across the 4 platforms. A promo clip already in Drive `Promos/` can be the visual for the video-capable platforms, but the other platforms still each get their own piece.
   - The OLD framing ("not every idea gets every platform — match the vehicle to the message") was WRONG on coverage and is retired. Match the FORMAT to the message; match the COVERAGE to "all four, always."
2. **Multiple captions for the same type are fine** (e.g. two reel cuts) but they stay filed UNDER the same idea — they are not separate ideas.
3. **When an idea DOES warrant a carousel, produce EVERY slide**, not just the cover. (But a carousel is a deliberate choice for sequential ideas, not a default.)
4. **YouTube description is episode-level** (one per episode, not per idea).
5. Identify the episode's distinct ideas FROM the Understanding (Episode Library record), then for EACH idea build all four platform pieces, choosing the FORMAT per platform that fits that idea. The FORMATS will legitimately differ idea to idea (and platform to platform) — that variety is the point — but the four-platform COVERAGE stays constant.

**Notion encoding (Content Pieces `d93e3c62-348d-439c-a4e2-9a8a302cf7e4`):** two fields added June 2026 — **`Idea / Angle`** (text, groups all pieces of one idea) and **`Type`** (select: Poster/Reel/Carousel/Story/Static/Video/Description/Thread). Populate BOTH on every row, plus `Platform`, `Brand`, `Account`. Group all of an episode's pieces under ONE **Content Library** campaign.

**Presenting a batch to Joe (locked, corrected 4×):** present **ONE PIECE PER MESSAGE** — that piece's content + its visual TOGETHER in the same message, exactly as he'd post it — then wait for "next". NEVER dump all pieces in one message; NEVER separate all-copy-then-all-visuals; don't ask how many — just execute the structure. For an idea with several platform pieces, you may group that one idea's pieces together, but still content+visual paired per piece.

**Applies to ALL brands** (Successful Idiots, Storage Moguls, Joe Downs, …) — the `*-podcast` skills inherit this structure, including `joe-from-podcasts` for Joe's own LinkedIn/Instagram/Facebook/X.

### ⚠️ RELATABILITY — lead with the example that mirrors the READER's business, not the narrator's industry (Joe flagged, ALL brands, June 2026)
Joe: *"our content isn't really getting relatable to our audience. How can we improve that?"* The leak: episode material defaults to the host's OWN industry (storage units, 5x10 vs 10x10, the rented-truck-in-the-driveway) but the audience is broad (SI = small-business owners of every trade; SM = aspiring storage investors who aren't operators yet). When a salon owner / plumber / coffee-shop owner reads a storage-unit example, they have to TRANSLATE it to their world before it lands — and most won't bother. That translation gap is the relatability leak.

**The fix (apply to every brand-content piece):**
1. **Lead with the example that looks like the reader's OWN business**, not the narrator's. The episode almost always already contains universal examples — use them as the OPENER, demote the host's-industry example to "one example among several." (Ep031 had the hairdresser pausing mid-haircut, the sandwich shop "want your usual ready for 11:30?", the Dallas Uber driver, the text you missed at dinner — all far more relatable than "a storage business.")
2. **Speak to "you, the owner" doing a specific everyday thing** (phone face-down at dinner, cutting hair, making sandwiches) → THEN name the universal lesson. Concrete-and-mine-too beats abstract-or-someone-else's.
3. **Fix the VISUAL too, not just the caption.** A poster that says "what one missed call costs *a storage business*" has the same leak as the caption. Edit the poster copy to the universal version ("*a small business*" / "*your business*"), re-render, and vision-QA it. The caption and its paired visual must BOTH pass the relatability test (Joe checks the art, not just the words).
4. **Storage/the host's niche is ONE example, never the default frame.** Use it when it's the strongest illustration, but never let it be the only lens — a piece framed entirely in the narrator's vertical silently excludes most of the audience.

This is the audience-fit sibling to the plain-language and human-voice rules: those make a line CLEAR; this makes it land as "that's ME." Run it as a check before shipping: *would a reader OUTSIDE the host's industry see themselves in the first two lines AND in the visual?*

### ⚠️ SAME content adapted per platform — NEVER a different idea per platform (Joe corrected, ALL brands, June 2026)
Joe: *"we should always be posting the same theme/content across all platforms, just changing it to match the platform, not changing the content itself… I noticed you did the wrong thing even for the other brands."* The idea/theme is CONSTANT across LinkedIn · Instagram · Facebook · X; only the platform FIT changes. The practical collapse Joe locked for Joe's socials (and the model to carry to the other brands):
- **LONG FORM** = one body for **LinkedIn + Instagram + Facebook** (these three share the same long copy).
- **SHORT FORM** = a tight ≤280-char cut for **X**.
So an idea is really TWO written variants (long + short), not four divergent posts — and definitely not four different ideas. When adapting, keep the SAME insight/story; change length/hashtags/format to fit the platform. (For the Joe-socials REVIEW DOC packaging of this, see the `linkedinreview` skill's "Multi-platform block review format".)

### ⚠️ FACTUAL INTEGRITY GATE — invent nothing, and write from STORAGE reality (Joe corrected BOTH on scheduled posts, June 2026)

Applies to EVERY content-generating skill that inherits this model (`linkedin-posts`, `joe-from-podcasts`, `storagemoguls-podcast`, `successfulidiots-podcast`, and the `linkedinreview` packaging). Two failures rode all the way into SCHEDULED Metricool posts this session — treat this as a hard gate run on every storage/Joe-history piece, alongside the humanizer and length gates:

1. **NEVER fabricate Joe's personal history, origin, or first-deal story.** A post claimed *"I got in because I watched people chase exciting deals and lose money… my first deal was a small facility most investors would've skipped."* Joe: *"that's not how my first deal went or why I got into storage."* A plausible-but-invented biography is still a fabrication, and worse than a wrong stat because it's first-person testimony. If an angle needs an origin/first-deal/motivation detail and you don't have the REAL one (from a transcript, prior approved post, or Notion), either write the point WITHOUT inventing specifics, or ask Joe for the real line and hold. Never fill the gap with invention.

2. **Write storage copy from STORAGE reality — don't leak generic real-estate diligence language.** A rent-roll post listed *"month-to-month tenants who could leave next week"* as a hidden risk. Joe: *"month-to-month as an issue doesn't make sense. All storage tenants are month-to-month."* In self-storage, **month-to-month is UNIVERSAL and normal** — never a red flag. That framing is correct for apartments/commercial (where leases are standard and a M2M tenant signals instability) and leaked in from generic-RE templates. Before shipping any storage "diligence / what to watch for" piece, sanity-check each item against how storage actually works (M2M leases, tenant insurance, delinquency/auction, unit mix, occupancy economics). If a "risk" would only be a risk in a leased asset class, cut it.

**Diagnostic when Joe flags a published/scheduled post as wrong** ("I thought you pulled from our data — how is it wrong?"): don't guess — TRACE it. Pull the live post from Metricool (`getScheduledPosts`, Joe Downs blogId 6425321), compare to the review Doc, and determine where the error entered. Usually the doc faithfully mirrors copy already written/scheduled by another account (e.g. `alvin@belroseam.com`), so the error lives in SOURCE drafting, not the pipeline step. Answer with the honest finding + own the discipline failure plainly + offer the fix and a pause if it publishes today. (Full version lives in `linkedinreview` WRITING PRINCIPLES #12 + its diagnostic subsection.)

### Voice default (Joe directive, June 2026)
For a brand's episode content, DEFAULT to that **brand's voice** (e.g. SI content = SI brand voice, written AS the brand). Do NOT switch to Joe's personal first-person voice unless Joe **explicitly** asks for it ("make it Joe's voice" / "joefrompodcast"). When he does, that's when `joe-from-podcasts` (Joe Personal account, first-person, podcast invisible) takes over. Don't ask which voice each time — assume brand voice for brand work, personal voice only on explicit request.

## 🔁 Close the factory loop — MEASURE → feed back (Joe's model, operationalized June 2026)

Joe's factory model is **generate → approve → publish → MEASURE → feed back**. The left half (generate/approve/publish) was built first; the **measure→improve** half is the one that's easy to leave designed-but-never-running. Turn it ON with a recurring cron, don't hand-run it.

- **Weekly Growth Scorecard cron** (job_id `8589e097dd58`, Mondays 15:00 EAT = 08:00 ET): pulls week-over-week views/reach + engagement + FOLLOWERS per brand/network from Metricool and ends with tailored "do this next week" suggestions.
- **Joe's north-star for content (locked):** success = WEEKLY GROWTH in reach/engagement/followers on EVERY platform, trending up week-over-week. **Judge on ROLLING WEEKLY TRENDS, never day-one** — Joe: "content has value but not everyone sees it after one day." A post still gaining steam is "gathering steam," NOT a failure. Any analytics brief MUST include concrete, tailored suggestions (≥1 for follower growth, ≥1 for reach), never just numbers.
- Metricool blogIds + the EAT-vs-ET timezone mapping live in `references/live-ids.md`. Analytics metric fieldIds differ per network — confirm with `getAnalyticsAvailableMetrics(network, connector="evolution")` (IG examples: followers `IGEV01`, views `IGEV05`, reach `IGEV06`, account interactions `IGEV38`, engagement `IGEV9999`).
- Don't add more analytics crons until a few weekly cycles have produced a trend line (Joe: let it run ~3 weeks before a monthly deep-dive).

## 🩺 Periodic SYSTEM AUDIT pass ("analyze everything, make it better")

Joe periodically asks to review the whole system and come back with an improvement plan ("look at the databases, the maps, the skills, everything"). This is a recurring CLASS of task — run it as a disciplined pass, not an ad-hoc poke. Full procedure + the recurring gap catalogue: **`references/system-audit.md`**. The short shape:
1. **Inventory in parallel before forming opinions** — skills (`skills_list`), on-disk assets/scripts/Remotion (`search_files`), Notion architecture (fetch the Production Map `386cc74e-bcf3-81f2-84e3-ca5cf644c510` + `live-ids.md`), memory/USER.
2. **Score against the factory loop** — is every stage (generate→approve→publish→measure→feed back) actually running? The open loop is usually the highest-value fix.
3. **Present a prioritized plan as a table** (issue · why it costs · severity), recommend the earliest high-leverage + low-risk moves, and ask the 1–2 decisions that gate the rest. Joe greenlights fast — be ready to execute same session.
4. **VERIFY by exercising, not asserting** — after building anything, actually run it (render a poster, test the cron is healthy, dry-run the uploader's cred-load) and clean up all test artifacts. Joe values verify-before-asserting.
5. **Log the audit in the Production Map** (a dated "System audit + improvements" section) — that's the work-log home, not memory.

## 🗺️ CHECK THE MAP FIRST (Joe directive, June 2026)

Before starting ANY episode work (understanding, content, visuals, scheduling), open the **Knowledge & Production Map** page on the Hub — `386cc74e-bcf3-81f2-84e3-ca5cf644c510` (🗺️ Knowledge & Production Map). It is the single at-a-glance dashboard: the 4-homes table (where each data type lives), the per-episode production-status table (Understanding · Content · Visuals · Scheduled), a known-issues/cleanup log, and on-disk asset locations. This page exists specifically because work got rebuilt blind after the fact (Ep030 test posters regenerated; Ep030 understanding mis-filed and not found). **Read it first; update its status cells + cleanup log after completing each stage.** Episode knowledge mis-filed into a Knowledge DB instead of the Episode Library is the canonical failure it prevents — if a record's title needs an episode number, it belongs in the Episode Library, never Knowledge.

### ⚠️ Don't trust a "build from scratch" framing — VERIFY current state first (Joe corrected this hard, June 2026)
A task prompt can SAY "build the full X collection" / "the 18 pieces are written" when the work was already partly or fully done in a PRIOR session — handoff prompts get written before earlier work finishes, then the framing goes stale. Acting on the prompt's framing led to nearly **rebuilding a finished, already-uploaded 10-poster collection from scratch** and to a 30-minute reconstruction of what was actually done. The discipline, in order, before any "build/generate/create the X" task that could already exist:
1. **Check the Production Map** (above) for the per-stage status.
2. **`session_search`** the topic (e.g. "Ep030 posters", "Ep030 18 pieces") to see what a prior session actually produced and where it left off — FTS keyword search can miss; also browse recent sessions and scroll the big one. Quote what you find, don't assume.
3. **Inventory the on-disk assets** (`search_files` for `*Ep0NN*` posters/scripts/`*_media_urls.json`) and the relevant Notion DB rows — distinguish FINAL deliverables from earlier TEST/superseded drafts (e.g. `Ep30_*` test set vs `Ep030_*` final; a stale `ep30_media_urls.json` that maps to scrubbed renders).
4. Only THEN decide: extend/fix what exists vs. build new. If the prompt's premise contradicts what you find, SAY SO and confirm scope before producing — don't silently build over finished work.
The deeper rule: the system of record + session history are ground truth; a chat prompt's framing is a hint, not a fact. Verify before asserting "this isn't done yet" or "the 18 don't exist."

## Live structure (IDs — verify with notion-fetch before relying on them)

Parent page **🧠 Brand Knowledge Hub**: `383cc74e-bcf3-8156-b28a-f44894f49c54`

| Database | data_source_id | Role |
|---|---|---|
| Storage Moguls — Knowledge | `d4092004-5565-4fea-acc8-2e81751f7017` | reusable knowledge |
| Successful Idiots — Knowledge | `1426722b-61b0-412d-a797-760b96d393a7` | reusable knowledge |
| Joe Downs — Personal | `13ce2212-46ce-4fff-9432-5bcbb8d729dd` | Joe's voice/framework/brand |
| Content Library (PARENT) | `2399bec0-1197-422d-a21c-5ff2500fa39d` | campaigns / batches |
| Content Pieces (CHILD) | `d93e3c62-348d-439c-a4e2-9a8a302cf7e4` | individual posts, per-piece approval |

Content Pieces ↔ Content Library are linked via the relation **Parent Campaign** (child side) / **Pieces** (parent side).

### ⚠️ `notion-create-pages` with NO `parent` silently creates BLANK orphan pages (bit this June 2026)
If you omit the `parent` argument on `notion-create-pages`, the call SUCCEEDS but the pages land as **blank workspace-level pages** — your `properties` (Title/Brand/Account/Post Body/…) are NOT applied (they only bind to a data-source parent's schema), so you get rows of `"New page"` with the content dumped into the page body and empty props. It is NOT filed into Content Pieces. ALWAYS pass `parent: {type:"data_source_id", data_source_id:"d93e3c62-…"}` on every Content Pieces create. The response is the tell: real filing echoes the full `properties` map back; an orphan echoes `"properties":{}`. Verify the echoed properties are non-empty before reporting "filed."
- **Recovery when orphans exist:** there is NO MCP trash/delete tool. The MCP OAuth token (`mcp-tokens/Notion.json` `access_token`) is scoped to `mcp.notion.com` and returns **401 against the public `api.notion.com`** REST API — so you CANNOT archive orphans via `PATCH /v1/pages/{id}` with that token (don't loop on the 401). Best available: `notion-update-page` rename each orphan to `"[TRASH - orphan, ignore]"` so the user one-click-deletes them in Notion, then RE-CREATE the rows correctly with the `parent` set. Watch for a second self-inflicted bug in the same batch: a truncated/garbled JSON value in one piece (e.g. a mangled `Source` URL) drops that whole row's properties too — re-read each piece's props before submitting a multi-page create.

## Don't declare premature blockers — diagnose, then try a working variant (Joe corrected this, twice — June 2026)

A recurring failure mode Joe pushed back on hard: stating a limitation as permanent before actually verifying it. Two instances in one stretch:
- I told Joe **"Notion needs reconnecting / check your API keys."** Wrong on two counts — Notion is an **MCP server (no API keys)**, and it was `✓ enabled` the whole time; only the in-session tool handles hadn't loaded. Joe: *"notion should be working we use mcp not api keys stop forgetting this."*
- I told Joe **"there's no way to attach media except a public link, and the MCP can't upload from Drive."** Joe: *"check again... is there really no way?"* — and on re-reading the tool schema + trying variants, a working path existed.

**The rule:** before telling Joe something is impossible/broken/needs his intervention:
1. **Re-read the actual tool schema / error** — don't reason from memory about what a tool "can't" do.
2. **Try at least one corrected variant** (different URL format, different arg shape, different interpreter, a health-check that doesn't trigger auth). Many "can't" conclusions died after one variant.
3. **Distinguish "server down" from "tools not loaded this session."** `hermes mcp list` shows server health; if it's `✓ enabled` but the `xxx_*` tools aren't in the callable set, that's a **load quirk → session restart**, NOT a disconnect. Never say "reconnect / re-auth / check keys" for a load quirk.
4. Only after that, report the blocker — and frame it as the specific thing that failed + the fix, never "this tool doesn't work."

Phrasing matters: "the tools aren't loaded in this session yet — a restart will pull them in" is right; "Notion is disconnected, reconnect it" is the kind of wrong that erodes trust.

### Reaching an MCP server when its tools aren't loaded in-session (verified technique)
When the server is healthy (`✓ enabled`, valid cached token) but the `xxx_*` tools aren't callable this session, you don't have to wait for a restart — you can drive the server's HTTP endpoint directly with the cached OAuth token. This unblocked real Notion work mid-session (querying Content Pieces, creating the JD brand-definition page) without a restart. Full recipe (initialize→notifications/initialized→tools/list→tools/call over JSON-RPC, the Cloudflare-1010 User-Agent gotcha, SSE parsing) is in `references/mcp-server-connections.md` → "HTTP-bridge fallback".

## Design principles (locked, set by Joe)

0. **Understand WHY a structure exists before restructuring it (Joe directive, June 2026).** When something in the Hub looks "messy" or mis-organized, do NOT react to the symptom and re-shuffle. First read the documented design rationale (this SKILL.md + the relevant `references/`) and the existing records to learn *why* each DB/field was created and what data type it holds — THEN decide the optimal structure. The Ep030 mis-filing wasn't a judgment call to re-litigate; the 4-homes design was already locked, so the fix was "move the record to the home the design already specifies," not "invent a new structure." Joe: *"look at the past to understand why each one was created, then make the decision on the most optimal way of structuring."*
1. **ADD, never rebuild.** New tag, column, brand DB, or content type is an additive change that never disturbs existing records. Never restructure what's working.
   - **Saved-file naming + folder convention** (Joe directive, June 2026): every generated asset (posters, carousels, thumbnails) is saved under `C:\Users\somea\BrandAssets\{Brand}\{Platform}\` named `{BRAND}_{PLATFORM}_{TYPE}_{REF}_{slug}_v{N}.{ext}` (brand codes SI/SM/JD/STP/BEL), with the editable source (e.g. `.html`) kept beside its exported `.png`. Anyone scanning a folder can then tell exactly what a file is. Full spec in `references/asset-naming.md`. Never dump assets in the home dir / Desktop.
2. **Separation of concerns.** KNOWLEDGE ≠ CONTENT ≠ PRODUCTION. Three jobs, three homes. The SM Content Tracker (production workflow) stays SEPARATE from the Hub — do not merge them.
3. **Shared schema across brand Knowledge DBs** so you can query within one brand or across all: Title · Type · Topics · Summary · Source(URL) · Status · Last Synced. Full knowledge body goes in the record's **page content**, not a property.
4. **Provenance is the integrity anchor.** Every record's Source links back to its origin (Drive doc / Notion page / review doc). Never strip it.

## Approval model — PER PIECE, in Notion, private to Joe

Joe tracks approval **himself, in Notion** (his eyes only) — NOT in the shared Google review doc. Each individual post is a row in **Content Pieces** with two checkboxes:
- **Joe Approved** — Joe's private one-click gate.
- **Partner Approved** — the external/SSI gate (preserves the long-standing hard rule).

A piece is cleared to publish only when **both** are ticked. The Status field (Idea→Draft→In Review→Approved→Published) tracks workflow; the checkboxes are the actual approval gates. Tip to give Joe: a filtered view "Joe Approved = unchecked" is his review queue.

**Auto-updating status from approval?** Native Notion DB automations are UI-only and NOT API-configurable — the agent cannot wire them. The API-buildable alternative is an **`Approval State` formula column** that derives a live readout from the two checkboxes (Joe chose this). See the "Deriving approval state" section in `references/notion-mcp-db-patterns.md` for the verified formula and the read-only tradeoff.

**HARD RULE carried over:** never mark the Notion SM Content Tracker until Joe explicitly says the partner approved. The Hub's checkboxes do not auto-propagate to the Tracker.

## Account vs. Brand distinction (critical, Joe corrected on this)

Content splits by **account**, not just brand:
- **Joe's personal** LinkedIn (via `joe-from-podcasts`) — insight extracted, podcast invisible, Joe's first-person voice.
- **Brand accounts** (via `storagemoguls-podcast` / `successfulidiots-podcast`) — written AS the brand, third-person Joe.

In Content Pieces, encode this with the **Account** field (Joe Personal / Brand Account) and the **Brand** field. Filter by Account="Joe Personal" for Joe's feed; by Brand for a brand's accounts.

## LinkedIn is the master format

So far content is LinkedIn-only **by design** — it's the master that gets **repurposed** into other platforms (IG, FB, YouTube, Shorts) matching each platform's standard. When repurposing, create the platform variant as a **child piece linked to the master** via Related Content / Parent Campaign, so the master→variants chain stays connected. Don't scatter variants as unlinked rows.

## Keeping memory lean (what lives where)

Joe's persistent memory runs near its hard cap, so reference data does NOT belong in always-on memory. The rule Joe drove: **behavioral rules + high-frequency environment facts → memory; reference data (IDs), procedures, and finished task state → skill `references/` files (or deleted).** This is why the Hub's IDs live in `references/live-ids.md` and the LinkedIn infra lives in its own skills, with memory holding only pointers + hard rules. Full rule, the worked example, and the near-full-cap `remove-before-add` mechanic that prevents looping live in `references/memory-discipline.md`.

## Building incrementally

Don't bulk-fabricate. Capture knowledge/content at the moment it's relevant (we're in a doc → offer to file the durable parts), or on a deliberate "pull the X folder into the Hub" request. New records land as **Draft / In Review** — never Verified/Approved until Joe says so.

## Reading raw material from Drive

The Notion `fetch` tool CANNOT read Google Docs (returns "URL type webpage not currently supported"). Use the google-workspace CLI instead:
`python C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py docs get <FILE_ID>`
(absolute Windows path; `$HOME` mis-resolves in git-bash).

**`.docx` (uploaded Word files, e.g. podcast Show Notes/Blog) need a different path** — `drive download --export-mime text/plain` returns binary garbage and `read_file` errors on them. Download the raw file then extract with `C:/Python313/python.exe` + python-docx (the only interpreter here with the module). Full episode-ingestion recipe + source-doc gotchas: `references/episode-ingestion.md`.

## Episode Library layer (4th DB type, Joe's design)

Beyond the three layers (Knowledge / Content Library / Content Pieces) each podcast brand has an **Episode Library** DB — a separate "light storage" home so episode recaps DON'T clutter the evergreen Knowledge DBs (Joe corrected an early mistake of dumping episode summaries into Knowledge). One row per episode, all insights in the page body + a `Key Insights` summary property; mine it later for a comment/caption/post. IDs + schema in `references/live-ids.md`; the ingestion recipe in `references/episode-ingestion.md`. **Upgrading shallow back-catalog rows to the deep "understanding" method — depth-audit rubric, REBUILD-IN-PLACE (don't delete-first), and the structured mining fields (Keywords/Phrases · Frameworks · Stat-points, Joe validated June 2026): `references/episode-depth-rebuild.md`.** Key discipline from there: audit depth by reading bodies (guest-interview rows look short but are often SOLID — don't blind-sort by length), and the MCP can't hard-delete so overwrite-in-place beats delete-then-recreate. Keep Knowledge DBs to ~4 evergreen reference pages (Brand Voice & Tone, Content Pillars, Audience & Positioning, Brand Style Guide) + a Website Reference.

## Website deep-dive standard (Joe expects ALL pages, not the homepage)

When asked to pull a brand's website into the Hub, a homepage-only pass is NOT enough — Joe explicitly wants **every page crawled and ACTIONABLE insight extracted**, not just surface facts. Standard:
1. Get real nav/footer hrefs from the DOM (`document.querySelectorAll('a')` via browser_console) — Webflow/JS sites often don't expose links in the first snapshot, and header links can 404 (note those as a flag for the team).
2. Visit EVERY distinct page (divisions, pricing/specs, who-uses/segments, about, blog, masterclass, episodes). Capture concrete data: exact prices, specs, counts, market stats, named assets, customer segments, CTAs, active-deal/founders-rate offers.
3. File ONE "Website Reference" entry per brand (Type=Reference/Facts, Status=Verified) with two sections: a **site map** (what's on each page) AND **Actionable insights** (content hooks, funnel/segmentation implications, reusable stats, and ⚠️ issues found — broken links, stale/inconsistent dates, missing lead magnets). Replace this entry on a re-dive rather than duplicating.

### ⚠️ "Set up the brand" is usually a RE-DIVE — verify current state, then DIFF (StorPro, July 2026)
A "let's set up the [brand], go through its website and gather its files" ask for a brand that already has a Knowledge DB is a **re-dive**, not a from-scratch build. The brand DB is rarely as empty as the ask implies — StorPro already had 3 pages from a June 18 session (Positioning & Voice, Style Guide, Website Reference). This is the website-specific case of the "don't trust a build-from-scratch framing" rule.
- **`notion-search` the brand's Knowledge DB FIRST** (query=brand name, scoped `data_source_url:"collection://<id>"`) to enumerate existing pages before building anything. Search-indexing LAGS fresh creates, so a page you just created may be missing from search for a minute — `notion-fetch` by id to confirm a create actually landed (and that its parent is the DB, not workspace root — the orphan tell).
- **Pricing + promos are the most volatile fields** on a live site and the whole point of a re-dive. StorPro had DROPPED its rates materially since June 18 ("Inquire"/$1,600/$1,200/$1,050/$900 → $1,499/$1,049/$799/$679/$585) and added a "**First Month FREE**" promo on every tier. The value was catching that drift, not re-typing the site map.
- **UPDATE the Website Reference IN PLACE**, don't duplicate: `notion-update-page command:"replace_content" new_str:<full refresh>`, then a second `command:"update_properties"` call to refresh `Summary` + `date:Last Synced:start`. Both worked cleanly via the HTTP-bridge.
- **Explicitly flag what CHANGED** (a ⚠️ old→new line in the refreshed body + a note that older collateral quoting old numbers is now wrong). Joe values the drift being surfaced, not silently overwritten.
- The evergreen pages (Positioning & Voice, Style Guide) are brand-guide-sourced and usually DON'T drift — leave them unless the guide changed. Only the site-sourced Website Reference needs the re-dive refresh.

**What "set up the brand" resolves to (full checklist):** (1) re-dive the site → refresh/create the Website Reference; (2) confirm the ~4 evergreen Knowledge pages exist (Voice, Content Pillars, Audience/Positioning, Style Guide) and ADD any missing one — StorPro was missing **Content Pillars**, so it got added (Type=SOP/Process) built from the site's own tenant segments + live promo + dual "livelihoods & lifestyles" framing; (3) set up the local `BrandAssets/{Brand}/` tree with **`Photos/` + `Videos/` + `Logos/` + `Source-Media/` drop-zones + a README** when the user says they'll add media later (don't wait for the files — build the empty homes now so there's an obvious place to drop them).

## MCP servers feeding the factory (Notion + Canva + Metricool)

The Hub runs on THREE MCP servers connected to the `joeagent` profile, plus the google-workspace CLI for Drive. They cover the full lifecycle: **store → design → publish/measure.**
- **Notion** (OAuth URL `https://mcp.notion.com/mcp`) — the finished-goods store (this Hub).
- **Canva** (OAuth URL `https://mcp.canva.com/mcp`) — the **design/repurpose engine**. 33 tools incl. search/get/copy/resize/export designs, full editing transactions (start→perform→commit/cancel), **brand templates + brand kits**, folders, comments, asset upload from URL, and `generate-design`. This is the real engine for the "LinkedIn master → platform variants" repurpose step described above: pull brand templates/kits, autofill with the approved post copy, export per-platform graphics, then link variants back to the master Content Piece.
  - **BUILDING an actual poster/design in Canva** (verified pipeline + pitfalls, July 2026): `references/canva-poster-build.md`. Short version: `generate-design` (Canva AI) REWRITES copy / drops the handle / hallucinates logos — never use it for spec-exact episode posters. The working route is **author self-contained HTML → upload to a public URL (Cloudinary raw) → `import-design-from-url` → it becomes a native editable Canva design.** ⚠️ Two hard pitfalls: (a) the editing tools EDIT existing elements — there is NO "add a text box to a blank canvas" op, so HTML-import is how the text/layout gets in; (b) CSS `background-image` PHOTOS do NOT survive import (you get the layout on a black canvas) — place the photo as a real Canva asset via `upload-asset-from-url` → `update_fill` on the imported full-page fill → commit. Also: `browser_navigate` to a canva.com editor URL hits Cloudflare bot-detection — use `export-design`/`get-design-thumbnail` to see renders, not the browser.
- **Metricool** (HOSTED OAuth URL `https://ai.metricool.com/mcp`, `--auth oauth` — migrated June 2026 FROM the old local `uvx mcp-metricool@latest` stdio server) — the **publish + measure engine**. 7 tools on the hosted server: `getBrandSettings` (the brand list — use this instead of the old `get_brands`), `getScheduledPosts`, `createScheduledPost`, `updateScheduledPost`, `getAnalyticsDataByMetrics`, `getAnalyticsAvailableMetrics`, `getBestTimeToPostByNetwork`. This CLOSES the factory loop: generate (skills) → approve (Notion checkboxes) → **publish (Metricool) → measure (Metricool analytics) → feed performance back into the next batch.** Brands live in Metricool as `blogId`s (Successful Idiots, Storage Moguls) — every analytics tool needs the blogId. **Prefer the hosted OAuth server over the old local stdio one** — it drops the token-juggling (no METRICOOL_USER_TOKEN/ID env vars, no uvx cold-start) and the token-redaction pitfall.

**Adding/managing MCP servers (technique that bit this session):**
1. ALWAYS `export HERMES_PROFILE=joeagent` first — an unset profile targets the DEFAULT profile and writes config to the wrong place.
2. `hermes mcp add <Name> --url <https endpoint> --auth oauth` opens a browser for OAuth; tokens cache in `profiles/joeagent/mcp-tokens/` so re-runs don't re-auth.
3. ⚠️ **The interactive `Enable all N tools? [Y/n/select]` prompt reads stdin and hits EOF when the command runs inside an agent tool call (foreground OR background), so it CANCELS without saving** — even though OAuth already succeeded and it printed the tool list. The fix is to pre-feed the answer on stdin: **`printf 'Y\n' | hermes mcp add <Name> --url <url> --auth oauth`**. Verify with `hermes mcp list` (should show `✓ enabled`).
4. **Newly added MCP tools load at session START — they appear NEXT session, not the one where you added them.** Tell the user this; don't try to call the new tools in the same session.
5. ⚠️ **Hosted OAuth add MUST run in a PTY (`pty=true`).** The browser-OAuth flow auto-opens the auth URL and completes inline (no separate `hermes mcp login` step needed) — but ONLY in a real terminal. Without PTY it errors `non-interactive environment and no cached tokens found` and saves the server **disabled**. Metricool migration recipe that worked: `hermes mcp add metricool --url https://ai.metricool.com/mcp --auth oauth` in a `pty=true` terminal → browser opens → authorize → it connects, lists tools, then prints `Enable all N tools? [Y/n/select]`. On the FIRST PTY run that enable prompt cancelled (no stdin answer); re-run the SAME command with `printf 'Y\n' | ...` (tokens are now cached so it skips straight to connect+enable) to save enabled.
6. ⚠️ **`--auth oauth` silently drops from config if the first connect fails (401) and you choose "save anyway".** The server saves with NO auth field, so the later `hermes mcp login <name>` errors `not configured for OAuth (auth=None)`. You CANNOT fix it by editing config.yaml directly — the `patch`/`write_file` tools REFUSE to touch Hermes config ("security-sensitive configuration"). The fix: `hermes mcp remove <name>` then re-add fresh in a PTY so OAuth completes inline on the first try (step 5).

**Local stdio servers (uvx/npx, env-var auth) are different.** Not every server is a hosted OAuth URL — many vendor servers (e.g. Metricool = `uvx mcp-metricool@latest` + token/ID env vars) run locally over stdio. Add them with `--command` + `--arg` + `--env` instead of `--url --auth oauth`. Three pitfalls that bit the Metricool connect: **(a)** never pass `--upgrade` as a uvx arg — it's invalid and the stale cache causes an import crash; use `<pkg>@latest`; **(b)** pre-warm with `uvx <pkg>@latest --help` so the cold install doesn't time out the handshake; **(c)** ⚠️ **after the add, the token is redacted to `***` EVERYWHERE** (config-at-rest, echoed terminal commands, search output) — you CANNOT re-read or re-curl with it later, so don't loop on 401s; read brands/analytics via the `get_brands` MCP tool next session instead. Full local-stdio procedure, the auto-resolve-User-ID-from-token trick, the redaction pitfall, and the live brand→blogId table: `references/mcp-server-connections.md`.

Verify Canva endpoint is reachable before wiring: a `curl` POST to the `/mcp` endpoint returns `401 invalid_token` (OAuth challenge) — that's the expected "alive, needs auth" signal, same pattern as Notion.

Full connection procedure, the enable-all-prompt fix, and the complete 33-tool Canva inventory + repurpose workflow live in `references/mcp-server-connections.md`. That file also has the **TROUBLESHOOTING section for the "browser keeps popping for auth" / "callback link won't connect" loop** — short-lived tokens + a failing silent refresh, the single-use ephemeral `127.0.0.1:<PORT>/callback` listener (stale links can't connect → re-auth loop), the clean `hermes mcp login <server>` fix, and the token-file health-check that diagnoses it WITHOUT triggering a popup. **For Metricool specifically: Joe's STANDING POLICY is to keep the connector DISABLED by default and only enable it for sessions where we're actively scheduling/analyzing** — disabling it (`hermes config set mcp_servers.metricool.enabled false`, takes effect on session RESTART) is the ONLY thing that fully stops the every-few-minutes popups, because the ~179s token + rotating refresh token keeps the connector cycling while loaded. **At the start of each session ASK Joe "Touching Metricool today?"** before assuming it should be on. The full default-policy section, the enable/disable commands, and the deeper root-cause (refresh-token rotation; the token-keeper; the correction that the connect-timeout fix does NOT stop steady-state popups) are all at the TOP of `references/metricool-media-and-auth.md` → "DEFAULT POLICY — keep the connector OFF when not scheduling".

**Brand assets (colors, fonts, logos, Canva kit IDs):** the per-brand visual identity and the Drive "Branding" folder + Canva brand-kit IDs live in `references/brand-assets.md`. That file ALSO holds the **per-brand Metricool SmartLink spec** (palette + button order + links, with verified-vs-confirm status) — Joe asks for this repeatedly; there's no create-smartlink API so the deliverable is a copy-paste spec, and missing social URLs come from each brand's connected accounts in Metricool, never guessed slugs. The authoritative source for colors/fonts is the per-brand **style-guide JPG** in the Drive Branding folder (`1b8ruP794btpj1i-OVUqL-UNa1475Yngm`) — read it by loading the Drive direct-download URL (`https://drive.google.com/uc?export=download&id=<ID>`) into vision. The Canva `list-brand-kits` API returns only kit IDs + thumbnails, NOT colors/fonts, so don't rely on it for specs.

## Notion-MCP database-building quirks (these cost failed calls — read first)

See `references/notion-mcp-db-patterns.md` for the full, verified recipe.

**⚠️ READING Content Pieces (or any Hub DB) — do NOT default to SQL (Joe flagged hard, June 2026: "always having issues with SQL", then "maybe you shouldn't be using SQL").** `notion_query_data_sources` mode=sql routes through a `collection_router` upstream that returns `429 collection_router_upstream_429` and KEEPS 429'ing through 30–120s waits and trimmed queries — it's an upstream throttle, not your spacing. The reliable route is a **database VIEW query** (`notion_query_database_view` on a saved filtered view) or `notion_search` scoped by `data_source_url`. A reusable **"This Week (agent)" view already exists on Content Pieces** (db `e80cece169d7484d9b49a631dcd349e8`, ds `d93e3c62-…`) — just `notion_update_view` its date filter and re-query, no SQL. Bail after 2 SQL 429s and switch routes; never rapid-retry SQL. Note Content Pieces `Date` is a CONTENT/sort date, NOT a publish-schedule date — the live publish calendar lives in Metricool. Full route-fallback order + recipe at the TOP of `references/notion-mcp-db-patterns.md`.

The two database-BUILDING quirks that bite hardest:
1. **DATE columns created via `notion-create-database` SQL DDL** get a malformed literal name like `date:Last Synced:start`. Fix immediately after creation with `notion-update-data-source` → `RENAME COLUMN "date:Last Synced:start" TO "Last Synced"`. When writing date values via create/update-pages, the property key is `date:<Col>:start`.
2. **Relation property values must be full page URLs**, NOT bare UUIDs. `["383cc74e..."]` fails with "invalid compressed URL / shorthand identifier"; `["https://app.notion.com/p/383cc74e..."]` works.

---
*Sources: this session (June 2026) — Hub design conversation with Joe; Canva MCP connected June 2026; Metricool MCP (local stdio, publish+measure loop) connected June 2026. Reference files: `references/notion-mcp-db-patterns.md`, `references/mcp-server-connections.md`. Companion skills: linkedin-posts, joe-from-podcasts, storagemoguls-podcast, successfulidiots-podcast, linkedinreview.*