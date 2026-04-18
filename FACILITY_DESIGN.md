# Echo Maze Facility Design

Version: `0.1`
Scope: maze-world facility redesign before implementation
Authoring intent: UX-first architectural plan for the maze, waiting area, and Dorokei play layer

## 1. Design Thesis

Echo Maze should behave like a small civic facility, not a pile of walls.

The world has two social modes:

| Mode | User promise | Spatial promise |
| --- | --- | --- |
| Maze | Coordinate, split, activate 3 beacons, escape | Readable sectors, safe briefing, clear goal pressure |
| Dorokei | Choose police/thief, chase, jail, rescue | Same maze becomes a pursuit field, not a plaza |

The facility must support three verbs in order:

| Step | Verb | UX need | Spatial answer |
| --- | --- | --- | --- |
| 1 | Gather | Players must understand where to stand and what to touch | A calm gatehouse with wall-mounted boards |
| 2 | Commit | Players must choose mode/team without being moved | Side-wall controls that never teleport on mode switch |
| 3 | Dive | Players must enter tension quickly | One visible threshold from lobby into maze |

Core rule: the waiting area is a vestibule, not a playground. The maze is the stage.

## 2. Coordinate System

XRift scene coordinates used by the current implementation:

| Axis | Meaning in this plan |
| --- | --- |
| `x` | West/East, negative is left wall, positive is right wall |
| `y` | Height |
| `z` | South/North, positive is spawn side, negative is goal side |

Current hard numbers:

| Element | Current value |
| --- | --- |
| Floor mesh | center `[0, 0, -2]`, size `60m x 60m`, covers `x -30..30`, `z -32..28` |
| Outer play boundary | wall centers at `x +/-22`, `z 20`, `z -24` |
| Usable inner boundary | approximately `x -21.5..21.5`, `z -23.5..19.5` |
| Outer footprint | `44m x 44m` |
| Wall thickness | `1m` for major maze/outer walls |
| Wall height | `3m` visible/collider height |
| Spawn | `[0, 0, 17.5]` |
| Spawn yaw | `0` |
| Existing capture/rescue radius | `0.75m` |
| Radar cadence | `60s` period, `10s` visible |
| Existing scoreboard | `[0, 7.2, -2]`, size `15.5m x 3.0m` |
| Existing admin area | `[0, -6, 38]`, outside normal route |

## 3. Meta UX Architecture

The redesign should organize the facility into five bands from south to north:

| Band | Z range | Role | Emotional state |
| --- | ---: | --- | --- |
| Gatehouse | `z 14..20` | Spawn, mode choice, team choice, rules | Calm, readable, social |
| Threshold | `z 10..14` | Leave safety, choose lane | Intentional commitment |
| Maze field | `z -14..10` | Chase, search, route memory | Tension, ambiguity |
| North objective band | `z -20..-14` | Maze gate/goal or Dorokei long-loop pressure | Climax |
| Service/offstage | outside normal play | Admin/debug, hidden support | Invisible to users |

This creates a legible gradient:

| Gradient | South | North |
| --- | --- | --- |
| Information | High | Low |
| Safety | High | Low |
| Tension | Low | High |
| Navigation clarity | Strong landmarks | Local memory |

## 4. Proposed Facility Plan

Top-down plan, not exact geometry. One character is roughly `2m`.

```text
                 NORTH / GOAL SIDE  z -24

    x -22                                                     x +22
      ┌────────────────────────────────────────────────────────┐
      │                 N: Objective / pressure band            │
      │          Maze: exit gate     Dorokei: long loop         │
 z-20 │        ┌──────────────G──────────────┐                  │
      │        │                             │                  │
      │────────┘        west loop            └─────────┐        │
      │  A sector                         mid spine     │        │
 z-14 │  red landmark ┌───────┐     ┌───────┐     C green│        │
      │               │       │     │       │            │        │
      │───────┐   ┌───┘   B   └─────┘   ┌───┘   ┌────────│        │
      │       │   │       blue sector    │       │        │        │
 z -6 │       │   │                      │       │ Jail   │        │
      │       │   └──────────┐   ┌───────┘       │ J / R  │        │
      │       │              │   │               └────┬───│        │
 z  2 │       └──────┐   ┌───┘   └──────┐             │   │        │
      │              │   │              │             │   │        │
      │        west return        central split        east rescue  │
 z 10 │──────────────┴───┴──────────────┴─────────────┴────────────│
      │                 Threshold: 3 visible entry lanes             │
 z 14 │  M mode board  ┌────────────────────────────┐  P roster     │
      │                │       Gatehouse / lobby     │               │
 z 18 │                │ S spawn / briefing / queue  │               │
      └────────────────────────────────────────────────────────┘

                 SOUTH / SPAWN SIDE  z +20
```

