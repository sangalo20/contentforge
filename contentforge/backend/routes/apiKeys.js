// API key management (admin only, human sessions only). Keys are machine
// credentials for workbenches/scripts; minting returns the plaintext token
// exactly once, then only the SHA-256 hash and a display handle persist.
const express = require('express');
const { db, FieldValue, API_KEYS_COLLECTION } = require('../lib/firebase');
const { mintApiKey } = require('../lib/apiKeys');
const {
  requireAdmin,
  requireHumanSession,
  normalizeWorkspaceAccess,
  normalizeReviewerWorkspaces,
} = require('../lib/guards');

const router = express.Router();

// Keys may carry admin or creator rights, never owner: org-level destructive
// power stays with interactive owner sessions.
const KEY_ROLES = ['admin', 'creator'];

const toIso = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : null);

const publicKeyShape = (id, k) => ({
  id,
  name: k.name,
  display: k.display || null,
  role: k.role || 'creator',
  workspaceAccess: k.workspaceAccess ?? [],
  reviewerWorkspaces: k.reviewerWorkspaces ?? [],
  createdBy: k.createdBy || null,
  createdAt: toIso(k.createdAt),
  lastUsedAt: toIso(k.lastUsedAt),
  revokedAt: toIso(k.revokedAt),
});

// Mint a key. The response is the ONLY time the plaintext token is available.
router.post('/api/api-keys', requireHumanSession, requireAdmin, async (req, res) => {
  const { name, role = 'creator' } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'A key name is required' });
  }
  if (!KEY_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be admin or creator' });
  }
  const workspaceAccess = normalizeWorkspaceAccess(req.body?.workspaceAccess);
  if (workspaceAccess === null) {
    return res.status(400).json({ error: 'workspaceAccess must be "all" or an array of workspace ids' });
  }
  const reviewerWorkspaces = normalizeReviewerWorkspaces(req.body?.reviewerWorkspaces);
  if (reviewerWorkspaces === null) {
    return res.status(400).json({ error: 'reviewerWorkspaces must be "all" or an array of workspace ids' });
  }

  try {
    const { token, tokenHash, display } = mintApiKey();
    const doc = {
      name: String(name).trim(),
      tokenHash,
      display,
      role,
      workspaceAccess,
      reviewerWorkspaces,
      createdBy: req.user.email || req.user.uid,
      createdAt: FieldValue.serverTimestamp(),
      lastUsedAt: null,
      revokedAt: null,
    };
    const ref = await db.collection(API_KEYS_COLLECTION).add(doc);
    res.status(201).json({ ...publicKeyShape(ref.id, doc), createdAt: new Date().toISOString(), token });
  } catch (error) {
    console.error('Error minting API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// List all keys (never the hash or token), active first, newest first.
router.get('/api/api-keys', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection(API_KEYS_COLLECTION).get();
    const keys = snap.docs.map(d => publicKeyShape(d.id, d.data()));
    keys.sort((a, b) => {
      if (!!a.revokedAt !== !!b.revokedAt) return a.revokedAt ? 1 : -1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    res.json(keys);
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

// Revoke a key. Soft delete: the doc stays for the audit trail (createdBy,
// lastUsedAt), but authentication rejects it immediately.
router.delete('/api/api-keys/:id', requireHumanSession, requireAdmin, async (req, res) => {
  try {
    const ref = db.collection(API_KEYS_COLLECTION).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'API key not found' });
    await ref.set({ revokedAt: FieldValue.serverTimestamp(), revokedBy: req.user.email || req.user.uid }, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

module.exports = router;
