/**
 * DatePicker — comprehensive tests (S-9)
 *
 * Suite 1:  Rendering
 * Suite 2:  Open / Close
 * Suite 3:  Date selection
 * Suite 4:  Controlled mode
 * Suite 5:  min / max constraints
 * Suite 6:  Keyboard navigation          → DatePicker.keyboard.test.tsx
 * Suite 7:  Navigation buttons           → DatePicker.keyboard.test.tsx
 * Suite 8:  ARIA attributes              → DatePicker.a11y.test.tsx
 * Suite 9:  Edge cases (leap year, …)    → DatePicker.edge.test.tsx
 * Suite 10: Locale                       → DatePicker.edge.test.tsx
 * Suite 11: Clear button                 → DatePicker.edge.test.tsx
 * Suite 12: Today marker                 → DatePicker.edge.test.tsx
 */
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from './DatePicker'

// ─── helpers ─────────────────────────────────────────────────────────────────

async function openCalendar(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId('datepicker-trigger'))
  return screen.getByTestId('datepicker-dialog')
}

async function clickDay(user: ReturnType<typeof userEvent.setup>, dateStr: string) {
  await user.click(screen.getByTestId(`day-${dateStr}`))
}

// ─── Suite 1: Rendering ───────────────────────────────────────────────────────

describe('DatePicker — rendering', () => {
  it('renders a trigger button', () => {
    render(<DatePicker />)
    expect(screen.getByTestId('datepicker-trigger')).toBeInTheDocument()
  })

  it('shows placeholder when no date is selected', () => {
    render(<DatePicker placeholder="Pick a date" />)
    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })

  it('renders a visible label element when label prop is provided', () => {
    render(<DatePicker label="Due date" />)
    expect(screen.getByText('Due date')).toBeInTheDocument()
  })

  it('associates label with trigger via htmlFor', () => {
    render(<DatePicker label="Due date" id="my-dp" />)
    const label = screen.getByText('Due date')
    expect(label).toHaveAttribute('for', 'my-dp')
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('id', 'my-dp')
  })

  it('does not render the dialog initially', () => {
    render(<DatePicker />)
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('renders trigger as disabled when disabled prop is true', () => {
    render(<DatePicker disabled />)
    expect(screen.getByTestId('datepicker-trigger')).toBeDisabled()
  })

  it('displays the defaultValue date in the trigger', () => {
    render(<DatePicker defaultValue="2024-03-15" />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('March')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('15')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('2024')
  })
})

// ─── Suite 2: Open / Close ────────────────────────────────────────────────────

describe('DatePicker — open / close', () => {
  it('opens the calendar dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    await user.click(screen.getByTestId('datepicker-trigger'))
    expect(screen.getByTestId('datepicker-dialog')).toBeInTheDocument()
  })

  it('closes the calendar when trigger is clicked again', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    const trigger = screen.getByTestId('datepicker-trigger')
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('does not open the calendar when disabled', async () => {
    const user = userEvent.setup()
    render(<DatePicker disabled />)
    await user.click(screen.getByTestId('datepicker-trigger'))
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('sets aria-expanded=true on trigger when open', async () => {
    const user = userEvent.setup()
    render(<DatePicker />)
    const trigger = screen.getByTestId('datepicker-trigger')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the calendar on Escape and returns focus to trigger', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" />)
    await user.click(screen.getByTestId('datepicker-trigger'))
    expect(screen.getByTestId('datepicker-dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('datepicker-trigger')).toHaveFocus()
  })
})

// ─── Suite 3: Date selection ──────────────────────────────────────────────────

describe('DatePicker — date selection', () => {
  it('selects a date by clicking a day cell', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-01" />)
    await openCalendar(user)
    await clickDay(user, '2024-06-15')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('June')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('15')
  })

  it('marks the selected day cell with aria-selected=true', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-01" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-01')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('day-2024-06-10')).toHaveAttribute('aria-selected', 'false')
  })

  it('closes the dialog after a day is selected', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-01" />)
    await openCalendar(user)
    await clickDay(user, '2024-06-20')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('calls onChange with ISO string when a date is selected', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-01" onChange={onChange} />)
    await openCalendar(user)
    await clickDay(user, '2024-06-18')
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('2024-06-18')
  })
})

// ─── Suite 4: Controlled mode ─────────────────────────────────────────────────

describe('DatePicker — controlled mode', () => {
  it('displays the controlled value in the trigger', () => {
    render(<DatePicker value="2025-01-20" onChange={() => {}} />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('January')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('20')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('2025')
  })

  it('calls onChange but does not update display without parent re-render', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker value="2025-01-20" onChange={onChange} />)
    await openCalendar(user)
    await clickDay(user, '2025-01-25')
    expect(onChange).toHaveBeenCalledWith('2025-01-25')
  })

  it('updates display when controlled value prop changes', () => {
    const { rerender } = render(<DatePicker value="2025-01-20" onChange={() => {}} />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('January')
    rerender(<DatePicker value="2025-07-04" onChange={() => {}} />)
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('July')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('4')
  })

  it('works as a fully-controlled component via wrapper state', async () => {
    const user = userEvent.setup()
    function Wrapper() {
      const [v, setV] = useState('2024-03-01')
      return <DatePicker value={v} onChange={setV} />
    }
    render(<Wrapper />)
    await openCalendar(user)
    await clickDay(user, '2024-03-22')
    expect(screen.getByTestId('datepicker-trigger')).toHaveTextContent('22')
  })
})

// ─── Suite 5: min / max constraints ──────────────────────────────────────────

describe('DatePicker — min / max constraints', () => {
  it('renders dates before min as disabled', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-05')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('day-2024-06-09')).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders dates after max as disabled', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" max="2024-06-20" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-21')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('day-2024-06-30')).toHaveAttribute('aria-disabled', 'true')
  })

  it('does not call onChange when a disabled date is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" onChange={onChange} />)
    await openCalendar(user)
    await user.click(screen.getByTestId('day-2024-06-05'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByTestId('datepicker-dialog')).toBeInTheDocument()
  })

  it('dates within min/max range are not disabled', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" max="2024-06-20" />)
    await openCalendar(user)
    expect(screen.getByTestId('day-2024-06-15')).toHaveAttribute('aria-disabled', 'false')
  })

  it('clamps keyboard navigation at min boundary', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-10" min="2024-06-10" />)
    await openCalendar(user)
    const grid = screen.getByRole('grid')
    await user.type(grid, '{ArrowLeft}')
    expect(screen.getByTestId('day-2024-06-10')).toHaveAttribute('tabindex', '0')
  })

  it('clamps keyboard navigation at max boundary', async () => {
    const user = userEvent.setup()
    render(<DatePicker defaultValue="2024-06-20" max="2024-06-20" />)
    await openCalendar(user)
    const grid = screen.getByRole('grid')
    await user.type(grid, '{ArrowRight}')
    expect(screen.getByTestId('day-2024-06-20')).toHaveAttribute('tabindex', '0')
  })
})
