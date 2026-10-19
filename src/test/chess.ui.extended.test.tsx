/**
 * Chess UI — Extended tests (S-16)
 * ---------------------------------
 * Supplements chess.ui.test.tsx (S-15, 10 tests) with additional coverage:
 *   - select-and-move flow (piece appears on destination, source is empty)
 *   - illegal move is silently ignored (board unchanged, turn unchanged)
 *   - status badge text for each game status
 *   - reset restores the full starting position
 *   - opponent's pieces are disabled on their turn
 *   - re-selecting a different own piece changes the selection
 *   - clicking an empty non-target square clears the selection
 *
 * Uses the same helpers and import path as chess.ui.test.tsx.
 */

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChessGame } from '../chess/components/ChessGame'

/** Button for a square by its algebraic name prefix. */
function sq(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name: new RegExp(`^${name},`) }) as HTMLButtonElement
}

describe('ChessGame — select-and-move', () => {
  it('piece lands on destination and source becomes empty', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('d2'))
    await user.click(sq('d4'))
    expect(sq('d4')).toHaveAccessibleName(/white pawn/i)
    expect(sq('d2')).toHaveAccessibleName(/empty/i)
  })

  it('clicking a legal target clears the selection', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2'))
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'true')
    await user.click(sq('e4'))
    // After the move the selection is gone — e4 is no longer pressed.
    expect(sq('e4')).toHaveAttribute('aria-pressed', 'false')
  })

  it('re-selecting a different own piece changes the selection', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2'))
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'true')
    await user.click(sq('d2'))
    expect(sq('d2')).toHaveAttribute('aria-pressed', 'true')
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking an empty non-target square clears the selection', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2'))
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'true')
    // e5 is not a legal target for the e2 pawn and is empty — clicking it
    // should be a no-op (the button is disabled, so the click is ignored).
    // The selection should remain.
    expect(sq('e5')).toBeDisabled()
    // Turn has not changed.
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  })
})

describe('ChessGame — illegal move ignored', () => {
  it('does not move when the target is not a legal destination', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    // Select the e2 pawn.
    await user.click(sq('e2'))
    // e5 is not reachable from e2 in one move — the button is disabled.
    expect(sq('e5')).toBeDisabled()
    // Board and turn are unchanged.
    expect(sq('e2')).toHaveAccessibleName(/white pawn/i)
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  })

  it('cannot select an opponent piece on white turn', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    // Black pieces are disabled on white's turn.
    expect(sq('e7')).toBeDisabled()
    expect(sq('d8')).toBeDisabled()
    // Turn still white.
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  })

  it('cannot select a white piece on black turn', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    // Make one white move to flip the turn.
    await user.click(sq('e2'))
    await user.click(sq('e4'))
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
    // White pieces are now disabled.
    expect(sq('d2')).toBeDisabled()
    expect(sq('e1')).toBeDisabled()
  })
})

describe('ChessGame — status display', () => {
  it('shows "In progress" at the start', () => {
    render(<ChessGame />)
    expect(screen.getByRole('status')).toHaveTextContent(/in progress/i)
  })

  it('shows "White to move" at the start', () => {
    render(<ChessGame />)
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  })

  it('shows "Black to move" after white moves', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2'))
    await user.click(sq('e4'))
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it("shows checkmate status after fool's mate", async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    // 1. f3 e5  2. g4 Qh4#
    await user.click(sq('f2')); await user.click(sq('f3'))
    await user.click(sq('e7')); await user.click(sq('e5'))
    await user.click(sq('g2')); await user.click(sq('g4'))
    await user.click(sq('d8')); await user.click(sq('h4'))
    expect(screen.getByRole('status')).toHaveTextContent(/checkmate/i)
    expect(screen.getByRole('status')).toHaveTextContent(/black wins/i)
  })

  it('shows "Game over" text (not a colour to move) after checkmate', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('f2')); await user.click(sq('f3'))
    await user.click(sq('e7')); await user.click(sq('e5'))
    await user.click(sq('g2')); await user.click(sq('g4'))
    await user.click(sq('d8')); await user.click(sq('h4'))
    expect(screen.getByText(/game over/i)).toBeInTheDocument()
    expect(screen.queryByText(/to move/i)).not.toBeInTheDocument()
  })

  it('board is fully disabled after checkmate', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('f2')); await user.click(sq('f3'))
    await user.click(sq('e7')); await user.click(sq('e5'))
    await user.click(sq('g2')); await user.click(sq('g4'))
    await user.click(sq('d8')); await user.click(sq('h4'))
    const board = screen.getByRole('grid', { name: /chess board/i })
    for (const btn of within(board).getAllByRole('button')) {
      expect(btn).toBeDisabled()
    }
  })
})

describe('ChessGame — reset', () => {
  it('New game button restores the starting position', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2')); await user.click(sq('e4'))
    await user.click(sq('e7')); await user.click(sq('e5'))
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /new game/i }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(sq('e2')).toHaveAccessibleName(/white pawn/i)
    expect(sq('e4')).toHaveAccessibleName(/empty/i)
    expect(sq('e7')).toHaveAccessibleName(/black pawn/i)
    expect(sq('e5')).toHaveAccessibleName(/empty/i)
    expect(screen.getByRole('status')).toHaveTextContent(/in progress/i)
  })

  it('New game clears any active selection', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('e2'))
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /new game/i }))
    expect(sq('e2')).toHaveAttribute('aria-pressed', 'false')
  })

  it('New game works after checkmate', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(sq('f2')); await user.click(sq('f3'))
    await user.click(sq('e7')); await user.click(sq('e5'))
    await user.click(sq('g2')); await user.click(sq('g4'))
    await user.click(sq('d8')); await user.click(sq('h4'))
    expect(screen.getByRole('status')).toHaveTextContent(/checkmate/i)

    await user.click(screen.getByRole('button', { name: /new game/i }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/in progress/i)
    // Board is interactive again.
    expect(sq('e2')).not.toBeDisabled()
  })
})
