/**
 * DatePicker — comprehensive tests (S-9)
 *
 * Covers everything NOT in the original 30-case suite:
 *   - Leap-year edge cases (Feb 29, century years, 400-year rule)
 *   - Month-boundary navigation (31-day, 30-day, 28-day months)
 *   - All keyboard navigation keys (Arrow*, Home, End, PageUp/Down,
 *     Shift+PageUp/Down, Enter, Space, Escape)
 *   - ARIA attribute completeness (aria-controls linkage, aria-label,
 *     scope, aria-live, aria-atomic)
 *   - Label association (htmlFor / id)
 *   - Locale rendering (French month names)
 *   - Today-button disabled when today is outside min/max range
 *   - Keyboard selection via Enter and Space
 *   - Focus clamping at min/max boundaries
 */
import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DatePicker } from '../components/DatePicker'

// ─── helpers ─────────────────────────────────────────────────────────────────

function openPicker() {
  fireEvent.click(screen.getByTestId('datepicker-trigger'))
}

function grid() {
  return screen.getByRole('grid')
}

// ─── Leap year ────────────────────────────────────────────────────────────────

describe('DatePicker — leap year edge cases', () => {
  it('renders Feb 29 in a leap year (2024)', () => {
    render(<DatePicker defaultValue="2024-02-01" />)
    openPicker()
    expect(screen.getByTestId('day-2024-02-29')).toBeInTheDocument()
  })

  it('does NOT render Feb 29 in a non-leap year (2023)', () => {
    render(<DatePicker defaultValue="2023-02-01" />)
    openPicker()
    expect(screen.queryByTestId('day-2023-02-29')).not.toBeInTheDocument()
  })

  it('renders Feb 28 as the last day in a non-leap year', () => {
    render(<DatePicker defaultValue="2023-02-01" />)
    openPicker()
    expect(screen.getByTestId('day-2023-02-28')).toBeInTheDocument()
    expect(screen.queryByTestId('day-2023-03-01')).not.toBeInTheDocument()
  })

  it('can select Feb 29 in a leap year', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-02-01" onChange={onChange} />)
    openPicker()
    fireEvent.click(screen.getByTestId('day-2024-02-29'))
    expect(onChange).toHaveBeenCalledWith('2024-02-29')
  })

  it('century non-leap year (1900) has no Feb 29', () => {
    render(<DatePicker defaultValue="1900-02-01" />)
    openPicker()
    expect(screen.queryByTestId('day-1900-02-29')).not.toBeInTheDocument()
    expect(screen.getByTestId('day-1900-02-28')).toBeInTheDocument()
  })

  it('400-year leap year (2000) has Feb 29', () => {
    render(<DatePicker defaultValue="2000-02-01" />)
    openPicker()
    expect(screen.getByTestId('day-2000-02-29')).toBeInTheDocument()
  })
})

// ─── Month boundaries ─────────────────────────────────────────────────────────

