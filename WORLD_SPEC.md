# Echo Maze

- Slug: `maze-world`
- Template: `WebXR-JP/xrift-test-world`
- Created: `2026-03-17T03:48:19.598Z`
- Blueprint: `../../blueprints/maze-world.md`

## XRift Metadata

- Title: `Echo Maze`
- Description: `Cooperative maze run where players activate beacons and open a timed exit gate`

## Implementation Direction (v0)

- Keep one-floor maze first. Do not introduce vertical complexity until interaction sync is stable.
- Reuse `xrift-test-world` physics and wall patterns as base, then replace with maze corridor blocks.
- Core interactive state is a single object in `useInstanceState`:
  - `beacons: { a: boolean, b: boolean, c: boolean }`
  - `gateOpen: boolean`
  - `gateOpenedAt: number | null`
- Gate open condition is deterministic:
  - all beacon booleans true -> gate opens for 20 seconds
  - after timeout, gate closes and beacons reset for next run

## Suggested Component Mapping

- `SpawnPoint`: hub spawn + optional retry spawn.
- `Interactable`: each beacon switch and retry console.
- `TagBoard`: objective board and progress display ("2/3 beacons active").
- `EntryLogBoard`: show recent clear times for social competition.
- `Portal`: optional post-clear shortcut back to hub.

## Playtest Checklist

1. 1-player run: confirm full loop and timeout reset.
2. 2-player run: verify both users see synchronized beacon and gate state.
3. 4-player run: verify no race conditions when two users activate beacons simultaneously.
4. Observer test: completed player can guide active players without blocking paths.

## Risks and Mitigations

- Risk: maze feels confusing, not exciting.
- Mitigation: add clear landmark props per sector and distinct ambient color tint.

- Risk: interaction desync under concurrent input.
- Mitigation: centralize state transitions in one handler and ignore duplicate activate calls.

- Risk: downtime after failure causes drop-off.
- Mitigation: add one-tap retry interactable in hub and keep restart under 5 seconds.

## Source Blueprint

# Goal

Players spawn into a foggy maze, activate three beacon switches, and escape through a timed goal gate before it closes.

## Why This World Exists

- Core payoff is "shared orientation panic -> coordinated breakthrough."
- XRift fit: live presence, in-world voice, and shared interactables make route-calling and role-splitting naturally social.

## Core Loop

1. Player spawns in a safe hub with a clear objective board.
2. Player enters the maze and finds beacon switches (A/B/C).
3. Each beacon is activated via `Interactable`; global state tracks progress.
4. Final gate opens for 20 seconds after all beacons are on.
5. Players escape to goal room, see completion board, and retry for better clear time.

## Systems To Validate

- Navigation readability in low-visibility maze corridors (can first-time users orient fast enough).
- Multi-user switch synchronization using `useInstanceState` and shared interactable IDs.
- Gate timing pressure: 20-second open window should feel urgent but fair.

## XRift Components To Try First

- SpawnPoint
- Interactable
- TagBoard
- EntryLogBoard
- Portal

## World Layout Notes

- Entry area: compact safe hub with objective board, rules, and visible maze entrances.
- Main attraction: one-level rectangular maze with 3 themed sectors (red/blue/green beacons).
- Repeatable interaction: randomized beacon activation order and clear-time challenge.
- Social anchor: central observation balcony where finished players can watch and guide others.

## Success Criteria

- 80% of first-time players start moving toward objective within 30 seconds.
- At least 60% of play sessions attempt a second run in the same visit.
- Beacon state mismatch or gate desync rate is 0 in a 4-player test.
- First-time clear target: 4-8 minutes.

## Open Questions

- Should we allow solo completion by reducing beacon count when only one player is present.
- Do we add minimap hints, or keep pure landmark-based navigation for tension.
- Should failed runs teleport to hub instantly or allow manual return for exploration.

