import { HELICOPTER } from '../constants';

export interface LandingSample {
  touchingGround: boolean;
  velocityX: number;
  velocityY: number;
}

export type ControlDirection = -1 | 0 | 1;

export function getFlightAttitude(
  velocityX: number,
  facing: -1 | 1,
): { rotationRadians: number; cannonAngleRadians: number } {
  const speedRatio = Math.min(
    Math.abs(velocityX) / HELICOPTER.maximumHorizontalSpeed,
    1,
  );
  const rotationRadians =
    Math.sign(velocityX) * speedRatio * HELICOPTER.maximumForwardPitchRadians;
  return {
    rotationRadians,
    cannonAngleRadians: facing * rotationRadians,
  };
}

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

export function getWindAcceleration(
  windAcceleration: number,
  maximumDriftSpeed: number,
  velocityX: number,
  inputDirection: ControlDirection,
  touchingGround: boolean,
): number {
  if (touchingGround || windAcceleration === 0) return 0;
  if (inputDirection !== 0) return windAcceleration;

  const targetSpeed = Math.sign(windAcceleration) * maximumDriftSpeed;
  const correction = (targetSpeed - velocityX) * 2;
  return Math.max(-HELICOPTER.horizontalDrag,
    Math.min(HELICOPTER.horizontalDrag, correction));
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
