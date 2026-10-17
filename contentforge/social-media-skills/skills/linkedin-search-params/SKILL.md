---
name: linkedin-search-params
description: Generate TARGETED, brand-aware LinkedIn search URLs from Joe Downs' knowledge base instead of broad keyword searches. Builds two query families — PEOPLE search (find valuable investors / connections to grow, location-filtered) and CONTENT search (find posts worth engaging) — for each brand (Storage Moguls, Belrose Storage Group, Successful Idiots) and audience segment. Trigger when asked to "build LinkedIn search params", "give me targeted searches", "find investors in <place>", "narrow down the LinkedIn searches", "search queries for <brand>", or before a linkedin-engage run when broad terms return noise. Location uses verified geoUrn IDs; output URLs feed directly into the linkedin-engage fetch/run_batch scripts.
---

# SKILL.md — LinkedIn Search Parameter Builder (linkedin-search-params)

**Skill ID:** linkedin-search-params
**Owner:** Joe Downs
**Feeds:** linkedin-engage (the engagement pipeline)
**Last updated:** June 2026

---

## What This Skill Does

Turns Joe's knowledge base — his brands, his ICP, his content themes, his geography — into **precise, targeted LinkedIn search URLs**. It replaces broad keyword searches (which drag in noise: motivational reposters, off-topic AI posts, foreign events) with narrow queries aimed at two goals Joe named:

1. **Grow the pages** — find and engage the right people's content.
2. **Get valuable investors / connections** — find real ICP people, filtered by location.

It produces two query families:
- **PEOPLE search** → who to connect with / engage (location-filtered, role-targeted). This is where LinkedIn's location filter actually works.
- **CONTENT search** → which posts to comment on (topic + audience phrasing, recency-sorted).

The output URLs drop straight into `linkedin-engage`'s `fetch_linkedin_posts.py` / `run_batch.py`.

---

## When to Trigger

- "Build LinkedIn search params" / "give me targeted searches" / "search queries for <brand>"
- "Find investors in <place>" / "find storage operators in Texas"
- "Narrow down the LinkedIn searches" / "the searches are too broad"
- Before a `linkedin-engage` run when broad terms return junk — build params here first, then feed them in.

