/**
 * Chess Engine — Initial Position
 * -------------------------------
 * Builds the standard starting GameState. Pure.
 *
 * S-13 — Implementation
 */

import type { Board, GameState, Piece, PieceType } from './types'

const BACK_RANK: PieceType[] = [
  'rook',
  'knight',
  'bishop',
  'queen',
  'king',
  'bishop',
  'knight',
  'rook',
]

function buildInitialBoard(): Board {
  const board: (Piece | null)[] = new Array(64).fill(null)

  // Rank 0 (index 0-7): white back rank. Rank 1: white pawns.
  // Rank 7: black back rank. Rank 6: black pawns.
  for (let file = 0; file < 8; file++) {
    board[0 * 8 + file] = { type: BACK_RANK[file], color: 'white' }
    board[1 * 8 + file] = { type: 'pawn', color: 'white' }
    board[6 * 8 + file] = { type: 'pawn', color: 'black' }
    board[7 * 8 + file] = { type: BACK_RANK[file], color: 'black' }
  }

  return board
}

/**
 * Returns a GameState representing the standard starting position.
 * White to move, all castling rights, no en passant.
 */
export function createInitialState(): GameState {
  return {
    board: buildInitialBoard(),
    turn: 'white',
    status: 'playing',
    enPassantTarget: null,
    castling: {
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    },
    halfMoveClock: 0,
    fullMoveNumber: 1,
    lastMove: null,
  }
}
