// Deletion/archive rules for social assets, as pure predicates (the statuses
// come from the review state machine in reviewLifecycle.js).
//
// Disposable content (draft/finalized) may be hard-deleted by any workspace
// member. Approved content is accountable — it was signed off and likely
// published — so it can only be ARCHIVED (reversible, record kept), and only
// by its recorded approver or an admin. Content under active review must be
// withdrawn first. Legacy assets with no status read as approved (see
// TECH_DEBT #1) and carry no approver, which lands them in the admin-only arm.
const { isAdminRole } = require('./authz');

// Same legacy default every reader applies: no status means approved.
const effectiveStatus = (saved) => saved?.status || 'approved';

const isDeletable = (status) => ['draft', 'finalized'].includes(status);
const isArchivable = (status) => status === 'approved';

// Approver sign-off: the recorded approver themselves, or an admin as the
// escape hatch (the approver may have left, or legacy content has no approver
// on record at all).
const canArchiveApproved = (review, user) =>
  isAdminRole(user?.role) || (!!review?.decidedBy && review.decidedBy === user?.uid);

module.exports = { effectiveStatus, isDeletable, isArchivable, canArchiveApproved };
