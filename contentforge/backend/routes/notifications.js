// The notification bell: list/read/read-all, plus admin announcements.
const express = require('express');
const { db, NOTIFICATIONS_COLLECTION } = require('../lib/firebase');
const { requireAdmin } = require('../lib/guards');
const { broadcastNotification } = require('../lib/notifications');

const router = express.Router();

// List the current user's notifications (most recent first) with an unread count.
router.get('/api/notifications', async (req, res) => {
  try {
    const snap = await db.collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', req.user.uid)
      .get();
    const items = snap.docs.map(d => {
      const data = d.data();
      const createdAt = data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0;
      return { id: d.id, ...data, createdAt };
    });
    items.sort((a, b) => b.createdAt - a.createdAt);
    const unreadCount = items.filter(n => !n.read).length;
    res.json({ notifications: items.slice(0, 50), unreadCount });
  } catch (error) {
    console.error('Error listing notifications:', error);
    res.status(500).json({ error: 'Failed to list notifications' });
  }
});

// Mark a single notification as read.
router.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const ref = db.collection(NOTIFICATIONS_COLLECTION).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().userId !== req.user.uid) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    await ref.update({ read: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all of the current user's notifications as read.
router.post('/api/notifications/read-all', async (req, res) => {
  try {
    const snap = await db.collection(NOTIFICATIONS_COLLECTION)
      .where('userId', '==', req.user.uid)
      .get();
    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(d => {
      if (!d.data().read) { batch.update(d.ref, { read: true }); count++; }
    });
    if (count > 0) await batch.commit();
    res.json({ success: true, updated: count });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Admin: broadcast an announcement to every user.
router.post('/api/notifications/announce', requireAdmin, async (req, res) => {
  const { title, message = '' } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'A title is required' });
  }
  try {
    const recipients = await broadcastNotification({
      title: title.trim(),
      message: (message || '').trim(),
    });
    res.json({ success: true, recipients });
  } catch (error) {
    console.error('Error broadcasting announcement:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
});

module.exports = router;
