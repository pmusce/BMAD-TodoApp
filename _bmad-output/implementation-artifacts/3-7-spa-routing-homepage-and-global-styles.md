# Story 3.7: SPA Routing, `HomePage`, and Global Styles

Status: done

## Story

As a user,
I want the application to load as a single-page app with a responsive layout and complete task management UI on a single route,
so that the app feels fast, works on any viewport, and is fully navigable by keyboard (FR25, FR26, FR27, FR20, FR21).

## Acceptance Criteria

1. **Given** `client/src/main.tsx` is reviewed **When** the React tree is rendered **Then** the app is wrapped in `<BrowserRouter>` from React Router 7 (FR25) — this is already in place from Story 3.6 and must not be disturbed

2. **Given** `client/src/App.tsx` is reviewed **When** the router renders **Then** a single `<Route path="/">` renders `<HomePage>` — no placeholder `<div>Todo App</div>`

3. **Given** `client/src/pages/HomePage.tsx` is reviewed **When** rendered **Then** it calls `useTasks()` once and passes the returned state and handlers as props to `<TaskInput>` and `<TaskList>` — no child component calls `useTasks` independently

4. **Given** `client/src/styles/index.css` is applied **When** the viewport is 320px wide **Then** all content is visible and no horizontal overflow occurs (FR26)

5. **Given** any interactive element (input, button, checkbox) is focused via keyboard Tab **When** inspected **Then** a visible focus ring is rendered meeting ≥3:1 contrast ratio against the adjacent background (FR21, NFR11)

6. **Given** touch targets for checkbox and delete button are measured **When** computed CSS size is checked **Then** both meet ≥44×44 CSS px minimum (FR27)

7. **Given** `client/src/pages/HomePage.test.tsx` exists co-located **When** run via Vitest + React Testing Library **Then** it passes: renders `<TaskInput>`, renders `<TaskList>`, passes correct props from `useTasks` to both child components

## Tasks / Subtasks

- [x] Create `client/src/pages/HomePage.tsx` (AC: 3)
  - [x] Import `useTasks` from `../hooks/useTasks`
  - [x] Import `TaskInput` from `../components/TaskInput`
  - [x] Import `TaskList` from `../components/TaskList`
  - [x] Call `useTasks()` once at the top of the component — do NOT pass down the whole hook return object; destructure and pass individual props
  - [x] Pass `createTask` to `<TaskInput createTask={createTask} />`
  - [x] Pass `tasks`, `isLoading`, `error`, `toggleTask`, `deleteTask` to `<TaskList>`
  - [x] Named export: `export function HomePage()` — no default export
  - [x] Wrap content in a `<main>` element with a CSS class for layout (e.g. `className="home-page"`)
- [x] Update `client/src/App.tsx` (AC: 2)
  - [x] Import `HomePage` from `./pages/HomePage`
  - [x] Replace `<Route path="/" element={<div>Todo App</div>} />` with `<Route path="/" element={<HomePage />} />`
  - [x] Do NOT change any other part of `App.tsx`
- [x] Update `client/src/styles/index.css` (AC: 4, 5, 6)
  - [x] Add app shell layout: `.home-page` max-width container centred horizontally, padding for 320px–1440px range
  - [x] Add `:focus-visible` focus ring styles for `input`, `button`, `[type="checkbox"]` meeting ≥3:1 contrast
  - [x] Ensure `[type="checkbox"]` and delete button have `min-width: 44px; min-height: 44px` (touch targets)
  - [x] Do NOT remove or alter any existing styles — only ADD new rules
- [x] Create `client/src/pages/HomePage.test.tsx` (AC: 7)
  - [x] Mock `useTasks` via `vi.mock('../hooks/useTasks')` (mock boundary: test file mocks the hook, not `tasksApi`)
  - [x] Mock `TaskInput` and `TaskList` with `vi.mock` as stub components to isolate `HomePage` logic
  - [x] Test: renders `<TaskInput>` and `<TaskList>` (via `screen.getByTestId` or querying stubs)
  - [x] Test: `createTask` from `useTasks` is passed as prop to `TaskInput`
  - [x] Test: `tasks`, `isLoading`, `error`, `toggleTask`, `deleteTask` from `useTasks` are passed to `TaskList`

## Dev Notes

### Critical Architecture Constraint — Single `useTasks` Call

Per `project-context.md` (Framework Rules → React/Frontend):

> **`useTasks` is the single state source** — it is called ONCE in `HomePage` and its return values passed as props. No child component (`TaskInput`, `TaskList`, `TaskItem`) calls `useTasks` independently.

`HomePage` is the only component that calls `useTasks()`. All other components receive their data and handlers as props.

### Current State of Files Being Modified

#### `client/src/App.tsx` — UPDATE

Current state (placeholder, must be replaced):
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

Target state after this story:
```tsx
import { Routes, Route } from 'react-router'
import { HomePage } from './pages/HomePage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
```

**Important:** `BrowserRouter` and `ErrorBoundary` already wrap `<App>` in `main.tsx` (done in Story 3.6). Do NOT add them again here.

