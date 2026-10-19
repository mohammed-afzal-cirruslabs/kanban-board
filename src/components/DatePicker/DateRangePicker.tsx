/**
 * DateRangePicker — S-9
 *
 * Two-click range selection built on the same calendar primitives as
 * `DatePicker`. First click sets `start`; second click sets `end`.
 * Clicking a date earlier than the current `start` resets the selection.
 *
 * Keyboard: identical ARIA grid pattern to `DatePicker`. Tab moves between
 * the two trigger buttons; Enter/Space opens the active trigger's calendar.
 * Within the calendar, all arrow/Home/End/PageUp/PageDown/Escape keys work
 * as specified in WCAG 2.1 AA (APG 1.2 grid pattern).
 *
 * Localisation: pass a BCP 47 `locale` prop (e.g. `"fr"`, `"de"`, `"ja"`).
 * Month and day names are generated via `Intl.DateTimeFormat`.
 */
import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import styles from './DateRangePicker.module.css'
import type { DateRange, DateRangePickerProps } from './types'

// ─── Re-export types so consumers can import from this file ──────────────────
export type { DateRange, DateRangePickerProps }

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/** Format a date for display using Intl, falling back to a simple format. */
function formatDisplay(s: string | undefined, locale = 'en'): string {
  if (!s) return ''
  const d = parseDate(s)
  if (!d) return s
  try {
    return d.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
  } catch {
    // Intl unavailable in test environments — fall back to a simple format
    const months = ['January','February','March','April','May','June',
      'July','August','September','October','November','December']
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
}

/** Short day-of-week labels via Intl. */
function getDayLabels(locale = 'en'): string[] {
  const base = new Date(2024, 0, 7) // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(7 + i)
    try {
      return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2)
    } catch {
      return ['Su','Mo','Tu','We','Th','Fr','Sa'][i]
    }
  })
}

/** Month name via Intl. */
function getMonthName(year: number, month: number, locale = 'en'): string {
  try {
    return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  } catch {
    const months = ['January','February','March','April','May','June',
      'July','August','September','October','November','December']
    return `${months[month]} ${year}`
  }
}

// ─── Calendar sub-component ──────────────────────────────────────────────────

