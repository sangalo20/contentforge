// Named Sanity connections — exactly the two sites that exist. Workspaces pick
// one by key via their `sanityConnection` field (or none: drafts stay in the
// library). Adding a third site means adding one entry here.
// NOTE: token values are captured at module load; dotenv must run first
// (server.js loads env before requiring any routes).
const SANITY_CONNECTIONS = {
  storagemoguls: {
    label: 'storagemoguls.ai',
    projectId: 'fqfrsx19',
    dataset: 'production',
    token: process.env.SANITY_API_TOKEN_MOGULS,
    schemaType: 'post',
    // The pattern IS https://storagemoguls.ai/blog/{slug} (confirmed in the
    // moguls-website repo: src/app/blog/[slug]), but the LIVE Vercel
    // deployment predates that route — every article URL 404s (checked
    // 2026-08-10). Flip this on once the site redeploys from current main,
    // or Huginn would weave dead links.
    articleUrlPattern: null
  },
  joedowns: {
    label: 'joedowns.ai',
    projectId: 'l4nrg0gu',
    dataset: 'production',
    token: process.env.SANITY_API_TOKEN_REAL_REP,
    schemaType: 'newsletterIssue',
    articleUrlPattern: 'https://joedowns.ai/operator-lessons/{slug}'
  }
};

// The slug Sanity documents get at publish time (keep in sync with
// routes/publish.js) — internal links are derived from it.
const slugForTitle = (title) =>
  String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// Public URL of a published article, or null when the connection has no
// confirmed URL pattern (internal linking then skips it).
const articleUrlFor = (connection, title) => {
  if (!connection?.articleUrlPattern) return null;
  const slug = slugForTitle(title);
  return slug ? connection.articleUrlPattern.replace('{slug}', slug) : null;
};

// The two original workspaces predate `sanityConnection`; keep their implicit
// mapping as a fallback so publishing never regresses.
const LEGACY_WORKSPACE_CONNECTIONS = {
  'the-moguls-medium-blogs': 'storagemoguls',
  'the-real-rep-substack-blogs': 'joedowns'
};

// Resolve a workspace's Sanity connection (explicit field, else legacy map).
const sanityConnectionFor = (workspace, workspaceId) => {
  const key = workspace?.sanityConnection || LEGACY_WORKSPACE_CONNECTIONS[workspaceId];
  return key ? { key, ...SANITY_CONNECTIONS[key] } : null;
};

module.exports = { SANITY_CONNECTIONS, sanityConnectionFor, articleUrlFor, slugForTitle };
