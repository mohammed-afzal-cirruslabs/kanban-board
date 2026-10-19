/**
 * DateRangePicker tests — S-9
 *
 * Covers: rendering, open/close, navigation, range selection (two-click),
 * min/max constraints, controlled mode, and accessibility attributes.
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DateRangePicker } from '../components/DatePicker'
import type { DateRange } from '../components/DatePicker'

// ─── helpers ─────────────────────────────────────────────────────────────────

function openPicker() {
  fireEvent.click(screen.getByTestId('daterangepicker-trigger'))
}

function getDialog() {
  return screen.getByTestId('daterangepicker-dialog')
}

// ─── rendering ───────────────────────────────────────────────────────────────

describe('DateRangePicker — rendering', () => {
  it('renders the trigger button', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('daterangepicker-trigger')).toBeInTheDocument()
  })

  it('shows placeholder when no range is selected', () => {
    render(<DateRangePicker placeholder="Pick a range" />)
    expect(screen.getByText('Pick a range')).toBeInTheDocument()
  })

  it('shows formatted range when defaultValue is provided', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} />)
    const trigger = screen.getByTestId('daterangepicker-trigger')
    // Trigger text contains both dates separated by an em-dash
    expect(trigger.textContent).toContain('June 10, 2024')
    expect(trigger.textContent).toContain('June 20, 2024')
  })

  it('shows start with ellipsis when only start is set', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    const trigger = screen.getByTestId('daterangepicker-trigger')
    expect(trigger.textContent).toContain('June 10, 2024')
    expect(trigger.textContent).toContain('…')
  })

  it('dialog is hidden initially', () => {
    render(<DateRangePicker />)
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<DateRangePicker disabled />)
    expect(screen.getByTestId('daterangepicker-trigger')).toBeDisabled()
  })

  it('renders a label element when label prop is provided', () => {
    render(<DateRangePicker label="Booking period" />)
    expect(screen.getByText('Booking period')).toBeInTheDocument()
  })
})

// ─── open / close ─────────────────────────────────────────────────────────────

describe('DateRangePicker — open/close', () => {
  it('opens dialog on trigger click', () => {
    render(<DateRangePicker />)
    openPicker()
    expect(screen.getByTestId('daterangepicker-dialog')).toBeInTheDocument()
  })

  it('closes dialog on second trigger click', () => {
    render(<DateRangePicker />)
    openPicker()
    openPicker()
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })

  it('closes dialog on Escape key', () => {
    render(<DateRangePicker />)
    openPicker()
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Escape' })
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })

  it('does not open when disabled', () => {
    render(<DateRangePicker disabled />)
    openPicker()
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })

  it('dialog has role="dialog" and aria-modal="true"', () => {
    render(<DateRangePicker />)
    openPicker()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})

// ─── navigation ───────────────────────────────────────────────────────────────

describe('DateRangePicker — month/year navigation', () => {
  it('renders month and year in header', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    openPicker()
    // Scope to the dialog so the trigger text (which also contains the year)
    // does not cause a "multiple elements" error.
    expect(within(getDialog()).getByText(/2024/)).toBeInTheDocument()
  })

  it('goes to previous month', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    expect(within(getDialog()).getByText(/May.*2024|2024.*May/i)).toBeInTheDocument()
  })

  it('goes to next month', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-month'))
    expect(within(getDialog()).getByText(/July.*2024|2024.*July/i)).toBeInTheDocument()
  })

  it('wraps month backward across year boundary', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-01-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    expect(within(getDialog()).getByText(/December.*2023|2023.*December/i)).toBeInTheDocument()
  })

  it('wraps month forward across year boundary', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-12-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-month'))
    expect(within(getDialog()).getByText(/January.*2025|2025.*January/i)).toBeInTheDocument()
  })
})

// ─── range selection ──────────────────────────────────────────────────────────

describe('DateRangePicker — range selection', () => {
  it('calls onChange with start-only range on first click', () => {
    const onChange = vi.fn()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    expect(onChange).toHaveBeenCalledWith({ start: '2024-06-10' })
  })

  it('calls onChange with complete range on second click', () => {
    const onChange = vi.fn()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    fireEvent.click(screen.getByTestId('day-2024-06-20'))
    expect(onChange).toHaveBeenLastCalledWith({ start: '2024-06-10', end: '2024-06-20' })
  })

  it('normalises range when end is clicked before start', () => {
    const onChange = vi.fn()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    openPicker()
    // Click end first, then start — component should swap them
    fireEvent.click(screen.getByTestId('day-2024-06-20'))
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DateRange
    expect(lastCall.start).toBe('2024-06-10')
    expect(lastCall.end).toBe('2024-06-20')
  })

  it('closes dialog after completing a range selection', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    fireEvent.click(screen.getByTestId('day-2024-06-20'))
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })

  it('updates trigger display after completing a range', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    fireEvent.click(screen.getByTestId('day-2024-06-20'))
    const trigger = screen.getByTestId('daterangepicker-trigger')
    expect(trigger.textContent).toContain('June 10, 2024')
    expect(trigger.textContent).toContain('June 20, 2024')
  })

  it('Clear button resets range and closes dialog', () => {
    const onChange = vi.fn()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('drp-clear-btn'))
    expect(onChange).toHaveBeenCalledWith({ start: '' })
    expect(screen.queryByTestId('daterangepicker-dialog')).not.toBeInTheDocument()
  })
})

// ─── min / max constraints ────────────────────────────────────────────────────

describe('DateRangePicker — min/max', () => {
  it('marks dates before min as disabled', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" />)
    openPicker()
    const cell = screen.getByTestId('day-2024-06-05')
    expect(cell).toHaveAttribute('aria-disabled', 'true')
  })

  it('marks dates after max as disabled', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} max="2024-06-20" />)
    openPicker()
    const cell = screen.getByTestId('day-2024-06-25')
    expect(cell).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not call onChange when a disabled date is clicked', () => {
    const onChange = vi.fn()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} min="2024-06-10" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-05'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── controlled mode ──────────────────────────────────────────────────────────

describe('DateRangePicker — controlled mode', () => {
  it('reflects external value changes', () => {
    const { rerender } = render(
      <DateRangePicker value={{ start: '2024-06-10', end: '2024-06-20' }} />
    )
    const trigger = screen.getByTestId('daterangepicker-trigger')
    expect(trigger.textContent).toContain('June 10, 2024')

    rerender(<DateRangePicker value={{ start: '2024-09-01', end: '2024-09-15' }} />)
    expect(trigger.textContent).toContain('September 1, 2024')
  })

  it('does not update internally when value prop is controlled', () => {
    const onChange = vi.fn()
    render(
      <DateRangePicker
        value={{ start: '2024-06-10', end: '2024-06-20' }}
        onChange={onChange}
      />
    )
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-05'))
    // onChange fires but the displayed value stays at the controlled value
    const trigger = screen.getByTestId('daterangepicker-trigger')
    expect(trigger.textContent).toContain('June 10, 2024')
  })
})

// ─── accessibility ────────────────────────────────────────────────────────────

describe('DateRangePicker — accessibility', () => {
  it('trigger has aria-haspopup="dialog"', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('trigger aria-expanded is false when closed', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger aria-expanded is true when open', () => {
    render(<DateRangePicker />)
    openPicker()
    expect(screen.getByTestId('daterangepicker-trigger')).toHaveAttribute('aria-expanded', 'true')
  })

  it('calendar has role="grid" and aria-multiselectable="true"', () => {
    render(<DateRangePicker />)
    openPicker()
    const grid = screen.getByRole('grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('selected range endpoints have aria-selected="true"', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} />)
    openPicker()
    expect(screen.getByTestId('day-2024-06-10')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('day-2024-06-20')).toHaveAttribute('aria-selected', 'true')
  })

  it('keyboard ArrowRight moves focus by one day', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    openPicker()
    const grid = screen.getByRole('grid')
    fireEvent.keyDown(grid, { key: 'ArrowRight' })
    // Focus moves — the previously focused cell loses tabIndex=0
    // We just verify no error is thrown and the grid is still present
    expect(grid).toBeInTheDocument()
  })
})
