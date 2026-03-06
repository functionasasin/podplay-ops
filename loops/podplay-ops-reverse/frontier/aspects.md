# Analysis Frontier — PodPlay Ops Wizard

## Statistics
- Total aspects discovered: 57
- Analyzed: 12
- Pending: 45
- Convergence: 21%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition & Domain Mapping
- [ ] source-mrp-sheets — Map all 24 MRP spreadsheet sheets: columns, formulas, data types, row counts, relationships [BLOCKED: docs/Kim Lapus PodPlay MRP.xlsx not present in repo]
- [x] source-deployment-guide — Extract all 15 deployment phases + 6 appendices with exact steps, settings values, warnings, prerequisites
- [x] source-hardware-guide — Extract all hardware specs, mounting options, cable requirements, camera angles, measurements, front desk equipment
- [x] source-mrp-usage-guide — Extract all workflows, formula logic, Apps Script functions, pricing tiers, vendor reference [PARTIAL: PDF not in repo; derived from config-guide-v1, hardware-bom, design doc, training transcripts]
- [ ] source-existing-data — Catalog all real customer data, inventory items, vendors, installers from the XLSX
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
- [ ] model-checklist-templates — Template structures for seeding deployment checklists per tier
- [ ] model-cc-terminals — CC Form sheet: BBPOS WisePOS E terminal ordering, cost tracking, delivery status, front desk equipment (QR scanner, webcam)
- [ ] model-replay-signs — Customer Replay Signs sheet: sign fulfillment lifecycle (Staged > Shipped > Delivered > Installed), qty calc (2x courts), outreach tracking, inventory decrement
- [ ] model-support-tiers — Three-tier support escalation model: Tier 1 (on-site), Tier 2 (config specialist), Tier 3 (engineer), per-tier examples, escalation paths
- [ ] model-device-migration — Apple Business Manager transfer workflow: release → factory reset → re-enroll → re-configure, MDM comparison (Mosyle vs Jamf)
- [ ] model-international-deployment — Asia deployment: Philippines ISP requirements (PLDT/Globe/Converge, business plan + static IP mandatory), PAL vs NTSC, 220V/60Hz power, vendor availability, open questions
- [ ] model-network-reference — VLAN architecture seed data (Default .30, REPLAY .32, SURVEILLANCE .31, ACCESS CONTROL .33), key IP addresses, port 4000 reference, bandwidth guidance
- [ ] model-team-opex — Team member salary allocations for HER/P&L: Niko 50/50 direct/indirect, Chad 20% indirect, rent $27.6K/yr, indirect salaries $147K/yr
- [ ] model-contacts-directory — Internal team contacts: Andy (PM), Nico (hardware/installs), Chad (ops), Stan (config), Agustin (app readiness), CS Team (booking)
- [ ] model-tier-variants — PBK tier (Pickleball Kingdom custom pricing), PingPod-specific hardware (audio, speakers, Bluetooth), front desk hardware category (webcam, barcode scanner)

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
- [ ] logic-sign-fulfillment — Replay sign workflow: calculate qty (2x courts), track outreach (Slack/email), shipping, install confirmation, inventory decrement
- [ ] logic-troubleshooting — Contextual troubleshooting tips linked to deployment phases: 14 known issue/solution pairs from Appendix A (Mac Mini crash, PoE issues, button pairing, DDNS, port 4000, .DS_Store, pixelation, Firebase re-sync)
- [ ] logic-isp-validation — Starlink incompatibility warning, internet speed recommendations by court count (1-30), circuit type guidance (fiber/cable/5G/dedicated), backup ISP requirements for autonomous 24/7 venues, dual ISP backbone rule
- [ ] logic-cable-estimation — Cat6 cable length calculator: courts x avg distance x 3 drops + doors x avg distance x 1 drop + cameras x avg distance, with example calculations
- [ ] logic-replay-service-version — V1 vs V2 replay service: conditional deployment steps, V1 uses UDP (pixelation known issue), V2 uses TCP (coming April 2026), V2 deploys from GitHub + config via dashboard
- [ ] logic-power-calculations — PoE port count per configuration, power consumption in watts, UPS runtime calculation (e.g., 43 min for 6-court), available rack unit space, switch size selection

### Wave 4: Full-Stack Product Design
- [ ] design-routes — Complete route map with auth guards, layout hierarchy, navigation structure
- [ ] design-dashboard — Home dashboard: project list, status pills, progress bars, top-line metrics, filters
- [ ] design-wizard-intake — Stage 1 wizard: 6 steps, form fields, validation rules, conditional logic for tiers (including PBK)
- [ ] design-wizard-procurement — Stage 2: BOM review, inventory check, PO creation, receiving, packing, CC terminal ordering, replay sign fulfillment
- [ ] design-wizard-deployment — Stage 3: 15-phase smart checklist UI with auto-fill, warnings, troubleshooting tips, notes, non-linear navigation, ISP validation, cable estimation
- [ ] design-wizard-financials — Stage 4: invoicing, expenses, P&L review, go-live/handoff
- [ ] design-inventory-view — Global inventory: stock levels, categories, low stock flags, movement history, adjustments
- [ ] design-financials-view — Global financials: funnel, monthly P&L, HER charts, per-project P&L, reconciliation, team OpEx config
- [ ] design-settings — Settings page: pricing tiers (Pro/Autonomous/Autonomous+/PBK), rates, catalog management, travel defaults, team salary allocations, contacts directory
- [ ] design-database-schema — Complete Supabase migration: all tables, enums, indexes, RLS policies, seed data
- [ ] design-supabase-functions — Client-side service layer: all CRUD operations, queries, filters per table

### Wave 5: Ship & Polish
- [ ] ship-deployment — Fly.io config, Dockerfile, nginx.conf, env vars, Supabase Cloud setup
- [ ] ship-seed-data — Complete seed data: all ~50 hardware items, BOM templates, checklist templates, pricing defaults, VLAN reference, troubleshooting pairs, ISP speed chart, contacts
- [ ] ship-testing — Test strategy: key test files, smoke tests, form validation tests, BOM generation tests, cost analysis tests

### Wave 6: Synthesis & Audit
- [ ] audit-completeness — Verify every MRP sheet (all 24) has a webapp equivalent, every deployment appendix (A-F) is covered, no workflow gaps
- [ ] audit-placeholder-sweep — Scan all spec files for TODO/TBD/FIXME/[fill in] — zero tolerance
- [ ] audit-data-migration — Document how existing XLSX data maps to new database tables for initial import, including CC Form and Replay Signs data
