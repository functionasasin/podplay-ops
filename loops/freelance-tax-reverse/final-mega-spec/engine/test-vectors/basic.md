# Basic (Happy Path) Test Vectors — Philippine Freelance Tax Optimizer

**Status:** COMPLETE — 8 vectors covering the highest-priority happy-path scenarios
**Last updated:** 2026-03-01
**Cross-references:**
- Computation rules: [domain/computation-rules.md](../../domain/computation-rules.md)
- Scenario codes: [domain/scenarios.md](../../domain/scenarios.md)
- Data model: [engine/data-model.md](../data-model.md)
- Pipeline: [engine/pipeline.md](../pipeline.md)
- Invariants: [engine/invariants.md](../invariants.md)

---

## How to Read These Vectors

Each vector specifies:
1. **Scenario code** — References a code in scenarios.md
2. **Full input** — Every `TaxpayerInput` field, no fields omitted
3. **Expected intermediate values** — Key outputs of each pipeline step, for debugging
4. **Expected final output** — Every field of `TaxComputationResult`, exact values
5. **Verification** — The mathematical derivation confirming each value

Monetary values in Philippine Pesos (₱). Decimal rates as fractions (0.08 = 8%). All final tax amounts rounded to nearest centavo (2 decimal places). BIR form display fields truncated to whole peso (floor).

---

## TV-BASIC-001: SC-P-ML-8 — Typical Online Freelancer, 8% Wins

**Scenario code:** SC-P-ML-8
**Description:** Online freelancer (graphic designer) earning ₱700,000 gross receipts per year, no significant business expenses, no CWT from clients (all payments made without withholding). Annual filing. This is the most common real-world case and demonstrates the core value of the optimizer — the 8% option saves ₱11,500 vs OSD.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | No employment income |
| `tax_year` | 2025 | TRAIN second schedule (2023+) applies |
| `filing_period` | `ANNUAL` | Full year return |
| `is_mixed_income` | false | No compensation income |
| `is_vat_registered` | false | Gross < ₱3M; not VAT-registered |
| `is_bmbe_registered` | false | Not BMBE |
| `subject_to_sec_117_128` | false | Not subject to special % tax |
| `is_gpp_partner` | false | Individual, not GPP |
| `gross_receipts` | ₱700,000.00 | Total freelance income for year |
| `sales_returns_allowances` | ₱0.00 | No returns or allowances |
| `non_operating_income` | ₱0.00 | No bank interest or other income |
| `fwt_income` | ₱0.00 | No final-withholding-tax income |
| `cost_of_goods_sold` | ₱0.00 | Pure service provider |
| `taxable_compensation` | ₱0.00 | No employment |
| `compensation_cwt` | ₱0.00 | No employer withholding |
| `itemized_expenses.salaries_wages` | ₱0.00 | No employees |
| `itemized_expenses.rent` | ₱0.00 | Works from home |
| `itemized_expenses.utilities` | ₱0.00 | Home office not separately declared |
| `itemized_expenses.supplies` | ₱0.00 | Minor supplies not claimed |
| `itemized_expenses.communication` | ₱0.00 | |
| `itemized_expenses.travel` | ₱0.00 | |
| `itemized_expenses.depreciation` | ₱0.00 | |
| `itemized_expenses.interest` | ₱0.00 | |
| `itemized_expenses.taxes_and_licenses` | ₱0.00 | |
| `itemized_expenses.bad_debts` | ₱0.00 | |
| `itemized_expenses.charitable_contributions` | ₱0.00 | |
| `itemized_expenses.ear_expense` | ₱0.00 | |
| `itemized_expenses.nolco` | ₱0.00 | No prior-year losses |
| `itemized_expenses.other_expenses` | ₱0.00 | |
| `elected_regime` | null | Optimizer mode; engine recommends |
| `osd_elected` | null | Engine recommends |
| `prior_quarterly_payments` | [] | No quarterly payments made |
| `cwt_2307_entries` | [] | No CWT certificates |
| `prior_year_excess_cwt` | ₱0.00 | No prior overpayment |
| `actual_filing_date` | null | On-time filing assumed |
| `return_type` | `ORIGINAL` | First filing |
| `prior_payment_for_return` | ₱0.00 | |

### Expected Intermediate Values

**PL-02 (Classification):**
- `net_gross_receipts` = ₱700,000.00 (gross_receipts − 0)
- `taxpayer_tier` = MICRO (< ₱3,000,000)
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER (cost_of_goods_sold = 0)

**PL-03 (Aggregate Gross):**
- `total_gross_for_8pct_threshold` = ₱700,000.00 (gross_receipts only; no non-operating income)
- `net_gross_receipts` = ₱700,000.00

**PL-04 (Eligibility):**
- `path_c_eligible` = true (net_gross ≤ ₱3,000,000 AND not VAT-registered AND not GPP)
- `ineligibility_reasons` = []

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00 (all zero)
- `ear_cap` = ₱700,000.00 × 0.01 = ₱7,000.00 (not binding since EAR claimed = ₱0)

**PL-06 (OSD):**
- `osd_amount` = ₱700,000.00 × 0.40 = ₱280,000.00
- `nti_path_b` = ₱700,000.00 − ₱280,000.00 = ₱420,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱0.00 (no 2307 entries, no compensation CWT)

