import fp from 'fastify-plugin'
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import type { FastifyPluginAsync } from 'fastify'

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const migrationSql = readFileSync(
    join(__dirname, '../migrations/001_create_tasks.sql'),
    'utf8'
  )
  const dbPath = process.env.DATABASE_PATH ?? './data/todo.db'
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  try {
    db.exec(migrationSql)
    fastify.decorate('db', db)
  } catch (err) {
    db.close()
    throw err
  }
  fastify.addHook('onClose', () => {
    try {
      db.close()
    } catch (_) {
      // ignore close errors during shutdown
    }
  })
}

export default fp(dbPlugin)
