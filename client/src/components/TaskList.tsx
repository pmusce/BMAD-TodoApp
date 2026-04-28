import type { Task } from '@shared/types'
import { TaskItem } from './TaskItem'

export interface TaskListProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

export function TaskList({ tasks, isLoading, error, toggleTask, deleteTask }: TaskListProps) {
  if (isLoading) {
    return <p role="status" className="task-list__loading">Loading…</p>
  }

  const activeTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => b.createdAt - a.createdAt)

  const completedTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="task-list">
      {error && (
        <div className="task-error-banner" role="alert">
          {error}
        </div>
      )}

      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <p className="task-empty-state">No tasks yet</p>
      )}

      {activeTasks.length > 0 && (
        <section aria-label="Active tasks">
          <h2 className="task-list__heading">Active</h2>
          <ul className="task-list__section">
            {activeTasks.map(task => (
              <li key={task.id}>
                <TaskItem task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {completedTasks.length > 0 && (
        <section aria-label="Completed tasks">
          <h2 className="task-list__heading">Completed</h2>
          <ul className="task-list__section">
            {completedTasks.map(task => (
              <li key={task.id}>
                <TaskItem task={task} toggleTask={toggleTask} deleteTask={deleteTask} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
