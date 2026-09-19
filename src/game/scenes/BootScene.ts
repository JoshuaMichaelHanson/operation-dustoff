import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.createHelicopterTexture();
    this.createCannonRoundTexture();
    this.createTankTexture();
    this.createPrisonCampTextures();
    this.createHostageTexture();
    this.scene.start('TitleScene');
  }

  private createHelicopterTexture(): void {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x6f7f46);
    graphics.fillTriangle(23, 23, 1, 12, 1, 34);
    graphics.fillRoundedRect(22, 14, 58, 30, 11);
    graphics.fillStyle(0xa7b66d);
    graphics.fillRoundedRect(54, 17, 24, 22, 8);
    graphics.fillStyle(0x9fc7c5);
    graphics.fillTriangle(62, 19, 77, 20, 77, 35);

    graphics.lineStyle(3, 0x39452c);
    graphics.lineBetween(39, 12, 39, 5);
    graphics.lineBetween(9, 5, 82, 5);
    graphics.lineBetween(29, 45, 25, 50);
    graphics.lineBetween(66, 45, 70, 50);
    graphics.lineBetween(19, 50, 77, 50);

    graphics.fillStyle(0xf3d45a);
    graphics.fillRect(80, 27, 13, 4);
    graphics.generateTexture('helicopter', 96, 54);
    graphics.destroy();
  }

  private createCannonRoundTexture(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffe27a);
    graphics.fillRect(0, 0, 16, 4);
    graphics.generateTexture('cannon-round', 16, 4);
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
