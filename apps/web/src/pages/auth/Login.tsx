import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setProfile, setInitialized } = useAuthStore()
  const submitting = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setLoading(true); setError('')
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      if (!data.user) throw new Error('Login failed')

      const role = data.user.user_metadata?.role || 'job_seeker'
      setUser({ id: data.user.id, email: data.user.email!, role, credits: 10, lang: 'en', plan: 'free' })

      // Fetch full profile
      try {
        const res = await api.get('/auth/me')
        if (res.data.user) setUser({ ...res.data.user })
        if (res.data.profile) setProfile(res.data.profile)
        setInitialized(true)

        const hasProfile = !!res.data.profile
        const dest = role === 'employer' ? '/employer/dashboard' : '/dashboard'
        navigate(hasProfile ? dest : '/onboarding', { replace: true })
      } catch {
        setInitialized(true)
        navigate('/onboarding', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
      submitting.current = false
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-1 text-sm mb-8 hover:text-primary transition-colors"
          style={{ color: 'var(--text-3)' }}>
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float shadow-glow">
            <span className="text-white font-bold text-lg">JL</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Welcome back</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>Sign in to your JobLink account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
              {t('auth.email')}
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input-field" placeholder="you@example.com" required autoComplete="email" autoFocus />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{t('auth.password')}</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t('auth.forgot')}</Link>
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
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Signing in…' : t('auth.sign_in')}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
          <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <button onClick={handleGoogle} disabled={googleLoading}
          className="btn-secondary w-full flex items-center justify-center gap-3 py-2.5">
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
          {googleLoading ? 'Redirecting…' : t('auth.google')}
        </button>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-3)' }}>
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">{t('auth.sign_up')}</Link>
        </p>
      </div>
    </div>
  )
}
