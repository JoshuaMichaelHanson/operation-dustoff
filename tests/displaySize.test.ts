import { describe, expect, it } from 'vitest';

import { calculateContainedDisplaySize } from '../src/game/logic/displaySize';

describe('contained game display size', () => {
  it('fits a 16:9 game inside a 4:3 tablet viewport', () => {
    expect(calculateContainedDisplaySize(1024, 768, 1280, 720)).toEqual({
      width: 1024,
      height: 576,
    });
  });

  it('uses the available height when browser chrome makes it limiting', () => {
    expect(calculateContainedDisplaySize(1024, 500, 1280, 720)).toEqual({
      width: 888,
      height: 500,
    });
  });

  it('never upscales beyond the native game size', () => {
    expect(calculateContainedDisplaySize(1600, 1000, 1280, 720)).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it('returns an empty size when no usable area exists', () => {
    expect(calculateContainedDisplaySize(0, 768, 1280, 720)).toEqual({
      width: 0,
      height: 0,
    });
  });
});
