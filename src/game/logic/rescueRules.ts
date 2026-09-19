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
