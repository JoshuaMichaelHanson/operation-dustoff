import { describe, expect, it } from 'vitest';

import { HELICOPTER } from '../src/game/constants';
import {
  getHorizontalControlAcceleration,
  getFlightAttitude,
  getHorizontalDrag,
  getWindAcceleration,
  getVerticalControlAcceleration,
  isSafeLanding,
} from '../src/game/logic/helicopterMotion';

describe('helicopter flight controls', () => {
  it('keeps forward pitch downward and backward pitch upward for either facing', () => {
    const halfSpeed = HELICOPTER.maximumHorizontalSpeed / 2;
    const halfPitch = HELICOPTER.maximumForwardPitchRadians / 2;
    expect(getFlightAttitude(halfSpeed, 1)).toEqual({
      rotationRadians: halfPitch,
      cannonAngleRadians: halfPitch,
    });
    expect(getFlightAttitude(-halfSpeed, 1)).toEqual({
      rotationRadians: -halfPitch,
      cannonAngleRadians: -halfPitch,
    });
    expect(getFlightAttitude(-halfSpeed, -1)).toEqual({
      rotationRadians: -halfPitch,
      cannonAngleRadians: halfPitch,
    });
    expect(getFlightAttitude(halfSpeed, -1)).toEqual({
      rotationRadians: halfPitch,
      cannonAngleRadians: -halfPitch,
    });
  });

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

describe('wind flight rules', () => {
  it('pushes an airborne helicopter and caps its hands-off drift', () => {
    expect(getWindAcceleration(30, 40, 0, 0, false)).toBe(80);
    expect(getWindAcceleration(30, 40, 40, 0, false)).toBe(0);
    expect(getWindAcceleration(-30, 40, 0, 0, false)).toBe(-80);
    expect(getWindAcceleration(-30, 40, -40, 0, false)).toBe(0);
  });

  it('brakes released controls without overpowering countersteering', () => {
    expect(getWindAcceleration(30, 40, -260, 0, false)).toBe(190);
    expect(getWindAcceleration(30, 40, 260, 0, false)).toBe(-190);
    expect(getWindAcceleration(30, 40, 80, -1, false)).toBe(30);
    expect(getWindAcceleration(30, 40, 0, 0, true)).toBe(0);
    expect(getWindAcceleration(0, 0, 0, 0, false)).toBe(0);
  });
});
