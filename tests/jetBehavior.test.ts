import { describe, expect, it } from 'vitest';

import { JET, WORLD_WIDTH } from '../src/game/constants';
import {
  getJetAttackVelocity,
  getJetSpawnX,
  isJetPastWorldBounds,
} from '../src/game/logic/jetBehavior';

describe('jet flyovers', () => {
  it('spawns beyond the approached world edge', () => {
    expect(getJetSpawnX(1, WORLD_WIDTH, JET.spawnMargin)).toBe(
      -JET.spawnMargin,
    );
    expect(getJetSpawnX(-1, WORLD_WIDTH, JET.spawnMargin)).toBe(
      WORLD_WIDTH + JET.spawnMargin,
    );
  });

  it('despawns only after crossing the opposite world edge', () => {
    expect(
      isJetPastWorldBounds(
        WORLD_WIDTH,
        1,
        WORLD_WIDTH,
        JET.spawnMargin,
      ),
    ).toBe(false);
    expect(
      isJetPastWorldBounds(
        WORLD_WIDTH + JET.spawnMargin + 1,
        1,
        WORLD_WIDTH,
        JET.spawnMargin,
      ),
    ).toBe(true);
    expect(
      isJetPastWorldBounds(
        -JET.spawnMargin - 1,
        -1,
        WORLD_WIDTH,
        JET.spawnMargin,
      ),
    ).toBe(true);
  });
});

describe('jet attack', () => {
  it('aims at an in-range target with the configured projectile speed', () => {
    const velocity = getJetAttackVelocity(
      0,
      0,
      300,
      400,
      JET.projectileSpeed,
      JET.fireRange,
    );

    expect(velocity).not.toBeNull();
    expect(Math.hypot(velocity?.x ?? 0, velocity?.y ?? 0)).toBeCloseTo(
      JET.projectileSpeed,
    );
    expect(velocity?.x).toBeGreaterThan(0);
    expect(velocity?.y).toBeGreaterThan(0);
  });

  it('does not attack a target outside strafing range', () => {
    expect(
      getJetAttackVelocity(
        0,
        0,
        JET.fireRange + 1,
        0,
        JET.projectileSpeed,
        JET.fireRange,
      ),
    ).toBeNull();
  });
});
