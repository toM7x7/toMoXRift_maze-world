# Echo Maze Facility Design

Version: `0.2`
Scope: entrance-first redesign for maze-world

## Thesis

The world should not start as a maze. It should start as a bright event facility.

The first promise is simple: arrive, understand the choices, choose a game, then enter the event field. The entrance is a social lobby. The maze/Dorokei field is a separate stage.

## Spatial Model

| Zone | Coordinates | Purpose |
| --- | --- | --- |
| Entrance Lobby | `x -18..18`, `z 22..41` | Spawn, explanation, mode selection, social pause |
| Event Gate | `z 22` | Visual boundary between lobby and event world |
| Event Field | `x -22..22`, `z -24..20` | Maze or Dorokei gameplay |
| Hidden Admin | `z 38`, `y -6` | Debug-only tools, out of normal player sight |

The lobby and event field are deliberately separated. Mode selection teleports the player from the lobby to the event spawn so the user is never dropped directly into maze rules.

## First 30 Seconds

| Time | User Need | Spatial Answer |
| ---: | --- | --- |
| `0..5s` | "Where am I?" | Bright sky, tiled lobby floor, clear event arch |
| `5..15s` | "What can I do?" | Large central mode board and two oversized gates |
| `15..25s` | "Which game starts where?" | Blue maze gate and red Dorokei gate with short captions |
| `25..30s` | "How do I enter?" | Touch either gate; teleport to the event field |

## Tone

The previous dark facility read as serious and hidden. The new direction is public-event, playful, and readable:

| Surface | Direction |
| --- | --- |
| Skybox | Bright blue skydome, sun, clouds |
| Floor | Warm cream base with tile and lane patterns |
| Walls | Light walls with color stripe textures |
| Beacons | Saturated primary colors |
| Boards | Light panels, dark readable text |

## Gameplay Rule

`entrance` is now the default world mode.

| Mode | Visible Layers |
| --- | --- |
| `entrance` | Lobby, event arch, mode board, mode gates |
| `maze` | Event walls, maze walls, beacons, clear loop, return console |
| `dorokei` | Event walls, maze field, Dorokei boards, jail/rescue, score/radar, return console |

The return console in the event field sends players back to the lobby. It is intentionally separate from mode switching, so players understand the difference between "go back to entrance" and "play this mode".

## Hard Numbers

| Item | Value |
| --- | --- |
| World floor | `72m x 82m`, centered at `[0, 0, 4]` |
| Entrance spawn | `[0, 0, 36.5]`, yaw `0` |
| Event spawn | `[0, 0, 17.5]`, yaw `0` |
| Event field | `44m x 44m` |
| Entrance lobby | `36m x 19m` |
| Mode gates | `4.6m x 3.2m x 0.52m` |
| Event gate boundary | `z = 22` |

## Acceptance Checks

- A new visitor starts in the entrance, not in a maze.
- Mode selection is directly in front of spawn and readable without searching side walls.
- The event field is visually separated from the entrance by an arch/gate line.
- The world reads as bright before interacting.
- The build stays primitive-geometry based and XRift upload-safe.
