import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { Users, Search, Download, Zap, Shield, ChevronDown, Check, X, MapPin } from 'lucide-react'
import { clsx } from 'clsx'

const STATUSES = [
  { value: 'generated',    label: 'Applied',      color: 'badge-gray' },
  { value: 'submitted',    label: 'Reviewed',     color: 'badge-blue' },
  { value: 'interview',    label: 'Interview',    color: 'bg-purple-50 text-purple-700' },
  { value: 'offered',      label: 'Offered',      color: 'badge-green' },
  { value: 'rejected',     label: 'Rejected',     color: 'bg-red-50 text-red-500' },
]

export default function CandidatesPage() {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const jobFilter = searchParams.get('job') || ''

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data),
  })

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['employer-applications', jobFilter],
    queryFn: () => api.get(`/employer/applications${jobFilter ? `?job_id=${jobFilter}` : ''}`).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/employer/applications/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['employer-applications'] })
      const prev = qc.getQueryData(['employer-applications', jobFilter])
      qc.setQueryData(['employer-applications', jobFilter], (old: any) => ({
        ...old,
        applications: old?.applications?.map((a: any) => a.id === id ? { ...a, status } : a)
      }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['employer-applications', jobFilter], ctx?.prev)
      toastError('Failed to update')
    },
    onSuccess: (_, { status }) => success(`Moved to ${status}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['employer-applications'] }),
  })

  const apps: any[] = appsData?.applications || []
  const jobs: any[] = jobsData?.jobs || []

  const filtered = apps.filter(a => {
    const matchSearch = !search || a.seeker?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = apps.filter(a => a.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto mb-nav animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Candidates</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{apps.length} total applications</p>
      </div>

      {/* Pipeline counts */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {STATUSES.map(s => (
          <button key={s.value} onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
            className={clsx('card text-center py-3 cursor-pointer card-hover transition-all', filterStatus === s.value && 'ring-2 ring-primary')}>
            <p className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{counts[s.value] || 0}</p>
            <span className={clsx('badge text-xs mt-1', s.color)}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Search + job filter */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 text-sm" placeholder="Search candidates…" />
        </div>
        {jobs.length > 0 && (
          <select className="input-field text-sm w-48"
            value={jobFilter}
            onChange={e => {
              const url = new URL(window.location.href)
              if (e.target.value) url.searchParams.set('job', e.target.value)
              else url.searchParams.delete('job')
              window.history.pushState({}, '', url)
              qc.invalidateQueries({ queryKey: ['employer-applications'] })
            }}>
            <option value="">All Jobs</option>
            {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        )}
      </div>

      {/* Candidates list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-shimmer h-20" style={{ background: 'var(--border-soft)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <Users size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
          <p className="font-medium" style={{ color: 'var(--text-1)' }}>
            {apps.length === 0 ? 'No applications yet' : 'No candidates match your filters'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Applications from job seekers will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => {
            const seeker = app.seeker || {}
            const status = STATUSES.find(s => s.value === app.status) || STATUSES[0]
            const isExpanded = expanded === app.id
            const isRemoteReady = seeker.remote_ready_active

            return (
              <div key={app.id} className="card transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {seeker.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                        {seeker.full_name || 'Anonymous'}
                      </p>
                      {isRemoteReady && (
                        <span className="flex items-center gap-0.5 badge badge-green text-xs">
                          <Shield size={10} /> Remote Ready
                        </span>
                      )}
                      {app.match_score > 0 && (
                        <span className="flex items-center gap-0.5 badge bg-primary-light text-primary text-xs">
                          <Zap size={10} /> {app.match_score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
                      {seeker.location && <span className="flex items-center gap-0.5"><MapPin size={10} />{seeker.location}</span>}
                      {seeker.degree && <span>· {seeker.degree} {seeker.field_of_study}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx('badge text-xs', status.color)}>{status.label}</span>
                    <button onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1 rounded-lg hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-3)' }}>
                      <ChevronDown size={15} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                    {/* Skills */}
                    {seeker.skills?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {seeker.skills.slice(0, 10).map((s: string) => (
                            <span key={s} className="badge badge-gray text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Move pipeline */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Move to stage</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map(s => (
                          <button key={s.value} onClick={() => updateStatus.mutate({ id: app.id, status: s.value })}
                            className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                              app.status === s.value
                                ? clsx(s.color, 'border-current font-bold')
                                : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary hover:text-primary')}>
                            {app.status === s.value && <Check size={11} />}
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex gap-2 flex-wrap">
                      {seeker.linkedin_url && (
                        <a href={seeker.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs px-3 py-1.5">LinkedIn →</a>
                      )}
                      {seeker.github_url && (
                        <a href={seeker.github_url} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs px-3 py-1.5">GitHub →</a>
                      )}
                      {seeker.portfolio_url && (
                        <a href={seeker.portfolio_url} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs px-3 py-1.5">Portfolio →</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
