# Building posters/designs IN Canva via the MCP (verified July 2026, SI Ep031 test)

Joe asked to "test Canva — can it make cleaner, more graphics-rich designs than our
HTML pipeline, and can we BUILD in Canva?" This is the verified answer + the exact
working pipeline and its pitfalls. Applies to ALL brands (built on the SI Ep031 test).

## TL;DR — the decision tree
- **Need a SPEC-EXACT poster** (exact headline/subline/handle/stat)? → build via the
  **HTML → import** pipeline below. Do NOT use Canva `generate-design`.
- **Need a graphics-rich piece with a real PHOTO hero**? → HTML import for the
  type/layout, then place the photo as a real Canva ASSET via the editing tools
  (the CSS background image does NOT survive import — see pitfall 2).
- **Want loose on-brand color/mood exploration only**? → `generate-design` is fine
  for that and nothing else.

## ❌ `generate-design` (Canva's AI) is NOT usable for episode posters
Re-confirmed on SI Ep031 (matches the existing note in `successfulidiots-podcast`).
Every one of 4 candidates FAILED the bar the same way:
- **Rewrote/truncated the approved copy** (headline "…never know you had" → "…never know"; invented sublines; added a random "Visit Us!" button).
- **Dropped the exact handle** — printed "PODCAST" or nothing instead of `successfulidiots.ai`.
- **Hallucinated a garbled logo** ("The Baseass").
It treats copy as a loose suggestion, not a spec. Use it ONLY for atmosphere/mood
exploration, never when the words/handle/stat must be exact.

## ✅ THE WORKING PIPELINE — author HTML, import to Canva as a native editable design
This gives pixel-exact copy/type/layout control AND a real Canva design the team can
tweak natively. Every step is through the MCP + existing infra.

