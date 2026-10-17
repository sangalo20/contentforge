// The external /api/v1 surface: workspace listing, async generation jobs
// (running the REAL pipeline against a stub Odin server), item normalization
// across the legacy data generations, and the finalize/publish verbs with
// their gates. Real route + lib code over the in-memory fake.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import http from 'node:http';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);

const store = installFakeFirebase({
  content_pipeline_config: {
    workspaces: {
      workspaces: [
        { id: 'ws1', name: 'Workspace One', destination: 'Markdown', systemPrompt: 'Write well.' },
        { id: 'ws-archived', name: 'Old', archived: true },
        { id: 'ws-review', name: 'Reviewed', requireReview: true, sanityConnection: 'storagemoguls' },
        { id: 'ws-private', name: 'Private' },
      ],
    },
  },
});
const { initWorkspacesStore } = require('../lib/workspacesStore');
await initWorkspacesStore();
const v1Router = require('../routes/v1');

// A stub Odin: 404s the streaming route (exercising the real fallback),
// answers syndication with canned social copy, and the blocking campaign
// route with a canned draft.
const odin = http.createServer((req, res) => {
  if (req.url.endsWith('/stream')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"detail":"no stream"}');
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.url.includes('/tasks/syndicate')) {
      return res.end(JSON.stringify({
        status: 'success',
        data: { copy: JSON.stringify({ post: 'A stub social post.', cta: 'Read more' }) },
      }));
    }
    res.end(JSON.stringify({
      status: 'success',
      data: { draft: '# Stub Title\n\nBody.', imagePrompt: 'a stub', qaReport: 'No changes needed.' },
    }));
  });
});
await new Promise((resolve) => odin.listen(0, '127.0.0.1', resolve));
process.env.ODIN_API_URL = `http://127.0.0.1:${odin.address().port}`;
afterAll(() => new Promise((resolve) => odin.close(resolve)));

function appAs(user) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(v1Router);
  return app;
}

const ADMIN = { uid: 'a1', email: 'a@x.com', role: 'admin', workspaceAccess: 'all' };
const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: ['ws1', 'ws-review'] };
const KEY_USER = {
  uid: 'apikey:k1', email: null, role: 'creator', workspaceAccess: ['ws1'],
  reviewerWorkspaces: [], apiKey: { id: 'k1', name: 'workbench' },
};

const jobIn = (st) => Object.entries(st.content_pipeline_jobs || {}).map(([id, d]) => ({ id, ...d }));
const waitForJob = async (id, timeoutMs = 3000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const job = store.content_pipeline_jobs?.[id];
    if (job && ['succeeded', 'failed'].includes(job.status)) return job;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(`job ${id} did not finish: ${JSON.stringify(store.content_pipeline_jobs?.[id])}`);
};

beforeEach(() => {
  store.content_pipeline_library = {};
  store.content_pipeline_jobs = {};
  store.content_pipeline_notifications = {};
  store.content_pipeline_comments = {};
  store.content_pipeline_users = {
    rev1: { email: 'reviewer@x.com', role: 'creator', workspaceAccess: ['ws1'], reviewerWorkspaces: ['ws1'] },
    plain: { email: 'plain@x.com', role: 'creator', workspaceAccess: ['ws1'], reviewerWorkspaces: [] },
  };
});

describe('GET /api/v1/workspaces', () => {
  it('lists only accessible, non-archived workspaces in the stable shape', async () => {
    const res = await request(appAs(MEMBER)).get('/api/v1/workspaces');
    expect(res.status).toBe(200);
    expect(res.body.workspaces).toEqual([
      { id: 'ws1', name: 'Workspace One', description: null, requireReview: false },
      { id: 'ws-review', name: 'Reviewed', description: null, requireReview: true },
    ]);
  });
});

