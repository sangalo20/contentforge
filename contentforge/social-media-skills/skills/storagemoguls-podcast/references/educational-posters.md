# Educational posters from an SM episode — light-editorial build (proven SM Ep04, July 2026)

The EDUCATIONAL lane (see SKILL.md "EDUCATIONAL content is a SEPARATE LANE"): each poster
teaches ONE concrete thing from the episode and stands alone. NOT promo. Joe approved this
exact look/voice on Ep04 (Jack Pezzino — "Are You the Right Person to Buy a Storage Facility?").

## Pull the teachable ideas from the Understanding, not the promo angles
The episode Understanding (Notion Episode Library page) already has the ideas. For Ep04 the 5
that made good STANDALONE lessons (each teaches, none sells the episode):
1. The 4 myths that keep people out of self-storage investing (too young / too old / no money / no lender) — myth→truth list.
2. What an SBA loan really asks for to buy your first self-storage facility (~680 credit · manage the business · a deal that cash-flows · 10–20% down · NO track record) — checklist.
3. Match your cash to the right size self-storage deal ($100K → ~$1M works; $3M doesn't) — big-number contrast.
4. Where first self-storage deals really come from (owner outreach beats waiting on brokers) — two-card compare.
5. The skills that get your first self-storage deal aren't real estate skills (follow a process / make the calls / run the numbers / don't quit) — numbered list.

## ⛔ SCANNABLE TEXT BUDGET — headline + ONE short line, no paragraphs (Joe, Ep11 July 2026)
Even inside the message-first rule, my first Ep11 educational batch still had too much on the art
(explanatory sublines, two-card compare bodies, a myth + truth + sub-paragraph). Joe: *"we need to
reduce the amount of text on the posters. They are supposed to be scannable."* Asked how lean, he
picked: **headline + ONE short supporting line (max ~10 words). Drop paragraphs, drop multi-row
cards, drop the sub-explanation.** The concrete budget per educational poster:
- ONE big headline message (the backbone) + AT MOST one short line under it (~10 words max), OR a
  headline + a single number/contrast pair + one short line. Nothing more.
- A myth->truth poster = the myth line + the truth line, and STOP — no explanatory paragraph after.
- A compare = do NOT put two full sentence-cards; reduce to a one-line contrast
  ("A generalist misses what a specialist catches.") or drop the cards for a headline + one line.
- ALL the detail, stats, jargon, and the "why" live in the CAPTION, never on the art.
Grasp-in-one-second is the test. If the eye has to *read* more than a headline + one line, it's too
much. Proven lean Ep11 rebuild: `C:\Users\somea\SM_Ep11_edu\gen_ideas234.py` + `gen_idea1.py`
(each poster = big Fraunces headline + one blue-left-border line, or the $1.5M->$600K pair + one line).

## THE 4-DAY LEARNING-SERIES VARIANT (Joe asked, Ep10 July 2026 — worked first try)
A distinct, reusable cut of the educational lane. When Joe says "curate it into a 4 day series of
learning" / "extract the actionable lessons as a series," do NOT ship the flat 4-5 standalone
poster set. Reframe as a SEQUENCED PROGRESSION where the days build on each other:
- **Curate the Understanding's ideas into N days that form an arc**, not N loose lessons. Ep10's 6
  Understanding ideas collapsed cleanly into 4 days: the 3 fears (money -> seller -> broker) as
  Days 1-3, then the mindset close as Day 4. Supporting facts/deals fold INTO the relevant day
  (the NC $100K deal anchored Day 3; the "no down year in 40+ yrs" fact anchored the Day 4 close).
- **Add a `DAY N of 4` kicker** at the top of the wrap so the poster reads as part of a series:
  a `.day` line (Barlow-Condensed, letter-spacing 6px, the number in blue via `.day .n`) ABOVE
  the existing mono `.kick` (which becomes the lesson label, e.g. "Fear #1 - The Money").
- Everything else is the SAME approved light-editorial look + the scannable budget (big Fraunces
  headline as the backbone + ONE short blue-left-border line). One lesson per day, each stands alone.
- **CAPTIONS chain the days** ("Yesterday we cleared the money fear. Today we talk about the seller.")
  while staying self-contained. Long-form (LI/IG/FB) + a standalone X short per day. Storage-100
  teacher voice; close each with the warm free Monday-night Storage 101 invite (self-contained series
  = NOT episode-selling, unless Joe says point it at the live episode).
