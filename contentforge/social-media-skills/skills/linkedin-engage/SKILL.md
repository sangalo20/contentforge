---
name: linkedin-engage
description: Surface 10–15 high-relevance LinkedIn posts from Joe Downs' target audience and draft a peer-voice comment for each, then route them into a Google Doc review batch for Joe to approve and post himself. Trigger when asked to "find posts for Joe to comment on", "run the LinkedIn engagement batch", "linkedin-engage", "draft LinkedIn comments", or "who should Joe engage with today". Sourcing is browser-assisted, logged in as Joe (no public API exists for feed scraping). Comments are replies — NO hooks, NO CTAs, NO link-drops. Joe posts approved comments himself. Companion to linkedin-posts (generation) and linkedinreview (post approval).
---

# SKILL.md — LinkedIn Engagement Pipeline (linkedin-engage)

**Skill ID:** linkedin-engage
**Owner:** Joe Downs
**Companion to:** linkedin-posts (generation), linkedinreview (post review)
**Output:** A Google Doc batch of 10–15 posts + draft comments for Joe to approve and post
**Last updated:** June 2026

---

## What This Skill Does

Finds LinkedIn posts from Joe's **target audience** that are worth engaging with, and drafts a **comment in Joe's voice** for each — grounded in his knowledge base and the storage-investing expertise that defines his brand.

This is **engagement**, not publishing. Joe builds brand and relationships by showing up intelligently in other people's comment sections — not just broadcasting his own posts. This skill is the inbound-relationship engine; `linkedin-posts` is the outbound-broadcast engine.

**Separation of concerns (deliberate, matches the existing pipeline):**
- `linkedin-posts` = Joe's own posts (broadcast).
- `linkedinreview` = the post-approval doc flow.
- `linkedin-engage` = finding others' posts + drafting Joe's comments (OUTBOUND engagement, LinkedIn, batch).
- `audience-comment-replies` = replying to INBOUND audience comments/DMs/questions that came TO Joe, on ANY platform (IG/YouTube/FB/podcast/LinkedIn). If someone asked Joe a question and he wants a reply in his voice, that's `audience-comment-replies`, not this skill — this skill is for going out and finding strangers' posts to comment on.

Keep them separate. Changing how Joe comments never touches how he posts.

---

## The Hard Constraints (read first — these are non-negotiable)

### 🔒 Volume cap: 10–15 posts per run. Never more.
Joe set this directly. 100 comments/day is a spam signal that gets accounts flagged and drops engagement to noise. The win is the **right 10–15**, not volume (Steve Jobs lens — subtraction). If a run surfaces more than 15 strong candidates, keep the top 15 by relevance and note the overflow; do not pad a thin run to hit 15 either — quality over quota.

### 🔒 Joe posts the comments himself. The agent NEVER auto-posts.
There is **no public LinkedIn API** for posting comments. The only way to auto-post is bot-style browser automation logged in as Joe — which LinkedIn actively detects and punishes with restriction/suspension of his personal account (~7,800 following, his primary thought-leadership channel). That is a permanent risk for a temporary convenience. **We do not do it.** The agent drafts; Joe posts from his own hands. This is the same human-in-the-loop shape as the post pipeline.

### 🔒 Sourcing is browser-assisted and supervised, not silent scraping.
The feed-reading step runs through a browser session **logged in as Joe**. It is an assisted run — the agent navigates, reads, and extracts; it does not run unattended in the background. If the browser is not logged in, STOP and tell Joe; never attempt to log in on his behalf with stored credentials.

### 🔒 A comment is a reply, NOT a post.
Comments follow a completely different set of voice rules than `linkedin-posts` (below). Do not reuse the post template. No hooks. No CTAs. No link-drops. No "Storage 100 is free."
**Exception — brand-PAGE replies (see "Single targeted reply" mode below):** a comment posted from a brand PAGE account (Storage Moguls, Successful Idiots) on the brand's OWN promo post MAY lead with substance and close with a soft page CTA (e.g. "Follow the page for more like this"). The no-CTA rule is absolute for JOE'S PERSONAL account; it relaxes for a brand page replying in its own house. Always confirm which account a requested reply is for before applying the rule set.

