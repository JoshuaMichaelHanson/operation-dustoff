import Phaser from 'phaser';

import { BOMB, WORLD_HEIGHT } from '../constants';
import { getBombLaunchVelocity } from '../logic/bombBehavior';

export class Bomb extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    helicopterVelocityX: number,
    private readonly launchedAt: number,
    private readonly worldWidth: number,
  ) {
    super(scene, x, y, 'bomb');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const launchVelocity = getBombLaunchVelocity(helicopterVelocityX);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(BOMB.gravity);
    body.setSize(10, 16);
    body.setVelocity(launchVelocity.x, launchVelocity.y);
    body.setAngularVelocity(150 * Math.sign(launchVelocity.x || 1));
  }

  update(time: number): void {
    if (
      !this.active ||
      time - this.launchedAt >= BOMB.lifetimeMs ||
      this.x < -BOMB.worldMargin ||
      this.x > this.worldWidth + BOMB.worldMargin ||
      this.y > WORLD_HEIGHT + BOMB.worldMargin
    ) {
      this.destroy();
    }
  }
}
