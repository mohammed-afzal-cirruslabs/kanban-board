/**
 * Chess Engine — Move Application
 * -------------------------------
 * applyMoveRaw performs the board/state transform WITHOUT recomputing status,
 * so legal.ts can use it to test "does this move leave my king in check?"
 * without triggering the status → getAllLegalMoves → legal recursion.
 *
 * applyMove is the public entry point: it runs the raw transform then
 * recomputes status for the new side to move.
 *
 * Pure: no React, no DOM.
 *
 * S-13 — Implementation
 */

import { cloneBoard, makeSquare, squareIndex } from './board'
import { computeStatus } from './status'
import type { CastlingRights, GameState, Move, Piece, Square } from './types'

/**
 * Applies a move to the board and advances turn/clocks/rights WITHOUT
 * recomputing game status. Used internally by legality checking.
 */
export function applyMoveRaw(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board)
  const mover = move.piece
  const fromIdx = squareIndex(move.from)
  const toIdx = squareIndex(move.to)

  // Lift the moving piece off its origin.
  board[fromIdx] = null

  // En passant: remove the captured pawn, which sits beside `from`.
  if (move.flags.enPassant) {
    const capturedPawnSq = makeSquare(move.to.file, move.from.rank)
    board[squareIndex(capturedPawnSq)] = null
  }

  // Place the piece (promotion swaps the type).
  if (move.flags.promotion && move.flags.promotionPiece != null) {
    board[toIdx] = { type: move.flags.promotionPiece, color: mover.color }
  } else {
    board[toIdx] = mover
  }

  // Castling: move the rook to the far side of the king.
  if (move.flags.castleKingside) {
    const rank = move.from.rank
    const rook = board[squareIndex(makeSquare(7, rank))]
    board[squareIndex(makeSquare(7, rank))] = null
    board[squareIndex(makeSquare(5, rank))] = rook
  } else if (move.flags.castleQueenside) {
    const rank = move.from.rank
    const rook = board[squareIndex(makeSquare(0, rank))]
    board[squareIndex(makeSquare(0, rank))] = null
    board[squareIndex(makeSquare(3, rank))] = rook
  }

  const castling = nextCastlingRights(state.castling, move)
  const enPassantTarget = nextEnPassantTarget(move)

  // Half-move clock: reset on pawn move or capture, else increment.
  const isPawnMove = mover.type === 'pawn'
  const isCapture = move.captured != null
  const halfMoveClock = isPawnMove || isCapture ? 0 : state.halfMoveClock + 1

  const fullMoveNumber =
    state.turn === 'black' ? state.fullMoveNumber + 1 : state.fullMoveNumber

  return {
    board,
    turn: state.turn === 'white' ? 'black' : 'white',
    status: state.status, // placeholder; applyMove recomputes it
    enPassantTarget,
    castling,
    halfMoveClock,
    fullMoveNumber,
    lastMove: move,
  }
}

function nextEnPassantTarget(move: Move): Square | null {
  if (move.piece.type !== 'pawn') return null
  const delta = move.to.rank - move.from.rank
  if (Math.abs(delta) !== 2) return null
  // The square the pawn skipped over.
  return makeSquare(move.from.file, move.from.rank + delta / 2)
}

function nextCastlingRights(rights: CastlingRights, move: Move): CastlingRights {
  let next: CastlingRights = rights
  const piece: Piece = move.piece

  // King move revokes both rights for that colour.
  if (piece.type === 'king') {
    next =
      piece.color === 'white'
        ? { ...next, whiteKingside: false, whiteQueenside: false }
        : { ...next, blackKingside: false, blackQueenside: false }
  }

  // A rook leaving its home square revokes that side's right.
  if (piece.type === 'rook') {
    if (piece.color === 'white' && move.from.rank === 0) {
      if (move.from.file === 0) next = { ...next, whiteQueenside: false }
      if (move.from.file === 7) next = { ...next, whiteKingside: false }
    }
    if (piece.color === 'black' && move.from.rank === 7) {
      if (move.from.file === 0) next = { ...next, blackQueenside: false }
      if (move.from.file === 7) next = { ...next, blackKingside: false }
    }
  }

  // Capturing a rook on its home square revokes the opponent's right there.
  if (move.captured != null && move.captured.type === 'rook') {
    if (move.to.rank === 0 && move.to.file === 0) next = { ...next, whiteQueenside: false }
    if (move.to.rank === 0 && move.to.file === 7) next = { ...next, whiteKingside: false }
    if (move.to.rank === 7 && move.to.file === 0) next = { ...next, blackQueenside: false }
    if (move.to.rank === 7 && move.to.file === 7) next = { ...next, blackKingside: false }
  }

  return next
}

/**
 * Applies a legal move and returns the next GameState with status recomputed.
 *
 * The move MUST come from getLegalMoves / getAllLegalMoves.
 */
export function applyMove(state: GameState, move: Move): GameState {
  const raw = applyMoveRaw(state, move)
  return { ...raw, status: computeStatus(raw) }
}
