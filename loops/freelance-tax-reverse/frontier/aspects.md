# Frontier — Philippine Freelance & Self-Employed Income Tax Optimizer

## Statistics
- Total aspects discovered: 53
- Analyzed: 14
- Pending: 39
- Convergence: 26%

## Pending Aspects (ordered by dependency)

### Wave 1: Source Acquisition
Fetch and cache all primary source material before any analysis begins.
- [x] legal-source-fetch — Fetch full text of NIRC Sec. 24(A), 34(L), 34(A)-(K), 74-79, 116 as amended by TRAIN/CREATE, save to input/sources/
- [x] rr-8-2018-fetch — Fetch RR No. 8-2018 (TRAIN implementing rules, 8% option election procedures), save to input/sources/
- [x] bir-forms-fetch — Fetch BIR Form 1701, 1701A, 1701Q, 2551Q, 2307 field descriptions, save to input/sources/
- [x] worked-examples-fetch — Find 5-10 worked examples from CPA blogs and tax advisory sites showing all 3 regime computations
- [x] competitive-analysis — Survey existing tools (Taxumo, JuanTax, TaxWhiz, BIR eBIRForms), document features and gaps
- [x] market-research — Find market size data, freelancer population, CPA fee benchmarks, pain points from forums/Reddit/Facebook groups
- [x] eopt-create-fetch — Fetch RA 11976 (EOPT Act) and RA 11534 (CREATE Law) provisions affecting self-employed filing
- [x] eopt-taxpayer-tiers — EOPT Act tiered taxpayer classification (Micro/Small/Medium/Large), how it affects self-employed filing procedures and deadlines
- [x] bir-rr-16-2023-emarketplace — BIR RR 16-2023: 1% withholding on e-marketplace remittances (Upwork/Fiverr via Payoneer/PayPal); how this affects CWT credit computation for freelancers
- [x] bir-penalty-schedule — Complete BIR penalty structure: interest rate (12% per annum under EOPT), surcharge rates (25%/50%), compromise penalties, late filing fees; how to compute total penalties on past-due taxes

