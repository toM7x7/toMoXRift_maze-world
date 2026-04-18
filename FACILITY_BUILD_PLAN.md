# Echo Maze Facility Build Plan

Version: `0.1`
Source design: `FACILITY_DESIGN.md`
Purpose: multi-role construction plan for the next maze-world redesign pass

## 1. Multi-Role Planning Team

This plan is a synthesis of three design reviews:

| Role | Responsibility | Output |
| --- | --- | --- |
| UX/UI Designer | First 30 seconds, board hierarchy, Web/VR readability | Waiting-area UX, signage rules, acceptance checks |
| Level/Game Designer | Maze routes, Dorokei loops, jail/rescue fairness | Coordinate blueprint, route loops, balance metrics |
| Implementation Architect | React/R3F/Rapier structure, mode visibility, validation | File plan, staged implementation, release checklist |

Operating principle:

The waiting area is the decision vestibule. The maze is the stage. Dorokei is not a separate plaza; it is a rule layer on the same maze.

## 2. Final UX Blueprint

### 2.1 First 30 Seconds

| Time | User perception | Required spatial answer |
| ---: | --- | --- |
| `0..5s` | "Where am I facing?" | Spawn faces the threshold and maze mouth |
| `5..15s` | "What mode are we playing?" | West wall mode board is readable without blocking movement |
| `10..20s` | "Who am I with?" | East wall roster board shows participants and roles |
| `15..30s` | "What do I do first?" | One central objective line, then three visible entry lanes |
| `30s+` | "Move" | Player enters maze; no forced teleport on mode switch |

First-screen hierarchy:

| Priority | Surface | Rule |
| ---: | --- | --- |
| 1 | Threshold / maze entrance | Must be in front of spawn |
| 2 | One objective sentence | No paragraph copy |
| 3 | Mode board | Two buttons only |
| 4 | Roster board | Participant, role, jail state |
| 5 | Sector colors | Red, blue, green route hints |

### 2.2 Signage System

Signage has one command and one number where possible.

| Surface | Copy pattern | Example |
| --- | --- | --- |
| Mode board | noun + active state | `Maze / Dorokei` |
| Role buttons | role verb | `Become Police`, `Become Thief` |
| Radar info | interval + duration | `Radar every 60s / visible 10s` |
| Capture rule | verb + distance | `Touch within 0.75m` |
| Scoreboard | phase + counts | `Police 1 / Thieves 3 / Captured 1 / Spectators 0` |

Typography targets:

| Surface | Text size |
| --- | ---: |
| Side-board title | `0.16..0.20m` |
| Side-board body | `0.08..0.12m` |
| In-maze labels | `0.20..0.30m` |
| Overhead scoreboard title | `0.45..0.55m` |
| Overhead scoreboard counts | `0.45..0.55m` |

## 3. Coordinate Blueprint

### 3.1 Global Bounds

| Element | Target |
| --- | --- |
| Floor | center `[0, 0, -2]`, size `60m x 60m` |
| Outer boundary | `x -22..22`, `z -24..20` |
| Usable inner boundary | `x -21.5..21.5`, `z -23.5..19.5` |
| Spawn | `[0, 0, 17.5]`, yaw `0` |
| Admin/offstage | `[0, -6, 38]` |

### 3.2 Facility Bands

| Band | Bounds | Role |
| --- | --- | --- |
| Gatehouse | `x -18..18`, `z 13.5..19.5` | Spawn, mode, team, objective |
| Threshold | `x -18..18`, `z 10..14` | Three entry lanes |
| Maze field | `x -20..20`, `z -14..12` | Shared maze and chase field |
| North pressure band | `x -18..18`, `z -20..-14` | Maze gate, Dorokei long-loop pressure |
| Admin/offstage | outside normal bounds | Debug only |

### 3.3 Key Fixtures

| Fixture | Coordinate / bounds |
| --- | --- |
| Mode board | west wall around `[-21.42, 1.7, 14.4]` |
| Roster board | east wall around `[21.42, 2.55, 9.6]` |
| Briefing board | center threshold `[0, 2.2, 13.2]` |
| Entry lanes | `x -8`, `x 0`, `x 8` at `z 10..14` |
| Scoreboard | `[0, 7.5, -2]`, size `16m x 3.2m` |
| Dorokei jail | `x 14..20`, `z -6..2` |
| Rescue gate | `[13.2, 0.75, -2]` |
| Release marker | `[10.5, 0.02, 1.5]` |

### 3.4 ASCII-Safe Plan

