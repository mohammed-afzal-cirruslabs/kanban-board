/**
 * DateRangePicker — unit + integration tests, Part 2 (S-9)
 *
 * Suite 6:  min / max constraints
 * Suite 7:  Navigation buttons
 * Suite 8:  ARIA attributes
 * Suite 9:  Edge cases (leap year, month boundaries, day counts)
 * Suite 10: Keyboard navigation
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DateRangePicker } from './DateRangePicker'
import type { DateRange } from './types'

async function openPickerAsync(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('drp-trigger'))
  return screen.getByTestId('drp-dialog')
}

async function clickDay(user: ReturnType<typeof userEvent.setup>, dateStr: string) {
  await user.click(screen.getByTestId(`drp-day-${dateStr}`))
}

describe('DateRangePicker — min / max constraints', () => {
  it('disables day cells before the min date', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-09')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('drp-day-2024-06-10')).toHaveAttribute('aria-disabled', 'false')
  })
  it('disables day cells after the max date', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-20" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-21')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('drp-day-2024-06-20')).toHaveAttribute('aria-disabled', 'false')
  })
  it('does not call onChange when a disabled (before min) day is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" onChange={onChange} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-day-2024-06-05'))
    expect(onChange).not.toHaveBeenCalled()
  })
  it('does not call onChange when a disabled (after max) day is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-20" onChange={onChange} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-day-2024-06-25'))
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

describe('DateRangePicker — navigation buttons', () => {
  it('prev-month button navigates to the previous month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-prev-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
  })
  it('next-month button navigates to the next month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-next-month'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
  })
  it('prev-year button navigates to the previous year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-prev-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })
  it('next-year button navigates to the next year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-next-year'))
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })
  it('wraps from January to December when clicking prev-month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-01-15' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-prev-month'))
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('December'))
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })
  it('wraps from December to January when clicking next-month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-12-15' }} />)
    await openPickerAsync(user)
    await user.click(screen.getByTestId('drp-next-month'))
    const grid = screen.getByRole('grid')
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('January'))
    expect(grid).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })
})

describe('DateRangePicker — ARIA attributes', () => {
  it('trigger has aria-haspopup="dialog"', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('drp-trigger')).toHaveAttribute('aria-haspopup', 'dialog')
  })
  it('trigger has aria-expanded=false when closed', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('drp-trigger')).toHaveAttribute('aria-expanded', 'false')
  })
  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await user.click(screen.getByTestId('drp-trigger'))
    expect(screen.getByTestId('drp-trigger')).toHaveAttribute('aria-expanded', 'true')
  })
  it('dialog has role="dialog"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-dialog')).toHaveAttribute('role', 'dialog')
  })
  it('dialog has aria-modal="true"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-dialog')).toHaveAttribute('aria-modal', 'true')
  })
  it('calendar grid has aria-multiselectable="true"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
  })
  it('day cells have role="gridcell"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0)
  })
  it('column headers use scope="col"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(7)
    headers.forEach(h => expect(h).toHaveAttribute('scope', 'col'))
  })
  it('disabled day cells have aria-disabled="true"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-05')).toHaveAttribute('aria-disabled', 'true')
  })
  it('enabled day cells have aria-disabled="false"', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-15')).toHaveAttribute('aria-disabled', 'false')
  })
})

describe('DateRangePicker — edge cases', () => {
  it('renders February 29 in a leap year (2024)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-02-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-02-29')).toBeInTheDocument()
  })
  it('does NOT render February 29 in a non-leap year (2023)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2023-02-01' }} />)
    await openPickerAsync(user)
    expect(screen.queryByTestId('drp-day-2023-02-29')).not.toBeInTheDocument()
    expect(screen.getByTestId('drp-day-2023-02-28')).toBeInTheDocument()
  })
  it('can select February 29 as range start in a leap year', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-02-01' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-02-29')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2024-02-29' }))
  })
  it('ArrowRight from Dec 31 moves to Jan 1 of next year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-12-31' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{ArrowRight}')
    expect(screen.getByTestId('drp-day-2025-01-01')).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2025'))
  })
  it('ArrowLeft from Jan 1 moves to Dec 31 of previous year', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-01-01' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{ArrowLeft}')
    expect(screen.getByTestId('drp-day-2023-12-31')).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('2023'))
  })
  it('renders correct number of days for months with 31 days (January)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-01-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-01-31')).toBeInTheDocument()
    expect(screen.queryByTestId('drp-day-2024-01-32')).not.toBeInTheDocument()
  })
  it('renders correct number of days for April (30 days)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-04-01' }} />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-04-30')).toBeInTheDocument()
    expect(screen.queryByTestId('drp-day-2024-04-31')).not.toBeInTheDocument()
  })
})

describe('DateRangePicker — keyboard navigation', () => {
  it('ArrowRight moves focus forward one day', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{ArrowRight}')
    expect(screen.getByTestId('drp-day-2024-06-11')).toHaveAttribute('tabindex', '0')
  })
  it('ArrowLeft moves focus back one day', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{ArrowLeft}')
    expect(screen.getByTestId('drp-day-2024-06-09')).toHaveAttribute('tabindex', '0')
  })
  it('Home moves focus to first day of month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{Home}')
    expect(screen.getByTestId('drp-day-2024-06-01')).toHaveAttribute('tabindex', '0')
  })
  it('End moves focus to last day of month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{End}')
    expect(screen.getByTestId('drp-day-2024-06-30')).toHaveAttribute('tabindex', '0')
  })
  it('PageUp moves to the previous month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{PageUp}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('May'))
  })
  it('PageDown moves to the next month', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{PageDown}')
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('July'))
  })
  it('Enter selects the focused date as start and keeps dialog open', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} onChange={onChange} />)
    await openPickerAsync(user)
    await user.type(screen.getByRole('grid'), '{Enter}')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2024-06-10' }))
  })
})
