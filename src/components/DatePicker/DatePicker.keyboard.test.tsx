/**
 * DatePicker — keyboard navigation + navigation button tests (S-9)
 *
 * Suite 6: Keyboard navigation
 * Suite 7: Navigation buttons
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from './DatePicker'

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('datepicker-trigger'))
  return screen.getByTestId('datepicker-dialog')
}

// ─── Suite 6: Keyboard navigation ────────────────────────────────────────────

describe('DatePicker — keyboard navigation', () => {
  it('ArrowRight moves focus forward one day', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowRight}')
    expect(screen.getByTestId('day-2024-06-11')).toHaveAttribute('tabindex', '0')
  })

  it('ArrowLeft moves focus back one day', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowLeft}')
    expect(screen.getByTestId('day-2024-06-09')).toHaveAttribute('tabindex', '0')
  })

  it('ArrowDown moves focus forward one week', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowDown}')
    expect(screen.getByTestId('day-2024-06-17')).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp moves focus back one week', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowUp}')
    expect(screen.getByTestId('day-2024-06-03')).toHaveAttribute('tabindex', '0')
  })

  it('Home moves focus to first day of month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{Home}')
    expect(screen.getByTestId('day-2024-06-01')).toHaveAttribute('tabindex', '0')
  })

  it('End moves focus to last day of month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{End}')
    expect(screen.getByTestId('day-2024-06-30')).toHaveAttribute('tabindex', '0')
  })

  it('PageUp moves to the previous month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{PageUp}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
  })

  it('PageDown moves to the next month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{PageDown}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
  })

  it('Shift+PageUp moves to the previous year', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{Shift>}{PageUp}{/Shift}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })

  it('Shift+PageDown moves to the next year', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{Shift>}{PageDown}{/Shift}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })

  it('Enter selects the focused date and closes dialog', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" onChange={onChange} />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{Enter}')
    expect(onChange).toHaveBeenCalledWith('2024-06-10')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('Space selects the focused date', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" onChange={onChange} />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ }')
    expect(onChange).toHaveBeenCalledWith('2024-06-10')
  })

  it('ArrowRight across month boundary navigates to next month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-30" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowRight}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
    expect(screen.getByTestId('day-2024-07-01')).toHaveAttribute('tabindex', '0')
  })

  it('ArrowLeft across month boundary navigates to previous month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-01" />)
    await openCalendar(user)
    await user.type(screen.getByRole('grid'), '{ArrowLeft}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
    expect(screen.getByTestId('day-2024-05-31')).toHaveAttribute('tabindex', '0')
  })
})

// ─── Suite 7: Navigation buttons ─────────────────────────────────────────────

describe('DatePicker — navigation buttons', () => {
  it('prev-month button navigates to the previous month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('prev-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
  })

  it('next-month button navigates to the next month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('next-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
  })

  it('prev-year button navigates to the previous year', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('prev-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })

  it('next-year button navigates to the next year', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('next-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })

  it('wraps from January to December when clicking prev-month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-01-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('prev-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('December'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })

  it('wraps from December to January when clicking next-month', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-12-15" />)
    await openCalendar(user)
    await user.click(screen.getByTestId('next-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('January'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })

  it('nav buttons have accessible aria-labels', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" />)
    await openCalendar(user)
    expect(screen.getByLabelText('Previous month')).toBeInTheDocument()
    expect(screen.getByLabelText('Next month')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous year')).toBeInTheDocument()
    expect(screen.getByLabelText('Next year')).toBeInTheDocument()
  })
})
