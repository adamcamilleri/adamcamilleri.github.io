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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TaskMaster</h1>
          <p className="text-lg text-gray-600">Organize your tasks efficiently</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Task</h2>
              <TaskForm onSubmit={addTask} />
            </div>
          </div>

          {/* Task List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Tasks</h2>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filter.priority || ''}
                    onChange={(e) => setFilter({
                      ...filter,
                      priority: e.target.value as Priority || undefined
                    })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
      </div>
    </div>
  )
} 