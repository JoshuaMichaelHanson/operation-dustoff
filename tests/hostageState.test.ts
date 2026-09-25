import { describe, expect, it } from 'vitest';

import {
  canHostageBeCrushed,
  canHostageBeKilled,
  canBeginBoarding,
  HostageState,
  isHostageTransitionAllowed,
} from '../src/game/logic/hostageState';

describe('hostage state transitions', () => {
  it('allows the complete rescue progression', () => {
    expect(
      isHostageTransitionAllowed(
        HostageState.Captive,
        HostageState.RunningOut,
      ),
    ).toBe(true);
    expect(
      isHostageTransitionAllowed(
        HostageState.RunningOut,
        HostageState.Waiting,
      ),
    ).toBe(true);
    expect(
      isHostageTransitionAllowed(
        HostageState.Waiting,
        HostageState.RunningToHelicopter,
      ),
    ).toBe(true);
    expect(
      isHostageTransitionAllowed(
        HostageState.RunningToHelicopter,
        HostageState.Aboard,
      ),
    ).toBe(true);
    expect(
      isHostageTransitionAllowed(
        HostageState.Aboard,
        HostageState.RunningToBase,
      ),
    ).toBe(true);
    expect(
      isHostageTransitionAllowed(
        HostageState.RunningToBase,
        HostageState.Rescued,
      ),
    ).toBe(true);
  });

  it('allows a hostage to stop approaching if boarding becomes unsafe', () => {
    expect(
      isHostageTransitionAllowed(
        HostageState.RunningToHelicopter,
        HostageState.Waiting,
      ),
    ).toBe(true);
  });

  it('rejects skipping directly from waiting to aboard', () => {
    expect(
      isHostageTransitionAllowed(HostageState.Waiting, HostageState.Aboard),
    ).toBe(false);
  });

  it('rejects scoring an aboard hostage before they run into base', () => {
    expect(
      isHostageTransitionAllowed(HostageState.Aboard, HostageState.Rescued),
    ).toBe(false);
  });

  it('returns an aboard hostage to waiting after a helicopter is lost', () => {
    expect(
      isHostageTransitionAllowed(HostageState.Aboard, HostageState.Waiting),
    ).toBe(true);
  });

  it('allows exposed hostages to enter the terminal dead state', () => {
    const exposedStates = [
      HostageState.RunningOut,
      HostageState.Waiting,
      HostageState.RunningToHelicopter,
      HostageState.RunningToBase,
    ];

    for (const state of exposedStates) {
      expect(canHostageBeKilled(state)).toBe(true);
      expect(isHostageTransitionAllowed(state, HostageState.Dead)).toBe(true);
    }
  });

  it('protects captive, aboard, and rescued hostages from friendly fire', () => {
    expect(canHostageBeKilled(HostageState.Captive)).toBe(false);
    expect(canHostageBeKilled(HostageState.Aboard)).toBe(false);
    expect(canHostageBeKilled(HostageState.Rescued)).toBe(false);
  });

  it('does not allow a dead hostage to be rescued', () => {
    expect(
      isHostageTransitionAllowed(HostageState.Dead, HostageState.Rescued),
    ).toBe(false);
    expect(canHostageBeKilled(HostageState.Dead)).toBe(false);
  });
});

describe('hostage boarding rules', () => {
  const safeBoardingSituation = {
    helicopterLanded: true,
    distanceToHelicopter: 80,
    boardingRadius: 190,
    passengerCount: 2,
    passengerCapacity: 8,
  };

  it('allows boarding near a landed helicopter with room', () => {
    expect(canBeginBoarding(safeBoardingSituation)).toBe(true);
  });

  it('does not allow boarding while the helicopter is airborne', () => {
    expect(
      canBeginBoarding({
        ...safeBoardingSituation,
        helicopterLanded: false,
      }),
    ).toBe(false);
  });

  it('does not allow boarding outside the boarding radius', () => {
    expect(
      canBeginBoarding({
        ...safeBoardingSituation,
        distanceToHelicopter: safeBoardingSituation.boardingRadius + 1,
      }),
    ).toBe(false);
  });

  it('does not allow boarding when passenger capacity is full', () => {
    expect(
      canBeginBoarding({
        ...safeBoardingSituation,
        passengerCount: safeBoardingSituation.passengerCapacity,
      }),
    ).toBe(false);
  });
});

describe('hostage crushing rules', () => {
  const descendingFromAbove = {
    hostageState: HostageState.Waiting,
    helicopterLanded: false,
    helicopterVelocityY: 60,
    helicopterBottom: 775,
    hostageCenterY: 777,
  };

  it('crushes an exposed hostage while descending from above', () => {
    expect(canHostageBeCrushed(descendingFromAbove)).toBe(true);
  });

  it('does not crush hostages while landed, climbing, or below them', () => {
    expect(
      canHostageBeCrushed({
        ...descendingFromAbove,
        helicopterLanded: true,
      }),
    ).toBe(false);
    expect(
      canHostageBeCrushed({
        ...descendingFromAbove,
        helicopterVelocityY: -20,
      }),
    ).toBe(false);
    expect(
      canHostageBeCrushed({
        ...descendingFromAbove,
        helicopterBottom: 780,
      }),
    ).toBe(false);
  });

  it('protects captive, aboard, unloading, rescued, and dead hostages', () => {
    const protectedStates = [
      HostageState.Captive,
      HostageState.Aboard,
      HostageState.RunningToBase,
      HostageState.Rescued,
      HostageState.Dead,
    ];

    for (const hostageState of protectedStates) {
      expect(
        canHostageBeCrushed({ ...descendingFromAbove, hostageState }),
      ).toBe(false);
    }
  });
});
