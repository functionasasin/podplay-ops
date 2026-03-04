# Frontier — Inheritance Platform Forward

## Statistics
- Total stages: 8
- Complete: 0
- In progress: 0
- Pending: 8
- Convergence: 0%

## Stages (ordered by dependency)

### Stage 1: Foundation
Fix base infrastructure so the app doesn't crash on boot.
- [ ] Fix supabase.ts graceful env vars + SetupPage component
- [ ] Update .env.local.example with all required vars
- [ ] Create migration 011 (create_organization RPC, handle_new_user trigger)
- [ ] Create migration 012 (case_pdfs table)
- [ ] Create _MIGRATION_NOTES.md
- [ ] Add createOrganization() to organizations.ts
- [ ] Add resetPassword/updatePassword to auth.ts

### Stage 2: Router + Auth
Fix auth flow end-to-end.
Depends on Stage 1 (organizations.ts needed for post-signup org creation).
- [ ] Add publicRootRoute + MinimalLayout to __root.tsx
- [ ] Rewrite router.ts with full route tree + auth context
- [ ] Add RouterWithAuth wrapper to main.tsx + Toaster
- [ ] Overhaul auth.tsx (validateSearch, firmName, confirmPassword, error map, redirect)
- [ ] Create auth/callback.tsx (PKCE handler)
- [ ] Create auth/reset.tsx (password reset request)
- [ ] Create auth/reset-confirm.tsx (password reset confirmation)
- [ ] Fix useAuth.ts (return signUp result)

### Stage 3: Routes + Navigation
Create missing routes and rebuild navigation.
Depends on Stage 2 (router + publicRootRoute must exist).
- [ ] Create cases/index.tsx (CasesListPage)
- [ ] Create onboarding.tsx (3-step flow)
- [ ] Create invite/$token.tsx (invitation acceptance)
- [ ] Fix settings/team.tsx (add createRoute)
- [ ] Rewrite AppLayout.tsx (sidebar + mobile drawer)
- [ ] Register all new routes in router.ts

### Stage 4: Core Flows
Wire case creation, persistence, share, and results rendering.
Depends on Stage 3 (routes and nav must exist).
- [ ] Fix cases/new.tsx (GuidedIntakeForm, auth guard, compute timeout)
- [ ] Fix cases/$caseId.tsx (share state, auto-save, back-to-results)
- [ ] Fix ResultsView.tsx (caseId/share props, render orphaned components)
- [ ] Fix ActionsBar.tsx (Share button, PDF export, clipboard feedback)
- [ ] Fix share/$token.tsx (render actual results)
- [ ] Rewrite index.tsx (landing page: unauth hero + auth dashboard)

### Stage 5: Settings + Team
Fix settings, team management, deadline scoping.
Depends on Stage 3 (settings/team route must exist).
- [ ] Fix settings/index.tsx (tab nav, reload hack, toast)
- [ ] Fix InviteMemberDialog.tsx (shadcn components)
- [ ] Fix TeamMemberList.tsx (profiles, role badge, role change)
- [ ] Fix FirmProfileForm.tsx (isDirty detection)
- [ ] Fix deadlines.tsx (org_id scoping)
- [ ] Fix clients/index.tsx (error surfacing, org prompt)

### Stage 6: Design System
Install design infrastructure and modernize form components.
Depends on Stage 4 (core flows must work before restyling).
- [ ] Install sonner
- [ ] Update index.css (design tokens, skeleton keyframes, print.css import)
- [ ] Create Skeleton component
- [ ] Create EmptyState component
- [ ] Replace native selects in PersonPicker, EnumSelect
- [ ] Modernize WizardContainer (mobile progress, animation, dual Submit fix)
- [ ] Replace WillStep custom tabs with shadcn Tabs
- [ ] Replace native checkboxes/radios with shadcn components

### Stage 7: Responsive + Polish
Fix mobile layouts, add loading skeletons and empty states.
Depends on Stage 6 (Skeleton + EmptyState components must exist).
- [ ] Replace all hand-rolled spinners with Loader2
- [ ] Add Skeleton loading states to all data-loading pages
- [ ] Add EmptyState to all empty-data scenarios
- [ ] Fix mobile responsive issues (overflow, touch targets, flex-wrap)
- [ ] Fix PersonCard badge colors
- [ ] Fix ReviewStep KPI cards + accent color
- [ ] Fix DistributionSection (chart legend, table overflow)
- [ ] Modernize ClientForm + ClientList with shadcn

### Stage 8: Verification
Confirm zero stubs, zero orphans, clean build.
Depends on ALL previous stages.
- [ ] Stub scan (zero banned patterns in production code)
- [ ] Orphan scan (every component imported by a route or parent)
- [ ] Build verification (npm run build — zero errors)
- [ ] Completeness audit (6 user journeys walkthrough)
