import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setProfile, setInitialized } = useAuthStore()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true); setError('')

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      if (!data.session) throw new Error('Login failed')

      const res = await api.get('/auth/me')
      const { user, profile } = res.data

      setUser(user)
      setProfile(profile)
      setInitialized(true)

      // Navigate based on role and onboarding status
      const onboardingDone = user.onboarding_done || !!profile
      if (!onboardingDone) {
        navigate('/onboarding', { replace: true })
      } else if (user.role === 'employer') {
        navigate('/employer/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }

    } catch (err: any) {
      setError(
        err.message?.includes('Invalid login credentials')
          ? 'Wrong email or password. Please try again.'
          : err.message || 'Login failed. Please try again.'
      )
      setLoading(false)
      submitting.current = false
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A6E4A 0%, #085A3C 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #D4A017 0%, transparent 50%)' }} />
        <Link to="/" className="flex items-center gap-2 text-green-200 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <p className="text-4xl font-bold text-white leading-tight mb-3">
            Welcome back.<br />Your next role<br />is waiting.
          </p>
          <p className="text-green-200">Continue your global job search.</p>
        </div>
        <p className="text-green-300 text-sm relative z-10">"Your Skills. Global Opportunities. African Roots."</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm mb-6 hover:text-primary transition-colors" style={{ color: 'var(--text-2)' }}>
            <ArrowLeft size={16} /> Home
          </Link>

          <div className="mb-7">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Sign in</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">Create one free</Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com"
                required autoComplete="email" autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="Your password"
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 text-base shadow-hover mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in…
                  </span>
                : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
