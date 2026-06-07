import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Minimize2, Bot } from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { clsx } from 'clsx'

interface Message { role: 'user' | 'assistant'; content: string }

const STARTERS = {
  job_seeker: [
    'How do I improve my CV for US companies?',
    'What should I write in my cover letter?',
    'How do I prepare for a remote job interview?',
    'What skills are most in demand globally?',
  ],
  employer: [
    'How do I attract Remote Ready candidates?',
    'What salary should I offer for a React developer in Cameroon?',
    'How do I write a job description that gets applications?',
    'What makes a good remote hire from Africa?',
  ],
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

  const role = user?.role || 'job_seeker'
  const starters = STARTERS[role as keyof typeof STARTERS] || STARTERS.job_seeker

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', {
        message: text.trim(),
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      })
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && !minimized && (
        <div className="w-80 sm:w-96 rounded-2xl shadow-modal border overflow-hidden flex flex-col animate-slide-up"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', height: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)', borderColor: 'transparent' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={17} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">JobLink AI</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-xs text-green-200">{role === 'employer' ? 'Hiring Assistant' : 'Career Coach'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white">
                <Minimize2 size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div>
                <div className="flex gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm max-w-[85%]"
                    style={{ background: 'var(--border-soft)', color: 'var(--text-1)' }}>
                    {role === 'employer'
                      ? "Hi! I'm your hiring assistant. I can help you write job descriptions, find the right candidates, and understand remote hiring from Africa."
                      : "Hi! I'm your career coach. I can help you with your CV, cover letters, interview prep, and landing remote work globally."}
                  </div>
                </div>
                <p className="text-xs mb-2 pl-9" style={{ color: 'var(--text-3)' }}>Quick questions:</p>
                <div className="pl-9 space-y-1.5">
                  {starters.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl border transition-all hover:border-primary hover:text-primary"
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
                    msg.role === 'user' ? 'bg-accent text-white' : 'bg-primary text-white')}>
                    {msg.role === 'user' ? (user.email?.charAt(0).toUpperCase()) : 'AI'}
                  </div>
                  <div className={clsx('rounded-2xl px-3 py-2.5 text-sm max-w-[85%] leading-relaxed whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'rounded-tr-sm text-white'
                      : 'rounded-tl-sm')}
                    style={msg.role === 'user'
                      ? { background: '#0A6E4A', color: 'white' }
                      : { background: 'var(--border-soft)', color: 'var(--text-1)' }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">AI</div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: 'var(--border-soft)' }}>
                  <div className="flex gap-1 items-center h-4">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
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
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                rows={1} placeholder="Ask anything…"
                className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-all"
                style={{ background: 'var(--border-soft)', color: 'var(--text-1)', border: '1.5px solid var(--border)', minHeight: '38px', maxHeight: '100px' }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 100) + 'px'
                }} />
              <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-40">
                <Send size={15} />
              </button>
            </div>
            <p className="text-xs text-center mt-1.5" style={{ color: 'var(--text-3)' }}>Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* Minimized pill */}
      {open && minimized && (
        <button onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full shadow-hover text-white text-sm font-medium animate-fade-in"
          style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
          <Bot size={16} />
          JobLink AI
          {messages.length > 0 && <span className="w-2 h-2 bg-accent rounded-full" />}
        </button>
      )}

      {/* Toggle button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full shadow-hover flex items-center justify-center text-white relative animate-fade-in"
          style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
          <MessageSquare size={22} />
          <span className="absolute -top-1 -right-1 text-[9px] bg-accent text-white font-bold px-1.5 py-0.5 rounded-full">AI</span>
        </button>
      )}
    </div>
  )
}
