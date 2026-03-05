import { useState, useCallback, useEffect } from 'react'
import { Task, TaskFormData, Priority } from '@/types/task'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('tm_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function deserializeTask(raw: any): Task {
  return {
    ...raw,
    id: raw.id || raw._id?.toString(),
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    fetch('/api/tasks', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data.map(deserializeTask))
      })
      .finally(() => setLoading(false))
  }, [])

  const addTask = useCallback(async (taskData: TaskFormData) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(taskData),
    })
    const task = await res.json()
    setTasks((prev) => [deserializeTask(task), ...prev])
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    })
    const updated = await res.json()
    setTasks((prev) => prev.map((t) => (t.id === id ? deserializeTask(updated) : t)))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  }, [])

  const toggleTaskCompletion = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ completed: !task.completed }),
      })
    },
    [tasks]
  )

  const filterTasks = useCallback(
    (filter: { priority?: Priority; completed?: boolean }) => {
      return tasks.filter((task) => {
        if (filter.priority && task.priority !== filter.priority) return false
        if (filter.completed !== undefined && task.completed !== filter.completed) return false
        return true
      })
    },
    [tasks]
  )

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    filterTasks,
  }
}
