# Brand Assets Registry — Style Guides, Colors, Fonts, Canva Kits

Durable visual-identity reference for all of Joe's brands. Verify with the
source links before relying on a value; the JPG style guides are the
authoritative source (more complete than the Canva `list-brand-kits` API,
which exposes only kit IDs + thumbnails, NOT colors/fonts).

## Where the brand guidelines live (verified June 2026)

**Drive "Branding" folder** — `1b8ruP794btpj1i-OVUqL-UNa1475Yngm` — holds one
style-guide JPG per brand plus the Storpro PDF:
- `Successful Idiots Style Guidelines.jpg` — `1vlXpCjDzfU-MMyEvzzr_RIUgtGaSogf5`
- `Storage Moguls Style Guidelines.jpg` — `1nVSPKFhrzOAOuO6uLF9fkiP2IgZ6TApd`
- `Storage Moguls ( Podcast ) Style Guidelines.jpg` — `1lrd6-M9HSsagGijfPS2Fs2Q38lzJnIBX`
- `Joe Downs Podcast Style Guidelines.jpg` — `130lRAdaVVz1tNo6SPPlhu8CUgyEJ1xpv`
- `Belrose group Style Guide.jpg` — `14w3gsNH33ayqqb3DaXpzxpsbiHu1XlSi`
- `storpro-brandguidelines-v2a (1).pdf` — `1aXzq5xE_ab-trZt3IKqPjfZenkugTSD4`

**Reading a style-guide JPG:** these are images, not docs. Load directly into
vision with the Drive direct-download URL form:
`https://drive.google.com/uc?export=download&id=<FILE_ID>`
then read colors/fonts/logos natively. (Do NOT `drive download` + docx
extraction — that path is for .docx episode files only.)

