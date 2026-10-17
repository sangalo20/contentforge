---
name: successfulidiots-podcast
description: Generate ready-to-publish content for the Successful Idiots BRAND accounts (LinkedIn, Instagram, YouTube) from podcast episodes in Google Drive. Trigger when asked to "generate posts for Successful Idiots episode X", "process the new SI episode", "write captions for the SI promo video", "create content for the SI brand accounts", or "what posts do we need for this SI episode?". Processes the episode's Captions/Posts doc and Transcript from the "Successful Idiots" Drive folder, adapts pre-written posts per platform, and extracts additional insight angles. Brand voice only — NOT Joe's personal page (use joe-from-podcasts) and NOT Storage Moguls (use storagemoguls-podcast).
---

# Successful Idiots Podcast Content Generator

Processes Successful Idiots podcast episodes from Google Drive and generates ready-to-publish content for the **Successful Idiots brand accounts** (LinkedIn, Instagram, YouTube). Also handles promo video captions when video assets are present in the episode folder.

This skill generates content FOR the SI brand — not for Joe's personal page. Joe's personal LinkedIn content drawn from SI episodes is handled by the `joe-from-podcasts` skill.

## ⚠️ RELATABILITY — lead with the reader's OWN business, not storage (Joe flagged, SI Ep031 follow-up, June 2026)
The SI audience is small-business owners of EVERY trade, not storage operators — so a piece (caption AND poster) framed in storage units makes a salon/plumber/coffee-shop owner translate before it lands, and most won't. **Lead with the universal example the episode already gave** (the hairdresser mid-haircut, the sandwich shop "want your usual ready for 11:30?", the text missed at dinner); demote storage to "one example among several." **Fix the VISUAL too:** Ep031's Idea-1 poster said "what one missed call costs *a storage business*" — edited to "*a small business*", re-rendered, vision-QA'd. Caption + paired visual must BOTH pass "would an owner outside storage see themselves here?" Full cross-brand rule: `brand-knowledge-hub` → "RELATABILITY". (Re-rendering one poster: edit the wording in `gen_si_ep031.js`/the generator, `node` it, then headless-Chrome screenshot to a TEMP filename and `mv -f` over the original — the original PNG can be locked, so write to `_tmp.png` first then move.)

## ⛔ COPY CRAFT vs LAYOUT — learn the Storage-100 guide's CLARITY, do NOT mimic its ebook LOOK (Joe corrected HARD, SI Ep16 redo, July 2026)

Joe pointed me at the Storage 100 Picture Guide (`~/sm_tx_work/ebook/Storage100_Picture_Guide_v2_swap5.html`) and said to study "how it should work." I over-corrected and rebuilt the SI posters as ebook PAGES — lesson-number badges, "Lesson N / 8" labels, textbook furniture. Joe stopped it: *"No we are not creating the book, we are creating content. I just needed you to learn how to create the copy, not to mimic the style."*

**What to actually take from the Storage-100 guide = the COPY CRAFT, not the layout:**
- One idea per line. Short, plain, warm.
- Zero jargon, or a term defined in the same breath. Concrete over abstract.
- Each thought BUILDS into the next; a batch of pieces builds on each other in sequence (stakes → reframe → the number → what to do → what the freed time is for → the next problem → reframe → the fix).
- Rhythm like "Twelve is small. Twelve is finite. Twelve, you can handle." / "The stress you get over. The moment you don't."

