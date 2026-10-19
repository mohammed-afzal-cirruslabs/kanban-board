/**
 * DatePicker — S-9
 * Accessible, keyboard-navigable date picker. No external date library.
 */
import React, { useState, useRef, useEffect, useCallback, useId } from 'react'
import styles from './DatePicker.module.css'

export interface DatePickerProps {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
  label?: string
  id?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

function formatDisplay(s: string | undefined): string {
  if (!s) return ''
  const d = parseDate(s)
  if (!d) return s
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
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

export function DatePicker({
  value, defaultValue, onChange, min, max,
  placeholder = 'Select a date', disabled = false, label, id: idProp,
}: DatePickerProps) {
  const autoId = useId()
  const inputId = idProp ?? `datepicker-${autoId}`
  const dialogId = `datepicker-dialog-${autoId}`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? '')
  const selected = isControlled ? (value ?? '') : internalValue

  const [open, setOpen] = useState(false)

  const today = new Date(); today.setHours(0,0,0,0)
  const initialFocus = parseDate(selected) ?? today
  const [focusedDate, setFocusedDate] = useState<Date>(initialFocus)
  const [viewYear, setViewYear] = useState(initialFocus.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialFocus.getMonth())

  const minDate = parseDate(min)
  const maxDate = parseDate(max)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLTableElement>(null)

  useEffect(() => {
    const d = parseDate(selected)
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); setFocusedDate(d) }
  }, [selected])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (open) requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus()
    })
  }, [viewMonth, viewYear, open])

  const selectDate = useCallback((d: Date) => {
    const str = toDateStr(d)
    if (!isControlled) setInternalValue(str)
    onChange?.(str)
    setOpen(false)
    triggerRef.current?.focus()
  }, [isControlled, onChange])

  const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1)}else setViewMonth(m=>m-1) }
  const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1)}else setViewMonth(m=>m+1) }
  const prevYear  = () => setViewYear(y=>y-1)
  const nextYear  = () => setViewYear(y=>y+1)

  const moveFocus = useCallback((d: Date) => {
    const c = clampDate(d, minDate, maxDate)
    setFocusedDate(c); setViewYear(c.getFullYear()); setViewMonth(c.getMonth())
  }, [minDate, maxDate])

  const handleGridKeyDown = (e: React.KeyboardEvent) => {
    const d = new Date(focusedDate)
    switch (e.key) {
      case 'ArrowLeft':  e.preventDefault(); d.setDate(d.getDate()-1); moveFocus(d); break
      case 'ArrowRight': e.preventDefault(); d.setDate(d.getDate()+1); moveFocus(d); break
      case 'ArrowUp':    e.preventDefault(); d.setDate(d.getDate()-7); moveFocus(d); break
      case 'ArrowDown':  e.preventDefault(); d.setDate(d.getDate()+7); moveFocus(d); break
      case 'Home':       e.preventDefault(); d.setDate(1);             moveFocus(d); break
      case 'End':        e.preventDefault(); d.setDate(daysInMonth(d.getFullYear(),d.getMonth())); moveFocus(d); break
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
  }

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
  const cells: Array<Date|null> = []
  for (let i=0;i<startDay;i++) cells.push(null)
  for (let d=1;d<=totalDays;d++) cells.push(new Date(viewYear,viewMonth,d))
  while (cells.length%7!==0) cells.push(null)
  const weeks: Array<Array<Date|null>> = []
  for (let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7))

  return (
    <div className={styles.root} data-testid="datepicker">
      <button
        ref={triggerRef} id={inputId} type="button"
        aria-label={label ?? 'Choose date'} aria-haspopup="dialog"
        aria-expanded={open} aria-controls={dialogId}
        disabled={disabled} className={styles.trigger}
        onClick={() => !disabled && setOpen(o=>!o)}
        data-testid="datepicker-trigger"
      >
        <span className={styles.triggerText}>
          {selected
            ? formatDisplay(selected)
            : <span className={styles.placeholder}>{placeholder}</span>}
        </span>
        <svg className={styles.icon} aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div ref={dialogRef} id={dialogId} role="dialog" aria-label="Choose date"
          aria-modal="true" className={styles.dialog} data-testid="datepicker-dialog">

          <div className={styles.header}>
            <button type="button" className={styles.navBtn} aria-label="Previous year"  onClick={prevYear}  data-testid="prev-year">&laquo;</button>
            <button type="button" className={styles.navBtn} aria-label="Previous month" onClick={prevMonth} data-testid="prev-month">&lsaquo;</button>
            <span className={styles.monthYear} aria-live="polite" aria-atomic="true">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className={styles.navBtn} aria-label="Next month" onClick={nextMonth} data-testid="next-month">&rsaquo;</button>
            <button type="button" className={styles.navBtn} aria-label="Next year"  onClick={nextYear}  data-testid="next-year">&raquo;</button>
          </div>

          <table ref={gridRef} role="grid" aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
            className={styles.grid} onKeyDown={handleGridKeyDown}>
            <thead>
              <tr>{DAYS.map(d=><th key={d} scope="col" className={styles.dayHeader}>{d}</th>)}</tr>
            </thead>
            <tbody>
              {weeks.map((week,wi)=>(
                <tr key={wi}>
                  {week.map((date,di)=>{
                    if (!date) return <td key={di} className={styles.empty} aria-hidden="true"/>
                    const dis=isDisabledDate(date), sel=isSelected(date), tod=isToday(date), foc=isFocused(date)
                    return (
                      <td key={di} role="gridcell" aria-selected={sel} aria-disabled={dis}
                        tabIndex={foc?0:-1}
                        className={[styles.cell,sel?styles.selected:'',tod?styles.today:'',dis?styles.disabled:''].join(' ')}
                        onClick={()=>!dis&&selectDate(date)}
                        onFocus={()=>setFocusedDate(date)}
                        data-testid={`day-${toDateStr(date)}`}>
                        {date.getDate()}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.footer}>
            <button type="button" className={styles.todayBtn}
              onClick={()=>{ if(!isDisabledDate(today)){moveFocus(today);selectDate(today)} }}
              disabled={isDisabledDate(today)} data-testid="today-btn">Today</button>
            <button type="button" className={styles.clearBtn}
              onClick={()=>{ if(!isControlled)setInternalValue(''); onChange?.(''); setOpen(false); triggerRef.current?.focus() }}
              data-testid="clear-btn">Clear</button>
          </div>
        </div>
      )}
    </div>
  )
}
