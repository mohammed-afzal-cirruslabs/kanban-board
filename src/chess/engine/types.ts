/**
 * Chess Engine — Public Type Contract
 * ------------------------------------
 * This file is the single source of truth for every type the engine exposes.
 * UI components and tests import ONLY from here and from the engine index.
 * Nothing in this file may import from React or any browser API.
 *
 * S-12 — Design: Ivy
 */

// ─── Primitives ──────────────────────────────────────────────────────────────

/** File index 0-7 (a–h). */
export type File = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/** Rank index 0-7 (rank 1–8). */
export type Rank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

/** A square on the board, e.g. { file: 4, rank: 0 } = e1. */
export interface Square {
  readonly file: File
  readonly rank: Rank
}

export type Color = 'white' | 'black'

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'

export interface Piece {
  readonly type: PieceType
  readonly color: Color
}

// ─── Board ───────────────────────────────────────────────────────────────────

/**
 * The board is a flat 64-element array indexed by (rank * 8 + file).
 * null means the square is empty.
 *
 * Chosen over bitboards and nested arrays for simplicity and testability.
 * Spread-copy for immutability is O(64) — negligible for a two-player game.
 * Not suitable for AI search; acceptable because S-11 excludes an AI opponent.
 */
export type Board = ReadonlyArray<Piece | null>

// ─── Moves ───────────────────────────────────────────────────────────────────

export type PromotionPiece = 'queen' | 'rook' | 'bishop' | 'knight'

/**
 * A fully-described legal move.
 * Every field needed to apply the move to the board is present — callers
 * never need to re-derive intent from from/to coordinates alone.
 */
export interface Move {
  readonly from: Square
  readonly to: Square
  /** Piece being moved (denormalised for fast rendering without a board lookup). */
  readonly piece: Piece
  /** Piece on the destination square before the move (null if empty). */
  readonly captured: Piece | null
  readonly flags: MoveFlags
}

export interface MoveFlags {
  readonly castleKingside: boolean
  readonly castleQueenside: boolean
  /** En passant capture — the captured pawn is NOT on `to`. */
  readonly enPassant: boolean
  /** Pawn reached the back rank; promotionPiece is set. */
  readonly promotion: boolean
  readonly promotionPiece: PromotionPiece | null
}

// ─── Game State ──────────────────────────────────────────────────────────────

export type GameStatus =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'

/**
 * The complete, immutable snapshot of a chess game at a point in time.
 * Every field needed to generate legal moves and render the board is here.
 * The engine never mutates this — it produces a new GameState per move.
 */
export interface GameState {
  /** Current board position. */
  readonly board: Board
  /** Whose turn it is. */
  readonly turn: Color
  /** Status of the game — drives the UI banner. */
  readonly status: GameStatus
  /**
   * The square a pawn can capture to via en passant, or null.
   * Set to the square the pawn passed through on a two-square advance.
   */
  readonly enPassantTarget: Square | null
  /** Castling rights — lost permanently when king or rook moves. */
  readonly castling: CastlingRights
  /** Half-move clock for the 50-move rule (informational; not enforced in v1). */
  readonly halfMoveClock: number
  /** Full move number (starts at 1, increments after Black moves). */
  readonly fullMoveNumber: number
  /** The last move played, for last-move highlight in the UI. */
  readonly lastMove: Move | null
}

export interface CastlingRights {
  readonly whiteKingside: boolean
  readonly whiteQueenside: boolean
  readonly blackKingside: boolean
  readonly blackQueenside: boolean
}

// ─── Selection State (owned by UI, not engine) ───────────────────────────────

/**
 * What the board UI tracks between clicks.
 * Lives in a React useState in ChessPage — NOT in GameState.
 */
export interface SelectionState {
  /** The square the user clicked first (piece to move). */
  readonly selected: Square | null
  /** Legal destinations for the selected piece, for highlight rendering. */
  readonly legalTargets: Square[]
}
