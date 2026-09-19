import Phaser from 'phaser';

import { TANK } from '../constants';

export class Tank extends Phaser.Physics.Arcade.Sprite {
  private health: number = TANK.health;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tank');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(72, 36);
    body.setOffset(3, 6);
  }

  takeDamage(amount = 1): boolean {
    this.health = Math.max(0, this.health - amount);

    if (this.health === 0) {
      this.destroy();
      return true;
    }

    this.setTintFill(0xf3d45a);
    this.scene.time.delayedCall(70, () => {
      if (this.active) {
        this.clearTint();
      }
    });
    return false;
  }
}
