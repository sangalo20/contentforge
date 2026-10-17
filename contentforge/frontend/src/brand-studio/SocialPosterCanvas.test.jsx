// The poster mapping: Loki's fields land in the right template slots and the
// design registry serves the right list per poster type.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SocialPosterCanvas from './SocialPosterCanvas';
import { posterDesigns } from './socialPosterDesigns';

describe('SocialPosterCanvas', () => {
  it('renders a stat poster through a Big Number design', () => {
    render(
      <SocialPosterCanvas
        poster={{ posterType: 'stat', stat: '$29M+', headline: 'Acquired deal by deal', subline: 'Discipline pays.' }}
        design="bignumber:total"
      />
    );
    expect(screen.getByText('$29M+')).toBeInTheDocument();
    expect(screen.getByText('Acquired deal by deal')).toBeInTheDocument();
  });

  it('renders a statement poster through an editorial design', () => {
    render(
      <SocialPosterCanvas
        poster={{ posterType: 'statement', headline: 'Boring on paper, beautiful in the bank', subline: 'The operator way.' }}
        design="editorial:type"
      />
    );
    expect(screen.getByText(/oring on paper, beautiful in the bank/)).toBeInTheDocument();
    expect(screen.getByText('The operator way.')).toBeInTheDocument();
  });

  it('serves stat designs and statement designs from separate lists', () => {
    expect(posterDesigns('stat').every(d => d.id.startsWith('bignumber:'))).toBe(true);
    expect(posterDesigns('statement').some(d => d.id.startsWith('editorial:'))).toBe(true);
  });
});
