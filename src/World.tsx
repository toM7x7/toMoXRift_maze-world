import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import {
  EntryLogBoard,
  Interactable,
  SpawnPoint,
  TagBoard,
  useInstanceState,
  useTeleport,
} from '@xrift/world-components'
import { DorokeiControlLayer } from './dorokei/DorokeiControlLayer'
import {
  FACILITY_BEACONS,
  FACILITY_BOARDS,
  FACILITY_CLEAR_LOG_LIMIT,
  FACILITY_COLORS,
  FACILITY_GATE_OPEN_MS,
  FACILITY_SPAWN,
  FACILITY_WALLS,
  type BeaconKey,
  type FacilityMode,
} from './facility/facility'
import { BriefingBoard } from './facility/BriefingBoard'
import { ModeSelectorBoard } from './facility/ModeSelectorBoard'
import { Skybox } from './facility/Skybox'
import { Wall } from './facility/Wall'
import { getFacilityVisibility } from './facility/visibility'

type WorldMode = FacilityMode

interface MazeRunState {
  beacons: Record<BeaconKey, boolean>
  gateOpen: boolean
  gateOpenedAt: number | null
  runStartedAt: number | null
  completedAt: number | null
}

interface ClearResult {
  durationMs: number
  recordedAt: number
}

export interface WorldProps {
  position?: [number, number, number]
  scale?: number
}

const INITIAL_RUN_STATE: MazeRunState = {
  beacons: { a: false, b: false, c: false },
  gateOpen: false,
  gateOpenedAt: null,
  runStartedAt: null,
  completedAt: null,
}

const TAGS = [
  { id: 'scout', label: '先導', color: '#ef4444' },
  { id: 'caller', label: '合図', color: '#3b82f6' },
  { id: 'runner', label: '走者', color: '#22c55e' },
  { id: 'replay', label: '再挑戦', color: '#f59e0b' },
]

const HUB_SPAWN = [...FACILITY_SPAWN.position] as [number, number, number]
const HUB_YAW = FACILITY_SPAWN.yaw

interface BeaconSwitchProps {
  beacon: BeaconKey
  activated: boolean
  onActivate: (beacon: BeaconKey) => void
}

function BeaconSwitch({ beacon, activated, onActivate }: BeaconSwitchProps) {
  const config = FACILITY_BEACONS[beacon]

  return (
    <group position={[...config.position]}>
      <Interactable
        id={`echo-maze-${beacon}`}
        interactionText={activated ? `${config.label}は起動済み` : `${config.label}を起動`}
        onInteract={() => onActivate(beacon)}
        enabled={!activated}
      >
        <RigidBody type="fixed" colliders="cuboid">
          <mesh castShadow>
            <boxGeometry args={[1.1, 1.2, 1.1]} />
            <meshStandardMaterial
              color={activated ? '#f9fafb' : config.color}
              emissive={activated ? config.color : '#101010'}
              emissiveIntensity={activated ? 1.3 : 0.25}
            />
          </mesh>
        </RigidBody>
      </Interactable>
      <Text
        position={[0, 1.15, 0]}
        color={activated ? '#f8fafc' : '#d1d5db'}
        fontSize={0.3}
        anchorX="center"
        anchorY="middle"
      >
        {activated ? `${config.label} 起動` : config.label}
      </Text>
    </group>
  )
}

function formatDuration(ms: number): string {
  const seconds = (ms / 1000).toFixed(2)
  return `${seconds}s`
}

function HubGuide({
  position,
  color,
  label,
}: {
  position: [number, number, number]
  color: string
  label: string
}) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 4.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={0.22} />
      </mesh>
      <Text position={[0, 0.08, 0]} fontSize={0.28} color="#f8fafc" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

