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
import { Column, Card } from './types'
import { INITIAL_COLUMNS } from './data'
import { KanbanColumn } from './components/KanbanColumn'
import { KanbanCard } from './components/KanbanCard'
import { TodoPage } from './components/TodoPage'
import { DatePicker, DateRangePicker } from './components/DatePicker'
import styles from './App.module.css'

type View = 'kanban' | 'todo' | 'datepicker'

function findColumnByCardId(columns: Column[], cardId: string): Column | undefined {
  return columns.find((col) => col.cards.some((c) => c.id === cardId))
}

function App() {
  const [view, setView] = useState<View>('kanban')
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleAddCard = useCallback((columnId: string, card: Card) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
      ),
    )
  }, [])

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const col = findColumnByCardId(columns, active.id as string)
    const card = col?.cards.find((c) => c.id === active.id)
    setActiveCard(card ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeCol = findColumnByCardId(columns, activeId)
    // over could be a column id or a card id
    const overCol =
      columns.find((c) => c.id === overId) ?? findColumnByCardId(columns, overId)

    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    // Move card to the new column (append at end; handleDragEnd refines order)
    setColumns((prev) => {
      const card = activeCol.cards.find((c) => c.id === activeId)!
      return prev.map((col) => {
        if (col.id === activeCol.id) {
          return { ...col, cards: col.cards.filter((c) => c.id !== activeId) }
        }
        if (col.id === overCol.id) {
          // Insert before the over card if over is a card, else append
          const overIndex = col.cards.findIndex((c) => c.id === overId)
          if (overIndex === -1) {
            return { ...col, cards: [...col.cards, card] }
          }
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

    // Reorder within the same column
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

  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1 className={styles.appTitle}>
          {view === 'kanban' ? 'Kanban Board' : view === 'todo' ? 'Todo List' : 'Date Picker'}
        </h1>
        <nav className={styles.nav} aria-label="App navigation">
          <button
            className={`${styles.navBtn} ${view === 'kanban' ? styles.navBtnActive : ''}`}
            onClick={() => setView('kanban')}
            aria-current={view === 'kanban' ? 'page' : undefined}
          >
            Kanban
          </button>
          <button
            className={`${styles.navBtn} ${view === 'todo' ? styles.navBtnActive : ''}`}
            onClick={() => setView('todo')}
            aria-current={view === 'todo' ? 'page' : undefined}
          >
            Todos
          </button>
          <button
            className={`${styles.navBtn} ${view === 'datepicker' ? styles.navBtnActive : ''}`}
            onClick={() => setView('datepicker')}
            aria-current={view === 'datepicker' ? 'page' : undefined}
          >
            Date Picker
          </button>
        </nav>
        {view === 'kanban' && (
          <p className={styles.hint}>
            Drag cards between columns · <kbd>Space</kbd> to pick up · <kbd>←</kbd><kbd>→</kbd> to move column · <kbd>Enter</kbd> to drop
          </p>
        )}
      </header>

      {view === 'kanban' ? (
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
              {activeCard ? (
                <KanbanCard card={activeCard} columnId="" />
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      ) : view === 'todo' ? (
        <TodoPage />
      ) : (
        <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 640 }}>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Single date — uncontrolled
            </h2>
            <DatePicker placeholder="Select a date" />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Single date — with default value
            </h2>
            <DatePicker defaultValue="2024-06-15" />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Single date — with min / max
            </h2>
            <DatePicker defaultValue="2024-06-15" min="2024-06-10" max="2024-06-25" />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Single date — disabled
            </h2>
            <DatePicker defaultValue="2024-06-15" disabled />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Date range — uncontrolled
            </h2>
            <DateRangePicker placeholder="Select a date range" />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Date range — with default value
            </h2>
            <DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} />
          </section>
          <section>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted, #888)' }}>
              Date range — localised (fr)
            </h2>
            <DateRangePicker defaultValue={{ start: '2024-06-10', end: '2024-06-20' }} locale="fr" />
          </section>
        </main>
      )}
    </div>
  )
}

export default App