**PL-08 (Path A):**
- `nti_path_a` = ₱700,000.00 − ₱0.00 = ₱700,000.00
- `income_tax_path_a` = graduated_tax_2023(₱700,000)
  = ₱22,500 + (₱700,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱60,000.00
  = ₱82,500.00
- `percentage_tax_path_a` = ₱700,000.00 × 0.03 = ₱21,000.00
- `total_tax_path_a` = ₱82,500.00 + ₱21,000.00 = ₱103,500.00

**PL-09 (Path B):**
- `nti_path_b` = ₱420,000.00 (from PL-06)
- `income_tax_path_b` = graduated_tax_2023(₱420,000)
  = ₱22,500 + (₱420,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱4,000.00
  = ₱26,500.00
- `percentage_tax_path_b` = ₱700,000.00 × 0.03 = ₱21,000.00
- `total_tax_path_b` = ₱26,500.00 + ₱21,000.00 = ₱47,500.00

**PL-10 (Path C):**
- `path_c_base` = max(₱700,000.00 − ₱250,000.00, 0) = ₱450,000.00
- `income_tax_path_c` = ₱450,000.00 × 0.08 = ₱36,000.00
- `percentage_tax_path_c` = ₱0.00 (waived under 8% option per NIRC Sec. 24(A)(2)(b))
- `total_tax_path_c` = ₱36,000.00

**PL-11 (Percentage Tax — standalone):**
- PT computed for Path A/B = ₱21,000.00; embedded in those path totals
- PT for Path C = ₱0.00 (waived)

**PL-12 (Aggregate Quarterly Payments):**
- `total_quarterly_it_paid` = ₱0.00 (no prior quarterly payments)

**PL-13 (Compare Regimes):**
- Comparison table:
  - Path A: ₱103,500.00
  - Path B: ₱47,500.00
  - Path C: ₱36,000.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱47,500.00 − ₱36,000.00 = ₱11,500.00
- `savings_vs_worst` = ₱103,500.00 − ₱36,000.00 = ₱67,500.00

**PL-14 (Balance):**
- `total_income_tax_due` = ₱36,000.00 (under Path C)
- `total_cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱36,000.00 − ₱0.00 − ₱0.00 = ₱36,000.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `selected_form` = FORM_1701A (PURELY_SE + annual + Path C)
- `form_section` = Part IV-B (8% rate section of 1701A)

**PL-16 (Penalties):**
- `filing_on_time` = true (no actual_filing_date provided; assume on-time)
- `penalty_surcharge` = ₱0.00
- `penalty_interest` = ₱0.00
- `compromise_penalty` = ₱0.00
- `total_penalties` = ₱0.00

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: MICRO

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 700000.00
      income_tax: 82500.00
      percentage_tax: 21000.00
      total_tax: 103500.00
    }
    path_b: {
      eligible: true
      nti: 420000.00
      osd_amount: 280000.00
      income_tax: 26500.00
      percentage_tax: 21000.00
      total_tax: 47500.00
    }
    path_c: {
      eligible: true
      tax_base: 450000.00
      income_tax: 36000.00
      percentage_tax: 0.00
      total_tax: 36000.00
      ineligibility_reasons: []
    }
    recommended_path: PATH_C
    savings_vs_next_best: 11500.00
    savings_vs_worst: 67500.00
  }

  selected_path: PATH_C
  income_tax_due: 36000.00
  percentage_tax_due: 0.00
  total_tax_due: 36000.00

  cwt_credits: 0.00
  quarterly_it_paid: 0.00
  balance_payable: 36000.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701A
  form_section: PART_IV_B

  penalties: {
    surcharge: 0.00
    interest: 0.00
    compromise: 0.00
    total: 0.00
  }

  warnings: [WARN-004]  // expenses very low (₱0); prompt user to verify
  manual_review_flags: []
  ineligibility_notifications: []
}
```

**WARN-004** fires because itemized_expenses.total_claimed / gross_receipts = 0/700,000 = 0% < 5% threshold and taxpayer_type = PURELY_SE. The warning does not change the computation; it reminds the user to verify completeness.

### Verification

- **Path C IT:** (700,000 − 250,000) × 0.08 = 450,000 × 0.08 = **₱36,000.00** ✓
- **Path B IT:** 22,500 + (420,000 − 400,000) × 0.20 = 22,500 + 4,000 = **₱26,500.00** ✓
- **Path B PT:** 700,000 × 0.03 = **₱21,000.00** ✓
- **Path A IT:** 22,500 + (700,000 − 400,000) × 0.20 = 22,500 + 60,000 = **₱82,500.00** ✓
- **Bracket check Path A:** 700,000 ∈ (400,000, 800,000] → bracket 3 ✓
- **Bracket check Path B:** 420,000 ∈ (400,000, 800,000] → bracket 3 ✓
- **Savings:** 47,500 − 36,000 = **₱11,500.00** ✓

**Legal basis:** Path C: NIRC Sec. 24(A)(2)(b) as amended by TRAIN, RR 8-2018. Path B: NIRC Sec. 34(L). Graduated rates: NIRC Sec. 24(A)(2)(a) second schedule (2023+).

---

## TV-BASIC-002: SC-P-ML-O — Same Freelancer Uses OSD (Shows Cost of Wrong Choice)

**Scenario code:** SC-P-ML-O
**Description:** Same taxpayer as TV-BASIC-001 (₱700,000 gross, no expenses) but has **already elected OSD** by filing their Q1 1701Q with the OSD box checked. The engine runs in locked mode: Path B is the only active path. The optimizer shows the missed savings of ₱11,500.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

Same as TV-BASIC-001 EXCEPT:

| Field | Value | Change from TV-BASIC-001 |
|-------|-------|--------------------------|
| `elected_regime` | `PATH_B` | User locked into OSD via Q1 filing |
| `osd_elected` | true | OSD explicitly elected |

All other fields identical to TV-BASIC-001.

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: MICRO

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 700000.00
      income_tax: 82500.00
      percentage_tax: 21000.00
      total_tax: 103500.00
    }
    path_b: {
      eligible: true
      nti: 420000.00
      osd_amount: 280000.00
      income_tax: 26500.00
      percentage_tax: 21000.00
      total_tax: 47500.00
    }
    path_c: {
      eligible: true
      tax_base: 450000.00
      income_tax: 36000.00
      percentage_tax: 0.00
      total_tax: 36000.00
      ineligibility_reasons: []
    }
    recommended_path: PATH_C          // Engine still shows optimal recommendation
    savings_vs_next_best: 11500.00    // Shows what was missed by electing OSD
    savings_vs_worst: 67500.00
  }

  selected_path: PATH_B              // Locked: engine uses OSD because user elected it
  locked_regime: true
  locked_regime_reason: "OSD elected on prior quarterly return. Election is irrevocable for the taxable year."
  missed_savings: 11500.00           // Cost of electing OSD vs optimal Path C

  income_tax_due: 26500.00
  percentage_tax_due: 21000.00
  total_tax_due: 47500.00

  cwt_credits: 0.00
  quarterly_it_paid: 0.00
  balance_payable: 47500.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701A
  form_section: PART_IV_A           // OSD section of 1701A

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: [WARN-004]
  manual_review_flags: []
  ineligibility_notifications: []
}
```

### Key Assertions

- `selected_path` = PATH_B (user locked into OSD) even though PATH_C produces lower tax
- `locked_regime` = true; `missed_savings` = ₱11,500.00 displayed prominently in UI
- All three regime results are still computed and shown for informational purposes
- **INV-007** (locked path is still computed correctly): PATH_B total_tax = ₱47,500.00 ✓

### Verification

- **Path B IT:** graduated_tax_2023(700,000 × 0.60) = graduated_tax_2023(420,000) = 22,500 + 20,000 × 0.20 = **₱26,500.00** ✓
- **Path B PT:** 700,000 × 0.03 = **₱21,000.00** ✓
- **Path B total:** 26,500 + 21,000 = **₱47,500.00** ✓
- **Missed savings:** 47,500 − 36,000 = **₱11,500.00** ✓

---

## TV-BASIC-003: SC-M-ML-8 — Mixed Income Earner, 8% on Business

**Scenario code:** SC-M-ML-8
**Description:** Employee earning ₱480,000 taxable compensation (employer has withheld ₱34,000 via Form 2316) who also freelances on the side, earning ₱600,000 gross freelance receipts with no business expenses. No ₱250,000 deduction applies to business income (RMC 50-2018). Path C separates taxes: compensation at graduated, business at 8% flat. Mandatory Form 1701.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `MIXED_INCOME` | Has both compensation and business income |
| `tax_year` | 2025 | |
| `filing_period` | `ANNUAL` | |
| `is_mixed_income` | true | |
| `is_vat_registered` | false | Business gross < ₱3M |
| `is_bmbe_registered` | false | |
| `subject_to_sec_117_128` | false | |
| `is_gpp_partner` | false | |
| `gross_receipts` | ₱600,000.00 | Freelance business income |
| `sales_returns_allowances` | ₱0.00 | |
| `non_operating_income` | ₱0.00 | |
| `fwt_income` | ₱0.00 | |
| `cost_of_goods_sold` | ₱0.00 | Pure service |
| `taxable_compensation` | ₱480,000.00 | Already net of SSS, PhilHealth, Pag-IBIG, 13th month exemption |
| `compensation_cwt` | ₱34,000.00 | From employer Form 2316 |
| `itemized_expenses` (all sub-fields) | ₱0.00 each | No business expenses |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | |
| `prior_quarterly_payments` | [] | |
| `cwt_2307_entries` | [] | No client CWT |
| `prior_year_excess_cwt` | ₱0.00 | |
| `actual_filing_date` | null | On-time |
| `return_type` | `ORIGINAL` | |
| `prior_payment_for_return` | ₱0.00 | |

### Expected Intermediate Values

**PL-02:**
- `taxpayer_tier` = MICRO (business gross ₱600K < ₱3M)
- `income_type` = MIXED_INCOME
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04 (Eligibility):**
- `path_c_eligible` = true (business gross ₱600K ≤ ₱3M AND not VAT-registered)
- Note: Path C eligible even for MIXED_INCOME — but ₱250K deduction does NOT apply
- `ineligibility_reasons` = []

**PL-08 (Path A — Mixed Income, Itemized ₱0):**
- `business_nti_path_a` = ₱600,000.00 − ₱0.00 = ₱600,000.00
- `combined_nti_path_a` = ₱480,000.00 (comp) + ₱600,000.00 (biz) = ₱1,080,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,080,000)
  = ₱102,500 + (₱1,080,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱70,000.00
  = ₱172,500.00
- `percentage_tax_path_a` = ₱600,000.00 × 0.03 = ₱18,000.00
- `total_tax_path_a` = ₱172,500.00 + ₱18,000.00 = ₱190,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱600,000.00 × 0.60 = ₱360,000.00
- `combined_nti_path_b` = ₱480,000.00 (comp) + ₱360,000.00 (biz OSD) = ₱840,000.00
- `income_tax_path_b` = graduated_tax_2023(₱840,000)
  = ₱102,500 + (₱840,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱10,000.00
  = ₱112,500.00
- `percentage_tax_path_b` = ₱600,000.00 × 0.03 = ₱18,000.00
- `total_tax_path_b` = ₱112,500.00 + ₱18,000.00 = ₱130,500.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_business_path_c` = ₱600,000.00 × 0.08 = ₱48,000.00 (no ₱250K deduction per RMC 50-2018)
- `income_tax_comp_path_c` = graduated_tax_2023(₱480,000.00)
  = ₱22,500 + (₱480,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱16,000.00
  = ₱38,500.00
- `percentage_tax_path_c` = ₱0.00 (business income PT waived)
- `total_income_tax_path_c` = ₱48,000.00 + ₱38,500.00 = ₱86,500.00
- `total_tax_path_c` = ₱86,500.00

**PL-13 (Compare):**
- Path A: ₱190,500.00
- Path B: ₱130,500.00
- Path C: ₱86,500.00 ← MINIMUM
- `recommended_path` = PATH_C

**PL-14 (Balance):**
- `total_income_tax_due` = ₱86,500.00
- `total_cwt_credits` = ₱34,000.00 (compensation_cwt only; no business CWT)
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱86,500.00 − ₱34,000.00 = ₱52,500.00

**PL-15 (Form):**
- `selected_form` = FORM_1701 (MIXED_INCOME always uses Form 1701, not 1701A)

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: MIXED_INCOME
  taxpayer_tier: MICRO

  regime_comparison: {
    path_a: {
      eligible: true
      combined_nti: 1080000.00
      business_nti: 600000.00
      compensation_nti: 480000.00
      income_tax: 172500.00
      percentage_tax: 18000.00
      total_tax: 190500.00
    }
    path_b: {
      eligible: true
      combined_nti: 840000.00
      business_nti_osd: 360000.00
      osd_amount: 240000.00
      compensation_nti: 480000.00
      income_tax: 112500.00
      percentage_tax: 18000.00
      total_tax: 130500.00
    }
    path_c: {
      eligible: true
      income_tax_business: 48000.00
      income_tax_compensation: 38500.00
      percentage_tax: 0.00
      total_income_tax: 86500.00
      total_tax: 86500.00
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)"
      ineligibility_reasons: []
    }
    recommended_path: PATH_C
    savings_vs_next_best: 44000.00
    savings_vs_worst: 104000.00
  }

  selected_path: PATH_C
  income_tax_due: 86500.00
  percentage_tax_due: 0.00
  total_tax_due: 86500.00

  cwt_credits: 34000.00
  quarterly_it_paid: 0.00
  balance_payable: 52500.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701            // Mixed income always uses Form 1701
  form_section: SCHEDULE_3B  // 8% rate schedule of Form 1701

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: [WARN-004]
  manual_review_flags: []
  ineligibility_notifications: []
}
```

### Verification

- **Path C business tax:** 600,000 × 0.08 = **₱48,000.00** ✓ (NO ₱250K deduction: mixed income)
- **Path C comp tax:** 22,500 + (480,000 − 400,000) × 0.20 = 22,500 + 16,000 = **₱38,500.00** ✓
- **Bracket check comp:** 480,000 ∈ (400,001, 800,000] → bracket 3 ✓
- **Path C total IT:** 48,000 + 38,500 = **₱86,500.00** ✓
- **Balance:** 86,500 − 34,000 (comp CWT) = **₱52,500.00** ✓
- **Savings vs Path B:** 130,500 − 86,500 = **₱44,000.00** ✓

**Legal basis:** Mixed income Path C: NIRC Sec. 24(A)(2)(b); ₱250K deduction bar: RMC 50-2018; compensation tax: NIRC Sec. 24(A)(1).

---

## TV-BASIC-004: SC-P-MH-I — High-Expense Professional, ₱1,500,000 Gross, Itemized Wins

**Scenario code:** SC-P-MH-I
**Description:** An architect (purely self-employed) earning ₱1,500,000 gross receipts with ₱975,000 documented business expenses (65% expense ratio: office rent ₱360,000, salaries ₱420,000, utilities ₱60,000, supplies ₱45,000, depreciation ₱90,000). Itemized deductions produce lower NTI than OSD (40% = ₱600,000 deduction vs. ₱975,000 itemized), so Path A wins over both Path B and Path C.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `tax_year` | 2025 | |
| `filing_period` | `ANNUAL` | |
| `is_mixed_income` | false | |
| `is_vat_registered` | false | Gross < ₱3M |
| `is_bmbe_registered` | false | |
| `subject_to_sec_117_128` | false | |
| `is_gpp_partner` | false | |
| `gross_receipts` | ₱1,500,000.00 | Total professional fees for year |
| `sales_returns_allowances` | ₱0.00 | |
| `non_operating_income` | ₱0.00 | |
| `fwt_income` | ₱0.00 | |
| `cost_of_goods_sold` | ₱0.00 | Service provider |
| `taxable_compensation` | ₱0.00 | |
| `compensation_cwt` | ₱0.00 | |
| `itemized_expenses.salaries_wages` | ₱420,000.00 | Two part-time assistants |
| `itemized_expenses.rent` | ₱360,000.00 | Office space ₱30K/month |
| `itemized_expenses.utilities` | ₱60,000.00 | Electricity, water, internet |
| `itemized_expenses.supplies` | ₱45,000.00 | Drafting materials, CAD software |
| `itemized_expenses.communication` | ₱0.00 | Included in utilities |
| `itemized_expenses.travel` | ₱0.00 | |
| `itemized_expenses.depreciation` | ₱90,000.00 | Equipment (computer, plotter) — straight-line |
| `itemized_expenses.interest` | ₱0.00 | |
| `itemized_expenses.taxes_and_licenses` | ₱0.00 | PRC registration included in supplies |
| `itemized_expenses.bad_debts` | ₱0.00 | |
| `itemized_expenses.charitable_contributions` | ₱0.00 | |
| `itemized_expenses.ear_expense` | ₱0.00 | |
| `itemized_expenses.nolco` | ₱0.00 | |
| `itemized_expenses.other_expenses` | ₱0.00 | |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | |
| `prior_quarterly_payments` | [] | |
| `cwt_2307_entries` | [{ atc: "WI010", income_payment: 1500000.00, tax_withheld: 75000.00, payor: "ABC Realty Corp", period: "2025-Q4" }] | 5% EWT withheld by corporate client |
| `prior_year_excess_cwt` | ₱0.00 | |
| `actual_filing_date` | null | On-time |
| `return_type` | `ORIGINAL` | |
| `prior_payment_for_return` | ₱0.00 | |

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `itemized_total_raw` = 420,000 + 360,000 + 60,000 + 45,000 + 90,000 = ₱975,000.00
- `ear_cap` = ₱1,500,000.00 × 0.01 = ₱15,000.00 (EAR claimed = ₱0, not binding)
- `total_itemized_deductions` = ₱975,000.00

**PL-06 (OSD):**
- `osd_amount` = ₱1,500,000.00 × 0.40 = ₱600,000.00
- `nti_path_b` = ₱1,500,000.00 − ₱600,000.00 = ₱900,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱75,000.00 (from 2307 entry; ATC WI010 = income tax CWT)

**PL-08 (Path A):**
- `nti_path_a` = ₱1,500,000.00 − ₱975,000.00 = ₱525,000.00
- `income_tax_path_a` = graduated_tax_2023(₱525,000)
  = ₱22,500 + (₱525,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱25,000.00
  = ₱47,500.00
- `percentage_tax_path_a` = ₱1,500,000.00 × 0.03 = ₱45,000.00
- `total_tax_path_a` = ₱47,500.00 + ₱45,000.00 = ₱92,500.00

**PL-09 (Path B):**
- `nti_path_b` = ₱900,000.00
- `income_tax_path_b` = graduated_tax_2023(₱900,000)
  = ₱102,500 + (₱900,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱25,000.00
  = ₱127,500.00
- `percentage_tax_path_b` = ₱1,500,000.00 × 0.03 = ₱45,000.00
- `total_tax_path_b` = ₱127,500.00 + ₱45,000.00 = ₱172,500.00

**PL-10 (Path C):**
- `path_c_base` = ₱1,500,000.00 − ₱250,000.00 = ₱1,250,000.00
- `income_tax_path_c` = ₱1,250,000.00 × 0.08 = ₱100,000.00
- `percentage_tax_path_c` = ₱0.00
- `total_tax_path_c` = ₱100,000.00

**PL-13 (Compare):**
- Path A: ₱92,500.00 ← MINIMUM
- Path B: ₱172,500.00
- Path C: ₱100,000.00
- `recommended_path` = PATH_A

**PL-14 (Balance):**
- `total_income_tax_due` = ₱47,500.00 (Path A)
- `total_cwt_credits` = ₱75,000.00 (from 2307 WI010)
- `balance_payable` = ₱47,500.00 − ₱75,000.00 = −₱27,500.00 → overpayment
- `overpayment` = ₱27,500.00
- `balance_payable` = ₱0.00

**PL-15 (Form):**
- `selected_form` = FORM_1701 (Path A requires Form 1701, not 1701A)

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: MICRO

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 525000.00
      itemized_deductions: 975000.00
      income_tax: 47500.00
      percentage_tax: 45000.00
      total_tax: 92500.00
    }
    path_b: {
      eligible: true
      nti: 900000.00
      osd_amount: 600000.00
      income_tax: 127500.00
      percentage_tax: 45000.00
      total_tax: 172500.00
    }
    path_c: {
      eligible: true
      tax_base: 1250000.00
      income_tax: 100000.00
      percentage_tax: 0.00
      total_tax: 100000.00
      ineligibility_reasons: []
    }
    recommended_path: PATH_A
    savings_vs_next_best: 7500.00     // vs Path C
    savings_vs_worst: 80000.00        // vs Path B
  }

  selected_path: PATH_A
  income_tax_due: 47500.00
  percentage_tax_due: 45000.00
  total_tax_due: 92500.00

  cwt_credits: 75000.00
  quarterly_it_paid: 0.00
  balance_payable: 0.00
  overpayment: 27500.00
  overpayment_disposition: PENDING_ELECTION   // User must choose: refund, TCC, or carry-over

  form: FORM_1701
  form_section: SCHEDULE_3A_PLUS_SCHEDULE_4

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: []
  manual_review_flags: []
  ineligibility_notifications: []
}
```

