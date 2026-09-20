import { describe, expect, it } from 'vitest';

import { HELICOPTER, PLAYER } from '../src/game/constants';
import { Health } from '../src/game/logic/health';
import { GameState } from '../src/game/state/GameState';

describe('helicopter health', () => {
  it('reduces health and reports destruction at zero', () => {
    const health = new Health(HELICOPTER.maximumHealth);

    expect(health.takeDamage(25)).toBe(false);
    expect(health.current).toBe(75);
    expect(health.takeDamage(100)).toBe(true);
    expect(health.current).toBe(0);
    expect(health.takeDamage(25)).toBe(false);
  });

  it('restores full health for a respawn', () => {
    const health = new Health(HELICOPTER.maximumHealth);
    health.takeDamage(75);

    health.reset();

    expect(health.current).toBe(HELICOPTER.maximumHealth);
  });
});

describe('player lives', () => {
  it('decrements lives and triggers game over at zero', () => {
    const gameState = new GameState();

    expect(gameState.lives).toBe(PLAYER.startingLives);
    expect(gameState.loseLife()).toBe(2);
    expect(gameState.isGameOver).toBe(false);
    expect(gameState.loseLife()).toBe(1);
    expect(gameState.loseLife()).toBe(0);
    expect(gameState.isGameOver).toBe(true);
    expect(gameState.loseLife()).toBe(0);
  });

  it('keeps rescue progress after a helicopter is lost', () => {
    const gameState = new GameState();
    gameState.recordRescue(2);

    gameState.loseLife();

    expect(gameState.rescued).toBe(2);
    expect(gameState.score).toBe(200);
  });
});
