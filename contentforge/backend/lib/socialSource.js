// Where social generation reads its source from. Two kinds of library item
// feed Loki: article items (the YouTube pipeline) syndicate their generated
// draft; original items (composed in the social studio from a creator's own
// idea, sourceType 'original') develop the idea brief itself. Routes own the
// persistence; the source resolution and request validation live here so they
// can be unit-tested.

const SOCIAL_CHANNELS = ['linkedin', 'x'];
const SOCIAL_FUNCTIONS = ['teach', 'sell', 'entertain', 'inspire'];
const IDEA_MAX_LENGTH = 5000;

const isOriginalItem = (item) => item?.sourceType === 'original';

// The text Loki grounds on and the label Odin uses to pick the prompt framing.
const socialSourceOf = (item) => (isOriginalItem(item)
  ? { type: 'idea', text: (item.idea || '').trim() }
  : { type: 'article', text: item?.draft || '' });

// First line of the idea, capped — the item's display title everywhere an
// article item would show its H1.
const ideaTitleOf = (idea) => {
  const first = String(idea || '').trim().split('\n')[0].trim();
  if (!first) return 'Untitled idea';
  return first.length > 80 ? `${first.slice(0, 77)}...` : first;
};

// Validate the generation levers shared by /api/generate-socials and
// /api/socials/compose. Returns { error } or the normalized params.
const normalizeSocialGenParams = ({ channel = 'linkedin', function: fn = 'teach', format, personaId } = {}) => {
  const normChannel = String(channel).toLowerCase();
  if (!SOCIAL_CHANNELS.includes(normChannel)) return { error: `Unsupported channel: ${channel}` };
  const normFn = String(fn).toLowerCase();
  if (!SOCIAL_FUNCTIONS.includes(normFn)) return { error: `Unsupported function: ${fn}` };
  return { channel: normChannel, fn: normFn, format: format || null, personaId: personaId || null };
};

// Validate the idea text for compose. Returns { error } or { idea, title }.
const normalizeIdea = (idea) => {
  if (typeof idea !== 'string' || !idea.trim()) return { error: 'A non-empty idea is required.' };
  const trimmed = idea.trim();
  if (trimmed.length > IDEA_MAX_LENGTH) {
    return { error: `Keep the idea under ${IDEA_MAX_LENGTH.toLocaleString('en-US')} characters.` };
  }
  return { idea: trimmed, title: ideaTitleOf(trimmed) };
};

module.exports = {
  SOCIAL_CHANNELS,
  SOCIAL_FUNCTIONS,
  IDEA_MAX_LENGTH,
  isOriginalItem,
  socialSourceOf,
  ideaTitleOf,
  normalizeSocialGenParams,
  normalizeIdea,
};
