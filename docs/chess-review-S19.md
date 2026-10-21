# Chess Game — Code Review Record (S-19)

**Reviewer:** Ivy, Staff Engineer  
**Ticket:** S-19  
**Date:** 2026-10-21  
**Reviewed commit range:** `55ec55d` (chess merge) through `92326b1` (current main HEAD)  
**CI on main:** run [39590154010](https://github.com/mohammed-afzal-cirruslabs/kanban-board/actions/runs/39590154010) — ✅ success  
**Tests on main:** 466 passed, 0 failed

---

## Verdict: APPROVED ✅

The chess game feature (S-11–S-16) has been reviewed in full. No blocking issues. All acceptance criteria from S-11 are satisfied. CI is green. The feature is live on `main`.

---

## What was reviewed

### Engine (`src/chess/engine/`)

| Module | Lines | Verdict | Key checks |
|---|---|---|---|
| `types.ts` | 72 | ✅ | Branded literal unions for `File`/`Rank`; single source of truth; zero React imports |
| `board.ts` | 76 | ✅ | All 8 utilities pure and bounded; `indexToSquare` throws on out-of-range; `cloneBoard` returns mutable slice (correct for `applyMoveRaw`) |
| `initial.ts` | 57 | ✅ | Standard starting position; all castling rights set; no EP target |
| `moves.ts` | 384 | ✅ | Sliding pieces stop on first occupant; pawn double-push gated on intermediate square; en passant uses `squareEquals` against `enPassantTarget`; promotion expands to all 4 pieces; castling checks empty squares |
| `legal.ts` | 94 | ✅ | `leavesKingSafe` uses `applyMoveRaw` (not `applyMove`) — avoids `status → getAllLegalMoves → legal → status` cycle; `castlingIsLegal` checks origin/transit/destination squares; `getAllLegalMoves` bypasses status guard correctly |
| `apply.ts` | 133 | ✅ | `applyMoveRaw` handles capture, en passant pawn removal, promotion, castling rook move, rights revocation, EP target, half/full-move clocks; `applyMove` calls `computeStatus` on the result |
| `status.ts` | 53 | ✅ | `isInCheck` scans for king then calls `isSquareAttacked`; `computeStatus` correctly distinguishes check/checkmate/stalemate/playing |
| `index.ts` | 87 | ✅ | Clean public API re-export; components import only from here |

**No circular-init hazard.** `apply → status → legal → apply` is call-time, not module-init. ✅

### UI (`src/chess/components/`)

| Component | Lines | Verdict | Key checks |
|---|---|---|---|
| `ChessGame.tsx` | 175 | ✅ | Owns `GameState` + `SelectionState`; 1st click selects, 2nd click on legal target applies move; queen-promotion default correct; `isOver` guard prevents moves after game ends |
| `ChessBoard.tsx` | 110 | ✅ | Rank 8→1 top-to-bottom (correct orientation); `role="grid"` + `aria-disabled`; coordinate labels on rank 1 / file a |
| `ChessSquare.tsx` | 124 | ✅ | Real `<button>` — keyboard operable; `aria-label` describes piece + state; `aria-pressed` on selected; `disabled` on non-interactive; move dot vs capture ring correctly distinguished |

### CSS / token compliance

- `ChessBoard.module.css` — 100% token-driven ✅
- `ChessSquare.module.css` — 100% token-driven ✅
- `ChessGame.module.css` — `.dotWhite: #ffffff` / `.dotBlack: #1a1a1a` are accepted literals (piece-contrast colours; no design token exists for piece colour; documented trade-off from S-15) ✅

### Tests

4 test files, ~110 cases covering all 13 acceptance criteria from S-11:

| Criterion | File | Result |
|---|---|---|
| Legal moves per piece | `chess.engine.test.ts` | ✅ |
| Castling (all variants) | `chess.engine.moves.test.ts` | ✅ |
| En passant (incl. rank-pin edge case) | `chess.engine.moves.test.ts` | ✅ |
| Promotion (all 4 pieces) | `chess.engine.moves.test.ts` | ✅ |
| Self-check rejection | `chess.engine.moves.test.ts` | ✅ |
| Check from known position | `chess.engine.status.test.ts` | ✅ |
| Checkmate from known position | `chess.engine.status.test.ts` | ✅ |
| Stalemate from known position | `chess.engine.status.test.ts` | ✅ |
| Turn alternation | `chess.engine.status.test.ts` | ✅ |
| Select-and-move UI | `chess.ui.extended.test.tsx` | ✅ |
| Illegal move ignored | `chess.ui.extended.test.tsx` | ✅ |
| Status display | `chess.ui.extended.test.tsx` | ✅ |
| Reset | `chess.ui.extended.test.tsx` | ✅ |

---

## Design decisions accepted

1. **Flat `Piece | null` array (64 elements)** — simplest to reason about, trivially serialisable for snapshot tests, fast enough for a browser two-player game. Not suitable for an AI search tree; acceptable because S-11 excludes AI.
2. **`applyMoveRaw` / `applyMove` split** — breaks the `status → legal → apply → status` cycle without introducing a flag or a separate code path.
3. **Promotion defaults to queen in v1** — engine generates all 4; UI picks queen. Explicit promotion UI is out of scope for S-11.
4. **No new dependencies** — engine is plain TypeScript arrays and objects; UI uses only React 18 + CSS Modules already in the project.
5. **Literal piece colours in `ChessGame.module.css`** — `#ffffff`/`#1a1a1a` for the status-bar dot. No design token exists for piece colour. Accepted trade-off; a future token can replace these.

---

## CI evidence

| Branch / commit | Run | Conclusion |
|---|---|---|
| `feature/S-16-chess-tests` @ `8b38a85` | [39588496116](https://github.com/mohammed-afzal-cirruslabs/kanban-board/actions/runs/39588496116) | ✅ success |
| `main` @ `92326b1` | [39590154010](https://github.com/mohammed-afzal-cirruslabs/kanban-board/actions/runs/39590154010) | ✅ success |
