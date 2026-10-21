/**
 * Tests for the LoginForm component
 *
 * Acceptance criteria covered:
 *   AC1  Email and password fields render with correct labels
 *   AC2  Validation errors appear on blur (email, password)
 *   AC3  Validation errors appear on submit with empty fields
 *   AC4  Correct error messages for each invalid case
 *   AC5  Error messages carry role="alert"
 *   AC6  Loading state — spinner visible, button disabled, inputs disabled
 *   AC7  No double-submit while isLoading is true
 *   AC8  onSubmit called with { email, password } on valid submission
 *   AC9  onSubmit NOT called when fields are invalid
 *   AC10 Server-level errorMessage renders with role="alert"
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { LoginForm, LoginFormValues } from '../components/LoginForm'

// ─── helpers ─────────────────────────────────────────────────────────────────

function setup(props: Partial<Parameters<typeof LoginForm>[0]> = {}) {
  const onSubmit = vi.fn()
  render(<LoginForm onSubmit={onSubmit} {...props} />)
  return {
    onSubmit,
    emailInput: () => screen.getByLabelText(/^email$/i),
    passwordInput: () => screen.getByLabelText(/^password$/i),
    submitBtn: () => screen.getByRole('button', { name: /sign in/i }),
  }
}

// ─── AC1: Field rendering ─────────────────────────────────────────────────────

describe('AC1 — field rendering', () => {
  it('renders an email input with label "Email"', () => {
    setup()
    const input = screen.getByLabelText(/^email$/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'email')
  })

  it('renders a password input with label "Password"', () => {
    setup()
    const input = screen.getByLabelText(/^password$/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders a submit button labelled "Sign in"', () => {
    setup()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('form has accessible name "Login form"', () => {
    setup()
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()
  })

  it('email and password inputs start empty', () => {
    setup()
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('')
  })
})

// ─── AC2: Validation on blur ──────────────────────────────────────────────────

describe('AC2 — validation errors on blur', () => {
  it('shows "Email is required" when email field is blurred empty', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText(/^email$/i))
    await user.tab() // blur email
    expect(screen.getByText('Email is required')).toBeInTheDocument()
  })

  it('shows "Enter a valid email address" for a malformed email on blur', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/^email$/i), 'notanemail')
    await user.tab()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
  })

  it('shows "Password is required" when password field is blurred empty', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByLabelText(/^password$/i))
    await user.tab()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
  })

  it('shows "Password must be at least 8 characters" for a short password on blur', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.tab()
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('does not show an error before the field has been blurred', () => {
    setup()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ─── AC3: Validation on submit ────────────────────────────────────────────────

describe('AC3 — validation errors on submit', () => {
  it('shows both field errors when the form is submitted empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows email error when only password is filled', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows password error when only email is filled', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows invalid email error on submit with bad email format', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'bad-email')
    await user.type(screen.getByLabelText(/^password$/i), 'validpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows short password error on submit', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

// ─── AC4 + AC5: Error message content and role="alert" ───────────────────────

describe('AC4 + AC5 — error message text and role="alert"', () => {
  it('email-required alert has role="alert"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    const alerts = screen.getAllByRole('alert')
    const texts = alerts.map((a) => a.textContent)
    expect(texts).toContain('Email is required')
  })

  it('password-required alert has role="alert"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    const alerts = screen.getAllByRole('alert')
    const texts = alerts.map((a) => a.textContent)
    expect(texts).toContain('Password is required')
  })

  it('invalid-email alert has role="alert"', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/^email$/i), 'notvalid')
    await user.tab()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address')
  })

  it('short-password alert has role="alert"', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/^password$/i), 'abc')
    await user.tab()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Password must be at least 8 characters'
    )
  })
})

// ─── AC6: Loading state UI ────────────────────────────────────────────────────

describe('AC6 — loading state', () => {
  it('submit button is disabled when isLoading is true', () => {
    setup({ isLoading: true })
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('submit button has aria-busy="true" when isLoading', () => {
    setup({ isLoading: true })
    expect(screen.getByRole('button', { name: /signing in/i })).toHaveAttribute(
      'aria-busy',
      'true'
    )
  })

  it('spinner element is present when isLoading is true', () => {
    setup({ isLoading: true })
    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
  })

  it('email input is disabled when isLoading is true', () => {
    setup({ isLoading: true })
    expect(screen.getByLabelText(/^email$/i)).toBeDisabled()
  })

  it('password input is disabled when isLoading is true', () => {
    setup({ isLoading: true })
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled()
  })

  it('submit button shows "Sign in" text when isLoading is false', () => {
    setup({ isLoading: false })
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
  })
})

// ─── AC7: No double-submit ────────────────────────────────────────────────────

describe('AC7 — no double-submit while loading', () => {
  it('clicking the disabled button while isLoading does not call onSubmit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} isLoading={true} />)
    // button is disabled — userEvent skips disabled elements
    await user.click(screen.getByRole('button', { name: /signing in/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

// ─── AC8: Successful submission callback ─────────────────────────────────────

describe('AC8 — successful submission', () => {
  it('calls onSubmit with { email, password } on valid input', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'securepassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
    const args: LoginFormValues = onSubmit.mock.calls[0][0]
    expect(args.email).toBe('user@example.com')
    expect(args.password).toBe('securepassword')
  })

  it('does not show any validation errors after a valid submission', async () => {
    const user = userEvent.setup()
    setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'securepassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('trims leading/trailing whitespace from email before passing to onSubmit', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), '  user@example.com  ')
    await user.type(screen.getByLabelText(/^password$/i), 'securepassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][0].email).toBe('user@example.com')
  })

  it('accepts an 8-character password (minimum boundary)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'exactly8')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('rejects a 7-character password (below minimum)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await user.type(screen.getByLabelText(/^email$/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short7c')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

// ─── AC10: Server-level error ─────────────────────────────────────────────────

describe('AC10 — server-level errorMessage prop', () => {
  it('renders the server error when errorMessage prop is provided', () => {
    setup({ errorMessage: 'Invalid credentials' })
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
  })

  it('does not render a server error banner when errorMessage is absent', () => {
    setup()
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
  })
})
