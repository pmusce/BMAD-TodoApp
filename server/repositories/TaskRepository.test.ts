import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import Database from 'better-sqlite3'
import { TaskRepository } from './TaskRepository.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationSql = readFileSync(
  join(__dirname, '../migrations/001_create_tasks.sql'),
  'utf8'
)

describe('TaskRepository', () => {
  let db: InstanceType<typeof Database>
  let repo: TaskRepository

  before(() => {
    db = new Database(':memory:')
    db.exec(migrationSql)
    repo = new TaskRepository(db)
  })

  after(() => {
    db.close()
  })

  it('findAll returns empty array initially', () => {
    const tasks = repo.findAll()
    assert.deepEqual(tasks, [])
  })

  it('create inserts and returns a Task', () => {
    const task = repo.create({ text: 'Buy milk' })
    assert.equal(typeof task.id, 'number')
    assert.equal(task.text, 'Buy milk')
    assert.equal(task.completed, false)
    assert.equal(typeof task.createdAt, 'number')
    assert.ok(task.createdAt > 0)
  })

  it('findAll returns created task', () => {
    const tasks = repo.findAll()
    assert.equal(tasks.length, 1)
    assert.equal(tasks[0].text, 'Buy milk')
  })

  it('update toggles completed to true', () => {
    const [task] = repo.findAll()
    const updated = repo.update(task.id, { completed: true })
    assert.ok(updated !== undefined)
    assert.equal(updated.completed, true)
    assert.equal(updated.id, task.id)
  })

  it('update on missing id returns undefined', () => {
    const result = repo.update(9999, { completed: true })
    assert.equal(result, undefined)
  })

  it('update toggles completed back to false', () => {
    const task = repo.create({ text: 'Toggle me' })
    repo.update(task.id, { completed: true })
    const toggled = repo.update(task.id, { completed: false })
    assert.ok(toggled !== undefined)
    assert.equal(toggled.completed, false)
  })

  it('delete removes the task', () => {
    const [task] = repo.findAll()
    const deleted = repo.delete(task.id)
    assert.equal(deleted, true)
    const tasks = repo.findAll()
    assert.equal(tasks.length, 1) // only the 'Toggle me' task remains (completed=false)
  })

  it('delete on non-existent id returns false', () => {
    const result = repo.delete(9999)
    assert.equal(result, false)
  })
})
