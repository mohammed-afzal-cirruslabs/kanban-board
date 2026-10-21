/**
 * DateRangePicker — S-9
 *
 * Accessible two-click range picker built on the same Calendar grid as DatePicker.
 * Keyboard navigation follows WCAG 2.1 AA / APG 1.2 grid pattern.
 */
import React, {
  useState, useRef, useEffect, useCallback, useId,
} from 'react'
import styles from './DateRangePicker.module.css'
import type { DateRange, DateRangePickerProps } from './types'

export type { DateRangePickerProps }

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

function normaliseDate(d: Date): Date {
  const n = new Date(d)
  n.setHours(0, 0, 0, 0)
  return n
}

// ─── Localisation helpers ─────────────────────────────────────────────────────

function getDayLabels(locale = 'en'): string[] {
  const base = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(7 + i)
    try { return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2) }
    catch { return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i] }
  })
}

function getMonthYearLabel(year: number, month: number, locale = 'en'): string {
  try {
    return new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  } catch {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December']
    return `${months[month]} ${year}`
  }
}

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

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  minDate: minDateProp,
  maxDate: maxDateProp,
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
  const [internalValue, setInternalValue] = useState<DateRange>(defaultValue ?? {})
  const range: DateRange = isControlled ? (value ?? {}) : internalValue

  const [open, setOpen] = useState(false)
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const minDate: Date | null = minDateProp ? normaliseDate(minDateProp) : parseDate(min)
  const maxDate: Date | null = maxDateProp ? normaliseDate(maxDateProp) : parseDate(max)

  const initView = (() => {
    const d = parseDate(range.start) ?? parseDate(range.end) ?? today
    return { year: d.getFullYear(), month: d.getMonth() }
  })()

  const [viewYear,    setViewYear]    = useState(initView.year)
  const [viewMonth,   setViewMonth]   = useState(initView.month)
  const [focusedDate, setFocusedDate] = useState<Date>(
    parseDate(range.start) ?? parseDate(range.end) ?? today
  )

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLTableElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (
        dialogRef.current  && !dialogRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) { setOpen(false); setPendingStart(null) }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
        if (cell) { cell.focus() } else { gridRef.current?.focus() }
      })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const cell = gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')
      if (cell) { cell.focus() } else { gridRef.current?.focus() }
    })
  }, [viewMonth, viewYear, open])

  const onPrevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const onNextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const onPrevYear  = useCallback(() => setViewYear(y => y - 1), [])
  const onNextYear  = useCallback(() => setViewYear(y => y + 1), [])

  function isDisabled(d: Date): boolean {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  function isInRange(d: Date): boolean {
    const s = parseDate(range.start)
    const e = parseDate(range.end)
    if (!s || !e) return false
    return d > s && d < e
  }

  function isRangeEnd(d: Date): boolean {
    return toDateStr(d) === range.end
  }

  function isRangeStart(d: Date): boolean {
    return toDateStr(d) === range.start
  }

  const onDayClick = useCallback((d: Date) => {
    const str = toDateStr(d)
    if (!pendingStart) {
      setPendingStart(str)
    } else {
      const [start, end] = pendingStart <= str
        ? [pendingStart, str]
        : [str, pendingStart]
      const next: DateRange = { start, end }
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
      setPendingStart(null)
      setOpen(false)
      triggerRef.current?.focus()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStart, isControlled, onChange])

  const moveFocus = useCallback((next: Date) => {
    if (minDate && next < minDate) return
    if (maxDate && next > maxDate) return
    setFocusedDate(next)
    setViewYear(next.getFullYear())
    setViewMonth(next.getMonth())
  }, [minDate, maxDate])

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableElement>) => {
    const d = new Date(focusedDate)
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); d.setDate(d.getDate() + 1); moveFocus(d); break
      case 'ArrowLeft':  e.preventDefault(); d.setDate(d.getDate() - 1); moveFocus(d); break
      case 'ArrowUp':    e.preventDefault(); d.setDate(d.getDate() - 7); moveFocus(d); break
      case 'ArrowDown':  e.preventDefault(); d.setDate(d.getDate() + 7); moveFocus(d); break
      case 'Home':       e.preventDefault(); d.setDate(1);               moveFocus(d); break
      case 'End':        e.preventDefault(); d.setDate(daysInMonth(d.getFullYear(), d.getMonth())); moveFocus(d); break
      case 'PageUp':     e.preventDefault(); if (e.shiftKey) { onPrevYear() } else { onPrevMonth() }; break
      case 'PageDown':   e.preventDefault(); if (e.shiftKey) { onNextYear() } else { onNextMonth() }; break
      case 'Enter': case ' ':
        e.preventDefault()
        if (!isDisabled(focusedDate)) { onDayClick(focusedDate) }
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setPendingStart(null)
        triggerRef.current?.focus()
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDate, moveFocus, onDayClick, onPrevMonth, onNextMonth, onPrevYear, onNextYear])

  // Build calendar grid
  const totalDays   = daysInMonth(viewYear, viewMonth)
  const startOffset = firstDayOfMonth(viewYear, viewMonth)
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const dayLabels      = getDayLabels(locale)
  const monthYearLabel = getMonthYearLabel(viewYear, viewMonth, locale)

  const triggerText = (() => {
    if (!range.start && !range.end) return placeholder
    const s = formatDisplay(range.start, locale)
    const e = formatDisplay(range.end, locale)
    return `${s} – ${e || '…'}`
  })()

  return (
    <div className={styles.root} data-testid="daterangepicker">
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={dialogId}
        aria-label={label ?? 'Choose date range'}
        data-testid="daterangepicker-trigger"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <span className={styles.triggerText}>{triggerText}</span>
        <svg className={styles.icon} aria-hidden="true" viewBox="0 0 16 16" fill="none" width="16" height="16">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v4M11 1v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"/>
        </svg>
      </button>

      {open && (
        <div
          ref={dialogRef}
          id={dialogId}
          role="dialog"
          aria-modal="true"
          aria-label="Choose date range"
          data-testid="daterangepicker-dialog"
          className={styles.dialog}
        >
          <div className={styles.header}>
            <button type="button" onClick={onPrevYear}  aria-label="Previous year"  data-testid="prev-year"  className={styles.navBtn}>«</button>
            <button type="button" onClick={onPrevMonth} aria-label="Previous month" data-testid="prev-month" className={styles.navBtn}>‹</button>
            <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
              {monthYearLabel}
            </span>
            <button type="button" onClick={onNextMonth} aria-label="Next month" data-testid="next-month" className={styles.navBtn}>›</button>
            <button type="button" onClick={onNextYear}  aria-label="Next year"  data-testid="next-year"  className={styles.navBtn}>»</button>
          </div>

          {pendingStart && (
            <p className={styles.hint} aria-live="polite">
              {`Start: ${formatDisplay(pendingStart, locale)} — click an end date`}
            </p>
          )}

          <table
            ref={gridRef}
            role="grid"
            aria-label={monthYearLabel}
            className={styles.grid}
            onKeyDown={handleGridKeyDown}
            tabIndex={-1}
          >
            <thead>
              <tr>
                {dayLabels.map(d => (
                  <th key={d} scope="col" className={styles.dayHeader} aria-label={d}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    if (day == null) {
                      return <td key={di} className={styles.emptyCell} aria-hidden="true" />
                    }
                    const cellDate = new Date(viewYear, viewMonth, day)
                    cellDate.setHours(0, 0, 0, 0)
                    const cellStr    = toDateStr(cellDate)
                    const isFocused  = cellStr === toDateStr(focusedDate)
                    const isDisabledCell = isDisabled(cellDate)
                    const isStart    = isRangeStart(cellDate)
                    const isEnd      = isRangeEnd(cellDate)
                    const inRange    = isInRange(cellDate)
                    const isToday    = cellStr === toDateStr(today)
                    const isPending  = cellStr === pendingStart

                    return (
                      <td key={di} role="gridcell" className={styles.cell}>
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          aria-selected={(isStart || isEnd) ? 'true' : 'false'}
                          aria-disabled={isDisabledCell ? 'true' : 'false'}
                          aria-current={isToday ? 'date' : undefined}
                          data-testid={`day-${cellStr}`}
                          className={[
                            styles.day,
                            isStart || isEnd ? styles.daySelected : '',
                            inRange          ? styles.dayInRange   : '',
                            isToday          ? styles.dayToday     : '',
                            isDisabledCell   ? styles.dayDisabled  : '',
                            isPending        ? styles.dayPending   : '',
                          ].join(' ').trim()}
                          disabled={isDisabledCell}
                          onClick={() => {
                            if (!isDisabledCell) { onDayClick(cellDate) }
                          }}
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
