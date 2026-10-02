import Phaser from 'phaser';

import { GAME_WIDTH } from '../constants';
import { isTouchControlEnabled } from '../input/touchInput';

export interface HudState {
  score: number;
  rescued: number;
  rescueTarget: number;
  passengers: number;
  passengerCapacity: number;
  health: number;
  maximumHealth: number;
  lives: number;
  levelNumber: number;
  levelCount: number;
  isLanded: boolean;
  destroyedTanks: number;
  totalTanks: number;
  openCamps: number;
  totalCamps: number;
  missileLocked: boolean;
  missileReady: boolean;
  bombReady: boolean;
  fuelSeconds?: number;
  fuelRatio?: number;
  fuelWarning?: string;
  intel: string;
  threatWarning: string;
}

export function formatHudScore(score: number): string {
  return Math.max(0, Math.floor(score)).toString().padStart(6, '0');
}

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly rescuedText: Phaser.GameObjects.Text;
  private readonly passengersText: Phaser.GameObjects.Text;
  private readonly healthText: Phaser.GameObjects.Text;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly fuelText: Phaser.GameObjects.Text | null;
  private readonly fuelBar: Phaser.GameObjects.Graphics | null;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly intelText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, groundCombatEnabled = false,
    fuelEnabled = false) {
    scene.add
      .rectangle(GAME_WIDTH / 2, 43, GAME_WIDTH, 86, 0x11150f, 0.92)
      .setScrollFactor(0)
      .setDepth(1000);
    scene.add
      .rectangle(GAME_WIDTH / 2, 42, GAME_WIDTH - 48, 1, 0x596846, 0.8)
      .setScrollFactor(0)
      .setDepth(1001);

    this.scoreText = this.createMetric(scene, 105, '#f3d45a');
    this.rescuedText = this.createMetric(scene, 350, '#8fe388');
    this.passengersText = this.createMetric(scene, 610, '#9fc7c5');
    this.healthText = this.createMetric(scene, 850, '#8fe388');
    this.fuelText = fuelEnabled ? this.createMetric(scene, 1000, '#8fe388') : null;
    this.fuelBar = fuelEnabled
      ? scene.add.graphics().setScrollFactor(0).setDepth(1001) : null;
    this.livesText = this.createMetric(scene,
      fuelEnabled ? 1165 : 1090, '#d6dec3');

    scene.add
      .text(
        24,
        54,
        isTouchControlEnabled()
          ? groundCombatEnabled
            ? 'LEFT STICK: FLY   TAP SF / TURN / CANNON / MISSILE / BOMB'
            : 'LEFT STICK: FLY   TAP TURN   CANNON / MISSILE / BOMB'
          : groundCombatEnabled
            ? 'WASD / ARROWS: FLY   F: TURN   G: SF   SPACE: CANNON   X: MISSILE   Z: BOMB'
            : 'WASD / ARROWS: FLY   F: TURN   SPACE: CANNON   X: MISSILE   Z: BOMB',
        {
        color: '#91a087',
        fontFamily: 'Courier New',
        fontSize: '14px',
        },
      )
      .setScrollFactor(0)
      .setDepth(1001);

    this.statusText = scene.add
      .text(GAME_WIDTH - 24, 54, '', {
        color: '#c7b96a',
        fontFamily: 'Courier New',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1001);

    scene.add.rectangle(GAME_WIDTH / 2, 101, GAME_WIDTH, 30, 0x11150f, 0.78)
      .setScrollFactor(0)
      .setDepth(1000);
    this.intelText = scene.add.text(GAME_WIDTH / 2, 90, '', {
      color: '#d6dec3',
      fontFamily: 'Courier New',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1001);
  }

  update(state: HudState): void {
    this.scoreText.setText(`SCORE ${formatHudScore(state.score)}`);
    this.rescuedText.setText(
      `RESCUED ${state.rescued}/${state.rescueTarget}`,
    );
    this.passengersText.setText(
      `PASSENGERS ${state.passengers}/${state.passengerCapacity}`,
    );
    this.healthText
      .setText(`HULL ${state.health}`)
      .setColor(this.getHealthColor(state.health, state.maximumHealth));
    this.livesText.setText(`CHOPPERS ${state.lives}`);
    if (this.fuelText && this.fuelBar && state.fuelRatio !== undefined) {
      const ratio = Math.max(0, Math.min(1, state.fuelRatio));
      const color = ratio <= 0.2 ? 0xe46b56
        : ratio <= 0.4 ? 0xf3d45a : 0x8fe388;
      this.fuelText.setText(`FUEL ${state.fuelSeconds ?? 0}s`)
        .setColor(ratio <= 0.2 ? '#e46b56'
          : ratio <= 0.4 ? '#f3d45a' : '#8fe388');
      this.fuelBar.clear();
      this.fuelBar.fillStyle(0x314039).fillRect(947, 35, 106, 5);
      this.fuelBar.fillStyle(color).fillRect(949, 36,
        Math.round(102 * ratio), 3);
    }

    const flightState = state.isLanded ? 'LANDED' : 'AIRBORNE';
    const tankState = `${state.destroyedTanks}/${state.totalTanks}`;
    const missileState = state.missileLocked
      ? state.missileReady
        ? '   MISSILE LOCK'
        : '   MISSILE RELOAD'
      : '';
    const bombState = state.bombReady ? '   BOMB READY' : '   BOMB RELOAD';
    this.statusText.setText(
      `L${state.levelNumber}/${state.levelCount}   ${flightState}   TANKS ${tankState}   CAMPS ${state.openCamps}/${state.totalCamps}${missileState}${bombState}`,
    );
    const warning = state.threatWarning || state.fuelWarning;
    this.intelText.setText(warning || state.intel);
    this.intelText.setColor(warning ? '#ff7b62' : '#d6dec3');
  }

  private createMetric(
    scene: Phaser.Scene,
    x: number,
    color: string,
  ): Phaser.GameObjects.Text {
    return scene.add
      .text(x, 12, '', {
        color,
        fontFamily: 'Courier New',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1001);
  }

  private getHealthColor(health: number, maximumHealth: number): string {
    const healthRatio = health / maximumHealth;
    if (healthRatio <= 0.25) {
      return '#e46b56';
    }
    if (healthRatio <= 0.5) {
      return '#f3d45a';
    }
    return '#8fe388';
  }
}
