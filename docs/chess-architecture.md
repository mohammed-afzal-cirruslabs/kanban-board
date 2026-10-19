# Chess Feature — Architecture Design (S-12)

**Author:** Ivy (Staff Engineer)  
**Ticket:** S-12  
**Status:** Approved — implementation tickets S-13 (engine), S-14 (visual), S-15 (UI), S-16 (tests), S-17 (PR/review)

---

## 1. Problem

Add a fully playable chess game to the `kanban-board` repo without disturbing the existing Kanban and Todo views. The feature must satisfy all 11 acceptance criteria in S-11, pass `pnpm lint && pnpm typecheck && pnpm test`, and land via a green CI pull request.

---

## 2. Constraints (from the existing codebase)

| Fact | Implication |
|---|---|
| React 18 + TS 5 + Vite 6 + Vitest + pnpm 9 | No new framework, no new test runner |
| `View = 'kanban' \| 'todo'` in App.tsx | Extend to `'kanban' \| 'todo' \| 'chess'` — one-line change |
| CSS Modules + `tokens.css` — no literal hex anywhere | Chess styles follow the same token-only rule |
| No router (plain `useState<View>`) | Chess is a third tab in the existing nav, not a route |
| No external state library | Local `useState` in `ChessPage` is sufficient |
| No drag-and-drop needed for chess | Click-to-select / click-to-move; no dnd-kit involvement |

---

## 3. Module Boundaries

```
src/
  chess/
    engine/           ← PURE TypeScript. Zero React, zero DOM.
      types.ts        ← All exported types (Board, GameState, Move, …)
      index.ts        ← Public API re-exports + declare stubs
      board.ts        ← squareIndex, pieceAt, squareName, squareEquals, …
      moves.ts        ← Pseudo-legal move generation per piece type
      legal.ts        ← Legality filter: removes moves leaving king in check
      apply.ts        ← applyMove: produces next GameState
      status.ts       ← isInCheck, computeStatus (checkmate/stalemate)
      initial.ts      ← createInitialState: standard starting position
    components/       ← React UI. Imports ONLY from engine/index.ts.
      ChessPage.tsx   ← Root; owns GameState + SelectionState
      ChessBoard.tsx  ← 8×8 grid; receives board + selection + callbacks
      ChessSquare.tsx ← Single square: piece, highlight classes, onClick
      ChessPiece.tsx  ← Unicode/SVG piece renderer
      GameBanner.tsx  ← Turn indicator, check warning, result announcement
      *.module.css    ← Token-only styles
  test/
    chess.engine.test.ts   ← Pure engine tests (no React, no jsdom)
    chess.ui.test.tsx      ← ChessPage integration tests (RTL + jsdom)
```

**The boundary is enforced by convention:**  
`engine/` files may not import from `components/` or from React.  
`components/` files import from `engine/index.ts` only — never from internal engine modules.

---

## 4. Data Model Decision

### Board: flat `Piece | null` array (64 elements)

**Considered:** bitboards (12 × 64-bit integers), piece-list map, 8×8 nested array.

**Chosen:** `type Board = ReadonlyArray<Piece | null>` indexed by `rank * 8 + file`.

**Why:** Simplest to reason about, trivially serialisable for snapshot tests, fast enough for a browser two-player game (no AI search tree). Spread-copy for immutability is O(64) — negligible.

**Cost accepted:** Not suitable for an AI engine that searches millions of positions. Acceptable because S-11 explicitly excludes an AI opponent.

### Move: fully-described `Move` object

Every move carries `from`, `to`, `piece`, `captured`, and a `MoveFlags` struct. The UI never re-derives intent from coordinates alone — it just renders what the engine says.

**Why:** Avoids a second pass to detect castling/en-passant/promotion in the UI layer. Tests can assert on flags directly.

---

## 5. Engine Internal Flow

```
createInitialState()
        │
        ▼
  GameState (immutable)
        │
  ┌─────┴──────────────────────────────────────────┐
  │  getLegalMoves(state, square)                   │
  │    1. generatePseudoLegal(board, square)        │  moves.ts
  │    2. for each: applyMove tentatively           │  apply.ts
  │    3. discard if isInCheck(color)               │  status.ts
  │    4. return Move[]                             │
  └─────────────────────────────────────────────────┘
        │  user picks a move
        ▼
  applyMove(state, move) → GameState'               │  apply.ts
    • update board (capture, castle rook, ep, promote)
    • revoke castling rights if king/rook moved
    • set enPassantTarget (or null)
    • flip turn
    • computeStatus(state') → status                │  status.ts
    • set lastMove
```

`computeStatus` calls `getAllLegalMoves` for the new side-to-move:
- 0 legal moves + in check → `'checkmate'`
- 0 legal moves + not in check → `'stalemate'`
- in check + moves exist → `'check'`
- otherwise → `'playing'`