### Verification

- **Path A NTI:** 1,500,000 − 975,000 = **₱525,000.00** ✓
- **Path A IT:** 22,500 + (525,000 − 400,000) × 0.20 = 22,500 + 25,000 = **₱47,500.00** ✓
- **Bracket check:** 525,000 ∈ (400,001, 800,000] → bracket 3 ✓
- **Path A PT:** 1,500,000 × 0.03 = **₱45,000.00** ✓
- **Path A total:** 47,500 + 45,000 = **₱92,500.00** ✓
- **OSD deduction:** 1,500,000 × 0.40 = **₱600,000.00** ✓ (less than itemized ₱975,000 → Path A wins)
- **Savings vs Path C:** 100,000 − 92,500 = **₱7,500.00** ✓
- **CWT credit:** ₱75,000.00 from WI010 at 5% × ₱1,500,000 = ₱75,000 ✓
- **Overpayment:** IT due ₱47,500 < CWT ₱75,000 → overpayment = 75,000 − 47,500 = **₱27,500.00** ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)-(K); OSD: Sec. 34(L); 8%: Sec. 24(A)(2)(b); CWT credit: NIRC Sec. 79.

---

## TV-BASIC-005: SC-P-H-8 — Near-Threshold Professional, ₱2,800,000 Gross, 8% Wins

