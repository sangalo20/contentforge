// --- EXTERNAL API v1 (REST surface) ---
// The machine-facing pipeline surface. Every verb's logic lives in
// lib/v1Operations.js (shared with the MCP surface in routes/mcp.js); this
// router only adapts HTTP: params/body in, JSON out, V1Error -> the
// { error: { code, message } } envelope. Works with both auth kinds the
// middleware resolves (cfk_ API keys and Firebase sessions).
//
// Contract rules (docs/api-reference.md "External API v1" + docs/openapi.v1.json):
// - Errors are always { error: { code, message } }.
// - Responses never expose legacy Firestore shapes (TECH_DEBT #1); the
//   response shapes are a compatibility promise (TECH_DEBT #1b) — additive
//   changes only.
const express = require('express');
const ops = require('../lib/v1Operations');
const { V1Error } = require('../lib/v1Operations');

const router = express.Router();

// Wrap an operation call: send its result as JSON, map V1Error to the
// envelope, and 500 anything unexpected.
const handle = (fn) => async (req, res) => {
  try {
    res.status(fn.successStatus || 200).json(await fn(req));
  } catch (err) {
    if (err instanceof V1Error) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    console.error('[v1] Unexpected error:', err);
    res.status(500).json({ error: { code: 'internal', message: 'Internal error' } });
  }
};
const withStatus = (status, fn) => Object.assign(fn, { successStatus: status });

router.get('/api/v1/workspaces', handle((req) => ops.listWorkspaces(req.user)));

router.post('/api/v1/generations', handle(withStatus(202,
  (req) => ops.submitGeneration(req.user, req.body || {}))));

router.get('/api/v1/jobs/:id', handle((req) => ops.getJob(req.user, req.params.id)));

router.get('/api/v1/workspaces/:id/items', handle((req) =>
  ops.listItems(req.user, req.params.id, {
    status: req.query.status ? String(req.query.status) : null,
    limit: req.query.limit,
    cursor: req.query.cursor,
  })));

router.get('/api/v1/items/:id', handle((req) => ops.getItem(req.user, req.params.id)));

router.post('/api/v1/items', handle(withStatus(201, (req) =>
  ops.importArticle(req.user, req.body || {}))));

router.post('/api/v1/items/:id/finalize', handle((req) =>
  ops.finalizeItem(req.user, req.params.id, req.body?.draft)));

router.post('/api/v1/items/:id/publish', handle((req) =>
  ops.publishItem(req.user, req.params.id)));

router.get('/api/v1/workspaces/:id/reviewers', handle((req) =>
  ops.listReviewers(req.user, req.params.id)));

router.post('/api/v1/items/:id/review', handle((req) =>
  ops.submitItemReview(req.user, req.params.id, req.body || {})));

router.get('/api/v1/items/:id/comments', handle((req) =>
  ops.listComments(req.user, req.params.id)));

router.post('/api/v1/items/:id/comments', handle(withStatus(201, (req) =>
  ops.postItemComment(req.user, req.params.id, req.body || {}))));

router.get('/api/v1/workspaces/:id/socials', handle((req) =>
  ops.listSocials(req.user, req.params.id)));

router.get('/api/v1/items/:id/socials/:channel', handle((req) =>
  ops.getSocial(req.user, req.params.id, req.params.channel, req.query.format)));

router.post('/api/v1/items/:id/socials', handle(withStatus(201, (req) =>
  ops.generateSocial(req.user, req.params.id, req.body || {}))));

module.exports = router;
