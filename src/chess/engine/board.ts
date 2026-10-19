/**
 * Chess Engine — Board Utilities
 * ------------------------------
 * Pure coordinate/board helpers. No React, no DOM.
 *
 * S-13 — Implementation
 */

import type { Board, File, Piece, Rank, Square } from './types'

/** Converts a Square to a flat board index (rank * 8 + file). */
export function squareIndex(sq: Square): number {
  return sq.rank * 8 + sq.file
}

/** Converts a flat board index to a Square. */
export function indexToSquare(index: number): Square {
  if (index < 0 || index > 63) {
    throw new RangeError(`board index out of range: ${index}`)
  }
  return {
    file: (index % 8) as File,
    rank: Math.floor(index / 8) as Rank,
  }
}

/** Returns the piece on `square`, or null if empty. */
export function pieceAt(board: Board, square: Square): Piece | null {
  return board[squareIndex(square)] ?? null
}

/** Returns true if two squares refer to the same cell. */
export function squareEquals(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank
}

/**
 * Returns the algebraic name of a square, e.g. { file:4, rank:0 } → "e1".
 * Used for aria-labels and test assertions.
 */
export function squareName(sq: Square): string {
  const fileChar = String.fromCharCode('a'.charCodeAt(0) + sq.file)
  const rankChar = String(sq.rank + 1)
  return `${fileChar}${rankChar}`
}

/**
 * Parses an algebraic square name to a Square, e.g. "e2" → { file:4, rank:1 }.
 * Throws on invalid input.
 */
export function parseSquare(name: string): Square {
  if (typeof name !== 'string' || name.length !== 2) {
    throw new Error(`invalid square name: ${JSON.stringify(name)}`)
  }
  const file = name.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = name.charCodeAt(1) - '1'.charCodeAt(0)
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`invalid square name: ${name}`)
  }
  return { file: file as File, rank: rank as Rank }
}

/** True if file/rank fall within the 8×8 board. */
export function isOnBoard(file: number, rank: number): boolean {
  return file >= 0 && file <= 7 && rank >= 0 && rank <= 7
}

/** Builds a Square from raw file/rank numbers already known to be on-board. */
export function makeSquare(file: number, rank: number): Square {
  return { file: file as File, rank: rank as Rank }
}

/** Returns a shallow mutable copy of the board for a single applyMove pass. */
export function cloneBoard(board: Board): (Piece | null)[] {
  return board.slice()
}
