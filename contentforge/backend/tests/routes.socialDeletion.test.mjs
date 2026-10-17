// Deletion/archive lifecycle for social assets: drafts and finalized pieces
// are hard-deletable by any workspace member; approved content can only be
// archived (reversible), and only by its recorded approver or an admin —
// legacy assets with no status read as approved with no approver, so they are
// admin-only. Real route + lib code over the in-memory fake.
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: { workspaces: [{ id: 'ws1', name: 'Workspace One', socialPersonas: [] }] },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const socialsRouter = require('../routes/socials');

function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(socialsRouter);
  return app;
}

const MEMBER = { uid: 'u-member', email: 'member@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const APPROVER = { uid: 'u-approver', email: 'approver@x.com', role: 'creator', workspaceAccess: ['ws1'] };
const ADMIN = { uid: 'u-admin', email: 'admin@x.com', role: 'admin', workspaceAccess: 'all' };
const OUTSIDER = { uid: 'u-out', email: 'out@x.com', role: 'creator', workspaceAccess: [] };

const del = (user, body) => request(appAs(user)).post('/api/socials/delete').send(body);
const archive = (user, body) => request(appAs(user)).post('/api/socials/archive').send(body);

beforeEach(() => {
  store.content_pipeline_library = {
    item1: {
      workspaceId: 'ws1',
      draft: '# Title\n\nBody',
      socials: {
        linkedin: { post: 'draft post', status: 'draft' },
        x: { thread: ['t1'], status: 'finalized' },
        linkedin_carousel: { slides: [{ heading: 'h', body: 'b' }], status: 'in_review', review: { requestedBy: 'u-member' } },
        linkedin_poster: {
          headline: 'H', status: 'approved',
          review: { decision: 'approve', decidedBy: 'u-approver', decidedByEmail: 'approver@x.com' },
        },
        x_poster: { headline: 'legacy' }, // legacy: no status, no review — reads approved
      },
    },
  };
  store.content_pipeline_notifications = {};
});

describe('POST /api/socials/delete', () => {
  it('lets a workspace member hard-delete a draft', async () => {
    const res = await del(MEMBER, { itemId: 'item1', channel: 'linkedin', kind: 'text' });
    expect(res.status).toBe(200);
    expect(store.content_pipeline_library.item1.socials.linkedin).toBeUndefined();
    // Siblings survive the FieldValue.delete on one key.
    expect(store.content_pipeline_library.item1.socials.x).toBeDefined();
  });

  it('lets a workspace member hard-delete finalized (never-approved) content', async () => {
    const res = await del(MEMBER, { itemId: 'item1', channel: 'x', kind: 'text' });
    expect(res.status).toBe(200);
    expect(store.content_pipeline_library.item1.socials.x).toBeUndefined();
  });

  it('enforces workspace access', async () => {
    expect((await del(OUTSIDER, { itemId: 'item1', channel: 'linkedin', kind: 'text' })).status).toBe(403);
  });

  it('validates the body and 404s on a missing asset', async () => {
    expect((await del(MEMBER, {})).status).toBe(400);
    expect((await del(MEMBER, { itemId: 'item1', channel: 'x', kind: 'carousel' })).status).toBe(404);
  });

  it('refuses while a review is active', async () => {
    const res = await del(MEMBER, { itemId: 'item1', channel: 'linkedin', kind: 'carousel' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/withdraw/i);
  });

  it('refuses approved content and points at archive — even for admins', async () => {
    for (const user of [APPROVER, ADMIN]) {
      const res = await del(user, { itemId: 'item1', channel: 'linkedin', kind: 'poster' });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/archive/i);
    }
  });

  it('treats legacy status-less content as approved', async () => {
    expect((await del(MEMBER, { itemId: 'item1', channel: 'x', kind: 'poster' })).status).toBe(409);
  });
});

describe('POST /api/socials/archive', () => {
  const poster = { itemId: 'item1', channel: 'linkedin', kind: 'poster' };

  it('lets the recorded approver archive their approval', async () => {
    const res = await archive(APPROVER, poster);
    expect(res.status).toBe(200);
    const saved = store.content_pipeline_library.item1.socials.linkedin_poster;
    expect(saved.archived).toBe(true);
    expect(saved.archivedBy).toBe('u-approver');
    // Self-archive: no notification needed.
    expect(Object.keys(store.content_pipeline_notifications)).toHaveLength(0);
  });

  it('lets an admin archive and notifies the approver', async () => {
    const res = await archive(ADMIN, poster);
    expect(res.status).toBe(200);
    const notes = Object.values(store.content_pipeline_notifications);
    expect(notes).toHaveLength(1);
    expect(notes[0].userId).toBe('u-approver');
    expect(notes[0].title).toMatch(/archived the LinkedIn poster/);
  });

  it('refuses everyone else, naming the approver', async () => {
    const res = await archive(MEMBER, poster);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('approver@x.com');
    expect(store.content_pipeline_library.item1.socials.linkedin_poster.archived).toBeUndefined();
  });

  it('legacy approved content (no approver on record) is admin-only', async () => {
    const legacy = { itemId: 'item1', channel: 'x', kind: 'poster' };
    const denied = await archive(MEMBER, legacy);
    expect(denied.status).toBe(403);
    expect(denied.body.error).toMatch(/admin/i);
    expect((await archive(ADMIN, legacy)).status).toBe(200);
    expect(store.content_pipeline_library.item1.socials.x_poster.archived).toBe(true);
  });

  it('refuses non-approved content', async () => {
    expect((await archive(MEMBER, { itemId: 'item1', channel: 'linkedin', kind: 'text' })).status).toBe(409);
  });

  it('restore ({archived: false}) clears the flag under the same permission', async () => {
    await archive(APPROVER, poster);
    expect((await archive(MEMBER, { ...poster, archived: false })).status).toBe(403);
    const res = await archive(APPROVER, { ...poster, archived: false });
    expect(res.status).toBe(200);
    const saved = store.content_pipeline_library.item1.socials.linkedin_poster;
    expect(saved.archived).toBe(false);
    expect(saved.archivedBy).toBeUndefined();
    expect(saved.archivedAt).toBeUndefined();
  });

  it('enforces workspace access', async () => {
    expect((await archive(OUTSIDER, poster)).status).toBe(403);
  });
});
