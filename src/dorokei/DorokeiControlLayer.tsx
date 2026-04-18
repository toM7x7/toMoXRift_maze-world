import { Text } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { Interactable } from '@xrift/world-components'
import { FACILITY_BOARDS } from '../facility/facility'
import { OverheadScoreboard } from '../facility/OverheadScoreboard'
import { DorokeiRadarHud } from './DorokeiRadarHud'
import {
  DOROKEI_CAPTURE_RADIUS,
  DOROKEI_JAIL_SPAWN,
  DOROKEI_RADAR_PERIOD_MS,
  DOROKEI_RADAR_VISIBLE_MS,
  DOROKEI_RELEASE_SPAWN,
  type DorokeiParticipant,
  type DorokeiRole,
} from './types'
import { useDorokeiGame } from './useDorokeiGame'

const ADMIN_AREA_ORIGIN = [...FACILITY_BOARDS.debug.position] as [number, number, number]

const JAIL_WALLS: Array<{
  position: [number, number, number]
  size: [number, number, number]
}> = [
  { position: [9.35, 0.65, 18.35], size: [4.1, 1.3, 0.18] },
  { position: [11.3, 0.65, 16.85], size: [0.18, 1.3, 3.2] },
  { position: [9.35, 0.65, 15.35], size: [4.1, 1.3, 0.18] },
]

function roleLabel(role: DorokeiRole | null) {
  if (role === 'chaser') return '警察'
  if (role === 'runner') return '泥棒'
  return '観戦/未設定'
}

function roleColor(role: DorokeiRole | null) {
  if (role === 'chaser') return '#fca5a5'
  if (role === 'runner') return '#86efac'
  return '#cbd5e1'
}

function RoleButton({
  role,
  active,
  onSelect,
}: {
  role: DorokeiRole
  active: boolean
  onSelect: (role: DorokeiRole) => void
}) {
  const color = role === 'chaser' ? '#dc2626' : '#16a34a'
  const label = roleLabel(role)

  return (
    <Interactable
      id={`dorokei-role-${role}`}
      interactionText={`${label}になる`}
      onInteract={() => onSelect(role)}
    >
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.42, 0.18]} />
          <meshStandardMaterial
            color={active ? '#f8fafc' : color}
            emissive={color}
            emissiveIntensity={active ? 0.85 : 0.32}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 0, 0.12]} fontSize={0.13} color={active ? '#0f172a' : '#ffffff'} anchorX="center" anchorY="middle">
        {active ? `${label}中` : label}
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
          <boxGeometry args={[1.35, 0.38, 0.18]} />
          <meshStandardMaterial
            color={enabled ? color : '#475569'}
            emissive={enabled ? color : '#1e293b'}
            emissiveIntensity={enabled ? 0.38 : 0.1}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 0, 0.12]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
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

function ParticipantRows({ participants }: { participants: DorokeiParticipant[] }) {
  const visibleParticipants = participants.slice(0, 10)

  return (
    <>
      {visibleParticipants.map((participant, index) => (
        <Text
          key={participant.userId}
          position={[-1.55, 0.46 - index * 0.2, 0.07]}
          fontSize={0.086}
          color={participant.jailed ? '#fca5a5' : roleColor(participant.role)}
          anchorX="left"
          anchorY="middle"
          maxWidth={3.2}
        >
          {`${participant.isLocal ? '自分 ' : ''}${participant.displayName}: ${roleLabel(participant.role)}${participant.jailed ? ' / 牢屋' : ''}`}
        </Text>
      ))}
      {participants.length > visibleParticipants.length ? (
        <Text position={[-1.55, 0.46 - visibleParticipants.length * 0.2, 0.07]} fontSize={0.078} color="#cbd5e1" anchorX="left" anchorY="middle">
          {`他 ${participants.length - visibleParticipants.length} 名`}
        </Text>
      ) : null}
    </>
  )
}

