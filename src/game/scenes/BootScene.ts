import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.spritesheet('helicopter', 'assets/sprites/helicopter.png', {
      frameWidth: 96,
      frameHeight: 54,
    });
    this.load.spritesheet('tank', 'assets/sprites/tank.png', {
      frameWidth: 78,
      frameHeight: 42,
    });
    this.load.spritesheet('jet', 'assets/sprites/jet.png', {
      frameWidth: 94,
      frameHeight: 32,
    });
    this.load.spritesheet('hostage', 'assets/sprites/hostage.png', {
      frameWidth: 20,
      frameHeight: 30,
    });
    this.load.spritesheet('prison-camp', 'assets/sprites/prison-camp.png', {
      frameWidth: 128,
      frameHeight: 72,
    });
    this.load.spritesheet('rescue-base', 'assets/sprites/rescue-base.png', {
      frameWidth: 512,
      frameHeight: 160,
    });
    this.load.spritesheet('ground-tiles', 'assets/sprites/ground-tiles.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.image(
      'background-ridge',
      'assets/sprites/background-ridge.png',
    );
    this.load.image(
      'distant-mountains',
      'assets/sprites/distant-mountains.png',
    );
    this.load.spritesheet('clouds', 'assets/sprites/clouds.png', {
      frameWidth: 96,
      frameHeight: 32,
    });
    this.load.audio('rotor-loop', 'assets/audio/rotor-loop.wav');
    this.load.audio('cannon', 'assets/audio/cannon.wav');
    this.load.audio('explosion', 'assets/audio/explosion.wav');
    this.load.audio('boarding', 'assets/audio/boarding.wav');
    this.load.audio('rescue', 'assets/audio/rescue.wav');
    this.load.audio('victory', 'assets/audio/victory.wav');
    this.load.audio('game-over', 'assets/audio/game-over.wav');
    this.load.audio('music-loop', 'assets/audio/music-loop.wav');
    this.load.audio('smush', 'assets/audio/smush.wav');
  }

  create(): void {
    this.anims.create({
      key: 'helicopter-rotors',
      frames: this.anims.generateFrameNumbers('helicopter', {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: 'jet-exhaust',
      frames: this.anims.generateFrameNumbers('jet', {
        start: 0,
        end: 1,
      }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: 'hostage-idle',
      frames: this.anims.generateFrameNumbers('hostage', {
        start: 0,
        end: 1,
      }),
      frameRate: 3,
      repeat: -1,
    });
    this.anims.create({
      key: 'hostage-walk',
      frames: this.anims.generateFrameNumbers('hostage', {
        start: 2,
        end: 5,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.createCannonRoundTexture();
    this.createMissileTexture();
    this.createBombTexture();
    this.createEnemyRoundTexture();
    this.createAaGunTexture();
    this.createSamLauncherTexture();
    this.createSamMissileTexture();
    this.scene.start('TitleScene');
  }

  private createCannonRoundTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffe27a);
    graphics.fillRect(0, 0, 16, 4);
    graphics.generateTexture('cannon-round', 16, 4);
    graphics.destroy();
  }

  private createMissileTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xd6dec3);
    graphics.fillRect(2, 2, 18, 6);
    graphics.fillStyle(0xf3d45a);
    graphics.fillTriangle(20, 1, 27, 5, 20, 9);
    graphics.fillStyle(0xe46b56);
    graphics.fillRect(0, 3, 4, 4);
    graphics.generateTexture('missile', 28, 10);
    graphics.destroy();
  }

  private createBombTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2a3028);
    graphics.fillRoundedRect(3, 3, 12, 18, 5);
    graphics.fillStyle(0xc7b96a);
    graphics.fillRect(7, 0, 4, 5);
    graphics.fillStyle(0xe46b56);
    graphics.fillTriangle(2, 18, 9, 24, 16, 18);
    graphics.generateTexture('bomb', 18, 24);
    graphics.destroy();
  }

  private createEnemyRoundTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xe46b56);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('enemy-round', 10, 10);
    graphics.destroy();
  }

  private createAaGunTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x222b2a);
    graphics.fillRect(5, 33, 70, 15);
    graphics.fillStyle(0x71805d);
    graphics.fillRect(9, 37, 62, 8);
    graphics.fillStyle(0x3c4940);
    graphics.fillRect(19, 21, 42, 15);
    graphics.fillStyle(0xc7b96a);
    graphics.fillCircle(40, 24, 10);
    graphics.fillStyle(0x1b2525);
    graphics.fillRect(35, 6, 8, 20);
    graphics.fillStyle(0xe46b56);
    graphics.fillCircle(40, 7, 4);
    graphics.generateTexture('aa-gun', 80, 50);
    graphics.destroy();
  }

  private createSamLauncherTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x24322e);
    graphics.fillRect(4, 34, 72, 15);
    graphics.fillStyle(0x879578);
    graphics.fillRect(9, 38, 62, 6);
    graphics.fillStyle(0x455c4d);
    graphics.fillRect(20, 24, 42, 13);
    graphics.fillStyle(0xd5c78d);
    graphics.fillRect(33, 8, 14, 24);
    graphics.fillStyle(0xffcd6c);
    graphics.fillTriangle(33, 8, 40, 0, 47, 8);
    graphics.fillStyle(0x151e1b);
    graphics.fillRect(13, 47, 14, 3);
    graphics.fillRect(53, 47, 14, 3);
    graphics.generateTexture('sam-launcher', 80, 50);
    graphics.destroy();
  }

  private createSamMissileTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffcd6c);
    graphics.fillRect(3, 3, 21, 7);
    graphics.fillStyle(0xff795e);
    graphics.fillTriangle(23, 2, 31, 6, 23, 11);
    graphics.fillStyle(0x514638);
    graphics.fillTriangle(2, 2, 11, 2, 2, 0);
    graphics.fillTriangle(2, 11, 11, 11, 2, 13);
    graphics.generateTexture('sam-missile', 32, 14);
    graphics.destroy();
  }

}
