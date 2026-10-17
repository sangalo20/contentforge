#!/usr/bin/env python3
"""
plan_brand_moves.py — DRY-RUN classifier + manifest builder for filing Joe's
scattered brand/content files into ~/BrandAssets.

Usage:
    python plan_brand_moves.py            # dry-run: prints candidates grouped by brand
    python plan_brand_moves.py --manifest # also writes a JSON manifest (still no moves)

NEVER moves files. It only classifies and proposes destinations. Review the
plan with Joe, then execute separately with a skip-on-collision mover that
appends to the same manifest for reversibility.

Ground rules baked in (see SKILL.md):
  - Touch ONLY brand/content files (strong signals). Leave dev projects,
    resumes, personal docs, installers, ISOs alone.
  - Leave scripts / loose JSON / working dirs at Home alone. Finished exports
    only. sm008_* finished podcast outputs ARE movable.
  - Never move BrandAssets itself.
"""
import re, json, sys
from pathlib import Path
from datetime import datetime
from collections import Counter

HOME = Path.home()
BA = HOME / "BrandAssets"
SCATTER = [HOME / "Downloads", HOME / "Desktop", HOME]

# Home working files/dirs to EXCLUDE (scripts, loose data, in-progress dirs).
HOME_EXCLUDE = {
    "si_ep030_captions.json", "si_ep030_sched_result.json", "si_ep030_schedule.py",
    "si_ep030_upload.py", "si_ep030_urls.json", "sm_ep04_captions.json",
    "sm_ep04_final_captions.json", "SM_Ep04_clips", "SM_Ep04_edu", "sm_tx_work",
    "Storage_Moguls_Transcripts",
    "joe_social_full.json", "joe_social_review_poc.json", "joe_social_v2.json",
}
# Home dirs that are NOT ours to walk into.
HOME_SKIP_DIRS = {
    "AppData", "OneDrive", "Documents", "Downloads", "Desktop", "Videos", "Music",
    "Contacts", "Favorites", "Links", "Searches", "Saved Games", "BrandAssets",
}


def brand_of(name: str):
    low = name.lower()
    if re.match(r"^si[_ ]", low) or "successful idiots" in low or "successful_idiots" in low:
        return "Successful-Idiots"
    if (re.match(r"^sm[_ ]", low) or low.startswith("sm ")
            or "storage moguls" in low or "storage_moguls" in low
            or re.match(r"^sm0\d\d", low)):
        return "Storage-Moguls"
    if (re.match(r"^jd[_ ]", low) or low.startswith("joedowns")
            or low.startswith("joe linkedin") or low.startswith("joe_social")):
        return "Joe-Downs"
    if "storpro" in low:
        return "StorPro"
    if low.startswith("belrose") or low.startswith("bel_"):
        return "Belrose"
    return None


def is_brand_file(path: Path):
    name = path.name
    low = name.lower()
    b = brand_of(name)
    if b:
        return b
    if low.startswith("storage100") or low.startswith("storage101"):
        return "Storage-Moguls"
    # episode promo/FB content with an Ep marker
    if re.search(r"\bep\.?\s*\d+", low) and any(
        k in low for k in ("facebook", "promo", "prerelease", "post release", "pre-release")
    ):
        return "Storage-Moguls"
    return None


def main():
    candidates = []  # (path, brand, kind)
    for loc in SCATTER:
        if not loc.exists():
            continue
        for entry in sorted(loc.iterdir()):
            if loc == HOME:
                if entry.name.startswith("."):
                    continue
                if entry.name in HOME_SKIP_DIRS:
                    continue
                if entry.name in HOME_EXCLUDE:
                    continue
                # skip loose scripts at Home
                if entry.suffix.lower() in (".py", ".js", ".ps1", ".ahk"):
                    continue
            b = is_brand_file(entry)
            if b:
                kind = "DIR" if entry.is_dir() else "file"
                candidates.append((str(entry), b, kind))

    by_brand = Counter(c[1] for c in candidates)
    print(f"Brand candidates: {len(candidates)}")
    for br, cnt in by_brand.most_common():
        print(f"  {br}: {cnt}")
    print("\n--- Listing (source only; destinations proposed manually per SKILL.md) ---")
    for p, b, k in candidates:
        pp = Path(p)
        print(f"[{b:18}] ({k}) {pp.parent.name}/{pp.name}")

    if "--manifest" in sys.argv:
        BA.joinpath("_manifests").mkdir(parents=True, exist_ok=True)
        out = BA / "_manifests" / f"cleanup_candidates_{datetime.now():%Y%m%d_%H%M%S}.json"
        out.write_text(json.dumps(
            [{"src": p, "brand": b, "kind": k} for p, b, k in candidates], indent=2
        ))
        print(f"\nCandidate manifest written: {out}")
        print("NOTE: still a DRY RUN. Map each src -> dest by hand, confirm with Joe, then move.")


if __name__ == "__main__":
    main()
