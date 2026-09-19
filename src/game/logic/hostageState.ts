export enum HostageState {
  Captive = 'CAPTIVE',
  RunningOut = 'RUNNING_OUT',
  Waiting = 'WAITING',
  RunningToHelicopter = 'RUNNING_TO_HELICOPTER',
  Aboard = 'ABOARD',
  RunningToBase = 'RUNNING_TO_BASE',
  Rescued = 'RESCUED',
}

export enum HostageUpdateEvent {
  Boarded = 'BOARDED',
  Rescued = 'RESCUED',
}

const allowedTransitions: Record<HostageState, readonly HostageState[]> = {
  [HostageState.Captive]: [HostageState.RunningOut],
  [HostageState.RunningOut]: [HostageState.Waiting],
  [HostageState.Waiting]: [HostageState.RunningToHelicopter],
  [HostageState.RunningToHelicopter]: [
    HostageState.Waiting,
    HostageState.Aboard,
  ],
  [HostageState.Aboard]: [HostageState.RunningToBase],
  [HostageState.RunningToBase]: [HostageState.Rescued],
  [HostageState.Rescued]: [],
};

export function isHostageTransitionAllowed(
  from: HostageState,
  to: HostageState,
): boolean {
  return allowedTransitions[from].includes(to);
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
