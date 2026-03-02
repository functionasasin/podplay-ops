# Design System — Philippine Freelance & Self-Employed Income Tax Optimizer

This document defines every visual design token: colors, typography, spacing, shadows, borders, motion, and breakpoints. All values are precise and implementation-ready. No tokens are approximate or aspirational.

---

## 1. Color Palette

### 1.1 Brand Colors

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `brand-600` | `#1D4ED8` | `29, 78, 216` | Primary CTA buttons, active nav links, focus rings |
| `brand-500` | `#3B82F6` | `59, 130, 246` | Hover state for primary buttons, selected radio/checkbox fill |
| `brand-400` | `#60A5FA` | `96, 165, 250` | Light accent, icon highlights on dark backgrounds |
| `brand-300` | `#93C5FD` | `147, 197, 253` | Progress bar fill (active step) |
| `brand-200` | `#BFDBFE` | `191, 219, 254` | Chip/badge background for "Recommended" |
| `brand-100` | `#DBEAFE` | `219, 234, 254` | Info card background |
| `brand-50` | `#EFF6FF` | `239, 246, 255` | Hover row background in comparison tables |
| `brand-700` | `#1E40AF` | `30, 64, 175` | Active/pressed state for primary buttons |
| `brand-800` | `#1E3A8A` | `30, 58, 138` | Dark header links |
| `brand-900` | `#1E3A7B` | `30, 58, 123` | Footer text, rarely used |

### 1.2 Semantic Colors — Success

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `success-600` | `#16A34A` | `22, 163, 74` | "Optimal regime" green badge, savings amount text |
| `success-500` | `#22C55E` | `34, 197, 94` | Success toast border, checkmark icons |
| `success-200` | `#BBF7D0` | `187, 247, 208` | Success alert background |
| `success-100` | `#DCFCE7` | `220, 252, 231` | Success card light background |
| `success-700` | `#15803D` | `21, 128, 61` | Success text in alerts (WCAG AA on `success-100`) |

### 1.3 Semantic Colors — Warning

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `warning-600` | `#D97706` | `217, 119, 6` | Advisory cards (WARN_* codes), "review recommended" text |
| `warning-500` | `#F59E0B` | `245, 158, 11` | Warning icon fill |
| `warning-200` | `#FDE68A` | `253, 230, 138` | Warning alert background |
| `warning-100` | `#FEF3C7` | `254, 243, 199` | Warning card light background |
| `warning-700` | `#B45309` | `180, 83, 9` | Warning text on `warning-100` (WCAG AA) |

### 1.4 Semantic Colors — Error/Danger

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `danger-600` | `#DC2626` | `220, 38, 38` | Form field error borders, error text |
| `danger-500` | `#EF4444` | `239, 68, 68` | Error icon fill, destructive action buttons |
| `danger-200` | `#FECACA` | `254, 202, 202` | Error alert background |
| `danger-100` | `#FEF2F2` | `254, 242, 242` | Error card light background |
| `danger-700` | `#B91C1C` | `185, 28, 28` | Error text on `danger-100` (WCAG AA) |

### 1.5 Semantic Colors — Info

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `info-600` | `#0284C7` | `2, 132, 199` | Manual-review-flag blue badges |
| `info-500` | `#0EA5E9` | `14, 165, 233` | Info icon fill |
| `info-200` | `#BAE6FD` | `186, 230, 253` | Info alert background |
| `info-100` | `#E0F2FE` | `224, 242, 254` | Info card light background |
| `info-700` | `#0369A1` | `3, 105, 161` | Info text on `info-100` (WCAG AA) |

### 1.6 Neutral / Gray Scale

| Token Name | Hex | RGB | Usage |
|---|---|---|---|
| `neutral-950` | `#0C0A09` | `12, 10, 9` | Rarely used, maximum dark |
| `neutral-900` | `#1C1917` | `28, 25, 23` | Primary body text (headings) |
| `neutral-800` | `#292524` | `41, 37, 36` | Secondary body text, paragraphs |
| `neutral-700` | `#44403C` | `68, 64, 60` | Muted body text, captions |
| `neutral-600` | `#57534E` | `87, 83, 78` | Placeholder text, disabled labels |
| `neutral-500` | `#78716C` | `120, 113, 108` | Icon color (inactive) |
| `neutral-400` | `#A8A29E` | `168, 162, 158` | Disabled text, subtle borders |
| `neutral-300` | `#D6D3D1` | `214, 211, 209` | Input borders (default), divider lines |
| `neutral-200` | `#E7E5E4` | `231, 229, 228` | Card borders, table borders |
| `neutral-100` | `#F5F5F4` | `245, 245, 244` | Table row hover, subtle backgrounds |
| `neutral-50` | `#FAFAF9` | `250, 250, 249` | Page background, off-white |
| `neutral-0` | `#FFFFFF` | `255, 255, 255` | Card/panel background, white |