### Wave 2: Domain Rules Extraction
Extract every computation rule, decision tree, and lookup table from source material.
- [x] graduated-rate-table — Extract TRAIN-era graduated rate table (Sec. 24A), all 6 brackets, with worked examples
- [x] eight-percent-option — Extract 8% flat rate rules: eligibility (≤₱3M gross), election procedure (RR 8-2018), ₱250K exemption, interaction with percentage tax
- [x] osd-computation — Extract OSD rules (Sec. 34L): 40% of gross sales/receipts, no substantiation needed, when OSD is vs. isn't beneficial
- [x] itemized-deductions — Extract allowable business deductions for self-employed (Sec. 34), documentation requirements, disallowed expenses
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
- itemized-deductions (2026-03-01): Extracted all allowable itemized deduction categories under NIRC Sec. 34(A)-(K), non-deductible items under Sec. 36, documentation requirements, EAR cap computation, NOLCO rules, depreciation schedule, home office deduction, interest arbitrage reduction formula. Wrote CR-027 to computation-rules.md (Path A full pseudocode, input validation, when itemized beats OSD, 3 worked examples with full path comparisons, non-deductible item enforcement, life insurance deductibility logic). Created lookup-tables/itemized-deductions.md (11 parts: 31-row deduction category table, 20-row non-deductible items table, interest arbitrage formula + example, EAR cap tables at 8 income levels, NOLCO tracking algorithm + worked example, depreciation useful life schedule 12 asset types + vehicle ceiling, home office rules + engine inputs, complete ItemizedDeductions struct, total allowable deductions pseudocode, practical notes for freelancers, cross-references). Added EC-ID01 through EC-ID10 to edge-cases.md (home office exclusive use, dual-use equipment, EAR cap, mid-year depreciation proration, NOLCO suspension cross-method, interest arbitrage zero case, bad debt cash-basis exclusion, charitable NPO cap, NOLCO FIFO partial expiry, luxury vehicle ceiling). Added MRF-009 through MRF-015 to manual-review-flags.md (travel expense purpose, home office documentation, equipment percentage unknown, NOLCO tax-exempt year, capital vs. operating loan, bad debt prior income, R&D connection to business).
- bir-penalty-schedule (2026-03-01): Extracted complete BIR penalty structure. Key findings: (1) Three-component penalty stack = basic tax + surcharge + interest + compromise; (2) EOPT reduced MICRO/SMALL surcharge 25%→10%, interest 12%→6%, info-return failures ₱1K→₱500 per failure; (3) Compromise penalty table (RMO 7-2015 Annex A) has 9 brackets by tax due amount (₱1K–₱50K); (4) Nil return compromise: 1st offense ₱1K, 2nd ₱5K, 3rd ₱10K, 4th+ criminal; (5) Invoicing violations (Sec. 237/238): 50% EOPT reduction for MICRO/SMALL; (6) Fraud (50% surcharge, cannot be compromised, 10-year assessment period); (7) Prescriptive periods: 3-year ordinary (filed on time or late), 10-year extraordinary (fraud/no filing — from BIR discovery date); (8) SC G.R. 247737 clarifies intent required for 10-year period; (9) General Tax Amnesty (SB 60/HB 2653) PROPOSED but NOT enacted. Wrote to: final-mega-spec/domain/lookup-tables/bir-penalty-schedule.md (NEW, 9 parts, compromise tables, criminal penalties, prescriptive periods, tax amnesty), final-mega-spec/domain/computation-rules.md (CR-020 compromise penalty computation with full table lookup pseudocode + nil return offense counter + invoicing violations + multi-return worked example; CR-021 Section 250 info return penalties; CR-022 prescriptive period eligibility check), final-mega-spec/domain/edge-cases.md (EC-P01 through EC-P07: offense counter logic, abatement claim, prescribed years, 30% underdeclaration fraud trigger, multi-year catch-up nil returns, fraud bars compromise, Oplan Kandado), analysis/bir-penalty-schedule.md.
- legal-source-fetch (2026-02-28): Fetched NIRC Sec. 24A (both graduated rate schedules 2018-2022 and 2023+), Sec. 34 (all itemized deductions A-K + OSD 34L), Sec. 74-79 (quarterly filing, cumulative method), Sec. 116 (percentage tax, CREATE rate history). Also captured RR 8-2018 8% option rules. Wrote to input/sources/ (3 files) and final-mega-spec/domain/legal-basis.md.
- bir-forms-fetch (2026-02-28): Fetched exhaustive field-by-field descriptions for all 5 BIR forms. Form 1701 (4 pages, 6 schedules, ~80 items including all deduction line items), Form 1701A (2 pages, graduated OSD items 36-46 + 8% items 47-56, credits items 57-65), Form 1701Q (Schedules I/II/III/IV, items 36-68, both graduated cumulative and 8% cumulative methods), Form 2551Q (items 1-23, Schedule 1 with ATC table PT010-PT160), Form 2307 (Parts I-III, complete EWT ATC table with 50+ WI/WC codes and rates). Wrote to input/sources/bir-forms-field-descriptions.md.
- worked-examples-fetch (2026-02-28): Fetched and synthesized 9 worked examples from respicio.ph, businesstips.ph, tripleiconsulting.com, and taxumo.com. Examples cover: EX-001 (500K low-expense freelancer), EX-002 (1M consultant no expenses), EX-003 (800K designer moderate expenses), EX-004 (1.5M agency high expenses — itemized wins), EX-005 (2.5M lawyer near threshold), EX-006 (4M VAT-registered — 8% not available), EX-007 (quarterly cumulative method with CWT offsets across Q1-Q3 + annual), EX-008 (mixed income employee+freelancer), EX-009 (multiple 2307 CWT scenario). Also computed breakeven tables: 8% vs OSD (8% ALWAYS wins below 3M), 8% vs Itemized (itemized wins at ≥60-83% expense ratio depending on gross). Wrote to: input/sources/worked-examples.md, final-mega-spec/domain/computation-rules.md (CR-001 through CR-014 including both rate tables, all path formulas, quarterly cumulative method, CWT mechanics), final-mega-spec/domain/scenarios.md (scenario code taxonomy, 30+ codes across 7 groups).
- competitive-analysis (2026-02-28): Surveyed Taxumo (market leader, ₱2,499–₱4,248/quarter, 100K+ users, no regime comparison, no native app), JuanTax (₱120/form Fast File or ₱2,000/month Plus, first BIR eTSP, has native app, no regime comparison), TaxWhiz (ACG mobile app, pricing opaque, advisory-dependent, no regime comparison), BIR eBIRForms (free, Windows-only, no computation, manual entry). Also surveyed 10 free web calculators — none offer all-3-regime comparison except codingace.net (obscure, no filing). CRITICAL FINDING: zero tools on the market compute all three regimes simultaneously and recommend the lowest. This is the primary market gap and core differentiator. Also documented: market size (1.5M+ registered freelancers, 27.2% of PH employment is self-employed), CPA fee benchmarks (₱3K–₱10K/year ITR), top SEO queries and their current owners, 10 freelancer pain points from community research. Wrote to: input/sources/competitive-analysis.md (comprehensive source doc), final-mega-spec/seo-and-growth/landing-page.md (pain points, value prop, CTAs, social proof), final-mega-spec/seo-and-growth/seo-strategy.md (keyword targets, content strategy, schema markup).
