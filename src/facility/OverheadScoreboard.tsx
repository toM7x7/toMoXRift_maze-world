import { Billboard, Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

export interface ScoreboardMetric {
  id: string
  label: string
  value: string | number
  accentColor?: string
  suffix?: string
}

export interface OverheadScoreboardProps {
  title: string
  subtitle?: string
  metrics: ScoreboardMetric[]
  status?: string
  footer?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  width?: number
  height?: number
}

function getMetricLayout(index: number, total: number): [number, number, number] {
  const columns = total <= 2 ? 2 : 4
  const spacing = columns === 2 ? 1.72 : 1.28
  const rowSpacing = total <= 2 ? 0 : 0.84
  const row = Math.floor(index / columns)
  const column = index % columns
  const centeredColumn = column - (columns - 1) / 2
  const x = centeredColumn * spacing
  const y = row === 0 ? 0 : -rowSpacing
  return [x, y, 0]
}

export function OverheadScoreboard({
  title,
  subtitle,
  metrics,
  status,
  footer,
  position = [0, 7.5, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width,
  height,
}: OverheadScoreboardProps) {
  const boardWidth = width ?? Math.max(8.8, metrics.length * 1.72)
  const boardHeight = height ?? (metrics.length > 2 ? 2.35 : 1.78)

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boardWidth, boardHeight, 0.24]} />
          <meshStandardMaterial color="#fff7ed" emissive="#fed7aa" emissiveIntensity={0.22} roughness={0.78} />
        </mesh>
      </RigidBody>

      <mesh position={[0, 0, -0.16]} castShadow receiveShadow>
        <boxGeometry args={[boardWidth - 0.18, boardHeight - 0.18, 0.04]} />
        <meshStandardMaterial color="#ffffff" opacity={0.7} transparent />
      </mesh>

      <group position={[0, boardHeight * 0.18, 0.14]}>
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text fontSize={0.28} color="#0f172a" anchorX="center" anchorY="middle">
            {title}
          </Text>
        </Billboard>

        {subtitle && (
          <Billboard follow lockX={false} lockY={false} lockZ={false}>
            <Text position={[0, -0.34, 0]} fontSize={0.1} color="#334155" anchorX="center" anchorY="middle">
              {subtitle}
            </Text>
          </Billboard>
        )}
      </group>

      {metrics.map((metric, index) => {
        const [x, y, z] = getMetricLayout(index, metrics.length)
        const accentColor = metric.accentColor ?? '#38bdf8'

        return (
          <group key={metric.id} position={[x, y - 0.15, z + 0.12]}>
            <mesh castShadow>
              <boxGeometry args={[1.45, 0.74, 0.1]} />
              <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.42} roughness={0.72} />
            </mesh>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
              <Text position={[0, 0.1, 0.08]} fontSize={0.16} color="#0f172a" anchorX="center" anchorY="middle">
                {metric.label}
              </Text>
              <Text position={[0, -0.1, 0.08]} fontSize={0.24} color="#ffffff" anchorX="center" anchorY="middle">
                {metric.value}
                {metric.suffix ?? ''}
              </Text>
            </Billboard>
          </group>
        )
      })}

      {status && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text position={[0, -boardHeight * 0.34, 0.14]} fontSize={0.11} color="#fbbf24" anchorX="center" anchorY="middle">
            {status}
          </Text>
        </Billboard>
      )}

      {footer && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text position={[0, -boardHeight * 0.45, 0.14]} fontSize={0.08} color="#93c5fd" anchorX="center" anchorY="middle">
            {footer}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
