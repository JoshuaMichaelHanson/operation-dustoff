import { BOMB } from '../constants';

export interface BombLaunchVelocity {
  x: number;
  y: number;
}

export function getBombLaunchVelocity(
  helicopterVelocityX: number,
): BombLaunchVelocity {
  return {
    x: helicopterVelocityX * BOMB.horizontalCarry,
    y: BOMB.initialDownwardSpeed,
  };
}

export function isWithinBombBlast(
  blastX: number,
  blastY: number,
  targetX: number,
  targetY: number,
  blastRadius: number,
): boolean {
  return Math.hypot(targetX - blastX, targetY - blastY) <= blastRadius;
}

export function getTargetsWithinBombBlast<T extends { x: number; y: number }>(
  targets: readonly T[],
  blastX: number,
  blastY: number,
  blastRadius: number,
): T[] {
  return targets.filter((target) =>
    isWithinBombBlast(
      blastX,
      blastY,
      target.x,
      target.y,
      blastRadius,
    ),
  );
}
