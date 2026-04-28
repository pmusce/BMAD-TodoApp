import { useEffect, useRef, useState } from 'react'
import type { Task } from '@shared/types'
import * as tasksApi from '../api/tasksApi'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Patch 4: monotonic negative IDs prevent Date.now() collisions on sub-ms calls
  const nextOptimisticId = useRef(-1)
  // Patch 2: track which mutation type last set the error for per-type isolation (AC5)
  const errorSource = useRef<'create' | 'toggle' | 'delete' | null>(null)

  // Patch 3: cancelled flag prevents state updates after unmount (StrictMode safety)
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    tasksApi
      .getTasks()
      .then(data => { if (!cancelled) setTasks(data) })
      .catch(() => { if (!cancelled) setError('Failed to load tasks.') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function createTask(text: string): Promise<void> {
    const snapshot = tasks
    const optimisticId = nextOptimisticId.current--
    const optimisticTask: Task = {
      id: optimisticId,
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
      userId: null,
    }
    setTasks(prev => [optimisticTask, ...prev])
    try {
      // Patch 1: pass trimmed text to the API (matches optimistic display)
      const created = await tasksApi.createTask(text.trim())
      // Patch 2: only clear error if it was set by a previous createTask failure
      if (errorSource.current === 'create') { setError(null); errorSource.current = null }
      setTasks(prev => prev.map(t => (t.id === optimisticId ? created : t)))
    } catch {
      setTasks(snapshot)
      errorSource.current = 'create'
      setError('Failed to create task. Please try again.')
    }
  }

  async function toggleTask(id: number): Promise<void> {
    const snapshot = tasks
    const task = tasks.find(t => t.id === id)
    if (!task) return
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
    try {
      const updated = await tasksApi.updateTask(id, { completed: !task.completed })
      if (errorSource.current === 'toggle') { setError(null); errorSource.current = null }
      setTasks(prev => prev.map(t => (t.id === id ? updated : t)))
    } catch {
      setTasks(snapshot)
      errorSource.current = 'toggle'
      setError('Failed to update task. Please try again.')
    }
  }

  async function deleteTask(id: number): Promise<void> {
    const snapshot = tasks
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await tasksApi.deleteTask(id)
      if (errorSource.current === 'delete') { setError(null); errorSource.current = null }
    } catch {
      setTasks(snapshot)
      errorSource.current = 'delete'
      setError('Failed to delete task. Please try again.')
    }
  }

  return { tasks, isLoading, error, createTask, toggleTask, deleteTask }
}
