import Phaser from 'phaser';

import { BOMB, HELICOPTER, MISSILE } from '../constants';
import type { PlayerInput } from '../input/PlayerInput';
import { Health } from '../logic/health';
import { getDamageSmokeProfile } from '../logic/damageSmoke';
import {
  getFlightAttitude,
  getHorizontalControlAcceleration,
  getHorizontalDrag,
  getVerticalControlAcceleration,
  isSafeLanding,
} from '../logic/helicopterMotion';
import { getCannonMuzzlePosition } from '../logic/cannonAim';
import { PassengerManifest } from '../logic/passengerManifest';

export interface CannonShot {
  x: number;
  y: number;
  direction: -1 | 1;
  aimAngleRadians: number;
}

export interface MissileLaunch {
  x: number;
  y: number;
  direction: -1 | 1;
}

export interface BombDrop {
  x: number;
  y: number;
  helicopterVelocityX: number;
}

export class Helicopter extends Phaser.Physics.Arcade.Sprite {
  private facing: -1 | 1 = 1;
  private lastCannonShotAt = Number.NEGATIVE_INFINITY;
  private lastMissileShotAt = Number.NEGATIVE_INFINITY;
  private lastBombDropAt = Number.NEGATIVE_INFINITY;
  private nextSmokeAt = 0;
  private landed = false;
  private readonly passengers = new PassengerManifest(
    HELICOPTER.passengerCapacity,
  );
  private readonly healthState = new Health(HELICOPTER.maximumHealth);

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly controls: PlayerInput,
  ) {
    super(scene, x, y, 'helicopter');

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play('helicopter-rotors');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(76, 30);
    body.setOffset(10, 17);
    body.setGravityY(HELICOPTER.passiveGravity);
    body.setDrag(HELICOPTER.horizontalDrag, HELICOPTER.verticalDrag);
    body.setMaxVelocity(
      HELICOPTER.maximumHorizontalSpeed,
      HELICOPTER.maximumVerticalSpeed,
    );
    body.setCollideWorldBounds(true);
  }

  get isLanded(): boolean {
    return this.landed;
  }

  get passengerCount(): number {
    return this.passengers.count;
  }

  get passengerCapacity(): number {
    return HELICOPTER.passengerCapacity;
  }

  get health(): number {
    return this.healthState.current;
  }

  get facingDirection(): -1 | 1 {
    return this.facing;
  }

  isMissileReady(time: number): boolean {
    return time - this.lastMissileShotAt >= MISSILE.cooldownMs;
  }

  tryFireMissile(time: number, hasLock: boolean): MissileLaunch | null {
    const launchPressed = this.controls.consumeMissilePress();
    if (
      !this.active ||
      !hasLock ||
      !launchPressed ||
      !this.isMissileReady(time)
    ) {
      return null;
    }

    this.lastMissileShotAt = time;
    return {
      x: this.x + this.facing * 52,
      y: this.y - 4,
      direction: this.facing,
    };
  }

  isBombReady(time: number): boolean {
    return time - this.lastBombDropAt >= BOMB.cooldownMs;
  }

  tryDropBomb(time: number): BombDrop | null {
    const dropPressed = this.controls.consumeBombPress();
    if (!this.active || !dropPressed || !this.isBombReady(time)) {
      return null;
    }

    this.lastBombDropAt = time;
    const body = this.body as Phaser.Physics.Arcade.Body;
    return {
      x: this.x,
      y: this.y + 29,
      helicopterVelocityX: body.velocity.x,
    };
  }

  tryBoardPassenger(): boolean {
    return this.passengers.tryBoard();
  }

  unloadPassenger(): boolean {
    return this.passengers.unloadOne();
  }

  takeDamage(amount: number): boolean {
    const destroyed = this.healthState.takeDamage(amount);

    if (!destroyed) {
      this.setTintFill(0xe46b56);
      this.scene.time.delayedCall(100, () => {
        if (this.active) {
          this.clearTint();
        }
      });
    }

    return destroyed;
  }

  disableAfterDestruction(): number {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.enable = false;
    this.landed = false;
    this.setActive(false).setVisible(false);
    return this.passengers.clear();
  }

  respawn(x: number, y: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.healthState.reset();
    this.nextSmokeAt = 0;
    this.landed = false;
    this.facing = 1;
    this.clearTint();
    this.setActive(true).setVisible(true).setPosition(x, y).setRotation(0);
    this.setFlipX(false);
    body.enable = true;
    body.reset(x, y);
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
  }

  update(time: number): CannonShot | null {
    if (!this.active) {
      return null;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    body.setAccelerationX(0);
    body.setAccelerationY(0);

    if (this.controls.consumeTurnPress()) {
      this.facing = this.facing === 1 ? -1 : 1;
    }
    const horizontalInput = this.controls.horizontalDirection;
    const touchingGround = body.blocked.down || body.touching.down;
    body.setDragX(getHorizontalDrag(touchingGround, horizontalInput));
    body.setAccelerationX(
      getHorizontalControlAcceleration(horizontalInput, body.velocity.x),
    );

    const verticalInput = this.controls.verticalDirection;
    body.setAccelerationY(getVerticalControlAcceleration(verticalInput));

    const attitude = getFlightAttitude(body.velocity.x, this.facing);

    this.setFlipX(this.facing < 0);
    this.setRotation(attitude.rotationRadians);
    this.updateDamageSmoke(time);

    this.landed = isSafeLanding({
      touchingGround,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
    });

    if (
      this.controls.cannonDown &&
      time - this.lastCannonShotAt >= HELICOPTER.cannonCooldownMs
    ) {
      this.lastCannonShotAt = time;
      const muzzle = getCannonMuzzlePosition(
        this.x, this.y, this.facing, attitude.rotationRadians,
      );
      return {
        x: muzzle.x,
        y: muzzle.y,
        direction: this.facing,
        aimAngleRadians: attitude.cannonAngleRadians,
      };
    }

    return null;
  }

  private updateDamageSmoke(time: number): void {
    const profile = getDamageSmokeProfile(
      this.healthState.current,
      HELICOPTER.maximumHealth,
    );
    if (!profile) {
      this.nextSmokeAt = time;
      return;
    }

    if (time < this.nextSmokeAt) {
      return;
    }

    this.nextSmokeAt = time + profile.intervalMs;
    const puff = this.scene.add.circle(
      this.x - this.facing * 36,
      this.y - 6,
      profile.radius,
      profile.color,
      profile.alpha,
    );
    this.scene.tweens.add({
      targets: puff,
      x: puff.x - this.facing * Phaser.Math.FloatBetween(12, 26),
      y: puff.y - Phaser.Math.FloatBetween(28, 45),
      alpha: 0,
      scale: Phaser.Math.FloatBetween(1.8, 2.4),
      duration: Phaser.Math.Between(650, 900),
      ease: 'Sine.easeOut',
      onComplete: () => puff.destroy(),
    });
  }
}
