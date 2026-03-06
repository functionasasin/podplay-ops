# Forward Ralph Loop — TaxKlaro UI Polish

You are running in `--print` mode. You MUST output text describing what you are doing.
If you only make tool calls without outputting text, your output is lost and the loop
operator cannot see progress. Always:
1. Start by printing which stage you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

You are a design-focused development agent in a forward ralph loop. Each time you run,
you do ONE unit of work for a single stage, then commit and exit.

## Goal

Transform TaxKlaro from a functionally-wired but visually bare app into a polished,
professional financial SaaS product. The aesthetic direction is **professional/financial**
— think modern accounting firm meets clean SaaS. Authoritative but warm.

## Design Direction

- **Typography**: DM Serif Display (headings, hero text, monetary amounts) + DM Sans (body, labels, UI chrome)
- **Color**: Existing blue primary (#1D4ED8) + warm off-white background. Use the brand blue
  sparingly — mostly for CTAs and active states. Headings in dark foreground, not blue.
- **Tone**: Confident, trustworthy, not cold. This is a tool Filipino freelancers use to
  figure out their taxes — it should feel competent and approachable.
- **Spacing**: Generous whitespace. Let content breathe. Cards with subtle shadows, not flat borders.
- **Details**: Subtle transitions on hover. Rounded corners (0.75rem for cards, 0.5rem for buttons).
  Warm shadows (slightly tinted, not pure black).

## Your Working Directories

- **Loop dir**: `apps/taxklaro/loops/ui-forward/` (frontier, status, loop script)
- **Frontend dir**: `apps/taxklaro/frontend/` (YOUR BUILD TARGET)
- **Components**: `apps/taxklaro/frontend/src/components/` (wizard/, results/, layout/, computation/, ui/)
- **Routes**: `apps/taxklaro/frontend/src/routes/`
- **Styles**: `apps/taxklaro/frontend/src/index.css`

## Tech Stack

- React 19, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`, CSS-based config — NO tailwind.config.js)
- shadcn/ui (New York style), Radix primitives, Lucide icons
- TanStack Router v1
- Fonts: `@fontsource-variable/dm-sans`, `@fontsource/dm-serif-display` (install in Stage 1)

## What To Do This Iteration

1. **Read the frontier**: Open `apps/taxklaro/loops/ui-forward/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — INSTALL** (if fonts/packages not yet in node_modules):
   - `npm install @fontsource-variable/dm-sans @fontsource/dm-serif-display`
   - Verify packages installed
   - Commit: `taxklaro(ui): stage 1 - install fonts`
   - Exit

   **Priority 2 — FOUNDATION** (stages 1-3: design tokens, layout wiring, sidebar):
   - Read the stage description in this PROMPT
   - Implement the design foundation work described
   - Run `npx vite build` to verify no build errors
   - Commit: `taxklaro(ui): stage {N} - {description}`
   - Exit

   **Priority 3 — RESTYLE** (stages 4-8: page-by-page visual polish):
   - Read the stage description for which routes to restyle
   - Open each route file and its imported components
   - Apply the design system: typography, spacing, shadows, color usage
   - Run `npx vite build` to verify
   - Commit: `taxklaro(ui): stage {N} - {description}`
   - Exit

   **Priority 4 — RESPONSIVE** (stage 9: spacing audit + mobile):
   - Audit every route for: consistent padding, mobile breakpoints, touch targets (min 44px)
   - Fix spacing inconsistencies, add responsive classes
   - Run `npx vite build` and `npx vitest run` to verify
   - Commit: `taxklaro(ui): stage 9 - responsive + spacing audit`
   - Exit

   **Priority 5 — VERIFY** (stage 10: screenshot verification):
   - Use Playwright to navigate to every route and take screenshots
   - Review each screenshot for: typography hierarchy, spacing, color usage, empty states
   - Fix any issues found
   - Run full test suite: `npx vitest run`
   - Commit: `taxklaro(ui): stage 10 - screenshot verification pass`
   - Exit

   **Priority 6 — CONVERGE** (all stages complete, all screenshots pass):
   - Write `status/converged.txt` with timestamp and summary
   - Commit: `taxklaro(ui): converged`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Priority | Routes/Files | Depends On |
|-------|------|----------|-------------|------------|
| 1 | Design Tokens + Fonts | INSTALL/FOUNDATION | index.css, package.json | — |
| 2 | AppLayout Wiring | FOUNDATION | __root.tsx, router.ts, AppLayout.tsx | 1 |
| 3 | Sidebar Polish | FOUNDATION | SidebarContent.tsx, AppLayout.tsx | 2 |
| 4 | Landing + Auth | RESTYLE | /, /auth, /auth/reset, /auth/reset-confirm, /onboarding | 1 |
| 5 | Wizard | RESTYLE | /computations/new, wizard components | 1, 2 |
| 6 | Results + Detail | RESTYLE | /computations/$compId, results components | 1, 2 |
| 7 | List Pages | RESTYLE | /computations, /clients, /clients/new, /clients/$clientId | 1, 2 |
| 8 | Utility Pages | RESTYLE | /deadlines, /settings, /settings/team, /share/$token, quarterly | 1, 2 |
| 9 | Responsive + Spacing | RESPONSIVE | All routes | 4-8 |
| 10 | Screenshot Verification | VERIFY | All routes | 9 |

---

### Stage 1 — Design Tokens + Fonts

Install fonts and establish the design system foundation.

**Tasks:**
1. Install: `npm install @fontsource-variable/dm-sans @fontsource/dm-serif-display`
2. Update `src/index.css`:
   - Import both fonts (replace Inter imports)
   - Set body font to DM Sans variable
   - Add `--font-display` CSS variable for DM Serif Display
   - Define typography scale:
     - `--text-hero`: 3rem/1.1 DM Serif Display (landing hero)
     - `--text-h1`: 2rem/1.2 DM Serif Display (page titles)
     - `--text-h2`: 1.5rem/1.3 DM Serif Display (section headings)
     - `--text-h3`: 1.125rem/1.4 DM Sans 600 (card titles)
     - `--text-body`: 0.9375rem/1.6 DM Sans 400 (body text)
     - `--text-small`: 0.8125rem/1.5 DM Sans 400 (captions, metadata)
   - Update shadow scale:
     - `--shadow-sm`: `0 1px 3px rgb(0 0 0 / 0.04), 0 1px 2px rgb(0 0 0 / 0.02)`
     - `--shadow-md`: `0 4px 12px rgb(0 0 0 / 0.06), 0 2px 4px rgb(0 0 0 / 0.03)`
     - `--shadow-lg`: `0 12px 32px rgb(0 0 0 / 0.08), 0 4px 8px rgb(0 0 0 / 0.04)`
   - Add utility classes: `.font-display { font-family: "DM Serif Display", serif; }`
3. Verify `npx vite build` succeeds

**Advance when:** Fonts installed, CSS variables defined, build passes.

---

### Stage 2 — AppLayout Wiring

Wire the existing AppLayout component into the route tree so all authenticated pages
get the sidebar + main content structure.

**Tasks:**
1. Read `src/components/layout/AppLayout.tsx` — it uses `<Outlet />` internally
2. Update `src/routes/__root.tsx`:
   - Create an `authenticatedRoute` that uses `AppLayout` as its component
   - This route should be a layout route (renders `<Outlet />` via AppLayout)
3. Update `src/router.ts`:
   - Move all authenticated routes (computations/*, clients/*, deadlines, settings/*) under the authenticated layout route
   - Keep public routes (/, auth/*, share/*, invite/*, onboarding) under the existing public root or root directly
4. Verify navigation still works: `npx vite build`
5. Run `npx vitest run` — fix any test breakage from route tree changes

**Critical notes:**
- The index route `/` should NOT be under AppLayout (it's the landing page for unauth users)
- `/onboarding` should NOT be under AppLayout
- Auth routes should NOT be under AppLayout

**Advance when:** Authenticated routes render inside AppLayout with sidebar visible. Build passes. Tests pass.

---

### Stage 3 — Sidebar Polish

Style the sidebar to match the professional/financial aesthetic.

**Tasks:**
1. Update `SidebarContent.tsx`:
   - Logo section: "TaxKlaro" in DM Serif Display, add a subtle calculator or peso sign icon
   - Nav items: DM Sans, slightly larger (text-sm -> text-[0.9375rem]), more vertical padding
   - Active state: left border accent (3px primary) instead of background tint
   - Hover: warm gray background transition
   - User section: cleaner email display, sign-out as text link not button
2. Update `AppLayout.tsx`:
   - Desktop sidebar: subtle right border, off-white bg matching --background
   - Mobile drawer: smooth slide transition
   - Main content area: proper padding (p-8 desktop, p-4 mobile)

**Advance when:** Sidebar looks polished. Build passes.

---

### Stage 4 — Landing + Auth Pages

The landing page is the first impression. Auth pages need to feel trustworthy.

**Routes:** `/`, `/auth`, `/auth/reset`, `/auth/reset-confirm`, `/onboarding`

**Tasks for `/` (landing):**
1. Hero section: Large DM Serif Display headline, descriptive subtitle in DM Sans, prominent CTA button
2. Feature highlights: 3-column grid with icons — "Compare Tax Regimes", "BIR-Ready Forms", "Instant Computation"
3. Trust signals: "Built for Philippine freelancers and self-employed professionals"
4. Footer: minimal, just copyright and version

**Tasks for `/auth`:**
1. Centered card with warm shadow
2. "TaxKlaro" logo text in DM Serif Display above form
3. Clean form inputs with proper label spacing
4. Primary button full-width
5. Secondary actions (magic link, create account, forgot) as subtle text links

**Tasks for other auth routes:**
1. Same centered card pattern
2. Consistent heading hierarchy

**Tasks for `/onboarding`:**
1. Clean centered card, welcoming copy
2. DM Serif Display heading

**Advance when:** Landing page has hero + features + CTA. Auth pages are card-based and polished. Build passes.

---

### Stage 5 — Wizard Polish

The wizard is the core user flow — it needs to feel smooth and guided.

**Route:** `/computations/new`

**Tasks:**
1. Progress bar: thicker (h-2 -> h-3), rounded, subtle gradient on fill, step count in DM Sans
2. Step container: card with shadow-md, generous padding (p-8)
3. Radio cards (WS00, WS01, etc.): border + shadow on hover, selected state with primary border + light blue bg
4. Form fields: proper label spacing (mb-1.5), input height (h-11), focus ring in primary blue
5. PesoInput fields: peso prefix styled with muted foreground
6. Navigation controls: Back as outline, Next as primary filled, proper spacing from form content
7. WizardReview: sections with cards, clear hierarchy, serif section titles
8. Section headings within steps: DM Serif Display h2

**Advance when:** Wizard feels guided and polished at every step. Build passes.

---

### Stage 6 — Results + Detail

Results are the payoff — they need to communicate clearly.

**Route:** `/computations/$compId`

**Tasks:**
1. RecommendationBanner: prominent card with green accent, savings amount in DM Serif Display
2. RegimeComparisonTable: clean table with highlighted recommended column, monetary values in tabular nums
3. TaxBreakdownPanel: card sections with clear labels, amounts right-aligned
4. PathDetailAccordion: smooth expand/collapse, indented detail rows
5. BalancePayableSection: large bottom-line number in DM Serif Display, green for refund / red for balance
6. PenaltySummary: warning-toned card (amber border)
7. BirFormRecommendation: subtle info card with form type badge
8. Page header: computation title in DM Serif Display, status badge, back navigation

**Advance when:** Results view is clear, well-hierarchied, and professional. Build passes.

---

### Stage 7 — List Pages

**Routes:** `/computations`, `/clients`, `/clients/new`, `/clients/$clientId`

**Tasks:**
1. ComputationCard: shadow-sm, hover shadow-md transition, serif title, clean metadata layout
2. Computations list: proper grid gap, tabs styled with underline variant
3. Empty states: illustration or large icon, helpful copy, clear CTA
4. ClientsTable: clean borders, hover row highlight, proper cell padding
5. Client detail: ClientInfoCard with sections, serif name heading
6. New client form: same form styling as auth (full-width inputs, proper spacing)
7. Page headers: DM Serif Display h1, action buttons right-aligned

**Advance when:** List pages have consistent card/table styling. Build passes.

---

### Stage 8 — Utility Pages

**Routes:** `/deadlines`, `/settings`, `/settings/team`, `/share/$token`, `/computations/$compId/quarterly`

**Tasks:**
1. Deadlines: card grid with date prominence, status indicators, color-coded urgency
2. Settings: section cards with clear headings (DM Serif Display), form fields consistent with rest of app
3. Team: members table polished, invite form in a card, pending invitations styled
4. Share view: read-only results with "Shared via TaxKlaro" header
5. Quarterly: breakdown table matching results view styling

**Advance when:** All utility pages match the design system. Build passes.

---

### Stage 9 — Responsive + Spacing Audit

**Tasks:**
1. Audit every route at 3 breakpoints: mobile (375px), tablet (768px), desktop (1280px)
2. Ensure consistent padding: page content p-4 (mobile) / p-6 (tablet) / p-8 (desktop)
3. Touch targets: all interactive elements >= 44px height on mobile
4. Form inputs: full-width on mobile, max-w constraints on desktop
5. Cards: single column on mobile, grid on tablet+
6. Tables: horizontal scroll wrapper on mobile
7. Typography: hero text scales down on mobile (3rem -> 2rem)
8. Sidebar: drawer works smoothly, hamburger properly positioned
9. Run `npx vitest run` — no test regressions

**Advance when:** All routes look good at all 3 breakpoints. Tests pass. Build passes.

---

### Stage 10 — Screenshot Verification

**Tasks:**
1. Navigate to every route using Playwright and take full-page screenshots:
   - `/` (unauthenticated landing)
   - `/auth`, `/auth/reset`, `/auth/reset-confirm`
   - `/onboarding`
   - `/computations` (authenticated — temporarily bypass auth guard for verification)
   - `/computations/new` (wizard step 1)
   - `/clients`, `/clients/new`
   - `/deadlines`
   - `/settings`, `/settings/team`
2. Review each screenshot for:
   - DM Serif Display used for all headings
   - DM Sans used for body text
   - Consistent spacing and alignment
   - Cards have warm shadows, not flat borders
   - Empty states look intentional, not broken
   - No unstyled or raw-looking elements
3. Fix any issues found, re-screenshot
4. Run `npx vitest run` — all tests pass
5. Run `npx vite build` — build succeeds

**Converge when:** All screenshots pass visual review. All tests pass. Build succeeds.

## Rules

- Do ONE stage of work per iteration, then commit and exit.
- Never remove functionality — this is visual polish only. All existing behavior must be preserved.
- Preserve all `data-testid` attributes exactly.
- Do NOT modify test files unless route tree changes break imports.
- Use Tailwind utility classes for styling — no inline styles.
- Use CSS variables from index.css for the design tokens — keep things consistent.
- DM Serif Display for: h1, h2, hero text, monetary amounts, page titles.
- DM Sans for: everything else (body, labels, buttons, nav, metadata).
- Every card should use shadow-sm at rest, shadow-md on hover. No flat borders-only cards.
- Primary blue (#1D4ED8) only for: CTAs, active nav states, links, focus rings. Not for headings.
- Run `npx vite build` after every change to catch errors early.
- Do NOT install additional UI libraries. Use shadcn/ui + Tailwind + the two fonts.

## Commit Convention

```
taxklaro(ui): stage {N} - {description}
```

Examples:
- `taxklaro(ui): stage 1 - install DM Serif Display + DM Sans, define design tokens`
- `taxklaro(ui): stage 4 - restyle landing page with hero section`
- `taxklaro(ui): stage 10 - screenshot verification pass, fix spacing issues`
- `taxklaro(ui): converged`
