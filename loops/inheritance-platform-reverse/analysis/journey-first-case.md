# Analysis: journey-first-case
**Wave**: 2 — User Journey Audit
**Date**: 2026-03-04
**Rating**: BROKEN

Walk: authenticated user creates first case → fills wizard → computes → sees results.
Is the flow discoverable? Are there dead ends?

---

## Entry Points

### Authenticated user flow
1. Lands on `/` (Dashboard) → sees "Welcome back. Use 'New Case'…" + `<Link to="/cases/new"><Button>New Case</Button></Link>`
2. Sidebar nav → "New Case" link → `/cases/new`
3. Both paths lead to `CasesNewPage` (routes/cases/new.tsx)

### Discoverability
The "New Case" button on the Dashboard is a single CTA — discoverable. No ambiguity about where to start.

---

## Step-by-Step Journey

### Step 1: User arrives at `/cases/new`

- **Component**: `CasesNewPage` (routes/cases/new.tsx:24)
- **Initial state**: `{ phase: 'wizard' }`
- **Renders**: `<WizardContainer onSubmit={handleSubmit} />` — no `defaultInput`

**Gap JFC-001** — No auth guard: unauthenticated users reach the wizard and can compute results; results won't persist but there's no prompt to sign in.
**Gap JFC-002** — No case record created on entry: for authenticated users, there is no `createCase()` call at wizard start. Results computed here are always ephemeral.

---

### Step 2: User fills WizardContainer (5–6 steps)

**Component**: `components/wizard/WizardContainer.tsx`
**Form**: react-hook-form `useForm<EngineInput>` with steps rendered sequentially.

#### Steps shown:
| # | Key | Label | Conditional |
|---|-----|-------|-------------|
| 1 | estate | Estate Details | No |
| 2 | decedent | Decedent Details | No |
| 3 | family-tree | Family Tree | No |
| 4 | will | Will & Dispositions | Only when `hasWill=true` |
| 5 | donations | Donations | No |
| 6 | review | Review & Config | No |

#### Navigation
- "Next" button at WizardContainer nav level (line 246–250) — no per-step validation before advancing
- "Back" button appears from step 2 onward
- No "Cancel" button at the container level — user cannot abandon the wizard without using the browser back button

**Gap JFC-003** — No Next-button validation: user can advance through Estate step with `net_distributable_estate = 0`, Decedent step with empty `name`, Family Tree step with zero heirs. The ReviewStep shows pre-submission warnings (empty tree → escheat) but does not block submission.

**Gap JFC-004** — No Cancel button: WizardContainer (lines 233–262) has only Back/Next/Submit nav. GuidedIntakeForm has a Cancel button, but that component is never mounted in any route. No way to abandon the wizard without navigating away entirely.

**Gap JFC-005** — No wizard state persistence: if user navigates away (browser back, sidebar nav click) mid-wizard, all entered data is lost. Fresh wizard on return.

#### Dual Submit triggers on Review step (WizardContainer.tsx lines 244–259 + ReviewStep.tsx line 404–411)
When on the Review step (`currentStepIndex === visibleSteps.length - 1`), WizardContainer renders a nav-level **"Submit"** button (line 252–258, styled `bg-accent`). ReviewStep ALSO renders a **"Compute Distribution"** button (line 404–411, styled `bg-[hsl(var(--accent))]`). Both call `onSubmit(data)` independently. Two competing compute triggers on the final step.

**Gap JFC-006** — Dual Submit buttons: ReviewStep renders "Compute Distribution" (`w-full py-6` large button); WizardContainer nav renders "Submit" above/below. Both are visible simultaneously on the Review step. Fix: remove WizardContainer's nav Submit button when on the review step (let ReviewStep's "Compute Distribution" be the sole CTA).

---

### Step 3: Computing phase

```tsx
// routes/cases/new.tsx:27-37
const handleSubmit = async (data: EngineInput) => {
  setState({ phase: 'computing' });
  const output = await compute(data);
  setState({ phase: 'results', input: data, output });
};
```

**Renders**:
```tsx
<div className="flex items-center justify-center py-20">
  <div className="text-center">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
    <p className="text-muted-foreground">Computing distribution...</p>
  </div>
</div>
```

**Gap JFC-007** — Spinner inconsistency: uses raw CSS spinner, not `<Loader2>` from lucide-react. CaseEditorPage uses `<Loader2>` for its loading state. Pick one pattern.

**Gap JFC-008** — No timeout/abort handling: `compute()` is a WASM call (`@/wasm/bridge`). If it hangs, the user sees an infinite spinner with no way to cancel.

---

### Step 4: Results view (CRITICAL DEAD END)

```tsx
// routes/cases/new.tsx:58-63
{state.phase === 'results' && (
  <ResultsView
    input={state.input}
    output={state.output}
    onEditInput={handleEditInput}
  />
)}
```

