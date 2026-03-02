# Forward Ralph Loop — Inheritance Premium Platform

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage/aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: set up infrastructure, run migrations, write tests, implement code, or fix failures for a single stage, then commit and exit.

## Your Working Directories

- **Loop dir**: `loops/inheritance-premium-forward/` (frontier, status, loop script)
- **App dir**: `loops/inheritance-frontend-forward/app/` (the existing Vite + React project — YOUR BUILD TARGET)
- **Premium spec**: `docs/plans/inheritance-premium-spec.md` (your primary source of truth — 23 features)
- **Frontend spec dir**: `loops/inheritance-frontend-reverse/analysis/synthesis/` (original types/schemas spec)
- **Rust engine**: `loops/inheritance-rust-forward/` (WASM engine source)

## Tech Stack

- **Framework**: Vite + React 19 + TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (New York style, Radix UI primitives)
- **Forms**: React Hook Form + @hookform/resolvers/zod
- **Validation**: Zod
- **Charts**: Recharts
- **Router**: TanStack Router (type-safe, file-based routing)
- **Backend**: Supabase (local Docker — Auth, PostgreSQL with RLS, Storage)
- **PDF**: @react-pdf/renderer v4.x
- **Testing**: Vitest + @testing-library/react + @testing-library/jest-dom
- **WASM**: Rust engine via wasm-pack (already integrated)

### New Packages (install as needed per stage)

| Package | Stage | Purpose |
|---------|-------|---------|
| `@supabase/supabase-js@2` | 1 | Supabase client |
| `@tanstack/react-router` | 2 | Type-safe routing |
| `@tanstack/router-devtools` | 2 | Router devtools (dev only) |
| `@react-pdf/renderer` | 11 | PDF generation |
| `jszip` | 14 | ZIP archive |
| `react-markdown` | 12 | Markdown rendering |
| `remark-gfm` | 12 | GFM tables/strikethrough |
| `rehype-sanitize` | 12 | HTML sanitization |
| `qrcode.react` | 13 | QR code component |
| `react-d3-tree` | 16 | SVG tree visualization |

## What To Do This Iteration

