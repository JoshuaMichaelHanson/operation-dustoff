import { HostageState } from './hostageState';

export interface RescueLandingSituation {
  helicopterLanded: boolean;
  helicopterX: number;
  baseCenterX: number;
  landingZoneWidth: number;
}

export function isSafeRescueLanding(
  situation: RescueLandingSituation,
): boolean {
  const halfWidth = situation.landingZoneWidth / 2;

  return (
    situation.helicopterLanded &&
    situation.helicopterX >= situation.baseCenterX - halfWidth &&
    situation.helicopterX <= situation.baseCenterX + halfWidth
  );
}

export function calculateRescueScore(
  rescuedHostages: number,
  scorePerHostage: number,
): number {
  return rescuedHostages * scorePerHostage;
}

export function hasPassengerUnloadSpacing(
  helicopterX: number,
  disembarkingHostageXs: readonly number[],
  requiredSpacing: number,
): boolean {
  return disembarkingHostageXs.every(
    (hostageX) => Math.abs(hostageX - helicopterX) >= requiredSpacing,
  );
}

export function shouldOpenRescueDoor(
  hostageStates: readonly HostageState[],
): boolean {
  return hostageStates.includes(HostageState.RunningToBase);
}