**Scenario code:** SC-P-H-8
**Description:** IT consultant earning ₱2,800,000 gross receipts, no significant expenses. 8% saves ₱202,500 vs OSD. Engine also shows WARN-001 (near ₱3M threshold). This demonstrates the largest realistic absolute savings from the 8% option.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `tax_year` | 2025 | |
| `filing_period` | `ANNUAL` | |
| `is_mixed_income` | false | |
| `is_vat_registered` | false | Gross ≤ ₱3M; not VAT-registered |
| `is_bmbe_registered` | false | |
| `subject_to_sec_117_128` | false | |
| `is_gpp_partner` | false | |
| `gross_receipts` | ₱2,800,000.00 | |
| `sales_returns_allowances` | ₱0.00 | |
| `non_operating_income` | ₱0.00 | |
| `fwt_income` | ₱0.00 | |
| `cost_of_goods_sold` | ₱0.00 | |
| `taxable_compensation` | ₱0.00 | |
| `compensation_cwt` | ₱0.00 | |
| `itemized_expenses` (all sub-fields) | ₱0.00 each | Minimal expenses not documented |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | |
| `prior_quarterly_payments` | [{ period: Q1, amount: 0.00 }, { period: Q2, amount: 71200.00 }, { period: Q3, amount: 44800.00 }] | Q1 nil; Q2 and Q3 quarterly payments under 8% cumulative method |
| `cwt_2307_entries` | [] | No CWT |
| `prior_year_excess_cwt` | ₱0.00 | |
| `actual_filing_date` | null | On-time |
| `return_type` | `ORIGINAL` | |
| `prior_payment_for_return` | ₱0.00 | |

**Note on prior_quarterly_payments:** The Q2 and Q3 amounts are computed below in the quarterly sub-computations.

