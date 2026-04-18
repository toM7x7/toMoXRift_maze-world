import { RigidBody } from '@react-three/rapier'
import type { ReactNode } from 'react'
import type { WallSpec } from './facility'

export interface WallProps extends WallSpec {
  children?: ReactNode
  friction?: number
  restitution?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

// Fixed axis-aligned wall helper for Rapier-backed facility geometry.
export function Wall({
  position,
  size,
  color = '#353c4e',
  children,
  friction = 0.9,
  restitution = 0,
  castShadow = true,
  receiveShadow = true,
}: WallProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid" restitution={restitution} friction={friction} position={position}>
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
        {children}
      </mesh>
    </RigidBody>
  )
}
