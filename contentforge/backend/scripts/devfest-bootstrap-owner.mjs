// Create or reset the demo owner: a Firebase Auth email/password user plus the
// ContentForge membership doc (role owner, all workspaces, reviewer everywhere).
// Run from contentforge/backend:  node scripts/devfest-bootstrap-owner.mjs
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const projectId = process.env.GCP_PROJECT_ID;
const email = process.env.OWNER_EMAIL;
const password = process.env.OWNER_PASSWORD;
if (!projectId || !email || !password) {
  console.error('GCP_PROJECT_ID, OWNER_EMAIL and OWNER_PASSWORD are required');
  process.exit(2);
}

if (getApps().length === 0) initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password, emailVerified: true });
  console.log(`updated auth user ${user.uid}`);
} catch (e) {
  if (e.code !== 'auth/user-not-found') throw e;
  user = await auth.createUser({ email, password, emailVerified: true, displayName: 'DevFest Owner' });
  console.log(`created auth user ${user.uid}`);
}

await db.collection('content_pipeline_users').doc(user.uid).set({
  email,
  role: 'owner',
  workspaceAccess: 'all',
  reviewerWorkspaces: 'all',
  lastActiveAt: FieldValue.serverTimestamp(),
}, { merge: true });
console.log('membership doc written: owner / all workspaces / reviewer everywhere');
