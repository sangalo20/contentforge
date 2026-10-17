// Studio-designed social carousels: the design/PDF persistence endpoint, the
// durable download's stored-bytes fast path, the finalize path that skips the
// legacy renderer when a studio design is chosen, and the staleness rule
// (editing a deck voids its frozen PDF). Real route code over the in-memory
// fake with a byte-tracking storage stub.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const storageFiles = new Map();
const fakeStorage = {
  bucket: () => ({
    file: (path) => ({
      save: async (buffer, opts) => { storageFiles.set(path, { buffer, contentType: opts?.contentType }); },
      delete: async () => { storageFiles.delete(path); },
      download: async () => [storageFiles.get(path)?.buffer ?? Buffer.alloc(0)],
      createReadStream: () => Readable.from(storageFiles.get(path)?.buffer ?? Buffer.alloc(0)),
    }),
  }),
};

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: { workspaces: [{ id: 'ws1', name: 'Workspace One' }] },
  },
}, { getStorage: () => fakeStorage });
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
const PDF_B64 = Buffer.from('%PDF-1.4 fake').toString('base64');
const SLIDES = [
  { kind: 'hook', heading: 'H1', body: '' },
  { kind: 'point', heading: 'H2', body: 'B2' },
  { kind: 'cta', heading: 'Follow', body: '' },
];

beforeEach(() => {
  storageFiles.clear();
  store.content_pipeline_library = {
    art1: {
      workspaceId: 'ws1',
      draft: '# T\n\nB',
      socials: {
        linkedin_carousel: { slides: SLIDES, cta: 'Follow us', status: 'draft', design: null },
      },
    },
  };
});

const carousel = () => store.content_pipeline_library.art1.socials.linkedin_carousel;

describe('POST /api/socials/carousel-pdf', () => {
  it('persists the design pick alone, and PDF bytes when provided', async () => {
    const pick = await request(appAs(MEMBER)).post('/api/socials/carousel-pdf')
      .send({ itemId: 'art1', channel: 'linkedin', design: 'editorial:field' });
    expect(pick.status).toBe(200);
    expect(carousel().design).toBe('editorial:field');
    expect(carousel().pdfStoragePath).toBeUndefined();

    const freeze = await request(appAs(MEMBER)).post('/api/socials/carousel-pdf')
      .send({ itemId: 'art1', channel: 'linkedin', pdfData: `data:application/pdf;base64,${PDF_B64}`, design: 'editorial:field' });
    expect(freeze.status).toBe(200);
    expect(freeze.body.pdfStoragePath).toBe('content-pipeline/socials/carousels/art1_linkedin.pdf');
    expect(storageFiles.get('content-pipeline/socials/carousels/art1_linkedin.pdf').contentType).toBe('application/pdf');
  });

  it('rejects non-PDF payloads and unknown targets', async () => {
    expect((await request(appAs(MEMBER)).post('/api/socials/carousel-pdf')
      .send({ itemId: 'art1', channel: 'linkedin', pdfData: `data:image/png;base64,${PDF_B64}` })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/socials/carousel-pdf')
      .send({ itemId: 'art1', channel: 'x', design: 'editorial:field' })).status).toBe(404);
  });
});

describe('finalize (/api/socials/approve) with a studio design', () => {
  it('skips the legacy renderer entirely — no Odin call, no fileId', async () => {
    carousel().design = 'editorial:field';
    // No stub Odin is running: a render attempt would fail loudly here.
    const res = await request(appAs(MEMBER)).post('/api/socials/approve')
      .send({ itemId: 'art1', channel: 'linkedin', kind: 'carousel', content: { slides: SLIDES, cta: 'Follow us' } });
    expect(res.status).toBe(200);
    expect(carousel().status).toBe('finalized');
    expect(carousel().fileId).toBeNull();
  });
});

describe('durable download (/api/socials/carousel/item/...)', () => {
  it('serves frozen studio bytes straight from Storage', async () => {
    carousel().design = 'editorial:field';
    carousel().pdfStoragePath = 'content-pipeline/socials/carousels/art1_linkedin.pdf';
    storageFiles.set('content-pipeline/socials/carousels/art1_linkedin.pdf', { buffer: Buffer.from('%PDF-frozen'), contentType: 'application/pdf' });

    const res = await request(appAs(MEMBER)).get('/api/socials/carousel/item/art1/linkedin');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.toString()).toBe('%PDF-frozen');
  });
});

describe('editing voids the frozen PDF', () => {
  it('draft saves null pdfStoragePath so a stale render can never ship', async () => {
    carousel().design = 'editorial:field';
    carousel().pdfStoragePath = 'content-pipeline/socials/carousels/art1_linkedin.pdf';
    const res = await request(appAs(MEMBER)).post('/api/socials/draft')
      .send({ itemId: 'art1', channel: 'linkedin', kind: 'carousel', content: { slides: SLIDES.slice(0, 2), cta: null } });
    expect(res.status).toBe(200);
    expect(carousel().pdfStoragePath).toBeNull();
    expect(carousel().design).toBe('editorial:field'); // the pick survives edits
  });
});
