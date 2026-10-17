import { describe, it, expect } from 'vitest';
import {
  IDEA_MAX_LENGTH,
  isOriginalItem,
  socialSourceOf,
  ideaTitleOf,
  normalizeSocialGenParams,
  normalizeIdea,
} from '../lib/socialSource.js';

// Two source lanes feed Loki: article items syndicate their generated draft;
// original items (sourceType 'original') develop the creator's idea brief.

describe('isOriginalItem / socialSourceOf', () => {
  it('article items ground on their draft', () => {
    const item = { draft: '# Title\n\nBody', idea: 'should be ignored' };
    expect(isOriginalItem(item)).toBe(false);
    expect(socialSourceOf(item)).toEqual({ type: 'article', text: '# Title\n\nBody' });
  });

  it('original items ground on their idea, trimmed', () => {
    const item = { sourceType: 'original', idea: '  storage deals fail on due diligence  ' };
    expect(isOriginalItem(item)).toBe(true);
    expect(socialSourceOf(item)).toEqual({ type: 'idea', text: 'storage deals fail on due diligence' });
  });

  it('missing source text comes back empty, never undefined', () => {
    expect(socialSourceOf({})).toEqual({ type: 'article', text: '' });
    expect(socialSourceOf({ sourceType: 'original' })).toEqual({ type: 'idea', text: '' });
    expect(socialSourceOf(null)).toEqual({ type: 'article', text: '' });
  });

  it('unknown sourceType values are treated as article items', () => {
    const item = { sourceType: 'podcast', draft: 'D', idea: 'ignored' };
    expect(isOriginalItem(item)).toBe(false);
    expect(socialSourceOf(item)).toEqual({ type: 'article', text: 'D' });
  });
});

describe('ideaTitleOf', () => {
  it('uses the first line of the idea', () => {
    expect(ideaTitleOf('The hook\nand the rest of the notes')).toBe('The hook');
  });

  it('caps long first lines with an ellipsis', () => {
    const long = 'x'.repeat(120);
    const title = ideaTitleOf(long);
    expect(title.length).toBe(80);
    expect(title.endsWith('...')).toBe(true);
  });

  it('falls back for empty input', () => {
    expect(ideaTitleOf('')).toBe('Untitled idea');
    expect(ideaTitleOf('   \n  ')).toBe('Untitled idea');
    expect(ideaTitleOf(undefined)).toBe('Untitled idea');
  });
});

describe('normalizeSocialGenParams', () => {
  it('normalizes casing and applies defaults', () => {
    expect(normalizeSocialGenParams({ channel: 'LinkedIn', function: 'Teach' }))
      .toEqual({ channel: 'linkedin', fn: 'teach', format: null, personaId: null });
    expect(normalizeSocialGenParams()).toEqual({ channel: 'linkedin', fn: 'teach', format: null, personaId: null });
  });

  it('passes format and personaId through', () => {
    const p = normalizeSocialGenParams({ channel: 'x', function: 'sell', format: 'Thread', personaId: 'p1' });
    expect(p).toEqual({ channel: 'x', fn: 'sell', format: 'Thread', personaId: 'p1' });
  });

  it('rejects unknown channels and functions', () => {
    expect(normalizeSocialGenParams({ channel: 'tiktok' }).error).toMatch(/channel/i);
    expect(normalizeSocialGenParams({ function: 'spam' }).error).toMatch(/function/i);
  });
});

describe('normalizeIdea', () => {
  it('trims and derives a title', () => {
    expect(normalizeIdea('  My idea\nwith notes  ')).toEqual({ idea: 'My idea\nwith notes', title: 'My idea' });
  });

  it('rejects empty or non-string ideas', () => {
    expect(normalizeIdea('').error).toBeTruthy();
    expect(normalizeIdea('   ').error).toBeTruthy();
    expect(normalizeIdea(undefined).error).toBeTruthy();
    expect(normalizeIdea(42).error).toBeTruthy();
  });

  it('rejects ideas over the length cap', () => {
    expect(normalizeIdea('x'.repeat(IDEA_MAX_LENGTH)).error).toBeUndefined();
    expect(normalizeIdea('x'.repeat(IDEA_MAX_LENGTH + 1)).error).toMatch(/under/i);
  });
});
