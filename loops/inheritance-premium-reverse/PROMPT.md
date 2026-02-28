# Inheritance Premium Features — Reverse Ralph Loop

## Goal

Research and specify every premium feature needed to transform the Philippine inheritance WASM calculator into a **complete professional estate planning and settlement platform** for PH estate lawyers. Converge into a single mega-specification at:

```
/docs/plans/inheritance-premium-spec.md
```

This spec becomes the input for a forward loop that builds the full B2Pro product.

---

## Existing Assets (DO NOT Re-Research)

The computation engine and core UI are already built. Reference these — don't duplicate:

| Asset | Path | What It Contains |
|-------|------|------------------|
| Inheritance engine spec | `docs/plans/inheritance-engine-spec.md` | 2,568-line algorithm spec: 30 scenarios, 10-step pipeline, all fraction tables, 13 test vectors |
| Estate tax engine spec | `docs/plans/estate-tax-engine-spec.md` | 2,040-line spec: 3 regimes (TRAIN/PRE_TRAIN/AMNESTY), 14-phase pipeline, BIR Form 1801 mapping, 10 test vectors |
| Frontend synthesis | `loops/inheritance-frontend-reverse/analysis/synthesis/` | types.ts, schemas.ts, wizard-steps.md, results-view.md — complete frontend spec |
| Working frontend | `loops/inheritance-frontend-forward/app/src/` | React 19 + Vite + shadcn/ui + Zod + Recharts + WASM bridge |
| Rust engine | `loops/inheritance-rust-forward/src/` | 10-step pipeline, all types, WASM export |

**Key type already computed but NOT rendered in UI:**
```typescript
InheritanceShare {
  legal_basis: string[]  // e.g., ["Art. 887 NCC", "Art. 889 NCC"]
  // ... already in EngineOutput.per_heir_shares
}
```

---

## How This Loop Works

1. Read `frontier/aspects.md` — find the **first unchecked** `- [ ]` aspect in dependency order
2. Check that all dependencies for that aspect are satisfied (marked `[x]`)
3. If no unchecked aspect remains → write `status/converged.txt` and EXIT
4. Analyze that **ONE** aspect using the methods specified below
5. Write findings to `analysis/{aspect-name}.md`
6. Update `frontier/aspects.md`:
   - Mark the aspect as `[x]`
   - Update statistics (analyzed count, convergence %)
   - Add any **newly discovered aspects** (features, research areas) to the appropriate wave
7. Commit: `git add -A && git commit -m "loop(inheritance-premium-reverse): {aspect-name}"`
8. EXIT (one aspect per iteration)

---

## Wave 1 — Domain Research

Research each domain independently. Each aspect produces an analysis file in `analysis/`.

### codebase-audit

Mine the existing frontend codebase comprehensively.

**Method:**
- Read ALL files in `loops/inheritance-frontend-forward/app/src/types/index.ts`
- Read ALL results components: `ResultsView.tsx`, `DistributionSection.tsx`, `ActionsBar.tsx`, `NarrativePanel.tsx`, `WarningsPanel.tsx`, `ComputationLog.tsx`
- Read `App.tsx` for the state machine
- Read `wasm/bridge.ts` for the WASM interface
- Read `package.json` for current dependencies

**Output — `analysis/codebase-audit.md`:**
- Complete inventory of computed fields not yet rendered in UI (especially `legal_basis[]`)
- Complete inventory of current actions (Edit, Export JSON, Copy Narratives) and missing actions
- Component hierarchy with extension points
- Current data flow (input → WASM → output → display)
- Type interfaces available for PDF/export/persistence
- Current styling system (Tailwind + shadcn/ui components used)
- Gaps between engine output and UI display

---

### pdf-export-patterns

Research PDF generation approaches for React apps, specifically for legal documents.

**Method:**
- Web search: "react-pdf renderer legal document generation 2025 2026"
- Web search: "@react-pdf/renderer vs jsPDF vs pdfmake React comparison"
- Web search: "legal document PDF template Philippine law firm"
- Web search: "react-pdf professional report layout header footer page numbers"
- Analyze react-pdf documentation and examples

