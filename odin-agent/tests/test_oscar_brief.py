# Oscar's editorial-brief framing: when a scouting proposal was accepted, the
# working title and angle land in the system prompt; without a brief the block
# is absent. Stubbed litellm; bare-__new__ agent per the house pattern.
import asyncio
import logging
import types

import agents


def make_oscar():
    o = agents.OscarAgent.__new__(agents.OscarAgent)
    o.base_prompt = "BASE PROMPT"
    o._logger = logging.getLogger("test-oscar")
    return o


def capture(monkeypatch):
    captured = []

    async def fake(**kwargs):
        captured.append(kwargs)
        message = types.SimpleNamespace(content="# Draft\n\nbody <image_prompt>x</image_prompt>")
        return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    return captured


def write_blog(brief=None):
    data = {"task": "write_blog", "transcript": "SOURCE", "ai_provider": "Google"}
    if brief is not None:
        data["brief"] = brief
    return agents.PeerMessage(data)


def test_brief_lands_in_the_system_prompt(monkeypatch):
    captured = capture(monkeypatch)
    asyncio.run(make_oscar().on_peer_request(write_blog(
        {"workingTitle": "The Study That Saves You", "angle": "the gatekeeper of every deal"}
    )))
    system = captured[0]["messages"][0]["content"]
    assert "EDITORIAL BRIEF" in system
    assert "The Study That Saves You" in system
    assert "the gatekeeper of every deal" in system


def test_no_brief_no_block(monkeypatch):
    captured = capture(monkeypatch)
    asyncio.run(make_oscar().on_peer_request(write_blog()))
    assert "EDITORIAL BRIEF" not in captured[0]["messages"][0]["content"]
