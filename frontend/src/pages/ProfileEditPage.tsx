import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/axios'
import { Save, X, Upload } from 'lucide-react'

interface UserProfile {
  id?: string
  name?: string
  email?: string
  role?: string
  department?: string
  phone?: string
  avatarUrl?: string
}

export default function ProfileEditPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    avatarUrl: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/user/me')
      console.log('Frontend - Profile response:', res.data)
      const userData = res.data.user // Backend returns { success: true, user: {...} }
      setProfile(userData)
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        department: userData.department || '',
        avatarUrl: userData.avatarUrl || ''
      })
    } catch (error: any) {
      console.error('Frontend - Failed to load profile:', error)
      console.error('Frontend - Error response:', error.response?.data)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put('/user/me', {
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        avatarUrl: formData.avatarUrl
      })

      // Show success message
      alert('Profile updated successfully!')
      navigate('/profile')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
        <h1 className="font-rubik font-bold text-2xl text-white">Edit Profile</h1>
        <p className="text-zinc-500 text-sm mt-1">Update your profile information</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Avatar Upload */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-zinc-300 mb-3">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center">
                  {formData.avatarUrl ? (
                    <img 
                      src={formData.avatarUrl} 
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-black font-bold text-xl">
                      {formData.name?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Engineering, Design, Marketing..."
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none"
              />
              <p className="text-xs text-zinc-500 mt-1">Enter URL to your profile image</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Engineering, Design, Marketing..."
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Role</label>
              <input
                type="text"
                value={profile.role?.replace('_', ' ') || ''}
                disabled
                className="w-full px-4 py-2.5 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-1">Role is assigned by administrator</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 border border-white/20 text-zinc-300 rounded-xl hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
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
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
