// The external API v1 operations — every verb as a transport-free function
// over the shared libs, called by BOTH the REST surface (routes/v1.js) and the
// MCP tools (routes/mcp.js) so the two can never drift. Failures throw
// V1Error(status, code, message); shapes here are the frozen v1 contract
// (docs/openapi.v1.json, TECH_DEBT #1b) — change them only additively.
const { db, JOBS_COLLECTION, USERS_COLLECTION, COMMENTS_COLLECTION, FieldValue } = require('./firebase');
const { canAccessWorkspace, canReviewWorkspace, isAdminRole } = require('./authz');
const { getWorkspaces } = require('./workspacesStore');
const {
  GenerationRequestError,
  validateGenerationRequest,
  draftTitleOf,
} = require('./generationPipeline');
const { createGenerationJob, JobsBusyError } = require('./jobs');
const { PublishError, publishLibraryItem } = require('./publishArticle');
const { ReviewSubmitError, submitReview } = require('./reviewSubmission');
const { CommentError, postComment } = require('./commentPosting');
const { SocialGenError, generateSocialContent, flattenSocialEntries } = require('./socialContent');
const { normalizeSocialGenParams } = require('./socialSource');
const { socialKeyFor } = require('./reviewTargets');
const athena = require('./athena');
const { log: logger } = require('../logger');

class V1Error extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Firestore Timestamp -> ISO string; null for anything else (including the
// serverTimestamp sentinel a just-written doc may briefly hold).
const isoOf = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : null);

// --- Normalization (mirrors scripts/migrate-legacy-statuses.js) ---

// Article status across all four data generations: 'pending_approval' is the
// legacy name for 'draft'; items with no status predate the review gate and
// read as approved; original-idea items are social-only and have none.
const articleStatusOf = (d) => {
  if (d.sourceType === 'original') return null;
  if (d.status === 'pending_approval') return 'draft';
  return d.status || 'approved';
};

// Sources across generations: modern items carry sources[]; pre-multi-source
// items get theirs synthesized from youtubeUrls/titles.
const sourcesOf = (d) => {
  if (Array.isArray(d.sources)) {
    return d.sources.map((s) => ({
      type: s.type,
      ...(s.url ? { url: s.url } : {}),
      ...(s.title ? { title: s.title } : {}),
    }));
  }
  const urls = d.youtubeUrls || (d.youtubeUrl ? [d.youtubeUrl] : []);
  return urls.map((url, i) => ({
    type: 'youtube',
    url,
    ...(d.titles?.[i] ? { title: d.titles[i] } : {}),
  }));
};

const itemTitleOf = (d) => draftTitleOf(d.draft) || d.titles?.[0] || null;

const itemSummaryOf = (id, d) => ({
  id,
  workspaceId: d.workspaceId || null,
  status: articleStatusOf(d),
  title: itemTitleOf(d),
  sources: sourcesOf(d),
  coverImageUrl: d.coverImage?.url || null,
  sanityId: d.sanityId || null,
  createdAt: isoOf(d.createdAt),
  updatedAt: isoOf(d.updatedAt),
});

const itemOf = (id, d) => ({
  ...itemSummaryOf(id, d),
  draft: d.draft || null,
  imagePrompt: d.imagePrompt || null,
  qaReport: d.qaReport || null,
});

const jobOf = (id, d) => ({
  id,
  type: d.type,
  status: d.status,
  workspaceId: d.workspaceId,
  stages: (d.stages || []).map((s) => ({
    at: new Date(s.at).toISOString(),
    level: s.level,
    message: s.message,
  })),
  result: d.result || null,
  error: d.error || null,
  ...(d.errorKind ? { errorKind: d.errorKind } : {}),
  createdAt: isoOf(d.createdAt),
  startedAt: isoOf(d.startedAt),
  finishedAt: isoOf(d.finishedAt),
});

const commentOf = (id, d) => ({
  id,
  authorUid: d.authorUid,
  authorEmail: d.authorEmail || null,
  authorName: d.authorName || null,
  text: d.text,
  mentions: d.mentions || [],
  createdAt: isoOf(d.createdAt),
});

