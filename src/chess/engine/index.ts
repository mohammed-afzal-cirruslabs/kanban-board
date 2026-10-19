/**
 * Chess Engine — Public API
 * -------------------------
 * All functions are pure: same inputs → same output, no side effects.
 * The UI and tests import from this file only; internal modules are private.
 *
 * Implementation files (S-13):
 *   board.ts · initial.ts · moves.ts · legal.ts · apply.ts · status.ts
 *
 * S-12 — Design: Ivy
 * S-13 — Implementation
 */

export type {
  File,
  Rank,
  Square,
  Color,
  PieceType,
  Piece,
  Board,
  Move,
  MoveFlags,
  PromotionPiece,
  GameState,
  GameStatus,
  CastlingRights,
  SelectionState,
} from './types'

// ─── Lifecycle ───────────────────────────────────────────────────────────────

/**
 * createInitialState — a GameState for the standard starting position.
 * White to move, all castling rights, no en passant.
 */
export { createInitialState } from './initial'

// ─── Move Generation ─────────────────────────────────────────────────────────

/**
 * getLegalMoves — every legal move for the piece on `square`.
 * getAllLegalMoves — every legal move for the side to move.
 *
 * "Legal" = a pseudo-legal move that does NOT leave the moving side's king in
 * check after it is applied. Both return [] once the game is over.
 */
export { getLegalMoves, getAllLegalMoves } from './legal'

// ─── Move Application ────────────────────────────────────────────────────────

/**
 * applyMove — apply a legal move and return the next GameState.
 *
 * The move MUST come from getLegalMoves / getAllLegalMoves. Handles captures,
 * castling (rook move), en passant, promotion, castling-rights revocation,
 * en-passant-target update, half/full-move clocks, status recomputation and
 * the lastMove field.
 */
export { applyMove } from './apply'

// ─── Status Queries ──────────────────────────────────────────────────────────

/**
 * isInCheck — true if `color`'s king is currently attacked in `state`.
 * computeStatus — recompute the game status for the side to move.
 */
export { isInCheck, computeStatus } from './status'

// ─── Board Utilities ─────────────────────────────────────────────────────────

/**
 * squareIndex — Square → flat board index (rank * 8 + file).
 * indexToSquare — flat board index → Square.
 * pieceAt — the piece on a square, or null.
 * squareEquals — true if two squares refer to the same cell.
 * squareName — algebraic name, e.g. { file:4, rank:0 } → "e1".
 * parseSquare — "e2" → { file:4, rank:1 }; throws on invalid input.
 */
export {
  squareIndex,
  indexToSquare,
  pieceAt,
  squareEquals,
  squareName,
  parseSquare,
} from './board'
