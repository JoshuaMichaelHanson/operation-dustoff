import { HELICOPTER } from '../constants';

export interface LandingSample {
  touchingGround: boolean;
  velocityX: number;
  velocityY: number;
}

export function isSafeLanding(sample: LandingSample): boolean {
  return (
    sample.touchingGround &&
    Math.abs(sample.velocityX) <= HELICOPTER.safeLandingHorizontalSpeed &&
    Math.abs(sample.velocityY) <= HELICOPTER.safeLandingVerticalSpeed
  );
}
