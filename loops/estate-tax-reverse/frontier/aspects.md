# Analysis Frontier

## Statistics
- Total aspects discovered: 33
- Analyzed: 4
- Pending: 29
- Convergence: 12%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [x] legal-source-fetch — Fetch and cache all primary legal sources (NIRC, pre-TRAIN rates, amnesty provisions, Form 1801, commentaries) as markdown
- [x] form-1801-field-mapping — Map every field/schedule in BIR Form 1801 to its data source

### Wave 2: TRAIN-Era Rule Extraction (deaths on/after Jan 1, 2018)
- [x] tax-rate-train — Sec. 84 (as amended by TRAIN): flat 6% on net taxable estate
- [x] gross-estate-citizens — Sec. 85(A): property included for citizens/residents (worldwide)
- [ ] gross-estate-nonresident — Sec. 85(B): property included for non-resident aliens (PH situs only)
- [ ] gross-estate-inclusions — Sec. 85(C-G): transfers in contemplation of death, revocable transfers, life insurance, general powers of appointment
- [ ] deduction-elit — Sec. 86(A)(1): expenses, losses, indebtedness, taxes (ELIT)
- [ ] deduction-vanishing — Sec. 86(A)(2): property previously taxed (full formula + percentage table: 100/80/60/40/20)
- [ ] deduction-public-transfers — Sec. 86(A)(3): bequests to government for exclusively public use
- [ ] deduction-standard — Sec. 86(A)(4): ₱5M citizens/residents, ₱500K non-resident aliens
- [ ] deduction-family-home — Sec. 86(A)(5): up to ₱10M, barangay certification, residents only
- [ ] deduction-medical — Sec. 86(A)(7): up to ₱500K, within 1 year before death
- [ ] deduction-ra4917 — Sec. 86(A)(8): employer death benefits under RA 4917
- [ ] surviving-spouse-share — Sec. 86(A)(9): net share in conjugal/community property
- [ ] property-regime-acp — Family Code: Absolute Community of Property (default post-Aug 3, 1988)
- [ ] property-regime-cpg — Civil Code: Conjugal Partnership of Gains (default pre-Family Code)
- [ ] property-regime-separation — Complete Separation of Property (by prenuptial agreement)
- [ ] nonresident-deductions — Sec. 86(B)-(D): proportional deductions for non-resident aliens
- [ ] exemptions — Sec. 87: exempt transfers (usufruct merger, fiduciary, charitable ≤30% admin)
- [ ] tax-credits — Foreign estate tax paid, prior return payments
- [ ] filing-rules — Sec. 90: 1-year deadline, CPA requirement for >₱5M, extensions

### Wave 3: Pre-TRAIN Rule Extraction (deaths before Jan 1, 2018)
- [ ] tax-rate-pre-train — Original NIRC Sec. 84: graduated rate schedule (5%-20%) with brackets
- [ ] deductions-pre-train-diffs — Deduction amounts/rules that differ from TRAIN-era (old standard deduction, old family home cap, etc.)
- [ ] pre-train-computation-flow — End-to-end computation differences from TRAIN-era (graduated rate application, different thresholds)

### Wave 4: Estate Tax Amnesty (RA 11213/11569)
- [ ] amnesty-eligibility — Who qualifies: estates of decedents who died before Jan 1, 2018, with unpaid/unsettled estate tax
- [ ] amnesty-computation — Amnesty tax: 6% of net estate, limited deductions (standard deduction + surviving spouse share only)
- [ ] amnesty-vs-regular — Decision logic: when to use amnesty path vs. regular pre-TRAIN computation

### Wave 5: Synthesis
- [ ] regime-detection — Decision tree for auto-selecting regime from date of death and estate status
- [ ] computation-pipeline — End-to-end computation flow for all three regimes: inputs → gross estate → deductions → net estate → tax due
- [ ] data-model — Complete entity/type definitions with all fields and validations (supporting all regimes)
- [ ] test-vectors — 8-10 complete test cases across all three regimes with intermediate values
- [ ] explainer-format — Template for plain-English explainer section targeting heirs/executors
- [ ] edge-cases — Catalog of all edge cases discovered, with legal citations
- [ ] spec-draft — Synthesize all analysis into complete software specification
- [ ] spec-review — Self-review: can a developer with no context build the engine?

## Recently Analyzed
- [x] legal-source-fetch — 2026-02-23 — 5 legal source files cached in input/legal-sources/
- [x] form-1801-field-mapping — 2026-02-23 — Complete field mapping: Part I (17 informational fields), Part III (scope boundary), Part IV (Items 29–44/20, all three columns), Part V (Schedules 1, 1A, 2, 2A, 3, 4, 5, 6, 6A). Engine output contract defined with canonical field list, column A/B split rules, 10 validation constraints, 8 test implications, and 6 edge cases identified.
- [x] tax-rate-train — 2026-02-23 — Flat 6% (0.06) on net taxable estate (Item 40). No threshold, no brackets. Final step: estate_tax_due = net_taxable_estate × 0.06; net_estate_tax_due = max(0, estate_tax_due − foreign_tax_credit). Maps to Form 1801 Items 41–44/20. 7 edge cases documented (zero estate, NRA, credit exceeds tax, fractional, amended return, installment). 10 test vectors specified.
- [x] gross-estate-citizens — 2026-02-23 — Worldwide scope for citizens and resident aliens. Five gross estate categories: real property (Item 29/Schedule 1), family home (Item 30/Schedule 1A), personal property (Item 31/Schedules 2+2A), taxable transfers (Item 32/Schedule 3), business interest (Item 33/Schedule 4). Item 34 = sum of all. A/B/C column structure throughout. FMV rule for real property: max(zonal, assessed). Business interest floored at 0. 10 edge cases, 10 test cases. Key: engine takes pre-valued FMV inputs only; user tags exclusive vs. conjugal ownership.
