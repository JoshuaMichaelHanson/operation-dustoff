import Phaser from 'phaser';

import { SAM } from '../constants';
import type { FlightObstacleConfig } from '../levels/levelConfig';
import { SamAttack, type SamPoint } from '../logic/samBehavior';
import type { SamMissile } from './SamMissile';

export class SamLauncher extends Phaser.Physics.Arcade.Sprite {
  private health: number = SAM.health;
  private readonly attack = new SamAttack();
  private readonly sightLine: Phaser.GameObjects.Graphics;
  private readonly warningText: Phaser.GameObjects.Text;
  private activeMissile: SamMissile | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly obstacles: readonly FlightObstacleConfig[],
  ) {
    super(scene, x, y, 'sam-launcher');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(64, 36);
    body.setOffset(8, 14);

    this.sightLine = scene.add.graphics().setDepth(15);
    this.warningText = scene.add.text(x, y - 76, 'SAM LOCK', {
      color: '#ffcd6c',
      backgroundColor: '#40341c',
      fontFamily: 'Courier New',
      fontSize: '17px',
      fontStyle: 'bold',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(16).setVisible(false);
  }

  get isWarning(): boolean {
    return this.active && this.attack.isWarning;
  }

  update(time: number, target?: SamPoint): SamPoint | null {
    if (!this.active) {
      return null;
    }
    if (this.activeMissile?.active) {
      this.clearWarning();
      return null;
    }
    const muzzle = { x: this.x, y: this.y - 20 };
    const step = this.attack.advance(time, muzzle, target, this.obstacles);
    if (step.warningTarget) {
      this.drawWarning(muzzle, step.warningTarget, time);
    } else {
      this.clearWarning();
    }
    return step.launchTarget;
  }

  trackMissile(missile: SamMissile): void {
    this.activeMissile = missile;
  }

  cancelAttack(time: number): void {
    this.attack.cancel(time);
    this.clearWarning();
  }

  takeDamage(amount = 1): boolean {
    if (!this.active) {
      return false;
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) {
      this.clearWarning();
      this.sightLine.destroy();
      this.warningText.destroy();
      this.destroy();
      return true;
    }
    this.setTintFill(0xf3d45a);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  private drawWarning(muzzle: SamPoint, target: SamPoint, time: number): void {
    this.sightLine.clear();
    this.sightLine.lineStyle(2, 0xffcd6c, Math.floor(time / 180) % 2 === 0 ? 0.9 : 0.45);
    this.sightLine.lineBetween(muzzle.x, muzzle.y, target.x, target.y);
    this.sightLine.strokeCircle(target.x, target.y, 34);
    this.sightLine.strokeCircle(target.x, target.y, 16);
    this.warningText.setVisible(true);
  }

  private clearWarning(): void {
    this.sightLine.clear();
    this.warningText.setVisible(false);
  }
}
