import { useEffect, useState } from 'react'
import { CheckSquare, Search, Filter, Plus, X, MessageSquare, Clock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
  IN_PROGRESS: 'bg-brand-teal/15 text-brand-teal ring-brand-teal/30',
  IN_REVIEW: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
  DONE: 'bg-brand-mint/15 text-brand-mint ring-brand-mint/30',
  CANCELLED: 'bg-red-500/15 text-red-400 ring-red-500/30',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-zinc-400', MEDIUM: 'text-yellow-400', HIGH: 'text-brand-orange', CRITICAL: 'text-red-400',
}
const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-zinc-400', MEDIUM: 'bg-yellow-400', HIGH: 'bg-brand-orange', CRITICAL: 'bg-red-400',
}

export default function TasksPage() {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [comment, setComment] = useState('')

  const canCreate = ['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || '')

  useEffect(() => {
    loadTasks()
    api.get('/projects').then(r => setProjects(r.data))
  }, [statusFilter, priorityFilter, projectFilter])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (projectFilter) params.projectId = projectFilter
      const r = await api.get('/tasks', { params })
      setTasks(r.data)
    } finally {
      setLoading(false)
    }
  }

  const openTask = async (task: any) => {
    const r = await api.get(`/tasks/${task.id}`)
    setSelectedTask(r.data)
  }

  const addComment = async () => {
    if (!comment.trim() || !selectedTask) return
    await api.post(`/tasks/${selectedTask.id}/comments`, { content: comment })
    setComment('')
    openTask(selectedTask)
  }

  const updateStatus = async (taskId: string, status: string) => {
    await api.put(`/tasks/${taskId}`, { status })
    loadTasks()
    if (selectedTask?.id === taskId) {
      setSelectedTask((t: any) => t ? { ...t, status } : t)
    }
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.project?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-6 h-full animate-fade-in" style={{ maxHeight: 'calc(100vh - 160px)' }}>
      {/* Task List */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-rubik font-bold text-2xl text-white">Tasks</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{filtered.length} tasks</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-[#18181B] border border-white/10 rounded-xl px-3 focus-within:border-brand-teal transition-all">
            <Search className="w-4 h-4 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent text-white placeholder-zinc-600 text-sm px-3 py-2 outline-none w-48"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-brand-teal transition-all">
            <option value="">All Status</option>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-brand-teal transition-all">
            <option value="">All Priority</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
            className="bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-brand-teal transition-all">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#09090B] border border-white/5 rounded-xl p-4 h-20 animate-pulse">
                <div className="h-3 bg-white/5 rounded w-2/3 mb-2" /><div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
              <CheckSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No tasks found</p>
            </div>
          ) : (
            filtered.map(task => (
              <div
                key={task.id}
                onClick={() => openTask(task)}
                className={`bg-[#09090B] border rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all group ${
                  selectedTask?.id === task.id ? 'border-brand-teal/30 bg-brand-teal/5' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-white font-medium truncate flex-1">{task.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {task.project && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color }} />
                          {task.project.name}
                        </span>
                      )}
                      {task.dueDate && <span>Due {format(new Date(task.dueDate), 'MMM dd')}</span>}
                      {task.assignee && <span>→ {task.assignee.name}</span>}
                      {task._count?.comments > 0 && (
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{task._count.comments}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <div className="w-96 flex-shrink-0 bg-[#09090B] border border-white/10 rounded-2xl flex flex-col overflow-hidden animate-slide-in">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-rubik font-semibold text-white text-sm">Task Detail</h3>
            <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="font-rubik font-bold text-white">{selectedTask.title}</h2>
              {selectedTask.description && <p className="text-zinc-500 text-sm mt-1">{selectedTask.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/[0.02] rounded-lg p-2.5">
                <div className="text-zinc-600 mb-1">Status</div>
                <select value={selectedTask.status} onChange={e => updateStatus(selectedTask.id, e.target.value)}
                  className="bg-transparent text-white text-xs outline-none w-full cursor-pointer">
                  {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-2.5">
                <div className="text-zinc-600 mb-1">Priority</div>
                <div className={`font-bold ${PRIORITY_COLORS[selectedTask.priority]}`}>{selectedTask.priority}</div>
              </div>
              {selectedTask.assignee && (
                <div className="bg-white/[0.02] rounded-lg p-2.5">
                  <div className="text-zinc-600 mb-1">Assignee</div>
                  <div className="text-white">{selectedTask.assignee.name}</div>
                </div>
              )}
              {selectedTask.dueDate && (
                <div className="bg-white/[0.02] rounded-lg p-2.5">
                  <div className="text-zinc-600 mb-1">Due Date</div>
                  <div className="text-white">{format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}</div>
                </div>
              )}
              {selectedTask.estimatedHours && (
                <div className="bg-white/[0.02] rounded-lg p-2.5 col-span-2">
                  <div className="text-zinc-600 mb-1">Estimated Hours</div>
                  <div className="text-white flex items-center gap-1"><Clock className="w-3 h-3" />{selectedTask.estimatedHours}h</div>
                </div>
              )}
            </div>

            {/* Subtasks */}
            {selectedTask.subtasks?.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-400 mb-2">Subtasks</h4>
                {selectedTask.subtasks.map((st: any) => (
                  <div key={st.id} className="flex items-center gap-2 text-sm text-zinc-400 py-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className={st.status === 'DONE' ? 'line-through' : ''}>{st.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comments */}
            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-3">Comments ({selectedTask.comments?.length || 0})</h4>
              <div className="space-y-3 mb-3">
                {selectedTask.comments?.map((c: any) => (
                  <div key={c.id} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-brand-teal font-bold">{c.user.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-zinc-500 mb-0.5">{c.user.name} · {format(new Date(c.createdAt), 'MMM dd HH:mm')}</div>
                      <p className="text-xs text-zinc-300 bg-white/[0.02] rounded-lg px-3 py-2">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
                  placeholder="Add comment..."
                  className="flex-1 px-3 py-2 bg-[#18181B] border border-white/10 rounded-lg text-white placeholder-zinc-600 text-xs focus:border-brand-teal outline-none"
                />
                <button onClick={addComment}
                  className="px-3 py-2 bg-brand-teal text-black text-xs font-bold rounded-lg hover:bg-brand-mint transition-colors">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
