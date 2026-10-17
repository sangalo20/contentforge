---
name: posts-engine
description: "ORCHESTRATOR for creating Joe Downs' social posts end-to-end from a source, so no step in the chain gets forgotten. Trigger on natural asks like 'create Joe's posts from [source]', 'create the Storage Moguls posts from the podcast and Notion', 'make SM posts from this episode', 'create posts from the SM podcast + the Notion database', 'write Joe's posts from the SI episode'. Resolves brand + source (with sensible defaults: SM → podcast and/or Notion tracker; SI → podcast; Joe personal → either podcast as his own observation, or the SM tracker for storage education), then runs the full pipeline raw-material → final value: pull source → understanding → long form (LinkedIn/IG/FB) + short form (X) → brand voice → writing-craft gate → humanizer gate → CTA → output (optional poster/schedule). NOT a writer itself — it CHAINS the existing skills so one request fires all the right ones. LinkedIn is primary; long form where the platform supports it, short form for X."
---

# SKILL.md — Posts Engine (orchestrator)

**Skill ID:** posts-engine
**Owner:** Joe Downs
**Role:** The single entry point. You say "create [brand]'s posts from [source]" and this runs the whole chain so nothing is skipped.
**Created:** June 2026 (Joe directive — "whenever I call one skill I might forget to call another"; he wants raw-material → final value as one workflow)

---

## The problem this solves

The content skills are separate, and calling one means remembering to call the others (voice, writing-craft, humanizer, CTA). Joe wants to make a single natural request and have the **complete pipeline** run — from the raw source all the way to the finished, on-brand, humanized, CTA'd post for every platform. This skill is the conductor. It does not write; it **routes and sequences** the skills that do, and it enforces that every gate runs.

## Trigger (natural language — no rigid syntax)

Fire on asks like:
- "create Joe's posts from [the SM podcast / this episode / Notion]"
- "create the Storage Moguls posts from the podcast and the Notion database"
- "make SM posts from this episode" / "create posts from the SI episode"
- "do Joe's posts from [source]"

"Posts" now means ALL socials, not just LinkedIn — but **LinkedIn is primary.**

## Step 0 — Resolve brand + source (soft parameters, sensible defaults)

Brand and source are parameters but you should NOT force Joe to spell out the obvious. Infer, then confirm in one short line if anything's ambiguous.

| Brand | Default source(s) | Voice skill | Brand-account vs Joe personal |
|---|---|---|---|
| **Storage Moguls** | the SM podcast episode AND/OR the SM Content Tracker (Notion) | `storagemoguls-podcast` (episode) or `linkedin-posts` (tracker/education) | SM brand account |
| **Successful Idiots** | the SI podcast episode | `successfulidiots-podcast` | SI brand account |
| **Joe (personal)** | a podcast insight written as HIS observation, OR the SM tracker for storage education | `joe-from-podcasts` (from a podcast) or `linkedin-posts` (storage education) | Joe's personal page |

- If Joe names a brand + "the podcast," that's the episode source. If he adds "and Notion" / "the database," pull the tracker too.
- If he says "Joe's posts from the SM podcast," that's `joe-from-podcasts` (Joe's personal voice), NOT the SM brand account — confirm if unclear.
- Focus discipline: if he's focusing on one brand (e.g. "right now I'm focusing on Storage Moguls"), do NOT pull other brands' sources.

## Step 1 — Pull the source (raw material)

- **Podcast episode:** read the Drive source per the brand skill (Show Notes + Blog + Transcript; the brand skills document the verified .docx read method and folder structure). Notion is NOT a substitute for the transcript.
- **Notion (SM Content Tracker):** fetch via the **Notion MCP tools** (`notion_fetch` on page id `349cc74ebcf381ac816ef9238dbb191f`) — NOT curl/ntn (no key/CLI in this profile). Skip topics already marked Published.
- Combine sources when Joe asked for both (e.g. podcast episode + tracker topic).

## Step 2 — Process into UNDERSTANDING (never stitch fragments)

Build genuine understanding of each idea from the real source BEFORE writing (the #1 rule echoed in every brand skill). Do not assemble posts from transcript fragments or tracker hook-angle wording. Understand it, then write from the understanding.

## Step 2b — CATEGORIZE (raw → understanding → context → match to a Topic)

This is the "categorize/match" step in Joe's raw-material → final-value chain. From the understanding + context, decide WHICH controlled Topic(s)/subtopic this piece rolls up to in the **Topics DB** (`27da16f5-6386-4784-bdb4-4e5d5f7e3828`) — e.g. an SI episode on AI rolls up to "AI for Business" → "AI Efficiency in Business". Topics are many-to-many (a piece can roll up to more than one). This makes knowledge reusable and findable across episodes and brands instead of a pile.

🔒 **Brand separation:** the Topic is a cross-brand LABEL, not a merge. Keep each brand's knowledge in its OWN Knowledge DB (SM in SM, SI in SI…). Only **Joe's personal** brand may borrow understanding from the WHOLE KB across brands, and only when a given piece requires it. If the matching Topic doesn't exist yet, create it deliberately (don't ad-hoc spawn near-duplicates — check Aliases first). See the `notion` skill's `references/knowledge-hub-and-mcp-ddl.md` "Topics layer" section.

## Step 3 — Write long form + short form per platform

