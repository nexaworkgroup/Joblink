import { create } from 'zustand'

export type UserRole = 'job_seeker' | 'employer'

export interface User {
  id: string
  email: string
  role: UserRole
  credits_balance: number
  lang_preference: string
  plan: string
}

interface AuthState {
  user: User | null
  profile: Record<string, any> | null
  initialized: boolean
  setUser: (u: User) => void
  setProfile: (p: Record<string, any> | null) => void
  setInitialized: (v: boolean) => void
  clearUser: () => void
  updateCredits: (n: number) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  initialized: false,
  setUser:        u => set({ user: u }),
  setProfile:     p => set({ profile: p }),
  setInitialized: v => set({ initialized: v }),
  clearUser:      () => set({ user: null, profile: null, initialized: true }),
  updateCredits:  n => set(s => s.user ? { user: { ...s.user, credits_balance: n } } : {}),
}))
