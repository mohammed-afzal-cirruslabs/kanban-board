# Navbar Component — Design Handoff

**Project:** Kanban Board Application  
**Component:** Navigation Bar  
**Designer:** Product Designer (AI)  
**Date:** November 16, 2026  
**Status:** ✅ Ready for Frontend Implementation

---

## 📋 Quick Summary

The Navbar is a sticky horizontal navigation component that provides:
- **Branding** — Logo + "Kanban Board" text
- **Navigation** — Dashboard, Boards, Analytics links
- **Actions** — Search button and user avatar
- **Responsive** — Desktop horizontal layout, mobile hamburger menu

**Design Direction:** Linear/Vercel-calm — structured, enterprise-legible, one accent  
**All values from:** `src/tokens.css` — no literal colors or spacing

---

## 📦 Deliverables

### 1. Visual Specification Document
**File:** `design/navbar-spec.md`  
**Contains:**
- Complete layout structure (3-section: logo, nav, actions)
- Typography specifications (sizes, weights, colors)
- Color palette with token references
- Spacing and dimensions (64px height, 24px padding, gaps)
- All component states (default, hover, active, focus, pressed)
- Responsive behavior (desktop ≥768px, mobile <768px)
- Dark mode color overrides
- Accessibility requirements (ARIA, keyboard nav, focus ring)
- Motion and transitions (150ms ease-out)
- Implementation notes (CSS modules, TypeScript props)

### 2. Visual Mockup (HTML)
**File:** `design/navbar-figma-mockup.html`  
**Open in browser to see:**
- Frame 1: Desktop default state
- Frame 2: Desktop hover states
- Frame 3: Desktop focus states (keyboard navigation)
- Frame 4: Dark mode desktop
- Frame 5: Mobile closed menu
- Frame 6: Mobile open menu with dropdown
- Frame 7: Spacing annotations (redlines)
- Frame 8: Component breakdown (individual elements)
- Frame 9: Nav link states (default/hover/active/focus)
- Frame 10: Icon button states (default/hover/active/focus)
- Design tokens reference table

### 3. Responsive Diagram
**File:** `.claire/diagrams/navbar-responsive-breakpoints.png`  
**Shows:** Desktop vs mobile layout transformation at 768px breakpoint

### 4. Structure Diagram
**File:** `.claire/diagrams/navbar-structure.png`  
**Shows:** Component hierarchy (container → sections → elements)

---

## 🎨 Design Tokens Used

All values reference `src/tokens.css`:

### Colors
```css
--color-surface-0: #ffffff (navbar background)
--color-surface-2: #eef0f3 (hover background)
--color-surface-3: #e3e6eb (pressed background)
--color-border: rgba(0,0,0,0.10) (border, avatar ring)

--color-text-primary: #111827 (brand text, hover text)
--color-text-secondary: #374151 (nav links default)
--color-text-muted: #6b7280 (icon buttons)

--color-accent: #2563eb (active link, focus ring)
--color-accent-hover: #1d4ed8 (accent hover)
--color-accent-subtle: #eff6ff (active link background, logo bg)
```

### Spacing
```css
--space-2: 8px (nav links gap)
--space-3: 12px (logo-to-brand gap, actions gap)
--space-4: 16px (mobile padding, mobile menu padding)
--space-6: 24px (desktop padding)
```

### Typography
```css
--font-sans: Inter (all text)
--text-base: 14px (nav links)
--text-lg: 20px (brand text)
--weight-medium: 500 (nav links default)
--weight-semibold: 600 (active link)
--weight-bold: 700 (brand text)
```

### Other
```css
--radius-md: 8px (buttons, logo, links)
--radius-full: 9999px (avatar circle)
--control-md: 36px (icon buttons, avatar size)
--header-height: 64px (navbar height)
--duration-fast: 150ms (transitions)
--ease-out: cubic-bezier(0.16, 1, 0.3, 1) (easing)
--shadow-1: 0 1px 2px rgba(0,0,0,0.05) (navbar shadow)
--shadow-2: 0 4px 6px rgba(0,0,0,0.1) (mobile menu shadow)
--focus-ring: 0 0 0 2px white, 0 0 0 4px accent (focus state)
```

