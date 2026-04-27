# Story 1.2: Frontend Workspace Bootstrap

Status: ready-for-dev

## Story

As a developer,
I want a Vite + React + TypeScript frontend workspace with Vitest configured and running,
so that I can start the dev server and run component tests from day one.

## Acceptance Criteria

1. **Given** `client/` is initialized **When** the developer runs `npm run dev` in `client/` **Then** the Vite dev server starts on port 5173 with no errors
2. **Given** `client/tsconfig.json` exists **When** reviewed **Then** it extends `../../tsconfig.base.json`
3. **Given** `client/vite.config.ts` configures Vitest **When** the developer runs `npm run test` in `client/` **Then** Vitest runs and exits with code 0 (no test files yet; runner is confirmed operational)
4. **Given** the `@shared` path alias is configured in `client/vite.config.ts` **When** a source file imports `from '@shared/types'` **Then** both Vite and TypeScript resolve it to `shared/types.ts` at the monorepo root
5. **Given** `react-router`, `vitest`, `@testing-library/react`, and `@testing-library/user-event` are installed **When** `client/package.json` is reviewed **Then** all four are present as dependencies or devDependencies

## Tasks / Subtasks

- [ ] Task 1 — Scaffold the `client/` workspace (AC: 1, 5)
  - [ ] Run `npm create vite@latest client -- --template react-ts` from the monorepo root; this creates `client/` with React 18 + TypeScript + Vite 6
  - [ ] Delete the Vite-generated boilerplate: `client/src/App.css`, `client/src/assets/react.svg`, and `client/public/vite.svg`
  - [ ] Delete the generated counter demo from `client/src/App.tsx` (replace with minimal named export)
  - [ ] Delete the auto-generated `tsconfig.app.json` and `tsconfig.node.json` if present — Story 1.2 uses a single `client/tsconfig.json`

- [ ] Task 2 — Configure `client/tsconfig.json` (AC: 2, 4)
  - [ ] Replace (or update in-place) `client/tsconfig.json` to extend `../../tsconfig.base.json`
  - [ ] Add `jsx: "react-jsx"`, `noEmit: true`, `allowImportingTsExtensions: true`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`
  - [ ] Add `include: ["src"]`
  - [ ] Remove references to deleted tsconfig.app.json / tsconfig.node.json if present

- [ ] Task 3 — Configure `client/vite.config.ts` with Vitest and `@shared` alias (AC: 3, 4)
  - [ ] Import `path` from `node:path` (or `path`) at top of vite.config.ts
  - [ ] Add `resolve.alias['@shared']` pointing to `path.resolve(__dirname, '../../shared')`
  - [ ] Add `test` block: `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`
  - [ ] Keep `plugins: [react()]` unchanged

- [ ] Task 4 — Install additional client dependencies (AC: 3, 5)
  - [ ] In `client/package.json`, add to `dependencies`: `"react-router": "^7.14.2"`
  - [ ] In `client/package.json`, add to `devDependencies`: `"vitest"`, `"@vitest/coverage-v8"`, `"jsdom"`, `"@testing-library/react"`, `"@testing-library/user-event"`, `"@testing-library/jest-dom"`
  - [ ] Run `npm install` from the monorepo root to link workspace packages

- [ ] Task 5 — Create `client/.eslintrc.js`
  - [ ] Extends `../../.eslintrc.base.js`
  - [ ] Sets `env.browser: true` (the base sets `node: true`; client code runs in browser)

- [ ] Task 6 — Create Vitest setup file `client/src/test/setup.ts`
  - [ ] Single line: `import '@testing-library/jest-dom/vitest'`
  - [ ] This enables RTL matchers (`toBeInTheDocument`, `toHaveValue`, etc.) for all test files

- [ ] Task 7 — Update `client/src/main.tsx` (AC: 1)
  - [ ] Wrap app in `<BrowserRouter>` from `react-router`
  - [ ] Import the named `App` export (not default)

- [ ] Task 8 — Update `client/src/App.tsx` (AC: 1)
  - [ ] Change from default export to **named export**: `export function App()`
  - [ ] Return a minimal React Router `<Routes>` with a single `<Route path="/" element={<div>Todo App</div>} />` stub
  - [ ] No default export — per project convention

- [ ] Task 9 — Create `client/.env.example`
  - [ ] Single entry: `VITE_API_URL=http://localhost:3000`

- [ ] Task 10 — Update `client/package.json` scripts
  - [ ] `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"preview": "vite preview"`
  - [ ] `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:coverage": "vitest run --coverage"`
  - [ ] `"lint": "eslint src --ext .ts,.tsx"`

