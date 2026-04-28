# Story 3.3: `TaskInput` Component

Status: done

## Story

As a user,
I want a text input with a submit button to create new tasks,
so that I can add tasks quickly with keyboard or pointer without leaving the input area.

## Acceptance Criteria

1. **Given** `client/src/components/TaskInput.tsx` is rendered **When** the user types text and presses Enter or clicks the submit button **Then** `createTask` is called with the trimmed text and the input is cleared

2. **Given** the input is empty or contains only whitespace **When** the user presses Enter or clicks submit **Then** `createTask` is NOT called — the submission is a no-op

3. **Given** `createTask` resolves successfully **When** the input is cleared **Then** keyboard focus returns to the input field (FR22)

4. **Given** the input element is rendered **When** inspected with a screen reader **Then** it has an accessible label associated via `<label>` (or `aria-label`) — no unlabelled input (FR23)

5. **Given** `TaskInput.test.tsx` exists co-located **When** run via Vitest + React Testing Library **Then** it passes: renders input and button, submit calls hook with trimmed text, empty submit is no-op, input clears after submit, focus returns to input after create

## Tasks / Subtasks

- [x] Create `client/src/components/` directory (does not exist yet) (AC: 1–5)
- [x] Implement `client/src/components/TaskInput.tsx` (AC: 1–4)
  - [x] Export named function `TaskInput` (no default export)
  - [x] Accept props: `createTask: (text: string) => Promise<void>`
  - [x] Controlled input with local `value` state (not `useTasks` — hook is owned by `HomePage`)
  - [x] Submit on Enter keypress (`onKeyDown` with `key === 'Enter'`)
  - [x] Submit on button click (`onClick`)
  - [x] Trim input text before passing to `createTask`; guard against empty/whitespace-only (AC: 1, 2)
  - [x] Clear input to `''` after submit (regardless of success/failure — optimistic pattern)
  - [x] Return focus to the input ref after successful `createTask` resolves (AC: 3)
  - [x] Render `<label>` element associated with the input via `htmlFor`/`id` pair (AC: 4)
  - [x] Accessible button label: `aria-label="Add task"` or visible text "Add" (AC: 4)
- [x] Create co-located test file `client/src/components/TaskInput.test.tsx` (AC: 5)
  - [x] Test: renders input element and submit button
  - [x] Test: submit with text calls `createTask` with trimmed text and clears input
  - [x] Test: pressing Enter calls `createTask` with trimmed text
  - [x] Test: empty input submit is no-op — `createTask` not called
  - [x] Test: whitespace-only input submit is no-op — `createTask` not called
  - [x] Test: input is cleared after successful submit
  - [x] Test: focus returns to input after create (check `document.activeElement`)

## Dev Notes

### ⚠️ Directory Does Not Exist Yet

`client/src/components/` does **not** exist in the current source tree. Create it as the first step.

Confirmed current structure under `client/src/`:
```
client/src/
  api/
    tasksApi.ts          ← already exists (Story 3.1) — do NOT modify
    tasksApi.test.ts     ← already exists — do NOT modify
  hooks/
    useTasks.ts          ← already exists (Story 3.2) — do NOT modify
    useTasks.test.ts     ← already exists — do NOT modify
  styles/
    index.css            ← already exists — do NOT modify
  App.tsx                ← already exists — do NOT modify (Story 3.7 adds routing)
  main.tsx               ← already exists — do NOT modify
  shared-types.smoke.test.ts
```

`TaskInput` is a **pure leaf component** — it receives `createTask` as a prop and has no knowledge of `useTasks`, `tasksApi`, or any sibling component.

---

### Component Interface

```typescript
// client/src/components/TaskInput.tsx

export interface TaskInputProps {
  createTask: (text: string) => Promise<void>
}

export function TaskInput({ createTask }: TaskInputProps): JSX.Element
```

- `createTask` is the same function returned by `useTasks()` — it will be passed as a prop by `HomePage` (Story 3.7).
- The component owns a **local `value` state** for the controlled input. Do NOT call `useTasks` inside this component.

---

### Focus Management — useRef Pattern

```typescript
import { useRef, useState } from 'react'

const inputRef = useRef<HTMLInputElement>(null)

async function handleSubmit() {
  const trimmed = value.trim()
  if (!trimmed) return                      // AC2: empty/whitespace guard

  setValue('')                              // clear input immediately (optimistic)
  await createTask(trimmed)                 // AC1: call with trimmed text
  inputRef.current?.focus()                // AC3: return focus after resolve
}
```

