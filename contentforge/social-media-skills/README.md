# Content Forge — Joe Downs Skill Pack

This package contains the **22 custom "skills"** built with Joe Downs to run content operations
across his brands (Storage Moguls, Successful Idiots, Joe Downs personal, StorPro, Belrose).
They are the encoded **rules, voice, workflows, and quality gates** that a human + AI assistant
have used to produce and publish real content.

The purpose of this export is to **engrain these rules into the Content Forge application** so the
app produces content to the same standard, in the same voice, following the same guardrails —
without needing Joe or the assistant live in the loop.

---

## What a "skill" is (and how to read one)

Each skill lives in its own folder under `skills/<name>/` and always contains a **`SKILL.md`** file.

`SKILL.md` has two parts:

1. **YAML frontmatter** at the top with:
   - `name` — the skill's identifier
   - `description` — *when to trigger it* and *what it owns vs. what it does NOT own* (this is the
     routing logic; read these first to understand how the skills hand off to each other)
2. **Markdown body** — the actual procedure: numbered steps, exact rules, voice constraints,
   pitfalls, and verification gates.

Many skills also carry supporting files:
- `references/` — deep-dive rule docs loaded on demand (voice rules, design systems, poster recipes,
  scheduling rules, API quirks). **This is where most of the "tips and rules" live.**
- `templates/` — reusable document/scaffold templates.
- `scripts/` — helper scripts (doc builders, API bridges, planners).

> For the app: treat `SKILL.md` frontmatter as **routing/config**, the `SKILL.md` body as **the
> primary ruleset**, and `references/*.md` as **the detailed rulebook** to load contextually.

---

## The system in one picture

These skills are not independent — they form a **content factory** that chains together:

```
SOURCE (podcast transcript / Notion / notes / KB)
   │
   ▼
[posts-engine]  ← the orchestrator; resolves brand + source, fires the right skills in order
   │
   ├─ understand the source
   ├─ draft long form (LinkedIn/IG/FB) + short form (X)
   ├─ apply BRAND VOICE  ─────────────► per-brand podcast/personal skills
   ├─ [writing-craft]   ── mandatory basic-English competence gate
   ├─ [humanizer]       ── strip AI tells (referenced from creative/humanizer)
   ├─ [joe-cta]         ── add the spoken/written call-to-action
   └─ OUTPUT ──► [brand-poster-design] (visuals) ──► [metricool-scheduling] (publish)
```

Everything Joe publishes is meant to pass, in order:
**writing-craft → humanizer → truth/provenance check → voice → CTA.**

---

## The 22 skills, grouped by job

### 🧭 Orchestration & routing
| Skill | What it owns |
|---|---|
| **posts-engine** | Top-level orchestrator. Turns a source into finished posts by chaining all the other skills so no step is skipped. LinkedIn is primary. |
| **joe-social-planner** | Placement/scheduling structure — slots content into the prescribed weekly (call-aligned / theme-aligned) calendar. |
| **content-tracker** | SINGLE source of truth for "what content do we have / what's processed / scheduled / published." Google Sheet = fast view; Notion = backend. |

### ✍️ Generation (voice & copy)
| Skill | What it owns |
|---|---|
| **linkedin-posts** | Daily batch of 6 LinkedIn posts in Joe's voice for Storage Moguls, across 6 content themes, skipping already-published topics. |
| **joe-from-podcasts** | Turns podcast insight into Joe's *personal* LinkedIn posts — his own lived observation, not a promo. |
| **storagemoguls-podcast** | Ready-to-publish content for Storage Moguls BRAND accounts from an episode. |
| **successfulidiots-podcast** | Ready-to-publish content for Successful Idiots BRAND accounts from an episode. |
| **joe-shortform-topics** | 3–5 context-first talking topics Joe records himself on camera (Reels/TikTok/FB). |
| **joe-cta** | Joe's spoken call-to-action for short-form video — warm, teacher voice, one literal action, names the free Storage 101 call. |
| **audience-comment-replies** | Replies to INBOUND fan/listener comments & DMs in Joe's voice (distinct from outbound engagement). |
| **storage100-beginner-content** | Beginner content from the Storage100 KB, sequenced by learning progression. |

### 🛡️ Quality gates (run on everything)
| Skill | What it owns |
|---|---|
| **writing-craft** | Foundational written-English competence gate. Faithful paraphrasing, correct vocabulary, sentences that actually parse. Runs BEFORE humanizer on all content. |

