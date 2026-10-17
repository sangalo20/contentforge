// Review-target resolution and content-shape normalization shared by the
// social lifecycle routes (routes/socials.js) and the review workflow
// (routes/reviews.js). Pure functions plus two small request parsers.
//
// Lifecycle everywhere: draft -> finalized -> in_review -> approved ->
// published (articles). Request-changes returns content to draft.

// Normalize client-sent content into the persisted field shape for each kind.
const SOCIAL_CONTENT_FIELDS = {
  carousel: (content) => ({
    slides: Array.isArray(content.slides) ? content.slides.map(s => ({
      kind: s.kind || 'point',
      heading: s.heading || '',
      body: s.body || '',
    })) : [],
    cta: content.cta ?? null,
  }),
  poster: (content) => ({
    posterType: content.posterType || 'statement',
    stat: content.stat ?? null,
    headline: content.headline ?? null,
    subline: content.subline ?? null,
    cta: content.cta ?? null,
  }),
  // Text posts: LinkedIn carries `post` (string); X carries `thread` (array).
  // One is null depending on channel; both share `cta`.
  text: (content) => ({
    post: typeof content.post === 'string' ? content.post : null,
    thread: Array.isArray(content.thread) ? content.thread.map((t) => String(t)) : null,
    cta: content.cta ?? null,
  }),
};

// Text lives at socials.<channel>; carousels/posters at socials.<channel>_<kind>.
const socialKeyFor = (channel, kind) => (kind === 'text' ? channel : `${channel}_${kind}`);

function parseSocialReviewBody(req, res) {
  const { itemId, channel, kind } = req.body || {};
  const normChannel = String(channel || '').toLowerCase();
  const normKind = String(kind || '').toLowerCase();
  if (!itemId || !['linkedin', 'x'].includes(normChannel) || !SOCIAL_CONTENT_FIELDS[normKind]) {
    res.status(400).json({ error: 'itemId, a valid channel, and kind (carousel|poster|text) are required.' });
    return null;
  }
  return { itemId, channel: normChannel, kind: normKind, socialKey: socialKeyFor(normChannel, normKind) };
}

const REVIEW_KINDS = ['article', 'text', 'carousel', 'poster'];

// Resolve where a review target's status lives and what it currently is.
function resolveReviewTarget(item, kind, channel) {
  if (kind === 'article') {
    return { socialKey: null, status: item.status || 'draft', review: item.review || {} };
  }
  const socialKey = socialKeyFor(channel, kind);
  const saved = item.socials?.[socialKey];
  if (!saved) return null;
  return { socialKey, status: saved.status || 'approved', review: saved.review || {} };
}

function parseReviewBody(req, res) {
  const { itemId, kind = 'article', channel } = req.body || {};
  const normKind = String(kind).toLowerCase();
  const normChannel = String(channel || '').toLowerCase();
  if (!itemId || !REVIEW_KINDS.includes(normKind)) {
    res.status(400).json({ error: 'itemId and a valid kind (article|text|carousel|poster) are required.' });
    return null;
  }
  if (normKind !== 'article' && !['linkedin', 'x'].includes(normChannel)) {
    res.status(400).json({ error: `A valid channel is required for ${normKind} reviews.` });
    return null;
  }
  return { itemId, kind: normKind, channel: normKind === 'article' ? null : normChannel };
}

const reviewPieceLabel = (kind, channel) =>
  kind === 'article' ? 'article draft' : `${channel === 'x' ? 'X' : 'LinkedIn'} ${kind === 'text' ? 'post' : kind}`;

const reviewLinkFor = (workspaceId, itemId, kind, channel) => {
  if (!workspaceId) return null;
  return kind === 'article'
    ? `/workspace/${workspaceId}/library/item/${itemId}`
    : `/workspace/${workspaceId}/library/item/${itemId}/social/${channel}`;
};

const itemTitleOf = (item) => {
  if (item.draft) {
    const m = item.draft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m);
    if (m) return m[1].replace(/(\*\*|\*)/g, '').trim();
  }
  return item.title || (item.titles && item.titles[0]) || 'a draft';
};

module.exports = {
  SOCIAL_CONTENT_FIELDS,
  socialKeyFor,
  parseSocialReviewBody,
  REVIEW_KINDS,
  resolveReviewTarget,
  parseReviewBody,
  reviewPieceLabel,
  reviewLinkFor,
  itemTitleOf,
};
