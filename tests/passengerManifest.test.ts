import { describe, expect, it } from 'vitest';

import { PassengerManifest } from '../src/game/logic/passengerManifest';

describe('passenger manifest', () => {
  it('does not exceed passenger capacity', () => {
    const passengers = new PassengerManifest(2);

    expect(passengers.tryBoard()).toBe(true);
    expect(passengers.tryBoard()).toBe(true);
    expect(passengers.tryBoard()).toBe(false);
    expect(passengers.count).toBe(2);
  });

  it('unloads passengers one at a time', () => {
    const passengers = new PassengerManifest(8);
    passengers.tryBoard();
    passengers.tryBoard();
    passengers.tryBoard();

    expect(passengers.unloadOne()).toBe(true);
    expect(passengers.count).toBe(2);
    expect(passengers.unloadOne()).toBe(true);
    expect(passengers.unloadOne()).toBe(true);
    expect(passengers.count).toBe(0);
    expect(passengers.unloadOne()).toBe(false);
  });
});
