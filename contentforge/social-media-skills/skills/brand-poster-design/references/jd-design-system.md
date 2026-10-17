# Joe Downs (JD) — Personal Brand Design System

Locked with Joe, June 2026. This is the reusable rule set for ALL Joe-as-brand posters/graphics across content types. Pair with the Notion "Joe Downs — Brand Definition" page (voice/goals) and brand-knowledge-hub.

## Brand spine (NEVER break — this is what makes a post recognizably Joe)
- **Background:** near-black navy `#0A0E16` (alt `#0B0F1A` / `#05070C` for cinematic).
- **Primary accent:** electric blue `#2E6BFF`, bright variant `#3D7BFF`, light tint `#6FA0FF`, deep fill `#1E5BFF`.
- **Secondary accent (RESERVED — Joe decided June 2026):** amber/orange `#F5A623` (deep `#E08A00`) stays OUT of the clean/static design system entirely — NO amber on minimalist or photo-centric posters. Use amber ONLY in (a) MOTION — videos/GIFs — and (b) HANDWRITTEN comparison infographics (hand annotations/marks on the dark navy spine, NOT cream). Blue `#2E6BFF` remains the primary identity accent everywhere else. (Tested amber as a full clean-style co-accent June 2026 — two mockups; Joe declined to promote it, scoping it to motion + handwritten only.)
- **Text:** white `#FFFFFF` / off-white `#EAF0FA`; muted slate `#8A93A6` / `#7d8aa3` for meta.
- **Type:**
  - Clean styles → `Inter` (700–900 headlines, 400–600 body) + `JetBrains Mono` for bracket labels & meta.
  - Handwritten style → `Caveat` (headlines/accents) + `Patrick Hand` (body) + JetBrains Mono for the top bracket label only.
- **Signature devices:** bracket labels `[ LIKE THIS ]`; faint technical grid (clean) or blue dotted graph-paper (handwritten); glowing blue particle/sphere/ring motifs; numbered `01/1` markers; `→`/`↳`/`⤴` arrows; inset 1px frame.
- **Footer (DEFAULT = `joedowns.ai` + a "what Joe does" byline).** Joe's call (June 2026): "The Real Reps" CTA is **OFF by default**. Right side = `joedowns.ai`. Left side = a concrete byline describing **what Joe DOES** — his roles/work — NOT generic adjectives and NOT audience descriptors. ⚠️ Joe corrected this twice: words like "operator / investor / builder" describe his AUDIENCE as much as him — do NOT use vague adjective lists. Use real, specific facts about his work, e.g.: "CEO, Belrose Group · Founder, Storage Moguls" · "Self-storage acquisitions · syndication · development" · "Host, Self Storage Investing podcast" · "$29M+ in storage acquired · $11M+ raised". Pull from his actual roles (CEO Belrose Group/Storage; Founder Storage Moguls; podcast host; Belrose Group storage acquisition/development/asset management). Vary to fit the post. Only add "The Real Reps" newsletter CTA when Joe EXPLICITLY asks.
- **Mood:** premium + technical + raw-operator. A builder's brand, not a soft personal brand.

## Amber as a clean-style co-accent (DECIDED — June 2026: NO)
Joe evaluated promoting amber `#F5A623` from "handwritten annotations only" to a real co-accent in the clean styles, then **DECIDED AGAINST IT.** Final rule (see brand spine above): amber stays OUT of clean/static design — used ONLY in motion (videos/GIFs) and handwritten comparison infographics; electric blue remains the sole clean-style accent. The mockup pattern below is retained as the reusable procedure for ANY future "thinking of adding [color] to the brand" request.

**The mockup pattern (reusable for ANY "thinking of adding [color] to the brand" ask):** Joe doesn't decide a palette change from a hex swatch — he decides from seeing it ON real posters. When he says "let's do N mockups using [color] as a co-accent," build N **structurally distinct** posters that each deploy the candidate color in a DIFFERENT role, so he can compare jobs, not just shades:
1. Hold the brand spine intact (navy bg, blue still present, Inter/JetBrains, footer rule) and DELIBERATELY break the existing color restriction in just these test files — that's the whole point of the test. Render to a `_amber-test/` (or `_<color>-test/`) scratch dir, not the live pipeline.
2. Make the mockups different SPECIES, not reskins: e.g. (a) **minimalist, candidate-color = HERO** (the big stat number + key phrase carry it, blue stays structural) to see the color pure; (b) **photo-centric, blue PRIMARY + candidate-color = CTA/action accent** to see it COEXIST with blue in a real deploy. One isolates the color, one tests coexistence.
3. A gradient bar that hands off candidate-color → blue is a clean way to show the two accents relating rather than fighting.
4. Present them and state YOUR read on the right ROLE for the color, not just "here they are."

