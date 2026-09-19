import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MISSION COMPLETE', {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }
}