### ⚡ Velocity rule — for a SINGLE requested reply, draft first, don't interrogate.
Joe corrected this directly (Jun 2026: "you are taking too long"). When he hands you a specific post + context and asks for a reply (especially "urgent"), **write the comment(s) immediately** — do NOT fire `clarify` calls to nail down scope, and do NOT pad the reply with a long rationale. A short clarify is only warranted when a genuine fork exists that changes the output (e.g. "which two brands?"). For "give me a reply in Joe's voice," just produce it. Lead with the deliverable; keep notes to 1–3 tight bullets max. The full search→filter→batch workflow below is for BATCH runs, not one-off replies.

### 🪶 Don't over-process small asks — match the output to the size of the request.
Joe corrected this directly (Jun 2026: "Why are you putting comments in docs?"). A one-off comment or reply asked for in chat is a **small ask** — the answer belongs **inline in the chat reply**, not wrapped in a Google Doc, Notion row, or any review artifact. Review docs, per-piece Notion tracking, and approval surfaces exist for FULL BATCHES (10–15 engagement comments, or a weekly post batch) — not for one or two comments. When in doubt, deliver inline and offer to formalize it ("want this in the review doc?") rather than defaulting to heavyweight processing. This mirrors the velocity rule: small request → fast, lightweight output.

---

## When to Trigger (batch mode — Mode A)

Trigger when asked to:
- "linkedin-engage" / "run the LinkedIn engagement batch"
- "find posts for Joe to comment on"
- "draft LinkedIn comments"
- "who should Joe engage with today"
- "find me 10-15 posts to comment on"

Do NOT trigger for:
- Generating Joe's own posts → that's `linkedin-posts`
- The post-approval doc → that's `linkedinreview`
- Auto-posting anything (never happens)

---

## Mode B — Single targeted reply (NOT a batch run)

A common, distinct request: Joe pastes ONE specific post (often a comment on, or a share of, one of his OWN episodes/promos) and asks for a reply — frequently in **two voices at once**: his personal account AND a brand page (Storage Moguls / Successful Idiots). This is NOT the search→filter→batch workflow. Handle it fast:

1. **Draft immediately.** No `clarify` for scope, no preamble. (See the Velocity rule above — Joe flagged slowness directly.)
2. **Ground it in the real source when the post references a Joe episode.** If the reply is to a post about a specific Storage Moguls / Successful Idiots episode, pull that episode's Show Notes/Blog from Drive (via the podcast skills' Drive recipe) so every claim/number in the comment is true to what was actually said — don't invent specifics. Reading just Show Notes + Blog is enough; no need to parse the full transcript.
3. **Two-voice variants — different rule sets:**
   - **Joe personal:** strict comment voice. Lead with substance, peer-to-peer, credit the other person/guest, NO CTA, NO link. Attribute a guest's experience to the guest (don't transplant it into Joe's mouth).
   - **Brand PAGE (promotional):** lead with the value/insight, then close with a soft follow CTA ("Follow the page for more like this 🎙️"). This CTA is allowed ONLY because it's the brand's own account on its own promo — never on Joe's personal account.
     - ⚠️ **Don't parrot the clip** (Joe corrected this Jun 2026: "just sloppily repeating what is said in the video"). A page comment under the brand's OWN promo must **add** something, not restate what the viewer just watched. Recipe: open with a hook to the *viewer's* experience ("If you've ever taken a 'no' personally…"), fold in a credibility/specificity detail that is NOT in the clip (e.g. "a broker who knows 200+ lenders"), then drive to the full episode + follow. If the draft just summarizes the clip back at them, rewrite it.
