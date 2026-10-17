// Per-user integration credentials. GitHub is personal by design: each user
// connects their own account (Settings → Integrations) and the forge acts as
// them — their repos in the picker, their token for ingestion. No shared
// credential, no env fallback: no connection means public-repo access only.
// Tokens live on the user's doc (USERS_COLLECTION.{uid}.githubIntegration)
// and never leave the server — status reads return a masked hint only.
// (The /api/users listing is safe: it maps an explicit field allowlist.)
const { db, FieldValue, USERS_COLLECTION } = require('./firebase');

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map(); // uid -> { at, integration }

async function githubIntegrationOf(uid) {
  const hit = cache.get(uid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.integration;
  const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
  const integration = (snap.exists && snap.data().githubIntegration) || null;
  cache.set(uid, { at: Date.now(), integration });
  return integration;
}

// The token used for this user's repo picker and github-source ingestion.
async function getGithubToken(uid) {
  if (!uid) return null;
  const integration = await githubIntegrationOf(uid);
  return integration?.token || null;
}

// Masked status for the settings card — never the token itself.
async function githubStatus(uid) {
  const integration = await githubIntegrationOf(uid);
  if (!integration?.token) return { configured: false, hint: null, login: null, setAt: null };
  return {
    configured: true,
    hint: `…${String(integration.token).slice(-4)}`,
    login: integration.login || null,
    setAt: integration.setAt || null,
  };
}

async function setGithubToken(uid, token, login) {
  await db.collection(USERS_COLLECTION).doc(uid).set({
    githubIntegration: { token, login: login || null, setAt: FieldValue.serverTimestamp() },
  }, { merge: true });
  cache.delete(uid);
}

async function clearGithubToken(uid) {
  try {
    await db.collection(USERS_COLLECTION).doc(uid).update({
      githubIntegration: FieldValue.delete(),
    });
  } catch {
    // No user doc / no integration — nothing to clear.
  }
  cache.delete(uid);
}

// Test seam: drop the read cache between cases.
function clearIntegrationsCache() {
  cache.clear();
}

module.exports = { getGithubToken, githubStatus, setGithubToken, clearGithubToken, clearIntegrationsCache };
