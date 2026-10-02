import { describe, expect, it } from 'vitest';

import { FuelTank } from '../src/game/logic/fuel';

describe('fuel route rules', () => {
  it('uses fuel only in flight and refills on a safe base landing', () => {
    const fuel = new FuelTank(55_000);
    expect(fuel.update(10_000, false, false)).toBe('none');
    expect(fuel.secondsRemaining).toBe(55);
    expect(fuel.update(10_000, true, false)).toBe('none');
    expect(fuel.secondsRemaining).toBe(45);
    expect(fuel.update(10_000, false, false)).toBe('none');
    expect(fuel.secondsRemaining).toBe(45);
    expect(fuel.update(16, false, true)).toBe('refueled');
    expect(fuel.secondsRemaining).toBe(55);
    expect(fuel.update(16, false, true)).toBe('none');
  });

  it('warns based on the return distance and fuel reserve', () => {
    const fuel = new FuelTank(55_000);
    expect(fuel.shouldReturn(1_400)).toBe(false);
    fuel.update(41_000, true, false);
    expect(fuel.shouldReturn(1_400)).toBe(false);
    fuel.update(1_000, true, false);
    expect(fuel.shouldReturn(1_400)).toBe(true);
    expect(fuel.shouldReturn(200)).toBe(false);
    fuel.update(6_000, true, false);
    expect(fuel.shouldReturn(200)).toBe(true);
  });

  it('runs empty once, then refills after a lost helicopter respawns', () => {
    const fuel = new FuelTank(55_000);
    expect(fuel.update(54_500, true, false)).toBe('none');
    expect(fuel.isCritical).toBe(true);
    expect(fuel.update(1_000, true, false)).toBe('empty');
    expect(fuel.remainingMs).toBe(0);
    expect(fuel.ratio).toBe(0);
    expect(fuel.update(1_000, true, false)).toBe('none');
    fuel.refill();
    expect(fuel.ratio).toBe(1);
  });
});
