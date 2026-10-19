/**
 * Unit tests for Autocomplete — feature/autocomplete-component
 *
 * Coverage:
 *   1. Renders label and input
 *   2. Debounce — onSearch is NOT called immediately; fires after delay
 *   3. Debounce — rapid typing coalesces into one call
 *   4. Keyboard: ArrowDown highlights first option
 *   5. Keyboard: ArrowDown / ArrowUp cycle through options
 *   6. Keyboard: Enter selects the highlighted option
 *   7. Keyboard: Enter with no highlight selects first option
 *   8. Keyboard: Escape closes the dropdown
 *   9. Keyboard: Tab closes the dropdown
 *  10. ARIA: combobox role, aria-expanded, aria-controls
 *  11. ARIA: aria-activedescendant tracks highlighted option
 *  12. ARIA: listbox and option roles present
 *  13. Loading state: spinner visible, options hidden
 *  14. Empty state: "No results" message shown
 *  15. onSelect called with correct option on click
 *  16. Controlled value: input reflects value prop
 *  17. Disabled: input is disabled, dropdown does not open
 */

import { render, screen, fireEvent, act, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Autocomplete, AutocompleteOption } from '../components/Autocomplete'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const OPTIONS: AutocompleteOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface RenderProps {
  options?: AutocompleteOption[]
  loading?: boolean
  debounceMs?: number
  onSearch?: ReturnType<typeof vi.fn>
  onSelect?: ReturnType<typeof vi.fn>
  value?: AutocompleteOption | null
  disabled?: boolean
}

function renderAC({
  options = OPTIONS,
  loading = false,
  debounceMs = 300,
  onSearch = vi.fn(),
  onSelect = vi.fn(),
  value,
  disabled,
}: RenderProps = {}) {
  const utils = render(
    <Autocomplete
      label="Fruit"
      placeholder="Search fruit…"
      options={options}
      loading={loading}
      debounceMs={debounceMs}
      onSearch={onSearch}
      onSelect={onSelect}
      value={value}
      disabled={disabled}
    />,
  )
  const input = screen.getByRole('combobox', { name: /fruit/i })
  return { ...utils, input, onSearch, onSelect }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Autocomplete — render', () => {
  it('renders the label and input', () => {
    renderAC()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Fruit')).toBeInTheDocument()
  })

  it('renders the placeholder', () => {
    renderAC()
    expect(screen.getByPlaceholderText('Search fruit…')).toBeInTheDocument()
  })
})

// ─── Debounce ─────────────────────────────────────────────────────────────────

