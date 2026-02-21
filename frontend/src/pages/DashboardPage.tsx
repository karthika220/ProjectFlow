import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Clock, Target, Activity } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { format } from 'date-fns'

interface DashboardStats {
  activeProjects: number
  completedTasks: number
  overdueTasks: number
  teamMembers: number
  totalProjects: number
}

interface TaskWeekly {
  day: string
  created: number
  completed: number
}

interface TeamUtilization {
  inUse: number
  available: number
}

interface ProjectHealth {
  name: string
  progress: number
}

interface MyTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  project: {
    name: string
    color: string
  }
}

interface Milestone {
  id: string
  name: string
  targetDate: string
  isCompleted: boolean
  project: {
    name: string
    color: string
  }
}

interface TaskCompletion {
  totalTasks: number
  breakdown: {
    status: string
    count: number
    percentage: number
  }[]
}

interface Activity {
  id: string
  description: string
  createdAt: string
  user?: {
    name: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-zinc-500/20 text-zinc-400',
  IN_PROGRESS: 'bg-brand-teal/20 text-brand-teal',
  IN_REVIEW: 'bg-yellow-500/20 text-yellow-400',
  DONE: 'bg-brand-mint/20 text-brand-mint',
  CANCELLED: 'bg-red-500/20 text-red-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-zinc-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-brand-orange',
  CRITICAL: 'text-red-400',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  
  // State for all API data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [taskWeekly, setTaskWeekly] = useState<TaskWeekly[]>([])
  const [teamUtilization, setTeamUtilization] = useState<TeamUtilization | null>(null)
  const [projectHealth, setProjectHealth] = useState<ProjectHealth[]>([])
  const [myTasks, setMyTasks] = useState<MyTask[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [taskCompletion, setTaskCompletion] = useState<TaskCompletion | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Parallel API calls
        const [
          statsRes,
          taskWeeklyRes,
          teamUtilizationRes,
          projectHealthRes,
          myTasksRes,
          milestonesRes,
          activityRes,
          taskCompletionRes
        ] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/task-weekly'),
          api.get('/dashboard/team-utilization'),
          api.get('/dashboard/project-health'),
          api.get('/dashboard/my-tasks'),
          api.get('/dashboard/milestones'),
          api.get('/dashboard/activity'),
          api.get('/dashboard/task-completion')
        ])

