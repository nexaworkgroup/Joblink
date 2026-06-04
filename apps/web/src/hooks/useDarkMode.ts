import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('jl_theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('jl_theme', dark ? 'dark' : 'light')
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}
