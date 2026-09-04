# Tomorrow’s Game

“Suggest it today. Vote tonight. Play it tomorrow.”

A polished local prototype of a mobile-first daily browser arcade. The current build rotates seven safe daily games across seven deterministic mechanics (`defense-v1`, `dodge-v1`, `tap-v1`, `classify-v1`, `timing-v1`, `sequence-v1`, and `sort-v1`), with distinct controls and Canvas scenes, local personal bests, a clearly labelled demo leaderboard, device-only voting and suggestions, and a Canvas result card.

## Run locally

Requirements: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the Local URL printed by Vite. No environment variables, accounts, database, cloud resources, runtime AI, paid API, or remote media are required.

## Quality commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
git diff --check
```

Playwright uses the locally installed Chrome channel. The development-only `?e2e=1` route exposes a deterministic “Finish demo run” control for fast end-to-end coverage; it is removed from production builds.

## Structure

- `frontend/` — React interface, Canvas rendering and browser adapters.
- `shared/` — DOM-free deterministic engine modules, explicit dispatch, state machine and validated discriminated configurations.
- `backend/` — Cloudflare Workers-compatible static asset entrypoint only.
- `tests/e2e/` — desktop and 390px Playwright journeys.
- `docs/` — product, architecture and engineering boundaries.
- `migrations/` — reserved for the future database milestone.

## Dependency rationale

- React and React DOM provide the component UI.
- Vite and its React plugin provide local development and production bundling.
- Cloudflare’s Vite plugin, Workers types and Wrangler keep the build compatible with the Workers runtime without deploying it.
- TypeScript enforces strict contracts across the browser and deterministic core.
- ESLint, the TypeScript/React plugins and Prettier enforce source quality and formatting.
- Vitest, jsdom and Testing Library cover deterministic logic and component behaviour.
- Playwright covers the real desktop and mobile browser journeys.

## Prototype honesty

Community names, scores and vote percentages are demo data. Votes, preferences, personal bests and suggestions use versioned localStorage and stay on the current device. A saved suggestion is not a public submission, and the local preview URL is not a public friend-challenge link.
