// API keys — machine credentials for workbenches and scripts that invoke the
// pipeline without a browser session. A key resolves to the SAME req.user shape
// a Firebase token does ({ role, workspaceAccess, reviewerWorkspaces }), so
// every existing authz predicate and route guard applies unchanged. Only the
// SHA-256 hash is stored; the plaintext key is shown once at mint time.
const crypto = require('crypto');
const { db, FieldValue, API_KEYS_COLLECTION } = require('./firebase');

// Keys look like cfk_<43 base64url chars>. The prefix routes authentication
// (Firebase ID tokens are JWTs and never start with cfk_) and makes leaked
// keys greppable/identifiable in logs and secret scanners.
const API_KEY_PREFIX = 'cfk_';

const isApiKeyToken = (token) => typeof token === 'string' && token.startsWith(API_KEY_PREFIX);

const hashApiKey = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Mint a new key. Returns { token, tokenHash, display } — the caller persists
// the hash and returns the token to the admin exactly once.
function mintApiKey() {
  const token = API_KEY_PREFIX + crypto.randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashApiKey(token),
    // Non-secret display handle so the UI can identify a key after minting.
    display: `${token.slice(0, 12)}…${token.slice(-4)}`,
  };
}

// Resolve a presented key to an auth context, or null when the key is unknown
// or revoked. Stamps lastUsedAt at most once per hour (fire-and-forget), the
// same throttled pattern authenticate.js uses for user lastActiveAt.
async function resolveApiKey(token) {
  const snap = await db.collection(API_KEYS_COLLECTION)
    .where('tokenHash', '==', hashApiKey(token)).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const key = doc.data();
  if (key.revokedAt) return null;

  const last = key.lastUsedAt;
  const lastMs = last && typeof last.toMillis === 'function' ? last.toMillis() : 0;
  if (Date.now() - lastMs > 60 * 60 * 1000) {
    doc.ref.set({ lastUsedAt: FieldValue.serverTimestamp() }, { merge: true })
      .catch(err => console.error('Failed to stamp API key lastUsedAt:', err.message));
  }

  return {
    // Synthetic uid: never collides with Firebase uids, and log lines /
    // audit fields (createdBy, invitedBy, …) show which key acted.
    uid: `apikey:${doc.id}`,
    email: null,
    role: key.role || 'creator',
    // Unlike legacy users, keys have no backward-compat default: an absent
    // scope means no workspaces, not all of them.
    workspaceAccess: key.workspaceAccess ?? [],
    reviewerWorkspaces: key.reviewerWorkspaces ?? [],
    // Marks the request as machine-authenticated; guards use this to keep
    // keys from managing users or other keys.
    apiKey: { id: doc.id, name: key.name || null },
  };
}

module.exports = { API_KEY_PREFIX, isApiKeyToken, hashApiKey, mintApiKey, resolveApiKey };