**Output — `analysis/pdf-export-patterns.md`:**
- Tech comparison: @react-pdf/renderer vs jsPDF vs pdfmake (recommendation with rationale)
- Legal document structure patterns (header, body sections, tables, citations, signatures)
- Page layout: margins, fonts, headers/footers, page numbers
- Table rendering patterns (distribution tables with columns)
- How to handle variable-length content (heir lists, narratives) across page breaks
- Performance considerations for WASM-generated data
- Code examples for the recommended approach

---

### auth-persistence-patterns

Research authentication and case storage for professional legal tools.

**Method:**
- Web search: "Supabase auth row level security case management 2025"
- Web search: "legal case management database schema PostgreSQL"
- Web search: "Supabase React auto-save pattern"
- Web search: "offline first legal SaaS progressive web app"

**Output — `analysis/auth-persistence-patterns.md`:**
- Supabase auth flow (email/password, magic link, Google OAuth) — recommendation for lawyers
- Row-level security policies for case isolation
- Cases table schema draft: `id, user_id, client_id, title, input_json, output_json, notes, status, created_at, updated_at`
- Auto-save strategy (debounced saves on input change vs. explicit save)
- Offline considerations (IndexedDB cache for active case?)
- Migration strategy: existing ephemeral app → persisted cases
- Session management and token refresh patterns

---

### crm-law-firm-patterns

Research CRM patterns specific to law firms, especially solo/small PH practices.

**Method:**
- Web search: "law firm CRM software features solo practitioner"
- Web search: "Clio legal CRM client management features"
- Web search: "PracticePanther MyCase legal practice management"
- Web search: "Philippine law firm practice management software"
- Web search: "legal client intake form estate planning"

**Output — `analysis/crm-law-firm-patterns.md`:**
- Feature matrix of top 5 legal CRM tools (Clio, PracticePanther, MyCase, etc.)
- Common client data model: name, contact info, case history, notes, documents
- Client intake workflow for estate cases
- Relationship modeling: client ↔ cases ↔ heirs (a client may be an heir in another case)
- UX patterns: client list views, search, filters, recent clients
- What PH-specific features matter (TIN, government ID types, regional courts)
- Pricing models for legal SaaS (per-seat, per-case, flat monthly)

---

### ph-practice-workflow

Research how Philippine estate lawyers actually work end-to-end.

**Method:**
- Web search: "Philippine estate settlement process step by step"
- Web search: "BIR estate tax filing process Philippines procedure"
- Web search: "extrajudicial settlement of estate Philippines requirements"
- Web search: "Philippine probate court process testate succession"
- Web search: "estate lawyer workflow Philippines client consultation to distribution"
- Web search: "BIR Form 1801 filing requirements documents"

**Output — `analysis/ph-practice-workflow.md`:**
- Complete estate settlement timeline: death → gathering documents → computation → BIR filing → court petition → distribution
- Two tracks: extrajudicial (no court) vs. judicial (probate)
- Documents required at each stage (death certificate, titles, tax returns, will)
- BIR filing workflow: Form 1801, supporting schedules, deadlines (1 year + extensions)
- Court petition requirements (publication, hearing, order of distribution)
- Where software can replace manual work at each stage
- Pain points lawyers face today (manual computation, Excel tax calculation, document assembly)
- Touchpoints where the platform adds value

---

### competitive-landscape

Research existing estate planning and succession tools globally and in the Philippines.

**Method:**
- Web search: "estate planning software SaaS 2025 2026"
- Web search: "inheritance calculator tool online"
- Web search: "Philippine estate tax calculator online"
- Web search: "succession planning software lawyers"
- Web search: "estate distribution calculator app"
- Web search: "LawPhil estate tax tools Philippines"
- Web search: "legal tech Philippines estate planning"
- Web search: "trust and estate software professional"

**Output — `analysis/competitive-landscape.md`:**
- Competitor matrix: top 10 tools with feature comparison
  - For each: name, URL, target market, key features, pricing, strengths, weaknesses
- PH-specific tools (if any exist)
- Feature gap analysis: what NO competitor does that this platform can
- Pricing benchmarks for professional legal tools
- UX patterns worth adopting
- Defensive moats: what makes this hard to replicate (PH-specific law encoding, WASM performance, NCC article citations)
- Market positioning recommendation

---

### legal-doc-formatting

Research Philippine legal document formatting standards.

