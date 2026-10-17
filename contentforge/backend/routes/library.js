// --- LIBRARY CRUD ROUTES (FIREBASE) ---
// Article library items: listing, fetch, finalize, delete, and the cover-image
// lifecycle (article cover + per-channel social covers, stored in app-owned
// Firebase Storage and streamed back through public proxy routes).
const express = require('express');
const { db, FieldValue, getStorage, STORAGE_BUCKET, COMMENTS_COLLECTION } = require('../lib/firebase');
const { canAccessWorkspace } = require('../lib/authz');
const { requireAdmin, requireHumanSession, requireItemWorkspaceAccess } = require('../lib/guards');
const { fetchRemoteImage } = require('../lib/ssrf');
const { createNotification } = require('../lib/notifications');
const { log: logger } = require('../logger');

const router = express.Router();

// GET library items for a workspace
router.get('/api/library/:workspaceId', async (req, res) => {
  if (!canAccessWorkspace(req.user, req.params.workspaceId)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  try {
    const snapshot = await db.collection('content_pipeline_library')
      .where('workspaceId', '==', req.params.workspaceId)
      .orderBy('createdAt', 'desc')
      .get();

    const items = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Original-idea items are social-only; they belong to the Social
      // Library, not the article library.
      if (data.sourceType === 'original') return;
      items.push({ id: doc.id, ...data });
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ error: 'Failed to fetch library items' });
  }
});

