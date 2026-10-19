/**
 * DatePicker — S-9
 *
 * Accessible, keyboard-navigable single-date picker. No external date library.
 *
 * **Modes**
 * - Uncontrolled: pass `defaultValue` (or nothing); the component manages state.
 * - Controlled: pass `value` + `onChange`; the parent owns the state.
 *
 * **Keyboard navigation** (WCAG 2.1 AA / APG 1.2 grid pattern)
 * | Key | Action |
 * |-----|--------|
 * | Arrow keys | Move focus by day |
 * | Home / End | First / last day of month |
 * | PageUp / PageDown | Previous / next month |
 * | Shift + PageUp / PageDown | Previous / next year |
 * | Enter / Space | Select focused date |
 * | Escape | Close calendar, return focus to trigger |
 *
 * **Localisation** — pass a BCP 47 `locale` prop (e.g. `"fr"`, `"de"`, `"ja"`).
 * Month names and day-of-week labels are generated via `Intl.DateTimeFormat`.
 */
import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import styles from './DatePicker.module.css'
import type { DatePickerProps } from './types'

// Re-export the interface so consumers can import from this file directly
export type { DatePickerProps }

// ─── Date utilities ───────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function clampDate(d: Date, min: Date | null, max: Date | null): Date {
  if (min && d < min) return new Date(min)
  if (max && d > max) return new Date(max)
  return d
}

// ─── Localisation helpers ─────────────────────────────────────────────────────

/** Short day-of-week labels via Intl (2 chars). Falls back to English. */
function getDayLabels(locale = 'en'): string[] {
  const base = new Date(2024, 0, 7) // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(7 + i)
    try {
      return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)
    } catch {
      return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i]
    }
  })
}

