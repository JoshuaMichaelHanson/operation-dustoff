import { GROUND_COMBAT, GROUND_Y } from '../constants';
import { isGroundPathClear, type HorizontalObstacle } from './hostageRally';

export type GroundTeam = 'sf' | 'hostile';
export type GroundUnitState =
  'waiting' | 'aboard' | 'deployed' | 'advancing' | 'cover' | 'dead';

export interface GroundUnit {
  id: number;
  team: GroundTeam;
  x: number;
  facing: -1 | 1;
  state: GroundUnitState;
  health: number;
  coverEndsAt: number;
  nextFireAt: number;
}

export interface TruckState {
  x: number;
  destinationX: number;
  exitX: number;
  state: 'waiting' | 'approaching' | 'unloading' | 'retreating' | 'gone' | 'destroyed';
  health: number;
  nextActionAt: number;
  unloaded: number;
}

export interface GroundHelicopter {
  x: number;
  y?: number;
  isLanded: boolean;
  active: boolean;
}

export interface GroundPow {
  id: number;
  x: number;
}

export type GroundCombatEvent =
  | { type: 'shot'; fromX: number; toX: number; friendly: boolean }
  | { type: 'powHit'; powId: number }
  | { type: 'hostileKilled' | 'sfKilled' | 'truckDestroyed'; x: number }
  | { type: 'truckArrived' | 'hostilesUnloaded'; x: number };

export class GroundCombatModel {
  readonly units: GroundUnit[];
  truck: TruckState | null = null;
  private nextUnitId = GROUND_COMBAT.sfSeats;

  constructor(
    private readonly worldWidth: number,
    baseX: number,
    private readonly obstacles: readonly HorizontalObstacle[],
  ) {
    this.units = Array.from({ length: GROUND_COMBAT.sfSeats }, (_, id) => ({
      id,
      team: 'sf' as const,
      x: baseX + (id === 0 ? -24 : 24),
      facing: 1,
      state: 'waiting' as const,
      health: GROUND_COMBAT.soldierHealth,
      coverEndsAt: 0,
      nextFireAt: 0,
    }));
  }

  get sfAboard(): number {
    return this.units.filter((unit) =>
      unit.team === 'sf' && unit.state === 'aboard').length;
  }

  get sfDeployed(): number {
    return this.units.filter((unit) =>
      unit.team === 'sf' && ['deployed', 'cover'].includes(unit.state)).length;
  }

  get hostileAlive(): number {
    return this.units.filter((unit) =>
      unit.team === 'hostile' && unit.state !== 'dead').length;
  }

  triggerTruck(campX: number, time: number): boolean {
    if (this.truck) return false;
    const side = campX + 500 <= this.worldWidth - 50 ? 1 : -1;
    const exitX = campX + side * 500;
    this.truck = {
      x: exitX,
      destinationX: campX + side * 210,
      exitX,
      state: 'waiting',
      health: GROUND_COMBAT.truckHealth,
      nextActionAt: time + GROUND_COMBAT.truckSpawnDelayMs,
      unloaded: 0,
    };
    return true;
  }

  commandSf(helicopter: GroundHelicopter, time: number): boolean {
    if (!helicopter.active || !helicopter.isLanded) return false;
    const nearby = this.units.filter((unit) =>
      unit.team === 'sf' &&
      ['deployed', 'cover'].includes(unit.state) &&
      Math.abs(unit.x - helicopter.x) <= 95 &&
      isGroundPathClear(unit.x, helicopter.x, this.obstacles, 8),
    );
    if (nearby.length > 0) {
      for (const unit of nearby.slice(0, GROUND_COMBAT.sfSeats - this.sfAboard)) {
        unit.state = 'aboard';
        unit.x = helicopter.x;
      }
      return true;
    }
    if (this.sfAboard === 0 || helicopter.x < 650) return false;
    let offset = -70;
    for (const unit of this.units) {
      if (unit.team !== 'sf' || unit.state !== 'aboard') continue;
      unit.x = helicopter.x + offset;
      unit.state = 'deployed';
      unit.nextFireAt = time + 250;
      offset += 140;
    }
    return true;
  }

