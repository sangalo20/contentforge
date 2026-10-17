// Social content: the flattened Social Library, generation (article syndication
// + original-idea compose), the review-lifecycle editing loop (draft / revise /
// finalize), render proxies, and the Loki studio chat stream.
const express = require('express');
const axios = require('axios');
const { db, FieldValue, getStorage, STORAGE_BUCKET } = require('../lib/firebase');
const { canAccessWorkspace } = require('../lib/authz');
const { requireItemWorkspaceAccess, requireHumanSession } = require('../lib/guards');
const { getWorkspaces } = require('../lib/workspacesStore');
const { odinRequestHeaders } = require('../lib/odinClient');
const { runOdinToolLoop } = require('../lib/odinStream');
const athena = require('../lib/athena');
const {
  socialSourceOf,
  normalizeSocialGenParams,
  normalizeIdea,
} = require('../lib/socialSource');
const { SocialGenError, generateSocialContent, flattenSocialEntries } = require('../lib/socialContent');
const { SOCIAL_CONTENT_FIELDS, socialKeyFor, parseSocialReviewBody, itemTitleOf, reviewPieceLabel } = require('../lib/reviewTargets');
const { effectiveStatus, isDeletable, isArchivable, canArchiveApproved } = require('../lib/deletionPolicy');
const { createNotification } = require('../lib/notifications');
const { log: logger } = require('../logger');

const router = express.Router();

// GET all generated social content for a workspace, flattened into one list.
// Each entry is one piece of generated content (text post, carousel, or poster),
// tagged by the channel it was generated for so the UI can filter per channel.
router.get('/api/social-library/:workspaceId', async (req, res) => {
  if (!canAccessWorkspace(req.user, req.params.workspaceId)) {
    return res.status(403).json({ error: 'You do not have access to this workspace' });
  }
  try {
    const snapshot = await db.collection('content_pipeline_library')
      .where('workspaceId', '==', req.params.workspaceId)
      .orderBy('createdAt', 'desc')
      .get();

    // The flattening/normalization lives in lib/socialContent.js (shared with /api/v1).
    res.json(flattenSocialEntries(snapshot.docs));
  } catch (error) {
    console.error('Error fetching social library:', error);
    res.status(500).json({ error: 'Failed to fetch social library' });
  }
});


// POST generate social copy for an approved article (Loki syndication).
// Turns a library article into platform-native LinkedIn or X copy.
router.post('/api/generate-socials', async (req, res) => {
  try {
    const { itemId } = req.body || {};
    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }
    const params = normalizeSocialGenParams(req.body || {});
    if (params.error) return res.status(400).json({ error: params.error });

    // Enforce workspace access and load the source item. The generation core
    // lives in lib/socialContent.js (shared with /api/v1).
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return; // response already sent (404 or 403)
    const result = await generateSocialContent({ user: req.user, doc, params, template: req.body.template });
    res.json(result.format === 'text' ? result : { status: 'success', ...result });
  } catch (error) {
    if (error instanceof SocialGenError) {
      return res.status(error.status).json({ error: error.message });
    }
    const detail = error.response?.data?.detail || error.message;
    console.error('Error generating socials:', detail);
    res.status(500).json({ error: 'Failed to generate social copy', detail });
  }
});

