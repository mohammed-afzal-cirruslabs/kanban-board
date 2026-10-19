import { Todo } from '../types'
import styles from './TodoItem.module.css'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li className={styles.item} aria-label={`Todo: ${todo.title}`}>
      <label className={styles.label}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
        />
        <span className={`${styles.title} ${todo.completed ? styles.completed : ''}`}>
          {todo.title}
        </span>
      </label>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        ×
      </button>
    </li>
  )
}
