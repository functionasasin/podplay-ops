# Forward Ralph Loop — Inheritance Platform Layer Fix

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: implement fixes for a single stage, then commit and exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Context

This is NOT a full-stack build. The inheritance calculator app already exists at `app/`. The Rust engine, WASM bridge, and React frontend are built and working. But the **platform layer is broken end-to-end** — auth, routes, navigation, case persistence, share, team management, and design all have critical gaps.

The reverse loop (`inheritance-platform-reverse`) audited the codebase and produced a comprehensive spec at `apps/inheritance/specs/inheritance-platform-spec.md` documenting 104 gaps (24 critical, 31 high, 29 medium, 20 low).

This forward loop implements every fix in that spec, stage by stage.

## Your Working Directories

- **Loop dir**: `apps/inheritance/loops/forward/platform/` (frontier, status tracking)
- **App dir**: `apps/inheritance/frontend/` (the existing React app — this is what you modify)
- **Spec**: `apps/inheritance/specs/inheritance-platform-spec.md` (your source of truth for ALL fixes)

**IMPORTANT**: The app source lives in `apps/inheritance/frontend/src/`, NOT in this loop's directory. You are patching an existing codebase, not building a new one.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — INSTALL DEPENDENCIES** (if the stage requires new packages):
   - Read the spec section for the current stage
   - Install required packages (`npm install` in `app/` directory)
   - Commit: `platform: stage {N} - install {packages}`
   - Exit

   **Priority 2 — IMPLEMENT** (if stage has work remaining):
   - Read the relevant spec sections carefully — use exact code snippets from the spec
   - Implement the fixes described for this stage
   - Every code change comes from the spec — never invent behavior
   - Commit: `platform: stage {N} - {description}`
   - Exit

   **Priority 3 — FIX ERRORS** (if implementation introduced errors):
   - Read the error output in `frontier/current-stage.md`
   - Identify root cause
   - Fix the code (consult spec if the fix deviates)
   - Commit: `platform: stage {N} - fix {description}`
   - Exit

   **Priority 4 — DONE** (if all work for the stage is complete and build passes):
   - This is detected externally by the runner
   - Write `status/stage-{N}-complete.txt`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Spec Sections | Key Files |
|-------|------|---------------|-----------|
| 1 | Foundation | §4, §5 | supabase.ts, SetupPage.tsx, migrations 011+012, organizations.ts, auth.ts, .env.local.example |
| 2 | Router + Auth | §2, §3 | __root.tsx, router.ts, main.tsx, auth.tsx, auth/callback.tsx, auth/reset.tsx, auth/reset-confirm.tsx, useAuth.ts |
| 3 | Routes + Navigation | §6, §7, §8 (JRV-002, JST-001/002) | cases/index.tsx, onboarding.tsx, invite/$token.tsx, settings/team.tsx, AppLayout.tsx |
| 4 | Core Flows | §8 (JFC, JSC) | cases/new.tsx, cases/$caseId.tsx, ResultsView.tsx, ActionsBar.tsx, share/$token.tsx |
| 5 | Settings + Team | §8 (JRV, JST) | settings/index.tsx, InviteMemberDialog.tsx, TeamMemberList.tsx, FirmProfileForm.tsx, deadlines.tsx |
| 6 | Design System | §9.1-§9.5 | index.css, Skeleton.tsx, EmptyState.tsx, PersonPicker.tsx, EnumSelect.tsx, WizardContainer.tsx, WillStep.tsx |
| 7 | Responsive + Polish | §9.4-§9.6 | Loading states, empty states, mobile fixes, PersonCard.tsx, ReviewStep.tsx, DistributionSection.tsx |
| 8 | Verification | — | Stub scan, orphan scan, build verification |

## Stage Details

### Stage 1: Foundation
**Goal**: Fix the base infrastructure so the app doesn't crash on boot.

1. **`src/lib/supabase.ts`** — Replace throw-on-missing-env with graceful `supabaseConfigured` flag (§4.3)
2. **`src/components/SetupPage.tsx`** — New component shown when env vars missing (§4.3)
3. **`app/.env.local.example`** — Update with all 3 required vars + comments (§4.2)
4. **`app/supabase/migrations/011_create_org_rpc.sql`** — create_organization RPC, handle_new_user trigger, updated get_shared_case (§5.3)
5. **`app/supabase/migrations/012_pdf_storage.sql`** — case_pdfs table with RLS (§5.4)
6. **`app/supabase/_MIGRATION_NOTES.md`** — Document missing migration numbers (§5.5)
7. **`src/lib/organizations.ts`** — Add `createOrganization()` function (§5.3)
8. **`src/lib/auth.ts`** — Add `resetPassword()` and `updatePassword()` functions (§3.5)

