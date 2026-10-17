// Route-level tests for the comments endpoints — the IDOR guard is the point:
// only members of an item's workspace may read or write its thread. Runs the
// REAL route + lib code over the in-memory Firestore fake (see helpers/).
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

// The seam must be installed before the route modules load lib/firebase.
const store = installFakeFirebase({});
const commentsRouter = require('../routes/comments');

// Test app: a stubbed authenticated user in place of the real middleware.
function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(commentsRouter);
  return app;
}

const MEMBER = { uid: 'u-member', email: 'member@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const OUTSIDER = { uid: 'u-out', email: 'out@x.com', role: 'creator', workspaceAccess: ['ws2'] };
const ADMIN_ALL = { uid: 'u-admin', email: 'admin@x.com', role: 'admin', workspaceAccess: 'all' };

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  Object.assign(store, {
    content_pipeline_library: {
      item1: { workspaceId: 'ws1', title: 'The item' },
    },
    content_pipeline_comments: {
      c1: { itemId: 'item1', text: 'hello', authorUid: 'u-member' },
    },
    content_pipeline_notifications: {},
  });
});

describe('GET /api/library/item/:itemId/comments', () => {
  it('members of the workspace can read the thread', async () => {
    const res = await request(appAs(MEMBER)).get('/api/library/item/item1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe('hello');
  });

  it('non-members are refused (IDOR guard)', async () => {
    const res = await request(appAs(OUTSIDER)).get('/api/library/item/item1/comments');
    expect(res.status).toBe(403);
  });

  it('missing items 404', async () => {
    const res = await request(appAs(MEMBER)).get('/api/library/item/nope/comments');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/library/item/:itemId/comments', () => {
  it('non-members cannot post (IDOR guard)', async () => {
    const res = await request(appAs(OUTSIDER))
      .post('/api/library/item/item1/comments')
      .send({ text: 'sneaky' });
    expect(res.status).toBe(403);
    expect(Object.keys(store.content_pipeline_comments)).toHaveLength(1);
  });

  it('members can post; mentioned users are notified, the author is not', async () => {
    const res = await request(appAs(ADMIN_ALL))
      .post('/api/library/item/item1/comments')
      .send({ text: 'ping @someone', mentions: ['u-target', 'u-admin'] });
    expect(res.status).toBe(201);
    expect(Object.keys(store.content_pipeline_comments)).toHaveLength(2);
    // Self-mentions are stripped; only the other user gets a notification.
    const notifs = Object.values(store.content_pipeline_notifications);
    expect(notifs).toHaveLength(1);
    expect(notifs[0].userId).toBe('u-target');
    expect(notifs[0].type).toBe('mention');
  });

  it('rejects empty and oversized comments', async () => {
    expect((await request(appAs(MEMBER)).post('/api/library/item/item1/comments').send({ text: '  ' })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/library/item/item1/comments').send({ text: 'x'.repeat(5001) })).status).toBe(400);
  });
});

describe('POST /api/library/item/:itemId/comments/:commentId/reactions', () => {
  it('members can toggle a reaction on and off', async () => {
    let res = await request(appAs(MEMBER))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reactions['👍']).toEqual(['u-member']);
    expect(store.content_pipeline_comments.c1.reactions['👍']).toEqual(['u-member']);

    res = await request(appAs(MEMBER))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reactions['👍']).toBeUndefined();
    expect(store.content_pipeline_comments.c1.reactions['👍']).toBeUndefined();
  });

  it('reactions from different users accumulate on the same emoji', async () => {
    await request(appAs(MEMBER))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '🔥' });
    const res = await request(appAs(ADMIN_ALL))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '🔥' });
    expect(res.status).toBe(200);
    expect(res.body.reactions['🔥']).toEqual(['u-member', 'u-admin']);
  });

  it('non-members cannot react (IDOR guard)', async () => {
    const res = await request(appAs(OUTSIDER))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '👍' });
    expect(res.status).toBe(403);
    expect(store.content_pipeline_comments.c1.reactions).toBeUndefined();
  });

  it('rejects emoji outside the palette', async () => {
    const res = await request(appAs(MEMBER))
      .post('/api/library/item/item1/comments/c1/reactions')
      .send({ emoji: '🦄' });
    expect(res.status).toBe(400);
  });

  it('404s when the comment does not belong to the item in the URL', async () => {
    store.content_pipeline_library.item2 = { workspaceId: 'ws1', title: 'Other item' };
    const res = await request(appAs(MEMBER))
      .post('/api/library/item/item2/comments/c1/reactions')
      .send({ emoji: '👍' });
    expect(res.status).toBe(404);
  });
});