// POST create social content from an original idea — no source article. The
// social team's lane: creates a social-only library item (sourceType
// 'original') holding the creator's idea brief, then runs the same Loki
// generation and review lifecycle the article path uses.
router.post('/api/socials/compose', async (req, res) => {
  try {
    const { workspaceId } = req.body || {};
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    if (!canAccessWorkspace(req.user, workspaceId)) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }
    const workspace = getWorkspaces().find(w => w.id === workspaceId && !w.deletedAt);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    const ideaCheck = normalizeIdea(req.body?.idea);
    if (ideaCheck.error) return res.status(400).json({ error: ideaCheck.error });
    const params = normalizeSocialGenParams(req.body || {});
    if (params.error) return res.status(400).json({ error: params.error });

    const ref = await db.collection('content_pipeline_library').add({
      workspaceId,
      sourceType: 'original',
      idea: ideaCheck.idea,
      title: ideaCheck.title,
      createdBy: req.user.uid,
      socials: {},
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.event('social.composed', { itemId: ref.id, workspaceId });

    let result;
    try {
      const doc = await ref.get();
      result = await generateSocialContent({ user: req.user, doc, params, template: req.body.template });
    } catch (err) {
      // Generation failed before anything was saved on the item: don't leave
      // an invisible orphan behind.
      await ref.delete().catch(() => {});
      throw err;
    }
    res.json(result.format === 'text' ? result : { status: 'success', ...result });
  } catch (error) {
    if (error instanceof SocialGenError) {
      return res.status(error.status).json({ error: error.message });
    }
    const detail = error.response?.data?.detail || error.message;
    console.error('Error composing social content:', detail);
    res.status(500).json({ error: 'Failed to create content from the idea', detail });
  }
});

// List the available carousel brand templates (proxied from Odin's registry).
router.get('/api/carousel/templates', async (req, res) => {
  try {
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const upstream = await axios.get(`${odinApiUrl}/api/v1/carousel/templates`, {
      headers: await odinRequestHeaders(odinApiUrl, req.user),
      timeout: 30000
    });
    res.json(upstream.data);
  } catch (error) {
    console.error('Failed to list carousel templates:', error.message);
    res.status(500).json({ error: 'Failed to load templates', templates: [] });
  }
});

// Durable poster download. Studio-designed posters store their rendered bytes
// in Firebase Storage at approval time and stream straight back; legacy
// posters re-render through Odin's renderer from the persisted content.
router.get('/api/socials/poster/item/:itemId/:channel', async (req, res) => {
  const { itemId, channel } = req.params;
  const normChannel = String(channel).toLowerCase();
  try {
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const saved = doc.data().socials?.[`${normChannel}_poster`];
    if (!saved || (!saved.headline && !saved.imageStoragePath)) {
      return res.status(404).json({ error: 'No saved poster for this item.' });
    }
    if (saved.imageStoragePath) {
      const [buffer] = await getStorage().bucket(STORAGE_BUCKET).file(saved.imageStoragePath).download();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="poster_${normChannel}.png"`);
      return res.send(buffer);
    }
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const headers = await odinRequestHeaders(odinApiUrl, req.user);
    const rendered = await axios.post(`${odinApiUrl}/api/v1/poster/render`, {
      content: {
        poster_type: saved.posterType || 'statement',
        stat: saved.stat || '',
        headline: saved.headline || '',
        subline: saved.subline || '',
      },
      brandName: saved.brandName || '',
      template: saved.template || 'devfest',
    }, { headers, timeout: 120000 });
    const fileId = rendered.data?.file_id;
    if (!fileId) throw new Error('Render returned no file id');
    const upstream = await axios.get(`${odinApiUrl}/api/v1/reports/poster/${fileId}`, {
      responseType: 'stream', headers, timeout: 120000
    });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="poster_${normChannel}.png"`);
    upstream.data.pipe(res);
  } catch (error) {
    console.error('Durable poster download failed:', error.code || error.message, error.message);
    res.status(500).json({ error: 'Could not produce the poster image' });
  }
});

// Durable carousel download: re-renders the PDF from the persisted slides +
// template (design is deterministic code), so it survives temp cleanup/restarts.
router.get('/api/socials/carousel/item/:itemId/:channel', async (req, res) => {
  const { itemId, channel } = req.params;
  const normChannel = String(channel).toLowerCase();
  try {
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return; // 404/403 already sent
    const saved = doc.data().socials?.[`${normChannel}_carousel`];
    if (!saved || (!Array.isArray(saved.slides) || saved.slides.length === 0) && !saved.pdfStoragePath) {
      return res.status(404).json({ error: 'No saved carousel for this item.' });
    }
    // Studio-designed carousels: the approved PDF bytes are frozen in Storage —
    // serve them directly, no renderer involved.
    if (saved.pdfStoragePath) {
      const [buffer] = await getStorage().bucket(STORAGE_BUCKET).file(saved.pdfStoragePath).download();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="carousel_${normChannel}.pdf"`);
      return res.send(buffer);
    }
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const headers = await odinRequestHeaders(odinApiUrl, req.user);
    // Re-render a fresh PDF from the stored slides + template.
    const rendered = await axios.post(`${odinApiUrl}/api/v1/carousel/render`, {
      slides: saved.slides,
      brandName: saved.brandName || '',
      template: saved.template || 'devfest',
    }, { headers, timeout: 120000 });
    const fileId = rendered.data?.file_id;
    if (!fileId) throw new Error('Render returned no file id');
    const upstream = await axios.get(`${odinApiUrl}/api/v1/reports/carousel/${fileId}`, {
      responseType: 'stream', headers, timeout: 120000
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="carousel_${normChannel}.pdf"`);
    upstream.data.pipe(res);
  } catch (error) {
    console.error('Durable carousel download failed:', error.code || error.message, error.message);
    res.status(500).json({ error: 'Could not produce the carousel PDF' });
  }
});


// Studio-designed carousels: persist the chosen design set and (optionally)
// the client-rendered PDF bytes — the carousel twin of /api/socials/poster-image.
// Design-only calls record the reviewer's pick; the PDF lands at approval time
// and makes the durable download independent of any renderer.
router.post('/api/socials/carousel-pdf', async (req, res) => {
  try {
    const { itemId, channel, pdfData, design } = req.body || {};
    if (!itemId || !channel) return res.status(400).json({ error: 'itemId and channel are required' });
    if (pdfData === undefined && design === undefined) return res.status(400).json({ error: 'pdfData or design is required' });
    const normChannel = String(channel).toLowerCase();
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const key = `${normChannel}_carousel`;
    if (!doc.data().socials?.[key]) {
      return res.status(404).json({ error: 'No carousel on this item/channel.' });
    }
    const patch = { updatedAt: FieldValue.serverTimestamp() };
    if (design !== undefined) patch[`socials.${key}.design`] = design || null;
    if (pdfData) {
      const m = /^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/.exec(pdfData);
      if (!m) return res.status(400).json({ error: 'pdfData must be a base64 PDF data URL' });
      const buffer = Buffer.from(m[1], 'base64');
      if (buffer.length === 0) return res.status(400).json({ error: 'PDF data is empty' });
      if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'PDF is too large (10MB max)' });
      const pdfStoragePath = `content-pipeline/socials/carousels/${itemId}_${normChannel}.pdf`;
      await getStorage().bucket(STORAGE_BUCKET).file(pdfStoragePath).save(buffer, {
        contentType: 'application/pdf', resumable: false, metadata: { cacheControl: 'no-cache' },
      });
      patch[`socials.${key}.pdfStoragePath`] = pdfStoragePath;
    }
    await doc.ref.update(patch);
    res.json({ success: true, design: design ?? null, pdfStoragePath: patch[`socials.${key}.pdfStoragePath`] ?? null });
  } catch (error) {
    console.error('Carousel PDF save failed:', error.message);
    res.status(500).json({ error: 'Failed to save the carousel design' });
  }
});