describe('DatePicker — month boundary day counts', () => {
  it('January has 31 days', () => {
    render(<DatePicker defaultValue="2024-01-01" />)
    openPicker()
    expect(screen.getByTestId('day-2024-01-31')).toBeInTheDocument()
    expect(screen.queryByTestId('day-2024-01-32')).not.toBeInTheDocument()
  })

  it('April has 30 days (not 31)', () => {
    render(<DatePicker defaultValue="2024-04-01" />)
    openPicker()
    expect(screen.getByTestId('day-2024-04-30')).toBeInTheDocument()
    expect(screen.queryByTestId('day-2024-04-31')).not.toBeInTheDocument()
  })

  it('navigating prev-month from March lands on February with correct day count (leap)', () => {
    render(<DatePicker defaultValue="2024-03-15" />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('February 2024')).toBeInTheDocument()
    expect(screen.getByTestId('day-2024-02-29')).toBeInTheDocument()
  })

  it('navigating prev-month from January wraps to December with 31 days', () => {
    render(<DatePicker defaultValue="2024-01-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('prev-month'))
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('December 2023')).toBeInTheDocument()
    expect(screen.getByTestId('day-2023-12-31')).toBeInTheDocument()
  })

  it('navigating next-month from December wraps to January of next year', () => {
    render(<DatePicker defaultValue="2024-12-01" />)
    openPicker()
    fireEvent.click(screen.getByTestId('next-month'))
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('January 2025')).toBeInTheDocument()
    expect(screen.getByTestId('day-2025-01-31')).toBeInTheDocument()
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('DatePicker — keyboard navigation', () => {
  it('ArrowRight moves focus forward one day', () => {
    render(<DatePicker defaultValue="2024-06-10" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowRight' })
    expect(screen.getByTestId('day-2024-06-11').tabIndex).toBe(0)
  })

  it('ArrowLeft moves focus back one day', () => {
    render(<DatePicker defaultValue="2024-06-10" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowLeft' })
    expect(screen.getByTestId('day-2024-06-09').tabIndex).toBe(0)
  })

  it('ArrowDown moves focus forward one week', () => {
    render(<DatePicker defaultValue="2024-06-10" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowDown' })
    expect(screen.getByTestId('day-2024-06-17').tabIndex).toBe(0)
  })

  it('ArrowUp moves focus back one week', () => {
    render(<DatePicker defaultValue="2024-06-10" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowUp' })
    expect(screen.getByTestId('day-2024-06-03').tabIndex).toBe(0)
  })

  it('Home moves focus to first day of month', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'Home' })
    expect(screen.getByTestId('day-2024-06-01').tabIndex).toBe(0)
  })

  it('End moves focus to last day of month', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'End' })
    expect(screen.getByTestId('day-2024-06-30').tabIndex).toBe(0)
  })

  it('PageUp navigates to previous month', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'PageUp' })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('May 2024')).toBeInTheDocument()
  })

  it('PageDown navigates to next month', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'PageDown' })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('July 2024')).toBeInTheDocument()
  })

  it('Shift+PageUp navigates to previous year', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'PageUp', shiftKey: true })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('June 2023')).toBeInTheDocument()
  })

  it('Shift+PageDown navigates to next year', () => {
    render(<DatePicker defaultValue="2024-06-15" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'PageDown', shiftKey: true })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('June 2025')).toBeInTheDocument()
  })

  it('Enter selects the focused date and closes dialog', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-15" onChange={onChange} />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('2024-06-15')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('Space selects the focused date and closes dialog', () => {
    const onChange = vi.fn()
    render(<DatePicker defaultValue="2024-06-15" onChange={onChange} />)
    openPicker()
    fireEvent.keyDown(grid(), { key: ' ' })
    expect(onChange).toHaveBeenCalledWith('2024-06-15')
    expect(screen.queryByTestId('datepicker-dialog')).not.toBeInTheDocument()
  })

  it('ArrowRight across month boundary advances view to next month', () => {
    render(<DatePicker defaultValue="2024-06-30" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowRight' })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('July 2024')).toBeInTheDocument()
  })

  it('ArrowLeft across month boundary retreats view to previous month', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowLeft' })
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(within(dialog).getByText('May 2024')).toBeInTheDocument()
  })

  it('focus is clamped at min boundary when navigating left', () => {
    render(<DatePicker defaultValue="2024-06-10" min="2024-06-10" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowLeft' })
    expect(screen.getByTestId('day-2024-06-10').tabIndex).toBe(0)
  })

  it('focus is clamped at max boundary when navigating right', () => {
    render(<DatePicker defaultValue="2024-06-20" max="2024-06-20" />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'ArrowRight' })
    expect(screen.getByTestId('day-2024-06-20').tabIndex).toBe(0)
  })
})

// ─── Disabled dates ───────────────────────────────────────────────────────────

