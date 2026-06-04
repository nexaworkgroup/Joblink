import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useToast } from '../components/Toast'
import { FileText, ExternalLink, ChevronDown, Check, Zap, Globe, Clock, X } from 'lucide-react'
import { clsx } from 'clsx'

const STATUSES = [
  { value: 'generated',    label: 'Generated',    color: 'badge-gray' },
  { value: 'submitted',    label: 'Submitted',    color: 'badge-blue' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'badge-blue' },
  { value: 'interview',    label: 'Interview 🎯', color: 'bg-purple-50 text-purple-700' },
  { value: 'offered',      label: 'Offered 🎉',   color: 'badge-green' },
  { value: 'rejected',     label: 'Rejected',     color: 'bg-red-50 text-red-500' },
  { value: 'withdrawn',    label: 'Withdrawn',    color: 'badge-gray' },
]

const PIPELINE = ['generated','submitted','acknowledged','interview','offered']

export default function ApplicationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['applications', filter],
    queryFn: () => api.get(`/seeker/applications?limit=50`).then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/seeker/applications/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['seeker-stats'] })
      success(`Moved to ${vars.status}`)
    },
    onError: () => toastError('Failed to update status'),
  })

  const apps: any[] = data?.applications || []
  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter)

  // Pipeline counts
  const counts = STATUSES.reduce((acc, s) => {
    acc[s.value] = apps.filter(a => a.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto mb-nav animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>My Applications</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{apps.length} total applications</p>
      </div>

      {/* Pipeline summary */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {PIPELINE.map(s => {
          const status = STATUSES.find(x => x.value === s)!
          return (
            <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
              className={clsx('card text-center py-3 cursor-pointer transition-all card-hover', filter === s && 'ring-2 ring-primary')}>
              <p className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{counts[s] || 0}</p>
              <p className={clsx('badge text-xs mt-1 mx-auto', status.color)}>{status.label}</p>
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-shimmer h-20" style={{ background: 'var(--border-soft)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <FileText size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
          <p className="font-medium" style={{ color: 'var(--text-1)' }}>
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-2)' }}>
            Browse jobs and click "Apply with AI" to generate your first application
          </p>
          <button onClick={() => navigate('/jobs')} className="btn-primary text-sm px-6">Browse Jobs</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => {
            const job = app.jobs || {}
            const status = STATUSES.find(s => s.value === app.status)!
            const isExpanded = expanded === app.id
            const daysAgo = Math.floor((Date.now() - new Date(app.created_at).getTime()) / 86400000)

            return (
              <div key={app.id} className="card transition-all">
                {/* Main row */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                    {job.company_name?.charAt(0) || 'J'}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <p className="font-semibold text-sm truncate hover:text-primary transition-colors" style={{ color: 'var(--text-1)' }}>
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs" style={{ color: 'var(--text-2)' }}>{job.company_name}</p>
                      <span className="text-xs" style={{ color: 'var(--text-3)' }}>·</span>
                      <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--text-3)' }}>
                        <Clock size={10} /> {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={clsx('badge text-xs', status.color)}>{status.label}</span>
                    <button onClick={() => setExpanded(isExpanded ? null : app.id)}
                      className="p-1 rounded-lg hover:bg-[var(--border-soft)] transition-colors" style={{ color: 'var(--text-3)' }}>
                      <ChevronDown size={15} className={clsx('transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                    {/* Status pipeline */}
                    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                      {STATUSES.slice(0, -1).map((s, i) => (
                        <button key={s.value} onClick={() => updateStatus.mutate({ id: app.id, status: s.value })}
                          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all',
                            app.status === s.value
                              ? clsx(s.color, 'border-current')
                              : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary hover:text-primary')}>
                          {app.status === s.value && <Check size={11} />}
                          {s.label}
                        </button>
                      ))}
                      <button onClick={() => updateStatus.mutate({ id: app.id, status: 'withdrawn' })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-[var(--border)] text-red-400 hover:border-red-400 whitespace-nowrap transition-all">
                        <X size={11} /> Withdraw
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/jobs/${job.id}`)}
                        className="btn-secondary text-xs px-3 py-1.5 gap-1.5">
                        <Zap size={12} /> Regenerate CV
                      </button>
                      {job.external_url && (
                        <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs px-3 py-1.5 gap-1.5 inline-flex items-center">
                          <ExternalLink size={12} /> Employer Site
                        </a>
                      )}
                      {app.status === 'generated' && (
                        <button onClick={() => updateStatus.mutate({ id: app.id, status: 'submitted' })}
                          className="btn-primary text-xs px-3 py-1.5 gap-1.5">
                          <Check size={12} /> Mark Submitted
                        </button>
                      )}
                    </div>

                    {/* Follow-up reminder */}
                    {app.status === 'submitted' && app.submitted_at && (
                      <div className="mt-3 text-xs p-2.5 rounded-lg flex items-center gap-2" style={{ background: 'var(--border-soft)' }}>
                        <Clock size={12} className="text-amber-500 flex-shrink-0" />
                        <span style={{ color: 'var(--text-2)' }}>
                          {Math.floor((Date.now() - new Date(app.submitted_at).getTime()) / 86400000)} days since submission.
                          {' '}No response after 7 days? Consider following up.
                        </span>
                      </div>
                    )}
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
