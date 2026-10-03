import {
  MISSION,
  PRISON_CAMP,
  WORLD_WIDTH,
} from '../constants';

export interface FlightObstacleConfig {
  x: number;
  width: number;
  height: number;
}

export interface LevelEnvironment {
  skyBands: readonly [number, number, number, number];
  distantMountainTint: number;
  farRidgeTint: number;
  nearRidgeTint: number;
  groundTint: number;
  obstacleColor: number;
  obstacleEdgeColor: number;
  cloudAlpha: readonly [number, number];
  cloudSpacing: readonly [number, number];
  night: boolean;
}

export interface LevelConfig {
  id: string;
  name: string;
  difficultyLabel: string;
  difficultyRank: number;
  worldWidth: number;
  rescueTarget: number;
  campPositions: readonly number[];
  tankPositions: readonly number[];
  aaPositions: readonly number[];
  samPositions: readonly number[];
  groundCombat?: boolean;
  fuelCapacityMs?: number;
  wind?: {
    acceleration: number;
    maximumDriftSpeed: number;
    dustColor: number;
  };
  jetInitialSpawnDelayMs: number;
  jetSpawnIntervalMs: number;
  flightObstacles: readonly FlightObstacleConfig[];
  environment: LevelEnvironment;
}

export const LEVELS: readonly LevelConfig[] = [
  {
    id: 'green-valley',
    name: 'GREEN VALLEY',
    difficultyLabel: 'STANDARD',
    difficultyRank: 1,
    worldWidth: WORLD_WIDTH,
    rescueTarget: MISSION.rescueTarget,
    campPositions: PRISON_CAMP.positions,
    tankPositions: [1500],
    aaPositions: [],
    samPositions: [],
    jetInitialSpawnDelayMs: 5000,
    jetSpawnIntervalMs: 15000,
    flightObstacles: [],
    environment: {
      skyBands: [0x17241f, 0x1d2d25, 0x25372b, 0x304331],
      distantMountainTint: 0xffffff,
      farRidgeTint: 0x4a5838,
      nearRidgeTint: 0xffffff,
      groundTint: 0xffffff,
      obstacleColor: 0x46543d,
      obstacleEdgeColor: 0x71805d,
      cloudAlpha: [0.2, 0.34],
      cloudSpacing: [380, 620],
      night: false,
    },
  },
  {
    id: 'highland-pass',
    name: 'HIGHLAND PASS',
    difficultyLabel: 'HARD',
    difficultyRank: 2,
    worldWidth: 3600,
    rescueTarget: 20,
    campPositions: [2100, 2800, 3400],
    tankPositions: [1420, 2520],
    aaPositions: [],
    samPositions: [],
    jetInitialSpawnDelayMs: 4000,
    jetSpawnIntervalMs: 12000,
    flightObstacles: [
      { x: 1040, width: 320, height: 175 },
      { x: 1840, width: 240, height: 130 },
      { x: 3160, width: 250, height: 155 },
    ],
    environment: {
      skyBands: [0x25262b, 0x343238, 0x51453e, 0x6a5542],
      distantMountainTint: 0x9a8068,
      farRidgeTint: 0x544d42,
      nearRidgeTint: 0x5f593f,
      groundTint: 0x8b7653,
      obstacleColor: 0x5a5144,
      obstacleEdgeColor: 0xb19a70,
      cloudAlpha: [0.24, 0.4],
      cloudSpacing: [310, 500],
      night: false,
    },
  },
  {
    id: 'black-ridge',
    name: 'BLACK RIDGE',
    difficultyLabel: 'VETERAN',
    difficultyRank: 3,
    worldWidth: 4200,
    rescueTarget: 24,
    campPositions: [2200, 2850, 3500, 4050],
    tankPositions: [1450, 2650, 3850],
    aaPositions: [],
    samPositions: [],
    jetInitialSpawnDelayMs: 2500,
    jetSpawnIntervalMs: 9000,
    flightObstacles: [
      { x: 1020, width: 350, height: 210 },
      { x: 1850, width: 300, height: 165 },
      { x: 3200, width: 280, height: 225 },
    ],
    environment: {
      skyBands: [0x090f18, 0x101928, 0x172437, 0x213047],
      distantMountainTint: 0x52627a,
      farRidgeTint: 0x27354a,
      nearRidgeTint: 0x34445b,
      groundTint: 0x526071,
      obstacleColor: 0x29384c,
      obstacleEdgeColor: 0x8fa9bd,
      cloudAlpha: [0.12, 0.22],
      cloudSpacing: [260, 430],
      night: true,
    },
  },
  {
    id: 'copper-gorge',
    name: 'COPPER GORGE',
    difficultyLabel: 'FLAK RUN',
    difficultyRank: 4,
    worldWidth: 3800,
    rescueTarget: 18,
    campPositions: [2150, 2900, 3500],
    tankPositions: [3230],
    aaPositions: [1650],
    samPositions: [],
    jetInitialSpawnDelayMs: 7000,
    jetSpawnIntervalMs: 16000,
    flightObstacles: [
      { x: 1200, width: 320, height: 170 },
      { x: 2600, width: 230, height: 135 },
    ],
    environment: {
      skyBands: [0x222d30, 0x344343, 0x6a5e4e, 0x8f7254],
      distantMountainTint: 0xb79a73,
      farRidgeTint: 0x67523e,
      nearRidgeTint: 0x6f5943,
      groundTint: 0xb28a61,
      obstacleColor: 0x71543e,
      obstacleEdgeColor: 0xd0a875,
      cloudAlpha: [0.14, 0.27],
      cloudSpacing: [380, 640],
      night: false,
    },
  },
  {
    id: 'sable-reach',
    name: 'SABLE REACH',
    difficultyLabel: 'MISSILE RUN',
    difficultyRank: 5,
    worldWidth: 3900,
    rescueTarget: 18,
    campPositions: [2150, 2900, 3550],
    tankPositions: [],
    aaPositions: [],
    samPositions: [1690],
    wind: {
      acceleration: -30,
      maximumDriftSpeed: 40,
      dustColor: 0xc7c395,
    },
    jetInitialSpawnDelayMs: 8000,
    jetSpawnIntervalMs: 18000,
    flightObstacles: [
      { x: 1160, width: 300, height: 165 },
      { x: 2650, width: 230, height: 130 },
    ],
    environment: {
      skyBands: [0x233a3b, 0x365658, 0x69736a, 0x9b9272],
      distantMountainTint: 0xb2aa88,
      farRidgeTint: 0x586b61,
      nearRidgeTint: 0x697a64,
      groundTint: 0xa4a078,
      obstacleColor: 0x67715b,
      obstacleEdgeColor: 0xc7c395,
      cloudAlpha: [0.13, 0.24],
      cloudSpacing: [400, 680],
      night: false,
    },
  },
  {
    id: 'dustline-hold',
    name: 'DUSTLINE HOLD',
    difficultyLabel: 'GROUND DEFENSE',
    difficultyRank: 6,
    worldWidth: 3600,
    rescueTarget: 14,
    campPositions: [1700, 2450, 3200],
    tankPositions: [],
    aaPositions: [],
    samPositions: [],
    groundCombat: true,
    fuelCapacityMs: 55_000,
    wind: {
      acceleration: 30,
      maximumDriftSpeed: 40,
      dustColor: 0xe4d2a7,
    },
    jetInitialSpawnDelayMs: 60000,
    jetSpawnIntervalMs: 30000,
    flightObstacles: [],
    environment: {
      skyBands: [0x253238, 0x3d5050, 0x797561, 0xa89a70],
      distantMountainTint: 0xc0ae83,
      farRidgeTint: 0x6b7560,
      nearRidgeTint: 0x7b8163,
      groundTint: 0xb2a477,
      obstacleColor: 0x6b7557,
      obstacleEdgeColor: 0xd3c292,
      cloudAlpha: [0.1, 0.2],
      cloudSpacing: [400, 680],
      night: false,
    },
  },
] as const;

export function getLevelIndex(levelIndex: number): number {
  return Number.isFinite(levelIndex)
    ? Math.min(Math.max(Math.floor(levelIndex), 0), LEVELS.length - 1)
    : 0;
}

export function getLevelConfig(levelIndex: number): LevelConfig {
  return LEVELS[getLevelIndex(levelIndex)] ?? LEVELS[0]!;
}

export function getNextLevelIndex(levelIndex: number): number | null {
  const nextIndex = Math.floor(levelIndex) + 1;
  return nextIndex >= 0 && nextIndex < LEVELS.length ? nextIndex : null;
}