1. **Read the frontier**: Open `loops/inheritance-premium-forward/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SETUP** (if Supabase not initialized OR required packages missing):
   - Stage 1: Initialize Supabase project, create initial migration, start local instance
   - Stage 2: Install TanStack Router, set up route tree, restructure App.tsx
   - Other stages: Install stage-specific packages listed in the New Packages table
   - Run `npm install` in the app directory
   - Commit: `premium: stage {N} - setup {description}`
   - Exit

   **Priority 2 — MIGRATE** (if stage needs DB tables/columns not yet created):
   - Read the spec section for which tables/columns are needed
   - Create or update the appropriate migration file in `supabase/migrations/`
   - Run `npx supabase db reset` or `npx supabase migration up` to apply
   - Commit: `premium: stage {N} - migrate {description}`
   - Exit

   **Priority 3 — WRITE TESTS** (if the stage's test file has < 5 test functions):
   - Read the spec sections listed in the stage table below
   - Write comprehensive tests covering: happy path, edge cases, validation rules
   - For component tests: use `@testing-library/react` to render, fill fields, and assert
   - For API/hook tests: mock Supabase client, test data flows
   - Tests MUST compile and run (they may fail if implementation doesn't exist yet)
   - Create stub exports so tests can import (empty functions, placeholder components)
   - Commit: `premium: stage {N} - write tests`
   - Exit

   **Priority 4 — IMPLEMENT** (if tests exist but the module is mostly stubs):
   - Read the spec sections carefully — use exact types, field names, enums, and validation rules
   - Implement the module/component to pass as many tests as possible
   - Every type name, field name, and behavior comes from the spec — never invent
   - Focus on one cohesive piece per iteration (don't try to implement everything)
   - Commit: `premium: stage {N} - implement {description}`
   - Exit

   **Priority 5 — FIX FAILURES** (if tests exist and some are failing):
   - Run `cd loops/inheritance-frontend-forward/app && npx vitest run --reporter=verbose 2>&1 | tail -80`
   - Identify the root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `premium: stage {N} - fix {description}`
   - Exit

   **Priority 6 — ADVANCE** (if ALL tests pass for the current stage):
   - Write `loops/inheritance-premium-forward/status/stage-{N}-complete.txt` with timestamp
   - Update `loops/inheritance-premium-forward/frontier/current-stage.md` to the NEXT stage
   - Update `loops/inheritance-premium-forward/frontier/stage-plan.md` status column
   - Commit: `premium: stage {N} complete, advancing to stage {N+1}`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Spec Section | Test Filter | Depends On | Phase |
|-------|------|-------------|-------------|------------|-------|
| 1 | Supabase + Deps Setup | — | `supabase` | — | Infra |
| 2 | TanStack Router + Layout | — | `router\|layout` | 1 | Infra |
| 3 | Auth & Persistence | §4.2 | `auth\|cases\|auto-save\|dashboard` | 1, 2 | 1 |
| 4 | Decedent Header | §4.13 | `decedent-header` | — | 1 |
| 5 | Representation Display | §4.14 | `representation` | — | 1 |
| 6 | Share Breakdown Panel | §4.12 | `share-breakdown` | — | 1 |
| 7 | Statute Citations UI | §4.5 | `statute-citations\|ncc-article` | — | 1 |
| 8 | Print Layout | §4.7 | `print` | — | 1 |
| 9 | Donation Summary | §4.15 | `donation-summary` | — | 1 |
| 10 | Firm Branding | §4.4 | `firm-branding\|settings` | 3 | 2 |
| 11 | PDF Export | §4.1 | `pdf` | 7, 6, 4, 5, 9, 10 | 2 |
| 12 | Case Notes | §4.6 | `case-notes` | 3 | 2 |
| 13 | Shareable Links | §4.10 | `share\|shareable` | 3 | 2 |
| 14 | Case Export ZIP | §4.16 | `zip\|export-archive` | 11, 3 | 2 |
| 15 | Scenario Comparison | §4.8 | `comparison\|scenario-compare` | 3 | 2 |
| 16 | Family Tree Visualizer | §4.19 | `family-tree-viz\|tree-tab` | — | 2 |
| 17 | Client Profiles | §4.3 | `client\|crm` | 3 | 3 |
| 18 | Conflict Check | §4.17 | `conflict` | 17 | 3 |
| 19 | Guided Intake Form | §4.18 | `intake` | 17, 18 | 3 |
| 20 | Deadline Tracker | §4.20 | `deadline` | 3 | 4 |
| 21 | Document Checklist | §4.22 | `document-checklist\|doc-check` | 3 | 4 |
| 22 | Timeline Report | §4.21 | `timeline` | 20 | 4 |
| 23 | Estate Tax Inputs Wizard | §4.23 | `estate-tax\|tax-wizard` | 3 | 5 |
| 24 | BIR Form 1801 Integration | §4.9 | `bir\|form-1801\|tax-bridge` | 23, 11 | 5 |
| 25 | Multi-Seat Firm Accounts | §4.11 | `multi-seat\|organization\|team` | all | 6 |

## Stage Details

### Stage 1 — Supabase + Deps Setup

Initialize Supabase for the project and install foundational dependencies.

**Tasks:**
1. Run `npx supabase init` in `loops/inheritance-frontend-forward/app/`
2. Create `supabase/migrations/001_initial_schema.sql` with:
   - Extensions: `pgcrypto`, `pg_trgm`
   - Enum types: `case_status`, `client_status`, `org_role`, `invitation_status`, `conflict_outcome`, `gov_id_type`
   - Tables: `organizations`, `organization_members`, `organization_invitations`, `user_profiles`, `clients`, `cases`, `case_notes` (with trigger)
   - Shared trigger function: `update_updated_at()`
   - RLS policies on all tables
   - See spec §3.3–§3.15 for exact DDL
3. Install `@supabase/supabase-js@2`
4. Create `src/lib/supabase.ts` with client initialization (reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from env)
5. Create `.env.local.example` with placeholder values
6. Add `supabase/` to project structure awareness
7. Run `npx supabase start` to verify local instance starts (Docker required)

**Tests** (`src/lib/__tests__/supabase.test.ts`):
- Supabase client exports `supabase` object
- Client has `auth`, `from`, `storage`, `rpc` methods
- Environment variable validation (throws if missing)

---

### Stage 2 — TanStack Router + Layout

Add type-safe routing and restructure the app from single-page to multi-route.

**Tasks:**
1. Install `@tanstack/react-router`, `@tanstack/router-devtools`
2. Create route tree in `src/routes/`:
   ```
   src/routes/
   ├── __root.tsx          # Root layout (nav, sidebar)
   ├── index.tsx            # Dashboard (case list) — requires auth
   ├── auth.tsx             # Login/signup
   ├── cases/
   │   ├── new.tsx          # Wizard (anonymous or authenticated)
   │   └── $caseId.tsx      # Case editor + results + premium panels
   ├── cases_.$caseId.tax.tsx  # Estate tax inputs wizard
   ├── clients/
   │   ├── index.tsx        # Client list
   │   ├── new.tsx          # Conflict check → client details
   │   └── $clientId.tsx    # Client detail page
   ├── deadlines.tsx        # All-cases deadline summary
   ├── settings/
   │   ├── index.tsx        # Firm profile + branding
   │   └── team.tsx         # Seat management + invitations
   └── share/
       └── $token.tsx       # Read-only shared case view
   ```
3. Create `AppLayout` component with sidebar navigation:
   - Dashboard, Cases, Clients, Deadlines, Settings links
   - Auth-gated: show login prompt for unauthenticated users on protected routes
4. Move existing wizard + results into `/cases/new` route
5. Preserve the anonymous computation flow (wizard works without auth)

**Tests** (`src/__tests__/router.test.tsx`):
- Root route renders layout with navigation
- `/cases/new` renders wizard
- `/auth` renders login page
- Protected routes redirect to `/auth` when unauthenticated
- `/share/:token` renders without auth requirement

---

### Stage 3 — Auth & Persistence (§4.2)

**Read**: spec §4.2

**Produce:**
- `src/lib/auth.ts` — Auth helper functions (signIn, signUp, signOut, onAuthStateChange)
- `src/lib/cases.ts` — Case CRUD functions (createCase, loadCase, updateCaseInput, updateCaseOutput, listCases, deleteCase)
- `src/hooks/useAuth.ts` — Auth state hook (user, loading, signIn, signUp, signOut)
- `src/hooks/useAutoSave.ts` — 1500ms debounced auto-save hook
- `src/routes/auth.tsx` — Login/signup page (Google OAuth, email/password, magic link)
- `src/routes/index.tsx` — Dashboard with case cards, status tabs, search
- `src/components/dashboard/CaseCard.tsx` — Case card with decedent name, DOD, estate value, status badge

**Key behaviors:**
- `CaseRow` TypeScript type matching spec §4.2 exactly
- `UserProfile` TypeScript type matching spec §4.2
- Case status state machine: `draft → computed → finalized → archived` (no backwards transitions except archive → finalized for admin)
- Auto-save: 1500ms debounce, "Saving..." / "Saved" / "Error saving" indicator
- Anonymous flow preserved: wizard works without auth; results show "[Sign in to Save]" button
- On sign-in from results: current EngineInput + EngineOutput saved as new case → redirect to `/cases/:id`
- Dashboard: case cards with decedent name, DOD, estate value, status badge, tabs (All/Draft/Computed/Finalized/Archived)

**Tests:**
- Auth hook: returns user after signIn, null after signOut
- createCase: creates case with correct fields
- loadCase: returns full CaseRow
- updateCaseInput: debounces and saves
- listCases: returns cases for org, respects status filter
- Dashboard: renders case cards with correct data
- Auto-save: fires after 1500ms debounce, shows status indicator
- Anonymous flow: wizard works without auth, "Sign in to Save" shown
- Status transitions: draft→computed OK, archived→draft rejected

---

### Stage 4 — Decedent Header (§4.13)

**Read**: spec §4.13

**Produce:**
- Update `src/components/results/ResultsHeader.tsx`
- Add `formatDateOfDeath(dod: string): string` utility

**Key behaviors:**
- h1 changes from generic title to "Estate of {decedentName}"
- Sub-line: "Date of Death: {formatted date}" using `dd MMM YYYY` format
- `formatDateOfDeath` uses string splitting (NOT `new Date()`) to avoid timezone issues
- New props: `decedentName: string`, `dateOfDeath: string`

**Tests:**
- Renders "Estate of Juan dela Cruz"
- Renders "Date of Death: 15 Mar 2024"
- `formatDateOfDeath("2024-03-15")` === "15 Mar 2024"
- Falls back gracefully if name is empty

---

### Stage 5 — Representation Display (§4.14)

**Read**: spec §4.14

**Produce:**
- Update `src/components/results/DistributionSection.tsx`
- Add `getRepresentedName(share, persons): string | null` helper

**Key behaviors:**
- When `share.inherits_by === 'Representation'`, show sub-label "↳ representing {parent name}"
- Styled: `text-sm text-muted-foreground`
- If `share.represents` is null, show "↳ representing deceased heir"
- If represents references a valid person, show their name

**Tests:**
- Heir with `inherits_by: 'Representation'` shows sub-label
- Heir with `inherits_by: 'OwnRight'` has no sub-label
- `getRepresentedName` returns correct name from persons array
- `getRepresentedName` returns fallback when person not found

---

### Stage 6 — Share Breakdown Panel (§4.12)

**Read**: spec §4.12

**Produce:**
- `src/components/results/ShareBreakdownSection.tsx` — expandable per-heir breakdown
- Update `DistributionSection.tsx` to include expandable rows

**Key behaviors:**
- Each heir row in distribution table has expandable disclosure panel
- Panel shows: from_legitime, from_free_portion, from_intestate (conditional on > 0)
- Always shows: gross_entitlement, net_from_estate
- Shows legitime_fraction when heir is compulsory
- Shows donations_imputed when > 0
- `expandedRows: Set<string>` state tracks which rows are open

**Tests:**
- Expanding heir row shows breakdown section
- from_legitime hidden when centavos === 0
- from_free_portion shown when centavos > 0
- Gross entitlement and net from estate always shown
- Donations imputed shown with negative sign when present
- Multiple rows can be expanded simultaneously

---

### Stage 7 — Statute Citations UI (§4.5)

**Read**: spec §4.5

**Produce:**
- `src/data/ncc-articles.ts` — `NCC_ARTICLE_DESCRIPTIONS` map (60+ entries from spec)
- `src/components/results/StatuteCitationsSection.tsx`
- Helper functions: `parseArticleKey(legalBasis)`, `getArticleDescription(key)`

**Key behaviors:**
- Citations section in expanded heir row (after ShareBreakdownSection)
- Renders `legal_basis[]` as chips; on hover/click shows full article description
- `forcedExpanded?: boolean` prop for print mode
- Unknown articles (not in map) display raw key without error
- Full NCC_ARTICLE_DESCRIPTIONS map from spec §4.5 (60+ articles: Art.774 through FC Art.179)

**Tests:**
- Renders all legal_basis entries as chips
- Clicking chip shows full article description
- `getArticleDescription("Art.887")` returns correct text
- Unknown article key renders raw text gracefully
- `forcedExpanded` shows all descriptions without click
- Map has entries for Art.887, Art.970, Art.854, Art.1011, etc.

---

### Stage 8 — Print Layout (§4.7)

**Read**: spec §4.7

**Produce:**
- `src/styles/print.css` — `@media print` rules
- `src/hooks/usePrintExpand.ts` — expand all accordions before print
- `src/components/shared/PrintHeader.tsx` — firm name, case title, page number

**Key behaviors:**
- `@page { size: A4; margin: 25mm 20mm; }`
- Font: Times New Roman 12pt for print
- Hide: nav, sidebar, ActionsBar buttons, wizard panels, tab controls, `.no-print`
- Show: `PrintHeader` (firm name + case title + page number)
- `usePrintExpand`: listens to `beforeprint`/`afterprint` events, expands/collapses all accordion refs
- Ctrl+P / Cmd+P triggers correct A4 layout

**Tests:**
- Print CSS file exists and contains `@media print`
- `usePrintExpand` hook calls expand on beforeprint event
- `usePrintExpand` hook calls collapse on afterprint event
- PrintHeader renders firm name and case title
- Elements with `no-print` class are hidden in print media

---

### Stage 9 — Donation Summary (§4.15)

**Read**: spec §4.15

**Produce:**
- `src/components/results/DonationsSummaryPanel.tsx`
- `getDonationCollationStatus(donation, persons): { status, exemptionType?, article? }`

**Key behaviors:**
- Positioned between DistributionSection and NarrativePanel
- Only shown when `EngineInput.donations` is non-empty
- Per-donation row: donor name, amount (₱), type chip (Collatable/Exempt/Stranger), NCC citation
- Chip colors: Collatable = emerald, Exempt = gray, Stranger = muted
- Footer: total collatable, total exempt, total stranger amounts
- 12 exemption types (Art. 1062–1070 NCC)

**Tests:**
- Panel renders when donations exist
- Panel hidden when donations array is empty
- Collatable donation shows emerald chip
- Exempt donation shows gray chip with exemption type
- Stranger donation shows muted chip
- Footer totals match sum of donations by category
- `getDonationCollationStatus` returns correct status for each type

---

### Stage 10 — Firm Branding (§4.4)

**Read**: spec §4.4

**Produce:**
- `src/routes/settings/index.tsx` — Settings page
- `src/components/settings/FirmProfileForm.tsx` — Firm details form
- `src/components/settings/LogoUpload.tsx` — Logo upload with preview
- `src/components/settings/ColorPickers.tsx` — Letterhead + secondary color
- `src/contexts/FirmProfileContext.tsx` — `FirmProfileProvider` React Context
- `src/lib/firm-profile.ts` — CRUD functions for user_profiles

**Migration (if needed):** `002_firm_branding_fields.sql` — Add credential fields to user_profiles

**Key behaviors:**
- FirmProfile interface from spec §4.4 (firmName, firmAddress, counselName, ibpRollNo, ptrNo, mcleComplianceNo, logoUrl, letterheadColor, secondaryColor)
- Logo upload: validate type (PNG/JPG/SVG), size (≤2MB), upload to `firm-logos/{userId}/logo.{ext}`
- Previous logo deleted before new upload
- Color pickers with defaults: letterhead `#1E3A5F`, secondary `#C9A84C`
- Live PDF preview panel updates within 1s after settings change
- `FirmProfileProvider` makes profile available app-wide