#### `client/src/main.tsx` — DO NOT TOUCH

Already correct from Story 3.6:
```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
```

This file must not be modified in this story.

#### `client/src/styles/index.css` — ADD ONLY

Existing styles cover: `box-sizing` reset, `body`, `.task-list`, `.task-list__loading`, `.task-list__heading`, `.task-list__section`, `.task-empty-state`, `.task-error-banner`. Add layout and accessibility styles after the existing rules — do NOT modify what already exists.

### Component Interfaces to Wire

**`useTasks()` returns** (from `client/src/hooks/useTasks.ts`):
```typescript
{
  tasks: Task[],
  isLoading: boolean,
  error: string | null,
  createTask: (text: string) => Promise<void>,
  toggleTask: (id: number) => Promise<void>,
  deleteTask: (id: number) => Promise<void>,
}
```

**`TaskInputProps`** (from `client/src/components/TaskInput.tsx`):
```typescript
export interface TaskInputProps {
  createTask: (text: string) => Promise<void>
}
```

**`TaskListProps`** (from `client/src/components/TaskList.tsx`):
```typescript
export interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}
```

### `HomePage` Implementation Reference

```tsx
// client/src/pages/HomePage.tsx
import { useTasks } from '../hooks/useTasks'
import { TaskInput } from '../components/TaskInput'
import { TaskList } from '../components/TaskList'

export function HomePage() {
  const { tasks, isLoading, error, createTask, toggleTask, deleteTask } = useTasks()

  return (
    <main className="home-page">
      <TaskInput createTask={createTask} />
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        error={error}
        toggleTask={toggleTask}
        deleteTask={deleteTask}
      />
    </main>
  )
}
```

### CSS Layout & Accessibility Requirements

The `.home-page` container must be responsive from 320px to 1440px:
```css
.home-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem;
  width: 100%;
}
```

Focus ring rules (`:focus-visible` to avoid showing rings on mouse click):
```css
input:focus-visible,
button:focus-visible,
[type="checkbox"]:focus-visible {
  outline: 2px solid #0057b8; /* ≥3:1 contrast on white background */
  outline-offset: 2px;
}
```

Touch target minimum sizes (44×44px per FR27):
```css
[type="checkbox"] {
  min-width: 44px;
  min-height: 44px;
}
/* Note: TaskItem delete button already uses a <button> — ensure its CSS sets min 44x44 */
```

**Do NOT:** remove the `*::before`, `*::after` box-sizing reset or `body` styles. Do NOT remove any `.task-*` class.

### Source Tree After This Story

Files to **CREATE** (new):
```
client/src/pages/
  HomePage.tsx          ← CREATE
  HomePage.test.tsx     ← CREATE
```

Files to **UPDATE** (existing):
```
client/src/App.tsx      ← UPDATE (swap placeholder element for <HomePage>)
client/src/styles/index.css  ← UPDATE (add layout + focus + touch-target styles)
```

Files that **MUST NOT be touched**:
```
client/src/main.tsx                  ← DO NOT MODIFY
client/src/hooks/useTasks.ts         ← DO NOT MODIFY (Story 3.2)
client/src/api/tasksApi.ts           ← DO NOT MODIFY (Story 3.1)
client/src/components/TaskInput.tsx  ← DO NOT MODIFY (Story 3.3)
client/src/components/TaskItem.tsx   ← DO NOT MODIFY (Story 3.4)
client/src/components/TaskList.tsx   ← DO NOT MODIFY (Story 3.5)
client/src/components/ErrorBoundary.tsx ← DO NOT MODIFY (Story 3.6)
```

### Testing Pattern for `HomePage.test.tsx`

Mock the hook at the module boundary; mock child components as stubs to keep `HomePage` tests focused:

```tsx
// client/src/pages/HomePage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HomePage } from './HomePage'

// Mock the hook — HomePage test only cares that it wires props correctly
vi.mock('../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}))

// Mock child components as identifiable stubs
vi.mock('../components/TaskInput', () => ({
  TaskInput: (props: { createTask: unknown }) => (
    <div data-testid="task-input" data-has-create={typeof props.createTask === 'function'} />
  ),
}))

vi.mock('../components/TaskList', () => ({
  TaskList: (props: { tasks: unknown[]; isLoading: boolean; error: string | null }) => (
    <div
      data-testid="task-list"
      data-loading={String(props.isLoading)}
      data-error={String(props.error)}
      data-task-count={props.tasks.length}
    />
  ),
}))

import { useTasks } from '../hooks/useTasks'
const mockUseTasks = vi.mocked(useTasks)

describe('HomePage', () => {
  beforeEach(() => {
    mockUseTasks.mockReturnValue({
      tasks: [],
      isLoading: false,
      error: null,
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    })
  })

  it('renders TaskInput and TaskList', () => {
    render(<HomePage />)
    expect(screen.getByTestId('task-input')).toBeInTheDocument()
    expect(screen.getByTestId('task-list')).toBeInTheDocument()
  })

  it('passes createTask to TaskInput', () => {
    render(<HomePage />)
    expect(screen.getByTestId('task-input').dataset.hasCreate).toBe('true')
  })

  it('passes isLoading, error, and tasks to TaskList', () => {
    mockUseTasks.mockReturnValue({
      tasks: [{ id: 1, text: 'Test', completed: false, createdAt: Date.now() }],
      isLoading: true,
      error: 'Some error',
      createTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
    })
    render(<HomePage />)
    const list = screen.getByTestId('task-list')
    expect(list.dataset.loading).toBe('true')
    expect(list.dataset.error).toBe('Some error')
    expect(list.dataset.taskCount).toBe('1')
  })
})
```

