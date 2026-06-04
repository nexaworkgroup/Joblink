import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

type TType = 'success'|'error'|'info'|'warning'
interface Toast { id: string; type: TType; message: string }
interface ToastCtx { success:(m:string)=>void; error:(m:string)=>void; info:(m:string)=>void; warning:(m:string)=>void }

const Ctx = createContext<ToastCtx>({ success:()=>{}, error:()=>{}, info:()=>{}, warning:()=>{} })
const ICONS = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle }
const COLORS: Record<TType,string> = {
  success: 'border-l-primary text-primary',
  error:   'border-l-red-500 text-red-500',
  info:    'border-l-blue-500 text-blue-500',
  warning: 'border-l-amber-500 text-amber-500',
}

function ToastItem({ t, dismiss }: { t: Toast; dismiss:(id:string)=>void }) {
  const Icon = ICONS[t.type]
  useEffect(() => { const id = setTimeout(() => dismiss(t.id), 4000); return () => clearTimeout(id) }, [t.id])
  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-xl border border-l-4 shadow-card max-w-sm w-full animate-slide-up bg-[var(--surface)]', COLORS[t.type])}>
      <Icon size={17} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1 text-[var(--text)]">{t.message}</p>
      <button onClick={() => dismiss(t.id)} className="text-[var(--text-3)] hover:text-[var(--text-2)] flex-shrink-0"><X size={14} /></button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = useCallback((type: TType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t.slice(-4), { id, type, message }])
  }, [])
  const dismiss = useCallback((id: string) => setToasts(t => t.filter(x => x.id !== id)), [])
  return (
    <Ctx.Provider value={{ success:m=>add('success',m), error:m=>add('error',m), info:m=>add('info',m), warning:m=>add('warning',m) }}>
      {children}
      <div className="fixed bottom-20 md:bottom-5 right-4 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(t => <ToastItem key={t.id} t={t} dismiss={dismiss} />)}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() { return useContext(Ctx) }
