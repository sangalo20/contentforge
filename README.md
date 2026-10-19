# ContentForge

**The Human Is the Reviewer: a production multi-agent content platform on Gemini and Cloud Run.**

ContentForge is a self-hosted AI content pipeline. It turns source material (YouTube transcripts, web articles, pasted text, GitHub repos, a banked Source Vault) into edited, reviewed, published blog posts, newsletter issues, and social content. A human approves every stage; the agents do the drafting.

This repository is the reference implementation used in talks, workshops and codelabs. Everything needed to deploy it to your own Google Cloud project and build along is here.

```
Browser (React 19 + Vite)
   │  HTTP / SSE
   ▼
ContentForge backend (Express)  ── Firestore · Cloud Storage · Sanity CMS
   │  HTTP / NDJSON / SSE  (Cloud Run IAM)
   ▼
Odin Agent (FastAPI + jarviscore)
   Odin (orchestrator) · Oscar (writer) · Heimdall (QA gate)
   Huginn (citations) · Hermes (images) · Loki (social) · Mimir (vault scout)
   └─ Gemini via Vertex AI (text + images)
```

## Repository layout

| Directory | What it is |
| --- | --- |
| [`contentforge/`](contentforge/) | The web app: React frontend, Express API, external `/api/v1` REST + MCP surface, and full docs. Start with its [README](contentforge/README.md). |
| [`odin-agent/`](odin-agent/) | The multi-agent orchestration service (FastAPI, jarviscore P2P mesh). See its [README](odin-agent/README.md). |
| [`infra/`](infra/) | Terraform for Google Cloud in two layers (`base/` stateful resources, root app layer with two Cloud Run services) plus `deploy.sh` and an end-to-end smoke test. |
| [`codelab/`](codelab/) | A hands-on codelab (claat Markdown): add a tested fail-open guard to Heimdall's quality gate. Published to GitHub Pages on every push to `main`. |
| [`demo/`](demo/) | Sample output from a full pipeline run: personas, stage events, generated cover, carousel, and LinkedIn post. Useful as a reference or an offline fallback. |
| [`slides/`](slides/) | A talk deck as PDF and the python-pptx script that builds it from a template. |

## Running locally

Each service runs on its own. Copy the `.env.example` in each service to `.env` and fill in the keys.

```bash
# Backend  → http://localhost:3005
cd contentforge/backend && npm install && node server.js

# Frontend → http://localhost:5193
cd contentforge/frontend && npm install && npm run dev

# Odin Agent → http://localhost:8000
cd odin-agent && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --port 8000 --reload
```

The backend needs Google application default credentials (`gcloud auth application-default login`) for Firestore and Storage. The full setup guide is in [`contentforge/docs/setup.md`](contentforge/docs/setup.md).

## Deploying to Google Cloud

`infra/deploy.sh` wraps both Terraform layers. The split exists so the app layer can be torn down and recreated live in a couple of minutes from prebuilt images, while the stateful base (Firestore, Firebase Auth, Artifact Registry, Secret Manager, buckets) stays put.

```bash
cd infra
cp base/terraform.tfvars.example base/terraform.tfvars   # project_id, region, auth domains
cp terraform.tfvars.example terraform.tfvars             # project, owner email, model cards, sizing, access
./deploy.sh base        # once: APIs, registry, secrets, Firestore, Firebase Auth, buckets
./deploy.sh secrets     # push API keys into Secret Manager
./deploy.sh build       # build and push both container images (tagged :demo)
./deploy.sh up          # apply the app layer: service accounts, IAM, two Cloud Run services
./deploy.sh bootstrap   # create the owner login (writes infra/.demo_credentials)
./deploy.sh smoke       # hit the deployed services
./deploy.sh down        # remove the app layer, keep base
./deploy.sh nuke        # remove everything
./deploy.sh images      # list the images in Artifact Registry
```

After the first `up`, add the printed app URL hostname to `auth_domains` in `base/terraform.tfvars` and run `./deploy.sh base` again so Firebase Auth accepts sign-ins from it.

Model choice is configuration, not code: `gemini_model`, `gemini_flash_model` and `image_model` in `terraform.tfvars` become env vars on the agent service, which reads them on every call. Change one and run `./deploy.sh up`; no rebuild.

`deploy.sh` pins the gcloud configuration and ADC file at the top (`CLOUDSDK_ACTIVE_CONFIG_NAME`, `GOOGLE_APPLICATION_CREDENTIALS`). Point those at your own, or remove the two lines to use your default gcloud login.

`terraform.tfvars`, Terraform state, and `.demo_credentials` are deliberately not committed.

## The idea in one paragraph

One business, seven platforms, one person rewriting the same idea by hand for each. ContentForge replaces the rewriting with a pipeline of specialised agents on Gemini, but keeps a human as the gate at every stage: draft, QA, citations, cover image, social copy, publish. Three patterns carry the design: route each agent to the model tier its job needs, fail open after the first draft so a flaky quality pass never discards useful work, and let the model fill slots while code owns the layout so brand output stays deterministic across model upgrades. The deck in `slides/` walks through the architecture and what it costs per run; `demo/` holds real output.

## Not in this repo

- Secrets: `.env` files, `terraform.tfvars`, Terraform state, demo credentials.
- Large binaries: the editable `.pptx` deck and the slide template. The PDF export is included.
- Dependencies: `node_modules/`, `venv/`, `.terraform/`.
