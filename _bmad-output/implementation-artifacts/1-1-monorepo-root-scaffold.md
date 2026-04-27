# Story 1.1: Monorepo Root Scaffold

Status: done

## Story

As a developer,
I want a monorepo root with npm workspaces, shared TypeScript config, and shared ESLint config,
so that both workspaces share a single source of truth for TS and lint rules from day one.

## Acceptance Criteria

1. **Given** the root `package.json` is reviewed **When** the developer reads it **Then** it declares `"workspaces": ["client", "server"]` and scripts: `test` (runs workspaces), `lint` (runs workspaces), `test:e2e`, `test:e2e:ui`
2. **Given** `tsconfig.base.json` exists at the monorepo root **When** the TypeScript compiler processes it **Then** strict mode is enabled, module is `ESNext`, moduleResolution is `bundler`, and `paths` includes `"@shared/*": ["../../shared/*"]`
3. **Given** `.eslintrc.base.js` exists at the monorepo root **When** reviewed **Then** it configures `typescript-eslint` with recommended rules applicable to both workspaces
4. **Given** `.gitignore` exists at the monorepo root **When** reviewed **Then** it ignores `*.db`, `.env*`, `dist/`, `node_modules/`
5. **Given** `npm install` is run at the monorepo root **When** completed without errors **Then** workspace packages are linked and root `node_modules` contains shared devDependencies

## Tasks / Subtasks

