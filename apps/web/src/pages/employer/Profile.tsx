import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { Building2, Globe, Users, MapPin, FileText, Save, Link, Briefcase } from 'lucide-react'
import { clsx } from 'clsx'

const INDUSTRIES = [
  'Technology', 'Fintech', 'Healthcare', 'Education', 'E-commerce',
  'Telecommunications', 'Media & Entertainment', 'Finance & Banking',
  'Logistics & Supply Chain', 'Agriculture', 'Energy', 'Consulting',
  'NGO / Non-profit', 'Government', 'Other',
]
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

export default function EmployerProfilePage() {
  const { profile, setProfile, user } = useAuthStore()
  const { success, error: toastError } = useToast()
  const [loading, setLoading] = useState(false)
  const p = profile as any

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    company_size: '',
    location: '',
    website: '',
    description: '',
  })

  useEffect(() => {
    if (p) setForm({
      company_name: p.company_name || '',
      industry:     p.industry     || '',
      company_size: p.company_size || '',
      location:     p.location     || '',
      website:      p.website      || '',
      description:  p.description  || '',
    })
  }, [profile])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.company_name.trim()) { toastError('Company name is required'); return }
    setLoading(true)
    try {
      const res = await api.put('/employer/profile', form)
      setProfile(res.data.profile)
      success('Company profile saved!')
    } catch (e: any) {
      toastError(e.message || 'Failed to save')
    }
    setLoading(false)
  }

  // Profile completeness
  const fields = [form.company_name, form.industry, form.company_size, form.location, form.website, form.description]
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto mb-nav animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Company Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Profile strength: {completeness}% · Visible to job seekers
          </p>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary gap-2">
          {loading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
            : <><Save size={16} />Save</>}
        </button>
      </div>

      {/* Completeness bar */}
      <div className="h-1.5 rounded-full mb-6" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${completeness}%` }} />
      </div>

      <div className="space-y-5">

        {/* Company identity */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <Building2 size={16} className="text-primary" /> Company Identity
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Company Name *</label>
              <input value={form.company_name} onChange={e => set('company_name', e.target.value)}
                className="input-field" placeholder="Acme Corp" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Industry</label>
                <select value={form.industry} onChange={e => set('industry', e.target.value)} className="input-field">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Company Size</label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => set('company_size', s)}
                      className={clsx('px-3 py-1.5 rounded-full text-sm border transition-all',
                        form.company_size === s
                          ? 'bg-primary text-white border-primary'
                          : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Headquarters Location</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input value={form.location} onChange={e => set('location', e.target.value)}
                  className="input-field pl-9" placeholder="San Francisco, USA" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  className="input-field pl-9" placeholder="https://yourcompany.com" type="url" />
              </div>
            </div>
          </div>
        </div>

        {/* About company */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <FileText size={16} className="text-primary" /> About Your Company
          </h2>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={5} className="input-field resize-none"
            placeholder="Tell candidates who you are, what you build, your culture and mission. This appears on all your job postings.&#10;&#10;Example: We're a fast-growing fintech startup building financial infrastructure for Africa. We're remote-first with a distributed team across 12 countries..." />
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            {form.description.length}/1000 characters · A strong description increases applications by 40%
          </p>
        </div>

        {/* Hiring info card */}
        <div className="card" style={{ background: 'var(--border-soft)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase size={17} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>
                Account: {user?.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                Your company profile is shown to job seekers who view your job postings. A complete profile with a description gets significantly more applications from Remote Ready candidates.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full py-3 shadow-hover">
          {loading ? 'Saving…' : 'Save Company Profile'}
        </button>
      </div>
    </div>
  )
}
