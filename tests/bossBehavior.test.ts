import { describe, expect, it } from 'vitest';

import { BOSS, HELICOPTER } from '../src/game/constants';
import { BossAttack, bossMissilePhase } from '../src/game/logic/bossBehavior';

const origin = { x: 1_500, y: 450 };
const target = { x: 1_000, y: 500 };

describe('boss attack', () => {
  it('warns before an aimed two-shot volley at the marked position', () => {
    const attack = new BossAttack();
    const first = attack.advance(1_000, origin, target);
    expect(first.warning).toEqual({ target, pattern: 'aimed' });
    expect(first.shots).toEqual([]);
    expect(attack.advance(1_000 + BOSS.warningMs - 1, origin, target).shots)
      .toEqual([]);

    const firstShot = attack.advance(1_000 + BOSS.warningMs, origin,
      { x: 1_100, y: 600 });
    expect(firstShot.shots).toHaveLength(1);
    expect(firstShot.shots[0]!.velocityX).toBeLessThan(0);
    expect(firstShot.shots[0]!.velocityY).toBeGreaterThan(0);
    expect(firstShot.shots[0]!.damage).toBe(BOSS.projectileDamage);
    expect(attack.advance(1_000 + BOSS.warningMs + 100, origin, target).shots)
      .toEqual([]);
    expect(attack.advance(1_000 + BOSS.warningMs + BOSS.burstSpacingMs,
      origin, target).shots).toHaveLength(1);
  });

  it('warns before launching two missiles, then returns to a spread volley', () => {
    const attack = new BossAttack();
    attack.advance(0, origin, target);
    attack.advance(BOSS.warningMs, origin, target);
    const lastAimedAt = BOSS.warningMs + BOSS.burstSpacingMs;
    attack.advance(lastAimedAt, origin, target);
    expect(attack.advance(lastAimedAt + BOSS.cooldownMs - 1,
      origin, target).warning).toBeNull();
    const missileStart = lastAimedAt + BOSS.cooldownMs;
    const missileWarning = attack.advance(missileStart,
      origin, target);
    expect(missileWarning.warning?.pattern).toBe('missile');
    expect(attack.advance(missileStart + BOSS.warningMs - 1,
      origin, target).missileTarget).toBeNull();
    const firstLaunch = missileStart + BOSS.warningMs;
    expect(attack.advance(firstLaunch, origin, target).missileTarget)
      .toEqual(target);
    const secondLaunch = firstLaunch + BOSS.missileSpacingMs;
    expect(attack.advance(secondLaunch, origin, target).missileTarget)
      .toEqual(target);
    const spreadWarning = attack.advance(secondLaunch + BOSS.cooldownMs,
      origin, target);
    expect(spreadWarning.warning?.pattern).toBe('spread');
    const spread = attack.advance(secondLaunch + BOSS.cooldownMs +
      BOSS.warningMs, origin, target);
    expect(spread.shots).toHaveLength(3);
    expect(spread.shots[0]!.velocityY).not.toBe(spread.shots[2]!.velocityY);
  });

  it('cancels a warning when the player escapes range', () => {
    const attack = new BossAttack();
    attack.advance(0, origin, target);
    const escaped = attack.advance(BOSS.warningMs - 10, origin,
      { x: origin.x - BOSS.attackRange - 1, y: origin.y });
    expect(escaped.warning).toBeNull();
    expect(attack.isWarning).toBe(false);
    expect(attack.advance(BOSS.warningMs + 10, origin, target).shots).toEqual([]);
  });

  it('fires a longer spread volley and recovers sooner after damage', () => {
    const attack = new BossAttack();
    attack.advance(0, origin, target);
    attack.advance(BOSS.warningMs, origin, target);
    const firstVolleyEnd = BOSS.warningMs + BOSS.burstSpacingMs;
    attack.advance(firstVolleyEnd, origin, target);

    const missileStart = firstVolleyEnd + BOSS.cooldownMs;
    attack.advance(missileStart, origin, target);
    const firstLaunch = missileStart + BOSS.warningMs;
    attack.advance(firstLaunch, origin, target);
    const lastLaunch = firstLaunch + BOSS.missileSpacingMs;
    attack.advance(lastLaunch, origin, target);
    const spreadStart = lastLaunch + BOSS.cooldownMs;
    expect(attack.advance(spreadStart, origin, target, true).warning?.pattern)
      .toBe('spread');
    expect(attack.advance(spreadStart + BOSS.warningMs, origin, target, true)
      .shots).toHaveLength(3);
    const spreadEnd = spreadStart + BOSS.warningMs + BOSS.burstSpacingMs;
    expect(attack.advance(spreadEnd, origin, target, true).shots)
      .toHaveLength(3);
    expect(attack.advance(spreadEnd + BOSS.damagedCooldownMs - 1,
      origin, target, true).warning).toBeNull();
    expect(attack.advance(spreadEnd + BOSS.damagedCooldownMs,
      origin, target, true).warning?.pattern).toBe('aimed');
  });

  it('has only three missiles and stops steering before its finite lifetime', () => {
    const attack = new BossAttack();
    let launches = 0;
    for (let time = 0; time < 65_000; time += 10) {
      if (attack.advance(time, origin, target, true).missileTarget) launches += 1;
    }
    expect(launches).toBe(BOSS.missileAmmo);
    expect(BOSS.missileSpeed).toBeLessThan(HELICOPTER.maximumHorizontalSpeed);
    expect(bossMissilePhase(BOSS.missileGuideMs - 1)).toBe('guided');
    expect(bossMissilePhase(BOSS.missileGuideMs)).toBe('ballistic');
    expect(bossMissilePhase(BOSS.missileLifetimeMs)).toBe('expired');
  });
});
