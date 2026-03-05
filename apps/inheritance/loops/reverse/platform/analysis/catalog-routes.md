# Route Catalog — catalog-routes

Source directory: `loops/inheritance-frontend-forward/app/src/routes/`
Router config: `loops/inheritance-frontend-forward/app/src/router.ts`

## Summary

- **Registered routes**: 10 (in routeTree)
- **Unregistered component**: 1 (`settings/team.tsx` — exists but has no `createRoute`, not in router)
- **Auth mechanism**: Per-component conditional rendering — NO route-level auth guards
- **Router library**: `@tanstack/react-router`

---

## Route Inventory

### 1. Root Layout — `routes/__root.tsx`

| Field | Value |
|-------|-------|
| Path | (layout wrapper, no path) |
| Export | `rootRoute` |
| Component | `RootLayout` |
| Auth | None |
| Wraps | `AppLayout` → `<Outlet />` |

**Notes**: All routes are children of this root. The entire app is wrapped in AppLayout — meaning AppLayout (sidebar, header) renders on every page including `/auth` and `/share/$token`. This is a UX problem: the share view and auth page show full nav chrome.

---

### 2. Home/Dashboard — `routes/index.tsx`

| Field | Value |
|-------|-------|
| Path | `/` |
| Export | `indexRoute` |
| Component | `DashboardPage` |
| Auth | No guard; conditional render |

**Unauthenticated state**: Shows "Inheritance Calculator" title + description + Sign In button + Create Account button (both link to `/auth`). No product screenshots, no feature list.

**Authenticated state**: Header "Dashboard" + "Welcome back." text + single "New Case" button. No case list. No deadline summary. No recent activity. No quick stats.

**Gaps**:
- GAP-001: Authenticated dashboard is nearly empty — just a New Case button. No case list, no deadlines summary, no recent activity.
- GAP-002: Unauthenticated landing is minimal — no value proposition, no screenshots, no feature breakdown.
- GAP-003: Both Sign In and Create Account link to same `/auth` page (modal switches between modes internally, OK but could be cleaner).

---

### 3. Auth — `routes/auth.tsx`

| Field | Value |
|-------|-------|
| Path | `/auth` |
| Export | `authRoute` |
| Component | `AuthPage` |
| Auth | Public |

**Modes**: `signin` / `signup` — toggle in-place within a single card.

**Sign-up flow**: email + password (min 6 chars) + optional full name → on success, shows "Check your email" card with Back to Sign In button.

**Sign-in flow**: email + password → `navigate({ to: '/' })` on success.

**Error handling**: Shows `<Alert variant="destructive">` with error message.

**Gaps**:
- GAP-004: No password reset ("Forgot password?") link.
- GAP-005: Redirect after sign-in always goes to `/` — no "redirect to intended page" (e.g., if user tried to access `/settings` while unauthenticated, they should land there after sign-in).
- GAP-006: AppLayout renders on `/auth` — full sidebar/nav chrome wraps the auth card. Auth should be full-screen centered layout.
- GAP-007: No "remember me" option.
- GAP-008: Sign-up success screen is inside the auth route — user has to click "Back to Sign In" manually. No auto-redirect after email confirmation.

---

### 4. New Case — `routes/cases/new.tsx`

| Field | Value |
|-------|-------|
| Path | `/cases/new` |
| Export | `casesNewRoute` |
| Component | `CasesNewPage` |
| Auth | No guard |

**States**: `wizard` → `computing` → `results` | `error`

**Gaps**:
- GAP-009: No auth gate — unauthenticated users can access the wizard and compute results, but results won't persist (no caseId to save to).
- GAP-010: On successful computation, no automatic save/redirect to `/cases/$caseId` for authenticated users.
- GAP-011: Results shown in ephemeral local state — navigating away loses the computation.

---

### 5. Case Editor — `routes/cases/$caseId.tsx`

