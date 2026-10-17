// User accounts (admin CRUD + invites) and the mention directory.
const express = require('express');
const { db, FieldValue, getAuth, USERS_COLLECTION, INVITES_COLLECTION } = require('../lib/firebase');
const { VALID_ROLES, isAdminRole, reviewerWorkspacesOf } = require('../lib/authz');
const { requireAdmin, requireHumanSession, ownerExists, normalizeWorkspaceAccess, normalizeReviewerWorkspaces } = require('../lib/guards');
const { sendEmail, authLinkEmailHtml, RESEND_API_KEY } = require('../lib/email');

const router = express.Router();

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Hash an invite token before storing it, so a Firestore read never exposes a
// usable token.
const hashToken = (token) =>
  require('crypto').createHash('sha256').update(token).digest('hex');

// Best-effort base URL for building links in emails. Prefer an explicit env var,
// then the requesting origin (the SPA that called us), then a dev default.
const appBaseUrl = (req) =>
  process.env.APP_BASE_URL || req.headers.origin || 'http://localhost:5193';

// Returns the authenticated user's identity, role, and resolved reviewer grants.
router.get('/api/auth/me', (req, res) => {
  res.json({ ...req.user, reviewerWorkspaces: reviewerWorkspacesOf(req.user) });
});

// --- USER MANAGEMENT (admin only) ---

