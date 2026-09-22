import { describe, expect, it } from 'vitest';

import { HELICOPTER } from '../src/game/constants';
import {
  getHorizontalControlAcceleration,
  getHorizontalDrag,
  getVerticalControlAcceleration,
  isSafeLanding,
} from '../src/game/logic/helicopterMotion';

describe('helicopter flight controls', () => {
  it('uses gentle acceleration when building horizontal speed', () => {
    expect(getHorizontalControlAcceleration(1, 80)).toBe(
      HELICOPTER.horizontalAcceleration,
    );
    expect(getHorizontalControlAcceleration(-1, -80)).toBe(
      -HELICOPTER.horizontalAcceleration,
    );
  });

  it('uses stronger counter-steering against existing momentum', () => {
    expect(getHorizontalControlAcceleration(-1, 80)).toBe(
      -HELICOPTER.horizontalCounterAcceleration,
    );
    expect(getHorizontalControlAcceleration(1, -80)).toBe(
      HELICOPTER.horizontalCounterAcceleration,
    );
  });

  it('keeps climb and descent control intentionally asymmetric', () => {
    expect(getVerticalControlAcceleration(-1)).toBe(
      -HELICOPTER.climbAcceleration,
    );
    expect(getVerticalControlAcceleration(1)).toBe(
      HELICOPTER.descentAcceleration,
    );
    expect(getVerticalControlAcceleration(0)).toBe(0);
  });

  it('settles ground momentum after horizontal input is released', () => {
    expect(getHorizontalDrag(true, 0)).toBe(
      HELICOPTER.groundedHorizontalDrag,
    );
    expect(getHorizontalDrag(true, 1)).toBe(HELICOPTER.horizontalDrag);
    expect(getHorizontalDrag(false, 0)).toBe(HELICOPTER.horizontalDrag);
  });
});

describe('helicopter landing rules', () => {
  it('reports a gentle ground contact as landed', () => {
    expect(
      isSafeLanding({ touchingGround: true, velocityX: 20, velocityY: 0 }),
    ).toBe(true);
  });

  it('accepts a controlled approach near the forgiving speed limits', () => {
    expect(
      isSafeLanding({
        touchingGround: true,
        velocityX: HELICOPTER.safeLandingHorizontalSpeed - 5,
        velocityY: HELICOPTER.safeLandingVerticalSpeed - 5,
      }),
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
