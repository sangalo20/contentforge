---
name: joe-from-podcasts
description: Transform insights from the Successful Idiots OR Storage Moguls podcasts into Joe Downs' PERSONAL LinkedIn posts — extract the idea, drop the episode reference, write it as Joe's own lived observation. Trigger when asked to "write Joe's LinkedIn post from the SI/SM episode about X", "turn this podcast insight into a post for Joe", "Joe's personal post based on [guest/topic]", "create a Joe post from the podcast content — don't make it sound like a promo", or when storagemoguls-podcast / successfulidiots-podcast output an "ADDITIONAL ANGLES FOR joe-from-podcasts" section. Depends on successfulidiots-podcast and storagemoguls-podcast. NOT for brand-account posts (use those skills) and NOT for Joe's non-podcast storage education (use linkedin-posts).
---

# Joe's Personal LinkedIn Content from Podcasts

Takes insights from **either** the Successful Idiots podcast or the Storage Moguls podcast and transforms them into Joe Downs' personal LinkedIn posts.

The key mechanic: **extract the insight, drop the episode reference.**

Joe does not post "In episode 24 of Successful Idiots, Peter and I talked about..." He posts the *idea itself* — as his own lived observation, in his own voice. The podcast is invisible. The thinking is visible.

Done well, these posts perform better than direct episode promos because they read as Joe's genuine perspective — not marketing. When readers discover the podcast separately, they already trust Joe because they've seen him think in public.

**Depends on:** `successfulidiots-podcast` skill + `storagemoguls-podcast` skill

## 🧱 CONTENT STRUCTURE — IDEA → PLATFORM → TYPE (Joe locked, June 2026, applies to JOE'S accounts too)

Joe has his own **LinkedIn, Instagram, Facebook, and X** — so his personal content follows the SAME idea-driven structure as the brand accounts (full spec in `brand-knowledge-hub` → "CONTENT STRUCTURE"). Don't treat this skill as LinkedIn-only anymore.

**IDEA / story → PLATFORM → TYPE (poster/reel/carousel/story/static/video/description/thread) → CONTENT + VISUAL paired.**
- Pull the episode's distinct ideas (or the supplied angle), then for EACH idea choose the platform + type mix that FITS it across Joe's accounts — NOT a fixed template. A promo-folder clip might carry one idea across all of Joe's platforms; a simple idea might be just one IG poster, an FB video, or a one-line X post; only a rich sequential idea warrants a carousel (then build every slide). Not every idea gets every platform.
- Each idea = its own fitting spread; that variety is the point. Multiple captions of one type stay under the same idea.
- LinkedIn is still the natural MASTER to draft first, then repurpose to Joe's IG/FB/X per platform standard — but the deliverable is the multi-platform set for the idea, not LinkedIn alone.
- File each piece into Content Pieces with `Idea / Angle` + `Type` + `Platform`, **Account = Joe Personal**, **Brand = Joe Downs**, grouped under one Content Library campaign.
- Present to Joe ONE PIECE PER MESSAGE: content + its visual together, as he'd post it, then wait for "next".

## The Core Principle

**Wrong (podcast promo framing):**
> "On the latest Successful Idiots episode, Peter Swain and I broke down Google Maps ranking and why your competitor's reviews matter more than your location. Check it out — link in bio."

