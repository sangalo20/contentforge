// The source registry: every way content can enter the forge, behind one
// contract. A resolver takes a raw input ({ type, url?, text?, label? }) and
// returns { title, text, meta? }; this module owns input normalization, the
// context budget, and composing the resolved sources into the single labeled
// text blob Oscar already knows how to blend.
//
// Budget policy (docs/proposals/multi-source-architecture.md):
// - Pasted sources (text) hard-reject over MAX_SOURCE_CHARS — the user can
//   trim or split what they pasted.
// - Fetched url sources are truncated at MAX_SOURCE_CHARS with a visible
//   marker and a warning stage — never silently.
// - YouTube transcripts are exempt from the per-source cap (hour-plus videos
//   are the forge's bread and butter and predate the cap); the TOTAL cap
//   still bounds them.
// - The total across all sources hard-rejects over MAX_TOTAL_CHARS, with a
//   per-source breakdown so the user knows what to drop.
const crypto = require('crypto');
const youtube = require('./youtube');
const url = require('./url');
const text = require('./text');
const github = require('./github');
const code = require('./code');
const vault = require('./vault');

const MAX_SOURCE_CHARS = 60_000;
const MAX_TOTAL_CHARS = 240_000;

// type -> { resolve(input, ctx), capExempt?, truncateOverCap? }
const SOURCE_TYPES = {
  youtube: { resolve: youtube.resolve, capExempt: true },
  url: { resolve: url.resolve, truncateOverCap: true },
  text: { resolve: text.resolve },
  github: { resolve: github.resolve, truncateOverCap: true },
  code: { resolve: code.resolve },
  // Vault entries are previously-ingested transcripts — same cap exemption.
  vault: { resolve: vault.resolve, capExempt: true },
};

// A user-safe validation/resolution failure (message is shown verbatim).
class SourceError extends Error {}

// Normalize the request body into a clean list of source inputs.
// Accepts `sources: [{ type, ... }]`; legacy `youtubeUrls` / `youtubeUrl`
// map to youtube sources so existing clients keep working unchanged.
// Returns { inputs } or { error }.
function normalizeSourceInputs(body = {}) {
  let raw = body.sources;
  if (!raw) {
    const urls = body.youtubeUrls || (body.youtubeUrl ? [body.youtubeUrl] : null);
    if (Array.isArray(urls)) raw = urls.map((u) => ({ type: 'youtube', url: u }));
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: 'At least one source is required (sources array, or legacy youtubeUrls).' };
  }
  if (raw.length > 10) return { error: 'A maximum of 10 sources per item is supported.' };

  const inputs = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i] || {};
    const type = String(s.type || '').toLowerCase();
    if (!SOURCE_TYPES[type]) {
      return { error: `Source ${i + 1}: unsupported type "${s.type}". Supported: ${Object.keys(SOURCE_TYPES).join(', ')}.` };
    }
    if (type === 'vault') {
      const vaultId = String(s.vaultId || '').trim();
      if (!vaultId) return { error: `Source ${i + 1} (vault): a vaultId is required.` };
      inputs.push({ type, vaultId });
    } else if (type === 'youtube' || type === 'url' || type === 'github') {
      const u = String(s.url || '').trim();
      if (!u) return { error: `Source ${i + 1} (${type}): a url is required.` };
      const input = { type, url: u };
      if (type === 'github' && s.paths !== undefined) {
        if (!Array.isArray(s.paths)) return { error: `Source ${i + 1} (github): paths must be an array of file paths.` };
        const paths = s.paths.map((p) => String(p).trim()).filter(Boolean);
        if (paths.length > 10) return { error: `Source ${i + 1} (github): pick at most 10 files.` };
        // Repo-relative paths only — no traversal, no absolute paths.
        if (paths.some((p) => p.startsWith('/') || p.includes('..') || p.length > 300)) {
          return { error: `Source ${i + 1} (github): file paths must be repo-relative (no leading / or ..).` };
        }
        if (paths.length) input.paths = paths;
      }
      inputs.push(input);
    } else {
      const body = String(s.text || '');
      if (!body.trim()) return { error: `Source ${i + 1} (${type}): non-empty text is required.` };
      const input = { type, text: body, label: String(s.label || '').trim() || null };
      if (type === 'code') {
        const language = String(s.language || '').trim();
        if (language) input.language = language;
      }
      inputs.push(input);
    }
  }
  return { inputs };
}

