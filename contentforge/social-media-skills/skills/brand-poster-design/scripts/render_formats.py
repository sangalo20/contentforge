#!/usr/bin/env python3
"""
Render ONE poster HTML across multiple platform dimensions (portrait / square / story).

Proven June 2026 on the SI Ep030 batch ("we'll be using the content across platforms —
create the dimension for all of them"). Same source HTML, three crops, via a `data-fmt`
attribute the base CSS keys off of. Avoids hand-authoring 3 files per poster.

RUN WITH:  C:/Python313/python.exe
USAGE:     python render_formats.py "stem1,stem2,..." "square,story"
           (stems = poster filename without .html; formats default to square,story)
           Outputs <stem>__<fmt>.png beside the source.

PREREQUISITE — the shared base CSS (e.g. _si_base.css) must define the format hooks:
    .p{width:1080px;height:1350px;}                       /* portrait default 4:5 */
    body[data-fmt="square"] .p{height:1080px;}            /* 1:1 */
    body[data-fmt="story"]  .p{height:1920px;}            /* 9:16 */
    /* For STORY, recenter so content doesn't clump at the top: */
    body[data-fmt="story"] .pad{justify-content:center;}
    body[data-fmt="story"] .pad .spacer{display:none;}
    body[data-fmt="story"] .top{position:absolute;top:70px;left:70px;right:70px;}
    body[data-fmt="story"] .foot{position:absolute;bottom:80px;left:70px;right:70px;margin-top:0;}

DIMENSION MAP (Joe's brands, per platform):
  - 1080x1350 (4:5 portrait)  -> LinkedIn + Instagram feed + Facebook feed  (covers 3 at once)
  - 1080x1080 (1:1 square)    -> IG/FB square option
  - 1080x1920 (9:16 story)    -> IG/FB Stories + (video) TikTok / IG Reels

HONEST LIMIT (state it to Joe, don't pretend it's perfect):
  Auto-reflow to 9:16 is GREAT for visual-light posters (minimalist, quote, single
  character). TEXT-HEAVY ones (dossier, multi-step infographic, long list) leave dead
  space in the lower half because content anchors up top — `justify-content:center`
  helps but `margin-top:auto` blocks inside a card defeat it. If Joe wants those premium
  for Stories, hand-tune the 2-3 text-heavy ones; otherwise they're usable as-is.
"""
import os, subprocess, sys

LDIR = r"C:\Users\somea\BrandAssets\Successful-Idiots\LinkedIn"  # edit per brand/platform dir
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
FORMATS = {"portrait": (1080, 1350), "square": (1080, 1080), "story": (1080, 1920)}

stems = sys.argv[1].split(",") if len(sys.argv) > 1 else []
do_formats = sys.argv[2].split(",") if len(sys.argv) > 2 else ["square", "story"]

for stem in stems:
    src = os.path.join(LDIR, stem + ".html")
    html = open(src, encoding="utf-8").read()
    for fmt in do_formats:
        w, h = FORMATS[fmt]
        mod = html.replace("<body>", f'<body data-fmt="{fmt}">', 1)
        tmp = os.path.join(LDIR, f"_tmp_{stem}_{fmt}.html")
        open(tmp, "w", encoding="utf-8").write(mod)
        out = os.path.join(LDIR, f"{stem}__{fmt}.png")
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                        "--force-device-scale-factor=1", f"--window-size={w},{h}",
                        "--virtual-time-budget=9000", f"--screenshot={out}",
                        "file:///" + tmp.replace("\\", "/")],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.remove(tmp)
        print("rendered", os.path.basename(out), f"{w}x{h}")
print("done")
