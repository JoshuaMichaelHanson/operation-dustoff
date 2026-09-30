import { describe, expect, it } from 'vitest';

import { formatIntelCue, nearestX } from '../src/game/logic/battlefieldIntel';
import {
  canStartHostageThreat,
  hostageThreatIntervalMs,
  isThreatTargetStillExposed,
} from '../src/game/logic/hostageThreat';
import {
  canHostageBeCrushed,
  canHostageBeKilled,
  HostageState,
  isHostageTransitionAllowed,
} from '../src/game/logic/hostageState';
import { calculateFullLoadBonus } from '../src/game/logic/rescueRules';
import { RESCUE_BASE } from '../src/game/constants';

describe('hard-mission POW pressure', () => {
  it('leaves Green Valley unchanged and warns only for nearby exposed POWs', () => {
    expect(canStartHostageThreat(1, HostageState.Waiting, 100)).toBe(false);
    expect(canStartHostageThreat(2, HostageState.Waiting, 100)).toBe(true);
    expect(canStartHostageThreat(3, HostageState.RunningToHelicopter, 650)).toBe(true);
    expect(canStartHostageThreat(2, HostageState.Waiting, 651)).toBe(false);
    expect(canStartHostageThreat(3, HostageState.Aboard, 100)).toBe(false);
    expect(canStartHostageThreat(3, HostageState.RunningToBase, 100)).toBe(false);
  });

  it('lets a threatened POW pause, survive the warning, and resume boarding', () => {
    for (const state of [HostageState.RunningOut, HostageState.Waiting,
      HostageState.RunningToHelicopter]) {
      expect(isHostageTransitionAllowed(state, HostageState.TakingCover)).toBe(true);
    }
    expect(isThreatTargetStillExposed(HostageState.TakingCover)).toBe(true);
    expect(isHostageTransitionAllowed(HostageState.TakingCover, HostageState.Waiting)).toBe(true);
    expect(canHostageBeKilled(HostageState.TakingCover)).toBe(true);
    expect(canHostageBeCrushed({
      hostageState: HostageState.TakingCover,
      helicopterLanded: false,
      helicopterVelocityY: 100,
      helicopterBottom: 750,
      hostageCenterY: 785,
    })).toBe(true);
    expect(isHostageTransitionAllowed(HostageState.Waiting,
      HostageState.RunningToHelicopter)).toBe(true);
    expect(isThreatTargetStillExposed(HostageState.Aboard)).toBe(false);
    expect(hostageThreatIntervalMs(3)).toBeLessThan(hostageThreatIntervalMs(2));
  });
});

describe('rescue choice and battlefield intel', () => {
  it('awards the bonus only for a full manifest', () => {
    expect(calculateFullLoadBonus(8, 8, RESCUE_BASE.fullLoadBonus)).toBe(500);
    expect(calculateFullLoadBonus(7, 8, RESCUE_BASE.fullLoadBonus)).toBe(0);
    expect(calculateFullLoadBonus(0, 8, RESCUE_BASE.fullLoadBonus)).toBe(0);
  });

  it('points to the nearest live objective and handles no remaining target', () => {
    expect(nearestX(500, [200, 700, 1400])).toBe(700);
    expect(nearestX(500, [])).toBeNull();
    expect(formatIntelCue('POW', 500, 700)).toBe('POW ▶ 200m');
    expect(formatIntelCue('BASE', 500, 200)).toBe('BASE ◀ 300m');
    expect(formatIntelCue('CAMP', 500, null)).toBe('CAMP —');
  });
});