**ResultsView renders** (components/results/ResultsView.tsx):
1. `ResultsHeader` — scenario badge, decedent name, estate total
2. `DistributionSection` — pie chart + heir table
3. `NarrativePanel` — accordion with heir narratives
4. `WarningsPanel` — alert cards (hidden when 0 warnings)
5. `ComputationLog` — collapsible pipeline log
6. `ActionsBar` — Edit Input | Export JSON | Copy Narratives

**Gap JFC-009 — CRITICAL: No "Save Case" action**: The entire `/cases/new` flow never creates a database record. `handleSubmit` in CasesNewPage calls only `compute(data)`. There is no `createCase()` or `supabase.from('cases').insert()` call anywhere in this route. Authenticated users who complete the wizard and see results have no way to persist them.

**Gap JFC-010 — CRITICAL: GuidedIntakeForm orphaned**: The 7-step `GuidedIntakeForm` (components/intake/GuidedIntakeForm.tsx) is a fully implemented CRM intake that:
- Runs conflict check, collects client details, decedent info, family composition, assets, settlement track
- Calls `supabase.from('clients').insert()` and `supabase.from('cases').insert()`
- Calls `onComplete(caseId, clientId)` on success

But this component is **never mounted in any route**. No `createRoute` references it. `/cases/new` uses `WizardContainer` (ephemeral computation) instead. The path to save a case with a linked client record is completely broken.

**Gap JFC-011**: ActionsBar has no `caseId` prop:

```typescript
// components/results/ActionsBar.tsx:10-14
export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
}
```

No `caseId`. No Share button. No PDF export button. The `ShareDialog` component (`components/case/ShareDialog.tsx`) exists and is complete, but is never rendered from any results flow.

**Gap JFC-012**: CaseEditorPage passes `caseId` to ResultsView (routes/cases/$caseId.tsx:110), but ResultsViewProps (components/results/ResultsView.tsx:13-17) doesn't declare it:

```typescript
// ResultsView — does NOT accept caseId
export interface ResultsViewProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
}
// CaseEditorPage passes:
<ResultsView input={...} output={...} onEditInput={...} caseId={caseId} />
// → caseId silently dropped
```

**Gap JFC-013**: No PDF export in ActionsBar. `EstatePDF` component (`components/pdf/EstatePDF.tsx`) with full PDF generation is implemented but ActionsBar has only Export JSON and Copy Narratives.

**Gap JFC-014**: Copy Narratives (`ActionsBar.tsx:36-41`) calls `navigator.clipboard.writeText()` with no success or error feedback — no toast, no button state change.

**Gap JFC-015**: Export JSON (`ActionsBar.tsx:16-25`) creates a blob and triggers download with no user feedback.

**Gap JFC-016**: No success transition feedback: silent state change from `computing` → `results`. No toast notification, no animation.

---

### Step 5: User wants to return to case later (BROKEN)

**Gap JFC-017**: No `/cases` list route exists (confirmed in catalog-routes). After computing results at `/cases/new`, the authenticated user has no way to find this computation again — it was never saved.

**Gap JFC-018**: Dashboard (`routes/index.tsx`) shows only a "New Case" button for authenticated users — no case list, no recent activity, no quick stats. There is nowhere to navigate to an existing case from.

**Gap JFC-019**: No "Open Saved Case" flow exists. The `/cases/$caseId` route loads a case from DB but there's no UI listing saved cases to navigate to it.

---

## Connected Route: `/cases/$caseId` (CaseEditorPage)

This route DOES save results to DB (`updateCaseInput`, `updateCaseOutput` in handleSubmit), and loads existing case data on mount. But:
- There's no flow that creates a case record and then routes here
- From `/cases/new`, successful computation goes to local results state, not this route
- The gap between "compute at `/cases/new`" and "persistent case at `/cases/$caseId`" is unbridged

---

## Journey Rating

| Phase | Status | Reason |
|-------|--------|--------|
| Entry / Discoverability | WORKING | New Case button visible on dashboard and sidebar |
| Wizard form (5-6 steps) | PARTIAL | Steps render correctly, no field validation on Next, no Cancel, dual Submit |
| Computing phase | PARTIAL | Works but raw spinner, no cancel/timeout |
| Results display | PARTIAL | All sections render, but ephemeral — no save, no share, no PDF |
| Post-compute save | BROKEN | No createCase() call anywhere in the new-case flow |
| Persistence / Return visit | BROKEN | No case list, no DB record created, navigate away = lost |

**Overall rating: BROKEN**

---

## Gap Summary

