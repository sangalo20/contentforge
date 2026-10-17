/**
 * Assign a ContentForge role to a user.
 *
 * Usage:
 *   node scripts/set-role.js <email> <admin|creator>
 *
 * Looks up the Firebase Auth user by email and writes their role to the
 * `content_pipeline_users` Firestore collection (doc id = uid). Uses the same
 * Application Default Credentials as the server.
 */
const dotenv = require('dotenv');
const path = require('path');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const [, , email, role] = process.argv;

if (!email || !['admin', 'creator'].includes(role)) {
  console.error('Usage: node scripts/set-role.js <email> <admin|creator>');
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: process.env.GCP_PROJECT_ID,
});

const db = getFirestore();

(async () => {
  try {
    const user = await getAuth().getUserByEmail(email);
    await db.collection('content_pipeline_users').doc(user.uid).set(
      { email: user.email, role },
      { merge: true }
    );
    console.log(`Set ${email} (${user.uid}) to role "${role}".`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
})();
