import { clsx } from 'clsx'
const sizes = { sm:'w-4 h-4 border-2', md:'w-8 h-8 border-[3px]', lg:'w-12 h-12 border-4' }
export default function Spinner({ size='md', className='' }: { size?:'sm'|'md'|'lg'; className?:string }) {
  return <div className={clsx(sizes[size], 'rounded-full border-[var(--border)] border-t-primary animate-spin', className)} />
}
export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center animate-float shadow-glow">
          <span className="text-white font-bold text-xl">JL</span>
        </div>
        <Spinner size="sm" />
      </div>
    </div>
  )
}