---

## 6. React UI Flow

```
ChessPage (useState: GameState, SelectionState)
  │
  ├── GameBanner  ← reads state.status, state.turn
  │
  └── ChessBoard  ← reads state.board, state.lastMove, selectionState
        │
        └── ChessSquare × 64
              │  onClick(square)
              ▼
        handleSquareClick(square):
          if nothing selected:
            piece = pieceAt(board, square)
            if piece?.color === state.turn:
              legalTargets = getLegalMoves(state, square).map(m => m.to)
              setSelection({ selected: square, legalTargets })
          else:
            move = find move where squareEquals(move.to, square)
            if move found:
              setGameState(applyMove(state, move))
              clearSelection()
            elif square has own piece:
              re-select (replace selection)
            else:
              clearSelection()
```

**Promotion:** v1 auto-promotes to queen. `applyMove` receives a move with `promotionPiece: 'queen'` set by the UI before calling. A future ticket can add a picker modal without touching the engine.

---

## 7. App.tsx Integration

**Change is minimal and isolated:**

```ts
// Before
type View = 'kanban' | 'todo'

// After  (one line)
type View = 'kanban' | 'todo' | 'chess'
```

Add one nav button and one conditional render:

```tsx
{view === 'chess' && <ChessPage />}
```

No DnD context, no shared state, no changes to existing views.

---

## 8. Styling Rules

- All chess CSS lives in `chess/components/*.module.css`.
- Token-only: no literal colours, spacing, or radii — use `var(--color-*)`, `var(--space-*)`, `var(--radius-*)` from `tokens.css`.
- New tokens to add to `tokens.css` (in the existing `:root` block and dark-mode block):

```css
/* ─── Chess board ────────────────────────────────────────────────────────── */
--chess-light-square:    #f0d9b5;   /* classic light square */
--chess-dark-square:     #b58863;   /* classic dark square  */
--chess-highlight-legal: rgba(0, 0, 0, 0.15);   /* legal-move dot */
--chess-highlight-last:  rgba(255, 255, 0, 0.35); /* last-move tint */
--chess-highlight-check: rgba(220, 38, 38, 0.45); /* king-in-check tint */
--chess-highlight-selected: rgba(20, 85, 30, 0.5); /* selected square */
```

Dark-mode variants go in the existing `@media (prefers-color-scheme: dark)` block.

---

## 9. Test Strategy

| File | What it tests | Runner env |
|---|---|---|
| `chess.engine.test.ts` | All engine functions in isolation — no React, no DOM | Vitest node |
| `chess.ui.test.tsx` | ChessPage: initial render, click-to-select, click-to-move, turn enforcement, check banner, checkmate banner | Vitest jsdom + RTL |

Engine tests use `createInitialState()` + `applyMove()` sequences to reach positions, then assert on `getLegalMoves`, `isInCheck`, `computeStatus`. Use `parseSquare('e2')` helpers for readable test setup. No board-string parsing needed.

Coverage target: ≥ 80% of `src/chess/engine/**` lines (measured by `pnpm test:coverage`).

---

## 10. What Is Explicitly Out of Scope (S-11)

No AI · no clocks · no PGN · no multiplayer · no persistence · no drag-and-drop · no 50-move-rule enforcement · no threefold repetition · no promotion picker UI (auto-queen in v1).

---

## 11. Trade-offs Accepted

| Decision | Cost |
|---|---|
| Flat array board | Not suitable for AI search; fine for two-player |
| Auto-queen promotion | Incomplete UX; promotion picker is a follow-up ticket |
| No router | Chess is a tab, not a URL; deep-linking not possible |
| Unicode pieces (primary) | Rendering quality depends on OS font; SVG sprites are a follow-up |
| No 50-move / repetition draw | Incomplete draw rules; acceptable for v1 scope |

---

## 12. File Checklist for Downstream Engineers

| Ticket | Owner | Files to create |
|---|---|---|
| S-13 | Engine engineer | `engine/board.ts`, `engine/moves.ts`, `engine/legal.ts`, `engine/apply.ts`, `engine/status.ts`, `engine/initial.ts` — implement every `declare function` in `engine/index.ts` |
| S-14 | Visual designer | `tokens.css` chess-token additions, visual spec for board colours and piece style |
| S-15 | Frontend engineer | `components/ChessPage.tsx`, `ChessBoard.tsx`, `ChessSquare.tsx`, `ChessPiece.tsx`, `GameBanner.tsx` + their CSS modules; `App.tsx` View extension |
| S-16 | QA engineer | `test/chess.engine.test.ts`, `test/chess.ui.test.tsx` — cover all 11 ACs |
| S-17 | Ivy | PR review, CI green, merge |
