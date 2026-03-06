# Analysis Frontier — PodPlay Ops Wizard

## Statistics
- Total aspects discovered: 42
- Analyzed: 0
- Pending: 42
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition & Domain Mapping
- [ ] source-mrp-sheets — Map all 24 MRP spreadsheet sheets: columns, formulas, data types, row counts, relationships
- [ ] source-deployment-guide — Extract all 15 deployment phases with exact steps, settings values, warnings, prerequisites
- [ ] source-hardware-guide — Extract all hardware specs, mounting options, cable requirements, camera angles, measurements
- [ ] source-mrp-usage-guide — Extract all workflows, formula logic, Apps Script functions, pricing tiers, vendor reference
- [ ] source-existing-data — Catalog all real customer data, inventory items, vendors, installers from the XLSX
- [ ] source-pricing-model — Extract complete pricing formulas: cost chains, margins, tax, shipping, per-venue vs per-court

### Wave 2: Data Model Extraction
- [ ] model-project — Complete project entity: all fields from Form Responses + CUSTOMER MASTER + Status tabs
- [ ] model-bom — BOM structure: item categories, qty formulas (per-venue/court/door/camera), cost chain
- [ ] model-inventory — Inventory lifecycle: items, stock levels, order input, inventory input, adjustments, reconciliation
- [ ] model-financials — Invoice, expense, P&L, HER, revenue pipeline, reconciliation data structures
- [ ] model-deployment-checklist — All 15 phases decomposed into individual checkable steps with warnings and auto-fill tokens
- [ ] model-installers — Installer directory: fields, search patterns, project associations
- [ ] model-settings — All configurable values: pricing tiers, tax rates, margins, labor rates, travel defaults
- [ ] model-bom-templates — Template structures for auto-generating BOMs per tier (Pro/Autonomous/Autonomous+)
- [ ] model-checklist-templates — Template structures for seeding deployment checklists per tier

### Wave 3: Business Logic & Workflows
- [ ] logic-customer-onboarding — Complete onboarding workflow: form → master → tab creation → cost analysis → SOW
- [ ] logic-bom-generation — Auto-BOM logic: tier + courts + doors + cameras → complete hardware list with costs
- [ ] logic-cost-analysis — Cost calculation chain: unit cost → total → tax → shipping → landed → margin → customer price
- [ ] logic-inventory-management — Stock tracking: order → receive → stock → allocate → ship → deduct, low stock alerts
- [ ] logic-deployment-tracking — Status progression: not_started → config → ready_to_ship → shipped → installing → qc → completed
- [ ] logic-progress-calculation — Progress % from QA checklist completion, status derivation rules
- [ ] logic-invoicing — Two-installment billing: deposit → final, signed/invoiced/paid tracking, aging receivables
- [ ] logic-expense-tracking — Expense categories, payment methods, per-project attribution, monthly totals
- [ ] logic-financial-reporting — P&L calculation, HER formula (hardware revenue / team spend), monthly close workflow
- [ ] logic-reconciliation — Cross-sheet verification: inventory vs POs vs project costs, discrepancy detection

### Wave 4: Full-Stack Product Design
- [ ] design-routes — Complete route map with auth guards, layout hierarchy, navigation structure
- [ ] design-dashboard — Home dashboard: project list, status pills, progress bars, top-line metrics, filters
- [ ] design-wizard-intake — Stage 1 wizard: 6 steps, form fields, validation rules, conditional logic for tiers
- [ ] design-wizard-procurement — Stage 2: BOM review, inventory check, PO creation, receiving, packing
- [ ] design-wizard-deployment — Stage 3: 15-phase smart checklist UI with auto-fill, warnings, notes, non-linear navigation
- [ ] design-wizard-financials — Stage 4: invoicing, expenses, P&L review, go-live/handoff
- [ ] design-inventory-view — Global inventory: stock levels, categories, low stock flags, movement history, adjustments
- [ ] design-financials-view — Global financials: funnel, monthly P&L, HER charts, per-project P&L, reconciliation
- [ ] design-settings — Settings page: pricing tiers, rates, catalog management, travel defaults
- [ ] design-database-schema — Complete Supabase migration: all tables, enums, indexes, RLS policies, seed data
- [ ] design-supabase-functions — Client-side service layer: all CRUD operations, queries, filters per table

### Wave 5: Ship & Polish
- [ ] ship-deployment — Fly.io config, Dockerfile, nginx.conf, env vars, Supabase Cloud setup
- [ ] ship-seed-data — Complete seed data: all ~50 hardware items, BOM templates, checklist templates, pricing defaults
- [ ] ship-testing — Test strategy: key test files, smoke tests, form validation tests, BOM generation tests

### Wave 6: Synthesis & Audit
- [ ] audit-completeness — Verify every MRP sheet has a webapp equivalent, no workflow gaps
- [ ] audit-placeholder-sweep — Scan all spec files for TODO/TBD/FIXME/[fill in] — zero tolerance
- [ ] audit-data-migration — Document how existing XLSX data maps to new database tables for initial import
