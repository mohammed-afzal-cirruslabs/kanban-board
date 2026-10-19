/**
 * Chess Engine — Per-piece legal move generation tests (S-16)
 * ------------------------------------------------------------
 * Covers: board utilities, pawn/knight/bishop/rook/queen/king legal moves.
 * Check/mate/stalemate/castling/en passant/promotion/pins are in the
 * companion files chess.engine.special.test.ts and chess.engine.moves.test.ts.
 *
 * Style: matches chess.engine.core.test.ts — Vitest, no DOM, pure engine.
 */

import { describe, expect, it } from 'vitest'
import {
  applyMove,
  computeStatus,
  createInitialState,
  getLegalMoves,
  indexToSquare,
  parseSquare,
  squareEquals,
  squareIndex,
  squareName,
} from '../chess/engine'
import type { GameState, Piece } from '../chess/engine'

// ─── helpers ─────────────────────────────────────────────────────────────────

function play(state: GameState, from: string, to: string, promo?: string): GameState {
  const fromSq = parseSquare(from)
  const toSq   = parseSquare(to)
  const moves  = getLegalMoves(state, fromSq)
  const move   = moves.find(
    (m) => squareEquals(m.to, toSq) && (promo == null || m.flags.promotionPiece === promo),
  )
  if (move == null) throw new Error(`no legal move ${from}->${to}${promo ? '=' + promo : ''}`)
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

function targets(state: GameState, sq: string): string[] {
  return getLegalMoves(state, parseSquare(sq)).map((m) => squareName(m.to)).sort()
}

// ─── board utilities ──────────────────────────────────────────────────────────

describe('board utilities — extended', () => {
  it('squareIndex and indexToSquare are inverses for all 64 squares', () => {
    for (let i = 0; i < 64; i++) {
      expect(squareIndex(indexToSquare(i))).toBe(i)
    }
  })

  it('squareName produces correct algebraic names', () => {
    expect(squareName({ file: 0, rank: 0 })).toBe('a1')
    expect(squareName({ file: 7, rank: 7 })).toBe('h8')
    expect(squareName({ file: 4, rank: 3 })).toBe('e4')
  })

  it('parseSquare round-trips all 64 algebraic names', () => {
    const files = 'abcdefgh'
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const name = `${files[f]}${r + 1}`
        const sq   = parseSquare(name)
        expect(sq.file).toBe(f)
        expect(sq.rank).toBe(r)
        expect(squareName(sq)).toBe(name)
      }
    }
  })

  it('parseSquare throws on bad input', () => {
    expect(() => parseSquare('z9')).toThrow()
    expect(() => parseSquare('a0')).toThrow()
    expect(() => parseSquare('a')).toThrow()
    expect(() => parseSquare('')).toThrow()
  })

  it('squareEquals is reflexive and distinguishes different squares', () => {
    expect(squareEquals(parseSquare('e4'), parseSquare('e4'))).toBe(true)
    expect(squareEquals(parseSquare('e4'), parseSquare('e5'))).toBe(false)
  })
})

// ─── pawn moves ───────────────────────────────────────────────────────────────