- [ ] Task 11 — Verification
  - [ ] `npm run dev` in `client/` → Vite starts on `http://localhost:5173/` with no errors
  - [ ] `npm run test` in `client/` → Vitest exits code 0 (no tests yet — runner confirmed)
  - [ ] `npx tsc --noEmit` in `client/` → exits 0 (confirms `@shared/types` resolves)
  - [ ] `npm run lint --workspaces` from monorepo root → exits 0

## Dev Notes

### Context from Story 1.1

Story 1.1 (done) established:
- **`tsconfig.base.json`** at root uses `"baseUrl": "."` + `"@shared/*": ["shared/*"]` — paths are resolved relative to the base config's location (the monorepo root), NOT relative to each workspace. When `client/tsconfig.json` extends `../../tsconfig.base.json`, TypeScript resolves `@shared/types` → `<monorepo-root>/shared/types.ts`. This is already correct — no override needed in `client/tsconfig.json`.
- **`@playwright/test@1.59.1`** is already installed at root devDependencies.
- **ESLint v8** is in use (not v9) — `.eslintrc.base.js` is CJS format. The `client/.eslintrc.js` must also be CJS and extend `../../.eslintrc.base.js`.
- **TypeScript 5.9.3** is already installed at root devDependencies — do not redeclare it in the client workspace (npm workspaces hoists it).

### Vite Template Details (Vite 6 `react-ts`)

Modern Vite 6 react-ts template generates **three** tsconfig files: `tsconfig.json` (composite root), `tsconfig.app.json` (source), `tsconfig.node.json` (vite config). This story collapses them into a **single `tsconfig.json`** that extends the base, per the story AC and architecture.