**Tests:**
- Settings page renders all form fields
- Logo upload validates file type and size
- Logo upload rejects files > 2MB
- Color picker defaults to correct values
- FirmProfileProvider supplies profile to children
- Saving profile updates Supabase user_profiles row

---

### Stage 11 — PDF Export (§4.1)

**Read**: spec §4.1

**Produce:**
- `src/components/pdf/EstatePDF.tsx` — Main PDF Document component
- `src/components/pdf/FirmHeaderSection.tsx`
- `src/components/pdf/CaseSummarySection.tsx`
- `src/components/pdf/DistributionTableSection.tsx`
- `src/components/pdf/PerHeirBreakdownSection.tsx`
- `src/components/pdf/NarrativesSection.tsx`
- `src/components/pdf/ComputationLogSection.tsx`
- `src/components/pdf/WarningsSection.tsx`
- `src/components/pdf/DisclaimerSection.tsx`
- `src/lib/pdf-export.ts` — `generatePDF(input, output, profile, options): Promise<Blob>`
- Update ActionsBar with "Export PDF" button + options modal

**Key behaviors:**
- A4 portrait, margins 38mm/25mm/30mm/25mm
- 10 sections in order: Firm Header → Case Summary → Distribution Table → Per-Heir Breakdown → Narratives → Computation Log → Warnings → Family Tree (optional) → Settlement Deadlines (optional) → Document Checklist (optional) → Disclaimer
- Firm logo from Supabase Storage when `logo_url` is set
- All NCC citations include full article description text from `NCC_ARTICLE_DESCRIPTIONS`
- Export options modal: checkboxes for including firm header, family tree, deadlines, checklist
- File name: `estate-{decedent-name-slug}-{YYYY-MM-DD}.pdf`
- Download in < 5 seconds for standard 10-heir case

