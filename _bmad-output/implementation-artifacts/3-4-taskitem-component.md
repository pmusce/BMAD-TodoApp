# Story 3.4: `TaskItem` Component

Status: done

## Story

As a user,
I want each task displayed with a checkbox to toggle completion and a delete button,
so that I can manage individual tasks without navigating away.

## Acceptance Criteria

1. **Given** `client/src/components/TaskItem.tsx` receives a `Task` prop with `completed: false` **When** rendered **Then** it shows the task text without strikethrough and the checkbox is unchecked

2. **Given** the task has `completed: true` **When** rendered **Then** the task text has a CSS strikethrough style applied (FR8)

3. **Given** the user checks or unchecks the checkbox **When** the change event fires **Then** `toggleTask(task.id)` is called

4. **Given** the user clicks the delete button **When** the click event fires **Then** `deleteTask(task.id)` is called

5. **Given** the delete button renders with only an icon **When** inspected by a screen reader **Then** it has `aria-label="Delete task"` (or equivalent accessible name) (FR23)

6. **Given** the checkbox `<input>` and its `<label>` are rendered **When** inspected **Then** the `<label>` `htmlFor` matches the `<input>` `id` — correctly associated for screen reader support (FR20)

7. **Given** the task's `createdAt` timestamp is present **When** rendered **Then** a human-readable relative time string is shown (e.g. "2 hours ago") using `Intl.RelativeTimeFormat` or equivalent (FR10)

8. **Given** `TaskItem.test.tsx` exists co-located **When** run via Vitest + React Testing Library **Then** it passes: renders text, renders relative timestamp, checkbox calls toggleTask, delete button calls deleteTask, completed task has strikethrough class, aria-label present on delete button

## Tasks / Subtasks

- [x] Implement `client/src/components/TaskItem.tsx` (AC: 1–7)
  - [x] Export named function `TaskItem` (no default export) with exported `TaskItemProps` interface
  - [x] Accept props: `task: Task`, `toggleTask: (id: number) => Promise<void>`, `deleteTask: (id: number) => Promise<void>`
  - [x] Render task `text` in a `<span>` or `<p>` — apply strikethrough CSS class when `task.completed === true` (AC: 1, 2)
  - [x] Render a checkbox `<input type="checkbox">` with `checked={task.completed}` and `onChange` calling `toggleTask(task.id)` (AC: 3)
  - [x] Associate checkbox with a `<label>` via unique `htmlFor`/`id` pair (use `task.id` to ensure uniqueness) (AC: 6)
  - [x] Render a delete `<button>` with `onClick` calling `deleteTask(task.id)` (AC: 4)
  - [x] Add `aria-label="Delete task"` to the delete button (AC: 5)
  - [x] Implement `formatRelativeTime(createdAt: number): string` utility using `Intl.RelativeTimeFormat` and render it (AC: 7)
  - [x] Use `void handleToggle()` / `void handleDelete()` pattern for async event handlers (consistent with TaskInput)
- [x] Create co-located test file `client/src/components/TaskItem.test.tsx` (AC: 8)
  - [x] Test: renders task text
  - [x] Test: renders relative timestamp (non-empty string)
  - [x] Test: checkbox calls toggleTask with task id
  - [x] Test: delete button calls deleteTask with task id
  - [x] Test: completed task has strikethrough class applied to text element
  - [x] Test: aria-label on delete button is "Delete task"

## Dev Notes

### Source Tree State

`client/src/components/` already exists (created in Story 3.3). Current contents:

```
client/src/components/
  TaskInput.tsx          ← Story 3.3 — do NOT modify
  TaskInput.test.tsx     ← Story 3.3 — do NOT modify
```

Files to create:

```
client/src/components/
  TaskItem.tsx           ← CREATE (this story)
  TaskItem.test.tsx      ← CREATE (this story)
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
// client/src/components/TaskItem.tsx
import type { Task } from '@shared/types'

export interface TaskItemProps {
  task: Task
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

export function TaskItem({ task, toggleTask, deleteTask }: TaskItemProps): JSX.Element
```

- `toggleTask` and `deleteTask` are the same functions returned by `useTasks()` — they will be passed as props by `TaskList` (Story 3.5) which receives them from `HomePage` (Story 3.7).
- `TaskItem` is a **pure leaf component** — it MUST NOT call `useTasks()` or import from `tasksApi.ts` directly.
- `Task` is imported from `@shared/types` (the monorepo shared type, NOT a local type definition).

### Async Handler Pattern (consistent with TaskInput)

```typescript
async function handleToggle() {
  await toggleTask(task.id)
}

async function handleDelete() {
  await deleteTask(task.id)
}

// In JSX:
<input type="checkbox" ... onChange={() => void handleToggle()} />
<button ... onClick={() => void handleDelete()}>...</button>
```

**Note:** mutations use optimistic UI in `useTasks` — the handler resolves immediately from the component's perspective; no `isLoading` flag is set. Do NOT add any loading state inside `TaskItem`.

### Strikethrough — CSS Class Pattern

