import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import {
  Briefcase, Users, PlusCircle, TrendingUp, ArrowRight,
  CheckCircle, Clock, Shield, Eye, ToggleRight, ToggleLeft
} from 'lucide-react'
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
  const qc = useQueryClient()
  const p = profile as any
  const name = p?.company_name || user?.email?.split('@')[0] || 'there'

  const { data: statsData } = useQuery({
    queryKey: ['employer-stats'],
    queryFn: () => api.get('/employer/stats').then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['employer-jobs'],
    queryFn: () => api.get('/employer/jobs').then(r => r.data),
    refetchOnMount: true,
  })

  const { data: appsData } = useQuery({
    queryKey: ['employer-recent-apps'],
    queryFn: () => api.get('/employer/applications').then(r => r.data),
  })

  const stats = statsData || { activeJobs: 0, totalApplications: 0, interviews: 0, offers: 0 }
  const jobs: any[]  = jobsData?.jobs || []
  const recentApps: any[] = (appsData?.applications || []).slice(0, 5)
  const activeJobs   = jobs.filter(j => j.is_active)
  const recentJobs   = jobs.slice(0, 3)

  const toggleJob = async (id: string, active: boolean) => {
    await api.put(`/employer/jobs/${id}/toggle`, { is_active: active })
    qc.invalidateQueries({ queryKey: ['employer-jobs'] })
    qc.invalidateQueries({ queryKey: ['employer-stats'] })
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in mb-nav">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            Welcome, {name} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''} · Manage your hiring pipeline
          </p>
        </div>
        <Link to="/employer/post-job" className="btn-primary gap-2 text-sm flex-shrink-0 shadow-hover">
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

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Job listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>
                Your Job Postings {jobs.length > 0 && <span className="text-xs font-normal text-[var(--text-3)] ml-1">({jobs.length})</span>}
              </h2>
              <Link to="/employer/jobs" className="text-xs text-primary hover:underline">View all →</Link>
            </div>

            {jobsLoading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-16 rounded-xl animate-shimmer" style={{ background: 'var(--border-soft)' }} />)}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Briefcase size={24} className="text-primary" />
                </div>
                <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-1)' }}>No jobs posted yet</p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-2)' }}>Post your first job — it's free during our beta</p>
                <Link to="/employer/post-job" className="btn-primary text-sm px-5 py-2 inline-flex gap-2">
                  <PlusCircle size={14} /> Post a Job
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--border-soft)]"
                    style={{ border: '1px solid var(--border)' }}>
                    <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {job.title?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{job.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
                        <span className={clsx('flex items-center gap-0.5', job.is_active ? 'text-green-600' : 'text-[var(--text-3)]')}>
                          {job.is_active ? '🟢' : '⚫'} {job.is_active ? 'Active' : 'Closed'}
                        </span>
                        <span>·</span>
                        <span>{job.application_count || 0} applicants</span>
                        <span>·</span>
                        <span className="capitalize">{job.job_type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Link to={`/employer/candidates?job=${job.id}`}
                        className="p-1.5 rounded-lg hover:bg-[var(--border-soft)] transition-colors" style={{ color: 'var(--text-3)' }}>
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => toggleJob(job.id, !job.is_active)}
                        className="p-1" style={{ color: job.is_active ? 'var(--primary)' : 'var(--text-3)' }}>
                        {job.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </div>
                  </div>
                ))}
                {jobs.length > 3 && (
                  <Link to="/employer/jobs" className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline py-2">
                    View {jobs.length - 3} more jobs <ArrowRight size={12} />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Recent applicants */}
          {recentApps.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Recent Applicants</h2>
                <Link to="/employer/candidates" className="text-xs text-primary hover:underline">View all →</Link>
              </div>
              <div className="space-y-2.5">
                {recentApps.map((app: any) => {
                  const seeker = app.seeker || {}
                  return (
                    <div key={app.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--border-soft)' }}>
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {seeker.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                            {seeker.full_name || 'Applicant'}
                          </p>
                          {seeker.remote_ready_active && (
                            <span className="badge badge-green text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                              <Shield size={9} /> RR
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--text-2)' }}>
                          {app.jobs?.title || 'Job application'}
                        </p>
                      </div>
                      <span className={clsx('badge text-xs flex-shrink-0', STATUS_COLORS[app.status] || 'badge-gray')}>
                        {app.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="card">
            <h2 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-1)' }}>Quick Actions</h2>
            <div className="space-y-2">
              {[
                { to: '/employer/post-job',   icon: PlusCircle, label: 'Post a New Job', color: 'text-primary' },
                { to: '/employer/candidates', icon: Users,      label: 'View Candidates', color: 'text-blue-600' },
                { to: '/employer/jobs',       icon: Briefcase,  label: 'Manage Jobs',    color: 'text-purple-600' },
                { to: '/employer/profile',    icon: TrendingUp, label: 'Edit Profile',   color: 'text-amber-600' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--border-soft)] transition-colors group">
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', color, 'bg-opacity-10')}>
                    <Icon size={15} className={color} />
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors" style={{ color: 'var(--text-1)' }}>
                    {label}
                  </span>
                  <ArrowRight size={13} className="ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Remote Ready pitch */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-accent" />
              <h3 className="font-bold text-white text-sm">Remote Ready Talent</h3>
            </div>
            <p className="text-green-200 text-xs mb-3 leading-relaxed">
              Our Remote Ready badge verifies candidates' internet speed and power backup — removing your #1 concern about African remote hires.
            </p>
            <Link to="/employer/candidates" className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-white transition-colors">
              Browse verified candidates <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
