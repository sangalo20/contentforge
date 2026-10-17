// The Source Composer: stacking mixed sources (YouTube / web article / pasted
// text), the pasted-character budget meter, remove-with-confirm, and the
// sources payload sent to the streaming pipeline.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { authFetch } from '../lib/api';
import PipelineTrigger from './PipelineTrigger';

const WORKSPACES = [{ id: 'ws1', name: 'Workspace One', destination: 'Markdown', theme: '#2563eb' }];

vi.mock('../lib/api', () => ({
  API_BASE: '',
  authFetch: vi.fn((url, options = {}) => {
    if (options.method === 'POST') {
      if (String(url).includes('/api/vault/scout/stream')) {
        // One proposal event, then done — exercises the full scout flow.
        const payload = 'data: ' + JSON.stringify({
          type: 'proposal',
          content: {
            picks: [{ vaultId: 'v1', title: 'Day 019 - The Feasibility Study', reason: 'untouched section' }],
            angle: 'the gatekeeper of every deal',
            workingTitle: 'The Study That Saves You',
          },
        }) + '\n\n';
        let sent = false;
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: async () => (sent ? { done: true } : ((sent = true), { done: false, value: new TextEncoder().encode(payload) })),
            }),
          },
        });
      }
      // Minimal SSE stream that ends immediately; tests assert payloads/UI.
      return Promise.resolve({
        ok: true,
        body: { getReader: () => ({ read: async () => ({ done: true }) }) },
      });
    }
    if (String(url).includes('/api/vault?')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          entries: [
            { id: 'v1', title: 'Day 019', group: 'S2', chars: 9000, usedIn: [] },
            { id: 'v2', title: 'EP06', group: 'Idiots', chars: 40000, usedIn: [{ workspaceId: 'other', title: 'X' }] },
          ],
          channels: [], lastSyncAt: null, syncStale: false,
        }),
      });
    }
    if (String(url).includes('/api/workspaces')) {
      return Promise.resolve({ ok: true, json: async () => WORKSPACES });
    }
    if (String(url).includes('/api/sources/youtube-title')) {
      const used = String(url).includes('usedvid');
      return Promise.resolve({
        ok: true,
        json: async () => ({
          title: 'How Storage Deals Die',
          usedIn: used ? [{ title: 'Old Article', date: '2026-05' }] : [],
        }),
      });
    }
    if (String(url).includes('/api/github/repos')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          configured: true,
          repos: [
            { fullName: 'acme/widget-maker', url: 'https://github.com/acme/widget-maker', private: true, description: null, pushedAt: null },
            { fullName: 'acme/other-thing', url: 'https://github.com/acme/other-thing', private: false, description: null, pushedAt: null },
          ],
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => [] }); // history
  }),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/workspace/ws1/generate']}>
    <Routes>
      <Route path="/workspace/:id/generate" element={<PipelineTrigger />} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom has no scrollIntoView; the log panel auto-scrolls on new stages.
  Element.prototype.scrollIntoView = vi.fn();
});

