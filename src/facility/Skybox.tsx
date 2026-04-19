import { BackSide } from 'three'
import { FACILITY_COLORS } from './facility'

export interface SkyboxProps {
  radius?: number
}

const CLOUDS: Array<[number, number, number, number]> = [
  [-54, 42, -64, 1.4],
  [-48, 44, -66, 1.1],
  [-42, 42, -63, 1.25],
  [34, 46, -74, 1.5],
  [41, 48, -76, 1.15],
  [47, 45, -73, 1.25],
  [-14, 52, -92, 1.2],
  [-7, 54, -94, 1.5],
  [1, 52, -91, 1.05],
  [58, 38, 10, 1.2],
  [64, 40, 12, 1.45],
  [70, 38, 9, 1.1],
]

// Bright procedural skydome for the entrance-first event facility.
export function Skybox({ radius = 170 }: SkyboxProps) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 48, 24]} />
        <meshBasicMaterial color={FACILITY_COLORS.sky} side={BackSide} />
      </mesh>
      <mesh position={[0, 4, -92]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[78, 0.3, 10, 128]} />
        <meshBasicMaterial color={FACILITY_COLORS.skyHorizon} transparent opacity={0.42} />
      </mesh>
      <mesh position={[-46, 64, -84]}>
        <sphereGeometry args={[7.4, 32, 16]} />
        <meshBasicMaterial color={FACILITY_COLORS.sun} transparent opacity={0.96} />
      </mesh>
      <mesh position={[-46, 64, -84]}>
        <sphereGeometry args={[10.5, 32, 16]} />
        <meshBasicMaterial color={FACILITY_COLORS.sun} transparent opacity={0.18} />
      </mesh>
      {CLOUDS.map(([x, y, z, scale], index) => (
        <mesh key={`sky-cloud-${index}`} position={[x, y, z]} scale={[scale * 5, scale * 1.2, scale * 2.1]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshBasicMaterial color={FACILITY_COLORS.cloud} transparent opacity={0.78} />
        </mesh>
      ))}
    </group>
  )
}
