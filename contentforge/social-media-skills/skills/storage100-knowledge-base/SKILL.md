---
name: storage100-knowledge-base
description: "Turn Joe Downs' video/podcast TRANSCRIPTS into a structured KNOWLEDGE BASE for later book/ebook authoring — NOT social content. Trigger when asked to \"build the Storage 100 database/knowledge base\", \"get understanding from these transcripts\", \"make notes from each episode for a book\", \"two versions: as-is and simplified\", \"create the [series] knowledge base\", or any ask to extract durable understanding + book notes from a transcript corpus. Owns: (1) the reliable transcript↔video MATCHING technique (filenames are unreliable — match by the day/episode number SPOKEN inside the transcript, then content-verify), and (2) the per-episode OUTPUT FORMAT Joe specified (one Google Doc per episode: As-Is understanding + Simplified-with-glossary + Book Notes), processed in batches of 5. Distinct from the content skills (linkedin-posts, the podcast skills, brand-knowledge-hub) which produce PUBLISHABLE posts; this produces a study/authoring asset. Uses the google-workspace CLI for Drive/Docs."
---

# SKILL.md — Storage 100 Knowledge Base (transcript → understanding → book source)

**Owner:** Joe Downs  •  **Created:** June 2026 (Storage 100 transcript corpus → ebook project)
**Role:** Extract BULLETPROOF understanding from a transcript corpus and file it as a per-episode
knowledge base that a book/ebook will later be written from. This is comprehension + study notes,
**not** social copy.

---

## When this fires vs. other skills
- THIS skill: "build the knowledge base", "get understanding from the transcripts", "notes for a
  book", "as-is + simplified versions per episode". Output = study/authoring docs.
- NOT this skill: writing LinkedIn/IG/X/FB posts or captions (use the content skills), or filing
  publishable finished goods into Notion (`brand-knowledge-hub`).

---

## The two jobs this skill owns

### JOB 1 — Match transcripts to their videos (do this FIRST, get it bulletproof)
The Storage 100 Drive transcripts (`transcript N.txt`) are the **Storage 100 series only** (Days
1–106). The Boat & RV 100 series (69 videos) is a separate corpus, NOT in that folder.

**Hard-won rule: the FILENAME NUMBER IS NOT RELIABLE.** Example seen this session: `transcript 1.txt`
is actually **Day 106**; `transcript (1).txt` and `Transcript 104.sbv` are duplicate copies of the
same Day 104 recap. So:

1. Get the ordered video-title manifest. The fetcher's source of truth is
   `~/yt_playlist_manifest.json` (playlists → ordered videos with index, id, title). Every Storage
   100 title carries a **"Day N"** label → build `day → {title, playlist, video_id}`.
   - WARNING: "Day N" is NOT globally unique. Boat & RV (Days 1–68) and Storage 100 share day
     numbers. Filter the manifest to `Storage 100 - Section *` playlists when mapping Storage 100.
2. Download every transcript and read the FIRST ~900 chars. Joe almost always SAYS the day
   ("welcome to day 50 of the storage 100 series"). Parse it — handle BOTH digits ("day 50") and
   SPELLED numbers ("day nine", "day twenty one").
3. Content-verify: confirm the transcript's topic matches the matched title's topic (P&L, SBA, Google
   Maps, etc.). Spot-check a spread of mid-range episodes.
4. Resolve edge cases by CONTENT, not the spoken number:
   - Joe sometimes doesn't say the day → infer from topic (e.g. "how much money to get started" = Day 4).
   - Joe MISSPEAKS the day → trust the topic (e.g. one file says "day 100" but is Day 101 by content
     = tenant insurance programs).
   - Section RECAP episodes say "section X recap" not a day → map to the recap day for that section.
   - `.sbv` (timestamped subtitle) and `(1)` duplicates exist — strip `H:MM:SS.mmm,H:MM:SS.mmm`
     timestamps before parsing.
5. Coverage check: report days with NO transcript and days with MULTIPLE files. (This session: 105 of
   106 days covered; Day 41 missing; Day 104 had two duplicate files.)

Full mechanics, the word-number parser, edge-case resolutions, and the verified Day↔file table are in
`references/transcript-matching.md`.

