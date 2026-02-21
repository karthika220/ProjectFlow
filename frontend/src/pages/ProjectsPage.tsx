import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FolderKanban, Users, CheckSquare, Calendar, Tag, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']
const STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
  IN_PROGRESS: 'bg-brand-teal/15 text-brand-teal ring-brand-teal/30',
  ON_HOLD: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
  COMPLETED: 'bg-brand-mint/15 text-brand-mint ring-brand-mint/30',
  ARCHIVED: 'bg-zinc-700/20 text-zinc-600 ring-zinc-700/30',
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])

  const [form, setForm] = useState({
    name: '', description: '', status: 'PLANNING',
    startDate: '', endDate: '', budget: '', color: '#00A1C7', tags: '',
    memberIds: [] as string[],
  })

  const canCreate = ['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || '')

  useEffect(() => {
    loadProjects()
    if (canCreate) {
      api.get('/users').then(r => setAllUsers(r.data))
    }
  }, [statusFilter])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const r = await api.get('/projects', { params })
      setProjects(r.data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/projects', {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      setShowModal(false)
      setForm({ name: '', description: '', status: 'PLANNING', startDate: '', endDate: '', budget: '', color: '#00A1C7', tags: '', memberIds: [] })
      loadProjects()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating project')
    }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-rubik font-bold text-2xl text-white">Projects</h1>
          <p className="text-zinc-500 text-sm mt-1">{projects.length} projects total</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,161,199,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center bg-[#18181B] border border-white/10 rounded-xl px-3 focus-within:border-brand-teal transition-all">
          <Search className="w-4 h-4 text-zinc-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="bg-transparent text-white placeholder-zinc-600 text-sm px-3 py-2.5 outline-none w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-brand-teal transition-all"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#09090B] border border-white/5 rounded-2xl p-5 h-52 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-2/3 mb-3" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-[#09090B] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all duration-200 group block"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: project.color + '20', border: `1px solid ${project.color}30` }}
                  >
                    <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className="font-rubik font-semibold text-white text-sm group-hover:text-brand-teal transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <span className="text-xs text-zinc-500">{project.owner?.name}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ring-1 ${STATUS_COLORS[project.status]}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              {project.description && (
                <p className="text-zinc-500 text-xs mb-4 line-clamp-2">{project.description}</p>
              )}

              {/* Tags */}
              {project.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded-md">
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{project._count?.tasks || 0} tasks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{(project.members?.length || 0) + 1} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(project.endDate), 'MMM dd, yy')}</span>
                </div>
              </div>
            </Link>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <FolderKanban className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm">Try adjusting your filters or create a new project</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-rubik font-bold text-white text-lg">Create New Project</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Project Name *</label>
                <input
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  required placeholder="e.g. Website Redesign"
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Describe the project..."
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 outline-none transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none transition-all"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Budget (optional)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="design, frontend, urgent"
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Project Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-white/10 bg-[#18181B] cursor-pointer"
                  />
                  <span className="text-zinc-500 text-sm font-mono">{form.color}</span>
                  <div className="flex gap-2 flex-wrap">
                    {['#00A1C7', '#00FFAA', '#FF6826', '#8B5CF6', '#EC4899', '#F59E0B'].map(c => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className="w-6 h-6 rounded-full border-2 transition-all"
                        style={{ backgroundColor: c, borderColor: form.color === c ? '#fff' : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
