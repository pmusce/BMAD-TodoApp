import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types'

const BASE = import.meta.env.VITE_API_URL

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.statusCode === 'number' &&
    typeof candidate.error === 'string' &&
    typeof candidate.message === 'string'
  )
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return undefined

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function toApiError(res: Response, body: unknown): ApiError {
  if (isApiError(body)) {
    return body
  }

  if (typeof body === 'string' && body.trim().length > 0) {
    return {
      statusCode: res.status,
      error: res.statusText || 'Error',
      message: body,
    }
  }

  return {
    statusCode: res.status,
    error: res.statusText || 'Error',
    message: 'Request failed',
  }
}

async function handleResponse<T>(res: Response, options?: { allowEmptySuccess?: boolean }): Promise<T> {
  const body = await parseResponseBody(res)

  if (res.ok) {
    if (body === undefined) {
      if (res.status === 204 || options?.allowEmptySuccess) {
        return undefined as T
      }

      throw {
        statusCode: res.status,
        error: 'Invalid Response',
        message: 'Expected JSON response body',
      } as ApiError
    }

    if (typeof body === 'string') {
      throw {
        statusCode: res.status,
        error: 'Invalid Response',
        message: 'Expected JSON response body',
      } as ApiError
    }

    return body as T
  }

  throw toApiError(res, body)
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}/api/tasks`)
  return handleResponse<Task[]>(res)
}

export async function createTask(text: string): Promise<Task> {
  const body: CreateTaskPayload = { text }
  const res = await fetch(`${BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Task>(res)
}

export async function updateTask(id: number, patch: UpdateTaskPayload): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return handleResponse<Task>(res)
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, { method: 'DELETE' })
  return handleResponse<void>(res, { allowEmptySuccess: true })
}
