// The Source Vault API: the org-wide transcript ledger (list/read), staging
// new URLs, watched-channel management, and channel sync. Reading and staging
// are open to every member (the vault is shared working material); channel
// config is admin-only. Full entry text loads on demand, never in the list.
const express = require('express');
const axios = require('axios');
const { db } = require('../lib/firebase');
const { requireAdmin } = require('../lib/guards');
const { canAccessWorkspace } = require('../lib/authz');
const { getWorkspaces } = require('../lib/workspacesStore');
const { odinRequestHeaders } = require('../lib/odinClient');
const { runOdinToolLoop } = require('../lib/odinStream');
const vault = require('../lib/vault');
const athena = require('../lib/athena');
const { log: logger } = require('../logger');

const router = express.Router();

// The ledger. Also reports channel config + sync staleness so the UI can
// auto-sync opportunistically (the "runs about weekly" behavior without cron:
// any vault visit after 7 days triggers a sync from the client).
router.get('/api/vault', async (req, res) => {
  const workspaceId = String(req.query.workspaceId || '');
  if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });
  if (!canAccessWorkspace(req.user, workspaceId)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  try {
    const [entries, config] = await Promise.all([vault.listEntries(workspaceId), vault.vaultConfig()]);
    const channels = (config.channels || []).filter((c) => c.workspaceId === workspaceId);
    res.json({
      entries,
      channels,
      lastSyncAt: config.lastSyncAt || null,
      syncStale: channels.length > 0 && vault.syncIsStale(config),
    });
  } catch (error) {
    console.error('Failed to list the vault:', error);
    res.status(500).json({ error: 'Failed to load the Source Vault' });
  }
});

