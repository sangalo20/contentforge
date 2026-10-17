---
name: audience-comment-replies
description: Draft replies to INBOUND audience comments, DMs, and questions in Joe Downs' voice across any platform (Instagram, LinkedIn, YouTube, Facebook, podcast apps). Trigger when Joe pastes a listener/viewer comment or question and asks for "a reply in Joe's voice", "answer this comment", "reply to this fan/listener", "respond to this for IG/YouTube", or "what do I say back to this". This is INBOUND fan/audience engagement (someone reached out to Joe) — NOT outbound peer-comment hunting on strangers' posts (that's linkedin-engage), NOT Joe's own broadcast posts (linkedin-posts / joe-from-podcasts / the podcast skills). Owns the voice rules, the humanizer-verification gate, and recurring response patterns (e.g. episode-topic requests).
---

# SKILL.md — Audience Comment Replies (audience-comment-replies)

**Skill ID:** audience-comment-replies
**Owner:** Joe Downs
**Companions:** linkedin-engage (OUTBOUND peer engagement on others' posts), humanizer (the de-AI pass this skill mandates), the podcast skills (source-of-truth for episode facts)
**Output:** A ready-to-post reply (inline in chat), in Joe's voice, scoped to the platform
**Last updated:** June 2026

---

## What This Skill Does

Joe gets comments, DMs, and questions from listeners/viewers/followers across all his channels. This skill drafts his **reply** — warm, in his voice, encouraging the relationship, and (where it fits) nudging a follow — without ever sounding like an AI, a script, or a marketer.

**This is INBOUND.** Someone reached out to Joe. Contrast with `linkedin-engage`, which goes and FINDS strangers' posts for Joe to comment on (outbound peer engagement, batch, Google-Doc routed). Keep them separate:
- `audience-comment-replies` = replying to people who came to Joe (any platform).
- `linkedin-engage` = Joe showing up in others' comment sections (LinkedIn only, batch).
- `linkedin-posts` / `joe-from-podcasts` / podcast skills = Joe's own broadcast content.

---

## The Hard Gate — humanize EVERY reply, and PROVE it before you hand it over

Joe's standing rule (Jun 2026, stated twice): **always humanize comments and replies to comments** — no matter how short. A two-line IG reply still gets the pass. This is non-negotiable and applies to all audience-facing copy.

### ⚠️ The failure that created this rule (do not repeat it)
I claimed a reply was "already run through the humanizer" while it still contained em dashes. Joe caught it instantly: *"it has the dashes what are you talking about?"* Saying you humanized something and not actually doing it is worse than skipping the step — it burns trust.

### Verification gate — run this literal check before presenting ANY reply
After drafting, **scan the text character-by-character for dashes and other top AI tells, and remove them:**
- **Em dash `—` and en dash `–`** → replace with a period, comma, or split into two sentences. Joe treats a stray dash as proof the humanizer pass didn't happen. ZERO dashes in audience copy. This is the single most-checked tell.
- Curly quotes `" " ' '` → straight quotes `" '`.
- Rule-of-three lists, "it's not just X, it's Y" parallelisms, "-ing" tail clauses, copula avoidance (`serves as`/`stands as`), filler ("at the end of the day," "the truth is").
- Load the `humanizer` skill for the full 29-pattern checklist when the reply is more than a couple of sentences.

**Then state honestly what you checked.** If you say "dashes checked, none in it," there had better be none. Do a literal find for `—` and `–` in your own draft before that sentence leaves your mouth.

---

## Joe's Voice in a Reply (conversational, experienced, measured)

- **Warm and genuine first.** Thank them for listening/watching/following — specifically, not boilerplate. "Appreciate you listening" beats "Thank you for your comment."
- **Peer, not professor.** Share how Joe actually thinks/operates ("I do the opposite — I tell it who I am first"), not a lecture.
- **Short, declarative sentences.** No fluff, no hype words ("incredible," "game-changing"). Name the thing directly.
- **First person.** "I keep coming back to…", "Here's what gets me…" — a real person thinking.
- **Platform-fit length:**
  - **Instagram / YouTube / Facebook comment:** short and conversational. A few tight sentences. Emojis read natural here — 1–3 meaningful ones are fine (🙏 👊 👀), never decorative spam. Offer a zero-emoji version if unsure.
  - **DM:** room to be a little warmer/longer than a public comment.
  - **LinkedIn:** more measured, fewer/no emojis, professional-peer register.
- **Earn the follow, don't beg it.** A soft "hit follow so you don't miss it" + a reason (free material, more on this topic) lands. A hard CTA or link-drop does not.

---

## Recurring Response Patterns

### Pattern: "Will you do an episode on X?" (audience requests a podcast topic)
Joe tuned this precisely over several rounds (Jun 2026). The rules:
- ❌ **Do NOT promise/guarantee** an episode will be made. (Over-commits.)
- ❌ **Do NOT deny or shut it down.** (Discourages a fan who gave you a great idea.)
- ❌ **Do NOT say "no promises"** or similar hedges. Joe: that *"might discourage."* The seed of doubt isn't worth it.
- ❌ **Do NOT say you'll "mention it to Scott" / "float it to Scott" / "take it to Scott."** Joe: that *"puts the weight on Scott"* — it makes it sound like someone else's call, not Joe's. Keep ownership with Joe.
- ✅ **Keep it warm, open, and Joe-owned.** Signal genuine interest and "keep an eye out," with no commitment and no decision-maker hand-off.

**Known-good phrasing (Joe approved):**
> "Love this topic. It's exactly the kind of thing we love digging into on the show, so keep an eye out 👀"

That's the template: enthusiasm + "the kind of thing we dig into" + "keep an eye out." No promise, no denial, no "no promises," no Scott.

### Pattern: ground episode/fact references in the real source
If a reply references a specific Storage Moguls / Successful Idiots episode or makes a factual claim, pull the real Show Notes/Blog (podcast skills' Drive recipe) so you don't invent specifics. Don't fabricate episode details in a public reply.

---

## Workflow (fast — this is usually a one-off)

1. **Read the comment.** Identify platform + what they actually asked.
2. **Draft the reply** in Joe's voice, platform-fit length. Apply any recurring pattern above.
3. **Run the humanize gate** — literal scan for `—` / `–` and the other tells; remove them. Load `humanizer` for anything longer than ~2 sentences.
4. **Deliver INLINE in chat.** A one-off reply is a small ask — never wrap it in a Google Doc or Notion row. (Same "don't over-process small asks" rule as linkedin-engage.)
5. **Offer one tailored variant** when useful (shorter version, zero-emoji version, DM-length version) — don't force it.

---

## Hard Stops (rewrite any reply containing these)
- ❌ Em/en dashes (`—` `–`) in the final copy. Always. The #1 thing Joe checks.
- ❌ Claiming you humanized it when you didn't actually scan for the tells.
- ❌ Promising an episode, OR denying one, OR "no promises," OR deferring the decision to Scott (see pattern above).
- ❌ Link-drops or hard sells in a comment reply.
- ❌ AI-stiff openers ("Great question!", "Thank you for your comment").
- ❌ Hype words, rule-of-three padding, "it's not just X, it's Y."
- ❌ A reply so long it reads like a blog post in someone's comment section.

---

## Maintenance Notes
- When Joe corrects a reply's framing (like the episode-request rules above), capture the exact do/don't here with his words — these compound into a reliable template.
- If a new recurring question type shows up (pricing, "how do I start," partnership asks), add a Pattern subsection.
- Keep the humanize gate at the top; it's the rule Joe enforces hardest.

---

*Sources: soul.md (Joe's voice), this session (Jun 2026: humanizer-on-comments standing rule + the dashes-left-in failure + the episode-request framing tuned across several rounds). Companions: linkedin-engage, humanizer, the podcast skills.*
