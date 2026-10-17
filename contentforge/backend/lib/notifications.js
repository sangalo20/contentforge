// --- NOTIFICATIONS ---
// Per-user notifications persisted in Firestore. Events such as a finished
// generation, a saved cover image, pipeline errors and admin announcements
// create a doc that the notification bell in the UI reads. Queries filter by a
// single field (userId) and sort in memory so no composite index is required.
const { db, FieldValue, getAuth, NOTIFICATIONS_COLLECTION } = require('./firebase');

const NOTIFICATION_TYPES = ['success', 'image', 'error', 'announcement', 'mention'];

// Create one notification for one user. Never throws — notification delivery
// must not break the action that triggered it.
async function createNotification(userId, { type, title, message = '', workspaceId = null, link = null }) {
  if (!userId || !title) return;
  try {
    await db.collection(NOTIFICATIONS_COLLECTION).add({
      userId,
      type: NOTIFICATION_TYPES.includes(type) ? type : 'success',
      title,
      message,
      workspaceId,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

// Fan a single notification out to every Firebase user (admin announcements).
async function broadcastNotification({ type = 'announcement', title, message = '', link = null }) {
  const { users } = await getAuth().listUsers(1000);
  let batch = db.batch();
  let pending = 0;
  let total = 0;
  for (const u of users) {
    const ref = db.collection(NOTIFICATIONS_COLLECTION).doc();
    batch.set(ref, {
      userId: u.uid,
      type,
      title,
      message,
      workspaceId: null,
      link,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    pending++;
    total++;
    // Firestore batches cap at 500 writes.
    if (pending >= 450) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  return total;
}

module.exports = { NOTIFICATION_TYPES, createNotification, broadcastNotification };