describe('POST /api/v1/generations', () => {
  it('rejects bad requests synchronously with the v1 error envelope', async () => {
    const bad = await request(appAs(MEMBER)).post('/api/v1/generations').send({ workspaceId: 'ws1' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('invalid_request');
    expect(typeof bad.body.error.message).toBe('string');

    const denied = await request(appAs(KEY_USER)).post('/api/v1/generations')
      .send({ workspaceId: 'ws-private', sources: [{ type: 'text', text: 'notes' }] });
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('forbidden');
    expect(jobIn(store)).toHaveLength(0);
  });

  it('runs the real pipeline as a job: 202, stages, saved draft, no bell for API keys', async () => {
    const res = await request(appAs(KEY_USER)).post('/api/v1/generations')
      .send({ workspaceId: 'ws1', sources: [{ type: 'text', text: 'raw notes to write from' }] });
    expect(res.status).toBe(202);
    expect(res.body.job.status).toBe('queued');
    expect(res.body.job.workspaceId).toBe('ws1');

    const job = await waitForJob(res.body.job.id);
    expect(job.status).toBe('succeeded');
    expect(job.result.existing).toBe(false);
    expect(job.stages.length).toBeGreaterThan(2);
    expect(job.apiKeyId).toBe('k1');

    const item = store.content_pipeline_library[job.result.itemId];
    expect(item.status).toBe('draft');
    expect(item.draft).toContain('# Stub Title');
    // Machine callers have no notification bell to ring.
    expect(Object.keys(store.content_pipeline_notifications)).toHaveLength(0);

    // ...and the job is pollable through the API with ISO-stamped stages.
    const poll = await request(appAs(KEY_USER)).get(`/api/v1/jobs/${res.body.job.id}`);
    expect(poll.status).toBe(200);
    expect(poll.body.job.status).toBe('succeeded');
    expect(poll.body.job.result.itemId).toBe(job.result.itemId);
    expect(poll.body.job.stages[0].message).toMatch(/Starting pipeline/);
  });

  it('reports duplicate source combinations as success with existing=true', async () => {
    const body = { workspaceId: 'ws1', sources: [{ type: 'text', text: 'same notes' }] };
    const first = await request(appAs(MEMBER)).post('/api/v1/generations').send(body);
    const j1 = await waitForJob(first.body.job.id);
    const second = await request(appAs(MEMBER)).post('/api/v1/generations').send(body);
    const j2 = await waitForJob(second.body.job.id);
    expect(j2.status).toBe('succeeded');
    expect(j2.result).toEqual({ itemId: j1.result.itemId, existing: true });
  });

  it('marks user-fixable source failures as failed with errorKind=source', async () => {
    const res = await request(appAs(MEMBER)).post('/api/v1/generations')
      .send({ workspaceId: 'ws1', sources: [{ type: 'text', text: 'x'.repeat(60_001) }] });
    expect(res.status).toBe(202);
    const job = await waitForJob(res.body.job.id);
    expect(job.status).toBe('failed');
    expect(job.errorKind).toBe('source');
    expect(job.error).toMatch(/over the 60,000 limit/i);
  });
});

describe('GET /api/v1/jobs/:id', () => {
  it('404s unknown jobs and 403s jobs outside the caller workspaces', async () => {
    expect((await request(appAs(MEMBER)).get('/api/v1/jobs/nope')).status).toBe(404);
    store.content_pipeline_jobs.j1 = { type: 'generation', workspaceId: 'ws-private', status: 'running', stages: [] };
    const res = await request(appAs(KEY_USER)).get('/api/v1/jobs/j1');
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });
});

describe('items — normalization across legacy data generations', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      modern: {
        workspaceId: 'ws1', status: 'draft', draft: '# Modern Post\n\nText.',
        sources: [{ type: 'url', url: 'https://a.example/x', title: 'An Article', text: 'full text' }],
        youtubeUrls: [], titles: ['An Article'], transcript: 'full text',
      },
      legacyPending: {
        workspaceId: 'ws1', status: 'pending_approval', draft: '# Old Pending\n\nText.',
        youtubeUrls: ['https://youtu.be/abc'], titles: ['Old Video'], transcript: 't',
      },
      legacyNoStatus: {
        workspaceId: 'ws1', draft: '# Ancient\n\nText.',
        youtubeUrls: ['https://youtu.be/xyz'], titles: ['Ancient Video'], transcript: 't',
      },
      originalIdea: { workspaceId: 'ws1', sourceType: 'original', socials: {} },
      otherWs: { workspaceId: 'ws-private', status: 'draft', draft: '# Hidden' },
    };
  });

  it('lists normalized summaries, hiding legacy shapes and social-only items', async () => {
    const res = await request(appAs(MEMBER)).get('/api/v1/workspaces/ws1/items');
    expect(res.status).toBe(200);
    const byId = Object.fromEntries(res.body.items.map((i) => [i.id, i]));
    expect(Object.keys(byId).sort()).toEqual(['legacyNoStatus', 'legacyPending', 'modern']);
    expect(byId.legacyPending.status).toBe('draft');
    expect(byId.legacyNoStatus.status).toBe('approved');
    expect(byId.legacyNoStatus.sources).toEqual([{ type: 'youtube', url: 'https://youtu.be/xyz', title: 'Ancient Video' }]);
    expect(byId.modern.sources).toEqual([{ type: 'url', url: 'https://a.example/x', title: 'An Article' }]);
    expect(byId.modern.title).toBe('Modern Post');
    // Legacy fields never leak through v1.
    for (const item of res.body.items) {
      expect(item).not.toHaveProperty('transcript');
      expect(item).not.toHaveProperty('youtubeUrls');
      expect(item).not.toHaveProperty('titles');
    }
  });

  it('filters by NORMALIZED status and paginates with a cursor', async () => {
    const drafts = await request(appAs(MEMBER)).get('/api/v1/workspaces/ws1/items?status=draft');
    expect(drafts.body.items.map((i) => i.id).sort()).toEqual(['legacyPending', 'modern']);
    expect((await request(appAs(MEMBER)).get('/api/v1/workspaces/ws1/items?status=bogus')).status).toBe(400);

    const page1 = await request(appAs(MEMBER)).get('/api/v1/workspaces/ws1/items?limit=2');
    expect(page1.body.items).toHaveLength(2);
    expect(page1.body.nextCursor).toBe(page1.body.items[1].id);
    const page2 = await request(appAs(MEMBER)).get(`/api/v1/workspaces/ws1/items?limit=2&cursor=${page1.body.nextCursor}`);
    expect(page2.body.items).toHaveLength(1);
    expect(page2.body.nextCursor).toBeNull();
  });

  it('fetches one item with the draft body, and guards workspace access', async () => {
    const res = await request(appAs(MEMBER)).get('/api/v1/items/modern');
    expect(res.body.item.draft).toContain('# Modern Post');
    expect(res.body.item).not.toHaveProperty('transcript');
    expect((await request(appAs(KEY_USER)).get('/api/v1/items/otherWs')).status).toBe(403);
    expect((await request(appAs(MEMBER)).get('/api/v1/items/nope')).status).toBe(404);
  });
});

