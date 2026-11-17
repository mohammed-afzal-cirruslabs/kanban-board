import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeContext } from '../../contexts/ThemeContext'
import { Theme } from '../../hooks/useTheme'
import styles from './ThemeToggle.module.css'

/**
 * Theme toggle button
 * 
 * Cycles through three theme modes:
 * - Light (Sun icon)
 * - Dark (Moon icon)
 * - System (Monitor icon) — follows OS preference
 * 
 * Placement: Navbar actions area, before search button
 * Interaction: Click to cycle, keyboard accessible
 * States: hover, focus-visible, active
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, toggleTheme } = useThemeContext()

  // Icon mapping
  const icons: Record<Theme, React.ReactNode> = {
    light: <Sun size={20} aria-hidden="true" />,
    dark: <Moon size={20} aria-hidden="true" />,
    system: <Monitor size={20} aria-hidden="true" />,
  }

  // Label mapping for accessibility
  const labels: Record<Theme, string> = {
    light: 'Light theme',
    dark: 'Dark theme',
    system: 'System theme',
  }

  // Next theme in cycle for aria-label
  const nextTheme: Record<Theme, Theme> = {
    light: 'dark',
    dark: 'system',
    system: 'light',
  }

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${labels[nextTheme[theme]]}`}
      title={`Current: ${labels[theme]} (${resolvedTheme}). Click to switch.`}
    >
      {icons[theme]}
    </button>
  )
}
