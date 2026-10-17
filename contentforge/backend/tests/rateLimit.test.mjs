// Machine-caller protections: the per-key token-bucket limiter (applies to
// every route, never to humans) and the social-generation concurrency cap.
// Real middleware/lib code; the social test runs the real v1 route against a
// deliberately slow stub Odin to force overlap.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import http from 'node:http';
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
const { apiKeyRateLimit } = require('../lib/rateLimit');
const v1Router = require('../routes/v1');

// Stub Odin whose syndicate route answers slowly, so two requests overlap.
const odin = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'success',
        data: { copy: JSON.stringify({ post: 'slow post', cta: null }) },
      }));
    }, 250);
  });
});
await new Promise((resolve) => odin.listen(0, '127.0.0.1', resolve));
process.env.ODIN_API_URL = `http://127.0.0.1:${odin.address().port}`;
afterAll(() => {
  delete process.env.API_KEY_RATE_LIMIT;
  delete process.env.MAX_ACTIVE_SOCIAL_GENERATIONS;
  return new Promise((resolve) => odin.close(resolve));
});

const HUMAN = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const keyUser = (id) => ({
  uid: `apikey:${id}`, email: null, role: 'creator', workspaceAccess: ['ws1'],
  reviewerWorkspaces: [], apiKey: { id, name: 'test' },
});

function appAs(user, router) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(apiKeyRateLimit);
  if (router) app.use(router);
  else app.get('/ping', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('apiKeyRateLimit', () => {
  beforeEach(() => { process.env.API_KEY_RATE_LIMIT = '3'; });

  it('limits API keys per key id, with the v1 envelope and Retry-After', async () => {
    const app = appAs(keyUser('k1'));
    for (let i = 0; i < 3; i++) {
      expect((await request(app).get('/ping')).status).toBe(200);
    }
    const limited = await request(app).get('/ping');
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('rate_limited');
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);

    // A different key has its own bucket.
    expect((await request(appAs(keyUser('k2'))).get('/ping')).status).toBe(200);
  });

  it('never limits human sessions', async () => {
    const app = appAs(HUMAN);
    for (let i = 0; i < 10; i++) {
      expect((await request(app).get('/ping')).status).toBe(200);
    }
  });

  it('is disabled when the limit is 0', async () => {
    process.env.API_KEY_RATE_LIMIT = '0';
    const app = appAs(keyUser('k3'));
    for (let i = 0; i < 10; i++) {
      expect((await request(app).get('/ping')).status).toBe(200);
    }
  });
});

describe('social generation concurrency cap', () => {
  it('rejects overlapping generations beyond the cap with 429 rate_limited', async () => {
    process.env.API_KEY_RATE_LIMIT = '0'; // isolate: no request limiter here
    process.env.MAX_ACTIVE_SOCIAL_GENERATIONS = '1';
    store.content_pipeline_library = {
      a1: { workspaceId: 'ws1', status: 'approved', draft: '# One\n\nText.' },
      a2: { workspaceId: 'ws1', status: 'approved', draft: '# Two\n\nText.' },
    };
    const app = appAs(keyUser('k9'), v1Router);
    const [r1, r2] = await Promise.all([
      request(app).post('/api/v1/items/a1/socials').send({ channel: 'linkedin' }),
      request(app).post('/api/v1/items/a2/socials').send({ channel: 'x' }),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 429]);
    const limited = r1.status === 429 ? r1 : r2;
    expect(limited.body.error.code).toBe('rate_limited');
  });
});
