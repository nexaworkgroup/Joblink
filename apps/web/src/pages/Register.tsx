import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, User, Briefcase, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

type Role = 'job_seeker' | 'employer'

const ROLE_OPTIONS = [
  {
    value: 'job_seeker' as Role,
    icon: User,
    label: 'Job Seeker',
    desc: 'Find remote work globally',
    perks: ['10 free AI applications', 'Remote Ready badge', 'Curated job feed'],
  },
  {
    value: 'employer' as Role,
    icon: Briefcase,
    label: 'Employer',
    desc: 'Hire African remote talent',
    perks: ['Free job posting in beta', 'Pre-screened candidates', 'Remote Ready verified'],
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setUser, setInitialized } = useAuthStore()
  const submitting = useRef(false)
  const [role, setRole] = useState<Role>(params.get('role') === 'employer' ? 'employer' : 'job_seeker')
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
      const { data, error: authErr } = await supabase.auth.signUp({
        email, password,
        options: { data: { role } }
      })
      if (authErr) throw authErr
      if (!data.user) throw new Error('Registration failed')

      setUser({
        id: data.user.id,
        email: data.user.email || email,
        role,
        credits_balance: 10,
        lang_preference: 'en',
        plan: 'free',
      })
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
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
        queryParams: { role }
      }
    })
  }

  const selected = ROLE_OPTIONS.find(r => r.value === role)!

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A6E4A 0%, #085A3C 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #D4A017 0%, transparent 50%)' }} />
        <Link to="/" className="flex items-center gap-2 text-green-200 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Africa's talent<br />meets the world.
          </h2>
          <div className="space-y-3 mt-6">
            {selected.perks.map(perk => (
              <div key={perk} className="flex items-center gap-2.5 text-green-200 text-sm">
                <CheckCircle size={15} className="text-accent flex-shrink-0" />
                {perk}
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-300 text-sm relative z-10">Free during Cameroon Beta · No credit card required</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <Link to="/" className="lg:hidden flex items-center gap-1 text-sm mb-6 hover:text-primary" style={{ color: 'var(--text-2)' }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Create your account</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
              Already have one?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Role selector */}
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>I am a…</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {ROLE_OPTIONS.map(({ value, icon: Icon, label, desc }) => (
              <button key={value} type="button" onClick={() => setRole(value)}
                className={clsx('flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all',
                  role === value
                    ? 'border-primary bg-primary-light'
                    : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                <Icon size={20} className={role === value ? 'text-primary' : 'text-[var(--text-3)]'} />
                <p className={clsx('text-sm font-semibold mt-2', role === value ? 'text-primary' : 'text-[var(--text-1)]')}>{label}</p>
                <p className="text-xs text-[var(--text-2)] mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10" placeholder="At least 8 characters" required minLength={8} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base shadow-hover">
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
            <span className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <button onClick={handleGoogle} disabled={googleLoading}
            className="btn-secondary w-full py-2.5 gap-3 disabled:opacity-60">
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--text-3)' }}>
            By creating an account you agree to our{' '}
            <Link to="/terms" className="hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