// One social piece with its full content (the list endpoint carries previews).
const socialDetailOf = (itemId, channel, kind, val) => {
  const base = {
    itemId,
    channel,
    format: kind,
    status: val.status || 'approved',
    function: val.function || null,
    archived: !!val.archived,
    generatedAt: isoOf(val.generatedAt),
  };
  if (kind === 'text') {
    // Legacy nested `copy` normalizes here, like everywhere else (TECH_DEBT #1).
    const copy = val.copy || {};
    return {
      ...base,
      post: val.post ?? copy.post ?? null,
      thread: Array.isArray(val.thread) ? val.thread : (Array.isArray(copy.thread) ? copy.thread : null),
      cta: val.cta ?? copy.cta ?? null,
      imageUrl: val.image?.url || null,
    };
  }
  if (kind === 'carousel') {
    return { ...base, slides: val.slides || [], cta: val.cta ?? null, fileId: val.fileId || null, template: val.template || null };
  }
  return {
    ...base,
    posterType: val.posterType || null,
    stat: val.stat ?? null,
    headline: val.headline ?? null,
    subline: val.subline ?? null,
    cta: val.cta ?? null,
    fileId: val.fileId || null,
    template: val.template || null,
  };
};

// --- Shared guards ---

const assertWorkspaceAccess = (user, workspaceId) => {
  if (!canAccessWorkspace(user, workspaceId)) {
    throw new V1Error(403, 'forbidden', 'You do not have access to this workspace');
  }
};

async function loadItem(user, itemId) {
  const doc = await db.collection('content_pipeline_library').doc(itemId).get();
  if (!doc.exists) throw new V1Error(404, 'not_found', 'Item not found');
  const wid = doc.data().workspaceId || null;
  if (wid) assertWorkspaceAccess(user, wid);
  return doc;
}

// v1 accepts people as uids OR emails (machines usually know emails); emails
// resolve against the membership collection. Unknown emails are an error —
// silently dropping a tag would let a caller believe a human was notified.
async function resolveUserRefs(list, label) {
  const out = [];
  for (const entry of Array.isArray(list) ? list : []) {
    const s = String(entry || '').trim();
    if (!s) continue;
    if (s.includes('@')) {
      const snap = await db.collection(USERS_COLLECTION).where('email', '==', s).limit(1).get();
      if (snap.empty) throw new V1Error(400, 'invalid_request', `Unknown ${label}: ${s} is not a ContentForge member.`);
      out.push(snap.docs[0].id);
    } else {
      out.push(s);
    }
  }
  return out;
}

// --- Operations ---

// The workspaces this credential can generate into. Minimal, stable shape.
function listWorkspaces(user) {
  const workspaces = getWorkspaces()
    .filter((w) => !w.archived && !w.deletedAt)
    .filter((w) => canAccessWorkspace(user, w.id))
    .map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description || null,
      requireReview: !!w.requireReview,
    }));
  return { workspaces };
}

// Submit sources for generation. Validates synchronously, then starts an
// async job. The duplicate check runs inside the job: an already-generated
// source combination succeeds with result.existing = true.
async function submitGeneration(user, body = {}) {
  let validated;
  try {
    validated = validateGenerationRequest(user, body);
  } catch (err) {
    if (err instanceof GenerationRequestError) {
      const code = err.status === 400 ? 'invalid_request' : err.status === 404 ? 'not_found' : 'forbidden';
      throw new V1Error(err.status, code, err.message);
    }
    throw err;
  }
  try {
    const job = await createGenerationJob({ user, ...validated });
    logger.event('v1.generation.submitted', {
      jobId: job.id,
      workspaceId: validated.workspace.id,
      sources: validated.inputs.length,
      apiKeyId: user.apiKey?.id || null,
    });
    return { job: { ...job, workspaceId: validated.workspace.id } };
  } catch (err) {
    if (err instanceof JobsBusyError) throw new V1Error(429, 'rate_limited', err.message);
    console.error('[v1] Failed to create generation job:', err);
    throw new V1Error(500, 'internal', 'Failed to create the generation job');
  }
}

async function getJob(user, jobId) {
  const doc = await db.collection(JOBS_COLLECTION).doc(String(jobId)).get();
  if (!doc.exists) throw new V1Error(404, 'not_found', 'Job not found');
  const data = doc.data();
  assertWorkspaceAccess(user, data.workspaceId);
  return { job: jobOf(doc.id, data) };
}