function AdminDebugArea({
  onJailSelf,
  onFreeSelf,
  onRadarNow,
  onReset,
}: {
  onJailSelf: () => void
  onFreeSelf: () => void
  onRadarNow: () => void
  onReset: () => void
}) {
  return (
    <group position={ADMIN_AREA_ORIGIN}>
      <RigidBody type="fixed" colliders="cuboid" restitution={0} friction={1}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[8, 0.18, 5]} />
          <meshStandardMaterial color="#111827" transparent opacity={0.22} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 0.9, -2.38]}>
        <boxGeometry args={[6.4, 1.8, 0.12]} />
        <meshStandardMaterial color="#111827" emissive="#1f2937" emissiveIntensity={0.38} transparent opacity={0.92} />
      </mesh>
      <Text position={[0, 1.48, -2.28]} fontSize={0.18} color="#fed7aa" anchorX="center" anchorY="middle">
        管理者用デバッグ
      </Text>
      <Text position={[0, 1.18, -2.28]} fontSize={0.09} color="#fdba74" anchorX="center" anchorY="middle" maxWidth={5.6}>
        通常プレイ導線から外した非表示エリアです。必要時だけ管理者が座標移動して使います。
      </Text>
      <group position={[-2.25, 0.7, -2.24]} scale={0.82}>
        <ActionButton id="dorokei-debug-jail-self" label="自分を牢屋" color="#b91c1c" interactionText="管理者: 自分を牢屋へ送る" onInteract={onJailSelf} />
      </group>
      <group position={[-0.75, 0.7, -2.24]} scale={0.82}>
        <ActionButton id="dorokei-debug-free-self" label="自分を解放" color="#0f766e" interactionText="管理者: 自分を解放する" onInteract={onFreeSelf} />
      </group>
      <group position={[0.75, 0.7, -2.24]} scale={0.82}>
        <ActionButton id="dorokei-debug-radar-now" label="レーダー" color="#1d4ed8" interactionText="管理者: レーダー表示を即時発生" onInteract={onRadarNow} />
      </group>
      <group position={[2.25, 0.7, -2.24]} scale={0.82}>
        <ActionButton id="dorokei-debug-reset-state" label="全初期化" color="#a16207" interactionText="管理者: ドロケイ状態を初期化" onInteract={onReset} />
      </group>
    </group>
  )
}

