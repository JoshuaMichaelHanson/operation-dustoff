import Phaser from 'phaser';

import { GAME_WIDTH } from '../constants';

export interface HudState {
  score: number;
  rescued: number;
  rescueTarget: number;
  passengers: number;
  passengerCapacity: number;
  health: number;
  maximumHealth: number;
  lives: number;
  isLanded: boolean;
  tankDestroyed: boolean;
  openCamps: number;
  totalCamps: number;
  missileLocked: boolean;
  missileReady: boolean;
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
  private readonly statusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
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
    this.livesText = this.createMetric(scene, 1090, '#d6dec3');

    scene.add
      .text(24, 54, 'WASD / ARROWS: FLY   SPACE: CANNON   X: MISSILE', {
        color: '#91a087',
        fontFamily: 'Courier New',
        fontSize: '14px',
      })
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

    const flightState = state.isLanded ? 'LANDED' : 'AIRBORNE';
    const tankState = state.tankDestroyed ? 'DESTROYED' : 'ACTIVE';
    const missileState = state.missileLocked
      ? state.missileReady
        ? '   MISSILE LOCK'
        : '   MISSILE RELOAD'
      : '';
    this.statusText.setText(
      `${flightState}   TANK ${tankState}   CAMPS ${state.openCamps}/${state.totalCamps}${missileState}`,
    );
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
