import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, token } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@projectflow.io')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) navigate('/dashboard')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-teal/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-mint/5 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-[#09090B]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-mint flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,161,199,0.4)]">
              <span className="text-black font-rubik font-bold text-2xl">PF</span>
            </div>
            <h1 className="font-rubik font-bold text-2xl text-white">ProjectFlow</h1>
            <p className="text-zinc-400 text-sm mt-1">Project Management System</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600
                  focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all duration-200 outline-none"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-[#18181B] border border-white/10 rounded-xl text-white placeholder-zinc-600
                    focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10 transition-all duration-200 outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6
                bg-gradient-to-r from-brand-teal to-brand-mint text-black font-bold rounded-xl
                hover:opacity-90 transition-all duration-200
                shadow-[0_0_30px_rgba(0,161,199,0.4)] disabled:opacity-50 disabled:cursor-not-allowed
                mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Sign Up Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-full flex items-center justify-center gap-2 py-3 px-6
                border border-white/20 text-zinc-300 font-medium rounded-xl
                hover:bg-white/5 transition-all duration-200"
            >
              Sign Up
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-brand-teal hover:text-brand-mint transition-colors font-medium"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