**Tests:**
- EstatePDF renders without errors
- Firm header shows logo when provided
- Distribution table renders correct number of heir rows
- Per-heir breakdown includes statute citations
- Disclaimer section always rendered
- File name follows correct pattern
- Export options modal toggles sections on/off
- PDF generation completes within timeout

---

### Stage 12 — Case Notes (§4.6)

**Read**: spec §4.6

**Produce:**
- `src/components/case/CaseNotesPanel.tsx` — Collapsible notes panel
- `src/components/case/NoteEditor.tsx` — Write/Preview tabs with markdown
- `src/lib/case-notes.ts` — CRUD: addNote, deleteNote, listNotes

**Key behaviors:**
- Append-only: no editing after save (RLS enforced)
- Markdown: `react-markdown` + `remark-gfm` + `rehype-sanitize`
- Write/Preview tabs on new note input
- Optimistic updates: add to list immediately, rollback on error
- Delete: optimistic removal, only note author can delete
- Hidden in shareable link view (§4.10)
- Timestamps formatted in Philippine locale

**Tests:**
- Adding a note renders it in the list
- Markdown bold renders as `<strong>`
- Script tags are sanitized out
- Delete removes note optimistically
- Notes hidden when in shared view mode
- Empty note rejected (min 1 char)

---

