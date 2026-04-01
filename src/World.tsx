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

type BeaconKey = 'a' | 'b' | 'c'

interface MazeRunState {
  beacons: Record<BeaconKey, boolean>
  gateOpen: boolean
  gateOpenedAt: number | null
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
}

const GATE_OPEN_MS = 20_000
const HUB_SPAWN: [number, number, number] = [0, 0, 16]

const OUTER_WALLS: WallSpec[] = [
  { position: [0, 1.5, 20], size: [44, 3, 1] },
  { position: [0, 1.5, -24], size: [44, 3, 1] },
  { position: [-22, 1.5, -2], size: [1, 3, 44] },
  { position: [22, 1.5, -2], size: [1, 3, 44] },
  { position: [0, 1.5, 12], size: [16, 3, 1] },
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
  a: { label: 'Beacon A', color: '#e74c3c', position: [-15, 0.6, 8] },
  b: { label: 'Beacon B', color: '#3498db', position: [1, 0.6, -5] },
  c: { label: 'Beacon C', color: '#2ecc71', position: [15, 0.6, -12] },
}

const TAGS = [
  { id: 'scout', label: 'Scout', color: '#ef4444' },
  { id: 'caller', label: 'Caller', color: '#3b82f6' },
  { id: 'runner', label: 'Runner', color: '#22c55e' },
  { id: 'replay', label: 'Replay', color: '#f59e0b' },
]

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
        interactionText={activated ? `${config.label} is already active` : `Activate ${config.label}`}
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
        {activated ? `${config.label} ON` : config.label}
      </Text>
    </group>
  )
}

function formatDuration(ms: number): string {
  const seconds = (ms / 1000).toFixed(2)
  return `${seconds}s`
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
  const [now, setNow] = useState(() => Date.now())
  const goalDebounceRef = useRef(0)

  const allBeaconsOn = runState.beacons.a && runState.beacons.b && runState.beacons.c
  const gateTimeLeftMs = runState.gateOpen && runState.gateOpenedAt
    ? Math.max(0, GATE_OPEN_MS - (now - runState.gateOpenedAt))
    : 0

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

      if (!shouldOpenGate) {
        return { ...current, beacons }
      }

      return {
        beacons,
        gateOpen: true,
        gateOpenedAt: Date.now(),
      }
    })
  }

  const resetRun = () => {
    setRunState(INITIAL_RUN_STATE)
    teleport({ position: HUB_SPAWN, yaw: 180 })
  }

  const registerClear = () => {
    if (!runState.gateOpen || runState.gateOpenedAt === null) {
      return
    }

    const nowMs = Date.now()
    if (nowMs - goalDebounceRef.current < 1200) {
      return
    }
    goalDebounceRef.current = nowMs

    const durationMs = Math.max(0, nowMs - runState.gateOpenedAt)
    setClearResults((current) => {
      const next = [{ durationMs, recordedAt: nowMs }, ...current]
      return next.slice(0, 5)
    })
  }

  const latestClear = clearResults[0]

  return (
    <group position={position} scale={scale}>
      <fog attach="fog" args={['#070b12', 14, 64]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[12, 22, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#131b2c" />
        </mesh>
      </RigidBody>

      <group position={HUB_SPAWN}>
        <SpawnPoint />
      </group>

      {OUTER_WALLS.map((wall, index) => (
        <Wall key={`outer-${index}`} {...wall} />
      ))}
      {MAZE_WALLS.map((wall, index) => (
        <Wall key={`maze-${index}`} {...wall} />
      ))}
      {GOAL_ROOM_WALLS.map((wall, index) => (
        <Wall key={`goal-${index}`} {...wall} />
      ))}

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

      <group position={[0, 2.4, 15.4]}>
        <Text fontSize={0.58} color="#f8fafc" anchorX="center" anchorY="middle">
          Echo Maze
        </Text>
        <Text position={[0, -0.8, 0]} fontSize={0.26} color="#d1d5db" anchorX="center" anchorY="middle">
          Activate A/B/C, then sprint through the gate.
        </Text>
        <Text position={[0, -1.45, 0]} fontSize={0.3} color={runState.gateOpen ? '#34d399' : '#fbbf24'} anchorX="center" anchorY="middle">
          {runState.gateOpen
            ? `Gate open: ${(gateTimeLeftMs / 1000).toFixed(1)}s left`
            : allBeaconsOn
              ? 'Gate opening...'
              : `Beacons: ${Number(runState.beacons.a) + Number(runState.beacons.b) + Number(runState.beacons.c)} / 3`}
        </Text>
        {latestClear && (
          <Text position={[0, -2.05, 0]} fontSize={0.24} color="#93c5fd" anchorX="center" anchorY="middle">
            Latest clear: {formatDuration(latestClear.durationMs)}
          </Text>
        )}
      </group>

      <TagBoard
        instanceStateKey="echo-maze-team-tags"
        title="Team Roles"
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
          interactionText="Reset run and teleport to hub"
          onInteract={resetRun}
        >
          <RigidBody type="fixed" colliders="cuboid">
            <mesh castShadow>
              <boxGeometry args={[2.4, 1.2, 1]} />
              <meshStandardMaterial color="#6366f1" emissive="#312e81" emissiveIntensity={0.45} />
            </mesh>
          </RigidBody>
        </Interactable>
        <Text position={[0, 0, 0.52]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
          Retry Portal
        </Text>
      </group>

      <Text position={[0, 2.6, -20]} fontSize={0.52} color="#fef08a" anchorX="center" anchorY="middle">
        Goal Room
      </Text>
    </group>
  )
}
