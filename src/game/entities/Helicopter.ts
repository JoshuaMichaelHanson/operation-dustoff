import Phaser from 'phaser';

import { HELICOPTER, MISSILE } from '../constants';
import { Health } from '../logic/health';
import { getDamageSmokeProfile } from '../logic/damageSmoke';
import {
  getHorizontalControlAcceleration,
  getHorizontalDrag,
  getVerticalControlAcceleration,
  isSafeLanding,
  type ControlDirection,
} from '../logic/helicopterMotion';
import { PassengerManifest } from '../logic/passengerManifest';

interface DirectionKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

export interface CannonShot {
  x: number;
  y: number;
  direction: -1 | 1;
  downwardAngleRadians: number;
}

export interface MissileLaunch {
  x: number;
  y: number;
  direction: -1 | 1;
}

export class Helicopter extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: DirectionKeys;
  private readonly fireKey: Phaser.Input.Keyboard.Key;
  private readonly missileKey: Phaser.Input.Keyboard.Key;
  private facing: -1 | 1 = 1;
  private lastCannonShotAt = Number.NEGATIVE_INFINITY;
  private lastMissileShotAt = Number.NEGATIVE_INFINITY;
  private nextSmokeAt = 0;
  private landed = false;
  private readonly passengers = new PassengerManifest(
    HELICOPTER.passengerCapacity,
  );
  private readonly healthState = new Health(HELICOPTER.maximumHealth);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'helicopter');

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play('helicopter-rotors');

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required to control the helicopter.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as DirectionKeys;
    this.fireKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.missileKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.X,
    ]);

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
    const launchPressed = Phaser.Input.Keyboard.JustDown(this.missileKey);
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
    this.clearTint();
    this.setActive(true).setVisible(true).setPosition(x, y).setRotation(0);
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
    const movingLeft = this.cursors.left.isDown || this.wasd.left.isDown;
    const movingRight = this.cursors.right.isDown || this.wasd.right.isDown;
    const movingUp = this.cursors.up.isDown || this.wasd.up.isDown;
    const movingDown = this.cursors.down.isDown || this.wasd.down.isDown;

    body.setAccelerationX(0);
    body.setAccelerationY(0);

    const horizontalInput: ControlDirection =
      movingLeft === movingRight ? 0 : movingLeft ? -1 : 1;
    if (horizontalInput !== 0) {
      this.facing = horizontalInput;
    }
    const touchingGround = body.blocked.down || body.touching.down;
    body.setDragX(getHorizontalDrag(touchingGround, horizontalInput));
    body.setAccelerationX(
      getHorizontalControlAcceleration(horizontalInput, body.velocity.x),
    );

    const verticalInput: ControlDirection =
      movingUp === movingDown ? 0 : movingUp ? -1 : 1;
    body.setAccelerationY(getVerticalControlAcceleration(verticalInput));

    const forwardSpeedRatio = Phaser.Math.Clamp(
      Math.abs(body.velocity.x) / HELICOPTER.maximumHorizontalSpeed,
      0,
      1,
    );
    const downwardAngleRadians =
      forwardSpeedRatio * HELICOPTER.maximumForwardPitchRadians;

    this.setFlipX(this.facing < 0);
    this.setRotation(this.facing * downwardAngleRadians);
    this.updateDamageSmoke(time);

    this.landed = isSafeLanding({
      touchingGround,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
    });

    if (
      this.fireKey.isDown &&
      time - this.lastCannonShotAt >= HELICOPTER.cannonCooldownMs
    ) {
      this.lastCannonShotAt = time;
      return {
        x: this.x + this.facing * 53,
        y: this.y + 2,
        direction: this.facing,
        downwardAngleRadians,
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
