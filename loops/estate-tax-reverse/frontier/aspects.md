# Analysis Frontier

## Statistics
- Total aspects discovered: 28
- Analyzed: 0
- Pending: 28
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [ ] legal-source-fetch — Fetch and cache all primary legal sources as markdown
- [ ] form-1801-field-mapping — Map every field/schedule in BIR Form 1801 to its data source

### Wave 2: Rule Extraction (one per NIRC section/provision)
- [ ] tax-rate-rule — Sec. 84: 6% flat rate, ₱200K exemption threshold
- [ ] gross-estate-citizens — Sec. 85(A): property included for citizens/residents (worldwide)
- [ ] gross-estate-nonresident — Sec. 85(B): property included for non-resident aliens (PH only)
- [ ] gross-estate-inclusions — Sec. 85(C-G): transfers in contemplation of death, revocable transfers, life insurance, general powers of appointment
- [ ] deduction-elit — Sec. 86(A)(1): expenses, losses, indebtedness, taxes
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
- [ ] nonresident-deductions — Sec. 86(B)-(D): proportional deductions, foreign tax credits for NRAs
- [ ] exemptions — Sec. 87: exempt transfers (usufruct merger, fiduciary, charitable ≤30% admin)
- [ ] filing-rules — Sec. 90: 1-year deadline, CPA requirement for >₱5M, extensions
- [ ] penalty-computation — Sec. 248-249: 25% or 50% surcharge, 12% p.a. interest
- [ ] tax-credits — Foreign estate tax paid, prior return payments
- [ ] valuation-rules — RR 12-2018: FMV = higher of (zonal value, assessed value); shares valuation

### Wave 3: Synthesis
- [ ] asset-classification — Decision tree for classifying assets into Form 1801 schedules (1, 1A, 2, 2A, 3, 4)
- [ ] computation-pipeline — End-to-end computation flow: inputs → gross estate → deductions → net estate → tax due
- [ ] data-model — Complete entity/type definitions with all fields and validations
- [ ] test-vectors — 6-8 complete test cases with all intermediate values
- [ ] edge-cases — Catalog of all edge cases discovered, with legal citations
- [ ] spec-draft — Synthesize all analysis into complete software specification
- [ ] spec-review — Self-review: can a developer with no context build the engine?

## Recently Analyzed
(empty)
