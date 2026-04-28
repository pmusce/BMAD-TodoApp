import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import type { FastifyPluginAsync } from 'fastify'

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  await fastify.register(cors, { origin })
}

export default fp(corsPlugin)
