# Cars 4: The Next Lap

An arcade racing fan project based on the original **Hairpin** game. The original driving engine, AI rivals, tracks, career, championship, weather, upgrades, ghosts, and touch controls are preserved. A TypeScript application shell adds the new race menu and a shared daily challenge. A Python Vercel Function supplies that day's deterministic track configuration.

The WebGL view renders the tracks, scenery, lighting, weather, and racing cars in 3D using Three.js. Browsers without WebGL automatically use the original 2D canvas view. The menu character image is from the [official Disney Cars site](https://cars.disney.com/); Cars and Lightning McQueen are Disney/Pixar properties. This is an unofficial fan project.

## Run locally

Requires Node.js 20+ and Python 3.11+.

```bash
npm install
npm run dev
```

The frontend works without the Python API during local development: it calculates the same daily challenge in TypeScript. To run the complete Vercel stack locally, use `npx vercel dev` after linking a Vercel project.

## Checks

```bash
npm run build
npm run test:api
```

## Deploy

Import this GitHub repository in Vercel. The project is configured as Vite with `dist` as the output directory. `api/challenge.py` is automatically deployed as a Python Function at `/api/challenge`.

## Controls

Drive with arrows or WASD. Hold Shift for nitro, Space for the handbrake, E for DRS, P to pause, V to change camera, B to switch between 3D and classic graphics, and R to restart. On the menu, choose Quick Race, Career, Championship, Settings, or Daily Challenge. Touch controls appear automatically on touch devices.

## Architecture

- `src/game/engine.ts`: direct port of the original canvas engine. It remains JavaScript style TypeScript while the gameplay is preserved.
- `src/main.ts`: typed, accessible menu and state integration.
- `src/challenge.ts`: typed API client and offline challenge fallback.
- `api/challenge.py`: stateless Python endpoint. The same date yields the same seed and race settings for all players.

Progress and race records are saved in browser local storage. The Python API does not currently store multiplayer leaderboards.
