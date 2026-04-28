import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import type Database from 'better-sqlite3'
import errorHandlerPlugin from '../plugins/errorHandler.ts'
import healthzRoutes from './healthzRoutes.ts'

async function buildTestApp(dbMock: unknown) {
  const app = Fastify({ logger: false })
  app.decorate('db', dbMock as Database.Database)
  await app.register(sensible)
  await app.register(errorHandlerPlugin)
  await app.register(healthzRoutes, { prefix: '/api/healthz' })
  await app.ready()
  return app
}

describe('healthzRoutes', () => {
  describe('GET /api/healthz — database accessible', () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>

    before(async () => {
      const dbMock = {
        prepare: () => ({ get: () => ({ '1': 1 }) }),
      }
      app = await buildTestApp(dbMock)
    })

    after(async () => {
      await app.close()
    })

    it('returns 200 with { status: "ok" }', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/healthz' })
      assert.equal(res.statusCode, 200)
      assert.deepStrictEqual(res.json(), { status: 'ok' })
    })
  })

  describe('GET /api/healthz — database not accessible', () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>

    before(async () => {
      const dbMock = {
        prepare: () => {
          throw new Error('DB connection lost')
        },
      }
      app = await buildTestApp(dbMock)
    })

    after(async () => {
      await app.close()
    })

    it('returns 503 with { status: "error" }', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/healthz' })
      assert.equal(res.statusCode, 503)
      assert.deepStrictEqual(res.json(), { status: 'error' })
    })
  })

  describe('GET /api/healthz — get() throws after prepare()', () => {
    let app: Awaited<ReturnType<typeof buildTestApp>>

    before(async () => {
      const dbMock = {
        prepare: () => ({
          get: () => {
            throw new Error('SQLITE_BUSY: database is locked')
          },
        }),
      }
      app = await buildTestApp(dbMock)
    })

    after(async () => {
      await app.close()
    })

    it('returns 503 with { status: "error" }', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/healthz' })
      assert.equal(res.statusCode, 503)
      assert.deepStrictEqual(res.json(), { status: 'error' })
    })
  })
})