```text
z +20  SOUTH / SPAWN
       ------------------------------------------------------------
       GATEHOUSE: x -18..18, z 13.5..19.5
       west wall: MODE BOARD        east wall: ROSTER BOARD
                         S [0,0,17.5]

z +14  THRESHOLD
       entry lanes: x=-8 / x=0 / x=8

z +12  MAZE START
       RED sector         BLUE sector          GREEN sector
       x -20..-6          x -6..6              x 6..20
       A beacon           B beacon             C beacon

z   0  SHARED CHASE FIELD
       2.6m minimum chase corridors
       3.2m main corridors
       4.0m crossroads

z  -6  EAST-MIDDLE JAIL POCKET
       jail: x 14..20, z -6..2
       rescue gate: [13.2,0.75,-2]
       release: [10.5,0.02,1.5]

z -14  NORTH PRESSURE BAND
       maze gate / Dorokei long loop pressure

z -24  NORTH WALL / GOAL SIDE
       ------------------------------------------------------------
```

## 4. Level And Game Metrics

### 4.1 Maze Geometry

| Metric | Target |
| --- | ---: |
| Main corridor width | `3.2m` |
| Chase corridor minimum | `2.6m` |
| Crossroads | `4.0m` |
| Average branch interval | `6..9m` |
| Longest forced straight | max `12m` |
| Maze sightline | `6..10m` |
| Waiting sightline | `12..18m` |
| Safe turnaround pocket | one every `12..16m` |

### 4.2 Loop Targets

| Loop | Target length |
| --- | ---: |
| Red sector loop | `28..34m` |
| Blue sector loop | `24..30m` |
| Green sector loop | `30..38m` |
| Main chase loop | `46..58m` |
| Jail rescue loop | `20..28m` |

### 4.3 Dorokei Balance

| Rule | Target |
| --- | ---: |
| Capture radius | `0.75m` |
| Rescue radius | `0.75m` |
| Action cooldown | `1s` |
| Radar period | `60s` |
| Radar visible duration | `10s` |
| First police/thief contact | `45..90s` |
| Jail rescue travel time | `20..45s` |
| Recommended police count | `max(1, round(players / 3))` |

Anti-camping rule:

Jail must have two approach vectors and one release fork. A single police player should not be able to see every rescue approach from one stationary point.

## 5. Build Team Plan

### 5.1 Workstream A: Facility Constants

Owner: facility architect

Files:

| File | Work |
| --- | --- |
| `src/facility/facility.ts` | All coordinates, dimensions, timings, colors |
| `src/facility/visibility.ts` | Mode-specific visibility helpers |

Tasks:

1. Create `FACILITY` constants from this document.
2. Move spawn, bounds, score, jail, board, and admin coordinates into constants.
3. Freeze global numbers: `0.75m` touch radius, `60s/10s` radar, spawn yaw `0`.

Acceptance:

| Check | Pass |
| --- | --- |
| No duplicate literal coordinates | Core layout numbers come from `facility.ts` |
| Mode visibility is named | No scattered inline mode booleans for major surfaces |

### 5.2 Workstream B: Geometry And Colliders

Owner: level implementation

Files:

| File | Work |
| --- | --- |
| `src/facility/geometry/OuterWalls.tsx` | Boundary walls |
| `src/facility/geometry/Gatehouse.tsx` | Spawn/waiting area geometry |
| `src/facility/geometry/MazeField.tsx` | Shared maze walls |
| `src/facility/geometry/JailArea.tsx` | Jail, rescue gate, release marker |
| `src/facility/geometry/AdminArea.tsx` | Offstage debug area shell |

Tasks:

1. Rebuild wall specs by named groups, not by one long array.
2. Keep visible mesh size and Rapier collider size identical.
3. Keep Dorokei in the maze by sharing `MazeField`.
4. Move jail to east-middle pocket and ensure two rescue approaches.

Acceptance:

| Check | Pass |
| --- | --- |
| Corridor minimum | No normal route under `2.6m` |
| Crossroads | Key intersections around `4.0m` |
| Jail fairness | Two approach paths, release fork exists |
| Admin invisibility | Normal route cannot see admin area |

### 5.3 Workstream C: UI And Information Surfaces

Owner: UI/UX implementation

Files:

| File | Work |
| --- | --- |
| `src/facility/ModeSelectorBoard.tsx` | West wall mode selector |
| `src/facility/ParticipantRosterBoard.tsx` | East wall roster/team board |
| `src/facility/BriefingBoard.tsx` | One objective sentence |
| `src/facility/OverheadScoreboard.tsx` | Large overhead score table |
| `src/dorokei/DorokeiRadarHud.tsx` | Body-relative radar only |

Tasks:

1. Keep all board copy short and Japanese.
2. Do not put debug controls in user-facing boards.
3. Keep side boards wall-mounted.
4. Move overhead scoreboard out of `DorokeiControlLayer` into a dedicated component.

Acceptance:

| Check | Pass |
| --- | --- |
| First action | New user can identify first action in `15s` |
| Mode/team | New user can identify mode/team in `30s` |
| Scoreboard | Counts visible by looking upward |
| HUD | Radar does not behave like a menu |

