export enum HostageState {
  Captive = 'CAPTIVE',
  RunningOut = 'RUNNING_OUT',
  Waiting = 'WAITING',
  RunningToHelicopter = 'RUNNING_TO_HELICOPTER',
  Aboard = 'ABOARD',
  RunningToBase = 'RUNNING_TO_BASE',
  Rescued = 'RESCUED',
  Dead = 'DEAD',
}

export enum HostageUpdateEvent {
  Boarded = 'BOARDED',
  Rescued = 'RESCUED',
}

const allowedTransitions: Record<HostageState, readonly HostageState[]> = {
  [HostageState.Captive]: [HostageState.RunningOut],
  [HostageState.RunningOut]: [HostageState.Waiting, HostageState.Dead],
  [HostageState.Waiting]: [
    HostageState.RunningToHelicopter,
    HostageState.Dead,
  ],
  [HostageState.RunningToHelicopter]: [
    HostageState.Waiting,
    HostageState.Aboard,
    HostageState.Dead,
  ],
  [HostageState.Aboard]: [HostageState.Waiting, HostageState.RunningToBase],
  [HostageState.RunningToBase]: [HostageState.Rescued, HostageState.Dead],
  [HostageState.Rescued]: [],
  [HostageState.Dead]: [],
};

export function isHostageTransitionAllowed(
  from: HostageState,
  to: HostageState,
): boolean {
  return allowedTransitions[from].includes(to);
}

export function canHostageBeKilled(state: HostageState): boolean {
  return [
    HostageState.RunningOut,
    HostageState.Waiting,
    HostageState.RunningToHelicopter,
    HostageState.RunningToBase,
  ].includes(state);
}

export interface HostageCrushSituation {
  hostageState: HostageState;
  helicopterLanded: boolean;
  helicopterVelocityY: number;
  helicopterBottom: number;
  hostageCenterY: number;
}

export function canHostageBeCrushed(
  situation: HostageCrushSituation,
): boolean {
  const exposedAtCamp = [
    HostageState.RunningOut,
    HostageState.Waiting,
    HostageState.RunningToHelicopter,
  ].includes(situation.hostageState);

  return (
    exposedAtCamp &&
    !situation.helicopterLanded &&
    situation.helicopterVelocityY > 0 &&
    situation.helicopterBottom <= situation.hostageCenterY
  );
}

export interface BoardingSituation {
  helicopterLanded: boolean;
  distanceToHelicopter: number;
  boardingRadius: number;
  passengerCount: number;
  passengerCapacity: number;
}

export function canBeginBoarding(situation: BoardingSituation): boolean {
  return (
    situation.helicopterLanded &&
    situation.distanceToHelicopter <= situation.boardingRadius &&
    situation.passengerCount < situation.passengerCapacity
  );
}
