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
 * | Key                        | Action                                      |
 * |----------------------------|---------------------------------------------|
 * | Arrow keys                 | Move focus by day                           |
 * | Home / End                 | First / last day of month                   |
 * | PageUp / PageDown          | Previous / next month                       |
 * | Shift + PageUp / PageDown  | Previous / next year                        |
 * | Enter / Space              | Select focused date                         |
 * | Escape                     | Close calendar, return focus to trigger     |
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
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
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
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
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
 * <DatePicker label="Due date" />
 *
 * // Controlled
 * const [date, setDate] = useState('')
 * <DatePicker label="Due date" value={date} onChange={setDate} />
 *
 * // With bounds
 * <DatePicker label="Due date" min="2024-01-01" max="2024-12-31" />
 *
 * // Localised
 * <DatePicker label="Fälligkeitsdatum" locale="de" />
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
  const autoId = useId()
  const inputId  = idProp ?? `datepicker-${autoId}`
  const dialogId = `datepicker-dialog-${autoId}`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const selected = isControlled ? (value ?? '') : internalValue

  const [open, setOpen] = useState(false)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const initialFocus = parseDate(selected) ?? today

  const [focusedDate, setFocusedDate] = useState<Date>(initialFocus)
  const [viewYear,    setViewYear]    = useState(initialFocus.getFullYear())
  const [viewMonth,   setViewMonth]   = useState(initialFocus.getMonth())

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
      ) { setOpen(false) }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // Focus grid when dialog opens (roving tabindex cell first, then table fallback)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
        if (cell) { cell.focus() } else { gridRef.current?.focus() }
      })
    }
  }, [open])

  // Re-focus active cell when displayed month/year changes
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
      if (cell) { cell.focus() } else { gridRef.current?.focus() }
    })
  }, [viewMonth, viewYear, open])

  const selectDate = useCallback((d: Date) => {
    const str = toDateStr(d)
    if (!isControlled) setInternalValue(str)
    onChange?.(str)
    setOpen(false)
    triggerRef.current?.focus()
  }, [isControlled, onChange])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  const prevYear = () => setViewYear(y => y - 1)
  const nextYear = () => setViewYear(y => y + 1)

  const moveFocus = useCallback((delta: number) => {
    setFocusedDate(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + delta)
      const clamped = clampDate(next, minDate, maxDate)
      setViewYear(clamped.getFullYear())
      setViewMonth(clamped.getMonth())
      return clamped
    })
  }, [minDate, maxDate])

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableElement>) => {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); moveFocus(1);  break
      case 'ArrowLeft':  e.preventDefault(); moveFocus(-1); break
      case 'ArrowDown':  e.preventDefault(); moveFocus(7);  break
      case 'ArrowUp':    e.preventDefault(); moveFocus(-7); break
      case 'Home':       e.preventDefault()
        setFocusedDate(prev => {
          const d = new Date(prev.getFullYear(), prev.getMonth(), 1)
          return clampDate(d, minDate, maxDate)
        }); break
      case 'End':        e.preventDefault()
        setFocusedDate(prev => {
          const d = new Date(prev.getFullYear(), prev.getMonth(),
                             daysInMonth(prev.getFullYear(), prev.getMonth()))
          return clampDate(d, minDate, maxDate)
        }); break
      case 'PageUp':     e.preventDefault()
        if (e.shiftKey) prevYear(); else prevMonth(); break
      case 'PageDown':   e.preventDefault()
        if (e.shiftKey) nextYear(); else nextMonth(); break
      case 'Enter':
      case ' ':          e.preventDefault()
        if (!isDisabledDate(focusedDate)) selectDate(focusedDate); break
      case 'Escape':     e.preventDefault(); setOpen(false); triggerRef.current?.focus(); break
    }
  }, [focusedDate, moveFocus, minDate, maxDate, selectDate])

  function isDisabledDate(d: Date): boolean {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  // Build calendar grid
  const totalDays   = daysInMonth(viewYear, viewMonth)
  const startOffset = firstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const dayLabels      = getDayLabels(locale)
  const monthYearLabel = getMonthYearLabel(viewYear, viewMonth, locale)
  const displayValue   = formatDisplay(selected, locale)

  // aria-label for trigger: use label prop if provided, else "Choose date"
  const triggerAriaLabel = label ?? 'Choose date'
  // aria-label for dialog: always "Choose date" (spec §8)
  const dialogAriaLabel = 'Choose date'

  return (
    <div className={styles.root}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={triggerAriaLabel}
        data-testid="datepicker-trigger"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <span className={displayValue ? styles.triggerValue : styles.triggerPlaceholder}>
          {displayValue || placeholder}
        </span>
        <svg className={styles.icon} aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd" />
        </svg>
      </button>

      {/* Calendar dialog */}
      {open && (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label={dialogAriaLabel}
          data-testid="datepicker-dialog"
          className={styles.dialog}
        >
          {/* Month / year navigation */}
          <div className={styles.header}>
            <button
              type="button"
              onClick={prevYear}
              aria-label="Previous year"
              data-testid="prev-year"
              className={styles.navBtn}
            >«</button>
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              data-testid="prev-month"
              className={styles.navBtn}
            >‹</button>
            <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
              {monthYearLabel}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              data-testid="next-month"
              className={styles.navBtn}
            >›</button>
            <button
              type="button"
              onClick={nextYear}
              aria-label="Next year"
              data-testid="next-year"
              className={styles.navBtn}
            >»</button>
          </div>

          {/* Day grid */}
          <table
            ref={gridRef}
            role="grid"
            aria-label={monthYearLabel}
            className={styles.grid}
            tabIndex={-1}
            onKeyDown={handleGridKeyDown}
          >
            <thead>
              <tr>
                {dayLabels.map(d => (
                  <th key={d} scope="col" abbr={d} className={styles.dayHeader}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    if (day === null) {
                      return <td key={di} className={styles.empty} aria-hidden="true" />
                    }
                    const cellDate = new Date(viewYear, viewMonth, day)
                    const dateStr  = toDateStr(cellDate)
                    const isSelected  = dateStr === selected
                    const isToday     = dateStr === toDateStr(today)
                    const isDisabled  = isDisabledDate(cellDate)
                    const isFocused   = toDateStr(focusedDate) === dateStr

                    return (
                      <td key={di} role="gridcell">
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          disabled={isDisabled}
                          aria-selected={isSelected}
                          aria-disabled={isDisabled ? 'true' : 'false'}
                          aria-label={cellDate.toLocaleDateString(locale, {
                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                          })}
                          data-testid={`day-${dateStr}`}
                          className={[
                            styles.day,
                            isSelected ? styles.daySelected : '',
                            isToday    ? styles.dayToday    : '',
                            isDisabled ? styles.dayDisabled : '',
                          ].join(' ').trim()}
                          onClick={() => !isDisabled && selectDate(cellDate)}
                          onFocus={() => setFocusedDate(cellDate)}
                        >
                          {day}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DatePicker
