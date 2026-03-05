# Analysis: read-premium-spec

**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Source**: `docs/plans/inheritance-premium-spec.md` (v1.0, 2026-03-01, 1999+ lines)

---

## Summary

The premium spec defines 23 platform features across 5 phases, with complete DDL, TypeScript types, API contracts, component hierarchies, and acceptance criteria. This file catalogs every platform-related item from the spec and cross-references what was cataloged as built/missing in previous Wave 1 analyses.

---

## §2 Route Structure (Spec-Defined)

| Route | Purpose | Auth Required | Status vs. Codebase |
|-------|---------|---------------|---------------------|
| `/` | Dashboard (case list) | Yes | **PARTIAL** — shows cases but no auth guard, no deadline urgency chips, no search |
| `/auth` | Login/signup | No | **PARTIAL** — was placeholder stub; manually fixed per failure log |
| `/cases/new` | Wizard | No (anonymous OK) | **EXISTS** — actually at `/` in codebase (wizard IS the home page) |
| `/cases/:id` | Case editor + results | Yes | **EXISTS** |
| `/cases/:id/tax` | Estate tax inputs wizard §4.23 | Yes | **MISSING** — not in codebase at all |
| `/clients` | Client list | Yes | **PARTIAL** — raw HTML table stub |
| `/clients/new` | Conflict check → client details | Yes | **PARTIAL** — raw HTML, no validation; was unregistered (fixed) |
| `/clients/:id` | Client detail page | Yes | **PARTIAL** — was unregistered (fixed); detail panel completeness unknown |
| `/deadlines` | All-cases deadline summary | Yes | **PARTIAL** — route registered, component is raw HTML + missing handler |
| `/settings` | Firm profile + branding | Yes | **PARTIAL** — exists, unclear if fully functional |
| `/settings/team` | Seat management + invitations | Yes | **MISSING** — route file exists, NOT registered in router (CRITICAL) |
| `/share/:token` | Read-only shared case view | No | **EXISTS** — registered in router |

**Gap**: `/cases/:id/tax` is completely absent. `/settings/team` is not wired.

---

## §3 Data Model (Spec-Defined vs. Codebase)

### Tables — All 10 defined in spec

| Table | Defined In Spec | In Codebase | Notes |
|-------|----------------|-------------|-------|
| `organizations` | §3.4 | `001_initial_schema.sql` | EXISTS |
| `organization_members` | §3.5 | `001_initial_schema.sql` | EXISTS |
| `organization_invitations` | §3.6 | `001_initial_schema.sql` | EXISTS |
| `user_profiles` | §3.7 | `001_initial_schema.sql` | EXISTS |
| `clients` | §3.8 | `001_initial_schema.sql` | EXISTS |
| `cases` | §3.9 | `001_initial_schema.sql` | EXISTS; missing `tax_input_json`, `tax_output_json`, `gross_estate` (in `008_estate_tax_columns.sql`) |
| `case_notes` | §3.10 | `001_initial_schema.sql` | EXISTS with trigger |
| `case_deadlines` | §3.11 | `005_case_deadlines.sql` | EXISTS |
| `case_documents` | §3.12 | `001_initial_schema.sql` + `006_case_documents.sql` | **DUPLICATE** — 006 conflicts with 001 (fixed per failure log: 006 is now a no-op) |
| `conflict_check_log` | §3.13 | `007_conflict_check.sql` | EXISTS |

### Storage Buckets
- `firm-logos` bucket — spec-defined (§3.14); **codebase status unknown** (no storage setup in migrations)

### Migration Gaps vs. Spec

The spec defines 10 migration files (§7). Codebase has these files (from `catalog-migrations`):
- `001_initial_schema.sql` — PRESENT (but now supersedes what 006 was supposed to do)
- `005_case_deadlines.sql` — PRESENT
- `006_case_documents.sql` — PRESENT but now a no-op (conflict fixed)
- `007_conflict_check.sql` — PRESENT