### Stage 2: Router + Auth
**Goal**: Fix auth flow end-to-end — sign-up, sign-in, callback, reset, layout isolation.

1. **`src/routes/__root.tsx`** — Add `publicRootRoute` + `MinimalLayout`; replace unconditional AppLayout with pathname-based layout isolation (§3.7)
2. **`src/router.ts`** — Full route tree rewrite with `publicRootRoute` children and auth context (§3.7, §2.1)
3. **`src/main.tsx`** — `RouterWithAuth` wrapper with auth state subscription + `<Toaster />` (§2.1)
4. **`src/routes/auth.tsx`** — `validateSearch`, firmName, confirmPassword fields, SUPABASE_ERROR_MAP, post-sign-up branching, resend confirmation, already-authenticated redirect (§3.1, §3.2)
5. **`src/routes/auth/callback.tsx`** — New: PKCE email confirmation handler (§3.6)
6. **`src/routes/auth/reset.tsx`** — New: password reset request page (§3.5)
7. **`src/routes/auth/reset-confirm.tsx`** — New: password reset confirmation page (§3.5)
8. **`src/hooks/useAuth.ts`** — Return signUp result so callers detect auto-confirm (§3.1)

### Stage 3: Routes + Navigation
**Goal**: Create missing routes and rebuild navigation.

1. **`src/routes/cases/index.tsx`** — New: CasesListPage with auth guard (§8 JRV-002)
2. **`src/routes/onboarding.tsx`** — New: 3-step onboarding flow (§10)
3. **`src/routes/invite/$token.tsx`** — New: invitation acceptance route (§8 JST-002)
4. **`src/routes/settings/team.tsx`** — Add `createRoute` wrapper + register in router (§8 JRV-012/JST-001)
5. **`src/components/layout/AppLayout.tsx`** — Full rewrite: navy sidebar with auth-aware nav, gold active bar, sign-out, mobile hamburger + drawer (§6.1, §6.2)
6. **`src/router.ts`** — Register all new routes (casesIndexRoute, onboardingRoute, inviteTokenRoute, settingsTeamRoute)

### Stage 4: Core Flows
**Goal**: Wire case creation, case persistence, share, and results.

1. **`src/routes/cases/new.tsx`** — Replace WizardContainer with GuidedIntakeForm; add beforeLoad auth guard; add compute timeout (§8 JFC)
2. **`src/routes/cases/$caseId.tsx`** — Wire share state (shareToken, shareEnabled, handleToggleShare); call useAutoSave; add "Back to Results" button (§8 JFC, JRV)
3. **`src/components/results/ResultsView.tsx`** — Add caseId/share props; render orphaned components (ShareBreakdownSection, ComparisonPanel, DonationsSummaryPanel) (§9.2 GAP-DRC-001)
4. **`src/components/results/ActionsBar.tsx`** — Add Share button + ShareDialog, PDF export button, clipboard feedback on Copy Narratives (§8 JSC, §9.2)
5. **`src/routes/share/$token.tsx`** — Render actual results instead of TODO comment (§8 JSC-002)
6. **`src/routes/index.tsx`** — Landing page rewrite: unauth hero + auth dashboard (§7.1, §7.2)

### Stage 5: Settings + Team
**Goal**: Fix settings page, team management, and deadline scoping.

1. **`src/routes/settings/index.tsx`** — Add settings tab navigation to Team; fix window.location.reload; add toast feedback (§8 JST-004, JRV-010, JST-010)
2. **`src/components/settings/InviteMemberDialog.tsx`** — Replace raw HTML with shadcn Dialog/Input/Select/Button (§8 JST-005)
3. **`src/components/settings/TeamMemberList.tsx`** — Fetch profiles for member user_ids; add role Badge; add "Change role" dropdown (§8 JST-007/008/009)
4. **`src/components/settings/FirmProfileForm.tsx`** — Add isDirty detection + unsaved changes warning (§8 JST-015)
5. **`src/routes/deadlines.tsx`** — Replace user_id scoping with org_id using useOrganization (§9.6 GAP-DMR-013)
6. **`src/routes/clients/index.tsx`** — Surface errors from ClientList; add org-creation prompt (§8 from catalog)

### Stage 6: Design System
**Goal**: Install design infrastructure and modernize form components.

