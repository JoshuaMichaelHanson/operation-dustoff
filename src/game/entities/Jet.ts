import Phaser from 'phaser';

import { JET, WORLD_WIDTH } from '../constants';
import {
  getJetAttackVelocity,
  getJetSpawnX,
  isJetPastWorldBounds,
  type JetDirection,
} from '../logic/jetBehavior';
import type { EnemyShot } from './EnemyShot';

interface JetTarget {
  x: number;
  y: number;
}

export class Jet extends Phaser.Physics.Arcade.Sprite {
  private health: number = JET.health;
  private lastShotAt = Number.NEGATIVE_INFINITY;

  constructor(
    scene: Phaser.Scene,
    private readonly direction: JetDirection,
    altitude: number,
  ) {
    super(
      scene,
      getJetSpawnX(direction, WORLD_WIDTH, JET.spawnMargin),
      altitude,
      'jet',
    );

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(78, 22);
    body.setOffset(6, 6);
    body.setVelocityX(direction * JET.speed);

    this.setFlipX(direction < 0);
  }

  update(time: number, target?: JetTarget): EnemyShot | null {
    if (!this.active) {
      return null;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(this.direction * JET.speed);

    if (
      isJetPastWorldBounds(
        this.x,
        this.direction,
        WORLD_WIDTH,
        JET.spawnMargin,
      )
    ) {
      this.destroy();
      return null;
    }

    if (!target || time - this.lastShotAt < JET.fireCooldownMs) {
      return null;
    }

    const shotX = this.x + this.direction * 34;
    const shotY = this.y + 12;
    const velocity = getJetAttackVelocity(
      shotX,
      shotY,
      target.x,
      target.y,
      JET.projectileSpeed,
      JET.fireRange,
    );

    if (!velocity) {
      return null;
    }

    this.lastShotAt = time;
    return {
      x: shotX,
      y: shotY,
      velocityX: velocity.x,
      velocityY: velocity.y,
      damage: JET.projectileDamage,
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
