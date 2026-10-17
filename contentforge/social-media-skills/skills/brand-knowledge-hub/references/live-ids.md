# Brand Knowledge Hub — Live IDs Registry

The canonical source of truth for the Hub's Notion IDs. Memory holds only a pointer here.
**Always `notion-fetch` to confirm before relying on an ID** — Notion can change collection IDs on structural edits.

All of this lives on **ONE** Hermes profile: **joeagent** (Joe's deliberate choice — NOT split across profiles).

## Parent page

- **🧠 Brand Knowledge Hub** (parent page): `383cc74e-bcf3-8156-b28a-f44894f49c54`

## Databases (data_source_id / collection://)

| Database | data_source_id | Role |
|---|---|---|
| Storage Moguls — Knowledge | `d4092004-5565-4fea-acc8-2e81751f7017` | reusable knowledge |
| Successful Idiots — Knowledge | `1426722b-61b0-412d-a797-760b96d393a7` | reusable knowledge |
| Belrose Group — Knowledge | `92fcee0f-6faa-4533-aa8d-046c94165648` | reusable knowledge (investment-side brand, no podcast) |
| StorPro — Knowledge | `adcae7a2-57c7-4624-82c8-aef517617236` | reusable knowledge (storage facility brand, no podcast) |
| Joe Downs — Personal | `13ce2212-46ce-4fff-9432-5bcbb8d729dd` | Joe's voice / framework / brand |
| Successful Idiots — Episode Library | `2ad9417f-39dd-430d-a34a-6b4684e4012f` | light episode storage (1 row/ep, mine later) |
| Storage Moguls — Episode Library | `f81961d0-bb61-4425-abd9-6f22093cdb7d` | light episode storage (empty, ready) |
| Content Library (PARENT) | `2399bec0-1197-422d-a21c-5ff2500fa39d` | campaigns / batches |
| Content Pieces (CHILD) | `d93e3c62-348d-439c-a4e2-9a8a302cf7e4` | individual posts, per-piece approval |

### Episode Library DBs (Joe's design, set this session)

Episode references are **NOT** evergreen Knowledge — they're a separate "light storage" layer: capture each episode once (1 row per episode, all insights in the page body + a `Key Insights` summary property), then **mine** it later for a comment/caption/post. Schema per brand: Title · Episode · Status · Topics (multi) · Key Insights · Hosts · Drive Folder(url) · Source(url) · Published(date). Keep evergreen Knowledge DBs pristine; episodes live here.

**Populated state (June 2026):** SI Episode Library = full run **001–030** (028/030 deep; 001–027 from Show Notes; SI 022 flagged Needs Review — its Drive Show Notes duplicated 021). SM Episode Library = **001–008** (guest-interview format, built from BLOG docs since SM Show Notes are empty stubs; SM 004 flagged Needs Review — its BLOG duplicated 003). Each brand's Knowledge DB also has a **Website Reference** entry (Verified) pulled from the live site.

⚠️ **Source-doc gotchas learned this session:** (1) SM 'Show Notes.docx' files are EMPTY stubs — use 'BLOG.docx' for SM episode substance. SI Show Notes ARE populated. (2) Some folders have a BLOG/Show Notes that's a copy-paste duplicate of the previous episode (SM 004=SM 003, SI 022=SI 021) — always sanity-check the body matches the folder name/number. (3) `.docx` extraction only works via `C:/Python313/python.exe` + python-docx.

## Metricool brand blogIds (publish + measure)

Re-confirm with `getBrandSettings` (networks change as Joe connects more), but the stable map:

| Brand | blogId | Networks connected (June 2026) |
|---|---|---|
| Successful Idiots | `6374077` | Facebook, Instagram, LinkedIn, TikTok |
| Storage Moguls | `6425193` | Facebook, Instagram, LinkedIn (NO X yet) |
| StorPro - Greenville | `6425267` | Facebook, Instagram, LinkedIn |
| Joe Downs | `6425321` | Instagram, LinkedIn |

All brands' Metricool timezone = **America/New_York** (analytics windows are ET). Accounts connected ~June 17–18 2026, so trend history starts there. X/Twitter being connected (June 2026) — keep generating X assets; `getBrandSettings` auto-detects it once live.

## StorPro — live facts (re-dived storpro.com, Jul 1 2026)

Verified current numbers so StorPro content doesn't inherit the STALE June-18 figures (which listed Inquire/$1,600/$1,200/$1,050/$900 — all superseded). Re-dive the site again before a big push; the flagship is filling and prices/promo move.

- **5 tiers (all month-to-month · First Month FREE · Founders' Rate · no deposit/credit check):** Super 20x50 (1,000 sf) **$1,499** · Select 20x40 **$1,049** · Standard 15x40 **$799** · Simple 15x35 **$679** · Starter 15x30 **$585**.
- **Flagship:** Greenville, SC, off I-185; 138 total spaces; 5 space options; 54' drive aisles; opening "Spring 2026" per site (confirm actual open status — may already be operating). Community clubhouse; all-inclusive amenities (14' drive-up doors, keyless mobile app, 24/7 surveillance, climate control, secure WiFi, breakout pods).
- **8 tenant segments** (the deepest content well; full detail in the Website Reference page): Contractors & Trades · Distribution & Fulfillment · Small Manufacturers & Fabricators · Makers & Creators · Auto/Art/Memorabilia Collectors · Real Estate/Staging/Event Services · Archiving/Record/Media Storage · Gear Heads & Hobbyists. Dual framing = **"livelihoods & lifestyles"** (business + personal use).
- **Contact:** greenville@storpro.com · 864-351-7302 · Mon–Sun 8am–8pm. **Socials:** IG [@storprostorage](https://www.instagram.com/storprostorage/) · Facebook [/people/StorPro/61583783248320](https://www.facebook.com/people/StorPro/61583783248320/). No X/YouTube connected yet.
- **StorPro Knowledge DB pages** (ds `adcae7a2-57c7-4624-82c8-aef517617236`): Website Reference `383cc74e-bcf3-8180-b69d-efa78b033480` (refreshed Jul 1) · Brand Style Guide `383cc74e-bcf3-810a-8ba2-f0f5103ba0cf` · Brand Positioning & Voice `383cc74e-bcf3-8129-a5ff-c2ca2f515bca` · Content Pillars `390cc74e-bcf3-8190-a662-f81ccbb5b535` (added Jul 1). Local assets tree: `C:\Users\somea\BrandAssets\StorPro\` (Photos/ Videos/ Logos/ Source-Media/ + platform folders + README).

## Timezone (operational)

Joe + the Hermes cron scheduler host both run on **EAT (UTC+3)** — so cron schedule strings ARE in EAT (a `+03:00` next_run is correct, not a bug). Metricool analytics use ET. Mapping: **15:00 EAT = 08:00 ET**. When scheduling an analytics job, pick the EAT cron time that maps to the wanted ET moment.

## Relations

- **Content Pieces ↔ Content Library:** relation is **`Parent Campaign`** on the child (Content Pieces) side / **`Pieces`** on the parent (Content Library) side.
- **Content Library self-relation:** `Related Content` (master → platform-variant derivatives).
- ⚠️ Relation property values must be **full page URLs** (`https://app.notion.com/p/<id>`), NOT bare UUIDs. See `notion-mcp-db-patterns.md` QUIRK 2.

## Joe's content-factory model

- pipeline = factory; **raw materials = Google Drive**; **finished goods = Notion**.
- Two product lines: **KNOWLEDGE** (reusable insight) and **CONTENT** (publishable posts).
- **LinkedIn is the master format** → repurposed into platform variants as linked child pieces.

## Approval model (per-piece, in Notion, private to Joe)

- Each Content Pieces row has two checkboxes: **Joe Approved** + **Partner Approved**.
- Cleared to publish only when **BOTH** are ticked. `Approval State` formula column derives a live readout (see patterns ref).
- **HARD RULE:** never mark a piece Approved/Published — and never mark the **SM Content Tracker** (a SEPARATE production DB, not part of the Hub) — until **Joe explicitly says so verbally**.
- Account field splits **Joe Personal** vs **Brand Account**; Brand field tags the brand.

## Design principles (locked by Joe)

- **ADD, never rebuild.** New tag/column/brand/content-type is additive; never restructure what works.
- NotebookLM / cookie-based approaches were REJECTED — do not reintroduce.

## Standard shape of a brand Knowledge DB (use SM as the template)

A brand's Knowledge DB should hold ~4 **evergreen reference** pages, NOT episode recaps (see SKILL.md "KNOWLEDGE ≠ episode archive"). Copy the Storage Moguls — Knowledge DB shape:

| Page | Type | Status | Notes |
|---|---|---|---|
| Brand Voice & Tone | Positioning / Messaging | Draft | tagline, personality, DO / DON'T, mission, banned phrases |
| Content Pillars | SOP / Process | Draft | N pillars + platforms + handle convention + hashtag set |
| Audience & Positioning | Positioning / Messaging | Draft | who it's for, core beliefs, what makes the brand different |
| Brand Style Guide | Reference / Facts | Verified | colors (hex), fonts, logo lockups — lifted from official guide so Verified is OK |

Full knowledge body goes in **page content**, not a property. Source link always populated.

## Brand visual identity (from the master Branding folder)

Master Branding folder (all brands' style guides): Drive `1b8ruP794btpj1i-OVUqL-UNa1475Yngm`. Contains per-brand `* Style Guidelines.jpg` (read with vision_analyze) + Belrose + Storpro PDF. Canva mirrors these as **brand kits** — `Canva_list_brand_kits` returns kit ids/names but NOT colors/fonts, so the JPG style guide is the authoritative source for hex/fonts.

| Brand | Canva brand kit id | Colors (hex) | Fonts (head / body) |
|---|---|---|---|
| Successful Idiots | `kAHMMao4RMI` | White `#FFFFFF`, Yellow `#FDE801`, Green `#16A34A`, Navy/black `#1A1A2E` | Oswald / Open Sans |
| Storage Moguls (main) | `kAHMSvqF5XY` | Off-white `#F5F5F5`, Silver `#C0C0C0`, Blue `#0077FF`, Navy/black `#1A1A2E` | Barlow Condensed / Montserrat |
| Storage Moguls (Podcast variant) | `kAHMSvqF5XY` | `#F4F2ED`, `#D2D4D0`, `#3F6F8E`, `#355F79`, `#111F2E`, `#0B1622` | Big Shoulders Display / League Spartan |

> ⛔ **SM POSTER/REEL PALETTE — CANONICAL (do NOT use the Canva-kit hexes above for posters).** The two Canva-kit rows are the *brand-kit reference*, but the **actual approved SM social builds** (the `SMTooYoung` / `SMFirstTimerEdge` Remotion spine + every Ep08/Ep09 poster Joe approved) use a DIFFERENT, brighter palette. THIS is the one to build SM posters and reels in, every time:
> - Navy bg: `#0B1322` (mid `#10182B`, deep `#070C16`) — a gradient `#10182B → #0B1322 → #070C16`
> - **Blue accent: `#2E7DF6` (bright electric) + `#6FA6FF` (light, for the masthead dot / italic payoff words)** — NOT the slate `#3F6F8E`/`#355F79` from the Canva row
> - Ink/off-white text: `#EDF2FB`; muted: `#8A97B0` / `#C7CEDA`
> - Fonts: Big Shoulders Display (headlines/masthead) + League Spartan (body); Space Mono for case-file labels
> - Masthead: "STORAGE MOGULS · PRACTITIONERS, NOT PROFESSORS"; footer `storagemoguls.ai`
>
> 🔤 **SM FONT STANDARD — Big Shoulders Display, going forward (Joe decided, SM Ep001).** There's a real font conflict in the existing feed: the older approved **Ep08/Ep09 posters use Fraunces SERIF headlines**, but Joe standardized on the **Canva-kit fonts — Big Shoulders Display (headlines) + League Spartan (body)** — for all SM posters from Ep001 onward. So: build new SM posters in Big Shoulders/League Spartan; the Ep08/09 serif builds are LEGACY (don't retro-fix them, but don't copy their serif for new work either). If you copy an old Ep8/9 HTML as a starting point, swap Fraunces→Big Shoulders Display and Montserrat→League Spartan. (Colors above still apply unchanged — only the typeface decision changed.)
>
> Why this note exists (Joe caught it, SM Ep001): I built Ep001 in the slate `#3F6F8E` Canva-kit colors and it looked colder/greyer than the approved feed. The Canva-kit JPG and the live builds disagree; **the live builds win.** When in doubt, copy the colors from `BrandAssets/_remotion/src/SMTooYoung.tsx` (the `NAVY/BLUE/BLUEL/INK` consts), not the Canva row.
| Belrose | `kAHMSoeaCiA` | Optimistic Orange `#F26801`, Deep navy `#012E40`, Darkest navy `#00161F` | Barlow Condensed / Arial |
| Storpro | `kAHMMRp9Sig` | Orange family `#F29E0D`/`#E78B0D`/`#C17913`; Blue/steel `#1B212D`/`#424856`/`#8E919A`/`#78B8F5`/`#F1F8FE` | Inter (Black/Bold/Regular) |

SM has TWO variants (main + Podcast) sharing the same logo set. Belrose = investment-side entity (no podcast); Storpro = premium tech-enabled storage facility brand (no podcast, full 19-page PDF guide v1.0, tagline "Making Room for Big Dreams", 'S' mark on 60° angle, contact tim.kane@storpro.com).

SI episodes Drive tree: root `Successful Idiots ` → `Episodes/` (`1iV0suHBBlIuf4reWUhB4-vD8CLfVRukU`) → `NNN Title/` folders (recent: 028/029/030) + `Older Episodes/` archive (001–027). Each episode folder: Show Notes.docx, Blog.docx, Transcript.docx, MP3, YouTube/ + Promos/ subfolders. `.docx` extraction: download raw then `C:/Python313/python.exe` + python-docx (only interpreter with the module).

---
*Source: Hub design sessions with Joe (June 2026). Keep this file updated when IDs or relations change; memory should only point here.*
