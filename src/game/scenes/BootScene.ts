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
    this.createCannonRoundTexture();
    this.createMissileTexture();
    this.createEnemyRoundTexture();
    this.createPrisonCampTextures();
    this.createHostageTexture();
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

  private createPrisonCampTextures(): void {
    const closedCamp = this.add.graphics();

    closedCamp.fillStyle(0x252b22);
    closedCamp.fillRect(8, 20, 112, 50);
    closedCamp.fillStyle(0x6f5d3f);
    closedCamp.fillTriangle(3, 22, 64, 1, 125, 22);
    closedCamp.fillStyle(0x4b3b2d);
    closedCamp.fillRect(14, 26, 100, 38);
    closedCamp.fillStyle(0x1b211b);
    closedCamp.fillRect(50, 36, 28, 28);
    closedCamp.lineStyle(3, 0x8e9271);
    for (let x = 6; x <= 122; x += 12) {
      closedCamp.lineBetween(x, 18, x, 70);
    }
    closedCamp.lineBetween(4, 28, 124, 28);
    closedCamp.lineBetween(4, 55, 124, 55);
    closedCamp.generateTexture('prison-camp-closed', 128, 72);
    closedCamp.destroy();

    const openCamp = this.add.graphics();

    openCamp.fillStyle(0x252b22);
    openCamp.fillRect(8, 54, 112, 16);
    openCamp.fillStyle(0x594936);
    openCamp.fillTriangle(10, 55, 38, 31, 62, 57);
    openCamp.fillTriangle(55, 57, 91, 25, 118, 58);
    openCamp.lineStyle(3, 0x8e9271);
    openCamp.lineBetween(9, 33, 5, 70);
    openCamp.lineBetween(119, 37, 124, 70);
    openCamp.generateTexture('prison-camp-open', 128, 72);
    openCamp.destroy();
  }

  private createHostageTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0xe2b679);
    graphics.fillCircle(8, 6, 5);
    graphics.fillStyle(0xd6dec3);
    graphics.fillRect(4, 11, 8, 11);
    graphics.fillStyle(0x526746);
    graphics.fillRect(3, 22, 4, 8);
    graphics.fillRect(9, 22, 4, 8);
    graphics.generateTexture('hostage', 16, 30);
    graphics.destroy();
  }
}
