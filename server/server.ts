import closeWithGrace from 'close-with-grace'
import Fastify from 'fastify'
import app from './app.js'

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty' }
        : undefined,
  },
})

void server.register(app)

closeWithGrace({ delay: 500 }, async ({ err }) => {
  if (err) {
    server.log.error({ err })
  }
  await server.close()
})

server.listen(
  { port: Number(process.env.PORT) || 3000, host: '0.0.0.0' },
  (err) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
  }
)
