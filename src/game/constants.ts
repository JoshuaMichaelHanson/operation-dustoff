export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_TITLE = 'OPERATION DUSTOFF';

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 900;
export const GROUND_Y = 790;

export const CAMERA = {
  followLerp: 0.08,
  verticalFollowOffset: 60,
  horizontalDeadzone: 260,
  verticalDeadzone: 240,
} as const;

export const HELICOPTER = {
  horizontalAcceleration: 440,
  verticalAcceleration: 520,
  passiveGravity: 110,
  horizontalDrag: 240,
  verticalDrag: 90,
  maximumHorizontalSpeed: 270,
  maximumVerticalSpeed: 190,
  safeLandingHorizontalSpeed: 70,
  safeLandingVerticalSpeed: 95,
  cannonCooldownMs: 180,
  cannonRoundSpeed: 720,
  maximumForwardPitchRadians: 0.28,
  passengerCapacity: 8,
} as const;

export const TANK = {
  health: 4,
} as const;

export const PRISON_CAMP = {
  health: 6,
  hostageCount: 6,
} as const;

export const HOSTAGE = {
  runningOutSpeed: 72,
  boardingSpeed: 105,
  disembarkingSpeed: 115,
  boardingRadius: 190,
  boardingDistance: 38,
  rallyDistance: 110,
  rallySpacing: 34,
  releaseDelayMs: 140,
  unloadIntervalMs: 250,
} as const;

export const RESCUE_BASE = {
  centerX: 350,
  landingZoneWidth: 500,
  entranceX: 130,
  scorePerHostage: 100,
} as const;
