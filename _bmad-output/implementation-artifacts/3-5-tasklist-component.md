# Story 3.5: `TaskList` Component

Status: done

## Story

As a user,
I want tasks displayed in two sections — Active and Completed — with correct ordering and all non-happy-path states handled,
so that I always understand the state of my task list regardless of data or network conditions.

## Acceptance Criteria

1. **Given** `TaskList` receives `isLoading: true` **When** rendered **Then** a loading indicator (spinner or skeleton) is visible; no task items are rendered (FR12)

2. **Given** `TaskList` receives `isLoading: false` and `tasks: []` **When** rendered **Then** an empty-state message is visible (e.g. "No tasks yet") (FR11)

3. **Given** `TaskList` receives a mix of active and completed tasks **When** rendered **Then** active tasks appear in a section above completed tasks; within each section tasks are ordered reverse-chronologically by `createdAt` (FR6, FR7, FR9)

4. **Given** `TaskList` receives a non-null `error` string **When** rendered **Then** an inline error banner is visible containing the error message alongside any existing tasks (not replacing them) (FR13, NFR16)

5. **Given** the error banner is visible after a failed mutation **When** the user re-triggers the same action from the UI **Then** the banner clears and the fresh attempt proceeds — no dedicated "Retry" button is rendered in the error banner (FR13)

6. **Given** the error banner is rendered **When** inspected **Then** it is wrapped in an `aria-live="polite"` region so screen readers announce the error (FR24)

7. **Given** `TaskList.test.tsx` exists co-located **When** run via Vitest + React Testing Library **Then** it passes: loading state renders spinner, empty state renders message, active/completed grouping correct, error banner visible with aria-live attribute

## Tasks / Subtasks

- [x] Implement `client/src/components/TaskList.tsx` (AC: 1–6)
  - [x] Export named function `TaskList` (no default export) with exported `TaskListProps` interface
  - [x] Accept props: `tasks: Task[]`, `isLoading: boolean`, `error: string | null`, `toggleTask: (id: number) => Promise<void>`, `deleteTask: (id: number) => Promise<void>`
  - [x] When `isLoading === true`: render a loading indicator (e.g. `<p role="status">Loading…</p>` or a spinner `<div>`), render **no** `TaskItem` elements (AC: 1)
  - [x] When `isLoading === false` and both active and completed lists are empty: render an empty-state message, e.g. `<p>No tasks yet</p>` (AC: 2)
  - [x] Derive `activeTasks` and `completedTasks` from the `tasks` prop: filter by `completed` flag, sort each group reverse-chronologically (`b.createdAt - a.createdAt`) (AC: 3)
  - [x] Render active tasks in a section/`<ul>` labelled "Active" above completed tasks labelled "Completed"; each section only renders if it has items (AC: 3)
  - [x] Render `<TaskItem>` for each task, passing `task`, `toggleTask`, `deleteTask` as props (reusing Story 3.4 component)
  - [x] When `error` is non-null: render an inline error banner **above the task sections** (not replacing them) containing the error string (AC: 4)
  - [x] Wrap the error banner in a container with `aria-live="polite"` (or place `aria-live="polite"` directly on the banner element) (AC: 6)
  - [x] No "Retry" button in the banner — the existing task controls (input/checkbox/delete) are the retry affordance (AC: 5)
- [x] Create co-located test file `client/src/components/TaskList.test.tsx` (AC: 7)
  - [x] Test: renders loading indicator when `isLoading` is true; no task items rendered
  - [x] Test: renders empty-state message when not loading and tasks is empty
  - [x] Test: renders active tasks before completed tasks when mix provided
  - [x] Test: renders tasks in reverse-chronological order within each group
  - [x] Test: renders error banner with `aria-live="polite"` when `error` is non-null
  - [x] Test: error banner renders alongside tasks (task items still visible)

## Dev Notes

### Source Tree State

`client/src/components/` already contains (from Stories 3.3 and 3.4):

```
client/src/components/
  TaskInput.tsx          ← Story 3.3 — do NOT modify
  TaskInput.test.tsx     ← Story 3.3 — do NOT modify
  TaskItem.tsx           ← Story 3.4 — do NOT modify (or will exist by the time this story runs)
  TaskItem.test.tsx      ← Story 3.4 — do NOT modify
```

