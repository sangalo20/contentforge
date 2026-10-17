// The generation route's request contract: source validation (new shape +
// legacy youtubeUrls alias), workspace access, duplicate detection both by
// signature and by legacy urls, and budget rejection — everything that runs
// BEFORE the pipeline reaches Odin. Real route + lib code over the in-memory fake; no network
// (text sources resolve offline, and duplicates/validation short-circuit).
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: {
      workspaces: [
        { id: 'ws1', name: 'Workspace One', destination: 'Markdown' },
        { id: 'ws-archived', name: 'Old', archived: true },
      ],
    },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const { sourceSignature, MAX_SOURCE_CHARS } = require('../lib/sources');
const generateRouter = require('../routes/generate');

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(generateRouter);
  return app;
}

const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1', 'ws-archived'] };
const OUTSIDER = { uid: 'u2', email: 'o@x.com', role: 'creator', workspaceAccess: [] };

const post = (user, body) => request(appAs(user)).post('/api/generate/content').send(body);

beforeEach(() => {
  store.content_pipeline_library = {};
  store.content_pipeline_notifications = {};
});

describe('POST /api/generate/content — request contract', () => {
  it('validates sources and workspaceId', async () => {
    expect((await post(MEMBER, {})).status).toBe(400);
    expect((await post(MEMBER, { workspaceId: 'ws1' })).status).toBe(400);
    expect((await post(MEMBER, { workspaceId: 'ws1', sources: [{ type: 'tiktok', url: 'x' }] })).status).toBe(400);
  });

  it('enforces workspace access and archived state', async () => {
    const body = { workspaceId: 'ws1', sources: [{ type: 'text', text: 'notes' }] };
    expect((await post(OUTSIDER, body)).status).toBe(403);
    expect((await post(MEMBER, { ...body, workspaceId: 'ws-archived' })).status).toBe(403);
    // Access is checked before existence, so only an all-access user reaches the 404.
    expect((await post({ ...MEMBER, workspaceAccess: 'all' }, { ...body, workspaceId: 'nope' })).status).toBe(404);
  });

  it('rejects an over-budget pasted source with a clear message (before any AI call)', async () => {
    const res = await post(MEMBER, {
      workspaceId: 'ws1',
      sources: [{ type: 'text', text: 'x'.repeat(MAX_SOURCE_CHARS + 1) }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/over the 60,000 limit/i);
    // The failure also lands in the user's notification bell.
    const notes = Object.values(store.content_pipeline_notifications);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toMatch(/source fetch failed/i);
  });
});

describe('POST /api/generate/content — duplicate detection', () => {
  it('matches new items by source signature regardless of order', async () => {
    const inputs = [
      { type: 'text', text: 'the notes' },
      { type: 'url', url: 'https://example.com/post' },
    ];
    store.content_pipeline_library.item1 = {
      workspaceId: 'ws1',
      sourceSignature: sourceSignature(inputs),
      draft: '# Existing',
    };
    const res = await post(MEMBER, { workspaceId: 'ws1', sources: [...inputs].reverse() });
    expect(res.status).toBe(200);
    expect(res.body.existing).toBe(true);
    expect(res.body.libraryId).toBe('item1');
  });

  it('matches legacy items by their youtubeUrls when the stack is all-YouTube', async () => {
    store.content_pipeline_library.legacy1 = {
      workspaceId: 'ws1',
      youtubeUrls: ['https://youtu.be/b', 'https://youtu.be/a'],
      draft: '# Legacy',
    };
    const res = await post(MEMBER, { youtubeUrls: ['https://youtu.be/a', 'https://youtu.be/b'], workspaceId: 'ws1' });
    expect(res.status).toBe(200);
    expect(res.body.existing).toBe(true);
    expect(res.body.libraryId).toBe('legacy1');
  });

  it('does not cross-match a mixed stack against a legacy YouTube item', async () => {
    store.content_pipeline_library.legacy1 = {
      workspaceId: 'ws1',
      youtubeUrls: ['https://youtu.be/a'],
      draft: '# Legacy',
    };
    // Same video plus pasted notes = a different item; resolution proceeds
    // (and this test stops at the offline budget/resolve stage by making the
    // pasted source oversized — we only care that it did NOT return existing).
    const res = await post(MEMBER, {
      workspaceId: 'ws1',
      sources: [
        { type: 'youtube', url: 'https://youtu.be/a' },
        { type: 'text', text: 'x'.repeat(MAX_SOURCE_CHARS + 1) },
      ],
    });
    expect(res.body.existing).toBeUndefined();
    expect(res.status).toBe(400); // failed on budget, not on dedup
  });
});
