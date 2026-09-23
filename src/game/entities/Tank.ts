import Phaser from 'phaser';

import { TANK } from '../constants';
import { getTankAim } from '../logic/tankAim';
import type { EnemyShot } from './EnemyShot';

export class Tank extends Phaser.Physics.Arcade.Sprite {
  private health: number = TANK.health;
  private lastShotAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'tank');

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(72, 36);
    body.setOffset(3, 6);
  }

  tryFire(time: number, targetX: number, targetY: number): EnemyShot | null {
    if (!this.active) {
      return null;
    }

    const facing = targetX < this.x ? -1 : 1;
    const turretPivotX = this.x + facing * 15;
    const turretPivotY = this.y - 7;
    const aim = getTankAim(
      Math.abs(targetX - turretPivotX),
      turretPivotY - targetY,
    );

    this.setFlipX(facing < 0);
    this.setFrame(aim.frame);

    if (time - this.lastShotAt < TANK.fireCooldownMs) {
      return null;
    }

    const shotX = this.x + facing * aim.muzzleOffsetX;
    const shotY = this.y + aim.muzzleOffsetY;
    const deltaX = targetX - shotX;
    const deltaY = targetY - shotY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance === 0 || distance > TANK.fireRange) {
      return null;
    }

    this.lastShotAt = time;
    return {
      x: shotX,
      y: shotY,
      velocityX: (deltaX / distance) * TANK.projectileSpeed,
      velocityY: (deltaY / distance) * TANK.projectileSpeed,
      damage: TANK.projectileDamage,
    };
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
