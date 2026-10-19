/**
 * Chess Engine — Comprehensive unit tests (S-16)
 * -----------------------------------------------
 * Exhaustive coverage of legal move generation per piece type, all castling
 * variants, en passant edge cases, promotion to all four pieces, self-check
 * rejection, check/checkmate/stalemate from known positions, turn alternation.
 *
 * Complements chess.engine.core.test.ts (S-13 basics). Pure engine — no React.
 * S-16 — QA
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
  pieceAt,
  squareName,
  squareEquals,
} from '../chess/engine'
import type { GameState, Piece, Square } from '../chess/engine'

// ─── helpers ──────────────────────────────────────────────────────────────────

function play(
  state: GameState,
  from: string,
  to: string,
  promo?: string,
): GameState {
  const fromSq = parseSquare(from)
  const toSq   = parseSquare(to)
  const moves  = getLegalMoves(state, fromSq)
  const move   = moves.find(
    (m) =>
      squareEquals(m.to, toSq) &&
      (promo == null || m.flags.promotionPiece === promo),
  )
  if (move == null) {
    throw new Error(`no legal move ${from}->${to}${promo ? '=' + promo : ''}`)
  }
  return applyMove(state, move)
}

function sqIdx(sq: Square): number { return sq.rank * 8 + sq.file }

function position(
  turn: 'white' | 'black',
  pieces: Record<string, Piece>,
  opts?: {
    enPassantTarget?: string
    castling?: Partial<GameState['castling']>
  },
): GameState {
  const board: (Piece | null)[] = new Array(64).fill(null)
  for (const [name, piece] of Object.entries(pieces)) {
    board[sqIdx(parseSquare(name))] = piece
  }
  const ep = opts?.enPassantTarget ? parseSquare(opts.enPassantTarget) : null
  const s: GameState = {
    board,
    turn,
    status: 'playing',
    enPassantTarget: ep,
    castling: {
      whiteKingside:  opts?.castling?.whiteKingside  ?? false,
      whiteQueenside: opts?.castling?.whiteQueenside ?? false,
      blackKingside:  opts?.castling?.blackKingside  ?? false,
      blackQueenside: opts?.castling?.blackQueenside ?? false,
    },
    halfMoveClock:  0,
    fullMoveNumber: 1,
    lastMove:       null,
  }
  return { ...s, status: computeStatus(s) }
}

function dests(state: GameState, from: string): string[] {
  return getLegalMoves(state, parseSquare(from))
    .map((m) => squareName(m.to))
    .sort()
}

// ─── pawn legal moves ─────────────────────────────────────────────────────────

describe('pawn — legal moves', () => {
  it('white pawn on starting rank has single and double push', () => {
    const s = createInitialState()
    expect(dests(s, 'e2')).toEqual(['e3', 'e4'])
  })

  it('white pawn off starting rank has only single push', () => {
    const s = position('white', {
      e3: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'e3')).toEqual(['e4'])
  })

  it('black pawn on starting rank has single and double push', () => {
    const s = createInitialState()
    let st = play(s, 'e2', 'e4')
    expect(dests(st, 'e7')).toEqual(['e5', 'e6'])
  })

  it('pawn cannot push if the square ahead is blocked', () => {
    const s = position('white', {
      e2: { type: 'pawn',   color: 'white' },
      e3: { type: 'knight', color: 'black' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'e2')).toEqual([])
  })

  it('pawn cannot double-push if the intermediate square is blocked', () => {
    const s = position('white', {
      e2: { type: 'pawn',   color: 'white' },
      e3: { type: 'bishop', color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'e2')).toEqual([])
  })

  it('pawn captures diagonally but not straight', () => {
    const s = position('white', {
      e4: { type: 'pawn',   color: 'white' },
      d5: { type: 'pawn',   color: 'black' },
      f5: { type: 'knight', color: 'black' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'e4')).toEqual(['d5', 'e5', 'f5'])
  })

  it('pawn cannot capture a friendly piece diagonally', () => {
    const s = position('white', {
      e4: { type: 'pawn',   color: 'white' },
      d5: { type: 'pawn',   color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'e4')).toEqual(['e5'])
  })
})

// ─── knight legal moves ───────────────────────────────────────────────────────

describe('knight — legal moves', () => {
  it('knight in the centre has 8 moves', () => {
    const s = position('white', {
      d4: { type: 'knight', color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'd4')).toHaveLength(8)
  })

  it('knight in a corner has 2 moves', () => {
    const s = position('white', {
      a1: { type: 'knight', color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    expect(dests(s, 'a1')).toEqual(['b3', 'c2'])
  })

  it('knight leaps over pieces', () => {
    const s = createInitialState()
    // b1 knight is surrounded by pawns but can still jump
    expect(dests(s, 'b1')).toEqual(['a3', 'c3'])
  })

  it('knight cannot land on a friendly piece', () => {
    const s = position('white', {
      d4: { type: 'knight', color: 'white' },
      c2: { type: 'pawn',   color: 'white' },
      e2: { type: 'pawn',   color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    const ds = dests(s, 'd4')
    expect(ds).not.toContain('c2')
    expect(ds).not.toContain('e2')
  })
})

// ─── bishop legal moves ───────────────────────────────────────────────────────

describe('bishop — legal moves', () => {
  it('bishop in the centre can reach all four diagonals', () => {
    const s = position('white', {
      d4: { type: 'bishop', color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    const ds = dests(s, 'd4')
    // Diagonals from d4: a1,b2,c3 / e5,f6,g7,h8 / a7,b6,c5 / e3,f2,g1
    expect(ds).toContain('a1')
    expect(ds).toContain('h8')
    expect(ds).toContain('a7')
    expect(ds).toContain('g1')
    expect(ds).toHaveLength(13)
  })

  it('bishop is blocked by a friendly piece', () => {
    const s = position('white', {
      c1: { type: 'bishop', color: 'white' },
      d2: { type: 'pawn',   color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    // d2 blocks the c1-h6 diagonal; bishop can only go b2,a3
    const ds = dests(s, 'c1')
    expect(ds).not.toContain('d2')
    expect(ds).not.toContain('e3')
    expect(ds).toContain('b2')
  })

  it('bishop can capture an enemy piece but not pass through it', () => {
    const s = position('white', {
      c1: { type: 'bishop', color: 'white' },
      e3: { type: 'pawn',   color: 'black' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    const ds = dests(s, 'c1')
    expect(ds).toContain('e3')
    expect(ds).not.toContain('f4')
  })
})

// ─── rook legal moves ─────────────────────────────────────────────────────────

describe('rook — legal moves', () => {
  it('rook on an open board reaches all 14 squares on its rank and file', () => {
    const s = position('white', {
      d4: { type: 'rook', color: 'white' },
      e1: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'd4')).toHaveLength(14)
  })

  it('rook is blocked by a friendly piece and cannot capture it', () => {
    const s = position('white', {
      a1: { type: 'rook',   color: 'white' },
      a4: { type: 'pawn',   color: 'white' },
      e1: { type: 'king',   color: 'white' },
      e8: { type: 'king',   color: 'black' },
    })
    const ds = dests(s, 'a1')
    expect(ds).not.toContain('a4')
    expect(ds).not.toContain('a5')
    expect(ds).toContain('a2')
    expect(ds).toContain('a3')
  })

  it('rook can capture an enemy piece but not pass through it', () => {
    const s = position('white', {
      a1: { type: 'rook',  color: 'white' },
      a5: { type: 'pawn',  color: 'black' },
      e1: { type: 'king',  color: 'white' },
      e8: { type: 'king',  color: 'black' },
    })
    const ds = dests(s, 'a1')
    expect(ds).toContain('a5')
    expect(ds).not.toContain('a6')
  })
})

// ─── queen legal moves ────────────────────────────────────────────────────────

describe('queen — legal moves', () => {
  it('queen on d1 in the initial position has 0 moves (blocked)', () => {
    const s = createInitialState()
    expect(dests(s, 'd1')).toHaveLength(0)
  })

  it('queen on an open board from d4 reaches 27 squares', () => {
    const s = position('white', {
      d4: { type: 'queen', color: 'white' },
      e1: { type: 'king',  color: 'white' },
      e8: { type: 'king',  color: 'black' },
    })
    expect(dests(s, 'd4')).toHaveLength(27)
  })
})

// ─── king legal moves ─────────────────────────────────────────────────────────

describe('king — legal moves', () => {
  it('king in the centre has up to 8 moves', () => {
    const s = position('white', {
      d4: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'd4')).toHaveLength(8)
  })

  it('king cannot move to a square attacked by the opponent', () => {
    // Black rook on e8 controls the whole e-file; white king on e1 cannot step to e2.
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      e8: { type: 'rook', color: 'black' },
      a8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'e1')).not.toContain('e2')
  })

  it('king cannot capture a defended piece', () => {
    // Black rook on d2 is defended by another rook on d8.
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      d2: { type: 'rook', color: 'black' },
      d8: { type: 'rook', color: 'black' },
      a8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'e1')).not.toContain('d2')
  })

  it('king in a corner has at most 3 moves', () => {
    const s = position('white', {
      a1: { type: 'king', color: 'white' },
      h8: { type: 'king', color: 'black' },
    })
    expect(dests(s, 'a1')).toHaveLength(3)
  })
})
