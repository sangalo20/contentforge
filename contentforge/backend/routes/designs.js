// Brand Studio Design Library — persisted studio work. A saved design is an
// EDITABLE RECIPE (template + brand + design variant + content fields, small
// JSON in Firestore) plus its heavy bytes in Firebase Storage: uploaded
// photos/cutouts/AI backgrounds referenced by field key, and a rendered
// thumbnail captured at save time (the pixel-true record even if template
// code later evolves). Templates are pure functions of { design, brand }, so
// loading a recipe reproduces the design exactly.
//
// Sharing model: the library is team-global (any authenticated member can
// save, list, and load — designs are brand assets, not personal files);
// update/delete are creator-or-admin, and deletion is additionally HUMAN-ONLY
// like all destruction (API keys are refused regardless of role).
const express = require('express');
const { db, FieldValue, getStorage, STORAGE_BUCKET, DESIGNS_COLLECTION } = require('../lib/firebase');
const { isAdminRole } = require('../lib/authz');
const { requireHumanSession } = require('../lib/guards');
const { log: logger } = require('../logger');

const router = express.Router();

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // decoded, per image
const MAX_THUMB_BYTES = 2 * 1024 * 1024;
const MAX_FIELDS_JSON = 100_000;
const MAX_NAME_CHARS = 120;

const parseDataUrl = (value) => {
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(value || ''));
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], 'base64') };
};
const extOf = (ct) => (ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg');
// Field keys become Storage filenames and URL segments; keep them tame.
const safeKey = (key) => String(key).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80);

// Validate a save/update body; returns { error } or the pieces to persist.
function parseDesignBody(body = {}) {
  const name = String(body.name || '').trim().slice(0, MAX_NAME_CHARS);
  if (!name) return { error: 'A design name is required.' };
  const templateId = String(body.templateId || '').trim();
  const brandId = String(body.brandId || '').trim();
  if (!templateId || !brandId) return { error: 'templateId and brandId are required.' };
  const resolution = /^\d{2,5}x\d{2,5}$/.test(String(body.resolution || '')) ? body.resolution : null;

  const fields = body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields) ? body.fields : {};
  let fieldsJson;
  try { fieldsJson = JSON.stringify(fields); } catch { return { error: 'fields must be JSON-serializable.' }; }
  if (fieldsJson.length > MAX_FIELDS_JSON) return { error: 'The design content is too large.' };
  for (const v of Object.values(fields)) {
    if (typeof v === 'string' && v.startsWith('data:')) {
      return { error: 'Image data belongs in `images`, not `fields`.' };
    }
  }

  const rawImages = body.images && typeof body.images === 'object' ? body.images : {};
  const imageEntries = Object.entries(rawImages);
  if (imageEntries.length > MAX_IMAGES) return { error: `At most ${MAX_IMAGES} images per design.` };
  const images = [];
  for (const [key, dataUrl] of imageEntries) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return { error: `Image "${key}" must be a base64 png/jpeg/webp data URL.` };
    if (parsed.buffer.length === 0 || parsed.buffer.length > MAX_IMAGE_BYTES) {
      return { error: `Image "${key}" is empty or over ${MAX_IMAGE_BYTES / 1024 / 1024}MB.` };
    }
    images.push({ key, fileKey: safeKey(key), ...parsed });
  }
  const fileKeys = new Set(images.map((i) => i.fileKey));
  if (fileKeys.size !== images.length) return { error: 'Image keys collide after sanitizing; rename the fields.' };

  let thumbnail = null;
  if (body.thumbnail) {
    thumbnail = parseDataUrl(body.thumbnail);
    if (!thumbnail || thumbnail.buffer.length > MAX_THUMB_BYTES) {
      return { error: 'thumbnail must be a base64 image data URL under 2MB.' };
    }
  }
  return { name, templateId, brandId, resolution, fields, images, thumbnail };
}

const designDir = (id) => `content-pipeline/brand-studio/designs/${id}`;

async function saveDesignFiles(id, images, thumbnail) {
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const imageFiles = {};
  for (const img of images) {
    const storagePath = `${designDir(id)}/${img.fileKey}.${extOf(img.contentType)}`;
    await bucket.file(storagePath).save(img.buffer, {
      contentType: img.contentType, resumable: false, metadata: { cacheControl: 'no-cache' },
    });
    imageFiles[img.fileKey] = { key: img.key, storagePath, contentType: img.contentType };
  }
  let thumbFile = null;
  if (thumbnail) {
    const storagePath = `${designDir(id)}/thumb.${extOf(thumbnail.contentType)}`;
    await bucket.file(storagePath).save(thumbnail.buffer, {
      contentType: thumbnail.contentType, resumable: false, metadata: { cacheControl: 'no-cache' },
    });
    thumbFile = { storagePath, contentType: thumbnail.contentType };
  }
  return { imageFiles, thumbFile };
}

// Best-effort removal of a design's stored files (update replaces, delete removes).
async function deleteDesignFiles(data) {
  const bucket = getStorage().bucket(STORAGE_BUCKET);
  const paths = [
    ...Object.values(data.imageFiles || {}).map((f) => f.storagePath),
    ...(data.thumbFile ? [data.thumbFile.storagePath] : []),
  ];
  await Promise.all(paths.map((p) => bucket.file(p).delete().catch(() => {})));
}

