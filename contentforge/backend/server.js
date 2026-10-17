// ContentForge backend — composition root. Loads env + logging, wires the
// Express middleware chain, and mounts the route modules. All route handlers
// live in routes/; shared infrastructure (Firebase handles, workspace store,
// guards, notifications, email, Odin client) lives in lib/.
const dotenv = require('dotenv');

// Load environment variables before anything reads process.env (the Sanity
// connection tokens and Firebase config are captured at module load, so this
// must run before any lib/route require).
dotenv.config();

// Structured logging (Cloud Logging on Cloud Run, readable console locally).
// install() patches console.* so every existing log line gets a real severity,
// and registers process-level crash logging. Must run before any logging.
const { install: installLogging, requestLogger } = require('./logger');
installLogging();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { authenticate } = require('./lib/authenticate');
const { initWorkspacesStore, sweepWorkspaceTrash } = require('./lib/workspacesStore');

const app = express();
const port = process.env.PORT || 3005;

// CORS allowlist (defense-in-depth). Restricts which browser origins may read
// API responses; auth is still enforced by the Firebase bearer token. Requests
// with no Origin header (same-origin, server-to-server, curl) are allowed.
// Disallowed cross-origin requests simply receive no CORS headers (the browser
// blocks the read) rather than a hard error. Override via CORS_ORIGINS.
const CORS_ORIGINS = (
  process.env.CORS_ORIGINS ||
  'https://contentforge.storagemoguls.ai,https://contentforge-951952818514.us-east4.run.app,https://contentforge-n5llhdmyoa-uk.a.run.app,http://localhost:5193'
)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || CORS_ORIGINS.includes(origin)),
}));
// 12mb: branded covers arrive as base64 PNG data URLs from the Brand Studio
// (PUT /api/library/:id/cover with imageData); everything else stays tiny.
app.use(express.json({ limit: '12mb' }));
// Trace-correlated request logging: one structured summary line per API call
// (method, path, status, latency, uid), 4xx at WARNING and 5xx at ERROR.
app.use(requestLogger);
app.use(authenticate);
// Machine callers (API keys) are rate-limited on EVERY route — they share
// this instance with the human-facing app. Human sessions are never limited.
app.use(require('./lib/rateLimit').apiKeyRateLimit);

// Route modules. Paths are absolute inside each router, so mount order only
// matters for readability — there are no overlapping patterns across modules.
app.use(require('./routes/users'));
app.use(require('./routes/apiKeys'));
app.use(require('./routes/notifications'));
app.use(require('./routes/comments'));
app.use(require('./routes/ops'));
app.use(require('./routes/workspaces'));
app.use(require('./routes/library'));
app.use(require('./routes/socials'));
app.use(require('./routes/reviews'));
app.use(require('./routes/publish'));
app.use(require('./routes/generate'));
app.use(require('./routes/brandStudio'));
app.use(require('./routes/designs'));
app.use(require('./routes/github'));
app.use(require('./routes/vault'));
app.use(require('./routes/v1'));
app.use(require('./routes/mcp'));

// --- FRONTEND SERVING (Production) ---
// Serve static files from the Vite build directory if we are running the
// unified container. (The /api/config route lives in routes/ops.js.)
const frontendDistPath = path.join(__dirname, 'public');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // Catch-all to serve index.html for client-side routing.
  // Express 5 (path-to-regexp v8) requires a named wildcard; bare '*' throws.
  app.get('/*splat', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Startup trash sweep, after boot settles.
setTimeout(sweepWorkspaceTrash, 15 * 1000);

// Load the workspace store before accepting traffic — every request path
// that touches workspace config assumes the cache is populated.
initWorkspacesStore()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Content Pipeline Backend running at http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize the workspace store:', err);
    process.exit(1);
  });
