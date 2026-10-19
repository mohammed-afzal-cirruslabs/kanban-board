/**
 * Automated tests for the Todo app — S-7
 *
 * Covers all acceptance criteria:
 *   AC1  Input + Add button visible on load; input has autoFocus
 *   AC2  Typing a title and submitting adds the todo; input clears
 *   AC3  Submitting empty / whitespace-only title does nothing
 *   AC4  Checkbox marks todo complete (strikethrough class applied)
 *   AC5  Checkbox again un-completes the todo
 *   AC6  Delete button removes the todo
 *   AC7  Empty list shows visible empty-state message
 *   AC8  (meta) All tests pass — satisfied by this file
 *   AC9  (meta) lint/typecheck/build — verified in CI
 *
 * Additional coverage:
 *   - Summary counter updates correctly
 *   - Multiple todos can be added and managed independently
 *   - TodoItem renders completed state correctly
 *   - TodoItem fires onToggle and onDelete with the correct id
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TodoPage } from '../components/TodoPage'
import { TodoItem } from '../components/TodoItem'
import { Todo } from '../types'

// ─── helpers ────────────────────────────────────────────────────────────────

function renderTodoPage() {
  return render(<TodoPage />)
}

function getInput() {
  return screen.getByRole('textbox', { name: /new todo title/i })
}

function getAddBtn() {
  return screen.getByRole('button', { name: /add todo/i })
}

// ─── AC1: Input + Add button visible on load ─────────────────────────────────

describe('AC1 — input and Add button visible on load', () => {
  it('renders the text input', () => {
    renderTodoPage()
    expect(getInput()).toBeInTheDocument()
  })

  it('renders the Add button', () => {
    renderTodoPage()
    expect(getAddBtn()).toBeInTheDocument()
  })

  it('input has the autoFocus attribute', () => {
    renderTodoPage()
    // React's autoFocus prop causes the element to be focused on mount;
    // jsdom does not reflect it as an HTML attribute, so we verify via focus state.
    expect(getInput()).toHaveFocus()
  })
})

// ─── AC2: Adding a todo ───────────────────────────────────────────────────────

describe('AC2 — adding a todo', () => {
  it('adds a todo to the list after submitting', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Buy milk')
    await user.click(getAddBtn())
    expect(screen.getByText('Buy milk')).toBeInTheDocument()
  })

  it('clears the input after a successful add', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Buy milk')
    await user.click(getAddBtn())
    expect(getInput()).toHaveValue('')
  })

  it('adds a todo by pressing Enter', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Press Enter todo{Enter}')
    expect(screen.getByText('Press Enter todo')).toBeInTheDocument()
  })

  it('adds multiple todos independently', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'First{Enter}')
    await user.type(getInput(), 'Second{Enter}')
    await user.type(getInput(), 'Third{Enter}')
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('trims leading and trailing whitespace from the title', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), '  Trimmed title  {Enter}')
    expect(screen.getByText('Trimmed title')).toBeInTheDocument()
  })
})

// ─── AC3: Empty / whitespace title is rejected ───────────────────────────────

describe('AC3 — empty or whitespace title is rejected', () => {
  it('does not add a todo when the input is empty', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.click(getAddBtn())
    expect(screen.getByRole('status')).toHaveTextContent(/no todos yet/i)
  })

  it('does not add a todo when the input is only whitespace', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), '   ')
    await user.click(getAddBtn())
    expect(screen.getByRole('status')).toHaveTextContent(/no todos yet/i)
  })

  it('does not clear the input when submission is rejected', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), '   ')
    await user.click(getAddBtn())
    expect(getInput()).toHaveValue('   ')
  })
})

// ─── AC4: Marking a todo complete ────────────────────────────────────────────

describe('AC4 — marking a todo complete', () => {
  it('checkbox is unchecked by default', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Walk the dog{Enter}')
    const checkbox = screen.getByRole('checkbox', { name: /mark "Walk the dog" as complete/i })
    expect(checkbox).not.toBeChecked()
  })

  it('clicking the checkbox checks it', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Walk the dog{Enter}')
    const checkbox = screen.getByRole('checkbox', { name: /mark "Walk the dog" as complete/i })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('completed todo title has the completed CSS class applied', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Completed task{Enter}')
    const checkbox = screen.getByRole('checkbox', { name: /mark "Completed task" as complete/i })
    await user.click(checkbox)
    // The title span should have the completed class (CSS module hashes it, so check by data)
    const titleSpan = screen.getByText('Completed task')
    expect(titleSpan.className).toMatch(/completed/)
  })
})

// ─── AC5: Un-completing a todo ───────────────────────────────────────────────

describe('AC5 — un-completing a todo', () => {
  it('clicking the checkbox again un-checks it', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Toggle me{Enter}')
    const checkbox = screen.getByRole('checkbox', { name: /mark "Toggle me" as complete/i })
    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('un-completed title no longer has the completed class', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Toggle class{Enter}')
    const checkbox = screen.getByRole('checkbox', { name: /mark "Toggle class" as complete/i })
    await user.click(checkbox)
    await user.click(checkbox)
    const titleSpan = screen.getByText('Toggle class')
    expect(titleSpan.className).not.toMatch(/completed/)
  })
})

// ─── AC6: Deleting a todo ─────────────────────────────────────────────────────

describe('AC6 — deleting a todo', () => {
  it('delete button removes the todo from the list', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Delete me{Enter}')
    expect(screen.getByText('Delete me')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /delete "Delete me"/i }))
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('deleting one todo does not affect others', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Keep me{Enter}')
    await user.type(getInput(), 'Delete me{Enter}')
    await user.click(screen.getByRole('button', { name: /delete "Delete me"/i }))
    expect(screen.getByText('Keep me')).toBeInTheDocument()
    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })

  it('deleting the last todo shows the empty state', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'Only one{Enter}')
    await user.click(screen.getByRole('button', { name: /delete "Only one"/i }))
    expect(screen.getByRole('status')).toHaveTextContent(/no todos yet/i)
  })
})

// ─── AC7: Empty state ─────────────────────────────────────────────────────────

describe('AC7 — empty state', () => {
  it('shows empty-state message when there are no todos', () => {
    renderTodoPage()
    expect(screen.getByRole('status')).toHaveTextContent(/no todos yet/i)
  })

  it('empty-state message disappears once a todo is added', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'First todo{Enter}')
    expect(screen.queryByText(/no todos yet/i)).not.toBeInTheDocument()
  })
})

// ─── Summary counter ──────────────────────────────────────────────────────────

describe('summary counter', () => {
  it('shows "0 of N completed" after adding todos', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'A{Enter}')
    await user.type(getInput(), 'B{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('0 of 2 completed')
  })

  it('increments the completed count when a todo is checked', async () => {
    const user = userEvent.setup()
    renderTodoPage()
    await user.type(getInput(), 'A{Enter}')
    await user.type(getInput(), 'B{Enter}')
    await user.click(screen.getByRole('checkbox', { name: /mark "A" as complete/i }))
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 completed')
  })
})

// ─── TodoItem unit tests ──────────────────────────────────────────────────────

describe('TodoItem — unit', () => {
  const baseTodo: Todo = { id: 't1', title: 'Unit test todo', completed: false }

  it('renders the todo title', () => {
    render(<TodoItem todo={baseTodo} onToggle={() => {}} onDelete={() => {}} />)
    expect(screen.getByText('Unit test todo')).toBeInTheDocument()
  })

  it('renders an unchecked checkbox for an incomplete todo', () => {
    render(<TodoItem todo={baseTodo} onToggle={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('renders a checked checkbox for a completed todo', () => {
    render(
      <TodoItem
        todo={{ ...baseTodo, completed: true }}
        onToggle={() => {}}
        onDelete={() => {}}
      />,
    )
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('calls onToggle with the correct id when checkbox is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={() => {}} />)
    await user.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith('t1')
  })

  it('calls onDelete with the correct id when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TodoItem todo={baseTodo} onToggle={() => {}} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith('t1')
  })

  it('renders the delete button', () => {
    render(<TodoItem todo={baseTodo} onToggle={() => {}} onDelete={() => {}} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})
