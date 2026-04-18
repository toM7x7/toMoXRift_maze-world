# Facility Integration Note

This directory is the shared planning and visibility boundary for the maze-world facility.
It exists to keep later geometry and HUD work aligned while avoiding conflicts between workers.

## Current Design Intent

- `maze` mode is the briefing-and-objective mode.
- `dorokei` mode reuses the same maze shell and hides maze-only objective surfaces.
- The jail target is the east-middle pocket, not the lobby.
- Admin/debug stays outside the normal route and must remain invisible to regular users.

## Integration Checklist

1. Keep the shared shell visible in both modes.
2. Hide maze-only surfaces in Dorokei: beacon prompts, gate/goal copy, clear log, and other maze objective surfaces.
3. Keep Dorokei-only surfaces hidden in Maze: jail, rescue affordances, radar HUD, and the overhead score board.
4. Keep the mode board and roster board in the gatehouse only.
5. Validate that the jail sits in the east-middle pocket and has two rescue approaches plus one release fork.
6. Validate that the overhead score board is readable from the floor by looking up, not by opening a menu.
7. Validate that admin/debug cannot be discovered from the main route.
8. Keep the mode switch non-teleporting so players do not get reset on mode changes.

## Assumptions

- `src/World.tsx` and Dorokei gameplay are owned by other workers.
- This directory should provide shared helpers and planning notes only.
- If later work needs a richer surface matrix, extend `visibility.ts` instead of scattering mode checks.

