// Athena MemOS client: disabled-by-default no-ops, session caching per
// (workspace, user), recall-block formatting from segments + search hits,
// and swallowed write failures. Mocked axios; no live network.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axios = require('axios');
const athena = require('../lib/athena');

beforeEach(() => {
  athena._resetSessions();
  vi.restoreAllMocks();
  process.env.ATHENA_API_URL = 'https://athena.example';
  process.env.ATHENA_API_KEY = 'test-key';
});

afterEach(() => {
  delete process.env.ATHENA_API_URL;
  delete process.env.ATHENA_API_KEY;
});

describe('when Athena is not configured', () => {
  it('recall returns empty and store is a silent no-op', async () => {
    delete process.env.ATHENA_API_URL;
    const post = vi.spyOn(axios, 'post');
    const get = vi.spyOn(axios, 'get');
    expect(await athena.recallBlock('ws1', 'u1', 'anything')).toBe('');
    await athena.storeTurn('ws1', 'u1', 'hello', 'world');
    expect(post).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });
});

describe('recallBlock', () => {
  it('formats segments and search hits, deduped, and caches the session', async () => {
    const post = vi.spyOn(axios, 'post').mockImplementation(async (url) => {
      if (url.endsWith('/sessions')) return { data: { sessionId: 'sid-1' } };
      return { data: { results: [
        { content: 'Prefers concrete numbers in titles' },
        { content: 'Never double-dip course content into the newsletter' },
      ] } };
    });
    vi.spyOn(axios, 'get').mockResolvedValue({ data: { segments: [
      { summary: 'Prefers concrete numbers in titles' }, // duplicate of a search hit
      { summary: 'Section 5 arc runs through September' },
    ] } });

    const block = await athena.recallBlock('ws1', 'u1', 'editorial rules');
    expect(block).toContain('- Prefers concrete numbers in titles');
    expect(block).toContain('- Section 5 arc runs through September');
    expect(block).toContain('- Never double-dip course content into the newsletter');
    expect(block.match(/concrete numbers/g)).toHaveLength(1); // deduped

    await athena.recallBlock('ws1', 'u1', 'another question');
    const sessionCreates = post.mock.calls.filter(([url]) => url.endsWith('/sessions'));
    expect(sessionCreates).toHaveLength(1); // cached per (workspace, user)
    expect(sessionCreates[0][1]).toMatchObject({ tenant_id: 'ws1', user_id: 'u1', agent_id: 'odin' });
  });

  it('degrades to empty string when Athena is down', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('connect ECONNREFUSED'));
    expect(await athena.recallBlock('ws1', 'u1', 'q')).toBe('');
  });
});

describe('storeEvent', () => {
  it('records typed cognitive events and swallows failures', async () => {
    const post = vi.spyOn(axios, 'post').mockImplementation(async (url) => {
      if (url.endsWith('/sessions')) return { data: { sessionId: 'sid-7' } };
      return { data: { success: true } };
    });
    await athena.storeEvent('ws1', 'u1', {
      type: 'action', content: 'Read vault transcript v1 while scouting', metadata: { tool: 'read_transcript' },
    });
    const call = post.mock.calls.find(([url]) => url.includes('/events'));
    expect(call[0]).toContain('/sessions/sid-7/events');
    expect(call[1]).toMatchObject({ role: 'agent', type: 'action', metadata: { tool: 'read_transcript' } });

    // Typeless or empty events are not worth storing.
    post.mockClear();
    await athena.storeEvent('ws1', 'u1', { type: 'action', content: '' });
    await athena.storeEvent('ws1', 'u1', { content: 'no type' });
    expect(post).not.toHaveBeenCalled();

    vi.spyOn(axios, 'post').mockRejectedValue(new Error('boom'));
    await expect(athena.storeEvent('ws1', 'u1', { type: 'thought', content: 'x' })).resolves.toBeUndefined();
  });
});

describe('storeTurn', () => {
  it('records the exchange against the cached session and swallows failures', async () => {
    const post = vi.spyOn(axios, 'post').mockImplementation(async (url) => {
      if (url.endsWith('/sessions')) return { data: { sessionId: 'sid-9' } };
      return { data: { success: true } };
    });
    await athena.storeTurn('ws1', 'u1', 'remember: no emoji', 'Understood, no emoji.');
    const interaction = post.mock.calls.find(([url]) => url.includes('/interactions'));
    expect(interaction[0]).toContain('/sessions/sid-9/interactions');
    expect(interaction[1]).toMatchObject({ user_message: 'remember: no emoji' });

    // Empty exchanges are not worth remembering.
    post.mockClear();
    await athena.storeTurn('ws1', 'u1', '', 'reply');
    expect(post).not.toHaveBeenCalled();

    // Failures never propagate to the route.
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('boom'));
    await expect(athena.storeTurn('ws1', 'u1', 'a', 'b')).resolves.toBeUndefined();
  });
});
