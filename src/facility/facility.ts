export type FacilityMode = 'maze' | 'dorokei'

export const FACILITY_MODES = ['maze', 'dorokei'] as const

export type BeaconKey = 'a' | 'b' | 'c'
export type Vec3 = readonly [number, number, number]

export interface WallSpec {
  position: Vec3
  size: Vec3
  color?: string
}

export interface BeaconConfig {
  key: BeaconKey
  label: string
  color: string
  position: Vec3
}

export interface BoardPlacement {
  position: Vec3
  rotation: Vec3
  scale: number
}

export interface FacilityMetrics {
  touchRadiusMeters: number
  radarPeriodMs: number
  radarVisibleMs: number
  actionCooldownMs: number
  mainCorridorWidthMeters: number
  chaseCorridorMinWidthMeters: number
  crossroadWidthMeters: number
  waitingSightlineMeters: [number, number]
  mazeSightlineMeters: [number, number]
}

export const FACILITY_COLORS = {
  background: '#0a1020',
  fog: '#070b12',
  floor: '#131b2c',
  outerWall: '#353c4e',
  goalWall: '#4a4530',
  redSector: '#571616',
  blueSector: '#1d274f',
  greenSector: '#1a4f2c',
  graySector: '#2e3542',
  sky: '#071328',
  skyRing: '#1d4ed8',
  moon: '#fef3c7',
  starCold: '#bfdbfe',
  starWarm: '#f8fafc',
  beaconRed: '#e74c3c',
  beaconBlue: '#3498db',
  beaconGreen: '#2ecc71',
} as const

export const FACILITY_METRICS: FacilityMetrics = {
  touchRadiusMeters: 0.75,
  radarPeriodMs: 60_000,
  radarVisibleMs: 10_000,
  actionCooldownMs: 1_000,
  mainCorridorWidthMeters: 3.2,
  chaseCorridorMinWidthMeters: 2.6,
  crossroadWidthMeters: 4.0,
  waitingSightlineMeters: [12, 18],
  mazeSightlineMeters: [6, 10],
}

export const FACILITY_SPAWN = {
  position: [0, 0, 17.5] as const,
  yaw: 0,
} as const

export const FACILITY_BOUNDS = {
  floorCenter: [0, 0, -2] as const,
  floorSize: [60, 60] as const,
  outer: {
    xMin: -22,
    xMax: 22,
    zMin: -24,
    zMax: 20,
  },
  inner: {
    xMin: -21.5,
    xMax: 21.5,
    zMin: -23.5,
    zMax: 19.5,
  },
  gatehouse: {
    xMin: -18,
    xMax: 18,
    zMin: 13.5,
    zMax: 19.5,
  },
  threshold: {
    xMin: -18,
    xMax: 18,
    zMin: 10,
    zMax: 14,
  },
  maze: {
    xMin: -20,
    xMax: 20,
    zMin: -14,
    zMax: 12,
  },
  pressureBand: {
    xMin: -18,
    xMax: 18,
    zMin: -20,
    zMax: -14,
  },
  jail: {
    xMin: 14,
    xMax: 20,
    zMin: -6,
    zMax: 2,
  },
  admin: [0, -6, 38] as const,
  scoreboard: [0, 7.5, -2] as const,
} as const

export const FACILITY_BOARDS = {
  mode: {
    position: [-21.42, 1.7, 14.4] as const,
    rotation: [0, Math.PI / 2, 0] as const,
    scale: 0.34,
  },
  roster: {
    position: [21.42, 2.55, 9.6] as const,
    rotation: [0, -Math.PI / 2, 0] as const,
    scale: 0.34,
  },
  briefing: {
    position: [0, 2.2, 13.2] as const,
    rotation: [0, 0, 0] as const,
    scale: 1,
  },
  scoreboard: {
    position: [0, 7.5, -2] as const,
    rotation: [0, 0, 0] as const,
    scale: 1,
  },
  debug: {
    position: [0, -6, 38] as const,
    rotation: [0, 0, 0] as const,
    scale: 1,
  },
} as const satisfies Record<string, BoardPlacement>