**Critical:** `focus()` must be called **after** `await createTask(...)` resolves, not before. The `useTasks` optimistic pattern resolves immediately (no network round-trip delay from the component's perspective), so focus will return promptly.

---

### Keyboard Handling

```typescript
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') {
    void handleSubmit()
  }
}
```

Do NOT use `onSubmit` on a `<form>` as the only submit path — also support the standalone button click case. Using `<form onSubmit={...}>` is acceptable, but ensure both Enter and button click trigger the same `handleSubmit` function.

---

### Accessible Label — Mandatory

```tsx
<label htmlFor="task-input">New task</label>
<input
  id="task-input"
  ref={inputRef}
  type="text"
  value={value}
  onChange={e => setValue(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="What needs to be done?"
  aria-label="New task"   // belt-and-suspenders — htmlFor pair is primary
/>
<button type="button" onClick={() => void handleSubmit()} aria-label="Add task">
  Add
</button>
```

Both `htmlFor`/`id` association AND `aria-label` ensure maximum screen reader compatibility (AC4, FR23).

---

### What NOT to Do

| Mistake | Why Forbidden |
|---------|--------------|
| Calling `useTasks()` inside `TaskInput` | Architecture rule: hook called once in `HomePage`, props drilled down |
| Importing from `tasksApi` directly | Architecture rule: only `useTasks` calls `tasksApi`; component never calls `fetch` |
| Setting `isLoading = true` on submit | Architecture rule: mutations use optimistic UI — no loading indicator for mutations |
| Default export | Architecture rule: named exports only for React components |
| Leaving stale error in state | N/A here — `TaskInput` does not own error state; `useTasks` owns it |
| Using `useEffect` to clear input | Use synchronous `setValue('')` in the handler directly |

---

### Testing Pattern

```typescript
// TaskInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { TaskInput } from './TaskInput'

describe('TaskInput', () => {
  const mockCreateTask = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockCreateTask.mockClear()
  })

  it('renders input and submit button', () => {
    render(<TaskInput createTask={mockCreateTask} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('calls createTask with trimmed text on button click and clears input', async () => {
    render(<TaskInput createTask={mockCreateTask} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '  Buy milk  ')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(mockCreateTask).toHaveBeenCalledWith('Buy milk')
    expect(input).toHaveValue('')
  })

  it('calls createTask on Enter keypress', async () => {
    render(<TaskInput createTask={mockCreateTask} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'Walk the dog')
    await userEvent.keyboard('{Enter}')
    expect(mockCreateTask).toHaveBeenCalledWith('Walk the dog')
  })

  it('does not call createTask when input is empty', async () => {
    render(<TaskInput createTask={mockCreateTask} />)
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  it('does not call createTask when input is whitespace only', async () => {
    render(<TaskInput createTask={mockCreateTask} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, '   ')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  it('returns focus to input after successful create', async () => {
    render(<TaskInput createTask={mockCreateTask} />)
    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'New task')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    await waitFor(() => {
      expect(document.activeElement).toBe(input)
    })
  })
})
```

**Mock boundary:** `createTask` is passed as a prop — mock it with `vi.fn()`. Do NOT mock `tasksApi` or `useTasks` in this component test.

---

### Architecture Compliance Checklist

| Rule | Detail |
|------|--------|
| ✅ Named export only | `export function TaskInput(...)` — no default export |
| ✅ Types from `@shared/types` | No task types needed here; `createTask` prop type is explicit |
| ✅ Receives `createTask` as prop | Never calls `useTasks()` internally |
| ✅ No direct `fetch` calls | Component has no knowledge of HTTP |
| ✅ No `isLoading` during mutation | Optimistic UI: input clears immediately, no spinner |
| ✅ Accessible label | `<label htmlFor>` + `aria-label` belt-and-suspenders |
| ✅ Focus returns after create | `inputRef.current?.focus()` after `await createTask` |
| ✅ Co-located test | `TaskInput.test.tsx` in same directory as `TaskInput.tsx` |
| ✅ No default export for component | Named `export function TaskInput` |
| ✅ ESLint must pass | `npm run lint --workspaces` zero errors before PR |

---

### File Structure

```
client/src/
  components/              ← CREATE this directory
    TaskInput.tsx          ← NEW (this story)
    TaskInput.test.tsx     ← NEW (this story)
  api/
    tasksApi.ts            ← already exists — do NOT modify
    tasksApi.test.ts       ← already exists — do NOT modify
  hooks/
    useTasks.ts            ← already exists — do NOT modify
    useTasks.test.ts       ← already exists — do NOT modify
  styles/
    index.css              ← already exists — do NOT modify
  App.tsx                  ← already exists — do NOT modify
  main.tsx                 ← already exists — do NOT modify
```

**Important:** Do NOT wire `TaskInput` into `App.tsx` or `main.tsx` in this story. That integration happens in Story 3.7 (`HomePage` and SPA routing). This story only creates and tests the component in isolation.

---

### Previous Story Intelligence (Stories 3.1 & 3.2)

From **Story 3.1** (`tasksApi.ts`):
- `tasksApi.ts` is fully implemented, tested, and handles empty/non-JSON response bodies.
- `createTask(text: string): Promise<Task>` — do not call this directly from the component; it reaches the component via the `createTask` prop from `useTasks`.

From **Story 3.2** (`useTasks.ts`):
- The hook is fully implemented: `{ tasks, isLoading, error, createTask, toggleTask, deleteTask }`.
- Optimistic UI is already wired: `createTask` in the hook clears `error`, applies optimistic state, then either confirms or rolls back. The component does NOT need to handle rollback UI — that's the hook's concern.
- `createTask` in the hook already trims text (via `text.trim()` passed to `tasksApi.createTask`). The component still trims before passing to be safe — double-trimming is harmless.
- `useTasks` uses `nextOptimisticId` ref (negative IDs) to avoid `Date.now()` collisions — this is an implementation detail the component does not need to know about.
- Review patches applied to the hook: monotonic negative IDs (Patch 4), per-type error isolation (Patch 2), cancelled flag on unmount (Patch 3). None of these affect `TaskInput` behaviour.

---

### Project Context References

- [project-context.md: Framework-Specific Rules → React / Frontend](_bmad-output/project-context.md) — `useTasks` called once at `HomePage`, no child calls hook, no direct `fetch` in components
- [project-context.md: Testing Rules → Frontend Testing](_bmad-output/project-context.md) — Vitest + RTL, co-located `.test.tsx` files
- [project-context.md: Testing Rules → Mock Boundaries](_bmad-output/project-context.md) — component tests mock prop functions (no module mocking needed here)
- [project-context.md: Imports & Exports](_bmad-output/project-context.md) — named exports, no default exports for components
- [project-context.md: Code Quality → Naming Conventions](_bmad-output/project-context.md) — PascalCase component file + export, `.test.tsx` suffix
- [epics.md: Story 3.3](_bmad-output/planning-artifacts/epics.md) — canonical acceptance criteria
- [3-2-usetasks-hook.md](_bmad-output/implementation-artifacts/3-2-usetasks-hook.md) — `createTask` prop shape and optimistic UI 3-step pattern

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5 (GitHub Copilot)

### Debug Log References

- Fixed `describe`/`it`/`beforeEach`/`afterEach` not being global in vitest — imported from `'vitest'` explicitly (matches existing test file pattern in this project).
- Added explicit `afterEach(cleanup)` from `@testing-library/react` — RTL auto-cleanup does not fire without vitest `globals: true`, which is not configured in this project.

### Completion Notes List

- Created `client/src/components/TaskInput.tsx`: controlled input with `useRef` for focus management, `useState` for value, guards for empty/whitespace, Enter + button submit paths, `<label htmlFor>` + `aria-label` a11y.
- Created `client/src/components/TaskInput.test.tsx`: 7 tests covering all ACs — renders, trimmed submit via button, Enter keypress, empty no-op, whitespace no-op, input cleared, focus returns.
- All 32 client tests pass (7 new + 25 pre-existing). Zero regressions. Zero ESLint errors.

### File List

- `client/src/components/TaskInput.tsx` — NEW
- `client/src/components/TaskInput.test.tsx` — NEW

### Review Findings

- [x] [Review][Patch] IME composition guard missing — Enter fires during active IME composition (e.g. CJK input), submitting partial characters [client/src/components/TaskInput.tsx:22]
- [x] [Review][Patch] `vi.fn` uses deprecated Vitest 1.x tuple generic syntax — update to `vi.fn<(text: string) => Promise<void>>()` [client/src/components/TaskInput.test.tsx:7]
- [x] [Review][Patch] Enter-key test missing input-clear assertion — AC1 requires both `createTask` called AND input cleared for the Enter path [client/src/components/TaskInput.test.tsx:40]
- [x] [Review][Defer] Focus not restored when `createTask` rejects — if the prop ever throws, `focus()` is never called; pre-existing robustness gap given current architecture (createTask never re-throws) [client/src/components/TaskInput.tsx:17] — deferred, pre-existing
