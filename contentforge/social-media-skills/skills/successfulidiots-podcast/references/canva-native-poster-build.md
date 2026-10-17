# Building posters NATIVELY in Canva (via HTML import) — the working path
(Verified SI Ep031, July 2026. Joe asked to "build IN Canva," not to use Canva's AI.)

## The key distinction Joe drew
Two different things get conflated:
- **Canva's AI generator** (`generate-design`) — you PROMPT and it invents a design.
  Joe explicitly does NOT want this for episode posters. It rewrites approved copy,
  drops the `.ai` handle, hallucinates logos/garbled text (documented in SKILL.md).
  When Joe says "use Canva" / "build in Canva," he does NOT mean this tool.
- **Building IN Canva** — producing a real, editable Canva DESIGN with our exact
  copy + brand structure, that the team can then open and tweak natively. THIS is
  what he wants. The path below delivers it.

## Why you can't just "add text boxes to a blank canvas" via the MCP
The Canva MCP editing ops (`perform-editing-operations`) act on elements that ALREADY
EXIST on a design: `replace_text`, `find_and_replace_text`, `update_fill`,
`insert_fill` (image/video only), `delete_element`, `position_element`,
`resize_element`, `format_text`, `update_title`, `update_autofill_field`. There is
**no `insert_text` op** — you cannot create a fresh text box on an empty canvas. So the
naive "open a blank Canva and lay it out element by element" is not available through
the MCP. Don't promise it.

## ✅ THE WORKING PATH — author exact-copy HTML → host public → `import-design-from-url`
`import-design-from-url` takes a **public HTTPS URL to an HTML file** and imports it as
a **native, fully-editable Canva design**. This gives BOTH: our pixel-exact copy/brand
control (we author the HTML) AND a live Canva design the team can edit. Verified
end-to-end this session.

Steps:
1. **Author a self-contained square HTML poster** with EVERYTHING inlined so it renders
   standalone (no external `_si_base.css` link — inline the styles; pull fonts from
   Google Fonts via `<link>` so Oswald/Space Mono actually load — a bare local render
   fell back to serif when the font wasn't inlined). Use the exact approved copy, SI
   navy `#15151F` grid + yellow `#FDE801` accent + green glow, `successfulidiots.ai`
   footer. Worked file: `C:\Users\somea\BrandAssets\_scripts\canva_import\SI_Ep031_Idea1_canva.html`.
   - ⛔ **Annotate the page element for import:** put `data-document-role="page"` on the
     root poster `<div>` (and optional `data-label="..."`), per Canva's import spec for
     non-interactive HTML. Without it, Canva may not treat the div as a page.
2. **Render + vision-QA the HTML locally FIRST** (headless Chrome screenshot) before
   importing — confirm copy exact, font is Oswald not serif, nothing overflows. Don't
   import a broken poster.
   - Chrome path: `/c/Program Files/Google/Chrome/Application/chrome.exe`
     `--headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1
     --window-size=1080,1080 --screenshot="<OUT>" "file:///c:/..."`.
   - ⚠️ **The BrandAssets/_scripts dir can be write-locked** ("Access is denied 0x5" on
     the screenshot). Write the preview PNG to `Downloads/...` instead.
3. **Host the HTML at a public HTTPS URL.** `import-design-from-url` can't read local
   `C:\` paths. Upload the `.html` to Cloudinary as a RAW resource (keeps `.html`, serves
   as text/html). Creds: cloud `dhi6klgd0` (full config in `upload_jd_posters.py`).
   ```python
   import cloudinary, cloudinary.uploader
   cloudinary.config(cloud_name='dhi6klgd0', api_key=os.environ["CLOUDINARY_API_KEY"],
       api_secret=os.environ["CLOUDINARY_API_SECRET"], secure=True)
   r = cloudinary.uploader.upload(r'C:\...\poster.html',
       resource_type='raw', public_id='poster.html', overwrite=True, invalidate=True)
   print(r['secure_url'])
   ```
   Run through `C:/Python313/python.exe` (has cloudinary/requests; git-bash `python3` mis-resolves).
4. **Import into Canva:** `Canva_import_design_from_url(url=<cloudinary secure_url>,
   name=..., intended_design_type='instagram_post')`. Returns a design `id` + edit/view URLs.
5. **VERIFY inside Canva** — export it via `Canva_export_design(format={"type":"png"})`
   and vision-QA the REAL Canva render (not just the local HTML). This session Canva
   preserved the full headline, yellow accent, subline, kicker, footer, `successfulidiots.ai`,
   Oswald bold, and navy grid PERFECTLY — zero garble, nothing reflowed/cut. That's the
   proof the import path honors exact copy where `generate-design` does not.
6. The design now lives natively in Canva; the team can edit any text/image/layout there,
   and you can further edit it via `start-editing-transaction` + `perform-editing-operations`
   (then commit — changes are DRAFT until `commit-editing-transaction`).

## When to use which Canva route
- **Exact episode poster (specific headline/subline/handle)** → HTML import path above.
  This replaces the old flat rule "never use Canva, only gen_episode.js" — Canva IS
  usable for exact posters via import; the thing to avoid is `generate-design`.
- **Loose visual atmosphere / textured imagery** → Canva `generate-design` produces
  genuinely nice moody imagery (e.g. a smoke-behind-a-phone treatment) our type-first
  HTML can't easily make — but it will NOT honor exact copy. Use it to source a
  BACKGROUND IMAGE, then composite exact copy over it (in the HTML) or `insert_fill` it
  behind the type in the Canva design.
- **Editing an existing Canva design's text/media** → `start-editing-transaction` +
  `perform-editing-operations`. Good for fixing copy on a design that already has the
  right element slots. Note: the team's "EP 31 ... video promo" designs are 1080×1920
  VIDEO files with a locked `.mp4` background fill — wrong base for a static square
  poster; don't try to retrofit those.

## Gotchas verified this session
- `design.canva.ai/<id>` thumbnail URLs return an HTML VIEWER page, not the raw PNG
  (curl gets HTML). To get a real downloadable image, `create-design-from-candidate`
  then `export-design` (that export URL IS a real PNG). The `vision_analyze` tool CAN
  read the `design.canva.ai` thumbnails directly (it follows the redirect/renders), so
  use it to eyeball candidates without exporting.
- The Canva **editor pages are Cloudflare-protected** — the automated browser gets a
  "Just a moment..." block. Don't try to screenshot a Canva design via the browser;
  use `export-design` (MCP) to get the image instead.
- Cross-check: SI brand kit id is `kAHMMao4RMI` (name "SuccessfulIdiots"); other kits in
  the account: Storpro `kAHMMRp9Sig`, Belrose `kAHMSoeaCiA`, Storage Moguls `kAHMSvqF5XY`.
