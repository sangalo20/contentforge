// Studio-designed social posters: the design/bytes persistence endpoint and
// the durable download's stored-bytes fast path. Real route code over the
// in-memory fake; the storage fake absorbs uploads and serves fake bytes.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: { workspaces: [{ id: 'ws1', name: 'Workspace One' }] },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const socialsRouter = require('../routes/socials');

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(socialsRouter);
  return app;
}

const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const OUTSIDER = { uid: 'u2', email: 'o@x.com', role: 'creator', workspaceAccess: [] };

const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

beforeEach(() => {
  store.content_pipeline_library = {
    art1: {
      workspaceId: 'ws1',
      draft: '# T\n\nB',
      socials: {
        linkedin_poster: { posterType: 'stat', stat: '$29M+', headline: 'H', subline: 'S', status: 'finalized' },
        x_poster: { posterType: 'statement', headline: 'H2', subline: 'S2', status: 'approved', imageStoragePath: 'content-pipeline/socials/posters/art1_x.png' },
      },
    },
  };
});

describe('POST /api/socials/poster-image', () => {
  it('persists a design-only pick', async () => {
    const res = await request(appAs(MEMBER)).post('/api/socials/poster-image')
      .send({ itemId: 'art1', channel: 'linkedin', design: 'bignumber:counter' });
    expect(res.status).toBe(200);
    expect(store.content_pipeline_library.art1['socials.linkedin_poster.design'] ??
      store.content_pipeline_library.art1.socials?.linkedin_poster?.design).toBe('bignumber:counter');
  });

  it('stores rendered PNG bytes and records the storage path', async () => {
    const res = await request(appAs(MEMBER)).post('/api/socials/poster-image')
      .send({ itemId: 'art1', channel: 'linkedin', design: 'bignumber:total', imageData: `data:image/png;base64,${PNG_B64}` });
    expect(res.status).toBe(200);
    expect(res.body.imageStoragePath).toBe('content-pipeline/socials/posters/art1_linkedin.png');
  });

  it('rejects non-PNG payloads', async () => {
    const res = await request(appAs(MEMBER)).post('/api/socials/poster-image')
      .send({ itemId: 'art1', channel: 'linkedin', imageData: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' });
    expect(res.status).toBe(400);
  });

  it('404s when the channel has no poster', async () => {
    const res = await request(appAs(MEMBER)).post('/api/socials/poster-image')
      .send({ itemId: 'art1', channel: 'facebook', design: 'x' });
    expect(res.status).toBe(404);
  });

  it('enforces workspace access', async () => {
    const res = await request(appAs(OUTSIDER)).post('/api/socials/poster-image')
      .send({ itemId: 'art1', channel: 'linkedin', design: 'x' });
    expect([403, 404]).toContain(res.status);
  });
});

describe('GET /api/socials/poster/item/:itemId/:channel — stored bytes', () => {
  it('streams stored bytes without touching the renderer', async () => {
    const res = await request(appAs(MEMBER)).get('/api/socials/poster/item/art1/x');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.body.toString()).toBe('fake-image-bytes');
  });
});