// List all users, merging Firebase Auth accounts with their assigned roles.
router.get('/api/users', requireAdmin, async (req, res) => {
  try {
    // Membership is defined by the ContentForge users collection, not by the
    // project-wide Firebase Auth pool (which is shared with other apps on this
    // GCP project, e.g. the deal analyzer). Only users with a doc here are
    // ContentForge members.
    const roleSnap = await db.collection(USERS_COLLECTION).get();
    const members = {};
    roleSnap.forEach(doc => {
      const d = doc.data();
      members[doc.id] = {
        role: d.role || 'creator',
        workspaceAccess: d.workspaceAccess === undefined || d.workspaceAccess === null ? 'all' : d.workspaceAccess,
        reviewerWorkspaces: reviewerWorkspacesOf(d),
        lastActiveAt: d.lastActiveAt || null,
      };
    });

    const { users } = await getAuth().listUsers(1000);
    const result = users
      .filter(u => members[u.uid]) // exclude non-ContentForge accounts
      .map(u => {
        const m = members[u.uid];
        const la = m.lastActiveAt;
        const lastActive = la && typeof la.toDate === 'function' ? la.toDate().toISOString() : null;
        return {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || null,
          disabled: u.disabled,
          lastActive,
          createdAt: u.metadata.creationTime || null,
          role: m.role,
          workspaceAccess: m.workspaceAccess,
          reviewerWorkspaces: m.reviewerWorkspaces,
        };
      });
    // Sort: owners, then admins, then everyone else, each by email.
    const roleRank = { owner: 0, admin: 1 };
    result.sort((a, b) => {
      const ra = roleRank[a.role] ?? 2;
      const rb = roleRank[b.role] ?? 2;
      if (ra !== rb) return ra - rb;
      return (a.email || '').localeCompare(b.email || '');
    });
    res.json(result);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Invite a new user: grant a role + workspace access to an email. Creates a
// pending invite with a 7-day token and emails an accept link. The account and
// membership doc are created on first login (any provider) or when the invitee
// sets a password via the accept-invite page — so it works with Google SSO too.
router.post('/api/users', requireHumanSession, requireAdmin, async (req, res) => {
  const { email, role = 'creator' } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be owner, admin, or creator' });
  }
  if (role === 'owner' && req.user.role !== 'owner' && await ownerExists()) {
    return res.status(403).json({ error: 'Only an owner can invite another owner' });
  }
  const workspaceAccess = normalizeWorkspaceAccess(req.body?.workspaceAccess);
  if (workspaceAccess === null) {
    return res.status(400).json({ error: 'workspaceAccess must be "all" or an array of workspace ids' });
  }
  const reviewerWorkspaces = normalizeReviewerWorkspaces(req.body?.reviewerWorkspaces);
  if (reviewerWorkspaces === null) {
    return res.status(400).json({ error: 'reviewerWorkspaces must be "all" or an array of workspace ids' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // Reject if this email is already an active member.
    try {
      const existing = await getAuth().getUserByEmail(normalizedEmail);
      const memberSnap = await db.collection(USERS_COLLECTION).doc(existing.uid).get();
      if (memberSnap.exists) {
        return res.status(409).json({ error: 'This user is already a ContentForge member' });
      }
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    // Supersede any earlier pending invites for this email.
    const priorSnap = await db.collection(INVITES_COLLECTION).where('email', '==', normalizedEmail).get();
    await Promise.all(priorSnap.docs.filter(d => !d.data().usedAt).map(d => d.ref.delete()));

    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const inviteRef = await db.collection(INVITES_COLLECTION).add({
      email: normalizedEmail,
      role,
      workspaceAccess,
      reviewerWorkspaces,
      tokenHash: hashToken(token),
      invitedBy: req.user.email || req.user.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      usedAt: null,
    });

    const acceptLink = `${appBaseUrl(req)}/accept-invite?token=${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: 'You have been invited to ContentForge',
      text: `You've been invited to ContentForge as a ${role}. Accept your invite (valid for 7 days): ${acceptLink}`,
      html: authLinkEmailHtml({
        heading: 'Welcome to ContentForge',
        intro: `You've been invited as a ${role}. Click below to accept — you can set a password or continue with Google. This link is valid for 7 days.`,
        buttonLabel: 'Accept invite',
        link: acceptLink,
      }),
    });

    res.status(201).json({
      id: inviteRef.id,
      email: normalizedEmail,
      role,
      workspaceAccess,
      reviewerWorkspaces,
      acceptLink,
      expiresAt: expiresAt.toISOString(),
      emailSent: !!RESEND_API_KEY,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Update a user's role, workspace access, and/or reviewer grants.
router.put('/api/users/:uid', requireHumanSession, requireAdmin, async (req, res) => {
  const body = req.body || {};
  const hasRole = body.role !== undefined;
  const hasAccess = body.workspaceAccess !== undefined;
  const hasReviewer = body.reviewerWorkspaces !== undefined;

  if (!hasRole && !hasAccess && !hasReviewer) {
    return res.status(400).json({ error: 'Provide role, workspaceAccess, and/or reviewerWorkspaces' });
  }

  const update = {};

  if (hasRole) {
    if (!VALID_ROLES.includes(body.role)) {
      return res.status(400).json({ error: 'Role must be owner, admin, or creator' });
    }
    // Owner grants/revocations are owner-only — with one bootstrap exception:
    // until any owner exists, an admin may assign the first one.
    const targetSnap = await db.collection(USERS_COLLECTION).doc(req.params.uid).get();
    const targetRole = targetSnap.exists ? (targetSnap.data().role || 'creator') : 'creator';
    if ((body.role === 'owner' || targetRole === 'owner') && req.user.role !== 'owner') {
      const bootstrap = body.role === 'owner' && !(await ownerExists());
      if (!bootstrap) {
        return res.status(403).json({ error: 'Only an owner can grant or revoke the owner role' });
      }
    }
    if (req.params.uid === req.user.uid && !isAdminRole(body.role)) {
      return res.status(400).json({ error: 'You cannot remove your own admin privileges' });
    }
    // The org must always keep at least one owner.
    if (req.params.uid === req.user.uid && req.user.role === 'owner' && body.role !== 'owner') {
      const owners = await db.collection(USERS_COLLECTION).where('role', '==', 'owner').get();
      if (owners.size <= 1) {
        return res.status(400).json({ error: 'You are the only owner; assign another owner before stepping down' });
      }
    }
    update.role = body.role;
  }

  if (hasAccess) {
    const workspaceAccess = normalizeWorkspaceAccess(body.workspaceAccess);
    if (workspaceAccess === null) {
      return res.status(400).json({ error: 'workspaceAccess must be "all" or an array of workspace ids' });
    }
    update.workspaceAccess = workspaceAccess;
  }

  if (hasReviewer) {
    const reviewerWorkspaces = normalizeReviewerWorkspaces(body.reviewerWorkspaces);
    if (reviewerWorkspaces === null) {
      return res.status(400).json({ error: 'reviewerWorkspaces must be "all" or an array of workspace ids' });
    }
    update.reviewerWorkspaces = reviewerWorkspaces;
    // Writing the explicit field retires the legacy global 'reviewer' role.
    if (!hasRole) {
      const existing = await db.collection(USERS_COLLECTION).doc(req.params.uid).get();
      if (existing.exists && existing.data().role === 'reviewer') update.role = 'creator';
    }
  }

  try {
    const user = await getAuth().getUser(req.params.uid);
    await db.collection(USERS_COLLECTION).doc(user.uid).set(
      { email: user.email, ...update },
      { merge: true }
    );
    res.json({ uid: user.uid, email: user.email, ...update });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user from Firebase Auth and remove their role.
router.delete('/api/users/:uid', requireHumanSession, requireAdmin, async (req, res) => {
  if (req.params.uid === req.user.uid) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  try {
    await getAuth().deleteUser(req.params.uid);
    await db.collection(USERS_COLLECTION).doc(req.params.uid).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Generate a password-reset link and email it to the user.
router.post('/api/users/:uid/reset-link', requireHumanSession, requireAdmin, async (req, res) => {
  try {
    const user = await getAuth().getUser(req.params.uid);
    const resetLink = await getAuth().generatePasswordResetLink(user.email);
    // Email the reset link to the user (best-effort).
    await sendEmail({
      to: user.email,
      subject: 'Reset your ContentForge password',
      text: `Reset your ContentForge password here: ${resetLink}`,
      html: authLinkEmailHtml({
        heading: 'Reset your password',
        intro: 'Click below to choose a new password for your ContentForge account. If you did not request this, you can ignore this email.',
        buttonLabel: 'Reset password',
        link: resetLink,
      }),
    });
    res.json({ resetLink, emailSent: !!RESEND_API_KEY });
  } catch (error) {
    console.error('Error generating reset link:', error);
    res.status(500).json({ error: 'Failed to generate reset link' });
  }
});

// --- INVITES ---

// List pending (unused, unexpired) invites for the admin UI.
router.get('/api/invites', requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection(INVITES_COLLECTION).get();
    const now = Date.now();
    const invites = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(i => !i.usedAt)
      .filter(i => {
        const exp = i.expiresAt && typeof i.expiresAt.toMillis === 'function' ? i.expiresAt.toMillis() : 0;
        return exp === 0 || exp > now;
      })
      .map(i => ({
        id: i.id,
        email: i.email,
        role: i.role,
        workspaceAccess: i.workspaceAccess,
        reviewerWorkspaces: i.reviewerWorkspaces ?? (i.role === 'reviewer' ? i.workspaceAccess : []),
        invitedBy: i.invitedBy || null,
        expiresAt: i.expiresAt && typeof i.expiresAt.toDate === 'function' ? i.expiresAt.toDate().toISOString() : null,
      }))
      .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    res.json(invites);
  } catch (error) {
    console.error('Error listing invites:', error);
    res.status(500).json({ error: 'Failed to list invites' });
  }
});

// Revoke a pending invite.
router.delete('/api/invites/:id', requireHumanSession, requireAdmin, async (req, res) => {
  try {
    await db.collection(INVITES_COLLECTION).doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking invite:', error);
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

// PUBLIC: validate an invite token without consuming it, so the accept page can
// show the invitee's email and whether the link is still valid. Side-effect free
// (safe against email link scanners).
router.get('/api/invites/validate', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ valid: false, error: 'Missing token' });
  try {
    const snap = await db.collection(INVITES_COLLECTION).where('tokenHash', '==', hashToken(token)).limit(1).get();
    if (snap.empty) return res.json({ valid: false });
    const inv = snap.docs[0].data();
    if (inv.usedAt) return res.json({ valid: false, reason: 'used' });
    const exp = inv.expiresAt && typeof inv.expiresAt.toMillis === 'function' ? inv.expiresAt.toMillis() : 0;
    if (exp && exp < Date.now()) return res.json({ valid: false, reason: 'expired' });
    res.json({ valid: true, email: inv.email, role: inv.role });
  } catch (error) {
    console.error('Error validating invite:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate invite' });
  }
});

// PUBLIC: accept an invite by setting a password. Creates (or updates) the
// Firebase account, provisions the membership doc, and marks the invite used.
// The token is only consumed here — on an explicit submit — never on a GET.
router.post('/api/invites/accept', async (req, res) => {
  const { token, password } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const snap = await db.collection(INVITES_COLLECTION).where('tokenHash', '==', hashToken(token)).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'This invite link is invalid' });
    const inviteDoc = snap.docs[0];
    const inv = inviteDoc.data();
    if (inv.usedAt) return res.status(410).json({ error: 'This invite has already been used' });
    const exp = inv.expiresAt && typeof inv.expiresAt.toMillis === 'function' ? inv.expiresAt.toMillis() : 0;
    if (exp && exp < Date.now()) return res.status(410).json({ error: 'This invite has expired' });

    // Create or update the Firebase Auth account with the chosen password.
    let uid;
    try {
      const existing = await getAuth().getUserByEmail(inv.email);
      uid = existing.uid;
      await getAuth().updateUser(uid, { password });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        const created = await getAuth().createUser({ email: inv.email, password });
        uid = created.uid;
      } else {
        throw err;
      }
    }

    const workspaceAccess = inv.workspaceAccess === 'all' || Array.isArray(inv.workspaceAccess)
      ? inv.workspaceAccess
      : [];
    const reviewerWorkspaces = inv.reviewerWorkspaces === 'all' || Array.isArray(inv.reviewerWorkspaces)
      ? inv.reviewerWorkspaces
      : (inv.role === 'reviewer' ? workspaceAccess : []);
    await db.collection(USERS_COLLECTION).doc(uid).set({
      email: inv.email,
      role: VALID_ROLES.includes(inv.role) ? inv.role : 'creator',
      workspaceAccess,
      reviewerWorkspaces,
      lastActiveAt: FieldValue.serverTimestamp(),
    });
    await inviteDoc.ref.set({ usedAt: FieldValue.serverTimestamp(), acceptedUid: uid }, { merge: true });

    res.json({ success: true, email: inv.email });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Lightweight directory of all users, available to any authenticated user so
// the @mention picker can suggest people. Unlike GET /api/users this exposes
// only display fields (no roles, sign-in metadata, or account state).
router.get('/api/users/directory', async (req, res) => {
  try {
    const { users } = await getAuth().listUsers(1000);
    const result = users
      .filter(u => !u.disabled)
      .map(u => ({
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || null,
      }));
    result.sort((a, b) =>
      (a.displayName || a.email).localeCompare(b.displayName || b.email)
    );
    res.json(result);
  } catch (error) {
    console.error('Error listing user directory:', error);
    res.status(500).json({ error: 'Failed to load user directory' });
  }
});

module.exports = router;
