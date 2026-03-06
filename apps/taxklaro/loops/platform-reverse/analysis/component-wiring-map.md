# Component Wiring Map — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** route-table, computation-management, sharing, navigation, supabase-auth-flow, org-model

---

## Summary

Every component in TaxKlaro mapped to a parent route, navigation path, trigger (for dialogs/sheets/modals), and props source. Zero orphans. The forward loop's orphan_scan() must verify every component is reachable from a route. Additionally, every action-triggered feature has its trigger documented here (see Section 5 for action triggers).

**Total components: 75**
- Layout components: 4
- Page-level components: 20
- Computation components: 18
- Results view sub-components: 12
- Wizard step components: 14
- Client components: 3
- Deadline components: 2
- Settings components: 8
- Sharing components: 3
- Shared/utility components: 6
- PDF components: 1
- Setup/onboarding: 2

---

## 1. Component Directory Structure

```
src/
  components/
    layout/
      AppLayout.tsx                    — outer shell
      SidebarContent.tsx               — shared nav body
    TaxKlaroLogo.tsx                   — logo wordmark
    pages/
      LandingPage.tsx                  — unauth home
      DashboardPage.tsx                — auth home
      SetupPage.tsx                    — missing env vars
    computation/
      ComputationCard.tsx              — list card
      ComputationCardSkeleton.tsx      — loading skeleton
      ComputationPageHeader.tsx        — detail page header
      ActionsBar.tsx                   — detail page actions
      WizardPage.tsx                   — multi-step wizard container
      WizardForm.tsx                   — wizard in edit-mode (non-paginated)
      ResultsView.tsx                  — computation output display
      AutoSaveIndicator.tsx            — saving status
      ShareToggle.tsx                  — share enable/disable + URL
      DeleteComputationDialog.tsx      — confirm delete
      NotesList.tsx                    — append-only notes
      AddNoteForm.tsx                  — add note textarea
      DeadlinesList.tsx                — deadlines tab content
      QuarterlyBreakdownView.tsx       — quarterly-specific view
    wizard/
      steps/
        WizardStep00.tsx               — mode selection
        WizardStep01.tsx               — taxpayer profile
        WizardStep02.tsx               — business type
        WizardStep03.tsx               — tax year / filing period
        WizardStep04.tsx               — gross receipts
        WizardStep05.tsx               — compensation income (mixed only)
        WizardStep06.tsx               — expense method
        WizardStep07A.tsx              — itemized expenses general
        WizardStep07B.tsx              — itemized expenses financial
        WizardStep07C.tsx              — itemized expenses depreciation
        WizardStep07D.tsx              — itemized expenses NOLCO
        WizardStep08.tsx               — CWT Form 2307
        WizardStep09.tsx               — prior quarterly payments
        WizardStep10.tsx               — registration / VAT
        WizardStep11.tsx               — regime election
        WizardStep12.tsx               — filing details
        WizardStep13.tsx               — prior year credits
      WizardProgressBar.tsx            — progress indicator
      WizardNavControls.tsx            — Back / Continue buttons
    results/
      WarningsBanner.tsx               — RV-02 warnings
      RegimeComparisonTable.tsx        — RV-03 comparison
      RecommendationBanner.tsx         — RV-04 recommendation callout
      TaxBreakdownPanel.tsx            — RV-05 breakdown
      BalancePayableSection.tsx        — RV-06 balance / overpayment
      InstallmentSection.tsx           — RV-07 installment option
      PercentageTaxSummary.tsx         — RV-08 percentage tax
      BirFormRecommendation.tsx        — RV-09 form recommendation
      PenaltySummary.tsx               — RV-10 late filing penalties
      ManualReviewFlags.tsx            — RV-11 flags
      PathDetailAccordion.tsx          — RV-12 path detail
    clients/
      ClientsTable.tsx                 — sortable table
      ClientRowSkeleton.tsx            — loading skeleton
      ClientInfoCard.tsx               — client detail card
    deadlines/
      DeadlineCard.tsx                 — single deadline row
    settings/
      PersonalInfoSection.tsx          — name / password
      FirmBrandingSection.tsx          — logo / colors
      BirInfoSection.tsx               — RDO / TIN fields
      DangerZoneSection.tsx            — delete account
      MembersTable.tsx                 — current team members
      PendingInvitationsTable.tsx      — pending invites
      InviteMemberForm.tsx             — invite email + role
    shared-computation/
      SharedComputationView.tsx        — public share page content
      SharedComputationNotFound.tsx    — share link invalid
    shared/
      AutoSaveIndicator.tsx            — saving status indicator
      EmptyState.tsx                   — empty list state
      PageHeader.tsx                   — page title + primary action
      FilterBar.tsx                    — tab + select filters
      PesoInput.tsx                    — ₱ currency input
      MoneyDisplay.tsx                 — formatted peso value display
    pdf/
      TaxComputationDocument.tsx       — @react-pdf/renderer PDF
    onboarding/
      OnboardingForm.tsx               — org creation form
```

