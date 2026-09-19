import Phaser from 'phaser';

import {
  CAMERA,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  HELICOPTER,
  HOSTAGE,
  PRISON_CAMP,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants';
import { Helicopter } from '../entities/Helicopter';
import { Hostage } from '../entities/Hostage';
import { PrisonCamp } from '../entities/PrisonCamp';
import { RescueBase } from '../entities/RescueBase';
import { Tank } from '../entities/Tank';
import { getCannonVelocity } from '../logic/cannonAim';
import { HostageState, HostageUpdateEvent } from '../logic/hostageState';
import { GameState } from '../state/GameState';

export class GameScene extends Phaser.Scene {
  private helicopter!: Helicopter;
  private tank!: Tank;
  private prisonCamp!: PrisonCamp;
  private rescueBase!: RescueBase;
  private hostages: Hostage[] = [];
  private cannonRounds!: Phaser.Physics.Arcade.Group;
  private statusText!: Phaser.GameObjects.Text;
  private rescueText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private gameState!: GameState;
  private targetDestroyed = false;
  private nextPassengerUnloadAt = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.gameState = new GameState();
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.createBattlefield();

    const ground = this.add.rectangle(
      WORLD_WIDTH / 2,
      GROUND_Y + (WORLD_HEIGHT - GROUND_Y) / 2,
      WORLD_WIDTH,
      WORLD_HEIGHT - GROUND_Y,
      0x334a2e,
    );
    this.physics.add.existing(ground, true);

    this.rescueBase = new RescueBase(this);
    this.helicopter = new Helicopter(this, 280, GROUND_Y - 21);
    this.tank = new Tank(this, 1780, GROUND_Y - 21);
    this.prisonCamp = new PrisonCamp(this, 2600, GROUND_Y - 36);
    this.cannonRounds = this.physics.add.group({
      allowGravity: false,
      maxSize: 32,
    });

    this.physics.add.collider(this.helicopter, ground);
    this.physics.add.overlap(
      this.tank,
      this.cannonRounds,
      (tankObject, roundObject) => {
        const target = tankObject as Tank;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        round.disableBody(true, true);

        if (target.active && target.takeDamage()) {
          this.targetDestroyed = true;
          this.updateObjectiveText();
        }
      },
    );
    this.physics.add.overlap(
      this.prisonCamp,
      this.cannonRounds,
      (campObject, roundObject) => {
        const camp = campObject as PrisonCamp;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        round.disableBody(true, true);

        if (camp.active && camp.takeDamage()) {
          this.releaseHostages();
          this.updateObjectiveText();
        }
      },
    );

    this.configureCamera();
    this.createFlightDisplay();
  }

  update(time: number, delta: number): void {
    const shot = this.helicopter.update(time);
    if (shot) {
      this.fireCannon(
        shot.x,
        shot.y,
        shot.direction,
        shot.downwardAngleRadians,
      );
    }

    let hostageStateChanged = false;
    for (const hostage of this.hostages) {
      const event = hostage.update(delta, this.helicopter);
      if (event === HostageUpdateEvent.Boarded) {
        hostageStateChanged = true;
      } else if (event === HostageUpdateEvent.Rescued) {
        this.gameState.recordRescue(1);
        this.nextPassengerUnloadAt = time + HOSTAGE.unloadIntervalMs;
        hostageStateChanged = true;
      }
    }
    if (this.tryStartPassengerUnload(time)) {
      hostageStateChanged = true;
    }
    if (hostageStateChanged) {
      this.updateObjectiveText();
    }

    this.cannonRounds.children.each((child) => {
      const round = child as Phaser.Physics.Arcade.Image;
      if (
        round.active &&
        (round.x < -32 ||
          round.x > WORLD_WIDTH + 32 ||
          round.y > WORLD_HEIGHT + 32)
      ) {
        round.disableBody(true, true);
      }
      return true;
    });

    const flightState = this.helicopter.isLanded ? 'LANDED' : 'AIRBORNE';
    const tankState = this.targetDestroyed ? 'DESTROYED' : 'ACTIVE';
    const campState = this.prisonCamp.isOpen ? 'OPEN' : 'CLOSED';
    this.statusText.setText(
      `FLIGHT: ${flightState}   TANK: ${tankState}   CAMP: ${campState}   PAX: ${this.helicopter.passengerCount}/${this.helicopter.passengerCapacity}`,
    );
    this.rescueText.setText(
      `RESCUED: ${this.gameState.rescued}   SCORE: ${this.gameState.score}`,
    );
  }

  private createBattlefield(): void {
    for (let x = 220; x < WORLD_WIDTH; x += 440) {
      const height = 70 + ((x / 440) % 3) * 24;
      this.add.triangle(
        x,
        GROUND_Y - height / 2,
        0,
        height,
        115,
        0,
        230,
        height,
        0x263629,
      );
    }

    this.add.text(1665, GROUND_Y - 82, 'ARMORED TARGET', {
      color: '#c7b96a',
      fontFamily: 'Courier New',
      fontSize: '18px',
    });
    this.add.text(2475, GROUND_Y - 110, 'PRISON CAMP', {
      color: '#c7b96a',
      fontFamily: 'Courier New',
      fontSize: '18px',
    });
  }

  private configureCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(
      this.helicopter,
      true,
      CAMERA.followLerp,
      CAMERA.followLerp,
      0,
      CAMERA.verticalFollowOffset,
    );
    camera.setDeadzone(
      CAMERA.horizontalDeadzone,
      CAMERA.verticalDeadzone,
    );
  }

  private createFlightDisplay(): void {
    this.add
      .rectangle(GAME_WIDTH / 2, 40, GAME_WIDTH, 80, 0x11150f, 0.88)
      .setScrollFactor(0);

    this.add
      .text(24, 12, 'WASD / ARROWS: FLY   SPACE: FIRE', {
        color: '#d6dec3',
        fontFamily: 'Courier New',
        fontSize: '18px',
      })
      .setScrollFactor(0);

    this.statusText = this.add
      .text(
        GAME_WIDTH - 24,
        12,
        'FLIGHT: LANDED   TANK: ACTIVE   CAMP: CLOSED   PAX: 0/8',
        {
          color: '#f3d45a',
          fontFamily: 'Courier New',
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(1, 0)
      .setScrollFactor(0);

    this.rescueText = this.add
      .text(24, 46, 'RESCUED: 0   SCORE: 0', {
        color: '#8fe388',
        fontFamily: 'Courier New',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0);

    this.targetText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 38,
        'DESTROY THE TANK AND PRISON CAMP',
        {
          backgroundColor: '#243128',
          color: '#d6dec3',
          fontFamily: 'Courier New',
          fontSize: '18px',
          padding: { x: 12, y: 8 },
        },
      )
      .setOrigin(0.5, 1)
      .setScrollFactor(0);
  }

  private fireCannon(
    x: number,
    y: number,
    direction: -1 | 1,
    downwardAngleRadians: number,
  ): void {
    const round = this.cannonRounds.get(
      x,
      y,
      'cannon-round',
    ) as Phaser.Physics.Arcade.Image | null;

    if (!round) {
      return;
    }

    const velocity = getCannonVelocity(
      direction,
      HELICOPTER.cannonRoundSpeed,
      downwardAngleRadians,
    );

    round
      .enableBody(true, x, y, true, true)
      .setFlipX(direction < 0)
      .setRotation(direction * downwardAngleRadians)
      .setVelocity(velocity.x, velocity.y);
  }

  private releaseHostages(): void {
    for (let index = 0; index < PRISON_CAMP.hostageCount; index += 1) {
      const direction = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const rallyX =
        this.prisonCamp.x +
        direction * (HOSTAGE.rallyDistance + row * HOSTAGE.rallySpacing);

      this.hostages.push(
        new Hostage(
          this,
          this.prisonCamp.x,
          rallyX,
          index * HOSTAGE.releaseDelayMs,
        ),
      );
    }
  }

  private tryStartPassengerUnload(time: number): boolean {
    if (
      time < this.nextPassengerUnloadAt ||
      this.helicopter.passengerCount === 0 ||
      !this.rescueBase.canUnload(this.helicopter) ||
      this.hostages.some(
        (hostage) => hostage.currentState === HostageState.RunningToBase,
      )
    ) {
      return false;
    }

    const passenger = this.hostages.find(
      (hostage) => hostage.currentState === HostageState.Aboard,
    );
    if (
      !passenger ||
      !passenger.beginDisembarking(
        this.helicopter.x,
        this.rescueBase.entranceX,
      )
    ) {
      return false;
    }

    if (!this.helicopter.unloadPassenger()) {
      throw new Error('Passenger manifest did not match aboard hostages.');
    }

    return true;
  }

  private updateObjectiveText(): void {
    const passengers = this.helicopter.passengerCount;
    const hostagesAtCamp = this.hostages.filter((hostage) =>
      [
        HostageState.RunningOut,
        HostageState.Waiting,
        HostageState.RunningToHelicopter,
      ].includes(hostage.currentState),
    ).length;
    const disembarking = this.hostages.some(
      (hostage) => hostage.currentState === HostageState.RunningToBase,
    );
    const unloadingAtBase =
      passengers > 0 && this.rescueBase.canUnload(this.helicopter);

    if (disembarking || unloadingAtBase) {
      this.targetText.setText(
        `UNLOADING: ${this.gameState.rescued} RESCUED   ${passengers} ABOARD`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (passengers === this.helicopter.passengerCapacity) {
      this.targetText.setText('HELICOPTER FULL — RETURN TO BASE');
      this.targetText.setColor('#8fe388');
      return;
    }

    if (passengers > 0 && hostagesAtCamp === 0) {
      this.targetText.setText(
        this.targetDestroyed
          ? 'HOSTAGES ABOARD — RETURN TO BASE'
          : 'HOSTAGES ABOARD — DESTROY THE TANK',
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (passengers > 0) {
      this.targetText.setText(
        `BOARDING: ${passengers} ABOARD   ${hostagesAtCamp} WAITING`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (
      this.hostages.length > 0 &&
      this.gameState.rescued === this.hostages.length
    ) {
      this.targetText.setText(
        this.targetDestroyed
          ? 'RESCUE COMPLETE'
          : 'HOSTAGES RESCUED — DESTROY THE TANK',
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (this.gameState.rescued > 0) {
      this.targetText.setText(
        `${this.gameState.rescued} RESCUED — RETURN FOR ${hostagesAtCamp}`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (this.targetDestroyed && this.prisonCamp.isOpen) {
      this.targetText.setText('LAND NEAR THE HOSTAGES TO BOARD');
      this.targetText.setColor('#8fe388');
      return;
    }

    if (this.prisonCamp.isOpen) {
      this.targetText.setText('HOSTAGES RELEASED — DESTROY THE TANK');
      this.targetText.setColor('#8fe388');
      return;
    }

    if (this.targetDestroyed) {
      this.targetText.setText('DESTROY THE PRISON CAMP');
      this.targetText.setColor('#f3d45a');
    }
  }
}
