import { describe, expect, it } from 'vitest';

import {
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
