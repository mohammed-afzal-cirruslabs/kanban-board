import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'
import styles from './Navbar.module.css'

interface NavbarProps {
  /** Current active page for navigation highlighting */
  activePage?: 'dashboard' | 'boards' | 'analytics'
}

export function Navbar({ activePage = 'boards' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isMobileMenuOpen) {
      closeMobileMenu()
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={styles.navbar}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.container}>
        {/* Logo + Brand */}
        <a href="/" className={styles.logoLink} aria-label="Kanban Board home">
          <div className={styles.logo} aria-hidden="true">
            📋
          </div>
          <span className={styles.brand}>Kanban Board</span>
        </a>

        {/* Desktop Navigation Links */}
        <ul className={styles.navLinks} role="list">
          <li>
            <a
              href="/dashboard"
              className={`${styles.navLink} ${activePage === 'dashboard' ? styles.navLinkActive : ''}`}
              aria-current={activePage === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/boards"
              className={`${styles.navLink} ${activePage === 'boards' ? styles.navLinkActive : ''}`}
              aria-current={activePage === 'boards' ? 'page' : undefined}
            >
              Boards
            </a>
          </li>
          <li>
            <a
              href="/analytics"
              className={`${styles.navLink} ${activePage === 'analytics' ? styles.navLinkActive : ''}`}
              aria-current={activePage === 'analytics' ? 'page' : undefined}
            >
              Analytics
            </a>
          </li>
        </ul>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Search Button - Desktop */}
          <button
            className={`${styles.iconBtn} ${styles.searchBtn}`}
            aria-label="Search"
            type="button"
          >
            <Search size={20} />
          </button>

          {/* User Avatar */}
          <button
            className={styles.avatar}
            aria-label="User menu"
            aria-haspopup="true"
            type="button"
          >
            <span className={styles.avatarInitials}>AB</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className={`${styles.iconBtn} ${styles.menuToggle} ${isMobileMenuOpen ? styles.menuToggleOpen : ''}`}
            aria-label="Menu"
            aria-expanded={isMobileMenuOpen}
            onClick={toggleMobileMenu}
            type="button"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavLinks} role="list">
            <li>
              <a
                href="/dashboard"
                className={`${styles.mobileNavLink} ${activePage === 'dashboard' ? styles.mobileNavLinkActive : ''}`}
                aria-current={activePage === 'dashboard' ? 'page' : undefined}
                onClick={closeMobileMenu}
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/boards"
                className={`${styles.mobileNavLink} ${activePage === 'boards' ? styles.mobileNavLinkActive : ''}`}
                aria-current={activePage === 'boards' ? 'page' : undefined}
                onClick={closeMobileMenu}
              >
                Boards
              </a>
            </li>
            <li>
              <a
                href="/analytics"
                className={`${styles.mobileNavLink} ${activePage === 'analytics' ? styles.mobileNavLinkActive : ''}`}
                aria-current={activePage === 'analytics' ? 'page' : undefined}
                onClick={closeMobileMenu}
              >
                Analytics
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