---

## 2. Full Wiring Table

| Component | Type | Parent | Route Path | Navigation | Trigger | Props Source |
|-----------|------|--------|------------|------------|---------|--------------|
| **LAYOUT** | | | | | | |
| `AppLayout` | Layout | `routes/__root.tsx` RootLayout | All auth routes | — | Auto (non-public routes) | `children: ReactNode` |
| `SidebarContent` | Layout | `AppLayout` | All auth routes | — | Always rendered | `pathname`, `user`, `onSignOut` from AppLayout |
| `TaxKlaroLogo` | UI | `AppLayout`, `SidebarContent` | All auth routes | — | Always rendered | `className?: string` |
| `SetupPage` | Page | `src/lib/supabase.ts` → `main.tsx` | Any route | — | VITE_SUPABASE_URL missing | none |
| **INDEX** | | | | | | |
| `LandingPage` | Page | `routes/index.tsx` IndexPage | `/` | Direct URL / logo click | `auth.user === null` | none |
| `DashboardPage` | Page | `routes/index.tsx` IndexPage | `/` | Sidebar "Dashboard" | `auth.user !== null` | `useAuth()` + Supabase queries |
| `RecentComputations` | Widget | `DashboardPage` | `/` | Via DashboardPage | Always (dashboard section) | `computations: ComputationListItem[]` (last 5) |
| `UpcomingDeadlines` | Widget | `DashboardPage` | `/` | Via DashboardPage | Always (dashboard section) | `deadlines: ComputationDeadline[]` (next 3) |
| `QuickActions` | Widget | `DashboardPage` | `/` | Via DashboardPage | Always (dashboard section) | `orgPlan` from `useOrganization()` |
| **AUTH** | | | | | | |
| `AuthPage` | Page | `routes/auth.tsx` | `/auth` | Redirect from beforeLoad / "Sign In" link | Route match | `search.mode: 'signin' \| 'signup'`, `search.redirect` |
| `AuthCallbackPage` | Page | `routes/auth/callback.tsx` | `/auth/callback` | Supabase email confirmation link | Route match | URL `?code=` param |
| `AuthResetPage` | Page | `routes/auth/reset.tsx` | `/auth/reset` | "Forgot password?" link on AuthPage | Route match | none |
| `AuthResetConfirmPage` | Page | `routes/auth/reset-confirm.tsx` | `/auth/reset-confirm` | Supabase password reset email | Route match | URL hash `#access_token=` |
| **ONBOARDING** | | | | | | |
| `OnboardingPage` | Page | `routes/onboarding.tsx` | `/onboarding` | Post-signup redirect / `useOrganization()` redirect | Route match | `useAuth()` |
| `OnboardingForm` | Form | `OnboardingPage` | `/onboarding` | Via OnboardingPage | Always rendered | `userId` from auth, `onSuccess` callback |
| **INVITE** | | | | | | |
| `InviteAcceptPage` | Page | `routes/invite/$token.tsx` | `/invite/$token` | Email invitation link | Route match | `params.token` from URL |
| **COMPUTATIONS LIST** | | | | | | |
| `ComputationsPage` | Page | `routes/computations/index.tsx` | `/computations` | Sidebar "Computations" | Route match | `listComputations(orgId)` |
| `ComputationCard` | Card | `ComputationsPage` | `/computations` | Via ComputationsPage grid | Always (per computation) | `computation: ComputationListItem`, `onDelete`, `onArchive` callbacks |
| `ComputationCardSkeleton` | Skeleton | `ComputationsPage` | `/computations` | Via ComputationsPage | While loading | none |
| `FilterBar` | Widget | `ComputationsPage` | `/computations` | Via ComputationsPage | Always (above grid) | `activeStatus`, `activeTaxYear`, `onStatusChange`, `onTaxYearChange` |
| `EmptyState` (computations) | UI | `ComputationsPage` | `/computations` | Via ComputationsPage | `computations.length === 0` | `icon`, `title`, `description`, `ctaLabel`, `onCta` |
| `DeleteComputationDialog` | Dialog | `ComputationsPage` + `ComputationDetailPage` | `/computations`, `/computations/$compId` | "Delete" in ComputationCard dropdown / ActionsBar dropdown | User clicks "Delete" | `computation.title`, `onConfirm`, `onCancel` |
| **NEW COMPUTATION** | | | | | | |
| `NewComputationPage` | Page | `routes/computations/new.tsx` | `/computations/new` | Sidebar "New Computation" / "New Computation" buttons | Route match | `useAuth()`, `useOrganization()`, `search.clientId?` |
| `WizardPage` | Wizard | `NewComputationPage` | `/computations/new` | Via NewComputationPage | `computationId` resolved | `computationId: string`, `initialInput?: TaxpayerInput`, `clientId?: string`, `onComplete: (compId: string) => void` |
| `WizardProgressBar` | UI | `WizardPage` | `/computations/new` + edit wizard | Via WizardPage | Always (wizard header) | `currentStep: number`, `totalSteps: number`, `completedSteps: number[]` |
| `WizardNavControls` | UI | `WizardPage` | `/computations/new` + edit wizard | Via WizardPage | Always (wizard footer) | `onBack`, `onContinue`, `continueLabel`, `isLastStep`, `isLoading` |
| **WIZARD STEPS** (rendered by `WizardPage` based on step index) | | | | | | |
| `WizardStep00` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 0 | `value: FilingMode`, `onChange` |
| `WizardStep01` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 1 | `value: TaxpayerProfile`, `onChange` |
| `WizardStep02` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 2 | `value: BusinessType`, `onChange` |
| `WizardStep03` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 3 | `value: TaxYearInfo`, `onChange` |
| `WizardStep04` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 4 | `value: GrossReceiptsInfo`, `onChange` |
| `WizardStep05` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 5 (mixed income only) | `value: CompensationInfo`, `onChange` |
| `WizardStep06` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 6 | `value: ExpenseMethod`, `onChange` |
| `WizardStep07A` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 7 (if itemized) | `value: ItemizedExpensesGeneral`, `onChange` |
| `WizardStep07B` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 7b (if itemized) | `value: ItemizedExpensesFinancial`, `onChange` |
| `WizardStep07C` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 7c (if itemized) | `value: DepreciationAssets[]`, `onChange` |
| `WizardStep07D` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 7d (if NOLCO applies) | `value: NolcoInfo`, `onChange` |
| `WizardStep08` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 8 | `value: CwtCredits[]`, `onChange` |
| `WizardStep09` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 9 (quarterly only) | `value: QuarterlyPayments`, `onChange` |
| `WizardStep10` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 10 | `value: RegistrationInfo`, `onChange` |
| `WizardStep11` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 11 (locked regime) | `value: RegimeElection`, `onChange` |
| `WizardStep12` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 12 | `value: FilingDetails`, `onChange` |
| `WizardStep13` | Step | `WizardPage` | `/computations/new` | Via WizardPage | Step index 13 | `value: PriorYearCredits`, `onChange` |
| **COMPUTATION DETAIL** | | | | | | |
| `ComputationDetailPage` | Page | `routes/computations/$compId.tsx` | `/computations/$compId` | ComputationCard click / link | Route match | `params.compId`, `loadComputation(compId)` |
| `ComputationPageHeader` | Header | `ComputationDetailPage` | `/computations/$compId` | Via ComputationDetailPage | Always rendered | `computation: ComputationRow`, `saveStatus: AutoSaveStatus`, `onTitleSave` |
| `AutoSaveIndicator` | UI | `ComputationPageHeader` + `WizardPage` | `/computations/$compId`, `/computations/new` | Via parent | Always (in header) | `status: AutoSaveStatus` |
| `ActionsBar` | Toolbar | `ComputationPageHeader` | `/computations/$compId` | Via ComputationDetailPage | Always (when computation loaded) | `computation: ComputationRow`, `canShare: boolean` (from org plan), `onCompute`, `onFinalize`, `onUnlock`, `onExportPdf`, `onShareOpen`, `onArchive`, `onDelete` |
| `WizardForm` | Form | `ComputationDetailPage` (Input tab) | `/computations/$compId` | Clicks "Input" tab | Tab selection | `computation: ComputationRow`, `readOnly: boolean` (true if finalized) |
| `ResultsView` | View | `ComputationDetailPage` (Results tab) + `SharedComputationView` | `/computations/$compId`, `/share/$token` | Tab selection (detail) / always (share) | `output_json !== null` | `result: TaxComputationResult`, `readOnly?: boolean` |
| `NotesList` | List | `ComputationDetailPage` (Notes tab) | `/computations/$compId` | Clicks "Notes" tab | Tab selection | `notes: ComputationNote[]`, `currentUserId: string` |
| `AddNoteForm` | Form | `ComputationDetailPage` (Notes tab) | `/computations/$compId` | Clicks "Notes" tab | Always (below NotesList) | `computationId: string`, `userId: string`, `onAdded: () => void` |
| `DeadlinesList` | List | `ComputationDetailPage` (Deadlines tab) | `/computations/$compId` | Clicks "Deadlines" tab | Tab selection | `deadlines: ComputationDeadline[]`, `onComplete: (id: string) => void` |
| **RESULTS VIEW SUB-COMPONENTS** (all inside `ResultsView`) | | | | | | |
| `WarningsBanner` | Banner | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | `result.warnings.length > 0` | `warnings: TaxWarning[]` |
| `RegimeComparisonTable` | Table | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always | `paths: FormOutput[]`, `recommendedPath: TaxRegimePath` |
| `RecommendationBanner` | Banner | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always | `recommendation: RecommendationResult` |
| `TaxBreakdownPanel` | Panel | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always (selected path) | `path: FormOutput`, `selectedRegime: TaxRegimePath` |
| `BalancePayableSection` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always | `balanceDue: string \| null`, `overpayment: string \| null` |
| `InstallmentSection` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | `installmentEligible === true` | `installmentAmount: string`, `deadlines: string[]` |
| `PercentageTaxSummary` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | `percentageTax !== null` | `percentageTax: PercentageTaxResult` |
| `BirFormRecommendation` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always | `formType: BirFormType`, `formVariant: BirFormVariant` |
| `PenaltySummary` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | `penalties !== null` | `penalties: PenaltyResult` |
| `ManualReviewFlags` | Section | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | `mrfFlags.length > 0` | `flags: ManualReviewFlag[]` |
| `PathDetailAccordion` | Accordion | `ResultsView` | `/computations/$compId` (Results tab), `/share/$token` | Via ResultsView | Always (expandable detail) | `paths: FormOutput[]` |
| **QUARTERLY** | | | | | | |
| `ComputationQuarterlyPage` | Page | `routes/computations/$compId.quarterly.tsx` | `/computations/$compId/quarterly` | "Quarterly" tab/link in ComputationDetailPage | Route match | `params.compId`, `loadComputation(compId)` |
| `QuarterlyBreakdownView` | View | `ComputationQuarterlyPage` | `/computations/$compId/quarterly` | Via ComputationQuarterlyPage | `output_json !== null` | `result: TaxComputationResult` |
| **SHARING** | | | | | | |
| `ShareToggle` | Widget | Sheet (`SharePanel`) inside `ComputationDetailPage` | `/computations/$compId` | "Share" button in ActionsBar | `setSharePanelOpen(true)` | `computationId`, `shareToken`, `shareEnabled`, `onShareChange` |
| `SharedComputationView` | Page | `routes/share/$token.tsx` SharePage | `/share/$token` | External share link | `data !== null && data.outputJson !== null` | `computation: SharedComputationData` |
| `SharedComputationNotFound` | Page | `routes/share/$token.tsx` SharePage | `/share/$token` | External share link | `data === null` | none |
| **CLIENTS** | | | | | | |
| `ClientsPage` | Page | `routes/clients/index.tsx` | `/clients` | Sidebar "Clients" | Route match | `listClients(orgId)` |
| `ClientsTable` | Table | `ClientsPage` | `/clients` | Via ClientsPage | `clients.length > 0` | `clients: ClientRow[]`, `onArchive` |
| `ClientRowSkeleton` | Skeleton | `ClientsPage` | `/clients` | Via ClientsPage | While loading | none |
| `EmptyState` (clients) | UI | `ClientsPage` | `/clients` | Via ClientsPage | `clients.length === 0` | `icon=Users`, `title`, `description`, `onCta` |
| `NewClientPage` | Page | `routes/clients/new.tsx` | `/clients/new` | "Add Client" button in ClientsPage header | Route match | `useAuth()`, `useOrganization()` |
| `ClientDetailPage` | Page | `routes/clients/$clientId.tsx` | `/clients/$clientId` | Row click in ClientsTable | Route match | `params.clientId`, Supabase query |
| `ClientInfoCard` | Card | `ClientDetailPage` | `/clients/$clientId` | Via ClientDetailPage | Always | `client: ClientRow` |
| **DEADLINES** | | | | | | |
| `DeadlinesPage` | Page | `routes/deadlines.tsx` | `/deadlines` | Sidebar "Deadlines" | Route match | Supabase computation_deadlines query |
| `DeadlineCard` | Card | `DeadlinesPage` | `/deadlines` | Via DeadlinesPage (grouped by month) | Per deadline | `deadline: ComputationDeadline`, `onComplete` |
| **SETTINGS** | | | | | | |
| `SettingsPage` | Page | `routes/settings/index.tsx` | `/settings` | Sidebar "Settings" | Route match | `user_profiles`, `organizations` Supabase queries |
| `PersonalInfoSection` | Section | `SettingsPage` | `/settings` | Via SettingsPage (first section) | Always | `profile: UserProfile`, `onSave` |
| `FirmBrandingSection` | Section | `SettingsPage` | `/settings` | Via SettingsPage (second section) | Always | `org: OrgRow`, `profile: UserProfile`, `onSave` |
| `BirInfoSection` | Section | `SettingsPage` | `/settings` | Via SettingsPage (third section) | Always | `profile: UserProfile`, `onSave` |
| `DangerZoneSection` | Section | `SettingsPage` | `/settings` | Via SettingsPage (fourth section) | `userRole === 'admin'` | `userId: string`, `orgId: string` |
| `TeamSettingsPage` | Page | `routes/settings/team.tsx` | `/settings/team` | "Team" tab/link in SettingsPage | Route match | `organization_members`, `organization_invitations` queries |
| `MembersTable` | Table | `TeamSettingsPage` | `/settings/team` | Via TeamSettingsPage | Always | `members: MemberRow[]`, `currentUserId`, `onRemove` |
| `PendingInvitationsTable` | Table | `TeamSettingsPage` | `/settings/team` | Via TeamSettingsPage | `invitations.length > 0` | `invitations: InvitationRow[]`, `onRevoke` |
| `InviteMemberForm` | Form | `TeamSettingsPage` | `/settings/team` | Via TeamSettingsPage | `canInvite` (below seat limit) | `orgId: string`, `onInvited: () => void` |
| **PDF** | | | | | | |
| `TaxComputationDocument` | PDF | Lazy-loaded, invoked from `ActionsBar` | `/computations/$compId` | "Export PDF" button in ActionsBar | `handleExportPdf()` async function | `result: TaxComputationResult`, `firmProfile: UserProfile`, `computation: ComputationRow` |
| **SHARED UI** | | | | | | |
| `EmptyState` | UI | Multiple pages (see above) | Varies | Via parent page | `list.length === 0` | `icon`, `title`, `description`, `ctaLabel?`, `onCta?` |
| `PageHeader` | UI | Multiple pages | Varies | Via parent page | Always (page top) | `title: string`, `action?: { label, onClick, icon }` |
| `PesoInput` | Input | Wizard steps (WizardStep04, 07A, 07B, 07C, 07D, 08, 09, 13) | `/computations/new`, `/computations/$compId` | Via wizard steps | Field render | `value: string`, `onChange`, `label`, `required`, `error?` |
| `MoneyDisplay` | UI | `ResultsView` sub-components, `ComputationCard` | Varies | Via parent | Data display | `amount: string`, `currency?: 'PHP'`, `size?: 'sm' \| 'md' \| 'lg'` |