**What NOT to carry over:** the ebook furniture — numbered lesson badges, "Lesson N of N" tags, chapter framing, cream-paper page model. Those make a social poster read as a textbook page (verified this session: vision-QA'd the badge version and it read as a book, not a scroll-stopper). Keep the normal SI social-poster form (bold Oswald message headline + one clean lead + optional bullets or a yellow callout bar, SI navy/yellow/green, `successfulidiots.ai`). Working generator for this clean form: `C:\Users\somea\BrandAssets\_scripts\gen_si_ep016_v2.js` (kicker top-left, content vertically centered via `.mid{flex:1;justify-content:center}`, footer bottom — no lesson badges).

Rule of thumb when Joe references another brand's asset as a model: he almost always means the WRITING/clarity/flow, not the visual template. Confirm which if unsure; default to copy craft.

## 🎯 EVERY POST HAS A JOB — educate / entertain / promote; don't let a batch read as all-ads (Joe, SI Ep16 July 2026 — now writing-craft Rule 9)

Joe: *"not every post is promotional, some are educative and some might be entertaining, so don't let all the posts read as promotional."* Before writing each piece, decide its JOB:
- **Educate** — teach one useful thing the reader keeps even if they never click (soft close or none).
- **Entertain** — a scene / relatable moment / dry observation that lands on its own (no ask).
- **Promote** — the piece(s) that actually drive to the episode / community.
Mix the modes across the batch; most pieces earn attention, only some carry the ask. **Match the CTA to the job** — an educate/entertain piece can close soft or NOT push at all; save the funnel close for promo pieces. When Joe says "education or entertainment only, no promotional," build the WHOLE batch with zero funnel closes, zero episode-listen lines, zero URLs in copy (the site still lives on the poster art footer). Full rule + the 4-question gate (message clear? problem→want solution / solution→want more? good vocab not stitched? flows?) lives in `writing-craft` rules 8/9/10 — run it on every piece.

## 🧱 CONTENT STRUCTURE — IDEA → PLATFORM → TYPE (Joe locked, June 2026)

Produce episode content by the locked hierarchy (full spec in `brand-knowledge-hub` → "CONTENT STRUCTURE"):
**IDEA / story → PLATFORM → TYPE (poster/reel/carousel/story/static/video/description/thread) → CONTENT + VISUAL paired.**
- Pull the episode's SEVERAL distinct ideas from the Understanding, then for EACH idea build all four core platform pieces, choosing the FORMAT per platform that fits the idea — do NOT re-skin one idea into many near-identical pieces (repetition, not range).
- **COVERAGE is fixed, FORMAT is idea-driven (Joe locked, June 2026): EVERY idea gets a post on ALL FOUR core platforms — LinkedIn, Instagram, X/Twitter, Facebook. Never skip a platform.** Joe corrected this directly after Ep030 Idea 3 dropped Facebook: *"Every platform should always have a post."* The idea drives the FORMAT (poster / static / carousel / quote card / video), NOT whether a platform gets a piece. A Promo-folder video can be the visual on the video-capable platforms, but the others still each get their own piece; only a rich sequential idea warrants a carousel (then build every slide). YouTube description stays episode-level.
- When an idea DOES get a carousel, build EVERY slide. Multiple captions of one type stay under the same idea.
- File each piece into Content Pieces with `Idea / Angle` + `Type` + `Platform` + `Brand` + `Account`, grouped under one Content Library campaign.
- Present to Joe ONE PIECE PER MESSAGE: content + its visual together, as he'd post it, then wait for "next".

## ✍️ UNDERSTANDING PHRASING — how to write each understanding point so it's clear at a glance (Joe drilled this ~8 rounds, SI Ep031 idea 6, June 2026)

The understanding layer itself must read like someone who genuinely GETS the idea — clear, direct, easy. Joe rejected round after round of phrasing on ONE point before it landed. The gold-standard line he approved (study its shape):

> **"When a big technology shift hits an industry, the businesses that get wiped out are the ones stuck in the middle — not cheap enough to win on price, not premium enough to win on brand."**

**WHY it works — apply these rules TOGETHER, not one-by-one as a checklist (chopping a sentence rule-by-rule breaks the idea):**
1. **Topic sentence states the REAL idea first, in plain words.** Lead with the point, then the proof (plainlanguage.gov: have-a-topic-sentence, main-idea-first).
2. **Define any term in the SAME breath that could make the reader ask "X of what?"** Here "the middle" is defined instantly by the two edges that bracket it AND the test: "not cheap enough to win on price, not premium enough to win on brand." Never leave "the middle / in between / one end or the other" floating.
3. **Concrete, active verbs** ("get wiped out", NOT "disappear / are exposed / fade").
4. **Parallel rhythm** ("not X enough to win on Y, not X enough to win on Y") makes it read effortlessly.
5. **One idea per sentence, familiar words.**

**FAILURE MODES Joe rejected by name (recognise and avoid each):**
- **Clever LABELS you must decode** — "the middle dies", "the survivors change what they are", or a title-tag like "Peter's warning:" bolted onto the headline. A label sounds smart but adds friction. State the thing; weave attribution into the body ("Peter points to…"), never as a name-tag on the headline.
- **Spatial METAPHORS standing in for the mechanism** — "ends/middle", "stuck somewhere in between." "In between" trails off and paints no picture; say what that position actually MEANS (e.g. a business a customer has no specific reason to choose).
- **OVER-simplifying that DISTORTS the facts** — "the cheapest" is WRONG for Walmart (its edge is scale/squeezed cost); "special" is wrong for Louis Vuitton (its edge is BRAND). Plain words must still carry the true concept.
- **Silently SWAPPING the source's idea for an easier one** — I changed Peter's "the middle market has no defensible advantage" into "best at one thing rivals can't copy" because it was easier to phrase. That's changing his point, not clarifying it. ⛔ The idea must stay the SOURCE'S idea; only the PHRASING improves.

**HARD RULES:** (a) every fact must have been said in the episode — re-verify against the transcript, don't trust memory (re-download the docx if you cleaned it up). (b) When stuck, RESEARCH proper writing (plainlanguage.gov guidelines: topic-sentence, place-main-idea-before-exceptions, use-simple-words-phrases, write-short-sentences, keep-subject-verb-object-close) and apply the principles HOLISTICALLY — understand them as a whole, don't run them as a one-by-one checklist. Lead the deliverable with the understanding; show this step.

## ⛔⛔ THE #1 RULE — process source into UNDERSTANDING, then write FROM the understanding (Joe corrected HARD, June 2026)

This is the rule Joe cares about most. The failure mode that made him reject Ep30's first pass: **lifting phrases out of the transcript and stitching/paraphrasing them into headlines and captions.** Spoken words were never built to be a headline — dropped into a poster they read cheap, choppy, "like a three-year-old wrote it" (his words). Examples he killed: "He got his brain back instead", "the time did something else."

**The process that works (do it every time):**
1. **Read the WHOLE transcript + show notes + blog** — the full conversation, not keyword snippets. Understand the arc, the turns, the *why*.
2. **Distill into an UNDERSTANDING layer** — the IDEAS and their CONSEQUENCES, in your own words. Not quotes. E.g. don't note "he said 'no such thing as spam, just shitty emails'" — note "*story-style emails beat the spam filter and reconnect you with people who ignored you for years.*"
3. **Write the posts FROM that understanding** in brand voice. The intuitive move: when you have a good line ("He automated one email to save time"), don't ask "what words come next in the transcript" — ask **"what did that automation actually DO for him beyond saving time?"** and write THAT. (Answer here: it gave him the quiet headspace where his next product idea arrived.)
4. **Quote a raw transcript line ONLY if it is strong enough to stand alone** (e.g. "There's no such thing as spam, just shitty emails" works verbatim). If paraphrasing a line cheapens it, don't paraphrase — write fresh from the insight. Never manufacture a detail that isn't in the source.
5. **ALWAYS file the UNDERSTANDING into the brand's Notion knowledge DB** (SI Knowledge `1426722b-61b0-412d-a797-760b96d393a7`) as part of the episode's knowledge — Account/Brand/Status per that DB, Source = episode Drive folder, attribute results to the right host. This is the reusable asset; the posts are downstream of it.

Brand voice itself was NOT the problem — Joe confirmed the SI voice is right. The problem was execution: "short and punchy" is NOT "choppy fragments." SI voice is short *with rhythm* — full sentences, real cadence, one clean open loop, no juvenile slang. (See the SI voice table below.)

**→ The full narrative copy craft (open loops, the rejected-vs-accepted Ep030 rewrites, the "what did it actually DO?" move, headline-option patterns) lives in `references/narrative-copy-strategy.md`. Read it before writing headlines/captions.**

## ⛔ GO DEEPER THAN THE ANECDOTE — the podcast moment is the EXAMPLE, the human truth is the message (Joe corrected, SI Ep16, July 2026)

Reading the source and distilling an understanding is NOT enough if you stop at what HAPPENED. Joe pushed past a surface-correct understanding: *"I understand you are getting things directly from the podcast, but what is the DEEPER REASON that these things were said?"* Every anecdote (the wifi text, the 12 questions, the $500 dog walk) is there to carry a deeper human truth — find that truth, make IT the message, and demote the anecdote to the EXAMPLE that drives it home. Then state the deeper truth in PLAIN one-read language, not a clever metaphor (Joe: *"now you are using clever metaphors, I want this to be one read and you get the gist"*). Both the deeper-why method and the metaphor trap (with worked SI-Ep16 rejected→plain rewrites) are in `references/plain-language-rules.md` — read those two sections before writing any understanding.

⛔ **A WRONG understanding propagates onto the POSTER — verify the claim against the transcript, not your paraphrase (Joe caught it on a rendered poster, SI Ep16, July 2026).** After the whole set was built, Joe read poster ⑥'s headline — \"You can't say no for the same reason people like you\" — and asked *\"what does that even mean?\"* then *\"that is the wrong understanding for that one.\"* The headline was a riddle AND factually off: I had paraphrased Peter's line (via IPEC Williamson) *\"people who are really caring, really tuned in are often the ones who can't say no… because they can already feel the other person's reaction before it even happens\"* into \"the reason people LIKE you\" — swapping the real point (EMPATHY: you feel their disappointment before it lands) for an invented one (likeability). The corrected headline that matched the source: *\"You say yes because you already feel their disappointment.\"* Lesson: a subtly-wrong paraphrase in the understanding rides straight through into the poster headline and caption and isn't caught until Joe reads the finished art. FIX: when a headline rests on a specific claim, RE-OPEN the transcript and confirm the poster says what the host actually said — before rendering, not after. (Re-cutting one poster: edit that block in the generator, `node` it, re-render just that PNG, vision-QA, re-copy to Downloads.)

## ⛔ INSIGHT LEADS, STATS SUPPORT — never position a whole post on an industry-specific number (Joe corrected, SI Ep031, June 2026)

Joe rejected leading Idea 1 with the $800+ missed-call stat: *"the stats were for a specific industry, so it takes away from the whole message. If the message is always clear and the highest priority, we get people to see the insight the episode is trying to push."* Two failures a hero-stat causes:
1. **An industry-specific number silently de-selects everyone else.** Joe's $800 was a STORAGE number; a hairdresser/sandwich-shop/plumber reading it thinks "not me" and scrolls. The SI audience is ALL small businesses, so the framing must be universal.
2. **A stat-led post is about the STATISTIC, not the INSIGHT.** The episode is pushing an idea (here: *you lose customers to unavailability and never even see it happen*). That insight is universal and is the thing worth landing. The number is just one operator's evidence for it.

**The rule for EVERY post (caption AND visual):**
- **Lead with the INSIGHT, in plain universal words.** It's the first line, the poster headline, and the spine every other line serves.
- **Demote the stat to optional supporting texture** — at most ONE line, on ONE platform (usually the long LinkedIn body), explicitly framed as "one operator's math" and immediately subordinated ("but the number isn't the point"). Cut it entirely from IG/FB/X if it doesn't earn its place. NEVER the headline, NEVER the poster hero.
- **The poster must hero the MESSAGE, not the number.** If a poster leads with a big `$NNN` stat for a universal insight, rebuild it as an insight/typographic poster (the message as the hero). Worked example: SI Ep031 Idea 1 was rebuilt from a `$800+` big-stat builder to a typographic "You're losing customers you'll never know you had" poster (gen_si_ep031.js Idea-1 block) — re-render + vision-QA after.
- Sibling to the existing relatability rule (lead with the example that mirrors the reader's own business): same root — make the reader SEE THEMSELVES and SEE THE INSIGHT first; specifics/stats serve that, never gate it.

## ⛔ MANDATORY — read the Drive source. Notion is NOT a substitute. (Joe corrected this hard, June 2026)

ALWAYS pull the episode's **Show Notes.docx + Blog.docx + Transcript FINAL.docx from the Drive episode folder** BEFORE writing a single line. Do not generate content from the Notion Content-Pieces entry, a chat summary, or memory of the episode. The Notion entry is a thin secondary summary; building on it produces **shallow, generic content** (verified failure this session — Joe: *"you ALWAYS need to follow that structure, otherwise we get shallow content"*). The richness lives ONLY in the Drive docs: e.g. Ep030's real hooks were the *squeaky $500 chair email*, *Daniel Throssell's story-first style*, the *24X jump* (4x opens × 6x clicks), *"there's no such thing as spam, just shitty emails"*, the *Oprah cold-open* (high-school dropout = relentless compounding observation = what AI does in 45s), *cappuccino/headspace* — NONE of which were in the Notion summary. The transcript is where the quotable, specific, surprising lines are — mine it, don't paraphrase a summary. Always also check the `YouTube/` and `Promos/` subfolders for REAL promo clips before building any video (don't fabricate a video when the real cut already exists). Notion is the routing/system-of-record DB (Account/Brand/Status); Drive is the CONTENT source. Use both for their purpose — never swap them.

## When to Trigger This Skill

- "Generate posts for Successful Idiots episode [X]"
- "Process the new SI episode"
- "Write captions for the Successful Idiots promo video"
- "Create content for the SI brand accounts"
- "What posts do we need for this SI episode?"

Do NOT use this skill for:
- Joe's personal LinkedIn posts (use `joe-from-podcasts`)
- Storage Moguls brand posts (use `storagemoguls-podcast`)

## The Show

- **Name:** Successful Idiots
- **Hosts:** Joe Downs + Peter Swain
- **Website:** successfulidiots.ai
- **Audience:** Investors, operators, and entrepreneurs building financial freedom through self-storage and automation
- **Core themes:** AI tools for business, entrepreneurship, wealth mindset, automation, outreach, passive income, business systems
- **Tone:** Modern, energetic, accessible, slightly contrarian. Not corporate. Not preachy. The "successful idiot" framing is self-aware — smart people making unconventional moves.

## Brand visual identity (for graphics / Canva repurpose)

- **Colors:** White `#FFFFFF` · Yellow `#FDE801` · Green `#16A34A` · Navy/near-black `#1A1A2E`
- **Fonts:** Oswald (headings) · Open Sans (body)
- **Logo:** "SI" mascot monogram (figure in yellow cap at a mic) + wordmark; 5 lockups (white-on-black primary, two-tone, all-black, all-green, all-yellow).
- **Canva brand kit id:** `kAHMMao4RMI` (use with `generate-design` brand_kit_id).
- Full registry + Drive style-guide JPG locations: see the `brand-knowledge-hub` skill's `references/brand-assets.md`.

### ⛔⛔ BUILD ON THE APPROVED SI SPINE `_si_base.css` — do NOT invent your own poster layouts (Joe ground through ~6 rejected rounds, Ep016, July 2026)
The #1 cause of a long reject loop: inventing fresh layout languages (color-field backgrounds, rounded callout cards, left-border accent bars, hand-computed absolute coords) instead of reusing the brand's OWN proven system. Every invented version read amateur no matter how many "design principles" were bolted on, because the principles were applied in ISOLATION and fought each other. The fix that finally worked:
1. **Load `creative/claude-design` + its `references/brand-social-posters.md` AND `brand-poster-design/references/si-design-system.md` FIRST.** They encode the doctrine: *type IS the hierarchy before boxes/color; ONE accent used sparingly; ONE dominant focal element; vast confident whitespace.* The anti-slop list literally names my failures (rounded cards, left-border callouts, oversized rounded rects substituting for hierarchy, color fields).
2. **Reuse the canonical stylesheet `BrandAssets/Successful-Idiots/LinkedIn/_si_base.css`** — it already defines `.grid-dark` (navy #15151F + faint 50px grid), `.top` furniture (Oswald wordmark + Space-Mono `EP. 0NN` muted), `.tag`/`.tagY` (solid-yellow rotated-ish mono sticker tag), `.big` (huge Oswald stat, yellow, green sub-accent), the green **4px left-rule** `.story` mono support line, and `.foot`. Link it from each poster's HTML (write the HTML into that same LinkedIn/ folder so the relative `_si_base.css` resolves).
3. **Study the APPROVED reference renders before building** — `SI_Ep30_chair-30k_v1.html` ($30K stat), `SI_Ep30_24x_v1.html` (24X), `SI_LinkedIn_Poster_Ep29_60-percent-no-click_v1.html` (60% dossier). Render + vision them; copy their STRUCTURE. Two modes only: **dark case-file** (default) and **neo-brutalist sticker-pop** (yellow bg, hard black borders + offset shadows). Never a soft rounded card, never a "navy with a yellow callout bar."
4. **Vary FOCAL treatment per idea, keep furniture identical = unity:** big-stat hero / headline-hero / centered-stat / host-photo base-band / character-cutout. A `mid()` flex wrapper (`flex:1;justify-content:center`) between the pinned top + foot kills the bottom dead-void that top-anchored content creates.
5. Worked build: `BrandAssets/_scripts/gen_si_ep016_v6.js` — 8 posters on `_si_base.css`, one focal species each, all vision-QA'd.
6. **ALIGNMENT + TYPE-SCALE DISCIPLINE (Joe's final correction: \"align things properly, the font sizes also — proper design, redo\"):** the build that actually landed copies ONE shared skeleton from the two approved mode refs (`SI_Ep30_systems_v2.html` dark + `SI_Ep30_do-it-with-it_v2.html` yellow) — fixed 62px margins, a FIXED type scale reused on every poster (tag 19 / hero 96-150 / stat 200-320 / sub 50 / body 32 / foot 22), everything on one shared left edge, content vertically centered via `.mid{flex:1;justify-content:center}`, identical furniture = unity; vary ONLY background (a `TH` theme map: dark/yellow/green, set together so light-field text is never invisible) + focal treatment. Template to copy for future batches: `BrandAssets/_scripts/gen_si_ep016_v7.js`. Full recipe: `references/poster-variety-and-inspiration.md` → \"THE RESOLUTION\".
Reference photos/cutouts on hand: clean transparent mascot `LinkedIn/SI_char_duo_at_mic_T.png`; real host studio shots `LinkedIn/joe_real.png`+`peter_real.png`.
⛔ **"Both hosts" on a poster = the CHARACTER CUTOUT bleeding off the bottom (approved `SI_LinkedIn_Poster_Ep29_60pct-hosts_v1.html` pattern), NOT a raw two-up photo strip + divider.** Joe rejected the photo-strip-band version as "not even proper design" (Ep016). Full fix + exact `.char{flex:1;align-items:flex-end}` CSS in `references/poster-variety-and-inspiration.md` under "Both hosts". ⚠️ On the v7 fixed-skeleton generator, `flex:1` alone leaves the characters FLOATING mid-poster with a dead gap below — pin `.char` to `position:absolute;bottom:0` to truly bleed, then give `.foot` a solid navy band at higher z-index or the cutout obscures the footer text (both fixes verified SI Ep032, documented in that same reference section; worked build = Idea-9 block of `gen_si_ep032.js`).

### ⛔⛔ POSTER DESIGN — build on the APPROVED SI SPINE, don't invent layouts (Joe ground through ~7 rejected rounds, Ep016, July 2026)
The single biggest time-sink this session: I invented my own poster layouts (color-field blocks, rounded callout cards, annotation tags, arbitrary spacing) and applied "design principles" as an isolated checklist, so they fought each other and looked amateur. Joe rejected 6+ full rebuilds. What finally worked:
- **Build every poster on `_si_base.css`** (the canonical stylesheet the approved Ep29/Ep30 posters use), or a generator that copies its skeleton verbatim. Worked file: `C:\Users\somea\BrandAssets\_scripts\gen_si_ep016_v7.js` — ONE shared skeleton (fixed 62px margins, fixed TYPE SCALE: wordmark 26 / tag 19 / hero 96–150 / stat 200–320 / sub 50 / mono body 32 / foot 22), everything left-aligned to one edge, content vertically centered, consistent furniture (`SUCCESSFUL IDIOTS` top-left, `EP. 0NN` top-right, `Joe Downs + Peter Swain` + `successfulidiots.ai` footer).
- **Study the real refs BEFORE building** — render the approved HTML posters (`SI_Ep30_systems_v2` dark, `do-it-with-it_v2` yellow, `SI_Ep29_60pct-hosts` for host integration, `60-percent-no-click` dossier) and copy their mechanics. The site (successfulidiots.ai) confirms TWO modes: light neo-brutalist (yellow/green highlight blocks behind words, hard-edged boxes w/ offset shadows, NOT soft cards) + dark case-file/terminal (mono labels, sticker tag, green left-rule support line).
- **Type IS the hierarchy** (claude-design anti-slop law): no callout bars, no rounded cards, no color-field-as-variety. ONE yellow sticker tag as the single decorative accent; green as a second tone INSIDE the hero number, not a whole green field.
- **Background is NOT locked to dark** (Joe: "doesn't always have to be dark") — mix dark / brutalist-yellow / green per piece, but keep the SAME skeleton. PITFALL: on a light (yellow/paper) bg, inline `color:#fff` on headline/cards goes invisible — theme the text color per bg, don't leave white text on yellow.
- **Vertical balance:** `justify-content:center` on the content block gives EVEN top/bottom margins (reads intentional). Top-anchoring leaves a dead void at the bottom (Joe flagged it). Character cutouts (`SI_char_duo_at_mic_T.png`) bleed off the BOTTOM edge to anchor, integrated like the approved 60% hosts poster — never a hard photo band with a divider line.
- Real host photos + illustrated character cutouts are first-class visuals; requested compositions Joe named = both-hosts, character cutout, text-centered, negative-space. Vision-QA every poster.

### ⛔ POSTER MESSAGE MUST MATCH THE CAPTION, and CLOSE ON THE SOLUTION (Joe, Ep016 July 2026)
- **Every caption is built FROM the understanding and CLOSES on the episode's actual solution — never left hanging.** Joe: a post that just describes the problem and ends on "worth noticing" / "listen to find out" is "mumbling" and "doesn't sell." Curiosity is created by TEACHING the solution well (value), NOT by withholding it. Shape: problem/idea → build → **deliver the real solution plainly so it lands & finishes.** If the idea is a problem, open on the problem; if it's worth-knowing, open by making the point clear. Educational batch = NO promo dangle, NO "listen to the episode" cliffhanger, NO "follow us" bolt-on close.
- **The poster's body line must land the SAME solution the caption lands on** — poster N ↔ caption N, 1:1. Check the stat/idea mapping isn't swapped (I had posters 4/5 swapped vs caption order). When captions change, re-render posters AND re-upload to Cloudinary (`invalidate=True`) AND re-attach, or the planner keeps the old art.

### ⛔ SPEC-EXACT posters: use `gen_episode.js` (local) OR the Canva HTML-IMPORT path (native Canva) — NEVER Canva `generate-design` (verified Ep031, June + July 2026)
Two proven ways to get a spec-exact poster (specific hero stat, exact headline, correct handle):
1. **HTML → PNG via the engine** `C:\Users\somea\BrandAssets\_scripts\gen_episode.js` (brand `SI`), render to PNG, review in Downloads. Pixel-exact, fully local.
2. **Build it NATIVELY IN CANVA via HTML import** — when Joe says "build in Canva" / "use Canva," he does NOT mean the AI generator; he means a real editable Canva design with our exact copy. Author exact-copy self-contained HTML (styles inlined, fonts via Google Fonts `<link>`, `data-document-role="page"` on the root div), host it public (Cloudinary raw upload), then `Canva_import_design_from_url` → it becomes a **native, fully-editable Canva design** that PRESERVES the exact copy/brand/handle. Verified this session end-to-end: Canva kept the full headline, yellow accent, subline, kicker, footer, `successfulidiots.ai`, Oswald bold, navy grid — perfectly. **Full step-by-step recipe + all the gotchas: `references/canva-native-poster-build.md`.**

⛔ **What NEVER works for exact posters: Canva's AI `generate-design`.** Tried on Ep031 twice (June + a July side-by-side test with the EXACT approved copy locked into the prompt). Every candidate FAILED: **dropped the hero number** ($800–$1,200), **inserted a wrong/garbled logo** (Belrose-ish "BB", a stray globe, "The Baseass"), **garbled body text** ("We nights andlenseits"), **truncated/rewrote the headline**, **dropped the `successfulidiots.ai` footer**, added a fake "Visit Us!" button, and **printed the wrong handle** (`.com`). Locking exact copy into the prompt does NOT fix it — `generate-design` treats copy as a loose suggestion, full stop. It IS genuinely good at loose visual ATMOSPHERE (e.g. a moody smoke-behind-a-phone image our type-first HTML can't easily make) — use it ONLY to source a background IMAGE, then composite exact copy over it (as a background `<img>` on the HTML spine, or `insert_fill` behind the type in a Canva editing transaction).
  - **Joe's standing directive when using Canva: "You are supposed to use the mcp."** Stay in the Canva MCP tools — don't reach for curl/browser workarounds (the `design.canva.ai/<id>` thumbnails aren't raw images, and the `canva.com/d/<id>` editor pages are Cloudflare-blocked to the headless browser). See the reference file for the verified MCP-only path to a real downloadable PNG.

  - **⛔ RE-VERIFIED July 2026 (Ep031 side-by-side test) — same result, plus the Canva MCP how-to.** Joe asked to test Canva vs our HTML pipeline. Ran the SI brand kit (`kAHMMao4RMI`) through `generate-design` with EXACT approved Ep031 Idea-1 copy locked into the query (full headline, subline, `successfulidiots.ai`, an explicit \"do NOT invent words/numbers/logos/URLs\" instruction). ALL 4 candidates still FAILED the copy bar: truncated the headline (dropped \"you had\"), swapped my subline for an invented one, **DROPPED the `successfulidiots.ai` footer on all four**, added a fake \"Visit Us!\" button, and one HALLUCINATED a garbled logo (\"The Baseass\"). Locking exact copy into the prompt does NOT fix it — `generate-design` treats copy as a loose suggestion, full stop. **What Canva IS good at = visual ATMOSPHERE** (one candidate put a striking navy+yellow smoke effect behind a phone silhouette that our type-first HTML can't easily make). So the division of labor: our `gen_episode.js` spine = exact copy/layout; Canva = mood/texture/imagery assets to composite behind exact copy (via a Canva editing transaction, or pulled in as a background `<img>` on the HTML spine).\n  - **⛔ Joe's standing directive when using Canva: \"You are supposed to use the mcp.\"** STAY IN THE CANVA MCP TOOLS — do NOT reach for curl/browser workarounds. Two things that force this: (a) the `design.canva.ai/<id>` thumbnail URLs are NOT raw images — `curl` returns an HTML viewer page (identical file-size across different URLs is the tell); `vision_analyze` CAN load them to eyeball candidates, but you can't curl them to disk. (b) The Canva EDITOR pages (`canva.com/d/<id>`) are Cloudflare-protected — the headless browser gets \"Just a moment...\" bot-detection; don't try to screenshot them.\n  - **✅ VERIFIED MCP path to get a real, downloadable/attachable PNG of a candidate:** `generate-design` → `create-design-from-candidate(job_id, candidate_id)` returns a real `design_id` (e.g. `DAHOU...`) → `export-design(design_id, format={type:'png'})` returns a genuine `export-download.canva.com/...` signed URL that IS a real PNG (verified 1080x1350, `file` reports \"PNG image data\"). That signed export URL is fine to fetch to disk. This is the end-to-end MCP flow from generated candidate → viewable image.\n\n  The `gen_episode.js` SI spine gives pixel-exact control (correct navy `#11151F` + yellow `#FDE801` + green, Oswald/Space Mono, real `successfulidiots.ai` footer) and four distinct builders cover the visual-variety rule in ONE pass: `big` (a stat hero like $800+), `vs` (a comparison — perfect for "AI lies vs the human who isn't there"), `list` (a numbered "how it works"), `minimal`/typographic (a concept line). Author one spec JSON (see `_scripts/si_ep031_spec.json` as a worked SI example), `node gen_episode.js <spec>.json`, render with the headless-Chrome loop, vision-QA, copy PNGs to `Downloads/SI_Ep0NN/`.
  - **Big-number collision (now FIXED in the engine):** the `big` builder's stat used to collide with its subtext (tight `line-height:.95` + `margin-top:8px`). Fixed in `gen_episode.js` to `line-height:1.0` + `.bigsub margin-top:34px`. Still vision-QA any big-stat poster for the number riding into the line below.\n  - **Need a structure beyond the 4 engine builders?** When the visual-variety rule wants species the engine lacks (a clock/time metaphor, an SMS text-bubble mockup, a terminal/prompt card, a price-vs-brand positioning diagram), write a small SELF-CONTAINED generator with the SI spine inlined and ONE builder per idea, render with the same headless-Chrome loop. Worked example: `C:\\Users\\somea\\BrandAssets\\_scripts\\gen_si_ep031.js` (8 ideas → 8 distinct structures in one pass: big-stat, 9pm clock, comparison cards, before/after unit, green text-bubble, positioning diagram with a red dashed \"dead middle\", terminal prompt card, typographic quote). This satisfies the no-two-posters-share-a-structure rule cleanly. Vision-QA each; a hand-drawn CSS clock reads \"late/off-hours\" fine even if hands land ~9:30 vs exactly 9:00 (the \"9\" label + copy carry the meaning).
  - **Second worked generator, message-led (SI Ep016, July 2026):** `C:\\Users\\somea\\BrandAssets\\_scripts\\gen_si_ep016.js` — 8 ideas → 8 distinct structures (typographic, big-number "12", two-stage flow, before/after rows, text-bubble, quote card, $-price card, terminal/prompt card) + a `_promo` announcement, all from the SI navy/yellow/green spine. Render with `_scripts/render_si16.py` (the same headless-Chrome loop). This is the batch where every headline was rewritten to PASS the poster glance-test (see the rule below it) — use it as the template when a future episode wants message-first posters, not stat-first.

### ⛔ POSTER HEADLINE GLANCE-TEST — state the MESSAGE plainly, never a clever fragment-label (Joe corrected mid-render, SI Ep016, July 2026)
The INSIGHT-LEADS rule above kills the industry-STAT-as-hero failure. This is its sibling: the poster heroes a clever LABEL or FRAGMENT instead of the plain message. Joe stopped a finished, vision-QA'd batch mid-task with: *"There is no message on the posters just jargon."* Every headline read like an inside reference you only get AFTER hearing the episode. The plain-language bar that governs the understanding (`references/plain-language-rules.md`) governs poster COPY too — a poster is read by a stranger scrolling, with zero context, so it must pass the glance test on its own.

**Rejected vs fixed (real SI Ep016, study the shape):**
- ❌ "Answer it once. Never answer it again." + cards "Heavy. Zero return." / "Scales to zero." → "scales to zero" is jargon; a stranger doesn't know what scales, or to what.
  ✅ "Answer the question once. Let it answer itself after that." + "It always needs you" → "It never needs you again." (states the actual before/after).
- ❌ "You don't hate trading time for money. You hate the rate." → "the rate" is a clever label you must decode.
  ✅ "You'd give up the evening in a heartbeat. If the price were right." + the $100k test + "you've priced your own time too low."
- ❌ "You looked down at the phone. You missed the takedown." → "the takedown" is insider (wrestling jargon).
  ✅ "You were at the game. You spent it on your phone." + "a guest needed the wifi fixed, so you missed your kid's match."
- ❌ "Stop buying back time just to rest. Spend it on offense." → "on offense" is a label.
  ✅ "The time AI gives back isn't for resting. It's for getting ahead." + "you only hear when something breaks → you reach out before it does."

**The gate (run on EVERY poster headline + subtext, AT RENDER TIME, before vision-QA):** read it as a stranger with no episode context. If a phrase needs the podcast to explain it ("the rate", "scales to zero", "on offense", "the takedown", "the middle dies"), it FAILS — rewrite to the plain message the episode is actually making, stated as a topic sentence + its plain consequence. Same root as the caption rules: a label sounds smart but adds friction; state the thing. **Catching this mid-render is expensive** (re-edit generator → re-`node` → re-render → re-QA the whole batch) — apply the glance test when you FIRST write the spec/generator copy, not after rendering. The vision-QA question should explicitly include "does this communicate a clear message to a stranger, or is it jargon needing context?", not only "is the layout clean?".

#### ⛔ STAGE 2 — plain is NOT enough; the headline must lead with the BENEFIT/PAYOFF, or it won't convert (Joe corrected a SECOND time, same SI Ep016 batch, July 2026)
After the glance-test pass above made every headline plain, Joe STILL rejected the whole batch: *"I still can't see the message, the value of what is being talked about. If I can't understand it immediately it won't convert."* This is a distinct, deeper failure from jargon — the headlines were clear English but they **described the PROBLEM or stated a CONCEPT**, never the **outcome the viewer wants**. A scrolling owner has to finish the poster and INFER the benefit themselves, so the value isn't on the glass in the half-second you get.

**The diagnosis (the half-second scroll test):** imagine a distracted small-business owner scrolling for half a second. Does the headline PROMISE them something they want, or does it just describe a situation / pose a riddle they must decode? If they have to think, it fails.

**The fix — a fixed shape on every poster: benefit-led headline (the outcome they want), then the clever material demoted to PROOF underneath.** The headline is the promise; the $-card / the stat / the metaphor / the test becomes the evidence below it. Rejected-vs-fixed (real SI Ep016, study the swing from problem/concept → payoff):
- ❌ problem: "You were at the game. You spent it on your phone."  →  ✅ payoff: "Your business shouldn't cost you your kid's games."
- ❌ concept: "Answer the question once. Let it answer itself after that."  →  ✅ payoff: "Train it once. Your business runs without you."
- ❌ concept: "You'd give up the evening in a heartbeat. If the price were right."  →  ✅ payoff: "Your time is worth more than you're charging for it." (+ the $100k test as proof).
- ❌ concept: "The time AI gives back isn't for resting. It's for getting ahead."  →  ✅ payoff: "Get two-thirds of your day back. Without letting anyone go." (+ the 68% stat as proof).
- ❌ problem: "You said yes before you typed a single word."  →  ✅ payoff: "Stop saying yes to work you'll resent by morning."
- ❌ concept: "If you can't say no, build a yes that works for you."  →  ✅ payoff: "Protect your nights without ever saying no." (+ the $500 card as proof).

**Pattern:** benefit headlines name what the reader GETS or KEEPS — their nights, their day, their kid's games, their business running without them, their time worth more. Lead with that, prove it underneath. The two stages compound: STAGE 1 makes the headline plain (no jargon), STAGE 2 makes the plain headline a PAYOFF (not a problem/concept). Run BOTH when you first write the generator copy. (Same family as the INSIGHT-LEADS-STATS-SUPPORT and benefit-CTA rules — make the reader SEE THE WIN first; everything else serves that.)

#### ⛔ STAGE 4 — the whole poster must show the SOLUTION, not just dramatize the problem (Joe corrected a FOURTH time, same SI Ep016 batch, July 2026)
After STAGES 1–3 made every headline plain, benefit-led, and sound, Joe STILL rejected the set: *"I don't feel it yet. It's showing the problem really boldly but the solution is not clear."* This is the deepest failure and the easiest to miss because the posters LOOK finished. The flaw: a poster dramatizes the pain (you miss your kid's game / you say yes before you think / your day disappears) and then ends on a **soft generic reassurance where the solution belongs** — "it's fixable," "the problem disappears," "so you don't have to choose." A vague promise that a solution EXISTS is not a solution; the reader feels the problem sharply and gets nothing to want.

**Joe's four-question review rubric — run on EVERY poster (and reuse it verbatim as your own QA before handing over):**
1. **What is the message this is passing — is it clear?**
2. **If it's demonstrating a PROBLEM, does it make me want the solution? If it's giving a SOLUTION, does it make me want to learn more?**
3. **Is it properly worded, good vocabulary — or just stitching things together?**
4. **Does it flow?**

**The fix (Joe chose "benefit-level, vivid, no tool names" — option 2 of 3 he was offered):** stop ending on reassurance; show the actual change in vivid, specific, benefit-level language — NO tool/product names, but never a vague "it's fixable" either. The reader should FEEL what changes for them. Rejected-vs-fixed (real SI Ep016, study the swing from hollow → vivid payoff):
- ❌ "AI can handle that for you, so you don't have to choose." → ✅ "Now AI answers them in seconds, and you never look up from the match."
- ❌ "it's fixable once you see why you do it." → ✅ (phantom reframe) "But that disappointment is a guess, not a fact. See that, and the no you've been dreading gets a whole lot easier to send."
- ❌ "Set it up once, and it runs without you." (vague "it") → ✅ "Answer the question once. Your evenings go quiet." + cards showing "interrupts your dinner, your weekend, your sleep" → "AI gives that answer from then on, day or night."
- ❌ "Most of your day goes to questions a bot could answer." (problem only) → ✅ "Get your afternoons back for the work that grows the place." + "those get answered the second they come in. You go build."

**Two more gotchas from this round:**
- **A poster can legitimately be an INSIGHT/reframe rather than a how-to** (e.g. the exchange-rate $100k test, the people-pleaser "disappointment is a guess") — those don't need a tool, they need to make the reader want to LEARN MORE. Judge an insight poster by question 2's second half, not by "where's the tool."
- **Watch for two posters collapsing into the SAME solution.** When rewriting solutions, I made the people-pleaser poster AND the role-play poster both "rehearse with AI." Fix: give each idea its DISTINCT facet (people-pleaser = the phantom reframe; the separate idea = the AI role-play how-to). Re-check the batch for solution overlap after a solution-rewrite pass.

**The four stages now compound and ALL run when you first write the generator copy:** STAGE 1 plain (no jargon) → STAGE 2 benefit (payoff, not problem/concept) → STAGE 3 sound (natural spoken English) → STAGE 4 solution-clear (the poster delivers a vivid, wanted solution or an insight that pulls — never a hollow "it's fixable"). Running all four UP FRONT avoids the four-round re-render grind this session cost. The shipped SI Ep016 set (in `gen_si_ep016.js`) survives all four.

#### ⛔ STAGE 3 — benefit-led is STILL not enough; the headline must be SOUND written English (Joe corrected a THIRD time, same SI Ep016 batch, July 2026)
After STAGE 2 made every headline a clear benefit, Joe rejected the batch AGAIN: *"Those headlines are okay but they are also not sound language wise."* A headline can lead with the right payoff and STILL read as clumsy, assembled copy — dangling phrases, vague pronouns, clinical figures, copywriter fragments. The fix is a final pass where you read each headline ALOUD as a sentence a real person would actually say, and kill anything that doesn't parse as natural spoken English.

**The four language faults Joe's benefit-led headlines still had (recognise + avoid each):**
- **Dangling/clunky tail clause.** ❌ "Your time is worth more than you're charging for it." ("for it" dangles; and most owners aren't literally "charging" for their time). ✅ "You'd take the late call if the money were right." (natural, and it IS the episode's $100k test).
- **Vague pronoun with no antecedent on the glass.** ❌ "Train it once. Your business runs without you." (train WHAT? a stranger has no referent). ✅ "Set it up once, and it runs without you."
- **Clinical / oddly precise figure as the hook.** ❌ "Get two-thirds of your day back." (reads like a stat report, not speech). ✅ "Most of your day goes to questions a bot could answer." (the 68% becomes proof underneath, not the headline).
- **Copywriter fragment tic.** ❌ "...Without the dread." / "...Without ever saying no." (tacked-on fragments are a marketing tell). ✅ full clauses: "Practice the hard conversation before you ever have it." / "Guard your own time without being the bad guy."
- **Forced/imprecise word.** ❌ "work you'll resent by morning" (resentment isn't a "by morning" thing — forced). ✅ "You say yes before you even think." Sibling of the "rang out" / "know what a word MEANS" rule in `plain-language-rules.md`.

**The gate (run AFTER the benefit pass, on every headline + its subtext):** read it cold, aloud, as a line a person would say in conversation. Flag any dangling tail, vague "it/this/that", clinical figure used as the hook, or tacked-on `Without X.`-style fragment, and rewrite to a clean full clause. Also avoid the headline ECHOING a word that appears right below it (the headline and the bubble/card/caption shouldn't repeat the same phrase). The three stages now compound and ALL run when you first write the generator copy: STAGE 1 plain (no jargon) → STAGE 2 benefit (payoff, not problem/concept) → STAGE 3 sound (natural spoken English, no clumsy construction). The full worked set of all 8 SI Ep016 headlines surviving all three stages is in `gen_si_ep016.js` (the headlines as shipped) — use it as the reference shape.

### Visuals must be as rich as the content (Joe directive, June 2026)
- **Use the full style range** — characters are ONE optional asset, NOT required on every design. Mix: minimalist, big-stat, dossier/CASE-FILE, typographic quote (yellow), infographic, list card, concept/photo. Don't reuse the same template across a batch.
- **Real host photos are a first-class visual** — Joe's and Peter's real studio shots exist (`_remotion/public/joe_mic_smile.png`, `peter_swain.png`; both close-cropped → best as TOP-BLEED photo + lower text band, not side-by-side). Use the real photo of the host who OWNS the angle (Peter's $30K story → Peter's photo). Photos add the richness text-only posters lack.
- **Illustrated SI characters** (yellow-hazmat/respirator/orange-glasses cartoons, transparent cutouts in `Successful-Idiots/characters/`) are for energy/promo pieces — see `brand-poster-design` for the chroma-key cutout pipeline and the pitfall where a near-full-height border column survives connected-component cleanup (strip leftmost/rightmost border columns + recrop, verify on a magenta test bg).
- Tie each visual to a SPECIFIC line from the source (e.g. "24X", "no such thing as spam", squeaky chair) — generic posters = the shallow-content failure again.\n\n### ⛔ VARY THE VISUAL VOCABULARY ACROSS A BATCH — don't reskin one dark template (Joe corrected, SI Ep016, July 2026)\nEven with the copy fixed, Joe rejected the Ep016 set because all 8 posters were the SAME dark navy layout, text-swapped: *"These posters are all dark and all look the same."* Plan a same-episode batch as 8 DIFFERENT design species (color-field, photo-hero, conceptual metaphor, editorial/collage, big-number, quote card, text-mockup, terminal card), MIX light and dark (don't make every poster navy — he wanted "bright and lightweight"), brand LOCKED throughout (variety lives in layout/composition/field-color, never the palette). When Joe sends real-world design inspiration (Pinterest / ad creative), he drops the images into `C:\\Users\\somea\\Downloads\\Telegram Desktop\\` (this runtime is the Hermes DESKTOP app, not Telegram — the handoff is a folder path, not a chat); read each with `vision_analyze`, extract the design LANGUAGE not the content, map each idea onto the style that fits, rebuild SI-branded. Photo/metaphor heroes need image assets. RELIABLE real photos now come from the **Unsplash API** (Joe's key saved at `C:\\Users\\somea\\BrandAssets\\_scripts\\unsplash_keys.env`) — search→pick→download→brand-treat→composite; full runnable recipe (+ the dead no-key routes: Unsplash Source deprecated, Pollinations returns portraits, LoremFlickr unreliable; and no local img-gen model wired in) in `references/poster-variety-and-inspiration.md`. Or use the real host photos, or fall back to photo-free color-field + editorial layouts. Worked mixed-vocabulary build: `_scripts/gen_si_ep016_v3.js` + `render_v3.py`. Plan variety UP FRONT — retrofitting it after a full render+QA is the same re-render grind the copy stages cause. ⛔ **STYLE ≠ CRAFT:** copying an inspiration's LOOK (a color field, an annotation tag) WITHOUT engineering the design PRINCIPLES (hierarchy, grid, dominant focal point, balance, contrast, alignment, active whitespace) fails just as hard — Joe: *\"in an attempt to follow the inspirations you have left out all design principles.\"* Engineer the `brand-poster-design` skill's `references/design-principles-checklist.md` into every poster before rendering; prove ONE poster to the bar and show it as the example BEFORE building the batch. Monotone/grayscale photo heroes must be pushed BOLDER (heavier type, higher photo contrast) or they read flat. Lay content zones out with flex FLOW, not hand-computed absolute `top:` (which threw text off-canvas + left a void this session). Full design-principles + monotone + Unsplash-photo recipe: `references/poster-variety-and-inspiration.md`.

## Filing episode knowledge into Notion

Insight angles extracted here can also be filed as reusable records in the
**Successful Idiots — Knowledge** Notion DB (data_source_id
`1426722b-61b0-412d-a797-760b96d393a7`). File as **Draft** status with the
episode Drive folder as `Source`; tag `Type` and `Topics` per that DB's schema;
keep Peter's results attributed to Peter. See `brand-knowledge-hub` for the
factory model and the per-piece rules.

**Filing the actual POSTS/CAPTIONS into the Content Pieces DB** (campaign in
Content Library first, then pieces under it) has its own fixed-schema gotchas —
the `Parent Campaign` relation can't be passed as an array to
`notion_create_pages`, and `Platform` / `Type` only accept fixed select options
(no "Multi", no "Promo Video Caption" — a promo caption files as Type=Video /
Platform=YouTube). Full working recipe + IDs + the transient-MCP-retry note:
`references/notion-content-pieces-filing.md`. Read it before filing posts.

## Drive Folder Structure

**Root folder:** Shared by Gisele Nzugu — "Successful Idiots " (note trailing space) — folder ID `1dbPYzWD_b6MVtx0xOWgovLceM1TI8Rvr`

**VERIFIED layout (June 2026) — it is NESTED, not flat:**
```
Successful Idiots/  (1dbPYzWD_b6MVtx0xOWgovLceM1TI8Rvr)
  └─ Episodes/  (1iV0suHBBlIuf4reWUhB4-vD8CLfVRukU)
       ├─ 030 First AI Workflows/   ← episode folders, numbered "NNN Title"
       ├─ 029 How AI is Rewriting Discovery/
       ├─ 028 Using AI to Get Started/
       └─ Older Episodes/   ← archive subfolder
```
To find the LATEST episode: list the `Episodes/` folder, pick the highest-numbered `NNN Title` folder (sort by name or modifiedTime). Standalone docs at the SI root named `Successful Idiots_EpNN` are OLD (pre-folder era) — prefer the `Episodes/` tree.

**Each episode folder typically contains (NO dedicated "Captions/Posts" doc — that field in older versions of this skill was wrong):**
- **Show Notes.docx** — the de-facto pre-written base: title, hook, episode summary, "Listen For" + "Watch For" timestamps, links. ← OPEN THIS FIRST.
- **Blog.docx** — long-form prose summary; second-best source of pre-written angles.
- **Transcript FINAL.docx** — full conversation for deep angle extraction.
- **An MP3** — the audio.
- **YouTube/ subfolder** — holds the main promo video clip (`.mp4`) + matching thumbnail `.png`. Check here for the main promo cut, not the episode folder root.
- **Promos/ subfolder** — SEPARATE from YouTube/, holds several short named promo clips (`.mp4`), one per insight/angle (e.g. Ep29: "Google Maps: Reviews Over Distance", "ChatGPT's Perfect Hype Man", "Be Yourself, Not Generic", "SEO Success: From 28th to 23rd"). Each named clip = one Promo Video Caption in the output; write the caption to match THAT clip's specific angle, lead with its claim. Always check BOTH YouTube/ and Promos/.

**How to access (this profile uses the google-workspace CLI, NOT a Drive MCP):**
1. Set `GAPI="python C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py"` (absolute Windows path — `$HOME` mis-resolves in this git-bash shell).
2. Drill down with raw-query parent searches: `$GAPI drive search "'<FOLDER_ID>' in parents" --raw-query --max 50` — repeat from SI root → Episodes → episode folder → YouTube subfolder.
3. **Reading the `.docx` files:** they are uploaded Word files, NOT native Google Docs, so `drive download --export-mime text/plain` returns BINARY garbage. ⚠️ `read_file` also did NOT reliably auto-extract them this session (errored "Cannot read binary file") — do not depend on it. VERIFIED method: download the raw file (`$GAPI drive download <ID> --output /c/Users/somea/<name>.docx`) then extract with **system Python** `C:/Python313/python.exe` + `python-docx` (`docx.Document(path)`, print non-empty paragraphs). The Hermes sandbox/venv python lacks `python-docx` (`import docx` → ModuleNotFoundError). Clean up temp files when done.
   - ⚠️ **`read_file` does NOT reliably auto-extract these `.docx` files** — it returned "Cannot read binary file '...docx'. Use vision_analyze..." on Ep29 (June 2026). Do not rely on it.
   - **Working extraction method:** use `python-docx` run through **`C:/Python313/python.exe`** — that is the ONLY interpreter on this machine with the module. `python` (3.11) and the hermes venv python both raise `ModuleNotFoundError: No module named 'docx'`, and the `execute_code` sandbox uses yet another interpreter that also lacks it. Write a tiny extractor script and run it explicitly: `C:/Python313/python.exe extract.py`. Pattern:
     ```python
     import docx
     d = docx.Document(r"C:\Users\somea\file.docx")
     for p in d.paragraphs:
         if p.text.strip(): print(p.text.strip())
     ```
     Use raw Windows paths (`r"C:\Users\..."`) in the script — writing the script file to a `/c/Users/...` git-bash path can mis-resolve to `C:\c\Users\...`; write it to an absolute `C:\Users\somea\...` path instead.
   - **⚠️ LARGE TRANSCRIPT (verified Ep032, July 2026): a Transcript FINAL.docx is ~50K chars / ~480 paragraphs, which OVERFLOWS terminal output (it truncates silently).** Do NOT print the transcript straight to the terminal — you'll only see the first ~200 chars. Instead have the extractor REDIRECT to a `.txt` file (`C:/Python313/python.exe extract_tx.py > C:/Users/somea/SI0NN_transcript.txt`), then page it with `read_file` in ~160-line chunks (offset=3, then 163, 323...). Show Notes + Blog are small enough to print to terminal directly; only the transcript needs the file-dump-then-page approach. Clean up the `.txt` too.
   - Clean up the temp `.docx` and extractor scripts when done.

**Pre-written content base:** Use **Show Notes + Blog** as the approved starting point (this episode line has no captions doc). Adapt tone and format per platform; don't rewrite the core claims from scratch.

## ⛔ CAPTIONS MUST FEEL COMPLETE — beginning → build → landing, SHAPED BY THE IDEA (Joe corrected, SI Ep16, July 2026)

Joe rejected a whole set of finished captions as *"I just see do this or this. No beginning that states an advantage or states a problem then builds to its solution. Nothing about these posts feels complete, it feels just like mumbling."* The failure: the captions opened MID-ARGUMENT (\"Most of us protect our own overwhelm with one line...\") — they had a middle and a landing but NO real beginning, so the reader is dropped inside an idea they were never set up for. That reads as mumbling.

**Every caption needs a complete shape:**
1. **OPEN** — state the problem OR the promise/thing-worth-knowing, clearly, in line one, so a cold reader instantly knows what this is about and why to care.
2. **BUILD** — walk them through it (tension, the turn, the proof/example).
3. **LAND** — resolve it: the payoff, what it means, or what to do.

**The shape is NOT a template you stamp on — it comes from what the IDEA actually IS (Joe: \"built from the understanding... very organic\"):**
- **If the idea is a PROBLEM** → open ON the problem, build to the way out. (Ep16 idea 4: \"Most people stay stuck answering the same questions forever, and it's not because they're lazy...\" → the one-time price → \"the ones who pay it get their life back.\")
- **If the idea is SOMETHING WORTH KNOWING** (a fact, a reframe) → open by making that thing CLEAR, build to why it matters. (Ep16 idea 3: \"There's a number that should make your week feel lighter.\" → the BA 12 → \"write down your twelve.\" / idea 2: \"'I'm always busy' is almost impossible to fix, and here's why: it isn't a real thing.\")
- Decide each idea's nature from the Understanding's THE-IDEA + WHY-IT-MATTERS blocks; let that dictate the opening. Do NOT force all posts into one \"problem→solution\" mold — a worth-knowing idea that opens on a manufactured problem feels as wrong as a problem idea with no problem.

**The gate:** read the caption cold. Does line one tell a stranger what this is about (a problem they have, or a thing worth knowing)? Does it then build and LAND, not just list \\\"do this or this\\\"? If it opens mid-thought or trails off without resolving, it's mumbling — rewrite the opening and the landing. This is the CAPTION sibling of the poster STAGE-1..4 rules and the plain-language understanding rules: same root (a stranger with zero context must get it), applied to long-form body copy.

### ⛔ THE LANDING MUST DELIVER THE ACTUAL SOLUTION — don't dangle it, don't promo-close it (Joe corrected HARD, final rounds SI Ep16, July 2026)\nAfter the beginning→build→land shape was in place, Joe kept rejecting the LANDINGS across several rounds. Two distinct failure modes, both fatal for an EDUCATIONAL post:\n1. **The promo dangle / cliffhanger.** I kept closing with \\\"we get into how on the episode\\\" / \\\"go listen, successfulidiots.ai.\\\" Joe: *\\\"it doesn't even sell\\\"* AND (when I leaned harder into selling) *\\\"remember we are not doing promotional content.\\\"* A cliffhanger (\\\"there's a way out, and we break it down on the show\\\") is NOT curiosity — it's an unfinished thought that leaves the reader cheated, and it reads promotional. He said it plainly: *\\\"it won't be achieved by leaving them hanging, it will be achieved by creating curiosity NOT by leaving things unfinished but by getting them to want to learn more on the solution.\\\"*\n2. **All problem, no solution.** A caption that dramatizes the pain beautifully then lands on a soft reassurance (\\\"that's the real cost, worth stopping to notice\\\") FINISHES nothing — sibling of poster STAGE 4. Joe: *\\\"so what exactly is the solution or the thing you are talking about that will help with this? What was the solution that was being talked about in the episode?\\\"*\n\n**The rule for an educational caption's landing:** actually TEACH the episode's real solution, plainly and completely, so the reader leaves with a usable idea. Pull the concrete solution from the Understanding's THE-IDEA / WHY-IT-MATTERS / CONCRETE-MATERIAL blocks — it is specific, not vague (Ep16 idea 1's solution = \\\"it's the same handful of questions doing it every time; set those repeat questions up once, let a system reply, and the text never reaches the bleachers\\\"). The curiosity/pull toward the show is EARNED by the idea being genuinely good and useful, NOT by withholding it. Deliver value → they want more of that value → that is the (soft, non-promotional) pull. NO \\\"listen to the episode,\\\" NO URL in an education/entertainment batch, NO cliffhanger. End on the resolved solution itself.\n\n**Gate for the landing:** does the reader finish knowing the actual answer to the problem I opened with (or, for a reframe/insight post, do they leave with the reframe fully landed)? If the last line only PROMISES a solution exists somewhere, or points them off to the episode, it fails — replace it with the plain, specific solution the episode actually gave. Reusing Joe's own review question: *if it's demonstrating a PROBLEM, does it make me want the solution (by giving it), and if it's a SOLUTION, does it make me want to learn more (because it's good)?*

### ⛔ POSTER N MUST MATCH CAPTION N — same message, same solution, same idea-order (Joe caught it, SI Ep16, July 2026)\nWhen an idea ships as caption + paired poster, they must carry the SAME message and land the SAME solution — the poster is the visual of THAT caption, not a loosely-related card. Two concrete failures this session:\n1. **Idea-order drift.** After reordering/renaming pieces, poster 4 was the \"68%/don't-waste-time\" idea while caption 4 was the \"do-it-once\" idea — they'd swapped. Whenever you renumber or re-theme mid-build, re-verify poster N's headline+body == caption N's idea before rendering. Keep an explicit idea→(poster,caption) map.\n2. **Poster states the PROBLEM while the caption delivers the SOLUTION.** After rewriting captions to close on the solution (per the rule above), the posters still had bodies that only dramatized the problem. Joe's directive: *\"the posters should match.\"* So when the caption's landing changes, the poster's subtext/body must change too, to land the same solution (Ep16 idea 1 poster body went from \"you already missed it\" to \"set them up to answer themselves, and the text never reaches the bleachers\" — matching the caption). Poster STAGE 4 (show the solution, not just the problem) and the caption landing rule are the SAME requirement applied to the two halves of one piece — run them together, and after ANY caption-solution rewrite, re-open each poster generator block and re-land its body to match, re-render, re-QA.\n- **Re-attaching updated posters in Metricool:** if the poster CONTENT changed (not just the caption), re-upload the PNG to Cloudinary with `overwrite=True, invalidate=True` (forces Metricool to re-fetch the new bytes at schedule time — a same-`public_id` overwrite alone won't refresh an already-attached draft), then `updateScheduledPost` the `media:[newUrl]`. Full mechanics in `metricool-scheduling`.

## ⛔ LONG FORM vs SHORT FORM — the per-platform packaging Joe locked (SI Ep16, July 2026)

When Joe says "keep it long form and short form," the structure is:
- **LONG FORM = the LinkedIn copy, used VERBATIM on LinkedIn, Instagram, AND
  Facebook.** Do NOT write three different long bodies; write ONE long-form body
  (the LinkedIn one) and reuse it on IG + FB. (This overrides the older per-platform
  "IG = 3-5 short lines" spec below when Joe asks for long/short packaging.)
- **SHORT FORM = X/Twitter only.** A tight 2-3 line cut of the same idea.
So each idea ships as: one long-form body (LI = IG = FB) + one short-form (X).
Hashtags still per-platform. This is the default packaging until Joe says otherwise.

## Content Output Per Episode

Each episode should generate **at minimum 5 pieces of content**:

### 1. LinkedIn Post (Brand Account)
- **Format:** Text post, 150–250 words
- **Structure:**
  - Hook: One punchy sentence — the counterintuitive insight or surprising claim from the episode
  - 2–3 short paragraphs expanding the idea
  - CTA: "Full episode at successfulidiots.ai" or "Link in bio"
- **Tone:** Confident, practitioner-voice. Not hype. The SI brand speaks like operators, not influencers.

**Example (EP 24 — outreach specificity):**
> The difference between getting ignored and getting a reply is usually one sentence.
>
> Not the length. Not the format. Not even the timing.
>
> The sentence that tells the other person you actually understand what they do — and what they need.
>
> Joe Downs and Peter Swain broke down why "pick your brain" kills interest instantly, and why specific outreach changes the entire interaction.
>
> If you've ever wanted access to smarter people and didn't know how to ask — this episode is for you.
>
> Full episode at successfulidiots.ai

### 2. Instagram / Reel Caption
- **Format:** Short, punchy. 3–5 lines max.
- **Structure:** Hook statement + 1 expansion line + CTA + hashtags
- **Character limit:** Under 150 words
- **Hashtags:** 5–8, placed at end. Pull from this set:
  `#SuccessfulIdiots` `#EntrepreneurMindset` `#WealthMindset` `#AIBusiness` `#PassiveIncomeTruth` `#WealthBuilding` `#BusinessGrowth` `#TimeLeverage` `#AITools` `#StartupLife`

### 3. Instagram Static Post Caption
- **Format:** Slightly longer than Reel — 50–100 words
- **Goal:** Educate first, promote second
- **Structure:** Insight → 1–2 sentences of context → soft CTA

### 4. YouTube Description (if episode on YouTube)
- **Format:** 100–150 words
- **Structure:**
  - Line 1: Episode title + one-sentence hook (appears before "show more")
  - Body: What the listener will learn — 3–4 bullet points
  - CTA: Subscribe link, successfulidiots.ai, Joe's contact
  - Hashtags: 3 max at the very end

### 5. Promo Video Caption (if promo clip exists in folder)
- **Format:** Match to the clip's spoken content — don't invent angles not in the video
- **For Reel/Short promo clips:**
  - Caption must match the energy of the clip
  - Lead with the quote or claim from the clip
  - End with the listen-close CTA (see SI FOLLOW-US / listen-close bank)

#### ⛔ PROMO CAPTIONS: lift the small clip moment UP to the bigger picture, and NAME the concrete thing (Joe corrected both, SI Ep031, June 2026)
A promo clip is ONE 30-second facet of the episode. Joe rejected a first pass of
clip captions for two reasons, both of which apply to EVERY promo caption:

1. **The caption can't just restate what they SAID in the clip — it has to point
   at the BIGGER PICTURE.** Joe: *"These are mainly only about what they said,
   they don't show the bigger picture. We have talked about it."* A caption that
   stops at the clip's anecdote leaves the viewer with a tactic and no stakes.
   The fix is a 3-beat shape: **(a) open with the clip's concrete moment → (b)
   lift it to the episode's through-line → (c) close on the listen.** For Ep031
   the through-line is the locked / always-open front door (*your door is shut
   whenever you can't pick up; AI keeps it open 24/7; owners who set it up now
   pull ahead*). Every clip — the $800 missed call, the 5x10 vs upsell, "AI
   lies," the outbound text — is a facet of THAT, so each caption must tie back
   to it, not just narrate the clip. Pull the through-line straight from the
   episode's Understanding "bigger picture" block; don't invent a new one.

2. **Don't be VAGUE — name the concrete thing from the episode.** Joe killed
   "This one front desk recommends the smaller unit and saves the customer money"
   as vague ("we also talked about being vague"). The episode HAS the specifics:
   it upsells the **10x10**, the AI puts them in a **5x10**, saving **~$9–$12 a
   month**, *because it remembers every question the business has ever been
   asked*. Use the real numbers, the real unit sizes, the real sandwich-shop
   text ("ordered the same thing five days running, want it ready for 11:30?"),
   the real 25% figure — pulled from the Understanding's "concrete material
   (verified)" line. "This one front desk / saves money / a small thing" = the
   vague failure. The concrete scene is what makes a promo caption land.

This applies to the MAIN cut and EVERY short clip. Run both checks before
handing over: *(1) does this lift to the through-line, or just retell the clip?
(2) did I name the real specific, or write a vague gesture?*

## ⛔ NOT EVERY POST IS PROMOTIONAL — vary the JOB across the batch (Joe corrected, SI Ep016, July 2026)

Joe: *"not every post is promotional, some are educative and some might be entertaining, so don't let all the posts read as promotional."* A feed where every SI piece ends by driving to the episode reads like an ad wall and gets tuned out. This governs the CTA section below: the listen-close is NOT mandatory on every piece.

- **Decide each piece's JOB before writing it:** EDUCATE (teach one useful thing the reader keeps even if they never click — no ask), ENTERTAIN (a sharp observation / dry-humor line that earns attention on its own), or PROMOTE (the piece that actually drives the listen).
- **Mix the modes across an episode's batch.** Most pieces should educate or entertain and EARN the audience; only some carry the listen-close. If every caption in the set ends with "successfulidiots.ai," rebalance — flip some to pure value with a soft or no close.
- **Match the close to the job:** educative/entertaining pieces close soft or not at all (the value IS the point); save the full listen-close (below) for the promotional pieces and the promo announcement.
- Full cross-brand rule: `writing-craft` Rule 9. This does not weaken the funnel — a feed that gives before it asks earns the right to ask.

## ⛔ X / SHORT-FORM CAPTIONS: message-first, no fluff, no hashtags (Joe corrected, Ep016 July 2026)
When Joe asks for the X versions, keep them TIGHT: state the message and make it easy to get in one read. Cut setup, cut the wind-up, cut the second example. Two short beats is plenty (hook line → the point). NO hashtags on X even when the LinkedIn/FB versions carry a hashtag block (X copy stays clean; a long tag list also pushes it over the limit). Target well under 280 (the Ep016 set landed 160–180 chars, not 210–280). Joe: "dont put a lot of fluff, we need the message and we need it easy to understand." Verify each is ≤280 before handing over, but shorter-and-clearer beats maxing the limit.

## ⛔ SCHEDULING/DERIVING FROM SCHEDULED POSTS: read what's ACTUALLY on Metricool, not your draft file (Joe corrected HARD, Ep016 July 2026)
When asked for "the X version of the ones scheduled" (or to edit/derive anything from posts already on the planner), PULL THE LIVE POSTS FIRST with getScheduledPosts and work from THAT text — do NOT regenerate from your local captions file or from memory of what you scheduled. Joe: "look at the ones that are there not the ones you think should be there." Two things drift between your draft and the live planner: (a) the SLOT LINEUP changes — Joe swapped idea 7 into a 12:40 slot, so the 5 live posts were 7/2/3/4/5, NOT 1-5 as my file assumed; (b) Joe EDITS captions himself in the planner (added hashtags, tweaked lines like "you are always playing defense... some offense", "on your desk", "Here's a number"). Deriving from your stale file silently discards his edits and mislabels the lineup. Always: getScheduledPosts → read each post's real `text` + `publicationDate` → derive from those. Same rule for any "update/tweak the scheduled ones" ask.

## SI FOLLOW-US CTA bank — borrow the joe-cta STYLE, swap the destination (Joe directive, Ep031, June 2026)

⚠️ **CTA EVOLVED MID-EP031 — the working standard is now "drive a podcast LISTEN," not "follow us."** Joe first asked to "borrow the CTA style to get people to follow us," but by the end of the session he explicitly redirected: *"update the CTA to get people to listen to the podcast more."* So the DEFAULT close now drives a LISTEN with a **reason + a payoff about what the reader gets/becomes** — not a follow ask, and never selling the show. Use the follow-tail bank below ONLY when Joe specifically asks for a follow push; otherwise use the listen-close pattern.

**LISTEN-CLOSE pattern (the current default, Joe-approved Ep031):** point at the full episode as where the reader gets the thing they want, varied per post, alternate warm/normal down the batch, never "we get into it on the podcast" (he rejected that as flat/generic):
- Lead the close with the PAYOFF, then the episode: *"The full episode is where we show you how to put a number on it and close the leak. Worth the listen if you've ever wondered how much you're quietly leaving on the table. successfulidiots.ai"*
- Other approved Ep031 closes: *"...how to be there without being there. Give it a listen this week."* / *"Hear how it actually works on the full episode."* / *"...where we work out what that means for a business like yours."*
- Vary the verb ("Worth the listen" / "Give it a listen" / "Hear how on the full episode") so a feed of 8 doesn't repeat. X stays tight: `Full episode this week. successfulidiots.ai`.
- ⛔ Still TRUE to what the show IS and speaks to the READER's growth, never sells the show (see the toolkit/human-voice section). The close lands on the reader's next state, the episode is named plainly as where that happens.

**FOLLOW-tail bank (use ONLY when Joe asks for a follow push):** borrow the **craft** from `joe-cta` (warm, ONE concrete action, names what they get, closes confidently — never salesy) but destination = follow the SI brand + the full episode, NOT Storage 101 (that's Joe's personal-funnel CTA; never mix it into SI brand posts):
- **Instagram (reel + static):** `Follow @successful__idiots so the next one finds you. Full episode at successfulidiots.ai.` (handle has a DOUBLE underscore.)
- **LinkedIn (brand):** `Follow Successful Idiots so the next one finds you. Full episode at successfulidiots.ai.`
- **Facebook:** `Follow Successful Idiots so the next one finds you. Full episode at successfulidiots.ai.`
- **X / Twitter:** `Ep NN. Follow + full episode at successfulidiots.ai` (X stays static; keep it tight).
- **YouTube description:** `Follow Successful Idiots and subscribe so the next episode finds you. Full show at successfulidiots.ai.`
Keep it to ONE clear ask + the URL; no hype words; warm close. The "so the next one finds you" framing is the warm-invite move borrowed from joe-cta, recast for a follow instead of a registration.

## 📣 PROMOTIONAL episode-announcement post (Joe asks for this alongside the episode set — Ep031, June 2026)

When the episode ships on a known day, Joe wants a **promo announcement** post (all 4 platforms) on top of the per-idea content: \"this episode ships Sunday, we also need a promotional one.\" Build it the SAME way the SM skill builds its episode promo — the promo poster must **SELL THE SPECIFIC EPISODE, not be a generic teaser**:
- **Poster** (worked SI example: the `SI_Ep031_promo` builder in `C:\\Users\\somea\\BrandAssets\\_scripts\\gen_si_ep031.js`): masthead `SUCCESSFUL IDIOTS. / The Podcast`; a green `NEW EPISODE · [day]` pill with a live-dot; `On the Successful Idiots Podcast`; the real episode **title** as the yellow-accent hero; **both hosts** as monogram circles (J / P + \"Joe Downs & Peter Swain · Two operators using AI to run their businesses better\") — use monograms, never fake a photo likeness; the strongest **one-line hook** (Ep031 = the missed-call cost); an **\"Inside this episode\"** chip strip of the real topics; footer `successfulidiots.ai`. Same SI navy/yellow/green spine, render + vision-QA + copy to Downloads like every other poster.
- **Caption** uses the corrected CTA standard (see the SM skill's \"CAPTION CTA\" — it now governs ALL brands): the FOLLOW beat is a REASON not an instruction (\"New episode drops [day]\" — never \"follow us so…\"), and the close is a curiosity beat that pays off at what the viewer actually wants (\"if you've ever wondered whether this is within reach for a business your size, this is the one\"), then the site. The **episode pointer lives in the CAPTION** (\"drops Sunday\" → switch to \"is live today\" on release day), NEVER baked into the poster art. Joe mixes in the Promos-folder video clips himself.

## Extracting Multiple Topics Per Episode

Each episode typically contains **3–5 extractable insight angles** beyond what's in the pre-written captions doc. After reading the transcript, identify:

1. **The counterintuitive claim** — the thing that surprises people
2. **The practical how-to** — one specific actionable thing from the episode
3. **The mindset reframe** — a belief the hosts challenge or flip
4. **The business principle** — something applicable beyond storage/AI
5. **The quotable moment** — a sentence either host said that stands alone

Each of these can become a standalone post across different platforms or scheduling slots. The pre-written posts typically cover 1–2 of these. Extract the rest from the transcript.

## Narrative copy strategy — the quality bar (Joe directive, June 2026)

Joe flagged Ep030's first-pass copy as "not up to standard": it didn't extract
enough from the episode AND it read like a standard post. The fix is **narrative
strategy** — use the *mechanics* of storytelling (NOT literal stories) so the
reader glides through with low mental effort. Levers: (1) open loop in line 1,
(2) one concrete protagonist + specific object/moment ("a squeaky $500 chair",
not "email marketing"), (3) tension → turn → often-UNEXPECTED payoff, (4) short
fluent one-idea lines, (5) close on a reframe not a generic CTA.

**Brand-voice precedence:** keep SI's voice while doing this (SI's contrarian
practitioner voice is already narrative-friendly). ONLY fall back to Joe's
personal voice if the narrative genuinely can't hold in SI voice — that's the
exception, not the default. Banned-phrase list still applies.

Full method, the 5 levers, two worked SI Ep030 examples (squeaky chair +
cappuccino), and the copy-style↔visual-style pairing rule:
→ `references/narrative-copy-strategy.md`. Apply this bar to every SI post.

### ⛔ Narrative principles are a TOOLKIT, not a story mold — and write in HUMAN voice (Joe corrected HARD, SI Ep031, June 2026)
Three corrections from a long Ep031 redo. All three are detailed (with the
rejected-vs-accepted lines) in `references/plain-language-rules.md` — read it
before writing copy:
1. **TOOLKIT, not a story every time.** \"Use narrative principles\" ≠ stage a
   scene for every post. I wrote a truck-in-the-driveway mini-story for ALL four
   platforms; Joe: *\"you just literally created stories for the posts.\"* The
   mechanics (curiosity gap, concrete-over-abstract, show-don't-tell, tension→
   turn) are tools you pick PER POST — most use ONE, some none. A blunt one-liner
   with a number, a contrarian reframe, or a plain observation are all valid.
   Make the platforms in one set use DIFFERENT mechanics. Never drop a
   half-staged character into a post that didn't set up the scene (it confuses).
2. **HUMAN voice, not marketing cadence.** Joe rejected line after line as
   \"shallow and not human-like.\" The tell = performing insight in tidy balanced
   copywriter beats (\"the loss is invisible, so most owners never fix it\"). The
   gold standard is Joe's own LinkedIn voice: SHORT, declarative, UNEVEN rhythm,
   states facts flatly and TRUSTS them, no performed insight. ⚠️ And KNOW WHAT A
   WORD MEANS before using it — Joe caught \"the phone rang out\" (\"rang out\" =
   a sound ringing out like a bell, NOT a call going unanswered). Don't grab a
   a phrase by its vibe; check it literally means what you need. This is the root
   of the "shallow vocabulary" complaint.

   ⛔ **INFER an insider/contextual reference into a universal one — don't lift it raw (Joe corrected, SI Ep031 idea 8, June 2026).** A host often uses local shorthand the audience can't decode. Peter said customers "just want to know if you're on 48th and 5th or 48th and 6th" — to him that means *which street corner are you on* (Manhattan cross-streets), but dropped into a post/poster raw, "48th and 5th" is a cryptic code to everyone else. Joe: *"you did not INFER what 48th and 5th meant, you just used the direct words which for other people would not make sense."* Fix: work out what the reference MEANS to a stranger and write THAT — a plain universal version ("which corner are you on, are you open Sunday, do you have my size"). **This applies to the VISUAL too, not just the caption** — Joe flagged "including the photo": if the poster carries the same insider line, redo the poster, re-render, and vision-QA that the cryptic reference is gone. Sibling rule to the "rang out" lesson: one is about a word's literal meaning, this is about a reference's shared context — both fail the same way (sounds fine to you, opaque to the reader).
3. **CTA speaks to the READER's growth, never sells the show.** Joe: *\"we are
   not trying to sell them the show, but what they could BE when they listen, or
   how they could grow, without sounding like sales.\"* Close on the reader's
   next state (\"once you can see this leak, it's one of the easier ones to fix\"),
   name the podcast plainly + quietly as where that happens (\"We show you how on
   the podcast. successfulidiots.ai\"), no push verbs. And keep the CTA TRUE to
   what the show IS — Joe killed an invented mission line; the real definition is
   his own open: *\"a couple of successful idiots using AI to simplify our lives
   and optimize our businesses.\"*

**Root cause of the whole Ep031 grind (name it to stop it):** I wrote lines that
SOUNDED right before checking they were TRUE — to the episode, to the show, to
what a word means. Fix = check the claim against the source BEFORE writing it.
When the user grinds through \"still not there,\" stop guessing, RESEARCH the
actual craft, and anchor voice to a REAL sample they call good.

## ⛔ PROCESS SOURCE INTO UNDERSTANDING — never stitch transcript fragments into posts (Joe corrected this HARD, 3 rounds, June 2026)

The richness lives in the Drive docs, BUT the failure mode is lifting spoken phrases out of the transcript/captions and gluing them into headlines/captions. Spoken words were never built to be copy — dropped in raw they sound cheap, washed-out, "like a three-year-old wrote it" (Joe's words). This is a PROCESS mistake, not a wording mistake.

**The required method:**
1. Read transcript + show notes + blog → **process them into UNDERSTANDING** (what actually happened, what it MEANS), not a quote bank.
2. Write FROM that understanding in clean SI brand voice — do NOT recycle their spoken phrases.
3. Quote a real line ONLY when it is genuinely strong standing alone. If paraphrasing a line cheapens it, don't paraphrase — write fresh from the insight. Never invent facts not in the source.
4. **The intuitive leap that makes copy land:** when a setup line is good (e.g. "He automated one email to save time"), do NOT ask "what words come next in the transcript." Ask **"what did that thing actually DO / what was the real consequence beyond the obvious?"** then write THAT. (Ep030: the email saved time, yes — but the real payoff was the headspace it gave back, which is where his next product idea came from. Write the consequence, in your voice, not his sentence.)
5. **Headlines: open ONE clean loop; let the BODY deliver the turn.** Don't cram setup + payoff into the headline (forces choppy fragments). Full sentences with real cadence beat two stub-fragments glued by a period. Concrete noun/image beats abstract claim ("brain back" = vague slang; the cappuccino / the quiet / the idea that arrived = concrete).

**Narrative strategy (Joe's term):** NOT literal storytelling — it's using storytelling MECHANICS (open loop / Zeigarnik, one concrete protagonist or object, tension→turn→payoff, short fluent lines) to lower the reader's mental effort so they glide through. SI brand voice already supports it — keep SI voice; only fall back to Joe's personal voice if a narrative angle forces warmth/teaching that breaks SI's edge.

## Tone Rules — SI Brand Voice

- **Direct.** No warm-up. No corporate framing.
- **Self-aware.** The brand name is "Successful Idiots" — the voice carries a knowing confidence, not arrogance.
- **Accessible.** Smart concepts explained without jargon. If it needs a glossary, rewrite it.
- **Not hype.** No "this will change your life." No "you need to hear this." Let the idea do the work.
- **Practitioner-first.** Joe and Peter are operators and investors — not coaches. The voice comes from doing, not teaching.

**Phrases to NEVER use:**
- "Unlock your potential"
- "Level up"
- "This is gold"
- "Game changer"
- "You won't believe"
- "Let's be honest"

## HARD RULE — Attribute correctly, never fabricate

Brand posts speak AS the SI brand and often reference the hosts in third person ("Joe and Peter broke down…"). That third-person framing is safe. The trap is when extracting angles or writing posts that imply a host personally experienced something they didn't.

- **Only attribute a result/story/number to the host who actually said it in the transcript.** If Peter reports a $30K result or a specific email experiment, that is *Peter's* — never reassign it to Joe, and never invent a host anecdote that isn't in the source.
- **The "ADDITIONAL ANGLES" you hand to `joe-from-podcasts` must carry their true owner.** Tag each angle with whose insight/experience it is (e.g. "Peter's daily-email result" vs. "Joe's observation"). Joe's personal-feed skill will write in first person, so it depends on this skill telling it honestly which experiences are Joe's and which are borrowed. Mislabeling here causes a fabricated first-person post downstream.
- Plausible ≠ true. If a detail isn't in the transcript/notes, don't manufacture it to make a post land.

## 🧭 THE UNDERSTANDING IS A WORKING BUILD-KIT, not a frozen summary (Joe corrected, SI Ep031, June 2026)

Two corrections about what the understanding layer IS and how it's structured:

1. **It stays STRUCTURED — it is NOT story-shaped.** The understanding is digested, factual, point-by-point. The narrative craft (scenes, hooks, show-don't-tell) belongs in the POSTS, not the understanding. I wrote a staged story-scene as an "understanding" point and Joe rejected it: *"The style was not meant for the understanding, it was meant for the content. The understanding has to stay structured."*

2. **It is a WORKING LAYER you keep open and re-check against the source — NOT a one-time extract.** Joe: *"don't place the hard rule on never looking back; when you need to look at the data again, look at the data again. The understanding is supposed to help you WHILE you write — a combination, not a quick summary."* So: re-open the transcript/show-notes/blog whenever you need a fact, an exact line, or more context while writing. The understanding accelerates; it never replaces the source.

3. **It GEARS toward the bigger picture.** Joe: *"it always should gear up toward the bigger picture."* Lead the understanding with the episode's THROUGH-LINE (the single argument the whole conversation makes), then frame each idea as one facet of it — so every post reinforces the same core message instead of reading as N disconnected facts. (Ep031 through-line: *your business has a front door that's locked whenever you can't pick up; AI keeps it open 24/7, and even turns it from answering into selling; owners who set it up now pull ahead.*)

**STRUCTURE EACH IDEA AS A BUILD-KIT** (this is what makes writing posts clean + accurate — derived by working backward from what a post needs):
- **THE IDEA (plain):** the one true thing, stated to the plain-language bar (see `references/plain-language-rules.md`).
- **WHY IT MATTERS:** the consequence — so a post has a point to land, not just a fact.
- **CONCRETE MATERIAL (verified):** the specific moments / numbers / names / quotable lines from the episode a post can be *built* from. This is what lets copy SHOW instead of TELL.
- **ATTRIBUTION:** locked per fact (whose story/number it is), so first-person/brand posts never misassign.
- **ANGLE / HOOK:** the tension or surprise that makes it worth a post.
A worked example lives at `C:\Users\somea\BrandAssets\Successful-Idiots\SI_Ep031_understanding.txt` (bigger-picture thread + 8 build-kit ideas).

## 🚨🚨 THE REPEAT FAILURE — I have the rules and IGNORE them under my own draft momentum (Joe, SI Ep032, July 2026)

Read this FIRST, every SI batch. Joe's exact words after Ep032: *"We had discussed use of words and leaving nothing to guess, we discussed the problem solution, we discussed variation, yet you do the same thing with the content over and over again... you keep saying I am right and you repeat the same thing in the next session."* This is the #1 problem with this skill and it is NOT a missing rule — every rule below already existed and I skimmed past all of them, shipped the same failures (same caption shape on all 8; "not X, it's Y" antithesis; rule-of-three; "get your focus back FROM your inbox" clever labels; problem-led not benefit-led), then said "you're right" and did it again next session. Acknowledgement without a forcing function = the loop.

**THE FORCING FUNCTION — do this, produce the EVIDENCE, before ANY caption/headline reaches Joe. Not a claim that you did it — the actual filled-in table.**

For EVERY caption (long + short) and EVERY poster headline, before handing over, write out this micro-audit and SHOW it:

| # | opener (first 6 words) | mechanic used | AI-tell scan result |
|---|---|---|---|

- **opener column** — if two pieces in the batch share the same opening MOVE (e.g. a confront-hook "Stop X." / "Be honest about Y." / "You think X. It isn't."), that's the reskin-one-template failure. VARY it: some open on a plain problem, some on a fact, some on a scene, some flat declarative. No two pieces may share the same opener shape.
- **mechanic column** — name the ONE narrative mechanic (curiosity gap / concrete scene / contrarian reframe / blunt number / plain observation / none). If the same mechanic repeats across the batch, rewrite until they differ. "TOOLKIT not a mold."
- **AI-tell scan column** — scan each piece literally for: (a) "not X, it's Y" / "isn't X, it's Y" antithesis flip; (b) rule-of-three; (c) "-ing" tails; (d) signpost ("here's the fix", "the real question"); (e) tacked-on fragment ("Without the dread." / "In one piece."); (f) any clever LABEL a stranger must decode ("from your inbox", "the rate", "on offense"); (g) em/en dash. Write "clean" or name the exact tell found. If any tell is found, FIX before the table ships.

Then the 4 poster stages (plain → benefit → sound → solution) and the caption shape (open→build→LAND on the real solution) still apply on top. But the table above is the thing I keep skipping — it is NOT optional and its filled-in result goes in front of Joe WITH the pieces.

**Why this exists:** the rules are necessary but I demonstrably don't obey prose rules under draft momentum. A table I must fill and display forces the line-by-line read I keep skipping. If Joe is reading this because I failed AGAIN, the fix is not another paragraph — it is that I did not actually fill this table honestly. Fill it. Show it. Every time. (Ep032 sequel lessons — caption OPENER must be the deeper point phrased as one forward step; NAME the host in context; SI schedules to LI+FB only — live in `references/caption-opener-and-scheduling-ep032.md`.)

## 🔒 WRITING-CRAFT GATE — run BEFORE the humanizer (non-negotiable)

Apply the **`writing-craft`** skill to every piece and every platform variant before the humanizer pass. This is basic written-English correctness, separate from voice and from de-AI, and it is the exact class of issue Joe kept catching in SI content (mis-paraphrase, wrong/invented words, fragments lifted from the transcript that don't parse): infer meaning when a lifted phrase isn't clear standing alone (the "the 46th" → "they just want your address" rule — don't transcribe unclear spoken fragments verbatim), never stitch words that don't parse cold, use the correct word, paraphrase faithfully. Read each line with zero context — if it doesn't make clean correct sense, rewrite it. Then proceed to the humanizer gate.

## 🔒 HUMANIZER GATE — run on EVERY piece before output (non-negotiable)

Joe's standing rule (June 2026, enforced across multiple skills): **every caption/post gets a humanizer pass before it reaches him — and the short forms / captions are the repeat failure** because they get treated as "just trim the long one" and keep stiff AI connective tissue. (This skill already preaches HUMAN voice in the narrative section; this gate makes it a non-skippable final step for ALL variants, short forms included.)

- Load/apply the **`humanizer`** skill on the LinkedIn post AND every platform variant (IG/Reel/static/YouTube/promo caption).
- **Literal dash scan first:** ZERO em dashes `—` or en dashes `–` in the final copy. Joe treats a stray dash as proof the pass didn't happen. Replace with a period, comma, or two sentences.
- Kill the usual tells: "It's not just X, it's Y", rule-of-three, "-ing" tails, signposting, filler, copula-avoidance.
- **Read each short form aloud in your head — does it sound like a real person, not a marketer?** If it sounds assembled, rewrite before saving.
- State honestly what you scanned for. Never claim you humanized it if you didn't actually scan.

## Output Format

Lead with an UNDERSTANDING layer, THEN the posts. (Joe redo-test June 2026:
processing the episode into digested *knowledge* first — the ideas + their
meaning + locked host attribution, NOT a quote bank — is what makes the copy
read like an adult who understood the episode. Show this step; write every post
from it.)

⛔ **WRITE THE UNDERSTANDING IN PLAIN LANGUAGE, AND SHOW IT FIRST — get Joe's read
BEFORE writing posts or building visuals (Joe corrected HARD, SI Ep031, June
2026).** Two failures in one session: (1) I jumped straight to posts + posters
without leading with the understanding — wrong; present the understanding,
let Joe approve/adjust it, THEN move to visuals/copy. (2) When I did write the
understanding, I phrased ideas as clever *labels* ("the middle disappears,"
"the survivors change what they are") instead of plain *explanations*. Joe
rejected it four times: *"what does this even mean? We need things that are
actually clear. Understanding, not copy and pasting"* and *"a way to phrase it
that is super clear that anyone glancing over it would go 'I think I
understand'."* The understanding doc is FOR a human to grasp at a glance — it
must follow plain-language rules (one idea per sentence, subject-verb-object
close, simplest word, concrete-before-abstract, glance test). Full rule set +
the rejected-vs-accepted Ep031 idea-6 rewrites + the pre-handover checklist:
`references/plain-language-rules.md`. Read it before writing any understanding.

```
---
EPISODE: [Number + Title]
SOURCE DOCUMENT: [Google Drive link]

UNDERSTANDING (digested ideas, not quotes):
[6–8 numbered insights — what happened + what it MEANS. End with a
 host-attribution line: which results/stories/numbers are Peter's vs Joe's.]

POST 1 — LinkedIn (Brand Account)
[Full post text]

POST 2 — Instagram Reel Caption
[Caption + hashtags]

POST 3 — Instagram Static Caption
[Caption]

POST 4 — YouTube Description
[Description]

POST 5 — Promo Video Caption
[Caption — or note "No promo clip found in folder"]

---
ADDITIONAL ANGLES EXTRACTED FROM TRANSCRIPT:
[List 2–3 additional topic angles with a one-line hook for each — for future posts or Joe's personal feed via joe-from-podcasts skill]
```

## Maintenance Notes

- When a new episode folder appears in Drive, trigger this skill to process it immediately
- Track which episodes have been processed — add to the Social Media Worksheet
- **Tracking in a formatted Google Sheet:** when Joe wants the episode's content tracked in a Sheet "formatted nicely and categorically, easy to understand," the google-workspace CLI has NO formatting commands — drive the Sheets API directly with the saved OAuth token (color bands grouped by IDEA, frozen header, status dropdown, a plain-English Guide tab). Full verified recipe + the two pitfalls (can't freeze a column that's part of a merged cell; browser can't preview the sheet): `references/formatted-sheets-tracker.md`. Reusable across all of Joe's brands.
- If Canva graphic links are in the episode folder, include them alongside the relevant post in the output
- SI and Storage Moguls are separate brands — never cross-post SI content to SM accounts or vice versa without explicit instruction

---
*Sources: Successful Idiots Drive Folder (Gisele Nzugu), SI Social Media Optimization Strategy, EP24 and EP25 captions docs*
*Skill created: June 2026*