// Studio-designed posters: persist the chosen design and (optionally) the
// client-rendered PNG bytes. Design-only calls record the reviewer's pick so
// every viewer sees the same render; the bytes land at approval time and make
// the durable download independent of any renderer.
router.post('/api/socials/poster-image', async (req, res) => {
  try {
    const { itemId, channel, imageData, design } = req.body || {};
    if (!itemId || !channel) return res.status(400).json({ error: 'itemId and channel are required' });
    if (!imageData && !design) return res.status(400).json({ error: 'imageData or design is required' });
    const normChannel = String(channel).toLowerCase();
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const key = `${normChannel}_poster`;
    if (!doc.data().socials?.[key]) {
      return res.status(404).json({ error: 'No poster on this item/channel.' });
    }
    const patch = { updatedAt: FieldValue.serverTimestamp() };
    if (design !== undefined) patch[`socials.${key}.design`] = design || null;
    if (imageData) {
      const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(imageData);
      if (!m) return res.status(400).json({ error: 'imageData must be a base64 PNG data URL' });
      const buffer = Buffer.from(m[1], 'base64');
      if (buffer.length === 0) return res.status(400).json({ error: 'Image data is empty' });
      if (buffer.length > 10 * 1024 * 1024) return res.status(400).json({ error: 'Image is too large (10MB max)' });
      const imageStoragePath = `content-pipeline/socials/posters/${itemId}_${normChannel}.png`;
      await getStorage().bucket(STORAGE_BUCKET).file(imageStoragePath).save(buffer, {
        contentType: 'image/png', resumable: false, metadata: { cacheControl: 'no-cache' },
      });
      patch[`socials.${key}.imageStoragePath`] = imageStoragePath;
    }
    await doc.ref.update(patch);
    res.json({ success: true, design: design ?? null, imageStoragePath: patch[`socials.${key}.imageStoragePath`] ?? null });
  } catch (error) {
    console.error('Poster image save failed:', error.message);
    res.status(500).json({ error: 'Failed to save the poster design' });
  }
});

