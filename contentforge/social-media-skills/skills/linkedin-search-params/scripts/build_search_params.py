#!/usr/bin/env python
"""build_search_params.py — Generate targeted LinkedIn search URLs from Joe's KB.

Turns brand + audience segment + location into ready-to-run People and Content
search URLs, replacing broad keyword searches with narrow, ICP-targeted ones.

People search = find investors/connections (location-filtered via geoUrn).
Content search = find posts to engage (recency-sorted, post-language phrasing).

Usage:
  C:/Python313/python.exe build_search_params.py --brand storage_moguls --locations US,TX,FL --out params.json
  C:/Python313/python.exe build_search_params.py --brand all
  C:/Python313/python.exe build_search_params.py --brand belrose --segments investors,brokers --locations TX

Output: JSON list of {brand, segment, kind, location, keywords, url} (also printed).
URLs feed linkedin-engage (fetch_linkedin_posts.py / run_batch.py).
All facts (geoUrn IDs, URL shapes) verified against live LinkedIn Jun 2026.
"""
import argparse, json, sys, urllib.parse

# Verified geoUrn IDs (state/national reliable; metros unreliable — see SKILL.md)
GEO = {
    "US": ("United States", "103644278"),
    "TX": ("Texas", "102748797"),
    "FL": ("Florida", "101318387"),
    "CA": ("California", "102095887"),
    "NY": ("New York", "102571732"),
    "GA": ("Georgia", "103266556"),
    "AZ": ("Arizona", "102865756"),
    "TN": ("Tennessee", "101730253"),
    "NC": ("North Carolina", "103255397"),
    "CO": ("Colorado", "105763813"),
}

# PRIORITY MARKETS — Joe wants USA-mostly, weighted to where storage concentrates
# (Sun Belt growth states + Joe's home market NY). Use --locations PRIORITY to
# expand to this set, or --locations US for pure national. (June 2026 — confirm
# the exact states where Belrose actually HAS storage and adjust this list.)
PRIORITY_MARKETS = ["TX", "FL", "GA", "AZ", "TN", "NC", "CO", "NY"]

# segment -> (people_keywords[], content_keywords[])
SEGMENTS = {
    "operators": (["self storage operator", "self storage owner", "storage facility owner"],
                  ["self storage operations", "storage NOI", "storage occupancy"]),
    "investors": (["self storage investor", "storage acquisitions", "value-add storage"],
                  ["self storage acquisition", "storage underwriting", "buying self storage"]),
    "aspiring": (["transitioning to self storage", "aspiring real estate investor self storage"],
                 ["first self storage deal", "how to invest in self storage"]),
    "syndicators": (["real estate syndicator", "GP capital raiser", "multifamily sponsor"],
                    ["real estate syndication", "raising capital deal", "LP investors"]),
    "passive_lps": (["accredited investor", "passive real estate investor", "LP real estate"],
                    ["passive income real estate", "accredited investor opportunities"]),
    "brokers_lenders": (["self storage broker", "commercial real estate broker", "commercial lender"],
                        ["self storage for sale", "storage listing", "bridge loan storage"]),
    "partnership": (["founder", "entrepreneur operator", "business partner"],
                    ["business partnership", "Who Not How", "delegation leverage", "AI for operators"]),
    # --- WIDER MARKET (June 2026, Joe's "meet them at the pain" expansion) ---
    # Circle 3: pain-first / vehicle-agnostic. People search keys off HEADLINE titles;
    # content search keys off the PAIN language a post would contain.
    "tax_burdened": (["physician", "dentist", "attorney", "software engineer",
                      "corporate executive", "finance professional"],
                     ["tax advantaged investing", "how to lower my taxes", "reduce my tax bill",
                      "alternative investments", "passive income real estate"]),
    "freedom_seekers": (["corporate executive", "sales professional", "engineering manager",
                         "consultant"],
                        ["escape the 9 to 5", "financial freedom", "passive income ideas",
                         "build wealth", "quit my job", "retire early"]),
    "residential_investors": (["real estate investor", "landlord", "house flipper",
                               "short term rental host", "real estate agent"],
                              ["how to flip a house", "BRRRR method", "rental property investing",
                               "diversify out of residential", "1031 exchange"]),
    "aspiring_owners": (["small business owner", "franchise owner", "franchisee", "entrepreneur"],
                        ["buy a business", "best franchises to own", "own a business",
                         "buy a franchise", "business ownership"]),
}