| Field | Value |
|-------|-------|
| Path | `/cases/$caseId` |
| Export | `caseIdRoute` |
| Component | `CaseEditorPage` |
| Auth | No guard (loadCase will fail without auth) |

**States**: `loading` → `wizard` | `results` | `computing` | `error`

**Features**: Loads case from DB, updates input/output on submit, supports `useAutoSave`.

**Gaps**:
- GAP-012: No auth redirect — if not signed in, `loadCase` will throw and show generic error, not a sign-in prompt.
- GAP-013: No case title/breadcrumb in the page — user can't tell which case they're looking at from the URL alone.
- GAP-014: No "Back to cases" navigation link.
- GAP-015: No case sharing button visible from this page (must be in ResultsView ActionsBar — not confirmed yet).

---

### 6. Clients List — `routes/clients/index.tsx`

| Field | Value |
|-------|-------|
| Path | `/clients` |
| Export | `clientsRoute` |
| Component | `ClientsPage` |
| Auth | Shows "Sign in to manage clients" if unauthenticated |

**Features**: List with search, status filter, sort by name/intake_date/status. New Client button.

**Gaps**:
- GAP-016: Requires organization — if user has no org (new account, org creation failed), page loads but shows empty list with no explanation.
- GAP-017: Error from `listClients` is silently swallowed (catch → `setClients([])`). User sees empty list, not an error.

---

### 7. New Client — `routes/clients/new.tsx`

| Field | Value |
|-------|-------|
| Path | `/clients/new` |
| Export | `newClientRoute` |
| Component | `NewClientPage` |
| Auth | Requires `user` + `organization` (silent fail) |

**Gaps**:
- GAP-018: If `user` or `organization` is null, `handleSubmit` returns early with no user feedback. Form appears functional but submits silently fail.
- GAP-019: No loading state while org is being fetched.
- GAP-020: No error display if `createClient` throws (catch just calls `setLoading(false)`, no error message shown).
- GAP-021: No auth gate — unauthenticated user sees the form, fills it out, submits silently fails.

---

### 8. Client Detail — `routes/clients/$clientId.tsx`

| Field | Value |
|-------|-------|
| Path | `/clients/$clientId` |
| Export | `clientDetailRoute` |
| Component | `ClientDetailPage` |
| Auth | No guard (loadClient fails without auth) |

**Sections rendered**: Identity, Contact, Legal IDs, Intake, Cases (stub), Conflict Check Log.

**Gaps**:
- GAP-022: Cases section at line 137 — `<p className="text-sm text-muted-foreground">Linked cases will appear here.</p>` — stub placeholder, no actual case linking.
- GAP-023: No edit client action — read-only view only.
- GAP-024: No back to clients list link.
- GAP-025: `civil_status`, `gov_id_type` show raw values with label lookup — if value is unexpected, lookup silently returns undefined.

---

### 9. Deadlines — `routes/deadlines.tsx`

| Field | Value |
|-------|-------|
| Path | `/deadlines` |
| Export | `deadlinesRoute` |
| Component | `DeadlinesPage` |
| Auth | Shows "Sign in to view deadlines" if unauthenticated |

**Features**: Groups deadlines by urgency (overdue, due_this_week, urgent, due_soon, upcoming). Links to individual cases.

**Gaps**:
- GAP-026: Queries `cases` by `user_id` directly — bypasses organization/multi-seat model (should be org-level).
- GAP-027: No mark-complete action for deadlines — view-only.
- GAP-028: No empty state illustration — just text "No pending deadlines across your active cases."

---

### 10. Settings — `routes/settings/index.tsx`

| Field | Value |
|-------|-------|
| Path | `/settings` |
| Export | `settingsRoute` |
| Component | `SettingsPage` |
| Auth | Shows "Sign in to manage firm settings" if unauthenticated |

**Sections**: Firm Profile (FirmProfileForm), Firm Logo (LogoUpload), Brand Colors (ColorPickers).

