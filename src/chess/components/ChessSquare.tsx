/**
 * ChessSquare — a single cell of the board.
 * ------------------------------------------
 * Pure presentational button. It renders the piece (if any) as a Unicode glyph
 * and exposes its visual state (selected / legal target / check / last move)
 * through CSS-module classes. All interaction is a single onSelect(square)
 * callback — the parent decides whether a click means "select" or "move".
 *
 * Every square is a real <button>, so the whole board is keyboard-operable and
 * announced by screen readers via its aria-label.
 *
 * S-15 — UI
 */

import { squareName } from '../engine'
import type { Piece, Square } from '../engine'
import styles from './ChessSquare.module.css'

/** Unicode chess glyphs, keyed by colour then piece type. */
const GLYPHS: Record<Piece['color'], Record<Piece['type'], string>> = {
  white: {
    king: '\u2654',
    queen: '\u2655',
    rook: '\u2656',
    bishop: '\u2657',
    knight: '\u2658',
    pawn: '\u2659',
  },
  black: {
    king: '\u265A',
    queen: '\u265B',
    rook: '\u265C',
    bishop: '\u265D',
    knight: '\u265E',
    pawn: '\u265F',
  },
}

const PIECE_NAMES: Record<Piece['type'], string> = {
  king: 'king',
  queen: 'queen',
  rook: 'rook',
  bishop: 'bishop',
  knight: 'knight',
  pawn: 'pawn',
}

export interface ChessSquareProps {
  readonly square: Square
  readonly piece: Piece | null
  /** Light or dark board cell, for the checkerboard pattern. */
  readonly shade: 'light' | 'dark'
  readonly selected: boolean
  /** A legal destination for the currently selected piece. */
  readonly isLegalTarget: boolean
  /** The king in check sits here — rendered with a danger halo. */
  readonly inCheck: boolean
  /** Part of the last move played (from or to). */
  readonly isLastMove: boolean
  /** Whether a piece can be acted on / moved to this turn (drives the cursor). */
  readonly interactive: boolean
  readonly onSelect: (square: Square) => void
}

export function ChessSquare({
  square,
  piece,
  shade,
  selected,
  isLegalTarget,
  inCheck,
  isLastMove,
  interactive,
  onSelect,
}: ChessSquareProps) {
  const name = squareName(square)

  const label = piece
    ? `${name}, ${piece.color} ${PIECE_NAMES[piece.type]}${
        isLegalTarget ? ', capture' : ''
      }`
    : isLegalTarget
      ? `${name}, move here`
      : `${name}, empty`

  const className = [
    styles.square,
    shade === 'light' ? styles.light : styles.dark,
    selected ? styles.selected : '',
    isLastMove ? styles.lastMove : '',
    inCheck ? styles.inCheck : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      data-square={name}
      aria-label={label}
      aria-pressed={selected}
      disabled={!interactive}
      onClick={() => onSelect(square)}
    >
      {piece && (
        <span
          className={`${styles.piece} ${
            piece.color === 'white' ? styles.white : styles.blackPiece
          }`}
          aria-hidden="true"
        >
          {GLYPHS[piece.color][piece.type]}
        </span>
      )}
      {isLegalTarget && (
        <span
          className={piece ? styles.captureRing : styles.moveDot}
          aria-hidden="true"
        />
      )}
    </button>
  )
}