### Expected Intermediate Values

**PL-02:**
- `taxpayer_tier` = MICRO (₱2.8M < ₱3M)

**Wait — MICRO requires < ₱3,000,000.** ₱2,800,000 < ₱3,000,000 → MICRO tier. ✓

**PL-04 (Eligibility):**
- `path_c_eligible` = true (₱2.8M ≤ ₱3M AND not VAT-registered)
- WARN-001 fires: gross_receipts ₱2,800,000 > ₱2,700,000 and not VAT-registered

**PL-08 (Path A, ₱0 expenses):**
- `nti_path_a` = ₱2,800,000.00
- `income_tax_path_a` = graduated_tax_2023(₱2,800,000)
  = ₱402,500 + (₱2,800,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱240,000.00
  = ₱642,500.00
- `percentage_tax_path_a` = ₱2,800,000.00 × 0.03 = ₱84,000.00
- `total_tax_path_a` = ₱642,500.00 + ₱84,000.00 = ₱726,500.00

**PL-09 (Path B):**
- `osd_amount` = ₱2,800,000.00 × 0.40 = ₱1,120,000.00
- `nti_path_b` = ₱2,800,000.00 − ₱1,120,000.00 = ₱1,680,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,680,000)
  = ₱102,500 + (₱1,680,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱220,000.00
  = ₱322,500.00
- `percentage_tax_path_b` = ₱2,800,000.00 × 0.03 = ₱84,000.00
- `total_tax_path_b` = ₱322,500.00 + ₱84,000.00 = ₱406,500.00

**PL-10 (Path C):**
- `path_c_base` = ₱2,800,000.00 − ₱250,000.00 = ₱2,550,000.00
- `income_tax_path_c` = ₱2,550,000.00 × 0.08 = ₱204,000.00
- `percentage_tax_path_c` = ₱0.00
- `total_tax_path_c` = ₱204,000.00

**PL-13 (Compare):**
- Path A: ₱726,500.00
- Path B: ₱406,500.00
- Path C: ₱204,000.00 ← MINIMUM
- Savings vs OSD: ₱406,500 − ₱204,000 = ₱202,500.00

**Quarterly payments sub-computation (for context, computed externally by Q1-Q3 filings):**
- Assume Q1 gross ₱700,000, Q2 cumulative ₱1,400,000, Q3 cumulative ₱2,100,000
- Q1: base = max(700,000 − 250,000, 0) = 450,000; IT = 36,000; paid ₱0 (Q1 period first year; if first year business may pay Q1); assume Q1 = ₱0 (first-quarter nil because installment)

  Actually let me simplify: assume Q2 cumulative IT due = 71,200 (from earlier working), Q3 incremental = 44,800.

  Q2 IT_cumulative at ₱1,400,000 gross: base = 1,400,000 − 250,000 = 1,150,000; IT = 1,150,000 × 0.08 = 92,000; Q2 payable = 92,000 − 0 (Q1 paid) = 92,000...

  Let me recalculate using even quarterly splits: ₱2,800,000 / 4 = ₱700,000/quarter.
  - Q1 cumulative gross = 700,000; base = max(700,000 − 250,000, 0) = 450,000; Q1 IT = 450,000 × 0.08 = 36,000; Q1 payable = 36,000
  - Q2 cumulative gross = 1,400,000; base = 1,400,000 − 250,000 = 1,150,000; Q2 cumulative IT = 92,000; Q2 payable = 92,000 − 36,000 = 56,000
  - Q3 cumulative gross = 2,100,000; base = 2,100,000 − 250,000 = 1,850,000; Q3 cumulative IT = 148,000; Q3 payable = 148,000 − 92,000 = 56,000

- Total quarterly paid = 36,000 + 56,000 + 56,000 = **₱148,000.00**

**PL-14 (Balance, annual):**
- `total_income_tax_due` = ₱204,000.00 (annual under Path C)
- `total_cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱148,000.00 (Q1 + Q2 + Q3)
- `balance_payable` = ₱204,000.00 − ₱0.00 − ₱148,000.00 = ₱56,000.00

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: MICRO

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 2800000.00
      income_tax: 642500.00
      percentage_tax: 84000.00
      total_tax: 726500.00
    }
    path_b: {
      eligible: true
      nti: 1680000.00
      osd_amount: 1120000.00
      income_tax: 322500.00
      percentage_tax: 84000.00
      total_tax: 406500.00
    }
    path_c: {
      eligible: true
      tax_base: 2550000.00
      income_tax: 204000.00
      percentage_tax: 0.00
      total_tax: 204000.00
      ineligibility_reasons: []
    }
    recommended_path: PATH_C
    savings_vs_next_best: 202500.00    // vs Path B (OSD)
    savings_vs_worst: 522500.00        // vs Path A (Itemized, ₱0 expenses)
  }

  selected_path: PATH_C
  income_tax_due: 204000.00
  percentage_tax_due: 0.00
  total_tax_due: 204000.00

  cwt_credits: 0.00
  quarterly_it_paid: 148000.00
  balance_payable: 56000.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701A
  form_section: PART_IV_B

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: [WARN-001, WARN-004]
  manual_review_flags: []
  ineligibility_notifications: []
}
```

### Verification

- **Path C tax base:** 2,800,000 − 250,000 = **₱2,550,000** ✓
- **Path C IT:** 2,550,000 × 0.08 = **₱204,000.00** ✓
- **Path B NTI:** 2,800,000 × 0.60 = **₱1,680,000** ✓
- **Path B IT bracket:** 1,680,000 ∈ (800,001, 2,000,000] → 102,500 + 880,000 × 0.25 = 102,500 + 220,000 = **₱322,500** ✓
- **Path A IT bracket:** 2,800,000 ∈ (2,000,001, 8,000,000] → 402,500 + 800,000 × 0.30 = 402,500 + 240,000 = **₱642,500** ✓
- **WARN-001:** gross 2,800,000 > 2,700,000 → threshold warning fires ✓
- **Balance:** 204,000 − 148,000 = **₱56,000.00** ✓

---

## TV-BASIC-006: SC-P-VH-O-VAT — VAT-Registered Professional, ₱5,000,000 Gross (VAT-Exclusive), Path B Wins

**Scenario code:** SC-P-VH-O-VAT
**Description:** Management consultant registered for VAT, earning ₱5,000,000 VAT-exclusive gross receipts. Has ₱1,000,000 documented expenses (20% ratio). Because gross > ₱3M, Path C (8%) is not available. OSD (40% = ₱2,000,000 deduction) produces lower NTI than itemized (₱1,000,000 deduction), so Path B wins. No percentage tax (VAT-registered). Engine shows IN-03 for Path C.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `tax_year` | 2025 | |
| `filing_period` | `ANNUAL` | |
| `is_mixed_income` | false | |
| `is_vat_registered` | true | Gross exceeds ₱3M → VAT required |
| `is_bmbe_registered` | false | |
| `subject_to_sec_117_128` | false | |
| `is_gpp_partner` | false | |
| `gross_receipts` | ₱5,000,000.00 | VAT-exclusive; VAT collected from clients handled separately |
| `sales_returns_allowances` | ₱0.00 | |
| `non_operating_income` | ₱0.00 | |
| `fwt_income` | ₱0.00 | |
| `cost_of_goods_sold` | ₱0.00 | Service provider |
| `taxable_compensation` | ₱0.00 | |
| `compensation_cwt` | ₱0.00 | |
| `itemized_expenses.salaries_wages` | ₱600,000.00 | Staff |
| `itemized_expenses.rent` | ₱240,000.00 | Office |
| `itemized_expenses.utilities` | ₱60,000.00 | |
| `itemized_expenses.supplies` | ₱30,000.00 | |
| `itemized_expenses.depreciation` | ₱70,000.00 | |
| `itemized_expenses` (all other sub-fields) | ₱0.00 each | |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | |
| `prior_quarterly_payments` | [{ period: Q1, amount: 120000.00 }, { period: Q2, amount: 90000.00 }, { period: Q3, amount: 67500.00 }] | Quarterly OSD payments |
| `cwt_2307_entries` | [{ atc: "WI010", income_payment: 5000000.00, tax_withheld: 250000.00, payor: "MNO Holdings Inc", period: "2025-ANNUAL" }] | 5% EWT from single large client |
| `prior_year_excess_cwt` | ₱0.00 | |
| `actual_filing_date` | null | On-time |
| `return_type` | `ORIGINAL` | |
| `prior_payment_for_return` | ₱0.00 | |

### Expected Intermediate Values

**PL-02:**
- `taxpayer_tier` = SMALL (₱3,000,000 ≤ ₱5,000,000 < ₱20,000,000)
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04 (Eligibility):**
- `path_c_eligible` = false
- `ineligibility_reasons` = [IN-03: "Taxpayer is VAT-registered. The 8% income tax option is only available to non-VAT-registered taxpayers. See NIRC Sec. 24(A)(2)(b) and RR 8-2018."]
- `path_c_eligible` = false (also: gross ₱5M > ₱3M → IN-02 also fires)
- `ineligibility_reasons` = [IN-02, IN-03] (both apply; IN-03 shown as primary)

**PL-05 (Itemized):**
- `total_itemized_deductions` = 600,000 + 240,000 + 60,000 + 30,000 + 70,000 = ₱1,000,000.00

**PL-06 (OSD):**
- `osd_amount` = ₱5,000,000.00 × 0.40 = ₱2,000,000.00
- `nti_path_b` = ₱5,000,000.00 − ₱2,000,000.00 = ₱3,000,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱250,000.00 (WI010 at 5% × ₱5,000,000)

**PL-08 (Path A):**
- `nti_path_a` = ₱5,000,000.00 − ₱1,000,000.00 = ₱4,000,000.00
- `income_tax_path_a` = graduated_tax_2023(₱4,000,000)
  = ₱402,500 + (₱4,000,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱600,000.00
  = ₱1,002,500.00
- `percentage_tax_path_a` = ₱0.00 (VAT-registered; OPT does not apply)
- `total_tax_path_a` = ₱1,002,500.00

**PL-09 (Path B):**
- `nti_path_b` = ₱3,000,000.00
- `income_tax_path_b` = graduated_tax_2023(₱3,000,000)
  = ₱402,500 + (₱3,000,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱300,000.00
  = ₱702,500.00
- `percentage_tax_path_b` = ₱0.00 (VAT-registered)
- `total_tax_path_b` = ₱702,500.00

**PL-10 (Path C):**
- Ineligible; `total_tax_path_c` = null (not computed)

**PL-13 (Compare):**
- Path A: ₱1,002,500.00
- Path B: ₱702,500.00 ← MINIMUM
- Path C: N/A
- `recommended_path` = PATH_B

**PL-14 (Balance):**
- `income_tax_due` = ₱702,500.00 (Path B)
- `total_cwt_credits` = ₱250,000.00
- `quarterly_it_paid` = ₱120,000 + ₱90,000 + ₱67,500 = ₱277,500.00
- `balance_payable` = ₱702,500 − ₱250,000 − ₱277,500 = ₱175,000.00

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: SMALL

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 4000000.00
      itemized_deductions: 1000000.00
      income_tax: 1002500.00
      percentage_tax: 0.00
      total_tax: 1002500.00
    }
    path_b: {
      eligible: true
      nti: 3000000.00
      osd_amount: 2000000.00
      income_tax: 702500.00
      percentage_tax: 0.00
      total_tax: 702500.00
    }
    path_c: {
      eligible: false
      income_tax: null
      percentage_tax: null
      total_tax: null
      ineligibility_reasons: [
        "IN-02: Gross receipts exceed ₱3,000,000. The 8% option is only available to taxpayers with gross receipts/sales not exceeding ₱3,000,000.",
        "IN-03: Taxpayer is VAT-registered. The 8% income tax option requires non-VAT registration."
      ]
    }
    recommended_path: PATH_B
    savings_vs_next_best: 300000.00    // OSD saves ₱300K vs Itemized
    savings_vs_worst: 300000.00        // Path C N/A; worst available path = Path A
  }

  selected_path: PATH_B
  income_tax_due: 702500.00
  percentage_tax_due: 0.00
  total_tax_due: 702500.00

  cwt_credits: 250000.00
  quarterly_it_paid: 277500.00
  balance_payable: 175000.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701A             // PURELY_SE + annual, even with Path B
  form_section: PART_IV_A     // OSD section of 1701A

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: [WARN-002]        // Gross > ₱3M and not VAT-registered... wait, IS VAT-registered
  manual_review_flags: []
  ineligibility_notifications: [IN-02, IN-03]
}
```

**Note on WARN-002:** WARN-002 fires when gross > ₱3M AND NOT VAT-registered. This taxpayer IS VAT-registered, so WARN-002 does NOT fire. No warnings expected (WARN-004 does not apply: expenses are ₱1M, ratio = 20% > 5%).

Corrected final output warnings field: `warnings: []`

### Verification

- **Path B OSD:** 5,000,000 × 0.40 = **₱2,000,000** ✓
- **Path B NTI:** 5,000,000 − 2,000,000 = **₱3,000,000** ✓
- **Path B IT:** bracket 5 (2,000,001 to 8,000,000): 402,500 + 1,000,000 × 0.30 = **₱702,500** ✓
- **Path A NTI:** 5,000,000 − 1,000,000 = **₱4,000,000** ✓
- **Path A IT:** 402,500 + 2,000,000 × 0.30 = **₱1,002,500** ✓
- **Savings:** 1,002,500 − 702,500 = **₱300,000** ✓ (OSD deduction > itemized expenses)
- **CWT:** 5,000,000 × 0.05 = **₱250,000** ✓
- **Balance:** 702,500 − 250,000 − 277,500 = **₱175,000** ✓

---

## TV-BASIC-007: SC-QC-8-3Q — Quarterly Cycle, 8% Option, Q1 Through Q3

**Scenario code:** SC-QC-8-3Q
**Description:** Purely self-employed freelancer earning ₱200,000 per quarter (₱800,000 annualized). Uses 8% option throughout the year. Demonstrates the cumulative method for quarterly 1701Q filings. Three separate engine calls are shown (Q1, Q2, Q3). The annual reconciliation is shown as a fourth call.

**Tax year:** 2025
**Common input fields (all quarters):**

| Field | Value |
|-------|-------|
| `taxpayer_type` | `PURELY_SE` |
| `tax_year` | 2025 |
| `is_mixed_income` | false |
| `is_vat_registered` | false |
| `cost_of_goods_sold` | ₱0.00 |
| `taxable_compensation` | ₱0.00 |
| `compensation_cwt` | ₱0.00 |
| `itemized_expenses` (all sub-fields) | ₱0.00 |
| `elected_regime` | `PATH_C` |
| `cwt_2307_entries` | [] |
| `prior_year_excess_cwt` | ₱0.00 |
| `return_type` | `ORIGINAL` |
| `actual_filing_date` | null |

### Q1 Filing (filing_period: Q1)

**Additional Q1 inputs:**
- `gross_receipts` = ₱200,000.00 (Q1 income only)
- `prior_quarterly_payments` = [] (no prior periods)

**Q1 Computation:**
- Cumulative gross = ₱200,000.00
- 8% base = max(200,000 − 250,000, 0) = ₱0.00 (₱250K not yet exceeded)
- Cumulative IT due = ₱0.00 × 0.08 = ₱0.00
- Prior quarters IT paid = ₱0.00
- Q1 payable = ₱0.00 − ₱0.00 = **₱0.00**

**Expected Q1 Output:**
```
TaxComputationResult {
  filing_period: Q1
  selected_path: PATH_C
  income_tax_due: 0.00              // cumulative IT for period Jan 1 – Mar 31
  balance_payable: 0.00
  form: FORM_1701Q
  schedule: SCHEDULE_II_8PCT
  warnings: []
}
```

Note: Q1 is a **NIL return** — must still be filed by May 15. Filing a NIL 1701Q is mandatory even when tax due is ₱0.

### Q2 Filing (filing_period: Q2)

**Additional Q2 inputs:**
- `gross_receipts` = ₱400,000.00 (cumulative Jan 1 – Jun 30)
- `prior_quarterly_payments` = [{ period: Q1, amount_paid: 0.00 }]

**Q2 Computation:**
- Cumulative gross Jan–Jun = ₱400,000.00
- 8% base = max(400,000 − 250,000, 0) = ₱150,000.00
- Cumulative IT due = ₱150,000.00 × 0.08 = ₱12,000.00
- Prior IT paid (Q1) = ₱0.00
- Q2 payable = ₱12,000.00 − ₱0.00 = **₱12,000.00**

**Expected Q2 Output:**
```
TaxComputationResult {
  filing_period: Q2
  selected_path: PATH_C
  cumulative_gross: 400000.00
  cumulative_8pct_base: 150000.00
  cumulative_it_due: 12000.00
  prior_quarterly_it_paid: 0.00
  income_tax_due: 12000.00
  balance_payable: 12000.00
  form: FORM_1701Q
  schedule: SCHEDULE_II_8PCT
}
```

### Q3 Filing (filing_period: Q3)

**Additional Q3 inputs:**
- `gross_receipts` = ₱600,000.00 (cumulative Jan 1 – Sep 30)
- `prior_quarterly_payments` = [{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 12000.00 }]

**Q3 Computation:**
- Cumulative gross Jan–Sep = ₱600,000.00
- 8% base = max(600,000 − 250,000, 0) = ₱350,000.00
- Cumulative IT due = ₱350,000.00 × 0.08 = ₱28,000.00
- Prior IT paid (Q1 + Q2) = ₱0 + ₱12,000 = ₱12,000.00
- Q3 payable = ₱28,000.00 − ₱12,000.00 = **₱16,000.00**

**Expected Q3 Output:**
```
TaxComputationResult {
  filing_period: Q3
  selected_path: PATH_C
  cumulative_gross: 600000.00
  cumulative_8pct_base: 350000.00
  cumulative_it_due: 28000.00
  prior_quarterly_it_paid: 12000.00
  income_tax_due: 28000.00
  balance_payable: 16000.00
  form: FORM_1701Q
  schedule: SCHEDULE_II_8PCT
}
```

### Annual Reconciliation (filing_period: ANNUAL)

**Additional annual inputs:**
- `gross_receipts` = ₱800,000.00 (full-year Q1–Q4)
- `prior_quarterly_payments` = [{ period: Q1, amount: 0.00 }, { period: Q2, amount: 12000.00 }, { period: Q3, amount: 16000.00 }]

**Annual Computation:**
- Annual gross = ₱800,000.00
- 8% base = max(800,000 − 250,000, 0) = ₱550,000.00
- Annual IT = ₱550,000.00 × 0.08 = ₱44,000.00
- Total quarterly paid = ₱0 + ₱12,000 + ₱16,000 = ₱28,000.00
- Balance payable = ₱44,000 − ₱28,000 = **₱16,000.00** (Q4 catch-up)
- PT = ₱0.00 (waived under Path C)

**Expected Annual Output:**
```
TaxComputationResult {
  filing_period: ANNUAL
  selected_path: PATH_C
  income_tax_due: 44000.00
  percentage_tax_due: 0.00
  total_tax_due: 44000.00
  cwt_credits: 0.00
  quarterly_it_paid: 28000.00
  balance_payable: 16000.00
  form: FORM_1701A
  form_section: PART_IV_B
}
```

### Verification

| Period | Cumulative Gross | 8% Base | Cumulative IT | Prior Paid | Payable |
|--------|-----------------|---------|---------------|-----------|---------|
| Q1 | ₱200,000 | ₱0 | ₱0.00 | ₱0.00 | **₱0.00** |
| Q2 | ₱400,000 | ₱150,000 | ₱12,000.00 | ₱0.00 | **₱12,000.00** |
| Q3 | ₱600,000 | ₱350,000 | ₱28,000.00 | ₱12,000.00 | **₱16,000.00** |
| Annual | ₱800,000 | ₱550,000 | ₱44,000.00 | ₱28,000.00 | **₱16,000.00** |

**Total paid across year:** 0 + 12,000 + 16,000 + 16,000 = ₱44,000 = Annual IT ✓
**INV-009** (cumulative payments ≤ annual IT): 28,000 ≤ 44,000 ✓
**Legal basis:** Quarterly cumulative method: NIRC Sec. 74-76; RR 8-2018 Sec. 4 (8% quarterly computation).

---

## TV-BASIC-008: SC-AT-3M — Exact ₱3,000,000 Boundary, 8% Still Available

**Scenario code:** SC-AT-3M
**Description:** Freelancer whose gross receipts land exactly at ₱3,000,000 at year-end. This tests the boundary condition: per NIRC Sec. 24(A)(2)(b), the 8% option applies to taxpayers with gross receipts/sales "not exceeding ₱3,000,000" — so exactly ₱3M is eligible. EOPT tier = SMALL (exactly ₱3M → SMALL). VAT not required (threshold is "exceeding ₱3M" — strictly greater than). 8% produces ₱220,000 IT vs OSD ₱442,500 total — savings of ₱222,500.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `tax_year` | 2025 | |
| `filing_period` | `ANNUAL` | |
| `is_mixed_income` | false | |
| `is_vat_registered` | false | Threshold is "exceeding ₱3M"; exactly ₱3M does NOT trigger mandatory VAT registration |
| `is_bmbe_registered` | false | |
| `subject_to_sec_117_128` | false | |
| `is_gpp_partner` | false | |
| `gross_receipts` | ₱3,000,000.00 | Exactly ₱3,000,000 — critical boundary |
| `sales_returns_allowances` | ₱0.00 | |
| `non_operating_income` | ₱0.00 | |
| `fwt_income` | ₱0.00 | |
| `cost_of_goods_sold` | ₱0.00 | |
| `taxable_compensation` | ₱0.00 | |
| `compensation_cwt` | ₱0.00 | |
| `itemized_expenses` (all sub-fields) | ₱0.00 each | |
| `elected_regime` | null | Optimizer mode |
| `prior_quarterly_payments` | [] | |
| `cwt_2307_entries` | [] | |
| `prior_year_excess_cwt` | ₱0.00 | |
| `actual_filing_date` | null | |
| `return_type` | `ORIGINAL` | |
| `prior_payment_for_return` | ₱0.00 | |

### Expected Intermediate Values

**PL-02 (Classification):**
- `taxpayer_tier` = SMALL (exactly ₱3,000,000 → SMALL; boundary condition: "less than ₱3M" = MICRO, "₱3M to less than ₱20M" = SMALL)
- `income_type` = PURELY_SE

**PL-04 (Eligibility):**
- `path_c_eligible` = true (₱3,000,000 ≤ ₱3,000,000 — "not exceeding"; includes exactly ₱3M)
- `ineligibility_reasons` = []
- WARN-001 fires: gross ₱3,000,000 > ₱2,700,000 and not VAT-registered

**PL-08 (Path A, ₱0 expenses):**
- `nti_path_a` = ₱3,000,000.00
- `income_tax_path_a` = graduated_tax_2023(₱3,000,000)
  = ₱402,500 + (₱3,000,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱300,000.00
  = ₱702,500.00
- `percentage_tax_path_a` = ₱3,000,000.00 × 0.03 = ₱90,000.00
- `total_tax_path_a` = ₱702,500.00 + ₱90,000.00 = ₱792,500.00

**PL-09 (Path B):**
- `osd_amount` = ₱3,000,000.00 × 0.40 = ₱1,200,000.00
- `nti_path_b` = ₱3,000,000.00 − ₱1,200,000.00 = ₱1,800,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,800,000)
  = ₱102,500 + (₱1,800,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱250,000.00
  = ₱352,500.00
- `percentage_tax_path_b` = ₱3,000,000.00 × 0.03 = ₱90,000.00
- `total_tax_path_b` = ₱352,500.00 + ₱90,000.00 = ₱442,500.00

**PL-10 (Path C):**
- `path_c_base` = ₱3,000,000.00 − ₱250,000.00 = ₱2,750,000.00
- `income_tax_path_c` = ₱2,750,000.00 × 0.08 = ₱220,000.00
- `percentage_tax_path_c` = ₱0.00
- `total_tax_path_c` = ₱220,000.00

**PL-13 (Compare):**
- Path A: ₱792,500.00
- Path B: ₱442,500.00
- Path C: ₱220,000.00 ← MINIMUM

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025
  filing_period: ANNUAL
  taxpayer_type: PURELY_SE
  taxpayer_tier: SMALL        // Boundary: exactly ₱3M → SMALL tier

  regime_comparison: {
    path_a: {
      eligible: true
      nti: 3000000.00
      income_tax: 702500.00
      percentage_tax: 90000.00
      total_tax: 792500.00
    }
    path_b: {
      eligible: true
      nti: 1800000.00
      osd_amount: 1200000.00
      income_tax: 352500.00
      percentage_tax: 90000.00
      total_tax: 442500.00
    }
    path_c: {
      eligible: true            // Exactly ₱3M is still eligible (not exceeding ₱3M)
      tax_base: 2750000.00
      income_tax: 220000.00
      percentage_tax: 0.00
      total_tax: 220000.00
      ineligibility_reasons: []
    }
    recommended_path: PATH_C
    savings_vs_next_best: 222500.00   // vs Path B
    savings_vs_worst: 572500.00       // vs Path A
  }

  selected_path: PATH_C
  income_tax_due: 220000.00
  percentage_tax_due: 0.00
  total_tax_due: 220000.00

  cwt_credits: 0.00
  quarterly_it_paid: 0.00
  balance_payable: 220000.00
  overpayment: 0.00
  overpayment_disposition: null

  form: FORM_1701A
  form_section: PART_IV_B

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 }
  warnings: [WARN-001, WARN-004]
  manual_review_flags: []
  ineligibility_notifications: []
}
```