### Stage 13 — Shareable Links (§4.10)

**Read**: spec §4.10

**Produce:**
- `src/routes/share/$token.tsx` — Read-only shared case view
- `src/components/case/ShareDialog.tsx` — Share UI with link, QR code, privacy warning
- `src/lib/share.ts` — toggleShare, getSharedCase functions

**Migration:** `004_shared_case_rpc.sql` — `get_shared_case(p_token TEXT)` SECURITY DEFINER RPC

**Key behaviors:**
- `/share/:token` loads case without authentication (via RPC, not RLS)
- All edit controls, case notes, admin panels hidden on shared view
- Privacy warning dialog shown every time share dialog opens (NOT dismissible)
- QR code via `qrcode.react` for mobile sharing
- Toggle: Enable/Disable sharing
- Token is UUID v4; cannot be guessed by enumeration

**Tests:**
- Share dialog shows privacy warning on open
- Copy link button copies correct URL
- QR code renders for the share URL
- Shared view hides edit controls
- Shared view hides case notes
- Toggle enables/disables sharing
- `get_shared_case` returns null for disabled share

---

### Stage 14 — Case Export ZIP (§4.16)

**Read**: spec §4.16

**Produce:**
- `src/lib/export-zip.ts` — `exportCaseZip(caseId, input, output, notes): Promise<void>`
- Update ActionsBar with "Export Archive" button

**Key behaviors:**
- ZIP via `jszip@3.10.1`
- Contents: report.pdf, input.json, output.json, notes.txt (if any), metadata.json
- File name: `estate-{decedent-name-slug}-{YYYY-MM-DD}.zip`
- Metadata includes: export_format_version "1.0", case_id, exported_at, exported_by_user_id
- Requires authenticated + saved case
- Triggers browser download via blob URL

**Tests:**
- ZIP contains report.pdf, input.json, output.json, metadata.json
- input.json is pretty-printed valid JSON
- metadata.json has correct format version
- notes.txt included only when notes exist
- File name follows correct pattern
- Rejects when case not saved (no caseId)

---

### Stage 15 — Scenario Comparison (§4.8)

**Read**: spec §4.8

**Produce:**
- `src/components/results/ComparisonPanel.tsx` — Side-by-side testate vs intestate
- `src/lib/comparison.ts` — `buildAlternativeInput()`, `computeComparison()`, diff calculation

**Key behaviors:**
- "Compare Scenarios" button only shown when `input.will !== null` (testate case)
- `buildAlternativeInput(input)`: strips `will: null` from current input
- Runs WASM engine on alternative input client-side
- Side-by-side table: Current scenario | Intestate scenario | Delta
- Delta colors: emerald (gain), red (loss), muted (no change)
- Delta percentage calculated
- Results persisted to `cases.comparison_*` columns

**Migration:** `003_comparison_columns.sql`

**Tests:**
- Button hidden for intestate cases (will === null)
- Button shown for testate cases
- `buildAlternativeInput` strips will to null
- Comparison runs WASM engine on alternative
- Delta calculation: positive = heir gains under will
- Emerald styling for positive delta
- Red styling for negative delta
- Comparison results persisted to case

---

### Stage 16 — Family Tree Visualizer (§4.19)

**Read**: spec §4.19

**Produce:**
- `src/components/results/visualizer/FamilyTreeTab.tsx` — Lazy-loaded tree component
- `src/components/results/visualizer/TreeNode.tsx` — Custom node renderer
- `src/components/results/visualizer/tree-utils.ts` — Data transformation
- Update `ResultsView.tsx` with tabbed layout: Distribution | Family Tree | Narratives | Computation Log

