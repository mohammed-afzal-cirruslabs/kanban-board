/**
 * Chess Engine — Core behaviour tests (S-13)
 * ------------------------------------------
 * Pins the engine's rules so the UI (S-15) and the full QA suite (S-16) build
 * on a known-good foundation. Pure engine — no React, no DOM. S-16 adds the
 * comprehensive chess.engine.test.ts / chess.ui.test.tsx against the same API.
 */

import { describe, expect, it } from 'vitest'
import {
  applyMove,
  computeStatus,
  createInitialState,
  getAllLegalMoves,
  getLegalMoves,
  indexToSquare,
  isInCheck,
  parseSquare,
  pieceAt,
  squareEquals,
  squareIndex,
  squareName,
} from '../chess/engine'
import type { GameState, Move, Piece, Square } from '../chess/engine'

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Finds the legal move from → to (optionally a promotion) and applies it. */
function play(state: GameState, from: string, to: string, promo?: string): GameState {
  const fromSq = parseSquare(from)
  const toSq = parseSquare(to)
  const moves = getLegalMoves(state, fromSq)
  const move = moves.find(
    (m) =>
      squareEquals(m.to, toSq) &&
      (promo == null || m.flags.promotionPiece === promo),
  )
  if (move == null) {
    throw new Error(`no legal move ${from}->${to}${promo ? '=' + promo : ''}`)
  }
  return applyMove(state, move)
}

const idx = (sq: Square): number => sq.rank * 8 + sq.file

/** Builds a GameState from an explicit {square: piece} map. No castling rights. */
function position(turn: 'white' | 'black', pieces: Record<string, Piece>): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null)
  for (const [name, piece] of Object.entries(pieces)) {
    board[idx(parseSquare(name))] = piece
  }
  const s: GameState = {
    board,
    turn,
    status: 'playing',
    enPassantTarget: null,
    castling: {
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
    },
    halfMoveClock: 0,
    fullMoveNumber: 1,
    lastMove: null,
  }
  return { ...s, status: computeStatus(s) }
}

// ─── board utilities ──────────────────────────────────────────────────────────

describe('board utilities', () => {
  it('round-trips square index and square', () => {
    for (let i = 0; i < 64; i++) {
      expect(squareIndex(indexToSquare(i))).toBe(i)
    }
  })

  it('names and parses squares', () => {
    expect(squareName({ file: 4, rank: 0 })).toBe('e1')
    expect(squareName({ file: 0, rank: 7 })).toBe('a8')
    expect(parseSquare('e2')).toEqual({ file: 4, rank: 1 })
    expect(parseSquare('h8')).toEqual({ file: 7, rank: 7 })
  })

  it('throws on an invalid square name', () => {
    expect(() => parseSquare('z9')).toThrow()
    expect(() => parseSquare('e')).toThrow()
  })
})

// ─── initial position ───────────────────────────────────────────────────────

describe('initial position', () => {
  const state = createInitialState()

  it('has white to move and full castling rights', () => {
    expect(state.turn).toBe('white')
    expect(state.status).toBe('playing')
    expect(state.castling).toEqual({
      whiteKingside: true,
      whiteQueenside: true,
      blackKingside: true,
      blackQueenside: true,
    })
  })

  it('places the back ranks and pawns correctly', () => {
    expect(pieceAt(state.board, parseSquare('e1'))).toEqual({ type: 'king', color: 'white' })
    expect(pieceAt(state.board, parseSquare('d8'))).toEqual({ type: 'queen', color: 'black' })
    expect(pieceAt(state.board, parseSquare('a1'))).toEqual({ type: 'rook', color: 'white' })
    expect(pieceAt(state.board, parseSquare('e2'))).toEqual({ type: 'pawn', color: 'white' })
    expect(pieceAt(state.board, parseSquare('e4'))).toBeNull()
  })

  it('offers 20 legal opening moves', () => {
    expect(getAllLegalMoves(state)).toHaveLength(20)
  })

  it('gives a knight 2 moves and a pawn its single/double push', () => {
    expect(getLegalMoves(state, parseSquare('b1'))).toHaveLength(2)
    const pawn = getLegalMoves(state, parseSquare('e2')).map((m) => squareName(m.to)).sort()
    expect(pawn).toEqual(['e3', 'e4'])
  })

  it('returns no moves for an empty square or the opponent', () => {
    expect(getLegalMoves(state, parseSquare('e4'))).toHaveLength(0)
    expect(getLegalMoves(state, parseSquare('e7'))).toHaveLength(0)
  })
})

// ─── turn management ──────────────────────────────────────────────────────────

describe('turn management', () => {
  it('flips the turn and increments the move number after black moves', () => {
    let s = createInitialState()
    expect(s.turn).toBe('white')
    s = play(s, 'e2', 'e4')
    expect(s.turn).toBe('black')
    expect(s.fullMoveNumber).toBe(1)
    s = play(s, 'e7', 'e5')
    expect(s.turn).toBe('white')
    expect(s.fullMoveNumber).toBe(2)
  })
})

// ─── check, checkmate, stalemate ───────────────────────────────────────────────

