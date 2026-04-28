import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Task } from '@shared/types'
import { useTasks } from './useTasks'
import * as tasksApi from '../api/tasksApi'

vi.mock('../api/tasksApi')

const mockGetTasks = vi.mocked(tasksApi.getTasks)
const mockCreateTask = vi.mocked(tasksApi.createTask)
const mockUpdateTask = vi.mocked(tasksApi.updateTask)
const mockDeleteTask = vi.mocked(tasksApi.deleteTask)

const task1: Task = { id: 1, text: 'Task 1', completed: false, createdAt: 1000, userId: null }
const task2: Task = { id: 2, text: 'Task 2', completed: true, createdAt: 2000, userId: null }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTasks', () => {
  it('initial load success: isLoading true then false, tasks populated', async () => {
    mockGetTasks.mockResolvedValue([task1, task2])

    const { result } = renderHook(() => useTasks())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.tasks).toEqual([task1, task2])
    expect(result.current.error).toBeNull()
  })

  it('initial load error: isLoading false, error set to user-facing string', async () => {
    mockGetTasks.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.tasks).toEqual([])
    expect(result.current.error).toBe('Failed to load tasks.')
  })

  it('createTask success: optimistic update applied, confirmed by server response', async () => {
    mockGetTasks.mockResolvedValue([task1])
    const confirmedTask: Task = { id: 99, text: 'New task', completed: false, createdAt: 9000, userId: null }
    mockCreateTask.mockResolvedValue(confirmedTask)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createTask('New task')
    })

    // Patch 5: verify trimmed text is passed to the API
    expect(mockCreateTask).toHaveBeenCalledWith('New task')
    expect(result.current.tasks).toContainEqual(confirmedTask)
    // optimistic task replaced — no temp id remaining
    expect(result.current.tasks.some(t => t.id === confirmedTask.id)).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('createTask trims whitespace before sending to API', async () => {
    mockGetTasks.mockResolvedValue([])
    const confirmed: Task = { id: 99, text: 'New task', completed: false, createdAt: 9000, userId: null }
    mockCreateTask.mockResolvedValue(confirmed)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createTask('  New task  ')
    })

    expect(mockCreateTask).toHaveBeenCalledWith('New task')
  })

  it('cross-type success does not clear error from a different mutation type', async () => {
    mockGetTasks.mockResolvedValue([task1])
    const toggled: Task = { ...task1, completed: true }
    mockCreateTask.mockRejectedValue(new Error('API error'))
    mockUpdateTask.mockResolvedValue(toggled)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // createTask fails — error set to create-failure message
    await act(async () => {
      await result.current.createTask('x')
    })
    expect(result.current.error).toBe('Failed to create task. Please try again.')

    // toggleTask succeeds — must NOT clear the createTask error
    await act(async () => {
      await result.current.toggleTask(task1.id)
    })
    expect(result.current.error).toBe('Failed to create task. Please try again.')
  })

  it('createTask rollback: state reverts to snapshot on API error, error non-null', async () => {
    mockGetTasks.mockResolvedValue([task1])
    mockCreateTask.mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.createTask('New task')
    })

    expect(result.current.tasks).toEqual([task1])
    expect(result.current.error).toBe('Failed to create task. Please try again.')
  })

  it('toggleTask success: task.completed flips, confirmed by server', async () => {
    mockGetTasks.mockResolvedValue([task1])
    const toggled: Task = { ...task1, completed: true }
    mockUpdateTask.mockResolvedValue(toggled)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.toggleTask(task1.id)
    })

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('toggleTask rollback: state reverts, error set', async () => {
    mockGetTasks.mockResolvedValue([task1])
    mockUpdateTask.mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.toggleTask(task1.id)
    })

    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.error).toBe('Failed to update task. Please try again.')
  })

  it('deleteTask success: task removed from state', async () => {
    mockGetTasks.mockResolvedValue([task1, task2])
    mockDeleteTask.mockResolvedValue(undefined)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteTask(task1.id)
    })

    expect(result.current.tasks).not.toContainEqual(task1)
    expect(result.current.tasks).toContainEqual(task2)
    expect(result.current.error).toBeNull()
  })

  it('deleteTask rollback: state reverts, error set', async () => {
    mockGetTasks.mockResolvedValue([task1, task2])
    mockDeleteTask.mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.deleteTask(task1.id)
    })

    expect(result.current.tasks).toContainEqual(task1)
    expect(result.current.error).toBe('Failed to delete task. Please try again.')
  })

  it('successful retry after failed mutation clears error', async () => {
    mockGetTasks.mockResolvedValue([task1])
    const retryTask: Task = { id: 99, text: 'Retry task', completed: false, createdAt: 9000, userId: null }
    mockCreateTask
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue(retryTask)

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // First attempt fails
    await act(async () => {
      await result.current.createTask('Retry task')
    })
    expect(result.current.error).toBe('Failed to create task. Please try again.')

    // Second attempt succeeds — error is cleared
    await act(async () => {
      await result.current.createTask('Retry task')
    })
    expect(result.current.error).toBeNull()
  })
})
