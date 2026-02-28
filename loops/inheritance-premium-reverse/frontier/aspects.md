# Frontier — Inheritance Premium Features

## Statistics
- Total aspects discovered: 23
- Analyzed: 0
- Pending: 23
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Domain Research

- [ ] codebase-audit — Mine existing frontend types, components, WASM bridge, and engine outputs. Catalog every computed field not rendered, every action not wired, every integration point available.
- [ ] pdf-export-patterns — Research react-pdf / @react-pdf/renderer patterns, legal document PDF generation in React. Analyze legal report templates and formatting conventions.
- [ ] auth-persistence-patterns — Research Supabase auth + RLS, case management data models, auto-save patterns for legal tools.
- [ ] crm-law-firm-patterns — Research law firm CRM tools (Clio, PracticePanther, MyCase). Client management UX patterns for small/solo PH law practices.
- [ ] ph-practice-workflow — Research the complete PH estate settlement process: client intake → computation → BIR filing → court petition → distribution. Map where software touches each stage.
- [ ] competitive-landscape — Search 8+ queries for estate planning calculators, succession tools, PH legal tech, estate tax SaaS. Deep-dive top 5 competitors with feature matrices.
- [ ] legal-doc-formatting — Research PH court document formatting standards, BIR submission requirements, legal report conventions, Philippine legal citation format (NCC articles).
- [ ] estate-tax-integration — Read converged estate-tax-engine-spec.md. Map InheritanceShare output → estate tax engine input. Identify data model bridges, combined UI flow, combined PDF output.
- [ ] multi-tenancy-patterns — Research multi-tenant SaaS architecture for professional services. Analyze role-based access, firm account management, seat-based pricing patterns.

### Wave 2: Per-Feature Specifications (depends: ALL Wave 1 complete)

- [ ] spec-pdf-export — PDF with firm header, distribution table, statute citations, narratives, computation log, warnings. Reads: codebase-audit, pdf-export-patterns, legal-doc-formatting.
- [ ] spec-auth-persistence — Supabase auth, cases table, save/load, auto-save. Reads: auth-persistence-patterns, codebase-audit.
- [ ] spec-client-profiles — Client table, client-case FK, list/detail pages, intake flow. Depends: spec-auth-persistence. Reads: crm-law-firm-patterns.
- [ ] spec-firm-branding — Settings page, firm header on PDF, logo upload/storage. Depends: spec-pdf-export, spec-auth-persistence.
- [ ] spec-statute-citations-ui — Render legal_basis[] in distribution table, expandable rows, article text tooltips. Reads: codebase-audit.
- [ ] spec-case-notes — Per-case timestamped notes, annotation display, optional PDF inclusion. Depends: spec-auth-persistence.
- [ ] spec-print-layout — @media print CSS, A4 formatting, page breaks, hidden nav elements. Reads: legal-doc-formatting, codebase-audit.
- [ ] spec-scenario-comparison — Side-by-side testate vs intestate, share diff highlighting, estate planning use case. Reads: codebase-audit.
- [ ] spec-bir-1801-integration — Combined inheritance + estate tax workflow, additional input form, combined PDF. Depends: spec-pdf-export, spec-auth-persistence. Reads: estate-tax-integration.
- [ ] spec-shareable-links — Read-only case URLs, access control, QR codes, share UI. Depends: spec-auth-persistence.
- [ ] spec-multi-seat — Firm accounts, roles (admin/attorney/paralegal), shared client pool, invitation flow. Depends: spec-auth-persistence. Reads: multi-tenancy-patterns.

### Wave 3: Synthesis (depends: ALL Wave 2 complete)

- [ ] architecture-overview — Shared data model ERD, Supabase schema DDL, component hierarchy, API layer design, implementation dependency graph.
- [ ] mega-spec-draft — Read ALL analysis/ files → synthesize into /docs/plans/inheritance-premium-spec.md.
- [ ] mega-spec-review — Validate spec completeness, cross-feature dependencies, implementation order. Write status/converged.txt if passes.
