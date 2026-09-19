export interface CannonVelocity {
  x: number;
  y: number;
}

export function getCannonVelocity(
  direction: -1 | 1,
  speed: number,
  downwardAngleRadians: number,
): CannonVelocity {
  return {
    x: direction * Math.cos(downwardAngleRadians) * speed,
    y: Math.sin(downwardAngleRadians) * speed,
  };
}