---

## 3. Orphan Prevention Rules

### Rule 1: No route-level component without a route
Every component listed as Type=Page must have a corresponding route in `src/router.ts`. The orphan scan must verify that every file in `src/routes/**/*.tsx` has a route definition AND is registered in the router tree.

### Rule 2: No sub-component without a parent
Every component NOT listed as Type=Page must be imported by at least one other component. The scan must verify the import chain reaches a route file.

### Rule 3: Wizard steps must all be imported by WizardPage
All 17 WizardStep*.tsx files (WS-00 through WS-13, including 07A/B/C/D) must be imported inside `WizardPage.tsx`. A wizard step that is not imported cannot be rendered, even if its step index is reached.

### Rule 4: ResultsView sub-components must all be imported by ResultsView
All 11 components in `src/components/results/` must be imported by `ResultsView.tsx`. These components are NOT rendered directly by any route — they are only reachable through ResultsView → SharedComputationView or ResultsView → ComputationDetailPage.

### Rule 5: PDF component must have an explicit trigger
`TaxComputationDocument` is lazy-loaded. The orphan scan will NOT find it via static import analysis. The forward loop must verify its trigger path:
1. `ActionsBar.tsx` contains an "Export PDF" button
2. `onClick` calls `handleExportPdf()` in `ComputationDetailPage`
3. `handleExportPdf()` uses dynamic `import('@/components/pdf/TaxComputationDocument')`
4. Renders PDF and triggers browser download

