# Configuration

**Audience:** Engineers and operators.  
**Purpose:** Document every environment variable, token, and configuration file across both services.

---

## ContentForge Backend — `contentforge/backend/.env`

Copy `.env.example` and fill in the values. Never commit `.env`.

| Variable | Required | Description |
| --- | --- | --- |
| `GCP_PROJECT_ID` | Yes | Google Cloud project ID (e.g. `prod1-svc-pygl-v2`). Used by firebase-admin for Firestore and Storage. |
| `STORAGE_BUCKET` | No | Firebase Storage bucket name. Defaults to `<GCP_PROJECT_ID>.firebasestorage.app`. Override if your bucket name differs. |
| `SANITY_API_TOKEN_MOGULS` | Yes (for publish) | Sanity Editor token for the Moguls project (`fqfrsx19`). **Must have create/write permission.** Not needed for cover image saving — only for publishing. |
| `SANITY_API_TOKEN_REAL_REP` | Yes (for publish) | Sanity Editor token for the Real Rep project (`l4nrg0gu`). Same permission requirement. |
| `PORT` | No | HTTP port. Defaults to `3005`. |
| `RESEND_API_KEY` | No | Resend API key for transactional email (@mention and review emails). When unset, email sending is skipped silently. |
| `EMAIL_FROM` | No | Sender for outbound email, e.g. `ContentForge <no-reply@storagemoguls.ai>`. Defaults to Resend's onboarding sender. |
| `APP_BASE_URL` | No | Base URL for links in outbound email and invites. Defaults to `https://contentforge.storagemoguls.ai` (the user-facing domain — never the bare Cloud Run URL). Set to `http://localhost:5193` in local dev. Also set on the Cloud Run service. |
| `ATHENA_API_URL` | No | Athena MemOS base URL (long-term agent memory), e.g. the `athena-memos` Cloud Run URL. When unset, memory is disabled and every chat behaves as before. |
| `ATHENA_API_KEY` | No | Athena `X-API-Key`. Required together with `ATHENA_API_URL`. Tenancy: `tenant_id` = workspace id, `user_id` = operator uid, `agent_id` = `odin`. |
| `GOOGLE_CLOUD_PROJECT` | No | Overrides the GCP project used for Brand Studio image generation (Vertex AI Imagen). Defaults to `GCP_PROJECT_ID`. The ADC identity needs the **Vertex AI User** role. |
| `GOOGLE_CLOUD_LOCATION` | No | Vertex AI region for Imagen. Defaults to `us-central1`. |
| `IMAGEN_MODEL` | No | Imagen model id. Defaults to `imagen-3.0-generate-002`. |
| `API_KEY_RATE_LIMIT` | No | Requests/minute allowed per API key (token bucket; default `120`, `0` disables). Applies to **every** route when the caller is a `cfk_` key — machines share the instance with the human app and must not degrade it; human sessions are never limited. Over-limit requests get `429` with a `Retry-After` header. Per instance. |
| `MAX_ACTIVE_SOCIAL_GENERATIONS` | No | Max concurrent social generations per instance (default `3`, `0` disables). Social generation is a blocking Loki call; beyond the cap, requests get `429 rate_limited` — same pattern as `V1_MAX_ACTIVE_JOBS`. |
| `V1_MAX_ACTIVE_JOBS` | No | Max concurrent `/api/v1` generation jobs per instance (default `3`). Submits beyond the cap get `429`. **Deployment note:** v1 jobs run in-process after the submit request has returned, so the Cloud Run service must keep CPU allocated between requests (CPU always allocated, or `min-instances` ≥ 1 with instance-based billing) — with request-based CPU throttling a queued job stalls until the next request arrives. |
| ~~`GITHUB_TOKEN`~~ | — | Removed. GitHub is a **per-user** connection: each user pastes their own fine-grained PAT under **Settings → Integrations** (stored on their user record, `content_pipeline_users.{uid}.githubIntegration`). No shared credential, no env fallback; users without a connection get public-repo access only. |

### `.env.example`

```env
GCP_PROJECT_ID=your-gcp-project-id
STORAGE_BUCKET=                    # optional — omit to use default
SANITY_API_TOKEN_MOGULS=sk...
SANITY_API_TOKEN_REAL_REP=sk...
PORT=3005
```

---

## Sanity tokens — permissions

Sanity tokens must have **Editor** (write/create) permission to:
- Upload image assets (`sanityClient.assets.upload`)
- Create or replace documents (`sanityClient.createOrReplace`)