export function DorokeiControlLayer() {
  const game = useDorokeiGame()
  const isRunning = game.state.phase === 'running'
  const spectators = Math.max(0, game.counts.connectedUsers - game.counts.chasers - game.counts.runners)
  const localStateText = game.localJailed ? '牢屋' : isRunning ? '参加中' : '待機中'
  const radarText = `${DOROKEI_RADAR_PERIOD_MS / 1000}秒ごとに${DOROKEI_RADAR_VISIBLE_MS / 1000}秒表示`

  return (
    <>
      <DorokeiRadarHud
        isActive={isRunning}
        isRunning={isRunning}
        localRole={game.localRole}
        localJailed={game.localJailed}
        roleMap={game.state.rolesByUserId}
        jailedMap={game.state.jailedByUserId}
        roundStartedAt={game.state.roundStartedAt}
        position={[0.92, 1.48, 1.85]}
        scale={0.42}
      />

      <OverheadScoreboard
        title="ドロケイ スコア"
        subtitle="頭上を見上げると全員が確認できます"
        metrics={[
          { id: 'chasers', label: '警察', value: game.counts.chasers, accentColor: '#f87171' },
          { id: 'runners', label: '泥棒', value: game.counts.runners, accentColor: '#4ade80' },
          { id: 'jailed', label: '牢屋', value: game.counts.jailedRunners, accentColor: '#f59e0b' },
          { id: 'spectators', label: '観戦', value: spectators, accentColor: '#60a5fa' },
        ]}
        status={isRunning ? '試合中' : '待機中'}
        footer="ゲーム中は警察・泥棒・牢屋人数を優先表示"
        position={[...FACILITY_BOARDS.scoreboard.position]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={FACILITY_BOARDS.scoreboard.scale}
        width={15.5}
        height={3}
      />

      <group position={[-21.42, 2.7, 7.7]} rotation={[0, Math.PI / 2, 0]} scale={0.54}>
        <mesh position={[0, 0.08, -0.06]}>
          <boxGeometry args={[5.3, 2.9, 0.12]} />
          <meshStandardMaterial color="#111827" emissive="#0f172a" emissiveIntensity={0.48} transparent opacity={0.9} />
        </mesh>
        <Text position={[0, 1.18, 0.05]} fontSize={0.2} color="#f8fafc" anchorX="center" anchorY="middle">
          ドロケイ操作
        </Text>
        <Text position={[0, 0.82, 0.05]} fontSize={0.1} color="#cbd5e1" anchorX="center" anchorY="middle" maxWidth={4.7}>
          警察が泥棒へ{DOROKEI_CAPTURE_RADIUS.toFixed(2)}m以内でタッチ。泥棒は牢屋入口か捕まった人をタッチして救出。
        </Text>
        <Text position={[0, 0.52, 0.05]} fontSize={0.11} color="#93c5fd" anchorX="center" anchorY="middle">
          {`あなた: ${game.localUser.displayName} / ${roleLabel(game.localRole)} / ${localStateText}`}
        </Text>
        <Text position={[0, 0.27, 0.05]} fontSize={0.095} color="#fef08a" anchorX="center" anchorY="middle">
          {`レーダー: ${radarText}`}
        </Text>
        <group position={[-1.45, -0.16, 0.06]}>
          <RoleButton role="chaser" active={game.localRole === 'chaser'} onSelect={game.selectRole} />
        </group>
        <group position={[0, -0.16, 0.06]}>
          <RoleButton role="runner" active={game.localRole === 'runner'} onSelect={game.selectRole} />
        </group>
        <group position={[1.45, -0.16, 0.06]}>
          <ActionButton
            id="dorokei-start"
            label={isRunning ? '試合中' : '開始'}
            color="#2563eb"
            interactionText={game.canStartRound ? 'ドロケイを開始' : '警察と泥棒を1人以上設定してください'}
            enabled={!isRunning && game.canStartRound}
            onInteract={game.startRound}
          />
        </group>
        <group position={[0, -0.72, 0.06]}>
          <ActionButton
            id="dorokei-reset"
            label="リセット"
            color="#f97316"
            interactionText="ドロケイを待機状態に戻す"
            onInteract={game.resetRound}
          />
        </group>
      </group>

      <group position={[21.42, 2.55, 9.6]} rotation={[0, -Math.PI / 2, 0]} scale={0.52}>
        <mesh position={[0, -0.05, -0.06]}>
          <boxGeometry args={[4.3, 3.1, 0.12]} />
          <meshStandardMaterial color="#07111f" emissive="#0f172a" emissiveIntensity={0.38} transparent opacity={0.88} />
        </mesh>
        <Text position={[0, 1.22, 0.05]} fontSize={0.17} color="#f8fafc" anchorX="center" anchorY="middle">
          参加者 / 役割
        </Text>
        <Text position={[0, 0.95, 0.05]} fontSize={0.1} color="#fef08a" anchorX="center" anchorY="middle">
          {`警察人数: ${game.state.policeTargetCount ?? 1} / 参加 ${game.counts.connectedUsers}`}
        </Text>
        <group position={[-1.08, 0.72, 0.05]} scale={0.62}>
          <ActionButton
            id="dorokei-police-minus"
            label="- 警察"
            color="#475569"
            interactionText="ランダム分けの警察人数を減らす"
            onInteract={() => game.adjustPoliceTargetCount(-1)}
          />
        </group>
        <group position={[0.42, 0.72, 0.05]} scale={0.62}>
          <ActionButton
            id="dorokei-police-plus"
            label="+ 警察"
            color="#475569"
            interactionText="ランダム分けの警察人数を増やす"
            onInteract={() => game.adjustPoliceTargetCount(1)}
          />
        </group>
        <group position={[1.35, 0.72, 0.05]} scale={0.62}>
          <ActionButton
            id="dorokei-random-teams"
            label="ランダム"
            color="#7c3aed"
            interactionText="指定人数で警察と泥棒をランダム分け"
            onInteract={game.randomizeTeams}
          />
        </group>
        <ParticipantRows participants={game.participants} />
      </group>

      <group position={[-21.42, 1.02, 4.4]} rotation={[0, Math.PI / 2, 0]} scale={0.42}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[4.4, 1.16, 0.1]} />
          <meshStandardMaterial color="#102018" emissive="#052e16" emissiveIntensity={0.28} transparent opacity={0.86} />
        </mesh>
        <Text position={[0, 0.3, 0.05]} fontSize={0.14} color="#bbf7d0" anchorX="center" anchorY="middle">
          次の追加モード案
        </Text>
        <Text position={[0, -0.05, 0.05]} fontSize={0.09} color="#dcfce7" anchorX="center" anchorY="middle" maxWidth={3.85}>
          泥棒がビーコンを集める「収集ドロケイ」。警察は回収完了前に捕まえる。
        </Text>
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
          interactionText="牢屋の泥棒を全員解放"
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
          救出ゲート
        </Text>
      </group>

      <Text position={[9.35, 1.7, 16.85]} rotation={[0, Math.PI, 0]} fontSize={0.2} color="#e2e8f0" anchorX="center" anchorY="middle">
        牢屋
      </Text>
      <Text position={[DOROKEI_RELEASE_SPAWN[0], 0.18, DOROKEI_RELEASE_SPAWN[2]]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="#ccfbf1" anchorX="center" anchorY="middle">
        解放
      </Text>

      <AdminDebugArea
        onJailSelf={game.debugJailSelf}
        onFreeSelf={game.debugFreeSelf}
        onRadarNow={game.debugForceRadarPulse}
        onReset={game.debugResetState}
      />
    </>
  )
}
