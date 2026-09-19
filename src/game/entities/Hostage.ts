import Phaser from 'phaser';

import { GROUND_Y, HOSTAGE } from '../constants';
import {
  canBeginBoarding,
  HostageState,
  HostageUpdateEvent,
  isHostageTransitionAllowed,
} from '../logic/hostageState';
import type { Helicopter } from './Helicopter';

export class Hostage extends Phaser.GameObjects.Sprite {
  private hostageState = HostageState.Captive;
  private releaseDelayRemainingMs: number;
  private rescueTargetX: number | null = null;

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

  beginDisembarking(startX: number, targetX: number): boolean {
    if (this.hostageState !== HostageState.Aboard) {
      return false;
    }

    this.x = startX;
    this.y = GROUND_Y;
    this.rescueTargetX = targetX;
    this.setVisible(true);
    this.transitionTo(HostageState.RunningToBase);
    return true;
  }

  update(
    deltaMs: number,
    helicopter: Helicopter,
  ): HostageUpdateEvent | null {
    switch (this.hostageState) {
      case HostageState.RunningOut:
        if (this.releaseDelayRemainingMs > 0) {
          this.releaseDelayRemainingMs -= deltaMs;
          return null;
        }

        if (this.moveToward(this.rallyX, HOSTAGE.runningOutSpeed, deltaMs)) {
          this.transitionTo(HostageState.Waiting);
        }
        return null;

      case HostageState.Waiting:
        if (this.canApproach(helicopter)) {
          this.transitionTo(HostageState.RunningToHelicopter);
        }
        return null;

      case HostageState.RunningToHelicopter:
        if (!this.canApproach(helicopter)) {
          this.transitionTo(HostageState.Waiting);
          return null;
        }

        if (
          this.moveToward(helicopter.x, HOSTAGE.boardingSpeed, deltaMs) &&
          helicopter.tryBoardPassenger()
        ) {
          this.transitionTo(HostageState.Aboard);
          this.setVisible(false);
          return HostageUpdateEvent.Boarded;
        }
        return null;

      case HostageState.RunningToBase:
        if (
          this.rescueTargetX !== null &&
          this.moveToward(
            this.rescueTargetX,
            HOSTAGE.disembarkingSpeed,
            deltaMs,
          )
        ) {
          this.transitionTo(HostageState.Rescued);
          this.setVisible(false);
          return HostageUpdateEvent.Rescued;
        }
        return null;

      case HostageState.Captive:
      case HostageState.Aboard:
      case HostageState.Rescued:
        return null;
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
