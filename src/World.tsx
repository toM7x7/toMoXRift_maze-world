import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { BackSide } from 'three'
import {
  EntryLogBoard,
  Interactable,
  SpawnPoint,
  TagBoard,
  useInstanceState,
  useTeleport,
} from '@xrift/world-components'
import { DorokeiControlLayer } from './dorokei/DorokeiControlLayer'

type BeaconKey = 'a' | 'b' | 'c'
type WorldMode = 'maze' | 'dorokei'

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

interface WallSpec {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
}

const INITIAL_RUN_STATE: MazeRunState = {
  beacons: { a: false, b: false, c: false },
  gateOpen: false,
  gateOpenedAt: null,
  runStartedAt: null,
  completedAt: null,
}

const GATE_OPEN_MS = 20_000
const HUB_SPAWN: [number, number, number] = [0, 0, 17.5]
const HUB_YAW = 0

const OUTER_WALLS: WallSpec[] = [
  { position: [0, 1.5, 20], size: [44, 3, 1] },
  { position: [0, 1.5, -24], size: [44, 3, 1] },
  { position: [-22, 1.5, -2], size: [1, 3, 44] },
  { position: [22, 1.5, -2], size: [1, 3, 44] },
  { position: [-6, 1.5, 12], size: [4, 3, 1] },
  { position: [6, 1.5, 12], size: [4, 3, 1] },
  { position: [-12, 1.5, 16], size: [1, 3, 8] },
  { position: [12, 1.5, 16], size: [1, 3, 8] },
]

const MAZE_WALLS: WallSpec[] = [
  { position: [-10, 1.5, 1], size: [1, 3, 18], color: '#571616' },
  { position: [-2, 1.5, -2], size: [1, 3, 20], color: '#1d274f' },
  { position: [6, 1.5, 1], size: [1, 3, 18], color: '#1a4f2c' },
  { position: [14, 1.5, -3], size: [1, 3, 22], color: '#2e3542' },
  { position: [-12, 1.5, 6], size: [12, 3, 1], color: '#571616' },
  { position: [-1, 1.5, 2], size: [10, 3, 1], color: '#1d274f' },
  { position: [11, 1.5, -2], size: [14, 3, 1], color: '#1a4f2c' },
  { position: [-11, 1.5, -6], size: [14, 3, 1], color: '#571616' },
  { position: [4, 1.5, -10], size: [16, 3, 1], color: '#1d274f' },
  { position: [15, 1.5, -14], size: [6, 3, 1], color: '#1a4f2c' },
  { position: [-9, 1.5, -14], size: [18, 3, 1], color: '#2e3542' },
  { position: [0, 1.5, -16], size: [34, 3, 1], color: '#2e3542' },
]

const GOAL_ROOM_WALLS: WallSpec[] = [
  { position: [-8, 1.5, -20], size: [1, 3, 8], color: '#4a4530' },
  { position: [8, 1.5, -20], size: [1, 3, 8], color: '#4a4530' },
  { position: [0, 1.5, -24], size: [16, 3, 1], color: '#4a4530' },
]

const BEACON_CONFIG: Record<BeaconKey, { label: string; color: string; position: [number, number, number] }> = {
  a: { label: 'ビーコンA', color: '#e74c3c', position: [-15, 0.6, 8] },
  b: { label: 'ビーコンB', color: '#3498db', position: [1, 0.6, -5] },
  c: { label: 'ビーコンC', color: '#2ecc71', position: [15, 0.6, -12] },
}

const TAGS = [
  { id: 'scout', label: '先導', color: '#ef4444' },
  { id: 'caller', label: '合図', color: '#3b82f6' },
  { id: 'runner', label: '走者', color: '#22c55e' },
  { id: 'replay', label: '再挑戦', color: '#f59e0b' },
]

const SKY_STARS: Array<[number, number, number, number]> = Array.from({ length: 56 }, (_, index) => {
  const angle = index * 2.399963229728653
  const height = 42 + (index % 9) * 7.5
  const radius = 84 + (index % 5) * 10
  return [
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius,
    0.08 + (index % 4) * 0.025,
  ]
})

function Wall({ position, size, color = '#353c4e' }: WallSpec) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.9}>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  )
}

function ProceduralSkybox() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[170, 48, 24]} />
        <meshBasicMaterial color="#071328" side={BackSide} />
      </mesh>
      <mesh position={[0, 22, -82]} rotation={[0, 0, 0]}>
        <torusGeometry args={[44, 0.18, 8, 96]} />
        <meshBasicMaterial color="#1d4ed8" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-42, 58, -74]}>
        <sphereGeometry args={[4.8, 24, 12]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.92} />
      </mesh>
      {SKY_STARS.map(([x, y, z, radius], index) => (
        <mesh key={`sky-star-${index}`} position={[x, y, z]}>
          <sphereGeometry args={[radius, 8, 8]} />
          <meshBasicMaterial color={index % 5 === 0 ? '#bfdbfe' : '#f8fafc'} />
        </mesh>
      ))}
    </group>
  )
}

