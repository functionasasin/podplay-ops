# Engine Invariants — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-01
**Cross-references:**
- Data model: [engine/data-model.md](data-model.md)
- Pipeline steps: [engine/pipeline.md](pipeline.md)
- Computation rules: [domain/computation-rules.md](../domain/computation-rules.md)
- Error states: [engine/error-states.md](error-states.md)
- Test vectors: [engine/test-vectors/](test-vectors/)

---

## Purpose

This file enumerates every property that **must always be true** about the engine's outputs, regardless of input values. These invariants serve as:

1. **Test oracle** — every test vector's outputs must satisfy all applicable invariants
2. **Implementation contract** — any code path that violates an invariant has a bug
3. **Fuzz target** — property-based tests randomly generate inputs and verify these invariants hold
4. **Audit trail** — each invariant cites the legal or architectural source that requires it

An invariant is a boolean predicate over a `TaxComputationResult` (and its component structs) that evaluates to `true` for every valid computation. A violation is always a software defect, never an expected outcome.

---

## Table of Contents

1. [Input-Level Invariants (INV-IN-*)](#1-input-level-invariants)
2. [Gross Aggregates Invariants (INV-GA-*)](#2-gross-aggregates-invariants)
3. [Eligibility Invariants (INV-EL-*)](#3-eligibility-invariants)
4. [Path A (Itemized) Invariants (INV-PA-*)](#4-path-a-itemized-invariants)
5. [Path B (OSD) Invariants (INV-PB-*)](#5-path-b-osd-invariants)
6. [Path C (8% Flat) Invariants (INV-PC-*)](#6-path-c-8-flat-invariants)
7. [Percentage Tax Invariants (INV-PT-*)](#7-percentage-tax-invariants)
8. [CWT Credits Invariants (INV-CWT-*)](#8-cwt-credits-invariants)
9. [Regime Comparison Invariants (INV-RC-*)](#9-regime-comparison-invariants)
10. [Balance Computation Invariants (INV-BAL-*)](#10-balance-computation-invariants)
11. [Penalty Invariants (INV-PEN-*)](#11-penalty-invariants)
12. [Form Field Invariants (INV-FF-*)](#12-form-field-invariants)
13. [Rounding Invariants (INV-RND-*)](#13-rounding-invariants)
14. [Determinism Invariants (INV-DET-*)](#14-determinism-invariants)
15. [Cross-Path Consistency Invariants (INV-XP-*)](#15-cross-path-consistency-invariants)
16. [Monotonicity Invariants (INV-MON-*)](#16-monotonicity-invariants)

---

## 1. Input-Level Invariants

These invariants apply to `TaxpayerInput` and are enforced by PL-01 (validation). A computation that reaches PL-02 with any of these violated has a bug in PL-01.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-IN-01 | Gross receipts is non-negative | `input.gross_receipts >= 0` | VAL-002 |
| INV-IN-02 | Sales returns do not exceed gross | `input.sales_returns_allowances <= input.gross_receipts` | VAL-003 |
| INV-IN-03 | Sales returns is non-negative | `input.sales_returns_allowances >= 0` | VAL-003 implied |
| INV-IN-04 | COGS is non-negative | `input.cost_of_goods_sold >= 0` | VAL-004 |
| INV-IN-05 | Taxable compensation is non-negative | `input.taxable_compensation >= 0` | VAL-005 |
| INV-IN-06 | Prior-year excess CWT is non-negative | `input.prior_year_excess_cwt >= 0` | VAL-006 |
| INV-IN-07 | Non-operating income is non-negative | `input.non_operating_income >= 0` | VAL-014 |
| INV-IN-08 | FWT income is non-negative | `input.fwt_income >= 0` | VAL-015 |
| INV-IN-09 | COMPENSATION_ONLY taxpayer has zero gross receipts | `input.taxpayer_type == COMPENSATION_ONLY → input.gross_receipts == 0` | VAL-007 |
| INV-IN-10 | PURELY_SE taxpayer has zero compensation | `input.taxpayer_type == PURELY_SE → input.taxable_compensation == 0` | VAL-008 |
| INV-IN-11 | is_mixed_income flag is consistent with taxpayer_type | `input.is_mixed_income == (input.taxpayer_type == MIXED_INCOME)` | VAL-009 |
| INV-IN-12 | Each 2307 entry income_payment is non-negative | `∀ e ∈ input.cwt_2307_entries: e.income_payment >= 0` | VAL-010 |
| INV-IN-13 | Each 2307 entry tax_withheld is non-negative | `∀ e ∈ input.cwt_2307_entries: e.tax_withheld >= 0` | VAL-011 |
| INV-IN-14 | Each 2307 entry withheld ≤ payment | `∀ e ∈ input.cwt_2307_entries: e.tax_withheld <= e.income_payment` | VAL-012 |
| INV-IN-15 | Each quarterly payment amount is non-negative | `∀ p ∈ input.prior_quarterly_payments: p.amount_paid >= 0` | VAL-013 |
| INV-IN-16 | tax_year is within valid range | `2018 <= input.tax_year <= 2030` | VAL-001 |
| INV-IN-17 | Prior payment for amended return is non-negative | `input.prior_payment_for_return >= 0` | VAL-018 |
| INV-IN-18 | Compensation CWT is non-negative | `input.compensation_cwt >= 0` | VAL-020 |
| INV-IN-19 | Quarterly payments list has at most 3 entries (for annual filing) | `input.filing_period == ANNUAL → len(input.prior_quarterly_payments) <= 3` | VAL-017 |
| INV-IN-20 | Each itemized expense sub-component is non-negative | `∀ field f ∈ input.itemized_expenses: f >= 0` | VAL-019 |
| INV-IN-21 | COGS is zero for SERVICE_PROVIDER class | `(input.cost_of_goods_sold == 0) ↔ (taxpayer_class == SERVICE_PROVIDER)` | PL-03 logic |
| INV-IN-22 | Q4 is never a quarterly filing period | `input.filing_period ≠ Q4` (Q4 is not a valid FilingPeriod variant) | Sec. 74-77; enum constraint |

---

## 2. Gross Aggregates Invariants

These invariants apply to the `GrossAggregates` struct produced by PL-03.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-GA-01 | Net gross receipts equals gross minus returns | `ga.net_gross_receipts == input.gross_receipts - input.sales_returns_allowances` | PL-03; CR-025 |
| INV-GA-02 | Net gross receipts is non-negative | `ga.net_gross_receipts >= 0` | Derived from INV-IN-02 |
| INV-GA-03 | Gross income is non-negative | `ga.gross_income >= 0` | PL-03; max(0, …) |
| INV-GA-04 | Gross income ≤ net gross receipts for service providers | `taxpayer_class == SERVICE_PROVIDER → ga.gross_income == ga.net_gross_receipts` | PL-03: COGS = 0 for service providers |
| INV-GA-05 | Gross income = net gross − COGS for traders | `taxpayer_class == TRADER → ga.gross_income == ga.net_gross_receipts - input.cost_of_goods_sold` | PL-03 |
| INV-GA-06 | Threshold base equals net gross plus non-operating income | `ga.threshold_base == ga.net_gross_receipts + input.non_operating_income` | PL-03; CR-025 |
| INV-GA-07 | Threshold base is non-negative | `ga.threshold_base >= 0` | Derived from INV-GA-02 and INV-IN-07 |
| INV-GA-08 | 8% base equals threshold base | `ga.eight_pct_base == ga.threshold_base` | PL-03; CR-006 |
| INV-GA-09 | Graduated income base equals threshold base | `ga.graduated_income_base == ga.threshold_base` | PL-03: same computation |
| INV-GA-10 | PT quarterly base equals net gross receipts | `ga.pt_quarterly_base == ga.net_gross_receipts` | PL-03; CR-032 |
| INV-GA-11 | FWT income is excluded from all IT computation bases | `ga.threshold_base does NOT include input.fwt_income` | PL-03; FWT already taxed; Sec. 57(A) |
| INV-GA-12 | taxpayer_class is TRADER if and only if COGS > 0 | `(ga.taxpayer_class == TRADER) ↔ (input.cost_of_goods_sold > 0)` | PL-03 |

---

## 3. Eligibility Invariants

These invariants apply to the `EligibilityResult` struct produced by PL-04.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-EL-01 | VAT-registered taxpayer is never eligible for Path C | `input.is_vat_registered → NOT er.path_c_eligible` | RR 8-2018 Sec. 2(A); IN-01 |
| INV-EL-02 | Gross exceeding ₱3M removes Path C eligibility | `ga.threshold_base > 3_000_000 → NOT er.path_c_eligible` | NIRC Sec. 24(A)(2)(b); IN-02 |
| INV-EL-03 | BMBE registration removes Path C eligibility | `input.is_bmbe_registered → NOT er.path_c_eligible` | IN-03 |
| INV-EL-04 | GPP partner is ineligible for Path C | `input.is_gpp_partner → NOT er.path_c_eligible` | RMC 50-2018; IN-04 |
| INV-EL-05 | Sec. 117-128 taxpayers are ineligible for Path C | `input.subject_to_sec_117_128 → NOT er.path_c_eligible` | RR 8-2018; IN-05 |
| INV-EL-06 | COMPENSATION_ONLY taxpayer is ineligible for all paths | `input.taxpayer_type == COMPENSATION_ONLY → (NOT er.path_a_eligible AND NOT er.path_b_eligible AND NOT er.path_c_eligible)` | PL-04: paths require SE income |
| INV-EL-07 | Path C eligibility implies threshold ≤ ₱3M | `er.path_c_eligible → ga.threshold_base <= 3_000_000` | Contrapositive of INV-EL-02 |
| INV-EL-08 | Path C eligibility implies not VAT-registered | `er.path_c_eligible → NOT input.is_vat_registered` | Contrapositive of INV-EL-01 |
| INV-EL-09 | Path A and B are always co-eligible or co-ineligible | `er.path_a_eligible == er.path_b_eligible` | PL-04: same eligibility rule |
| INV-EL-10 | Non-COMPENSATION_ONLY taxpayers have Paths A and B available | `input.taxpayer_type ≠ COMPENSATION_ONLY → (er.path_a_eligible AND er.path_b_eligible)` | PL-04 |
| INV-EL-11 | At least one path is available for SE taxpayers | `input.taxpayer_type ≠ COMPENSATION_ONLY → (er.path_a_eligible OR er.path_b_eligible OR er.path_c_eligible)` | Always true: Paths A/B always available for SE |
| INV-EL-12 | Path C ineligibility has at least one documented reason | `NOT er.path_c_eligible → len(er.path_c_ineligible_reasons) >= 1` | PL-04 |
| INV-EL-13 | Path C eligible taxpayer has zero ineligibility reasons | `er.path_c_eligible → len(er.path_c_ineligible_reasons) == 0` | PL-04 |
| INV-EL-14 | optimizer_mode is true when no explicit election | `(input.elected_regime == null) ↔ er.optimizer_mode` | PL-04 |

---

## 4. Path A (Itemized) Invariants

These invariants apply to the `ItemizedDeductionResult` and `PathAResult` structs produced by PL-05 and PL-08.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-PA-01 | All individual deduction line items are non-negative | `∀ field d ∈ idr.deduction_breakdown: d >= 0` | PL-05; max(0, …) applied to each |
| INV-PA-02 | Total deductions is the sum of all line items | `idr.total_deductions == sum(idr.deduction_breakdown.*)` | PL-05 |
| INV-PA-03 | Total deductions is non-negative | `idr.total_deductions >= 0` | Derived from INV-PA-01 |
| INV-PA-04 | Total deductions do not exceed gross income | `idr.total_deductions <= ga.graduated_income_base` | Economic reality; NTI floor ensures this via max(0, …) |
| INV-PA-05 | Business NTI before PT is non-negative | `idr.biz_nti_before_pt >= 0` | PL-05: `max(0, …)` |
| INV-PA-06 | Business NTI after PT is non-negative | `par.biz_nti >= 0` | PL-08: `max(0, …)` |
| INV-PA-07 | Path A income tax is non-negative | `par.income_tax_due >= 0` | Graduated rate always >= 0 |
| INV-PA-08 | Total NTI for PURELY_SE equals business NTI | `input.taxpayer_type == PURELY_SE → par.total_nti == par.biz_nti` | PL-08: no comp income |
| INV-PA-09 | Total NTI for MIXED_INCOME equals comp + business NTI | `input.taxpayer_type == MIXED_INCOME → par.total_nti == input.taxable_compensation + par.biz_nti` | PL-08; CR-029 |
| INV-PA-10 | Deduction method is always ITEMIZED for Path A | `par.deduction_method == ITEMIZED` | PL-08 |
| INV-PA-11 | EAR deduction ≤ EAR cap | `idr.deduction_breakdown.entertainment_representation <= idr.deduction_breakdown.ear_cap_applied` | PL-05; CR-027.6 |
| INV-PA-12 | EAR cap is 1% of net revenue for service providers | `taxpayer_class == SERVICE_PROVIDER → idr.deduction_breakdown.ear_cap_applied == ga.graduated_income_base * 0.01` | PL-05; CR-027.6 |
| INV-PA-13 | EAR cap is 0.5% of net sales for traders | `taxpayer_class == TRADER → idr.deduction_breakdown.ear_cap_applied == ga.net_gross_receipts * 0.005` | PL-05; CR-027.6 |
| INV-PA-14 | Home office deduction is zero when exclusive-use flag is false | `NOT input.itemized_expenses.home_office_exclusive_use → idr.deduction_breakdown.home_office == 0` | PL-05; CR-027.8 |
| INV-PA-15 | Bad debt deduction is zero for cash-basis taxpayers | `NOT input.itemized_expenses.is_accrual_basis → idr.deduction_breakdown.bad_debts == 0` | PL-05; CR-027.10 |
| INV-PA-16 | Non-accredited charitable deduction is zero | `NOT input.itemized_expenses.charitable_accredited → idr.deduction_breakdown.charitable == 0` | PL-05; Sec. 34(H) |
| INV-PA-17 | PT deduction is applied only for PURELY_SE non-VAT taxpayers | `(input.taxpayer_type == PURELY_SE AND NOT input.is_vat_registered) → par.pt_deduction_applied == ptr.pt_due` | PL-08; CR-032 one-pass |
| INV-PA-18 | PT deduction is zero for MIXED_INCOME and VAT-registered | `(input.taxpayer_type == MIXED_INCOME OR input.is_vat_registered) → par.pt_deduction_applied == 0` | PL-08; OSD covers PT implicitly; VAT → no PT |
| INV-PA-19 | Interest deduction ≤ gross interest expense | `idr.deduction_breakdown.interest <= input.itemized_expenses.interest_expense` | PL-05; 33% arbitrage reduction can only reduce |
| INV-PA-20 | NOLCO deduction is zero for MIXED_INCOME business loss | Separate rule: `idr.deduction_breakdown.nolco >= 0`; NOLCO cannot create negative NTI — `par.biz_nti >= 0` | PL-05; CR-027.11; FIFO |
| INV-PA-21 | Path A result is not produced when Path A is ineligible | `NOT er.path_a_eligible → par == null OR par.eligible == false` | PL-08 |

---

## 5. Path B (OSD) Invariants

These invariants apply to the `OsdResult` and `PathBResult` structs produced by PL-06 and PL-09.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-PB-01 | OSD deduction is exactly 40% of OSD base | `osr.osd_deduction == osr.osd_base * 0.40` | PL-06; Sec. 34(L) |
| INV-PB-02 | Path B NTI is exactly 60% of OSD base | `osr.biz_nti_path_b == osr.osd_base * 0.60` | PL-06; algebraic simplification of base − 40% |
| INV-PB-03 | OSD base is non-negative | `osr.osd_base >= 0` | PL-06 |
| INV-PB-04 | OSD deduction is non-negative | `osr.osd_deduction >= 0` | Derived from INV-PB-01 and INV-PB-03 |
| INV-PB-05 | Path B business NTI is non-negative | `pbr.biz_nti >= 0` | PL-09: `max(0, …)` |
| INV-PB-06 | Path B income tax is non-negative | `pbr.income_tax_due >= 0` | Graduated rate always >= 0 |
| INV-PB-07 | Total NTI for PURELY_SE equals business NTI | `input.taxpayer_type == PURELY_SE → pbr.total_nti == pbr.biz_nti` | PL-09 |
| INV-PB-08 | Total NTI for MIXED_INCOME equals comp + business NTI | `input.taxpayer_type == MIXED_INCOME → pbr.total_nti == input.taxable_compensation + pbr.biz_nti` | PL-09; CR-029 |
| INV-PB-09 | Deduction method is always OSD for Path B | `pbr.deduction_method == OSD` | PL-09 |
| INV-PB-10 | No separate PT deduction is applied in Path B | `pbr` has no `pt_deduction_applied` field (OSD is blanket) | PL-09: OSD implicitly covers PT |
| INV-PB-11 | OSD base for service provider includes non-operating income | `taxpayer_class == SERVICE_PROVIDER → osr.osd_base == ga.net_gross_receipts + input.non_operating_income` | PL-06; CR-026 |
| INV-PB-12 | OSD base for trader excludes COGS then adds non-operating | `taxpayer_class == TRADER → osr.osd_base == ga.gross_income + input.non_operating_income` | PL-06; CR-026 |
| INV-PB-13 | Path B NTI ≤ graduated income base | `pbr.biz_nti <= ga.graduated_income_base` | Deduction always reduces |
| INV-PB-14 | Path B result is not produced when Path B is ineligible | `NOT er.path_b_eligible → pbr == null OR pbr.eligible == false` | PL-09 |
| INV-PB-15 | NOLCO is NOT available under OSD (Path B) | No NOLCO field in `OsdResult`; OSD is a blanket deduction | Sec. 34(L); NOLCO is a Sec. 34(D)(3) itemized item |

---

## 6. Path C (8% Flat) Invariants

These invariants apply to the `PathCResult` struct produced by PL-10.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-PC-01 | Path C is only computed when eligible | `pcr.eligible → er.path_c_eligible` (and vice versa) | PL-10 |
| INV-PC-02 | Ineligible Path C result has no tax computed | `NOT pcr.eligible → pcr.income_tax_due == 0 AND pcr.total_income_tax == 0` | PL-10 |
| INV-PC-03 | PURELY_SE exempt amount is ₱250,000 | `input.taxpayer_type == PURELY_SE AND pcr.eligible → pcr.exempt_amount == 250_000` | PL-10; NIRC Sec. 24(A)(2)(b) |
| INV-PC-04 | MIXED_INCOME exempt amount is ₱0 | `input.taxpayer_type == MIXED_INCOME AND pcr.eligible → pcr.exempt_amount == 0` | PL-10; RMC 50-2018 |
| INV-PC-05 | Taxable base is non-negative | `pcr.taxable_base >= 0` | PL-10: `max(0, …)` |
| INV-PC-06 | Taxable base equals eight_pct_base minus exempt amount | `pcr.eligible → pcr.taxable_base == max(0, ga.eight_pct_base - pcr.exempt_amount)` | PL-10; CR-006 |
| INV-PC-07 | Business income tax is exactly 8% of taxable base | `pcr.eligible → pcr.income_tax_due == round(pcr.taxable_base * 0.08, 2)` | PL-10; NIRC Sec. 24(A)(2)(b) |
| INV-PC-08 | Business IT is non-negative | `pcr.income_tax_due >= 0` | PL-10 |
| INV-PC-09 | Compensation IT is non-negative | `pcr.compensation_it >= 0` | PL-10 |
| INV-PC-10 | Total income tax for Path C = business IT + comp IT | `pcr.total_income_tax == pcr.income_tax_due + pcr.compensation_it` | PL-10 |
| INV-PC-11 | Compensation IT is zero for PURELY_SE | `input.taxpayer_type == PURELY_SE → pcr.compensation_it == 0` | PL-10: no comp income |
| INV-PC-12 | Path C always waives PT when eligible | `pcr.eligible → pcr.pt_waived == true` | PL-10; RR 8-2018 Sec. 2(A) |
| INV-PC-13 | Path C business tax is always ≤ 8% of gross receipts | `pcr.income_tax_due <= ga.eight_pct_base * 0.08` | Because taxable_base ≤ eight_pct_base |
| INV-PC-14 | Path C tax for zero-gross purely-SE filer is ₱0 | `input.taxpayer_type == PURELY_SE AND ga.eight_pct_base <= 250_000 → pcr.income_tax_due == 0` | PL-10: taxable_base = max(0, …) = 0 |
| INV-PC-15 | Deduction method is NONE for Path C | `pcr.eligible → pcr.deduction_method == NONE` | PL-10: no deductions apply |
| INV-PC-16 | Path C tax does not depend on itemized_expenses | `pcr.income_tax_due` is determined solely by `ga.eight_pct_base` and `pcr.exempt_amount` | CR-006: 8% is gross-receipts-only |

---

## 7. Percentage Tax Invariants

These invariants apply to the `PercentageTaxResult` struct produced by PL-11.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-PT-01 | PT is zero when Path C is elected | `pcr.eligible AND pcr.pt_waived → ptr.pt_due == 0 AND NOT ptr.pt_applies` | PL-11; RR 8-2018 Sec. 2(A) |
| INV-PT-02 | PT is zero when VAT-registered | `input.is_vat_registered → ptr.pt_due == 0 AND NOT ptr.pt_applies` | PL-11; VAT replaces PT; CR-031 |
| INV-PT-03 | PT and VAT are mutually exclusive | `input.is_vat_registered → NOT ptr.pt_applies` | CR-031; Sec. 116 vs. Sec. 106/108 |
| INV-PT-04 | PT is zero for COMPENSATION_ONLY taxpayers | `input.taxpayer_type == COMPENSATION_ONLY → ptr.pt_due == 0 AND NOT ptr.pt_applies` | PL-11: no business income |
| INV-PT-05 | PT due is non-negative | `ptr.pt_due >= 0` | PT cannot be negative |
| INV-PT-06 | PT due equals pt_base × pt_rate (rounded to centavo) | `ptr.pt_applies → ptr.pt_due == round(ptr.pt_base * ptr.pt_rate, 2)` | PL-11; Sec. 116 |
| INV-PT-07 | PT base is non-negative | `ptr.pt_base >= 0` | PL-11 |
| INV-PT-08 | PT rate for periods from Jul 1, 2023 onwards is 3% | `period.end_date >= date(2023, 7, 1) → ptr.pt_rate == 0.03` | PL-11; CR-034; CREATE Act expired Jun 30, 2023 |
| INV-PT-09 | PT rate for periods Jul 1, 2020 to Jun 30, 2023 is 1% | `date(2020, 7, 1) <= period.end_date <= date(2023, 6, 30) → ptr.pt_rate == 0.01` | PL-11; RA 11534 CREATE Act |
| INV-PT-10 | PT rate for periods before Jul 1, 2020 is 3% | `period.end_date < date(2020, 7, 1) → ptr.pt_rate == 0.03` | PL-11; original Sec. 116 rate |
| INV-PT-11 | Form 2551Q required if and only if PT applies | `ptr.form_2551q_required ↔ ptr.pt_applies` | PL-11 |
| INV-PT-12 | PT does not appear as percentage_tax_due in Path C comparison entry | `In rcr.comparisons, the PATH_C entry: percentage_tax_due == 0` | PL-13: PT waived for Path C |
| INV-PT-13 | PT appears as percentage_tax_due in Path A and Path B comparison entries when pt_applies | `ptr.pt_applies → (PATH_A entry: percentage_tax_due == ptr.pt_due) AND (PATH_B entry: percentage_tax_due == ptr.pt_due)` | PL-13 |
| INV-PT-14 | PT base after EOPT uses gross sales not gross receipts | `period.end_date >= date(2024, 10, 27) → ptr.pt_base == ga.pt_quarterly_base` | PL-11; RA 11976 EOPT |

---

## 8. CWT Credits Invariants

These invariants apply to the `CwtCreditResult` struct produced by PL-07.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-CWT-01 | Total IT CWT is non-negative | `cwt.it_cwt_total >= 0` | PL-07 |
| INV-CWT-02 | Total PT CWT is non-negative | `cwt.pt_cwt_total >= 0` | PL-07 |
| INV-CWT-03 | IT CWT includes all WI/WC ATC entries | `cwt.it_cwt_total` includes `sum(e.tax_withheld for e in input.cwt_2307_entries where e.atc_code starts_with WI or WC)` | PL-07; classification logic |
| INV-CWT-04 | PT CWT includes only PT010 entries | `cwt.pt_cwt_total == sum(e.tax_withheld for e in input.cwt_2307_entries where e.atc_code == PT010)` | PL-07 |
| INV-CWT-05 | No entry is counted in both IT and PT credits | An entry classified as INCOME_TAX_CWT adds to `it_cwt_total` only; PERCENTAGE_TAX_CWT adds to `pt_cwt_total` only | PL-07; disjoint classification |
| INV-CWT-06 | IT CWT includes compensation CWT | `cwt.it_cwt_total` includes `input.compensation_cwt` | PL-07 |
| INV-CWT-07 | IT CWT includes prior-year excess CWT carry-over | `cwt.it_cwt_total` includes `input.prior_year_excess_cwt` | PL-07 |
| INV-CWT-08 | prior_year_excess_applied field equals input carry-over | `cwt.prior_year_excess_applied == input.prior_year_excess_cwt` | PL-07 |
| INV-CWT-09 | compensation_cwt_applied field equals input comp CWT | `cwt.compensation_cwt_applied == input.compensation_cwt` | PL-07 |
| INV-CWT-10 | Unknown ATC entries are not credited (MRF-021 flagged) | ATC entries classified as UNKNOWN contribute neither to `it_cwt_total` nor `pt_cwt_total` | PL-07 |
| INV-CWT-11 | IT CWT total = WI/WC sum + comp_cwt + prior_year_excess | `cwt.it_cwt_total == wi_wc_sum + input.compensation_cwt + input.prior_year_excess_cwt` | PL-07 |
| INV-CWT-12 | All entries in entries_detail have a classification | `∀ e ∈ cwt.entries_detail: e.type ∈ {INCOME_TAX_CWT, PERCENTAGE_TAX_CWT, UNKNOWN}` | PL-07 |

---

## 9. Regime Comparison Invariants

These invariants apply to the `RegimeComparisonResult` struct produced by PL-13.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-RC-01 | At least one path in comparison list | `len(rcr.comparisons) >= 1` | PL-13; non-COMP_ONLY always has A and B |
| INV-RC-02 | No ineligible path appears in comparison list | `∀ opt ∈ rcr.comparisons: opt.path is eligible per er` | PL-13 |
| INV-RC-03 | Each path appears at most once | `len(rcr.comparisons) == len(set(opt.path for opt in rcr.comparisons))` | PL-13 |
| INV-RC-04 | Comparison list is sorted ascending by total_tax_burden | `∀ i < j: rcr.comparisons[i].total_tax_burden <= rcr.comparisons[j].total_tax_burden` | PL-13 |
| INV-RC-05 | Recommended path has minimum total tax burden | `rcr.comparisons[0].path == rcr.recommended_path` | PL-13 |
| INV-RC-06 | Recommended path is always valid (in eligible set) | `rcr.recommended_path ∈ {p for p in [PATH_A, PATH_B, PATH_C] if eligible}` | PL-13 |
| INV-RC-07 | Tie-breaking: PATH_C preferred over PATH_B over PATH_A at equal burden | `comparisons[0].total_tax_burden == comparisons[1].total_tax_burden → path_preference(comparisons[0].path) >= path_preference(comparisons[1].path)` | PL-13; tie-break rule |
| INV-RC-08 | savings_vs_worst >= 0 | `rcr.savings_vs_worst >= 0` | PL-13: worst minus best >= 0 |
| INV-RC-09 | savings_vs_next_best >= 0 | `rcr.savings_vs_next_best >= 0` | PL-13: second minus first >= 0 |
| INV-RC-10 | savings_vs_worst is zero when only one path is eligible | `len(rcr.comparisons) == 1 → rcr.savings_vs_worst == 0` | PL-13 |
| INV-RC-11 | savings_vs_next_best is zero when only one path is eligible | `len(rcr.comparisons) == 1 → rcr.savings_vs_next_best == 0` | PL-13 |
| INV-RC-12 | Total tax burden of each entry = IT due + PT due | `∀ opt ∈ rcr.comparisons: opt.total_tax_burden == opt.income_tax_due + opt.percentage_tax_due` | PL-13 |
| INV-RC-13 | PATH_C entry has zero percentage_tax_due | `PATH_C ∈ rcr.comparisons → rcr.comparisons[PATH_C].percentage_tax_due == 0` | PL-13; PT waived for 8% option |
| INV-RC-14 | PATH_A and PATH_B entries share the same percentage_tax_due | `PATH_A ∈ rcr.comparisons AND PATH_B ∈ rcr.comparisons → rcr.comparisons[PATH_A].percentage_tax_due == rcr.comparisons[PATH_B].percentage_tax_due` | PL-13; both use same PT from PL-11 |
| INV-RC-15 | locked_path equals recommended_path when no lock | `NOT rcr.using_locked_regime → rcr.locked_path == rcr.recommended_path` | PL-13 |
| INV-RC-16 | using_locked_regime is true when input.elected_regime is non-null | `(input.elected_regime != null) ↔ rcr.using_locked_regime` | PL-13 |
| INV-RC-17 | savings_vs_worst = worst_burden - best_burden | `rcr.savings_vs_worst == rcr.comparisons[-1].total_tax_burden - rcr.comparisons[0].total_tax_burden` | PL-13 |
| INV-RC-18 | savings_vs_next_best = second_burden - first_burden | `len(rcr.comparisons) >= 2 → rcr.savings_vs_next_best == rcr.comparisons[1].total_tax_burden - rcr.comparisons[0].total_tax_burden` | PL-13 |
| INV-RC-19 | VAT-registered taxpayers have PATH_C absent from comparisons | `input.is_vat_registered → PATH_C not in rcr.comparisons` | INV-EL-01 propagated to PL-13 |
| INV-RC-20 | Gross > ₱3M taxpayers have PATH_C absent from comparisons | `ga.threshold_base > 3_000_000 → PATH_C not in rcr.comparisons` | INV-EL-02 propagated to PL-13 |

---

## 10. Balance Computation Invariants

These invariants apply to the `BalanceResult` struct produced by PL-14.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-BAL-01 | Balance = IT due minus total IT credits | `br.balance == selected_it_due - qa.total_it_credits` | PL-14 |
| INV-BAL-02 | Disposition is BALANCE_PAYABLE when balance > 0 | `br.balance > 0 → br.disposition == BALANCE_PAYABLE` | PL-14 |
| INV-BAL-03 | Disposition is ZERO_BALANCE when balance = 0 | `br.balance == 0 → br.disposition == ZERO_BALANCE` | PL-14 |
| INV-BAL-04 | Disposition is OVERPAYMENT when balance < 0 | `br.balance < 0 → br.disposition == OVERPAYMENT` | PL-14 |
| INV-BAL-05 | Overpayment amount equals absolute value of balance | `br.disposition == OVERPAYMENT → br.overpayment == abs(br.balance)` | PL-14 |
| INV-BAL-06 | Overpayment is zero when not OVERPAYMENT disposition | `br.disposition != OVERPAYMENT → br.overpayment == 0` | PL-14 |
| INV-BAL-07 | Installment eligibility requires ANNUAL period AND balance > ₱2,000 | `br.installment_eligible ↔ (input.filing_period == ANNUAL AND br.balance > 2_000)` | PL-14; annual ITR installment rule |
| INV-BAL-08 | Installment first + second equals total balance when installment eligible | `br.installment_eligible → br.installment_first + br.installment_second == br.balance` | PL-14 |
| INV-BAL-09 | First installment ≈ half of balance (round-up to centavo) | `br.installment_eligible → br.installment_first == round(br.balance / 2, 2)` | PL-14 |
| INV-BAL-10 | Second installment is balance minus first installment | `br.installment_eligible → br.installment_second == br.balance - br.installment_first` | PL-14 |
| INV-BAL-11 | Not installment eligible: first installment equals balance | `NOT br.installment_eligible → br.installment_first == br.balance AND br.installment_second == 0` | PL-14 |
| INV-BAL-12 | Credits used (IT only) are non-negative | `qa.total_it_credits >= 0` | Derived from INV-CWT-01 and INV-IN-15 |
| INV-BAL-13 | PT credits (pt_cwt_credits) are NOT applied against income tax | `qa.pt_cwt_credits` is separate; NOT subtracted from `br.balance` | PL-12/PL-14 |
| INV-BAL-14 | Total IT credits = quarterly 1701Q payments + CWT it_cwt_total | `qa.total_it_credits == qa.total_quarterly_it_paid + cwt.it_cwt_total` | PL-12 |
| INV-BAL-15 | quarterly_it_paid = q1_paid + q2_paid + q3_paid | `qa.total_quarterly_it_paid == qa.q1_paid + qa.q2_paid + qa.q3_paid` | PL-12 |

---

## 11. Penalty Invariants

These invariants apply to the `PenaltyResult` struct produced by PL-16.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-PEN-01 | Surcharge is zero when filed on time or before deadline | `actual_filing_date <= filing_deadline → pr.surcharge == 0` | PL-16; CR-020 |
| INV-PEN-02 | Interest is zero when filed on time | `actual_filing_date <= filing_deadline → pr.interest == 0` | PL-16; CR-020 |
| INV-PEN-03 | Surcharge rate for MICRO/SMALL tier is 10% | `taxpayer_tier ∈ {MICRO, SMALL} AND late → pr.surcharge_rate == 0.10` | PL-16; EOPT Act; RR 8-2024 |
| INV-PEN-04 | Surcharge rate for MEDIUM/LARGE tier is 25% | `taxpayer_tier ∈ {MEDIUM, LARGE} AND late → pr.surcharge_rate == 0.25` | PL-16; Sec. 248; standard rate |
| INV-PEN-05 | Surcharge base is the basic tax due (before credits) | `pr.surcharge_base == selected_it_due` (not balance) | PL-16; Sec. 248 |
| INV-PEN-06 | Interest rate per annum for MICRO/SMALL is 6% | `taxpayer_tier ∈ {MICRO, SMALL} AND late → pr.interest_rate_pa == 0.06` | PL-16; EOPT Act |
| INV-PEN-07 | Interest rate per annum for MEDIUM/LARGE is 12% | `taxpayer_tier ∈ {MEDIUM, LARGE} AND late → pr.interest_rate_pa == 0.12` | PL-16; Sec. 249 standard rate |
| INV-PEN-08 | Interest = basic_tax × annual_rate × (days_late / 365) | `pr.interest == round(pr.surcharge_base * pr.interest_rate_pa * (pr.days_late / 365), 2)` | PL-16; CR-020 |
| INV-PEN-09 | Days late is non-negative | `pr.days_late >= 0` (0 when on-time) | PL-16 |
| INV-PEN-10 | Surcharge is non-negative | `pr.surcharge >= 0` | PL-16 |
| INV-PEN-11 | Interest is non-negative | `pr.interest >= 0` | PL-16 |
| INV-PEN-12 | Compromise penalty is non-negative | `pr.compromise_penalty >= 0` | PL-16 |
| INV-PEN-13 | Total penalty = surcharge + interest + compromise | `pr.total_penalty == pr.surcharge + pr.interest + pr.compromise_penalty` | PL-16; CR-020 |
| INV-PEN-14 | Surcharge cannot exceed 50% of basic tax | `pr.surcharge <= pr.surcharge_base * 0.50` (fraud max) | PL-16; Sec. 248(B) |
| INV-PEN-15 | Penalties are zero when actual_filing_date is null (on-time assumed) | `input.actual_filing_date == null → pr.surcharge == 0 AND pr.interest == 0` | PL-16 |
| INV-PEN-16 | Compromise penalty follows bracket table (RMO 7-2015) | `pr.compromise_penalty` is one of 9 discrete values: ₱1K, ₱3K, ₱5K, ₱7.5K, ₱10K, ₱15K, ₱20K, ₱25K, ₱50K | PL-16; CR-020; RMO 7-2015 Annex A |
| INV-PEN-17 | Total tax due with penalties = selected_it_due + total_penalty | `pr.total_tax_due_with_penalties == selected_it_due + pr.total_penalty` | PL-16 |

---

## 12. Form Field Invariants

These invariants apply to all `BirFormOutput` structs produced by PL-15.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-FF-01 | Form 1701A is only used for PURELY_SE using Path B or Path C | `form_type == FORM_1701A → (input.taxpayer_type == PURELY_SE AND selected_path ∈ {PATH_B, PATH_C})` | PL-15; NIRC Sec. 51 |
| INV-FF-02 | Form 1701 is used for MIXED_INCOME or Path A or VAT-registered | `(input.taxpayer_type == MIXED_INCOME OR selected_path == PATH_A OR input.is_vat_registered) → form_type == FORM_1701` | PL-15 |
| INV-FF-03 | Form 1701Q is only used for Q1, Q2, Q3 filing periods | `form_type == FORM_1701Q ↔ input.filing_period ∈ {Q1, Q2, Q3}` | PL-15; Sec. 74 |
| INV-FF-04 | All BIR form monetary fields are non-negative | `∀ monetary field f ∈ bir_form_output: f >= 0` | PL-15; BIR forms use positive values |
| INV-FF-05 | Form 1701 Item 35 (IT due) equals PathAResult.income_tax_due (Path A) | `selected_path == PATH_A → form_1701.item_35 == par.income_tax_due` | PL-15; bir-form-1701-field-mapping.md |
| INV-FF-06 | Form 1701A Item 55 (8% IT due) equals PathCResult.income_tax_due | `selected_path == PATH_C → form_1701a.item_55 == pcr.income_tax_due` | PL-15; bir-form-1701a-field-mapping.md |
| INV-FF-07 | Form 1701A Item 45 (IT due OSD) equals PathBResult.income_tax_due | `selected_path == PATH_B AND form_type == FORM_1701A → form_1701a.item_45 == pbr.income_tax_due` | PL-15 |
| INV-FF-08 | BIR form display values are whole-peso amounts | `∀ f ∈ bir_form_display: f == floor(internal_decimal_value)` | PL-15; BIR forms truncate to peso |
| INV-FF-09 | Form 2551Q is generated if and only if form_2551q_required | `ptr.form_2551q_required ↔ (form_2551q_output is present)` | PL-15 |

---

## 13. Rounding Invariants

These invariants apply to all intermediate and final decimal values in the engine.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-RND-01 | All final IT due values are rounded to nearest centavo | `round(it_due, 2) == it_due` (no more than 2 decimal places in final outputs) | PL-08/09/10; precision rules in data-model.md |
| INV-RND-02 | All final PT due values are rounded to nearest centavo | `round(ptr.pt_due, 2) == ptr.pt_due` | PL-11 |
| INV-RND-03 | OSD deduction is not independently rounded mid-computation | OSD deduction remains full-precision until final IT is rounded | PL-06; no intermediate rounding |
| INV-RND-04 | BIR form display values use floor (not round) to whole peso | `form_display_value == floor(internal_value)` | PL-15; BIR form convention |
| INV-RND-05 | No floating-point arithmetic is used | All values are `Decimal` type (arbitrary precision) | data-model.md Section 1 |
| INV-RND-06 | Division maintains at least 10 decimal places before final round | Internal computation: `1 / useful_life` uses ≥ 10 decimal places | data-model.md Section 1 |
| INV-RND-07 | Interest computation is rounded to centavo | `round(interest_raw, 2) == pr.interest` | PL-16; CR-020 |
| INV-RND-08 | Installment first payment is rounded to centavo | `round(balance / 2, 2) == br.installment_first` | PL-14 |

---

## 14. Determinism Invariants

These invariants apply to the engine as a whole.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-DET-01 | Engine is a pure function | `compute_tax(input) == compute_tax(input)` for any equal inputs | System design; no external calls, no mutable state |
| INV-DET-02 | No external calls during computation | The engine reads no files, makes no HTTP requests, and accesses no databases during `compute_tax()` | System design; all tables are compile-time constants |
| INV-DET-03 | No randomness | The engine never calls any random number generator | System design |
| INV-DET-04 | No I/O side effects | `compute_tax()` does not write to any log, file, or stream during execution | System design |
| INV-DET-05 | Order of 2307 entries does not affect totals | `cwt.it_cwt_total` is the same regardless of the order of `input.cwt_2307_entries` | PL-07: summation is commutative |
| INV-DET-06 | Order of quarterly_payments does not affect totals | `qa.total_quarterly_it_paid` is the same regardless of order of `input.prior_quarterly_payments` | PL-12: summation is commutative |
| INV-DET-07 | Graduated rate table lookup is reproducible | `apply_graduated_rate(N, Y) == apply_graduated_rate(N, Y)` | PL-08/09: static table |
| INV-DET-08 | Rate year cutoff is hard-coded at 2023 | `tax_year >= 2023 → 2023+ table; tax_year < 2023 → 2018–2022 table` | PL-08/09; CR-002/CR-003 |

---

## 15. Cross-Path Consistency Invariants

These invariants relate the three paths to each other, ensuring they are computed from the same inputs and respect the correct relationships.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-XP-01 | All three paths use the same gross_receipts | PL-08, PL-09, PL-10 all read from the same `GrossAggregates` | PL-03 produces one `GrossAggregates` instance |
| INV-XP-02 | All three paths use the same graduated rate table for the same tax_year | `apply_graduated_rate(N, Y)` called consistently in PL-08 and PL-09 | PL-08/09 |
| INV-XP-03 | Path A NTI ≤ Path B NTI when itemized deductions ≥ OSD | `idr.total_deductions >= osr.osd_deduction → par.biz_nti <= pbr.biz_nti` | Algebraic: more deductions = lower NTI |
| INV-XP-04 | Path A NTI ≥ Path B NTI when itemized deductions < OSD | `idr.total_deductions < osr.osd_deduction → par.biz_nti >= pbr.biz_nti` | Algebraic: fewer deductions = higher NTI |
| INV-XP-05 | Path A and B have the same PT added to total burden | `par.eligible AND pbr.eligible → rcr.comparisons[PATH_A].percentage_tax_due == rcr.comparisons[PATH_B].percentage_tax_due` | PL-13: single PT value from PL-11 |
| INV-XP-06 | No deduction mixing: a computation uses ONLY ONE deduction method | A single `TaxComputationResult` reports EXACTLY ONE selected deduction method | PL-13: one locked/recommended path |
| INV-XP-07 | The 8% base is identical across paths (for threshold and Path C base) | `ga.threshold_base == ga.eight_pct_base` | PL-03: same computation |
| INV-XP-08 | Path C tax increases monotonically with gross receipts | `∀ GR1 < GR2: path_c_tax(GR1) <= path_c_tax(GR2)` (holding exempt_amount fixed) | INV-MON-03 |
| INV-XP-09 | When Path C is ineligible, it is absent from regime comparison | `NOT er.path_c_eligible → PATH_C ∉ rcr.comparisons` | PL-13; ineligible paths not computed |
| INV-XP-10 | Path A and Path B NTI use the same graduated rate function | Both call `apply_graduated_rate(total_nti, tax_year)` | PL-08/PL-09 |

---

## 16. Monotonicity Invariants

These invariants express economic monotonicity — inputs that should produce higher taxes produce higher or equal taxes.

| ID | Property | Expression | Source |
|----|----------|------------|--------|
| INV-MON-01 | Graduated tax is non-decreasing in NTI | `N1 <= N2 → apply_graduated_rate(N1, Y) <= apply_graduated_rate(N2, Y)` | CR-002: monotonically increasing bracket structure |
| INV-MON-02 | Graduated tax is non-negative for all NTI ≥ 0 | `N >= 0 → apply_graduated_rate(N, Y) >= 0` | CR-002: 0% bracket at base |
| INV-MON-03 | Path C tax is non-decreasing in gross receipts | `GR1 <= GR2 → path_c_it(GR1) <= path_c_it(GR2)` | PL-10: linear function of taxable_base |
| INV-MON-04 | Path B tax is non-decreasing in OSD base | `osd_base_1 <= osd_base_2 → path_b_it(osd_base_1) <= path_b_it(osd_base_2)` | PL-09: OSD NTI = 60% of base → higher base = higher NTI |
| INV-MON-05 | Path A tax is non-increasing in itemized deductions | `deductions_1 >= deductions_2 → path_a_it(deductions_1) <= path_a_it(deductions_2)` (holding gross constant) | PL-08: more deductions = lower NTI = lower tax |
| INV-MON-06 | Higher CWT credits always reduce balance payable | `credits_1 > credits_2 → balance(credits_1) <= balance(credits_2)` (holding IT due constant) | PL-14: balance = IT_due - credits |
| INV-MON-07 | Penalty increases with days late (all else equal) | `days_1 > days_2 → total_penalty(days_1) >= total_penalty(days_2)` | PL-16: interest is proportional to days_late |
| INV-MON-08 | OSD deduction increases proportionally with OSD base | `base_1 < base_2 → osd_deduction_1 / base_1 == osd_deduction_2 / base_2 == 0.40` | PL-06: exactly 40% always |
| INV-MON-09 | PT increases monotonically with gross sales | `sales_1 <= sales_2 → pt_due_1 <= pt_due_2` | PL-11: PT = gross_sales × pt_rate |
| INV-MON-10 | Total tax burden of recommended path ≤ any other eligible path | `rcr.comparisons[0].total_tax_burden <= rcr.comparisons[i].total_tax_burden for i > 0` | PL-13: sorted ascending |

---

## Summary Table

| Category | Count | Invariant IDs |
|----------|-------|---------------|
| Input-Level | 22 | INV-IN-01 through INV-IN-22 |
| Gross Aggregates | 12 | INV-GA-01 through INV-GA-12 |
| Eligibility | 14 | INV-EL-01 through INV-EL-14 |
| Path A | 21 | INV-PA-01 through INV-PA-21 |
| Path B | 15 | INV-PB-01 through INV-PB-15 |
| Path C | 16 | INV-PC-01 through INV-PC-16 |
| Percentage Tax | 14 | INV-PT-01 through INV-PT-14 |
| CWT Credits | 12 | INV-CWT-01 through INV-CWT-12 |
| Regime Comparison | 20 | INV-RC-01 through INV-RC-20 |
| Balance | 15 | INV-BAL-01 through INV-BAL-15 |
| Penalty | 17 | INV-PEN-01 through INV-PEN-17 |
| Form Fields | 9 | INV-FF-01 through INV-FF-09 |
| Rounding | 8 | INV-RND-01 through INV-RND-08 |
| Determinism | 8 | INV-DET-01 through INV-DET-08 |
| Cross-Path | 10 | INV-XP-01 through INV-XP-10 |
| Monotonicity | 10 | INV-MON-01 through INV-MON-10 |
| **TOTAL** | **223** | |

---

## How to Use These Invariants

### In Unit Tests
Every test vector in `engine/test-vectors/` must pass all applicable invariants. After computing `result = compute_tax(input)`, the test harness must check every invariant whose preconditions are satisfied by that `input`.

### In Property-Based Tests
See `engine/test-vectors/fuzz-properties.md` for invariants expressed as QuickCheck/Hypothesis properties. The fuzz harness generates random `TaxpayerInput` values, calls `compute_tax()`, and asserts every invariant holds.

### In Code Review
When reviewing computation code, check that:
1. No intermediate step can produce a negative monetary value that reaches a final output (all floors are applied).
2. No deduction category appears in more than one path's computation.
3. The graduated rate table is called with the correct `tax_year` parameter.
4. PT is always zeroed out for Path C and VAT-registered cases.

### In Debugging
When an invariant fails, the invariant ID tells you exactly which pipeline step and legal rule to investigate. Example: `INV-PT-01` failure means the PT computation did not correctly detect that Path C was elected.
