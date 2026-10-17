// Workspace CRUD, trash lifecycle, the dashboard snapshot, and reviewer lists.
const express = require('express');
const { db, USERS_COLLECTION } = require('../lib/firebase');
const { canAccessWorkspace, canReviewWorkspace, isAdminRole } = require('../lib/authz');
const { requireAdmin, requireOwner } = require('../lib/guards');
const { SANITY_CONNECTIONS } = require('../lib/sanityConnections');
const {
  getWorkspaces,
  saveWorkspaces,
  sweepWorkspaceTrash,
  purgeWorkspace,
  trashPurgeAt,
  WORKSPACE_TRASH_DAYS,
} = require('../lib/workspacesStore');
const { itemTitleOf } = require('../lib/reviewTargets');

const router = express.Router();

// --- WORKSPACE CRUD ROUTES ---

// List the available Sanity connections (labels only — never tokens) so the
// workspace editor can offer them as publishing destinations.
router.get('/api/sanity/connections', (req, res) => {
  res.json(Object.entries(SANITY_CONNECTIONS).map(([key, c]) => ({
    key,
    label: c.label,
    schemaType: c.schemaType,
  })));
});

// GET all workspaces
router.get('/api/workspaces', (req, res) => {
  try {
    const workspaces = getWorkspaces();
    // Scope to the workspaces this user may access, excluding trashed ones
    // (trash is a separate admin view). Admins/full-access users ('all') see
    // everything; scoped users only see their granted workspaces.
    const visible = workspaces.filter(w => !w.deletedAt && canAccessWorkspace(req.user, w.id));
    res.json(visible);
    // Opportunistic sweep: purge anything whose trash retention has lapsed.
    sweepWorkspaceTrash();
  } catch (error) {
    res.status(500).json({ error: 'Failed to read workspaces' });
  }
});

