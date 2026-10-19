/**
 * DateRangePicker — unit + integration tests, Part 1 (S-9)
 *
 * Suite 1: Rendering
 * Suite 2: Open / Close
 * Suite 3: Range selection (two-click flow)
 * Suite 4: onChange contract
 * Suite 5: Controlled mode
 */
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('DateRangePicker — rendering', () => {
  it('renders a trigger button', () => {
    render(<DateRangePicker />)
    expect(screen.getByTestId('drp-trigger')).toBeInTheDocument()
  })
  it('shows placeholder when no range is selected', () => {
    render(<DateRangePicker placeholder="Pick a range" />)
    expect(screen.getByText('Pick a range')).toBeInTheDocument()
  })
  it('does not render the dialog initially', () => {
    render(<DateRangePicker />)
    expect(screen.queryByTestId('drp-dialog')).not.toBeInTheDocument()
  })
  it('renders trigger as disabled when disabled prop is true', () => {
    render(<DateRangePicker disabled />)
    expect(screen.getByTestId('drp-trigger')).toBeDisabled()
  })
  it('renders a visible label element when label prop is provided', () => {
    render(<DateRangePicker label="Booking period" />)
    expect(screen.getByText('Booking period')).toBeInTheDocument()
  })
  it('displays the defaultValue start date in the trigger', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} />)
    const trigger = screen.getByTestId('drp-trigger')
    expect(trigger).toHaveTextContent('June')
    expect(trigger).toHaveTextContent('10')
    expect(trigger).toHaveTextContent('2024')
  })
  it('displays both start and end dates in the trigger when a full range is set', () => {
    render(<DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} />)
    const trigger = screen.getByTestId('drp-trigger')
    expect(trigger.textContent).toMatch(/10/)
    expect(trigger.textContent).toMatch(/20/)
  })
})

describe('DateRangePicker — open / close', () => {
  it('opens the calendar dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-dialog')).toBeInTheDocument()
  })
  it('closes the calendar when trigger is clicked again', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    const trigger = screen.getByTestId('drp-trigger')
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByTestId('drp-dialog')).not.toBeInTheDocument()
  })
  it('does not open the calendar when disabled', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker disabled />)
    await user.click(screen.getByTestId('drp-trigger'))
    expect(screen.queryByTestId('drp-dialog')).not.toBeInTheDocument()
  })
  it('sets aria-expanded=true on trigger when open', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    const trigger = screen.getByTestId('drp-trigger')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
  it('closes the calendar on Escape and returns focus to trigger', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-10' }} />)
    await openPickerAsync(user)
    await user.keyboard('{Escape}')
    expect(screen.queryByTestId('drp-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('drp-trigger')).toHaveFocus()
  })
})

describe('DateRangePicker — range selection', () => {
  it('first click sets the start date (aria-selected=true on start cell)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    expect(screen.getByTestId('drp-day-2024-06-05')).toHaveAttribute('aria-selected', 'true')
  })
  it('second click sets the end date and closes the dialog', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    await clickDay(user, '2024-06-15')
    expect(screen.queryByTestId('drp-dialog')).not.toBeInTheDocument()
  })
  it('clicking a date earlier than current start resets start', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-15' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2024-06-05' }))
  })
  it('start cell has aria-selected=true after selection', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-10')
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-10')).toHaveAttribute('aria-selected', 'true')
  })
  it('end cell has aria-selected=true after full range selection', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    await clickDay(user, '2024-06-20')
    await openPickerAsync(user)
    expect(screen.getByTestId('drp-day-2024-06-20')).toHaveAttribute('aria-selected', 'true')
  })
  it('trigger shows updated range after selection', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    await clickDay(user, '2024-06-20')
    const trigger = screen.getByTestId('drp-trigger')
    expect(trigger.textContent).toMatch(/5/)
    expect(trigger.textContent).toMatch(/20/)
  })
})

describe('DateRangePicker — onChange contract', () => {
  it('calls onChange with start-only range after first click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-10')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ start: '2024-06-10' }))
  })
  it('calls onChange with full range after second click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    await clickDay(user, '2024-06-20')
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as DateRange
    expect(lastCall.start).toBe('2024-06-05')
    expect(lastCall.end).toBe('2024-06-20')
  })
  it('calls onChange with ISO strings (YYYY-MM-DD format)', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker defaultValue={{ start: '2024-06-01' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-15')
    const arg = onChange.mock.calls[0][0] as DateRange
    expect(arg.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('DateRangePicker — controlled mode', () => {
  it('displays the controlled value in the trigger', () => {
    render(<DateRangePicker value={{ start: '2024-06-10', end: '2024-06-20' }} onChange={() => {}} />)
    const trigger = screen.getByTestId('drp-trigger')
    expect(trigger.textContent).toMatch(/10/)
    expect(trigger.textContent).toMatch(/20/)
  })
  it('calls onChange but does not update display without parent re-render', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DateRangePicker value={{ start: '2024-06-10', end: '2024-06-20' }} onChange={onChange} />)
    await openPickerAsync(user)
    await clickDay(user, '2024-06-05')
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByTestId('drp-trigger').textContent).toMatch(/10/)
  })
  it('updates display when controlled value prop changes', () => {
    function Wrapper() {
      const [range, setRange] = useState<DateRange>({ start: '2024-06-10', end: '2024-06-20' })
      return (
        <>
          <DateRangePicker value={range} onChange={setRange} />
          <button onClick={() => setRange({ start: '2024-07-01', end: '2024-07-15' })}>Update</button>
        </>
      )
    }
    render(<Wrapper />)
    fireEvent.click(screen.getByText('Update'))
    expect(screen.getByTestId('drp-trigger').textContent).toMatch(/July/)
  })
})
