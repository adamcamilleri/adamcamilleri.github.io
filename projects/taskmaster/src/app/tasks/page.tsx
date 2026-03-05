'use client'

import { useState, useRef } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import TaskList from '@/components/TaskList'
import TaskForm from '@/components/TaskForm'
import { Priority, TaskFormData } from '@/types/task'

function TiltButton({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const btn = ref.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2)
    const y = (e.clientY - r.top - r.height / 2) / (r.height / 2)
    btn.style.transform = `perspective(500px) rotateX(${-y * 12}deg) rotateY(${x * 12}deg) scale(1.06)`
  }

  function onLeave() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform 0.15s ease' }}
      className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
      New Task
    </button>
  )
}

export default function TasksPage() {
  const { logout } = useAuth()
  const { tasks, loading, addTask, deleteTask, toggleTaskCompletion, filterTasks } = useTasks()
  const [filter, setFilter] = useState<{ priority?: Priority; completed?: boolean }>({})
  const [panelOpen, setPanelOpen] = useState(false)

  const filteredTasks = filterTasks(filter)

  async function handleAddTask(data: TaskFormData) {
    await addTask(data)
    setPanelOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#1a1a1a] px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <span className="font-semibold text-sm tracking-tight">TaskMaster</span>
          {!loading && (
            <span className="text-xs text-[#444] bg-[#151515] border border-[#222] px-2 py-0.5 rounded-full">
              {filteredTasks.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter({ ...filter, priority: (e.target.value as Priority) || undefined })}
            className="bg-[#151515] border border-[#222] text-[#888] text-xs px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:border-[#444] transition-colors"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filter.completed === undefined ? '' : filter.completed.toString()}
            onChange={(e) => setFilter({ ...filter, completed: e.target.value === '' ? undefined : e.target.value === 'true' })}
            className="bg-[#151515] border border-[#222] text-[#888] text-xs px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none focus:border-[#444] transition-colors"
          >
            <option value="">All tasks</option>
            <option value="false">Active</option>
            <option value="true">Completed</option>
          </select>

          <TiltButton onClick={() => setPanelOpen(true)} />

          <button onClick={logout} className="text-xs text-[#444] hover:text-[#777] transition-colors ml-1">
            Sign out
          </button>
        </div>
      </header>

      {/* Task list */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-24 text-[#333] text-sm">Loading…</div>
        ) : (
          <TaskList tasks={filteredTasks} onToggleComplete={toggleTaskCompletion} onDelete={deleteTask} />
        )}
      </main>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-20 transition-opacity duration-300 ${panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setPanelOpen(false)}
      />

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-[#111] border-l border-[#1f1f1f] z-30 flex flex-col transition-transform duration-300 ease-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <h2 className="font-semibold text-sm">New task</h2>
          <button onClick={() => setPanelOpen(false)} className="text-[#444] hover:text-[#888] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <TaskForm onSubmit={handleAddTask} />
        </div>
      </div>
    </div>
  )
}