const ITEM_STATUSES = ['draft', 'finalized', 'in_review', 'approved', 'published'];

// List a workspace's article items (social-only items are excluded, as in the
// app's library view). Filters/pages over normalized statuses so legacy items
// behave identically. Newest first. `cursor` is the previous page's last id.
async function listItems(user, workspaceId, { status, limit, cursor } = {}) {
  assertWorkspaceAccess(user, workspaceId);
  if (status && !ITEM_STATUSES.includes(status)) {
    throw new V1Error(400, 'invalid_request', `status must be one of: ${ITEM_STATUSES.join(', ')}`);
  }
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  const snapshot = await db.collection('content_pipeline_library')
    .where('workspaceId', '==', workspaceId)
    .orderBy('createdAt', 'desc')
    .get();

  let items = [];
  snapshot.forEach((doc) => {
    const summary = itemSummaryOf(doc.id, doc.data());
    if (summary.status === null) return; // social-only original-idea items
    if (status && summary.status !== status) return;
    items.push(summary);
  });

  if (cursor) {
    const idx = items.findIndex((i) => i.id === String(cursor));
    if (idx === -1) throw new V1Error(400, 'invalid_request', 'Unknown cursor');
    items = items.slice(idx + 1);
  }
  const page = items.slice(0, pageSize);
  return {
    items: page,
    nextCursor: items.length > pageSize ? page[page.length - 1].id : null,
  };
}

async function getItem(user, itemId) {
  const doc = await loadItem(user, itemId);
  return { item: itemOf(doc.id, doc.data()) };
}

// Import a finished article written elsewhere (a workbench, another tool) —
// the draft is taken AS-IS, no AI rewriting. The item lands as a normal
// 'draft' and the existing lifecycle takes over (finalize → review → publish,
// social syndication, covers). Title comes from the draft's H1; a `title`
// param covers drafts without one (stored, never injected into the draft).
async function importArticle(user, { workspaceId, draft, title } = {}) {
  if (!workspaceId) throw new V1Error(400, 'invalid_request', 'workspaceId is required');
  assertWorkspaceAccess(user, workspaceId);
  const workspace = getWorkspaces().find((w) => w.id === workspaceId);
  if (!workspace) throw new V1Error(404, 'not_found', 'Workspace not found');
  if (workspace.archived || workspace.deletedAt) {
    throw new V1Error(403, 'forbidden', 'This workspace is archived. Reopen it in Config to add content.');
  }
  if (typeof draft !== 'string' || !draft.trim()) {
    throw new V1Error(400, 'invalid_request', 'draft (markdown) is required');
  }
  if (draft.length > 400_000) {
    throw new V1Error(400, 'invalid_request', 'draft is too large (400,000 character max)');
  }
  const cleanTitle = draftTitleOf(draft) || String(title || '').trim().slice(0, 300);
  if (!cleanTitle) {
    throw new V1Error(400, 'invalid_request',
      'The draft needs a title: start it with an H1 markdown heading (# Title), or pass a title field.');
  }

  const fields = {
    workspaceId,
    draft: draft.trim(),
    sources: [{ type: 'import', title: cleanTitle }],
    titles: [cleanTitle], // legacy title fallback (publish, readers) — TECH_DEBT #1
    status: 'draft',
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  const ref = await db.collection('content_pipeline_library').add(fields);

  // Typed memory, like generated articles — future scouting can recall it.
  athena.storeEvent(workspaceId, user.uid, {
    type: 'action',
    content: `Imported article "${cleanTitle}" (written outside the forge)`,
    metadata: { itemId: ref.id, source: 'import' },
    payloadText: fields.draft,
    mimeType: 'text/markdown',
  });
  logger.event('v1.article.imported', {
    itemId: ref.id,
    workspaceId,
    draftChars: fields.draft.length,
    apiKeyId: user.apiKey?.id || null,
  });
  return { item: itemOf(ref.id, fields) };
}

// Finalize a draft — the "done editing" verb (reviewer approval is a separate
// human flow; where the workspace requires review, publish stays gated on it).
// Stricter than the app's finalize: refuses to yank an item out of an active
// review or re-open published/approved content.
async function finalizeItem(user, itemId, draft) {
  const doc = await loadItem(user, itemId);
  const current = articleStatusOf(doc.data());
  if (current === null) {
    throw new V1Error(409, 'conflict', 'This item has no article to finalize (social-only item).');
  }
  if (!['draft', 'finalized'].includes(current)) {
    throw new V1Error(409, 'conflict',
      `Cannot finalize an item with status '${current}'. Only draft or finalized items can be finalized here.`);
  }
  if (draft !== undefined && typeof draft !== 'string') {
    throw new V1Error(400, 'invalid_request', 'draft must be a string when provided');
  }
  await doc.ref.update({
    ...(typeof draft === 'string' ? { draft } : {}),
    status: 'finalized',
    updatedAt: FieldValue.serverTimestamp(),
  });
  logger.event('article.finalized', { itemId, via: 'v1' });
  return { item: { id: doc.id, status: 'finalized' } };
}

// Publish to the workspace's Sanity site. Admin-only (an API key can carry the
// admin role); where the workspace requires review, the shared review gate in
// lib/publishArticle.js still applies.
async function publishItem(user, itemId) {
  if (!isAdminRole(user?.role)) {
    throw new V1Error(403, 'forbidden', 'Admin privileges required');
  }
  await loadItem(user, itemId);
  try {
    const { sanityId, title } = await publishLibraryItem(itemId);
    return { item: { id: itemId, status: 'published', sanityId, title } };
  } catch (err) {
    if (err instanceof PublishError) {
      const code = err.status === 404 ? 'not_found'
        : err.status === 403 ? 'forbidden'
        : err.status === 400 ? 'invalid_request'
        : 'upstream';
      throw new V1Error(err.status, code, err.message);
    }
    console.error('[v1] Failed to publish item:', err);
    throw new V1Error(500, 'internal', err.message || 'Failed to publish the item');
  }
}

// Users holding a reviewer grant for this workspace — the people a caller may
// tag on a review submission.
async function listReviewers(user, workspaceId) {
  assertWorkspaceAccess(user, workspaceId);
  const snap = await db.collection(USERS_COLLECTION).get();
  const reviewers = snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }))
    .filter((u) => canReviewWorkspace(u, workspaceId))
    .map((u) => ({ uid: u.uid, email: u.email || null }));
  reviewers.sort((a, b) => String(a.email).localeCompare(String(b.email)));
  return { reviewers };
}