describe('POST /api/v1/items — import a finished article', () => {
  it('imports a draft as-is: H1 title, status draft, import provenance, visible in the list', async () => {
    const draft = '# Written Elsewhere\n\nEvery word untouched by Oscar.';
    const res = await request(appAs(KEY_USER)).post('/api/v1/items')
      .send({ workspaceId: 'ws1', draft });
    expect(res.status).toBe(201);
    expect(res.body.item.title).toBe('Written Elsewhere');
    expect(res.body.item.status).toBe('draft');
    expect(res.body.item.sources).toEqual([{ type: 'import', title: 'Written Elsewhere' }]);
    expect(res.body.item.draft).toBe(draft);

    const stored = store.content_pipeline_library[res.body.item.id];
    expect(stored.createdBy).toBe('apikey:k1');

    const list = await request(appAs(KEY_USER)).get('/api/v1/workspaces/ws1/items');
    expect(list.body.items.map((i) => i.id)).toContain(res.body.item.id);
  });

  it('requires a derivable title, accepting the title param for H1-less drafts', async () => {
    const noTitle = await request(appAs(MEMBER)).post('/api/v1/items')
      .send({ workspaceId: 'ws1', draft: 'Just a paragraph, no heading.' });
    expect(noTitle.status).toBe(400);
    expect(noTitle.body.error.message).toMatch(/H1|title/);

    const withParam = await request(appAs(MEMBER)).post('/api/v1/items')
      .send({ workspaceId: 'ws1', draft: 'Just a paragraph.', title: 'Named Explicitly' });
    expect(withParam.status).toBe(201);
    expect(withParam.body.item.title).toBe('Named Explicitly');
    // The draft body is never modified.
    expect(withParam.body.item.draft).toBe('Just a paragraph.');
  });

  it('validates workspace access, existence, archived state, and the draft itself', async () => {
    const body = { workspaceId: 'ws1', draft: '# X\n\nY' };
    expect((await request(appAs(KEY_USER)).post('/api/v1/items').send({ ...body, workspaceId: 'ws-private' })).status).toBe(403);
    expect((await request(appAs(MEMBER)).post('/api/v1/items').send({ ...body, workspaceId: 'ws-archived' })).status).toBe(403);
    expect((await request(appAs(MEMBER)).post('/api/v1/items').send({ workspaceId: 'ws1' })).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/v1/items').send({ workspaceId: 'ws1', draft: '   ' })).status).toBe(400);
  });

  it('imported items flow through the existing lifecycle (finalize)', async () => {
    const res = await request(appAs(MEMBER)).post('/api/v1/items')
      .send({ workspaceId: 'ws1', draft: '# Lifecycle\n\nBody.' });
    const fin = await request(appAs(MEMBER)).post(`/api/v1/items/${res.body.item.id}/finalize`).send({});
    expect(fin.status).toBe(200);
    expect(store.content_pipeline_library[res.body.item.id].status).toBe('finalized');
  });
});

describe('POST /api/v1/items/:id/finalize', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      d1: { workspaceId: 'ws1', status: 'draft', draft: '# One' },
      pub: { workspaceId: 'ws1', status: 'published', draft: '# Done' },
      rev: { workspaceId: 'ws1', status: 'in_review', draft: '# Reviewing' },
    };
  });

  it('finalizes a draft, optionally replacing the draft body', async () => {
    const res = await request(appAs(KEY_USER)).post('/api/v1/items/d1/finalize').send({ draft: '# One (edited)' });
    expect(res.status).toBe(200);
    expect(store.content_pipeline_library.d1.status).toBe('finalized');
    expect(store.content_pipeline_library.d1.draft).toBe('# One (edited)');

    // Without a draft body the existing draft is kept (unlike the app route).
    const again = await request(appAs(KEY_USER)).post('/api/v1/items/d1/finalize').send({});
    expect(again.status).toBe(200);
    expect(store.content_pipeline_library.d1.draft).toBe('# One (edited)');
  });

  it('refuses published or in-review items, and non-string drafts', async () => {
    expect((await request(appAs(MEMBER)).post('/api/v1/items/pub/finalize').send({})).status).toBe(409);
    expect((await request(appAs(MEMBER)).post('/api/v1/items/rev/finalize').send({})).status).toBe(409);
    const bad = await request(appAs(MEMBER)).post('/api/v1/items/d1/finalize').send({ draft: 42 });
    expect(bad.status).toBe(400);
    expect(store.content_pipeline_library.rev.status).toBe('in_review');
  });
});

