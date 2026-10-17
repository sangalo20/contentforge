# Character art & image generation (illustrated hosts / people)

How to get illustrated CHARACTER versions of real people (e.g. SI hosts Joe Downs + Peter Swain) for posters/video, and the honest limits of each path. Learned June 2026.

## The three paths, ranked by what they can actually do

| Path | Likeness | New body POSES? | Reposition/scale/animate whole figure? | Cost |
|---|---|---|---|---|
| **Reuse existing brand art** (crop the real illustration, recompose) | ✅ perfect | ❌ no | ✅ yes | free |
| **Image-gen with reference image** (Gemini / Imagen "Nano Banana") | ✅ good | ✅ yes | ✅ | free tier |
| **Auto-trace raster → SVG** (vtracer) | ⚠️ faithful but a pixel MOSAIC | ❌ no | ✅ yes | free |
| **Hand-authored SVG** | ❌ stylized, easy to get wrong | ✅ fully | ✅ | free |

### Key truths (each cost real time to learn)
- **Auto-tracing does NOT give a re-posable puppet.** vtracer on a shaded cartoon = ~1,400 (simple) to ~18,000 (detailed) overlapping color paths. Visually faithful + scalable + recolorable, but the "arm" is dozens of unlabeled fused slivers — move it and you tear the figure. A re-posable character must be BUILT in layers from the start (original designer's source file), not reverse-engineered. Quick test cmd: `pip install vtracer` then `vtracer.convert_image_to_svg_py(src, out, colormode='color', hierarchical='stacked', mode='spline', filter_speckle=10, color_precision=5)`.
- **Hand-authored SVG faces drift from likeness.** A from-memory vector redraw wrongly gave Peter Swain a beard + round glasses; he has NEITHER (short salt-pepper hair, light stubble, no glasses). ALWAYS vision-analyze the real reference before drawing/prompting, and list exact "KEEP" features in the prompt.
- **Don't auto-magically expect new poses from finished raster art.** Either get the layered source from the designer, OR use image-gen.

## Image generation — availability & route
- There is NO local image-gen wired into this env by default (no ComfyUI, no DALL·E/Imagen MCP). The `image_gen` toolset via delegate_task came back with only Canva/Notion/Metricool — i.e. no model. **Recheck per session; never fabricate images or rename SVG/text as .png.**
- **Joe's chosen free route = Google Gemini / "Nano Banana" (AI Studio API key, free tier).** It does image-to-image, so you ATTACH the reference image and it holds likeness while changing pose. Pollinations.ai = instant/no-key but NO likeness lock. HF Inference / Cloudflare FLUX = free text-to-image (no reference). Rent a GPU (~$0.30/hr, ComfyUI + IP-Adapter) only for pixel-perfect likeness at volume.

### The Gemini character prompt (give Joe this to run himself)
Attach the reference image, then:
```
Using the attached image as the exact style and likeness reference, redraw these characters in a NEW pose while keeping their faces, hairstyles, and clothing IDENTICAL to the reference.
KEEP EXACTLY (do not change): each person's face/skin/likeness; <per-person hair + NO beard/NO glasses notes>; their outfits <exact wardrobe>; the flat-vector cartoon art style (thick outlines, flat fills, cel shading).
CHANGE ONLY: the pose — <pose>; background — solid <brand bg hex>, no text.
Square, waist-up, sticker-style mascot illustration.
```
Tips: attach the image EVERY time (text-only invents new faces); generate ONE character per image for best likeness; if it adds a beard/glasses, add "clean-shaven, NO glasses"; ask for transparent or solid-brand-color bg so it drops into posters; generate 3–4 takes, keep the best.

## Working with Gemini grid output → CLEAN TRANSPARENT cutouts (proven recipe, June 2026)
Gemini returns **grids — DON'T assume 2×2**; vision-analyze the layout FIRST (this session a grid was actually **3×2 / 6 cells**, and assuming 2×2 sliced two cells together → wrong crop, wasted iterations). Also: some grid cells have **baked-in name-label boxes** ("JOE DOWNS"/"PETER SWAIN") or an off-style pair (no caps/glasses) — skip those; use the cells where the characters wear the full canonical wardrobe.

The reusable cutout script is **`scripts/gemini_char_cutout.py`** (run with `C:/Python313/python.exe`). It does the whole job; the steps it encodes (and WHY, each cost real iterations):

1. **Vision-analyze every grid**, pick the cleanest, map each cell's pose + note which cells to skip (labels / off-style).
2. **Slice per cell** with a generous inset (`g≈30px`, NOT 8) — small insets leave the dashed cell-divider line in the crop.
3. **Chroma-key the green to TRANSPARENT — do NOT paste a green rectangle onto the poster.** Joe's exact complaint: a green box on a slightly-different green + white edge bleed. The characters contain no green, so key it: `is_green = (g > r+16) & (g > b+16) & (g < 175)`. Margin **~16** is right — pushing it to 30 stops keying (leaves the green box); ~16 keys bg while the greyish cap/hair (green-margin <12) survives.
4. **NEVER also key white.** White-keying punches holes in **teeth** (laughing host's open mouth) and eye-whites. Joe corrected this mid-task ("ensure the teeth are also there"). The big inset already removes the divider, so white-keying is unnecessary — drop it entirely.
5. **Remove the residual thin frame** (a ~1px light cell-border that survives keying) with a **connected-component pass: keep only components ≥ ~4% of area** (both characters qualify; thin border runs + specks don't). A 2px alpha erosion helps too but CC cleanup is the reliable kill. Do NOT use "keep largest component" on a DUO — it deletes the second host if they're not touching.
6. **Auto-crop** to the alpha bbox (pad ~6px) so the character fills the frame.
7. **Make a true SOLO** from a clean capped duo by cropping its left ~46% then alpha-autocrop — cleaner than using a labeled solo cell.
8. **QA on a contrasting bg** (composite onto magenta) to expose any green halo / white bleed / leftover box before use.

Watermark note: the Gemini ✦ sparkle sits bottom-right; the big inset usually drops it, otherwise the green-key removes it since it's on the bg. Painting a rectangle (old method) is a last resort and leaves a patch — prefer key+crop.

These per-pose transparent PNGs (`BrandAssets/{Brand}/characters/SI_char_<pose>_T.png`) are reusable assets — drop into poster HTML via `<img>` (they composite cleanly on ANY background) and into the Remotion video.

## SI canonical characters (specifics)
The real SI illustrated hosts live in the **podcast cover art / episode-card header image** (Sanity CDN, `cdn.sanity.io/images/222amyu0/...`), NOT the "Chief Idiots" section (those are real photos). Look = Breaking-Bad parody: both hosts in yellow hazmat hoodies, grey respirators pushed up on the forehead (pink cartridges), orange safety glasses, green chalkboard bg. Joe = silver hair; Peter = salt-pepper, NO beard, NO glasses.
