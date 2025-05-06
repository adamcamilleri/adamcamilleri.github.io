export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  dueDate?: Date
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TaskFormData {
  title: string
  description: string
  priority: Priority
  dueDate?: Date
} 