**Key behaviors:**
- `react-d3-tree` v3.6.x for SVG tree rendering
- Lazy loaded: `const FamilyTreeTab = lazy(() => import(...))`
- 9 node roles with distinct colors (decedent, active-heir, surviving-spouse, predeceased, disinherited, unworthy, renounced, zero-share, testamentary-only)
- Edge types: solid (parent-child), dashed violet (marriage), dashed gray (representation)
- Controls: zoom in/out, fit to screen, download SVG
- `getSVGString()` via `useImperativeHandle` for PDF embedding
- No new database tables

**Tests:**
- FamilyTreeTab renders tree with correct number of nodes
- Decedent node has slate-800 border
- Active heir node shows share amount
- Marriage edge renders as dashed violet
- Zoom controls work (zoom in/out/fit)
- Download SVG produces valid SVG string
- Tab navigation works between Distribution and Family Tree

---

### Stage 17 — Client Profiles (§4.3)

**Read**: spec §4.3

**Produce:**
- `src/routes/clients/index.tsx` — Client list page
- `src/routes/clients/new.tsx` — New client form
- `src/routes/clients/$clientId.tsx` — Client detail page
- `src/components/clients/ClientList.tsx` — Sortable, searchable table
- `src/components/clients/ClientForm.tsx` — Form with PH-specific fields
- `src/lib/clients.ts` — CRUD functions
- `src/utils/tin-format.ts` — TIN formatting helper