// Cache-busted proxy URLs the client renders/loads from. `imageUrls` is keyed
// by the ORIGINAL field key so the client never reconstructs sanitized names.
const urlsOf = (id, data) => ({
  thumbnailUrl: data.thumbFile ? `/api/brand-studio/designs/${id}/image/thumb?t=${Date.now()}` : null,
  imageUrls: Object.fromEntries(Object.entries(data.imageFiles || {})
    .map(([fileKey, f]) => [f.key, `/api/brand-studio/designs/${id}/image/${fileKey}?t=${Date.now()}`])),
});

const summaryOf = (id, data) => ({
  id,
  name: data.name,
  templateId: data.templateId,
  brandId: data.brandId,
  resolution: data.resolution || null,
  createdBy: data.createdBy,
  createdByEmail: data.createdByEmail || null,
  createdAt: data.createdAt?.toMillis?.() || null,
  updatedAt: data.updatedAt?.toMillis?.() || null,
  thumbnailUrl: urlsOf(id, data).thumbnailUrl,
});

const canManage = (data, user) => data.createdBy === user.uid || isAdminRole(user.role);

// Save a new design.
router.post('/api/brand-studio/designs', async (req, res) => {
  try {
    const parsed = parseDesignBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const ref = db.collection(DESIGNS_COLLECTION).doc();
    const { imageFiles, thumbFile } = await saveDesignFiles(ref.id, parsed.images, parsed.thumbnail);
    await ref.set({
      name: parsed.name,
      templateId: parsed.templateId,
      brandId: parsed.brandId,
      resolution: parsed.resolution,
      fields: parsed.fields,
      imageFiles,
      thumbFile,
      createdBy: req.user.uid,
      createdByEmail: req.user.email || '',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.event('design.saved', { designId: ref.id, templateId: parsed.templateId, brandId: parsed.brandId });
    res.status(201).json({ design: { id: ref.id, name: parsed.name } });
  } catch (error) {
    console.error('Error saving design:', error);
    res.status(500).json({ error: 'Failed to save the design' });
  }
});

// List saved designs (optionally one brand's), newest first. Summaries only.
router.get('/api/brand-studio/designs', async (req, res) => {
  try {
    let query = db.collection(DESIGNS_COLLECTION);
    if (req.query.brand) query = query.where('brandId', '==', String(req.query.brand));
    const snap = await query.get();
    const designs = snap.docs.map((d) => summaryOf(d.id, d.data()));
    designs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    res.json({ designs });
  } catch (error) {
    console.error('Error listing designs:', error);
    res.status(500).json({ error: 'Failed to list designs' });
  }
});

// Load one design: the full recipe plus proxy URLs for its images.
router.get('/api/brand-studio/designs/:id', async (req, res) => {
  try {
    const doc = await db.collection(DESIGNS_COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Design not found' });
    const data = doc.data();
    res.json({ design: { ...summaryOf(doc.id, data), fields: data.fields || {}, ...urlsOf(doc.id, data) } });
  } catch (error) {
    console.error('Error loading design:', error);
    res.status(500).json({ error: 'Failed to load the design' });
  }
});

// Update a design in place (creator or admin). Full replace: the body carries
// the complete recipe again; old stored files are removed so nothing orphans.
router.put('/api/brand-studio/designs/:id', async (req, res) => {
  try {
    const doc = await db.collection(DESIGNS_COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Design not found' });
    if (!canManage(doc.data(), req.user)) {
      return res.status(403).json({ error: 'Only the design’s creator or an admin can update it.' });
    }
    const parsed = parseDesignBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    await deleteDesignFiles(doc.data());
    const { imageFiles, thumbFile } = await saveDesignFiles(doc.id, parsed.images, parsed.thumbnail);
    await doc.ref.set({
      name: parsed.name,
      templateId: parsed.templateId,
      brandId: parsed.brandId,
      resolution: parsed.resolution,
      fields: parsed.fields,
      imageFiles,
      thumbFile,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    logger.event('design.updated', { designId: doc.id });
    res.json({ design: { id: doc.id, name: parsed.name } });
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Failed to update the design' });
  }
});

// Delete a design (creator or admin; human-only like all destruction).
router.delete('/api/brand-studio/designs/:id', requireHumanSession, async (req, res) => {
  try {
    const doc = await db.collection(DESIGNS_COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Design not found' });
    if (!canManage(doc.data(), req.user)) {
      return res.status(403).json({ error: 'Only the design’s creator or an admin can delete it.' });
    }
    await deleteDesignFiles(doc.data());
    await doc.ref.delete();
    logger.event('design.deleted', { designId: req.params.id, by: req.user.uid });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete the design' });
  }
});

// Stream a design image or thumbnail back (public: loaded via <img>).
router.get('/api/brand-studio/designs/:id/image/:key', async (req, res) => {
  try {
    const doc = await db.collection(DESIGNS_COLLECTION).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).end();
    const data = doc.data();
    const file = req.params.key === 'thumb' ? data.thumbFile : data.imageFiles?.[req.params.key];
    if (!file || !file.storagePath) return res.status(404).end();

    res.set('Content-Type', file.contentType || 'image/png');
    getStorage().bucket(STORAGE_BUCKET)
      .file(file.storagePath)
      .createReadStream()
      .on('error', (err) => {
        console.error('Error streaming design image:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (error) {
    console.error('Error fetching design image:', error);
    res.status(500).end();
  }
});

module.exports = router;