describe('POST /api/v1/items/:id/publish', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      noConn: { workspaceId: 'ws1', status: 'finalized', draft: '# X' },
      gated: { workspaceId: 'ws-review', status: 'finalized', draft: '# Y' },
    };
  });

  it('requires the admin role, in the v1 envelope', async () => {
    const res = await request(appAs(MEMBER)).post('/api/v1/items/noConn/publish').send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('maps publish gate failures: missing connection and the review gate', async () => {
    const noConn = await request(appAs(ADMIN)).post('/api/v1/items/noConn/publish').send({});
    expect(noConn.status).toBe(400);
    expect(noConn.body.error.message).toMatch(/no Sanity connection/i);

    const gated = await request(appAs(ADMIN)).post('/api/v1/items/gated/publish').send({});
    expect(gated.status).toBe(403);
    expect(gated.body.error.message).toMatch(/reviewer approval/i);
    expect(store.content_pipeline_library.gated.status).toBe('finalized');
  });
});

describe('reviewers + review submission', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      fin: { workspaceId: 'ws1', status: 'finalized', draft: '# Ready\n\nText.' },
      raw: { workspaceId: 'ws1', status: 'draft', draft: '# Not yet' },
    };
  });

  it('lists eligible reviewers for a workspace', async () => {
    const res = await request(appAs(KEY_USER)).get('/api/v1/workspaces/ws1/reviewers');
    expect(res.status).toBe(200);
    expect(res.body.reviewers).toEqual([{ uid: 'rev1', email: 'reviewer@x.com' }]);
  });

  it('submits for review with reviewers given by email, notifying them', async () => {
    const res = await request(appAs(KEY_USER)).post('/api/v1/items/fin/review')
      .send({ reviewers: ['reviewer@x.com'], note: 'please check tone' });
    expect(res.status).toBe(200);
    expect(res.body.review).toEqual({ status: 'in_review', reviewers: ['rev1'], note: 'please check tone' });
    expect(store.content_pipeline_library.fin.status).toBe('in_review');
    expect(store.content_pipeline_library.fin.review.requestedBy).toBe('apikey:k1');
    const notes = Object.values(store.content_pipeline_notifications);
    expect(notes).toHaveLength(1);
    expect(notes[0].userId ?? notes[0].uid ?? 'rev1').toBeTruthy();
  });

  it('rejects unknown reviewer emails, ineligible reviewers, and unfinalized content', async () => {
    const unknown = await request(appAs(MEMBER)).post('/api/v1/items/fin/review')
      .send({ reviewers: ['ghost@x.com'] });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.message).toMatch(/ghost@x.com/);

    const ineligible = await request(appAs(MEMBER)).post('/api/v1/items/fin/review')
      .send({ reviewers: ['plain@x.com'] });
    expect(ineligible.status).toBe(400);
    expect(ineligible.body.error.message).toMatch(/not an eligible reviewer/i);

    const notReady = await request(appAs(MEMBER)).post('/api/v1/items/raw/review')
      .send({ reviewers: ['reviewer@x.com'] });
    expect(notReady.status).toBe(422);
    expect(notReady.body.error.code).toBe('conflict');
  });
});