**Finding from the amber test (carry forward when Joe revisits):** amber reads best as the **action / energy / CTA accent** (button, underline, "do this" highlight), with electric blue kept as the brand's **identity** color (accent bar, bracket label). As a co-equal hero it competes with blue for identity; as the action color it complements. Recommend: if promoted, scope amber to CTAs/action highlights, not to a second identity accent.

**CSS gotcha caught in the photo mockup:** an amber highlight `::after` underline tucked behind the dark grade with `z-index:-1` DISAPPEARS on any line the headline WRAPS to (the grade paints over it). For a reliable headline underline/highlight that survives wrapping, draw it in front (positive z-index, low opacity) or use `box-decoration-break:clone` on a span background — don't rely on a `z-index:-1` bar.

## Voice rules on posters (from Joe's brand definition)
- Lead with the insight/number. One dominant idea per poster. Compress ruthlessly.
- NO hype/guru-speak. NO "DM me". NO "I'm excited to announce". Max ONE emoji and only if meaningful.
- Recurring lexicon that works: "No guru stuff. Just what's working in the dirt." · "Stop losing ground. Build real leverage." · "Practitioners, not professors" (that one is SM, not JD — don't cross brands).

## The TWO house styles (locked — leave the other 4 tested styles out)
Joe tested 6 styles (minimalist, vintage, bold, photo, handwritten, art-deco) and chose:
1. **Photo-centric** — PRIMARY. Builds face recognition. Use whenever a strong photo exists.
2. **Minimalist** — workhorse for pure stat/quote/lesson with no photo.
Plus a style-by-purpose note: **handwritten is the house style for INFOGRAPHICS** (charts/data), executed on the dark navy spine (NOT cream paper) with amber hand annotations.
> Rejected as core: vintage (drops the blue → off-brand), bold/graphic (too loud for measured-operator voice), art-deco (nice but reserve for rare milestone pieces).

## Photo-centric: use MULTIPLE layouts, pick by what fits the PHOTO
Joe posts frequently → vary layout so the feed isn't monotonous. Choose the layout that flatters the specific image:
- **Photo-right / split** — when the subject sits right-of-center and the other side is dark/empty (text goes in the dark negative space). Best for portrait/seated shots with side space. (e.g. navy-blazer dark-studio shot.)
- **Top-bleed** — photo fills the top ~60%, fades into a dark headline panel at the bottom with a blue accent bar. Best for centered/face-forward shots; editorial feel.
- **Full-bleed cinematic** — photo edge-to-edge, heavy gradient grade + letterbox bar, title-treatment headline. Best for moody/dramatic shots; "movie teaser" register.
- **Circular medallion** — photo in a glowing blue ring, centered; rest of layout is structured text. Best for event posters / when the photo is busy and needs containment.
RULES: always lay a dark scrim/gradient where text sits so it stays legible; never cover the face with text; accent stays electric blue.

## PHOTO FRAMING DISCIPLINE (Joe corrected this twice — analyze BEFORE you place)
The single biggest repeat mistake: applying ONE crop/layout rule blindly across photos and cutting off Joe's face. Fix = analyze every photo first, then pick layout + framing FROM the photo, and use a DIFFERENT photo per post (don't lean on one image — Joe flagged reusing the navy-blazer shot everywhere).
Workflow for EVERY photo use (static or video):
1. **Vision-analyze the photo first.** Determine: is the face centered, left, or right? How high (headroom/chin room)? Is there empty negative space, and on which side?
2. **Match layout to composition — do NOT side-pin a center-composed shot:**
   - Face CENTER-forward (most of Joe's shots: mic/hoodie, smile) → **top-bleed** (photo in top ~56%, text in the navy below) or **circular medallion** (contains the face, impossible to miscrop). NOT photo-right/split — that crops a centered face.
   - Subject genuinely RIGHT-of-center with dark empty left (rare; the navy-blazer studio shot is the main one) → **photo-right/split** with text in the empty side.
   - Busy/centered photo that fights text → **medallion** (containment is the point).
3. **Derive exact `object-position` and (for video) `transform-origin` from the analysis** — e.g. center-upper face → `object-position: center 20%`, zoom anchored `transform-origin: 50% 28%`.
4. **Keep Ken Burns tiny and FACE-ANCHORED** (e.g. scale 1.0→1.05, origin on the face) so the zoom expands into the background and can NEVER crop the face. The old full-strip Ken Burns pushed the face off-frame — don't do that.
5. **QA the rendered result at BOTH the start AND end of any zoom** (vision check) to confirm the face survives the whole motion, not just frame 1.
6. Different post = different photo. Rotate the library; don't repeat one hero image.

### ⛔ BATCH-GENERATOR TRAP — one shared `photo()` builder makes every photo poster identical (Joe corrected HARD, June 2026)
When you build a JD batch with a Python/JS generator, the natural shortcut is ONE `photo()` function that all photo posters call — which silently gives every photo piece the SAME layout AND the same crop. Joe rejected exactly this: a 16-poster batch where all 4 photo posters were top-bleed and "all cut off Joe's head in a different way." The rule above existed and was still violated because the generator collapsed it. ENFORCE it structurally:
- **Write FOUR distinct photo builders, not one** — `photoFull` (full-bleed cinematic, `img` fills 1080×1350, bottom gradient + headline panel), `photoTop` (top-bleed, photo band ~720px with `object-position:center 2%` so the CROWN survives), `photoRight` (split: photo pinned right ~560px wide, headline in dark left scrim), `photoMed` (medallion: face in a glowing blue ring, containment = uncroppable). Proven working set, June 2026.
- In a batch of N photo posters, assign N DIFFERENT builders (or repeat only if N>4). No two photo posters in one batch share a layout.
- **The head-crop fix is per-layout, derived from the photo's measured framing** (vision-analyze first for exact crown % and face-center %): full-bleed shows the whole photo so nothing crops; top-bleed needs a TALLER band + `object-position` toward the top (a 760px band with center crop sliced Joe's forehead — drop to ~720 + top-anchor); medallion/photo-right can't crop a centered face if sized right. Always vision-QA the rendered crown on every photo poster, not just frame 1.
- These 4 builders live in `_scripts/gen_jd_posters.js` (the working JD batch generator) — reuse/extend it rather than re-deriving.

