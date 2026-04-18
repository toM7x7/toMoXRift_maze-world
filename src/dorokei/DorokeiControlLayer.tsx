import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Interactable } from '@xrift/world-components'
import { DorokeiRadarHud } from './DorokeiRadarHud'
import {
  DOROKEI_CAPTURE_RADIUS,
  DOROKEI_JAIL_SPAWN,
  DOROKEI_RADAR_PERIOD_MS,
  DOROKEI_RADAR_VISIBLE_MS,
  DOROKEI_RELEASE_SPAWN,
  type DorokeiRole,
} from './types'
import { useDorokeiGame } from './useDorokeiGame'

const JAIL_WALLS: Array<{
  position: [number, number, number]
  size: [number, number, number]
}> = [
  { position: [9.35, 0.65, 18.35], size: [4.1, 1.3, 0.18] },
  { position: [11.3, 0.65, 16.85], size: [0.18, 1.3, 3.2] },
  { position: [9.35, 0.65, 15.35], size: [4.1, 1.3, 0.18] },
]

function RoleButton({
  role,
  active,
  onSelect,
}: {
  role: DorokeiRole
  active: boolean
  onSelect: (role: DorokeiRole) => void
}) {
  const isChaser = role === 'chaser'
  const color = isChaser ? '#ef4444' : '#22c55e'
  const label = isChaser ? 'CHASE' : 'RUN'

  return (
    <Interactable
      id={`dorokei-role-${role}`}
      interactionText={`Join as ${role}`}
      onInteract={() => onSelect(role)}
    >
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[1.45, 0.48, 0.22]} />
          <meshStandardMaterial
            color={active ? '#f8fafc' : color}
            emissive={color}
            emissiveIntensity={active ? 0.9 : 0.38}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 0, 0.15]} fontSize={0.16} color={active ? '#0f172a' : '#ffffff'} anchorX="center" anchorY="middle">
        {active ? `${label} SET` : label}
      </Text>
    </Interactable>
  )
}

function ActionButton({
  id,
  label,
  color,
  interactionText,
  enabled = true,
  onInteract,
}: {
  id: string
  label: string
  color: string
  interactionText: string
  enabled?: boolean
  onInteract: () => void
}) {
  return (
    <Interactable id={id} interactionText={interactionText} enabled={enabled} onInteract={onInteract}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[1.52, 0.46, 0.22]} />
          <meshStandardMaterial
            color={enabled ? color : '#475569'}
            emissive={enabled ? color : '#1e293b'}
            emissiveIntensity={enabled ? 0.45 : 0.12}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 0, 0.15]} fontSize={0.14} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </Interactable>
  )
}

function JailWall({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.9}>
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#334155" emissive="#0f172a" emissiveIntensity={0.4} transparent opacity={0.84} />
      </mesh>
    </RigidBody>
  )
}

