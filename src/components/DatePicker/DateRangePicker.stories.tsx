/**
 * DateRangePicker stories — S-9
 *
 * Component Story Format 3 (CSF 3). Run with:
 *   pnpm storybook
 *
 * Covers every documented state:
 *   - Default / empty
 *   - Partially selected (start only)
 *   - Fully selected range
 *   - Controlled
 *   - With min/max bounds
 *   - Disabled
 *   - With label
 *   - Localised (German)
 */
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DateRangePicker } from './DateRangePicker'
import type { DateRange, DateRangePickerProps } from './types'

const meta: Meta<typeof DateRangePicker> = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A two-click date-range selection control. First click sets the **start** date;
second click sets the **end** date. Hovering between clicks previews the range.

**Modes**
- **Uncontrolled** — pass \`defaultValue\` (or nothing); the component manages its own state.
- **Controlled** — pass \`value\` + \`onChange\`; the parent owns the state.

**Keyboard navigation** — identical to \`DatePicker\` (WCAG 2.1 AA / APG 1.2 grid pattern).

**Localisation** — pass a BCP 47 \`locale\` prop (e.g. \`"de"\`, \`"ja"\`, \`"ar"\`).
        `,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled:    { control: 'boolean' },
    label:       { control: 'text' },
    min:         { control: 'text', description: 'Earliest selectable date (ISO)' },
    max:         { control: 'text', description: 'Latest selectable date (ISO)' },
    locale:      { control: 'text', description: 'BCP 47 locale tag, e.g. "de"' },
    onChange:    { action: 'onChange' },
  },
}

export default meta
type Story = StoryObj<typeof DateRangePicker>

// ─── Default (empty) ──────────────────────────────────────────────────────────

/**
 * No range selected. Shows the placeholder.
 */
export const Default: Story = {
  name: 'Default — empty',
  args: {
    placeholder: 'Select a date range',
  },
}

// ─── Pre-selected range ───────────────────────────────────────────────────────

/**
 * A complete range is pre-selected via `defaultValue`.
 * Both endpoints are highlighted; cells in between are shaded.
 */
export const WithDefaultValue: Story = {
  name: 'Pre-selected range',
  args: {
    defaultValue: { start: '2024-06-10', end: '2024-06-20' },
  },
}

// ─── Partial selection ────────────────────────────────────────────────────────

/**
 * Only the start date is set. The component is waiting for the user to pick
 * an end date. Hovering over cells previews the range.
 */
export const PartialSelection: Story = {
  name: 'Partial — start only',
  args: {
    defaultValue: { start: '2024-06-10' },
  },
}

// ─── Controlled ───────────────────────────────────────────────────────────────

/**
 * Controlled mode: `value` + `onChange`. The Storybook Actions panel shows
 * every `onChange` call with its `DateRange` object.
 */
export const Controlled: Story = {
  name: 'Controlled',
  render: (args: DateRangePickerProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [range, setRange] = useState<DateRange>({ start: '2024-06-10', end: '2024-06-20' })
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DateRangePicker
          {...args}
          value={range}
          onChange={(r) => { setRange(r); args.onChange?.(r) }}
        />
        <code style={{ fontSize: 12, color: 'var(--color-text-muted, #888)' }}>
          start: {range.start || '—'} &nbsp; end: {range.end || '—'}
        </code>
      </div>
    )
  },
}

// ─── Min / max bounds ─────────────────────────────────────────────────────────

/**
 * Dates outside the `min`/`max` window are disabled.
 */
export const WithMinMax: Story = {
  name: 'Min / max bounds',
  args: {
    defaultValue: { start: '2024-06-12', end: '2024-06-18' },
    min: '2024-06-10',
    max: '2024-06-25',
  },
}

// ─── Disabled ─────────────────────────────────────────────────────────────────

/**
 * The trigger is disabled. The calendar cannot be opened.
 */
export const Disabled: Story = {
  name: 'Disabled',
  args: {
    defaultValue: { start: '2024-06-10', end: '2024-06-20' },
    disabled: true,
  },
}

// ─── With label ───────────────────────────────────────────────────────────────

/**
 * A visible `<label>` is rendered above the trigger.
 */
export const WithLabel: Story = {
  name: 'With label',
  args: {
    label: 'Booking period',
    placeholder: 'Select check-in and check-out',
  },
}

// ─── Localised ────────────────────────────────────────────────────────────────

/**
 * Month names and day-of-week headers are localised via `Intl.DateTimeFormat`.
 * This story uses German (`"de"`).
 */
export const Localised: Story = {
  name: 'Localised (de)',
  args: {
    defaultValue: { start: '2024-06-10', end: '2024-06-20' },
    locale: 'de',
  },
}
