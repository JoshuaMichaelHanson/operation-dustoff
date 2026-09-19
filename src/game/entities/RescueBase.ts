import Phaser from 'phaser';

import { GROUND_Y, RESCUE_BASE } from '../constants';
import { isSafeRescueLanding } from '../logic/rescueRules';
import type { Helicopter } from './Helicopter';

export class RescueBase {
  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(
      RESCUE_BASE.centerX,
      GROUND_Y - 4,
      RESCUE_BASE.landingZoneWidth,
      8,
      0x74805d,
    );

    scene.add.rectangle(
      RESCUE_BASE.entranceX,
      GROUND_Y - 41,
      104,
      82,
      0x39452c,
    );
    scene.add.triangle(
      RESCUE_BASE.entranceX,
      GROUND_Y - 90,
      0,
      28,
      60,
      0,
      120,
      28,
      0x596846,
    );
    scene.add.rectangle(
      RESCUE_BASE.entranceX,
      GROUND_Y - 24,
      28,
      48,
      0x171d18,
    );
    scene.add.text(
      RESCUE_BASE.centerX - RESCUE_BASE.landingZoneWidth / 2 + 20,
      GROUND_Y - 128,
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

  canUnload(helicopter: Helicopter): boolean {
    return isSafeRescueLanding({
      helicopterLanded: helicopter.isLanded,
      helicopterX: helicopter.x,
      baseCenterX: RESCUE_BASE.centerX,
      landingZoneWidth: RESCUE_BASE.landingZoneWidth,
    });
  }
}
