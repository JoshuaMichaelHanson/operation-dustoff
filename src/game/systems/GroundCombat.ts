import Phaser from 'phaser';

import { GROUND_COMBAT, GROUND_Y, RESCUE_BASE } from '../constants';
import type { FlightObstacleConfig } from '../levels/levelConfig';
import {
  GroundCombatModel,
  type GroundCombatEvent,
  type GroundHelicopter,
  type GroundPow,
} from '../logic/groundCombat';

export class GroundCombat {
  readonly model: GroundCombatModel;
  private readonly art: Phaser.GameObjects.Graphics;
  private readonly truckLabel: Phaser.GameObjects.Text;
  private readonly sfLabels: Phaser.GameObjects.Text[];

  constructor(scene: Phaser.Scene, worldWidth: number,
    obstacles: readonly FlightObstacleConfig[]) {
    this.model = new GroundCombatModel(worldWidth, RESCUE_BASE.centerX, obstacles);
    this.art = scene.add.graphics().setDepth(11);
    this.truckLabel = scene.add.text(0, 0, 'REINFORCEMENTS', {
      color: '#ff9b72',
      fontFamily: 'Courier New',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1).setDepth(12).setVisible(false);
    this.sfLabels = Array.from({ length: GROUND_COMBAT.sfSeats }, () =>
      scene.add.text(0, 0, 'SF', {
        color: '#c4fff0',
        backgroundColor: '#173b3a',
        fontFamily: 'Courier New',
        fontSize: '12px',
        fontStyle: 'bold',
        padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 1).setDepth(13).setVisible(false));
  }

  get sfAboard(): number { return this.model.sfAboard; }
  get sfDeployed(): number { return this.model.sfDeployed; }
  get hostileAlive(): number { return this.model.hostileAlive; }
  get truckX(): number | null {
    const truck = this.model.truck;
    return truck && ['approaching', 'unloading', 'retreating'].includes(truck.state)
      ? truck.x : null;
  }

  triggerTruck(campX: number, time: number): boolean {
    return this.model.triggerTruck(campX, time);
  }

  commandSf(helicopter: GroundHelicopter, time: number): boolean {
    return this.model.commandSf(helicopter, time);
  }

  onHelicopterDestroyed(x: number): void {
    this.model.onHelicopterDestroyed(x);
  }

  actionLabel(helicopter: GroundHelicopter): string {
    const nearby = this.model.units.some((unit) =>
      unit.team === 'sf' && ['deployed', 'cover'].includes(unit.state) &&
      Math.abs(unit.x - helicopter.x) <= 95);
    if (nearby && helicopter.isLanded) return 'BOARD\nSF';
    if (this.sfAboard > 0) return helicopter.x >= 650
      ? 'DEPLOY\nSF' : `SF\n${this.sfAboard} SEATS`;
    return this.sfDeployed > 0 ? 'SF\nAWAY' : 'SF\nLOST';
  }

  update(scene: Phaser.Scene, time: number, deltaMs: number,
    helicopter: GroundHelicopter, pows: readonly GroundPow[]): GroundCombatEvent[] {
    const events = this.model.update(time, deltaMs, helicopter, pows);
    this.render(helicopter);
    this.showEvents(scene, events);
    return events;
  }

  damageAt(scene: Phaser.Scene, x: number, y: number, damage: number,
    radius: number, time: number): { hit: boolean; events: GroundCombatEvent[] } {
    const result = this.model.damageAt(x, y, damage, radius, time);
    this.showEvents(scene, result.events);
    return result;
  }

  destroy(): void {
    this.art.destroy();
    this.truckLabel.destroy();
    for (const label of this.sfLabels) label.destroy();
  }

  private render(helicopter: GroundHelicopter): void {
    this.art.clear();
    for (const label of this.sfLabels) label.setVisible(false);
    const truck = this.model.truck;
    const showTruck = truck &&
      ['approaching', 'unloading', 'retreating'].includes(truck.state);
    if (showTruck) {
      this.art.fillStyle(0x303c35);
      this.art.fillRect(truck.x - 38, GROUND_Y - 35, 76, 26);
      this.art.fillStyle(0x9f5d48);
      this.art.fillRect(truck.x - 33, GROUND_Y - 31, 47, 19);
      this.art.fillStyle(0xd6dec3);
      this.art.fillRect(truck.x + 17, GROUND_Y - 29, 15, 8);
      this.art.fillStyle(0x1b2420);
      this.art.fillCircle(truck.x - 23, GROUND_Y - 7, 8);
      this.art.fillCircle(truck.x + 24, GROUND_Y - 7, 8);
      this.truckLabel.setPosition(truck.x, GROUND_Y - 43).setVisible(true);
    } else {
      this.truckLabel.setVisible(false);
    }

    for (const unit of this.model.units) {
      if (unit.state === 'dead') continue;
      const aboard = unit.state === 'aboard';
      const x = Math.round(aboard
        ? helicopter.x + (unit.id === 0 ? -24 : 24) : unit.x);
      const feetY = Math.round(aboard
        ? (helicopter.y ?? GROUND_Y) + 11 : GROUND_Y);
      this.drawSoldier(x, feetY, unit.team === 'sf', unit.facing,
        unit.state === 'cover', aboard);
      if (unit.team === 'sf' && !aboard) {
        this.sfLabels[unit.id]?.setPosition(x, feetY -
          (unit.state === 'cover' ? 33 : 43)).setVisible(true);
      }
    }
  }

  private drawSoldier(x: number, feetY: number, friendly: boolean,
    facing: -1 | 1, crouching: boolean, aboard: boolean): void {
    const armor = friendly ? 0x426d67 : 0x843e35;
    const highlight = friendly ? 0x8ce8d7 : 0xf28d67;
    const helmet = friendly ? 0x799d86 : 0x665f4b;
    const gear = friendly ? 0x233e39 : 0x422b25;
    const skin = friendly ? 0xd1c7a4 : 0xd6a07e;
    const top = feetY - (aboard ? 18 : crouching ? 28 : 36);

    if (!aboard) {
      this.art.fillStyle(0x14201b, 0.65);
      this.art.fillRect(x - 13, feetY - 2, 26, 3);
      this.art.fillStyle(gear);
      if (crouching) {
        this.art.fillRect(x - 9, feetY - 9, 18, 6);
      } else {
        this.art.fillRect(x - 7, feetY - 13, 5, 10);
        this.art.fillRect(x + 2, feetY - 13, 5, 10);
      }
      this.art.fillRect(x - 9, feetY - 4, 8, 4);
      this.art.fillRect(x + 1, feetY - 4, 8, 4);
    }

    const bodyY = top + (aboard ? 8 : 12);
    const bodyHeight = aboard ? 8 : 13;
    const backX = facing === 1 ? x - 11 : x + 7;
    this.art.fillStyle(gear);
    this.art.fillRect(backX, bodyY + 1, 5, bodyHeight - 1);
    this.art.fillStyle(armor);
    this.art.fillRect(x - 8, bodyY, 16, bodyHeight);
    this.art.fillStyle(highlight);
    this.art.fillRect(x - 5, bodyY + 2, 10, aboard ? 4 : 8);
    this.art.fillStyle(gear);
    this.art.fillRect(x - 3, bodyY + 3, 6, aboard ? 3 : 5);
    if (friendly) {
      this.art.fillStyle(highlight);
      this.art.fillRect(x - 2, bodyY + 4, 4, 3);
    }

    this.art.fillStyle(skin);
    this.art.fillRect(x - 4, top + 5, 8, 7);
    this.art.fillStyle(helmet);
    this.art.fillRect(x - 8, top + 1, 16, 6);
    this.art.fillRect(x - 5, top - 2, 10, 3);
    this.art.fillRect(facing === 1 ? x + 7 : x - 11, top + 5, 4, 2);
    this.art.fillStyle(gear);
    this.art.fillRect(facing === 1 ? x + 1 : x - 5, top + 7, 4, 2);

    const rifleY = bodyY + (aboard ? 5 : 7);
    this.art.fillStyle(skin);
    this.art.fillRect(facing === 1 ? x + 5 : x - 9, rifleY - 1, 4, 4);
    this.art.fillStyle(0x202a28);
    this.art.fillRect(facing === 1 ? x + 3 : x - 23,
      rifleY, aboard ? 15 : 23, 3);
    this.art.fillRect(facing === 1 ? x + 11 : x - 14,
      rifleY + 2, 3, 4);
    this.art.fillStyle(0xa8aaa0);
    this.art.fillRect(facing === 1 ? x + 18 : x - 24,
      rifleY, aboard ? 2 : 3, 2);
  }

  private showEvents(scene: Phaser.Scene, events: readonly GroundCombatEvent[]): void {
    for (const event of events) {
      if (event.type === 'shot') {
        const graphics = scene.add.graphics().setDepth(14);
        graphics.lineStyle(2, event.friendly ? 0x9fc7c5 : 0xff7b62, 0.95);
        const muzzleX = event.fromX + (event.toX < event.fromX ? -23 : 23);
        graphics.lineBetween(muzzleX, GROUND_Y - 20,
          event.toX, GROUND_Y - 20);
        graphics.fillStyle(0xffe2a0);
        graphics.fillRect(muzzleX - 2, GROUND_Y - 23, 5, 5);
        scene.tweens.add({
          targets: graphics,
          alpha: 0,
          duration: 180,
          onComplete: () => graphics.destroy(),
        });
      } else if (event.type === 'hostileKilled' || event.type === 'sfKilled' ||
        event.type === 'truckDestroyed') {
        const flash = scene.add.circle(event.x, GROUND_Y - 19,
          event.type === 'truckDestroyed' ? 24 : 11,
          event.type === 'sfKilled' ? 0x9fc7c5 : 0xff9b72, 0.85)
          .setDepth(14);
        scene.tweens.add({
          targets: flash, alpha: 0, scale: 2,
          duration: 300, onComplete: () => flash.destroy(),
        });
      }
    }
  }
}
