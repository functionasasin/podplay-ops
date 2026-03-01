# Final Mega Spec — Philippine Freelance & Self-Employed Income Tax Optimizer

This directory contains the complete product specification. A forward loop can build the entire platform by reading ONLY this directory.

**Last updated:** 2026-03-01
**Convergence status:** IN PROGRESS (18/54 aspects analyzed; percentage-tax-computation completed)

---

## Index

### domain/ — What the tool computes

| File | Status | Description |
|------|--------|-------------|
| domain/legal-basis.md | → see updated entry below |
| [domain/computation-rules.md](domain/computation-rules.md) | PARTIAL | CR-001 to CR-034: both rate tables (2018-2022 + 2023+), 3 path formulas, OSD base clarification, 8% eligibility, quarterly cumulative method, CWT mechanics, installment rule, breakeven analysis, EOPT taxpayer tier classification (CR-015), surcharge computation (CR-016), interest computation (CR-017), total penalty computation (CR-018), e-marketplace DFSP withholding tax rule CR-019 (RR 16-2023), compromise penalty computation CR-020, Section 250 info-return penalties CR-021, prescriptive period eligibility check CR-022, 8% election window/re-election pseudocode CR-023, mid-year breach recomputation pseudocode CR-024, sales returns/net gross receipts definition CR-025, CR-026 OSD full expanded rules (10 sub-rules), CR-027 Itemized Deductions full computation rules, CR-028 Regime Comparison Engine (full pseudocode: RegimeComparisonInput/Output structs, check_eight_pct_eligibility, compute_path_a/b/c, compare_all_paths, breakeven tables RC-01/RC-02/RC-03 correcting CR-014 errors, tie-breaking rules, 4 worked examples, 9 invariants INV-RC-01 to INV-RC-09, inline breakeven formula), CR-029 Mixed Income Earner (MixedIncomeInput struct, Path A/B/C separate functions for mixed income with 3 worked examples MI-01/MI-02/MI-03, compare_mixed_income_regimes(), quarterly 1701Q function), CR-030 (compensation income components, taxable_compensation definition, de minimis benefits table 8 categories, FBT explanation, multiple-employer Form 2316 aggregation function with deficiency alert), CR-031 VAT vs OPT obligation determination (pseudocode with 4 branches + effect on regime comparison), CR-032 Percentage Tax annual/quarterly computation (accrual basis, with/without quarterly breakdown, Path A circular dependency resolution + worked example), CR-033 VAT-registered taxpayer regime comparison (Path C ineligibility, VAT-exclusive gross income, deductibility of input VAT note + worked example), **CR-034 (NEW) Form 2551Q Per-Quarter Filing Engine** (complete data structures: Form2551QInput/Schedule1Row/Output/AnnualPTFilingSchedule; generate_form_2551q() function with 12 steps covering rate determination, 8% PT waiver logic, Schedule 1 computation, credits, net payable, holiday-rule deadline, NIL flag, filing_required flag, and notes generation; generate_annual_pt_schedule() for all 4 quarters handling FORM_1701Q/FORM_2551Q/COR election paths; get_pt_rate_for_quarter() for prior-year amended returns; 4 worked examples: regular Q2, Q1 with 8% election, NIL return, full annual schedule) |
| [domain/decision-trees.md](domain/decision-trees.md) | PARTIAL | DT-01 (8% eligibility, full 8-branch tree), DT-02 (election procedure, 6 methods), DT-03 (mid-year breach, 6 required actions), DT-04 (annual form selection: 1701 vs 1701A), DT-05 (₱250K deduction applicability: pure SE vs mixed income), DT-06 (Form 2551Q obligation under each regime), DT-07 (FULLY EXPANDED: 6 gross-receipt range branches covering VAT-registered, >₱3M non-VAT, <₱250K, ₱250K–₱400K, narrow OSD-wins window ₱400K–₱437.5K, main ₱437.5K–₱3M range; all leaf nodes with legal refs), DT-09 (mixed income earner computation flow: 7-step tree with compensation aggregation, foreign employer branches, 8% eligibility for business portion, Path A/B/C parallel computation, recommendation, output), DT-10 (₱250K deduction decision — mixed income vs pure SE), DT-11 (VAT vs OPT obligation: 4-branch full tree — VAT-registered, gross >₱3M required, 8% elected, graduated with/without election window), DT-12 (VAT registration timing and transition: breach month, registration deadline, OPT/VAT period split, VAT effective date, income tax impact, going-forward VAT obligations), DT-13 (percentage tax filing obligation by quarter: full quarter VAT, full quarter 8%, full quarter OPT, split-quarter transition), DT-16 (VAT-registered OSD vs Itemized comparison, expense ratio branching); stubs for DT-14, DT-15 pending future aspects |
| [domain/lookup-tables/graduated-rate-table.md](domain/lookup-tables/graduated-rate-table.md) | COMPLETE | Both TRAIN schedules (2018-2022 and 2023+) fully tabulated with all 6 brackets each; boundary verification tables; Schedule 1 and Schedule 2 pseudocode functions; 7 Schedule 1 worked examples (one per bracket + boundaries); 9 Schedule 2 worked examples (one per bracket + boundaries + mixed income); effective tax rate table (25 income levels); quarterly cumulative method pseudocode + full 4-period example; mixed-income computation with non-taxable exclusion table; Schedule 1 vs 2 tax savings comparison (14 income levels); 7 edge cases (GRT-EC-01 to GRT-EC-07); 8 validation invariants (GRT-V01 to GRT-V08); legal basis summary |
| [domain/lookup-tables/eight-percent-option-rules.md](domain/lookup-tables/eight-percent-option-rules.md) | COMPLETE | 14-part reference: eligibility matrix (8 conditions, 18 ineligibility triggers), election procedures (6 methods for new + existing taxpayers with exact notation text), irrevocability rules (7), ₱250K deduction rules (with pure SE vs mixed income distinction, quarterly mechanics example), gross receipts + non-operating income definitions (tables), mid-year breach procedure (steps 1-7 + CR-024 pseudocode), VAT reversion rules (3-year rule), filing obligations table (all forms), quarterly computation formulas (pure SE + mixed income), 5 worked examples (8E-01 to 8E-05), PT interaction, sales returns/allowances, 10 validation invariants (8PCT-V01 to 8PCT-V10) |
| [domain/lookup-tables/osd-breakeven-table.md](domain/lookup-tables/osd-breakeven-table.md) | COMPLETE | 6 tables: (1) Path B (OSD) tax burden at 47 gross receipt levels (₱50K–₱20M) with OSD amount, NTI, income tax, % tax, total, effective rate; (2) OSD vs 8% crossover comparison at 20 GR levels with verified crossover at ₱437,500 (OSD ties 8%), narrow OSD-wins window ₱400,001–₱437,499 documented; (3) OSD vs itemized breakeven (definitionally 40% expense ratio at any GR level); (4) Mixed income OSD computation example (compensation + business); (5) Trader OSD (5 examples with gross income base); (6) OSD election decision matrix (8 conditions); rounding rules with worked example |
| [domain/lookup-tables/itemized-deductions.md](domain/lookup-tables/itemized-deductions.md) | COMPLETE | 11-part reference: master deduction categories table (34A-SAL through 34J, all limits, documentation requirements, engine notes); non-deductible items table (ND-01 through ND-20); interest expense arbitrage reduction formula with worked example; EAR cap computation tables (service + goods) with common income levels; NOLCO rules with tracking algorithm pseudocode + worked example; depreciation methods, useful life schedule (12 asset types), vehicle cost ceiling, worked depreciation example; home office deduction rules (eligibility, computation formula, required docs, engine behavior); itemized deduction input schema (complete ItemizedDeductions struct); total allowable deductions computation pseudocode; practical notes for internet/phone, subscriptions, home office setup, foreign income; cross-references |
| [domain/lookup-tables/percentage-tax-rates.md](domain/lookup-tables/percentage-tax-rates.md) | COMPLETE | 11-part reference: complete rate history table (5 periods from pre-2018 to 2024+, current rate 3% gross sales accrual basis); who pays OPT (3-condition test + exemption table); ₱3M triple coincidence (EOPT tier, VAT mandatory, 8% eligibility — boundary expressions for each); mandatory VAT registration triggers and deregistration rules; quarterly filing deadlines (Q1–Q4 with holiday rule); VAT basic rules reference for alert text; PT vs VAT mutual exclusivity matrix; PT deductibility under Path A (circular dependency resolution algorithm); ATC code PT010 and Form 2551Q field reference; engine flags table (IndirectTaxStatus struct); PT interaction with Path A/B/C total burden summary table; **Part 11 (NEW): Form 2551Q complete field-by-field mapping** (all 23 form items + Schedule 1 rows 1-7, payment details section, signatory section, NIL return field values, 8% election dispatch table covering 4 scenarios, irrevocability rule) |
| domain/lookup-tables/filing-deadlines.md | PENDING | All BIR deadlines by form and period |
| [domain/lookup-tables/taxpayer-classification-tiers.md](domain/lookup-tables/taxpayer-classification-tiers.md) | COMPLETE | 7 tables: tier thresholds, filing obligations by tier, penalty/interest rates by tier, classification rules and procedures, ₱3M triple coincidence boundary rules, EOPT filing simplifications, uniform deadline schedule |
| [domain/lookup-tables/bir-penalty-schedule.md](domain/lookup-tables/bir-penalty-schedule.md) | COMPLETE | Full BIR penalty reference: compromise penalty tables (by tax due and gross sales), surcharges, interest, Section 250 info-return penalties, criminal penalties (Secs. 254, 255, 264, 275, 258), underdeclaration escalation chain (30% threshold), prescriptive periods (3yr/10yr), tax amnesty status, penalty computation formula and worked examples |
| [domain/scenarios.md](domain/scenarios.md) | PARTIAL | 30+ scenario codes in 7 groups; to be expanded in scenario-enumeration aspect |
| [domain/edge-cases.md](domain/edge-cases.md) | PARTIAL | EC-T01 through EC-T09 (taxpayer tier edge cases); EC-EM01 through EC-EM07 (e-marketplace RR 16-2023 withholding edge cases); EC-P01 through EC-P07 (penalty/compliance); EC-8-01 through EC-8-11 (8% option edge cases); EC-OSD01 through EC-OSD09 (OSD edge cases); EC-ID01 through EC-ID10 (itemized deduction edge cases); EC-RC01 through EC-RC10 (regime comparison edge cases); EC-M01 through EC-M10 (mixed income: multiple employers, high-salary exec+freelance, business loss, mid-year resignation, mid-year job start, government employee+private practice, minimum wage+side business, foreign employer no PH withholding, large CWT overpayment refund, ₱3M threshold breach switching regimes mid-year); EC-VPT01 through EC-VPT10 (VAT vs percentage tax: exactly ₱3M triple boundary, voluntary VAT registration below ₱3M, Q3 VAT threshold crossing split-quarter, 8% breach with VAT trigger cascade, two businesses combined threshold, OPT deductibility apparent discrepancy, 2021 1% CREATE rate on amended return, OPT as only tax when IT = zero, non-operating income OPT exclusion, VAT-registered OSD vs itemized breakeven); **EC-PT01 through EC-PT06 (NEW) (percentage tax filing mechanics**: mid-year registrant PT start date, graduated declared Q1 — irrevocable cannot switch to 8%, government agency PT withholding credit Item 15, multiple business lines same PT010 ATC consolidated, post-VAT-deregistration first-year OPT/8% election, late Q1 2551Q penalties vs NIL penalty comparison) |
| [domain/manual-review-flags.md](domain/manual-review-flags.md) | PARTIAL | MRF-001 through MRF-019: platform DFSP qualification (MRF-001 to MRF-008); travel expense (MRF-009), home office (MRF-010), dual-use equipment (MRF-011), NOLCO tax-exempt year (MRF-012), capital vs operating loan (MRF-013), bad debt (MRF-014), R&D connection (MRF-015); foreign employer compensation (MRF-016), foreign tax credit (MRF-017), business loss NOLCO tracking (MRF-018); VAT transition quarter OPT/VAT period split (MRF-019) |
| [domain/legal-basis.md](domain/legal-basis.md) | UPDATED | Added RR 16-2023 (Section 2.11: e-marketplace withholding tax, ATC WI760/WC760, 0.5% effective rate, ₱500K threshold, DFSPs list, multi-channel rule, sworn declaration) and RMC 8-2024 (Section 4.8: implementation procedures, three withholding triggers, grace period) |

