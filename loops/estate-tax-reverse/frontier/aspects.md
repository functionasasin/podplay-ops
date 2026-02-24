# Analysis Frontier

## Statistics
- Total aspects discovered: 35
- Analyzed: 30
- Pending: 5
- Convergence: 86%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [x] legal-source-fetch — Fetch and cache all primary legal sources (NIRC, pre-TRAIN rates, amnesty provisions, Form 1801, commentaries) as markdown
- [x] form-1801-field-mapping — Map every field/schedule in BIR Form 1801 to its data source

### Wave 2: TRAIN-Era Rule Extraction (deaths on/after Jan 1, 2018)
- [x] tax-rate-train — Sec. 84 (as amended by TRAIN): flat 6% on net taxable estate
- [x] gross-estate-citizens — Sec. 85(A): property included for citizens/residents (worldwide)
- [x] gross-estate-nonresident — Sec. 85(B): property included for non-resident aliens (PH situs only)
- [x] gross-estate-inclusions — Sec. 85(C-G): transfers in contemplation of death, revocable transfers, life insurance, general powers of appointment
- [x] deduction-elit — Sec. 86(A)(1): expenses, losses, indebtedness, taxes (ELIT)
- [x] deduction-vanishing — Sec. 86(A)(2): property previously taxed (full formula + percentage table: 100/80/60/40/20)
- [x] deduction-public-transfers — Sec. 86(A)(3): bequests to government for exclusively public use
- [x] deduction-standard — Sec. 86(A)(4): ₱5M citizens/residents, ₱500K non-resident aliens
- [x] deduction-family-home — Sec. 86(A)(5): up to ₱10M, barangay certification, residents only
- [x] deduction-medical — Sec. 86(A)(7): up to ₱500K, within 1 year before death
- [x] deduction-ra4917 — Sec. 86(A)(7): employer death benefits under RA 4917
- [x] surviving-spouse-share — Sec. 86(A)(9): net share in conjugal/community property
- [x] property-regime-acp — Family Code: Absolute Community of Property (default post-Aug 3, 1988)
- [x] property-regime-cpg — Civil Code: Conjugal Partnership of Gains (default pre-Family Code)
- [x] property-regime-separation — Complete Separation of Property (by prenuptial agreement)
- [x] nonresident-deductions — Sec. 86(B)-(D): proportional deductions for non-resident aliens
- [x] exemptions — Sec. 87: exempt transfers (usufruct merger, fiduciary, charitable ≤30% admin)
- [x] tax-credits — Foreign estate tax paid, prior return payments
- [x] filing-rules — Sec. 90: 1-year deadline, CPA requirement for >₱5M, extensions

### Wave 3: Pre-TRAIN Rule Extraction (deaths before Jan 1, 2018)
- [x] tax-rate-pre-train — Original NIRC Sec. 84: graduated rate schedule (5%-20%) with brackets
- [x] deductions-pre-train-diffs — Deduction amounts/rules that differ from TRAIN-era (old standard deduction, old family home cap, etc.)
- [x] pre-train-computation-flow — End-to-end computation differences from TRAIN-era (graduated rate application, different thresholds)

### Wave 4: Estate Tax Amnesty (RA 11213/11569)
- [x] amnesty-eligibility — Who qualifies: estates of decedents who died before Jan 1, 2018, with unpaid/unsettled estate tax
- [x] amnesty-computation — Amnesty tax: 6% of net estate. Deductions = full set at time of death (pre-TRAIN rules for pre-2018 deaths, TRAIN rules for 2018–2022 deaths). Two tracks: Track A (full net taxable, no prior return) vs Track B (undeclared portion only). Minimum ₱5,000. Narrow interpretation (standard + spouse only) available as toggle with disclaimer. ETAR form, not Form 1801.
- [x] amnesty-vs-regular — Decision logic: when to use amnesty path vs. regular pre-TRAIN computation

### Wave 2 (continued): Corrections
- [x] correction-nra-public-transfers — Correct deduction-public-transfers.md: NRA public transfers are PROPORTIONAL per Sec. 86(B)(2), not full-value. Sec. 86(B)(2) explicitly includes paragraph (3) (transfers for public use) in the proportional formula alongside paragraph (1) (ELIT).
- [x] correction-amnesty-deductions — Correct deductions-pre-train-diffs.md: The `getOrdinaryDeductionItems` function incorrectly excludes funeral and judicial/admin expenses from the amnesty path for pre-2018 deaths. RA 11213 Sec. 3 defines net estate using "allowable deductions under the NIRC at time of death," which includes funeral and judicial expenses for pre-2018 deaths. The function should return `common + ["funeralExpenses", "judicialAdminExpenses"]` when `(regime == "pre_TRAIN") OR (regime == "amnesty" AND deductionRules == "PRE_TRAIN")`. Also update the `getSpecialDeductionAmounts` function to correctly handle amnesty + pre-2018 deaths separately from amnesty + TRAIN deaths.