Legend:

| Mark | Meaning |
| --- | --- |
| `S` | Spawn and first orientation |
| `M` | Mode board on west side wall |
| `P` | Participants/team board on east side wall |
| `A/B/C` | Maze beacons and future thief collection beacons |
| `G` | Maze exit gate |
| `J` | Jail |
| `R` | Rescue gate / release marker |

## 5. Numeric Facility Specification

### 5.1 Global Discipline

| Property | Target |
| --- | ---: |
| Planning grid | `2m` grid for corridor centers |
| Major wall thickness | `1m` |
| Minor visual divider thickness | `0.25..0.5m` |
| Wall height | `3.2m` minimum, `3.8m` for anti-jump-feel baffles |
| Main corridor width | `3.2m` |
| Chase corridor width | `2.6m` minimum |
| Crossroad width | `4.0m` |
| Dead-end depth | max `6m` unless it contains an objective |
| Readable sightline in maze | `6..10m` |
| Readable sightline in waiting area | `12..18m` |
| Board interaction standoff | `1.0..1.6m` |
| Spawn clearance | radius `3m` unobstructed |
| Team start clearance | `2m` per 2 players |

### 5.2 Gatehouse / Waiting Area

Target bounds:

| Element | Bounds / position |
| --- | --- |
| Gatehouse footprint | `x -18..18`, `z 13.5..19.5` |
| Spawn | `[0, 0, 17.5]` |
| Spawn forward axis | toward `z 12..14` threshold |
| Mode board | west wall, around `[-21.4, 1.7, 14.4]` |
| Team board | east wall, around `[21.4, 2.5, 9.6]` |
| Briefing text | center wall/floating band, `[0, 2.2, 13.2]` |
| Entry lanes | three lanes centered at `x -8`, `x 0`, `x 8` |

Waiting UX requirements:

| Requirement | Number |
| --- | ---: |
| Time to understand first action | under `15s` |
| Time to choose mode/team | under `30s` |
| Minimum distance from spawn to first board | `4..7m` |
| Minimum path width around spawn | `5m` |
| Number of simultaneous readers per side board | `2..3` |

Design intent:

| Surface | UX function |
| --- | --- |
| West wall | World mode, minimal controls |
| East wall | Team/participant list, random split |
| Center threshold | Objective status only, not dense controls |
| Floor lanes | Quietly teach split routes before users enter maze |

Do not place debug controls in this area.

### 5.3 Maze Field

Target bounds:

| Element | Bounds |
| --- | --- |
| Maze play field | `x -20..20`, `z -14..12` |
| West red sector | `x -20..-6`, `z -12..10` |
| Center blue sector | `x -6..6`, `z -14..10` |
| East green sector | `x 6..20`, `z -12..10` |
| North pressure band | `x -18..18`, `z -20..-14` |

Maze UX requirements:

| Requirement | Target |
| --- | ---: |
| First branch after threshold | within `8m` from spawn side |
| Average branch interval | every `6..9m` |
| Longest forced corridor without choice | max `12m` |
| Shortest chase loop circumference | `24..32m` |
| Longest loop circumference | `46..58m` |
| Safe turnaround pocket | one every `12..16m` |
| Beacon/collection object clearance | radius `1.4m` |

Maze design rule:

Every sector gets one landmark language:

| Sector | Color | Shape | Sound/behavior idea |
| --- | --- | --- | --- |
| A / Red | `#e74c3c` | square pillar, warning stripes | short pulse |
| B / Blue | `#3498db` | low arch, cooler light | steady hum |
| C / Green | `#2ecc71` | taller slab, exit-adjacent clue | soft blink |

### 5.4 Dorokei Layer

Dorokei uses the same maze walls. It should not open into a plaza.

Target Dorokei layout:

| Element | Position / bounds |
| --- | --- |
| Police/thief selection | waiting gatehouse side boards |
| Active pursuit field | same maze field `x -20..20`, `z -14..12` |
| Jail | move target to east-middle pocket, recommended `x 14..20`, `z -6..2` |
| Rescue gate | jail west edge, recommended `[13.2, 0.75, -2]` |
| Release marker | outside jail, recommended `[10.5, 0.02, 1.5]` |
| Scoreboard | overhead `[0, 7.5, -2]`, size `16m x 3.2m` |
| Radar HUD | body-relative, appears every `60s` for `10s` |

Dorokei balance numbers:

| Property | Target |
| --- | ---: |
| Capture distance | `0.75m` |
| Rescue distance | `0.75m` |
| Action cooldown | `1s` |
| Radar visible duration | `10s` |
| Radar period | `60s` |
| Ideal round length | `3..5min` |
| First chase contact | `45..90s` after start |
| Jail rescue travel time | `20..45s` from common routes |
| Police count formula | `max(1, round(players / 3))` |

Jail must be visible enough to create drama, but not so central that every route collapses into camping.

### 5.5 Scoreboard

The scoreboard is a shared sky object, not a menu.

| Property | Target |
| --- | ---: |
| Position | `[0, 7.5, -2]` |
| Plane size | `16m x 3.2m` |
| Text height | `0.45..0.55m` |
| Read angle | readable from `y 1.6`, looking up `25..55deg` |
| Contents | phase, police, thieves, captured, spectators |
| Update source | Dorokei shared state |

Scoreboard should be visible from most corridors through deliberate vertical gaps or open ceilings, but it must not replace local wayfinding.

### 5.6 Admin Area

Admin/debug must exist, but feel offstage.

| Element | Target |
| --- | --- |
| Admin origin | `[0, -6, 38]` or another non-route coordinate |
| Normal route visibility | none |
| User-facing signs | none |
| Access method | manual teleport/dev-only knowledge |
| Tools | jail self, free self, force radar, reset state |

Admin tools should never teach normal users that the debug surface exists.

## 6. Micro UX Rules

### 6.1 Spawn Moment

At spawn, the user should see:

| Visual priority | Surface |
| ---: | --- |
| 1 | Threshold into maze |
| 2 | One objective sentence |
| 3 | Side-wall mode/team controls |
| 4 | Sector color hints |

At spawn, the user should not see:

| Avoid | Reason |
| --- | --- |
| Debug controls | Breaks fiction and confuses users |
| Dense menu wall in front | Blocks movement impulse |
| Too many buttons | Slows first 20 seconds |

### 6.2 Board Interaction

Board surfaces should follow one scale family:

| Board | Width | Height | Text size | Interaction count |
| --- | ---: | ---: | ---: | ---: |
| Mode board | `4.2m` | `1.4m` | `0.12..0.16m` | 2 buttons |
| Team board | `4.3m` | `3.1m` | `0.08..0.17m` | 3 buttons + list |
| Briefing board | `6.0m` | `1.6m` | `0.12..0.24m` | 0 buttons |
| Scoreboard | `16m` | `3.2m` | `0.45..0.55m` | no buttons |

Microcopy principle:

| Bad | Good |
| --- | --- |
| Long rule paragraph | one verb + one number |
| "ドロケイを開始できます" | "開始" |
| "一定時間ごとに..." | "レーダー 60秒ごと / 10秒表示" |

### 6.3 Corridor Feel

The maze should alternate three corridor emotions:

| Emotion | Corridor metric | Use |
| --- | --- | --- |
| Compression | width `2.6m`, sightline `4..6m` | chase tension |
| Decision | width `3.2..4m`, 2 exits | route choice |
| Relief | pocket `4m x 4m` | beacon, rescue, voice regroup |

Do not build long uniform hallways. Uniform halls are neither beautiful nor tactical.

### 6.4 Dorokei Fairness

| Problem | Architectural answer |
| --- | --- |
| Police camp jail | two approach routes to rescue gate |
| Thieves cannot recover | release marker outside jail with immediate fork |
| Radar feels random | visible countdown always present, dots only during pulse |
| New users do not know teams | participant board always in gatehouse |
| Mode switch disorients players | never teleport on mode switch |

