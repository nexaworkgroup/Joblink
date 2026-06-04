import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'
import { Zap, Plus, CheckCircle, ArrowDownCircle, Gift, Clock } from 'lucide-react'
import { clsx } from 'clsx'

const PACKAGES = [
  { id: 'starter',  name: 'Starter',  credits: 5,  price: 1000,  per: '200 XAF each' },
  { id: 'standard', name: 'Standard', credits: 15, price: 2500,  per: '167 XAF each', popular: true },
  { id: 'pro',      name: 'Pro',      credits: 40, price: 5500,  per: '138 XAF each' },
]

const EVENT_ICONS: Record<string, any> = {
  signup_bonus: Gift,
  used:         ArrowDownCircle,
  purchased:    Plus,
  refunded:     CheckCircle,
  admin_grant:  Gift,
}
const EVENT_COLORS: Record<string, string> = {
  signup_bonus: 'text-green-500',
  used:         'text-red-400',
  purchased:    'text-primary',
  refunded:     'text-green-500',
  admin_grant:  'text-primary',
}
const EVENT_LABELS: Record<string, string> = {
  signup_bonus: 'Welcome bonus',
  used:         'AI application used',
  purchased:    'Credits purchased',
  refunded:     'Refunded',
  admin_grant:  'Admin grant',
}

export default function CreditsPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['credits'],
    queryFn: () => api.get('/seeker/credits').then(r => r.data),
  })

  const balance = data?.balance ?? user?.credits_balance ?? 10
  const logs: any[] = data?.logs || []

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto mb-nav animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Credits</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
          1 credit = 1 AI-generated CV + cover letter for a specific job
        </p>
      </div>

      {/* Balance card */}
      <div className="card mb-5 p-6" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-200 text-sm mb-1">Available Credits</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{balance}</span>
              <span className="text-green-200 mb-1">credits</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
            <Zap size={32} className="text-accent" />
          </div>
        </div>

        {/* Beta banner */}
        <div className="mt-4 p-3 bg-white/10 rounded-xl">
          <div className="flex items-center gap-2">
            <Gift size={14} className="text-accent flex-shrink-0" />
            <p className="text-white text-xs font-medium">
              🎉 Beta Access: All credits are <strong>free</strong> during our Cameroon launch. Apply to as many jobs as you want!
            </p>
          </div>
        </div>
      </div>

      {/* Buy credits — coming soon */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Buy More Credits</h2>
          <span className="badge bg-amber-50 text-amber-700 text-xs">Coming Soon</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 opacity-60 pointer-events-none">
          {PACKAGES.map(pkg => (
            <div key={pkg.id} className={clsx('card relative', pkg.popular && 'border-primary ring-1 ring-primary/20')}>
              {pkg.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 badge bg-primary text-white text-xs px-2">Popular</span>
              )}
              <p className="font-bold text-center mt-1" style={{ color: 'var(--text-1)' }}>{pkg.name}</p>
              <div className="text-center my-3">
                <span className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>{pkg.credits}</span>
                <span className="text-sm" style={{ color: 'var(--text-2)' }}> credits</span>
              </div>
              <p className="text-center text-primary font-semibold text-sm mb-1">{pkg.price.toLocaleString()} XAF</p>
              <p className="text-center text-xs mb-3" style={{ color: 'var(--text-3)' }}>{pkg.per}</p>
              <button className="btn-primary w-full py-2 text-sm" disabled>Buy Now</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-3)' }}>
          Payments via Orange Money, MTN MoMo, and Stripe — activating after beta
        </p>
      </div>

      {/* Usage history */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Usage History</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl animate-shimmer" style={{ background: 'var(--border-soft)' }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--text-2)' }} />
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>No activity yet. Apply to a job to use your first credit.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log: any) => {
              const Icon = EVENT_ICONS[log.event_type] || Zap
              const color = EVENT_COLORS[log.event_type] || 'text-primary'
              const label = EVENT_LABELS[log.event_type] || log.event_type
              const isPositive = log.amount > 0
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--border-soft)' }}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color, 'bg-white/50')}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                      {log.description || label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                      {new Date(log.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                  <span className={clsx('text-sm font-bold flex-shrink-0', isPositive ? 'text-green-600' : 'text-red-500')}>
                    {isPositive ? '+' : ''}{log.amount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
