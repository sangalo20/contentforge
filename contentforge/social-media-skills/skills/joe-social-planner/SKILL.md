---
name: joe-social-planner
description: "Place/slot Joe Downs' social content into a PRESCRIBED weekly structure — the call-aligned or theme-aligned week he's given. Trigger on asks like 'plan Joe's posts for next week', 'we have these call topics for Mon–Fri, fit content to them', 'slot this week's posts', 'align the posts to the week', 'which post goes on which day', or when content exists but isn't organized into the week's required slots. This is PLACEMENT/scheduling-structure, distinct from CREATION (posts-engine / linkedin-posts) and from publishing (metricool-scheduling). It reconciles existing content against required slots, fills gaps via posts-engine, and respects each day's call/theme alignment + the CTA rules. Starts Joe-socials-specific (Storage 101 / call days / lead-magnet days) but is built to extend to other brands."
---

# SKILL.md — Joe Social Planner (weekly placement)

**Skill ID:** joe-social-planner
**Owner:** Joe Downs
**Role:** Map content into a given week's required structure. Two different jobs live apart: CREATING content (posts-engine / the brand skills) vs. PLACING it into the week. This owns placement.
**Created:** June 2026 (Joe directive — a week often arrives WITH a required structure: Mon = this call topic, Tue = Deal Sourcing call, Wed = Mastery, Thu/Fri = lead-magnet. We had good content but it wasn't structured for the week, and reconciling it caused avoidable back-and-forth. This makes it repeatable.)

## When to trigger
- "plan / lay out Joe's posts for next week", "fit content to these call topics", "slot this week", "which post goes on which day", "align the week".
- Any time a required weekly structure exists and content must be mapped into it (whether the content already exists or needs creating).

## Step 1 — Get the week's required structure (the slots)
A week is a set of DATED SLOTS, each with an alignment. Joe's recurring shape:
- **Monday** — Storage 101 / DFI call topic (free Monday 6pm ET call; often a beginner/foundation teaching topic — confirm the topic with Joe, don't assume the difficulty level).
- **Tuesday** — Deal Sourcing call topic.
- **Wednesday** — Deep Dive / Mastery call topic.
- **Thursday / Friday** — lead-magnet focus (real CONTENT that pulls to the funnel — NOT a promo/"download our thing" pitch).
Compute the actual dates (next Mon–Sun) from today. Confirm any slot Joe leaves ambiguous. If Joe says "no post / no call" on a day, that slot is empty unless he says otherwise.

## Step 2 — Inventory what content already exists
Before creating anything, check what's already written/approved (the weekly Google review doc, the SM Content Tracker via Notion MCP, prior batches). Today's lesson: content often EXISTS but isn't slotted. List candidate pieces with their natural topic so you can match them to slots.

## Step 3 — Reconcile content → slots (the core job)
- **Match** each existing piece to the slot whose alignment it fits (a deal-sourcing piece → the Deal Sourcing day).
- **Respect Joe's moves literally.** "Push it to next Tuesday" / "use Friday's for next Wednesday" means the piece LEAVES this week's slot and goes where he said. Track settled vs. open slots in ONE short status line; don't re-litigate settled days.
- **Gaps → create** via `posts-engine` (which runs understanding → categorize → voice → writing-craft → humanizer → CTA → visual-decision). Don't hand-write outside that chain.
- **Promo ≠ content** on lead-magnet days: pick a teaching/positioning topic, not a download pitch.
- **Don't force the difficulty/topic** — if Joe says a topic isn't right for a day, move it; he owns the call.

### 🔴 PITFALL — re-slotting instructions get misread; this cost ~5 rounds (Joe, June 2026: "do not misinterpret my words" / "you seem to be losing context")
When Joe reshuffles a week, he gives terse relational moves ("Monday's topic goes to Tuesday, Tuesday's goes to next-week Tuesday, Wednesday use Friday's, Thursday is good, Friday needs a new topic"). I repeatedly mis-applied these — inverted the meaning ("not a beginner topic" read as "make it beginner"), missed which pieces left the week, and re-dumped giant candidate tables for days that were already settled. Each miss read to Joe as losing the thread. Discipline that prevents it:

1. **Maintain ONE running slot table** and re-print it after EVERY instruction — `Mon=X ✅ / Tue=open / Wed=Y ✅ / …` — so both of you see the same state. Settled = settled; stop offering alternatives for it.
2. **"next Tuesday" / "next Wednesday" = a FUTURE WEEK**, not this week's Tuesday. A piece moved to a future week LEAVES this batch entirely — do not reshuffle it into another open slot this week.
3. **Resolve each move to source→destination explicitly** before acting: "Mon's topic → Tue (this week); Tue's topic → Tue (next week, leaves batch); Wed ← Fri's topic; Fri → new." Read it back in one line and let Joe confirm if any move is ambiguous.
4. **When two moves collide** (e.g. NOI assigned to Tue AND "best deal isn't listed" already on Tue), STOP and ask which wins — never silently pick.
5. **Parse negations literally.** "Monday is definitely NOT a beginner topic" means the CURRENT Monday topic is too advanced/wrong for that slot — not an instruction to make it beginner. Re-read polarity before moving.
6. **Read Joe's words as the spec, not a prompt to brainstorm.** When he's correcting placement, don't expand into options; apply the correction and confirm the resulting open slots in one short list.

## Step 4 — CTA per slot (rotate)
Every Joe post drives to EITHER the free Monday 6pm ET Storage 101 call OR Storage Moguls community FOMO. Rotate so the feed isn't repetitive (teaching days → free call; positioning/lead-magnet days → community FOMO with the free-call as backup). Full CTA wording: `linkedin-posts` call-aligned CTA rules.

## Step 5 — Output
- Default: a Word **.docx** in `C:\Users\somea\Downloads\` (readable sizing: ~24pt title, 20pt headlines, 12pt body, 1.15 spacing), one slot per page, each with: day+date, hook headline, a PLAIN "Topic:" one-liner, the call alignment, long form (LinkedIn/IG/FB) + short form (X), CTA. Build via `uv run --with python-docx python <script>` (bare python in this profile has no docx).
- **File-lock pitfall (verified June 2026):** if Joe has the .docx open in Word, the save fails with `PermissionError: [Errno 13] Permission denied`. Don't treat it as a code bug — save to a `... v2.docx` filename (or ask him to close it). The Word-open lock is the cause, not the script.
- Build ONLY the slots Joe asks for. If he says "just Monday and Friday," produce only those.
- For a LinkedIn partner-review batch, `linkedinreview` builds the weekly Google Doc instead.
- 🔒 Never mark the SM Content Tracker in Notion until Joe explicitly approves.

## Relationship to other skills
- **posts-engine** = creates a piece end-to-end. This planner CALLS it to fill gaps, then arranges output into the week.
- **linkedin-posts** = Joe's storage-education generation + the call-aligned CTA rules + the docx review-doc builder this reuses.
- **metricool-scheduling** = actually publishing to the calendar (a later, separate step).

## Extending to other brands
Start Joe-socials-specific (the weekly call structure is his). To add a brand, define that brand's weekly slot shape + alignments here and reuse Steps 2–5 unchanged.
