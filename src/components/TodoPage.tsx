import { useState, useRef, useCallback } from 'react'
import { Todo } from '../types'
import { TodoItem } from './TodoItem'
import styles from './TodoPage.module.css'

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = input.trim()
      if (!trimmed) return
      setTodos((prev) => [
        ...prev,
        { id: `todo-${Date.now()}-${Math.random().toString(36).slice(2)}`, title: trimmed, completed: false },
      ])
      setInput('')
      inputRef.current?.focus()
    },
    [input],
  )

  const handleToggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }, [])

  const handleDelete = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <main className={styles.page} aria-label="Todo list">
      <div className={styles.container}>
        <h1 className={styles.heading}>My Todos</h1>

        <form
          className={styles.addForm}
          onSubmit={handleAdd}
          aria-label="Add todo form"
        >
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="What needs to be done?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="New todo title"
            autoFocus
          />
          <button type="submit" className={styles.addBtn} aria-label="Add todo">
            Add
          </button>
        </form>

        {todos.length === 0 ? (
          <p className={styles.empty} role="status">
            No todos yet — add one above
          </p>
        ) : (
          <ul className={styles.list} aria-label="Todo items">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <p className={styles.summary} role="status">
            {todos.filter((t) => t.completed).length} of {todos.length} completed
          </p>
        )}
      </div>
    </main>
  )
}
