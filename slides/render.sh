#!/bin/zsh
# Build the deck, export PDF via Keynote, rasterise pages and make contact sheets.
set -e
cd "$(dirname "$0")"
PY=../odin-agent/venv/bin/python
$PY build_deck.py
$PY deck_to_md.py human-is-the-reviewer.pptx > deck-review.md
rm -f preview/deck.pdf preview/p-*.png(N)
osascript export_pdf.applescript "$PWD/human-is-the-reviewer.pptx" "$PWD/preview/deck.pdf"
cp preview/deck.pdf human-is-the-reviewer.pdf
pdftoppm -png -r 55 preview/deck.pdf preview/p
$PY - <<'EOF'
from PIL import Image
import glob
ims = [Image.open(f) for f in sorted(glob.glob('preview/p-*.png'))]
w, h = ims[0].size
for part, chunk in enumerate([ims[:8], ims[8:]]):
    rows = (len(chunk) + 1) // 2
    sh = Image.new('RGB', (2 * w + 30, rows * h + (rows + 1) * 10), (80, 80, 80))
    for i, im in enumerate(chunk):
        r, c = divmod(i, 2)
        sh.paste(im, (10 + c * (w + 10), 10 + r * (h + 10)))
    sh.save(f'preview/contact_{part + 1}.png')
print(len(ims), "pages")
EOF
