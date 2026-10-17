// Route guards and request-scoped authorization helpers. The pure predicates
// live in lib/authz.js; these wrap them with Express/Firestore specifics.
const { db, USERS_COLLECTION } = require('./firebase');
const authz = require('./authz');
const { isAdminRole, canAccessWorkspace } = require('./authz');
const { getWorkspaces } = require('./workspacesStore');

// Restrict a route to admins (owners included).
const requireAdmin = (req, res, next) => {
  if (!isAdminRole(req.user?.role)) {
    return res.status(403).json({ error: 'Admin privileges required' });
  }
  next();
};

// Restrict a route to interactively signed-in users. Applied to credential
// management (users, invites, API keys) so a leaked or over-scoped API key can
// never mint further credentials or expand its own access.
const requireHumanSession = (req, res, next) => {
  if (req.user?.apiKey) {
    return res.status(403).json({ error: 'API keys cannot perform this action' });
  }
  next();
};

// Restrict a route to owners only (destructive, org-level actions).
const requireOwner = (req, res, next) => {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Owner privileges required' });
  }
  next();
};

// Whether any owner exists yet. Used to bootstrap: until one does, an admin may
// assign the first owner (including themselves); after that, only owners manage
// the owner role.
const ownerExists = async () => {
  const snap = await db.collection(USERS_COLLECTION).where('role', '==', 'owner').limit(1).get();
  return !snap.empty;
};

// Guard an item-keyed route: 403 unless the user can access the workspace the
// library item belongs to.
const requireItemWorkspaceAccess = async (req, res, itemId) => {
  const doc = await db.collection('content_pipeline_library').doc(itemId).get();
  if (!doc.exists) {
    res.status(404).json({ error: 'Item not found' });
    return null;
  }
  const wid = doc.data().workspaceId || null;
  if (wid && !canAccessWorkspace(req.user, wid)) {
    res.status(403).json({ error: 'You do not have access to this workspace' });
    return null;
  }
  return doc;
};

// Request-supplied access/reviewer values, normalized against the workspaces
// that actually exist (the pure normalizers live in lib/authz.js).
const normalizeWorkspaceAccess = (input) =>
  authz.normalizeWorkspaceAccess(input, getWorkspaces().map(w => w.id));
const normalizeReviewerWorkspaces = (input) =>
  authz.normalizeReviewerWorkspaces(input, getWorkspaces().map(w => w.id));

module.exports = {
  requireAdmin,
  requireOwner,
  requireHumanSession,
  ownerExists,
  requireItemWorkspaceAccess,
  normalizeWorkspaceAccess,
  normalizeReviewerWorkspaces,
};
