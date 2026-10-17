// Workspace creation and the creator self-grant: a scoped admin who creates a
// workspace is automatically granted access to it (creating must never lock
// the creator out — previously the new id was missing from their
// workspaceAccess array, hiding their own workspace from them). Also pins the
// listing's access scoping. Real route + lib code over the in-memory fake.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: { workspaces: [{ id: 'existing-ws', name: 'Existing' }] },
  },
});
const { initWorkspacesStore, saveWorkspaces } = require('../lib/workspacesStore');
await initWorkspacesStore();
const workspacesRouter = require('../routes/workspaces');

function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(workspacesRouter);
  return app;
}

const SCOPED_ADMIN = { uid: 'u-scoped', email: 's@x.com', role: 'admin', workspaceAccess: ['existing-ws'] };
const FULL_ADMIN = { uid: 'u-full', email: 'f@x.com', role: 'admin', workspaceAccess: 'all' };
const CREATOR = { uid: 'u-creator', email: 'c@x.com', role: 'creator', workspaceAccess: ['existing-ws'] };

beforeEach(() => {
  store.content_pipeline_users = {
    'u-scoped': { role: 'admin', workspaceAccess: ['existing-ws'] },
    'u-full': { role: 'admin', workspaceAccess: 'all' },
  };
  // Reset the store between tests (getWorkspaces() returns a deep copy, so
  // direct mutation would be a no-op — go through the sanctioned save).
  saveWorkspaces([{ id: 'existing-ws', name: 'Existing' }]);
});

describe('POST /api/workspaces', () => {
  it('is admin-only', async () => {
    expect((await request(appAs(CREATOR)).post('/api/workspaces').send({ name: 'Nope' })).status).toBe(403);
  });

  it('grants a scoped admin access to the workspace they created', async () => {
    const res = await request(appAs(SCOPED_ADMIN)).post('/api/workspaces').send({ name: 'My New Channel' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('my-new-channel');
    expect(store.content_pipeline_users['u-scoped'].workspaceAccess)
      .toEqual(['existing-ws', 'my-new-channel']);

    // And the listing now shows it to them.
    const list = await request(appAs({ ...SCOPED_ADMIN, workspaceAccess: ['existing-ws', 'my-new-channel'] }))
      .get('/api/workspaces');
    expect(list.body.map((w) => w.id)).toContain('my-new-channel');
  });

  it('leaves an all-access admin untouched', async () => {
    const res = await request(appAs(FULL_ADMIN)).post('/api/workspaces').send({ name: 'Another One' });
    expect(res.status).toBe(201);
    expect(store.content_pipeline_users['u-full'].workspaceAccess).toBe('all');
  });
});

describe('POST /api/workspaces/:id/restore', () => {
  const SCOPED_OWNER = { uid: 'u-owner', email: 'o@x.com', role: 'owner', workspaceAccess: ['existing-ws'] };

  beforeEach(() => {
    store.content_pipeline_users['u-owner'] = { role: 'owner', workspaceAccess: ['existing-ws'] };
    saveWorkspaces([
      { id: 'existing-ws', name: 'Existing' },
      { id: 'trashed-ws', name: 'Trashed', deletedAt: '2026-08-01T00:00:00Z', deletedBy: 'someone@x.com' },
    ]);
  });

  it('is owner-only (admins can look, not act)', async () => {
    expect((await request(appAs(SCOPED_ADMIN)).post('/api/workspaces/trashed-ws/restore')).status).toBe(403);
  });

  it('restores and self-grants a scoped owner access to what they brought back', async () => {
    const res = await request(appAs(SCOPED_OWNER)).post('/api/workspaces/trashed-ws/restore');
    expect(res.status).toBe(200);
    expect(res.body.workspace.deletedAt).toBeUndefined();
    expect(store.content_pipeline_users['u-owner'].workspaceAccess)
      .toEqual(['existing-ws', 'trashed-ws']);
  });

  it('leaves an all-access owner untouched and 404s on non-trashed workspaces', async () => {
    const FULL_OWNER = { uid: 'u-full-owner', email: 'fo@x.com', role: 'owner', workspaceAccess: 'all' };
    store.content_pipeline_users['u-full-owner'] = { role: 'owner', workspaceAccess: 'all' };
    expect((await request(appAs(FULL_OWNER)).post('/api/workspaces/trashed-ws/restore')).status).toBe(200);
    expect(store.content_pipeline_users['u-full-owner'].workspaceAccess).toBe('all');
    expect((await request(appAs(FULL_OWNER)).post('/api/workspaces/existing-ws/restore')).status).toBe(404);
  });
});

describe('GET /api/workspaces scoping', () => {
  it('scoped users only see their granted workspaces', async () => {
    await request(appAs(FULL_ADMIN)).post('/api/workspaces').send({ name: 'Hidden From Scoped' });
    const list = await request(appAs(SCOPED_ADMIN)).get('/api/workspaces');
    expect(list.body.map((w) => w.id)).toEqual(['existing-ws']);
  });
});
