import { describe, it, expect } from 'vitest';
import {
  VALID_DECISIONS,
  isActiveReview,
  canStartReview,
  canManageActiveReview,
  canWithdraw,
  canDecide,
  statusAfterDecision,
} from '../lib/reviewLifecycle.js';

// Lifecycle: draft -> finalized -> in_review -> approved -> published.
// Request-changes returns content to draft.

describe('canStartReview', () => {
  it('finalized content can be submitted', () => {
    expect(canStartReview('finalized')).toBe(true);
  });

  it('already-approved (legacy) content can be re-submitted', () => {
    expect(canStartReview('approved')).toBe(true);
  });

  it('drafts must be finalized first', () => {
    expect(canStartReview('draft')).toBe(false);
  });

  it('published and unknown statuses cannot start a review', () => {
    expect(canStartReview('published')).toBe(false);
    expect(canStartReview(undefined)).toBe(false);
    expect(canStartReview('in_review')).toBe(false); // that path is an update, not a start
  });
});

describe('isActiveReview / canWithdraw / canDecide', () => {
  it('only in_review content is active, withdrawable, and decidable', () => {
    for (const fn of [isActiveReview, canWithdraw, canDecide]) {
      expect(fn('in_review')).toBe(true);
      expect(fn('draft')).toBe(false);
      expect(fn('finalized')).toBe(false);
      expect(fn('approved')).toBe(false);
      expect(fn('published')).toBe(false);
      expect(fn(undefined)).toBe(false);
    }
  });
});

describe('canManageActiveReview', () => {
  const review = { requestedBy: 'uid-requester' };

  it('the requester can manage their own review', () => {
    expect(canManageActiveReview(review, { uid: 'uid-requester', role: 'creator' })).toBe(true);
  });

  it('admins and owners can manage any review', () => {
    expect(canManageActiveReview(review, { uid: 'uid-other', role: 'admin' })).toBe(true);
    expect(canManageActiveReview(review, { uid: 'uid-other', role: 'owner' })).toBe(true);
  });

  it('other creators cannot', () => {
    expect(canManageActiveReview(review, { uid: 'uid-other', role: 'creator' })).toBe(false);
    expect(canManageActiveReview(review, { uid: 'uid-other', role: 'reviewer' })).toBe(false);
  });

  it('a legacy review with no requester is open to anyone', () => {
    expect(canManageActiveReview({}, { uid: 'uid-any', role: 'creator' })).toBe(true);
    expect(canManageActiveReview(undefined, { uid: 'uid-any', role: 'creator' })).toBe(true);
  });
});

describe('statusAfterDecision', () => {
  it('approve promotes to approved', () => {
    expect(statusAfterDecision('approve')).toBe('approved');
  });

  it('request_changes returns content to draft', () => {
    expect(statusAfterDecision('request_changes')).toBe('draft');
  });

  it('unknown decisions map to no status', () => {
    expect(statusAfterDecision('reject')).toBe(null);
    expect(statusAfterDecision(undefined)).toBe(null);
  });

  it('every valid decision produces a status', () => {
    for (const d of VALID_DECISIONS) {
      expect(statusAfterDecision(d)).not.toBe(null);
    }
  });
});
