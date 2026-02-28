# Frontier — Philippine Freelance & Self-Employed Income Tax Optimizer

## Statistics
- Total aspects discovered: 49
- Analyzed: 3
- Pending: 46
- Convergence: 6%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition
Fetch and cache all primary source material before any analysis begins.
- [x] legal-source-fetch — Fetch full text of NIRC Sec. 24(A), 34(L), 34(A)-(K), 74-79, 116 as amended by TRAIN/CREATE, save to input/sources/
- [x] rr-8-2018-fetch — Fetch RR No. 8-2018 (TRAIN implementing rules, 8% option election procedures), save to input/sources/
- [x] bir-forms-fetch — Fetch BIR Form 1701, 1701A, 1701Q, 2551Q, 2307 field descriptions, save to input/sources/
- [ ] worked-examples-fetch — Find 5-10 worked examples from CPA blogs and tax advisory sites showing all 3 regime computations
- [ ] competitive-analysis — Survey existing tools (Taxumo, JuanTax, TaxWhiz, BIR eBIRForms), document features and gaps
- [ ] market-research — Find market size data, freelancer population, CPA fee benchmarks, pain points from forums/Reddit/Facebook groups
- [ ] eopt-create-fetch — Fetch RA 11976 (EOPT Act) and RA 11534 (CREATE Law) provisions affecting self-employed filing

### Wave 2: Domain Rules Extraction
Extract every computation rule, decision tree, and lookup table from source material.
- [ ] graduated-rate-table — Extract TRAIN-era graduated rate table (Sec. 24A), all 6 brackets, with worked examples
- [ ] eight-percent-option — Extract 8% flat rate rules: eligibility (≤₱3M gross), election procedure (RR 8-2018), ₱250K exemption, interaction with percentage tax
- [ ] osd-computation — Extract OSD rules (Sec. 34L): 40% of gross sales/receipts, no substantiation needed, when OSD is vs. isn't beneficial
- [ ] itemized-deductions — Extract allowable business deductions for self-employed (Sec. 34), documentation requirements, disallowed expenses
- [ ] regime-comparison-logic — Define the decision tree: given (gross_receipts, business_expenses), compute tax under all 3 paths, select minimum
- [ ] mixed-income-rules — How compensation + business income interact: compensation always graduated, business portion can choose 8%/OSD/itemized
- [ ] vat-vs-percentage-tax — ₱3M threshold: below = 3% percentage tax (Form 2551Q), above = 12% VAT. Impact on 8% option eligibility
- [ ] percentage-tax-computation — 3% percentage tax rules (Sec. 116), CREATE 1% temporary rate status, quarterly filing
- [ ] creditable-withholding-tax — BIR 2307 mechanics: how CWT offsets tax due, excess CWT = refundable, quarterly crediting
- [ ] quarterly-filing-rules — Form 1701Q quarterly computation, cumulative method, crediting previous quarters
- [ ] annual-reconciliation — Annual ITR (1701/1701A) vs. quarterly payments, how to compute balance payable/refundable
- [ ] filing-calendar — All BIR deadlines: quarterly (April 15, Aug 15, Nov 15), annual (April 15), percentage tax, registration
- [ ] bir-form-1701-field-mapping — Every field on BIR Form 1701, what feeds it, computation source
- [ ] bir-form-1701a-field-mapping — Every field on BIR Form 1701A (simplified), what feeds it
- [ ] scenario-enumeration — Code every scenario: low-income freelancer, high-income professional, mixed-income employee+freelancer, VAT-registered, non-VAT, with/without expenses, etc.
- [ ] edge-cases — Catalog: first-year taxpayer mid-year, switching regimes, exceeding ₱3M mid-year, zero-expense freelancer, foreign-sourced income

