import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, User, Briefcase, ArrowLeft, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

type Role = 'job_seeker' | 'employer'

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setUser, setInitialized } = useAuthStore()
  const submitting = useRef(false)
  const [role, setRole] = useState<Role>('job_seeker')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting.current) return
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    submitting.current = true
    setLoading(true); setError('')
    try {
      await supabase.auth.signOut()
      const { data, error: err } = await supabase.auth.signUp({
        email, password, options: { data: { role } }
      })
      if (err) throw err
      if (!data.user) throw new Error('Registration failed')
      setUser({ id: data.user.id, email, role, credits: 10, lang: 'en', plan: 'free' })
      setInitialized(true)
      navigate('/onboarding', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      setLoading(false)
      submitting.current = false
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding`, queryParams: { role } }
    })
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-primary p-12 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          {Array.from({length: 8}).map((_,i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${(i+1)*120}px`, height: `${(i+1)*120}px`, top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)' }} />
          ))}
        </div>
        <Link to="/" className="flex items-center gap-2 text-green-200 hover:text-white transition-colors relative z-10">
          <ArrowLeft size={18} /> Back to home
        </Link>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 animate-float">
            <Globe size={28} className="text-white" />
          </div>
          <p className="text-5xl font-bold leading-tight mb-4">
            Your skills.<br />
            Global stage.<br />
            <span style={{ color: 'var(--accent)' }}>Start here.</span>
          </p>
          <p className="text-green-200 text-lg">AI-powered applications to remote jobs worldwide — built for African talent.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex -space-x-2">
            {['K','A','M','T'].map((l,i) => (
              <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-primary flex items-center justify-center text-sm font-bold">
                {l}
              </div>
            ))}
          </div>
          <p className="text-green-200 text-sm">Join professionals from Cameroon already applying globally</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm mb-6 hover:text-primary transition-colors"
            style={{ color: 'var(--text-3)' }}>
            <ArrowLeft size={16} /> Home
          </Link>

          <div className="mb-7">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Create account</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              Get <span className="font-semibold text-primary">10 free AI applications</span> on signup
            </p>
          </div>

          {/* Role selector */}
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-2)' }}>{t('auth.choose_role')}</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {([
              { val: 'job_seeker' as Role, icon: User,     label: 'Job Seeker',  desc: 'Find remote work' },
              { val: 'employer'  as Role, icon: Briefcase, label: 'Employer',    desc: 'Hire African talent' },
            ]).map(({ val, icon: Icon, label, desc }) => (
              <button key={val} type="button" onClick={() => setRole(val)}
                className={clsx('flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center',
                  role === val
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                <Icon size={22} className={role === val ? 'text-primary' : ''} style={{ color: role !== val ? 'var(--text-3)' : undefined }} />
                <span className={clsx('text-sm font-semibold mt-1.5', role === val ? 'text-primary' : '')}
                  style={{ color: role !== val ? 'var(--text)' : undefined }}>{label}</span>
                <span className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</span>
              </button>
            ))}
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
                className="input-field" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                {t('auth.password')}
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="Min. 8 characters"
                  required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account…' : t('auth.sign_up')}
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
            {t('auth.have_account')}{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">{t('auth.sign_in')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
