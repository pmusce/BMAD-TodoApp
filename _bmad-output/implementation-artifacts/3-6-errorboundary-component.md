# Story 3.6: `ErrorBoundary` Component

Status: done

## Story

As a developer,
I want an `ErrorBoundary` class component at the application root,
so that uncaught rendering errors are caught and a fallback UI is displayed instead of a blank crash (FR28, NFR17).

## Acceptance Criteria

1. **Given** `client/src/components/ErrorBoundary.tsx` exists **When** all children render without throwing **Then** children are rendered normally — no fallback UI is shown

2. **Given** a child component throws an error during render **When** React calls `getDerivedStateFromError` / `componentDidCatch` **Then** the fallback UI (a visible error message, not a blank screen) is displayed instead of the crashed subtree

3. **Given** the `ErrorBoundary` catches a render error **When** the error is handled **Then** no uncaught exception propagates up — the application remains operable outside the boundary

4. **Given** `ErrorBoundary.test.tsx` exists co-located **When** run via Vitest + React Testing Library **Then** it passes: renders children normally when no error, renders fallback UI when a child throws

## Tasks / Subtasks

- [x] Implement `client/src/components/ErrorBoundary.tsx` (AC: 1–3)
  - [x] Export named class `ErrorBoundary` (no default export — matches project component convention)
  - [x] Define `Props` interface: `{ children: ReactNode }`
  - [x] Define `State` interface: `{ hasError: boolean; error: Error | null }`
  - [x] Implement static `getDerivedStateFromError(error: Error): State` — returns `{ hasError: true, error }`
  - [x] Implement `componentDidCatch(error: Error, info: ErrorInfo): void` — `console.error` only; no external service in v1
  - [x] `render()`: if `state.hasError` return fallback `<div role="alert">` with user-facing message; otherwise return `this.props.children`
  - [x] Fallback must NOT expose raw `Error.message` to end-users — show a generic recovery message (per project security rule: never expose internal error details)
- [x] Wire `ErrorBoundary` into `client/src/main.tsx` (AC: 3 — "at the application root")
  - [x] Wrap `<App />` with `<ErrorBoundary>` inside the existing React tree
  - [x] Preserve existing structure: `StrictMode > BrowserRouter > ErrorBoundary > App`
  - [x] Import `ErrorBoundary` from `./components/ErrorBoundary`
- [x] Create co-located test file `client/src/components/ErrorBoundary.test.tsx` (AC: 4)
  - [x] Test: renders children normally when no error is thrown
  - [x] Test: renders fallback UI when a child component throws during render
  - [x] Suppress `console.error` in tests to avoid noise from React's error boundary logging
  - [x] Use a simple `ThrowingComponent` helper that throws unconditionally — defined inline in the test file

## Dev Notes

### Why a Class Component

React's Error Boundary API (`getDerivedStateFromError` + `componentDidCatch`) is **only available in class components** — functional components cannot be error boundaries. This is a React platform constraint, not a style choice. Do NOT attempt to implement this as a function component.

### Critical Scope Boundary

Per `project-context.md` (Framework Rules → React/Frontend):

> `ErrorBoundary` (class component) ONLY catches React render crashes — it does NOT handle fetch/API errors from `useTasks` (those are recoverable and handled via `error` state).

Do NOT add any fetch/network error handling inside `ErrorBoundary`. The `error` state from `useTasks` is already propagated to `TaskList` via props and is the correct mechanism for API errors.

### Source Tree State

Existing components (do NOT modify):

```
client/src/components/
  TaskInput.tsx          ← Story 3.3 — do NOT modify
  TaskInput.test.tsx     ← Story 3.3 — do NOT modify
  TaskItem.tsx           ← Story 3.4 — do NOT modify
  TaskItem.test.tsx      ← Story 3.4 — do NOT modify
```

Files to create:

```
client/src/components/
  ErrorBoundary.tsx      ← CREATE (this story)
  ErrorBoundary.test.tsx ← CREATE (this story)
```

File to update:

```
client/src/main.tsx      ← UPDATE — wrap App with ErrorBoundary
```

Files that must NOT be touched:

```
client/src/App.tsx                   ← Story 3.7 will rewrite this
client/src/hooks/useTasks.ts         ← Story 3.2 — do NOT modify
client/src/api/tasksApi.ts           ← Story 3.1 — do NOT modify
```

### Component Interface