4. **Keep them SHORT** unless Joe says otherwise. If he says "make them shorter," cut to 2–3 sentences each — punchy, one idea.
5. **Filing — DEFAULT IS INLINE IN CHAT, NO DOC.** Joe corrected this directly (Jun 2026: "Why are you putting comments in docs?"). For a one-off reply asked for in chat, **deliver the comment(s) right there in the chat reply — do NOT create a Google Doc.** A doc for two sentences is over-processing; the comment is already in front of him to copy. Only build a review Doc when Joe **explicitly** says "send to LinkedIn review" / "put it in a doc." The Google-Doc review surface is for full engagement BATCHES (10–15, Mode A), not one-offs. Single targeted replies are still ENGAGEMENT → never log them in Notion either (same rule as batch). When Joe does ask to route a one-off to a doc, use the `linkedinreview` builder (see technique note below) — NOT the batch `build_engage_doc.py`. **If you created a doc by mistake for a one-off, trash it** (`google_api.py drive delete <id>`) once the comments are delivered inline, so the review folder doesn't accumulate stray single-reply docs.

### Technique — routing comments (not posts) into a review doc
The `linkedinreview` builder (`scripts/build_review_doc.py`, takes `--title`, `--articles <json>`, `--folder`) is article-shaped but works fine for comments: put each comment in the `body`, a descriptive label in `headline` (e.g. "Reply to Eastern Union post — Joe's account"), and fold the source/provenance into the `theme` field so it rides through the TOC. Title convention for a single-reply doc: `LinkedIn Engagement — <subject> reply (<Brand Ep ###>)`. Same review folder `1s0vCsCbqHtPCKCHqScRHk3NHdSidznCX`. Doc stays private; Joe posts the comments himself.

---

## Joe's Target Audience (who to look for)

Joe's ICP — the people whose posts are worth his comment. Source these from his content universe (the six themes, the SM Content Tracker, his deal/operator world):

| Segment | Who they are | Why Joe engages |
|---|---|---|
| **Storage operators** | People who own/operate self-storage, mom-and-pop facility owners, storage developers | Peer credibility; deal flow; the practitioner conversation |
| **RE investors / syndicators** | Multifamily, commercial, syndication GPs/LPs exploring storage | Top-of-funnel for Storage Moguls; positioning Joe as the storage specialist |
| **Aspiring storage investors** | People learning the asset class, asking "how do I find a deal" | Highest-resonance audience; Joe as accessible educator |
| **Capital / LP side** | Passive investors, accredited investors, capital allocators | Investor relations; LP relationships |
| **CRE brokers & lenders** | Storage-active brokers, commercial lenders | Deal sourcing relationships |
| **Entrepreneur / partnership voices** | People posting on team-building, partnership structure, Who-Not-How, leverage | Joe's partnership/mindset lane; broadest shareable audience |

