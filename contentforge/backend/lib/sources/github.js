// GitHub repository source resolver: README + docs tree + hand-picked files
// via the GitHub API — deliberately NOT whole-repo ingestion (see the proposal:
// for content writing the narrative lives in README/docs/examples; illustrative
// code comes in via the `code` source type or the `paths` picker here).
//
// Input: { type: 'github', url, paths?: ['src/billing.py', ...] }.
// Auth: optional GITHUB_TOKEN env (private repos, higher rate limits).
// Host is fixed to api.github.com, so no SSRF surface beyond GitHub itself.
const axios = require('axios');

const API = 'https://api.github.com';
const DOC_EXTENSIONS = /\.(md|mdx|rst|txt)$/i;
const MAX_DOC_FILES = 12;        // docs/ files auto-included per repo
const PER_FILE_CHARS = 15_000;   // one file never dominates the source
const ASSEMBLY_BUDGET = 58_000;  // stay under the 60k source cap with headroom

function parseRepoUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('Invalid GitHub URL.');
  }
  if (!['github.com', 'www.github.com'].includes(u.hostname)) {
    throw new Error('Only github.com repository URLs are supported.');
  }
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error('Expected a repository URL like https://github.com/owner/repo.');
  }
  const [owner, repo] = parts;
  // Deep links (github.com/o/r/tree/<ref>/...) pin the ref.
  const ref = parts[2] === 'tree' && parts[3] ? parts[3] : null;
  return { owner, repo: repo.replace(/\.git$/, ''), ref };
}

function ghHeaders(raw, token) {
  const headers = {
    Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    'User-Agent': 'ContentForge/1.0 (+repo ingestion)',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function friendly(status, what) {
  if (status === 404) {
    return `${what} not found. Private repositories need your GitHub connected (Settings → Integrations).`;
  }
  if (status === 403 || status === 429) {
    return 'GitHub is rate-limiting us. Try again in a few minutes, or connect your GitHub (Settings → Integrations) for higher limits.';
  }
  return `GitHub returned HTTP ${status} for the ${what.toLowerCase()}.`;
}

// ctx: { stage, position, deps: { http, token } } — http is axios-compatible
// (tests); token is the GENERATING USER's personal GitHub token, resolved by
// the route (null → anonymous, public repos only).
async function resolve({ url, paths = [] }, ctx = {}) {
  const stage = ctx.stage || (() => {});
  const n = ctx.position || '';
  const http = ctx.deps?.http || axios;
  const token = ctx.deps?.token || null;
  const get = (u, raw = false) =>
    http.get(u, { headers: ghHeaders(raw, token), validateStatus: () => true, timeout: 20_000 });

  const { owner, repo, ref } = parseRepoUrl(url);
  const name = `${owner}/${repo}`;
  stage(`Reading repository${n}: ${name}...`);

  const meta = await get(`${API}/repos/${owner}/${repo}`);
  if (meta.status !== 200) throw new Error(friendly(meta.status, 'Repository'));
  const branch = ref || meta.data.default_branch || 'main';

  const sections = [];
  let used = 0;
  const push = (heading, body) => {
    let text = String(body || '').trim();
    if (!text) return false;
    if (text.length > PER_FILE_CHARS) {
      text = `${text.slice(0, PER_FILE_CHARS)}\n[file truncated]`;
    }
    if (used + text.length > ASSEMBLY_BUDGET) return false;
    sections.push(`## ${heading}\n\n${text}`);
    used += text.length;
    return true;
  };

  if (meta.data.description) push('About', meta.data.description);

  const readme = await get(`${API}/repos/${owner}/${repo}/readme?ref=${branch}`, true);
  if (readme.status === 200) {
    push('README', readme.data);
  } else {
    stage(`No README found in ${name}; continuing with docs and picked files.`, 'warn');
  }

  // docs/ tree: auto-include documentation files, capped and budget-aware.
  const tree = await get(`${API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  if (tree.status === 200 && Array.isArray(tree.data.tree)) {
    const docFiles = tree.data.tree
      .filter((e) => e.type === 'blob' && /^docs?\//i.test(e.path) && DOC_EXTENSIONS.test(e.path))
      .sort((a, b) => a.path.localeCompare(b.path));
    let included = 0;
    for (const f of docFiles) {
      if (included >= MAX_DOC_FILES || used >= ASSEMBLY_BUDGET) break;
      const file = await get(`${API}/repos/${owner}/${repo}/contents/${f.path}?ref=${branch}`, true);
      if (file.status === 200 && push(f.path, file.data)) included++;
    }
    const skipped = docFiles.length - included;
    if (skipped > 0) {
      stage(`Included ${included} docs files from ${name}; ${skipped} more skipped for the source budget.`, 'warn');
    }
  }

  // Hand-picked files always attempt, budget permitting.
  for (const p of paths) {
    const file = await get(`${API}/repos/${owner}/${repo}/contents/${p}?ref=${branch}`, true);
    if (file.status !== 200) {
      throw new Error(friendly(file.status, `File "${p}"`));
    }
    if (!push(p, file.data)) {
      stage(`Picked file "${p}" skipped — over the source budget.`, 'warn');
    }
  }

  if (sections.length === 0) {
    throw new Error(`Nothing readable found in ${name} (no README, docs, or picked files). Pick specific files to include.`);
  }
  stage(`Repository ingested: ${sections.length} sections, ${used.toLocaleString('en-US')} characters.`, 'success');
  return { title: name, text: sections.join('\n\n') };
}

module.exports = { resolve, parseRepoUrl };
