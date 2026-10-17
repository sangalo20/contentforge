// The github and code source types (Phase 2): repo URL parsing, README+docs
// assembly against a mocked GitHub API, hand-picked paths, friendly API
// errors, input validation, and code fencing in composition. No network.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeSourceInputs, resolveSources, composeSourceText } = require('../lib/sources');
const { parseRepoUrl, resolve: resolveGithub } = require('../lib/sources/github');

describe('parseRepoUrl', () => {
  it('parses owner/repo, .git suffixes, and pinned refs', () => {
    expect(parseRepoUrl('https://github.com/acme/widget')).toEqual({ owner: 'acme', repo: 'widget', ref: null });
    expect(parseRepoUrl('https://github.com/acme/widget.git')).toEqual({ owner: 'acme', repo: 'widget', ref: null });
    expect(parseRepoUrl('https://github.com/acme/widget/tree/v2')).toEqual({ owner: 'acme', repo: 'widget', ref: 'v2' });
  });

  it('rejects non-github hosts and non-repo paths', () => {
    expect(() => parseRepoUrl('https://gitlab.com/acme/widget')).toThrow(/github\.com/);
    expect(() => parseRepoUrl('https://github.com/acme')).toThrow(/owner\/repo/);
    expect(() => parseRepoUrl('not a url')).toThrow(/invalid/i);
  });
});

// Minimal fake GitHub API keyed by URL substring.
function fakeGithub(files, { repoStatus = 200 } = {}) {
  return {
    get: async (u) => {
      if (/\/repos\/acme\/widget$/.test(u)) {
        return { status: repoStatus, data: { default_branch: 'main', description: 'A widget maker' } };
      }
      if (u.includes('/readme')) {
        return 'README' in files ? { status: 200, data: files.README } : { status: 404, data: {} };
      }
      if (u.includes('/git/trees/')) {
        return {
          status: 200,
          data: { tree: Object.keys(files).filter((p) => p !== 'README').map((path) => ({ path, type: 'blob' })) },
        };
      }
      const m = u.match(/\/contents\/([^?]+)/);
      const path = m && decodeURIComponent(m[1]);
      return path in files ? { status: 200, data: files[path] } : { status: 404, data: {} };
    },
  };
}

describe('github resolver (mocked API)', () => {
  it('assembles description, README, docs tree, and picked files', async () => {
    const http = fakeGithub({
      README: '# Widget\nThe widget maker.',
      'docs/setup.md': 'How to set it up.',
      'docs/usage.md': 'How to use it.',
      'src/widget.py': 'def make(): pass',
    });
    const out = await resolveGithub(
      { url: 'https://github.com/acme/widget', paths: ['src/widget.py'] },
      { deps: { http, token: null } }
    );
    expect(out.title).toBe('acme/widget');
    expect(out.text).toContain('## About\n\nA widget maker');
    expect(out.text).toContain('## README');
    expect(out.text).toContain('## docs/setup.md');
    expect(out.text).toContain('## docs/usage.md');
    expect(out.text).toContain('## src/widget.py');
    expect(out.text).toContain('def make(): pass');
  });

  it('only auto-includes documentation files from docs/', async () => {
    const http = fakeGithub({
      README: '# W',
      'docs/guide.md': 'guide',
      'docs/diagram.png': 'binary!',
      'src/secret.js': 'code',
    });
    const out = await resolveGithub({ url: 'https://github.com/acme/widget' }, { deps: { http, token: null } });
    expect(out.text).toContain('docs/guide.md');
    expect(out.text).not.toContain('diagram.png');
    expect(out.text).not.toContain('src/secret.js');
  });

  it('fails with a friendly message on missing repos and picked files', async () => {
    await expect(
      resolveGithub({ url: 'https://github.com/acme/widget' }, { deps: { http: fakeGithub({}, { repoStatus: 404 }), token: null } })
    ).rejects.toThrow(/not found.*Settings → Integrations/i);

    const http = fakeGithub({ README: '# W' });
    await expect(
      resolveGithub({ url: 'https://github.com/acme/widget', paths: ['nope.md'] }, { deps: { http, token: null } })
    ).rejects.toThrow(/"nope\.md" not found/i);
  });
});

describe('github + code input validation', () => {
  it('validates github paths', () => {
    const base = { type: 'github', url: 'https://github.com/a/b' };
    expect(normalizeSourceInputs({ sources: [{ ...base, paths: 'src/x.py' }] }).error).toMatch(/array/i);
    expect(normalizeSourceInputs({ sources: [{ ...base, paths: ['../etc/passwd'] }] }).error).toMatch(/repo-relative/i);
    expect(normalizeSourceInputs({ sources: [{ ...base, paths: ['/abs.md'] }] }).error).toMatch(/repo-relative/i);
    expect(normalizeSourceInputs({ sources: [{ ...base, paths: ['src/x.py', ' docs/y.md '] }] }).inputs[0].paths)
      .toEqual(['src/x.py', 'docs/y.md']);
  });

  it('accepts code with language and requires text', () => {
    expect(normalizeSourceInputs({ sources: [{ type: 'code', text: '' }] }).error).toMatch(/non-empty text/i);
    const { inputs } = normalizeSourceInputs({ sources: [{ type: 'code', text: 'x = 1', language: 'python', label: 'calc.py' }] });
    expect(inputs[0]).toEqual({ type: 'code', text: 'x = 1', label: 'calc.py', language: 'python' });
  });
});

describe('code composition', () => {
  it('fences code bodies with the language, single and blended', async () => {
    const single = await resolveSources([{ type: 'code', text: 'x = 1', language: 'python', label: 'calc.py' }]);
    expect(composeSourceText(single)).toBe('```python\nx = 1\n```');

    const blend = await resolveSources([
      { type: 'text', text: 'Some prose notes.' },
      { type: 'code', text: 'y = 2', language: 'js', label: 'two.js' },
    ]);
    const combined = composeSourceText(blend);
    expect(combined).toContain('=== SOURCE 2 (code): two.js ===');
    expect(combined).toContain('```js\ny = 2\n```');
  });
});
