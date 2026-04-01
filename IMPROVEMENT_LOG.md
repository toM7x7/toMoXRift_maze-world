# Improvement Log

- World: `maze-world`
- Started: `2026-03-17T03:48:19.599Z`
- Template: `WebXR-JP/xrift-test-world`

## Current Hypothesis

- The main hook is cooperative pressure: each player becomes a navigator, runner, or caller while the gate timer forces coordination.
- The biggest current risk is unclear wayfinding that turns challenge into frustration.
- The next proof point is a 4-player session where at least 3 players can describe the objective and complete one run without verbal onboarding.

## Iterations

| Date | Change | Result | Next Step |
| --- | --- | --- | --- |
| 2026-03-17 | Initial scaffold | Pending | Run local dev and inspect the entry experience |
| 2026-03-17 | Defined Echo Maze first-pass concept, systems, and success metrics | Planned | Implement beacon interactables and gate state machine in `World.tsx` |

## Findings

- A simple loop with explicit beacon goals is a better first milestone than procedural maze generation.
- Shared-state reliability is the critical technical quality gate before visual polish.

## Backlog

- [ ] Build one-floor maze geometry and landmark sectors (red/blue/green).
- [ ] Add beacon A/B/C interactables with synchronized state via `useInstanceState`.
- [ ] Add gate open/close timer logic and retry flow from hub.
- [ ] Add objective/progress board with `TagBoard`.
- [ ] Add clear-time record board with `EntryLogBoard`.
- [ ] Run 1p, 2p, and 4p sync tests and record pass/fail notes.

