'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // Read saved theme ONLY after mount — never during SSR
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('theme') as Theme | null
      const resolved =
        saved ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      apply(resolved)
      setThemeState(resolved)
    } catch {
      apply('dark')
    }
  }, [])

  function setTheme(next: Theme) {
    apply(next)
    setThemeState(next)
    try {
      window.localStorage.setItem('theme', next)
    } catch {
      // Silently ignore — theme still works for the session
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

function apply(t: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', t === 'dark')
  root.classList.toggle('light', t === 'light')
}