Missing migration files (per spec §7):
- `002_firm_branding_fields.sql` — spec says: add `ibp_roll_no`, `ptr_no`, `mcle_compliance_no`, `logo_url`, `letterhead_color`, `secondary_color` to `user_profiles`. These fields ARE in `001_initial_schema.sql` already, so migration 002 may be redundant but the spec lists it separately.
- `003_comparison_columns.sql` — spec says: add `comparison_input_json`, `comparison_output_json`, `comparison_ran_at` to `cases`. **Unknown if these columns exist on `cases` table** — not confirmed in previous catalogs.
- `004_shared_case_rpc.sql` — spec says: `get_shared_case(p_token TEXT)` SECURITY DEFINER RPC. **Status unknown.**
- `008_estate_tax_columns.sql` — spec says: add `tax_input_json`, `tax_output_json`, `gross_estate` to `cases`. **Status unknown** — these columns not confirmed in previous catalogs.
- `009_cases_intake_data.sql` — spec says: add `intake_data JSONB` to `cases`. **Status unknown.**
- `010_rls_org_scope.sql` — spec says: update all RLS from `user_id` to `org_id` scoping for multi-seat. **Status unknown** — critical for §4.11.

---

## §4 Feature Catalog — Platform-Related

### §4.2 Auth & Persistence (Phase 1 foundation)

**Specified:**
- Auth providers: Google OAuth, email/password, magic link
- Auto-save: 1500ms debounce on any input change
- Case status state machine: `draft → computed → finalized → archived`
- `CaseRow` TypeScript interface (complete, with all JSON columns)
- `UserProfile` TypeScript interface
- 7 core API functions in `lib/cases.ts`
- `useAutoSave` hook with "Saving..." / "Saved" / "Error saving" status
- Anonymous computation flow: unauthenticated users can use wizard without auth; "Sign in to Save" CTA
- Dashboard: case cards with decedent name, DOD, estate value, last updated, status badge, deadline urgency chip, + tabs + search

**Codebase status (from catalog-lib-hooks, catalog-routes):**
- `lib/supabase.ts` — EXISTS but CRASHES without env vars (throws before React renders)
- `lib/auth.ts` — full functions exist; missing `resetPassword`
- `hooks/useAuth.ts` — EXISTS but no error state exposed
- `hooks/useAutoSave.ts` — EXISTS but no `isDirty` state, no flush-on-unmount
- Dashboard `/` — PARTIAL: no deadline urgency chip, no search by decedent name
- No toast library installed — "Saving..." / "Saved" / "Error saving" has no display mechanism
- `createOrganization` function — **COMPLETELY MISSING** from codebase (critical: users cannot be assigned an org)

**Gaps:**
1. `supabase.ts` crashes app on missing env vars — needs graceful degradation (§4.4 in output spec)
2. `createOrganization` missing — no org creation when user signs up
3. `resetPassword` missing from `lib/auth.ts`
4. `useAutoSave` missing `isDirty` + flush-on-unmount
5. No toast library — UX dead end for save status feedback
6. Dashboard missing deadline urgency chip and case search

### §4.3 Client Profiles (Phase 3)

**Specified:**
- Client list with columns: Name, TIN (masked), Status, Intake Date, Conflict Status, # Cases
- Client detail page with 6 sections: IDENTITY, CONTACT, LEGAL IDs, INTAKE, CASES, CONFLICT CHECK LOG
- PH-specific fields: TIN `formatTIN()` with auto-hyphen, 11 gov ID types enum, civil status enum
- react-hook-form + Zod validation; `full_name` required 2-200, TIN regex, email validation
- Sort by name/intake date/status; search by name (debounced 300ms); status and conflict filters

**Codebase status (from catalog-components):**
- `ClientForm` — raw HTML, no validation, no Zod, no react-hook-form integration
- `ClientList` — raw HTML table, no search, no filters, no sort
- Both routes were unregistered in router (fixed per failure log)

**Gaps:**
1. `ClientForm` needs full react-hook-form + Zod implementation
2. `ClientList` needs search, filter, sort implementation
3. `formatTIN()` utility — unknown if exists
4. Client detail page sections LEGAL IDs, INTAKE, CONFLICT CHECK LOG — unknown completeness

### §4.4 Firm Branding (Phase 2)