| ID | Severity | Gap | File | Fix |
|----|----------|-----|------|-----|
| JFC-001 | HIGH | No auth gate on `/cases/new` | routes/cases/new.tsx | Add `beforeLoad` redirect to `/auth` if no session |
| JFC-002 | CRITICAL | No case record created — entire flow is ephemeral | routes/cases/new.tsx | Replace WizardContainer with GuidedIntakeForm (or add createCase + redirect to `/cases/$caseId` post-compute) |
| JFC-003 | MEDIUM | No field validation on wizard Next | WizardContainer.tsx | Each step's "Next" button should call `trigger(stepFields)` before advancing |
| JFC-004 | MEDIUM | No Cancel button at wizard level | WizardContainer.tsx | Add Cancel button to nav bar that navigates to `/` with a confirmation dialog |
| JFC-005 | MEDIUM | No wizard state persistence | WizardContainer.tsx | Save form state to `sessionStorage` on each step change; restore on mount |
| JFC-006 | LOW | Dual Submit triggers on Review step | WizardContainer.tsx + ReviewStep.tsx | Remove WizardContainer nav Submit when `currentStep === 'review'`; use ReviewStep CTA only |
| JFC-007 | LOW | Spinner inconsistency | routes/cases/new.tsx:50-54 | Replace raw CSS spinner `div` with `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />` |
| JFC-008 | MEDIUM | No WASM timeout/cancel | routes/cases/new.tsx | Add 30s timeout wrapper around `compute(data)`; show error + retry option |
| JFC-009 | CRITICAL | No Save Case action in ActionsBar | components/results/ActionsBar.tsx | Add `caseId?: string` prop; when provided, show "Save" button that calls `updateCaseOutput(caseId, output)` |
| JFC-010 | CRITICAL | GuidedIntakeForm orphaned — never mounted | No route uses it | Mount GuidedIntakeForm in `/cases/new` for auth users; on `onComplete(caseId)` redirect to `/cases/$caseId` |
| JFC-011 | CRITICAL | ActionsBar has no caseId → no Share, no PDF | components/results/ActionsBar.tsx | Add `caseId?: string` prop; when provided, show Share button (opens ShareDialog) and PDF Export button |
| JFC-012 | HIGH | ResultsView doesn't accept caseId prop | components/results/ResultsView.tsx | Add `caseId?: string` to ResultsViewProps; pass through to ActionsBar |
| JFC-013 | HIGH | No PDF export in ActionsBar | components/results/ActionsBar.tsx | Add PDF export using `@react-pdf/renderer` PDFDownloadLink wrapping `EstatePDF` |
| JFC-014 | LOW | Copy Narratives: no clipboard feedback | components/results/ActionsBar.tsx | Show toast "Narratives copied to clipboard" on success; "Copy failed" on error |
| JFC-015 | LOW | Export JSON: no feedback | components/results/ActionsBar.tsx | Show toast "JSON exported" after download triggered |
| JFC-016 | LOW | No compute success feedback | routes/cases/new.tsx | Show toast "Computation complete" on transition to results phase |
| JFC-017 | CRITICAL | No `/cases` list route | src/routes/ | Add `routes/cases/index.tsx` with CasesListPage: sorted/filtered list of org cases |
| JFC-018 | CRITICAL | Dashboard shows no case list | routes/index.tsx | Replace static "Welcome back" text with case list: recent 5 cases + "View All" → `/cases` |
| JFC-019 | CRITICAL | No flow bridging new-case-compute to persistent case | routes/cases/new.tsx | After compute, call `createCase(orgId, userId, data, output)` → redirect to `/cases/${caseId}` |

---

## Architectural Fix Required

The correct authenticated first-case flow:

```
/cases/new (auth required)
  ├── if user has org:
  │     → GuidedIntakeForm (7-step: conflict check, client details, decedent, family, assets, settlement, review)
  │     → onComplete(caseId, clientId)
  │     → redirect to /cases/$caseId
  │         → CaseEditorPage loads case
  │         → wizard populated with intake data
  │         → user clicks "Compute" → results saved to DB
  │         → ResultsView with Save/Share/PDF actions
  └── if user has no org yet:
        → trigger org creation flow (modal or redirect to /onboarding)
        → then proceed to GuidedIntakeForm
```

Currently: GuidedIntakeForm is complete and correct but orphaned. The `/cases/new` route uses the standalone `WizardContainer` instead, which only computes without saving.

**Minimal fix path**:
1. `routes/cases/new.tsx` — swap `WizardContainer` for `GuidedIntakeForm` (requires `orgId` + `userId`)
2. On `onComplete(caseId)` → `navigate({ to: '/cases/$caseId', params: { caseId } })`
3. Add `caseId` prop chain: `ResultsView` → `ActionsBar` → Share/PDF/Save buttons
4. Add `/cases` list route for navigation
5. Update Dashboard to show recent cases
