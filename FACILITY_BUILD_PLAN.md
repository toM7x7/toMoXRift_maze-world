# Echo Maze Facility Build Plan

Version: `0.2`
Source design: `FACILITY_DESIGN.md`

## Build Intent

Replace the old "spawn into maze" structure with a bright event-venue loop:

1. Spawn in entrance lobby.
2. Read the central mode selector.
3. Touch a large gate for Maze or Dorokei.
4. Teleport into the event field.
5. Use an event-side console to return to the lobby.

Old side-wall mode selection is intentionally removed from the first decision path.

## Implementation Slices

| Slice | Files | Work |
| --- | --- | --- |
| Facility constants | `src/facility/facility.ts` | Add `entrance` mode, entrance bounds, event spawn, bright palette, entrance walls |
| Visibility | `src/facility/visibility.ts` | Hide event layers until mode is selected |
| World shell | `src/World.tsx` | Add entrance lobby, gates, return console, brighter lighting, larger floor |
| Visual tone | `src/facility/Skybox.tsx`, `src/facility/Wall.tsx` | Bright skybox and primitive texture stripes |
| UI surfaces | `src/facility/*.tsx` | Lighten boards for public-event readability |

## Geometry And Collision

| Element | Visible Geometry | Collider |
| --- | --- | --- |
| Floor | Plane `72 x 82` at `[0, 0, 4]` | Same mesh under fixed Rapier body |
| Entrance rails | Cuboid walls from `FACILITY_WALLS.entrance` | Same cuboids |
| Event walls | Existing event wall cuboids | Same cuboids |
| Mode gates | Cuboid `4.6 x 3.2 x 0.52` | Same cuboids |
| Return console | Cuboid `3.4 x 1.2 x 0.42` | Same cuboid |

No hidden collider-only geometry is introduced in this pass.

## UX Rules

- Do not show maze objectives in `entrance`.
- Do not show Dorokei boards in `entrance`.
- Keep both mode gates bigger than regular interactables.
- Use warm/light surfaces for public areas.
- Keep event gameplay primitive and performant.

## Validation

Run:

```powershell
npm run typecheck
npm run build
```

If previewing locally, use:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

`vite preview` serves the XRift library build and is not a reliable visual check for the local dev scene.

## Next Design Pass

- Replace primitive floor texture overlays with generated or asset-backed textures if the venue direction is accepted.
- Add stronger lobby signage after real-user first-30-second testing.
- Decide whether mode selection should also be mirrored in XRift menu UI or remain world-native only.