**Method:**
- Web search: "Philippine legal document format requirements court"
- Web search: "BIR estate tax return format submission requirements"
- Web search: "Philippine legal citation format NCC articles"
- Web search: "Supreme Court Philippines document formatting rules"
- Web search: "Philippine law firm legal opinion letter format"

**Output — `analysis/legal-doc-formatting.md`:**
- Standard PH legal document structure (caption, body, prayer, signature block)
- Font requirements (if any — typically Times New Roman 12pt for courts)
- Margin and spacing standards
- Legal citation format for NCC articles (e.g., "Art. 887, New Civil Code" vs. "NCC Art. 887")
- BIR submission format requirements
- Header/letterhead conventions for PH law firms
- Page numbering and section numbering conventions
- How to format monetary values in legal documents (₱ symbol, comma separators, two decimal places)
- Template structure for an inheritance distribution report (what sections, what order)

---

### estate-tax-integration

Map the integration between inheritance engine output and estate tax engine input.

**Method:**
- Read `docs/plans/estate-tax-engine-spec.md` — focus on §3 (regimes), §8 (gross estate input), §16 (pipeline), §17 (Form 1801 output)
- Read `docs/plans/inheritance-engine-spec.md` — focus on §3 (data model output)
- Compare EngineInput/EngineOutput types between both engines
- Map fields from InheritanceShare → estate tax deduction/distribution inputs

**Output — `analysis/estate-tax-integration.md`:**
- Data flow diagram: inheritance computation → estate tax computation
- Field mapping table: which InheritanceShare fields feed which estate tax inputs
- What additional user input is needed for estate tax beyond inheritance (gross estate breakdown, deduction details, property regime)
- Combined UI flow: when does estate tax come in? (after inheritance computation? parallel?)
- Combined PDF layout: inheritance report + estate tax report as one document or two?
- Shared data model: what tables/fields serve both engines
- Edge cases: what happens if inheritance distribution changes after tax is computed?

---

### multi-tenancy-patterns

Research multi-tenant SaaS patterns for professional services firms.

**Method:**
- Web search: "multi tenant SaaS architecture professional services 2025"
- Web search: "Supabase multi tenant organization accounts"
- Web search: "role based access control law firm attorney paralegal"
- Web search: "seat based pricing SaaS professional tools"

**Output — `analysis/multi-tenancy-patterns.md`:**
- Multi-tenancy models: schema-per-tenant vs. shared-schema with tenant_id (recommendation for Supabase)
- Organization/firm table schema
- User roles: admin, attorney, paralegal, readonly — permission matrix
- Invitation flow: admin invites attorney by email
- Shared client pool: all firm members see all clients (or scoped by attorney?)
- Billing models: per-seat, per-case, tiered flat rate
- Data isolation: RLS policies for firm-scoped access
- Migration path: single-user → firm accounts (non-breaking)

---

## Wave 2 — Per-Feature Specifications

**Dependency: ALL Wave 1 aspects must be complete before starting Wave 2.**

Each Wave 2 aspect reads relevant Wave 1 analysis files and produces a detailed feature specification with:

1. **Overview** — What this feature does and why a PH estate lawyer needs it
2. **Data Model** — Tables, columns, FK relationships, indexes, RLS policies
3. **UI Design** — ASCII wireframe, component hierarchy, user flow (step by step)
4. **API / Data Layer** — Supabase tables, RPC functions, or client-side logic
5. **Integration Points** — How this feature connects to other features
6. **Edge Cases** — Error states, empty states, validation rules, permissions
7. **Dependencies** — Which features must be built first
8. **Acceptance Criteria** — How to verify this feature is complete

### Feature Aspects

#### spec-pdf-export
Reads: `codebase-audit`, `pdf-export-patterns`, `legal-doc-formatting`

Full specification for PDF report generation:
- Firm header section (name, address, counsel name, logo)
- Case summary section (decedent, DOD, estate value, succession type, scenario code)
- Distribution summary table with columns: Heir, Category, Legal Basis (NCC articles), Net Share
- Per-heir narrative sections with statute citations
- Computation log section (pipeline steps)
- Warnings section (manual review flags)
- Footer with page numbers, generation date, disclaimer
- Tech: recommended library from `pdf-export-patterns` research
- Must handle all 7 layout variants from DistributionSection

