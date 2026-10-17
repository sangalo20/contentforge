# Transcript ↔ Video matching — mechanics & verified results

## Corpus facts (Storage 100, June 2026)
- Drive folder `10KsNxYusHadIskP9gOh1mOHFhCDPaNqf` = **106 transcript files**, **Storage 100 series ONLY**.
- Manifest of all videos: `~/yt_playlist_manifest.json` — 8 playlists, 175 videos total:
  - Boat & RV 100 (69) — separate corpus, NOT in the transcripts folder.
  - Storage 100 Sections 1–7 (106). Section 1 = Days 1–15 (15 videos).
- 105 of 106 Storage 100 days are covered by a transcript. **Day 41 has NO transcript** (the one gap).
- **Day 104 has TWO files**: `Transcript 104.sbv` + `transcript (1).txt` — duplicate copies of the
  Section 7 recap ("How to Grow Revenue and Optimize... Complete Strategy Recap").

## Why filenames can't be trusted
`transcript 1.txt` is actually **Day 106** ("final episode of the Storage 100"). `transcript 50.txt`
IS Day 50; `transcript 100.txt` IS Day 100. The numbering is inconsistent — so match by the day Joe
SPEAKS inside the file, then content-verify.

## Matching algorithm
1. Build `day → {title, playlist, video_id}` from manifest, FILTERED to `Storage 100 - Section *`
   playlists (Boat & RV shares day numbers — don't let it collide).
2. Download all transcripts. Read first ~900 chars (strip `\d:\d\d:\d\d\.\d+,\d:\d\d:\d\d\.\d+`
   sbv timestamps first).
3. Detect day:
   - digits: regex `\bday\s+(\d{1,3})\b`
   - spelled: `\bday\s+(one|two|...|ninety|hundred| |-){1,5}` → convert words→int.
     Word map: one..nineteen, twenty/thirty/.../ninety, hundred (×100). Joe says "day nine",
     "day twenty one", "day one hundred six".
4. Content-verify against the matched title's topic; spot-check a spread (e.g. Days 22, 35, 50, 65,
   88, 93 all confirmed clean this session).

## Edge cases resolved this session (resolve by CONTENT, not the spoken number)
| File | Why ambiguous | Resolution |
|---|---|---|
| `transcript 4.txt` | Joe didn't say the day | topic "how much money to get started" = **Day 4** |
| `transcript 90.txt` | "section six recap" no day | Section 6 recap = **Day 90** |
| `Transcript 76.` | "section five recap" no day | Section 5 recap = **Day 76** |
| `transcript 100.txt` | — | says day 100, topic online-vs-phone = **Day 100** |
| `transcript 101.txt` | MISSPOKE "day 100" | topic tenant-insurance-programs = **Day 101** |
| `Transcript 104.sbv` | St-Patrick's live, no day | Section 7 recap = **Day 104** (duplicate) |
| `transcript (1).txt` | identical to 104.sbv | Section 7 recap = **Day 104** (duplicate) |

## Tooling gotchas (see SKILL.md too)
- `google_api.py` needs the terminal shell's `python` (has `googleapiclient`). A
  `subprocess.run(['python',...])` from execute_code uses a different 3.11 interpreter →
  `ModuleNotFoundError: No module named 'googleapiclient'`. Loop CLI calls in bash instead.
- Bulk downloads are slow (re-auth per call) → run in background; resumable via `[ -s "$out" ]` skip.
- Use a Windows-native working dir for files both bash and Windows-`python` must read (`/tmp` is
  invisible to Windows python).
- Listing: `google_api.py drive search "'<FOLDER_ID>' in parents" --raw-query --max 300`.
- Download: `google_api.py drive download <file_id> --output <path>` (no stdout mode).

## Section/day reference (Storage 100)
Section 1 = Days 1–15 · S2 Sourcing · S3 Evaluating/DD · S4 Underwriting · S5 Financing ·
S6 Transitioning/Managing · S7 Growing Revenue/Optimization. Days run 1→106 chronologically; a
"batch of 5" starts at the lowest unprocessed day in the section being worked.
