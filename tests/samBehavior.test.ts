import { describe, expect, it } from 'vitest';

import { SAM } from '../src/game/constants';
import { SamAttack, canSamGuide, canSamLock } from '../src/game/logic/samBehavior';

const launcher = { x: 1690, y: 744 };
const aircraft = { x: 2100, y: 410 };

describe('SAM sight and evasion', () => {
  it('locks only on a high aircraft in range with a clear route', () => {
    expect(canSamLock(launcher, aircraft, [])).toBe(true);
    expect(canSamLock(launcher, { x: 2100, y: 700 }, [])).toBe(false);
    expect(canSamLock(launcher, { x: 2800, y: 400 }, [])).toBe(false);
    expect(canSamLock(launcher, aircraft,
      [{ x: 1900, width: 220, height: 180 }])).toBe(false);
    expect(canSamLock(launcher, { x: 2100, y: 100 },
      [{ x: 1900, width: 220, height: 180 }])).toBe(true);
  });

  it('loses guidance once the aircraft dives under the tracking ceiling', () => {
    expect(canSamGuide(aircraft)).toBe(true);
    expect(canSamGuide({ x: aircraft.x,
      y: 790 - SAM.minimumTargetRise })).toBe(true);
    expect(canSamGuide({ x: aircraft.x,
      y: 791 - SAM.minimumTargetRise })).toBe(false);
  });
});

describe('SAM warning and reload', () => {
  it('gives a full lock warning before one launch and then cools down', () => {
    const attack = new SamAttack();
    expect(attack.advance(0, launcher, aircraft, []).warningTarget).toEqual(aircraft);
    expect(attack.advance(SAM.warningMs - 1, launcher, aircraft, []).launchTarget)
      .toBeNull();
    expect(attack.advance(SAM.warningMs, launcher, aircraft, []).launchTarget)
      .toEqual(aircraft);
    expect(attack.isWarning).toBe(false);
    expect(attack.advance(SAM.warningMs + 1, launcher, aircraft, []).launchTarget)
      .toBeNull();
    expect(attack.advance(SAM.warningMs + SAM.cooldownMs - 1,
      launcher, aircraft, []).warningTarget).toBeNull();
    expect(attack.advance(SAM.warningMs + SAM.cooldownMs,
      launcher, aircraft, []).warningTarget).toEqual(aircraft);
  });

  it('cancels and delays a lock when the aircraft dives or takes ridge cover', () => {
    const attack = new SamAttack();
    attack.advance(0, launcher, aircraft, []);
    expect(attack.isWarning).toBe(true);
    expect(attack.advance(500, launcher, { x: 2100, y: 700 }, []).launchTarget)
      .toBeNull();
    expect(attack.isWarning).toBe(false);
    expect(attack.advance(500 + SAM.cancelCooldownMs - 1,
      launcher, aircraft, []).warningTarget).toBeNull();
    expect(attack.advance(500 + SAM.cancelCooldownMs,
      launcher, aircraft, []).warningTarget).toEqual(aircraft);
    expect(attack.advance(1900, launcher, aircraft,
      [{ x: 1900, width: 220, height: 230 }]).warningTarget).toBeNull();
  });
});
