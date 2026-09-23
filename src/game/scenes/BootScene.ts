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
    this.createEnemyRoundTexture();
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

  private createEnemyRoundTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xe46b56);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture('enemy-round', 10, 10);
    graphics.destroy();
  }

}
