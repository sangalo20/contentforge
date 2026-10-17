---
name: storage100-beginner-content
description: "Turn Joe Downs' Storage100 Knowledge Base (the per-episode docs, SIMPLIFIED/Part B sections) into beginner social content for Joe's personal brand, SEQUENCED BY LEARNING PROGRESSION — what to learn first because it makes everything after it simpler. Trigger on asks like 'create beginner content from the Storage 100 knowledge base', 'make social posts from the simplified episode notes', 'turn the KB into a learn-storage content series', 'content for beginners ordered by what to learn first'. Distinct from linkedin-posts (daily 6-theme batch off the Notion tracker) and posts-engine (podcast/tracker source): THIS pulls from the Storage100 KB simplified notes and orders by a teaching curriculum, not by theme rotation. Uses warm CTAs (joe-cta principle) and the writing-craft + humanizer + truth gates."
---

# SKILL.md — Storage 100 Beginner Content (KB → learn-ordered social)

**Owner:** Joe Downs · **Created:** June 2026

## What this does
Converts the **Storage100 Knowledge Base** (built by the `storage100-knowledge-base` skill — one Doc per episode, each with PART B = a beginner "Simplified" section + Key Terms glossary) into **beginner-facing social content for Joe's personal brand**, ordered as a **learning progression**: the pieces are sequenced so each one teaches what makes the NEXT easier to understand — not by theme rotation, not by episode number.

Source of truth = the SIMPLIFIED (Part B) sections at `~/sm_tx_work/kb/Day<NN>.txt` (extract `awk '/PART B/{f=1}/PART C/{f=0}f'`). Write from the real notes, never from the title alone.

## The learning-progression spine (what to teach first → why)
Beginners need the mental model before the mechanics. Order pieces along this arc; within it, pick the episodes that exist:

**START UPSTREAM — goal before asset (Joe's correction, June 2026).** Do NOT open with "what is storage" — that assumes the reader already cares about storage. The bigger, more valuable audience is people drawn to REAL ESTATE (usually defaulting to RESIDENTIAL because it feels easiest/most familiar) who haven't considered storage yet. Hook their actual motivation first, then funnel to storage:
1. **What you're really investing in** — real estate is just the VEHICLE; the real goal is time back / wealth / freedom. (Days 1, 11, 13 — "get your time back," "owning a job to owning a portfolio," "buys your time back," "you name your vehicle.")
2. **So which vehicle? Why storage fits most people** — familiar (residential) ≠ best fit; judge any vehicle on time / cash-to-start / steadiness / scalability; residential → apartments → storage, storage quietly checks the most boxes. (Days 3, 13.) NOT a hard sell — let the logic do the work.
3. **What self-storage actually is** — Day 1.
4. **The honest truth: it's a business, not passive magic** — Day 2.
5. **Storage vs apartments (the deeper head-to-head)** — Day 3.
6. **Why it's durable** (recession resilience, counter-cyclical) — Day 10.
7. **What you're actually buying** (the 5 facility types) — Day 5 (Day 6 climate, Day 7 stories feed here).
8. **What it really costs to start** (real capital stack, kills "zero down") — Day 4.
9. **The first number: occupancy** (and why 100% full is bad) — Day 12.
10. **The numbers that value any deal** (occupancy, RevPAF, NOI; chase NOI not occupancy) — Day 9.

Rationale: meet people at the GOAL (time/wealth/freedom) and the moment they're drawn to real estate at all, redirect that energy to storage as the best-fit vehicle, THEN teach what storage is and how it works, THEN money + metrics. Occupancy must precede the 3-number valuation (NOI builds on it).

**The active/passive/hybrid lesson — keep it, and frame it ENCOURAGINGLY (Joe's correction, June 2026).** The old "Passive Income Is a Myth" angle was deflating; Joe wanted it flipped to a positive, investment-forward message titled **"How to Manage It: Run It, Invest, or Hybrid."** Same three paths, but framed as freedom and choice that ties back to the vehicle/time-back theme, NOT myth-busting. Open with something like "Here's the part that should get you excited... you don't have to run a facility full-time to get there. Owning the vehicle doesn't have to own your life. You get to choose how hands-on you are." Reframe each option as empowering (run it = fastest way to learn it inside out; invest = most hands-off, you earn while a pro runs it; hybrid = buy back most of your hours), and close with "no wrong answer, and you can start one way and shift later." This lesson sits AFTER the reader has chosen storage (so it picks up "you've decided storage is the vehicle, now how hands-on?"), distinct from the goal/vehicle openers (1–2) which choose the ASSET.

**The goal→vehicle→comparison arc is also a standalone BLOG** (top-of-funnel, for people not yet looking at storage). It needs room to breathe; close it SOFT ("keep learning, no pressure" → free Monday Storage 101 call), not a hard sell, because the reader is cold to storage. Built file: `~/sm_tx_work/kb/blog_real_estate_is_the_vehicle.txt`; lives in the Storage100 Knowledge Base Drive folder.

## Format per piece (what Joe asked for)
- **Proper heading** — a numbered, plainly-named lesson title, e.g. `#01 — What Self-Storage Actually Is (And Why It's Worth Your Time)`. The heading states the lesson, beginner-readable.
- **The post body** in Joe's voice (see voice rules), one idea, white space, short declaratives, under ~300 words.
- A **plain-language definition inline** when a term is unavoidable (beginners-first — pull the definition from the episode's Key Terms glossary; don't assume knowledge). This is the "make reading it easy" requirement from the KB simplified notes carried into the post.
- **A warm CTA** (see below).
- Default platform framing = Joe's personal LinkedIn (primary), reusable to IG/FB; X gets a short-form variant only if asked.

## Warm CTAs (Joe asked specifically for "beautiful warm CTAs")
Joe's personal brand = the **invite / teacher**, and inviting still **closes** (per `joe-cta`). Warm ≠ weak. Rotate, one per piece, never two:
- **COMMUNITY invite = Joe's DEFAULT close for this content (Joe, Ep10 4-day series, July 2026).** Invite people to join his community at **storagemoguls.ai**: "This is exactly what we work through inside my community. If you want to learn self-storage investing with people who are actually doing it, come join us at storagemoguls.ai." When Joe asks for personal educational content, close to the COMMUNITY at storagemoguls.ai unless he says otherwise — he corrected a batch that closed to the Monday call instead.
- Free Monday-night **Storage 101** call invite (warm + a real ask): "If you want to learn this with me, I run a free call every Monday night called Storage 101. Come hang out. storagemoguls.ai" (confirm exact register link with Joe). Use this when Joe specifically wants the live-call funnel.
- Community FOMO: "This is the kind of thing we go deep on inside Storage Moguls. Come learn with us."
- Soft follow: "Follow along — I'm teaching storage from the ground up." (use sparingly)
- Occasionally a clean landing line instead of a CTA (max 1 per batch).
NEVER "DM me" (Joe banned it). Keep it teacher-warm, specific, confident — not a bolt-on pitch.

### ⛔ PERSONAL-CONTENT BRANDING vs the CTA TARGET are TWO different things (Joe, Ep10, July 2026)
This is Joe's PERSONAL content, not the Storage Moguls brand page — so the two branding hooks split:
- **Poster/asset FOOTER = `joedowns.ai`** (his personal hub). This is the visual signature on the art. Do NOT footer his personal educational posters with storagemoguls.ai. Joe corrected a set that carried the SM brand footer: "remember its content for Joe not for storagemoguls page so there should be some joedowns.ai reference."
- **CTA DESTINATION = the community at `storagemoguls.ai`** (see the community-invite CTA above). The community lives at storagemoguls.ai even though the content is Joe's personal brand.
So a single personal piece carries BOTH: `joedowns.ai` in the poster footer, and a warm "come join the community at storagemoguls.ai" in the caption CTA. When keeping an approved look but changing brand context, the smallest correct edit is: swap ONLY the footer URL (leave the visual look intact) and swap ONLY the CTA tail — don't rebuild the whole poster or rewrite the whole caption.

## Gates (mandatory, in order) — load these skills
1. **TRUTH GATE** (`linkedin-posts` rule): no invented story/deal/number/origin. Joe = COMMERCIAL real estate (storage, syndications, distressed debt), NOT a residential landlord — never put toilets/tenants/midnight-dog-calls in his mouth as HIS experience; only as a contrast vs residential. **Month-to-month is NORMAL/an advantage in storage, never a risk.** KB stats are Joe's stated/ballpark figures → flag `[VERIFY]` or soften ("around," "tends to"), don't assert as audited fact. The KB Part C "open items" lists what to verify.
2. **WRITING-CRAFT** (`writing-craft`): reads clean cold, faithful paraphrase, correct words, no stitched phrases.
3. **HUMANIZER** (`humanizer`): zero em/en dashes, straight quotes, no AI tells, no rule-of-three, short flat declaratives. Read aloud — would Joe say it.
4. **CTA** (`joe-cta` principle): warm invite that still closes.

## Source-fidelity / "did you make anything up?" check (Joe WILL ask this)
Joe's deepest standing concern is fabrication, and he asks the trust question directly ("Is this all from the videos? I hope you haven't made anything up"). Be ready to PROVE it, and trace to the right source:
- **Verify against the RAW TRANSCRIPT, not your own KB notes.** The KB Part B is already one paraphrase removed from Joe's words; your own notes/memory can drift further. The audit-proof source is the raw transcript file at `~/sm_tx_work/downloads/<fileID>.txt` (the fileID per day is in `~/sm_tx_work/final_map.json` / `queue.json`).
- **Fast method that worked:** `grep -oiE '.{N}(claim keyword|number).{N}' <transcript>` to pull the surrounding context and confirm the exact figure/phrase is Joe's. The 85%/$150/$12,750 vs 95%/$125/$11,875 occupancy math, "as little as 10% down," "a business, not a bond," "counter-cyclical" — all traced back verbatim this way.
- **Honest framing of the split:** the WORDS and framing are yours (that's the writing); the FACTS, NUMBERS, and CLAIMS must all be Joe's from the video. State that distinction plainly when answering the trust question.
- **The one legitimate caveat:** many of Joe's numbers are his own stated BALLPARKS ("generic numbers," "industry norms"), not audited facts — he hedges them himself on camera. So softening them in the post ("around," "tends to," "my ballpark, not gospel") is faithful, not invention. Don't present a hedged-on-camera figure as proven.
- **Safety check to run every batch:** grep the transcript for first-person landlord claims ("I was a landlord," "my tenants," "my apartment") to confirm you did NOT put residential-landlord pains in Joe's mouth as his own experience. Residential only ever appears as a CONTRAST.
- Offer to add a small `source: Day N` tag under each piece so the trace is visible to Joe at a glance.

## Voice (Joe personal — from soul.md + linkedin-posts)
Flat declaratives. No warm-up. Hook first line. One idea. White space. No hype words ("incredible/amazing/game-changing"), no filler ("at the end of the day"), no rhetorical-question openers, no motivational-poster lines. Educator who makes storage feel accessible, not elite. Credibility from lived experience, not credentials.

## Workflow
1. Confirm scope (how many pieces, which episodes available in `~/sm_tx_work/kb/`). The KB is built in batches by the `storage100-knowledge-base` cron, so more episodes appear over time — check what's present.
2. Extract Part B for the episodes that map to the learning spine; read them (the simplified body + glossary).
3. Lay out the learning order; write each piece with heading + body + inline definition(s) + warm CTA.
4. Run all four gates on every piece.
5. Deliver as a Google Doc (one piece per section, numbered headings + TOC) in the `Storage100 Knowledge Base` Drive area, or a Word .docx in Downloads if Joe wants to send it — match how he asked. Use the chunked-create technique from `storage100-knowledge-base` (docs create/append fail on big bodies — create with first ~8KB, append rest in ~8KB chunks via the absolute venv python).
6. Visuals: optional, judged per `posts-engine` Step 7b — decide if/what, render only on Joe's go-ahead.

## Graphic-ebook output (the polished, illustrated PDF deliverable)
Joe asked to turn the 10 pieces into a "graphic ebook... point form where necessary, formal topics, illustrations and graphics, fun to read." This is a recurring upgrade of the same content into a designed artifact, and it worked well. Approach:
- Build a **self-contained HTML file** modeled as fixed-size ebook PAGES (cover → "how to read" + contents → one designed page per lesson → closing/CTA page), then render to PDF with **headless Chrome** (`--headless=new --print-to-pdf`) using a `@media print` block with `@page{size:<w> <h>;margin:0}` + `page-break-after:always` so each section is one clean page.
- **Per-lesson page** = formal heading + big chapter number, a short lead, **point-form key takeaways** (`ul`), a **definitions callout** pulled from the episode's Key Terms, a **custom SVG illustration/data-viz** for the idea, and the warm CTA. Make graphics from the content itself — the 85/95 occupancy bars, the Occupancy→RevPAF→NOI flow, the capital-stack segments, the 5 facility-type icons, the passive↔active spectrum. NO stock photos, NO AI slop.
- **Brand spine = Joe personal (JD):** near-black navy `#0A0E16` + electric blue `#2E6BFF`, Fraunces serif headlines + Inter body + JetBrains Mono `[ BRACKET LABELS ]`, footer `joedowns.ai`. (Swap to Storage Moguls serif/editorial + `storagemoguls.ai` if Joe wants the SM brand instead — ask.)
- **ALWAYS visual-QA before declaring done:** render page PNGs (`pdftoppm -png -f N -l N`) and inspect with vision for clipped/overflowing figures (big focal numbers in flex rows clip — use `white-space:nowrap`, step font size). The cover + every chart page were QA'd this way.
- Deliver the PDF (and the HTML source so it's re-editable) to `C:\Users\somea\Downloads\`, share via `MEDIA:<path>`.
- **Two corrections Joe made on the ebook (don't repeat them):** (1) **WORDING STAYS VERBATIM** — when converting approved pieces into a designed layout, do NOT reword/compress the copy to fit the design; restore the exact approved text and change the LAYOUT if it won't fit ("I like the styling, but the wording should have remained the same"). (2) **EVEN SPACING** — never use `flex:1` on an inner illustration band (it warps the vertical rhythm); use one shared `--gap` applied via `.lesson > * + *{margin-top:var(--gap)}` plus `margin-top:auto` on the CTA only, so every page spaces identically and the CTA pins to a consistent slot.
- **COMPLETE COVERAGE — never drop a topic to hold a round number (Joe's correction, June 2026).** When restructuring (e.g. adding the two goal/vehicle openers), do NOT silently squeeze the count back to 10 by dropping lessons — Joe caught that v1 had dropped two original topics. **Expand the lesson count to fit ALL topics** (v1 went to 12: 10 originals + 2 new openers). Before delivering a restructure, diff the new lesson list against the original master (`~/sm_tx_work/kb/beginner_series_01-10.txt`) and confirm every original topic still has a home.
- **PARALLEL VERSIONS — keep them consistent.** Joe maintains more than one cut of the same ebook as distinct deliverables: v1 = goal-first roadmap (vehicle idea as Lessons 1–2); v2 = original 10-lesson order with the vehicle idea dropped into a single slot (#5). When you change a shared lesson in one version, OFFER to apply the same change to the other so they don't drift.
- **Per-page overflow on dense pages:** the bottom-pinned CTA can collide with the page-number/footer when a page is content-heavy (spectrum diagram + intro + 3 bullets + closing + 2-line CTA). Fix WITHOUT touching other pages: add a `.tight` modifier (`.lesson.tight > * + *{margin-top:24px}` and `.lesson.tight ul.pts{gap:13px}`) to just that page. Always crop-and-inspect the bottom ~22% of dense pages to confirm the footer clears the CTA.
- He also asked for a warm **picture-book / "children's book hybrid"** variant (cream paper, color-coded lesson badges, emoji-icon bullets, big friendly illustrations) as an alternative to the dark editorial look — both are valid; ask which he wants.
- **Make it interactive when delivering an ebook:** clickable URLs (wrap `storagemoguls.ai` in real `<a>` links) + a **navigable Table of Contents** (lesson `id` anchors + `<a href="#lN">` rows — these jumps survive into the Chrome PDF). And give EACH lesson's CTA a short, topic-varied line emphasizing the guide is just the overview and the real depth is on the live call.
- **Mirror the ebook into the text REVIEW DOC when Joe asks** ("put v1 in the review doc"). It's the same Google Doc (id `1k7QH9Ro2SnB0whiItv3AUmoM7Ekl-egYjH0S59mzTP0`); update it IN PLACE (preserve id/URL). The CLI has no replace verb — use the Docs API `batchUpdate` (deleteContentRange + insertText) directly, rename via Drive if the title is stale, and gate-check the LESSON BODIES only (your meta/notes text false-positives the dash/"DM me" greps). Recipe in the reference file.\n- Full build recipe + the exact Chrome/pdftoppm commands, the page-model CSS, the wording-fidelity + even-spacing fixes, the picture-book variant, the clickable-links / navigable-TOC / overview-CTA patterns, and the in-place review-doc update technique are in `references/graphic-ebook-build.md`.

## Related
`storage100-knowledge-base` (the source KB + the doc-creation tooling/gotchas), `linkedin-posts` (Joe voice + truth gate + approval pipeline), `joe-cta` (warm-close craft), `writing-craft`, `humanizer`, `posts-engine` (the full orchestrated pipeline + visual decision), `brand-poster-design` (if visuals).

## N-DAY LEARNING SERIES from ONE episode's Understanding (curate → sequence → day-by-day, proven Ep10, July 2026)
A recurring, distinct output shape (separate from the ebook and the full poster set): Joe asks to take ONE episode and "curate it into a N-day series of learning" for his socials. This is NOT "process the episode into all platforms" — it's a tight, sequenced teaching arc.
- **Source = the episode's UNDERSTANDING** (the filed Notion Episode Library page, e.g. SM Ep10 `392cc74e-bcf3-81fd-a243-d7888923c857`), already verified. Write FROM the understanding, not transcript phrasing. Still trace facts to it.
- **Collapse the episode's several ideas into N actionable LESSONS in a learning order.** Ep10's 6 ideas collapsed cleanly into a 4-day arc: 3 fears (money → seller → broker) then the mindset close; the supporting proofs (the NC $100K deal, "never a down year") got folded into the relevant day, not given their own day. Each day = one standalone lesson that teaches even if the reader never sees the others.
- **Per day = a poster + a long-form caption + an X short form.** Poster = the light-editorial "Storage 101" look (see the poster-set reference) with a **DAY N of N** kicker so the series reads as a sequence. Caption = Storage-100 teacher voice, one idea per line, actionable. Each day's caption may nod to the arc ("Yesterday we killed the money fear. Today...") but still stands alone.
- **Poster copy = message-first + scannable:** DAY N kicker + big Fraunces headline (the backbone) + ONE short blue-left-border supporting line. No paragraphs on the art (writing-craft Rule 8; poster budget is headline + ~10-word line).
- **Reuse the approved head/style donor** rather than authoring CSS from scratch: the Ep10 generator `C:\Users\somea\SM_Ep10_edu\gen_series.py` reads the exact approved light-editorial head (masthead + Storage 101 tag + Fraunces/Barlow/JetBrains fonts + cream/navy/blue spine) and emits both the 1080x1350 feed poster and the 1080x1920 story per day (story bumps type ~16% and widens wrap insets to fill the tall field). Render with the full-path Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe` (not on PATH), then vision-QA every poster.
- **Deliver to a named Downloads folder** (`C:\Users\somea\Downloads\Joe_Ep10_4Day_Series\`) = a captions `.txt` (all N days: heading + long-form caption + X short form + notes) plus the feed + story PNGs. Share each poster as a BARE `MEDIA:<path>` line.
- **Branding/CTA:** joedowns.ai footer + community-invite CTA to storagemoguls.ai (see the PERSONAL-CONTENT BRANDING box above).
- Run writing-craft (mandatory bare-noun sweep — pin "self-storage" on every bare lender/market/deal/owner/buyer/broker in openers + CTAs) + humanizer (zero dashes; the sneaky failure is leaving em-dashes in the file's SECTION HEADERS — scan the WHOLE file, not just caption bodies).

## Educational POSTER SET from an episode (light-editorial posters + captions, NOT promo)
When Joe wants EDUCATIONAL social posters from a specific episode (teach a standalone lesson, "lightweight/easy on the eyes," distinct from promotional clip-videos): light-editorial "paper" poster recipe + Storage-100-guide caption voice + the "name self-storage investing, no guesswork" clarity rule + IG/FB story reflow + Cloudinary→Metricool scheduling are all in `references/educational-poster-set.md`. Proven SM Ep04, July 2026.

## AI-IMAGE poster prompts (Grok / text-to-image) from the ebook lessons, matched to Joe's inspiration styles
A NEWER output shape (started July 2026): turn each ebook lesson into a poster generated by an AI image model (Grok), styled after inspiration images Joe supplies (he dropped 5 into `~/Downloads/Telegram Desktop/`). Distinct from the HTML→Chrome posters above.
- **VIEW every inspiration image first** (vision_analyze) and catalog each style: layout, palette+hex, type treatment, subject/photo-cutout vs illustration, mood. Map ONE style → ONE poster before writing prompts.
- **The lesson content still comes from the CHOSEN ebook version** — so run the WHICH-VERSION disambiguation (see `references/graphic-ebook-build.md`, "WHICH VERSION did Joe pick?") BEFORE writing the prompt. Building a Grok prompt off the wrong version's first lesson is exactly the failure that got flagged this session.
- **AI models mangle multi-line body copy** (Grok included). Recommend the hybrid: let the model generate background + hero + big display headline, then overlay the precise supporting copy + `joedowns.ai` footer cleanly ourselves (the HTML/Chrome way). Say this up front so Joe expects it.
- Same branding split holds: poster FOOTER = `joedowns.ai`, caption CTA = community at `storagemoguls.ai`.
- For a first model test, anchor Poster 1 to the SIMPLEST text-forward inspiration style (big-headline-owns-the-frame) so it's easy to judge whether the model handles poster text before trying conceptual/surreal styles.
