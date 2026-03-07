# TaxKlaro — Open Issues

**Date**: 2026-03-07
**Status**: Active — issues discovered during live QA session

---

## P0 — Broken Pages

### 1. Dashboard has no sidebar (layout/routing bug)

**Where**: `apps/taxklaro/frontend/src/routes/index.tsx:13-14`

**Problem**: `IndexRoute` parents to `rootRoute` instead of `authenticatedRoute`. When logged in, the dashboard renders without the `AppLayout` wrapper (no sidebar, no padding, no mobile hamburger). All other authenticated pages (computations, clients, deadlines, settings) correctly parent to `authenticatedRoute`.

**Root cause**: The index route serves dual duty — landing page (unauthenticated) and dashboard (authenticated). It can't parent to `authenticatedRoute` because the landing page shouldn't have a sidebar.

**Fix options**:
1. **Split the route**: Create `/dashboard` under `authenticatedRoute`, redirect authenticated users from `/` to `/dashboard`. Landing page stays at `/` under `rootRoute`.
2. **Inline AppLayout**: Wrap the authenticated return in `<AppLayout>` directly (would duplicate layout logic).
3. **Conditional parent**: Not supported by TanStack Router.

Option 1 is cleanest.

---

### 2. Clients pages crash — `column clients.name does not exist`

**Where**: 3 files affected
- `apps/taxklaro/frontend/src/routes/clients/index.tsx:39` — `.select('id, name, email')` + `.order('name')`
- `apps/taxklaro/frontend/src/routes/clients/$clientId.tsx:37` — `.select('id, name, email, tin, address')`
- `apps/taxklaro/frontend/src/routes/clients/new.tsx:37` — `.insert({ name: name.trim(), ... })`

**Problem**: All client queries/inserts use `name` but the DB column is `full_name`. The insert on `/clients/new` will also fail.

**DB schema** (`20260306000001_initial_schema.sql:68-78`):
```sql
CREATE TABLE clients (
  id          UUID PRIMARY KEY,
  org_id      UUID NOT NULL,
  full_name   TEXT NOT NULL,  -- ← code uses "name"
  email       TEXT,
  phone       TEXT,
  tin         TEXT,
  notes       TEXT,            -- no "address" column
  status      client_status,
  ...
);
```

**Additional mismatch**: Client detail page queries `address` (`$clientId.tsx:37`) but the DB has no `address` column. It has `notes` instead.

**Fix**: Rename all frontend references from `name` → `full_name`, and `address` → remove or map to `notes`. Update the `ClientDetail` interface, `ClientRow` interface, and `ClientInfoCard` component props.

---

## P1 — Functional Issues

### 3. New Client insert uses wrong column names

**Where**: `apps/taxklaro/frontend/src/routes/clients/new.tsx:35-41`

**Problem**: Insert sends `{ name, email, tin, address }` but DB expects `{ full_name, email, tin }` (no `address` column). Creating a client will fail with a Postgres error.

**Fix**: Change `name:` to `full_name:`, remove `address` or map to `notes`.

---

### 4. Computations not persisting to dashboard

**Where**: `apps/taxklaro/frontend/src/routes/index.tsx:49`

**Problem**: After completing the wizard and seeing results, navigating to Dashboard shows "No computations yet." The `listComputations` call returns empty. Likely the computation isn't being saved to Supabase after WASM compute — only computed locally. Need to verify if `saveComputation` is called after compute.

**Status**: Needs investigation — may be working as designed (compute without save) or a missing save step.

---

## P2 — UI/Proportion Issues

### 5. Dashboard content has no max-width constraint

**Where**: `apps/taxklaro/frontend/src/routes/index.tsx:128`

**Problem**: Even if the sidebar issue (#1) is fixed, the dashboard content area has `className="space-y-6"` with no `max-w-*` or horizontal padding. On wide screens the content will stretch edge-to-edge.

**Fix**: Add `max-w-5xl mx-auto` or similar to the dashboard wrapper div.

---

### 6. Landing page hero proportions

**Where**: `apps/taxklaro/frontend/src/routes/index.tsx:59-84`

**Problem**: The hero section uses `min-h-[70vh]` which can feel too tall on short viewports and the feature cards below get pushed below the fold. The `text-[2rem] sm:text-[3rem]` heading size may feel small relative to the large whitespace.

**Fix**: Consider reducing to `min-h-[60vh]` or using `py-20` instead of min-height. Alternatively increase heading size or add a visual element (illustration, screenshot) to fill the hero area.

---

### 7. Font-display heading sizes inconsistent

**Where**: Multiple routes

**Problem**: Some pages use CSS custom properties (`var(--text-h1)`), others use Tailwind utilities (`text-3xl`), and others use raw rem (`text-[2rem]`). This creates inconsistent heading sizes across pages.

Examples:
- Dashboard: `style={{ fontSize: 'var(--text-h1)' }}`
- Clients: `className="text-3xl"` (Tailwind)
- Landing hero: `className="text-[2rem] sm:text-[3rem]"` (arbitrary)

**Fix**: Standardize all page headings to use the CSS custom property system (`var(--text-h1)`, etc.) consistently.

---

## P3 — Minor

### 8. Console errors on every page load

**Where**: Browser console

**Problem**: 1 console error present on every authenticated page load. Needs investigation — could be a failed Supabase query, missing env var, or React strict mode double-render issue.

---

## Summary

| # | Severity | Issue | Pages Affected |
|---|----------|-------|----------------|
| 1 | P0 | Dashboard missing sidebar | `/` (authenticated) |
| 2 | P0 | `clients.name` column doesn't exist | `/clients`, `/clients/$id` |
| 3 | P1 | New client insert wrong columns | `/clients/new` |
| 4 | P1 | Computations not showing on dashboard | `/` |
| 5 | P2 | Dashboard no max-width | `/` |
| 6 | P2 | Landing hero proportions | `/` (unauthenticated) |
| 7 | P2 | Inconsistent heading font sizes | All pages |
| 8 | P3 | Console error on page load | All pages |