### Wave 3: Engine Design
Design the computation engine from the extracted domain rules.
- [ ] pipeline-design — Design step-by-step computation flow with typed inputs/outputs per step
- [ ] data-model — Define every struct, enum, and type needed by the engine
- [ ] invariants — Define what must always be true about outputs
- [ ] error-states — Define every invalid input state and the engine's response
- [ ] test-vectors-basic — Write happy-path test vectors (one per common scenario)
- [ ] test-vectors-edge — Write edge-case test vectors
- [ ] test-vectors-exhaustive — Write one test vector per scenario code
- [ ] fuzz-properties — Define invariants for randomized testing

### Wave 4: Full-Stack Product Design
Design everything around the engine to make it a shippable product.
- [ ] user-journeys — Map every user type through every flow
- [ ] wizard-steps — Specify every input field, validation rule, conditional visibility, error message
- [ ] results-views — Specify every output visualization, layout variant
- [ ] frontend-validation — Client-side validation, pre-submission warnings
- [ ] frontend-copy — All user-facing text: labels, tooltips, errors, empty states, CTAs
- [ ] database-schema — Every table, column, type, constraint, index
- [ ] api-endpoints — Every route, method, request/response schema, error responses
- [ ] api-auth — Auth model, roles, permissions, session management
- [ ] premium-tiers — Free vs pro vs enterprise feature gating
- [ ] premium-pricing — Price points, billing cycles, trial logic
- [ ] professional-features — B2B features: batch, API access, PDF export, white-label

### Wave 5: Ship & Polish Design
Design everything needed to launch and operate the product.
- [ ] deployment-infra — Where each component runs, exact commands
- [ ] ci-cd — Build, test, deploy pipeline
- [ ] monitoring — Health checks, alerts, error tracking
- [ ] design-system — Colors (hex), typography (fonts/sizes/weights), spacing, components
- [ ] responsive-design — Breakpoints, mobile behavior, touch targets
- [ ] accessibility — WCAG compliance, ARIA labels, keyboard nav
- [ ] branding — Logo concepts, favicon, OG images, brand voice
- [ ] legal-disclaimers — Exact disclaimer text for tax computation tools
- [ ] terms-and-privacy — ToS structure, privacy policy sections
- [ ] seo-strategy — Target keywords, page titles, meta descriptions, schema markup
- [ ] landing-page — Hero copy, value prop, feature bullets, CTAs
- [ ] content-strategy — Blog topics, comparison pages, educational content

### Wave 6: Synthesis & Completeness Audit
Cross-cutting concerns and gap filling. Only start after Waves 2-5 are complete.
- [ ] data-model-reconciliation — Verify data model covers engine + frontend + API + database
- [ ] cross-reference-audit — Verify all file references and links are valid
- [ ] completeness-audit — Read every file in final-mega-spec/, check for gaps
- [ ] convergence-check — Run final convergence checklist, either add new aspects or converge

## Recently Analyzed
- legal-source-fetch (2026-02-28): Fetched NIRC Sec. 24A (both graduated rate schedules 2018-2022 and 2023+), Sec. 34 (all itemized deductions A-K + OSD 34L), Sec. 74-79 (quarterly filing, cumulative method), Sec. 116 (percentage tax, CREATE rate history). Also captured RR 8-2018 8% option rules. Wrote to input/sources/ (3 files) and final-mega-spec/domain/legal-basis.md.
- bir-forms-fetch (2026-02-28): Fetched exhaustive field-by-field descriptions for all 5 BIR forms. Form 1701 (4 pages, 6 schedules, ~80 items including all deduction line items), Form 1701A (2 pages, graduated OSD items 36-46 + 8% items 47-56, credits items 57-65), Form 1701Q (Schedules I/II/III/IV, items 36-68, both graduated cumulative and 8% cumulative methods), Form 2551Q (items 1-23, Schedule 1 with ATC table PT010-PT160), Form 2307 (Parts I-III, complete EWT ATC table with 50+ WI/WC codes and rates). Wrote to input/sources/bir-forms-field-descriptions.md.
