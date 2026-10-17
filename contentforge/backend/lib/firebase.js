// Firebase Admin bootstrap — the single place the SDK is initialized. Every
// module that needs Firestore/Auth/Storage imports the shared handles from
// here, so tests replace exactly one seam.
//
// TEST SEAM: route tests (tests/routes.*.test.mjs) run the real route and lib
// code over an in-memory Firestore fake. vi.mock can't intercept the native
// CJS require chain, so the fake is injected via this global BEFORE any route
// module is imported. Never set in production code.
if (global.__CONTENTFORGE_TEST_FIREBASE__) {
  module.exports = global.__CONTENTFORGE_TEST_FIREBASE__;
} else {
  const { initializeApp, applicationDefault, getApps } = require('firebase-admin/app');
  const { getFirestore, FieldValue } = require('firebase-admin/firestore');
  const { getStorage } = require('firebase-admin/storage');
  const { getAuth } = require('firebase-admin/auth');

  // Initialize once (idempotent under test re-imports and hot reload).
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.GCP_PROJECT_ID
    });
  }

  const db = getFirestore();
  // Never crash a write because an optional field is undefined; drop it instead.
  db.settings({ ignoreUndefinedProperties: true });

  // Firebase Storage bucket used for app-owned cover images. Cover images are
  // stored here at approval time and only uploaded to Sanity when publishing.
  const STORAGE_BUCKET = process.env.STORAGE_BUCKET || `${process.env.GCP_PROJECT_ID}.firebasestorage.app`;

  module.exports = {
    db,
    FieldValue,
    getAuth,
    getStorage,
    STORAGE_BUCKET,
    // The users collection maps a Firebase UID to a role. Anyone authenticated
    // who is not listed defaults to "creator" (least privilege).
    USERS_COLLECTION: 'content_pipeline_users',
    // Per-user notifications (see routes/notifications.js).
    NOTIFICATIONS_COLLECTION: 'content_pipeline_notifications',
    // Comments left on library items (with @mention tagging).
    COMMENTS_COLLECTION: 'content_pipeline_comments',
    // Pending invitations, redeemed on the invitee's first login.
    INVITES_COLLECTION: 'content_pipeline_invites',
    // Machine credentials (hashed API keys) for workbench/script access.
    API_KEYS_COLLECTION: 'content_pipeline_api_keys',
    // Async pipeline jobs for the /api/v1 machine-facing surface.
    JOBS_COLLECTION: 'content_pipeline_jobs',
    // Saved Brand Studio designs (editable recipes + rendered thumbnails).
    DESIGNS_COLLECTION: 'content_pipeline_designs',
  };
}
