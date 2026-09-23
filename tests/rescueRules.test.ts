import { describe, expect, it } from 'vitest';

import { RESCUE_BASE, TANK } from '../src/game/constants';
import {
  hasPassengerUnloadSpacing,
  isSafeRescueLanding,
  shouldOpenRescueDoor,
} from '../src/game/logic/rescueRules';
import { HostageState } from '../src/game/logic/hostageState';
import { GameState } from '../src/game/state/GameState';

describe('rescue base landing rules', () => {
  const safeLanding = {
    helicopterLanded: true,
    helicopterX: RESCUE_BASE.centerX,
    baseCenterX: RESCUE_BASE.centerX,
    landingZoneWidth: RESCUE_BASE.landingZoneWidth,
  };

  it('accepts a safely landed helicopter inside the base', () => {
    expect(isSafeRescueLanding(safeLanding)).toBe(true);
  });

  it('rejects an airborne helicopter over the base', () => {
    expect(
      isSafeRescueLanding({ ...safeLanding, helicopterLanded: false }),
    ).toBe(false);
  });

  it('rejects a safe landing outside the base', () => {
    expect(
      isSafeRescueLanding({
        ...safeLanding,
        helicopterX:
          RESCUE_BASE.centerX + RESCUE_BASE.landingZoneWidth / 2 + 1,
      }),
    ).toBe(false);
  });
});

describe('rescue scoring', () => {
  it('increments rescued hostages and score for each unload', () => {
    const gameState = new GameState();

    gameState.recordRescue(3);
    gameState.recordRescue(2);

    expect(gameState.rescued).toBe(5);
    expect(gameState.score).toBe(5 * RESCUE_BASE.scorePerHostage);
  });

  it('adds a tank award without changing rescue progress', () => {
    const gameState = new GameState();
    gameState.recordRescue(1);

    gameState.awardScore(TANK.scoreValue);

    expect(gameState.rescued).toBe(1);
    expect(gameState.score).toBe(
      RESCUE_BASE.scorePerHostage + TANK.scoreValue,
    );
  });
});

describe('passenger unloading spacing', () => {
  it('allows unloading when no hostage is currently running', () => {
    expect(hasPassengerUnloadSpacing(350, [], 56)).toBe(true);
  });

  it('waits while the nearest runner is too close to the helicopter', () => {
    expect(hasPassengerUnloadSpacing(350, [315, 220], 56)).toBe(false);
  });

  it('allows another passenger out once every runner is far enough away', () => {
    expect(hasPassengerUnloadSpacing(350, [294, 220], 56)).toBe(true);
  });
});

describe('rescue base door', () => {
  it('opens only while at least one hostage is visible on the deck', () => {
    expect(shouldOpenRescueDoor([])).toBe(false);
    expect(
      shouldOpenRescueDoor([
        HostageState.Aboard,
        HostageState.Waiting,
      ]),
    ).toBe(false);
    expect(
      shouldOpenRescueDoor([
        HostageState.Rescued,
        HostageState.RunningToBase,
      ]),
    ).toBe(true);
  });
});