**Read-only tokens will fail with:** `Insufficient permissions; permission "create" required`

### How to create an Editor token

1. Go to [manage.sanity.io](https://manage.sanity.io) → select the project.
2. **API → Tokens → Add API token**.
3. Give it a descriptive label (e.g. `contentforge-backend`).
4. Set **Permissions** to **Editor**.
5. Copy the token immediately (it is only shown once).
6. Paste into `.env`.
7. Restart the backend.

> **Security:** Rotate tokens if they are ever exposed (e.g. shared in chat, committed to Git). Revoke the old token at manage.sanity.io before deploying the new one.

---

## Sanity project map — `server.js` `SANITY_CONFIGS`

The backend maps workspace IDs to Sanity project coordinates. This is hardcoded in `contentforge/backend/server.js`:

```javascript
const SANITY_CONFIGS = {
  'the-moguls-medium-blogs': {
    projectId: 'fqfrsx19',
    dataset: 'production',
    token: process.env.SANITY_API_TOKEN_MOGULS,
    schemaType: 'post'
  },
  'the-real-rep-substack-blogs': {
    projectId: 'l4nrg0gu',
    dataset: 'production',
    token: process.env.SANITY_API_TOKEN_REAL_REP,
    schemaType: 'newsletterIssue'
  }
};
```

To add a new Sanity workspace: add an entry here and define the corresponding `SANITY_API_TOKEN_<NAME>` env var.

---

## Workspaces file — `contentforge/backend/data/workspaces.json`

Workspace definitions are persisted in this JSON file. It is managed entirely via the API (`POST /api/workspaces`, `PUT /api/workspaces/:id`) and the Config & Persona screen in the web app.

Each workspace object:

```jsonc
{
  "id": "the-moguls-medium-blogs",    // URL-safe, auto-derived from name
  "name": "The Moguls Medium Blogs",
  "description": "Educational self-storage content for Medium.",
  "theme": "#6366f1",                  // hex color for UI accents
  "destination": "Sanity",             // "Markdown" | "Sanity" | "Substack Newsletter"
  "aiProvider": "Anthropic",           // "Anthropic" | "Google" | "Odin"
  "aiModel": "claude-sonnet-4-6",      // model string passed to litellm
  "systemPrompt": "PERSONA: ...",      // the full AI persona definition
  "wordCount": "800-1200"              // target word count passed to Oscar
}
```

---

## Odin Agent — `odin-agent/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Google AI Studio key for Gemini models (used by OdinAgent, LokiAgent). |
| `XAI_API_KEY` | Yes | xAI API key for Grok image generation (used by HermesAgent). |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to `gemini-3.1-pro-preview`. |
| `GEMINI_LITELLM_MODEL` | No | LiteLLM-prefixed model string. Defaults to `gemini/<GEMINI_MODEL>`. |
| `XAI_IMAGE_MODEL` | No | Grok image model. Defaults to `grok-imagine-image-quality`. |
| `ANTHROPIC_API_KEY` | Conditional | Required if any workspace uses `aiProvider: Anthropic`. Passed through litellm. |
| `SERPER_API_KEY` | No | Serper (serper.dev) key for Huginn's citation research. When unset, web citations are skipped (fail-open); internal links still work. |
| `HUGINN_MODEL` | No | Huginn's research model. Defaults to the Gemini routing (`GEMINI_LITELLM_MODEL`). |
| `MIMIR_MODEL` | No | Mimir's scouting model. Defaults to the Gemini routing. |

### `.env.example`

```env
GEMINI_API_KEY=your-google-ai-studio-key
XAI_API_KEY=your-xai-api-key
ANTHROPIC_API_KEY=your-anthropic-key   # optional — needed for Claude models
GEMINI_MODEL=gemini-3.1-pro-preview    # optional
XAI_IMAGE_MODEL=grok-imagine-image-quality  # optional
```

> **Important:** Environment variable changes require a full service restart. `uvicorn --reload` only watches Python file changes, not `.env`.

---

## Secrets hygiene

- `.env` files are gitignored in both services.
- A Gitleaks pre-commit hook runs on every commit and will block secrets from being committed.
- Never pass tokens in chat, URLs, or issue trackers — edit `.env` files directly.
- Rotate any exposed token immediately: revoke at the provider dashboard, create a new one, update `.env`, restart the service.