### Rule 6: EmptyState is a shared component, not a page
`EmptyState` is instantiated by 3+ parent pages. It must NOT be confused with a page component. The forward loop should create it in `src/components/shared/EmptyState.tsx` and import it in each consuming page.

---

## 4. Navigation Paths (From Home Screen)

| Component | Steps to reach |
|-----------|---------------|
| `LandingPage` | 1. Open `/` when not signed in |
| `DashboardPage` | 1. Open `/` when signed in (or click "Dashboard" in sidebar) |
| `AuthPage` | 1. Click "Sign In" on LandingPage OR redirect from `beforeLoad` |
| `ComputationsPage` | 1. Sign in → 2. Click "Computations" in sidebar |
| `ComputationCard` | 1. Sign in → 2. Click "Computations" in sidebar |
| `NewComputationPage` | 1. Sign in → 2. Click "New Computation" in sidebar |
| `WizardPage` | 1. Sign in → 2. Click "New Computation" → 3. computationId resolves |
| `WizardStep00` | 1. Via WizardPage (first step) |
| `ComputationDetailPage` | 1. Sign in → 2. Click "Computations" → 3. Click a ComputationCard |
| `ResultsView` | 1. Computations → card → 2. Click "Results" tab (or auto-shown after compute) |
| `QuarterlyBreakdownView` | 1. Computations → card → 2. Click "Quarterly" link/tab |
| `SharePage` | 1. Open share link (unauthenticated OK) |
| `SharedComputationView` | 1. Open share link with valid token |
| `ClientsPage` | 1. Sign in → 2. Click "Clients" in sidebar |
| `ClientDetailPage` | 1. Sign in → 2. Clients → 3. Click client row |
| `NewClientPage` | 1. Sign in → 2. Clients → 3. Click "Add Client" |
| `DeadlinesPage` | 1. Sign in → 2. Click "Deadlines" in sidebar |
| `SettingsPage` | 1. Sign in → 2. Click "Settings" in sidebar |
| `TeamSettingsPage` | 1. Settings → 2. Click "Team" link |
| `OnboardingPage` | 1. Create account → email confirm → auto-redirect |
| `InviteAcceptPage` | 1. Click invitation link from email |