describe('comments and mentions', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      it1: { workspaceId: 'ws1', status: 'draft', draft: '# Post', titles: ['Post'] },
    };
  });

  it('posts a comment tagging a member by email, and lists it back', async () => {
    const res = await request(appAs(KEY_USER)).post('/api/v1/items/it1/comments')
      .send({ text: 'Please take a look @reviewer', mentions: ['reviewer@x.com'] });
    expect(res.status).toBe(201);
    expect(res.body.comment.mentions).toEqual(['rev1']);
    expect(res.body.comment.authorUid).toBe('apikey:k1');

    const mentionNotes = Object.values(store.content_pipeline_notifications);
    expect(mentionNotes).toHaveLength(1);
    expect(mentionNotes[0].type).toBe('mention');

    const list = await request(appAs(MEMBER)).get('/api/v1/items/it1/comments');
    expect(list.status).toBe(200);
    expect(list.body.comments).toHaveLength(1);
    expect(list.body.comments[0].text).toBe('Please take a look @reviewer');
  });

  it('rejects empty text and unknown mention emails with the v1 envelope', async () => {
    const empty = await request(appAs(MEMBER)).post('/api/v1/items/it1/comments').send({ text: '  ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error.code).toBe('invalid_request');

    const ghost = await request(appAs(MEMBER)).post('/api/v1/items/it1/comments')
      .send({ text: 'hello', mentions: ['ghost@x.com'] });
    expect(ghost.status).toBe(400);
    expect(ghost.body.error.message).toMatch(/ghost@x.com/);
  });
});