## Poster PURPOSES tested & proven (all work inside the 2 styles)
1. **Advertising/Promotional** — photo + bold blue CTA button + offer framing ("Join 15,000+ operators / Subscribe free").
2. **Event** — circular medallion + `● LIVE` tag + WHEN/WHERE/COST 3-column info bar (town-crier hierarchy).
3. **Informational/Educational** — handwritten infographic with a REAL chart (e.g. 1x vs 10x bars), gridlines, axis, + a "how? three moves" numbered list to avoid emptiness.
4. **Social/Manifesto** — big statement headline + concentric ring shapes + glowing dots + a quote-bar.
5. **Movie/Art** — full-bleed cinematic, letterbox, silver-gradient title treatment, mock "credits" block.

## Creative components encouraged (stay on-brand while doing it)
Infographics, real bar/line graphs, concentric rings, glowing dots/particles, medallions, hand-drawn arrows/circles/annotations (handwritten only, in amber — though amber is under review for clean-style CTA use, see "Amber as a clean-style co-accent" above), numbered steps, dotted graph-paper texture, **motion graphics** (see jd-motion-graphics.md). Creativity is expected — the spine (navy + electric blue + bracket labels + footer) keeps it consistent.

## Anti-patterns (caught in testing — avoid)
- Empty/plain layouts: if a graphic feels sparse, add a supporting block (numbered "how", callouts) rather than just enlarging text. Joe flagged "looking good but empty and plain".
- A decorative dot/shape overlapping label text (reposition shapes off the text).
- A bottom shape/blob clipping the footer (keep footer zone clear).
- Photo source narrower than 1080 → cover the full width or center on navy; verify exported PNG is 1080 wide (browser preview shows a false black strip — trust the file, not the live view).
- Crossing brand cues (don't put SM serif/"professors" or SI yellow on a JD poster).
- **Oversized display numbers/words overlapping the line below.** A giant stat (e.g. 240–300px "60%") with `line-height` < 1.0 overflows its own box and collides with the subtitle/caption beneath it (caught on the SI dossier poster, June 2026). FIX: oversized display type needs `line-height: 1.0` (never 0.8) AND an explicit `margin-top` on the following element (~24px+). Always QA the gap directly under a huge number.
- **Footer byline = what Joe DOES, not adjectives.** Joe corrected this twice (June 2026): vague lists like "operator · investor · builder" describe his AUDIENCE as much as him and say nothing specific. Use concrete roles/work: "CEO, Belrose Group · Founder, Storage Moguls" / "self-storage acquisitions · syndication · development" / "$29M+ acquired · $11M+ raised".
- **Monotony across a batch (Joe corrected this June 2026):** reusing the SAME photo across multiple pieces, OR running every video through the SAME motion template. When producing several assets, deliberately VARY the photo (rotate the library) AND vary the format/layout (poster layout per photo; video FORMAT per content — see jd-motion-remotion.md format library). "Another video" should be a different format, not a re-skin of the last.

## Production
Pipeline + Cloudinary + Metricool attach = see SKILL.md and brand-knowledge-hub/references/metricool-media-and-auth.md. Canvas default 1080×1350 (LinkedIn/IG portrait). Always render → QA with browser_vision → fix → only then upload/attach.
