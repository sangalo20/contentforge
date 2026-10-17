#!/usr/bin/env python3
"""
Purpose-built GLANCEABLE 9:16 story generator (Option A, Joe-approved June 2026).

USE THIS for DENSE feed posters (checklists, multi-card stats, dossiers) that do
NOT reflow cleanly via storyify.py — instead of fighting per-poster CSS to cram a
1350-tall layout into 1920, build a simple full-bleed story: brand spine + kicker
+ big hook headline + ONE supporting line + footer. No crammed lists.

WHY (Joe directive): stories are a glanceable, in-the-moment format. A reader sees
a story for ~3 seconds — a dense checklist reflowed to 9:16 reads worse than a
clean hook. So DROP the dense body and keep only the hook + one line. Joe approved
this over faithful full-content reflow ("go with your recommendation").

RUN: C:/Python313/python.exe gen_story_simple.py
Edit STORIES below (brand, slug, kicker, headline HTML, sub, footerL, footerR).
Outputs <slug>.png into the brand's LinkedIn dir. Text must already be humanized
(no em-dashes) — caller's responsibility.

Per-brand spine baked into BRANDS: JD (navy/electric-blue/Inter), SM
(navy/blue/Fraunces serif/"Practitioners, Not Professors."), SI
(near-black/green+yellow/Oswald). Extend BRANDS to add a brand.
"""
import os, subprocess

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
W, H = 1080, 1920
ROOT = r"C:\Users\somea\BrandAssets"

BRANDS = {
    "JD": dict(dir=r"Joe-Downs\LinkedIn", bg="#0A0E16", accent="#6FA0FF",
               hfont="'Inter',sans-serif", kicker="#6FA0FF", foot="#8A93A6",
               kfont="'JetBrains Mono',monospace",
               fonts="Inter:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700"),
    "SM": dict(dir=r"Storage-Moguls\LinkedIn", bg="#10182B", accent="#2E7DF6",
               hfont="'Fraunces','Georgia',serif", kicker="#5C9CFF", foot="#8FA0BD",
               kfont="'Barlow Condensed',sans-serif",
               fonts="Fraunces:opsz,wght@9..144,500;9..144,600&family=Barlow+Condensed:wght@600;700&family=Montserrat:wght@400;600"),
    "SI": dict(dir=r"Successful-Idiots\LinkedIn", bg="#15151F", accent="#16A34A",
               hfont="'Oswald',sans-serif", kicker="#FDE801", foot="#9a9aa6",
               kfont="'Space Mono',monospace",
               fonts="Oswald:wght@600;700&family=Space+Mono:wght@400;700"),
}

# (brand, slug, kicker, headline_html [use <span class='a'> for accent], sub, footerL, footerR)
STORIES = [
    ("SM", "SM_story_lender-ready-package_simple", "THE LENDER-READY PACKAGE",
     "Five things make a file <span class='a'>fundable.</span>",
     "P&Ls, rent roll, your financials, your own comps, and a real proforma. No track record required. Just preparation.",
     "PRACTITIONERS, NOT PROFESSORS.", "storagemoguls.ai"),
]

TPL = """<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family={fonts}&display=swap" rel="stylesheet"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{background:{bg}}}
.p{{position:relative;width:1080px;height:1920px;background:{bg};overflow:hidden;color:#fff}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:54px 54px;opacity:.6}}
.glow{{position:absolute;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,{accent}26,transparent 65%);filter:blur(10px);top:-160px;right:-220px}}
.frame{{position:absolute;inset:34px;border:1px solid rgba(255,255,255,.10);border-radius:10px}}
.wrap{{position:absolute;inset:34px;display:flex;flex-direction:column;justify-content:center;padding:0 88px}}
.kick{{font-family:{kfont};font-weight:700;font-size:26px;letter-spacing:4px;color:{kicker};text-transform:uppercase;margin-bottom:30px}}
.head{{font-family:{hfont};font-weight:700;font-size:118px;line-height:1.02;letter-spacing:-1px;color:#fff}}
.head .a{{color:{accent}}}
.sub{{font-family:'Montserrat','Open Sans',sans-serif;font-weight:400;font-size:38px;line-height:1.5;color:#C7D0DE;margin-top:44px;max-width:880px}}
.foot{{position:absolute;left:88px;right:88px;bottom:96px;display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(255,255,255,.12);padding-top:26px}}
.footL{{font-family:{kfont};font-weight:700;font-size:24px;letter-spacing:1px;color:{foot};line-height:1.3}}
.footR{{font-family:{hfont};font-weight:700;font-size:30px;color:#fff}}
</style></head><body><div class="p"><div class="grid"></div><div class="glow"></div><div class="frame"></div>
<div class="wrap"><div class="kick">{kicker_txt}</div><div class="head">{head}</div><div class="sub">{sub}</div></div>
<div class="foot"><div class="footL">{footL}</div><div class="footR">{footR}</div></div>
</div></body></html>"""

for brand, slug, kick, head, sub, footL, footR in STORIES:
    b = BRANDS[brand]
    html = TPL.format(fonts=b["fonts"], bg=b["bg"], accent=b["accent"], kfont=b["kfont"],
                      hfont=b["hfont"], kicker=b["kicker"], foot=b["foot"],
                      kicker_txt=kick, head=head, sub=sub, footL=footL, footR=footR)
    d = os.path.join(ROOT, b["dir"])
    tmp = os.path.join(d, slug + "_tmp.html")
    out = os.path.join(d, slug + ".png")
    open(tmp, "w", encoding="utf-8").write(html)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", f"--window-size={W},{H}",
                    "--virtual-time-budget=9000", f"--screenshot={out.replace(chr(92),'/')}",
                    "file:///" + tmp.replace("\\", "/")],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.remove(tmp)
    print("rendered", os.path.basename(out))
print("done")
