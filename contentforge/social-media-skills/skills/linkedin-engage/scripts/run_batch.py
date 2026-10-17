#!/usr/bin/env python
"""run_batch.py — One-call candidate gather for the linkedin-engage skill.

Does the MECHANICAL half of an engagement run in a single command:
  1. Confirms Chrome's debug port is reachable (else tells Joe to launch the shortcut).
  2. Runs fetch_linkedin_posts.py across Joe's standard theme search terms.
  3. Pools, de-duplicates (by author+first line), and drops obvious non-candidates
     (comments-off notices, pure ad markers).
  4. Prints a single pooled JSON list of {author, role, url, text} to stdout.

The agent then does the JUDGMENT half: filter to the best 10-15, draft a comment
per post in Joe's voice (see SKILL.md voice rules), write the items JSON, and call
build_engage_doc.py. Nothing here drafts or posts.

Usage:
  C:/Python313/python.exe run_batch.py                 # default theme spread, ~3 per term
  C:/Python313/python.exe run_batch.py --per 4         # more per term
  C:/Python313/python.exe run_batch.py --terms "self storage investing" "deal flow"
"""
import argparse, json, subprocess, sys, urllib.request, os

PORT = 9222
PYEXE = sys.executable  # whichever python launched this (should be C:/Python313)
HERE = os.path.dirname(os.path.abspath(__file__))
FETCH = os.path.join(HERE, "fetch_linkedin_posts.py")

# Default spread across Joe's six content themes / ICP segments.
DEFAULT_TERMS = [
    "self storage investing",
    "self storage acquisition",
    "real estate syndication",
    "commercial real estate underwriting",
    "passive real estate investing",
    "real estate partnership",
]

# lines that mean "skip this one" (engagement impossible or pure spam)
SKIP_MARKERS = (
    "comments have been turned off",
    "comments on this post have been limited",
)


def port_alive():
    try:
        with urllib.request.urlopen(f"http://localhost:{PORT}/json/version", timeout=3):
            return True
    except Exception:
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per", type=int, default=3, help="max posts to pull per search term")
    ap.add_argument("--terms", nargs="*", help="override the default theme search terms")
    args = ap.parse_args()

    if not port_alive():
        print(json.dumps({"error": "PORT_DOWN",
            "detail": "Chrome debug port 9222 unreachable. Tell Joe to double-click the "
                      "'LinkedIn Automation' shortcut on his Desktop and confirm he's logged "
                      "into LinkedIn, then re-run."}))
        sys.exit(2)

    terms = args.terms or DEFAULT_TERMS
    pooled = []
    seen = set()
    for term in terms:
        try:
            out = subprocess.run(
                [PYEXE, FETCH, "--search", term, "--max", str(args.per)],
                capture_output=True, text=True, timeout=180)
        except subprocess.TimeoutExpired:
            print(f"# timeout on term: {term}", file=sys.stderr)
            continue
        try:
            items = json.loads(out.stdout or "[]")
        except json.JSONDecodeError:
            print(f"# bad JSON on term: {term}\n{out.stdout[:200]}", file=sys.stderr)
            continue
        if isinstance(items, dict) and items.get("error"):
            print(json.dumps(items)); sys.exit(2)  # NOT_LOGGED_IN etc.
        for it in items:
            text = (it.get("text") or "")
            low = text.lower()
            if any(m in low for m in SKIP_MARKERS):
                continue
            key = (it.get("author", ""), text[:60])
            if key in seen:
                continue
            seen.add(key)
            it["_term"] = term
            pooled.append(it)

    print(json.dumps(pooled, indent=2, ensure_ascii=False))
    print(f"\n# pooled {len(pooled)} unique candidates across {len(terms)} terms", file=sys.stderr)


if __name__ == "__main__":
    main()
