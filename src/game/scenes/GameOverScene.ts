import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MISSION FAILED', {
        color: '#e46b56',
        fontFamily: 'Courier New',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }
}
