"""End-to-end smoke run against a local odin-agent: article -> cover -> carousel.

Saves everything under ../../demo/<timestamp>/ so the outputs double as the
DevFest backup demo.  Usage (service already running on :8000):

    venv/bin/python scripts/smoke_e2e.py [--base http://localhost:8000]
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
DEMO_ROOT = HERE.parent.parent / "demo"
HEADERS = {"X-User-Id": "devfest", "X-User-Email": "devfest@example.com"}

TRANSCRIPT = """
Welcome to DevFest Mauritius. Today I want to talk about why we stopped asking
one giant prompt to write, fact-check, edit, and design our content, and what
happened when we split that job across seven small agents instead.

ContentForge started as a tool for the Storage Moguls team. Every week someone
had to turn a two-hour YouTube interview with a self-storage operator into a
blog post, a cover image, and a LinkedIn carousel. The first version was a
single prompt. It wrote fast, but it hallucinated statistics, buried the lede,
and its "brand colours" drifted every time the model updated.

So we built a mesh. Odin orchestrates. Oscar writes the long-form draft. Huginn
researches every claim and inserts citations. Heimdall is the editorial gate:
he fixes tone, checks fidelity to the transcript, and rejects anything that
loses more than half the original text. Hermes generates cover images. Loki
writes social copy and fills carousel slots. Mimir scouts our Source Vault for
material we've already banked.

Three lessons. First, route by role, not by brand loyalty: the orchestrator,
the writer and the editor run on Gemini 3.1 Pro because judgement matters
there; the researcher, the social writer and the scout run on Gemini 3.8 Flash
because they make many small calls. Second, preview endpoints flake. Loki
retries twice, then fails over to Pro, and if a stream dies halfway he replays
the whole thing with a reset event so the UI never shows a half-written slide.
Third, the model fills slots, code owns the design. Loki returns JSON: a title,
a body, a kicker per slide. A deterministic renderer turns that JSON into a
1080 by 1350 PDF using fixed brand templates. The model never touches a hex
colour. That's how output stays on-brand after every model upgrade.

