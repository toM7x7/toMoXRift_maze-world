import { RigidBody } from '@react-three/rapier'
import type { ReactNode } from 'react'
import { FACILITY_COLORS, type WallSpec } from './facility'

export interface WallProps extends WallSpec {
  children?: ReactNode
  friction?: number
  restitution?: number
  castShadow?: boolean
  receiveShadow?: boolean
  textured?: boolean
}

function WallTextureStripes({ size }: { size: WallSpec['size'] }) {
  const [width, height, depth] = size
  const longOnX = width >= depth
  const stripeColor = FACILITY_COLORS.outerWallStripe
  const topY = Math.min(height / 2 - 0.38, 1.15)
  const lowerY = Math.max(-height / 2 + 0.52, -0.75)
  const stripeLength = longOnX ? width * 0.86 : depth * 0.86

  if (longOnX) {
    return (
      <>
        {[-1, 1].map((side) => (
          <group key={`x-stripes-${side}`} position={[0, 0, side * (depth / 2 + 0.018)]}>
            <mesh position={[0, topY, 0]}>
              <boxGeometry args={[stripeLength, 0.08, 0.035]} />
              <meshStandardMaterial color={stripeColor} emissive={stripeColor} emissiveIntensity={0.12} />
            </mesh>
            <mesh position={[0, lowerY, 0]}>
              <boxGeometry args={[stripeLength * 0.72, 0.06, 0.035]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.05} />
            </mesh>
          </group>
        ))}
      </>
    )
  }

  return (
    <>
      {[-1, 1].map((side) => (
        <group key={`z-stripes-${side}`} position={[side * (width / 2 + 0.018), 0, 0]}>
          <mesh position={[0, topY, 0]}>
            <boxGeometry args={[0.035, 0.08, stripeLength]} />
            <meshStandardMaterial color={stripeColor} emissive={stripeColor} emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0, lowerY, 0]}>
            <boxGeometry args={[0.035, 0.06, stripeLength * 0.72]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.05} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// Fixed axis-aligned wall helper for Rapier-backed facility geometry.
export function Wall({
  position,
  size,
  color = FACILITY_COLORS.outerWall,
  children,
  friction = 0.9,
  restitution = 0,
  castShadow = true,
  receiveShadow = true,
  textured = true,
}: WallProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={restitution} friction={friction} position={position}>
      <group>
        <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
          <boxGeometry args={size} />
          <meshStandardMaterial color={color} roughness={0.62} metalness={0.02} />
        </mesh>
        {textured && <WallTextureStripes size={size} />}
        {children}
      </group>
    </RigidBody>
  )
}
