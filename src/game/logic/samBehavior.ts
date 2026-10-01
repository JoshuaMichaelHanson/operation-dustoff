import { GROUND_Y, SAM } from '../constants';
import type { FlightObstacleConfig } from '../levels/levelConfig';

export interface SamPoint {
  x: number;
  y: number;
}

export function canSamLock(
  launcher: SamPoint,
  target: SamPoint,
  obstacles: readonly FlightObstacleConfig[],
): boolean {
  const dx = target.x - launcher.x;
  const dy = target.y - launcher.y;
  if (
    GROUND_Y - target.y < SAM.minimumTargetRise ||
    Math.hypot(dx, dy) > SAM.range
  ) {
    return false;
  }

  return !obstacles.some((obstacle) => {
    const left = obstacle.x - obstacle.width / 2;
    const right = obstacle.x + obstacle.width / 2;
    const near = dx === 0
      ? (launcher.x >= left && launcher.x <= right ? 0 : 2)
      : Math.max(0, Math.min((left - launcher.x) / dx, (right - launcher.x) / dx));
    const far = dx === 0
      ? 1
      : Math.min(1, Math.max((left - launcher.x) / dx, (right - launcher.x) / dx));
    return near <= far && launcher.y + dy * near >= GROUND_Y - obstacle.height;
  });
}

export function canSamGuide(target: SamPoint): boolean {
  return GROUND_Y - target.y >= SAM.minimumTargetRise;
}

export interface SamAttackStep {
  warningTarget: SamPoint | null;
  launchTarget: SamPoint | null;
}

export class SamAttack {
  private phase: 'ready' | 'warning' | 'cooldown' = 'ready';
  private warningEndsAt = 0;
  private nextAttackAt = 0;

  get isWarning(): boolean {
    return this.phase === 'warning';
  }

  advance(
    time: number,
    launcher: SamPoint,
    target: SamPoint | undefined,
    obstacles: readonly FlightObstacleConfig[],
  ): SamAttackStep {
    const quiet = { warningTarget: null, launchTarget: null };
    if (this.phase === 'cooldown' && time >= this.nextAttackAt) {
      this.phase = 'ready';
    }
    if (this.phase === 'cooldown') return quiet;
    if (this.phase === 'ready') {
      if (!target || time < this.nextAttackAt ||
        !canSamLock(launcher, target, obstacles)) {
        return quiet;
      }
      this.phase = 'warning';
      this.warningEndsAt = time + SAM.warningMs;
    }
    if (!target || !canSamLock(launcher, target, obstacles)) {
      this.cancel(time);
      return quiet;
    }
    if (time < this.warningEndsAt) {
      return { warningTarget: { x: target.x, y: target.y }, launchTarget: null };
    }
    this.phase = 'cooldown';
    this.nextAttackAt = time + SAM.cooldownMs;
    return { warningTarget: null, launchTarget: { x: target.x, y: target.y } };
  }

  cancel(time: number): void {
    this.phase = 'cooldown';
    this.nextAttackAt = time + SAM.cancelCooldownMs;
  }
}
