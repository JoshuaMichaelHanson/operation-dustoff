import { describe, expect, it } from 'vitest';

import { getTankAim } from '../src/game/logic/tankAim';

describe('tank aim', () => {
  it.each([
    { horizontal: 100, rise: -20, frame: 0 },
    { horizontal: 100, rise: 0, frame: 0 },
    { horizontal: 100, rise: 36, frame: 1 },
    { horizontal: 100, rise: 84, frame: 2 },
    { horizontal: 100, rise: 174, frame: 3 },
    { horizontal: 10, rise: 100, frame: 3 },
  ])(
    'selects frame $frame for a target $rise pixels above over $horizontal pixels',
    ({ horizontal, rise, frame }) => {
      expect(getTankAim(horizontal, rise).frame).toBe(frame);
    },
  );

  it('returns the muzzle position belonging to each discrete cannon frame', () => {
    expect(getTankAim(100, 0)).toMatchObject({
      muzzleOffsetX: 38,
      muzzleOffsetY: -8,
    });
    expect(getTankAim(10, 100)).toMatchObject({
      muzzleOffsetX: 25,
      muzzleOffsetY: -21,
    });
  });
});
