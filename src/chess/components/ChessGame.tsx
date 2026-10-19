/**
 * ChessGame — the playable game.
 * ------------------------------
 * Owns the GameState (from the engine) and the UI-only SelectionState. It is
 * the one place that turns clicks into engine calls:
 *
 *   1st click on an own piece  → select it, compute its legal targets
 *   2nd click on a legal target → apply that move, clear selection
 *   click elsewhere / same sq  → clear or re-select
 *
 * The engine is the single source of truth for legality, turn and status; this
 * component never re-implements a rule. Pawn promotion defaults to a queen in
 * v1 (S-11 scope) — the engine still generates all four, we pick the queen.
 *
 * S-15 — UI
 */

import { useCallback, useMemo, useState } from 'react'
import {
  applyMove,
  createInitialState,
  getLegalMoves,
  indexToSquare,
  pieceAt,
  squareEquals,
} from '../engine'
import type { Color, GameState, Move, Square } from '../engine'
import { ChessBoard } from './ChessBoard'
import styles from './ChessGame.module.css'

interface Selection {
  readonly selected: Square | null
  readonly legalTargets: Square[]
}

const NO_SELECTION: Selection = { selected: null, legalTargets: [] }

/** Finds the king square for `color`, for the check halo. */
function findKingSquare(state: GameState, color: Color): Square | null {
  for (let i = 0; i < 64; i++) {
    const p = state.board[i]
    if (p != null && p.type === 'king' && p.color === color) {
      return indexToSquare(i)
    }
  }
  return null
}

function colorLabel(color: Color): string {
  return color === 'white' ? 'White' : 'Black'
}

export function ChessGame() {
  const [state, setState] = useState<GameState>(createInitialState)
  const [selection, setSelection] = useState<Selection>(NO_SELECTION)

  const isOver = state.status === 'checkmate' || state.status === 'stalemate'

  // The king square to halo when someone is in check or mated.
  const checkSquare = useMemo(() => {
    if (state.status === 'check' || state.status === 'checkmate') {
      return findKingSquare(state, state.turn)
    }
    return null
  }, [state])

  const handleSelect = useCallback(
    (square: Square) => {
      if (isOver) return

      // Clicking the already-selected square clears the selection.
      if (selection.selected && squareEquals(selection.selected, square)) {
        setSelection(NO_SELECTION)
        return
      }

      // If a piece is selected and this is a legal target, play the move.
      if (selection.selected) {
        const moves = getLegalMoves(state, selection.selected)
        // Prefer the queen promotion when several moves share this target.
        const candidates = moves.filter((m) => squareEquals(m.to, square))
        const move: Move | undefined =
          candidates.find(
            (m) => m.flags.promotion && m.flags.promotionPiece === 'queen',
          ) ?? candidates[0]

        if (move) {
          setState(applyMove(state, move))
          setSelection(NO_SELECTION)
          return
        }
      }

      // Otherwise try to select the piece on this square (own side only).
      const piece = pieceAt(state.board, square)
      if (piece != null && piece.color === state.turn) {
        const targets = getLegalMoves(state, square).map((m) => m.to)
        setSelection({ selected: square, legalTargets: targets })
      } else {
        setSelection(NO_SELECTION)
      }
    },
    [isOver, selection.selected, state],
  )

  const handleReset = useCallback(() => {
    setState(createInitialState())
    setSelection(NO_SELECTION)
  }, [])

  const status = describeStatus(state)

  return (
    <section className={styles.game} aria-label="Chess game">
      <div className={styles.statusBar}>
        <div className={styles.turn}>
          <span
            className={`${styles.turnDot} ${
              state.turn === 'white' ? styles.dotWhite : styles.dotBlack
            }`}
            aria-hidden="true"
          />
          <span className={styles.turnText}>
            {isOver ? 'Game over' : `${colorLabel(state.turn)} to move`}
          </span>
        </div>

        <span
          className={`${styles.statusBadge} ${styles[status.tone]}`}
          role="status"
          aria-live="polite"
        >
          {status.text}
        </span>

        <button type="button" className={styles.resetBtn} onClick={handleReset}>
          New game
        </button>
      </div>

      <ChessBoard
        board={state.board}
        turn={state.turn}
        selected={selection.selected}
        legalTargets={selection.legalTargets}
        checkSquare={checkSquare}
        lastMove={state.lastMove}
        active={!isOver}
        onSelect={handleSelect}
      />

      <p className={styles.hint}>
        Click a {colorLabel(state.turn).toLowerCase()} piece, then click a
        highlighted square to move.
      </p>
    </section>
  )
}

type StatusTone = 'neutral' | 'check' | 'mate' | 'draw'

function describeStatus(state: GameState): { text: string; tone: StatusTone } {
  const mover = colorLabel(state.turn)
  const winner = state.turn === 'white' ? 'Black' : 'White'
  switch (state.status) {
    case 'check':
      return { text: `${mover} is in check`, tone: 'check' }
    case 'checkmate':
      return { text: `Checkmate — ${winner} wins`, tone: 'mate' }
    case 'stalemate':
      return { text: 'Stalemate — draw', tone: 'draw' }
    default:
      return { text: 'In progress', tone: 'neutral' }
  }
}