---

## 5. Action Trigger Map

For action-triggered features (not navigation-triggered), every trigger button is specified. This prevents the inheritance failure where entire infrastructure was built but no button existed to trigger it.

| Feature | Trigger Button | Icon | Parent Component | onClick Handler | Feedback |
|---------|---------------|------|-----------------|----------------|----------|
| **Run computation** | "Compute" (primary, blue) | `Zap` | `ActionsBar` | `handleCompute()` → calls `runCompute(input)` via `useCompute()`, then `saveComputationOutput(compId, result)`, switches to Results tab | Loading spinner in button, "Computed!" toast |
| **Re-compute** | "Re-compute" | `RefreshCw` | `ActionsBar` | Same as "Compute" — clears current output first | "Re-computing..." in button |
| **Finalize** | "Finalize" | `Lock` | `ActionsBar` | `handleFinalize()` → `updateComputationStatus(compId, 'computed', 'finalized')` | "Computation finalized" toast + status badge updates |
| **Unlock computation** | "Unlock" | `LockOpen` | `ActionsBar` | `handleUnlock()` → `updateComputationStatus(compId, 'finalized', 'computed')` | "Unlocked for editing" toast |
| **Export PDF** | "Export PDF" | `Download` | `ActionsBar` | `handleExportPdf()` → lazy `import('@/components/pdf/TaxComputationDocument')` → renders and downloads | "Preparing PDF..." toast, then "PDF downloaded" or error toast |
| **Open share panel** | "Share" (disabled if FREE plan) | `Share2` | `ActionsBar` | `setSharePanelOpen(true)` | Sheet slides in from right |
| **Toggle share on** | `Switch` (ON) | — | `ShareToggle` inside Sheet | `handleToggle(true)` → `setShareEnabled(compId, true)` | "Sharing enabled" success toast + URL appears |
| **Toggle share off** | `Switch` (OFF) | — | `ShareToggle` inside Sheet | `handleToggle(false)` → `setShareEnabled(compId, false)` | "Share link disabled" info toast |
| **Copy share URL** | "Copy" | `Copy` | `ShareToggle` | `handleCopy()` → `copyShareUrl(token)` → `navigator.clipboard.writeText` | "Link copied to clipboard" toast |
| **Rotate share link** | "Rotate link" (ghost, small) | `RefreshCw` | `ShareToggle` | `handleRotate()` → `rotateShareToken(compId)` → updates `currentToken` state | "Share link rotated" toast |
| **Archive computation** | "Archive" in dropdown | `Archive` | `ActionsBar` dropdown (`MoreHorizontal`) | `handleArchive()` → confirm dialog → `updateComputationStatus(compId, status, 'archived')` | "Computation archived" toast |
| **Delete computation** | "Delete" in dropdown | `Trash2` | `ActionsBar` dropdown OR `ComputationCard` dropdown | Opens `DeleteComputationDialog` → confirm → `deleteComputation(compId)` → navigate to `/computations` | "Computation deleted" toast |
| **Edit title inline** | Title text (cursor-text) | — | `ComputationPageHeader` | Click title → `<input>` appears → blur/Enter → `supabase.update({ title })` | "Saved" toast (or silent) |
| **Add note** | "Add Note" | `Send` | `AddNoteForm` | `handleAddNote()` → `addComputationNote(compId, userId, content)` → refetches notes | "Note added" toast |
| **Mark deadline complete** | Checkbox | — | `DeadlineCard` | `onComplete(deadline.id)` → Supabase UPDATE `completed_date` | Visual: checkbox checked + strikethrough |
| **Send team invitation** | "Send Invitation" | `UserPlus` | `InviteMemberForm` | `handleInvite()` → Supabase RPC `invite_member(email, role, orgId)` | "Invitation sent to {email}" toast |
| **Remove team member** | "Remove" | `UserMinus` | `MembersTable` row | Confirm dialog → `supabase.delete()` from `organization_members` | "Team member removed" toast |
| **Revoke invitation** | "Revoke" | `X` | `PendingInvitationsTable` row | `supabase.update({ status: 'revoked' })` | "Invitation revoked" toast |
| **Save firm settings** | "Save Changes" | `Save` | `FirmBrandingSection`, `PersonalInfoSection`, `BirInfoSection` | Supabase UPDATE on `user_profiles` + `organizations` | "Settings saved" toast |
| **Upload firm logo** | "Upload Logo" | `Upload` | `FirmBrandingSection` | Opens file picker → `supabase.storage.upload()` to firm-logos bucket | "Logo uploaded" toast |
| **Accept invitation** | "Accept Invitation" | `Check` | `InviteAcceptPage` | `acceptInvitation(token)` → RPC `accept_invitation(token::UUID)` | Navigates to `/` |
| **Create organization** | "Create Firm" | — | `OnboardingForm` | `createOrganization(name, slug)` → RPC | Navigates to `/computations` |
| **Sign out** | "Sign Out" | `LogOut` | `SidebarContent` | `signOut()` → `supabase.auth.signOut()` | Router redirects to `/auth` |

