/**
 * LoginForm — email + password login form.
 *
 * Props:
 *   onSubmit   — called with { email, password } on a valid submission
 *   isLoading  — when true the submit button shows a spinner and is disabled
 *   errorMessage — server-level error to display above the submit button
 *
 * Validation (on blur + on submit):
 *   email    — required; must match basic e-mail pattern
 *   password — required; minimum 8 characters
 *
 * Design: all visual values come from src/tokens.css custom properties.
 */
import { useState, useId } from 'react'
import styles from './LoginForm.module.css'

export interface LoginFormValues {
  email: string
  password: string
}

interface Props {
  onSubmit: (values: LoginFormValues) => void
  isLoading?: boolean
  errorMessage?: string
}

function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return 'Enter a valid email address'
  return ''
}

function validatePassword(value: string): string {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  return ''
}

export function LoginForm({ onSubmit, isLoading = false, errorMessage }: Props) {
  const uid = useId()
  const emailId = `${uid}-email`
  const passwordId = `${uid}-password`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  function handleEmailBlur() {
    setEmailError(validateEmail(email))
  }

  function handlePasswordBlur() {
    setPasswordError(validatePassword(password))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailError(eErr)
    setPasswordError(pErr)
    if (eErr || pErr) return
    onSubmit({ email: email.trim(), password })
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      aria-label="Login form"
      noValidate
    >
      <h1 className={styles.heading}>Sign in</h1>

      {/* ── Email ── */}
      <div className={styles.field}>
        <label htmlFor={emailId} className={styles.label}>
          Email
        </label>
        <input
          id={emailId}
          type="email"
          className={`${styles.input} ${emailError ? styles.inputError : ''}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={handleEmailBlur}
          autoComplete="email"
          aria-describedby={emailError ? `${emailId}-error` : undefined}
          aria-invalid={emailError ? true : undefined}
          disabled={isLoading}
        />
        {emailError && (
          <span
            id={`${emailId}-error`}
            className={styles.errorMsg}
            role="alert"
          >
            {emailError}
          </span>
        )}
      </div>

      {/* ── Password ── */}
      <div className={styles.field}>
        <label htmlFor={passwordId} className={styles.label}>
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={handlePasswordBlur}
          autoComplete="current-password"
          aria-describedby={passwordError ? `${passwordId}-error` : undefined}
          aria-invalid={passwordError ? true : undefined}
          disabled={isLoading}
        />
        {passwordError && (
          <span
            id={`${passwordId}-error`}
            className={styles.errorMsg}
            role="alert"
          >
            {passwordError}
          </span>
        )}
      </div>

      {/* ── Server-level error ── */}
      {errorMessage && (
        <p className={styles.serverError} role="alert">
          {errorMessage}
        </p>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span
              className={styles.spinner}
              aria-hidden="true"
            />
            <span className={styles.srOnly}>Signing in…</span>
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  )
}
