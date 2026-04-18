import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useUsers } from '@xrift/world-components'
import { useMemo, useRef, useState } from 'react'
import { DoubleSide, Group, Vector3 } from 'three'

type DorokeiRole = 'chaser' | 'runner'

type MovementLike = {
  position?: { x: number; y: number; z: number }
  rotation?: { yaw?: number; pitch?: number }
  direction?: { x: number; z: number }
}

type JailedValue = boolean | { jailed?: boolean } | undefined

export interface DorokeiRadarHudProps {
  isActive: boolean
  isRunning: boolean
  localRole?: DorokeiRole | null
  localJailed?: boolean
  roleMap: Record<string, DorokeiRole | string | undefined>
  jailedMap: Record<string, JailedValue>
  roundStartedAt: number | null
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  radarRadius?: number
  maxRange?: number
  className?: string
}

type FacingBasis = {
  forwardX: number
  forwardZ: number
  yaw: number
}

type RadarTarget = {
  id: string
  role: DorokeiRole | 'unknown'
  jailed: boolean
  x: number
  y: number
  edge: boolean
  distance: number
  color: string
}

const PANEL_WIDTH = 2.5
const PANEL_HEIGHT = 1.5
const RADAR_GRID = 0.44
const PULSE_WINDOW_MS = 10_000
const PULSE_PERIOD_MS = 60_000
const RERENDER_INTERVAL_SEC = 0.1

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const normalize = (x: number, z: number) => {
  const length = Math.hypot(x, z)
  if (length <= 1e-6) {
    return { x: 0, z: 1 }
  }

  return { x: x / length, z: z / length }
}

const toRadians = (yaw: number | undefined) => {
  if (yaw == null || Number.isNaN(yaw)) {
    return 0
  }

  return Math.abs(yaw) > Math.PI * 2 ? (yaw * Math.PI) / 180 : yaw
}

const resolveFacingBasis = (movement: MovementLike | undefined): FacingBasis => {
  const direction = movement?.direction
  if (direction && (Math.abs(direction.x) > 1e-6 || Math.abs(direction.z) > 1e-6)) {
    const { x, z } = normalize(direction.x, direction.z)
    return {
      forwardX: x,
      forwardZ: z,
      yaw: Math.atan2(x, z),
    }
  }

  const yaw = toRadians(movement?.rotation?.yaw)
  return {
    forwardX: Math.sin(yaw),
    forwardZ: Math.cos(yaw),
    yaw,
  }
}

const readJailed = (value: JailedValue) => {
  if (typeof value === 'boolean') return value
  return Boolean(value?.jailed)
}

const readRole = (value: DorokeiRole | string | undefined): DorokeiRole | 'unknown' => {
  if (value === 'chaser' || value === 'runner') {
    return value
  }
  return 'unknown'
}

const formatCountdown = (remainingMs: number) => {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
  return `${seconds.toString().padStart(2, '0')}秒`
}

const getPulseState = (roundStartedAt: number | null, nowMs: number) => {
  if (roundStartedAt == null) {
    return {
      visible: false,
      phaseMs: 0,
      remainingMs: PULSE_PERIOD_MS,
    }
  }

  const elapsedMs = nowMs - roundStartedAt
  const phaseMs = ((elapsedMs % PULSE_PERIOD_MS) + PULSE_PERIOD_MS) % PULSE_PERIOD_MS
  const visible = phaseMs < PULSE_WINDOW_MS
  const remainingMs = visible ? PULSE_WINDOW_MS - phaseMs : PULSE_PERIOD_MS - phaseMs

  return { visible, phaseMs, remainingMs }
}

const getEnemyRole = (localRole: DorokeiRole | null | undefined): DorokeiRole | null => {
  if (localRole === 'chaser') return 'runner'
  if (localRole === 'runner') return 'chaser'
  return null
}

const getBasisRight = (basis: FacingBasis) => ({
  x: basis.forwardZ,
  z: -basis.forwardX,
})

