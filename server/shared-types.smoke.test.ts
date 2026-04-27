import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types.js'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('@shared/types — Task resolves in server workspace', () => {
  const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000 }
  assert.strictEqual(typeof task.id, 'number')
})

test('@shared/types — CreateTaskPayload resolves in server workspace', () => {
  const p: CreateTaskPayload = { text: 'buy milk' }
  assert.strictEqual(typeof p.text, 'string')
})

test('@shared/types — UpdateTaskPayload resolves in server workspace (true)', () => {
  const p: UpdateTaskPayload = { completed: true }
  assert.strictEqual(typeof p.completed, 'boolean')
})

test('@shared/types — UpdateTaskPayload resolves in server workspace (false)', () => {
  const p: UpdateTaskPayload = { completed: false }
  assert.strictEqual(typeof p.completed, 'boolean')
})

test('@shared/types — ApiError resolves in server workspace', () => {
  const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'task not found' }
  assert.strictEqual(typeof e.statusCode, 'number')
})
