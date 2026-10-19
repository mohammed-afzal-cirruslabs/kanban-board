/**
 * KanbanBoard — root component that owns column state and DnD context.
 *
 * Wires together:
 *   @dnd-kit/core  — DndContext, sensors, collision detection, DragOverlay
 *   @dnd-kit/sortable — arrayMove for within-column reorder
 *   KanbanColumn   — droppable lane with add-card form
 *   KanbanCard     — sortable card (also used in the drag overlay)
 */
import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { Column, Card } from '../types'
import { INITIAL_COLUMNS } from '../data'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import styles from './KanbanBoard.module.css'

// ─── helpers ────────────────────────────────────────────────────────────────

function findColumnByCardId(columns: Column[], cardId: string): Column | undefined {
  return columns.find((col) => col.cards.some((c) => c.id === cardId))
}

// ─── component ──────────────────────────────────────────────────────────────

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  // ── sensors ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── add card ───────────────────────────────────────────────────────────────
  const handleAddCard = useCallback((columnId: string, card: Card) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
      ),
    )
  }, [])

  // ── drag lifecycle ─────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const col = findColumnByCardId(columns, event.active.id as string)
    const card = col?.cards.find((c) => c.id === event.active.id)
    setActiveCard(card ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const activeCol = findColumnByCardId(columns, activeId)
    const overCol =
      columns.find((c) => c.id === overId) ?? findColumnByCardId(columns, overId)

    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    // Optimistically move the card to the new column
    setColumns((prev) => {
      const card = activeCol.cards.find((c) => c.id === activeId)!
      return prev.map((col) => {
        if (col.id === activeCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) }
        }
        if (col.id === overCol.id) {
          const overIndex = col.cards.findIndex((c) => c.id === overId)
          if (overIndex === -1) return { ...col, cards: [...col.cards, card] }
          const newCards = [...col.cards]
          newCards.splice(overIndex, 0, card)
          return { ...col, cards: newCards }
        }
        return col
      })
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    // Refine within-column order
    setColumns((prev) =>
      prev.map((col) => {
        const activeIndex = col.cards.findIndex((c) => c.id === activeId)
        const overIndex = col.cards.findIndex((c) => c.id === overId)
        if (activeIndex !== -1 && overIndex !== -1) {
          return { ...col, cards: arrayMove(col.cards, activeIndex, overIndex) }
        }
        return col
      }),
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <main className={styles.board} role="main">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((col) => (
          <KanbanColumn key={col.id} column={col} onAddCard={handleAddCard} />
        ))}

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} columnId="" /> : null}
        </DragOverlay>
      </DndContext>
    </main>
  )
}
