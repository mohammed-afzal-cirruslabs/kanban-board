# Design System — Kanban Board

> **Direction:** "Linear/Vercel-calm" — structured, enterprise-legible, one accent.
> Every value in this document is authoritative. Engineers read tokens from
> `src/tokens.css`; they never write a literal colour, spacing value, radius or
> shadow in a component stylesheet.

---

## 1. Typeface

| Role | Value |
|------|-------|
| Family | **Inter** → `ui-sans-serif, system-ui, -apple-system, …` (full stack in `--font-sans`) |
| Smoothing | `antialiased` on both engines |
| Base size | 14 px (`--text-base`) |

Inter is loaded via the system-ui stack on macOS/iOS (San Francisco renders at the same metrics) and falls back to Segoe UI on Windows. No web-font request is needed for the MVP; add `<link rel="preconnect">` + Google Fonts `Inter` when the product goes to production.

---

## 2. Type Scale

| Token | px | Usage |
|-------|----|-------|
| `--text-xs`   | 12 | Captions, badges, kbd hints |
| `--text-sm`   | 13 | Card description, input text |
| `--text-base` | 14 | Card title, column body |
| `--text-md`   | 16 | Section headings |
| `--text-lg`   | 20 | Page title |
| `--text-xl`   | 24 | Display / hero |

Weight ladder: `--weight-regular (400)` → `--weight-medium (500)` → `--weight-semibold (600)` → `--weight-bold (700)` → `--weight-extrabold (800)`.

Hierarchy rule: headings differ from body in **size AND weight AND colour**. Secondary text is muted (`--color-text-muted`), not just smaller.

---

## 3. Spacing Scale (4 px base)

```
4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48
```

Tokens: `--space-1` through `--space-12`. No ad-hoc values. Gaps between related items come from the lower end of the scale (8–12 px); section gaps from the upper end (24–32 px).

---

## 4. Colour Palette

### Light mode (default — dark mode is out of scope per S-2)

| Role | Token | Hex |
|------|-------|-----|
| Page canvas | `--color-bg` | `#f0f2f5` |
| Card / input / header | `--color-surface-0` | `#ffffff` |
| Column background | `--color-surface-1` | `#f7f8fa` |
| Hover / badge bg | `--color-surface-2` | `#eef0f3` |
| Dividers / borders | `--color-surface-3` | `#e3e6eb` |
| Subtle border | `--color-border` | `rgba(0,0,0,0.10)` |
| Strong border | `--color-border-strong` | `rgba(0,0,0,0.18)` |
| Primary text | `--color-text-primary` | `#111827` |
| Body text | `--color-text-secondary` | `#374151` |
| Muted / captions | `--color-text-muted` | `#6b7280` |
| Placeholder | `--color-text-placeholder` | `#9ca3af` |

### Accent (one)

| State | Token | Hex |
|-------|-------|-----|
| Default | `--color-accent` | `#2563eb` |
| Hover | `--color-accent-hover` | `#1d4ed8` |
| Active | `--color-accent-active` | `#1e40af` |
| Drag-over bg | `--color-accent-subtle` | `#eff6ff` |
| Drag-over border | `--color-accent-border` | `#bfdbfe` |

Contrast check (WCAG AA):
- `--color-text-primary` on `--color-surface-0`: **16.7:1** ✅
- `--color-text-muted` on `--color-surface-0`: **4.6:1** ✅
- White on `--color-accent`: **4.9:1** ✅

### Semantic

`--color-success`, `--color-warning`, `--color-danger`, `--color-info` + `*-subtle` variants. Reserved for future card labels / status chips.

---

## 5. Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4 px | kbd, badges |
| `--radius-md` | 8 px | cards, inputs, buttons |
| `--radius-lg` | 12 px | columns |
| `--radius-full` | 9999 px | pill badges, count chips |

---

## 6. Elevation

| Token | Shadow | Usage |
|-------|--------|-------|
| `--shadow-0` | none | flat / reset |
| `--shadow-1` | `0 1px 3px …` | card resting |
| `--shadow-2` | `0 4px 12px …` | card hover |
| `--shadow-3` | `0 8px 24px …` | drag overlay |

Three levels only. No component may invent a fourth.

---

## 7. Motion

| Token | Value |
|-------|-------|
| `--duration-fast` | 150 ms |
| `--duration-normal` | 200 ms |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |

All transitions use `var(--duration-fast) var(--ease-out)`. `prefers-reduced-motion` collapses both durations to 0 ms — already handled in `tokens.css`.

---

## 8. Focus Ring

