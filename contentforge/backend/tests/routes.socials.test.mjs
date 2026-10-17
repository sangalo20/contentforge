// Route-level tests for the social generation entry points and listings:
// workspace access enforcement, compose validation, source resolution (422 on
// missing draft), and the original-item split between the article library and
// the social library. Real route + lib code over the in-memory fake.
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

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: {
      workspaces: [
        { id: 'ws1', name: 'Workspace One', theme: '#123456', socialPersonas: [] },
        { id: 'ws-trashed', name: 'Gone', deletedAt: '2026-01-01T00:00:00Z' },
      ],
    },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const socialsRouter = require('../routes/socials');
const libraryRouter = require('../routes/library');

function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(libraryRouter);
  app.use(socialsRouter);
  return app;
}

const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const OUTSIDER = { uid: 'u2', email: 'o@x.com', role: 'creator', workspaceAccess: [] };

beforeEach(() => {
  store.content_pipeline_library = {
    art1: { workspaceId: 'ws1', draft: '# Title\n\nBody', socials: { linkedin: { post: 'p', status: 'draft' } } },
    art2: { workspaceId: 'ws1', draft: null, socials: {} }, // generated but draftless
    orig1: { workspaceId: 'ws1', sourceType: 'original', idea: 'my idea', title: 'my idea', socials: { x: { thread: ['t'], status: 'draft' } } },
  };
});

describe('workspace access on listings', () => {
  it('article library requires workspace access', async () => {
    expect((await request(appAs(OUTSIDER)).get('/api/library/ws1')).status).toBe(403);
  });

  it('article library excludes original-idea items', async () => {
    const res = await request(appAs(MEMBER)).get('/api/library/ws1');
    expect(res.status).toBe(200);
    const ids = res.body.map((i) => i.id);
    expect(ids).toContain('art1');
    expect(ids).not.toContain('orig1');
  });

  it('social library requires access and includes original items tagged by source', async () => {
    expect((await request(appAs(OUTSIDER)).get('/api/social-library/ws1')).status).toBe(403);
    const res = await request(appAs(MEMBER)).get('/api/social-library/ws1');
    expect(res.status).toBe(200);
    const bySource = Object.fromEntries(res.body.map((e) => [e.itemId, e.sourceType]));
    expect(bySource.art1).toBe('article');
    expect(bySource.orig1).toBe('original');
  });
});

describe('POST /api/generate-socials', () => {
  it('validates itemId, channel, and function', async () => {
    expect((await request(appAs(MEMBER)).post('/api/generate-socials').send({})).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/generate-socials').send({ itemId: 'art1', channel: 'tiktok' })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/generate-socials').send({ itemId: 'art1', function: 'spam' })).status).toBe(400);
  });

  it('enforces workspace access on the item', async () => {
    const res = await request(appAs(OUTSIDER)).post('/api/generate-socials').send({ itemId: 'art1' });
    expect(res.status).toBe(403);
  });

  it('422s when an article has no draft to work from', async () => {
    const res = await request(appAs(MEMBER)).post('/api/generate-socials').send({ itemId: 'art2' });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/no draft/i);
  });
});

describe('POST /api/socials/compose', () => {
  it('requires workspaceId, access, a live workspace, and a sane idea', async () => {
    expect((await request(appAs(MEMBER)).post('/api/socials/compose').send({})).status).toBe(400);
    expect((await request(appAs(OUTSIDER)).post('/api/socials/compose').send({ workspaceId: 'ws1', idea: 'x' })).status).toBe(403);
    // Trashed workspaces are not a valid destination.
    expect((await request(appAs({ ...MEMBER, workspaceAccess: 'all' })).post('/api/socials/compose').send({ workspaceId: 'ws-trashed', idea: 'x' })).status).toBe(404);
    expect((await request(appAs(MEMBER)).post('/api/socials/compose').send({ workspaceId: 'ws1', idea: '   ' })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/socials/compose').send({ workspaceId: 'ws1', idea: 'x'.repeat(5001) })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/socials/compose').send({ workspaceId: 'ws1', idea: 'fine', channel: 'tiktok' })).status).toBe(400);
    // No item may be left behind by any of the rejected calls.
    expect(Object.keys(store.content_pipeline_library)).toHaveLength(3);
  });
});