### Wave 5: Synthesis
- [x] regime-detection — Decision tree for auto-selecting regime from date of death and estate status
- [ ] computation-pipeline — End-to-end computation flow for all three regimes: inputs → gross estate → deductions → net estate → tax due
- [ ] data-model — Complete entity/type definitions with all fields and validations (supporting all regimes)
- [ ] test-vectors — 8-10 complete test cases across all three regimes with intermediate values
- [ ] explainer-format — Template for plain-English explainer section targeting heirs/executors
- [ ] edge-cases — Catalog of all edge cases discovered, with legal citations
- [ ] spec-draft — Synthesize all analysis into complete software specification
- [ ] spec-review — Self-review: can a developer with no context build the engine?

## Recently Analyzed
- [x] amnesty-computation — 2026-02-24 — RA 11213 Sec. 5: flat 6% on amnesty tax base. Track A (no prior return) = 6% × full net taxable estate; Track B (prior return filed) = 6% × net undeclared estate = max(0, net taxable − previously declared). Minimum ₱5,000 always applies. Primary deduction interpretation: full set at time of death (RA 11213 Sec. 3 plain text) — pre-2018 deaths use pre-TRAIN rules (funeral ✓, judicial ✓, standard ₱1M, family home ₱1M); 2018–2022 deaths use TRAIN rules (standard ₱5M, family home ₱10M, no funeral/judicial). Narrow interpretation (standard + spouse only) available as engine toggle with disclaimer. Deduction conflict documented: deductions-pre-train-diffs.md incorrectly excludes funeral/judicial from amnesty pre-2018 path; new correction-amnesty-deductions aspect added. TRAIN-era amnesty produces identical base tax to regular TRAIN — engine displays equivalence notice. No foreign tax credit under amnesty. Filing form = ETAR (not Form 1801), window closed June 14, 2025. NRA: proportional Sec. 86(B) formula applies. 3 worked examples, 10 edge cases, 12 test implications.
- [x] deductions-pre-train-diffs — 2026-02-24 — Two pre-TRAIN-only deductions: (1) Funeral expenses: min(actual, 5% × gross estate) — REMOVED by TRAIN; (2) Judicial/admin expenses: actual, no cap — REMOVED by TRAIN. Two deductions with different amounts: standard deduction ₱1M vs. ₱5M (TRAIN); family home cap ₱1M vs. ₱10M (TRAIN). All other deductions (medical ₱500K, ELIT items, vanishing, public transfers, RA4917, spouse share) are IDENTICAL across regimes. Engine branching: regime == "pre_TRAIN" enables funeralExpenses + judicialAdminExpenses inputs and applies lower standard/family home amounts. Funeral 5% limit uses gross estate TOTAL (Item 34) — must finalize gross estate before computing funeral deduction limit. NRA: proportional formula (Sec. 86B) applies to pre-TRAIN-only items. Amnesty: does NOT include funeral/judicial expenses — amnesty restricts deductions further. 12 edge cases, 12 test implications. Commentary Sample 5 confirmed: ₱8M CPG estate (2015) → tax ₱91,000.
- [x] exemptions — 2026-02-24 — Sec. 87: four exempt transfers — (a) personal usufruct merger (excluded from gross estate; Sec. 87(a) does NOT apply to naked owner or fixed-term usufruct); (b)/(c) fiduciary/fideicommissary transmission (excluded from pass-through estate); (d) charitable bequests to qualifying PRIVATE institutions (excluded from gross estate — critical: this is NOT the same as Sec. 86(A)(3) government transfers which are deducted via Schedule 5F). Sec. 87 not amended by TRAIN — applies identically across TRAIN, pre-TRAIN, and amnesty regimes. No Form 1801 schedule for Sec. 87 exemptions: they are pre-computation exclusions. Engine runs Sec. 87 filter before populating gross estate schedules. 87(d) conditions: no income inures to individual + admin ≤ 30%. Partial bequest (fraction of asset) supported. Foreign charities excluded. Fixed-term usufruct IS includable at Sec. 88(A) actuarial value. 10 edge cases, 10 test implications.
- [x] deduction-family-home — 2026-02-23 — Sec. 86(A)(5): TRAIN cap ₱10M; pre-TRAIN/amnesty cap ₱1M. Exclusive: min(FMV, cap). Conjugal/communal: min(FMV×0.5, cap) — decedent's share only; spouse's ½ handled at Item 39. Requires: barangay certification, actual residence at death, citizen/resident only, one property max. Gross estate (Item 30/Sched 1A) shows full FMV; deduction (Item 37B) shows capped/halved amount. Legal ambiguity flagged: sample computations show full FMV for conjugal but NIRC text says ½ — engine implements ½ (recommend verify against BIR RR 12-2018). Correction to form-1801-fields.md Validation Rule 8 documented. 12 test implications. Amnesty path: available with ₱1M cap.
- [x] deduction-vanishing — 2026-02-23 — Sec. 86(A)(2): 5-step formula (IV=min(prior,current FMV); NV=IV−mortgage; ratio=(GE−ELIT)/GE; pct from 5-year table; VD=pct×NV×ratio). Percentage table: 100%/80%/60%/40%/20% for each 1-year band; 0% after 5 years. Eligibility: within 5 years, prior tax paid, property identifiable, still in gross estate. Formula identical across TRAIN and pre-TRAIN regimes (different ELIT composition). VD NOT available under amnesty path. 12 edge cases (depreciation, appreciation, prior tax unpaid, property sold, mortgage > IV, ELIT > GE, multiple properties, conjugal VD, NRA situs). 12 test implications. Form 1801: Schedule 5E, Columns A+B, feeds Item 35.
- [x] legal-source-fetch — 2026-02-23 — 5 legal source files cached in input/legal-sources/
- [x] form-1801-field-mapping — 2026-02-23 — Complete field mapping: Part I (17 informational fields), Part III (scope boundary), Part IV (Items 29–44/20, all three columns), Part V (Schedules 1, 1A, 2, 2A, 3, 4, 5, 6, 6A). Engine output contract defined with canonical field list, column A/B split rules, 10 validation constraints, 8 test implications, and 6 edge cases identified.
- [x] tax-rate-train — 2026-02-23 — Flat 6% (0.06) on net taxable estate (Item 40). No threshold, no brackets. Final step: estate_tax_due = net_taxable_estate × 0.06; net_estate_tax_due = max(0, estate_tax_due − foreign_tax_credit). Maps to Form 1801 Items 41–44/20. 7 edge cases documented (zero estate, NRA, credit exceeds tax, fractional, amended return, installment). 10 test vectors specified.
- [x] gross-estate-citizens — 2026-02-23 — Worldwide scope for citizens and resident aliens. Five gross estate categories: real property (Item 29/Schedule 1), family home (Item 30/Schedule 1A), personal property (Item 31/Schedules 2+2A), taxable transfers (Item 32/Schedule 3), business interest (Item 33/Schedule 4). Item 34 = sum of all. A/B/C column structure throughout. FMV rule for real property: max(zonal, assessed). Business interest floored at 0. 10 edge cases, 10 test cases. Key: engine takes pre-valued FMV inputs only; user tags exclusive vs. conjugal ownership.
- [x] gross-estate-nonresident — 2026-02-23 — PH-situs only scope for non-resident aliens. Same five Form 1801 items (29–34) but only PH-situated assets. Intangible personal property excluded if reciprocity exemption applies (user-declared). Item 30 = 0 (family home deduction not available to NRAs). Key additional input: decedent.totalWorldwideGrossEstateForDeductionPurposes (for Sec. 86B proportional deduction formula). Situs rules by property type documented. Reciprocity rule pseudocode defined. 10 edge cases, 8 test cases.
- [x] gross-estate-inclusions — 2026-02-23 — Sec. 85(B)–(G): six special inclusion rules for taxable transfers. All map to Item 32/Schedule 3. Rules: (B) contemplation of death (3-year presumption, full FMV at death); (C) revocable transfers (retained power or power relinquished ≤3 years, bona fide sale exception); (D) GPA exercised by will (always) or by deed within 3 years; (E) life insurance on own life — estate or revocably-designated beneficiary included, irrevocably-designated excluded; (F) retroactivity clause only (no computation); (G) insufficient consideration — excess of fmvAtDeath over consideration received. Regime-invariant: same rules for TRAIN, pre-TRAIN, and amnesty. NRA scope: PH-situs only. 12 edge cases, 10 test cases.
- [x] deduction-elit — 2026-02-23 — Sec. 86(A)(1): five ELIT sub-items (5A claims against estate, 5B claims vs. insolvent, 5C unpaid mortgages + taxes, 5D casualty losses). TRAIN removes funeral and judicial/admin expenses. Key rules: claims must be notarized and pre-existing; insolvent claims must first appear in gross estate; conjugal mortgage enters full balance in Column B (split handled by Schedule 6A); casualty losses are net of insurance recovery. Item 35 = sum of all ordinary deductions. Item 36 = max(0, Item 34 − Item 35). 12 edge cases, 10 test cases.
- [x] property-regime-cpg — 2026-02-24 — Civil Code Arts. 142–185: CPG is the default regime for marriages contracted before August 3, 1988. Two critical differences from ACP: (1) pre-marital property is ALWAYS Column A (exclusive) — no prior-marriage-children exception needed; (2) fruits/income of exclusive (capital/paraphernal) property are CONJUGAL (Column B) — opposite of ACP. Art. 148 exclusive list: pre-marital, lucrative-title during marriage, exchange of exclusive, purchased with exclusive funds. Art. 153 conjugal list: work/industry during marriage, conjugal fund acquisitions, ALL fruits during marriage (even from exclusive property). Art. 160 presumption: acquired during marriage = conjugal unless proved exclusive. Engine contract: user tags per asset; full FMV in Column B (never halved); spouse's 50% via Item 39. Verified against Sample 5 (₱8M CPG + pre-TRAIN → tax ₱91,000). 12 edge cases, 12 test implications. Key UI note: fruits-of-exclusive = conjugal rule must be prominently displayed.