const SOCIAL_REVIEW_KINDS = ['text', 'carousel', 'poster'];
const SOCIAL_CHANNELS = ['linkedin', 'x'];

// Submit content for human review. Reviewers get bell + email notifications;
// the piece moves to in_review and only a reviewer decision (a human flow)
// moves it on. Content must be finalized first.
async function submitItemReview(user, itemId, { reviewers, note, kind, channel } = {}) {
  const normKind = String(kind || 'article').toLowerCase();
  const normChannel = String(channel || '').toLowerCase();
  if (normKind !== 'article' && !SOCIAL_REVIEW_KINDS.includes(normKind)) {
    throw new V1Error(400, 'invalid_request', `kind must be article, ${SOCIAL_REVIEW_KINDS.join(', ')}`);
  }
  if (normKind !== 'article' && !SOCIAL_CHANNELS.includes(normChannel)) {
    throw new V1Error(400, 'invalid_request', `A valid channel (${SOCIAL_CHANNELS.join(', ')}) is required for ${normKind} reviews`);
  }
  try {
    const resolved = await resolveUserRefs(reviewers, 'reviewer');
    const result = await submitReview({
      user,
      itemId,
      kind: normKind,
      channel: normKind === 'article' ? null : normChannel,
      reviewers: resolved,
      note,
    });
    return { review: { status: 'in_review', reviewers: result.reviewers, note: result.note } };
  } catch (err) {
    if (err instanceof ReviewSubmitError) {
      const code = err.status === 404 ? 'not_found' : err.status === 403 ? 'forbidden'
        : err.status === 422 ? 'conflict' : 'invalid_request';
      throw new V1Error(err.status, code, err.message);
    }
    throw err;
  }
}

