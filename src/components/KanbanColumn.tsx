/**
 * KanbanColumn — a droppable lane.
 *
 * Anatomy:
 *   header    — column title (uppercase) + card-count badge
 *   cardList  — scrollable SortableContext; min-height keeps empty columns droppable
 *   footer    — AddCardForm (collapsed trigger → inline form)
 */
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Column, Card } from '../types'
import { KanbanCard } from './KanbanCard'
import { AddCardForm } from './AddCardForm'
import styles from './KanbanColumn.module.css'

interface Props {
  column: Column
  onAddCard: (columnId: string, card: Card) => void
}

export function KanbanColumn({ column, onAddCard }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const cardIds = column.cards.map((c) => c.id)

  return (
    <section
      className={`${styles.column} ${isOver ? styles.over : ''}`}
      aria-label={`${column.title} column`}
    >
      <header className={styles.header}>
        <h2 className={styles.columnTitle}>{column.title}</h2>
        <span
          className={styles.count}
          aria-label={`${column.cards.length} cards`}
        >
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
        <AddCardForm
          columnId={column.id}
          columnTitle={column.title}
          onAdd={onAddCard}
        />
      </div>
    </section>
  )
}
