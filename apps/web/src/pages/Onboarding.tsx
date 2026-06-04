import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, ArrowLeft, User, Briefcase, GraduationCap, Code, MapPin } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/Toast'
import { clsx } from 'clsx'

const SKILLS_LIST = [
  'JavaScript','TypeScript','React','Vue.js','Node.js','Python','Django','FastAPI',
  'Java','Spring Boot','PHP','Laravel','Go','Rust','C++','C#','.NET',
  'SQL','PostgreSQL','MongoDB','Redis','GraphQL','REST APIs','Docker','Kubernetes',
  'AWS','GCP','Azure','Git','CI/CD','Machine Learning','Data Science','Pandas',
  'TensorFlow','PyTorch','Figma','UI/UX Design','Product Management','Marketing',
  'Sales','Finance','Accounting','Project Management','Agile','Scrum',
]

const DEGREES = ['BSc','BEng','BA','Licence','BTech','HND','BTS','MSc','MEng','MBA','PhD','Diploma']
const FIELDS = ['Computer Science','Software Engineering','Information Technology','Electrical Engineering',
  'Telecommunications','Business Administration','Finance','Marketing','Economics',
  'Data Science','Cybersecurity','Graphic Design','Mathematics','Physics','Other']
const LANGUAGES = ['English','French','Spanish','Arabic','Portuguese','Swahili','Hausa','Yoruba','Igbo']
const REMOTE_SETUPS = [
  { value: 'fibre', label: '🔌 Fibre Optic', desc: '50+ Mbps stable' },
  { value: '4g', label: '📶 4G/LTE', desc: '10-50 Mbps' },
  { value: '3g', label: '📱 3G', desc: '1-10 Mbps' },
  { value: 'satellite', label: '🛸 Satellite', desc: 'Starlink etc.' },
]
const POWER_BACKUP = [
  { value: 'generator', label: '⚡ Generator', desc: 'Petrol or diesel' },
  { value: 'solar', label: '☀️ Solar + Inverter', desc: 'Solar system' },
  { value: 'ups', label: '🔋 UPS Battery', desc: '2-8 hour backup' },
  { value: 'none', label: '🏠 Grid Only', desc: 'No backup yet' },
]

