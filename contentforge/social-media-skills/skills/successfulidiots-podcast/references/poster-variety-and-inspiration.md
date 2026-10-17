# Poster VARIETY across a batch + adapting outside design inspiration to brand
(Joe corrected, SI Ep016, July 2026)

## The trap: one template reskinned N times
After several redo rounds got the Ep016 COPY right, Joe rejected the finished
poster set on a NEW axis: *"These posters are all dark and all look the same."*
Every one of the 8 was the same layout — dark SI navy field, one big Oswald
headline in white with a yellow key phrase, a lead line, optional bullets/callout.
The copy varied; the DESIGN did not. That is the batch-gen trap: swapping text on
one card and calling it 8 posters. A feed of 8 identical-looking dark cards reads
as one thing posted 8 times, and it's visually flat.

This is the visual sibling of the long-standing "don't re-skin one idea into many
near-identical pieces" rule — but there it was about IDEAS, here it's about the
VISUAL VOCABULARY of a same-episode batch. Both fail the same way: repetition
where the eye wanted range.

## The bar: genuinely different visual VOCABULARIES, not one card recolored
Real variety = each poster is a different *species* of design, e.g.:
- bold **color-field** (full yellow or green bleed, huge display type) — this alone
  breaks the all-dark monotony; do NOT make every poster navy.
- **photo-hero** (a real cutout photo as the subject + a text band)
- **conceptual image metaphor** (a striking single image carrying the idea, big
  one-word headline + plain subhead below — think the elephant-foot/ant "DESIGN"
  poster)
- **editorial / collage** (surreal or layered scene, margin annotation labels with
  little arrows, a big italic display headline, a number tag)
- **big-number / stat hero**, **typographic quote card**, **text-message mockup**,
  **terminal/prompt card**, **before/after or positioning diagram**.
Mix LIGHT and dark across the set — Joe explicitly wanted the batch to read
"bright and lightweight," not 8 dark cards. Keep brand LOCKED throughout (SI navy
`#11151F` / yellow `#FDE801` / green `#16A34A`, Oswald/Open Sans/Space Mono,
`successfulidiots.ai` footer, logo) — variety is in LAYOUT/COMPOSITION/FIELD-COLOR,
never in swapping the brand palette.

## ⛔ Joe often SPECIFIES the compositions he wants — build exactly those, then choose the rest
When the generic "make them varied" round still isn't landing, Joe names concrete
composition treatments and assigns them: *"get at least one of the posters to have
both Joe and Peter in them, and another to have a cutout, and another text-centered,
and another negative space; the rest you can choose."* Treat these as a fixed spec:
- **Both hosts** — ⛔ do NOT default to a raw side-by-side PHOTO STRIP + divider band.
  I built that first (two `joe_real`/`peter_real` headshots hard-cut down the middle with
  a yellow divider line, parked as a flat band with a dead gap above it) and Joe rejected
  it outright: *"the way you have created the first poster is so bad, it's not even proper
  design."* Two things stacked in one frame with a void between them is not a composition.
  **The RIGHT way is the approved `SI_LinkedIn_Poster_Ep29_60pct-hosts_v1.html` pattern:**
  use the illustrated CHARACTER cutout (`LinkedIn/SI_char_duo_at_mic_T.png`, the clean
  yellow-hoodie mascots), centered and BLEEDING OFF THE BOTTOM edge at large scale so the
  characters ANCHOR the composition and rise into the frame — headline hero up top,
  green-rule mono story line, characters as the lower visual base. The exact CSS that
  works: `.char{flex:1;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;}`
  + `.char img{width:~720px;margin-bottom:-6px;}` (mirrors the approved 60% poster). The
  eye flows headline → story → characters as ONE integrated layout; the breathing room
  above the characters reads as intentional (the reference has the same), not a dead void.
  The raw host studio photos are better reserved for a top-bleed photo + lower text band
  on a single-host angle, NOT a two-up divided strip. If you DO need a duo photo strip,
  build it with ImageMagick (`-resize 540x620^ -gravity north -extent 540x620` per host,
  `+append`, yellow `-draw "rectangle"` divider) — but the character-cutout pattern is the
  proven, Joe-approved way to put "both hosts" on a poster.
  - ⚠️ **Char-cutout on the v7 fixed-skeleton generator: `flex:1` alone leaves the characters FLOATING in the middle with a dead gap below (verified SI Ep032).** On the v7/`W(name,theme,extraCss,body)` skeleton, a `.char{flex:1;align-items:flex-end}` block only fills the leftover `.mid` space — if the cutout image isn't tall enough to reach the page bottom it centers in that space and reads as a mid-poster float, NOT a bottom bleed. FIX that worked: pull the char out of normal flow and pin it to the page bottom so it truly bleeds off the edge:
    `.char{position:absolute;left:0;right:0;bottom:0;margin:0;height:560px;align-items:flex-end;z-index:1;}` + `.char img{width:~740px;margin-bottom:-8px;}` and set `.mid{justify-content:flex-start;padding-top:8px;padding-bottom:0;}` so the headline+body anchor at the TOP and the characters own the bottom.
  - ⚠️ **The bleeding cutout then OVERLAPS the footer text — give the footer a solid band on top (verified SI Ep032).** Once the char is pinned to `bottom:0`, the mascots' hoodies/mic sit behind `Joe Downs + Peter Swain` / `successfulidiots.ai` and obscure them. FIX: `.foot{position:relative;z-index:3;background:#15151F;margin:0 -62px -62px;padding:20px 62px 26px;}` — a solid navy footer band (full-bleed via negative margins matching the 62px pad, higher z-index than the char) keeps the footer fully readable ON TOP of the characters. Drop the hairline top-border for this poster since it's now a solid band. Always vision-QA specifically: "is the footer text fully readable and not obscured by the characters, and do they bleed off the bottom (not float mid-poster)?" Worked build: the Idea-9 block in `C:\Users\somea\BrandAssets\_scripts\gen_si_ep032.js`.