### engine/ — How the tool computes

| File | Status | Description |
|------|--------|-------------|
| engine/pipeline.md | PENDING | Step-by-step computation flow with typed inputs/outputs |
| engine/data-model.md | PENDING | Every struct, enum, type — complete definitions |
| engine/invariants.md | PENDING | What must always be true about outputs |
| engine/error-states.md | PENDING | Every invalid input and engine response |
| engine/test-vectors/basic.md | PENDING | Happy path test vectors |
| engine/test-vectors/edge-cases.md | PENDING | Edge case test vectors |
| engine/test-vectors/exhaustive.md | PENDING | One vector per scenario code |
| engine/test-vectors/fuzz-properties.md | PENDING | Invariants for randomized testing |

### api/ — How the tool is accessed

| File | Status | Description |
|------|--------|-------------|
| api/endpoints.md | PENDING | Every route, method, request/response shape |
| api/auth.md | PENDING | Auth model, roles, permissions, sessions |
| api/rate-limiting.md | PENDING | Rate limits per tier, error responses |
| api/webhooks.md | PENDING | Event notifications (if applicable) |

### frontend/ — What the user sees

| File | Status | Description |
|------|--------|-------------|
| frontend/user-journeys.md | PENDING | Every user type, every flow |
| frontend/wizard-steps.md | PENDING | Every input field, validation, error message |
| frontend/results-views.md | PENDING | Every output visualization, layout |
| frontend/validation-rules.md | PENDING | Client-side validation |
| frontend/copy.md | PENDING | All user-facing text |
| frontend/responsive-behavior.md | PENDING | Mobile/tablet/desktop behavior |

