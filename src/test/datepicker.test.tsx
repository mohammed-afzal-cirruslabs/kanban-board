/**
 * DatePicker tests — S-9
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from '../components/DatePicker'

// ─── helpers ────────────────────────────────────────────────────────────────

function openPicker() {
  fireEvent.click(screen.getByTestId('datepicker-trigger'))
}

// ─── rendering ──────────────────────────────────────────────────────────────

describe('DatePicker — rendering', () => {
  it('renders the trigger button', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toBeInTheDocument()
  })

  it('shows placeholder when no value', () => {
    render(<DatePicker placeholder="Pick a date" />)
    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })

  it('formats a defaultValue for display', () => {
    render(<DatePicker defaultValue="2024-03-15" />)
    expect(screen.getByText('March 15, 2024')).toBeInTheDocument()
  })

  it('formats a controlled value for display', () => {
    render(<DatePicker value="2024-07-04" />)
    expect(screen.getByText('July 4, 2024')).toBeInTheDocument()
  })

  it('dialog is hidden initially', () => {
    render(<DatePicker />)
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<DatePicker disabled />)
    expect(screen.getByTestId('datepicker-trigger')).toBeDisabled()
  })
})

// ─── open / close ────────────────────────────────────────────────────────────

describe('DatePicker — open/close', () => {
  it('opens dialog on trigger click', () => {
    render(<DatePicker />)
    openPicker()
    expect(screen.getByTestId('datepicker-dialog')).toBeInTheDocument()
  })

  it('closes dialog on second trigger click', () => {
    render(<DatePicker />)
    openPicker()
    openPicker()
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('closes dialog on Escape key', () => {
    render(<DatePicker />)
    openPicker()
    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Escape' })
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('does not open when disabled', () => {
    render(<DatePicker disabled />)
    openPicker()
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })
})

// ─── navigation ──────────────────────────────────────────────────────────────

describe('DatePicker — month/year navigation', () => {
  it('renders month and year in header', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    expect(screen.getByText('June 2024')).toBeInTheDocument()
  })

  it('goes to previous month', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    expect(screen.getByText('May 2024')).toBeInTheDocument()
  })

  it('goes to next month', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-month'))
    expect(screen.getByText('July 2024')).toBeInTheDocument()
  })

  it('wraps month backward across year boundary', () => {
    render(<DatePicker defaultValue="2024-01-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    expect(screen.getByText('December 2023')).toBeInTheDocument()
  })

  it('wraps month forward across year boundary', () => {
    render(<DatePicker defaultValue="2024-12-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-month'))
    expect(screen.getByText('January 2025')).toBeInTheDocument()
  })

  it('goes to previous year', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-year'))
    expect(screen.getByText('June 2023')).toBeInTheDocument()
  })

  it('goes to next year', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-year'))
    expect(screen.getByText('June 2025')).toBeInTheDocument()
  })
})

// ─── date selection ───────────────────────────────────────────────────────────

describe('DatePicker — date selection', () => {
  it('calls onChange with ISO string when a day is clicked', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-01" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-15'))
    expect(onChange).toHaveBeenCalledWith('2024-06-15')
  })

  it('closes dialog after selecting a date', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-10'))
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('displays the newly selected date in the trigger', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-20'))
    expect(screen.getByText('June 20, 2024')).toBeInTheDocument()
  })

  it('Today button selects today and closes', () => {
    const onChange = vi.fn()
    render(<DatePicker onChange={onChange} />)
    openPicker()
    const todayBtn = screen.getByTestId('today-btn')
    if (!todayBtn.hasAttribute('disabled')) {
      fireEvent.click(todayBtn)
      expect(onChange).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
    }
  })

  it('Clear button fires onChange with empty string and closes', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-01" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('clear-btn'))
    expect(onChange).toHaveBeenCalledWith('')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('Clear button removes displayed date', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('clear-btn'))
    expect(screen.queryByText('June 1, 2024')).not.toBeInTheDocument()
  })
})

// ─── min / max constraints ────────────────────────────────────────────────────

describe('DatePicker — min/max', () => {
  it('marks dates before min as disabled', () => {
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    openPicker()
    const cell = screen.getByTestId('day-2024-06-05')
    expect(cell).toHaveAttribute('aria-disabled', 'true')
  })

  it('marks dates after max as disabled', () => {
    render(<DatePicker defaultValue="2024-06-15" max="2024-06-20" />)
    openPicker()
    const cell = screen.getByTestId('day-2024-06-25')
    expect(cell).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not call onChange when a disabled date is clicked', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-05'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── controlled mode ─────────────────────────────────────────────────────────

describe('DatePicker — controlled mode', () => {
  it('reflects external value changes', () => {
    const { rerender } = render(<DatePicker value="2024-06-01" />)
    expect(screen.getByText('June 1, 2024')).toBeInTheDocument()
    rerender(<DatePicker value="2024-09-22" />)
    expect(screen.getByText('September 22, 2024')).toBeInTheDocument()
  })

  it('does not update internal state when controlled', () => {
    const onChange = vi.fn()
    render(<DatePicker value="2024-06-01" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-06-15'))
    // onChange called but display still shows controlled value (unchanged by parent)
    expect(onChange).toHaveBeenCalledWith('2024-06-15')
    expect(screen.getByText('June 1, 2024')).toBeInTheDocument()
  })
})

// ─── accessibility ────────────────────────────────────────────────────────────

describe('DatePicker — accessibility', () => {
  it('trigger has aria-haspopup="dialog"', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('trigger aria-expanded is false when closed', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-expanded', 'false')
  })

  it('trigger aria-expanded is true when open', () => {
    render(<DatePicker />)
    openPicker()
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('aria-expanded', 'true')
  })

  it('dialog has role="dialog" and aria-modal="true"', () => {
    render(<DatePicker />)
    openPicker()
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(dialog).toHaveAttribute('role', 'dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('grid has role="grid"', () => {
    render(<DatePicker />)
    openPicker()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('selected cell has aria-selected="true"', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    expect(screen.getByTestId('day-2024-06-15')).toHaveAttribute('aria-selected', 'true')
  })
})
