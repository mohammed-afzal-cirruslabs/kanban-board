/**
 * Chess UI tests (S-15)
 * ---------------------
 * Covers the board rendering and the click-to-select / click-to-move flow at
 * the component boundary — the engine's own rules are proven in
 * chess.engine.core.test.ts, so here we assert that the UI reflects engine
 * state, wires clicks to engine calls correctly, shows turn/status, and resets.
 *
 * Interaction goes through each square's accessible label, which exercises the
 * keyboard/screen-reader surface at the same time.
 */

import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChessGame } from '../chess/components/ChessGame'

/** A square button by its algebraic name, matching the aria-label prefix. */
function square(name: string): HTMLButtonElement {
  return screen.getByRole('button', {
    name: new RegExp(`^${name},`),
  }) as HTMLButtonElement
}

describe('ChessGame — rendering', () => {
  it('renders 64 squares plus the reset control', () => {
    render(<ChessGame />)
    const board = screen.getByRole('grid', { name: /chess board/i })
    const cells = within(board).getAllByRole('button')
    expect(cells).toHaveLength(64)
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument()
  })

  it('starts with White to move and an in-progress status', () => {
    render(<ChessGame />)
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/in progress/i)
  })

  it('labels a square with its occupying piece', () => {
    render(<ChessGame />)
    expect(square('e1')).toHaveAccessibleName(/white king/i)
    expect(square('d8')).toHaveAccessibleName(/black queen/i)
    expect(square('e2')).toHaveAccessibleName(/white pawn/i)
  })
})

describe('ChessGame — selection', () => {
  it('marks a selected own piece pressed and offers no action on the opponent', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)

    // White to move: selecting a black piece does nothing (its button is disabled).
    expect(square('e7')).toBeDisabled()

    await user.click(square('e2'))
    expect(square('e2')).toHaveAttribute('aria-pressed', 'true')

    // Legal destinations become enabled and labelled "move here".
    expect(square('e4')).toBeEnabled()
    expect(square('e4')).toHaveAccessibleName(/move here/i)
  })

  it('clears the selection when the selected square is clicked again', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)
    await user.click(square('e2'))
    expect(square('e2')).toHaveAttribute('aria-pressed', 'true')
    await user.click(square('e2'))
    expect(square('e2')).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ChessGame — moving', () => {
  it('applies a legal move and flips the turn', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)

    await user.click(square('e2'))
    await user.click(square('e4'))

    // Pawn is now on e4, e2 is empty, and it is Black's turn.
    expect(square('e4')).toHaveAccessibleName(/white pawn/i)
    expect(square('e2')).toHaveAccessibleName(/empty/i)
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()
  })

  it('does not move to an illegal square', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)

    await user.click(square('e2'))
    // e5 is two squares beyond the pawn's reach — its button is not a target.
    expect(square('e5')).toBeDisabled()

    // Clicking another own piece re-selects rather than moving.
    await user.click(square('d2'))
    expect(square('d2')).toHaveAttribute('aria-pressed', 'true')
    expect(square('e2')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
  })
})

describe('ChessGame — status and reset', () => {
  it("reaches checkmate via fool's mate and announces the winner", async () => {
    const user = userEvent.setup()
    render(<ChessGame />)

    // 1. f3 e5  2. g4 Qh4#
    await user.click(square('f2'))
    await user.click(square('f3'))
    await user.click(square('e7'))
    await user.click(square('e5'))
    await user.click(square('g2'))
    await user.click(square('g4'))
    await user.click(square('d8'))
    await user.click(square('h4'))

    expect(screen.getByRole('status')).toHaveTextContent(/checkmate — black wins/i)
    expect(screen.getByText(/game over/i)).toBeInTheDocument()

    // Board is now inert: every square is disabled.
    const board = screen.getByRole('grid', { name: /chess board/i })
    for (const btn of within(board).getAllByRole('button')) {
      expect(btn).toBeDisabled()
    }
  })

  it('resets to the starting position on New game', async () => {
    const user = userEvent.setup()
    render(<ChessGame />)

    await user.click(square('e2'))
    await user.click(square('e4'))
    expect(screen.getByText(/black to move/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /new game/i }))

    expect(screen.getByText(/white to move/i)).toBeInTheDocument()
    expect(square('e2')).toHaveAccessibleName(/white pawn/i)
    expect(square('e4')).toHaveAccessibleName(/empty/i)
    expect(screen.getByRole('status')).toHaveTextContent(/in progress/i)
  })
})
