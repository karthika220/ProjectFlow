import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Users, CheckSquare, Target, Activity, X, Edit2, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format } from 'date-fns'

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-zinc-500/20 text-zinc-400',
  IN_PROGRESS: 'bg-brand-teal/20 text-brand-teal',
  IN_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  DONE: 'bg-brand-mint/20 text-brand-mint',
  CANCELLED: 'bg-red-500/20 text-red-400',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-zinc-400', MEDIUM: 'text-yellow-400', HIGH: 'text-brand-orange', CRITICAL: 'text-red-400',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [activities, setActivities] = useState<any[]>([])

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'TODO', priority: 'MEDIUM',
    dueDate: '', estimatedHours: '', assigneeId: '',
  })
  const [milestoneForm, setMilestoneForm] = useState({ name: '', targetDate: '' })

  const canManage = ['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || '')

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    setLoading(true)
    try {
      const r = await api.get(`/projects/${id}`)
      setProject(r.data)
      const ar = await api.get(`/projects/${id}/activities`)
      setActivities(ar.data)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/tasks', { ...taskForm, projectId: id, estimatedHours: taskForm.estimatedHours || undefined })
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', estimatedHours: '', assigneeId: '' })
      loadProject()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating task')
    }
  }

  const createMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${id}/milestones`, milestoneForm)
      setShowMilestoneModal(false)
      setMilestoneForm({ name: '', targetDate: '' })
      loadProject()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error')
    }
  }

  const toggleMilestone = async (milestoneId: string, current: boolean) => {
    await api.patch(`/projects/${id}/milestones/${milestoneId}`, { isCompleted: !current })
    loadProject()
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await api.put(`/tasks/${taskId}`, { status })
    loadProject()
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/tasks/${taskId}`)
    loadProject()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
      </div>
    )
  }

  if (!project) return <div className="text-zinc-500">Project not found</div>

  const taskColumns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
  const tasksByStatus: Record<string, any[]> = {}
  taskColumns.forEach(s => { tasksByStatus[s] = project.tasks?.filter((t: any) => t.status === s) || [] })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects" className="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }} />
            <h1 className="font-rubik font-bold text-2xl text-white">{project.name}</h1>
          </div>
          {project.description && <p className="text-zinc-500 text-sm">{project.description}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
            <span>{format(new Date(project.startDate), 'MMM dd, yyyy')} → {format(new Date(project.endDate), 'MMM dd, yyyy')}</span>
            <span>Owner: {project.owner?.name}</span>
            {project.budget && <span>Budget: ${project.budget.toLocaleString()}</span>}
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Tasks', value: project.tasks?.length || 0, icon: CheckSquare, color: 'text-brand-teal' },
          { label: 'Done', value: project.tasks?.filter((t: any) => t.status === 'DONE').length || 0, icon: CheckSquare, color: 'text-brand-mint' },
          { label: 'Members', value: (project.members?.length || 0) + 1, icon: Users, color: 'text-yellow-400' },
          { label: 'Milestones', value: project.milestones?.length || 0, icon: Target, color: 'text-brand-orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#09090B] border border-white/10 rounded-xl p-4">
            <Icon className={`w-4 h-4 ${color} mb-2`} />
            <div className={`font-mono font-bold text-2xl ${color}`}>{value}</div>
            <div className="text-zinc-500 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#09090B] border border-white/10 rounded-xl p-1 w-fit">
        {['tasks', 'milestones', 'members', 'activity'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks Tab - Kanban */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {taskColumns.map(status => (
            <div key={status} className="bg-[#09090B] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${TASK_STATUS_COLORS[status]}`}>
                  {status.replace('_', ' ')}
                </span>
                <span className="text-xs text-zinc-600 font-mono">{tasksByStatus[status].length}</span>
              </div>
              <div className="space-y-2">
                {tasksByStatus[status].map((task: any) => (
                  <div key={task.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-white font-medium leading-snug flex-1">{task.title}</p>
                      {canManage && (
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      {task.assignee && (
                        <div className="w-5 h-5 rounded-full bg-brand-teal/20 flex items-center justify-center" title={task.assignee.name}>
                          <span className="text-[9px] text-brand-teal font-bold">{task.assignee.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-[10px] text-zinc-600 mt-1.5">
                        Due {format(new Date(task.dueDate), 'MMM dd')}
                      </div>
                    )}
                    {/* Quick status change */}
                    <select
                      value={task.status}
                      onChange={e => updateTaskStatus(task.id, e.target.value)}
                      className="mt-2 w-full text-[10px] bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-zinc-400 outline-none"
                    >
                      {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {tasksByStatus[status].length === 0 && (
                  <div className="text-center py-4 text-zinc-700 text-xs">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {canManage && (
            <button onClick={() => setShowMilestoneModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
          )}
          <div className="space-y-3">
            {project.milestones?.length === 0 && <div className="text-zinc-600 text-sm">No milestones yet</div>}
            {project.milestones?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-4 bg-[#09090B] border border-white/10 rounded-xl p-4">
                <button
                  onClick={() => toggleMilestone(m.id, m.isCompleted)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    m.isCompleted ? 'bg-brand-mint border-brand-mint' : 'border-zinc-600 hover:border-brand-teal'
                  }`}
                >
                  {m.isCompleted && <div className="w-2 h-2 rounded-full bg-black" />}
                </button>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${m.isCompleted ? 'line-through text-zinc-600' : 'text-white'}`}>{m.name}</p>
                </div>
                <div className={`text-xs font-mono ${m.isCompleted ? 'text-brand-mint' : 'text-zinc-500'}`}>
                  {format(new Date(m.targetDate), 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Owner */}
          <div className="bg-[#09090B] border border-brand-teal/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-sm">{project.owner?.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="font-medium text-white text-sm">{project.owner?.name}</p>
              <p className="text-xs text-brand-teal">Project Owner</p>
            </div>
          </div>
          {project.members?.map((m: any) => (
            <div key={m.id} className="bg-[#09090B] border border-white/10 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <span className="text-zinc-400 font-bold text-sm">{m.user?.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-white text-sm">{m.user?.name}</p>
                <p className="text-xs text-zinc-500">{m.roleInProject}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          {activities.length === 0 && <div className="text-zinc-600 text-sm">No activity yet</div>}
          {activities.map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 bg-[#09090B] border border-white/5 rounded-xl p-4">
              <div className="w-2 h-2 rounded-full bg-brand-teal/50 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-zinc-300">{a.description}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{format(new Date(a.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-rubik font-bold text-white">Create Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none resize-none"
                  placeholder="Task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none">
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none">
                    {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Est. Hours</label>
                  <input type="number" value={taskForm.estimatedHours} onChange={e => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Assign To</label>
                <select value={taskForm.assigneeId} onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none">
                  <option value="">Unassigned</option>
                  {[project.owner, ...project.members.map((m: any) => m.user)].map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskModal(false)}
                  className="flex-1 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-rubik font-bold text-white">Add Milestone</h2>
              <button onClick={() => setShowMilestoneModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Milestone Name *</label>
                <input value={milestoneForm.name} onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  placeholder="e.g. Phase 1 Complete"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Date *</label>
                <input type="date" value={milestoneForm.targetDate} onChange={e => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowMilestoneModal(false)}
                  className="flex-1 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all">Add Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
