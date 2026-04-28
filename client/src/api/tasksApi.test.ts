import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTasks, createTask, updateTask, deleteTask } from './tasksApi'
import type { Task, ApiError } from '@shared/types'

const mockTask: Task = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: 1714167600000,
  userId: null,
}

function mockFetch(body: unknown, status = 200) {
  const payload =
    typeof body === 'string' ? body : body === null || body === undefined ? '' : JSON.stringify(body)

  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 500 ? 'Internal Server Error' : status >= 400 ? 'Bad Request' : 'OK',
    text: () => Promise.resolve(payload),
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('getTasks', () => {
  it('returns Task[] on 200', async () => {
    const fetchMock = mockFetch([mockTask])
    const result = await getTasks()

    expect(result).toEqual([mockTask])
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/tasks$/))
  })

  it('throws ApiError when 2xx response has empty body for JSON endpoint', async () => {
    mockFetch(undefined, 200)

    await expect(getTasks()).rejects.toMatchObject({
      statusCode: 200,
      error: 'Invalid Response',
      message: 'Expected JSON response body',
    })
  })
})

describe('createTask', () => {
  it('returns created Task on 201', async () => {
    const fetchMock = mockFetch(mockTask, 201)
    const result = await createTask('Buy milk')

    expect(result).toEqual(mockTask)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Buy milk' }),
      }),
    )
  })
})

describe('updateTask', () => {
  it('returns updated Task on 200', async () => {
    const updated = { ...mockTask, completed: true }
    const fetchMock = mockFetch(updated)

    const result = await updateTask(1, { completed: true })

    expect(result).toEqual(updated)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/tasks\/1$/),
      expect.objectContaining({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      }),
    )
  })
})

describe('deleteTask', () => {
  it('resolves void on 204', async () => {
    const fetchMock = mockFetch(undefined, 204)

    await expect(deleteTask(1)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/tasks\/1$/), { method: 'DELETE' })
  })
})

describe('error handling', () => {
  it('throws ApiError with correct shape on 4xx response', async () => {
    const errorBody: ApiError = {
      statusCode: 404,
      error: 'Not Found',
      message: 'Task not found',
    }

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(JSON.stringify(errorBody)),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getTasks()).rejects.toMatchObject(errorBody)
  })

  it('throws ApiError with correct shape on 5xx response', async () => {
    const errorBody: ApiError = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    }
    mockFetch(errorBody, 500)

    await expect(createTask('test')).rejects.toMatchObject(errorBody)
  })

  it('throws typed ApiError when error body is non-JSON text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      text: () => Promise.resolve('Upstream timeout'),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getTasks()).rejects.toMatchObject({
      statusCode: 502,
      error: 'Bad Gateway',
      message: 'Upstream timeout',
    })
  })

  it('throws typed ApiError when error body is empty', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(''),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getTasks()).rejects.toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Request failed',
    })
  })
})
