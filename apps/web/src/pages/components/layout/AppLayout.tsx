import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useDarkMode } from '../../hooks/useDarkMode'
import { api } from '../../lib/api'
import {
  LayoutDashboard, Briefcase, FileText, Shield, Coins,
  User, LogOut, Globe, Users, PlusCircle, Bell,
  ChevronLeft, Menu, Sun, Moon, X, CheckCheck
} from 'lucide-react'
import { clsx } from 'clsx'

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications').then(r => { setNotifs(r.data.notifications || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const markAll = async () => {
    await api.put('/notifications/read-all').catch(() => {})
    setNotifs(n => n.map(x => ({ ...x, is_read: true })))
  }

  return (
    <div className="absolute right-0 top-10 w-80 rounded-2xl shadow-modal border z-50 overflow-hidden animate-slide-down"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Notifications</h3>
        <div className="flex items-center gap-2">
          <button onClick={markAll} className="text-xs text-primary hover:underline flex items-center gap-1">
            <CheckCheck size={12} /> Mark all read
          </button>
          <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-3)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm" style={{ color: 'var(--text-3)' }}>Loading…</div>
        ) : notifs.length === 0 ? (
          <div className="p-6 text-center">
            <Bell size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-2)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No notifications yet</p>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} className={clsx('px-4 py-3 border-b last:border-0 transition-colors', !n.is_read && 'bg-primary-light/40')}
              style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{n.title}</p>
              {n.message && <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{n.message}</p>}
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { t, i18n } = useTranslation()
  const { user, profile, clearUser } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { dark, toggle } = useDarkMode()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => { setMobileOpen(false); setShowNotifs(false) }, [location.pathname])

  useEffect(() => {
    if (!user) return
    const fetch = () => api.get('/notifications/unread-count').then(r => setUnread(r.data.count || 0)).catch(() => {})
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [user])

  const signOut = async () => { await supabase.auth.signOut(); clearUser(); navigate('/login') }
  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('jl_lang', next)
  }

  const isSeeker = user?.role === 'job_seeker'
  const p = profile as any
  const name = p?.full_name || p?.company_name || user?.email?.split('@')[0] || ''

  const seekerNav = [
    { to: '/dashboard',    icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/jobs',         icon: Briefcase,       label: t('nav.jobs') },
    { to: '/applications', icon: FileText,        label: t('nav.applications') },
    { to: '/remote-ready', icon: Shield,          label: t('nav.remote_ready') },
    { to: '/credits',      icon: Coins,           label: t('nav.credits') },
    { to: '/profile',      icon: User,            label: t('nav.profile') },
  ]
  const employerNav = [
    { to: '/employer/dashboard',  icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/employer/jobs',       icon: Briefcase,       label: t('nav.my_jobs') },
    { to: '/employer/post-job',   icon: PlusCircle,      label: t('nav.post_job') },
    { to: '/employer/candidates', icon: Users,           label: t('nav.applicants') },
    { to: '/profile',             icon: User,            label: t('nav.profile') },
  ]
  const navItems = isSeeker ? seekerNav : employerNav

  const isActive = (to: string) => {
    const dashboards = ['/dashboard', '/employer/dashboard']
    if (dashboards.includes(to)) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Link to={isSeeker ? '/dashboard' : '/employer/dashboard'} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">J</div>
          {(!collapsed || mobile) && <span className="font-bold text-[15px] truncate gradient-text">JobLink</span>}
        </Link>
        {!mobile && (
          <button onClick={() => setCollapsed(c => !c)} className="p-1 rounded-lg hover:bg-[var(--border-soft)] hidden md:flex flex-shrink-0" style={{ color: 'var(--text-2)' }}>
            <ChevronLeft size={15} className={clsx('transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className={clsx(
            'flex items-center gap-3 py-2.5 rounded-xl transition-all duration-150 group relative',
            collapsed && !mobile ? 'px-2 justify-center' : 'px-3',
            isActive(to) ? 'bg-primary text-white' : 'text-[var(--text-2)] hover:bg-[var(--border-soft)] hover:text-[var(--text-1)]'
          )}>
            <Icon size={17} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span className="text-sm font-medium truncate">{label}</span>}
            {collapsed && !mobile && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                              opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity">
                {label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t p-2.5 space-y-1.5 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl" style={{ background: 'var(--border-soft)' }}>
            <div className="w-7 h-7 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{name}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                {isSeeker ? `${user?.credits_balance ?? 10} credits` : 'Employer'}
              </p>
            </div>
          </div>
        )}
        <div className={clsx('flex items-center gap-2 px-1', collapsed && !mobile ? 'flex-col' : '')}>
          <button onClick={toggle}
            className={clsx('relative w-10 h-5 rounded-full transition-colors flex-shrink-0', dark ? 'bg-primary' : 'bg-gray-200')}>
            <span className={clsx('absolute top-0.5 w-4 h-4 rounded-full flex items-center justify-center transition-all', dark ? 'translate-x-5 bg-gray-900' : 'translate-x-0.5 bg-white shadow')}>
              {dark ? <Moon size={9} className="text-accent" /> : <Sun size={9} className="text-amber-500" />}
            </span>
          </button>
          {(!collapsed || mobile) && (
            <button onClick={toggleLang} className="flex items-center gap-1 text-[11px] hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-2)' }}>
              <Globe size={12} />{i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
          )}
          <button onClick={signOut}
            className={clsx('flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500', collapsed && !mobile ? 'justify-center w-full ml-0' : 'ml-auto')}
            style={{ color: 'var(--text-2)' }}>
            <LogOut size={13} />
            {(!collapsed || mobile) && 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className={clsx('hidden md:flex flex-col border-r transition-[width] duration-300 flex-shrink-0', collapsed ? 'w-[58px]' : 'w-[216px]')}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] z-50 flex flex-col animate-slide-up shadow-modal"
            style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
            <NavContent mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-2)' }}>
            <Menu size={20} />
          </button>
          <Link to={isSeeker ? '/dashboard' : '/employer/dashboard'} className="font-bold text-base gradient-text flex-1">JobLink</Link>
          <div className="flex items-center gap-1">
            {/* Notification bell */}
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl hover:bg-[var(--border-soft)] transition-colors" style={{ color: 'var(--text-2)' }}>
                <Bell size={19} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showNotifs && <NotificationPanel onClose={() => { setShowNotifs(false); setUnread(0) }} />}
            </div>
            <button onClick={toggle} className="p-2 rounded-xl hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-2)' }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Desktop notification bell — top right */}
        <div className="hidden md:flex absolute right-5 top-3 items-center gap-2 z-30">
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-[var(--border-soft)] transition-colors" style={{ color: 'var(--text-2)' }}>
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            {showNotifs && <NotificationPanel onClose={() => { setShowNotifs(false); setUnread(0) }} />}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto"><Outlet /></main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-stretch border-t flex-shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className={clsx('flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors', isActive(to) ? 'text-primary' : 'text-[var(--text-3)]')}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
