// Route schemas for task endpoints
// `user_id` must NOT appear in any request body schema (NFR8)

export const createTaskSchema = {
  body: {
    type: 'object',
    required: ['text'],
    additionalProperties: false,
    properties: {
      text: { type: 'string', minLength: 1, maxLength: 500 },
    },
  },
} as const

export const updateTaskSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' },
    },
  },
  body: {
    type: 'object',
    required: ['completed'],
    additionalProperties: false,
    properties: {
      completed: { type: 'boolean' },
    },
  },
} as const

export const taskParamsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' },
    },
  },
} as const