**Right (Joe's voice, insight first):**
> The Google Maps ranking process completely shocked me.
>
> No matter how close you are to your client — if your competitor has more reviews, your client is more likely to see them pop up first.
>
> Proximity doesn't win. Reputation does.
>
> I spent years assuming physical location was the primary driver of local visibility. It's not. It's social proof at scale, indexed in real time.
>
> If you run a storage facility and you're not actively managing your review count — someone with a worse location and a better review strategy is eating your walk-in traffic right now.

The insight came from a podcast. The post reads as Joe's observation. That's the transformation this skill performs.

## When to Trigger This Skill

- "Write Joe's LinkedIn post from the SI episode about [topic]"
- "Turn this SM podcast insight into a post for Joe"
- "Joe's personal post based on [guest/topic]"
- "Create a Joe post from the podcast content — don't make it sound like a promo"
- When `successfulidiots-podcast` or `storagemoguls-podcast` outputs "ADDITIONAL ANGLES FOR joe-from-podcasts" — those angles feed directly into this skill

Do NOT use this skill for:
- SI brand account posts (use `successfulidiots-podcast`)
- SM brand account posts (use `storagemoguls-podcast`)
- Joe's storage education content not drawn from a podcast (use `linkedin-posts`)

## Input Sources

### Source A — Successful Idiots Episodes
- **Drive folder:** Successful Idiots (shared by Gisele Nzugu)
- **What to draw from:** AI tools for business, outreach specificity, wealth mindset, automation, passive income, entrepreneurship, business systems
- **Insight type for Joe's LinkedIn:** Personal brand / mindset / business philosophy posts
- **Audience crossover:** These posts attract entrepreneurs and business builders — not just storage investors. They expand Joe's reach beyond the storage niche.

**Known episode angles:**
- EP24: Specificity of outreach — why vague asks get ignored / AI exposing blind spots
- EP25: AI systems operators use to outperform / passive income vs. active hustle / wealth building
- EP28: The cost of waiting / using AI to get started

### Source B — Storage Moguls Podcast Episodes
- **Drive folder:** https://drive.google.com/drive/folders/1vA1TnX7RRhW74gJDavUhRxvfhToumgi-
- **What to draw from:** Deal stories, guest operator insights, underwriting lessons, market observations, operations details
- **Insight type for Joe's LinkedIn:** Practitioner insight / deal finding / story posts
- **Audience crossover:** These posts speak directly to storage investors — core audience for Storage Moguls

**Known episode angles:**
- Ep03 (Sydnie Wilda): Facilities losing value before the owner knows it / the gap between perceived and actual value
- "The Seller Stopped Operating" (Adam + Kirby): What happens when a seller checks out before closing / acquisition dynamics
- Ep05 (Matt Rosendale): First deal psychology / Minnesota market / what changes on the second deal
- Ruben Kanya episode: How smart operators are acquiring and scaling / the first-time mistake
- Patrick Lonergan episode: What most people still misunderstand about self-storage

## The Transformation Process

When given a podcast episode or a specific insight angle, follow this process:

**Step 1 — Extract the raw insight**
Identify the single most surprising, counterintuitive, or practically valuable idea from the episode segment. One idea only. Not the episode summary — the sharpest point.

**Step 2 — Find Joe's personal connection to it**
Ask: When did Joe encounter this in his own work? What deal, conversation, or observation does this connect to? If the insight came from a guest, what does it mean from Joe's vantage point as the host/operator?

**Step 3 — Write the hook as Joe's observation**
The first line should sound like something Joe noticed — not something he heard. Reach for hooks that are TRUE by construction: a reframe ("Most people try AI exactly once."), an opinion ("Your best emails are landing in spam — and it's your own fault."), or an observation drawn from the source. Do NOT invent a specific personal event Joe didn't have. ⚠️ Hooks like "I tested this on three different facilities" or "I spent years getting this wrong" are only allowed if that event is real per the source or soul.md. If you don't have a true personal anchor, use an idea-first hook instead of manufacturing a memory. See the HARD RULE below.

**Step 4 — Expand in Joe's voice**
Short paragraphs. One idea per paragraph. White space. Declarative sentences. No jargon. Specific over general.

**Step 5 — Close with the implication**
What does this mean for the reader? What should they do differently? One sentence. No list of action items.

**Step 6 — Optional: light attribution**
If relevant, a single soft line attributing the conversation — not the episode:
- "Came up in a conversation with Peter Swain recently."
- "A guest on the Storage Moguls podcast made this point better than I ever have."
- "This came out of a deal conversation that I'm still thinking about."

Never: episode number, podcast name in the hook, or a link in the post body. CTA (if any) goes at the very end.

## Content Guardrails — Joe's Voice Protection

The biggest risk with this skill is a post that reads like a podcast recap or a promo. These are hard stops:

❌ **Never open with a podcast reference:**
- "On the latest episode of..."
- "In my conversation with Peter..."
- "If you haven't listened to..."

❌ **Never recap the episode:**
- "We covered X, Y, and Z..."
- "The episode goes deep on..."
- "Here's what we talked about..."

❌ **Never use promotional language:**
- "You need to hear this"
- "This episode is fire"
- "Don't sleep on this one"

❌ **Never let the podcast brand dominate Joe's brand:**
- The post is Joe's thought. The podcast is the origin. That order matters.
- If someone reads the post and feels like they were sold to, rewrite it.

✅ **The test:** Could Joe have written this post even if the podcast didn't exist? If yes — it's right. If the post only makes sense as a podcast promo — rewrite it.

⚠️ **Second test (truth):** "Could Joe have written it" is NOT the same as "is it true." A fabricated anecdote can pass the promo test and still be a lie. Every concrete claim in the post must trace back to either (a) the source transcript/notes, or (b) Joe's documented background (soul.md / Notion). If it traces to neither, cut it or reframe it as opinion.

## HARD RULE — No Fabricated Experience

> 📎 **Joe's REAL biography/origin is on file — use it instead of inventing.** Before writing ANY origin / first-deal / "why I got into storage" / credibility post, read `references/joe-real-biography.md` (his actual arc in his own words from the Ruben Kanya + Patrick Lonergan guest-podcast transcripts: financial advisor → 9/11 → bar that failed/-$100K → $90M in 1031 syndications → 2008 → distressed debt → Scott Meyers' "no toilets, tenants, trash" email + the "80% mom-and-pop" line that hooked him; he's never rented a unit). This file exists BECAUSE this generator fabricated a first-deal story in June 2026 and Joe rejected it. If a needed detail isn't there and isn't in another source, write the point without the specific or ask Joe — never invent.

This is the single most important rule in this skill. **Never invent a first-person story, deal, memory, number, client, or result for Joe.** Plausible is not the same as true. A made-up anecdote that "sounds like Joe" is still fabrication and will damage his credibility if a reader, partner, or Joe himself knows it didn't happen.

When the insight came from a **guest** (e.g. Peter Swain's daily-email workflow, his $30K result, his squeaky-chair email), that is the GUEST's experience — not Joe's. You have three honest options:

1. **Attribute the experience** — write it as Joe observing someone else's result: *"I watched someone flip this completely…"* or use the soft attribution line (*"a point Peter made recently"*). Never transplant the guest's story into Joe's mouth as if he lived it.
2. **Anchor to a REAL Joe fact** — connect the idea to something documented about Joe: his Kolbe 5-4-9-2 (Quick Start 9, low Follow Thru/Implementor — he delegates systems, doesn't build them), his Core Business Rule ("build so the next person up can replace us"), his $11M+ raised / $29M+ acquired, raising money for 1031 commercial syndications 20+ years ago, Strategic Coach / Who Not How, the Scott Meyers / SSI partnership. If you reference a Joe fact, it must be in soul.md or the source — don't guess at specifics.
3. **Keep it idea-only** — make the post a clean argument/observation with NO personal anecdote at all. A strong reframe doesn't need a manufactured backstory.

**Before finalizing any post, audit every first-person sentence:** "Did Joe actually do/say/experience this, per the source or his background?" If the honest answer is "no" or "I made it up to sound good" — rewrite it. When in doubt, flag it in NOTES FOR REVIEW so Joe can confirm or supply the real detail, rather than inventing one.

> 📎 **See `references/fabrication-audit-and-provenance.md`** for the full audit gate, the provenance-tracing procedure (session_search to find a claim's FIRST appearance; verify WHOSE story a transcript tells before reusing it), the verified `.docx` transcript-reading recipe, the storage-domain trap (month-to-month is universal = never a risk), and **Joe's REAL verified origin story** (Ruben Kanya podcast) to use instead of any invented version. Born from a June 2026 incident where a fabricated origin + a wrong month-to-month line reached scheduled posts because the no-fabrication rule lived only here and not in `linkedin-posts`/`linkedinreview` (now fixed in all three).

## Matching Insights to Joe's LinkedIn Pillars

Route each extracted insight to the correct pillar from Joe's 5-day weekly schedule:

| Podcast Source | Most Likely Joe Pillar |
|---|---|
| SI — AI, outreach, business systems | Personal Brand / Mindset (Thursday) |
| SI — Wealth, passive income, entrepreneurship | Personal Brand / Mindset (Thursday) |
| SM — Deal stories, guest operator moments | Story / Credibility (Friday or Monday) |
| SM — Underwriting, operations, market data | Practitioner Insight (Monday) or Education (Tuesday) |
| SM — Partnership, co-GP, team dynamics | Partnership / Business Building (Wednesday) |

## 🔒 WRITING-CRAFT GATE — run BEFORE the humanizer (non-negotiable)

Apply the **`writing-craft`** skill to every piece and every platform variant before the humanizer pass. This is basic written-English correctness, separate from voice and from de-AI: infer meaning when a lifted phrase isn't clear standing alone (don't transcribe unclear spoken fragments verbatim), never stitch words that don't parse cold, use the correct word (nothing invented or mis-sensed), paraphrase faithfully. Read each line with zero context — if it doesn't make clean correct sense, rewrite it. Then proceed to the humanizer gate.

## 🔒 HUMANIZER GATE — run on EVERY piece before output (non-negotiable)

Joe's standing rule (June 2026, enforced across multiple skills): **every piece of content gets a humanizer pass before it reaches him — and the short forms / captions are the repeat failure** because they get treated as "just trim the long one" and keep stiff AI connective tissue.

- Load/apply the **`humanizer`** skill on the long post AND every platform variant (IG/X/short caption).
- **Literal dash scan first:** ZERO em dashes `—` or en dashes `–` in the final copy. Joe treats a stray dash as proof the pass didn't happen. Replace with a period, comma, or two sentences.
- Kill the usual tells: "It's not just X, it's Y", rule-of-three, "-ing" tails, signposting, filler, copula-avoidance.
- **Read each short form aloud in your head — would Joe say this?** If it sounds assembled, rewrite before saving. Short flat declaratives only.
- State honestly what you scanned for. Never claim you humanized it if you didn't actually scan.

## Output Format

```
---
SOURCE: [Podcast + Episode + Insight angle]
PILLAR: [Which Joe LinkedIn pillar this fits]

JOE'S POST:
[Full post, ready to copy-paste]

---
OPTIONAL SOFT ATTRIBUTION LINE (if appropriate):
[One line — include or exclude depending on context]

NOTES FOR REVIEW:
[Any flag about tone, accuracy, or whether Joe should verify the insight before posting]
```

## Replying to COMMENTS on an episode promo (reactive — two voices)

A recurring ask (Joe, Jun 2026): someone comments on an episode promo video/post, and Joe wants a **reply to that comment** — usually in **two versions: one for the BRAND account that posted the promo (SI or SM page) and one for Joe's personal account.** This is reactive (responding to a real comment), distinct from the proactive sourcing in `linkedin-engage`.

**Process:**
1. **Pull the real episode data first.** Find the episode folder in Drive, read Show Notes/Blog (see the .docx method above), and ground every specific (numbers, guest claims, package contents) in what was actually said. Do NOT reply from the promo caption alone — you'll miss the substance and risk fabricating.
2. **Read the commenter's actual point.** The strongest reply AGREES and BUILDS on a sharp comment, or adds one practitioner angle. Reference something specific they said (proves Joe read it). Name the commenter.
3. **Write per-voice:**
   - **Joe personal voice** — peer-to-peer, leads with the insight that's genuinely Joe's lane (mindset, deal psychology, "the operators who get this early…"), credits the commenter/guest, **NO CTA, NO link** (same comment-voice rules as `linkedin-engage`).
   - **Brand-account voice** — written AS the brand (third-person "Joe"/"David"). Energy matches the brand (SI = punchier; SM = practitioner). **Promotional brand replies CAN close with a soft "Follow the page" / "full episode" CTA when Joe explicitly asks for promotional** — that's the one place a CTA is allowed, and only on the brand's own post. Joe's personal reply never carries one.
4. Attribution stays honest: a guest's result/story (e.g. David Merkin's "banks hate operating real estate", the lender-package checklist; Peter Swain's live demo) belongs to the guest — Joe can cite it, not claim it. Same HARD RULE as the rest of this skill.

Output both versions clearly labeled, plus a one-line note on what's drawn from the episode vs. the commenter.

## Batch Mode

When running this skill in batch (generating multiple Joe posts from a single episode), produce one post per extractable angle. Label each with its angle name. Do not combine two insights into one post.

A strong SI episode typically yields 2–3 Joe personal LinkedIn posts.
A strong SM podcast episode typically yields 2–4 Joe personal LinkedIn posts (often more — guest conversations are story-rich).

These feed into Joe's weekly posting calendar alongside the `linkedin-posts` skill output.

## Protecting Joe's Image

The Successful Idiots brand has its own identity — energetic, entrepreneur-focused, AI-forward. Joe's personal LinkedIn has a different identity — measured, practitioner, storage-grounded.

When drawing from SI episodes, **translate the insight into Joe's LinkedIn register**, not SI's brand register.

| SI Brand Register | Joe's LinkedIn Register |
|---|---|
| "Entrepreneurs who move fast win" | "The operators I know who close the most deals are not the ones who know the most. They're the ones who move on incomplete information and correct as they go." |
| "AI is changing everything" | "I handed a process I've been doing manually for two years to an AI system. It took 40 minutes instead of three days. The output was better." |
| "Stop playing small" | "The difference between the operators doing one deal a year and the ones doing five isn't access. It's what they do between the deals." |

The idea is the same. The register is different. Joe's voice is always the practitioner — not the hype man.

> **Note on the table above:** the right-column examples illustrate *register and rhythm*, not literal copy. The "40 minutes instead of three days" line is a stylistic sample — do not paste it as a real Joe claim unless that exact thing happened. Match the *voice*, supply *true* details (or none). See the HARD RULE — No Fabricated Experience.

## Visual companion — pair Joe's post with an on-brand poster/video

When a finished Joe post would land harder with a visual (most do, on the personal feed), generate one with the **`brand-poster-design`** skill (load it for the full JD rule set). Pick the format from the content shape: a punchy number/stat → motion **stat reel** or big-stat poster; a mindset/quote line → **minimalist** poster; an authority/story piece → **photo-centric** poster (top-bleed or medallion); data/comparison → **handwritten infographic** (animatable in Remotion). JD brand spine = navy `#0A0E16` + electric blue `#2E6BFF`, Inter + JetBrains Mono, `[ BRACKET LABELS ]`, footer `joedowns.ai` + a 2–3 word attribute line (operator · investor · AI · real estate · development · distressed debt) — **"The Real Reps" CTA is OFF by default**. ALWAYS vision-analyze a photo before using it, frame from its composition (never crop Joe's face), and rotate images. Same honesty rule applies to visuals: don't put a fabricated stat on a poster.

## Downstream home — the Brand Knowledge Hub (Notion)

Finished posts from this skill are the "finished goods" of Joe's content factory. Beyond the weekly Google review doc (via `linkedinreview`), Joe now tracks approval **per-piece in Notion** in the **Content Pieces** database under the Brand Knowledge Hub (see the `brand-knowledge-hub` skill). Each post = one row tagged **Account = Joe Personal**, **Brand = Joe Downs**, with **Joe Approved** + **Partner Approved** checkboxes. When asked to "file these into the hub" or "track approval in Notion", route there. LinkedIn is the master format; platform repurposes become linked child pieces. Records land as **In Review** — never mark approved/published until Joe says so.

## Dependency Note

This skill works best when `successfulidiots-podcast` or `storagemoguls-podcast` have already been run on the episode and the "ADDITIONAL ANGLES" section has been populated. Those angles are the pre-identified starting points for this skill.

If running this skill cold (without a prior podcast skill pass), fetch the episode's captions/transcript doc from Drive directly and run the extraction process from Step 1.

### Reading Drive source docs (.docx) — VERIFIED method (Jun 2026)

Episode Show Notes / Blog / Transcript are uploaded **Word `.docx`** files, not native Google Docs. Two traps, both hit this session:
1. `drive download --export-mime text/plain` returns BINARY garbage on `.docx` (only works on native Google Docs).
2. `read_file` does NOT reliably auto-extract these `.docx` in this environment — it errored "Cannot read binary file". Do not rely on it.

**The method that works:** download the raw file, then extract text with `python-docx` on **system Python** (`C:/Python313/python.exe` has `python-docx`; the Hermes sandbox/venv python does NOT — `import docx` → ModuleNotFoundError there):
```
# 1. download raw (absolute Windows path; $HOME / /c/ paths can mis-resolve when WRITING py files — use C:\Users\somea\...)
GAPI="python C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/google_api.py"
$GAPI drive download <FILE_ID> --output /c/Users/somea/<name>.docx
# 2. extract with system python (write a tiny script that opens docx.Document(path) and prints non-empty paragraphs)
C:/Python313/python.exe extract.py
```
For a long transcript, slice from a known marker (`joined.find("...")`) instead of dumping all of it. Clean up the temp `.docx` + script when done.

## Where this output lives — and what counts as "the content we created"

⚠️ **Lesson (Joe corrected this, June 2026):** "the content" Joe means is the
output of THIS pipeline — generated posts in the weekly LinkedIn review docs —
NOT the already-posted social docs sitting in Drive (e.g. "Storage Moguls_Social
media content", "Successful Idiots EP 25"). Those old docs are *already
published* material; do not present them as the work we produced. When asked to
surface or catalog "the content we created", pull from the `linkedinreview`
weekly docs and this skill's / the brand skills' output, not random Drive posts.

**The account distinction is the whole point — never blur it:**
- **Joe's personal account** posts = this skill (`joe-from-podcasts`): insight
  extracted, podcast invisible, first-person Joe voice.
- **Brand account** posts = `storagemoguls-podcast` / `successfulidiots-podcast`:
  written AS the brand, third-person "Joe".
- Both are derived from the two podcasts but go to **different accounts**. Keep
  them as separate records/sections; tag which account every piece belongs to.

**LinkedIn is the MASTER format, generated first, then repurposed.** Joe's model:
produce the LinkedIn version, get it partner-approved, THEN repurpose it into
other platforms (Instagram, Facebook, YouTube, Shorts) matching each platform's
standard. So far only LinkedIn has been done — by design. A platform variant is a
*derivative* of its LinkedIn master, not a fresh creation.

**Content Library (Notion) — the catalog of output.** When logging produced
content into Joe's Brand Knowledge Hub → Content Library
(`2399bec0-1197-422d-a21c-5ff2500fa39d`), set:
- `Brand` = the **account** (Joe Downs vs. a brand) — this is the account filter.
- `Status` = `In Review` while it's in a review doc awaiting partner sign-off
  (NOT `Approved` — that, and any Notion SM Content Tracker mark, waits on Joe's
  explicit verbal approval; same hard rule as `linkedinreview`).
- `Source` = the review-doc link; body holds the actual post text + provenance.
- When platform variants get created, link them to the LinkedIn master via the
  Content Library's `Related Content` self-relation (master → derivatives).

---
*Sources: Successful Idiots Drive Folder, Storage Moguls Podcast Drive Folder, Joe Downs LinkedIn Skill, Social Media Accounts Audit, SI Social Media Optimization Strategy*
*Skill created: June 2026*
