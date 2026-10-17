// Structured logging for Google Cloud Logging (readable console locally).
//
// On Cloud Run (K_SERVICE set), every line printed to stdout as single-line
// JSON becomes a structured log entry: `severity` drives the entry severity,
// `message` the text, and `logging.googleapis.com/trace` groups a request's
// app logs under its request log in Logs Explorer. Locally, logs stay as
// plain readable console output.
//
// install() also patches the global console so the ~200 existing
// console.log/warn/error calls across the monolith emit correct severities
// without touching every call site.

const { AsyncLocalStorage } = require('async_hooks');

const ON_CLOUD_RUN = !!process.env.K_SERVICE;
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || '';

// Originals, captured before install() patches the console.
const raw = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

// Per-request context (trace id, user) set by the request middleware.
const requestContext = new AsyncLocalStorage();

function safeString(value) {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function emit(severity, args, fields = {}) {
  if (!ON_CLOUD_RUN) {
    const fn = severity === 'ERROR' || severity === 'CRITICAL' ? raw.error
      : severity === 'WARNING' ? raw.warn : raw.log;
    fn(...args);
    return;
  }
  const ctx = requestContext.getStore() || {};
  const entry = {
    severity,
    message: args.map(safeString).join(' '),
    ...fields,
  };
  if (ctx.trace) entry['logging.googleapis.com/trace'] = ctx.trace;
  if (ctx.uid && !entry.uid) entry.uid = ctx.uid;
  raw.log(JSON.stringify(entry));
}

// DEBUG lines are suppressed unless LOG_LEVEL=DEBUG (cheap way to dial
// verbosity up in an incident without a code change).
const DEBUG_ENABLED = (process.env.LOG_LEVEL || '').toUpperCase() === 'DEBUG';

const log = {
  debug: (...args) => { if (DEBUG_ENABLED) emit('DEBUG', args); },
  info: (...args) => emit('INFO', args),
  warn: (...args) => emit('WARNING', args),
  error: (...args) => emit('ERROR', args),
  critical: (...args) => emit('CRITICAL', args),

  // Business events with structured, queryable fields. In Logs Explorer:
  //   jsonPayload.event="generation.completed" AND jsonPayload.workspaceId="..."
  // Locally they print as one readable line.
  event: (name, fields = {}) => {
    if (!ON_CLOUD_RUN) {
      raw.log(`[event] ${name}`, JSON.stringify(fields));
      return;
    }
    emit('INFO', [name], { event: name, ...fields });
  },
};

// Express middleware: establishes trace correlation for all logs emitted while
// handling the request, and writes one structured summary line per API request
// (method, path, status, latency, user) — 5xx at ERROR, 4xx at WARNING.
function requestLogger(req, res, next) {
  const traceHeader = req.get('x-cloud-trace-context');
  const trace = traceHeader && PROJECT_ID
    ? `projects/${PROJECT_ID}/traces/${traceHeader.split('/')[0]}`
    : null;
  const startedAt = Date.now();

  res.on('finish', () => {
    // Health probes and static assets would drown the signal.
    if (!req.path.startsWith('/api/') || req.path.startsWith('/api/health')) return;
    const severity = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO';
    emit(severity, [`${req.method} ${req.path} ${res.statusCode}`], {
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${((Date.now() - startedAt) / 1000).toFixed(3)}s`,
      },
      uid: req.user?.uid || null,
      ...(trace ? { 'logging.googleapis.com/trace': trace } : {}),
    });
  });

  requestContext.run({ trace }, next);
}

// Lets the auth middleware attach the user to the logging context so every
// log line emitted during the request carries the uid.
function setContextUser(user) {
  const ctx = requestContext.getStore();
  if (ctx && user) ctx.uid = user.uid;
}

// Route existing console.* calls through the structured emitter, and log
// process-level failures that would otherwise vanish.
function install() {
  console.log = (...args) => emit('INFO', args);
  console.info = (...args) => emit('INFO', args);
  console.warn = (...args) => emit('WARNING', args);
  console.error = (...args) => emit('ERROR', args);

  process.on('unhandledRejection', (reason) => {
    emit('ERROR', ['Unhandled promise rejection:', reason]);
  });
  process.on('uncaughtException', (err) => {
    emit('CRITICAL', ['Uncaught exception:', err]);
    // Crash after logging: Cloud Run replaces the instance; a process in an
    // unknown state must not keep serving traffic.
    process.exit(1);
  });
}

module.exports = { log, install, requestLogger, setContextUser };
