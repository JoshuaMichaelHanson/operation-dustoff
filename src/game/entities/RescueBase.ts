import Phaser from 'phaser';

import { GROUND_Y, RESCUE_BASE } from '../constants';
import { isSafeRescueLanding } from '../logic/rescueRules';
import type { Helicopter } from './Helicopter';

export class RescueBase {
  readonly landingSurface: Phaser.GameObjects.Rectangle;
  private readonly sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add
      .image(
        RESCUE_BASE.spriteCenterX,
        GROUND_Y,
        'rescue-base',
      )
      .setOrigin(0.5, 1)
      .setDepth(-1);

    const platformHeight = GROUND_Y - RESCUE_BASE.surfaceY;
    this.landingSurface = scene.add
      .rectangle(
        RESCUE_BASE.spriteCenterX,
        RESCUE_BASE.surfaceY + platformHeight / 2,
        RESCUE_BASE.spriteWidth,
        platformHeight,
        0x000000,
        0,
      )
      .setDepth(-1);
    scene.physics.add.existing(this.landingSurface, true);

    scene.add.text(
      70,
      GROUND_Y - RESCUE_BASE.spriteHeight - 18,
      'DUSTOFF BASE',
      {
        color: '#91a087',
        fontFamily: 'Courier New',
        fontSize: '18px',
      },
    );
  }

  get entranceX(): number {
    return RESCUE_BASE.entranceX;
  }

  get surfaceY(): number {
    return RESCUE_BASE.surfaceY;
  }

  setDoorOpen(isOpen: boolean): void {
    this.sprite.setFrame(isOpen ? 1 : 0);
  }

  canUnload(helicopter: Helicopter): boolean {
    return isSafeRescueLanding({
      helicopterLanded: helicopter.isLanded,
      helicopterX: helicopter.x,
      baseCenterX: RESCUE_BASE.centerX,
      landingZoneWidth: RESCUE_BASE.landingZoneWidth,
    });
  }
}