### JOB 2 — Produce the per-episode knowledge-base Doc (Joe's specified format)
Per Joe (June 2026): a Google Drive folder `Storage100 Knowledge Base`, **one Doc per episode**,
processed in **batches of 5**. Each Doc has THREE parts:

- **PART A — As-Is Understanding** — bulletproof, COMPLETE capture of what Joe actually said.
  Purpose → core argument → every concept/number/example/nuance → verbatim quotable lines. Nothing
  dumbed down. This is the source of truth.
- **PART B — Simplified Version** — beginner-proof retelling. MUST OPEN WITH a **Key Terms /
  Definitions glossary** (define NOI, cash-on-cash, SBA 7(a), amortization, operating margin, etc.),
  then the episode in plain language, then any math walked step-by-step. Joe's words: the simpler
  version "should host definition of terms and anything that will make reading it easy."
- **PART C — Book Notes** — for the ebook: chapter role, reusable framework/spine, anchor stats to
  carry forward, strongest quotes, tone/voice notes, and **OPEN ITEMS TO VERIFY before print**.

The exact section scaffold (headers, ordering) is in `templates/episode-doc.txt`.

---

## Quality bar (bulletproof = these gates)
- **Faithful to what was said.** Capture Joe's exact figures and phrasing (e.g. "50–65% operating
  margins", "10% down", "$44,700", "~29.8% cash-on-cash") — do NOT round his words away.
- **Run the `writing-craft` gate** (load it): infer meaning from messy speech, paraphrase faithfully,
  parse cold, no invented facts. This is extraction — adding facts the source never stated is the
  cardinal sin.
- **Flag claims to verify, don't assert them as proven.** External stats Joe cites (e.g. a Forbes
  figure) and illustrative deals go under "open items to verify", not as established fact.
