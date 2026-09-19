import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 55, GAME_WIDTH, 110, 0x334a2e);
    this.add
      .text(32, 28, 'DEPLOYMENT AREA', {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Flight systems ready', {
        color: '#d6dec3',
        fontFamily: 'Courier New',
        fontSize: '28px',
      })
      .setOrigin(0.5);
  }
}
