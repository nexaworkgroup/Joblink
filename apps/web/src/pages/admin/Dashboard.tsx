import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../../components/Toast'
import { Shield, BarChart2, Briefcase, Users, Globe, Zap, RefreshCw, Play, Eye, EyeOff, CheckCircle, AlertTriangle, Clock, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'joblink2026admin'

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.get('/admin/stats', { headers: { 'x-admin-secret': value } })
      sessionStorage.setItem('jl_admin', value)
      onAuth()
    } catch {
      setError('Invalid admin secret')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D1117' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the admin secret to continue</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={value} onChange={e => setValue(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white pr-12 focus:outline-none focus:border-primary"
              placeholder="Admin secret key" autoFocus />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button type="submit" disabled={loading || !value.trim()}
            className="w-full bg-primary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><RefreshCw size={16} className="animate-spin" />Verifying…</> : <><Shield size={16} />Access Admin</>}
          </button>
        </form>
      </div>
    </div>
  )
}

type Tab = 'overview' | 'jobs' | 'users' | 'remote_ready' | 'scraper'

export default function AdminPage() {
  const qc = useQueryClient()
  const { success, error: toastError } = useToast()
  const [secret, setSecret] = useState(() => sessionStorage.getItem('jl_admin') || '')
  const [tab, setTab] = useState<Tab>('overview')
  const [scraping, setScraping] = useState(false)

  if (!secret) return <AdminLogin onAuth={() => setSecret(sessionStorage.getItem('jl_admin') || '')} />

  const H = { 'x-admin-secret': secret }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats', { headers: H }).then(r => r.data),
    refetchInterval: 30000,
    retry: false,
  })

  const { data: jobsData } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => api.get('/admin/jobs', { headers: H }).then(r => r.data),
    enabled: tab === 'jobs',
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users', { headers: H }).then(r => r.data),
    enabled: tab === 'users',
  })

  const { data: rrData } = useQuery({
    queryKey: ['admin-remote-ready'],
    queryFn: () => api.get('/admin/remote-ready-reviews', { headers: H }).then(r => r.data),
    enabled: tab === 'remote_ready',
    refetchInterval: tab === 'remote_ready' ? 10000 : false,
  })

  const approveVideo = useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      api.post(`/admin/remote-ready/${userId}/review`, { approved }, { headers: H }),
    onSuccess: (_, { approved }) => {
      success(approved ? 'Badge approved ✅' : 'Video rejected')
      qc.invalidateQueries({ queryKey: ['admin-remote-ready'] })
    },
    onError: () => toastError('Action failed'),
  })

  const deleteJob = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/jobs/${id}`, { headers: H }),
    onSuccess: () => { success('Job deleted'); qc.invalidateQueries({ queryKey: ['admin-jobs', 'admin-stats'] }) },
  })

  const handleScrape = async () => {
    setScraping(true)
    try {
      const res = await api.post('/admin/scrape', {}, { headers: H })
      success(`Scraped: ${res.data.inserted || 0} new jobs`)
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch (e: any) { toastError(e.message) }
    setScraping(false)
  }

  const s = stats || {}
  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview',     label: 'Overview',     icon: BarChart2 },
    { key: 'jobs',         label: 'Jobs',         icon: Briefcase },
    { key: 'users',        label: 'Users',        icon: Users },
    { key: 'remote_ready', label: 'Remote Ready', icon: Shield },
    { key: 'scraper',      label: 'Scraper',      icon: Globe },
  ]

  return (
    <div className="min-h-screen text-white" style={{ background: '#0D1117' }}>
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield size={20} className="text-primary" />
          <span className="font-bold text-lg"><span className="text-primary">Job</span>Link Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 hidden sm:block">Live</span>
          </div>
          <button onClick={() => { sessionStorage.removeItem('jl_admin'); setSecret('') }}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors">Logout</button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        <aside className="w-14 sm:w-48 border-r border-gray-800 flex flex-col py-3" style={{ background: '#161B22' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={clsx('flex items-center gap-2.5 px-3 sm:px-4 py-2.5 text-sm font-medium transition-all text-left',
                tab === key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800')}>
              <Icon size={17} className="flex-shrink-0" />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
          <div className="mt-auto px-3 sm:px-4 pb-3">
            <a href="/employer/dashboard" className="text-xs text-gray-600 hover:text-gray-300 transition-colors hidden sm:block">← Back to App</a>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div>
              <h1 className="text-xl font-bold mb-5">Platform Overview</h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Jobs',     value: s.totalJobs      || 0, color: 'text-primary' },
                  { label: 'Active Jobs',    value: s.activeJobs     || 0, color: 'text-green-400' },
                  { label: 'Job Seekers',    value: s.seekers        || 0, color: 'text-blue-400' },
                  { label: 'Employers',      value: s.employers      || 0, color: 'text-yellow-400' },
                  { label: 'Applications',   value: s.applications   || 0, color: 'text-pink-400' },
                  { label: 'Remote Ready',   value: s.remoteReady    || 0, color: 'text-purple-400' },
                  { label: 'Pending Videos', value: s.pendingVideos  || 0, color: 'text-orange-400' },
                  { label: 'AI Generations', value: s.aiGenerations  || 0, color: 'text-cyan-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl p-4 border border-gray-700" style={{ background: '#161B22' }}>
                    <p className={clsx('text-2xl font-bold', color)}>{value.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOBS */}
          {tab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold">Jobs ({jobsData?.total || 0})</h1>
              </div>
              <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ background: '#161B22' }}>
                <table className="w-full text-sm min-w-[500px]">
                  <thead><tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Company</th>
                    <th className="text-left px-4 py-3">Source</th>
                    <th className="text-left px-4 py-3">Signal</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr></thead>
                  <tbody>
                    {(jobsData?.jobs || []).map((job: any) => (
                      <tr key={job.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="px-4 py-3 text-white font-medium max-w-[180px] truncate text-xs sm:text-sm">{job.title}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{job.company_name}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-gray-700 px-2 py-0.5 rounded capitalize">{job.source || 'native'}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-primary">{'●'.repeat(job.africa_hiring_signal || 3)}</span></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${job.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                            {job.is_active ? 'Active' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => { if (confirm('Delete?')) deleteJob.mutate(job.id) }}
                            className="p-1 hover:bg-red-900/30 rounded text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <div>
              <h1 className="text-xl font-bold mb-5">Users ({usersData?.total || 0})</h1>
              <div className="rounded-xl border border-gray-700 overflow-hidden" style={{ background: '#161B22' }}>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Name</th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">Joined</th>
                  </tr></thead>
                  <tbody>
                    {(usersData?.users || []).map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                        <td className="px-4 py-3 text-white text-xs sm:text-sm">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'employer' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-blue-900/50 text-blue-400'}`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{u.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REMOTE READY REVIEWS */}
          {tab === 'remote_ready' && (
            <div>
              <h1 className="text-xl font-bold mb-5">Remote Ready Video Reviews</h1>
              {(rrData?.pending || []).length === 0 ? (
                <div className="rounded-xl border border-gray-700 p-10 text-center" style={{ background: '#161B22' }}>
                  <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                  <p className="text-gray-400">No pending video reviews</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(rrData?.pending || []).map((r: any) => (
                    <div key={r.user_id} className="rounded-xl border border-gray-700 p-4" style={{ background: '#161B22' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-white">{r.full_name || r.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.location || 'No location'} · Submitted {new Date(r.updated_at).toLocaleDateString()}</p>
                          {r.speed_sessions?.length > 0 && (
                            <p className="text-xs text-green-400 mt-1">
                              ✅ Speed: avg {(r.speed_sessions.reduce((s: number, x: any) => s + x.mbps, 0) / r.speed_sessions.length).toFixed(1)} Mbps
                            </p>
                          )}
                          {r.power_video_url && (
                            <a href={r.power_video_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-1">
                              Watch Video →
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approveVideo.mutate({ userId: r.user_id, approved: true })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-900/50 text-green-400 rounded-lg text-xs hover:bg-green-900 transition-colors">
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button onClick={() => approveVideo.mutate({ userId: r.user_id, approved: false })}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs hover:bg-red-900/50 transition-colors">
                            <AlertTriangle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCRAPER */}
          {tab === 'scraper' && (
            <div className="max-w-xl">
              <h1 className="text-xl font-bold mb-5">Job Aggregation</h1>
              <div className="rounded-xl border border-gray-700 p-5 mb-4" style={{ background: '#161B22' }}>
                <h2 className="font-semibold mb-1 flex items-center gap-2"><Globe size={16} className="text-primary" />Run Scraper</h2>
                <p className="text-xs text-gray-500 mb-4">Fetches jobs from all configured sources immediately.</p>
                <button onClick={handleScrape} disabled={scraping}
                  className="flex items-center gap-2 bg-primary hover:opacity-90 px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                  {scraping ? <><RefreshCw size={15} className="animate-spin" />Running…</> : <><Play size={15} />Run Now</>}
                </button>
              </div>
              <div className="rounded-xl border border-gray-700 p-5" style={{ background: '#161B22' }}>
                <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">Stats</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Jobs',  value: s.totalJobs   || 0 },
                    { label: 'Active',      value: s.activeJobs  || 0 },
                    { label: 'Seekers',     value: s.seekers     || 0 },
                    { label: 'Employers',   value: s.employers   || 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-700 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold">{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