```typescript
// client/src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true, error: _error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong</h2>
          <p>The application encountered an unexpected error. Please refresh the page to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Notes on the component:**
- `role="alert"` on the fallback container satisfies accessibility: screen readers announce the error message without requiring user action (NFR13).
- Fallback message is generic and user-facing — **never render `error.message`** directly because it may contain internal stack details (per project security rule: no internal error details exposed to users).
- `error` is stored in state but not rendered; it is available for future logging integrations.

### Wiring into `main.tsx`

Current `main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

Updated `main.tsx` after this story:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
```

**Placement rationale:** `ErrorBoundary` is inside `BrowserRouter` so that the fallback UI can still benefit from router context if needed in a future story. It wraps `<App />` so it catches any uncaught render error within the entire app tree.

### Testing Pattern

React and Vitest both call `console.error` when an error boundary catches. Suppress it in tests to prevent noisy output:

```typescript
// client/src/components/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress console.error noise from React's error boundary logging
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

afterEach(() => {
  consoleErrorSpy.mockClear()
})

// Component that always throws during render
function ThrowingComponent(): never {
  throw new Error('Test render error')
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>Child content</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
```

**Notes on testing:**
- `ThrowingComponent` is defined inline in the test file — no need to extract it.
- The `vi.spyOn(console, 'error').mockImplementation(() => {})` call suppresses both React's internal error boundary logging and any `console.error` calls from `componentDidCatch`.
- Test for the fallback uses `getByRole('alert')` — matches the `role="alert"` on the fallback container.
- `screen.getByText(/something went wrong/i)` uses a case-insensitive regex to be robust against minor wording changes.
- Do NOT test that `console.error` was called with a specific message — that couples the test to internal implementation detail.

### Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| NFR13 — async status via live regions | `role="alert"` on fallback div (alert role is assertive live region) |
| NFR17 — error boundary fallback visible | Fallback rendered with meaningful `<h2>` + `<p>` — not a blank screen |
| NFR14 — WCAG 2.1 Level A | No new ARIA violations; semantic HTML only |

### Naming Convention Alignment

| Element | Convention | This story |
|---------|-----------|------------|
| Component file | `PascalCase.tsx` | `ErrorBoundary.tsx` ✓ |
| Test file | Same name + `.test.tsx` | `ErrorBoundary.test.tsx` ✓ |
| Export style | Named export, no default | `export class ErrorBoundary` ✓ |

### Previous Story Context

Story 3.5 (`TaskList`) established the pattern of:
- Named exports for components
- Co-located test files with `vi.spyOn` for mocking
- React Testing Library with `render` + `screen` queries
- Accessibility attributes tested explicitly (`getByRole`, `aria-live`)

Follow the same test style conventions.

### Project Structure Notes

- `ErrorBoundary.tsx` goes in `client/src/components/` — matching all other components.
- Import in `main.tsx` uses a relative path `./components/ErrorBoundary` — not the `@shared` alias (which is for shared monorepo types only).
- `@shared/types` is NOT imported in this component — `ErrorBoundary` has no dependency on domain types.

### References

- FR28: "Application handles uncaught runtime errors at the application boundary without a full crash" [Source: `_bmad-output/planning-artifacts/epics.md` - Requirements Inventory]
- NFR17: "Uncaught client-side runtime errors must be caught at the application error boundary and display a recoverable error state rather than an unhandled exception" [Source: `_bmad-output/planning-artifacts/epics.md` - NonFunctional Requirements]
- Project Context - ErrorBoundary scope rule [Source: `_bmad-output/project-context.md` - Framework Rules → React/Frontend]
- Project Context - No internal error details in UI [Source: `_bmad-output/project-context.md` - Critical Don't-Miss Rules → Anti-Patterns]
- Project Context - Named exports for components [Source: `_bmad-output/project-context.md` - Imports & Exports]
- Epic 3, Story 3.6 [Source: `_bmad-output/planning-artifacts/epics.md`]
- React Error Boundary API: `getDerivedStateFromError` + `componentDidCatch` (class-component-only API)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented `ErrorBoundary` as a class component (only class components can implement React's `getDerivedStateFromError` + `componentDidCatch` API)
- Fallback renders `<div role="alert">` with a generic user-facing message — no raw `Error.message` exposed (security rule)
- `main.tsx` updated: `ErrorBoundary` wraps `<App />` inside the existing `StrictMode > BrowserRouter` tree
- 2 tests written and passing: children render pass-through, fallback on child throw
- `console.error` suppressed in tests via `vi.spyOn` to eliminate React error boundary noise
- Full suite: 51/51 tests passing, zero regressions, lint clean

### File List

- client/src/components/ErrorBoundary.tsx (created)
- client/src/components/ErrorBoundary.test.tsx (created)
- client/src/main.tsx (updated)
