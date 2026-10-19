/**
 * Chess Engine — Pseudo-legal Move Generation
 * -------------------------------------------
 * Generates every move a piece could make ignoring whether it leaves the
 * moving side's own king in check. legal.ts applies that filter.
 *
 * Pure: no React, no DOM.
 *
 * S-13 — Implementation
 */

import { isOnBoard, makeSquare, pieceAt, squareEquals, squareIndex } from './board'
import type {
  Board,
  CastlingRights,
  Color,
  GameState,
  Move,
  MoveFlags,
  Piece,
  PromotionPiece,
  Square,
} from './types'

const NO_FLAGS: MoveFlags = {
  castleKingside: false,
  castleQueenside: false,
  enPassant: false,
  promotion: false,
  promotionPiece: null,
}

function flags(partial: Partial<MoveFlags>): MoveFlags {
  return { ...NO_FLAGS, ...partial }
}

const PROMOTION_PIECES: PromotionPiece[] = ['queen', 'rook', 'bishop', 'knight']

const BISHOP_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]
const ROOK_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]
const KNIGHT_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
]
const KING_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
]

function makeMove(
  board: Board,
  piece: Piece,
  from: Square,
  to: Square,
  moveFlags: MoveFlags = NO_FLAGS,
  explicitCaptured?: Piece | null,
): Move {
  const captured =
    explicitCaptured !== undefined ? explicitCaptured : pieceAt(board, to)
  return { from, to, piece, captured, flags: moveFlags }
}

/** Pushes a pawn move, expanding to four promotion moves on the back rank. */
function pushPawnMove(
  out: Move[],
  board: Board,
  piece: Piece,
  from: Square,
  to: Square,
  isCapture: boolean,
): void {
  const backRank = piece.color === 'white' ? 7 : 0
  const captured = isCapture ? pieceAt(board, to) : null
  if (to.rank === backRank) {
    for (const promo of PROMOTION_PIECES) {
      out.push(
        makeMove(
          board,
          piece,
          from,
          to,
          flags({ promotion: true, promotionPiece: promo }),
          captured,
        ),
      )
    }
  } else {
    out.push(makeMove(board, piece, from, to, NO_FLAGS, captured))
  }
}

function slidingMoves(
  board: Board,
  piece: Piece,
  from: Square,
  dirs: ReadonlyArray<readonly [number, number]>,
): Move[] {
  const out: Move[] = []
  for (const [df, dr] of dirs) {
    let file = from.file + df
    let rank = from.rank + dr
    while (isOnBoard(file, rank)) {
      const to = makeSquare(file, rank)
      const occupant = board[squareIndex(to)]
      if (occupant === null || occupant === undefined) {
        out.push(makeMove(board, piece, from, to))
      } else {
        if (occupant.color !== piece.color) {
          out.push(makeMove(board, piece, from, to))
        }
        break
      }
      file += df
      rank += dr
    }
  }
  return out
}

function stepMoves(
  board: Board,
  piece: Piece,
  from: Square,
  deltas: ReadonlyArray<readonly [number, number]>,
): Move[] {
  const out: Move[] = []
  for (const [df, dr] of deltas) {
    const file = from.file + df
    const rank = from.rank + dr
    if (!isOnBoard(file, rank)) continue
    const to = makeSquare(file, rank)
    const occupant = board[squareIndex(to)]
    if (occupant === null || occupant === undefined || occupant.color !== piece.color) {
      out.push(makeMove(board, piece, from, to))
    }
  }
  return out
}

function pawnMoves(state: GameState, piece: Piece, from: Square): Move[] {
  const out: Move[] = []
  const { board } = state
  const dir = piece.color === 'white' ? 1 : -1
  const startRank = piece.color === 'white' ? 1 : 6

  // Single push.
  const oneRank = from.rank + dir
  if (isOnBoard(from.file, oneRank)) {
    const one = makeSquare(from.file, oneRank)
    if (board[squareIndex(one)] == null) {
      pushPawnMove(out, board, piece, from, one, false)

      // Double push from the starting rank.
      if (from.rank === startRank) {
        const two = makeSquare(from.file, from.rank + 2 * dir)
        if (board[squareIndex(two)] == null) {
          out.push(makeMove(board, piece, from, two))
        }
      }
    }
  }

  // Diagonal captures (incl. en passant).
  for (const df of [-1, 1]) {
    const file = from.file + df
    const rank = from.rank + dir
    if (!isOnBoard(file, rank)) continue
    const to = makeSquare(file, rank)
    const occupant = board[squareIndex(to)]
    if (occupant != null && occupant.color !== piece.color) {
      pushPawnMove(out, board, piece, from, to, true)
    } else if (
      state.enPassantTarget != null &&
      squareEquals(to, state.enPassantTarget)
    ) {
      // The captured pawn sits beside `from`, not on `to`.
      const capturedPawn = pieceAt(board, makeSquare(file, from.rank))
      out.push(
        makeMove(
          board,
          piece,
          from,
          to,
          flags({ enPassant: true }),
          capturedPawn,
        ),
      )
    }
  }

  return out
}

function kingMoves(state: GameState, piece: Piece, from: Square): Move[] {
  const out = stepMoves(state.board, piece, from, KING_DELTAS)
  out.push(...castlingMoves(state, piece, from))
  return out
}

