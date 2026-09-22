import { HELICOPTER } from '../constants';

export interface LandingSample {
  touchingGround: boolean;
  velocityX: number;
  velocityY: number;
}

export type ControlDirection = -1 | 0 | 1;

export function getHorizontalControlAcceleration(
  inputDirection: ControlDirection,
  velocityX: number,
): number {
  if (inputDirection === 0) {
    return 0;
  }

  const counterSteering =
    velocityX !== 0 && Math.sign(velocityX) !== inputDirection;
  const acceleration = counterSteering
    ? HELICOPTER.horizontalCounterAcceleration
    : HELICOPTER.horizontalAcceleration;

  return inputDirection * acceleration;
}

export function getVerticalControlAcceleration(
  inputDirection: ControlDirection,
): number {
  if (inputDirection < 0) {
    return -HELICOPTER.climbAcceleration;
  }

  if (inputDirection > 0) {
    return HELICOPTER.descentAcceleration;
  }

  return 0;
}

export function getHorizontalDrag(
  touchingGround: boolean,
  inputDirection: ControlDirection,
): number {
  return touchingGround && inputDirection === 0
    ? HELICOPTER.groundedHorizontalDrag
    : HELICOPTER.horizontalDrag;
}

export function isSafeLanding(sample: LandingSample): boolean {
  return (
    sample.touchingGround &&
    Math.abs(sample.velocityX) <= HELICOPTER.safeLandingHorizontalSpeed &&
    Math.abs(sample.velocityY) <= HELICOPTER.safeLandingVerticalSpeed
  );
}