---

## 6. Wizard Step to Field Mapping

The `WizardPage` renders one step at a time. The step index may change based on taxpayer type (some steps are conditional). The routing matrix specifies which steps appear for each taxpayer type.

**Step routing matrix:**

| Step | Component | Shown When |
|------|-----------|------------|
| WS-00 | `WizardStep00` | Always (first step) |
| WS-01 | `WizardStep01` | Always |
| WS-02 | `WizardStep02` | Always |
| WS-03 | `WizardStep03` | Always |
| WS-04 | `WizardStep04` | Always |
| WS-05 | `WizardStep05` | `taxpayerType === 'MIXED_INCOME'` |
| WS-06 | `WizardStep06` | `eightPercentEligible === false OR opted out` |
| WS-07A | `WizardStep07A` | `expenseMethod === 'ITEMIZED'` |
| WS-07B | `WizardStep07B` | `expenseMethod === 'ITEMIZED'` |
| WS-07C | `WizardStep07C` | `expenseMethod === 'ITEMIZED'` |
| WS-07D | `WizardStep07D` | `expenseMethod === 'ITEMIZED' AND hasNolco` |
| WS-08 | `WizardStep08` | Always (may have zero credits) |
| WS-09 | `WizardStep09` | `filingMode === 'QUARTERLY'` |
| WS-10 | `WizardStep10` | Always |
| WS-11 | `WizardStep11` | `eightPercentEligible === true` |
| WS-12 | `WizardStep12` | Always |
| WS-13 | `WizardStep13` | Always |

