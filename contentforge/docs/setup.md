# Local Development Setup

**Audience:** Engineers setting up for the first time.  
**Purpose:** Get all three services running locally end-to-end.

---

## Prerequisites

| Tool | Minimum version | Check |
| --- | --- | --- |
| Node.js | 18+ (26 recommended — needed for global `fetch`) | `node -v` |
| Python | 3.10+ | `python3 --version` |
| Google Cloud SDK | any | `gcloud --version` |
| Git | any | `git --version` |

---

## 1. Google Cloud credentials

The backend uses Firebase Admin SDK with **Application Default Credentials**. Run this once on your machine:

```bash
gcloud auth application-default login
```

This opens a browser to authenticate. The credentials are stored at `~/.config/gcloud/application_default_credentials.json` and are picked up automatically by `firebase-admin`.

> **Why?** The backend does not use a service account JSON file. It relies on ADC so that secrets stay off disk and credentials are managed by gcloud.

---

## 2. ContentForge Backend

```bash
cd contentforge/backend
cp .env.example .env
# Fill in the values (see docs/configuration.md)
npm install
node server.js
```

Expected output:
```
🚀 Content Pipeline Backend running at http://localhost:3005
```

Verify:
```bash
curl http://localhost:3005/api/health
# → {"status":"ok","message":"Backend is running"}
```

> **Note:** The backend runs on port `3005`. If another process is using it, identify it with `lsof -ti :3005` and kill it before starting.

---

## 3. ContentForge Frontend

```bash
cd contentforge/frontend
npm install
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:5193/
```

All frontend API calls go to the backend (`:3005` in dev via `authFetch`, same-origin in prod). The browser never talks to Odin directly — agent chat streams through the backend's SSE proxies, and Odin's base URL is fetched at runtime from `GET /api/config`.

---

## 4. Odin Agent Service

```bash
cd odin-agent
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in the values (see odin-agent/docs/configuration.md)
uvicorn main:app --port 8000 --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

> **`--reload`** watches `agents.py` and `main.py` for changes and restarts automatically.  
> **`.env` changes** require a manual restart even with `--reload` because environment variables are read at import time.

Warnings you can safely ignore:
```
BlobStorage init failed (continuing without): No module named 'redis'
P2P coordinator init failed (continuing without): No module named 'swim'
```
These are optional jarviscore features not needed for ContentForge.

---

## 5. Verify the full stack

1. Open `http://localhost:5193` — sign in; you should see the workspace dashboard.
2. Select a workspace → **The Forge** tab → stack a source (YouTube URL, article URL, or pasted text) → click **Generate**.
3. You should see SSE stage messages as the pipeline runs.
4. Open the generated library item → click **Generate Cover Image** to open the Odin chat.
5. (Optional, external API) In Settings → API Keys mint a key, then:
   ```bash
   curl -H 'Authorization: Bearer cfk_...' http://localhost:3005/api/v1/workspaces
   ```

---

## Running all three simultaneously

Open three terminal tabs:

```bash
# Tab 1
cd contentforge/backend && node server.js

# Tab 2
cd contentforge/frontend && npm run dev

# Tab 3
cd odin-agent && source venv/bin/activate && uvicorn main:app --port 8000 --reload
```

---

## Port reference

| Port | Service |
| --- | --- |
| 5193 | Frontend (Vite dev server — pinned with `strictPort` so the Google OAuth trusted origin never drifts) |
| 3005 | ContentForge Backend (Express) |
| 8000 | Odin Agent (FastAPI/uvicorn) |
