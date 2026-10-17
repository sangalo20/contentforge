# Memory Discipline — what lives in memory vs. a skill (for the joeagent profile)

Joe's persistent memory runs near its hard cap (~2,200 chars) because it carries dense,
genuinely-useful operational facts. That means **every new durable fact forces an eviction**.
This note encodes the rule Joe explicitly drove (June 2026) so future sessions don't thrash.

## The split (the actual rule)

| Goes in MEMORY (always-on, injected every turn) | Goes in a SKILL `references/` file (load on demand) |
|---|---|
| Behavioral **rules** — e.g. "never mark a piece Approved/Published until Joe says so verbally" | Reference **data** — Notion DB `data_source_id`s, parent-page IDs, relation names |
| **High-frequency environment facts** hit constantly — Google token path, `$HOME` mis-resolves in git-bash, system-Python (`C:/Python313`) vs Hermes venv, Chrome CDP port 9222, the `printf 'Y'` MCP-add quirk | **Procedures** — multi-step recipes, connection walkthroughs, tool inventories |
| **Trigger awareness** — "these sibling skills exist" pointers | Anything you'd only need WHILE doing a specific class of task |
| **Live project state** (kept tight) — e.g. the live short-video pilot | Stale/finished task state → delete it, don't keep it |

Litmus test: *"Would burying this in a skill cause me to step on the same rake before I'd think to load it?"*
If yes → memory. If it's only needed once I'm already doing the task → skill reference.

## Worked example from this session

The Brand Knowledge Hub DB IDs (~770 chars) were sitting in always-injected memory.
Moved them to `references/live-ids.md`; memory now holds a one-line pointer. Reclaimed the
space without losing anything — the IDs load via `skill_view` exactly when Hub work starts.
Same logic retired the LinkedIn infra detail from memory: the playwright/CDP-port-9222/`.bat`/
"don't use cloud browser tool"/geoUrn facts already live in the `linkedin-engage` and
`linkedin-search-params` skills, so memory keeps only the hard rule + the skill-family roster.

## The cap mechanic that causes loops (and the fix)

When memory is near full, **`memory(action="add")` checks the cap BEFORE a same-turn
`remove`/`replace` frees space** — so "just shorten the new entry" gets rejected repeatedly.

**Fix — do it in this order, all in one turn:**
1. `remove` (or `replace` an existing entry with a shorter version) FIRST to free space.
2. THEN `add` the new entry.

Do NOT retry the same `add` with slightly-trimmed text 5 times (that was the thrash). If an
`add` is blocked, the answer is almost always "evict or consolidate an existing entry first,"
not "make the new one tinier."

**The `replace`-with-LONGER-text trap (hit again, repeatedly, June 2026):** when you `replace`
an existing entry with an EXPANDED version (added a new clause/rule), the new text is bigger than
the old, so it can push total over cap and gets rejected. Trimming the new text 20 chars at a time
and retrying is the SAME thrash — it took ~8 rejected calls to land one entry. **Before editing a
near-cap entry, do the arithmetic up front:** new_len − old_len = bytes you must FREE elsewhere
first. If you're adding ~200 chars of new rule to a 2,195/2,200 store, you need to cut ~200 chars
from ANOTHER entry (or this one) in the same turn BEFORE the replace will fit. Decide what to evict
first; don't discover the overflow by trial-and-error. Better still: when the new fact is reference/
procedure detail (not a behavioral trigger), put the DETAIL in the skill and keep only a tight
trigger-line in memory — that sidesteps the cap entirely. This session's content-structure +
voice-default rules went into `brand-knowledge-hub` SKILL.md; memory kept only the compressed gist.

## On raising the cap

Joe asked about increasing `memory.max_chars`. Tradeoff to state plainly: memory is injected
EVERY turn, so a bigger cap = more tokens per message all day + signal dilution (critical rules
compete with trivia) + slower/lower-focus long sessions. Recommend keeping it tight and using
the skill-offload pattern above instead; nudge the cap up only modestly if we keep bumping it
even after offloading reference data. A 5,000-char memory that's 60% reference junk is worse
than a tight 2,200 that's all rules.

## The 3-layer model + periodic HYGIENE PASS (Joe, June 2026)

Joe asked whether a "memory-complement skill that loads at start" would help. Answer: **no — it
would make things worse** (drift between two copies of the same rule; skills don't reliably
auto-load, only memory is injected every turn; the skill-roster shown at session start ALREADY
serves the "load to complement memory" function). The right design is the 3-layer split, which
already exists — don't duplicate memory into a skill.

**The 3 layers (each has ONE job — never duplicate a fact across them):**
| Layer | Job | Injected? |
|---|---|---|
| **Memory** (MEMORY.md / USER.md) | always-on behavioral guardrails + terse pointers | every turn |
| **Skills** (`references/`) | full specs, procedures, IDs, recipes | on demand via `skill_view` |
| **Notion** (Production Map `386cc74e-bcf3-81f2-84e3-ca5cf644c510`) | system of record / work-log of what was done | never (queried) |

**Litmus for which layer:** a fact that stops me stepping on a rake *before I'd think to load a
skill* → memory. Detail only needed *while* doing a task → skill. A record of *what we did* →
Notion. If a fact is in two layers, that's drift waiting to happen — collapse it to one + a pointer.

### The hygiene pass (run periodically, or when memory >90%, or after a big build session)
A recurring maintenance PROCEDURE (not a new skill). Steps that worked June 2026:
1. **Compress memory** — find any entry carrying full SPEC/PROCEDURE detail that's (or should be)
   in a skill; replace it with a terse guardrail + a pointer to the skill section. Free space with
   `remove`/`replace` BEFORE `add` (see cap mechanic above).
2. **Drift check** — for each compressed entry, VERIFY the detail actually exists in the named skill
   (`search_files` the skill) before pointing at it. Don't point at a section that isn't there.
3. **Contradiction sweep** — grep skills for stale "UNDER REVIEW / candidate / not locked / TBD"
   language that a later decision overruled, and update the header to the decision (KEEP any reusable
   procedure underneath — e.g. the amber "DECIDED: NO" header still kept the "how to mock up a
   candidate brand color" recipe). A skill that contradicts a locked decision is worse than memory bloat.
4. **Notion = work-log, not memory** — completed-work records (audit logs, "Move 1/2/3 done") go in
   the Production Map, never memory. Memory holds rules, not history.
5. Report what was compressed/found; don't silently rewrite.

Proven result (June 2026 pass): memory 98% → 85% with zero loss of guardrails; amber spec, the
unified-engine note, and the all-platforms coverage rule all collapsed to pointers; one stale amber
"UNDER REVIEW" subsection corrected to "DECIDED: NO".

**On automating it:** a monthly hygiene cron is reasonable but DON'T stack it while the Weekly Growth
Scorecard cron (`8589e097dd58`) is still in its first 3-week proving window — add it only after.

---
*Source: memory-management sessions with Joe (June 2026). The principle: rules + high-frequency
env facts → memory; reference data, IDs, procedures, finished task state → skills (or deleted);
work-log → Notion. Three layers, one job each, no duplication.*
