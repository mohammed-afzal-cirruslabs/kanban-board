/**
 * DatePicker barrel export — S-9
 *
 * Public surface of the DatePicker package:
 *
 * ```ts
 * import { DatePicker, DateRangePicker } from '@/components/DatePicker'
 * import type { DatePickerProps, DateRangePickerProps, DateRange } from '@/components/DatePicker'
 * ```
 */

// ─── Components ──────────────────────────────────────────────────────────────
export { DatePicker }      from './DatePicker'
export { DateRangePicker } from './DateRangePicker'

// ─── TypeScript types ─────────────────────────────────────────────────────────
export type { DatePickerProps }      from './DatePicker'
export type { DateRangePickerProps, DateRange } from './types'