// Stable identity for a source stack, for exact-duplicate detection: URLs by
// value, vault entries by id, pasted text by content hash, order-independent.
function sourceSignature(inputs) {
  const keys = inputs.map((s) => {
    if (s.vaultId) return `${s.type}:${s.vaultId}`;
    if (s.url) return `${s.type}:${s.url}`;
    return `${s.type}:${crypto.createHash('sha256').update(s.text).digest('hex')}`;
  });
  return crypto.createHash('sha256').update(JSON.stringify(keys.sort())).digest('hex');
}

const labelOf = (s, i) => s.title || s.label || s.url || `source ${i + 1}`;

// Resolve every input through its type's resolver and enforce the budget.
// ctx: { db, stage(message, level) } — stage is optional (blocking route).
// Returns [{ type, url?, label?, title, text, chars, truncated? }].
// Throws SourceError with a user-safe message on any failure.
async function resolveSources(inputs, ctx = {}) {
  const stage = ctx.stage || (() => {});
  const resolved = [];
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const spec = SOURCE_TYPES[input.type];
    const n = inputs.length > 1 ? ` ${i + 1}/${inputs.length}` : '';
    let out;
    try {
      out = await spec.resolve(input, { ...ctx, stage, position: n });
    } catch (err) {
      throw new SourceError(`Source ${i + 1} (${input.type}): ${err.message}`);
    }
    let body = out.text || '';
    let truncated = false;
    if (body.length > MAX_SOURCE_CHARS && !spec.capExempt) {
      if (spec.truncateOverCap) {
        body = `${body.slice(0, MAX_SOURCE_CHARS)}\n\n[Source truncated at ${MAX_SOURCE_CHARS.toLocaleString('en-US')} characters]`;
        truncated = true;
        stage(`Source${n} exceeded the per-source budget and was truncated at ${MAX_SOURCE_CHARS.toLocaleString('en-US')} characters.`, 'warn');
      } else {
        throw new SourceError(
          `Source ${i + 1} (${input.type}) is ${body.length.toLocaleString('en-US')} characters — over the ${MAX_SOURCE_CHARS.toLocaleString('en-US')} limit. Trim it or split it into separate sources.`
        );
      }
    }
    resolved.push({
      type: input.type,
      ...(input.url ? { url: input.url } : {}),
      ...(input.vaultId ? { vaultId: input.vaultId } : {}),
      ...(input.label ? { label: input.label } : {}),
      ...(input.language ? { language: input.language } : {}),
      ...(input.paths ? { paths: input.paths } : {}),
      title: out.title || input.label || 'Untitled source',
      text: body,
      chars: body.length,
      ...(truncated ? { truncated: true } : {}),
    });
  }

  const total = resolved.reduce((sum, s) => sum + s.chars, 0);
  if (total > MAX_TOTAL_CHARS) {
    const breakdown = resolved.map((s, i) => `${labelOf(s, i)}: ${s.chars.toLocaleString('en-US')}`).join(', ');
    throw new SourceError(
      `The combined sources are ${total.toLocaleString('en-US')} characters — over the ${MAX_TOTAL_CHARS.toLocaleString('en-US')} total budget. Drop or shorten a source (${breakdown}).`
    );
  }
  return resolved;
}

// The single text blob Oscar consumes. One source stays clean (no stray
// '=== SOURCE 1 ===' marker leaking into the draft); blends are labeled by
// position, type, and title — the same convention the multi-video pipeline
// has always used, now typed. Code bodies are fenced so the model reads them
// as code, never as prose to imitate.
const bodyOf = (s) =>
  s.type === 'code' ? `\`\`\`${s.language || ''}\n${s.text}\n\`\`\`` : s.text;

function composeSourceText(sources) {
  if (sources.length === 1) return bodyOf(sources[0]);
  return sources
    .map((s, i) => `\n\n=== SOURCE ${i + 1} (${s.type}): ${s.title} ===\n${bodyOf(s)}`)
    .join('');
}

module.exports = {
  SOURCE_TYPES,
  MAX_SOURCE_CHARS,
  MAX_TOTAL_CHARS,
  SourceError,
  normalizeSourceInputs,
  sourceSignature,
  resolveSources,
  composeSourceText,
};
