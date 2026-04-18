export type Triple = [number, number, number]

export type DorokeiRole = 'chaser' | 'runner'

export type DorokeiPhase = 'lobby' | 'running' | 'ended'

export type DorokeiLocalStatus = 'spectator' | 'chaser' | 'runner' | 'jailed'

export type DorokeiActionSource = 'touch' | 'menu' | 'system'

export interface DorokeiJailState {
  jailed: boolean
  jailedAt: number | null
  releasedAt: number | null
  capturedByUserId: string | null
  releasedByUserId: string | null
  lastUpdatedAt: number
}

export interface DorokeiCaptureEvent {
  capturedAt: number
  capturedByUserId: string
  targetUserId: string
  distance: number
  source: DorokeiActionSource
}

export interface DorokeiRescueEvent {
  rescuedAt: number
  rescuedByUserId: string
  rescuedUserIds: string[]
  mode: 'single' | 'all'
  source: DorokeiActionSource
}

export interface DorokeiGameState {
  phase: DorokeiPhase
  roundStartedAt: number | null
  roundEndedAt: number | null
  lastResetAt: number | null
  policeTargetCount: number
  rolesByUserId: Record<string, DorokeiRole>
  jailedByUserId: Record<string, DorokeiJailState>
  lastCaptureAt: number | null
  lastRescueAt: number | null
  lastCapture: DorokeiCaptureEvent | null
  lastRescue: DorokeiRescueEvent | null
}

export interface DorokeiCounts {
  connectedUsers: number
  chasers: number
  runners: number
  freeRunners: number
  jailedRunners: number
}

export interface DorokeiParticipant {
  userId: string
  displayName: string
  role: DorokeiRole | null
  jailed: boolean
  isLocal: boolean
}

export interface DorokeiRadarContact {
  userId: string
  displayName: string
  role: DorokeiRole
  jailed: boolean
  distance: number
  angleRadians: number
  angleDegrees: number
  worldOffset: Triple
  localOffset: Triple
  normalizedDistance: number
}

export interface DorokeiRadarSnapshot {
  visible: boolean
  cycleMs: number
  visibleMs: number
  range: number
  localPosition: Triple
  localForward: { x: number; z: number }
  localYawRadians: number
  contacts: DorokeiRadarContact[]
}

export interface DorokeiGameRuntime {
  state: DorokeiGameState
  phase: DorokeiPhase
  localRole: DorokeiRole | null
  localStatus: DorokeiLocalStatus
  localJail: DorokeiJailState | null
  localUserId: string | null
  counts: DorokeiCounts
  canStartRound: boolean
  radar: DorokeiRadarSnapshot
}

export const DOROKEI_INSTANCE_STATE_ID = 'maze-world-dorokei-state'

export const DOROKEI_JAIL_SPAWN: Triple = [9.35, 0, 16.85]

export const DOROKEI_RELEASE_SPAWN: Triple = [3.5, 0, 17.4]

export const DOROKEI_LOBBY_SPAWN: Triple = [0, 0, 17.5]

export const CAPTURE_RADIUS = 0.75

export const RESCUE_RADIUS = 0.75

export const DOROKEI_CAPTURE_RADIUS = CAPTURE_RADIUS

export const DOROKEI_RESCUE_RADIUS = RESCUE_RADIUS

export const RADAR_CYCLE_MS = 60_000

export const RADAR_VISIBLE_MS = 10_000

export const DOROKEI_RADAR_PERIOD_MS = RADAR_CYCLE_MS

export const DOROKEI_RADAR_VISIBLE_MS = RADAR_VISIBLE_MS

export const DOROKEI_ACTION_COOLDOWN_MS = 1_000

export const DOROKEI_JAIL_RETURN_RADIUS = 3.4

export const DOROKEI_JAIL_RETURN_COOLDOWN_MS = 1_500

export const RADAR_RANGE = 28

export function createInitialDorokeiGameState(): DorokeiGameState {
  return {
    phase: 'lobby',
    roundStartedAt: null,
    roundEndedAt: null,
    lastResetAt: null,
    policeTargetCount: 1,
    rolesByUserId: {},
    jailedByUserId: {},
    lastCaptureAt: null,
    lastRescueAt: null,
    lastCapture: null,
    lastRescue: null,
  }
}
