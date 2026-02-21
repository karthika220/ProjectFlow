import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { Bell, BellRing, Mail, CheckSquare, Briefcase } from 'lucide-react'

interface NotificationPreferences {
  id?: string
  userId?: string
  emailEnabled?: boolean
  pushEnabled?: boolean
  taskReminders?: boolean
  projectUpdates?: boolean
}

export default function NotificationSettingsPage() {
  const { user } = useAuthStore()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const res = await api.get('/user/notifications')
      setPreferences(res.data)
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put('/user/notifications', {
        emailEnabled: preferences?.emailEnabled,
        pushEnabled: preferences?.pushEnabled,
        taskReminders: preferences?.taskReminders,
        projectUpdates: preferences?.projectUpdates
      })

      // Show success message
      alert('Notification preferences updated successfully!')
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      alert('Failed to update notification preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (field: keyof NotificationPreferences) => {
    if (preferences) {
      setPreferences(prev => prev ? {
        ...prev,
        [field]: !prev[field]
      } : null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-teal/30 border-t-brand-teal rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-zinc-400">Failed to load notification preferences</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-rubik font-bold text-2xl text-white">Notification Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your notification preferences</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <h3 className="font-rubik font-semibold text-white mb-6 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-brand-teal" />
            Notification Preferences
          </h3>
          
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-teal" />
                <div>
                  <div className="text-sm font-medium text-white">Email Notifications</div>
                  <div className="text-xs text-zinc-500">Receive updates via email</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('emailEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.emailEnabled ? 'bg-brand-teal' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    preferences.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-brand-teal" />
                <div>
                  <div className="text-sm font-medium text-white">Push Notifications</div>
                  <div className="text-xs text-zinc-500">Browser and mobile push alerts</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pushEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.pushEnabled ? 'bg-brand-teal' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    preferences.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Task Reminders */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-brand-teal" />
                <div>
                  <div className="text-sm font-medium text-white">Task Reminders</div>
                  <div className="text-xs text-zinc-500">Alerts for upcoming deadlines</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('taskReminders')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.taskReminders ? 'bg-brand-teal' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    preferences.taskReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Project Updates */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-brand-teal" />
                <div>
                  <div className="text-sm font-medium text-white">Project Updates</div>
                  <div className="text-xs text-zinc-500">Changes to project status and assignments</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('projectUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  preferences.projectUpdates ? 'bg-brand-teal' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    preferences.projectUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BellRing className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
