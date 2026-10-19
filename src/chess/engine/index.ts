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
 * Returns a GameState representing the standard starting position.
 * White to move, all castling rights, no en passant.
 */
export declare function createInitialState(): import('./types').GameState

// ─── Move Generation ─────────────────────────────────────────────────────────

/**
 * Returns every legal move for the piece on `square` in the given state.
 *
 * Returns [] if:
 *   - the square is empty
 *   - the square holds an opponent's piece
 *   - the game is already over (status is 'checkmate' or 'stalemate')
 *
 * "Legal" = pseudo-legal move that does NOT leave the moving side's king in
 * check after the move is applied.
 */
export declare function getLegalMoves(
  state: import('./types').GameState,
  square: import('./types').Square,
): import('./types').Move[]

/**
 * Returns ALL legal moves for the side to move.
 * Used internally for checkmate/stalemate detection; exposed for tests.
 */
export declare function getAllLegalMoves(
  state: import('./types').GameState,
): import('./types').Move[]

// ─── Move Application ────────────────────────────────────────────────────────

/**
 * Applies a legal move and returns the next GameState.
 *
 * The move MUST come from getLegalMoves / getAllLegalMoves.
 * Passing an arbitrary Move object is undefined behaviour.
 *
 * Handles:
 *   - captures (removes captured piece from board)
 *   - castling (moves rook to correct square)
 *   - en passant (removes the captured pawn, which is NOT on `move.to`)
 *   - promotion (replaces pawn with move.flags.promotionPiece)
 *   - castling-rights revocation (king or rook moved)
 *   - enPassantTarget update (set on two-square pawn advance, cleared otherwise)
 *   - half/full-move clock update
 *   - status recomputation via computeStatus
 *   - lastMove update
 */
export declare function applyMove(
  state: import('./types').GameState,
  move: import('./types').Move,
): import('./types').GameState

// ─── Status Queries ──────────────────────────────────────────────────────────

/**
 * Returns true if `color`'s king is currently attacked in `state`.
 */
export declare function isInCheck(
  state: import('./types').GameState,
  color: import('./types').Color,
): boolean

/**
 * Recomputes the game status for the side to move.
 * Called by applyMove; exposed for tests.
 *
 * Algorithm:
 *   moves = getAllLegalMoves(state)
 *   if moves.length === 0 && isInCheck(state, state.turn) → 'checkmate'
 *   if moves.length === 0 && !isInCheck(...)              → 'stalemate'
 *   if isInCheck(state, state.turn)                       → 'check'
 *   else                                                  → 'playing'
 */
export declare function computeStatus(
  state: import('./types').GameState,
): import('./types').GameStatus

// ─── Board Utilities ─────────────────────────────────────────────────────────

/** Converts a Square to a flat board index (rank * 8 + file). */
export declare function squareIndex(sq: import('./types').Square): number

/** Converts a flat board index to a Square. */
export declare function indexToSquare(index: number): import('./types').Square

/** Returns the piece on `square`, or null if empty. */
export declare function pieceAt(
  board: import('./types').Board,
  square: import('./types').Square,
): import('./types').Piece | null

/** Returns true if two squares refer to the same cell. */
export declare function squareEquals(
  a: import('./types').Square,
  b: import('./types').Square,
): boolean

/**
 * Returns the algebraic name of a square, e.g. { file:4, rank:0 } → "e1".
 * Used for aria-labels and test assertions.
 */
export declare function squareName(sq: import('./types').Square): string

/**
 * Parses an algebraic square name to a Square, e.g. "e2" → { file:4, rank:1 }.
 * Throws on invalid input.
 */
export declare function parseSquare(name: string): import('./types').Square
