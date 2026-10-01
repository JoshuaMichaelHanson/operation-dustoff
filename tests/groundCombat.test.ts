import { describe, expect, it } from 'vitest';

import { GROUND_Y } from '../src/game/constants';
import { GroundCombatModel } from '../src/game/logic/groundCombat';

const baseHelicopter = { x: 280, y: 735, isLanded: true, active: true };
const campHelicopter = { x: 1700, y: 765, isLanded: true, active: true };
const pows = [{ id: 0, x: 1810 }, { id: 1, x: 1840 }];

function playTruckAttack(model: GroundCombatModel): string[] {
  const events: string[] = [];
  for (let time = 100; time <= 14_000; time += 100) {
    events.push(...model.update(time, 100, campHelicopter, pows)
      .map((event) => event.type));
  }
  return events;
}

describe('SF transport and ground defense', () => {
  it('boards two soldiers at base, deploys at a camp, and reboards nearby', () => {
    const model = new GroundCombatModel(3600, 390, []);
    model.update(0, 16, baseHelicopter, []);
    expect(model.sfAboard).toBe(2);
    expect(model.commandSf({ ...campHelicopter, isLanded: false }, 1000))
      .toBe(false);
    expect(model.commandSf(campHelicopter, 1000)).toBe(true);
    expect(model.sfAboard).toBe(0);
    expect(model.sfDeployed).toBe(2);
    expect(model.commandSf(campHelicopter, 1100)).toBe(true);
    expect(model.sfAboard).toBe(2);
  });

  it('lets deployed SF stop one truck squad before it kills nearby POWs', () => {
    const model = new GroundCombatModel(3600, 390, []);
    model.update(0, 16, baseHelicopter, []);
    model.commandSf(campHelicopter, 0);
    expect(model.triggerTruck(1700, 0)).toBe(true);
    expect(model.triggerTruck(2450, 0)).toBe(false);
    const events = playTruckAttack(model);
    expect(events).toContain('truckArrived');
    expect(events).toContain('hostilesUnloaded');
    expect(events).toContain('hostileKilled');
    expect(events).not.toContain('powHit');
    expect(model.hostileAlive).toBe(0);
  });

  it('lets hostiles threaten POWs if the team stays aboard', () => {
    const model = new GroundCombatModel(3600, 390, []);
    model.update(0, 16, baseHelicopter, []);
    model.triggerTruck(1700, 0);
    expect(playTruckAttack(model)).toContain('powHit');
  });

  it('allows a truck to be destroyed before unloading', () => {
    const model = new GroundCombatModel(3600, 390, []);
    model.triggerTruck(1700, 0);
    model.update(1300, 100, campHelicopter, pows);
    const truckX = model.truck!.x;
    const hit = model.damageAt(truckX, GROUND_Y - 20, 4, 0, 1400);
    expect(hit.hit).toBe(true);
    expect(hit.events).toContainEqual({ type: 'truckDestroyed', x: truckX });
    expect(playTruckAttack(model)).not.toContain('hostilesUnloaded');
  });

  it('uses cover after a hit and keeps soldiers out of solid ridge footprints', () => {
    const model = new GroundCombatModel(3600, 390,
      [{ x: 1500, width: 200 }]);
    model.update(0, 16, baseHelicopter, []);
    model.commandSf({ ...campHelicopter, x: 1300 }, 0);
    for (let time = 100; time <= 9000; time += 100) {
      model.update(time, 100, { ...campHelicopter, x: 1300 },
        [{ id: 0, x: 1700 }]);
    }
    const sf = model.units[0]!;
    expect(sf.x).toBeLessThanOrEqual(1392);
    expect(model.damageAt(sf.x, GROUND_Y - 16, 1, 0, 9100).hit).toBe(false);
    const hit = model.damageAt(sf.x, GROUND_Y - 16, 1, 0, 9100, 'sf');
    expect(hit.hit).toBe(true);
    expect(sf.state).toBe('cover');
    model.update(9900, 100, campHelicopter, []);
    expect(sf.state).toBe('cover');
    model.update(9950, 50, campHelicopter, []);
    expect(sf.state).toBe('deployed');
  });
});