## 7. Jump And Spectator Policy

Current XRift physics exposure appears world-level:

| Setting | Scope |
| --- | --- |
| `physics.allowInfiniteJump` | world-level |

Role-specific jump physics is not currently a safe assumption. Facility design should therefore not depend on "participants cannot infinite jump while spectators can" unless XRift adds a role-aware movement API.

Recommended design alternatives:

| Option | Result | Tradeoff |
| --- | --- | --- |
| Set `allowInfiniteJump=false` | Fair grounded maze for everyone | Spectators lose free vertical roaming |
| Keep infinite jump and raise/ceiling critical routes | Spectators can roam, skips are reduced | More geometry and visual weight |
| Add spectator skywalk via ramps/portals | Spectators get vantage without physics exception | Requires explicit spectator routing |

Preferred v1:

Use `allowInfiniteJump=false` for competitive Dorokei once route testing starts, then add a spectator skywalk at `y 4.2..5.0` with no effect on active maze routes.

## 8. Implementation Phases

### Phase A: Planning Constants

Create a single layout source of truth:

```ts
const FACILITY = {
  bounds: { xMin: -22, xMax: 22, zMin: -24, zMax: 20 },
  spawn: { position: [0, 0, 17.5], yaw: 0 },
  gatehouse: { xMin: -18, xMax: 18, zMin: 13.5, zMax: 19.5 },
  maze: { xMin: -20, xMax: 20, zMin: -14, zMax: 12 },
  score: { position: [0, 7.5, -2], size: [16, 3.2] },
}
```

### Phase B: Facility Geometry

Replace the current scattered wall specs with named groups:

| Group | Purpose |
| --- | --- |
| `OUTER_WALLS` | hard boundary |
| `GATEHOUSE_WALLS` | waiting area and threshold |
| `LABYRINTH_WALLS` | shared maze/Dorokei field |
| `MAZE_OBJECTIVE_WALLS` | gate/goal-only geometry |
| `DOROKEI_JAIL_WALLS` | jail/rescue pocket |
| `ADMIN_WALLS` | offstage debug surface |

### Phase C: Mode-Specific Surfaces

| Mode | Show | Hide |
| --- | --- | --- |
| Maze | beacons, gate, goal, clear log | Dorokei jail, radar, team board |
| Dorokei | jail, team board, radar, scoreboard | maze gate, goal, clear log |
| Both | skybox, floor, outer walls, gatehouse, shared labyrinth walls | admin area from normal route |

### Phase D: Playtest Metrics

Track these manually during test:

| Metric | Target |
| --- | ---: |
| First movement from spawn | under `10s` |
| First board interaction | under `30s` |
| First route split | under `45s` |
| Maze first clear | `4..8min` |
| Dorokei first capture | `45..90s` |
| Dorokei rescue success | at least `1` rescue in `5min` with 4+ players |
| "Where am I?" verbal confusion | less than `2` incidents per 10 minutes |

## 9. Acceptance Criteria For The Redesign

The facility redesign is acceptable when:

| Criterion | Pass condition |
| --- | --- |
| Waiting area clarity | A new user can identify mode/team controls in under `30s` |
| Maze/Dorokei separation | Dorokei uses maze routes, not an open plaza |
| Route discipline | No corridor narrower than `2.6m` for normal play |
| Touch fairness | Capture/rescue distances remain `0.75m` |
| Shared awareness | Overhead scoreboard is readable by looking up from at least 60% of playable floor |
| Admin concealment | Debug controls are unreachable/invisible in ordinary play |
| Implementation hygiene | Visible geometry and Rapier colliders use the same dimensions |

## 10. Open Design Questions

| Question | Recommended default |
| --- | --- |
| Should Dorokei jail move from spawn-side to maze-side? | Yes. Place it in east-middle pocket to avoid lobby camping. |
| Should maze and Dorokei use exactly the same wall layout? | Yes for v1. Add mode-specific props, not separate mazes. |
| Should spectators have infinite jump? | Not until role-specific movement control is confirmed. Use skywalk instead. |
| Should thief beacon collection replace basic Dorokei? | Add as a third mode after the facility is stable. |
| Should the waiting area be beautiful or minimal? | Minimal, precise, side-mounted. The maze is the theatrical object. |