- **Cutout** = a transparent SI illustrated-mascot cutout
  (`LinkedIn/SI_char_duo_at_mic_T.png` is clean — no baked-in name-label boxes; some
  other `_T` cutouts DO have "JOE DOWNS"/"PETER SWAIN" labels, vision-check first).
  Drop it bottom-right via `<img>`, headline left, so it doesn't collide with text/footer.
- **Text-centered** = a centered composition (small setup line → big hero line → payoff
  → body), `text-align:center;align-items:center`. Good for a single punchy line like
  the "$100,000 for ten minutes?" test.
- **Negative-space** = one large headline high on the canvas, a short note low, lots of
  intentional empty field between (best on a color field — reads confident, not empty).
Map his named treatments to the ideas whose message each carries best, build those
exactly, then pick species for the remaining slots. Restate his mapping back to him
before building so there's no misread.

## ⚠️ Color-VARIATION build gotchas (theme-swapping a shared poster generator)
Joe: *"you can use different color variations, they don't always have to be dark."* When
you add a `theme` param to a shared `page()` generator to flip some posters to yellow /
green / paper fields, two bugs bit HARD this session — check for both:

1. **Arg-nesting: `page(std(...), theme)` vs `page(std(...`, theme`))`.** If posters use a
   `std(kick, mid)` wrapper INSIDE `page()`, the theme arg must go on `page()`, NOT inside
   `std()`. Writing `page(std("kick",\`...\`,"green")))` passes "green" as a 3rd arg to
   `std()` (which ignores it), so `page()` gets one argument and silently defaults to navy.
   The poster renders dark and you think the theme "didn't apply." Correct form:
   `page(std("kick",\`...\`), "green")` — close `std()` FIRST, then the theme is `page()`'s
   2nd arg. Posters that call `page(\`...\`, theme)` directly (no `std` wrapper) worked fine;
   only the `std`-wrapped ones broke. After any theme edit, vision-QA that the background
   colour actually changed.

2. **Inline `color:` styles BEAT theme-override CSS → invisible text on light fields.** A
   theme override like `.head{color:navy}` will NOT win over an element that carries an
   inline `style="...color:#fff"` (inline specificity beats a stylesheet rule). On a
   PAPER/cream or yellow field, any headline/card/body that hard-codes white inline text
   stays white and vanishes. This is why the "paper" theme was abandoned mid-session — the
   posters had inline `color:#fff` on headline spans and TODAY/AFTER cards that went ghost
   on cream. Fixes: (a) don't hard-code text colour inline on elements you intend to
   theme — let the theme CSS set it; or (b) if you must keep a light field, rewrite THAT
   poster's inline colours to dark for the light theme. Simplest reliable path: prefer
   **yellow** and **green** fields (they take navy/white text predictably) over paper for
   the bright variety, unless you're willing to hand-fix every inline colour. Always
   vision-QA a recoloured poster for "any element invisible / wrong contrast?" — a silently
   white-on-cream headline looks like the headline is "missing."