**Reading a multi-page PDF brand guide** (e.g. the Storpro 19-page PDF): vision
can't ingest a whole PDF at once. `drive download <ID> --output <abs path>.pdf`,
then use **`C:/Python313/python.exe` + pymupdf (`import fitz`)** to extract — it
was the only interpreter with the module this session (`pip install pymupdf` once
if missing). Loop pages: `page.get_text()` pulls hex codes / font names / copy
directly (Storpro's color page printed all hex + CMYK + RGB cleanly), and
`page.get_pixmap(dpi=110).save(...)` renders pages to PNG for vision if a page is
image-only. Clean up the temp PDF + rendered PNGs + extractor script when done.

## Canva brand kits (ids from `list-brand-kits`, joeagent profile)

| Brand | Canva brand_kit_id |
|---|---|
| Successful Idiots | `kAHMMao4RMI` |
| Storage Moguls | `kAHMSvqF5XY` |
| Storpro | `kAHMMRp9Sig` |
| Belrose | `kAHMSoeaCiA` |
| (unnamed kit) | `kAG6wvo02EE` |

Use the kit id with `generate-design` (brand_kit_id param) and brand-template
tools to produce on-brand graphics for the LinkedIn-master → platform-variant
repurpose step.

## Verified brand specs

### Successful Idiots
- **Colors:** White `#FFFFFF` · Yellow `#FDE801` · Green `#16A34A` · Navy/near-black `#1A1A2E`
- **Fonts:** Oswald (primary / headings) · Open Sans (secondary / body)
- **Logo:** "SI" mascot monogram (figure in yellow cap at a microphone) + "Successful Idiots" wordmark. 5 approved lockups: white-on-black (primary), two-tone (Successful black / Idiots green), all-black, all-green, all-yellow — each on white. Pick best contrast for the background.

### Storage Moguls (TWO variants, shared logo set)
Shared logo = storage-facility illustration above the wordmark + tagline **"REAL PEOPLE · REAL DEALS · REAL RESULTS"**. Lockups: full-color (blue/silver) on light, B&W line on light, white/reversed on black.
- **Main brand colors:** Off-white `#F5F5F5` · Silver `#C0C0C0` · Brand blue `#0077FF` · Navy `#1A1A2E`
- **Main brand fonts:** Barlow Condensed (headings) · Montserrat (body)
- **Podcast variant colors:** `#F4F2ED` · `#D2D4D0` · `#3F6F8E` · `#355F79` · `#111F2E` · `#0B1622`
- **Podcast variant fonts:** Big Shoulders Display (headings) · League Spartan (body)

### The Belrose Group (investment-side entity, no podcast)
- **Colors:** Optimistic Orange `#F26801` (accent) · Deep navy `#012E40` · Darkest navy `#00161F`
- **Fonts:** Barlow Condensed (headings) · Arial (body)
- **Logo:** "BELROSE" wordmark in a thin rectangular outline, "GROUP" spaced beneath; primary = white logo on black rounded-rectangle. Institutional/deal-maker voice; speaks to LPs/capital, distinct from Storage Moguls (education).

### StorPro (premium tech-enabled storage facility brand, no podcast)
Full 19-page Brand Identity Guidelines v1.0 (March 2026). Tagline **"Making Room for Big Dreams"**. Personality: Supportive · Dependable · Ambitious. Creative contact tim.kane@storpro.com.
- **Colors — orange family:** Optimistic Orange `#F29E0D` (primary) · Deep Orange `#E78B0D` · Transitional `#C17913`
- **Colors — blue/steel family:** Deep Blue `#1B212D` · Steel Blue `#424856` · Steel Blue Light `#8E919A` · Limitless Blue `#78B8F5` · Light Blue `#F1F8FE`
- **Font:** Inter (Black/Bold/Regular; italics as needed). Hierarchy: H1 Inter Black all-caps 300% body · H2 Black 200% · H3 Black all-caps 150% · body Regular · quote Bold Italic. Min 6.5pt / 7.5 leading.
- **Visual system:** 3-D "S" brand mark built on a **60° angle** (= the angle for all angled container shapes) · corrugated-metal texture background · rounded corners 6px digital / .125" print · 5 logo color variations (use 3-color primary). Photography direction: "Livelihoods & Lifestyles".

#### StorPro website facts (storpro.com crawl, July 2026 — durable reference)
Small 5-page site (Location: Greenville, SC). Nav: **Spaces & Pricing** (`/spaces-pricing/`) · **Who Uses StorPro** (`/uses/`) · **About** (`/about/`) · **Contact** (`/contact/`). On-site tagline: *"Meet StorPro—a fresh take on storage offering premium spaces built to enhance livelihoods & lifestyles."* (JS-rendered site — get real nav/footer hrefs via `document.querySelectorAll('a')` in browser_console, and grab page copy via `document.querySelector('main').innerText` since snapshots truncate; the FAQ accordions need clicking to expand.)
- **5 space tiers (all month-to-month, first month FREE):** Super 20x50 / 1,000 sq ft → **$1,499/mo** · Select 20x40 → **$1,049/mo** · Standard 15x40 → **$799/mo** · Simple 15x35 → **$679/mo** · Starter 15x30 → **$585/mo**. All 5 have drive-up/drive-in access + 14' oversized bay doors; higher tiers add climate control (55°–75°), insulation, Bluetooth/myQ door control, more power/outlets. "Founders' Rate" is the active promo CTA.
- **Facility (flagship):** Greenville SC off I-185, **opening Spring 2026**, **138 total spaces**, 5 space options, extra-wide **54' drive aisles**, community clubhouse + amenities. Distances: ~9mi downtown Greenville, ~17mi GSP airport, 45min Lake Hartwell, <40mi Clemson, 105mi Charlotte, 150mi Atlanta.
- **8 customer segments (from `/uses/`):** Contractors & Trades · Distribution & Fulfillment · Small Manufacturers & Fabricators · Makers & Creators · Auto/Art/Memorabilia Collectors & Resellers · Real Estate/Staging/Event Services · Archiving/Record/Media Storage · Gear Heads & Hobbyists. (Rich sub-lists per segment — strong content-hook source.)
- **12 included features:** 24/7/365 surveillance · drive-up/drive-in access · GFCI outlets · sealed pro-grade flooring · temp/moisture protection · mobile-app keyless entry · on-site team support · member clubhouse · LED occupancy-sensor lighting · secure WiFi · 14' bay doors · private breakout pods. Selling line: *"No nickel & diming here."* Move-in: no long-term commitments / no security deposits / no credit checks / no waiting periods.
- **Contact:** greenville@storpro.com · **864-351-7302** · Mon–Sun 8am–8pm. Socials: IG [@storprostorage](https://www.instagram.com/storprostorage/) · FB `facebook.com/people/StorPro/61583783248320/`.
- **FAQ hooks (content-ready):** can work from space? (light tasks yes, no full office/zoning) · what businesses aren't a fit? (running water, food/perishables, excessive noise, heavy foot traffic, dangerous materials) · loading docks? (none needed — drive-in + 14' bay doors) · 24/7 access? (yes, digital access on device).

## Metricool SmartLinks — per-brand spec (colors + button list)

Joe builds the SmartLink (bio-link) pages himself in the Metricool **SmartLinks UI** — there is **NO create-smartlink endpoint** in the Metricool MCP/API (a post can only *reference* an existing SmartLink ID, not build the page). So the agent's job is to hand Joe the complete, copy-paste-ready spec: palette + button order + links. He has asked for this spec across multiple sessions — keep it here so it's instant, not re-derived from `session_search`.

Palettes are lifted straight from the brand style guides above (so SmartLinks match the feed/posters). The Joe Downs SmartLink is his **credibility hub** — every JD personal post's first comment points to it (interim placeholder `storagemoguls.ai` until the real JD SmartLink URL exists).

| Brand | Background | Buttons | Font | Buttons (in order) |
|---|---|---|---|---|
| 🔵 **Joe Downs** | navy `#0A0E16` | electric blue `#2E6BFF` | Inter | Storage Moguls · Successful Idiots Podcast · Self Storage Investing Podcast · Belrose Group · LinkedIn · Instagram |
| 🟦 **Storage Moguls** | `#1A1A2E` | `#0077FF` | Barlow Condensed / Montserrat | storagemoguls.ai · Storage 100 (free) · LinkedIn · Instagram · Facebook · podcast |
| 🟡 **Successful Idiots** | `#1A1A2E` | yellow `#FDE801` + green `#16A34A` | Oswald | successfulidiots.ai · IG @successful__idiots · LinkedIn · Facebook · TikTok · YouTube |
| 🟠 **StorPro** | steel `#1B212D` | orange `#F29E0D` | Inter | storpro.com · IG @storprostorage · LinkedIn · Facebook |
| 🟠 **Belrose** | deep navy `#012E40` | orange `#F26801` | Barlow Condensed | belrosegrp.com · LinkedIn |

### The actual LINKS (Joe also asks for these — give verified, never guess slugs)
VERIFIED (records + live sites): websites `https://storagemoguls.ai` · `https://successfulidiots.ai` · `https://belrosegrp.com` · `https://storpro.com`; IG handles `josephmdowns` · `storagemoguls` · `successful__idiots` (DOUBLE underscore) · `storprostorage`.

⚠️ **NOT in our records — do NOT fabricate the slugs:** the exact LinkedIn company/person page URLs, Facebook page URLs, TikTok handles, YouTube channel URLs, the Self Storage Investing podcast show link, and the SM "Storage 100 / Join the Community" deep URL. Constructing `linkedin.com/company/<guess>` etc. risks 404s.
- **The reliable source for every missing URL = each brand's CONNECTED ACCOUNTS inside Metricool** (Brand → connections show the real LinkedIn/FB/TikTok/YouTube URLs already authed). Offer to open Metricool in the browser and read them off, OR have Joe copy them while he's building the SmartLink. Metricool brand→blogId map + the LinkedIn org URNs are in `live-ids.md` / `getBrandSettings` (JD LinkedIn is a *person* URN `urn:li:person:GKxFAadG0-`; the others are org URNs — URNs are NOT public profile URLs, so they still need confirming).
- Present the spec as a per-brand table with a **status column (✅ verified / ⚠️ you have this)** so Joe sees exactly which buttons are drop-in vs. which he fills from his connections. He values that honesty over a confident-but-wrong full list.

---
*Source: Drive Branding folder + Canva list-brand-kits, read June 2026. SmartLink spec locked with Joe June 22 2026. Add new brands' verified colors/fonts as future sessions read their guides.*
