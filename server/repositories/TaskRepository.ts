import type Database from 'better-sqlite3'
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@shared/types.js'

interface TaskRow {
  id: number
  text: string
  completed: number
  created_at: number
  user_id: number | null
}

export class TaskRepository {
  private readonly db: Database.Database
  private readonly findAllStmt: Database.Statement<[], TaskRow>
  private readonly createStmt: Database.Statement<[string, number]>
  private readonly updateStmt: Database.Statement<[number, number]>
  private readonly deleteStmt: Database.Statement<[number]>
  private readonly findByIdStmt: Database.Statement<[number], TaskRow>

  constructor(db: Database.Database) {
    this.db = db
    this.findAllStmt = db.prepare<[], TaskRow>(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    )
    this.createStmt = db.prepare<[string, number]>(
      'INSERT INTO tasks (text, completed, created_at, user_id) VALUES (?, 0, ?, NULL)'
    )
    this.updateStmt = db.prepare<[number, number]>(
      'UPDATE tasks SET completed = ? WHERE id = ?'
    )
    this.deleteStmt = db.prepare<[number]>(
      'DELETE FROM tasks WHERE id = ?'
    )
    this.findByIdStmt = db.prepare<[number], TaskRow>(
      'SELECT * FROM tasks WHERE id = ?'
    )
  }

  findAll(): Task[] {
    const rows = this.findAllStmt.all()
    return rows.map((row) => this.mapRow(row))
  }

  create(payload: CreateTaskPayload): Task {
    const info = this.createStmt.run(payload.text, Date.now())
    const row = this.findByIdStmt.get(Number(info.lastInsertRowid))
    return this.mapRow(row!)
  }

  update(id: number, patch: UpdateTaskPayload): Task | undefined {
    const existing = this.findByIdStmt.get(id)
    if (existing === undefined) {
      return undefined
    }
    this.updateStmt.run(patch.completed ? 1 : 0, id)
    const updated = this.findByIdStmt.get(id)
    return this.mapRow(updated!)
  }

  delete(id: number): boolean {
    const result = this.deleteStmt.run(id)
    return result.changes > 0
  }

  private mapRow(row: TaskRow): Task {
    return {
      id: row.id,
      text: row.text,
      completed: row.completed === 1,
      createdAt: row.created_at,
      userId: row.user_id,
    }
  }
}
