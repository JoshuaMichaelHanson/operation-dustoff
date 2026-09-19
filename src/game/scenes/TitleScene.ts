import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH } from '../constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    this.add
      .text(centerX, GAME_HEIGHT * 0.3, GAME_TITLE, {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '58px',
        fontStyle: 'bold',
        stroke: '#392f16',
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, GAME_HEIGHT * 0.48, 'RESCUE THEM. BRING THEM HOME.', {
        color: '#d6dec3',
        fontFamily: 'Courier New',
        fontSize: '24px',
      })
      .setOrigin(0.5);

    const startText = this.add
      .text(centerX, GAME_HEIGHT * 0.66, 'PRESS ENTER TO DEPLOY', {
        backgroundColor: '#314c35',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontSize: '26px',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
  }
}
