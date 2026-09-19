import Phaser from 'phaser';

import { PRISON_CAMP } from '../constants';

export class PrisonCamp extends Phaser.Physics.Arcade.Sprite {
  private health: number = PRISON_CAMP.health;
  private opened = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'prison-camp-closed');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(108, 58);
    body.setOffset(6, 8);
  }

  get isOpen(): boolean {
    return this.opened;
  }

  takeDamage(amount = 1): boolean {
    if (this.opened) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);

    if (this.health === 0) {
      this.opened = true;
      this.setTexture('prison-camp-open');

      const body = this.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = false;
      return true;
    }

    this.setTintFill(0xf3d45a);
    this.scene.time.delayedCall(70, () => {
      if (!this.opened) {
        this.clearTint();
      }
    });
    return false;
  }
}
