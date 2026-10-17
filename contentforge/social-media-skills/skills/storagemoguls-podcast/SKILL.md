---
name: storagemoguls-podcast
description: Generate ready-to-publish content for the Storage Moguls BRAND accounts (LinkedIn, Instagram, YouTube, Facebook) from podcast episodes in Google Drive. Trigger when asked to "generate posts for Storage Moguls podcast episode X", "process the new SM podcast episode", "write captions for the SM promo video", "create content for the SM podcast brand accounts", or "what posts do we need for this Storage Moguls episode?". Processes the episode's Captions/Posts doc and Transcript, cross-references Notion Moguls Operations Hub, adapts pre-written posts per platform, and extracts additional angles. Episode-specific brand content only — NOT Joe's personal page (use joe-from-podcasts), NOT Successful Idiots (use successfulidiots-podcast), and NOT broad SM education/promo posts (use linkedin-posts).
---

# Storage Moguls Podcast Content Generator

Processes Storage Moguls podcast episodes from Google Drive and generates ready-to-publish content for the **Storage Moguls brand accounts** (LinkedIn, Instagram, YouTube, Facebook). Also handles promo video captions when clips are present in the episode folder.

This skill generates content FOR the SM brand — not for Joe's personal LinkedIn. Joe's personal content drawn from SM podcast insights is handled by the `joe-from-podcasts` skill.

## ⛔ TWO DISTINCT CONTENT LANES — PROMOTIONAL vs EDUCATIONAL (Joe locked, Ep04 July 2026)

An episode feeds TWO different kinds of content and Joe wants them kept clearly separate. Ask which lane before building — do not assume promo.

- **PROMOTIONAL** — SELLS/teases the episode. Names the guest + hook, points to "watch it / storagemoguls.ai / drops Tuesday." The promo-video HOOK-WRAP format (real `/Promos` clip + hook card + CTA outro) and the "new episode drops Tuesday" promo poster live here. Use ONLY when Joe asks for promotion.
- **EDUCATIONAL** — TEACHES a self-contained lesson pulled from the episode's Understanding. Each piece stands alone and makes the reader smarter about storage even if they never touch the episode. NO episode-selling, NO "watch the episode," NO hook-card. The episode is the *source of the lesson*, not the thing being sold. Joe's ask (Ep04): *"I am not looking for promotional content right now, I am looking for educative content from this episode."*

When Joe asks for EDUCATIONAL content, do NOT reach for the promo video format or the promo poster. Build lightweight teaching posters + plain-voice captions instead. Both live in `brand-poster-design` → `references/sm-educational-poster.md`:
- **POSTER look:** light editorial (cream field, Fraunces headline, one lesson per poster, "STORAGE 101" corner tag, generous whitespace, center the block to avoid a dead-band; "lightweight, easy on the eyes, attractive, keeping the brand rules").
- **NAME THE SUBJECT EXPLICITLY:** "self-storage investing," never bare "storage" (Joe Ep04: *"What storage? Investment should be the self-storage investment."*). Applies to headline, kicker AND caption — educational content hits cold strangers with zero context.
- **CAPTION voice = the Storage 100 Picture Guide** (`C:\Users\somea\sm_tx_work\ebook\Storage100_Picture_Guide_v2_swap5.html`): plain, warm, FIRST-person Joe; one idea per line; zero jargon (or defined in the same breath); concrete over abstract; commercial-RE not residential-landlord framing; close = the warm free Monday-night **Storage 101** call at storagemoguls.ai (joe-cta principle), NOT the promo "new episodes every Tuesday" funnel.
Still obey message-first + writing-craft + humanizer gates. Educational pieces TEACH; they do NOT carry a promo funnel CTA on the art (footer stays the brand sign-off + storagemoguls.ai).

## 🧱 CONTENT STRUCTURE — IDEA → PLATFORM → TYPE (Joe locked, June 2026, ALL brands)

Produce episode content by the locked hierarchy (full spec in `brand-knowledge-hub` → "CONTENT STRUCTURE"):
**IDEA / story → PLATFORM → TYPE (poster/reel/carousel/story/static/video/description/thread) → CONTENT + VISUAL paired.**
- Pull the episode's SEVERAL distinct ideas from the Understanding, then for EACH idea choose the platform + type mix that FITS that idea — do NOT apply a fixed template. Do NOT re-skin one idea into many near-identical pieces (repetition, not range).
- Platform/type is IDEA-DRIVEN (Joe, June 2026): a Promo-folder video might carry one idea across all platforms; a simple idea might be just a single IG poster, a FB video, or a one-line X punchline; only a rich sequential idea warrants a carousel. Not every idea gets every platform or a carousel. Match the vehicle to the message.
- When an idea DOES get a carousel, build EVERY slide. Multiple captions of one type stay under the same idea.
- File each piece into Content Pieces with `Idea / Angle` + `Type` + `Platform` + `Brand` + `Account`, grouped under one Content Library campaign.
- Present to Joe ONE PIECE PER MESSAGE: content + its visual together, as he'd post it, then wait for "next".
- ⛔ **Deliver media/links as a BARE line — never wrap the path or URL in markdown.** Joe couldn't click the posters because I wrote `**MEDIA:...**` / put backticks around paths (Ep11). The delivery line must be exactly `MEDIA:<absolute path>` with NOTHING around it (no `**`, no backticks, no parens). Same for a YouTube/watch URL in a caption — paste it raw so it's clickable.

### ⛔ WORK & PRESENT ONE IDEA AT A TIME, ACROSS ALL PLATFORMS (Joe corrected HARD, Ep08 June 2026)
Joe locked the *sequencing* of the IDEA→PLATFORM model, separate from the pairing rule:
- **Finish ALL platform pieces for idea #1 (LinkedIn + Instagram + X + Facebook) before touching idea #2.** Do not interleave ideas. He stopped a session twice with *"why are you doing another idea — remember it's one idea at a time for all platforms."* When presenting, the whole set you show in sequence is ONE idea's platforms; only move to the next idea after he approves the current one.
- **EVERY piece's caption AND visual must be the SAME idea.** Do NOT grab a different idea's already-filed Notion caption to fill a platform slot — that mismatches copy and visual. If the filed Notion post for that slot belongs to a different idea, WRITE a fresh caption on the current idea instead of reusing the mismatched one. (Hit this exactly on Ep08: the filed IG Reel caption was "self-disqualification" while the built reel was "first-timer advantage" — wrong pairing.)
- When Joe says *"continue for the rest of the ideas, flow with the pipeline, I'll check in Metricool"* he means: stop the per-piece show-and-wait, run each remaining idea end-to-end (build visuals all platforms → captions → render → upload → route to Metricool drafts), and let him review in the tool. Don't keep pausing for approval once he's released you to the pipeline.

### ⛔ REBUILD a stale/mismatched existing visual — do NOT reuse it (Joe, Ep08 June 2026)
When an episode already has a filed visual but it doesn't match the *current* post's idea (e.g. an old "$800K→$1.4M operations" poster attached to a lender-psychology post), Joe's directive is **"redo it, don't reuse it — we changed how we do things."** Check STEP 0 for existing work, but a mismatched or off-idea asset is a gap to FILL with a fresh build, not approved work to preserve. Reuse only when the existing asset genuinely matches the idea on the slot.

### Metricool routing for SM (verified Ep08, June 2026; scheduling recipe verified Ep10, July 2026)
SM Metricool brand `6425193` has ONLY **LinkedIn + Instagram + Facebook** connected — **no X/Twitter**. So SM podcast content routes to those 3 in Metricool; still BUILD + upload the X (16:9) asset to Cloudinary so it's ready, but it can't be scheduled until X is connected — say so rather than silently dropping the X piece. Schedule as `draft:true` and verify each returned `media[]` is a `static.metricool.com/...` URL (Metricool rehosts the Cloudinary bytes).

**⛔ Same-session scheduling DOES work once the MCP is enabled** — the Ep04 note said "enable + restart in a SEPARATE session." That's only half true: the MCP loads at STARTUP, so if `mcp_servers.metricool.enabled` was already `true` when the session began, the `mcp_metricool_*` tools are live and you schedule right there. If it was `false`, `hermes config set mcp_servers.metricool.enabled true` then the user restarts / opens a new chat and it's live. Either way, once the tools are present, do NOT keep insisting the user restart — just call `getBrandSettings` to confirm they loaded and proceed. (Verified Ep10: enabled in a prior turn, tools were live the next turn, all 12 posts scheduled in-session.)

**⛔ Exact arg-format quirks that cost failed calls (Ep10) — get these right the first time:**
- `createScheduledPost` top-level `date` MUST carry a timezone offset or it errors `could not be parsed at index 19`. Use the real ET offset for the date: **`-04:00` in EDT (Mar–Nov), `-05:00` in EST (Nov–Mar).** e.g. `2026-07-03T12:00:00-04:00`. The nested `info.publicationDate` stays offset-free with `"timezone":"America/New_York"`.
- `getScheduledPosts` uses **`brandId`** (NOT `blogId` — `blogId` fails schema validation) and its `fromDate`/`toDate` ALSO need the offset.
- `createScheduledPost` takes **NO `user_intent` arg** (breaks schema) — already in memory, restated here.
- Full worked call shapes (LI/IG/FB info blocks, the final collision-sweep call) in `references/metricool-scheduling.md`.

## 📣 CAPTION CTA + FUNNEL — the friction-free road map (Joe corrected HARD, Ep09 June 2026, ALL SM brand captions)

