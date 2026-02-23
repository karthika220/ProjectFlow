import { useEffect, useState, useRef } from 'react'
import { CheckSquare, Search, Filter, Plus, X, MessageSquare, Clock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format, differenceInDays } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-zinc-500/20 text-zinc-400 ring-zinc-500/30',
  IN_PROGRESS: 'bg-brand-teal/15 text-brand-teal ring-brand-teal/30',
  IN_REVIEW: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
  DONE: 'bg-brand-mint/15 text-brand-mint ring-brand-mint/30',
  DELAYED: 'bg-red-500/20 text-red-400 ring-red-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 ring-red-500/30',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-zinc-400', MEDIUM: 'text-yellow-400', HIGH: 'text-brand-orange', CRITICAL: 'text-red-400',
}
const PRIORITY_DOT: Record<string, string> = {
  LOW: 'bg-zinc-400', MEDIUM: 'bg-yellow-400', HIGH: 'bg-brand-orange', CRITICAL: 'bg-red-400',
}

// Utility function to calculate delay duration
const getDelayDuration = (dueDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const daysOverdue = differenceInDays(today, due)
  return daysOverdue > 0 ? daysOverdue : 0
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
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewsDropdown, setShowViewsDropdown] = useState(false)
  const [selectedView, setSelectedView] = useState<string>('')
  const viewsDropdownRef = useRef<HTMLDivElement>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    projectId: '',
    assigneeId: '',
    assignerId: user?.id || '',
    ownerId: ''
  })
  const [projectUsers, setProjectUsers] = useState<any[]>([])

  const canCreate = ['MANAGING_DIRECTOR', 'HR_MANAGER', 'TEAM_LEAD'].includes(user?.role || '')

  // Task Views Configuration
  const taskViews = {
    // Predefined Views
    predefined: [
      { id: 'all', label: 'All Tasks', filter: {} as any },
      { id: 'all_open', label: 'All Open', filter: { status: 'TODO,IN_PROGRESS,IN_REVIEW' } as any },
      { id: 'all_closed', label: 'All Closed', filter: { status: 'DONE,CANCELLED' } as any },
      { id: 'all_overdue_open', label: 'All Overdue & Open', filter: { overdue: true, status: 'TODO,IN_PROGRESS,IN_REVIEW' } as any },
      { id: 'unassigned', label: 'Unassigned', filter: { unassigned: true } as any },
      { id: 'unscheduled', label: 'Unscheduled Tasks', filter: { unscheduled: true } as any },
    ],
    myViews: [
      { id: 'my_open', label: 'My Open', filter: { ownerId: user?.id, status: 'TODO,IN_PROGRESS,IN_REVIEW' } as any },
      { id: 'my_closed', label: 'My Closed', filter: { ownerId: user?.id, status: 'DONE,CANCELLED' } as any },
      { id: 'my_overdue_open', label: 'My Overdue & Open', filter: { ownerId: user?.id, overdue: true, status: 'TODO,IN_PROGRESS,IN_REVIEW' } as any },
      { id: 'today', label: "Today's Tasks", filter: { ownerId: user?.id, dueDate: 'today' } as any },
      { id: 'following', label: 'Tasks I Follow', filter: { following: true, ownerId: user?.id } as any },
      { id: 'created_by_me', label: 'Tasks Created By Me', filter: { assignerId: user?.id } as any },
      { id: 'assigned_via_picklist', label: 'Assigned Via Pick List', filter: { ownerId: user?.id, assignedViaPicklist: true } as any },
    ],
    customViews: [] as any[], // TODO: Add custom views from backend
    sharedViews: [] as any[], // TODO: Add shared views from backend
  }

  // Apply view filters
  const applyViewFilter = (viewId: string) => {
    setSelectedView(viewId)
    
    // Find the view configuration
    const allViews = [
      ...taskViews.predefined,
      ...taskViews.myViews,
      ...taskViews.customViews,
      ...taskViews.sharedViews
    ]
    const view = allViews.find(v => v.id === viewId)
    
    if (view) {
      // Reset existing filters
      setStatusFilter('')
      setPriorityFilter('')
      setProjectFilter('')
      
      // Apply view-specific filters
      if (view.filter.status) {
        setStatusFilter(view.filter.status)
      }
      if ('priority' in view.filter && view.filter.priority) {
        setPriorityFilter(view.filter.priority)
      }
      if ('projectId' in view.filter && view.filter.projectId) {
        setProjectFilter(view.filter.projectId)
      }
      
      // Store custom filter params for API call
      setViewFilter(view.filter)
    }
  }

  const [viewFilter, setViewFilter] = useState<any>({})

  // Close views dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewsDropdownRef.current && !viewsDropdownRef.current.contains(event.target as Node)) {
        setShowViewsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Check if user can edit the task
  const canEditTask = (task: any) => {
    return task.assigneeId === user?.id || task.creatorId === user?.id || canCreate
  }

  useEffect(() => {
    loadTasks()
    api.get('/projects').then(r => setProjects(r.data))
  }, [statusFilter, priorityFilter, projectFilter, viewFilter])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const params: any = {}
      
      // Apply standard filters
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (projectFilter) params.projectId = projectFilter
      
      // Apply view-specific filters
      if (viewFilter.ownerId) params.ownerId = viewFilter.ownerId
      if (viewFilter.assignerId) params.assignerId = viewFilter.assignerId
      if (viewFilter.dueDate === 'today') {
        params.dueDate = new Date().toISOString().split('T')[0]
      }
      if (viewFilter.overdue) {
        params.overdue = true
      }
      if (viewFilter.unassigned) {
        params.unassigned = true
      }
      if (viewFilter.unscheduled) {
        params.unscheduled = true
      }
      if (viewFilter.following) {
        params.following = true
      }
      if (viewFilter.assignedViaPicklist) {
        params.assignedViaPicklist = true
      }
      
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

  const updateTask = async (taskId: string, updates: any) => {
    try {
      await api.put(`/tasks/${taskId}`, updates)
      loadTasks()
      if (selectedTask?.id === taskId) {
        setSelectedTask((t: any) => t ? { ...t, ...updates } : t)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleFieldBlur = (field: string, value: any) => {
    if (editingTask && canEditTask(selectedTask)) {
      updateTask(selectedTask.id, { [field]: value })
    }
    setEditingTask(null)
  }

  const createTask = async () => {
    try {
      const taskData = {
        ...newTask,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
        assigneeId: newTask.ownerId || user?.id, // Use ownerId as assignee
        creatorId: user?.id, // Set creator as current user
        assignerId: user?.id // Set assigner as current user
      }
      
      await api.post('/tasks', taskData)
      setShowCreateModal(false)
      setNewTask({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '',
        projectId: '',
        assigneeId: '',
        assignerId: user?.id || '',
        ownerId: ''
      })
      setProjectUsers([])
      loadTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const loadProjectUsers = async (projectId: string) => {
    if (!projectId) {
      setProjectUsers([])
      return
    }
    
    try {
      // Get project details with team members
      const project = await api.get(`/projects/${projectId}`)
      setProjectUsers(project.data.team || [])
    } catch (error) {
      console.error('Failed to load project users:', error)
      setProjectUsers([])
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
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,161,199,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          )}
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
          
          {/* Views Dropdown */}
          <div className="relative" ref={viewsDropdownRef}>
            <button
              onClick={() => setShowViewsDropdown(!showViewsDropdown)}
              className={`flex items-center gap-2 bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none transition-all ${
                selectedView ? 'border-brand-teal text-brand-teal' : 'hover:border-brand-teal'
              }`}
            >
              <Filter className="w-4 h-4" />
              {selectedView ? (() => {
                const allViews = [...taskViews.predefined, ...taskViews.myViews, ...taskViews.customViews, ...taskViews.sharedViews]
                const view = allViews.find(v => v.id === selectedView)
                return view ? view.label : 'Views'
              })() : 'Views'}
            </button>
            
            {showViewsDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-[#18181B] border border-white/10 rounded-xl min-w-[200px] max-h-80 overflow-y-auto z-10">
                {/* Predefined Views */}
                <div className="p-2">
                  <div className="text-xs font-medium text-zinc-500 mb-2 px-2">Predefined Views</div>
                  {taskViews.predefined.map(view => (
                    <button
                      key={view.id}
                      onClick={() => {
                        applyViewFilter(view.id)
                        setShowViewsDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-all ${
                        selectedView === view.id 
                          ? 'bg-brand-teal/20 text-brand-teal' 
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
                
                {/* My Views */}
                <div className="p-2 border-t border-white/5">
                  <div className="text-xs font-medium text-zinc-500 mb-2 px-2">My Views</div>
                  {taskViews.myViews.map(view => (
                    <button
                      key={view.id}
                      onClick={() => {
                        applyViewFilter(view.id)
                        setShowViewsDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-all ${
                        selectedView === view.id 
                          ? 'bg-brand-teal/20 text-brand-teal' 
                          : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
                
                {/* My Custom Views */}
                {taskViews.customViews.length > 0 && (
                  <div className="p-2 border-t border-white/5">
                    <div className="text-xs font-medium text-zinc-500 mb-2 px-2">My Custom Views</div>
                    {taskViews.customViews.map(view => (
                      <button
                        key={view.id}
                        onClick={() => {
                          applyViewFilter(view.id)
                          setShowViewsDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-all ${
                          selectedView === view.id 
                            ? 'bg-brand-teal/20 text-brand-teal' 
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Shared Views */}
                {taskViews.sharedViews.length > 0 && (
                  <div className="p-2 border-t border-white/5">
                    <div className="text-xs font-medium text-zinc-500 mb-2 px-2">Shared Views</div>
                    {taskViews.sharedViews.map(view => (
                      <button
                        key={view.id}
                        onClick={() => {
                          applyViewFilter(view.id)
                          setShowViewsDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-all ${
                          selectedView === view.id 
                            ? 'bg-brand-teal/20 text-brand-teal' 
                            : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#18181B] border border-white/10 text-zinc-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-brand-teal transition-all">
            <option value="">All Status</option>
            {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DELAYED', 'DONE', 'CANCELLED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
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
                      <p className={`text-sm font-medium truncate flex-1 ${task.status === 'DELAYED' ? 'text-red-400' : 'text-white'}`}>{task.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 flex-shrink-0 ${STATUS_COLORS[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.status === 'DELAYED' && (
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {task.project && (
                        <span className="text-zinc-500">
                          {task.project.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <div className="flex flex-col">
                          <span className={task.status === 'DELAYED' ? 'text-red-400' : 'text-zinc-500'}>
                            Due {format(new Date(task.dueDate), 'MMM dd')}
                          </span>
                          {task.status === 'DELAYED' && (
                            <span className="text-red-400 font-medium">
                              Delayed by {getDelayDuration(task.dueDate)} days
                            </span>
                          )}
                        </div>
                      )}
                      {task.assignee && <span className="text-zinc-500">→ {task.assignee.name}</span>}
                      {task._count?.comments > 0 && (
                        <span className="flex items-center gap-1 text-zinc-500"><MessageSquare className="w-3 h-3" />{task._count.comments}</span>
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
              {canEditTask(selectedTask) ? (
                <input
                  type="text"
                  value={selectedTask.title}
                  onChange={e => setSelectedTask({...selectedTask, title: e.target.value})}
                  onBlur={e => handleFieldBlur('title', e.target.value)}
                  className="font-rubik font-bold text-white bg-transparent border-none outline-none w-full text-lg"
                  placeholder="Task title"
                />
              ) : (
                <h2 className="font-rubik font-bold text-white">{selectedTask.title}</h2>
              )}
              {selectedTask.description && (
                canEditTask(selectedTask) ? (
                  <textarea
                    value={selectedTask.description}
                    onChange={e => setSelectedTask({...selectedTask, description: e.target.value})}
                    onBlur={e => handleFieldBlur('description', e.target.value)}
                    className="text-zinc-500 text-sm mt-1 bg-transparent border-none outline-none w-full resize-none"
                    rows={3}
                    placeholder="Task description"
                  />
                ) : (
                  <p className="text-zinc-500 text-sm mt-1">{selectedTask.description}</p>
                )
              )}
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
                {canEditTask(selectedTask) ? (
                  <select 
                    value={selectedTask.priority} 
                    onChange={e => handleFieldBlur('priority', e.target.value)}
                    className="bg-transparent text-white text-xs outline-none w-full cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                ) : (
                  <div className={`font-bold ${PRIORITY_COLORS[selectedTask.priority]}`}>{selectedTask.priority}</div>
                )}
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
                  {canEditTask(selectedTask) ? (
                    <input
                      type="date"
                      value={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ''}
                      onChange={e => handleFieldBlur('dueDate', e.target.value)}
                      className="bg-transparent text-white text-xs outline-none w-full cursor-pointer"
                    />
                  ) : (
                    <div className="text-white">{format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}</div>
                  )}
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#09090B] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-rubik font-bold text-white text-lg">Create New Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-zinc-400 text-sm mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-brand-teal outline-none resize-none"
                  rows={3}
                  placeholder="Enter task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Status</label>
                  <select
                    value={newTask.status}
                    onChange={e => setNewTask({...newTask, status: e.target.value})}
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Project</label>
                  <select
                    value={newTask.projectId}
                    onChange={e => {
                      setNewTask({...newTask, projectId: e.target.value, ownerId: ''})
                      loadProjectUsers(e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Assigned By</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    readOnly
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white opacity-60 cursor-not"
                  />
                </div>
                
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Owner *</label>
                  <select
                    value={newTask.ownerId}
                    onChange={e => setNewTask({...newTask, ownerId: e.target.value})}
                    className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white focus:border-brand-teal outline-none"
                    required
                  >
                    <option value="">Select Owner</option>
                    {projectUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createTask}
                disabled={!newTask.title.trim() || !newTask.ownerId.trim()}
                className="px-6 py-3 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
