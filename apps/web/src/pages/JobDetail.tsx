import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/Toast'
import {
  ArrowLeft, Zap, Shield, Globe, Wifi, ExternalLink, Copy,
  Download, CheckCircle, Loader, Share2, BookmarkPlus,
  Send, FileText, Building2, MapPin, Clock, DollarSign
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
  const autoApply = searchParams.get('apply') === '1'

  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cvHtml, setCvHtml] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/jobs/${id}`).then(r => r.data),
  })
  const job = data?.job

  // Check if already applied
  const { data: existingApp } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/seeker/applications?limit=100`).then(r => {
      const apps = r.data.applications || []
      return apps.find((a: any) => a.job_id === id) || null
    }),
    enabled: !!user && !!id,
  })

  const isNativeJob = job?.source === 'native'
  const alreadyApplied = !!existingApp

  useEffect(() => {
    if (autoApply && job && user && !generating && !generated) handleApplyWithAI()
  }, [autoApply, job, user])

  const handleApplyWithAI = async () => {
    if (!user) { navigate('/register'); return }
    setGenerating(true)
    try {
      const res = await api.post('/ai/apply', { job_id: id })
      setCvHtml(res.data.cv_html)
      setCoverLetter(res.data.cover_letter)
      setGenerated(true)
      success('Application package ready! 🎉')
    } catch (e: any) {
      toastError(e.message || 'Generation failed. Please try again.')
    }
    setGenerating(false)
  }

  // Direct submit for native jobs
  const handleDirectSubmit = async () => {
    if (!generated) { toastError('Generate your application first'); return }
    setSubmitting(true)
    try {
      await api.put(`/seeker/applications/${existingApp?.id || (await api.get(`/seeker/applications?limit=100`).then(r => r.data.applications?.find((a: any) => a.job_id === id)?.id))}/status`, {
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      setSubmitted(true)
      qc.invalidateQueries({ queryKey: ['application', id] })
      qc.invalidateQueries({ queryKey: ['applications'] })
      success('Application submitted! The employer will be notified. 🚀')
    } catch (e: any) {
      toastError(e.message || 'Submission failed')
    }
    setSubmitting(false)
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
    h1{color:#0A6E4A;border-bottom:2px solid #D4A017;padding-bottom:8px}h2{color:#0A6E4A;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-top:24px;border-left:3px solid #D4A017;padding-left:10px}
    p{font-size:14px;margin:6px 0}ul{padding-left:20px}li{font-size:14px;margin:4px 0}@media print{@page{margin:1.5cm}}</style>
    </head><body>${cvHtml}</body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const handleShare = () => {
    const text = `🚀 ${job?.title} at ${job?.company_name}\nApply via JobLink 👇\n${window.location.href}`
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
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Job header */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {job.company_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-1)' }}>{job.title}</h1>
                <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-2)' }}>
                  <Building2 size={13} />{job.company_name}
                  {job.location && <><MapPin size={13} className="ml-1" />{job.location}</>}
                </p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={handleShare} className="p-2 rounded-lg hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-2)' }} title="Share on WhatsApp">
                  <Share2 size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[var(--border-soft)]" style={{ color: 'var(--text-2)' }}>
                  <BookmarkPlus size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.is_remote && <span className="badge badge-green text-xs"><Wifi size={10} /> Remote</span>}
              {job.job_type && <span className="badge badge-gray text-xs capitalize">{job.job_type.replace('_',' ')}</span>}
              {isNativeJob && <span className="badge bg-blue-50 text-blue-700 text-xs"><Building2 size={10} /> Direct Application</span>}
              <SignalBadge score={job.africa_hiring_signal} />
            </div>

            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl bg-primary-light mb-4 text-sm font-semibold text-primary">
                <DollarSign size={15} />
                ${job.salary_min?.toLocaleString()} – ${job.salary_max?.toLocaleString()} / year {job.salary_currency}
              </div>
            )}

            {/* Already applied state */}
            {alreadyApplied && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 mb-3">
                <CheckCircle size={17} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">Application submitted!</p>
                  <p className="text-xs text-green-600">Status: <span className="capitalize font-medium">{existingApp?.status}</span></p>
                </div>
              </div>
            )}

            {/* Apply CTA */}
            {!alreadyApplied && !submitted && (
              <button onClick={handleApplyWithAI} disabled={generating}
                className="btn-primary w-full py-3 text-base shadow-hover">
                {generating
                  ? <><Loader size={18} className="animate-spin" /> Generating your application…</>
                  : generated
                  ? <><Zap size={18} /> Regenerate Application</>
                  : <><Zap size={18} /> Apply with AI — Generate CV + Cover Letter</>}
              </button>
            )}

            {submitted && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle size={18} className="text-green-600" />
                <p className="text-sm font-medium text-green-700">🎉 Application submitted to {job.company_name}!</p>
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

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* How to apply */}
          <div className="card">
            <h2 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-1)' }}>
              {isNativeJob ? '🏢 Apply Directly via JobLink' : '🌐 How to Apply'}
            </h2>
            {isNativeJob ? (
              <div className="space-y-2 text-sm">
                {[
                  { n:1, t:'Generate your application', d:'Click "Apply with AI" — instant tailored CV + cover letter' },
                  { n:2, t:'Review your materials', d:'Edit if needed, download your CV as PDF' },
                  { n:3, t:'Submit directly', d:'One click sends your application to the employer' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                    <div><p className="font-medium" style={{ color: 'var(--text-1)' }}>{t}</p><p className="text-xs" style={{ color: 'var(--text-2)' }}>{d}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  { n:1, t:'Click "Apply with AI"', d:'Get tailored CV + cover letter in seconds' },
                  { n:2, t:'Review & download', d:'Download CV as PDF, copy cover letter' },
                  { n:3, t:'Submit on their site', d:'We open the employer\'s application page' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                    <div><p className="font-medium" style={{ color: 'var(--text-1)' }}>{t}</p><p className="text-xs" style={{ color: 'var(--text-2)' }}>{d}</p></div>
                  </div>
                ))}
                {job.external_url && (
                  <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary w-full mt-3 text-sm py-2 gap-1.5 flex items-center justify-center">
                    <ExternalLink size={14} /> View Original Posting
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Africa signal */}
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-primary" />
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Africa Hiring Signal</h2>
            </div>
            <SignalBadge score={job.africa_hiring_signal} />
            <p className="text-xs mt-2" style={{ color: 'var(--text-2)' }}>
              {job.africa_hiring_signal >= 5 ? 'This employer is actively recruiting from Africa via JobLink.' :
               job.africa_hiring_signal >= 4 ? 'This employer is known to hire African remote workers.' :
               'This employer accepts worldwide applications.'}
            </p>
          </div>

          {/* Posted info */}
          <div className="card">
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--text-2)' }}>
              <Clock size={13} />
              Posted {new Date(job.posted_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>Source: {job.source_name || job.source}</div>
          </div>
        </div>
      </div>

      {/* Generated application package */}
      {generated && (
        <div className="mt-6 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Your Application Package</h2>
          </div>

          {/* CV */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-1)' }}>
                <FileText size={16} className="text-primary" /> Tailored CV
              </h3>
              <button onClick={handlePrintCV} className="btn-secondary text-sm px-3 py-1.5 gap-1.5">
                <Download size={14} /> Print / PDF
              </button>
            </div>
            <div className="p-5 rounded-xl text-sm leading-relaxed" style={{ background: 'var(--border-soft)', fontFamily: 'Arial, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: cvHtml }} />
          </div>

          {/* Cover letter */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>✉️ Cover Letter</h3>
              <button onClick={handleCopy} className={clsx('btn-secondary text-sm px-3 py-1.5 gap-1.5', copied && 'text-green-600 border-green-400')}>
                {copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-xl" style={{ background: 'var(--border-soft)', color: 'var(--text-1)' }}>
              {coverLetter}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
            <h3 className="font-bold text-white mb-2">
              {isNativeJob ? '🚀 Submit Directly to ' + job.company_name : '🚀 Ready to Apply?'}
            </h3>
            <p className="text-green-200 text-sm mb-4">
              {isNativeJob
                ? 'Your CV and cover letter are ready. Submit your application directly — the employer will be notified immediately.'
                : 'Download your CV, copy the cover letter, then apply on the employer\'s website.'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {isNativeJob ? (
                <>
                  <button onClick={handleDirectSubmit} disabled={submitting || submitted}
                    className="btn-accent text-sm px-5 py-2.5 gap-2 flex items-center disabled:opacity-60">
                    {submitting
                      ? <><Loader size={14} className="animate-spin" />Submitting…</>
                      : submitted
                      ? <><CheckCircle size={14} /> Submitted!</>
                      : <><Send size={14} /> Submit Application</>}
                  </button>
                  <button onClick={handlePrintCV} className="btn-secondary text-sm px-4 py-2 text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5">
                    <Download size={14} /> Save CV
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleCopy} className="btn-accent text-sm px-4 py-2 flex items-center gap-1.5">
                    <Copy size={14} /> Copy Cover Letter
                  </button>
                  <button onClick={handlePrintCV} className="btn-secondary text-sm px-4 py-2 text-white border-white/30 hover:bg-white/10 flex items-center gap-1.5">
                    <Download size={14} /> Download CV
                  </button>
                  {job.external_url && (
                    <a href={job.external_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary text-sm px-4 py-2 text-white border-white/30 hover:bg-white/10 inline-flex items-center gap-1.5">
                      <ExternalLink size={14} /> Apply on Their Site
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest CTA */}
      {!user && (
        <div className="card mt-6 text-center py-10" style={{ background: 'linear-gradient(135deg, #0A6E4A, #085A3C)' }}>
          <h3 className="text-xl font-bold text-white mb-2">Apply in seconds with AI</h3>
          <p className="text-green-200 mb-4">Create a free account to get your tailored CV + cover letter generated instantly.</p>
          <button onClick={() => navigate('/register')} className="btn-accent px-8 py-3">
            Create Free Account
          </button>
        </div>
      )}
    </div>
  )
}
