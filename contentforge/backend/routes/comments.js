// Comments on library items, with @mention notifications + email.
const express = require('express');
const { db, COMMENTS_COLLECTION } = require('../lib/firebase');
const { requireItemWorkspaceAccess } = require('../lib/guards');
const { CommentError, postComment } = require('../lib/commentPosting');

const router = express.Router();

// List comments on a library item, oldest first.
router.get('/api/library/item/:itemId/comments', async (req, res) => {
  try {
    // Only members of the item's workspace may read its comment thread.
    const item = await requireItemWorkspaceAccess(req, res, req.params.itemId);
    if (!item) return;
    const snap = await db.collection(COMMENTS_COLLECTION)
      .where('itemId', '==', req.params.itemId)
      .get();
    const comments = snap.docs.map(d => {
      const data = d.data();
      const createdAt = data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0;
      return { id: d.id, ...data, createdAt };
    });
    comments.sort((a, b) => a.createdAt - b.createdAt);
    res.json(comments);
  } catch (error) {
    console.error('Error listing comments:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Post a comment on a library item. Any mentioned users (by uid) receive a
// "mention" notification linking back to the item. The posting itself lives
// in lib/commentPosting.js (shared with /api/v1).
router.post('/api/library/item/:itemId/comments', async (req, res) => {
  const { text, mentions = [] } = req.body || {};
  try {
    // Only members of the item's workspace may comment (and thus fan out
    // mention notifications from) its thread.
    const itemDoc = await requireItemWorkspaceAccess(req, res, req.params.itemId);
    if (!itemDoc) return;

    const { id, comment } = await postComment({
      user: req.user,
      itemId: req.params.itemId,
      item: itemDoc.data(),
      text,
      mentions,
    });
    res.status(201).json({ id, ...comment, createdAt: Date.now() });
  } catch (error) {
    if (error instanceof CommentError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error posting comment:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// Emoji reactions: a fixed palette keeps the stored data clean and the UI
// picker exhaustive — anything outside it is rejected. Mirrored in
// frontend/src/components/CommentThread.jsx.
const REACTION_EMOJI = ['👍', '❤️', '😂', '🎉', '💡', '🔥'];

// Toggle the caller's reaction on a comment. Reactions are stored on the
// comment doc as { [emoji]: [uid, ...] }; an emoji whose last uid is removed
// is dropped from the map.
router.post('/api/library/item/:itemId/comments/:commentId/reactions', async (req, res) => {
  const { emoji } = req.body || {};
  if (!REACTION_EMOJI.includes(emoji)) {
    return res.status(400).json({ error: 'Unsupported reaction' });
  }
  try {
    const item = await requireItemWorkspaceAccess(req, res, req.params.itemId);
    if (!item) return;
    const ref = db.collection(COMMENTS_COLLECTION).doc(req.params.commentId);
    const doc = await ref.get();
    // The comment must belong to the item in the URL — otherwise the workspace
    // guard above could be satisfied with any item the caller can access.
    if (!doc.exists || doc.data().itemId !== req.params.itemId) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const reactions = { ...(doc.data().reactions || {}) };
    const uids = reactions[emoji] || [];
    const next = uids.includes(req.user.uid)
      ? uids.filter(uid => uid !== req.user.uid)
      : [...uids, req.user.uid];
    if (next.length === 0) delete reactions[emoji];
    else reactions[emoji] = next;
    await ref.update({ reactions });
    res.json({ id: doc.id, reactions });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: 'Failed to update reaction' });
  }
});

module.exports = router;
