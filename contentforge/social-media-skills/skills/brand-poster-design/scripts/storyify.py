#!/usr/bin/env python3
"""
Reflow an existing 1080x1350 brand poster HTML to a 1080x1920 STORY by INJECTING
data-fmt="story" CSS hooks at render time. Use this for posters whose base CSS
LACKS the story hooks (the JD/SM per-poster HTML does NOT have them, unlike the SI
_si_base.css). render_formats.py assumes the hooks already exist; storyify.py adds
them, so it's the right tool for one-off JD/SM posters.

RUN: C:/Python313/python.exe storyify.py "<abs_html_1>" "<abs_html_2>" ...
Outputs <stem>__story.png beside each source. Text must already be humanized.

WHAT IT INJECTS: stretch .p to 1920, recenter the .pad flex column
(justify-content:center + hide .spacer), pin tag top / footer bottom, grow
full-bleed (.fb) + photo-right (.pr) layers to 1920, and HIDE decorative accent
bars (.fbbar/.tbbar).

WHY HIDE THE ACCENT BARS (pitfall, June 2026): .fbbar/.tbbar are absolutely
positioned by a fixed `bottom:`/`top:` tuned for the 1350 canvas. After story
recenter they float INTO the headline and render as a stray colored line slicing
through a word (looked like a strikethrough on "The"). Hiding them in story mode
fixes it — they're accents, not content.

CLEAN vs DENSE (verified June 2026): this clean reflow works for VISUAL-LIGHT
posters (minimalist statement, quote, big-stat, single photo full-bleed). For
TEXT-HEAVY posters (multi-item checklist, multi-card stat, dossier) the inner
content block is 1350-tall and does NOT reflow — you get a big dead band in the
lower third AND clipped trailing content (e.g. a takeaway box cut off). Do NOT
ship those; build them with gen_story_simple.py instead (Option A).
"""
import os, subprocess, sys

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
W, H = 1080, 1920

STORY_CSS = """
<style id="storyhooks">
html,body{background:#0A0E16}
.p{height:1920px !important}
.frame{inset:30px !important}
.pad{height:calc(1920px - 60px) !important;justify-content:center !important}
.pad .spacer{display:none !important}
.pad .tag,.pad .hwtag{position:absolute;top:64px;left:94px}
.pad .foot{position:absolute;left:94px;right:94px;bottom:70px}
/* decorative accent bars float into text after recenter -> hide in story */
.fbbar,.tbbar{display:none !important}
/* full-bleed cinematic */
.fb img{height:1920px !important}
.fbgrad{background:linear-gradient(180deg,rgba(10,14,22,.30) 0%,rgba(10,14,22,0) 34%,rgba(10,14,22,.55) 60%,rgba(10,14,22,.96) 84%,#0A0E16 100%) !important}
.fbpanel{bottom:230px !important}
/* photo-right split -> full height */
.pr,.pr img,.prscrim,.prtext{height:1920px !important}
/* top-bleed */
.tb,.tb img,.tbscrim{height:760px !important}
.tbpanel{top:820px !important}
/* medallion */
.med{top:240px !important}
.medglow{top:210px !important}
</style>
"""

for src in sys.argv[1:]:
    html = open(src, encoding="utf-8").read()
    mod = html.replace("</head>", STORY_CSS + "</head>", 1)
    mod = mod.replace("<body>", '<body data-fmt="story">', 1)
    stem = os.path.splitext(src)[0]
    tmp = stem + "__story_tmp.html"
    out = stem + "__story.png"
    open(tmp, "w", encoding="utf-8").write(mod)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", f"--window-size={W},{H}",
                    "--virtual-time-budget=9000", f"--screenshot={out.replace(chr(92),'/')}",
                    "file:///" + tmp.replace("\\", "/")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(tmp)
    print("rendered", os.path.basename(out))
print("done")
