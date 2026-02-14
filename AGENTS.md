# AGENTS.md

## Project Overview

This is a **TypeScript monorepo** managed with **npm workspaces**. Each game is a standalone workspace under `games/`.

## Tech Stack

- **Language**: TypeScript 5.9
- **Runtime**: Node.js 24+
- **Package Manager**: npm (v7+ workspaces)
- **Bundler**: Vite 7
- **Game Engine**: @jolly-pixel/engine + @jolly-pixel/runtime
- **Rendering**: HTML5 Canvas

## Linter & Code Style

- **ESLint** (flat config) via `eslint.config.mjs` at the root
- Uses `@openally/config.eslint` with the `typescriptConfig()` preset
- Source type is `module` with `browser` globals
- TypeScript config extends `@openally/config.typescript/esm-ts-next`

## Repository Structure

```
├── eslint.config.mjs       # ESLint flat config (shared)
├── tsconfig.base.json       # Base TypeScript config (shared)
├── tsconfig.json            # Project references root
├── package.json             # Workspace root
└── games/
    └── brackeys-2026-1/     # Game workspace (Vite + Canvas)
```

## Commands

| Command | Scope | Description |
| --- | --- | --- |
| `npm ci` | root | Install all workspace dependencies |
| `npm run build` | root | Build all workspaces |
| `npm run dev` | game | Start Vite dev server with HMR |
| `npm run build` | game | Production build |
| `npm run preview` | game | Preview production build |

## Conventions

- Each game lives in its own folder under `games/` and is registered as an npm workspace.
- TypeScript project references are used; each game has its own `tsconfig.json` extending `tsconfig.base.json`.
- Imports use explicit `.ts` extensions (e.g. `import { foo } from "./bar.ts"`).
