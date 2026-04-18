import { useFrame } from '@react-three/fiber'
import {
  useInstanceState,
  useTeleport,
  useUsers,
  type PlayerMovement,
  type User,
} from '@xrift/world-components'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  DOROKEI_ACTION_COOLDOWN_MS,
  DOROKEI_CAPTURE_RADIUS,
  DOROKEI_INSTANCE_STATE_ID,
  DOROKEI_JAIL_RETURN_COOLDOWN_MS,
  DOROKEI_JAIL_RETURN_RADIUS,
  DOROKEI_JAIL_SPAWN,
  DOROKEI_LOBBY_SPAWN,
  DOROKEI_RESCUE_RADIUS,
  DOROKEI_RELEASE_SPAWN,
  createInitialDorokeiGameState,
  type DorokeiCounts,
  type DorokeiGameState,
  type DorokeiJailState,
  type DorokeiParticipant,
  type DorokeiRole,
} from './types'

const LOCAL_DEV_USER_ID = 'local-dev-player'
const LOCAL_DEV_USER: User = {
  id: LOCAL_DEV_USER_ID,
  displayName: 'Local Player',
  avatarUrl: null,
  isGuest: true,
}

function horizontalDistance(a: PlayerMovement['position'], b: PlayerMovement['position']) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

function readJail(state: DorokeiGameState, userId: string): DorokeiJailState | null {
  return state.jailedByUserId[userId] ?? null
}

function isJailed(state: DorokeiGameState, userId: string) {
  return Boolean(readJail(state, userId)?.jailed)
}

function countGameState(
  state: DorokeiGameState,
  connectedUsers: number,
): DorokeiCounts {
  const roles = Object.entries(state.rolesByUserId)
  const chasers = roles.filter(([, role]) => role === 'chaser').length
  const runners = roles.filter(([, role]) => role === 'runner').length
  const jailedRunners = roles.filter(
    ([userId, role]) => role === 'runner' && isJailed(state, userId),
  ).length

  return {
    connectedUsers,
    chasers,
    runners,
    freeRunners: Math.max(0, runners - jailedRunners),
    jailedRunners,
  }
}

function clampPoliceCount(value: number, participantCount: number) {
  return Math.max(1, Math.min(Math.max(1, participantCount), value))
}

function shuffleUserIds(userIds: string[]) {
  return userIds
    .map((userId) => ({ userId, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ userId }) => userId)
}