**Specified:**
- `user_profiles` fields: `ibp_roll_no`, `ptr_no`, `mcle_compliance_no`, `logo_url`, `letterhead_color`, `secondary_color`
- Logo upload to Supabase Storage bucket `firm-logos`
- `FirmProfileProvider` React Context — missing from codebase (not in catalog-lib-hooks or catalog-components)
- Settings page: Firm Profile form, Logo upload section, Brand Colors pickers, PDF Preview panel
- Logo validation: PNG/JPG/SVG ≤ 2MB; upload to `firm-logos/{userId}/logo.{ext}`
- Previous logo deleted before new upload

**Codebase status:**
- `user_profiles` fields — present in `001_initial_schema.sql`
- `FirmProfileProvider` — **COMPLETELY MISSING** from codebase
- Storage bucket setup — **UNKNOWN** (not in migrations)

**Gaps:**
1. `FirmProfileProvider` context must be created and added to app tree
2. `firm-logos` storage bucket needs creation (via Supabase dashboard or migration)
3. Settings page branding fields + logo upload UI — completeness unknown

### §4.5 Statute Citations UI (Phase 1)

**Specified:**
- `NCC_ARTICLE_DESCRIPTIONS` map: 60+ entries from Art. 774 through FC Art. 179
- `parseArticleKey()` and `getArticleDescription()` helper functions
- Expandable heir row in `DistributionSection` showing citation chips
- `forcedExpanded?: boolean` prop for print mode

**Codebase status:** Catalog-components did not flag this as a stub. Likely exists but needs verification in Wave 2 journey audit.

### §4.6 Case Notes (Phase 2)

**Specified:**
- Markdown editor with Write/Preview tabs using `react-markdown`, `remark-gfm`, `rehype-sanitize`
- Append-only; optimistic updates; rollback on error
- Delete: author only (RLS gated)
- Notes panel hidden on shared view

**Codebase status:**
- `react-markdown`, `remark-gfm`, `rehype-sanitize` — **NOT INSTALLED** (from catalog-config: not in package.json)
- Case notes panel — completeness unknown

**Gaps:**
1. 3 packages need installation
2. Case notes UI completeness unknown pending Wave 2 audit

### §4.7 Print Layout (Phase 1)

**Specified:**
- `src/styles/print.css` with `@media print` rules
- `@page { size: A4; margin: 25mm 20mm; }`
- Times New Roman 12pt for print
- `usePrintExpand` hook — expand all accordions before print, collapse after
- `PrintHeader` component

**Codebase status:** Not explicitly cataloged. Likely exists in some form. Wave 2 audit needed.

### §4.8 Scenario Comparison (Phase 2)

**Specified:**
- `buildAlternativeInput()` — strips will from input
- Side-by-side comparison table with delta amounts and % change
- Emerald/red/muted row highlighting
- Persistence: `cases.comparison_input_json`, `cases.comparison_output_json`, `cases.comparison_ran_at`

**Codebase status (from catalog-lib-hooks):**
- `comparison.ts` EXISTS but uses a **static WASM import** that blocks the thread — should be dynamic import
- Whether the UI comparison panel is wired: **UNKNOWN** — catalog-components did not detail this panel

**Gaps:**
1. `comparison.ts` static WASM import must be converted to dynamic
2. Whether columns `comparison_input_json` etc. exist on `cases` table: **UNKNOWN** (migration 003 may not have been applied)

### §4.9 BIR Form 1801 Integration (Phase 5)

**Specified:**
- Bridge formula: `net_distributable_estate = max(0, Item40 - Item44)`
- Re-run inheritance engine with bridged value
- Combined PDF including estate tax schedules

**Codebase status:** Estate tax wizard (`/cases/:id/tax`) is completely absent. This entire feature is **MISSING**.

### §4.10 Shareable Links (Phase 2)

**Specified:**
- `share_token UUID` + `share_enabled BOOLEAN` on cases table
- `get_shared_case()` SECURITY DEFINER RPC
- QR code via `qrcode.react`
- Share dialog with privacy warning, copy link, enable/disable toggle
- Read-only view: no edit controls, no notes, no admin panels

**Codebase status (from catalog-routes):**
- `/share/:token` route — EXISTS and registered
- `qrcode.react` — **NOT INSTALLED** (from catalog-config)
- `get_shared_case()` RPC — **UNKNOWN** (migration 004 status unknown)
- Share dialog component — from catalog-components, was noted as a stub ("stub: Share results content area")

