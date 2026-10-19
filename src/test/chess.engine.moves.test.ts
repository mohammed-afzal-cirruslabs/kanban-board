/**
 * Chess Engine — Castling, en passant, promotion, pin tests (S-16)
 */
import { describe, expect, it } from 'vitest'
import {
  applyMove, computeStatus, createInitialState,
  getLegalMoves, isInCheck, parseSquare, pieceAt,
  squareEquals, squareName,
} from '../chess/engine'
import type { GameState, Move, Piece } from '../chess/engine'

function play(state: GameState, from: string, to: string, promo?: string): GameState {
  const moves = getLegalMoves(state, parseSquare(from))
  const move = moves.find(
    (m) => squareEquals(m.to, parseSquare(to)) && (promo == null || m.flags.promotionPiece === promo),
  )
  if (!move) throw new Error(`no legal move ${from}->${to}${promo ? '=' + promo : ''}`)
  return applyMove(state, move)
}

function position(turn: 'white' | 'black', pieces: Record<string, Piece>, opts?: Partial<GameState>): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null)
  for (const [name, piece] of Object.entries(pieces)) {
    board[parseSquare(name).rank * 8 + parseSquare(name).file] = piece
  }
  const base: GameState = {
    board, turn, status: 'playing', enPassantTarget: null,
    castling: { whiteKingside: false, whiteQueenside: false, blackKingside: false, blackQueenside: false },
    halfMoveClock: 0, fullMoveNumber: 1, lastMove: null, ...opts,
  }
  return { ...base, status: computeStatus(base) }
}

// ─── castling ────────────────────────────────────────────────────────────────

describe('castling', () => {
  it('white castles kingside: king→g1, rook→f1', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'e7', 'e5')
    s = play(s, 'g1', 'f3'); s = play(s, 'g8', 'f6')
    s = play(s, 'f1', 'c4'); s = play(s, 'f8', 'c5')
    const castle = getLegalMoves(s, parseSquare('e1')).find((m) => m.flags.castleKingside)
    expect(castle).toBeDefined()
    s = applyMove(s, castle as Move)
    expect(pieceAt(s.board, parseSquare('g1'))).toEqual({ type: 'king', color: 'white' })
    expect(pieceAt(s.board, parseSquare('f1'))).toEqual({ type: 'rook', color: 'white' })
    expect(pieceAt(s.board, parseSquare('h1'))).toBeNull()
    expect(s.castling.whiteKingside).toBe(false)
    expect(s.castling.whiteQueenside).toBe(false)
  })

  it('white castles queenside: king→c1, rook→d1', () => {
    let s = createInitialState()
    s = play(s, 'd2', 'd4'); s = play(s, 'd7', 'd5')
    s = play(s, 'c1', 'f4'); s = play(s, 'c8', 'f5')
    s = play(s, 'd1', 'd3'); s = play(s, 'd8', 'd6')
    s = play(s, 'b1', 'c3'); s = play(s, 'b8', 'c6')
    const castle = getLegalMoves(s, parseSquare('e1')).find((m) => m.flags.castleQueenside)
    expect(castle).toBeDefined()
    s = applyMove(s, castle as Move)
    expect(pieceAt(s.board, parseSquare('c1'))).toEqual({ type: 'king', color: 'white' })
    expect(pieceAt(s.board, parseSquare('d1'))).toEqual({ type: 'rook', color: 'white' })
    expect(pieceAt(s.board, parseSquare('a1'))).toBeNull()
  })

  it('cannot castle when a piece is between king and rook', () => {
    const s = createInitialState()
    expect(getLegalMoves(s, parseSquare('e1')).some((m) => m.flags.castleKingside)).toBe(false)
  })

  it('cannot castle when king is in check', () => {
    const s = position('white', {
      e1: { type: 'king', color: 'white' }, h1: { type: 'rook', color: 'white' },
      e8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' },
    }, { castling: { whiteKingside: true, whiteQueenside: false, blackKingside: false, blackQueenside: false } })
    expect(isInCheck(s, 'white')).toBe(true)
    expect(getLegalMoves(s, parseSquare('e1')).some((m) => m.flags.castleKingside)).toBe(false)
  })

  it('cannot castle through an attacked square', () => {
    const s = position('white', {
      e1: { type: 'king', color: 'white' }, h1: { type: 'rook', color: 'white' },
      f8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' },
    }, { castling: { whiteKingside: true, whiteQueenside: false, blackKingside: false, blackQueenside: false } })
    expect(getLegalMoves(s, parseSquare('e1')).some((m) => m.flags.castleKingside)).toBe(false)
  })

  it('cannot castle into an attacked square', () => {
    const s = position('white', {
      e1: { type: 'king', color: 'white' }, h1: { type: 'rook', color: 'white' },
      g8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' },
    }, { castling: { whiteKingside: true, whiteQueenside: false, blackKingside: false, blackQueenside: false } })
    expect(getLegalMoves(s, parseSquare('e1')).some((m) => m.flags.castleKingside)).toBe(false)
  })

  it('castling rights revoked when king moves', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'e7', 'e5')
    s = play(s, 'g1', 'f3'); s = play(s, 'g8', 'f6')
    s = play(s, 'f1', 'c4'); s = play(s, 'f8', 'c5')
    s = play(s, 'e1', 'f1')
    expect(s.castling.whiteKingside).toBe(false)
    expect(s.castling.whiteQueenside).toBe(false)
  })

  it('castling rights revoked when rook moves', () => {
    let s = createInitialState()
    s = play(s, 'h2', 'h4'); s = play(s, 'a7', 'a5')
    s = play(s, 'h1', 'h3')
    expect(s.castling.whiteKingside).toBe(false)
    expect(s.castling.whiteQueenside).toBe(true)
  })
})

