// The Brand Studio image-generation route's request contract: prompt and
// aspect-ratio validation, and the unconfigured-environment guard — everything
// that runs BEFORE any Vertex AI call. No network is touched: validation and
// the missing-project guard both short-circuit.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const brandStudioRouter = require('../routes/brandStudio');

function app() {
  const a = express();
  a.use(express.json());
  a.use((req, _res, next) => { req.user = { uid: 'u1', email: 'm@x.com', role: 'creator' }; next(); });
  a.use(brandStudioRouter);
  return a;
}

const post = (body) => request(app()).post('/api/brand-studio/generate-image').send(body);

const saved = { GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT, GCP_PROJECT_ID: process.env.GCP_PROJECT_ID };
beforeEach(() => { delete process.env.GOOGLE_CLOUD_PROJECT; delete process.env.GCP_PROJECT_ID; });
afterAll(() => {
  for (const [k, v] of Object.entries(saved)) if (v !== undefined) process.env[k] = v;
});

describe('POST /api/brand-studio/generate-image — request contract', () => {
  it('requires a non-empty prompt', async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ prompt: '   ' })).status).toBe(400);
    const res = await post({ prompt: '' });
    expect(res.body.error).toMatch(/prompt is required/i);
  });

  it('caps prompt length at 2000 characters', async () => {
    const res = await post({ prompt: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2000/);
  });

  it('rejects unsupported aspect ratios but accepts the Imagen set', async () => {
    expect((await post({ prompt: 'a storage facility', aspectRatio: '21:9' })).status).toBe(400);
    // A valid ratio passes validation and reaches the config guard (503 here,
    // because GOOGLE_CLOUD_PROJECT is unset in the test environment).
    expect((await post({ prompt: 'a storage facility', aspectRatio: '16:9' })).status).toBe(503);
  });

  it('returns 503 with a clear message when no GCP project is configured', async () => {
    const res = await post({ prompt: 'a storage facility', brandId: 'storagemoguls' });
    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/GCP_PROJECT_ID|GOOGLE_CLOUD_PROJECT/);
  });

  it('accepts unknown brand ids (falls back to the default art direction)', async () => {
    // Still 503 in tests (unconfigured), which proves brandId validation
    // never rejects — unknown brands map to the default style.
    const res = await post({ prompt: 'anything', brandId: 'not-a-brand' });
    expect(res.status).toBe(503);
  });
});
