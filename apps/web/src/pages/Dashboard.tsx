import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { Zap, Shield, FileText, Briefcase, ArrowRight, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

function StatCard({ value, label, color = 'text-primary' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="card text-center py-4 card-hover">
      <p className={clsx('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{label}</p>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  generated:    'badge-gray',
  submitted:    'badge-blue',
  acknowledged: 'badge-blue',
  interview:    'bg-purple-50 text-purple-600',
  offered:      'badge-green',
  rejected:     'bg-red-50 text-red-500',
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const p = profile as any
  const name = p?.full_name?.split(' ')[0] || 'there'

  const { data: statsData } = useQuery({
    queryKey: ['seeker-stats'],
    queryFn: () => api.get('/seeker/stats').then(r => r.data),
  })

  const { data: recentData } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: () => api.get('/seeker/applications?limit=3').then(r => r.data),
  })

  const { data: remoteData } = useQuery({
    queryKey: ['remote-ready-status'],
    queryFn: () => api.get('/remote-ready/status').then(r => r.data),
  })

  const stats = statsData || { total: 0, submitted: 0, interviews: 0, credits: user?.credits_balance || 10 }
  const recentApps = recentData?.applications || []
  const badge = remoteData?.badge || null
  const isRemoteReady = badge?.badge_active

  // Profile completeness
  const profileItems = [
    { label: 'Full name', done: !!p?.full_name },
    { label: 'Skills (3+)', done: (p?.skills?.length || 0) >= 3 },
    { label: 'Education', done: !!p?.degree && !!p?.institution },
    { label: 'Bio written', done: !!p?.bio },
    { label: 'Remote setup', done: !!p?.remote_setup_type },
  ]
  const completeness = Math.round((profileItems.filter(i => i.done).length / profileItems.length) * 100)

  const QUICK_ACTIONS = [
    { icon: Briefcase, label: 'Browse Jobs', desc: 'See AI-matched remote roles', to: '/jobs', color: 'bg-primary-light text-primary' },
    { icon: Shield,    label: 'Get Remote Ready', desc: isRemoteReady ? '✓ Badge earned!' : 'Earn your trust badge', to: '/remote-ready', color: isRemoteReady ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600' },
    { icon: FileText,  label: 'My Applications', desc: `${stats.total} applications`, to: '/applications', color: 'bg-purple-50 text-purple-600' },
    { icon: Zap,       label: 'Credits', desc: `${user?.credits_balance || 10} remaining (free)`, to: '/credits', color: 'bg-accent-light text-amber-700' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in mb-nav">
      {/* Greeting */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            Hey {name} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            {isRemoteReady
              ? 'Your Remote Ready badge is active — you\'re visible to global employers.'
              : 'Complete your Remote Ready badge to get 3× more responses.'}
          </p>
        </div>
        {isRemoteReady && (
          <span className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0">
            <Shield size={13} /> Remote Ready
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 stagger">
        <StatCard value={stats.total}      label="Applications"  />
        <StatCard value={stats.submitted}  label="Submitted"     color="text-blue-600" />
        <StatCard value={stats.interviews} label="Interviews"    color="text-purple-600" />
        <StatCard value={user?.credits_balance ?? 10} label="Credits left" color="text-accent" />
      </div>

      {/* Profile completeness — only show if < 80% */}
      {completeness < 80 && (
        <div className="card mb-5 border-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Profile Strength — {completeness}%</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>A complete profile gets better AI job matches</p>
            </div>
            <Link to="/profile" className="text-xs text-primary font-semibold hover:underline">Complete →</Link>
          </div>
          <div className="h-2 rounded-full mb-3" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${completeness}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {profileItems.map(item => (
              <span key={item.label} className={clsx('flex items-center gap-1 text-xs px-2 py-1 rounded-full', item.done ? 'badge-green' : 'badge-gray')}>
                {item.done ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {QUICK_ACTIONS.map(({ icon: Icon, label, desc, to, color }) => (
          <Link key={to} to={to} className="card card-hover flex flex-col gap-2 cursor-pointer p-4">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent applications */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Recent Applications</h2>
          <Link to="/applications" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-2)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No applications yet</p>
            <Link to="/jobs" className="btn-primary mt-3 text-sm px-5 py-2 inline-flex">
              Browse Jobs <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentApps.map((app: any) => (
              <div key={app.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--border-soft)' }}>
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">
                  {app.jobs?.company_name?.charAt(0) || 'J'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{app.jobs?.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>{app.jobs?.company_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={clsx('badge text-xs capitalize', STATUS_COLORS[app.status] || 'badge-gray')}>
                    {app.status}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {new Date(app.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remote Ready CTA */}
      {!isRemoteReady && (
        <div className="card p-5" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white mb-1">Get 3× more responses with Remote Ready</p>
              <p className="text-green-200 text-sm mb-3">Verify your internet speed and power backup. Takes under 10 minutes.</p>
              <Link to="/remote-ready" className="btn-accent text-sm px-5 py-2 inline-flex">
                Start Verification <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
