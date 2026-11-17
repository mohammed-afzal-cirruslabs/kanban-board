import { useState, useEffect } from 'react'

export type Theme = 'light' | 'dark' | 'system'

/**
 * Theme management hook
 * 
 * Manages theme state with three modes:
 * - 'light': force light theme
 * - 'dark': force dark theme  
 * - 'system': follow OS preference (default)
 * 
 * Persists preference to localStorage and applies theme via data-theme attribute
 * on document root for CSS consumption.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem('kanban-theme') as Theme | null
    return stored ?? 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Persist to localStorage
    localStorage.setItem('kanban-theme', theme)

    // Resolve system preference if needed
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateResolvedTheme = () => {
      const resolved = theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light')
        : theme
      
      setResolvedTheme(resolved)
      
      // Apply to document root
      document.documentElement.setAttribute('data-theme', resolved)
    }

    updateResolvedTheme()

    // Listen for system preference changes when in 'system' mode
    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateResolvedTheme)
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    // Cycle: light → dark → system → light
    setThemeState((current) => {
      if (current === 'light') return 'dark'
      if (current === 'dark') return 'system'
      return 'light'
    })
  }

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }
}
