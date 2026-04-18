import { BackSide } from 'three'
import { FACILITY_COLORS } from './facility'

export interface SkyboxProps {
  radius?: number
}

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

// Procedural skydome extracted from the current maze-world scene.
export function Skybox({ radius = 170 }: SkyboxProps) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 48, 24]} />
        <meshBasicMaterial color={FACILITY_COLORS.sky} side={BackSide} />
      </mesh>
      <mesh position={[0, 22, -82]}>
        <torusGeometry args={[44, 0.18, 8, 96]} />
        <meshBasicMaterial color={FACILITY_COLORS.skyRing} transparent opacity={0.22} />
      </mesh>
      <mesh position={[-42, 58, -74]}>
        <sphereGeometry args={[4.8, 24, 12]} />
        <meshBasicMaterial color={FACILITY_COLORS.moon} transparent opacity={0.92} />
      </mesh>
      {SKY_STARS.map(([x, y, z, starRadius], index) => (
        <mesh key={`sky-star-${index}`} position={[x, y, z]}>
          <sphereGeometry args={[starRadius, 8, 8]} />
          <meshBasicMaterial color={index % 5 === 0 ? FACILITY_COLORS.starCold : FACILITY_COLORS.starWarm} />
        </mesh>
      ))}
    </group>
  )
}