**Test file location:** `client/src/pages/HomePage.test.tsx` — co-located with `HomePage.tsx`, NOT inside `src/test/`.

### Previous Story Intelligence (Story 3.6)

- `ErrorBoundary` is already wired in `main.tsx` — do NOT duplicate it
- Named exports are the project standard for components (`export function Foo`)
- `main.tsx` must not be modified (already stable)
- Fallback messages must not expose raw `Error.message` (security rule)

### Git Intelligence

Recent commits establish:
- `useTasks` hook is complete (optimistic UI, rollback, error state) — Story 3.2 done
- Route handler unit tests done — Story 2.4 done
- Fastify plugins done — Story 2.2 done
- Pattern: all components use named exports

### React Router 7 Note

The project uses `react-router` v7.14.2. Import `Routes`, `Route`, `BrowserRouter` from `'react-router'` (not `'react-router-dom'`). This is already correct in the existing `App.tsx` and `main.tsx` — do not change the import source.

### Project Structure Reference

Per `project-context.md`:
```
client/src/
  api/          ← fetch wrappers only (tasksApi.ts)
  hooks/        ← custom hooks + co-located tests
  components/   ← React components + co-located tests
  pages/        ← route-level page components   ← CREATE THIS DIRECTORY
  styles/       ← global CSS only
```

The `pages/` directory does not exist yet — creating `HomePage.tsx` inside it will create the directory.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.7] — full acceptance criteria
- [Source: _bmad-output/project-context.md#Framework-Specific Rules → React/Frontend] — single `useTasks` call rule, optimistic UI pattern
- [Source: _bmad-output/project-context.md#File & Folder Structure] — `pages/` directory definition
- [Source: _bmad-output/project-context.md#Accessibility] — focus rings, touch targets, aria requirements
- [Source: _bmad-output/project-context.md#Critical Don't-Miss Rules] — anti-patterns
- [Source: client/src/components/TaskInput.tsx] — `TaskInputProps` interface
- [Source: client/src/components/TaskList.tsx] — `TaskListProps` interface
- [Source: client/src/hooks/useTasks.ts] — hook return shape
- [Source: client/src/App.tsx] — current placeholder state to replace
- [Source: client/src/main.tsx] — already-correct BrowserRouter + ErrorBoundary wiring

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

_none_

### Completion Notes List

- Created `client/src/pages/HomePage.tsx`: calls `useTasks()` once, destructures all state/handlers, passes `createTask` to `TaskInput` and `tasks/isLoading/error/toggleTask/deleteTask` to `TaskList`. Named export, `<main className="home-page">` wrapper.
- Updated `client/src/App.tsx`: replaced `<div>Todo App</div>` placeholder with `<HomePage />`, added import. `main.tsx` unchanged (BrowserRouter + ErrorBoundary already correct from Story 3.6).
- Updated `client/src/styles/index.css`: added `.home-page` responsive container (max-width 640px, centred), `:focus-visible` focus rings for `input`/`button`/`[type="checkbox"]` (#0057b8, ≥3:1 contrast), `min-width/min-height: 44px` touch targets on `[type="checkbox"]` and `button`. No existing rules removed.
- Created `client/src/pages/HomePage.test.tsx`: 6 tests using stub mocks for `useTasks`, `TaskInput`, `TaskList`. Verifies renders, prop wiring (createTask, isLoading, error, tasks, toggleTask, deleteTask). Uses explicit `cleanup()` in `afterEach` (consistent with project pattern).
- One test fix applied: added `cleanup` import and `afterEach(() => cleanup())` after initial run showed stale DOM accumulation between tests.
- All 57 client tests pass. ESLint clean (zero errors).

### File List

- client/src/pages/HomePage.tsx (created)
- client/src/pages/HomePage.test.tsx (created)
- client/src/App.tsx (modified)
- client/src/styles/index.css (modified)

## Senior Developer Review (AI)

**Outcome:** Approved  
**Date:** 2026-04-28  
**Layers run:** Blind Hunter · Edge Case Hunter · Acceptance Auditor  

### Action Items

_No patch findings. Three items deferred (see deferred-work.md)._

- [x] [Review][Defer] Native checkbox hit area unreliable in Safari — deferred, pre-existing browser limitation; story AC6 specifies CSS computed size which passes
- [x] [Review][Defer] `.task-list*` CSS styles visible in diff — deferred, pre-existing uncommitted work from Story 3.5, not introduced by this story
- [x] [Review][Defer] No `<h1>` page heading — deferred, not required by story ACs or WCAG Level A; defer to UX/branding pass
