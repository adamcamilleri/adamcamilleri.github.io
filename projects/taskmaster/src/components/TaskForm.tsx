import { useState } from 'react'
import { TaskFormData, Priority } from '@/types/task'

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void
  initialData?: Partial<TaskFormData>
}

export default function TaskForm({ onSubmit, initialData }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    dueDate: initialData?.dueDate || undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    if (!initialData) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: undefined,
      })
    }
  }

  const inputClass = "block w-full bg-[#0f0f0f] border border-[#2a2a2a] text-white placeholder-[#3a3a3a] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
  const labelClass = "block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-wide"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className={inputClass}
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Add details (optional)"
        />
      </div>

      <div>
        <label htmlFor="priority" className={labelClass}>Priority</label>
        <select
          id="priority"
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
          className={inputClass}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label htmlFor="dueDate" className={labelClass}>Due Date</label>
        <input
          type="date"
          id="dueDate"
          value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
          onChange={(e) => setFormData({
            ...formData,
            dueDate: e.target.value ? new Date(e.target.value) : undefined,
          })}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-4 py-3 text-sm font-semibold transition-colors mt-2"
      >
        {initialData ? 'Update task' : 'Add task'}
      </button>
    </form>
  )
} 