  onHelicopterDestroyed(x: number): void {
    let offset = -24;
    for (const unit of this.units) {
      if (unit.state !== 'aboard') continue;
      unit.state = 'deployed';
      unit.x = Math.max(20, Math.min(this.worldWidth - 20, x + offset));
      offset += 48;
    }
  }

  update(
    time: number,
    deltaMs: number,
    helicopter: GroundHelicopter,
    pows: readonly GroundPow[],
  ): GroundCombatEvent[] {
    const events: GroundCombatEvent[] = [];
    for (const unit of this.units) {
      if (unit.state === 'aboard') unit.x = helicopter.x;
      if (unit.state === 'waiting' && helicopter.active && helicopter.isLanded &&
        Math.abs(unit.x - helicopter.x) <= 150) {
        unit.state = 'aboard';
        unit.x = helicopter.x;
      }
      if (unit.state === 'cover' && time >= unit.coverEndsAt) {
        unit.state = unit.team === 'sf' ? 'deployed' : 'advancing';
      }
    }

    this.updateTruck(time, deltaMs, events);
    for (const unit of this.units) {
      if (unit.state !== 'deployed' && unit.state !== 'advancing') continue;
      if (unit.team === 'sf') {
        this.updateSf(unit, time, deltaMs, pows, events);
      } else {
        this.updateHostile(unit, time, deltaMs, pows, events);
      }
    }
    return events;
  }

  damageAt(x: number, y: number, damage: number, radius: number,
    time: number, targetTeam: GroundTeam = 'hostile'):
    { hit: boolean; events: GroundCombatEvent[] } {
    const events: GroundCombatEvent[] = [];
    let hit = false;
    const truck = this.truck;
    if (truck && ['approaching', 'unloading', 'retreating'].includes(truck.state) &&
      Math.hypot(x - truck.x, y - (GROUND_Y - 20)) <= radius + 37) {
      hit = true;
      truck.health = Math.max(0, truck.health - damage);
      if (truck.health === 0) {
        truck.state = 'destroyed';
        events.push({ type: 'truckDestroyed', x: truck.x });
      }
    }
    for (const unit of this.units) {
      if (unit.team !== targetTeam ||
        !['deployed', 'advancing', 'cover'].includes(unit.state) ||
        Math.hypot(x - unit.x, y - (GROUND_Y - 16)) > radius + 12) continue;
      hit = true;
      this.damageUnit(unit, damage, time, events);
    }
    return { hit, events };
  }

  private updateTruck(time: number, deltaMs: number,
    events: GroundCombatEvent[]): void {
    const truck = this.truck;
    if (!truck) return;
    if (truck.state === 'waiting' && time >= truck.nextActionAt) {
      truck.state = 'approaching';
    }
    if (truck.state === 'approaching') {
      truck.x = moveToward(truck.x, truck.destinationX,
        GROUND_COMBAT.truckSpeed, deltaMs);
      if (truck.x === truck.destinationX) {
        truck.state = 'unloading';
        truck.nextActionAt = time + GROUND_COMBAT.truckUnloadIntervalMs;
        events.push({ type: 'truckArrived', x: truck.x });
      }
    } else if (truck.state === 'unloading' && time >= truck.nextActionAt) {
      const offset = (truck.unloaded - 1) * 24;
      this.units.push({
        id: this.nextUnitId++,
        team: 'hostile',
        x: truck.x + offset,
        facing: truck.destinationX < truck.exitX ? -1 : 1,
        state: 'advancing',
        health: GROUND_COMBAT.hostileHealth,
        coverEndsAt: 0,
        nextFireAt: time + 1200,
      });
      truck.unloaded += 1;
      truck.nextActionAt = time + GROUND_COMBAT.truckUnloadIntervalMs;
      events.push({ type: 'hostilesUnloaded', x: truck.x });
      if (truck.unloaded >= GROUND_COMBAT.truckSoldiers) {
        truck.state = 'retreating';
      }
    } else if (truck.state === 'retreating') {
      truck.x = moveToward(truck.x, truck.exitX,
        GROUND_COMBAT.truckSpeed, deltaMs);
      if (truck.x === truck.exitX) truck.state = 'gone';
    }
  }

