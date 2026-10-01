import { describe, expect, it } from 'vitest';

import {
  getCannonMuzzlePosition,
  getCannonVelocity,
} from '../src/game/logic/cannonAim';

describe('cannon aiming', () => {
  it('angles right-facing fire toward the ground', () => {
    const velocity = getCannonVelocity(1, 100, Math.PI / 6);

    expect(velocity.x).toBeCloseTo(86.6, 1);
    expect(velocity.y).toBeCloseTo(50, 1);
  });

  it('angles left-facing fire toward the ground', () => {
    const velocity = getCannonVelocity(-1, 100, Math.PI / 6);

    expect(velocity.x).toBeCloseTo(-86.6, 1);
    expect(velocity.y).toBeCloseTo(50, 1);
  });

  it('raises cannon fire and the muzzle when retreating', () => {
    const rightMuzzle = getCannonMuzzlePosition(300, 400, 1, -0.28);
    const leftMuzzle = getCannonMuzzlePosition(300, 400, -1, 0.28);
    expect(rightMuzzle.y).toBeLessThan(400);
    expect(leftMuzzle.y).toBeLessThan(400);
    expect(getCannonVelocity(1, 100, -0.28).y).toBeLessThan(0);
    expect(getCannonVelocity(-1, 100, -0.28).y).toBeLessThan(0);
    expect(getCannonMuzzlePosition(300, 400, 1, 0)).toEqual({
      x: 353,
      y: 402,
    });
  });
});