**WizardPage step management:**
```typescript
// src/components/computation/WizardPage.tsx

// Compute which steps are active given current input state
function computeActiveSteps(input: Partial<TaxpayerInput>): WizardStepId[] {
  const steps: WizardStepId[] = ['WS00', 'WS01', 'WS02', 'WS03', 'WS04'];

  if (input.taxpayerType === 'MIXED_INCOME') steps.push('WS05');

  // 8% flat rate only eligible if not mixed income and receipts <= 3M
  const eightPctEligible =
    input.taxpayerType === 'PURELY_SELF_EMPLOYED' &&
    (input.grossReceiptsAmount ?? 0) <= 3_000_000;

  if (!eightPctEligible) {
    steps.push('WS06');
    if (input.expenseMethod === 'ITEMIZED') {
      steps.push('WS07A', 'WS07B', 'WS07C');
      if (input.hasNolco) steps.push('WS07D');
    }
  } else {
    steps.push('WS11'); // regime election for 8% choice
  }

  steps.push('WS08');

  if (input.filingMode === 'QUARTERLY') steps.push('WS09');

  steps.push('WS10', 'WS12', 'WS13');

  return steps;
}
```

---

## 7. WizardForm (Edit Mode)

`WizardForm` is used in `ComputationDetailPage` "Input" tab when viewing an existing computation. Unlike `WizardPage` (which is paginated), `WizardForm` renders all applicable steps as vertically stacked sections (not paginated). This allows accountants to review/edit all inputs at once.