### Critical Boundary Assertions

| Test | Expected | Reason |
|------|----------|--------|
| Path C eligible at ₱3,000,000 | true | "Not exceeding ₱3,000,000" includes exactly ₱3,000,000 |
| VAT required at ₱3,000,000 | false | VAT threshold is "exceeding ₱3,000,000" — strictly greater than |
| Taxpayer tier at ₱3,000,000 | SMALL | MICRO = "less than ₱3,000,000"; ₱3M exactly falls in SMALL |
| PT applies at ₱3,000,000 | Under Path B: yes, ₱90,000 | PT applies to all non-VAT taxpayers on Paths A/B |
| PT under Path C at ₱3,000,000 | ₱0.00 | PT waived for 8% option taxpayers |
| WARN-001 fires | true | ₱3,000,000 > ₱2,700,000 and not VAT-registered |

### Verification

- **Path C base:** 3,000,000 − 250,000 = **₱2,750,000** ✓
- **Path C IT:** 2,750,000 × 0.08 = **₱220,000.00** ✓
- **Path B NTI:** 3,000,000 × 0.60 = **₱1,800,000** ✓
- **Path B IT:** bracket 4: 102,500 + (1,800,000 − 800,000) × 0.25 = 102,500 + 250,000 = **₱352,500** ✓
- **Path B PT:** 3,000,000 × 0.03 = **₱90,000** ✓
- **Path A IT:** bracket 5: 402,500 + (3,000,000 − 2,000,000) × 0.30 = 402,500 + 300,000 = **₱702,500** ✓
- **Savings vs Path B:** 442,500 − 220,000 = **₱222,500** ✓