export function useDorokeiGame() {
  const { localUser, remoteUsers, getLocalMovement, getMovement } = useUsers()
  const { teleport } = useTeleport()
  const [state, setState] = useInstanceState<DorokeiGameState>(
    DOROKEI_INSTANCE_STATE_ID,
    createInitialDorokeiGameState(),
  )
  const lastCaptureAtRef = useRef(0)
  const lastRescueAtRef = useRef(0)
  const lastJailReturnAtRef = useRef(0)
  const lastLocalJailedRef = useRef<boolean | null>(null)

  const effectiveLocalUser = localUser ?? LOCAL_DEV_USER
  const localUserId = effectiveLocalUser.id
  const localRole = state.rolesByUserId[localUserId] ?? null
  const localJail = readJail(state, localUserId)
  const localJailed = Boolean(localJail?.jailed)
  const participants = useMemo<DorokeiParticipant[]>(() => {
    const users = [effectiveLocalUser, ...remoteUsers]
    return users.map((user) => ({
      userId: user.id,
      displayName: user.displayName || (user.id === localUserId ? 'あなた' : '参加者'),
      role: state.rolesByUserId[user.id] ?? null,
      jailed: isJailed(state, user.id),
      isLocal: user.id === localUserId,
    }))
  }, [effectiveLocalUser, localUserId, remoteUsers, state])
  const counts = useMemo(
    () => countGameState(state, participants.length),
    [participants.length, state],
  )
  const canStartRound = counts.chasers > 0 && counts.runners > 0

  const selectRole = useCallback(
    (role: DorokeiRole) => {
      setState((current) => ({
        ...current,
        rolesByUserId: {
          ...current.rolesByUserId,
          [localUserId]: role,
        },
      }))
    },
    [localUserId, setState],
  )

  const adjustPoliceTargetCount = useCallback(
    (delta: number) => {
      setState((current) => ({
        ...current,
        policeTargetCount: clampPoliceCount(
          (current.policeTargetCount ?? 1) + delta,
          participants.length,
        ),
      }))
    },
    [participants.length, setState],
  )

  const randomizeTeams = useCallback(() => {
    setState((current) => {
      const userIds = participants.map((participant) => participant.userId)
      if (userIds.length === 0) {
        return current
      }

      const policeCount = clampPoliceCount(
        current.policeTargetCount ?? 1,
        userIds.length,
      )
      const policeIds = new Set(shuffleUserIds(userIds).slice(0, policeCount))
      const rolesByUserId: Record<string, DorokeiRole> = {}

      for (const userId of userIds) {
        rolesByUserId[userId] = policeIds.has(userId) ? 'chaser' : 'runner'
      }

      return {
        ...current,
        policeTargetCount: policeCount,
        rolesByUserId,
      }
    })
  }, [participants, setState])

  const startRound = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: 'running',
      roundStartedAt: Date.now(),
      roundEndedAt: null,
      jailedByUserId: {},
      lastCaptureAt: null,
      lastRescueAt: null,
      lastCapture: null,
      lastRescue: null,
    }))
    teleport({ position: DOROKEI_LOBBY_SPAWN, yaw: 180 })
  }, [setState, teleport])

  const resetRound = useCallback(() => {
    setState((current) => ({
      ...createInitialDorokeiGameState(),
      rolesByUserId: current.rolesByUserId,
      lastResetAt: Date.now(),
    }))
    teleport({ position: DOROKEI_LOBBY_SPAWN, yaw: 180 })
  }, [setState, teleport])

  const captureRunner = useCallback(
    (runnerId: string, distance = 0) => {
      const now = Date.now()
      setState((current) => {
        if (
          current.phase !== 'running' ||
          current.rolesByUserId[runnerId] !== 'runner' ||
          current.jailedByUserId[runnerId]?.jailed
        ) {
          return current
        }

        return {
          ...current,
          jailedByUserId: {
            ...current.jailedByUserId,
            [runnerId]: {
              jailed: true,
              jailedAt: now,
              releasedAt: null,
              capturedByUserId: localUserId,
              releasedByUserId: null,
              lastUpdatedAt: now,
            },
          },
          lastCaptureAt: now,
          lastCapture: {
            capturedAt: now,
            capturedByUserId: localUserId,
            targetUserId: runnerId,
            distance,
            source: 'touch',
          },
        }
      })
    },
    [localUserId, setState],
  )

  const rescueRunner = useCallback(
    (runnerId: string, source: 'touch' | 'menu' = 'touch') => {
      const now = Date.now()
      setState((current) => {
        if (!current.jailedByUserId[runnerId]?.jailed) {
          return current
        }

        return {
          ...current,
          jailedByUserId: {
            ...current.jailedByUserId,
            [runnerId]: {
              ...current.jailedByUserId[runnerId],
              jailed: false,
              releasedAt: now,
              releasedByUserId: localUserId,
              lastUpdatedAt: now,
            },
          },
          lastRescueAt: now,
          lastRescue: {
            rescuedAt: now,
            rescuedByUserId: localUserId,
            rescuedUserIds: [runnerId],
            mode: 'single',
            source,
          },
        }
      })
    },
    [localUserId, setState],
  )

  const rescueAll = useCallback(() => {
    const now = Date.now()
    setState((current) => {
      const jailedIds = Object.entries(current.jailedByUserId)
        .filter(([, record]) => record.jailed)
        .map(([userId]) => userId)

      if (jailedIds.length === 0) {
        return current
      }

      const nextJailedByUserId = { ...current.jailedByUserId }
      for (const userId of jailedIds) {
        nextJailedByUserId[userId] = {
          ...nextJailedByUserId[userId],
          jailed: false,
          releasedAt: now,
          releasedByUserId: localUserId,
          lastUpdatedAt: now,
        }
      }

      return {
        ...current,
        jailedByUserId: nextJailedByUserId,
        lastRescueAt: now,
        lastRescue: {
          rescuedAt: now,
          rescuedByUserId: localUserId,
          rescuedUserIds: jailedIds,
          mode: 'all',
          source: 'menu',
        },
      }
    })
  }, [localUserId, setState])

  const debugJailSelf = useCallback(() => {
    const now = Date.now()
    setState((current) => ({
      ...current,
      phase: 'running',
      roundStartedAt: current.roundStartedAt ?? now,
      roundEndedAt: null,
      rolesByUserId: {
        ...current.rolesByUserId,
        [localUserId]: 'runner',
      },
      jailedByUserId: {
        ...current.jailedByUserId,
        [localUserId]: {
          jailed: true,
          jailedAt: now,
          releasedAt: null,
          capturedByUserId: 'solo-debug',
          releasedByUserId: null,
          lastUpdatedAt: now,
        },
      },
      lastCaptureAt: now,
      lastCapture: {
        capturedAt: now,
        capturedByUserId: 'solo-debug',
        targetUserId: localUserId,
        distance: 0,
        source: 'system',
      },
    }))
  }, [localUserId, setState])

  const debugFreeSelf = useCallback(() => {
    const now = Date.now()
    setState((current) => ({
      ...current,
      jailedByUserId: {
        ...current.jailedByUserId,
        [localUserId]: {
          ...(current.jailedByUserId[localUserId] ?? {
            jailedAt: null,
            capturedByUserId: null,
          }),
          jailed: false,
          releasedAt: now,
          releasedByUserId: 'solo-debug',
          lastUpdatedAt: now,
        },
      },
      lastRescueAt: now,
      lastRescue: {
        rescuedAt: now,
        rescuedByUserId: 'solo-debug',
        rescuedUserIds: [localUserId],
        mode: 'single',
        source: 'system',
      },
    }))
  }, [localUserId, setState])

  const debugForceRadarPulse = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: 'running',
      roundStartedAt: Date.now(),
      roundEndedAt: null,
    }))
  }, [setState])

  const debugResetState = useCallback(() => {
    setState({
      ...createInitialDorokeiGameState(),
      lastResetAt: Date.now(),
    })
    teleport({ position: DOROKEI_LOBBY_SPAWN, yaw: 180 })
  }, [setState, teleport])

  useEffect(() => {
    if (lastLocalJailedRef.current === localJailed) {
      return
    }

    const wasJailed = lastLocalJailedRef.current === true
    lastLocalJailedRef.current = localJailed

    if (localJailed) {
      teleport({ position: DOROKEI_JAIL_SPAWN, yaw: 270 })
      return
    }

    if (wasJailed) {
      teleport({ position: DOROKEI_RELEASE_SPAWN, yaw: 180 })
    }
  }, [localJailed, teleport])

  useFrame(() => {
    if (state.phase !== 'running') {
      return
    }

    const now = Date.now()
    const localMovement = getLocalMovement()
    const localPosition = localMovement.position

    if (localJailed) {
      const jailDistance = horizontalDistance(localPosition, {
        x: DOROKEI_JAIL_SPAWN[0],
        y: DOROKEI_JAIL_SPAWN[1],
        z: DOROKEI_JAIL_SPAWN[2],
      })

      if (
        jailDistance > DOROKEI_JAIL_RETURN_RADIUS &&
        now - lastJailReturnAtRef.current > DOROKEI_JAIL_RETURN_COOLDOWN_MS
      ) {
        lastJailReturnAtRef.current = now
        teleport({ position: DOROKEI_JAIL_SPAWN, yaw: 270 })
      }
      return
    }

    if (localRole === 'chaser') {
      if (now - lastCaptureAtRef.current < DOROKEI_ACTION_COOLDOWN_MS) {
        return
      }

      const target = remoteUsers
        .map((user) => ({ user, movement: getMovement(user.id) }))
        .find(({ user, movement }) => {
          if (
            !movement ||
            state.rolesByUserId[user.id] !== 'runner' ||
            isJailed(state, user.id)
          ) {
            return false
          }

          return horizontalDistance(localPosition, movement.position) <= DOROKEI_CAPTURE_RADIUS
        })

      if (target?.movement) {
        lastCaptureAtRef.current = now
        captureRunner(
          target.user.id,
          horizontalDistance(localPosition, target.movement.position),
        )
      }
      return
    }

    if (localRole === 'runner') {
      if (now - lastRescueAtRef.current < DOROKEI_ACTION_COOLDOWN_MS) {
        return
      }

      const target = remoteUsers
        .map((user) => ({ user, movement: getMovement(user.id) }))
        .find(({ user, movement }) => {
          if (!movement || !isJailed(state, user.id)) {
            return false
          }

          return horizontalDistance(localPosition, movement.position) <= DOROKEI_RESCUE_RADIUS
        })

      if (target) {
        lastRescueAtRef.current = now
        rescueRunner(target.user.id)
      }
    }
  })

  return {
    state,
    localUser: effectiveLocalUser,
    localUserId,
    localRole,
    localJail,
    localJailed,
    participants,
    counts,
    canStartRound,
    selectRole,
    adjustPoliceTargetCount,
    randomizeTeams,
    startRound,
    resetRound,
    captureRunner,
    rescueRunner,
    rescueAll,
    debugJailSelf,
    debugFreeSelf,
    debugForceRadarPulse,
    debugResetState,
  }
}