// Full text of one entry (preview in the vault UI).
router.get('/api/vault/:id/text', async (req, res) => {
  try {
    const entry = await vault.getEntry(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Vault entry not found' });
    if (!(entry.workspaceIds || []).some((w) => canAccessWorkspace(req.user, w))) {
      return res.status(403).json({ error: 'You do not have access to this entry' });
    }
    res.json({ id: entry.id, title: entry.title, text: entry.text || '' });
  } catch (error) {
    console.error('Failed to read vault entry:', error);
    res.status(500).json({ error: 'Failed to read the vault entry' });
  }
});

// Stage YouTube URLs into the vault (transcripts fetched now, compose later).
router.post('/api/vault/stage', async (req, res) => {
  const urls = Array.isArray(req.body?.urls) ? req.body.urls.map(String).filter(Boolean) : [];
  const workspaceId = String(req.body?.workspaceId || '');
  if (!urls.length || urls.length > 20 || !workspaceId) {
    return res.status(400).json({ error: 'Provide 1–20 YouTube URLs and a workspaceId.' });
  }
  if (!canAccessWorkspace(req.user, workspaceId)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  const staged = [];
  const failed = [];
  let existed = 0;
  for (const url of urls) {
    try {
      const out = await vault.stageYoutubeUrl(url, { workspaceId, addedBy: req.user.uid, user: req.user });
      if (out.existed) existed++;
      else staged.push({ id: out.entry.id, title: out.entry.title });
    } catch (err) {
      failed.push({ url, error: err.message });
    }
  }
  logger.event('vault.staged', { by: req.user.uid, staged: staged.length, existed, failed: failed.length });
  res.json({ staged, existed, failed });
});

// Watched channels (admin): each { id: '@handle'|url|channelId, label }.
router.put('/api/vault/channels', requireAdmin, async (req, res) => {
  const raw = Array.isArray(req.body?.channels) ? req.body.channels : null;
  if (!raw || raw.length > 10) return res.status(400).json({ error: 'Provide up to 10 channels.' });
  const channels = raw
    .map((c) => ({
      id: String(c.id || '').trim(),
      label: String(c.label || '').trim() || String(c.id || '').trim(),
      workspaceId: String(c.workspaceId || '').trim(),
    }))
    .filter((c) => c.id && c.workspaceId);
  await vault.setChannels(channels);
  logger.event('vault.channels.updated', { by: req.user.uid, count: channels.length });
  res.json({ channels });
});

// Sync watched channels now. Any member may trigger it (it only ADDS unused
// entries); the UI calls this automatically when the vault is stale.
router.post('/api/vault/sync', async (req, res) => {
  try {
    const report = await vault.syncChannels({ addedBy: req.user.uid, user: req.user });
    logger.event('vault.synced', {
      by: req.user.uid,
      added: report.added.length,
      failed: report.failed.length,
      skippedExisting: report.skippedExisting,
    });
    res.json(report);
  } catch (error) {
    console.error('Vault sync failed:', error.message);
    res.status(502).json({ error: error.message });
  }
});

// Scouting session with Mimir (SSE): the operator converses over this
// workspace's vault digest to pick transcripts for the next piece. We build
// the digest and gather recent article titles server-side, then pipe Odin's
// stream back — same proxy shape as the Loki studio chat.
router.post('/api/vault/scout/stream', async (req, res) => {
  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
  try {
    const { workspaceId, message, history } = req.body || {};
    if (!workspaceId || !message) {
      return res.status(400).json({ error: 'workspaceId and message are required.' });
    }
    if (!canAccessWorkspace(req.user, workspaceId)) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }
    const workspace = getWorkspaces().find((w) => w.id === workspaceId);
    if (!workspace || workspace.deletedAt) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // SSE starts here: stream real progress (with actual vault numbers)
    // while the digest is built and Odin spins up, instead of a static
    // placeholder in the client.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    send({ type: 'status', content: 'Taking stock of the vault...' });
    const digest = await vault.scoutDigest(workspaceId);
    const unusedHere = digest.filter((e) => !e.usedHere).length;
    send({ type: 'status', content: `Odin is reading the vault — ${digest.length} entries, ${unusedHere} unused here...` });

    // Recent content, newest first — what the workspace has already said.
    const librarySnap = await db.collection('content_pipeline_library')
      .where('workspaceId', '==', workspaceId)
      .get();
    const recent = [];
    librarySnap.forEach((doc) => {
      const d = doc.data();
      if (d.sourceType === 'original') return;
      const title = d.draft?.match(/^(?:#+)\s+(.+?)(?:\n|$)/m)?.[1]?.replace(/(\*\*|\*)/g, '').trim();
      if (title) recent.push({ title, at: d.createdAt?._seconds || 0 });
    });
    recent.sort((a, b) => b.at - a.at);

    const headers = await odinRequestHeaders(odinApiUrl, req.user, { workspaceId });
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'text/event-stream';

    // What Odin remembers about this workspace's past sessions (Athena).
    const memory = await athena.recallBlock(workspaceId, req.user.uid, message);

    const callOdin = (convo, turnMessage) => axios.post(`${odinApiUrl}/api/v1/vault/scout/stream`, {
      message: turnMessage,
      workspaceName: workspace.name,
      personaPrompt: workspace.systemPrompt || '',
      vaultDigest: digest,
      recentContent: recent.slice(0, 12).map((r) => r.title),
      memory,
      context: { history: convo },
    }, {
      headers,
      responseType: 'stream',
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Mimir is closed-book: it sees the digest, not the vault or Athena. Its
    // tool calls (transcript reads, memory searches) execute here — where
    // authz, Firestore, and Athena live — via the shared agentic loop.
    const MAX_READS = 3;
    let readsUsed = 0;
    const { spokenText } = await runOdinToolLoop({
      req,
      callOdin,
      message,
      history,
      send,
      executors: {
        read_transcript: async (tc) => {
          if (readsUsed >= MAX_READS) {
            return 'Reading limit reached for this turn — decide from what you already know.';
          }
          readsUsed++;
          const entry = await vault.getEntry(tc.vaultId);
          if (!entry || !(entry.workspaceIds || []).includes(workspaceId)) {
            return "That entry is not in this workspace's vault.";
          }
          send({ type: 'status', content: `Odin is reading “${entry.title}”...` });
          return (entry.text || '').slice(0, 6000) || '(this entry has no transcript text)';
        },
        search_memory: async (tc) => {
          send({ type: 'status', content: 'Odin is searching memory...' });
          const found = await athena.recallBlock(workspaceId, req.user.uid, tc.query);
          return found || '(nothing found in long-term memory)';
        },
      },
      // Typed memory: the agent's own moves become action/observation events,
      // so chains remember WHAT Odin did, not only what was said.
      onTool: async (tc, result) => {
        const what = tc.name === 'read_transcript'
          ? `Read vault transcript ${tc.vaultId} while scouting`
          : `Searched long-term memory for: ${tc.query}`;
        await athena.storeEvent(workspaceId, req.user.uid, { type: 'action', content: what, metadata: { tool: tc.name } });
        await athena.storeEvent(workspaceId, req.user.uid, {
          type: 'observation',
          content: String(result).slice(0, 400),
          metadata: { tool: tc.name },
          // Full result rides as a blob; Athena sieves, we don't pre-trim.
          ...(String(result).length > 400 ? { payloadText: String(result), mimeType: 'text/plain' } : {}),
        });
      },
    });
    res.end();
    // Remember the exchange (fire-and-forget; never blocks the response).
    athena.storeTurn(workspaceId, req.user.uid, message, spokenText);
  } catch (error) {
    console.error('Failed to proxy vault scout stream:', error.message);
    if (!res.headersSent) {
      res.status(error.response?.status || 502).json({ error: 'Failed to reach the scout' });
    } else {
      // Headers already streaming: deliver the failure as an SSE event.
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Could not reach Odin. Try again in a moment.' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
