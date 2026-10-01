import Phaser from 'phaser';

import type { ControlDirection } from '../logic/helicopterMotion';
import type { TouchInputState } from './touchInput';

interface DirectionKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

export class PlayerInput {
  private readonly cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd?: DirectionKeys;
  private readonly fireKey?: Phaser.Input.Keyboard.Key;
  private readonly missileKey?: Phaser.Input.Keyboard.Key;
  private readonly bombKey?: Phaser.Input.Keyboard.Key;
  private readonly turnKey?: Phaser.Input.Keyboard.Key;

  constructor(
    scene: Phaser.Scene,
    private readonly touch: TouchInputState,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      return;
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
    this.bombKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.turnKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.X,
      Phaser.Input.Keyboard.KeyCodes.Z,
      Phaser.Input.Keyboard.KeyCodes.F,
    ]);
  }

  get horizontalDirection(): ControlDirection {
    const movingLeft =
      (this.cursors?.left.isDown ?? false) ||
      (this.wasd?.left.isDown ?? false) ||
      this.touch.horizontal < 0;
    const movingRight =
      (this.cursors?.right.isDown ?? false) ||
      (this.wasd?.right.isDown ?? false) ||
      this.touch.horizontal > 0;

    return movingLeft === movingRight ? 0 : movingLeft ? -1 : 1;
  }

  get verticalDirection(): ControlDirection {
    const movingUp =
      (this.cursors?.up.isDown ?? false) ||
      (this.wasd?.up.isDown ?? false) ||
      this.touch.vertical < 0;
    const movingDown =
      (this.cursors?.down.isDown ?? false) ||
      (this.wasd?.down.isDown ?? false) ||
      this.touch.vertical > 0;

    return movingUp === movingDown ? 0 : movingUp ? -1 : 1;
  }

  get cannonDown(): boolean {
    return (this.fireKey?.isDown ?? false) || this.touch.cannonDown;
  }

  consumeMissilePress(): boolean {
    const keyboardPressed = this.missileKey
      ? Phaser.Input.Keyboard.JustDown(this.missileKey)
      : false;
    const touchPressed = this.touch.consumeMissile();
    return keyboardPressed || touchPressed;
  }

  consumeBombPress(): boolean {
    const keyboardPressed = this.bombKey
      ? Phaser.Input.Keyboard.JustDown(this.bombKey)
      : false;
    const touchPressed = this.touch.consumeBomb();
    return keyboardPressed || touchPressed;
  }

  consumeTurnPress(): boolean {
    const keyboardPressed = this.turnKey
      ? Phaser.Input.Keyboard.JustDown(this.turnKey)
      : false;
    const touchPressed = this.touch.consumeTurn();
    return keyboardPressed || touchPressed;
  }
}
