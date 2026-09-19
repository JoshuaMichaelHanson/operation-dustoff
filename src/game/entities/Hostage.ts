import Phaser from 'phaser';

import { GROUND_Y, HOSTAGE } from '../constants';
import {
  canBeginBoarding,
  HostageState,
  isHostageTransitionAllowed,
} from '../logic/hostageState';
import type { Helicopter } from './Helicopter';

export class Hostage extends Phaser.GameObjects.Sprite {
  private hostageState = HostageState.Captive;
  private releaseDelayRemainingMs: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    private readonly rallyX: number,
    releaseDelayMs: number,
  ) {
    super(scene, x, GROUND_Y, 'hostage');

    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.releaseDelayRemainingMs = releaseDelayMs;
    this.transitionTo(HostageState.RunningOut);
  }

  get currentState(): HostageState {
    return this.hostageState;
  }

  update(deltaMs: number, helicopter: Helicopter): boolean {
    switch (this.hostageState) {
      case HostageState.RunningOut:
        if (this.releaseDelayRemainingMs > 0) {
          this.releaseDelayRemainingMs -= deltaMs;
          return false;
        }

        if (this.moveToward(this.rallyX, HOSTAGE.runningOutSpeed, deltaMs)) {
          this.transitionTo(HostageState.Waiting);
        }
        return false;

      case HostageState.Waiting:
        if (this.canApproach(helicopter)) {
          this.transitionTo(HostageState.RunningToHelicopter);
        }
        return false;

      case HostageState.RunningToHelicopter:
        if (!this.canApproach(helicopter)) {
          this.transitionTo(HostageState.Waiting);
          return false;
        }

        if (
          this.moveToward(helicopter.x, HOSTAGE.boardingSpeed, deltaMs) &&
          helicopter.tryBoardPassenger()
        ) {
          this.transitionTo(HostageState.Aboard);
          this.setVisible(false);
          return true;
        }
        return false;

      case HostageState.Captive:
      case HostageState.Aboard:
      case HostageState.Rescued:
        return false;
    }
  }

  private canApproach(helicopter: Helicopter): boolean {
    return canBeginBoarding({
      helicopterLanded: helicopter.isLanded,
      distanceToHelicopter: Math.abs(this.x - helicopter.x),
      boardingRadius: HOSTAGE.boardingRadius,
      passengerCount: helicopter.passengerCount,
      passengerCapacity: helicopter.passengerCapacity,
    });
  }

  private moveToward(targetX: number, speed: number, deltaMs: number): boolean {
    const distance = targetX - this.x;
    const arrivalDistance =
      this.hostageState === HostageState.RunningToHelicopter
        ? HOSTAGE.boardingDistance
        : 1;

    if (Math.abs(distance) <= arrivalDistance) {
      return true;
    }

    const movement = Math.min(Math.abs(distance), speed * (deltaMs / 1000));
    const direction = Math.sign(distance);
    this.x += direction * movement;
    this.setFlipX(direction < 0);
    return Math.abs(targetX - this.x) <= arrivalDistance;
  }

  private transitionTo(nextState: HostageState): void {
    if (!isHostageTransitionAllowed(this.hostageState, nextState)) {
      throw new Error(
        `Invalid hostage transition: ${this.hostageState} -> ${nextState}`,
      );
    }

    this.hostageState = nextState;
  }
}
