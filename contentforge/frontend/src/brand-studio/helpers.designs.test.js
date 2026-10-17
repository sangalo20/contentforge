// Design Library serialization: inputs split losslessly into a JSON recipe +
// an image map, and merge back to the same shape.
import { describe, it, expect } from 'vitest';
import { splitDesignInputs, mergeDesignInputs } from './helpers';

const PNG_A = 'data:image/png;base64,AAAA';
const PNG_B = 'data:image/jpeg;base64,BBBB';

describe('splitDesignInputs / mergeDesignInputs', () => {
  it('separates image data URLs (including arrays) from plain fields', () => {
    const { fields, images } = splitDesignInputs({
      title: 'Ep 12',
      variant: 'noir',
      showLogo: true,
      uploadedImage: PNG_A,
      uploadedCoHosts: [PNG_A, PNG_B],
      generatedBackground: undefined,
    });
    expect(fields).toEqual({ title: 'Ep 12', variant: 'noir', showLogo: true });
    expect(images).toEqual({
      uploadedImage: PNG_A,
      'uploadedCoHosts[0]': PNG_A,
      'uploadedCoHosts[1]': PNG_B,
    });
  });

  it('round-trips: merge(split(x)) reproduces the defined inputs', () => {
    const inputs = { title: 'T', uploadedImage: PNG_A, uploadedCoHosts: [PNG_B], count: 3 };
    const { fields, images } = splitDesignInputs(inputs);
    expect(mergeDesignInputs(fields, images)).toEqual(inputs);
  });

  it('merge tolerates sparse/missing array slots', () => {
    const merged = mergeDesignInputs({ title: 'T' }, { 'uploadedCoHosts[1]': PNG_B });
    expect(merged.uploadedCoHosts).toEqual([PNG_B]);
  });
});