export function DorokeiControlLayer() {
  const game = useDorokeiGame()
  const isRunning = game.state.phase === 'running'
  const roundText = isRunning
    ? `ROUND LIVE / ${game.counts.chasers} chase / ${game.counts.runners} run / jailed ${game.counts.jailedRunners}`
    : `LOBBY / ${game.counts.chasers} chase / ${game.counts.runners} run`
  const radarText = `${DOROKEI_RADAR_VISIBLE_MS / 1000}s radar every ${DOROKEI_RADAR_PERIOD_MS / 1000}s`
  const localRoleText = game.localRole ? game.localRole.toUpperCase() : 'UNSET'
  const localStateText = game.localJailed ? 'JAILED' : isRunning ? 'ACTIVE' : 'READY'

  return (
    <>
      <DorokeiRadarHud
        isActive
        isRunning={isRunning}
        localRole={game.localRole}
        localJailed={game.localJailed}
        roleMap={game.state.rolesByUserId}
        jailedMap={game.state.jailedByUserId}
        roundStartedAt={game.state.roundStartedAt}
        position={[0.92, 1.48, 1.85]}
        scale={0.42}
      />

      <group position={[0, 1.5, 14.35]} scale={0.54}>
        <mesh position={[0, 0.08, -0.06]}>
          <boxGeometry args={[7.6, 2.25, 0.12]} />
          <meshStandardMaterial color="#111827" emissive="#0f172a" emissiveIntensity={0.55} transparent opacity={0.9} />
        </mesh>
        <Text position={[0, 0.92, 0.05]} fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle">
          Dorokei Mode
        </Text>
        <Text position={[0, 0.56, 0.05]} fontSize={0.12} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={6.9}>
          Choose a role. Chasers tag runners within {DOROKEI_CAPTURE_RADIUS.toFixed(1)}m. Runners free prisoners at the jail gate or by touching them.
        </Text>
        <Text position={[0, 0.27, 0.05]} fontSize={0.12} color="#93c5fd" anchorX="center" anchorY="middle">
          {roundText}
        </Text>
        <Text position={[0, 0.02, 0.05]} fontSize={0.1} color="#fef08a" anchorX="center" anchorY="middle">
          You: {game.localUser.displayName} / {localRoleText} / {localStateText} / {radarText}
        </Text>

        <group position={[-2.35, -0.52, 0.06]}>
          <RoleButton role="chaser" active={game.localRole === 'chaser'} onSelect={game.selectRole} />
        </group>
        <group position={[-0.72, -0.52, 0.06]}>
          <RoleButton role="runner" active={game.localRole === 'runner'} onSelect={game.selectRole} />
        </group>
        <group position={[0.95, -0.52, 0.06]}>
          <ActionButton
            id="dorokei-start"
            label={isRunning ? 'LIVE' : 'START'}
            color="#2563eb"
            interactionText={isRunning ? 'Round is already live' : 'Start Dorokei round'}
            enabled={!isRunning}
            onInteract={game.startRound}
          />
        </group>
        <group position={[2.62, -0.52, 0.06]}>
          <ActionButton
            id="dorokei-reset"
            label="RESET"
            color="#f97316"
            interactionText="Reset Dorokei round"
            onInteract={game.resetRound}
          />
        </group>
      </group>

      <group position={[0, 0.58, 14.45]} scale={0.42}>
        <mesh position={[0, 0.04, -0.06]}>
          <boxGeometry args={[7.2, 0.92, 0.1]} />
          <meshStandardMaterial color="#18120a" emissive="#431407" emissiveIntensity={0.32} transparent opacity={0.88} />
        </mesh>
        <Text position={[-2.85, 0.26, 0.04]} fontSize={0.15} color="#fed7aa" anchorX="left" anchorY="middle">
          SOLO DEBUG
        </Text>
        <Text position={[0.82, 0.26, 0.04]} fontSize={0.1} color="#fdba74" anchorX="center" anchorY="middle" maxWidth={4.7}>
          Use after upload to test self jail, release teleport, radar pulse, and state reset alone.
        </Text>
        <group position={[-2.55, -0.17, 0.05]}>
          <ActionButton
            id="dorokei-debug-jail-self"
            label="JAIL SELF"
            color="#b91c1c"
            interactionText="Solo debug: jail yourself"
            onInteract={game.debugJailSelf}
          />
        </group>
        <group position={[-0.85, -0.17, 0.05]}>
          <ActionButton
            id="dorokei-debug-free-self"
            label="FREE SELF"
            color="#0f766e"
            interactionText="Solo debug: free yourself"
            onInteract={game.debugFreeSelf}
          />
        </group>
        <group position={[0.85, -0.17, 0.05]}>
          <ActionButton
            id="dorokei-debug-radar-now"
            label="RADAR NOW"
            color="#1d4ed8"
            interactionText="Solo debug: force radar pulse"
            onInteract={game.debugForceRadarPulse}
          />
        </group>
        <group position={[2.55, -0.17, 0.05]}>
          <ActionButton
            id="dorokei-debug-reset-state"
            label="RESET STATE"
            color="#a16207"
            interactionText="Solo debug: clear Dorokei state"
            onInteract={game.debugResetState}
          />
        </group>
      </group>

      <group position={[0, 0.04, 0]}>
        <mesh position={[DOROKEI_JAIL_SPAWN[0], 0, DOROKEI_JAIL_SPAWN[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[4.5, 3.6]} />
          <meshStandardMaterial color="#1e293b" emissive="#0f172a" emissiveIntensity={0.28} transparent opacity={0.62} />
        </mesh>
        <mesh position={[DOROKEI_RELEASE_SPAWN[0], 0.02, DOROKEI_RELEASE_SPAWN[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.72, 32]} />
          <meshStandardMaterial color="#14b8a6" emissive="#0f766e" emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
      </group>

      {JAIL_WALLS.map((wall, index) => (
        <JailWall key={`dorokei-jail-wall-${index}`} {...wall} />
      ))}

      <group position={[7.12, 0.75, 16.85]}>
        <Interactable
          id="dorokei-jail-gate"
          interactionText="Free jailed runners"
          enabled={isRunning && !game.localJailed}
          onInteract={game.rescueAll}
        >
          <RigidBody type="fixed" colliders="cuboid">
            <mesh castShadow>
              <boxGeometry args={[0.34, 1.25, 1.6]} />
              <meshStandardMaterial color="#f59e0b" emissive="#92400e" emissiveIntensity={0.55} />
            </mesh>
          </RigidBody>
        </Interactable>
        <Text position={[0, 0.96, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.16} color="#fef3c7" anchorX="center" anchorY="middle">
          JAIL GATE
        </Text>
      </group>

      <Text position={[9.35, 1.7, 16.85]} rotation={[0, Math.PI, 0]} fontSize={0.2} color="#e2e8f0" anchorX="center" anchorY="middle">
        Jail
      </Text>
      <Text position={[DOROKEI_RELEASE_SPAWN[0], 0.18, DOROKEI_RELEASE_SPAWN[2]]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="#ccfbf1" anchorX="center" anchorY="middle">
        FREE
      </Text>
    </>
  )
}