**Resulting `client/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

> **`allowImportingTsExtensions: true`** — required when using Vite's `"noEmit": true` approach. Vite handles transpilation; `tsc` only type-checks.
> **Do NOT add `"paths"` override** — the `@shared/*` alias is inherited from `tsconfig.base.json` and resolves correctly via `baseUrl: "."` at the root. Adding a local override would break it.
> **`lib`** — overrides the base's `["ES2022", "DOM"]` to add `DOM.Iterable` (needed for `NodeListOf` iteration in tests).

### `client/vite.config.ts` — Exact Required Shape

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../../shared'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

> **`resolve(__dirname, '../../shared')`** — goes from `client/` two levels up to monorepo root, then into `shared/`. This gives Vite the absolute path at build/test time. At runtime TypeScript uses the `tsconfig.base.json` paths inheritance.
> **`environment: 'jsdom'`** — required for React Testing Library (`document`, `window`, etc. are undefined in Node).
> **`setupFiles`** — runs before each test file; this is where jest-dom matchers are registered.

### `client/src/main.tsx` — Required Shape

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

> **`BrowserRouter` wraps at `main.tsx`** — not inside `App`. All child components can call `useNavigate`, `useLocation`, etc. without adding a router at each test site.
> **Named import `{ App }`** — project convention is named exports for all React components; no default exports.

### `client/src/App.tsx` — Required Shape

```tsx
import { Routes, Route } from 'react-router'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Todo App</div>} />
    </Routes>
  )
}
```

> **Named export** — `export function App()`, no `export default`. Import in `main.tsx` is `import { App } from './App'`.
> **Stub content** — the `<div>Todo App</div>` placeholder in `element` is replaced in Story 3.7 (`spa-routing-homepage-and-global-styles`). Do not implement `HomePage` in this story.

### `client/src/test/setup.ts` — Exact Content

```typescript
import '@testing-library/jest-dom/vitest'
```

> **`/vitest` suffix** — use the vitest-specific export, not the plain `@testing-library/jest-dom`. The plain import patches Jest globals; the `/vitest` import patches Vitest's `expect`.

### `client/.eslintrc.js` — Exact Content

```js
module.exports = {
  extends: ['../../.eslintrc.base.js'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2022: true,
  },
  settings: {
    react: { version: 'detect' },
  },
}
```

> **CJS format** — required; the base config at root is also CJS (`.eslintrc.base.js` uses `module.exports`). ESLint v8 CJS chain must be consistent.
> **No `react/recommended` extension** — architecture uses `typescript-eslint` rules; React-specific lint rules aren't needed for strict correctness in this project.

### `client/package.json` — Final Shape

```json
{
  "name": "client",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.14.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/react": "^16.x",
    "@testing-library/user-event": "^14.x",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.x",
    "@vitest/coverage-v8": "^3.x",
    "jsdom": "^26.x",
    "vite": "^6.x",
    "vitest": "^3.x"
  }
}
```

> **React Router 7.x** — imported as `react-router`, NOT `react-router-dom`. In v7 the packages are merged. All router imports (`BrowserRouter`, `Routes`, `Route`) come from `react-router`.
> **`typescript` and `eslint`** not redeclared — they are already in root devDependencies and hoisted by npm workspaces. Redeclaring causes version drift.

### `client/src/styles/index.css` — Create as Placeholder

Create with minimal content:
```css
/* Global styles — design tokens and resets go here */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
```

> The full design implementation lands in Story 3.7 (`spa-routing-homepage-and-global-styles`). The file must exist now because `main.tsx` imports it.

### Files to KEEP from Vite Template

| File | Keep? | Notes |
|------|-------|-------|
| `client/index.html` | ✅ | SPA entry point — keep unchanged |
| `client/src/main.tsx` | ✅ Modified | Replace with BrowserRouter + named App import |
| `client/src/App.tsx` | ✅ Modified | Replace with named export + React Router stub |
| `client/vite.config.ts` | ✅ Modified | Add Vitest + @shared alias |
| `client/tsconfig.json` | ✅ Modified | Replace contents with base-extending config |
| `client/public/` | ✅ | Keep directory (empty `public/` needed by Vite) |

### Files to DELETE from Vite Template

| File | Reason |
|------|--------|
| `client/src/App.css` | Not needed; global styles go in `styles/index.css` |
| `client/src/assets/react.svg` | Boilerplate asset — not used in this project |
| `client/public/vite.svg` | Boilerplate asset — not used in this project |
| `client/tsconfig.app.json` | Replaced by single flat `tsconfig.json` |
| `client/tsconfig.node.json` | Replaced by single flat `tsconfig.json` |

### Architecture Compliance

- `@shared/*` alias must resolve only via `vite.config.ts` alias at Vite runtime AND via `tsconfig.base.json#paths` inheritance at `tsc` type-check time — never hardcoded relative imports like `'../../shared/types'`
- Named exports for all React components (`export function App`) — **no `export default`**
- `BrowserRouter` is placed in `main.tsx`, not inside `App` (avoids double-wrapping in tests)
- ESLint v8 + CJS config chain: `client/.eslintrc.js` → `../../.eslintrc.base.js`
- Do NOT implement any feature code (no `useTasks`, no `TaskInput`, etc.) — those belong to Epics 2 and 3

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `import App from './App'` (default) | `import { App } from './App'` (named) |
| `import { BrowserRouter } from 'react-router-dom'` | `import { BrowserRouter } from 'react-router'` (v7 merged) |
| `import '@testing-library/jest-dom'` in setup | `import '@testing-library/jest-dom/vitest'` (vitest-specific shim) |
| Redeclare `typescript` in `client/package.json` | Hoisted from root — no redeclaration |
| `../../shared/types` as a relative import path | `@shared/types` alias everywhere |
| Add `"paths"` to `client/tsconfig.json` | Already inherited from `tsconfig.base.json` — any override breaks resolution |
| Keep `tsconfig.app.json` + `tsconfig.node.json` | Collapse into single `client/tsconfig.json` extending base |

### References

- [Project Context: TypeScript](../../_bmad-output/project-context.md#typescript) — `@shared/*` alias, `moduleResolution: "bundler"`, ESM imports
- [Project Context: React/Frontend](../../_bmad-output/project-context.md#react--frontend) — `useTasks` single source, BrowserRouter in main.tsx, named exports
- [Architecture: Frontend Architecture Decision](../../_bmad-output/planning-artifacts/architecture.md#frontend-architecture) — React Router 7.14.2, Vitest + RTL
- [Architecture: Complete Project Directory Structure](../../_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure) — exact `client/` layout
- [Architecture: Code / File Naming Conventions](../../_bmad-output/planning-artifacts/architecture.md#code--file-naming-conventions) — PascalCase components, named exports
- [Architecture: Testing Strategy](../../_bmad-output/planning-artifacts/architecture.md#testing-strategy) — co-located test files, Vitest for client
- [Story 1.1 completion notes](../../_bmad-output/implementation-artifacts/1-1-monorepo-root-scaffold.md) — `tsconfig.base.json` uses `baseUrl: "."` + `"shared/*"` (corrected); ESLint v8 CJS; `@playwright/test` already at root
- [Epics: Story 1.2](../../_bmad-output/planning-artifacts/epics.md#story-12-frontend-workspace-bootstrap) — original ACs

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

### File List
