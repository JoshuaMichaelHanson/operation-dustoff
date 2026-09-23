const AIM_STEP_RADIANS = (20 * Math.PI) / 180;
const MAX_AIM_FRAME = 3;

const MUZZLE_OFFSETS = [
  { x: 38, y: -8 },
  { x: 38, y: -15 },
  { x: 33, y: -20 },
  { x: 25, y: -21 },
] as const;

export interface TankAim {
  frame: number;
  muzzleOffsetX: number;
  muzzleOffsetY: number;
}

export function getTankAim(
  horizontalDistance: number,
  verticalRise: number,
): TankAim {
  const elevation = Math.atan2(
    Math.max(0, verticalRise),
    Math.max(0, horizontalDistance),
  );
  const frame = Math.min(
    MAX_AIM_FRAME,
    Math.max(0, Math.round(elevation / AIM_STEP_RADIANS)),
  );
  const muzzle = MUZZLE_OFFSETS[frame];

  return {
    frame,
    muzzleOffsetX: muzzle.x,
    muzzleOffsetY: muzzle.y,
  };
}