// ─── en passant ───────────────────────────────────────────────────────────────

describe('en passant', () => {
  it('sets the en passant target on a double pawn push', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4')
    expect(s.enPassantTarget).toEqual(parseSquare('e3'))
    s = play(s, 'a7', 'a6')
    expect(s.enPassantTarget).toBeNull()
  })

  it('white captures en passant', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'a7', 'a6')
    s = play(s, 'e4', 'e5'); s = play(s, 'd7', 'd5')
    expect(s.enPassantTarget).toEqual(parseSquare('d6'))
    const ep = getLegalMoves(s, parseSquare('e5')).find((m) => m.flags.enPassant)
    expect(ep).toBeDefined()
    expect(squareName(ep!.to)).toBe('d6')
    s = applyMove(s, ep as Move)
    expect(pieceAt(s.board, parseSquare('d5'))).toBeNull()
    expect(pieceAt(s.board, parseSquare('d6'))).toEqual({ type: 'pawn', color: 'white' })
  })

  it('black captures en passant', () => {
    let s = createInitialState()
    s = play(s, 'a2', 'a3'); s = play(s, 'e7', 'e5')
    s = play(s, 'a3', 'a4'); s = play(s, 'e5', 'e4')
    s = play(s, 'd2', 'd4')
    expect(s.enPassantTarget).toEqual(parseSquare('d3'))
    const ep = getLegalMoves(s, parseSquare('e4')).find((m) => m.flags.enPassant)
    expect(ep).toBeDefined()
    s = applyMove(s, ep as Move)
    expect(pieceAt(s.board, parseSquare('d4'))).toBeNull()
    expect(pieceAt(s.board, parseSquare('d3'))).toEqual({ type: 'pawn', color: 'black' })
  })

  it('en passant is only available the ply immediately after the double push', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'a7', 'a6')
    s = play(s, 'e4', 'e5'); s = play(s, 'd7', 'd5')
    expect(s.enPassantTarget).not.toBeNull()
    s = play(s, 'a2', 'a3')
    expect(s.enPassantTarget).toBeNull()
    expect(getLegalMoves(s, parseSquare('e5')).some((m) => m.flags.enPassant)).toBe(false)
  })
})

// ─── promotion ────────────────────────────────────────────────────────────────