// Seeker steps
const SEEKER_STEPS = ['Personal Info', 'Education', 'Skills', 'Remote Setup', 'Done']
// Employer steps
const EMPLOYER_STEPS = ['Company Info', 'Industry', 'Done']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const { success, error: toastError } = useToast()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const isSeeker = user?.role === 'job_seeker'
  const STEPS = isSeeker ? SEEKER_STEPS : EMPLOYER_STEPS
  const totalSteps = STEPS.length - 1 // last is Done screen

  // Seeker form state
  const [seekerForm, setSeekerForm] = useState({
    full_name: '', location: 'Douala, Cameroon',
    degree: '', institution: '', field_of_study: '', graduation_year: new Date().getFullYear().toString(),
    skills: [] as string[], languages: ['English'],
    remote_setup_type: '', power_backup_type: '',
    bio: '',
  })

  // Employer form state
  const [employerForm, setEmployerForm] = useState({
    company_name: '', industry: '', company_size: '', location: 'Cameroon', website: '', description: ''
  })

  const toggleSkill = (skill: string) => {
    setSeekerForm(p => ({
      ...p,
      skills: p.skills.includes(skill) ? p.skills.filter(s => s !== skill) : [...p.skills, skill]
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = isSeeker ? seekerForm : employerForm
      const res = await api.post('/auth/complete-onboarding', { ...payload, role: user?.role })
      setProfile(res.data.profile)
      success('Profile created! Welcome to JobLink 🎉')
      setStep(STEPS.length - 1) // show Done screen
    } catch (e: any) {
      toastError(e.message || 'Failed to save profile')
    }
    setLoading(false)
  }

  const updateSeeker = (field: string, value: any) => setSeekerForm(p => ({ ...p, [field]: value }))
  const updateEmployer = (field: string, value: any) => setEmployerForm(p => ({ ...p, [field]: value }))

  // ── Done screen ───────────────────────────────────────────
  if (step === STEPS.length - 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
        <div className="card max-w-md w-full text-center py-12 animate-fade-in">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float">
            <CheckCircle size={38} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>You're all set! 🎉</h1>
          <p className="mb-6" style={{ color: 'var(--text-2)' }}>
            {isSeeker
              ? 'Your profile is ready. Start browsing curated remote jobs matched to your skills.'
              : 'Your company profile is ready. Start posting jobs and finding remote talent.'}
          </p>
          <button
            onClick={() => navigate(isSeeker ? '/dashboard' : '/employer/dashboard', { replace: true })}
            className="btn-primary w-full py-3 text-base shadow-hover">
            {isSeeker ? 'Browse Jobs' : 'Post a Job'} <ArrowRight size={18} />
          </button>
          {isSeeker && (
            <button onClick={() => navigate('/remote-ready')}
              className="btn-secondary w-full py-2.5 mt-3 text-sm">
              Get Remote Ready Badge →
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-64 p-8 border-r flex-shrink-0"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">J</div>
          <span className="font-bold gradient-text">JobLink</span>
        </div>
        <div className="space-y-1 flex-1">
          {STEPS.slice(0, -1).map((label, i) => (
            <div key={label} className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium', i === step ? 'bg-primary-light text-primary' : i < step ? 'text-primary' : 'text-[var(--text-3)]')}>
              <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white' : 'bg-[var(--border)] text-[var(--text-3)]')}>
                {i < step ? <CheckCircle size={13} /> : i + 1}
              </div>
              {label}
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Step {step + 1} of {totalSteps}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Progress bar (mobile) */}
        <div className="lg:hidden">
          <div className="h-1 bg-[var(--border)]">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center p-6 lg:p-10">
          <div className="w-full max-w-lg animate-fade-in">

            {/* ═══ SEEKER STEPS ═══════════════════════════════════ */}
            {isSeeker && (
              <>
                {/* Step 0 — Personal Info */}
                {step === 0 && (
                  <div>
                    <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                      <User size={20} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Personal Information</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This appears on your profile and AI-generated CV</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Full Name *</label>
                        <input value={seekerForm.full_name} onChange={e => updateSeeker('full_name', e.target.value)}
                          className="input-field" placeholder="Marie Kotto" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Location</label>
                        <div className="relative">
                          <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                          <input value={seekerForm.location} onChange={e => updateSeeker('location', e.target.value)}
                            className="input-field pl-9" placeholder="Douala, Cameroon" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Professional Bio</label>
                        <textarea value={seekerForm.bio} onChange={e => updateSeeker('bio', e.target.value)}
                          rows={3} className="input-field resize-none"
                          placeholder="Brief summary of your background and what you're looking for. This powers your AI job matching." />
                        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Used for AI job matching — the more detail, the better your matches</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>Languages</label>
                        <div className="flex flex-wrap gap-2">
                          {LANGUAGES.map(lang => (
                            <button key={lang} type="button"
                              onClick={() => {
                                const langs = seekerForm.languages.includes(lang)
                                  ? seekerForm.languages.filter(l => l !== lang)
                                  : [...seekerForm.languages, lang]
                                updateSeeker('languages', langs)
                              }}
                              className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                                seekerForm.languages.includes(lang)
                                  ? 'bg-primary text-white border-primary'
                                  : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1 — Education */}
                {step === 1 && (
                  <div>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                      <GraduationCap size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Education</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Our AI will translate your African credentials for Western recruiters</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Degree</label>
                          <select value={seekerForm.degree} onChange={e => updateSeeker('degree', e.target.value)} className="input-field">
                            <option value="">Select degree</option>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Year</label>
                          <input type="number" value={seekerForm.graduation_year}
                            onChange={e => updateSeeker('graduation_year', e.target.value)}
                            className="input-field" placeholder="2024" min="1990" max="2030" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Field of Study</label>
                        <select value={seekerForm.field_of_study} onChange={e => updateSeeker('field_of_study', e.target.value)} className="input-field">
                          <option value="">Select field</option>
                          {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Institution</label>
                        <input value={seekerForm.institution} onChange={e => updateSeeker('institution', e.target.value)}
                          className="input-field" placeholder="University of Buea, ESSEC Douala…" />
                      </div>
                      <div className="p-3 rounded-xl text-sm bg-accent-light border border-amber-200">
                        <p className="font-medium text-amber-800 mb-1">💡 Bilingual CV Intelligence</p>
                        <p className="text-amber-700 text-xs">Your degree will be automatically translated for Western recruiters — e.g., "Licence → BSc equivalent". No manual conversion needed.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Skills */}
                {step === 2 && (
                  <div>
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                      <Code size={20} className="text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Your Skills</h2>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-2)' }}>Select all that apply. These power your AI job matching.</p>
                    <p className="text-xs mb-5 font-medium text-primary">{seekerForm.skills.length} selected</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILLS_LIST.map(skill => (
                        <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                          className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                            seekerForm.skills.includes(skill)
                              ? 'bg-primary text-white border-primary'
                              : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary hover:text-primary')}>
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3 — Remote Setup */}
                {step === 3 && (
                  <div>
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Remote Setup</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Tell us about your working environment. Needed for the Remote Ready badge.</p>
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>Internet Connection Type</p>
                        <div className="grid grid-cols-2 gap-2">
                          {REMOTE_SETUPS.map(({ value, label, desc }) => (
                            <button key={value} type="button"
                              onClick={() => updateSeeker('remote_setup_type', value)}
                              className={clsx('p-3 rounded-xl border-2 text-left transition-all',
                                seekerForm.remote_setup_type === value ? 'border-primary bg-primary-light' : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                              <p className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{label}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-1)' }}>Power Backup</p>
                        <div className="grid grid-cols-2 gap-2">
                          {POWER_BACKUP.map(({ value, label, desc }) => (
                            <button key={value} type="button"
                              onClick={() => updateSeeker('power_backup_type', value)}
                              className={clsx('p-3 rounded-xl border-2 text-left transition-all',
                                seekerForm.power_backup_type === value ? 'border-primary bg-primary-light' : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                              <p className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{label}</p>
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--border-soft)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                          You can earn the full <strong>Remote Ready badge</strong> later by completing a speed test and uploading a video of your backup power.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ EMPLOYER STEPS ═════════════════════════════════ */}
            {!isSeeker && (
              <>
                {/* Step 0 — Company Info */}
                {step === 0 && (
                  <div>
                    <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                      <Briefcase size={20} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Company Profile</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Tell candidates about your company</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Company Name *</label>
                        <input value={employerForm.company_name} onChange={e => updateEmployer('company_name', e.target.value)}
                          className="input-field" placeholder="Acme Corp" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Industry</label>
                          <input value={employerForm.industry} onChange={e => updateEmployer('industry', e.target.value)}
                            className="input-field" placeholder="Technology" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Company Size</label>
                          <select value={employerForm.company_size} onChange={e => updateEmployer('company_size', e.target.value)} className="input-field">
                            <option value="">Select</option>
                            {['1-10','11-50','51-200','201-1000','1000+'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Website</label>
                        <input value={employerForm.website} onChange={e => updateEmployer('website', e.target.value)}
                          className="input-field" placeholder="https://yourcompany.com" type="url" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Description</label>
                        <textarea value={employerForm.description} onChange={e => updateEmployer('description', e.target.value)}
                          rows={3} className="input-field resize-none"
                          placeholder="What does your company do? What's the culture like?" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1 — Location */}
                {step === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>Location & Hiring</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Where is your company based?</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Headquarters</label>
                        <input value={employerForm.location} onChange={e => updateEmployer('location', e.target.value)}
                          className="input-field" placeholder="San Francisco, USA" />
                      </div>
                      <div className="p-4 rounded-xl bg-primary-light">
                        <p className="text-sm font-semibold text-primary mb-1">🌍 You're joining the Africa hiring movement</p>
                        <p className="text-xs text-primary/80">By posting on JobLink, you'll be connected with verified Remote Ready candidates from Cameroon and beyond. All job postings are free during our beta.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Navigation ─────────────────────────────────────── */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              {step < totalSteps - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  disabled={isSeeker && step === 0 && !seekerForm.full_name.trim()}
                  className="btn-primary flex-1 shadow-hover">
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary flex-1 py-3 shadow-hover">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                    : <>Complete Setup <ArrowRight size={16} /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
