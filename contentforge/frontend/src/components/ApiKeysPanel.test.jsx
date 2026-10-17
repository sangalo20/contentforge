// The API Keys settings tab: listing keys, the one-time token reveal after
// minting (the panel's whole security story hangs on "shown once"), and
// revocation through the shared confirm dialog. Backend served by a
// route-keyed authFetch fake.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiKeysPanel from './ApiKeysPanel';

const ACTIVE_KEY = {
  id: 'k1',
  name: 'Sam workbench',
  display: 'cfk_abcd1234…wxyz',
  role: 'creator',
  workspaceAccess: ['ws1'],
  createdBy: 'a@x.com',
  createdAt: '2026-08-01T00:00:00.000Z',
  lastUsedAt: null,
  revokedAt: null,
};

const calls = [];
let keys = [];
const respond = (data) => Promise.resolve({ ok: true, json: async () => data });

vi.mock('../lib/api', () => ({
  API_BASE: '',
  authFetch: vi.fn((url, opts = {}) => {
    calls.push({ url, opts });
    if (url === '/api/api-keys' && (!opts.method || opts.method === 'GET')) return respond(keys);
    if (url === '/api/api-keys' && opts.method === 'POST') {
      return respond({ ...ACTIVE_KEY, id: 'k2', name: JSON.parse(opts.body).name, token: 'cfk_the-plaintext-token-shown-once' });
    }
    if (url.startsWith('/api/api-keys/') && opts.method === 'DELETE') return respond({ success: true });
    return respond({});
  }),
}));

const WORKSPACES = [{ id: 'ws1', name: 'Moguls' }, { id: 'ws2', name: 'Real Rep' }];

beforeEach(() => {
  calls.length = 0;
  keys = [];
});

describe('ApiKeysPanel', () => {
  it('shows the empty state, then lists active keys with scope labels', async () => {
    keys = [ACTIVE_KEY];
    render(<ApiKeysPanel workspaces={WORKSPACES} />);
    expect(await screen.findByText('Sam workbench')).toBeInTheDocument();
    expect(screen.getByText(/creator · Moguls/)).toBeInTheDocument();
  });

  it('mints a key and reveals the plaintext token exactly once', async () => {
    render(<ApiKeysPanel workspaces={WORKSPACES} />);
    await screen.findByText(/No API keys yet/);

    await userEvent.click(screen.getByRole('button', { name: /new key/i }));
    await userEvent.type(screen.getByLabelText('Name'), 'ci-bot');
    await userEvent.click(screen.getByRole('button', { name: /create key/i }));

    expect(await screen.findByText('cfk_the-plaintext-token-shown-once')).toBeInTheDocument();
    const post = calls.find((c) => c.opts.method === 'POST');
    // Default scope is "specific" with nothing picked — least privilege.
    expect(JSON.parse(post.opts.body)).toMatchObject({ name: 'ci-bot', role: 'creator', workspaceAccess: [] });

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText('cfk_the-plaintext-token-shown-once')).not.toBeInTheDocument();
  });

  it('revokes through the confirm dialog', async () => {
    keys = [ACTIVE_KEY];
    render(<ApiKeysPanel workspaces={WORKSPACES} />);
    await screen.findByText('Sam workbench');

    await userEvent.click(screen.getByRole('button', { name: /revoke/i }));
    await userEvent.click(screen.getByRole('button', { name: /revoke key/i }));

    expect(calls.some((c) => c.url === '/api/api-keys/k1' && c.opts.method === 'DELETE')).toBe(true);
  });
});