describe('pawn promotion', () => {
  it('offers all four promotion pieces', () => {
    const s = position('white', {
      a7: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    const promos = getLegalMoves(s, parseSquare('a7'))
      .filter((m) => m.flags.promotion)
      .map((m) => m.flags.promotionPiece)
      .sort()
    expect(promos).toEqual(['bishop', 'knight', 'queen', 'rook'])
  })

  it('promotes to queen and places the correct piece', () => {
    const s = position('white', {
      a7: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    const next = play(s, 'a7', 'a8', 'queen')
    expect(pieceAt(next.board, parseSquare('a8'))).toEqual({ type: 'queen', color: 'white' })
    expect(pieceAt(next.board, parseSquare('a7'))).toBeNull()
  })

  it('promotes to knight', () => {
    const s = position('white', {
      a7: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    const next = play(s, 'a7', 'a8', 'knight')
    expect(pieceAt(next.board, parseSquare('a8'))).toEqual({ type: 'knight', color: 'white' })
  })

  it('promotion via capture also promotes', () => {
    const s = position('white', {
      a7: { type: 'pawn',  color: 'white' },
      b8: { type: 'rook',  color: 'black' },
      e1: { type: 'king',  color: 'white' },
      e8: { type: 'king',  color: 'black' },
    })
    const promos = getLegalMoves(s, parseSquare('a7'))
      .filter((m) => m.flags.promotion && squareName(m.to) === 'b8')
      .map((m) => m.flags.promotionPiece)
      .sort()
    expect(promos).toEqual(['bishop', 'knight', 'queen', 'rook'])
    const next = play(s, 'a7', 'b8', 'queen')
    expect(pieceAt(next.board, parseSquare('b8'))).toEqual({ type: 'queen', color: 'white' })
  })

  it('black pawn promotes on rank 1', () => {
    const s = position('black', {
      h2: { type: 'pawn', color: 'black' },
      e8: { type: 'king', color: 'black' },
      e1: { type: 'king', color: 'white' },
    })
    const promos = getLegalMoves(s, parseSquare('h2'))
      .filter((m) => m.flags.promotion)
      .map((m) => m.flags.promotionPiece)
      .sort()
    expect(promos).toEqual(['bishop', 'knight', 'queen', 'rook'])
    const next = play(s, 'h2', 'h1', 'queen')
    expect(pieceAt(next.board, parseSquare('h1'))).toEqual({ type: 'queen', color: 'black' })
  })
})

// ─── pin rejection (self-check prevention) ────────────────────────────────────

describe('pin rejection — no move may leave own king in check', () => {
  it('absolutely pinned piece has zero legal moves', () => {
    const s = position('black', {
      e8: { type: 'king',   color: 'black' },
      e7: { type: 'bishop', color: 'black' },
      e1: { type: 'rook',   color: 'white' },
      a1: { type: 'king',   color: 'white' },
    })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(getLegalMoves(s, parseSquare('e7'))).toHaveLength(0)
  })

  it('diagonally pinned piece can only move along the pin ray', () => {
    const s = position('white', {
      c1: { type: 'king',   color: 'white' },
      d2: { type: 'bishop', color: 'white' },
      g5: { type: 'bishop', color: 'black' },
      e8: { type: 'king',   color: 'black' },
    })
    const t = getLegalMoves(s, parseSquare('d2')).map((m) => squareName(m.to)).sort()
    expect(t).toContain('e3')
    expect(t).toContain('f4')
    expect(t).toContain('g5')
    expect(t).not.toContain('c1')
    expect(t).not.toContain('b1')
  })

  it('no legal move leaves the moving side in check', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'd7', 'd5')
    for (const m of getLegalMoves(s, parseSquare('e4'))) {
      const after = applyMove(s, m)
      expect(isInCheck(after, m.piece.color)).toBe(false)
    }
  })

  it('king cannot step into an attacked square', () => {
    const s = position('white', {
      e1: { type: 'king',  color: 'white' },
      d8: { type: 'rook',  color: 'black' },
      h8: { type: 'king',  color: 'black' },
    })
    const t = getLegalMoves(s, parseSquare('e1')).map((m) => squareName(m.to))
    expect(t).not.toContain('d1')
    expect(t).not.toContain('d2')
  })
})
