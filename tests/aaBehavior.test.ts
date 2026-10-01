import { describe, expect, it } from 'vitest';

import { AA_GUN } from '../src/game/constants';
import {
  AaAttack,
  canAaTrack,
  getAaBurstShot,
} from '../src/game/logic/aaBehavior';

const muzzle = { x: 1650, y: 746 };
const airTarget = { x: 2100, y: 400 };

describe('AA sight lines and counterplay', () => {
  it('tracks exposed aircraft but cannot aim low, overhead, or beyond range', () => {
    expect(canAaTrack(muzzle, airTarget, [])).toBe(true);
    expect(canAaTrack(muzzle, { x: 2100, y: 690 }, [])).toBe(false);
    expect(canAaTrack(muzzle, { x: 1700, y: 300 }, [])).toBe(false);
    expect(canAaTrack(muzzle, { x: 2600, y: 400 }, [])).toBe(false);
  });

  it('does not warn or fire through a blocking ridge', () => {
    const ridge = [{ x: 1900, width: 200, height: 220 }];
    expect(canAaTrack(muzzle, airTarget, ridge)).toBe(false);
    expect(canAaTrack(muzzle, { x: 2100, y: 100 }, ridge)).toBe(true);
  });

  it('fires a fixed-speed shot with the configured damage', () => {
    const shot = getAaBurstShot(muzzle, airTarget);
    expect(Math.hypot(shot.velocityX, shot.velocityY)).toBeCloseTo(
      AA_GUN.projectileSpeed,
    );
    expect(shot.velocityX).toBeGreaterThan(0);
    expect(shot.velocityY).toBeLessThan(0);
    expect(shot.damage).toBe(AA_GUN.projectileDamage);
  });
});

describe('AA telegraph and burst', () => {
  it('warns before three spaced shots and then cools down', () => {
    const attack = new AaAttack();
    expect(attack.advance(0, muzzle, airTarget, []).warningTarget).toEqual(airTarget);
    expect(attack.advance(AA_GUN.warningMs - 1, muzzle, airTarget, []).shot).toBeNull();
    expect(attack.advance(AA_GUN.warningMs, muzzle, airTarget, []).shot).not.toBeNull();
    expect(attack.advance(
      AA_GUN.warningMs + AA_GUN.burstSpacingMs - 1,
      muzzle,
      airTarget,
      [],
    ).shot).toBeNull();
    expect(attack.advance(
      AA_GUN.warningMs + AA_GUN.burstSpacingMs,
      muzzle,
      airTarget,
      [],
    ).shot).not.toBeNull();
    const finalShotAt = AA_GUN.warningMs + AA_GUN.burstSpacingMs * 2;
    expect(attack.advance(finalShotAt, muzzle, airTarget, []).shot).not.toBeNull();
    expect(attack.advance(finalShotAt + 1, muzzle, airTarget, []).shot).toBeNull();
    expect(attack.advance(
      finalShotAt + AA_GUN.cooldownMs,
      muzzle,
      airTarget,
      [],
    ).warningTarget).toEqual(airTarget);
  });

  it('cancels the warning when the pilot dives low', () => {
    const attack = new AaAttack();
    attack.advance(0, muzzle, airTarget, []);
    expect(attack.isWarning).toBe(true);
    expect(attack.advance(500, muzzle, { x: 2100, y: 690 }, []).shot).toBeNull();
    expect(attack.isWarning).toBe(false);
    expect(attack.advance(500 + AA_GUN.cancelCooldownMs - 1,
      muzzle, airTarget, []).warningTarget).toBeNull();
    expect(attack.advance(500 + AA_GUN.cancelCooldownMs,
      muzzle, airTarget, []).warningTarget).toEqual(airTarget);
  });
});