**Gaps:**
1. `qrcode.react` needs installation
2. `get_shared_case()` RPC needs verification
3. Share dialog UI is a stub

### §4.11 Multi-Seat Firm Accounts (Phase 6)

**Specified:**
- Plans: solo (1 seat), team (5 seats), firm (unlimited)
- 4 roles: admin, attorney, paralegal, readonly with permission matrix
- Invitation flow: 7-day expiry token, `/invite/{token}` route, accept flow
- `/settings/team` seat management UI
- RLS policy migration from `user_id` to `org_id` scoping (migration 010)

**Codebase status:**
- `InviteMemberDialog` — **EXISTS** but unstyled buttons (from catalog-components)
- `/settings/team` route — file exists, **NOT REGISTERED in router** (CRITICAL)
- `createOrganization` — **COMPLETELY MISSING**
- Migration 010 (org-scoped RLS) — **UNKNOWN** status

**Gaps:**
1. `/settings/team` not registered in router
2. `createOrganization` function missing
3. `/invite/{token}` route — not in current route table
4. RLS org-scope migration status unknown

### §4.12 Share Breakdown Panel (Phase 1)

**Specified:**
- Expandable row in `DistributionSection` showing per-heir share breakdown
- Fields: from_legitime, from_free_portion, from_intestate, legitime_fraction, donations_imputed, gross_entitlement, net_from_estate
- Data from `EngineOutput.per_heir_shares[]`

**Codebase status:** From catalog-components, `DistributionSection` exists. Whether `ShareBreakdownSection` is implemented with all fields: **UNKNOWN** — Wave 2 journey audit needed.

### §4.13 Decedent Header (Phase 1)

**Specified:**
- `ResultsHeader` h1 changes from "Philippine Inheritance Distribution" to "Estate of {decedentName}"
- Sub-line: "Date of Death: {formatDateOfDeath(dateOfDeath)}"
- `formatDateOfDeath()` uses string splitting (not `new Date()`) to avoid timezone issues

**Codebase status:** From catalog-components, `ResultsHeader` exists. Whether this change was applied: **UNKNOWN** — Wave 2 needed.

### §4.14 Representation Display (Phase 1)

**Specified:**
- "↳ representing [parent name]" sub-label under heir name
- `getRepresentedName()` helper
- Data from `EngineOutput.per_heir_shares[].inherits_by === 'Representation'`

**Codebase status:** Was documented as a failure in `loops/inheritance-frontend-reverse/frontier/aspects.md` — `ChildrenForRepresentation` component was partially implemented in forward loop. Whether the display label in `DistributionSection` is working: **UNKNOWN** — Wave 2 needed.

### §4.15 Donation Summary in Results (Phase 1)

**Specified:**
- `DonationsSummaryPanel` component between DistributionSection and NarrativePanel
- Only shown when `EngineInput.donations` is non-empty
- Collation status chips: Collatable / Exempt: [type] / Stranger
- `getDonationCollationStatus()` helper, 12 exemption types

**Codebase status:** From catalog-components, this panel is not explicitly cataloged as a stub. Wave 2 journey needed to verify.

### §4.16 Case Export ZIP (Phase 2)

**Specified:**
- `jszip@3.10.1` — **NOT INSTALLED** (from catalog-config)
- ZIP contents: report.pdf, input.json, output.json, notes.txt, metadata.json
- `exportCaseZip()` async function

**Codebase status:** `jszip` not installed → feature completely absent.

### §4.17 Conflict Check (Phase 3)

**Specified:**
- `run_conflict_check()` SECURITY DEFINER RPC using `pg_trgm` fuzzy search
- Threshold 0.35; similarity score visual coding (red/amber/yellow/gray)
- 3 trigger points: `/clients/new?step=conflict-check`, client detail page, case editor client picker
- 4 outcomes: clear, flagged, cleared_after_review, skipped

**Codebase status:**
- `pg_trgm` extension and `conflict_check_log` table — in migration 007 (EXISTS)
- `run_conflict_check()` RPC — defined in migration 007 (EXISTS, but body references "threshold 0.35" without full SQL; needs verification)
- Frontend conflict check UI — from catalog-components, `ClientForm` is raw HTML, likely no conflict check integration

