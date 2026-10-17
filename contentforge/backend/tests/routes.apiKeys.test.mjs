// API keys: minting/list/revoke routes, authentication resolution (a cfk_
// token must land on req.user in the exact same shape as a Firebase session),
// and the credential-escalation fence (keys can never mint credentials).
// Real route + lib code over the in-memory fake.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: { workspaces: [{ id: 'ws1', name: 'One' }, { id: 'ws2', name: 'Two' }] },
  },
}, {
  getAuth: () => ({
    verifyIdToken: async (token) => {
      if (token === 'human-admin') return { uid: 'u-admin', email: 'a@x.com' };
      if (token === 'human-creator') return { uid: 'u-creator', email: 'c@x.com' };
      throw new Error('invalid token');
    },
    listUsers: async () => ({ users: [] }),
    getUser: async () => ({ email: null }),
  }),
});

const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const { authenticate } = require('../lib/authenticate');
const apiKeysRouter = require('../routes/apiKeys');
const usersRouter = require('../routes/users');

// Full middleware chain, as in server.js: authenticate resolves BOTH Firebase
// tokens and API keys, then the routers' guards apply.
const app = express();
app.use(express.json());
app.use(authenticate);
app.use(apiKeysRouter);
app.use(usersRouter);
app.get('/api/whoami', (req, res) => res.json(req.user || null));

const as = (token) => ({ Authorization: `Bearer ${token}` });

beforeEach(() => {
  store.content_pipeline_users = {
    'u-admin': { role: 'admin', workspaceAccess: 'all' },
    'u-creator': { role: 'creator', workspaceAccess: ['ws1'] },
  };
  store.content_pipeline_api_keys = {};
  store.content_pipeline_invites = {};
});

const mint = (body = {}) =>
  request(app).post('/api/api-keys').set(as('human-admin'))
    .send({ name: 'workbench', ...body });

describe('POST /api/api-keys', () => {
  it('is admin-only and requires a name', async () => {
    expect((await request(app).post('/api/api-keys').set(as('human-creator')).send({ name: 'x' })).status).toBe(403);
    expect((await mint({ name: '  ' })).status).toBe(400);
  });

  it('mints a cfk_ token, returned once, and stores only the hash', async () => {
    const res = await mint({ role: 'creator', workspaceAccess: ['ws1'] });
    expect(res.status).toBe(201);
    expect(res.body.token).toMatch(/^cfk_/);
    const stored = store.content_pipeline_api_keys[res.body.id];
    expect(stored.tokenHash).toBeTruthy();
    expect(JSON.stringify(stored)).not.toContain(res.body.token);
  });

  it('rejects owner-role keys and filters unknown workspace ids', async () => {
    expect((await mint({ role: 'owner' })).status).toBe(400);
    const res = await mint({ workspaceAccess: ['ws1', 'nope'] });
    expect(res.body.workspaceAccess).toEqual(['ws1']);
  });
});

describe('authenticating with an API key', () => {
  it('resolves the key to the standard user shape, scoped as minted', async () => {
    const { body: key } = await mint({ role: 'creator', workspaceAccess: ['ws1'] });
    const res = await request(app).get('/api/whoami').set(as(key.token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      uid: `apikey:${key.id}`,
      role: 'creator',
      workspaceAccess: ['ws1'],
      apiKey: { id: key.id, name: 'workbench' },
    });
  });

  it('401s unknown and revoked keys', async () => {
    expect((await request(app).get('/api/whoami').set(as('cfk_not-a-real-key'))).status).toBe(401);

    const { body: key } = await mint();
    await request(app).delete(`/api/api-keys/${key.id}`).set(as('human-admin'));
    expect((await request(app).get('/api/whoami').set(as(key.token))).status).toBe(401);
  });
});

describe('credential-escalation fence', () => {
  it('an admin-role key cannot mint, revoke, or invite', async () => {
    const { body: key } = await mint({ role: 'admin', workspaceAccess: 'all' });
    const t = as(key.token);
    expect((await request(app).post('/api/api-keys').set(t).send({ name: 'evil' })).status).toBe(403);
    expect((await request(app).delete(`/api/api-keys/${key.id}`).set(t)).status).toBe(403);
    expect((await request(app).post('/api/users').set(t).send({ email: 'e@x.com' })).status).toBe(403);
    expect((await request(app).put('/api/users/u-creator').set(t).send({ role: 'admin' })).status).toBe(403);
  });
});

describe('GET /api/api-keys and revocation', () => {
  it('lists metadata without secrets; revoke is soft and audited', async () => {
    const { body: key } = await mint();
    await request(app).delete(`/api/api-keys/${key.id}`).set(as('human-admin'));

    const res = await request(app).get('/api/api-keys').set(as('human-admin'));
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: key.id, name: 'workbench' });
    expect(res.body[0].token).toBeUndefined();
    expect(res.body[0].tokenHash).toBeUndefined();
    // Soft delete: the doc survives for the audit trail.
    expect(store.content_pipeline_api_keys[key.id].revokedAt).toBeTruthy();
    expect(store.content_pipeline_api_keys[key.id].revokedBy).toBe('a@x.com');
  });
});
