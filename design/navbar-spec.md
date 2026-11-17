# Navbar Component — Visual Design Specification

**Component:** Navigation Bar  
**Design Direction:** Linear/Vercel-calm — structured, enterprise-legible, one accent  
**Status:** Ready for implementation  
**Date:** November 16, 2026

---

## 1. Overview

The Navbar is a persistent horizontal navigation component that sits at the top of the kanban board application. It provides branding, primary navigation links, and quick access to search and user profile.

### Design Principles
- **Clarity:** Clear visual hierarchy with the brand on the left, navigation in the center, and actions on the right
- **Consistency:** Uses only design tokens from `src/tokens.css` — no literal values
- **Accessibility:** Keyboard navigable, proper focus states, ARIA labels
- **Responsive:** Adapts from desktop (1280px) to mobile (390px) with a hamburger menu

---

## 2. Layout & Structure

### 2.1 Container
```
Height: 64px (--header-height)
Background: var(--color-surface-0) — #ffffff
Border-bottom: 1px solid var(--color-border) — rgba(0,0,0,0.10)
Box-shadow: var(--shadow-1) — subtle elevation
Position: sticky, top: 0
Z-index: 100
```

### 2.2 Inner Container
```
Max-width: var(--board-max-width) — 1280px
Margin: 0 auto
Padding: 0 var(--space-6) — 0 24px
Display: flex
Align-items: center
Justify-content: space-between
Height: 100%
```

### 2.3 Three-Section Layout

**Left Section (Logo + Brand)**
- Logo icon: 32×32px
- Brand text: "Kanban Board"
- Gap: var(--space-3) — 12px
- Display: flex, align-items: center

**Center Section (Navigation Links)**
- Desktop only (hidden < 768px)
- Display: flex, gap: var(--space-2) — 8px
- Centered horizontally

**Right Section (Actions)**
- Search icon button
- User avatar
- Mobile menu toggle (< 768px only)
- Gap: var(--space-3) — 12px
- Display: flex, align-items: center

---

## 3. Typography

### 3.1 Brand Text
```
Font-family: var(--font-sans) — Inter
Font-size: var(--text-lg) — 20px
Font-weight: var(--weight-bold) — 700
Color: var(--color-text-primary) — #111827
Letter-spacing: -0.02em (tight)
Line-height: 1
```

### 3.2 Navigation Links
```
Font-family: var(--font-sans) — Inter
Font-size: var(--text-base) — 14px
Font-weight: var(--weight-medium) — 500
Color: var(--color-text-secondary) — #374151
Line-height: var(--leading-normal) — 1.5
```

### 3.3 Active Link
```
Font-weight: var(--weight-semibold) — 600
Color: var(--color-accent) — #2563eb
```

---

## 4. Color Palette (from tokens.css)