const transformLocalOffset = (basis: FacingBasis, offset: [number, number, number]) => {
  const right = getBasisRight(basis)
  return {
    x: right.x * offset[0] + offset[2] * basis.forwardX,
    y: offset[1],
    z: right.z * offset[0] + offset[2] * basis.forwardZ,
  }
}

const resolveScale = (scale: DorokeiRadarHudProps['scale']): [number, number, number] => {
  if (scale == null) return [1, 1, 1] as const
  if (typeof scale === 'number') return [scale, scale, scale] as const
  return [scale[0], scale[1], scale[2]]
}

export const DorokeiRadarHud = ({
  isActive,
  isRunning,
  localRole = null,
  localJailed = false,
  roleMap,
  jailedMap,
  roundStartedAt,
  position = [0, 1.85, -1.35],
  rotation = [0, 0, 0],
  scale = 1,
  radarRadius = RADAR_GRID,
  maxRange = 28,
}: DorokeiRadarHudProps) => {
  const { localUser, remoteUsers, getMovement, getLocalMovement } = useUsers()
  const { camera } = useThree()
  const anchorRef = useRef<Group>(null)
  const hudRef = useRef<Group>(null)
  const [frameTick, setFrameTick] = useState(0)
  const frameAccumulator = useRef(0)
  const cameraPositionRef = useRef(new Vector3())
  const cameraDirectionRef = useRef(new Vector3())

  const resolveLocalMovement = (): MovementLike => {
    const movement = (getLocalMovement?.() as MovementLike | undefined) ?? undefined
    if (localUser || !camera) {
      return movement ?? {}
    }

    camera.getWorldPosition(cameraPositionRef.current)
    camera.getWorldDirection(cameraDirectionRef.current)

    return {
      position: {
        x: cameraPositionRef.current.x,
        y: cameraPositionRef.current.y - 1.65,
        z: cameraPositionRef.current.z,
      },
      direction: {
        x: cameraDirectionRef.current.x,
        z: cameraDirectionRef.current.z,
      },
      rotation: {
        yaw: Math.atan2(cameraDirectionRef.current.x, cameraDirectionRef.current.z),
        pitch: 0,
      },
    }
  }

  useFrame((_, delta) => {
    if (!isActive) {
      return
    }

    const localMovement = resolveLocalMovement()

    const basis = resolveFacingBasis(localMovement)
    const scaleVector = resolveScale(scale)

    if (anchorRef.current) {
      if (localMovement?.position) {
        anchorRef.current.position.set(
          localMovement.position.x,
          localMovement.position.y,
          localMovement.position.z
        )
      } else {
        anchorRef.current.position.set(0, 0, 0)
      }
    }

    if (hudRef.current) {
      const offset = localMovement?.position
        ? transformLocalOffset(basis, position)
        : { x: position[0], y: position[1], z: position[2] }
      hudRef.current.position.set(offset.x, offset.y, offset.z)
      hudRef.current.rotation.set(rotation[0], basis.yaw + rotation[1] - Math.PI, rotation[2])
      hudRef.current.scale.set(scaleVector[0], scaleVector[1], scaleVector[2])
    }

    frameAccumulator.current += delta
    if (frameAccumulator.current >= RERENDER_INTERVAL_SEC) {
      frameAccumulator.current = 0
      setFrameTick((value) => value + 1)
    }
  })

  const pulseState = useMemo(
    () => getPulseState(roundStartedAt, Date.now()),
    [roundStartedAt, frameTick]
  )

  const visibleRadar = isActive && isRunning && pulseState.visible
  const enemyRole = getEnemyRole(localRole)
  const allMovements = remoteUsers.map((user) => {
    const movement = (getMovement(user.id) as MovementLike | undefined) ?? undefined
    const role = readRole(roleMap[user.id])
    const jailed = readJailed(jailedMap[user.id])
    return { user, movement, role, jailed }
  })

  const localMovement = resolveLocalMovement()
  const localBasis = resolveFacingBasis(localMovement)
  const localPosition = localMovement?.position ?? { x: 0, y: 0, z: 0 }

  const targets: RadarTarget[] = allMovements
    .filter(({ user }) => !localUser || user.id !== localUser.id)
    .filter(({ role, jailed }) => {
      if (!isRunning) return false
      if (localRole == null) return true
      if (role === 'unknown') return true
      if (enemyRole == null) return true
      return role === enemyRole || jailed
    })
    .map(({ user, movement, role, jailed }) => {
      const targetPosition = movement?.position
      if (!targetPosition) {
        return null
      }

      const dx = targetPosition.x - localPosition.x
      const dz = targetPosition.z - localPosition.z
      const basisRight = getBasisRight(localBasis)

      const localX = dx * basisRight.x + dz * basisRight.z
      const localY = dx * localBasis.forwardX + dz * localBasis.forwardZ
      const distance = Math.hypot(localX, localY)
      const normalizedDistance = clamp(distance / maxRange, 0, 1)
      const radius = normalizedDistance * radarRadius
      const angle = distance > 1e-6 ? Math.atan2(localX, localY) : 0
      const edge = distance > maxRange
      const x = Math.sin(angle) * radius
      const y = Math.cos(angle) * radius

      const isRunner = role === 'runner'
      const isChaser = role === 'chaser'

      return {
        id: user.id,
        role,
        jailed,
        x,
        y,
        edge,
        distance,
        color: jailed
          ? '#7a7f8a'
          : isChaser
            ? '#ff5d5d'
            : isRunner
              ? '#58f0c8'
              : '#ffcf5a',
      } satisfies RadarTarget
    })
    .filter((target): target is RadarTarget => target !== null)

  const nearbyEnemies = targets.filter((target) => !target.jailed)
  const localSafe = localRole === 'runner' && nearbyEnemies.length === 0

  const roundLabel = !isRunning
    ? '待機'
    : localRole === 'chaser'
      ? '警察'
      : localRole === 'runner'
        ? '泥棒'
        : 'ドロケイ'

  const countdownLabel = roundStartedAt == null ? '--' : formatCountdown(pulseState.remainingMs)
  const visibilityLabel = visibleRadar ? `レーダー中 ${countdownLabel}` : `次のレーダー ${countdownLabel}`
  const roleLabel = localRole == null ? '役割: 未設定' : `役割: ${localRole === 'chaser' ? '警察' : '泥棒'}`
  const statusLabel = !isRunning
    ? '開始待ち'
    : localJailed
      ? '牢屋'
      : localSafe
        ? '安全'
        : localRole === 'chaser'
          ? `追跡 ${nearbyEnemies.length}`
          : nearbyEnemies.length > 0
            ? `危険 ${nearbyEnemies.length}`
            : '反応なし'

  if (!isActive) {
    return null
  }

  return (
    <group ref={anchorRef}>
      <group ref={hudRef}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[PANEL_WIDTH + 0.06, PANEL_HEIGHT + 0.06]} />
          <meshBasicMaterial color="#060912" transparent opacity={0.72} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0]}>
          <planeGeometry args={[1.15, 1.08]} />
          <meshBasicMaterial color="#08111f" transparent opacity={0.9} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.01]}>
          <ringGeometry args={[0.28, radarRadius + 0.04, 64]} />
          <meshBasicMaterial color="#b8d7ff" transparent opacity={0.28} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.012]}>
          <ringGeometry args={[0.02, 0.028, 24]} />
          <meshBasicMaterial color="#ffffff" side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.013]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.035, 0.12, 4]} />
          <meshBasicMaterial color="#ffffff" side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.005]}>
          <circleGeometry args={[radarRadius + 0.005, 64]} />
          <meshBasicMaterial color="#0d1930" transparent opacity={0.72} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.006]}>
          <circleGeometry args={[radarRadius + 0.002, 64]} />
          <meshBasicMaterial color="#0d1930" transparent opacity={0.0} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.01]}>
          <planeGeometry args={[radarRadius * 2, radarRadius * 2]} />
          <meshBasicMaterial color="#0a1730" transparent opacity={0.14} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.012]}>
          <boxGeometry args={[radarRadius * 2, 0.01, 0.004]} />
          <meshBasicMaterial color="#7db6ff" transparent opacity={0.18} side={DoubleSide} />
        </mesh>

        <mesh position={[-0.42, 0.08, 0.012]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[radarRadius * 2, 0.01, 0.004]} />
          <meshBasicMaterial color="#7db6ff" transparent opacity={0.18} side={DoubleSide} />
        </mesh>

        <group position={[-0.42, 0.08, 0.02]}>
          {visibleRadar ? (
            <>
              <mesh position={[0, 0, 0.03]}>
                <sphereGeometry args={[0.028, 16, 16]} />
                <meshBasicMaterial color="#ffffff" side={DoubleSide} />
              </mesh>
              <mesh position={[0, radarRadius * 0.84, 0.03]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.023, 0.08, 3]} />
                <meshBasicMaterial color="#ffffff" side={DoubleSide} />
              </mesh>
              {targets.map((target) => (
                <group key={target.id} position={[target.x, target.y, 0.02]}>
                  <mesh>
                    <sphereGeometry args={[target.edge ? 0.028 : 0.024, 12, 12]} />
                    <meshBasicMaterial color={target.color} transparent opacity={target.edge ? 0.9 : 1} side={DoubleSide} />
                  </mesh>
                  {target.edge ? (
                    <mesh position={[0, 0, -0.005]}>
                      <ringGeometry args={[0.03, 0.048, 16]} />
                      <meshBasicMaterial color={target.color} transparent opacity={0.45} side={DoubleSide} />
                    </mesh>
                  ) : null}
                </group>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, 0, 0.03]}>
                <sphereGeometry args={[0.024, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} side={DoubleSide} />
              </mesh>
              <mesh position={[0, radarRadius * 0.82, 0.03]}>
                <coneGeometry args={[0.02, 0.07, 3]} />
                <meshBasicMaterial color="#8fd0ff" transparent opacity={0.55} side={DoubleSide} />
              </mesh>
            </>
          )}
        </group>

        <Text
          position={[0.52, 0.5, 0.02]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {roundLabel}
        </Text>

        <Text
          position={[0.52, 0.28, 0.02]}
          fontSize={0.1}
          color={localSafe ? '#58f0c8' : localJailed ? '#ff5d5d' : '#d9e6ff'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {statusLabel}
        </Text>

        <Text
          position={[0.52, 0.08, 0.02]}
          fontSize={0.085}
          color="#b8d7ff"
          anchorX="center"
          anchorY="middle"
        >
          {roleLabel}
        </Text>

        <Text
          position={[0.52, -0.14, 0.02]}
          fontSize={0.08}
          color={visibleRadar ? '#f4f7ff' : '#8ca3c7'}
          anchorX="center"
          anchorY="middle"
        >
          {visibilityLabel}
        </Text>

        <Text
          position={[0.52, -0.34, 0.02]}
          fontSize={0.07}
          color="#8ca3c7"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.15}
        >
          上が前方。点の方向に相手がいます。
        </Text>

        {localJailed ? (
          <Text
            position={[0.52, -0.54, 0.02]}
            fontSize={0.08}
            color="#ff8f8f"
            anchorX="center"
            anchorY="middle"
          fontWeight="bold"
        >
            牢屋状態
          </Text>
        ) : null}

        {!isRunning ? (
          <Text
            position={[0.52, -0.72, 0.02]}
            fontSize={0.07}
            color="#cbd7ea"
            anchorX="center"
            anchorY="middle"
        >
            試合開始待ち
          </Text>
        ) : null}
      </group>
    </group>
  )
}

export default DorokeiRadarHud
