# Frontier — Inheritance Platform Layer

## Statistics
- Total aspects discovered: 25
- Analyzed: 21
- Pending: 4
- Convergence: 84%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition
Gather and catalog all source material.

- [x] catalog-routes — Read every file in `app/src/routes/`, catalog: path, exported route name, component, what it renders, auth requirement
- [x] catalog-components — Read every file in `app/src/components/`, catalog: file path, what it renders, props, any stubs/placeholders
- [x] catalog-lib-hooks — Read every file in `app/src/lib/` and `app/src/hooks/`, catalog: exports, dependencies, completeness
- [x] catalog-config — Read `app/src/index.css`, `app/vite.config.ts`, `app/tsconfig.json`, `app/package.json`, `app/supabase/config.toml`, catalog current design tokens and config
- [x] catalog-migrations — Read every file in `app/supabase/migrations/`, catalog: what each creates, any duplicates or conflicts
- [x] read-premium-spec — Read `docs/plans/inheritance-premium-spec.md`, extract every platform-related feature that was specified
- [x] read-failure-logs — Read failure docs from `loops/inheritance-frontend-forward/frontier/analysis-log.md` and `loops/inheritance-frontend-reverse/frontier/aspects.md`, extract actionable items
- [x] reference-modern-saas — Research modern SaaS dashboard patterns (Linear, Vercel, Cal.com): nav design, card patterns, transitions, loading states, empty states, onboarding flows. Document patterns that work with Navy+Gold.

### Wave 1: Additional Verification (discovered during read-premium-spec)

- [x] verify-migration-columns — Confirm migrations 003, 004, 008, 009 status; verify cases table has comparison_*, tax_*, intake_data columns; confirm get_shared_case() RPC and firm-logos storage bucket exist

### Wave 2: User Journey Audit
Depends on Wave 1 catalogs being complete.

- [x] journey-new-visitor — Walk: user visits `/` for the first time with no account. What do they see? Can they understand the product? Can they find sign-up?
- [x] journey-signup-signin — Walk: user clicks sign up → fills form → gets confirmation email → confirms → signs in → lands where? Document every step and gap.
- [x] journey-first-case — Walk: authenticated user creates first case → fills wizard → computes → sees results. Is the flow discoverable? Are there dead ends?
- [x] journey-share-case — Walk: user shares a case via link → recipient opens link. Does the share flow work? What does the recipient see?
- [x] journey-return-visit — Walk: user returns days later → dashboard → case list → opens existing case → edits → recomputes. Is the dashboard useful?
- [x] journey-settings-team — Walk: user goes to settings → updates firm profile → invites team member → member accepts. Does the full org flow work?

### Wave 3: Design Modernization Audit
Depends on Wave 1 catalogs and Wave 2 journey findings.

- [x] design-layout-nav — Audit AppLayout, sidebar, mobile header: spacing, transitions, active states, collapse behavior. Propose modernization.
- [x] design-wizard-components — Audit all wizard step components: card patterns, form styling, step indicators, validation display. Propose modernization.
- [x] design-results-components — Audit results view, computation log, warnings panel, narrative panel, actions bar. Propose modernization.
- [x] design-shared-components — Audit shared form components (MoneyInput, DateInput, PersonPicker, etc.): consistency, focus states, error display. Propose modernization.
- [x] design-mobile-responsive — Audit every page at mobile breakpoints: does the layout work? Touch targets adequate? Scroll behavior correct? Tables overflow? Propose fixes.
- [x] design-loading-empty-states — Catalog every loading state and empty state in the app. Which are missing? Propose skeleton/spinner patterns and empty state illustrations+CTAs.

### Wave 4: Synthesis
Depends on all previous waves. **Strict internal dependency order.**

- [ ] spec-draft — Assemble all findings into `docs/plans/inheritance-platform-spec.md`. Every section fully written with exact file paths and exact changes.
- [ ] placeholder-validation — **HARD GATE.** Scan entire spec for banned patterns. MUST return PASS before proceeding.
- [ ] completeness-audit — Verify every gap from Wave 2 journeys has an exact fix in the spec. Per-gap PASS/FAIL.
- [ ] spec-review — Final review: could a developer fix every platform issue and modernize every component from this spec alone?

## Recently Analyzed