**Key differences from WizardPage:**
- Not paginated — all steps visible as sections
- `readOnly={true}` when computation is `finalized`
- Saves immediately on field change (auto-save via `useAutoSave`)
- No "Continue" / "Back" buttons — only "Save" (implicit via auto-save)
- Shows "Locked — Unlock to edit" banner when `finalized`

---

## 8. ResultsView ReadOnly Contract

`ResultsView` accepts `readOnly?: boolean` (default: `false`).

| Condition | `readOnly` | What changes |
|-----------|-----------|-------------|
| `ComputationDetailPage` (Results tab) | `false` | Full actions visible (export, share, finalize) |
| `SharedComputationView` (share link) | `true` | ActionsBar hidden entirely; no export, no share toggle, no finalize |

The `readOnly` prop is forwarded from `ResultsView` down to every sub-component that contains action buttons. Sub-components with no action buttons ignore the prop.

---

## 9. File Count Summary

| Directory | Files |
|-----------|-------|
| `src/routes/` | 18 route files |
| `src/components/layout/` | 2 files |
| `src/components/pages/` | 3 files (Landing, Dashboard, Setup) |
| `src/components/computation/` | 12 files |
| `src/components/wizard/steps/` | 17 step files |
| `src/components/wizard/` | 2 files (ProgressBar, NavControls) |
| `src/components/results/` | 11 files |
| `src/components/clients/` | 3 files |
| `src/components/deadlines/` | 1 file |
| `src/components/settings/` | 7 files |
| `src/components/shared-computation/` | 2 files |
| `src/components/shared/` | 5 files |
| `src/components/pdf/` | 1 file |
| `src/components/onboarding/` | 1 file |
| `src/components/` | 1 file (TaxKlaroLogo) |
| **Total** | **90 component files** |

---

## 10. Critical Traps

1. **PDF component is dynamic import — orphan scan will miss it.** The forward loop's orphan scan finds components that are NOT statically imported by any route. `TaxComputationDocument` uses dynamic `import()` inside `handleExportPdf()`. The forward loop must either: (a) exclude dynamic imports from orphan detection, or (b) add a comment in `ActionsBar.tsx` noting the dynamic import so the orphan scan is aware. A static import in `ActionsBar` (even a commented-out `import`) is the simplest fix.

2. **WizardStep07A through WizardStep07D must ALL be imported in WizardPage.** Even if a step is conditionally rendered (e.g., WS-07D only when NOLCO applies), the file must be statically imported in `WizardPage.tsx`. The routing matrix uses runtime conditions to decide WHICH step to show — all 17 step components must be present as imports.

3. **QuarterlyBreakdownView is a separate route, not a tab.** The `/computations/$compId/quarterly` route renders `QuarterlyBreakdownView` directly. It is NOT a tab inside `ComputationDetailPage`. The "Quarterly" link in the detail page navigates to this separate route. If implemented as a tab inside `ComputationDetailPage`, it would be misaligned with the route table.

4. **`WizardForm` vs `WizardPage` are separate components.** `WizardPage` is the paginated new-computation wizard. `WizardForm` is the flat edit-mode form in the Input tab of `ComputationDetailPage`. They may share step sub-components but are NOT the same component rendered differently — they have different navigation models.

5. **`EmptyState` is a shared component used by multiple pages.** Do NOT create separate `ComputationsEmptyState`, `ClientsEmptyState`, etc. Use one `EmptyState` with `icon`, `title`, `description`, `ctaLabel`, `onCta` props.

6. **`ShareToggle` is inside a Sheet, not directly in ActionsBar.** The "Share" button in `ActionsBar` sets `sharePanelOpen=true`. The `ShareToggle` component is inside a `<Sheet>` (slide-in panel) in `ComputationDetailPage`. `ActionsBar` does NOT directly render `ShareToggle` — it only renders the trigger button. The Sheet and `ShareToggle` are siblings of ActionsBar, both children of `ComputationDetailPage`.

7. **`RecentComputations` and `UpcomingDeadlines` in Dashboard are widget components, not page components.** They appear inside `DashboardPage` and are not routable on their own. They use the same `listComputations()` and deadline queries as their full-page equivalents, but with `LIMIT 5` and `LIMIT 3` respectively.

8. **`SetupPage` is mounted before routing.** In `main.tsx`, before rendering `RouterProvider`, check if `supabaseConfigured` is false and short-circuit to `<SetupPage />`. The `SetupPage` never appears in the route table — it replaces the entire app when env vars are missing.
