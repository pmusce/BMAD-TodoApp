import type { FastifyPluginAsync } from 'fastify'

const healthzRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: { status: { type: 'string', enum: ['ok'] } },
          required: ['status'],
        },
        503: {
          type: 'object',
          properties: { status: { type: 'string', enum: ['error'] } },
          required: ['status'],
        },
      },
    },
  }, async (_request, reply) => {
    try {
      fastify.db.prepare('SELECT 1').get()
      return reply.send({ status: 'ok' })
    } catch {
      return reply.code(503).send({ status: 'error' })
    }
  })
}

export default healthzRoutes
export const autoPrefix = '/api/healthz'
