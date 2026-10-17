# Educational poster SET from an episode (light-editorial posters + Storage-100-voice captions)

Proven July 2026 on SM Ep04 (Jack Pezzino). Joe explicitly separated PROMOTIONAL content
(sells/teases the episode — hook-wrapped clip videos, see `brand-poster-design` →
`references/hook-wrapped-real-clip.md`) from EDUCATIONAL content (teaches a standalone
lesson; a reader gets smarter even if they never touch the episode). This file = the
educational-poster recipe. Trigger: "educational content from this episode," "teach, don't
promote," "lightweight, easy-on-the-eyes posters."

> ⛔ **JOE-PERSONAL vs SM-BRAND — pick the right lane before you build.** This file is the
> SM-BRAND educational lane: footer `storagemoguls.ai`, CTA = the free Monday-night Storage 101
> call. If the content is for **Joe's PERSONAL socials** instead, the footer becomes `joedowns.ai`
> and the CTA becomes an invite to **join the community at storagemoguls.ai** — and multi-day
> "N-day learning series" packaging + organized Downloads-folder delivery all live in the dedicated
> `references/personal-day-series.md`. Read THAT file for anything personal-brand. Ask Joe which
> account the content is for if it's ambiguous; the footer and CTA hinge on it.

## The look Joe approved — LIGHT EDITORIAL "paper" (not the dark promo spine)
When Joe says "lightweight, easy on the eyes, attractive, on-brand," build the SM/JD
Minimalist recipe on a LIGHT field, not the dark navy promo poster:
- Canvas 1080×1350 (feed). Cream/paper bg `#F5F3EE`, SM navy ink `#0B1322`, blue accent
  `#2E7DF6`, red `#B9271B` only to flag a "myth"/wrong belief. Fraunces serif headline
  (~70px, weight 500/600), Montserrat body, JetBrains Mono kicker, Barlow Condensed masthead.
- A thin 8px blue rule across the very top; masthead `STORAGE MOGULS.` + a corner tag naming
  the lane (`Storage 101`); footer `PRACTITIONERS, NOT PROFESSORS.` + `storagemoguls.ai` over
  a 1px hairline.
- `.wrap` is `position:absolute; top:172px; bottom:150px; flex; justify-content:center` so the
  content vertically CENTERS in the field — this kills the lower-third dead-band that a
  top-anchored block leaves. Re-verify with vision that there's no big empty band.
- ONE distinct layout per idea so the set reads as range, not clones: myth/truth list · check-
  list · big-number contrast (`$100K` vs `$3M`) · two-card compare (dim "what most do" vs blue
  "what works") · numbered 1-4 list. (The engine `style-recipes.md` #1 Minimalist is the base.)

## Caption VOICE = the Storage 100 Picture Guide (Joe's "easy to understand like the YouTube scripts")
When Joe says "easy to understand like the picture guide / the youtube scripts," he means the
**Storage100 Picture Guide voice**, source of truth `~/sm_tx_work/ebook/Storage100_Picture_Guide_v2_swap5.html`:
plain, warm, FIRST-PERSON Joe; short declaratives; ONE idea per line; zero jargon (or a term
defined in the same breath); concrete over abstract ("a storage unit never calls you at 2 a.m.").
Close every SM-brand educational caption with the warm **free Monday-night Storage 101 call**
invite → `storagemoguls.ai` (this is the natural SM educational CTA, not the promo two-step road
map). (Joe's PERSONAL educational content closes to the COMMUNITY instead — see
`personal-day-series.md`.) Run writing-craft + humanizer (no em/en dashes) on every caption.

## ⛔ NAME THE SUBJECT — never leave it to guesswork (Joe corrected TWICE, hard)
Bare "storage" / "self-storage" reads to a stranger as *renting/using a unit*, NOT investing.
EVERY headline, kicker, AND caption (opening line + CTA) must say **"self-storage investing" /
"self-storage investment" / "buy a self-storage facility."** Joe: "never leave anything to
guesswork." This is now Rule 8 in `writing-craft`; apply it on the poster ART and the caption
both. Scan each headline as a stranger with zero context before rendering.
- ⛔ **MANDATORY BARE-NOUN SWEEP (Joe re-corrected on Ep10 after already being told once).** It is
  not just the word "storage." Sweep EVERY bare noun a cold stranger could read wrong and pin it:
  "first-timer"/"first-time buyer" → "first-time self-storage buyer"; "the deal" → "your first
  self-storage deal"; "the seller" → "the storage owner" (first use); "the market" → "the
  self-storage market"; "brokers" → "storage brokers" (first use). Establish "self-storage" in the
  FIRST line, then a bare "the facility"/"the deal" is fine mid-body once context is locked — but
  the OPENER and the CTA must never be bare. Full repeat-offender list is `writing-craft` Rule 8.
- ⛔ **But do NOT over-apply the sweep to in-context LABELS that were already fine** (Joe, Ep10). He
  broke nothing by leaving a Day-4 recap as "The money. The seller. The broker." — those are the
  three fears named by their day, a clear label, not nouns a stranger misreads. When I "fixed"
  seller→self-storage owner there, Joe: "it should be the money the seller and the broker, this was
  already fine." The sweep targets ambiguous nouns, not every occurrence.

## Stories (IG + FB) — reflow the feed poster to 1080×1920
Joe often wants the same posters added as IG + FB Stories. Cheapest reliable reflow: take the
feed poster's HTML and change ONLY `height:1350px` → `height:1920px`. Because `.wrap` is
flex-centered and `.foot` is bottom-pinned, the content re-centers full-bleed with balanced top/
bottom air (no letterbox). For a SPARSE message-first poster (one line + one short subline) the
plain height swap can leave a dead band even when centered — scale the type up ~15-18% and widen
the `.wrap` top/bottom insets (~200-230px) so the block fills the tall field. Render at 1080×1920,
vision-QA the centering. Stories are image-only on Metricool (IG Story rejects `text`), so the
message + URL must be baked into the art. Fuller story pipeline: `brand-poster-design` →
`references/stories-pipeline.md`.

## Scheduling (hand-off to metricool-scheduling)
Upload every PNG (feed + story) to Cloudinary first (`_scripts` config: cloud `dhi6klgd0`) — a
public URL is required; a local path can't be attached. Then `createScheduledPost` per idea:
one feed post to LI+IG+FB, one story post to IG+FB (empty text, `instagramData.type:"STORY"` +
`facebookData.type:"STORY"`). A story fires at the SAME timestamp as its paired feed post.
SM brand id `6425193` has NO X connected. All the create-payload gotchas (offset on `date`, no
`networkData` for a non-provider network, IG-story-no-text) live in `metricool-scheduling`.
