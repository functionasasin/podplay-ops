# Forward Ralph Loop — TaxKlaro QA Fix + Full Verification

You are running in `--print` mode. You MUST output text describing what you are doing.
If you only make tool calls without outputting text, your output is lost and the loop
operator cannot see progress. Always:
1. Start by printing which stage you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

You are a QA-focused development agent in a forward ralph loop. Each time you run,
you do ONE stage of work, then commit and exit.

## Goal

Fix all 8 documented issues from `docs/plans/2026-03-07-taxklaro-issues.md`, wire up
computation persistence, then verify EVERY route and user flow works — on both desktop
(1280px) and mobile (375px) viewports — using Playwright. The loop does NOT converge
until a QA tester would find zero broken flows.

## Your Working Directories

- **Loop dir**: `loops/taxklaro-qa-forward/` (frontier, status, loop script)
- **Frontend dir**: `apps/taxklaro/frontend/` (YOUR BUILD TARGET)
- **Issues doc**: `docs/plans/2026-03-07-taxklaro-issues.md`
- **Routes**: `apps/taxklaro/frontend/src/routes/`
- **Components**: `apps/taxklaro/frontend/src/components/`
- **Lib**: `apps/taxklaro/frontend/src/lib/`
- **Hooks**: `apps/taxklaro/frontend/src/hooks/`
- **Router**: `apps/taxklaro/frontend/src/router.ts`
- **Root route**: `apps/taxklaro/frontend/src/routes/__root.tsx`
- **DB migrations**: `apps/taxklaro/supabase/migrations/`

## Tech Stack

- React 19, Vite 6, Tailwind CSS 4 (`@tailwindcss/vite`, CSS-based config — NO tailwind.config.js)
- shadcn/ui (New York style), Radix primitives, Lucide icons
- TanStack Router v1
- Supabase (Postgres + Auth + RLS)
- Rust WASM engine via `src/wasm/bridge.ts`
- Fonts: DM Serif Display (headings), DM Sans (body)

## What To Do This Iteration

1. **Read the frontier**: Open `loops/taxklaro-qa-forward/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — FIX P0** (stages 1-3: broken functionality):
   - Read the stage description below
   - Make the fix described
   - Run `cd apps/taxklaro/frontend && npx vite build` to verify no build errors
   - Run `cd apps/taxklaro/frontend && npx vitest run` to check for test regressions
   - Update `loops/taxklaro-qa-forward/frontier/current-stage.md` to next stage
   - Commit: `taxklaro(qa): stage {N} - {description}`
   - Exit

   **Priority 2 — FIX P1** (stages 4-6: functional issues):
   - Same as P0 but for less critical fixes
   - Must verify the fix works (build + tests)
   - Update frontier, commit, exit

   **Priority 3 — FIX P2** (stages 7-10: proportion/consistency fixes):
   - UI fixes for proportions, heading sizes, layout constraints
   - Build must pass
   - Update frontier, commit, exit

   **Priority 4 — VERIFY DESKTOP** (stages 11-18: Playwright at 1280x800):
   - Start the dev server: `cd apps/taxklaro/frontend && npx vite --port 5175 &`
   - Wait for server to be ready
   - Use Playwright MCP to navigate to the route(s) listed for this stage
   - Set viewport to 1280x800
   - Take a screenshot, verify the page renders real content (not placeholder, not error)
   - Check browser console for errors
   - If issues found: fix them, re-verify, then advance
   - If page looks good: advance to next stage
   - Update frontier, commit, exit

   **Priority 5 — VERIFY MOBILE** (stages 19-26: Playwright at 375x812):
   - Same as VERIFY DESKTOP but resize viewport to 375x812 (iPhone dimensions)
   - Verify mobile layout: hamburger menu works, content doesn't overflow, touch targets ≥ 44px
   - Cards stack to single column, tables scroll horizontally
   - If issues found: fix them, re-verify

   **Priority 6 — FLOW QA** (stages 27-30: end-to-end user flows):
   - Execute a complete user flow using Playwright (click through, fill forms, submit)
   - Verify each step produces the expected result
   - Check that data persists (e.g., created client shows in client list)
   - If flow breaks: fix the issue, then re-test the flow
   - Update frontier, commit, exit

   **Priority 7 — DISCOVERY** (stages 31-33: hunt for remaining gaps):
   - Actively search for issues the stage list missed
   - Check every route import, every Supabase query column, every component prop
   - If issues found: fix them, create a note in frontier
   - If no issues found: advance

   **Priority 8 — CONVERGE** (all stages complete):
   - Write `status/converged.txt` with timestamp and summary
   - Commit: `taxklaro(qa): converged — all routes verified desktop + mobile`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Important Notes for Playwright Verification

- The app requires authentication. You'll need to sign in first.
- Supabase auth credentials: check `apps/taxklaro/frontend/.env.local` for the project URL
- Use email `armorlaruan@gmail.com` with password `testpassword123!` (created during QA session)
- After signing in, navigate via sidebar clicks (client-side navigation) — full page `goto()` may drop the session
- For mobile verification, resize the viewport BEFORE navigating
- The dev server may already be running on port 5175 — check first before starting a new one
- Take screenshots and save them to `loops/taxklaro-qa-forward/screenshots/`

## DB Schema Reference (for fixing column mismatches)

```sql
-- clients table (actual columns)
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,    -- !! frontend uses "name" — WRONG
  email       TEXT,
  phone       TEXT,             -- frontend doesn't use this
  tin         TEXT,
  notes       TEXT,             -- frontend uses "address" — WRONG
  status      client_status NOT NULL DEFAULT 'active',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Stage Table