function ModeButton({
  mode,
  active,
  label,
  color,
  onSelect,
}: {
  mode: WorldMode
  active: boolean
  label: string
  color: string
  onSelect: (mode: WorldMode) => void
}) {
  return (
    <Interactable
      id={`echo-maze-mode-${mode}`}
      interactionText={`${label}に切り替え`}
      onInteract={() => onSelect(mode)}
    >
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[1.85, 0.5, 0.22]} />
          <meshStandardMaterial
            color={active ? '#f8fafc' : color}
            emissive={color}
            emissiveIntensity={active ? 0.8 : 0.34}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 0, 0.15]} fontSize={0.14} color={active ? '#0f172a' : '#ffffff'} anchorX="center" anchorY="middle">
        {active ? `${label}中` : label}
      </Text>
    </Interactable>
  )
}

function ModeSelector({
  mode,
  onSelect,
}: {
  mode: WorldMode
  onSelect: (mode: WorldMode) => void
}) {
  return (
    <group position={[-21.42, 1.7, 14.4]} rotation={[0, Math.PI / 2, 0]} scale={0.34}>
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[4.2, 1.42, 0.12]} />
        <meshStandardMaterial color="#0f172a" emissive="#111827" emissiveIntensity={0.42} transparent opacity={0.88} />
      </mesh>
      <Text position={[0, 0.46, 0.04]} fontSize={0.16} color="#f8fafc" anchorX="center" anchorY="middle">
        ワールドモード
      </Text>
      <Text position={[0, 0.23, 0.04]} fontSize={0.08} color="#cbd5e1" anchorX="center" anchorY="middle">
        切替しても現在位置は保持
      </Text>
      <group position={[-1.08, -0.24, 0.05]}>
        <ModeButton mode="maze" active={mode === 'maze'} label="迷路" color="#2563eb" onSelect={onSelect} />
      </group>
      <group position={[1.08, -0.24, 0.05]}>
        <ModeButton mode="dorokei" active={mode === 'dorokei'} label="ドロケイ" color="#dc2626" onSelect={onSelect} />
      </group>
    </group>
  )
}

interface BeaconSwitchProps {
  beacon: BeaconKey
  activated: boolean
  onActivate: (beacon: BeaconKey) => void
}

function BeaconSwitch({ beacon, activated, onActivate }: BeaconSwitchProps) {
  const config = BEACON_CONFIG[beacon]

  return (
    <group position={config.position}>
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

  const isMazeMode = worldMode === 'maze'
  const isDorokeiMode = worldMode === 'dorokei'
  const showLabyrinthWalls = isMazeMode || isDorokeiMode
  const allBeaconsOn = runState.beacons.a && runState.beacons.b && runState.beacons.c
  const gateTimeLeftMs = runState.gateOpen && runState.gateOpenedAt
    ? Math.max(0, GATE_OPEN_MS - (now - runState.gateOpenedAt))
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

        if (Date.now() - current.gateOpenedAt < GATE_OPEN_MS) {
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
      return next.slice(0, 5)
    })
  }

  const latestClear = clearResults[0]

  return (
    <group position={position} scale={scale}>
      <color attach="background" args={['#0a1020']} />
      <fog attach="fog" args={['#070b12', 14, 64]} />
      <ProceduralSkybox />

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
          <meshStandardMaterial color="#131b2c" />
        </mesh>
      </RigidBody>

      <SpawnPoint position={HUB_SPAWN} yaw={HUB_YAW} />
      <ModeSelector mode={worldMode} onSelect={selectWorldMode} />

      {OUTER_WALLS.map((wall, index) => (
        <Wall key={`outer-${index}`} {...wall} />
      ))}
      {showLabyrinthWalls && MAZE_WALLS.map((wall, index) => (
        <Wall key={`maze-${index}`} {...wall} />
      ))}
      {isMazeMode && (
        <>
          {GOAL_ROOM_WALLS.map((wall, index) => (
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

          <group position={[0, 2.2, 13.2]}>
            <Text fontSize={0.24} color="#f8fafc" anchorX="center" anchorY="middle">
              迷路モード
            </Text>
            <Text position={[0, -0.38, 0]} fontSize={0.13} color="#d1d5db" anchorX="center" anchorY="middle">
              A/B/Cのビーコンを起動し、制限時間内にゲートを抜けてください。
            </Text>
            <Text
              position={[0, -0.72, 0]}
              fontSize={0.15}
              color={runState.completedAt ? '#34d399' : runState.gateOpen ? '#34d399' : '#fbbf24'}
              anchorX="center"
              anchorY="middle"
            >
              {runState.completedAt
                ? `クリア: ${latestClear ? formatDuration(latestClear.durationMs) : 'ゴール到達'}`
                : runState.gateOpen
                ? `ゲート開放: 残り ${(gateTimeLeftMs / 1000).toFixed(1)}秒`
                : allBeaconsOn
                  ? 'ゲート起動中...'
                  : `ビーコン: ${Number(runState.beacons.a) + Number(runState.beacons.b) + Number(runState.beacons.c)} / 3`}
            </Text>
            {latestClear && (
              <Text position={[0, -1.02, 0]} fontSize={0.12} color="#93c5fd" anchorX="center" anchorY="middle">
                直近クリア: {formatDuration(latestClear.durationMs)}
              </Text>
            )}
          </group>

          <group position={[0, 2.2, 10.1]}>
            <Text fontSize={0.2} color="#f8fafc" anchorX="center" anchorY="middle">
              ここから開始。左 / 中央 / 右に分担。
            </Text>
            <Text position={[0, -0.32, 0]} fontSize={0.13} color="#cbd5e1" anchorX="center" anchorY="middle">
              セクターを声に出し、3つ点灯後にゲートへ集合。
            </Text>
          </group>

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