- ⛔ **CAPTIONS MUST BE BUILT FROM THE RAW TRANSCRIPT, NOT THE UNDERSTANDING (Joe corrected HARD,
  Ep10 July 2026).** My first two caption passes were built off the Notion Understanding summary and
  Joe rejected them as *"put together ideas rather than a flowing understood lesson"* and *"they
  don't carry the full meat of the lesson."* The Understanding is already one compression away from
  Joe's actual teaching — it flattens the belief→truth shift, the plain-English mechanism ("does the
  money coming in cover the money going out"), the emotional core ("I thought it was written on my
  face"), and the connective logic that makes a lesson FLOW. For deep educational captions you MUST
  pull the episode's `Transcript Video FINAL.docx` from Drive and write from Joe's real explanations.
  The Understanding is fine for picking WHICH ideas and for poster headlines; it is NOT enough for the
  caption bodies. (Download recipe + unzip extraction in SKILL.md "How to access.")
- ⛔ **STRUCTURE each caption on the approved teaching spine (Joe approved Day 1, Ep10).** Joe rejected
  drafts that "just dived in without anything" (opened on the lesson before framing what the piece is
  about) and that "left people hanging." Use the spine in `writing-craft` → Rule 15 +
  `references/teaching-caption-structure.md`: STAGE-SET (what is this / who / why care) → HAND-OFF
  (flat line pointing forward, the POINT never appears before it) → BELIEF (in the reader's words, and
  validated) → TURN → TRUTH + MECHANISM (the why) → CONCRETE PROOF → FIRM CLOSE (a solution or a
  screenshot-able summary, never a hollow "it's fixable") → CTA (separate, after the close).
- ⛔ **NAME THE TRANSITION between days (Joe, Ep10):** "Today we talk about the seller," NEVER "here is
  the second one." A bare positional pointer makes the reader decode; name the day's subject plainly.
  (Also `writing-craft` Rule 8.)
- Worked build: `C:\Users\somea\SM_Ep10_edu\gen_series.py` — reuses the approved `edu1_never_money.html`
  head/style verbatim, emits feed (1080x1350) + story (1080x1920) for all 4 days from one DAYS list.
  Deliver the PNGs + captions to a named Downloads subfolder; Joe likes it ARRANGED (per-day
  subfolders each holding that day's caption + feed + story, plus an `All_Visuals/` folder split
  Feed/Story, plus a README and one combined ALL_captions file). ⛔ Dash-scan the caption file with
  Python (`t.count('\u2014')` etc.), NOT the git-bash `grep` (its `\|` pattern is unreliable and
  false-counts); and remember section HEADERS you write into the deliverable file also get dash-scanned
  — use `/` not ` - ` / em-dash in your own labels or the gate flags your own scaffolding.

## ⛔ PERSONAL-SOCIALS cut: joedowns.ai footer, storagemoguls.ai COMMUNITY CTA (Joe, Ep10 July 2026)
An SM episode can feed content for Joe's OWN personal socials, not just the SM brand page — and the
branding differs. Joe corrected me directly: *"remember its content for Joe not for storagemoguls
page so there should be some joedowns.ai reference as well."* When the deliverable is Joe's PERSONAL
educational content:
- **Poster footer = `joedowns.ai`** (his personal hub), NOT `storagemoguls.ai`. Keep the rest of the
  approved look verbatim (masthead, `Storage 101` tag, PRACTITIONERS NOT PROFESSORS line) — Joe's pick
  when asked was *"keep the look, just swap the footer to joedowns.ai and keep a light Storage 101 tag."*
- **Caption CTA = invite to the COMMUNITY at `storagemoguls.ai`** (his community lives there), e.g.
  "come join us at storagemoguls.ai" / "come join the community learning self-storage investing at
  storagemoguls.ai." So the personal cut splits the two: personal footer on the art, community invite
  in the copy. (Change the footer URL in the generator's `.foot` div and re-render; swap the caption
  close line — leave everything else.)
This is distinct from the pure SM-brand educational lane below, which uses the `storagemoguls.ai`
footer on the art. Ask which lane if unclear; personal content is signalled by "content for Joe" /
"for his socials" / "his personal page."

## The look (light, easy on the eyes — Joe's brief)
Cream field `#F5F3EE`, navy ink `#0B1322`, blue accent `#2E7DF6`, red `#B9271B` only for a
myth/negative. Fraunces serif headline (~70px, `letter-spacing:-1.5px`), Montserrat body,
Barlow-Condensed masthead, JetBrains-Mono kicker. 8px blue hairline across the top. Masthead
`STORAGE MOGULS.` left + `Storage 101` right (marks the educational lane). Footer
`PRACTITIONERS, NOT PROFESSORS.` + `storagemoguls.ai` above a 1px `#D8D3C7` rule. 1080×1350.
Content wrapper vertically centered (`position:absolute; top/left/right/bottom insets;
display:flex; flex-direction:column; justify-content:center`) so there's NO bottom dead band.

