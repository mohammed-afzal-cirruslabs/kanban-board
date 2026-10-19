/**
 * DateRangePicker — unit + integration tests, Part 2 (S-9)
 *
 * Suite 6:  min / max constraints
 * Suite 7:  Navigation buttons
 * Suite 8:  ARIA attributes
 * Suite 9:  Edge cases (leap year, month boundaries, day counts)
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DateRangePicker } from './DateRangePicker'
import type { DateRange } from './types'

async function openPickerAsync(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('daterangepicker-trigger'))
  return screen.getByRole('dialog')
}

async function clickDay(user: ReturnType<typeof userEvent.setup>, dateStr: string) {
  await user.click(screen.getByTestId(`day-${dateStr}`))
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite 6 — min / max constraints
// ─────────────────────────────────────────────────────────────────────────────
describe('DateRangePicker — min / max constraints', () => {
  it('disables day cells before the min date', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-06-09')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('day-2024-06-10')).toHaveAttribute('aria-disabled', 'false')
  })

  it('disables day cells after the max date', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-20" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-06-21')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('day-2024-06-20')).toHaveAttribute('aria-disabled', 'false')
  })

  it('does not call onChange when a disabled (before min) day is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" onChange={onChange} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('day-2024-06-05'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange when a disabled (after max) day is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-20" onChange={onChange} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('day-2024-06-25'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('allows selecting the exact min date as range start', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-10')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2024-06-10' }))
  })

  it('allows selecting the exact max date as range end', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-25" onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-15')
    await clickDay(user, '2024-06-25')
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DateRange
    expect(lastCall.end).toBe('2024-06-25')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 7 — Navigation buttons
// ─────────────────────────────────────────────────────────────────────────────
describe('DateRangePicker — navigation buttons', () => {
  it('prev-month button navigates to the previous month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('prev-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
  })

  it('next-month button navigates to the next month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('next-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
  })

  it('prev-year button navigates to the previous year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('prev-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })

  it('next-year button navigates to the next year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('next-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })

  it('wraps from January to December when clicking prev-month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-01-15' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('prev-month'))
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('December'))
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })

  it('wraps from December to January when clicking next-month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-12-15' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('next-month'))
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('January'))
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 8 — ARIA attributes
// ─────────────────────────────────────────────────────────────────────────────
describe('DateRangePicker — ARIA attributes', () => {
  it('trigger has aria-haspopup="dialog"', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('trigger has aria-expanded=false when closed', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await user.click(screen.getByTestId('daterangepicker-trigger'))
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-expanded', 'true')
  })

  it('dialog has role="dialog"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByRole('dialog')).toHaveAttribute('role', 'dialog')
  })

  it('dialog has aria-modal="true"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('calendar grid has aria-multiselectable="true"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('day cells have role="gridcell"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-06-15')).toHaveAttribute('role', 'gridcell')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Suite 9 — Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('DateRangePicker — edge cases', () => {
  it('renders February 29 in a leap year (2024)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-02-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-02-29')).toBeInTheDocument()
  })

  it('does NOT render February 29 in a non-leap year (2023)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2023-02-01' }} />)
    await openPickerAsync(user)
    expect(screen.queryByTestId('day-2023-02-29')).not.toBeInTheDocument()
    expect(screen.getByTestId('day-2023-02-28')).toBeInTheDocument()
  })

  it('renders correct number of days for months with 31 days (January)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-01-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-01-31')).toBeInTheDocument()
    expect(screen.queryByTestId('day-2024-01-32')).not.toBeInTheDocument()
  })

  it('renders correct number of days for April (30 days)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-04-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('day-2024-04-30')).toBeInTheDocument()
    expect(screen.queryByTestId('day-2024-04-31')).not.toBeInTheDocument()
  })
})
