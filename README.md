# kanban-board

Kanban board UI — columns, draggable cards, clean styling.

## Stack

| Layer | Choice |
|---|---|
| **Framework** | React 18 |
| **Build tool** | Vite 6 |
| **Language** | TypeScript 5 |
| **Drag-and-drop** | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| **Package manager** | pnpm 9 (`packageManager: pnpm@9.15.9`) |
| **Test runner** | Vitest 3 + Testing Library |
| **Linter** | ESLint 9 + typescript-eslint |

## Project tracking

| | |
|---|---|
| **GitHub repo** | <https://github.com/mohammed-afzal-cirruslabs/kanban-board> |
| **ClickUp Delivery list** | _Pending ClickUp OAuth reconnect — update this line with the list URL once the token is restored_ |

## Prerequisites

- **Node 20+** — `node -v`
- **pnpm 9** — `npm i -g pnpm@9` (or `corepack enable && corepack prepare pnpm@9.15.9 --activate`)

## Setup

```bash
# 1. Clone
git clone https://github.com/mohammed-afzal-cirruslabs/kanban-board.git
cd kanban-board

# 2. Install (frozen — uses the exact lockfile)
pnpm install --frozen-lockfile
```

## Run

```bash
# Development server (hot-reload)
pnpm dev

# Production build
pnpm build

# Preview the production build locally
pnpm preview
```

## Test

```bash
# Run all tests once (CI mode)
pnpm test

# Watch mode (re-runs on save)
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Lint / type-check

```bash
pnpm lint        # ESLint — zero warnings enforced
pnpm typecheck   # tsc --noEmit
```

## CI

Every pull request runs **lint → typecheck → test → build** via GitHub Actions (`.github/workflows/ci.yml`).
The pipeline must be green before merging.

## Project structure

```
src/
  components/
    KanbanBoard.tsx      # Root — owns state, DndContext, DragOverlay
    KanbanColumn.tsx     # Column header + card list (SortableContext)
    KanbanCard.tsx       # Draggable card (useSortable)
    AddCardForm.tsx      # Inline add-card form per column
  tokens.css             # Design tokens — all CSS custom properties
  App.tsx
  main.tsx
tests/
  KanbanBoard.test.tsx   # 29 tests covering all acceptance criteria
```
