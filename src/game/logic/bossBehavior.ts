import { BOSS } from '../constants';
import type { EnemyShot } from '../entities/EnemyShot';

export interface BossPoint {
  x: number;
  y: number;
}

export type BossPattern = 'aimed' | 'spread' | 'missile';

export interface BossAttackStep {
  warning: { target: BossPoint; pattern: BossPattern } | null;
  shots: EnemyShot[];
  missileTarget: BossPoint | null;
}

export function bossMissilePhase(elapsedMs: number):
  'guided' | 'ballistic' | 'expired' {
  if (elapsedMs >= BOSS.missileLifetimeMs) return 'expired';
  return elapsedMs < BOSS.missileGuideMs ? 'guided' : 'ballistic';
}

export class BossAttack {
  private nextAttackAt = 0;
  private warningStartedAt: number | null = null;
  private warnedTarget: BossPoint | null = null;
  private pattern: BossPattern = 'aimed';
  private nextPattern: BossPattern = 'aimed';
  private shotsRemaining = 0;
  private nextShotAt = 0;
  private damagedVolley = false;
  private missilesRemaining: number = BOSS.missileAmmo;

  get isWarning(): boolean {
    return this.warningStartedAt !== null;
  }

  get warningPattern(): BossPattern | null {
    return this.isWarning ? this.pattern : null;
  }

  advance(time: number, origin: BossPoint, target?: BossPoint,
    damaged = false): BossAttackStep {
    const inRange = target !== undefined &&
      Math.hypot(target.x - origin.x, target.y - origin.y) <= BOSS.attackRange;
    if (!inRange && this.warningStartedAt !== null) {
      this.cancel(time);
    }

    if (this.warningStartedAt !== null && this.warnedTarget) {
      if (time - this.warningStartedAt < BOSS.warningMs) {
        return {
          warning: { target: this.warnedTarget, pattern: this.pattern },
          shots: [],
          missileTarget: null,
        };
      }
      this.warningStartedAt = null;
      if (this.pattern === 'missile') {
        this.shotsRemaining = Math.min(2, this.missilesRemaining);
        this.nextShotAt = time;
      } else {
        this.shotsRemaining = this.pattern === 'aimed'
          ? (this.damagedVolley ? 3 : 2)
          : (this.damagedVolley ? 2 : 1);
        this.nextShotAt = time;
      }
    }

    if (this.shotsRemaining > 0 && this.warnedTarget && time >= this.nextShotAt) {
      const missileTarget = this.pattern === 'missile'
        ? this.warnedTarget : null;
      const shots = missileTarget ? [] : this.makeShots(origin, this.warnedTarget);
      if (missileTarget) this.missilesRemaining -= 1;
      this.shotsRemaining -= 1;
      this.nextShotAt = time + (missileTarget
        ? BOSS.missileSpacingMs : BOSS.burstSpacingMs);
      if (this.shotsRemaining === 0) {
        this.nextAttackAt = time + (this.damagedVolley
          ? BOSS.damagedCooldownMs : BOSS.cooldownMs);
        this.warnedTarget = null;
      }
      return { warning: null, shots, missileTarget };
    }

    if (inRange && target && time >= this.nextAttackAt &&
      this.shotsRemaining === 0) {
      this.pattern = this.nextPattern;
      this.nextPattern = this.pattern === 'aimed'
        ? (this.missilesRemaining > 0 ? 'missile' : 'spread')
        : this.pattern === 'missile' ? 'spread' : 'aimed';
      this.damagedVolley = damaged;
      this.warningStartedAt = time;
      this.warnedTarget = { x: target.x, y: target.y };
      return {
        warning: { target: this.warnedTarget, pattern: this.pattern },
        shots: [],
        missileTarget: null,
      };
    }

    return { warning: null, shots: [], missileTarget: null };
  }

  cancel(time: number): void {
    this.warningStartedAt = null;
    this.warnedTarget = null;
    this.shotsRemaining = 0;
    this.nextAttackAt = time + 800;
  }

  private makeShots(origin: BossPoint, target: BossPoint): EnemyShot[] {
    const baseAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
    const offsets = this.pattern === 'spread' ? [-0.17, 0, 0.17] : [0];
    return offsets.map((offset) => ({
      x: origin.x,
      y: origin.y,
      velocityX: Math.cos(baseAngle + offset) * BOSS.projectileSpeed,
      velocityY: Math.sin(baseAngle + offset) * BOSS.projectileSpeed,
      damage: BOSS.projectileDamage,
    }));
  }
}
