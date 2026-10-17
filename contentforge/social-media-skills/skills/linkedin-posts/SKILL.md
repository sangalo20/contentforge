---
name: linkedin-posts
description: Generate a daily batch of 6 LinkedIn posts in Joe Downs' authentic voice for Storage Moguls. Trigger when asked to "generate today's LinkedIn posts", "write 6 posts for Joe", "create the daily LinkedIn batch", or "draft LinkedIn content for this week". Fetches the live SM Content Tracker first, skips already-published topics, covers all six content themes, and enforces Joe's voice rules.
---

# SKILL.md — LinkedIn Post Generator

**Skill ID:** linkedin-posts  
**Agent:** Hermes  
**Owner:** Joe Downs  
**Output:** 6 LinkedIn posts per generation run  
**Last updated:** June 2026

---

## What This Skill Does

Generates a daily batch of 6 LinkedIn posts written in Joe Downs' authentic voice. Posts are educational, direct, and rooted in storage investing expertise. They build Joe's personal brand, drive top-of-funnel awareness for Storage Moguls, and position him as the practitioner-educator in the storage investment space.

Each batch covers a spread of content themes so the feed stays varied and doesn't repeat the same angle two days in a row.

---

## When to Trigger This Skill

Trigger this skill when:
- Asked to "generate today's LinkedIn posts"
- Asked to "write 6 posts for Joe"
- Asked to "create the daily LinkedIn batch"
- Asked to "draft LinkedIn content for this week"

Do NOT trigger this skill for:
- Social captions on Instagram or Facebook (different SOP)
- Podcast show notes or episode descriptions
- Email newsletter copy

---

## Variant — Call-Aligned Weekly Batch (Mon–Fri, mapped to live call topics)

Joe sometimes asks for a weekly batch that is NOT the standard 6-theme daily run — it's a **Mon–Fri set where each day's post aligns to that day's Storage Moguls call topic** so the content reinforces what the community covers live. Recognize this when the request names days + call types (e.g. "Monday = Storage 101 / DFI topic, Tuesday = Deal Sourcing Call, Wednesday = Deep Dive / Mastery Call").

