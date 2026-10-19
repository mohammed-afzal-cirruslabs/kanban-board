import { describe, expect, it } from 'vitest'
import { applyMove, computeStatus, createInitialState, getAllLegalMoves, getLegalMoves, isInCheck, parseSquare, pieceAt, squareName, squareEquals } from '../chess/engine'
import type { GameState, Piece, Square } from '../chess/engine'
function play(s: GameState, f: string, t: string, p?: string): GameState {
  const m = getLegalMoves(s, parseSquare(f)).find(mv => squareEquals(mv.to, parseSquare(t)) && (p == null || mv.flags.promotionPiece === p))
  if (!m) throw new Error(`no legal move ${f}->${t}`)
  return applyMove(s, m)
}
function sqIdx(sq: Square) { return sq.rank * 8 + sq.file }
function pos(turn: 'white'|'black', pieces: Record<string, Piece>, opts?: { ep?: string; castling?: Partial<GameState['castling']> }): GameState {
  const board: (Piece|null)[] = new Array(64).fill(null)
  for (const [n, p] of Object.entries(pieces)) board[sqIdx(parseSquare(n))] = p
  const s: GameState = { board, turn, status: 'playing', enPassantTarget: opts?.ep ? parseSquare(opts.ep) : null, castling: { whiteKingside: opts?.castling?.whiteKingside ?? false, whiteQueenside: opts?.castling?.whiteQueenside ?? false, blackKingside: opts?.castling?.blackKingside ?? false, blackQueenside: opts?.castling?.blackQueenside ?? false }, halfMoveClock: 0, fullMoveNumber: 1, lastMove: null }
  return { ...s, status: computeStatus(s) }
}
describe('en passant edge cases', () => {
  it('black can capture en passant after white double push', () => {
    let s = createInitialState()
    // 1.a4 a6 2.a5 b5 — now white a5 pawn can capture en passant on b6
    s = play(s, 'a2', 'a4'); s = play(s, 'a7', 'a6')
    s = play(s, 'a4', 'a5'); s = play(s, 'b7', 'b5')
    expect(s.enPassantTarget).toEqual(parseSquare('b6'))
    s = play(s, 'a5', 'b6')
    expect(pieceAt(s.board, parseSquare('b5'))).toBeNull()
    expect(pieceAt(s.board, parseSquare('b6'))).toEqual({ type: 'pawn', color: 'white' })
  })
  it('en passant target is cleared after one ply if not taken', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'd7', 'd5')
    s = play(s, 'e4', 'e5'); s = play(s, 'd5', 'd4')
    expect(s.enPassantTarget).toBeNull()
  })
  it('en passant is not available from the wrong file', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'a7', 'a6')
    s = play(s, 'e4', 'e5'); s = play(s, 'd7', 'd5')
    const moves = getLegalMoves(s, parseSquare('e5')).map(m => squareName(m.to))
    expect(moves).toContain('d6')
    expect(moves).not.toContain('f6')
  })
  it('en passant capture that would expose own king on the same rank is illegal', () => {
    // White king on e5, white pawn on f5, black pawn on g5 (just double-pushed),
    // black rook on a5 attacks along rank 5.
    // After f5xg6 en passant, both f5 and g5 are vacated, exposing e5 king to a5 rook.
    const s = pos('white', { e5: { type: 'king', color: 'white' }, f5: { type: 'pawn', color: 'white' }, g5: { type: 'pawn', color: 'black' }, a5: { type: 'rook', color: 'black' }, e8: { type: 'king', color: 'black' } }, { ep: 'g6' })
    const moves = getLegalMoves(s, parseSquare('f5')).map(m => squareName(m.to))
    expect(moves).not.toContain('g6')
  })
})
describe('promotion — all four pieces', () => {
  it('promotes to queen', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    const after = play(s, 'e7', 'e8', 'queen')
    expect(pieceAt(after.board, parseSquare('e8'))).toEqual({ type: 'queen', color: 'white' })
    expect(pieceAt(after.board, parseSquare('e7'))).toBeNull()
  })
  it('promotes to rook', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    expect(pieceAt(play(s, 'e7', 'e8', 'rook').board, parseSquare('e8'))).toEqual({ type: 'rook', color: 'white' })
  })
  it('promotes to bishop', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    expect(pieceAt(play(s, 'e7', 'e8', 'bishop').board, parseSquare('e8'))).toEqual({ type: 'bishop', color: 'white' })
  })
  it('promotes to knight', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    expect(pieceAt(play(s, 'e7', 'e8', 'knight').board, parseSquare('e8'))).toEqual({ type: 'knight', color: 'white' })
  })
  it('black pawn promotes on rank 1', () => {
    const s = pos('black', { e2: { type: 'pawn', color: 'black' }, e8: { type: 'king', color: 'black' }, a1: { type: 'king', color: 'white' } })
    expect(pieceAt(play(s, 'e2', 'e1', 'queen').board, parseSquare('e1'))).toEqual({ type: 'queen', color: 'black' })
  })
  it('promotion generates exactly 4 move choices (one per piece type)', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    const promos = getLegalMoves(s, parseSquare('e7')).filter(m => m.flags.promotion).map(m => m.flags.promotionPiece).sort()
    expect(promos).toEqual(['bishop', 'knight', 'queen', 'rook'])
  })
  it('promotion capture also generates 4 choices', () => {
    const s = pos('white', { e7: { type: 'pawn', color: 'white' }, f8: { type: 'rook', color: 'black' }, e1: { type: 'king', color: 'white' }, a8: { type: 'king', color: 'black' } })
    expect(getLegalMoves(s, parseSquare('e7')).filter(m => squareEquals(m.to, parseSquare('f8')))).toHaveLength(4)
  })
})
describe('self-check rejection', () => {
  it('no legal move leaves the moving side in check', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'd7', 'd5')
    for (const m of getAllLegalMoves(s)) {
      expect(isInCheck(applyMove(s, m), m.piece.color)).toBe(false)
    }
  })
  it('pinned rook cannot move off the pin line', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, e4: { type: 'rook', color: 'white' }, e8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' } })
    for (const dest of getLegalMoves(s, parseSquare('e4')).map(m => squareName(m.to))) {
      expect(dest[0]).toBe('e')
    }
  })
  it('pinned bishop has zero legal moves', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, e4: { type: 'bishop', color: 'white' }, e8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' } })
    expect(getLegalMoves(s, parseSquare('e4'))).toHaveLength(0)
  })
  it('king cannot move into check from a rook', () => {
    // Black rook on e8 controls the e-file; white king on e1 cannot step to e2.
    const s = pos('white', { e1: { type: 'king', color: 'white' }, e8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' } })
    expect(getLegalMoves(s, parseSquare('e1')).map(m => squareName(m.to))).not.toContain('e2')
  })
  it('getLegalMoves returns empty for the wrong side to move', () => {
    expect(getLegalMoves(createInitialState(), parseSquare('e7'))).toHaveLength(0)
  })
  it('getLegalMoves returns empty for an empty square', () => {
    expect(getLegalMoves(createInitialState(), parseSquare('e4'))).toHaveLength(0)
  })
})
describe('check, checkmate, stalemate — additional positions', () => {
  it('scholar mate is checkmate', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'e7', 'e5')
    s = play(s, 'f1', 'c4'); s = play(s, 'b8', 'c6')
    s = play(s, 'd1', 'h5'); s = play(s, 'a7', 'a6')
    s = play(s, 'h5', 'f7')
    expect(s.status).toBe('checkmate')
    expect(getAllLegalMoves(s)).toHaveLength(0)
  })
  it('back-rank checkmate is detected', () => {
    // Black Kh8, own Rg8 (blocks g8), own Pg7 (blocks g7), own Ph7 (blocks h7).
    // White Rh1 gives check on the h-file. The king has no escape square and no
    // black piece can interpose or capture the rook on h1. Verified checkmate.
    const s = pos('black', {
      h8: { type: 'king',  color: 'black' },
      g8: { type: 'rook',  color: 'black' },
      g7: { type: 'pawn',  color: 'black' },
      h7: { type: 'pawn',  color: 'black' },
      h1: { type: 'rook',  color: 'white' },
      a1: { type: 'king',  color: 'white' },
    })
    expect(s.status).toBe('checkmate')
  })
  it('double check — only king moves resolve it', () => {
    const s = pos('black', { e8: { type: 'king', color: 'black' }, e1: { type: 'rook', color: 'white' }, b5: { type: 'bishop', color: 'white' }, a1: { type: 'king', color: 'white' }, a7: { type: 'rook', color: 'black' } })
    expect(isInCheck(s, 'black')).toBe(true)
    for (const m of getAllLegalMoves(s)) {
      expect(m.piece.type).toBe('king')
    }
  })
  it('stalemate: black king in corner, white queen covers all escape squares', () => {
    // Classic stalemate: black Ka8, white Qb6, white Kc6.
    // Ka8 cannot go to a7 (Qb6 covers), b8 (Qb6 covers), b7 (Qb6 covers).
    const s = pos('black', { a8: { type: 'king', color: 'black' }, b6: { type: 'queen', color: 'white' }, c6: { type: 'king', color: 'white' } })
    expect(isInCheck(s, 'black')).toBe(false)
    expect(s.status).toBe('stalemate')
  })
  it('status is check (not checkmate) when king has a legal escape', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, e8: { type: 'rook', color: 'black' }, a8: { type: 'king', color: 'black' } })
    expect(isInCheck(s, 'white')).toBe(true)
    expect(s.status).toBe('check')
    expect(getAllLegalMoves(s).length).toBeGreaterThan(0)
  })
  it('getLegalMoves returns empty after checkmate', () => {
    let s = createInitialState()
    s = play(s, 'f2', 'f3'); s = play(s, 'e7', 'e5')
    s = play(s, 'g2', 'g4'); s = play(s, 'd8', 'h4')
    expect(s.status).toBe('checkmate')
    expect(getLegalMoves(s, parseSquare('e1'))).toHaveLength(0)
    expect(getLegalMoves(s, parseSquare('d2'))).toHaveLength(0)
  })
  it('getLegalMoves returns empty after stalemate', () => {
    const s = pos('black', { a8: { type: 'king', color: 'black' }, b6: { type: 'queen', color: 'white' }, c6: { type: 'king', color: 'white' } })
    expect(s.status).toBe('stalemate')
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        expect(getLegalMoves(s, { file: file as 0, rank: rank as 0 })).toHaveLength(0)
      }
    }
  })
})
describe('turn alternation', () => {
  it('turn flips on every move', () => {
    let s = createInitialState()
    expect(s.turn).toBe('white')
    s = play(s, 'e2', 'e4'); expect(s.turn).toBe('black')
    s = play(s, 'e7', 'e5'); expect(s.turn).toBe('white')
    s = play(s, 'd2', 'd4'); expect(s.turn).toBe('black')
  })
  it('fullMoveNumber increments only after black moves', () => {
    let s = createInitialState()
    expect(s.fullMoveNumber).toBe(1)
    s = play(s, 'e2', 'e4'); expect(s.fullMoveNumber).toBe(1)
    s = play(s, 'e7', 'e5'); expect(s.fullMoveNumber).toBe(2)
    s = play(s, 'd2', 'd4'); expect(s.fullMoveNumber).toBe(2)
    s = play(s, 'd7', 'd5'); expect(s.fullMoveNumber).toBe(3)
  })
  it('lastMove is null initially and set after each move', () => {
    let s = createInitialState()
    expect(s.lastMove).toBeNull()
    s = play(s, 'e2', 'e4')
    expect(s.lastMove).not.toBeNull()
    expect(squareName(s.lastMove!.from)).toBe('e2')
    expect(squareName(s.lastMove!.to)).toBe('e4')
  })
  it('halfMoveClock resets on capture', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e4'); s = play(s, 'd7', 'd5')
    s = play(s, 'g1', 'f3'); expect(s.halfMoveClock).toBe(1)
    s = play(s, 'd5', 'e4'); expect(s.halfMoveClock).toBe(0)
  })
})
