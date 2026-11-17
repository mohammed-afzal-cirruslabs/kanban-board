import { createContext, useContext, ReactNode } from 'react'
import { useTheme, Theme } from '../hooks/useTheme'

/**
 * Theme context value
 * 
 * Provides theme state and controls to the entire component tree.
 * Consumed via useThemeContext() hook.
 */
interface ThemeContextValue {
  /** Current theme mode: 'light', 'dark', or 'system' */
  theme: Theme
  /** Resolved theme after system preference: 'light' or 'dark' */
  resolvedTheme: 'light' | 'dark'
  /** Set theme explicitly */
  setTheme: (theme: Theme) => void
  /** Cycle through themes: light → dark → system → light */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/**
 * Theme Provider
 * 
 * Wraps the app and provides theme state via context.
 * Manages theme persistence, OS preference detection, and DOM updates.
 * 
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 * 
 * Must be used within a ThemeProvider.
 * 
 * @throws Error if used outside ThemeProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, resolvedTheme, toggleTheme } = useThemeContext()
 *   return <button onClick={toggleTheme}>{resolvedTheme}</button>
 * }
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}
