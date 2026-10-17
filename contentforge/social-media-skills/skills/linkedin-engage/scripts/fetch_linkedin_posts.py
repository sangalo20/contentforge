#!/usr/bin/env python
"""fetch_linkedin_posts.py — Read LinkedIn posts from Joe's real Chrome session via CDP.

Connects (does NOT launch) to a Chrome already running with remote debugging on
port 9222, using Joe's dedicated automation profile that's logged into LinkedIn.
This is the browser-assisted, same-machine/same-IP, real-login path the
linkedin-engage skill requires — no cloud browser, no new-device security flag.

It NEVER logs in and NEVER posts/comments. It only reads post content so the
agent can draft comments. Joe posts approved comments himself.

Two modes:
  1. Search by keyword:
       python fetch_linkedin_posts.py --search "self storage investing" --max 8
  2. Fetch specific post/profile URLs:
       python fetch_linkedin_posts.py --urls https://linkedin.com/posts/... ...

Prints JSON to stdout: a list of {author, role, url, text}.
If Chrome isn't reachable on 9222, exits with a clear message telling Joe to
launch via the "LinkedIn Automation" shortcut first.

Run with system Python that has playwright:  C:/Python313/python.exe
"""
import argparse, json, sys, time, urllib.parse, urllib.request

CDP_URL = "http://localhost:9222"


def cdp_alive():
    try:
        with urllib.request.urlopen(CDP_URL + "/json/version", timeout=3) as r:
            return json.load(r)
    except Exception:
        return None


def _parse_post(txt, href, page_url):
    """Split a LinkedIn post's inner_text into author, role, and body.

    Layout (Jun 2026): 'Feed post' / author / [connection degree] / [role headline] /
    'Nh • ...' timestamp / 'Follow' / <body lines...>
    """
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    # drop the leading "Feed post" marker
    if lines and lines[0].lower() == "feed post":
        lines = lines[1:]
    author = lines[0] if lines else ""
    role = ""
    body_start = 1
    # role = first headline-ish line before the body; skip degree/time/Follow noise
    for j in range(1, min(len(lines), 7)):
        l = lines[j]
        low = l.lower()
        if low.startswith(("•", "follow", "+ follow")) or "• " in l and any(
                u in low for u in ("h •", "d •", "w •", "m •", "min", "now", "edited")):
            continue
        if low in ("follow", "• 1st", "• 2nd", "• 3rd", "• 3rd+", "1st", "2nd", "3rd", "3rd+"):
            continue
        # a real headline is longish and not a timestamp
        if len(l) > 12 and not l.endswith("•") and "ago" not in low:
            role = l
            break
    # body = everything after the last "Follow"
    body_idx = None
    for j, l in enumerate(lines):
        if l.lower() in ("follow", "+ follow"):
            body_idx = j + 1
    if body_idx is None:
        body_idx = body_start
    body = "\n".join(lines[body_idx:body_idx + 30]).strip()
    is_company = bool(href and "/company/" in href)
    if is_company:
        role = role or "Company page"
    return {"author": author, "role": role,
            "url": href.split("?")[0] if href else page_url,
            "text": body or "\n".join(lines[:25])}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--search", help="keyword to search LinkedIn content for")
    ap.add_argument("--urls", nargs="*", help="specific post/profile URLs to read")
    ap.add_argument("--max", type=int, default=10, help="max posts to return (cap 15)")
    ap.add_argument("--port", type=int, default=9222)
    args = ap.parse_args()

    global CDP_URL
    CDP_URL = f"http://localhost:{args.port}"

    if not args.search and not args.urls:
        sys.exit("Provide --search <kw> or --urls <url...>")

    ver = cdp_alive()
    if not ver:
        sys.exit(
            "Chrome debug port not reachable on %s.\n"
            "Launch Chrome via the 'LinkedIn Automation' shortcut (it opens Chrome\n"
            "with --remote-debugging-port and Joe's automation profile), make sure\n"
            "you're logged into LinkedIn in that window, then re-run." % CDP_URL
        )

    from playwright.sync_api import sync_playwright

    cap = min(args.max, 15)
    results = []

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(CDP_URL)
        ctx = browser.contexts[0] if browser.contexts else browser.new_context()
        page = ctx.new_page()

        # safety: confirm we're logged in (no /login redirect)
        page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        if "login" in page.url or "/uas/login" in page.url:
            print(json.dumps({"error": "NOT_LOGGED_IN",
                              "detail": "Automation profile isn't logged into LinkedIn. Log in once in that Chrome window, then re-run."}))
            page.close(); return

        if args.search:
            q = urllib.parse.quote(args.search)
            page.goto(f"https://www.linkedin.com/search/results/content/?keywords={q}&sortBy=%22date_posted%22",
                      wait_until="domcontentloaded", timeout=30000)
            time.sleep(4)
            # scroll to load posts
            for _ in range(5):
                page.mouse.wheel(0, 3000); time.sleep(1.5)
            # LinkedIn uses obfuscated classes; posts live in div[componentkey]
            # containers and start with a "Feed post" marker. (selector verified Jun 2026)
            loc = page.locator("div[componentkey]")
            n = loc.count()
            seen = set()
            for i in range(n):
                node = loc.nth(i)
                try:
                    txt = node.inner_text(timeout=1500).strip()
                except Exception:
                    continue
                if "Feed post" not in txt or len(txt) < 120:
                    continue
                key = txt[:60]
                if key in seen:
                    continue
                seen.add(key)
                # author profile/company link
                try:
                    href = node.locator('a[href*="/in/"], a[href*="/company/"]').first.get_attribute("href", timeout=800)
                except Exception:
                    href = None
                parsed = _parse_post(txt, href, page.url)
                results.append(parsed)
                if len(results) >= cap:
                    break

        if args.urls:
            for u in args.urls[:cap]:
                try:
                    page.goto(u, wait_until="domcontentloaded", timeout=30000)
                    time.sleep(2)
                    body = page.locator("div.feed-shared-update-v2, main").first
                    txt = body.inner_text(timeout=4000).strip()
                    lines = [l.strip() for l in txt.splitlines() if l.strip()]
                    results.append({"author": lines[0] if lines else "",
                                    "role": lines[1] if len(lines) > 1 else "",
                                    "url": u, "text": "\n".join(lines[:25])})
                except Exception as e:
                    results.append({"url": u, "error": str(e)})

        page.close()

    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
