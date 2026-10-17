# Brand Studio

**Audience:** Engineers and operators.  
**Purpose:** One place for how the Brand Studio works: the brand registry rule, the template/design system, uploads and background removal, exports, the pipeline integrations, and what's deliberately parked.

The Brand Studio (`frontend/src/brand-studio/`, mounted at `/brand-studio`, lazy-loaded, full-bleed) produces on-brand graphics for the Belrose brands. It renders **entirely client-side** — templates are pure functions of `{ design, brand }` — and touches the backend for exactly two things: AI backgrounds (Vertex Imagen) and delivering finished artwork into the pipeline (blog covers, social posters).

---

## The one rule: brand facts live in the registry

`brands.js` is the **central brand registry** — one record per Belrose brand (Storage Moguls first/default, then Successful Idiots, Joe Downs, StorPro, Belrose Group) carrying palettes, font stacks, wordmark, URL, tagline, logo file listings with `luma` values, voice facts, and per-template seed copy (`buildDefaults`). **Templates never hardcode brand facts.** Adding or adjusting a brand is a registry edit; every template inherits it. `LogoImg` falls back to a typographic wordmark until real logo files land in `public/logos/<brandId>/` (only Storage Moguls' kit has arrived — TECH_DEBT #7).

## Templates, designs, variants

- `registry.js` lists **~26 templates in 7 groups** (Brand & Data, Brand Kit, Events & Announcements, Editorial, Podcast & Video, Ads & Email, Motion). Each row carries a React component (or a `motion` kind), its group, field list, and an optional forced canvas resolution.
- Most feed-facing templates carry a **Design picker** (`VARIANT_SETS`): 6–12 named designs per template that restyle the same content — **150+ distinct designs** total, all screenshot-verified via the preview harness. Utility formats (YouTube thumbnail, title card, lower third, end card) are deliberately locked to one canonical design — their value is repetition.
- **Live Event Bill** (`TplLiveEvent`, 1080×1350) carries a whole in-person event flyer on one sheet — kicker, stacked headline, standfirst + callout, when/where, agenda rows, price plate, who it's for, what's included — and a **scannable QR code** (`QrCode` atom over `qrcode-generator`, payload = the Register Link or `https://` + URL). Six designs: Bill (operator's playbill), Ticket (perforated stub), Blueprint (title block + drawn facility elevation), Receipt (itemized ledger with torn edge), Marquee (bulb rails + starburst price), Door (headline stencilled on a roll-up door). Field conventions are `·`-separated lists (date → day · time · venue; metric → price · note; role → included; author → audience) and two-paragraph body (standfirst, callout); the Content tab labels spell these out. A title written as short sentences ("Find. Fund. Close.") stacks one word per line.
- **Motion** (`MotionCanvas.jsx`): animated lower third and logo sting; exports WebM via `MediaRecorder` and 30 fps alpha PNG sequences (jszip).
- **Brand Kit** (`swag.jsx`, `/brand-studio/kit`): original flat garment/product SVGs (tee, hoodie, cap, mug, notebook, bottle) with per-product print windows, auto-inked for contrast against the colorway.
- Static exports are client-side via `html-to-image` (PNG/SVG); fonts are self-hosted (`public/fonts/*.woff2`).
- **Dev harnesses** (never linked in-app): `preview.html` is the scaled template gallery for visual QA; `render.html` draws **one template at true resolution** from query params (`?template=liveevent&brand=storagemoguls&variant=bill&title=…`, every prefill field plus `bgColor`/`accentColor`/`textColor` and `res`), so a headless-browser screenshot of the viewport *is* the export — the machine path to finished studio graphics until a server-side renderer exists.

## Photos: upload → downscale → matting

Portrait templates (podcast, speaking, podcast announcement — up to three seats) accept photo uploads:

1. The file input stays in the DOM until the picker settles (WebKit GC'd detached inputs — uploads used to intermittently do nothing).
2. Images downscale before entering state (1600px when destined for cutouts, 2560px otherwise); the re-encode surfaces unreadable formats (HEIC) with a clear message.
3. Background removal (`@imgly/background-removal`) runs a **backend ladder**: WebGPU `isnet_fp16` where available, quantized `isnet_quint8` on CPU as fallback, each behind a 90s timeout. The model download warms 3 seconds after the studio loads so the first cutout doesn't pay for it.

## AI backgrounds

`POST /api/brand-studio/generate-image` (see [`api-reference.md`](api-reference.md)) calls **Vertex AI Imagen** with per-brand style prompts defined in `backend/routes/brandStudio.js`. Config: `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` / `IMAGEN_MODEL` ([`configuration.md`](configuration.md)); the ADC identity needs the Vertex AI User role.

## The Design Library (persistence)

Studio work is persisted as **saved designs** (`routes/designs.js`, Firestore `content_pipeline_designs` + Storage `content-pipeline/brand-studio/designs/<id>/…`). A saved design is two halves:

- **The recipe** — template id, brand, design variant, resolution, every content field: small JSON, fully re-renderable because templates are pure functions of `{ design, brand }`. Loading a design puts the editor back exactly where it was.
- **The bytes** — uploaded photos/cutouts/AI backgrounds (extracted generically from state: any image data URL, including arrays like co-host photos) plus a rendered **thumbnail** captured at save time — the pixel-true record even if template code later evolves.

In the studio: **Save** (header) prompts a name, or offers to update the currently-loaded design; the **Designs** tab is the gallery — thumbnail grid, click to load, delete on hover. Sharing is team-global (designs are brand assets); update/delete are creator-or-admin, and deletion is human-only like all destruction. Serialization helpers (`splitDesignInputs`/`mergeDesignInputs` in `helpers.js`) are template-agnostic, so new templates persist without new code.

## Pipeline integrations

- **Forge → studio bridge (deep-link prefill):** `/brand-studio` accepts query params (`template`, `brand`, `variant`, and any content field). `LibraryItemViewer`'s palette-icon **Create Visual** menu opens the studio prefilled from the article (Blog Cover / Quote Card / Big Number / Announcement).
- **Blog covers:** a studio-rendered cover posts back as a base64 data URL to `PUT /api/library/:id/cover` — same storage/publish lifecycle as AI covers ([`cover-images.md`](cover-images.md)).
- **Social posters:** pipeline posters can wear a studio design; the chosen design persists on the social asset and the **approved** PNG bytes freeze in Firebase Storage (`content-pipeline/socials/posters/<itemId>_<channel>.png`).
- **Social carousels:** pipeline carousels wear studio **design sets** (`socialCarouselDesigns.js`: one template family per set, slide kind → variant — hook/point/cta pages stay cohesive; `SocialCarouselCanvas` renders each page). Pages bind into a PDF client-side (jspdf, JPEG pages); the approved PDF freezes at `content-pipeline/socials/carousels/<itemId>_<channel>.pdf`, and finalizing a studio deck never touches the legacy renderer. Classic (Odin-rendered) remains only for pieces with no design picked and legacy assets — retirement sequence in TECH_DEBT #8.

## Deliberately parked (see TECH_DEBT #7)

Logo kits for the four non-Moguls brands; the swag mockup engine + vendor print packs; the isometric architecture engine; recharts dataviz, terminal/HUD/research templates, and the Discord kit (all exist in the source repo at `../brand-studio` — port on demand, don't rebuild). Per-brand seed copy outside Storage Moguls is thin until those brands use the studio.
