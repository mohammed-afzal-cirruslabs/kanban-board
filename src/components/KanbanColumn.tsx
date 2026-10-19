import { useState, useRef } from 'react'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Column, Card } from '../types'
import { KanbanCard } from './KanbanCard'
import styles from './KanbanColumn.module.css'

interface Props {
  column: Column
  onAddCard: (columnId: string, card: Card) => void
}

export function KanbanColumn({ column, onAddCard }: Props) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  function handleOpen() {
    setAdding(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAddCard(column.id, {
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: trimmed,
      description: description.trim() || undefined,
    })
    setTitle('')
    setDescription('')
    setAdding(false)
  }

  function handleCancel() {
    setTitle('')
    setDescription('')
    setAdding(false)
  }

  const cardIds = column.cards.map((c) => c.id)

  return (
    <section
      className={`${styles.column} ${isOver ? styles.over : ''}`}
      aria-label={`${column.title} column`}
    >
      <header className={styles.header}>
        <h2 className={styles.columnTitle}>{column.title}</h2>
        <span className={styles.count} aria-label={`${column.cards.length} cards`}>
          {column.cards.length}
        </span>
      </header>

      <div ref={setNodeRef} className={styles.cardList}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <p className={styles.empty} role="status">
              No cards yet — add one below
            </p>
          ) : (
            column.cards.map((card) => (
              <KanbanCard key={card.id} card={card} columnId={column.id} />
            ))
          )}
        </SortableContext>
      </div>

      <div className={styles.footer}>
        {adding ? (
          <form className={styles.addForm} onSubmit={handleSubmit} aria-label="Add card form">
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
              <button type="submit" className={styles.btnPrimary}>Add card</button>
              <button type="button" className={styles.btnGhost} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button className={styles.addBtn} onClick={handleOpen} aria-label={`Add card to ${column.title}`}>
            + Add a card
          </button>
        )}
      </div>
    </section>
  )
}