**Gaps:**
1. Frontend conflict check UI needs implementation
2. Case editor client picker integration missing

### §4.18 Guided Client Intake Form (Phase 3)

**Specified:**
- 6-step wizard: Conflict Check → Client Details → Decedent Info → Family Composition → Asset Summary → Review & Save
- Creates clients row + cases row + case_deadlines rows + case_documents rows in one transaction
- Pre-populates `EngineInput` from intake data

**Codebase status:** From catalog-components, `ClientForm` is raw HTML — no wizard structure. This feature is **MISSING** from the codebase.

### §4.19 Family Tree Visualizer (Phase 2)

**Specified:**
- `react-d3-tree v3.6.x` — **NOT INSTALLED**
- Lazy-loaded tab in ResultsView
- 9 node role types with color coding
- 3 edge types (parent-child, marriage, representation)
- `getSVGString()` via `useImperativeHandle` for PDF embedding

**Codebase status:** `react-d3-tree` not installed → feature absent. From catalog-components, FamilyTreeTab is in the components directory but is likely a stub or empty shell.

### §4.20 Deadline Tracker (Phase 4)

**Specified:**
- `computeDeadlineStatus()` client-side (done/overdue/urgent/upcoming/future)
- `generateAndSaveDeadlines()` called on case creation and when DOD changes
- Case-level timeline panel (collapsible, color-coded)
- Dashboard deadline urgency chip on case cards
- `/deadlines` all-cases view: OVERDUE / DUE THIS WEEK / URGENT / DUE SOON / UPCOMING sections
- `get_case_deadline_summaries` RPC (N+1 prevention)

**Codebase status (from catalog-components):**
- `DeadlineTimeline` — raw HTML + missing click handler for "Mark Done"
- `case_deadlines` table EXISTS in migration 005
- `get_case_deadline_summaries` RPC — **UNKNOWN** status
- Dashboard urgency chip — **MISSING**

**Gaps:**
1. `DeadlineTimeline` needs full implementation
2. `generateAndSaveDeadlines()` — unknown if implemented (not in catalog-lib-hooks findings)
3. `/deadlines` all-cases view — unknown completeness
4. Dashboard urgency chip missing

### §4.21 Timeline Report (Phase 4)

**Specified:**
- 7 EJS settlement stages mapped to milestones
- Stage status: complete/in-progress/upcoming/overdue
- Horizontal progress bar + stage cards
- `/share/:token?view=timeline` — shareable client-facing view
- Standalone A4 printable PDF

**Codebase status:** Timeline report UI — **UNKNOWN**. The `/share/:token?view=timeline` query param handling is not confirmed.

### §4.22 Document Checklist (Phase 4)

**Specified:**
- Smart seeding rules (15 documents with conditional logic)
- Per-item: check off with date + note, mark N/A, add note
- Progress bar: obtained / (total − not_applicable)
- PDF appendix integration

**Codebase status (from catalog-components):**
- `DocumentChecklist` — **STUB** with "unimplemented backend functions"
- `case_documents` table EXISTS in migration 001

**Gaps:**
1. `DocumentChecklist` backend functions need implementation
2. Smart seeding logic (15 conditional rules) not yet coded

### §4.23 Estate Tax Inputs Wizard (Phase 5)

**Specified:**
- 8-tab wizard for `EstateTaxWizardState`
- `/cases/:id/tax` route
- Pre-population from inheritance wizard
- Auto-save to `cases.tax_input_json`
- Conditional fields: funeral tab visible only for PRE-TRAIN, NRA worldwide fields when `isNonResidentAlien`

**Codebase status:** Route `/cases/:id/tax` **COMPLETELY MISSING** from codebase.

---

## §6 Tech Stack — Package Gap Analysis

### Packages NOT installed that spec requires (§6.2)

