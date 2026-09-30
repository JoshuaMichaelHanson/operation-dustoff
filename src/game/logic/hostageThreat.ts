import { HostageState } from './hostageState';

export const HOSTAGE_THREAT = {
  warningMs: 1600,
  coverReactionMs: 700,
  initialDelayMs: 2800,
  retryMs: 700,
} as const;

export function canStartHostageThreat(
  difficultyRank: number,
  state: HostageState,
  distanceToHelicopter: number,
): boolean {
  return difficultyRank > 1 &&
    distanceToHelicopter <= 650 &&
    [HostageState.RunningOut, HostageState.Waiting,
      HostageState.RunningToHelicopter].includes(state);
}

export function isThreatTargetStillExposed(state: HostageState): boolean {
  return [HostageState.RunningOut, HostageState.Waiting,
    HostageState.RunningToHelicopter, HostageState.TakingCover].includes(state);
}

export function hostageThreatIntervalMs(difficultyRank: number): number {
  return difficultyRank >= 3 ? 7500 : 10000;
}
