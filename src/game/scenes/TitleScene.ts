import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH } from '../constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    this.cameras.main.setBackgroundColor('#101810');
    this.createBackdrop();

    this.add
      .text(centerX, 82, GAME_TITLE, {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '62px',
        fontStyle: 'bold',
        stroke: '#1b211b',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(centerX, 133, 'COMBAT RESCUE COMMAND', {
        color: '#c7b96a',
        fontFamily: 'Courier New',
        fontSize: '20px',
        letterSpacing: 7,
      })
      .setOrigin(0.5)
      .setDepth(5);

    const helicopter = this.add
      .sprite(centerX, 270, 'helicopter')
      .setScale(3)
      .setDepth(4)
      .play('helicopter-rotors');

    this.tweens.add({
      targets: helicopter,
      y: 260,
      duration: 1150,
      ease: 'Sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(centerX, 420, 'RESCUE THEM  •  SURVIVE THE RUN  •  BRING THEM HOME', {
        color: '#d6dec3',
        fontFamily: 'Courier New',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        centerX,
        501,
        'WASD / ARROWS  FLIGHT     SPACE  CANNON     X  LOCK-ON MISSILE',
        {
          color: '#91a087',
          fontFamily: 'Courier New',
          fontSize: '18px',
        },
      )
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(centerX, 539, 'MISSION: RECOVER 20 HOSTAGES FROM ENEMY TERRITORY', {
        color: '#c7b96a',
        fontFamily: 'Courier New',
        fontSize: '17px',
      })
      .setOrigin(0.5)
      .setDepth(5);

    const startText = this.add
      .text(centerX, 618, '▶  PRESS ENTER TO DEPLOY  ◀', {
        backgroundColor: '#31452f',
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontSize: '25px',
        fontStyle: 'bold',
        padding: { x: 22, y: 13 },
      })
      .setOrigin(0.5)
      .setDepth(5);

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

  private createBackdrop(): void {
    this.add.circle(1015, 225, 112, 0xc78c3c, 0.88).setDepth(0);
    this.add.rectangle(1015, 205, 230, 12, 0x101810).setDepth(1);
    this.add.rectangle(1015, 238, 230, 9, 0x101810).setDepth(1);
    this.add.rectangle(1015, 267, 230, 6, 0x101810).setDepth(1);

    this.add
      .triangle(80, 390, 0, 160, 170, 5, 340, 160, 0x263629)
      .setOrigin(0, 1)
      .setDepth(1);
    this.add
      .triangle(300, 390, 0, 150, 210, 0, 420, 150, 0x31452f)
      .setOrigin(0, 1)
      .setDepth(1);
    this.add
      .triangle(730, 390, 0, 125, 170, 0, 340, 125, 0x263629)
      .setOrigin(0, 1)
      .setDepth(1);
    this.add
      .triangle(960, 390, 0, 95, 150, 0, 300, 95, 0x31452f)
      .setOrigin(0, 1)
      .setDepth(1);

    this.add.rectangle(GAME_WIDTH / 2, 390, GAME_WIDTH, 18, 0x1b211b).setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, 386, GAME_WIDTH, 3, 0xc7b96a).setDepth(3);

    for (let x = 0; x < GAME_WIDTH; x += 80) {
      this.add
        .line(0, 0, GAME_WIDTH / 2, 390, x - GAME_WIDTH / 2, GAME_HEIGHT, 0x31452f, 0.42)
        .setOrigin(0, 0)
        .setDepth(0);
    }
    for (let y = 454; y < GAME_HEIGHT; y += 34) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, 0x526746, 0.4).setDepth(0);
    }

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 28, GAME_HEIGHT - 28)
      .setStrokeStyle(3, 0x596846, 0.8)
      .setDepth(9);

    for (let y = 0; y < GAME_HEIGHT; y += 6) {
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, 0x000000, 0.1).setDepth(8);
    }
  }
}
