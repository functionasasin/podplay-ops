# Analysis Frontier — PodPlay Ops Wizard

## Statistics
- Total aspects discovered: 68
- Analyzed: 63
- Pending: 5
- Convergence: 93%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition & Domain Mapping
- [x] source-mrp-sheets — Map all 24 MRP spreadsheet sheets: columns, formulas, data types, row counts, relationships [SKIPPED: docs/Kim Lapus PodPlay MRP.xlsx not present in repo — sheet structure derived from design doc, usage guide, and MRP analysis in other aspects]
- [x] source-deployment-guide — Extract all 15 deployment phases + 6 appendices with exact steps, settings values, warnings, prerequisites
- [x] source-hardware-guide — Extract all hardware specs, mounting options, cable requirements, camera angles, measurements, front desk equipment
- [x] source-mrp-usage-guide — Extract all workflows, formula logic, Apps Script functions, pricing tiers, vendor reference [PARTIAL: PDF not in repo; derived from config-guide-v1, hardware-bom, design doc, training transcripts]
- [x] source-existing-data — Catalog all real customer data, inventory items, vendors, installers from the XLSX [SKIPPED: docs/Kim Lapus PodPlay MRP.xlsx not present in repo — data migration plan derived from sheet structure analysis in audit-data-migration; real data import deferred to operator post-deploy via migration scripts in final-mega-spec/deployment/data-migration.md]
- [x] source-pricing-model — Extract complete pricing formulas: cost chains, margins, tax, shipping, per-venue vs per-court

### Wave 2: Data Model Extraction
- [x] model-project — Complete project entity: all fields from Form Responses + CUSTOMER MASTER + Status tabs
- [x] model-bom — BOM structure: item categories, qty formulas (per-venue/court/door/camera), cost chain
- [x] model-inventory — Inventory lifecycle: items, stock levels, order input, inventory input, adjustments, reconciliation
- [x] model-financials — Invoice, expense, P&L, HER, revenue pipeline, reconciliation data structures
- [x] model-deployment-checklist — All 15 phases decomposed into individual checkable steps with warnings and auto-fill tokens
- [x] model-installers — Installer directory: fields, search patterns, project associations
- [x] model-settings — All configurable values: pricing tiers, tax rates, margins, labor rates, travel defaults
- [x] model-bom-templates — Template structures for auto-generating BOMs per tier (Pro/Autonomous/Autonomous+/PBK)
- [x] model-checklist-templates — Template structures for seeding deployment checklists per tier
- [x] model-cc-terminals — CC Form sheet: BBPOS WisePOS E terminal ordering, cost tracking, delivery status, front desk equipment (QR scanner, webcam)
- [x] model-replay-signs — Customer Replay Signs sheet: sign fulfillment lifecycle (Staged > Shipped > Delivered > Installed), qty calc (2x courts), outreach tracking, inventory decrement
- [x] model-support-tiers — Three-tier support escalation model: Tier 1 (on-site), Tier 2 (config specialist), Tier 3 (engineer), per-tier examples, escalation paths
- [x] model-device-migration — Apple Business Manager transfer workflow: release → factory reset → re-enroll → re-configure, MDM comparison (Mosyle vs Jamf)
- [x] model-international-deployment — Asia deployment: Philippines ISP requirements (PLDT/Globe/Converge, business plan + static IP mandatory), PAL vs NTSC, 220V/60Hz power, vendor availability, open questions
- [x] model-network-reference — VLAN architecture seed data (Default .30, REPLAY .32, SURVEILLANCE .31, ACCESS CONTROL .33), key IP addresses, port 4000 reference, bandwidth guidance
- [x] model-team-opex — Team member salary allocations for HER/P&L: Niko 50/50 direct/indirect, Chad 20% indirect, rent $27.6K/yr, indirect salaries $147K/yr
- [x] model-contacts-directory — Internal team contacts: Andy (PM), Nico (hardware/installs), Chad (ops), Stan (config), Agustin (app readiness), CS Team (booking)
- [x] model-tier-variants — PBK tier (Pickleball Kingdom custom pricing), PingPod-specific hardware (audio, speakers, Bluetooth), front desk hardware category (webcam, barcode scanner)

