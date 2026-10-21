/**
 * DatePicker stories — S-9
 *
 * Component Story Format 3 (CSF 3). Run with:
 *   pnpm storybook
 *
 * Covers every documented state from the design spec (§4):
 *   - Default / empty
 *   - With a pre-selected date (defaultValue)
 *   - Controlled (value + onChange)
 *   - With min/max bounds
 *   - Disabled
 *   - With an explicit label
 *   - Localised (French)
 */
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { DatePicker } from './DatePicker'
import type { DatePickerProps } from './types'

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A single-date selection control. Opens a calendar dialog on click.

**Modes**
- **Uncontrolled** — pass \`defaultValue\` (or nothing); the component manages its own state.
- **Controlled** — pass \`value\` + \`onChange\`; the parent owns the state.

**Keyboard navigation** (WCAG 2.1 AA / APG 1.2 grid pattern)
| Key | Action |
|-----|--------|
| Arrow keys | Move focus by day |
| Home / End | First / last day of month |
| PageUp / PageDown | Previous / next month |
| Shift + PageUp / PageDown | Previous / next year |
| Enter / Space | Select focused date |
| Escape | Close calendar |

**Localisation** — pass a BCP 47 \`locale\` prop (e.g. \`"fr"\`, \`"de"\`, \`"ja"\`).
        `,
      },
    },
  },
  argTypes: {
    value:        { control: 'text', description: 'Controlled ISO date string' },
    defaultValue: { control: 'text', description: 'Uncontrolled initial ISO date string' },
    min:          { control: 'text', description: 'Earliest selectable date (ISO)' },
    max:          { control: 'text', description: 'Latest selectable date (ISO)' },
    placeholder:  { control: 'text' },
    disabled:     { control: 'boolean' },
    label:        { control: 'text' },
    locale:       { control: 'text', description: 'BCP 47 locale tag, e.g. "fr"' },
    onChange:     { action: 'onChange' },
  },
}

export default meta
type Story = StoryObj<typeof DatePicker>

// ─── Default (empty, uncontrolled) ───────────────────────────────────────────

/**
 * No value set. Shows the placeholder and opens an empty calendar.
 */
export const Default: Story = {
  name: 'Default — empty',
  args: {
    placeholder: 'Select a date',
  },
}

// ─── Pre-selected date ────────────────────────────────────────────────────────

/**
 * `defaultValue` pre-selects a date in uncontrolled mode.
 * The calendar opens on that month with the date highlighted.
 */
export const WithDefaultValue: Story = {
  name: 'Pre-selected (defaultValue)',
  args: {
    defaultValue: '2024-06-15',
  },
}

// ─── Controlled ───────────────────────────────────────────────────────────────

/**
 * Controlled mode: `value` + `onChange`. The parent drives the selected date.
 * The Storybook Actions panel shows every `onChange` call with its ISO string.
 */
export const Controlled: Story = {
  name: 'Controlled',
  render: (args: DatePickerProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [date, setDate] = useState('2024-06-15')
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <DatePicker
          {...args}
          value={date}
          onChange={(v) => { setDate(v); args.onChange?.(v) }}
        />
        <code style={{ fontSize: 12, color: 'var(--color-text-muted, #888)' }}>
          value: {date || '(cleared)'}
        </code>
      </div>
    )
  },
}

// ─── Min / max bounds ─────────────────────────────────────────────────────────

/**
 * Dates outside the `min`/`max` window are rendered as disabled (greyed out,
 * not clickable, `aria-disabled="true"`).
 */
export const WithMinMax: Story = {
  name: 'Min / max bounds',
  args: {
    defaultValue: '2024-06-15',
    min: '2024-06-10',
    max: '2024-06-25',
  },
}

// ─── Disabled ─────────────────────────────────────────────────────────────────

/**
 * The trigger is disabled. Clicking it does nothing; the calendar never opens.
 * `aria-expanded` stays `false`.
 */
export const Disabled: Story = {
  name: 'Disabled',
  args: {
    defaultValue: '2024-06-15',
    disabled: true,
  },
}

// ─── With label ───────────────────────────────────────────────────────────────

/**
 * A visible `<label>` is rendered above the trigger and associated via `htmlFor`.
 */
export const WithLabel: Story = {
  name: 'With label',
  args: {
    label: 'Appointment date',
    placeholder: 'Select a date',
  },
}

// ─── Localised ────────────────────────────────────────────────────────────────

/**
 * Month names and day-of-week headers are localised via `Intl.DateTimeFormat`.
 * This story uses French (`"fr"`).
 */
export const Localised: Story = {
  name: 'Localised (fr)',
  args: {
    defaultValue: '2024-06-15',
    locale: 'fr',
  },
}

// ─── All states side by side ──────────────────────────────────────────────────

/**
 * All trigger states in one view for visual QA:
 * empty, populated, disabled, and open (open state requires interaction).
 */
export const AllStates: Story = {
  name: 'All states',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Empty</p>
        <DatePicker placeholder="Select a date" />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Populated</p>
        <DatePicker defaultValue="2024-06-15" />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>Disabled</p>
        <DatePicker defaultValue="2024-06-15" disabled />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>With min/max</p>
        <DatePicker defaultValue="2024-06-15" min="2024-06-10" max="2024-06-25" />
      </div>
    </div>
  ),
}
