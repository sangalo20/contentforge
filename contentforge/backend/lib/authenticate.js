// --- AUTHENTICATION MIDDLEWARE ---
// Verifies the Firebase bearer token, loads the ContentForge membership doc
// (role + workspace access + reviewer grants), and redeems pending invites on
// first login. Public paths (SPA assets, health, image proxies, invite
// acceptance) pass through untouched.
const { db, FieldValue, getAuth, USERS_COLLECTION, INVITES_COLLECTION } = require('./firebase');
const { setContextUser } = require('../logger');
const { VALID_ROLES } = require('./authz');
const { isApiKeyToken, resolveApiKey } = require('./apiKeys');

// Paths that do not require authentication. The static SPA (and its client-side
// routes) must load without a token; the browser obtains a Firebase token only
// after the app boots. API routes stay protected, except a small public set:
// health, the frontend config, the cover image proxy (loaded via <img src>,
// which cannot send an Authorization header), and invite acceptance.
const isPublicPath = (req) => {
  if (!req.path.startsWith('/api/')) return true;
  if (req.path === '/api/health') return true;
  if (req.path === '/api/health/ready') return true;
  if (req.path === '/api/config') return true;
  if (req.path === '/api/invites/validate') return true;
  if (req.path === '/api/invites/accept') return true;
  if (/^\/api\/library\/[^/]+\/cover\/image$/.test(req.path)) return true;
  if (/^\/api\/library\/[^/]+\/social\/[^/]+\/cover\/image$/.test(req.path)) return true;
  // Saved-design images/thumbnails load via <img>, which cannot send a token.
  if (/^\/api\/brand-studio\/designs\/[^/]+\/image\/[^/]+$/.test(req.path)) return true;
  return false;
};

// Redeem a pending invite for a just-authenticated user, if one exists. Creates
// their membership doc and marks the invite used. Returns the granted
// { role, workspaceAccess } or null when there is no valid pending invite.
async function provisionFromInvite(decoded, userRef) {
  const email = decoded.email;
  if (!email) return null;
  const snap = await db.collection(INVITES_COLLECTION).where('email', '==', email).get();
  if (snap.empty) return null;
  const now = Date.now();
  const inviteDoc = snap.docs.find(d => {
    const x = d.data();
    if (x.usedAt) return false;
    const exp = x.expiresAt && typeof x.expiresAt.toMillis === 'function' ? x.expiresAt.toMillis() : 0;
    return exp === 0 || exp > now;
  });
  if (!inviteDoc) return null;
  const inv = inviteDoc.data();
  const role = VALID_ROLES.includes(inv.role) ? inv.role : 'creator';
  const workspaceAccess = inv.workspaceAccess === 'all' || Array.isArray(inv.workspaceAccess)
    ? inv.workspaceAccess
    : [];
  // Legacy 'reviewer'-role invites map to creator + reviewer everywhere invited.
  const reviewerWorkspaces = inv.reviewerWorkspaces === 'all' || Array.isArray(inv.reviewerWorkspaces)
    ? inv.reviewerWorkspaces
    : (inv.role === 'reviewer' ? workspaceAccess : []);
  await userRef.set({ email, role, workspaceAccess, reviewerWorkspaces, lastActiveAt: FieldValue.serverTimestamp() });
  await inviteDoc.ref.set({ usedAt: FieldValue.serverTimestamp(), acceptedUid: decoded.uid }, { merge: true });
  return { role, workspaceAccess, reviewerWorkspaces };
}

const authenticate = async (req, res, next) => {
  if (isPublicPath(req)) return next();

  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  // API keys (cfk_…) are machine credentials for workbenches and scripts.
  // They resolve to the same req.user shape as a Firebase session, so every
  // downstream guard applies unchanged. Firebase tokens are JWTs and can
  // never carry the prefix, so the two paths cannot collide.
  if (isApiKeyToken(match[1])) {
    try {
      const keyUser = await resolveApiKey(match[1]);
      if (!keyUser) {
        return res.status(401).json({ error: 'Invalid or revoked API key' });
      }
      req.user = keyUser;
      setContextUser(req.user);
      return next();
    } catch (err) {
      console.error('API key auth failed:', err.message);
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1]);
    let role = 'creator';
    // Workspace access: 'all' grants every workspace; an array limits the user
    // to specific workspace ids. Members created before scoping existed have no
    // stored value and default to 'all' for backward compatibility.
    let workspaceAccess = 'all';
    // Per-workspace reviewer grants; opt-in, so the default is none.
    let reviewerWorkspaces;
    try {
      const ref = db.collection(USERS_COLLECTION).doc(decoded.uid);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data();
        if (data.role) role = data.role;
        if (data.workspaceAccess !== undefined && data.workspaceAccess !== null) {
          workspaceAccess = data.workspaceAccess;
        }
        if (data.reviewerWorkspaces !== undefined && data.reviewerWorkspaces !== null) {
          reviewerWorkspaces = data.reviewerWorkspaces;
        }
        // Stamp ContentForge-specific activity. Firebase Auth's lastSignInTime
        // is project-wide (shared with other apps on this GCP project), so we
        // track our own "last active" here. Throttled to once/hour to avoid a
        // Firestore write on every request. Fire-and-forget: never blocks auth.
        const last = data.lastActiveAt;
        const lastMs = last && typeof last.toMillis === 'function' ? last.toMillis() : 0;
        if (Date.now() - lastMs > 60 * 60 * 1000) {
          ref.set({ lastActiveAt: FieldValue.serverTimestamp() }, { merge: true })
            .catch(err => console.error('Failed to stamp lastActiveAt:', err.message));
        }
      } else {
        // No membership doc yet. If a pending invite exists for this email,
        // redeem it now (provider-agnostic: works for password or Google login).
        // Otherwise this is a non-member — grant zero workspace access so users
        // from other apps on the shared project cannot use ContentForge.
        const provisioned = await provisionFromInvite(decoded, ref);
        if (provisioned) {
          role = provisioned.role;
          workspaceAccess = provisioned.workspaceAccess;
          reviewerWorkspaces = provisioned.reviewerWorkspaces;
        } else {
          role = 'creator';
          workspaceAccess = [];
        }
      }
    } catch (err) {
      console.error('Failed to load user role:', err.message);
    }
    req.user = { uid: decoded.uid, email: decoded.email, role, workspaceAccess, reviewerWorkspaces };
    setContextUser(req.user); // every log line in this request now carries the uid
    next();
  } catch (err) {
    console.warn('Auth failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { isPublicPath, authenticate, provisionFromInvite };