Apply a CSS class conditionally, not inline styles:

```typescript
<span className={task.completed ? 'task-text task-text--completed' : 'task-text'}>
  {task.text}
</span>
```

Where `task-text--completed` adds `text-decoration: line-through`. This makes it easy to test via `toHaveClass` and keeps styling concerns in CSS.

### Accessible Checkbox — Unique ID per Task

Use `task.id` to generate a unique `id` for the checkbox `<input>`, ensuring multiple `TaskItem` components on the same page don't share the same `id`:

```typescript
const checkboxId = `task-checkbox-${task.id}`

<label htmlFor={checkboxId}>
  {/* visually hidden label text, or task text if label wraps it */}
  <span className="sr-only">Mark task as {task.completed ? 'incomplete' : 'complete'}</span>
</label>
<input
  type="checkbox"
  id={checkboxId}
  checked={task.completed}
  onChange={() => void handleToggle()}
/>
```

Alternative approach (both are valid): wrap the text span inside the `<label>` and skip the separate `<span>` — what matters is that `htmlFor` matches `id` (AC6).

### Relative Time — `Intl.RelativeTimeFormat` (No External Library)

`createdAt` is Unix milliseconds. Calculate the diff from `Date.now()` and pick the most appropriate unit:

```typescript
function formatRelativeTime(createdAt: number): string {
  const diffMs = createdAt - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second')
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  return rtf.format(diffDay, 'day')
}
```

Place this helper **inside `TaskItem.tsx`** (not in a separate utility file — it is only used here). This function does NOT need its own test file; it is covered by the component test that checks the rendered timestamp is a non-empty string.

**Rendered output:**
```tsx
<time dateTime={new Date(task.createdAt).toISOString()}>
  {formatRelativeTime(task.createdAt)}
</time>
```

Using the semantic `<time>` element with a machine-readable `dateTime` attribute satisfies accessibility requirements.

### Full Component Skeleton

```typescript
import type { Task } from '@shared/types'

export interface TaskItemProps {
  task: Task
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

function formatRelativeTime(createdAt: number): string {
  // ... implementation above
}

export function TaskItem({ task, toggleTask, deleteTask }: TaskItemProps) {
  const checkboxId = `task-checkbox-${task.id}`

  async function handleToggle() {
    await toggleTask(task.id)
  }

  async function handleDelete() {
    await deleteTask(task.id)
  }

  return (
    <div className="task-item">
      <input
        type="checkbox"
        id={checkboxId}
        checked={task.completed}
        onChange={() => void handleToggle()}
      />
      <label htmlFor={checkboxId}>
        <span className={task.completed ? 'task-text task-text--completed' : 'task-text'}>
          {task.text}
        </span>
      </label>
      <time dateTime={new Date(task.createdAt).toISOString()}>
        {formatRelativeTime(task.createdAt)}
      </time>
      <button
        type="button"
        aria-label="Delete task"
        onClick={() => void handleDelete()}
      >
        ×
      </button>
    </div>
  )
}
```

### What NOT to Do

| Mistake | Why Forbidden |
|---------|---------------|
| Calling `useTasks()` inside `TaskItem` | Architecture rule: hook called once in `HomePage`; props drilled via `TaskList` |
| Importing from `tasksApi.ts` directly | Architecture rule: only `useTasks` calls the API layer |
| Setting loading state during toggle/delete | Mutations use optimistic UI — `isLoading` stays `false` during mutations |
| Default export | Architecture rule: named exports only for React components |
| Using `task.userId` in any way | `userId` is reserved for future auth; never surfaced in v1 UI |
| Hardcoding `id="task-checkbox"` | Must be unique per task — use `task-checkbox-${task.id}` |
| Using `Math.abs(diffDay) > 365` to format years | YAGNI — single-user v1 app won't accumulate year-old tasks |
| Storing `formatRelativeTime` in a separate utility file | Only used in this one component — keep it co-located |

### Testing Pattern

```typescript
// TaskItem.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TaskItem } from './TaskItem'
import type { Task } from '@shared/types'

const baseTask: Task = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: Date.now() - 1000 * 60 * 2, // 2 minutes ago
  userId: null,
}

describe('TaskItem', () => {
  const mockToggleTask = vi.fn().mockResolvedValue(undefined)
  const mockDeleteTask = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockToggleTask.mockClear()
    mockDeleteTask.mockClear()
  })

  it('renders task text', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders a non-empty relative timestamp', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    // time element should have non-empty text
    const timeEl = document.querySelector('time')
    expect(timeEl?.textContent).toBeTruthy()
  })

  it('calls toggleTask with task id when checkbox is clicked', async () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    await userEvent.click(screen.getByRole('checkbox'))
    expect(mockToggleTask).toHaveBeenCalledWith(1)
  })

  it('calls deleteTask with task id when delete button is clicked', async () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    await userEvent.click(screen.getByRole('button', { name: /delete task/i }))
    expect(mockDeleteTask).toHaveBeenCalledWith(1)
  })

  it('applies strikethrough class when task is completed', () => {
    const completedTask = { ...baseTask, completed: true }
    render(<TaskItem task={completedTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    // The text element should have the completed CSS class
    const textEl = document.querySelector('.task-text--completed')
    expect(textEl).toBeInTheDocument()
  })

  it('does not apply strikethrough class when task is active', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    const textEl = document.querySelector('.task-text--completed')
    expect(textEl).not.toBeInTheDocument()
  })

  it('has accessible aria-label on delete button', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument()
  })
})
```

