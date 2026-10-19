/**
 * Chess Engine — Legality Filter
 * ------------------------------
 * Turns pseudo-legal moves into fully legal ones:
 *   - a move is illegal if it leaves the mover's own king in check
 *   - castling is additionally illegal if the king is currently in check,
 *     or passes through / lands on an attacked square
 *
 * Pure: no React, no DOM.
 *
 * S-13 — Implementation
 */

import { applyMoveRaw } from './apply'
import { indexToSquare, makeSquare, pieceAt } from './board'
import { generatePseudoLegal, isSquareAttacked } from './moves'
import { isInCheck } from './status'
import type { Color, GameState, Move, Square } from './types'

/** A move is legal if, after applying it, the mover's king is not in check. */
function leavesKingSafe(state: GameState, move: Move): boolean {
  const next = applyMoveRaw(state, move)
  // `next.turn` is the opponent now; we test the colour that just moved.
  return !isInCheck(next, move.piece.color)
}

/**
 * Castling legality beyond empty-square checks: the king may not be in check,
 * nor move through or into an attacked square.
 */
function castlingIsLegal(state: GameState, move: Move): boolean {
  const color: Color = move.piece.color
  const attacker: Color = color === 'white' ? 'black' : 'white'
  const rank = move.from.rank
  const board = state.board

  // King may not castle out of check.
  if (isSquareAttacked(board, move.from, attacker)) return false

  // Squares the king passes through (and lands on) must be safe.
  const throughFiles = move.flags.castleKingside ? [5, 6] : [3, 2]
  for (const file of throughFiles) {
    if (isSquareAttacked(board, makeSquare(file, rank), attacker)) return false
  }
  return true
}

/**
 * Returns every legal move for the piece on `square`.
 *
 * Returns [] if:
 *   - the square is empty
 *   - the square holds a piece of the side NOT to move
 *   - the game is already over (checkmate / stalemate)
 */
export function getLegalMoves(state: GameState, square: Square): Move[] {
  if (state.status === 'checkmate' || state.status === 'stalemate') return []

  const piece = pieceAt(state.board, square)
  if (piece == null || piece.color !== state.turn) return []

  const pseudo = generatePseudoLegal(state, square)
  const legal: Move[] = []
  for (const move of pseudo) {
    if (move.flags.castleKingside || move.flags.castleQueenside) {
      if (!castlingIsLegal(state, move)) continue
    }
    if (leavesKingSafe(state, move)) legal.push(move)
  }
  return legal
}

/**
 * Returns ALL legal moves for the side to move.
 * Does NOT short-circuit on status (status is computed FROM this), so it must
 * not call getLegalMoves' status guard — it generates directly.
 */
export function getAllLegalMoves(state: GameState): Move[] {
  const out: Move[] = []
  const { board, turn } = state
  for (let i = 0; i < 64; i++) {
    const piece = board[i]
    if (piece == null || piece.color !== turn) continue
    const from = indexToSquare(i)
    const pseudo = generatePseudoLegal(state, from)
    for (const move of pseudo) {
      if (move.flags.castleKingside || move.flags.castleQueenside) {
        if (!castlingIsLegal(state, move)) continue
      }
      if (leavesKingSafe(state, move)) out.push(move)
    }
  }
  return out
}
