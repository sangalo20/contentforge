"""Live check that every configured Google model ID resolves on Vertex AI (ADC).

Run: GOOGLE_CLOUD_PROJECT=<project> python scripts/smoke_models.py
"""
import asyncio
import base64
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import litellm  # noqa: E402
import agents  # noqa: E402

litellm.suppress_debug_info = True
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "demo", "hermes_smoke.png")


async def main():
    for model in [agents._gemini_flash_model(), agents._gemini_litellm_model()]:
        try:
            r = await litellm.acompletion(
                model=model,
                messages=[{"role": "user", "content": "Reply with the single word OK"}],
                max_tokens=512,
            )
            print("OK  ", model, "->", (r.choices[0].message.content or "").strip()[:20])
        except Exception as e:
            print("FAIL", model, "->", str(e)[:300])

    async def _noop(*_a, **_k):
        return None

    agents.usage_record_image = _noop
    hermes = agents.HermesAgent.__new__(agents.HermesAgent)
    hermes._logger = logging.getLogger("hermes")
    result = await hermes.generate_image(
        "Minimalist flat illustration of seven friendly robots reviewing a blog post, teal and orange"
    )
    if "url" not in result:
        print("FAIL image ->", result)
        return
    head, b64 = result["url"].split(",", 1)
    with open(OUT, "wb") as f:
        f.write(base64.b64decode(b64))
    print("OK   image", hermes.image_model, head, f"{len(b64) // 1024} KB ->", os.path.abspath(OUT))


asyncio.run(main())
