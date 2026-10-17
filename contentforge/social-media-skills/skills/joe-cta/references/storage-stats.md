# Verified self-storage stats bank (for Joe's CTAs)

Pull storage numbers from HERE before writing a script. Don't re-derive from memory, and never inflate a number for punch (Joe's hard rule). All figures below were verified against authoritative sources on **2026-06-24**. They're stable industry numbers, not quarterly-fresh — if a script needs a current-quarter figure, fetch it (see "How to verify" below) and add it here with a date.

## The numbers Joe can say on camera

| Stat | Verified value | Use it for | Source |
|---|---|---|---|
| Household penetration | **~1 in 10 / ~10% of U.S. households** rent a self-storage unit | the "surprising stat" hook (#3) | Wikipedia *Self storage*, cited |
| Ownership fragmentation | **~80% of facilities owned by individuals / small operators** | the "why now / opportunity" hook (#5) — this is Joe's REAL origin thesis | Wikipedia *Self storage*; matches soul.md "80% still owned by mom and pop" |
| Big-operator share | The 6 largest public operators (**4 REITs + U-Haul**) own/operate **~18%** of facilities | context for the fragmentation point | Wikipedia *Self storage*, cited |
| Facility count (US) | **~52,000–54,000 facilities** in the U.S. | scale/"this is a real market" framing | Wikipedia *Self storage* (both figures appear) |
| Rentable space (US) | **~1.9 billion sq ft** available (older cite: 236M sq ft rentable) | scale framing | Wikipedia *Self storage* |
| Recession resilience | Sector delivered **~5.1% total return in 2008** during the Great Recession; widely believed recession-resistant | the "storage stays / holds up in downturns" angle | Wikipedia *Self storage*, cited |
| Most common unit | **10x10** is the most common size (~16% of US distribution, as of 2015) | rarely needed; texture only | Wikipedia *Self storage* |

⚠️ **Phrasing the 2008 figure (Joe corrected Jun 2026):** "held up through 2008" is INSIDER SHORTHAND — a beginner doesn't know 2008 = the financial crisis (Joe asked "what happened in 2008?"). In beginner-facing shorts, either spell it out ("held up during the 2008 financial crisis, when almost everything else in real estate got hammered") or, better for a short, drop the date and keep the idea ("storage tends to hold up even when the economy doesn't"). Same rule for any year/ticker/term — see SKILL.md Factual Gate #5 (No insider shorthand).

## Stats that are WRONG — do not use

- ❌ **"1 in 3 Americans pays for storage"** and **"1 in 17 in 2000."** Inflated / engineered-looking. Joe rejected this (Jun 2026). The real number is ~1 in 10 households. An inflated-but-plausible stat is still a fabrication.
- ❌ **"Institutional buyers are pulling back RIGHT NOW."** Was solidly true in the 2023–2024 rate environment, but it's a present-tense market-timing claim that ages fast. Don't put it in Joe's mouth as "right now" unless confirmed for the current market. Safer: reframe onto the durable 80% mom-and-pop fragmentation fact (true regardless of the cycle).

## How to verify storage stats this session (verified path, Jun 2026)

Search engines blocked us: **Google and Bing both hit CAPTCHA / Cloudflare challenges** in the browser this session. The path that WORKED:

1. **`curl` with a desktop User-Agent** against an authoritative page returns clean HTML to parse — no bot wall:
   ```bash
   UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
   curl -s -L --max-time 25 -A "$UA" "https://en.wikipedia.org/wiki/Self_storage" -o page.html -w "HTTP %{http_code}\n"
   ```
2. **Strip tags + keyword-scan** with python (use `C:/Python313/python.exe` or `python3.13` on this host — the interpreter that has the libs). Scan for `households`, `1 in`, `%`, `REIT`, `occupancy`, `square feet`, `billion`.
3. **Watch for redirect-to-shell pages.** SpareFoot's stats URL returned HTTP 200 but redirected to a near-empty Twitter/nav shell (title "Twitter", ~2.9KB of real text). Neighbor.com 403'd; some StorageCafe stat URLs 404'd. Wikipedia *Self storage* is the reliable curl-able source with inline citations.
4. Clean up temp `.html` files afterward (`rm -f page.html`).

If you DO get a working web_search tool in a future session, prefer it for a current-quarter figure (occupancy, recent acquisition trend), then log the dated number in the table above.

## When a script needs a number you can't source this session
Cut the precise number, hook on the defensible direction instead (e.g. "more people rent storage every year, and it holds up when the economy doesn't"), and leave a `VERIFY` flag for Joe/team to drop the real figure in. Flagging beats guessing. Also note: "more people rent storage every year" is itself a soft trend claim — the rock-solid, always-safe angle is the **resilience** point (storage holds up in downturns) and the **80% mom-and-pop** fact.