### 4.1 Surface Colors
- **Navbar background:** `--color-surface-0` (#ffffff)
- **Border:** `--color-border` (rgba(0,0,0,0.10))
- **Hover background:** `--color-surface-2` (#eef0f3)

### 4.2 Text Colors
- **Brand/Primary:** `--color-text-primary` (#111827)
- **Nav links:** `--color-text-secondary` (#374151)
- **Muted/Inactive:** `--color-text-muted` (#6b7280)

### 4.3 Accent Colors
- **Active link:** `--color-accent` (#2563eb)
- **Hover:** `--color-accent-hover` (#1d4ed8)
- **Focus ring:** `--color-accent` (#2563eb)

---

## 5. Spacing & Dimensions

### 5.1 Navbar Height
```
Desktop: 64px (--header-height)
Mobile: 64px (same — no change)
```

### 5.2 Horizontal Padding
```
Desktop (≥1280px): 24px (--space-6)
Tablet (768-1279px): 20px (--space-5)
Mobile (<768px): 16px (--space-4)
```

### 5.3 Internal Gaps
```
Logo to Brand text: 12px (--space-3)
Nav links gap: 8px (--space-2)
Action items gap: 12px (--space-3)
```

### 5.4 Logo Dimensions
```
Width: 32px
Height: 32px
Border-radius: var(--radius-md) — 8px (if background)
```

### 5.5 Icon Buttons
```
Size: 36px × 36px (--control-md)
Icon size: 20px
Border-radius: var(--radius-md) — 8px
Padding: 8px
```

### 5.6 User Avatar
```
Size: 36px × 36px
Border-radius: var(--radius-full) — 9999px (circle)
Border: 2px solid var(--color-border)
```

---

## 6. Component States

### 6.1 Navigation Link States

**Default (Inactive)**
```
Color: var(--color-text-secondary) — #374151
Font-weight: var(--weight-medium) — 500
Background: transparent
Padding: 8px 12px (--space-2 --space-3)
Border-radius: var(--radius-md) — 8px
Cursor: pointer
```

**Hover**
```
Color: var(--color-text-primary) — #111827
Background: var(--color-surface-2) — #eef0f3
Transition: all var(--duration-fast) var(--ease-out) — 150ms
```

**Active (Current Page)**
```
Color: var(--color-accent) — #2563eb
Font-weight: var(--weight-semibold) — 600
Background: var(--color-accent-subtle) — #eff6ff
Border-bottom: 2px solid var(--color-accent) — #2563eb (optional)
```

**Focus-Visible**
```
Box-shadow: var(--focus-ring)
  0 0 0 2px var(--color-surface-0),
  0 0 0 4px var(--color-accent)
Outline: none
```

**Pressed**
```
Background: var(--color-surface-3) — #e3e6eb
Transform: scale(0.98)
Transition: transform 100ms var(--ease-out)
```

### 6.2 Icon Button States

**Default**
```
Color: var(--color-text-muted) — #6b7280
Background: transparent
Border: none
```

**Hover**
```
Color: var(--color-text-primary) — #111827
Background: var(--color-surface-2) — #eef0f3
```

**Active/Pressed**
```
Background: var(--color-surface-3) — #e3e6eb
```

**Focus-Visible**
```
Box-shadow: var(--focus-ring)
```

### 6.3 Mobile Menu Toggle States

**Closed (Default)**
```
Icon: Hamburger menu (three horizontal lines)
Color: var(--color-text-secondary)
```

**Open**
```
Icon: X (close icon)
Color: var(--color-accent)
Background: var(--color-accent-subtle)
```

---

## 7. Responsive Behavior

### 7.1 Desktop (≥ 768px)
```
Layout: [Logo + Brand] [Nav Links] [Search + Avatar]
Nav links: Visible, horizontal flex
Mobile menu toggle: Hidden (display: none)
Max-width: 1280px, centered
```

### 7.2 Tablet (768px - 1023px)
```
Layout: Same as desktop
Padding: Reduced to 20px (--space-5)
Nav links: May reduce gap to --space-1 (4px) if needed
```

### 7.3 Mobile (< 768px)
```
Layout: [Logo + Brand] [Menu Toggle + Avatar]
Nav links: Hidden in navbar
Mobile menu toggle: Visible (display: flex)
Search: Moved to mobile menu or hidden
Padding: 16px (--space-4)

Mobile Menu (Dropdown):
- Position: absolute, top: 64px, left: 0, right: 0
- Background: var(--color-surface-0)
- Border-top: 1px solid var(--color-border)
- Box-shadow: var(--shadow-2)
- Padding: var(--space-4) — 16px
- Nav links: Stacked vertically, full-width
- Gap: var(--space-1) — 4px
- Animation: slide-down, var(--duration-normal) var(--ease-out)
```

---

## 8. Logo Specification

### 8.1 Logo Icon
```
Type: SVG icon or Unicode character
Recommended: 📋 (clipboard emoji) or custom kanban icon
Size: 32×32px
Color: var(--color-accent) — #2563eb
Background: var(--color-accent-subtle) — #eff6ff (optional)
Padding: 6px (if background)
Border-radius: var(--radius-md) — 8px
```

### 8.2 Brand Text
```
Text: "Kanban Board"
Alternative (short): "Kanban" (mobile < 390px)
Font: var(--font-sans) — Inter
Size: var(--text-lg) — 20px
Weight: var(--weight-bold) — 700
Color: var(--color-text-primary) — #111827
```

---

## 9. Navigation Links

### 9.1 Link Structure
Each link is a clickable element with:
- Text label
- Optional icon (16px, left of text, gap: 6px)
- Padding: 8px 12px
- Border-radius: 8px

### 9.2 Recommended Links
1. **Dashboard** — Overview/home
2. **Boards** — Kanban boards list (active)
3. **Analytics** — Reports/metrics (future)

### 9.3 Active Link Indicator
```
Method 1 (Recommended): Background + color change
- Background: var(--color-accent-subtle)
- Color: var(--color-accent)
- Font-weight: var(--weight-semibold)

Method 2 (Alternative): Bottom border
- Border-bottom: 2px solid var(--color-accent)
- Position: relative, bottom: -1px (extends below navbar)
```

---

## 10. Action Items

### 10.1 Search Button
```
Type: Icon button
Icon: Magnifying glass (search icon)
Size: 36×36px (--control-md)
Icon size: 20px
Color: var(--color-text-muted)
Hover: var(--color-text-primary), bg: var(--color-surface-2)
Action: Opens search modal or navigates to search page
ARIA: aria-label="Search"
```

### 10.2 User Avatar
```
Type: Button (clickable)
Size: 36×36px
Border-radius: var(--radius-full) — circle
Border: 2px solid var(--color-border)
Image: User profile photo or initials
Fallback: Initials on var(--color-accent-subtle) background
Hover: Border color → var(--color-accent)
Action: Opens user menu dropdown
ARIA: aria-label="User menu" aria-haspopup="true"
```

### 10.3 Mobile Menu Toggle
```
Type: Icon button (mobile only, < 768px)
Icon: Hamburger (☰) when closed, X when open
Size: 36×36px
Color: var(--color-text-secondary)
Hover: var(--color-text-primary), bg: var(--color-surface-2)
Active (menu open): color: var(--color-accent), bg: var(--color-accent-subtle)
ARIA: aria-label="Menu" aria-expanded="false|true"
```

---

## 11. Interaction & Motion

### 11.1 Transitions
```
All interactive elements:
  transition: all var(--duration-fast) var(--ease-out);
  /* 150ms cubic-bezier(0.16, 1, 0.3, 1) */

Properties to transition:
- background-color
- color
- box-shadow
- transform (scale on press)
```

### 11.2 Mobile Menu Animation
```
Enter (slide down):
  transform: translateY(-8px) → translateY(0)
  opacity: 0 → 1
  duration: var(--duration-normal) — 200ms
  easing: var(--ease-out)

Exit (slide up):
  transform: translateY(0) → translateY(-8px)
  opacity: 1 → 0
  duration: var(--duration-fast) — 150ms
  easing: var(--ease-out)
```

### 11.3 Reduced Motion
```
@media (prefers-reduced-motion: reduce) {
  All transitions: duration 0ms
  Mobile menu: no transform animation, opacity only
}
```

---

## 12. Accessibility

### 12.1 Semantic HTML
```html
<nav role="navigation" aria-label="Main navigation">
  <div class="navbar-container">
    <a href="/" class="logo-link" aria-label="Kanban Board home">
      <!-- Logo + Brand -->
    </a>
    <ul class="nav-links" role="list">
      <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
      <li><a href="/boards">Boards</a></li>
      <li><a href="/analytics">Analytics</a></li>
    </ul>
    <div class="actions">
      <button aria-label="Search" class="icon-btn">...</button>
      <button aria-label="User menu" aria-haspopup="true">...</button>
    </div>
  </div>
</nav>
```

### 12.2 Keyboard Navigation
```
Tab order:
1. Logo/Brand link
2. Navigation links (left to right)
3. Search button
4. User avatar button
5. Mobile menu toggle (mobile only)

Focus-visible: 2px accent ring with 2px white offset
Enter/Space: Activates links and buttons
Escape: Closes mobile menu (when open)
```

### 12.3 ARIA Attributes
```
- aria-label on icon-only buttons
- aria-current="page" on active nav link
- aria-expanded="true|false" on mobile menu toggle
- aria-haspopup="true" on user avatar (if dropdown)
- role="navigation" on <nav>
```

### 12.4 Color Contrast (WCAG AA)
```
✅ Brand text (#111827) on white: 16.7:1
✅ Nav links (#374151) on white: 10.0:1
✅ Muted icons (#6b7280) on white: 4.6:1
✅ Active link (#2563eb) on white: 4.9:1
✅ White on accent (#2563eb): 4.9:1
```

---

## 13. Dark Mode

### 13.1 Color Overrides
```css
@media (prefers-color-scheme: dark) {
  Navbar background: var(--color-surface-0) — #161b22
  Border: var(--color-border) — rgba(255,255,255,0.08)
  Brand text: var(--color-text-primary) — #e6edf3
  Nav links: var(--color-text-secondary) — #c9d1d9
  Hover bg: var(--color-surface-2) — #262d37
  Active link: var(--color-accent) — #3b82f6 (lighter blue)
  Active bg: var(--color-accent-subtle) — #0d1f3c
  Icon color: var(--color-text-muted) — #8b949e
  Shadow: var(--shadow-1) — darker, more pronounced
}
```

### 13.2 Avatar Border
```
Light mode: 2px solid rgba(0,0,0,0.10)
Dark mode: 2px solid rgba(255,255,255,0.08)
```

---

## 14. Component Variants

### 14.1 Default Navbar (Implemented First)
- Logo + Brand text
- 3 navigation links (Dashboard, Boards, Analytics)
- Search icon button
- User avatar
- Mobile menu toggle

### 14.2 Future Variants (Out of Scope)
- **With Search Bar:** Expanded search input in navbar (desktop)
- **With Notifications:** Bell icon with badge count
- **With Breadcrumbs:** Below navbar, secondary navigation
- **Transparent:** For landing pages (background: transparent, no border)

---

## 15. Implementation Notes

### 15.1 CSS Modules
```
File: src/components/Navbar/Navbar.module.css

Classes:
.navbar — outer container (sticky, shadow, border)
.container — inner max-width container
.logoSection — left section (logo + brand)
.logo — logo icon
.brand — brand text
.navLinks — center section (desktop nav)
.navLink — individual link
.navLinkActive — active link modifier
.actions — right section (search, avatar, menu)
.iconBtn — icon button base
.avatar — user avatar
.mobileMenuToggle — hamburger/close button
.mobileMenu — dropdown menu (mobile)
```

### 15.2 Component Props (TypeScript)
```typescript
interface NavbarProps {
  currentPath?: string;          // For active link highlighting
  userName?: string;              // For avatar fallback initials
  userAvatar?: string;            // Avatar image URL
  onSearchClick?: () => void;     // Search button handler
  onUserMenuClick?: () => void;   // Avatar click handler
  className?: string;             // Additional classes
}
```

### 15.3 Dependencies
```
- React 18+
- CSS Modules (built-in with Vite/CRA)
- lucide-react (for icons: Menu, X, Search)
- No additional libraries needed
```

### 15.4 Token Usage Checklist
✅ All colors from `var(--color-*)`  
✅ All spacing from `var(--space-*)`  
✅ All typography from `var(--text-*)` and `var(--weight-*)`  
✅ All radii from `var(--radius-*)`  
✅ All shadows from `var(--shadow-*)`  
✅ All transitions from `var(--duration-*)` and `var(--ease-out)`  
✅ Control height from `var(--control-md)`  
✅ Header height from `var(--header-height)`  
❌ No literal values in component CSS

---

## 16. Design Review Checklist

Before implementation, verify:

- [ ] **Hierarchy:** Brand is most prominent, nav links secondary, actions tertiary
- [ ] **Whitespace:** Consistent gaps from spacing scale (8/12/16/24px)
- [ ] **Typography:** Sizes and weights from type scale, no browser defaults
- [ ] **Color:** All values from tokens, contrast ≥ 4.5:1 for text
- [ ] **States:** Hover, focus, active, pressed defined for all interactive elements
- [ ] **Responsive:** Desktop, tablet, mobile layouts specified with breakpoints
- [ ] **Motion:** Transitions use token durations and easing, reduced-motion handled
- [ ] **Accessibility:** Semantic HTML, ARIA labels, keyboard navigation, focus ring
- [ ] **Dark mode:** All colors have dark mode overrides, contrast re-checked
- [ ] **Consistency:** Matches existing KanbanCard/KanbanColumn component patterns

---

## 17. Figma File Structure

### 17.1 Frames (Artboards)
1. **Desktop — Default State** (1280×64px)
2. **Desktop — Hover States** (1280×64px)
3. **Desktop — Active Link** (1280×64px)
4. **Desktop — Focus States** (1280×64px)
5. **Mobile — Closed Menu** (390×64px)
6. **Mobile — Open Menu** (390×300px)
7. **Dark Mode — Desktop** (1280×64px)
8. **Dark Mode — Mobile** (390×64px)
9. **Spacing Annotations** (1280×64px with redlines)
10. **Component Breakdown** (individual elements)

### 17.2 Components (Figma)
- `Navbar/Desktop` — main variant
- `Navbar/Mobile` — mobile variant
- `NavLink` — with Default/Hover/Active/Focus states
- `IconButton` — with Default/Hover/Active/Focus states
- `Avatar` — with image and initials variants
- `MobileMenu` — dropdown panel

### 17.3 Annotations
- Spacing values (px) with arrows
- Color tokens with hex values
- Typography specs (size/weight/color)
- Interaction state labels
- Responsive breakpoint markers

---

## 18. Assets Required

### 18.1 Icons (from lucide-react)
- `Menu` — hamburger menu (mobile)
- `X` — close menu (mobile)
- `Search` — search button
- `ChevronDown` — user menu dropdown indicator (optional)

### 18.2 Logo
- SVG icon (32×32px) or emoji 📋
- Scalable, single color (accent blue)
- Exported as `logo.svg` in `src/assets/`

### 18.3 Avatar Placeholder
- Default avatar image or initials generator
- Circular, 36×36px minimum
- Fallback: colored background with initials

---

## 19. Next Steps (Implementation)

1. **Frontend Developer** receives this spec
2. Create `src/components/Navbar/` directory
3. Implement `Navbar.tsx` and `Navbar.module.css`
4. Import icons from `lucide-react`
5. Add logo asset to `src/assets/`
6. Integrate into `App.tsx` (above `<KanbanBoard>`)
7. Test responsive behavior at 1280/768/390px
8. Test keyboard navigation and focus states
9. Verify dark mode rendering
10. Screenshot at desktop/mobile, light/dark for design review

---

## 20. Design Decisions & Rationale

### 20.1 Why 64px Height?
- Matches `--header-height` token already defined
- Comfortable touch target on mobile (≥44px)
- Proportional to 36px controls with 14px padding top/bottom
- Standard navbar height in Linear, Vercel, GitHub

### 20.2 Why Sticky Position?
- Keeps navigation accessible while scrolling through long boards
- Common pattern in task management apps
- Does not obscure content (transparent background avoided)

### 20.3 Why Center Navigation Links?
- Balanced layout, brand-centric
- Follows Linear/Vercel pattern
- Clear separation of logo, nav, actions
- Alternative (left-aligned nav) considered but less calm

### 20.4 Why Mobile Menu Instead of Bottom Nav?
- Consistent with desktop layout (same links, same order)
- Easier to maintain (one component, responsive variants)
- Bottom nav better for 5+ primary actions (not the case here)

### 20.5 Why No Search Bar in Navbar?
- Keeps navbar clean and uncluttered (calm direction)
- Search icon button opens modal/page (future implementation)
- Inline search bar would compete with nav links for space
- Can be added as variant later if needed

---

**End of Specification**

This document is the single source of truth for the Navbar component visual design. All measurements, colors, and behaviors are derived from the existing design token system in `src/tokens.css` and follow the "Linear/Vercel-calm" direction established in `DESIGN.md`.

**Designer:** Product Designer (AI)  
**Date:** November 16, 2026  
**Status:** ✅ Ready for Figma mockup and frontend implementation