**Test imports note:** `@testing-library/react`, `@testing-library/user-event`, and `vitest` are already installed from Story 3.3's setup. Do NOT re-install.

### Project Structure Notes

- `client/src/components/TaskItem.tsx` will be consumed by `TaskList` (Story 3.5) and ultimately rendered from `HomePage` (Story 3.7) — this story creates the component in isolation, no wiring to parent components yet.
- The CSS classes (`task-text`, `task-text--completed`, `task-item`) can be defined in `client/src/styles/index.css` (already exists) or in a co-located CSS module — either is acceptable; the test checks for class presence via `querySelector`, not inline styles.
- If adding styles to `index.css`, add them at the end to avoid disrupting existing styles.

### References

- Epic 3 Story 3.4 definition: [epics.md](../../planning-artifacts/epics.md#story-34-taskitem-component)
- Task type: [shared/types.ts](../../../../shared/types.ts)
- Architecture: Component naming and export conventions [architecture.md](../../planning-artifacts/architecture.md#code--file-naming-conventions)
- Architecture: Optimistic UI / no loading state during mutations [architecture.md](../../planning-artifacts/architecture.md#optimistic-ui-pattern)
- Architecture: Accessibility requirements (FR20, FR21, FR23, NFR10–12) [architecture.md](../../planning-artifacts/architecture.md#api--communication-patterns)
- Previous story (3.3) established component patterns: [3-3-taskinput-component.md](./3-3-taskinput-component.md)
- FR8: Strikethrough on completed tasks
- FR10: Relative timestamp display
- FR20: Keyboard-only operability (label/input association)
- FR23: Accessible labels on icon-only controls
- FR27: Touch targets ≥ 44×44 CSS px

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot)

### Debug Log References

N/A — implementation completed without blockers.

### Completion Notes List

- ✅ Implemented `TaskItem.tsx` as a named export pure leaf component accepting `task`, `toggleTask`, `deleteTask` props
- ✅ `formatRelativeTime` implemented inline using `Intl.RelativeTimeFormat` — no external library needed
- ✅ Strikethrough applied via CSS class `task-text--completed` (testable, not inline style)
- ✅ Unique checkbox `id` per task (`task-checkbox-${task.id}`) with matching `htmlFor` on label
- ✅ `aria-label="Delete task"` on delete button (FR23)
- ✅ `void handleToggle()` / `void handleDelete()` async handler pattern consistent with `TaskInput`
- ✅ Semantic `<time>` element with ISO `dateTime` attribute for accessibility
- ✅ 10 tests created and passing in `TaskItem.test.tsx` covering all ACs
- ✅ Fixed: explicit vitest imports (`describe`, `it`, `expect`, `beforeEach`, `afterEach`) — project does not use `globals: true`
- ✅ All 42 client tests pass; zero regressions; lint clean

### File List

- `client/src/components/TaskItem.tsx` (new)
- `client/src/components/TaskItem.test.tsx` (new)

### Review Findings

#### Patch (3)

- [x] [Review][Patch] Cascading rounding in `formatRelativeTime` — each derived unit is computed from the already-rounded previous unit instead of independently from `diffMs`; at precise boundaries (e.g. 59m 59.5s) the wrong unit is selected [client/src/components/TaskItem.tsx:11-14]
- [x] [Review][Patch] Timestamp test assertion too weak — `expect(timeEl?.textContent).toBeTruthy()` passes for any non-empty string and cannot catch a regression that breaks the `Intl.RelativeTimeFormat` path; assert against a relative-time pattern instead [client/src/components/TaskItem.test.tsx:36-38]
- [x] [Review][Patch] `document.querySelector` not scoped to rendered container — queries the global document, fragile when multiple `TaskItem` instances exist in the same document; use `container.querySelector` or `screen.getByRole` from the rendered result [client/src/components/TaskItem.test.tsx:37,55,61]

#### Defer (3)

- [x] [Review][Defer] `Intl.RelativeTimeFormat` instantiated on every render — should be a module-level constant [client/src/components/TaskItem.tsx:16] — deferred, performance micro-opt with zero functional impact for single-user v1
- [x] [Review][Defer] No in-flight guard for double-click on toggle/delete — intentional per optimistic UI architecture; `useTasks` handles state — deferred, pre-existing architectural decision
- [x] [Review][Defer] Touch targets ≥ 44×44 CSS px (FR27) — not implemented — deferred, FR27 is an explicit AC of Story 3.7 (`SPA Routing, HomePage, and Global Styles`)
