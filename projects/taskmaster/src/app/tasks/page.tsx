'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import { Priority } from '@/types/task'

export default function TasksPage() {
  const { logout } = useAuth()
  const { tasks, loading, addTask, updateTask, deleteTask, toggleTaskCompletion, filterTasks } = useTasks()
  const [filter, setFilter] = useState<{ priority?: Priority; completed?: boolean }>({})

  const filteredTasks = filterTasks(filter)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">TaskMaster</h1>
            <p className="text-lg text-gray-600 mt-1">Organize your tasks efficiently</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Task</h2>
              <TaskForm onSubmit={addTask} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Tasks
                  {!loading && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({filteredTasks.length})
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filter.priority || ''}
                    onChange={(e) =>
                      setFilter({ ...filter, priority: (e.target.value as Priority) || undefined })
                    }
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>

                  <select
                    value={filter.completed === undefined ? '' : filter.completed.toString()}
                    onChange={(e) =>
                      setFilter({
                        ...filter,
                        completed: e.target.value === '' ? undefined : e.target.value === 'true',
                      })
                    }
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Tasks</option>
                    <option value="false">Active</option>
                    <option value="true">Completed</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading tasks…</div>
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  onToggleComplete={toggleTaskCompletion}
                  onDelete={deleteTask}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