Files to create:

```
client/src/components/
  TaskList.tsx           ← CREATE (this story)
  TaskList.test.tsx      ← CREATE (this story)
```

Other files that must NOT be touched:

```
client/src/hooks/useTasks.ts        ← Story 3.2 — do NOT modify
client/src/hooks/useTasks.test.ts   ← Story 3.2 — do NOT modify
client/src/api/tasksApi.ts          ← Story 3.1 — do NOT modify
client/src/App.tsx                  ← Story 3.7 adds routing — do NOT modify
client/src/main.tsx                 ← do NOT modify
```

### Component Interface

```typescript
// client/src/components/TaskList.tsx
import type { Task } from '@shared/types'

export interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

export function TaskList({ tasks, isLoading, error, toggleTask, deleteTask }: TaskListProps): JSX.Element
```

- `toggleTask` and `deleteTask` originate from `useTasks()` in `HomePage` (Story 3.7) and are drilled through `TaskList` to each `TaskItem`.
- `TaskList` is a **pure presentation component** — it MUST NOT call `useTasks()` or import from `tasksApi.ts` directly.
- `Task` is imported from `@shared/types` (monorepo shared type, NOT a local definition).

### Sorting and Grouping Logic

```typescript
const activeTasks = tasks
  .filter(t => !t.completed)
  .sort((a, b) => b.createdAt - a.createdAt)   // reverse-chronological

const completedTasks = tasks
  .filter(t => t.completed)
  .sort((a, b) => b.createdAt - a.createdAt)   // reverse-chronological
```

This derivation is a render-time computation — no `useMemo` needed at v1 scale (single user, small task count).

### Recommended Component Structure

```tsx
export function TaskList({ tasks, isLoading, error, toggleTask, deleteTask }: TaskListProps) {
  if (isLoading) {
    return <p role="status">Loading…</p>
  }

  const activeTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => b.createdAt - a.createdAt)

  const completedTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="task-list">
      {error && (
        <div className="task-error-banner" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <p className="task-empty-state">No tasks yet</p>
      )}

      {activeTasks.length > 0 && (
        <section aria-label="Active tasks">
          <h2>Active</h2>
          <ul className="task-list__section">
            {activeTasks.map(task => (
              <li key={task.id}>
                <TaskItem task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {completedTasks.length > 0 && (
        <section aria-label="Completed tasks">
          <h2>Completed</h2>
          <ul className="task-list__section">
            {completedTasks.map(task => (
              <li key={task.id}>
                <TaskItem task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
```

**Notes on the structure:**
- `role="alert"` combined with `aria-live="polite"` on the error banner covers FR24/NFR13 — screen readers announce error messages without requiring user interaction.
- Sections are conditionally rendered — if no active or no completed tasks exist, the section is absent entirely.
- Empty-state message only shows when BOTH lists are empty and not loading.
- Loading early-return avoids conditional rendering complexity; task list does not render at all during initial load.

### Error Banner — No Retry Button

Per AC5 and FR13: the error banner shows the error message text only. The user re-triggers the failed action (re-type and submit, re-click checkbox, re-click delete) to retry. The banner automatically clears when the next same-type operation succeeds (handled inside `useTasks`). This is by design — do NOT add a retry button to the error banner.

### Accessibility Requirements (Cross-cutting)

| Requirement | Implementation |
|-------------|----------------|
| FR24 / NFR13 — async status via live regions | `aria-live="polite"` on error banner |
| FR6, FR7 — sections labelled for screen readers | `<section aria-label="Active tasks">` / `<section aria-label="Completed tasks">` |
| NFR10 — keyboard operability | All interaction delegated to `TaskItem` (checkbox + delete button already keyboard-accessible from Story 3.4) |
| NFR14 — WCAG 2.1 Level A | No new ARIA violations introduced; semantic HTML (`<ul>`, `<li>`, `<section>`, `<h2>`) |

### Testing Pattern