### 🎨 Visual & design
| Skill | What it owns |
|---|---|
| **brand-poster-design** | On-brand posters/graphics (HTML→PNG), account art, SmartLink/bio assets; attaches to Metricool drafts. Holds the per-brand design systems. |
| **brand-asset-organization** | Safe, reversible filing + standard naming of scattered brand files into the canonical BrandAssets library. |

### 📚 Knowledge base & research
| Skill | What it owns |
|---|---|
| **brand-knowledge-hub** | The multi-brand Notion "factory": raw Drive material → structured KNOWLEDGE + publishable CONTENT. Holds architecture + MCP-server rules. |
| **storage100-knowledge-base** | Turns transcripts into a structured KB for later book/ebook authoring (as-is + simplified + book notes). Owns transcript↔video matching. |

### 🔎 LinkedIn engagement
| Skill | What it owns |
|---|---|
| **linkedin-engage** | Surfaces 10–15 relevant posts and drafts peer-voice comments for Joe to approve & post himself. |
| **linkedin-search-params** | Builds targeted, brand-aware LinkedIn search URLs (people + content) with verified location IDs. |
| **linkedinreview** | Approval-pipeline companion — places generated posts into a weekly review Google Doc for partner sign-off. |

### 📅 Publishing & ops
| Skill | What it owns |
|---|---|
| **metricool-scheduling** | Schedule/draft/update/analyze posts across the connected brands via Metricool; per-network media + character + timezone rules. |
| **teams-meeting-pipeline** | Operate the Teams meeting-summary pipeline (summaries, status, replay, subscriptions). |
| **cron-nudge-agents** | How a scheduled reminder/nudge agent should behave (auto-delivery model, day gating, silent rule). |

---

## Core rules the app MUST enforce (the non-negotiables)

These recur across the skills and represent Joe's hard preferences. Bake them into the app's
generation + guardrail layer:

1. **Voice is plain, warm, first-person, one idea per line.** No jargon. Educator, not salesman.
   Confident without arrogance; credibility comes from lived deal experience.
2. **Quality gate order is mandatory:** writing-craft → humanizer → truth/provenance → voice → CTA.
   Never ship copy that skips a gate.
3. **Kill the AI tells.** No uniform openers, no "not X, it's Y" constructions, no rule-of-three
   padding, no clever labels. Every line must stand alone and actually parse (no dangling clauses).
4. **Approved copy is LOCKED.** Any later restyle keeps the wording VERBATIM.
5. **Every idea → all 4 core platforms** (LinkedIn + Instagram + X + Facebook). The IDEA drives the
   TYPE, not the coverage. Caption + visual = the SAME idea. One idea fully before the next.
6. **X captions are message-first**, no fluff, no hashtags; each stands alone with its own context.
7. **A caption/rewrite is NOT permission to schedule or publish.** Wait for an explicit go.
8. **CTAs** name ONE literal action, remove risk, keep Joe in invite/teacher voice — never salesy.
9. **Timezone discipline:** the host clock and Metricool differ; always resolve real ET.
10. **Poster/visual work builds on the established brand design system — never invent styling.**
    The poster must match the caption's message.
11. **Provenance / no fabrication:** attribute insights to the real owner; verify before publishing.

> The detailed, canonical version of each of these lives inside the relevant `SKILL.md` and its
> `references/`. Where this README and a `SKILL.md` differ, **the `SKILL.md` is authoritative.**

---

## How to ingest into Content Forge

Suggested approach for the dev team:

1. **Parse `manifest.json`** (included) — it lists every skill, its trigger/description, and its
   file tree, so you can build a routing table.
2. **Load `SKILL.md` frontmatter** as the routing config (when to fire which skill).
3. **Load `SKILL.md` bodies + `references/*.md`** as the ruleset / system-prompt material for each
   generation lane.
4. **Port the `scripts/`** as needed (many are Google Docs/Sheets builders and API bridges — treat
   as reference implementations, not drop-in code; they assume this environment's auth).
5. **Implement the "Core rules" above as hard guardrails** that run on all generated content,
   independent of which skill produced it.

---

## Notes & caveats

- Scripts reference this machine's environment (Google Workspace API tokens, Metricool MCP,
  Notion MCP, Cloudinary). They are **reference logic**, not portable as-is — reimplement against
  Content Forge's own credentials.
- `__pycache__` / compiled `.pyc` files were stripped from this export.
- These skills evolved from real corrections over many sessions; the "pitfalls" and "REPEAT-FAILURE"
  notes inside them are hard-won — preserve them.

_Exported for the Content Forge build. Source: joeagent profile skills library._
