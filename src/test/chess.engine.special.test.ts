/**
 * Chess Engine — Special moves & game state tests (S-16)
 * -------------------------------------------------------
 * Covers: turn alternation, check/checkmate/stalemate from known positions.
 * Style: matches chess.engine.core.test.ts — Vitest, no DOM, pure engine.
 */

import { describe, expect, it } from 'vitest'
import {
  applyMove,
  computeStatus,
  createInitialState,
  getAllLegalMoves,
  getLegalMoves,
  isInCheck,
  parseSquare,
  squareEquals,
  squareName,
} from '../chess/engine'
import type { GameState, Piece } from '../chess/engine'

// ─── helpers ─────────────────────────────────────────────────────────────────

function play(state: GameState, from: string, to: string, promo?: string): GameState {
  const fromSq = parseSquare(from)
  const toSq   = parseSquare(to)
  const moves  = getLegalMoves(state, fromSq)
  const move   = moves.find(
    (m) =>
      squareEquals(m.to, toSq) &&
      (promo == null || m.flags.promotionPiece === promo),
  )
  if (!move) throw new Error(`no legal move ${from}->${to}${promo ? '=' + promo : ''}`)
  return applyMove(state, move)
}

function position(
  turn: 'white' | 'black',
  pieces: Record<string, Piece>,
  opts?: Partial<GameState>,
): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null)
  for (const [name, piece] of Object.entries(pieces)) {
    board[parseSquare(name).rank * 8 + parseSquare(name).file] = piece
  }
  const base: GameState = {
    board, turn, status: 'playing', enPassantTarget: null,
    castling: { whiteKingside: false, whiteQueenside: false, blackKingside: false, blackQueenside: false },
    halfMoveClock: 0, fullMoveNumber: 1, lastMove: null,
    ...opts,
  }
  return { ...base, status: computeStatus(base) }
}

function targets(state: GameState, sq: string): string[] {
  return getLegalMoves(state, parseSquare(sq)).map((m) => squareName(m.to)).sort()
}

// ─── turn management ─────────────────────────────────────────────────────────

describe('turn management', () => {
  it('starts as white to move', () => {
    expect(createInitialState().turn).toBe('white')
  })

  it('flips turn after each move', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    expect(s.turn).toBe('black')
    s = play(s, 'e7', 'e5')
    expect(s.turn).toBe('white')
  })

  it('increments fullMoveNumber only after black moves', () => {
    let s = createInitialState()
    expect(s.fullMoveNumber).toBe(1)
    s = play(s, 'e2', 'e4')
    expect(s.fullMoveNumber).toBe(1)
    s = play(s, 'e7', 'e5')
    expect(s.fullMoveNumber).toBe(2)
    s = play(s, 'd2', 'd4')
    expect(s.fullMoveNumber).toBe(2)
    s = play(s, 'd7', 'd5')
    expect(s.fullMoveNumber).toBe(3)
  })

  it('resets halfMoveClock on pawn move or capture, increments otherwise', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    expect(s.halfMoveClock).toBe(0)
    s = play(s, 'e7', 'e5')
    expect(s.halfMoveClock).toBe(0)
    s = play(s, 'g1', 'f3')
    expect(s.halfMoveClock).toBe(1)
    s = play(s, 'g8', 'f6')
    expect(s.halfMoveClock).toBe(2)
  })

  it('returns no moves for the side NOT to move', () => {
    const s = createInitialState()
    expect(getLegalMoves(s, parseSquare('e7'))).toHaveLength(0)
  })

  it('returns no moves for an empty square', () => {
    const s = createInitialState()
    expect(getLegalMoves(s, parseSquare('e4'))).toHaveLength(0)
  })
})

// ─── check detection ─────────────────────────────────────────────────────────

describe('check detection', () => {
  it('isInCheck is false in the starting position', () => {
    const s = createInitialState()
    expect(isInCheck(s, 'white')).toBe(false)
    expect(isInCheck(s, 'black')).toBe(false)
  })

  it('detects check along a file', () => {
    const s = position('black', {
      e8: { type: 'king', color: 'black' },
      e1: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(true)
    expect(s.status).toBe('check')
  })

  it('detects check along a diagonal', () => {
    const s = position('black', {
      e8: { type: 'king',   color: 'black' },
      b5: { type: 'bishop', color: 'white' },
      a1: { type: 'king',   color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(true)
  })

  it('detects check by a knight', () => {
    const s = position('black', {
      e8: { type: 'king',   color: 'black' },
      d6: { type: 'knight', color: 'white' },
      a1: { type: 'king',   color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(true)
  })

  it('check is not reported when a piece blocks the ray', () => {
    const s = position('black', {
      e8: { type: 'king', color: 'black' },
      e5: { type: 'pawn', color: 'black' },
      e1: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(s.status).toBe('playing')
  })

  it('status is check (not checkmate) when the king has an escape', () => {
    const s = position('black', {
      e8: { type: 'king', color: 'black' },
      a7: { type: 'rook', color: 'black' },
      e1: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(s.status).toBe('check')
    expect(getAllLegalMoves(s).length).toBeGreaterThan(0)
    // King can step off the e-file.
    expect(targets(s, 'e8')).toContain('d8')
  })
})

// ─── checkmate ───────────────────────────────────────────────────────────────

describe('checkmate', () => {
  it("detects fool's mate", () => {
    let s = createInitialState()
    s = play(s, 'f2', 'f3')
    s = play(s, 'e7', 'e5')
    s = play(s, 'g2', 'g4')
    s = play(s, 'd8', 'h4')
    expect(s.status).toBe('checkmate')
    expect(isInCheck(s, 'white')).toBe(true)
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })

  it("detects scholar's mate", () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'e7', 'e5')
    s = play(s, 'f1', 'c4'); s = play(s, 'b8', 'c6')
    s = play(s, 'd1', 'h5'); s = play(s, 'a7', 'a6')
    s = play(s, 'h5', 'f7')
    expect(s.status).toBe('checkmate')
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })

  it('back-rank mate: rook delivers checkmate', () => {
    const s = position('black', {
      a8: { type: 'king', color: 'black' },
      a7: { type: 'pawn', color: 'black' },
      b7: { type: 'pawn', color: 'black' },
      h8: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(s.status).toBe('checkmate')
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })

  it('getLegalMoves returns [] for all white pieces when mated', () => {
    let s = createInitialState()
    s = play(s, 'f2', 'f3'); s = play(s, 'e7', 'e5')
    s = play(s, 'g2', 'g4'); s = play(s, 'd8', 'h4')
    for (let i = 0; i < 64; i++) {
      const p = s.board[i]
      if (p != null && p.color === 'white') {
        expect(getLegalMoves(s, { file: (i % 8) as 0, rank: Math.floor(i / 8) as 0 })).toHaveLength(0)
      }
    }
  })
})

// ─── stalemate ───────────────────────────────────────────────────────────────

describe('stalemate', () => {
  it('classic king+queen stalemate', () => {
    const s = position('black', {
      a8: { type: 'king',  color: 'black' },
      c7: { type: 'king',  color: 'white' },
      b6: { type: 'queen', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(s.status).toBe('stalemate')
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })

  it('stalemate with a cornered king and two rooks', () => {
    const s = position('black', {
      h8: { type: 'king', color: 'black' },
      f7: { type: 'rook', color: 'white' },
      g6: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(s.status).toBe('stalemate')
  })
})
