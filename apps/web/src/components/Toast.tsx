import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react'
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

type T = 'success'|'error'|'info'|'warning'
interface Toast { id:string; type:T; msg:string }
interface Ctx { success:(m:string)=>void; error:(m:string)=>void; info:(m:string)=>void; warning:(m:string)=>void }

const Ctx = createContext<Ctx>({ success:()=>{}, error:()=>{}, info:()=>{}, warning:()=>{} })

const ICONS = { success:CheckCircle, error:XCircle, info:Info, warning:AlertTriangle }
const STYLES: Record<T,string> = {
  success:'border-l-4 border-primary',
  error:  'border-l-4 border-red-500',
  info:   'border-l-4 border-blue-500',
  warning:'border-l-4 border-amber-500',
}
const COLORS: Record<T,string> = { success:'text-primary', error:'text-red-500', info:'text-blue-500', warning:'text-amber-500' }

function Item({ t, dismiss }: { t:Toast; dismiss:(id:string)=>void }) {
  const Icon = ICONS[t.type]
  useEffect(() => { const id = setTimeout(()=>dismiss(t.id), 4000); return ()=>clearTimeout(id) }, [])
  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-xl shadow-hover max-w-xs w-full animate-fade-in', STYLES[t.type])}
      style={{background:'var(--surface)', border:'1px solid var(--border)'}}>
      <Icon size={17} className={clsx('flex-shrink-0 mt-0.5', COLORS[t.type])} />
      <p className="text-sm flex-1">{t.msg}</p>
      <button onClick={()=>dismiss(t.id)} className="text-[var(--text-3)] hover:text-[var(--text-1)] flex-shrink-0"><X size={14}/></button>
    </div>
  )
}

export function ToastProvider({ children }:{ children:ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const add = useCallback((type:T, msg:string) => {
    setToasts(t => [...t.slice(-4), { id: Math.random().toString(36).slice(2), type, msg }])
  }, [])
  const dismiss = useCallback((id:string) => setToasts(t => t.filter(x=>x.id!==id)), [])
  return (
    <Ctx.Provider value={{ success:m=>add('success',m), error:m=>add('error',m), info:m=>add('info',m), warning:m=>add('warning',m) }}>
      {children}
      <div className="fixed bottom-20 md:bottom-5 right-4 z-[100] flex flex-col gap-2 items-end">
        {toasts.map(t => <Item key={t.id} t={t} dismiss={dismiss} />)}
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
