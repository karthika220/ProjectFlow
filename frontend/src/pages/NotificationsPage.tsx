import { useEffect, useState } from 'react'
import { Bell, Check, CheckCircle, Clock, AlertTriangle, Calendar, FileText, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { useNotifications } from '../utils/notifications'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

// Relative timestamp utility
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// Icon mapping for notification types
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'TASK_OVERDUE': return <AlertTriangle className="w-5 h-5 text-red-400" />
    case 'TIMESHEET_SUBMITTED': return <FileText className="w-5 h-5 text-blue-400" />
    case 'MENTION': return <Bell className="w-5 h-5 text-brand-teal" />
    case 'PROJECT_UPDATE': return <Calendar className="w-5 h-5 text-purple-400" />
    case 'TASK_ASSIGNED': return <CheckCircle className="w-5 h-5 text-green-400" />
    default: return <Bell className="w-5 h-5 text-zinc-400" />
  }
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const { refreshUnreadCount } = useNotifications()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      refreshUnreadCount() // Update notification count
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      )
      refreshUnreadCount() // Update notification count
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-rubik font-bold text-2xl text-white">Notifications</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-teal/10 text-brand-teal rounded-xl hover:bg-brand-teal/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markingAll ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
                Marking all...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Mark all as read
              </>
            )}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-[#09090B] border border-white/10 rounded-2xl p-12 text-center">
            <Bell className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg font-medium">No notifications yet</p>
            <p className="text-zinc-600 text-sm mt-1">You'll see notifications here when there are updates</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-[#09090B] border rounded-2xl p-5 transition-all ${
                !notification.isRead 
                  ? 'border-brand-teal/30 bg-brand-teal/5' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className={`font-semibold text-sm ${
                      !notification.isRead ? 'text-white' : 'text-zinc-300'
                    }`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 text-zinc-500 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm leading-relaxed ${
                    !notification.isRead ? 'text-zinc-200' : 'text-zinc-500'
                  }`}>
                    {notification.message}
                  </p>
                  {!notification.isRead && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-teal/20 text-brand-teal text-[10px] font-medium rounded-full">
                        <div className="w-1.5 h-1.5 bg-brand-teal rounded-full" />
                        Unread
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