// Save the reviewer's in-progress edits to a drafted carousel/poster.
router.post('/api/socials/draft', async (req, res) => {
  try {
    const parsed = parseSocialReviewBody(req, res);
    if (!parsed) return;
    const { itemId, kind, socialKey } = parsed;
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const saved = doc.data().socials?.[socialKey];
    if (!saved) {
      return res.status(404).json({ error: `No generated ${kind} to edit for this item.` });
    }
    const fields = SOCIAL_CONTENT_FIELDS[kind](req.body.content || {});
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${socialKey}`]: {
        ...saved, ...fields,
        status: 'draft',
        fileId: null,
        // Content changed: any frozen studio PDF no longer matches the words.
        ...(kind === 'carousel' ? { pdfStoragePath: null } : {}),
        editedAt: FieldValue.serverTimestamp(),
      }
    });
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error saving social draft:', error.message);
    res.status(500).json({ error: 'Failed to save the draft' });
  }
});

// Ask Loki for another take on a drafted carousel/poster — the whole piece, or a
// single slide (slideIndex) — steered by the reviewer's note. Persists the result
// as the new draft.
router.post('/api/socials/revise', async (req, res) => {
  try {
    const parsed = parseSocialReviewBody(req, res);
    if (!parsed) return;
    const { itemId, channel, kind, socialKey } = parsed;
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const item = doc.data();
    const saved = item.socials?.[socialKey];
    if (!saved) {
      return res.status(404).json({ error: `No generated ${kind} to revise for this item.` });
    }

    // Revise from the reviewer's CURRENT (possibly hand-edited) content, with the
    // same persona/function levers the piece was generated under.
    const fields = SOCIAL_CONTENT_FIELDS[kind](req.body.content || saved);
    let personaPrompt = '';
    const workspace = getWorkspaces().find(w => w.id === item.workspaceId);
    if (saved.personaId && workspace) {
      const persona = (workspace.socialPersonas || []).find(p => p.id === saved.personaId);
      if (persona) personaPrompt = persona.prompt || '';
    }

    const source = socialSourceOf(item);
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const response = await axios.post(`${odinApiUrl}/api/v1/tasks/revise-social`, {
      kind,
      channel,
      content: kind === 'carousel'
        ? { slides: fields.slides, cta: fields.cta }
        : kind === 'poster'
          ? { poster_type: fields.posterType, stat: fields.stat, headline: fields.headline, subline: fields.subline, cta: fields.cta }
          : { post: fields.post, thread: fields.thread, cta: fields.cta },
      note: req.body.note || null,
      slideIndex: Number.isInteger(req.body.slideIndex) ? req.body.slideIndex : null,
      draft: source.text || null,
      sourceType: source.type,
      personaPrompt,
      function: saved.function || 'teach',
    }, {
      headers: await odinRequestHeaders(odinApiUrl, req.user, { workspaceId: item.workspaceId, itemId }),
      timeout: 300000
    });

    if (!response.data || response.data.status !== 'success') {
      throw new Error(response.data?.detail || 'Odin returned an error');
    }
    const data = response.data.data || {};
    const revised = kind === 'carousel'
      ? { slides: data.slides || [], cta: data.cta ?? null }
      : kind === 'poster'
        ? { posterType: data.poster_type || 'statement', stat: data.stat ?? null, headline: data.headline ?? null, subline: data.subline ?? null, cta: data.cta ?? null }
        : { post: data.post ?? null, thread: data.thread ?? null, cta: data.cta ?? null };

    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${socialKey}`]: {
        ...saved, ...revised,
        status: 'draft',
        fileId: null,
        // Content changed: any frozen studio PDF no longer matches the words.
        ...(kind === 'carousel' ? { pdfStoragePath: null } : {}),
        editedAt: FieldValue.serverTimestamp(),
      }
    });
    res.json({ status: 'success', channel, kind, ...revised });
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error('Error revising social draft:', detail);
    res.status(500).json({ error: 'Failed to revise the draft', detail });
  }
});