        setStats(statsRes.data)
        setTaskWeekly(taskWeeklyRes.data)
        setTeamUtilization(teamUtilizationRes.data)
        setProjectHealth(projectHealthRes.data)
        setMyTasks(myTasksRes.data)
        setMilestones(milestonesRes.data)
        setActivity(activityRes.data)
        setTaskCompletion(taskCompletionRes.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-rubik font-bold text-2xl text-white">
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Here's what's happening across your projects today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Projects', value: stats?.activeProjects || 0, icon: TrendingUp, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
          { label: 'Tasks Completed', value: stats?.completedTasks || 0, icon: CheckSquare, color: 'text-brand-mint', bg: 'bg-brand-mint/10' },
          { label: 'Overdue Tasks', value: stats?.overdueTasks || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Team Members', value: stats?.teamMembers || 0, icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#09090B] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <div className={`font-mono font-bold text-3xl ${color}`}>{value}</div>
            <div className="text-zinc-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Completion Trend */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Task Completion - Last 7 Days</h2>
          </div>
          <div className="space-y-2">
            {taskWeekly.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-sm">No task completions in last 7 days</div>
            )}
            {taskWeekly.map((trend, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">{trend.day}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-teal to-brand-mint rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((trend.completed / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-brand-teal font-bold">{trend.completed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Utilization Donut */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-brand-mint" />
            <h2 className="font-rubik font-semibold text-white">Team Utilization</h2>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#utilGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (teamUtilization?.inUse || 0) / 100)}`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="utilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00A1C7" />
                    <stop offset="100%" stopColor="#00FFAA" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-2xl text-white">{teamUtilization?.inUse || 0}%</span>
                <span className="text-zinc-500 text-xs">utilized</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">In Use</span>
              <span className="font-mono text-brand-mint font-bold">{teamUtilization?.inUse || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Available</span>
              <span className="font-mono text-zinc-400 font-bold">{teamUtilization?.available || 0}%</span>
            </div>
          </div>
        </div>

        {/* Project Health Bars */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-brand-orange" />
            <h2 className="font-rubik font-semibold text-white">Project Health</h2>
          </div>
          <div className="space-y-3">
            {projectHealth.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-sm">No projects to display</div>
            )}
            {projectHealth.map((project) => {
              const healthColor = project.progress >= 80 ? 'bg-brand-mint' : 
                               project.progress >= 50 ? 'bg-yellow-400' : 
                               'bg-red-400';
              
              return (
                <div key={project.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300 truncate max-w-[120px]">{project.name}</span>
                    <span className={`font-mono text-xs ${healthColor}`}>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${healthColor} rounded-full transition-all duration-500`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Middle row - Task Completion Donut Chart & My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Completion Donut Chart */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-brand-teal" />
            <h2 className="font-rubik font-semibold text-white">Task Completion</h2>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                {taskCompletion?.breakdown?.map((segment, index) => {
                  const colors = ['#00FFAA', '#00A1C7', '#FFD700', '#FF6B6B', '#8B5CF6'];
                  let previousOffset = 0;
                  
                  for (let i = 0; i < index; i++) {
                    previousOffset += (taskCompletion.breakdown[i].percentage / 100) * 2 * Math.PI * 50;
                  }
                  
                  const circumference = 2 * Math.PI * 50;
                  const percentage = segment.percentage / 100;
                  const dashArray = circumference * percentage;
                  const dashOffset = circumference * 0.25 - previousOffset;
                  
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
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-bold text-2xl text-white">
                  {taskCompletion?.breakdown?.find(b => b.status === 'DONE')?.percentage || 0}%
                </span>
                <span className="text-zinc-500 text-xs">completed</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {taskCompletion?.breakdown?.map((segment) => (
              <div key={segment.status} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    segment.status === 'DONE' ? 'bg-brand-mint' :
                    segment.status === 'IN_PROGRESS' ? 'bg-brand-teal' :
                    segment.status === 'TODO' ? 'bg-zinc-400' :
                    'bg-red-400'
                  }`} />
                  <span className="text-zinc-400">{segment.status.replace('_', ' ')}</span>
                </div>
                <span className="font-mono text-zinc-300 font-bold">{segment.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="lg:col-span-2 bg-[#09090B] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-brand-teal" />
              <h2 className="font-rubik font-semibold text-white">My Open Tasks</h2>
            </div>
            <Link to="/tasks" className="text-xs text-brand-teal hover:text-brand-mint transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {myTasks.length === 0 && (
              <div className="text-center py-8 text-zinc-600">No open tasks assigned to you</div>
            )}
            {myTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition-all group">
                <div className="w-2 h-2 rounded-full bg-brand-teal flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{task.title}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{task.project?.name}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.dueDate && (
                    <span className="text-xs text-zinc-500">
                      {format(new Date(task.dueDate), 'MMM dd')}
                    </span>
                  )}
                  <span className={`text-xs font-bold ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-brand-mint" />
          <h2 className="font-rubik font-semibold text-white">Upcoming Milestones</h2>
          <span className="text-xs text-zinc-600">next 14 days</span>
        </div>
        <div className="space-y-3">
          {milestones.length === 0 && (
            <div className="text-center py-4 text-zinc-600 text-sm">No upcoming milestones</div>
          )}
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-brand-mint/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-brand-mint" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{milestone.name}</div>
                <div className="text-xs text-zinc-500">{milestone.project?.name}</div>
              </div>
              <div className="text-xs text-brand-mint font-mono">
                {format(new Date(milestone.targetDate), 'MMM dd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-brand-orange" />
          <h2 className="font-rubik font-semibold text-white">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {activity.length === 0 && (
            <div className="text-center py-4 text-zinc-600 text-sm">No recent activity</div>
          )}
          {activity.map((act) => (
            <div key={act.id} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-teal/50 mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 leading-tight">{act.description}</p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {format(new Date(act.createdAt), 'MMM dd, HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
