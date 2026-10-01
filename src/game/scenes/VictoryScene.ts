import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { isTouchControlEnabled } from '../input/touchInput';
import {
  getLevelIndex,
  getNextLevelIndex,
  LEVELS,
} from '../levels/levelConfig';

interface VictoryData {
  rescued?: number;
  score?: number;
  lives?: number;
  levelIndex?: number;
}

export class VictoryScene extends Phaser.Scene {
  private rescued = 0;
  private score = 0;
  private lives = 0;
  private levelIndex = 0;

  constructor() {
    super('VictoryScene');
  }

  init(data: VictoryData): void {
    this.rescued = data.rescued ?? 0;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? 0;
    this.levelIndex = getLevelIndex(data.levelIndex ?? 0);
  }

  create(): void {
    const touchEnabled = isTouchControlEnabled();
    const nextLevelIndex = getNextLevelIndex(this.levelIndex);
    const campaignComplete = nextLevelIndex === null;
    this.sound.play('victory', { volume: 0.38 });

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, campaignComplete
        ? 'CAMPAIGN COMPLETE'
        : `MISSION ${this.levelIndex + 1} COMPLETE`, {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '52px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.61,
        campaignComplete
          ? 'ALL RESCUE MISSIONS SECURED'
          : `NEXT: ${LEVELS[nextLevelIndex]!.name}  •  ${LEVELS[nextLevelIndex]!.difficultyLabel}`,
        {
          color: campaignComplete ? '#f3d45a' : '#9fc7c5',
          fontFamily: 'Courier New',
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, campaignComplete
        ? touchEnabled
          ? 'TAP TO START NEW CAMPAIGN'
          : 'PRESS ENTER FOR NEW CAMPAIGN'
        : touchEnabled
          ? 'TAP FOR NEXT MISSION'
          : 'PRESS ENTER FOR NEXT MISSION', {
        backgroundColor: '#39452c',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontSize: '24px',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: restartText,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const restart = (): void => {
      this.scene.start('GameScene', nextLevelIndex === null
        ? { levelIndex: 0 }
        : {
            levelIndex: nextLevelIndex,
            score: this.score,
            lives: this.lives,
          });
    };
    restartText.once('pointerdown', restart);
    this.input.keyboard?.once('keydown-ENTER', restart);
  }
}