Do NOT trigger for: drafting comments (that's `linkedin-engage`), writing Joe's own posts (`linkedin-posts`).

---

## 🔑 Verified Technical Facts (tested Jun 2026 — do not guess these)

**1. Location works on PEOPLE search, NOT reliably on CONTENT search.**
LinkedIn content/post search has no dependable geo filter. People search does, via the `geoUrn` parameter. So: location targeting = people search; topic engagement = content search. Pair them (find the located people, then engage their posts).

**2. Location uses numeric `geoUrn` IDs, not place names.** The typeahead API for resolving names→IDs returns 404 (changed). Use the verified table below; resolve new locations live via the browser (see "Resolving a new geoUrn").

**Verified geoUrn IDs (return real results):**
| Location | geoUrn |
|---|---|
| United States | `103644278` |
| Texas | `102748797` |
| Florida | `101318387` |
| California | `102095887` |
| New York (state) | `102571732` |
| Georgia (US) | `103266556` |
| Arizona | `102865756` |
| Tennessee | `101730253` |
| North Carolina | `103255397` |
| Colorado | `105763813` |

⚠️ Metro-level URNs (e.g. "Dallas-Fort Worth Metroplex" `90000735`) were unreliable in testing — prefer STATE or NATIONAL level. If Joe needs a city/metro, resolve it live and verify it returns results before trusting it.

**3. People search URL shape (verified):**
```
https://www.linkedin.com/search/results/people/?keywords=<kw>&geoUrn=%5B%22<ID>%22%5D&origin=FACETED_SEARCH
```
Multiple geos: `geoUrn=%5B%22102748797%22%2C%22101318387%22%5D` (URL-encoded JSON array).

**4. Content search URL shape (verified, recency-sorted):**
```
https://www.linkedin.com/search/results/content/?keywords=<kw>&sortBy=%22date_posted%22
```

**5. Result scraping:** posts/people live in `div[componentkey]` containers (handled by `linkedin-engage/scripts/fetch_linkedin_posts.py`).

### Resolving a new geoUrn (when a location isn't in the table)
Run a people search in the logged-in browser with the location typed in the UI's location filter, then read the resulting URL's `geoUrn` value, OR navigate to a guessed geoUrn and confirm results aren't "No results found". Add verified IDs to the table above via skill patch.

---

## ⚠️ CRITICAL: People search = PROSPECTS. Content search = FUEL. Never confuse them. (Joe, June 2026)

Joe flagged that pain/intent searches returned people who'd never invest: wrong location, wrong profession, "beginners in life." Root cause: **content search has NO location, profession, or career-stage filter** — it returns anyone on earth who typed the phrase. The pain/intent phrases are NOT a prospect list.

Two separate jobs, two separate outputs:

| | PEOPLE search (`kind: people`) | CONTENT search (`kind: content`) |
|---|---|---|
| **Purpose** | The PROSPECT LIST — who to connect with / engage | CONTENT FUEL — what to write about + posts to comment on for VISIBILITY |
| **Location filter** | ✅ yes (`geoUrn`) | ❌ none (global) |
| **Profession filter** | ✅ yes (headline title) | ❌ none |
| **Career-stage filter** | ✅ yes (beginner-exclude boolean) | ❌ none |
| **Qualified?** | YES — use as a lead list | NO — never treat as leads |

**Rule:** when the goal is "find valuable people to connect with," use ONLY the PEOPLE queries. The CONTENT queries are for the content team (topics to write) and for opportunistic commenting to grow reach — not a qualified audience. A broke beginner in another country posting "the market feels saturated" is content context, not a prospect.

### Three qualifiers now enforced on PEOPLE search

1. **Location** — `geoUrn`. Default is now **US national** (storage is a national game — investors don't need to be near Joe). Two location modes:
   - `--locations US` (default) — national reach, one people-search per keyword.
   - `--locations PRIORITY` — expands to the **storage-weighted market set** (`PRIORITY_MARKETS` = TX, FL, GA, AZ, TN, NC, CO, NY): Sun Belt growth states + Joe's home NY. Generates a people-search per keyword PER state, so the team can work market-by-market where storage concentrates. ⚠️ **TODO: confirm the exact states where Belrose actually HAS storage** and adjust `PRIORITY_MARKETS` to match the real footprint.
   - Or pass explicit states, e.g. `--locations TX,FL,NY`.
2. **Profession** — the segment keyword IS the title filter (`physician`, `real estate investor`, etc.). Keep these to titles that imply means + likelihood to invest.
3. **Career stage** — every people URL auto-appends `BEGINNER_EXCLUDE` (`NOT student NOT intern NOT "entry level" NOT "recent graduate" NOT undergraduate`) to cut the "beginners in life." Extend `BEGINNER_EXCLUDE` in the script if more noise titles surface.



Each brand has a distinct audience and goal. Build params per the brand in play.

### Brand 1 — Storage Moguls (education / community / top-of-funnel)
**Goal:** grow the page, attract aspiring + active storage investors into the funnel.
**People to find:** aspiring storage investors, people learning the asset class, multifamily/CRE investors curious about storage, capital-raising/IR professionals.
**Content to engage:** storage education posts, "how do I find a deal" posts, syndication/passive-income posts.

### Brand 2 — Belrose Storage Group (acquisitions / capital / deals)
**Goal:** valuable investors, LPs, deal flow, broker/lender relationships.
**People to find:** accredited/passive investors, family offices, CRE brokers active in storage, commercial lenders, storage operators open to JV/GP.
**Content to engage:** deal announcements, capital-raising posts, underwriting/market posts, broker listing commentary.

### Brand 3 — Successful Idiots (entrepreneurship / partnership / mindset — Joe + Peter Swain)
**Goal:** broader entrepreneurial audience, partnership/AI/business-building reach.
**People to find:** founders, operators posting on partnership/delegation/Who-Not-How, AI-in-business voices.
**Content to engage:** partnership-structure posts, entrepreneurial-mindset posts, AI-for-operators posts.

---

## Audience Segments → Targeted Keyword Phrasing

Broad terms ("self storage investing") pull noise. Use ROLE + INTENT phrasing that matches how the ICP describes themselves (people search keys off headlines) or discusses topics (content search):

| Segment | People-search keywords (headline language) | Content-search keywords (topic language) |
|---|---|---|
| **Storage operators** | `self storage operator`, `self storage owner`, `storage facility owner` | `self storage operations`, `storage NOI`, `storage occupancy` |
| **Storage investors (active)** | `self storage investor`, `storage acquisitions`, `value-add storage` | `self storage acquisition`, `storage underwriting`, `buying self storage` |
| **Aspiring storage investors** | `aspiring real estate investor self storage`, `transitioning to self storage` | `first self storage deal`, `how to invest in self storage` |
| **RE syndicators / GPs** | `real estate syndicator`, `GP capital raiser`, `multifamily sponsor` | `real estate syndication`, `raising capital deal`, `LP investors` |
| **Passive investors / LPs** | `accredited investor`, `passive real estate investor`, `LP real estate` | `passive income real estate`, `accredited investor opportunities` |
| **CRE brokers / lenders** | `self storage broker`, `commercial real estate broker`, `commercial lender` | `self storage for sale`, `storage listing`, `bridge loan storage` |
| **Partnership / mindset (Successful Idiots)** | `founder`, `entrepreneur operator`, `business partner` | `business partnership`, `Who Not How`, `delegation leverage`, `AI for operators` |
| **Tax-burdened high earners** (Circle 3) | `physician`, `dentist`, `attorney`, `software engineer`, `corporate executive`, `finance professional` | `tax advantaged investing`, `how to lower my taxes`, `reduce my tax bill`, `alternative investments` |
| **Freedom seekers** (Circle 3) | `corporate executive`, `sales professional`, `engineering manager`, `consultant` | `escape the 9 to 5`, `financial freedom`, `passive income ideas`, `build wealth`, `quit my job`, `retire early` |
| **Residential investors leveling up** (Circle 2) | `real estate investor`, `landlord`, `house flipper`, `short term rental host`, `real estate agent` | `how to flip a house`, `BRRRR method`, `rental property investing`, `diversify out of residential`, `1031 exchange` |
| **Aspiring business / franchise owners** (Circle 3) | `small business owner`, `franchise owner`, `franchisee`, `entrepreneur` | `buy a business`, `best franchises to own`, `own a business`, `buy a franchise` |

### ⚡ The Wider Market — "meet them at the pain" (Joe, June 2026)

Joe's directive: stop targeting ONLY people who already search "self storage" — that's the smallest circle. Storage is the *vehicle*, not the destination. Three concentric circles, widest is the prize:
- **Circle 1 — In-market storage** (`operators`, `investors`, `aspiring`): already chose the vehicle. Small pool, easy convert. Keep, don't over-index.
- **Circle 2 — Real estate adjacent** (`residential_investors`, `syndicators`): chose real estate, don't know storage is a better option. Bridge them.
- **Circle 3 — Pain-first / vehicle-agnostic** (`tax_burdened`, `freedom_seekers`, `aspiring_owners`): in pain (taxes, hate their job, want to own something), haven't chosen a vehicle. The bulk of the market; almost no current targeting reaches it.

These segments are wired into `build_search_params.py`. Storage Moguls' default segment set now includes all of Circles 1–3; Belrose adds `tax_burdened`; Successful Idiots adds `freedom_seekers` + `aspiring_owners`. Full strategic detail (personas, content angles, channel split) lives in the Brand Knowledge Hub: SM Knowledge entry **"Audience Expansion — Wider Addressable Market & Targeting Kit"** and Joe Personal entry **"Joe's Audience — The 'Better Way' Wider Market"**.

### 🎯 Pain Signals — nobody types "pain" (Joe's refinement, June 2026)

Critical targeting insight: the pain is the STRATEGY, but no one expresses it as "pain." They vent a **complaint about their current situation**. The job is to translate each pain into the actual phrases people post, then find the people saying them. Joe's own example: a residential investor never says "I'm in pain" — they say *"the market feels saturated."* That's the exact moment they're open to a better vehicle.

These are **content-search / comment-mining phrases** (not headline titles) — you find people venting, then meet them with "there's a better vehicle." Wired into the builder as `PAIN_SIGNALS` + `BRAND_PAINS`; emitted automatically as content searches when you run a brand with its default segments (skipped if you pass `--segments`).

| Underlying pain | Signal phrases people actually post (`PAIN_SIGNALS` key) |
|---|---|
| Tax burden (`tax_pain`) | "another tax bill", "tired of paying taxes", "writing checks to the IRS", "need a tax shelter", "W2 income taxes" |
| Job / burnout (`job_freedom_pain`) | "burned out", "golden handcuffs", "Sunday scaries", "rat race", "trading time for money", "want to fire my boss" |
| Residential investor fatigue (`residential_fatigue`) | "the market feels saturated", "deals don't pencil", "cap rates compressed", "tired of tenants and toilets", "can't find deals that cash flow", "flipping is getting harder" |
| Ownership drive (`ownership_drive`) | "want to be my own boss", "building someone else's dream", "want to own something", "bet on myself" |
| Generic wealth-searching (`wealth_searching`) | "best way to invest 100k", "what to do with my money", "how the wealthy invest", "looking for passive income", "diversify my portfolio" |

Brand → pain sets emitted: SM = all five; Belrose = tax_pain + residential_fatigue + wealth_searching; Successful Idiots = job_freedom_pain + ownership_drive. When you discover a new venting phrase that converts, add it to `PAIN_SIGNALS` and this table.

### 🚪 Intent States — 5 doors, not just complaint (Joe's refinement, June 2026)

Complaint/venting (pain signals above) is only ONE entry state. Joe: *"it might not be someone complaining — it could be someone searching, someone who found a new type of investment we want to introduce to storage, someone looking for an area to invest, or a person with a job looking to start small and build."* States 2–5 are **forward-leaning** (already in motion, no frustration), wired into the builder as `INTENT_SIGNALS` + `BRAND_INTENTS` and auto-emitted as content searches (skipped with `--segments`).

| Intent state (`INTENT_SIGNALS` key) | Where their head is | Signal phrases |
|---|---|---|
| Complaining (`PAIN_SIGNALS`, above) | Frustrated with status quo | "the market feels saturated", "tired of tenants and toilets" |
| Exploring / researching (`explorers`) | Curious, learning — no frustration yet | "new to investing", "researching real estate", "where should I invest", "how to start investing" |
| Adjacent-asset adopter (`adjacent_adopters`) | Already acted on a NEW alternative (syndications, REITs, crypto, alts) — introduce storage laterally. **Highest-value: proven they'll act on an alternative.** | "got into syndications", "first syndication deal", "REIT investor", "diversifying into alternatives" |
| Market / area scout (`market_scouts`) | Looking for WHERE to put money | "best markets to invest", "out of state investing", "best cities for cash flow", "emerging markets" |
| Start-small builder (`start_small_builders`) | Employed, wants to begin and build over time | "side hustle", "start investing with little money", "investing while working full time", "house hacking" |

Brand → intent sets emitted: SM = all four storage doors; Belrose = adjacent_adopters + market_scouts (capital end); Successful Idiots = si_idea_waiting + si_small_operator + si_ai_curious + start_small_builders + explorers (its own kitchen-table doors). The messaging angle differs by door: complainers get "there's a better vehicle"; explorers get "here's an asset class you haven't considered"; adjacent-adopters get "you already invest in alternatives — storage is the next one"; scouts get "here's where storage works"; start-small builders get "you can start storage small and scale."

### 🧭 Scope: this expansion is Storage Moguls + Joe FIRST (Joe, June 2026)

The audience-expansion strategy was built for **Storage Moguls and Joe's personal brand** — that's the funnel it serves. It still applies to the other two brands, but **NOT by copying the storage funnel** — by applying the same *methodology* (intent states → real language) to each brand's actual audience:

- **Storage Moguls** — full spectrum (all pain + intent doors). The home of this strategy.
- **Joe (personal)** — the "better way" framing; meet people at pain/intent, storage as proof. **Must preserve Joe's established image: credible operator, conversational/experienced/measured, guides-not-pitches, earns the close. Never make Joe's targeting feel like a hard-sell funnel.** (See Joe Personal Knowledge: "Joe's Audience — The 'Better Way' Wider Market" + "Joe's Voice & Communication Style".)
- **Belrose** — INSTITUTIONAL/capital end ONLY. Audience = LPs, capital partners, GP partners who already have money. So Belrose uses only the high end: `tax_pain` (HNW tax burden), `residential_fatigue` (scaled investor going bigger/passive), `adjacent_adopters` (already in syndications/REITs/alts), `market_scouts` (where to deploy). It deliberately DROPS the entry-level doors (wealth_searching, job-escape, start-small) — those would attract the wrong, non-accredited audience for a capital brand.
- **Successful Idiots** — DIFFERENT audience entirely: "kitchen-table path to financial freedom," busy professionals using AI/automation to start something *without quitting their job*. SI gets its OWN signal sets mapping its three core audience beliefs — `si_idea_waiting` ("I have an idea but haven't started"), `si_small_operator` ("the game is rigged for the big guys"), `si_ai_curious` ("I tried AI once and it was meh") — plus the cross-over `start_small_builders` + `explorers`. SI does NOT use the storage/real-estate/tax phrases.

**Phrasing rules:**
- People search → use the SELF-DESCRIPTION a target puts in their headline ("self storage operator"), not a topic phrase.
- Content search → use the TOPIC phrasing a post would contain, recency-sorted.
- Quote multi-word exact phrases when you want precision: `keywords=%22self%20storage%20operator%22`.
- Avoid single generic words ("investing", "storage") — they're the noise source.

---

## How to Run

### Fast path — generate a params pack
Run the builder (system Python — has the deps):
```
C:/Python313/python.exe scripts/build_search_params.py --brand storage_moguls --locations US,TX,FL --out params.json
```
Flags:
- `--brand` one of: `storage_moguls`, `belrose`, `successful_idiots`, `all` (default `all`)
- `--locations` comma list of table keys (e.g. `US,TX,FL,CA`) — applied to PEOPLE searches only. Omit for national (US).
- `--segments` optional comma list to narrow (e.g. `operators,investors,brokers`); default = the brand's mapped segments.
- `--out` path to write the JSON pack (also prints to stdout).

Output JSON: a list of `{brand, segment, kind: people|content, location, keywords, url}`.

### Then feed into linkedin-engage
- **Content URLs** → pass keywords to `fetch_linkedin_posts.py --search "<kw>"` (or just hand the pooled URLs to the engage flow).
- **People URLs** → open to build connection/engagement target lists; engage their recent posts via `fetch_linkedin_posts.py --urls <profile-or-post-urls>`.

The two skills compose: `linkedin-search-params` decides WHERE to look (targeted, located); `linkedin-engage` reads + drafts + builds the review doc.

---

## Quality Bar — a good params pack

- ✅ Every query is role/intent-targeted, not a bare topic word.
- ✅ People searches carry a location (state or US), aimed at investors/connections.
- ✅ Content searches are recency-sorted and use post-language phrasing.
- ✅ Each query is tagged with brand + segment so the engage run knows the context (and the review-doc voice can match the brand).
- ✅ No query so broad it would return motivational reposters or off-topic results.

---

## Maintenance Notes

- **geoUrn table** is the thing most likely to need updates — add verified IDs as Joe targets new markets; never add an unverified ID.
- If LinkedIn changes the people/content search URL params, update the "Verified Technical Facts" section.
- When Joe launches a new vertical (e.g. Light Industrial Land) or a new brand, add a brand block + segment phrasing here.
- If a segment's phrasing returns noise in practice, tighten it (quote phrases, add role words) and log the fix.

---

*Sources: soul.md (Joe's brands, ICP, geography), linkedin-engage skill (fetch/run_batch consumers), live LinkedIn testing Jun 2026 (geoUrn + URL shapes verified). Companions: linkedin-engage, linkedin-posts.*
