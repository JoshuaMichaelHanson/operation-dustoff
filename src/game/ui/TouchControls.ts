import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import {
  quantizeVirtualStick,
  type TouchInputState,
} from '../input/touchInput';

const STICK_X = 145;
const STICK_Y = GAME_HEIGHT - 135;
const STICK_RADIUS = 78;
const STICK_DEAD_ZONE = 18;

export class TouchControls {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly stickThumb: Phaser.GameObjects.Arc;
  private readonly cannonButton: Phaser.GameObjects.Arc;
  private readonly missileButton: Phaser.GameObjects.Arc;
  private readonly missileText: Phaser.GameObjects.Text;
  private stickPointer: Phaser.Input.Pointer | null = null;
  private readonly cannonPointers = new Set<Phaser.Input.Pointer>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly inputState: TouchInputState,
  ) {
    scene.input.addPointer(2);

    const stickBase = scene.add
      .circle(STICK_X, STICK_Y, STICK_RADIUS, 0x11150f, 0.46)
      .setStrokeStyle(4, 0x91a087, 0.72);
    const stickCrossHorizontal = scene.add
      .rectangle(STICK_X, STICK_Y, 112, 3, 0x91a087, 0.32);
    const stickCrossVertical = scene.add
      .rectangle(STICK_X, STICK_Y, 3, 112, 0x91a087, 0.32);
    this.stickThumb = scene.add
      .circle(STICK_X, STICK_Y, 31, 0xc7b96a, 0.7)
      .setStrokeStyle(3, 0xf3d45a, 0.9);
    const stickZone = scene.add
      .zone(STICK_X, STICK_Y, STICK_RADIUS * 2.5, STICK_RADIUS * 2.5)
      .setInteractive();

    this.cannonButton = scene.add
      .circle(GAME_WIDTH - 120, GAME_HEIGHT - 130, 68, 0x6b352c, 0.68)
      .setStrokeStyle(4, 0xe46b56, 0.9);
    const cannonText = scene.add
      .text(GAME_WIDTH - 120, GAME_HEIGHT - 130, 'CANNON', {
        color: '#ffffff',
        fontFamily: 'Courier New',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const cannonZone = scene.add
      .zone(GAME_WIDTH - 120, GAME_HEIGHT - 130, 150, 150)
      .setInteractive();

    this.missileButton = scene.add
      .circle(GAME_WIDTH - 285, GAME_HEIGHT - 105, 52, 0x263629, 0.68)
      .setStrokeStyle(3, 0x91a087, 0.78);
    this.missileText = scene.add
      .text(GAME_WIDTH - 285, GAME_HEIGHT - 105, 'MISSILE\nNO LOCK', {
        align: 'center',
        color: '#91a087',
        fontFamily: 'Courier New',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const missileZone = scene.add
      .zone(GAME_WIDTH - 285, GAME_HEIGHT - 105, 120, 120)
      .setInteractive();

    this.objects.push(
      stickBase,
      stickCrossHorizontal,
      stickCrossVertical,
      this.stickThumb,
      stickZone,
      this.cannonButton,
      cannonText,
      cannonZone,
      this.missileButton,
      this.missileText,
      missileZone,
    );
    for (const object of this.objects) {
      const displayObject = object as Phaser.GameObjects.GameObject & {
        setScrollFactor?: (x: number, y?: number) => unknown;
        setDepth?: (depth: number) => unknown;
      };
      displayObject.setScrollFactor?.(0);
      displayObject.setDepth?.(2000);
    }

    stickZone.on('pointerdown', this.handleStickDown);
    stickZone.on('pointerup', this.handlePointerUp);
    stickZone.on('pointerupoutside', this.handlePointerUp);
    cannonZone.on('pointerdown', this.handleCannonDown);
    cannonZone.on('pointerup', this.handlePointerUp);
    cannonZone.on('pointerupoutside', this.handlePointerUp);
    missileZone.on('pointerdown', this.handleMissileDown);
    scene.input.on('pointermove', this.handlePointerMove);
    scene.input.on('pointerup', this.handlePointerUp);
    scene.input.on('gameout', this.reset);
  }

  update(): void {
    if (this.stickPointer && !this.stickPointer.isDown) {
      this.releaseStick();
    }

    for (const pointer of this.cannonPointers) {
      if (!pointer.isDown) {
        this.cannonPointers.delete(pointer);
      }
    }
    this.updateCannonState();
  }

  setMissileStatus(hasLock: boolean, isReady: boolean): void {
    if (!hasLock) {
      this.missileButton.setFillStyle(0x263629, 0.68);
      this.missileButton.setStrokeStyle(3, 0x91a087, 0.78);
      this.missileText.setColor('#91a087').setText('MISSILE\nNO LOCK');
      return;
    }

    if (!isReady) {
      this.missileButton.setFillStyle(0x4d452a, 0.72);
      this.missileButton.setStrokeStyle(3, 0xc7b96a, 0.85);
      this.missileText.setColor('#c7b96a').setText('MISSILE\nRELOAD');
      return;
    }

    this.missileButton.setFillStyle(0x36543a, 0.76);
    this.missileButton.setStrokeStyle(4, 0x8fe388, 0.95);
    this.missileText.setColor('#8fe388').setText('MISSILE\nLOCK');
  }

  destroy(): void {
    this.reset();
    this.scene.input.off('pointermove', this.handlePointerMove);
    this.scene.input.off('pointerup', this.handlePointerUp);
    this.scene.input.off('gameout', this.reset);
    for (const object of this.objects) {
      object.destroy();
    }
  }

  private readonly handleStickDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.stickPointer) {
      return;
    }
    this.stickPointer = pointer;
    this.updateStick(pointer);
  };

  private readonly handleCannonDown = (pointer: Phaser.Input.Pointer): void => {
    this.cannonPointers.add(pointer);
    this.inputState.cannonDown = true;
    this.cannonButton.setFillStyle(0xa33f32, 0.88);
  };

  private readonly handleMissileDown = (): void => {
    this.inputState.queueMissile();
    this.scene.tweens.add({
      targets: this.missileButton,
      scale: 0.88,
      duration: 70,
      yoyo: true,
    });
  };

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (pointer === this.stickPointer && pointer.isDown) {
      this.updateStick(pointer);
    }
  };

  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (pointer === this.stickPointer) {
      this.releaseStick();
    }
    if (this.cannonPointers.delete(pointer)) {
      this.updateCannonState();
    }
  };

  private readonly reset = (): void => {
    this.stickPointer = null;
    this.cannonPointers.clear();
    this.inputState.reset();
    this.stickThumb.setPosition(STICK_X, STICK_Y);
    this.cannonButton.setFillStyle(0x6b352c, 0.68);
  };

  private updateStick(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - STICK_X;
    const deltaY = pointer.y - STICK_Y;
    const distance = Math.hypot(deltaX, deltaY);
    const scale = distance > STICK_RADIUS ? STICK_RADIUS / distance : 1;
    this.stickThumb.setPosition(
      STICK_X + deltaX * scale,
      STICK_Y + deltaY * scale,
    );
    this.inputState.setDirection(
      quantizeVirtualStick(deltaX, deltaY, STICK_DEAD_ZONE),
    );
  }

  private releaseStick(): void {
    this.stickPointer = null;
    this.inputState.setDirection({ horizontal: 0, vertical: 0 });
    this.stickThumb.setPosition(STICK_X, STICK_Y);
  }

  private updateCannonState(): void {
    this.inputState.cannonDown = this.cannonPointers.size > 0;
    if (!this.inputState.cannonDown) {
      this.cannonButton.setFillStyle(0x6b352c, 0.68);
    }
  }
}