async function listComments(user, itemId) {
  await loadItem(user, itemId);
  const snap = await db.collection(COMMENTS_COLLECTION)
    .where('itemId', '==', itemId)
    .get();
  const comments = snap.docs.map((d) => ({
    ...commentOf(d.id, d.data()),
    _sort: d.data().createdAt?.toMillis?.() || 0,
  }));
  comments.sort((a, b) => a._sort - b._sort);
  return { comments: comments.map(({ _sort, ...c }) => c) };
}

// Post a comment; `mentions` (uids or emails) get bell + email notifications —
// this is how a machine tags a person on an article.
async function postItemComment(user, itemId, { text, mentions } = {}) {
  const doc = await loadItem(user, itemId);
  const resolved = await resolveUserRefs(mentions, 'mention');
  try {
    const { id, comment } = await postComment({
      user,
      itemId,
      item: doc.data(),
      text,
      mentions: resolved,
    });
    return { comment: { ...commentOf(id, comment), createdAt: new Date().toISOString() } };
  } catch (err) {
    if (err instanceof CommentError) {
      throw new V1Error(err.status, 'invalid_request', err.message);
    }
    throw err;
  }
}

// Flattened social library for a workspace: one entry per generated piece
// (text post / carousel / poster), previews only, newest first.
async function listSocials(user, workspaceId) {
  assertWorkspaceAccess(user, workspaceId);
  const snapshot = await db.collection('content_pipeline_library')
    .where('workspaceId', '==', workspaceId)
    .orderBy('createdAt', 'desc')
    .get();
  const entries = flattenSocialEntries(snapshot.docs).map((e) => ({
    ...e,
    generatedAt: e.generatedAt ? new Date(e.generatedAt).toISOString() : null,
  }));
  return { socials: entries };
}

// One social piece, full content. `format` defaults to text.
async function getSocial(user, itemId, channel, format) {
  const normChannel = String(channel || '').toLowerCase();
  const kind = String(format || 'text').toLowerCase();
  if (!SOCIAL_CHANNELS.includes(normChannel) || !SOCIAL_REVIEW_KINDS.includes(kind)) {
    throw new V1Error(400, 'invalid_request',
      `channel must be ${SOCIAL_CHANNELS.join(' or ')}; format must be ${SOCIAL_REVIEW_KINDS.join(', ')}`);
  }
  const doc = await loadItem(user, itemId);
  const val = doc.data().socials?.[socialKeyFor(normChannel, kind)];
  if (!val || typeof val !== 'object') {
    throw new V1Error(404, 'not_found', `No ${kind} content for ${normChannel} on this item`);
  }
  return { social: socialDetailOf(doc.id, normChannel, kind, val) };
}

// Generate social content for an item (article syndication, or idea
// development on a social-only item). Blocking — a single Loki call, minutes
// at worst — unlike article generation, which is a polled job. The result
// lands on the item as a reviewable draft; the workspace's persona/branding
// apply exactly as in the app.
async function generateSocial(user, itemId, body = {}) {
  const params = normalizeSocialGenParams(body);
  if (params.error) throw new V1Error(400, 'invalid_request', params.error);
  const doc = await loadItem(user, itemId);
  try {
    const result = await generateSocialContent({ user, doc, params, template: body.template });
    const { itemId: id, channel, format, ...payload } = result;
    return { social: { itemId: id, channel, format, ...payload, generatedAt: new Date().toISOString() } };
  } catch (err) {
    if (err instanceof SocialGenError) {
      const code = err.status === 422 ? 'conflict' : err.status === 429 ? 'rate_limited' : 'upstream';
      throw new V1Error(err.status, code, err.message);
    }
    console.error('[v1] Failed to generate social content:', err.response?.data?.detail || err.message);
    throw new V1Error(502, 'upstream', 'Social generation failed');
  }
}

module.exports = {
  V1Error,
  ITEM_STATUSES,
  SOCIAL_CHANNELS,
  SOCIAL_REVIEW_KINDS,
  listWorkspaces,
  submitGeneration,
  getJob,
  listItems,
  getItem,
  importArticle,
  finalizeItem,
  publishItem,
  listReviewers,
  submitItemReview,
  listComments,
  postItemComment,
  listSocials,
  getSocial,
  generateSocial,
};
