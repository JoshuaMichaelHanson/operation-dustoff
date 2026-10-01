import { AA_GUN, GROUND_Y } from '../constants';
import type { EnemyShot } from '../entities/EnemyShot';
import type { FlightObstacleConfig } from '../levels/levelConfig';

export interface AaPoint {
  x: number;
  y: number;
}

export function canAaTrack(
  muzzle: AaPoint,
  target: AaPoint,
  obstacles: readonly FlightObstacleConfig[],
): boolean {
  const deltaX = target.x - muzzle.x;
  const deltaY = target.y - muzzle.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (
    Math.abs(deltaX) < AA_GUN.overheadBlindSpot ||
    -deltaY < AA_GUN.minimumTargetRise ||
    distance > AA_GUN.range
  ) {
    return false;
  }

  return !obstacles.some((obstacle) => {
    const left = obstacle.x - obstacle.width / 2;
    const right = obstacle.x + obstacle.width / 2;
    const nearT = Math.max(
      0,
      Math.min((left - muzzle.x) / deltaX, (right - muzzle.x) / deltaX),
    );
    const farT = Math.min(
      1,
      Math.max((left - muzzle.x) / deltaX, (right - muzzle.x) / deltaX),
    );
    if (nearT > farT) {
      return false;
    }

    return muzzle.y + deltaY * nearT >= GROUND_Y - obstacle.height;
  });
}

export function getAaBurstShot(muzzle: AaPoint, target: AaPoint): EnemyShot {
  const deltaX = target.x - muzzle.x;
  const deltaY = target.y - muzzle.y;
  const distance = Math.hypot(deltaX, deltaY) || 1;
  return {
    x: muzzle.x,
    y: muzzle.y,
    velocityX: (deltaX / distance) * AA_GUN.projectileSpeed,
    velocityY: (deltaY / distance) * AA_GUN.projectileSpeed,
    damage: AA_GUN.projectileDamage,
  };
}

type AttackPhase = 'ready' | 'warning' | 'burst' | 'cooldown';

export interface AaAttackStep {
  warningTarget: AaPoint | null;
  shot: EnemyShot | null;
}

export class AaAttack {
  private phase: AttackPhase = 'ready';
  private nextAttackAt = 0;
  private warningEndsAt = 0;
  private nextShotAt = 0;
  private shotsRemaining = 0;
  private lockedTarget: AaPoint = { x: 0, y: 0 };

  get isWarning(): boolean {
    return this.phase === 'warning';
  }

  advance(
    time: number,
    muzzle: AaPoint,
    target: AaPoint | undefined,
    obstacles: readonly FlightObstacleConfig[],
  ): AaAttackStep {
    const quiet = { warningTarget: null, shot: null };
    if (this.phase === 'cooldown' && time >= this.nextAttackAt) {
      this.phase = 'ready';
    }
    if (this.phase === 'ready') {
      if (!target || time < this.nextAttackAt ||
        !canAaTrack(muzzle, target, obstacles)) {
        return quiet;
      }
      this.phase = 'warning';
      this.warningEndsAt = time + AA_GUN.warningMs;
    }

    if (this.phase === 'warning') {
      if (!target || !canAaTrack(muzzle, target, obstacles)) {
        this.cancel(time);
        return quiet;
      }
      this.lockedTarget = { x: target.x, y: target.y };
      if (time < this.warningEndsAt) {
        return { warningTarget: target, shot: null };
      }
      this.phase = 'burst';
      this.shotsRemaining = AA_GUN.burstCount;
      this.nextShotAt = time;
    }

    if (this.phase !== 'burst' || time < this.nextShotAt) {
      return quiet;
    }

    const shot = getAaBurstShot(muzzle, this.lockedTarget);
    this.shotsRemaining -= 1;
    this.nextShotAt = time + AA_GUN.burstSpacingMs;
    if (this.shotsRemaining === 0) {
      this.phase = 'cooldown';
      this.nextAttackAt = time + AA_GUN.cooldownMs;
    }
    return { warningTarget: null, shot };
  }

  cancel(time: number): void {
    this.phase = 'cooldown';
    this.nextAttackAt = time + AA_GUN.cancelCooldownMs;
    this.shotsRemaining = 0;
  }
}
