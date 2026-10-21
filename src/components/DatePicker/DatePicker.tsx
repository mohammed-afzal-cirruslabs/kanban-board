/**
 * DatePicker — S-9
 *
 * Accessible, keyboard-navigable single-date picker. No external date library.
 * Keyboard navigation follows WCAG 2.1 AA / APG 1.2 grid pattern.
 * Localisation via BCP 47 locale prop (Intl.DateTimeFormat).
 */
import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import styles from './DatePicker.module.css'
import type { DatePickerProps } from './types'

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

function resolveDefaultMonth(dm: string | Date | undefined): { year: number; month: number } | null {
  if (!dm) return null
  if (dm instanceof Date) return { year: dm.getFullYear(), month: dm.getMonth() }
  const parts = dm.split('-')
  if (parts.length >= 2) {
    const year  = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) return { year, month }
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  minDate: minDateProp,
  maxDate: maxDateProp,
  defaultMonth,
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

  const minDate: Date | null = minDateProp ? normaliseDate(minDateProp) : parseDate(min)
  const maxDate: Date | null = maxDateProp ? normaliseDate(maxDateProp) : parseDate(max)

  const initialView = (() => {
    const fromSelected = parseDate(selected)
    if (fromSelected) return { year: fromSelected.getFullYear(), month: fromSelected.getMonth() }
    const fromDefault = resolveDefaultMonth(defaultMonth)
    if (fromDefault) return fromDefault
    return { year: today.getFullYear(), month: today.getMonth() }
  })()

  const initialFocus = parseDate(selected) ?? (() => {
    const dm = resolveDefaultMonth(defaultMonth)
    if (dm) { const d = new Date(dm.year, dm.month, 1); d.setHours(0,0,0,0); return d }
    return today
  })()

  const [focusedDate, setFocusedDate] = useState<Date>(initialFocus)
  const [viewYear,    setViewYear]    = useState(initialView.year)
  const [viewMonth,   setViewMonth]   = useState(initialView.month)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef  = useRef<HTMLDivElement>(null)
  const gridRef    = useRef<HTMLTableElement>(null)

  useEffect(() => {
    const d = parseDate(selected)
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setFocusedDate(d) }
  }, [selected])

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

  const prevYear = useCallback(() => setViewYear(y => y - 1), [])
  const nextYear = useCallback(() => setViewYear(y => y + 1), [])

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

  function isDisabledDate(d: Date): boolean {
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  const handleGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableElement>) => {
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); moveFocus(1);  break
      case 'ArrowLeft':  e.preventDefault(); moveFocus(-1); break
      case 'ArrowDown':  e.preventDefault(); moveFocus(7);  break
      case 'ArrowUp':    e.preventDefault(); moveFocus(-7); break
      case 'Home':       e.preventDefault()
        setFocusedDate(prev => clampDate(
          new Date(prev.getFullYear(), prev.getMonth(), 1), minDate, maxDate
        )); break
      case 'End':        e.preventDefault()
        setFocusedDate(prev => clampDate(
          new Date(prev.getFullYear(), prev.getMonth(),
                   daysInMonth(prev.getFullYear(), prev.getMonth())),
          minDate, maxDate
        )); break
      case 'PageUp':     e.preventDefault(); if (e.shiftKey) prevYear(); else prevMonth(); break
      case 'PageDown':   e.preventDefault(); if (e.shiftKey) nextYear(); else nextMonth(); break
      case 'Enter':
      case ' ':          e.preventDefault()
        if (!isDisabledDate(focusedDate)) selectDate(focusedDate); break
      case 'Escape':     e.preventDefault(); setOpen(false); triggerRef.current?.focus(); break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedDate, moveFocus, minDate, maxDate, selectDate, prevMonth, nextMonth, prevYear, nextYear])

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
  const displayValue   = formatDisplay(selected, locale)
  const triggerAriaLabel = label ?? 'Choose date'

  return (
    <div className={styles.root}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}

      <button
        ref={triggerRef}
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={dialogId}
        aria-label={triggerAriaLabel}
        data-testid="datepicker-trigger"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <span className={displayValue ? styles.triggerValue : styles.triggerPlaceholder}>
          {displayValue || placeholder}
        </span>
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
          aria-label="Choose date"
          data-testid="datepicker-dialog"
          className={styles.dialog}
        >
          <div className={styles.header}>
            <button type="button" onClick={prevYear}  aria-label="Previous year"  data-testid="prev-year"  className={styles.navBtn}>«</button>
            <button type="button" onClick={prevMonth} aria-label="Previous month" data-testid="prev-month" className={styles.navBtn}>‹</button>
            <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
              {monthYearLabel}
            </span>
            <button type="button" onClick={nextMonth} aria-label="Next month" data-testid="next-month" className={styles.navBtn}>›</button>
            <button type="button" onClick={nextYear}  aria-label="Next year"  data-testid="next-year"  className={styles.navBtn}>»</button>
          </div>

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
                    const isSelected = cellStr === selected
                    const isToday    = cellStr === toDateStr(today)
                    const isFocused  = cellStr === toDateStr(focusedDate)
                    const isDisabled = isDisabledDate(cellDate)
                    const isOtherMonth = cellDate.getMonth() !== viewMonth

                    return (
                      <td key={di} role="gridcell" className={styles.cell}>
                        <button
                          type="button"
                          tabIndex={isFocused ? 0 : -1}
                          aria-selected={isSelected ? 'true' : 'false'}
                          aria-disabled={isDisabled ? 'true' : undefined}
                          aria-current={isToday ? 'date' : undefined}
                          data-testid={`day-${cellStr}`}
                          className={[
                            styles.day,
                            isSelected   ? styles.daySelected   : '',
                            isToday      ? styles.dayToday      : '',
                            isDisabled   ? styles.dayDisabled   : '',
                            isOtherMonth ? styles.dayOtherMonth : '',
                          ].join(' ').trim()}
                          disabled={isDisabled}
                          onClick={() => {
                            if (!isDisabled) selectDate(cellDate)
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

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.todayBtn}
              data-testid="today-btn"
              disabled={isDisabledDate(today)}
              onClick={() => {
                setViewYear(today.getFullYear())
                setViewMonth(today.getMonth())
                setFocusedDate(today)
                selectDate(today)
              }}
            >Today</button>
            <button
              type="button"
              className={styles.clearBtn}
              data-testid="clear-btn"
              onClick={() => {
                if (!isControlled) setInternalValue('')
                onChange?.('')
                setOpen(false)
                triggerRef.current?.focus()
              }}
            >Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