1. **Author the poster as a self-contained HTML file** (1080×1080 or 1080×1350).
   - Inline the fonts via a Google Fonts `<link>` (Oswald/Archivo/Space Mono/etc.) so
     they load in the standalone render — a bare `.lead` class relying on an external
     `_si_base.css` renders SERIF in a standalone file (font didn't load). Inline or
     link the font explicitly.
   - Put ONE `<div data-document-role="page" data-label="…">` wrapping the whole
     canvas (the importer uses this to define the Canva page). Optional
     `data-speaker-notes="…"`.
   - Exact copy, brand colors, real handle (`.ai` not `.com`), footer, everything.
2. **Render + vision-QA locally FIRST** (headless Chrome screenshot → `vision_analyze`)
   before importing — catch collisions/overflow/wrong-font while it's cheap to fix.
   - Headless Chrome on this machine: `"/c/Program Files/Google/Chrome/Application/chrome.exe"
     --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1
     --window-size=1080,1080 --screenshot="OUT.png" "file:///c:/…/poster.html"`.
   - ⚠️ Chrome **can't write into `BrandAssets/_scripts/`** (Access denied) — write the
     screenshot to `Downloads/…` instead.
   - For a remote `background-image`, add `--virtual-time-budget=4000` so the network
     image loads before the screenshot.
3. **Upload the HTML to a PUBLIC URL** — `import-design-from-url` needs an HTTPS URL and
   CANNOT read a local `C:\` path. Use the existing Cloudinary RAW upload:
   ```python
   # C:/Python313/python.exe
   import cloudinary, cloudinary.uploader
   cloudinary.config(cloud_name='dhi6klgd0', api_key=os.environ["CLOUDINARY_API_KEY"],
       api_secret=os.environ["CLOUDINARY_API_SECRET"], secure=True)
   r = cloudinary.uploader.upload(r'C:\…\poster.html',
       resource_type='raw', public_id='poster.html', overwrite=True, invalidate=True)
   print(r['secure_url'])
   ```
   (Same creds as `BrandAssets/_scripts/upload_jd_posters.py`. `resource_type='raw'` keeps it as importable HTML.)
4. **Import into Canva:** `Canva_import_design_from_url(url=<cloudinary raw url>,
   name=…, intended_design_type='instagram_post')`. Returns a native design id +
   edit/view URLs. This is a real editable Canva design.
5. **Export via MCP to verify fidelity:** `Canva_export_design(design_id, format={"type":"png"})`
   → download the export URL → `vision_analyze`. Confirm copy/handle/fonts survived.

## ⚠️ PITFALL 1 — the editing tools EDIT existing elements; they can't add text boxes to a blank canvas
`perform-editing-operations` has replace_text / find_and_replace_text / update_fill /
insert_fill / delete_element / position/resize/format_text / update_title / update_autofill_field.
There is **NO "insert new text box" op** — you can insert IMAGE/VIDEO fills but not net-new
text. So you cannot build a poster from an empty Canva canvas via the MCP. The HTML-import
route is how you get all your text/layout in. (After import, the text elements ARE editable
in-place via replace_text/format_text.)

## ⚠️ PITFALL 2 — CSS `background-image` PHOTOS do NOT survive HTML import (the big one)
The importer keeps text, vector shapes, and CSS COLORS/gradients pixel-faithfully, but a
full-bleed `background-image:url(...)` photo is DROPPED — you get the layout on a flat
BLACK/empty canvas where the photo should be. This is exactly the "graphics-rich" part
that gets lost. The fix (finishes the piece natively in Canva):
1. Upload the photo as a real Canva asset: `Canva_upload_asset_from_url(url=<image url>, name=…)`
   → returns an `asset_id` (e.g. `MAHOUy2alsw`). (Unsplash key for sourcing photos:
   `BrandAssets/_scripts/unsplash_keys.env`; or use real host photos / SI character cutouts.)
2. `Canva_start_editing_transaction(design_id)` and read the `fills` array. The import
   often already created an editable full-page image fill (the scrim layer) at
   `position 0,0 dimension 1080×1080` — note its `element_id`.
3. `perform-editing-operations` → **`update_fill`** on that full-page fill element with
   your photo `asset_id` + `asset_type:"image"` + `alt_text`. (update_fill swaps the fill
   of an existing element; insert_fill adds a new image at a position if there's no fill to reuse.)
4. **Preview the DRAFT before committing:** `Canva_get_design_thumbnail(transaction_id, page_index=1)`
   → vision-QA. Adjust if the photo focal point/scrim hurts legibility.
5. `Canva_commit_editing_transaction(transaction_id)` to SAVE (edits are DRAFT-only and LOST
   if you don't commit — per the tool's hard rule, show Joe the preview and, for anything
   but an explicit "do the whole thing" directive, get his OK before commit).
6. Final `Canva_export_design` for the deliverable.

## ⚠️ Browser can't open the Canva editor headlessly
`browser_navigate` to a `canva.com/d/…` edit/view URL hits Cloudflare bot-detection
("Just a moment…"). Don't try to screenshot the editor in-browser — use
`export_design` / `get_design_thumbnail` (MCP) to see renders instead.

## ⚠️ `design.canva.ai/<id>` thumbnail URLs are NOT raw images
`curl`-ing a `generate-design`/`search-designs` thumbnail URL returns an HTML viewer page,
not a PNG (needs auth/JS). `vision_analyze` handles the redirect and shows the image, but
to DOWNLOAD a real PNG you must `export_design` (create-design-from-candidate first if it's
an AI candidate). Don't rely on the thumbnail URL for a file.

## The finished-piece test result (what Joe wants the bar to be)
The full pipeline DID produce a clean, graphics-rich, on-brand finished piece natively in
Canva (SI Ep031 "going dark", CLOSED-neon photo hero). But note the STYLE lesson below —
Joe rejected the first dark-photo attempt as off-brand. The pipeline works; the design
judgment has to stay on-brand (see `successfulidiots-podcast` poster rules + the SI spine).
