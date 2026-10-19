/**
 * App — shell that wraps the KanbanBoard component.
 *
 * Keeps the page-level chrome (header, hint bar) here so KanbanBoard
 * stays focused on board state and DnD logic.
 */
import { KanbanBoard } from './components/KanbanBoard'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <header className={styles.appHeader}>
        <h1 className={styles.appTitle}>Kanban Board</h1>
        <p className={styles.hint}>
          Drag cards between columns · <kbd>Space</kbd> to pick up ·{' '}
          <kbd>←</kbd>
          <kbd>→</kbd> to move column · <kbd>Enter</kbd> to drop
        </p>
      </header>

      <KanbanBoard />
    </div>
  )
}

export default App
