// SocialLibrary: renders the flattened social-content feed and tags each card
// with its channel, type, and source (article syndication vs. original idea).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { authFetch } from '../lib/api';
import SocialLibrary from './SocialLibrary';

const ENTRIES = [
  {
    id: 'a:linkedin', itemId: 'a', channel: 'linkedin', type: 'text',
    articleTitle: 'Storage Deals 101', sourceType: 'article',
    status: 'finalized', preview: 'A post from the article', isThread: false,
    threadCount: 0, hasImage: false, function: 'teach', generatedAt: 1752900000000,
  },
  {
    id: 'b:linkedin', itemId: 'b', channel: 'linkedin', type: 'text',
    articleTitle: 'My own take on due diligence', sourceType: 'original',
    status: 'draft', preview: 'An original post', isThread: false,
    threadCount: 0, hasImage: false, function: 'inspire', generatedAt: 1752900001000,
  },
  {
    id: 'c:x_carousel', itemId: 'c', channel: 'x', type: 'carousel',
    articleTitle: 'Third piece', sourceType: 'article',
    status: 'finalized', slideCount: 5, cta: null, fileId: null,
    function: 'sell', generatedAt: 1752900002000,
  },
  {
    id: 'd:linkedin_poster', itemId: 'd', channel: 'linkedin', type: 'poster',
    articleTitle: 'Approved piece', sourceType: 'article', status: 'approved',
    headline: 'Approved piece', posterType: 'statement', stat: null, cta: null,
    fileId: null, approverEmail: 'approver@x.com', archived: false,
    function: null, generatedAt: 1752900003000,
  },
  {
    id: 'e:x', itemId: 'e', channel: 'x', type: 'text',
    articleTitle: 'Archived piece', sourceType: 'article', status: 'approved',
    preview: 'an archived post', isThread: false, threadCount: 0, hasImage: false,
    archived: true, approverEmail: 'approver@x.com',
    function: null, generatedAt: 1752900004000,
  },
];

vi.mock('../lib/api', () => ({
  API_BASE: '',
  authFetch: vi.fn((url, options = {}) => (
    options.method === 'POST'
      ? Promise.resolve({ ok: true, json: async () => ({ status: 'success' }) })
      : Promise.resolve({ ok: true, json: async () => ENTRIES })
  )),
}));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/workspace/ws1/social-library']}>
    <Routes>
      <Route path="/workspace/:id/social-library" element={<SocialLibrary />} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => vi.clearAllMocks());

describe('SocialLibrary', () => {
  it('renders every entry with its title', async () => {
    renderPage();
    expect(await screen.findByText('Storage Deals 101')).toBeInTheDocument();
    expect(screen.getByText('My own take on due diligence')).toBeInTheDocument();
    expect(screen.getByText('Third piece')).toBeInTheDocument();
  });

  it('labels original-idea pieces and attributes article pieces to their source', async () => {
    renderPage();
    expect(await screen.findByText('Original idea')).toBeInTheDocument();
    expect(screen.getByText('From: Storage Deals 101')).toBeInTheDocument();
    // The original piece must NOT claim an article source.
    expect(screen.queryByText(/From: My own take/)).not.toBeInTheDocument();
  });

  it('filters by channel', async () => {
    renderPage();
    await screen.findByText('Storage Deals 101');
    // The X filter button's accessible name is icon glyph + label + count,
    // concatenated: "XX1".
    await userEvent.click(screen.getByRole('button', { name: /^XX\d/ }));
    expect(screen.queryByText('Storage Deals 101')).not.toBeInTheDocument();
    expect(screen.getByText('Third piece')).toBeInTheDocument();
  });

  const cardOf = (title) => screen.getByText(title).closest('.glass-card');

  it('hard-deletes a draft only after confirming in the dialog', async () => {
    renderPage();
    await screen.findByText('My own take on due diligence');
    const card = within(cardOf('My own take on due diligence'));

    // First click only opens the dialog — nothing is sent yet.
    await userEvent.click(card.getByLabelText('Delete'));
    expect(authFetch).toHaveBeenCalledTimes(1); // just the initial listing GET
    const dialog = within(screen.getByRole('dialog', { name: 'Delete this post?' }));

    await userEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    expect(authFetch).toHaveBeenCalledWith('/api/socials/delete', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ itemId: 'b', channel: 'linkedin', kind: 'text' }),
    }));
    expect(screen.queryByText('My own take on due diligence')).not.toBeInTheDocument();
  });

  it('cancelling the dialog deletes nothing', async () => {
    renderPage();
    await screen.findByText('My own take on due diligence');
    await userEvent.click(within(cardOf('My own take on due diligence')).getByLabelText('Delete'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledTimes(1); // still just the listing GET
    expect(screen.getByText('My own take on due diligence')).toBeInTheDocument();
  });

  it('offers archive (not delete) on approved assets, behind a confirm dialog', async () => {
    renderPage();
    await screen.findByText('Approved piece');
    const card = within(cardOf('Approved piece'));
    expect(card.queryByLabelText('Delete')).not.toBeInTheDocument();

    await userEvent.click(card.getByLabelText('Archive'));
    const dialog = within(screen.getByRole('dialog', { name: 'Archive this poster?' }));
    // The dialog names the approver whose sign-off is on the asset.
    expect(dialog.getByText(/approver@x\.com/)).toBeInTheDocument();

    await userEvent.click(dialog.getByRole('button', { name: 'Archive' }));
    expect(authFetch).toHaveBeenCalledWith('/api/socials/archive', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ itemId: 'd', channel: 'linkedin', kind: 'poster', archived: true }),
    }));
    // The card moves out of the active view.
    expect(screen.queryByText('Approved piece')).not.toBeInTheDocument();
  });

  it('hides archived assets behind the Archived filter, with restore', async () => {
    renderPage();
    await screen.findByText('Storage Deals 101');
    expect(screen.queryByText('an archived post')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Archived/ }));
    expect(screen.getByText('an archived post')).toBeInTheDocument();
    expect(screen.queryByText('Storage Deals 101')).not.toBeInTheDocument();

    const card = within(cardOf('Archived piece'));
    await userEvent.click(card.getByLabelText('Restore'));
    expect(authFetch).toHaveBeenCalledWith('/api/socials/archive', expect.objectContaining({
      body: JSON.stringify({ itemId: 'e', channel: 'x', kind: 'text', archived: false }),
    }));
    // Restoring the only archived asset jumps back to the All view.
    expect(await screen.findByText('an archived post')).toBeInTheDocument();
    expect(screen.getByText('Storage Deals 101')).toBeInTheDocument();
  });
});
