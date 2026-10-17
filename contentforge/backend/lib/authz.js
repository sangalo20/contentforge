// Authorization predicates and normalizers — the pure core of the access
// model, kept dependency-free so it can be unit-tested without booting the
// server or Firestore.
//
// Global tier: owner ⊃ admin ⊃ creator. Owners are admins who can additionally
// delete workspaces and manage the owner role itself. Reviewing is NOT part of
// this axis — it is a per-workspace capability carried in the user's
// reviewerWorkspaces ('all' | [workspace ids]), grantable to anyone. Neither
// admins nor owners implicitly review.
const VALID_ROLES = ['owner', 'admin', 'creator'];
const isAdminRole = (role) => role === 'owner' || role === 'admin';

// Resolve a user's reviewer grants. The explicit field wins; the short-lived
// global 'reviewer' role reads as reviewer-everywhere until the user is edited.
const reviewerWorkspacesOf = (u) => {
  if (u?.reviewerWorkspaces !== undefined && u?.reviewerWorkspaces !== null) return u.reviewerWorkspaces;
  return u?.role === 'reviewer' ? 'all' : [];
};

// Whether a user may access content in a given workspace. 'all' (or a legacy
// undefined value) grants every workspace; otherwise access is limited to the
// ids in the user's workspaceAccess array.
const canAccessWorkspace = (user, workspaceId) => {
  const access = user?.workspaceAccess;
  if (access === 'all' || access === undefined || access === null) return true;
  return Array.isArray(access) && access.includes(workspaceId);
};

// Whether a user may review (approve / request changes) content in a workspace.
// Effective rights = reviewerWorkspaces ∩ workspaceAccess: you can only approve
// what you can see.
const canReviewWorkspace = (user, workspaceId) => {
  if (!canAccessWorkspace(user, workspaceId)) return false;
  const rw = reviewerWorkspacesOf(user);
  if (rw === 'all') return true;
  return Array.isArray(rw) && rw.includes(workspaceId);
};

// Validate/normalize a workspaceAccess value from a request against the set of
// existing workspace ids. Returns 'all', a deduped array of valid workspace
// ids, or null if the input shape is invalid.
function normalizeWorkspaceAccess(input, validWorkspaceIds) {
  if (input === 'all' || input === undefined || input === null) return 'all';
  if (!Array.isArray(input)) return null;
  const valid = new Set(validWorkspaceIds);
  return [...new Set(input.filter(id => valid.has(id)))];
}

// Same shape as workspaceAccess, but reviewer rights are OPT-IN: an absent
// value means no review grants, not all of them.
function normalizeReviewerWorkspaces(input, validWorkspaceIds) {
  if (input === undefined || input === null) return [];
  if (input === 'all') return 'all';
  if (!Array.isArray(input)) return null;
  const valid = new Set(validWorkspaceIds);
  return [...new Set(input.filter(id => valid.has(id)))];
}

module.exports = {
  VALID_ROLES,
  isAdminRole,
  reviewerWorkspacesOf,
  canAccessWorkspace,
  canReviewWorkspace,
  normalizeWorkspaceAccess,
  normalizeReviewerWorkspaces,
};
