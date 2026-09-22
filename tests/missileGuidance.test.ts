import { describe, expect, it } from 'vitest';

import { MISSILE } from '../src/game/constants';
import {
  canLockMissileTarget,
  getHomingMissileVelocity,
} from '../src/game/logic/missileGuidance';

describe('missile target lock', () => {
  it('locks an in-range target ahead of the helicopter', () => {
    expect(
      canLockMissileTarget(
        { x: 100, y: 500 },
        { x: 700, y: 350 },
        1,
        MISSILE.lockRange,
      ),
    ).toBe(true);
  });

  it('rejects targets behind the helicopter or outside lock range', () => {
    expect(
      canLockMissileTarget(
        { x: 500, y: 500 },
        { x: 400, y: 350 },
        1,
        MISSILE.lockRange,
      ),
    ).toBe(false);
    expect(
      canLockMissileTarget(
        { x: 0, y: 0 },
        { x: MISSILE.lockRange + 1, y: 0 },
        1,
        MISSILE.lockRange,
      ),
    ).toBe(false);
  });
});

describe('missile guidance', () => {
  it('turns toward the target without exceeding its turn rate', () => {
    const velocity = getHomingMissileVelocity(
      { x: MISSILE.speed, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: -500 },
      MISSILE.speed,
      MISSILE.maximumTurnRadiansPerSecond,
      100,
    );
    const angle = Math.atan2(velocity.y, velocity.x);

    expect(angle).toBeCloseTo(
      -MISSILE.maximumTurnRadiansPerSecond * 0.1,
    );
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(MISSILE.speed);
  });

  it('intercepts a representative jet flyover before its lifetime expires', () => {
    const frameMs = 1000 / 60;
    const missile = { x: 332, y: 765 };
    const jet = { x: 800, y: 350 };
    let velocity = { x: MISSILE.speed, y: 0 };
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let elapsed = 0; elapsed < MISSILE.lifetimeMs; elapsed += frameMs) {
      velocity = getHomingMissileVelocity(
        velocity,
        missile,
        jet,
        MISSILE.speed,
        MISSILE.maximumTurnRadiansPerSecond,
        frameMs,
      );
      missile.x += velocity.x * (frameMs / 1000);
      missile.y += velocity.y * (frameMs / 1000);
      jet.x += 320 * (frameMs / 1000);
      closestDistance = Math.min(
        closestDistance,
        Math.hypot(jet.x - missile.x, jet.y - missile.y),
      );
    }

    expect(closestDistance).toBeLessThan(10);
  });
});