// Finalize a reviewed carousel/poster/text: render where applicable (which also
// validates the final content) and persist it as 'finalized'. This is the
// creator's hardening step; 'approved' is reserved for reviewer approval via
// /api/reviews/decide. Route path kept for compatibility.
router.post('/api/socials/approve', async (req, res) => {
  try {
    const parsed = parseSocialReviewBody(req, res);
    if (!parsed) return;
    const { itemId, channel, kind, socialKey } = parsed;
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const saved = doc.data().socials?.[socialKey];
    if (!saved) {
      return res.status(404).json({ error: `No generated ${kind} to finalize for this item.` });
    }
    const fields = SOCIAL_CONTENT_FIELDS[kind](req.body.content || saved);
    if (kind === 'carousel' && fields.slides.length === 0) {
      return res.status(422).json({ error: 'Cannot finalize an empty carousel.' });
    }
    if (kind === 'poster' && !fields.headline) {
      return res.status(422).json({ error: 'Cannot finalize a poster without a headline.' });
    }

    // Text has no render step: the words are the deliverable. Finalizing just
    // validates non-empty content and flips the status (keeping any cover image).
    if (kind === 'text') {
      const hasBody = (fields.post && fields.post.trim()) || (Array.isArray(fields.thread) && fields.thread.some((t) => t.trim()));
      if (!hasBody) {
        return res.status(422).json({ error: 'Cannot finalize an empty post.' });
      }
      const payload = { ...saved, ...fields, status: 'finalized' };
      await db.collection('content_pipeline_library').doc(itemId).update({
        [`socials.${socialKey}`]: { ...payload, finalizedAt: FieldValue.serverTimestamp() }
      });
      logger.event('social.finalized', { itemId, channel, kind });
      return res.json({ status: 'success', channel, kind, ...fields });
    }

    // Studio-designed carousels render in the browser and freeze their PDF at
    // approval (/api/socials/carousel-pdf) — finalizing needs no server render.
    if (kind === 'carousel' && saved.design) {
      const payload = { ...saved, ...fields, status: 'finalized', fileId: null };
      await db.collection('content_pipeline_library').doc(itemId).update({
        [`socials.${socialKey}`]: { ...payload, finalizedAt: FieldValue.serverTimestamp() }
      });
      logger.event('social.finalized', { itemId, channel, kind, studioDesign: saved.design });
      return res.json({ status: 'success', channel, kind, ...fields });
    }

    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const headers = await odinRequestHeaders(odinApiUrl, req.user);
    const rendered = kind === 'carousel'
      ? await axios.post(`${odinApiUrl}/api/v1/carousel/render`, {
          slides: fields.slides,
          brandName: saved.brandName || '',
          template: saved.template || 'devfest',
        }, { headers, timeout: 120000 })
      : await axios.post(`${odinApiUrl}/api/v1/poster/render`, {
          content: {
            poster_type: fields.posterType,
            stat: fields.stat || '',
            headline: fields.headline || '',
            subline: fields.subline || '',
          },
          brandName: saved.brandName || '',
          template: saved.template || 'devfest',
        }, { headers, timeout: 120000 });
    const fileId = rendered.data?.file_id;
    if (!fileId) throw new Error('Render returned no file id');

    const payload = { ...saved, ...fields, status: 'finalized', fileId };
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${socialKey}`]: { ...payload, finalizedAt: FieldValue.serverTimestamp() }
    });
    logger.event('social.finalized', { itemId, channel, kind, rendered: true });
    res.json({ status: 'success', channel, kind, ...fields, fileId });
  } catch (error) {
    const detail = error.response?.data?.detail || error.message;
    console.error('Error finalizing social draft:', detail);
    res.status(500).json({ error: 'Failed to finalize the draft', detail });
  }
});

// Hard-delete a social asset. Only disposable content — drafts and finalized
// pieces that never went through approval. Approved content is the audit trail
// of what got posted, so it is archived via /api/socials/archive instead, and
// content under active review must be withdrawn first. Rendered carousel/poster
// files (fileId) are deliberately left in the render store (see TECH_DEBT).
// Deletion is human-only: API keys can never destroy content, regardless of
// their role — a person deletes from the UI (see also DELETE /api/library/:id).
router.post('/api/socials/delete', requireHumanSession, async (req, res) => {
  try {
    const parsed = parseSocialReviewBody(req, res);
    if (!parsed) return;
    const { itemId, channel, kind, socialKey } = parsed;
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const saved = doc.data().socials?.[socialKey];
    if (!saved) {
      return res.status(404).json({ error: `No generated ${kind} found for this item.` });
    }
    const status = effectiveStatus(saved);
    if (status === 'in_review') {
      return res.status(409).json({ error: 'This content is awaiting review. Withdraw the review before deleting it.' });
    }
    if (!isDeletable(status)) {
      return res.status(409).json({ error: 'Approved content cannot be deleted — archive it instead.' });
    }
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${socialKey}`]: FieldValue.delete(),
    });
    logger.event('social.deleted', { itemId, channel, kind, status, by: req.user.uid });
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting social asset:', error);
    res.status(500).json({ error: 'Failed to delete the asset' });
  }
});

