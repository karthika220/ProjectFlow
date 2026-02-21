import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { User } from 'lucide-react'

interface UserProfile {
  id?: string
  name?: string
  email?: string
  role?: string
  department?: string
  phone?: string
  avatarUrl?: string
  createdAt?: string
}

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/user/me')
      console.log('Frontend - Profile response:', res.data)
      setProfile(res.data.user) // Backend returns { success: true, user: {...} }
    } catch (error: any) {
      console.error('Frontend - Failed to load profile:', error)
      console.error('Frontend - Error response:', error.response?.data)
    } finally {
      setLoading(false)
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

  if (!profile) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-zinc-400">Failed to load profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-rubik font-bold text-2xl text-white">View Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Your profile information</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center mx-auto mb-4">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-black font-bold text-2xl">
                  {profile.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h2 className="font-rubik font-bold text-xl text-white mb-1">{profile.name}</h2>
            <p className="text-brand-teal font-medium">{profile.role?.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Right Column - Info */}
        <div className="lg:col-span-2 bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <h3 className="font-rubik font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-teal" />
            Profile Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                <div className="px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white">
                  {profile.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                <div className="px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white">
                  {profile.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Phone Number</label>
                <div className="px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white">
                  {profile.phone || 'Not provided'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Department</label>
                <div className="px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white">
                  {profile.department || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Role</label>
              <div className="px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white">
                {profile.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
        <h3 className="font-rubik font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-brand-teal font-bold">
                  {activity.action.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">
                  <span className="font-medium">{activity.action}</span> - {activity.description}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Button */}
      <div className="flex justify-center">
        <button
          onClick={() => window.location.href = '/profile/edit'}
          className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all"
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}
