import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'
import { User, Briefcase, Code, Globe, ChevronRight, Check } from 'lucide-react'
import { clsx } from 'clsx'

const SKILLS = [
  'JavaScript','TypeScript','React','Vue','Angular','Node.js','Python','Django',
  'Java','Kotlin','Swift','Flutter','React Native','SQL','MongoDB','PostgreSQL',
  'AWS','Docker','Kubernetes','Git','Figma','Product Management','Marketing',
  'Data Analysis','Machine Learning','Cybersecurity','Project Management',
  'Finance','Accounting','Graphic Design','Content Writing','SEO'
]

const DEGREES   = ['BSc','MSc','BA','MA','HND','BTS','PhD','Diploma']
const FIELDS    = ['Computer Science','Software Engineering','Information Technology','Electrical Engineering',
                   'Business Administration','Finance','Marketing','Accounting','Economics','Data Science',
                   'Cybersecurity','Telecommunications','Medicine','Law','Education','Agriculture','Other']
const UNIS      = ['University of Buea','University of Yaounde I','University of Douala','ENSP Yaounde',
                   'IUT Douala','University of Dschang','University of Ngaoundere','University of Bamenda','Other']
const LANGUAGES = ['English','French','Both (Bilingual)']
const REMOTE    = ['Stable home internet','Mobile data (4G/5G)','Office internet (regular)','Variable connectivity']

const STEPS = [
  { id: 'personal',   title: 'About You',          icon: User,    desc: 'Basic info to personalise your experience' },
  { id: 'education',  title: 'Education',           icon: Briefcase, desc: 'Your academic background' },
  { id: 'skills',     title: 'Skills',              icon: Code,    desc: 'What you bring to the table' },
  { id: 'remote',     title: 'Remote Setup',        icon: Globe,   desc: 'Your work environment' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setProfile, setUser } = useAuthStore()
  const { error: toastError } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', location: 'Cameroon', phone: '',
    degree: '', field: '', institution: '', grad_year: new Date().getFullYear().toString(),
    bio: '', skills: [] as string[],
    language: 'English', internet_type: '', remote_goal: '',
  })

  const update = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const toggleSkill = (s: string) => {
    setForm(p => ({
      ...p,
      skills: p.skills.includes(s) ? p.skills.filter(x => x !== s) : [...p.skills, s]
    }))
  }

  const isSeeker = user?.role === 'job_seeker'

  const handleFinish = async () => {
    setLoading(true)
    try {
      const res = await api.post('/auth/onboarding', form)
      setProfile(res.data.profile)
      if (res.data.user) setUser(res.data.user)
      navigate(isSeeker ? '/dashboard' : '/employer/dashboard', { replace: true })
    } catch (e: any) {
      toastError(e.message || 'Failed to save profile')
    }
    setLoading(false)
  }

  const canContinue = () => {
    if (step === 0) return form.full_name.trim().length >= 2
    if (step === 1) return form.degree && form.field && form.institution
    if (step === 2) return form.skills.length >= 2
    return true
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-glow">
            <span className="text-white font-bold text-xl">JL</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            Welcome to JobLink{form.full_name ? `, ${form.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Let's set up your profile — takes about 2 minutes
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className={clsx('flex-1 h-1.5 rounded-full transition-all duration-500',
              i <= step ? 'bg-primary' : 'bg-[var(--border)]')} />
          ))}
        </div>

        {/* Step label */}
        <div className="flex items-center gap-3 mb-5">
          {(() => { const Icon = STEPS[step].icon; return <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"><Icon size={16} className="text-white" /></div> })()}
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{STEPS[step].title}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{STEPS[step].desc}</p>
          </div>
          <span className="ml-auto text-xs font-medium" style={{ color: 'var(--text-3)' }}>
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="card animate-scale-in">
          {/* STEP 0 — Personal */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Full Name *
                </label>
                <input value={form.full_name} onChange={e => update('full_name', e.target.value)}
                  className="input-field" placeholder="e.g. Jean-Paul Mbah" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  City / Location
                </label>
                <input value={form.location} onChange={e => update('location', e.target.value)}
                  className="input-field" placeholder="e.g. Douala, Cameroon" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  Professional Summary
                </label>
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
                  rows={3} className="input-field resize-none"
                  placeholder="Brief description of your background and what kind of remote work you're looking for..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>Language</label>
                <div className="flex gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l} onClick={() => update('language', l)}
                      className={clsx('flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                        form.language === l ? 'bg-primary text-white border-primary' : 'border-[var(--border)] hover:border-[var(--text-3)]')}
                      style={{ color: form.language !== l ? 'var(--text-2)' : undefined }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Education */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Degree *</label>
                  <select value={form.degree} onChange={e => update('degree', e.target.value)} className="input-field">
                    <option value="">Select degree</option>
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Year</label>
                  <input type="number" value={form.grad_year} onChange={e => update('grad_year', e.target.value)}
                    className="input-field" min="2000" max="2030" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Field of Study *</label>
                <select value={form.field} onChange={e => update('field', e.target.value)} className="input-field">
                  <option value="">Select field</option>
                  {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Institution *</label>
                <select value={form.institution} onChange={e => update('institution', e.target.value)} className="input-field">
                  <option value="">Select university</option>
                  {UNIS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 — Skills */}
          {step === 2 && (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>
                Select at least 2 skills. These power your AI job matching.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {SKILLS.map(s => (
                  <button key={s} onClick={() => toggleSkill(s)}
                    className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                      form.skills.includes(s)
                        ? 'bg-primary text-white border-primary'
                        : 'border-[var(--border)] hover:border-primary')}>
                    {form.skills.includes(s) && <Check size={11} />}
                    {s}
                  </button>
                ))}
              </div>
              {form.skills.length > 0 && (
                <p className="text-xs text-primary font-medium">{form.skills.length} selected ✓</p>
              )}
            </div>
          )}

          {/* STEP 3 — Remote Setup */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                  Your Internet Connection
                </label>
                <div className="space-y-2">
                  {REMOTE.map(r => (
                    <button key={r} onClick={() => update('internet_type', r)}
                      className={clsx('w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all text-sm',
                        form.internet_type === r ? 'border-primary bg-primary/5' : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                      <div className={clsx('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                        form.internet_type === r ? 'border-primary' : 'border-[var(--border)]')}>
                        {form.internet_type === r && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>
                  What kind of remote work are you targeting?
                </label>
                <textarea value={form.remote_goal} onChange={e => update('remote_goal', e.target.value)}
                  rows={3} className="input-field resize-none"
                  placeholder="e.g. Full-time software engineering roles at US startups, open to contract work..." />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canContinue()}
                className="btn-primary flex-1">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading}
                className="btn-accent flex-1 py-3 font-semibold">
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up…
                    </span>
                  : '🚀 Start Finding Jobs'}
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-3)' }}>
          You can always complete this later from your profile.
        </p>
      </div>
    </div>
  )
}
