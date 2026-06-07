import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { api } from './lib/api'
import { useAuthStore } from './store/authStore'

// Layout
import AppLayout from './components/layout/AppLayout'

// Public pages
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'

// Onboarding
import OnboardingPage from './pages/Onboarding'

// Seeker pages
import DashboardPage from './pages/Dashboard'
import JobsPage from './pages/Jobs'
import JobDetailPage from './pages/JobDetail'
import ApplicationsPage from './pages/Applications'
import RemoteReadyPage from './pages/RemoteReady'
import CreditsPage from './pages/Credits'
import ProfilePage from './pages/Profile'

// Employer pages
import EmployerDashboardPage from './pages/employer/Dashboard'
import PostJobPage from './pages/employer/PostJob'
import CandidatesPage from './pages/employer/Candidates'
import EmployerJobsPage from './pages/employer/Jobs'

// Admin
import AdminPage from './pages/admin/Dashboard'

// Guards
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-[var(--border)] border-t-primary rounded-full animate-spin" />
  </div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { user, profile, initialized } = useAuthStore()
  if (!initialized) return null
  if (!user) return <Navigate to="/login" replace />
  // Consider onboarding done if profile exists OR onboarding_done flag is set
  const onboardingDone = (user as any).onboarding_done || !!profile
  if (!onboardingDone) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  const { setUser, setProfile, setInitialized, clearUser } = useAuthStore()
  const navigate = useNavigate()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { clearUser(); return }

      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
        setProfile(res.data.profile)
      } catch {
        clearUser()
      } finally {
        setInitialized(true)
      }
    }

    restoreSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearUser()
        navigate('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/admin" element={<AdminPage />} />

      {/* Seeker */}
      <Route element={<RequireOnboarding><AppLayout /></RequireOnboarding>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/remote-ready" element={<RemoteReadyPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Employer */}
      <Route element={<RequireOnboarding><AppLayout /></RequireOnboarding>}>
        <Route path="/employer/dashboard" element={<EmployerDashboardPage />} />
        <Route path="/employer/post-job" element={<PostJobPage />} />
        <Route path="/employer/candidates" element={<CandidatesPage />} />
        <Route path="/employer/jobs" element={<EmployerJobsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
