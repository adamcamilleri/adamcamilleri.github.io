import { Task } from '@/types/task'
import { format } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
}

const priorityConfig = {
  high:   { color: '#ef4444', label: 'High',   badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { color: '#f59e0b', label: 'Medium', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  low:    { color: '#10b981', label: 'Low',    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

export default function TaskList({ tasks, onToggleComplete, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-[#2a2a2a] text-5xl mb-4">✓</div>
        <p className="text-[#444] text-sm">No tasks here. Hit <span className="text-violet-500">New Task</span> to add one.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const p = priorityConfig[task.priority]
        return (
          <div
            key={task.id}
            className="group flex bg-[#111] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
          >
            {/* Priority strip */}
            <div
              className="w-[3px] flex-shrink-0 transition-colors"
              style={{ backgroundColor: task.completed ? '#222' : p.color }}
            />

            <div className="flex-1 px-4 py-3.5">
              <div className="flex items-center gap-3">
                {/* Custom checkbox */}
                <button
                  onClick={() => onToggleComplete(task.id)}
                  className={`flex-shrink-0 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-violet-600 border-violet-600'
                      : 'border-[#333] hover:border-violet-500'
                  }`}
                >
                  {task.completed && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>

                <span className={`flex-1 text-sm font-medium ${task.completed ? 'line-through text-[#3a3a3a]' : 'text-[#e5e5e5]'}`}>
                  {task.title}
                </span>

                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${p.badge}`}>
                  {p.label}
                </span>

                <button
                  onClick={() => onDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#333] hover:text-red-500 transition-all p-1 -mr-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>

              {task.description && (
                <p className="mt-1.5 text-xs text-[#4a4a4a] ml-7 line-clamp-1">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="mt-1 text-xs text-[#3a3a3a] ml-7">
                  Due {format(task.dueDate, 'MMM d, yyyy')}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 