**Key behaviors:**
- Client list: columns (Name, TIN masked, Status, Intake Date, Conflict Status, # Cases)
- Sort by: name, intake date, status
- Search: debounced 300ms
- Status filter: All / Active / Former
- TIN auto-format: `formatTIN(raw)` inserts hyphens as user types (`XXX-XXX-XXX` or `XXX-XXX-XXX-XXX`)
- Gov ID types: 11 enum values from spec
- Civil status: single, married, widowed, legally_separated, annulled
- Zod validation: full_name 2-200 chars, TIN regex, email format

**Tests:**
- Client list renders columns correctly
- Search debounces 300ms
- `formatTIN("123456789")` === "123-456-789"
- `formatTIN("123456789012")` === "123-456-789-012"
- Gov ID type dropdown has 11 options
- Zod rejects invalid TIN format
- Creating client saves to Supabase
- Client detail page shows all sections

---

### Stage 18 — Conflict Check (§4.17)

**Read**: spec §4.17

**Produce:**
- `src/components/clients/ConflictCheckScreen.tsx` — Full-page pre-intake check
- `src/components/clients/ConflictCheckDialog.tsx` — Modal re-check
- `src/lib/conflict-check.ts` — `runConflictCheck(name, tin?)` wrapper for RPC

**Migration:** `007_conflict_check.sql` — `pg_trgm` extension, `conflict_check_log`, `run_conflict_check` RPC

**Key behaviors:**
- Trigram similarity threshold: 0.35 (broad — false positives acceptable)
- Searches: existing clients by name similarity, heir names in cases.input_json, TIN exact match
- Outcomes: clear, flagged, cleared_after_review, skipped
- Visual: similarity score color coding (≥1.00 red, ≥0.70 amber, ≥0.50 yellow, <0.50 gray)
- Flagged: notes required (≥5 chars) + checkbox before proceeding
- Trigger points: /clients/new step 1, client detail re-check, case editor client picker
- Case finalization guard: reminder dialog if linked client not conflict-cleared

**Tests:**
- Clear result shows green "CLEAR" status
- Flagged result shows matches with similarity scores
- Notes required field validates min 5 chars
- Checkbox required before proceeding on flagged
- Skip marks conflict_cleared = false
- Similarity scores show correct color coding
- TIN exact match highlighted regardless of name similarity

---

### Stage 19 — Guided Intake Form (§4.18)

**Read**: spec §4.18

**Produce:**
- `src/components/intake/GuidedIntakeForm.tsx` — 7-step form container
- `src/components/intake/ConflictCheckStep.tsx`
- `src/components/intake/ClientDetailsStep.tsx`
- `src/components/intake/DecedentInfoStep.tsx`
- `src/components/intake/FamilyCompositionStep.tsx`
- `src/components/intake/AssetSummaryStep.tsx`
- `src/components/intake/SettlementTrackStep.tsx`
- `src/components/intake/IntakeReviewStep.tsx`
- `src/lib/intake.ts` — Mapping functions: intake → EngineInput, intake → clients row, intake → deadlines

**Migration:** `009_cases_intake_data.sql` — Add `intake_data JSONB` to cases

**Key behaviors:**
- 7 steps: Conflict Check → Client Details → Decedent → Settlement Track → Family → Assets → Review
- Pre-populates EngineInput from intake data:
  - Decedent info → `EngineInput.decedent`
  - Family composition → `EngineInput.family_tree`
  - Has will flag → `EngineInput.will: null | {}`
- Creates: `clients` row, `cases` row with pre-populated input_json, `case_deadlines` rows, `case_documents` rows
- Settlement track: EJS or Judicial radio → generates different deadline milestones
- Asset summary → seeds document checklist conditions

**Tests:**
- Step navigation works forward/back
- Conflict check step gates progress (must clear/acknowledge)
- Decedent info pre-populates EngineInput fields
- Family composition maps to family_tree array
- Settlement track generates correct milestone count (9 for EJS, 4 for Probate)
- Review step shows summary of all steps
- "Create Case" creates client + case + deadlines + documents rows

---

### Stage 20 — Deadline Tracker (§4.20)

**Read**: spec §4.20

**Produce:**
- `src/routes/deadlines.tsx` — All-cases deadline summary page
- `src/components/case/DeadlineTimeline.tsx` — Per-case vertical timeline panel
- `src/components/case/DeadlineCard.tsx` — Single milestone card
- `src/lib/deadlines.ts` — `generateAndSaveDeadlines()`, `markDeadlineComplete()`, `computeDeadlineStatus()`

**Migration:** `005_case_deadlines.sql`

**Key behaviors:**
- Auto-generate deadlines from DOD + track (EJS: 9 milestones, Probate: 4 milestones)
- Status: done, overdue, urgent (≤14 days), upcoming (15-30 days), future (>30 days)
- Status colors: done=green, overdue=red, urgent=amber, upcoming=yellow, future=slate
- "Mark Done" → date picker modal (default today)
- "Add Custom Deadline" → label, date, description, legal basis form
- Dashboard integration: case cards show most urgent deadline + progress count
- `/deadlines` page: sections by urgency (Overdue | Due This Week | Urgent | Due Soon | Upcoming)
- Upsert preserves completed_date when recalculating due_date on DOD change

**Tests:**
- EJS track generates 9 milestones with correct offsets
- Probate track generates 4 milestones
- `computeDeadlineStatus` returns correct status for various date offsets
- Overdue deadline shows red styling
- Marking deadline complete sets completed_date
- Custom deadline creates new row
- Dashboard case card shows urgent deadline chip

---

### Stage 21 — Document Checklist (§4.22)

**Read**: spec §4.22

**Produce:**
- `src/components/case/DocumentChecklist.tsx` — Checklist panel in case editor
- `src/lib/documents.ts` — Seed, check-off, mark N/A functions
- `src/data/document-templates.ts` — Smart seeding rules (15+ document types with conditions)

**Migration:** `006_case_documents.sql`

**Key behaviors:**
- Smart seeding: different documents required based on case data (marriage, property types, track)
- 15+ document types: PSA Death Cert (always), PSA Birth Certs (always), Marriage Cert (if married), TCT/CCT (if real property), Bank Cert (if cash), etc.
- Check-off: date + optional note
- Mark Not Applicable: removes from required count
- Progress bar: obtained / (total − not_applicable)
- PDF appendix option (§4.1 integration)

**Tests:**
- Always-required documents seeded for any case
- Marriage cert seeded only when `is_married = true`
- TCT/CCT seeded only when real property exists
- Check-off sets `is_obtained = true` with date
- N/A reduces denominator in progress
- Progress calculation correct
- PDF appendix generates correct content

---

### Stage 22 — Timeline Report (§4.21)

**Read**: spec §4.21

**Produce:**
- `src/components/case/TimelineReport.tsx` — Settlement timeline panel
- `src/components/case/TimelineStageCard.tsx` — Individual stage card
- `src/components/case/ClientTimeline.tsx` — Client-facing shared view

**Key behaviors:**
- 7 settlement stages (EJS): Registration → Documents → Deed → Publication → BIR → eCAR → Title
- Stage status: complete (all milestones done), in-progress, upcoming, overdue
- Horizontal progress bar at top (% complete)
- Current stage indicator
- Client-facing version at `/share/:token?view=timeline` (plain language, no legal jargon)
- Printable as standalone A4 PDF page
- Estimated completion date calculation

**Tests:**
- 7 stages rendered for EJS track
- Stage marked complete when all milestones have completed_date
- Progress bar shows correct percentage
- "Currently Here" indicator on first in-progress stage
- Client timeline uses plain language
- `/share/:token?view=timeline` renders without auth

---

### Stage 23 — Estate Tax Inputs Wizard (§4.23)

**Read**: spec §4.23

**Produce:**
- `src/routes/cases_.$caseId.tax.tsx` — Tax wizard route
- `src/components/tax/EstateTaxWizard.tsx` — 8-tab container
- `src/components/tax/tabs/DecedentTab.tsx`
- `src/components/tax/tabs/ExecutorTab.tsx`
- `src/components/tax/tabs/RealPropertiesTab.tsx`
- `src/components/tax/tabs/PersonalPropertiesTab.tsx`
- `src/components/tax/tabs/OtherAssetsTab.tsx`
- `src/components/tax/tabs/OrdinaryDeductionsTab.tsx`
- `src/components/tax/tabs/SpecialDeductionsTab.tsx`
- `src/components/tax/tabs/FilingAmnestyTab.tsx`
- `src/types/estate-tax.ts` — EstateTaxWizardState type
- `src/schemas/estate-tax.ts` — Zod schemas

**Migration:** `008_estate_tax_columns.sql`

**Key behaviors:**
- 8 tabs: Decedent → Executor → Real Props → Personal Props → Other Assets → Ordinary Ded → Special Ded → Filing
- Pre-population from EngineInput: name, DOD, marital status, property regime
- Tab validation summary (checkmarks for complete tabs)
- Conditional fields: funeral expenses (PRE_TRAIN only), NRA worldwide (NRA only), amnesty mode (amnesty elected)
- Auto-save: 1500ms debounce to `cases.tax_input_json`
- Real properties: per-item FMV (tax dec vs BIR zonal — engine takes max)

**Tests:**
- All 8 tabs render correctly
- Pre-population fills decedent fields from EngineInput
- Tab validation checkmarks update on field completion
- Conditional fields hidden/shown based on conditions
- Auto-save fires to tax_input_json
- Adding real property row creates correct data structure
- Filing tab amnesty toggle reveals deduction mode

---

### Stage 24 — BIR Form 1801 Integration (§4.9)

**Read**: spec §4.9

**Produce:**
- `src/lib/tax-bridge.ts` — Bridge formula: `net_distributable_estate = max(0, item40 - item44)`
- `src/hooks/useTaxBridge.ts` — Re-run inheritance engine when tax output changes
- Update PDF export to include estate tax sections
- Update ActionsBar with estate tax button/link

**Key behaviors:**
- Bridge formula: `max(0, estate_tax_output.item40_gross_estate - estate_tax_output.item44_total_deductions)`
- Automatic re-run of inheritance engine when `tax_output_json` changes
- Combined PDF: inheritance distribution + estate tax schedules in one document
- Workflow: Inheritance → Tax Wizard → Bridge → Updated Inheritance → Combined PDF
- "Back to Inheritance Results" navigation from tax wizard

**Tests:**
- Bridge formula: `max(0, 5000000 - 3000000)` === 2000000
- Bridge formula: `max(0, 1000000 - 3000000)` === 0 (floor at 0)
- Tax output change triggers inheritance re-run
- Combined PDF includes both sections
- Navigation between inheritance and tax views works

---

### Stage 25 — Multi-Seat Firm Accounts (§4.11)

**Read**: spec §4.11

**Produce:**
- `src/routes/settings/team.tsx` — Seat management page
- `src/components/settings/TeamMemberList.tsx`
- `src/components/settings/InviteMemberDialog.tsx`
- `src/lib/organizations.ts` — Org CRUD, invitation flow, role checks
- `src/hooks/useOrganization.ts` — Org context hook

**Migration:** `010_rls_org_scope.sql` — Update all RLS from user_id to org_id scoping

**Key behaviors:**
- Plans: solo (1 seat), team (5 seats), firm (unlimited)
- Roles: admin, attorney, paralegal, readonly (with permission matrix)
- Invitation flow: admin enters email + role → 7-day expiry token → email link → accept
- Seat limit enforced: cannot invite beyond plan limit
- RLS migration: all tables scoped to org_id (clients, cases shared within firm)
- Role-gated actions: finalize (admin/attorney), delete (admin only), invite (admin only)

**Tests:**
- Solo plan allows 1 seat only
- Team plan allows up to 5 seats
- Admin can invite, attorney cannot
- Invitation creates pending row with token
- Accept invitation creates org_member row
- Expired invitation shows error message
- Role permissions: paralegal cannot finalize, readonly cannot edit
- RLS: user in org A cannot see org B's cases

---

## Supabase Configuration

**Local Development:**
```bash
# In app directory
npx supabase init          # One-time setup
npx supabase start         # Start local instance (requires Docker)
npx supabase db reset      # Apply all migrations from scratch
npx supabase migration up  # Apply pending migrations
```

**Environment Variables (`.env.local`):**
```
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key-from-supabase-start>
```

**Migration File Location:** `loops/inheritance-frontend-forward/app/supabase/migrations/`

**Migration Naming Convention:** `{NNN}_{description}.sql` (e.g., `001_initial_schema.sql`)

## Rules

- Do ONE unit of work, then exit. Do not do multiple priorities in one iteration.
- Always read the spec before writing code. `docs/plans/inheritance-premium-spec.md` is the primary source of truth.
- Every type name, field name, and behavior comes from the spec — never invent.
- Use TanStack Router for all navigation — no manual window.location changes.
- Use Supabase client for all database operations — no direct SQL from frontend.
- All Supabase tables use RLS — never use the service role key in frontend code.
- Use React Hook Form + Zod for all forms (existing pattern).
- Tailwind classes for styling (existing pattern).
- shadcn/ui components for all UI primitives (Button, Dialog, Tabs, Badge, etc.).
- Never modify a passing test to keep it passing after a code change.
- If a test contradicts the spec, fix the test AND note it in your commit message.
- Lazy-load heavy packages: `@react-pdf/renderer`, `react-d3-tree`.
- All monetary amounts in Philippine Peso (₱) with comma-formatted centavo display: `₱1,234,567.89`.
- All dates: Philippine locale display "15 Jan 2026" in UI, ISO "2026-01-15" in storage.
- Do NOT import from spec directories at runtime — spec files are for reading, not importing.

## Commit Convention

```
premium: stage {N} - {description}
```

Examples:
- `premium: stage 1 - initialize supabase + install deps`
- `premium: stage 3 - write auth hook tests`
- `premium: stage 7 - implement NCC article descriptions map`
- `premium: stage 11 - fix PDF firm header rendering`
- `premium: stage 4 complete, advancing to stage 5`
