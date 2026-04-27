import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types'
import { describe, it, expect } from 'vitest'

describe('@shared/types resolution in client workspace', () => {
  it('Task has correct runtime shape', () => {
    const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000, userId: null }
    expect(typeof task.id).toBe('number')
    expect(typeof task.text).toBe('string')
    expect(typeof task.completed).toBe('boolean')
    expect(typeof task.createdAt).toBe('number')
  })

  it('CreateTaskPayload has correct runtime shape', () => {
    const p: CreateTaskPayload = { text: 'buy milk' }
    expect(typeof p.text).toBe('string')
  })

  it('UpdateTaskPayload has correct runtime shape — completed: true', () => {
    const p: UpdateTaskPayload = { completed: true }
    expect(typeof p.completed).toBe('boolean')
  })

  it('UpdateTaskPayload has correct runtime shape — completed: false', () => {
    const p: UpdateTaskPayload = { completed: false }
    expect(typeof p.completed).toBe('boolean')
  })

  it('ApiError has correct runtime shape', () => {
    const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'task not found' }
    expect(typeof e.statusCode).toBe('number')
  })
})
