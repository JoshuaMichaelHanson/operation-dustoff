import { describe, expect, it } from 'vitest';

import { GROUND_Y, PRISON_CAMP } from '../src/game/constants';
import {
  getLevelConfig,
  getLevelIndex,
  getNextLevelIndex,
  LEVELS,
} from '../src/game/levels/levelConfig';

describe('level configuration', () => {
  it('defines three missions with increasing difficulty', () => {
    expect(LEVELS).toHaveLength(3);
    expect(LEVELS.map((level) => level.difficultyRank)).toEqual([1, 2, 3]);
    expect(LEVELS[1]!.tankPositions.length).toBeGreaterThan(
      LEVELS[0]!.tankPositions.length,
    );
    expect(LEVELS[2]!.jetSpawnIntervalMs).toBeLessThan(
      LEVELS[1]!.jetSpawnIntervalMs,
    );
  });

  it('provides enough hostages and keeps objectives inside each world', () => {
    for (const level of LEVELS) {
      expect(
        level.campPositions.length * PRISON_CAMP.hostageCount,
      ).toBeGreaterThanOrEqual(level.rescueTarget);
      for (const x of [...level.campPositions, ...level.tankPositions]) {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(level.worldWidth);
      }
    }
  });

  it('introduces visible flight-path obstacles only on harder missions', () => {
    expect(LEVELS[0]!.flightObstacles).toHaveLength(0);
    for (const level of LEVELS.slice(1)) {
      expect(level.flightObstacles.length).toBeGreaterThan(0);
      for (const obstacle of level.flightObstacles) {
        expect(obstacle.height).toBeGreaterThan(0);
        expect(obstacle.height).toBeLessThan(GROUND_Y - 200);
        expect(obstacle.x - obstacle.width / 2).toBeGreaterThan(600);
        expect(obstacle.x + obstacle.width / 2).toBeLessThan(level.worldWidth);
      }
    }
  });

  it('clamps invalid level selections and ends progression after the final mission', () => {
    expect(getLevelConfig(-10)).toBe(LEVELS[0]);
    expect(getLevelConfig(Number.NaN)).toBe(LEVELS[0]);
    expect(getLevelConfig(100)).toBe(LEVELS[LEVELS.length - 1]);
    expect(getLevelIndex(1.9)).toBe(1);
    expect(getNextLevelIndex(0)).toBe(1);
    expect(getNextLevelIndex(LEVELS.length - 1)).toBeNull();
  });
});
