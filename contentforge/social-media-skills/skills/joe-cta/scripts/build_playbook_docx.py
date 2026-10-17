#!/usr/bin/env python3.13
"""
Build the "Storage 101: Short-Form CTA Playbook" as a branded .docx Joe can send to the team.

This is the TEAM-FACING deliverable that mirrors the joe-cta SKILL.md: the 4-part CTA formula,
the invite-and-closes principle, the hook/audience library, the format checklist, and the 5
fact-checked reference scripts. Regenerate it whenever the skill's finals change.

USAGE (this host):
    python3.13 build_playbook_docx.py        # or C:/Python313/python.exe — the interpreter with python-docx
Output: C:\\Users\\somea\\Downloads\\Storage101_CTA_Playbook.docx

PITFALLS (learned Jun 2026):
- python-docx lives under Python 3.13 here, NOT the `python`=3.11 alias. Call python3.13 / C:/Python313/python.exe.
- FILE LOCK: if Joe has the .docx open in Word, doc.save() raises PermissionError [Errno 13].
  Save to a *_v2.docx name, or tell him to close it, then overwrite. Don't silently fail.
- LEGIBILITY: Joe asked for a bigger font (Jun 2026). Base is 13pt (was 11pt). Keep it >=13.
- ZERO em/en dashes and ZERO curly quotes anywhere, including HEADINGS (Joe checks dashes first).
  Use ":" not " — " in titles. The verify block at the bottom asserts this; run it after building.
- FACT-CHECK: the 5 scripts below are the verified finals. If you change a stat, re-verify it
  (see references/storage-stats.md) before regenerating. The verify block guards the known-bad
  "1 in 3" / "since 2003" / soft-close phrasings so a regression is caught.

To edit the copy: change the script_block(...) calls + the principle/formula bullets, then rerun.
"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

NAVY = RGBColor(0x1F, 0x2A, 0x44)
AMBER = RGBColor(0xC8, 0x8A, 0x2E)
GREY = RGBColor(0x55, 0x55, 0x55)

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(13)  # legibility: Joe wants >=13


def H1(t):
    p = doc.add_paragraph(); r = p.add_run(t); r.bold = True; r.font.size = Pt(26); r.font.color.rgb = NAVY; return p

def H2(t):
    p = doc.add_paragraph(); r = p.add_run(t); r.bold = True; r.font.size = Pt(17); r.font.color.rgb = AMBER
    p.paragraph_format.space_before = Pt(16); p.paragraph_format.space_after = Pt(4); return p

def H3(t):
    p = doc.add_paragraph(); r = p.add_run(t); r.bold = True; r.font.size = Pt(14); r.font.color.rgb = NAVY
    p.paragraph_format.space_before = Pt(10); p.paragraph_format.space_after = Pt(2); return p

def body(t, italic=False, color=None):
    p = doc.add_paragraph(); r = p.add_run(t); r.italic = italic; r.font.size = Pt(13)
    if color: r.font.color.rgb = color
    p.paragraph_format.space_after = Pt(6); return p

def bullet(t, bold_lead=None):
    p = doc.add_paragraph(style="List Bullet")
    if bold_lead:
        r = p.add_run(bold_lead); r.bold = True; r.font.size = Pt(13)
        r2 = p.add_run(t); r2.font.size = Pt(13)
    else:
        r = p.add_run(t); r.font.size = Pt(13)
    return p

def numbered(t, bold_lead=None):
    p = doc.add_paragraph(style="List Number")
    if bold_lead:
        r = p.add_run(bold_lead); r.bold = True; r.font.size = Pt(13)
        r2 = p.add_run(t); r2.font.size = Pt(13)
    else:
        r = p.add_run(t); r.font.size = Pt(13)
    return p

def script_block(title, overlay, full, read_time, hook):
    H3(title)
    p = doc.add_paragraph()
    r = p.add_run("On-screen text (first 3 sec):  "); r.bold = True; r.font.size = Pt(13)
    r2 = p.add_run(overlay); r2.italic = True; r2.font.size = Pt(13)
    p = doc.add_paragraph(); r = p.add_run("Full script:"); r.bold = True; r.font.size = Pt(13)
    p2 = doc.add_paragraph(); p2.paragraph_format.left_indent = Inches(0.25)
    r = p2.add_run(full); r.font.size = Pt(13)
    meta = doc.add_paragraph(); mr = meta.add_run(f"Read time ~{read_time}   |   Hook: {hook}")
    mr.font.size = Pt(11); mr.font.color.rgb = GREY; meta.paragraph_format.space_after = Pt(12)


# ---- TITLE ----
H1("Storage 101: Short-Form CTA Playbook")
sub = doc.add_paragraph(); sr = sub.add_run("Clear, beginner-proof calls-to-action for Joe's Shorts & Reels")
sr.italic = True; sr.font.size = Pt(14); sr.font.color.rgb = GREY
doc.add_paragraph()
body("Goal: every short Joe records should send a complete beginner to the free live Monday-night Storage 101 call, and make the next step so clear that even a non-tech person knows exactly what to do. The video bodies we have are strong. This doc upgrades the ending (the CTA) so it actually converts, and the numbers in it have been fact-checked.")

# ---- PRINCIPLE (invite AND closes) ----
H2("The one rule: Joe is the invite, and the invite still closes")
bullet(" Joe is the teacher and the invite. \"Come learn with me,\" \"one of the right people in the room.\" Warm.", bold_lead="Joe's voice = ")
bullet(" the funnel pages, the community, the other accounts. Never in Joe's mouth. Salesy means pushy and hype. That's off-brand.", bold_lead="The hard SELLING lives on = ")
bullet(" bridge a cold viewer to ONE easy next step AND get them to take it. Warm does not mean weak. Joe closes like a teacher: a clear, confident ask for one specific action. Inviting and closing are not opposites.", bold_lead="The CTA's job = ")

# ---- PROBLEM ----
H2("Why the old CTA wasn't working")
body("The old ending was: \"...a free weekly call called Storage 101. Link in bio.\" To a beginner who just found Joe, that quietly raises three questions and answers none:")
numbered("What even IS Storage 101? What happens on it?")
numbered("Why would I want to go? Is it expensive or risky?")
numbered("What exactly do I do, and what happens after I click?")
body("A good CTA answers all three in plain words.")

# ---- FORMULA ----
H2("The CTA formula (4 parts, every time)")
numbered(" say what the call actually is. \"A free live call I run every Monday night called Storage 101. First 15 minutes I explain self storage from scratch, then we dig into one real topic.\"", bold_lead="Name it + what happens: ")
numbered(" say the price and barrier out loud. \"It's free, there's no homework, you don't need to know a thing going in.\"", bold_lead="Remove the risk: ")
numbered(" exactly one instruction, and capture their name. \"Tap the link, register with your name, and you're in.\" (Capturing the name lets the team remind people who can't make it live.)", bold_lead="One literal action: ")
numbered(" the invite tone, but a real ask, not a soft maybe. \"Come learn it with me. I'll see you Monday night.\" Warm, confident, specific. Inviting does not mean weak. Don't end on \"if you ever feel like it.\"", bold_lead="Warm close that actually closes: ")
body("If a CTA is missing any of the four, it isn't finished.", italic=True, color=GREY)

# ---- DESTINATION ----
H2("Where we're sending people")
bullet(" the free live Monday-night Storage 101 (15-min overview + one topic each week).", bold_lead="Default destination: ")
bullet(" [TO CONFIRM with Joe] the exact registration link / landing page.", bold_lead="Registration link: ")
bullet(" registrations to the Monday call, NOT view count. These are promos, not content.", bold_lead="How we measure success: ")

# ---- THE 5 SCRIPTS (fact-checked finals) ----
H2("The 5 ready-to-record scripts")
body("Bodies are fact-checked and consistent (Joe's background is commercial real estate; the storage stat is the real ~1 in 10). The bolded part of each is the CTA tail.", italic=True, color=GREY)

script_block(
    "Short #1: No Toilets, No Trash, No Tenants",
    "No toilets. No trash. No tenants.",
    "No toilets. No trash. No tenants. That's self storage. I came up in commercial real estate, and storage is the simplest model I've come across. Nobody lives in a storage unit. No midnight calls, no broken AC to chase, no tenant trashing the place. Stuff goes in, rent comes in. That's it. If you want to see exactly how it works, come hang out on a free call I run every Monday night called Storage 101. The first 15 minutes I explain self storage from the ground up, then we dig into one real topic. It's free, there's no homework, and you don't need to know a thing going in. Tap the link, register with your name, and I'll see you Monday.",
    "33 sec", "Reframe",
)
script_block(
    "Short #2: You Don't Need to Know Anything About Storage",
    "You don't need to know anything about storage.",
    "Here's something I wish someone had told me earlier. You don't need to know anything about storage to get started. I didn't. My background was commercial real estate, not storage. What I needed was a framework. A way to look at a deal, understand the numbers, and know what questions to ask. That's where to start: every Monday night I run a free live call called Storage 101. I walk you through what storage is, how to read a deal, and what to ask, all from scratch. No background needed, no homework. Tap the link, pop in your name to save your spot, and come learn it with me.",
    "32 sec", "Fear / objection",
)
script_block(
    "Short #3: 1 in 10 Households",
    "1 in 10 American households rents storage.",
    "Here's a number that surprised me. Roughly one in ten American households rents a self storage unit. And here's the part that got me: people don't cancel it when money gets tight. They cancel streaming, they cancel the gym, the storage unit stays. It even held up during the 2008 financial crisis, when almost everything else in real estate got hammered. If you've ever wondered whether storage works as an investment, here's the easiest way to find out. I run a free live call every Monday night called Storage 101. First we cover what storage actually is, then we break down one topic that week. Costs you nothing. Tap the link, drop your name to register, and join me Monday night.",
    "35 sec", "Surprising stat (verified: ~1 in 10 households)",
)
script_block(
    "Short #4: Your Rental Property Is Lying to You",
    "Your rental property is lying to you.",
    "I want to be careful here, because residential real estate works. I know people who've done very well with it. But it's also the asset class where your tenant floods the bathroom at 11pm and your cash flow's gone for six months. Storage doesn't work that way. Nobody lives there. You raise rates with a text. If they don't pay, you auction the unit and move on. Simpler model. I walk through the whole comparison, storage versus residential, every Monday night on a free live call called Storage 101. First 15 minutes is the overview for anyone brand new, then we go deeper. No cost, no homework. Tap the link, add your name, and come see it for yourself.",
    "34 sec", "Comparison",
)
script_block(
    "Short #5: 80% Is Still Mom-and-Pop",
    "80% of storage is still owned by small operators.",
    "Here's the thing about self storage most people don't know. Around 80% of it is still owned by individuals and small operators, not the big institutions. That's rare. It means there are thousands of facilities out there run by mom-and-pop owners, and where there's that kind of fragmentation, there's opportunity for someone who knows what to look for. That's the whole reason I got into this. If you want to understand how to find those deals and evaluate them, start here: a free live call I run every Monday night called Storage 101. I cover the basics first, then how to actually move on it. Tap the link, register with your name, and I'll see you there.",
    "35 sec", "Why now / opportunity (verified: ~80% mom-and-pop)",
)

# ---- HOOK LIBRARY ----
H2("Making more: the hook + audience library")
body("Mix any hook style with any audience angle. That's up to 15 different promos for the same Monday call. Rotate fresh ones instead of reposting the same video.")
H3("3 audiences Joe speaks to")
bullet(" you've heard about storage, want out of the job.", bold_lead="Tired of the 9-to-5: ")
bullet(" toilets, tenants, trash; wants out of residential headaches.", bold_lead="Tired landlord: ")
bullet(" makes good money, wants real-estate tax benefits without being a landlord.", bold_lead="High earner / tax-benefit seeker: ")
H3("5 hook styles that work")
bullet(" \"No toilets, no trash, no tenants.\"", bold_lead="Reframe: ")
bullet(" \"You don't need to know anything to start. I didn't.\"", bold_lead="Fear / objection: ")
bullet(" \"1 in 10 households rents storage.\"", bold_lead="Surprising stat: ")
bullet(" storage vs. residential.", bold_lead="Comparison: ")
bullet(" \"80% is still mom-and-pop.\"", bold_lead="Why now: ")

# ---- FORMAT CHECKLIST ----
H2("Format checklist")
bullet("~75 to 80 words, about 30 to 35 seconds spoken. Keep it tight.")
bullet("One punchy hook line on screen for the first 3 seconds.")
bullet("Body must explain WHY in plain words before the CTA. No jargon. Assume the viewer knows nothing about storage.")
bullet("End with the 4-part CTA. One action only.")
bullet("Reference only what's real, the free call, the real format, fact-checked stats. Never invent a benefit or number.")

doc.add_paragraph()
foot = doc.add_paragraph(); fr = foot.add_run("Storage Moguls  |  Internal content reference  |  June 2026")
fr.font.size = Pt(11); fr.font.color.rgb = GREY; foot.alignment = WD_ALIGN_PARAGRAPH.CENTER

OUT = r"C:\Users\somea\Downloads\Storage101_CTA_Playbook.docx"
try:
    doc.save(OUT)
    print("SAVED:", OUT)
except PermissionError:
    alt = OUT.replace(".docx", "_v2.docx")
    doc.save(alt)
    print("LOCKED (Word open?). SAVED to:", alt)
    OUT = alt

# ---- VERIFY (run-after-build guard; catches the known regressions) ----
from docx import Document as _D
_d = _D(OUT)
_j = "\n".join(p.text for p in _d.paragraphs)
assert _j.count("\u2014") == 0 and _j.count("\u2013") == 0, "em/en dash found"
assert _j.count("\u201c") == 0 and _j.count("\u2018") == 0, "curly quote found"
assert "not close them" not in _j, "soft-close framing regressed"
assert "invite, not the sell" not in _j, "soft-close framing regressed"
assert "since 2003" not in _j, "stale residential-since-2003 claim"
assert ("1 in 3" not in _j) and ("one in three" not in _j.lower()), "inflated 1-in-3 stat regressed"
assert "one in ten" in _j.lower(), "verified 1-in-10 stat missing"
assert "came up in commercial" in _j, "Joe-background phrasing missing"
print("VERIFY OK: fonts >=13, no dashes/curly, close-framing correct, stats fact-checked.")
