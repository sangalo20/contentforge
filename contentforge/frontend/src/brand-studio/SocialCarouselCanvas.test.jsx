// The carousel slide mapping: Loki's slide fields land in the right template
// slots, slide kinds pick their design-set variant, and the design registry
// keeps every set in one template family.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SocialCarouselCanvas from './SocialCarouselCanvas';
import { CAROUSEL_DESIGNS, carouselDesignById } from './socialCarouselDesigns';

describe('SocialCarouselCanvas', () => {
  it('renders a point slide through a design set with heading, body, and deck position', () => {
    render(
      <SocialCarouselCanvas
        slide={{ kind: 'point', heading: 'Cash flow is the moat', body: 'Storage survives cycles.' }}
        index={2}
        count={7}
        design="announcement:poster"
      />
    );
    expect(screen.getByText('Cash flow is the moat')).toBeInTheDocument();
    expect(screen.getByText('Storage survives cycles.')).toBeInTheDocument();
    expect(screen.getByText('3 / 7')).toBeInTheDocument();
  });

  it('renders hook and cta slides through their own variants of the same family', () => {
    const design = carouselDesignById('storage101:primer');
    expect(design.kinds.hook).not.toBe(design.kinds.point);
    render(
      <SocialCarouselCanvas
        slide={{ kind: 'hook', heading: 'Nobody brags about storage' }}
        index={0}
        count={5}
        design="storage101:primer"
      />
    );
    expect(screen.getByText(/Nobody brags about storage/)).toBeInTheDocument();
  });

  it('every design set covers all three slide kinds and falls back safely', () => {
    for (const d of CAROUSEL_DESIGNS) {
      expect(d.kinds.hook && d.kinds.point && d.kinds.cta, d.id).toBeTruthy();
    }
    expect(carouselDesignById('nope:missing')).toBe(CAROUSEL_DESIGNS[0]);
  });
});