// POST new workspace
router.post('/api/workspaces', requireAdmin, async (req, res) => {
  try {
    const workspaces = getWorkspaces();
    const newWorkspace = {
      id: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: req.body.name,
      description: req.body.description || '',
      theme: req.body.theme || '#6366f1',
      // Publishing: a named Sanity connection key, or '' for draft-only.
      sanityConnection: SANITY_CONNECTIONS[req.body.sanityConnection] ? req.body.sanityConnection : '',
      destination: SANITY_CONNECTIONS[req.body.sanityConnection] ? 'Sanity' : (req.body.destination || 'Markdown'),
      systemPrompt: req.body.systemPrompt || '',
      // When true, articles must be reviewer-approved before publishing to
      // Sanity (and social pieces carry an awaiting-review state until approved).
      requireReview: !!req.body.requireReview
    };
    workspaces.push(newWorkspace);
    saveWorkspaces(workspaces);

    // Self-grant: creating a workspace must never lock the creator out of it.
    // A scoped admin (workspaceAccess is an array) gets the new id appended to
    // their grants; 'all'-access users already see everything. As an admin
    // they can then grant teammates access from the Admin → Team screen.
    if (Array.isArray(req.user.workspaceAccess)) {
      await db.collection(USERS_COLLECTION).doc(req.user.uid).set({
        workspaceAccess: [...new Set([...req.user.workspaceAccess, newWorkspace.id])],
      }, { merge: true });
    }

    res.status(201).json(newWorkspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// PUT update workspace
router.put('/api/workspaces/:id', requireAdmin, (req, res) => {
  try {
    const workspaces = getWorkspaces();
    const index = workspaces.findIndex(w => w.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Workspace not found' });

    workspaces[index] = { ...workspaces[index], ...req.body, id: req.params.id };
    saveWorkspaces(workspaces);
    res.json(workspaces[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// DELETE a workspace — owner only. Default: move to trash (recoverable for
// WORKSPACE_TRASH_DAYS). With ?purge=true: the permanent cascade, immediately.
router.delete('/api/workspaces/:id', requireOwner, async (req, res) => {
  const wid = req.params.id;
  try {
    const workspaces = getWorkspaces();
    const ws = workspaces.find(w => w.id === wid);
    if (!ws) return res.status(404).json({ error: 'Workspace not found' });

    if (req.query.purge === 'true') {
      const deletedItems = await purgeWorkspace(wid);
      console.log(`[Workspace] "${wid}" PURGED by ${req.user.email} (${deletedItems} items removed)`);
      return res.json({ success: true, purged: true, deletedItems });
    }

    ws.deletedAt = new Date().toISOString();
    ws.deletedBy = req.user.email || req.user.uid;
    saveWorkspaces(workspaces);
    console.log(`[Workspace] "${wid}" moved to trash by ${req.user.email}`);
    res.json({ success: true, purged: false, purgeAt: trashPurgeAt(ws.deletedAt).toISOString(), retentionDays: WORKSPACE_TRASH_DAYS });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete the workspace' });
  }
});

// List trashed workspaces (admins can see; owners act).
router.get('/api/workspaces-trash', requireAdmin, (req, res) => {
  try {
    const trashed = getWorkspaces()
      .filter(w => w.deletedAt)
      .map(w => {
        const purgeAt = trashPurgeAt(w.deletedAt);
        return {
          id: w.id,
          name: w.name,
          theme: w.theme || '#64748b',
          deletedAt: w.deletedAt,
          deletedBy: w.deletedBy || null,
          purgeAt: purgeAt.toISOString(),
          daysLeft: Math.max(0, Math.ceil((purgeAt - new Date()) / 86400000)),
        };
      })
      .sort((a, b) => new Date(a.purgeAt) - new Date(b.purgeAt));
    res.json({ retentionDays: WORKSPACE_TRASH_DAYS, trashed });
  } catch (error) {
    console.error('Error listing workspace trash:', error);
    res.status(500).json({ error: 'Failed to load the trash' });
  }
});

// Restore a trashed workspace — owner only, fully non-destructive.
router.post('/api/workspaces/:id/restore', requireOwner, async (req, res) => {
  try {
    const workspaces = getWorkspaces();
    const ws = workspaces.find(w => w.id === req.params.id);
    if (!ws || !ws.deletedAt) return res.status(404).json({ error: 'Workspace not found in trash' });
    delete ws.deletedAt;
    delete ws.deletedBy;
    saveWorkspaces(workspaces);

    // Same self-grant as creation: restoring must never leave the restorer
    // unable to see what they just brought back. Only matters for the unusual
    // scoped owner; 'all'-access owners are untouched.
    if (Array.isArray(req.user.workspaceAccess) && !req.user.workspaceAccess.includes(ws.id)) {
      await db.collection(USERS_COLLECTION).doc(req.user.uid).set({
        workspaceAccess: [...req.user.workspaceAccess, ws.id],
      }, { merge: true });
    }

    console.log(`[Workspace] "${ws.id}" restored from trash by ${req.user.email}`);
    res.json({ success: true, workspace: ws });
  } catch (error) {
    console.error('Error restoring workspace:', error);
    res.status(500).json({ error: 'Failed to restore the workspace' });
  }
});

// Aggregated snapshot for the workspace dashboard: lifecycle counts, the
// review queue, attention items, and recent work — one pass over the library.
router.get('/api/workspaces/:id/dashboard', async (req, res) => {
  if (!canAccessWorkspace(req.user, req.params.id)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  try {
    const wid = req.params.id;
    const snapshot = await db.collection('content_pipeline_library')
      .where('workspaceId', '==', wid)
      .get();

    const toMillis = (ts) => (ts && typeof ts.toMillis === 'function') ? ts.toMillis() : (ts?._seconds ? ts._seconds * 1000 : null);

    const articleCounts = { draft: 0, finalized: 0, in_review: 0, approved: 0, published: 0 };
    const socialCounts = { total: 0, draft: 0, finalized: 0, in_review: 0, approved: 0 };
    const inReview = [];          // active review queue: articles + social pieces
    const changesRequested = [];  // sent back to draft by a reviewer
    const approvedUnpublished = []; // reviewer-approved articles awaiting publish
    const items = [];
    const socials = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      const title = itemTitleOf(d);
      const createdAt = toMillis(d.createdAt);
      // Original-idea items are social-only: no article lifecycle, so they
      // skip the article funnel and only count through their socials below.
      if (d.sourceType !== 'original') {
        // 'pending_approval' is the legacy name for a freshly generated article —
        // semantically it IS the draft state, so bucket it there for the funnel.
        const rawStatus = d.status || 'draft';
        const status = rawStatus === 'pending_approval' ? 'draft' : rawStatus;
        if (articleCounts[status] !== undefined) articleCounts[status]++;
        items.push({ id: doc.id, title, status, coverUrl: d.coverImage?.url || null, createdAt });

        const link = `/workspace/${wid}/library/item/${doc.id}`;
        if (status === 'in_review') {
          inReview.push({
            itemId: doc.id, kind: 'article', channel: null, title, link,
            reviewers: d.review?.reviewers || [],
            requestedBy: d.review?.requestedBy || null,
            requestedByEmail: d.review?.requestedByEmail || null,
            requestedAt: toMillis(d.review?.requestedAt),
            note: d.review?.note || null,
          });
        }
        if (status === 'draft' && d.review?.decision === 'request_changes') {
          changesRequested.push({
            itemId: doc.id, kind: 'article', channel: null, title, link,
            requestedBy: d.review?.requestedBy || null,
            comment: d.review?.comment || null,
            decidedByEmail: d.review?.decidedByEmail || null,
          });
        }
        if (status === 'approved') {
          approvedUnpublished.push({ itemId: doc.id, title, link });
        }
      }

      for (const [key, val] of Object.entries(d.socials || {})) {
        if (!val || typeof val !== 'object') continue;
        let channel, kind;
        if (key.endsWith('_carousel')) { channel = key.slice(0, -'_carousel'.length); kind = 'carousel'; }
        else if (key.endsWith('_poster')) { channel = key.slice(0, -'_poster'.length); kind = 'poster'; }
        else { channel = key; kind = 'text'; }
        if (!['linkedin', 'x'].includes(channel)) continue;

        const sStatus = val.status || 'approved';
        socialCounts.total++;
        if (socialCounts[sStatus] !== undefined) socialCounts[sStatus]++;
        const sLink = `/workspace/${wid}/library/item/${doc.id}/social/${channel}?kind=${kind}`;
        socials.push({ itemId: doc.id, channel, kind, status: sStatus, title, link: sLink, generatedAt: toMillis(val.generatedAt) });

        if (sStatus === 'in_review') {
          inReview.push({
            itemId: doc.id, kind, channel, title, link: sLink,
            reviewers: val.review?.reviewers || [],
            requestedBy: val.review?.requestedBy || null,
            requestedByEmail: val.review?.requestedByEmail || null,
            requestedAt: toMillis(val.review?.requestedAt),
            note: val.review?.note || null,
          });
        }
        if (sStatus === 'draft' && val.review?.decision === 'request_changes') {
          changesRequested.push({
            itemId: doc.id, kind, channel, title, link: sLink,
            requestedBy: val.review?.requestedBy || null,
            comment: val.review?.comment || null,
            decidedByEmail: val.review?.decidedByEmail || null,
          });
        }
      }
    });

    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    socials.sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));
    inReview.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));

    res.json({
      articleCounts,
      socialCounts,
      totalItems: items.length,
      inReview,
      changesRequested,
      approvedUnpublished,
      recentItems: items.slice(0, 6),
      recentSocials: socials.slice(0, 6),
      canReviewHere: canReviewWorkspace(req.user, wid),
    });
  } catch (error) {
    console.error('Error building workspace dashboard:', error);
    res.status(500).json({ error: 'Failed to load the dashboard' });
  }
});

// List the reviewers eligible for a workspace (per-workspace reviewer grant +
// workspace access; admins are NOT implicitly reviewers).
router.get('/api/workspaces/:id/reviewers', async (req, res) => {
  if (!canAccessWorkspace(req.user, req.params.id)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  try {
    const snap = await db.collection(USERS_COLLECTION).get();
    const reviewers = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => canReviewWorkspace(u, req.params.id))
      .map(u => ({ uid: u.uid, email: u.email || '', role: isAdminRole(u.role) ? u.role : 'creator' }));
    reviewers.sort((a, b) => a.email.localeCompare(b.email));
    res.json(reviewers);
  } catch (error) {
    console.error('Error listing reviewers:', error);
    res.status(500).json({ error: 'Failed to load reviewers' });
  }
});

module.exports = router;