**Topic search terms** (map to Joe's six content themes — search LinkedIn for posts using these):
`self storage` · `self-storage investing` · `storage facility` · `storage acquisition` · `real estate syndication` · `commercial real estate investing` · `passive real estate` · `NOI` · `underwriting deals` · `off-market deals` · `deal flow` · `cap rate` · `real estate partnership` · `capital raising` · `boring cash flow` · `Who Not How`

Prioritize posts that touch the same themes Joe posts on (Practitioner Insight, Education, Deal Finding, Mindset/Positioning, Partnership, Story). A post Joe could have written is a post Joe should comment on.

---

## How to Run

### Step 0 — Preconditions
- Confirm the browser is **logged in as Joe** on LinkedIn (navigate to linkedin.com/feed and check). If not logged in → STOP, tell Joe, do not attempt login.
- Confirm Google Workspace is connected (needed for the review doc):
  ```
  python "C:/Users/somea/AppData/Local/hermes/profiles/joeagent/skills/productivity/google-workspace/scripts/setup.py" --check
  ```
  Must print `AUTHENTICATED`.

### Step 1 — Decide the focus for this run
Default: spread across Joe's themes. If Joe names a focus ("just storage operators today", "partnership posts"), narrow the search terms to that segment. Otherwise pull a balanced mix.

### ⚡ Fast path — one call gathers everything
For a standard run, skip firing searches one at a time. Run the orchestrator with **system Python**:
```
C:/Python313/python.exe scripts/run_batch.py --per 4
```
It checks the debug port, searches across all of Joe's default theme terms, pools + de-duplicates, drops comments-off/ad posts, and prints one JSON list of `{author, role, url, text}` candidates. Then jump to Step 3 (filter to 10-15) and Step 4 (draft). To narrow focus: `--terms "self storage investing" "real estate partnership"`. If it prints `{"error": "PORT_DOWN"}` or `{"error": "NOT_LOGGED_IN"}`, relay the instruction to Joe and stop — never log in for him. The per-term mechanics below (Step 2) are the fallback if you need finer control.

**🎯 Target searches first (recommended):** before running, build a brand/audience/location-targeted query pack with the companion skill `linkedin-search-params`, then feed its CONTENT keywords into `run_batch.py --terms ...`. Broad terms ("self storage investing") work but drag in ICP-shaped noise; the search-params skill phrases queries by role/intent and is the right front end for a focused run. Proven composition: `linkedin-search-params` (where to look, located + brand-tagged) → `linkedin-engage` (read → filter → draft → doc). The brand tag (e.g. "Storage Moguls") flows into the doc title.

**⚠️ Windows path pitfall (cost a failed command Jun 2026):** the scripts run on native Windows Python (`C:/Python313/python.exe`), which does NOT resolve git-bash paths like `/tmp/foo.json`. Writing `--out /tmp/x.json` or reading `open('/tmp/x.json')` fails with FileNotFoundError. ALWAYS use a real Windows-relative path for intermediate JSON (write working files next to the script, e.g. `sm_candidates.json` in the scripts dir, or an absolute `C:/Users/somea/...` path). Clean up working files (`sm_candidates.json`, `*_items.json`, `*_params.json`) after the doc is built; keep only the skill's permanent scripts.

### Step 2 — Search & read (browser-assisted via CDP)
**Do NOT use the default cloud browser tool for LinkedIn** — it isn't logged in and hits LinkedIn's login wall. Use the bundled `scripts/fetch_linkedin_posts.py` which connects to Joe's real, logged-in Chrome over the debug port.

Preflight: Chrome must be running via the **"LinkedIn Automation" Desktop shortcut** (`.bat` — launches Chrome with `--remote-debugging-port=9222` + the dedicated profile at `profiles/joeagent/chrome-automation`). Verify the port:
```
curl -s --max-time 3 http://localhost:9222/json/version | grep -i browser
```
If unreachable → tell Joe to double-click the "LinkedIn Automation" shortcut and confirm he's logged into LinkedIn, then retry. Never log in for him.

Run the fetch with **system Python** (`C:/Python313/python.exe`, which has playwright — the Hermes venv does NOT):
```
C:/Python313/python.exe scripts/fetch_linkedin_posts.py --search "self storage investing" --max 8
C:/Python313/python.exe scripts/fetch_linkedin_posts.py --urls <url1> <url2> ...
```
It prints JSON: `[{author, role, url, text}]`. Run it across several of Joe's theme terms to gather a spread, then pool the candidates.

**Selector note (verified Jun 2026):** LinkedIn search results use obfuscated class names; real posts live in `div[componentkey]` containers and begin with a "Feed post" marker. The fetch script already encodes this + a parser that splits author/role/body. If a future run returns `[]` but the page clearly has posts, LinkedIn changed the DOM — probe `div[componentkey]` counts and the "Feed post" marker, then update the script's selector. Do not silently return an empty batch.

- For each candidate, the script returns the author, their headline/role, the post URL, and the body text. A comment that doesn't reference the specifics proves Joe didn't read it; that is worse than not commenting.
- Skip: posts already heavily commented by Joe, pure self-promotion/ads, political/off-brand content, posts older than ~7 days (stale engagement), and posts where Joe has nothing genuinely useful to add.

### Step 3 — Score & filter to 10–15
Keep a candidate only if it clears all three:
1. **Right audience** — author or topic is in Joe's ICP.
2. **Real conversation** — there's a genuine point Joe can add a practitioner angle to (not "nice post").
3. **Worth his name** — engaging raises Joe's credibility, not lowers it.
Rank by relevance; keep the top 10–15.

**The filter IS the value — expect to cut half or more.** Even targeted keyword searches reliably surface ICP-shaped noise: keyword "self storage" or "real estate syndication" pulls in recruiters, luxury-home brokers, product designers, a seaweed biotechnologist, affordable-housing funds, AI/CTO voices — people whose headline or post brushed the keyword but are off-thesis. In a real Jun 2026 run, 18 pooled candidates filtered to 7 keeps / 11 cuts. Do NOT pad to hit 10–15; 7 genuinely strong beats 12 with filler (the volume cap is a ceiling, not a quota). Also auto-cut: posts with comments turned off (can't engage — `run_batch.py` already drops the obvious ones, but verify), pure sales-video/ad posts, and anything where Joe would only be able to say "nice post."

### Step 4 — Draft a comment per post (see Voice rules below)

### Step 5 — Build the review doc
Write an items JSON file and call the bundled builder:
```
python scripts/build_engage_doc.py --title "<title>" --items <items.json> --folder 1s0vCsCbqHtPCKCHqScRHk3NHdSidznCX
```
- **Folder** `1s0vCsCbqHtPCKCHqScRHk3NHdSidznCX` = the "Storage Moguls / LinkedIn Review" Drive folder (same folder the post pipeline uses).
- **Title convention:** `LinkedIn Engagement — <Mon dd, yyyy>` (daily batch, so date-stamped not week-stamped). Example: `LinkedIn Engagement — Jun 18, 2026`.
- Items JSON is a list of objects:
  ```json
  [{"author": "Jane Operator", "role": "Owns 6 self-storage facilities | TX",
    "url": "https://www.linkedin.com/posts/...",
    "post_excerpt": "Faithful 1–3 sentence excerpt of their post...",
    "comment": "Joe's draft comment in his voice...",
    "angle": "Practitioner Insight — economic vs physical occupancy"}]
  ```

### Step 6 — Report to Joe
Print the doc webViewLink. Tell Joe: batch of N posts ready to review; he approves/edits in the doc and posts the ones he likes himself. Do NOT share/email the doc unless Joe explicitly asks. Do NOT touch Notion (engagement is not tracked there).

---

## Comment Voice — Non-Negotiable Rules

A comment is Joe showing up as a peer in someone else's conversation. The bar: it should read like a sharp operator who actually read the post and had one useful thing to say — not a marketer farming engagement.

**Structure:**
- **1–4 sentences.** Most are 1–2. Long comments read like hijacking.
- **Reference something specific in their post.** Name the number, the claim, the situation they described. This proves Joe read it.
- **Add one thing** — a practitioner angle, a real-deal observation, a sharper framing, or a genuine question. One. Not a mini-essay.
- **Lead with the substance**, not with praise. "Great post" openers are banned.

**Tone:**
- Conversational, experienced, measured — same Joe voice as everywhere. Peer-to-peer, never talking down.
- Credibility from lived experience ("I underwrite to my own expenses, not the seller's"), never from credentials ("As a CEO...").
- Confident, not arrogant. He's adding to the conversation, not correcting the person to look smart.
- A genuine question is often the strongest comment — it invites reply and builds the relationship. Use real curiosity, not rhetorical setups.

**Hard stops — rewrite any comment that contains these:**
- ❌ **CTAs of any kind.** No "Storage 100 is free," no "DM me," no "check out storagemoguls.ai." Comments never sell. (This is the single biggest difference from `linkedin-posts`.)
- ❌ **Link-drops.** Posting links in comments is the #1 spam/throttle signal. Never.
- ❌ "Great post!" / "Love this!" / "So true!" / "Couldn't agree more" — empty openers.
- ❌ Generic praise with no specific reference to the post's content.
- ❌ Hashtags. Comments don't use them.
- ❌ Emojis used decoratively (one meaningful one max, rare).
- ❌ Pitching Storage Moguls, the podcast, or any Joe product. Engagement builds the relationship; the product comes later, elsewhere.
- ❌ Correcting/one-upping the author to look superior.
- ❌ Anything templated or AI-stiff. If it could be pasted under any post, it's wrong — it must fit THIS post.
- ❌ Superlatives and hype ("incredible," "game-changing"), filler ("at the end of the day," "the truth is").

---

## Sample Comments (the quality bar)

**Their post:** An operator writes about a deal that looked great on the rent roll but underperformed after close.

> *Comment:* "The gap between physical and economic occupancy is where these surprises live. Did the rent roll show the concessions and month-to-months, or did you only catch it in the trailing collections?"

Why it works: references their exact situation, adds the practitioner frame, ends with a real question. No pitch, no link, no praise.

---

**Their post:** A syndicator posts about moving from multifamily into storage and feeling out of their depth on operations.

> *Comment:* "Storage is where real estate meets business — the operating side is the part multifamily doesn't prepare you for. The underwriting transfers; the day-to-day management is a different muscle. What's tripping you up most so far, ops or acquisitions?"

Why it works: validates without flattering, brings Joe's own positioning ("real estate meets business"), opens the door with a question.

---

**Their post:** Someone frustrated they've analyzed 100 deals and closed none.

> *Comment:* "That's not failure — that's the funnel working. Most of my closed deals came after a long stretch of passing. The 100 you walked from are why the one you close pencils."

Why it works: reframes their pain with lived experience, no condescension, lands clean with no CTA.

---

## 🔒 HUMANIZER GATE — run on EVERY drafted comment before it goes in the doc (non-negotiable)

Joe's standing rule (June 2026, enforced across the content skills): **every comment gets a humanizer pass — no matter how short.** A peer comment is short by design, which is exactly where stiff AI tells survive.

- Apply the **`humanizer`** skill / its checklist to each comment.
- **Literal dash scan:** ZERO em dashes `—` or en dashes `–`. A stray dash is proof the pass didn't happen.
- Kill "It's not just X, it's Y", rule-of-three, "-ing" tails, signposting, filler, and any LinkedIn-marketer cadence. Comments must read like a real peer talking, not a brand.
- **Read each one aloud in your head before it enters the review doc.** If it sounds assembled, rewrite.

## Output / Reporting Format to Joe

After building the doc, report like this:

> **LinkedIn Engagement batch ready — [N] posts.**
> Doc: [webViewLink]
> Spread: [e.g. 4 storage operators, 3 syndicators, 2 aspiring investors, 2 partnership/mindset].
> Review in the doc — approve/edit the comments you like, post them yourself. Nothing is auto-posted.

---

## Maintenance Notes

- If Joe's ICP shifts or a new vertical launches (e.g. Light Industrial Land), add the segment + search terms here.
- If Joe gives feedback on a specific draft comment ("too long," "don't ask questions," "that's not my voice"), log the example and tune the voice rules.
- If LinkedIn changes its content-search URL structure, update Step 2.
- The comment voice rules are the heart of this skill — protect them. The doc format is the only thing that should change if the review surface changes.

---

*Sources: soul.md (Joe Downs voice + ICP), linkedin-posts skill (voice baseline), linkedinreview skill (doc pipeline + folder), SM Content Tracker (Notion). Companions: linkedin-posts, linkedinreview.*
