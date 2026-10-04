import { describe, expect, it } from 'vitest';

import { MISSION, PRISON_CAMP } from '../src/game/constants';
import { GameState } from '../src/game/state/GameState';

describe('victory condition', () => {
  it('uses the configured rescue target', () => {
    const gameState = new GameState();

    expect(gameState.rescueTarget).toBe(MISSION.rescueTarget);
    gameState.recordRescue(MISSION.rescueTarget - 1);
    expect(gameState.isVictory).toBe(false);

    gameState.recordRescue(1);
    expect(gameState.isVictory).toBe(true);
  });

  it('supports a different rescue target without changing scoring', () => {
    const gameState = new GameState(3);

    gameState.recordRescue(3);

    expect(gameState.isVictory).toBe(true);
    expect(gameState.score).toBe(300);
  });

  it('requires both boss defeat and rescues in either order for the finale', () => {
    const rescueFirst = new GameState(6, undefined, true);
    rescueFirst.recordRescue(6);
    expect(rescueFirst.isVictory).toBe(false);
    rescueFirst.defeatBoss();
    expect(rescueFirst.isVictory).toBe(true);

    const bossFirst = new GameState(6, undefined, true);
    bossFirst.defeatBoss();
    expect(bossFirst.isVictory).toBe(false);
    bossFirst.recordRescue(6);
    expect(bossFirst.isVictory).toBe(true);
  });

  it('carries score and remaining helicopters into the next mission', () => {
    const gameState = new GameState(7, { score: 900, lives: 2 });

    expect(gameState.score).toBe(900);
    expect(gameState.lives).toBe(2);
    expect(gameState.rescued).toBe(0);

    gameState.recordRescue(1);
    expect(gameState.score).toBe(1000);
  });

  it('provides enough camp hostages to reach the mission target', () => {
    const availableHostages =
      PRISON_CAMP.positions.length * PRISON_CAMP.hostageCount;

    expect(availableHostages).toBeGreaterThanOrEqual(MISSION.rescueTarget);
  });
});