## Distinct layout per poster (no clones — brand-poster-design rule)
Reuse the shared `<head>`+`<style>` head, append a small per-type CSS block, one builder each:
- **myth-list**: rows of `.myth` (red quoted excuse) + `.truth` (blue-left-border one-liner).
- **checklist**: `.chk` rows = blue rounded ✓ chip + text; close with an italic `.freed` takeaway.
- **big-number contrast**: `.crow` = huge Fraunces figure (`min-width` so it can't collide with its label) + `.clab`; an `.arrowline` "but…" between the two rows.
- **two-card compare**: `.tcard.dim` (what most people do) vs `.tcard.hot` (blue, what works), each with a mono `.tlab` + `.ttext`.
- **numbered list**: `.pl` rows = blue Fraunces number + text; close with an italic `.freed` line.
Worked generator: `C:\Users\somea\SM_Ep04_edu\gen_edu.py` (reads poster 1 `edu1_myths.html` as the
head donor, appends EXTRA css, emits edu2–edu5). Render each with headless Chrome
(`--headless=new --window-size=1080,1350 --screenshot`), then vision-QA every one.

## Caption voice = Storage 100 Picture Guide (plain, warm, first-person Joe)
Reference file for the voice: `~/sm_tx_work/ebook/Storage100_Picture_Guide_v2_swap5.html`.
Rules: short declaratives, ONE idea per line, no jargon, concrete over abstract, name
"self-storage investing" in the OPENING and the CTA, close with the free Monday-night Storage 101
call invite. No dashes. Run writing-craft + humanizer gates. Approved Ep04 example (poster 1):

> Most people talk themselves out of self-storage investing before they ever look at a deal.
> I hear the same four reasons. And none of them hold up.
> "I'm too young." People in their early 20s buy their first facility every year.
> "I'm too old." Families do it together, on purpose, to build something for retirement.
> "I don't have the money." You can partner, you can find a deal and pass it on for a fee, or you can start with 10 to 20% down. There's more than one door in.
> "No one will lend to me." Find a deal that actually makes money, and the financing usually shows up.
> None of these are about you. They're just stories you picked up somewhere. Every person who buys their first facility gets to put the story down.
> I teach self-storage investing from the ground up on a free call every Monday night. It's called Storage 101. Come learn it with me. storagemoguls.ai

The other four Ep04 captions (SBA / deal-size / outreach / execution-skills) follow the same
shape and all live in the session; regenerate in this voice if not filed.

## Instagram + Facebook STORY versions (Joe asks for these alongside the feed poster, Ep04)
When Joe says "add the poster to Instagram and Facebook stories," produce a 1080×1920 Story
variant of each feed poster — do NOT letterbox the 1080×1350 poster onto a taller canvas (leaves
ugly empty bands). Instead re-render the poster's OWN canvas at 1920 so its full-bleed elements
restretch: the `.p` block + the bottom-anchored/flex-centered `.wrap` + the pinned `.foot` all
reflow to fill the taller field with balanced breathing room. Mechanically: take the feed HTML and
`.replace("height:1350px","height:1920px")` (hits both the `html,body` and `.p` rules), then render
headless Chrome at `--window-size=1080,1920`. Because `.wrap` uses `justify-content:center` with
top/bottom insets, the content re-centers automatically — vision-QA one to confirm no void.
Worked generator: `C:\Users\somea\SM_Ep04_edu\gen_stories.py` (emits story1–story5 from edu1–edu5).
- ⛔ STORY DEAD-BAND on a SPARSE message-first poster (Ep11): a plain `height:1350px`→`1920px` reflow works when the poster is content-dense (Ep04), but when the feed carries only ONE big line + one figure + a short subline, that short block re-centered on the tall field leaves a big empty band even with `justify-content:center` (the block is just too small). FIX that landed: scale the STORY's type up ~15–18% (headline, big numbers, kicker, subline) AND widen the `.wrap` insets to ~200px top/bottom, so the enlarged block fills the 1920 canvas with balanced air. Vision-QA one to confirm no lopsided void. Worked Ep11 generator: `C:\Users\somea\SM_Ep11_edu\gen_idea1.py`.

## ⛔ Joe REJECTED the host-photo composite on educational posters (Ep10 July 2026) — DON'T re-offer it
Bottom line first: on Ep10 Joe asked to try his hoodie photo on educational poster 1, I built the
composite below cleanly, and his verdict was **"This is bad lets just use the initial one."** The
PURE typographic light-editorial poster is what he wants for the educational lane. Do NOT add a host
photo to these posters and do NOT re-offer it. The technique is recorded below only so a future
session (a) doesn't waste the 3 crop iterations if Joe ever asks for a photo composite on some OTHER
deliverable, and (b) knows this was already tried-and-rejected HERE. For educational posters: skip it.

### (Recorded, not for the educational lane) two-zone editorial + photo-band composite
When Joe says "add Joe's photo to this one" / "the same hoodie photo," do NOT float a cutout on
the cream field (looks pasted, clashes with the light look). Proper design = a **two-zone
editorial + photo-band composite**: cream editorial zone on top (masthead + kick + big message +
subline), a full-bleed PHOTO BAND on the bottom ~40%, joined by a cream→transparent gradient so
the photo melts into the field. Name tag + footer live ON the photo in brand fonts.

THE PHOTO (Joe's "hoodie photo"): `C:\Users\somea\BrandAssets\Joe-Downs\LinkedIn\_type-tests\joe_mic_hoodie.png`
(1190×1322 RGB, NOT a transparent cutout — light-blue heather hoodie, at the Shure mic, storage-studio bg).
Sibling `joe_mic_smile.png` is the same shoot. These are near-headshots.

⛔ THE CROP PITFALL (cost 3 iterations Ep10): because the photo is a near-headshot, scaling it to
FULL BAND WIDTH makes his head enormous and crops the face at forehead/chin with no hoodie/mic —
looks amateur. The FIX that landed: fit Joe by **HEIGHT** into the band (crop src from just above
the hairline `src_top≈120` down through the mic, resize that region to band height → gives a ~532px
width), then **RIGHT-ANCHOR** him and fill the rest of the band with a blurred, slightly-darkened
copy of the studio bg (`GaussianBlur(14)`, brightness 0.9). Full head + hoodie + Shure mic all show.

BUILD (keeps exact brand typography — text/tag/footer rendered in Google Fonts, photo composited under):
1. Render an OVERLAY html at 1080×1350 with a TRANSPARENT background (`--default-background-color=00000000`):
   a `.cream` div covering only the top zone (height = band_top, e.g. 812), the masthead + `.wrap`
   message, plus the name tag (`Joe Downs` in Barlow-Condensed + `Host · Storage Moguls` in JetBrains-Mono,
   white, `left:96px bottom:132px`) and the `storagemoguls.ai` footer bottom-right in white — all positioned
   over where the photo band will be.
2. PIL compositor (`comp_photo.py` pattern): cream canvas → paste blurred studio bg into band → paste the
   height-fit right-anchored Joe → cream→transparent gradient (~175px, `(1-y/h)**1.5`) at band top for the
   melt → a LEFT horizontal navy scrim (seats the name tag on a clean field) + a bottom navy scrim (footer
   legibility) → `alpha_composite` the transparent overlay PNG on top.
Worked files: `C:\Users\somea\SM_Ep10_edu\edu1_photo_overlay.html` + `comp_photo.py` →
`edu1_never_money_photo.png` (built clean but Joe REJECTED it for the educational lane — see the
warning at the top of this section). Vision-QA the crop EVERY time — the face-cutoff is the
failure mode. Approved copy stays VERBATIM; adding the photo changes only the art (layout), never the words.

## Educational lane WITH an episode CTA (Joe, Ep10 — when the episode is ALREADY LIVE)
Default educational CTA funnels to the Monday Storage 101 call. But when the episode is already
published, Joe may ask for "educational with a CTA for the episode." Then the caption close points to
the LIVE episode ("The full episode is live now on the Storage Moguls YouTube") + storagemoguls.ai as
the community step — NOT the promo "drops Tuesday" road-map, and NOT only the Monday call. Still
educational voice (each piece teaches + stands alone); only the tail changes. If no live YouTube watch
URL is in the Drive source docs, say "live now on the Storage Moguls YouTube" + storagemoguls.ai and ASK
Joe for the watch link to slot in — never invent/link a URL that may 404 (skill's own rule).

## CTA note
Educational SM content funnels to Joe's PERSONAL Storage 101 teaching call (storagemoguls.ai),
NOT the promo "follow + drops Tuesday" road-map. The value is the point; the invite is warm.
(Exception: episode-already-live variant above — point to the live episode + storagemoguls.ai.)

## Scheduling note (Ep04 belief CORRECTED by Ep10)
The MCP loads at STARTUP. If it was enabled when the session began, the `mcp_metricool_*` tools are
ALREADY LIVE — schedule right there, no restart needed (verified Ep10: enabled a turn earlier, tools
live the next turn, all 12 posts scheduled in-session). Only if it was `false` do you
`hermes config set mcp_servers.metricool.enabled true` and have the user open a new chat. Don't keep
insisting on a restart once `getBrandSettings` returns — that means the tools loaded. SM Metricool =
LinkedIn/IG/FB only (no X). TZ: Metricool timestamps are ET; host clock is EAT (UTC+3) = 7h ahead of
ET — use Python `zoneinfo` to get real ET before judging whether a slot (e.g. 8am ET) has passed.
Full verified call shapes (the `-04:00`/`-05:00` offset requirement, `brandId` vs `blogId`, per-platform
info blocks, the collision sweep) are in `references/metricool-scheduling.md`.
