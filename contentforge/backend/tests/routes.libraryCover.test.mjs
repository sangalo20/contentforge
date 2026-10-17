// Cover-image save contract: the Brand Studio path (inline base64 imageData)
// next to the original imageUrl path — validation, access control, and what
// lands on the Firestore doc. Real route code over the in-memory fake; the
// storage fake absorbs the byte upload.
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
const libraryRouter = require('../routes/library');

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(libraryRouter);
  return app;
}

const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const OUTSIDER = { uid: 'u2', email: 'o@x.com', role: 'creator', workspaceAccess: [] };

// A 1x1 transparent PNG.
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

beforeEach(() => {
  store.content_pipeline_library = {
    art1: { workspaceId: 'ws1', draft: '# Title\n\nBody' },
  };
});

describe('PUT /api/library/:id/cover with imageData (Brand Studio covers)', () => {
  it('accepts a base64 PNG data URL and records a brand-studio cover', async () => {
    const res = await request(appAs(MEMBER))
      .put('/api/library/art1/cover')
      .send({ imageData: `data:image/png;base64,${PNG_B64}` });
    expect(res.status).toBe(200);
    expect(res.body.coverImage.source).toBe('brand-studio');
    expect(res.body.coverImage.contentType).toBe('image/png');
    expect(res.body.coverImage.storagePath).toBe('content-pipeline/covers/art1.png');
    expect(store.content_pipeline_library.art1.coverImage.source).toBe('brand-studio');
  });

  it('rejects a malformed data URL', async () => {
    const res = await request(appAs(MEMBER))
      .put('/api/library/art1/cover')
      .send({ imageData: 'data:text/html;base64,PGI+aGk8L2I+' });
    expect(res.status).toBe(400);
  });

  it('requires imageUrl or imageData', async () => {
    const res = await request(appAs(MEMBER)).put('/api/library/art1/cover').send({});
    expect(res.status).toBe(400);
  });

  it('enforces workspace access', async () => {
    const res = await request(appAs(OUTSIDER))
      .put('/api/library/art1/cover')
      .send({ imageData: `data:image/png;base64,${PNG_B64}` });
    expect([403, 404]).toContain(res.status);
  });
});
