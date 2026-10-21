/**
 * Chess Engine — Status Queries
 * -----------------------------
 * isInCheck and computeStatus (check / checkmate / stalemate).
 *
 * Pure: no React, no DOM.
 *
 * S-13 — Implementation
 */

import { indexToSquare } from './board'
import { getAllLegalMoves } from './legal'
import { isSquareAttacked } from './moves'
import type { Color, GameState, GameStatus, Square } from './types'

/** Finds the square of `color`'s king, or null if (impossibly) absent. */
function findKing(state: GameState, color: Color): Square | null {
  const { board } = state
  for (let i = 0; i < 64; i++) {
    const p = board[i]
    if (p != null && p.type === 'king' && p.color === color) {
      return indexToSquare(i)
    }
  }
  return null
}

/**
 * Returns true if `color`'s king is currently attacked in `state`.
 */
export function isInCheck(state: GameState, color: Color): boolean {
  const kingSq = findKing(state, color)
  if (kingSq == null) return false
  const attacker: Color = color === 'white' ? 'black' : 'white'
  return isSquareAttacked(state.board, kingSq, attacker)
}

/**
 * Recomputes the game status for the side to move.
 *
 *   0 legal moves + in check     → 'checkmate'
 *   0 legal moves + not in check → 'stalemate'
 *   in check + moves exist       → 'check'
 *   otherwise                    → 'playing'
 */
export function computeStatus(state: GameState): GameStatus {
  const moves = getAllLegalMoves(state)
  const inCheck = isInCheck(state, state.turn)
  if (moves.length === 0) {
    return inCheck ? 'checkmate' : 'stalemate'
  }
  return inCheck ? 'check' : 'playing'
}