### 1.7 Philippine Peso / Tax-Specific Highlight Colors

| Token Name | Hex | Usage |
|---|---|---|
| `peso-savings` | `#059669` | The "You save ₱X" amount in the results screen — distinct from generic success |
| `peso-tax-due` | `#7C3AED` | Tax-due amount display — purple to distinguish from error red |
| `regime-optimal` | `#16A34A` | Optimal regime row highlight background (same as `success-600` text) |
| `regime-optimal-bg` | `#F0FDF4` | Optimal regime row background fill |
| `regime-suboptimal` | `#78716C` | Non-optimal regime rows (neutral-500 text) |
| `regime-ineligible` | `#E7E5E4` | Ineligible regime row background (neutral-200) |

---

## 2. Typography

### 2.1 Font Families

| Token | Value | Fallback Stack | Usage |
|---|---|---|---|
| `font-sans` | `'Inter'` | `'Helvetica Neue', Arial, sans-serif` | All UI text, labels, body copy |
| `font-mono` | `'JetBrains Mono'` | `'Fira Code', 'Courier New', monospace` | Peso amounts (₱ values), tax computations, numeric fields |
| `font-display` | `'Inter'` | `'Helvetica Neue', Arial, sans-serif` | Hero headings (same family, heavier weight) |

**Inter** is loaded from Google Fonts at weights 400, 500, 600, 700, 800. JetBrains Mono is loaded at weights 400, 500.

### 2.2 Type Scale

| Token | Size (rem) | Size (px) | Line Height | Weight | Usage |
|---|---|---|---|---|---|
| `text-xs` | `0.75rem` | `12px` | `1rem (16px)` | 400 | Microcopy, form hint text, footnotes |
| `text-sm` | `0.875rem` | `14px` | `1.25rem (20px)` | 400 | Secondary labels, table cells, captions |
| `text-base` | `1rem` | `16px` | `1.5rem (24px)` | 400 | Body text, input labels, descriptions |
| `text-lg` | `1.125rem` | `18px` | `1.75rem (28px)` | 400 | Subheadings within cards |
| `text-xl` | `1.25rem` | `20px` | `1.75rem (28px)` | 600 | Card section headings, step titles |
| `text-2xl` | `1.5rem` | `24px` | `2rem (32px)` | 700 | Wizard step headings, results primary label |
| `text-3xl` | `1.875rem` | `30px` | `2.25rem (36px)` | 700 | Page section headings |
| `text-4xl` | `2.25rem` | `36px` | `2.5rem (40px)` | 800 | Landing page sub-headlines |
| `text-5xl` | `3rem` | `48px` | `3.5rem (56px)` | 800 | Landing page hero headline (desktop) |
| `text-6xl` | `3.75rem` | `60px` | `4rem (64px)` | 800 | Large tax savings display in results |

### 2.3 Special Typographic Styles

| Name | Specs | Usage |
|---|---|---|
| `peso-large` | JetBrains Mono, 3rem, weight 700, color `peso-tax-due` | Large tax-due amount in results |
| `peso-savings-large` | JetBrains Mono, 2.25rem, weight 700, color `peso-savings` | Large savings amount in results |
| `peso-inline` | JetBrains Mono, 1rem, weight 500, color `neutral-900` | Peso values inside table cells and form fields |
| `label-required` | Inter, 0.875rem, weight 500, after-content: `*`, color `danger-600` | Required field indicator asterisk |
| `form-hint` | Inter, 0.75rem, weight 400, color `neutral-600` | Helper text under input fields |
| `table-header` | Inter, 0.75rem, weight 600, UPPERCASE, letter-spacing 0.05em, color `neutral-700` | Table column headers |
| `step-counter` | Inter, 0.875rem, weight 700, color `brand-600` | "Step 2 of 5" labels |

---

## 3. Spacing Scale

All spacing uses a base-4 scale. Values below are in both `px` and `rem` (base 16px).

