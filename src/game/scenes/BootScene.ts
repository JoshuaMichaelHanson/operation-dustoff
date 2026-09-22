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
    this.createCannonRoundTexture();
    this.createMissileTexture();
    this.createEnemyRoundTexture();
    this.createTankTexture();
    this.createJetTexture();
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

  private createTankTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x252b22);
    graphics.fillRoundedRect(5, 27, 67, 13, 5);
    graphics.fillStyle(0x73804c);
    graphics.fillRoundedRect(12, 19, 51, 14, 3);
    graphics.fillRoundedRect(28, 10, 28, 14, 5);
    graphics.fillRect(52, 14, 25, 4);

    graphics.fillStyle(0xb1b878);
    graphics.fillCircle(19, 33, 4);
    graphics.fillCircle(38, 33, 4);
    graphics.fillCircle(57, 33, 4);
    graphics.generateTexture('tank', 78, 42);
    graphics.destroy();
  }

  private createJetTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x596846);
    graphics.fillTriangle(3, 16, 76, 4, 91, 16);
    graphics.fillTriangle(28, 15, 50, 1, 69, 15);
    graphics.fillTriangle(25, 18, 52, 31, 70, 18);
    graphics.fillStyle(0x9fc7c5);
    graphics.fillTriangle(65, 8, 80, 7, 86, 14);
    graphics.fillStyle(0xe46b56);
    graphics.fillRect(1, 13, 8, 6);
    graphics.generateTexture('jet', 94, 32);
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