1. **Install sonner** (`npm install sonner`) — toast library (§9.3)
2. **`src/index.css`** — Add shadow scale, animation tokens, skeleton keyframes, print.css import (§9.1)
3. **`src/components/ui/skeleton.tsx`** — New: Skeleton component (§9.4)
4. **`src/components/ui/empty-state.tsx`** — New: EmptyState component with icon, title, description, action (§9.5)
5. **`src/components/shared/PersonPicker.tsx`** — Replace native `<select>` with shadcn Select (§9.2 GAP-DSC-002)
6. **`src/components/shared/EnumSelect.tsx`** — Replace native `<select>` with shadcn Select (§9.2 GAP-DSC-003)
7. **`src/components/wizard/WizardContainer.tsx`** — Add mobile progress bar, remove dual Submit, add step transition animation (§9.2 GAP-DWC-001/003/004)
8. **`src/components/wizard/WillStep.tsx`** — Replace custom tab bar with shadcn Tabs (§9.2 GAP-DWC-014)
9. **Replace native checkboxes/radios** throughout wizard with shadcn Checkbox and RadioGroup (§9.2 GAP-DWC-008)

### Stage 7: Responsive + Polish
**Goal**: Fix mobile layouts, add loading skeletons, add empty states, polish details.

1. **Loading states** — Replace all hand-rolled spinners with `<Loader2>` from lucide-react; add Skeleton layouts to all data-loading pages (§9.4)
2. **Empty states** — Add EmptyState component to all empty-data scenarios: dashboard, cases, deadlines, clients, notes, team, documents (§9.5)
3. **Mobile responsive** — Add `overflow-x-auto` to all tables, fix wizard max-width, fix color picker flex-wrap, fix touch targets (§9.6)
4. **`src/components/wizard/PersonCard.tsx`** — Replace off-palette badge colors with design system colors (§9.2 GAP-DWC-012)
5. **`src/components/wizard/ReviewStep.tsx`** — Replace sparse summary with KPI card grid; fix `bg-[hsl(var(--accent))]` → `bg-accent` (§9.2 GAP-DWC-017/019)
6. **`src/components/results/DistributionSection.tsx`** — Add pie chart Legend; add overflow-x-auto to table (§9.2 GAP-DRC-005, §9.6 GAP-DMR-003)
7. **`src/components/clients/ClientForm.tsx`** + **`ClientList.tsx`** — Replace raw HTML with shadcn components (§9.2)

### Stage 8: Verification
**Goal**: Confirm zero stubs, zero orphans, clean build.

1. **Stub scan** — Scan all `app/src/` files for TODO, FIXME, STUB, PLACEHOLDER, HACK, empty component bodies, hardcoded dummy returns
2. **Orphan scan** — Verify every exported component in `components/` is imported by a route or parent
3. **Build verification** — `npm run build` must succeed with zero errors
4. **Completeness audit** — Walk through each of the 6 user journeys from the spec: can a user complete each one end-to-end?

Write results to `status/verification.txt`. If ANY check fails, create a fix list and do NOT mark Stage 8 complete.

## Key Spec References

The spec at `apps/inheritance/specs/inheritance-platform-spec.md` contains exact code snippets for every fix. **Use the spec's code, not your own invention.** The spec was designed to be copy-paste implementable.

Quick reference:
- §2: Route Table + auth guard pattern
- §3: Authentication (sign-up, sign-in, callback, reset, sign-out, layout isolation)
- §4: Environment config (graceful missing vars)
- §5: Database migrations (011, 012)
- §6: Navigation (sidebar, mobile drawer)
- §7: Landing page (unauth hero, auth dashboard)
- §8: User journey fixes (per-gap tables with exact fix instructions)
- §9: Design modernization (tokens, components, loading, empty, responsive)
- §10: Onboarding flow

## Rules

- Do ONE unit of work per iteration, then exit. Don't try to implement an entire stage in one pass if it's large — do a meaningful chunk, commit, and exit.
- Always read the spec section before implementing. The spec is the source of truth.
- Use exact code from the spec. The spec contains tested, reviewed code snippets.
- Do not modify test files unless a test contradicts the spec.
- **No new stubs.** Every change must be a complete implementation, not a placeholder.
- **No orphans.** Every new component must be imported and rendered by a route or parent.
- Install packages in `app/` directory (the app's `package.json` lives there).
- All file paths in the spec are relative to `app/src/` — translate to the actual path `apps/inheritance/frontend/src/`.

## Commit Convention

```
platform: stage {N} - {description}
```

Examples:
- `platform: stage 1 - fix supabase.ts graceful env vars`
- `platform: stage 2 - create auth callback route`
- `platform: stage 3 - rewrite AppLayout sidebar and mobile nav`
- `platform: stage 4 - wire share state through ResultsView`
- `platform: stage 6 - install sonner, add design tokens`
- `platform: stage 8 - verification pass`
