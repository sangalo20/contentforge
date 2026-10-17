// The per-user GitHub connection (Settings → Integrations): every user
// manages their OWN token (no admin gate, no shared credential, no env
// fallback), validation before storage, masked status, isolation between
// users, and the picker using the caller's credential. The /api/users listing
// maps an explicit field allowlist, so githubIntegration never leaks there.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRequire } from 'node:module';
import { installFakeFirebase } from './helpers/fakeFirestore.mjs';

const require = createRequire(import.meta.url);
const store = installFakeFirebase({});
const { getGithubToken, clearIntegrationsCache } = require('../lib/integrations');
const githubRepos = require('../lib/githubRepos');
const githubRouter = require('../routes/github');

function appAs(user) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = user; next(); });
  app.use(githubRouter);
  return app;
}

const ALICE = { uid: 'u-alice', email: 'alice@x.com', role: 'creator', workspaceAccess: 'all' };
const BOB = { uid: 'u-bob', email: 'bob@x.com', role: 'creator', workspaceAccess: 'all' };

beforeEach(() => {
  store.content_pipeline_users = {};
  clearIntegrationsCache();
  githubRepos.clearCache();
  vi.restoreAllMocks();
});

describe('per-user token storage', () => {
  it('resolves each user to their own token, null when not connected', async () => {
    store.content_pipeline_users['u-alice'] = { role: 'creator', githubIntegration: { token: 'alice-token' } };
    expect(await getGithubToken('u-alice')).toBe('alice-token');
    expect(await getGithubToken('u-bob')).toBeNull();
    expect(await getGithubToken(null)).toBeNull();
  });
});

describe('integration endpoints (any authenticated user, own record only)', () => {
  it('connects after validation, masks, and shows the GitHub login', async () => {
    vi.spyOn(githubRepos, 'validateToken').mockResolvedValue({ login: 'alice-gh' });

    const put = await request(appAs(ALICE)).put('/api/integrations/github').send({ token: 'github_pat_alice5678' });
    expect(put.status).toBe(200);
    expect(put.body).toMatchObject({ configured: true, login: 'alice-gh', hint: '…5678' });
    expect(JSON.stringify(put.body)).not.toContain('github_pat_alice5678');
    expect(store.content_pipeline_users['u-alice'].githubIntegration.token).toBe('github_pat_alice5678');
    expect(store.content_pipeline_users['u-alice'].githubIntegration.login).toBe('alice-gh');
  });

  it('rejects an invalid token without storing it', async () => {
    vi.spyOn(githubRepos, 'validateToken').mockRejectedValue(new Error('GitHub rejected this token.'));
    const res = await request(appAs(ALICE)).put('/api/integrations/github').send({ token: 'bad' });
    expect(res.status).toBe(422);
    expect(store.content_pipeline_users['u-alice']).toBeUndefined();
    expect((await request(appAs(ALICE)).put('/api/integrations/github').send({})).status).toBe(400);
  });

  it('keeps users isolated: Bob never sees or affects Alice', async () => {
    store.content_pipeline_users['u-alice'] = { role: 'creator', githubIntegration: { token: 'alice-token', login: 'alice-gh' } };

    const bobStatus = await request(appAs(BOB)).get('/api/integrations/github');
    expect(bobStatus.body.configured).toBe(false);

    await request(appAs(BOB)).delete('/api/integrations/github');
    expect(store.content_pipeline_users['u-alice'].githubIntegration.token).toBe('alice-token');

    const aliceStatus = await request(appAs(ALICE)).get('/api/integrations/github');
    expect(aliceStatus.body).toMatchObject({ configured: true, login: 'alice-gh', hint: '…oken' });
  });

  it('disconnects the caller only', async () => {
    store.content_pipeline_users['u-alice'] = { role: 'creator', githubIntegration: { token: 'alice-token' } };
    const res = await request(appAs(ALICE)).delete('/api/integrations/github');
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(store.content_pipeline_users['u-alice'].githubIntegration).toBeUndefined();
  });
});

describe('repo picker uses the CALLER\'s credential', () => {
  it('unconnected users get the unconfigured shape; connected users list with their token', async () => {
    expect((await request(appAs(BOB)).get('/api/github/repos')).body).toEqual({ configured: false, repos: [] });

    store.content_pipeline_users['u-alice'] = { role: 'creator', githubIntegration: { token: 'alice-token' } };
    let seenAuth = null;
    vi.spyOn(githubRepos, 'listRepos').mockImplementation(async (token) => {
      seenAuth = token;
      return { configured: true, repos: [{ fullName: 'alice/repo', url: 'https://github.com/alice/repo', private: true }] };
    });
    const res = await request(appAs(ALICE)).get('/api/github/repos');
    expect(res.body.configured).toBe(true);
    expect(seenAuth).toBe('alice-token');
  });
});