| Token | px | rem | Typical Usage |
|---|---|---|---|
| `space-0` | `0px` | `0rem` | Zero spacing |
| `space-0.5` | `2px` | `0.125rem` | Micro spacing, icon padding |
| `space-1` | `4px` | `0.25rem` | Tight spacing between related icons |
| `space-1.5` | `6px` | `0.375rem` | Input internal vertical padding (mobile) |
| `space-2` | `8px` | `0.5rem` | Between badge text and border, icon+text gap |
| `space-2.5` | `10px` | `0.625rem` | Input vertical padding (desktop) |
| `space-3` | `12px` | `0.75rem` | Between stacked labels and inputs |
| `space-4` | `16px` | `1rem` | Standard component internal padding |
| `space-5` | `20px` | `1.25rem` | Between form fields vertically |
| `space-6` | `24px` | `1.5rem` | Card internal padding (mobile) |
| `space-7` | `28px` | `1.75rem` | Step header bottom margin |
| `space-8` | `32px` | `2rem` | Card internal padding (desktop), section spacing |
| `space-10` | `40px` | `2.5rem` | Between wizard step sections |
| `space-12` | `48px` | `3rem` | Between major page sections (mobile) |
| `space-16` | `64px` | `4rem` | Between major page sections (desktop) |
| `space-20` | `80px` | `5rem` | Landing page hero vertical padding (mobile) |
| `space-24` | `96px` | `6rem` | Landing page hero vertical padding (desktop) |
| `space-32` | `128px` | `8rem` | Maximum section separation on landing page |

---

## 4. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-none` | `0px` | Sharp corners (rarely used — table inner cells) |
| `radius-sm` | `4px` | Small UI elements: badges, chips, tags |
| `radius-base` | `6px` | Input fields, select dropdowns |
| `radius-md` | `8px` | Buttons, small cards |
| `radius-lg` | `12px` | Card panels, modal dialogs |
| `radius-xl` | `16px` | Large cards on landing page, feature panels |
| `radius-2xl` | `24px` | Hero illustration container, promotional cards |
| `radius-full` | `9999px` | Circular avatars, pill-shaped progress steps |

---

## 5. Shadows

| Token | CSS Box Shadow | Usage |
|---|---|---|
| `shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Input fields at rest |
| `shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)` | Card default state |
| `shadow-base` | `0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)` | Dropdown menus, tooltips |
| `shadow-md` | `0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)` | Wizard card on desktop |
| `shadow-lg` | `0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.10)` | Modal dialog |
| `shadow-xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Results comparison card |
| `shadow-focus` | `0 0 0 3px rgba(59,130,246,0.45)` | Focus ring for interactive elements |
| `shadow-focus-danger` | `0 0 0 3px rgba(220,38,38,0.35)` | Focus ring when field has error |
| `shadow-none` | `none` | Flat cards (table rows) |

---

## 6. Border Widths

| Token | Value | Usage |
|---|---|---|
| `border-0` | `0px` | No border |
| `border-1` | `1px` | Default border for inputs, cards, table cells |
| `border-2` | `2px` | Active/focused input borders, selected card outline |
| `border-4` | `4px` | Left-side accent border for info/warning/error/success callout boxes |

---

## 7. Transition & Motion

| Token | Value | Usage |
|---|---|---|
| `transition-fast` | `150ms ease-in-out` | Button hover color changes, checkbox ticks |
| `transition-base` | `200ms ease-in-out` | Input border color on focus, tooltip fade |
| `transition-slow` | `300ms ease-in-out` | Accordion expand/collapse, tab switch |
| `transition-results` | `400ms ease-out` | Results panel appear animation (slide-up + fade) |
| `transition-none` | `none` | Disabled for users with `prefers-reduced-motion` |

**Reduced motion rule**: All animations and transitions must use `@media (prefers-reduced-motion: reduce)` to set `transition: none` and `animation: none`. The UI must be fully functional without motion.

---

## 8. Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `z-base` | `0` | Default document flow |
| `z-raised` | `10` | Sticky wizard step header |
| `z-dropdown` | `100` | Dropdown menus, autocomplete panels |
| `z-sticky` | `200` | Sticky header bar on scroll |
| `z-overlay` | `300` | Modal backdrop |
| `z-modal` | `400` | Modal dialog content |
| `z-toast` | `500` | Toast notification stack |
| `z-tooltip` | `600` | Tooltips (must render above modals for inline help) |

---

## 9. Grid & Layout

### 9.1 Container Widths

