import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Zap, Shield, Globe, ArrowRight, CheckCircle,
  Star, Briefcase, Users, TrendingUp, ChevronDown,
  Wifi, Battery, Award, Play
} from 'lucide-react'
import { api } from '../lib/api'
import { clsx } from 'clsx'

const FEATURES = [
  {
    icon: Zap,
    title: 'Apply with AI in Seconds',
    desc: 'Click one button. Our AI reads the job, scans your profile, and generates a tailored CV + cover letter instantly — no templates, no copy-paste.',
    color: 'text-primary bg-primary-light',
  },
  {
    icon: Shield,
    title: 'Remote Ready Badge',
    desc: 'Earn a verified credential that proves your internet speed and power backup to Western employers — removing their #1 objection before they ask.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: Globe,
    title: 'Curated Global Jobs',
    desc: 'Every job in our feed is verified as coming from employers genuinely open to hiring Africans remotely. No more applying into the void.',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: Award,
    title: 'Bilingual CV Intelligence',
    desc: 'Your French academic credentials are automatically translated into US-standard English — degree names, titles, and achievements — exactly how Western recruiters expect them.',
    color: 'text-accent bg-accent-light',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Build your profile', desc: 'Add your education, skills, and career goals. Takes under 5 minutes.' },
  { step: '02', title: 'Get Remote Ready', desc: 'Verify your internet and power backup. Earn the badge that employers trust.' },
  { step: '03', title: 'Find your job', desc: 'Browse curated remote jobs ranked by AI match score — only employers who hire from Africa.' },
  { step: '04', title: 'Apply in one click', desc: 'Hit "Apply with AI". Get a tailored CV + cover letter in seconds. Submit on the employer\'s site.' },
]

const STATS = [
  { value: '500+', label: 'Verified Remote Jobs' },
  { value: '3×', label: 'More Interview Callbacks' },
  { value: '10s', label: 'To Generate Your CV' },
  { value: '100%', label: 'Free in Beta' },
]

const TESTIMONIALS = [
  {
    name: 'Marie Kotto', role: 'Frontend Developer, Douala',
    text: 'I applied to 3 US startups in one afternoon. JobLink generated a perfect CV for each one. Got an interview in 5 days.',
    signal: 5,
  },
  {
    name: 'Jean-Paul Mbah', role: 'Data Analyst, Yaoundé',
    text: 'The Remote Ready badge made the difference. The employer specifically mentioned it. I\'m now working remotely for a London fintech.',
    signal: 5,
  },
  {
    name: 'Amina Ngozi', role: 'Product Manager, Buea',
    text: 'The bilingual CV feature understood my French degree perfectly. No more explaining what a "Licence" is to American recruiters.',
    signal: 5,
  },
]

function SignalDots({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={clsx('w-2 h-2 rounded-full', i<=score ? 'bg-primary' : 'bg-gray-200')} />
      ))}
      <span className="text-xs text-[var(--text-3)] ml-1">Africa Signal</span>
    </div>
  )
}

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState({ jobs: '500+', seekers: '2,000+', hires: '120+' })
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    api.get('/jobs/stats').then(r => {
      const d = r.data
      if (d.jobs) setStats(prev => ({
        ...prev,
        jobs: d.jobs > 100 ? `${d.jobs}+` : '500+',
      }))
    }).catch(() => {})

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('jl_lang', next)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Navbar ───────────────────────────────── */}
      <header className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass shadow-card' : 'bg-transparent'
      )}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm">J</div>
            <span className="font-bold text-lg gradient-text">JobLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: 'var(--text-2)' }}>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#for-employers" className="hover:text-primary transition-colors">Employers</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang}
              className="hidden sm:flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-[var(--border-soft)] transition-colors"
              style={{ color: 'var(--text-2)' }}>
              <Globe size={13} />
              {i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
            <Link to="/login" className="btn-secondary text-sm px-4 py-2 hidden sm:inline-flex">
              {t('auth.sign_in')}
            </Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">
              {t('landing.cta_seeker')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="pt-24 pb-20 px-4 sm:px-6 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="animate-fade-in">
              {/* Beta badge */}
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Free Beta — Cameroon Launch
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6" style={{ color: 'var(--text-1)' }}>
                <span className="gradient-text">{t('landing.hero_title')}</span>
                <br />
                <span style={{ color: 'var(--text-1)' }}>{t('landing.hero_title_2')}</span>
                <br />
                <span style={{ color: 'var(--text-2)', fontSize: '0.85em' }}>{t('landing.hero_subtitle')}</span>
              </h1>

              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--text-2)' }}>
                {t('landing.hero_desc')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link to="/register" className="btn-primary px-7 py-3.5 text-base shadow-hover">
                  Start for Free
                  <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works"
                  className="btn-secondary px-7 py-3.5 text-base flex items-center justify-center gap-2">
                  <Play size={16} className="text-primary" />
                  See how it works
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4">
                {['No CV required to start', '10 free AI applications', 'No credit card'].map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
                    <CheckCircle size={15} className="text-primary flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — App preview card */}
            <div className="relative animate-slide-up hidden lg:block">
              {/* Floating job card */}
              <div className="card shadow-hover p-5 mb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">S</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Senior React Developer</p>
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>Stripe, Inc. · San Francisco (Remote)</p>
                  </div>
                  <div className="flex items-center gap-1 bg-primary-light text-primary text-xs font-bold px-2 py-1 rounded-full">
                    <Zap size={10} /> 94%
                  </div>
                </div>
                <SignalDots score={5} />
                <div className="mt-3 flex gap-2">
                  <span className="badge badge-green text-xs">Remote</span>
                  <span className="badge badge-accent text-xs">$90-120k/yr</span>
                  <span className="badge badge-gray text-xs">Full-time</span>
                </div>
                <button className="btn-primary w-full mt-3 py-2 text-sm">
                  <Zap size={15} /> Apply with AI
                </button>
              </div>

              {/* Remote Ready badge card */}
              <div className="card shadow-card p-4 flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Remote Ready ✓</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>25 Mbps · Generator backup · Verified</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary-light px-2 py-1 rounded-full">
                  Verified
                </div>
              </div>

              {/* CV Generated notification */}
              <div className="card shadow-card p-4 flex items-center gap-3 animate-float">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>CV + Cover Letter Ready</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>Tailored to Stripe React Developer role · 8s</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16">
            {STATS.map(({ value, label }) => (
              <div key={label} className="card text-center py-5 card-hover">
                <p className="text-3xl font-bold gradient-text">{value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-1)' }}>
              From profile to application in minutes
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="card card-hover relative overflow-hidden">
                <div className="absolute top-3 right-3 text-4xl font-black opacity-5" style={{ color: 'var(--text-1)' }}>
                  {step}
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                  <span className="text-primary font-bold text-sm">{step}</span>
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">Why JobLink</p>
            <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-1)' }}>
              Built different. Built for Africa.
            </h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ color: 'var(--text-2)' }}>
              Global platforms weren't designed with African candidates in mind. JobLink was.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 stagger">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card card-hover">
                <div className={clsx('w-11 h-11 rounded-2xl flex items-center justify-center mb-4', color)}>
                  <Icon size={22} />
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-1)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Remote Ready Deep Dive ────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">The Remote Ready Badge</p>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>
                Remove the #1 barrier Western employers cite
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: 'var(--text-2)' }}>
                "We'd love to hire from Africa, but we're not sure about the internet and power situation." Sound familiar? The Remote Ready badge answers that objection before they even ask it — with verified, tamper-proof credentials.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Wifi, title: 'Internet Speed Verified', desc: 'Server-side speed test across 3 sessions. Min 5 Mbps required. VPN gaming detected and blocked.' },
                  { icon: Battery, title: 'Power Backup Verified', desc: 'Video proof of your generator, solar, or UPS solution — reviewed by our team within 24 hours.' },
                  { icon: Shield, title: 'Employer Trust Signal', desc: 'Your badge appears on every application package you generate. Valid 12 months, renewable.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                      <Icon size={17} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-1)' }}>{title}</p>
                      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/register" className="btn-primary mt-8 inline-flex">
                Get Remote Ready <ArrowRight size={16} />
              </Link>
            </div>
            <div className="card p-8 text-center shadow-hover">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-green animate-float">
                <Shield size={44} className="text-white" />
              </div>
              <div className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-4 py-2 rounded-full mb-4">
                ✓ Remote Ready — Verified
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>
                "Candidates with the Remote Ready badge get <strong>3× more responses</strong> from international employers."
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Min Speed', value: '5 Mbps' },
                  { label: 'Latency', value: '< 150ms' },
                  { label: 'Power Backup', value: 'Verified' },
                  { label: 'Validity', value: '12 months' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: 'var(--bg)' }}>
                    <p className="font-bold text-primary">{value}</p>
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Cameroonian professionals, global careers</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 stagger">
            {TESTIMONIALS.map(({ name, role, text, signal }) => (
              <div key={name} className="card card-hover">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-accent fill-accent" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: 'var(--text-2)' }}>"{text}"</p>
                <div className="flex items-center gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-2)' }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Employers ────────────────────────── */}
      <section id="for-employers" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 sm:p-12 text-center" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #085A3C 100%)' }}>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Briefcase size={12} /> For Employers
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Access Africa's most qualified remote talent
            </h2>
            <p className="text-green-200 mb-8 max-w-xl mx-auto">
              Post jobs free during our beta. Reach verified Remote Ready candidates who are already prepared to work with your team. No friction, no complexity.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Users, label: 'Pre-screened candidates' },
                { icon: Shield, label: 'Remote Ready verified' },
                { icon: TrendingUp, label: 'Free during beta' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 bg-white/10 text-white rounded-xl px-4 py-3 text-sm font-medium justify-center">
                  <Icon size={16} className="text-accent" />
                  {label}
                </div>
              ))}
            </div>
            <Link to="/register?role=employer" className="btn-accent px-8 py-3.5 text-base inline-flex">
              Post a Job — Free
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>
            Your skills are worth more than your location.
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>
            Start applying to global remote jobs today. Everything is free during our Cameroon beta.
          </p>
          <Link to="/register" className="btn-primary px-10 py-4 text-lg shadow-hover">
            Create Free Account
            <ArrowRight size={20} />
          </Link>
          <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
            No credit card required · 10 free AI applications · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t py-8 px-4 sm:px-6" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">J</div>
            <span className="font-bold gradient-text">JobLink</span>
          </div>
          <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--text-2)' }}>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <a href="mailto:hello@joblink.app" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>© 2026 JobLink · Made in Cameroon 🇨🇲</p>
        </div>
      </footer>
    </div>
  )
}
