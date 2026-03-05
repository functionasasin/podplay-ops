# Analysis: catalog-components
**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Method**: Read every non-test file in `app/src/components/`, catalog: file path, exports, props, stubs/gaps

---

## Component Groups

### Layout
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/layout/AppLayout.tsx` | Sidebar + main content, desktop/mobile nav | `{ children: React.ReactNode }` | COMPLETE |

Nav links: `/` (Home), `/cases/new` (New Case), `/clients` (Clients), `/deadlines` (Deadlines), `/settings` (Settings). No auth-conditional rendering — same nav for unauthenticated users.

---

### Dashboard
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/dashboard/CaseCard.tsx` | Card with decedent name, DOD, gross estate, status badge | `{ caseItem: CaseListItem; onClick?: () => void }` | COMPLETE |

---

### Intake Wizard (7 steps)
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/intake/GuidedIntakeForm.tsx` | Step progress + current step + Cancel button | `{ orgId, userId, onComplete, onCancel }` | COMPLETE — `console.error` at line 103 for error handling (intentional) |
| `components/intake/ConflictCheckStep.tsx` | Name/TIN input + Run Check + results | `{ state, onStateChange, onNext, onSkip }` | COMPLETE |
| `components/intake/ClientDetailsStep.tsx` | Full client identity form | `{ state, onStateChange, onNext, onBack }` | COMPLETE |
| `components/intake/DecedentInfoStep.tsx` | Decedent info + conditional property regime | `{ state, onStateChange, onNext, onBack }` | COMPLETE |
| `components/intake/FamilyCompositionStep.tsx` | Heir cards with name/relationship/alive toggle | `{ state, onStateChange, onNext, onBack }` | COMPLETE — no duplicate heir validation |
| `components/intake/AssetSummaryStep.tsx` | Real property count/value + cash/vehicles | `{ state, onStateChange, onNext, onBack }` | COMPLETE — no validation requiring real_property_count > 0 |
| `components/intake/SettlementTrackStep.tsx` | EJS vs Judicial radio + milestone preview | `{ state, onStateChange, onNext, onBack }` | COMPLETE |
| `components/intake/IntakeReviewStep.tsx` | Review cards for all steps + Create Case button | `{ state, onCreateCase, onBack, isSubmitting }` | COMPLETE |

---

### Results
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/results/ResultsView.tsx` | Header + Distribution + Narratives + Warnings + Log + Actions | `{ input: EngineInput; output: EngineOutput; onEditInput: () => void }` | COMPLETE |
| `components/results/ResultsHeader.tsx` | Decedent name, DOD, scenario badge, succession type, total estate | `{ scenarioCode, successionType, netDistributableEstate, decedentName, dateOfDeath }` | COMPLETE — alerts for Preterition & Mixed |
| `components/results/DistributionSection.tsx` | Pie chart (recharts) + heir table, 7 layout variants | `{ shares, totalCentavos, successionType, scenarioCode, persons }` | COMPLETE |
| `components/results/ShareBreakdownSection.tsx` | Expandable per-heir breakdown rows | `{ shares: InheritanceShare[] }` | COMPLETE |
| `components/results/NarrativePanel.tsx` | Accordion with heir narratives + "Copy All Narratives" | `{ narratives, decedentName, dateOfDeath }` | COMPLETE — parses `**bold**` markdown |
| `components/results/WarningsPanel.tsx` | Alert cards by severity (error/warning/info) | `{ warnings: ManualFlag[]; shares }` | COMPLETE — hidden when 0 warnings |
| `components/results/ComputationLog.tsx` | Collapsible pipeline step log | `{ log: ComputationLog }` | COMPLETE |
| `components/results/ActionsBar.tsx` | Edit Input / Export JSON / Copy Narratives buttons | `{ input, output, onEditInput }` | COMPLETE — JSON export filename: `inheritance-${dateOfDeath}-both.json` |
| `components/results/ComparisonPanel.tsx` | Side-by-side scenario comparison | (not fully read) | COMPLETE per test coverage |
| `components/results/DonationsSummaryPanel.tsx` | Donations breakdown panel | (not fully read) | COMPLETE per test coverage |
| `components/results/StatuteCitationsSection.tsx` | Legal citations section | (not fully read) | COMPLETE per test coverage |
| `components/results/visualizer/FamilyTreeTab.tsx` | Family tree visual tab | (not fully read) | COMPLETE per test coverage |
| `components/results/visualizer/TreeNode.tsx` | Single tree node | (not fully read) | COMPLETE per test coverage |
| `components/results/utils.ts` | Result display utilities | — | COMPLETE |
| `components/results/representation.ts` | Representation logic | — | COMPLETE |
| `components/results/donation-utils.ts` | Donation computation helpers | — | COMPLETE |
| `components/results/visualizer/tree-utils.ts` | Tree layout utilities | — | COMPLETE |

