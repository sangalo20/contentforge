// Social content shared by routes/socials.js and /api/v1: the Loki generation
// core (article syndication + original-idea development) and the Social
// Library flattener. Extracted so both surfaces run one implementation.
const axios = require('axios');
const { db, FieldValue } = require('./firebase');
const { getWorkspaces } = require('./workspacesStore');
const { odinRequestHeaders } = require('./odinClient');
const { isOriginalItem, socialSourceOf } = require('./socialSource');
const { log: logger } = require('../logger');

// A generation failure the caller maps to an HTTP status (message is user-safe).
class SocialGenError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Social generation is a blocking Loki call (real LLM spend, minutes at
// worst) with no job queue in front of it, so it carries the same
// per-instance concurrency cap pattern as v1 generation jobs (lib/jobs.js).
const maxActiveSocialGens = () => Number(process.env.MAX_ACTIVE_SOCIAL_GENERATIONS ?? 3);
let activeSocialGens = 0;

// Generate one piece of social content for a library item and persist it on
// the item's socials map as a reviewable draft. The caller has already
// validated params (lib/socialSource.normalizeSocialGenParams) and enforced
// workspace access. Returns { itemId, channel, ...payload }.
async function generateSocialContent(args) {
  const cap = maxActiveSocialGens();
  if (cap > 0 && activeSocialGens >= cap) {
    throw new SocialGenError(429,
      `Too many social generations are already running (limit ${cap}). Retry when one finishes.`);
  }
  activeSocialGens++;
  try {
    return await runSocialGeneration(args);
  } finally {
    activeSocialGens--;
  }
}

async function runSocialGeneration({ user, doc, params, template: requestedTemplate }) {
  const itemId = doc.id;
  const item = doc.data();
  const { channel: normChannel, fn: normFn, personaId, format } = params;

  // Article items syndicate their draft; original items develop the idea.
  const source = socialSourceOf(item);
  if (!source.text) {
    throw new SocialGenError(422, isOriginalItem(item)
      ? 'This item has no idea text to work from.'
      : 'This article has no draft to syndicate yet.');
  }

  // Resolve the persona prompt (WHO) from the workspace config, if one was chosen.
  // Also grab the workspace branding for carousel PDFs (design stays fixed in code).
  let personaPrompt = '';
  const workspace = getWorkspaces().find(w => w.id === item.workspaceId);
  if (personaId && workspace) {
    const persona = (workspace.socialPersonas || []).find(p => p.id === personaId);
    if (persona) personaPrompt = persona.prompt || '';
  }
  const brandName = workspace?.name || '';
  const accentColor = workspace?.theme || '#2563eb';
  // Carousel design template: explicit request choice > workspace default > global default.
  const template = requestedTemplate || workspace?.carouselTemplate || 'devfest';

  const isCarousel = /carousel/i.test(String(format || ''));
  const isPoster = !isCarousel && /poster|image/i.test(String(format || ''));

  const odinApiUrl = process.env.ODIN_API_URL || 'http://localhost:8000';
  const response = await axios.post(`${odinApiUrl}/api/v1/tasks/syndicate`, {
    draft: source.text,
    sourceType: source.type,
    channel: normChannel,
    personaPrompt,
    function: normFn,
    format: format || null,
    brandName,
    accentColor,
    template,
    // Carousels/posters come back as CONTENT for human review; nothing is
    // rendered or hardened until the reviewer approves (/api/socials/approve).
    draftOnly: isCarousel || isPoster,
  }, {
    headers: await odinRequestHeaders(odinApiUrl, user, { workspaceId: item.workspaceId, itemId }),
    timeout: 300000
  });

  if (!response.data || response.data.status !== 'success') {
    throw new Error(response.data?.detail || 'Odin returned an error');
  }

  const data = response.data.data || {};

  // Carousel path: Loki drafted slides; saved as a reviewable draft (no PDF yet).
  if (isCarousel || data.format === 'carousel') {
    const payload = {
      format: 'carousel',
      status: 'draft',
      slides: data.slides || [],
      cta: data.cta || null,
      fileId: null,
      template,
      brandName,
      function: normFn,
      personaId: personaId || null,
    };
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${normChannel}_carousel`]: { ...payload, generatedAt: FieldValue.serverTimestamp() }
    });
    logger.event('social.generated', { itemId, channel: normChannel, kind: 'carousel' });
    return { itemId, channel: normChannel, ...payload };
  }

  // Poster path: Loki drafted the poster content; saved as a reviewable draft.
  if (data.format === 'poster') {
    const payload = {
      format: 'poster',
      status: 'draft',
      posterType: data.poster_type || 'statement',
      stat: data.stat || null,
      headline: data.headline || null,
      subline: data.subline || null,
      cta: data.cta || null,
      fileId: null,
      template,
      brandName,
      function: normFn,
      personaId: personaId || null,
    };
    await db.collection('content_pipeline_library').doc(itemId).update({
      [`socials.${normChannel}_poster`]: { ...payload, generatedAt: FieldValue.serverTimestamp() }
    });
    logger.event('social.generated', { itemId, channel: normChannel, kind: 'poster' });
    return { itemId, channel: normChannel, ...payload };
  }

  // Loki returns a JSON string in `copy`; parse it so callers get structured data.
  const raw = data.copy;
  let copy;
  try {
    copy = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (parseErr) {
    console.error('Failed to parse Loki output:', parseErr, raw);
    throw new SocialGenError(502, 'Syndicator returned malformed output.');
  }

  // Text goes through the same review gate as PDFs: saved flattened as a
  // 'draft'. There's no render step for text — approval just flips the status.
  const textPayload = {
    format: 'text',
    status: 'draft',
    post: typeof copy.post === 'string' ? copy.post : null,
    thread: Array.isArray(copy.thread) ? copy.thread.map((t) => String(t)) : null,
    cta: copy.cta ?? null,
    function: normFn,
    personaId: personaId || null,
  };
  await db.collection('content_pipeline_library').doc(itemId).update({
    [`socials.${normChannel}`]: { ...textPayload, generatedAt: FieldValue.serverTimestamp() }
  });
  logger.event('social.generated', { itemId, channel: normChannel, kind: 'text' });
  return { itemId, channel: normChannel, ...textPayload };
}

const toMillis = (ts) => {
  if (ts && typeof ts.toMillis === 'function') return ts.toMillis();
  return ts?._seconds ? ts._seconds * 1000 : (ts?.seconds ? ts.seconds * 1000 : null);
};

const socialItemTitleOf = (item) => {
  // Original-idea items have no article draft; their title is the idea's
  // first line, set at compose time.
  if (!item.draft) return item.title || 'Untitled';
  const m = item.draft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m);
  return (m?.[1] || 'Untitled').replace(/(\*\*|\*)/g, '').trim();
};

// Flatten one item's socials map into per-piece entries (text post, carousel,
// poster), normalizing the legacy nested `copy` shape for text entries.
function socialEntriesOf(itemId, item) {
  const socials = item.socials || {};
  const articleTitle = socialItemTitleOf(item);
  const entries = [];
  for (const [key, val] of Object.entries(socials)) {
    if (!val || typeof val !== 'object') continue;
    let channel, type;
    if (key.endsWith('_carousel')) { channel = key.slice(0, -'_carousel'.length); type = 'carousel'; }
    else if (key.endsWith('_poster')) { channel = key.slice(0, -'_poster'.length); type = 'poster'; }
    else { channel = key; type = 'text'; }
    if (!['linkedin', 'x'].includes(channel)) continue;

    const base = {
      id: `${itemId}:${key}`,
      itemId,
      channel,
      type,
      articleTitle,
      sourceType: item.sourceType === 'original' ? 'original' : 'article',
      function: val.function || null,
      generatedAt: toMillis(val.generatedAt),
      archived: !!val.archived,
      approverEmail: val.review?.decidedByEmail || null,
    };
    if (type === 'poster') {
      entries.push({ ...base, status: val.status || 'approved', posterType: val.posterType || null, stat: val.stat || null, headline: val.headline || null, cta: val.cta || null, fileId: val.fileId || null });
    } else if (type === 'carousel') {
      entries.push({ ...base, status: val.status || 'approved', slideCount: Array.isArray(val.slides) ? val.slides.length : 0, cta: val.cta || null, fileId: val.fileId || null });
    } else {
      // Text: prefer the flattened shape (post/thread on val); fall back to the
      // legacy nested `copy` for entries generated before the review flow.
      const copy = val.copy || {};
      const post = val.post ?? copy.post;
      const thread = Array.isArray(val.thread) ? val.thread : (Array.isArray(copy.thread) ? copy.thread : null);
      const preview = Array.isArray(thread) ? thread[0] : (post || '');
      entries.push({ ...base, status: val.status || 'approved', preview: (preview || '').slice(0, 240), isThread: Array.isArray(thread), threadCount: Array.isArray(thread) ? thread.length : 0, hasImage: !!val.image });
    }
  }
  return entries;
}

// Flatten a workspace snapshot into one newest-first entry list.
function flattenSocialEntries(docs) {
  const entries = [];
  docs.forEach((doc) => entries.push(...socialEntriesOf(doc.id, doc.data())));
  entries.sort((a, b) => (b.generatedAt || 0) - (a.generatedAt || 0));
  return entries;
}

module.exports = { SocialGenError, generateSocialContent, socialEntriesOf, flattenSocialEntries };
