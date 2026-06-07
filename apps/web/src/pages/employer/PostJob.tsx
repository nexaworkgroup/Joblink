import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/Toast'
import { Briefcase, ArrowLeft, Zap, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

const JOB_TYPES = [
  { value: 'full_time',   label: 'Full-time' },
  { value: 'part_time',   label: 'Part-time' },
  { value: 'contract',    label: 'Contract' },
  { value: 'internship',  label: 'Internship' },
]
const EXP_LEVELS = [
  { value: 'junior',  label: 'Junior (0-2 yrs)' },
  { value: 'mid',     label: 'Mid (2-5 yrs)' },
  { value: 'senior',  label: 'Senior (5+ yrs)' },
  { value: 'any',     label: 'Any level' },
]
const SIGNALS = [
  { value: 5, label: '●●●●● Direct Hire', desc: 'Actively hiring from Africa' },
  { value: 4, label: '●●●●○ Africa-Friendly', desc: 'Open to African candidates' },
  { value: 3, label: '●●●○○ Worldwide', desc: 'Accept global applications' },
]

export default function PostJobPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { success, error: toastError } = useToast()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [improving, setImproving] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: 'Worldwide Remote',
    is_remote: true,
    job_type: 'full_time',
    experience_level: 'any',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    external_url: '',
    tags: '',
    africa_hiring_signal: 5,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleImprove = async () => {
    if (!form.title || !form.description) { toastError('Add a title and description first'); return }
    setImproving(true)
    try {
      const res = await api.post('/ai/improve-job', { title: form.title, description: form.description })
      set('description', res.data.improved)
      success('Description improved by AI ✨')
    } catch (e: any) {
      toastError(e.message || 'AI improve failed')
    }
    setImproving(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description) { toastError('Title and description are required'); return }
    setLoading(true)
    try {
      await api.post('/employer/jobs', {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        company_name: (profile as any)?.company_name || 'Your Company',
      })
      setDone(true)
      success('Job posted successfully! 🎉')
      qc.invalidateQueries({ queryKey: ['employer-jobs'] })
      qc.invalidateQueries({ queryKey: ['employer-stats'] })
    } catch (e: any) {
      toastError(e.message || 'Failed to post job')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="card text-center py-12 animate-fade-in">
          <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Job Posted! 🎉</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
            Your job is now live and will be shown to matching Remote Ready candidates.
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setDone(false); setForm({ title:'',description:'',requirements:'',location:'Worldwide Remote',is_remote:true,job_type:'full_time',experience_level:'any',salary_min:'',salary_max:'',salary_currency:'USD',external_url:'',tags:'',africa_hiring_signal:5 }) }}
              className="btn-secondary flex-1">Post Another</button>
            <button onClick={() => navigate('/employer/candidates')} className="btn-primary flex-1">View Candidates</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto mb-nav animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-5 hover:text-primary transition-colors" style={{ color: 'var(--text-2)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
          <Briefcase size={22} className="text-primary" /> Post a Job
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Free during our Cameroon beta launch</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Job Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Job Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                className="input-field" placeholder="e.g. Senior React Developer" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Description *</label>
                <button type="button" onClick={handleImprove} disabled={improving}
                  className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50">
                  <Zap size={12} /> {improving ? 'Improving…' : 'Improve with AI'}
                </button>
              </div>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                rows={6} className="input-field resize-none" required
                placeholder="Describe the role, responsibilities, and what makes your company great to work for…" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Requirements</label>
              <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
                rows={4} className="input-field resize-none"
                placeholder="List must-have skills, experience, and qualifications…" />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Job Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Job Type</label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => set('job_type', t.value)}
                    className={clsx('px-3 py-1.5 rounded-full text-sm border transition-all',
                      form.job_type === t.value ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Experience Level</label>
              <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)} className="input-field">
                {EXP_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Location</label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                className="input-field" placeholder="Worldwide Remote" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5 cursor-pointer" style={{ color: 'var(--text-1)' }}>
                <div className={clsx('relative w-9 h-5 rounded-full transition-colors', form.is_remote ? 'bg-primary' : 'bg-gray-200')}>
                  <div className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_remote ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <input type="checkbox" className="hidden" checked={form.is_remote} onChange={e => set('is_remote', e.target.checked)} />
                Remote Position
              </label>
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Min Salary</label>
              <input type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)}
                className="input-field" placeholder="50000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Max Salary</label>
              <input type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)}
                className="input-field" placeholder="80000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Currency</label>
              <select value={form.salary_currency} onChange={e => set('salary_currency', e.target.value)} className="input-field">
                {['USD','EUR','GBP','XAF'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Africa Hiring Signal */}
        <div className="card">
          <h2 className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>Africa Hiring Signal</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--text-2)' }}>
            Tell candidates how open you are to hiring from Africa. Higher signal = more applications from Remote Ready candidates.
          </p>
          <div className="space-y-2">
            {SIGNALS.map(({ value, label, desc }) => (
              <button key={value} type="button" onClick={() => set('africa_hiring_signal', value)}
                className={clsx('w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                  form.africa_hiring_signal === value ? 'border-primary bg-primary-light' : 'border-[var(--border)] hover:border-[var(--text-3)]')}>
                <div>
                  <p className={clsx('text-sm font-semibold', form.africa_hiring_signal === value ? 'text-primary' : 'text-[var(--text-1)]')}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tags & URL */}
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Additional Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Skills / Tags</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                className="input-field" placeholder="React, TypeScript, Node.js (comma-separated)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Application URL (optional)</label>
              <input value={form.external_url} onChange={e => set('external_url', e.target.value)}
                className="input-field" placeholder="https://yoursite.com/careers/apply" type="url" />
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Leave blank to use JobLink's native application flow</p>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-4 text-base shadow-hover">
          {loading
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting…</>
            : <>Post Job — Free <Briefcase size={18} /></>}
        </button>
      </form>
    </div>
  )
}