Final Ep016 spread that worked: 5 navy + 2 yellow + 1 green, with the four named
compositions (hosts photo / cutout / text-centered / negative-space) among them.

## ⛔⛔ STYLE ≠ CRAFT — copying an inspiration's LOOK without its DESIGN PRINCIPLES fails just as hard (Joe corrected, SI Ep016, July 2026)
This is the deepest poster lesson of the session and the easiest to miss. After I
rebuilt the 8 with real variety (color-field, photo-hero, cream editorial, split,
etc.) AND real Unsplash photos, Joe still rejected them: *"These are bad. In an
attempt to follow the inspirations you have left out all design principles."* I had
copied the SURFACE of the reference designs (a yellow field, an annotation tag with
an arrow, a big italic headline) but skipped the FUNDAMENTALS that make those
references actually work: engineered hierarchy, a real grid, a dominant focal point,
balance, contrast, alignment, active whitespace. The result was flat amateur layouts
— big text blocks dumped on a color field, weak hierarchy, arbitrary spacing, a lone
arrow pointing at nothing, dead voids.

**The fix that worked = engineer the `design-principles-checklist.md` (in the
`brand-poster-design` skill) into EVERY poster before rendering, not decorate after.**
Read that checklist; it is the standard. Concretely, on the ONE test poster that
finally passed (Idea 3, airport-board photo-hero):
- **Hierarchy, ~3:1 scale jumps.** Photo (hero) → big yellow stat "12" (focal group)
  → headline (primary) → body (secondary) → footer (tertiary). Each step is a clear
  size/weight drop; the headline is NOT the same weight as the body.
- **One dominant focal point.** The photo carries the concept; in the lower zone the
  giant "12" is the single eye-magnet, grouped tight with its label (proximity).
- **Real grid + alignment.** One left margin (84px) shared by stat, headline, body;
  shared baselines; nothing eyeballed.
- **Figure-ground contrast.** Type sits on a SOLID navy panel (photo fades into it via
  a gradient), not floating on a busy image.
- **Active, balanced whitespace.** Room to breathe, no dead band, nothing crammed.

Run the checklist's principles as ENGINEERED constraints in the generator up front. A
poster that merely resembles a nice reference but has no hierarchy/grid/focal point is
the amateur-layout failure — style is necessary but NOT sufficient.

### ⛔ Don't mimic a REFERENCE ASSET'S template either — Joe usually means the CRAFT, not the look
Twice this session I over-mimicked a thing Joe pointed at: once the Storage-100 ebook
(built lesson-badge "book pages" — see the COPY-CRAFT-vs-LAYOUT rule in the main SKILL.md),
once the Pinterest inspirations (copied their motifs, skipped their principles). The
pattern: **when Joe references another asset as a model, he almost always means its
WRITING clarity / composition PRINCIPLES, not its literal visual template.** Extract the
transferable craft (hierarchy, flow, one-idea-per-line, focal point), rebuild in SI's own
form. Confirm which if unsure; default to craft over template.

### Pitfall — absolute-position `top:` math threw text OFF-CANVAS and left a giant void
First attempt at the test poster used hand-computed `top:` values on children inside an
absolutely-positioned lower panel; the coordinates were measured from the wrong origin,
so the headline+body rendered off-canvas and the whole lower half was a dead void, with
the stat colliding into the footer. **Fix: lay out the lower/content zone with NORMAL
FLOW — a flex column (`display:flex;flex-direction:column;justify-content:space-between`,
padded) — so the focal group sits at the top, the footer pins to the base, and whitespace
distributes automatically.** Don't hand-compute vertical offsets for stacked text blocks;
let flow + flex do it. Always vision-QA that headline AND body actually RENDERED (a broken
coordinate or a broken `file://` image path renders blank — the poster looks "empty" not
"error").