### Wave 3: Business Logic & Workflows
- [x] logic-customer-onboarding — Complete onboarding workflow: form → master → tab creation → cost analysis → SOW
- [x] logic-bom-generation — Auto-BOM logic: tier + courts + doors + cameras → complete hardware list with costs
- [x] logic-cost-analysis — Cost calculation chain: unit cost → total → tax → shipping → landed → margin → customer price
- [x] logic-inventory-management — Stock tracking: order → receive → stock → allocate → ship → deduct, low stock alerts
- [x] logic-deployment-tracking — Status progression: not_started → config → ready_to_ship → shipped → installing → qc → completed
- [x] logic-progress-calculation — Progress % from QA checklist completion, status derivation rules
- [x] logic-invoicing — Two-installment billing: deposit → final, signed/invoiced/paid tracking, aging receivables
- [x] logic-expense-tracking — Expense categories, payment methods, per-project attribution, monthly totals
- [x] logic-financial-reporting — P&L calculation, HER formula (hardware revenue / team spend), monthly close workflow
- [x] logic-reconciliation — Cross-sheet verification: inventory vs POs vs project costs, discrepancy detection
- [x] logic-sign-fulfillment — Replay sign workflow: calculate qty (2x courts), track outreach (Slack/email), shipping, install confirmation, inventory decrement
- [x] logic-troubleshooting — Contextual troubleshooting tips linked to deployment phases: 14 known issue/solution pairs from Appendix A (Mac Mini crash, PoE issues, button pairing, DDNS, port 4000, .DS_Store, pixelation, Firebase re-sync)
- [x] logic-isp-validation — Starlink incompatibility warning, internet speed recommendations by court count (1-30), circuit type guidance (fiber/cable/5G/dedicated), backup ISP requirements for autonomous 24/7 venues, dual ISP backbone rule
- [x] logic-cable-estimation — Cat6 cable length calculator: courts x avg distance x 3 drops + doors x avg distance x 1 drop + cameras x avg distance, with example calculations
- [x] logic-replay-service-version — V1 vs V2 replay service: conditional deployment steps, V1 uses UDP (pixelation known issue), V2 uses TCP (coming April 2026), V2 deploys from GitHub + config via dashboard
- [x] logic-power-calculations — PoE port count per configuration, power consumption in watts, UPS runtime calculation (e.g., 43 min for 6-court), available rack unit space, switch size selection

### Wave 4: Full-Stack Product Design
- [x] design-routes — Complete route map with auth guards, layout hierarchy, navigation structure
- [x] design-dashboard — Home dashboard: project list, status pills, progress bars, top-line metrics, filters
- [x] design-wizard-intake — Stage 1 wizard: 6 steps, form fields, validation rules, conditional logic for tiers (including PBK)
- [x] design-wizard-procurement — Stage 2: BOM review, inventory check, PO creation, receiving, packing, CC terminal ordering, replay sign fulfillment
- [x] design-wizard-deployment — Stage 3: 15-phase smart checklist UI with auto-fill, warnings, troubleshooting tips, notes, non-linear navigation, ISP validation, cable estimation
- [x] design-wizard-financials — Stage 4: invoicing, expenses, P&L review, go-live/handoff
- [x] design-inventory-view — Global inventory: stock levels, categories, low stock flags, movement history, adjustments
- [x] design-financials-view — Global financials: funnel, monthly P&L, HER charts, per-project P&L, reconciliation, team OpEx config
- [x] design-settings — Settings page: pricing tiers (Pro/Autonomous/Autonomous+/PBK), rates, catalog management, travel defaults, team salary allocations, contacts directory
- [x] design-database-schema — Complete Supabase migration: all tables, enums, indexes, RLS policies, seed data
- [x] design-supabase-functions — Client-side service layer: all CRUD operations, queries, filters per table