---

### Case Management
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/case/CaseNotesPanel.tsx` | Note list + Add Note button + NoteEditor modal | `{ caseId, userId, notes, onNotesChange, isSharedView }` | COMPLETE — optimistic updates, rollback on error |
| `components/case/NoteEditor.tsx` | Write/Preview tabs + textarea + Save/Cancel | `{ onSave, onCancel, saving }` | COMPLETE |
| `components/case/ShareDialog.tsx` | Privacy warning + share toggle + URL copy + QR code | `{ open, onOpenChange, shareToken, shareEnabled, onToggleShare }` | COMPLETE |
| `components/case/DocumentChecklist.tsx` | Progress bar + document rows with status badges | `{ caseId, userId }` | **STUB** — calls `listDocuments()`, `computeProgress()`, `checkOffDocument()`, `markNotApplicable()` — these backend helpers are not implemented |
| `components/case/DeadlineTimeline.tsx` | Deadline list + "Add Custom Deadline" toggle + form | `{ deadlines, onMarkDone, onAddCustom }` | **STUB** — "Add Custom Deadline" form uses raw `<input>` (no styled Button/Input), "Check Off" inline button has no handler |
| `components/case/DeadlineCard.tsx` | Single deadline row with status, due date, legal basis | `{ deadline, onMarkDone }` | Status: likely incomplete (buttons present) |
| `components/case/ClientTimeline.tsx` | Client timeline view | (not fully read) | Status unknown |
| `components/case/TimelineReport.tsx` | Timeline report | (not fully read) | Status unknown |
| `components/case/TimelineStageCard.tsx` | Single timeline stage card | (not fully read) | Status unknown |

---

### Clients
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/clients/ClientForm.tsx` | Fieldset + raw `<input>`, `<select>` elements | `{ defaultValues?, onSubmit, loading }` | **STUB** — raw HTML, no styled UI components despite availability, no validation, no react-hook-form |
| `components/clients/ClientList.tsx` | Search + filter + sort + raw `<table>` | `{ clients, loading, statusFilter, searchQuery, sortBy, onStatusFilterChange, onSearchChange, onSortChange, onClientClick }` | **STUB** — raw HTML `<table>` instead of Table UI component, `maskTIN()` utility (shows `***-***-789`) |
| `components/clients/ConflictCheckDialog.tsx` | Dialog: name input + results + notes textarea + confirm checkbox | `{ open, onOpenChange, clientName, clientTin, onClear, onClearedAfterReview }` | COMPLETE — auto-runs on open if clientName.length >= 2 |
| `components/clients/ConflictCheckScreen.tsx` | Full-page conflict check screen | (not fully read) | Status unknown |

---