| Aspect | Wave | Date | Key Findings |
|--------|------|------|--------------|
| design-wizard-components | 3 | 2026-03-04 | 24 gaps found; CRITICAL: dual Submit buttons on Review step (GAP-DWC-004), no field-level validation — form submits with empty required fields (GAP-DWC-024); HIGH: native checkboxes/radios throughout (GAP-DWC-008), relationship badge uses off-palette colors (GAP-DWC-012), native select elements (GAP-DWC-013), custom hand-rolled tabs in WillStep (GAP-DWC-014), GuidedIntakeForm submission error not surfaced (GAP-DWC-023); MEDIUM: step indicator lacks progress bar on mobile (GAP-DWC-001), no step transition animation (GAP-DWC-003), plain text empty states in FamilyTree+Donations steps (GAP-DWC-010/015), ReviewStep sparse summary cards (GAP-DWC-017); hardcoded [hsl(var(--accent))] classes throughout (GAP-DWC-019); 13 modernization specs (MOD-DWC-001 through MOD-DWC-013) |
| design-layout-nav | 3 | 2026-03-04 | 11 gaps found; CRITICAL: sidebar uses bg-card (white) not bg-sidebar (navy) — token defined but unused (GAP-DLN-001), no auth-conditional nav (GAP-DLN-004), no sign-out anywhere (GAP-DLN-011); HIGH: wrong active state (GAP-DLN-002), no hover transitions (GAP-DLN-003), missing /cases nav link (GAP-DLN-005), mobile tab bar must become hamburger+drawer (GAP-DLN-008); exact modernization specs: MOD-DLN-001 through MOD-DLN-007 covering AppLayout.tsx rewrite and index.css token additions |
| journey-return-visit | 2 | 2026-03-04 | BROKEN overall; 16 gaps found; CRITICAL: No cases list route (JRV-002), Dashboard shows no case list (JRV-001), /settings/team not registered (JRV-012); HIGH: no Cases nav item (JRV-003), useAutoSave imported but never called (JRV-007), TeamMemberList shows UUID not name (JRV-014), InviteMemberDialog raw HTML not modal (JRV-015); MEDIUM: logo upload does window.location.reload() (JRV-010), no Back-to-Results shortcut (JRV-006); Deadlines page has org_id vs user_id bug (JRV-004) |
| journey-first-case | 2 | 2026-03-04 | BROKEN overall; 19 gaps found; CRITICAL: WizardContainer never saves to DB (JFC-002), GuidedIntakeForm orphaned — no route uses it (JFC-010), no Save/Share/PDF in ActionsBar (JFC-009/JFC-011/JFC-013), no /cases list route (JFC-017), Dashboard shows no case list (JFC-018); ResultsView missing caseId prop chain; dual Submit buttons on Review step; fix: swap /cases/new to use GuidedIntakeForm + redirect to /cases/$caseId on complete |
| journey-signup-signin | 2 | 2026-03-04 | BROKEN overall; 14 gaps found; CRITICAL: no /auth/callback route (JSS-008) — PKCE email confirmation code discarded, session never established; useAuth.signUp() discards return value (JSS-004); auto-confirm shows wrong message (JSS-005); no org creation (JSS-014); HIGH: no resend button in confirmation card (JSS-006), always redirects to / after sign-in (JSS-012); fix specs provided for all critical/high gaps |
| journey-new-visitor | 2 | 2026-03-04 | BROKEN overall; 19 gaps found; CRITICAL: white-screen if env vars missing (JNV-001), AppLayout wraps /auth page (JNV-006), no org creation after sign-up (JNV-011/018), sign-up shows "Check email" but user is auto-confirmed (JNV-012); HIGH: "Create Account" opens signin mode (JNV-005), no Sign Out in nav (JNV-003), no Forgot Password (JNV-007); fix specs provided for all critical/high gaps |
| reference-modern-saas | 1 | 2026-03-04 | 20 adoptable patterns cataloged from Linear/Vercel/Cal.com; critical: add sonner toast (no library currently), skeleton shimmer CSS, auth-aware sidebar, gold active accent bar, collapsible nav, empty states, shadow+animation tokens missing from index.css; mobile: drawer nav + stacked card tables below lg breakpoint |
| catalog-routes | 1 | 2026-03-04 | 10 registered routes, 1 unregistered (settings/team — CRITICAL), 3 stub placeholders (share results, client cases, logo reload hack), no route-level auth guards, missing /cases list route |
| catalog-components | 1 | 2026-03-04 | ~80 non-test files across 13 subdirs; 5 critical stubs: DocumentChecklist (unimplemented backend fns), DeadlineTimeline (raw HTML + missing handler), ClientForm (raw HTML, no validation), ClientList (raw HTML table), InviteMemberDialog (unstyled buttons); MISSING: Toast/notification system, Skeleton component, auth-conditional nav |
| catalog-lib-hooks | 1 | 2026-03-04 | 18 lib files + 5 hooks; CRITICAL: supabase.ts throws on missing env vars (white-screen), comparison.ts static wasm import (blocks thread), no createOrganization anywhere; HIGH: no resetPassword, intake.ts non-null assertion crash, @/wasm/bridge and @/data/document-templates unverified; MEDIUM: useAuth no error state, useAutoSave no isDirty/flush-on-unmount; 7 missing hooks for lib modules |
| catalog-config | 1 | 2026-03-04 | Navy+Gold palette fully defined; CRITICAL: email confirmations off in config (users access without verified email); HIGH: no toast library installed (UX dead end), no date library (deadline bug risk); MEDIUM: no VITE_APP_URL (QR/share links broken), no production auth guidance; LOW: no shadow tokens, no animation tokens, dark mode declared but not implemented |
| read-premium-spec | 1 | 2026-03-04 | 23 premium features cataloged; 7 packages not installed (@react-pdf/renderer, jszip, react-markdown×3, qrcode.react, react-d3-tree); 4 migrations unconfirmed (003,004,008,009); FirmProfileProvider missing; createOrganization missing; /cases/:id/tax route absent; /settings/team unregistered; toast+date libraries needed; 1 new verification aspect added (verify-migration-columns) |
