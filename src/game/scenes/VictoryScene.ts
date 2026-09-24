import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

interface VictoryData {
  rescued?: number;
  score?: number;
  lives?: number;
}

export class VictoryScene extends Phaser.Scene {
  private rescued = 0;
  private score = 0;
  private lives = 0;

  constructor() {
    super('VictoryScene');
  }

  init(data: VictoryData): void {
    this.rescued = data.rescued ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? 0;
  }

  create(): void {
    this.sound.play('victory', { volume: 0.38 });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, 'MISSION COMPLETE', {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.47,
        `RESCUED: ${this.rescued}   SCORE: ${this.score}`,
        {
          color: '#d6dec3',
          fontFamily: 'Courier New',
          fontSize: '24px',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.55,
        `HELICOPTERS REMAINING: ${this.lives}`,
        {
          color: '#8fe388',
          fontFamily: 'Courier New',
          fontSize: '20px',
        },
      )
      .setOrigin(0.5);

    const restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.68, 'PRESS ENTER TO FLY AGAIN', {
        backgroundColor: '#39452c',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontSize: '24px',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
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
