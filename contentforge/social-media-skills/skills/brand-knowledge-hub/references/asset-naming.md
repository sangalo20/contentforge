# Brand Asset Naming & Folder Convention

Locked by Joe (June 2026). Every saved visual/content asset (posters, carousels, thumbnails, etc.) MUST follow this so anyone scanning a folder can tell exactly what a file is.

## Filename pattern

```
{BRAND}_{PLATFORM}_{TYPE}_{REF}_{slug}_v{N}.{ext}
```

| Field | Allowed values |
|---|---|
| BRAND | `SI` (Successful Idiots) · `SM` (Storage Moguls) · `JD` (Joe Downs personal) · `STP` (StorPro) · `BEL` (Belrose) |
| PLATFORM | `LinkedIn` · `Instagram` · `Facebook` · `X` · `YouTube` · `Multi` |
| TYPE | `Poster` · `Carousel` · `Quote` · `Thumbnail` · `Story` · `Banner` · `Reel-Cover` |
| REF | episode/source ref (`Ep29`, `Ep8`) OR ISO date for non-episode (`2026-06-20`) |
| slug | short kebab-case topic, lowercase (`60-percent-no-click`, `800k-to-1-4m`) |
| vN | version, starts at `v1`; bump on every meaningful revision (`v2`, `v3`) |

**Examples**
- `SI_LinkedIn_Poster_Ep29_60-percent-no-click_v1.png`
- `SM_LinkedIn_Poster_Ep8_800k-to-1-4m_v1.png`

## Folder tree

Local root: `C:\Users\somea\BrandAssets\`

```
BrandAssets/
  Successful-Idiots/{Platform}/
  Storage-Moguls/{Platform}/
  Joe-Downs/{Platform}/
  StorPro/{Platform}/
  Belrose/{Platform}/
```

Rules:
- The editable **source `.html` lives NEXT TO its exported `.png`** (same name, different ext) so the source is never orphaned.
- Brand folders use full hyphenated names (`Successful-Idiots`); filenames use the short brand code (`SI`).
- Never dump assets in the home dir / Desktop. Always under `BrandAssets/{Brand}/{Platform}/`.

## Raw-media drop-zones (when Joe supplies photos/videos separately — StorPro pattern, July 2026)

Some brands (esp. facility brands like StorPro) have raw source media — facility photos, video clips, logo files — that **Joe adds himself later**, distinct from produced posts. When "set up the brand / gather its files" is the ask, create these drop-zone folders ALONGSIDE the standard `{Platform}/` folders and add a `README.md` telling Joe exactly where to drop what:

```
BrandAssets/{Brand}/
  Photos/          ← Joe drops raw facility/product photos here
  Videos/          ← Joe drops raw video clips (tours, drone, promos, testimonials)
  Logos/           ← logo lockups, brand-mark exports, brand-guide assets
  Source-Media/    ← raw/unedited source files before they're cut into posts
  LinkedIn/ Instagram/ Facebook/ X/ YouTube/ Multi/   ← PRODUCED, ready-to-post assets
```

The brand `README.md` should carry: the drop-zone table (what goes where), the filename convention line, and a brand quick-reference (colors/font/Canva-kit/contact/socials) lifted from `brand-assets.md` so the folder is self-documenting. This makes the folder a clean staging home the moment Joe returns with media — no re-explaining.

## Mirror in Canva & Drive

When the same asset lands in Canva or Drive, reuse the **exact filename** (minus extension) as the design/file title so the three systems cross-reference cleanly. Canva folder = brand name; Drive folder mirrors the same tree if/when used.

## Render workflow (HTML poster → PNG)

1. Author poster as self-contained HTML under the correct `BrandAssets/{Brand}/{Platform}/` path with the convention name.
2. Export PNG via headless Chrome (verified working):
   ```
   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1350 --virtual-time-budget=9000 --screenshot="<abs.png>" "file:///<abs.html>"
   ```
3. Always visually QA the PNG (browser_vision) before delivering — caught a $1.4M edge-overflow this way.

*Source: Joe directive, June 2026. Keep updated when new brands/platforms/types are introduced — ADD never rebuild.*
