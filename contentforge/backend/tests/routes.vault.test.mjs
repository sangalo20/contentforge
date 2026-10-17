// The Source Vault: url→videoId identity, entry listing (no text in the
// ledger), staging with dedup, usage recording (dedup by itemId), channel
// sync against a fake Supadata + stubbed fetchers, the vault source type in
// composition, and the admin gate on channel config. No live network.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);
const store = installFakeFirebase({});
const axios = require('axios');
const vault = require('../lib/vault');
const { saveWorkspaces } = require('../lib/workspacesStore');
const yt = require('../lib/sources/youtube');
const { resolveSources, composeSourceText, normalizeSourceInputs } = require('../lib/sources');
const vaultRouter = require('../routes/vault');

function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(vaultRouter);
  return app;
}

const MEMBER = { uid: 'u1', email: 'm@x.com', role: 'creator', workspaceAccess: 'all' };
const SCOPED = { uid: 'u2', email: 's@x.com', role: 'creator', workspaceAccess: ['ws-other'] };
const ADMIN = { uid: 'u-admin', email: 'a@x.com', role: 'admin', workspaceAccess: 'all' };

beforeEach(() => {
  store.content_pipeline_vault = {};
  store.content_pipeline_config = {};
  process.env.SUPADATA_API_KEY = 'test-key';
  vi.restoreAllMocks();
});