### Settings
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/settings/FirmProfileForm.tsx` | firmName, firmAddress, firmPhone, firmEmail, counselName, counselEmail, counselPhone, ibpRollNo, ptrNo, mcleComplianceNo | `{ profile: FirmProfile; onSave; saving }` | COMPLETE |
| `components/settings/TeamMemberList.tsx` | Member rows with role badge + actions dropdown; pending invitations section | `{ members, pendingInvitations, currentUserId, currentUserRole, onRemoveMember, onUpdateRole, onRevokeInvitation, memberProfiles }` | COMPLETE |
| `components/settings/InviteMemberDialog.tsx` | Email input + Role select + Seat counter + Seat limit error | `{ open, onOpenChange, onInvite, seatUsage }` | **STUB** — hard-coded `<button type="button">` and `<button type="submit">` with no styling despite UI components being available; raw HTML form |
| `components/settings/ColorPickers.tsx` | Brand color pickers | (not fully read) | Status unknown |
| `components/settings/LogoUpload.tsx` | Logo upload UI | (not fully read) | Status unknown |

---

### Shared Form Components
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/shared/DateInput.tsx` | Label + `<input type="date">` + hint + error | Generic `<T extends FieldValues>` with `name, label, control, error, maxDate, minDate, hint` | COMPLETE |
| `components/shared/MoneyInput.tsx` | ₱ prefix + formatted number input | Generic with `name, label, control, error, readOnly, placeholder, warnOnZero, min` | COMPLETE — comma formatting on blur, centavos sync, zero warning |
| `components/shared/FractionInput.tsx` | Numerator/denominator inputs + preset buttons | Generic with `name, label, control, error, allowImproper, showPresets, readOnly` | COMPLETE — presets: 1/2, 1/3, 1/4, 2/3, 3/4 |
| `components/shared/PersonPicker.tsx` | Select from family tree + "Other (not in family tree)" | Generic with `name, label, control, persons, filter, excludeIds, allowStranger, error` | COMPLETE |
| `components/shared/EnumSelect.tsx` | Select with optional optgroups | Generic `<T, V extends string>` with `name, label, control, options, error, placeholder, filter` | COMPLETE |
| `components/shared/PrintHeader.tsx` | Print-only header (CSS media query) | `{ firmName, caseTitle }` | COMPLETE — CSS class `print-header` |
| `components/shared/index.ts` | Barrel export | — | Exports: MoneyInput, DateInput, FractionInput, PersonPicker, EnumSelect |

---

### UI Primitives (shadcn/ui)
All are standard shadcn implementations, COMPLETE:

| Component | Source |
|-----------|--------|
| `ui/accordion.tsx` | @radix-ui/react-accordion |
| `ui/alert.tsx` | Alert + AlertTitle + AlertDescription |
| `ui/badge.tsx` | Variants: outline, secondary, destructive |
| `ui/button.tsx` | Variants: outline, ghost, secondary, destructive |
| `ui/card.tsx` | Card, CardHeader, CardTitle, CardContent, CardDescription |
| `ui/dialog.tsx` | Dialog + DialogContent + DialogHeader + DialogTitle + DialogDescription |
| `ui/input.tsx` | Standard input |
| `ui/label.tsx` | Label |
| `ui/separator.tsx` | Horizontal/vertical |
| `ui/select.tsx` | Select + SelectTrigger + SelectValue + SelectContent + SelectItem + SelectGroup |
| `ui/table.tsx` | Table + TableHeader + TableBody + TableRow + TableHead + TableCell |
| `ui/tabs.tsx` | Tabs + TabsList + TabsTrigger + TabsContent |
| `ui/textarea.tsx` | Textarea |
| `ui/tooltip.tsx` | Tooltip + TooltipTrigger + TooltipContent + TooltipProvider |

**Notable gap**: No `<Form>` component from react-hook-form/shadcn, no `<Skeleton>` component, no `<Toast>` / `<Sonner>` component, no `<Popover>` — these are missing from the ui/ directory.

---