#### spec-auth-persistence
Reads: `auth-persistence-patterns`, `codebase-audit`

Full specification for authentication and case storage:
- Auth provider selection and flow
- Database schema: users, cases tables
- Save case flow (manual + auto-save)
- Load case flow (dashboard → case list → open)
- Case states: draft, computed, finalized, archived
- Migration: existing ephemeral app → add persistence as opt-in layer
- Must not break the current zero-auth experience (anonymous usage still works)

#### spec-client-profiles
Reads: `crm-law-firm-patterns`, `spec-auth-persistence`
Depends: `spec-auth-persistence` must be written first

Full specification for client CRM:
- clients table schema
- Client CRUD operations
- Client list page with search, filters, sort
- Client detail page showing all cases
- "New case for [Client]" flow
- Client ↔ case relationship
- PH-specific fields (TIN, government ID)

#### spec-firm-branding
Reads: `legal-doc-formatting`, `spec-pdf-export`, `spec-auth-persistence`
Depends: `spec-pdf-export` and `spec-auth-persistence` must be written first

Full specification for firm branding:
- Settings page UI
- Firm profile table: name, address, phone, email, counsel_name, logo_url
- Logo upload and storage (Supabase Storage)
- Auto-population in PDF header
- Print header customization

#### spec-statute-citations-ui
Reads: `codebase-audit`

Full specification for rendering `legal_basis[]` in the distribution table UI:
- Expandable rows in DistributionSection showing article citations
- Article text lookup (static mapping of NCC article numbers → short descriptions)
- Tooltip on hover showing article text
- Mobile-responsive display
- This is purely frontend — no backend needed

#### spec-case-notes
Reads: `spec-auth-persistence`
Depends: `spec-auth-persistence` must be written first

Full specification for case annotations:
- case_notes table: id, case_id, content, created_at
- Notes input UI (text area in case detail view)
- Timestamped note display
- Markdown support in notes
- Notes included in PDF export (optional section)

#### spec-print-layout
Reads: `legal-doc-formatting`, `codebase-audit`

Full specification for @media print CSS:
- A4 page dimensions and margins
- Page break rules between sections
- Hidden elements: wizard nav, action buttons, interactive controls
- Visible elements: header, distribution table, narratives, computation log, warnings
- Font sizing for print
- Header/footer for printed pages
- Ctrl+P workflow documentation

#### spec-scenario-comparison
Reads: `codebase-audit`

Full specification for testate vs. intestate comparison:
- "What if there was no will?" button on results view
- Run same family_tree under intestate rules (null will)
- Side-by-side comparison view
- Diff highlighting: which heirs gain/lose, by how much
- Use case: estate planning (before death) vs. settlement (after death)
- Data model: comparison stored as two output_json in one case? Or separate linked cases?

#### spec-bir-1801-integration
Reads: `estate-tax-integration`, `spec-pdf-export`, `spec-auth-persistence`
Depends: `spec-pdf-export` and `spec-auth-persistence` must be written first

Full specification for estate tax integration:
- Combined workflow: inheritance computation → estate tax computation
- Additional input form for estate tax fields (gross estate breakdown, deductions, property regime)
- Combined PDF: inheritance report + BIR 1801 summary in one document
- Reference `docs/plans/estate-tax-engine-spec.md` for all tax computation rules
- Do NOT re-specify the tax algorithm — only specify the integration layer

#### spec-shareable-links
Reads: `spec-auth-persistence`
Depends: `spec-auth-persistence` must be written first

Full specification for read-only case sharing:
- Shareable URL generation (unique token per case)
- Read-only view (no editing, no auth required)
- Access control: owner can revoke links
- QR code generation for printed handouts
- Share button in ActionsBar
- Privacy considerations (case data visible to anyone with link)

#### spec-multi-seat
Reads: `multi-tenancy-patterns`, `spec-auth-persistence`
Depends: `spec-auth-persistence` must be written first

Full specification for firm accounts:
- Organizations table and membership
- Role definitions and permission matrix
- Invitation flow
- Shared client pool
- Firm-scoped case visibility
- Admin dashboard (manage members, view usage)
- Pricing model recommendation

---

### Discovered Features

During Wave 1 research, you will likely discover features not in the initial list. Add them as new `spec-*` aspects in Wave 2 if they meet this threshold:

