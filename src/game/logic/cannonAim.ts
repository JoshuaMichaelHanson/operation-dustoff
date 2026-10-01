export interface CannonVelocity {
  x: number;
  y: number;
}

export function getCannonMuzzlePosition(
  x: number,
  y: number,
  direction: -1 | 1,
  rotationRadians: number,
): { x: number; y: number } {
  const offsetX = direction * 53;
  const offsetY = 2;
  return {
    x: x + offsetX * Math.cos(rotationRadians) -
      offsetY * Math.sin(rotationRadians),
    y: y + offsetX * Math.sin(rotationRadians) +
      offsetY * Math.cos(rotationRadians),
  };
}

export function getCannonVelocity(
  direction: -1 | 1,
  speed: number,
  aimAngleRadians: number,
): CannonVelocity {
  return {
    x: direction * Math.cos(aimAngleRadians) * speed,
    y: Math.sin(aimAngleRadians) * speed,
  };
}
