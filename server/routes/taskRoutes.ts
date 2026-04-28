import type { FastifyPluginAsync } from 'fastify'
import { TaskRepository } from '../repositories/TaskRepository.ts'
import type { CreateTaskPayload, UpdateTaskPayload } from '@shared/types.js'
import { createTaskSchema, updateTaskSchema, taskParamsSchema } from './schemas/taskSchemas.ts'

interface TaskParams {
  id: number
}

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = new TaskRepository(fastify.db)

  // GET /api/tasks
  fastify.get('/', async (_request, reply) => {
    return reply.send(repo.findAll())
  })

  // POST /api/tasks
  fastify.post<{ Body: CreateTaskPayload }>(
    '/',
    { schema: createTaskSchema },
    async (request, reply) => {
      const text = request.body.text.trim()
      if (text.length === 0) {
        return reply.badRequest('body/text must not be empty or whitespace-only')
      }
      const task = repo.create({ text })
      return reply.code(201).send(task)
    }
  )

  // PATCH /api/tasks/:id
  fastify.patch<{ Params: TaskParams; Body: UpdateTaskPayload }>(
    '/:id',
    { schema: updateTaskSchema },
    async (request, reply) => {
      const { id } = request.params
      const task = repo.update(id, request.body)
      if (task === undefined) {
        return reply.notFound(`Task ${id} not found`)
      }
      return reply.send(task)
    }
  )

  // DELETE /api/tasks/:id
  fastify.delete<{ Params: TaskParams }>(
    '/:id',
    { schema: taskParamsSchema },
    async (request, reply) => {
      repo.delete(request.params.id)
      return reply.code(204).send()
    }
  )
}

export default taskRoutes
export const autoPrefix = '/api/tasks'
