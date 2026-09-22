export interface Point {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export function canLockMissileTarget(
  origin: Point,
  target: Point,
  facing: -1 | 1,
  maximumRange: number,
): boolean {
  const deltaX = target.x - origin.x;
  const deltaY = target.y - origin.y;
  return (
    deltaX * facing >= 0 &&
    Math.hypot(deltaX, deltaY) <= maximumRange
  );
}

export function getHomingMissileVelocity(
  currentVelocity: Velocity,
  missilePosition: Point,
  targetPosition: Point,
  speed: number,
  maximumTurnRadiansPerSecond: number,
  deltaMs: number,
): Velocity {
  const desiredAngle = Math.atan2(
    targetPosition.y - missilePosition.y,
    targetPosition.x - missilePosition.x,
  );
  const currentAngle =
    currentVelocity.x === 0 && currentVelocity.y === 0
      ? desiredAngle
      : Math.atan2(currentVelocity.y, currentVelocity.x);
  const angleDifference = normalizeAngle(desiredAngle - currentAngle);
  const maximumTurn = maximumTurnRadiansPerSecond * (deltaMs / 1000);
  const nextAngle =
    currentAngle + clamp(angleDifference, -maximumTurn, maximumTurn);

  return {
    x: Math.cos(nextAngle) * speed,
    y: Math.sin(nextAngle) * speed,
  };
}

function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
