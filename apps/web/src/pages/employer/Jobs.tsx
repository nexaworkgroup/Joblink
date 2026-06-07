import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { PlusCircle, Eye, Users, ToggleLeft, ToggleRight, Briefcase } from 'lucide-react'
import { clsx } from 'clsx'

export default function EmployerJobsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data),
  })

  const toggleJob = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/employer/jobs/${id}/toggle`, { is_active: active }),
    onSuccess: (_, { active }) => {
      success(active ? 'Job activated' : 'Job closed')
      qc.invalidateQueries({ queryKey: ['employer-jobs'] })
    },
    onError: () => toastError('Failed to update job'),
  })

  const jobs: any[] = data?.jobs || []

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto mb-nav animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>My Jobs</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{jobs.filter(j => j.is_active).length} active · {jobs.filter(j => !j.is_active).length} closed</p>
        </div>
        <Link to="/employer/post-job" className="btn-primary gap-2 text-sm">
          <PlusCircle size={16} /> Post Job
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card animate-shimmer h-24" style={{ background: 'var(--border-soft)' }} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-14">
          <Briefcase size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text-1)' }}>No jobs posted yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Post your first job for free during our beta</p>
          <Link to="/employer/post-job" className="btn-primary text-sm px-6 inline-flex gap-2">
            <PlusCircle size={15} /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="card card-hover">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold flex-shrink-0">
                  {job.title?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <button onClick={() => navigate(`/employer/jobs/${job.id}/edit`)} className="font-semibold hover:text-primary transition-colors text-left" style={{ color: 'var(--text-1)' }}>{job.title}</button>
                    <span className={clsx('badge text-xs', job.is_active ? 'badge-green' : 'badge-gray')}>
                      {job.is_active ? '🟢 Active' : '⚫ Closed'}
                    </span>
                    <span className="badge badge-gray text-xs capitalize">{job.job_type?.replace('_', ' ')}</span>
                    {job.is_remote && <span className="badge badge-blue text-xs">Remote</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: 'var(--text-2)' }}>
                    <span>{job.location}</span>
                    {(job.salary_min || job.salary_max) && (
                      <span className="font-medium text-primary">
                        {job.salary_min?.toLocaleString()}–{job.salary_max?.toLocaleString()} {job.salary_currency}
                      </span>
                    )}
                    <span>Posted {new Date(job.posted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
                  </div>
                  {job.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.tags.slice(0, 5).map((t: string) => (
                        <span key={t} className="badge badge-gray text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/employer/jobs/${job.id}/edit`)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:border-primary hover:text-primary"
                    style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
                    title="Edit job">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => navigate(`/employer/jobs/${job.id}/edit?tab=applicants`)}
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all hover:border-primary hover:text-primary"
                    style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}
                    title="View applicants">
                    <Users size={13} /> {job.application_count || 0}
                  </button>
                  <button
                    onClick={() => toggleJob.mutate({ id: job.id, active: !job.is_active })}
                    className="p-1.5 rounded-lg hover:bg-[var(--border-soft)] transition-colors"
                    style={{ color: job.is_active ? 'var(--primary)' : 'var(--text-3)' }}
                    title={job.is_active ? 'Close job' : 'Reopen job'}>
                    {job.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
