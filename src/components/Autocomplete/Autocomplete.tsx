/**
 * Autocomplete — reusable combobox with debounced input, keyboard navigation,
 * ARIA roles, loading and empty states, and design tokens.
 *
 * ARIA pattern: combobox (input) + listbox (dropdown) + option (each item).
 * Keyboard:
 *   ArrowDown / ArrowUp  — move highlighted option
 *   Enter                — select highlighted option (or first if none)
 *   Escape               — close dropdown, clear highlight
 *   Tab                  — close dropdown (focus moves naturally)
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import styles from './Autocomplete.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AutocompleteOption {
  /** Unique identifier for the option. */
  value: string
  /** Display label shown in the dropdown. */
  label: string
}

export interface AutocompleteProps {
  /** Visible label rendered above the input. */
  label: string
  /** Placeholder text shown inside the input when empty. */
  placeholder?: string
  /**
   * Called with the current query string after the debounce delay.
   * The parent is responsible for updating `options` and `loading`.
   */
  onSearch: (query: string) => void
  /** Options to display in the dropdown. */
  options: AutocompleteOption[]
  /** When true the dropdown shows a loading indicator instead of options. */
  loading?: boolean
  /** Called when the user selects an option. */
  onSelect?: (option: AutocompleteOption) => void
  /** Currently selected option (controlled). */
  value?: AutocompleteOption | null
  /** Debounce delay in milliseconds (default 300). */
  debounceMs?: number
  /** Disables the control entirely. */
  disabled?: boolean
  /** Additional class applied to the root wrapper. */
  className?: string
}

// ─── useDebounce hook ─────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])

  return debounced
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Autocomplete({
  label,
  placeholder = 'Search…',
  onSearch,
  options,
  loading = false,
  onSelect,
  value,
  debounceMs = 300,
  disabled = false,
  className,
}: AutocompleteProps) {
  const uid = useId()
  const labelId = `${uid}-label`
  const inputId = `${uid}-input`
  const listboxId = `${uid}-listbox`

  const [inputValue, setInputValue] = useState<string>(value?.label ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Keep input value in sync when the controlled `value` prop changes.
  useEffect(() => {
    setInputValue(value?.label ?? '')
  }, [value])

  // ── Debounced query ──────────────────────────────────────────────────────
  const debouncedQuery = useDebounce(inputValue, debounceMs)

  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const selectOption = useCallback(
    (option: AutocompleteOption) => {
      setInputValue(option.label)
      closeDropdown()
      onSelect?.(option)
    },
    [closeDropdown, onSelect],
  )

  // Scroll active option into view (scrollIntoView not available in jsdom).
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined
    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  // ── Event handlers ───────────────────────────────────────────────────────

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setInputValue(q)
    setActiveIndex(-1)
    setOpen(true)
  }

  function handleInputFocus() {
    if (!disabled) setOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      }
      case 'Enter': {
        e.preventDefault()
        const target = activeIndex >= 0 ? options[activeIndex] : options[0]
        if (target) selectOption(target)
        break
      }
      case 'Escape': {
        e.preventDefault()
        closeDropdown()
        inputRef.current?.focus()
        break
      }
      case 'Tab': {
        closeDropdown()
        break
      }
    }
  }

  // Close when focus leaves the whole widget.
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    // relatedTarget is the element receiving focus; if it is inside the widget
    // (e.g. clicking a list item) we do not close.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      closeDropdown()
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────

  const showDropdown = open && !disabled
  const showLoading = showDropdown && loading
  const showEmpty = showDropdown && !loading && options.length === 0 && inputValue.trim() !== ''
  const showOptions = showDropdown && !loading && options.length > 0

  const activeOptionId =
    activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      onBlur={handleBlur}
    >
      <label htmlFor={inputId} id={labelId} className={styles.label}>
        {label}
      </label>

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={[styles.input, disabled ? styles.inputDisabled : ''].join(' ')}
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
        />

        {/* Loading spinner inside the input */}
        {loading && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
      </div>

      {/* Dropdown */}
      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        className={[
          styles.listbox,
          showDropdown ? styles.listboxOpen : '',
        ].join(' ')}
      >
        {showLoading && (
          <li role="option" aria-selected={false} className={styles.stateItem}>
            <span className={styles.loadingDots} aria-label="Loading suggestions">
              <span />
              <span />
              <span />
            </span>
          </li>
        )}

        {showEmpty && (
          <li role="option" aria-selected={false} className={styles.stateItem}>
            <span className={styles.emptyText}>No results for "{inputValue}"</span>
          </li>
        )}

        {showOptions &&
          options.map((opt, i) => (
            <li
              key={opt.value}
              id={`${uid}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={[
                styles.option,
                i === activeIndex ? styles.optionActive : '',
              ].join(' ')}
              // mousedown fires before blur so we can select before the dropdown closes
              onMouseDown={(e) => {
                e.preventDefault() // keep focus on input
                selectOption(opt)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {opt.label}
            </li>
          ))}
      </ul>
    </div>
  )
}
