import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { Briefcase, Users, PlusCircle, TrendingUp, ArrowRight, Eye, CheckCircle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  generated:    'badge-gray',
  submitted:    'badge-blue',
  acknowledged: 'badge-blue',
  interview:    'bg-purple-50 text-purple-700',
  offered:      'badge-green',
  rejected:     'bg-red-50 text-red-500',
}

export default function EmployerDashboardPage() {
  const { user, profile } = useAuthStore()
  const p = profile as any
  const name = p?.company_name || user?.email?.split('@')[0] || 'there'

  const { data: statsData } = useQuery({
    queryKey: ['employer-stats'],
    queryFn: () => api.get('/employer/stats').then(r => r.data),
  })

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data),
  })

  const stats = statsData || { activeJobs: 0, totalApplications: 0, interviews: 0, offers: 0 }
  const jobs: any[] = (jobsData?.jobs || []).slice(0, 3)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in mb-nav">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            Welcome, {name} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Manage your jobs and find Remote Ready talent across Africa
          </p>
        </div>
        <Link to="/employer/post-job" className="btn-primary gap-2 text-sm px-4 py-2 shadow-hover">
          <PlusCircle size={16} /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 stagger">
        {[
          { label: 'Active Jobs',      value: stats.activeJobs,        icon: Briefcase,   color: 'text-primary bg-primary-light' },
          { label: 'Total Applicants', value: stats.totalApplications, icon: Users,       color: 'text-blue-600 bg-blue-50' },
          { label: 'Interviews',       value: stats.interviews,        icon: Clock,       color: 'text-purple-600 bg-purple-50' },
          { label: 'Offers Made',      value: stats.offers,            icon: CheckCircle, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-3 card-hover">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{value}</p>
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Jobs */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Active Job Postings</h2>
          <Link to="/employer/jobs" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-10">
            <Briefcase size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-2)' }} />
            <p className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>No jobs posted yet</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-2)' }}>Post your first job — it's free during our beta</p>
            <Link to="/employer/post-job" className="btn-primary text-sm px-5 py-2 inline-flex gap-2">
              <PlusCircle size={14} /> Post a Job
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--border-soft)' }}>
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {job.title?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{job.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                    {job.application_count || 0} applicants · {job.is_active ? '🟢 Active' : '⚫ Closed'}
                  </p>
                </div>
                <Link to={`/employer/candidates?job=${job.id}`} className="btn-secondary text-xs px-3 py-1.5 gap-1 flex-shrink-0">
                  <Eye size={12} /> View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remote Ready insight */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white mb-1">Why post on JobLink?</p>
            <p className="text-green-200 text-sm mb-3">
              Access pre-screened Remote Ready candidates from Cameroon — verified internet speed and power backup. All job postings are free during our beta launch.
            </p>
            <Link to="/employer/post-job" className="btn-accent text-sm px-5 py-2 inline-flex gap-1.5">
              Post a Job Free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
