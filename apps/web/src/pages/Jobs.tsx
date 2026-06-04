import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Search, Zap, Globe, Wifi, X, SlidersHorizontal, Briefcase } from 'lucide-react'
import { clsx } from 'clsx'

const JOB_TYPES = ['full_time','part_time','contract','internship']
const SIGNALS = [
  { value: 2, label: 'Any', desc: 'All verified jobs' },
  { value: 3, label: 'Good', desc: 'Likely Africa-friendly' },
  { value: 4, label: 'Strong', desc: 'Africa-friendly confirmed' },
  { value: 5, label: 'Direct', desc: 'Actively hiring from Africa' },
]

function SignalBadge({ score }: { score: number }) {
  const colors = ['','','bg-yellow-50 text-yellow-700','bg-orange-50 text-orange-700','bg-green-50 text-green-700','bg-primary-light text-primary']
  const labels = ['','','Fair','Good','Strong','Direct Hire']
  return (
    <span className={clsx('badge text-xs', colors[score] || 'badge-gray')}>
      {'●'.repeat(score)}{'○'.repeat(5-score)} {labels[score]}
    </span>
  )
}

function JobCardSkeleton() {
  return (
    <div className="card animate-shimmer h-48" style={{ background: 'var(--border-soft)' }} />
  )
}

function JobCard({ job, onApplyAI }: { job: any; onApplyAI: (job: any) => void }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="card card-hover cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
      <div className="flex items-start gap-3 mb-3">
        {job.company_logo_url ? (
          <img src={job.company_logo_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
            {job.company_name?.charAt(0)?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text-1)' }}>{job.title}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{job.company_name}</p>
        </div>
        {job.match_score > 0 && (
          <div className="flex items-center gap-0.5 bg-primary-light text-primary text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
            <Zap size={10} />{job.match_score}%
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.is_remote && <span className="badge badge-green text-xs"><Wifi size={10} /> Remote</span>}
        {job.job_type && <span className="badge badge-gray text-xs capitalize">{job.job_type.replace('_',' ')}</span>}
        {job.location && <span className="badge badge-gray text-xs">{job.location}</span>}
      </div>

      <div className="flex items-center justify-between mb-3">
        <SignalBadge score={job.africa_hiring_signal} />
        {(job.salary_min || job.salary_max) && (
          <span className="text-xs font-semibold text-primary">
            ${job.salary_min?.toLocaleString()}–${job.salary_max?.toLocaleString()}/yr
          </span>
        )}
      </div>

      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => user ? onApplyAI(job) : navigate('/register')}
          className="btn-primary flex-1 py-2 text-sm gap-1.5">
          <Zap size={14} /> Apply with AI
        </button>
        <button onClick={() => navigate(`/jobs/${job.id}`)}
          className="btn-secondary px-3 py-2 text-sm">
          View
        </button>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)

  const q        = params.get('q') || ''
  const jobType  = params.get('type') || ''
  const signal   = parseInt(params.get('signal') || '2')
  const page     = parseInt(params.get('page') || '1')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', q, jobType, signal, page],
    queryFn: () => api.get('/jobs', { params: { q, type: jobType, min_signal: signal, page } }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const handleApplyAI = (job: any) => {
    navigate(`/jobs/${job.id}?apply=1`)
  }

  const jobs  = data?.jobs  || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)
  const hasFilters = !!q || !!jobType || signal > 2

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto mb-nav">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Remote Jobs</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
          {total > 0 ? `${total.toLocaleString()} verified opportunities` : 'Curated for African professionals'}
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={q}
            onChange={e => setParam('q', e.target.value)}
            placeholder="Search jobs, companies, skills…"
            className="input-field pl-9 text-sm"
          />
          {q && (
            <button onClick={() => setParam('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }}>
              <X size={15} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn-secondary px-3 gap-1.5 text-sm flex-shrink-0', showFilters && 'border-primary text-primary')}>
          <SlidersHorizontal size={16} />
          <span className="hidden sm:block">Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-4 animate-slide-up">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>Job Type</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setParam('type', '')}
                  className={clsx('px-3 py-1.5 rounded-full text-sm border transition-all', !jobType ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                  All
                </button>
                {JOB_TYPES.map(t => (
                  <button key={t} onClick={() => setParam('type', t)}
                    className={clsx('px-3 py-1.5 rounded-full text-sm border capitalize transition-all', jobType === t ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                    {t.replace('_',' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>
                Africa Hiring Signal
                <span className="ml-1 normal-case font-normal" style={{ color: 'var(--text-3)' }}>— how likely to hire from Africa</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SIGNALS.map(({ value, label }) => (
                  <button key={value} onClick={() => setParam('signal', String(value))}
                    className={clsx('px-3 py-1.5 rounded-full text-sm border transition-all', signal === value ? 'bg-primary text-white border-primary' : 'border-[var(--border)] text-[var(--text-2)] hover:border-primary')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasFilters && (
            <button onClick={() => { setParams(new URLSearchParams()); setShowFilters(false) }}
              className="mt-3 text-xs text-red-500 hover:underline flex items-center gap-1">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Africa Hiring Signal explanation */}
      <div className="flex items-start gap-2 p-3 rounded-xl mb-5 text-xs" style={{ background: 'var(--border-soft)' }}>
        <Globe size={14} className="text-primary flex-shrink-0 mt-0.5" />
        <p style={{ color: 'var(--text-2)' }}>
          <strong style={{ color: 'var(--text-1)' }}>Africa Hiring Signal</strong> — every job is scored 1-5 on how likely the employer is to hire from Africa.
          {' '}<strong style={{ color: 'var(--primary)' }}>Direct Hire (●●●●●)</strong> means they're actively recruiting from Africa.
        </p>
      </div>

      {/* Job grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-14">
          <Briefcase size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
          <p className="font-medium" style={{ color: 'var(--text-1)' }}>No jobs found</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-2)' }}>Try adjusting your filters or search terms</p>
          <button onClick={() => setParams(new URLSearchParams())} className="btn-secondary text-sm px-5">Clear filters</button>
        </div>
      ) : (
        <>
          <div className={clsx('grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger', isFetching && 'opacity-70 transition-opacity')}>
            {jobs.map((job: any) => (
              <JobCard key={job.id} job={job} onApplyAI={handleApplyAI} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
              <span className="text-sm" style={{ color: 'var(--text-2)' }}>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}
                className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
