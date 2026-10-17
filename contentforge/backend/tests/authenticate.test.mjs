// The authentication middleware: public-path allowlist, token verification,
// membership loading, and the zero-access default for non-members (users from
// other apps on the shared Firebase project must not see ContentForge data).
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

// Backend modules are CommonJS loaded through Node's native require chain;
// importing them via ESM would create a SECOND module instance (vite-node
// transform) that doesn't share state with the routers' own requires. Use the
// native loader so tests and routes see one registry (and one firebase seam).
const require = createRequire(import.meta.url);

const store = installFakeFirebase({}, {
  getAuth: () => ({
    verifyIdToken: async (token) => {
      if (token === 'good-member') return { uid: 'u-member', email: 'm@x.com' };
      if (token === 'good-stranger') return { uid: 'u-stranger', email: 's@x.com' };
      throw new Error('invalid token');
    },
  }),
});
const { authenticate, isPublicPath } = require('../lib/authenticate');

// Probe app: whatever authenticate resolves lands on req.user.
const app = express();
app.use(express.json());
app.use(authenticate);
app.get('/api/whoami', (req, res) => res.json(req.user || null));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  Object.assign(store, {
    content_pipeline_users: {
      'u-member': { role: 'admin', workspaceAccess: ['ws1'], reviewerWorkspaces: ['ws1'] },
    },
    content_pipeline_invites: {},
  });
});

describe('isPublicPath', () => {
  it('non-API paths and the public API set pass without a token', () => {
    for (const p of ['/', '/workspace/x', '/api/health', '/api/health/ready', '/api/config',
      '/api/invites/validate', '/api/invites/accept',
      '/api/library/abc/cover/image', '/api/library/abc/social/linkedin/cover/image']) {
      expect(isPublicPath({ path: p })).toBe(true);
    }
  });

  it('everything else under /api requires auth', () => {
    for (const p of ['/api/workspaces', '/api/library/ws1', '/api/socials/compose',
      '/api/library/abc/cover', '/api/users']) {
      expect(isPublicPath({ path: p })).toBe(false);
    }
  });
});

describe('authenticate', () => {
  it('lets public paths through untouched', async () => {
    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  it('401s a missing or malformed Authorization header', async () => {
    expect((await request(app).get('/api/whoami')).status).toBe(401);
    expect((await request(app).get('/api/whoami').set('Authorization', 'Basic zzz')).status).toBe(401);
  });

  it('401s an invalid token', async () => {
    const res = await request(app).get('/api/whoami').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('loads the membership doc for known members', async () => {
    const res = await request(app).get('/api/whoami').set('Authorization', 'Bearer good-member');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uid: 'u-member', role: 'admin', workspaceAccess: ['ws1'] });
  });

  it('grants ZERO workspace access to authenticated non-members', async () => {
    const res = await request(app).get('/api/whoami').set('Authorization', 'Bearer good-stranger');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uid: 'u-stranger', role: 'creator', workspaceAccess: [] });
  });

  it('redeems a pending invite on first login', async () => {
    store.content_pipeline_invites.inv1 = {
      email: 's@x.com', role: 'creator', workspaceAccess: ['ws1'], reviewerWorkspaces: [],
      usedAt: null, expiresAt: null,
    };
    const res = await request(app).get('/api/whoami').set('Authorization', 'Bearer good-stranger');
    expect(res.body).toMatchObject({ uid: 'u-stranger', workspaceAccess: ['ws1'] });
    expect(store.content_pipeline_users['u-stranger']).toBeTruthy();
    expect(store.content_pipeline_invites.inv1.usedAt).toBeTruthy();
  });
});