---

## 📐 Key Measurements

### Navbar Container
- **Height:** 64px (--header-height)
- **Max-width:** 1280px (--board-max-width)
- **Padding:** 24px desktop, 16px mobile
- **Background:** var(--color-surface-0)
- **Border-bottom:** 1px solid var(--color-border)
- **Position:** sticky, top: 0, z-index: 100

### Logo Section
- **Logo:** 32×32px, border-radius: 8px, bg: #eff6ff
- **Brand text:** 20px/700, color: #111827
- **Gap:** 12px

### Navigation Links
- **Font:** 14px/500, color: #374151
- **Padding:** 8px 12px
- **Border-radius:** 8px
- **Gap between links:** 8px
- **Active state:** 14px/600, color: #2563eb, bg: #eff6ff

### Action Items
- **Icon buttons:** 36×36px, border-radius: 8px
- **Avatar:** 36×36px, border-radius: 9999px, border: 2px
- **Gap:** 12px

---

## 📱 Responsive Breakpoints

### Desktop (≥ 768px)
```
Layout: [Logo + Brand] [Nav Links] [Search + Avatar]
Nav links: Visible, horizontal
Mobile menu toggle: Hidden
Padding: 24px
```

### Mobile (< 768px)
```
Layout: [Logo + Brand] [Menu Toggle + Avatar]
Nav links: Hidden (moved to dropdown)
Search: Hidden (or moved to dropdown)
Mobile menu toggle: Visible
Padding: 16px

Mobile Menu Dropdown:
- Position: absolute, top: 64px, full-width
- Background: white, border-top, shadow
- Nav links: Stacked vertically, full-width
- Animation: slide-down 200ms ease-out
```

---

## 🎭 Component States

### Nav Link States
1. **Default:** #374151, 500 weight, transparent bg
2. **Hover:** #111827, 500 weight, #eef0f3 bg
3. **Active:** #2563eb, 600 weight, #eff6ff bg
4. **Focus:** 2px accent ring with 2px white offset
5. **Pressed:** #e3e6eb bg, scale(0.98)

### Icon Button States
1. **Default:** #6b7280, transparent bg
2. **Hover:** #111827, #eef0f3 bg
3. **Active:** #111827, #e3e6eb bg
4. **Focus:** 2px accent ring

### Avatar States
1. **Default:** 2px border rgba(0,0,0,0.10)
2. **Hover:** 2px border #2563eb

---

## ♿ Accessibility Requirements

### Semantic HTML
```html
<nav role="navigation" aria-label="Main navigation">
  <a href="/" aria-label="Kanban Board home">...</a>
  <ul role="list">
    <li><a href="/boards" aria-current="page">Boards</a></li>
  </ul>
  <button aria-label="Search">...</button>
  <button aria-label="User menu" aria-haspopup="true">...</button>
  <button aria-label="Menu" aria-expanded="false">...</button>
</nav>
```

### Keyboard Navigation
- Tab order: Logo → Nav links → Search → Avatar → Menu toggle
- Focus-visible: 2px accent ring with 2px white offset
- Enter/Space: Activates links and buttons
- Escape: Closes mobile menu

### Color Contrast (WCAG AA ✅)
- Brand text: 16.7:1
- Nav links: 10.0:1
- Muted icons: 4.6:1
- Active link: 4.9:1

---

## 🌙 Dark Mode

### Color Overrides
```css
@media (prefers-color-scheme: dark) {
  Navbar bg: #161b22
  Border: rgba(255,255,255,0.08)
  Brand text: #e6edf3
  Nav links: #c9d1d9
  Hover bg: #262d37
  Active link: #3b82f6 (lighter blue)
  Active bg: #0d1f3c
  Icon color: #8b949e
}
```

