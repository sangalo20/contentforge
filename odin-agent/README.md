# Odin Agent Service

The Odin Agent is a standalone FastAPI service that provides two capabilities to ContentForge:

1. **Content generation** — receives a transcript and workspace config, delegates writing to OscarAgent, returns a blog draft.
2. **Cover image chat** — a streaming conversational Art Director. Discusses visual concepts with the user and, on approval, delegates image generation to HermesAgent (xAI Grok).

The service is built on the **jarviscore** multi-agent framework operating in P2P mesh mode.

## Agents

| Agent | Role | Capability |
| --- | --- | --- |
| `OdinAgent` | Orchestrator, Art Director | `orchestration` |
| `OscarAgent` | Blog writer | `writing` |
| `HermesAgent` | Image generator | `image_generation` |
| `LokiAgent` | Social copy syndicator | `social_copy` |

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/chat` | Non-streaming chat (legacy) |
| `POST` | `/api/v1/chat/stream` | **Streaming chat over SSE** (preferred) |
| `POST` | `/api/v1/tasks/generate-campaign` | Generate blog draft from transcript |

## Quick start

```bash
cd odin-agent
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in GEMINI_API_KEY and XAI_API_KEY
uvicorn main:app --port 8000 --reload
```

Health check:
```bash
curl http://localhost:8000/
# → {"message":"Odin Agent Service is running"}
```

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/agents.md`](docs/agents.md) | All four agents — roles, tasks, models |
| [`docs/personas.md`](docs/personas.md) | XML prompt files and how to edit them |
| [`docs/chat-streaming.md`](docs/chat-streaming.md) | SSE chat protocol, event types, frontend integration |
| [`docs/image-generation.md`](docs/image-generation.md) | Hermes + Grok integration details |
| [`docs/configuration.md`](docs/configuration.md) | All environment variables |