| Breakpoint | Container Max-Width | Horizontal Padding |
|---|---|---|
| Default (mobile) | `100%` | `space-4` (16px) |
| `sm` (640px+) | `100%` | `space-6` (24px) |
| `md` (768px+) | `100%` | `space-8` (32px) |
| `lg` (1024px+) | `768px` | `space-8` (32px) |
| `xl` (1280px+) | `960px` | `space-8` (32px) |
| `2xl` (1536px+) | `1120px` | `space-8` (32px) |

### 9.2 Grid Columns

The layout uses a 12-column CSS Grid system.

| Context | Columns Used | Gap |
|---|---|---|
| Wizard step (single column) | 12 / 12 | `space-6` |
| Wizard step (two-column fields) | 6 / 6 | `space-6` |
| Results comparison table | 12 / 12 | `space-4` |
| Landing page hero (desktop) | 7 text / 5 illustration | `space-8` |
| Landing page features (desktop) | 4 / 4 / 4 | `space-8` |
| CPA dashboard sidebar + main | 3 sidebar / 9 main | `space-6` |

---

## 10. Iconography

### 10.1 Icon Library

**Library**: Heroicons (MIT license, open source). Version: 2.x. Style: Outline for primary icons, Solid for filled indicator icons.

**Import method**: SVG sprite or direct SVG component (no icon font — performance and accessibility reasons).

### 10.2 Icon Sizes

| Token | px | Usage |
|---|---|---|
| `icon-xs` | `12px` | Inline icon next to text (e.g., info "ℹ" next to field) |
| `icon-sm` | `16px` | Form field prefix/suffix icon, badge icon |
| `icon-base` | `20px` | Nav icon, button icon, list icon |
| `icon-md` | `24px` | Card header icon, empty state secondary icon |
| `icon-lg` | `32px` | Feature section icon on landing page |
| `icon-xl` | `48px` | Empty state primary icon |
| `icon-2xl` | `64px` | Error/success page illustration placeholder |

### 10.3 Icon-to-Text Spacing

Icon used inline with text always has `gap: space-2` (8px) between icon and text. Icon and text are vertically centered using `align-items: center`.

### 10.4 Specific Icons Used

| Icon Name (Heroicons) | Where Used |
|---|---|
| `CheckCircle` (solid, success-600) | Optimal regime badge, success confirmation |
| `ExclamationTriangle` (solid, warning-600) | Advisory warnings (WARN codes) |
| `ExclamationCircle` (solid, danger-600) | Field validation errors |
| `InformationCircle` (solid, info-600) | Manual review flags, info tooltips |
| `ChevronRight` (outline, neutral-500) | Wizard step navigation, breadcrumb |
| `ChevronDown` (outline, neutral-500) | Accordion expand, select dropdown |
| `ArrowDownTray` (outline, brand-600) | PDF export button |
| `DocumentText` (solid, brand-600) | BIR form reference links |
| `Calculator` (outline, brand-600) | Compute/recalculate button icon |
| `UserPlus` (outline, neutral-700) | Registration CTA |
| `ArrowRightOnRectangle` (outline, neutral-700) | Login CTA |
| `Cog6Tooth` (outline, neutral-600) | Settings, CPA dashboard settings |
| `MagnifyingGlass` (outline, neutral-500) | Client search in CPA dashboard |
| `PlusCircle` (solid, brand-600) | Add new client (CPA dashboard) |
| `Trash` (outline, danger-600) | Delete computation |
| `PencilSquare` (outline, brand-600) | Edit saved computation |
| `ClipboardDocumentList` (solid, brand-600) | Computation history |
| `CalendarDays` (outline, brand-600) | Filing deadline calendar |
| `BanknotesIcon` (solid, peso-savings) | Savings amount display |
| `XMark` (outline, neutral-600) | Close modal, dismiss toast |
| `Bars3` (outline, neutral-700) | Mobile hamburger menu |

---

## 11. Focus Styles

All interactive elements must have a visible focus indicator. The default browser outline is replaced with a custom ring.

**Default focus ring**: `outline: 3px solid #3B82F6; outline-offset: 2px;`
This equals `shadow-focus` with a 2px offset from the element edge.

**Error-state focus ring**: `outline: 3px solid #DC2626; outline-offset: 2px;`
Applied to inputs that already show validation errors when they receive focus.

**Never** remove `:focus-visible` styles without replacing them. `outline: none` is prohibited without an alternative ring.

---

## 12. Print Styles

The results page must print cleanly for users who want a paper copy for their records.

