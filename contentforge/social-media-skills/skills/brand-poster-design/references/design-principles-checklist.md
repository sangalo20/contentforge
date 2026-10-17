# Design-principles checklist for posters (Joe: "use proper design principles, not just throwing things there")

Joe rejected illustrated posters that had real elements but felt scattered. The fix is to ENGINEER the canonical design principles in before rendering — not decorate. Canonical set (from Interaction Design Foundation): **hierarchy, dominance, balance, contrast, alignment, proximity, scale, unity, active whitespace**. Run this checklist on any from-scratch illustrated poster or multi-style batch.

## The checklist (engineer each in, then vision-QA for it)

| Principle | Concrete move on the poster |
|---|---|
| **Visual hierarchy** | ONE clear entry point; eye path 1→2→3. ~3:1 size ratio between the primary element and secondary text. Headline must NOT be the same weight as everything else. |
| **Dominance / focal point** | ONE hero element per poster (the chart, the scene, the characters). Everything else supports — nothing competes with it. |
| **Balance** | Deliberate weight distribution — asymmetric diagonal (panel top-left ↔ hero bottom-right ↔ badge top-right) or symmetric. Optical center, not just mathematical center. No element placed "to fill space." |
| **Contrast** | Size / color / weight contrast separates layers. The eye should instantly know what is primary vs secondary (e.g. bright tall INBOX vs dim short SPAM box). |
| **Alignment** | Everything on a shared grid. Shared edges / baselines (e.g. both metaphor boxes share ONE bottom baseline). No eyeballed placement. |
| **Proximity / grouping** | Related items grouped (Gestalt); whitespace separates groups. A caption sits tight under the visual it explains, not floating. |
| **Scale** | Use dramatic, intentional size jumps for impact (a 24× bar should TOWER over a 1× stub — scale IS the message in data-viz). |
| **Active whitespace** | Negative space is a design element, not "empty to fill." Give the focal point room to breathe; don't cram. But a dead VOID (big bare band between elements) is a failure — close it by enlarging the hero or adding ONE supporting block. |
| **Unity / consistency** | Across a batch: shared margin system (e.g. 80px), one type scale, identical kicker + footer, consistent accent rhythm — so the set reads as a FAMILY. |

## Worked examples (proven on SI Ep030)

**Visual metaphor — spam → inbox**
- Alignment: SPAM and INBOX boxes share one bottom baseline.
- Contrast/dominance: INBOX is taller, white, green-bordered + glow (it visibly "wins"); SPAM is dim and shorter (low visual weight).
- Focal point: a dark envelope on a dashed arc travels between them — the eye magnet.
- Proximity: caption grouped immediately under the scene. Active whitespace top + sides.

**Real data-viz — the 24× jump**
- Scale is the whole message: a stubby 1× bar against a towering 24× green bar; the jump hits before you read.
- Hierarchy: chart dominates center; 4×/6× facts are a secondary grouped strip; one-line takeaway is tertiary.
- Alignment: real axis, bars on the baseline; restrained palette (unity).

**Character hero — figure/ground**
- Figure/ground: headline on a SOLID dark panel (green offset shadow) so type is dominant + legible instead of floating on flat yellow.
- Rule of thirds: characters anchored as the hero in the lower zone (visual base); text panel upper-left (natural reading path); badge balances top-right.
- See the SKILL.md "Pitfalls" for the wide-chest-up-cutout sizing fix and the footer-band fix that made this one land.

**Photo-hero built to the bar (proven SI Ep016)** — a real Unsplash photo as the top hero, fading via gradient into a solid navy lower panel; big yellow stat as the lower-zone focal point grouped tight with its label; uppercase headline primary, body secondary, footer tertiary; all on one 84px left grid. This is the structure to copy for any photo-hero poster (build file `BrandAssets/_scripts/gen_test3.js`). Monotone/grayscale hero photos must be pushed BOLDER (heavier uppercase type, `grayscale(1) contrast(1.28) brightness(.82)`, darker scrim) or they read flat.

## How to apply in the batch generator
Define a SHARED design system at the top of the generator (margin grid, type scale, identical kicker + footer markup) and let each poster vary only its focal treatment. This bakes in UNITY for free and forces each poster to differ at the level of *visual vocabulary* (metaphor vs chart vs photo vs icon), not just recolored type — which is the actual variety Joe wants.

