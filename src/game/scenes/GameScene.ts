import Phaser from 'phaser';

import {
  CAMERA,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  HELICOPTER,
  HOSTAGE,
  JET,
  MISSILE,
  PLAYER,
  PRISON_CAMP,
  TANK,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants';
import { Helicopter } from '../entities/Helicopter';
import { HomingMissile } from '../entities/HomingMissile';
import { Hostage } from '../entities/Hostage';
import type { EnemyShot } from '../entities/EnemyShot';
import { Jet } from '../entities/Jet';
import { PrisonCamp } from '../entities/PrisonCamp';
import { RescueBase } from '../entities/RescueBase';
import { Tank } from '../entities/Tank';
import { getCannonVelocity } from '../logic/cannonAim';
import { HostageState, HostageUpdateEvent } from '../logic/hostageState';
import { hasPassengerUnloadSpacing } from '../logic/rescueRules';
import { canLockMissileTarget } from '../logic/missileGuidance';
import { GameState } from '../state/GameState';
import { Hud } from '../ui/Hud';

export class GameScene extends Phaser.Scene {
  private helicopter!: Helicopter;
  private tank!: Tank;
  private prisonCamps: PrisonCamp[] = [];
  private rescueBase!: RescueBase;
  private hostages: Hostage[] = [];
  private cannonRounds!: Phaser.Physics.Arcade.Group;
  private enemyRounds!: Phaser.Physics.Arcade.Group;
  private jets!: Phaser.Physics.Arcade.Group;
  private missiles!: Phaser.Physics.Arcade.Group;
  private hud!: Hud;
  private targetText!: Phaser.GameObjects.Text;
  private gameState!: GameState;
  private targetDestroyed = false;
  private nextPassengerUnloadAt = 0;
  private playerDestroyed = false;
  private nextJetSpawnAt = 0;
  private jetSpawnCount = 0;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.hostages = [];
    this.prisonCamps = [];
    this.targetDestroyed = false;
    this.nextPassengerUnloadAt = 0;
    this.playerDestroyed = false;
    this.jetSpawnCount = 0;
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
    this.tank = new Tank(this, 1500, GROUND_Y - 21);
    this.prisonCamps = PRISON_CAMP.positions.map(
      (x) => new PrisonCamp(this, x, GROUND_Y - 36),
    );
    this.cannonRounds = this.physics.add.group({
      allowGravity: false,
      maxSize: 32,
    });
    this.enemyRounds = this.physics.add.group({
      allowGravity: false,
      maxSize: 32,
    });
    this.jets = this.physics.add.group({ allowGravity: false });
    this.missiles = this.physics.add.group({ allowGravity: false });
    this.nextJetSpawnAt = this.time.now + JET.initialSpawnDelayMs;

    this.physics.add.collider(this.helicopter, ground);
    this.physics.add.overlap(
      this.tank,
      this.cannonRounds,
      (tankObject, roundObject) => {
        const target = tankObject as Tank;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        const targetX = target.x;
        const targetY = target.y;
        round.disableBody(true, true);

        if (target.active && target.takeDamage()) {
          this.targetDestroyed = true;
          this.gameState.awardScore(TANK.scoreValue);
          this.showScoreAward(targetX, targetY - 34, TANK.scoreValue);
          this.showGroundExplosion(targetX, targetY);
          this.updateObjectiveText();
        }
      },
    );
    for (const prisonCamp of this.prisonCamps) {
      this.physics.add.overlap(
        prisonCamp,
        this.cannonRounds,
        (campObject, roundObject) => {
          const camp = campObject as PrisonCamp;
          const round = roundObject as Phaser.Physics.Arcade.Image;
          const campX = camp.x;
          const campY = camp.y;
          round.disableBody(true, true);

          if (camp.active && camp.takeDamage()) {
            this.showGroundExplosion(campX, campY);
            this.releaseHostages(camp);
            this.updateObjectiveText();
          }
        },
      );
    }
    this.physics.add.overlap(
      this.jets,
      this.cannonRounds,
      (jetObject, roundObject) => {
        const jet = jetObject as Jet;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        const jetX = jet.x;
        const jetY = jet.y;
        round.disableBody(true, true);

        if (jet.active && jet.takeDamage()) {
          this.awardJetDestruction(jetX, jetY);
        }
      },
    );
    this.physics.add.overlap(
      this.jets,
      this.missiles,
      (jetObject, missileObject) => {
        const jet = jetObject as Jet;
        const missile = missileObject as HomingMissile;
        const jetX = jet.x;
        const jetY = jet.y;
        missile.destroy();

        if (jet.active && jet.takeDamage(MISSILE.damage)) {
          this.awardJetDestruction(jetX, jetY);
        }
      },
    );
    this.physics.add.overlap(
      this.helicopter,
      this.enemyRounds,
      (helicopterObject, roundObject) => {
        const helicopter = helicopterObject as Helicopter;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        round.disableBody(true, true);

        if (
          !this.playerDestroyed &&
          helicopter.takeDamage(
            (round.getData('damage') as number | undefined) ??
              TANK.projectileDamage,
          )
        ) {
          this.destroyHelicopter();
        }
      },
    );

    this.configureCamera();
    this.createFlightDisplay();
    this.updateHud();
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

    const missileTarget = this.getMissileLockTarget();
    const missileLaunch = this.helicopter.tryFireMissile(
      time,
      missileTarget !== null,
    );
    if (missileLaunch && missileTarget) {
      this.fireMissile(
        missileLaunch.x,
        missileLaunch.y,
        missileLaunch.direction,
        missileTarget,
        time,
      );
    }

    if (!this.playerDestroyed) {
      const enemyShot = this.tank.tryFire(
        time,
        this.helicopter.x,
        this.helicopter.y,
      );
      if (enemyShot) {
        this.fireEnemyRound(enemyShot);
      }
    }

    this.trySpawnJet(time);
    for (const child of [...this.jets.getChildren()]) {
      const jet = child as Jet;
      const jetShot = jet.update(
        time,
        this.playerDestroyed
          ? undefined
          : { x: this.helicopter.x, y: this.helicopter.y },
      );
      if (jetShot) {
        this.fireEnemyRound(jetShot);
      }
    }
    for (const child of [...this.missiles.getChildren()]) {
      (child as HomingMissile).update(time, delta);
    }

    let hostageStateChanged = false;
    for (const hostage of this.hostages) {
      const event = hostage.update(delta, this.helicopter);
      if (event === HostageUpdateEvent.Boarded) {
        hostageStateChanged = true;
      } else if (event === HostageUpdateEvent.Rescued) {
        this.gameState.recordRescue(1);
        if (this.gameState.isVictory) {
          this.startVictoryScene();
          return;
        }
        hostageStateChanged = true;
      }
    }
    if (this.tryStartPassengerUnload(time)) {
      hostageStateChanged = true;
    }
    if (hostageStateChanged) {
      this.updateObjectiveText();
    }

    this.recycleOffscreenProjectiles(this.cannonRounds);
    this.recycleOffscreenProjectiles(this.enemyRounds);

    this.updateHud();
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

    this.add.text(1385, GROUND_Y - 82, 'ARMORED TARGET', {
      color: '#c7b96a',
      fontFamily: 'Courier New',
      fontSize: '18px',
    });
    PRISON_CAMP.positions.forEach((campX, index) => {
      this.add
        .text(campX, GROUND_Y - 110, `CAMP ${index + 1}`, {
          color: '#c7b96a',
          fontFamily: 'Courier New',
          fontSize: '18px',
        })
        .setOrigin(0.5, 0);
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
    this.hud = new Hud(this);

    this.targetText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 38,
        'DESTROY THE TANK AND PRISON CAMPS',
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

  private updateHud(): void {
    const openCampCount = this.prisonCamps.filter(
      (camp) => camp.isOpen,
    ).length;

    this.hud.update({
      score: this.gameState.score,
      rescued: this.gameState.rescued,
      rescueTarget: this.gameState.rescueTarget,
      passengers: this.helicopter.passengerCount,
      passengerCapacity: this.helicopter.passengerCapacity,
      health: this.helicopter.health,
      maximumHealth: HELICOPTER.maximumHealth,
      lives: this.gameState.lives,
      isLanded: this.helicopter.isLanded,
      tankDestroyed: this.targetDestroyed,
      openCamps: openCampCount,
      totalCamps: this.prisonCamps.length,
      missileLocked: this.getMissileLockTarget() !== null,
      missileReady: this.helicopter.isMissileReady(this.time.now),
    });
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

    this.showWeaponFlash(x, y, 0xffe27a, 8);
  }

  private fireMissile(
    x: number,
    y: number,
    direction: -1 | 1,
    target: Jet,
    time: number,
  ): void {
    const missile = new HomingMissile(
      this,
      x,
      y,
      direction,
      target,
      time,
    );
    this.missiles.add(missile);
    this.showWeaponFlash(x, y, 0x9fc7c5, 14);
    this.cameras.main.shake(70, 0.002);
  }

  private getMissileLockTarget(): Jet | null {
    let nearestTarget: Jet | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const child of this.jets.getChildren()) {
      const jet = child as Jet;
      if (
        !jet.active ||
        !canLockMissileTarget(
          this.helicopter,
          jet,
          this.helicopter.facingDirection,
          MISSILE.lockRange,
        )
      ) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        this.helicopter.x,
        this.helicopter.y,
        jet.x,
        jet.y,
      );
      if (distance < nearestDistance) {
        nearestTarget = jet;
        nearestDistance = distance;
      }
    }

    return nearestTarget;
  }

  private fireEnemyRound(shot: EnemyShot): void {
    const round = this.enemyRounds.get(
      shot.x,
      shot.y,
      'enemy-round',
    ) as Phaser.Physics.Arcade.Image | null;

    if (!round) {
      return;
    }

    round
      .enableBody(true, shot.x, shot.y, true, true)
      .setData('damage', shot.damage)
      .setVelocity(shot.velocityX, shot.velocityY);
  }

  private trySpawnJet(time: number): void {
    if (
      this.playerDestroyed ||
      time < this.nextJetSpawnAt ||
      this.jets.countActive(true) >= JET.maximumActive
    ) {
      return;
    }

    const direction = this.jetSpawnCount % 2 === 0 ? 1 : -1;
    const altitude =
      JET.flightAltitudes[this.jetSpawnCount % JET.flightAltitudes.length];
    if (altitude === undefined) {
      return;
    }

    const jet = new Jet(this, direction, altitude);
    this.jets.add(jet);
    this.jetSpawnCount += 1;
    this.nextJetSpawnAt = time + JET.spawnIntervalMs;
  }

  private recycleOffscreenProjectiles(
    projectiles: Phaser.Physics.Arcade.Group,
  ): void {
    projectiles.children.each((child) => {
      const round = child as Phaser.Physics.Arcade.Image;
      if (
        round.active &&
        (round.x < -32 ||
          round.x > WORLD_WIDTH + 32 ||
          round.y < -32 ||
          round.y > WORLD_HEIGHT + 32)
      ) {
        round.disableBody(true, true);
      }
      return true;
    });
  }

  private disableProjectiles(projectiles: Phaser.Physics.Arcade.Group): void {
    projectiles.children.each((child) => {
      const round = child as Phaser.Physics.Arcade.Image;
      if (round.active) {
        round.disableBody(true, true);
      }
      return true;
    });
  }

  private destroyHelicopter(): void {
    this.playerDestroyed = true;
    const explosionX = this.helicopter.x;
    const explosionY = this.helicopter.y;
    const lostPassengers = this.helicopter.disableAfterDestruction();

    let returnedHostages = 0;
    for (const hostage of this.hostages) {
      if (hostage.returnToRallyAfterHelicopterLoss()) {
        returnedHostages += 1;
      }
    }
    if (returnedHostages !== lostPassengers) {
      throw new Error('Passenger manifest did not match aboard hostages.');
    }

    this.gameState.loseLife();
    this.disableProjectiles(this.cannonRounds);
    this.disableProjectiles(this.enemyRounds);
    this.destroyProjectiles(this.missiles);
    this.showHelicopterExplosion(explosionX, explosionY);

    this.targetText.setText(
      this.gameState.isGameOver
        ? 'ALL HELICOPTERS LOST'
        : `HELICOPTER LOST — ${this.gameState.lives} REMAINING`,
    );
    this.targetText.setColor('#e46b56');

    if (this.gameState.isGameOver) {
      this.time.delayedCall(PLAYER.gameOverDelayMs, () => {
        this.scene.start('GameOverScene', {
          rescued: this.gameState.rescued,
          score: this.gameState.score,
        });
      });
      return;
    }

    this.time.delayedCall(PLAYER.respawnDelayMs, () => {
      this.helicopter.respawn(PLAYER.respawnX, GROUND_Y - 21);
      this.playerDestroyed = false;
      this.configureCamera();
      this.updateObjectiveText();
    });
  }

  private showHelicopterExplosion(x: number, y: number): void {
    this.showExplosion(x, y, 28, 18, 240, 0.01);
  }

  private showJetExplosion(x: number, y: number): void {
    this.showExplosion(x, y, 20, 12, 120, 0.004);
  }

  private showGroundExplosion(x: number, y: number): void {
    this.showExplosion(x, y, 24, 14, 160, 0.006);
  }

  private showExplosion(
    x: number,
    y: number,
    radius: number,
    particleCount: number,
    shakeDuration: number,
    shakeIntensity: number,
  ): void {
    const outerBlast = this.add.circle(x, y, radius, 0xe46b56, 0.82);
    const coreBlast = this.add.circle(x, y, radius * 0.55, 0xffe27a, 1);
    this.cameras.main.shake(shakeDuration, shakeIntensity);

    this.tweens.add({
      targets: outerBlast,
      alpha: 0,
      scale: 2.5,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => outerBlast.destroy(),
    });
    this.tweens.add({
      targets: coreBlast,
      alpha: 0,
      scale: 1.8,
      duration: 190,
      ease: 'Quad.easeOut',
      onComplete: () => coreBlast.destroy(),
    });

    const particleColors = [0xffe27a, 0xf3d45a, 0xe46b56, 0xd6dec3];
    for (let index = 0; index < particleCount; index += 1) {
      const baseAngle = (Math.PI * 2 * index) / particleCount;
      const angle = baseAngle + Phaser.Math.FloatBetween(-0.18, 0.18);
      const distance = Phaser.Math.FloatBetween(radius * 2.2, radius * 4);
      const size = Phaser.Math.Between(4, 8);
      const color = particleColors[index % particleColors.length];
      if (color === undefined) {
        continue;
      }

      const particle = this.add
        .rectangle(x, y, size, size, color, 0.95)
        .setRotation(angle);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - radius * 0.35,
        alpha: 0,
        scale: 0.3,
        rotation: angle + Phaser.Math.FloatBetween(-2.4, 2.4),
        duration: Phaser.Math.Between(300, 520),
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private awardJetDestruction(x: number, y: number): void {
    this.gameState.awardScore(JET.scoreValue);
    this.showScoreAward(x, y - 28, JET.scoreValue);
    this.showJetExplosion(x, y);
  }

  private showWeaponFlash(
    x: number,
    y: number,
    color: number,
    radius: number,
  ): void {
    const flash = this.add.circle(x, y, radius, color, 0.9);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.8,
      duration: 90,
      onComplete: () => flash.destroy(),
    });
  }

  private destroyProjectiles(projectiles: Phaser.Physics.Arcade.Group): void {
    for (const child of [...projectiles.getChildren()]) {
      child.destroy();
    }
  }

  private showScoreAward(x: number, y: number, points: number): void {
    const scoreText = this.add
      .text(x, y, `+${points}`, {
        color: '#f3d45a',
        fontFamily: 'Courier New',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: scoreText,
      alpha: 0,
      y: y - 36,
      duration: 800,
      onComplete: () => scoreText.destroy(),
    });
  }

  private releaseHostages(prisonCamp: PrisonCamp): void {
    for (let index = 0; index < PRISON_CAMP.hostageCount; index += 1) {
      const direction = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const rallyX =
        prisonCamp.x +
        direction * (HOSTAGE.rallyDistance + row * HOSTAGE.rallySpacing);

      this.hostages.push(
        new Hostage(
          this,
          prisonCamp.x,
          rallyX,
          index * HOSTAGE.releaseDelayMs,
        ),
      );
    }
  }

  private tryStartPassengerUnload(time: number): boolean {
    const disembarkingHostageXs = this.hostages
      .filter(
        (hostage) => hostage.currentState === HostageState.RunningToBase,
      )
      .map((hostage) => hostage.x);

    if (
      time < this.nextPassengerUnloadAt ||
      this.helicopter.passengerCount === 0 ||
      !this.rescueBase.canUnload(this.helicopter) ||
      !hasPassengerUnloadSpacing(
        this.helicopter.x,
        disembarkingHostageXs,
        HOSTAGE.unloadSpacing,
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

    this.nextPassengerUnloadAt = time + HOSTAGE.unloadIntervalMs;
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
    const openCampCount = this.prisonCamps.filter(
      (camp) => camp.isOpen,
    ).length;
    const closedCampCount = this.prisonCamps.length - openCampCount;

    if (disembarking || unloadingAtBase) {
      this.targetText.setText(
        `UNLOADING: ${this.gameState.rescued}/${this.gameState.rescueTarget} RESCUED   ${passengers} ABOARD`,
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

    if (hostagesAtCamp > 0) {
      this.targetText.setText(
        `${this.gameState.rescued}/${this.gameState.rescueTarget} RESCUED — LAND NEAR ${hostagesAtCamp} HOSTAGES`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    const campInstruction = `${closedCampCount} PRISON ${closedCampCount === 1 ? 'CAMP' : 'CAMPS'}`;
    this.targetText.setText(
      this.targetDestroyed
        ? `DESTROY ${campInstruction}`
        : `DESTROY THE TANK AND ${campInstruction}`,
    );
    this.targetText.setColor('#f3d45a');
  }

  private startVictoryScene(): void {
    this.scene.start('VictoryScene', {
      rescued: this.gameState.rescued,
      score: this.gameState.score,
      lives: this.gameState.lives,
    });
  }
}
