// The review state machine, as pure rules. Lifecycle everywhere is
// draft -> finalized (creator done) -> in_review -> approved (reviewer-only,
// via /api/reviews/decide) -> published (articles). Request-changes returns
// content to draft. Routes own the persistence and notifications; the legal
// transitions live here so they can be unit-tested.
const { isAdminRole } = require('./authz');

const VALID_DECISIONS = ['approve', 'request_changes'];

// A review submission on content already in_review is an UPDATE of the active
// review (add/remove reviewers, change the note), not a new submission.
const isActiveReview = (status) => status === 'in_review';

// Fresh submissions are only legal from finalized (or already-approved legacy)
// content — drafts must be finalized first.
const canStartReview = (status) => ['finalized', 'approved'].includes(status);

// Only the original requester or an admin may alter or withdraw an active
// review. A review record without a requester (legacy) is open to anyone.
const canManageActiveReview = (review, user) =>
  !review?.requestedBy || review.requestedBy === user?.uid || isAdminRole(user?.role);

// Withdrawing puts content back to finalized; only an active review can be
// withdrawn or decided.
const canWithdraw = isActiveReview;
const canDecide = isActiveReview;

// approve -> approved; request_changes -> back to draft for the creator.
// Returns null for an unknown decision.
const statusAfterDecision = (decision) => {
  if (decision === 'approve') return 'approved';
  if (decision === 'request_changes') return 'draft';
  return null;
};

module.exports = {
  VALID_DECISIONS,
  isActiveReview,
  canStartReview,
  canManageActiveReview,
  canWithdraw,
  canDecide,
  statusAfterDecision,
};
