import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/Toast'
import {
  ArrowLeft, Zap, Shield, Globe, Wifi, ExternalLink, Copy,
  Download, CheckCircle, Loader, Share2, Send, FileText,
  Building2, MapPin, Clock, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react'
import { clsx } from 'clsx'

function SignalBadge({ score }: { score: number }) {
  const labels = ['','','Fair','Good','Strong','Direct Hire']
  const colors = ['','','text-yellow-700 bg-yellow-50','text-orange-700 bg-orange-50','text-green-700 bg-green-50','text-primary bg-primary-light']
  return <span className={clsx('badge text-xs', colors[score]||'badge-gray')}>{'●'.repeat(score)}{'○'.repeat(5-score)} {labels[score]}</span>
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const { success, error: toastError, info } = useToast()

  // Application state
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [coverNote, setCoverNote] = useState('')
  const [showCoverNote, setShowCoverNote] = useState(false)

  // AI state (optional)
  const [showAI, setShowAI] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [cvHtml, setCvHtml] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  })
  const job = data?.job

  // Check existing application
  const { data: existingApp, refetch: refetchApp } = useQuery({
    queryKey: ['my-application', id],
    queryFn: () => api.get(`/seeker/applications?limit=100`).then(r => {
      const apps = r.data.applications || []
      return apps.find((a: any) => a.job_id === id) || null
    }),
    enabled: !!user && !!id,
  })

  const isNativeJob = job?.source === 'native'
  const alreadyApplied = applied || !!existingApp

  useEffect(() => {
    if (existingApp) setApplied(true)
  }, [existingApp])

  // Direct apply (no AI)
  const handleDirectApply = async () => {
    if (!user) { navigate('/register'); return }
    setApplying(true)
    try {
      const res = await api.post('/seeker/apply', {
        job_id: id,
        cover_note: coverNote.trim() || undefined,
      })
      if (res.data.already_applied) {
        info('You have already applied to this job')
      } else {
        setApplied(true)
        qc.invalidateQueries({ queryKey: ['my-application', id] })
        qc.invalidateQueries({ queryKey: ['applications'] })
        qc.invalidateQueries({ queryKey: ['seeker-stats'] })
        success('Application submitted! 🎉 The employer will be notified.')
      }
    } catch (e: any) {
      toastError(e.message || 'Failed to submit. Please try again.')
    }
    setApplying(false)
  }

  // AI generation (optional enhancement)
  const handleGenerateAI = async () => {
    if (!user) { navigate('/register'); return }
    setGenerating(true)
    try {
      const res = await api.post('/ai/apply', { job_id: id })
      setCvHtml(res.data.cv_html)
      setCoverLetter(res.data.cover_letter)
      setAiGenerated(true)
      setApplied(true)
      qc.invalidateQueries({ queryKey: ['my-application', id] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      qc.invalidateQueries({ queryKey: ['seeker-stats'] })
      success('AI application generated & submitted! 🎉')
    } catch (e: any) {
      toastError(e.message || 'AI generation failed. Try again.')
    }
    setGenerating(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    info('Cover letter copied!')
  }

  const handlePrintCV = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CV — ${job?.title}</title>
    <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:24px;color:#333;line-height:1.6}
    h1{color:#0A6E4A;border-bottom:2px solid #D4A017;padding-bottom:8px}
    h2{color:#0A6E4A;font-size:14px;text-transform:uppercase;border-left:3px solid #D4A017;padding-left:10px;margin-top:24px}
    p,li{font-size:14px;margin:6px 0}@media print{@page{margin:1.5cm}}</style>
    </head><body>${cvHtml}</body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const handleShare = () => {
    const text = `🚀 ${job?.title} at ${job?.company_name}\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-[var(--border)] border-t-primary animate-spin" />
    </div>
  )
  if (!job) return <div className="p-8 text-center"><p style={{ color: 'var(--text-2)' }}>Job not found.</p></div>

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto mb-nav animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-5 hover:text-primary transition-colors" style={{ color: 'var(--text-2)' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">

          {/* Job header card */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {job.company_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>{job.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm" style={{ color: 'var(--text-2)' }}>
                  <span className="flex items-center gap-1"><Building2 size={13} />{job.company_name}</span>
                  {job.location && <span className="flex items-center gap-1"><MapPin size={13} />{job.location}</span>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={handleShare} className="p-2 rounded-lg hover:bg-[var(--border-soft)] transition-colors" style={{ color: 'var(--text-2)' }}>
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.is_remote && <span className="badge badge-green text-xs"><Wifi size={10} /> Remote</span>}
              {job.job_type && <span className="badge badge-gray text-xs capitalize">{job.job_type.replace('_',' ')}</span>}
              {isNativeJob && <span className="badge bg-blue-50 text-blue-700 text-xs"><Building2 size={10} /> Platform Job</span>}
              <SignalBadge score={job.africa_hiring_signal} />
            </div>

            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl bg-primary-light mb-4 text-sm font-semibold text-primary">
                <DollarSign size={15} />
                ${job.salary_min?.toLocaleString()}–${job.salary_max?.toLocaleString()} / year
              </div>
            )}

            {/* ── APPLICATION SECTION ────────────────── */}
            {user ? (
              alreadyApplied ? (
                // Already applied
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={18} className="text-green-600" />
                    <p className="font-semibold text-green-700">Application Submitted!</p>
                  </div>
                  <p className="text-sm text-green-600">
                    Status: <span className="font-medium capitalize">{existingApp?.status || 'submitted'}</span>
                    {' · '}Track it in <button onClick={() => navigate('/applications')} className="underline hover:text-green-800">My Applications</button>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Primary: Direct Apply */}
                  <div className="rounded-xl border-2 border-primary p-4" style={{ background: 'var(--primary-light)' }}>
                    <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-1.5">
                      <Send size={14} /> Apply Now
                    </p>

                    {/* Optional cover note */}
                    <button onClick={() => setShowCoverNote(!showCoverNote)}
                      className="flex items-center gap-1.5 text-xs text-primary mb-2 hover:underline">
                      {showCoverNote ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showCoverNote ? 'Hide' : 'Add'} a short cover note (optional)
                    </button>
                    {showCoverNote && (
                      <textarea value={coverNote} onChange={e => setCoverNote(e.target.value)}
                        rows={3} className="input-field resize-none text-sm mb-3"
                        placeholder="Briefly introduce yourself and why you're interested in this role… (optional)" />
                    )}

                    <button onClick={handleDirectApply} disabled={applying}
                      className="btn-primary w-full py-3 gap-2 shadow-hover">
                      {applying
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</>
                        : <><Send size={16} /> Submit Application</>}
                    </button>
                  </div>

                  {/* Secondary: AI Enhancement */}
                  <div>
                    <button onClick={() => setShowAI(!showAI)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border transition-all hover:border-primary"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-accent-light rounded-lg flex items-center justify-center">
                          <Zap size={14} className="text-amber-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Apply with AI — optional</p>
                          <p className="text-xs" style={{ color: 'var(--text-2)' }}>Generate a tailored CV + cover letter for this role</p>
                        </div>
                      </div>
                      {showAI ? <ChevronUp size={16} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-3)' }} />}
                    </button>

                    {showAI && (
                      <div className="mt-2 p-4 rounded-xl border animate-slide-up" style={{ borderColor: 'var(--border)', background: 'var(--border-soft)' }}>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-2)' }}>
                          Our AI reads this job description and your profile to generate a tailored CV and cover letter. It also submits your application automatically.
                        </p>
                        <button onClick={handleGenerateAI} disabled={generating}
                          className="btn-accent w-full py-2.5 gap-2">
                          {generating
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                            : <><Zap size={15} /> Generate Tailored CV + Cover Letter</>}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* External link for non-native jobs */}
                  {!isNativeJob && job.external_url && (
                    <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary w-full py-2.5 gap-2 flex items-center justify-center text-sm">
                      <ExternalLink size={14} /> Apply on Employer's Website
                    </a>
                  )}
                </div>
              )
            ) : (
              // Guest
              <div className="p-4 rounded-xl text-center" style={{ background: 'var(--border-soft)' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-1)' }}>Create a free account to apply</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/register')} className="btn-primary flex-1">Sign Up Free</button>
                  <button onClick={() => navigate('/login')} className="btn-secondary flex-1">Sign In</button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="card">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>About This Role</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{job.description}</div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="card">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Requirements</h2>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{job.requirements}</div>
            </div>
          )}

          {/* Tags */}
          {job.tags?.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((t: string) => <span key={t} className="badge badge-gray text-xs">{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-primary" />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Africa Hiring Signal</h2>
            </div>
            <SignalBadge score={job.africa_hiring_signal} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
              {job.africa_hiring_signal >= 5 ? 'Actively recruiting from Africa via JobLink.' :
               job.africa_hiring_signal >= 4 ? 'Known to hire African remote workers.' :
               'Accepts worldwide applications.'}
            </p>
          </div>

          <div className="card">
            <div className="text-xs space-y-1.5" style={{ color: 'var(--text-2)' }}>
              <div className="flex items-center gap-1.5"><Clock size={13} />Posted {new Date(job.posted_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</div>
              {job.experience_level && job.experience_level !== 'any' && <div className="flex items-center gap-1.5 capitalize"><Shield size={13} />{job.experience_level} level</div>}
              <div className="flex items-center gap-1.5"><Globe size={13} />Source: {job.source_name || job.source}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Results panel */}
      {aiGenerated && (
        <div className="mt-6 space-y-4 animate-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
            <CheckCircle size={20} className="text-green-600" /> Your AI-Generated Application
          </h2>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <FileText size={15} className="text-primary" /> Tailored CV
              </h3>
              <button onClick={handlePrintCV} className="btn-secondary text-sm px-3 py-1.5 gap-1.5">
                <Download size={13} /> Print / PDF
              </button>
            </div>
            <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--border-soft)', fontFamily: 'Arial, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: cvHtml }} />
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✉️ Cover Letter</h3>
              <button onClick={handleCopy} className={clsx('btn-secondary text-sm px-3 py-1.5 gap-1.5', copied && 'text-green-600 border-green-400')}>
                {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl" style={{ background: 'var(--border-soft)', color: 'var(--text-1)' }}>
              {coverLetter}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
