// The source registry: input normalization (incl. the legacy youtubeUrls
// alias), the context budget, stack signatures, composition labeling, and the
// url resolver's SSRF guard + extraction fallback. No live network — the url
// fetcher takes injected deps, and budget rules are exercised through the
// offline `text` type.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  normalizeSourceInputs,
  sourceSignature,
  resolveSources,
  composeSourceText,
  SourceError,
  MAX_SOURCE_CHARS,
  MAX_TOTAL_CHARS,
} = require('../lib/sources');
const { fetchArticleHtml, extractReadableText } = require('../lib/sources/url');

describe('normalizeSourceInputs', () => {
  it('maps legacy youtubeUrls (and single youtubeUrl) to youtube sources', () => {
    expect(normalizeSourceInputs({ youtubeUrls: ['https://youtu.be/a', 'https://youtu.be/b'] }).inputs)
      .toEqual([
        { type: 'youtube', url: 'https://youtu.be/a' },
        { type: 'youtube', url: 'https://youtu.be/b' },
      ]);
    expect(normalizeSourceInputs({ youtubeUrl: 'https://youtu.be/a' }).inputs)
      .toEqual([{ type: 'youtube', url: 'https://youtu.be/a' }]);
  });

  it('validates the sources array', () => {
    expect(normalizeSourceInputs({}).error).toMatch(/at least one source/i);
    expect(normalizeSourceInputs({ sources: [] }).error).toMatch(/at least one source/i);
    expect(normalizeSourceInputs({ sources: [{ type: 'tiktok', url: 'x' }] }).error).toMatch(/unsupported type/i);
    expect(normalizeSourceInputs({ sources: [{ type: 'url' }] }).error).toMatch(/url is required/i);
    expect(normalizeSourceInputs({ sources: [{ type: 'text', text: '   ' }] }).error).toMatch(/non-empty text/i);
    expect(normalizeSourceInputs({ sources: Array.from({ length: 11 }, () => ({ type: 'text', text: 'x' })) }).error)
      .toMatch(/maximum of 10/i);
  });

  it('accepts a mixed stack', () => {
    const { inputs } = normalizeSourceInputs({
      sources: [
        { type: 'youtube', url: 'https://youtu.be/a' },
        { type: 'url', url: 'https://example.com/post' },
        { type: 'text', text: 'notes', label: 'My notes' },
      ],
    });
    expect(inputs.map(s => s.type)).toEqual(['youtube', 'url', 'text']);
  });
});

describe('sourceSignature', () => {
  const yt = (u) => ({ type: 'youtube', url: u });
  it('is order-independent and content-sensitive', () => {
    expect(sourceSignature([yt('a'), yt('b')])).toBe(sourceSignature([yt('b'), yt('a')]));
    expect(sourceSignature([yt('a')])).not.toBe(sourceSignature([yt('b')]));
    expect(sourceSignature([{ type: 'text', text: 'one' }])).not.toBe(sourceSignature([{ type: 'text', text: 'two' }]));
  });
});

describe('budget enforcement (via the offline text type)', () => {
  it('hard-rejects a pasted source over the per-source cap', async () => {
    const big = 'x'.repeat(MAX_SOURCE_CHARS + 1);
    await expect(resolveSources([{ type: 'text', text: big }]))
      .rejects.toThrow(/over the 60,000 limit/i);
  });

  it('rejects when the total exceeds the overall budget, with a breakdown', async () => {
    const chunk = 'x'.repeat(MAX_SOURCE_CHARS);
    const inputs = Array.from({ length: 5 }, (_, i) => ({ type: 'text', text: chunk, label: `part ${i}` }));
    const err = await resolveSources(inputs).catch(e => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.message).toMatch(/total budget/i);
    expect(err.message).toContain('part 0');
  });

  it('resolves within budget, carrying titles and char counts', async () => {
    const sources = await resolveSources([
      { type: 'text', text: 'First line is the title\nand more', label: null },
      { type: 'text', text: 'second doc', label: 'Docs excerpt' },
    ]);
    expect(sources[0].title).toBe('First line is the title');
    expect(sources[1].title).toBe('Docs excerpt');
    expect(sources[1].chars).toBe('second doc'.length);
  });
});

