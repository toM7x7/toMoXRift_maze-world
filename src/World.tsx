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
  FACILITY_BOUNDS,
  FACILITY_BOARDS,
  FACILITY_CLEAR_LOG_LIMIT,
  FACILITY_COLORS,
  FACILITY_EVENT_SPAWN,
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
  initialMode?: WorldMode
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
const EVENT_SPAWN = [...FACILITY_EVENT_SPAWN.position] as [number, number, number]
const EVENT_YAW = FACILITY_EVENT_SPAWN.yaw

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

function FloorTextureLayer({ showEntrancePattern }: { showEntrancePattern: boolean }) {
  const eventStripes = [-14, -7, 0, 7, 14]
  const entranceTiles = [-12, -6, 0, 6, 12]

  return (
    <group>
      {eventStripes.map((x, index) => (
        <mesh key={`event-floor-stripe-${x}`} position={[x, 0.012, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.22, 48]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? '#bfdbfe' : '#fecaca'}
            transparent
            opacity={0.34}
            emissive={index % 2 === 0 ? '#dbeafe' : '#fee2e2'}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {showEntrancePattern && entranceTiles.map((x, xIndex) => (
        entranceTiles.map((offset, zIndex) => (
          <mesh
            key={`entrance-tile-${x}-${offset}`}
            position={[x, 0.018, 28 + offset * 0.7]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[3.8, 3.8]} />
            <meshStandardMaterial
              color={(xIndex + zIndex) % 2 === 0 ? '#ffffff' : FACILITY_COLORS.floorAccent}
              transparent
              opacity={0.36}
              roughness={0.8}
            />
          </mesh>
        ))
      ))}

      {showEntrancePattern && (
        <mesh position={[0, 0.025, 28.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8.4, 12.8]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.38} emissive="#7dd3fc" emissiveIntensity={0.12} />
        </mesh>
      )}
    </group>
  )
}

function EntranceModeGate({
  mode,
  label,
  subtitle,
  color,
  position,
  onSelect,
}: {
  mode: Exclude<WorldMode, 'entrance'>
  label: string
  subtitle: string
  color: string
  position: [number, number, number]
  onSelect: (mode: Exclude<WorldMode, 'entrance'>) => void
}) {
  return (
    <group position={position}>
      <Interactable
        id={`entrance-mode-gate-${mode}`}
        interactionText={`${label}で遊ぶ`}
        onInteract={() => onSelect(mode)}
      >
        <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.6, 3.2, 0.52]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.42} roughness={0.5} />
          </mesh>
        </RigidBody>
      </Interactable>
      <mesh position={[0, -1.8, 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color={color} transparent opacity={0.24} emissive={color} emissiveIntensity={0.28} />
      </mesh>
      <Text position={[0, 0.42, 0.32]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
      <Text position={[0, -0.18, 0.32]} fontSize={0.17} color="#fff7ed" anchorX="center" anchorY="middle" maxWidth={3.8}>
        {subtitle}
      </Text>
    </group>
  )
}

function EntranceExperience({
  onSelectMode,
}: {
  onSelectMode: (mode: Exclude<WorldMode, 'entrance'>) => void
}) {
  return (
    <>
      {FACILITY_WALLS.entrance.map((wall, index) => (
        <Wall key={`entrance-wall-${index}`} {...wall} />
      ))}

      <Text position={[0, 4.15, 22.45]} fontSize={0.42} color="#7c2d12" anchorX="center" anchorY="middle">
        ここからイベントワールド
      </Text>
      <Text position={[0, 3.55, 30.6]} fontSize={0.34} color="#0f172a" anchorX="center" anchorY="middle">
        まず遊び方を選んでください
      </Text>

      <ModeSelectorBoard
        title="モード選択"
        subtitle="入口で選んでからイベント空間へ入ります"
        options={[
          { id: 'maze', label: '迷路', description: 'ビーコンを集めて脱出', accentColor: '#2563eb' },
          { id: 'dorokei', label: 'ドロケイ', description: '警察と泥棒で遊ぶ', accentColor: '#dc2626' },
        ]}
        activeOptionId="entrance"
        onSelectOption={(nextMode) => onSelectMode(nextMode as Exclude<WorldMode, 'entrance'>)}
        interactionText={(option) => `${option.label}を開始`}
        position={[...FACILITY_BOARDS.mode.position]}
        rotation={[...FACILITY_BOARDS.mode.rotation]}
        scale={FACILITY_BOARDS.mode.scale}
      />

      <EntranceModeGate
        mode="maze"
        label="迷路"
        subtitle="3つのビーコンを起動してゴールへ"
        color="#2563eb"
        position={[-5.4, 1.82, 25.2]}
        onSelect={onSelectMode}
      />
      <EntranceModeGate
        mode="dorokei"
        label="ドロケイ"
        subtitle="警察と泥棒に分かれて追いかけっこ"
        color="#dc2626"
        position={[5.4, 1.82, 25.2]}
        onSelect={onSelectMode}
      />

      {[-13, -8, 8, 13].map((x, index) => (
        <group key={`entrance-balloon-${index}`} position={[x, 2.8, 34.2 + (index % 2) * 2.2]}>
          <mesh castShadow>
            <sphereGeometry args={[0.55, 24, 16]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#f97316' : '#22c55e'} emissive={index % 2 === 0 ? '#fdba74' : '#86efac'} emissiveIntensity={0.22} />
          </mesh>
          <mesh position={[0, -0.9, 0]}>
            <boxGeometry args={[0.035, 1.6, 0.035]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      ))}
    </>
  )
}

function ReturnToEntranceConsole({ onReturn }: { onReturn: () => void }) {
  return (
    <group position={[0, 1.05, 18.7]}>
      <Interactable id="return-to-entrance" interactionText="入口ロビーへ戻る" onInteract={onReturn}>
        <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.4, 1.2, 0.42]} />
            <meshStandardMaterial color="#f97316" emissive="#fdba74" emissiveIntensity={0.38} roughness={0.48} />
          </mesh>
        </RigidBody>
      </Interactable>
      <Text position={[0, 0.08, 0.28]} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
        入口へ戻る
      </Text>
    </group>
  )
}

export function World({ position = [0, 0, 0], scale = 1, initialMode = 'entrance' }: WorldProps) {
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
    'echo-maze-world-mode-v2',
    initialMode,
  )
  const [now, setNow] = useState(() => Date.now())
  const didTeleportOnMountRef = useRef(false)
  const facilityVisibility = getFacilityVisibility(worldMode)

  const isEntranceMode = facilityVisibility.entranceLayer
  const isMazeMode = facilityVisibility.mazeObjectives
  const isDorokeiMode = facilityVisibility.dorokeiLayer
  const isEventMode = facilityVisibility.eventWalls
  const showLabyrinthWalls = facilityVisibility.eventWalls
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
      const spawn = worldMode === 'entrance' ? HUB_SPAWN : EVENT_SPAWN
      const yaw = worldMode === 'entrance' ? HUB_YAW : EVENT_YAW
      teleport({ position: spawn, yaw })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [teleport, worldMode])

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

  const enterWorldMode = (nextMode: Exclude<WorldMode, 'entrance'>) => {
    setWorldMode(nextMode)

    if (nextMode === 'maze') {
      setRunState(INITIAL_RUN_STATE)
    }

    teleport({ position: EVENT_SPAWN, yaw: EVENT_YAW })
  }

  const returnToEntrance = () => {
    setWorldMode('entrance')
    teleport({ position: HUB_SPAWN, yaw: HUB_YAW })
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

      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#ffffff', '#fed7aa', 1.18]} />
      <directionalLight
        position={[-10, 26, 12]}
        intensity={2.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 5.5, 31]} intensity={58} distance={30} color="#fff7ed" />
      <pointLight position={[-8.5, 3.5, 13.5]} intensity={20} distance={13} color="#fb7185" />
      <pointLight position={[0, 3.5, 12.6]} intensity={20} distance={13} color="#60a5fa" />
      <pointLight position={[8.5, 3.5, 13.5]} intensity={20} distance={13} color="#22c55e" />

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh position={[...FACILITY_BOUNDS.floorCenter]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[...FACILITY_BOUNDS.floorSize]} />
          <meshStandardMaterial color={FACILITY_COLORS.floor} />
        </mesh>
      </RigidBody>
      <FloorTextureLayer showEntrancePattern={isEntranceMode} />

      <SpawnPoint position={HUB_SPAWN} yaw={HUB_YAW} />

      {isEntranceMode && <EntranceExperience onSelectMode={enterWorldMode} />}

      {isEventMode && FACILITY_WALLS.outer.map((wall, index) => (
        <Wall key={`outer-${index}`} {...wall} />
      ))}
      {showLabyrinthWalls && FACILITY_WALLS.maze.map((wall, index) => (
        <Wall key={`maze-${index}`} {...wall} />
      ))}
      {isEventMode && <ReturnToEntranceConsole onReturn={returnToEntrance} />}
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
            accentColor="#fff7ed"
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