And through all of it, humans don't write. They review. Every draft, every
image, every carousel sits in a review queue until a person approves it. The
human is the reviewer, and that's the whole design.
""".strip()

PERSONA = (
    "You are the Storage Moguls editorial voice: practical, operator-first, "
    "no hype. Short paragraphs, concrete numbers, one clear takeaway per section."
)


def _log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.getenv("ODIN_BASE", "http://localhost:8000"))
    args = ap.parse_args()
    base = args.base.rstrip("/")

    out = DEMO_ROOT / datetime.now().strftime("%Y-%m-%d_%H%M%S")
    out.mkdir(parents=True, exist_ok=True)
    _log(f"writing to {out}")

    client = httpx.Client(base_url=base, headers=HEADERS, timeout=httpx.Timeout(900.0))
    failures = []

    # 1. readiness
    r = client.get("/healthz/ready")
    (out / "01_ready.json").write_text(r.text)
    _log(f"ready: {r.status_code} {r.json().get('agents')}")
    if r.status_code != 200:
        print("service not ready; aborting", file=sys.stderr)
        sys.exit(1)

    # 2. article pipeline (streaming so we capture the stage events for the deck)
    t0 = time.time()
    stages, result = [], None
    with client.stream("POST", "/api/v1/tasks/generate-campaign/stream", json={
        "transcript": TRANSCRIPT,
        "systemPrompt": PERSONA,
        "description": "DevFest Mauritius talk recap",
        "wordCount": "800",
        "sourceCount": 1,
        "sourceTypes": ["transcript"],
    }) as resp:
        for line in resp.iter_lines():
            if not line.strip():
                continue
            ev = json.loads(line)
            if ev["type"] == "stage":
                stages.append({"t": round(time.time() - t0, 1), "event": ev["event"]})
                _log(f"  stage {ev['event']}")
            elif ev["type"] == "result":
                result = ev["data"]
            elif ev["type"] == "error":
                failures.append(f"campaign: {ev['detail']}")
                _log(f"  ERROR {ev['detail']}")
    (out / "02_stages.json").write_text(json.dumps(stages, indent=2))
    if not result:
        print("campaign failed; aborting", file=sys.stderr)
        sys.exit(1)
    draft = result["draft"]
    (out / "02_draft.md").write_text(draft)
    (out / "02_campaign.json").write_text(json.dumps(result, indent=2))
    _log(f"article: {len(draft)} chars in {time.time()-t0:.0f}s; imagePrompt={bool(result.get('imagePrompt'))}")

    # 3. cover image via Odin chat -> Hermes
    t0 = time.time()
    image_url, texts = None, []
    prompt = result.get("imagePrompt") or "A clean editorial cover for a blog post about multi-agent AI content pipelines."
    with client.stream("POST", "/api/v1/chat/stream", json={
        "message": f"Generate the cover image now with this concept, no further discussion: {prompt}",
        "system_prompt": "You are the Art Director. The user has already approved the concept. Delegate to Hermes immediately.",
    }) as resp:
        for line in resp.iter_lines():
            if not line.startswith("data: "):
                continue
            ev = json.loads(line[6:])
            if ev["type"] == "image":
                image_url = ev["url"]
            elif ev["type"] == "text":
                texts.append(ev["content"])
            elif ev["type"] == "error":
                failures.append(f"cover: {ev['content']}")
    (out / "03_cover_chat.txt").write_text("".join(texts))
    if image_url:
        (out / "03_cover_url.txt").write_text(image_url)
        if image_url.startswith("http"):
            img = client.get(image_url)
            (out / "03_cover.png").write_bytes(img.content)
        _log(f"cover: ok in {time.time()-t0:.0f}s -> {image_url[:80]}")
    else:
        failures.append("cover: no image event")
        _log("cover: no image returned")

    # 4. carousel: Loki fills slots (draftOnly), then deterministic render
    t0 = time.time()
    r = client.post("/api/v1/tasks/syndicate", json={
        "draft": draft,
        "channel": "linkedin",
        "format": "carousel",
        "personaPrompt": PERSONA,
        "brandName": "DevFest Mauritius",
        "template": "devfest",
        "draftOnly": True,
    })
    if r.status_code != 200:
        failures.append(f"syndicate: {r.status_code} {r.text[:200]}")
        _log(f"syndicate failed: {r.status_code} {r.text[:200]}")
    else:
        data = r.json()["data"]
        (out / "04_carousel_slots.json").write_text(json.dumps(data, indent=2))
        slides = data.get("slides") or data.get("content", {}).get("slides")
        _log(f"loki: {len(slides or [])} slides in {time.time()-t0:.0f}s")
        if slides:
            rr = client.post("/api/v1/carousel/render", json={
                "slides": slides, "brandName": "DevFest Mauritius", "template": "devfest",
            })
            if rr.status_code == 200:
                file_id = rr.json().get("file_id") or rr.json().get("data", {}).get("file_id")
                pdf = client.get(f"/api/v1/reports/carousel/{file_id}")
                (out / "04_carousel.pdf").write_bytes(pdf.content)
                _log(f"carousel pdf: {len(pdf.content)//1024} KB")
            else:
                failures.append(f"render: {rr.status_code} {rr.text[:200]}")

    # 5. social text copy (LinkedIn post)
    r = client.post("/api/v1/tasks/syndicate", json={
        "draft": draft, "channel": "linkedin", "personaPrompt": PERSONA, "brandName": "DevFest Mauritius",
    })
    if r.status_code == 200:
        (out / "05_linkedin.json").write_text(json.dumps(r.json()["data"], indent=2))
        _log("linkedin copy: ok")
    else:
        failures.append(f"linkedin: {r.status_code} {r.text[:200]}")

    (out / "summary.json").write_text(json.dumps({
        "base": base, "failures": failures, "stages": stages,
        "usage": result.get("usage"), "qaReport": result.get("qaReport"),
    }, indent=2))
    _log("DONE" if not failures else f"DONE with failures: {failures}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