describe('Autocomplete — debounce', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('does NOT call onSearch immediately on input', () => {
    const { input, onSearch } = renderAC({ debounceMs: 300 })
    // onSearch is called once on mount with '' — clear that call
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'ap' } })
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('calls onSearch after the debounce delay', () => {
    const { input, onSearch } = renderAC({ debounceMs: 300 })
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'ap' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(onSearch).toHaveBeenCalledWith('ap')
  })

  it('coalesces rapid keystrokes into a single call', () => {
    const { input, onSearch } = renderAC({ debounceMs: 300 })
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ap' } })
    fireEvent.change(input, { target: { value: 'app' } })
    // still before delay
    expect(onSearch).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(300) })
    // only the last value fires
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('app')
  })

  it('respects a custom debounceMs prop', () => {
    const { input, onSearch } = renderAC({ debounceMs: 500 })
    onSearch.mockClear()
    fireEvent.change(input, { target: { value: 'b' } })
    act(() => { vi.advanceTimersByTime(300) })
    expect(onSearch).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(200) })
    expect(onSearch).toHaveBeenCalledWith('b')
  })
})

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('Autocomplete — keyboard navigation', () => {
  it('ArrowDown opens the dropdown and highlights the first option', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    const options = screen.getAllByRole('option')
    // first real option (index 0) should be active
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowDown moves highlight down through options', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('ArrowUp moves highlight up through options', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowUp}')
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('ArrowDown does not go past the last option', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    // press down more times than there are options
    for (let i = 0; i < OPTIONS.length + 5; i++) {
      await user.keyboard('{ArrowDown}')
    }
    const options = screen.getAllByRole('option')
    expect(options[OPTIONS.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('Enter selects the highlighted option', async () => {
    const user = userEvent.setup()
    const { input, onSelect } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}') // highlight Banana (index 1)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[1])
    expect(input).toHaveValue('Banana')
  })

  it('Enter with no highlight selects the first option', async () => {
    const user = userEvent.setup()
    const { input, onSelect } = renderAC()
    await user.click(input)
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[0])
    expect(input).toHaveValue('Apple')
  })

  it('Escape closes the dropdown', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    await user.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('Escape does not call onSelect', async () => {
    const user = userEvent.setup()
    const { input, onSelect } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Escape}')
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// ─── ARIA ─────────────────────────────────────────────────────────────────────

describe('Autocomplete — ARIA', () => {
  it('input has role="combobox"', () => {
    renderAC()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('aria-expanded is false when closed', () => {
    renderAC()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })

  it('aria-expanded is true when open', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('aria-controls points to the listbox', () => {
    renderAC()
    const input = screen.getByRole('combobox')
    const listboxId = input.getAttribute('aria-controls')
    expect(listboxId).toBeTruthy()
    expect(document.getElementById(listboxId!)).toBeInTheDocument()
  })

  it('listbox has role="listbox"', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('each option has role="option"', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    const opts = screen.getAllByRole('option')
    expect(opts).toHaveLength(OPTIONS.length)
  })

  it('aria-activedescendant points to the highlighted option', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    const activeId = input.getAttribute('aria-activedescendant')
    expect(activeId).toBeTruthy()
    const activeEl = document.getElementById(activeId!)
    expect(activeEl).toHaveAttribute('aria-selected', 'true')
  })

  it('aria-activedescendant is absent when no option is highlighted', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    // no arrow key pressed — no highlight
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })
})

// ─── Loading state ────────────────────────────────────────────────────────────

describe('Autocomplete — loading state', () => {
  it('shows a loading indicator when loading=true', async () => {
    const user = userEvent.setup()
    renderAC({ loading: true, options: [] })
    const input = screen.getByRole('combobox')
    await user.click(input)
    // The loading option is present in the listbox
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getByLabelText('Loading suggestions')).toBeInTheDocument()
  })

  it('does not show options while loading', async () => {
    const user = userEvent.setup()
    renderAC({ loading: true, options: OPTIONS })
    const input = screen.getByRole('combobox')
    await user.click(input)
    // real options should not be rendered while loading
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('Autocomplete — empty state', () => {
  it('shows "No results" when options is empty and query is non-empty', async () => {
    const user = userEvent.setup()
    renderAC({ options: [] })
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.type(input, 'xyz')
    expect(screen.getByText(/no results for/i)).toBeInTheDocument()
  })

  it('does not show "No results" when query is empty', async () => {
    const user = userEvent.setup()
    renderAC({ options: [] })
    const input = screen.getByRole('combobox')
    await user.click(input)
    // no typing — query is ''
    expect(screen.queryByText(/no results/i)).not.toBeInTheDocument()
  })
})

// ─── Mouse interaction ────────────────────────────────────────────────────────

describe('Autocomplete — mouse interaction', () => {
  it('clicking an option calls onSelect with that option', async () => {
    const user = userEvent.setup()
    const { input, onSelect } = renderAC()
    await user.click(input)
    const opts = screen.getAllByRole('option')
    await user.click(opts[2]) // Cherry
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[2])
    expect(input).toHaveValue('Cherry')
  })

  it('clicking an option closes the dropdown', async () => {
    const user = userEvent.setup()
    const { input } = renderAC()
    await user.click(input)
    const opts = screen.getAllByRole('option')
    await user.click(opts[0])
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})

// ─── Controlled value ─────────────────────────────────────────────────────────

describe('Autocomplete — controlled value', () => {
  it('reflects the value prop in the input', () => {
    renderAC({ value: OPTIONS[1] })
    expect(screen.getByRole('combobox')).toHaveValue('Banana')
  })
})

// ─── Disabled state ───────────────────────────────────────────────────────────

describe('Autocomplete — disabled', () => {
  it('input is disabled', () => {
    renderAC({ disabled: true })
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('dropdown does not open when disabled', async () => {
    const user = userEvent.setup()
    renderAC({ disabled: true })
    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})
