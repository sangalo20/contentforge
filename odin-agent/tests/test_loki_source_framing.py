# Loki's source-type prompt framing: article runs syndicate ("condense the
# approved article"), idea runs originate ("develop the creator's brief").
# These tests pin the framing on all three code paths (generate, revise,
# studio chat) by capturing the messages Loki sends to the LLM — no live API,
# no mesh. The agent is built bare (__new__) with just the attributes the
# handlers read.
import asyncio
import json
import logging
import types

import agents


def make_loki():
    loki = agents.LokiAgent.__new__(agents.LokiAgent)
    loki.system_prompt = "BASE PROMPT"
    # model_str is a request-time property (LOKI_MODEL env); no need to set it.
    loki._logger = logging.getLogger("test-loki")
    return loki


def test_model_config_resolves_at_request_time(monkeypatch):
    loki = make_loki()
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("LOKI_MODEL", raising=False)
    monkeypatch.delenv("GEMINI_FLASH_MODEL", raising=False)
    assert loki.model_str == "vertex_ai/gemini-3.8-flash"
    monkeypatch.setenv("LOKI_MODEL", "some-new-model")
    assert loki.model_str == "vertex_ai/some-new-model"
    monkeypatch.setenv("LOKI_MODEL", "vertex_ai/other")
    assert loki.model_str == "vertex_ai/other"


def _response(content: str):
    message = types.SimpleNamespace(content=content)
    return types.SimpleNamespace(choices=[types.SimpleNamespace(message=message)])


def capture_acompletion(monkeypatch, content: str):
    """Stub litellm.acompletion; returns the list of captured call kwargs."""
    captured = []

    async def fake(**kwargs):
        captured.append(kwargs)
        if kwargs.get("stream"):
            class _Empty:
                def __aiter__(self):
                    return self

                async def __anext__(self):
                    raise StopAsyncIteration

            return _Empty()
        return _response(content)

    monkeypatch.setattr(agents.litellm, "acompletion", fake)
    return captured


TEXT_COPY = json.dumps({"channel": "linkedin", "post": "the post", "cta": "the cta"})


def generate(loki, **data):
    base = {"task": "generate_social_copy", "draft": "SOURCE TEXT", "channel": "linkedin"}
    base.update(data)
    return asyncio.run(loki.on_peer_request(agents.PeerMessage(base)))


# --- Generation -------------------------------------------------------------

def test_article_generation_keeps_syndication_framing(monkeypatch):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    result = generate(make_loki())

    assert result["status"] == "success"
    system, user = captured[0]["messages"]
    assert "[SOURCE TYPE]" not in system["content"]
    assert "Here is the approved article." in user["content"]
    assert "SOURCE TEXT" in user["content"]


def test_idea_generation_switches_to_develop_framing(monkeypatch):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    result = generate(make_loki(), source_type="idea")

    assert result["status"] == "success"
    system, user = captured[0]["messages"]
    assert "[SOURCE TYPE]" in system["content"]
    assert "Original idea" in system["content"]
    # The no-fabrication boundary must be stated for idea runs.
    assert "Do not add facts" in system["content"]
    assert "Here is the creator's original idea. Develop it into" in user["content"]
    assert "SOURCE TEXT" in user["content"]


def test_unknown_source_type_falls_back_to_article_framing(monkeypatch):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    generate(make_loki(), source_type="podcast")

    system, user = captured[0]["messages"]
    assert "[SOURCE TYPE]" not in system["content"]
    assert "Here is the approved article." in user["content"]


# --- Revision ---------------------------------------------------------------

def revise(loki, **data):
    base = {
        "task": "revise_social",
        "kind": "text",
        "channel": "linkedin",
        "content": {"post": "current draft", "cta": None},
        "note": "tighten it",
        "draft": "SOURCE TEXT",
    }
    base.update(data)
    return asyncio.run(loki.on_peer_request(agents.PeerMessage(base)))


def test_revise_grounds_on_the_source_article(monkeypatch):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    revise(make_loki())

    user = captured[0]["messages"][1]["content"]
    assert "the source article" in user
    assert "SOURCE TEXT" in user


def test_revise_grounds_on_the_idea_brief(monkeypatch):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    revise(make_loki(), source_type="idea")

    user = captured[0]["messages"][1]["content"]
    assert "the creator's original idea brief" in user
    assert "the source article" not in user
    assert "SOURCE TEXT" in user


# --- Studio chat ------------------------------------------------------------

def studio_messages(monkeypatch, **data):
    captured = capture_acompletion(monkeypatch, TEXT_COPY)
    base = {
        "task": "studio_chat",
        "kind": "text",
        "channel": "linkedin",
        "content": {"post": "current draft", "cta": None},
        "draft": "SOURCE TEXT",
        "message": "make it punchier",
    }
    base.update(data)

    async def drain():
        async for _ in make_loki().stream_studio_chat(agents.PeerMessage(base)):
            pass

    asyncio.run(drain())
    return captured[0]["messages"]


def test_studio_chat_labels_article_source(monkeypatch):
    system = studio_messages(monkeypatch)[0]["content"]
    assert "[SOURCE ARTICLE]" in system
    assert "[SOURCE — ORIGINAL IDEA]" not in system
    assert "SOURCE TEXT" in system


def test_studio_chat_labels_idea_source(monkeypatch):
    system = studio_messages(monkeypatch, source_type="idea")[0]["content"]
    assert "[SOURCE — ORIGINAL IDEA]" in system
    assert "[SOURCE ARTICLE]" not in system
    assert "never add facts it does not contain" in system
    assert "SOURCE TEXT" in system


def test_studio_chat_passes_tool_round_trips_and_memory(monkeypatch):
    messages = studio_messages(
        monkeypatch,
        message="",  # tool continuation: no fresh user turn
        memory="- Reviewer hates rhetorical questions",
        context={"history": [
            {"role": "user", "content": "what did we decide about openers?"},
            {"role": "assistant", "content": "", "tool_calls": [
                {"id": "call_m1", "type": "function",
                 "function": {"name": "search_memory", "arguments": '{"query": "openers"}'}}]},
            {"role": "tool", "tool_call_id": "call_m1", "content": "No rhetorical questions."},
        ]},
    )
    system = messages[0]["content"]
    assert "REMEMBERED FROM PAST SESSIONS" in system
    assert "hates rhetorical questions" in system
    assert messages[-1]["role"] == "tool"          # no empty user turn appended
    assert messages[-1]["tool_call_id"] == "call_m1"
    assert messages[-2]["tool_calls"][0]["function"]["name"] == "search_memory"
