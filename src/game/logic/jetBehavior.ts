export type JetDirection = -1 | 1;

export interface JetVelocity {
  x: number;
  y: number;
}

export function getJetSpawnX(
  direction: JetDirection,
  worldWidth: number,
  margin: number,
): number {
  return direction === 1 ? -margin : worldWidth + margin;
}

export function isJetPastWorldBounds(
  x: number,
  direction: JetDirection,
  worldWidth: number,
  margin: number,
): boolean {
  return direction === 1 ? x > worldWidth + margin : x < -margin;
}

export function getJetAttackVelocity(
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  speed: number,
  maximumRange: number,
): JetVelocity | null {
  const deltaX = targetX - originX;
  const deltaY = targetY - originY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0 || distance > maximumRange) {
    return null;
  }

  return {
    x: (deltaX / distance) * speed,
    y: (deltaY / distance) * speed,
  };
}
