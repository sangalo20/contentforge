// Deep-link prefill: the forge links to /brand-studio?template=...&title=...
// and the studio must land on that template with the fields filled in.
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// BrandStudio imports authFetch, whose module initializes the Firebase client
// SDK — unavailable in CI (no VITE_FIREBASE_* env). Mock the api seam like the
// other component tests do.
vi.mock('@/lib/api', () => ({
  API_BASE: '',
  authFetch: vi.fn(async () => ({ ok: true, json: async () => ({}) })),
}));

const { default: BrandStudio } = await import('./BrandStudio');

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  window.history.replaceState({}, '', '/brand-studio');
});

describe('BrandStudio deep-link prefill', () => {
  it('prefills template and fields from the query string', () => {
    window.history.replaceState(
      {},
      '',
      '/brand-studio?template=quote&brand=storagemoguls&title=One+sharp+line+from+the+piece&author=Joe+Downs'
    );
    render(<MemoryRouter><BrandStudio /></MemoryRouter>);
    // Lands on the Content tab with the deep-linked values in the form.
    expect(screen.getByDisplayValue('One sharp line from the piece')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Joe Downs')).toBeInTheDocument();
  });

  it('falls back to defaults when the template is unknown', () => {
    window.history.replaceState({}, '', '/brand-studio?template=notatemplate&title=Ignored');
    render(<MemoryRouter><BrandStudio /></MemoryRouter>);
    // Default landing is the Templates tab with the template browser visible.
    expect(screen.getAllByText(/Brand Seal/i).length).toBeGreaterThan(0);
  });
});
