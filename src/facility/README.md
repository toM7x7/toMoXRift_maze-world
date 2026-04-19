# Facility Integration Note

This directory owns the shared facility layer for maze-world: constants, visibility rules, primitive shell helpers, skybox, and reusable boards.

## Current Design Intent

- `entrance` is the default mode.
- The entrance lobby is a separate social and decision zone.
- `maze` and `dorokei` are event-field modes.
- Event walls and gameplay surfaces stay hidden until a mode is selected.
- The world should read as bright, public, and playful before interaction.

## Integration Checklist

1. Keep `FACILITY_SPAWN` in the entrance lobby.
2. Keep `FACILITY_EVENT_SPAWN` inside the event field.
3. Show `FACILITY_WALLS.entrance` only in `entrance`.
4. Show event walls and gameplay layers only in `maze` or `dorokei`.
5. Use the event-side return console instead of side-wall mode switching.
6. Keep visible geometry and Rapier colliders aligned for all primitive walls/gates.
7. Keep admin/debug outside normal sightlines.
8. If adding new modes, extend `visibility.ts` before adding scattered checks.

## Visual Direction

- Bright skybox with sun and clouds.
- Warm cream floor with lightweight pattern overlays.
- Light walls with colored primitive stripe textures.
- Large mode gates in the entrance, not small side controls.
