export type FacilityMode = 'entrance' | 'maze' | 'dorokei'

export type FacilitySurface =
  | 'entranceLayer'
  | 'sharedFloor'
  | 'sharedSkybox'
  | 'eventWalls'
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
  entranceLayer: boolean
  sharedFloor: true
  sharedSkybox: true
  eventWalls: boolean
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
  'entranceLayer',
  'sharedFloor',
  'sharedSkybox',
  'eventWalls',
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
  return value === 'entrance' || value === 'maze' || value === 'dorokei'
}

export function getFacilityVisibility(mode: FacilityMode): FacilityVisibility {
  return {
    mode,
    entranceLayer: mode === 'entrance',
    sharedFloor: true,
    sharedSkybox: true,
    eventWalls: mode !== 'entrance',
    modeBoard: mode === 'entrance',
    briefingBoard: mode === 'maze',
    rosterBoard: mode === 'dorokei',
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

export function shouldShowEntranceLayer(mode: FacilityMode): boolean {
  return mode === 'entrance'
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