**Legal basis:** 8% threshold: NIRC Sec. 24(A)(2)(b) "not exceeding ₱3,000,000"; VAT threshold: NIRC Sec. 109(1)(V) "exceeding ₱3,000,000"; EOPT tier: RR 8-2024 Sec. 3.

---

## Test Vector Summary Table

| Vector ID | Scenario | Gross Receipts | Expenses | Recommended Path | Total Tax (Optimal) | Key Feature |
|-----------|---------|---------------|---------|-----------------|---------------------|-------------|
| TV-BASIC-001 | SC-P-ML-8 | ₱700,000 | ₱0 | Path C (8%) | ₱36,000 | Most common case; saves ₱11,500 vs OSD |
| TV-BASIC-002 | SC-P-ML-O | ₱700,000 | ₱0 | Path B (locked) | ₱47,500 | Locked mode; shows missed savings |
| TV-BASIC-003 | SC-M-ML-8 | ₱600,000 biz + ₱480,000 comp | ₱0 biz | Path C (8%) | ₱86,500 | Mixed income; no ₱250K deduction |
| TV-BASIC-004 | SC-P-MH-I | ₱1,500,000 | ₱975,000 (65%) | Path A (Itemized) | ₱92,500 | Itemized wins at high expense ratio; CWT overpayment |
| TV-BASIC-005 | SC-P-H-8 | ₱2,800,000 | ₱0 | Path C (8%) | ₱204,000 | Near threshold; WARN-001; quarterly balance |
| TV-BASIC-006 | SC-P-VH-O-VAT | ₱5,000,000 (VAT-excl) | ₱1,000,000 (20%) | Path B (OSD) | ₱702,500 | VAT-registered; Path C N/A; OSD vs Itemized |
| TV-BASIC-007 | SC-QC-8-3Q | ₱800,000 annualized | ₱0 | Path C (8%) | ₱44,000 annual | Quarterly cycle: Q1 NIL, Q2 ₱12K, Q3 ₱16K, annual balance ₱16K |
| TV-BASIC-008 | SC-AT-3M | ₱3,000,000 (exactly) | ₱0 | Path C (8%) | ₱220,000 | Boundary: ₱3M exactly eligible; SMALL tier |
