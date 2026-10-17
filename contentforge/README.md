# ContentForge

ContentForge is a self-hosted AI content pipeline that turns source material — YouTube transcripts, web articles, pasted text and code, GitHub repos, and a banked Source Vault — into edited, published blog posts, newsletter issues, and social content. It is a three-service system: a React web app, an Express API, and a FastAPI multi-agent orchestration service (the Odin Agent). Humans work in the web app; machines (agentic workbenches, scripts) work through the external `/api/v1` surface and its MCP endpoint.

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser  (Vite + React 19  —  :5193)                            │
│  Workspaces → Library → Item Viewer · Social Library & Studio    │
│  Source Vault + Scout · Brand Studio (/brand-studio)             │
│  All agent chat streams through the backend proxy (SSE)          │
└─────────────────┬────────────────────────────────────────────────┘
                  │ HTTP / SSE  :3005            ┌──────────────────┐
┌─────────────────▼────────────────────────────┐ │ Workbenches      │
│  ContentForge Backend  (Express — :3005)     │◄┤ (Claude, scripts)│
│  App API + External API (/api/v1 REST + MCP) │ │ cfk_ API keys    │
│  firebase-admin → Firestore (library, jobs,  │ └──────────────────┘
│    users, keys, vault, comments, …)          │
│  firebase-admin → Cloud Storage (image bytes)│
│  @sanity/client → Sanity CMS (publish only)  │
│  Vertex AI Imagen → Brand Studio backgrounds │
└─────────────────┬────────────────────────────┘
                  │ HTTP / NDJSON / SSE  :8000  (Cloud Run IAM)
┌─────────────────▼────────────────────────────────────────────────┐
│  Odin Agent Service  (FastAPI / jarviscore  —  :8000)            │
│  Odin (orchestrator) · Oscar (writer) · Heimdall (QA gate)       │
│  Huginn (citations) · Hermes (images) · Loki (social) ·          │
│  Mimir (vault scout)                                             │
│  litellm → Gemini / Anthropic / OpenAI · xAI Grok → images       │
└──────────────────────────────────────────────────────────────────┘
```

## Quick-start

See [`docs/setup.md`](docs/setup.md) for the full setup guide. In brief:

```bash
# 1. Backend
cd contentforge/backend
cp .env.example .env           # fill in keys
npm install
gcloud auth application-default login
node server.js                 # → http://localhost:3005

# 2. Frontend
cd contentforge/frontend
npm install
npm run dev                    # → http://localhost:5193

# 3. Odin Agent
cd odin-agent
cp .env.example .env           # fill in keys
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

## The external API (machines)

Admins mint `cfk_` API keys in **Settings → API Keys** (workspace-scoped; keys can never delete content or manage credentials). Two equivalent surfaces serve the same operations:

- **REST** — `/api/v1`: async generation jobs, normalized items, finalize/publish, reviews, comments, socials. Contract: [`docs/openapi.v1.json`](docs/openapi.v1.json), CI-enforced.
- **MCP** — `/api/v1/mcp`: the same verbs as native tools for agentic clients:
  ```bash
  claude mcp add contentforge --transport http \
    https://<host>/api/v1/mcp --header "Authorization: Bearer cfk_…"
  ```

See the *External API v1* section of [`docs/api-reference.md`](docs/api-reference.md).

## Documentation

| Document | Contents |
| --- | --- |
| [`docs/architecture.md`](docs/architecture.md) | System diagram, data flows, sequence diagrams |
| [`docs/setup.md`](docs/setup.md) | Local dev setup for all three services |
| [`docs/configuration.md`](docs/configuration.md) | All env vars, tokens, Sanity project map |
| [`docs/api-reference.md`](docs/api-reference.md) | Every backend route — request, response, errors |
| [`docs/openapi.v1.json`](docs/openapi.v1.json) | The frozen `/api/v1` contract (CI-checked against the router) |
| [`docs/data-model.md`](docs/data-model.md) | Firestore, Storage, and Sanity schemas |
| [`docs/content-pipeline.md`](docs/content-pipeline.md) | End-to-end generation flow |
| [`docs/cover-images.md`](docs/cover-images.md) | Cover image lifecycle: approve → store → publish |
| [`docs/brand-studio.md`](docs/brand-studio.md) | Brand Studio: brand registry, templates/designs, matting, pipeline bridges |
| [`docs/frontend.md`](docs/frontend.md) | Component map, routing, UI conventions |
| [`docs/operations.md`](docs/operations.md) | Runbooks and common operational tasks |
| [`docs/troubleshooting.md`](docs/troubleshooting.md) | Symptom → cause → fix |
| [`docs/TECH_DEBT.md`](docs/TECH_DEBT.md) | Tech debt register — parked work, why, and when to fix |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes, by merge date |
| [`odin-agent/README.md`](../odin-agent/README.md) | Odin Agent service overview |

## Workspaces

A **workspace** defines a content channel — its AI persona (system prompt), target destination (Sanity blog or newsletter), model configuration, social personas, and review policy. Two workspaces ship by default:

| Workspace ID | Channel | Sanity Project | Schema |
| --- | --- | --- | --- |
| `the-moguls-medium-blogs` | The Moguls — Medium-style blog | `fqfrsx19` | `post` |
| `the-real-rep-substack-blogs` | The Real Rep — newsletter | `l4nrg0gu` | `newsletterIssue` |

Additional workspaces can be created from the web app's workspace dashboard. Access is per-user (and per-API-key) workspace scoping, with opt-in reviewer grants.