describe('composeSourceText', () => {
  it('keeps a single source unlabeled', () => {
    expect(composeSourceText([{ type: 'text', title: 't', text: 'clean body' }])).toBe('clean body');
  });

  it('labels blends by position, type, and title', () => {
    const combined = composeSourceText([
      { type: 'youtube', title: 'Video A', text: 'AAA' },
      { type: 'url', title: 'Article B', text: 'BBB' },
    ]);
    expect(combined).toContain('=== SOURCE 1 (youtube): Video A ===');
    expect(combined).toContain('=== SOURCE 2 (url): Article B ===');
  });
});

describe('url resolver — SSRF guard (injected deps, no network)', () => {
  const publicLookup = async () => [{ address: '93.184.216.34' }];

  it('refuses http, weird ports, and private/metadata targets', async () => {
    await expect(fetchArticleHtml('http://example.com', { lookup: publicLookup })).rejects.toThrow(/https/i);
    await expect(fetchArticleHtml('https://example.com:8443/x', { lookup: publicLookup })).rejects.toThrow(/port/i);
    await expect(fetchArticleHtml('https://169.254.169.254/latest', { lookup: publicLookup })).rejects.toThrow(/disallowed/i);
    const privateLookup = async () => [{ address: '10.0.0.5' }];
    await expect(fetchArticleHtml('https://internal.example.com', { lookup: privateLookup })).rejects.toThrow(/disallowed/i);
  });

  it('re-validates every redirect hop instead of trusting follow', async () => {
    const fetchImpl = async (url) => {
      if (String(url).startsWith('https://public.example.com')) {
        return { status: 302, headers: new Headers({ location: 'https://internal.example.com/steal' }) };
      }
      throw new Error('should never fetch the internal hop');
    };
    const lookup = async (hostname) =>
      hostname === 'internal.example.com' ? [{ address: '192.168.1.1' }] : [{ address: '93.184.216.34' }];
    await expect(fetchArticleHtml('https://public.example.com/a', { lookup, fetchImpl }))
      .rejects.toThrow(/disallowed/i);
  });

  it('rejects non-HTML responses and returns HTML bodies', async () => {
    const page = '<html><head><title>Hi</title></head><body><article><p>Body text</p></article></body></html>';
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      arrayBuffer: async () => new TextEncoder().encode(page).buffer,
    });
    const { html } = await fetchArticleHtml('https://example.com/post', { lookup: publicLookup, fetchImpl });
    expect(html).toContain('Body text');

    const pdfImpl = async () => ({ status: 200, ok: true, headers: new Headers({ 'content-type': 'application/pdf' }) });
    await expect(fetchArticleHtml('https://example.com/file.pdf', { lookup: publicLookup, fetchImpl: pdfImpl }))
      .rejects.toThrow(/not an article page/i);
  });
});

describe('youtube title lookup (best-effort, never throws)', () => {
  const { fetchVideoTitle } = require('../lib/sources/youtube');

  it('returns the oEmbed title, and null for unavailable videos or errors', async () => {
    const ok = { get: async () => ({ status: 200, data: { title: 'A Real Video' } }) };
    expect(await fetchVideoTitle('https://youtu.be/abc', { http: ok })).toBe('A Real Video');

    const gone = { get: async () => ({ status: 404, data: {} }) };
    expect(await fetchVideoTitle('https://youtu.be/gone', { http: gone })).toBeNull();

    const boom = { get: async () => { throw new Error('network'); } };
    expect(await fetchVideoTitle('https://youtu.be/x', { http: boom })).toBeNull();
  });
});

describe('url resolver — text extraction', () => {
  it('strips chrome and pulls the article body', () => {
    const html = `<html><head><title>Page Title</title></head><body>
      <nav>Menu Menu</nav><script>var x=1</script>
      <article><h1>The Story</h1><p>${'Meaningful paragraph text. '.repeat(20)}</p></article>
      <footer>© corp</footer></body></html>`;
    const { title, text } = extractReadableText(html, 'https://example.com/story');
    expect(title.length).toBeGreaterThan(0);
    expect(text).toContain('Meaningful paragraph text.');
    expect(text).not.toContain('var x=1');
  });
});
