import { useState, useCallback, useEffect } from 'react'
import { Task, TaskFormData, Priority } from '@/types/task'

const STORAGE_KEY = 'taskmaster-tasks'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY)
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }))
      setTasks(parsedTasks)
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const addTask = useCallback((taskData: TaskFormData) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTasks(prev => [...prev, newTask])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<TaskFormData>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }, [])

  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, completed: !task.completed, updatedAt: new Date() }
          : task
      )
    )
  }, [])

  const filterTasks = useCallback((filter: {
    priority?: Priority
    completed?: boolean
  }) => {
    return tasks.filter(task => {
      if (filter.priority && task.priority !== filter.priority) return false
      if (filter.completed !== undefined && task.completed !== filter.completed) return false
      return true
    })
  }, [tasks])

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    filterTasks,
  }
} 