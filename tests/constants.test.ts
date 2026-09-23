import { describe, expect, it } from 'vitest';

import {
  CAMERA,
  GAME_HEIGHT,
  GAME_TITLE,
  GAME_WIDTH,
  GROUND_Y,
  PLAYER,
  RESCUE_BASE,
} from '../src/game/constants';

describe('game constants', () => {
  it('defines a playable game viewport and title', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(GAME_TITLE).toBe('OPERATION DUSTOFF');
  });

  it('keeps ground visibility while following descents before landing', () => {
    const upwardFollowThreshold =
      GAME_HEIGHT / 2 -
      CAMERA.verticalDeadzone / 2 +
      CAMERA.verticalFollowOffset;
    const downwardFollowThreshold =
      GAME_HEIGHT / 2 +
      CAMERA.verticalDeadzone / 2 +
      CAMERA.verticalFollowOffset;

    expect(upwardFollowThreshold).toBe(300);
    expect(downwardFollowThreshold).toBeLessThanOrEqual(GAME_HEIGHT * 0.75);
  });

  it('places the rescue spawn and unloading route on a raised platform', () => {
    const landingZoneLeft =
      RESCUE_BASE.centerX - RESCUE_BASE.landingZoneWidth / 2;
    const landingZoneRight =
      RESCUE_BASE.centerX + RESCUE_BASE.landingZoneWidth / 2;

    expect(RESCUE_BASE.surfaceY).toBe(GROUND_Y - 32);
    expect(PLAYER.respawnX).toBeGreaterThanOrEqual(landingZoneLeft);
    expect(PLAYER.respawnX).toBeLessThanOrEqual(landingZoneRight);
    expect(RESCUE_BASE.entranceX).toBeLessThan(landingZoneLeft);
  });
});
