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
  maximumHealth: 100,
} as const;

export const TANK = {
  health: 4,
  fireCooldownMs: 1700,
  fireRange: 950,
  projectileSpeed: 260,
  projectileDamage: 25,
  scoreValue: 100,
} as const;

export const JET = {
  health: 3,
  speed: 320,
  initialSpawnDelayMs: 5000,
  spawnIntervalMs: 15000,
  spawnMargin: 96,
  flightAltitudes: [350, 430, 510],
  fireCooldownMs: 1500,
  fireRange: 760,
  projectileSpeed: 360,
  projectileDamage: 20,
  scoreValue: 200,
  maximumActive: 1,
} as const;

export const PLAYER = {
  startingLives: 3,
  respawnX: 280,
  respawnDelayMs: 1200,
  gameOverDelayMs: 1000,
} as const;

export const MISSION = {
  rescueTarget: 20,
} as const;

export const PRISON_CAMP = {
  health: 6,
  hostageCount: 7,
  positions: [2100, 2550, 3000],
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
  unloadSpacing: 56,
} as const;

export const RESCUE_BASE = {
  centerX: 350,
  landingZoneWidth: 500,
  entranceX: 130,
  scorePerHostage: 100,
} as const;
