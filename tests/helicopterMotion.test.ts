import { describe, expect, it } from 'vitest';

import { HELICOPTER } from '../src/game/constants';
import { isSafeLanding } from '../src/game/logic/helicopterMotion';

describe('helicopter landing rules', () => {
  it('reports a gentle ground contact as landed', () => {
    expect(
      isSafeLanding({ touchingGround: true, velocityX: 20, velocityY: 0 }),
    ).toBe(true);
  });

  it('does not report an airborne helicopter as landed', () => {
    expect(
      isSafeLanding({ touchingGround: false, velocityX: 0, velocityY: 0 }),
    ).toBe(false);
  });

  it('rejects ground contact above the safe horizontal speed', () => {
    expect(
      isSafeLanding({
        touchingGround: true,
        velocityX: HELICOPTER.safeLandingHorizontalSpeed + 1,
        velocityY: 0,
      }),
    ).toBe(false);
  });

  it('rejects ground contact above the safe vertical speed', () => {
    expect(
      isSafeLanding({
        touchingGround: true,
        velocityX: 0,
        velocityY: HELICOPTER.safeLandingVerticalSpeed + 1,
      }),
    ).toBe(false);
  });
});
