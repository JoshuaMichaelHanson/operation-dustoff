import { describe, expect, it } from 'vitest';

import { getCannonVelocity } from '../src/game/logic/cannonAim';

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
});
