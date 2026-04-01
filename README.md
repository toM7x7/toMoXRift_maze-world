# Echo Maze

Cooperative XRift maze world where players activate three beacons and sprint through a timed final gate.

## Current State

- One-floor playable maze loop
- Shared beacon state with a 20-second gate window
- Goal room plus retry console
- XRift-native social surfaces via `TagBoard` and `EntryLogBoard`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run typecheck
npm run build
```

## Upload To XRift

```bash
xrift login
xrift upload world
```

## Project Notes

- Design/spec: [WORLD_SPEC.md](./WORLD_SPEC.md)
- Iteration log: [IMPROVEMENT_LOG.md](./IMPROVEMENT_LOG.md)
- XRift config: [xrift.json](./xrift.json)

## GitHub Setup

Initialize the remote repository on GitHub, then connect this local repo:

```bash
git remote add origin git@github.com:<your-account>/maze-world.git
git push -u origin main
```

