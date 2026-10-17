# LinkedIn Content Approval Pipeline — Reference

How generated LinkedIn batches move from draft to "marked done," and the technique
for building the weekly review doc. Established with Joe Downs, June 2026.

## The flow

```
generate batch  →  weekly Google Doc (TOC + sectioned articles)  →
Joe reviews + emails external partner  →  partner approves  →
Joe relays approval to agent  →  agent marks Notion (ONLY now)
```

## 🔒 The hard rule (Joe's directive)

**Do not touch Notion until Joe gives explicit, personal approval.** No tracker
checkboxes, no status changes, no page edits — nothing — until Joe says a piece is
approved. The agent's lane is: generate + build the Google Doc. Notion writes are
gated on the human go-ahead. Stated verbatim by Joe: "until then don't touch notion."

## Weekly doc conventions

- **Name:** `Week <ISO week>: <Mon dd>–<Sun dd, yyyy> — LinkedIn Articles`
  - Compute from today's date: `datetime.date.isocalendar()` gives the ISO week;
    Monday = `d - timedelta(days=iso_weekday-1)`, Sunday = Monday + 6 days.
  - Example for 2026-06-17 → `Week 25: Jun 15–Jun 21, 2026 — LinkedIn Articles`.
- **Layout:** TITLE (named style TITLE) → `Contents` (HEADING_2) clickable TOC of all
  articles → per article: HEADING_1 headline, italic gray theme label, blank line,
  full post body, then a **page break** before the next article (no trailing page
  break after the last).
- **Default privacy:** the new Doc is private to Joe's account. Offer to share
  (reader/commenter) and/or file into a Drive folder — don't assume either.

## Why a custom Docs-API script (not the CLI wrapper)

The `google-workspace` skill's CLI (`google_api.py docs ...`) only supports
`docs create` (title + optional plain body) and `docs append` (plain text). It does
**not** support:
- Named paragraph styles (TITLE / HEADING_1 / HEADING_2)
- Page breaks (`insertPageBreak`)
- Text styling (italic, color)
- Native sidebar **tabs** (`tabProperties` — newer Docs API feature; the wrapper
  doesn't expose it at all)

So the review doc is built by calling the **raw Google Docs API** directly with the
profile's existing OAuth token. This works because the token already carries the
`documents` + `drive` scopes from the full-Workspace auth.

### Technique (proven working)

1. Load creds from the profile token, build `docs` and `drive` services:
   ```python
   from google.oauth2.credentials import Credentials
   from googleapiclient.discovery import build
   TOKEN = r"C:/Users/<user>/AppData/Local/hermes/profiles/<profile>/google_token.json"
   creds = Credentials.from_authorized_user_file(TOKEN)
   docs  = build("docs", "v1", credentials=creds)
   drive = build("drive", "v3", credentials=creds)
   ```
2. `docs.documents().create({"title": ...})` → get `documentId`.
3. Build a list of `insertText` requests inserted **sequentially at a running index**
   starting at 1, tracking `(start, end, style)` ranges as you grow the index. For a
   page break, emit `{"insertPageBreak": {"location": {"index": index}}}` and advance
   index by 1 (a page break consumes one index position).
4. Apply styles in a second `batchUpdate`: `updateParagraphStyle` with
   `namedStyleType` for TITLE/HEADING_1/HEADING_2; `updateTextStyle` with
   `italic`/`foregroundColor` for the theme label.
5. `drive.files().get(fileId=..., fields="id,name,webViewLink")` for the share link.

The packaged runnable version is `scripts/create_review_doc.py`.

## Word (.docx) output variant — when Joe asks for "in Word" / "a doc to send"

Joe sometimes wants the review batch as a **Word .docx** he can email directly, not
a Google Doc (Jun 2026). When he says "build it in word", "put them in a doc for me
to send", or "make the font size good", produce a .docx with `python-docx` instead of
the Docs-API path above. Same content/layout philosophy, different container.

**Build technique (proven working in the joeagent profile):**
- The profile's bare `python` is the **Hermes venv and has NO pip** (`python -m pip`
  → "No module named pip"); the sandboxed `execute_code` interpreter is different
  again and also lacks `docx`. Do NOT fight this. Write the build script to a file,
  then run it with **`uv`** which provisions deps on the fly:
  ```bash
  cd /c/Users/somea/Downloads && uv run --with python-docx python _build_doc.py
  ```
