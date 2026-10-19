/**
 * DatePicker — shared TypeScript types (S-9)
 *
 * All public types are re-exported from `./index` so consumers only need:
 *   import type { DatePickerProps, DateRangePickerProps, DateRange } from './DatePicker'
 */

// ─── Single-date picker ──────────────────────────────────────────────────────

/**
 * Props for the single-date `DatePicker` component.
 *
 * Dates are always represented as ISO 8601 strings (`"YYYY-MM-DD"`).
 * The component works in both **uncontrolled** (`defaultValue`) and
 * **controlled** (`value` + `onChange`) modes.
 */
export interface DatePickerProps {
  /**
   * Controlled value — ISO 8601 date string (`"YYYY-MM-DD"`).
   * When provided, the component is in controlled mode and will not
   * update its own internal state; the parent must update `value` in
   * response to `onChange`.
   */
  value?: string

  /**
   * Initial value for uncontrolled mode — ISO 8601 date string.
   * Ignored when `value` is provided.
   */
  defaultValue?: string

  /**
   * Called when the user selects a date or clears the picker.
   * Receives an ISO 8601 string (`"YYYY-MM-DD"`) on selection, or an
   * empty string (`""`) when the user clicks **Clear**.
   */
  onChange?: (value: string) => void

  /**
   * Earliest selectable date — ISO 8601 string.
   * Dates before this value are rendered as disabled.
   */
  min?: string

  /**
   * Latest selectable date — ISO 8601 string.
   * Dates after this value are rendered as disabled.
   */
  max?: string

  /** Placeholder text shown in the trigger when no date is selected. */
  placeholder?: string

  /** When `true`, the trigger is disabled and the calendar cannot be opened. */
  disabled?: boolean

  /**
   * Visible `<label>` text rendered above the trigger.
   * Also used as the trigger's `aria-label` when no label element is present.
   */
  label?: string

  /**
   * HTML `id` applied to the trigger button.
   * Auto-generated via `useId()` when omitted.
   */
  id?: string

  /**
   * BCP 47 locale tag used for month/day name localisation.
   * Defaults to `"en"`. Examples: `"fr"`, `"de"`, `"ja"`, `"ar"`.
   */
  locale?: string
}

// ─── Date range ──────────────────────────────────────────────────────────────

/**
 * A date range with an optional end date.
 * Both fields are ISO 8601 strings (`"YYYY-MM-DD"`).
 */
export interface DateRange {
  /** Range start date — ISO 8601 string. Always present once the user picks a start. */
  start: string
  /**
   * Range end date — ISO 8601 string.
   * `undefined` while the user is selecting (only start has been clicked).
   */
  end?: string
}

// ─── Date-range picker ───────────────────────────────────────────────────────

/**
 * Props for the `DateRangePicker` component.
 *
 * Selection works in two clicks: the first click sets `start`, the second
 * sets `end`. Clicking a date before the current `start` resets the selection
 * to that date as the new `start`.
 *
 * Like `DatePicker`, this component supports both **uncontrolled**
 * (`defaultValue`) and **controlled** (`value` + `onChange`) modes.
 */
export interface DateRangePickerProps {
  /**
   * Controlled value — a `DateRange` object.
   * When provided, the component is in controlled mode.
   */
  value?: DateRange

  /**
   * Initial value for uncontrolled mode.
   * Ignored when `value` is provided.
   */
  defaultValue?: DateRange

  /**
   * Called when the range changes.
   * Fires after the user picks a `start` (with `end: undefined`) and again
   * after they pick an `end`.
   */
  onChange?: (range: DateRange) => void

  /**
   * Earliest selectable date — ISO 8601 string.
   * Dates before this value are rendered as disabled.
   */
  min?: string

  /**
   * Latest selectable date — ISO 8601 string.
   * Dates after this value are rendered as disabled.
   */
  max?: string

  /** Placeholder text shown when no range is selected. */
  placeholder?: string

  /** When `true`, the trigger is disabled and the calendar cannot be opened. */
  disabled?: boolean

  /**
   * Visible `<label>` text rendered above the trigger.
   * Also used as the trigger's `aria-label` when no label element is present.
   */
  label?: string

  /**
   * HTML `id` applied to the trigger button.
   * Auto-generated via `useId()` when omitted.
   */
  id?: string

  /**
   * BCP 47 locale tag used for month/day name localisation.
   * Defaults to `"en"`. Examples: `"fr"`, `"de"`, `"ja"`, `"ar"`.
   */
  locale?: string
}
