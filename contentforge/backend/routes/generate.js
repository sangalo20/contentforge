// --- UNIFIED CONTENT GENERATION PIPELINE (HTTP entry points) ---
// The pipeline itself lives in lib/generationPipeline.js (shared with the
// /api/v1 job executor); these routes adapt it to the browser's two calling
// shapes — blocking JSON and SSE progress streaming — plus the Odin
// cover-image chat proxy and the composer's YouTube title probe.
const express = require('express');
const {
  GenerationRequestError,
  validateGenerationRequest,
  runGenerationPipeline,
} = require('../lib/generationPipeline');
const { SourceError } = require('../lib/sources');
const { odinRequestHeaders } = require('../lib/odinClient');
const { fetchVideoTitle } = require('../lib/sources/youtube');
const { videoIdOf, findByVideoId } = require('../lib/vault');

const router = express.Router();

// Live title check for the composer's YouTube cards. Best-effort: null when
// the video is private/unavailable — the card just keeps its raw URL. Also
// reports vault usage so the card can warn "already used in ..." on paste.
router.get('/api/sources/youtube-title', async (req, res) => {
  const url = String(req.query.url || '');
  const vid = videoIdOf(url);
  const [title, entry] = await Promise.all([
    fetchVideoTitle(url),
    vid ? findByVideoId(vid).catch(() => null) : null,
  ]);
  res.json({
    title,
    usedIn: (entry?.usedIn || []).map((u) => ({ title: u.title, kind: u.kind || null, date: u.date || null })),
  });
});

// --- ODIN CHAT PROXY (SSE) ---
// The browser streams cover-image chat from Odin through this backend proxy so
// Odin can stay backend-only (Cloud Run IAM). We authenticate the end user via
// the standard Firebase middleware, then forward the request to Odin with a
// Google-signed ID token and the user's identity, piping the SSE stream back.
router.post('/api/odin/chat/stream', async (req, res) => {
  const axios = require('axios');
  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
  try {
    // workspaceId rides along for usage attribution only.
    const headers = await odinRequestHeaders(odinApiUrl, req.user,
      req.body?.workspaceId ? { workspaceId: String(req.body.workspaceId) } : {});
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'text/event-stream';

    const upstream = await axios.post(`${odinApiUrl}/api/v1/chat/stream`, req.body, {
      headers,
      responseType: 'stream',
      // Streaming responses have no fixed length; never buffer or time out early.
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    upstream.data.pipe(res);
    upstream.data.on('error', (err) => {
      console.error('Odin chat stream error:', err.message);
      if (!res.headersSent) res.status(502).end();
      else res.end();
    });
    req.on('close', () => {
      if (upstream.data && typeof upstream.data.destroy === 'function') upstream.data.destroy();
    });
  } catch (error) {
    const status = error.response?.status || 502;
    console.error('Failed to proxy Odin chat stream:', error.message);
    if (!res.headersSent) res.status(status).json({ error: 'Failed to reach Odin' });
    else res.end();
  }
});

router.post('/api/generate/content', async (req, res) => {
  let validated;
  try {
    validated = validateGenerationRequest(req.user, req.body);
  } catch (err) {
    if (err instanceof GenerationRequestError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }

  try {
    console.log(`[Unified Pipeline] Starting generation for workspace: ${validated.workspace.name}`);
    const result = await runGenerationPipeline({ user: req.user, ...validated });
    if (result.existing) {
      return res.json({
        success: true,
        existing: true,
        message: 'These sources have already been generated together in the library!',
        libraryId: result.itemId
      });
    }
    res.json({
      success: true,
      message: 'Content generated successfully!',
      draft: result.draft,
      libraryId: result.itemId
    });
  } catch (error) {
    if (error instanceof SourceError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('[Unified Pipeline Error]', error);
    res.status(500).json({ error: error.message || 'Pipeline failed' });
  }
});

// --- STREAMING PIPELINE (Server-Sent Events) ---
// Emits the real stages of the generation pipeline as they happen so the
// frontend can display live progress instead of faked log lines.
router.post('/api/generate/content/stream', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  let validated;
  try {
    validated = validateGenerationRequest(req.user, req.body);
  } catch (err) {
    if (err instanceof GenerationRequestError) {
      send({ type: 'error', message: err.message });
      return res.end();
    }
    throw err;
  }

  try {
    console.log(`[Stream Pipeline] Starting generation for workspace: ${validated.workspace.name}`);
    const result = await runGenerationPipeline({
      user: req.user,
      ...validated,
      onStage: (message, level) => send({ type: 'stage', level, message }),
    });
    if (result.existing) {
      send({
        type: 'done',
        existing: true,
        message: 'These sources have already been generated together in the library!',
        libraryId: result.itemId
      });
      return res.end();
    }
    send({ type: 'stage', level: 'success', message: 'Done. Redirecting to your draft...' });
    send({
      type: 'done',
      existing: false,
      message: 'Content generated successfully!',
      draft: result.draft,
      libraryId: result.itemId
    });
    res.end();
  } catch (error) {
    if (!(error instanceof SourceError)) console.error('[Stream Pipeline Error]', error);
    send({ type: 'error', message: error.message || 'Pipeline failed' });
    res.end();
  }
});

module.exports = router;
