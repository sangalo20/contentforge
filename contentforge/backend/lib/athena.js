// Athena MemOS client: long-term conversational memory for the agents.
// Backend-owned, like the vault — Odin stays closed-book and receives a
// pre-formatted memory block in the request payload. Every call here is
// best-effort: recall degrades to '' and writes are swallowed with a log
// line, because memory must never break a chat.
//
// Tenancy mapping: tenant_id = workspace id (memory is workspace-scoped,
// like the vault), user_id = operator uid, agent_id = 'odin' (one face —
// whichever specialist is talking, the memory belongs to Odin).
const axios = require('axios');

const base = () => (process.env.ATHENA_API_URL || '').replace(/\/$/, '');
const enabled = () => Boolean(base() && process.env.ATHENA_API_KEY);
const headers = () => ({ 'X-API-Key': process.env.ATHENA_API_KEY, 'Content-Type': 'application/json' });

// Session anchors are cheap Mongo docs; one per (workspace, user) per process
// keeps Athena's STM window coherent without threading ids through the UI.
const _sessions = new Map();

async function ensureSession(workspaceId, userId) {
  const key = `${workspaceId}:${userId}`;
  if (_sessions.has(key)) return _sessions.get(key);
  const res = await axios.post(`${base()}/api/v1/sessions`, {
    tenant_id: workspaceId,
    user_id: userId,
    agent_id: 'odin',
  }, { headers: headers(), timeout: 10_000 });
  const sid = res.data?.sessionId;
  if (!sid) throw new Error('Athena returned no sessionId');
  _sessions.set(key, sid);
  return sid;
}

// Record one completed user↔Odin exchange. Fire-and-forget from routes.
async function storeTurn(workspaceId, userId, userMessage, agentResponse) {
  if (!enabled()) return;
  if (!String(userMessage || '').trim() || !String(agentResponse || '').trim()) return;
  try {
    const sid = await ensureSession(workspaceId, userId);
    await axios.post(`${base()}/api/v1/sessions/${sid}/interactions`, {
      user_message: String(userMessage).slice(0, 4000),
      agent_response: String(agentResponse).slice(0, 4000),
    }, { headers: headers(), timeout: 10_000 });
  } catch (err) {
    console.warn(`Athena store skipped (${workspaceId}): ${err.message}`);
  }
}

// Record a typed cognitive event (thought / action / observation) — the
// agent's own behavior, not just what was said. Athena folds these into the
// same chains as messages, so recall can surface "read Day 019, proposed
// the feasibility angle" alongside the conversation. Fire-and-forget.
async function storeEvent(workspaceId, userId, { role = 'agent', type, content, metadata, payloadText, mimeType } = {}) {
  if (!enabled()) return;
  if (!String(content || '').trim() || !type) return;
  try {
    const sid = await ensureSession(workspaceId, userId);
    await axios.post(`${base()}/api/v1/sessions/${sid}/events`, {
      role,
      type,
      content: String(content).slice(0, 2000),
      metadata: metadata || {},
      // Claim Check: full artifacts ride as blob payloads (Athena offloads
      // them to GCS and keeps a blobUri on the event) — Athena's own heat
      // scoring and quality gates decide what consolidates; we don't pre-trim.
      ...(payloadText ? {
        payload: Buffer.from(String(payloadText)).toString('base64'),
        mime_type: mimeType || 'text/plain',
      } : {}),
    }, { headers: headers(), timeout: 15_000 });
  } catch (err) {
    console.warn(`Athena event skipped (${workspaceId}): ${err.message}`);
  }
}

// What Odin should remember going into this turn: consolidated episode
// summaries (MTM segments) plus semantic hits for the current query.
// Returns a plain-text block for the system prompt, or ''.
async function recallBlock(workspaceId, userId, query) {
  if (!enabled()) return '';
  try {
    const sid = await ensureSession(workspaceId, userId);
    const q = String(query || '').slice(0, 500);
    const [ctxRes, searchRes] = await Promise.allSettled([
      axios.get(`${base()}/api/v1/sessions/${sid}/context`, {
        params: q ? { query: q } : {},
        headers: headers(),
        timeout: 15_000,
      }),
      q ? axios.post(`${base()}/api/v1/sessions/${sid}/context/search`, { query: q }, {
        headers: headers(),
        timeout: 15_000,
      }) : Promise.reject(new Error('no query')),
    ]);

    const lines = [];
    const seen = new Set();
    const push = (text) => {
      const t = String(text || '').replace(/\s+/g, ' ').trim();
      if (t.length < 3 || seen.has(t)) return;
      seen.add(t);
      lines.push(`- ${t}`);
    };
    if (ctxRes.status === 'fulfilled') {
      for (const s of ctxRes.value.data?.segments || []) push(s.summary || s.topic);
    }
    if (searchRes.status === 'fulfilled') {
      for (const r of searchRes.value.data?.results || []) push(r.content);
    }
    return lines.join('\n').slice(0, 2000);
  } catch (err) {
    console.warn(`Athena recall skipped (${workspaceId}): ${err.message}`);
    return '';
  }
}

// Test seam
function _resetSessions() {
  _sessions.clear();
}

module.exports = { enabled, storeTurn, storeEvent, recallBlock, ensureSession, _resetSessions };
