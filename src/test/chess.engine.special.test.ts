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
function dests(s: GameState, f: string) { return getLegalMoves(s, parseSquare(f)).map(m => squareName(m.to)).sort() }
describe('castling — queenside white', () => {
  it('allows white queenside castling and places king on c1 rook on d1', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, a1: { type: 'rook', color: 'white' }, e8: { type: 'king', color: 'black' } }, { castling: { whiteQueenside: true } })
    const after = play(s, 'e1', 'c1')
    expect(pieceAt(after.board, parseSquare('c1'))).toEqual({ type: 'king', color: 'white' })
    expect(pieceAt(after.board, parseSquare('d1'))).toEqual({ type: 'rook', color: 'white' })
    expect(pieceAt(after.board, parseSquare('e1'))).toBeNull()
    expect(pieceAt(after.board, parseSquare('a1'))).toBeNull()
  })
  it('forbids queenside castling if b1 is occupied', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, a1: { type: 'rook', color: 'white' }, b1: { type: 'knight', color: 'white' }, e8: { type: 'king', color: 'black' } }, { castling: { whiteQueenside: true } })
    expect(dests(s, 'e1')).not.toContain('c1')
  })
  it('forbids queenside castling if king passes through d1 which is attacked', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, a1: { type: 'rook', color: 'white' }, d8: { type: 'rook', color: 'black' }, e8: { type: 'king', color: 'black' } }, { castling: { whiteQueenside: true } })
    expect(dests(s, 'e1')).not.toContain('c1')
  })
})
describe('castling — black both sides', () => {
  it('allows black kingside castling', () => {
    const s = pos('black', { e8: { type: 'king', color: 'black' }, h8: { type: 'rook', color: 'black' }, e1: { type: 'king', color: 'white' } }, { castling: { blackKingside: true } })
    const after = play(s, 'e8', 'g8')
    expect(pieceAt(after.board, parseSquare('g8'))).toEqual({ type: 'king', color: 'black' })
    expect(pieceAt(after.board, parseSquare('f8'))).toEqual({ type: 'rook', color: 'black' })
  })
  it('allows black queenside castling', () => {
    const s = pos('black', { e8: { type: 'king', color: 'black' }, a8: { type: 'rook', color: 'black' }, e1: { type: 'king', color: 'white' } }, { castling: { blackQueenside: true } })
    const after = play(s, 'e8', 'c8')
    expect(pieceAt(after.board, parseSquare('c8'))).toEqual({ type: 'king', color: 'black' })
    expect(pieceAt(after.board, parseSquare('d8'))).toEqual({ type: 'rook', color: 'black' })
  })
  it('revokes black castling rights after king moves', () => {
    const s = pos('black', { e8: { type: 'king', color: 'black' }, h8: { type: 'rook', color: 'black' }, a8: { type: 'rook', color: 'black' }, e1: { type: 'king', color: 'white' } }, { castling: { blackKingside: true, blackQueenside: true } })
    const after = play(s, 'e8', 'f8')
    expect(after.castling.blackKingside).toBe(false)
    expect(after.castling.blackQueenside).toBe(false)
  })
})
describe('castling — rights revoked by rook capture', () => {
  it('revoking white kingside right when h1 rook is captured', () => {
    const s = pos('black', { e1: { type: 'king', color: 'white' }, h1: { type: 'rook', color: 'white' }, e8: { type: 'king', color: 'black' }, h8: { type: 'rook', color: 'black' } }, { castling: { whiteKingside: true, blackKingside: true } })
    const after = play(s, 'h8', 'h1')
    expect(after.castling.whiteKingside).toBe(false)
  })
  it('revoking white queenside right when a1 rook is captured', () => {
    const s = pos('black', { e1: { type: 'king', color: 'white' }, a1: { type: 'rook', color: 'white' }, e8: { type: 'king', color: 'black' }, a8: { type: 'rook', color: 'black' } }, { castling: { whiteQueenside: true, blackQueenside: true } })
    const after = play(s, 'a8', 'a1')
    expect(after.castling.whiteQueenside).toBe(false)
  })
  it('revoking white kingside right when h1 rook moves away', () => {
    const s = pos('white', { e1: { type: 'king', color: 'white' }, h1: { type: 'rook', color: 'white' }, e8: { type: 'king', color: 'black' } }, { castling: { whiteKingside: true } })
    const after = play(s, 'h1', 'h4')
    expect(after.castling.whiteKingside).toBe(false)
  })
})