### database/ — How data is stored

| File | Status | Description |
|------|--------|-------------|
| database/schema.md | PENDING | Every table, column, type, constraint |
| database/migrations.md | PENDING | Migration order, seed data |
| database/indexes.md | PENDING | Query patterns and indexes |
| database/retention.md | PENDING | Data retention policy |

### premium/ — How the tool makes money

| File | Status | Description |
|------|--------|-------------|
| premium/tiers.md | PENDING | Free vs pro vs enterprise feature gating |
| premium/pricing.md | PENDING | Price points, billing, trial logic |
| premium/features-by-tier.md | PENDING | Feature matrix with gating rules |
| premium/professional-features.md | PENDING | B2B features: batch, API, PDF, white-label |

### deployment/ — How the tool runs in production

| File | Status | Description |
|------|--------|-------------|
| deployment/infrastructure.md | PENDING | What runs where |
| deployment/ci-cd.md | PENDING | Build/test/deploy pipeline |
| deployment/monitoring.md | PENDING | Alerts, health checks, error tracking |
| deployment/domains.md | PENDING | DNS, SSL, CDN |
| deployment/environment.md | PENDING | Environment variables, secrets |

### ui/ — How the tool looks

| File | Status | Description |
|------|--------|-------------|
| ui/design-system.md | PENDING | Colors (hex), typography, spacing, radii |
| ui/component-library.md | PENDING | Every UI component, props, variants |
| ui/responsive.md | PENDING | Breakpoints, mobile-first behavior |
| ui/accessibility.md | PENDING | WCAG, ARIA, keyboard nav |
| ui/branding.md | PENDING | Logo, favicon, OG images, brand voice |

