---
name: brand-asset-organization
description: Clean up, file, and standard-name Joe Downs' brand/content files scattered across the machine (Downloads, Desktop, Home) INTO the canonical BrandAssets library. Trigger on asks like "clean up my files", "organize the posters/content", "everything is everywhere, sort it", "file this into the right brand folder", "give all posters a proper naming system", or any request to tidy brand assets. Owns the SAFE filing procedure (classify by brand → build a reversible manifest → confirm → move, never overwrite) and the cross-brand file-naming convention. Companion to brand-poster-design (which OWNS poster creation + naming at generation time); this skill files EXISTING scattered assets and enforces the same convention retroactively.
---

# Brand Asset Organization

Filing scattered brand/content files into Joe's canonical asset library and enforcing one naming system across all brands. This is the CLEANUP/FILING class of task — distinct from `brand-poster-design` (creation) and `content-tracker` (status).

## Non-negotiable ground rules (learned from Joe)

1. **`~/BrandAssets/` is the SINGLE source of truth and must NOT be moved.** It is wired into live workflows — `_scripts/` (Cloudinary uploader `upload_jd_posters.py`), `_remotion/` (video render), `_manifests/`, `_source-images/`, and the SI `_si_base.css` spine. Moving it or renaming it breaks scripts, cron jobs, and manifests. If Joe asks for a "working folder in Documents," DO NOT physically move BrandAssets — keep it in place and drop a Documents shortcut pointing to it (his confirmed preference).
2. **Touch ONLY brand/content files.** Leave dev projects, resumes, personal docs, installers, ISOs, Obsidian vault, etc. exactly where they are. When Joe says "clean up," he means brand/content ONLY unless he explicitly says otherwise — confirm scope before acting.
3. **Leave scripts, loose JSON, and working dirs at Home alone.** Files like `si_ep030_*.py`, `joe_social_*.json`, `sm_ep04_captions.json`, and in-progress working dirs (`SM_Ep04_clips`, `sm_tx_work`, transcripts) may be wired into live workflows. Move FINISHED content/exports only (posters, videos, PDFs, docs, audio, image sets). Finished podcast outputs like `sm008_blog/shownotes/transcript` ARE movable.
4. **Never overwrite.** On name collision, skip or add a suffix. Log every move to a manifest for reversibility.
5. **Confirm the plan before executing.** Build the full move-plan, show it grouped by brand, then wait for explicit go. Do not move files as soon as a plan exists (Joe's "a plan is not permission to act" rule).

## Canonical structure

`~/BrandAssets/<Brand>/<Platform>/...` where:
- Brands: `Successful-Idiots`, `Storage-Moguls`, `Joe-Downs`, `StorPro`, `Belrose`
- Platform subfolders: `LinkedIn`, `Facebook`, `Instagram`, `X`, `TikTok`, plus content buckets like `Podcast`, `Episodes`, `Education`, `YouTube`
- Library-level: `_scripts`, `_remotion`, `_manifests`, `_source-images`, `_source` (leading underscore = infra, not content)

## Naming convention (enforce retroactively AND going forward)

```
{BRAND}_{Platform}_Poster_{Ep##|Topic}_{slug}_v{N}.{ext}
```
- BRAND prefix: `SM` (Storage Moguls), `SI` (Successful Idiots), `JD` (Joe Downs), `SP` (StorPro), `BEL` (Belrose)
- Non-poster assets follow the same spine with the type in place of `Poster`, e.g. `SM_Podcast_Ep001_short-cinematic_v1.mp4`, `JD_LinkedIn_posts_2026-W27.docx`, `SP_Ad_carousel-3_v1.jpg`, `SM_Education_Storage101_magnet.pdf`.
- `__story.png` suffix marks the 9:16 story crop of a poster (existing convention — preserve it).
- Slugs are lowercase-hyphenated and describe the content, not the file's origin.
- `brand-poster-design` is the authority for poster naming at creation time; keep this skill's convention identical to it so retroactive filing and new creation agree.

## Safe filing procedure

1. **Inventory** the three scatter zones: `~/Downloads`, `~/Desktop`, `~` (top-level only for Home — do NOT recurse into dev projects). List folders as units.
2. **Classify** by STRONG brand signals only (avoid false positives):
   - prefix match: `^si[_ ]`, `^sm[_ ]`, `^jd[_ ]`, `storpro`, `belrose`
   - name contains a brand's full name / podcast name
   - episode markers (`Ep\d+`, `Ep. \d+`) combined with promo/facebook/prerelease keywords → route to the brand's podcast/episode bucket
   - `storage100`/`storage101` educational magnets → Storage-Moguls/Education
   - Generic-named files with NO brand marker (e.g. `Promo video 2.mp4`) → DO NOT touch; ambiguous.
3. **Build a manifest** (`src → dest`, new name, note) and write it to `~/BrandAssets/_manifests/cleanup_move_plan_<timestamp>.json`. Verify every source exists before presenting.
4. **Show the plan** grouped by brand with counts; call out duplicates and anything held aside as ambiguous.
5. **On explicit go**, execute with a move that skips (never overwrites) on collision, appending to the manifest as it goes so the operation is reversible.
6. **Add a Documents shortcut** to BrandAssets (do not move the real folder) and, if new, a naming-convention README in BrandAssets root.
7. **Report**: confirm nothing non-brand was touched; summarize moves per brand.

See `scripts/plan_brand_moves.py` for a starter classifier + manifest builder (dry-run first).

## Pitfalls

- Don't classify on weak signals (a stray "sm" substring). Require a prefix/word-boundary match.
- Episode folders often exist in MANY versions (`SI_Ep016`, `_v3`, `_v4`, `_v6`, `_v7`, `_final`) — move each as its own subfolder under `<Brand>/Episodes/`, don't merge or dedupe without asking.
- `(1)`-style OS-duplicate copies: keep but flag as `-dup` in the note; let Joe decide on deletion (he did NOT authorize deletion — filing only, unless he says so).
- Confirm the Documents-vs-BrandAssets tension EVERY time someone asks for a "working folder in Documents": the answer is shortcut, not move.