- **Storage truth (Joe's standing corrections):** month-to-month leasing is NORMAL/universal, never a
  risk. Joe's background = commercial RE syndications + distressed debt → storage; never residential
  landlord pains. No superlatives or invented specifics.

## Workflow checklist
- [ ] Confirm WHERE it lives + per-episode format with Joe before the first batch (he chose: Drive
      folder `Storage100 Knowledge Base`, one Doc/episode, both versions in the SAME doc).
- [ ] Confirm the section/day range. Section 1 = Days 1–15; "first batch of 5" = Days 1–5 chronological.
- [ ] Build/verify the Day↔file map (JOB 1) before extracting.
- [ ] Build Day 1 (or batch's first episode) yourself as the TEMPLATE; show Joe the structure; get
      sign-off BEFORE batching the rest. (He values reacting to the shape first.)
- [ ] Read each transcript IN FULL before writing its analysis. For long corpora, delegate one
      episode per subagent (isolated full-transcript read → structured output) to avoid context flood.
- [ ] Create one Google Doc per episode in the folder via `google-workspace` CLI.

---

## Tooling pitfalls (this host)
- **`docs create --body` / `docs append --text` FAIL on large content — "Argument list too long".**
  The doc body is passed as a CLI argument, so anything past ~a few KB (a full Part A/B/C episode doc
  is 20–50 KB) dies with `Argument list too long` and the CLI prints NOTHING (so a piped
  `json.loads` then throws `Expecting value: line 1 column 1`). Day 1 only worked because it was
  just under the limit. **FIX (proven):** create the doc with only the FIRST ~8 KB chunk as `--body`,
  then `docs append <doc_id> --text <chunk>` the REST in ~8 KB chunks. The ready-made batch builder is
  `scripts/make_docs.py` — point it at the kb/*.txt files + folder id and it creates each doc and
  appends in chunks. Do NOT try to pass a whole episode doc in one `--body`.
- **Calling google_api.py from a Python subprocess: use the ABSOLUTE venv python path, not bare
  `python`.** `subprocess.run(['python', ...])` resolves to a 3.11 interpreter that lacks
  `googleapiclient` → `ModuleNotFoundError: No module named 'googleapiclient'` (this happens even when
  the interactive terminal's `python` has the libs — subprocess does its own PATH resolution). FIX:
  invoke `C:/Users/<user>/AppData/Local/hermes/hermes-agent/venv/Scripts/python.exe` explicitly as the
  interpreter for google_api.py. That makes a Python batch wrapper (create+append+move loops over many
  docs) work reliably — you do NOT have to fall back to bash-only sequential calls.
- **Drive has no `move` subcommand.** To file created docs into the knowledge-base folder, reparent via
  the Drive API: load google_api.py as a module (`importlib`), call its `build_service('drive','v3')`,
  then `files().update(fileId=..., addParents=<folder>, removeParents=<current parents>)`. New docs are
  created at Drive ROOT by default, so this move step is required. `scripts/make_docs.py` shows both
  the chunked-append and the importlib service-build patterns.
- Each `google_api.py drive download` re-auths and is slow; bulk downloads (100+) blow the 180s
  foreground timeout. Run the download loop in the BACKGROUND, or chunk it; it's resumable if you skip
  files already on disk (`[ -s "$out" ]`).
- **Path translation:** files written via bash `/tmp/...` are NOT visible to Windows-native `python`
  (which sees `C:\Users\...\Temp\...`). Use a Windows-native working dir (e.g. `C:/Users/<user>/...`)
  for anything both bash and python touch.
- `google_api.py drive download` has no stdout mode; use `--output <path>`.
- **Subagent batching works well for this.** Delegating one episode per subagent (toolset `file`,
  read full transcript → write the 3-part doc to `kb/DayNN.txt`) produced strong, faithful output
  (5,000+ words each) without flooding the orchestrator context. Cap = 3 concurrent, so a batch of 5
  runs as 3 + 2. Tell each subagent NOT to attempt word counts via shell (they have no terminal) and
  NOT to create helper/temp files — just read + write the one output.

## Autonomous batch cadence (cron) — added June 2026
Joe asked to continue at **5 episodes every 30 minutes**, hands-off. Implemented as a recurring,
self-contained cron job that processes the next 5 unprocessed episodes each run.

State + helpers (live):
- **Drive folder** `Storage100 Knowledge Base` = `1v_A7h2PwLsuc_wOiT2-pMDQP4Ga9oyyu`.
- `~/sm_tx_work/queue.json` — 105 unique days in order (Day 41 has no transcript; Day 104 dedup'd to
  its .txt, dropping the .sbv).
- `~/sm_tx_work/kb/created_docs_log.json` — done-state map `day → {doc_id,title,url}`. **An episode
  is DONE only when logged here** (not just when kb/DayNN.txt exists).
- `scripts/storage100_next_batch.py` — prints JSON `{total,done,remaining,batch[]}`; batch = next
  `KB_BATCH` (default 5) undone episodes with day/file_id/local_txt/video_title. Returns the local
  transcript path so the cron never needs Drive to fetch (all 107 already in `~/sm_tx_work/downloads/`).
- `scripts/storage100_make_doc.py <day> "<title>" <local_txt>` — the production doc creator: chunked
  create+append (8 KB), reparents to the folder via Drive API, logs to created_docs_log.json. Prints
  `DOC_OK <day> <id>` or `CREATE_FAIL`/`APPEND_FAIL`. **Idempotent** — a logged day is skipped by the
  batch helper, so re-running is safe.
- Cron job: name `Storage100 KB — 5 episodes / 30 min`, id `733280cd598a`, schedule `every 30m`,
  toolsets `terminal,file`, deliver `origin`. Its prompt = the batch workflow below + the locked
  format + quality rules; it self-terminates output with `[SILENT]` when remaining=0.

Cron run flow: next_batch → per day read FULL local_txt → write kb/DayNN.txt in locked format →
run make_doc per day → re-run next_batch for the updated count → short Joe-voice report + folder link.

**Pitfall seen once:** a manual test run wrote all 5 analyses but its session ended before the
make_doc calls finished. Because make_doc is idempotent, the fix is trivial — let the next run finish
them, or run make_doc manually on any kb/DayNN.txt that has no entry in created_docs_log.json. Don't
re-generate analyses that already exist on disk.

**Cleanup note:** the old `Storage Moguls transcript auto-retry` cron (was id d8e923a6edc2) became
obsolete once all transcripts were in Drive — removed it. Watch for stale companion crons like that.

## Related
- `google-workspace` (Drive/Docs CLI), `writing-craft` (quality gate), `brand-knowledge-hub`
  (Notion finished goods — different output target), `content-tracker` (status tracking).