# PAIN SIGNALS — the LANGUAGE people use when feeling the pain (NOT "pain" itself).
# These are CONTENT-search / comment-mining phrases: find people venting the
# complaint, then meet them with "there's a better vehicle." (Joe, June 2026:
# "it's not likely we get someone saying 'pain' — they'll say 'the market feels
# saturated'..."). Emitted as content searches, recency-sorted.
PAIN_SIGNALS = {
    "tax_pain": ["another tax bill", "tired of paying taxes", "writing checks to the IRS",
                 "need a tax shelter", "W2 income taxes"],
    "job_freedom_pain": ["burned out", "golden handcuffs", "Sunday scaries", "rat race",
                         "trading time for money", "want to fire my boss"],
    "residential_fatigue": ["the market feels saturated", "deals don't pencil",
                            "cap rates compressed", "tired of tenants and toilets",
                            "can't find deals that cash flow", "flipping is getting harder"],
    "ownership_drive": ["want to be my own boss", "building someone else's dream",
                        "want to own something", "bet on myself"],
    "wealth_searching": ["best way to invest 100k", "what to do with my money",
                         "how the wealthy invest", "looking for passive income",
                         "diversify my portfolio"],
}

# brand -> pain-signal sets to also emit (content searches)
BRAND_PAINS = {
    "storage_moguls": ["tax_pain", "job_freedom_pain", "residential_fatigue",
                       "ownership_drive", "wealth_searching"],
    # Belrose = capital end: HNW tax burden + scaled residential investor going passive/bigger.
    # NO wealth_searching (too entry-level for LPs/GP partners).
    "belrose": ["tax_pain", "residential_fatigue"],
    "successful_idiots": ["job_freedom_pain", "ownership_drive"],
}

# INTENT SIGNALS — entry states BEYOND complaint (Joe, June 2026: "it might not be
# someone complaining — it could be someone searching, someone who found a new type
# of investment we want to introduce to storage, someone looking for an area to
# invest, or a person with a job looking to start small and build"). Forward-leaning
# people already in motion. Content-search / comment-mining phrases.
INTENT_SIGNALS = {
    # exploring/researching — curious, no frustration yet
    "explorers": ["new to investing", "researching real estate", "where should I invest",
                  "is real estate a good investment", "thinking about getting into real estate",
                  "how to start investing"],
    # adjacent-asset adopter — already acted on a NEW alternative; introduce storage laterally
    "adjacent_adopters": ["got into syndications", "first syndication deal", "REIT investor",
                          "diversifying into alternatives", "alternative investments",
                          "passive real estate fund", "invested in crypto now looking"],
    # market/area scout — looking for WHERE to invest
    "market_scouts": ["best markets to invest", "out of state investing",
                      "best cities for cash flow", "emerging real estate markets",
                      "where to invest in real estate"],
    # start-small builder — employed, wants to begin and build over time
    "start_small_builders": ["side hustle", "start investing with little money",
                             "investing while working full time", "house hacking",
                             "start small scale up", "first investment property"],
    # --- SUCCESSFUL IDIOTS-specific (kitchen-table / AI / entrepreneur-in-waiting) ---
    # SI is NOT storage. These map SI's three core audience beliefs into search language.
    "si_idea_waiting": ["have an idea but haven't started", "want to start a business",
                        "thinking about a side business", "someday I'll start my own thing"],
    "si_small_operator": ["marketing for small business", "competing with big companies",
                         "small business growth", "do more with less small business"],
    "si_ai_curious": ["AI for small business", "automate my business",
                     "AI tools for entrepreneurs", "use AI to save time", "buy back my time"],
}

# brand -> intent-signal sets to also emit (content searches)
BRAND_INTENTS = {
    "storage_moguls": ["explorers", "adjacent_adopters", "market_scouts", "start_small_builders"],
    # Belrose = capital end only: already-in-alternatives + scouting where to deploy.
    "belrose": ["adjacent_adopters", "market_scouts"],
    # SI = its own kitchen-table doors + the cross-over start-small / explorer states.
    "successful_idiots": ["si_idea_waiting", "si_small_operator", "si_ai_curious",
                          "start_small_builders", "explorers"],
}

# brand -> default segments
BRANDS = {
    # SM now spans the in-market core PLUS the wider pain-first / RE-adjacent market.
    "storage_moguls": ["aspiring", "investors", "syndicators", "passive_lps",
                        "tax_burdened", "freedom_seekers", "residential_investors",
                        "aspiring_owners"],
    "belrose": ["passive_lps", "investors", "operators", "brokers_lenders", "tax_burdened"],
    "successful_idiots": ["partnership", "freedom_seekers", "aspiring_owners"],
}


