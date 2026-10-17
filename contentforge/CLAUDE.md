# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ContentForge is a self-hosted AI content pipeline that turns source material — YouTube transcripts, web articles, pasted text/code, GitHub repos, and the workspace's Source Vault of banked transcripts (`backend/lib/sources/` registry) — into edited, published blog posts / newsletter issues. Three services; **two live in this repo** (`frontend/`, `backend/`), the third — the **Odin Agent** (FastAPI multi-agent orchestrator: Odin/Oscar/Hermes/Loki) — is a **sibling repo at `../odin-agent`**.

Flow: Browser (React 19 + Vite) → Express backend (`:3005`) → Odin (`:8000`). Data stores: Firestore `content_pipeline_library` (source of truth for library items), Firebase Storage (cover image bytes), Sanity CMS (written **only at publish time**; two projects — Moguls `fqfrsx19` and Real Rep `l4nrg0gu`).

## Commands

There is no root package.json — run commands inside `backend/` or `frontend/`.

**Backend** (`backend/`):
- Run: `node server.js` (port 3005; needs `.env` and `gcloud auth application-default login`)
- Test: `npm test` (vitest) · watch: `npm run test:watch`
- Single test file: `npx vitest run tests/authz.test.mjs`

**Frontend** (`frontend/`):
- Dev: `npm run dev` — port **5193**, pinned with `strictPort` because the Google OAuth trusted origin must not drift
- Lint: `npm run lint` — warnings gate as errors; CI fails on any
- Test: `npm test` · single file: `npx vitest run src/components/SocialLibrary.test.jsx`
- Build: `npm run build`

**CI** (`.github/workflows/ci.yml`, Node 22): backend `npm test`; frontend `npm run lint` + `npm test` + `npm run build`. All must pass.

## Backend architecture

`server.js` is a thin composition root: loads env (must happen before any lib/route require — tokens are captured at module load), installs structured logging (`logger.js` patches `console.*`), wires CORS allowlist → `express.json` → request logger → `authenticate`, then mounts route modules.

- `routes/` — one router per domain (workspaces, library, generate, publish, socials, reviews, comments, users, notifications, ops, v1, mcp). Routers use absolute paths; mount order doesn't matter. The external machine-facing surface (`/api/v1`) lives once in `lib/v1Operations.js` and is served by two thin adapters: `routes/v1.js` (REST, `{ error: { code, message } }` envelopes) and `routes/mcp.js` (remote MCP endpoint at `/api/v1/mcp`, one tool per verb). Its shapes are a compatibility promise (TECH_DEBT #1b): change only additively, and keep `docs/openapi.v1.json` in sync — `tests/openapi.contract.test.mjs` gates CI on spec↔router agreement.
- The generation pipeline itself lives in `lib/generationPipeline.js` and the Sanity publish in `lib/publishArticle.js` — shared by the app routes (SSE/blocking, `routes/generate.js` / `routes/publish.js`) and the `/api/v1` job executor (`lib/jobs.js`); change pipeline behavior there, not in a route.
- `lib/` — shared infrastructure: `firebase.js` (Firestore/Storage handles — also the test seam), `authenticate.js` (applied to **every** request; resolves Firebase bearer tokens AND `cfk_` API keys — see `lib/apiKeys.js` — to one `req.user` shape), `authz.js`/`guards.js`, `workspacesStore.js`, `sanityConnections.js` (the two named Sanity connections; workspaces reference them), `odinClient.js`, `reviewLifecycle.js`, `ssrf.js`.
- In production the backend serves the frontend's `dist/` (same origin — that's why `API_BASE` is `""` in prod).

## Frontend architecture

React 19, plain JSX (no TypeScript), Tailwind v4, `@/` alias → `src/`. Routing lives in `App.jsx`; main navigation is WorkspacesDashboard → WorkspaceLibrary → LibraryItemViewer, with `ImageChatModal`/`StudioChat` doing SSE chat against Odin.

- Auth: Firebase (`src/context/AuthContext.jsx`); all API calls go through `authFetch` in `src/lib/api.js`, which attaches the Firebase ID token. Odin's base URL is fetched at runtime from the backend's `/api/config`.
- A **workspace** is a content channel: AI persona (system prompt), Sanity destination, model config.
- `src/brand-studio/` is the **Brand Studio** (`/brand-studio`, lazy-loaded, full-bleed): on-brand graphics templates driven by the central Belrose brand registry in `brand-studio/brands.js` (Storage Moguls first). Templates never hardcode brand facts — add/adjust brands in the registry. AI backgrounds via `POST /api/brand-studio/generate-image` (Vertex Imagen, per-brand style prompts in `backend/routes/brandStudio.js`).

## Testing patterns

- Backend tests are `.mjs` files in `backend/tests/` using vitest + supertest. Firestore is faked via `tests/helpers/fakeFirestore.mjs` (`makeFakeDb(store)`) injected through the `lib/firebase.js` seam — use this instead of mocking firebase-admin.
- Frontend tests use vitest + Testing Library (jsdom, CSS disabled); `SocialMediaSyndication.test.jsx` is the reference mock pattern.

## Conventions and gotchas

- **Read `docs/TECH_DEBT.md` before large changes.** It's a living register: when you take on deliberate debt, add an entry (why parked + what triggers the fix); when you pay one off, delete the entry. If a feature would worsen an existing entry, address it or consciously re-park it.
- `docs/` is thorough and maintained — `architecture.md` (diagrams/data flows), `api-reference.md` (every route), `data-model.md` (Firestore/Storage/Sanity schemas), `configuration.md` (all env vars and Sanity tokens), `content-pipeline.md`, `troubleshooting.md`. Update the relevant doc when you change behavior.
- Legacy data shapes coexist in `content_pipeline_library` (see TECH_DEBT #1): readers must keep `pending_approval` mapping, `socials.<ch>.copy` fallbacks, and `|| 'approved'` status defaults until the migration script is applied.
- `backend/scripts/` holds operational scripts (e.g. `migrate-legacy-statuses.js` — dry-run by default, `--apply` writes to production Firestore; requires sign-off).
- `social-media-skills/` is an imported skill pack (22 SKILL.md procedures encoding brand voice, workflows, and quality gates) intended to be engrained into the app's content generation — it's reference material, not application code.
