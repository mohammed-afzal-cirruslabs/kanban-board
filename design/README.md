# Design Files — Kanban Board Application

This directory contains all design specifications, mockups, and handoff documents for the Kanban Board application.

---

## 📁 Directory Structure

```
design/
├── README.md                    ← You are here
├── NAVBAR-HANDOFF.md           ← Quick handoff guide for Navbar
├── navbar-spec.md              ← Complete Navbar specification
├── navbar-figma-mockup.html    ← Interactive visual mockup (open in browser)
└── (future component specs)
```

---

## 🎨 Design System

**Direction:** Linear/Vercel-calm — structured, enterprise-legible, one accent  
**Tokens:** All values defined in `../src/tokens.css`  
**Typeface:** Inter (system-ui fallback)  
**Accent:** #2563eb (blue)

### Core Principles
1. **No literal values** — all colors, spacing, typography from tokens
2. **Hierarchy first** — primary action is most visible
3. **Whitespace & rhythm** — gaps from 4px scale (8/12/16/24/32/48)
4. **Browser defaults forbidden** — custom controls, focus rings, resets
5. **Every state designed** — loading, empty, error, success, hover, focus, active

---

## 📋 Component Specifications

### Navbar Component
**Status:** ✅ Design complete, ready for implementation  
**Files:**
- `NAVBAR-HANDOFF.md` — Quick reference for frontend developer
- `navbar-spec.md` — Complete 20-section specification
- `navbar-figma-mockup.html` — Interactive visual mockup with 10 frames

**Quick Start:**
1. Open `navbar-figma-mockup.html` in browser
2. Read `NAVBAR-HANDOFF.md` for summary
3. Reference `navbar-spec.md` during implementation

**Key Features:**
- Sticky horizontal navigation (64px height)
- Logo + brand + 3 nav links + search + avatar
- Responsive: desktop horizontal, mobile hamburger menu
- Dark mode support
- All states: default, hover, active, focus, pressed
- WCAG AA compliant (contrast ≥4.5:1)

---

## 🔧 How to Use These Files

### For Frontend Developers
1. **Start with the handoff doc** — `NAVBAR-HANDOFF.md` gives you the quick summary
2. **Open the mockup** — `navbar-figma-mockup.html` shows you what to build
3. **Reference the spec** — `navbar-spec.md` has every measurement and token
4. **Use tokens only** — import from `../src/tokens.css`, no literal values
5. **Screenshot for review** — capture at 1280/768/390px, light/dark

### For Designers
1. **Follow the established direction** — Linear/Vercel-calm, defined in `../DESIGN.md`
2. **Use existing tokens** — read `../src/tokens.css` before adding new values
3. **Document everything** — layout, spacing, typography, colors, states, motion
4. **Provide visual mockups** — HTML/Figma/screenshots, not just text
5. **Specify all states** — default, hover, active, focus, pressed, disabled, loading, error, empty

### For QA/Reviewers
1. **Open the mockup** — `navbar-figma-mockup.html` is the visual reference
2. **Check against spec** — `navbar-spec.md` section 16 has the review checklist
3. **Verify tokens** — no literal colors/spacing in component CSS
4. **Test all states** — hover, focus, active, keyboard nav, dark mode
5. **Test responsive** — 1280px, 768px, 390px breakpoints

---

## 📐 Design Token Reference

All components use values from `../src/tokens.css`:

### Colors
- **Surface:** `--color-surface-0/1/2/3` (white → light grey)
- **Text:** `--color-text-primary/secondary/muted` (dark → light grey)
- **Accent:** `--color-accent` (#2563eb blue)
- **Semantic:** `--color-success/warning/danger/info`
- **Border:** `--color-border` (rgba(0,0,0,0.10))

### Spacing (4px scale)
- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-8: 32px`
- `--space-12: 48px`

### Typography
- **Sizes:** `--text-xs/sm/base/lg/xl/2xl/3xl` (12px → 32px)
- **Weights:** `--weight-normal/medium/semibold/bold` (400/500/600/700)
- **Leading:** `--leading-tight/normal/relaxed` (1.25/1.5/1.75)

### Radii
- `--radius-sm: 4px`
- `--radius-md: 8px`
- `--radius-lg: 12px`
- `--radius-full: 9999px`

### Shadows
- `--shadow-1/2/3` (subtle → pronounced)

### Motion
- `--duration-fast: 150ms`
- `--duration-normal: 200ms`
- `--duration-slow: 300ms`
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`

---

## ✅ Design Review Checklist

Before approving any component:

- [ ] **Hierarchy:** Clear visual priority (primary action most visible)
- [ ] **Whitespace:** Consistent gaps from spacing scale
- [ ] **Typography:** Sizes and weights from type scale, no defaults
- [ ] **Color:** All values from tokens, contrast ≥4.5:1
- [ ] **States:** Hover, focus, active, pressed, disabled defined
- [ ] **Responsive:** Desktop, tablet, mobile layouts specified
- [ ] **Motion:** Transitions use token durations and easing
- [ ] **Accessibility:** Semantic HTML, ARIA, keyboard nav, focus ring
- [ ] **Dark mode:** All colors have dark overrides, contrast re-checked
- [ ] **Consistency:** Matches existing component patterns

---

## 🎯 Component Inventory

### Completed
- ✅ **Navbar** — Navigation bar with logo, links, actions (Nov 16, 2026)

### In Progress
- (none)

### Planned
- KanbanCard (already implemented, needs design doc)
- KanbanColumn (already implemented, needs design doc)
- Button component
- Input component
- Modal component
- Dropdown menu
- Toast notifications

---

## 📞 Questions?

**For design questions:**
- Check the component's spec file (e.g., `navbar-spec.md`)
- Review the design tokens in `../src/tokens.css`
- Read the design direction in `../DESIGN.md`
- Ask the Product Designer

**For implementation questions:**
- Check the handoff doc (e.g., `NAVBAR-HANDOFF.md`)
- Open the mockup HTML file in browser
- Review existing component code for patterns
- Ask the Frontend Developer

---

**Last Updated:** November 16, 2026  
**Maintained By:** Product Designer (AI)
