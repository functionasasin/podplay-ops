# Analysis Working Notes — Mixed Income Rules

**Aspect:** mixed-income-rules
**Date:** 2026-03-01
**Wave:** 2 (Domain Rules Extraction)

---

## Primary Sources Consulted

1. **RMC 50-2018** — Most critical source for the ₱250K deduction rule. Clarifies that when a taxpayer has BOTH compensation income AND business income, and elects 8% for business, the ₱250,000 deduction does NOT apply. The 8% tax base is the FULL gross business receipts (no deduction).

2. **RR 8-2018 Part II** — Confirms that mixed income earners always file Form 1701, not 1701A. Form 1701A is for purely self-employed individuals only.

3. **NIRC Sec. 24(A)(1)(b) and (2)** — Establishes that compensation is always taxed at graduated rates, and the individual may choose the business income treatment separately.

4. **NIRC Sec. 24(A)(2)(b)** — 8% option applies to "gross sales or receipts FROM BUSINESS or PRACTICE OF PROFESSION" — this phrase confirms that compensation income is excluded from the ₱3M threshold computation for the 8% option.

5. **EX-008 from worked-examples.md** — Concrete numerical example confirming the mixed income mechanics. Used as MI-01 example in CR-029.

6. **RR 11-2018** — De minimis benefits amounts under TRAIN. Used for CR-030 de minimis table.

---

## Key Findings and Decisions

### Finding 1: The ₱250K Deduction Rule is Absolute

RMC 50-2018 has NO minimum compensation amount threshold. ANY compensation income — even ₱0 taxable (e.g., minimum wage earner whose compensation is fully exempt) — triggers the no-₱250K-deduction rule for the 8% business option.

This creates an edge case (EC-M07) where a minimum wage earner's business income is taxed at 8% on the FULL gross amount (no ₱250K deduction), while the same person as a pure freelancer would get the ₱250K deduction. This is confirmed by the literal reading of RMC 50-2018 and has not been reversed by any subsequent issuance.

**Decision:** Engine strictly applies RMC 50-2018 — ANY compensation income, regardless of amount, eliminates the ₱250K deduction for 8% business computation. No exceptions.

### Finding 2: Graduated Paths Combine NTI Before Applying Rates

Under Paths A and B for mixed income earners, the compensation NTI and business NTI are COMBINED before applying the graduated rate table. This is the standard Philippine income tax computation — a taxpayer's total taxable income from all sources is aggregated and taxed under the same graduated schedule.

The implication: If a taxpayer's compensation income already pushes them into a higher bracket, their business income (under graduated methods) faces even higher marginal rates. This makes the 8% option more attractive for mixed income earners with substantial compensation income.

**Decision:** CR-029 Path A and B functions combine NTI via `combined_nti = taxable_compensation + business_nti`. This is the correct legal treatment.

### Finding 3: Path C — Two Separate Computations

Under Path C for mixed income earners, the structure is different from Paths A and B:
- Compensation IT = graduated_tax(taxable_compensation) — independent computation
- Business IT = gross_receipts × 0.08 — flat rate, no interaction with compensation brackets
- Total IT = Compensation IT + Business IT

This is NOT a "combined NTI" approach. The 8% is a flat rate on business income regardless of what bracket the compensation income creates. This is one of the key advantages of 8% for mixed income earners — it insulates business income from the "bracket creep" effect of high compensation.

**Decision:** CR-029 Path C function computes these separately. The `combined_nti` field in the PathResult is set to `null` for Path C to make this architectural difference explicit.

### Finding 4: Business Gross for ₱3M Threshold — Compensation Excluded

The ₱3M eligibility threshold for the 8% option is defined in NIRC Sec. 24(A)(2)(b) as applying to "gross sales or receipts from business or practice of profession." Compensation income is categorically different from business income and is NOT included in the threshold.

This was confirmed in the worked example context where a high-salary executive (₱5M+ compensation) can still elect 8% on a small freelance income stream (₱800K business gross). The threshold only considers the business gross.

**Decision:** Engine uses `gross_for_threshold = gross_receipts + non_operating_income` (business only). Compensation is NOT added. This is explicit in the MixedIncomeInput struct.

### Finding 5: Form 1701 — Always, No Exception

RR 8-2018 and BIR Form 1701 instructions are clear: mixed income earners file Form 1701. Form 1701A is exclusively for purely self-employed individuals choosing either the 8% option or the OSD method (and no compensation income whatsoever). Even if a mixed income earner elects 8% for business, they still file 1701 because they need the compensation income schedules.

**Decision:** For all mixed income paths, form_to_use = "1701". Engine never recommends 1701A for mixed income earners.

### Finding 6: Quarterly 1701Q for Business Income Only

On Form 1701Q for a mixed income earner, only the business income is reported. The compensation income does not appear on the quarterly return — the employer handles it separately. At annual filing (1701), everything is reconciled.

The quarterly business tax computation for mixed income does NOT include compensation income. This is a departure from the annual filing where combined NTI is used (for Paths A/B). The quarterly returns are an interim estimate based on business income alone; the true combined tax is computed at annual.

