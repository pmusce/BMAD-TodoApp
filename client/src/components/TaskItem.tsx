import type { Task } from '@shared/types'

export interface TaskItemProps {
  task: Task
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}

function formatRelativeTime(createdAt: number): string {
  const diffMs = createdAt - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffMs / 1000 / 60)
  const diffHour = Math.round(diffMs / 1000 / 60 / 60)
  const diffDay = Math.round(diffMs / 1000 / 60 / 60 / 24)

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second')
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
  return rtf.format(diffDay, 'day')
}

export function TaskItem({ task, toggleTask, deleteTask }: TaskItemProps) {
  const checkboxId = `task-checkbox-${task.id}`

  async function handleToggle() {
    await toggleTask(task.id)
  }

  async function handleDelete() {
    await deleteTask(task.id)
  }

  return (
    <div className="task-item">
      <input
        type="checkbox"
        id={checkboxId}
        checked={task.completed}
        onChange={() => void handleToggle()}
      />
      <label htmlFor={checkboxId}>
        <span className={task.completed ? 'task-text task-text--completed' : 'task-text'}>
          {task.text}
        </span>
      </label>
      <time dateTime={new Date(task.createdAt).toISOString()}>
        {formatRelativeTime(task.createdAt)}
      </time>
      <button
        type="button"
        aria-label="Delete task"
        onClick={() => void handleDelete()}
      >
        ×
      </button>
    </div>
  )
}