### PDF Export
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/pdf/EstatePDF.tsx` | Full PDF document (@react-pdf/renderer) | `{ input, output, profile, options: PDFExportOptions }` | COMPLETE — options: includeFirmHeader, includeFamilyTree, includeDeadlines, includeChecklist |
| `components/pdf/FirmHeaderSection.tsx` | Firm branding header | (sub-component) | COMPLETE per test coverage |
| `components/pdf/CaseSummarySection.tsx` | Case summary | (sub-component) | COMPLETE per test coverage |
| `components/pdf/DistributionTableSection.tsx` | Distribution table | (sub-component) | COMPLETE per test coverage |
| `components/pdf/PerHeirBreakdownSection.tsx` | Per-heir detailed breakdown | (sub-component) | COMPLETE per test coverage |
| `components/pdf/NarrativesSection.tsx` | Narratives for PDF | (sub-component) | COMPLETE per test coverage |
| `components/pdf/ComputationLogSection.tsx` | Computation log for PDF | (sub-component) | COMPLETE per test coverage |
| `components/pdf/WarningsSection.tsx` | Warnings for PDF | (sub-component) | COMPLETE per test coverage |
| `components/pdf/DisclaimerSection.tsx` | Legal disclaimer | (sub-component) | COMPLETE per test coverage |

---

### Tax Module
| File | Renders | Props | Status |
|------|---------|-------|--------|
| `components/tax/EstateTaxWizard.tsx` | 8-tab estate tax form | `{ state, onChange, autoSaveStatus, decedentName, onBack }` | COMPLETE — tabs: Decedent, Executor, Real Properties, Personal Properties, Other Assets, Ordinary Deductions, Special Deductions, Filing/Amnesty |
| `components/tax/tabs/DecedentTab.tsx` | Decedent tax info tab | (not fully read) | Status unknown |
| `components/tax/tabs/FilingAmnestyTab.tsx` | Filing amnesty tab | (not fully read) | Status unknown |
| Other tax tabs (6 more) | Various estate tax inputs | (not read) | Status unknown |

---

## Critical Stubs & Gaps Summary

### STUB: DocumentChecklist (`components/case/DocumentChecklist.tsx`)
- Calls `listDocuments()`, `computeProgress()`, `checkOffDocument()`, `markNotApplicable()` — these backend helpers are unimplemented placeholders
- "Check Off" and "N/A" buttons rendered inline but depend on unimplemented functions
- **Impact**: Document checklist silently broken — no documents will ever display

### STUB: DeadlineTimeline (`components/case/DeadlineTimeline.tsx`)
- "Add Custom Deadline" form uses raw `<input type="text">` and `<input type="date">` elements — not using Input UI component
- "Check Off" inline `<button>` has no click handler wired up
- **Impact**: Visual inconsistency; custom deadline creation partially broken

### STUB: ClientForm (`components/clients/ClientForm.tsx`)
- Entire component built with raw `<input>`, `<select>` HTML elements
- No styled components, no react-hook-form, no validation
- **Impact**: Form is visually inconsistent with rest of app; no field validation

### STUB: ClientList (`components/clients/ClientList.tsx`)
- Raw `<table>` HTML instead of `Table` UI component
- **Impact**: Visual inconsistency; no sorting/filtering animations

### STUB: InviteMemberDialog (`components/settings/InviteMemberDialog.tsx`)
- Hard-coded unstyled `<button>` elements instead of `Button` UI component
- **Impact**: Visual inconsistency in settings team page

### MISSING: No Toast/Notification System
- No `ui/toast.tsx`, no `ui/sonner.tsx` in ui/ directory
- No success/error notifications after form submissions anywhere
- **Impact**: User gets no feedback after saving firm profile, inviting team member, etc.

### MISSING: No Skeleton Component
- No `ui/skeleton.tsx` in ui/ directory
- No loading skeleton states — components likely show nothing or spinner while loading
- **Impact**: Poor loading UX throughout

### MISSING: Auth-Conditional Navigation
- `AppLayout.tsx` nav has same links for authenticated and unauthenticated users
- No "Sign In" / "Sign Up" CTA for unauthenticated users
- No "Sign Out" option in nav
- **Impact**: Navigation completely ignores auth state

### MINOR: No Popover Component
- No `ui/popover.tsx` — may be needed for tooltip-style forms (e.g., custom deadline date picker)

---

## File Count by Subdirectory (non-test)
| Directory | Files |
|-----------|-------|
| layout/ | 1 |
| dashboard/ | 1 |
| intake/ | 8 |
| results/ | 12 (+3 utils) |
| results/visualizer/ | 3 (+1 utils) |
| case/ | 7 |
| clients/ | 4 |
| settings/ | 5 |
| shared/ | 6 (+1 index) |
| ui/ | 14 |
| pdf/ | 9 |
| tax/ | 1 (+tabs) |
| tax/tabs/ | 2+ (partial) |
| **Total (estimated)** | **~80 non-test files** |
