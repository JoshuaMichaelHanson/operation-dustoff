import Phaser from 'phaser';

import {
  AA_GUN,
  BOMB,
  BOSS,
  CAMERA,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  GROUND_COMBAT,
  HELICOPTER,
  HOSTAGE,
  JET,
  MISSILE,
  PLAYER,
  PRISON_CAMP,
  RESCUE_BASE,
  SAM,
  TANK,
  WORLD_HEIGHT,
} from '../constants';
import { AudioManager } from '../audio/AudioManager';
import { AaGun } from '../entities/AaGun';
import { Bomb } from '../entities/Bomb';
import { BossHelicopter } from '../entities/BossHelicopter';
import { Helicopter } from '../entities/Helicopter';
import { HomingMissile } from '../entities/HomingMissile';
import { Hostage } from '../entities/Hostage';
import type { EnemyShot } from '../entities/EnemyShot';
import { Jet } from '../entities/Jet';
import { PrisonCamp } from '../entities/PrisonCamp';
import { RescueBase } from '../entities/RescueBase';
import { SamLauncher } from '../entities/SamLauncher';
import { SamMissile } from '../entities/SamMissile';
import { Tank } from '../entities/Tank';
import { PlayerInput } from '../input/PlayerInput';
import {
  isTouchControlEnabled,
  TouchInputState,
} from '../input/touchInput';
import { getCannonVelocity } from '../logic/cannonAim';
import {
  getTargetsWithinBombBlast,
  isWithinBombBlast,
} from '../logic/bombBehavior';
import {
  canHostageBeCrushed,
  HostageState,
  HostageUpdateEvent,
} from '../logic/hostageState';
import {
  getHostageRallyPositions,
  isGroundPathClear,
} from '../logic/hostageRally';
import { formatIntelCue, nearestX } from '../logic/battlefieldIntel';
import { FuelTank } from '../logic/fuel';
import {
  canStartHostageThreat,
  HOSTAGE_THREAT,
  hostageThreatIntervalMs,
  isThreatTargetStillExposed,
} from '../logic/hostageThreat';
import {
  calculateFullLoadBonus,
  hasPassengerUnloadSpacing,
  shouldEndFailedRescue,
  shouldOpenRescueDoor,
} from '../logic/rescueRules';
import { canLockMissileTarget } from '../logic/missileGuidance';
import {
  getLevelConfig,
  getLevelIndex,
  LEVELS,
  type LevelConfig,
} from '../levels/levelConfig';
import { GameState } from '../state/GameState';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';
import { GroundCombat } from '../systems/GroundCombat';
import type { GroundCombatEvent } from '../logic/groundCombat';

interface PendingHostageThreat {
  source: Tank | Jet;
  target: Hostage;
  startedAt: number;
  coverStarted: boolean;
  marker: Phaser.GameObjects.Text;
}

