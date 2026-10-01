import Phaser from 'phaser';

import { AA_GUN } from '../constants';
import { AaAttack, type AaPoint } from '../logic/aaBehavior';
import type { FlightObstacleConfig } from '../levels/levelConfig';
import type { EnemyShot } from './EnemyShot';

export class AaGun extends Phaser.Physics.Arcade.Sprite {
  private health: number = AA_GUN.health;
  private readonly attack = new AaAttack();
  private readonly aimDots: Phaser.GameObjects.Graphics;
  private readonly warningText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly obstacles: readonly FlightObstacleConfig[],
  ) {
    super(scene, x, y, 'aa-gun');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(68, 34);
    body.setOffset(6, 15);

    this.aimDots = scene.add.graphics().setDepth(15);
    this.warningText = scene.add.text(x, y - 72, 'AA AIMING', {
      color: '#ff7b62',
      backgroundColor: '#3d1918',
      fontFamily: 'Courier New',
      fontSize: '16px',
      fontStyle: 'bold',
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(16).setVisible(false);
  }

  get isWarning(): boolean {
    return this.active && this.attack.isWarning;
  }

  update(time: number, target?: AaPoint): EnemyShot | null {
    if (!this.active) {
      return null;
    }

    const muzzle = { x: this.x, y: this.y - 18 };
    const step = this.attack.advance(time, muzzle, target, this.obstacles);
    if (step.warningTarget) {
      this.drawWarning(muzzle, step.warningTarget, time);
    } else {
      this.clearWarning();
    }
    return step.shot;
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
      this.aimDots.destroy();
      this.warningText.destroy();
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

  private drawWarning(muzzle: AaPoint, target: AaPoint, time: number): void {
    this.aimDots.clear();
    this.aimDots.fillStyle(0xff7b62, 0.9);
    const distance = Phaser.Math.Distance.Between(
      muzzle.x, muzzle.y, target.x, target.y,
    );
    for (let traveled = 28; traveled < distance; traveled += 42) {
      const ratio = traveled / distance;
      this.aimDots.fillCircle(
        muzzle.x + (target.x - muzzle.x) * ratio,
        muzzle.y + (target.y - muzzle.y) * ratio,
        3,
      );
    }
    this.warningText.setVisible(true).setAlpha(
      Math.floor(time / 180) % 2 === 0 ? 1 : 0.55,
    );
  }

  private clearWarning(): void {
    this.aimDots.clear();
    this.warningText.setVisible(false);
  }
}