Joe's north-star for SM brand posts, stated explicitly: **remove every bit of mental friction, get people to FOLLOW us, and funnel them to the storagemoguls.ai community. "We always need to make that road map very clear."** A caption that only says "full episode on the YouTube" is INCOMPLETE — he rejected the whole Ep09 batch for missing the warm community invite. Every SM brand caption must close with the two-step road map:

1. **The easy step (page growth, zero friction):** state the RELEASE RHYTHM so the follow is self-motivated — `New episodes every Tuesday.` / `We do this every Tuesday.` ⛔ Do NOT write the literal instruction `Follow Storage Moguls so it lands in your feed` / `Follow us so you catch it` — those EXACT phrasings are BANNED (Joe rejected them Ep09 AND again Ep04). The follow ask is non-optional (page growth is an explicit goal) but it must be a standing invitation via the rhythm, never a "follow us so…" command. (See the REFINED CTA PHRASING rule #1 below — this top line used to show the banned wording as the model and led a later session straight back into the error.)
2. **The deeper step (the funnel):** a WARM invite to the community, e.g. `when you're ready to find your own first deal, that's exactly what storagemoguls.ai is for`. Warm and earned, never salesy — tie it to the reader's own next deal, not a hard pitch.

Weave both NATURALLY into the close (two short sentences), not as a bolted-on footer. A casual reader and a ready buyer each get an obvious next step.

#### ⛔ REFINED CTA PHRASING (Joe corrected the wording across THREE rounds, Ep09 June 2026 — get this right the first time)
The two-step road map is right, but the closing CTA block went through three successive corrections before it landed. The sequence (so you skip it next time):
- **Round 1 — too wordy / too instructional.** Joe rejected `"Follow us so the next one finds you"` and `"Follow us so it lands in your feed"` as clunky, and the flat directive `"come join the community at storagemoguls.ai"` as a bare command.
- **Round 2 — overcorrected, too tight.** When tightened to telegram-short ("Ever wonder who owns these places? New episodes every Tuesday. Come find out at storagemoguls.ai") he said *"Too tight now, sounds like we are in a rush."*
- **Round 3 — the QUESTION was trivia, not a payoff.** The hook `"Ever wonder who actually owns the storage place down the road?"` got *"how does this help, who owns the storage is that really what we talk about. But the structure is sound."* The STRUCTURE (question → Tuesday follow-reason → community nudge) is correct; the QUESTION just has to promise something the viewer actually wants.

The rules that emerged, all three rounds folded in:
1. **FOLLOW beat = a REASON, never an instruction.** Don't write "follow us so…". State the RHYTHM and let the follow be self-motivated: `New episodes every Tuesday.` / `We do this every Tuesday.` Don't drop the follow (page growth is an explicit goal) — make it a standing invitation, not a beg.
2. **COMMUNITY beat = a CURIOSITY QUESTION that PAYS OFF, then name the value at storagemoguls.ai.** ⛔ The question must point at **what a curious stranger actually wants to know — "can I do this? how does this actually work? is this within reach for someone like me?"** — NOT trivia about the show's subject matter ("who owns the place down the road" = rejected, it's trivia, it doesn't help). Ask the reader's real question, then frame the site as where it gets ANSWERED. ⛔ **BANNED STOCK PHRASES (Joe re-flagged Ep04, July 2026 — "wrong vocabulary, not even good English"):** `go from wondering to owning` / `go from wondering to running one for themselves` / `read a deal like an owner` / `Follow + listen` / `lands in your feed`. These are clichéd filler, not real sentences — DO NOT use them. Write a plain, specific question + a plain destination line instead. Good Ep04 closes that landed: *"New episodes every Tuesday. If you've ever wondered whether this is something you could actually do, that's the whole reason storagemoguls.ai exists."* / *"New episodes every Tuesday. Ever wondered how someone with no experience gets that first loan? That's what we walk through at storagemoguls.ai."* / *"New episodes every Tuesday. When you're ready to underwrite your own first deal, storagemoguls.ai is where the people who've done it are."*
3. **LENGTH = conversational middle, NOT rushed and NOT a wind-up.** Two short sentences that breathe. Between the wordy round-1 and the clipped round-2. If it reads like you're in a hurry, it's wrong; if it takes three clauses to get to the point, also wrong.
4. **ALTERNATE warm ↔ normal down the batch** (Joe: "alternate between warm and the normal") and **vary the exact question per post** so the feed never repeats. Warm = a soft curiosity question ("Ever wonder…?"); normal = a crisp framing line ("This is what separates the people who close from the people who get burned"). Pick the register that fits each idea.
5. **The CTA block is SWAPPABLE in isolation.** When Joe says only the CTA tail is off ("the rest of the captions are great"), change ONLY the closing block — leave the post body verbatim. Don't rewrite the whole caption when he flagged one section. (He corrected me mid-session for starting to rewrite full bodies when he meant just the follow+invite area.)

WHY (research, condensed — pulled this session, store as durable rationale): question hooks engage through self-reflection and suit educational/problem-solving content (our audience); curiosity-gap/mystery hooks are for viral content and carry clickbait risk — use sparingly. CTAs convert on action-with-a-reason + clear value + low friction; "Follow" is the lowest-friction micro-commitment (small ask first), the site is the bigger ask (second). A value-named, frictionless path beats a generic ordered command. A question only works if its answer is something the reader wants — a trivia question about the topic fails because it promises nothing.

### ⛔ CAPTION LONG-FORM / SHORT-FORM STRUCTURE (Joe locked, Ep11 July 2026)
Do NOT write four different-length captions per idea. Joe's locked structure:
- **LinkedIn + Instagram + Facebook = the SAME long-form caption** (the full LinkedIn-style body). One long form serves all three. This SUPERSEDES the old per-platform specs below (IG "3–5 lines / under 150 words", FB "loosen the tone") — those are retired; IG and FB run the LinkedIn long form verbatim.
- **X = its own SHORT form** — message-first, stands completely alone, names the asset in its first line, no hashtags. (X still can't schedule in SM Metricool — build + upload the asset, say so.)
So per idea you write exactly TWO caption texts: one long form (LI/IG/FB) + one X short form.

### ⛔ CAPTIONS MUST BE COMPLETE, LOGICALLY-SOUND SENTENCES (Joe corrected 3x in one idea, Ep11 July 2026)
Joe: *"we agreed on completeness of sentences"* / *"leaving nothing to questions."* Every line must parse and hold up on its own with zero missing context. The three he caught in a single caption, as a checklist to run on EVERY line before it reaches him:
1. **No self-defeating logic.** *"the report you skip is the one that saves you"* is broken — if you skipped it, it didn't save you. FIX: *"the report you think you should skip is the one that could actually save you"* (it's about the temptation to skip, not the act). Read each aphorism literally and confirm the cause/effect actually works.
2. **No dangling clause missing its object.** *"the reason I didn't lose $900,000"* → lose it WHERE, on what? FIX: *"the reason I didn't lose $900,000 on a self-storage deal."* Every claim names what it's about.
3. **Action vs thing — name the verb when the ACTION is the point.** *"A survey the bank never required is the reason…"* → it wasn't the survey, it was DOING the survey. FIX: *"Doing a survey the bank never required is the reason…"*
Also applies the "name the subject" rule (no bare "buyer"/"first-timer"/"the deal"/"the report" — pin it to self-storage; see the NAME THE SUBJECT rule above). When you rewrite one line, move any now-redundant detail (e.g. the deal's city/price) into the next sentence so the opener stays complete without repeating.

### Mention the EPISODE in the caption, never on the poster (Joe, Ep09)
The episode pointer lives in the CAPTION ("we break the whole deal down on the podcast, full episode drops Tuesday"), NOT baked into the poster art. So an interested reader can go straight there.
- **Before the episode is published**, point everyone to **storagemoguls.ai** as the single destination — do NOT drop a YouTube link you don't have / that 404s. Mention the release day ("drops Tuesday") to give a reason to follow + come back. Only name + link the YouTube watch URL when Joe gives you a live one.
- On the day the episode goes live, switch the wording from "drops Tuesday" to "is live today."

### ⛔ SCHEDULE WINDOW CHANGES MID-STREAM — reflow the same order, don't relitigate (Joe, Ep11 July 2026)
Joe often narrows/changes the scheduling window after you've laid out a full plan ("only go until Tuesday" then, a beat later, "do it until Wednesday"). When the window shrinks below one-idea-per-day capacity, keep the SAME confirmed post-ORDER and just reflow it into the tighter window: stack multiple posts per day, spaced hours apart (proven Ep11 shape: first item ~+30min today, then ~3/day at roughly 8am / 12pm / 4pm ET), keep the video↔poster alternation, and still avoid weekends unless told. Confirm the reflowed table with him, don't argue the old spread. Different networks at the same minute = no collision, so all of an idea's LI/IG/FB fire together. Always end with the `getScheduledPosts` collision/dupe/gap sweep. (Metricool times are ET; host clock is EAT — compute real ET with Python `zoneinfo` before deciding whether the first slot has passed.)

### SM scheduling cadence Joe locked (Ep09)
- **Post time = 8:00am ET** (he moved everything off the 10/13/16 spread; 8am is the working default until told otherwise).
- **One idea per day**, ideas on consecutive POSTING days (he skips nothing, but moved Sat/Sun ideas to Mon/Tue — avoid weekend posting unless told). All 3 platforms (LI/IG/FB) for an idea fire at the SAME 8am (different networks = no collision).
- **A "new episode drops Tuesday" PROMO post** (LI/IG/FB) the day before/of the next episode is a standard deliverable. ⛔ **The promo poster must SELL THE SPECIFIC EPISODE, not be a generic teaser** (Joe rejected a generic "NEW EPISODE · This Tuesday + topic chips" card, Ep09: *"the promo poster doesn't promote the episode properly"*). It MUST carry, pulled from the filed Understanding: (1) the **show name** (masthead STORAGE MOGULS · The Podcast + "On the Storage Moguls Podcast"), (2) the **named guests** + who they are ("Aidan & Liam Brennan · Brothers, 25 & 22 · with host Joe Downs") — use avatar circles; if you have no real photos use initial monograms and SAY SO (never fake a likeness), (3) the **real locked episode title** (from the `/YouTube` thumbnail filename), (4) a one-line **hook** that makes someone want to tune in, (5) an **"Inside this episode"** chip strip of the actual topics (e.g. "Buying young with SBA", "The easement that nearly killed the deal", "Hidden delinquency", "Day-one operations") to kill the lower-third dead-void AND add promo value, (6) a **NEW EPISODE · TUESDAY** flag + **"Listen at storagemoguls.ai"** footer. Proven build: `BrandAssets/Storage-Moguls/LinkedIn/SM_LinkedIn_Poster_Ep9_promo-episode_v2.html`. The matching CAPTION must also name the guests + the hook ("this week, brothers Aidan and Liam Brennan, 25 and 22, on how they bought a 136-unit facility…") so copy and poster tell the same story. Joe mixes in the promo videos himself.
- Always run the final collision/dupe/gap sweep (`getScheduledPosts` across the whole window) before declaring done — Joe QAs the planner himself and catches same-time/same-platform double-books.

## 🎓 EDUCATIONAL content is a SEPARATE LANE from PROMO (Joe, Ep04 July 2026)

An episode yields TWO distinct kinds of content, and Joe wants them kept clearly apart — do not mix them:
- **PROMOTIONAL** — sells/teases the episode (the hook-wrapped real-clip videos, the "new episode drops Tuesday" poster). Drives to watch/listen. Uses the video format in `brand-poster-design` → `references/hook-wrapped-real-clip.md`.
- **EDUCATIONAL** — teaches ONE concrete thing from the episode and STANDS ALONE. A reader gets smarter about self-storage investing even if they never touch the episode. No "watch the episode," no hook-card selling. This is the lane Joe asked for on Ep04 ("I am not looking for promotional content, I want educative content from this episode").

When Joe asks for "educational / educative content from the episode," build the educational lane, NOT posters that push the episode. Full recipe (light-editorial poster look + Storage-100 caption voice + the clarity rule + the IG/FB **Story** 1080×1920 reformat + the **educational+episode-CTA hybrid** + the **4-day learning-series variant** (Joe: "curate it into a 4 day series of learning" — DAY N kicker, ideas sequenced as a progression, one lesson/day) + the Metricool/TZ scheduling notes) in `references/educational-posters.md`.

#### ⛔ DO NOT add Joe's host photo to educational posters (Joe REJECTED it, Ep10 July 2026)
On Ep10 I offered / built a two-zone "editorial text + bottom photo band" composite of poster 1 using Joe's hoodie photo (`BrandAssets/Joe-Downs/LinkedIn/_type-tests/joe_mic_hoodie.png`). It took several crop/scale iterations (the source is a near-headshot, so scale-to-width blows his face up huge; the working fix was fit-by-HEIGHT + right-anchor Joe + soft blurred studio backdrop + cream→transparent gradient join + brand-font name tag via a transparent HTML overlay composited over the photo in PIL). Even done cleanly, Joe's verdict was blunt: **"This is bad lets just use the initial one."** So: the educational lane stays PURE TYPOGRAPHIC light-editorial — no host-photo composite. Don't re-offer it. (The photo-composite technique itself is fine to keep in the back pocket for a DIFFERENT deliverable if Joe ever asks, but it is NOT wanted on the light educational posters. Full detail + the rejected build in `references/educational-posters.md`.)

#### ⛔ THE "EDUCATIONAL + EPISODE-CTA" HYBRID (Joe, Ep10 July 2026) — ask, don't assume the pure lane
When you ask which lane, Joe may pick a hybrid: *"Let's do educational with a CTA for the episode because the episode is already out."* This is NOT the pure educational lane and NOT the promo lane. Handle it precisely:
- **POSTER art stays 100% pure educational** — the light-editorial teaching poster, message-first, ONE lesson, footer = brand sign-off + storagemoguls.ai. NOTHING episode-selling on the art (no "watch the episode," no hook card). The poster teaches; only the CAPTION mentions the episode.
- **CAPTION voice stays the Storage 100 teacher voice** (plain, warm, first-person Joe, one idea per line).
- **CAPTION CTA points to the LIVE episode + storagemoguls.ai**, NOT the Monday-night Storage 101 call. Because the episode is already published, the close is: teach the lesson → "the full episode is live now on the Storage Moguls YouTube" → warm "come learn how the business really works, free to start at storagemoguls.ai." When the episode is NOT yet live, the pure educational lane's Monday-night-call CTA applies instead. So the CTA target is governed by episode status, and Joe will tell you which he wants.
- **No live YouTube watch URL in the Drive docs is normal** for a just-processed episode. Write "the full episode is live now on the Storage Moguls YouTube," do NOT invent/link a 404, and flag it: tell Joe you'll slot the direct watch link into every caption once he gives it to you.

### The educational poster look (Joe approved, Ep04): LIGHT, easy on the eyes, attractive
Joe's brief: "very light weight, easy on the eyes and attractive, keeping the brand rules." The winning treatment is the Minimalist recipe flipped to a LIGHT field (not the dark navy promo spine):
- Cream/paper bg `#F5F3EE`, SM navy ink `#0B1322`, blue accent `#2E7DF6` (thin top hairline + rule), red `#B9271B` only to flag a myth/negative. Fraunces serif headline, Montserrat body, Barlow-Condensed masthead, JetBrains-Mono kicker. Corner tag reads `Storage 101` to mark the educational lane. Footer `PRACTITIONERS, NOT PROFESSORS.` + `storagemoguls.ai`.
- ONE teaching idea per poster, generous whitespace, content vertically CENTERED in the field (`wrap` with `justify-content:center` + a `bottom` inset) so there's no dead band. 1080×1350.
- DISTINCT layout per poster in a set (myth-list / check-list / big-number contrast / two-card compare / numbered list) — never five clones.
- No em/en dashes on the art (write two sentences or a period).

### CAPTION VOICE for educational pieces = the Storage 100 Picture Guide (Joe's reference, Ep04)
Joe: make the copy "easy to understand like the YouTube scripts / the Storage 100 picture guide." That guide's voice (file: `~/sm_tx_work/ebook/Storage100_Picture_Guide_v2_swap5.html`) is the standard: plain, warm, FIRST-PERSON Joe, short declaratives, ONE idea per line, zero jargon (or define it in the same breath), concrete over abstract. Close with the warm free **Monday-night Storage 101 call** invite (same CTA the guide uses), NOT the promo road-map. This is Joe's PERSONAL teacher voice, distinct from the SM brand first-person used on promo — because educational SM content funnels to Joe's Storage 101 call.

### ⛔ NAME THE SUBJECT — "self-storage INVESTING", never leave it to guesswork (Joe corrected 2x, Ep04; extended Ep11)
Bare "storage" / "self-storage" reads to a stranger as *renting/using a unit*, not investing. On EVERY educational poster AND caption, in the headline/kicker AND the CTA, say "self-storage investing" / "self-storage investment" / "buy a self-storage facility." Joe: "never leave anything to guessing." (Now also codified brand-agnostically in `writing-craft` Rule 8.)
- **Ep11 extension — bare "first-time buyer" / "first-timer" is ALSO vague** (Joe: *"when you say first-time buyers its vague, we agree on leaving nothing to questions"*). A cold reader hears "first-time buyer" as a first-time HOME buyer. Always pin the asset: "buying their first **self-storage** facility," "your first **self-storage** deal," "experienced **storage** buyers." Same for a naked "the deal," "the report," "the buyer" anywhere copy hits a stranger. Scan every caption/headline for a bare noun that assumes context and tie it to self-storage.

### ⛔ RELEASE CADENCE = MONDAY (Joe changed it from Tuesday, Ep11 July 2026)
SM podcast now drops **every Monday**, not Tuesday. Every SM caption CTA rhythm line reads "New episodes every Monday." / "We do this every Monday." The promo-poster flag becomes **NEW EPISODE · MONDAY**. The old "drops Tuesday" / "New episodes every Tuesday" wording throughout this skill AND its references (`educational-posters.md`, `metricool-scheduling.md`) is SUPERSEDED — use Monday until Joe says otherwise. (Also in memory.)

## ⛔⛔ THE #1 RULE — process source into UNDERSTANDING, then write FROM the understanding (Joe corrected HARD on the SI sibling, June 2026 — applies identically here)

The failure mode Joe rejected: **lifting/paraphrasing transcript phrases into headlines and captions.** Spoken words dropped into a poster read cheap and choppy ("like a three-year-old wrote it"). The fix is a process, not a wording tweak:

1. **Read the WHOLE transcript + show notes + blog** — the full conversation and its arc, not keyword snippets.
2. **Distill into an UNDERSTANDING layer** — the IDEAS and their CONSEQUENCES in your own words (not quotes). For SM (deal/operator stories) this means: what actually happened in the deal, *why* it worked or didn't, what the operator lesson really is underneath the anecdote.
3. **Write posts FROM that understanding** in SM brand voice. Intuitive move: when you have a good opening line, ask **"what did this deal/decision actually DO or reveal?"** — write that consequence, don't reshuffle the guest's words.
4. **Quote a raw line ONLY if strong standalone.** If paraphrasing cheapens it, write fresh from the insight. Never manufacture a number or detail not in the source (attribution rule below still governs — guest's results stay the guest's).
5. **ALWAYS file the UNDERSTANDING into Notion as episode knowledge** — the Moguls Operations Hub episode page / SM knowledge area (cross-reference the existing episode pages, e.g. Ep05 Notion page). Source = episode Drive folder. The understanding is the reusable asset; posts are downstream of it.

SM brand voice itself is right (educator-practitioner, specific, no hype) — the lesson is execution: short *with rhythm*, full sentences, one clean open loop, never choppy fragments.

## ⛔ MANDATORY FIRST STEP — read the Drive source (Show Notes + Blog + Transcript). Notion is NOT a substitute.

ALWAYS pull the episode's **Show Notes.docx + Blog.docx + Transcript FINAL.docx from the Drive episode folder** BEFORE writing anything, and mine the transcript for the specific, surprising, quotable lines. Do NOT generate from a Notion summary, a chat summary, or memory — that produces **shallow, generic content** (Joe corrected this hard on the SI sibling, June 2026: *"you ALWAYS need to follow that structure, otherwise we get shallow content"*; same rule applies here). Notion is the routing/system-of-record DB; Drive is the CONTENT source — never swap them. Always also check the `YouTube/` and `Promos/` subfolders for REAL promo clips before building any video.

### Visuals must be as rich as the content (Joe directive, June 2026)
Use the FULL style range (minimalist, big-stat, dossier, typographic quote, infographic, list, photo) — don't reuse one template across a batch, and tie each visual to a SPECIFIC line/number from the source. Real host/guest photos are a first-class visual (use the photo of whoever OWNS the angle). Illustrated characters are ONE optional asset, not required on every design. See `brand-poster-design` for the build/render/cutout pipeline.

### ⛔ POSTERS ARE MESSAGE-FIRST, NOT INFORMATION SLIDES (Joe corrected HARD, Ep04 July 2026)
Joe rejected a full Ep04 static batch that was on-brand and well-built because the posters were **dense and jargon-heavy with no single grabbing message**: *"there is no message in these posters just jargon and they have too much text, we need this to get people's attention not just to post."* The rules (full version in `brand-poster-design` §3a):
- **Each poster carries ONE big MESSAGE** — a single punchy human line, set large, that stops the scroll. That message IS the backbone. When Joe says "the message should be the backbone of every piece," he means the message is literally what's ON the art, big and clear — not buried under content.
- **The CAPTION carries the detail, the stats, the jargon.** Do NOT put DSCR / SBA-7(a) / occupancy-% tables / multi-row myth lists / 4-step timelines / 3-stat-card grids ON the poster — those are caption material. A poster crammed with them reads as a "slide," not a scroll-stopper.
- **This does NOT kill structural variety.** Vary the visual vocabulary across the batch (typographic / big-number / minimalist statement / dossier / data-viz), but EVERY poster stays message-first and sparse: a data-viz can be ONE big number with one line; a "dossier" can be ONE bold finding, not a 5-row case file.
- Worked Ep04 rebuild (v2 supersedes the dense v1): myths idea → "Every reason is a story someone handed you" (three struck excuses as setup); SBA idea → "You don't need a track record. You need a plan."; data-beats-fear idea → "The deal looked dead. The data said buy." + ONE 45%→70%+ figure pair. Files: `SM_LinkedIn_Poster_Ep4_*_v2.html`.

## When to Trigger This Skill

- "Generate posts for Storage Moguls podcast episode [X]"
- "Process the new SM podcast episode"
- "Write captions for the Storage Moguls promo video"
- "Create content for the SM podcast brand accounts"
- "What posts do we need for this Storage Moguls episode?"

### Resolving "the LAST / latest / new episode" + reconciling existing work (Ep08, June 2026)
- "Generate content from the **last** episode" = find the most-recently-MODIFIED episode folder, don't assume the highest number is newest or unprocessed. List the `Episodes/` subfolder with the parent-search and sort by `modifiedTime` (the create call returns it) — the top one is "last."
- **STEP 0 before building anything: check Notion for an EXISTING content set.** A freshly-recorded episode often already has the Understanding page + several Content Pieces (LinkedIn/FB/IG/YT/promo) filed (Ep08 had a full brand set filed days earlier). `notion_search` the Episode Library + Content Pieces for the episode before generating — then RECONCILE (reuse approved matching pieces, fill genuine gaps, rebuild mismatched/off-idea visuals) rather than regenerating from zero or duplicating. Same STEP-0 discipline as `brand-poster-design`.

Do NOT use this skill for:
- Joe's personal LinkedIn posts (use `joe-from-podcasts`)
- Successful Idiots brand posts (use `successfulidiots-podcast`)
- Broad SM brand education/promo posts (use `linkedin-posts`)

## The Show

- **Name:** Storage Moguls Podcast
- **Host:** Joe Downs
- **Platform:** YouTube + podcast feeds
- **Website:** storagemoguls.ai
- **Contact:** joe@storagemoguls.ai
- **Audience:** Storage investors, operators, aspiring acquirers — people who are actively trying to find, fund, and operate storage facilities
- **Format:** Guest interviews + deal breakdowns + operator conversations
- **Core themes:** Self-storage investing, deal sourcing, underwriting, operations, financing, boat/RV, IOS, truck parking, pro storage — all storage verticals
- **Tone:** Practitioner-educator. Joe is the experienced operator asking the questions that students would ask if they knew what to ask. Not a talk show — a practitioner conversation.

## Drive Folder Structure

**Root folder:** https://drive.google.com/drive/folders/1vA1TnX7RRhW74gJDavUhRxvfhToumgi-

Each episode folder typically contains:
- **Transcript doc** — full conversation or timestamped highlights
- **Captions/Posts doc** — pre-written social posts per platform
- **Canva graphic links** — visual assets
- **YouTube video link** — published episode
- **Promo video clips** (where present) — short clips for Reels/Shorts

**Episode pages also exist in Notion** under the Moguls Operations Hub (e.g., Ep05 — Matt Rosendale / Lindsey Self Storage Group). Cross-reference both Drive and Notion for complete episode assets.

**How to access (this profile uses the google-workspace CLI, NOT a Drive MCP):**
1. Set `GAPI="python C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py"` (absolute Windows path — `$HOME` mis-resolves in this git-bash shell).
2. Drill down with raw-query parent searches: `$GAPI drive search "'<FOLDER_ID>' in parents" --raw-query --max 50`. The SM tree may be nested (an `Episodes/` subfolder) like the SI tree — do NOT assume the episode folders sit directly under the root; list and verify.
3. **Reading `.docx` files (VERIFIED Ep03 — read this carefully):** episode Show Notes / Transcript / Blog are usually uploaded Word `.docx` files (mimeType `...wordprocessingml.document`), NOT native Google Docs. `--export-mime text/plain` returns binary garbage on these. Download the raw file: `$GAPI drive download <ID> --output /c/Users/somea/<name>.docx`.
   - **`read_file` may REFUSE the `.docx`** ("Cannot read binary file") and `pip install python-docx` may fail in this git-bash env — do NOT rely on either. The verified working extraction is plain `unzip` + tag-strip:
     ```bash
     unzip -p <name>.docx word/document.xml 2>/dev/null \
       | sed -e 's/<[^>]*>/ /g' -e 's/&amp;/\&/g' -e "s/&apos;/'/g" \
             -e 's/&quot;/"/g' -e 's/&lt;/</g' -e 's/&gt;/>/g' > <name>.txt
     ```
     Then `tr -s ' ' < <name>.txt | fold -s -w 110 > <name>_clean.txt` to collapse the run-on spacing into readable lines, and `read_file` the `.txt`. Clean up all temp files (`.docx`, `.txt`) after.
   - **The Captions/Posts doc is often a NATIVE Google Doc** (mimeType `...google-apps.document`) — read it directly with `$GAPI docs get <ID>` (returns JSON with a `body` field). Word docs need the unzip path above; native docs use `docs get`. Check the mimeType from the parent-folder listing to know which.
   - **Line breaks in the captions `body` are `\u000b` (vertical tab)**, not `\n` — posts and section boundaries are separated by `\u000b`. Split on both when parsing.
4. The pre-written base may live in a **Show Notes** and/or **Blog** doc rather than a doc literally named "Captions/Posts" (confirmed pattern on the SI sibling line). Open Show Notes first; fall back to Blog and Transcript.
5. Cross-check Notion for any episode prep pages or show notes.

(Full verified Drive-access recipe is documented in the `successfulidiots-podcast` skill's Drive Folder Structure section — same mechanics.)

**If pre-written posts already exist:**
Use as the approved base. Adapt format per platform. Do not rewrite from scratch.

## Known Episodes (verified June 2026)

**Verified Drive tree:** Root → `Episodes/` subfolder (`1ah4EeaKyL-A2i-r5Ymddk7nBxRmDYFSh`) → numbered per-episode folders. Do NOT look for episode folders directly under the root.

Episode folders present (as of June 2026): `001 Blunks`, `002 Leiby's`, `003 Sydnie Wilda`, `004 Jack Pezzino`, `005 Matthew Rosendale`, `006 James Breunig`, `007 Alex Erbs`, `008 David Merkin`, `009 Aidan and Liam Brennan`. Each contains a `YouTube/` and `Promos/` subfolder, an mp3, plus `Show Notes.docx`, `BLOG.docx`, a transcript `.docx` (FILENAME VARIES per episode — see Ep09 note below), and a native `RAW Transcript` Google Doc.

| Episode | Guest / Topic | Folder / Doc |
|---|---|---|
| Ep03 | Sydnie Wilda — Anytime Storage — "The Facility Nobody Wanted. The Deal Everybody Missed." | Folder `1r1L7-r3giq6Gb9DacOMp4oPFBnLOID4c` · [Captions doc](https://docs.google.com/document/d/1J_LGl94Glk0laizoDBg6uSURAIhdNghPLCmUuxVfp-U) · YT `OGlNQR0rVAc` |
| "The Seller Stopped Operating" | Adam + Kirby — deal acquisition story | [Link](https://docs.google.com/document/d/1_ib5Yi9psehuDgfH9a0ojCSnzbVlQS1wifP0r4RmMLY) |
| Ep05 | Matt Rosendale — Lindsey Self Storage Group | [Notion](https://app.notion.com/p/361cc74ebcf38198b361ed19c347346c) |
| Guest appearance — Ruben Kanya | Joe as guest — storage operator insights | [Link](https://docs.google.com/document/d/16sq81h7d0v2p9eeLx2mlc3oDxLmSae5Tf8VpuvlGJLw) |
| Guest appearance — Patrick Lonergan | Joe on Vital Strategies Podcast | [Link](https://docs.google.com/document/d/1BAfBz3aBc-M4ZRz8rAnW7p3A0uET6r4-9aIZZk-xyO4) |

Update this table as new episodes are processed. Episodes 002, 006, 007 exist in Drive but haven't been processed through this skill yet.

**Ep04 — Jack Pezzino (SM VP of Education) — "Are You the Right Person to Buy a Storage Facility?" — PROCESSED July 2026.** Drive folder `1ZycROzvAl6u7RlL2EZEA-H0KKi6mdiS3` (`004 Jack Pezzino`). ⚠️ The `BLOG.docx` is an Ep03 (Sydnie Wilda) DUPLICATE — ignore it; the real source is `Transcript FINAL.docx` (`1lHqCf-RQI-CzmZOBRjPxkFrIUDdiIbpt`) + `Show Notes.docx`. Understanding upgraded Needs Review → Verified on SM Episode Library page `383cc74e-bcf3-8167-a7fe-e076407fc152` (re-pull flag cleared). Locked title from `/YouTube` thumbnail. 4 real promo clips in `/Promos` (Secret to Speeding Up Success · $17k Tax Hike Killed the Deal · Risky Bet or Business Genius · $100k Into a $1M Deal). **Backbone message (Joe directive: "the message should be the backbone of every piece"): it's a DECISION, not money/age/smarts/timing.** 5 ideas (each LI/IG/FB + X asset built, X not connected): (1) it's a decision [MOTION `SMRightPerson` — copied from `SMTooYoung`, registered SMRightPerson{Square,Reel,Wide} in Root.tsx], (2) limiting beliefs are myths [typographic strike], (3) "You don't need a track record. You need a plan." [minimalist statement], (4) data beats fear / Adam & Kirby ~$650K 45%→70%+ [big-number], (5) episode promo. + YouTube description. Campaign `38fcc74e-bcf3-8126-8cfd-fa1d64f2b6a9`; 21 Content Pieces filed In Review; Cloudinary manifest `_manifests/SM_Ep04_manifest.json`. ⛔ Posters were rebuilt MESSAGE-FIRST mid-session after Joe rejected the dense v1 (see the message-first rule above). Voice = Joe first person. Not scheduled — held for Joe's approval.

**Ep10 — Joe Downs (SOLO — no guest, the listener is the guest) — "The 3 Fears Keeping You From Your First Storage Deal" — PROCESSED July 2026.** Drive folder `1ziEnyINKEyHRauyzsobQfcoEkcC-19WE` (`10 Solo`, directly under the `Episodes/` subfolder). Docs: `Show Notes.docx`, `BLOG.docx`, `Transcript Video FINAL.docx` (+ `Transcript Audio FINAL.docx`), mp3 `SM 010 SOLO FINAL.mp3`. `/YouTube` had the published mp4 + a thumbnail PNG whose filename IS the locked title. `/Promos` had 4 REAL clips (The Secret to Getting a Lower Purchase Price · Don't Let a Last-Minute Retrade Kill Your Deal · Why Commercial Storage Sellers Want to Help You · Financing Fears in Commercial Storage) — for the promo lane only, NOT the educational build. First SOLO episode processed (see the solo note under the attribution rule). Understanding filed VERIFIED to SM Episode Library page `392cc74e-bcf3-81fd-a243-d7888923c857` (full 6-idea body in the page). Episode was ALREADY LIVE → Joe chose the **EDUCATIONAL + episode-CTA hybrid** (see that box): pure educational light-editorial posters, captions in Storage-100 teacher voice closing to the live episode + storagemoguls.ai (no live YT watch URL was in the Drive docs — flagged for Joe to supply). Key verified facts: Joe = 20+ facilities / $75M+ across states & verticals; the 3 fears are all relationship/work problems not money/talent/experience; DSCR 1.20–1.25; SBA built for first-timers; 70–75% US self-storage still mom-and-pop; 3 contacts over 6 months = seller top tier; NC deal $1.2M→closed $1.1M SBA 10% down, prior buyer retraded & lost $10K deposit, the $100K was the seller's reward for certainty of close; self-storage no down revenue year in 40+ yrs (countercyclical); close = Be Your Future Self Now / Mr. Beast. 4 educational ideas built LI/IG/FB + X asset (X not connected): (1) "It was never the money" [statement], (2) lenders fund the deal not you / DSCR 1.25 [big-number], (3) most sellers WANT a first-timer / 70–75% mom-and-pop [statement+fact], (4) $100K = the price of certainty / NC deal [big-number-contrast]. Feed 1080×1350 + story 1080×1920 rendered; generator `C:\Users\somea\SM_Ep10_edu\gen_edu.py` (copies the Ep04 `edu1_myths.html` head donor). Not scheduled — presented one-idea-at-a-time for Joe's approval.

**Ep01 — Christin Blunk (SM COO) — "Cancer Threatened Their Income. Storage Made It Bulletproof." — PROCESSED June 2026.** Drive folder `1mkR8aeh0wqz0LxS61NiC7-YOxqTYGs-o` (`001 Blunks` under the `Episodes/` subfolder). Docs: `Show Notes.docx`, `BLOG.docx`, two transcripts (`Transcript VIDEO FINAL.docx`, `Transcript AUDIO FINAL.docx`), mp3, `Promos/` + `YouTube/` subfolders. STEP 0 paid off: an Understanding page was already filed — **SM Episode Library page `383cc74e-bcf3-8187-a370-ce86362aea77`** — reconcile against it, then still read Show Notes + Blog for the specifics/quotes (don't write from the summary alone). Verified deal facts (cross-confirmed across Show Notes + Blog + Understanding): Christin + husband Rod (nuclear engineer/Navy officer + insurance VP); 2008 stalled their 401k/IRA path; built residential REI = 450+ transactions; Rod diagnosed stage-4 cancer 3 days before Christmas → both incomes stopped. Deal 1: COLD CALL, 66-unit, Radcliffe KY, **$320K**, conventional bank financing 20% down (no SBA/no PE), rents **37% below market**, ~$4K/mo, now worth **$750K+**. Deal 2: 5 miles away, 40 non-paying units, negotiated to keep recovered collections, thousands recovered via tenant contact + modern payment systems. Today: **~$12K/mo** across both on **~15 hrs/mo**; portfolio tracking to **$3.75–4M at exit**. Voice = Joe's first person (SM default). Episode not yet live at processing time → CTA pointed to storagemoguls.ai with "new episodes every Tuesday" follow reason. Topics: Self-Storage Investing · Deal Sourcing (cold call) · Mindset. Five platform variants (LinkedIn/IG/FB/X/YouTube) delivered as a review .docx in Downloads; visuals planned (income-stat motion reel + deal dossier static) but NOT rendered pending Joe's nod.

**Ep09 — Aidan & Liam Brennan (The Storage Brothers) — "Too Young, Too Inexperienced? This Storage Deal Says Otherwise" — PROCESSED June 2026.** Drive folder `1v_yKz3VVZjmMy4fqdICItoYF7m8BNxvQ` (under the `Episodes/` subfolder `1ah4EeaKyL-...`). ⚠️ Transcript filename varies AGAIN — here it was `Transcript Audio FINAL.docx` (Ep08 was `Audio Transcript.docx`, Ep03 `Audio Transcript FINAL.docx`); never hard-match the filename, list the folder and grab the doc whose name contains "transcript". Show Notes + BLOG are `.docx`; promo clips live in `/Promos`, the published cut + thumbnail PNG in `/YouTube`. The `/YouTube` thumbnail filename often IS the locked episode title — use it. Understanding filed to SM Episode Library page `388cc74e-bcf3-8165-b8f9-eaf309871273` (full 5-idea body in the page). Deal: brothers 25 & 22, 136-unit Pembroke GA, $800K→$680K effective, SBA-financed. 4 ideas shipped LI/IG/FB Metricool drafts (1 idea/day, 10/13/16 ET, no X — not connected): (1) age objection is fake [MOTION reel `SMTooYoung` 3 aspects], (2) discipline-not-luck easement near-miss [timeline-dossier static], (3) reported delinquency is a floor [bar data-viz static], (4) day-one operator reality [numbered-list static]. Campaign page `388cc74e-bcf3-81ce-9578-e68f7315254c`.

- **VOICE resolved (my judgment call, Joe didn't object):** the SM brand account publishes in **Joe's FIRST person** — the Drive captions doc is first-person, the show's own cold open is "I'm Joe Downs," and third-person reads corporate. Keep flagging it as flippable, but first-person is the working default until Joe says otherwise.
- **The `SMTooYoung` Remotion comp is now a reusable SM "reframe-arc" motion template** (`_remotion/src/SMTooYoung.tsx`): built on the exact `SMFirstTimerEdge` spine (shared `BG`/`Masthead`/`Footer`/aspect-aware `Stage`, `Series` of spring scenes). Arc = hook (the excuse) → facts (3 count-in stat blocks) → reframe (underline-sweep payoff) → close (Ep label + storagemoguls.ai underline sweep). Registered 3 aspects in `Root.tsx` as `SMTooYoung{Square,Reel,Wide}`. For a new SM motion idea, COPY this file + the Ep08 ones rather than authoring a spine from scratch.
- **Distinct-vocabulary mapping that landed clean for a 4-idea SM batch** (satisfies the brand-poster-design "no two posters share a structure" rule): reframe/age idea → MOTION; a deal that nearly died → custom **timeline-dossier** HTML (5 color-dot steps: blue=neutral, amber=warn, green=outcome, + italic kick quote); a hidden-number/underwriting idea → custom **bar data-viz** (short "what's told" bar vs tall "what's real" bar, the gap figure between them in amber — amber is fine as a functional alert accent on SM data-viz/dossier, the JD amber-only rule does NOT bind SM); a process/moment idea → engine `list` builder (add ONE italic closing takeaway line to kill the list-builder dead-void).

**Ep08 — David Merkin (Eastern Union Funding) — "What Banks Really Want From First-Time Storage Investors" — PROCESSED June 2026.** Drive folder `1jPk8J4yhnr40VN783-nO5ikA5YqiuBiY` (folders are directly under the `Episodes/` subfolder, e.g. `008 David Merkin`; docs are `Show Notes.docx`, `BLOG.docx`, `Audio Transcript.docx` — the transcript was named `Audio Transcript.docx`, not `...FINAL.docx`, so don't hard-match the filename). Understanding filed to Notion Episode Library page `383cc74e-bcf3-817f-8a8b-f4e652f01cb3`. 4 ideas shipped across LI/IG/FB Metricool drafts: (1) first-time buyer advantage [motion], (2) self-disqualification [motion], (3) lender-ready package [static], (4) broker beats bank ~90% [static].

**Ep09 — Aidan & Liam Brennan (The Storage Brothers / Brennan Asset Group) — "Too Young, Too Inexperienced? This Storage Deal Says Otherwise" — PROCESSED June 2026.** Drive folder `1v_yKz3VVZjmMy4fqdICItoYF7m8BNxvQ` (folder `009 Aidan and Liam Brennan` under the `Episodes/` subfolder `1ah4EeaKyL-A2i-r5Ymddk7nBxRmDYFSh`). Docs: `Show Notes.docx`, `BLOG.docx`, and the transcript was named **`Transcript Audio FINAL.docx`** this time (Ep08 was `Audio Transcript.docx`) — the transcript filename keeps drifting, so LIST the folder and match by mimeType + "transcript" substring, never hard-code the name. `Promos/` had 4 REAL mp4 clips; `YouTube/` had the published mp4 + a thumbnail PNG whose filename IS the locked YouTube title. Understanding filed to Notion Episode Library page `388cc74e-bcf3-8165-b8f9-eaf309871273` (full 5-idea body in page content). The 5 ideas: (1) age objection is fake / asset doesn't care [MOTION — `SMTooYoung`], (2) discipline saved the deal not luck — the easement near-miss + neighbor died before close [static dossier], (3) reported delinquency is a floor not a ceiling — 27/136 units, auctioned 14 [static data-viz], (4) day-one you're an operator — the auction call on day one + self-manage to learn [static/motion], (5) "act like you already own 25" exercise. Key facts: brothers 25 & 22, no RE experience, no trust fund; Highway 119 North, 136-unit / 12,800 sf, Pembroke GA; $800K ask → effective $680K; SBA 7(a)/504. Team named (attribution): attorney Jason Mandel, transition by Rod & Kristen Blunk, underwriting model from Jack Pezzino, Storable software. **Voice call made this session: SM brand account published in JOE'S FIRST PERSON** (matches the approved Drive captions doc + the YouTube "I'm Joe Downs" intro; reads more authentic than corporate third-person). Still flag it as flippable per the VOICE TENSION box, but first-person is the working default until Joe says otherwise.

### ⛔ PREFERRED SM EPISODE VIDEO = HOOK-WRAPPED REAL CLIP, not typographic motion (Joe, Ep04 July 2026)
Joe: our videos "don't really convert and are not really watched." FB data: the multi-scene
TYPOGRAPHIC builds (the `SMTooYoung`/`SMFirstTimerEdge` spine below) averaged **0:06** watch
time vs **0:14** for an immediate, real-motion piece. The format that actually holds attention
uses the REAL conversation footage already sitting in each episode's Drive `/Promos` folder
(host/guest on camera, already 9:16 + captioned) and WRAPS it: a bold **hook card on frame 0**
(open loop + a context sub-line that names the characters & stakes — fixes the cold open) →
crossfade into the real clip with a subtle SM brand frame + a **bottom-third name tag**\n(name + role) → **trim off the clip's own baked-in end card** and replace with OUR CTA outro\n(storagemoguls.ai + Start free + "New episodes every Monday" — cadence is MONDAY now, not Tuesday; see the cadence rule above), so only one ending runs. Real
face + voice + captions is the biggest watch-time lever on muted feeds. Built with **ffmpeg**
(footage is real video, not Remotion). This is the GOING-FORWARD default for SM episode video;
one hook-wrap per `/Promos` clip = N ready Reels/Shorts per episode. Full pipeline + the 3 Joe
correction rounds (≥2.8s hook, name tag, cut-their-ending) + QA + pitfalls:
`brand-poster-design` → `references/hook-wrapped-real-clip.md`. Proven: SM Ep04 (4 clips,
Jack Pezzino). Deliver MP4s to `~/Downloads/SM_Ep<NN>.../` for review; NOT scheduled until Joe
approves the format.

#### ⛔ LIGHT INTRO-CARD variant + the FACE↔NAME attribution pitfall (Joe, Ep11 July 2026 — verified clean)
Joe may ask for a LIGHTER hook card than the full Ep04 story-setup: *"the intro should have very
little text — just the main understanding point, or something short explaining what the guy is
talking about, e.g. 'Jason Mandel on the cost of waiting.'"* So the intro card is a clean
**kicker + ONE big message line + a single short subline naming the speaker + topic + "HERE'S THE
STORY →"** — NOT the multi-line character/stakes setup. Still ≥2.8s, slow zoompan, SM navy spine.
Proven Ep11 build: generator `C:\Users\somea\SM_Ep11\video\gen_cards.py` (renders 4 hook PNGs +
one `cta_outro` + one transparent `brandbar`), assembler `assemble.sh` (per-clip: hook 2.8s →
crossfade → trimmed+branded footage → crossfade → CTA outro; loudnorm INSIDE the filtergraph).
Chrome for PNG render is at `C:\Program Files\Google\Chrome\Application\chrome.exe` (NOT on PATH
as `chrome` — use the full path). All 4 rendered clean first try; delivered to
`~/Downloads/SM_Ep11_Jason_Mandel/`.

⛔ **THE ATTRIBUTION PITFALL that cost several vision-QA rounds:** the on-camera speaker in the
`/Promos` clips is frequently **the HOST (Joe)** even when the AUDIO content is the GUEST's line —
the editor cuts to Joe's reaction/recap shot over the guest's point. So do NOT name a card by the
face you see, and do NOT assume the substantive line = the person on screen. Resolve it cleanly:
(1) map audio → transcript speaker (unambiguous), (2) identify faces via the `/YouTube` thumbnail
which labels host vs guest (crop the two headshots and compare), (3) attribute the intro card by
**topic + the INSIGHT-OWNER** (whose expertise the point is), which is correct regardless of which
face the cut shows — e.g. Ep11 the legal DD insight is Jason Mandel's, so cards read "Jason Mandel
on [topic]" even though Joe is the on-camera face. Then FLAG the framing to Joe for a yes/no rather
than baking a wrong name into N videos. (Same "don't mislabel host vs guest" discipline the
reference's name-tag section warns about.)

**Ep11 — Jason Mandel (RE transaction attorney, Royer Cooper Cohen Braunfeld) — "Why Storage
Investing Deals Die During Due Diligence" — PROCESSED July 2026.** Drive folder
`18YlxILmHwvlIqPlzyWJ7MoHpiN_zbmRw` (`011 Jason Mandel`, most-recently-modified = "last"). Docs:
`Show Notes.docx`, `BLOG.docx`, `Transcript VIDEO FINAL.docx` (+ `Transcript AUDIO FINAL.docx`),
mp3 `SM 011 Jason Mandel FINAL.mp3`. `/YouTube` = published mp4 + thumbnail PNG whose filename IS
the locked title. `/Promos` = 4 REAL clips (Who is ACTUALLY Paying Your Closing Costs · How a
Backup Offer Destroys Your Deal · The $10,000 Mistake That Ruined a $1.5M Deal · Avoid This
Massive Real Estate Mistake). Understanding filed VERIFIED to SM Episode Library page
`395cc74e-bcf3-81c2-85a5-cb1f576ae80b`. Backbone: due diligence is where deals actually die; the
RIGHT specialist attorney is cheap insurance, not a cost center. Key verified facts: 25-yr attorney,
quarterbacks every Belrose deal (Joe's 20+ facilities, $70M+); the $900K near-miss = $1.5M Ithaca
deal, ALTA survey the bank didn't require revealed FEMA redrew flood maps → flood-zone → mandatory
insurance would leave a $1.5M facility worth ~$600K, they walked; "stop using your brother-in-law";
signed LOI is NOT fully non-binding (exclusivity/off-market); DD clock starts only at a
due-diligence-commencement certificate; earned his fee moving one cost to the right settlement-statement
column; Schedule B-2 exceptions / CCRs / estoppel / ALTA setbacks; hiring filter = # of CRE
(ideally self-storage) closings; jmandel@rccblaw.com. 4 promo videos built via the LIGHT intro-card
variant above (delivered to Downloads, held for approval); rest of the content (educational + a promo
poster across LI/IG/FB/X) was the next step. Guest = grey-hair navy-suit thumbnail headshot; Joe =
blond/headset studio (this is the attribution-pitfall episode).

### ⛔ SPOKEN SHORT-FORM "TALKING TOPICS" for Joe to record (IG/TikTok/FB, same content all 3) — CONTEXT-FIRST is the whole rule (Joe corrected HARD across 5 rounds, Ep11 July 2026)

A distinct deliverable from written captions: Joe asks for **3–4 questions/topics he can record short-form video on himself** (he talks to camera, not a read-off script). Same content goes to Instagram + TikTok + Facebook. The failure mode Joe rejected repeatedly this session, and exactly how to get it right:

**THE #1 RULE — CONTEXT FIRST, ALWAYS. This is why we moved off the old promos.** Joe's stated reason for killing the previous promo format: *"they didn't really display any context within the video. We had no idea what was being talked about."* And his standard: *"The context should always be first and very clear so that as it continues it builds towards a nice conclusion. The reader should never feel like they are struggling to flow."* So every topic MUST open on the plain, everyday ground a COLD stranger already stands on — before any insight, story, number, or point.
- A **title/topic line is NOT context.** "Why the reports the bank doesn't require matter most" is a *conclusion* — it assumes the viewer already knows what due diligence is. Joe caught this twice (*"It's not proper it just dived in without any context"* / *"Where is the context of this????"*). If your opener states the lesson, you've skipped the context.
- **The context is the setup a cold viewer needs before the topic makes sense.** Test each opener: would a total stranger who knows nothing about storage investing understand this first sentence? Openers that WORKED (Ep11): "When you buy a storage facility, the bank makes you get a bunch of reports before they'll lend." / "Almost everyone knows a lawyer — a cousin, a friend, the guy who did their house closing." / "The letter of intent is the first thing you sign when you go after a deal." / "At the end of every deal there's a document called the settlement statement." Each names a plain thing everyone already gets, THEN moves to the topic.
- **Structure per topic: CONTEXT (plain ground) → the topic/story build → a strong CTA.** It should flow so the viewer never feels lost or dropped mid-thought.

**⛔ These are TALKING TOPICS, not scripts — unless Joe asks for scripts.** Joe: *"let Joe talk about them"* / *"structure this into questions or topics that we want to talk about."* Deliver each as: a plain-English **context line to open with**, a short **what-to-cover** for the body (the deeper understanding, not a title), and the **CTA**. Don't hand him word-for-word narration unless he explicitly asks (he did ask for timed ~20–30s scripts at one point — when he does, see the voice note below).

**⛔ CTAs must be STRONG, not "link in bio."** Joe: *"The CTA is short and weak."* A weak CTA gives no reason to act and repeats flatly on every video. A strong CTA = **reason → payoff → destination(s)**: name what they'll get, why it's worth their time, and point somewhere clear. Use the SM two-step funnel (see the CAPTION CTA + FUNNEL section): the episode on YouTube for the curious + storagemoguls.ai for the ready-to-learn. Tie each CTA to THAT video's specific topic, don't reuse one line. Still obey the BANNED STOCK PHRASES list (e.g. "read a deal like an owner" is banned — Joe re-flagged it Ep11; swap for a plain specific line).

**⛔ If Joe DOES want spoken scripts, they must SOUND like him talking, not written copy chopped into lines.** When scripts were requested, Joe's rejection was *"Sounds off re-read it."* The tells that made them read as assembled: headline-stacked fragments ("A $1.5M building, suddenly worth six hundred grand."), every sentence landing like a punchline with no breath, no connective tissue. The fix = read it ALOUD: use contractions, natural bridges ("so," "but here's the thing," "because"), say numbers the spoken way ("about a million and a half," not "$1.5 million"), vary rhythm, let the first (context) line breathe a touch slower before picking up pace. Run the humanizer gate on spoken scripts too.

Everything else (Understanding-first sourcing, name-the-subject "self-storage" rule, writing-craft + humanizer gates) applies. Pull the topics FROM the filed Understanding, not from memory or the clip titles.

**DELIVERY (Ep11): Joe's final ask was a combined Word doc**, one clean block per topic laid out **CONTEXT (open with this) → WHAT TO TALK ABOUT → CTA (finish strong)**, title header + a one-line note that same content goes to IG/TikTok/FB and Joe records freely. Mark any optional 5th topic "(optional)". Apply the BANNED-PHRASE swaps silently BEFORE building the doc (don't ship a banned phrase and then flag it — fix it in place). Build with `python-docx` via `C:/Python313/python.exe` (it has the package; git-bash python may not). Deliver as a bare `MEDIA:<abs path>` line. Proven generator: `C:\Users\somea\SM_Ep11\gen_shortform_doc.py` → `SM_Ep11_ShortForm_Topics.docx`.

### Reusable SM episode TYPOGRAPHIC MOTION spine (SECONDARY — lower watch-time; prefer the hook-wrap above) — copy `SMFirstTimerEdge`/`SMTooYoung`, don't rebuild
Each SM episode's motion idea is a 4-scene Remotion composition built on a shared, proven template in `C:\Users\somea\BrandAssets\_remotion\src\` (SM brand spine: navy `#0B1322`/`#10182B`, blue `#2E7DF6`/`#6FA6FF`, Fraunces serif headlines + Barlow Condensed masthead + Montserrat body; masthead "STORAGE MOGULS · Operator Intelligence", footer "PRACTITIONERS, NOT PROFESSORS." + storagemoguls.ai). The structure that works: `BG` (aspect-responsive gradient + dot grid + drifting blue radial glow + inset frame), always-on `Masthead` + `Footer`, an **aspect-aware `Stage`** wrapper (`const tall = height/width >= 1.5;` → bigger symmetric vertical padding in 9:16 so centered content reads as breathing room, NOT a void; cards/stats switch `flexDirection` row→column when `tall`), and a `<Series>` of 4 scenes (hook → facts/count-up stats → reframe/payoff with an animated underline sweep → close with episode label + URL underline sweep). Register THREE compositions per piece in `Root.tsx` (`...Square` 1080×1080 for IG/FB feed, `...Reel` 1080×1920 for Reels/Stories, `...Wide` 1920×1080 for X/YouTube), each `component={SMX}` with the same `durationInFrames`. To make a new episode's motion: copy `SMTooYoung.tsx`, swap the 4 scenes' copy (written FROM the understanding), add the 3 `<Composition>` entries + a `SM_X_FRAMES` const. The same square serves IG+FB; build the 16:9 as the X-ready asset even though SM Metricool has no X. QA: `remotion still` per scene mid-frame during iteration, then render the MP4 and audit a frame-per-second contact sheet across the FULL runtime (the scene seams are soft cross-fades on the shared navy spine, NOT black gaps — that's correct). Deliver MP4s to `~/Downloads/SM_Ep<NN>/` for Joe's review; Cloudinary upload happens at the Metricool-routing stage, not for motion review.

## Content Output Per Episode

Each episode should generate **at minimum 5 pieces of content:**

### 1. LinkedIn Post (SM Brand Account)
- **Format:** Text post, 150–250 words
- **Structure:**
  - Hook: The most surprising or valuable insight from the episode — one sentence
  - 2–3 short paragraphs expanding the story or lesson
  - CTA: the two-step friction-free road map — see "📣 CAPTION CTA + FUNNEL" above. NOT just "full episode on YouTube" (Joe rejected that as incomplete, Ep09): close with the Follow ask + the warm storagemoguls.ai community invite, plus the episode pointer ("drops Tuesday" / "is live today").
- **Tone:** Educator-practitioner. Joe is the host but this is the brand account — write as the brand, not as Joe personally. Third-person reference to Joe is fine: *"Joe and [Guest] broke down..."*

> **⚠️ VOICE TENSION — confirmed Ep03, resolve don't guess:** The pre-written posts in the Drive captions doc are frequently written in **Joe's FIRST person** ("I sat down with…") and tagged **`#JoeDowns`** — which contradicts the brand-account third-person spec above. These two conventions conflict. When the approved base is first-person:
> 1. Keep the approved first-person posts intact as the base (do NOT silently rewrite them to third-person — that's "rewriting from scratch," which is against the rules).
> 2. If you adapt POST 1 into the brand third-person convention, **flag the discrepancy explicitly in your output** and offer to flip it back to match the approved doc. Let Joe decide which voice the SM brand account actually publishes in — do not assume.
> The unresolved question for this brand: does the SM account post in Joe's first-person voice (matching the Drive docs + `#JoeDowns`) or in brand third-person? Until Joe confirms, surface it every time.

**Example (Ep03 — Sydnie Wilda):**
> Some storage facilities are losing value long before the owner decides to sell.
>
> On the Storage Moguls Podcast, Joe sat down with Sydnie Wilda from Anytime Storage to break down where operators quietly fall behind — and what an experienced acquirer sees when they walk a property the owner thinks is running fine.
>
> The gap between what an operator believes their facility is worth and what a buyer is actually willing to pay is almost always an operations problem, not a market problem.
>
> Full episode on the Storage Moguls YouTube. Link in bio.
>
> #StorageMoguls #SelfStorageInvesting #StorageOperator #StorageInvestor

### 2. Instagram / Reel Caption
- **Format:** Short, punchy — 3–5 lines max
- **Structure:** Hook + 1 expansion + CTA + hashtags
- **Character limit:** Under 150 words
- **Hashtags (5–8, end of post):**
  `#StorageMoguls` `#SelfStorageInvesting` `#StorageInvestor` `#StorageOperator` `#CommercialRealEstate` `#PassiveIncome` `#RealEstateInvesting` `#DealFlow` `#SelfStorage`

### 3. Instagram Static Post Caption
- **Format:** 50–100 words
- **Goal:** Educate around the episode's core insight
- **Structure:** Key lesson from episode → brief context → CTA

### 4. YouTube Description
- **Format:** 100–150 words
- **Line 1:** Episode title + one-sentence hook (shows before "more")
- **Body:** 3–4 bullet points on what the viewer will learn
- **CTA:** Subscribe + storagemoguls.ai + joe@storagemoguls.ai
- **Hashtags:** 3 max at the very end

### 5. Promo Video Caption
- **Format:** Match the clip content exactly — do not add angles not spoken in the clip
- **End with:** "Full episode on the Storage Moguls YouTube — link in bio"
- **PITFALL (Ep03):** The Promos folder gives you clip *file names* (e.g. "Offensive Customer Service and Reviews.mp4"), not the actual cut. A file name is a hint, not the content. When you caption from the name alone, **say so in your output and flag it for confirmation** ("caption matched to clip title — confirm it covers X before publishing"). Never assert a clip contains a specific number/story you only inferred from the filename.

### 6. Facebook Post (if applicable)
The SM brand has a Facebook presence. Facebook posts can be slightly longer and more conversational than LinkedIn. Use the LinkedIn post as the base and loosen the tone slightly — Facebook audience skews slightly more general investor/operator vs. LinkedIn's more professional frame.

## Extracting Multiple Topics Per Episode

Storage Moguls episodes are deal-heavy and operator-focused. After reading the transcript or captions doc, identify:

1. **The deal insight** — what happened in the deal that others wouldn't expect
2. **The operator lesson** — what the guest learned running the facility
3. **The underwriting angle** — a number, ratio, or metric discussed
4. **The market observation** — something about the current storage market
5. **The mindset moment** — how the guest thought through a hard decision

Each is a standalone post angle. The pre-written captions typically cover 1–2. Extract the remaining from the transcript. Feed unused angles into the `joe-from-podcasts` skill for Joe's personal LinkedIn.

## Tone Rules — SM Podcast Brand Voice

- **Educational but grounded.** Every post should make the reader slightly smarter about storage.
- **Guest-respectful.** When a guest is featured, they get credit. The episode is a collaboration, not a Joe monologue.
- **Operator-credible.** The content speaks to people who are doing deals or trying to — not curious observers.
- **No hype.** No "incredible episode." No "you don't want to miss this." Let the insight sell itself.
- **Specific over vague.** "40 non-paying tenants" is better than "serious collections issues."

**Phrases to NEVER use:**
- "Incredible guest"
- "Amazing episode"
- "You won't want to miss this"
- "Drop a like and subscribe"
- "Smash that notification bell"

## HARD RULE — Attribute correctly, never fabricate

SM episodes are guest-driven deal stories, so the experience usually belongs to the GUEST, not Joe. This makes correct attribution critical.

> **⛔ SOLO episodes flip this (Joe, Ep10 July 2026).** Some episodes have NO guest — the listener is the guest and Joe teaches directly (folder named e.g. `10 Solo`, mp3 `SM 010 SOLO FINAL.mp3`, and the transcript opens "I'm Joe Downs… Today, no guest, just me"). On a solo episode: (1) every insight, number, and deal IS Joe's own — write it in Joe's first person with no "Joe and [Guest]" framing; (2) the VOICE TENSION box does NOT apply — first-person is unambiguously correct, no flag needed; (3) the promo-poster "named guests + avatar circles" rule has no guest to name — a promo poster would sell the topic + Joe as host instead; (4) attribution downstream to `joe-from-podcasts` is clean (it's all Joe's), no owner-tagging needed. Everything else (Understanding-first, message-first posters, writing-craft + humanizer gates, CTA road map) is identical.

- **A guest's deal, number, or lesson is the guest's** — write it as "Joe and [Guest] broke down…" or "[Guest] explained…", never as something Joe personally did. Don't invent a host detail that isn't in the transcript/notes.
- **The "ADDITIONAL ANGLES FOR joe-from-podcasts" must tag each angle's true owner** (e.g. "Sydnie's facility-value insight" vs. "Joe's underwriting observation"). The personal-feed skill writes in Joe's first person and trusts this label — mislabeling a guest's experience as Joe's produces a fabricated personal post downstream.
- Specific numbers (e.g. "40 non-paying tenants") must come from the source. Plausible ≠ true; never manufacture a figure to sharpen a post.

## SM Podcast vs. Storage Moguls Brand Content

The SM podcast generates posts about specific episodes and guests. The broader SM brand content (education, promotions, community) is handled by the `linkedin-posts` skill. Keep these lanes separate:

| This Skill | linkedin-posts Skill |
|---|---|
| Episode-specific posts | Education/how-to posts |
| Guest features | Promotional posts |
| Episode promo captions | Community engagement posts |
| YouTube descriptions | Behind the scenes posts |

## 🔒 WRITING-CRAFT GATE — run BEFORE the humanizer (non-negotiable)

Apply the **`writing-craft`** skill to every piece and every platform variant before the humanizer pass. This is basic written-English correctness, separate from voice and from de-AI: infer meaning when a lifted phrase isn't clear standing alone (don't transcribe unclear spoken fragments verbatim — the "the 46th" → "they just want your address" rule), never stitch words that don't parse cold, use the correct word (nothing invented or mis-sensed), paraphrase faithfully. Read each line with zero context — if it doesn't make clean correct sense, rewrite it. Then proceed to the humanizer gate.

## 🔒 HUMANIZER GATE — run on EVERY piece before output (non-negotiable)

Joe's standing rule (June 2026, enforced across multiple skills): **every caption/post gets a humanizer pass before it reaches him — and the short forms / captions are the repeat failure** because they get treated as "just trim the long one" and keep stiff AI connective tissue.

- Load/apply the **`humanizer`** skill on the LinkedIn post AND every platform variant (IG/Reel/static/YouTube/Facebook/promo caption).
- **Literal dash scan first:** ZERO em dashes `—` or en dashes `–` in the final copy. Joe treats a stray dash as proof the pass didn't happen. Replace with a period, comma, or two sentences.
- Kill the usual tells: "It's not just X, it's Y", rule-of-three, "-ing" tails, signposting, filler, copula-avoidance.
- **Read each short form aloud in your head — does it sound like a real person, not a marketer?** If it sounds assembled, rewrite before saving.
- State honestly what you scanned for. Never claim you humanized it if you didn't actually scan.

## Output Format

```
---
EPISODE: [Number + Title + Guest]
SOURCE: [Drive link or Notion link]

POST 1 — LinkedIn (SM Brand Account)
[Full post text + hashtags]

POST 2 — Instagram Reel Caption
[Caption + hashtags]

POST 3 — Instagram Static Caption
[Caption]

POST 4 — YouTube Description
[Description]

POST 5 — Promo Video Caption
[Caption — or "No promo clip found"]

POST 6 — Facebook Post
[Post text]

---
ADDITIONAL ANGLES FOR joe-from-podcasts SKILL:
[List 2–3 insight angles from this episode that could become Joe's personal LinkedIn posts — one-line hook for each]
```

## Maintenance Notes

- Add each processed episode to the Social Media Worksheet (Google Sheets)
- Cross-reference with Notion Moguls Operations Hub — some episodes have prep pages there
- Canva links in Drive docs should be included alongside their matching post in the output
- The SM podcast and the SSI podcast (Scott Meyers) are separate — do not conflate them

---
*Sources: Storage Moguls Podcast Drive Folder, Notion Moguls Operations Hub, Ep03/Ep05 captions docs, Social Media Accounts Audit*
*Skill created: June 2026*