**The standing call → post mapping (as of June 2026):**
| Day | Call | Post should be… |
|---|---|---|
| **Mon** | Storage 101 (free, 6pm ET) + DFI Call | The **beginner-foundation** teaching pillar (e.g. NOI, what a rent roll shows). The "we teach this inside Storage 100, and it's free" piece. |
| **Tue** | Deal Sourcing Call | A **Theme 3 (Deal Finding/Sourcing)** topic — off-market, getting to sellers before the listing, building rapport. |
| **Wed** | Deep Dive / Mastery Call | A **deeper underwriting / advanced** topic (e.g. what the rent-roll headline hides, economic vs physical occupancy, structuring). One step past the Monday foundation. |
| **Thu** | (often no agenda) | **Lead-magnet focus** — mindset/positioning (Theme 4) or origin/story (Theme 6) that pulls top-of-funnel into the community. |
| **Fri** | (often no agenda) | **Lead-magnet focus** — same; the origin story (#01 "How I got into self-storage") is the strongest Friday FOMO piece. |

**Sequencing principle:** build a logical progression across the week — foundation (Mon) → sourcing (Tue) → advanced underwriting (Wed) → mindset (Thu) → origin/FOMO (Fri). When two underwriting pieces are in play (NOI + rent roll), put the **foundational** one Monday and the **deeper** one Wednesday so they don't overlap.

**⚠️ Reading Joe's reshuffle instructions during back-and-forth editing (Joe corrected this repeatedly, June 2026 — I misread the same Mon→Tue move 4× in one session).** When Joe edits a drafted batch by moving topics around, he speaks in DAY language, and his "next" almost always means **the following week**, not the same week:

- *"Push it over to the next Tuesday"* / *"use it for next Wednesday"* = move that topic OUT of this batch into the **following week's** Tuesday/Wednesday. It is NOT a swap within the current Mon–Fri.
- *"Monday's topic goes to Tuesday"* (no "next") = a within-week shift.
- A topic that "was just covered on the call last night" should become **tomorrow's** standalone post (the "we covered this live last night" angle), pulled OUT of the upcoming-week batch.
- **Do NOT re-derive or second-guess his mapping.** The repeated misreads came from layering clever reinterpretations on top of his explicit placement. Instead: restate his moves back as a literal table (Day → Topic → where it came from / where it's going, plus a "parked for following week" list), and ask only to resolve a genuine COLLISION (two topics landing on one day) or a truly EMPTY slot. Mirror, confirm, fill gaps — don't reinterpret.
- After a reshuffle, **recount which days are now empty before proposing fills.** "We need a topic for Monday" can quietly become "Monday AND Friday" (or three slots) once topics move to the following week.

**🔒 Mandatory CTA for the call-aligned batch (Joe's directive, June 2026) — overrides the generic CTA-rotation list above for this variant.** EVERY post in a call-aligned batch must close with ONE of:
1. An invite to the **free Storage 101 call that night** — "Free for everyone. Mondays at 6pm ET. Register at storagemoguls.ai" (or the relevant night), OR
2. A **FOMO pull into Storage Moguls** — frame the community as the place that "regularly covers exactly this, live" + the standing line that they can always register for the free Monday 6pm call.

Still ONE CTA per post (never two), still soft, still Joe's voice. The generic "follow along" / bare "storagemoguls.ai" closes are NOT sufficient for this variant — the free-call invite or community-FOMO must be explicit. Rotate which posts use the direct call invite vs. the community-FOMO so all five don't read identically.

**Posting Monday even with no Monday call:** Joe corrected this directly ("Don't skip monday") — a "no call next week" note means there's no live call to attend, NOT that the Monday post is dropped. Always produce the Monday post unless Joe explicitly says "no Monday post." When there's no call that night, lean the CTA toward community-FOMO + the standing "register for our free Monday call" line rather than "join us tonight."

**Sourcing the topics:** these batches usually map onto already-written posts living in a **Joe Social Review Google Doc** (a dated review doc of approved posts, e.g. *"Joe Social Review — Rebuilt (Jun 23 – Jul 07, 2026)"* with numbered headings #01–#15, each carrying LONG FORM / SHORT FORM / VISUAL sections). When Joe points you at such a doc, read it via the raw Docs API (`google_api.py` token method — handle `documentTab`/`childTabs`, named styles surface the numbered headings). Then: (a) match existing post topics to the call days, (b) **confirm with Joe which are already published before reusing** (posts marked "Approved" may already be live), and (c) **rewrite the CTA close** to the call-aligned CTA above — the doc's existing closes ("follow along," bare URL) won't satisfy this variant. Don't fabricate new topics if a fitting one already exists in the doc.

---

## 🔒 HARD RULE — No Fabrication (read this FIRST, every run)

> **⚠️ WRITE FROM UNDERSTANDING, NOT FROM ASSEMBLED PHRASES (Joe, June 2026 — the root principle behind this whole skill).** The old model — fetch the SM Content Tracker's pre-written *hook angles* and assemble a post from those words — is RETIRED. That model is exactly what produced the fabricated origin story and the wrong "month-to-month" line (the tracker's own angle for #3 literally said "bad debt, concessions, and month-to-months"). Stitching canned phrases together is how false/off-domain claims slip in. The new way: build genuine UNDERSTANDING of the idea from REAL sources (transcripts, Joe's actual documented story, Notion knowledge pages, his lived facts), THEN write the post from that understanding in his voice. The SM Content Tracker is a list of TOPICS to cover and a record of what's published — NOT copy to assemble from. Never lift a tracker hook angle as the substance of a claim; treat it only as "here's a subject worth a post," then go understand the subject from a real source before writing. This is WHY the no-fabrication rule below holds: you can't fabricate if you only write what you actually understand to be true.

This is the single most important rule in this skill and it OVERRIDES the desire to make a post land well. **If the content isn't there, it isn't there.** Joe set this rule directly (June 2026) after this generator produced (a) an invented "first deal" origin story and (b) a wrong "month-to-month tenants who could leave next week" risk line — both fabricated/imported, neither true. They reached the review doc and nearly published because this skill had voice rules but NO truth gate. That coverage gap is now closed here.

**Never invent for Joe:** a first-person story, a specific deal, a memory, a number, a client, a result, a market, a facility detail, or an origin. Plausible is NOT true. A made-up anecdote that "sounds like Joe" is still fabrication and damages his credibility the moment a reader, partner, or Joe knows it didn't happen.

Three honest options when you don't have a verified source for a claim:
1. **Anchor to a REAL Joe fact** documented in soul.md / Notion / the SM Content Tracker (e.g. Kolbe 5-4-9-2, "build so the next person can replace us," $11M+ raised / $29M+ acquired, 20+ yrs in commercial syndications, the Scott Meyers / SSI partnership). If you cite a Joe fact, it must exist in a source — don't guess specifics.
2. **Keep it idea-only** — a clean argument/observation/reframe with NO personal anecdote. A strong reframe needs no manufactured backstory. Theme 6 (Story/Origin) posts are ONLY allowed when a real, sourced story exists; if none does, do not fill the slot with a fabricated one — substitute another theme or flag the gap.
3. **Flag it for Joe** in a `⚠ VERIFY` note instead of inventing — let Joe supply the real detail.

**Storage-domain truth check (every post):** the claim must be true *for self-storage*, not just true-sounding for real estate generally. Known trap (Joe corrected): **month-to-month is UNIVERSAL in self-storage — it is the norm, not a risk or instability signal. Never frame month-to-month tenancy as a hidden danger.** That framing is correct for apartments/commercial leases and must never be imported into storage copy.

**Mandatory audit before output:** read every first-person sentence and every factual claim and ask — *"Did Joe actually do/say/experience this per a source? Is this true for storage?"* If the honest answer is no or "I made it up to sound good," rewrite or cut it. When unsure, flag, don't fabricate.

> **⚠️ RECALLING A PAST DRAFT FROM SESSION HISTORY — read the thread to its END before quoting (Joe corrected this, June 2026).** When Joe asks for "the post we did last" / "the one we corrected" / any previously-produced draft, and you use `session_search` to find it: **the FIRST version you hit is almost never the final one.** Corrections, rewrites, and Joe's "no, fix this" land LATER in the same thread. I pulled the first-draft origin story and handed it back as current — it was the exact fabricated version Joe had already made me rewrite, in that same session. He caught it immediately ("this is the wrong one, we corrected this... why do you have stale data").
> - This is NOT a "stale data" problem and must NOT be excused as one. The corrected version was right there in the retrieved session. The failure was stopping at the first match instead of scrolling forward to the resolution.
> - **Procedure:** after a `session_search` discovery hit on a draft, SCROLL the session forward (`around_message_id` → later messages) to find the LAST version of that artifact before quoting it. Look for the user's correction + the agent's rebuild. When two versions exist, the later/corrected one wins — always. If Joe says "the one we corrected," he means the post-correction version specifically; don't hand him the thing he rejected.
> - When in doubt about which version is final, say so and show the latest you can confirm, rather than confidently presenting an early draft as current.

---

## Joe's Voice — Non-Negotiable Rules

These rules govern every post without exception. A post that violates any of these should be rewritten before output.

**Structure rules:**
- **No warm-up sentences.** Start at full speed. The first line is the hook — not a greeting, not a preamble.
- **Use white space aggressively.** One or two sentences per paragraph. Never a wall of text.
- **One idea per post.** No multiple points crammed together. Each post earns the right to one insight.
- **Compress ruthlessly.** Every sentence should be the fewest words possible without losing impact.
- **Short sentences.** Joe speaks in declarative beats. Not long rolling clauses.

**Tone rules:**
- Conversational, experienced, measured. Never corporate. Never hype.
- Educator voice — he makes storage feel accessible, not elite or exclusive.
- Confidence without arrogance. Credibility comes from lived experience, not credentials.
- No superlatives. No "incredible," "amazing," "game-changing," "revolutionary."
- No filler phrases: "At the end of the day," "the truth is," "let me be honest," "here's the thing."
- No rhetorical questions as openers (weak hook).
- No motivational poster language.

**CTA rules:**
- Every post ends with a single, soft call-to-action. Never more than one.
- ❌ **NEVER use "DM me…" as a CTA.** Joe corrected this directly (June 2026) — "Joe never writes DM me." It is not his voice. Do not use "DM me if you want the full breakdown" or any "DM me" variant. If a post needs a close and no other CTA fits, end on a punchy landing statement instead.
- CTA options (rotate, don't repeat the same one twice in a day):
  - "Storage 100 is free. Link in bio."
  - "Join the community at storagemoguls.ai"
  - "Follow for more on storage investing."
  - "Drop a comment if this hits your situation."
  - (Some posts may close with a punchy statement instead of a CTA — use sparingly, max 1 per batch)
- ❌ **NEVER use "DM me…" as a CTA.** Joe corrected this directly (June 2026) — "DM me if you want the full breakdown" is NOT his voice. Do not generate it; if a draft has it, cut it and end on the post's landing line or another soft CTA above.
---

## The Six Content Themes — One Per Post Per Day

Each daily batch must cover **all six themes**, one post per theme. Rotate which posts open and close the day — don't always lead with the same type.

### Theme 1 — Practitioner Insight
*What operators and serious investors know that beginners don't.*

Joe shares a real observation from doing deals. Specific, grounded, not theoretical. This is the "I've seen this in the field" post.

Examples from the content library:
- The dirty secrets about rent rolls brokers won't tell you
- Why I underwrite to my own expenses, not the seller's
- Physical occupancy vs. economic occupancy — the difference that changes your offer
- What bad debt on a rent roll tells you about management quality

**Hook pattern:** Start with the counter-intuitive truth or the number/fact that reframes the topic.

---

### Theme 2 — Education / How-To
*Teach one concept clearly. No selling.*

Takes a technical storage investing concept and explains it in plain language. These posts attract investors who are early in the learning curve and haven't found anyone who explains it without jargon.

Examples from the content library:
- NOI is the number — here's how to actually calculate it
- What lenders are actually looking for in a self-storage deal right now
- Self-storage expense benchmarks: what operators actually spend
- The difference between a T3, T6, and T12 — and what it means when they tell different stories

**Hook pattern:** Name the concept directly in the first line, then immediately challenge the assumption most people bring to it.

---

### Theme 3 — Deal Finding / Sourcing
*The felt pain point. People don't know how to find deals.*

Posts in this theme speak to the most common frustration: how do I actually find a storage deal? These are the highest-resonance posts for anyone actively trying to get into storage.

Examples from the content library:
- I found 3 self-storage deals last year that were never listed
- Why I stopped chasing listed deals
- The call that gets you the deal: building rapport with sellers and brokers
- Risk tolerance and trailing numbers: what the data tells you before you commit

**Hook pattern:** Open with the behavior most investors do (wrong) then flip to what actually works.

---

### Theme 4 — Mindset / Positioning
*Why this asset class. Why now. Why this approach.*

These posts zoom out from tactics. They speak to the philosophy behind how Joe operates: patience, discipline, the boring-wealth approach. Most shareable category. Attracts audience beyond storage investors.

Examples from the content library:
- Why self-storage is the most boring wealth-building asset class alive (and why that's the point)
- 30,000+ mom-and-pop self-storage facilities are still out there
- Self-storage is where real estate meets business — and you have to operate the business
- The investor who thought they found 100 deals before closing one — and why that's normal

**Hook pattern:** Open with the counterintuitive positioning statement. Let it breathe for one short line before expanding.

---

### Theme 5 — Partnership / Team / Business Building
*How Joe builds — deals, teams, systems, relationships.*

These posts reflect Joe's wider business worldview: partnerships, how to structure relationships, what makes deals and teams work long-term. Draws from the Kolbe/partnership philosophy, the Mogul platform build, the Belrose operating model.

Examples from the content library:
- Stop lowballing. Start structuring. (A low price with bad terms loses to a fair price with good terms every time.)
- The community is the unfair advantage — knowledge is everywhere, access to operators doing live deals right now is not
- Proactive ownership, mutual accountability, true commitment — what those actually mean in a deal
- Vague agreements feel fine when things go well. When things go hard, vague agreements become the problem.

**Hook pattern:** Open with a short contrarian statement or a truth most people avoid.

---

### Theme 6 — Story / Credibility / Origin
*Real stories from real deals. Moments that built the conviction.*

These posts anchor Joe's authority. Not stats or claims — stories. Specific situations, real decisions, real outcomes. This is the most humanizing category and the best at generating comments and DMs.

Examples from the content library:
- Why I got into self-storage
- The number one underwriting mistake (made this on my first deal)
- The deal I almost killed over a drainage issue — and why I'm glad we didn't
- Why showing up matters: how we bought a 20,000 SF facility just by showing up

**Hook pattern:** Open with the moment of tension or surprise. Not with background or context.

---

## Post Structure Template

Every post follows this skeleton. Adapt it — don't copy it literally.

```
[HOOK — 1 punchy sentence. The full idea compressed to its core.]

[EXPANSION LINE — One sentence that earns the right to keep reading.]

[BODY — 3–5 short paragraphs. One idea per paragraph. White space between each.]

[CLOSE — Either a punchy landing statement OR a light CTA. Never both.]
```

**Length target:** 150–250 words. Under 300 always. Never over.

---

## Output Format for Each Batch

When generating the daily 6, output them in this format:

```
---
POST 1 — [Theme Name]

[Full post text, ready to copy-paste]

---
POST 2 — [Theme Name]

[Full post text, ready to copy-paste]

---
[...continue through Post 6]
```

After all 6 posts, include a one-line note:

> **Suggested posting order:** [list the 6 themes in the order recommended for the day, with brief rationale if relevant]

---

## Content Source Material

When generating posts, draw from Joe's documented content universe in this priority order:

### 1. Live 56-Post Content Library — Fetch First, Every Time

**Before writing a single post, fetch the SM Content Tracker (Notion page id `349cc74ebcf381ac816ef9238dbb191f`).**

> **🔑 HOW TO REACH NOTION IN THE joeagent PROFILE — read this BEFORE concluding "no access" (Joe corrected this, June 2026, after I wasted a whole session claiming we couldn't reach it).** This profile talks to Notion through the **enabled Notion MCP server** — there are `Notion`/`mcp__Notion_*` tools in the toolset (e.g. `notion_fetch`, `notion_search`). USE THEM. Fetch the tracker with `notion_fetch(id="349cc74ebcf381ac816ef9238dbb191f")`.
> - There is **NO `NOTION_API_KEY` in the .env and NO `ntn` CLI** in this profile — the curl/CLI paths in the `notion` skill DO NOT apply here. Do not go looking for a key, do not try curl, do not open the page in the remote browser (it hits a Belrose Group login wall and looks like "no access"). The tracker lives in the **Belrose Group** Notion workspace and we DO have programmatic access via MCP.
> - If the `mcp__Notion_*` tools don't appear in your toolset at session start, they're still connected — verify with `hermes mcp test Notion` (shows "✓ Connected, 18 tools"). The connection is real; the tools are callable. Just call `notion_fetch` directly.
> - "We have access" = via MCP. Believe it. Don't make Joe repeat it.

This is the SM Content Tracker — 56 pre-planned topics organized by theme with hook angles already written. It is the source of truth for content ideas. The browser-openable form is `https://www.notion.so/349cc74ebcf381ac816ef9238dbb191f`.

**After fetching, do the following:**
- The tracker is a TOPIC MAP + published-status record — NOT copy to assemble from (see the WRITE FROM UNDERSTANDING rule at the top). Use it to pick WHICH subjects to cover and to skip what's already live, then go build real understanding of the chosen subject from a true source before writing.
- Scan each theme table for rows where **both** "Deck or Post Created" ✅ AND "Published" ✅ are checked — **skip those entirely**, they are already live on LinkedIn
- From the remaining unpublished topics, select the 6 best fits for today's batch — one per theme
- Treat the **Hook Angle** column as a topic pointer ONLY — a hint at what the post is about. Do NOT lift its wording as the post's claims (the #3 angle's "month-to-months" wording is exactly the kind of canned phrase that injected a domain error). Understand the subject from a real source, then write the hook fresh and true.
- Prioritize the ⭐ **Priority Starting Stack** (items #43, #1, #10, #52, #54) if none of those have been produced yet

**If the Notion fetch fails** (connection issue, timeout), fall back to the hook angles and topics documented within this skill file and note at the top of the batch output: *"⚠️ Content library unavailable — generated from skill reference only. Verify against tracker before publishing."*

> **Access reality:** the tracker lives in the **Belrose Group** Notion workspace and is reachable via the **Notion MCP server** — that is how this profile has always fetched it. Just call `mcp__Notion_notion_fetch(id="349cc74ebcf381ac816ef9238dbb191f")`. Do NOT assume "no access" and start chasing curl/`ntn`/browser dead ends (Jun 2026: that mistake cost a whole session — Joe had to correct me, "we have access, you're accessing it wrongly"). If the `mcp__Notion_*` tools aren't visible in your toolset, verify with `hermes mcp test Notion` (expect "Connected" + 18 tools) and try the fetch anyway. Only if the MCP server genuinely tests down fall back to Joe pasting/exporting the tracker or the approved "Joe Social Review" Google Doc. See `references/approval-pipeline.md` → "Accessing the SM Content Tracker" for the full check order.

---

### 2. Practitioner Experience
Belrose deal history, Storage Moguls launch, Scott Meyers partnership, the roadshow model, the platform build.

### 3. Joe's Worldview
Kolbe Quick Start 9 operator, partnership philosophy, Digital Advisory Board thinking, the "boring is the point" storage philosophy.

### 4. Current Business Context
Storage Moguls membership tiers, storagemoguls.ai, the DFI (Deal-Finder Intensive) curriculum, the Self Storage Investing podcast with Scott Meyers.

---

## What to NEVER Write

These are hard stops — rewrite anything that contains them:

- ❌ **A fabricated first-person story, deal, number, result, or origin** — see the No-Fabrication HARD RULE at the top. If it isn't sourced, it doesn't go in.
- ❌ **Month-to-month framed as a risk/instability flag** — it's universal in storage; this is a domain error, not a style choice.
- ❌ Inspirational quotes attributed to others (Buffett, Kobe, etc.) — Joe speaks in his own voice
- ❌ Lists with 5+ bullets — not Joe's format
- ❌ "I'm excited to announce…" — never hype framing
- ❌ Passive voice ("It was decided," "deals are found by")
- ❌ Hashtag spam — max 3 hashtags, optional, placed at the very end if used
- ❌ Emojis used decoratively — if used at all, one maximum, meaningful
- ❌ "As a [title]…" — never self-referential credential openers
- ❌ Corporate tone: "leveraging synergies," "value proposition," "thought leadership"
- ❌ Telling the reader how to feel: "This is so important," "You need to hear this"
- ❌ Anything that sounds like it was written by AI — if it reads stiff or templated, rewrite it

---

## Quality Check Before Output

Before presenting the batch, verify each post against this checklist:

- [ ] **TRUTH GATE (first, non-negotiable): every first-person claim and every fact is sourced or true — no invented story/deal/number/origin, and nothing false for storage (e.g. month-to-month is normal, never a risk). Unsourced → cut or `⚠ VERIFY`, never fabricate.**
- [ ] **WRITING-CRAFT GATE (runs BEFORE the humanizer, non-negotiable): apply the `writing-craft` skill to every post AND every short form. Basic written-English correctness — separate from voice and de-AI. Infer meaning when a lifted phrase isn't clear standing alone (don't transcribe unclear spoken fragments verbatim — the "the 46th" → "they just want your address" rule), never stitch words that don't parse cold, use the correct word (nothing invented/mis-sensed), paraphrase faithfully. Read each line with ZERO context — if it doesn't make clean correct sense, rewrite it.**
- [ ] **HUMANIZER GATE (third, non-negotiable — Joe corrected this repeatedly, the rule keeps not sticking because it wasn't gated here). Before output, EVERY post AND EVERY short form (X) passes a humanizer pass. The short forms are the repeat failure: they get treated as "trim the long one" and keep stiff AI connective tissue. Load/apply the `humanizer` skill and run the self-prompt on EACH piece including each X version: "What makes this so obviously AI / not how Joe talks?" then revise. A draft is NOT done until the short forms read like Joe said them out loud — short flat declaratives, no "It's not just X, it's Y", no rule-of-three, no "-ing" tails, no signpost/filler. Read every short form ALOUD in your head; if it sounds assembled, rewrite before saving. Worked before/after examples of Joe's short-form transformations live in `references/humanizing-joe-short-forms.md`.**
- [ ] First line is a hook — not a preamble
- [ ] White space used — no walls of text
- [ ] One idea only — not two crammed together
- [ ] Under 300 words
- [ ] No warm-up phrases
- [ ] CTA is soft and singular (or post ends with a clean landing statement)
- [ ] No banned phrases or formats
- [ ] Sounds like Joe — conversational, direct, earned authority

If a post fails two or more checks, rewrite before including in the batch.

---

## Hashtag Guidance (Optional)

If hashtags are used, pick 1–3 from this set. Never invent new ones:

`#selfstorage` `#storageinvesting` `#storagemoguls` `#commercialrealestate` `#realestateinvesting` `#passiveincome` `#dealflow` `#underwriting`

Place at the very end of the post, after the CTA, on their own line.

---

## Sample Post (Reference Quality Bar)

**Theme: Education / How-To**

---

Rent rolls lie.

Not intentionally — but the numbers on the page are almost never the full story.

Physical occupancy tells you how many units have someone's stuff in them.

Economic occupancy tells you how many of those units are actually paying.

The gap between the two is where bad debt, concessions, and month-to-months hide.

A facility showing 91% physical occupancy can be generating revenue like a 78% property. If you model from the physical number, you're starting with the wrong assumption.

Before you build anything, pull the actual collections data. Look at the trailing 3, 6, and 12 months side by side.

That's where the deal is — or isn't.

Storage 100 is free. Link in bio.

---

*This is the quality bar. Direct. Educational. One idea. No fluff. Sounds like a practitioner, not a marketer.*

---

## Visual companion — generate a poster/video alongside the copy

Content and its visual are one workflow, not two. When generating posts (especially for Joe's personal brand), pair the strongest 1–3 with an on-brand visual using the **`brand-poster-design`** skill (load it for the full rule set). Quick guidance:
- **Match format to content shape:** a single punchy number/stat → motion **stat reel** or a big-stat poster; a mindset/quote line → **minimalist** poster; an authority/story piece → **photo-centric** poster; data/comparison → **handwritten infographic** (optionally animated via Remotion).
- **JD brand spine** (Joe's personal posts): near-black navy `#0A0E16` + electric blue `#2E6BFF`, Inter + JetBrains Mono, `[ BRACKET LABELS ]`. Footer = `joedowns.ai` + a 2–3 word attribute line (operator · investor · AI · real estate · development · distressed debt). **"The Real Reps" newsletter CTA is OFF by default** — only when Joe explicitly asks.
- **Photos:** ALWAYS vision-analyze a photo before using it; pick the layout from the photo's composition; never side-pin a center-composed face; rotate images (don't reuse one hero). Full discipline in `brand-poster-design/references/jd-design-system.md`.
- **Pipeline:** render HTML→PNG (or Remotion→MP4) → QA with vision → Cloudinary → attach to the Metricool draft. See `brand-poster-design` SKILL.md + its references.
- This is for Storage Moguls BRAND posts too — use the SM visual language (serif/navy/`storagemoguls.ai`), not JD's, per `brand-poster-design` per-brand section.

## When Joe aligns posts to a weekly CALL schedule (not the generic daily 6)

A common ask is NOT "the daily 6" but a **Mon–Fri batch mapped to that week's call topics** (e.g. Mon = Storage 101/DFI, Tue = Deal Sourcing call, Wed = Deep Dive/Mastery, Thu/Fri = lead-magnet). Rules that keep this smooth (Joe, June 2026 — learned the hard way over many correction rounds):

- **CTA for these:** EVERY post drives to (a) the free **Storage 101 call, Mondays 6pm ET** (free to all), OR (b) **FOMO into the Storage Moguls community**. Rotate so the feed isn't repetitive (teaching posts → free call; positioning/mindset → community FOMO, with the free Monday call as the backup line). This overrides the generic soft-CTA list above for call-aligned batches.
- **BUILD ONLY THE SLOTS JOE ASKS FOR.** If he says "we only need Tue + Wed" or "now just Monday and Friday," generate ONLY those. Do NOT regenerate or re-paste the already-settled days, and do NOT re-propose huge candidate tables for slots that are decided. Re-litigating settled days reads as losing context and frustrates him fast.
- **Track settled vs. open out loud, tersely.** Keep a one-line status map (Mon=X ✅ / Tue=open / …). When a day is decided, it's decided — stop offering alternatives for it.
- **"Push it to next week / next Tuesday" means it LEAVES this batch.** If Joe moves a topic to a future week, drop it from the current doc entirely (don't reshuffle it into another open slot this week unless he says so). Confirm the resulting open slots in ONE short list, then proceed.
- **"Plain topic line" requirement:** when Joe wants it, put a plain-language one-liner next to each hook headline (`Topic: <what it plainly covers>`) plus the call alignment, so whoever runs the calls sees the subject at a glance.
- **Promo ≠ content.** A lead-magnet *offer* (e.g. "Free Deal Tracker download", "Mogul Evaluator walkthrough") is a PROMO, not a teaching post. When Joe asks for a lead-magnet-focused day he means real standalone CONTENT that happens to pull toward the funnel — not a "download our thing" pitch. Pick teaching/positioning topics (e.g. mom-and-pop opportunity, real-estate-meets-business) and close with a soft community/free-call CTA.
- **"A solid principle that looks unsolid"** = the counterintuitive teaching frame Joe likes for foundation posts: something that looks weak/shaky/boring on the surface but is actually rock-solid (e.g. physical vs. economic occupancy — the number everyone trusts looks solid but isn't; boring-is-durable; a clean rent roll that hides bad debt).
- **Output format Joe wants:** a Word **.docx** in `C:\Users\somea\Downloads\`, readable font sizing (≈24pt title, 20pt headlines, 12pt body, 1.15 spacing), one post per page. Build with `python-docx` via **`uv run --with python-docx python <script>`** — the bare `python`/`python3` in this profile is the Hermes venv (no pip, no docx) and the execute_code sandbox also lacks docx. uv is the reliable path.



Once a batch is generated, it flows through an external-partner approval pipeline before anything is marked as done. The steps and rules:

1. **Generate the batch** (per this skill).
2. **Drop it into a weekly Google Doc**, NOT Notion. Naming convention: `Week <ISO week>: <Mon dd>–<Sun dd, yyyy> — LinkedIn Articles` (e.g. `Week 25: Jun 15–Jun 21, 2026 — LinkedIn Articles`). Compute the ISO week + Mon–Sun range from today's date.
3. **One article per section.** Doc layout: TITLE → a `Contents` (Heading-2) clickable TOC listing all articles → then each article as Heading-1 headline + an italic gray theme label + the full post text, with a **page break between articles**. (True native sidebar tabs are NOT supported by the google-workspace CLI wrapper — use the raw Docs API helper instead; see `scripts/create_review_doc.py` and `references/approval-pipeline.md`.)
4. **Joe reviews and emails the partner himself** (unless he explicitly asks the agent to share/email). Default: the doc is private to Joe's account — offer to share (reader/commenter) or file into a Drive folder, don't assume.
5. **Partner approves → Joe relays the approval to the agent directly.**
6. **ONLY THEN does the agent mark Notion.**

### 🔒 HARD RULE — Do NOT touch Notion until Joe gives explicit approval

This is non-negotiable and was set by Joe directly. Until Joe personally says a piece is approved, the agent must NOT modify the SM Content Tracker or any Notion page — no checkboxes, no status changes, nothing. Generation and the Google Doc are the agent's lane; Notion writes wait for the explicit human go-ahead. When a post goes live, the tracker rows to check are "Deck or Post Created" + "Published" on the matching topic row.

See `references/approval-pipeline.md` for the full workflow detail, the Docs-API technique, and the Week-doc reference. The runnable doc builder is `scripts/create_review_doc.py`.

**Output variants & call-aligned batches:** `references/approval-pipeline.md` also covers (a) the **Word .docx** output Joe sometimes asks for ("build it in word" / "a doc to send" — build with `python-docx` via `uv run --with python-docx`, save to Downloads, legible 12pt/1.15 font; the bare `python` has no pip), and (b) the **call-aligned weekly layout** where each article gets a plain-language `Topic:` line + `Call alignment:` line under the hook (Mon=Storage 101/DFI, Tue=Deal Sourcing, Wed=Deep Dive/Mastery, Thu/Fri=lead magnet), with EVERY post closing on a rotated Storage 101-free-call or Storage Moguls-FOMO CTA. Ask which doc topics are already published before reusing them.

---

## Maintenance Notes

- Update this skill when Joe's content pillars shift, new programs launch, or his CTA destinations change
- The 56-post content library should be checked periodically for newly completed/published topics — don't regenerate posts that are already live
- If Joe provides feedback on specific posts ("too formal," "not my voice"), log the example here and adjust the voice rules accordingly

---

*Sources: SM Content Tracker (Notion), Moguls Operations Hub (Notion), Partnership Deck Presenter Notes (Notion), Social Media Content Quality Strategy Proposal (Google Drive), Social Media Accounts Audit (Google Drive)*  
*Skill created: June 2026*
