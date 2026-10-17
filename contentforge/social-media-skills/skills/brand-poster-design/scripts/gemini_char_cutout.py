#!/usr/bin/env python3
"""
Gemini character-grid -> clean TRANSPARENT per-pose cutouts.

Proven June 2026 on the Successful Idiots host grids (Joe + Peter, yellow hazmat
hoodies on a green chalkboard bg). Turns a Gemini pose grid into transparent PNGs
that composite cleanly on ANY poster background (no green box, no white bleed,
teeth preserved, no divider frame).

RUN WITH:  C:/Python313/python.exe   (it has PIL/numpy; git-bash `python` may not)

USAGE:
  1. Edit GRID, OUT, ROWS, COLS, CELLS below for your grid (vision-analyze the
     grid first to get its real layout — DON'T assume 2x2; SI grids were 3x2).
     Skip cells that have baked-in name labels or off-style characters.
  2. python gemini_char_cutout.py
  3. QA each *_T.png by compositing on magenta (see qa_on_magenta at bottom).

KEY LESSONS BAKED IN (each cost iterations):
  - inset g≈30 so the dashed cell-divider line is not in the crop
  - green-key margin ~16 (keys bg; greyish cap/hair survives). >=30 stops keying.
  - DO NOT key white -> it eats teeth / eye-whites (Joe: "ensure the teeth are there")
  - keep connected components >= ~4% area -> kills the residual ~1px frame WITHOUT
    deleting the 2nd host (never "keep largest component" on a duo)
  - strip_border_columns AFTER component cleanup -> removes a NEAR-FULL-HEIGHT thin
    border streak (e.g. col 2 had 618 opaque px in a 622px-tall image). This is the
    one that bit hard June 2026: the white vertical line SURVIVED both the component
    filter (it's "large" by pixel count) AND autocrop (it sits at the very edge), so
    it kept reappearing in the rendered poster. Joe: "the white line is still there."
    Diagnose by printing per-column opaque counts: a column whose count ~= image
    height but whose neighbors are far smaller IS the border streak. ALSO: re-render
    EVERY poster that embeds a cutout after you re-clean it — a stale render will
    still show the old line even though the PNG is fixed.
"""
import numpy as np, os
from collections import deque
from PIL import Image

# ---- EDIT THESE ----
GRID = r"C:\Users\somea\Downloads\Gemini_Generated_Image_REPLACE.png"
OUT  = r"C:\Users\somea\BrandAssets\Successful-Idiots\characters"
ROWS, COLS = 3, 2          # <-- vision-confirm the real grid shape first
INSET = 30                 # px inset per cell to clear divider lines
GREEN_MARGIN = 16          # green-key strength (16 good; 30 = stops keying)
MIN_COMPONENT_FRAC = 0.04  # drop opaque blobs smaller than this frac of area
# name = (row, col) of cells to extract (0-indexed). Skip labeled/off-style cells.
CELLS = {
    "duo_arms_crossed":   (0, 0),
    "duo_point_thumbsup": (0, 1),
    "duo_at_mic":         (1, 0),
    "duo_at_mic_intense": (1, 1),
    # row 2 here had name labels / bare-head pair -> skipped
}
# --------------------


def green_key(cell_rgb):
    arr = np.asarray(cell_rgb.convert("RGB")).astype(np.int16)
    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    is_green = (g > r + GREEN_MARGIN) & (g > b + GREEN_MARGIN) & (g < 175)
    alpha = np.where(is_green, 0, 255).astype(np.uint8)   # NB: no white-key (teeth!)
    return arr.astype(np.uint8), alpha


def keep_large_components(alpha):
    H, W = alpha.shape
    vis = np.zeros((H, W), np.int32)
    op = alpha > 40
    cur = 0
    sizes = {}
    for sy in range(H):
        for sx in range(W):
            if op[sy, sx] and vis[sy, sx] == 0:
                cur += 1
                q = deque([(sy, sx)]); vis[sy, sx] = cur; sz = 0
                while q:
                    y, x = q.popleft(); sz += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < H and 0 <= nx < W and op[ny, nx] and vis[ny, nx] == 0:
                            vis[ny, nx] = cur; q.append((ny, nx))
                sizes[cur] = sz
    keep = {cid for cid, sz in sizes.items() if sz >= MIN_COMPONENT_FRAC * H * W}
    return np.isin(vis, list(keep))


def strip_border_columns(alpha, frac=0.75, neighbor_ratio=1.6):
    """Zero out near-full-height thin border streaks that the component filter keeps.
    A 'border column' = opaque count >= frac*H AND >> its neighbors (the character
    body is much shorter per-column). Also defensively clears the outer 3 cols/rows.
    This is the fix for the persistent vertical white line (June 2026)."""
    H, W = alpha.shape
    a = alpha.copy()
    col = (a > 30).sum(axis=0)
    for x in range(W):
        ln = col[x - 1] if x > 0 else 0
        rn = col[x + 1] if x < W - 1 else 0
        if col[x] >= frac * H and col[x] > neighbor_ratio * max(ln, rn, 1):
            a[:, x] = 0
    row = (a > 30).sum(axis=1)
    for y in range(H):
        un = row[y - 1] if y > 0 else 0
        dn = row[y + 1] if y < H - 1 else 0
        if row[y] >= frac * W and row[y] > neighbor_ratio * max(un, dn, 1):
            a[y, :] = 0
    a[:, :3] = 0; a[:, W - 3:] = 0; a[:3, :] = 0; a[H - 3:, :] = 0  # outer edge defensive
    return a


def autocrop(rgba, pad=6):
    a = np.asarray(rgba)[..., 3]
    ys, xs = np.where(a > 30)
    if len(xs) == 0:
        return rgba
    return rgba.crop((max(0, xs.min() - pad), max(0, ys.min() - pad),
                      min(rgba.width, xs.max() + pad), min(rgba.height, ys.max() + pad)))


def solo_from_duo(rgba, left_frac=0.46):
    """Make a clean single character from a capped duo's left portion."""
    w, h = rgba.size
    return autocrop(rgba.crop((0, 0, int(w * left_frac), h)))


def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(GRID).convert("RGB")
    W, H = im.size
    cw, ch = W // COLS, H // ROWS
    for name, (rr, cc) in CELLS.items():
        l, t = cc * cw, rr * ch
        cell = im.crop((l + INSET, t + INSET, l + cw - INSET, t + ch - INSET))
        rgb, alpha = green_key(cell)
        mask = keep_large_components(alpha)
        alpha = np.where(mask, alpha, 0).astype(np.uint8)
        alpha = strip_border_columns(alpha)   # kill residual full-height border streaks
        rgba = autocrop(Image.fromarray(np.dstack([rgb, alpha]), "RGBA"))
        p = os.path.join(OUT, f"SI_char_{name}_T.png")
        rgba.save(p)
        op = 100 * (np.asarray(rgba)[..., 3] > 8).mean()
        print(f"{name}: {rgba.size} opaque%={op:.1f}  -> {p}")
    print("done. QA each on magenta before use.")


def qa_on_magenta(png_path):
    fg = Image.open(png_path).convert("RGBA")
    bg = Image.new("RGBA", fg.size, (214, 51, 132, 255))
    out = png_path.replace(".png", "_QA.png")
    Image.alpha_composite(bg, fg).convert("RGB").save(out)
    print("QA ->", out)


if __name__ == "__main__":
    main()