| Rule | Value |
|---|---|
| Background colors | `@media print { background: white !important; color: black !important }` |
| Hide from print | Navigation bar, wizard step controls, save/share buttons, cookie banner |
| Show in print | Regime comparison table (all 3 rows), tax-due amounts, input summary, legal disclaimer |
| Font in print | Fallback to `Times New Roman, serif` for body text; monospace for peso amounts |
| Page size | A4 portrait, margins: 15mm all sides |
| Page breaks | Avoid page break inside `.results-card` and `.regime-comparison-table` |

---

## 13. Dark Mode

The platform supports a system-preference dark mode via `@media (prefers-color-scheme: dark)`. Dark mode uses the following overrides:

| Token (light) | Dark Mode Override Hex | Usage |
|---|---|---|
| `neutral-50` (page bg) | `#0F172A` (slate-900) | Page background |
| `neutral-0` (card bg) | `#1E293B` (slate-800) | Card background |
| `neutral-900` (primary text) | `#F8FAFC` (slate-50) | Primary text |
| `neutral-800` (body text) | `#E2E8F0` (slate-200) | Body text |
| `neutral-700` (muted text) | `#94A3B8` (slate-400) | Muted text |
| `neutral-300` (border) | `#334155` (slate-700) | Border color |
| `neutral-200` (card border) | `#1E293B` (slate-800) | Card border |
| `brand-600` (primary) | `#60A5FA` (blue-400) | Primary accent (lighter for dark bg) |
| `brand-100` (info bg) | `#1E3A5F` | Info card background (dark) |
| `success-100` (success bg) | `#14532D` | Success card background (dark) |
| `warning-100` (warning bg) | `#451A03` | Warning card background (dark) |
| `danger-100` (danger bg) | `#450A0A` | Error card background (dark) |
| `info-100` (info bg) | `#0C3054` | Info card background (dark) |
| `peso-savings` | `#4ADE80` (green-400) | Savings text (lighter on dark) |
| `peso-tax-due` | `#A78BFA` (violet-400) | Tax-due text (lighter on dark) |

Dark mode is opt-in via a toggle in the user menu (icon: `SunIcon` / `MoonIcon` from Heroicons). The preference is persisted to `localStorage` under key `ph-tax-color-scheme` and as a user account preference in the database column `users.color_scheme_preference` (values: `'system'`, `'light'`, `'dark'`; default: `'system'`).

---

## 14. Loading States

| State | Visual | Duration |
|---|---|---|
| Initial page load | Full-page spinner centered on `neutral-50` background. Spinner: 32px `brand-600` border-top spinner, 1.5s spin | Until first paint |
| Computation in progress | CTA button shows loading spinner inside button (16px white spinner), button text changes to "Computing…", button disabled | Until API response |
| Results loading | Skeleton placeholders for regime comparison table rows: 3 rows × animated gray shimmer. Skeleton shimmer: linear-gradient from `neutral-200` → `neutral-100` → `neutral-200`, 1.5s ease-in-out loop | Until computation result |
| PDF generating | Overlay on results card: `opacity: 0.7`, centered progress text "Generating PDF…" with spinner | Until PDF blob ready |
| Client list loading (CPA) | 5 skeleton rows in client table | Until API response |
| Navigation transition | None — instant (avoid unnecessary loading states between wizard steps) | Instant |

Spinner CSS: `border: 3px solid rgba(255,255,255,0.3); border-top-color: #FFFFFF; border-radius: 9999px; animation: spin 0.8s linear infinite;`

---

## 15. Elevation Hierarchy

Components are layered in this visual hierarchy from background (lowest) to foreground (highest):

1. Page background — `neutral-50`, no shadow
2. Table rows — `neutral-0`, `shadow-none`
3. Cards at rest — `neutral-0`, `shadow-sm`
4. Cards on hover — `neutral-0`, `shadow-base`
5. Active wizard card — `neutral-0`, `shadow-md`
6. Dropdown panel — `neutral-0`, `shadow-base`, `z-dropdown`
7. Sticky header — `neutral-0`, `shadow-sm`, `z-sticky`
8. Modal backdrop — `rgba(0,0,0,0.5)`, `z-overlay`
9. Modal dialog — `neutral-0`, `shadow-lg`, `z-modal`
10. Toast — `neutral-900` bg, white text, `shadow-xl`, `z-toast`
11. Tooltip — `neutral-900` bg, white text, `shadow-base`, `z-tooltip`