describe('pawn moves', () => {
  it('white pawn on rank 2 offers single and double push', () => {
    expect(targets(createInitialState(), 'e2')).toEqual(['e3', 'e4'])
  })

  it('white pawn on rank 3 offers only a single push', () => {
    let s = createInitialState()
    s = play(s, 'e2', 'e3'); s = play(s, 'a7', 'a6')
    expect(targets(s, 'e3')).toEqual(['e4'])
  })

  it('black pawn on rank 7 offers single and double push', () => {
    let s = createInitialState()
    s = play(s, 'a2', 'a3')
    expect(targets(s, 'e7')).toEqual(['e5', 'e6'])
  })

  it('pawn cannot push into an occupied square', () => {
    const s = position('white', {
      e2: { type: 'pawn', color: 'white' }, e3: { type: 'pawn', color: 'black' },
      e1: { type: 'king', color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(targets(s, 'e2')).toHaveLength(0)
  })

  it('pawn cannot double-push when the intermediate square is blocked', () => {
    const s = position('white', {
      e2: { type: 'pawn',   color: 'white' }, e3: { type: 'knight', color: 'black' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king',   color: 'black' },
    })
    expect(targets(s, 'e2')).toHaveLength(0)
  })

  it('pawn captures diagonally', () => {
    const s = position('white', {
      e4: { type: 'pawn',   color: 'white' },
      d5: { type: 'pawn',   color: 'black' }, f5: { type: 'knight', color: 'black' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king',   color: 'black' },
    })
    const t = targets(s, 'e4')
    expect(t).toContain('d5')
    expect(t).toContain('f5')
    expect(t).toContain('e5')
  })

  it('pawn cannot capture a friendly piece', () => {
    const s = position('white', {
      e4: { type: 'pawn', color: 'white' }, d5: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(targets(s, 'e4')).not.toContain('d5')
  })
})

// ─── knight moves ─────────────────────────────────────────────────────────────

describe('knight moves', () => {
  it('central knight has 8 moves', () => {
    const s = position('white', {
      e4: { type: 'knight', color: 'white' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('e4'))).toHaveLength(8)
  })

  it('corner knight has only 2 moves', () => {
    const s = position('white', {
      a1: { type: 'knight', color: 'white' },
      h1: { type: 'king',   color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('a1'))).toHaveLength(2)
  })

  it('knight jumps over adjacent pieces', () => {
    const s = position('white', {
      e4: { type: 'knight', color: 'white' },
      d4: { type: 'pawn', color: 'white' }, f4: { type: 'pawn', color: 'white' },
      e5: { type: 'pawn', color: 'white' }, e3: { type: 'pawn', color: 'white' },
      d5: { type: 'pawn', color: 'white' }, f5: { type: 'pawn', color: 'white' },
      d3: { type: 'pawn', color: 'white' }, f3: { type: 'pawn', color: 'white' },
      e1: { type: 'king', color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('e4'))).toHaveLength(8)
  })

  it('knight cannot land on a friendly piece', () => {
    const s = position('white', {
      b1: { type: 'knight', color: 'white' },
      a3: { type: 'pawn',   color: 'white' }, c3: { type: 'pawn', color: 'white' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'b1')
    expect(t).not.toContain('a3')
    expect(t).not.toContain('c3')
  })

  it('initial position knights have 2 moves each', () => {
    const s = createInitialState()
    expect(getLegalMoves(s, parseSquare('b1'))).toHaveLength(2)
    expect(getLegalMoves(s, parseSquare('g1'))).toHaveLength(2)
  })
})

// ─── bishop moves ─────────────────────────────────────────────────────────────

describe('bishop moves', () => {
  it('central bishop on an empty board has 13 moves', () => {
    const s = position('white', {
      d4: { type: 'bishop', color: 'white' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('d4'))).toHaveLength(13)
  })

  it('bishop is blocked by a friendly piece on its diagonal', () => {
    // c1 bishop with d2 pawn blocking: can reach b2 and a3 (the other direction).
    const s = position('white', {
      c1: { type: 'bishop', color: 'white' }, d2: { type: 'pawn', color: 'white' },
      e1: { type: 'king',   color: 'white' }, e8: { type: 'king', color: 'black' },
    })
    expect(targets(s, 'c1')).toEqual(['a3', 'b2'])
  })

  it('bishop can capture an enemy piece but not pass through it', () => {
    const s = position('white', {
      a1: { type: 'bishop', color: 'white' }, c3: { type: 'pawn', color: 'black' },
      h1: { type: 'king',   color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'a1')
    expect(t).toContain('b2')
    expect(t).toContain('c3')
    expect(t).not.toContain('d4')
  })

  it('initial position bishops have 0 moves', () => {
    const s = createInitialState()
    expect(getLegalMoves(s, parseSquare('c1'))).toHaveLength(0)
    expect(getLegalMoves(s, parseSquare('f1'))).toHaveLength(0)
  })
})

// ─── rook moves ───────────────────────────────────────────────────────────────

describe('rook moves', () => {
  it('central rook on an empty board has 14 moves', () => {
    const s = position('white', {
      d4: { type: 'rook', color: 'white' },
      a1: { type: 'king', color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('d4'))).toHaveLength(14)
  })

  it('rook is blocked by friendly pieces', () => {
    const s = position('white', {
      d4: { type: 'rook', color: 'white' },
      d6: { type: 'pawn', color: 'white' }, d2: { type: 'pawn', color: 'white' },
      b4: { type: 'pawn', color: 'white' }, f4: { type: 'pawn', color: 'white' },
      a1: { type: 'king', color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'd4')
    expect(t).toContain('d5'); expect(t).not.toContain('d6')
    expect(t).toContain('d3'); expect(t).not.toContain('d2')
    expect(t).toContain('c4'); expect(t).not.toContain('b4')
    expect(t).toContain('e4'); expect(t).not.toContain('f4')
  })

  it('rook can capture an enemy piece on its ray but not pass through', () => {
    const s = position('white', {
      a1: { type: 'rook', color: 'white' }, a5: { type: 'pawn', color: 'black' },
      h1: { type: 'king', color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'a1')
    expect(t).toContain('a5')
    expect(t).not.toContain('a6')
  })
})

// ─── queen moves ──────────────────────────────────────────────────────────────

describe('queen moves', () => {
  it('central queen on a near-empty board has 26 moves', () => {
    // Kings on a1 (friendly, blocks that diagonal) and h8 (enemy, capturable).
    // a1 is a friendly king so the a1 square is blocked: 27 - 1 = 26.
    const s = position('white', {
      d4: { type: 'queen', color: 'white' },
      a1: { type: 'king',  color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('d4'))).toHaveLength(26)
  })

  it('queen combines rook and bishop rays', () => {
    const s = position('white', {
      d1: { type: 'queen', color: 'white' },
      a1: { type: 'king',  color: 'white' }, h8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'd1')
    expect(t).toContain('d8') // file
    expect(t).toContain('h1') // rank
    expect(t).toContain('a4') // diagonal
    expect(t).toContain('g4') // diagonal
  })
})

// ─── king moves ───────────────────────────────────────────────────────────────

describe('king moves', () => {
  it('central king has 8 moves on an empty board', () => {
    const s = position('white', {
      e4: { type: 'king', color: 'white' },
      e8: { type: 'king', color: 'black' },
    })
    expect(getLegalMoves(s, parseSquare('e4'))).toHaveLength(8)
  })

  it('king cannot move into check', () => {
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      d8: { type: 'rook', color: 'black' }, h8: { type: 'king', color: 'black' },
    })
    const t = targets(s, 'e1')
    expect(t).not.toContain('d1')
    expect(t).not.toContain('d2')
  })

  it('king cannot capture a defended piece', () => {
    // f1 black rook is defended by f8 black rook along the f-file.
    // White king on e1 cannot capture f1 because it would step into check.
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      f1: { type: 'rook', color: 'black' },
      f8: { type: 'rook', color: 'black' }, h8: { type: 'king', color: 'black' },
    })
    expect(targets(s, 'e1')).not.toContain('f1')
  })

  it('king can capture an undefended enemy piece', () => {
    // f1 black rook is NOT defended — king can capture it.
    const s = position('white', {
      e1: { type: 'king', color: 'white' },
      f1: { type: 'rook', color: 'black' }, h8: { type: 'king', color: 'black' },
    })
    expect(targets(s, 'e1')).toContain('f1')
  })
})