export function World({ position = [0, 0, 0], scale = 1 }: WorldProps) {
  const { teleport } = useTeleport()
  const [runState, setRunState] = useInstanceState<MazeRunState>(
    'echo-maze-run-state',
    INITIAL_RUN_STATE,
  )
  const [clearResults, setClearResults] = useInstanceState<ClearResult[]>(
    'echo-maze-clear-results',
    [],
  )
  const [worldMode, setWorldMode] = useInstanceState<WorldMode>(
    'echo-maze-world-mode',
    'maze',
  )
  const [now, setNow] = useState(() => Date.now())
  const didTeleportOnMountRef = useRef(false)
  const facilityVisibility = getFacilityVisibility(worldMode)

  const isMazeMode = facilityVisibility.mazeObjectives
  const isDorokeiMode = facilityVisibility.dorokeiLayer
  const showLabyrinthWalls = facilityVisibility.sharedWalls
  const allBeaconsOn = runState.beacons.a && runState.beacons.b && runState.beacons.c
  const gateTimeLeftMs = runState.gateOpen && runState.gateOpenedAt
    ? Math.max(0, FACILITY_GATE_OPEN_MS - (now - runState.gateOpenedAt))
    : 0

  useEffect(() => {
    if (didTeleportOnMountRef.current) {
      return
    }

    didTeleportOnMountRef.current = true
    const timeoutId = window.setTimeout(() => {
      teleport({ position: HUB_SPAWN, yaw: HUB_YAW })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [teleport])

  useEffect(() => {
    if (!runState.gateOpen) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 200)

    return () => window.clearInterval(intervalId)
  }, [runState.gateOpen])

  useEffect(() => {
    if (!runState.gateOpen || runState.gateOpenedAt === null) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setRunState((current) => {
        if (!current.gateOpen || current.gateOpenedAt === null) {
          return current
        }

        if (Date.now() - current.gateOpenedAt < FACILITY_GATE_OPEN_MS) {
          return current
        }

        return INITIAL_RUN_STATE
      })
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [runState.gateOpen, runState.gateOpenedAt, setRunState])

  const activateBeacon = (beacon: BeaconKey) => {
    setRunState((current) => {
      if (current.beacons[beacon]) {
        return current
      }

      const beacons = { ...current.beacons, [beacon]: true }
      const shouldOpenGate = beacons.a && beacons.b && beacons.c
      const runStartedAt = current.runStartedAt ?? Date.now()

      if (!shouldOpenGate) {
        return { ...current, beacons, runStartedAt }
      }

      return {
        ...current,
        beacons,
        gateOpen: true,
        gateOpenedAt: Date.now(),
        runStartedAt,
      }
    })
  }

  const resetRun = () => {
    if (runState.completedAt === null) {
      return
    }

    setRunState(INITIAL_RUN_STATE)
    teleport({ position: HUB_SPAWN, yaw: HUB_YAW })
  }

  const selectWorldMode = (nextMode: WorldMode) => {
    setWorldMode(nextMode)

    if (nextMode === 'maze') {
      setRunState(INITIAL_RUN_STATE)
    }
  }

  const registerClear = () => {
    if (!runState.gateOpen || runState.gateOpenedAt === null) {
      return
    }

    const nowMs = Date.now()
    let durationMs: number | null = null

    setRunState((current) => {
      if (!current.gateOpen || current.gateOpenedAt === null || current.completedAt !== null) {
        return current
      }

      const startedAt = current.runStartedAt ?? current.gateOpenedAt
      durationMs = Math.max(0, nowMs - startedAt)

      return {
        ...current,
        completedAt: nowMs,
      }
    })

    if (durationMs === null) {
      return
    }

    const recordedDuration = durationMs

    setClearResults((current) => {
      const next = [{ durationMs: recordedDuration, recordedAt: nowMs }, ...current]
      return next.slice(0, FACILITY_CLEAR_LOG_LIMIT)
    })
  }

  const latestClear = clearResults[0]
  const activatedBeaconCount = Number(runState.beacons.a) + Number(runState.beacons.b) + Number(runState.beacons.c)
  const mazeProgressText = runState.completedAt
    ? `クリア: ${latestClear ? formatDuration(latestClear.durationMs) : 'ゴール到達'}`
    : runState.gateOpen
      ? `ゲート開放: 残り ${(gateTimeLeftMs / 1000).toFixed(1)}秒`
      : allBeaconsOn
        ? 'ゲート起動中...'
        : `ビーコン: ${activatedBeaconCount} / 3`

  return (
    <group position={position} scale={scale}>
      <color attach="background" args={[FACILITY_COLORS.background]} />
      <fog attach="fog" args={[FACILITY_COLORS.fog, 14, 64]} />
      <Skybox />

      <ambientLight intensity={0.62} />
      <directionalLight
        position={[12, 22, 6]}
        intensity={1.45}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 5.5, 15.5]} intensity={36} distance={28} color="#f8fafc" />
      <pointLight position={[-8.5, 3.5, 13.5]} intensity={14} distance={12} color="#ef4444" />
      <pointLight position={[0, 3.5, 12.6]} intensity={14} distance={12} color="#60a5fa" />
      <pointLight position={[8.5, 3.5, 13.5]} intensity={14} distance={12} color="#22c55e" />

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={FACILITY_COLORS.floor} />
        </mesh>
      </RigidBody>

      <SpawnPoint position={HUB_SPAWN} yaw={HUB_YAW} />
      <ModeSelectorBoard
        title="ワールドモード"
        subtitle="切替しても現在位置は保持"
        options={[
          { id: 'maze', label: '迷路', description: 'ビーコン攻略', accentColor: '#2563eb' },
          { id: 'dorokei', label: 'ドロケイ', description: '警察と泥棒', accentColor: '#dc2626' },
        ]}
        activeOptionId={worldMode}
        onSelectOption={(nextMode) => selectWorldMode(nextMode as WorldMode)}
        interactionText={(option) => `${option.label}に切り替え`}
        position={[...FACILITY_BOARDS.mode.position]}
        rotation={[...FACILITY_BOARDS.mode.rotation]}
        scale={FACILITY_BOARDS.mode.scale}
      />

      {FACILITY_WALLS.outer.map((wall, index) => (
        <Wall key={`outer-${index}`} {...wall} />
      ))}
      {showLabyrinthWalls && FACILITY_WALLS.maze.map((wall, index) => (
        <Wall key={`maze-${index}`} {...wall} />
      ))}
      {isMazeMode && (
        <>
          {FACILITY_WALLS.goal.map((wall, index) => (
            <Wall key={`goal-${index}`} {...wall} />
          ))}

          <HubGuide position={[-8.6, 0.03, 14.6]} color="#7f1d1d" label="A 左" />
          <HubGuide position={[0, 0.03, 12.9]} color="#1d4ed8" label="B 中央" />
          <HubGuide position={[8.6, 0.03, 14.6]} color="#166534" label="C 右" />

          {!runState.gateOpen && (
            <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
              <mesh position={[0, 1.5, -16]} castShadow>
                <boxGeometry args={[6, 3, 0.8]} />
                <meshStandardMaterial color="#9a3412" emissive="#4a1d0f" emissiveIntensity={0.5} />
              </mesh>
            </RigidBody>
          )}

          <RigidBody type="fixed" sensor onIntersectionEnter={registerClear}>
            <mesh position={[0, 1, -20]}>
              <boxGeometry args={[7, 2, 5]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          </RigidBody>

          <BeaconSwitch beacon="a" activated={runState.beacons.a} onActivate={activateBeacon} />
          <BeaconSwitch beacon="b" activated={runState.beacons.b} onActivate={activateBeacon} />
          <BeaconSwitch beacon="c" activated={runState.beacons.c} onActivate={activateBeacon} />

          <BriefingBoard
            title="迷路モード"
            subtitle="A/B/Cのビーコンを起動し、制限時間内にゲートを抜けてください。"
            entries={[
              { heading: '進行', body: mazeProgressText, tone: runState.gateOpen || runState.completedAt ? 'success' : 'warning' },
              { heading: '分担', body: 'ここから開始。左 / 中央 / 右に分担。', tone: 'accent' },
              { heading: '集合', body: 'セクターを声に出し、3つ点灯後にゲートへ集合。' },
            ]}
            footer={latestClear ? `直近クリア: ${formatDuration(latestClear.durationMs)}` : '声かけと目印色で迷わない設計。'}
            accentColor="#10203a"
            position={[...FACILITY_BOARDS.briefing.position]}
            rotation={[...FACILITY_BOARDS.briefing.rotation]}
            scale={FACILITY_BOARDS.briefing.scale}
            width={5.8}
          />

          <TagBoard
            instanceStateKey="echo-maze-team-tags"
            title="迷路の役割"
            tags={TAGS}
            position={[-7.2, 1.6, 15.6]}
            rotation={[0, Math.PI / 2, 0]}
            scale={0.9}
          />

          <EntryLogBoard
            stateNamespace="echo-maze-entry-log"
            position={[7.2, 2.05, 15.6]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={0.9}
          />

          <group position={[0, 0.65, -20.6]}>
            <Interactable
              id="echo-maze-retry"
              interactionText={runState.completedAt ? '次の迷路ランを開始' : 'クリア後に再挑戦できます'}
              onInteract={resetRun}
              enabled={runState.completedAt !== null}
            >
              <RigidBody type="fixed" colliders="cuboid">
                <mesh castShadow>
                  <boxGeometry args={[2.4, 1.2, 1]} />
                  <meshStandardMaterial color="#6366f1" emissive="#312e81" emissiveIntensity={0.45} />
                </mesh>
              </RigidBody>
            </Interactable>
            <Text position={[0, 0, 0.52]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
              再挑戦
            </Text>
          </group>

          <Text position={[0, 2.6, -20]} fontSize={0.52} color="#fef08a" anchorX="center" anchorY="middle">
            ゴール部屋
          </Text>
        </>
      )}

      {isDorokeiMode && <DorokeiControlLayer />}
    </group>
  )
}
