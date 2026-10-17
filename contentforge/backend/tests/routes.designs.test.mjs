// The Brand Studio Design Library: save (recipe -> Firestore, bytes ->
// Storage), list/load with proxy URLs, creator-or-admin update/delete, and
// the human-only deletion guard. Real route code over the in-memory fake,
// with a Storage stub that records writes/deletes.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

// Storage stub: tracks saved/deleted paths and streams bytes back.
const storageFiles = new Map();
const fakeStorage = {
  bucket: () => ({
    file: (path) => ({
      save: async (buffer, opts) => { storageFiles.set(path, { buffer, contentType: opts?.contentType }); },
      delete: async () => { storageFiles.delete(path); },
      createReadStream: () => Readable.from(storageFiles.get(path)?.buffer ?? Buffer.alloc(0)),
    }),
  }),
};

const store = installFakeFirebase({}, { getStorage: () => fakeStorage });
const designsRouter = require('../routes/designs');

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(designsRouter);
  return app;
}

const CREATOR = { uid: 'u1', email: 'c@x.com', role: 'creator', workspaceAccess: 'all' };
const OTHER = { uid: 'u2', email: 'o@x.com', role: 'creator', workspaceAccess: 'all' };
const ADMIN = { uid: 'a1', email: 'a@x.com', role: 'admin', workspaceAccess: 'all' };
const ADMIN_KEY = { ...ADMIN, uid: 'apikey:k1', apiKey: { id: 'k1', name: 'key' } };

const PNG = `data:image/png;base64,${Buffer.from('fake-png-bytes').toString('base64')}`;
const body = (over = {}) => ({
  name: 'Weekly Episode Art',
  templateId: 'episodeart',
  brandId: 'storagemoguls',
  resolution: '1080x1080',
  fields: { title: 'Ep 12', variant: 'noir', author: 'Joe' },
  images: { uploadedImage: PNG, 'uploadedCoHosts[0]': PNG },
  thumbnail: PNG,
  ...over,
});

beforeEach(() => {
  store.content_pipeline_designs = {};
  storageFiles.clear();
});

describe('design library', () => {
  it('saves a design: recipe in Firestore, images + thumb in Storage under the design dir', async () => {
    const res = await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body());
    expect(res.status).toBe(201);
    const id = res.body.design.id;
    const doc = store.content_pipeline_designs[id];
    expect(doc.fields.title).toBe('Ep 12');
    expect(doc.createdBy).toBe('u1');
    // Sanitized file keys; original keys preserved for the client.
    expect(Object.values(doc.imageFiles).map((f) => f.key).sort()).toEqual(['uploadedCoHosts[0]', 'uploadedImage']);
    const paths = [...storageFiles.keys()];
    expect(paths).toHaveLength(3); // 2 images + thumb
    expect(paths.every((p) => p.startsWith(`content-pipeline/brand-studio/designs/${id}/`))).toBe(true);
  });

  it('rejects bad payloads: no name, image data smuggled into fields, non-image data URLs', async () => {
    expect((await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body({ name: ' ' }))).status).toBe(400);
    expect((await request(appAs(CREATOR)).post('/api/brand-studio/designs')
      .send(body({ fields: { bg: PNG } }))).status).toBe(400);
    expect((await request(appAs(CREATOR)).post('/api/brand-studio/designs')
      .send(body({ images: { x: 'data:text/html;base64,AAAA' } }))).status).toBe(400);
  });

  it('lists summaries (brand-filterable) and loads the full recipe with proxy URLs', async () => {
    const saved = await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body());
    await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body({ name: 'Other brand', brandId: 'joedowns' }));

    const all = await request(appAs(OTHER)).get('/api/brand-studio/designs');
    expect(all.body.designs).toHaveLength(2);
    const filtered = await request(appAs(OTHER)).get('/api/brand-studio/designs?brand=joedowns');
    expect(filtered.body.designs.map((d) => d.name)).toEqual(['Other brand']);
    expect(filtered.body.designs[0]).not.toHaveProperty('fields'); // summaries only

    const one = await request(appAs(OTHER)).get(`/api/brand-studio/designs/${saved.body.design.id}`);
    expect(one.status).toBe(200);
    expect(one.body.design.fields.variant).toBe('noir');
    expect(one.body.design.imageUrls.uploadedImage).toMatch(/\/image\/uploadedImage\?t=/);
    expect(one.body.design.imageUrls['uploadedCoHosts[0]']).toMatch(/\/image\/uploadedCoHosts_0_\?t=/);
    expect(one.body.design.thumbnailUrl).toMatch(/\/image\/thumb\?t=/);
  });

  it('streams stored images through the public proxy', async () => {
    const saved = await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body());
    const img = await request(appAs(OTHER)).get(`/api/brand-studio/designs/${saved.body.design.id}/image/uploadedImage`);
    expect(img.status).toBe(200);
    expect(img.headers['content-type']).toMatch(/image\/png/);
    expect(img.body.toString()).toBe('fake-png-bytes');
    expect((await request(appAs(OTHER)).get(`/api/brand-studio/designs/${saved.body.design.id}/image/nope`)).status).toBe(404);
  });

  it('update is creator-or-admin and fully replaces the stored files', async () => {
    const saved = await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body());
    const id = saved.body.design.id;

    expect((await request(appAs(OTHER)).put(`/api/brand-studio/designs/${id}`).send(body())).status).toBe(403);

    const updated = await request(appAs(CREATOR)).put(`/api/brand-studio/designs/${id}`)
      .send(body({ name: 'Ep 13', fields: { title: 'Ep 13' }, images: { uploadedImage: PNG } }));
    expect(updated.status).toBe(200);
    expect(store.content_pipeline_designs[id].name).toBe('Ep 13');
    // Old cohost image removed; new set is 1 image + thumb.
    expect([...storageFiles.keys()]).toHaveLength(2);
  });

  it('delete is human-only and creator-or-admin; files go with the doc', async () => {
    const saved = await request(appAs(CREATOR)).post('/api/brand-studio/designs').send(body());
    const id = saved.body.design.id;

    expect((await request(appAs(ADMIN_KEY)).delete(`/api/brand-studio/designs/${id}`)).status).toBe(403);
    expect((await request(appAs(OTHER)).delete(`/api/brand-studio/designs/${id}`)).status).toBe(403);

    const gone = await request(appAs(ADMIN)).delete(`/api/brand-studio/designs/${id}`);
    expect(gone.status).toBe(200);
    expect(store.content_pipeline_designs[id]).toBeUndefined();
    expect(storageFiles.size).toBe(0);
  });
});