describe('videoIdOf', () => {
  it('normalizes every common YouTube URL shape', () => {
    expect(vault.videoIdOf('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
    expect(vault.videoIdOf('https://youtu.be/abc123')).toBe('abc123');
    expect(vault.videoIdOf('https://www.youtube.com/shorts/xyz')).toBe('xyz');
    expect(vault.videoIdOf('https://vimeo.com/123')).toBeNull();
    expect(vault.videoIdOf('not a url')).toBeNull();
  });
});

describe('GET /api/vault', () => {
  it('lists only the workspace\'s entries, without their text', async () => {
    store.content_pipeline_vault.e1 = {
      title: 'Day 001', group: 'Storage 100 — Section 1', workspaceIds: ['ws1'], type: 'text',
      text: 'SECRET FULL TEXT', chars: 16, usedIn: [{ title: 'Some Article', external: true }],
    };
    store.content_pipeline_vault.e2 = {
      title: 'Elsewhere', group: 'Other', workspaceIds: ['ws-other'], type: 'text', text: 'x', usedIn: [],
    };
    expect((await request(appAs(MEMBER)).get('/api/vault')).status).toBe(400); // workspaceId required
    const res = await request(appAs(MEMBER)).get('/api/vault?workspaceId=ws1');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(1);
    expect(res.body.entries[0].title).toBe('Day 001');
    expect(JSON.stringify(res.body.entries)).not.toContain('SECRET FULL TEXT');
    // Text loads on demand — and only with access to one of its workspaces.
    expect((await request(appAs(MEMBER)).get('/api/vault/e1/text')).body.text).toBe('SECRET FULL TEXT');
    expect((await request(appAs(SCOPED)).get('/api/vault/e1/text')).status).toBe(403);
    // Access to the workspace itself is enforced on the listing.
    expect((await request(appAs(SCOPED)).get('/api/vault?workspaceId=ws1')).status).toBe(403);
  });
});

describe('staging', () => {
  it('stages new URLs, dedups existing videos, and reports failures', async () => {
    store.content_pipeline_vault.e1 = { title: 'Existing', workspaceIds: ['ws1'], type: 'youtube', videoId: 'already', text: 'x', usedIn: [] };
    vi.spyOn(yt, 'fetchVideoTitle').mockResolvedValue('A Fresh Video');
    vi.spyOn(yt, 'fetchYoutubeTranscript').mockResolvedValue('fresh transcript text');

    const res = await request(appAs(MEMBER)).post('/api/vault/stage').send({
      urls: ['https://youtu.be/fresh1', 'https://youtu.be/already', 'https://vimeo.com/nope'],
      workspaceId: 'ws1',
    });
    expect(res.status).toBe(200);
    expect(res.body.staged).toHaveLength(1);
    expect(res.body.staged[0].title).toBe('A Fresh Video');
    expect(res.body.existed).toBe(1);
    expect(res.body.failed).toHaveLength(1);
    const created = Object.values(store.content_pipeline_vault).find((e) => e.videoId === 'fresh1');
    expect(created.text).toBe('fresh transcript text');
    expect(created.origin).toBe('staged');
    expect(created.workspaceIds).toEqual(['ws1']);
  });

  it('staging an existing video from another workspace shares it there', async () => {
    store.content_pipeline_vault.e1 = { title: 'Existing', workspaceIds: ['ws1'], type: 'youtube', videoId: 'already', text: 'x', usedIn: [] };
    const res = await request(appAs(MEMBER)).post('/api/vault/stage').send({
      urls: ['https://youtu.be/already'], workspaceId: 'ws2',
    });
    expect(res.status).toBe(200);
    expect(store.content_pipeline_vault.e1.workspaceIds).toEqual(['ws1', 'ws2']);
  });

  it('validates the url list and workspace access', async () => {
    expect((await request(appAs(MEMBER)).post('/api/vault/stage').send({})).status).toBe(400);
    expect((await request(appAs(MEMBER)).post('/api/vault/stage').send({ urls: ['x'] })).status).toBe(400);
    expect((await request(appAs(SCOPED)).post('/api/vault/stage').send({ urls: ['https://youtu.be/x'], workspaceId: 'ws1' })).status).toBe(403);
  });
});

describe('usage recording', () => {
  it('appends usage and dedups by itemId', async () => {
    store.content_pipeline_vault.e1 = { title: 'Day 001', type: 'text', text: 'x', usedIn: [] };
    await vault.recordUsage('e1', { itemId: 'item1', workspaceId: 'ws1', title: 'The Article', kind: 'article' });
    await vault.recordUsage('e1', { itemId: 'item1', workspaceId: 'ws1', title: 'The Article', kind: 'article' });
    await vault.recordUsage('e1', { itemId: 'item2', workspaceId: 'ws1', title: 'Another', kind: 'article' });
    expect(store.content_pipeline_vault.e1.usedIn).toHaveLength(2);
  });
});

describe('channel sync', () => {
  it('is admin-gated for config, open for sync; adds only new videos', async () => {
    expect((await request(appAs(MEMBER)).put('/api/vault/channels').send({ channels: [] })).status).toBe(403);

    const put = await request(appAs(ADMIN)).put('/api/vault/channels').send({
      channels: [{ id: '@storagemastermind', label: 'Storage Mastermind', workspaceId: 'ws1' }],
    });
    expect(put.status).toBe(200);

    store.content_pipeline_vault.e1 = { title: 'Old', workspaceIds: ['ws1'], type: 'youtube', videoId: 'old1', text: 'x', usedIn: [] };
    vi.spyOn(yt, 'fetchVideoTitle').mockResolvedValue('New Upload');
    vi.spyOn(yt, 'fetchYoutubeTranscript').mockResolvedValue('new transcript');
    const http = { get: async () => ({ status: 200, data: { videoIds: ['old1', 'new1'] } }) };

    const report = await vault.syncChannels({ addedBy: 'u1', deps: { http } });
    expect(report.skippedExisting).toBe(1);
    expect(report.added).toHaveLength(1);
    expect(report.skippedShorts).toBe(0);
    const created = Object.values(store.content_pipeline_vault).find((e) => e.videoId === 'new1');
    expect(created.group).toBe('Storage Mastermind');
    expect(created.origin).toBe('channel-sync');
    expect(created.workspaceIds).toEqual(['ws1']);
    expect(store.content_pipeline_config.vault.lastSyncAt).toBeTruthy();
  });
});

describe('channel sync bounds', () => {
  it('skips shorts by duration and caps transcript ingests per run', async () => {
    store.content_pipeline_config.vault = { channels: [{ id: '@c', label: 'C', workspaceId: 'ws1' }] };
    vi.spyOn(yt, 'fetchYoutubeTranscript').mockResolvedValue('transcript');
    const videoIds = ['short1', ...Array.from({ length: 12 }, (_, i) => `long${i}`)];
    const http = {
      get: async (url, { params }) => {
        if (String(url).includes('/youtube/channel/videos')) return { status: 200, data: { videoIds } };
        if (String(url).includes('/youtube/video')) {
          const id = params.id;
          return { status: 200, data: { title: `Video ${id}`, duration: id === 'short1' ? 45 : 900 } };
        }
        return { status: 404, data: {} };
      },
    };
    const report = await vault.syncChannels({ addedBy: 'u1', deps: { http } });
    expect(report.skippedShorts).toBe(1);
    expect(report.added).toHaveLength(10); // MAX_INGESTS_PER_SYNC
    expect(report.remaining).toBe(2);
  });
});

describe('scoutDigest', () => {
  it('builds per-workspace entries with usage states and excerpts, no full text', async () => {
    store.content_pipeline_vault = {
      v1: { title: 'Day 019', group: 'S2', workspaceIds: ['ws1'], type: 'text', chars: 9000,
            text: 'x'.repeat(9000), usedIn: [] },
      v2: { title: 'EP06', group: 'Idiots', workspaceIds: ['ws1', 'ws2'], type: 'text', chars: 500,
            text: 'podcast text', usedIn: [{ workspaceId: 'ws2', title: 'Issue 6', kind: 'article' }] },
      v3: { title: 'Elsewhere only', group: 'G', workspaceIds: ['ws2'], type: 'text', text: 'y', usedIn: [] },
    };
    const digest = await vault.scoutDigest('ws1');
    expect(digest.map((e) => e.id).sort()).toEqual(['v1', 'v2']);
    const v1 = digest.find((e) => e.id === 'v1');
    expect(v1.excerpt).toHaveLength(400); // capped, never the full transcript
    expect(v1.usedHere).toBeUndefined();
    const v2 = digest.find((e) => e.id === 'v2');
    expect(v2.usedElsewhere[0]).toContain('Issue 6');
    expect(v2.usedHere).toBeUndefined();
  });
});

describe('POST /api/vault/scout/stream validation', () => {
  it('requires workspaceId + message and enforces access before any proxying', async () => {
    expect((await request(appAs(MEMBER)).post('/api/vault/scout/stream').send({})).status).toBe(400);
    expect((await request(appAs(SCOPED)).post('/api/vault/scout/stream').send({ workspaceId: 'ws1', message: 'hi' })).status).toBe(403);
  });
});

describe('the scout read loop', () => {
  const sse = (events) => Readable.from(events.map((e) => `data: ${JSON.stringify(e)}\n\n`));

  it('executes read_transcript against the vault and calls Odin back with the round-trip', async () => {
    store.content_pipeline_library = {};
    store.content_pipeline_vault.e1 = {
      title: 'Day 019 - The Feasibility Study', group: 'Storage 100', workspaceIds: ['ws1'],
      type: 'youtube', text: 'THE FULL TRANSCRIPT ' + 'x'.repeat(7000), chars: 7020, usedIn: [],
    };
    saveWorkspaces([{ id: 'ws1', name: 'Storage 101', systemPrompt: 'PERSONA' }]);
    const post = vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: sse([
        { type: 'text', content: 'Let me check that one. ' },
        { type: 'tool_call', content: { id: 'call_1', name: 'read_transcript', vaultId: 'e1' } },
      ]) })
      .mockResolvedValueOnce({ data: sse([
        { type: 'text', content: 'Read it — feasibility gates the deal.' },
      ]) });

    const res = await request(appAs(MEMBER)).post('/api/vault/scout/stream')
      .send({ workspaceId: 'ws1', message: 'what does Day 019 actually cover?', history: [] });

    expect(res.status).toBe(200);
    // Both rounds' text reached the client; the tool_call itself did not.
    expect(res.text).toContain('Let me check that one.');
    expect(res.text).toContain('feasibility gates the deal');
    expect(res.text).toContain('Odin is reading');
    expect(res.text).not.toContain('tool_call');

    // The second Odin call carries the tool round-trip and no fresh message.
    expect(post).toHaveBeenCalledTimes(2);
    const second = post.mock.calls[1][1];
    expect(second.message).toBe('');
    const history = second.context.history;
    expect(history.at(-3).content).toBe('what does Day 019 actually cover?');
    expect(history.at(-2).tool_calls[0].id).toBe('call_1');
    expect(history.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'call_1' });
    expect(history.at(-1).content).toContain('THE FULL TRANSCRIPT');
    expect(history.at(-1).content.length).toBeLessThanOrEqual(6000);
  });

  it('executes search_memory and feeds the result back (empty memory degrades gracefully)', async () => {
    store.content_pipeline_library = {};
    saveWorkspaces([{ id: 'ws1', name: 'Storage 101' }]);
    const post = vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: sse([
        { type: 'tool_call', content: { id: 'call_m1', name: 'search_memory', query: 'title rules' } },
      ]) })
      .mockResolvedValueOnce({ data: sse([{ type: 'text', content: 'Nothing on file — fresh slate.' }]) });

    const res = await request(appAs(MEMBER)).post('/api/vault/scout/stream')
      .send({ workspaceId: 'ws1', message: 'what did we decide about titles?', history: [] });

    expect(res.text).toContain('Odin is searching memory');
    expect(res.text).toContain('fresh slate');
    const history = post.mock.calls[1][1].context.history;
    expect(history.at(-2).tool_calls[0].function.name).toBe('search_memory');
    // Athena is unconfigured in tests: the executor degrades, never throws.
    expect(history.at(-1)).toMatchObject({ role: 'tool', tool_call_id: 'call_m1', content: '(nothing found in long-term memory)' });
  });

  it('refuses reads of entries outside the workspace', async () => {
    store.content_pipeline_library = {};
    store.content_pipeline_vault.foreign = { title: 'Foreign', workspaceIds: ['ws-other'], type: 'text', text: 'PRIVATE', usedIn: [] };
    saveWorkspaces([{ id: 'ws1', name: 'Storage 101' }]);
    const post = vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: sse([
        { type: 'tool_call', content: { id: 'call_1', name: 'read_transcript', vaultId: 'foreign' } },
      ]) })
      .mockResolvedValueOnce({ data: sse([{ type: 'text', content: 'ok' }]) });

    const res = await request(appAs(MEMBER)).post('/api/vault/scout/stream')
      .send({ workspaceId: 'ws1', message: 'read it', history: [] });

    expect(res.text).not.toContain('PRIVATE');
    const history = post.mock.calls[1][1].context.history;
    expect(history.at(-1).content).toContain("not in this workspace's vault");
  });
});

describe('the vault source type', () => {
  it('composes from stored text and carries the vaultId onto the resolved source', async () => {
    store.content_pipeline_vault.e1 = { title: 'Day 003 - Storage vs Apartments', type: 'text', text: 'the stored transcript', chars: 21, usedIn: [] };
    const { inputs } = normalizeSourceInputs({ sources: [{ type: 'vault', vaultId: 'e1' }, { type: 'text', text: 'notes' }] });
    const sources = await resolveSources(inputs, {});
    expect(sources[0].vaultId).toBe('e1');
    expect(sources[0].title).toBe('Day 003 - Storage vs Apartments');
    const combined = composeSourceText(sources);
    expect(combined).toContain('=== SOURCE 1 (vault): Day 003 - Storage vs Apartments ===');
    expect(combined).toContain('the stored transcript');
  });

  it('fails clearly for a missing entry and validates input', async () => {
    expect(normalizeSourceInputs({ sources: [{ type: 'vault' }] }).error).toMatch(/vaultId is required/);
    const { inputs } = normalizeSourceInputs({ sources: [{ type: 'vault', vaultId: 'ghost' }] });
    await expect(resolveSources(inputs, {})).rejects.toThrow(/no longer exists/);
  });
});
