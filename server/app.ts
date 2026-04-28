import { join } from 'node:path'
import AutoLoad from '@fastify/autoload'
import type { FastifyPluginAsync, FastifyServerOptions } from 'fastify'

export interface AppOptions extends FastifyServerOptions {}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // This loads all plugins defined in plugins
  void fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'plugins'),
    options: opts,
    ignorePattern: /\.test\.(ts|js)$/
  })

  // This loads all routes defined in routes
  void fastify.register(AutoLoad, {
    dir: join(import.meta.dirname, 'routes'),
    options: opts,
    ignorePattern: /\.test\.(ts|js)$/
  })
}

export default app
export { app, options }