**Decision:** CR-029 quarterly function (`compute_quarterly_1701q_mixed`) explicitly excludes compensation from the quarterly computation and adds a note explaining this to the user.

### Finding 7: Multiple Form 2316s Create an Aggregation Problem

Each Philippine employer independently computes withholding tax without knowing about other employers. When a taxpayer has multiple employers (e.g., resigned mid-year, or has multiple part-time jobs), the sum of their individual TWs may be less than the total graduated tax on the combined compensation.

This is a COMMON source of surprise tax deficiencies at annual filing. The engine must detect multiple employers and alert the user.

**Decision:** CR-030 aggregate_form_2316s() function computes the deficiency. The engine displays a prominent warning when number_of_form_2316s > 1 and tw_deficiency > 0.

### Finding 8: Business Loss Cannot Offset Compensation Income

Under Philippine income tax law for individuals, a net operating loss from a business cannot be used to reduce compensation income in the same tax year. The loss is only deductible against future BUSINESS income (not future compensation income) as NOLCO over 3 years.

This is confirmed by NIRC Sec. 34(D)(3) — NOLCO is applicable to the same type of income (business), not against other income streams.

**Decision:** business_nti is floored at 0 (EC-M03). Negative values are not allowed in the computation. MRF-018 tracks the NOLCO amount for informational display.

---

## New Edge Cases Discovered During Analysis

1. **EC-M07 (Minimum wage + side business)** — Critical edge case where Path B (OSD) beats Path C (8%) for a minimum wage earner with small business income. Demonstrates that the "8% always wins for service businesses below ₱3M" rule does NOT hold universally for mixed income earners.

2. **EC-M05 (Pure SE becomes mixed income mid-year)** — The 8% retroactive adjustment needed at annual filing because quarterly payments used ₱250K deduction (pure SE) but annual is now mixed income (no ₱250K deduction). A significant reconciliation scenario.

3. **EC-M04 (Employee becomes pure SE mid-year)** — Need to determine which quarters require 1701Q filing and when the 8% election window opens.

---

## New Aspects Identified During Analysis (None Added to Frontier)

No new aspects are needed beyond what was already in the frontier. The following upcoming aspects will interact with this work:
- **quarterly-filing-rules** — Must document mixed income quarterly 1701Q mechanics in detail
- **bir-form-1701-field-mapping** — Must show how Form 1701 Part III (compensation) and Part IV/V (business) interact
- **creditable-withholding-tax** — Must distinguish between TW (Form 2316) and CWT (Form 2307) in the credit formula
- **annual-reconciliation** — Must document the mixed income annual balance/refund computation

---

## Corrections to Prior Work

**No corrections needed.** Prior aspects correctly anticipated mixed income (CR-028 has `has_compensation_income` flag and routes to CR-029; DT-05 correctly states no ₱250K for mixed income 8%; DT-04 correctly routes mixed income to Form 1701). This analysis formalized and expanded on those placeholders.

**One precision improvement:** CR-028 had a comment "NOTE: For mixed income, income_tax here is the TOTAL IT on combined NTI. // The employer has withheld tax on the compensation portion. See CR-029 for reconciliation." — CR-029 now provides that reconciliation.

---

## Breakeven Analysis for Mixed Income — Key Insight

For mixed income earners, the standard "8% vs itemized" breakeven expense ratios from CR-014 do NOT apply. The breakeven ratio is HIGHER for mixed income earners because compensation income pushes the combined NTI into higher brackets.

Example at ₱1.5M business gross (from CR-028 pure SE: itemized wins at ~62.5% expenses):
- For a mixed income earner with ₱600K taxable comp: Path B combined NTI = 600K + 900K = 1.5M → IT = 402,500 on 2M bracket? No, 1.5M → IT = 102,500 + 25% × 700K = 277,500; PT = 45K; total = 322,500. Path C = grad(600K) + 1.5M × 0.08 = 62,500 + 120,000 = 182,500; total = 182,500. For itemized to beat 8%, need: grad(600K + (1.5M - expenses)) + 45K < 182,500; grad(600K + 1.5M - E) < 137,500; 600K + 1.5M - E in about the ₱1.4M-₱1.5M range; grad(1.4M) = 102,500 + 25% × 600K = 252,500 > 137,500 (not enough). grad(600K + 1.5M - E) = 137,500 → need 600K + NTI_biz = X such that grad(X) = 137,500. grad(X) = 102,500 + 25%(X-800K) = 137,500 → X = 940,000 → NTI_biz = 340,000 → expenses = 1,160,000 → expense ratio = 77.3%. So for a mixed income earner with ₱600K comp and ₱1.5M business gross, itemized beats 8% only when expenses > 77.3% (vs 62.5% for pure SE). This confirms: mixed income earners benefit even MORE from the 8% option than pure SE earners.

The engine computes this numerically for each user — no hardcoded breakeven table needed. The comparison is done computationally.
