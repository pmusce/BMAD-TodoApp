import fp from 'fastify-plugin'
import { STATUS_CODES } from 'node:http'
import type { FastifyError, FastifyPluginAsync } from 'fastify'

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500
    const isServerError = statusCode >= 500
    if (isServerError) {
      fastify.log.error(error)
    }
    const message = isServerError ? 'An unexpected error occurred' : error.message
    return reply.status(statusCode).send({
      statusCode,
      error: STATUS_CODES[statusCode] ?? 'Unknown Error',
      message,
    })
  })
}

export default fp(errorHandlerPlugin)