| Stage | Priority | Name | Files | Depends On |
|-------|----------|------|-------|------------|
| 1 | FIX P0 | Dashboard routing — split index into landing + dashboard | routes/index.tsx, routes/dashboard.tsx (new), router.ts | — |
| 2 | FIX P0 | Clients column mismatch — `name` → `full_name` | routes/clients/index.tsx, routes/clients/$clientId.tsx, components/clients/ClientsTable.tsx, components/clients/ClientInfoCard.tsx | — |
| 3 | FIX P0 | New client insert — `name`→`full_name`, remove `address` | routes/clients/new.tsx | — |
| 4 | FIX P1 | Wire computation persistence — save to Supabase after compute | routes/computations/new.tsx, lib/computations.ts, hooks/useCompute.ts | — |
| 5 | FIX P1 | Console errors — investigate and fix | (investigate first) | — |
| 6 | FIX P1 | Client detail `address` → `notes`, add `phone` field | routes/clients/$clientId.tsx, components/clients/ClientInfoCard.tsx | 2 |
| 7 | FIX P2 | Dashboard max-width + padding | routes/dashboard.tsx | 1 |
| 8 | FIX P2 | Landing hero proportions — reduce whitespace, better sizing | routes/index.tsx | 1 |
| 9 | FIX P2 | Heading consistency — standardize all pages to CSS custom properties | All route files | — |
| 10 | FIX P2 | Mobile-first responsive audit — ensure all pages have proper mobile breakpoints | All route + layout files | 9 |
| 11 | VERIFY DESKTOP | Landing page `/` (unauthenticated) | — | 8 |
| 12 | VERIFY DESKTOP | Auth pages `/auth`, `/auth/reset` | — | — |
| 13 | VERIFY DESKTOP | Onboarding `/onboarding` | — | — |
| 14 | VERIFY DESKTOP | Dashboard `/dashboard` (authenticated) | — | 1, 7 |
| 15 | VERIFY DESKTOP | Computations list `/computations` | — | — |
| 16 | VERIFY DESKTOP | New computation wizard `/computations/new` (step 1 + review) | — | 4 |
| 17 | VERIFY DESKTOP | Clients `/clients`, `/clients/new` | — | 2, 3 |
| 18 | VERIFY DESKTOP | Settings + Deadlines `/settings`, `/settings/team`, `/deadlines` | — | — |
| 19 | VERIFY MOBILE | Landing page `/` at 375px | — | 11 |
| 20 | VERIFY MOBILE | Auth pages at 375px | — | 12 |
| 21 | VERIFY MOBILE | Dashboard at 375px (hamburger menu visible, sidebar hidden) | — | 14 |
| 22 | VERIFY MOBILE | Computations list at 375px | — | 15 |
| 23 | VERIFY MOBILE | Wizard at 375px (form fields full-width, navigation controls) | — | 16 |
| 24 | VERIFY MOBILE | Clients pages at 375px | — | 17 |
| 25 | VERIFY MOBILE | Settings + Deadlines at 375px | — | 18 |
| 26 | VERIFY MOBILE | Sidebar drawer — open/close hamburger menu at 375px | — | 21 |
| 27 | FLOW QA | Full auth flow: landing → sign in → dashboard → sidebar navigation | — | 14 |
| 28 | FLOW QA | Computation flow: new → wizard → fill all steps → compute → see results → verify saved | — | 4, 16 |
| 29 | FLOW QA | Client flow: create client → see in list → view detail → back to list | — | 2, 3, 17 |
| 30 | FLOW QA | Cross-entity: assign client to computation, share computation, view shared link | — | 28, 29 |
| 31 | DISCOVERY | Route-component wiring audit — verify every route imports real components | All routes | — |
| 32 | DISCOVERY | Supabase query audit — verify every `.select()` / `.insert()` uses real column names | All lib/ + routes/ | 2, 3 |
| 33 | DISCOVERY | Final gap sweep — any remaining issues? If none, converge | — | 31, 32 |

