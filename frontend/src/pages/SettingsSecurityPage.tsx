import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Key, Eye, EyeOff, Shield } from 'lucide-react'

export default function SettingsSecurityPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.values(newErrors).every(error => error === '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await api.post('/user/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })

      // Show success message
      alert('Password updated successfully!')
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Failed to change password:', error)
      alert('Failed to change password. Please check your current password and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-rubik font-bold text-2xl text-white">Change Password</h1>
        <p className="text-zinc-500 text-sm mt-1">Update your account password</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-brand-teal" />
            <h3 className="font-rubik font-semibold text-white">Security Settings</h3>
          </div>

          <div className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  required
                  className={`w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none pr-12 ${
                    errors.currentPassword ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-400 mt-1.5">{errors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                  className={`w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none pr-12 ${
                    errors.newPassword ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-400 mt-1.5">{errors.newPassword}</p>
              )}
              {formData.newPassword && formData.newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-zinc-500 mb-1">Password strength:</div>
                  <div className="flex gap-1">
                    <div className={`h-2 w-8 rounded ${
                      formData.newPassword.length >= 8 ? 'bg-green-500' : 
                      formData.newPassword.length >= 6 ? 'bg-yellow-500' : 
                      formData.newPassword.length >= 4 ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <div className={`h-2 w-8 rounded ${
                      formData.newPassword.length >= 8 ? 'bg-green-500' : 
                      formData.newPassword.length >= 6 ? 'bg-yellow-500' : 
                      formData.newPassword.length >= 4 ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <span className="text-xs text-zinc-400 ml-2">
                    {formData.newPassword.length >= 8 ? 'Strong' : 
                     formData.newPassword.length >= 6 ? 'Medium' : 
                     formData.newPassword.length >= 4 ? 'Weak' : 'Very Weak'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className={`w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-brand-teal outline-none pr-12 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-xl">
            <h4 className="text-sm font-medium text-white mb-3">Password Requirements:</h4>
            <ul className="text-xs text-zinc-400 space-y-1.5">
              <li>• At least 8 characters long</li>
              <li>• Include uppercase and lowercase letters</li>
              <li>• Include at least one number</li>
              <li>• Include special characters (recommended)</li>
            </ul>
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
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Updating Password...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
