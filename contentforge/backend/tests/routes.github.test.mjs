// The repo-picker listing library: unconfigured (null token) short-circuit,
// pagination, per-token caching, and credential errors — against a fake
// GitHub API. Route-level per-user behavior lives in
// routes.integrations.test.mjs.
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);
installFakeFirebase({});
const { listRepos, validateToken, clearCache } = require('../lib/githubRepos');

const fakeRepo = (i, priv = false) => ({
  full_name: `acme/repo-${i}`,
  html_url: `https://github.com/acme/repo-${i}`,
  private: priv,
  description: `Repo ${i}`,
  pushed_at: '2026-08-01T00:00:00Z',
});

beforeEach(() => clearCache());

describe('listRepos', () => {
  it('reports unconfigured for a null token (no API call)', async () => {
    const out = await listRepos(null, { http: { get: () => { throw new Error('must not be called'); } } });
    expect(out).toEqual({ configured: false, repos: [] });
  });

  it('lists and paginates, mapping to picker fields', async () => {
    const pages = {
      1: Array.from({ length: 100 }, (_, i) => fakeRepo(i)),
      2: [fakeRepo(100, true)],
    };
    const http = { get: async (_u, { params }) => ({ status: 200, data: pages[params.page] || [] }) };
    const out = await listRepos('test-token', { http });
    expect(out.configured).toBe(true);
    expect(out.repos).toHaveLength(101);
    expect(out.repos[100]).toEqual({
      fullName: 'acme/repo-100',
      url: 'https://github.com/acme/repo-100',
      private: true,
      description: 'Repo 100',
      pushedAt: '2026-08-01T00:00:00Z',
    });
  });

  it('caches per token', async () => {
    let calls = 0;
    const http = { get: async () => { calls++; return { status: 200, data: [fakeRepo(1)] }; } };
    await listRepos('token-a', { http });
    await listRepos('token-a', { http });
    expect(calls).toBe(1);
    await listRepos('token-b', { http }); // a different user's token is a different cache entry
    expect(calls).toBe(2);
  });

  it('surfaces a clear message for a rejected token', async () => {
    const http = { get: async () => ({ status: 401, data: {} }) };
    await expect(listRepos('revoked', { http })).rejects.toThrow(/rejected.*Settings → Integrations/i);
  });
});

describe('validateToken', () => {
  it('returns the login for a valid token and throws for a rejected one', async () => {
    const ok = { get: async () => ({ status: 200, data: { login: 'someone' } }) };
    expect(await validateToken('good', { http: ok })).toEqual({ login: 'someone' });

    const bad = { get: async () => ({ status: 401, data: {} }) };
    await expect(validateToken('bad', { http: bad })).rejects.toThrow(/rejected this token/i);
  });
});