- [x] Task 1 — Create root `package.json` with npm workspaces (AC: 1)
  - [x] Set `"workspaces": ["client", "server"]`
  - [x] Add scripts: `"test": "npm run test --workspaces"`, `"lint": "npm run lint --workspaces"`, `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`
  - [x] Add shared devDependencies: `typescript`, `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- [x] Task 2 — Create `tsconfig.base.json` (AC: 2)
  - [x] Enable `strict: true`
  - [x] Set `"module": "ESNext"`, `"moduleResolution": "bundler"`
  - [x] Add `paths`: `"@shared/*": ["../../shared/*"]`
  - [x] Set `target: "ES2022"`, `lib: ["ES2022"]`
- [x] Task 3 — Create `.eslintrc.base.js` (AC: 3)
  - [x] Configure `typescript-eslint` recommended rules
  - [x] Set `parser: "@typescript-eslint/parser"` and `plugins: ["@typescript-eslint"]`
  - [x] Extend from `"eslint:recommended"` and `"plugin:@typescript-eslint/recommended"`
- [x] Task 4 — Create `.gitignore` (AC: 4)
  - [x] Include: `*.db`, `.env*`, `dist/`, `node_modules/`, `coverage/`, `.playwright/`
- [x] Task 5 — Create `shared/types.ts` with all domain types
  - [x] Export `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError` interfaces
  - [x] Use only primitives (`number`, `string`, `boolean`) — no external dependencies
- [x] Task 6 — Verify `npm install` links workspaces (AC: 5)
  - [x] `npm install` at root exits 0; 132 packages installed, 0 vulnerabilities

### Review Findings

- [x] [Review][Patch] `.gitignore` should ignore general `.env*` variants while explicitly allowing future `.env.example` files, so it matches project intent without leaking env-specific files. [/Users/pmusce/workspace/aine/.gitignore:8](/Users/pmusce/workspace/aine/.gitignore#L8)
- [x] [Review][Patch] `@shared/*` path alias resolves outside the repository because the base config lives at the repo root and `"../../shared/*"` is evaluated from there, not from future workspace configs. [/Users/pmusce/workspace/aine/tsconfig.base.json:11](/Users/pmusce/workspace/aine/tsconfig.base.json#L11)
- [x] [Review][Patch] E2E scripts call `playwright test`, but no Playwright package is declared in root `devDependencies`, so those scripts are not reproducible on a clean install. [/Users/pmusce/workspace/aine/package.json:12](/Users/pmusce/workspace/aine/package.json#L12)

## Dev Notes

### What This Story Produces

This is a **scaffold-only** story. No feature code is written. The output is a set of root-level config files that every subsequent story will depend on. Stories 1.2 and 1.3 create the `client/` and `server/` workspaces respectively; this story creates the root that hosts them.

**Files to create (all NEW):**
| File | Purpose |
|------|---------|
| `package.json` | npm workspaces root — defines `client` and `server` as workspaces |
| `tsconfig.base.json` | Shared TypeScript strict-mode config — extended by both workspaces |
| `.eslintrc.base.js` | Shared ESLint + typescript-eslint base — extended by both workspaces |
| `.gitignore` | Monorepo-level gitignore |
| `shared/types.ts` | Single source of truth for domain types: `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError` |

### Critical Implementation Details

#### `package.json` — workspaces and scripts

```json
{
  "name": "todo-app",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@typescript-eslint/eslint-plugin": "^7.x",
    "@typescript-eslint/parser": "^7.x",
    "eslint": "^8.x"
  }
}
```

> **Note on `--workspaces` flag:** `npm run test --workspaces` and `npm run lint --workspaces` instruct npm to run the `test` / `lint` script in every workspace that defines it. The `client/` and `server/` workspaces DON'T EXIST YET in this story — that is expected. These scripts will be functional after Stories 1.2 and 1.3 complete.

#### `tsconfig.base.json` — exact required fields

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "paths": {
      "@shared/*": ["../../shared/*"]
    }
  }
}
```

> **`moduleResolution: "bundler"`** is required — this is what allows both Vite (client) and `tsc` to resolve `@shared/types` via the `paths` alias. Do NOT use `"node16"` or `"nodenext"` here as the path alias resolution behaves differently.

> **`lib: ["ES2022", "DOM"]`** — include `DOM` in the base because the client workspace extends this. The server workspace will override with `lib: ["ES2022"]` in its own `tsconfig.json`.

#### `.eslintrc.base.js` — shared lint config

```js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    es2022: true,
    node: true,
  },
  rules: {
    // Both workspaces override this if needed
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

> **Format:** Use CommonJS `.eslintrc.js` (not ESM `.eslintrc.mjs`) — both Vite (client) and Fastify (server) generated projects expect CJS eslint configs. Later story workspace configs will extend this via `extends: ['../../.eslintrc.base.js']`.

#### `shared/types.ts` — the domain contract

```typescript
// shared/types.ts
// Single source of truth for all domain types shared between client and server.
// Both workspaces import via '@shared/types' path alias.

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number; // Unix milliseconds
}

export interface CreateTaskPayload {
  text: string;
}

export interface UpdateTaskPayload {
  completed: boolean;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
```

> **`createdAt: number`** — Unix milliseconds, NOT a `Date` or ISO string. This matches the SQLite `INTEGER` storage and the JSON API contract. Any deviation here will break the entire type chain.
> **No `userId`** in shared types — `user_id` is a DB-only column (INTEGER NULL); it is intentionally absent from the `Task` type until auth is added.

#### `.gitignore` — minimum required entries

```
# Dependencies
node_modules/

# Build outputs
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# SQLite databases
*.db
*.sqlite

# Test coverage
coverage/
.nyc_output/

# Playwright
playwright-report/
test-results/
.playwright/

# OS / IDE
.DS_Store
*.swp
```

### Project Structure Notes

- This story creates only the ROOT-level files. `client/` and `server/` directories do NOT exist yet.
- `shared/` is NOT an npm workspace (no `package.json` inside it) — it is a plain directory. Both workspaces will import from it via the `@shared/*` TypeScript path alias.
- The `paths` entry in `tsconfig.base.json` uses `"../../shared/*"` — this is relative to where the individual workspace `tsconfig.json` files live (`client/`, `server/`), not relative to the root.
- When workspaces ARE created (Stories 1.2, 1.3), their `tsconfig.json` files will `extend: "../../tsconfig.base.json"` — this means the `paths` resolve correctly pointing two levels up from `client/` or `server/` to `shared/`.

### Enforcement Rules from Architecture

Per the architecture document, these rules apply globally and this story creates the enforcement infrastructure:
- **`moduleResolution: "bundler"`** — required for `@shared/*` path alias to work in both Vite and `tsc`
- **`strict: true`** — TypeScript strict mode is non-negotiable; both workspaces inherit this
- **`@shared/types` is the only `Task` definition** — no local redefinitions allowed anywhere
- **ESLint must pass with zero errors** — `npm run lint --workspaces` must exit 0 from day 1

### Testing Requirements

This story has no test files to write. Verification is structural:
- `npm install` exits 0
- `npx tsc --noEmit -p tsconfig.base.json` exits 0 (once workspaces exist with their tsconfigs extending this base)
- ESLint config is syntactically valid (becomes verifiable once workspace ESLint configs extend it)

### References

- [Architecture: Data Architecture](../_bmad-output/planning-artifacts/architecture.md#data-architecture) — `moduleResolution: "bundler"` requirement
- [Architecture: Complete Project Directory Structure](../_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure) — exact file/folder layout
- [Architecture: Shared Types Location](../_bmad-output/planning-artifacts/architecture.md#shared-types-location) — `shared/types.ts` as single source of truth
- [Architecture: Code / File Naming Conventions](../_bmad-output/planning-artifacts/architecture.md#code--file-naming-conventions) — naming rules
- [Architecture: Enforcement Guidelines](../_bmad-output/planning-artifacts/architecture.md#enforcement-guidelines) — rules all agents must follow
- [Project Context: TypeScript](../_bmad-output/project-context.md#typescript) — `moduleResolution: "bundler"`, ESM imports only, path alias details
- [Project Context: MonoRepo Structure](../_bmad-output/project-context.md#monorepo-structure) — `shared/types.ts` is NOT a workspace
- [Epics: Story 1.1](../_bmad-output/planning-artifacts/epics.md#story-11-monorepo-root-scaffold) — original ACs

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

_None_

### Completion Notes List

- Created all 5 root-level scaffold files as specified
- Used `--if-present` flag on workspace scripts so they don't error before `client/` and `server/` exist
- TypeScript 5.9.3 installed; `tsconfig.base.json` validated (no syntax errors)
- `.eslintrc.base.js` validated via `node -e require(...)` — CommonJS module loads cleanly
- `npm install` exited 0; 132 packages installed, 0 vulnerabilities; ESLint v8.57.1 + typescript-eslint v7 + TypeScript 5.9.3
- ESLint v8 used intentionally (architecture specifies `.eslintrc.base.js` CJS format; v9 uses flat config which is incompatible with the specified extend pattern)
- `shared/types.ts` exports all 4 domain types; `createdAt: number` (Unix ms) — no `userId` field (DB-only column excluded from shared contract per architecture)
- Code review patches applied: added `@playwright/test` at the root, corrected the shared alias to `baseUrl: "."` + `shared/*`, and updated `.gitignore` to ignore `.env*` while allowing `.env.example`
- Validation after review: `npm install` exits 0 with 0 vulnerabilities, `@shared/types` resolves from an extending child config, and the env ignore rule preserves `.env.example`

### File List

- package.json
- package-lock.json
- tsconfig.base.json
- .eslintrc.base.js
- .gitignore
- shared/types.ts