| Package | Version | Required For | Install Priority |
|---------|---------|-------------|-----------------|
| `@react-pdf/renderer` | `^4.x` | PDF export (§4.1) | CRITICAL |
| `jszip` | `^3.10.1` | Case export ZIP (§4.16) | HIGH |
| `react-markdown` | `^9.x` | Case notes (§4.6) | HIGH |
| `remark-gfm` | `^4.x` | Case notes (§4.6) | HIGH |
| `rehype-sanitize` | `^6.x` | Case notes (§4.6) | HIGH |
| `qrcode.react` | `^3.x` | Shareable links (§4.10) | MEDIUM |
| `react-d3-tree` | `^3.6.x` | Family tree visualizer (§4.19) | MEDIUM |

**Also needed but NOT in spec (from catalog-config analysis):**
- A toast notification library (e.g., `sonner` or `react-hot-toast`) — required for auto-save feedback (§4.2)
- A date manipulation library (e.g., `date-fns`) — required for deadline calculations without timezone bugs (§4.20)

---

## §7 Migration Gap Summary

| Migration File | Spec Says | Codebase Status |
|----------------|-----------|-----------------|
| `001_initial_schema.sql` | Base schema | EXISTS — includes tables that later migrations also define |
| `002_firm_branding_fields.sql` | Firm branding fields on user_profiles | LIKELY REDUNDANT — fields already in 001 |
| `003_comparison_columns.sql` | comparison_* columns on cases | **UNKNOWN** — not confirmed in codebase |
| `004_shared_case_rpc.sql` | get_shared_case() RPC | **UNKNOWN** |
| `005_case_deadlines.sql` | case_deadlines table | EXISTS |
| `006_case_documents.sql` | case_documents table | EXISTS AS NO-OP (conflict fixed) |
| `007_conflict_check.sql` | pg_trgm, conflict_check_log, run_conflict_check() | EXISTS |
| `008_estate_tax_columns.sql` | tax_input_json, tax_output_json, gross_estate on cases | **UNKNOWN** |
| `009_cases_intake_data.sql` | intake_data JSONB on cases | **UNKNOWN** |
| `010_rls_org_scope.sql` | Migrate RLS from user_id to org_id | **UNKNOWN** |

**4 migrations (003, 004, 008, 009) are unconfirmed** — columns they add may not exist on the `cases` table.

---

## §8 Acceptance Criteria — Platform-Relevant Items

From §8, global criteria that have immediate platform implications:

1. **All monetary amounts in ₱** with comma-formatted centavo display: `₱1,234,567.89` — needs `formatPeso()` utility
2. **All dates in PH locale**: "15 Jan 2026" in UI, ISO in storage — `formatDateOfDeath()` function specified in §4.13
3. **WCAG 2.1 AA minimum**: keyboard navigation, ARIA labels, focus management in modals — not addressed in current codebase

---

## Actionable Gaps Discovered (New Aspects to Add)

The following were discovered during this analysis and should be added to the frontier:

1. **verify-migration-columns** — Confirm whether migrations 003, 004, 008, 009 have been applied; verify cases table has `comparison_*`, `tax_*`, and `intake_data` columns
2. **verify-firm-logos-bucket** — Confirm whether `firm-logos` Supabase Storage bucket exists and has correct RLS policies
3. **verify-get-shared-case-rpc** — Confirm `get_shared_case()` RPC exists in Supabase project

These are Wave 1 source verification items needed before Wave 2 can accurately assess journey gaps.

---

## Cross-Reference: Failure Logs → Spec Gaps

| Failure | Spec Section | Status |
|---------|-------------|--------|
| Blank page — supabase.ts crashes without env vars | §4.2 (not specified; spec assumed env vars present) | Fixed manually; needs spec coverage |
| Auth page was placeholder stub | §4.2 (auth providers listed, but no UI spec for sign-in form) | Fixed manually; spec needs exact form fields |
| Landing page dead end (no auth CTA) | §2.3 route table (/ shows dashboard but no unauthenticated state specified) | Fixed manually; spec needs unauthenticated `/` state |
| Unregistered routes /clients/new, /clients/:id | §2.3 route table (routes listed but registration assumed) | Fixed manually |
| Duplicate migration 006 conflicts with 001 | §7 migration strategy (consolidation inconsistency) | Fixed manually |
| Children for representation — no multi-select component | Separate from platform layer — calculator UI spec gap | Fixed manually |
| Authentication flow completely absent from reverse loop spec | This entire analysis is the fix | This analysis file IS the fix |