export const FACILITY_BEACONS: Record<BeaconKey, BeaconConfig> = {
  a: {
    key: 'a',
    label: 'ビーコンA',
    color: FACILITY_COLORS.beaconRed,
    position: [-15, 0.6, 8],
  },
  b: {
    key: 'b',
    label: 'ビーコンB',
    color: FACILITY_COLORS.beaconBlue,
    position: [1, 0.6, -5],
  },
  c: {
    key: 'c',
    label: 'ビーコンC',
    color: FACILITY_COLORS.beaconGreen,
    position: [15, 0.6, -12],
  },
}

export const FACILITY_WALLS = {
  outer: [
    { position: [0, 1.5, 20], size: [44, 3, 1], color: FACILITY_COLORS.outerWall },
    { position: [0, 1.5, -24], size: [44, 3, 1], color: FACILITY_COLORS.outerWall },
    { position: [-22, 1.5, -2], size: [1, 3, 44], color: FACILITY_COLORS.outerWall },
    { position: [22, 1.5, -2], size: [1, 3, 44], color: FACILITY_COLORS.outerWall },
    { position: [-6, 1.5, 12], size: [4, 3, 1], color: FACILITY_COLORS.outerWall },
    { position: [6, 1.5, 12], size: [4, 3, 1], color: FACILITY_COLORS.outerWall },
    { position: [-12, 1.5, 16], size: [1, 3, 8], color: FACILITY_COLORS.outerWall },
    { position: [12, 1.5, 16], size: [1, 3, 8], color: FACILITY_COLORS.outerWall },
  ] as const satisfies readonly WallSpec[],
  maze: [
    { position: [-10, 1.5, 1], size: [1, 3, 18], color: FACILITY_COLORS.redSector },
    { position: [-2, 1.5, -2], size: [1, 3, 20], color: FACILITY_COLORS.blueSector },
    { position: [6, 1.5, 1], size: [1, 3, 18], color: FACILITY_COLORS.greenSector },
    { position: [14, 1.5, -3], size: [1, 3, 22], color: FACILITY_COLORS.graySector },
    { position: [-12, 1.5, 6], size: [12, 3, 1], color: FACILITY_COLORS.redSector },
    { position: [-1, 1.5, 2], size: [10, 3, 1], color: FACILITY_COLORS.blueSector },
    { position: [11, 1.5, -2], size: [14, 3, 1], color: FACILITY_COLORS.greenSector },
    { position: [-11, 1.5, -6], size: [14, 3, 1], color: FACILITY_COLORS.redSector },
    { position: [4, 1.5, -10], size: [16, 3, 1], color: FACILITY_COLORS.blueSector },
    { position: [15, 1.5, -14], size: [6, 3, 1], color: FACILITY_COLORS.greenSector },
    { position: [-9, 1.5, -14], size: [18, 3, 1], color: FACILITY_COLORS.graySector },
    { position: [0, 1.5, -16], size: [34, 3, 1], color: FACILITY_COLORS.graySector },
  ] as const satisfies readonly WallSpec[],
  goal: [
    { position: [-8, 1.5, -20], size: [1, 3, 8], color: FACILITY_COLORS.goalWall },
    { position: [8, 1.5, -20], size: [1, 3, 8], color: FACILITY_COLORS.goalWall },
    { position: [0, 1.5, -24], size: [16, 3, 1], color: FACILITY_COLORS.goalWall },
  ] as const satisfies readonly WallSpec[],
} as const

export const FACILITY_CLEAR_LOG_LIMIT = 5
export const FACILITY_GATE_OPEN_MS = 20_000
export const FACILITY_DEFAULT_POLICE_COUNT = 1