export class GameScene extends Phaser.Scene {
  private helicopter!: Helicopter;
  private tanks: Tank[] = [];
  private aaGuns: AaGun[] = [];
  private samLaunchers: SamLauncher[] = [];
  private prisonCamps: PrisonCamp[] = [];
  private rescueBase!: RescueBase;
  private hostages: Hostage[] = [];
  private cannonRounds!: Phaser.Physics.Arcade.Group;
  private enemyRounds!: Phaser.Physics.Arcade.Group;
  private jets!: Phaser.Physics.Arcade.Group;
  private missiles!: Phaser.Physics.Arcade.Group;
  private samMissiles!: Phaser.Physics.Arcade.Group;
  private bombs!: Phaser.Physics.Arcade.Group;
  private flightObstacleBodies: Phaser.GameObjects.Rectangle[] = [];
  private hud!: Hud;
  private targetText!: Phaser.GameObjects.Text;
  private gameState!: GameState;
  private audioManager!: AudioManager;
  private playerInput!: PlayerInput;
  private touchInput!: TouchInputState;
  private touchControls: TouchControls | null = null;
  private destroyedTankCount = 0;
  private nextPassengerUnloadAt = 0;
  private playerDestroyed = false;
  private nextJetSpawnAt = 0;
  private jetSpawnCount = 0;
  private levelIndex = 0;
  private level!: LevelConfig;
  private initialScore = 0;
  private initialLives: number | undefined;
  private pendingHostageThreat: PendingHostageThreat | null = null;
  private nextHostageThreatAt = Number.POSITIVE_INFINITY;
  private fullLoadBonusReady = false;
  private groundCombat: GroundCombat | null = null;
  private fuelTank: FuelTank | null = null;
  private boss: BossHelicopter | null = null;
  private dustStreaks: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: {
    levelIndex?: number;
    score?: number;
    lives?: number;
  }): void {
    this.levelIndex = getLevelIndex(data.levelIndex ?? 0);
    this.level = getLevelConfig(this.levelIndex);
    this.initialScore = data.score ?? 0;
    this.initialLives = data.lives;
  }

  create(): void {
    this.hostages = [];
    this.prisonCamps = [];
    this.tanks = [];
    this.aaGuns = [];
    this.samLaunchers = [];
    this.flightObstacleBodies = [];
    this.destroyedTankCount = 0;
    this.nextPassengerUnloadAt = 0;
    this.playerDestroyed = false;
    this.jetSpawnCount = 0;
    this.pendingHostageThreat = null;
    this.nextHostageThreatAt = Number.POSITIVE_INFINITY;
    this.fullLoadBonusReady = false;
    this.groundCombat = null;
    this.fuelTank = this.level.fuelCapacityMs
      ? new FuelTank(this.level.fuelCapacityMs) : null;
    this.boss = null;
    this.dustStreaks = [];
    this.gameState = new GameState(this.level.rescueTarget, {
      score: this.initialScore,
      lives: this.initialLives,
    }, !!this.level.boss);
    this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);
    this.createBattlefield();

    const ground = this.add.rectangle(
      this.level.worldWidth / 2,
      GROUND_Y + (WORLD_HEIGHT - GROUND_Y) / 2,
      this.level.worldWidth,
      WORLD_HEIGHT - GROUND_Y,
      this.level.environment.skyBands[3],
    ).setDepth(-5);
    this.physics.add.existing(ground, true);
    this.createGroundArt();

    this.rescueBase = new RescueBase(this);
    if (this.level.environment.night) {
      this.createNightMissionLights();
    }
    this.touchInput = new TouchInputState();
    this.playerInput = new PlayerInput(this, this.touchInput);
    this.helicopter = new Helicopter(
      this,
      PLAYER.respawnX,
      RESCUE_BASE.surfaceY - 21,
      this.playerInput,
      this.level.wind?.acceleration ?? 0,
      this.level.wind?.maximumDriftSpeed ?? 0,
    );
    this.audioManager = new AudioManager(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audioManager.destroy();
      this.touchControls?.destroy();
      this.touchControls = null;
      this.touchInput.reset();
      this.groundCombat?.destroy();
    });
    this.tanks = this.level.tankPositions.map(
      (x) => new Tank(this, x, GROUND_Y - 21),
    );
    this.aaGuns = this.level.aaPositions.map(
      (x) => new AaGun(this, x, GROUND_Y - 26, this.level.flightObstacles),
    );
    this.samLaunchers = this.level.samPositions.map(
      (x) => new SamLauncher(this, x, GROUND_Y - 26, this.level.flightObstacles),
    );
    this.prisonCamps = this.level.campPositions.map(
      (x) => new PrisonCamp(this, x, GROUND_Y - 36),
    );
    this.boss = this.level.boss
      ? new BossHelicopter(this, this.level.boss) : null;
    this.groundCombat = this.level.groundCombat
      ? new GroundCombat(this, this.level.worldWidth, this.level.flightObstacles)
      : null;
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
    this.samMissiles = this.physics.add.group({ allowGravity: false });
    this.bombs = this.physics.add.group({
      allowGravity: true,
      gravityY: BOMB.gravity,
    });
    this.nextJetSpawnAt =
      this.time.now + this.level.jetInitialSpawnDelayMs;

    this.physics.add.collider(this.helicopter, ground);
    this.physics.add.collider(ground, this.bombs, (_ground, bombObject) => {
      this.detonateBomb(bombObject as Bomb);
    });
    this.physics.add.collider(ground, this.samMissiles, (_ground, missile) => {
      (missile as SamMissile).destroy();
    });
    this.physics.add.collider(
      this.helicopter,
      this.rescueBase.landingSurface,
    );
    this.physics.add.collider(
      this.rescueBase.landingSurface,
      this.bombs,
      (_surface, bombObject) => {
        this.detonateBomb(bombObject as Bomb);
      },
    );
    this.createFlightObstacles();
    for (const tank of this.tanks) {
      this.physics.add.overlap(
        tank,
        this.cannonRounds,
        (tankObject, roundObject) => {
          const target = tankObject as Tank;
          const round = roundObject as Phaser.Physics.Arcade.Image;
          const targetX = target.x;
          const targetY = target.y;
          round.disableBody(true, true);

          if (target.active && target.takeDamage()) {
            this.destroyedTankCount += 1;
            this.gameState.awardScore(TANK.scoreValue);
            this.showScoreAward(targetX, targetY - 34, TANK.scoreValue);
            this.showGroundExplosion(targetX, targetY);
            this.updateObjectiveText();
          }
        },
      );
      this.physics.add.overlap(
        tank,
        this.bombs,
        (_tankObject, bombObject) => {
          const bomb = bombObject as Bomb;
          this.detonateBomb(bomb);
        },
      );
    }
    for (const aaGun of this.aaGuns) {
      this.physics.add.overlap(
        aaGun,
        this.cannonRounds,
        (gunObject, roundObject) => {
          const gun = gunObject as AaGun;
          const round = roundObject as Phaser.Physics.Arcade.Image;
          const targetX = gun.x;
          const targetY = gun.y;
          round.disableBody(true, true);
          if (gun.takeDamage()) {
            this.awardAaDestruction(targetX, targetY);
          }
        },
      );
      this.physics.add.overlap(
        aaGun,
        this.bombs,
        (_gunObject, bombObject) => {
          this.detonateBomb(bombObject as Bomb);
        },
      );
    }
    for (const launcher of this.samLaunchers) {
      this.physics.add.overlap(launcher, this.cannonRounds, (launcherObject, roundObject) => {
        const target = launcherObject as SamLauncher;
        const round = roundObject as Phaser.Physics.Arcade.Image;
        const x = target.x;
        const y = target.y;
        round.disableBody(true, true);
        if (target.takeDamage()) this.awardSamDestruction(x, y);
      });
      this.physics.add.overlap(launcher, this.bombs, (_launcher, bombObject) => {
        this.detonateBomb(bombObject as Bomb);
      });
    }
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
      this.physics.add.overlap(
        prisonCamp,
        this.bombs,
        (_campObject, bombObject) => {
          const bomb = bombObject as Bomb;
          this.detonateBomb(bomb);
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
    if (this.boss) {
      this.physics.add.overlap(this.boss, this.cannonRounds,
        (_bossObject, roundObject) => {
          const round = roundObject as Phaser.Physics.Arcade.Image;
          if (!round.active) return;
          round.disableBody(true, true);
          this.damageBoss(1);
        });
      this.physics.add.overlap(this.boss, this.missiles,
        (_bossObject, missileObject) => {
          const missile = missileObject as HomingMissile;
          if (!missile.active) return;
          missile.destroy();
          this.damageBoss(MISSILE.damage);
        });
    }
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
    this.physics.add.collider(this.rescueBase.landingSurface, this.samMissiles,
      (_surface, missile) => (missile as SamMissile).destroy());
    this.physics.add.overlap(this.helicopter, this.samMissiles,
      (helicopterObject, missileObject) => {
        const helicopter = helicopterObject as Helicopter;
        const missile = missileObject as SamMissile;
        const damage = missile.damage;
        missile.destroy();
        if (!this.playerDestroyed && helicopter.takeDamage(damage)) {
          this.destroyHelicopter();
        }
      });

    this.configureCamera();
    this.createFlightDisplay();
    this.touchControls = isTouchControlEnabled()
      ? new TouchControls(this, this.touchInput, !!this.groundCombat)
      : null;
    this.updateHud();
  }

  update(time: number, delta: number): void {
    this.updateWindDust(delta);
    this.touchControls?.update();
    const shot = this.helicopter.update(time);
    if (this.fuelTank && !this.playerDestroyed) {
      const fuelEvent = this.fuelTank.update(delta,
        !this.helicopter.isLanded,
        this.rescueBase.canUnload(this.helicopter));
      if (fuelEvent === 'empty') {
        this.destroyHelicopter('OUT OF FUEL');
        this.updateHud();
        return;
      }
    }
    this.touchControls?.setFacingDirection(this.helicopter.facingDirection);
    if (this.playerInput.consumeSfPress() && this.groundCombat &&
      !this.playerDestroyed &&
      this.groundCombat.commandSf(this.helicopter, time)) {
      this.updateObjectiveText();
    }
    if (this.groundCombat) {
      this.touchControls?.setSfStatus(
        this.groundCombat.actionLabel(this.helicopter),
      );
    }
    this.updateRotorAudio();
    if (shot) {
      this.fireCannon(
        shot.x,
        shot.y,
        shot.direction,
        shot.aimAngleRadians,
      );
    }

    const missileTarget = this.getMissileLockTarget();
    this.touchControls?.setMissileStatus(
      missileTarget !== null,
      this.helicopter.isMissileReady(time),
    );
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

    this.touchControls?.setBombStatus(this.helicopter.isBombReady(time));
    const bombDrop = this.helicopter.tryDropBomb(time);
    if (bombDrop) {
      this.dropBomb(
        bombDrop.x,
        bombDrop.y,
        bombDrop.helicopterVelocityX,
        time,
      );
    }

    if (!this.playerDestroyed) {
      this.updateHostageThreat(time);
      for (const tank of this.tanks) {
        if (tank === this.pendingHostageThreat?.source) {
          continue;
        }
        const enemyShot = tank.tryFire(
          time,
          this.helicopter.x,
          this.helicopter.y,
        );
        if (enemyShot) {
          this.fireEnemyRound(enemyShot);
        }
      }
      for (const aaGun of this.aaGuns) {
        const enemyShot = aaGun.update(time, this.helicopter);
        if (enemyShot) {
          this.fireEnemyRound(enemyShot);
          this.showWeaponFlash(enemyShot.x, enemyShot.y, 0xff7b62, 7);
        }
      }
      for (const launcher of this.samLaunchers) {
        const lockedPosition = launcher.update(time, this.helicopter);
        if (lockedPosition) {
          const missile = new SamMissile(this, launcher.x, launcher.y - 20,
            lockedPosition, this.helicopter, time, this.level.worldWidth);
          this.samMissiles.add(missile);
          launcher.trackMissile(missile);
          this.showWeaponFlash(missile.x, missile.y, 0xffcd6c, 12);
        }
      }
    }

    if (this.boss?.active) {
      const bossStep = this.boss.update(time,
        this.playerDestroyed ? undefined : this.helicopter);
      for (const bossShot of bossStep.shots) {
        this.fireEnemyRound(bossShot);
        this.showWeaponFlash(bossShot.x, bossShot.y, 0xffa681, 9);
      }
      if (bossStep.missileTarget && !this.playerDestroyed) {
        const missile = new SamMissile(this, this.boss.x,
          this.boss.y + 24, bossStep.missileTarget,
          this.helicopter, time, this.level.worldWidth, 'boss');
        this.samMissiles.add(missile);
        this.showWeaponFlash(missile.x, missile.y, 0xffd166, 14);
      }
    }

    this.trySpawnJet(time);
    for (const child of [...this.jets.getChildren()]) {
      const jet = child as Jet;
      const jetShot = jet.update(
        time,
        this.playerDestroyed || jet === this.pendingHostageThreat?.source
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
    for (const child of [...this.samMissiles.getChildren()]) {
      (child as SamMissile).update(time, delta);
    }
    for (const child of [...this.bombs.getChildren()]) {
      (child as Bomb).update(time);
    }

    if (this.groundCombat) {
      const pows = this.hostages.flatMap((hostage, id) =>
        [HostageState.RunningOut, HostageState.Waiting,
          HostageState.RunningToHelicopter].includes(hostage.currentState)
          ? [{ id, x: hostage.x }] : []);
      this.handleGroundCombatEvents(this.groundCombat.update(
        this, time, delta, this.helicopter, pows,
      ));
      this.updateGroundCombatWeapons(time);
    }

    let hostageStateChanged = false;
    let rescueCuePending = false;
    for (const hostage of this.hostages) {
      const event = hostage.update(delta, this.helicopter);
      if (event === HostageUpdateEvent.Boarded) {
        this.audioManager.playBoarding();
        if (this.helicopter.passengerCount === this.helicopter.passengerCapacity) {
          this.fullLoadBonusReady = true;
        }
        hostageStateChanged = true;
      } else if (event === HostageUpdateEvent.Rescued) {
        this.gameState.recordRescue(1);
        if (this.gameState.isVictory) {
          this.startVictoryScene();
          return;
        }
        rescueCuePending = true;
        hostageStateChanged = true;
      }
    }
    if (this.tryStartPassengerUnload(time)) {
      hostageStateChanged = true;
    }
    this.rescueBase.setDoorOpen(
      shouldOpenRescueDoor(
        this.hostages.map((hostage) => hostage.currentState),
      ),
    );
    if (hostageStateChanged) {
      this.updateObjectiveText();
    }

    if (!this.playerDestroyed && this.shouldEndFailedRescue()) {
      this.scene.start('GameOverScene', {
        rescued: this.gameState.rescued,
        score: this.gameState.score,
        reason: 'RESCUE TARGET LOST',
        levelIndex: this.levelIndex,
      });
      return;
    }
    if (rescueCuePending) {
      this.audioManager.playRescue();
    }

    this.recycleOffscreenProjectiles(this.cannonRounds);
    this.recycleOffscreenProjectiles(this.enemyRounds);

    if (this.gameState.isVictory) {
      this.startVictoryScene();
      return;
    }

    this.updateHud();
  }

  private createBattlefield(): void {
    const skyBands = this.level.environment.skyBands.map((color, index) => ({
      y: 90 + index * 180,
      height: 180,
      color,
    }));
    for (const band of skyBands) {
      this.add
        .rectangle(
          GAME_WIDTH / 2,
          band.y,
          GAME_WIDTH,
          band.height,
          band.color,
        )
        .setScrollFactor(0)
        .setDepth(-30);
    }

    if (this.level.environment.night) {
      this.createNightSkyDetails();
    }
    this.createClouds();
    this.createWindDust();

    for (let x = -1024; x <= this.level.worldWidth + 1024; x += 512) {
      this.add
        .image(x, GROUND_Y - 110, 'distant-mountains')
        .setOrigin(0, 1)
        .setScrollFactor(0.08, 0.28)
        .setTint(this.level.environment.distantMountainTint)
        .setAlpha(0.7)
        .setDepth(-27);
    }

    for (let x = -640; x <= this.level.worldWidth + 960; x += 320) {
      this.add
        .image(x, GROUND_Y - 130, 'background-ridge')
        .setOrigin(0, 1)
        .setScrollFactor(0.18, 0.35)
        .setTint(this.level.environment.farRidgeTint)
        .setAlpha(0.55)
        .setDepth(-25);
    }
    for (let x = -320; x <= this.level.worldWidth + 640; x += 320) {
      this.add
        .image(x, GROUND_Y - 48, 'background-ridge')
        .setOrigin(0, 1)
        .setScrollFactor(0.42, 0.65)
        .setTint(this.level.environment.nearRidgeTint)
        .setDepth(-20);
    }

    this.level.tankPositions.forEach((tankX, index) => {
      this.add.text(tankX, GROUND_Y - 82, `ARMORED ${index + 1}`, {
        color: '#c7b96a',
        fontFamily: 'Courier New',
        fontSize: '18px',
      }).setOrigin(0.5, 0);
    });
    this.level.aaPositions.forEach((gunX, index) => {
      this.add.text(gunX, GROUND_Y - 100, `FLAK ${index + 1}`, {
        color: '#ffb978',
        fontFamily: 'Courier New',
        fontSize: '18px',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0);
    });
    this.level.samPositions.forEach((launcherX, index) => {
      this.add.text(launcherX, GROUND_Y - 100, `SAM ${index + 1}`, {
        color: '#ffcd6c',
        fontFamily: 'Courier New',
        fontSize: '18px',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0);
    });
    this.level.campPositions.forEach((campX, index) => {
      this.add
        .text(campX, GROUND_Y - 110, `CAMP ${index + 1}`, {
          color: '#c7b96a',
          fontFamily: 'Courier New',
          fontSize: '18px',
        })
        .setOrigin(0.5, 0);
    });
  }

  private createClouds(): void {
    let x = Phaser.Math.Between(-160, 120);
    const [minimumSpacing, maximumSpacing] =
      this.level.environment.cloudSpacing;
    const [minimumAlpha, maximumAlpha] = this.level.environment.cloudAlpha;

    while (x < this.level.worldWidth + 400) {
      x += Phaser.Math.Between(minimumSpacing, maximumSpacing);
      const frame = Phaser.Math.Between(0, 2);
      const scale = Phaser.Math.FloatBetween(1.5, 2.35);

      this.add
        .image(x, Phaser.Math.Between(190, 440), 'clouds', frame)
        .setScale(scale)
        .setScrollFactor(0.1 + frame * 0.025, 0.2)
        .setAlpha(Phaser.Math.FloatBetween(minimumAlpha, maximumAlpha))
        .setDepth(-29);
    }
  }

  private createWindDust(): void {
    const wind = this.level.wind;
    if (!wind) return;
    for (let index = 0; index < 26; index += 1) {
      const streak = this.add.rectangle(
        (index * 227 + 41) % GAME_WIDTH,
        145 + ((index * 83) % 480),
        18 + (index % 4) * 7,
        2,
        wind.dustColor,
        0.16,
      ).setScrollFactor(0).setDepth(-4);
      this.dustStreaks.push(streak);
    }
  }

  private updateWindDust(delta: number): void {
    const direction = Math.sign(this.level.wind?.acceleration ?? 0);
    if (direction === 0) return;
    for (const streak of this.dustStreaks) {
      streak.x += direction * 42 * Math.min(delta, 50) / 1000;
      if (streak.x > GAME_WIDTH + 30) streak.x = -30;
      if (streak.x < -30) streak.x = GAME_WIDTH + 30;
    }
  }

  private createNightSkyDetails(): void {
    for (let index = 0; index < 34; index += 1) {
      const x = (index * 197 + 71) % GAME_WIDTH;
      const y = 104 + ((index * 83) % 390);
      const radius = index % 5 === 0 ? 2 : 1;
      this.add
        .circle(x, y, radius, index % 3 === 0 ? 0x9fc7c5 : 0xd6dec3, 0.65)
        .setScrollFactor(0)
        .setDepth(-28);
    }
  }

  private createNightMissionLights(): void {
    this.add
      .ellipse(
        RESCUE_BASE.centerX,
        RESCUE_BASE.surfaceY - 8,
        RESCUE_BASE.landingZoneWidth + 90,
        105,
        0x8fe388,
        0.08,
      )
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(-1);

    const landingLeft =
      RESCUE_BASE.centerX - RESCUE_BASE.landingZoneWidth / 2;
    const landingRight =
      RESCUE_BASE.centerX + RESCUE_BASE.landingZoneWidth / 2;
    for (const x of [landingLeft, landingRight]) {
      this.add
        .circle(x, RESCUE_BASE.surfaceY - 5, 5, 0x8fe388, 0.95)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(2);
    }

    for (const x of this.level.campPositions) {
      this.add
        .circle(x, GROUND_Y - 92, 4, 0xe46b56, 0.85)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(2);
    }
  }

  private createGroundArt(): void {
    const tileSize = 64;
    const tileCount = Math.ceil(this.level.worldWidth / tileSize);

    for (let index = 0; index < tileCount; index += 1) {
      const frame = (index * 3 + Math.floor(index / 5)) % 4;
      this.add
        .image(index * tileSize, GROUND_Y, 'ground-tiles', frame)
        .setOrigin(0, 0)
        .setTint(this.level.environment.groundTint)
        .setDepth(-3);
    }
  }

  private createFlightObstacles(): void {
    const stepCount = 5;

    for (const obstacle of this.level.flightObstacles) {
      const stepHeight = obstacle.height / stepCount;
      for (let step = 0; step < stepCount; step += 1) {
        const width = obstacle.width * (1 - step * 0.14);
        const body = this.add
          .rectangle(
            obstacle.x,
            GROUND_Y - stepHeight * (step + 0.5),
            width,
            stepHeight + 1,
            this.level.environment.obstacleColor,
          )
          .setStrokeStyle(2, this.level.environment.obstacleEdgeColor, 0.9)
          .setDepth(-2);
        this.physics.add.existing(body, true);
        this.flightObstacleBodies.push(body);
        this.physics.add.collider(this.helicopter, body);
        this.physics.add.collider(body, this.cannonRounds, (_ridge, round) => {
          (round as Phaser.Physics.Arcade.Image).disableBody(true, true);
        });
        this.physics.add.collider(body, this.enemyRounds, (_ridge, round) => {
          (round as Phaser.Physics.Arcade.Image).disableBody(true, true);
        });
        this.physics.add.collider(body, this.missiles, (_ridge, missile) => {
          (missile as HomingMissile).destroy();
        });
        this.physics.add.collider(body, this.samMissiles, (_ridge, missile) => {
          (missile as SamMissile).destroy();
        });
        this.physics.add.collider(body, this.bombs, (_ridge, bombObject) => {
          this.detonateBomb(bombObject as Bomb);
        });
      }

      this.add
        .text(obstacle.x, GROUND_Y - obstacle.height - 26, 'SOLID RIDGE', {
          color: this.level.environment.night ? '#9fc7c5' : '#d6dec3',
          fontFamily: 'Courier New',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 1)
        .setDepth(-1);
    }
  }

  private configureCamera(): void {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);
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
    this.hud = new Hud(this, !!this.groundCombat, !!this.fuelTank,
      this.level.wind ? Math.sign(this.level.wind.acceleration) as -1 | 1
        : undefined, !!this.level.boss);
    const windHint = this.level.wind
      ? `WIND PUSHES ${this.level.wind.acceleration > 0 ? 'RIGHT' : 'LEFT'}`
      : '';

    this.targetText = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 38,
        `L${this.levelIndex + 1}: ${this.level.name} — ${this.level.samPositions.length > 0
          ? `FLY LOW TO BREAK SAM LOCK OR BOMB THE LAUNCHER${windHint ? `; ${windHint}` : ''}`
          : this.level.boss
          ? 'DEFEAT THE BOSS WITH CANNON OR MISSILES — RESCUE POWS TO WIN'
          : this.groundCombat && this.fuelTank
          ? `CARRY SF TO CAMP — G: DEPLOY; ${windHint ? `${windHint}; ` : ''}BASE REFUELS`
          : this.groundCombat
          ? 'CARRY SF TO A CAMP — LAND AND PRESS G TO DEPLOY'
          : this.level.aaPositions.length > 0
          ? 'FLY LOW OR BOMB THE AA GUN'
          : this.fuelTank
          ? 'FUEL LIMITED — REFILL BY LANDING AT BASE'
          : 'DESTROY TANKS AND CAMPS'}`,
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
      levelNumber: this.levelIndex + 1,
      levelCount: LEVELS.length,
      isLanded: this.helicopter.isLanded,
      destroyedTanks: this.destroyedTankCount,
      totalTanks: this.tanks.length,
      openCamps: openCampCount,
      totalCamps: this.prisonCamps.length,
      missileLocked: this.getMissileLockTarget() !== null,
      missileReady: this.helicopter.isMissileReady(this.time.now),
      bombReady: this.helicopter.isBombReady(this.time.now),
      fuelSeconds: this.fuelTank?.secondsRemaining,
      fuelRatio: this.fuelTank?.ratio,
      bossHealth: this.boss?.health,
      bossMaximumHealth: this.level.boss ? BOSS.health : undefined,
      fuelWarning: this.fuelTank?.shouldReturn(
        Math.abs(this.helicopter.x - RESCUE_BASE.centerX))
        ? `${this.fuelTank.isCritical ? 'FUEL CRITICAL' : 'FUEL LOW'} — RETURN TO ${formatIntelCue(
          'BASE', this.helicopter.x, RESCUE_BASE.centerX)}`
        : '',
      intel: [
        formatIntelCue('BASE', this.helicopter.x, RESCUE_BASE.centerX),
        formatIntelCue('POW', this.helicopter.x, nearestX(
          this.helicopter.x,
          this.hostages.filter((hostage) =>
            isThreatTargetStillExposed(hostage.currentState),
          ).map((hostage) => hostage.x),
        )),
        formatIntelCue('CAMP', this.helicopter.x, nearestX(
          this.helicopter.x,
          this.prisonCamps.filter((camp) => !camp.isOpen).map((camp) => camp.x),
        )),
        ...(this.level.aaPositions.length > 0
          ? [formatIntelCue('AA', this.helicopter.x, nearestX(
            this.helicopter.x,
            this.aaGuns.filter((gun) => gun.active).map((gun) => gun.x),
          ))]
          : []),
        ...(this.level.samPositions.length > 0
          ? [formatIntelCue('SAM', this.helicopter.x, nearestX(
            this.helicopter.x,
            this.samLaunchers.filter((launcher) => launcher.active)
              .map((launcher) => launcher.x),
          ))]
          : []),
        ...(this.boss?.active
          ? [formatIntelCue('BOSS', this.helicopter.x, this.boss.x)]
          : []),
        ...(this.groundCombat
          ? [`SF ${this.groundCombat.sfAboard} ABOARD / ${this.groundCombat.sfDeployed} GROUND`,
            `HOSTILES ${this.groundCombat.hostileAlive}`]
          : []),
      ].join('    •    '),
      threatWarning: this.pendingHostageThreat
        ? `INCOMING ${formatIntelCue(
          this.pendingHostageThreat.source instanceof Tank ? 'TANK' : 'JET',
          this.helicopter.x,
          this.pendingHostageThreat.source.x,
        )} FIRE ON ${formatIntelCue('POW', this.helicopter.x, this.pendingHostageThreat.target.x)}`
        : this.boss?.isMissileWarning
          ? 'BOSS MISSILE LOCK — FLY AWAY OR TAKE RIDGE COVER'
        : this.samMissiles.getChildren().some((child) =>
          child.active && (child as SamMissile).isBossMissile)
          ? 'BOSS MISSILE INBOUND — OUTRUN IT OR TAKE COVER'
        : this.boss?.isWarning
          ? 'BOSS ATTACK INCOMING — MOVE OUT OF THE SIGHT LINE'
        : this.aaGuns.some((gun) => gun.isWarning)
          ? `AA AIMING ${formatIntelCue('GUN', this.helicopter.x, nearestX(
            this.helicopter.x,
            this.aaGuns.filter((gun) => gun.isWarning).map((gun) => gun.x),
          ))} — FLY LOW OR BOMB IT`
          : this.samLaunchers.some((launcher) => launcher.isWarning)
            ? `SAM LOCK ${formatIntelCue('LAUNCHER', this.helicopter.x, nearestX(
              this.helicopter.x,
              this.samLaunchers.filter((launcher) => launcher.isWarning)
                .map((launcher) => launcher.x),
            ))} — DIVE LOW OR TAKE COVER`
          : this.samMissiles.countActive(true) > 0
            ? 'SAM MISSILE INBOUND — DIVE LOW OR EVADE'
          : this.groundCombat && this.groundCombat.truckX !== null
            ? `REINFORCEMENT TRUCK ${formatIntelCue('INBOUND',
              this.helicopter.x, this.groundCombat.truckX)} — ${this.groundCombat.sfDeployed > 0
              ? 'SF DEFENDING POWS' : 'DEPLOY SF'}`
          : this.groundCombat && this.groundCombat.hostileAlive > 0
            ? `HOSTILE INFANTRY ${this.groundCombat.hostileAlive} — ${this.groundCombat.sfDeployed > 0
              ? 'SF ENGAGING' : 'DEFEND POWS'}`
          : '',
    });
  }

  private fireCannon(
    x: number,
    y: number,
    direction: -1 | 1,
    aimAngleRadians: number,
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
      aimAngleRadians,
    );

    round
      .enableBody(true, x, y, true, true)
      .setFlipX(direction < 0)
      .setRotation(direction * aimAngleRadians)
      .setVelocity(velocity.x, velocity.y);

    this.showWeaponFlash(x, y, 0xffe27a, 8);
    this.audioManager.playCannon();
  }

  private dropBomb(
    x: number,
    y: number,
    helicopterVelocityX: number,
    time: number,
  ): void {
    const bomb = new Bomb(
      this,
      x,
      y,
      helicopterVelocityX,
      time,
      this.level.worldWidth,
    );
    this.bombs.add(bomb);
    this.showWeaponFlash(x, y, 0xc7b96a, 7);
  }

  private detonateBomb(bomb: Bomb): void {
    if (!bomb.active) {
      return;
    }

    const x = bomb.x;
    const y = bomb.y;
    bomb.destroy();
    this.showGroundExplosion(x, y);
    this.damageBombTargets(x, y);
  }

  private damageBombTargets(x: number, y: number): void {
    let objectiveChanged = false;
    const exposedHostagesInBlast = getTargetsWithinBombBlast(
      this.hostages.filter((hostage) => hostage.active),
      x,
      y,
      BOMB.blastRadius,
    );
    if (this.groundCombat) {
      const groundHit = this.groundCombat.damageAt(
        this, x, y, BOMB.tankDamage, BOMB.blastRadius, this.time.now,
      );
      this.handleGroundCombatEvents(groundHit.events);
    }

    for (const tank of this.tanks) {
      if (
        !tank.active ||
        !isWithinBombBlast(x, y, tank.x, tank.y, BOMB.blastRadius)
      ) {
        continue;
      }

      const targetX = tank.x;
      const targetY = tank.y;
      if (tank.takeDamage(BOMB.tankDamage)) {
        this.destroyedTankCount += 1;
        this.gameState.awardScore(TANK.scoreValue);
        this.showScoreAward(targetX, targetY - 34, TANK.scoreValue);
        objectiveChanged = true;
      }
    }

    for (const aaGun of this.aaGuns) {
      if (!aaGun.active ||
        !isWithinBombBlast(x, y, aaGun.x, aaGun.y, BOMB.blastRadius)) {
        continue;
      }

      const targetX = aaGun.x;
      const targetY = aaGun.y;
      if (aaGun.takeDamage(AA_GUN.bombDamage)) {
        this.awardAaDestruction(targetX, targetY, false);
      }
    }
    for (const launcher of this.samLaunchers) {
      if (!launcher.active ||
        !isWithinBombBlast(x, y, launcher.x, launcher.y, BOMB.blastRadius)) {
        continue;
      }
      const targetX = launcher.x;
      const targetY = launcher.y;
      if (launcher.takeDamage(SAM.bombDamage)) {
        this.awardSamDestruction(targetX, targetY, false);
      }
    }

    for (const camp of this.prisonCamps) {
      if (
        !camp.active ||
        !isWithinBombBlast(x, y, camp.x, camp.y, BOMB.blastRadius)
      ) {
        continue;
      }

      if (camp.takeDamage(BOMB.campDamage)) {
        this.releaseHostages(camp);
        objectiveChanged = true;
      }
    }

    for (const hostage of exposedHostagesInBlast) {
      if (!hostage.active || !hostage.kill()) {
        continue;
      }

      this.showHostageDeathFeedback(hostage, hostage.x, hostage.y);
      objectiveChanged = true;
    }

    if (objectiveChanged) {
      this.updateObjectiveText();
    }
  }

  private updateGroundCombatWeapons(time: number): void {
    if (!this.groundCombat) return;
    for (const child of [...this.cannonRounds.getChildren()]) {
      const round = child as Phaser.Physics.Arcade.Image;
      if (!round.active || round.y < GROUND_Y - 60) continue;
      const result = this.groundCombat.damageAt(
        this, round.x, round.y, 1, 0, time,
      );
      if (result.hit) {
        round.disableBody(true, true);
        this.handleGroundCombatEvents(result.events);
      }
    }
  }

  private handleGroundCombatEvents(events: readonly GroundCombatEvent[]): void {
    let objectiveChanged = false;
    for (const event of events) {
      if (event.type === 'powHit') {
        const hostage = this.hostages[event.powId];
        if (hostage?.kill()) {
          this.showHostageDeathFeedback(hostage, hostage.x, hostage.y);
          objectiveChanged = true;
        }
      } else if (event.type === 'hostileKilled') {
        this.gameState.awardScore(GROUND_COMBAT.hostileScore);
        this.showScoreAward(event.x, GROUND_Y - 45,
          GROUND_COMBAT.hostileScore, 'HOSTILE DOWN');
        objectiveChanged = true;
      } else if (event.type === 'truckDestroyed') {
        this.gameState.awardScore(GROUND_COMBAT.truckScore);
        this.showScoreAward(event.x, GROUND_Y - 70,
          GROUND_COMBAT.truckScore, 'TRUCK DOWN');
        this.showGroundExplosion(event.x, GROUND_Y - 25);
        objectiveChanged = true;
      } else if (event.type === 'sfKilled') {
        this.showScoreAward(event.x, GROUND_Y - 45, 0, 'SF LOST');
        objectiveChanged = true;
      } else if (event.type === 'truckArrived' ||
        event.type === 'hostilesUnloaded') {
        objectiveChanged = true;
      }
    }
    if (objectiveChanged) this.updateObjectiveText();
  }

  private updateRotorAudio(): void {
    const body = this.helicopter.body as Phaser.Physics.Arcade.Body;
    const horizontalRatio =
      Math.abs(body.velocity.x) / HELICOPTER.maximumHorizontalSpeed;
    const verticalRatio =
      Math.abs(body.velocity.y) / HELICOPTER.maximumVerticalSpeed;
    const speedRatio = Phaser.Math.Clamp(
      Math.hypot(horizontalRatio, verticalRatio) / Math.SQRT2,
      0,
      1,
    );

    this.audioManager.updateRotor(this.helicopter.active, speedRatio);
  }

  private fireMissile(
    x: number,
    y: number,
    direction: -1 | 1,
    target: Jet | BossHelicopter,
    time: number,
  ): void {
    const missile = new HomingMissile(
      this,
      x,
      y,
      direction,
      target,
      time,
      this.level.worldWidth,
    );
    this.missiles.add(missile);
    this.showWeaponFlash(x, y, 0x9fc7c5, 14);
    this.cameras.main.shake(70, 0.002);
  }

  private getMissileLockTarget(): Jet | BossHelicopter | null {
    let nearestTarget: Jet | BossHelicopter | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    const targets: (Jet | BossHelicopter)[] = [
      ...this.jets.getChildren() as Jet[],
      ...(this.boss?.active ? [this.boss] : []),
    ];
    for (const jet of targets) {
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

  private updateHostageThreat(time: number): void {
    const pending = this.pendingHostageThreat;
    if (pending) {
      if (!pending.source.active ||
        !isThreatTargetStillExposed(pending.target.currentState)) {
        this.clearHostageThreat(time);
        return;
      }

      pending.marker.setPosition(pending.target.x, pending.target.y - 59);
      if (!pending.coverStarted &&
        time - pending.startedAt >= HOSTAGE_THREAT.coverReactionMs) {
        pending.target.takeCover(HOSTAGE.coverDurationMs);
        pending.coverStarted = true;
      }

      if (time - pending.startedAt < HOSTAGE_THREAT.warningMs) {
        return;
      }

      const shot = pending.source instanceof Tank
        ? pending.source.tryFire(time, pending.target.x, pending.target.y - 20)
        : pending.source.update(time, {
          x: pending.target.x,
          y: pending.target.y - 20,
        });
      if (shot) {
        this.fireEnemyRound(shot, true);
      }
      this.clearHostageThreat(time);
      return;
    }

    if (this.level.difficultyRank <= 1 || time < this.nextHostageThreatAt) {
      return;
    }

    const exposed = this.hostages.filter((hostage) =>
      canStartHostageThreat(
        this.level.difficultyRank,
        hostage.currentState,
        Math.abs(hostage.x - this.helicopter.x),
      ) && this.cameras.main.worldView.contains(hostage.x, hostage.y - 50),
    );
    let bestSource: Tank | Jet | null = null;
    let bestTarget: Hostage | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    const sources: (Tank | Jet)[] = [
      ...this.tanks.filter((tank) => tank.active),
      ...this.jets.getChildren().filter((jet) => jet.active) as Jet[],
    ];
    for (const source of sources) {
      for (const target of exposed) {
        const distance = Phaser.Math.Distance.Between(
          source.x, source.y, target.x, target.y - 20,
        );
        const range = source instanceof Tank ? TANK.fireRange : JET.fireRange;
        if (distance > range - 80 || distance >= bestDistance ||
          (source instanceof Tank && !isGroundPathClear(
            source.x,
            target.x,
            this.level.flightObstacles,
            8,
          ))) {
          continue;
        }
        bestSource = source;
        bestTarget = target;
        bestDistance = distance;
      }
    }

    if (!bestSource || !bestTarget) {
      this.nextHostageThreatAt = time + HOSTAGE_THREAT.retryMs;
      return;
    }

    const marker = this.add.text(bestTarget.x, bestTarget.y - 59,
      '▼ POW TARGET', {
        color: '#ff7b62',
        backgroundColor: '#3d1918',
        fontFamily: 'Courier New',
        fontSize: '16px',
        fontStyle: 'bold',
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5).setDepth(30);
    this.pendingHostageThreat = {
      source: bestSource,
      target: bestTarget,
      startedAt: time,
      coverStarted: false,
      marker,
    };
  }

  private clearHostageThreat(time: number): void {
    this.pendingHostageThreat?.marker.destroy();
    this.pendingHostageThreat = null;
    this.nextHostageThreatAt = time +
      hostageThreatIntervalMs(this.level.difficultyRank);
  }

  private fireEnemyRound(shot: EnemyShot, hostageTargeted = false): void {
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
      .setData('hostageTargeted', hostageTargeted)
      .setVelocity(shot.velocityX, shot.velocityY);
  }

  private trySpawnJet(time: number): void {
    if (
      this.playerDestroyed ||
      this.boss?.active ||
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

    const jet = new Jet(this, direction, altitude, this.level.worldWidth);
    this.jets.add(jet);
    this.jetSpawnCount += 1;
    this.nextJetSpawnAt = time + this.level.jetSpawnIntervalMs;
  }

  private recycleOffscreenProjectiles(
    projectiles: Phaser.Physics.Arcade.Group,
  ): void {
    projectiles.children.each((child) => {
      const round = child as Phaser.Physics.Arcade.Image;
      if (
        round.active &&
        (round.x < -32 ||
          round.x > this.level.worldWidth + 32 ||
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

  private destroyHelicopter(cause?: 'OUT OF FUEL'): void {
    this.playerDestroyed = true;
    this.clearHostageThreat(this.time.now);
    if (this.boss?.active) this.boss.cancelAttack(this.time.now);
    for (const aaGun of this.aaGuns) {
      if (aaGun.active) {
        aaGun.cancelAttack(this.time.now);
      }
    }
    for (const launcher of this.samLaunchers) {
      if (launcher.active) launcher.cancelAttack(this.time.now);
    }
    this.fullLoadBonusReady = false;
    const explosionX = this.helicopter.x;
    const explosionY = this.helicopter.y;
    this.groundCombat?.onHelicopterDestroyed(explosionX);
    const lostPassengers = this.helicopter.disableAfterDestruction();

    const regroupingHostages = this.hostages.filter(
      (hostage) => hostage.currentState === HostageState.Aboard,
    );
    if (regroupingHostages.length !== lostPassengers) {
      throw new Error('Passenger manifest did not match aboard hostages.');
    }
    if (lostPassengers > 0) {
      this.showPassengerRegroupNotice(lostPassengers);
      this.time.delayedCall(HOSTAGE.crashRegroupDelayMs, () => {
        for (const hostage of regroupingHostages) {
          hostage.returnToRallyAfterHelicopterLoss();
        }
      });
    }

    this.gameState.loseLife();
    this.disableProjectiles(this.cannonRounds);
    this.disableProjectiles(this.enemyRounds);
    this.destroyProjectiles(this.missiles);
    this.destroyProjectiles(this.samMissiles);
    this.destroyProjectiles(this.bombs);
    this.showHelicopterExplosion(explosionX, explosionY);
    if (cause === 'OUT OF FUEL') this.showFuelFailureNotice();

    this.targetText.setText(
      this.gameState.isGameOver
        ? cause ?? 'ALL HELICOPTERS LOST'
        : `${cause ?? 'HELICOPTER LOST'} — ${this.gameState.lives} REMAINING`,
    );
    this.targetText.setColor('#e46b56');

    if (this.gameState.isGameOver) {
      this.time.delayedCall(PLAYER.gameOverDelayMs, () => {
        this.scene.start('GameOverScene', {
          rescued: this.gameState.rescued,
          score: this.gameState.score,
          reason: cause ?? 'ALL HELICOPTERS LOST',
          levelIndex: this.levelIndex,
        });
      });
      return;
    }

    this.time.delayedCall(PLAYER.respawnDelayMs, () => {
      this.helicopter.respawn(
        PLAYER.respawnX,
        RESCUE_BASE.surfaceY - 21,
      );
      this.fuelTank?.refill();
      this.playerDestroyed = false;
      this.configureCamera();
      this.updateObjectiveText();
    });
  }

  private showHelicopterExplosion(x: number, y: number): void {
    this.showExplosion(x, y, 28, 18, 240, 0.01);
  }

  private showFuelFailureNotice(): void {
    const notice = this.add.text(
      GAME_WIDTH / 2,
      182,
      'OUT OF FUEL — HELICOPTER LOST',
      {
        backgroundColor: '#35221d',
        color: '#f4a180',
        fontFamily: 'Courier New',
        fontSize: '20px',
        fontStyle: 'bold',
        padding: { x: 12, y: 7 },
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
    this.tweens.add({
      targets: notice,
      alpha: 0,
      delay: 2_200,
      duration: 800,
      onComplete: () => notice.destroy(),
    });
  }

  private showPassengerRegroupNotice(count: number): void {
    const notice = this.add.text(
      GAME_WIDTH / 2,
      146,
      `${count} ${count === 1 ? 'POW' : 'POWS'} SURVIVED — REGROUPING AT CAMP RALLY POINTS`,
      {
        backgroundColor: '#243128',
        color: '#9fc7c5',
        fontFamily: 'Courier New',
        fontSize: '19px',
        fontStyle: 'bold',
        padding: { x: 12, y: 7 },
      },
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1500);
    this.tweens.add({
      targets: notice,
      alpha: 0,
      delay: 1500,
      duration: 700,
      onComplete: () => notice.destroy(),
    });
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
    this.audioManager.playExplosion(radius);
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

  private damageBoss(amount: number): void {
    const boss = this.boss;
    if (!boss?.active) return;
    const x = boss.x;
    const y = boss.y;
    if (boss.takeDamage(amount)) {
      this.gameState.defeatBoss();
      this.gameState.awardScore(BOSS.scoreValue);
      this.showScoreAward(x, y - 62, BOSS.scoreValue, 'BOSS DOWN');
      this.showExplosion(x, y, 42, 24, 260, 0.008);
      this.updateObjectiveText();
    }
  }

  private awardAaDestruction(
    x: number,
    y: number,
    showExplosion = true,
  ): void {
    this.gameState.awardScore(AA_GUN.scoreValue);
    this.showScoreAward(x, y - 36, AA_GUN.scoreValue, 'AA DOWN');
    if (showExplosion) {
      this.showGroundExplosion(x, y);
    }
    this.updateObjectiveText();
  }

  private awardSamDestruction(x: number, y: number, showExplosion = true): void {
    this.gameState.awardScore(SAM.scoreValue);
    this.showScoreAward(x, y - 36, SAM.scoreValue, 'SAM DOWN');
    if (showExplosion) this.showGroundExplosion(x, y);
    this.updateObjectiveText();
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

  private showScoreAward(
    x: number,
    y: number,
    points: number,
    label = '',
  ): void {
    const scoreText = this.add
      .text(x, y, `${label}${points > 0 ? `${label ? ' ' : ''}+${points}` : ''}`, {
        color: points > 0 ? '#f3d45a' : '#ff7b62',
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
    if (this.level.difficultyRank > 1 &&
      !Number.isFinite(this.nextHostageThreatAt)) {
      this.nextHostageThreatAt = this.time.now +
        HOSTAGE_THREAT.initialDelayMs;
    }
    const rallyPositions = getHostageRallyPositions(
      prisonCamp.x,
      PRISON_CAMP.hostageCount,
      this.level.flightObstacles,
      this.level.worldWidth,
      HOSTAGE.rallyDistance,
      HOSTAGE.rallySpacing,
    );

    for (let index = 0; index < PRISON_CAMP.hostageCount; index += 1) {
      const hostage = new Hostage(
        this,
        prisonCamp.x,
        rallyPositions[index] ?? prisonCamp.x,
        index * HOSTAGE.releaseDelayMs,
        this.level.flightObstacles,
      );
      this.hostages.push(hostage);
      for (const obstacleBody of this.flightObstacleBodies) {
        this.physics.add.collider(hostage, obstacleBody);
      }
      this.physics.add.overlap(
        hostage,
        this.cannonRounds,
        (hostageObject, roundObject) => {
          const target = hostageObject as Hostage;
          const round = roundObject as Phaser.Physics.Arcade.Image;
          if (!round.active || !target.kill()) {
            return;
          }

          const targetX = target.x;
          const targetY = target.y;
          round.disableBody(true, true);
          this.showHostageDeathFeedback(target, targetX, targetY);
          this.updateObjectiveText();
        },
      );
      if (this.level.difficultyRank > 1) {
        this.physics.add.overlap(
          hostage,
          this.enemyRounds,
          (hostageObject, roundObject) => {
            const target = hostageObject as Hostage;
            const round = roundObject as Phaser.Physics.Arcade.Image;
            if (
              !round.active ||
              !round.getData('hostageTargeted') ||
              !target.kill()
            ) {
              return;
            }
            round.disableBody(true, true);
            this.showHostageDeathFeedback(target, target.x, target.y);
            this.updateObjectiveText();
          },
        );
      }
      this.physics.add.overlap(
        hostage,
        this.bombs,
        (_hostageObject, bombObject) => {
          const bomb = bombObject as Bomb;
          this.detonateBomb(bomb);
        },
      );
      this.physics.add.overlap(
        this.helicopter,
        hostage,
        (helicopterObject, hostageObject) => {
          const helicopter = helicopterObject as Helicopter;
          const target = hostageObject as Hostage;
          const helicopterBody =
            helicopter.body as Phaser.Physics.Arcade.Body;
          const hostageBody = target.body as Phaser.Physics.Arcade.Body;

          if (
            this.playerDestroyed ||
            !helicopter.active ||
            !canHostageBeCrushed({
              hostageState: target.currentState,
              helicopterLanded: helicopter.isLanded,
              helicopterVelocityY: helicopterBody.velocity.y,
              helicopterBottom: helicopterBody.bottom,
              hostageCenterY: hostageBody.center.y,
            })
          ) {
            return;
          }

          const targetX = target.x;
          const targetY = target.y;
          if (!target.kill()) {
            return;
          }

          this.audioManager.playSmush();
          this.showHostageCrushFeedback(target, targetX, targetY);
          this.updateObjectiveText();
        },
      );
    }
    this.groundCombat?.triggerTruck(prisonCamp.x, this.time.now);
  }

  private showHostageDeathFeedback(
    hostage: Hostage,
    x: number,
    y: number,
  ): void {
    hostage.setTintFill(0xe46b56).setDepth(20);
    this.cameras.main.shake(90, 0.002);
    this.tweens.add({
      targets: hostage,
      angle: hostage.flipX ? -90 : 90,
      alpha: 0,
      y: y + 5,
      duration: 620,
      ease: 'Quad.easeIn',
      onComplete: () => hostage.setVisible(false),
    });

    const warning = this.add
      .text(x, y - 38, 'HOSTAGE LOST', {
        color: '#e46b56',
        fontFamily: 'Courier New',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.tweens.add({
      targets: warning,
      alpha: 0,
      y: warning.y - 30,
      duration: 950,
      ease: 'Quad.easeOut',
      onComplete: () => warning.destroy(),
    });

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const fragment = this.add
        .rectangle(x, y - 12, 4, 4, 0xe46b56, 0.9)
        .setDepth(19);
      this.tweens.add({
        targets: fragment,
        x: x + Math.cos(angle) * 24,
        y: y - 12 + Math.sin(angle) * 18,
        alpha: 0,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => fragment.destroy(),
      });
    }
  }

  private showHostageCrushFeedback(
    hostage: Hostage,
    x: number,
    y: number,
  ): void {
    hostage
      .setTintFill(0x9f3d32)
      .setDepth(20)
      .setScale(1.35, 0.28)
      .setY(y);
    this.cameras.main.shake(70, 0.0015);
    this.tweens.add({
      targets: hostage,
      alpha: 0,
      duration: 620,
      delay: 180,
      ease: 'Quad.easeIn',
      onComplete: () => hostage.setVisible(false),
    });

    const warning = this.add
      .text(x, y - 34, 'HOSTAGE CRUSHED', {
        color: '#e46b56',
        fontFamily: 'Courier New',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.tweens.add({
      targets: warning,
      alpha: 0,
      y: warning.y - 28,
      duration: 950,
      ease: 'Quad.easeOut',
      onComplete: () => warning.destroy(),
    });

    for (let index = 0; index < 6; index += 1) {
      const direction = index % 2 === 0 ? -1 : 1;
      const fragment = this.add
        .rectangle(x, y - 3, 5, 3, 0x9f3d32, 0.9)
        .setDepth(19);
      this.tweens.add({
        targets: fragment,
        x: x + direction * Phaser.Math.Between(16, 34),
        y: y - Phaser.Math.Between(2, 10),
        alpha: 0,
        duration: Phaser.Math.Between(280, 430),
        ease: 'Quad.easeOut',
        onComplete: () => fragment.destroy(),
      });
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
        this.rescueBase.surfaceY,
      )
    ) {
      return false;
    }

    const fullLoadBonus = this.fullLoadBonusReady
      ? calculateFullLoadBonus(
        this.helicopter.passengerCount,
        this.helicopter.passengerCapacity,
        RESCUE_BASE.fullLoadBonus,
      )
      : 0;
    if (!this.helicopter.unloadPassenger()) {
      throw new Error('Passenger manifest did not match aboard hostages.');
    }

    if (this.fullLoadBonusReady) {
      if (fullLoadBonus > 0) {
        this.gameState.awardScore(fullLoadBonus);
        this.showScoreAward(
          this.helicopter.x,
          this.helicopter.y - 65,
          fullLoadBonus,
          'FULL LOAD',
        );
      }
      this.fullLoadBonusReady = false;
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
        HostageState.TakingCover,
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
    const remainingTanks = this.tanks.length - this.destroyedTankCount;
    const remainingAa = this.aaGuns.filter((gun) => gun.active).length;
    const remainingSam = this.samLaunchers.filter((launcher) => launcher.active).length;

    if (disembarking || unloadingAtBase) {
      this.targetText.setText(
        `UNLOADING: ${this.gameState.rescued}/${this.gameState.rescueTarget} RESCUED   ${passengers} ABOARD`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (this.boss?.active &&
      this.gameState.rescued >= this.gameState.rescueTarget) {
      this.targetText.setText('RESCUE TARGET MET — DEFEAT THE BOSS TO WIN');
      this.targetText.setColor('#ffb978');
      return;
    }

    if (passengers === this.helicopter.passengerCapacity) {
      this.targetText.setText(
        `HELICOPTER FULL — RETURN TO BASE FOR +${RESCUE_BASE.fullLoadBonus}`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (passengers > 0 && hostagesAtCamp === 0) {
      this.targetText.setText(
        remainingTanks === 0
          ? 'HOSTAGES ABOARD — RETURN TO BASE'
          : `HOSTAGES ABOARD — DESTROY ${remainingTanks} ${remainingTanks === 1 ? 'TANK' : 'TANKS'}`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (passengers > 0) {
      this.targetText.setText(
        `BOARDING: ${passengers} ABOARD   ${hostagesAtCamp} WAITING   FULL LOAD +${RESCUE_BASE.fullLoadBonus}`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    if (hostagesAtCamp > 0) {
      this.targetText.setText(
        this.groundCombat && this.groundCombat.sfAboard > 0
          ? `LAND NEAR ${hostagesAtCamp} POWS — PRESS G TO DEPLOY SF`
          : `${this.gameState.rescued}/${this.gameState.rescueTarget} RESCUED — LAND NEAR ${hostagesAtCamp} HOSTAGES`,
      );
      this.targetText.setColor('#8fe388');
      return;
    }

    const campInstruction = `${closedCampCount} PRISON ${closedCampCount === 1 ? 'CAMP' : 'CAMPS'}`;
    this.targetText.setText(
      this.boss?.active
        ? `BOSS ${this.boss.health}/${BOSS.health} — OPEN ${campInstruction} AND RESCUE POWS`
        : this.level.boss
        ? `BOSS DOWN — OPEN ${campInstruction} AND RESCUE POWS`
      : this.groundCombat && this.groundCombat.sfAboard > 0
        ? `SF ${this.groundCombat.sfAboard} ABOARD — OPEN ${campInstruction} AND DEPLOY`
        : remainingSam > 0
        ? `SAM ACTIVE — FLY LOW OR BOMB IT   OPEN ${campInstruction}`
        : remainingAa > 0
        ? `AA GUN ACTIVE — FLY LOW OR BOMB IT   OPEN ${campInstruction}`
        : remainingTanks === 0
        ? `DESTROY ${campInstruction}`
        : `DESTROY ${remainingTanks} ${remainingTanks === 1 ? 'TANK' : 'TANKS'} AND ${campInstruction}`,
    );
    this.targetText.setColor('#f3d45a');
  }

  private shouldEndFailedRescue(): boolean {
    const closedCampCount = this.prisonCamps.filter(
      (camp) => !camp.isOpen,
    ).length;

    return shouldEndFailedRescue({
      rescued: this.gameState.rescued,
      rescueTarget: this.gameState.rescueTarget,
      closedCampCount,
      hostageStates: this.hostages.map((hostage) => hostage.currentState),
    });
  }

  private startVictoryScene(): void {
    this.scene.start('VictoryScene', {
      rescued: this.gameState.rescued,
      score: this.gameState.score,
      lives: this.gameState.lives,
      levelIndex: this.levelIndex,
    });
  }
}
