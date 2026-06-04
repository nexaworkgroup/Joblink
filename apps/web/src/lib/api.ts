import axios from 'axios'
import { supabase } from './supabase'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    const status = err?.response?.status
    if (status === 401) {
      const path = window.location.pathname
      if (!['/login','/register','/'].includes(path)) {
        await supabase.auth.signOut()
        window.location.href = '/login'
      }
    }
    const msg = err?.response?.data?.error || err.message || 'Network error'
    return Promise.reject(new Error(msg))
  }
)
