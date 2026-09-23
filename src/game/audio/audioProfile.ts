export interface RotorAudioProfile {
  volume: number;
  rate: number;
}

const ROTOR_IDLE_VOLUME = 0.17;
const ROTOR_MAXIMUM_VOLUME = 0.27;
const ROTOR_IDLE_RATE = 0.92;
const ROTOR_MAXIMUM_RATE = 1.08;

export function getRotorAudioProfile(
  isHelicopterActive: boolean,
  speedRatio: number,
): RotorAudioProfile {
  const clampedSpeedRatio = Math.max(0, Math.min(1, speedRatio));

  return {
    volume: isHelicopterActive
      ? ROTOR_IDLE_VOLUME +
        (ROTOR_MAXIMUM_VOLUME - ROTOR_IDLE_VOLUME) * clampedSpeedRatio
      : 0,
    rate:
      ROTOR_IDLE_RATE +
      (ROTOR_MAXIMUM_RATE - ROTOR_IDLE_RATE) * clampedSpeedRatio,
  };
}
