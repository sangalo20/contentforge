import { describe, it, expect } from 'vitest';
import {
  VALID_ROLES,
  isAdminRole,
  reviewerWorkspacesOf,
  canAccessWorkspace,
  canReviewWorkspace,
  normalizeWorkspaceAccess,
  normalizeReviewerWorkspaces,
} from '../lib/authz.js';

describe('isAdminRole', () => {
  it('accepts owner and admin', () => {
    expect(isAdminRole('owner')).toBe(true);
    expect(isAdminRole('admin')).toBe(true);
  });

  it('rejects creator, legacy reviewer, and garbage', () => {
    expect(isAdminRole('creator')).toBe(false);
    expect(isAdminRole('reviewer')).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole('Owner')).toBe(false); // roles are case-sensitive
  });

  it('every valid role is owner, admin, or creator', () => {
    expect(VALID_ROLES).toEqual(['owner', 'admin', 'creator']);
  });
});

describe('reviewerWorkspacesOf', () => {
  it('returns the explicit field when present', () => {
    expect(reviewerWorkspacesOf({ reviewerWorkspaces: ['ws1'] })).toEqual(['ws1']);
    expect(reviewerWorkspacesOf({ reviewerWorkspaces: 'all' })).toBe('all');
    expect(reviewerWorkspacesOf({ reviewerWorkspaces: [] })).toEqual([]);
  });

  it('explicit empty grants beat the legacy reviewer role', () => {
    expect(reviewerWorkspacesOf({ role: 'reviewer', reviewerWorkspaces: [] })).toEqual([]);
  });

  it('legacy global reviewer role reads as reviewer-everywhere', () => {
    expect(reviewerWorkspacesOf({ role: 'reviewer' })).toBe('all');
    expect(reviewerWorkspacesOf({ role: 'reviewer', reviewerWorkspaces: null })).toBe('all');
  });

  it('everyone else defaults to no grants', () => {
    expect(reviewerWorkspacesOf({ role: 'admin' })).toEqual([]);
    expect(reviewerWorkspacesOf({ role: 'owner' })).toEqual([]);
    expect(reviewerWorkspacesOf({})).toEqual([]);
    expect(reviewerWorkspacesOf(undefined)).toEqual([]);
  });
});

describe('canAccessWorkspace', () => {
  it("grants everything on 'all' or a legacy missing value", () => {
    expect(canAccessWorkspace({ workspaceAccess: 'all' }, 'ws1')).toBe(true);
    expect(canAccessWorkspace({}, 'ws1')).toBe(true);
    expect(canAccessWorkspace({ workspaceAccess: null }, 'ws1')).toBe(true);
  });

  it('limits access to the listed workspace ids', () => {
    const user = { workspaceAccess: ['ws1', 'ws2'] };
    expect(canAccessWorkspace(user, 'ws1')).toBe(true);
    expect(canAccessWorkspace(user, 'ws3')).toBe(false);
  });

  it('an empty list grants nothing', () => {
    expect(canAccessWorkspace({ workspaceAccess: [] }, 'ws1')).toBe(false);
  });

  it('a malformed access value grants nothing', () => {
    expect(canAccessWorkspace({ workspaceAccess: 'ws1' }, 'ws1')).toBe(false);
    expect(canAccessWorkspace({ workspaceAccess: 42 }, 'ws1')).toBe(false);
  });
});

describe('canReviewWorkspace', () => {
  it('effective rights = reviewerWorkspaces ∩ workspaceAccess', () => {
    // Reviewer grant without workspace access must NOT allow review.
    expect(canReviewWorkspace({ workspaceAccess: ['ws2'], reviewerWorkspaces: ['ws1'] }, 'ws1')).toBe(false);
    // Access without a reviewer grant must NOT allow review.
    expect(canReviewWorkspace({ workspaceAccess: ['ws1'], reviewerWorkspaces: [] }, 'ws1')).toBe(false);
    // Both together allow it.
    expect(canReviewWorkspace({ workspaceAccess: ['ws1'], reviewerWorkspaces: ['ws1'] }, 'ws1')).toBe(true);
  });

  it("reviewer-everywhere still requires workspace access", () => {
    expect(canReviewWorkspace({ workspaceAccess: ['ws2'], reviewerWorkspaces: 'all' }, 'ws1')).toBe(false);
    expect(canReviewWorkspace({ workspaceAccess: 'all', reviewerWorkspaces: 'all' }, 'ws1')).toBe(true);
  });

  it('admins and owners are NOT implicit reviewers', () => {
    expect(canReviewWorkspace({ role: 'admin', workspaceAccess: 'all' }, 'ws1')).toBe(false);
    expect(canReviewWorkspace({ role: 'owner', workspaceAccess: 'all' }, 'ws1')).toBe(false);
  });

  it('legacy global reviewer role reviews wherever they have access', () => {
    expect(canReviewWorkspace({ role: 'reviewer', workspaceAccess: ['ws1'] }, 'ws1')).toBe(true);
    expect(canReviewWorkspace({ role: 'reviewer', workspaceAccess: ['ws2'] }, 'ws1')).toBe(false);
  });
});

describe('normalizeWorkspaceAccess', () => {
  const valid = ['ws1', 'ws2'];

  it("treats 'all' and absent values as full access", () => {
    expect(normalizeWorkspaceAccess('all', valid)).toBe('all');
    expect(normalizeWorkspaceAccess(undefined, valid)).toBe('all');
    expect(normalizeWorkspaceAccess(null, valid)).toBe('all');
  });

  it('filters unknown ids and dedupes', () => {
    expect(normalizeWorkspaceAccess(['ws1', 'ws1', 'ghost'], valid)).toEqual(['ws1']);
  });

  it('rejects non-array shapes', () => {
    expect(normalizeWorkspaceAccess('ws1', valid)).toBe(null);
    expect(normalizeWorkspaceAccess({ ws1: true }, valid)).toBe(null);
    expect(normalizeWorkspaceAccess(7, valid)).toBe(null);
  });
});

describe('normalizeReviewerWorkspaces', () => {
  const valid = ['ws1', 'ws2'];

  it('reviewer rights are opt-in: absent means NO grants', () => {
    expect(normalizeReviewerWorkspaces(undefined, valid)).toEqual([]);
    expect(normalizeReviewerWorkspaces(null, valid)).toEqual([]);
  });

  it("passes 'all' through and filters/dedupes arrays", () => {
    expect(normalizeReviewerWorkspaces('all', valid)).toBe('all');
    expect(normalizeReviewerWorkspaces(['ws2', 'ws2', 'ghost'], valid)).toEqual(['ws2']);
  });

  it('rejects non-array shapes', () => {
    expect(normalizeReviewerWorkspaces('ws1', valid)).toBe(null);
    expect(normalizeReviewerWorkspaces({}, valid)).toBe(null);
  });
});
