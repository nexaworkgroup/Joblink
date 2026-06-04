import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (err) { setError(err.message); setLoading(false) }
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <Link to="/login" className="flex items-center gap-1.5 text-sm mb-8 hover:text-primary transition-colors" style={{ color: 'var(--text-2)' }}>
          <ArrowLeft size={16} /> Back to login
        </Link>

        {sent ? (
          <div className="card text-center py-10">
            <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Check your email</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login" className="btn-primary w-full py-2.5">Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-1)' }}>Reset password</h1>
            <p className="text-sm mb-7" style={{ color: 'var(--text-2)' }}>Enter your email and we'll send a reset link.</p>
            {error && <div className="mb-4 p-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-100">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-1)' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
