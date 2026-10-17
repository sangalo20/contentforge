// Repo listing for the Source Composer's GitHub picker, using the calling
// user's personal token (Settings → Integrations; see lib/integrations.js).
// Tokens are held server-side and never sent to the browser. A short
// per-token in-memory cache keeps us clear of API rate limits — repo lists
// change rarely.
const axios = require('axios');

const API = 'https://api.github.com';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_PAGES = 3; // 100/page — 300 repos is plenty for a picker
const MAX_CACHE_ENTRIES = 100;

const cache = new Map(); // token -> { at, repos }

// Validate a candidate token before it is saved: a cheap authenticated call.
// Returns the token owner's login. deps injectable for tests: { http }.
async function validateToken(token, deps = {}) {
  const http = deps.http || axios;
  const res = await http.get(`${API}/user`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ContentForge/1.0 (+token validation)',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    validateStatus: () => true,
    timeout: 15_000,
  });
  if (res.status !== 200) {
    throw new Error('GitHub rejected this token. Check that it is a valid (fine-grained) personal access token.');
  }
  return { login: res.data?.login || 'unknown' };
}

// List the repos a token can see. deps injectable for tests: { http }.
// Returns { configured, repos }; a null token means "not connected".
async function listRepos(token, deps = {}) {
  if (!token) return { configured: false, repos: [] };
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { configured: true, repos: hit.repos };
  }

  const http = deps.http || axios;
  const repos = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await http.get(`${API}/user/repos`, {
      params: { per_page: 100, page, sort: 'pushed' },
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'ContentForge/1.0 (+repo picker)',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      validateStatus: () => true,
      timeout: 15_000,
    });
    if (res.status === 401) throw new Error('Your GitHub token was rejected — it may be expired or revoked. Reconnect in Settings → Integrations.');
    if (res.status !== 200) throw new Error(`GitHub returned HTTP ${res.status} while listing repositories.`);
    const batch = Array.isArray(res.data) ? res.data : [];
    repos.push(...batch.map((r) => ({
      fullName: r.full_name,
      url: r.html_url,
      private: !!r.private,
      description: r.description || null,
      pushedAt: r.pushed_at || null,
    })));
    if (batch.length < 100) break;
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear(); // crude bound; fine at team scale
  cache.set(token, { at: Date.now(), repos });
  return { configured: true, repos };
}

// Reset the cache (tests; token connect/disconnect).
function clearCache() {
  cache.clear();
}

module.exports = { listRepos, validateToken, clearCache };
