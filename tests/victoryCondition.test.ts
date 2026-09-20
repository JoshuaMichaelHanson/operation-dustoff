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

  it('provides enough camp hostages to reach the mission target', () => {
    const availableHostages =
      PRISON_CAMP.positions.length * PRISON_CAMP.hostageCount;

    expect(availableHostages).toBeGreaterThanOrEqual(MISSION.rescueTarget);
  });
});