// Archive / restore an approved social asset (reversible: hides it from the
// library, keeps the record). Approver sign-off rule: only the recorded
// approver or an admin — and when an admin archives someone else's approval,
// the approver gets a bell notification so the sign-off stays visible.
router.post('/api/socials/archive', async (req, res) => {
  try {
    const parsed = parseSocialReviewBody(req, res);
    if (!parsed) return;
    const { itemId, channel, kind, socialKey } = parsed;
    const archived = req.body.archived !== false; // default archive; { archived: false } restores
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const item = doc.data();
    const saved = item.socials?.[socialKey];
    if (!saved) {
      return res.status(404).json({ error: `No generated ${kind} found for this item.` });
    }
    if (!isArchivable(effectiveStatus(saved))) {
      return res.status(409).json({ error: 'Only approved content can be archived — delete drafts directly.' });
    }
    if (!canArchiveApproved(saved.review, req.user)) {
      const approver = saved.review?.decidedByEmail;
      return res.status(403).json({
        error: approver
          ? `This was approved by ${approver} — only they or an admin can archive it.`
          : 'Only an admin can archive this asset (no approver on record).',
      });
    }
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${socialKey}.archived`]: archived,
      [`socials.${socialKey}.archivedBy`]: archived ? req.user.uid : FieldValue.delete(),
      [`socials.${socialKey}.archivedAt`]: archived ? FieldValue.serverTimestamp() : FieldValue.delete(),
    });
    const approverUid = saved.review?.decidedBy;
    if (archived && approverUid && approverUid !== req.user.uid) {
      const actor = req.user.email ? req.user.email.split('@')[0] : 'An admin';
      await createNotification(approverUid, {
        type: 'announcement',
        title: `${actor} archived the ${reviewPieceLabel(kind, channel)} you approved on "${itemTitleOf(item)}"`,
        message: 'It is hidden from the Social Library; any admin can restore it.',
        workspaceId: item.workspaceId || null,
      });
    }
    logger.event('social.archived', { itemId, channel, kind, archived, by: req.user.uid });
    res.json({ status: 'success', archived });
  } catch (error) {
    console.error('Error archiving social asset:', error);
    res.status(500).json({ error: 'Failed to archive the asset' });
  }
});

// Studio chat (SSE): a live working session with Loki over a drafted carousel/
// poster. The browser sends the message + the CURRENT canvas content (which may
// include manual edits); we resolve the source article and the persona/function
// the piece was generated under, then pipe Loki's stream back. Loki's canvas
// updates arrive as {"type":"content"} events; the frontend applies them and
// persists via the draft-save route.
router.post('/api/odin/studio/stream', async (req, res) => {
  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
  try {
    const { itemId, channel, kind, message, content, history } = req.body || {};
    const normChannel = String(channel || '').toLowerCase();
    const normKind = String(kind || '').toLowerCase();
    if (!itemId || !message || !['linkedin', 'x'].includes(normChannel) || !['carousel', 'poster', 'text'].includes(normKind)) {
      return res.status(400).json({ error: 'itemId, message, a valid channel, and kind (carousel|poster|text) are required.' });
    }
    const doc = await requireItemWorkspaceAccess(req, res, itemId);
    if (!doc) return;
    const item = doc.data();
    const saved = item.socials?.[socialKeyFor(normChannel, normKind)] || {};
    let personaPrompt = '';
    const workspace = getWorkspaces().find(w => w.id === item.workspaceId);
    if (saved.personaId && workspace) {
      const persona = (workspace.socialPersonas || []).find(p => p.id === saved.personaId);
      if (persona) personaPrompt = persona.prompt || '';
    }

    const headers = await odinRequestHeaders(odinApiUrl, req.user, { workspaceId: item.workspaceId, itemId });
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = 'text/event-stream';

    // What Odin remembers about this workspace's past sessions (Athena).
    const memory = await athena.recallBlock(item.workspaceId, req.user.uid, message);

    const source = socialSourceOf(item);
    const callOdin = (convo, turnMessage) => axios.post(`${odinApiUrl}/api/v1/studio/chat/stream`, {
      message: turnMessage,
      kind: normKind,
      channel: normChannel,
      content: content || {},
      draft: source.text || '',
      sourceType: source.type,
      personaPrompt,
      memory,
      function: saved.function || 'teach',
      context: { history: convo },
    }, {
      headers,
      responseType: 'stream',
      timeout: 0,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

    // Loki's memory searches execute here via the shared agentic loop; the
    // exchange is remembered (Athena) once the stream completes.
    const { spokenText } = await runOdinToolLoop({
      req,
      callOdin,
      message,
      history,
      send,
      executors: {
        search_memory: async (tc) => {
          send({ type: 'status', content: 'Odin is searching memory...' });
          const found = await athena.recallBlock(item.workspaceId, req.user.uid, tc.query);
          return found || '(nothing found in long-term memory)';
        },
      },
      onTool: async (tc, result) => {
        await athena.storeEvent(item.workspaceId, req.user.uid, { type: 'action', content: `Searched long-term memory for: ${tc.query}`, metadata: { tool: tc.name } });
        await athena.storeEvent(item.workspaceId, req.user.uid, { type: 'observation', content: String(result).slice(0, 400), metadata: { tool: tc.name } });
      },
    });
    res.end();
    athena.storeTurn(item.workspaceId, req.user.uid, message, spokenText);
  } catch (error) {
    const status = error.response?.status || 502;
    console.error('Failed to proxy studio stream:', error.message);
    if (!res.headersSent) res.status(status).json({ error: 'Failed to reach the studio' });
    else {
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Could not reach Odin. Try again in a moment.' })}\n\n`);
      res.end();
    }
  }
});

// Stream a generated carousel PDF back to the browser. Proxies Odin's download
// endpoint (which holds the file in its temp dir) with service-to-service auth.
router.get('/api/socials/carousel/:fileId', async (req, res) => {
  const { fileId } = req.params;
  if (!/^[a-f0-9]{6,12}$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }
  try {
    const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
    const upstream = await axios.get(`${odinApiUrl}/api/v1/reports/carousel/${fileId}`, {
      responseType: 'stream',
      headers: await odinRequestHeaders(odinApiUrl, req.user),
      timeout: 120000
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', upstream.headers['content-disposition'] || `attachment; filename="carousel_${fileId}.pdf"`);
    upstream.data.pipe(res);
  } catch (error) {
    const status = error.response?.status || 500;
    console.error('Carousel download failed:', error.message);
    res.status(status === 404 ? 404 : 500).json({ error: 'Carousel not found or expired' });
  }
});

module.exports = router;