interface CalendarProps {
  viewYear: number
  viewMonth: number
  focusedDate: Date
  rangeStart: Date | null
  rangeEnd: Date | null
  hoverDate: Date | null
  minDate: Date | null
  maxDate: Date | null
  locale: string
  onDayClick: (d: Date) => void
  onDayHover: (d: Date | null) => void
  onFocusDate: (d: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onPrevYear: () => void
  onNextYear: () => void
  onClose: () => void
  gridRef: React.RefObject<HTMLTableElement | null>
  testIdPrefix?: string
}

function Calendar({
  viewYear, viewMonth, focusedDate,
  rangeStart, rangeEnd, hoverDate,
  minDate, maxDate, locale,
  onDayClick, onDayHover, onFocusDate,
  onPrevMonth, onNextMonth, onPrevYear, onNextYear, onClose,
  gridRef, testIdPrefix = '',
}: CalendarProps) {
  const dayLabels = getDayLabels(locale)
  const monthLabel = getMonthName(viewYear, viewMonth, locale)

  const isDisabled = (d: Date) => {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  const isStart   = (d: Date) => rangeStart ? toDateStr(d) === toDateStr(rangeStart) : false
  const isEnd     = (d: Date) => rangeEnd   ? toDateStr(d) === toDateStr(rangeEnd)   : false
  const isFocused = (d: Date) => toDateStr(d) === toDateStr(focusedDate)
  const isToday   = (d: Date) => toDateStr(d) === toDateStr(new Date())

  const isInRange = (d: Date): boolean => {
    const effectiveEnd = rangeEnd ?? hoverDate
    if (!rangeStart || !effectiveEnd) return false
    const lo = rangeStart < effectiveEnd ? rangeStart : effectiveEnd
    const hi = rangeStart < effectiveEnd ? effectiveEnd : rangeStart
    return d > lo && d < hi
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay  = firstDayOfMonth(viewYear, viewMonth)
  const cells: Array<Date | null> = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<Date | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const moveFocus = useCallback((d: Date) => {
    const c = clampDate(d, minDate, maxDate)
    onFocusDate(c)
  }, [minDate, maxDate, onFocusDate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const d = new Date(focusedDate)
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); d.setDate(d.getDate() - 1); moveFocus(d); break
      case 'ArrowRight': e.preventDefault(); d.setDate(d.getDate() + 1); moveFocus(d); break
      case 'ArrowUp':    e.preventDefault(); d.setDate(d.getDate() - 7); moveFocus(d); break
      case 'ArrowDown':  e.preventDefault(); d.setDate(d.getDate() + 7); moveFocus(d); break
      case 'Home':       e.preventDefault(); d.setDate(1);               moveFocus(d); break
      case 'End':        e.preventDefault(); d.setDate(daysInMonth(d.getFullYear(), d.getMonth())); moveFocus(d); break
      case 'PageUp':     e.preventDefault(); e.shiftKey ? onPrevYear() : onPrevMonth(); break
      case 'PageDown':   e.preventDefault(); e.shiftKey ? onNextYear() : onNextMonth(); break
      case 'Enter': case ' ':
        e.preventDefault()
        if (!isDisabled(focusedDate)) onDayClick(focusedDate)
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <>
      <div className={styles.header}>
        <button type="button" className={styles.navBtn} aria-label="Previous year"
          onClick={onPrevYear}  data-testid={`${testIdPrefix}prev-year`}>&laquo;</button>
        <button type="button" className={styles.navBtn} aria-label="Previous month"
          onClick={onPrevMonth} data-testid={`${testIdPrefix}prev-month`}>&lsaquo;</button>
        <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
          {monthLabel}
        </span>
        <button type="button" className={styles.navBtn} aria-label="Next month"
          onClick={onNextMonth} data-testid={`${testIdPrefix}next-month`}>&rsaquo;</button>
        <button type="button" className={styles.navBtn} aria-label="Next year"
          onClick={onNextYear}  data-testid={`${testIdPrefix}next-year`}>&raquo;</button>
      </div>

      <table
        ref={gridRef}
        role="grid"
        aria-label={monthLabel}
        aria-multiselectable="true"
        className={styles.grid}
        onKeyDown={handleKeyDown}
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
                const dis   = isDisabled(date)
                const start = isStart(date)
                const end   = isEnd(date)
                const range = isInRange(date)
                const foc   = isFocused(date)
                const tod   = isToday(date)

                const cls = [
                  styles.cell,
                  start   ? styles.rangeStart : '',
                  end     ? styles.rangeEnd   : '',
                  range   ? styles.inRange    : '',
                  tod     ? styles.today      : '',
                  dis     ? styles.disabled   : '',
                ].filter(Boolean).join(' ')

                return (
                  <td
                    key={di}
                    role="gridcell"
                    aria-selected={start || end}
                    aria-disabled={dis}
                    tabIndex={foc ? 0 : -1}
                    className={cls}
                    onClick={() => !dis && onDayClick(date)}
                    onMouseEnter={() => onDayHover(date)}
                    onMouseLeave={() => onDayHover(null)}
                    onFocus={() => onFocusDate(date)}
                    data-testid={`${testIdPrefix}day-${toDateStr(date)}`}
                  >
                    {date.getDate()}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ─── DateRangePicker ─────────────────────────────────────────────────────────

/**
 * DateRangePicker — two-click range selection.
 *
 * @example
 * ```tsx
 * // Uncontrolled
 * <DateRangePicker placeholder="Select a range" />
 *
 * // Controlled
 * const [range, setRange] = useState<DateRange>({ start: '2024-06-01' })
 * <DateRangePicker value={range} onChange={setRange} />
 * ```
 */
export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  placeholder = 'Select a date range',
  disabled = false,
  label,
  id: idProp,
  locale = 'en',
}: DateRangePickerProps) {
  const autoId   = useId()
  const inputId  = idProp ?? `drp-${autoId}`
  const dialogId = `drp-dialog-${autoId}`

  const isControlled = value !== undefined
  const [internalRange, setInternalRange] = useState<DateRange | undefined>(defaultValue)
  const range = isControlled ? value : internalRange

  // Picking state: null = no start yet, Date = start picked, waiting for end
  const [picking, setPicking] = useState<Date | null>(null)

  const [open, setOpen] = useState(false)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const initialFocus = parseDate(range?.start) ?? today
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
    const d = parseDate(range?.start)
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setFocusedDate(d) }
  }, [range?.start])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (
        dialogRef.current  && !dialogRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setPicking(null)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // Focus grid on open
  useEffect(() => {
    if (open) requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    })
  }, [open])

