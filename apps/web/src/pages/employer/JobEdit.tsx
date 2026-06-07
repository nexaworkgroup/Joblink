import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import {
  ArrowLeft, Save, Trash2, ToggleLeft, ToggleRight, Users,
  Briefcase, AlertTriangle, CheckCircle, Pencil, Eye
} from 'lucide-react'
import { clsx } from 'clsx'

const JOB_TYPES = ['full_time','part_time','contract','internship']
const EXP_LEVELS = ['junior','mid','senior','any']
const SIGNALS = [
  { value: 5, label: '●●●●● Direct Hire', desc: 'Actively hiring from Africa' },
  { value: 4, label: '●●●●○ Africa-Friendly', desc: 'Open to African candidates' },
  { value: 3, label: '●●●○○ Worldwide', desc: 'Accept global applications' },
]
const STATUS_COLORS: Record<string,string> = {
  generated:'badge-gray', submitted:'badge-blue', acknowledged:'badge-blue',
  interview:'bg-purple-50 text-purple-700', offered:'badge-green',
  rejected:'bg-red-50 text-red-500', withdrawn:'badge-gray',
}

export default function JobEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [tab, setTab] = useState<'edit'|'applicants'>('edit')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job-detail', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  })

  const { data: appsData } = useQuery({
    queryKey: ['job-applicants', id],
    queryFn: () => api.get(`/employer/applications?job_id=${id}`).then(r => r.data),
    enabled: tab === 'applicants',
  })

  const [form, setForm] = useState({
    title: '', description: '', requirements: '', location: '',
    is_remote: true, job_type: 'full_time', experience_level: 'any',
    salary_min: '', salary_max: '', salary_currency: 'USD',
    tags: '', africa_hiring_signal: 5, external_url: '', is_active: true,
  })

  useEffect(() => {
    if (data?.job) {
      const j = data.job
      setForm({
        title: j.title || '',
        description: j.description || '',
        requirements: j.requirements || '',
        location: j.location || '',
        is_remote: j.is_remote !== false,
        job_type: j.job_type || 'full_time',
        experience_level: j.experience_level || 'any',
        salary_min: j.salary_min?.toString() || '',
        salary_max: j.salary_max?.toString() || '',
        salary_currency: j.salary_currency || 'USD',
        tags: (j.tags || []).join(', '),
        africa_hiring_signal: j.africa_hiring_signal || 3,
        external_url: j.external_url || '',
        is_active: j.is_active !== false,
      })
    }
  }, [data])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/employer/jobs/${id}`, {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      qc.invalidateQueries({ queryKey: ['employer-jobs'] })
      qc.invalidateQueries({ queryKey: ['job-detail', id] })
      success('Job updated successfully!')
    } catch (e: any) {
      toastError(e.message || 'Failed to save')
    }
    setSaving(false)
  }

  const handleToggleActive = async () => {
    const newActive = !form.is_active
    try {
      await api.put(`/employer/jobs/${id}/toggle`, { is_active: newActive })
      set('is_active', newActive)
      qc.invalidateQueries({ queryKey: ['employer-jobs'] })
      success(newActive ? 'Job is now active' : 'Job closed')
    } catch (e: any) {
      toastError('Failed to update status')
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/employer/jobs/${id}`)
      qc.invalidateQueries({ queryKey: ['employer-jobs'] })
      success('Job deleted')
      navigate('/employer/jobs')
    } catch (e: any) {
      toastError(e.message || 'Failed to delete')
    }
  }

  const updateAppStatus = async (appId: string, status: string) => {
    await api.put(`/employer/applications/${appId}/status`, { status })
    qc.invalidateQueries({ queryKey: ['job-applicants', id] })
    success(`Moved to ${status}`)
  }

  const apps: any[] = appsData?.applications || []

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-primary animate-spin" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto mb-nav animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <button onClick={() => navigate('/employer/jobs')}
            className="flex items-center gap-1.5 text-sm mb-2 hover:text-primary transition-colors" style={{ color: 'var(--text-2)' }}>
            <ArrowLeft size={16} /> My Jobs
          </button>
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-1)' }}>{data?.job?.title}</h1>
        </div>
        {/* Status badge + quick toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={clsx('badge text-sm px-3 py-1.5', form.is_active ? 'badge-green' : 'badge-gray')}>
            {form.is_active ? '🟢 Active' : '⚫ Closed'}
          </span>
          <button onClick={handleToggleActive}
            className="p-2 rounded-xl hover:bg-[var(--border-soft)] transition-colors"
            style={{ color: form.is_active ? 'var(--primary)' : 'var(--text-3)' }}
            title={form.is_active ? 'Close job' : 'Reopen job'}>
            {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'var(--border-soft)' }}>
        {[
          { key: 'edit' as const, icon: Edit3, label: 'Edit Job' },
          { key: 'applicants' as const, icon: Users, label: `Applicants (${apps.length || data?.job?.application_count || 0})` },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={clsx('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-[var(--surface)] shadow-card text-primary' : 'text-[var(--text-2)] hover:text-[var(--text-1)]')}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── EDIT TAB ─────────────────────────────── */}
      {tab === 'edit' && (
        <div className="space-y-5">
          {/* Basic info */}
          <div className="card">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Job Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Job Title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={6} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Requirements</label>
                <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
                  rows={4} className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => set('job_type', t)}
                      className={clsx('px-3 py-1.5 rounded-full text-sm border capitalize transition-all',
                        form.job_type === t ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                      {t.replace('_',' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Experience Level</label>
                <select value={form.experience_level} onChange={e => set('experience_level', e.target.value)} className="input-field">
                  {EXP_LEVELS.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Location</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} className="input-field" />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className={clsx('relative w-10 h-5 rounded-full cursor-pointer transition-colors', form.is_remote ? 'bg-primary' : 'bg-gray-200')}>
                  <div className={clsx('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_remote ? 'translate-x-5' : 'translate-x-0.5')} />
                  <input type="checkbox" className="hidden" checked={form.is_remote} onChange={e => set('is_remote', e.target.checked)} />
                </label>
                <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Remote Position</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Min Salary</label>
                <input type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)} className="input-field" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Max Salary</label>
                <input type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)} className="input-field" placeholder="80000" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Skills / Tags</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} className="input-field" placeholder="React, TypeScript, Node.js" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>External URL (optional)</label>
                <input value={form.external_url} onChange={e => set('external_url', e.target.value)} className="input-field" placeholder="https://yoursite.com/apply" type="url" />
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Leave blank to accept applications directly through JobLink</p>
              </div>
            </div>
          </div>

          {/* Africa signal */}
          <div className="card">
            <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Africa Hiring Signal</h2>
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

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-3 gap-2 shadow-hover">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <><Save size={16} />Save Changes</>}
            </button>
            <button onClick={handleToggleActive}
              className={clsx('btn-secondary px-5 gap-2', form.is_active ? 'text-amber-600 border-amber-400' : 'text-green-600 border-green-400')}>
              {form.is_active ? <><ToggleLeft size={16} />Close Job</> : <><ToggleRight size={16} />Reopen</>}
            </button>
          </div>

          {/* Delete zone */}
          <div className="card border-red-200 mt-4" style={{ borderColor: '#fecaca' }}>
            <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Danger Zone
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>Permanently delete this job. All applications will also be removed. This cannot be undone.</p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors">
                <Trash2 size={14} /> Delete this job
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                  Yes, delete permanently
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPLICANTS TAB ───────────────────────── */}
      {tab === 'applicants' && (
        <div className="space-y-3">
          {apps.length === 0 ? (
            <div className="card text-center py-14">
              <Users size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
              <p className="font-medium" style={{ color: 'var(--text-1)' }}>No applications yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Applications will appear here once job seekers apply</p>
            </div>
          ) : apps.map((app: any) => {
            const seeker = app.seeker || {}
            return (
              <div key={app.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                    {seeker.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{seeker.full_name || 'Applicant'}</p>
                      {seeker.remote_ready_active && <span className="badge badge-green text-xs">🛡️ Remote Ready</span>}
                    </div>
                    {seeker.degree && <p className="text-xs" style={{ color: 'var(--text-2)' }}>{seeker.degree} · {seeker.field_of_study} — {seeker.institution}</p>}
                    {seeker.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {seeker.skills.slice(0,6).map((s: string) => <span key={s} className="badge badge-gray text-xs">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <select value={app.status} onChange={e => updateAppStatus(app.id, e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 border font-medium cursor-pointer outline-none"
                      style={{ background: 'var(--surface)', color: 'var(--text-1)', borderColor: 'var(--border)' }}>
                      {['submitted','acknowledged','interview','offered','rejected'].map(s => (
                        <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t flex-wrap" style={{ borderColor: 'var(--border)' }}>
                  {seeker.linkedin_url && <a href={seeker.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">LinkedIn →</a>}
                  {seeker.github_url && <a href={seeker.github_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">GitHub →</a>}
                  {seeker.portfolio_url && <a href={seeker.portfolio_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-3 py-1.5">Portfolio →</a>}
                  <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-3)' }}>
                    Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