- Save the .docx to **`C:\Users\<user>\Downloads\`** and hand it back as a
  `MEDIA:<path>` link.
- **"Make the font good"** = comfortable, legible body. Joe-approved settings:
  Normal style Calibri **12pt**, line spacing **1.15**, `space_after` 8pt; headline
  hooks **20pt** navy bold; section labels (LONG FORM / SHORT FORM) 11pt blue;
  title 24pt. Don't ship Word's 11pt default.
- Verify with `read_file` on the .docx (it auto-extracts to text) before reporting
  done — confirm every day, topic line, CTA, and signature landed.

### Call-aligned weekly batch layout (Joe's structure, Jun 2026)

When the batch maps to Joe's **weekly call schedule** (Mon = Storage 101 / DFI,
Tue = Deal Sourcing Call, Wed = Deep Dive / Mastery Call, Thu/Fri = lead-magnet),
each article carries extra context lines so whoever runs the calls sees the topic at
a glance. Per-article order:
1. **Day label** (e.g. `MONDAY — JUN 29`)
2. **Headline / hook**
3. **`Topic:`** — a PLAIN-language one-liner of what the post actually covers (Joe
   asked for this explicitly: "beside the hook name write the specific topic
   plainly"). The hook is the headline; the topic line is the literal subject.
4. **`Call alignment:`** — which call this post seeds.
5. Long form → CTA → signature → short form (X).

### CTA rule for call-aligned batches (overrides the generic soft-CTA menu)

For these batches EVERY post must close with one of two CTAs, **rotated** so the feed
isn't repetitive:
- **Free Storage 101 call** — "Storage 100 is free, and we go live every Monday
  night at 6pm ET on the Storage 101 call. Come join us. Register at
  storagemoguls.ai" — use on the teaching posts (NOI, rent roll).
- **Storage Moguls community FOMO** — "This is the kind of thing we dig into every
  week inside Storage Moguls. Come build with us at storagemoguls.ai, and you can
  always join our free Storage 101 call Mondays at 6pm ET." — use on sourcing /
  mindset / lead-magnet posts.
This replaces the doc's source "follow along / storagemoguls.ai" closes — rewrite
them. ("DM me" remains banned per SKILL.md.)

### Before reusing topics from an existing approved doc

If Joe points you at an existing "Joe Social Review" / approved doc and asks which
topics fit a new week, the posts there may already be published. **Ask which are
already live** before reusing — if one is, write a fresh post on that same call
topic rather than repeating it on the feed.

## Accessing the SM Content Tracker (the "fetch first" page) — USE THE NOTION MCP

The SKILL.md says to fetch the SM Content Tracker (`349cc74ebcf381ac816ef9238dbb191f`)
before generating. **Joe's Notion content lives in the Belrose Group workspace, and
the way this profile has always reached it is the Notion MCP server — use it FIRST,
do not reinvent access.** (Jun 2026: I burned a whole session claiming "no access,"
chasing curl/`ntn`/.env dead ends, until Joe corrected me — "we have access, you're
accessing it wrongly." He was right. The MCP path was available the entire time.)

**The proven path — just do this:**
```
mcp__Notion_notion_fetch(id="349cc74ebcf381ac816ef9238dbb191f")
```
Returns the full live page: all 56 topics across 11 themes, each with Format
(LinkedIn vs Video), Title/Topic, Hook Angle, DFI Module, and the Deck-Created /
Published checkboxes. Skip rows where both boxes are ✅. Use
`mcp__Notion_notion_search` to find other Belrose pages by title if you don't have
the id. The Hub databases (Knowledge DBs, Content Library) are reachable the same
way via `notion-query-data-sources` / `notion-fetch`.

**If the `mcp__Notion_*` tools genuinely aren't in your toolset this session**, don't
declare defeat from the chat tools alone — confirm the server state from the shell
first: `hermes mcp list` (look for Notion ✓ enabled) and `hermes mcp test Notion`
(should report "Connected" + "Tools discovered: 18"). If it tests connected, the
tools are reachable — try calling `mcp__Notion_notion_fetch` even if you didn't
notice it in the tool list. The config block lives at `mcp_servers.Notion` in
`profiles/joeagent/config.yaml` (url `https://mcp.notion.com/mcp`, `auth: oauth`,
`enabled: true`).

**Do NOT waste turns on these dead ends** (all confirmed non-working in this profile,
Jun 2026): Notion REST API via curl and the `ntn` CLI both need `NOTION_API_KEY`,
which is **not in the profile `.env`**, and `ntn` is **not installed**. The
remote/stealth browser is a fresh session **not logged into Belrose Group Notion**,
so the tracker URL just hits the sign-in wall. The MCP server is the answer — it
carries the OAuth, so none of the above is needed.

**Only if the MCP server is truly down** (test fails) fall back, in order: (1) Joe
pastes/exports the tracker into chat, or (2) the approved "Joe Social Review" Google
Doc as a verified topic pool. Don't lead with these — lead with the MCP fetch.

## Pitfalls

- **Track the SETTLED state across iterative planning turns — don't re-litigate
  decided days.** When Joe revises a weekly lineup over several messages (move Mon's
  topic to Tue, push X to next week, keep Thu, swap Fri…), maintain a running
  map of what's LOCKED vs OPEN and only work the open slots. Jun 2026: Joe gave
  precise day-by-day moves and I kept re-reading them wrong, re-proposing topics for
  days already fixed, and dumping huge candidate tables for closed slots — he called
  it out ("you seem to be losing context," "we only need Monday and Friday"). When
  only N slots are open, address exactly those N. Restate the locked lineup in one
  compact line, then ask only about the gaps. "Next Tuesday/Wednesday" from Joe means
  the FOLLOWING week, not next week's Tue/Wed — confirm if ambiguous, don't guess.
- **$HOME mis-resolves** in this profile's git-bash shell — always use absolute
  Windows paths (`C:/Users/<user>/...`) for the token and scripts.
- **`python` = Hermes venv, no pip; `execute_code` sandbox lacks `python-docx`.**
  For any .docx/.xlsx build, write a script file and run via `uv run --with <pkg>
  python <script>.py`. Don't `pip install` against the bare interpreter.
- **`PermissionError: [Errno 13]` on save = the .docx is OPEN in Word, not a code
  bug.** (Jun 2026: a rebuild failed this way mid-session.) Save to a `... v2.docx`
  filename (or ask Joe to close it) and re-run — don't debug the script. Common when
  iterating: Joe opens the first version to read it, then you try to overwrite it.
- **google-workspace setup.py is an older build** in the joeagent profile: it does
  NOT accept `--services` or `--format`. Use bare `--auth-url`, `--auth-code "<url>"`,
  `--check`. The default `--auth-url` already requests full scopes (Gmail r/s/m,
  Drive, Docs, Calendar, Sheets, Contacts), which is what enables the raw Docs API.
- Insert all text BEFORE styling, and compute style ranges off the same running
  index you insert with — otherwise offsets drift and styles land on wrong text.
