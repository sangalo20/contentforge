# Agent Personas (XML Prompt Files)

**Audience:** Engineers and content strategists.  
**Purpose:** Explain the XML prompt system, what each persona file contains, and how to edit them safely.

---

## Overview

Each agent's personality, rules, and behavior are defined in an XML file under `odin-agent/prompts/`. These files are loaded once at agent startup (`setup()`) and stored as `self.system_prompt` or `self.base_prompt`.

| File | Agent | Loaded by |
| --- | --- | --- |
| `prompts/odin.xml` | OdinAgent | `self.system_prompt` |
| `prompts/oscar.xml` | OscarAgent | `self.base_prompt` |
| `prompts/loki.xml` | LokiAgent | `self.system_prompt` |

HermesAgent has no persona file — it is a pure tool executor.

---

## Reloading personas

Because files are read at agent startup, **editing an XML file requires restarting Odin** to take effect:

```bash
# Kill and restart
lsof -ti :8000 | xargs kill -9
cd odin-agent && source venv/bin/activate
uvicorn main:app --port 8000 --reload
```

---

## `prompts/odin.xml` — Art Director Persona

Odin's prompt governs the cover image chat experience.

### Structure

```xml
<system_prompt>
  <persona>        Who Odin is and what he does / doesn't do </persona>
  <domain_expertise>  Rules for high-quality image prompts </domain_expertise>
  <workflow>       Decision logic for chat interactions </workflow>
  <reasoning_protocol>  Internal planning before tool calls </reasoning_protocol>
  <delegation_rules>   Which tasks belong to which agent </delegation_rules>
  <few_shot_examples>  3 worked examples of the expected behaviour </few_shot_examples>
</system_prompt>
```

### Key rules encoded

- Odin proposes 2–3 visual directions when the user hasn't approved a concept yet.
- He **never** fabricates or returns a fake image URL in text — only the `delegate_to_hermes` tool can generate images.
- All image prompts must specify Subject, Medium, Lighting, Mood, and a 16:9 aspect ratio.
- No text-in-image prompts (image generators struggle with text).
- Avoid cliché stock-photo tropes.

### Few-shot examples

Three examples teach the model the expected conversational flow:
1. **User asks for a cover image** → Odin proposes two distinct concepts (does not generate yet).
2. **User approves a concept** → Odin calls `delegate_to_hermes` with an optimized prompt.
3. **User gives a direct generation request** → Odin optimizes and delegates immediately.

---

## `prompts/oscar.xml` — Writer Persona

Oscar's base prompt is combined with the workspace-specific persona (from `workspaces.json`) at generation time:

```
Oscar base (oscar.xml)
  + Workspace Persona (systemPrompt field from workspaces.json)
  + Target word count
  + Moguls-specific Markdown heading / Categories requirements (injected by server.js)
```

### Key rules

- Output in Markdown only.
- Adopt the workspace persona voice strictly.
- Structure with H2/H3 headings, bullet points, strong conclusion.
- End every response with `<image_prompt>...</image_prompt>` containing a detailed, 16:9 cover image prompt.

### Editing Oscar's base personality vs. workspace persona

- To change rules that apply to **all** workspaces (e.g. always include a TL;DR): edit `oscar.xml`.
- To change a specific workspace's voice, tone, or rules: edit the `systemPrompt` field for that workspace via the Config & Persona screen in the web app.

---

## `prompts/syndicator.xml` — Social Copy Persona

Defines rules for LinkedIn and Twitter/X content generated from a completed blog post.

### Key rules

- Always produce exactly one LinkedIn post and one Twitter thread.
- LinkedIn: strong hook, bullet formatting, hashtags.
- Twitter: numbered tweet series (e.g. `Tweet 1/5`), strong hook, clear summary.
- Maintain the voice and message of the original blog post.