```css
box-shadow: 0 0 0 2px var(--color-surface-0), 0 0 0 4px var(--color-accent);
```

Applied via `:focus-visible` globally in `index.css` and explicitly on interactive components. No browser-default outline anywhere.

---

## 9. Control Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--control-sm` | 32 px | compact / secondary |
| `--control-md` | 36 px | default (inputs, buttons) |
| `--control-lg` | 40 px | prominent CTA |

All controls in the board use `--control-md`.

---

## 10. Component Breakdown

### 10.1 `<Board>` (App.tsx)

- **Role:** root layout container; owns all DnD context and column state.
- **Layout:** `display: flex; gap: --space-5; overflow-x: auto; align-items: flex-start`.
- **Responsive breakpoints:** 1280 (default) → 1024 (reduced padding) → 768 (stacked columns).
- **States:** normal, drag-in-progress (DragOverlay active).

### 10.2 `<KanbanColumn>`

- **Role:** a droppable lane; owns add-card state.
- **Anatomy:**
  - `header` — column title (uppercase, `--text-xs`, `--weight-bold`) + card-count badge.
  - `cardList` — scrollable `SortableContext`; min-height 60 px so empty columns remain droppable.
  - `footer` — add-card affordance (dashed button → inline form).
- **States:**
  - Default: `--color-surface-1` background.
  - `isOver` (drag hover): `--color-accent-subtle` background + `--color-accent-border` border.
  - Empty: centred italic message, `--color-text-placeholder`.
  - Adding: form replaces the dashed button.

### 10.3 `<KanbanCard>`

- **Role:** a sortable drag handle + content display.
- **Anatomy:**
  - `title` — `--text-base`, `--weight-semibold`, `--color-text-primary`.
  - `description` — `--text-sm`, `--color-text-muted`, 2-line `-webkit-line-clamp`.
- **States:**
  - Resting: `--shadow-1`, `cursor: grab`.
  - Hover: `--shadow-2`.
  - Dragging (ghost): `opacity: 0.4`, `--shadow-0`.
  - Drag overlay: `--shadow-3`, `rotate: 2deg`, `cursor: grabbing`.
  - Focus-visible: `--focus-ring` + `--shadow-1`.

### 10.4 Add-card affordance (`KanbanColumn` footer)

- **Collapsed:** full-width dashed button, `--control-md` height, `--color-text-muted`.
  - Hover: `--color-surface-2` bg, `--color-text-primary` text.
- **Expanded (form):**
  - Title input (required) + description input (optional).
  - `btnPrimary` ("Add card") + `btnGhost` ("Cancel").
  - All controls `--control-md` height, `--radius-md`, `--font-sans`.
  - Focus state: `--focus-ring` on every interactive element.

---

## 11. Drag-and-Drop Interaction Model

Library: **@dnd-kit/core** + **@dnd-kit/sortable**.

| Sensor | Activation |
|--------|------------|
| `PointerSensor` | `distance: 5 px` (prevents accidental drag on click) |
| `KeyboardSensor` | `sortableKeyboardCoordinates` — Space to pick up, ←/→ to move column, ↑/↓ to reorder within column, Enter/Escape to drop/cancel |

Collision strategy: `closestCorners`.

**Cross-column move flow:**
1. `onDragStart` — snapshot `activeCard` for the overlay.
2. `onDragOver` — card crosses a column boundary → optimistically move to new column (insert before `overId` card, or append).
3. `onDragEnd` — refine within-column order via `arrayMove`; clear `activeCard`.

**DragOverlay:** renders a `KanbanCard` with `cardOverlay` class (rotated 2°, `--shadow-3`) so the floating copy is visually distinct from the ghost.

**Keyboard accessibility (AC #6):** documented in the header hint bar — `Space` to pick up, `←` `→` to move column, `Enter` to drop.

---

## 12. Empty State Copy

| Context | Copy |
|---------|------|
| Empty column | *"No cards yet — add one below"* |
| Add-card title placeholder | *"Card title"* |
| Add-card description placeholder | *"Description (optional)"* |
| Add-card button label | *"+ Add a card"* |

---

## 13. What the Frontend Ticket (S-4) Consumes

1. Import `src/tokens.css` once in `src/index.css` (already done).
2. Every component stylesheet reads only `var(--…)` tokens — no literal values.
3. New components follow the control-height, radius and shadow tables above.
4. Any new colour must be added to `tokens.css` first, not inline.
5. The drag overlay uses the `.cardOverlay` class from `KanbanCard.module.css`.
6. Responsive behaviour is handled at the `App.module.css` level; columns are
   `--column-width` wide and stack at 768 px.
