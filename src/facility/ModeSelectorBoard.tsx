import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Interactable } from '@xrift/world-components'

export interface ModeSelectorOption {
  id: string
  label: string
  description?: string
  accentColor?: string
  disabled?: boolean
}

export interface ModeSelectorBoardProps {
  title: string
  subtitle?: string
  options: ModeSelectorOption[]
  activeOptionId?: string
  onSelectOption: (optionId: string) => void
  interactionText?: (option: ModeSelectorOption) => string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  width?: number
  height?: number
}

function getButtonPosition(index: number, total: number, gapX: number, gapY: number): [number, number, number] {
  const columns = total > 2 ? 2 : 1
  const row = Math.floor(index / columns)
  const column = columns === 1 ? 0 : index % columns
  const centeredX = columns === 1 ? 0 : (column === 0 ? -gapX / 2 : gapX / 2)
  const centeredY = -row * gapY

  return [centeredX, centeredY, 0]
}

function ModeOptionButton({
  option,
  active,
  onSelect,
  interactionText,
}: {
  option: ModeSelectorOption
  active: boolean
  onSelect: (optionId: string) => void
  interactionText?: (option: ModeSelectorOption) => string
}) {
  const accentColor = option.accentColor ?? '#3b82f6'

  return (
    <Interactable
      id={`mode-selector-${option.id}`}
      interactionText={interactionText ? interactionText(option) : `${option.label}を選択`}
      onInteract={() => {
        if (!option.disabled) {
          onSelect(option.id)
        }
      }}
      enabled={!option.disabled}
    >
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={0.9}>
        <mesh castShadow>
          <boxGeometry args={[2.05, 0.58, 0.18]} />
          <meshStandardMaterial
            color={active ? '#f8fafc' : accentColor}
            emissive={accentColor}
            emissiveIntensity={active ? 0.95 : 0.38}
            roughness={0.34}
            metalness={0.14}
          />
        </mesh>
      </RigidBody>

      <Text
        position={[0, 0.06, 0.11]}
        fontSize={0.14}
        color={active ? '#0f172a' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.72}
        lineHeight={1.05}
      >
        {option.label}
      </Text>

      {option.description && (
        <Text
          position={[0, -0.14, 0.11]}
          fontSize={0.072}
          color={active ? '#1e293b' : '#dbeafe'}
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
          lineHeight={1}
        >
          {option.description}
        </Text>
      )}
    </Interactable>
  )
}

export function ModeSelectorBoard({
  title,
  subtitle,
  options,
  activeOptionId,
  onSelectOption,
  interactionText,
  position = [0, 1.7, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width,
  height,
}: ModeSelectorBoardProps) {
  const boardWidth = width ?? (options.length > 2 ? 5.4 : 4.4)
  const boardHeight = height ?? (options.length > 2 ? 2.8 : 2.2)
  const columns = options.length > 2 ? 2 : 1
  const gapX = columns === 1 ? 0 : 2.4
  const gapY = options.length > 2 ? 0.92 : 0.78

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boardWidth, boardHeight, 0.18]} />
          <meshStandardMaterial color="#0f172a" emissive="#111827" emissiveIntensity={0.34} roughness={0.82} />
        </mesh>
      </RigidBody>

      <mesh position={[0, 0, -0.12]} castShadow receiveShadow>
        <boxGeometry args={[boardWidth - 0.2, boardHeight - 0.2, 0.04]} />
        <meshStandardMaterial color="#111827" opacity={0.62} transparent />
      </mesh>

      <Text
        position={[0, boardHeight * 0.32, 0.12]}
        fontSize={0.24}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          position={[0, boardHeight * 0.12, 0.12]}
          fontSize={0.1}
          color="#cbd5e1"
          anchorX="center"
          anchorY="middle"
          maxWidth={boardWidth - 0.7}
          lineHeight={1.05}
        >
          {subtitle}
        </Text>
      )}

      {options.map((option, index) => {
        const [x, y, z] = getButtonPosition(index, options.length, gapX, gapY)
        return (
          <group key={option.id} position={[x, y - 0.18, z + 0.14]}>
            <ModeOptionButton
              option={option}
              active={option.id === activeOptionId}
              onSelect={onSelectOption}
              interactionText={interactionText}
            />
          </group>
        )
      })}
    </group>
  )
}
