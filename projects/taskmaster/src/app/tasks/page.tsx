'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import { Priority } from '@/types/task'

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTaskCompletion, filterTasks } = useTasks()
  const [filter, setFilter] = useState<{
    priority?: Priority
    completed?: boolean
  }>({})

  const filteredTasks = filterTasks(filter)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">TaskMaster</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <TaskForm onSubmit={addTask} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <div className="flex gap-2">
              <select
                value={filter.priority || ''}
                onChange={(e) => setFilter({
                  ...filter,
                  priority: e.target.value as Priority || undefined
                })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select
                value={filter.completed === undefined ? '' : filter.completed.toString()}
                onChange={(e) => setFilter({
                  ...filter,
                  completed: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Tasks</option>
                <option value="false">Active</option>
                <option value="true">Completed</option>
              </select>
            </div>
          </div>

          <TaskList
            tasks={filteredTasks}
            onToggleComplete={toggleTaskCompletion}
            onDelete={deleteTask}
          />
        </div>
      </div>
    </div>
  )
} 