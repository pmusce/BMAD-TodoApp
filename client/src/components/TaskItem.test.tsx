import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
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

  afterEach(() => {
    cleanup()
  })

  it('renders task text', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('renders a relative timestamp string', () => {
    const { container } = render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    const timeEl = container.querySelector('time')
    expect(timeEl?.textContent).toMatch(/ago|just now|minute|hour|day/i)
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
    const { container } = render(<TaskItem task={completedTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(container.querySelector('.task-text--completed')).toBeInTheDocument()
  })

  it('does not apply strikethrough class when task is active', () => {
    const { container } = render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(container.querySelector('.task-text--completed')).not.toBeInTheDocument()
  })

  it('has accessible aria-label on delete button', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument()
  })

  it('renders checkbox in checked state when task is completed', () => {
    const completedTask = { ...baseTask, completed: true }
    render(<TaskItem task={completedTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('renders checkbox in unchecked state when task is active', () => {
    render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('checkbox label is correctly associated via htmlFor/id', () => {
    const { container } = render(<TaskItem task={baseTask} toggleTask={mockToggleTask} deleteTask={mockDeleteTask} />)
    const checkbox = screen.getByRole('checkbox')
    const id = checkbox.getAttribute('id')
    expect(id).toBeTruthy()
    expect(container.querySelector(`label[for="${id}"]`)).toBeInTheDocument()
  })
})
