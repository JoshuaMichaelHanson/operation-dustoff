import Phaser from 'phaser';

import { BOSS } from '../constants';
import type { BossConfig } from '../levels/levelConfig';
import { BossAttack, type BossAttackStep } from '../logic/bossBehavior';
import type { Helicopter } from './Helicopter';

export class BossHelicopter extends Phaser.Physics.Arcade.Sprite {
  private currentHealth: number = BOSS.health;
  private readonly attack = new BossAttack();
  private readonly healthBar: Phaser.GameObjects.Graphics;
  private readonly warningLine: Phaser.GameObjects.Graphics;
  private readonly rotorBlur: Phaser.GameObjects.Graphics;
  private readonly warningText: Phaser.GameObjects.Text;
  private patrolDirection: -1 | 1 = 1;

  constructor(scene: Phaser.Scene, private readonly config: BossConfig) {
    super(scene, config.x, config.y, 'boss-helicopter');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(7);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(150, 46);
    body.setOffset(13, 21);
    body.setVelocityX(BOSS.patrolSpeed);

    this.healthBar = scene.add.graphics().setDepth(14);
    this.warningLine = scene.add.graphics().setDepth(15);
    this.rotorBlur = scene.add.graphics().setDepth(8);
    this.warningText = scene.add.text(config.x, config.y - 95, '', {
      color: '#ffd49a',
      backgroundColor: '#4d272c',
      fontFamily: 'Courier New',
      fontSize: '17px',
      fontStyle: 'bold',
      padding: { x: 6, y: 4 },
    }).setOrigin(0.5).setDepth(16).setVisible(false);
  }

  get health(): number {
    return this.currentHealth;
  }

  get isWarning(): boolean {
    return this.active && this.attack.isWarning;
  }

  get isMissileWarning(): boolean {
    return this.active && this.attack.warningPattern === 'missile';
  }

  get isDamagedPhase(): boolean {
    return this.currentHealth <= BOSS.health / 2;
  }

  update(time: number, target?: Helicopter): BossAttackStep {
    if (!this.active) {
      return { warning: null, shots: [], missileTarget: null };
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x >= this.config.x + this.config.patrolHalfWidth) {
      this.patrolDirection = -1;
    } else if (this.x <= this.config.x - this.config.patrolHalfWidth) {
      this.patrolDirection = 1;
    }
    body.setVelocityX(this.patrolDirection * BOSS.patrolSpeed);
    this.setFlipX(this.patrolDirection < 0);
    this.drawBodyDetails(time);

    const muzzle = { x: this.x, y: this.y + 24 };
    const step = this.attack.advance(time, muzzle,
      target?.active ? { x: target.x, y: target.y } : undefined,
      this.isDamagedPhase);
    this.warningLine.clear();
    if (step.warning) {
      const missileWarning = step.warning.pattern === 'missile';
      this.warningLine.lineStyle(2, missileWarning ? 0xffd166 : 0xffa681,
        Math.floor(time / 160) % 2 === 0 ? 0.85 : 0.45);
      this.warningLine.lineBetween(muzzle.x, muzzle.y,
        step.warning.target.x, step.warning.target.y);
      this.warningLine.strokeCircle(step.warning.target.x,
        step.warning.target.y, 25);
      this.warningText.setText(missileWarning ? 'BOSS MISSILE LOCK'
        : step.warning.pattern === 'aimed' ? 'BOSS AIMING' : 'BOSS SPREAD')
        .setColor(this.isDamagedPhase ? '#ffe08a' : '#ffd49a')
        .setPosition(this.x, this.y - 105)
        .setVisible(true);
    } else {
      this.warningText.setVisible(false);
    }
    return step;
  }

  cancelAttack(time: number): void {
    this.attack.cancel(time);
    this.warningLine.clear();
    this.warningText.setVisible(false);
  }

  takeDamage(amount: number): boolean {
    if (!this.active) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    if (this.currentHealth === 0) {
      this.healthBar.destroy();
      this.warningLine.destroy();
      this.rotorBlur.destroy();
      this.warningText.destroy();
      this.destroy();
      return true;
    }
    this.setTintFill(0xffd49a);
    this.scene.time.delayedCall(90, () => {
      if (this.active) this.clearTint();
    });
    return false;
  }

  private drawBodyDetails(time: number): void {
    this.healthBar.clear();
    this.healthBar.fillStyle(0x241d24, 0.9).fillRect(this.x - 74, this.y - 75,
      148, 10);
    this.healthBar.fillStyle(this.isDamagedPhase ? 0xffd166 : 0xff826c)
      .fillRect(this.x - 72, this.y - 73,
        144 * this.currentHealth / BOSS.health, 6);
    this.rotorBlur.clear();
    this.rotorBlur.lineStyle(3, this.isDamagedPhase ? 0xffd166 : 0xd9d0bc,
      0.78);
    const halfWidth = Math.floor(time / 90) % 2 === 0 ? 85 : 67;
    this.rotorBlur.lineBetween(this.x - halfWidth, this.y - 39,
      this.x + halfWidth, this.y - 39);
  }
}