---

## Stage Details

### Stage 1 — Dashboard Routing (FIX P0)

**Problem**: `IndexRoute` at `/` parents to `rootRoute`. When authenticated, the dashboard renders without AppLayout (no sidebar, no padding).

**Fix**:
1. Create `routes/dashboard.tsx`:
   - Move the authenticated dashboard JSX from `routes/index.tsx` into a new `DashboardRoute`
   - Parent: `authenticatedRoute`
   - Path: `/dashboard`
2. Update `routes/index.tsx`:
   - Keep only the landing page (unauthenticated view)
   - When `user` is present, redirect to `/dashboard` using `useNavigate` + `useEffect`
   - Remove all authenticated dashboard code, imports for `listComputations`, `ComputationCard`, etc.
3. Update `router.ts`:
   - Import `DashboardRoute` from `./routes/dashboard`
   - Add `DashboardRoute` to `authenticatedRoute.addChildren([...])`
   - Remove `IndexRoute` from the root level children — keep it there but it now only renders landing or redirects

**Verify**: `npx vite build` passes, `npx vitest run` passes (update tests if needed).

---

### Stage 2 — Clients Column Mismatch (FIX P0)

**Problem**: Frontend queries `name` but DB column is `full_name`. Frontend queries `address` but DB has no such column.

**Fix** (4 files):
1. `routes/clients/index.tsx`:
   - `.select('id, name, email')` → `.select('id, full_name, email')`
   - `.order('name')` → `.order('full_name')`
   - `ClientRow` interface: `name: string` → `fullName: string`
   - Mapping: `name: c.name` → `fullName: c.full_name`
2. `routes/clients/$clientId.tsx`:
   - `.select('id, name, email, tin, address')` → `.select('id, full_name, email, phone, tin, notes')`
   - `ClientDetail` interface: `name` → `fullName`, `address` → `notes`, add `phone`
   - Mapping: update all field references
3. `components/clients/ClientsTable.tsx`:
   - Update prop type and rendering from `name` → `fullName`
4. `components/clients/ClientInfoCard.tsx`:
   - Update prop type and rendering from `name` → `fullName`, `address` → `notes`

---

### Stage 3 — New Client Insert (FIX P0)

**Problem**: Insert sends `{ name, address }` but DB expects `{ full_name }` and has no `address`.

**Fix** (`routes/clients/new.tsx`):
1. Change `name: name.trim()` → `full_name: name.trim()` in the insert object
2. Remove `address` from the insert, or change to `notes: address.trim() || null`
3. Rename the form field label from "Address" to "Notes" (or keep address UI but map to notes)
4. Add a `phone` field to the form

---

### Stage 4 — Computation Persistence (FIX P1)

**Problem**: Wizard computes locally via WASM but never saves to Supabase. Dashboard shows "no computations."

**Fix** (`routes/computations/new.tsx`):
1. Import `createComputation`, `saveComputationOutput` from `../../lib/computations`
2. Import `useOrganization` from `../../hooks/useOrganization`
3. In `handleSubmit`:
   - Before `runCompute()`: call `createComputation(orgId, clientId, computationTitle || 'Untitled', engineInput)` to create the DB record
   - After successful `runCompute()`: call `saveComputationOutput(compId, result)` to persist the output
   - If creation fails, show an error
4. After compute + save, the results page should show a "View in Dashboard" link
5. Navigate to `/computations/{id}` after compute instead of showing inline results

---

### Stage 5 — Console Errors (FIX P1)

**Problem**: 1 console error on every authenticated page load.

**Fix**:
1. Start dev server, open browser console
2. Identify the error source (likely a failed Supabase query, missing column, or React strict mode issue)
3. Fix the root cause
4. Verify zero console errors on page load

---

### Stage 6 — Client Detail Fields (FIX P1)