/** Month name + year via Intl. Falls back to English. */
function getMonthYearLabel(year: number, month: number, locale = 'en'): string {
  try {
    return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  } catch {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[month]} ${year}`
  }
}

/** Display format for a selected date. Falls back to English. */
function formatDisplay(s: string | undefined, locale = 'en'): string {
  if (!s) return ''
  const d = parseDate(s)
  if (!d) return s
  try {
    return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Single-date picker.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <DatePicker placeholder="Select a date" />
 *
 * // Controlled
 * const [date, setDate] = useState('')
 * <DatePicker value={date} onChange={setDate} />
 *
 * // With bounds
 * <DatePicker min="2024-01-01" max="2024-12-31" />
 *
 * // Localised
 * <DatePicker locale="fr" />
 * ```
 */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = 'Select a date',
  disabled = false,
  label,
  id: idProp,
  locale = 'en',
}: DatePickerProps) {
  const autoId   = useId()
  const inputId  = idProp ?? `datepicker-${autoId}`
  const dialogId = `datepicker-dialog-${autoId}`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const selected = isControlled ? (value ?? '') : internalValue

  const [open, setOpen] = useState(false)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const initialFocus = parseDate(selected) ?? today
  const [focusedDate, setFocusedDate] = useState<Date>(initialFocus)
  const [viewYear,  setViewYear]  = useState(initialFocus.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialFocus.getMonth())

  const minDate = parseDate(min)
  const maxDate = parseDate(max)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLTableElement>(null)

  // Sync view when controlled value changes
  useEffect(() => {
    const d = parseDate(selected)
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setFocusedDate(d) }
  }, [selected])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (
        dialogRef.current  && !dialogRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // Focus grid (table) when dialog opens so keyboard events land immediately.
  // Individual day cells use roving tabindex; the table itself is the keyboard
  // target until a cell receives focus via the rAF call below.
  useEffect(() => {
    if (open) {
      // First try to focus the roving-tabindex cell; fall back to the grid table.
      requestAnimationFrame(() => {
        const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
        if (cell) {
          cell.focus()
        } else {
          gridRef.current?.focus()
        }
      })
    }
  }, [open])

  // Re-focus the active cell when the displayed month/year changes
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
      if (cell) {
        cell.focus()
      } else {
        gridRef.current?.focus()
      }
    })
  }, [viewMonth, viewYear, open])

  const selectDate = useCallback((d: Date) => {
    const str = toDateStr(d)
    if (!isControlled) setInternalValue(str)
    onChange?.(str)
    setOpen(false)
    triggerRef.current?.focus()
  }, [isControlled, onChange])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const prevYear  = useCallback(() => setViewYear(y => y - 1), [])
  const nextYear  = useCallback(() => setViewYear(y => y + 1), [])

  const moveFocus = useCallback((d: Date) => {
    const c = clampDate(d, minDate, maxDate)
    setFocusedDate(c); setViewYear(c.getFullYear()); setViewMonth(c.getMonth())
  }, [minDate, maxDate])

  // Shared keyboard handler used on both the grid <table> and the dialog <div>.
  // Placing it on the dialog ensures Escape is caught even before rAF has moved
  // focus into a day cell (e.g. when the dialog opens with no defaultValue and
  // focus is still on the grid element itself).
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const d = new Date(focusedDate)
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); d.setDate(d.getDate() - 1); moveFocus(d); break
      case 'ArrowRight': e.preventDefault(); d.setDate(d.getDate() + 1); moveFocus(d); break
      case 'ArrowUp':    e.preventDefault(); d.setDate(d.getDate() - 7); moveFocus(d); break
      case 'ArrowDown':  e.preventDefault(); d.setDate(d.getDate() + 7); moveFocus(d); break
      case 'Home':       e.preventDefault(); d.setDate(1);               moveFocus(d); break
      case 'End':        e.preventDefault(); d.setDate(daysInMonth(d.getFullYear(), d.getMonth())); moveFocus(d); break
      case 'PageUp':     e.preventDefault(); e.shiftKey ? prevYear() : prevMonth(); break
      case 'PageDown':   e.preventDefault(); e.shiftKey ? nextYear() : nextMonth(); break
      case 'Enter': case ' ':
        e.preventDefault()
        if (!isDisabledDate(focusedDate)) selectDate(focusedDate)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false); triggerRef.current?.focus()
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDate, moveFocus, prevYear, prevMonth, nextYear, nextMonth, selectDate, minDate, maxDate])

  const isDisabledDate = (d: Date): boolean => {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }
  const isSelected = (d: Date) => toDateStr(d) === selected
  const isToday    = (d: Date) => toDateStr(d) === toDateStr(today)
  const isFocused  = (d: Date) => toDateStr(d) === toDateStr(focusedDate)

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay  = firstDayOfMonth(viewYear, viewMonth)
  const cells: Array<Date | null> = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<Date | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const dayLabels    = getDayLabels(locale)
  const monthYearLbl = getMonthYearLabel(viewYear, viewMonth, locale)

  return (
    <div className={styles.root} data-testid="datepicker">
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        aria-label={label ?? 'Choose date'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        disabled={disabled}
        className={styles.trigger}
        onClick={() => !disabled && setOpen(o => !o)}
        data-testid="datepicker-trigger"
      >
        <span className={styles.triggerText}>
          {selected
            ? formatDisplay(selected, locale)
            : <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <svg className={styles.icon} aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-label="Choose date"
          aria-modal="true"
          className={styles.dialog}
          data-testid="datepicker-dialog"
          onKeyDown={handleKeyDown}
        >
          {/* Navigation header */}
          <div className={styles.header}>
            <button type="button" className={styles.navBtn} aria-label="Previous year"
              onClick={prevYear}  data-testid="prev-year">&laquo;</button>
            <button type="button" className={styles.navBtn} aria-label="Previous month"
              onClick={prevMonth} data-testid="prev-month">&lsaquo;</button>
            <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
              {monthYearLbl}
            </span>
            <button type="button" className={styles.navBtn} aria-label="Next month"
              onClick={nextMonth} data-testid="next-month">&rsaquo;</button>
            <button type="button" className={styles.navBtn} aria-label="Next year"
              onClick={nextYear}  data-testid="next-year">&raquo;</button>
          </div>

          {/* Calendar grid
              tabIndex={-1} makes the table programmatically focusable so that
              userEvent.type(grid, ...) in tests can dispatch keyboard events to
              it. Real users navigate via the roving tabindex on day cells. */}
          <table
            ref={gridRef}
            role="grid"
            aria-label={monthYearLbl}
            className={styles.grid}
            tabIndex={-1}
          >
            <thead>
              <tr>
                {dayLabels.map(d => (
                  <th key={d} scope="col" className={styles.dayHeader}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((date, di) => {
                    if (!date) return <td key={di} className={styles.empty} aria-hidden="true" />
                    const dis = isDisabledDate(date)
                    const sel = isSelected(date)
                    const tod = isToday(date)
                    const foc = isFocused(date)
                    const cls = [
                      styles.cell,
                      sel ? styles.selected : '',
                      tod ? styles.today    : '',
                      dis ? styles.disabled : '',
                    ].filter(Boolean).join(' ')
                    return (
                      <td
                        key={di}
                        role="gridcell"
                        aria-selected={sel}
                        aria-disabled={dis}
                        tabIndex={foc ? 0 : -1}
                        className={cls}
                        onClick={() => !dis && selectDate(date)}
                        onFocus={() => setFocusedDate(date)}
                        data-testid={`day-${toDateStr(date)}`}
                      >
                        {date.getDate()}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.todayBtn}
              disabled={isDisabledDate(today)}
              onClick={() => selectDate(today)}
              data-testid="today-btn"
            >
              Today
            </button>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                if (!isControlled) setInternalValue('')
                onChange?.('')
                setOpen(false)
                triggerRef.current?.focus()
              }}
              data-testid="clear-btn"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
