# Frontier — Inheritance Premium Features

## Statistics
- Total aspects discovered: 36
- Analyzed: 23
- Pending: 13
- Convergence: 64%

## Pending Aspects (ordered by dependency)

### Wave 1: Domain Research

- [x] codebase-audit — Mine existing frontend types, components, WASM bridge, and engine outputs. Catalog every computed field not rendered, every action not wired, every integration point available.
- [x] pdf-export-patterns — Research react-pdf / @react-pdf/renderer patterns, legal document PDF generation in React. Analyze legal report templates and formatting conventions.
- [x] auth-persistence-patterns — Research Supabase auth + RLS, case management data models, auto-save patterns for legal tools.
- [x] crm-law-firm-patterns — Research law firm CRM tools (Clio, PracticePanther, MyCase). Client management UX patterns for small/solo PH law practices.
- [x] ph-practice-workflow — Research the complete PH estate settlement process: client intake → computation → BIR filing → court petition → distribution. Map where software touches each stage.
- [x] competitive-landscape — Search 8+ queries for estate planning calculators, succession tools, PH legal tech, estate tax SaaS. Deep-dive top 5 competitors with feature matrices.
- [x] legal-doc-formatting — Research PH court document formatting standards, BIR submission requirements, legal report conventions, Philippine legal citation format (NCC articles).
- [x] estate-tax-integration — Read converged estate-tax-engine-spec.md. Map InheritanceShare output → estate tax engine input. Identify data model bridges, combined UI flow, combined PDF output.
- [x] multi-tenancy-patterns — Research multi-tenant SaaS architecture for professional services. Analyze role-based access, firm account management, seat-based pricing patterns.

### Wave 2: Per-Feature Specifications (depends: ALL Wave 1 complete)

- [x] spec-pdf-export — PDF with firm header, distribution table, statute citations, narratives, computation log, warnings. Reads: codebase-audit, pdf-export-patterns, legal-doc-formatting.
- [x] spec-auth-persistence — Supabase auth, cases table, save/load, auto-save. Reads: auth-persistence-patterns, codebase-audit.
- [x] spec-client-profiles — Client table, client-case FK, list/detail pages, intake flow. Depends: spec-auth-persistence. Reads: crm-law-firm-patterns.
- [x] spec-firm-branding — Settings page, firm header on PDF, logo upload/storage. Depends: spec-pdf-export, spec-auth-persistence.
- [x] spec-statute-citations-ui — Render legal_basis[] in distribution table, expandable rows, article text tooltips. Reads: codebase-audit.
- [x] spec-case-notes — Per-case timestamped notes, annotation display, optional PDF inclusion. Depends: spec-auth-persistence.
- [x] spec-print-layout — @media print CSS, A4 formatting, page breaks, hidden nav elements. Reads: legal-doc-formatting, codebase-audit.
- [x] spec-scenario-comparison — Side-by-side testate vs intestate, share diff highlighting, estate planning use case. Reads: codebase-audit.
- [x] spec-bir-1801-integration — Combined inheritance + estate tax workflow, additional input form, combined PDF. Depends: spec-pdf-export, spec-auth-persistence. Reads: estate-tax-integration.
- [x] spec-shareable-links — Read-only case URLs, access control, QR codes, share UI. Depends: spec-auth-persistence.
- [x] spec-multi-seat — Firm accounts, roles (admin/attorney/paralegal), shared client pool, invitation flow. Depends: spec-auth-persistence. Reads: multi-tenancy-patterns.
- [x] spec-share-breakdown-panel — Expandable per-heir row showing from_legitime / from_free_portion / from_intestate split and legitime_fraction. Reads: codebase-audit. [Discovered: codebase-audit]
- [x] spec-decedent-header — Add decedent name and date of death to ResultsHeader for professional report context. Reads: codebase-audit. [Discovered: codebase-audit]
- [x] spec-represents-display — Show "representing [deceased parent name]" label when inherits_by === Representation. Reads: codebase-audit. [Discovered: codebase-audit]
- [ ] spec-donation-summary-in-results — Display the input donations list in results view (advances on inheritance transparency). Reads: codebase-audit. [Discovered: codebase-audit]
- [ ] spec-case-export-zip — Export all case files (input JSON, output JSON, PDF) as a ZIP for offline archival. Legal obligation for PH lawyers. Depends: spec-pdf-export, spec-auth-persistence. [Discovered: auth-persistence-patterns]
- [ ] spec-conflict-check — Search existing clients/heirs before new case intake. PH bar ethics require conflict-of-interest screening. Depends: spec-client-profiles. [Discovered: crm-law-firm-patterns]
- [ ] spec-intake-form — Guided digital intake capturing decedent info, family composition, asset summary; pre-populates case wizard. Depends: spec-client-profiles. [Discovered: crm-law-firm-patterns]
- [ ] spec-family-tree-visualizer — Interactive heir tree diagram (SVG/canvas) showing succession relationships, separate from distribution table. Reads: codebase-audit. [Discovered: crm-law-firm-patterns]
- [ ] spec-deadline-tracker — Per-case deadline timeline: BIR 1-year filing deadline, 3-week newspaper publication window, eCAR receipt, RD filing window. Color-coded status (green/yellow/red). Depends: spec-auth-persistence. [Discovered: ph-practice-workflow]
- [ ] spec-timeline-report — Visual settlement timeline (milestone list or Gantt) generated from case facts showing all stages a lawyer can share with clients. Depends: spec-auth-persistence. [Discovered: competitive-landscape]
- [ ] spec-document-checklist — Per-case document checklist (PSA death cert, TCT/CCT, ITR, bank certs) with check-off status tracking. Depends: spec-auth-persistence. [Discovered: competitive-landscape]
- [ ] spec-estate-tax-inputs-wizard — Detailed multi-tab wizard UI for estate tax inputs: Schedules 1/1A/2/2A/3/4 (assets) + Schedules 5A-5H/6 (deductions) + amnesty/filing flags. Depends: spec-auth-persistence. Reads: estate-tax-integration. [Discovered: estate-tax-integration]

### Wave 3: Synthesis (depends: ALL Wave 2 complete)

- [ ] architecture-overview — Shared data model ERD, Supabase schema DDL, component hierarchy, API layer design, implementation dependency graph.
- [ ] mega-spec-draft — Read ALL analysis/ files → synthesize into /docs/plans/inheritance-premium-spec.md.
- [ ] placeholder-validation — **HARD GATE.** Exhaustive line-by-line scan of ALL analysis/ files and /docs/plans/inheritance-premium-spec.md for banned placeholder patterns (TODO, TBD, stubs, empty sections, deferral phrases, sample values). Must report PASS with zero findings before loop can converge. Depends: mega-spec-draft.
- [ ] mega-spec-review — Validate spec completeness, cross-feature dependencies, implementation order, AND confirm placeholder-validation PASS. Write status/converged.txt only if ALL checks pass including zero placeholders. Depends: placeholder-validation.