**Problem**: Client detail page queries `address` (doesn't exist) and misses `phone` and `notes`.

**Fix** (after Stage 2 fixes the query):
1. Ensure `ClientInfoCard` displays: full_name, email, phone, tin, notes
2. Ensure the UI labels make sense (e.g., "Notes" not "Address")

---

### Stage 7 — Dashboard Max-Width (FIX P2)

**Fix** (`routes/dashboard.tsx`):
1. Add `max-w-5xl mx-auto` to the dashboard wrapper
2. Ensure consistent padding with other authenticated pages

---

### Stage 8 — Landing Hero Proportions (FIX P2)

**Fix** (`routes/index.tsx`):
1. Change `min-h-[70vh]` to `py-16 sm:py-24` (use padding instead of min-height)
2. Increase heading size or add visual weight
3. Ensure feature cards are visible without scrolling on most viewports
4. Footer should feel connected, not floating far below

---

### Stage 9 — Heading Consistency (FIX P2)

**Problem**: Mix of `var(--text-h1)`, `text-3xl`, `text-[2rem]` across pages.

**Fix**: Standardize ALL page headings:
- Page titles: `className="font-display text-foreground" style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}`
- Section headings: use `var(--text-h2)` or `var(--text-h3)` consistently
- Files to update: every route file's `<h1>` and `<h2>` elements

---

### Stage 10 — Mobile Responsive Audit (FIX P2)

**Fix**:
1. Ensure every page has proper mobile padding (`p-4` on mobile, `p-6` on tablet, `p-8` on desktop — handled by AppLayout's `<main>` for authenticated pages)
2. Check landing page has mobile-appropriate padding
3. Verify form inputs are full-width on mobile
4. Verify cards use single column on mobile, grid on wider
5. Verify tables have horizontal scroll wrappers on mobile

---

### Stages 11-18 — Desktop Verification (VERIFY DESKTOP)

For each route, at 1280x800 viewport:
1. Navigate to the page
2. Take a screenshot, save to `loops/taxklaro-qa-forward/screenshots/desktop-{route-name}.png`
3. Verify: real content renders, no errors, correct layout, sidebar visible (authenticated pages)
4. Check console for errors
5. If issues found: fix and re-verify

**Routes per stage:**
- 11: `/` (landing, unauthenticated)
- 12: `/auth`, `/auth/reset`
- 13: `/onboarding`
- 14: `/dashboard`
- 15: `/computations`
- 16: `/computations/new`
- 17: `/clients`, `/clients/new`
- 18: `/settings`, `/settings/team`, `/deadlines`

---

### Stages 19-26 — Mobile Verification (VERIFY MOBILE)

Same as stages 11-18 but at 375x812 viewport. Save screenshots as `mobile-{route-name}.png`.

Additional checks:
- Sidebar is hidden, hamburger menu is visible
- Content doesn't overflow horizontally
- Form fields are full-width
- Touch targets are ≥ 44px

---

### Stages 27-30 — Flow QA (FLOW QA)

Execute complete user flows using Playwright clicks and form fills:

**Stage 27 — Auth Flow**:
1. Navigate to `/` → verify landing renders
2. Click "Get Started" → verify auth page
3. Fill email + password → click Sign In
4. Verify redirect to `/dashboard` with sidebar

**Stage 28 — Computation Flow**:
1. Click "New Computation" → verify wizard step 1
2. Select "Self-Employed" → next → fill tax year → next → fill income → ... → review → submit
3. Verify computation results render
4. Navigate to dashboard → verify computation appears in list

**Stage 29 — Client Flow**:
1. Navigate to `/clients` → verify empty state or list
2. Click "New Client" → fill form → submit
3. Verify client appears in list
4. Click client → verify detail page shows correct data

**Stage 30 — Cross-Entity**:
1. Create a computation with a client assigned
2. Verify computation shows client name
3. Toggle share on computation
4. Open share URL in incognito/new tab → verify shared view renders

---

### Stages 31-33 — Discovery (DISCOVERY)

**Stage 31 — Route-Component Wiring**:
For every route in `router.ts`:
1. Open the route file
2. Verify it imports and renders at least one component from `src/components/`
3. Verify it's not a stub (no `return null`, no `return <div>placeholder</div>`)
4. If orphaned components found (in `src/components/` but never imported), note them

**Stage 32 — Supabase Query Audit**:
1. Grep all `.from('tablename')` calls
2. For each, check the `.select()`, `.insert()`, `.update()` columns against the actual schema in `migrations/20260306000001_initial_schema.sql`
3. Fix any remaining mismatches

**Stage 33 — Final Sweep**:
1. Run `npx vite build` — must pass
2. Run `npx vitest run` — must pass
3. Check all screenshots in `loops/taxklaro-qa-forward/screenshots/` — every page must show real content
4. If any issues remain: fix them
5. If all clear: write `status/converged.txt` and converge

## Rules

- Do ONE stage of work per iteration, then commit and exit.
- Never remove functionality — fix and enhance only.
- Preserve all `data-testid` attributes exactly.
- Do NOT modify test files unless route tree changes break imports.
- Run `npx vite build` after every code change.
- If a fix introduces a new bug, fix it before advancing.
- Screenshots are MANDATORY for verification stages — no convergence without them.
- Mobile screenshots must show the page at 375px width — not desktop width.
- Every Supabase query must use actual DB column names. Check the schema.
- Commit convention: `taxklaro(qa): stage {N} - {description}`
