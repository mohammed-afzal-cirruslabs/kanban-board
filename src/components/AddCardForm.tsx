/**
 * AddCardForm — inline form rendered in the KanbanColumn footer.
 *
 * Props:
 *   columnId   — passed back in onAdd so the parent knows which lane to update
 *   columnTitle — used in the aria-label for the trigger button
 *   onAdd      — called with (columnId, card) on a valid submit
 */
import { useRef, useState } from 'react'
import { Card } from '../types'
import styles from './AddCardForm.module.css'

interface Props {
  columnId: string
  columnTitle: string
  onAdd: (columnId: string, card: Card) => void
}

export function AddCardForm({ columnId, columnTitle, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    // defer focus so the input is mounted before we try to focus it
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(columnId, {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmed,
      description: description.trim() || undefined,
    })
    setTitle('')
    setDescription('')
    setOpen(false)
  }

  function handleCancel() {
    setTitle('')
    setDescription('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        className={styles.addBtn}
        onClick={handleOpen}
        aria-label={`Add card to ${columnTitle}`}
      >
        + Add a card
      </button>
    )
  }

  return (
    <form
      className={styles.addForm}
      onSubmit={handleSubmit}
      aria-label="Add card form"
    >
      <input
        ref={inputRef}
        className={styles.input}
        placeholder="Card title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Card title"
        required
      />
      <input
        className={styles.input}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        aria-label="Card description"
      />
      <div className={styles.formActions}>
        <button type="submit" className={styles.btnPrimary}>
          Add card
        </button>
        <button type="button" className={styles.btnGhost} onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