Same split Joe locked:
- **Long form** → LinkedIn (primary), Instagram caption, Facebook.
- **Short form** → X.
- One idea fully across all platforms before moving to the next (Joe's ONE-IDEA-AT-A-TIME rule). Caption + any visual = the same idea.

## Step 4 — Brand voice

Apply the brand's voice via its skill (Joe = flat declaratives, soul.md; SM / SI = their brand voice rules). Joe's real LinkedIn posts are the gold standard for his voice.

## Step 5 — 🔒 WRITING-CRAFT GATE (mandatory)

Run the **`writing-craft`** skill on every piece and every platform variant. Correct English, infer unclear spoken fragments instead of transcribing them, no stitched/non-parsing phrases, right vocabulary, faithful paraphrase. Read each line cold — must make clean correct sense.

## Step 6 — 🔒 HUMANIZER GATE (mandatory)

Run the **`humanizer`** skill on every piece AND every short form. Zero em/en dashes; kill the AI tells; read each short form aloud — would the brand/Joe actually say it. Short forms are the repeat failure — do not treat them as a trimmed long form.

## Step 7 — CTA

Apply the right CTA for the context:
- **Joe storage education / Storage Moguls funnel:** drive to the free Monday 6pm ET Storage 101 call OR Storage Moguls community FOMO (rotate). See `linkedin-posts` (call-aligned CTA rules) and `joe-cta` (spoken CTA craft for shorts).
- **Brand accounts (SM / SI):** the FOLLOW-us + warm community/funnel CTA per that brand skill's CTA section; episode pointer in the caption, not on the poster.
- The CTA must resonate in the brand's VOICE, not read as a bolt-on pitch.

## Step 7b — 🎨 VISUAL DECISION (judge if/what — never a blanket "make a poster")

Visuals are part of the final value, but they are CONDITIONAL — judged from the content + context, never forced on everything (Joe directive). Two sub-decisions, in order:

**(1) Does this piece even want a visual? Decide first.**
- **NO visual** when the piece IS the script for something else or a visual adds nothing: a post that's really a to-be-recorded VIDEO (e.g. Joe's promotional/real-estate talking pieces), a comment/DM reply, a pure text thread, an X short that rides as text. Forcing a poster here is the same error as forgetting one.
- **YES visual** when a still/motion asset earns attention on its own: a stat/number, a mindset one-liner, an authority/story piece, a data comparison, an episode promo.
- When unsure, say briefly why you're leaning each way and let Joe decide — don't auto-attach.

**(2) If YES, the FORMAT comes from the content shape, and the visual's content is INFERRED from the piece (never generic, never from nothing).** Match per `brand-poster-design`:
- single punchy NUMBER/stat → **motion stat reel** (JDStatReel)
- mindset / mantra one-liner → **minimalist poster**
- authority / "how it really works" / story → **photo-centric poster**
- data with a comparison → **handwritten infographic** (optionally animated)
- Per-platform reality: **X = static**; GIF/motion reuse OK on IG/LinkedIn/FB; offer MP4 if a GIF "isn't doing anything" (Telegram shows first frame only).
- The baked-in poster text gets the SAME writing-craft + humanizer + voice gates as the caption, and **caption + visual = the SAME idea** (Joe's locked rule). Pull the visual's words from the piece's real understanding/context — don't invent.

**Build is gated on Joe's go-ahead** (plan/decide ALWAYS, render on his nod) — posters/motion cost time and he often locks copy first. The DECISION is never skipped; the RENDER waits. When building, follow `brand-poster-design` fully (per-brand visual language, Downloads-review-first, vision-QA, Cloudinary only at final).

## Step 8 — Output / handoff

- Deliver in the format Joe wants (often a Word .docx in Downloads for review, or the per-platform output blocks). For LinkedIn review batches, `linkedinreview` builds the weekly Google Doc.
- **Optional, only if asked:** pair the strongest pieces with a visual (`brand-poster-design`) and/or schedule (`metricool-scheduling`).
- **Notion approval gate:** never mark the SM Content Tracker until Joe explicitly approves (hard rule).

## The chain at a glance

```
resolve brand+source → pull source → understanding → CATEGORIZE (Topic/subtopic) →
long+short per platform → brand VOICE → writing-craft GATE → humanizer GATE → CTA →
VISUAL DECISION (if/what — render on Joe's nod) → output (→ schedule if asked)
```

## Skills this orchestrates
`storagemoguls-podcast` · `successfulidiots-podcast` · `joe-from-podcasts` · `linkedin-posts` · `joe-social-planner` (weekly placement into a prescribed call/theme structure) · `writing-craft` · `humanizer` · `joe-cta` · `linkedinreview` · `brand-poster-design` (visual decision + build) · `metricool-scheduling` · `notion` (via MCP, incl. the Topics DB) · `google-workspace`

> When the request is about fitting posts into a GIVEN weekly structure (call topics per day, lead-magnet days), hand off to **`joe-social-planner`** — it reconciles existing content against the slots and calls this engine to fill gaps.

## Maintenance
When Joe adds a brand or a source, add a row to the Step 0 table and point it at the right voice + source skill. Keep the two GATES (writing-craft, humanizer) mandatory in every path — they are the steps most likely to be skipped, which is the entire reason this orchestrator exists.