/** Reads whether this colour still holds a given side's castling right. */
function hasRight(
  rights: CastlingRights,
  color: Color,
  side: 'kingside' | 'queenside',
): boolean {
  if (color === 'white') {
    return side === 'kingside' ? rights.whiteKingside : rights.whiteQueenside
  }
  return side === 'kingside' ? rights.blackKingside : rights.blackQueenside
}

/**
 * Generates castling pseudo-moves. The in-check / passing-through-check
 * constraints are enforced in legal.ts; here we only verify rights, piece
 * placement and empty squares.
 */
function castlingMoves(state: GameState, piece: Piece, from: Square): Move[] {
  const out: Move[] = []
  const { board, castling } = state
  const homeRank = piece.color === 'white' ? 0 : 7

  // King must be on its home square (e-file, home rank) to castle.
  if (from.file !== 4 || from.rank !== homeRank) return out

  // Kingside: f and g empty, rook on h.
  if (hasRight(castling, piece.color, 'kingside')) {
    const fSq = makeSquare(5, homeRank)
    const gSq = makeSquare(6, homeRank)
    const rook = pieceAt(board, makeSquare(7, homeRank))
    if (
      board[squareIndex(fSq)] == null &&
      board[squareIndex(gSq)] == null &&
      rook != null &&
      rook.type === 'rook' &&
      rook.color === piece.color
    ) {
      out.push(makeMove(board, piece, from, gSq, flags({ castleKingside: true }), null))
    }
  }

  // Queenside: b, c, d empty, rook on a.
  if (hasRight(castling, piece.color, 'queenside')) {
    const bSq = makeSquare(1, homeRank)
    const cSq = makeSquare(2, homeRank)
    const dSq = makeSquare(3, homeRank)
    const rook = pieceAt(board, makeSquare(0, homeRank))
    if (
      board[squareIndex(bSq)] == null &&
      board[squareIndex(cSq)] == null &&
      board[squareIndex(dSq)] == null &&
      rook != null &&
      rook.type === 'rook' &&
      rook.color === piece.color
    ) {
      out.push(makeMove(board, piece, from, cSq, flags({ castleQueenside: true }), null))
    }
  }

  return out
}

/**
 * Generates every pseudo-legal move for the piece on `square`.
 * Returns [] if the square is empty.
 * Does NOT check whether the moving side's king is left in check.
 */
export function generatePseudoLegal(state: GameState, square: Square): Move[] {
  const piece = pieceAt(state.board, square)
  if (piece == null) return []

  switch (piece.type) {
    case 'pawn':
      return pawnMoves(state, piece, square)
    case 'knight':
      return stepMoves(state.board, piece, square, KNIGHT_DELTAS)
    case 'bishop':
      return slidingMoves(state.board, piece, square, BISHOP_DIRS)
    case 'rook':
      return slidingMoves(state.board, piece, square, ROOK_DIRS)
    case 'queen':
      return slidingMoves(state.board, piece, square, [...ROOK_DIRS, ...BISHOP_DIRS])
    case 'king':
      return kingMoves(state, piece, square)
    default: {
      const exhaustive: never = piece.type
      throw new Error(`unknown piece type: ${String(exhaustive)}`)
    }
  }
}

/**
 * Returns true if `square` is attacked by any piece of `byColor`.
 * Used for check detection and castling legality.
 */
export function isSquareAttacked(
  board: Board,
  square: Square,
  byColor: Color,
): boolean {
  // Pawn attacks: a pawn of byColor attacks diagonally "forward".
  const pawnDir = byColor === 'white' ? 1 : -1
  for (const df of [-1, 1]) {
    const file = square.file - df
    const rank = square.rank - pawnDir
    if (isOnBoard(file, rank)) {
      const p = board[squareIndex(makeSquare(file, rank))]
      if (p != null && p.color === byColor && p.type === 'pawn') return true
    }
  }

  // Knight attacks.
  for (const [df, dr] of KNIGHT_DELTAS) {
    const file = square.file + df
    const rank = square.rank + dr
    if (!isOnBoard(file, rank)) continue
    const p = board[squareIndex(makeSquare(file, rank))]
    if (p != null && p.color === byColor && p.type === 'knight') return true
  }

  // King attacks (adjacent).
  for (const [df, dr] of KING_DELTAS) {
    const file = square.file + df
    const rank = square.rank + dr
    if (!isOnBoard(file, rank)) continue
    const p = board[squareIndex(makeSquare(file, rank))]
    if (p != null && p.color === byColor && p.type === 'king') return true
  }

  // Sliding attacks: bishop/queen on diagonals, rook/queen on orthogonals.
  if (slideAttack(board, square, byColor, BISHOP_DIRS, 'bishop')) return true
  if (slideAttack(board, square, byColor, ROOK_DIRS, 'rook')) return true

  return false
}

function slideAttack(
  board: Board,
  square: Square,
  byColor: Color,
  dirs: ReadonlyArray<readonly [number, number]>,
  lineType: 'bishop' | 'rook',
): boolean {
  for (const [df, dr] of dirs) {
    let file = square.file + df
    let rank = square.rank + dr
    while (isOnBoard(file, rank)) {
      const p = board[squareIndex(makeSquare(file, rank))]
      if (p != null) {
        if (
          p.color === byColor &&
          (p.type === lineType || p.type === 'queen')
        ) {
          return true
        }
        break
      }
      file += df
      rank += dr
    }
  }
  return false
}
