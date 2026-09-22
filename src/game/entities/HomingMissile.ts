import Phaser from 'phaser';

import { MISSILE, WORLD_HEIGHT, WORLD_WIDTH } from '../constants';
import { getHomingMissileVelocity } from '../logic/missileGuidance';
import type { Jet } from './Jet';

export class HomingMissile extends Phaser.Physics.Arcade.Sprite {
  private nextTrailAt: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: -1 | 1,
    private readonly target: Jet,
    private readonly launchedAt: number,
  ) {
    super(scene, x, y, 'missile');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 8);
    body.setVelocity(direction * MISSILE.speed, 0);

    this.nextTrailAt = launchedAt;
  }

  update(time: number, delta: number): void {
    if (!this.active) {
      return;
    }

    if (
      time - this.launchedAt >= MISSILE.lifetimeMs ||
      this.x < -MISSILE.worldMargin ||
      this.x > WORLD_WIDTH + MISSILE.worldMargin ||
      this.y < -MISSILE.worldMargin ||
      this.y > WORLD_HEIGHT + MISSILE.worldMargin
    ) {
      this.destroy();
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.target.active) {
      const velocity = getHomingMissileVelocity(
        body.velocity,
        this,
        this.target,
        MISSILE.speed,
        MISSILE.maximumTurnRadiansPerSecond,
        delta,
      );
      body.setVelocity(velocity.x, velocity.y);
    }

    this.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
    if (time >= this.nextTrailAt) {
      this.showTrailPuff();
      this.nextTrailAt = time + 55;
    }
  }

  private showTrailPuff(): void {
    const trail = this.scene.add.circle(this.x, this.y, 3, 0xd6dec3, 0.7);
    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.35,
      duration: 180,
      onComplete: () => trail.destroy(),
    });
  }
}