### 5.4 Workstream D: Game State And Mode Rules

Owner: mode/state implementation

Files:

| File | Work |
| --- | --- |
| `src/World.tsx` | Thin scene composition only |
| `src/dorokei/useDorokeiGame.ts` | Game logic and shared state |
| `src/dorokei/types.ts` | Shared rules and constants |
| `src/maze/*` | Optional future extraction for maze run logic |

Tasks:

1. Keep mode switching non-teleporting.
2. Ensure maze objectives are hidden in Dorokei.
3. Ensure Dorokei jail/roster/radar/scoreboard are hidden in Maze.
4. Keep debug actions available only in admin/offstage area.
5. Prepare future thief beacon collection as a third mode, but do not mix it into v1.

Acceptance:

| Check | Pass |
| --- | --- |
| Mode switch | No forced respawn |
| Maze mode | Maze beacons/gate/log visible |
| Dorokei mode | Jail/roster/radar/scoreboard visible |
| Debug | Not discoverable in normal play |

### 5.5 Workstream E: QA And Release

Owner: QA/release

Validation points:

| Point | Coordinate |
| --- | --- |
| Spawn | `[0, 0, 17.5]` |
| Threshold | `[0, 0, 12]` |
| Maze center | `[0, 0, 0]` |
| Jail | `[17, 0, -2]` |
| Goal / north pressure | `[0, 0, -18]` |

Checks:

1. At all 5 points, scoreboard should be readable or intentionally occluded for gameplay.
2. At spawn, mode and roster boards should not block forward movement.
3. In Dorokei, first chase contact should occur around `45..90s`.
4. A rescue should be possible against one camping police player.
5. `npm run typecheck` passes.
6. `npm run build` passes.
7. Local preview loads with zero console errors.
8. GitHub push and XRift upload only after local validation.

## 6. Jump And Spectator Decision

Current working assumption:

XRift exposes `allowInfiniteJump` as world-level physics, not role-level physics.

Decision table:

| Goal | Recommendation | Tradeoff |
| --- | --- | --- |
| Competitive Dorokei first | Set `allowInfiniteJump=false` | Spectators cannot freely fly |
| Spectator freedom first | Keep infinite jump | Maze skips remain possible |
| Best design compromise | `allowInfiniteJump=false` plus spectator skywalk | More geometry, cleaner rules |

Recommended v1 decision:

Use `allowInfiniteJump=false` once the redesigned geometry ships, then add a spectator skywalk at `y 4.2..5.0`. Do not rely on role-specific jump behavior until XRift exposes a confirmed API for it.

## 7. Construction Order

### Stage 0: Lock The Plan

1. Confirm this file and `FACILITY_DESIGN.md`.
2. Decide whether to keep infinite jump for this release or switch to grounded competitive play.
3. Freeze the jail location and rescue routes.

### Stage 1: Refactor Without Gameplay Change

1. Add `src/facility/facility.ts`.
2. Move skybox, wall, board, scoreboard constants into named components.
3. Keep the world visually equivalent where possible.
4. Run `typecheck` and `build`.

### Stage 2: Rebuild Gatehouse

1. Make spawn view clean.
2. Mount mode board on west wall.
3. Mount roster board on east wall.
4. Keep only one central objective line.
5. Validate first 30 seconds.

### Stage 3: Rebuild Maze Field

1. Rebuild the shared maze using the metric targets.
2. Preserve red/blue/green sector identities.
3. Keep beacons clear with `1.4m` radius clearance.
4. Validate corridor widths and branch intervals.

### Stage 4: Rebuild Dorokei Layer

1. Move jail to east-middle pocket.
2. Add two rescue approaches.
3. Add release fork.
4. Keep capture/rescue radius `0.75m`.
5. Validate first chase, first jail, first rescue.

### Stage 5: Add Observability

1. Move scoreboard to dedicated component.
2. Check visibility from 5 validation points.
3. Keep radar body-relative and periodic.
4. Keep admin offstage.

### Stage 6: Release

1. `npm run typecheck`
2. `npm run build`
3. Local preview smoke test
4. Commit
5. Push
6. `npx @xrift/cli upload world`
7. Verify XRift `ACTIVE` and new scene hash

## 8. Final Acceptance Criteria

| Area | Criterion |
| --- | --- |
| First 30 seconds | User understands mode/team/objective without reading a paragraph |
| Waiting area | Calm, short, wall-mounted, no debug surfaces |
| Maze | Shared field, no corridor under `2.6m`, three landmarks |
| Dorokei | Same maze field, jail has two rescue approaches |
| Radar | `60s` period, `10s` visible, no movement-triggered surprise |
| Scoreboard | Large, overhead, readable by looking up |
| Admin | Offstage and invisible in ordinary play |
| Implementation | Constants centralized, colliders match visible geometry |
| Release | Build passes and XRift hash updates |
