// The original-idea compose flow on the social studio page: the source-mode
// cards, the idea textarea, and the POST to /api/socials/compose followed by
// navigation to the freshly created item. Heavy children (studio chat, image
// chat, review modal) are stubbed; the page's data loads are served by a
// route-keyed authFetch fake.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SocialMediaSyndication from './SocialMediaSyndication';

const WORKSPACES = [{
  id: 'ws1',
  name: 'Test Workspace',
  theme: '#2563eb',
  socialPersonas: [{ id: 'p1', name: 'Joe', prompt: 'be joe', channels: ['linkedin', 'x'] }],
}];

const COMPOSED_ITEM = {
  id: 'item9',
  workspaceId: 'ws1',
  sourceType: 'original',
  idea: 'storage deals die in due diligence',
  title: 'storage deals die in due diligence',
  socials: {
    linkedin: { post: 'the drafted post', status: 'draft', function: 'teach', generatedAt: { _seconds: 1752900000 } },
  },
};

// Route-keyed fake backend. Tests read `calls` to assert on requests.
const calls = [];
const respond = (data) => Promise.resolve({ ok: true, json: async () => data });

vi.mock('../lib/api', () => ({
  API_BASE: '',
  authFetch: vi.fn((url, opts = {}) => {
    calls.push({ url, opts });
    if (url === '/api/workspaces') return respond(WORKSPACES);
    if (url === '/api/carousel/templates') return respond({ templates: [] });
    if (url === '/api/library/ws1') return respond([]);
    if (url === '/api/socials/compose') {
      return respond({ itemId: 'item9', channel: 'linkedin', format: 'text', status: 'draft', post: 'the drafted post', thread: null, cta: null });
    }
    if (url === '/api/library/item/item9') return respond(COMPOSED_ITEM);
    return respond({});
  }),
}));

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ canReview: () => false, isAdmin: false, user: { uid: 'u1' } }),
}));
vi.mock('../components/StudioChat', () => ({ default: () => null }));
vi.mock('../components/ImageChatModal', () => ({ default: () => null }));
vi.mock('../components/SubmitReviewModal', () => ({ default: () => null }));

const renderPage = (initialEntry = '/workspace/ws1/social/linkedin') => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <Routes>
      <Route path="/workspace/:id/social/:channel?" element={<SocialMediaSyndication />} />
      <Route path="/workspace/:id/library/item/:itemId/social/:channel?" element={<SocialMediaSyndication />} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => { calls.length = 0; vi.clearAllMocks(); });

describe('source mode selection', () => {
  it('offers both source cards, article mode first', async () => {
    renderPage();
    expect(await screen.findByText('From an article')).toBeInTheDocument();
    expect(screen.getByText('From an original idea')).toBeInTheDocument();
    // Article mode leads: the source dropdown shows, the idea box does not.
    expect(screen.getByText(/Choose an article to syndicate/)).toBeInTheDocument();
    expect(screen.queryByText('Your Idea')).not.toBeInTheDocument();
  });

  it('switching to idea mode swaps the dropdown for the idea textarea', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('From an original idea'));
    expect(screen.getByText('Your Idea')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What do you want to say/)).toBeInTheDocument();
    expect(screen.queryByText(/Choose an article to syndicate/)).not.toBeInTheDocument();
  });
});

describe('restoring saved content on an item page', () => {
  it('deep-linking an item restores its drafted post and original-idea chip', async () => {
    renderPage('/workspace/ws1/library/item/item9/social/linkedin');
    expect(await screen.findByText('Original idea')).toBeInTheDocument();
    expect(await screen.findByText(/Post drafted/)).toBeInTheDocument();
    // Draft text posts invite the studio rather than rendering inline.
    expect(screen.getByRole('button', { name: /Open Studio/ })).toBeInTheDocument();
  });

  it('an item without content for the channel shows the create layout', async () => {
    renderPage('/workspace/ws1/library/item/item9/social/x');
    // No X content saved on the item: the config card leads.
    expect(await screen.findByText('Post Configuration')).toBeInTheDocument();
    expect(screen.queryByText(/Post drafted/)).not.toBeInTheDocument();
  });
});

describe('composing from an original idea', () => {
  it('refuses to draft an empty idea', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('From an original idea'));
    await userEvent.click(screen.getByRole('button', { name: /Draft LinkedIn Post/ }));
    expect(await screen.findByText('Write your idea first.')).toBeInTheDocument();
    expect(calls.some((c) => c.url === '/api/socials/compose')).toBe(false);
  });

  it('posts the idea to /api/socials/compose and lands on the new item', async () => {
    renderPage();
    await userEvent.click(await screen.findByText('From an original idea'));
    await userEvent.type(
      screen.getByPlaceholderText(/What do you want to say/),
      'storage deals die in due diligence'
    );
    await userEvent.click(screen.getByRole('button', { name: /Draft LinkedIn Post/ }));

    // The freshly composed item's page: original-idea chip + the drafted post.
    expect(await screen.findByText('Original idea')).toBeInTheDocument();
    expect(await screen.findByText(/Post drafted/)).toBeInTheDocument();

    const compose = calls.find((c) => c.url === '/api/socials/compose');
    expect(compose).toBeTruthy();
    const body = JSON.parse(compose.opts.body);
    expect(body).toMatchObject({
      workspaceId: 'ws1',
      idea: 'storage deals die in due diligence',
      channel: 'linkedin',
      function: 'teach',
    });
    // No accidental fallthrough to the article endpoint.
    expect(calls.some((c) => c.url === '/api/generate-socials')).toBe(false);
  });
});

describe('unshipped channels are hard-gated', () => {
  it.each(['instagram', 'facebook'])('%s shows only the coming-soon notice — no composer', async (channel) => {
    renderPage(`/workspace/ws1/social/${channel}`);
    expect(await screen.findByText('Coming Soon')).toBeInTheDocument();
    // The whole compose surface is gated, not just the channel panel.
    expect(screen.queryByText('From an article')).not.toBeInTheDocument();
    expect(screen.queryByText('From an original idea')).not.toBeInTheDocument();
    expect(screen.queryByText(/Recent Activity Log/)).not.toBeInTheDocument();
  });

  it('the gate also holds on item-scoped deep links', async () => {
    renderPage('/workspace/ws1/library/item/item9/social/instagram');
    expect(await screen.findByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByText('Original idea')).not.toBeInTheDocument();
  });
});
