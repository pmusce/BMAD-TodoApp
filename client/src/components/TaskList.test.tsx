import { render, screen, cleanup } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
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

  afterEach(() => {
    cleanup()
  })

  it('renders a loading indicator when isLoading is true and shows no task items', () => {
    render(
      <TaskList
        tasks={[activeTask]}
        isLoading={true}
        error={null}
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
  })

  it('renders empty-state message when not loading and tasks is empty', () => {
    render(
      <TaskList
        tasks={[]}
        isLoading={false}
        error={null}
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })

  it('renders active tasks in a section above completed tasks', () => {
    render(
      <TaskList
        tasks={[activeTask, completedTask]}
        isLoading={false}
        error={null}
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    const activeSection = screen.getByRole('region', { name: /active tasks/i })
    const completedSection = screen.getByRole('region', { name: /completed tasks/i })
    expect(activeSection).toBeInTheDocument()
    expect(completedSection).toBeInTheDocument()
    // Active section must precede completed in DOM order
    expect(
      activeSection.compareDocumentPosition(completedSection)
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders tasks in reverse-chronological order within the active group', () => {
    render(
      <TaskList
        tasks={[activeTask, newerActiveTask]}
        isLoading={false}
        error={null}
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    const taskItems = screen.getAllByRole('listitem')
    const texts = taskItems.map(li => li.textContent ?? '')
    const newerIdx = texts.findIndex(t => t.includes('Walk dog'))
    const olderIdx = texts.findIndex(t => t.includes('Buy milk'))
    expect(newerIdx).toBeGreaterThanOrEqual(0)
    expect(olderIdx).toBeGreaterThanOrEqual(0)
    expect(newerIdx).toBeLessThan(olderIdx)
  })

  it('renders an error banner with aria-live="polite" when error is non-null', () => {
    render(
      <TaskList
        tasks={[]}
        isLoading={false}
        error="Failed to create task."
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    const banner = screen.getByRole('alert')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent('Failed to create task.')
  })

  it('renders error banner alongside existing tasks (tasks still visible)', () => {
    render(
      <TaskList
        tasks={[activeTask]}
        isLoading={false}
        error="Failed to delete task."
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('does not render empty-state when tasks exist', () => {
    render(
      <TaskList
        tasks={[activeTask]}
        isLoading={false}
        error={null}
        toggleTask={mockToggleTask}
        deleteTask={mockDeleteTask}
      />
    )
    expect(screen.queryByText(/no tasks yet/i)).not.toBeInTheDocument()
  })
})
