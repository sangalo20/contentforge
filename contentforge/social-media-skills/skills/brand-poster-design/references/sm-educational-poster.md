# SM Educational Poster — light editorial recipe (Joe, Ep04 July 2026)

## When to use
Storage Moguls EDUCATIONAL content (teach a lesson pulled from an episode), NOT promotion.
Joe's ask verbatim: *"educative content ... make the posters very light weight, easy on the
eyes and attractive, keeping the brand rules."* This is the counterpart to the promo hook-wrap
video format — different lane (see `storagemoguls-podcast` → "TWO DISTINCT CONTENT LANES").
Each poster TEACHES one thing and stands alone; it does NOT sell the episode and carries NO
funnel CTA on the art.

## The look that landed (proven Ep04, myth-busting poster)
"Lightweight / easy on the eyes / attractive" = a LIGHT editorial field, not the dark navy
promo spine. Flip the palette to light but keep the SM brand system:
- **Background:** warm off-white / cream `#F5F3EE` (airy, magazine feel — the opposite of a
  dense dark slide).
- **Ink:** SM navy `#0B1322`. **Accent:** SM blue `#2E7DF6` (thin top hairline rule ~8px, the
  kicker, the left-border ticks, the footer accent word). Use red `#B9271B` ONLY to flag a
  "myth"/wrong belief when the lesson is a myth-bust; otherwise stay navy+blue.
- **Type:** headline in **Fraunces** serif (weight 500, ~74px, `letter-spacing:-1.5px`,
  `line-height:1.06`) — editorial and easy on the eye. Kicker + meta in **JetBrains Mono**
  (small, letter-spaced, uppercase). Body/labels in **Montserrat**. Masthead in **Barlow
  Condensed** (matches the brand spine).
- **Masthead:** `STORAGE MOGULS.` top-left (blue period), a lane tag top-right in mono, e.g.
  **`STORAGE 101`** — signals the educational lane at a glance.
- **Footer:** thin `1px` hairline rule + `PRACTITIONERS, NOT PROFESSORS.` (blue on
  "NOT PROFESSORS.") left, `storagemoguls.ai` right. NO "join now / start free / watch" —
  educational footer is the brand sign-off only.
- **Whitespace is the design.** Generous 96px side padding. ONE lesson per poster.

## Layout that avoids the dead-band (Ep04 fix)
Center the content block in the field so it doesn't bottom-collapse into a void:
`.wrap{position:absolute; top:172px; left:96px; right:96px; bottom:150px; display:flex;
flex-direction:column; justify-content:center}` — anchoring both top and bottom + centering
balances the composition regardless of how many rows. (First pass pinned only `top:` and left
a big empty lower third; Joe's design-principles checklist flags that.)

## Canvas & render
1080×1350 (SM feed). Render Chrome headless: `--headless=new --hide-scrollbars
--force-device-scale-factor=1 --window-size=1080,1350 --virtual-time-budget=8000
--screenshot=out.png "file:///.../poster.html"`. Confirm the saved PNG is exactly 1080×1350
(PIL) and vision-QA: is it light/airy, one clear message, on-brand, nothing crowded/cut, reads
as TEACHING not selling?

## ⛔ NAME THE SUBJECT EXPLICITLY — \"self-storage investing,\" never bare \"storage\" (Joe, Ep04 July 2026)\nJoe rejected a headline reading \"The 4 reasons people never buy storage\": *\"What storage? It\nassumes everyone knows what we are talking about. Investment should be the self-storage\ninvestment.\"* Out of context, bare \"storage\" reads as a rented closet, not buying a facility as\nan investment. On EVERY educational piece (poster headline AND kicker AND caption), name it in\nfull: **\"self-storage investing\" / \"invest in self-storage\" / \"buy a self-storage facility.\"**\nThe kicker line is a clean anchor for it (e.g. `SELF-STORAGE INVESTING · BEFORE YOU COUNT\nYOURSELF OUT`). Educational content reaches cold strangers with zero context, so it can never\nassume the reader already knows the subject. (If naming it lengthens the headline, drop the\nFraunces size a touch — 74→70px fit the 3-line \"never invest in self-storage\" headline cleanly.)\n\n## ⛔ EDUCATIONAL COPY VOICE = the Storage 100 Picture Guide (Joe, Ep04 July 2026)\nFor educational CAPTIONS Joe's bar is: *\"easy to understand like the [Storage 100 picture\nguide].\"* That guide (`C:\\Users\\somea\\sm_tx_work\\ebook\\Storage100_Picture_Guide_v2_swap5.html`)\nis the voice reference — read it before writing educational copy. Its voice:\n- **Plain, warm, FIRST-PERSON Joe.** \"You own a building of rentable units. People pay you\n  every month to keep their stuff in them. That's the whole model.\"\n- **One idea per line. Short declaratives.** A total beginner follows every sentence as they\n  read it.\n- **Zero jargon — or define the term in the SAME breath.** \"counter-cyclical — it just means\n  demand can rise when the economy falls.\"\n- **Concrete over abstract.** \"A storage unit never calls you at 2 a.m. A person living in your\n  apartment will.\"\n- **Commercial-RE framing, NOT residential-landlord** — residential pains (toilets/tenants/2am\n  calls) are framed as what you AVOID vs. others, never as Joe's own life (see USER profile).\n- **Month-to-month = an advantage, never a risk** (Joe's standing storage rule).\n- **Close = the free Monday-night Storage 101 call at storagemoguls.ai**, warm invite/teacher\n  voice (\"Come learn it with me\"), never salesy — this is the joe-cta principle. NOT the promo\n  \"new episodes every Tuesday\" funnel close (that's the promotional lane).\nWrite each caption FROM the episode Understanding in this voice, then run writing-craft +\nhumanizer (no dashes). This is distinct from the SM brand-account promo caption voice.\n\n## Rules that still bind (don't drop these for the light look)
- **Message-first** (the `brand-poster-design` §3a rule still applies): ONE teachable idea per
  poster, set large; supporting rows elaborate the ONE idea, they don't introduce a second.
- **No em/en dashes** in poster copy either (Joe treats a stray `—` as a tell). Rewrite the
  headline into two sentences instead of dash-joining. (Ep04: "…never buy storage — and why
  each is a myth" → "…never buy storage. And why every one is a myth.")
- **Distinct layouts across the set** — don't reuse the same myth/truth list structure for
  every educational poster in a batch (a checklist, a single big-number lesson, a
  match-the-pair, a one-line principle — vary the vehicle to the lesson, same as promo posters).
- Educational copy comes FROM the filed Understanding (real facts, correctly attributed), never
  invented numbers.

## Proven Ep04 educational topic set (5 standalone lessons from one episode)
1. The 4 excuses that keep people out of storage, each a myth (too young / too old / no money /
   no lender) — myth/truth list. BUILT: `SM_Ep04_edu/edu1_myths.html`.
2. What SBA actually requires to buy a first facility (~680 credit · management ability · a
   deal that cash-flows · 10-20% down · NO track record) — clean checklist.
3. Match your cash to the right deal size ($100K → ~$1M deal, not a $4M shiny object) — pairing.
4. Where first deals actually come from (direct-to-owner outreach beats waiting on brokers).
5. The skills that predict success are execution skills, not real estate skills — one principle.