**Gaps**:
- GAP-029: Logo upload at line 73 calls `window.location.reload()` to refresh profile — crude, loses scroll position and any unsaved state.
- GAP-030: No navigation to Team settings — `/settings/team` is unreachable from the UI.
- GAP-031: No billing/plan section.
- GAP-032: Settings page has no sub-navigation (no tabs or sidebar within settings for: Profile, Team, Billing, etc.).

---

### 11. Shared Case — `routes/share/$token.tsx`

| Field | Value |
|-------|-------|
| Path | `/share/$token` |
| Export | `shareTokenRoute` |
| Component | `SharedCaseRouteComponent` |
| Auth | Public — no auth required |

**States**: `loading` | `not-found` | `content`

**Gaps**:
- GAP-033: CRITICAL — Results not rendered. Line 100-101 contains a comment: `{/* Results will be rendered here in implementation phase */}`. The shared view shows only the case title and decedent name — no computation output.
- GAP-034: AppLayout wraps the shared view — full sidebar/nav chrome shown to recipients who may not be logged in or even have an account. Should be a minimal read-only layout.
- GAP-035: No CTA for recipients to sign up / learn about the product.

---

### 12. Team Settings — `routes/settings/team.tsx` ⚠️ UNREGISTERED

| Field | Value |
|-------|-------|
| Path | **NONE** — not registered in router.ts |
| Export | `TeamSettingsPage` (function, no createRoute) |
| Component | `TeamSettingsPage` |
| Auth | Implicitly requires org membership |

**Critical**: This file has no `createRoute` call and is not imported in `router.ts`. The team management UI (member list, invite dialog, role changes, invitation revocation, seat limits) is built but completely unreachable.

**Gaps**:
- GAP-036: CRITICAL — `/settings/team` route does not exist. Must add `createRoute` and register in router.
- GAP-037: Loading state is a bare `<div className="p-6"><p>Loading...</p></div>` — not using spinner or Loader2.
- GAP-038: No org-creation flow for new users who land here with no organization.

---

## Missing Routes

| Route | Status | Priority |
|-------|--------|----------|
| `/cases` | MISSING | High — no case list page for authenticated users |
| `/settings/team` | MISSING (component exists) | Critical |
| `/settings/billing` | MISSING | Medium |
| `/settings/profile` | MISSING (merged into `/settings`) | Low |
| Password reset | MISSING | Medium |

---

## Auth Pattern Issues

The app uses NO route-level auth guards. Every protected page handles auth with in-component conditional rendering:
- Some show a "Sign in to..." message (clients, deadlines, settings)
- Some fail silently (new client submit, case editor load error)
- Some have no guard at all (cases/new — unauthenticated compute works, just doesn't persist)

**Required fix**: Implement route-level `beforeLoad` guards in TanStack Router using `beforeLoad: () => { if (!user) throw redirect({ to: '/auth' }) }` pattern. This requires access to the auth state in `beforeLoad`, which means the router needs a context/loader pattern for auth.

---

## Stubs / Placeholder Code

| Location | Line | Content |
|----------|------|---------|
| `routes/share/$token.tsx` | 100-101 | `{/* Results will be rendered here in implementation phase */}` |
| `routes/clients/$clientId.tsx` | 137 | `<p>Linked cases will appear here.</p>` |
| `routes/settings/index.tsx` | 73 | `window.location.reload()` (hack) |

---

## Route Registration Completeness

```
router.ts registers:
✅ indexRoute         → /
✅ authRoute          → /auth
✅ casesNewRoute      → /cases/new
✅ caseIdRoute        → /cases/$caseId
✅ clientsRoute       → /clients
✅ newClientRoute     → /clients/new
✅ clientDetailRoute  → /clients/$clientId
✅ deadlinesRoute     → /deadlines
✅ settingsRoute      → /settings
✅ shareTokenRoute    → /share/$token
❌ TeamSettingsPage   → no route (settings/team.tsx not connected)
```
