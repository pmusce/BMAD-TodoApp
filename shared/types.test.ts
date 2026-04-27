import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from './types.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('Task satisfies required shape', () => {
  const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000 }
  assert.strictEqual(typeof task.id, 'number')
  assert.strictEqual(typeof task.text, 'string')
  assert.strictEqual(typeof task.completed, 'boolean')
  assert.strictEqual(typeof task.createdAt, 'number')
})

test('CreateTaskPayload satisfies required shape', () => {
  const p: CreateTaskPayload = { text: 'buy milk' }
  assert.strictEqual(typeof p.text, 'string')
})

test('UpdateTaskPayload satisfies required shape — completed: true', () => {
  const p: UpdateTaskPayload = { completed: true }
  assert.strictEqual(typeof p.completed, 'boolean')
})

test('UpdateTaskPayload satisfies required shape — completed: false', () => {
  const p: UpdateTaskPayload = { completed: false }
  assert.strictEqual(typeof p.completed, 'boolean')
})

test('ApiError satisfies required shape', () => {
  const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'task not found' }
  assert.strictEqual(typeof e.statusCode, 'number')
  assert.strictEqual(typeof e.error, 'string')
  assert.strictEqual(typeof e.message, 'string')
})