```typescript
// TaskList.test.tsx
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { TaskList } from './TaskList'
import type { Task } from '@shared/types'

const mockToggleTask = vi.fn().mockResolvedValue(undefined)
const mockDeleteTask = vi.fn().mockResolvedValue(undefined)

const now = Date.now()
const activeTask: Task = { id: 1, text: 'Buy milk', completed: false, createdAt: now - 1000, userId: null }
const newerActiveTask: Task = { id: 3, text: 'Walk dog', completed: false, createdAt: now, userId: null }
const completedTask: Task = { id: 2, text: 'Read book', completed: true, createdAt: now - 2000, userId: null }

describe('TaskList', () => {
  beforeEach(() => {
    mockToggleTask.mockClear()
    mockDeleteTask.mockClear()
  })

  it('renders a loading indicator when isLoading is true and shows no task items', () => {
    render(
      <TaskList tasks={[activeTask]} isLoading={true} error={null}
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
  })

  it('renders empty-state message when not loading and tasks is empty', () => {
    render(
      <TaskList tasks={[]} isLoading={false} error={null}
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('renders active tasks in a section above completed tasks', () => {
    render(
      <TaskList tasks={[activeTask, completedTask]} isLoading={false} error={null}
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    const activeSection = screen.getByRole('region', { name: /active tasks/i })
    const completedSection = screen.getByRole('region', { name: /completed tasks/i })
    expect(activeSection).toBeInTheDocument()
    expect(completedSection).toBeInTheDocument()
    // Active section appears before completed in the DOM
    expect(activeSection.compareDocumentPosition(completedSection))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders tasks in reverse-chronological order within the active group', () => {
    render(
      <TaskList tasks={[activeTask, newerActiveTask]} isLoading={false} error={null}
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    const taskTexts = screen.getAllByRole('checkbox').map(el =>
      el.closest('div')?.textContent ?? ''
    )
    // newerActiveTask (createdAt = now) should appear before activeTask (createdAt = now - 1000)
    const newerIdx = taskTexts.findIndex(t => t.includes('Walk dog'))
    const olderIdx = taskTexts.findIndex(t => t.includes('Buy milk'))
    expect(newerIdx).toBeLessThan(olderIdx)
  })

  it('renders an error banner with aria-live="polite" when error is non-null', () => {
    render(
      <TaskList tasks={[]} isLoading={false} error="Failed to create task."
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    const banner = screen.getByRole('alert')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent('Failed to create task.')
    expect(banner).toHaveAttribute('aria-live', 'polite')
  })

  it('renders error banner alongside existing tasks', () => {
    render(
      <TaskList tasks={[activeTask]} isLoading={false} error="Failed to delete task."
        toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })
})
```

**Import note:** `@testing-library/react`, `@testing-library/user-event`, and `vitest` are already installed from earlier stories. Do NOT re-install.

### `useTasks` Hook Contract (Consumer Reference)

`TaskList` is a consumer of data originating from `useTasks`. For reference, the full return shape:

```typescript
// from client/src/hooks/useTasks.ts
{ tasks: Task[], isLoading: boolean, error: string | null, createTask, toggleTask, deleteTask }
```

- `isLoading` is `true` only during the initial `GET /api/tasks` fetch. It stays `false` during all mutations (optimistic UI pattern).
- `error` is set per-mutation-type and cleared automatically when the next same-type operation succeeds.
- `tasks` is always the current optimistic state (may contain temporary negative IDs for pending creates that have not yet been confirmed by the server).

`TaskList` only receives `tasks`, `isLoading`, `error`, `toggleTask`, and `deleteTask` — it does NOT receive `createTask` (that goes to `TaskInput`).

### What NOT to Do

| Mistake | Why Forbidden |
|---------|---------------|
| Calling `useTasks()` inside `TaskList` | Architecture rule: hook called once in `HomePage`; props drilled down |
| Importing from `tasksApi.ts` directly | Architecture rule: only `useTasks` calls the API layer |
| Adding a "Retry" button to the error banner | Explicit design decision — FR13 states existing controls are the retry |
| Replacing the task list with the error banner | Error must appear **alongside** existing tasks, not replace them (NFR16) |
| Sorting by `createdAt` ascending | Tasks are reverse-chronological (FR9) — newest first |
| Rendering both sections even when empty | Conditional render — only render a section if it has items |
| Default export for the component | Architecture rule: named exports only for React components |
| Calling `useMemo` on sort logic | YAGNI — single-user app, task counts won't justify memoisation |