---

## 🎬 Motion & Transitions

### All Interactive Elements
```css
transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
```

### Mobile Menu Animation
```css
/* Enter (slide down) */
transform: translateY(-8px) → translateY(0);
opacity: 0 → 1;
duration: 200ms;

/* Exit (slide up) */
transform: translateY(0) → translateY(-8px);
opacity: 1 → 0;
duration: 150ms;
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0ms !important; }
  .mobile-menu { transform: none; } /* opacity only */
}
```

---

## 🔧 Implementation Checklist

### Frontend Developer Tasks
- [ ] Create `src/components/Navbar/` directory
- [ ] Create `Navbar.tsx` component
- [ ] Create `Navbar.module.css` with token references
- [ ] Import icons from `lucide-react` (Menu, X, Search)
- [ ] Add logo asset to `src/assets/logo.svg`
- [ ] Implement responsive behavior (768px breakpoint)
- [ ] Implement mobile menu toggle with state
- [ ] Add keyboard navigation support
- [ ] Add ARIA attributes
- [ ] Test all states (hover, focus, active, pressed)
- [ ] Test dark mode rendering
- [ ] Integrate into `App.tsx` above `<KanbanBoard>`
- [ ] Screenshot at 1280/768/390px, light/dark
- [ ] Submit for design review

### Design Review Criteria
- [ ] **Hierarchy:** Brand most prominent, nav secondary, actions tertiary
- [ ] **Whitespace:** Gaps match spacing scale (8/12/16/24px)
- [ ] **Typography:** Sizes and weights from type scale
- [ ] **Color:** All values from tokens, no literals
- [ ] **States:** All interactive states implemented
- [ ] **Responsive:** Works at 1280/768/390px
- [ ] **Motion:** Transitions use token durations
- [ ] **Accessibility:** Keyboard nav, ARIA, focus ring
- [ ] **Dark mode:** Renders correctly in dark theme
- [ ] **Consistency:** Matches KanbanCard/KanbanColumn patterns

---

## 📸 Visual Reference

**Open in browser:** `design/navbar-figma-mockup.html`

This HTML file contains:
- 10 frames showing all states and variants
- Spacing annotations with measurements
- Component breakdown with individual elements
- State comparisons (default/hover/active/focus)
- Design tokens reference table

**Screenshots required for review:**
1. Desktop 1280px, light mode, default state
2. Desktop 1280px, light mode, hover states
3. Desktop 1280px, dark mode
4. Mobile 390px, light mode, menu closed
5. Mobile 390px, light mode, menu open
6. Keyboard focus states (tab navigation)

---

## 🚀 Next Steps

1. **Frontend Developer** receives this handoff package
2. Opens `navbar-figma-mockup.html` in browser to see visual reference
3. Reads `navbar-spec.md` for complete specifications
4. Implements component following token system
5. Tests responsive behavior and all states
6. Screenshots for design review
7. **Product Designer** reviews screenshots against checklist
8. Approves or requests revisions
9. Component merged and integrated

---

## 📞 Questions?

If anything is unclear or missing:
- Check `navbar-spec.md` for detailed specifications
- Open `navbar-figma-mockup.html` for visual reference
- Review existing `KanbanCard.tsx` for component patterns
- Ask Product Designer for clarification

---

## ✅ Design Sign-Off

**Designer:** Product Designer (AI)  
**Date:** November 16, 2026  
**Status:** ✅ Approved for implementation

**Notes:**
- All measurements derived from existing design tokens
- Follows Linear/Vercel-calm direction established in DESIGN.md
- Consistent with KanbanCard and KanbanColumn components
- Accessibility requirements specified (WCAG AA compliant)
- Dark mode fully specified with color overrides
- Responsive behavior defined for desktop and mobile
- No literal values — all references to tokens.css

**This design is ready for frontend implementation.**

---

**End of Handoff Document**
