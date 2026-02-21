import { useEffect, useState } from 'react'
import { BarChart3, Plus, Trash2, X, FileText, TrendingUp, Clock, Download, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format } from 'date-fns'

interface TaskStatus {
  status: string
  count: number
}

interface ProjectStatus {
  status: string
  count: number
}

interface Project {
  id: string
  name: string
}

interface ProjectReport {
  projectName: string
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  progressPercent: number
  tasksByStatus: TaskStatus[]
}

const REPORT_TYPES = [
  { value: 'PROJECT_SUMMARY', label: 'Project Summary', icon: FileText },
  { value: 'TASK_SUMMARY', label: 'Task Summary', icon: TrendingUp },
  { value: 'TIMESHEET', label: 'Timesheet Report', icon: Clock },
]

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'PROJECT_SUMMARY' })
  const [selectedReport, setSelectedReport] = useState<any>(null)

  // New states for donut charts and project reports
  const [taskStatusData, setTaskStatusData] = useState<TaskStatus[]>([])
  const [projectStatusData, setProjectStatusData] = useState<ProjectStatus[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projectReport, setProjectReport] = useState<ProjectReport | null>(null)
  const [loadingProjectReport, setLoadingProjectReport] = useState(false)

  const canCreate = ['MANAGING_DIRECTOR', 'HR_MANAGER'].includes(user?.role || '')

  useEffect(() => {
    loadReports()
    loadDonutData()
    loadProjects()
  }, [])

  const loadDonutData = async () => {
    try {
      const [taskStatusRes, projectStatusRes] = await Promise.all([
        api.get('/reports/task-status'),
        api.get('/reports/project-status')
      ])
      setTaskStatusData(taskStatusRes.data)
      setProjectStatusData(projectStatusRes.data)
    } catch (error) {
      console.error('Failed to load donut data:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const res = await api.get('/reports/projects')
      setProjects(res.data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const r = await api.get('/reports')
      setReports(r.data)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectReport = async (projectId: string) => {
    if (!projectId) return
    setLoadingProjectReport(true)
    try {
      const res = await api.get(`/reports/project/${projectId}`)
      setProjectReport(res.data)
    } catch (error) {
      console.error('Failed to load project report:', error)
    } finally {
      setLoadingProjectReport(false)
    }
  }

  const createReport = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Frontend - Creating report with form data:', form)
    try {
      const response = await api.post('/reports', form)
      console.log('Frontend - Report creation response:', response.data)
      setShowModal(false)
      setForm({ title: '', type: 'PROJECT_SUMMARY' })
      loadReports()
    } catch (err: any) {
      console.error('Frontend - Report creation error:', err)
      console.error('Frontend - Error response:', err.response?.data)
      alert(err.response?.data?.error || err.response?.data?.message || 'Error creating report')
    }
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return
    await api.delete(`/reports/${id}`)
    loadReports()
    if (selectedReport?.id === id) setSelectedReport(null)
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    if (projectId) {
      loadProjectReport(projectId)
    } else {
      setProjectReport(null)
    }
  }

  // Donut chart component
  const DonutChart = ({ data, title, colors }: { data: any[], title: string, colors: string[] }) => {
    const total = data.reduce((sum, item) => sum + item.count, 0)
    let previousOffset = 0
    
    return (
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">{title}</h3>
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              {data.map((segment, index) => {
                const percentage = total > 0 ? (segment.count / total) * 100 : 0
                const circumference = 2 * Math.PI * 50
                const dashArray = circumference * (percentage / 100)
                const dashOffset = circumference * 0.25 - previousOffset
                
                previousOffset += circumference * (percentage / 100)
                
                return (
                  <circle
                    key={segment.status}
                    cx="60" cy="60" r="50" fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-1000"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-2xl text-white">{total}</span>
              <span className="text-zinc-500 text-xs">total</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((segment) => (
            <div key={segment.status} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                  segment.status === 'DONE' ? 'from-brand-mint to-brand-teal' :
                  segment.status === 'IN_PROGRESS' ? 'from-brand-teal to-blue-400' :
                  segment.status === 'IN_REVIEW' ? 'from-yellow-400 to-orange-400' :
                  segment.status === 'TODO' ? 'from-zinc-400 to-zinc-600' :
                  segment.status === 'ACTIVE' ? 'from-green-400 to-emerald-500' :
                  segment.status === 'ON_HOLD' ? 'from-orange-400 to-red-400' :
                  'from-blue-400 to-purple-500'
                }`} />
                <span className="text-zinc-400">{segment.status.replace('_', ' ')}</span>
              </div>
              <span className="font-mono text-zinc-300 font-bold">{segment.count}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-rubik font-bold text-2xl text-white">Reports & Analytics</h1>
          <p className="text-zinc-500 text-sm mt-1">View and generate project reports</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,161,199,0.3)]">
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
        )}
      </div>

      {/* Live Overview with Donut Charts */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
        <h2 className="font-rubik font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-teal" />
          Live Overview
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <DonutChart 
            data={taskStatusData}
            title="Task Status Distribution"
            colors={['#00FFAA', '#00A1C7', '#FFD700', '#8B5CF6', '#EF4444']}
          />
          
          {/* Project Status Distribution */}
          <DonutChart 
            data={projectStatusData}
            title="Project Status Distribution"
            colors={['#10B981', '#F59E0B', '#6366F1']}
          />
        </div>
      </div>

      {/* Project Selector */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
        <h3 className="font-rubik font-semibold text-white mb-4">Project Analytics</h3>
        <div className="relative">
          <select 
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none appearance-none cursor-pointer"
          >
            <option value="">Select a project to view report</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-3 w-5 h-5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Project Wise Report */}
      {loadingProjectReport && (
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
          </div>
        </div>
      )}

      {projectReport && !loadingProjectReport && (
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <h3 className="font-rubik font-semibold text-white mb-4">{projectReport.projectName} Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="font-mono font-bold text-2xl text-brand-teal">{projectReport.totalTasks}</div>
              <div className="text-zinc-500 text-sm mt-1">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-bold text-2xl text-brand-mint">{projectReport.completedTasks}</div>
              <div className="text-zinc-500 text-sm mt-1">Completed Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-bold text-2xl text-red-400">{projectReport.overdueTasks}</div>
              <div className="text-zinc-500 text-sm mt-1">Overdue Tasks</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Project Progress</span>
              <span className="font-mono text-brand-teal font-bold">{projectReport.progressPercent}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-teal to-brand-mint rounded-full transition-all duration-500"
                style={{ width: `${projectReport.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Mini Donut for Task Statuses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DonutChart 
              data={projectReport.tasksByStatus}
              title="Task Status Breakdown"
              colors={['#00FFAA', '#00A1C7', '#FFD700', '#8B5CF6', '#EF4444']}
            />
            
            <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Task Details</h3>
              <div className="space-y-3">
                {projectReport.tasksByStatus.map((task) => (
                  <div key={task.status} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{task.status.replace('_', ' ')}</span>
                    <span className="font-mono text-zinc-300 font-bold">{task.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Reports */}
      <div>
        <h2 className="font-rubik font-semibold text-white mb-4">Generated Reports</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-[#09090B] border border-white/5 rounded-xl h-16 animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-[#09090B] border border-white/10 rounded-2xl text-zinc-600">
            <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-lg font-medium">No reports generated</p>
            {canCreate && <p className="text-sm mt-1">Click "Generate Report" to create your first report</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => {
              const typeInfo = REPORT_TYPES.find(t => t.value === report.type)
              const Icon = typeInfo?.icon || FileText
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                  className="bg-[#09090B] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-brand-teal" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">{report.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>{typeInfo?.label}</span>
                        <span>·</span>
                        <span>by {report.createdBy?.name}</span>
                        <span>·</span>
                        <span>{format(new Date(report.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    {canCreate && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteReport(report.id) }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Expanded data */}
                  {selectedReport?.id === report.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <pre className="text-xs text-zinc-400 bg-black/30 rounded-lg p-4 overflow-auto max-h-60">
                        {JSON.stringify(report.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-rubik font-bold text-white">Generate Report</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={createReport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Report Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                  className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  placeholder="e.g. Q4 Project Summary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Report Type</label>
                <div className="space-y-2">
                  {REPORT_TYPES.map(({ value, label, icon: Icon }) => (
                    <label key={value} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.type === value ? 'border-brand-teal/40 bg-brand-teal/5' : 'border-white/10 hover:border-white/20'
                    }`}>
                      <input type="radio" name="type" value={value} checked={form.type === value}
                        onChange={e => setForm({ ...form, type: e.target.value })} className="hidden" />
                      <Icon className={`w-5 h-5 ${form.type === value ? 'text-brand-teal' : 'text-zinc-500'}`} />
                      <span className={`text-sm font-medium ${form.type === value ? 'text-white' : 'text-zinc-400'}`}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
