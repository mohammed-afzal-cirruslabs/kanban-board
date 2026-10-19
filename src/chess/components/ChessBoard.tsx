/**
 * ChessBoard — the 8x8 grid.
 * --------------------------
 * Renders the board from engine state. Rows are drawn rank 8 (top) down to
 * rank 1 (bottom) so White sits at the foot, matching a real board. Each cell
 * is a ChessSquare; this component only decides each square's visual state
 * from the props the parent computed (selection, legal targets, check, last
 * move) and forwards clicks up.
 *
 * S-15 — UI
 */

import { indexToSquare, pieceAt, squareEquals, squareName } from '../engine'
import type { Board, Color, Move, Square } from '../engine'
import { ChessSquare } from './ChessSquare'
import styles from './ChessBoard.module.css'

export interface ChessBoardProps {
  readonly board: Board
  /** Side to move — only its pieces are interactive when nothing is selected. */
  readonly turn: Color
  readonly selected: Square | null
  readonly legalTargets: readonly Square[]
  /** Square of the king in check, or null. */
  readonly checkSquare: Square | null
  readonly lastMove: Move | null
  /** False once the game is over — the whole board becomes non-interactive. */
  readonly active: boolean
  readonly onSelect: (square: Square) => void
}

// Ranks drawn top→bottom (8..1) and files left→right (a..h).
const RANKS = [7, 6, 5, 4, 3, 2, 1, 0] as const
const FILES = [0, 1, 2, 3, 4, 5, 6, 7] as const

function containsSquare(list: readonly Square[], sq: Square): boolean {
  return list.some((s) => squareEquals(s, sq))
}

export function ChessBoard({
  board,
  turn,
  selected,
  legalTargets,
  checkSquare,
  lastMove,
  active,
  onSelect,
}: ChessBoardProps) {
  return (
    <div
      className={styles.board}
      role="grid"
      aria-label="Chess board"
      aria-disabled={!active}
    >
      {RANKS.map((rank) => (
        <div className={styles.row} role="row" key={rank}>
          {FILES.map((file) => {
            const square = indexToSquare(rank * 8 + file)
            const piece = pieceAt(board, square)
            const isSelected = selected != null && squareEquals(selected, square)
            const isLegalTarget = containsSquare(legalTargets, square)
            const inCheck =
              checkSquare != null && squareEquals(checkSquare, square)
            const isLastMove =
              lastMove != null &&
              (squareEquals(lastMove.from, square) ||
                squareEquals(lastMove.to, square))

            // A square is interactive if the game is live and either it is a
            // legal destination, or it holds a piece of the side to move.
            const interactive =
              active &&
              (isLegalTarget ||
                (piece != null && piece.color === turn) ||
                isSelected)

            return (
              <div className={styles.cell} role="gridcell" key={file}>
                <ChessSquare
                  square={square}
                  piece={piece}
                  shade={(rank + file) % 2 === 0 ? 'dark' : 'light'}
                  selected={isSelected}
                  isLegalTarget={isLegalTarget}
                  inCheck={inCheck}
                  isLastMove={isLastMove}
                  interactive={interactive}
                  onSelect={onSelect}
                />
                {/* Coordinate labels: files on rank 1, ranks on file a. */}
                {file === 0 && (
                  <span className={styles.rankLabel} aria-hidden="true">
                    {rank + 1}
                  </span>
                )}
                {rank === 0 && (
                  <span className={styles.fileLabel} aria-hidden="true">
                    {squareName(square)[0]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
