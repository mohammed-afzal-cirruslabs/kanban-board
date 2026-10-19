/**
 * DatePicker — ARIA / accessibility tests (S-9)
 *
 * Suite 8: ARIA attributes
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { DatePicker } from './DatePicker'

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('datepicker-trigger'))
  return screen.getByTestId('datepicker-dialog')
}

// ─── Suite 8: ARIA attributes ─────────────────────────────────────────────────

describe('DatePicker — ARIA attributes', () => {
  it('trigger has aria-haspopup="dialog"', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('trigger has aria-expanded=false when closed', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await user.click(screen.getByTestId('datepicker-trigger'))
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-expanded', 'true')
  })

  it('dialog has role="dialog"', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await openCalendar(user)
    expect(screen.getByTestId('datepicker-dialog')).toHaveAttribute('role', 'dialog')
  })

  it('dialog has aria-modal="true"', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await openCalendar(user)
    expect(screen.getByTestId('datepicker-dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('dialog has aria-label="Choose date"', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await openCalendar(user)
    expect(screen.getByTestId('datepicker-dialog')).toHaveAttribute('aria-label', 'Choose date')
  })

  it('calendar table has role="grid"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('day cells have role="gridcell"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    const cells = screen.getAllByRole('gridcell')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('month/year heading has aria-live="polite" and aria-atomic="true"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    const live = screen.getByText(/June 2024/i).closest('[aria-live]')
    expect(live).toHaveAttribute('aria-live', 'polite')
    expect(live).toHaveAttribute('aria-atomic', 'true')
  })

  it('trigger aria-label falls back to "Choose date" when no label prop', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-label', 'Choose date')
  })

  it('trigger aria-label uses label prop when provided', () => {
    render(<DatePicker label="Appointment date" />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-label', 'Appointment date')
  })

  it('trigger aria-controls points to the dialog id', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    const trigger = screen.getByTestId('datepicker-trigger')
    const controlsId = trigger.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    await user.click(trigger)
    expect(document.getElementById(controlsId!)).toBeInTheDocument()
  })

  it('column headers use scope="col"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(7)
    headers.forEach(h => expect(h).toHaveAttribute('scope', 'col'))
  })

  it('disabled day cells have aria-disabled="true"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-05')).toHaveAttribute('aria-disabled', 'true')
  })

  it('enabled day cells have aria-disabled="false"', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-15')).toHaveAttribute('aria-disabled', 'false')
  })
})