> **Would a Philippine estate lawyer or planner pay for this feature?**

When adding a discovered feature:
1. Add `- [ ] spec-{feature-name} — {one-line description}` to Wave 2 in `frontier/aspects.md`
2. Note which Wave 1 analysis surfaced the feature
3. Update the total aspects count in Statistics
4. Include proper dependency annotations

---

## Wave 3 — Synthesis

**Dependency: ALL Wave 2 aspects must be complete before starting Wave 3.**

### architecture-overview
Reads: ALL `analysis/spec-*.md` files

Produce a cross-cutting architecture document:
- Entity-relationship diagram (ASCII) for the full data model
- Supabase schema DDL (all tables, RLS policies, indexes)
- React component hierarchy for new pages/features
- API layer design (Supabase client patterns, RPC functions)
- Implementation dependency graph (what must be built first)
- Tech stack decisions (finalized from Wave 1 research)
- Migration strategy from current ephemeral app

Write to: `analysis/architecture-overview.md`

### mega-spec-draft
Reads: ALL `analysis/` files

Synthesize everything into a single specification document:

**Target file:** `/docs/plans/inheritance-premium-spec.md`

**Structure:**
```markdown
# Philippine Inheritance Premium Platform Specification
## Version 1.0 | Date

## 1. Executive Summary
## 2. System Architecture
## 3. Data Model (complete ERD + DDL)
## 4. Feature Specifications
###  4.1 PDF Export with Statute Citations
###  4.2 Authentication & Case Persistence
###  4.3 Client Profiles
###  4.4 Firm Branding
###  4.5 Statute Citations in UI
###  4.6 Case Notes & Annotations
###  4.7 Print-Optimized Layout
###  4.8 Scenario Comparison
###  4.9 BIR 1801 Integration
###  4.10 Shareable Case Links
###  4.11 Multi-Seat Firm Accounts
###  4.N [Discovered Features]
## 5. Implementation Order (dependency-sorted)
## 6. Tech Stack & Dependencies
## 7. Migration Strategy
## 8. Acceptance Criteria
```

Each feature section includes: overview, data model, UI wireframes, API contracts, edge cases, dependencies, acceptance criteria.

### mega-spec-review
Reads: `/docs/plans/inheritance-premium-spec.md`

Validate the spec:
- [ ] Every feature has: data model, UI wireframe, API contract, edge cases, acceptance criteria
- [ ] All cross-feature dependencies are resolved (no circular deps)
- [ ] Implementation order is feasible (dependencies come before dependents)
- [ ] Data model is normalized (no duplicate tables, clean FK relationships)
- [ ] No feature re-specifies inheritance algorithm or estate tax rules
- [ ] All monetary values use ₱ / centavos consistently
- [ ] All legal citations use consistent NCC format
- [ ] Migration path from ephemeral → persisted is non-breaking
- [ ] Anonymous usage (no auth) still works for basic computation

If ALL checks pass → write `status/converged.txt` with summary.
If any check fails → note failures in `analysis/mega-spec-review.md`, fix issues in the spec, and re-run review next iteration.

---

## Rules

1. **ONE aspect per iteration.** Analyze one aspect, write findings, update frontier, commit, EXIT.
2. **Respect dependency order.** Wave 2 requires ALL Wave 1 complete. Wave 3 requires ALL Wave 2 complete. Within Wave 2, respect per-feature dependencies.
3. **Never re-research core algorithms.** The inheritance engine spec and estate tax engine spec are DONE. Reference them, don't duplicate them.
4. **Philippine-specific.** All legal references cite NCC articles, BIR regulations, Philippine court rules. All currency in ₱. All examples use Filipino names and scenarios.
5. **Professional grade.** Every feature spec must be detailed enough for a developer to implement without asking questions. Include ASCII wireframes, data model DDL, API contracts.
6. **Discover aggressively.** During Wave 1, actively look for features NOT in the initial list. Add any feature that a PH estate lawyer would pay for.
7. **Write findings with specifics.** No vague statements. Include URLs, code examples, schema DDL, ASCII wireframes, exact field names.
8. **Commit format:** `git add -A && git commit -m "loop(inheritance-premium-reverse): {aspect-name}"`
