import Phaser from 'phaser';

import { BOSS, SAM, WORLD_HEIGHT } from '../constants';
import { getHomingMissileVelocity } from '../logic/missileGuidance';
import { bossMissilePhase } from '../logic/bossBehavior';
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
    private readonly variant: 'ground' | 'boss' = 'ground',
  ) {
    super(scene, x, y, 'sam-missile');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    const angle = Math.atan2(initialTarget.y - y, initialTarget.x - x);
    body.setAllowGravity(false);
    body.setSize(22, 8);
    const speed = variant === 'boss' ? BOSS.missileSpeed : SAM.missileSpeed;
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    if (variant === 'boss') this.setTint(0xff9972);
    this.nextTrailAt = launchedAt;
  }

  get damage(): number {
    return this.variant === 'boss' ? BOSS.missileDamage : SAM.missileDamage;
  }

  get isBossMissile(): boolean {
    return this.variant === 'boss';
  }

  update(time: number, delta: number): void {
    if (!this.active) return;
    const elapsed = time - this.launchedAt;
    const bossPhase = this.variant === 'boss'
      ? bossMissilePhase(elapsed) : null;
    if (
      (bossPhase === 'expired' || (this.variant === 'ground' &&
        elapsed >= SAM.missileLifetimeMs)) ||
      this.x < -SAM.worldMargin ||
      this.x > this.worldWidth + SAM.worldMargin ||
      this.y < -SAM.worldMargin ||
      this.y > WORLD_HEIGHT + SAM.worldMargin
    ) {
      this.destroy();
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.target.active && (this.variant === 'boss'
      ? bossPhase === 'guided' : canSamGuide(this.target))) {
      const speed = this.variant === 'boss' ? BOSS.missileSpeed : SAM.missileSpeed;
      const turn = this.variant === 'boss'
        ? BOSS.missileTurnRadiansPerSecond
        : SAM.missileTurnRadiansPerSecond;
      const velocity = getHomingMissileVelocity(
        body.velocity, this, this.target, speed, turn, delta,
      );
      body.setVelocity(velocity.x, velocity.y);
    }
    this.setRotation(Math.atan2(body.velocity.y, body.velocity.x));
    if (time >= this.nextTrailAt) {
      const trail = this.scene.add.circle(this.x, this.y, 4,
        this.variant === 'boss' ? 0xff8f6c : 0xffcd6c, 0.8);
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