describe('PipelineTrigger (Source Composer)', () => {
  it('starts empty — no presumed source type — with generate disabled', async () => {
    renderPage();
    expect(await screen.findByText(/What are you starting from\?/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/youtube\.com\/watch/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Content/ })).toBeDisabled();
  });

  it('stacks mixed sources and sends them as the sources payload', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /YouTube/ }));
    await userEvent.type(screen.getByPlaceholderText(/youtube\.com\/watch/), 'https://youtu.be/abc');

    await userEvent.click(screen.getByRole('button', { name: /Web article/ }));
    await userEvent.type(screen.getByPlaceholderText(/example\.com\/article/), 'https://blog.example/post');

    await userEvent.click(screen.getByRole('button', { name: /Paste text/ }));
    await userEvent.type(screen.getByPlaceholderText(/Paste an article/), 'my pasted notes');

    // The pasted-character meter appears once text sources hold content.
    expect(screen.getByText(/characters pasted/)).toBeInTheDocument();

    const generate = screen.getByRole('button', { name: /Generate Content \(3 sources\)/ });
    expect(generate).toBeEnabled();
    await userEvent.click(generate);

    expect(authFetch).toHaveBeenCalledWith('/api/generate/content/stream', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        sources: [
          { type: 'youtube', url: 'https://youtu.be/abc' },
          { type: 'url', url: 'https://blog.example/post' },
          { type: 'text', text: 'my pasted notes' },
        ],
        workspaceId: 'ws1',
      }),
    }));
  });

  it('stacks GitHub and code sources with their extra fields', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /GitHub repo/ }));
    await userEvent.type(screen.getByPlaceholderText(/github\.com\/owner\/repo/), 'https://github.com/acme/widget');
    await userEvent.type(screen.getByPlaceholderText(/Specific files/), 'src/api.py, docs/x.md');

    await userEvent.click(screen.getByRole('button', { name: /^Code/ }));
    await userEvent.type(screen.getByPlaceholderText('Paste the code...'), 'x = 1');
    await userEvent.type(screen.getByPlaceholderText('Language'), 'python');

    await userEvent.click(screen.getByRole('button', { name: /Generate Content \(2 sources\)/ }));
    expect(authFetch).toHaveBeenCalledWith('/api/generate/content/stream', expect.objectContaining({
      body: JSON.stringify({
        sources: [
          { type: 'github', url: 'https://github.com/acme/widget', paths: ['src/api.py', 'docs/x.md'] },
          { type: 'code', text: 'x = 1', language: 'python' },
        ],
        workspaceId: 'ws1',
      }),
    }));
  });

  it('resolves YouTube titles on blur and flags obvious URL typos', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /YouTube/ }));
    const input = screen.getByPlaceholderText(/youtube\.com\/watch/);

    // A wrong-host URL is flagged advisorily.
    await userEvent.type(input, 'https://vimeo.com/123');
    await userEvent.tab();
    expect(screen.getByText('Expected a YouTube link.')).toBeInTheDocument();

    // A real YouTube URL clears the error and resolves its title.
    await userEvent.clear(input);
    await userEvent.type(input, 'https://youtu.be/abc123');
    await userEvent.tab();
    expect(screen.queryByText('Expected a YouTube link.')).not.toBeInTheDocument();
    expect(await screen.findByText(/How Storage Deals Die/)).toBeInTheDocument();
  });

  it('warns when a pasted YouTube URL already fed published content', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /YouTube/ }));
    const input = screen.getByPlaceholderText(/youtube\.com\/watch/);
    await userEvent.type(input, 'https://youtu.be/usedvid');
    await userEvent.tab();
    expect(await screen.findByText(/Already used in “Old Article” \(2026-05\)/)).toBeInTheDocument();
  });

  it('scout proposal → "Use these" → vault cards render and ship vaultIds', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /YouTube/ }));
    // Both mock entries are unused in THIS workspace (ws1).
    await userEvent.click(await screen.findByRole('button', { name: /Scout the vault — 2 unused transcripts/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Scout the vault' }));

    // The mocked stream emits one proposal; accept it.
    await userEvent.click(await dialog.findByRole('button', { name: /Use these source/ }));

    // The dialog closes and the pick renders as a vault card (regression: this
    // crashed when SOURCE_KINDS lost its vault entry).
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Day 019 - The Feasibility Study/)).toBeInTheDocument();
    expect(screen.getAllByText(/From the vault/).length).toBeGreaterThan(0);

    // The scout's editorial direction rides along: banner + payload.
    expect(screen.getByText('Editorial direction')).toBeInTheDocument();
    expect(screen.getByText('The Study That Saves You')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Generate Content/ }));
    expect(authFetch).toHaveBeenCalledWith('/api/generate/content/stream', expect.objectContaining({
      body: JSON.stringify({
        brief: { angle: 'the gatekeeper of every deal', workingTitle: 'The Study That Saves You' },
        sources: [{ type: 'vault', vaultId: 'v1' }],
        workspaceId: 'ws1',
      }),
    }));
  });

  it('the GitHub card offers a repo picker that fills the URL', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /GitHub repo/ }));

    const search = await screen.findByPlaceholderText(/Search your 2 repos/);
    await userEvent.type(search, 'widget');
    const suggestion = await screen.findByRole('button', { name: /acme\/widget-maker/ });
    expect(suggestion).toHaveTextContent('private');
    await userEvent.click(suggestion);

    expect(screen.getByPlaceholderText(/github\.com\/owner\/repo/)).toHaveValue('https://github.com/acme/widget-maker');
    // Selection collapses the suggestion list.
    expect(screen.queryByRole('button', { name: /acme\/widget-maker/ })).not.toBeInTheDocument();
  });

  it('removing a filled source asks for confirmation; an empty one removes directly', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /YouTube/ }));
    await userEvent.type(screen.getByPlaceholderText(/youtube\.com\/watch/), 'https://youtu.be/abc');
    await userEvent.click(screen.getByRole('button', { name: /Paste text/ }));

    // Empty pasted source: no dialog, gone immediately.
    await userEvent.click(screen.getByLabelText('Remove source 2'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Paste an article/)).not.toBeInTheDocument();

    // Filled YouTube source: confirm dialog first, then removal.
    await userEvent.click(screen.getByLabelText('Remove source 1'));
    const dialog = within(screen.getByRole('dialog', { name: 'Remove this source?' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Remove source' }));
    expect(screen.queryByPlaceholderText(/youtube\.com\/watch/)).not.toBeInTheDocument();
  });
});
