# Final Mega Spec — Philippine Freelance & Self-Employed Income Tax Optimizer

This directory contains the complete product specification. A forward loop can build the entire platform by reading ONLY this directory.

**Last updated:** 2026-03-01
**Convergence status:** IN PROGRESS (14/53 aspects analyzed; graduated-rate-table + eight-percent-option + osd-computation + itemized-deductions completed)

---

## Index

### domain/ — What the tool computes

| File | Status | Description |
|------|--------|-------------|
| domain/legal-basis.md | → see updated entry below |
| [domain/computation-rules.md](domain/computation-rules.md) | PARTIAL | CR-001 to CR-027: both rate tables (2018-2022 + 2023+), 3 path formulas, OSD base clarification, 8% eligibility, quarterly cumulative method, CWT mechanics, installment rule, breakeven analysis, EOPT taxpayer tier classification (CR-015), surcharge computation (CR-016), interest computation (CR-017), total penalty computation (CR-018), e-marketplace DFSP withholding tax rule CR-019 (RR 16-2023), compromise penalty computation CR-020, Section 250 info-return penalties CR-021, prescriptive period eligibility check CR-022, 8% election window/re-election pseudocode CR-023, mid-year breach recomputation pseudocode CR-024, sales returns/net gross receipts definition CR-025, CR-026 OSD full expanded rules (10 sub-rules), CR-027 Itemized Deductions full computation rules (Path A pseudocode, input validation, when itemized beats OSD, 3 worked examples with all 3 paths compared, non-deductible item enforcement, life insurance deductibility logic) |
| [domain/decision-trees.md](domain/decision-trees.md) | PARTIAL | DT-01 (8% eligibility, full 8-branch tree), DT-02 (election procedure, 6 methods), DT-03 (mid-year breach, 6 required actions), DT-04 (annual form selection: 1701 vs 1701A), DT-05 (₱250K deduction applicability: pure SE vs mixed income), DT-06 (Form 2551Q obligation under each regime), DT-07 (regime recommendation overview); stubs for DT-08 to DT-15 pending future aspects |
| [domain/lookup-tables/graduated-rate-table.md](domain/lookup-tables/graduated-rate-table.md) | COMPLETE | Both TRAIN schedules (2018-2022 and 2023+) fully tabulated with all 6 brackets each; boundary verification tables; Schedule 1 and Schedule 2 pseudocode functions; 7 Schedule 1 worked examples (one per bracket + boundaries); 9 Schedule 2 worked examples (one per bracket + boundaries + mixed income); effective tax rate table (25 income levels); quarterly cumulative method pseudocode + full 4-period example; mixed-income computation with non-taxable exclusion table; Schedule 1 vs 2 tax savings comparison (14 income levels); 7 edge cases (GRT-EC-01 to GRT-EC-07); 8 validation invariants (GRT-V01 to GRT-V08); legal basis summary |
| [domain/lookup-tables/eight-percent-option-rules.md](domain/lookup-tables/eight-percent-option-rules.md) | COMPLETE | 14-part reference: eligibility matrix (8 conditions, 18 ineligibility triggers), election procedures (6 methods for new + existing taxpayers with exact notation text), irrevocability rules (7), ₱250K deduction rules (with pure SE vs mixed income distinction, quarterly mechanics example), gross receipts + non-operating income definitions (tables), mid-year breach procedure (steps 1-7 + CR-024 pseudocode), VAT reversion rules (3-year rule), filing obligations table (all forms), quarterly computation formulas (pure SE + mixed income), 5 worked examples (8E-01 to 8E-05), PT interaction, sales returns/allowances, 10 validation invariants (8PCT-V01 to 8PCT-V10) |
| [domain/lookup-tables/osd-breakeven-table.md](domain/lookup-tables/osd-breakeven-table.md) | COMPLETE | 6 tables: (1) Path B (OSD) tax burden at 47 gross receipt levels (₱50K–₱20M) with OSD amount, NTI, income tax, % tax, total, effective rate; (2) OSD vs 8% crossover comparison at 20 GR levels with verified crossover at ₱437,500 (OSD ties 8%), narrow OSD-wins window ₱400,001–₱437,499 documented; (3) OSD vs itemized breakeven (definitionally 40% expense ratio at any GR level); (4) Mixed income OSD computation example (compensation + business); (5) Trader OSD (5 examples with gross income base); (6) OSD election decision matrix (8 conditions); rounding rules with worked example |
| [domain/lookup-tables/itemized-deductions.md](domain/lookup-tables/itemized-deductions.md) | COMPLETE | 11-part reference: master deduction categories table (34A-SAL through 34J, all limits, documentation requirements, engine notes); non-deductible items table (ND-01 through ND-20); interest expense arbitrage reduction formula with worked example; EAR cap computation tables (service + goods) with common income levels; NOLCO rules with tracking algorithm pseudocode + worked example; depreciation methods, useful life schedule (12 asset types), vehicle cost ceiling, worked depreciation example; home office deduction rules (eligibility, computation formula, required docs, engine behavior); itemized deduction input schema (complete ItemizedDeductions struct); total allowable deductions computation pseudocode; practical notes for internet/phone, subscriptions, home office setup, foreign income; cross-references |
| domain/lookup-tables/percentage-tax-rates.md | PENDING | Section 116 rates by period |
| domain/lookup-tables/filing-deadlines.md | PENDING | All BIR deadlines by form and period |
| [domain/lookup-tables/taxpayer-classification-tiers.md](domain/lookup-tables/taxpayer-classification-tiers.md) | COMPLETE | 7 tables: tier thresholds, filing obligations by tier, penalty/interest rates by tier, classification rules and procedures, ₱3M triple coincidence boundary rules, EOPT filing simplifications, uniform deadline schedule |
| [domain/lookup-tables/bir-penalty-schedule.md](domain/lookup-tables/bir-penalty-schedule.md) | COMPLETE | Full BIR penalty reference: compromise penalty tables (by tax due and gross sales), surcharges, interest, Section 250 info-return penalties, criminal penalties (Secs. 254, 255, 264, 275, 258), underdeclaration escalation chain (30% threshold), prescriptive periods (3yr/10yr), tax amnesty status, penalty computation formula and worked examples |
| [domain/scenarios.md](domain/scenarios.md) | PARTIAL | 30+ scenario codes in 7 groups; to be expanded in scenario-enumeration aspect |
| [domain/edge-cases.md](domain/edge-cases.md) | PARTIAL | EC-T01 through EC-T09 (taxpayer tier edge cases); EC-EM01 through EC-EM07 (e-marketplace RR 16-2023 withholding edge cases); EC-P01 through EC-P07 (penalty/compliance); EC-8-01 through EC-8-11 (8% option edge cases); EC-OSD01 through EC-OSD09 (OSD edge cases); EC-ID01 through EC-ID10 (itemized deduction edge cases: home office exclusive use, dual-use equipment proration, EAR cap computation, mid-year asset depreciation proration, NOLCO suspension across deduction method changes, interest arbitrage reduction including zero-deductible edge case, bad debt cash-basis exclusion, charitable NPO cap computation, NOLCO FIFO expiry with partial use, luxury vehicle depreciation ceiling); additional groups to be added in Wave 2 edge-cases aspect |
| [domain/manual-review-flags.md](domain/manual-review-flags.md) | PARTIAL | MRF-001 through MRF-015: platform DFSP qualification uncertainty, unexpected withholding, ordinary-and-necessary expense determination, first-year tier default, reclassification notice, VAT threshold proximity, mixed income substituted filing, OSD vs. itemized documentation (MRF-001 to MRF-008); travel expense mixed purpose (MRF-009), home office documentation (MRF-010), dual-use equipment percentage (MRF-011), NOLCO tax-exempt year exclusion (MRF-012), capital vs. operating loan interest (MRF-013), bad debt prior-year income confirmation (MRF-014), R&D connection to business (MRF-015) |
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