  // Re-focus grid when month/year changes
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    })
  }, [viewMonth, viewYear, open])

  const handleDayClick = useCallback((d: Date) => {
    if (!picking) {
      // First click — set start
      setPicking(d)
      const partial: DateRange = { start: toDateStr(d) }
      if (!isControlled) setInternalRange(partial)
      onChange?.(partial)
    } else {
      // Second click — set end (or reset if before start)
      let start = picking
      let end   = d
      if (end < start) { start = d; end = picking }
      const complete: DateRange = { start: toDateStr(start), end: toDateStr(end) }
      if (!isControlled) setInternalRange(complete)
      onChange?.(complete)
      setPicking(null)
      setOpen(false)
      triggerRef.current?.focus()
    }
  }, [picking, isControlled, onChange])

  const handleFocusDate = useCallback((d: Date) => {
    const c = clampDate(d, minDate, maxDate)
    setFocusedDate(c)
    setViewYear(c.getFullYear())
    setViewMonth(c.getMonth())
  }, [minDate, maxDate])

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }
  const prevYear  = () => setViewYear(y => y - 1)
  const nextYear  = () => setViewYear(y => y + 1)

  const handleClose = () => {
    setOpen(false)
    setPicking(null)
    triggerRef.current?.focus()
  }

  const handleClear = () => {
    if (!isControlled) setInternalRange(undefined)
    onChange?.({ start: '' })
    setPicking(null)
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Trigger display text
  const triggerText = (): React.ReactNode => {
    if (!range?.start) return <span className={styles.placeholder}>{placeholder}</span>
    const startFmt = formatDisplay(range.start, locale)
    const endFmt   = range.end ? formatDisplay(range.end, locale) : '…'
    return <span className={styles.triggerText}>{startFmt} – {endFmt}</span>
  }

  // Instruction text shown inside the dialog
  const instruction = picking
    ? 'Now click an end date'
    : (range?.start && !range.end ? 'Click an end date' : 'Click a start date')

  return (
    <div className={styles.root} data-testid="daterangepicker">
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        aria-label={label ?? 'Choose date range'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        disabled={disabled}
        className={styles.trigger}
        onClick={() => !disabled && setOpen(o => !o)}
        data-testid="daterangepicker-trigger"
      >
        {triggerText()}
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
          aria-modal="true"
          aria-label="Choose date range"
          className={styles.dialog}
          data-testid="daterangepicker-dialog"
        >
          <p className={styles.instruction} aria-live="polite" aria-atomic="true">
            {instruction}
          </p>

          <Calendar
            viewYear={viewYear}
            viewMonth={viewMonth}
            focusedDate={focusedDate}
            rangeStart={parseDate(picking ? toDateStr(picking) : range?.start)}
            rangeEnd={picking ? null : parseDate(range?.end)}
            hoverDate={hoverDate}
            minDate={minDate}
            maxDate={maxDate}
            locale={locale}
            onDayClick={handleDayClick}
            onDayHover={setHoverDate}
            onFocusDate={handleFocusDate}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onPrevYear={prevYear}
            onNextYear={nextYear}
            onClose={handleClose}
            gridRef={gridRef}
          />

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              data-testid="drp-clear-btn"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