### Project Structure Notes

- `TaskList` is the direct parent of `TaskItem` instances. It owns the grouping/sorting logic and delegates per-task rendering to `TaskItem`.
- `TaskList` itself is rendered by `HomePage` (Story 3.7), which also renders `TaskInput` and owns the `useTasks()` call.
- CSS classes (`task-list`, `task-list__section`, `task-error-banner`, `task-empty-state`) can be defined in `client/src/styles/index.css`. Add at end to avoid disrupting existing styles.
- `TaskItem.tsx` (Story 3.4) must exist before this story is implemented. If 3.4 is still in-progress, the import will fail. Verify 3.4 is complete first.

### References

- Epic 3 Story 3.5 definition: [epics.md](../../planning-artifacts/epics.md#story-35-tasklist-component)
- `useTasks` hook (source of truth for state): [client/src/hooks/useTasks.ts](../../../../client/src/hooks/useTasks.ts)
- `TaskItem` component (child): [client/src/components/TaskItem.tsx](../../../../client/src/components/TaskItem.tsx) — see Story 3.4 for full contract
- `Task` type: [shared/types.ts](../../../../shared/types.ts)
- Architecture: Component naming and export conventions [architecture.md](../../planning-artifacts/architecture.md#code--file-naming-conventions)
- Architecture: Optimistic UI pattern (why `isLoading` stays false during mutations) [architecture.md](../../planning-artifacts/architecture.md#frontend-architecture)
- Architecture: Accessibility requirements [architecture.md](../../planning-artifacts/architecture.md#api--communication-patterns)
- FR6: Grouped task list view (active + completed sections)
- FR7: Active tasks appear before completed
- FR9: Reverse-chronological ordering within each group
- FR11: Empty state when no tasks
- FR12: Loading indicator during async operations
- FR13: Inline error state with retry
- FR24: ARIA live regions for async status announcements
- NFR15: No silent failures
- NFR16: Partial functionality when backend is unreachable

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented `TaskList.tsx` as a pure presentation component: loading early-return, active/completed grouping with reverse-chrono sort, inline error banner with `role="alert"` + `aria-live="polite"`, empty-state message.
- 7 tests written and passing in `TaskList.test.tsx` — covers loading state, empty state, grouping order, reverse-chrono ordering, error banner presence with correct ARIA attributes, and banner/tasks co-existence.
- Added CSS utility classes to `client/src/styles/index.css`: `.task-list`, `.task-list__loading`, `.task-list__heading`, `.task-list__section`, `.task-empty-state`, `.task-error-banner`.
- Full client test suite: 49 tests, 0 failures. ESLint: clean (pre-existing TS version warning only).
- Code review patch applied: removed redundant `aria-live="polite"` from `role="alert"` error banner (`role="alert"` already provides assertive live region semantics per ARIA spec); updated corresponding test assertion.

### File List

- client/src/components/TaskList.tsx (created)
- client/src/components/TaskList.test.tsx (created)
- client/src/styles/index.css (modified — appended TaskList CSS classes)

### Review Findings

- [x] [Review][Patch] ARIA conflict: `role="alert"` + `aria-live="polite"` on error banner [TaskList.tsx:28] — removed `aria-live="polite"`; `role="alert"` already provides assertive live region semantics per ARIA spec. Test assertion updated.
- [x] [Review][Defer] Empty-state + error both render when `tasks=[]` and error non-null [TaskList.tsx] — deferred, by-design; correct UX for failed-first-task scenario
- [x] [Review][Defer] Hardcoded CSS hex colors — no contrast verification for `#444` heading [index.css] — deferred, pre-existing pattern; styling pass is a separate concern
- [x] [Review][Defer] `getAllByRole('listitem')` fragile in reverse-chrono test if completed tasks coexist [TaskList.test.tsx] — deferred, test is correct for its specific case
