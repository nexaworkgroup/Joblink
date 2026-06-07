import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Minimize2, Bot, Briefcase, User } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

interface Message { role: 'user' | 'assistant'; content: string }

// ── Role-specific AI configurations ─────────────────────
const AI_CONFIG = {
  job_seeker: {
    name: 'JobLink Career Coach',
    subtitle: 'Your personal career guide',
    icon: User,
    color: 'from-primary to-primary-dark',
    greeting: "Hi! I'm your career coach 👋 I help Cameroonian professionals land global remote jobs. Ask me anything about CVs, cover letters, interviews, salary negotiation, or getting Remote Ready!",
    starters: [
      '✍️ How do I tailor my CV for a US startup?',
      '📝 What makes a great cover letter opening?',
      '🎤 How do I prepare for a remote interview?',
      '💰 What salary should I ask for as a developer?',
      '🛡️ How do I get my Remote Ready badge faster?',
      '🌍 Which remote job platforms are Africa-friendly?',
    ],
  },
  employer: {
    name: 'JobLink Hiring Assistant',
    subtitle: 'Your recruitment partner',
    icon: Briefcase,
    color: 'from-blue-600 to-blue-800',
    greeting: "Hi! I'm your hiring assistant 👋 I help companies find and hire top African remote talent. Ask me about writing job descriptions, understanding African tech talent, salaries, remote hiring best practices, or the Remote Ready badge!",
    starters: [
      '📋 How do I write a job post that attracts top talent?',
      '💵 What salary is competitive for a senior developer in Cameroon?',
      '🛡️ What does the Remote Ready badge verify?',
      '🌍 Why should I hire remote talent from Africa?',
      '⏰ How do I manage time zones with an African team?',
      '📊 How do I evaluate technical candidates effectively?',
    ],
  },
}

export default function AIChatWidget() {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const role = (user?.role || 'job_seeker') as keyof typeof AI_CONFIG
  const config = AI_CONFIG[role] || AI_CONFIG.job_seeker
  const AIIcon = config.icon

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  // Reset chat when role changes (user switches accounts)
  useEffect(() => {
    setMessages([])
  }, [role])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        history: messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      })
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having a connection issue. Please try again in a moment.' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-3">

      {/* ── Chat panel ───────────────────────────────────── */}
      {open && !minimized && (
        <div className="w-80 sm:w-96 rounded-2xl shadow-modal border overflow-hidden flex flex-col animate-slide-up"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', height: '500px' }}>

          {/* Header */}
          <div className={clsx('flex items-center justify-between px-4 py-3 flex-shrink-0 bg-gradient-to-r', config.color)}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AIIcon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{config.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-[10px] text-white/70">{config.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
                <Minimize2 size={14} />
              </button>
              <button onClick={() => { setOpen(false); setMessages([]) }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div>
                {/* Greeting bubble */}
                <div className="flex gap-2.5 mb-5">
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br', config.color)}>
                    <AIIcon size={13} className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm max-w-[85%] leading-relaxed"
                    style={{ background: 'var(--border-soft)', color: 'var(--text-1)' }}>
                    {config.greeting}
                  </div>
                </div>
                {/* Quick starters */}
                <p className="text-xs mb-2 pl-9" style={{ color: 'var(--text-3)' }}>Quick questions:</p>
                <div className="pl-9 grid grid-cols-1 gap-1.5">
                  {config.starters.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="text-left text-xs px-3 py-2 rounded-xl border transition-all hover:border-primary hover:text-primary"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-2)', background: 'var(--surface)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
                  <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5',
                    msg.role === 'user'
                      ? 'bg-accent text-white'
                      : clsx('bg-gradient-to-br text-white', config.color))}>
                    {msg.role === 'user' ? (user.email?.charAt(0).toUpperCase() || 'U') : <AIIcon size={12} />}
                  </div>
                  <div className={clsx('rounded-2xl px-3 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm')}
                    style={msg.role === 'user'
                      ? { background: role === 'employer' ? '#1d4ed8' : '#0A6E4A', color: 'white' }
                      : { background: 'var(--border-soft)', color: 'var(--text-1)' }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-2.5">
                <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white bg-gradient-to-br', config.color)}>
                  <AIIcon size={12} />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--border-soft)' }}>
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey} rows={1}
                placeholder={role === 'employer' ? 'Ask about hiring…' : 'Ask about your career…'}
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all"
                style={{ background: 'var(--border-soft)', color: 'var(--text-1)', border: '1.5px solid var(--border)', minHeight: '38px', maxHeight: '100px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 100) + 'px'
                }} />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                className={clsx('w-9 h-9 rounded-xl text-white flex items-center justify-center flex-shrink-0 transition-all bg-gradient-to-br disabled:opacity-40', config.color)}>
                <Send size={15} />
              </button>
            </div>
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--text-3)' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* ── Minimized pill ──────────────────────────────── */}
      {open && minimized && (
        <button onClick={() => setMinimized(false)}
          className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-full shadow-hover text-white text-sm font-medium animate-fade-in bg-gradient-to-r', config.color)}>
          <AIIcon size={16} />
          {config.name.split(' ').slice(-1)[0]} AI
          {messages.length > 0 && <span className="w-2 h-2 bg-accent rounded-full" />}
        </button>
      )}

      {/* ── Toggle button ───────────────────────────────── */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className={clsx('w-14 h-14 rounded-full shadow-hover flex items-center justify-center text-white relative animate-fade-in bg-gradient-to-br', config.color)}>
          <AIIcon size={22} />
          <span className="absolute -top-1 -right-1 text-[9px] bg-accent text-white font-bold px-1.5 py-0.5 rounded-full">AI</span>
        </button>
      )}
    </div>
  )
}