describe('social content', () => {
  beforeEach(() => {
    store.content_pipeline_library = {
      art: {
        workspaceId: 'ws1', status: 'approved', draft: '# Big Article\n\nLots of text.',
        socials: {
          linkedin: { copy: { post: 'Legacy nested post', cta: 'Old CTA' }, function: 'teach' },
          x_carousel: { status: 'draft', slides: [{ kind: 'hook', heading: 'H', body: 'B' }], cta: 'Swipe' },
        },
      },
    };
  });

  it('lists the flattened social library with normalized legacy entries', async () => {
    const res = await request(appAs(MEMBER)).get('/api/v1/workspaces/ws1/socials');
    expect(res.status).toBe(200);
    const byId = Object.fromEntries(res.body.socials.map((e) => [e.id, e]));
    expect(byId['art:linkedin'].preview).toBe('Legacy nested post');
    expect(byId['art:linkedin'].status).toBe('approved'); // legacy no-status default
    expect(byId['art:x_carousel'].type).toBe('carousel');
    expect(byId['art:x_carousel'].slideCount).toBe(1);
  });

  it('fetches one social piece with full content, normalizing the legacy copy shape', async () => {
    const res = await request(appAs(MEMBER)).get('/api/v1/items/art/socials/linkedin');
    expect(res.status).toBe(200);
    expect(res.body.social.post).toBe('Legacy nested post');
    expect(res.body.social.cta).toBe('Old CTA');

    const carousel = await request(appAs(MEMBER)).get('/api/v1/items/art/socials/x?format=carousel');
    expect(carousel.body.social.slides).toHaveLength(1);
    expect((await request(appAs(MEMBER)).get('/api/v1/items/art/socials/x?format=poster')).status).toBe(404);
    expect((await request(appAs(MEMBER)).get('/api/v1/items/art/socials/tiktok')).status).toBe(400);
  });

  it('generates social copy through the real pipeline (stub Odin) and saves a reviewable draft', async () => {
    const res = await request(appAs(KEY_USER)).post('/api/v1/items/art/socials')
      .send({ channel: 'x', function: 'teach' });
    expect(res.status).toBe(201);
    expect(res.body.social.post).toBe('A stub social post.');
    expect(res.body.social.status).toBe('draft');
    expect(store.content_pipeline_library.art.socials.x.post).toBe('A stub social post.');

    const bad = await request(appAs(KEY_USER)).post('/api/v1/items/art/socials')
      .send({ channel: 'tiktok' });
    expect(bad.status).toBe(400);
  });
});

describe('deletion is human-only', () => {
  it('refuses API keys on the delete routes regardless of role, but allows humans', async () => {
    const libraryRouter = require('../routes/library');
    const socialsRouter = require('../routes/socials');
    const appWith = (router, user) => {
      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => { req.user = user; next(); });
      app.use(router);
      return app;
    };
    const ADMIN_KEY = { ...ADMIN, uid: 'apikey:k9', apiKey: { id: 'k9', name: 'admin key' } };
    store.content_pipeline_library = {
      d1: { workspaceId: 'ws1', status: 'draft', draft: '# Doomed', socials: { linkedin: { status: 'draft', post: 'p' } } },
    };

    const keyDelete = await request(appWith(libraryRouter, ADMIN_KEY)).delete('/api/library/d1');
    expect(keyDelete.status).toBe(403);
    const keySocialDelete = await request(appWith(socialsRouter, ADMIN_KEY)).post('/api/socials/delete')
      .send({ itemId: 'd1', channel: 'linkedin', kind: 'text' });
    expect(keySocialDelete.status).toBe(403);
    expect(store.content_pipeline_library.d1).toBeTruthy();

    const humanSocialDelete = await request(appWith(socialsRouter, ADMIN)).post('/api/socials/delete')
      .send({ itemId: 'd1', channel: 'linkedin', kind: 'text' });
    expect(humanSocialDelete.status).toBe(200);
    const humanDelete = await request(appWith(libraryRouter, ADMIN)).delete('/api/library/d1');
    expect(humanDelete.status).toBe(200);
    expect(store.content_pipeline_library.d1).toBeUndefined();
  });
});
