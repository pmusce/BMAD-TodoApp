// === STATIC IMPORTS (must NOT import taskRoutes.ts here — mock must be set up first) ===
import { mock, describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import type Database from 'better-sqlite3'
import errorHandlerPlugin from '../plugins/errorHandler.ts'
import type { Task } from '@shared/types.js'

// === MOCK SETUP (synchronous — must run before dynamic import of taskRoutes.ts) ===
const mockTask: Task = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: 1704067200000,
  userId: null,
}

const mockFindAll = mock.fn((): Task[] => [mockTask])
const mockCreate = mock.fn((_payload: { text: string }): Task => mockTask)
const mockUpdate = mock.fn((_id: number, _patch: { completed: boolean }): Task | undefined => mockTask)
const mockDelete = mock.fn((_id: number): boolean => true)

mock.module('../repositories/TaskRepository.ts', {
  namedExports: {
    TaskRepository: class MockTaskRepository {
      constructor(_db: unknown) {}
      findAll() { return mockFindAll() }
      create(payload: { text: string }) { return mockCreate(payload) }
      update(id: number, patch: { completed: boolean }) { return mockUpdate(id, patch) }
      delete(id: number) { return mockDelete(id) }
    },
  },
})

// === DYNAMIC IMPORT (loads mocked version of TaskRepository via taskRoutes.ts) ===
const { default: taskRoutes } = await import('./taskRoutes.ts')

// === HELPERS ===
async function buildTestApp() {
  const app = Fastify({ logger: false })
  // Decoration must exist because MockTaskRepository constructor receives fastify.db
  app.decorate('db', {} as unknown as Database.Database)
  await app.register(sensible)
  await app.register(errorHandlerPlugin)
  await app.register(taskRoutes, { prefix: '/api/tasks' })
  await app.ready()
  return app
}

// === TESTS ===
describe('taskRoutes', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>

  before(async () => {
    app = await buildTestApp()
  })

  after(async () => {
    await app.close()
  })

  function resetMocks() {
    mockFindAll.mock.resetCalls()
    mockCreate.mock.resetCalls()
    mockUpdate.mock.resetCalls()
    mockDelete.mock.resetCalls()
  }

  it('GET /api/tasks → 200 with task array', async () => {
    resetMocks()
    const res = await app.inject({ method: 'GET', url: '/api/tasks' })
    assert.equal(res.statusCode, 200)
    assert.deepStrictEqual(res.json(), [mockTask])
    assert.equal(mockFindAll.mock.calls.length, 1)
  })

  it('POST /api/tasks with valid text → 201 with created Task', async () => {
    resetMocks()
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Buy milk' }),
    })
    assert.equal(res.statusCode, 201)
    assert.deepStrictEqual(res.json(), mockTask)
    assert.equal(mockCreate.mock.calls.length, 1)
    assert.deepStrictEqual(mockCreate.mock.calls[0]!.arguments[0], { text: 'Buy milk' })
  })

  it('POST /api/tasks with empty string → 400 (JSON Schema minLength)', async () => {
    resetMocks()
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    })
    assert.equal(res.statusCode, 400)
    const body = res.json<{ statusCode: number; error: string; message: string }>()
    assert.equal(body.statusCode, 400)
    assert.equal(body.error, 'Bad Request')
    assert.equal(mockCreate.mock.calls.length, 0)
  })

  it('POST /api/tasks with whitespace-only text → 400 (handler trim guard)', async () => {
    resetMocks()
    const res = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    })
    assert.equal(res.statusCode, 400)
    const body = res.json<{ statusCode: number; error: string; message: string }>()
    assert.equal(body.statusCode, 400)
    assert.equal(body.error, 'Bad Request')
    assert.equal(mockCreate.mock.calls.length, 0)
  })

  it('PATCH /api/tasks/:id with existing id → 200 with updated Task', async () => {
    resetMocks()
    const updatedTask: Task = { ...mockTask, completed: true }
    mockUpdate.mock.mockImplementationOnce(() => updatedTask)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/tasks/1',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    assert.equal(res.statusCode, 200)
    assert.deepStrictEqual(res.json(), updatedTask)
    assert.equal(mockUpdate.mock.calls.length, 1)
    assert.equal(mockUpdate.mock.calls[0]!.arguments[0], 1)
    assert.deepStrictEqual(mockUpdate.mock.calls[0]!.arguments[1], { completed: true })
  })

  it('PATCH /api/tasks/:id with non-existent id → 404 with correct error shape', async () => {
    resetMocks()
    mockUpdate.mock.mockImplementationOnce(() => undefined)
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/tasks/9999',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    assert.equal(res.statusCode, 404)
    const body = res.json<{ statusCode: number; error: string; message: string }>()
    assert.equal(body.statusCode, 404)
    assert.equal(body.error, 'Not Found')
    assert.equal(body.message, 'Task 9999 not found')
  })

  it('DELETE /api/tasks/:id → 204 with empty body', async () => {
    resetMocks()
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/tasks/1',
    })
    assert.equal(res.statusCode, 204)
    assert.equal(res.body, '')
    assert.equal(mockDelete.mock.calls.length, 1)
    assert.equal(mockDelete.mock.calls[0]!.arguments[0], 1)
  })

  it('error handler returns { statusCode, error, message } with no stack trace on 500', async () => {
    resetMocks()
    mockFindAll.mock.mockImplementationOnce(() => { throw new Error('DB exploded') })
    const res = await app.inject({ method: 'GET', url: '/api/tasks' })
    assert.equal(res.statusCode, 500)
    const body = res.json<Record<string, unknown>>()
    assert.equal(body['statusCode'], 500)
    assert.equal(body['error'], 'Internal Server Error')
    assert.equal(body['message'], 'An unexpected error occurred')
    assert.ok(!('stack' in body), 'stack trace must NOT appear in error response')
  })
})
