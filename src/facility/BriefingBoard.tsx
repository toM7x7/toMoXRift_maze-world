import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

export interface BriefingEntry {
  heading: string
  body: string
  tone?: 'default' | 'accent' | 'warning' | 'success'
}

export interface BriefingBoardProps {
  title: string
  subtitle?: string
  entries: BriefingEntry[]
  footer?: string
  accentColor?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  width?: number
  height?: number
}

function toneColor(tone: BriefingEntry['tone']): string {
  switch (tone) {
    case 'accent':
      return '#60a5fa'
    case 'warning':
      return '#fbbf24'
    case 'success':
      return '#34d399'
    default:
      return '#cbd5e1'
  }
}

export function BriefingBoard({
  title,
  subtitle,
  entries,
  footer,
  accentColor = '#0f172a',
  position = [0, 2.1, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 5.3,
  height,
}: BriefingBoardProps) {
  const boardHeight = height ?? Math.max(2.5, 1.3 + entries.length * 0.52)
  const contentTop = boardHeight * 0.26

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, boardHeight, 0.18]} />
          <meshStandardMaterial color={accentColor} emissive="#111827" emissiveIntensity={0.22} roughness={0.9} />
        </mesh>
      </RigidBody>

      <mesh position={[0, 0, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.2, boardHeight - 0.2, 0.04]} />
        <meshStandardMaterial color="#111827" opacity={0.56} transparent />
      </mesh>

      <Text
        position={[0, contentTop, 0.12]}
        fontSize={0.24}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          position={[0, contentTop - 0.34, 0.12]}
          fontSize={0.1}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          maxWidth={width - 0.8}
          lineHeight={1.05}
        >
          {subtitle}
        </Text>
      )}

      {entries.map((entry, index) => {
        const y = contentTop - 0.72 - index * 0.5
        return (
          <group key={`${entry.heading}-${index}`} position={[0, y, 0.12]}>
            <Text
              position={[-width * 0.42, 0.04, 0]}
              fontSize={0.11}
              color={toneColor(entry.tone)}
              anchorX="left"
              anchorY="middle"
              maxWidth={width * 0.38}
            >
              {entry.heading}
            </Text>
            <Text
              position={[0.15, 0.04, 0]}
              fontSize={0.1}
              color="#f8fafc"
              anchorX="left"
              anchorY="middle"
              maxWidth={width * 0.72}
              lineHeight={1.08}
            >
              {entry.body}
            </Text>
          </group>
        )
      })}

      {footer && (
        <Text
          position={[0, -boardHeight * 0.34, 0.12]}
          fontSize={0.09}
          color="#93c5fd"
          anchorX="center"
          anchorY="middle"
          maxWidth={width - 0.8}
          lineHeight={1.02}
        >
          {footer}
        </Text>
      )}
    </group>
  )
}