  private updateSf(unit: GroundUnit, time: number, deltaMs: number,
    pows: readonly GroundPow[], events: GroundCombatEvent[]): void {
    const enemy = this.nearestUnit(unit.x, 'hostile');
    if (enemy && Math.abs(enemy.x - unit.x) <= 390 &&
      isGroundPathClear(unit.x, enemy.x, this.obstacles, 8)) {
      unit.facing = enemy.x < unit.x ? -1 : 1;
      if (Math.abs(enemy.x - unit.x) > GROUND_COMBAT.soldierRange - 15) {
        unit.x = this.walk(unit.x, enemy.x, deltaMs);
      } else if (time >= unit.nextFireAt) {
        unit.nextFireAt = time + GROUND_COMBAT.soldierFireCooldownMs;
        events.push({ type: 'shot', fromX: unit.x, toX: enemy.x, friendly: true });
        this.damageUnit(enemy, 1, time, events);
      }
      return;
    }
    const pow = nearestPow(unit.x, pows);
    if (pow && Math.abs(pow.x - unit.x) > 110 &&
      isGroundPathClear(unit.x, pow.x, this.obstacles, 8)) {
      unit.facing = pow.x < unit.x ? -1 : 1;
      unit.x = this.walk(unit.x, pow.x, deltaMs);
    }
  }

  private updateHostile(unit: GroundUnit, time: number, deltaMs: number,
    pows: readonly GroundPow[], events: GroundCombatEvent[]): void {
    const sf = this.nearestUnit(unit.x, 'sf');
    const nearbySf = sf && Math.abs(sf.x - unit.x) <= GROUND_COMBAT.soldierRange &&
      isGroundPathClear(unit.x, sf.x, this.obstacles, 8) ? sf : null;
    const pow = nearestPow(unit.x, pows);
    const targetX = nearbySf?.x ?? pow?.x;
    if (targetX === undefined ||
      !isGroundPathClear(unit.x, targetX, this.obstacles, 8)) return;
    unit.facing = targetX < unit.x ? -1 : 1;
    if (Math.abs(targetX - unit.x) > GROUND_COMBAT.soldierRange - 20) {
      unit.x = this.walk(unit.x, targetX, deltaMs);
      return;
    }
    if (time < unit.nextFireAt) return;
    unit.nextFireAt = time + GROUND_COMBAT.hostileFireCooldownMs;
    events.push({ type: 'shot', fromX: unit.x, toX: targetX, friendly: false });
    if (nearbySf) this.damageUnit(nearbySf, 1, time, events);
    else if (pow) events.push({ type: 'powHit', powId: pow.id });
  }

  private nearestUnit(x: number, team: GroundTeam): GroundUnit | null {
    return this.units.filter((unit) => unit.team === team &&
      (unit.state === 'deployed' || unit.state === 'advancing'))
      .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x) || a.id - b.id)[0]
      ?? null;
  }

  private walk(x: number, targetX: number, deltaMs: number): number {
    const nextX = moveToward(x, targetX, GROUND_COMBAT.soldierSpeed, deltaMs);
    return isGroundPathClear(x, nextX, this.obstacles, 8)
      ? Math.max(20, Math.min(this.worldWidth - 20, nextX)) : x;
  }

  private damageUnit(unit: GroundUnit, amount: number, time: number,
    events: GroundCombatEvent[]): void {
    if (unit.state === 'dead') return;
    unit.health = Math.max(0, unit.health - amount);
    if (unit.health === 0) {
      unit.state = 'dead';
      events.push({ type: unit.team === 'sf' ? 'sfKilled' : 'hostileKilled',
        x: unit.x });
    } else {
      unit.state = 'cover';
      unit.coverEndsAt = time + GROUND_COMBAT.coverMs;
    }
  }
}

function nearestPow(x: number, pows: readonly GroundPow[]): GroundPow | null {
  return [...pows].sort((a, b) =>
    Math.abs(a.x - x) - Math.abs(b.x - x) || a.id - b.id)[0] ?? null;
}

function moveToward(x: number, targetX: number, speed: number,
  deltaMs: number): number {
  const distance = targetX - x;
  const step = Math.min(Math.abs(distance), speed * deltaMs / 1000);
  return x + Math.sign(distance) * step;
}