### ⛔ MONOTONE needs to be BOLDER (Joe: "for monotone it needs to be bolder")
When a poster's hero is a monotone/grayscale photo, a normal type treatment reads FLAT
against the desaturated image. Push it: heavier + bigger display type (uppercase Oswald
700 headline, oversized stat), stronger photo contrast (`grayscale(1) contrast(1.28)
brightness(.82)` worked), a soft glow on the accent numeral, a darker scrim so type wins
figure-ground. The bold treatment is what makes a monotone poster look deliberate and
premium rather than washed out. Vision-QA specifically for "does it read BOLD/confident,
not flat?" on any grayscale/duotone piece. Also: if a duotone source photo is nearly
black on one side (a dim night shot), lift it (`brightness(1.15)`) and pull the text off
the black area, or it reads as text on a black rectangle (a dead void, not a photo).

### Process: prove ONE poster to the bar, THEN build the batch
When Joe rejects a set on design craft, DON'T rebuild all 8 blind. Rebuild ONE (pick the
one easiest to judge composition on — a photo-hero), vision-QA it against the checklist,
show it as the single EXAMPLE, and get his read on the standard before applying the same
engineered system to the other 7. This session that saved building 8 wrong posters twice.

## Adapting outside design inspiration (Joe sends Pinterest-style examples)
Joe's workflow when the posters are visually flat: he pulls real-world poster
inspiration (Pinterest, ad creative) and sends the images. How to receive + use
them:
- **He drops the images into `C:\Users\somea\Downloads\Telegram Desktop\`** (Telegram
  Desktop's default save folder) — the runtime here is the Hermes DESKTOP app, NOT
  Telegram, so there is no "send it in Telegram chat"; the handoff is a folder path.
  He may also use `Downloads/` directly. Ask for / confirm the path, then read each
  image with `vision_analyze`.
- For EACH inspiration image, extract the **design LANGUAGE, not the content**:
  layout structure, where text sits, type sizes/weights, hero visual type
  (photo/illustration/metaphor/none), negative space, editorial touches
  (annotations, script accents, numbers), overall feeling. ⚠️ Extract the
  PRINCIPLES (hierarchy, grid, focal point, balance) too — not just the decorative
  motifs — or you repeat the STYLE≠CRAFT failure above.
- Then **map each idea's message onto the style that best carries it**, and rebuild
  the batch as a mixed set — SI brand colors/type/logo throughout, the locked
  deeper-truth copy unchanged, each poster in its own borrowed-and-rebranded
  vocabulary. Joe: *"stay on brand with colors and everything — these are
  inspirational design STYLES."* So: their composition + principles, our brand.

## Photo / illustration heroes need image assets — confirm the source
Several of the richest inspiration styles (photo-hero, conceptual metaphor,
color-field-with-photo) depend on a real hero IMAGE. Options, in order of fidelity:
1. **User-provided images** (Joe already has photos he likes, from a prior batch /
   Canva / a stock folder) — MOST reliable, because he picks images he trusts. He
   drops them in a folder (e.g. `Downloads\Telegram Desktop\`); composite those.
2. **A proper stock-photo API with a key** — the reliable way to pull relevant real
   photos on demand. Unsplash API (free, unsplash.com/developers → New Application →
   Access Key, ~50 req/hr) lets you SEARCH by scene, see the actual results, pick the
   best. If Joe wants real relevant photos, ask him for the free Unsplash Access Key.
3. **AI image gen** for a photo/metaphor hero — CONFIRM it's cleared, AND that a model
   is actually wired in. See the reality check below before promising this.
4. **Real host photos** already on disk (`_remotion/public/joe_mic_smile.png`,
   `peter_swain.png`, `Successful-Idiots/LinkedIn/joe_real.png` / `peter_real.png`) as
   photo heroes on pieces whose angle a host owns.
5. **Photo-free variety** — bold color-field type treatments + editorial-annotation
   layouts deliver real range with zero image dependency; use these to guarantee a
   varied batch even if no image source is available.
Don't silently ship an all-dark type-only set when Joe asked for variety — if image
assets are the blocker, say so and offer the options above.

### ⚠️ Stock/gen image reality check (verified SI Ep016, July 2026 — do NOT re-burn this time)
The no-key image routes I reached for did NOT reliably produce scene-specific heroes:
- **Unsplash Source** (`source.unsplash.com/...?keyword`) is DEPRECATED — returns an
  HTML page, not an image. Dead.
- **Pollinations** (`image.pollinations.ai/prompt/...`) returns a valid JPEG but
  IGNORES compositional/scene prompts — asked for "parent in bleachers on a phone," got
  a generic studio portrait of a face. Useless for a specific scene.
- **LoremFlickr** (`loremflickr.com/W/H/keyword`) returns real Flickr-CC photos with no
  key, BUT keyword matching is unreliable — "smartphone,texting" gave a skating rink,
  "empty,office" gave a log cabin. Occasionally returns an empty file (retry). Fine only
  when any on-theme photo will do, not for a poster that must say something specific.
So for RELIABLE, RELEVANT real photos the honest answer is option 1 (user images) or
option 2 (Unsplash API key). Env check that mattered: there is NO image-gen model wired
into this profile by default (no ComfyUI / DALL·E / Imagen MCP; the google_token is
Workspace-only). Recheck per session, but don't promise generated heroes before
confirming a model exists — offer the photo-free + real-host variety instead and get a
varied set in front of Joe TODAY rather than blocking on image sourcing.

### ✅ Unsplash API — the WORKING recipe (Joe provided the key, SI Ep016, July 2026)
Joe gave a real Unsplash Access Key; it's saved at
`C:\Users\somea\BrandAssets\_scripts\unsplash_keys.env`. This is now the go-to for
relevant real hero photos. Verified end-to-end recipe:
1. **Search** (never download blind — SEE the candidates first):
   `curl -s -H "Authorization: Client-ID <ACCESS_KEY>" "https://api.unsplash.com/search/photos?query=<url-enc>&per_page=4&orientation=landscape"`
   Parse the JSON with `C:/Python313/python.exe` (git-bash `python3` alias is missing);
   print each result's `id`, `alt_description`, and `urls.regular`.
2. **QUERY BREADTH matters** — an over-specific query returns 0 results (verified:
   "parent on smartphone at child sports game bleachers" → 0 total). Broaden to the
   core noun/scene ("airport departure board", "person looking out window", "man on
   phone night room") and pick the best hit. If a scene is too niche to source cleanly
   (e.g. a literal "distracted parent at a wrestling match"), DON'T force a weak photo
   — pivot that idea to a photo-free color-field/editorial treatment instead.
3. **Download** the chosen photo: fetch `GET /photos/<id>`, then download
   `urls.raw + "&w=1400&q=80&fm=jpg"` (raw + explicit params gives a clean sized JPEG).
   **TOS:** also hit the photo's `links.download_location` (with the Client-ID header)
   to register the download, and keep `user.name` for the photographer CREDIT (put
   credits in the caption/handover when the photo ships).
4. **Treat for brand** with ImageMagick (installed: `magick`). To force an off-brand
   or clashing photo onto the SI palette, navy-duotone it:
   `magick in.jpg -colorspace Gray -level 3%,97% \( -size 1x2 gradient:"#0B0E16"-"#E9EBF0" \) -clut out.jpg`
   (killed a red-lit room's colour so it read as on-brand navy). A B&W/grayscale photo
   (`filter:grayscale(1)` in the poster CSS, or `-colorspace Gray`) also drops any photo
   cleanly onto the SI dark spine. For a MONOTONE photo hero, push contrast bold (see the
   MONOTONE rule above): `grayscale(1) contrast(1.28) brightness(.82)`.
5. **Composite** into the poster HTML via `<img src="file:///.../hero.jpg">` with a
   navy/paper gradient overlay for text legibility; render + vision-QA (confirm the
   photo actually LOADED — a broken file:// path renders blank). Worked build:
   `C:\Users\somea\BrandAssets\_scripts\gen_si_ep016_v3.js` (8 mixed-vocabulary posters)
   + `render_v3.py`; the single design-principles-passing test poster is
   `_scripts/gen_test3.js` (photo-hero built to the checklist — use its structure as the
   template for photo-hero posters). The reverted clean-navy-base + named-compositions
   build is `_scripts/gen_si_ep016_v5.js` (theme-param color variation + duo-photo/cutout/
   centered/negative-space).

### Copy PNGs to Downloads without tripping the destructive-action guard
Copying the rendered posters to `Downloads/SI_Ep0NN/` for Joe to review: do NOT prefix the
copy with `rm -f <dir>/*.png` to "clean first" — a bare `rm` on a Downloads path triggers the
destructive-action approval guard and blocks the whole command (verified SI Ep016). Just
`mkdir -p` the folder and `cp` the PNGs in (overwrite is fine); if you truly must clear stale
files, do it as its own step and expect an approval prompt.

## ✅ THE RESOLUTION — one shared skeleton copied from the approved two-mode refs (SI Ep016 v7, the build that finally landed)
After every invented-layout attempt failed, what worked was abandoning invention entirely
and copying the SKELETON of the two APPROVED reference posters, then varying only background
+ focal treatment. Joe's last correction was specifically about DISCIPLINE: *"align things
properly, the font sizes also — proper design, redo."* The fix:

1. **Render + study the two mode references FIRST** (don't build from memory):
   - dark case-file mode → `SI_Ep30_systems_v2.html` ("STOP PROMPTING. START BUILDING.")
   - brutalist-yellow mode → `SI_Ep30_do-it-with-it_v2.html` ("DON'T TEACH IT. DO IT WITH IT.")
   They are the SAME layout skeleton on two backgrounds — which is exactly the proof that
   background can vary while structure/discipline stays constant.
2. **Lock ONE skeleton for the whole batch (this is the alignment fix):**
   - Fixed margins: 62px all sides.
   - Fixed TYPE SCALE (deliberate steps, reused on every poster): wordmark 26 / EP.0NN 18 /
     sticker-tag 19 / HERO headline 96-150 (2-line, `line-height:.92`) OR big STAT 200-320 /
     sub 50 / mono body 32 / footer 22. No eyeballed per-poster sizes.
   - Everything LEFT-ALIGNED to one shared edge (or deliberately `text-align:center` on a
     centered piece) - shared left margin from tag through hero, sub, body.
   - Content vertically CENTERED in a `.mid{flex:1;display:flex;flex-direction:column;
     justify-content:center}` between the pinned top furniture and footer, giving balanced
     calm negative space above+below and no bottom dead-void.
   - Identical furniture on every poster (wordmark top-left, `EP. 0NN` top-right muted,
     hairline-top footer `Joe Downs + Peter Swain` / `successfulidiots.ai`) = UNITY.
3. **Vary ONLY background + focal treatment per idea.** Background via a small `TH` theme
   map (dark `#15151F` / yellow `#FDE801` / green `#16613A`) that sets bg + ink + grid +
   tag colours + accent together, so light-field text is dark and never goes invisible
   (this is the fix for the inline-white bug from v5). Focal species: headline-hero /
   big-stat / centered-stat / character-cutout-bleeding-bottom / quote-concept. A good
   spread: ~5 dark + 2 yellow + 1 green.
4. **Fixed the stray gotchas at render:** a big centered `$100,000` stat needs `white-space:
   nowrap` + `line-height:1.0` + a `margin` under it so the sub doesn't ride into its
   descenders; a decorative faint quote-mark needs `margin-top` so it clears the sticker tag.
Worked build: `C:\Users\somea\BrandAssets\_scripts\gen_si_ep016_v7.js` - one `CSS(bg,ink,grid)`
function + `TH` theme map + a `W(name,theme,extraCss,body)` writer, 8 posters, mixed
backgrounds, all on the fixed skeleton/type-scale. This is the template to copy for the next
episode's poster batch (change copy + theme assignment, keep the skeleton).

## ✅ THE BUILD THAT LANDED WITHOUT A REJECT LOOP (SI Ep032 v2, July 2026) — research + refs FIRST, then one clean pass
Ep032's poster batch passed on the FIRST rebuild (after the copy was approved) — no multi-round design grind. What made the difference, in order:
1. **Joe asked to "research graphic design and produce beautiful posters" — so DO the research, don't wing it.** Pulled the canonical principles fresh (IxDF "Principles of Design": hierarchy w/ ~3:1 as a *standard rule* not a law, dominance/one focal point, balance, contrast, alignment-on-a-grid, proximity/Gestalt, scale, active whitespace, unity) + re-read `claude-design/references/brand-social-posters.md` and `brand-poster-design/references/design-principles-checklist.md`. (Canva's learn pages are Cloudflare-blocked to the headless browser; IxDF works.)
2. **VISION-STUDY the two approved reference renders before writing a line of generator code** — `_ref_SI_Ep30_systems_v2.png` (dark) + `_ref_SI_Ep30_do-it-with-it_v2.png` (yellow). The takeaways that mattered: content sits as ONE block anchored middle-to-lower with confident calm space above (editorial, NOT dead-centered); ~4:1 type contrast (huge Oswald headline vs small Space-Mono body); the yellow sticker tag is OPTIONAL not mandatory; on YELLOW the headline is navy/black with a GREEN accent word (never yellow-on-yellow) and the body/footer are navy; the footer is wordmark-left + `successfulidiots.ai`-right over a hairline rule.
3. **Build ONE fresh generator copying that skeleton** (don't reuse a stale one blind): `C:\Users\somea\BrandAssets\_scripts\gen_si_ep032_v2.js` — a `CSS(t)` fn + `TH` theme map (dark / darkG[green-accent] / yellow / green), 72px grid, fixed type scale, one focal SPECIES per poster (big-stat 2-3 / comparison-rows / big-stat 15MIN / money-jump $10 to $40 / char-cutout / big-stat $2,000 / headline-hero / promo-announcement). The `darkG` theme (same navy bg, green tag+accent instead of yellow) is a cheap way to give one dark poster its own identity in the batch without a new background.
4. **Poster N must match the NEW approved caption N.** After a copy-approval round, re-read the captions file and write each poster's headline+body to land the SAME solution that caption lands on (this is the existing "POSTER N MUST MATCH CAPTION N" rule — apply it when the captions CHANGED, not just when reordered).
5. **Vision-QA EVERY poster explicitly for VISIBILITY** (Joe: "ensure everything on the visuals is visible") — ask per poster: is every element (tag/stat/sub/body/footer) fully visible, nothing clipped at an edge, nothing colliding, nothing invisible/low-contrast on its field? Big stats (`15 MIN`, `$2,000`, `2-3`) are the top clip risk — `white-space:nowrap` + size so the longest token clears the margin. The char-cutout footer-overlap + float fixes (above) are part of this.
This is the template + order to copy for the next episode's poster batch. The lesson: the research + ref-study is not optional ceremony — it is what replaced the 6-round grind with one clean pass.

## ⛔ SI IS BRIGHT / NEO-BRUTALIST — a dark cinematic PHOTO poster reads OFF-BRAND (Joe rejected, Canva test, July 2026)
Testing a graphics-rich Canva build, I made a full-bleed DARK photo hero (a dim
storefront + red neon CLOSED sign, navy scrim, white/yellow type). Joe rejected it flat:
*"I don't like it, it's not clean and it's not on brand."* Two failures worth naming:
- **NOT CLEAN:** the murky under-lit photo read as "black with a red smudge" (you couldn't
  tell it was a storefront), a big dead-black VOID sat between the top eyebrow and the
  bottom-crammed text, and the CLOSED sign collided behind the headline. A dark photo that
  isn't confidently lit becomes a void, not a hero.
- **NOT ON BRAND:** the moody, dark, cinematic, photo-heavy treatment is NOT the SI look.
  SI's identity (from the components file + the approved Ep29/Ep30 posters + the site) is
  **bright, confident, NEO-BRUTALIST: light/white or clean-navy fields, the yellow pill/
  sticker tag, bold black/white type, green highlight blocks, hard offset shadows.** A
  gloomy black photo poster reads like a thriller movie ad, not Successful Idiots. I chased
  "graphics-rich = dark photo" and drifted off-brand — that was the mistake.
This is the same root as the "don't make every poster navy — bright and lightweight" rule
above, escalated: it's not just monotony, a DARK CINEMATIC treatment is actively off-brand
for SI. When a piece wants a photo, prefer a CLEAN, well-lit subject on a LIGHT field (like
the editorial references Joe sends), or a duotone that stays bright — never a dim night shot
as the whole canvas. And "more graphics" does NOT mean "darker/moodier"; it means richer
LAYOUT + confident type + the SI brutalist furniture, staying bright and clean.

## Do this UP FRONT next batch
Visual variety AND design-principles craft are first-pass requirements, same as the 4
copy stages. When you first author the generator(s) for an episode, plan the 8 as 8
DIFFERENT design species (some light), AND engineer hierarchy/grid/focal-point/balance/
whitespace into each from the checklist — not one template you'll text-swap, and not a
surface copy of an inspiration with no fundamentals. Keep the batch BRIGHT and on-brand
(no dark cinematic photo posters — see the SI-is-bright rule above). Retrofitting any of
this after a full render+QA pass is the same expensive re-render grind the copy stages caused.
