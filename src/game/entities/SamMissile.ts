import Phaser from 'phaser';

import { SAM, WORLD_HEIGHT } from '../constants';
import { getHomingMissileVelocity } from '../logic/missileGuidance';
import { canSamGuide, type SamPoint } from '../logic/samBehavior';

export class SamMissile extends Phaser.Physics.Arcade.Sprite {
  private nextTrailAt: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    initialTarget: SamPoint,
    private readonly target: Phaser.Physics.Arcade.Sprite,
    private readonly launchedAt: number,
    private readonly worldWidth: number,
  ) {
    super(scene, x, y, 'sam-missile');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Math.atan2(initialTarget.y - y, initialTarget.x - x);
    body.setAllowGravity(false);
    body.setSize(22, 8);
    body.setVelocity(Math.cos(angle) * SAM.missileSpeed,
      Math.sin(angle) * SAM.missileSpeed);
    this.nextTrailAt = launchedAt;
  }

  update(time: number, delta: number): void {
    if (!this.active) return;
    if (
      time - this.launchedAt >= SAM.missileLifetimeMs ||
      this.x < -SAM.worldMargin ||
      this.x > this.worldWidth + SAM.worldMargin ||
      this.y < -SAM.worldMargin ||
      this.y > WORLD_HEIGHT + SAM.worldMargin
    ) {
      this.destroy();
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.target.active && canSamGuide(this.target)) {
      const velocity = getHomingMissileVelocity(
        body.velocity, this, this.target, SAM.missileSpeed,
        SAM.missileTurnRadiansPerSecond, delta,
      );
      body.setVelocity(velocity.x, velocity.y);
    }
    this.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
    if (time >= this.nextTrailAt) {
      const trail = this.scene.add.circle(this.x, this.y, 4, 0xffcd6c, 0.8);
      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scale: 0.3,
        duration: 250,
        onComplete: () => trail.destroy(),
      });
      this.nextTrailAt = time + 75;
    }
  }
}
