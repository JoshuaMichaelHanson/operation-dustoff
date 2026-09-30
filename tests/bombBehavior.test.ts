import { describe, expect, it } from 'vitest';

import { BOMB } from '../src/game/constants';
import {
  getTargetsWithinBombBlast,
  getBombLaunchVelocity,
  isWithinBombBlast,
} from '../src/game/logic/bombBehavior';

describe('bomb launch behavior', () => {
  it('drops downward while carrying part of helicopter momentum', () => {
    expect(getBombLaunchVelocity(200)).toEqual({
      x: 200 * BOMB.horizontalCarry,
      y: BOMB.initialDownwardSpeed,
    });
    expect(getBombLaunchVelocity(-120).x).toBeLessThan(0);
  });

  it('drops vertically while the helicopter is hovering', () => {
    expect(getBombLaunchVelocity(0)).toEqual({
      x: 0,
      y: BOMB.initialDownwardSpeed,
    });
  });
});

describe('bomb blast', () => {
  it('includes targets on the blast edge', () => {
    expect(isWithinBombBlast(100, 200, 160, 280, 100)).toBe(true);
  });

  it('excludes targets beyond the blast edge', () => {
    expect(isWithinBombBlast(100, 200, 161, 280, 100)).toBe(false);
  });

  it('snapshots exposed targets before the explosion releases captives', () => {
    const exposedHostage = { id: 'exposed', x: 120, y: 200 };
    const hostages = [exposedHostage];
    const blastTargets = getTargetsWithinBombBlast(
      hostages,
      100,
      200,
      96,
    );

    hostages.push({ id: 'newly-released', x: 100, y: 200 });

    expect(blastTargets).toEqual([exposedHostage]);
  });
});