### legal/ — What protects the business

| File | Status | Description |
|------|--------|-------------|
| legal/disclaimers.md | PENDING | Exact disclaimer text |
| legal/terms-of-service.md | PENDING | ToS key clauses |
| legal/privacy-policy.md | PENDING | Data collection, storage, rights |
| legal/limitations.md | PENDING | Explicit scope limits, liability |

### seo-and-growth/ — How users find the tool

| File | Status | Description |
|------|--------|-------------|
| [seo-and-growth/landing-page.md](seo-and-growth/landing-page.md) | INITIAL DRAFT | Pain points, value prop, CTAs, competitor positioning, social proof stats, market sizing by income tier, demographic profile, urgency drivers, social proof elements — from competitive + market research; to be fully expanded in Wave 5 |
| [seo-and-growth/seo-strategy.md](seo-and-growth/seo-strategy.md) | INITIAL DRAFT | 14 target keywords with current owners, 10 priority blog topics, schema markup, domain strategy, competitive SEO notes — from competitive research; to be expanded in Wave 5 |
| [seo-and-growth/content-strategy.md](seo-and-growth/content-strategy.md) | INITIAL DRAFT | 4 user personas, 20 blog post topics with keywords/word counts, 3 pillar pages, social media strategy (Facebook/TikTok/YouTube), 6-month content calendar, CPA partner program, seasonal campaign calendar, performance KPIs — from market-research aspect |
