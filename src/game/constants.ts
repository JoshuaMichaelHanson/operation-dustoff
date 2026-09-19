export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_TITLE = 'OPERATION DUSTOFF';

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 900;
export const GROUND_Y = 790;

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
} as const;

export const TANK = {
  health: 4,
} as const;