### ⚠️ Generator implementation gotchas (HTML→PNG poster generators — cost real re-render loops, SI Ep016)
1. **Lay out stacked content with flex FLOW, not hand-computed absolute `top:`.** Absolute `top:` values on children inside an absolutely-positioned panel are measured from the wrong origin and throw text OFF-CANVAS, leaving a dead void and colliding elements. Use `display:flex;flex-direction:column;justify-content:space-between` on a padded container so the focal group sits at top, footer pins to base, whitespace distributes itself.
2. **A helper-arg nesting trap silently drops params.** If posters wrap content in a `std(kick, mid)` helper INSIDE a `page(inner, theme)` call, the theme/2nd arg must close on `page()`, not land inside `std()`: `page(std("k", \`...\`), "green")` — NOT `page(std("k", \`...\`, "green"))` (that passes "green" to `std`, which ignores it, so `page` defaults). A poster rendering with the wrong/default theme is usually this. Vision-QA that the intended background actually applied.
3. **Inline `style="color:#fff"` BEATS a theme-override stylesheet rule.** When flipping some posters to a light field (paper/yellow) via a theme class, any element with a hard-coded inline text colour stays that colour and can go invisible (white on cream). Either don't hard-code inline colours on themeable elements, or hand-fix that poster's inline colours for the light theme. Simplest: prefer yellow/green fields (predictable with navy/white text) over paper unless you'll fix every inline colour. Always vision-QA a recoloured poster for "any element invisible / wrong contrast?"
4. **Always vision-QA that headline AND body actually RENDERED** — a broken coordinate or a broken `file://` image path renders blank, so the poster looks "empty," not "error."
5. **Prove ONE poster to the design bar, show it as THE example, THEN build the batch** — when a set is rejected on craft, don't rebuild all N blind.

## ⛔ COLOR SOURCE — the live build wins over the Canva-kit row (Joe caught this, SM Ep001)
Before building ANY brand's poster, pull the accent/bg hexes from the **actual approved live build**, NOT from a Canva brand-kit table that may disagree. Joe caught me building SM Ep001 in slate `#3F6F8E` (from the Canva-kit "SM Podcast variant" row in `brand-knowledge-hub/references/live-ids.md`) when the whole approved SM feed (the `SMTooYoung`/`SMFirstTimerEdge` Remotion spine) uses bright electric blue `#2E7DF6` + `#6FA6FF` on `#0B1322` navy. Two palettes both labeled "SM" existed; the live build is canonical.
- **SM canonical poster/reel palette:** navy `#0B1322`/`#10182B`/deep `#070C16`; blue `#2E7DF6` + light `#6FA6FF`; ink `#EDF2FB`; muted `#8A97B0`/`#C7CEDA`. Fonts Big Shoulders Display + League Spartan + Space Mono (case-file labels).
- **The check:** when a brand has a Canva-kit hex AND an existing rendered/Remotion build, copy colors from the build file (`BrandAssets/_remotion/src/*.tsx` for SM) — the Canva row is reference only. `live-ids.md` now flags this on the SM rows.

## Proven distinct-vocabulary set (SM Ep001 — copy these to avoid the same-card-reskinned trap)
A 6-piece SM batch that passed Joe's variety bar, each a different SPECIES on the shared navy/electric-blue spine (build file: `BrandAssets/SM_Ep001/poster2.html`, hash-routed `#idea1..6`):
1. **Line graph** — a holding-flat line vs a dashed dropping line (income-that-survives idea). SVG, fills lower half.
2. **Centered medallion + icon** — glowing round phone with concentric rings (cold-call idea).
3. **Real data-viz** — short dim bar vs tall bright bar, the % as oversized hero (below-market idea). Scale carries it.
4. **CASE FILE dossier** — Space Mono SOURCE/FINDING/PLAY records down a left accent border, near-black bg (deal-story idea).
5. **Icon-grid motif** — a row of 12 calendar tiles + typographic headline, vertically centered (year-of-study idea).
6. **Proportion bar** — a tiny labeled segment vs a large one, big stat above (per-hour-math idea).
Anchor varies across the set (top / centered / vertically-centered) so none reads as the same template. Render via headless Chrome `--screenshot` at 1080×1350, `--virtual-time-budget=4000` for fonts; vision-QA each AND the set together.