describe('check and checkmate', () => {
  it("detects fool's mate as checkmate", () => {
    let s = createInitialState()
    s = play(s, 'f2', 'f3')
    s = play(s, 'e7', 'e5')
    s = play(s, 'g2', 'g4')
    s = play(s, 'd8', 'h4') // Qh4#
    expect(isInCheck(s, 'white')).toBe(true)
    expect(s.status).toBe('checkmate')
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })

  it('reports check (not checkmate) when the king has a legal escape', () => {
    // Black Ke8 is checked along the e-file by white Re1. The king may step to
    // any adjacent square off the e-file that is not itself attacked:
    // d7, d8, f7 and f8. Black also has a rook on a7, so there are non-king
    // replies too — confirming it is check, not checkmate.
    const s = position('black', {
      e8: { type: 'king', color: 'black' },
      a7: { type: 'rook', color: 'black' },
      e1: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(true)
    expect(s.status).toBe('check')
    const kingEscapes = getLegalMoves(s, parseSquare('e8')).map((m) => squareName(m.to)).sort()
    expect(kingEscapes).toEqual(['d7', 'd8', 'f7', 'f8'])
    expect(getAllLegalMoves(s).length).toBeGreaterThan(0)
  })

  it('never offers a move that leaves the moving side in check', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    s = play(s, 'd7', 'd5')
    for (const m of getAllLegalMoves(s)) {
      const after = applyMove(s, m)
      expect(isInCheck(after, m.piece.color)).toBe(false)
    }
  })

  it('does not let a pinned piece expose its own king', () => {
    // Black Ke8, black bishop on e7 shielding the king from white Re1.
    // Any bishop move uncovers the e-file, so the bishop has zero legal moves.
    const s = position('black', {
      e8: { type: 'king', color: 'black' },
      e7: { type: 'bishop', color: 'black' },
      e1: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(getLegalMoves(s, parseSquare('e7'))).toHaveLength(0)
  })
})

describe('stalemate', () => {
  it('detects a classic king+queen stalemate', () => {
    // Black king a8, white king c7, white queen b6 — black to move, stalemate.
    const s = position('black', {
      a8: { type: 'king', color: 'black' },
      c7: { type: 'king', color: 'white' },
      b6: { type: 'queen', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(getAllLegalMoves(s)).toHaveLength(0)
    expect(s.status).toBe('stalemate')
  })
})

// ─── special moves ─────────────────────────────────────────────────────────────

describe('special moves', () => {
  it('sets an en passant target on a double pawn push and allows the capture', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    s = play(s, 'a7', 'a6')
    s = play(s, 'e4', 'e5')
    s = play(s, 'd7', 'd5') // black double-push beside the white pawn
    expect(s.enPassantTarget).toEqual(parseSquare('d6'))
    const epMoves = getLegalMoves(s, parseSquare('e5'))
    const ep = epMoves.find((m) => m.flags.enPassant)
    expect(ep).toBeDefined()
    expect(squareName(ep!.to)).toBe('d6')
    s = applyMove(s, ep as Move)
    expect(pieceAt(s.board, parseSquare('d5'))).toBeNull() // captured pawn gone
    expect(pieceAt(s.board, parseSquare('d6'))).toEqual({ type: 'pawn', color: 'white' })
  })

  it('castles kingside and moves the rook', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    s = play(s, 'e7', 'e5')
    s = play(s, 'g1', 'f3')
    s = play(s, 'g8', 'f6')
    s = play(s, 'f1', 'c4')
    s = play(s, 'f8', 'c5')
    const castle = getLegalMoves(s, parseSquare('e1')).find((m) => m.flags.castleKingside)
    expect(castle).toBeDefined()
    s = applyMove(s, castle as Move)
    expect(pieceAt(s.board, parseSquare('g1'))).toEqual({ type: 'king', color: 'white' })
    expect(pieceAt(s.board, parseSquare('f1'))).toEqual({ type: 'rook', color: 'white' })
    expect(pieceAt(s.board, parseSquare('h1'))).toBeNull()
    expect(s.castling.whiteKingside).toBe(false)
    expect(s.castling.whiteQueenside).toBe(false)
  })

  it('cannot castle through an attacked square', () => {
    // White Ke1, Rh1; black rook on f8 attacks f1 — the king's transit square.
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      h1: { type: 'rook', color: 'white' },
      f8: { type: 'rook', color: 'black' },
      a8: { type: 'king', color: 'black' },
    })
    // `position` clears rights; re-enable the kingside right to prove the
    // transit-square rule is what blocks the castle, not a missing right.
    const withRights: GameState = {
      ...s,
      castling: { ...s.castling, whiteKingside: true },
    }
    const king = getLegalMoves(withRights, parseSquare('e1'))
    expect(king.some((m) => m.flags.castleKingside)).toBe(false)
  })

  it('offers all four promotions and promotes a pawn to a queen', () => {
    const s = position('white', {
      a7: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    const moves = getLegalMoves(s, parseSquare('a7'))
    const promos = moves.filter((m) => m.flags.promotion).map((m) => m.flags.promotionPiece)
    expect(promos.sort()).toEqual(['bishop', 'knight', 'queen', 'rook'])
    const next = play(s, 'a7', 'a8', 'queen')
    expect(pieceAt(next.board, parseSquare('a8'))).toEqual({ type: 'queen', color: 'white' })
  })
})