# Beginner / no-capital exclusion appended to every PEOPLE search (Joe, June 2026:
# results were pulling "beginners in life" — students/interns/entry-level with no
# means). LinkedIn keyword field supports boolean NOT. We keep "aspiring" (an
# aspiring STORAGE investor with a career/capital is valid) — we only cut the
# truly capital-less / not-yet-in-career.
BEGINNER_EXCLUDE = 'NOT student NOT intern NOT "entry level" NOT "recent graduate" NOT undergraduate'


def people_url(kw, geo_id):
    base = f'"{kw}"' if " " in kw else kw
    q = urllib.parse.quote(f"{base} {BEGINNER_EXCLUDE}")
    geo = urllib.parse.quote(json.dumps([geo_id]))
    return (f"https://www.linkedin.com/search/results/people/?keywords={q}"
            f"&geoUrn={geo}&origin=FACETED_SEARCH")


def content_url(kw):
    q = urllib.parse.quote(f'"{kw}"' if " " in kw else kw)
    return (f"https://www.linkedin.com/search/results/content/?keywords={q}"
            f'&sortBy=%22date_posted%22')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", default="all",
                    choices=["all", "storage_moguls", "belrose", "successful_idiots"])
    ap.add_argument("--locations", default="US",
                    help="comma list of geo keys (US,TX,FL,CA,NY,GA,AZ,TN,NC,CO), or "
                         "PRIORITY for the storage-weighted market set. Default US = "
                         "national. Use PRIORITY to weight toward storage markets.")
    ap.add_argument("--segments", default=None,
                    help="comma list to override the brand's default segments")
    ap.add_argument("--out", default=None, help="path to write the JSON pack")
    args = ap.parse_args()

    brands = list(BRANDS) if args.brand == "all" else [args.brand]
    # Expand the PRIORITY keyword into the storage-weighted market set.
    raw = [l.strip().upper() for l in args.locations.split(",") if l.strip()]
    loc_keys = []
    for l in raw:
        if l == "PRIORITY":
            loc_keys.extend(PRIORITY_MARKETS)
        else:
            loc_keys.append(l)
    # de-dupe, preserve order
    loc_keys = list(dict.fromkeys(loc_keys))
    bad = [l for l in loc_keys if l not in GEO]
    if bad:
        sys.exit(f"Unknown location key(s): {bad}. Known: {', '.join(GEO)} (or PRIORITY). "
                 f"Resolve new geoUrns live (see SKILL.md) before using.")

    pack = []
    for brand in brands:
        segs = ([s.strip() for s in args.segments.split(",")] if args.segments
                else BRANDS[brand])
        for seg in segs:
            if seg not in SEGMENTS:
                print(f"# skip unknown segment: {seg}", file=sys.stderr); continue
            people_kw, content_kw = SEGMENTS[seg]
            # PEOPLE searches: one per keyword per location (location matters here)
            for lk in loc_keys:
                gname, gid = GEO[lk]
                for kw in people_kw:
                    pack.append({"brand": brand, "segment": seg, "kind": "people",
                                 "location": gname, "keywords": kw,
                                 "url": people_url(kw, gid)})
            # CONTENT searches: one per keyword (no reliable geo on content)
            for kw in content_kw:
                pack.append({"brand": brand, "segment": seg, "kind": "content",
                             "location": None, "keywords": kw,
                             "url": content_url(kw)})

        # PAIN-SIGNAL content searches: find people venting the complaint language
        # (e.g. "the market feels saturated") and meet them with a better vehicle.
        # Skipped when --segments overrides the brand defaults.
        if not args.segments:
            for pain in BRAND_PAINS.get(brand, []):
                for kw in PAIN_SIGNALS[pain]:
                    pack.append({"brand": brand, "segment": f"pain:{pain}", "kind": "content",
                                 "location": None, "keywords": kw,
                                 "url": content_url(kw)})
            # INTENT-SIGNAL content searches: forward-leaning people already in motion
            # (exploring, adjacent-asset adopters, market scouts, start-small builders).
            for intent in BRAND_INTENTS.get(brand, []):
                for kw in INTENT_SIGNALS[intent]:
                    pack.append({"brand": brand, "segment": f"intent:{intent}", "kind": "content",
                                 "location": None, "keywords": kw,
                                 "url": content_url(kw)})

    out = json.dumps(pack, indent=2, ensure_ascii=False)
    print(out)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out)
    print(f"\n# {len(pack)} queries: "
          f"{sum(1 for x in pack if x['kind']=='people')} people / "
          f"{sum(1 for x in pack if x['kind']=='content')} content "
          f"across brands={brands} locations={loc_keys}", file=sys.stderr)


if __name__ == "__main__":
    main()