router.get('/api/library/item/:id', async (req, res) => {
  try {
    const doc = await requireItemWorkspaceAccess(req, res, req.params.id);
    if (!doc) return; // response already sent (404 or 403)
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// PUT update and finalize a draft. The creator's "done editing" step —
// 'approved' is reserved for reviewer approval (/api/reviews/decide). Legacy
// items already marked 'approved' keep that status. Route path kept for compat.
router.put('/api/library/:id/approve', async (req, res) => {
  try {
    const guard = await requireItemWorkspaceAccess(req, res, req.params.id);
    if (!guard) return; // response already sent (404 or 403)
    const { draft } = req.body;
    await db.collection('content_pipeline_library').doc(req.params.id).update({
      draft,
      status: 'finalized',
      updatedAt: FieldValue.serverTimestamp()
    });
    logger.event('article.finalized', { itemId: req.params.id });
    res.json({ success: true, message: 'Draft finalized' });
  } catch (error) {
    console.error('Error finalizing draft:', error);
    res.status(500).json({ error: 'Failed to finalize draft' });
  }
});

// DELETE a library item (admin only, and human-only: API keys can never
// destroy content regardless of their role). Also removes the item's comments
// so no orphaned threads are left behind, and its cover image from storage.
router.delete('/api/library/:id', requireHumanSession, requireAdmin, async (req, res) => {
  try {
    const ref = db.collection('content_pipeline_library').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete the cover image from storage if one exists (best-effort).
    const storagePath = doc.data().coverImage?.storagePath;
    if (storagePath) {
      try {
        await getStorage().bucket(STORAGE_BUCKET).file(storagePath).delete();
      } catch (err) {
        if (err.code !== 404) console.error('Failed to delete cover image:', err.message);
      }
    }

    // Delete associated comments in batches.
    const commentsSnap = await db.collection(COMMENTS_COLLECTION)
      .where('itemId', '==', req.params.id)
      .get();
    if (!commentsSnap.empty) {
      let batch = db.batch();
      let pending = 0;
      for (const c of commentsSnap.docs) {
        batch.delete(c.ref);
        if (++pending >= 450) { await batch.commit(); batch = db.batch(); pending = 0; }
      }
      if (pending > 0) await batch.commit();
    }

    await ref.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting library item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// PUT save a cover image for a library item.
// The generated image URL (e.g. from Grok/x.ai) is temporary, so we download it
// and upload it as a permanent Sanity asset, then persist the reference in Firestore.
router.put('/api/library/:id/cover', async (req, res) => {
  try {
    const { imageUrl, imageData } = req.body;
    if (!imageUrl && !imageData) return res.status(400).json({ error: 'imageUrl or imageData is required' });

    // 1. Load the library doc AND enforce workspace access.
    const doc = await requireItemWorkspaceAccess(req, res, req.params.id);
    if (!doc) return;
    const docRef = doc.ref;

    // 2. Get the image bytes. Either a client-rendered image arrives inline as
    //    a base64 data URL (Brand Studio covers), or a generated image URL
    //    (e.g. Grok — temporary, so it must be downloaded now) is fetched
    //    through the SSRF-safe fetcher — the URL is user-supplied.
    let buffer, contentType;
    if (imageData) {
      const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
      if (!m) return res.status(400).json({ error: 'imageData must be a base64 image data URL (png, jpeg, or webp)' });
      contentType = m[1];
      buffer = Buffer.from(m[2], 'base64');
      if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Image is too large (10MB max)' });
      if (buffer.length === 0) return res.status(400).json({ error: 'Image data is empty' });
    } else {
      try {
        ({ buffer, contentType } = await fetchRemoteImage(imageUrl));
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

    // 3. Persist to app-owned Firebase Storage (NOT Sanity — that happens at publish)
    const storagePath = `content-pipeline/covers/${req.params.id}.${ext}`;
    await getStorage().bucket(STORAGE_BUCKET).file(storagePath).save(buffer, {
      contentType,
      resumable: false,
      metadata: { cacheControl: 'no-cache' }
    });

    // 4. Persist the storage reference + a display URL on the library doc.
    //    The image is served back through the proxy route below. Store a
    //    RELATIVE URL so it resolves against whatever host serves the app
    //    (localhost in dev, the Cloud Run URL in prod). Baking an absolute
    //    host in at save time breaks the image whenever the host changes.
    const displayUrl = `/api/library/${req.params.id}/cover/image?t=${Date.now()}`;
    const coverImage = { storagePath, contentType, source: imageData ? 'brand-studio' : imageUrl, url: displayUrl };
    await docRef.update({ coverImage, updatedAt: FieldValue.serverTimestamp() });

    const coverWorkspaceId = doc.data().workspaceId || null;
    await createNotification(req.user.uid, {
      type: 'image',
      title: 'Cover image ready',
      message: 'Your cover image has been generated and saved.',
      workspaceId: coverWorkspaceId,
      link: coverWorkspaceId ? `/workspace/${coverWorkspaceId}/library/item/${req.params.id}` : null,
    });

    res.json({ success: true, coverImage });
  } catch (error) {
    console.error('Error saving cover image:', error);
    res.status(500).json({ error: error.message || 'Failed to save cover image' });
  }
});

// GET stream the stored cover image back to the web app
router.get('/api/library/:id/cover/image', async (req, res) => {
  try {
    const doc = await db.collection('content_pipeline_library').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).end();
    const cover = doc.data().coverImage;
    if (!cover || !cover.storagePath) return res.status(404).end();

    res.set('Content-Type', cover.contentType || 'image/jpeg');
    getStorage()
      .bucket(STORAGE_BUCKET)
      .file(cover.storagePath)
      .createReadStream()
      .on('error', (err) => {
        console.error('Error streaming cover image:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Error fetching cover image:', error);
    res.status(500).end();
  }
});

// PUT save a per-post cover image for a social text post (LinkedIn/X). Same
// pattern as the blog cover: the Grok URL is temporary, so download the bytes,
// store them in app-owned Firebase Storage, and persist the reference on the
// social sub-doc (socials.<channel>.image). The image is for the user to attach
// when they post manually.
router.put('/api/library/:id/social/:channel/cover', async (req, res) => {
  try {
    const { imageUrl, imageData } = req.body;
    const normChannel = String(req.params.channel || '').toLowerCase();
    if (!imageUrl && !imageData) return res.status(400).json({ error: 'imageUrl or imageData is required' });
    if (!['linkedin', 'x'].includes(normChannel)) {
      return res.status(400).json({ error: `Unsupported channel: ${req.params.channel}` });
    }

    const doc = await requireItemWorkspaceAccess(req, res, req.params.id);
    if (!doc) return;
    if (!doc.data().socials?.[normChannel]) {
      return res.status(404).json({ error: 'No text post for this channel to attach an image to.' });
    }

    let buffer, contentType;
    if (imageData) {
      const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
      if (!m) return res.status(400).json({ error: 'imageData must be a base64 image data URL (png, jpeg, or webp)' });
      contentType = m[1];
      buffer = Buffer.from(m[2], 'base64');
      if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Image is too large (10MB max)' });
      if (buffer.length === 0) return res.status(400).json({ error: 'Image data is empty' });
    } else {
      try {
        ({ buffer, contentType } = await fetchRemoteImage(imageUrl));
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

    const storagePath = `content-pipeline/social-covers/${req.params.id}-${normChannel}.${ext}`;
    await getStorage().bucket(STORAGE_BUCKET).file(storagePath).save(buffer, {
      contentType, resumable: false, metadata: { cacheControl: 'no-cache' }
    });

    // Relative display URL, cache-busted, served back through the public proxy below.
    const displayUrl = `/api/library/${req.params.id}/social/${normChannel}/cover/image?t=${Date.now()}`;
    const image = { storagePath, contentType, source: imageData ? 'gemini-image' : imageUrl, url: displayUrl };
    await db.collection('content_pipeline_library').doc(req.params.id).update({
      [`socials.${normChannel}.image`]: image,
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, image });
  } catch (error) {
    console.error('Error saving social cover image:', error);
    res.status(500).json({ error: error.message || 'Failed to save the image' });
  }
});

// GET stream a stored social post image back to the web app (public: loaded via <img>).
router.get('/api/library/:id/social/:channel/cover/image', async (req, res) => {
  try {
    const normChannel = String(req.params.channel || '').toLowerCase();
    const doc = await db.collection('content_pipeline_library').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).end();
    const image = doc.data().socials?.[normChannel]?.image;
    if (!image || !image.storagePath) return res.status(404).end();

    res.set('Content-Type', image.contentType || 'image/jpeg');
    getStorage()
      .bucket(STORAGE_BUCKET)
      .file(image.storagePath)
      .createReadStream()
      .on('error', (err) => {
        console.error('Error streaming social image:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Error fetching social image:', error);
    res.status(500).end();
  }
});

module.exports = router;
