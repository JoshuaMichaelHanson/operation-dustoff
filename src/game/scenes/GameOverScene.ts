import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

interface GameOverData {
  rescued?: number;
  score?: number;
}

export class GameOverScene extends Phaser.Scene {
  private rescued = 0;
  private score = 0;

  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData): void {
    this.rescued = data.rescued ?? 0;
    this.score = data.score ?? 0;
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.34, 'MISSION FAILED', {
        color: '#e46b56',
        fontFamily: 'Courier New',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.5,
        `RESCUED: ${this.rescued}   SCORE: ${this.score}`,
        {
          color: '#d6dec3',
          fontFamily: 'Courier New',
          fontSize: '24px',
        },
      )
      .setOrigin(0.5);

    const restartText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.64, 'PRESS ENTER TO REDEPLOY', {
        backgroundColor: '#4c312b',
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