### Wave 5: Ship & Polish
- [x] ship-deployment — Fly.io config, Dockerfile, nginx.conf, env vars, Supabase Cloud setup
- [x] ship-seed-data — Complete seed data: all ~50 hardware items, BOM templates, checklist templates, pricing defaults, VLAN reference, troubleshooting pairs, ISP speed chart, contacts
- [x] ship-testing — Test strategy: key test files, smoke tests, form validation tests, BOM generation tests, cost analysis tests

### Wave 6: Synthesis & Audit
- [x] audit-completeness — Verify every MRP sheet (all 24) has a webapp equivalent, every deployment appendix (A-F) is covered, no workflow gaps
- [x] audit-placeholder-sweep — Scan all spec files for TODO/TBD/FIXME/[fill in] — zero tolerance
- [x] audit-data-migration — Document how existing XLSX data maps to new database tables for initial import, including CC Form and Replay Signs data

### Wave 7: QA-Readiness — UI Constants, Mobile Specs, Error Copy
Forward loop QA lessons (TaxKlaro): specs that define structure but not micro-copy cause Playwright failures. This wave fills every gap a browser test would hit.

- [x] qa-enum-display-labels — Create `final-mega-spec/ui-spec/enum-labels.md`: map EVERY enum value to its display label. service_tier ('autonomous_plus' → 'Autonomous+'), project_status ('financial_close' → 'Financial Close'), revenue_stage, expense_category, isp_type, movement_type, invoice_status, payment_method. No enum left unmapped. [DONE: 94 values across 21 types mapped; TypeScript record objects, badge classNames, select labels, and sort orders all specified; consolidated export module src/lib/enum-labels.ts defined]
- [x] qa-validation-error-messages — Create `final-mega-spec/ui-spec/validation-messages.md`: for EVERY validation rule in wizard-intake.md, wizard-procurement.md, wizard-deployment.md, wizard-financials.md, inventory-view.md, settings-view.md — write the exact error message text. Include field-level errors, form-level errors, and toast messages for API failures. [DONE: 140+ error messages across 6 pages. Steps 1-6 intake (21 field + 9 cross-field + 9 Step-6 blocking checks + 7 ISP cross-validation inline banners), procurement (BOM inline/guard/toast, PO form, receiving guard, CC terminal, replay signs guard/form, advance guard), deployment (6 status transition forms with guards, checklist optimistic rollback, note auto-save inline, ISP phase 5 banners), financials (contract guard, deposit/final invoice forms + guards, mark-paid form, expense dialog, go-live, project-complete guard + confirmation), inventory (adjustment dialog, PO form, reorder threshold inline), settings (pricing cross-validation, all threshold fields, hardware catalog form, SKU uniqueness, OpEx, travel, contacts). Toast durations: success=3s, error=5s, warning=4s, position=bottom-right. Disabled-button tooltip implementation pattern with wrapping span documented.]
- [x] qa-mobile-responsive-spec — Create `final-mega-spec/ui-spec/responsive.md`: define exact Tailwind breakpoints (sm/md/lg/xl), then for EVERY page specify: column count per breakpoint, sidebar behavior (drawer on mobile), table behavior (scroll vs hide columns), form layout (single column below md), modal behavior (full-screen below sm), pagination (collapse page numbers below sm), touch targets (min 44px). [DONE: All breakpoints defined (sm=640, md=768, lg=1024, xl=1280). Every page covered: login, dashboard, project shell, all 4 wizard stages, inventory, global financials, all 4 settings tabs. Sidebar: drawer below md, icon-only 60px at md, expanded 240px at lg+. Tables: overflow-x-auto with min-w-* values for each table; sticky first column where appropriate. Forms: 1-col below md, 2-col at md+ for paired fields. Modals: fixed inset-0 rounded-none below sm, max-w-* centered above sm. Pagination: Prev/Next only below sm with "Page X of Y" text. Touch targets: min-h-[44px] on all interactive elements documented.]
- [x] qa-formatting-constants — Create `final-mega-spec/ui-spec/formatting.md`: currency formatting rules ($500 vs $500.00, threshold for decimals), date format (MM/DD/YYYY vs Jan 5, 2026), percentage format (85% vs 85.0%), name truncation rules (max chars before ellipsis), status badge color map (intake → blue, procurement → amber, deployment → purple, completed → green, cancelled → red). [DONE: formatters.ts export module specified with 13 functions + EMPTY_DISPLAY constant. Currency: compact (omit .00 for whole dollars) vs precise (always 2 dp) modes, usage map for all 14 field types. Date: formatDate=MMM D YYYY, formatDateShort=MM/DD/YY, formatMonth=MMM YYYY, formatRelativeDate for tooltips, ISO for DB, null→em dash. Percentage: formatPct=0dp, formatMarginPct=1dp, formatHer=1dp+x, formatFraction=numerator/denominator, formatBandwidth=Mbps. Truncation: max-w-[160–320px] per field, title tooltip pattern, search highlight <mark> pattern. Badge color map: project_status (intake=slate/procurement=amber/deployment=blue/financial_close=orange/completed=green/cancelled=red), deployment_status (7 values), service_tier (4 values). Boolean display rules for 5 field types. Null/zero rules: 0 counts shown as 0, HER null shown as — not 0.0x.]
- [x] qa-schema-field-audit — Read EVERY UI spec file and cross-reference field access patterns against schema.md column names. Fix mismatches. Known issue: routes.md uses `project.status` but schema column is `project_status`. Check ALL .from() queries, ALL field accesses, ALL filter params. Write corrections directly into the affected spec files. [DONE: 17 mismatches fixed in 4 files — routes.md (project.status→project.project_status ×4, status:'intake'→project_status:'intake', reorder_point→reorder_threshold), dashboard.md (sent_date→date_sent ×2), test-plan.md (status→project_status ×2, on_hand/allocated→qty_on_hand/qty_allocated ×8, reorder_point→reorder_threshold ×3, installment:'deposit'→invoice_type:'deposit', status:'draft'→status:'not_sent', inventory_items→inventory), inventory-management.md (project.status→project.deployment_status)]
- [x] qa-empty-states — For EVERY list/table/view, specify the empty state: icon, heading text, description text, CTA button text and link. Dashboard (no projects), inventory (no items), financials (no invoices), wizard steps (no BOM items yet), search results (no matches). [DONE: 19 empty states across 9 views — Dashboard (2 variants), Inventory (2 variants + movement history + recon clean), Procurement wizard (4 tabs), Deployment checklist (2 guards), Financials (6 tabs including monthly close banner), Settings (catalog + team). Summary table with icon, heading, CTA for each. Shared EmptyState component spec with icon/heading/description/cta props. All 14 Lucide icons enumerated.]
- [ ] qa-loading-states — For EVERY async operation, specify: skeleton shape (table skeleton, card skeleton, form skeleton), spinner placement, pending text. Include: page load, form submit, inline edit save, filter change, pagination.
- [ ] qa-toast-messages — For EVERY mutating operation (create/update/delete), specify: success toast text, error toast text, toast duration (3s default), toast position (bottom-right). Example: "Project created" (success), "Failed to create project" (error), "Invoice marked as paid" (success).
- [ ] qa-keyboard-nav — For wizard forms: specify Tab order, Enter key behavior (submit step vs submit form), Escape key behavior (close modal, cancel edit). For tables: specify if rows are focusable, Enter to open.
- [ ] qa-confirmation-dialogs — For EVERY destructive action: specify dialog title, body text, confirm button text, cancel button text. Examples: delete project, cancel PO, adjust stock downward, mark project cancelled.
- [ ] qa-convergence-recheck — Re-run the completeness audit from Wave 6 against ALL new Wave 7 files. Verify zero TODOs, zero TBDs, every enum mapped, every error message written, every breakpoint defined. Only then write converged.txt.
