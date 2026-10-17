// Operational endpoints: liveness, readiness, AI spend rollup, frontend config.
const express = require('express');
const axios = require('axios');
const { db } = require('../lib/firebase');
const { requireAdmin } = require('../lib/guards');
const { odinRequestHeaders } = require('../lib/odinClient');
const { getWorkspaces, pingWorkspacesStore, workspacesCount } = require('../lib/workspacesStore');

const router = express.Router();

// Basic Health Check (liveness — cheap, no dependencies touched)
router.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Readiness / dependency health for monitoring (uptime checks, dashboards,
// and the future Odin monitoring hookup). Verifies each dependency and
// returns 503 when any is down so alerting can key off the status code.
router.get('/api/health/ready', async (req, res) => {
  const axios = require('axios');
  const checks = {};

  try {
    await pingWorkspacesStore();
    checks.firestore = 'ok';
  } catch (err) {
    checks.firestore = `error: ${err.message}`;
  }

  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
  try {
    const headers = await odinRequestHeaders(odinApiUrl, null);
    await axios.get(`${odinApiUrl}/`, { headers, timeout: 5000 });
    checks.odin = 'ok';
  } catch (err) {
    checks.odin = `error: ${err.message}`;
  }

  const healthy = Object.values(checks).every(v => v === 'ok');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    checks,
    uptimeSec: Math.round(process.uptime()),
    revision: process.env.K_REVISION || 'local',
    workspaces: workspacesCount(),
  });
});

// --- AI USAGE & COST ---

// Aggregated AI spend (admin only). Reads Odin's per-call ledger
// (content_pipeline_usage) and rolls it up by provider, agent, workspace and
// day. Costs are ESTIMATES from litellm price tables — reconcile against
// provider invoices; this exists for attribution and trends.
router.get('/api/usage/summary', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
    const cutoff = new Date(Date.now() - days * 86400000);
    const snapshot = await db.collection('content_pipeline_usage')
      .where('ts', '>=', cutoff)
      .get();

    const byProvider = {};
    const byAgent = {};
    const byWorkspace = {};
    const byDay = {};
    const byModel = {};
    let totalUsd = 0;
    let calls = 0;

    snapshot.forEach(doc => {
      const r = doc.data();
      const cost = typeof r.costUsd === 'number' ? r.costUsd : 0;
      totalUsd += cost;
      calls++;
      const add = (obj, key) => {
        const k = key || 'unknown';
        obj[k] = obj[k] || { costUsd: 0, calls: 0 };
        obj[k].costUsd += cost;
        obj[k].calls++;
      };
      add(byProvider, r.provider);
      add(byAgent, r.agent);
      add(byWorkspace, r.workspaceId);
      add(byModel, r.model);
      const ts = r.ts && typeof r.ts.toDate === 'function' ? r.ts.toDate() : null;
      if (ts) add(byDay, ts.toISOString().slice(0, 10));
    });

    // Attach workspace names for display.
    const wsNames = Object.fromEntries(getWorkspaces().map(w => [w.id, w.name]));
    const round = (obj) => Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, { ...v, costUsd: Math.round(v.costUsd * 10000) / 10000 }])
    );

    res.json({
      days,
      totalUsd: Math.round(totalUsd * 10000) / 10000,
      calls,
      byProvider: round(byProvider),
      byAgent: round(byAgent),
      byModel: round(byModel),
      byDay: round(byDay),
      byWorkspace: Object.fromEntries(
        Object.entries(round(byWorkspace)).map(([id, v]) => [id, { ...v, name: wsNames[id] || id }])
      ),
    });
  } catch (error) {
    console.error('Error building usage summary:', error);
    res.status(500).json({ error: 'Failed to load the usage summary' });
  }
});

// Frontend runtime config (public; the SPA loads this before it has a token).
router.get('/api/config', (req, res) => {
  res.json({
    ODIN_API_URL: process.env.ODIN_API_URL || 'http://localhost:8000'
  });
});

module.exports = router;
