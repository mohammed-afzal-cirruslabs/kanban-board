import { useState, useRef, useCallback, useMemo } from 'react'
import { Todo } from '../types'
import { TodoItem } from './TodoItem'
import { Autocomplete, AutocompleteOption } from './Autocomplete'
import styles from './TodoPage.module.css'

export function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
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

  // Derive autocomplete options from existing todo titles that match the query.
  const searchOptions = useMemo<AutocompleteOption[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return todos
      .filter((t) => t.title.toLowerCase().includes(q))
      .map((t) => ({ value: t.id, label: t.title }))
  }, [todos, searchQuery])

  // Filter the visible list by the current search query.
  const visibleTodos = useMemo<Todo[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return todos
    return todos.filter((t) => t.title.toLowerCase().includes(q))
  }, [todos, searchQuery])

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

        {todos.length > 0 && (
          <Autocomplete
            label="Search todos"
            placeholder="Filter todos…"
            options={searchOptions}
            onSearch={setSearchQuery}
            onSelect={(opt) => setSearchQuery(opt.label)}
            debounceMs={300}
            className={styles.search}
          />
        )}

        {visibleTodos.length === 0 && todos.length === 0 ? (
          <p className={styles.empty} role="status">
            No todos yet — add one above
          </p>
        ) : visibleTodos.length === 0 ? (
          <p className={styles.empty} role="status">
            No todos match "{searchQuery}"
          </p>
        ) : (
          <ul className={styles.list} aria-label="Todo items">
            {visibleTodos.map((todo) => (
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
