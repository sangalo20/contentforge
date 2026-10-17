// Web-article source resolver: SSRF-guarded fetch + readable-text extraction.
// The URL is attacker-controllable (any authenticated user), so this reuses
// the same defenses as lib/ssrf.js: https only, no literal or resolved
// private/metadata IPs — and because articles commonly redirect, redirects
// are followed MANUALLY (max 3 hops) with every hop re-validated instead of
// trusting fetch's follow mode.
const dns = require('dns').promises;
const { isPrivateIp } = require('../ssrf');

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // article pages, not downloads
const FETCH_TIMEOUT_MS = 20_000;

async function assertPublicHost(url, lookup) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const net = require('net');
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('URL resolves to a disallowed address.');
  }
  const resolved = await lookup(hostname, { all: true });
  if (resolved.some(r => isPrivateIp(r.address))) {
    throw new Error('URL resolves to a disallowed address.');
  }
}

// deps injectable for tests: { lookup, fetchImpl }.
async function fetchArticleHtml(rawUrl, deps = {}) {
  const { lookup = dns.lookup, fetchImpl = fetch } = deps;
  let current;
  try {
    current = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL.');
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (current.protocol !== 'https:') throw new Error('Only https URLs are supported.');
    if (current.port && current.port !== '443') throw new Error('Unexpected port on URL.');
    await assertPublicHost(current, lookup);

    const res = await fetchImpl(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'ContentForge/1.0 (+article ingestion)', Accept: 'text/html' },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error(`Redirect without a location (HTTP ${res.status}).`);
      current = new URL(location, current); // relative redirects resolve against the hop
      continue;
    }
    if (!res.ok) throw new Error(`The page returned HTTP ${res.status}.`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error(`The URL returned ${contentType || 'an unknown content type'}, not an article page.`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_RESPONSE_BYTES) throw new Error('The page is too large to ingest.');
    return { html: buf.toString('utf8'), finalUrl: current.toString() };
  }
  throw new Error('Too many redirects.');
}

// Readability-first extraction with a plain-text fallback. jsdom is already a
// backend dependency; both imports stay lazy so cold paths don't pay for them.
function extractReadableText(html, pageUrl) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(html, { url: pageUrl });
  try {
    const { Readability } = require('@mozilla/readability');
    const article = new Readability(dom.window.document).parse();
    if (article && article.textContent && article.textContent.trim().length > 200) {
      return { title: article.title || dom.window.document.title || '', text: article.textContent.trim() };
    }
  } catch {
    // fall through to the plain-text fallback
  }
  const doc = dom.window.document;
  for (const el of doc.querySelectorAll('script, style, nav, header, footer, aside, noscript')) el.remove();
  const main = doc.querySelector('article') || doc.querySelector('main') || doc.body;
  const text = (main?.textContent || '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
  return { title: doc.title || '', text };
}

// ctx: { stage, position }.
async function resolve({ url }, ctx = {}) {
  const stage = ctx.stage || (() => {});
  const n = ctx.position || '';
  stage(`Fetching article${n} from ${new URL(url).hostname}...`);
  const { html, finalUrl } = await fetchArticleHtml(url, ctx.deps);
  const { title, text } = extractReadableText(html, finalUrl);
  if (!text || text.length < 200) {
    throw new Error('Could not extract readable article text from this page (it may be paywalled or script-rendered). Paste the text instead.');
  }
  stage(`Article extracted (${text.length.toLocaleString('en-US')} characters).`, 'success');
  return { title: title || url, text };
}

module.exports = { resolve, fetchArticleHtml, extractReadableText };
