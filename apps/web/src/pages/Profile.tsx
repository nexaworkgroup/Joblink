import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { useQueryClient } from '@tanstack/react-query'
import { User, Save, Link, Code, MapPin, GraduationCap } from 'lucide-react'
import { clsx } from 'clsx'

const SKILLS_LIST = [
  'JavaScript','TypeScript','React','Vue.js','Node.js','Python','Django','FastAPI',
  'Java','Spring Boot','PHP','Laravel','Go','Rust','C++','C#','.NET',
  'SQL','PostgreSQL','MongoDB','Redis','GraphQL','REST APIs','Docker','Kubernetes',
  'AWS','GCP','Azure','Git','CI/CD','Machine Learning','Data Science',
  'TensorFlow','PyTorch','Figma','UI/UX Design','Product Management','Marketing',
  'Sales','Finance','Accounting','Project Management','Agile','Scrum',
]

export default function ProfilePage() {
  const { profile, setProfile, user } = useAuthStore()
  const { success, error: toastError } = useToast()
  const qc = useQueryClient()
  const p = profile as any
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', location: '', degree: '', institution: '',
    field_of_study: '', graduation_year: '', bio: '',
    skills: [] as string[], languages: ['English'],
    linkedin_url: '', github_url: '', portfolio_url: '',
    is_open_to_work: true,
  })

  useEffect(() => {
    if (p) setForm({
      full_name:      p.full_name || '',
      location:       p.location || '',
      degree:         p.degree || '',
      institution:    p.institution || '',
      field_of_study: p.field_of_study || '',
      graduation_year:String(p.graduation_year || ''),
      bio:            p.bio || '',
      skills:         p.skills || [],
      languages:      p.languages || ['English'],
      linkedin_url:   p.linkedin_url || '',
      github_url:     p.github_url || '',
      portfolio_url:  p.portfolio_url || '',
      is_open_to_work: p.is_open_to_work !== false,
    })
  }, [profile])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleSkill = (s: string) => set('skills', form.skills.includes(s) ? form.skills.filter(x=>x!==s) : [...form.skills, s])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await api.put('/seeker/profile', { ...form, graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null })
      setProfile(res.data.profile)
      qc.invalidateQueries({ queryKey: ['seeker-stats'] })
      success('Profile saved!')
    } catch (e: any) {
      toastError(e.message || 'Failed to save')
    }
    setLoading(false)
  }

  const completeness = [
    !!form.full_name, !!form.location, !!form.degree && !!form.institution,
    !!form.bio, form.skills.length >= 3
  ].filter(Boolean).length * 20

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto mb-nav animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>My Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Profile strength: {completeness}%</p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <><Save size={16} />Save</>}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full mb-6" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${completeness}%` }} />
      </div>

      <div className="space-y-5">
        {/* Personal info */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <User size={16} className="text-primary" /> Personal Info
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Full Name</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="input-field" placeholder="Marie Kotto" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input value={form.location} onChange={e => set('location', e.target.value)} className="input-field pl-9" placeholder="Douala, Cameroon" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Professional Bio</label>
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                rows={4} className="input-field resize-none"
                placeholder="Describe your background and what kind of roles you're looking for. This powers your AI job matching." />
            </div>
            {/* Open to work toggle */}
            <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--border-soft)] transition-colors border" style={{ borderColor: 'var(--border)' }}>
              <div className={clsx('relative w-11 h-6 rounded-full transition-colors', form.is_open_to_work ? 'bg-primary' : 'bg-gray-200')}>
                <div className={clsx('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', form.is_open_to_work ? 'translate-x-5' : 'translate-x-0.5')} />
              </div>
              <input type="checkbox" className="hidden" checked={form.is_open_to_work} onChange={e => set('is_open_to_work', e.target.checked)} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Open to Work</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>Let employers know you're actively looking</p>
              </div>
              {form.is_open_to_work && <span className="ml-auto badge badge-green text-xs">🟢 Active</span>}
            </label>
          </div>
        </div>

        {/* Education */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <GraduationCap size={16} className="text-primary" /> Education
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Degree</label>
              <input value={form.degree} onChange={e => set('degree', e.target.value)} className="input-field" placeholder="BSc / Licence" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Year</label>
              <input type="number" value={form.graduation_year} onChange={e => set('graduation_year', e.target.value)} className="input-field" placeholder="2024" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Institution</label>
              <input value={form.institution} onChange={e => set('institution', e.target.value)} className="input-field" placeholder="University of Buea" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Field of Study</label>
              <input value={form.field_of_study} onChange={e => set('field_of_study', e.target.value)} className="input-field" placeholder="Computer Science" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <h2 className="font-semibold mb-1 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Code size={16} className="text-primary" /> Skills
          </h2>
          <p className="text-xs mb-4 text-primary font-medium">{form.skills.length} selected</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS_LIST.map(skill => (
              <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                className={clsx('px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                  form.skills.includes(skill)
                    ? 'bg-primary text-white border-primary'
                    : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary hover:text-primary')}>
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Link size={16} className="text-primary" /> Professional Links
          </h2>
          <div className="space-y-3">
            {[
              { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
              { key: 'github_url',   label: 'GitHub',   placeholder: 'https://github.com/yourname' },
              { key: 'portfolio_url',label: 'Portfolio',placeholder: 'https://yourwebsite.com' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>{label}</label>
                <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                  className="input-field" placeholder={placeholder} type="url" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-3 shadow-hover">
          {loading ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