describe('DatePicker — disabled dates', () => {
  it('all days before min have aria-disabled="true"', () => {
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    openPicker()
    ;['day-2024-06-01', 'day-2024-06-05', 'day-2024-06-09'].forEach(tid => {
      expect(screen.getByTestId(tid)).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('all days after max have aria-disabled="true"', () => {
    render(<DatePicker defaultValue="2024-06-15" max="2024-06-20" />)
    openPicker()
    ;['day-2024-06-21', 'day-2024-06-25', 'day-2024-06-30'].forEach(tid => {
      expect(screen.getByTestId(tid)).toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('min date itself is NOT disabled', () => {
    render(<DatePicker defaultValue="2024-06-15" min="2024-06-10" />)
    openPicker()
    expect(screen.getByTestId('day-2024-06-10')).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('max date itself is NOT disabled', () => {
    render(<DatePicker defaultValue="2024-06-15" max="2024-06-20" />)
    openPicker()
    expect(screen.getByTestId('day-2024-06-20')).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('Today button is disabled when today is before min', () => {
    render(<DatePicker min="2099-01-01" />)
    openPicker()
    expect(screen.getByTestId('today-btn')).toBeDisabled()
  })

  it('Today button is disabled when today is after max', () => {
    render(<DatePicker max="2000-01-01" />)
    openPicker()
    expect(screen.getByTestId('today-btn')).toBeDisabled()
  })

  it('Enter on a disabled focused date does NOT call onChange', () => {
    const onChange = vi.fn()
    // defaultValue is after max, so the focused date is disabled
    render(<DatePicker defaultValue="2024-06-20" max="2024-06-15" onChange={onChange} />)
    openPicker()
    fireEvent.keyDown(grid(), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })
})

// ─── ARIA completeness ────────────────────────────────────────────────────────

describe('DatePicker — ARIA completeness', () => {
  it('trigger aria-controls points to the dialog id', () => {
    render(<DatePicker />)
    const trigger = screen.getByTestId('datepicker-trigger')
    const controlsId = trigger.getAttribute('aria-controls')
    expect(controlsId).toBeTruthy()
    openPicker()
    const dialog = screen.getByTestId('datepicker-dialog')
    expect(dialog.id).toBe(controlsId)
  })

  it('grid has aria-label matching the displayed month/year', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', 'June 2024')
  })

  it('month/year span has aria-live="polite" and aria-atomic="true"', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    const dialog = screen.getByTestId('datepicker-dialog')
    const liveRegion = dialog.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
  })

  it('day-of-week headers have scope="col"', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    const headers = screen.getAllByRole('columnheader')
    expect(headers.length).toBe(7)
    headers.forEach(th => {
      expect(th).toHaveAttribute('scope', 'col')
    })
  })

  it('each day cell has role="gridcell"', () => {
    render(<DatePicker defaultValue="2024-06-01" />)
    openPicker()
    const cells = screen.getAllByRole('gridcell')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('trigger aria-expanded reflects open state', () => {
    render(<DatePicker />)
    const trigger = screen.getByTestId('datepicker-trigger')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    openPicker()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('dialog has aria-label="Choose date"', () => {
    render(<DatePicker />)
    openPicker()
    expect(screen.getByTestId('datepicker-dialog')).toHaveAttribute('aria-label', 'Choose date')
  })
})

// ─── Label association ────────────────────────────────────────────────────────

describe('DatePicker — label association', () => {
  it('renders a visible label when label prop is provided', () => {
    render(<DatePicker label="Departure date" />)
    expect(screen.getByText('Departure date')).toBeInTheDocument()
  })

  it('label htmlFor matches trigger id', () => {
    render(<DatePicker label="Departure date" id="dep-date" />)
    const label = screen.getByText('Departure date')
    expect(label).toHaveAttribute('for', 'dep-date')
    expect(screen.getByTestId('datepicker-trigger')).toHaveAttribute('id', 'dep-date')
  })

  it('auto-generates id when none is provided (label still links)', () => {
    render(<DatePicker label="Return date" />)
    const label = screen.getByText('Return date')
    const forAttr = label.getAttribute('for')
    expect(forAttr).toBeTruthy()
    const trigger = screen.getByTestId('datepicker-trigger')
    expect(trigger.id).toBe(forAttr)
  })
})

// ─── Locale rendering ─────────────────────────────────────────────────────────

describe('DatePicker — locale rendering', () => {
  it('renders month name in French when locale="fr"', () => {
    render(<DatePicker defaultValue="2024-06-01" locale="fr" />)
    openPicker()
    const dialog = screen.getByTestId('datepicker-dialog')
    // French: "juin 2024" — check the dialog header contains "juin" (case-insensitive)
    expect(within(dialog).getByText(/juin/i)).toBeInTheDocument()
  })

  it('renders month name in German when locale="de"', () => {
    render(<DatePicker defaultValue="2024-06-01" locale="de" />)
    openPicker()
    const dialog = screen.getByTestId('datepicker-dialog')
    // German: "Juni 2024"
    expect(within(dialog).getByText(/juni/i)).toBeInTheDocument()
  })
})
