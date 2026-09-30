import { describe, expect, it } from 'vitest';

import {
  getHostageRallyPositions,
  isGroundPathClear,
} from '../src/game/logic/hostageRally';
import { LEVELS } from '../src/game/levels/levelConfig';

const rallyDistance = 110;
const rallySpacing = 34;

describe('hostage rally positions', () => {
  it('preserves the alternating formation in open terrain', () => {
    expect(
      getHostageRallyPositions(
        2_100,
        7,
        [],
        3_200,
        rallyDistance,
        rallySpacing,
      ),
    ).toEqual([1_990, 2_210, 1_956, 2_244, 1_922, 2_278, 1_888]);
  });

  it('relocates blocked rally points to paths clear of a solid ridge', () => {
    const obstacles = [{ x: 1_840, width: 240 }];
    const positions = getHostageRallyPositions(
      2_100,
      7,
      obstacles,
      3_600,
      rallyDistance,
      rallySpacing,
    );

    expect(positions).toHaveLength(7);
    expect(new Set(positions).size).toBe(7);
    for (const position of positions) {
      expect(isGroundPathClear(2_100, position, obstacles, 16)).toBe(true);
    }
  });

  it('keeps fallback positions inside a narrow world edge', () => {
    const obstacles = [{ x: 3_160, width: 250 }];
    const positions = getHostageRallyPositions(
      3_400,
      7,
      obstacles,
      3_600,
      rallyDistance,
      rallySpacing,
    );

    expect(Math.min(...positions)).toBeGreaterThanOrEqual(16);
    expect(Math.max(...positions)).toBeLessThanOrEqual(3_584);
    expect(new Set(positions).size).toBe(7);
    for (const position of positions) {
      expect(isGroundPathClear(3_400, position, obstacles, 16)).toBe(true);
    }
  });

  it('finds seven distinct reachable positions for every authored camp', () => {
    for (const level of LEVELS) {
      for (const campX of level.campPositions) {
        const positions = getHostageRallyPositions(
          campX,
          7,
          level.flightObstacles,
          level.worldWidth,
          rallyDistance,
          rallySpacing,
        );

        expect(new Set(positions).size).toBe(7);
        for (const position of positions) {
          expect(
            isGroundPathClear(
              campX,
              position,
              level.flightObstacles,
              16,
            ),
          ).toBe(true);
        }
      }
    }
  });
});
