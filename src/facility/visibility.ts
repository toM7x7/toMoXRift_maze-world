export type FacilityMode = 'maze' | 'dorokei'

export type FacilitySurface =
  | 'sharedFloor'
  | 'sharedSkybox'
  | 'sharedWalls'
  | 'modeBoard'
  | 'briefingBoard'
  | 'rosterBoard'
  | 'mazeObjectives'
  | 'mazeClearLog'
  | 'dorokeiLayer'
  | 'overheadScoreboard'
  | 'adminArea'
  | 'debugTools'

export interface FacilityVisibility {
  mode: FacilityMode
  sharedFloor: true
  sharedSkybox: true
  sharedWalls: true
  modeBoard: boolean
  briefingBoard: boolean
  rosterBoard: boolean
  mazeObjectives: boolean
  mazeClearLog: boolean
  dorokeiLayer: boolean
  overheadScoreboard: boolean
  adminArea: boolean
  debugTools: boolean
}

export const FACILITY_SURFACES: readonly FacilitySurface[] = [
  'sharedFloor',
  'sharedSkybox',
  'sharedWalls',
  'modeBoard',
  'briefingBoard',
  'rosterBoard',
  'mazeObjectives',
  'mazeClearLog',
  'dorokeiLayer',
  'overheadScoreboard',
  'adminArea',
  'debugTools',
] as const

export function isFacilityMode(value: string): value is FacilityMode {
  return value === 'maze' || value === 'dorokei'
}

export function getFacilityVisibility(mode: FacilityMode): FacilityVisibility {
  return {
    mode,
    sharedFloor: true,
    sharedSkybox: true,
    sharedWalls: true,
    modeBoard: true,
    briefingBoard: mode === 'maze',
    rosterBoard: true,
    mazeObjectives: mode === 'maze',
    mazeClearLog: mode === 'maze',
    dorokeiLayer: mode === 'dorokei',
    overheadScoreboard: mode === 'dorokei',
    adminArea: false,
    debugTools: false,
  }
}

export function shouldShowFacilitySurface(
  mode: FacilityMode,
  surface: FacilitySurface,
): boolean {
  const visibility = getFacilityVisibility(mode)
  return visibility[surface]
}

export function shouldShowMazeObjectives(mode: FacilityMode): boolean {
  return mode === 'maze'
}

export function shouldShowDorokeiLayer(mode: FacilityMode): boolean {
  return mode === 'dorokei'
}

export function shouldShowOverheadScoreboard(mode: FacilityMode): boolean {
  return mode === 'dorokei'
}

export function shouldShowAdminArea(): boolean {
  return false
}

