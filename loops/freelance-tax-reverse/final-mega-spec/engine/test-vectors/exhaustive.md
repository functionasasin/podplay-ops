# Exhaustive Test Vectors — Philippine Freelance Tax Optimizer

**Status:** PARTIAL — Groups 1–11 complete (59 vectors + 7 cross-references). Groups 12–14 pending.
**Last updated:** 2026-03-02
**Cross-references:**
- Scenario codes: [domain/scenarios.md](../../domain/scenarios.md)
- Computation rules: [domain/computation-rules.md](../../domain/computation-rules.md)
- Data model: [engine/data-model.md](../data-model.md)
- Pipeline: [engine/pipeline.md](../pipeline.md)
- Graduated rate table: CR-002 in computation-rules.md

**Purpose:** One test vector per scenario code. Every scenario code in scenarios.md must have a corresponding vector here before convergence. Basic happy-path vectors (SC-P-ML-8, SC-P-ML-O, SC-M-ML-8, SC-P-MH-I, SC-P-H-8, SC-P-VH-O-VAT, SC-CROSS-3M, SC-QC-8-3Q) are in [basic.md](basic.md). Edge case vectors (SC-AT-3M, SC-BE-OSD-WINS, SC-BE-OSD-8-LO, SC-BE-8-ITEMIZED-500K, SC-BELOW-250K, SC-CROSS-3M, SC-M-MINWAGE, SC-LATE-1701, SC-FIRST-MID-Q2, SC-QC-OVERPY-Q3, SC-PLAT-UPWORK-8, SC-B-ML-O, TV-EDGE-013 through TV-EDGE-016) are in [edge-cases.md](edge-cases.md).

## Monetary conventions

- All amounts in Philippine Pesos (₱)
- Rates expressed as decimals (0.08 = 8%)
- All amounts computed at full precision; final figures rounded to nearest centavo
- BIR form display fields: floor to whole peso (engine retains centavos)

## Graduated Tax Function (CR-002, 2023+ schedule)

```
graduated_tax_2023(N):
  if N <= 250_000:       return 0
  elif N <= 400_000:     return (N - 250_000) × 0.15
  elif N <= 800_000:     return 22_500 + (N - 400_000) × 0.20
  elif N <= 2_000_000:   return 102_500 + (N - 800_000) × 0.25
  elif N <= 8_000_000:   return 402_500 + (N - 2_000_000) × 0.30
  else:                  return 2_202_500 + (N - 8_000_000) × 0.35
```

---

## GROUP 1: Pure Service/Professional — Below ₱3M Threshold (8% Eligible)

**12 scenario codes:** SC-P-L-8, SC-P-L-O, SC-P-L-I, SC-P-ML-8, SC-P-ML-O, SC-P-ML-I, SC-P-MH-8, SC-P-MH-O, SC-P-MH-I, SC-P-H-8, SC-P-H-O, SC-P-H-I

**Common characteristics for all Group 1 vectors:**
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_vat_registered`: false
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `cost_of_goods_sold`: ₱0.00
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): PURELY_SE
- `taxpayer_tier` (derived): MICRO (gross receipts < ₱3,000,000)
- `path_c_eligible` (derived): true
- `prior_quarterly_payments`: []
- `cwt_2307_entries`: []
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `return_type`: ORIGINAL
- `prior_payment_for_return`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `elected_regime`: null (optimizer mode — engine recommends)
- `filing_period`: ANNUAL
- `tax_year`: 2025

---

## TV-EX-G1-001: SC-P-L-8 — Low-Income Freelancer, 8% Optimal

**Scenario code:** SC-P-L-8
**Description:** Virtual assistant with ₱300,000 annual gross receipts, no significant business expenses, no withholding clients. Demonstrates 8% option saving ₱5,000 vs OSD and ₱12,500 vs itemized for a taxpayer in the low-income range. This is the most common situation for entry-level freelancers in the Philippines.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱300,000.00 | Total VA income for 2025 |
| `itemized_expenses.supplies` | ₱0.00 | No receipts kept |
| `itemized_expenses.communication` | ₱0.00 | |
| `itemized_expenses.taxes_and_licenses` | ₱0.00 | |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱0.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱300,000.00; taxpayer_tier = MICRO; income_type = PURELY_SE; taxpayer_class = SERVICE_PROVIDER

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** total_itemized_deductions = ₱0.00; ear_cap = ₱3,000.00 (1% × ₱300,000); NOLCO applied = ₱0.00

**PL-06:** osd_amount = ₱300,000 × 0.40 = ₱120,000.00; nti_path_b = ₱180,000.00

**PL-07:** total_cwt = ₱0.00

**PL-08 (Path A):** nti_path_a = ₱300,000.00; income_tax = graduated_tax_2023(300,000) = (300,000 − 250,000) × 0.15 = ₱7,500.00; pt = ₱300,000 × 0.03 = ₱9,000.00; total_path_a = ₱16,500.00

**PL-09 (Path B):** nti_path_b = ₱180,000.00; income_tax = graduated_tax_2023(180,000) = ₱0.00 (below ₱250K threshold); pt = ₱9,000.00; total_path_b = ₱9,000.00

**PL-10 (Path C):** path_c_base = max(300,000 − 250,000, 0) = ₱50,000.00; income_tax = ₱50,000 × 0.08 = ₱4,000.00; pt = ₱0.00 (waived); total_path_c = ₱4,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱9,000 − ₱4,000 = ₱5,000.00; savings_vs_worst = ₱16,500 − ₱4,000 = ₱12,500.00

**PL-14:** balance_payable = ₱4,000.00 − ₱0.00 (CWT) − ₱0.00 (quarterly) = ₱4,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B (8% rate section)

**PL-16:** total_penalties = ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 300000.00, income_tax: 7500.00,
              percentage_tax: 9000.00, total_tax: 16500.00 },
    path_b: { eligible: true, nti: 180000.00, osd_amount: 120000.00,
              income_tax: 0.00, percentage_tax: 9000.00, total_tax: 9000.00 },
    path_c: { eligible: true, tax_base: 50000.00, income_tax: 4000.00,
              percentage_tax: 0.00, total_tax: 4000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 5000.00,
    savings_vs_worst: 12500.00
  },

  selected_path: PATH_C,
  income_tax_due: 4000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 4000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 4000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0 / 300,000 = 0% < 5% threshold for PURELY_SE.

### Verification

- Path C base: max(300,000 − 250,000, 0) = 50,000; IT = 50,000 × 0.08 = **₱4,000.00** ✓
- Path B NTI: 300,000 × 0.60 = 180,000 < 250,000 → IT = **₱0.00** ✓; PT = 300,000 × 0.03 = **₱9,000.00** ✓
- Path A IT: (300,000 − 250,000) × 0.15 = **₱7,500.00** ✓; bracket 2 ✓
- Savings: 9,000 − 4,000 = **₱5,000.00** ✓

**Legal basis:** Path C: NIRC Sec. 24(A)(2)(b) as amended by TRAIN (RA 10963). PT waiver: RR 8-2018 Sec. 2(B). OSD: NIRC Sec. 34(L). Graduated rates: CR-002 (2023+ schedule).

---

## TV-EX-G1-002: SC-P-L-O — OSD Optimal in ₱400K–₱437.5K Window

**Scenario code:** SC-P-L-O
**Description:** Content writer with ₱420,000 gross receipts, no expenses. Demonstrates the narrow ₱400,001–₱437,499 gross receipts window where OSD (Path B) produces lower total tax than 8% (Path C). This counterintuitive result occurs because the OSD-reduced NTI (₱252,000) falls just above the ₱250,000 zero-tax threshold, yielding only ₱300 income tax, while the 3% PT on ₱420,000 (₱12,600) produces a combined Path B total of ₱12,900 — less than Path C's ₱13,600. The engine correctly recommends Path B here.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱420,000.00 | Mid-point of OSD-wins window |
| All itemized expense fields | ₱0.00 | No expenses |

**Total itemized expenses:** ₱0.00

### Expected Intermediate Values

**PL-06:** osd_amount = ₱420,000 × 0.40 = ₱168,000.00; nti_path_b = ₱420,000 − ₱168,000 = ₱252,000.00

**PL-08 (Path A):** nti_path_a = ₱420,000.00; income_tax = 22,500 + (420,000 − 400,000) × 0.20 = 22,500 + 4,000 = ₱26,500.00; pt = ₱420,000 × 0.03 = ₱12,600.00; total_path_a = ₱39,100.00

**PL-09 (Path B):** nti_path_b = ₱252,000.00; income_tax = (252,000 − 250,000) × 0.15 = ₱300.00; pt = ₱12,600.00; total_path_b = ₱12,900.00

**PL-10 (Path C):** path_c_base = 420,000 − 250,000 = ₱170,000.00; income_tax = 170,000 × 0.08 = ₱13,600.00; pt = ₱0.00; total_path_c = ₱13,600.00

**PL-13:** recommended_path = PATH_B; savings_vs_next_best = ₱13,600 − ₱12,900 = ₱700.00; savings_vs_worst = ₱39,100 − ₱12,900 = ₱26,200.00

**PL-14:** balance_payable = ₱12,900.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (graduated + OSD)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 420000.00, income_tax: 26500.00,
              percentage_tax: 12600.00, total_tax: 39100.00 },
    path_b: { eligible: true, nti: 252000.00, osd_amount: 168000.00,
              income_tax: 300.00, percentage_tax: 12600.00, total_tax: 12900.00 },
    path_c: { eligible: true, tax_base: 170000.00, income_tax: 13600.00,
              percentage_tax: 0.00, total_tax: 13600.00, ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 700.00,
    savings_vs_worst: 26200.00
  },

  selected_path: PATH_B,
  income_tax_due: 300.00,
  percentage_tax_due: 12600.00,
  total_tax_due: 12900.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 12900.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003, WARN-004],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-003** fires: no CWT entered AND recommended path is PATH_B (not 8%). **WARN-004** fires: expenses = ₱0.

### Verification

- Path B NTI: 420,000 × 0.60 = 252,000; IT = (252,000 − 250,000) × 0.15 = **₱300.00** ✓; bracket 2 ✓
- Path B PT: 420,000 × 0.03 = **₱12,600.00** ✓; total_b = 300 + 12,600 = **₱12,900.00** ✓
- Path C: (420,000 − 250,000) × 0.08 = **₱13,600.00** ✓
- OSD beats 8% by: 13,600 − 12,900 = **₱700.00** ✓
- Path A IT: 22,500 + (420,000 − 400,000) × 0.20 = **₱26,500.00** ✓; bracket 3 ✓
- Window bounds per CR-028: OSD-wins window is ₱400,001 through ₱437,499. At ₱420,000 (midpoint) OSD wins ✓

**Legal basis:** OSD: NIRC Sec. 34(L). PT: NIRC Sec. 116 (3%). 8% option window derivation: CR-028 regime comparison breakeven analysis.

---

## TV-EX-G1-003: SC-P-L-I — Low-Income Freelancer, Itemized Wins (High Expenses)

**Scenario code:** SC-P-L-I
**Description:** Freelance illustrator with ₱450,000 gross receipts and ₱320,000 documented business expenses (71.1% expense ratio). Itemized deductions bring NTI to ₱130,000 — below the ₱250,000 zero-tax bracket — resulting in ₱0 income tax. Only 3% PT (₱13,500) is owed. This beats both 8% (₱16,000, no PT but higher base) and OSD (NTI = ₱270,000, small IT + PT = ₱16,500). The 8% option eliminates PT but charges 8% on a base of ₱200,000 (GR − ₱250K), producing ₱16,000 — more than the ₱13,500 Path A total.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱450,000.00 | Annual illustration income |
| `itemized_expenses.rent` | ₱200,000.00 | Studio rental ₱16,667/month × 12 |
| `itemized_expenses.utilities` | ₱30,000.00 | Electricity for studio |
| `itemized_expenses.supplies` | ₱50,000.00 | Art supplies, printing materials |
| `itemized_expenses.communication` | ₱20,000.00 | Internet + mobile |
| `itemized_expenses.travel` | ₱10,000.00 | Client visits (within Metro Manila) |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | BIR COR renewal, local business permit |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱320,000.00 (71.1% of GR)

### Expected Intermediate Values

**PL-05:** total_itemized_deductions = ₱320,000.00; ear_cap = ₱450,000 × 0.01 = ₱4,500.00; ear_expense claimed = ₱0 (not binding); no NOLCO entries

**PL-06:** osd_amount = ₱450,000 × 0.40 = ₱180,000.00; nti_path_b = ₱270,000.00

**PL-08 (Path A):** nti_path_a = 450,000 − 320,000 = ₱130,000.00; income_tax = graduated_tax_2023(130,000) = ₱0.00 (below ₱250K); pt = ₱450,000 × 0.03 = ₱13,500.00; total_path_a = ₱13,500.00

**PL-09 (Path B):** nti_path_b = ₱270,000.00; income_tax = (270,000 − 250,000) × 0.15 = ₱3,000.00; pt = ₱13,500.00; total_path_b = ₱16,500.00

**PL-10 (Path C):** path_c_base = 450,000 − 250,000 = ₱200,000.00; income_tax = 200,000 × 0.08 = ₱16,000.00; pt = ₱0.00; total_path_c = ₱16,000.00

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱16,000 − ₱13,500 = ₱2,500.00 (vs Path C); savings_vs_worst = ₱16,500 − ₱13,500 = ₱3,000.00

**PL-14:** balance_payable = ₱13,500.00

**PL-15:** form = FORM_1701; form_section = PART_IV (itemized deductions require Form 1701, not 1701A)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 130000.00, income_tax: 0.00,
              percentage_tax: 13500.00, total_tax: 13500.00 },
    path_b: { eligible: true, nti: 270000.00, osd_amount: 180000.00,
              income_tax: 3000.00, percentage_tax: 13500.00, total_tax: 16500.00 },
    path_c: { eligible: true, tax_base: 200000.00, income_tax: 16000.00,
              percentage_tax: 0.00, total_tax: 16000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 2500.00,
    savings_vs_worst: 3000.00
  },

  selected_path: PATH_A,
  income_tax_due: 0.00,
  percentage_tax_due: 13500.00,
  total_tax_due: 13500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 13500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-003** fires: no CWT entered AND recommended path is PATH_A (not 8%).

### Verification

- Path A NTI: 450,000 − 320,000 = 130,000 < 250,000 → IT = **₱0.00** ✓
- Path A PT: 450,000 × 0.03 = **₱13,500.00** ✓; total_a = **₱13,500.00** ✓
- Path B NTI: 450,000 × 0.60 = 270,000; IT = (270,000−250,000) × 0.15 = **₱3,000.00** ✓; total_b = **₱16,500.00** ✓
- Path C: (450,000−250,000) × 0.08 = 200,000 × 0.08 = **₱16,000.00** ✓
- Path A < Path C by: 16,000 − 13,500 = **₱2,500.00** ✓
- Breakeven expense ratio (Path A = Path C): E* = 450,000 − (0.03 × 450,000 / 0.08 + 250,000) ≈ no closed form; direct check: at E = ₱320,000, graduated(130,000) + 13,500 = 0 + 13,500 = ₱13,500 < Path C ₱16,000 → Itemized wins ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)–(K). OSD: NIRC Sec. 34(L). 8% option: NIRC Sec. 24(A)(2)(b). Form 1701A does not include Schedule 2 for itemized deductions; Form 1701 required when itemized is elected.

---

## TV-EX-G1-004: SC-P-ML-8 — Mid-Low Income, 8% Clearly Optimal

**Scenario code:** SC-P-ML-8
**Description:** Software developer freelancer with ₱800,000 gross receipts and ₱60,000 documented expenses (7.5% expense ratio). 8% option saves ₱18,500 versus OSD. This vector uses different gross receipts (₱800K vs ₱700K in TV-BASIC-001) and adds minor expenses to test that non-zero expenses do not disqualify Path C. The engine recommends Path C.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱800,000.00 | |
| `itemized_expenses.supplies` | ₱30,000.00 | Computer peripherals, SSD, monitor |
| `itemized_expenses.communication` | ₱15,000.00 | Internet ₱1,250/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱15,000.00 | BIR registration, local permits |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱60,000.00 (7.5% of GR)

### Expected Intermediate Values

**PL-05:** total_itemized_deductions = ₱60,000.00; ear_cap = ₱8,000.00 (1% × ₱800,000)

**PL-06:** osd_amount = ₱800,000 × 0.40 = ₱320,000.00; nti_path_b = ₱480,000.00

**PL-08 (Path A):** nti_path_a = 800,000 − 60,000 = ₱740,000.00; income_tax = 22,500 + (740,000 − 400,000) × 0.20 = 22,500 + 68,000 = ₱90,500.00; pt = ₱800,000 × 0.03 = ₱24,000.00; total_path_a = ₱114,500.00

**PL-09 (Path B):** nti_path_b = ₱480,000.00; income_tax = 22,500 + (480,000 − 400,000) × 0.20 = 22,500 + 16,000 = ₱38,500.00; pt = ₱24,000.00; total_path_b = ₱62,500.00

**PL-10 (Path C):** path_c_base = 800,000 − 250,000 = ₱550,000.00; income_tax = 550,000 × 0.08 = ₱44,000.00; pt = ₱0.00; total_path_c = ₱44,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱62,500 − ₱44,000 = ₱18,500.00; savings_vs_worst = ₱114,500 − ₱44,000 = ₱70,500.00

**PL-14:** balance_payable = ₱44,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 740000.00, income_tax: 90500.00,
              percentage_tax: 24000.00, total_tax: 114500.00 },
    path_b: { eligible: true, nti: 480000.00, osd_amount: 320000.00,
              income_tax: 38500.00, percentage_tax: 24000.00, total_tax: 62500.00 },
    path_c: { eligible: true, tax_base: 550000.00, income_tax: 44000.00,
              percentage_tax: 0.00, total_tax: 44000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 18500.00,
    savings_vs_worst: 70500.00
  },

  selected_path: PATH_C,
  income_tax_due: 44000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 44000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 44000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

No warnings: expenses (7.5%) ≥ 5% threshold → no WARN-004; Path C recommended → no WARN-003.

### Verification

- Path C: (800,000 − 250,000) × 0.08 = 550,000 × 0.08 = **₱44,000.00** ✓
- Path B NTI: 800,000 × 0.60 = 480,000; bracket 3: 22,500 + 80,000 × 0.20 = **₱38,500.00** ✓; PT: **₱24,000.00** ✓; total = **₱62,500.00** ✓
- Path A NTI: 740,000; bracket 3: 22,500 + 340,000 × 0.20 = **₱90,500.00** ✓; total = **₱114,500.00** ✓
- Savings vs OSD: 62,500 − 44,000 = **₱18,500.00** ✓

---

## TV-EX-G1-005: SC-P-ML-O — OSD Suboptimal in Mid-Low Range

**Scenario code:** SC-P-ML-O
**Description:** Marketing consultant with ₱950,000 gross receipts and ₱120,000 documented expenses (12.6% expense ratio). Optimizer recommends Path C (8%, total ₱56,000). OSD (Path B) would cost ₱85,000 — ₱29,000 more than 8%. This illustrates that choosing OSD over 8% is a costly mistake in the ₱500K–₱1M range with typical expense ratios. A taxpayer who locked in OSD at Q1 would pay a ₱29,000 premium for the year.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱950,000.00 | Annual consulting income |
| `itemized_expenses.rent` | ₱60,000.00 | Co-working space ₱5,000/month × 12 |
| `itemized_expenses.supplies` | ₱30,000.00 | Office supplies, printed materials |
| `itemized_expenses.communication` | ₱15,000.00 | |
| `itemized_expenses.taxes_and_licenses` | ₱15,000.00 | |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱120,000.00 (12.6% of GR)

### Expected Intermediate Values

**PL-06:** osd_amount = ₱950,000 × 0.40 = ₱380,000.00; nti_path_b = ₱570,000.00

**PL-08 (Path A):** nti_path_a = 950,000 − 120,000 = ₱830,000.00; income_tax = 102,500 + (830,000 − 800,000) × 0.25 = 102,500 + 7,500 = ₱110,000.00; pt = ₱950,000 × 0.03 = ₱28,500.00; total_path_a = ₱138,500.00

**PL-09 (Path B):** nti_path_b = ₱570,000.00; income_tax = 22,500 + (570,000 − 400,000) × 0.20 = 22,500 + 34,000 = ₱56,500.00; pt = ₱28,500.00; total_path_b = ₱85,000.00

**PL-10 (Path C):** path_c_base = 950,000 − 250,000 = ₱700,000.00; income_tax = 700,000 × 0.08 = ₱56,000.00; pt = ₱0.00; total_path_c = ₱56,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱85,000 − ₱56,000 = ₱29,000.00; savings_vs_worst = ₱138,500 − ₱56,000 = ₱82,500.00

**PL-14:** balance_payable = ₱56,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 830000.00, income_tax: 110000.00,
              percentage_tax: 28500.00, total_tax: 138500.00 },
    path_b: { eligible: true, nti: 570000.00, osd_amount: 380000.00,
              income_tax: 56500.00, percentage_tax: 28500.00, total_tax: 85000.00 },
    path_c: { eligible: true, tax_base: 700000.00, income_tax: 56000.00,
              percentage_tax: 0.00, total_tax: 56000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 29000.00,
    savings_vs_worst: 82500.00
  },

  selected_path: PATH_C,
  income_tax_due: 56000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 56000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 56000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

No warnings: expenses 12.6% ≥ 5% → no WARN-004; Path C recommended → no WARN-003.

### Verification

- Path C: (950,000 − 250,000) × 0.08 = 700,000 × 0.08 = **₱56,000.00** ✓
- Path B NTI: 950,000 × 0.60 = 570,000; bracket 3: 22,500 + 170,000 × 0.20 = **₱56,500.00** ✓; PT: **₱28,500.00** ✓; total = **₱85,000.00** ✓
- Path A NTI: 830,000; bracket 4 (830,000 > 800,000): 102,500 + 30,000 × 0.25 = **₱110,000.00** ✓
- Cost of choosing OSD over 8%: 85,000 − 56,000 = **₱29,000.00** ✓

---

## TV-EX-G1-006: SC-P-ML-I — Mid-Low Income, Itemized Wins (High Expenses)

**Scenario code:** SC-P-ML-I
**Description:** Freelance video production agency owner with ₱750,000 gross receipts and ₱560,000 in documented business expenses (74.7% expense ratio). High payroll for assistants and rent costs bring NTI to ₱190,000 — below the ₱250,000 zero-tax bracket — resulting in ₱0 income tax plus 3% PT (₱22,500 total). This beats Path C (₱40,000) by ₱17,500.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱750,000.00 | Production and editing fees |
| `itemized_expenses.salaries_wages` | ₱240,000.00 | 2 part-time editors, ₱10,000/month each × 12 |
| `itemized_expenses.rent` | ₱120,000.00 | Studio rental ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱30,000.00 | Power for render farm, lighting |
| `itemized_expenses.supplies` | ₱60,000.00 | Storage drives, props, props rental |
| `itemized_expenses.communication` | ₱30,000.00 | High-speed fiber + mobile plan |
| `itemized_expenses.travel` | ₱30,000.00 | Shoot locations (documented) |
| `itemized_expenses.depreciation` | ₱30,000.00 | Camera gear (₱150K cost, 5yr life = ₱30K/yr) |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | BIR, LGU permits |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱560,000.00 (74.7% of GR)

### Expected Intermediate Values

**PL-05:** total_itemized_deductions = ₱560,000.00; ear_cap = ₱750,000 × 0.01 = ₱7,500.00; ear_expense = ₱0 (not binding); depreciation: ₱30,000 (straight-line ₱150K/5yr, year ≤ 5, no vehicle)

**PL-06:** osd_amount = ₱750,000 × 0.40 = ₱300,000.00; nti_path_b = ₱450,000.00

**PL-08 (Path A):** nti_path_a = 750,000 − 560,000 = ₱190,000.00; income_tax = ₱0.00 (190,000 < 250,000); pt = ₱750,000 × 0.03 = ₱22,500.00; total_path_a = ₱22,500.00

**PL-09 (Path B):** nti_path_b = ₱450,000.00; income_tax = 22,500 + (450,000 − 400,000) × 0.20 = 22,500 + 10,000 = ₱32,500.00; pt = ₱22,500.00; total_path_b = ₱55,000.00

**PL-10 (Path C):** path_c_base = 750,000 − 250,000 = ₱500,000.00; income_tax = 500,000 × 0.08 = ₱40,000.00; pt = ₱0.00; total_path_c = ₱40,000.00

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱40,000 − ₱22,500 = ₱17,500.00 (vs Path C); savings_vs_worst = ₱55,000 − ₱22,500 = ₱32,500.00

**PL-14:** balance_payable = ₱22,500.00

**PL-15:** form = FORM_1701; form_section = PART_IV

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 190000.00, income_tax: 0.00,
              percentage_tax: 22500.00, total_tax: 22500.00 },
    path_b: { eligible: true, nti: 450000.00, osd_amount: 300000.00,
              income_tax: 32500.00, percentage_tax: 22500.00, total_tax: 55000.00 },
    path_c: { eligible: true, tax_base: 500000.00, income_tax: 40000.00,
              percentage_tax: 0.00, total_tax: 40000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 17500.00,
    savings_vs_worst: 32500.00
  },

  selected_path: PATH_A,
  income_tax_due: 0.00,
  percentage_tax_due: 22500.00,
  total_tax_due: 22500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 22500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-003** fires: no CWT and Path A recommended. No WARN-004 (expenses 74.7% ≥ 5%).

### Verification

- Path A NTI: 750,000 − 560,000 = 190,000 < 250,000 → IT = **₱0.00** ✓; PT = 750,000 × 0.03 = **₱22,500.00** ✓
- Path B NTI: 750,000 × 0.60 = 450,000; bracket 3: 22,500 + 50,000 × 0.20 = **₱32,500.00** ✓; total = **₱55,000.00** ✓
- Path C: (750,000 − 250,000) × 0.08 = **₱40,000.00** ✓
- Itemized advantage over Path C: 40,000 − 22,500 = **₱17,500.00** ✓
- Breakeven expense ratio for Path A = Path C: at GR = ₱750K, solve 3%×GR = (GR−250K)×8% → 22,500 = 40,000 → PT(A) < Path C only when IT(A) = 0, which requires NTI ≤ 250,000 → expenses ≥ ₱500,000 = 66.7% of GR. Here expenses = 74.7% > 66.7% → Itemized wins ✓

---

## TV-EX-G1-007: SC-P-MH-8 — Mid-High Income, 8% Clearly Optimal

**Scenario code:** SC-P-MH-8
**Description:** Registered architect with ₱1,500,000 gross receipts and ₱200,000 documented expenses (13.3% expense ratio). 8% option saves ₱72,500 versus OSD. This is the most common scenario for established freelance professionals in the ₱1M–₱2M range. Filing Form 1701A (Part IV-B).

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | Architectural design fees |
| `itemized_expenses.rent` | ₱96,000.00 | Home office / co-working ₱8,000/month × 12 |
| `itemized_expenses.utilities` | ₱24,000.00 | |
| `itemized_expenses.supplies` | ₱30,000.00 | Drawing materials, printing |
| `itemized_expenses.communication` | ₱20,000.00 | |
| `itemized_expenses.travel` | ₱15,000.00 | Site visits (documented) |
| `itemized_expenses.taxes_and_licenses` | ₱15,000.00 | PRC license renewal, BIR |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱200,000.00 (13.3% of GR)

### Expected Intermediate Values

**PL-06:** osd_amount = ₱1,500,000 × 0.40 = ₱600,000.00; nti_path_b = ₱900,000.00

**PL-08 (Path A):** nti_path_a = 1,500,000 − 200,000 = ₱1,300,000.00; income_tax = 102,500 + (1,300,000 − 800,000) × 0.25 = 102,500 + 125,000 = ₱227,500.00; pt = ₱1,500,000 × 0.03 = ₱45,000.00; total_path_a = ₱272,500.00

**PL-09 (Path B):** nti_path_b = ₱900,000.00; income_tax = 102,500 + (900,000 − 800,000) × 0.25 = 102,500 + 25,000 = ₱127,500.00; pt = ₱45,000.00; total_path_b = ₱172,500.00

**PL-10 (Path C):** path_c_base = 1,500,000 − 250,000 = ₱1,250,000.00; income_tax = 1,250,000 × 0.08 = ₱100,000.00; pt = ₱0.00; total_path_c = ₱100,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱172,500 − ₱100,000 = ₱72,500.00; savings_vs_worst = ₱272,500 − ₱100,000 = ₱172,500.00

**PL-14:** balance_payable = ₱100,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 1300000.00, income_tax: 227500.00,
              percentage_tax: 45000.00, total_tax: 272500.00 },
    path_b: { eligible: true, nti: 900000.00, osd_amount: 600000.00,
              income_tax: 127500.00, percentage_tax: 45000.00, total_tax: 172500.00 },
    path_c: { eligible: true, tax_base: 1250000.00, income_tax: 100000.00,
              percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 72500.00,
    savings_vs_worst: 172500.00
  },

  selected_path: PATH_C,
  income_tax_due: 100000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 100000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 100000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- Path C: (1,500,000 − 250,000) × 0.08 = **₱100,000.00** ✓
- Path B NTI: 1,500,000 × 0.60 = 900,000; bracket 4: 102,500 + 100,000 × 0.25 = **₱127,500.00** ✓; total = **₱172,500.00** ✓
- Path A NTI: 1,300,000; bracket 4: 102,500 + 500,000 × 0.25 = **₱227,500.00** ✓; total = **₱272,500.00** ✓
- Savings vs OSD: 172,500 − 100,000 = **₱72,500.00** ✓

---

## TV-EX-G1-008: SC-P-MH-O — OSD Suboptimal in Mid-High Range

**Scenario code:** SC-P-MH-O
**Description:** Management consultant with ₱1,800,000 gross receipts and ₱400,000 expenses (22.2%). Path C (8%) at ₱124,000 beats OSD at ₱226,500 by ₱102,500 — a substantial difference illustrating why choosing OSD in the ₱1M–₱2M range is a major mistake. Even with moderate documented expenses, 8% wins decisively.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,800,000.00 | Annual consulting fees |
| `itemized_expenses.salaries_wages` | ₱180,000.00 | 1 part-time VA ₱15,000/month × 12 |
| `itemized_expenses.rent` | ₱120,000.00 | Office space ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | |
| `itemized_expenses.supplies` | ₱30,000.00 | |
| `itemized_expenses.communication` | ₱14,000.00 | |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱400,000.00 (22.2% of GR)

### Expected Intermediate Values

**PL-06:** osd_amount = ₱1,800,000 × 0.40 = ₱720,000.00; nti_path_b = ₱1,080,000.00

**PL-08 (Path A):** nti_path_a = 1,800,000 − 400,000 = ₱1,400,000.00; income_tax = 102,500 + (1,400,000 − 800,000) × 0.25 = 102,500 + 150,000 = ₱252,500.00; pt = ₱1,800,000 × 0.03 = ₱54,000.00; total_path_a = ₱306,500.00

**PL-09 (Path B):** nti_path_b = ₱1,080,000.00; income_tax = 102,500 + (1,080,000 − 800,000) × 0.25 = 102,500 + 70,000 = ₱172,500.00; pt = ₱54,000.00; total_path_b = ₱226,500.00

**PL-10 (Path C):** path_c_base = 1,800,000 − 250,000 = ₱1,550,000.00; income_tax = 1,550,000 × 0.08 = ₱124,000.00; pt = ₱0.00; total_path_c = ₱124,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱226,500 − ₱124,000 = ₱102,500.00; savings_vs_worst = ₱306,500 − ₱124,000 = ₱182,500.00

**PL-14:** balance_payable = ₱124,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 1400000.00, income_tax: 252500.00,
              percentage_tax: 54000.00, total_tax: 306500.00 },
    path_b: { eligible: true, nti: 1080000.00, osd_amount: 720000.00,
              income_tax: 172500.00, percentage_tax: 54000.00, total_tax: 226500.00 },
    path_c: { eligible: true, tax_base: 1550000.00, income_tax: 124000.00,
              percentage_tax: 0.00, total_tax: 124000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 102500.00,
    savings_vs_worst: 182500.00
  },

  selected_path: PATH_C,
  income_tax_due: 124000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 124000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 124000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- Path C: (1,800,000 − 250,000) × 0.08 = 1,550,000 × 0.08 = **₱124,000.00** ✓
- Path B NTI: 1,800,000 × 0.60 = 1,080,000; bracket 4: 102,500 + 280,000 × 0.25 = **₱172,500.00** ✓; total = **₱226,500.00** ✓
- Path A NTI: 1,400,000; bracket 4: 102,500 + 600,000 × 0.25 = **₱252,500.00** ✓; total = **₱306,500.00** ✓
- Savings vs OSD: 226,500 − 124,000 = **₱102,500.00** ✓

---

## TV-EX-G1-009: SC-P-MH-I — Mid-High Income, Itemized Wins (Expense Ratio Above Breakeven)

**Scenario code:** SC-P-MH-I
**Description:** Digital agency owner with ₱1,500,000 gross receipts and ₱950,000 documented expenses (63.3% expense ratio). Itemized deductions bring NTI to ₱550,000, yielding IT of ₱52,500 plus PT ₱45,000 = ₱97,500 total. This beats Path C (₱100,000) by ₱2,500. The expense ratio exceeds the 62.5% breakeven for ₱1.5M gross (derived analytically). This vector tests the engine correctly selecting Path A by a narrow margin.

**Breakeven derivation at GR = ₱1,500,000:**
Path C total = ₱100,000. Path A total = graduated(1,500,000 − E) + 45,000 = 100,000.
graduated(NTI_A) = 55,000. In bracket 3 (₱400K–₱800K): 22,500 + (NTI_A − 400,000) × 0.20 = 55,000 → NTI_A = 562,500 → E* = 937,500 (62.5%). At E = 950,000 (63.3%) > E* → Path A wins.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | Agency design + development fees |
| `itemized_expenses.salaries_wages` | ₱420,000.00 | 1 full-time designer ₱25K/mo + 1 part-time dev ₱10K/mo |
| `itemized_expenses.rent` | ₱180,000.00 | Office ₱15,000/month × 12 |
| `itemized_expenses.utilities` | ₱60,000.00 | Power, water, internet for office |
| `itemized_expenses.supplies` | ₱60,000.00 | Software subscriptions, hardware |
| `itemized_expenses.communication` | ₱30,000.00 | |
| `itemized_expenses.travel` | ₱70,000.00 | Client visits, pitches (documented) |
| `itemized_expenses.depreciation` | ₱80,000.00 | 2 workstations ₱200K each, 5yr = ₱80K/yr |
| `itemized_expenses.taxes_and_licenses` | ₱30,000.00 | BIR, LGU, professional dues |
| `itemized_expenses.other_expenses` | ₱20,000.00 | Bank charges, insurance |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱950,000.00 (63.3% of GR)

### Expected Intermediate Values

**PL-05:** total_itemized_deductions = ₱950,000.00; ear_cap = ₱1,500,000 × 0.01 = ₱15,000.00; EAR claimed = ₱0 (not binding); travel ≠ EAR (travel is a separate deduction category from entertainment/representation/advertising per CR-027); depreciation ₱80,000 = 2 workstations at ₱200K each, straight-line 5yr, valid (no vehicle ceiling issue)

**PL-06:** osd_amount = ₱1,500,000 × 0.40 = ₱600,000.00; nti_path_b = ₱900,000.00

**PL-08 (Path A):** nti_path_a = 1,500,000 − 950,000 = ₱550,000.00; income_tax = 22,500 + (550,000 − 400,000) × 0.20 = 22,500 + 30,000 = ₱52,500.00; pt = ₱1,500,000 × 0.03 = ₱45,000.00; total_path_a = ₱97,500.00

**PL-09 (Path B):** nti_path_b = ₱900,000.00; income_tax = 102,500 + (900,000 − 800,000) × 0.25 = 102,500 + 25,000 = ₱127,500.00; pt = ₱45,000.00; total_path_b = ₱172,500.00

**PL-10 (Path C):** path_c_base = 1,250,000.00; income_tax = ₱100,000.00; pt = ₱0.00; total_path_c = ₱100,000.00

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱100,000 − ₱97,500 = ₱2,500.00 (vs Path C); savings_vs_worst = ₱172,500 − ₱97,500 = ₱75,000.00

**PL-14:** balance_payable = ₱97,500.00

**PL-15:** form = FORM_1701; form_section = PART_IV

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 550000.00, income_tax: 52500.00,
              percentage_tax: 45000.00, total_tax: 97500.00 },
    path_b: { eligible: true, nti: 900000.00, osd_amount: 600000.00,
              income_tax: 127500.00, percentage_tax: 45000.00, total_tax: 172500.00 },
    path_c: { eligible: true, tax_base: 1250000.00, income_tax: 100000.00,
              percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 2500.00,
    savings_vs_worst: 75000.00
  },

  selected_path: PATH_A,
  income_tax_due: 52500.00,
  percentage_tax_due: 45000.00,
  total_tax_due: 97500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 97500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-003** fires: Path A recommended and no CWT entered.

### Verification

- Path A NTI: 1,500,000 − 950,000 = 550,000; bracket 3: 22,500 + (550,000−400,000) × 0.20 = 22,500 + 30,000 = **₱52,500.00** ✓
- Path A total: 52,500 + 45,000 = **₱97,500.00** ✓
- Path C total: **₱100,000.00** ✓
- Path A saves ₱2,500 over Path C ✓; expense ratio 63.3% > breakeven 62.5% ✓
- Path B NTI: 1,500,000 × 0.60 = 900,000; bracket 4: 102,500 + 100,000 × 0.25 = **₱127,500.00** ✓

---

## TV-EX-G1-010: SC-P-H-8 — High Income (₱2M–₱3M), 8% Dominant

**Scenario code:** SC-P-H-8
**Description:** Freelance lawyer with ₱2,500,000 gross receipts and ₱500,000 documented expenses (20% expense ratio). 8% option (₱180,000 total) saves ₱172,500 over OSD (₱352,500). This demonstrates the enormous advantage of Path C in the high-income range — even a taxpayer with significant expenses pays far less under 8%. The savings grow as gross receipts approach ₱3M.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Legal fees for the year |
| `itemized_expenses.salaries_wages` | ₱240,000.00 | 1 paralegal ₱20,000/month × 12 |
| `itemized_expenses.rent` | ₱120,000.00 | Law office ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | |
| `itemized_expenses.supplies` | ₱50,000.00 | Legal forms, printing, research materials |
| `itemized_expenses.communication` | ₱24,000.00 | |
| `itemized_expenses.travel` | ₱20,000.00 | Court appearances (documented) |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | IBP dues, BIR |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱500,000.00 (20.0% of GR)

### Expected Intermediate Values

**PL-02:** taxpayer_tier = MICRO (GR < ₱3M)

**PL-06:** osd_amount = ₱2,500,000 × 0.40 = ₱1,000,000.00; nti_path_b = ₱1,500,000.00

**PL-08 (Path A):** nti_path_a = 2,500,000 − 500,000 = ₱2,000,000.00; income_tax = 102,500 + (2,000,000 − 800,000) × 0.25 = 102,500 + 300,000 = ₱402,500.00; pt = ₱2,500,000 × 0.03 = ₱75,000.00; total_path_a = ₱477,500.00

**PL-09 (Path B):** nti_path_b = ₱1,500,000.00; income_tax = 102,500 + (1,500,000 − 800,000) × 0.25 = 102,500 + 175,000 = ₱277,500.00; pt = ₱75,000.00; total_path_b = ₱352,500.00

**PL-10 (Path C):** path_c_base = 2,500,000 − 250,000 = ₱2,250,000.00; income_tax = 2,250,000 × 0.08 = ₱180,000.00; pt = ₱0.00; total_path_c = ₱180,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱352,500 − ₱180,000 = ₱172,500.00; savings_vs_worst = ₱477,500 − ₱180,000 = ₱297,500.00

**PL-14:** balance_payable = ₱180,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 2000000.00, income_tax: 402500.00,
              percentage_tax: 75000.00, total_tax: 477500.00 },
    path_b: { eligible: true, nti: 1500000.00, osd_amount: 1000000.00,
              income_tax: 277500.00, percentage_tax: 75000.00, total_tax: 352500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 172500.00,
    savings_vs_worst: 297500.00
  },

  selected_path: PATH_C,
  income_tax_due: 180000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 180000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 180000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- Path C: (2,500,000 − 250,000) × 0.08 = 2,250,000 × 0.08 = **₱180,000.00** ✓
- Path B NTI: 2,500,000 × 0.60 = 1,500,000; bracket 4: 102,500 + 700,000 × 0.25 = **₱277,500.00** ✓; PT: **₱75,000.00** ✓; total = **₱352,500.00** ✓
- Path A NTI: 2,000,000; bracket 4 upper boundary: 102,500 + 1,200,000 × 0.25 = **₱402,500.00** ✓ (NTI = ₱2,000,000 is still in bracket 4 since bracket 4 covers ₱800,001–₱2,000,000)
- Savings vs OSD: 352,500 − 180,000 = **₱172,500.00** ✓
- WARN-001 check: GR = ₱2,500,000 > ₱2,700,000? No (₱2.5M < ₱2.7M) → no WARN-001 ✓

---

## TV-EX-G1-011: SC-P-H-O — OSD Suboptimal in High Range

**Scenario code:** SC-P-H-O
**Description:** Senior IT consultant with ₱2,500,000 gross receipts and ₱800,000 expenses (32%). Path C (₱180,000) saves ₱172,500 over OSD (₱352,500). Despite substantial documented expenses, choosing OSD costs ₱172,500 extra versus 8%. This scenario represents a taxpayer with moderate documentation who might assume OSD is "good enough" — the optimizer shows the true cost.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Annual IT consulting fees |
| `itemized_expenses.salaries_wages` | ₱360,000.00 | 1.5 FTE support staff (₱30K/mo) |
| `itemized_expenses.rent` | ₱180,000.00 | Office ₱15,000/month × 12 |
| `itemized_expenses.utilities` | ₱60,000.00 | |
| `itemized_expenses.supplies` | ₱80,000.00 | Hardware, licensed software |
| `itemized_expenses.communication` | ₱36,000.00 | Dedicated fiber ₱3,000/mo |
| `itemized_expenses.travel` | ₱40,000.00 | Client site visits |
| `itemized_expenses.depreciation` | ₱24,000.00 | Server rack ₱120K, 5yr = ₱24K/yr |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱800,000.00 (32.0% of GR)

### Expected Intermediate Values

**PL-06:** osd_amount = ₱2,500,000 × 0.40 = ₱1,000,000.00; nti_path_b = ₱1,500,000.00

**PL-08 (Path A):** nti_path_a = 2,500,000 − 800,000 = ₱1,700,000.00; income_tax = 102,500 + (1,700,000 − 800,000) × 0.25 = 102,500 + 225,000 = ₱327,500.00; pt = ₱75,000.00; total_path_a = ₱402,500.00

**PL-09 (Path B):** nti_path_b = ₱1,500,000.00; income_tax = 102,500 + 700,000 × 0.25 = ₱277,500.00; pt = ₱75,000.00; total_path_b = ₱352,500.00

**PL-10 (Path C):** path_c_base = ₱2,250,000.00; income_tax = ₱180,000.00; pt = ₱0.00; total_path_c = ₱180,000.00

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱352,500 − ₱180,000 = ₱172,500.00; savings_vs_worst = ₱402,500 − ₱180,000 = ₱222,500.00

**Note on Path A vs Path B:** expenses = 32% = OSD rate (40%) is higher than itemized rate, so Path B (OSD) < Path A (itemized) when expenses < 40% of GR. Here, expenses (₱800K) < OSD (₱1,000K) → Path B NTI = ₱1,500K < Path A NTI = ₱1,700K → Path B IT = ₱277,500 < Path A IT = ₱327,500 → Path B total < Path A total. OSD is better than Itemized at 32% expense ratio — but Path C is best.

**PL-14:** balance_payable = ₱180,000.00

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 1700000.00, income_tax: 327500.00,
              percentage_tax: 75000.00, total_tax: 402500.00 },
    path_b: { eligible: true, nti: 1500000.00, osd_amount: 1000000.00,
              income_tax: 277500.00, percentage_tax: 75000.00, total_tax: 352500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 172500.00,
    savings_vs_worst: 222500.00
  },

  selected_path: PATH_C,
  income_tax_due: 180000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 180000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 180000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- Path C: 2,250,000 × 0.08 = **₱180,000.00** ✓
- Path B IT: 102,500 + 700,000 × 0.25 = **₱277,500.00** ✓; total = **₱352,500.00** ✓
- Path A NTI: 1,700,000; IT: 102,500 + 900,000 × 0.25 = **₱327,500.00** ✓; total = **₱402,500.00** ✓
- Path B < Path A (confirmed: expenses 32% < OSD rate 40%) ✓
- Path C breakeven vs. itemized: E* = GR − (graduated_inv(Path_C_IT − PT) = not relevant; Path C is lowest ✓

---

## TV-EX-G1-012: SC-P-H-I — High Income, Itemized Wins (Very High Expenses)

**Scenario code:** SC-P-H-I
**Description:** Full-service creative agency with ₱2,500,000 gross receipts and ₱1,750,000 in documented expenses (70% expense ratio). Itemized deductions bring NTI to ₱750,000, yielding IT of ₱92,500 plus PT ₱75,000 = ₱167,500 total. This beats Path C (₱180,000) by ₱12,500. The expense ratio exceeds the 67.6% breakeven for ₱2.5M gross. This scenario is the high-income analogue of SC-P-L-I and SC-P-ML-I.

**Breakeven derivation at GR = ₱2,500,000:**
Path C = ₱180,000. Path A = graduated(2,500,000 − E) + 75,000 = 180,000 → graduated(NTI_A) = 105,000. In bracket 4: 102,500 + (NTI_A − 800,000) × 0.25 = 105,000 → NTI_A = 810,000 → E* = 1,690,000 (67.6%). At E = ₱1,750,000 (70%) > E* → Path A wins.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Agency retainers and project fees |
| `itemized_expenses.salaries_wages` | ₱780,000.00 | 3 full-time staff: designer ₱25K, developer ₱30K, PM ₱10K × 12 |
| `itemized_expenses.rent` | ₱360,000.00 | Prime office location ₱30,000/month × 12 |
| `itemized_expenses.utilities` | ₱120,000.00 | Power, internet, water |
| `itemized_expenses.supplies` | ₱120,000.00 | Software licenses, hardware, props |
| `itemized_expenses.communication` | ₱60,000.00 | Multiple lines + internet |
| `itemized_expenses.travel` | ₱100,000.00 | Client meetings, shoots (documented) |
| `itemized_expenses.depreciation` | ₱120,000.00 | 3 workstations ₱200K each, 5yr = ₱120K/yr |
| `itemized_expenses.taxes_and_licenses` | ₱60,000.00 | BIR, LGU, professional licenses |
| `itemized_expenses.ear_expense` | ₱25,000.00 | Client entertainment (exactly at EAR cap) |
| `itemized_expenses.other_expenses` | ₱5,000.00 | Bank charges, insurance premiums |
| All other itemized expense fields | ₱0.00 | |

**Total itemized expenses:** ₱1,750,000.00 (70.0% of GR)

### Expected Intermediate Values

**PL-05:**
- total_itemized_deductions before EAR cap = ₱1,750,000.00
- ear_cap = ₱2,500,000 × 0.01 = ₱25,000.00 (service provider: 1% of GR)
- ear_expense claimed = ₱25,000.00; ear_cap = ₱25,000.00; no disallowance (exactly at cap)
- total_itemized_deductions_allowed = ₱1,750,000.00 (no reduction)

**PL-06:** osd_amount = ₱2,500,000 × 0.40 = ₱1,000,000.00; nti_path_b = ₱1,500,000.00

**PL-08 (Path A):** nti_path_a = 2,500,000 − 1,750,000 = ₱750,000.00; income_tax = 22,500 + (750,000 − 400,000) × 0.20 = 22,500 + 70,000 = ₱92,500.00; pt = ₱2,500,000 × 0.03 = ₱75,000.00; total_path_a = ₱167,500.00

**PL-09 (Path B):** nti_path_b = ₱1,500,000.00; income_tax = 102,500 + 700,000 × 0.25 = ₱277,500.00; pt = ₱75,000.00; total_path_b = ₱352,500.00

**PL-10 (Path C):** path_c_base = ₱2,250,000.00; income_tax = ₱180,000.00; pt = ₱0.00; total_path_c = ₱180,000.00

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱180,000 − ₱167,500 = ₱12,500.00 (vs Path C); savings_vs_worst = ₱352,500 − ₱167,500 = ₱185,000.00

**PL-14:** balance_payable = ₱167,500.00

**PL-15:** form = FORM_1701; form_section = PART_IV

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 750000.00, income_tax: 92500.00,
              percentage_tax: 75000.00, total_tax: 167500.00 },
    path_b: { eligible: true, nti: 1500000.00, osd_amount: 1000000.00,
              income_tax: 277500.00, percentage_tax: 75000.00, total_tax: 352500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 12500.00,
    savings_vs_worst: 185000.00
  },

  selected_path: PATH_A,
  income_tax_due: 92500.00,
  percentage_tax_due: 75000.00,
  total_tax_due: 167500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 167500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN-003** fires: Path A recommended and no CWT entered. No WARN-001 (₱2,500,000 < ₱2,700,000 threshold).

### Verification

- Path A NTI: 2,500,000 − 1,750,000 = 750,000; bracket 3: 22,500 + (750,000 − 400,000) × 0.20 = 22,500 + 70,000 = **₱92,500.00** ✓
- PT: 2,500,000 × 0.03 = **₱75,000.00** ✓; total_a = 92,500 + 75,000 = **₱167,500.00** ✓
- Path C total: **₱180,000.00** ✓
- EAR cap: 1% × 2,500,000 = ₱25,000 = ear_expense claimed → no disallowance ✓
- Expense ratio: 1,750,000 / 2,500,000 = 70.0% > breakeven 67.6% → Path A wins ✓
- At breakeven E* = 1,690,000: NTI = 810,000; IT = 102,500 + 10,000 × 0.25 = 105,000; total_a = 105,000 + 75,000 = 180,000 = Path C → tie → Path C wins by tie-break; above breakeven → Path A wins ✓

**Legal basis:** EAR cap: RR 10-2002, Sec. 3 (1% for service providers). Itemized deductions: NIRC Sec. 34(A)–(K). Form 1701 required for itemized deductions (Form 1701A does not include Schedule 2 deduction line items).

---

## GROUP 1 SUMMARY TABLE

| Vector | Scenario | GR | Expenses | Expense% | Optimal Path | Total Tax | Savings vs Next |
|--------|---------|-----|---------|---------|-------------|-----------|-----------------|
| TV-EX-G1-001 | SC-P-L-8 | ₱300,000 | ₱0 | 0% | Path C (8%) | ₱4,000 | ₱5,000 vs B |
| TV-EX-G1-002 | SC-P-L-O | ₱420,000 | ₱0 | 0% | Path B (OSD) | ₱12,900 | ₱700 vs C |
| TV-EX-G1-003 | SC-P-L-I | ₱450,000 | ₱320,000 | 71.1% | Path A (Itemized) | ₱13,500 | ₱2,500 vs C |
| TV-EX-G1-004 | SC-P-ML-8 | ₱800,000 | ₱60,000 | 7.5% | Path C (8%) | ₱44,000 | ₱18,500 vs B |
| TV-EX-G1-005 | SC-P-ML-O | ₱950,000 | ₱120,000 | 12.6% | Path C (8%) | ₱56,000 | ₱29,000 vs B |
| TV-EX-G1-006 | SC-P-ML-I | ₱750,000 | ₱560,000 | 74.7% | Path A (Itemized) | ₱22,500 | ₱17,500 vs C |
| TV-EX-G1-007 | SC-P-MH-8 | ₱1,500,000 | ₱200,000 | 13.3% | Path C (8%) | ₱100,000 | ₱72,500 vs B |
| TV-EX-G1-008 | SC-P-MH-O | ₱1,800,000 | ₱400,000 | 22.2% | Path C (8%) | ₱124,000 | ₱102,500 vs B |
| TV-EX-G1-009 | SC-P-MH-I | ₱1,500,000 | ₱950,000 | 63.3% | Path A (Itemized) | ₱97,500 | ₱2,500 vs C |
| TV-EX-G1-010 | SC-P-H-8 | ₱2,500,000 | ₱500,000 | 20.0% | Path C (8%) | ₱180,000 | ₱172,500 vs B |
| TV-EX-G1-011 | SC-P-H-O | ₱2,500,000 | ₱800,000 | 32.0% | Path C (8%) | ₱180,000 | ₱172,500 vs B |
| TV-EX-G1-012 | SC-P-H-I | ₱2,500,000 | ₱1,750,000 | 70.0% | Path A (Itemized) | ₱167,500 | ₱12,500 vs C |

**Key insights validated:**
1. Path C (8%) wins for most purely self-employed taxpayers below ₱3M with expense ratios below ~62–67% (varies by gross).
2. Path B (OSD) wins only in the narrow ₱400,001–₱437,499 window (TV-EX-G1-002).
3. Path A (Itemized) wins when the expense ratio brings NTI below ₱250K (zero IT bracket) and the PT is less than Path C's 8% base (TV-EX-G1-003, G1-006) OR when the expense ratio exceeds the breakeven (TV-EX-G1-009, G1-012).
4. Savings from 8% vs OSD grow dramatically with income: ₱5K at ₱300K GR → ₱172.5K at ₱2.5M GR.
5. EAR cap exactly at limit (TV-EX-G1-012) produces no disallowance — engine must handle boundary correctly.

---

## GROUP 2: Pure Service/Professional — Above ₱3M (VAT Registered, 8% NOT Available)

**2 scenario codes:** SC-P-VH-O-VAT, SC-P-VH-I-VAT

**Common characteristics for all Group 2 vectors:**
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_vat_registered`: true (mandatory VAT registration; gross > ₱3,000,000)
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `cost_of_goods_sold`: ₱0.00 (pure service provider)
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): PURELY_SE
- `taxpayer_tier` (derived): SMALL (₱3,000,000 ≤ gross < ₱20,000,000)
- `path_c_eligible` (derived): false (IN-02: gross > ₱3M; IN-03: VAT-registered)
- `percentage_tax` (all paths): ₱0.00 (VAT-registered taxpayers do NOT pay percentage tax)
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `return_type`: ORIGINAL
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `filing_period`: ANNUAL
- `tax_year`: 2025

**Input note for all Group 2 vectors:** `gross_receipts` values are VAT-EXCLUSIVE amounts (fees before adding 12% output VAT to clients). The engine wizard instructs VAT-registered users: "Enter your gross sales BEFORE VAT. Do not include the 12% VAT you collected from clients." See CR-033.

---

## TV-EX-G2-001: SC-P-VH-O-VAT — VAT-Registered Architect, ₱6M Gross, Path B (OSD) Wins

**Scenario code:** SC-P-VH-O-VAT
**Description:** Licensed architect earning ₱6,000,000 VAT-exclusive gross receipts annually (mandatory VAT registration since gross exceeds ₱3M). Has ₱1,500,000 documented business expenses (25% ratio). Because both IN-02 (gross > ₱3M) and IN-03 (VAT-registered) make Path C ineligible, the engine compares only Path A (Itemized) vs Path B (OSD). OSD provides a ₱2,400,000 deduction vs the ₱1,500,000 itemized — OSD produces lower NTI (₱3,600,000 vs ₱4,500,000), so Path B wins by ₱270,000. No percentage tax applies (VAT-registered). This is the most common result for VAT-registered service professionals: unless actual documented expenses exceed 40% of gross, OSD wins.

Note: `basic.md` TV-BASIC-006 covers SC-P-VH-O-VAT with ₱5,000,000 gross and 20% expenses. This vector uses different inputs (₱6M gross, 25% expenses, 10% EWT withheld, quarterly payments) to provide an independent verification.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (fields differing from Group 2 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱6,000,000.00 | VAT-exclusive; output VAT (₱720,000 = ₱6M × 0.12) collected from clients and remitted separately via BIR Form 2550Q |
| `itemized_expenses.salaries_wages` | ₱600,000.00 | 2 junior architects at ₱25,000/month × 12, including 13th month |
| `itemized_expenses.rent` | ₱360,000.00 | Architecture studio ₱30,000/month × 12 |
| `itemized_expenses.utilities` | ₱120,000.00 | Electricity for workstations/plotters ₱10,000/month |
| `itemized_expenses.supplies` | ₱150,000.00 | Printing, plotting, physical model materials |
| `itemized_expenses.communication` | ₱30,000.00 | Phone plan, broadband ₱2,500/month |
| `itemized_expenses.depreciation` | ₱180,000.00 | CAD workstations × 3, plotters; straight-line over 5 years |
| `itemized_expenses.taxes_and_licenses` | ₱30,000.00 | PRC annual renewal, UAP dues, BIR registration |
| `itemized_expenses.ear_expense` | ₱30,000.00 | Client entertainment and meals (within 1% cap of ₱60,000) |
| All other itemized expense fields | ₱0.00 | |
| `prior_quarterly_payments` | [{ period: Q1_2025, amount: 150000.00 }, { period: Q2_2025, amount: 130000.00 }, { period: Q3_2025, amount: 100000.00 }] | Estimated quarterly Path B payments under 1701Q |
| `cwt_2307_entries` | [{ atc: "WI011", income_payment: 2000000.00, tax_withheld: 200000.00, payor: "PQR Developers Corp", period: "2025-ANNUAL" }, { atc: "WI011", income_payment: 1000000.00, tax_withheld: 100000.00, payor: "STU Holdings Inc", period: "2025-ANNUAL" }] | 10% EWT (WI011): prior-year professional gross ≥ ₱3M → clients required to withhold at 10% under RR 2-98 Sec. 2.57.2. Remaining ₱3,000,000 paid by non-withholding individual clients (no 2307). |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |
| `prior_payment_for_return` | ₱0.00 | |

**Total itemized expenses:** ₱1,500,000.00 (25.0% of gross receipts)
**Total CWT credits from 2307s:** ₱300,000.00 (WI011 × 2 entries)

### Expected Intermediate Values

**PL-02 (Classification):**
- `net_gross_receipts` = ₱6,000,000.00
- `taxpayer_tier` = SMALL (₱3,000,000 ≤ ₱6,000,000 < ₱20,000,000)
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER (cost_of_goods_sold = ₱0)

**PL-04 (Eligibility):**
- `path_c_eligible` = false
- `ineligibility_reasons` = [IN-02, IN-03]
  - IN-02: "Gross receipts exceed ₱3,000,000. The 8% income tax option is only available to taxpayers with gross receipts/sales not exceeding ₱3,000,000."
  - IN-03: "Taxpayer is VAT-registered. The 8% income tax option requires non-VAT registration. See NIRC Sec. 24(A)(2)(b) and RR 8-2018 Sec. 2(A)."

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = 600,000 + 360,000 + 120,000 + 150,000 + 30,000 + 180,000 + 30,000 + 30,000 = ₱1,500,000.00
- `ear_cap` = ₱6,000,000 × 0.01 = ₱60,000.00; ear_expense claimed = ₱30,000.00 ≤ ₱60,000.00 → no disallowance

**PL-06 (OSD):**
- `osd_amount` = ₱6,000,000.00 × 0.40 = ₱2,400,000.00
- `nti_path_b` = ₱6,000,000.00 − ₱2,400,000.00 = ₱3,600,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱200,000 + ₱100,000 = ₱300,000.00 (both WI011 entries)

**PL-08 (Path A — Graduated + Itemized):**
- `nti_path_a` = ₱6,000,000.00 − ₱1,500,000.00 = ₱4,500,000.00
- `income_tax_path_a` = graduated_tax_2023(₱4,500,000)
  = ₱402,500 + (₱4,500,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱2,500,000 × 0.30
  = ₱402,500 + ₱750,000.00
  = ₱1,152,500.00
- `percentage_tax_path_a` = ₱0.00 (VAT-registered; OPT does not apply)
- `total_tax_path_a` = ₱1,152,500.00

**PL-09 (Path B — Graduated + OSD):**
- `nti_path_b` = ₱3,600,000.00
- `income_tax_path_b` = graduated_tax_2023(₱3,600,000)
  = ₱402,500 + (₱3,600,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱1,600,000 × 0.30
  = ₱402,500 + ₱480,000.00
  = ₱882,500.00
- `percentage_tax_path_b` = ₱0.00 (VAT-registered)
- `total_tax_path_b` = ₱882,500.00

**PL-10 (Path C):**
- Ineligible; `total_tax_path_c` = null; `ineligibility_reasons` = [IN-02, IN-03]

**PL-13 (Compare):**
- Path A: ₱1,152,500.00
- Path B: ₱882,500.00 ← MINIMUM
- Path C: N/A (ineligible)
- `recommended_path` = PATH_B
- `savings_vs_next_best` = ₱1,152,500 − ₱882,500 = ₱270,000.00 (Path B saves vs Path A)
- `savings_vs_worst` = ₱1,152,500 − ₱882,500 = ₱270,000.00 (only 2 eligible paths; worst = Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱882,500.00
- `total_cwt_credits` = ₱300,000.00
- `quarterly_it_paid` = ₱150,000 + ₱130,000 + ₱100,000 = ₱380,000.00
- `balance_payable` = ₱882,500 − ₱300,000 − ₱380,000 = ₱202,500.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701A (PURELY_SE + annual + graduated + OSD → 1701A)
- `form_section` = PART_IV_A (graduated rates + OSD section)

**PL-16 (Penalties):** ₱0.00 (on-time filing assumed)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: SMALL,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 4500000.00,
      itemized_deductions: 1500000.00,
      income_tax: 1152500.00,
      percentage_tax: 0.00,
      total_tax: 1152500.00
    },
    path_b: {
      eligible: true,
      nti: 3600000.00,
      osd_amount: 2400000.00,
      income_tax: 882500.00,
      percentage_tax: 0.00,
      total_tax: 882500.00
    },
    path_c: {
      eligible: false,
      income_tax: null,
      percentage_tax: null,
      total_tax: null,
      ineligibility_reasons: [
        "IN-02: Gross receipts exceed ₱3,000,000. The 8% option requires gross receipts/sales not exceeding ₱3,000,000.",
        "IN-03: Taxpayer is VAT-registered. The 8% option is only available to non-VAT-registered taxpayers per RR 8-2018 Sec. 2(A)."
      ]
    },
    recommended_path: PATH_B,
    savings_vs_next_best: 270000.00,
    savings_vs_worst: 270000.00
  },

  selected_path: PATH_B,
  income_tax_due: 882500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 882500.00,

  cwt_credits: 300000.00,
  quarterly_it_paid: 380000.00,
  balance_payable: 202500.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701A,
  form_section: PART_IV_A,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: [IN-02, IN-03],
  vat_obligation_notice: "As a VAT-registered taxpayer, you have a separate quarterly VAT filing obligation (BIR Form 2550Q, due on the 25th day after each quarter end). This tool computes income tax only. Your quarterly VAT payable (output VAT minus creditable input VAT) must be computed and filed separately."
}
```

**No warnings fire:** WARN-002 does not fire (taxpayer IS VAT-registered, which is the correct status for ₱6M gross). WARN-003 does not fire (CWT entries are present). WARN-004 does not fire (expenses ₱1.5M, ratio 25% > 5%).

### Verification

- **EAR cap:** 1% × ₱6,000,000 = ₱60,000; claimed ₱30,000 ≤ ₱60,000 → no disallowance ✓
- **Itemized total:** 600,000 + 360,000 + 120,000 + 150,000 + 30,000 + 180,000 + 30,000 + 30,000 = **₱1,500,000** ✓
- **Path A NTI:** 6,000,000 − 1,500,000 = **₱4,500,000** ✓
- **Path A IT:** bracket 5 (₱2M–₱8M): 402,500 + 2,500,000 × 0.30 = **₱1,152,500** ✓
- **Path B OSD:** 6,000,000 × 0.40 = **₱2,400,000** ✓
- **Path B NTI:** 6,000,000 − 2,400,000 = **₱3,600,000** ✓
- **Path B IT:** bracket 5: 402,500 + 1,600,000 × 0.30 = **₱882,500** ✓
- **OSD wins because:** OSD deduction (₱2,400,000) > Itemized deductions (₱1,500,000) → OSD NTI (₱3,600,000) < Itemized NTI (₱4,500,000). OSD breakeven: expenses must exceed 40% × ₱6M = ₱2,400,000 for Path A to win. ₱1,500,000 < ₱2,400,000 → Path B wins ✓
- **Savings:** 1,152,500 − 882,500 = **₱270,000** ✓
- **CWT:** WI011 at 10%: ₱200,000 + ₱100,000 = **₱300,000** ✓
- **Quarterly paid:** 150,000 + 130,000 + 100,000 = **₱380,000** ✓
- **Balance payable:** 882,500 − 300,000 − 380,000 = **₱202,500** ✓

**Legal basis:** 8% ineligibility: NIRC Sec. 24(A)(2)(b), RR 8-2018 Sec. 2(A). OSD (40%): NIRC Sec. 34(L). Graduated rates (2023+): NIRC Sec. 24(A)(1), CR-002. VAT registration mandatory above ₱3M: NIRC Sec. 109(BB) as amended. PT waived for VAT-registered: NIRC Sec. 116 (OPT applies only to non-VAT taxpayers). 10% EWT: RR 2-98 Sec. 2.57.2(E) — professionals with prior-year gross ≥ ₱3M. Form 1701A for PURELY_SE + graduated + OSD: BIR Revenue Memorandum Circular No. 37-2019.

---

## TV-EX-G2-002: SC-P-VH-I-VAT — VAT-Registered Attorney, ₱4.5M Gross, Path A (Itemized) Wins

**Scenario code:** SC-P-VH-I-VAT
**Description:** Licensed attorney earning ₱4,500,000 VAT-exclusive annual gross receipts. Has ₱2,800,000 in substantiated business expenses (62.2% expense ratio). Because expenses exceed 40% of gross (the OSD deduction of ₱1,800,000), Path A (Itemized) produces a lower NTI (₱1,700,000) than Path B's OSD NTI (₱2,700,000). Path A income tax = ₱327,500 vs Path B = ₱612,500 — Path A saves ₱285,000. This is the first year the attorney's gross exceeded ₱3M, so CWT was withheld at 5% (WI010, prior-year gross < ₱3M). An MRF-028 advisory fires because the engine cannot verify that creditable input VAT has been excluded from the expense figures. Form 1701 (full itemized schedule) is required instead of 1701A.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (fields differing from Group 2 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱4,500,000.00 | VAT-exclusive legal fees; output VAT (₱540,000 = ₱4.5M × 0.12) collected from clients and remitted separately via BIR Form 2550Q |
| `itemized_expenses.salaries_wages` | ₱1,500,000.00 | 4 support staff (legal assistants, paralegals): 3 full-time at ₱30K/month + 1 part-time at ₱15K/month × 12, including 13th month and mandatory benefits (SSS, PhilHealth, Pag-IBIG employer share) |
| `itemized_expenses.rent` | ₱480,000.00 | Law office rental ₱40,000/month × 12 |
| `itemized_expenses.utilities` | ₱120,000.00 | Electricity, internet, water ₱10,000/month |
| `itemized_expenses.supplies` | ₱60,000.00 | Office supplies, legal forms, postage ₱5,000/month |
| `itemized_expenses.communication` | ₱36,000.00 | Mobile plan, landline ₱3,000/month |
| `itemized_expenses.depreciation` | ₱180,000.00 | Law library (digital and physical), computers × 4, office furniture; straight-line 5-year ₱900,000 asset cost basis |
| `itemized_expenses.taxes_and_licenses` | ₱60,000.00 | IBP dues ₱12,000, MCLE compliance fees ₱8,000, BIR registration ₱500, business permit ₱5,000, documentary stamp taxes ₱34,500 |
| `itemized_expenses.ear_expense` | ₱30,000.00 | Client entertainment and representation (within 1% × ₱4,500,000 = ₱45,000 cap) |
| `itemized_expenses.other_expenses` | ₱334,000.00 | Legal research subscriptions (Westlaw/LexisNexis PH ₱120,000), bar association fees ₱15,000, litigation support services ₱80,000, bank charges ₱9,000, professional liability insurance ₱80,000, miscellaneous ₱30,000 |
| All other itemized expense fields | ₱0.00 | |
| `prior_quarterly_payments` | [{ period: Q1_2025, amount: 40000.00 }, { period: Q2_2025, amount: 35000.00 }, { period: Q3_2025, amount: 25000.00 }] | Estimated graduated quarterly IT payments under 1701Q; first year above ₱3M — conservative estimates |
| `cwt_2307_entries` | [{ atc: "WI010", income_payment: 2000000.00, tax_withheld: 100000.00, payor: "PQR Corporation", period: "2025-ANNUAL" }, { atc: "WI010", income_payment: 1500000.00, tax_withheld: 75000.00, payor: "STU Holdings Inc", period: "2025-ANNUAL" }, { atc: "WI010", income_payment: 1000000.00, tax_withheld: 50000.00, payor: "VWX Inc", period: "2025-ANNUAL" }] | 5% EWT (WI010): attorney's prior-year gross was below ₱3M → 5% rate applies this year. Next year: clients must switch to 10% (WI011) since current-year gross ≥ ₱3M. |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |
| `prior_payment_for_return` | ₱0.00 | |

**Total itemized expenses:** ₱2,800,000.00 (62.2% of gross receipts)
**Total CWT credits from 2307s:** ₱225,000.00 (WI010 at 5% × 3 entries)

### Expected Intermediate Values

**PL-02 (Classification):**
- `net_gross_receipts` = ₱4,500,000.00
- `taxpayer_tier` = SMALL (₱3,000,000 ≤ ₱4,500,000 < ₱20,000,000)
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER (cost_of_goods_sold = ₱0)

**PL-04 (Eligibility):**
- `path_c_eligible` = false
- `ineligibility_reasons` = [IN-02, IN-03]
  - IN-02: "Gross receipts exceed ₱3,000,000. The 8% income tax option is only available to taxpayers with gross receipts/sales not exceeding ₱3,000,000."
  - IN-03: "Taxpayer is VAT-registered. The 8% income tax option requires non-VAT registration. See NIRC Sec. 24(A)(2)(b) and RR 8-2018 Sec. 2(A)."

**PL-05 (Itemized Deductions):**
- Component verification: 1,500,000 + 480,000 + 120,000 + 60,000 + 36,000 + 180,000 + 60,000 + 30,000 + 334,000 = ₱2,800,000.00
- `total_itemized_deductions` = ₱2,800,000.00
- `ear_cap` = ₱4,500,000 × 0.01 = ₱45,000.00; ear_expense claimed = ₱30,000.00 ≤ ₱45,000.00 → no disallowance
- `nolco_applied` = ₱0.00 (no prior year losses)

**PL-06 (OSD):**
- `osd_amount` = ₱4,500,000.00 × 0.40 = ₱1,800,000.00
- `nti_path_b` = ₱4,500,000.00 − ₱1,800,000.00 = ₱2,700,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱100,000 + ₱75,000 + ₱50,000 = ₱225,000.00

**PL-08 (Path A — Graduated + Itemized):**
- `nti_path_a` = ₱4,500,000.00 − ₱2,800,000.00 = ₱1,700,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,700,000)
  = ₱102,500 + (₱1,700,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱900,000 × 0.25
  = ₱102,500 + ₱225,000.00
  = ₱327,500.00
- `percentage_tax_path_a` = ₱0.00 (VAT-registered)
- `total_tax_path_a` = ₱327,500.00

**PL-09 (Path B — Graduated + OSD):**
- `nti_path_b` = ₱2,700,000.00
- `income_tax_path_b` = graduated_tax_2023(₱2,700,000)
  = ₱402,500 + (₱2,700,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱700,000 × 0.30
  = ₱402,500 + ₱210,000.00
  = ₱612,500.00
- `percentage_tax_path_b` = ₱0.00 (VAT-registered)
- `total_tax_path_b` = ₱612,500.00

**PL-10 (Path C):**
- Ineligible; `total_tax_path_c` = null; `ineligibility_reasons` = [IN-02, IN-03]

**PL-13 (Compare):**
- Path A: ₱327,500.00 ← MINIMUM
- Path B: ₱612,500.00
- Path C: N/A (ineligible)
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱612,500 − ₱327,500 = ₱285,000.00 (Itemized saves vs OSD)
- `savings_vs_worst` = ₱612,500 − ₱327,500 = ₱285,000.00 (only 2 eligible paths; worst = Path B)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱327,500.00
- `total_cwt_credits` = ₱225,000.00
- `quarterly_it_paid` = ₱40,000 + ₱35,000 + ₱25,000 = ₱100,000.00
- `balance_payable` = ₱327,500 − ₱225,000 − ₱100,000 = ₱2,500.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701 (PURELY_SE with itemized deductions requires full 1701; 1701A does not include the Schedule on itemized deductions)
- `form_section` = SCHEDULE_1_ITEMIZED (Schedule 1, deduction schedule for itemized)

**PL-16 (Penalties):** ₱0.00 (on-time filing assumed)

**MRF-028 fires** (trigger: `is_vat_registered = true` AND `selected_path = PATH_A`):
> "As a VAT-registered taxpayer claiming itemized deductions, some of your business purchases may include input VAT that you already credited on your quarterly VAT return (BIR Form 2550Q). Input VAT that is creditable against your output VAT should NOT be included in your income tax deductions — it has already been recovered through your VAT return. Only non-creditable input VAT (from non-VAT-registered suppliers, exempt purchases, or input VAT claimed beyond the allowable input tax) may be deductible as a business expense for income tax purposes. We have computed your income tax based on the expenses you entered as entered. Please verify with a CPA that your expense figures exclude creditable input VAT before filing."

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: SMALL,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 1700000.00,
      itemized_deductions: 2800000.00,
      income_tax: 327500.00,
      percentage_tax: 0.00,
      total_tax: 327500.00
    },
    path_b: {
      eligible: true,
      nti: 2700000.00,
      osd_amount: 1800000.00,
      income_tax: 612500.00,
      percentage_tax: 0.00,
      total_tax: 612500.00
    },
    path_c: {
      eligible: false,
      income_tax: null,
      percentage_tax: null,
      total_tax: null,
      ineligibility_reasons: [
        "IN-02: Gross receipts exceed ₱3,000,000. The 8% option requires gross receipts/sales not exceeding ₱3,000,000.",
        "IN-03: Taxpayer is VAT-registered. The 8% option is only available to non-VAT-registered taxpayers per RR 8-2018 Sec. 2(A)."
      ]
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 285000.00,
    savings_vs_worst: 285000.00
  },

  selected_path: PATH_A,
  income_tax_due: 327500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 327500.00,

  cwt_credits: 225000.00,
  quarterly_it_paid: 100000.00,
  balance_payable: 2500.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701,
  form_section: SCHEDULE_1_ITEMIZED,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [MRF-028],
  ineligibility_notifications: [IN-02, IN-03],
  vat_obligation_notice: "As a VAT-registered taxpayer, you have a separate quarterly VAT filing obligation (BIR Form 2550Q, due on the 25th day after each quarter end). This tool computes income tax only. Your quarterly VAT payable (output VAT minus creditable input VAT) must be computed and filed separately."
}
```

**No WARN-003** (CWT entries present). **No WARN-004** (expense ratio 62.2% > 5%). No other warnings fire.

### Verification

- **Itemized total:** 1,500,000 + 480,000 + 120,000 + 60,000 + 36,000 + 180,000 + 60,000 + 30,000 + 334,000 = **₱2,800,000** ✓
- **EAR cap:** 1% × ₱4,500,000 = ₱45,000; claimed ₱30,000 ≤ ₱45,000 → no disallowance ✓
- **Path A NTI:** 4,500,000 − 2,800,000 = **₱1,700,000** ✓
- **Path A bracket:** NTI ₱1,700,000 in bracket 4 (₱800,001–₱2,000,000): 102,500 + (1,700,000 − 800,000) × 0.25 = 102,500 + 225,000 = **₱327,500** ✓
- **Path B OSD:** 4,500,000 × 0.40 = **₱1,800,000** ✓
- **Path B NTI:** 4,500,000 − 1,800,000 = **₱2,700,000** ✓
- **Path B bracket:** NTI ₱2,700,000 in bracket 5 (₱2,000,001–₱8,000,000): 402,500 + (2,700,000 − 2,000,000) × 0.30 = 402,500 + 210,000 = **₱612,500** ✓
- **Itemized wins because:** E = ₱2,800,000 > OSD = ₱1,800,000 → NTI_A = ₱1,700,000 < NTI_B = ₱2,700,000 → IT_A < IT_B ✓
- **Savings:** 612,500 − 327,500 = **₱285,000** ✓
- **CWT:** WI010 at 5%: 100,000 + 75,000 + 50,000 = **₱225,000** ✓
- **Quarterly paid:** 40,000 + 35,000 + 25,000 = **₱100,000** ✓
- **Balance payable:** 327,500 − 225,000 − 100,000 = **₱2,500** ✓

**Legal basis:** 8% ineligibility: NIRC Sec. 24(A)(2)(b), RR 8-2018 Sec. 2(A). OSD (40%): NIRC Sec. 34(L). Itemized deductions: NIRC Sec. 34(A)–(K). Graduated rates (2023+): NIRC Sec. 24(A)(1), CR-002. VAT registration: NIRC Sec. 109(BB). PT waived for VAT-registered: NIRC Sec. 116. 5% EWT for professionals (prior-year gross <₱3M): RR 2-98 Sec. 2.57.2(E). Form 1701 required for itemized deductions: BIR Form 1701 instructions; 1701A does not contain itemized deduction schedule.

---

## GROUP 2 SUMMARY TABLE

| Vector | Scenario | GR (VAT-excl) | Expenses | Expense% | Optimal Path | Total Tax | Savings vs Next | Form |
|--------|---------|--------------|---------|---------|-------------|-----------|-----------------|------|
| TV-EX-G2-001 | SC-P-VH-O-VAT | ₱6,000,000 | ₱1,500,000 | 25.0% | Path B (OSD) | ₱882,500 | ₱270,000 vs A | 1701A |
| TV-EX-G2-002 | SC-P-VH-I-VAT | ₱4,500,000 | ₱2,800,000 | 62.2% | Path A (Itemized) | ₱327,500 | ₱285,000 vs B | 1701 |

**Key insights validated:**
1. For VAT-registered taxpayers, Path C is always ineligible — both IN-02 (>₱3M) and IN-03 (VAT-registered) fire simultaneously.
2. No percentage tax applies to VAT-registered taxpayers for any path — the OPT (3% under Sec. 116) is mutually exclusive with VAT registration.
3. OSD breakeven for VAT-registered service professionals: Path A wins only when expenses exceed 40% of gross (same arithmetic as non-VAT; the PT cancellation removes the distortion that affects non-VAT breakeven analysis).
4. Path B (OSD) wins when expenses < OSD deduction (TV-EX-G2-001: ₱1.5M expenses < ₱2.4M OSD).
5. Path A (Itemized) wins when expenses > OSD deduction (TV-EX-G2-002: ₱2.8M expenses > ₱1.8M OSD).
6. Form 1701A is used for Path B (OSD) even at large gross levels. Form 1701 is required for Path A (Itemized).

---

## GROUP 3: Mixed Income Earners (Employee + Freelancer)

**5 scenario codes:** SC-M-L-8, SC-M-ML-8, SC-M-MH-8, SC-M-ML-O, SC-M-ML-I

**Common characteristics for all Group 3 vectors:**
- `taxpayer_type`: MIXED_INCOME
- `is_mixed_income`: true
- `is_vat_registered`: false (business gross < ₱3,000,000 in all Group 3 scenarios)
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `cost_of_goods_sold`: ₱0.00 (pure service provider; all biz income is professional/freelance fees)
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): MIXED_INCOME
- `taxpayer_tier` (derived): MICRO (business gross < ₱3,000,000)
- `path_c_eligible` (derived): true (business gross ≤ ₱3M AND not VAT-registered)
- `form` (always): FORM_1701 (mixed income earners ALWAYS use Form 1701 per Rule MIR-01; never 1701A)
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `return_type`: ORIGINAL
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `filing_period`: ANNUAL
- `tax_year`: 2025
- `cwt_2307_entries`: [] (no business CWT unless otherwise specified)
- `prior_quarterly_payments`: [] (no prior quarterly business payments unless specified)
- `prior_payment_for_return`: ₱0.00
- `number_of_form_2316s`: 1 (single employer)

**Critical mixed income rules applied in all Group 3 vectors:**

| Rule | Description | Legal Basis |
|------|-------------|-------------|
| MIR-01 | Always use Form 1701; Form 1701A is prohibited | BIR Form 1701 Instructions; RMC 50-2018 |
| MIR-03 | NO ₱250,000 deduction on 8% business income; tax base = full gross | RMC 50-2018 Sec. 3; RMC 23-2018 |
| MIR-04 | Paths A and B combine compensation NTI + business NTI before graduated table | NIRC Sec. 24(A)(2)(a) |
| MIR-07 | Path C applies 8% to business income only; compensation always at graduated rates | NIRC Sec. 24(A)(2)(b); RMC 50-2018 |
| MIR-08 | ₱3M threshold uses business gross only; compensation excluded | NIRC Sec. 24(A)(2)(b) |

**Path C output structure for mixed income** (differs from pure SE):
- `income_tax_business`: gross_business_receipts × 0.08 (no ₱250K deduction)
- `income_tax_compensation`: graduated_tax_2023(taxable_compensation)
- `total_income_tax`: income_tax_business + income_tax_compensation
- `percentage_tax`: ₱0.00 (PT waived under 8% regime, same as pure SE)
- `combined_nti`: null (not applicable; Path C separates the two income types)
- Note displayed: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)"

---

## TV-EX-G3-001: SC-M-L-8 — Small Side Freelance Income, 8% Optimal

**Scenario code:** SC-M-L-8
**Description:** Full-time office employee earning ₱360,000 annual taxable compensation (₱30,000/month after mandatory deductions), who also earns ₱300,000 from freelance video editing as a side business. No business expenses documented. Path C (8% on business only, no ₱250K deduction) saves ₱19,000 vs OSD and ₱43,000 vs Itemized. Demonstrates that even with small business income well below ₱500K, the 8% rate produces significant savings over combined graduated methods. Compensation is already in bracket 2 (₱250K–₱400K, 15% marginal); adding OSD-reduced business NTI (₱180K) pushes combined NTI into bracket 3 (20% marginal), making Path B more expensive than Path C's flat 8%.

### Input (fields differing from Group 3 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱360,000.00 | ₱30,000/month after SSS, PhilHealth, Pag-IBIG contributions; 13th month (₱30K) exempt from tax under ₱90K ceiling |
| `compensation_cwt` (tax_withheld_by_employer) | ₱16,500.00 | Employer withheld: (₱360,000 − ₱250,000) × 15% = ₱16,500 |
| `gross_receipts` | ₱300,000.00 | Annual freelance video editing fees; ≤₱500K range |
| All itemized expense fields | ₱0.00 each | No receipts kept for business expenses |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-02 (Classification):**
- `net_gross_receipts` = ₱300,000.00 (business gross; compensation excluded from threshold)
- `taxpayer_tier` = MICRO (₱300,000 < ₱3,000,000)
- `income_type` = MIXED_INCOME
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04 (Eligibility):**
- `path_c_eligible` = true (business gross ₱300K ≤ ₱3M AND not VAT-registered)
- Note: eligibility threshold uses business gross only (Rule MIR-08)
- `ineligibility_reasons` = []

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00
- `ear_cap` = ₱300,000 × 0.01 = ₱3,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱300,000 × 0.40 = ₱120,000.00
- `business_nti_path_b` = ₱180,000.00

**PL-07 (CWT):** `total_cwt_business` = ₱0.00 (no business CWT entries)

**PL-08 (Path A — Mixed Income, Itemized = ₱0):**
- `business_nti_path_a` = ₱300,000.00 (no deductions; expenses = ₱0)
- `combined_nti_path_a` = ₱360,000.00 (comp) + ₱300,000.00 (biz) = ₱660,000.00
- `income_tax_path_a` = graduated_tax_2023(₱660,000)
  = ₱22,500 + (₱660,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱52,000.00
  = ₱74,500.00
- `percentage_tax_path_a` = ₱300,000 × 0.03 = ₱9,000.00
- `total_tax_path_a` = ₱83,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱180,000.00 (OSD applied to business gross only)
- `combined_nti_path_b` = ₱360,000.00 (comp) + ₱180,000.00 (biz) = ₱540,000.00
- `income_tax_path_b` = graduated_tax_2023(₱540,000)
  = ₱22,500 + (₱540,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱28,000.00
  = ₱50,500.00
- `percentage_tax_path_b` = ₱9,000.00
- `total_tax_path_b` = ₱59,500.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱360,000)
  = (₱360,000 − ₱250,000) × 0.15
  = ₱16,500.00 (bracket 2: comp ₱360K ∈ [₱250,001, ₱400,000])
- `income_tax_business_path_c` = ₱300,000.00 × 0.08 = ₱24,000.00 (NO ₱250K deduction)
- `percentage_tax_path_c` = ₱0.00 (PT waived under 8%)
- `total_income_tax_path_c` = ₱16,500 + ₱24,000 = ₱40,500.00
- `total_tax_path_c` = ₱40,500.00

**PL-13 (Compare):**
- Path A: ₱83,500.00
- Path B: ₱59,500.00
- Path C: ₱40,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱59,500 − ₱40,500 = ₱19,000.00 (Path C vs Path B)
- `savings_vs_worst` = ₱83,500 − ₱40,500 = ₱43,000.00 (Path C vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱40,500.00
- `compensation_tax_withheld` = ₱16,500.00 (from employer Form 2316)
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱40,500 − ₱16,500 = ₱24,000.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701 (mixed income; Form 1701A prohibited)
- `form_section` = SCHEDULE_3B (8% income tax schedule for mixed income earners)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 300000.00,
      compensation_nti: 360000.00,
      combined_nti: 660000.00,
      income_tax: 74500.00,
      percentage_tax: 9000.00,
      total_tax: 83500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 120000.00,
      business_nti_osd: 180000.00,
      compensation_nti: 360000.00,
      combined_nti: 540000.00,
      income_tax: 50500.00,
      percentage_tax: 9000.00,
      total_tax: 59500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 24000.00,
      income_tax_compensation: 16500.00,
      total_income_tax: 40500.00,
      percentage_tax: 0.00,
      total_tax: 40500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 19000.00,
    savings_vs_worst: 43000.00
  },

  selected_path: PATH_C,
  income_tax_due: 40500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 40500.00,
  compensation_tax_withheld: 16500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 24000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0 / 300,000 = 0% < 5% threshold.

### Verification

- **Path C comp IT:** (360,000 − 250,000) × 0.15 = **₱16,500.00** ✓ (bracket 2: ₱360K ∈ [₱250,001, ₱400,000])
- **Path C biz IT:** 300,000 × 0.08 = **₱24,000.00** ✓ (NO ₱250K deduction per RMC 50-2018)
- **Path C total:** 16,500 + 24,000 = **₱40,500.00** ✓
- **Path B combined NTI:** 360,000 + 180,000 = 540,000; bracket 3: 22,500 + 140,000 × 0.20 = **₱50,500.00** IT ✓; PT = **₱9,000.00** ✓; total B = **₱59,500.00** ✓
- **Path A combined NTI:** 360,000 + 300,000 = 660,000; bracket 3: 22,500 + 260,000 × 0.20 = **₱74,500.00** IT ✓; total A = **₱83,500.00** ✓
- **Why Path B costs more than Path C:** Adding OSD-reduced biz NTI (₱180K) to comp (₱360K) = ₱540K combined NTI → bracket 3 at 20% marginal → IT = ₱50,500 + PT ₱9K = ₱59.5K vs Path C flat 8% on ₱300K + comp graduated = ₱40.5K total. ✓
- **Balance:** 40,500 − 16,500 = **₱24,000.00** ✓

**Legal basis:** Path C (8%): NIRC Sec. 24(A)(2)(b) as amended by TRAIN (RA 10963). No ₱250K deduction for mixed income: RMC 50-2018 Sec. 3. PT waiver: RR 8-2018 Sec. 2(B). Form 1701 (not 1701A) for mixed income: BIR Form 1701 Instructions. Graduated rates (2023+): CR-002.

---

## TV-EX-G3-002: SC-M-ML-8 — Moderate Side Income, 8% Optimal (Expenses Present)

**Scenario code:** SC-M-ML-8
**Description:** Government agency employee earning ₱360,000 taxable compensation who freelances as a data analyst, earning ₱700,000 from corporate clients with ₱100,000 in documented business expenses (14.3% expense ratio). Path C (8% on business, graduated on comp) saves ₱47,000 vs OSD and ₱91,000 vs Itemized. Despite having documented expenses, 8% wins decisively because the high compensation pushes combined NTI into bracket 3 (20% marginal) for Paths A and B, while Path C's separated computation keeps compensation at bracket 2 (15%) and applies 8% to the full business gross.

Note: TV-BASIC-003 (basic.md) covers SC-M-ML-8 with taxable_comp=₱480,000, biz_gross=₱600,000, ₱0 expenses. This vector uses different inputs (₱360K comp, ₱700K biz, ₱100K documented expenses) to provide independent verification.

### Input (fields differing from Group 3 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱360,000.00 | ₱30,000/month government salary after GSIS, PhilHealth, Pag-IBIG; 13th month (₱30K) exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱16,500.00 | Government agency withheld: (₱360,000 − ₱250,000) × 15% = ₱16,500 |
| `gross_receipts` | ₱700,000.00 | Annual data analytics consulting fees; ₱500K–₱1M range |
| `itemized_expenses.rent` | ₱48,000.00 | Shared coworking space desk rental ₱4,000/month × 12 |
| `itemized_expenses.communication` | ₱24,000.00 | Dedicated fiber internet ₱2,000/month × 12 |
| `itemized_expenses.supplies` | ₱18,000.00 | Software subscriptions (data tools), cloud compute ₱1,500/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | BIR registration ₱500, city business permit ₱9,500 |
| All other itemized expense fields | ₱0.00 | |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |

**Total itemized business expenses:** ₱100,000.00 (14.3% of gross receipts)

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = 48,000 + 24,000 + 18,000 + 10,000 = ₱100,000.00
- `ear_cap` = ₱700,000 × 0.01 = ₱7,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱700,000 × 0.40 = ₱280,000.00
- `business_nti_path_b` = ₱420,000.00

**PL-08 (Path A — Mixed Income, Itemized):**
- `business_nti_path_a` = 700,000 − 100,000 = ₱600,000.00
- `combined_nti_path_a` = ₱360,000 (comp) + ₱600,000 (biz) = ₱960,000.00
- `income_tax_path_a` = graduated_tax_2023(₱960,000)
  = ₱102,500 + (₱960,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱40,000.00
  = ₱142,500.00
- `percentage_tax_path_a` = ₱700,000 × 0.03 = ₱21,000.00
- `total_tax_path_a` = ₱163,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱420,000.00
- `combined_nti_path_b` = ₱360,000 + ₱420,000 = ₱780,000.00
- `income_tax_path_b` = graduated_tax_2023(₱780,000)
  = ₱22,500 + (₱780,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱76,000.00
  = ₱98,500.00
- `percentage_tax_path_b` = ₱21,000.00
- `total_tax_path_b` = ₱119,500.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱360,000)
  = (₱360,000 − ₱250,000) × 0.15 = ₱16,500.00 (bracket 2)
- `income_tax_business_path_c` = ₱700,000 × 0.08 = ₱56,000.00 (NO ₱250K deduction)
- `percentage_tax_path_c` = ₱0.00
- `total_income_tax_path_c` = ₱16,500 + ₱56,000 = ₱72,500.00
- `total_tax_path_c` = ₱72,500.00

**PL-13 (Compare):**
- Path A: ₱163,500.00
- Path B: ₱119,500.00
- Path C: ₱72,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱119,500 − ₱72,500 = ₱47,000.00
- `savings_vs_worst` = ₱163,500 − ₱72,500 = ₱91,000.00

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱72,500.00
- `compensation_tax_withheld` = ₱16,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱72,500 − ₱16,500 = ₱56,000.00

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = SCHEDULE_3B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 600000.00,
      itemized_deductions: 100000.00,
      compensation_nti: 360000.00,
      combined_nti: 960000.00,
      income_tax: 142500.00,
      percentage_tax: 21000.00,
      total_tax: 163500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 280000.00,
      business_nti_osd: 420000.00,
      compensation_nti: 360000.00,
      combined_nti: 780000.00,
      income_tax: 98500.00,
      percentage_tax: 21000.00,
      total_tax: 119500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 56000.00,
      income_tax_compensation: 16500.00,
      total_income_tax: 72500.00,
      percentage_tax: 0.00,
      total_tax: 72500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 47000.00,
    savings_vs_worst: 91000.00
  },

  selected_path: PATH_C,
  income_tax_due: 72500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 72500.00,
  compensation_tax_withheld: 16500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 56000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

No warnings fire: WARN-004 does not fire (expense ratio 14.3% > 5%). WARN-003 does not fire (PATH_C recommended, no requirement for CWT advisory).

### Verification

- **Itemized total:** 48,000 + 24,000 + 18,000 + 10,000 = **₱100,000.00** ✓
- **Path C comp IT:** (360,000 − 250,000) × 0.15 = **₱16,500.00** ✓ (bracket 2)
- **Path C biz IT:** 700,000 × 0.08 = **₱56,000.00** ✓ (no ₱250K deduction)
- **Path C total:** 16,500 + 56,000 = **₱72,500.00** ✓
- **Path B combined NTI:** 360,000 + 420,000 = 780,000; bracket 3: 22,500 + 380,000 × 0.20 = **₱98,500.00** IT ✓; total B = 98,500 + 21,000 = **₱119,500.00** ✓
- **Path A combined NTI:** 360,000 + 600,000 = 960,000; bracket 4: 102,500 + 160,000 × 0.25 = **₱142,500.00** IT ✓; total A = **₱163,500.00** ✓
- **Savings:** 119,500 − 72,500 = **₱47,000.00** ✓
- **Balance:** 72,500 − 16,500 = **₱56,000.00** ✓

**Legal basis:** Same as TV-EX-G3-001. OSD: NIRC Sec. 34(L). GSIS contributions: deductible from compensation under same rules as SSS (both are mandatory contributions under RA 8291 / RA 11199).

---

## TV-EX-G3-003: SC-M-MH-8 — Significant Side Income, 8% Wins Despite High Expenses

**Scenario code:** SC-M-MH-8
**Description:** Corporate HR manager earning ₱550,000 annual taxable compensation (₱45,833/month) who also runs a freelance recruitment consultancy earning ₱1,200,000 with ₱450,000 in documented expenses (37.5% expense ratio). Path C (8% on business) saves ₱107,500 vs OSD and ₱115,000 vs Itemized. Critical insight: even with 37.5% expenses (moderately documented business), 8% wins for mixed income earners with high compensation because the compensation already pushes the combined NTI deep into bracket 4 (25% marginal) for Paths A and B. Path C separates the computation — compensation is taxed in bracket 3 (20% marginal on ₱150K excess) and business income at 8% flat — avoiding the 25% marginal rate on business NTI.

### Input (fields differing from Group 3 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱550,000.00 | ₱45,833/month after mandatory deductions; 13th month (₱45,833 or prorated) ≤ ₱90K exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱52,500.00 | Employer withheld: 22,500 + (₱550,000 − ₱400,000) × 20% = ₱52,500 |
| `gross_receipts` | ₱1,200,000.00 | Annual recruitment consulting fees; ₱1M–₱2M range |
| `itemized_expenses.salaries_wages` | ₱240,000.00 | 2 part-time research assistants at ₱10,000/month each × 12 |
| `itemized_expenses.rent` | ₱120,000.00 | Small office space ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | Electricity and internet ₱3,000/month × 12 |
| `itemized_expenses.supplies` | ₱24,000.00 | Office supplies and subscription tools ₱2,000/month × 12 |
| `itemized_expenses.communication` | ₱18,000.00 | Business phone and broadband ₱1,500/month × 12 |
| `itemized_expenses.depreciation` | ₱12,000.00 | Laptop (₱60,000 cost, 5-year straight-line = ₱12,000/year) |
| All other itemized expense fields | ₱0.00 | |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |

**Total itemized business expenses:** ₱450,000.00 (37.5% of gross receipts)

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = 240,000 + 120,000 + 36,000 + 24,000 + 18,000 + 12,000 = ₱450,000.00
- `ear_cap` = ₱1,200,000 × 0.01 = ₱12,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱1,200,000 × 0.40 = ₱480,000.00
- `business_nti_path_b` = ₱720,000.00

**PL-08 (Path A — Mixed Income, Itemized):**
- `business_nti_path_a` = 1,200,000 − 450,000 = ₱750,000.00
- `combined_nti_path_a` = ₱550,000 (comp) + ₱750,000 (biz) = ₱1,300,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,300,000)
  = ₱102,500 + (₱1,300,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱125,000.00
  = ₱227,500.00
- `percentage_tax_path_a` = ₱1,200,000 × 0.03 = ₱36,000.00
- `total_tax_path_a` = ₱263,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱720,000.00
- `combined_nti_path_b` = ₱550,000 + ₱720,000 = ₱1,270,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,270,000)
  = ₱102,500 + (₱1,270,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱117,500.00
  = ₱220,000.00
- `percentage_tax_path_b` = ₱36,000.00
- `total_tax_path_b` = ₱256,000.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱550,000)
  = ₱22,500 + (₱550,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱30,000.00
  = ₱52,500.00 (bracket 3)
- `income_tax_business_path_c` = ₱1,200,000 × 0.08 = ₱96,000.00 (NO ₱250K deduction)
- `percentage_tax_path_c` = ₱0.00
- `total_income_tax_path_c` = ₱52,500 + ₱96,000 = ₱148,500.00
- `total_tax_path_c` = ₱148,500.00

**PL-13 (Compare):**
- Path A: ₱263,500.00
- Path B: ₱256,000.00
- Path C: ₱148,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱256,000 − ₱148,500 = ₱107,500.00 (vs Path B)
- `savings_vs_worst` = ₱263,500 − ₱148,500 = ₱115,000.00 (vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱148,500.00
- `compensation_tax_withheld` = ₱52,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱148,500 − ₱52,500 = ₱96,000.00

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = SCHEDULE_3B

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 750000.00,
      itemized_deductions: 450000.00,
      compensation_nti: 550000.00,
      combined_nti: 1300000.00,
      income_tax: 227500.00,
      percentage_tax: 36000.00,
      total_tax: 263500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 480000.00,
      business_nti_osd: 720000.00,
      compensation_nti: 550000.00,
      combined_nti: 1270000.00,
      income_tax: 220000.00,
      percentage_tax: 36000.00,
      total_tax: 256000.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 96000.00,
      income_tax_compensation: 52500.00,
      total_income_tax: 148500.00,
      percentage_tax: 0.00,
      total_tax: 148500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 107500.00,
    savings_vs_worst: 115000.00
  },

  selected_path: PATH_C,
  income_tax_due: 148500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 148500.00,
  compensation_tax_withheld: 52500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 96000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

No warnings fire: WARN-004 does not fire (37.5% > 5%). WARN-003 does not fire (PATH_C recommended).

### Verification

- **Itemized total:** 240,000 + 120,000 + 36,000 + 24,000 + 18,000 + 12,000 = **₱450,000.00** ✓
- **Path C comp IT:** 22,500 + (550,000 − 400,000) × 0.20 = **₱52,500.00** ✓ (bracket 3: ₱550K ∈ [₱400,001, ₱800,000])
- **Path C biz IT:** 1,200,000 × 0.08 = **₱96,000.00** ✓ (no ₱250K deduction)
- **Path C total:** 52,500 + 96,000 = **₱148,500.00** ✓
- **Path B combined NTI:** 550,000 + 720,000 = 1,270,000; bracket 4: 102,500 + 470,000 × 0.25 = **₱220,000.00** ✓; total B = **₱256,000.00** ✓
- **Path A combined NTI:** 550,000 + 750,000 = 1,300,000; bracket 4: 102,500 + 500,000 × 0.25 = **₱227,500.00** ✓; total A = **₱263,500.00** ✓
- **Key analysis:** Expenses (37.5%) exceed 8% base of (1.0 = full gross) only at very high expense ratios. For this mixed income earner, the combined NTI breakeven (where Path A = Path C) requires: graduated(comp + biz − E) + PT = comp_IT + biz × 0.08 → E must bring combined NTI to ~₱1,080,000 → biz_NTI ≈ ₱530,000 → E ≈ ₱670,000 (55.8% of biz gross). At 37.5% (₱450K), E < breakeven → Path C wins. ✓
- **Balance:** 148,500 − 52,500 = **₱96,000.00** ✓

**Legal basis:** Same as TV-EX-G3-001. EAR cap for service providers: RR 10-2002, Sec. 3 (1% of gross receipts). Salaries deductible: NIRC Sec. 34(A)(1). Depreciation: NIRC Sec. 34(F); RR 12-2012.

---

## TV-EX-G3-004: SC-M-ML-O — Very Low Compensation, OSD Beats 8% (Counterintuitive)

**Scenario code:** SC-M-ML-O
**Description:** Part-time student worker earning ₱60,000 annual taxable compensation (₱5,000/month from a part-time job, well below the ₱250,000 zero-tax bracket) who also earns ₱600,000 from freelance UI/UX design. **Counterintuitive result: Path B (OSD) beats Path C (8%)** by ₱3,500. This is the mixed-income analogue of the pure-SE OSD-wins window, but the mechanism differs: the ₱250K deduction prohibition makes Path C more expensive than it would be for pure SE (₱600K × 8% = ₱48K vs pure SE: (₱600K − ₱250K) × 8% = ₱28K), while the low compensation (₱60K, zero comp IT) keeps the OSD-reduced combined NTI (₱420K) just barely into bracket 3 — only ₱20K above the ₱400K threshold — generating just ₱4,000 in incremental income tax. The PT cost of ₱18K is partly offset by the low IT, producing a Path B total of ₱44,500 < Path C ₱48,000. This scenario validates the engine's mixed-income OSD-wins zone and confirms the tie-break rule (Path C preferred on tie) is not triggered here since Path B is genuinely cheaper.

### Input (fields differing from Group 3 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱60,000.00 | Part-time retail job: ₱5,000/month × 12; all below ₱250,000 zero-bracket; no tax withheld |
| `compensation_cwt` (tax_withheld_by_employer) | ₱0.00 | Compensation below ₱250K zero bracket; employer correctly withheld ₱0 |
| `gross_receipts` | ₱600,000.00 | Annual UI/UX freelance project fees; ₱500K–₱1M range |
| All itemized expense fields | ₱0.00 each | No receipts maintained for business expenses |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00
- `ear_cap` = ₱600,000 × 0.01 = ₱6,000.00; no EAR expense claimed

**PL-06 (OSD):**
- `osd_amount` = ₱600,000 × 0.40 = ₱240,000.00
- `business_nti_path_b` = ₱360,000.00

**PL-08 (Path A — Mixed Income, no expenses):**
- `business_nti_path_a` = ₱600,000.00 (no deductions)
- `combined_nti_path_a` = ₱60,000 (comp) + ₱600,000 (biz) = ₱660,000.00
- `income_tax_path_a` = graduated_tax_2023(₱660,000)
  = ₱22,500 + (₱660,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱52,000.00
  = ₱74,500.00
- `percentage_tax_path_a` = ₱600,000 × 0.03 = ₱18,000.00
- `total_tax_path_a` = ₱92,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱360,000.00
- `combined_nti_path_b` = ₱60,000 (comp) + ₱360,000 (biz) = ₱420,000.00
- `income_tax_path_b` = graduated_tax_2023(₱420,000)
  = ₱22,500 + (₱420,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱4,000.00
  = ₱26,500.00
- `percentage_tax_path_b` = ₱18,000.00
- `total_tax_path_b` = ₱44,500.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱60,000) = ₱0.00 (below ₱250K)
- `income_tax_business_path_c` = ₱600,000 × 0.08 = ₱48,000.00 (NO ₱250K deduction)
- `percentage_tax_path_c` = ₱0.00
- `total_income_tax_path_c` = ₱0 + ₱48,000 = ₱48,000.00
- `total_tax_path_c` = ₱48,000.00

**PL-13 (Compare):**
- Path A: ₱92,500.00
- Path B: ₱44,500.00 ← MINIMUM
- Path C: ₱48,000.00
- `recommended_path` = PATH_B
  (Path B < Path C: ₱44,500 < ₱48,000; tie-break not triggered)
- `savings_vs_next_best` = ₱48,000 − ₱44,500 = ₱3,500.00 (Path B vs Path C)
- `savings_vs_worst` = ₱92,500 − ₱44,500 = ₱48,000.00 (Path B vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱44,500.00
- `compensation_tax_withheld` = ₱0.00 (no employer withholding)
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱44,500.00

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = PART_IV_A (graduated + OSD section of Form 1701)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 600000.00,
      compensation_nti: 60000.00,
      combined_nti: 660000.00,
      income_tax: 74500.00,
      percentage_tax: 18000.00,
      total_tax: 92500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 240000.00,
      business_nti_osd: 360000.00,
      compensation_nti: 60000.00,
      combined_nti: 420000.00,
      income_tax: 26500.00,
      percentage_tax: 18000.00,
      total_tax: 44500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 48000.00,
      income_tax_compensation: 0.00,
      total_income_tax: 48000.00,
      percentage_tax: 0.00,
      total_tax: 48000.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_B,
    savings_vs_next_best: 3500.00,
    savings_vs_worst: 48000.00
  },

  selected_path: PATH_B,
  income_tax_due: 44500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 44500.00,
  compensation_tax_withheld: 0.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 44500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003, WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_B (not PATH_C) and no business CWT entries provided. Advisory: "Recommended path is Path B (OSD). No business creditable withholding tax (Form 2307) entries were provided. If your freelance clients are corporations or individuals required to withhold tax (e.g., companies paying design services at 2% TWA rate or 5% professional rate), please check if they have issued Form 2307s. Unrecorded CWT credits would further reduce your balance payable."

**WARN-004** fires: total_itemized / gross_receipts = 0 / 600,000 = 0% < 5% threshold.

### Verification

- **Path B combined NTI:** 60,000 + 360,000 = 420,000; bracket 3: 22,500 + (420,000 − 400,000) × 0.20 = 22,500 + 4,000 = **₱26,500.00** ✓
- **Path B PT:** 600,000 × 0.03 = **₱18,000.00** ✓; total B = 26,500 + 18,000 = **₱44,500.00** ✓
- **Path C biz IT:** 600,000 × 0.08 = **₱48,000.00** ✓ (no ₱250K deduction — key result)
- **Path C comp IT:** graduated(60,000) = **₱0.00** ✓ (below ₱250K zero bracket)
- **Path B wins over Path C because:** The ₱250K deduction prohibition inflates Path C cost from ₱28K (if pure SE) to ₱48K (mixed income). Meanwhile Path B's OSD reduces combined NTI to ₱420K, landing just ₱20K above bracket 3 threshold → incremental IT = ₱4,000. Even adding ₱18K PT: total B = ₱44.5K < ₱48K. The 8% deduction prohibition creates a mixed-income OSD-wins zone that doesn't exist for pure SE at this gross level. ✓
- **For pure SE comparison:** A pure SE taxpayer at ₱600K gross with no expenses would get: Path C = (600,000 − 250,000) × 0.08 = **₱28,000** (vs ₱48,000 here). The ₱20,000 difference shows the full cost of the mixed-income ₱250K prohibition. Path B for pure SE at ₱600K = grad(360K) + PT = 22,500 + (360K−400K... no: 360K < 400K so bracket 2) → 16,500 + 18,000 = ₱34,500. Path C wins for pure SE (₱28K < ₱34.5K). For mixed income, the reversed recommendation (Path B) arises solely from the RMC 50-2018 ₱250K prohibition. ✓
- **Balance:** ₱44,500 − ₱0 = **₱44,500.00** ✓

**Legal basis:** OSD (40%): NIRC Sec. 34(L). No ₱250K deduction for mixed income: RMC 50-2018 Sec. 3. Compensation below ₱250K: ₱0 income tax per NIRC Sec. 24(A)(2)(a) (bracket 1). PT: NIRC Sec. 116 (3%). PT under 8%: NIRC Sec. 24(A)(2)(b) "in lieu of" percentage tax. Form 1701: BIR Form 1701 Instructions.

---

## TV-EX-G3-005: SC-M-ML-I — High Compensation, Very High Business Expenses, Itemized Wins

**Scenario code:** SC-M-ML-I
**Description:** Marketing director earning ₱480,000 taxable compensation (₱40,000/month) who runs a freelance brand strategy consultancy earning ₱800,000 with ₱650,000 in documented business expenses (81.25% expense ratio — subcontract-heavy model). Path A (Itemized + combined graduated) saves ₱10,000 vs Path C and ₱74,000 vs Path B. This is the scenario where itemized deductions win for a mixed income earner: the very high expense ratio (81.25%) reduces business NTI to just ₱150,000, keeping the combined NTI at ₱630,000 — a bracket 3 result (20% marginal on ₱230K excess). Under Path C, the ₱250K deduction prohibition forces 8% on the full ₱800K, producing ₱64K business IT plus ₱38.5K comp IT = ₱102.5K total — more than Itemized's ₱92.5K. The breakeven expense ratio for this taxpayer profile (₱480K comp + ₱800K biz) is approximately 75%: at 81.25% (> 75%), Itemized wins.

### Input (fields differing from Group 3 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱480,000.00 | ₱40,000/month after mandatory deductions; 13th month (₱40K) exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱38,500.00 | Employer withheld: 22,500 + (₱480,000 − ₱400,000) × 20% = ₱38,500 |
| `gross_receipts` | ₱800,000.00 | Annual brand strategy consulting fees; ₱500K–₱1M range |
| `itemized_expenses.salaries_wages` | ₱500,000.00 | Subcontracted designers and copywriters (project-based, with BIR-registered invoices; 2% EWT applied and remitted) |
| `itemized_expenses.rent` | ₱60,000.00 | Home office apportioned rent (exclusive-use room): ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱30,000.00 | Electricity and internet apportioned to home office: ₱2,500/month × 12 |
| `itemized_expenses.depreciation` | ₱60,000.00 | Professional camera (₱120,000 cost, 2-year SL = ₱60,000/year) and laptop (₱60,000 cost, 5-year SL = ₱12,000/year); combined ₱72,000 → capped at annual expense input ₱60,000 (see note) |
| All other itemized expense fields | ₱0.00 | |
| `elected_regime` | null | Optimizer mode |
| `osd_elected` | null | Engine recommends |

**Note on depreciation:** Camera ₱120K/2yr = ₱60K/yr + laptop ₱60K/5yr = ₱12K/yr = ₱72K total. However, home office camera qualifies for 2-year depreciation (< 5-year useful life for professional camera under RR 12-2012). For this vector, the total depreciation input is ₱60,000 (conservative figure used for clarity; actual ₱72K would further support Path A).

**Total itemized business expenses:** ₱500,000 + ₱60,000 + ₱30,000 + ₱60,000 = **₱650,000.00** (81.25% of gross receipts)

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = 500,000 + 60,000 + 30,000 + 60,000 = ₱650,000.00
- `ear_cap` = ₱800,000 × 0.01 = ₱8,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱800,000 × 0.40 = ₱320,000.00
- `business_nti_path_b` = ₱480,000.00

**PL-08 (Path A — Mixed Income, Itemized):**
- `business_nti_path_a` = 800,000 − 650,000 = ₱150,000.00
- `combined_nti_path_a` = ₱480,000 (comp) + ₱150,000 (biz) = ₱630,000.00
- `income_tax_path_a` = graduated_tax_2023(₱630,000)
  = ₱22,500 + (₱630,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱46,000.00
  = ₱68,500.00 (bracket 3)
- `percentage_tax_path_a` = ₱800,000 × 0.03 = ₱24,000.00
- `total_tax_path_a` = ₱92,500.00

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱480,000.00
- `combined_nti_path_b` = ₱480,000 (comp) + ₱480,000 (biz) = ₱960,000.00
- `income_tax_path_b` = graduated_tax_2023(₱960,000)
  = ₱102,500 + (₱960,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱40,000.00
  = ₱142,500.00 (bracket 4)
- `percentage_tax_path_b` = ₱24,000.00
- `total_tax_path_b` = ₱166,500.00

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱480,000)
  = ₱22,500 + (₱480,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱16,000.00
  = ₱38,500.00 (bracket 3)
- `income_tax_business_path_c` = ₱800,000 × 0.08 = ₱64,000.00 (NO ₱250K deduction)
- `percentage_tax_path_c` = ₱0.00
- `total_income_tax_path_c` = ₱38,500 + ₱64,000 = ₱102,500.00
- `total_tax_path_c` = ₱102,500.00

**PL-13 (Compare):**
- Path A: ₱92,500.00 ← MINIMUM
- Path B: ₱166,500.00
- Path C: ₱102,500.00
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱102,500 − ₱92,500 = ₱10,000.00 (Path A vs Path C)
- `savings_vs_worst` = ₱166,500 − ₱92,500 = ₱74,000.00 (Path A vs Path B)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱92,500.00
- `compensation_tax_withheld` = ₱38,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱92,500 − ₱38,500 = ₱54,000.00

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = SCHEDULE_1_ITEMIZED (itemized deduction schedule of Form 1701)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 150000.00,
      itemized_deductions: 650000.00,
      compensation_nti: 480000.00,
      combined_nti: 630000.00,
      income_tax: 68500.00,
      percentage_tax: 24000.00,
      total_tax: 92500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 320000.00,
      business_nti_osd: 480000.00,
      compensation_nti: 480000.00,
      combined_nti: 960000.00,
      income_tax: 142500.00,
      percentage_tax: 24000.00,
      total_tax: 166500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 64000.00,
      income_tax_compensation: 38500.00,
      total_income_tax: 102500.00,
      percentage_tax: 0.00,
      total_tax: 102500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 10000.00,
    savings_vs_worst: 74000.00
  },

  selected_path: PATH_A,
  income_tax_due: 92500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 92500.00,
  compensation_tax_withheld: 38500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 54000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_1_ITEMIZED,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_A and no business CWT entries provided. Advisory: "Recommended path is Path A (Itemized Deductions). No creditable withholding tax (Form 2307) entries were provided. Corporate clients paying subcontractors or consultants are required to withhold EWT (2% TWA or 5% professional rate). Please verify whether your clients have issued Form 2307s and enter them to correctly compute your balance payable."

### Verification

- **Itemized total:** 500,000 + 60,000 + 30,000 + 60,000 = **₱650,000.00** ✓
- **Path A biz NTI:** 800,000 − 650,000 = **₱150,000.00** ✓
- **Path A combined NTI:** 480,000 + 150,000 = **₱630,000.00** ✓; bracket 3: 22,500 + 230,000 × 0.20 = **₱68,500.00** IT ✓
- **Path A PT:** 800,000 × 0.03 = **₱24,000.00** ✓; total A = 68,500 + 24,000 = **₱92,500.00** ✓
- **Path B combined NTI:** 480,000 + 480,000 = **₱960,000.00** ✓; bracket 4: 102,500 + 160,000 × 0.25 = **₱142,500.00** IT ✓; total B = **₱166,500.00** ✓
- **Path C comp IT:** 22,500 + 80,000 × 0.20 = **₱38,500.00** ✓; biz IT = 800,000 × 0.08 = **₱64,000.00** ✓; total C = **₱102,500.00** ✓
- **Breakeven derivation for this taxpayer:** Path A = Path C when:
  graduated(480K + 800K − E) + 24K = 38,500 + 64,000 = 102,500
  → graduated(1,280K − E) = 78,500
  → Solve in bracket 3: 22,500 + (NTI − 400K) × 0.20 = 78,500 → NTI = 680,000
  → 1,280K − E = 680K → E = 600,000 → breakeven ratio = 600,000 / 800,000 = 75.0%
  At 81.25% (E = ₱650K) > 75.0% breakeven → Path A wins ✓
- **EAR cap:** 1% × 800,000 = ₱8,000; no EAR expense claimed → no disallowance ✓
- **Balance:** 92,500 − 38,500 = **₱54,000.00** ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)–(K). Subcontractor payments deductible as ordinary/necessary business expenses per Sec. 34(A)(1). Home office (exclusive use portion): Sec. 34(A)(1). Depreciation: Sec. 34(F); RR 12-2012. PT: NIRC Sec. 116. Form 1701 with itemized schedule: BIR Form 1701 instructions (Form 1701A does not contain the itemized deduction schedule).

---

## GROUP 3 SUMMARY TABLE

| Vector | Scenario | Comp | Biz GR | Biz Expenses | Expense% | Optimal Path | Total Tax | Savings vs Next | Form |
|--------|---------|------|--------|-------------|---------|-------------|-----------|-----------------|------|
| TV-EX-G3-001 | SC-M-L-8 | ₱360,000 | ₱300,000 | ₱0 | 0% | Path C (8%) | ₱40,500 | ₱19,000 vs B | 1701 |
| TV-EX-G3-002 | SC-M-ML-8 | ₱360,000 | ₱700,000 | ₱100,000 | 14.3% | Path C (8%) | ₱72,500 | ₱47,000 vs B | 1701 |
| TV-EX-G3-003 | SC-M-MH-8 | ₱550,000 | ₱1,200,000 | ₱450,000 | 37.5% | Path C (8%) | ₱148,500 | ₱107,500 vs B | 1701 |
| TV-EX-G3-004 | SC-M-ML-O | ₱60,000 | ₱600,000 | ₱0 | 0% | Path B (OSD) | ₱44,500 | ₱3,500 vs C | 1701 |
| TV-EX-G3-005 | SC-M-ML-I | ₱480,000 | ₱800,000 | ₱650,000 | 81.25% | Path A (Itemized) | ₱92,500 | ₱10,000 vs C | 1701 |

**Key insights validated:**
1. Mixed income earners should almost always elect 8% on business income (TV-EX-G3-001, 002, 003): even with moderate documented expenses (37.5%), Path C wins because high compensation pushes combined NTI into higher brackets under Paths A and B.
2. The ₱250,000 deduction prohibition (RMC 50-2018) makes Path C more expensive for mixed income than for pure SE: TV-EX-G3-001 Path C = ₱40,500 vs equivalent pure SE = (300K−250K)×0.08 = ₱4,000. The compensation adds ₱16,500 comp IT and the ₱250K deduction prohibition adds ₱20,000 to business IT. Total extra cost = ₱36,500.
3. Path B (OSD) can beat Path C for mixed income earners with very low compensation (TV-EX-G3-004: ₱60K comp + ₱600K biz → Path B ₱44,500 < Path C ₱48,000). This counterintuitive result arises solely from the ₱250K deduction prohibition inflating Path C's business IT.
4. Path A (Itemized) wins when expense ratio exceeds ~75% for this income profile (TV-EX-G3-005: 81.25% expense ratio → Path A ₱92,500 < Path C ₱102,500).
5. Form 1701 is mandatory for ALL mixed income earners regardless of regime elected — no exception (Rule MIR-01).
6. PT (3%) is waived under Path C (8%) for both pure SE and mixed income: this is a key Path C advantage that partially offsets the ₱250K deduction prohibition cost.
7. MRF-028 fires for all VAT-registered Path A users to flag potential double-counting of creditable input VAT in the expense inputs.

---

## GROUP 4: First-Year / New Registrants

**5 scenario codes:** SC-FIRST-8, SC-FIRST-O, SC-FIRST-MID-Q2, SC-FIRST-MID-Q3, SC-FIRST-MID-Q4

**Cross-reference note:**
- **SC-FIRST-MID-Q2** is fully specified in [edge-cases.md](edge-cases.md) as **TV-EDGE-009** (mid-year Q2 registrant, 8% elected, ₱850K gross, balance ₱20,000).
- **SC-FIRST-MID-Q4** is fully specified in [edge-cases.md](edge-cases.md) as **TV-EDGE-016** (Q4 registrant, ₱220K gross, no quarterly returns, 8% wins with ₱0 tax).
- This section provides the 3 remaining vectors: SC-FIRST-8, SC-FIRST-O, SC-FIRST-MID-Q3.

**Common characteristics for all Group 4 vectors:**
- `is_first_year_registrant`: true
- `prior_year_gross_receipts`: ₱0.00 (no prior year in business)
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_vat_registered`: false (all below ₱3,000,000)
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `cost_of_goods_sold`: ₱0.00 (service providers)
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `taxpayer_tier` (derived): MICRO (default for first-year taxpayers with no prior-year data; actual tier based on first-year gross if it exceeds ₱3M, but all Group 4 vectors are below ₱3M)
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): PURELY_SE
- `path_c_eligible` (derived): true (gross ≤ ₱3M, not VAT-registered)
- `prior_year_excess_cwt`: ₱0.00
- `return_type`: ORIGINAL
- `prior_payment_for_return`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `nolco_carryover`: ₱0.00 (first year, no prior losses)
- EWT rate from clients: 5% (new taxpayer; prior-year gross = ₱0 → falls below ₱3M threshold for rate determination)
- `tax_year`: 2025

**First-year election mechanics (applies to all Group 4):**
- The 8% or OSD election is made on the **first quarterly 1701Q return** for the registration year.
- For Q1 registrants (SC-FIRST-8, SC-FIRST-O): the election quarter is Q1; the Q1 1701Q (due May 15) is the election return.
- For Q2 registrants (SC-FIRST-MID-Q2): the election quarter is Q2; Q2 1701Q (due August 15) is the election return.
- For Q3 registrants (SC-FIRST-MID-Q3): the election quarter is Q3; Q3 1701Q (due November 15) is the election return.
- For Q4 registrants (SC-FIRST-MID-Q4): no quarterly return is filed for the registration year; the election is made on the annual 1701/1701A (due April 15 of the following year).
- Once elected on the first quarterly return, the election is **irrevocable** for the rest of the taxable year.
- The engine must NOT flag missing 1701Q returns for quarters before the registration quarter.

---

## TV-EX-G4-001: SC-FIRST-8 — Q1 Registrant, Full-Year, 8% Elected

**Scenario code:** SC-FIRST-8
**Description:** A newly registered freelance graphic designer (personal brand studio) who registers with the BIR on February 10, 2025 (Q1). She elects the 8% flat rate on her first Q1 1701Q (due May 15, 2025). The election is irrevocable for TY2025. She earns ₱900,000 total across the year (₱180,000 in Q1, rising each quarter). This is the canonical happy-path first-year scenario showing the full three-quarter cycle plus annual reconciliation. Q1 yields a NIL return (gross below ₱250K); Q2 and Q3 generate payments; annual shows a balance due.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (fields differing from Group 4 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱900,000.00 | Full-year gross (Feb 10 – Dec 31, 2025) |
| `registration_quarter` | `1` | Registered February 10, 2025 (Q1 = Jan–Mar) |
| `elected_regime` | `ELECT_EIGHT_PCT` | Elected 8% on Q1 1701Q (May 15, 2025) |
| All itemized expense fields | ₱0.00 each | No business expenses claimed |
| `cwt_2307_entries` | `[]` | No withholding clients in first year |
| `prior_quarterly_payments` | `[{Q1: 0.00}, {Q2: 12,000.00}, {Q3: 20,000.00}]` | See quarterly computation below |
| `actual_filing_date` | `2026-04-15` | Filed on time |

**Quarterly gross breakdown:**
- Q1 (Feb 10 – Mar 31, 2025): ₱180,000.00
- Q2 (Apr – Jun, 2025): ₱220,000.00
- Q3 (Jul – Sep, 2025): ₱250,000.00
- Q4 (Oct – Dec, 2025): ₱250,000.00
- **Total TY2025: ₱900,000.00**

### Quarterly Computation (Supplementary — for traceability)

**Q1 1701Q (first return — 8% election made here; due May 15, 2025):**
- Cumulative gross (Q1 only): ₱180,000.00
- 8% base: `max(180,000 − 250,000, 0) = ₱0.00` (gross below ₱250K threshold)
- Cumulative IT due: ₱0.00 × 0.08 = **₱0.00**
- Prior quarterly IT paid: ₱0.00
- **Q1 balance payable: ₱0.00** — NIL return; must still be filed by May 15, 2025
- 8% election signified on this return; irrevocable for TY2025

**Q2 1701Q (cumulative Jan 1 – Jun 30; due August 15, 2025):**
- Cumulative gross (Q1+Q2): ₱180,000 + ₱220,000 = ₱400,000.00
- 8% base: `max(400,000 − 250,000, 0) = ₱150,000.00`
- Cumulative IT due: ₱150,000 × 0.08 = **₱12,000.00**
- Prior quarterly IT paid: ₱0.00 (Q1 was NIL)
- **Q2 balance payable: ₱12,000.00**

**Q3 1701Q (cumulative Jan 1 – Sep 30; due November 15, 2025):**
- Cumulative gross (Q1+Q2+Q3): ₱400,000 + ₱250,000 = ₱650,000.00
- 8% base: `max(650,000 − 250,000, 0) = ₱400,000.00`
- Cumulative IT due: ₱400,000 × 0.08 = **₱32,000.00**
- Prior quarterly IT paid: ₱0.00 + ₱12,000.00 = ₱12,000.00
- **Q3 balance payable: ₱32,000 − ₱12,000 = ₱20,000.00**

**Total quarterly IT payments: ₱0 + ₱12,000 + ₱20,000 = ₱32,000.00**

### Expected Intermediate Values (Annual)

**PL-02 Classification:**
- `income_type = PURELY_SE`
- `taxpayer_class = SERVICE_PROVIDER`
- `taxpayer_tier = MICRO`
- `is_first_year_registrant = true`; `registration_quarter = 1`
- `path_c_eligible = true` (₱900,000 ≤ ₱3M; elected Path C)
- Engine suppresses missing-Q0 warnings; first quarterly return was Q1

**PL-04 (8% Eligibility):** eligible = true; no ineligibility reasons; gross ≤ ₱3M, not VAT-registered, purely SE

**PL-10 Path C (8% — elected and optimal):**
- `eight_pct_base = max(900,000 − 250,000, 0) = 650,000`
- `income_tax_path_c = 650,000 × 0.08 = 52,000.00`
- `pt_path_c = 0.00` (8% waives PT per NIRC Sec. 24(A)(2)(b))
- `total_tax_path_c = 52,000.00`

**PL-09 Path B (OSD — comparison only):**
- `osd_amount = 900,000 × 0.40 = 360,000`
- `nti_path_b = 900,000 × 0.60 = 540,000`
- `income_tax_path_b = graduated_tax_2023(540,000) = 22,500 + (540,000 − 400,000) × 0.20 = 22,500 + 28,000 = 50,500`
- `pt_path_b = 900,000 × 0.03 = 27,000`
- `total_tax_path_b = 50,500 + 27,000 = 77,500`

**PL-08 Path A (no expenses — comparison only):**
- `nti_path_a = 900,000 − 0 = 900,000`
- `income_tax_path_a = graduated_tax_2023(900,000) = 102,500 + (900,000 − 800,000) × 0.25 = 102,500 + 25,000 = 127,500`
- `pt_path_a = 900,000 × 0.03 = 27,000`
- `total_tax_path_a = 127,500 + 27,000 = 154,500`

**PL-13:** `recommended_path = PATH_C`; `selected_path = PATH_C` (elected and optimal); `savings_vs_next_best = 77,500 − 52,000 = 25,500` (vs Path B OSD); `savings_vs_worst = 154,500 − 52,000 = 102,500`

**PL-14 Credits:**
- `quarterly_it_paid = 32,000.00`
- `cwt_credits = 0.00`
- `prior_year_excess_cwt = 0.00`
- `annual_it_due = 52,000.00`
- `balance_payable = 52,000 − 32,000 − 0 = 20,000.00`

**PL-15:** `form = FORM_1701A`; `form_section = PART_IV_B` (8% option section of 1701A)

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: MICRO,
  is_first_year_registrant: true,
  registration_quarter: 1,
  first_quarterly_return_was: "Q1 1701Q (due May 15, 2025)",
  no_prior_quarters_required: true,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 900000.00,
      income_tax: 127500.00,
      percentage_tax: 27000.00,
      total_tax: 154500.00
    },
    path_b: {
      eligible: true,
      nti: 540000.00,
      osd_amount: 360000.00,
      income_tax: 50500.00,
      percentage_tax: 27000.00,
      total_tax: 77500.00
    },
    path_c: {
      eligible: true,
      tax_base: 650000.00,
      income_tax: 52000.00,
      percentage_tax: 0.00,
      total_tax: 52000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 25500.00,
    savings_vs_worst: 102500.00
  },

  selected_path: PATH_C,
  locked_regime: false,

  income_tax_due: 52000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 52000.00,

  cwt_credits: 0.00,
  quarterly_it_paid: 32000.00,
  balance_payable: 20000.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701A,
  form_section: PART_IV_B,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

### Verification

- **Q1 cumulative IT:** max(180,000 − 250,000, 0) × 0.08 = **₱0.00** ✓ (NIL)
- **Q2 cumulative IT:** (400,000 − 250,000) × 0.08 = ₱12,000; less prior ₱0 → **₱12,000 payable** ✓
- **Q3 cumulative IT:** (650,000 − 250,000) × 0.08 = ₱32,000; less prior ₱12,000 → **₱20,000 payable** ✓
- **Total quarterly paid:** ₱0 + ₱12,000 + ₱20,000 = **₱32,000** ✓
- **Annual IT (Path C):** (900,000 − 250,000) × 0.08 = ₱650,000 × 0.08 = **₱52,000** ✓
- **Annual balance:** ₱52,000 − ₱32,000 = **₱20,000** ✓
- **Path B total:** graduated_tax_2023(540,000) = 22,500 + 140,000×0.20 = **₱50,500** IT; PT = **₱27,000**; total = **₱77,500** ✓
- **Path C savings vs OSD:** 77,500 − 52,000 = **₱25,500** ✓
- **Form 1701A** (not Form 1701): purely SE, 8% elected, no compensation income ✓

**Legal basis:** 8% election on first 1701Q: RR No. 8-2018 Sec. 2(B)(2); 8% base formula: NIRC Sec. 24(A)(2)(b); ₱250K deduction applied at annual not quarterly: BIR Form 1701Q Schedule II Item 52 (cumulative base reduced once at each quarter per the form); quarterly cumulative method: NIRC Sec. 74-76; Form 1701A: BIR Rev. Regs. on EOPT (RA 11976) — simplified annual return for 8% pure SE; no Q0 requirement: BIR COR-based registration timing rules.

---

## TV-EX-G4-002: SC-FIRST-O — Q1 Registrant, OSD Elected (Suboptimal), Full-Year

**Scenario code:** SC-FIRST-O
**Description:** A newly registered sole proprietor providing bookkeeping services who registers with the BIR on January 15, 2025 (Q1). Without guidance, she checks "OSD" on her Q1 1701Q (due May 15, 2025) because she has no receipts to substantiate expenses. The OSD election is irrevocable for TY2025. Her annual gross is ₱600,000 across four quarters. This vector demonstrates: (1) three quarterly OSD computations under the cumulative method; (2) the engine showing the locked regime with missed savings; (3) Path C (8%) would have saved ₱6,500 — a significant first-year teaching moment. Q1 and Q2 are NIL returns (cumulative NTI below ₱250K); Q3 generates the first payment of ₱3,000.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (fields differing from Group 4 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱600,000.00 | Full-year gross (Jan 15 – Dec 31, 2025) |
| `registration_quarter` | `1` | Registered January 15, 2025 (Q1 = Jan–Mar) |
| `elected_regime` | `ELECT_OSD` | OSD elected on Q1 1701Q (May 15, 2025); irrevocable |
| All itemized expense fields | ₱0.00 each | No documented expenses (OSD is automatic) |
| `cwt_2307_entries` | `[]` | No withholding clients |
| `prior_quarterly_payments` | `[{Q1: 0.00}, {Q2: 0.00}, {Q3: 3000.00}]` | See quarterly computation below |
| `actual_filing_date` | `2026-04-15` | Filed on time |

**Quarterly gross breakdown:**
- Q1 (Jan 15 – Mar 31, 2025): ₱120,000.00 (partial quarter from registration date)
- Q2 (Apr – Jun, 2025): ₱150,000.00
- Q3 (Jul – Sep, 2025): ₱180,000.00
- Q4 (Oct – Dec, 2025): ₱150,000.00
- **Total TY2025: ₱600,000.00**

**PT obligation (2551Q — filed separately, not part of 1701A income tax return):**
- Q1 2551Q (due April 25, 2025): ₱120,000 × 0.03 = ₱3,600
- Q2 2551Q (due July 25, 2025): ₱150,000 × 0.03 = ₱4,500
- Q3 2551Q (due October 25, 2025): ₱180,000 × 0.03 = ₱5,400
- Q4 2551Q (due January 25, 2026): ₱150,000 × 0.03 = ₱4,500
- **Total PT for TY2025: ₱18,000.00** (already paid quarterly before annual filing)

### Quarterly Computation — OSD Cumulative Method (Supplementary)

**Q1 1701Q (first return — OSD election made here; due May 15, 2025):**
- Cumulative gross (Q1): ₱120,000.00
- OSD = ₱120,000 × 0.40 = ₱48,000
- Cumulative NTI = ₱120,000 × 0.60 = ₱72,000
- Cumulative IT = `graduated_tax_2023(72,000) = ₱0.00` (below ₱250K threshold)
- Prior quarterly IT paid: ₱0.00
- **Q1 balance payable: ₱0.00** — NIL return; must still be filed by May 15, 2025
- OSD election signified on this return; irrevocable for TY2025

**Q2 1701Q (cumulative Jan 1 – Jun 30; due August 15, 2025):**
- Cumulative gross (Q1+Q2): ₱120,000 + ₱150,000 = ₱270,000.00
- OSD = ₱270,000 × 0.40 = ₱108,000
- Cumulative NTI = ₱270,000 × 0.60 = ₱162,000
- Cumulative IT = `graduated_tax_2023(162,000) = ₱0.00` (below ₱250K threshold)
- Prior quarterly IT paid: ₱0.00
- **Q2 balance payable: ₱0.00** — NIL return; must still be filed by August 15, 2025

**Q3 1701Q (cumulative Jan 1 – Sep 30; due November 15, 2025):**
- Cumulative gross (Q1+Q2+Q3): ₱270,000 + ₱180,000 = ₱450,000.00
- OSD = ₱450,000 × 0.40 = ₱180,000
- Cumulative NTI = ₱450,000 × 0.60 = ₱270,000
- Cumulative IT = `graduated_tax_2023(270,000) = (270,000 − 250,000) × 0.15 = 20,000 × 0.15 = ₱3,000`
- Prior quarterly IT paid: ₱0.00
- **Q3 balance payable: ₱3,000.00**

**Total quarterly IT payments: ₱0 + ₱0 + ₱3,000 = ₱3,000.00**

### Expected Intermediate Values (Annual)

**PL-02 Classification:**
- `income_type = PURELY_SE`; `taxpayer_class = SERVICE_PROVIDER`; `taxpayer_tier = MICRO`
- `is_first_year_registrant = true`; `registration_quarter = 1`
- `path_c_eligible = true` (₱600,000 ≤ ₱3M) — shown for comparison; OSD is locked

**PL-09 Path B (OSD — elected and locked):**
- `osd_amount = 600,000 × 0.40 = 240,000`
- `nti_path_b = 600,000 × 0.60 = 360,000`
- `income_tax_path_b = graduated_tax_2023(360,000) = (360,000 − 250,000) × 0.15 = 110,000 × 0.15 = 16,500`
- `pt_path_b = 600,000 × 0.03 = 18,000`
- `total_tax_path_b = 16,500 + 18,000 = 34,500`

**PL-10 Path C (8% — comparison only):**
- `eight_pct_base = max(600,000 − 250,000, 0) = 350,000`
- `income_tax_path_c = 350,000 × 0.08 = 28,000`
- `pt_path_c = 0`
- `total_tax_path_c = 28,000`

**PL-08 Path A (no expenses — comparison only):**
- `nti_path_a = 600,000`
- `income_tax_path_a = graduated_tax_2023(600,000) = 22,500 + (600,000 − 400,000) × 0.20 = 22,500 + 40,000 = 62,500`
- `pt_path_a = 600,000 × 0.03 = 18,000`
- `total_tax_path_a = 62,500 + 18,000 = 80,500`

**PL-13 (locked OSD mode):**
- `recommended_path = PATH_C` (optimal — for informational display)
- `selected_path = PATH_B` (locked: OSD elected on Q1 1701Q, irrevocable)
- `missed_savings = 34,500 − 28,000 = 6,500`
- `locked_regime_reason = "OSD elected on first 1701Q (Q1 2025). Election is irrevocable for TY2025."`

**PL-14 Credits (income tax only — PT handled via 2551Q):**
- `quarterly_it_paid = 3,000.00`
- `cwt_credits = 0.00`
- `annual_it_due = 16,500.00`
- `balance_payable = 16,500 − 3,000 = 13,500.00` (income tax balance only; full-year PT ₱18,000 already paid via four quarterly 2551Q filings)

**PL-15:** `form = FORM_1701A`; `form_section = PART_IV_A` (OSD section)

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: MICRO,
  is_first_year_registrant: true,
  registration_quarter: 1,
  first_quarterly_return_was: "Q1 1701Q (due May 15, 2025)",
  no_prior_quarters_required: true,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 600000.00,
      income_tax: 62500.00,
      percentage_tax: 18000.00,
      total_tax: 80500.00
    },
    path_b: {
      eligible: true,
      nti: 360000.00,
      osd_amount: 240000.00,
      income_tax: 16500.00,
      percentage_tax: 18000.00,
      total_tax: 34500.00
    },
    path_c: {
      eligible: true,
      tax_base: 350000.00,
      income_tax: 28000.00,
      percentage_tax: 0.00,
      total_tax: 28000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 6500.00,
    savings_vs_worst: 52500.00
  },

  selected_path: PATH_B,
  locked_regime: true,
  locked_regime_reason: "OSD elected on first 1701Q (Q1 2025). Election is irrevocable for TY2025.",
  missed_savings: 6500.00,

  income_tax_due: 16500.00,
  percentage_tax_due: 18000.00,
  total_tax_due: 34500.00,

  cwt_credits: 0.00,
  quarterly_it_paid: 3000.00,
  balance_payable: 13500.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701A,
  form_section: PART_IV_A,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: taxpayer is on a locked suboptimal regime (OSD); missed_savings = ₱6,500. The UI must display this prominently as an amber advisory card with the message: "You elected OSD this year. The 8% rate would have saved you ₱6,500. For TY2026, consider electing 8% on your Q1 1701Q if your gross remains below ₱3,000,000."

### Verification

- **Path B annual NTI:** 600,000 × 0.60 = **₱360,000** ✓
- **Path B IT:** graduated_tax_2023(360,000) = (360,000 − 250,000) × 0.15 = **₱16,500** ✓
- **Path B PT:** 600,000 × 0.03 = **₱18,000** ✓; total = **₱34,500** ✓
- **Path C IT:** (600,000 − 250,000) × 0.08 = **₱28,000** ✓; total = **₱28,000** ✓
- **Missed savings:** 34,500 − 28,000 = **₱6,500** ✓
- **Q1 cumulative NTI:** 120,000 × 0.60 = 72,000 < 250,000 → IT = **₱0.00** ✓ (NIL)
- **Q2 cumulative NTI:** 270,000 × 0.60 = 162,000 < 250,000 → IT = **₱0.00** ✓ (NIL)
- **Q3 cumulative NTI:** 450,000 × 0.60 = 270,000; IT = (270,000 − 250,000) × 0.15 = **₱3,000** ✓
- **Annual IT balance:** 16,500 − 3,000 = **₱13,500** ✓
- **Total PT (4 quarters):** 3,600 + 4,500 + 5,400 + 4,500 = **₱18,000** ✓
- **Total tax burden (IT + PT):** 16,500 + 18,000 = **₱34,500** ✓

**Legal basis:** OSD election irrevocability: RR No. 8-2018 Sec. 2(B)(1) "the election once made, shall be irrevocable for the taxable year for which the election was made"; OSD 40% of gross: NIRC Sec. 34(L); Graduated rates: NIRC Sec. 24(A)(2)(a) 2023 schedule; PT 3%: NIRC Sec. 116 (CREATE rate restored July 1, 2023); Quarterly OSD cumulative method: NIRC Sec. 74-76; Form 1701A OSD: BIR Form 1701A Part IV-A.

---

## TV-EX-G4-003: SC-FIRST-MID-Q3 — Registered July–September; First Return is Q3

**Scenario code:** SC-FIRST-MID-Q3
**Description:** A freelance software developer who registers with the BIR on August 5, 2025 (Q3). No quarterly returns are required for Q1 or Q2 because she was not yet registered. Her first quarterly return is the Q3 1701Q (due November 15, 2025), which is also her election quarter. She elects 8% on this first return. Total TY2025 gross is ₱700,000 (earned from August 5 onward: ₱300,000 in Q3 and ₱400,000 in Q4). The annual reconciliation shows a balance of ₱32,000 after the Q3 payment of ₱4,000.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (fields differing from Group 4 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱700,000.00 | Gross from Aug 5 – Dec 31, 2025 |
| `registration_quarter` | `3` | Registered August 5, 2025 (Q3 = Jul–Sep) |
| `elected_regime` | `ELECT_EIGHT_PCT` | Elected 8% on Q3 1701Q (November 15, 2025) |
| All itemized expense fields | ₱0.00 each | No documented expenses |
| `cwt_2307_entries` | `[]` | No withholding clients in first year |
| `prior_quarterly_payments` | `[{Q3: 4000.00}]` | See quarterly computation below; no Q1 or Q2 returns |
| `actual_filing_date` | `2026-04-15` | Filed on time |

**Income breakdown by quarter:**
- Q1 (Jan–Mar, 2025): ₱0.00 — not yet registered; no Q1 return required
- Q2 (Apr–Jun, 2025): ₱0.00 — not yet registered; no Q2 return required
- Q3 (Aug 5 – Sep 30, 2025): ₱300,000.00 — first quarter of registration
- Q4 (Oct – Dec, 2025): ₱400,000.00
- **Total TY2025: ₱700,000.00**

### Quarterly Computation (Supplementary)

**Q3 1701Q (first return — 8% election made here; due November 15, 2025):**
- Cumulative gross from registration (Q3 only): ₱300,000.00
- 8% base: `max(300,000 − 250,000, 0) = ₱50,000.00`
- Cumulative IT due: ₱50,000 × 0.08 = **₱4,000.00**
- Prior quarterly IT paid: ₱0.00 (no Q1 or Q2 returns)
- **Q3 balance payable: ₱4,000.00**
- 8% election signified on this return; irrevocable for TY2025
- Note: Q1 and Q2 1701Q returns are NOT required — taxpayer was not registered during those quarters; engine must NOT flag them as missing

**No Q4 quarterly return:** Annual 1701A covers full year including Q4.

**Total quarterly IT payments: ₱4,000.00** (Q3 only)

### Expected Intermediate Values (Annual)

**PL-02 Classification:**
- `income_type = PURELY_SE`; `taxpayer_class = SERVICE_PROVIDER`; `taxpayer_tier = MICRO`
- `is_first_year_registrant = true`; `registration_quarter = 3`
- `path_c_eligible = true` (₱700,000 ≤ ₱3M; 8% elected)
- Engine confirms: first return was Q3 1701Q (November 15, 2025); Q1 and Q2 are suppressed as "not applicable — pre-registration"

**PL-04 (8% Eligibility):** eligible = true; gross ≤ ₱3M; not VAT-registered; purely SE; no prior-year gross > ₱3M

**PL-10 Path C (8% — elected and optimal):**
- `eight_pct_base = max(700,000 − 250,000, 0) = 450,000`
- `income_tax_path_c = 450,000 × 0.08 = 36,000.00`
- `pt_path_c = 0.00`
- `total_tax_path_c = 36,000.00`

**PL-09 Path B (OSD — comparison only):**
- `osd_amount = 700,000 × 0.40 = 280,000`
- `nti_path_b = 700,000 × 0.60 = 420,000`
- `income_tax_path_b = graduated_tax_2023(420,000) = 22,500 + (420,000 − 400,000) × 0.20 = 22,500 + 4,000 = 26,500`
- `pt_path_b = 700,000 × 0.03 = 21,000`
- `total_tax_path_b = 26,500 + 21,000 = 47,500`

**PL-08 Path A (no expenses — comparison only):**
- `nti_path_a = 700,000`
- `income_tax_path_a = graduated_tax_2023(700,000) = 22,500 + (700,000 − 400,000) × 0.20 = 22,500 + 60,000 = 82,500`
- `pt_path_a = 700,000 × 0.03 = 21,000`
- `total_tax_path_a = 82,500 + 21,000 = 103,500`

**PL-13:** `recommended_path = PATH_C`; `selected_path = PATH_C` (elected and optimal); `savings_vs_next_best = 47,500 − 36,000 = 11,500` (vs Path B OSD); `savings_vs_worst = 103,500 − 36,000 = 67,500`

**PL-14 Credits:**
- `quarterly_it_paid = 4,000.00` (Q3 only)
- `cwt_credits = 0.00`
- `annual_it_due = 36,000.00`
- `balance_payable = 36,000 − 4,000 = 32,000.00`

**PL-15:** `form = FORM_1701A`; `form_section = PART_IV_B` (8% section)

### Expected Final Output (TaxComputationResult)

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: MICRO,
  is_first_year_registrant: true,
  registration_quarter: 3,
  first_quarterly_return_was: "Q3 1701Q (due November 15, 2025)",
  no_prior_quarters_required: true,
  skipped_quarters: ["Q1 2025 (pre-registration)", "Q2 2025 (pre-registration)"],

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 700000.00,
      income_tax: 82500.00,
      percentage_tax: 21000.00,
      total_tax: 103500.00
    },
    path_b: {
      eligible: true,
      nti: 420000.00,
      osd_amount: 280000.00,
      income_tax: 26500.00,
      percentage_tax: 21000.00,
      total_tax: 47500.00
    },
    path_c: {
      eligible: true,
      tax_base: 450000.00,
      income_tax: 36000.00,
      percentage_tax: 0.00,
      total_tax: 36000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 11500.00,
    savings_vs_worst: 67500.00
  },

  selected_path: PATH_C,
  locked_regime: false,

  income_tax_due: 36000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 36000.00,

  cwt_credits: 0.00,
  quarterly_it_paid: 4000.00,
  balance_payable: 32000.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701A,
  form_section: PART_IV_B,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

### Verification

- **Q3 cumulative gross (first return):** ₱300,000
- **Q3 8% base:** max(300,000 − 250,000, 0) = **₱50,000** ✓
- **Q3 IT:** 50,000 × 0.08 = **₱4,000** ✓
- **Q3 balance payable:** 4,000 − 0 = **₱4,000** ✓
- **Annual IT (Path C):** (700,000 − 250,000) × 0.08 = 450,000 × 0.08 = **₱36,000** ✓
- **Annual balance:** 36,000 − 4,000 = **₱32,000** ✓
- **Path B IT:** graduated_tax_2023(420,000) = 22,500 + 20,000×0.20 = **₱26,500** ✓; PT = **₱21,000**; total = **₱47,500** ✓
- **Savings vs OSD:** 47,500 − 36,000 = **₱11,500** ✓
- **No Q1/Q2 returns required:** registration date August 5, 2025 is in Q3 (July–September) → Q1 and Q2 pre-registration period → engine suppresses missing-return alerts ✓
- **Form 1701A:** purely SE, 8% elected, no compensation → correct form ✓

**Legal basis:** First return for mid-year registrant is the quarter of registration: BIR RMC 12-2012 and RR 8-2018 Sec. 2(B)(2) — election on "first quarterly return or first quarterly percentage tax return"; NIRC Sec. 74 — quarterly returns required for each quarter of the taxable year the taxpayer is in business; no Q0 requirement for pre-registration quarters; 8% base: NIRC Sec. 24(A)(2)(b); PT waiver under 8%: same; Form 1701A: BIR RA 11976 EOPT simplified returns.

---

## GROUP 4 SUMMARY TABLE

| Vector | Scenario | Registration | Gross | Expense% | Elected | Optimal | Total Tax | Missed Savings | Form |
|--------|---------|-------------|-------|---------|---------|---------|-----------|---------------|------|
| TV-EX-G4-001 | SC-FIRST-8 | Q1 (Feb 10) | ₱900,000 | 0% | 8% (Q1) | Path C | ₱52,000 | ₱0 (optimal) | 1701A |
| TV-EX-G4-002 | SC-FIRST-O | Q1 (Jan 15) | ₱600,000 | 0% | OSD (Q1) | Path C | ₱34,500 | ₱6,500 | 1701A |
| TV-EX-G4-003 | SC-FIRST-MID-Q3 | Q3 (Aug 5) | ₱700,000 | 0% | 8% (Q3) | Path C | ₱36,000 | ₱0 (optimal) | 1701A |
| TV-EDGE-009 | SC-FIRST-MID-Q2 | Q2 (Apr 20) | ₱850,000 | 0% | 8% (Q2) | Path C | ₱48,000 | ₱0 (optimal) | 1701A |
| TV-EDGE-016 | SC-FIRST-MID-Q4 | Q4 (Nov 3) | ₱220,000 | 0% | 8% (annual) | Path C | ₱0 | ₱0 (optimal) | 1701A |

**Key insights validated:**
1. Q1 registrants with full-year income file THREE quarterly 1701Q returns (Q1, Q2, Q3) plus annual 1701A. The ₱250K threshold means Q1 is often a NIL return when early-year income is modest (TV-EX-G4-001: Q1 NIL at ₱180K; TV-EX-G4-002: Q1 NIL at ₱120K).
2. OSD election on the first 1701Q is irrevocable and often suboptimal (TV-EX-G4-002: ₱6,500 more tax vs 8%). The engine must prominently flag missed savings via WARN-004 to prevent this for future years.
3. Mid-Q3 registrants file only ONE quarterly return (Q3) for the registration year (TV-EX-G4-003: ₱4,000 Q3 payment, ₱32,000 annual balance). No Q1 or Q2 returns are required or applicable — the engine must not flag them as missing.
4. Mid-Q4 registrants file NO quarterly returns for the registration year — only the annual 1701A (TV-EDGE-016). The annual 1701A is both the first filing and the election return for this subset.
5. All Group 4 vectors use Form 1701A (not Form 1701) because all are purely self-employed (no compensation income) and the recommended regime is 8% or OSD (both filed on 1701A).
6. First-year taxpayers always use EWT rate 5% (prior-year gross = ₱0, which is below ₱3M threshold). This affects any 2307 entries in the same year (no Group 4 vectors have CWT — see Group 5 for CWT scenarios).
7. The `no_prior_quarters_required` flag and `skipped_quarters` list in the output must be populated correctly by the engine to prevent UI confusion and to inform the compliance calendar displayed to the user after computation.

---

## GROUP 5: CWT-Heavy Scenarios

**3 scenario codes:** SC-P-ML-8-CWT, SC-P-ML-O-CWT, SC-P-ML-8-CWT-PLATFORM

**Common characteristics for all Group 5 vectors:**
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_vat_registered`: false
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `cost_of_goods_sold`: ₱0.00
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): PURELY_SE
- `taxpayer_tier` (derived): MICRO (all GR < ₱3,000,000)
- `path_c_eligible` (derived): true
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `prior_year_excess_cwt`: ₱0.00
- `return_type`: ORIGINAL
- `filing_period`: ANNUAL
- `tax_year`: 2025
- `actual_filing_date`: null (on-time assumed)

**What distinguishes Group 5:** Significant Form 2307 CWT entries that meaningfully affect balance payable. In SC-P-ML-8-CWT, CWT exceeds annual IT under Path C, producing a refundable overpayment. In SC-P-ML-O-CWT, the quarterly Item 57/58 CWT tracking is demonstrated across three quarterly returns. In SC-P-ML-8-CWT-PLATFORM, two distinct ATC codes (WI760 platform + WI010 professional) are aggregated.

**Balance payable formula (used in all vectors):**
```
balance_payable_raw = income_tax_due + percentage_tax_due - cwt_credits - quarterly_it_paid
balance_payable     = max(balance_payable_raw, 0)
overpayment         = max(-balance_payable_raw, 0)
```
CWT credits (Form 2307 — WI010, WI760, etc.) offset income tax on the annual ITR. Percentage tax is filed separately via quarterly Form 2551Q. When PT > 0, the `balance_payable` figure includes the PT component as a reminder of the total annual obligation; the UI must note that PT is filed separately.

---

## TV-EX-G5-001: SC-P-ML-8-CWT — 8% Freelancer, CWT Exceeds Annual IT (Overpayment)

**Scenario code:** SC-P-ML-8-CWT
**Description:** HR consultant earning ₱600,000 annually from two regular corporate clients. Both clients are required to withhold 5% EWT (ATC WI010) because the consultant's prior-year gross was below ₱3,000,000. The 5% EWT on all ₱600,000 gross produces ₱30,000 total CWT — exceeding the 8% annual income tax of ₱28,000 by ₱2,000. All three quarterly 1701Q returns are NIL (₱0 payable) because the cumulative CWT offset the cumulative income tax at every quarterly checkpoint. At annual filing, the engine shows an overpayment of ₱2,000 and recommends CARRY_OVER (default for overpayments ≤ ₱50,000). This vector demonstrates: (1) quarterly NIL returns from CWT offset; (2) CWT > IT → WARN-009; (3) overpayment disposition election.

**CWT crossover arithmetic:** At ₱600,000 gross, 5% CWT = ₱30,000 vs 8% IT on ₱350,000 base = ₱28,000. The CWT exceeds the IT. The general crossover gross is: gross × 0.05 = (gross − 250,000) × 0.08 → 0.05g = 0.08g − 20,000 → g = 20,000 / 0.03 = ₱666,667. Below ₱666,667 gross, a purely 5% CWT taxpayer will always have CWT > 8% IT (overpayment).

### Input (fields differing from Group 5 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱600,000.00 | Annual professional service fees |
| All itemized expense fields | ₱0.00 | No business receipts kept |
| `elected_regime` | null | Optimizer mode — engine recommends |
| `cwt_2307_entries` | 8 entries (see table) | 2 clients × 4 quarters at 5% WI010 |
| `prior_quarterly_payments` | [{quarter:1, amount:0.00}, {quarter:2, amount:0.00}, {quarter:3, amount:0.00}] | All three quarterly IT returns filed NIL |

**CWT entries (Form 2307):**

| # | ATC | Payor | Period | Income Payment | Tax Withheld |
|---|-----|-------|--------|----------------|--------------|
| 1 | WI010 | Alpha Corp | Q1 2025 (Jan–Mar) | ₱75,000.00 | ₱3,750.00 |
| 2 | WI010 | Beta Inc | Q1 2025 (Jan–Mar) | ₱75,000.00 | ₱3,750.00 |
| 3 | WI010 | Alpha Corp | Q2 2025 (Apr–Jun) | ₱75,000.00 | ₱3,750.00 |
| 4 | WI010 | Beta Inc | Q2 2025 (Apr–Jun) | ₱75,000.00 | ₱3,750.00 |
| 5 | WI010 | Alpha Corp | Q3 2025 (Jul–Sep) | ₱75,000.00 | ₱3,750.00 |
| 6 | WI010 | Beta Inc | Q3 2025 (Jul–Sep) | ₱75,000.00 | ₱3,750.00 |
| 7 | WI010 | Alpha Corp | Q4 2025 (Oct–Dec) | ₱75,000.00 | ₱3,750.00 |
| 8 | WI010 | Beta Inc | Q4 2025 (Oct–Dec) | ₱75,000.00 | ₱3,750.00 |

**Total income_payments across all 2307s:** ₱600,000.00 (matches gross_receipts)
**Total tax withheld:** ₱30,000.00 (5.000% of ₱600,000)
**Rate validation:** WI010 = 5% professional EWT (consultant's prior-year gross < ₱3M; RR 2-98 Sec. 2.57.2(E))

**Total itemized expenses:** ₱0.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱600,000.00; taxpayer_tier = MICRO; income_type = PURELY_SE; taxpayer_class = SERVICE_PROVIDER

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** total_itemized_deductions = ₱0.00; ear_cap = ₱600,000 × 0.01 = ₱6,000.00; nolco_applied = ₱0.00

**PL-06:** osd_amount = ₱600,000 × 0.40 = ₱240,000.00; nti_path_b = ₱360,000.00

**PL-07 (CWT aggregation):**
- cwt_by_atc = {WI010: ₱30,000.00}
- income_tax_cwt = ₱30,000.00 (WI010 classified as INCOME_TAX_CWT)
- pt_cwt = ₱0.00
- total_cwt = ₱30,000.00

**PL-08 (Path A):**
- nti_path_a = ₱600,000.00 (no itemized deductions)
- income_tax = graduated_tax_2023(600,000) = 22,500 + (600,000 − 400,000) × 0.20 = 22,500 + 40,000 = ₱62,500.00
- pt = ₱600,000 × 0.03 = ₱18,000.00
- total_path_a = ₱80,500.00

**PL-09 (Path B):**
- nti_path_b = ₱360,000.00
- income_tax = graduated_tax_2023(360,000) = (360,000 − 250,000) × 0.15 = ₱16,500.00
- pt = ₱18,000.00
- total_path_b = ₱34,500.00

**PL-10 (Path C):**
- eight_pct_base = max(600,000 − 250,000, 0) = ₱350,000.00
- income_tax = ₱350,000 × 0.08 = ₱28,000.00
- pt = ₱0.00
- total_path_c = ₱28,000.00

**PL-13:**
- Path A: ₱80,500.00
- Path B: ₱34,500.00
- Path C: ₱28,000.00 ← MINIMUM
- recommended_path = PATH_C
- savings_vs_next_best = ₱34,500 − ₱28,000 = ₱6,500.00 (vs Path B)
- savings_vs_worst = ₱80,500 − ₱28,000 = ₱52,500.00

**PL-14 (Balance — Path C):**
- income_tax_due = ₱28,000.00
- percentage_tax_due = ₱0.00 (Path C waives PT)
- total_tax_due = ₱28,000.00
- cwt_credits = ₱30,000.00
- quarterly_it_paid = ₱0.00
- balance_payable_raw = 28,000 + 0 − 30,000 − 0 = −₱2,000.00
- balance_payable = max(−2,000, 0) = ₱0.00
- overpayment = max(2,000, 0) = ₱2,000.00
- overpayment_disposition = CARRY_OVER (overpayment ≤ ₱50,000 → engine default is CARRY_OVER per OverpaymentDisposition rules; fastest and simplest option; mark Item 29 on Form 1701A)

**WARN-009 fires (WARN_CWT_EXCEEDS_IT_DUE):** "Your creditable withholding tax (₱30,000) exceeds your income tax due (₱28,000) under the recommended 8% rate. Overpayment = ₱2,000. Options: (1) Carry over to 2026 [recommended — mark Item 29a on Form 1701A; credit applies against your 2026 Q1 1701Q]; (2) File for cash refund via BIR Form 1914 [attach original 2307s; 90–120 day process, RDO approval required]; (3) Apply for Tax Credit Certificate via BIR Form 1926 [transferable; used against other taxes]. Select your election on Form 1701A Item 29."

**PL-15:** form = FORM_1701A; form_section = PART_IV_B (8% flat rate section)

**PL-16 (Penalties):** ₱0.00 (on-time)

**Quarterly 8% tracker (computed for each quarterly 1701Q, referenced by quarterly filing UI):**

| Quarter | Cumul. Gross | 8% Base | Cumul. IT | CWT to Date | Q Payable |
|---------|-------------|---------|----------|------------|-----------|
| Q1 (Jan–Mar) | ₱150,000.00 | max(150,000−250,000, 0) = ₱0.00 | ₱0.00 | ₱7,500.00 | ₱0.00 (NIL) |
| Q2 (Jan–Jun) | ₱300,000.00 | 300,000−250,000 = ₱50,000.00 | ₱4,000.00 | ₱15,000.00 | ₱0.00 (NIL) |
| Q3 (Jan–Sep) | ₱450,000.00 | 450,000−250,000 = ₱200,000.00 | ₱16,000.00 | ₱22,500.00 | ₱0.00 (NIL) |
| Annual | ₱600,000.00 | 600,000−250,000 = ₱350,000.00 | ₱28,000.00 | ₱30,000.00 | ₱0.00 (overpmt ₱2,000) |

Q1 quarterly detail: cumul_it = 0 (base = ₱0); CWT = ₱7,500; payable = max(0 − 7,500, 0) = ₱0
Q2 quarterly detail: cumul_it = 50,000 × 0.08 = ₱4,000; CWT = ₱15,000; payable = max(4,000 − 15,000, 0) = ₱0
Q3 quarterly detail: cumul_it = 200,000 × 0.08 = ₱16,000; CWT = ₱22,500; payable = max(16,000 − 22,500, 0) = ₱0

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 600000.00, income_tax: 62500.00,
              percentage_tax: 18000.00, total_tax: 80500.00 },
    path_b: { eligible: true, nti: 360000.00, osd_amount: 240000.00,
              income_tax: 16500.00, percentage_tax: 18000.00, total_tax: 34500.00 },
    path_c: { eligible: true, tax_base: 350000.00, income_tax: 28000.00,
              percentage_tax: 0.00, total_tax: 28000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 6500.00,
    savings_vs_worst: 52500.00
  },

  selected_path: PATH_C,
  income_tax_due: 28000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 28000.00,
  cwt_credits: 30000.00,
  cwt_by_atc: { WI010: 30000.00 },
  quarterly_it_paid: 0.00,
  balance_payable: 0.00,
  overpayment: 2000.00,
  overpayment_disposition: CARRY_OVER,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-009],
  manual_review_flags: [],  ineligibility_notifications: [],

  quarterly_tracker: [
    { quarter: 1, cumul_gross: 150000.00, eight_pct_base: 0.00, cumul_it: 0.00,
      cwt_to_date: 7500.00, quarterly_payable: 0.00 },
    { quarter: 2, cumul_gross: 300000.00, eight_pct_base: 50000.00, cumul_it: 4000.00,
      cwt_to_date: 15000.00, quarterly_payable: 0.00 },
    { quarter: 3, cumul_gross: 450000.00, eight_pct_base: 200000.00, cumul_it: 16000.00,
      cwt_to_date: 22500.00, quarterly_payable: 0.00 }
  ]
}
```

### Verification

- **Path C IT:** max(600,000 − 250,000, 0) × 0.08 = 350,000 × 0.08 = **₱28,000.00** ✓
- **Path B NTI:** 360,000; bracket 2: (360,000 − 250,000) × 0.15 = **₱16,500.00**; PT = 600,000 × 0.03 = **₱18,000.00**; total = **₱34,500.00** ✓
- **CWT sum:** 8 entries × ₱3,750 = **₱30,000.00** ✓; all WI010 at 5% of ₱75,000 = ₱3,750 ✓
- **Q1 base:** max(150,000 − 250,000, 0) = **₱0** ✓; Q1 IT = ₱0; payable = max(0 − 7,500, 0) = **₱0** ✓
- **Q2 IT:** 50,000 × 0.08 = **₱4,000** ✓; payable = max(4,000 − 15,000, 0) = **₱0** ✓
- **Q3 IT:** 200,000 × 0.08 = **₱16,000** ✓; payable = max(16,000 − 22,500, 0) = **₱0** ✓
- **Overpayment:** CWT ₱30,000 − IT ₱28,000 = **₱2,000** ✓
- **Crossover validation:** At GR = ₱666,667: CWT = 666,667 × 0.05 = ₱33,333; IT = (666,667 − 250,000) × 0.08 = 416,667 × 0.08 = ₱33,333; equal at crossover ✓; at ₱600,000 < ₱666,667 → CWT > IT → overpayment confirmed ✓
- **CARRY_OVER correct:** overpayment ₱2,000 ≤ ₱50,000 threshold ✓
- **Form 1701A:** purely SE, 8% regime, no compensation → correct ✓

**Legal basis:** 8% option: NIRC Sec. 24(A)(2)(b); CR-010. CWT credit against IT: NIRC Sec. 58; CR-009. WI010 5% professional EWT: RR 2-98 Sec. 2.57.2(E). Overpayment carry-over: NIRC Sec. 76; OverpaymentDisposition.CARRY_OVER. Form 1701A: BIR RA 11976 EOPT.

---

## TV-EX-G5-002: SC-P-ML-O-CWT — OSD Elected (Locked), CWT Reduces IT Balance, Quarterly Item 57/58 Tracking

**Scenario code:** SC-P-ML-O-CWT
**Description:** Business development consultant earning ₱900,000 annually, who elected OSD on the Q1 2025 Form 1701Q (irrevocable PATH_B election for the year). Two regular corporate clients issue quarterly Form 2307 at 5% EWT (WI010), totaling ₱45,000 CWT for the year. The annual OSD income tax is ₱50,500. After applying CWT credits, the income tax balance is ₱5,500. Total balance payable including percentage tax obligation is ₱32,500 (of which ₱27,000 PT is filed separately via quarterly Form 2551Q). This vector demonstrates: (1) locked OSD election and opportunity cost vs Path C; (2) quarterly 1701Q CWT tracking via Item 57 (prior-quarter cumulative CWT) and Item 58 (current quarter new CWT); (3) all three quarterly returns are NIL because CWT exceeded cumulative IT at every quarter.

### Input (fields differing from Group 5 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱900,000.00 | Annual BD consulting fees |
| All itemized expense fields | ₱0.00 | OSD elected; no itemized tracking needed |
| `elected_regime` | PATH_B | Elected OSD on Q1 2025 Form 1701Q |
| `osd_elected` | true | OSD irrevocable for TY 2025 |
| `cwt_2307_entries` | 8 entries (see table) | 2 clients × 4 quarters at 5% WI010 |
| `prior_quarterly_payments` | [{quarter:1, amount:0.00}, {quarter:2, amount:0.00}, {quarter:3, amount:0.00}] | All NIL returns filed |

**CWT entries (Form 2307):**

| # | ATC | Payor | Period | Income Payment | Tax Withheld |
|---|-----|-------|--------|----------------|--------------|
| 1 | WI010 | Corp A | Q1 2025 (Jan–Mar) | ₱100,000.00 | ₱5,000.00 |
| 2 | WI010 | Corp B | Q1 2025 (Jan–Mar) | ₱100,000.00 | ₱5,000.00 |
| 3 | WI010 | Corp A | Q2 2025 (Apr–Jun) | ₱125,000.00 | ₱6,250.00 |
| 4 | WI010 | Corp B | Q2 2025 (Apr–Jun) | ₱125,000.00 | ₱6,250.00 |
| 5 | WI010 | Corp A | Q3 2025 (Jul–Sep) | ₱125,000.00 | ₱6,250.00 |
| 6 | WI010 | Corp B | Q3 2025 (Jul–Sep) | ₱125,000.00 | ₱6,250.00 |
| 7 | WI010 | Corp A | Q4 2025 (Oct–Dec) | ₱100,000.00 | ₱5,000.00 |
| 8 | WI010 | Corp B | Q4 2025 (Oct–Dec) | ₱100,000.00 | ₱5,000.00 |

**Quarterly gross breakdown:**
- Q1 (Jan–Mar): ₱200,000 (Corp A ₱100K + Corp B ₱100K); CWT = ₱10,000
- Q2 (Apr–Jun): ₱250,000 (Corp A ₱125K + Corp B ₱125K); CWT = ₱12,500
- Q3 (Jul–Sep): ₱250,000 (Corp A ₱125K + Corp B ₱125K); CWT = ₱12,500
- Q4 (Oct–Dec): ₱200,000 (Corp A ₱100K + Corp B ₱100K); CWT = ₱10,000
- Annual total: ₱900,000; total CWT = ₱45,000

**Total itemized expenses:** ₱0.00 (OSD elected; irrelevant)

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱900,000.00; taxpayer_tier = MICRO; income_type = PURELY_SE

**PL-04:** path_c_eligible = true (₱900K ≤ ₱3M, not VAT-registered); locked_regime = PATH_B (OSD elected Q1 1701Q; ineligible to switch to Path C this year)

**PL-05:** total_itemized_deductions = ₱0.00 (N/A; OSD elected)

**PL-06:** osd_amount = ₱900,000 × 0.40 = ₱360,000.00; nti_path_b = ₱540,000.00

**PL-07 (CWT):**
- cwt_by_atc = {WI010: ₱45,000.00}
- income_tax_cwt = ₱45,000.00; pt_cwt = ₱0.00
- total_cwt = ₱45,000.00

**PL-08 (Path A — comparison only; locked regime is B):**
- nti_path_a = ₱900,000.00 (no itemized deductions)
- income_tax = graduated_tax_2023(900,000) = 102,500 + (900,000 − 800,000) × 0.25 = 102,500 + 25,000 = ₱127,500.00
- pt = ₱900,000 × 0.03 = ₱27,000.00
- total_path_a = ₱154,500.00

**PL-09 (Path B — locked elected path):**
- nti_path_b = ₱540,000.00
- income_tax = graduated_tax_2023(540,000) = 22,500 + (540,000 − 400,000) × 0.20 = 22,500 + 28,000 = ₱50,500.00
- pt = ₱27,000.00
- total_path_b = ₱77,500.00

**PL-10 (Path C — counterfactual comparison; cannot be selected this year):**
- eight_pct_base = max(900,000 − 250,000, 0) = ₱650,000.00
- income_tax = ₱650,000 × 0.08 = ₱52,000.00
- pt = ₱0.00
- total_path_c = ₱52,000.00

**PL-13:**
- Locked path: PATH_B (₱77,500)
- Would-be optimal (unlocked): PATH_C (₱52,000)
- opportunity_cost = ₱77,500 − ₱52,000 = ₱25,500.00 (tax overpaid due to OSD election vs 8%)
- recommended_path_if_unlocked = PATH_C
- savings_vs_worst_if_unlocked = ₱154,500 − ₱52,000 = ₱102,500.00

**PL-14 (Balance — Path B locked):**
- income_tax_due = ₱50,500.00
- percentage_tax_due = ₱27,000.00 (filed separately via quarterly 2551Q)
- total_tax_due = ₱77,500.00
- cwt_credits = ₱45,000.00
- quarterly_it_paid = ₱0.00
- balance_payable_raw = 50,500 + 27,000 − 45,000 − 0 = ₱32,500.00
- balance_payable = ₱32,500.00 (= IT balance ₱5,500 + PT ₱27,000; see note)
- overpayment = ₱0.00
- Note: Of the ₱32,500 balance: ₱5,500 is income tax balance on annual Form 1701A. ₱27,000 is percentage tax — filed separately via Form 2551Q (Q1: ₱6,000 due Apr 25; Q2: ₱7,500 due Jul 25; Q3: ₱7,500 due Oct 25; Q4: ₱6,000 due Jan 25, 2026). If all quarterly 2551Q returns were filed on time, actual cash due at annual 1701A filing is ₱5,500 (IT only).

**WARN-004 fires (WARN_VERY_LOW_EXPENSES):** Advisory: "You elected the Optional Standard Deduction (40% of gross receipts). No itemized expense records are required. Note: had you elected the 8% flat rate instead, your total tax for 2025 would be ₱52,000 (vs ₱77,500 under OSD) — a savings of ₱25,500. The OSD election on your Q1 2025 Form 1701Q is irrevocable for tax year 2025. For tax year 2026, elect 8% on your first quarterly Form 1701Q (due May 15, 2026) to realize this savings, unless your 2026 business expenses are expected to exceed 40% of gross receipts."

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (OSD graduated rate section)

**PL-16 (Penalties):** ₱0.00 (on-time)

**Quarterly 1701Q OSD tracker (Item 57 = prior-quarter cumulative CWT; Item 58 = new current-quarter CWT):**

**Q1 1701Q (filed on/before May 15, 2025):**
- Item 36 (current quarter gross): ₱200,000.00
- OSD (Q1 portion = Item 40): ₱200,000 × 0.40 = ₱80,000.00
- Item 41 (NTI, Q1 portion): ₱120,000.00
- Item 42 (prior NTI carryforward): ₱0.00 (first quarter)
- Item 43 (cumulative NTI): ₱120,000.00
- Item 44 (cumulative IT): graduated_tax_2023(120,000) = ₱0.00 (below ₱250K)
- Item 57 (prior-quarter CWT): ₱0.00
- Item 58 (current quarter new CWT): ₱10,000.00 (Corp A Q1 ₱5,000 + Corp B Q1 ₱5,000)
- Item 59 (cumulative CWT): ₱10,000.00
- Q1 payable: max(0 − 10,000, 0) = ₱0.00 (NIL return filed)

**Q2 1701Q (filed on/before August 15, 2025):**
- Item 36 (current quarter gross): ₱250,000.00
- OSD (Q2 portion): ₱250,000 × 0.40 = ₱100,000.00
- Item 41 (NTI, Q2 portion): ₱150,000.00
- Item 42 (prior NTI carryforward = Q1 cumul NTI): ₱120,000.00
- Item 43 (cumulative NTI): ₱270,000.00 (= 120,000 + 150,000)
- Item 44 (cumulative IT): graduated_tax_2023(270,000) = (270,000 − 250,000) × 0.15 = ₱3,000.00
- Item 57 (prior-quarter CWT = Q1 cumul CWT): ₱10,000.00
- Item 58 (current quarter new CWT): ₱12,500.00 (Corp A Q2 ₱6,250 + Corp B Q2 ₱6,250)
- Item 59 (cumulative CWT): ₱22,500.00
- Q2 payable: max(3,000 − 22,500, 0) = ₱0.00 (NIL return filed)

**Q3 1701Q (filed on/before November 15, 2025):**
- Item 36 (current quarter gross): ₱250,000.00
- OSD (Q3 portion): ₱250,000 × 0.40 = ₱100,000.00
- Item 41 (NTI, Q3 portion): ₱150,000.00
- Item 42 (prior NTI carryforward = Q2 cumul NTI): ₱270,000.00
- Item 43 (cumulative NTI): ₱420,000.00 (= 270,000 + 150,000)
- Item 44 (cumulative IT): graduated_tax_2023(420,000) = 22,500 + (420,000 − 400,000) × 0.20 = 22,500 + 4,000 = ₱26,500.00
- Item 57 (prior-quarter CWT = Q1+Q2 cumul CWT): ₱22,500.00
- Item 58 (current quarter new CWT): ₱12,500.00 (Corp A Q3 ₱6,250 + Corp B Q3 ₱6,250)
- Item 59 (cumulative CWT): ₱35,000.00
- Q3 payable: max(26,500 − 35,000, 0) = ₱0.00 (NIL return filed)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  locked_regime: true,  elected_regime: PATH_B,

  regime_comparison: {
    path_a: { eligible: true, nti: 900000.00, income_tax: 127500.00,
              percentage_tax: 27000.00, total_tax: 154500.00 },
    path_b: { eligible: true, nti: 540000.00, osd_amount: 360000.00,
              income_tax: 50500.00, percentage_tax: 27000.00, total_tax: 77500.00 },
    path_c: { eligible: true, tax_base: 650000.00, income_tax: 52000.00,
              percentage_tax: 0.00, total_tax: 52000.00, ineligibility_reasons: [],
              note: "Path C cannot be selected this year (OSD elected on Q1 1701Q). Shown for comparison only." },
    recommended_path_if_unlocked: PATH_C,
    locked_path: PATH_B,
    opportunity_cost: 25500.00,
    savings_vs_worst_if_unlocked: 102500.00
  },

  selected_path: PATH_B,
  income_tax_due: 50500.00,
  percentage_tax_due: 27000.00,
  total_tax_due: 77500.00,
  cwt_credits: 45000.00,
  cwt_by_atc: { WI010: 45000.00 },
  quarterly_it_paid: 0.00,
  balance_payable: 32500.00,
  balance_payable_breakdown: {
    income_tax_balance: 5500.00,
    percentage_tax_total: 27000.00,
    pt_note: "PT ₱27,000 filed separately via quarterly Form 2551Q. Cash due at annual 1701A: ₱5,500 income tax only."
  },
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],  ineligibility_notifications: [],

  quarterly_tracker: [
    { quarter: 1, cumul_gross: 200000.00, cumul_nti: 120000.00, cumul_it: 0.00,
      item_57_prior_cwt: 0.00, item_58_new_cwt: 10000.00, item_59_cumul_cwt: 10000.00,
      quarterly_payable: 0.00 },
    { quarter: 2, cumul_gross: 450000.00, cumul_nti: 270000.00, cumul_it: 3000.00,
      item_57_prior_cwt: 10000.00, item_58_new_cwt: 12500.00, item_59_cumul_cwt: 22500.00,
      quarterly_payable: 0.00 },
    { quarter: 3, cumul_gross: 700000.00, cumul_nti: 420000.00, cumul_it: 26500.00,
      item_57_prior_cwt: 22500.00, item_58_new_cwt: 12500.00, item_59_cumul_cwt: 35000.00,
      quarterly_payable: 0.00 }
  ]
}
```

### Verification

- **Path B NTI:** 900,000 × 0.60 = 540,000; bracket 3: 22,500 + (540,000 − 400,000) × 0.20 = 22,500 + 28,000 = **₱50,500** ✓
- **PT:** 900,000 × 0.03 = **₱27,000** ✓; total Path B = **₱77,500** ✓
- **Path C (counterfactual):** (900,000 − 250,000) × 0.08 = 650,000 × 0.08 = **₱52,000** ✓
- **Opportunity cost:** 77,500 − 52,000 = **₱25,500** ✓
- **CWT:** 8 entries: Q1 ₱10,000 + Q2 ₱12,500 + Q3 ₱12,500 + Q4 ₱10,000 = **₱45,000** ✓
- **IT balance:** 50,500 − 45,000 = **₱5,500** ✓
- **Q1 cumul IT:** graduated(120,000) = ₱0 ✓; payable = max(0 − 10,000, 0) = **₱0** ✓
- **Q2 cumul NTI:** 120,000 + 150,000 = 270,000; IT = (270,000 − 250,000) × 0.15 = **₱3,000** ✓; payable = max(3,000 − 22,500, 0) = **₱0** ✓
- **Q3 cumul NTI:** 270,000 + 150,000 = 420,000; IT = 22,500 + 20,000 × 0.20 = **₱26,500** ✓; payable = max(26,500 − 35,000, 0) = **₱0** ✓
- **Item 57 Q2 = Q1 cumul CWT = ₱10,000** ✓; Item 58 Q2 = Q2 new CWT = ₱12,500 ✓; Item 59 Q2 = ₱22,500 ✓
- **Item 57 Q3 = Q1+Q2 cumul CWT = ₱22,500** ✓; Item 58 Q3 = Q3 new CWT = ₱12,500 ✓; Item 59 Q3 = ₱35,000 ✓
- **Balance formula:** 50,500 + 27,000 − 45,000 − 0 = **₱32,500** ✓ (income tax balance ₱5,500 + PT ₱27,000)

**Legal basis:** OSD election irrevocable: RR 8-2018 Sec. 2(B)(2)(a). OSD rate (40%): NIRC Sec. 34(L). CWT credit against IT: NIRC Sec. 58; CR-009. Quarterly CWT Items 57/58: BIR Form 1701Q Instructions. Cumulative OSD method: NIRC Sec. 74; CR-008. PT (3%): NIRC Sec. 116. PT quarterly via Form 2551Q: NIRC Sec. 128. Form 1701A: BIR RA 11976 EOPT.

---

## TV-EX-G5-003: SC-P-ML-8-CWT-PLATFORM — Upwork/Payoneer (WI760) Plus Local Client (WI010), 8% Regime

**Scenario code:** SC-P-ML-8-CWT-PLATFORM
**Description:** Web developer earning ₱800,000 from Upwork (paid via Payoneer) plus ₱200,000 from a local Philippine corporate client. Total gross receipts = ₱1,000,000. Under the 8% regime. Payoneer withholds under RR 16-2023: the Payoneer Form 2307 shows an income payment equal to 50% of the net remittance (₱720,000) = ₱360,000, and a tax withheld of 1% of that base = ₱3,600 (effective 0.5% of net remittance; 0.45% of contract value). The local client withholds 5% EWT (WI010): ₱10,000. Total CWT = ₱13,600. Path C (8%) is optimal; balance payable = ₱46,400. This vector demonstrates: (1) two distinct ATC codes aggregated (WI760 platform + WI010 professional); (2) the 2307 income payment field on the Payoneer 2307 (₱360,000) differs from the Upwork gross receipts (₱800,000) and from the net remittance (₱720,000); (3) the Upwork service fee is deductible under Path A but irrelevant for Path C.

**RR 16-2023 threshold check:** Payoneer cumulative remittances = ₱720,000 > ₱500,000 annual threshold AND no Sworn Declaration submitted → withholding applies to all Payoneer remittances. (Engine conservative approach: if annual cumulative > ₱500K, apply withholding retroactively to full year's remittances, per CR-019 conservative engine rule.) Combined platform gross receipts = ₱720,000 > ₱500,000 → withholding triggered.

### Input (fields differing from Group 5 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,000,000.00 | ₱800,000 Upwork contract value + ₱200,000 local client |
| All itemized expense fields | ₱0.00 | No documented expenses entered; Upwork fee excluded from optimizer input |
| `elected_regime` | null | Optimizer mode |
| `cwt_2307_entries` | 3 entries (see table) | WI760 (Payoneer annual) + WI010 (local client Q2 + Q4) |
| `prior_quarterly_payments` | [{quarter:1, amount:0.00}, {quarter:2, amount:0.00}, {quarter:3, amount:0.00}] | No cash quarterly IT payments |

**CWT entries (Form 2307):**

| # | ATC | Payor | Period | Income Payment | Tax Withheld | Notes |
|---|-----|-------|--------|----------------|--------------|-------|
| 1 | WI760 | Payoneer (E-commerce Philippines Inc.) | Annual 2025 (Jan–Dec) | ₱360,000.00 | ₱3,600.00 | 50% of ₱720,000 net remittance; 1% of ₱360,000 taxable base |
| 2 | WI010 | Delta Corp | Q2 2025 (Apr–Jun) | ₱100,000.00 | ₱5,000.00 | 5% professional EWT |
| 3 | WI010 | Delta Corp | Q4 2025 (Oct–Dec) | ₱100,000.00 | ₱5,000.00 | 5% professional EWT |

**Payoneer 2307 derivation:**
- Upwork contract value (gross receipts for BIR): ₱800,000.00
- Upwork service fee (10% of contract): ₱80,000.00
- Net remittance to Payoneer → freelancer: ₱720,000.00
- Taxable base on 2307: ₱720,000 × 0.50 = ₱360,000.00 (per CR-019 formula)
- Tax withheld on 2307: ₱360,000 × 0.01 = ₱3,600.00 (1% of taxable base)
- Effective rate vs net remittance: ₱3,600 / ₱720,000 = 0.500%
- Effective rate vs contract value: ₱3,600 / ₱800,000 = 0.450%

**Total CWT:** ₱3,600 (WI760) + ₱5,000 (WI010 Q2) + ₱5,000 (WI010 Q4) = ₱13,600.00

**Note on itemized deductions:** Upwork service fee ₱80,000 (10% of contract) is deductible under Path A as a business expense. This is NOT entered in the vector (no expenses input). If entered, Path A NTI would be ₱920,000 (vs ₱1,000,000) and total Path A = graduated(920,000) + PT = [102,500 + (920,000−800,000)×0.25] + 30,000 = 132,500 + 30,000 = ₱162,500 — still far above Path C (₱60,000).

**Total itemized expenses:** ₱0.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱1,000,000.00; taxpayer_tier = MICRO; income_type = PURELY_SE

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** total_itemized_deductions = ₱0.00; ear_cap = ₱1,000,000 × 0.01 = ₱10,000.00; nolco_applied = ₱0.00

**PL-06:** osd_amount = ₱1,000,000 × 0.40 = ₱400,000.00; nti_path_b = ₱600,000.00

**PL-07 (CWT aggregation):**
- WI760 entry: income_payment = ₱360,000 (NOT ₱800,000 — engine must NOT add ₱360K to gross_receipts; it is already included in the ₱1,000,000 gross_receipts input); tax_withheld = ₱3,600
- WI010 entries: two entries totaling income_payment ₱200,000; tax_withheld ₱10,000
- cwt_by_atc = {WI760: ₱3,600.00, WI010: ₱10,000.00}
- income_tax_cwt = ₱13,600.00 (both ATC codes classified as INCOME_TAX_CWT; neither is PT_CWT)
- pt_cwt = ₱0.00
- total_cwt = ₱13,600.00
- MRF flag check: WI760 is a known ATC code (RR 16-2023); engine does NOT fire WARN-017

**PL-08 (Path A):**
- nti_path_a = ₱1,000,000.00 (no itemized deductions entered)
- income_tax = graduated_tax_2023(1,000,000) = 102,500 + (1,000,000 − 800,000) × 0.25 = 102,500 + 50,000 = ₱152,500.00
- pt = ₱1,000,000 × 0.03 = ₱30,000.00
- total_path_a = ₱182,500.00

**PL-09 (Path B):**
- nti_path_b = ₱600,000.00
- income_tax = graduated_tax_2023(600,000) = 22,500 + (600,000 − 400,000) × 0.20 = 22,500 + 40,000 = ₱62,500.00
- pt = ₱30,000.00
- total_path_b = ₱92,500.00

**PL-10 (Path C):**
- eight_pct_base = max(1,000,000 − 250,000, 0) = ₱750,000.00
- income_tax = ₱750,000 × 0.08 = ₱60,000.00
- pt = ₱0.00
- total_path_c = ₱60,000.00

**PL-13:**
- Path A: ₱182,500
- Path B: ₱92,500
- Path C: ₱60,000 ← MINIMUM
- recommended_path = PATH_C
- savings_vs_next_best = ₱92,500 − ₱60,000 = ₱32,500.00 (vs Path B)
- savings_vs_worst = ₱182,500 − ₱60,000 = ₱122,500.00

**PL-14 (Balance — Path C):**
- income_tax_due = ₱60,000.00
- percentage_tax_due = ₱0.00
- total_tax_due = ₱60,000.00
- cwt_credits = ₱13,600.00
- quarterly_it_paid = ₱0.00
- balance_payable_raw = 60,000 + 0 − 13,600 − 0 = ₱46,400.00
- balance_payable = ₱46,400.00
- overpayment = ₱0.00

**WARN-004 fires (WARN_VERY_LOW_EXPENSES):** Advisory: "No business expenses were entered. Upwork charges a 10% service fee (₱80,000 on ₱800,000 gross) which is deductible under Path A (Itemized Deductions). Entering this under itemized_expenses.other_expenses would reduce Path A total tax from ₱182,500 to ₱162,500 — still ₱102,500 more than Path C (₱60,000). Consider recording the fee for documentation purposes even though it does not affect the regime recommendation."

**PL-15:** form = FORM_1701A; form_section = PART_IV_B (8% section)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 1000000.00, income_tax: 152500.00,
              percentage_tax: 30000.00, total_tax: 182500.00 },
    path_b: { eligible: true, nti: 600000.00, osd_amount: 400000.00,
              income_tax: 62500.00, percentage_tax: 30000.00, total_tax: 92500.00 },
    path_c: { eligible: true, tax_base: 750000.00, income_tax: 60000.00,
              percentage_tax: 0.00, total_tax: 60000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 32500.00,
    savings_vs_worst: 122500.00
  },

  selected_path: PATH_C,
  income_tax_due: 60000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 60000.00,
  cwt_credits: 13600.00,
  cwt_by_atc: { WI760: 3600.00, WI010: 10000.00 },
  quarterly_it_paid: 0.00,
  balance_payable: 46400.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],  ineligibility_notifications: [],

  platform_cwt_detail: {
    upwork_contract_value: 800000.00,
    upwork_service_fee_10pct: 80000.00,
    payoneer_net_remittance: 720000.00,
    payoneer_2307_income_payment: 360000.00,
    payoneer_2307_tax_withheld: 3600.00,
    effective_rate_vs_net_remittance_pct: 0.500,
    effective_rate_vs_contract_pct: 0.450,
    rr_16_2023_threshold_exceeded: true,
    withholding_basis: "Combined Payoneer remittances ₱720,000 > ₱500,000 annual threshold (condition_3 met)"
  }
}
```

### Verification

- **Path C IT:** 750,000 × 0.08 = **₱60,000** ✓
- **Path B:** NTI = 600,000; IT = 22,500 + 200,000 × 0.20 = **₱62,500**; PT = **₱30,000**; total = **₱92,500** ✓
- **Path A IT:** 102,500 + (1,000,000 − 800,000) × 0.25 = 102,500 + 50,000 = **₱152,500**; total = **₱182,500** ✓
- **WI760 taxable base:** ₱720,000 × 0.50 = **₱360,000** ✓; CWT = ₱360,000 × 0.01 = **₱3,600** ✓
- **Effective rate:** ₱3,600 / ₱720,000 = **0.500%** of net remittance ✓; ₱3,600 / ₱800,000 = **0.450%** of contract ✓
- **WI010 total:** 2 × ₱100,000 × 0.05 = **₱10,000** ✓
- **Total CWT:** 3,600 + 10,000 = **₱13,600** ✓
- **Balance:** 60,000 − 13,600 = **₱46,400** ✓
- **Threshold check:** ₱720,000 > ₱500,000 → withholding applies; no Sworn Declaration → condition_2 and condition_3 both met ✓
- **Both ATC codes classified as INCOME_TAX_CWT:** WI760 (e-marketplace withholding, credits against IT per RR 16-2023); WI010 (professional fee withholding, credits against IT per RR 2-98) ✓
- **WARN-017 does NOT fire:** WI760 is a recognized ATC code in the engine's ATC lookup table ✓

**Legal basis:** RR 16-2023 Sec. 3 (e-marketplace CWT); RMC 8-2024 (threshold and application rules); CR-019 (withholding formula and 2307 mechanics). WI010 5%: RR 2-98 Sec. 2.57.2(E). 8% option: NIRC Sec. 24(A)(2)(b). CWT vs PT classification: WI760 → income_tax_cwt (RR 16-2023); WI010 → income_tax_cwt (NIRC Sec. 58). Form 1701A: BIR RA 11976 EOPT.

---

## GROUP 5 SUMMARY TABLE

| Vector | Scenario | GR | CWT | CWT ATCs | IT (Optimal) | Balance | Overpayment | Key Feature |
|--------|---------|-----|-----|----------|-------------|---------|-------------|-------------|
| TV-EX-G5-001 | SC-P-ML-8-CWT | ₱600,000 | ₱30,000 | WI010 only | ₱28,000 (8%) | ₱0 | ₱2,000 (CARRY_OVER) | CWT > IT; WARN-009; all NIL quarterly |
| TV-EX-G5-002 | SC-P-ML-O-CWT | ₱900,000 | ₱45,000 | WI010 only | ₱50,500 (OSD, locked) | ₱32,500 (IT ₱5,500 + PT ₱27,000) | ₱0 | Item 57/58 tracking; locked OSD; ₱25,500 opp. cost vs 8% |
| TV-EX-G5-003 | SC-P-ML-8-CWT-PLATFORM | ₱1,000,000 | ₱13,600 | WI760 ₱3,600 + WI010 ₱10,000 | ₱60,000 (8%) | ₱46,400 | ₱0 | Dual CWT types; Payoneer 2307 50% base mechanics |

**Key insights validated:**

1. **CWT offsets income tax only.** Under 8% (Path C, PT = ₱0), CWT directly reduces balance and can produce overpayment. Under OSD (Path B, PT > ₱0), CWT first exhausts IT down to its floor, leaving PT as a separate obligation filed via quarterly Form 2551Q.

2. **8% CWT crossover at ₱666,667 gross (all-5%-CWT scenario).** Below this, 5% CWT exceeds 8% IT, producing overpayment. At ₱600,000 gross: CWT ₱30,000 > IT ₱28,000 → overpayment ₱2,000. Above ₱666,667, the 8% IT exceeds CWT, leaving a positive balance payable.

3. **Quarterly NIL returns from CWT offset.** When cumulative CWT ≥ cumulative IT at the quarterly checkpoint, quarterly payable = ₱0. The quarterly 1701Q is still filed (NIL return) — it is never omitted. Form 2551Q for PT is also filed quarterly regardless of CWT credits.

4. **Item 57 vs Item 58 on Form 1701Q.** Item 57 = cumulative CWT from all PRIOR quarters (imported from prior return's Item 59). Item 58 = NEW 2307s received THIS quarter. Item 59 = Item 57 + Item 58 = running cumulative. The engine tracks this per-quarter split to correctly populate both fields on the quarterly return.

5. **WI760 (Payoneer/RR 16-2023) 2307 mechanics.** The 2307 income_payment = 50% of net remittance (NOT 50% of contract value and NOT the full gross receipts). Tax withheld = 1% of that base. Effective rate = 0.5% of net remittance. Gross receipts for income tax purposes remains the full contract value. The ₱80,000 Upwork service fee is deductible under Path A but absorbed into Path C's 8% flat rate computation without separate recognition.

6. **Both WI760 and WI010 are classified as INCOME_TAX_CWT.** Neither is PT_CWT. They aggregate into total_cwt_credits and offset income tax on the annual ITR. WARN-017 fires only if an unknown ATC code is entered (neither WI760 nor WI010 trigger it).

---

## GROUP 6: Threshold Crossing

**3 scenario codes:** SC-CROSS-3M, SC-AT-3M, SC-NEAR-3M

**What this group tests:** The ₱3,000,000 gross receipts boundary is the single most consequential threshold in the entire engine. It simultaneously governs (1) taxpayer tier classification (MICRO uses strict `< ₱3M`; SMALL uses `≥ ₱3M`), (2) 8% option eligibility (inclusive `≤ ₱3M`), and (3) mandatory VAT registration (strict `> ₱3M`). These three rules use different boundary expressions, so their interaction at exactly ₱3M and in the ₱2.7M–₱3M "warning zone" produces non-obvious results that the engine must compute correctly.

**SC-AT-3M → See TV-EDGE-001 in [edge-cases.md](edge-cases.md)**
Summary: GR = exactly ₱3,000,000. taxpayer_tier = SMALL (not MICRO; MICRO threshold is strict `< ₱3M`). 8% is still eligible (inclusive `≤ ₱3M`). VAT registration is NOT required (strict `> ₱3M` not met at exactly ₱3M). Annual IT = (₱3,000,000 − ₱250,000) × 0.08 = ₱220,000. Total tax = ₱220,000. Path C wins over OSD (₱442,500) by ₱222,500. No WARN-001 (fires only when `> ₱2,700,000 AND ≤ ₱3,000,000`; at exactly ₱3M the condition still meets ≤ ₱3M, so WARN-001 DOES fire at GR = ₱3,000,000). Form: FORM_1701A Part IV-B.

**SC-CROSS-3M → See TV-EDGE-006 in [edge-cases.md](edge-cases.md)**
Summary: Annual GR = ₱3,200,000. Taxpayer elected 8% at Q1 1701Q. Annual gross exceeds ₱3M → 8% retroactively cancelled at annual reconciliation. Path B (OSD, graduated) applies to full year. All Q1–Q3 quarterly IT payments (₱172,000, computed under 8%) are reclassified as advance payments toward the graduated-rate annual liability. Annual tax due (Path B) = ₱462,500. After crediting ₱172,000, balance payable = ₱290,500. WARN-002 fires (gross > ₱3M, not VAT-registered yet). Form: FORM_1701 (not 1701A; Path A/B required when 8% cancelled). IN-01 (INELIGIBLE_8PCT_THRESHOLD) fires in results table.

---

## TV-EX-G6-001: SC-NEAR-3M — Near-Threshold Service Provider, 8% in Warning Zone

**Scenario code:** SC-NEAR-3M
**Description:** A senior software developer earns ₱2,900,000 annual gross receipts, all from professional service contracts with no recorded business expenses. This vector demonstrates: (1) WARN-001 (WARN_NEAR_VAT_THRESHOLD) fires because GR = ₱2,900,000 is within the ₱300,000 warning band (₱2,700,001–₱3,000,000); (2) the engine still recommends Path C (8%) with savings of ₱212,500 over OSD; (3) the quarterly computation shows WARN-001 fires only at the ANNUAL level (not during Q1–Q3 returns, because those cumulative totals remain below ₱2,700,000); (4) the engine attaches a threshold proximity analysis showing the ₱100,000 buffer to crossing and the total additional tax cost if the buffer is breached; (5) taxpayer_tier = MICRO (₱2,900,000 is strictly less than ₱3,000,000 — this contrasts with TV-EDGE-001 where ₱3,000,000 exactly gives SMALL tier).

**Tax year:** 2025
**Filing period:** ANNUAL

**Note on scenarios.md savings estimate:** The scenarios.md description for SC-NEAR-3M states "₱76,000–₱83,800 advantage for 8%". This figure is incorrect for the ₱2.8M–₱2.99M gross range. Those savings (₱76K–₱83.8K) correspond to gross receipts of approximately ₱1.5M–₱1.6M. The correct savings at GR = ₱2,900,000 are ₱212,500 (Path B total ₱424,500 minus Path C total ₱212,000). At GR = ₱2,800,000, savings are ₱202,500. This test vector uses the mathematically correct figures.

### Input (fields differing from Group 1 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,900,000.00 | Annual professional service fees |
| All itemized expense fields | ₱0.00 each | No receipts retained; no documented expenses |
| `elected_regime` | `null` | Optimizer mode — engine recommends |
| `cwt_2307_entries` | `[]` | Clients do not withhold (verified: prior-year gross ≤ ₱3M at start of year; corporate client pays gross to developer without withholding because client is not a top withholding agent) |
| `prior_quarterly_payments` | `[{quarter:1, amount:28000.00}, {quarter:2, amount:60000.00}, {quarter:3, amount:68000.00}]` | Quarterly 8% IT payments per Q1–Q3 1701Q; see quarterly supplement |
| `is_first_year_registrant` | `false` | Established taxpayer |
| `actual_filing_date` | `2026-04-15` | Filed on time |

**Total itemized expenses:** ₱0.00 (0.0% of GR)

**Quarterly income breakdown:**
- Q1 (Jan–Mar 2025): ₱600,000.00 — four monthly retainers
- Q2 (Apr–Jun 2025): ₱750,000.00 — project milestone payments
- Q3 (Jul–Sep 2025): ₱850,000.00 — year's largest quarter
- Q4 (Oct–Dec 2025): ₱700,000.00 — year-end contract completions
- **Total TY2025: ₱2,900,000.00**

### Quarterly Computation Supplement (8% Cumulative Method)

**Q1 1701Q (due May 15, 2025):**
- Cumulative GR through Q1: ₱600,000.00
- 8% base: `max(600,000 − 250,000, 0)` = ₱350,000.00
- Cumulative IT due: ₱350,000 × 0.08 = **₱28,000.00**
- Prior quarterly IT paid: ₱0.00
- **Q1 balance payable: ₱28,000.00**
- WARN-001 check at Q1: cumulative GR ₱600,000 ≤ ₱2,700,000 → does NOT fire
- 8% election signified on Q1 return; irrevocable for TY2025

**Q2 1701Q (due August 15, 2025):**
- Cumulative GR through Q2: ₱600,000 + ₱750,000 = ₱1,350,000.00
- 8% base: `max(1,350,000 − 250,000, 0)` = ₱1,100,000.00
- Cumulative IT due: ₱1,100,000 × 0.08 = **₱88,000.00**
- Prior quarterly IT paid: ₱28,000.00
- **Q2 balance payable: ₱88,000 − ₱28,000 = ₱60,000.00**
- WARN-001 check at Q2: cumulative GR ₱1,350,000 ≤ ₱2,700,000 → does NOT fire

**Q3 1701Q (due November 15, 2025):**
- Cumulative GR through Q3: ₱1,350,000 + ₱850,000 = ₱2,200,000.00
- 8% base: `max(2,200,000 − 250,000, 0)` = ₱1,950,000.00
- Cumulative IT due: ₱1,950,000 × 0.08 = **₱156,000.00**
- Prior quarterly IT paid: ₱88,000.00
- **Q3 balance payable: ₱156,000 − ₱88,000 = ₱68,000.00**
- WARN-001 check at Q3: cumulative GR ₱2,200,000 ≤ ₱2,700,000 → does NOT fire
- ₱3M threshold check at Q3: cumulative GR ₱2,200,000 ≤ ₱3,000,000 → 8% election remains valid

**Total quarterly IT paid:** ₱28,000 + ₱60,000 + ₱68,000 = **₱156,000.00**

**Q4 note:** Q4 GR = ₱700,000; cumulative through Q4 = ₱2,900,000 (< ₱3,000,000). 8% election is NOT cancelled. No Q4 quarterly return; annual 1701A reconciles full year.

### Expected Intermediate Values (Annual)

**PL-02 Classification:**
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER
- `taxpayer_tier` = MICRO (₱2,900,000 < ₱3,000,000 strictly — MICRO threshold is `gross < ₱3M`)
- `is_eight_pct_eligible` = true (₱2,900,000 ≤ ₱3,000,000 — 8% uses inclusive boundary)
- `vat_registration_required` = false (₱2,900,000 does not exceed ₱3,000,000)
- `pct_tax_applicable` = true (non-VAT; but waived under Path C)

**PL-04 (8% Eligibility):**
- `path_c_eligible` = true
- `ineligibility_reasons` = []

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00
- `ear_cap` = ₱2,900,000 × 0.01 = ₱29,000.00 (not applied; no EAR expense)
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱2,900,000 × 0.40 = ₱1,160,000.00
- `nti_path_b` = ₱2,900,000 × 0.60 = ₱1,740,000.00

**PL-07 (CWT):**
- `total_cwt` = ₱0.00 (no 2307 entries)

**PL-08 (Path A — Itemized, no expenses):**
- `nti_path_a` = ₱2,900,000 − ₱0 = ₱2,900,000.00
- `income_tax_path_a` = graduated_tax_2023(₱2,900,000)
  Bracket 5 (₱2,000,001–₱8,000,000): ₱402,500 + (₱2,900,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱900,000 × 0.30
  = ₱402,500 + ₱270,000 = **₱672,500.00**
- `percentage_tax_path_a` = ₱2,900,000 × 0.03 = **₱87,000.00**
- `total_tax_path_a` = **₱759,500.00**

**PL-09 (Path B — OSD):**
- `nti_path_b` = ₱1,740,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,740,000)
  Bracket 4 (₱800,001–₱2,000,000): ₱102,500 + (₱1,740,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱940,000 × 0.25
  = ₱102,500 + ₱235,000 = **₱337,500.00**
- `percentage_tax_path_b` = **₱87,000.00**
- `total_tax_path_b` = **₱424,500.00**

**PL-10 (Path C — 8% Flat Rate):**
- `eight_pct_base` = ₱2,900,000 − ₱250,000 = ₱2,650,000.00
- `income_tax_path_c` = ₱2,650,000 × 0.08 = **₱212,000.00**
- `percentage_tax_path_c` = **₱0.00** (waived under 8%)
- `total_tax_path_c` = **₱212,000.00**

**PL-13 (Compare All Paths):**
- Path A total: ₱759,500.00
- Path B total: ₱424,500.00
- Path C total: ₱212,000.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱424,500 − ₱212,000 = **₱212,500.00** (vs Path B)
- `savings_vs_worst` = ₱759,500 − ₱212,000 = **₱547,500.00** (vs Path A)

**PL-14 (Balance — Path C):**
- `income_tax_due` = ₱212,000.00
- `percentage_tax_due` = ₱0.00
- `total_tax_due` = ₱212,000.00
- `cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱156,000.00 (Q1: ₱28K + Q2: ₱60K + Q3: ₱68K)
- `balance_payable_raw` = 212,000 − 0 − 156,000 = **₱56,000.00**
- `balance_payable` = ₱56,000.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701A (pure SE, 8% elected, no compensation income)
- `form_section` = PART_IV_B (8% section on Form 1701A)

**PL-16 (Penalty Check):**
- Filed April 15, 2026 (on time) → no penalties

**Warning generation:**
- WARN_NEAR_VAT_THRESHOLD (WARN-001): GR = ₱2,900,000 > ₱2,700,000 AND ≤ ₱3,000,000 AND not VAT-registered → **fires**
- WARN_NO_2307_ENTRIES (WARN-003): does NOT fire (Path C recommended; WARN-003 fires only when Path A is recommended without CWT)
- WARN_VERY_LOW_EXPENSES (WARN-004): does NOT fire (no expenses entered; Path C recommended — WARN-004 fires only when expenses < 5% of GR AND Path A is recommended)

**Threshold proximity analysis (engine-computed supplement):**
- `current_gross` = ₱2,900,000.00
- `vat_threshold` = ₱3,000,000.00
- `buffer_remaining` = ₱100,000.00 (before 8% becomes unavailable)
- `buffer_pct_of_threshold` = 3.33% (₱100,000 / ₱3,000,000)
- `total_cost_if_cross` (counterfactual at GR = ₱3,000,001, Path B OSD): graduated_tax_2023(₱1,800,000) + ₱90,000 = ₱352,500 + ₱90,000 = ₱442,500 (vs ₱212,000 at current GR on Path C); crossing costs approximately ₱230,500 extra per year
- `cross_scenario_ref` = "SC-CROSS-3M (TV-EDGE-006): mid-year crossing retroactively cancels 8%; see edge-cases.md"

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,
  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 2900000.00,
      itemized_deductions: 0.00,
      income_tax: 672500.00,
      percentage_tax: 87000.00,
      total_tax: 759500.00
    },
    path_b: {
      eligible: true,
      nti: 1740000.00,
      osd_amount: 1160000.00,
      income_tax: 337500.00,
      percentage_tax: 87000.00,
      total_tax: 424500.00
    },
    path_c: {
      eligible: true,
      tax_base: 2650000.00,
      income_tax: 212000.00,
      percentage_tax: 0.00,
      total_tax: 212000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 212500.00,
    savings_vs_worst: 547500.00
  },

  selected_path: PATH_C,
  income_tax_due: 212000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 212000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 156000.00,
  balance_payable: 56000.00,
  overpayment: 0.00,
  overpayment_disposition: null,

  form: FORM_1701A,
  form_section: PART_IV_B,

  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN_NEAR_VAT_THRESHOLD],
  manual_review_flags: [],
  ineligibility_notifications: [],

  threshold_proximity_analysis: {
    current_gross: 2900000.00,
    vat_threshold: 3000000.00,
    buffer_remaining: 100000.00,
    buffer_pct_of_threshold: 3.33,
    warn_threshold: 2700000.00,
    warn_fired: true,
    counterfactual_path_b_at_3000001: {
      nti: 1800000.60,
      income_tax: 352500.15,
      percentage_tax: 90000.03,
      total_tax: 442500.18,
      additional_cost_vs_current_path_c: 230500.18
    },
    cross_scenario_ref: "SC-CROSS-3M (TV-EDGE-006 in edge-cases.md)"
  },

  quarterly_tracker: [
    {
      quarter: 1,
      cumul_gross: 600000.00,
      eight_pct_base: 350000.00,
      cumul_it_due: 28000.00,
      prior_paid: 0.00,
      quarterly_payable: 28000.00,
      warn_001_at_this_quarter: false,
      threshold_crossed_at_this_quarter: false
    },
    {
      quarter: 2,
      cumul_gross: 1350000.00,
      eight_pct_base: 1100000.00,
      cumul_it_due: 88000.00,
      prior_paid: 28000.00,
      quarterly_payable: 60000.00,
      warn_001_at_this_quarter: false,
      threshold_crossed_at_this_quarter: false
    },
    {
      quarter: 3,
      cumul_gross: 2200000.00,
      eight_pct_base: 1950000.00,
      cumul_it_due: 156000.00,
      prior_paid: 88000.00,
      quarterly_payable: 68000.00,
      warn_001_at_this_quarter: false,
      threshold_crossed_at_this_quarter: false
    },
    {
      quarter: "annual_reconciliation",
      total_gross: 2900000.00,
      eight_pct_base: 2650000.00,
      annual_it: 212000.00,
      total_prior_paid: 156000.00,
      annual_balance: 56000.00,
      warn_001_fires: true,
      note: "WARN_NEAR_VAT_THRESHOLD fires at annual because final GR ₱2,900,000 > ₱2,700,000 warning threshold. Did not fire during quarterly returns because Q1 cumulative ₱600K and Q2 ₱1,350K and Q3 ₱2,200K were all below ₱2,700K."
    }
  ]
}
```

**WARN_NEAR_VAT_THRESHOLD** fires with message: "Your gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If your total receipts for the year exceed ₱3,000,000, you will be required to register for VAT, and the 8% option will no longer be available to you. Monitor your receipts closely and register for VAT before the threshold is crossed."

### Verification

- **taxpayer_tier = MICRO:** ₱2,900,000 < ₱3,000,000 (strict) → MICRO ✓; contrast with TV-EDGE-001 where ₱3,000,000 = ₱3,000,000 → SMALL ✓
- **8% eligible:** ₱2,900,000 ≤ ₱3,000,000 (inclusive) → eligible ✓
- **VAT not required:** ₱2,900,000 does not exceed ₱3,000,000 (strict) → no VAT ✓
- **Path A IT:** graduated_tax_2023(₱2,900,000) = 402,500 + (2,900,000 − 2,000,000) × 0.30 = 402,500 + 270,000 = **₱672,500** ✓
- **Path A PT:** 2,900,000 × 0.03 = **₱87,000** ✓; total A = **₱759,500** ✓
- **Path B NTI:** 2,900,000 × 0.60 = **₱1,740,000** ✓
- **Path B IT:** graduated_tax_2023(₱1,740,000): bracket 4: 102,500 + (1,740,000 − 800,000) × 0.25 = 102,500 + 235,000 = **₱337,500** ✓; total B = 337,500 + 87,000 = **₱424,500** ✓
- **Path C base:** 2,900,000 − 250,000 = **₱2,650,000** ✓
- **Path C IT:** 2,650,000 × 0.08 = **₱212,000** ✓; total C = **₱212,000** ✓
- **Savings vs B:** 424,500 − 212,000 = **₱212,500** ✓
- **Q1 payable:** (600,000 − 250,000) × 0.08 = **₱28,000** ✓
- **Q2 payable:** (1,350,000 − 250,000) × 0.08 = ₱88,000 cumul; 88,000 − 28,000 = **₱60,000** ✓
- **Q3 payable:** (2,200,000 − 250,000) × 0.08 = ₱156,000 cumul; 156,000 − 88,000 = **₱68,000** ✓
- **Annual balance:** 212,000 − 156,000 = **₱56,000** ✓
- **WARN-001 condition:** 2,900,000 > 2,700,000 AND 2,900,000 ≤ 3,000,000 AND not VAT → fires ✓
- **WARN-001 NOT at Q1-Q3:** Q1 cumul ₱600K ≤ ₱2,700K; Q2 ₱1,350K ≤ ₱2,700K; Q3 ₱2,200K ≤ ₱2,700K → does not fire during quarterly filings ✓
- **EAR cap:** 1% × 2,900,000 = ₱29,000; no EAR expense claimed → no disallowance ✓
- **PT waiver under 8%:** NIRC Sec. 24(A)(2)(b) "in lieu of graduated income tax rates AND percentage tax under Sec. 116" ✓

**Legal basis:** TRAIN-amended NIRC Sec. 24(A)(2)(b) (8% option, ≤ ₱3M inclusive, PT waiver). NIRC Sec. 116 as amended by CREATE (3% PT, waived for 8% filers). CR-002 (graduated rates, 2023 schedule). CR-031 (₱3M triple boundary: MICRO strict, VAT strict, 8% inclusive). RR 8-2018 Sec. 2(A)(3) (8% option election irrevocable; signified on first quarterly return). NIRC Sec. 74-76 (quarterly cumulative method). CR-008 (quarterly computation). WARN-001 threshold: ₱2,700,000 guard (₱300,000 below ₱3M limit), per error-states.md.

---

## GROUP 6 SUMMARY TABLE

| Vector | Scenario | GR | Tier | 8% Eligible | VAT Required | Optimal Path | Total Tax | Key Feature |
|--------|---------|-----|------|-------------|-------------|-------------|-----------|-------------|
| TV-EDGE-001 (edge-cases.md) | SC-AT-3M | ₱3,000,000 | SMALL | Yes (≤ ₱3M inclusive) | No (strict > ₱3M) | Path C | ₱220,000 | Exact boundary: SMALL tier but 8% still available; no VAT |
| TV-EDGE-006 (edge-cases.md) | SC-CROSS-3M | ₱3,200,000 | SMALL | No (retroactively cancelled) | Yes | Path B (forced) | ₱462,500 | 8% cancelled at annual; all quarterly payments reclassified |
| TV-EX-G6-001 | SC-NEAR-3M | ₱2,900,000 | MICRO | Yes | No | Path C | ₱212,000 | WARN-001 fires at annual only; ₱100K buffer; savings ₱212,500 vs OSD |

**Key insights for Group 6:**

1. **The ₱3M triple coincidence uses three different boundary expressions.** MICRO/SMALL tier split: `gross < ₱3M` (strict less-than). 8% eligibility: `gross ≤ ₱3M` (inclusive less-than-or-equal). VAT registration trigger: `gross > ₱3M` (strict greater-than). At exactly ₱3M: taxpayer is SMALL (not MICRO), still 8%-eligible, and still not VAT-required. See TV-EDGE-001.

2. **WARN-001 fires during annual reconciliation, not necessarily during quarterly returns.** With quarterly income spread evenly or weighted toward later quarters, cumulative GR at Q1 and Q2 may remain below the ₱2,700,000 warning threshold even when the annual total triggers it. The engine applies the WARN-001 check at every computation step (quarterly and annual), but for many near-₱3M earners, the first warning fires only at the annual 1701A.

3. **Crossing ₱3M retroactively cancels 8%.** The crossing does not affect only future quarters — it applies to the entire tax year. All quarterly IT paid under the 8% computation is reclassified as advance payments toward the graduated-rate annual tax. This can create a large surprise balance payable at annual reconciliation. See TV-EDGE-006.

4. **At GR = ₱2,900,000 (no expenses), Path C saves ₱212,500 vs OSD.** The scenarios.md note stating "₱76,000–₱83,800 advantage for 8%" in the SC-NEAR-3M description is incorrect; those savings figures correspond to the ₱1.5M–₱1.6M gross range. Correct savings at ₱2.8M–₱2.999M are approximately ₱202,500–₱222,500 (the savings grow as GR approaches ₱3M because both the 8% base and the OSD NTI increase, but the graduated rate on NTI grows faster than 8% on the incremental base).

5. **The buffer analysis is a user-value feature.** For near-₱3M earners, displaying the exact peso buffer (e.g., "You have ₱100,000 remaining before the 8% option is lost") is high-value information that existing tools do not provide. The `threshold_proximity_analysis` block enables the frontend to render a dedicated "Threshold Watch" card when WARN-001 fires.

---

## GROUP 7: Special Deduction Scenarios

**3 scenario codes:** SC-NOLCO, SC-ZERO-EXPENSE, SC-HIGH-ENTERTAIN

**What distinguishes Group 7:** These scenarios test deduction-specific rules that change which path is optimal — NOLCO carry-over (only available under Path A), zero-expense structure (cleanest case for 8% dominance), and EAR cap enforcement (RR 10-2002 disallowance of excess entertainment expenses). Each vector has a single key deduction rule as its central test point.

**Common characteristics for all Group 7 vectors (except where noted):**
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_vat_registered`: false
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `cost_of_goods_sold`: ₱0.00
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): PURELY_SE
- `taxpayer_tier` (derived): MICRO (all GR < ₱3,000,000)
- `path_c_eligible` (derived): true
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `prior_year_excess_cwt`: ₱0.00
- `return_type`: ORIGINAL
- `actual_filing_date`: null (on-time assumed)
- `filing_period`: ANNUAL
- `tax_year`: 2025

---

## TV-EX-G7-001: SC-NOLCO — Prior Year NOLCO Makes Path A Optimal

**Scenario code:** SC-NOLCO
**Description:** Digital marketing consultant with ₱1,200,000 annual gross receipts and ₱400,000 current-year itemized business expenses (33.3% ratio). Without NOLCO, Path C (₱76,000) would win decisively. However, the taxpayer incurred net operating losses in 2022 (₱300,000) and 2023 (₱200,000) filed under Path A for those years, creating ₱500,000 of carry-over NOLCO available in TY2025. Applying NOLCO (FIFO order: 2022 first) reduces Path A NTI from ₱800,000 to ₱300,000, yielding IT of only ₱7,500. Combined with PT of ₱36,000, Path A total = ₱43,500 — beating Path C (₱76,000) by ₱32,500. This vector demonstrates: (1) NOLCO only deductible under Path A; (2) FIFO application (2022 before 2023); (3) NOLCO cannot reduce NTI below ₱0; (4) both NOLCO entries fully consumed in TY2025; (5) all quarterly 1701Q returns are NIL because proportional NOLCO keeps cumulative NTI below ₱250,000 through Q3.

**NOLCO availability rule (NIRC Sec. 34(D), as referenced in itemized-deductions.md Part 5):** NOLCO deduction is available only when filing under Path A (Itemized Deductions). If the taxpayer switches to Path B (OSD) or Path C (8%) for any year, NOLCO from prior itemized years is **suspended** (not forfeited) during that year and the 3-year expiry clock does not pause. If returning to Path A in a later year, unexpired NOLCO resumes.

**2022 NOLCO expiry note:** The TY2022 NOLCO entry (₱300,000) may be carried over to TY2023, TY2024, and TY2025 (three consecutive taxable years). TY2025 is the **last year** this entry may be used. If not consumed in TY2025, the ₱300,000 expires.

### Input (fields differing from Group 7 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,200,000.00 | Annual digital marketing retainers and project fees |
| `itemized_expenses.salaries_wages` | ₱180,000.00 | 1 project assistant at ₱15,000/month × 12 |
| `itemized_expenses.rent` | ₱60,000.00 | Shared coworking desk ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | Broadband and electricity ₱3,000/month |
| `itemized_expenses.communication` | ₱24,000.00 | Mobile plan, collaboration tools ₱2,000/month |
| `itemized_expenses.supplies` | ₱60,000.00 | Software subscriptions (Adobe CC, project mgmt), consumables |
| `itemized_expenses.taxes_and_licenses` | ₱15,000.00 | BIR ARF ₱500, city business permit ₱14,500 |
| `itemized_expenses.other_expenses` | ₱25,000.00 | Bank charges, professional memberships, insurance |
| All other itemized expense fields | ₱0.00 | |
| `itemized_expenses.nolco_available` | See NOLCO entries below | Prior year losses eligible for carry-over |
| `cwt_2307_entries` | [] | No withholding agents; all clients are individuals |
| `prior_quarterly_payments` | [{period: Q1_2025, amount: 0.00}, {period: Q2_2025, amount: 0.00}, {period: Q3_2025, amount: 0.00}] | All quarterly 1701Q returns filed NIL (see quarterly analysis below) |
| `elected_regime` | null | Optimizer mode — engine recommends |

**Current-year itemized deductions total:** ₱180,000 + ₱60,000 + ₱36,000 + ₱24,000 + ₱60,000 + ₱15,000 + ₱25,000 = **₱400,000.00**

**NOLCO entries (input):**

| # | origin_year | amount | remaining | Expiry | Notes |
|---|------------|--------|-----------|--------|-------|
| 1 | 2022 | ₱300,000.00 | ₱300,000.00 | TY2025 (last year) | 2022 net operating loss; prior years TY2023 and TY2024 used ₱0 (taxpayer was on Path B / OSD both years — NOLCO suspended, not forfeited; TY2025 is the 3rd carry-over year regardless of suspension) |
| 2 | 2023 | ₱200,000.00 | ₱200,000.00 | TY2026 | 2023 net operating loss; first year of use |

**Total NOLCO available:** ₱500,000.00

**Quarterly income distribution assumed (evenly spread, ₱300,000 per quarter):**

| Quarter | Quarterly GR | Cumulative GR |
|---------|-------------|--------------|
| Q1 (Jan–Mar 2025) | ₱300,000.00 | ₱300,000.00 |
| Q2 (Apr–Jun 2025) | ₱300,000.00 | ₱600,000.00 |
| Q3 (Jul–Sep 2025) | ₱300,000.00 | ₱900,000.00 |
| Q4 (Oct–Dec 2025) | ₱300,000.00 | ₱1,200,000.00 |

### Expected Intermediate Values (Annual)

**PL-02:**
- `net_gross_receipts` = ₱1,200,000.00
- `taxpayer_tier` = MICRO (₱1,200,000 < ₱3,000,000 strict)
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04:**
- `path_c_eligible` = true
- `ineligibility_reasons` = []

**PL-05 (Itemized Deductions — Path A computation):**
- `ear_cap` = ₱1,200,000 × 0.01 = ₱12,000.00; no EAR expense claimed → disallowance = ₱0
- `total_current_year_deductions` = ₱400,000.00 (all categories before NOLCO)
- `net_income_before_nolco` = ₱1,200,000 − ₱400,000 = ₱800,000.00
- **NOLCO FIFO application** (apply_nolco([2022: ₱300K, 2023: ₱200K], ₱800,000)):
  - Iteration 1 — 2022 entry: use = min(₱800,000, ₱300,000) = ₱300,000; remaining_income = ₱500,000; entry remaining = ₱0
  - Iteration 2 — 2023 entry: use = min(₱500,000, ₱200,000) = ₱200,000; remaining_income = ₱300,000; entry remaining = ₱0
  - `nolco_applied` = ₱500,000.00 (full NOLCO consumed)
- `net_taxable_income_path_a` = ₱800,000 − ₱500,000 = **₱300,000.00**
- `total_allowable_deductions_path_a` = ₱400,000 + ₱500,000 = ₱900,000.00

**PL-06 (OSD — Path B, no NOLCO):**
- `osd_amount` = ₱1,200,000 × 0.40 = ₱480,000.00
- `nti_path_b` = ₱720,000.00
- Note: NOLCO is **not available** under Path B (OSD replaces all deductions, including NOLCO)

**PL-07 (CWT):**
- `total_cwt` = ₱0.00 (no 2307 entries)

**PL-08 (Path A — Graduated + Itemized + NOLCO):**
- `nti_path_a` = ₱300,000.00
- `income_tax_path_a` = graduated_tax_2023(₱300,000) = (₱300,000 − ₱250,000) × 0.15 = **₱7,500.00**
- `percentage_tax_path_a` = ₱1,200,000 × 0.03 = **₱36,000.00**
- `total_tax_path_a` = **₱43,500.00**

**PL-09 (Path B — Graduated + OSD, no NOLCO):**
- `nti_path_b` = ₱720,000.00
- `income_tax_path_b` = graduated_tax_2023(₱720,000) = ₱22,500 + (₱720,000 − ₱400,000) × 0.20 = 22,500 + 64,000 = **₱86,500.00**
- `percentage_tax_path_b` = **₱36,000.00**
- `total_tax_path_b` = **₱122,500.00**

**PL-10 (Path C — 8% Flat, no NOLCO):**
- `eight_pct_base` = ₱1,200,000 − ₱250,000 = ₱950,000.00
- `income_tax_path_c` = ₱950,000 × 0.08 = **₱76,000.00**
- `percentage_tax_path_c` = **₱0.00** (waived under 8%)
- `total_tax_path_c` = **₱76,000.00**

**PL-13 (Compare):**
- Path A: ₱43,500.00 ← **MINIMUM** (NOLCO-enhanced)
- Path B: ₱122,500.00
- Path C: ₱76,000.00
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱76,000 − ₱43,500 = **₱32,500.00** (vs Path C)
- `savings_vs_worst` = ₱122,500 − ₱43,500 = **₱79,000.00** (vs Path B)
- **Without NOLCO counterfactual:** Path A without NOLCO = graduated_tax_2023(₱800,000) + ₱36,000 = ₱102,500 + ₱36,000 = ₱138,500 (loses to Path C ₱76,000); NOLCO application saves ₱95,000 on Path A and changes the winner from C to A.

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱7,500.00
- `percentage_tax_due` = ₱36,000.00 (filed separately via quarterly Form 2551Q)
- `total_tax_due` = ₱43,500.00
- `cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱0.00 (all quarterly 1701Q NIL; see quarterly tracker below)
- `balance_payable_raw` = ₱7,500 + ₱36,000 − ₱0 − ₱0 = ₱43,500.00
- `balance_payable` = ₱43,500.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701 (itemized deductions require Form 1701; NOLCO is reported on Schedule 2)
- `form_section` = PART_IV

**PL-16 (Penalties):** ₱0.00 (on-time filing assumed)

**Warning generation:**
- WARN-003 (`WARN_NO_2307_ENTRIES`): **fires** — Path A is recommended and no CWT entries were provided. Message: "No creditable withholding tax certificates (BIR Form 2307) were entered. If any of your clients withheld taxes on your professional fees, enter those amounts to reduce your income tax due."
- WARN-011 (`WARN_NOLCO_UNDER_PATH_A_ONLY`): does **NOT** fire — condition is `recommended_path == PATH_B OR PATH_C`; here recommended_path == PATH_A, so the warning is suppressed (NOLCO is already being applied under the recommended path).

**Quarterly 1701Q tracker (Path A, proportional NOLCO):**

At each quarterly 1701Q, the engine applies NOLCO proportionally: `quarterly_nolco = total_nolco_available × (cumul_gross / annual_gross_estimate)`. For annual_gross_estimate = ₱1,200,000 and total_nolco = ₱500,000:

| Quarter | Cumul GR | Cumul Expenses | NTI Before NOLCO | Proportional NOLCO | NTI After NOLCO | Cumul IT | Prior Paid | Q Payable |
|---------|---------|---------------|-----------------|-------------------|----------------|---------|------------|-----------|
| Q1 | ₱300,000 | ₱100,000 | ₱200,000 | ₱500K × 25% = ₱125,000 | ₱75,000 | ₱0.00 | ₱0.00 | ₱0.00 (NIL) |
| Q2 | ₱600,000 | ₱200,000 | ₱400,000 | ₱500K × 50% = ₱250,000 | ₱150,000 | ₱0.00 | ₱0.00 | ₱0.00 (NIL) |
| Q3 | ₱900,000 | ₱300,000 | ₱600,000 | ₱500K × 75% = ₱375,000 | ₱225,000 | ₱0.00 | ₱0.00 | ₱0.00 (NIL) |
| Annual | ₱1,200,000 | ₱400,000 | ₱800,000 | ₱500,000 (full) | ₱300,000 | ₱7,500.00 | ₱0.00 | ₱7,500.00 |

Q1 graduated_tax_2023(₱75,000) = ₱0 (below ₱250K) → payable ₱0. NIL return filed by May 15, 2025.
Q2 graduated_tax_2023(₱150,000) = ₱0 (below ₱250K) → payable ₱0. NIL return filed by August 15, 2025.
Q3 graduated_tax_2023(₱225,000) = ₱0 (below ₱250K) → payable ₱0. NIL return filed by November 15, 2025.
Annual graduated_tax_2023(₱300,000) = ₱7,500 − ₱0 prior paid = ₱7,500 balance. Plus PT reminder ₱36,000.

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti_before_nolco: 800000.00,
      nolco_applied: 500000.00,
      nti: 300000.00,
      total_allowable_deductions: 900000.00,
      income_tax: 7500.00,
      percentage_tax: 36000.00,
      total_tax: 43500.00
    },
    path_b: {
      eligible: true,
      nti: 720000.00,
      osd_amount: 480000.00,
      nolco_note: "NOLCO not available under Path B (OSD replaces all deductions per NIRC Sec. 34(L))",
      income_tax: 86500.00,
      percentage_tax: 36000.00,
      total_tax: 122500.00
    },
    path_c: {
      eligible: true,
      tax_base: 950000.00,
      nolco_note: "NOLCO not available under Path C (8% flat rate has no deductions per NIRC Sec. 24(A)(2)(b))",
      income_tax: 76000.00,
      percentage_tax: 0.00,
      total_tax: 76000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 32500.00,
    savings_vs_worst: 79000.00,
    nolco_enables_path_a_win: true
  },

  selected_path: PATH_A,
  income_tax_due: 7500.00,
  percentage_tax_due: 36000.00,
  total_tax_due: 43500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 43500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],  ineligibility_notifications: [],

  nolco_breakdown: {
    entries_input: [
      { origin_year: 2022, amount: 300000.00, remaining_before: 300000.00, applied: 300000.00, remaining_after: 0.00, expires: "TY2025" },
      { origin_year: 2023, amount: 200000.00, remaining_before: 200000.00, applied: 200000.00, remaining_after: 0.00, expires: "TY2026" }
    ],
    total_nolco_applied: 500000.00,
    net_income_before_nolco: 800000.00,
    net_income_after_nolco: 300000.00
  },

  quarterly_tracker: [
    { quarter: 1, cumul_gross: 300000.00, cumul_expenses: 100000.00,
      nti_before_nolco: 200000.00, proportional_nolco: 125000.00, nti_after_nolco: 75000.00,
      cumul_it: 0.00, prior_paid: 0.00, quarterly_payable: 0.00, is_nil: true },
    { quarter: 2, cumul_gross: 600000.00, cumul_expenses: 200000.00,
      nti_before_nolco: 400000.00, proportional_nolco: 250000.00, nti_after_nolco: 150000.00,
      cumul_it: 0.00, prior_paid: 0.00, quarterly_payable: 0.00, is_nil: true },
    { quarter: 3, cumul_gross: 900000.00, cumul_expenses: 300000.00,
      nti_before_nolco: 600000.00, proportional_nolco: 375000.00, nti_after_nolco: 225000.00,
      cumul_it: 0.00, prior_paid: 0.00, quarterly_payable: 0.00, is_nil: true },
    { quarter: "annual_reconciliation", total_gross: 1200000.00, total_expenses: 400000.00,
      nti_before_nolco: 800000.00, total_nolco_applied: 500000.00, nti_after_nolco: 300000.00,
      annual_it: 7500.00, total_prior_paid: 0.00, annual_it_balance: 7500.00,
      pt_reminder: 36000.00 }
  ]
}
```

### Verification

- **Path A NTI before NOLCO:** 1,200,000 − 400,000 = **₱800,000.00** ✓
- **NOLCO FIFO:** 2022 entry applied first (₱300K), remaining income ₱500K; 2023 entry applied next (₱200K), remaining income ₱300K; total applied = **₱500,000.00** ✓
- **Path A NTI after NOLCO:** 800,000 − 500,000 = **₱300,000.00** ✓
- **Path A IT:** (300,000 − 250,000) × 0.15 = **₱7,500.00** ✓ (bracket 2)
- **PT:** 1,200,000 × 0.03 = **₱36,000.00** ✓; total Path A = **₱43,500.00** ✓
- **Path B NTI:** 1,200,000 × 0.60 = **₱720,000.00** ✓; IT = 22,500 + (720,000−400,000)×0.20 = 22,500 + 64,000 = **₱86,500.00** ✓; total B = **₱122,500.00** ✓
- **Path C base:** 1,200,000 − 250,000 = **₱950,000.00** ✓; IT = **₱76,000.00** ✓
- **Savings vs C:** 76,000 − 43,500 = **₱32,500.00** ✓; savings vs B = **₱79,000.00** ✓
- **Q1 proportional NOLCO:** 500,000 × (300,000 / 1,200,000) = **₱125,000** ✓; NTI = 200,000 − 125,000 = **₱75,000** < ₱250K → IT = ₱0 ✓
- **Q2 proportional NOLCO:** 500,000 × (600,000 / 1,200,000) = **₱250,000** ✓; NTI = 400,000 − 250,000 = **₱150,000** < ₱250K → IT = ₱0 ✓
- **Q3 proportional NOLCO:** 500,000 × (900,000 / 1,200,000) = **₱375,000** ✓; NTI = 600,000 − 375,000 = **₱225,000** < ₱250K → IT = ₱0 ✓
- **All quarterly IT = ₱0:** NOLCO keeps every quarter's cumulative NTI below ₱250K threshold → correct NIL returns ✓
- **Annual balance = IT only:** ₱7,500 (income tax); ₱36,000 PT filed separately via 4 quarterly 2551Q returns ✓
- **WARN-011 suppressed:** recommended_path = PATH_A, so the "NOLCO only available under Path A" advisory does not fire ✓
- **2022 NOLCO expiry:** fully consumed in TY2025 (last eligible year) → no expiry waste ✓
- **2023 NOLCO expiry:** also fully consumed in TY2025; expires TY2026 unused is now zero ✓
- **Form 1701 (not 1701A):** itemized deductions require Schedule 2 on Form 1701; Form 1701A does not have itemized deductions schedule ✓

**Legal basis:** NOLCO: NIRC Sec. 34(D) (net operating loss carry-over, 3 consecutive years). NOLCO suspension during OSD/8% years: BIR RR No. 10-2003 Sec. 4. NOLCO FIFO application: itemized-deductions.md Part 5. EAR cap: RR 10-2002 Sec. 3 (1% of gross receipts for service providers). NOLCO not available under OSD: NIRC Sec. 34(L) ("in lieu of itemized deductions"). NOLCO not available under 8%: NIRC Sec. 24(A)(2)(b) (no deductions under 8% flat rate). Graduated tax rates: CR-002. PT: NIRC Sec. 116. Form 1701: BIR RA 11976 EOPT.

---

## TV-EX-G7-002: SC-ZERO-EXPENSE — Online Freelancer, Zero Expenses, 8% Wins by Maximum Margin

**Scenario code:** SC-ZERO-EXPENSE
**Description:** Fiverr/online graphic designer earning ₱800,000 annual gross receipts with zero documented business expenses. This is the purest demonstration of 8% dominance: when expenses = 0, Path A (NTI = full gross) yields the highest IT; Path B (OSD creates 40% deduction) is better but still loses to Path C. At ₱800,000 gross with zero expenses, Path C (₱44,000) saves ₱18,500 vs OSD (₱62,500) and ₱82,500 vs itemized (₱126,500). This vector also demonstrates the quarterly 8% tracker when Q1 gross is below the ₱250,000 exemption threshold (Q1 produces a NIL quarterly return because cumulative gross ₱150,000 < ₱250,000). WARN-004 fires because expense ratio = 0%, which is a reminder to verify that no deductible business expenses were incurred.

**Zero-expense business model note:** Online freelancers on global platforms (Fiverr, 99designs, DesignCrowd) who work entirely from home with client-provided tools often have genuinely zero deductible expenses. Software subscriptions, equipment, and home office expenses may exist but are often not documented for tax purposes, or the freelancer deliberately accepts zero deductions to remain on Path C without documentation burden. This is valid and common.

### Input (fields differing from Group 7 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱800,000.00 | Annual Fiverr project completions + direct client fees; all received via GCash and PayPal |
| All itemized expense fields | ₱0.00 | No business receipts; no subscriptions documented |
| `itemized_expenses.nolco_available` | [] | No prior losses |
| `cwt_2307_entries` | [] | All clients are individuals (non-withholding) |
| `prior_quarterly_payments` | [{period: Q1_2025, amount: 0.00}, {period: Q2_2025, amount: 8000.00}, {period: Q3_2025, amount: 16000.00}] | Q1 NIL (cumul GR below ₱250K); Q2 and Q3 payable (see quarterly tracker) |
| `elected_regime` | null | Optimizer mode |

**Total itemized expenses:** ₱0.00 (0.0% of gross receipts)

**Quarterly income distribution (Fiverr income — slow Q1, steady build):**

| Quarter | Quarterly GR | Cumulative GR |
|---------|-------------|--------------|
| Q1 (Jan–Mar 2025) | ₱150,000.00 | ₱150,000.00 |
| Q2 (Apr–Jun 2025) | ₱200,000.00 | ₱350,000.00 |
| Q3 (Jul–Sep 2025) | ₱200,000.00 | ₱550,000.00 |
| Q4 (Oct–Dec 2025) | ₱250,000.00 | ₱800,000.00 |

### Expected Intermediate Values

**PL-02:**
- `net_gross_receipts` = ₱800,000.00
- `taxpayer_tier` = MICRO
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04:**
- `path_c_eligible` = true; `ineligibility_reasons` = []

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00
- `ear_cap` = ₱800,000 × 0.01 = ₱8,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00
- `net_income_before_nolco` = ₱800,000 − ₱0 = ₱800,000.00

**PL-06 (OSD):**
- `osd_amount` = ₱800,000 × 0.40 = ₱320,000.00
- `nti_path_b` = ₱480,000.00

**PL-07 (CWT):** `total_cwt` = ₱0.00

**PL-08 (Path A):**
- `nti_path_a` = ₱800,000.00 (no deductions)
- `income_tax_path_a` = graduated_tax_2023(₱800,000) = ₱22,500 + (₱800,000 − ₱400,000) × 0.20 = 22,500 + 80,000 = **₱102,500.00**
- `percentage_tax_path_a` = ₱800,000 × 0.03 = **₱24,000.00**
- `total_tax_path_a` = **₱126,500.00**

**PL-09 (Path B):**
- `nti_path_b` = ₱480,000.00
- `income_tax_path_b` = graduated_tax_2023(₱480,000) = ₱22,500 + (₱480,000 − ₱400,000) × 0.20 = 22,500 + 16,000 = **₱38,500.00**
- `percentage_tax_path_b` = **₱24,000.00**
- `total_tax_path_b` = **₱62,500.00**

**PL-10 (Path C):**
- `eight_pct_base` = ₱800,000 − ₱250,000 = ₱550,000.00
- `income_tax_path_c` = ₱550,000 × 0.08 = **₱44,000.00**
- `percentage_tax_path_c` = **₱0.00** (waived)
- `total_tax_path_c` = **₱44,000.00**

**PL-13 (Compare):**
- Path A: ₱126,500.00
- Path B: ₱62,500.00
- Path C: ₱44,000.00 ← **MINIMUM**
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱62,500 − ₱44,000 = **₱18,500.00** (vs Path B)
- `savings_vs_worst` = ₱126,500 − ₱44,000 = **₱82,500.00** (vs Path A)

**PL-14 (Balance Payable — Path C):**
- `income_tax_due` = ₱44,000.00
- `percentage_tax_due` = ₱0.00
- `total_tax_due` = ₱44,000.00
- `cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱0 + ₱8,000 + ₱16,000 = ₱24,000.00
- `balance_payable_raw` = ₱44,000 + ₱0 − ₱0 − ₱24,000 = ₱20,000.00
- `balance_payable` = ₱20,000.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701A (pure SE, 8% rate elected, no itemized deductions, no NOLCO)
- `form_section` = PART_IV_B

**PL-16 (Penalties):** ₱0.00

**Warning generation:**
- WARN-004 (`WARN_VERY_LOW_EXPENSES`): **fires** — total itemized expenses = ₱0.00 = 0.0% of gross receipts, below the 5% advisory threshold. Message: "No business expenses were entered (0.0% of gross receipts). If you incurred any deductible business expenses (software subscriptions, equipment, internet, professional fees), entering them may reduce your tax. Under the recommended 8% flat rate, deductions are not used in the computation, but they appear on Form 1701A for completeness."
- WARN-003 (`WARN_NO_2307_ENTRIES`): does **NOT** fire — WARN-003 condition requires recommended_path = PATH_A; here PATH_C is recommended.

**Quarterly 8% tracker (cumulative method, CR-008):**

| Quarter | Cumul GR | 8% Base (max(GR−250K,0)) | Cumul IT Due | Prior Q Paid | Q Payable | Notes |
|---------|---------|------------------------|------------|-------------|-----------|-------|
| Q1 (Jan–Mar) | ₱150,000.00 | max(150,000−250,000, 0) = ₱0.00 | ₱0.00 | ₱0.00 | ₱0.00 (NIL) | Cumul GR below ₱250K exemption; no tax payable |
| Q2 (Apr–Jun) | ₱350,000.00 | 350,000−250,000 = ₱100,000.00 | ₱8,000.00 | ₱0.00 | **₱8,000.00** | First non-NIL quarter; GR crosses ₱250K |
| Q3 (Jul–Sep) | ₱550,000.00 | 550,000−250,000 = ₱300,000.00 | ₱24,000.00 | ₱8,000.00 | **₱16,000.00** | Cumulative method: 24,000 − 8,000 |
| Annual | ₱800,000.00 | 800,000−250,000 = ₱550,000.00 | ₱44,000.00 | ₱24,000.00 | **₱20,000.00** | Annual balance = 44,000 − 24,000 |

**Total quarterly IT paid:** ₱0 + ₱8,000 + ₱16,000 = **₱24,000.00**
**Annual balance payable:** ₱44,000 − ₱24,000 = **₱20,000.00** (due April 15, 2026)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, nti: 800000.00, itemized_deductions: 0.00,
              income_tax: 102500.00, percentage_tax: 24000.00, total_tax: 126500.00 },
    path_b: { eligible: true, nti: 480000.00, osd_amount: 320000.00,
              income_tax: 38500.00, percentage_tax: 24000.00, total_tax: 62500.00 },
    path_c: { eligible: true, tax_base: 550000.00, income_tax: 44000.00,
              percentage_tax: 0.00, total_tax: 44000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 18500.00,
    savings_vs_worst: 82500.00
  },

  selected_path: PATH_C,
  income_tax_due: 44000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 44000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 24000.00,
  balance_payable: 20000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],  ineligibility_notifications: [],

  quarterly_tracker: [
    { quarter: 1, cumul_gross: 150000.00, eight_pct_base: 0.00,
      cumul_it_due: 0.00, prior_paid: 0.00, quarterly_payable: 0.00, is_nil: true,
      note: "Cumulative gross ₱150,000 below ₱250,000 8% exemption; tax base = 0" },
    { quarter: 2, cumul_gross: 350000.00, eight_pct_base: 100000.00,
      cumul_it_due: 8000.00, prior_paid: 0.00, quarterly_payable: 8000.00, is_nil: false },
    { quarter: 3, cumul_gross: 550000.00, eight_pct_base: 300000.00,
      cumul_it_due: 24000.00, prior_paid: 8000.00, quarterly_payable: 16000.00, is_nil: false },
    { quarter: "annual_reconciliation", total_gross: 800000.00, eight_pct_base: 550000.00,
      annual_it: 44000.00, total_prior_paid: 24000.00, annual_balance: 20000.00 }
  ]
}
```

### Verification

- **Path A NTI:** 800,000 (no expenses); IT = graduated_tax_2023(800,000) = 22,500 + (800,000 − 400,000) × 0.20 = 22,500 + 80,000 = **₱102,500.00** ✓; PT = **₱24,000.00** ✓; total = **₱126,500.00** ✓
- **Path B NTI:** 800,000 × 0.60 = **₱480,000.00** ✓; IT = 22,500 + 80,000 × 0.20 = **₱38,500.00** ✓; total = **₱62,500.00** ✓
- **Path C base:** 800,000 − 250,000 = **₱550,000.00** ✓; IT = **₱44,000.00** ✓
- **Q1 base:** max(150,000 − 250,000, 0) = **₱0** ✓; payable = ₱0 (NIL) ✓
- **Q2 base:** 350,000 − 250,000 = **₱100,000** ✓; IT = 100,000 × 0.08 = **₱8,000** ✓; prior paid = ₱0; payable = **₱8,000** ✓
- **Q3 base:** 550,000 − 250,000 = **₱300,000** ✓; IT = 300,000 × 0.08 = **₱24,000** cumul ✓; prior paid ₱8,000; payable = **₱16,000** ✓
- **Annual balance:** 44,000 − 24,000 = **₱20,000** ✓
- **WARN-004:** expenses 0% < 5% threshold → fires ✓; WARN-003 does NOT fire (PATH_C recommended, not PATH_A) ✓
- **OSD vs 8% comparison at ₱800K:** OSD saves ₱64,000 vs itemized (102,500−38,500) but 8% saves additional ₱18,500 vs OSD → 8% saves ₱82,500 total vs doing nothing (itemized with ₱0 expenses) ✓

**Legal basis:** 8% flat rate: NIRC Sec. 24(A)(2)(b) as amended by TRAIN. ₱250,000 exemption threshold: same section. PT waiver: RR 8-2018 Sec. 2(B). WARN-004: error-states.md WARN_VERY_LOW_EXPENSES. Quarterly cumulative method: NIRC Sec. 74-76; CR-008. Form 1701A: BIR RA 11976 EOPT.

---

## TV-EX-G7-003: SC-HIGH-ENTERTAIN — EAR Cap Applied (₱42,000 Disallowed), Path C Wins

**Scenario code:** SC-HIGH-ENTERTAIN
**Description:** Marketing and public relations consultant earning ₱1,800,000 annual gross receipts who claims ₱60,000 in entertainment, amusement, and recreation (EAR) expenses. The statutory EAR cap for service providers is 1% of gross receipts = ₱18,000 per RR 10-2002 Sec. 3. The ₱42,000 excess over the cap is automatically disallowed, reducing total allowable itemized deductions from ₱780,000 (claimed) to ₱738,000 (allowed). Even with the cap applied, Path A total (₱222,000) still loses to Path C (₱124,000) by ₱98,000. This vector demonstrates: (1) EAR cap computation and disallowance; (2) WARN-015 fires with exact peso amounts; (3) Path C remains optimal despite substantial documented expenses at 41% of gross; (4) counterfactual without cap still shows Path C winning (cap adds ₱10,500 extra to Path A but does not change winner).

**EAR cap rule (RR 10-2002 Sec. 3):**
- Service provider: EAR cap = 1.0% of gross receipts
- Goods seller: EAR cap = 0.5% of net sales (gross sales − sales returns and allowances)
- Mixed (service + goods): cap computed separately on each income stream, then summed
- EAR includes: client entertainment meals, events, golf, transportation expenses for entertainment purposes
- EAR does NOT include: ordinary transportation (to work, between offices — deductible under travel); ordinary meals (not entertainment-related)
- The cap applies to the TOTAL of all EAR expenses, not per-category

**Counterfactual analysis (if full ₱60,000 EAR were allowed — no cap):**
- Total deductions = ₱780,000 (41% would become uncapped)
- Path A NTI = 1,800,000 − 780,000 = ₱1,020,000
- Path A IT = 102,500 + (1,020,000 − 800,000) × 0.25 = 102,500 + 55,000 = ₱157,500
- Path A total = ₱157,500 + ₱54,000 = ₱211,500
- Path C = ₱124,000 — **still wins by ₱87,500** even without the EAR cap
- EAR cap costs the taxpayer ₱10,500 in additional Path A tax (₱222,000 − ₱211,500)

### Input (fields differing from Group 7 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,800,000.00 | Annual PR consulting retainers and project fees |
| `itemized_expenses.salaries_wages` | ₱480,000.00 | 2 junior staff: account manager ₱25,000/mo + coordinator ₱15,000/mo × 12 |
| `itemized_expenses.rent` | ₱120,000.00 | Small office unit ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱60,000.00 | Electricity, internet, water ₱5,000/month |
| `itemized_expenses.communication` | ₱36,000.00 | Business phones, collaboration tools ₱3,000/month |
| `itemized_expenses.ear_expense` | ₱60,000.00 | Client entertainment (dinners, events, golf): ₱5,000/month; EXCEEDS 1% cap |
| `itemized_expenses.other_expenses` | ₱24,000.00 | Bank service charges, professional liability insurance |
| All other itemized expense fields | ₱0.00 | |
| `cwt_2307_entries` | [] | All clients pay gross fees; no withholding |
| `prior_quarterly_payments` | [] | No quarterly 1701Q payments made |
| `elected_regime` | null | Optimizer mode |

**Total claimed itemized expenses:** ₱480,000 + ₱120,000 + ₱60,000 + ₱36,000 + ₱60,000 + ₱24,000 = **₱780,000.00** (43.3% of gross receipts)

### Expected Intermediate Values

**PL-02:**
- `net_gross_receipts` = ₱1,800,000.00
- `taxpayer_tier` = MICRO
- `income_type` = PURELY_SE
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04:**
- `path_c_eligible` = true; `ineligibility_reasons` = []

**PL-05 (Itemized Deductions — EAR Cap Applied):**
- `ear_cap` = ₱1,800,000 × 0.01 = **₱18,000.00** (service provider: 1% of gross receipts per RR 10-2002 Sec. 3)
- `ear_expense_claimed` = ₱60,000.00
- `ear_disallowance` = max(₱60,000 − ₱18,000, 0) = **₱42,000.00**
- `ear_expense_allowed` = ₱18,000.00
- `total_itemized_claimed` = ₱780,000.00
- `total_itemized_deductions_allowed` = ₱780,000 − ₱42,000 = **₱738,000.00** (41.0% of GR)
- `nolco_applied` = ₱0.00
- `net_income_before_nolco` = ₱1,800,000 − ₱738,000 = **₱1,062,000.00**

**WARN-015 fires here** (PL-05 step): `WARN_EAR_CAP_APPLIED` — "Entertainment, amusement, and recreation expenses claimed (₱60,000) exceed the statutory cap of ₱18,000 (1.0% of ₱1,800,000 gross receipts, per RR 10-2002 Sec. 3 for service providers). ₱42,000 has been disallowed and added back. Only ₱18,000 is deductible as entertainment, amusement, and recreation expense."

**PL-06 (OSD):**
- `osd_amount` = ₱1,800,000 × 0.40 = **₱720,000.00**
- `nti_path_b` = ₱1,800,000 − ₱720,000 = **₱1,080,000.00**

**PL-07 (CWT):**
- `total_cwt` = ₱0.00

**PL-08 (Path A — Itemized with EAR cap applied):**
- `nti_path_a` = **₱1,062,000.00**
- `income_tax_path_a` = graduated_tax_2023(₱1,062,000)
  = ₱102,500 + (₱1,062,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱262,000 × 0.25
  = ₱102,500 + ₱65,500.00
  = **₱168,000.00**
- `percentage_tax_path_a` = ₱1,800,000 × 0.03 = **₱54,000.00**
- `total_tax_path_a` = **₱222,000.00**

**PL-09 (Path B — OSD, EAR cap does not apply to OSD):**
- `nti_path_b` = **₱1,080,000.00**
- `income_tax_path_b` = graduated_tax_2023(₱1,080,000)
  = ₱102,500 + (₱1,080,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱70,000.00
  = **₱172,500.00**
- `percentage_tax_path_b` = **₱54,000.00**
- `total_tax_path_b` = **₱226,500.00**

**PL-10 (Path C):**
- `eight_pct_base` = ₱1,800,000 − ₱250,000 = **₱1,550,000.00**
- `income_tax_path_c` = ₱1,550,000 × 0.08 = **₱124,000.00**
- `percentage_tax_path_c` = **₱0.00** (waived)
- `total_tax_path_c` = **₱124,000.00**

**PL-13 (Compare):**
- Path A: ₱222,000.00
- Path B: ₱226,500.00
- Path C: ₱124,000.00 ← **MINIMUM**
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱222,000 − ₱124,000 = **₱98,000.00** (vs Path A, the second-cheapest)
- `savings_vs_worst` = ₱226,500 − ₱124,000 = **₱102,500.00** (vs Path B, the most expensive)

**Note on Path A vs Path B ordering:** At 41% allowed expense ratio (after cap), Path A NTI (₱1,062,000) is LOWER than Path B NTI (₱1,080,000) because 41% > OSD rate of 40%. However, because OSD has no PT interaction and path A does not either, Path A IT (₱168,000) < Path B IT (₱172,500). Yet Path A total (₱222,000) < Path B total (₱226,500). This is consistent: allowed itemized > OSD deduction (₱738K > ₱720K) → Path A NTI lower → Path A IT lower → Path A total lower. Path A narrowly beats Path B when allowed expense ratio > 40% (the OSD rate).

**PL-14 (Balance Payable — Path C):**
- `income_tax_due` = ₱124,000.00
- `percentage_tax_due` = ₱0.00
- `total_tax_due` = ₱124,000.00
- `cwt_credits` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱124,000.00
- `overpayment` = ₱0.00

**PL-15 (Form Selection):**
- `form` = FORM_1701A (purely SE, 8% rate, no NOLCO, no itemized on final form)
- `form_section` = PART_IV_B

**PL-16 (Penalties):** ₱0.00

**Warning generation:**
- WARN-015 (`WARN_EAR_CAP_APPLIED`): **fires** (at PL-05) — EAR claimed ₱60,000 > cap ₱18,000; ₱42,000 disallowed
- WARN-004 (`WARN_VERY_LOW_EXPENSES`): does **NOT** fire — allowed expenses ₱738,000 / ₱1,800,000 = 41.0% > 5% threshold
- WARN-003 (`WARN_NO_2307_ENTRIES`): does **NOT** fire — PATH_C recommended, not PATH_A

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      nti: 1062000.00,
      itemized_deductions_claimed: 780000.00,
      ear_cap_disallowance: 42000.00,
      itemized_deductions_allowed: 738000.00,
      income_tax: 168000.00,
      percentage_tax: 54000.00,
      total_tax: 222000.00
    },
    path_b: {
      eligible: true,
      nti: 1080000.00,
      osd_amount: 720000.00,
      income_tax: 172500.00,
      percentage_tax: 54000.00,
      total_tax: 226500.00
    },
    path_c: {
      eligible: true,
      tax_base: 1550000.00,
      income_tax: 124000.00,
      percentage_tax: 0.00,
      total_tax: 124000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 98000.00,
    savings_vs_worst: 102500.00
  },

  selected_path: PATH_C,
  income_tax_due: 124000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 124000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 124000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-015],
  manual_review_flags: [],  ineligibility_notifications: [],

  ear_cap_detail: {
    ear_expense_claimed: 60000.00,
    ear_cap: 18000.00,
    ear_cap_basis: "1.0% of gross_receipts = 0.01 × 1,800,000",
    ear_cap_rule: "RR 10-2002 Sec. 3 — service provider",
    ear_disallowance: 42000.00,
    ear_expense_allowed: 18000.00,
    total_itemized_before_cap: 780000.00,
    total_itemized_after_cap: 738000.00
  }
}
```

### Verification

- **EAR cap:** 1% × 1,800,000 = **₱18,000.00** ✓; claimed ₱60,000 > ₱18,000 → disallowance = **₱42,000.00** ✓; allowed = **₱18,000.00** ✓
- **Total allowed deductions:** 780,000 − 42,000 = **₱738,000.00** ✓ (41.0% of GR)
- **Path A NTI:** 1,800,000 − 738,000 = **₱1,062,000.00** ✓
- **Path A IT:** bracket 4: 102,500 + (1,062,000 − 800,000) × 0.25 = 102,500 + 65,500 = **₱168,000.00** ✓
- **PT:** 1,800,000 × 0.03 = **₱54,000.00** ✓; total A = **₱222,000.00** ✓
- **Path B NTI:** 1,800,000 × 0.60 = **₱1,080,000.00** ✓; IT = 102,500 + 70,000 = **₱172,500.00** ✓; total B = **₱226,500.00** ✓
- **Path C base:** 1,800,000 − 250,000 = **₱1,550,000.00** ✓; IT = **₱124,000.00** ✓
- **Path A < Path B (when allowed_exp > OSD):** ₱738K > ₱720K (OSD amount) → allowed itemized > OSD → Path A NTI (₱1,062K) < Path B NTI (₱1,080K) → Path A IT < Path B IT → Path A total (₱222K) < Path B total (₱226.5K) ✓
- **Savings vs next best (A):** 222,000 − 124,000 = **₱98,000.00** ✓
- **Savings vs worst (B):** 226,500 − 124,000 = **₱102,500.00** ✓
- **Counterfactual (no cap, full ₱60K):** NTI = 1,020,000; IT = 102,500 + 55,000 = 157,500; total A = 211,500; Path C still wins by ₱87,500; cap adds ₱10,500 to Path A cost ✓
- **WARN-015 fires:** ₱60,000 > ₱18,000 EAR cap → fires at PL-05 step ✓
- **Expense ratio note:** 738,000/1,800,000 = 41.0% exactly; OSD gives 40% deduction; Path A beats Path B because 41% > 40%; at exactly 40% expense ratio, Paths A and B tie (see SC-BE-OSD-ITEMIZED in edge-cases.md) ✓

**Legal basis:** EAR cap: RR 10-2002 Sec. 3 (service providers: 1% of gross receipts; goods sellers: 0.5% of net sales). Itemized deductions basis: NIRC Sec. 34(A)(1)(a). Graduated tax: CR-002. PT waiver under 8%: NIRC Sec. 24(A)(2)(b). WARN-015: error-states.md `WARN_EAR_CAP_APPLIED`. Form 1701A: BIR RA 11976 EOPT.

---

## GROUP 7 SUMMARY TABLE

| Vector | Scenario | GR | Key Deduction Feature | Optimal Path | Total Tax | Savings vs Next | Key Insight |
|--------|---------|-----|----------------------|-------------|-----------|-----------------|-------------|
| TV-EX-G7-001 | SC-NOLCO | ₱1,200,000 | ₱500K NOLCO applied → NTI ₱300K | Path A (Itemized) | ₱43,500 | ₱32,500 vs C | NOLCO changes winner from C to A; all quarterly returns NIL |
| TV-EX-G7-002 | SC-ZERO-EXPENSE | ₱800,000 | Zero expenses; 8% requires no documentation | Path C (8%) | ₱44,000 | ₱18,500 vs B | Q1 NIL (GR below ₱250K); WARN-004 fires; Path A worst when expenses = 0 |
| TV-EX-G7-003 | SC-HIGH-ENTERTAIN | ₱1,800,000 | EAR cap ₱18K (claimed ₱60K); ₱42K disallowed | Path C (8%) | ₱124,000 | ₱98,000 vs A | EAR cap raises Path A by ₱10,500; Path C wins regardless; WARN-015 fires |

**Key insights for Group 7:**

1. **NOLCO is the only deduction that can flip the regime recommendation from C to A.** In TV-EX-G7-001, without NOLCO, Path C wins at ₱76,000. With ₱500,000 of prior losses applied under Path A, the IT collapses to ₱7,500, making Path A the winner at ₱43,500. The optimizer must present the NOLCO-enhanced Path A cost (not the hypothetical without NOLCO) in the comparison table. WARN-011 fires only when NOLCO is entered but Path C/B is still recommended — not when Path A wins.

2. **Zero-expense freelancers get maximum 8% savings.** At zero expenses, Path A NTI equals gross receipts, putting the taxpayer in the highest possible graduated bracket for their income level. Path B OSD reduces this by 40%, but 8% still wins by ₱18,500 at ₱800K gross because the 8% base is taxed at only 8% while the OSD NTI (₱480K) is taxed at 20% marginal rate. The Q1 NIL return (cumul GR ₱150K < ₱250K exemption) demonstrates that early-year taxpayers with low Q1 income pay nothing on that quarter under Path C.

3. **EAR cap enforcement uses PL-05 (itemized deductions step) — before the regime comparison.** The engine computes allowed deductions first, then all three paths. Path A receives the capped amount; Paths B and C are unaffected by EAR (OSD is 40% of gross regardless; 8% has no deductions). When EAR cap fires, the results table must display both claimed and allowed amounts, so the taxpayer understands why Path A's cost is higher than their expense inputs suggest.

4. **The EAR cap does not change which path is optimal in this scenario.** Even without the cap (full ₱60K allowed), Path C wins by ₱87,500. The cap adds ₱10,500 to Path A's cost but does not change the winner. This is true for most sub-₱3M taxpayers — EAR cap is a compliance issue, not a regime selection issue.

5. **Path A beats Path B when allowed expense ratio > 40%.** In TV-EX-G7-003, allowed expenses = 41.0% (after cap), which is above the OSD rate of 40%. This means Path A provides a larger deduction than Path B OSD, producing lower NTI and lower IT under Path A. Both still lose to Path C. The tie point (Path A = Path B) is exactly 40% expense ratio (see SC-BE-OSD-ITEMIZED in edge-cases.md).

---

## GROUP 8: Quarterly-Cycle–Specific Scenarios

**7 scenario codes:** SC-QC-8-3Q, SC-QC-OSD-3Q, SC-QC-ITEMIZED-3Q, SC-QC-NIL-Q1, SC-QC-CWT-SHIFT, SC-QC-AMENDMENT, SC-QC-OVERPY-Q3

These vectors exercise the multi-quarter cumulative computation engine specifically. All quarterly computations use Form 1701Q. There is no Q4 1701Q — the annual return (Form 1701 or 1701A, due April 15) covers Q4. PT (Form 2551Q) is filed separately; its quarterly deadlines are independent of 1701Q deadlines.

**Cumulative method rule (CR-010):**
- Each 1701Q covers income from January 1 to end of that quarter (cumulative).
- For OSD: `payable[q] = max(graduated_tax(cumul_GR[q] × 0.60) − cumul_CWT[q] − cumul_prior_payments[q], 0)`
- For 8% quarterly (NO ₱250K deduction at quarterly level): `payable[q] = max(cumul_GR[q] × 0.08 − cumul_CWT[q] − cumul_prior_payments[q], 0)`
- ₱250K deduction is applied ONLY at the annual 1701A for 8% taxpayers; quarterly returns may overstate tax slightly.
- For Itemized: `payable[q] = max(graduated_tax(cumul_GR[q] − cumul_expenses[q]) − cumul_CWT[q] − cumul_prior_payments[q], 0)`

**Common Group 8 input defaults (all quarterly vectors):**

| Field | Value |
|-------|-------|
| `taxpayer_type` | `PURELY_SE` |
| `is_mixed_income` | false |
| `is_vat_registered` | false |
| `is_bmbe_registered` | false |
| `subject_to_sec_117_128` | false |
| `is_gpp_partner` | false |
| `taxable_compensation` | ₱0.00 |
| `compensation_cwt` | ₱0.00 |
| `cost_of_goods_sold` | ₱0.00 |
| `non_operating_income` | ₱0.00 |
| `fwt_income` | ₱0.00 |
| `sales_returns_allowances` | ₱0.00 |
| `prior_year_excess_cwt` | ₱0.00 |
| `return_type` | `ORIGINAL` (unless stated otherwise) |
| `actual_filing_date` | null (on-time assumed unless stated) |
| `tax_year` | 2025 |

---

## TV-EX-G8-001: SC-QC-8-3Q — Quarterly Cycle, 8% Option, Three Quarters + Annual

**Scenario code:** SC-QC-8-3Q
**Cross-reference:** This scenario is fully covered by **TV-BASIC-007** in [basic.md](basic.md). That vector specifies all four periods (Q1, Q2, Q3, Annual) for a purely SE freelancer earning ₱200,000/quarter (₱800,000 annualized) on Path C (8%).

**Key values from TV-BASIC-007 for cross-index:**
- Q1 payable: ₱0.00 (NIL — cumul GR ₱200K < ₱250K so no 8% base yet)
- Q2 payable: ₱12,000.00 (cumul GR ₱400K → base ₱150K × 8%)
- Q3 payable: ₱16,000.00 (cumul IT ₱28K − prior ₱12K)
- Annual IT: ₱44,000.00 (base ₱550K × 8%; balance ₱16K after ₱28K prior payments)
- Form used: FORM_1701Q (Q1–Q3); FORM_1701A (annual)

---

## TV-EX-G8-002: SC-QC-OSD-3Q — Quarterly Cycle, Graduated + OSD, Three Quarters + Annual

**Scenario code:** SC-QC-OSD-3Q
**Description:** Purely self-employed IT consultant elected Path B (OSD) at Q1. Annual gross receipts ₱1,200,000, earned evenly at ₱300,000 per quarter, no business expenses tracked (taxpayer chose OSD to avoid documentation). Demonstrates: (1) cumulative OSD quarterly computation via Schedule I of Form 1701Q; (2) Q1 NIL return when cumulative NTI falls below ₱250,000; (3) bracket escalation across Q1→Q2→Q3 as cumulative NTI rises; (4) annual reconciliation showing balance payable; (5) separate quarterly PT obligation (Form 2551Q). At annual, engine shows Path C (₱76,000) was ₱46,500 cheaper than elected Path B (₱122,500) — illustrating the cost of not using the optimizer.

**Tax year:** 2025
**Elected regime:** PATH_B (OSD — elected at Q1; binding for the full year)

**Common additional inputs (all periods):**
- `elected_regime`: PATH_B
- `osd_elected`: true
- `itemized_expenses` (all sub-fields): ₱0.00
- `cwt_2307_entries`: []

### Period 1 — Q1 Filing (filing_period: Q1)

**Q1 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱300,000.00 (Q1 only) |
| `prior_quarterly_payments` | [] |

**Q1 Intermediate Values:**
- Cumulative GR: ₱300,000.00
- Cumulative OSD: ₱300,000 × 0.40 = ₱120,000.00
- Cumulative NTI: ₱300,000 × 0.60 = ₱180,000.00
- Cumulative IT: graduated_tax_2023(₱180,000) = ₱0.00 (bracket 1; NTI < ₱250,000)
- Cumulative CWT: ₱0.00
- Cumulative prior payments: ₱0.00
- Q1 payable: max(₱0 − ₱0 − ₱0, 0) = **₱0.00** (NIL return)
- Q1 2551Q PT: ₱300,000 × 0.03 = ₱9,000.00 (due April 25, 2025 — separate form)

**Expected Q1 Output:**
```
TaxComputationResult {
  filing_period: Q1,
  tax_year: 2025,
  taxpayer_type: PURELY_SE,
  taxpayer_tier: MICRO,
  selected_path: PATH_B,
  cumulative_gross_receipts: 300000.00,
  cumulative_osd: 120000.00,
  cumulative_nti: 180000.00,
  cumulative_it_due: 0.00,
  cumulative_cwt_credits: 0.00,
  cumulative_quarterly_paid: 0.00,
  income_tax_due: 0.00,
  balance_payable: 0.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_OSD,
  warnings: [],
  manual_review_flags: []
}
```

Note: NIL 1701Q — still mandatory. BIR Form 1701Q must be filed by **May 15, 2025** showing ₱0 tax due.

### Period 2 — Q2 Filing (filing_period: Q2)

**Q2 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱600,000.00 (cumulative Jan 1 – Jun 30) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }]` |

**Q2 Intermediate Values:**
- Cumulative GR: ₱600,000.00
- Cumulative OSD: ₱600,000 × 0.40 = ₱240,000.00
- Cumulative NTI: ₱600,000 × 0.60 = ₱360,000.00
- Cumulative IT: graduated_tax_2023(₱360,000)
  = (₱360,000 − ₱250,000) × 0.15
  = ₱110,000 × 0.15
  = **₱16,500.00** (bracket 2)
- Cumulative CWT: ₱0.00
- Prior quarterly IT paid (Q1): ₱0.00
- Q2 payable: max(₱16,500 − ₱0 − ₱0, 0) = **₱16,500.00**
- Q2 2551Q PT: ₱300,000 × 0.03 = ₱9,000.00 (due July 25, 2025 — separate form)

**Expected Q2 Output:**
```
TaxComputationResult {
  filing_period: Q2,
  selected_path: PATH_B,
  cumulative_gross_receipts: 600000.00,
  cumulative_osd: 240000.00,
  cumulative_nti: 360000.00,
  cumulative_it_due: 16500.00,
  cumulative_cwt_credits: 0.00,
  cumulative_quarterly_paid: 0.00,
  income_tax_due: 16500.00,
  balance_payable: 16500.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_OSD,
  warnings: []
}
```

### Period 3 — Q3 Filing (filing_period: Q3)

**Q3 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱900,000.00 (cumulative Jan 1 – Sep 30) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 16500.00 }]` |

**Q3 Intermediate Values:**
- Cumulative GR: ₱900,000.00
- Cumulative OSD: ₱900,000 × 0.40 = ₱360,000.00
- Cumulative NTI: ₱900,000 × 0.60 = ₱540,000.00
- Cumulative IT: graduated_tax_2023(₱540,000)
  = ₱22,500 + (₱540,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱28,000.00
  = **₱50,500.00** (bracket 3)
- Cumulative CWT: ₱0.00
- Prior quarterly IT paid (Q1 + Q2): ₱0 + ₱16,500 = ₱16,500.00
- Q3 payable: max(₱50,500 − ₱0 − ₱16,500, 0) = **₱34,000.00**
- Q3 2551Q PT: ₱300,000 × 0.03 = ₱9,000.00 (due October 25, 2025 — separate form)

**Expected Q3 Output:**
```
TaxComputationResult {
  filing_period: Q3,
  selected_path: PATH_B,
  cumulative_gross_receipts: 900000.00,
  cumulative_osd: 360000.00,
  cumulative_nti: 540000.00,
  cumulative_it_due: 50500.00,
  cumulative_cwt_credits: 0.00,
  cumulative_quarterly_paid: 16500.00,
  income_tax_due: 50500.00,
  balance_payable: 34000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_OSD,
  warnings: []
}
```

### Period 4 — Annual Reconciliation (filing_period: ANNUAL)

**Annual inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | ANNUAL |
| `gross_receipts` | ₱1,200,000.00 (full year Jan 1 – Dec 31) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 16500.00 }, { period: Q3, amount_paid: 34000.00 }]` |
| `elected_regime` | null (optimizer mode at annual — user may reconsider) |

**Annual Regime Comparison (optimizer runs all 3 paths):**

Path A (Itemized — ₱0 expenses, so NTI = full gross):
- `business_nti_path_a` = ₱1,200,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,200,000) = ₱102,500 + (₱1,200,000 − ₱800,000) × 0.25 = ₱102,500 + ₱100,000 = **₱202,500.00**
- `percentage_tax_path_a` = ₱1,200,000 × 0.03 = ₱36,000.00
- `total_tax_path_a` = **₱238,500.00**

Path B (OSD — elected):
- `osd_amount` = ₱1,200,000 × 0.40 = ₱480,000.00
- `business_nti_path_b` = ₱720,000.00
- `income_tax_path_b` = graduated_tax_2023(₱720,000) = ₱22,500 + (₱720,000 − ₱400,000) × 0.20 = ₱22,500 + ₱64,000 = **₱86,500.00**
- `percentage_tax_path_b` = ₱36,000.00
- `total_tax_path_b` = **₱122,500.00**

Path C (8% flat):
- `path_c_eligible` = true (GR ₱1,200,000 ≤ ₱3,000,000; not VAT-registered)
- `income_tax_path_c` = (₱1,200,000 − ₱250,000) × 0.08 = ₱950,000 × 0.08 = **₱76,000.00**
- `percentage_tax_path_c` = ₱0.00 (waived under 8%)
- `total_tax_path_c` = **₱76,000.00** ← MINIMUM

- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱122,500 − ₱76,000 = **₱46,500.00** (vs Path B elected)
- `savings_vs_worst` = ₱238,500 − ₱76,000 = **₱162,500.00** (vs Path A)

**Annual Balance Payable (on elected Path B):**
- `income_tax_due` (Path B): ₱86,500.00
- `total_cwt_business`: ₱0.00
- `quarterly_it_paid`: ₱0 + ₱16,500 + ₱34,000 = ₱50,500.00
- `balance_payable`: ₱86,500 − ₱50,500 = **₱36,000.00**
- `percentage_tax_due`: ₱36,000.00 (already paid via 4× ₱9,000 Form 2551Q)
- `form` = FORM_1701A, `form_section` = SCHEDULE_3A_OSD

**Expected Annual Final Output:**
```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 1200000.00,
      itemized_deductions: 0.00,
      income_tax: 202500.00,
      percentage_tax: 36000.00,
      total_tax: 238500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 480000.00,
      business_nti_osd: 720000.00,
      income_tax: 86500.00,
      percentage_tax: 36000.00,
      total_tax: 122500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 76000.00,
      percentage_tax: 0.00,
      total_tax: 76000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 46500.00,
    savings_vs_worst: 162500.00
  },

  selected_path: PATH_B,
  income_tax_due: 86500.00,
  percentage_tax_due: 36000.00,
  total_tax_due: 122500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 50500.00,
  balance_payable: 36000.00,
  overpayment: 0.00,
  form: FORM_1701A,
  form_section: SCHEDULE_3A_OSD,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: []
}
```

### Quarterly Cycle Summary Table

| Period | Cumul GR | Cumul OSD | Cumul NTI | Cumul IT | Prior Paid | Payable | 2551Q PT |
|--------|---------|-----------|----------|---------|-----------|---------|----------|
| Q1 | ₱300,000 | ₱120,000 | ₱180,000 | ₱0.00 | ₱0.00 | **₱0.00 (NIL)** | ₱9,000 (Apr 25) |
| Q2 | ₱600,000 | ₱240,000 | ₱360,000 | ₱16,500 | ₱0.00 | **₱16,500** | ₱9,000 (Jul 25) |
| Q3 | ₱900,000 | ₱360,000 | ₱540,000 | ₱50,500 | ₱16,500 | **₱34,000** | ₱9,000 (Oct 25) |
| Annual | ₱1,200,000 | ₱480,000 | ₱720,000 | ₱86,500 | ₱50,500 | **₱36,000** | ₱9,000 (Jan 25) |

**Total IT paid across year:** ₱0 + ₱16,500 + ₱34,000 + ₱36,000 = ₱86,500 = Annual IT ✓
**Total PT paid across year:** ₱9,000 × 4 = ₱36,000 = Annual PT ✓
**INV-009:** cumulative quarterly paid ₱50,500 ≤ annual IT ₱86,500 ✓

### Verification

- **Q1 NTI:** ₱300,000 × 0.60 = **₱180,000** < ₱250,000 → IT = **₱0.00** ✓
- **Q2 NTI:** ₱600,000 × 0.60 = **₱360,000**; IT = (₱360,000 − ₱250,000) × 0.15 = **₱16,500** ✓
- **Q3 NTI:** ₱900,000 × 0.60 = **₱540,000**; IT = ₱22,500 + (₱540,000 − ₱400,000) × 0.20 = **₱50,500** ✓
- **Annual NTI:** ₱1,200,000 × 0.60 = **₱720,000**; IT = ₱22,500 + ₱64,000 = **₱86,500** ✓
- **Q2 payable:** ₱16,500 − ₱0 = **₱16,500** ✓
- **Q3 payable:** ₱50,500 − ₱16,500 = **₱34,000** ✓
- **Annual balance:** ₱86,500 − ₱50,500 = **₱36,000** ✓
- **Optimizer insight:** WARN_OSD_NOT_OPTIMAL does NOT fire (OSD was user-elected; engine shows comparison table; savings_vs_next_best = ₱46,500 is displayed in results view). The taxpayer over-paid ₱46,500 for the year versus the optimal 8% election.
- **PT independence:** All four 2551Q filings are on separate deadlines from 1701Q; OSD election does not affect PT computation — PT is 3% of gross quarterly sales regardless of deduction method.

**Legal basis:** Quarterly cumulative OSD method: NIRC Sec. 74-76; BIR Form 1701Q Schedule I. OSD rate: NIRC Sec. 34(L). Graduated tax: CR-002. PT: NIRC Sec. 116, 3% rate effective July 2023 post-CREATE. Annual reconciliation: CR-011/CR-049.

---

## TV-EX-G8-003: SC-QC-ITEMIZED-3Q — Quarterly Cycle, Graduated + Itemized (Path A Wins), Three Quarters + Annual

**Scenario code:** SC-QC-ITEMIZED-3Q
**Description:** Architectural consultant earning ₱500,000 per quarter (₱2,000,000 annual) with high recurring expenses — ₱350,000 per quarter (₱1,400,000 annual, 70% expense ratio). Elected Path A (Itemized) at Q1. Demonstrates: (1) cumulative itemized deduction tracking quarterly; (2) Q1 NIL return when cumulative NTI < ₱250,000 despite ₱500,000 gross income; (3) bracket escalation across Q2→Q3 as cumulative NTI rises; (4) Path A wins at annual (total ₱122,500) over Path C (₱140,000) and Path B (₱262,500) — one of the few scenarios where itemized beats 8%.

Expense composition (₱350,000/quarter):
- `salaries_wages`: ₱200,000.00/quarter (2 full-time draftsmen × ₱100,000/quarter)
- `rent`: ₱60,000.00/quarter (studio space ₱20,000/month × 3)
- `utilities`: ₱30,000.00/quarter (electricity, internet)
- `depreciation`: ₱40,000.00/quarter (CAD workstations ₱800,000 ÷ 5 years ÷ 4 quarters)
- `supplies`: ₱20,000.00/quarter (drafting materials, printing)

**Tax year:** 2025
**Elected regime:** PATH_A (Itemized)

**Common additional inputs (all periods):**
- `elected_regime`: PATH_A
- `osd_elected`: false
- `cwt_2307_entries`: []

### Period 1 — Q1 Filing (filing_period: Q1)

**Q1 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱500,000.00 (Q1 only) |
| `itemized_expenses.salaries_wages` | ₱200,000.00 |
| `itemized_expenses.rent` | ₱60,000.00 |
| `itemized_expenses.utilities` | ₱30,000.00 |
| `itemized_expenses.depreciation` | ₱40,000.00 |
| `itemized_expenses.supplies` | ₱20,000.00 |
| All other itemized expense fields | ₱0.00 |
| `prior_quarterly_payments` | [] |

**Q1 Intermediate Values:**
- Cumulative GR: ₱500,000.00
- Cumulative itemized expenses: ₱200,000 + ₱60,000 + ₱30,000 + ₱40,000 + ₱20,000 = ₱350,000.00
- EAR cap check: ₱500,000 × 0.01 = ₱5,000; no EAR claimed → no cap issue
- Cumulative NTI: ₱500,000 − ₱350,000 = ₱150,000.00
- Cumulative IT: graduated_tax_2023(₱150,000) = **₱0.00** (bracket 1; NTI < ₱250,000)
- Q1 payable: max(₱0 − ₱0 − ₱0, 0) = **₱0.00** (NIL)
- Q1 2551Q PT: ₱500,000 × 0.03 = ₱15,000.00 (due April 25, 2025 — separate form)

**Expected Q1 Output:**
```
TaxComputationResult {
  filing_period: Q1,
  selected_path: PATH_A,
  cumulative_gross_receipts: 500000.00,
  cumulative_itemized_deductions: 350000.00,
  cumulative_nti: 150000.00,
  cumulative_it_due: 0.00,
  income_tax_due: 0.00,
  balance_payable: 0.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_ITEMIZED,
  warnings: []
}
```

### Period 2 — Q2 Filing (filing_period: Q2)

**Q2 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱1,000,000.00 (cumulative Jan 1 – Jun 30) |
| `itemized_expenses.salaries_wages` | ₱400,000.00 (cumulative) |
| `itemized_expenses.rent` | ₱120,000.00 (cumulative) |
| `itemized_expenses.utilities` | ₱60,000.00 (cumulative) |
| `itemized_expenses.depreciation` | ₱80,000.00 (cumulative) |
| `itemized_expenses.supplies` | ₱40,000.00 (cumulative) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }]` |

**Q2 Intermediate Values:**
- Cumulative GR: ₱1,000,000.00
- Cumulative itemized expenses: ₱400,000 + ₱120,000 + ₱60,000 + ₱80,000 + ₱40,000 = ₱700,000.00
- EAR cap check: ₱1,000,000 × 0.01 = ₱10,000; no EAR claimed
- Cumulative NTI: ₱1,000,000 − ₱700,000 = ₱300,000.00
- Cumulative IT: graduated_tax_2023(₱300,000)
  = (₱300,000 − ₱250,000) × 0.15
  = **₱7,500.00** (bracket 2)
- Prior quarterly IT paid (Q1): ₱0.00
- Q2 payable: max(₱7,500 − ₱0 − ₱0, 0) = **₱7,500.00**
- Q2 2551Q PT: ₱500,000 × 0.03 = ₱15,000.00 (due July 25, 2025 — separate form)

**Expected Q2 Output:**
```
TaxComputationResult {
  filing_period: Q2,
  selected_path: PATH_A,
  cumulative_gross_receipts: 1000000.00,
  cumulative_itemized_deductions: 700000.00,
  cumulative_nti: 300000.00,
  cumulative_it_due: 7500.00,
  cumulative_quarterly_paid: 0.00,
  income_tax_due: 7500.00,
  balance_payable: 7500.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_ITEMIZED
}
```

### Period 3 — Q3 Filing (filing_period: Q3)

**Q3 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱1,500,000.00 (cumulative Jan 1 – Sep 30) |
| `itemized_expenses.salaries_wages` | ₱600,000.00 (cumulative) |
| `itemized_expenses.rent` | ₱180,000.00 (cumulative) |
| `itemized_expenses.utilities` | ₱90,000.00 (cumulative) |
| `itemized_expenses.depreciation` | ₱120,000.00 (cumulative) |
| `itemized_expenses.supplies` | ₱60,000.00 (cumulative) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 7500.00 }]` |

**Q3 Intermediate Values:**
- Cumulative GR: ₱1,500,000.00
- Cumulative itemized expenses: ₱600,000 + ₱180,000 + ₱90,000 + ₱120,000 + ₱60,000 = ₱1,050,000.00
- EAR cap check: ₱1,500,000 × 0.01 = ₱15,000; no EAR claimed
- Cumulative NTI: ₱1,500,000 − ₱1,050,000 = ₱450,000.00
- Cumulative IT: graduated_tax_2023(₱450,000)
  = ₱22,500 + (₱450,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱10,000.00
  = **₱32,500.00** (bracket 3)
- Prior quarterly IT paid (Q1 + Q2): ₱0 + ₱7,500 = ₱7,500.00
- Q3 payable: max(₱32,500 − ₱0 − ₱7,500, 0) = **₱25,000.00**
- Q3 2551Q PT: ₱500,000 × 0.03 = ₱15,000.00 (due October 25, 2025 — separate form)

**Expected Q3 Output:**
```
TaxComputationResult {
  filing_period: Q3,
  selected_path: PATH_A,
  cumulative_gross_receipts: 1500000.00,
  cumulative_itemized_deductions: 1050000.00,
  cumulative_nti: 450000.00,
  cumulative_it_due: 32500.00,
  cumulative_quarterly_paid: 7500.00,
  income_tax_due: 32500.00,
  balance_payable: 25000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_I_ITEMIZED
}
```

### Period 4 — Annual Reconciliation (filing_period: ANNUAL)

**Annual inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | ANNUAL |
| `gross_receipts` | ₱2,000,000.00 (full year) |
| `itemized_expenses.salaries_wages` | ₱800,000.00 |
| `itemized_expenses.rent` | ₱240,000.00 |
| `itemized_expenses.utilities` | ₱120,000.00 |
| `itemized_expenses.depreciation` | ₱160,000.00 |
| `itemized_expenses.supplies` | ₱80,000.00 |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 7500.00 }, { period: Q3, amount_paid: 25000.00 }]` |
| `elected_regime` | null (optimizer mode at annual) |

**Annual Regime Comparison:**

Path A (Itemized):
- `total_itemized_deductions` = ₱800,000 + ₱240,000 + ₱120,000 + ₱160,000 + ₱80,000 = ₱1,400,000.00
- EAR cap check: ₱2,000,000 × 0.01 = ₱20,000; no EAR claimed → no cap
- `business_nti_path_a` = ₱2,000,000 − ₱1,400,000 = **₱600,000.00**
- `income_tax_path_a` = graduated_tax_2023(₱600,000)
  = ₱22,500 + (₱600,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱40,000.00
  = **₱62,500.00**
- `percentage_tax_path_a` = ₱2,000,000 × 0.03 = **₱60,000.00**
- `total_tax_path_a` = **₱122,500.00** ← MINIMUM

Path B (OSD):
- `osd_amount` = ₱2,000,000 × 0.40 = ₱800,000.00
- `business_nti_path_b` = **₱1,200,000.00**
- `income_tax_path_b` = graduated_tax_2023(₱1,200,000)
  = ₱102,500 + (₱1,200,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱100,000.00
  = **₱202,500.00**
- `percentage_tax_path_b` = **₱60,000.00**
- `total_tax_path_b` = **₱262,500.00**

Path C (8%):
- `path_c_eligible` = true (GR ₱2,000,000 ≤ ₱3,000,000)
- `income_tax_path_c` = (₱2,000,000 − ₱250,000) × 0.08 = ₱1,750,000 × 0.08 = **₱140,000.00**
- `percentage_tax_path_c` = ₱0.00
- `total_tax_path_c` = **₱140,000.00**

- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱140,000 − ₱122,500 = **₱17,500.00** (vs Path C)
- `savings_vs_worst` = ₱262,500 − ₱122,500 = **₱140,000.00** (vs Path B)

**Annual Balance Payable (on Path A):**
- `income_tax_due`: ₱62,500.00
- `total_cwt_business`: ₱0.00
- `quarterly_it_paid`: ₱0 + ₱7,500 + ₱25,000 = ₱32,500.00
- `balance_payable`: ₱62,500 − ₱32,500 = **₱30,000.00**

**Expected Annual Final Output:**
```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: SMALL,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 600000.00,
      itemized_deductions: 1400000.00,
      income_tax: 62500.00,
      percentage_tax: 60000.00,
      total_tax: 122500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 800000.00,
      business_nti_osd: 1200000.00,
      income_tax: 202500.00,
      percentage_tax: 60000.00,
      total_tax: 262500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 140000.00,
      percentage_tax: 0.00,
      total_tax: 140000.00,
      ineligibility_reasons: []
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 17500.00,
    savings_vs_worst: 140000.00
  },

  selected_path: PATH_A,
  income_tax_due: 62500.00,
  percentage_tax_due: 60000.00,
  total_tax_due: 122500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 32500.00,
  balance_payable: 30000.00,
  overpayment: 0.00,
  form: FORM_1701,
  form_section: SCHEDULE_3A_ITEMIZED,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: []
}
```

Note: `taxpayer_tier` = SMALL at annual because annual GR ₱2,000,000 ≥ ₱3,000,000? No — ₱2M < ₱3M → MICRO. Wait: EOPT tier: MICRO = GR < ₱3M. So tier = MICRO. But quarterly tiers use each quarter's cumulative. At Q3, cumulative GR = ₱1,500,000 → MICRO. Annual GR = ₱2,000,000 → MICRO. Corrected: `taxpayer_tier` = MICRO for all periods.

**Corrected expected annual output field:** `taxpayer_tier: MICRO`

### Quarterly Cycle Summary Table

| Period | Cumul GR | Cumul Expenses | Cumul NTI | Cumul IT | Prior Paid | Payable | 2551Q PT |
|--------|---------|---------------|----------|---------|-----------|---------|----------|
| Q1 | ₱500,000 | ₱350,000 | ₱150,000 | ₱0.00 | ₱0.00 | **₱0.00 (NIL)** | ₱15,000 (Apr 25) |
| Q2 | ₱1,000,000 | ₱700,000 | ₱300,000 | ₱7,500 | ₱0.00 | **₱7,500** | ₱15,000 (Jul 25) |
| Q3 | ₱1,500,000 | ₱1,050,000 | ₱450,000 | ₱32,500 | ₱7,500 | **₱25,000** | ₱15,000 (Oct 25) |
| Annual | ₱2,000,000 | ₱1,400,000 | ₱600,000 | ₱62,500 | ₱32,500 | **₱30,000** | ₱15,000 (Jan 25) |

**Total IT paid:** ₱0 + ₱7,500 + ₱25,000 + ₱30,000 = ₱62,500 = Annual IT ✓
**Total PT paid (4× 2551Q):** ₱15,000 × 4 = ₱60,000 = Annual PT ✓
**INV-009:** ₱32,500 ≤ ₱62,500 ✓

### Verification

- **Q1 NTI:** 500,000 − 350,000 = **₱150,000** < ₱250K → IT = **₱0.00** ✓
- **Q2 NTI:** 1,000,000 − 700,000 = **₱300,000**; IT = (300,000−250,000)×0.15 = **₱7,500** ✓
- **Q3 NTI:** 1,500,000 − 1,050,000 = **₱450,000**; IT = 22,500 + 50,000×0.20 = **₱32,500** ✓
- **Annual NTI:** 2,000,000 − 1,400,000 = **₱600,000**; IT = 22,500 + 200,000×0.20 = **₱62,500** ✓
- **Path A vs C breakeven:** expense ratio must exceed ~(GR−PT)/(GR) threshold for 8% line. At GR=₱2M: Path C = ₱140,000; Path A < ₱140,000 when IT_A < ₱80,000 → NTI_A < ₱680,000 → expenses > ₱1,320,000 = 66% of GR. Actual expense ratio: ₱1,400,000/₱2,000,000 = **70%** > 66% → Path A wins ✓
- **Expense ratio > OSD (40%):** 70% > 40% → allowed itemized > OSD → Path A NTI (₱600K) < Path B NTI (₱1,200K) → Path A IT (₱62,500) < Path B IT (₱202,500) ✓
- **Taxpayer tier at annual:** ₱2,000,000 < ₱3,000,000 → MICRO ✓

**Legal basis:** Cumulative itemized quarterly method: NIRC Sec. 74-76; BIR Form 1701Q Schedule I. Itemized deductions: NIRC Sec. 34(A)-(K). Graduated tax: CR-002. PT: NIRC Sec. 116. Annual 1701 (itemized filers always use 1701, not 1701A): BIR RR 8-2018.

---

## TV-EX-G8-004: SC-QC-NIL-Q1 — Zero Q1 Income, 8% Rate, NIL Q1 Return Required

**Scenario code:** SC-QC-NIL-Q1
**Description:** Freelance video editor who registered in January 2025 but landed no clients in Q1 (January–March). First income arrives in April (Q2). Uses 8% option elected at Q1 even though Q1 gross is ₱0. Demonstrates: (1) NIL Q1 1701Q is still mandatory even with zero income — failure to file triggers ₱1,000 compromise penalty; (2) ₱250K deduction does NOT apply at quarterly level; Q2 cumulative gross ₱600,000 × 8% = ₱48,000 payable with no adjustment for the Q1 nil period; (3) ₱250K is applied ONLY at annual, reducing final IT.

**Income pattern:** Q1 ₱0, Q2 ₱600,000 (cumul), Q3 ₱1,100,000 (cumul), Annual ₱1,500,000

### Period 1 — Q1 Filing (filing_period: Q1)

**Q1 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱0.00 |
| `elected_regime` | PATH_C |
| `prior_quarterly_payments` | [] |
| `cwt_2307_entries` | [] |
| All itemized expense fields | ₱0.00 |

**Q1 Intermediate Values:**
- Cumulative GR: ₱0.00
- Path C quarterly IT (no ₱250K at quarterly): ₱0.00 × 0.08 = ₱0.00
- Cumulative CWT: ₱0.00
- Q1 payable: **₱0.00** (NIL)
- Q1 2551Q PT: ₱0.00 × 0.03 = ₱0.00 (NIL PT return also required — separate form, due April 25)

**Expected Q1 Output:**
```
TaxComputationResult {
  filing_period: Q1,
  selected_path: PATH_C,
  cumulative_gross_receipts: 0.00,
  cumulative_8pct_it: 0.00,
  income_tax_due: 0.00,
  balance_payable: 0.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT,
  warnings: []
}
```

Note: **NIL 1701Q must be filed by May 15, 2025.** Failure to file even a NIL quarterly return constitutes a late/non-filing violation. Compromise penalty (1st offense): ₱1,000.00 per CR-020.2. The engine must display a compliance reminder on the Q1 NIL result: "A ₱0 return must still be submitted to the BIR by May 15, 2025."

### Period 2 — Q2 Filing (filing_period: Q2)

**Q2 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱600,000.00 (cumulative Jan 1 – Jun 30; all earned in Q2) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }]` |
| `cwt_2307_entries` | [] |

**Q2 Intermediate Values:**
- Cumulative GR: ₱600,000.00
- Path C quarterly IT (NO ₱250K deduction at quarterly): ₱600,000 × 0.08 = **₱48,000.00**
- Note: ₱250K is NOT subtracted here — deduction is annual-only per CR-010
- Cumulative CWT: ₱0.00
- Prior quarterly IT paid (Q1): ₱0.00
- Q2 payable: max(₱48,000 − ₱0 − ₱0, 0) = **₱48,000.00**

**Expected Q2 Output:**
```
TaxComputationResult {
  filing_period: Q2,
  selected_path: PATH_C,
  cumulative_gross_receipts: 600000.00,
  cumulative_8pct_it: 48000.00,
  cumulative_cwt_credits: 0.00,
  cumulative_quarterly_paid: 0.00,
  income_tax_due: 48000.00,
  balance_payable: 48000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

### Period 3 — Q3 Filing (filing_period: Q3)

**Q3 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱1,100,000.00 (cumulative Jan 1 – Sep 30) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 48000.00 }]` |
| `cwt_2307_entries` | [] |

**Q3 Intermediate Values:**
- Cumulative GR: ₱1,100,000.00
- Path C quarterly IT (no ₱250K): ₱1,100,000 × 0.08 = **₱88,000.00**
- Cumulative CWT: ₱0.00
- Prior quarterly IT paid: ₱0 + ₱48,000 = ₱48,000.00
- Q3 payable: max(₱88,000 − ₱0 − ₱48,000, 0) = **₱40,000.00**

**Expected Q3 Output:**
```
TaxComputationResult {
  filing_period: Q3,
  selected_path: PATH_C,
  cumulative_gross_receipts: 1100000.00,
  cumulative_8pct_it: 88000.00,
  cumulative_cwt_credits: 0.00,
  cumulative_quarterly_paid: 48000.00,
  income_tax_due: 88000.00,
  balance_payable: 40000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

### Period 4 — Annual Reconciliation (filing_period: ANNUAL)

**Annual inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | ANNUAL |
| `gross_receipts` | ₱1,500,000.00 (full year; Q4 income ₱400,000) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 0.00 }, { period: Q2, amount_paid: 48000.00 }, { period: Q3, amount_paid: 40000.00 }]` |
| `elected_regime` | null (optimizer mode) |

**Annual IT under Path C (with ₱250K deduction applied for first time):**
- `path_c_eligible` = true (₱1,500,000 ≤ ₱3,000,000)
- Annual IT = max(₱1,500,000 − ₱250,000, 0) × 0.08 = ₱1,250,000 × 0.08 = **₱100,000.00**
- Total quarterly paid: ₱0 + ₱48,000 + ₱40,000 = **₱88,000.00**
- Balance payable: ₱100,000 − ₱88,000 = **₱12,000.00**

**Annual Path Comparison (optimizer mode):**
- Path A (₱0 expenses): NTI = ₱1,500,000; IT = ₱102,500 + ₱700,000×0.25 = ₱277,500; PT = ₱45,000; Total = **₱322,500**
- Path B (OSD): NTI = ₱1,500,000 × 0.60 = ₱900,000; IT = ₱102,500 + ₱100,000×0.25 = ₱127,500; PT = ₱45,000; Total = **₱172,500**
- Path C: (₱1,500,000 − ₱250,000) × 0.08 = **₱100,000** ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱172,500 − ₱100,000 = **₱72,500** (vs B)

**Expected Annual Final Output:**
```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, business_nti: 1500000.00, income_tax: 277500.00, percentage_tax: 45000.00, total_tax: 322500.00 },
    path_b: { eligible: true, osd_amount: 600000.00, business_nti_osd: 900000.00, income_tax: 127500.00, percentage_tax: 45000.00, total_tax: 172500.00 },
    path_c: { eligible: true, income_tax_business: 100000.00, percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 72500.00,
    savings_vs_worst: 222500.00
  },

  selected_path: PATH_C,
  income_tax_due: 100000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 100000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 88000.00,
  balance_payable: 12000.00,
  overpayment: 0.00,
  form: FORM_1701A,
  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: []
}
```

### Quarterly Cycle Summary Table

| Period | Cumul GR | Quarterly IT (no ₱250K) | Prior Paid | Payable | Note |
|--------|---------|------------------------|-----------|---------|------|
| Q1 | ₱0 | ₱0.00 | ₱0.00 | **₱0.00 (NIL)** | Still must file by May 15 |
| Q2 | ₱600,000 | ₱48,000.00 | ₱0.00 | **₱48,000** | First payment; all Q2 income |
| Q3 | ₱1,100,000 | ₱88,000.00 | ₱48,000.00 | **₱40,000** | Incremental only |
| Annual | ₱1,500,000 | ₱100,000 (₱250K applied) | ₱88,000.00 | **₱12,000** | ₱250K deduction finally applied |

**Key insight:** The ₱250K deduction during Q2 and Q3 quarterly payments was NOT applied. As a result, the taxpayer slightly overpaid at quarterly level (₱88,000 paid vs ₱100,000 × Q3/annual ratio of ₱73,333). The ₱250K deduction at annual corrects this — the balance payable is only ₱12,000 instead of the ₱20,000 that would result if ₱250K were ignored annually too. The quarterly "overpayment" versus the annualized proportional amount is by design (CR-010).

### Verification

- **Q1 IT:** ₱0 × 0.08 = **₱0.00** ✓ (NIL return)
- **Q2 IT:** ₱600,000 × 0.08 = **₱48,000** ✓ (no ₱250K at quarterly)
- **Q3 IT:** ₱1,100,000 × 0.08 = **₱88,000**; payable = **₱40,000** ✓
- **Annual IT:** (₱1,500,000 − ₱250,000) × 0.08 = **₱100,000** ✓
- **Balance:** ₱100,000 − ₱88,000 = **₱12,000** ✓
- **INV-009:** ₱88,000 ≤ ₱100,000 ✓

**Legal basis:** NIL return obligation: NIRC Sec. 51(A)(1) (returns required regardless of tax due); compromise penalty for non-filing: RMO 7-2015. Quarterly 8% computation (no ₱250K): CR-010 (Schedule II). Annual ₱250K deduction application: NIRC Sec. 24(A)(2)(b); CR-011.

---

## TV-EX-G8-005: SC-QC-CWT-SHIFT — Q1 Form 2307 Delivered Late; Appears in Q2 CWT

**Scenario code:** SC-QC-CWT-SHIFT
**Description:** Freelance developer earns ₱400,000/quarter (₱1,600,000 annual) from one recurring corporate client on 8% option. Client is required to withhold 5% EWT (₱20,000/quarter per WI010) and issue Form 2307 within 20 days after the quarter end. In practice, the client delays: Q1 2307 (covering January–March 2025) is physically delivered to the taxpayer in late July 2025, **after** the Q1 1701Q due date (May 15). Taxpayer files Q1 without the 2307. In Q2 filing, taxpayer includes BOTH the late Q1 2307 and the Q2 2307.

Demonstrates: (1) Q1 filed without CWT → Q1 payable = full quarterly IT; (2) Q2 filed with cumulative CWT (Q1 + Q2 amounts) → Q2 payable = ₱0 (CWT + prior paid exceeds cumulative IT); (3) the cumulative method self-corrects without requiring an amended Q1; (4) Q3 and annual computations resume normally; (5) a small overpayment at annual arises because Q1 IT was paid without the CWT credit — flows to overpayment election.

**Income and CWT pattern:**
- Q1: GR ₱400,000, CWT ₱20,000 (5%) — but 2307 received late (July); Q1 filed without CWT
- Q2: GR ₱400,000, CWT ₱20,000 (5%); Q2 2307 received on time; Q1 2307 also received by now
- Q3: GR ₱400,000, CWT ₱20,000 (5%); 2307 received on time
- Q4: GR ₱400,000, CWT ₱20,000 (5%); 2307 received on time
- Annual total GR: ₱1,600,000; Annual total CWT: ₱80,000

### Period 1 — Q1 Filing (due May 15; Q1 2307 not yet received)

**Q1 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱400,000.00 |
| `elected_regime` | PATH_C |
| `cwt_2307_entries` | [] (Q1 2307 not yet in taxpayer's possession) |
| `prior_quarterly_payments` | [] |

**Q1 Intermediate Values:**
- Cumulative GR: ₱400,000.00
- Path C quarterly IT (no ₱250K): ₱400,000 × 0.08 = **₱32,000.00**
- Cumulative CWT: ₱0.00 (no 2307 available)
- Q1 payable: max(₱32,000 − ₱0 − ₱0, 0) = **₱32,000.00**
- Q1 paid: ₱32,000.00

**Expected Q1 Output:**
```
TaxComputationResult {
  filing_period: Q1,
  selected_path: PATH_C,
  cumulative_gross_receipts: 400000.00,
  cumulative_8pct_it: 32000.00,
  cumulative_cwt_credits: 0.00,
  income_tax_due: 32000.00,
  balance_payable: 32000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

Note: WARN-003 fires: "PATH_C elected, 0 CWT credits. Verify no Form 2307 is expected from clients." Engine cannot know the 2307 is coming late; the warning prompts the taxpayer to check.

### Period 2 — Q2 Filing (taxpayer now has both Q1 and Q2 Form 2307)

**Q2 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱800,000.00 (cumulative Jan 1 – Jun 30) |
| `cwt_2307_entries` | `[{ quarter: Q1, atc: WI010, amount: 20000.00, payor: "ABC Corp" }, { quarter: Q2, atc: WI010, amount: 20000.00, payor: "ABC Corp" }]` |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 32000.00 }]` |

**Q2 Intermediate Values:**
- Cumulative GR: ₱800,000.00
- Path C quarterly IT (no ₱250K): ₱800,000 × 0.08 = **₱64,000.00**
- Cumulative CWT (Q1 + Q2 2307s, both included now): ₱20,000 + ₱20,000 = **₱40,000.00**
- Prior quarterly IT paid (Q1 actual payment): ₱32,000.00
- Q2 payable: max(₱64,000 − ₱40,000 − ₱32,000, 0) = max(−₱8,000, 0) = **₱0.00**

**Expected Q2 Output:**
```
TaxComputationResult {
  filing_period: Q2,
  selected_path: PATH_C,
  cumulative_gross_receipts: 800000.00,
  cumulative_8pct_it: 64000.00,
  cumulative_cwt_credits: 40000.00,
  cumulative_quarterly_paid: 32000.00,
  income_tax_due: 64000.00,
  balance_payable: 0.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

Note: Q2 payable is ₱0. No amended Q1 is needed. The cumulative method absorbs the late Q1 CWT naturally in Q2. The ₱8,000 "excess" (cumul CWT + prior paid − cumul IT) cannot be refunded mid-year; it simply results in ₱0 payable for Q2.

### Period 3 — Q3 Filing (normal)

**Q3 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱1,200,000.00 (cumulative Jan 1 – Sep 30) |
| `cwt_2307_entries` | `[{ quarter: Q1, atc: WI010, amount: 20000.00 }, { quarter: Q2, atc: WI010, amount: 20000.00 }, { quarter: Q3, atc: WI010, amount: 20000.00 }]` |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 32000.00 }, { period: Q2, amount_paid: 0.00 }]` |

**Q3 Intermediate Values:**
- Cumulative GR: ₱1,200,000.00
- Path C quarterly IT: ₱1,200,000 × 0.08 = **₱96,000.00**
- Cumulative CWT (Q1 + Q2 + Q3): ₱20,000 + ₱20,000 + ₱20,000 = **₱60,000.00**
- Prior IT paid (Q1 + Q2): ₱32,000 + ₱0 = ₱32,000.00
- Q3 payable: max(₱96,000 − ₱60,000 − ₱32,000, 0) = max(₱4,000, 0) = **₱4,000.00**

**Expected Q3 Output:**
```
TaxComputationResult {
  filing_period: Q3,
  selected_path: PATH_C,
  cumulative_gross_receipts: 1200000.00,
  cumulative_8pct_it: 96000.00,
  cumulative_cwt_credits: 60000.00,
  cumulative_quarterly_paid: 32000.00,
  income_tax_due: 96000.00,
  balance_payable: 4000.00,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

### Period 4 — Annual Reconciliation (filing_period: ANNUAL)

**Annual inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | ANNUAL |
| `gross_receipts` | ₱1,600,000.00 |
| `cwt_2307_entries` | All 4 quarters: Q1–Q4, each ₱20,000 (WI010), total ₱80,000 |
| `prior_quarterly_payments` | Q1 ₱32,000 + Q2 ₱0 + Q3 ₱4,000 = total ₱36,000 |
| `elected_regime` | null |

**Annual IT under Path C:**
- Annual IT = (₱1,600,000 − ₱250,000) × 0.08 = ₱1,350,000 × 0.08 = **₱108,000.00**
- Total CWT: 4 × ₱20,000 = ₱80,000.00
- Total quarterly paid: ₱32,000 + ₱0 + ₱4,000 = ₱36,000.00
- Balance raw: ₱108,000 − ₱80,000 − ₱36,000 = −₱8,000.00
- Balance payable: max(−₱8,000, 0) = **₱0.00**
- Overpayment: max(₱8,000, 0) = **₱8,000.00**

Path comparison:
- Path A (₱0 expenses): NTI ₱1,600,000; IT = ₱102,500 + ₱800,000×0.25 = ₱302,500; PT ₱48,000; Total ₱350,500
- Path B: NTI ₱960,000; IT = ₱102,500 + ₱160,000×0.25 = ₱142,500; PT ₱48,000; Total ₱190,500
- Path C: **₱108,000** ← MINIMUM
- `recommended_path` = PATH_C; `savings_vs_next_best` = ₱190,500 − ₱108,000 = **₱82,500**

**Expected Annual Final Output:**
```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { income_tax: 302500.00, percentage_tax: 48000.00, total_tax: 350500.00 },
    path_b: { osd_amount: 640000.00, business_nti_osd: 960000.00, income_tax: 142500.00, percentage_tax: 48000.00, total_tax: 190500.00 },
    path_c: { income_tax_business: 108000.00, percentage_tax: 0.00, total_tax: 108000.00 },
    recommended_path: PATH_C,
    savings_vs_next_best: 82500.00,
    savings_vs_worst: 242500.00
  },

  selected_path: PATH_C,
  income_tax_due: 108000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 108000.00,
  cwt_credits: 80000.00,
  quarterly_it_paid: 36000.00,
  balance_payable: 0.00,
  overpayment: 8000.00,
  overpayment_disposition: TAXPAYER_ELECTION_REQUIRED,
  form: FORM_1701A,
  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN_OVERPAYMENT_ELECTION_REQUIRED],
  manual_review_flags: []
}
```

### Quarterly Cycle Summary Table

| Period | Cumul GR | Cumul 8% IT | Cumul CWT | Prior Paid | Payable | Note |
|--------|---------|------------|----------|-----------|---------|------|
| Q1 | ₱400,000 | ₱32,000 | ₱0 | ₱0 | **₱32,000** | No 2307 yet; WARN-003 fires |
| Q2 | ₱800,000 | ₱64,000 | ₱40,000 | ₱32,000 | **₱0.00** | Q1 late 2307 + Q2 2307 absorbed; formula: 64K−40K−32K = −8K → ₱0 |
| Q3 | ₱1,200,000 | ₱96,000 | ₱60,000 | ₱32,000 | **₱4,000** | Self-corrects; normal Q3 |
| Annual | ₱1,600,000 | ₱108,000 | ₱80,000 | ₱36,000 | **₱0** + ₱8,000 OVP | ₱250K applied; overpayment election |

### Verification

- **Q2 formula:** 64,000 − 40,000 − 32,000 = **−₱8,000** → payable = ₱0 ✓ (cumulative excess, not refunded mid-year)
- **Q3 formula:** 96,000 − 60,000 − 32,000 = **₱4,000** ✓
- **Annual IT (with ₱250K):** (1,600,000 − 250,000) × 0.08 = **₱108,000** ✓
- **Annual balance:** 108,000 − 80,000 − 36,000 = **−₱8,000** → overpayment ₱8,000 ✓
- **Total payments made:** ₱32,000 (Q1) + ₱0 (Q2) + ₱4,000 (Q3) + ₱0 (annual) = ₱36,000
- **Total credits (CWT):** ₱80,000
- **Grand total paid + credited:** ₱36,000 + ₱80,000 = ₱116,000 > annual IT ₱108,000 → overpayment ₱8,000 ✓
- **No amended returns needed:** Q1 was correctly filed as ₱0 CWT (taxpayer did not yet have the 2307). The cumulative method absorbed the late 2307 in Q2 without amendment. This is the designed behavior of the cumulative quarterly system.
- **Overpayment source:** The Q1 payment of ₱32,000 was computed without the ₱20,000 CWT credit. Had the 2307 been on time, Q1 payable would have been max(₱32,000 − ₱20,000 − ₱0, 0) = ₱12,000. The ₱20,000 excess credit was absorbed in Q2, but the ₱8,000 net overpayment (from the annual ₱250K deduction) carries to annual.

**Legal basis:** 2307 issuance deadline: BIR RR 2-1998 as amended (20 days after end of taxable quarter). Cumulative CWT crediting: NIRC Sec. 58(E); CR-009. Quarterly 8% computation: CR-010. Annual overpayment election: CR-054. WARN_OVERPAYMENT_ELECTION_REQUIRED: error-states.md WARN-012.

---

## TV-EX-G8-006: SC-QC-AMENDMENT — Q1 Gross Understated by ₱100K; Amendment Cascade Q1→Q2→Q3

**Scenario code:** SC-QC-AMENDMENT
**Description:** Freelance content writer using 8% option files Q1 with understated gross (₱200,000 instead of actual ₱300,000 — a client invoice was misattributed to Q2). The error is discovered after Q2 has already been filed. Q1, Q2, and Q3 must all be amended. This vector shows: (1) original Q1/Q2/Q3 filings with wrong figures; (2) the Q1 amendment showing additional tax + penalties; (3) the Q2 amendment showing corrected Item 50 reference — critically, Q2 payable happens to be identical under the amendment because the ₱100K shift from Q1 to correctly Q1 is offset by Q2's own income; (4) the Q3 amendment with corrected cumulative figures; (5) the annual reconciliation with correct full-year figures.

**Income (actual, after correction):** Q1 ₱300,000; Q2 ₱400,000; Q3 ₱400,000; Q4 ₱400,000 = ₱1,500,000 annual
**Income as originally filed (wrong):** Q1 ₱200,000 (understated by ₱100,000); Q2–Q4 correct

**Amendment filing date:** Q1 amended August 1, 2025 (77 days after May 15 due date)

### Stage 1 — Original Q1 Filing (WRONG — filed May 15)

**Original Q1 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱200,000.00 (WRONG — actual ₱300,000) |
| `elected_regime` | PATH_C |
| `return_type` | ORIGINAL |

**Original Q1 Computation:**
- Cumulative GR: ₱200,000.00 (wrong)
- Path C quarterly IT: ₱200,000 × 0.08 = ₱16,000.00
- Q1 payable: **₱16,000.00** (paid May 15)

### Stage 2 — Original Q2 Filing (WRONG — filed using wrong Q1 cumulative)

**Original Q2 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱600,000.00 (cumulative: wrong ₱200K Q1 + correct ₱400K Q2) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 16000.00 }]` |
| `return_type` | ORIGINAL |

**Original Q2 Computation:**
- Cumulative GR: ₱600,000.00 (wrong — based on wrong Q1)
- Path C IT: ₱600,000 × 0.08 = ₱48,000.00
- Prior paid: ₱16,000.00
- Q2 payable: **₱32,000.00** (paid August 15)

### Stage 3 — Original Q3 Filing (WRONG — using wrong cumulative from Q2)

**Original Q3 inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱1,000,000.00 (cumulative: wrong ₱600K + correct ₱400K Q3) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 16000.00 }, { period: Q2, amount_paid: 32000.00 }]` |
| `return_type` | ORIGINAL |

**Original Q3 Computation:**
- Cumulative GR: ₱1,000,000.00 (wrong)
- Path C IT: ₱1,000,000 × 0.08 = ₱80,000.00
- Prior paid: ₱16,000 + ₱32,000 = ₱48,000.00
- Q3 payable: **₱32,000.00** (paid November 15)

**Total originally paid Q1+Q2+Q3:** ₱16,000 + ₱32,000 + ₱32,000 = ₱80,000.00

### Stage 4 — Q1 Amendment (Filed August 1, 2025 — 77 days late)

**Q1 Amendment inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q1 |
| `gross_receipts` | ₱300,000.00 (CORRECTED) |
| `elected_regime` | PATH_C |
| `return_type` | AMENDED |
| `prior_payment_for_return` | ₱16,000.00 (original Q1 payment) |
| `actual_filing_date` | 2025-08-01 |
| `taxpayer_tier` | MICRO |

**Q1 Amendment Computation:**
- Corrected cumulative GR: ₱300,000.00
- Corrected Path C IT: ₱300,000 × 0.08 = **₱24,000.00**
- Previously paid: ₱16,000.00
- Additional tax due on amendment: ₱24,000 − ₱16,000 = **₱8,000.00**

**Penalties on additional ₱8,000 (CR-016, CR-017, CR-020):**
- Days late: May 15 to August 1 = 78 days (31 May − 15 = 16 days in May + 30 June + 31 July + 1 August = 78 days)
- Surcharge (MICRO, amended return with deficiency): 10% × ₱8,000 = **₱800.00**
- Interest: 6% per annum × (78/365) × ₱8,000 = 0.06 × 0.213699 × ₱8,000 = **₱102.58**
- Compromise: per CR-020 Table 2 (with tax due), tax due bracket ₱5,001–₱10,000 → ₱2,000.00 compromise
- Total penalties: ₱800 + ₱102.58 + ₱2,000 = **₱2,902.58**
- Total payable on amendment: ₱8,000 + ₱2,902.58 = **₱10,902.58**

**Expected Q1 Amendment Output:**
```
TaxComputationResult {
  filing_period: Q1,
  return_type: AMENDED,
  selected_path: PATH_C,
  corrected_gross_receipts: 300000.00,
  corrected_cumulative_it: 24000.00,
  original_it_paid: 16000.00,
  additional_tax_due: 8000.00,
  penalties: {
    surcharge: 800.00,
    interest: 102.58,
    compromise: 2000.00,
    total: 2902.58
  },
  total_amount_due_on_amendment: 10902.58,
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

### Stage 5 — Q2 Amendment (required to correct Item 50 reference)

**Q2 Amendment inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q2 |
| `gross_receipts` | ₱700,000.00 (cumulative: corrected ₱300K Q1 + ₱400K Q2) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 24000.00 }]` (corrected Q1 total paid) |
| `return_type` | AMENDED |

**Q2 Amendment Computation:**
- Corrected cumulative GR: ₱700,000.00
- Corrected Path C IT: ₱700,000 × 0.08 = **₱56,000.00**
- Prior paid (corrected Q1 total): ₱24,000.00
- Corrected Q2 payable: max(₱56,000 − ₱24,000, 0) = **₱32,000.00**
- Original Q2 payable: ₱32,000.00
- Additional payment required: ₱32,000 − ₱32,000 = **₱0.00** (no additional payment)

**Expected Q2 Amendment Output:**
```
TaxComputationResult {
  filing_period: Q2,
  return_type: AMENDED,
  selected_path: PATH_C,
  corrected_cumulative_gross: 700000.00,
  corrected_cumulative_it: 56000.00,
  corrected_prior_paid: 24000.00,
  corrected_payable: 32000.00,
  original_payable: 32000.00,
  additional_payment_due: 0.00,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

Note: Q2 amendment is required even though no additional payment is due. The BIR official record must show the corrected Item 36 (cumulative GR) = ₱700,000 and Item 50 reference (prior paid) = ₱24,000. Without the amended Q2, the official Q2 on file shows cumulative GR ₱600,000 which contradicts the amended Q1. No penalties apply because no additional tax is payable on the Q2 amendment.

### Stage 6 — Q3 Amendment (required to correct cumulative reference)

**Q3 Amendment inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | Q3 |
| `gross_receipts` | ₱1,100,000.00 (cumulative: corrected ₱700K Q1+Q2 + ₱400K Q3) |
| `prior_quarterly_payments` | `[{ period: Q1, amount_paid: 24000.00 }, { period: Q2, amount_paid: 32000.00 }]` |
| `return_type` | AMENDED |

**Q3 Amendment Computation:**
- Corrected cumulative GR: ₱1,100,000.00
- Corrected Path C IT: ₱1,100,000 × 0.08 = **₱88,000.00**
- Prior paid (corrected Q1 + Q2): ₱24,000 + ₱32,000 = ₱56,000.00
- Corrected Q3 payable: max(₱88,000 − ₱56,000, 0) = **₱32,000.00**
- Original Q3 payable: ₱32,000.00
- Additional payment: **₱0.00** (no additional payment)

**Expected Q3 Amendment Output:**
```
TaxComputationResult {
  filing_period: Q3,
  return_type: AMENDED,
  selected_path: PATH_C,
  corrected_cumulative_gross: 1100000.00,
  corrected_cumulative_it: 88000.00,
  corrected_prior_paid: 56000.00,
  corrected_payable: 32000.00,
  original_payable: 32000.00,
  additional_payment_due: 0.00,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  form: FORM_1701Q,
  schedule: SCHEDULE_II_8PCT
}
```

### Period 7 — Annual Reconciliation (using corrected figures)

**Annual inputs:**

| Field | Value |
|-------|-------|
| `filing_period` | ANNUAL |
| `gross_receipts` | ₱1,500,000.00 (corrected full year) |
| `prior_quarterly_payments` | Q1 ₱24,000 + Q2 ₱32,000 + Q3 ₱32,000 = total ₱88,000 |
| `elected_regime` | null |

**Annual IT:**
- Path C IT = (₱1,500,000 − ₱250,000) × 0.08 = ₱1,250,000 × 0.08 = **₱100,000.00**
- Total quarterly paid: ₱88,000.00
- Balance: ₱100,000 − ₱88,000 = **₱12,000.00**

Path comparison (₱0 expenses):
- Path A: NTI ₱1,500,000; IT ₱277,500; PT ₱45,000; Total **₱322,500**
- Path B: NTI ₱900,000; IT ₱127,500; PT ₱45,000; Total **₱172,500**
- Path C: **₱100,000** ← MINIMUM

**Expected Annual Final Output:**
```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  selected_path: PATH_C,
  income_tax_due: 100000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 100000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 88000.00,
  balance_payable: 12000.00,
  overpayment: 0.00,
  form: FORM_1701A,
  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: []
}
```

### Amendment Cascade Summary Table

| Return | GR (Filed) | GR (Corrected) | Payable (Orig) | Payable (Amended) | Additional Due | Penalties |
|--------|-----------|---------------|---------------|------------------|---------------|-----------|
| Q1 | ₱200,000 | ₱300,000 | ₱16,000 | ₱24,000 | **₱8,000** | ₱2,902.58 |
| Q2 | ₱600,000 | ₱700,000 | ₱32,000 | ₱32,000 | **₱0** | ₱0 |
| Q3 | ₱1,000,000 | ₱1,100,000 | ₱32,000 | ₱32,000 | **₱0** | ₱0 |
| Annual | ₱1,400,000 | ₱1,500,000 | (pending) | ₱12,000 balance | ₱12,000 | ₱0 (on time) |

**Total additional tax from amendment:** ₱8,000 (Q1 only) + ₱12,000 (annual) = ₱20,000
**Total penalties paid:** ₱2,902.58 (Q1 only)

### Verification

- **Q1 original:** ₱200,000 × 0.08 = **₱16,000** ✓
- **Q1 amended:** ₱300,000 × 0.08 = **₱24,000**; additional = **₱8,000** ✓
- **Q1 penalties:** surcharge 10%×8K = **₱800**; interest 6%×(78/365)×8K = **₱102.58**; compromise bracket ₱5K–₱10K = **₱2,000** ✓
- **Q2 amended:** ₱700,000 × 0.08 = ₱56,000; prior paid ₱24,000; payable = **₱32,000** = original ₱32,000 → no additional ✓
- **Q3 amended:** ₱1,100,000 × 0.08 = ₱88,000; prior paid ₱56,000; payable = **₱32,000** = original ₱32,000 → no additional ✓
- **Annual:** (₱1,500,000 − ₱250,000) × 0.08 = **₱100,000**; balance = 100,000 − 88,000 = **₱12,000** ✓
- **Why Q2/Q3 amendments have ₱0 additional:** The ₱100K shift was entirely in Q1. While cumulative GR for Q2 and Q3 increased by ₱100K each, the cumulative prior_paid also increased by ₱8,000 (Q1 amendment payment). The net effect on Q2/Q3 payable is ₱100,000 × 0.08 − ₱8,000 = ₱8,000 − ₱8,000 = ₱0 additional. This mathematical identity holds whenever the amendment corrects only Q1 and the prior-period reference is updated correctly. ✓

**Legal basis:** Amended return procedure: NIRC Sec. 6(A); BIR RR 3-2024 (amended return processing under EOPT). Surcharge on deficiency: NIRC Sec. 248(A)(3), 10% for MICRO/SMALL under RA 11976. Interest on deficiency: NIRC Sec. 249(B) as amended by RA 11976, 6% per annum. Compromise penalty: RMO 7-2015 Annex A Table 2.

---

## TV-EX-G8-007: SC-QC-OVERPY-Q3 — Q3 CWT Accumulation Exceeds IT Due; Zero Q3 Payment; Annual Overpayment

**Scenario code:** SC-QC-OVERPY-Q3
**Cross-reference:** This scenario is fully covered by **TV-EDGE-010** in [edge-cases.md](edge-cases.md). That vector specifies all four periods for a taxpayer where cumulative CWT at Q3 exceeds cumulative IT, resulting in Q3 payable = ₱0, with the overpayment carried to annual reconciliation.

**Key values from TV-EDGE-010 for cross-index:**
- Scenario: OSD path (Path B), ₱1,200,000 annual GR, ₱120,000 total annual CWT (10% EWT from corporate clients)
- Q3 payable: ₱0.00 (cumulative CWT exceeds cumulative IT)
- Annual overpayment: ₱33,500.00 (CWT ₱120,000 − IT ₱86,500 = ₱33,500 after all quarterly payments)
- Overpayment disposition: TAXPAYER_ELECTION_REQUIRED (refund, TCC, or carryover to next year)
- WARN_OVERPAYMENT_ELECTION_REQUIRED fires at annual

---

## GROUP 8 SUMMARY TABLE

| Vector | Scenario | Key Feature | Periods | Key Insight |
|--------|---------|------------|---------|-------------|
| TV-EX-G8-001 | SC-QC-8-3Q | 8% quarterly cumulative (cross-ref) | Q1–Q3 + Annual | Q1 NIL; ₱250K applied only at annual |
| TV-EX-G8-002 | SC-QC-OSD-3Q | OSD quarterly, bracket escalation | Q1–Q3 + Annual | Q1 NIL (NTI<250K); cumulative NTI rises Q2→Q3; Path C was ₱46,500 cheaper |
| TV-EX-G8-003 | SC-QC-ITEMIZED-3Q | Itemized quarterly, Path A wins | Q1–Q3 + Annual | Q1 NIL; 70% expense ratio → Path A beats Path C by ₱17,500 |
| TV-EX-G8-004 | SC-QC-NIL-Q1 | Zero Q1 income | Q1–Q3 + Annual | NIL Q1 still mandatory; ₱250K deduction waits until annual |
| TV-EX-G8-005 | SC-QC-CWT-SHIFT | Late Q1 2307 absorbed in Q2 | Q1–Q3 + Annual | Q2 payable = ₱0; no amendment needed; overpayment at annual |
| TV-EX-G8-006 | SC-QC-AMENDMENT | Q1 understatement cascade | Q1–Q3 amended + Annual | Only Q1 has additional tax + penalties; Q2/Q3 payable unchanged |
| TV-EX-G8-007 | SC-QC-OVERPY-Q3 | CWT exceeds IT at Q3 (cross-ref) | Q1–Q3 + Annual | Q3 payable = ₱0; overpayment election at annual |

**Key insights for Group 8:**

1. **Q1 NIL returns are common and mandatory.** In TV-EX-G8-002, cumulative NTI at Q1 (₱180,000) is below the ₱250,000 bracket threshold, producing ₱0 IT. In TV-EX-G8-003, cumulative NTI (₱150,000) is below ₱250,000. In TV-EX-G8-004, income is zero. All three require a NIL 1701Q to be filed by May 15. Failure to file results in a ₱1,000 compromise penalty (1st offense) per RMO 7-2015.

2. **The ₱250,000 deduction under 8% is ANNUAL ONLY.** At Q2 and Q3, the 8% rate is applied to cumulative gross receipts with NO ₱250,000 subtraction. This means quarterly payments slightly overstate the proportional tax. The annual return corrects this by applying the ₱250,000 deduction for the first and only time. Vectors TV-EX-G8-001 and TV-EX-G8-004 both demonstrate this: Q2 and Q3 quarterly IT = cumul_GR × 8% with no deduction; annual IT = (annual_GR − ₱250,000) × 8%.

3. **The cumulative method self-corrects for late CWT without amendments.** TV-EX-G8-005 demonstrates that when a Form 2307 is received after the Q1 filing deadline, the taxpayer simply includes it in Q2 as part of cumulative CWT. The Q2 formula (cumul_IT − cumul_CWT − prior_paid) naturally absorbs both the Q1 and Q2 CWT, resulting in Q2 payable = ₱0. The taxpayer does NOT need to amend Q1. The overpayment that results (Q1 paid without the CWT credit) surfaces at annual reconciliation.

4. **Amendment cascade is required even when no additional tax is due.** TV-EX-G8-006 shows that when Q1 is amended, Q2 and Q3 must also be amended to update the cumulative GR figures and prior-payment references — even though the Q2 and Q3 payable amounts happen to be identical in this case. This maintains consistent official records. Penalties apply only to the Q1 amendment deficiency (₱8,000 × 10% surcharge + interest + compromise).

5. **PT (Form 2551Q) is always a separate obligation from IT (Form 1701Q).** TV-EX-G8-002 and TV-EX-G8-003 show PT filings on separate deadlines (April 25, July 25, October 25, January 25) while 1701Q deadlines are May 15, August 15, November 15. The engine tracks them independently. PT under Path B/A is not affected by the IT amendment cascade.

6. **Bracket escalation under OSD is visible and important to display.** TV-EX-G8-002 shows Q1 in bracket 1 (₱0 IT), Q2 entering bracket 2 (15% marginal), Q3 entering bracket 3 (20% marginal), and annual staying in bracket 3. This escalation is why quarterly payments are not simply ¼ of the annual liability — Q1 pays ₱0, Q2 pays more than Q3 on an incremental basis (Q2 incremental ₱16,500 vs Q3 incremental ₱34,000 — higher because Q3's marginal rate is higher).

---

## GROUP 9: Business/Trading Taxpayers (SC-B)

**11 scenario codes:** SC-B-ML-8, SC-B-ML-O, SC-B-ML-I, SC-B-MH-8, SC-B-MH-O, SC-B-MH-I, SC-B-H-8, SC-B-H-O, SC-B-H-I, SC-B-VH-O-VAT, SC-B-VH-I-VAT

**The defining difference from Group 1 (service providers):**

Trading taxpayers (sellers of goods) have `cost_of_goods_sold > 0`, which the engine uses to set `taxpayer_class = TRADER`. This changes the OSD base computation:

| Field | SERVICE_PROVIDER | TRADER |
|-------|-----------------|--------|
| `gross_income` | = `net_gross_receipts` | = `net_gross_receipts − cost_of_goods_sold` |
| OSD base (Path B) | 40% × `net_gross_receipts` | 40% × `gross_income` (= 40% × (sales − COGS)) |
| Path A NTI base | `gross_receipts − expenses` | `gross_receipts − COGS − operating_expenses` |
| Path C base | `gross_receipts − ₱250,000` | `gross_receipts − ₱250,000` (COGS not deducted for 8%) |
| PT base | `gross_receipts` | `gross_receipts` (gross SALES) |
| EAR cap | 1% of gross receipts (service) | 0.5% of net sales (goods) |

**Critical insight:** For traders with high COGS, the 8% option is expensive because it ignores COGS — the rate applies to gross SALES, not gross income. By contrast, OSD and itemized both deduct COGS before computing NTI. As COGS ratio rises, OSD and itemized become increasingly advantageous over 8%.

**OSD vs Itemized breakeven for TRADER (Path B vs Path A):**
For a trader, OSD beats itemized when: operating_expenses < 0.40 × gross_income.
Itemized beats OSD when: operating_expenses > 0.40 × gross_income (i.e., when OE exceeds 40% of the gross income figure after subtracting COGS).

**Common characteristics for all Group 9 vectors (differences from Group 1 defaults noted):**
- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `taxpayer_class` (derived): **TRADER** (because `cost_of_goods_sold > 0`)
- `income_type` (derived): PURELY_SE
- `sales_returns_allowances`: ₱0.00
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `prior_quarterly_payments`: []
- `cwt_2307_entries`: []
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `return_type`: ORIGINAL
- `prior_payment_for_return`: ₱0.00
- `elected_regime`: null (optimizer mode)
- `filing_period`: ANNUAL
- `tax_year`: 2025

---

## TV-EX-G9-001: SC-B-ML-8 — Online Retailer, Low COGS, 8% Optimal

**Scenario code:** SC-B-ML-8
**Description:** Online seller of digital goods (stock photo bundles, design templates) with ₱700,000 gross sales and only ₱50,000 COGS (stock licenses, asset purchases). Operating expenses ₱50,000 (platform fees, advertising). COGS is so low (7.1%) that the 8% option on gross sales is cheaper than OSD — even though OSD reduces the base by COGS before applying 40%. Demonstrates that the low-COGS digital goods business most resembles a service provider, making 8% the clear winner.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱700,000.00 | Gross sales of digital goods |
| `cost_of_goods_sold` | ₱50,000.00 | Stock license purchases, asset acquisition cost |
| `itemized_expenses.advertising` | ₱30,000.00 | Marketplace listing fees, paid ads |
| `itemized_expenses.communication` | ₱10,000.00 | Internet, cloud storage subscriptions |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | BIR registration, local business permit |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | Gross sales < ₱3,000,000 |

**Total operating expenses (excluding COGS):** ₱50,000.00
**Total itemized (COGS + OE):** ₱100,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱700,000.00; gross_income = ₱700,000 − ₱50,000 = **₱650,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO; income_type = PURELY_SE

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱50,000.00; other itemized operating expenses = ₱50,000.00; total_path_a_deductions = ₱100,000.00; EAR cap = 0.5% × ₱700,000 = ₱3,500.00 (goods rate); no EAR expenses claimed; NOLCO = ₱0.00

**PL-06 (OSD for TRADER):** osd_base = gross_income = ₱650,000.00; osd_amount = ₱650,000 × 0.40 = **₱260,000.00**; nti_path_b = ₱650,000 − ₱260,000 = **₱390,000.00**

**PL-07:** total_cwt = ₱0.00

**PL-08 (Path A — Graduated + Itemized):** nti_path_a = ₱700,000 − ₱50,000 − ₱50,000 = **₱600,000.00**; income_tax = 22,500 + (600,000 − 400,000) × 0.20 = 22,500 + 40,000 = **₱62,500.00**; pt = ₱700,000 × 0.03 = **₱21,000.00**; total_path_a = **₱83,500.00**

**PL-09 (Path B — Graduated + OSD):** nti_path_b = ₱390,000.00; income_tax = (390,000 − 250,000) × 0.15 = **₱21,000.00** (bracket 2); pt = **₱21,000.00**; total_path_b = **₱42,000.00**

**PL-10 (Path C — 8% Flat):** path_c_base = max(700,000 − 250,000, 0) = **₱450,000.00**; income_tax = 450,000 × 0.08 = **₱36,000.00**; pt = **₱0.00** (waived); total_path_c = **₱36,000.00**

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱42,000 − ₱36,000 = **₱6,000.00**; savings_vs_worst = ₱83,500 − ₱36,000 = **₱47,500.00**

**PL-14:** balance_payable = ₱36,000.00 − ₱0.00 CWT − ₱0.00 quarterly = **₱36,000.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_B (8% rate section, purely SE)

**PL-16:** total_penalties = ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 650000.00,
  cost_of_goods_sold: 50000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 600000.00,
              income_tax: 62500.00, percentage_tax: 21000.00, total_tax: 83500.00 },
    path_b: { eligible: true, nti: 390000.00, osd_base: 650000.00, osd_amount: 260000.00,
              income_tax: 21000.00, percentage_tax: 21000.00, total_tax: 42000.00 },
    path_c: { eligible: true, tax_base: 450000.00, income_tax: 36000.00,
              percentage_tax: 0.00, total_tax: 36000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 6000.00,
    savings_vs_worst: 47500.00
  },

  selected_path: PATH_C,
  income_tax_due: 36000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 36000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 36000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN_004],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

**WARN_004** fires: total expenses / gross_receipts = 100,000 / 700,000 = 14.3% — within normal range but the low-expense ratio is noted.

### Verification

- TRADER OSD base = gross_income = 700,000 − 50,000 = **₱650,000** ✓ (not gross_sales)
- Path B OSD = 650,000 × 0.40 = **₱260,000** ✓; NTI = 650,000 − 260,000 = **₱390,000** ✓
- Path B IT: (390,000 − 250,000) × 0.15 = 140,000 × 0.15 = **₱21,000** ✓ (bracket 2)
- Path C base = 700,000 − 250,000 = **₱450,000** ✓ (COGS NOT deducted for 8%)
- Path C IT = 450,000 × 0.08 = **₱36,000** ✓
- Path A NTI = 700,000 − 50,000 − 50,000 = **₱600,000** ✓; IT = 22,500 + 200,000 × 0.20 = **₱62,500** ✓
- Path C wins: 36,000 < 42,000 < 83,500 ✓

**Legal basis:** TRADER OSD base: NIRC Sec. 34(L) — "40% of gross income"; gross income for goods = gross sales − COGS per Sec. 32. 8% option base: NIRC Sec. 24(A)(2)(b) — "gross sales or receipts" (no COGS deduction). PT waiver: RR 8-2018.

---

## TV-EX-G9-002: SC-B-ML-O — Physical Goods Retailer, High COGS, OSD Optimal

**Scenario code:** SC-B-ML-O
**Description:** Clothing retailer sourcing wholesale inventory with ₱800,000 gross sales and ₱400,000 COGS (50%). When COGS is 50%, the OSD is applied to only ₱400,000 (gross income), reducing NTI to ₱240,000 — just below the ₱250,000 zero-tax threshold. This eliminates income tax entirely. The 8% option ignores the ₱400,000 COGS and taxes ₱550,000 at 8% = ₱44,000, far more than the ₱24,000 total under OSD (PT only). Demonstrates that high-COGS traders should almost always choose OSD or itemized over 8%.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱800,000.00 | Gross sales (wholesale-to-retail) |
| `cost_of_goods_sold` | ₱400,000.00 | Wholesale purchase cost of goods sold |
| `itemized_expenses.rent` | ₱36,000.00 | Market stall rental ₱3,000/month × 12 |
| `itemized_expenses.utilities` | ₱12,000.00 | Electricity and water at stall |
| `itemized_expenses.taxes_and_licenses` | ₱12,000.00 | Business permit, BIR COR renewal |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱60,000.00
**Total itemized (COGS + OE):** ₱460,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱800,000.00; gross_income = ₱800,000 − ₱400,000 = **₱400,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱400,000.00; operating expenses = ₱60,000.00; total_path_a_deductions = ₱460,000.00; EAR cap = 0.5% × ₱800,000 = ₱4,000.00; NOLCO = ₱0.00

**PL-06 (OSD for TRADER):** osd_base = ₱400,000.00; osd_amount = ₱400,000 × 0.40 = **₱160,000.00**; nti_path_b = ₱400,000 − ₱160,000 = **₱240,000.00**

**PL-08 (Path A):** nti_path_a = ₱800,000 − ₱400,000 − ₱60,000 = **₱340,000.00**; income_tax = (340,000 − 250,000) × 0.15 = **₱13,500.00** (bracket 2); pt = ₱800,000 × 0.03 = **₱24,000.00**; total_path_a = **₱37,500.00**

**PL-09 (Path B):** nti_path_b = ₱240,000.00 (below ₱250,000 threshold); income_tax = **₱0.00**; pt = **₱24,000.00**; total_path_b = **₱24,000.00**

**PL-10 (Path C):** path_c_base = max(800,000 − 250,000, 0) = **₱550,000.00**; income_tax = 550,000 × 0.08 = **₱44,000.00**; pt = **₱0.00**; total_path_c = **₱44,000.00**

**PL-13:** recommended_path = PATH_B; savings_vs_next_best = ₱37,500 − ₱24,000 = **₱13,500.00**; savings_vs_worst = ₱44,000 − ₱24,000 = **₱20,000.00**

**PL-14:** balance_payable = **₱24,000.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (graduated + OSD)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 400000.00,
  cost_of_goods_sold: 400000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 340000.00,
              income_tax: 13500.00, percentage_tax: 24000.00, total_tax: 37500.00 },
    path_b: { eligible: true, nti: 240000.00, osd_base: 400000.00, osd_amount: 160000.00,
              income_tax: 0.00, percentage_tax: 24000.00, total_tax: 24000.00 },
    path_c: { eligible: true, tax_base: 550000.00, income_tax: 44000.00,
              percentage_tax: 0.00, total_tax: 44000.00, ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 13500.00,
    savings_vs_worst: 20000.00
  },

  selected_path: PATH_B,
  income_tax_due: 0.00,
  percentage_tax_due: 24000.00,
  total_tax_due: 24000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 24000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- TRADER gross_income = 800,000 − 400,000 = **₱400,000** ✓
- Path B OSD = 400,000 × 0.40 = **₱160,000** ✓; NTI = 400,000 − 160,000 = **₱240,000** ✓
- Path B NTI ₱240,000 < ₱250,000 → IT = **₱0.00** ✓
- Path B total = 0 + 24,000 = **₱24,000** ✓
- Path C base = 800,000 − 250,000 = **₱550,000** ✓ (COGS not subtracted!)
- Path C IT = 550,000 × 0.08 = **₱44,000** ✓
- Path B < Path A (₱24,000 < ₱37,500) < Path C (₱44,000) ✓
- OSD eliminates IT by reducing NTI below ₱250K zero-bracket ✓

**Key insight documented:** 8% ignores COGS → charges 8% on ₱550,000 gross = ₱44,000. OSD on gross_income (₱400,000) → NTI ₱240,000 → ₱0 IT → only PT ₱24,000. OSD saves ₱20,000 over 8% for this trader.

**Legal basis:** NIRC Sec. 34(L); NIRC Sec. 32(B) (gross income definition for goods: sales − COGS); NIRC Sec. 24(A)(2)(b).

---

## TV-EX-G9-003: SC-B-ML-I — High-Cost Goods Retailer, Very High COGS, Tie Between A and B

**Scenario code:** SC-B-ML-I
**Description:** Electronics reseller (camera bodies, lenses) with ₱800,000 gross sales and ₱600,000 COGS (75%). Operating expenses ₱100,000. When COGS is this high, both itemized (Path A) and OSD (Path B) produce NTIs below the ₱250,000 zero-tax threshold, making both paths equal in total tax (only PT applies). The engine correctly recommends Path B by tie-breaking rule (PATH_B > PATH_A when totals are equal). Path C charges 8% on gross sales ignoring the ₱600,000 COGS — a ₱20,000 penalty for choosing the wrong path.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱800,000.00 | Gross sales of camera equipment |
| `cost_of_goods_sold` | ₱600,000.00 | Camera bodies and lenses purchased for resale |
| `itemized_expenses.advertising` | ₱30,000.00 | Social media ads, product photography |
| `itemized_expenses.communication` | ₱20,000.00 | Internet, phone |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | Business permit, BIR fees |
| `itemized_expenses.transportation` | ₱30,000.00 | Delivery costs to buyers |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱700,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱800,000.00; gross_income = ₱800,000 − ₱600,000 = **₱200,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱600,000.00; operating expenses = ₱100,000.00; EAR cap = 0.5% × ₱800,000 = ₱4,000.00; no EAR expenses claimed; NOLCO = ₱0.00

**PL-06 (OSD for TRADER):** osd_base = ₱200,000.00; osd_amount = ₱200,000 × 0.40 = **₱80,000.00**; nti_path_b = ₱200,000 − ₱80,000 = **₱120,000.00**

**Breakeven check (Path A vs Path B):** OSD beats itemized when OE < 0.40 × gross_income. 0.40 × ₱200,000 = ₱80,000; actual OE = ₱100,000 > ₱80,000 → **Itemized has lower NTI than OSD** (₱100,000 < ₱120,000). However, BOTH NTIs are below ₱250,000, so IT = ₱0 for both → tie.

**PL-08 (Path A):** nti_path_a = ₱800,000 − ₱600,000 − ₱100,000 = **₱100,000.00**; income_tax = **₱0.00** (below ₱250K); pt = ₱800,000 × 0.03 = **₱24,000.00**; total_path_a = **₱24,000.00**

**PL-09 (Path B):** nti_path_b = **₱120,000.00**; income_tax = **₱0.00**; pt = **₱24,000.00**; total_path_b = **₱24,000.00**

**PL-10 (Path C):** path_c_base = max(800,000 − 250,000, 0) = **₱550,000.00**; income_tax = 550,000 × 0.08 = **₱44,000.00**; pt = **₱0.00**; total_path_c = **₱44,000.00**

**PL-13:** recommended_path = PATH_B (tie-break: PATH_B preferred over PATH_A when totals equal per INV-RC-03); savings_vs_next_best = **₱0.00** (tied with Path A); savings_vs_worst = ₱44,000 − ₱24,000 = **₱20,000.00**

**PL-14:** balance_payable = **₱24,000.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (Path B recommended)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 200000.00,
  cost_of_goods_sold: 600000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 100000.00,
              income_tax: 0.00, percentage_tax: 24000.00, total_tax: 24000.00 },
    path_b: { eligible: true, nti: 120000.00, osd_base: 200000.00, osd_amount: 80000.00,
              income_tax: 0.00, percentage_tax: 24000.00, total_tax: 24000.00 },
    path_c: { eligible: true, tax_base: 550000.00, income_tax: 44000.00,
              percentage_tax: 0.00, total_tax: 44000.00, ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 0.00,
    savings_vs_worst: 20000.00
  },

  selected_path: PATH_B,
  income_tax_due: 0.00,
  percentage_tax_due: 24000.00,
  total_tax_due: 24000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 24000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 800,000 − 600,000 = **₱200,000** ✓
- OE > 0.40 × GI: 100,000 > 80,000 → itemized gives lower NTI than OSD ✓
- Path A NTI = 800,000 − 600,000 − 100,000 = **₱100,000** < ₱250K → IT = **₱0** ✓
- Path B NTI = 200,000 × 0.60 = **₱120,000** < ₱250K → IT = **₱0** ✓
- Both totals = ₱24,000; tie → PATH_B wins per INV-RC-03 ✓
- savings_vs_next_best = 0 (tie displayed in UI as "Equally optimal — Path B selected by default") ✓

**Legal basis:** NIRC Sec. 34(L) (OSD on gross income). Tie-breaking rule: CR-028 Section 5 — "On equal total tax, path rank: C > B > A". Path C not eligible here (it would cost more). Between B and A at equal cost: B wins.

---

## TV-EX-G9-004: SC-B-MH-8 — E-Commerce Seller, Medium Gross, Low COGS, 8% Wins

**Scenario code:** SC-B-MH-8
**Description:** Online seller of digital software licenses and SaaS subscriptions (rebundled products) with ₱1,500,000 gross sales and only ₱200,000 COGS (13.3% ratio). Low COGS means the 8% option (applied to gross sales − ₱250K) is far cheaper than OSD or itemized. Both OSD and itemized produce high NTIs because deductible amounts are small relative to gross sales. 8% saves ₱43,500 over OSD and ₱147,500 over itemized.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | Annual gross sales of software/digital products |
| `cost_of_goods_sold` | ₱200,000.00 | Software license acquisition cost |
| `itemized_expenses.advertising` | ₱60,000.00 | Digital marketing, SEO tools |
| `itemized_expenses.communication` | ₱24,000.00 | Internet, cloud servers, email services |
| `itemized_expenses.taxes_and_licenses` | ₱16,000.00 | BIR registration, permits, platform fees |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱300,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱1,500,000.00; gross_income = ₱1,500,000 − ₱200,000 = **₱1,300,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱200,000.00; operating expenses = ₱100,000.00; EAR cap = 0.5% × ₱1,500,000 = ₱7,500.00; no EAR expenses claimed; NOLCO = ₱0.00

**PL-06 (OSD):** osd_base = ₱1,300,000.00; osd_amount = ₱1,300,000 × 0.40 = **₱520,000.00**; nti_path_b = ₱1,300,000 − ₱520,000 = **₱780,000.00**

**PL-08 (Path A):** nti_path_a = ₱1,500,000 − ₱200,000 − ₱100,000 = **₱1,200,000.00**; income_tax = 102,500 + (1,200,000 − 800,000) × 0.25 = 102,500 + 100,000 = **₱202,500.00** (bracket 4); pt = ₱1,500,000 × 0.03 = **₱45,000.00**; total_path_a = **₱247,500.00**

**PL-09 (Path B):** nti_path_b = ₱780,000.00; income_tax = 22,500 + (780,000 − 400,000) × 0.20 = 22,500 + 76,000 = **₱98,500.00** (bracket 3); pt = **₱45,000.00**; total_path_b = **₱143,500.00**

**PL-10 (Path C):** path_c_base = max(1,500,000 − 250,000, 0) = **₱1,250,000.00**; income_tax = 1,250,000 × 0.08 = **₱100,000.00**; pt = **₱0.00**; total_path_c = **₱100,000.00**

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱143,500 − ₱100,000 = **₱43,500.00**; savings_vs_worst = ₱247,500 − ₱100,000 = **₱147,500.00**

**PL-14:** balance_payable = **₱100,000.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 1300000.00,
  cost_of_goods_sold: 200000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 1200000.00,
              income_tax: 202500.00, percentage_tax: 45000.00, total_tax: 247500.00 },
    path_b: { eligible: true, nti: 780000.00, osd_base: 1300000.00, osd_amount: 520000.00,
              income_tax: 98500.00, percentage_tax: 45000.00, total_tax: 143500.00 },
    path_c: { eligible: true, tax_base: 1250000.00, income_tax: 100000.00,
              percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 43500.00,
    savings_vs_worst: 147500.00
  },

  selected_path: PATH_C,
  income_tax_due: 100000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 100000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 100000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 1,500,000 − 200,000 = **₱1,300,000** ✓
- Path B NTI = 1,300,000 × 0.60 = **₱780,000** ✓; IT = 22,500 + (780,000 − 400,000) × 0.20 = 22,500 + 76,000 = **₱98,500** ✓
- Path A NTI = 1,500,000 − 300,000 = **₱1,200,000** ✓; IT = 102,500 + (1,200,000 − 800,000) × 0.25 = 102,500 + 100,000 = **₱202,500** ✓
- Path C base = 1,500,000 − 250,000 = **₱1,250,000** ✓; IT = 1,250,000 × 0.08 = **₱100,000** ✓
- PATH_C wins: 100,000 < 143,500 < 247,500 ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b) (8% on gross sales). NIRC Sec. 34(L) (OSD on gross income). CR-028 (regime comparison).

---

## TV-EX-G9-005: SC-B-MH-O — General Merchandise Retailer, Medium Gross, High COGS, OSD Optimal

**Scenario code:** SC-B-MH-O
**Description:** Hardware/tools retailer with ₱1,500,000 gross sales and ₱750,000 COGS (50%). OSD applied to gross income of ₱750,000 yields NTI of ₱450,000 — in bracket 3 (20% marginal), producing IT ₱32,500 plus PT ₱45,000 = ₱77,500 total. The 8% option on ₱1,250,000 (gross minus ₱250K) = ₱100,000. OSD saves ₱22,500 over 8%. Demonstrates that mid-range retailers with ~50% COGS should strongly prefer OSD or itemized over the 8% flat rate.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | Gross sales of hardware, tools, construction supplies |
| `cost_of_goods_sold` | ₱750,000.00 | Wholesale purchase cost (50% COGS ratio) |
| `itemized_expenses.rent` | ₱60,000.00 | Store rent ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱24,000.00 | Electricity, water |
| `itemized_expenses.taxes_and_licenses` | ₱16,000.00 | Business permit, BIR COR |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱850,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱1,500,000.00; gross_income = ₱1,500,000 − ₱750,000 = **₱750,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱750,000.00; operating expenses = ₱100,000.00; EAR cap = 0.5% × ₱1,500,000 = ₱7,500.00; NOLCO = ₱0.00

**PL-06 (OSD):** osd_base = ₱750,000.00; osd_amount = ₱750,000 × 0.40 = **₱300,000.00**; nti_path_b = ₱750,000 − ₱300,000 = **₱450,000.00**

**PL-08 (Path A):** nti_path_a = ₱1,500,000 − ₱750,000 − ₱100,000 = **₱650,000.00**; income_tax = 22,500 + (650,000 − 400,000) × 0.20 = 22,500 + 50,000 = **₱72,500.00** (bracket 3); pt = ₱1,500,000 × 0.03 = **₱45,000.00**; total_path_a = **₱117,500.00**

**PL-09 (Path B):** nti_path_b = ₱450,000.00; income_tax = 22,500 + (450,000 − 400,000) × 0.20 = 22,500 + 10,000 = **₱32,500.00** (bracket 3); pt = **₱45,000.00**; total_path_b = **₱77,500.00**

**PL-10 (Path C):** path_c_base = max(1,500,000 − 250,000, 0) = **₱1,250,000.00**; income_tax = 1,250,000 × 0.08 = **₱100,000.00**; pt = **₱0.00**; total_path_c = **₱100,000.00**

**PL-13:** recommended_path = PATH_B; savings_vs_next_best = ₱100,000 − ₱77,500 = **₱22,500.00**; savings_vs_worst = ₱117,500 − ₱77,500 = **₱40,000.00**

**PL-14:** balance_payable = **₱77,500.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (OSD)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 750000.00,
  cost_of_goods_sold: 750000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 650000.00,
              income_tax: 72500.00, percentage_tax: 45000.00, total_tax: 117500.00 },
    path_b: { eligible: true, nti: 450000.00, osd_base: 750000.00, osd_amount: 300000.00,
              income_tax: 32500.00, percentage_tax: 45000.00, total_tax: 77500.00 },
    path_c: { eligible: true, tax_base: 1250000.00, income_tax: 100000.00,
              percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 22500.00,
    savings_vs_worst: 40000.00
  },

  selected_path: PATH_B,
  income_tax_due: 32500.00,
  percentage_tax_due: 45000.00,
  total_tax_due: 77500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 77500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 1,500,000 − 750,000 = **₱750,000** ✓
- Path B OSD = 750,000 × 0.40 = **₱300,000** ✓; NTI = **₱450,000** ✓
- Path B IT = 22,500 + (450,000 − 400,000) × 0.20 = 22,500 + 10,000 = **₱32,500** ✓ (bracket 3, 20% on excess over ₱400K)
- Path B total = 32,500 + 45,000 = **₱77,500** ✓
- PATH_B wins: 77,500 < 100,000 < 117,500 ✓

**Legal basis:** NIRC Sec. 34(L) (OSD). NIRC Sec. 116 (3% PT on gross sales). NIRC Sec. 24(A)(2)(b).

---

## TV-EX-G9-006: SC-B-MH-I — Importer/Distributor, Very High COGS, Itemized Wins

**Scenario code:** SC-B-MH-I
**Description:** Small electronics importer with ₱1,500,000 gross sales and ₱1,050,000 COGS (70% ratio). High operating expenses ₱200,000 (freight, customs documentation, warehousing) exceed 40% of gross income (40% × ₱450,000 = ₱180,000 < ₱200,000) — so itemized gives a lower NTI than OSD. NTI under itemized = ₱250,000 exactly (₱0 IT); under OSD = ₱270,000 (₱3,000 IT). Itemized saves ₱3,000 over OSD. Both save ₱55,000 over the 8% option.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | Gross sales of imported electronics |
| `cost_of_goods_sold` | ₱1,050,000.00 | Import purchase cost (70% COGS ratio) |
| `itemized_expenses.transportation` | ₱80,000.00 | Freight, customs brokerage fees |
| `itemized_expenses.rent` | ₱60,000.00 | Warehouse rental ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱24,000.00 | Warehouse electricity, internet |
| `itemized_expenses.taxes_and_licenses` | ₱36,000.00 | Import duties (not VAT-creditable), business permit |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱200,000.00
**Total itemized (COGS + OE):** ₱1,250,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱1,500,000.00; gross_income = ₱1,500,000 − ₱1,050,000 = **₱450,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱1,050,000.00; operating expenses = ₱200,000.00; total_path_a_deductions = ₱1,250,000.00; EAR cap = 0.5% × ₱1,500,000 = ₱7,500.00; NOLCO = ₱0.00

**Itemized vs OSD check:** 0.40 × gross_income = 0.40 × ₱450,000 = ₱180,000; actual OE = ₱200,000 > ₱180,000 → **itemized produces lower NTI** than OSD

**PL-06 (OSD):** osd_base = ₱450,000.00; osd_amount = ₱450,000 × 0.40 = **₱180,000.00**; nti_path_b = ₱450,000 − ₱180,000 = **₱270,000.00**

**PL-08 (Path A):** nti_path_a = ₱1,500,000 − ₱1,050,000 − ₱200,000 = **₱250,000.00**; income_tax = graduated_tax_2023(250,000) = **₱0.00** (≤ ₱250,000 bracket, inclusive zero); pt = ₱1,500,000 × 0.03 = **₱45,000.00**; total_path_a = **₱45,000.00**

**PL-09 (Path B):** nti_path_b = ₱270,000.00; income_tax = (270,000 − 250,000) × 0.15 = **₱3,000.00** (bracket 2); pt = **₱45,000.00**; total_path_b = **₱48,000.00**

**PL-10 (Path C):** path_c_base = max(1,500,000 − 250,000, 0) = **₱1,250,000.00**; income_tax = 1,250,000 × 0.08 = **₱100,000.00**; pt = **₱0.00**; total_path_c = **₱100,000.00**

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱48,000 − ₱45,000 = **₱3,000.00** (vs Path B); savings_vs_worst = ₱100,000 − ₱45,000 = **₱55,000.00** (vs Path C)

**PL-14:** balance_payable = **₱45,000.00**

**PL-15:** form = FORM_1701; form_section = PART_IV (itemized — requires Form 1701, not 1701A)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 450000.00,
  cost_of_goods_sold: 1050000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 250000.00,
              income_tax: 0.00, percentage_tax: 45000.00, total_tax: 45000.00 },
    path_b: { eligible: true, nti: 270000.00, osd_base: 450000.00, osd_amount: 180000.00,
              income_tax: 3000.00, percentage_tax: 45000.00, total_tax: 48000.00 },
    path_c: { eligible: true, tax_base: 1250000.00, income_tax: 100000.00,
              percentage_tax: 0.00, total_tax: 100000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 3000.00,
    savings_vs_worst: 55000.00
  },

  selected_path: PATH_A,
  income_tax_due: 0.00,
  percentage_tax_due: 45000.00,
  total_tax_due: 45000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 45000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 1,500,000 − 1,050,000 = **₱450,000** ✓
- 0.40 × GI = 180,000 < OE = 200,000 → itemized gives lower NTI ✓
- Path A NTI = 1,500,000 − 1,050,000 − 200,000 = **₱250,000** ✓; graduated(250,000) = **₱0** ✓ (≤ ₱250K)
- Path B OSD = 450,000 × 0.40 = **₱180,000** ✓; NTI = **₱270,000** ✓; IT = (270,000 − 250,000) × 0.15 = **₱3,000** ✓
- PATH_A wins: 45,000 < 48,000 < 100,000 ✓
- Form = FORM_1701 (itemized requires Form 1701) ✓

**Legal basis:** NIRC Sec. 34(A)–(K) (itemized deductions including COGS). Itemized wins when OE > 40% × GI: confirmed for this vector.

---

## TV-EX-G9-007: SC-B-H-8 — E-Commerce Seller, High Gross, Very Low COGS, 8% Wins

**Scenario code:** SC-B-H-8
**Description:** High-earning digital goods seller (ebooks, online courses, software) with ₱2,500,000 gross sales and only ₱200,000 COGS (8% ratio). Minimal COGS makes this functionally similar to a service provider. The 8% flat rate on ₱2,250,000 (gross minus ₱250K) = ₱180,000 wins decisively over OSD (NTI ₱1,380,000 → IT ₱247,500 + PT ₱75,000 = ₱322,500). 8% saves ₱142,500 over OSD at this income level.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Gross sales of digital content products |
| `cost_of_goods_sold` | ₱200,000.00 | Platform content licensing, asset purchases |
| `itemized_expenses.advertising` | ₱60,000.00 | Paid ads, influencer promotions |
| `itemized_expenses.communication` | ₱24,000.00 | Cloud hosting, internet |
| `itemized_expenses.taxes_and_licenses` | ₱16,000.00 | BIR registration, permits |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | Gross sales ₱2.5M < ₱3M |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱300,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱2,500,000.00; gross_income = ₱2,500,000 − ₱200,000 = **₱2,300,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱200,000.00; operating expenses = ₱100,000.00; EAR cap = 0.5% × ₱2,500,000 = ₱12,500.00; NOLCO = ₱0.00

**PL-06 (OSD):** osd_base = ₱2,300,000.00; osd_amount = ₱2,300,000 × 0.40 = **₱920,000.00**; nti_path_b = ₱2,300,000 − ₱920,000 = **₱1,380,000.00**

**PL-08 (Path A):** nti_path_a = ₱2,500,000 − ₱200,000 − ₱100,000 = **₱2,200,000.00**; income_tax = 402,500 + (2,200,000 − 2,000,000) × 0.30 = 402,500 + 60,000 = **₱462,500.00** (bracket 5); pt = ₱2,500,000 × 0.03 = **₱75,000.00**; total_path_a = **₱537,500.00**

**PL-09 (Path B):** nti_path_b = ₱1,380,000.00; income_tax = 102,500 + (1,380,000 − 800,000) × 0.25 = 102,500 + 145,000 = **₱247,500.00** (bracket 4); pt = **₱75,000.00**; total_path_b = **₱322,500.00**

**PL-10 (Path C):** path_c_base = max(2,500,000 − 250,000, 0) = **₱2,250,000.00**; income_tax = 2,250,000 × 0.08 = **₱180,000.00**; pt = **₱0.00**; total_path_c = **₱180,000.00**

**PL-13:** recommended_path = PATH_C; savings_vs_next_best = ₱322,500 − ₱180,000 = **₱142,500.00**; savings_vs_worst = ₱537,500 − ₱180,000 = **₱357,500.00**

**PL-14:** balance_payable = **₱180,000.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_B

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 2300000.00,
  cost_of_goods_sold: 200000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 2200000.00,
              income_tax: 462500.00, percentage_tax: 75000.00, total_tax: 537500.00 },
    path_b: { eligible: true, nti: 1380000.00, osd_base: 2300000.00, osd_amount: 920000.00,
              income_tax: 247500.00, percentage_tax: 75000.00, total_tax: 322500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 142500.00,
    savings_vs_worst: 357500.00
  },

  selected_path: PATH_C,
  income_tax_due: 180000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 180000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 180000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 2,500,000 − 200,000 = **₱2,300,000** ✓
- Path B OSD = 2,300,000 × 0.40 = **₱920,000** ✓; NTI = **₱1,380,000** ✓
- Path B IT = 102,500 + (1,380,000 − 800,000) × 0.25 = 102,500 + 145,000 = **₱247,500** ✓
- Path A NTI = 2,500,000 − 300,000 = **₱2,200,000** ✓; IT = 402,500 + (2,200,000 − 2,000,000) × 0.30 = 402,500 + 60,000 = **₱462,500** ✓ (bracket 5: ₱2M–₱8M at 30%)
- Path C = 2,250,000 × 0.08 = **₱180,000** ✓; PATH_C wins ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b). 8% rate schedule; TRAIN rate table brackets 4–5.

---

## TV-EX-G9-008: SC-B-H-O — Large Retailer, High Gross, Medium-High COGS, OSD Optimal

**Scenario code:** SC-B-H-O
**Description:** General merchandise retailer (sporting goods, household items) with ₱2,500,000 gross sales and ₱1,375,000 COGS (55%). OSD on gross income ₱1,125,000 yields NTI ₱675,000 → IT ₱77,500 + PT ₱75,000 = ₱152,500. The 8% option gives ₱180,000 (₱2,250,000 × 8%). OSD saves ₱27,500. This is the typical large retailer scenario — COGS is significant enough that OSD's application to the smaller gross income base outperforms the 8% flat rate, even though 8% eliminates PT.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Gross sales of sporting goods and household items |
| `cost_of_goods_sold` | ₱1,375,000.00 | Wholesale inventory cost (55% COGS ratio) |
| `itemized_expenses.rent` | ₱60,000.00 | Store rent ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱24,000.00 | Electricity, water |
| `itemized_expenses.taxes_and_licenses` | ₱16,000.00 | Business permit, BIR COR |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱1,475,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱2,500,000.00; gross_income = ₱2,500,000 − ₱1,375,000 = **₱1,125,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱1,375,000.00; operating expenses = ₱100,000.00; EAR cap = 0.5% × ₱2,500,000 = ₱12,500.00; NOLCO = ₱0.00

**Itemized vs OSD check:** 0.40 × GI = 0.40 × ₱1,125,000 = ₱450,000; OE = ₱100,000 < ₱450,000 → OSD gives lower NTI than itemized

**PL-06 (OSD):** osd_base = ₱1,125,000.00; osd_amount = ₱1,125,000 × 0.40 = **₱450,000.00**; nti_path_b = ₱1,125,000 − ₱450,000 = **₱675,000.00**

**PL-08 (Path A):** nti_path_a = ₱2,500,000 − ₱1,375,000 − ₱100,000 = **₱1,025,000.00**; income_tax = 102,500 + (1,025,000 − 800,000) × 0.25 = 102,500 + 56,250 = **₱158,750.00** (bracket 4); pt = ₱2,500,000 × 0.03 = **₱75,000.00**; total_path_a = **₱233,750.00**

**PL-09 (Path B):** nti_path_b = ₱675,000.00; income_tax = 22,500 + (675,000 − 400,000) × 0.20 = 22,500 + 55,000 = **₱77,500.00** (bracket 3); pt = **₱75,000.00**; total_path_b = **₱152,500.00**

**PL-10 (Path C):** path_c_base = max(2,500,000 − 250,000, 0) = **₱2,250,000.00**; income_tax = 2,250,000 × 0.08 = **₱180,000.00**; pt = **₱0.00**; total_path_c = **₱180,000.00**

**PL-13:** recommended_path = PATH_B; savings_vs_next_best = ₱180,000 − ₱152,500 = **₱27,500.00**; savings_vs_worst = ₱233,750 − ₱152,500 = **₱81,250.00**

**PL-14:** balance_payable = **₱152,500.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 1125000.00,
  cost_of_goods_sold: 1375000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 1025000.00,
              income_tax: 158750.00, percentage_tax: 75000.00, total_tax: 233750.00 },
    path_b: { eligible: true, nti: 675000.00, osd_base: 1125000.00, osd_amount: 450000.00,
              income_tax: 77500.00, percentage_tax: 75000.00, total_tax: 152500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 27500.00,
    savings_vs_worst: 81250.00
  },

  selected_path: PATH_B,
  income_tax_due: 77500.00,
  percentage_tax_due: 75000.00,
  total_tax_due: 152500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 152500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 2,500,000 − 1,375,000 = **₱1,125,000** ✓
- OE = 100,000 < 0.40 × 1,125,000 = 450,000 → OSD gives lower NTI than itemized ✓
- Path B OSD = 1,125,000 × 0.40 = **₱450,000** ✓; NTI = **₱675,000** ✓
- Path B IT = 22,500 + (675,000 − 400,000) × 0.20 = 22,500 + 55,000 = **₱77,500** ✓ (bracket 3)
- PATH_B wins: 152,500 < 180,000 < 233,750 ✓

**Legal basis:** NIRC Sec. 34(L). NIRC Sec. 116. TRAIN graduated rate schedule (2023+).

---

## TV-EX-G9-009: SC-B-H-I — Distributor, High Gross, Very High COGS, Itemized Wins

**Scenario code:** SC-B-H-I
**Description:** Industrial supplies distributor with ₱2,500,000 gross sales and ₱2,000,000 COGS (80% ratio). High operating expenses ₱300,000 (freight/logistics, storage, sales staff) exceed 40% of gross income (40% × ₱500,000 = ₱200,000 < ₱300,000). Itemized reduces NTI to ₱200,000 (below ₱250K, IT = ₱0). OSD reduces NTI only to ₱300,000 (IT = ₱7,500). Itemized saves ₱7,500 over OSD and ₱105,000 over 8%.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱2,500,000.00 | Gross sales of industrial/construction supplies |
| `cost_of_goods_sold` | ₱2,000,000.00 | Purchase cost of distributed goods (80% ratio) |
| `itemized_expenses.transportation` | ₱120,000.00 | Freight, trucking, fuel |
| `itemized_expenses.rent` | ₱72,000.00 | Warehouse rental ₱6,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | Warehouse electricity, water |
| `itemized_expenses.communication` | ₱24,000.00 | Phone, internet |
| `itemized_expenses.taxes_and_licenses` | ₱48,000.00 | Business permit, BIR COR, local taxes |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | |
| `taxpayer_tier` (derived) | MICRO | |

**Total operating expenses (excluding COGS):** ₱300,000.00
**Total itemized (COGS + OE):** ₱2,300,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱2,500,000.00; gross_income = ₱2,500,000 − ₱2,000,000 = **₱500,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = true; ineligibility_reasons = []

**PL-05:** COGS = ₱2,000,000.00; operating expenses = ₱300,000.00; EAR cap = 0.5% × ₱2,500,000 = ₱12,500.00; NOLCO = ₱0.00

**Itemized vs OSD check:** 0.40 × GI = 0.40 × ₱500,000 = ₱200,000; actual OE = ₱300,000 > ₱200,000 → **itemized gives lower NTI than OSD**

**PL-06 (OSD):** osd_base = ₱500,000.00; osd_amount = ₱500,000 × 0.40 = **₱200,000.00**; nti_path_b = ₱500,000 − ₱200,000 = **₱300,000.00**

**PL-08 (Path A):** nti_path_a = ₱2,500,000 − ₱2,000,000 − ₱300,000 = **₱200,000.00**; income_tax = graduated_tax_2023(200,000) = **₱0.00** (below ₱250K); pt = ₱2,500,000 × 0.03 = **₱75,000.00**; total_path_a = **₱75,000.00**

**PL-09 (Path B):** nti_path_b = ₱300,000.00; income_tax = (300,000 − 250,000) × 0.15 = **₱7,500.00** (bracket 2); pt = **₱75,000.00**; total_path_b = **₱82,500.00**

**PL-10 (Path C):** path_c_base = max(2,500,000 − 250,000, 0) = **₱2,250,000.00**; income_tax = 2,250,000 × 0.08 = **₱180,000.00**; pt = **₱0.00**; total_path_c = **₱180,000.00**

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱82,500 − ₱75,000 = **₱7,500.00**; savings_vs_worst = ₱180,000 − ₱75,000 = **₱105,000.00**

**PL-14:** balance_payable = **₱75,000.00**

**PL-15:** form = FORM_1701; form_section = PART_IV

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 500000.00,
  cost_of_goods_sold: 2000000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 200000.00,
              income_tax: 0.00, percentage_tax: 75000.00, total_tax: 75000.00 },
    path_b: { eligible: true, nti: 300000.00, osd_base: 500000.00, osd_amount: 200000.00,
              income_tax: 7500.00, percentage_tax: 75000.00, total_tax: 82500.00 },
    path_c: { eligible: true, tax_base: 2250000.00, income_tax: 180000.00,
              percentage_tax: 0.00, total_tax: 180000.00, ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 7500.00,
    savings_vs_worst: 105000.00
  },

  selected_path: PATH_A,
  income_tax_due: 0.00,
  percentage_tax_due: 75000.00,
  total_tax_due: 75000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 75000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],  ineligibility_notifications: []
}
```

### Verification

- gross_income = 2,500,000 − 2,000,000 = **₱500,000** ✓
- OE = 300,000 > 0.40 × 500,000 = 200,000 → itemized beats OSD ✓
- Path A NTI = 2,500,000 − 2,000,000 − 300,000 = **₱200,000** ✓; < ₱250K → IT = **₱0** ✓
- Path B OSD = 500,000 × 0.40 = **₱200,000** ✓; NTI = **₱300,000** ✓; IT = (300,000−250,000) × 0.15 = **₱7,500** ✓
- PATH_A wins: 75,000 < 82,500 < 180,000 ✓
- Form = FORM_1701 (itemized deductions chosen) ✓

**Legal basis:** NIRC Sec. 34(A)–(K). Itemized wins when OE > 40% × gross_income for traders.

---

## TV-EX-G9-010: SC-B-VH-O-VAT — VAT-Registered Retailer, Over ₱3M, OSD Optimal

**Scenario code:** SC-B-VH-O-VAT
**Description:** VAT-registered general retailer (household appliances) with ₱5,000,000 VAT-exclusive gross sales and ₱3,000,000 COGS. Path C (8%) is not available (VAT-registered). Comparing only Path A (itemized) vs Path B (OSD): OSD on gross income ₱2,000,000 yields NTI ₱1,200,000 → IT ₱202,500. Itemized yields NTI ₱1,800,000 → IT ₱352,500. No PT (VAT-registered). OSD saves ₱150,000.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱5,000,000.00 | VAT-exclusive gross sales (amounts DO NOT include the 12% VAT output) |
| `cost_of_goods_sold` | ₱3,000,000.00 | VAT-exclusive COGS (60% ratio) |
| `itemized_expenses.rent` | ₱96,000.00 | Store rent ₱8,000/month × 12 |
| `itemized_expenses.utilities` | ₱48,000.00 | Electricity, water |
| `itemized_expenses.salaries` | ₱36,000.00 | Part-time helper ₱3,000/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | Business permit, BIR fees |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | **true** | Gross sales > ₱3M triggers mandatory VAT registration |
| `taxpayer_tier` (derived) | SMALL | ₱3M ≤ gross sales < ₱20M |

**Total operating expenses (excluding COGS):** ₱200,000.00
**Total itemized (COGS + OE):** ₱3,200,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱5,000,000.00; gross_income = ₱5,000,000 − ₱3,000,000 = **₱2,000,000.00**; taxpayer_class = TRADER; taxpayer_tier = SMALL

**PL-04:** path_c_eligible = **false**; ineligibility_reasons = [INELIG_VAT_REGISTERED]

**PL-05:** COGS = ₱3,000,000.00; operating expenses = ₱200,000.00; EAR cap = 0.5% × ₱5,000,000 = ₱25,000.00; NOLCO = ₱0.00

**PL-06 (OSD):** osd_base = ₱2,000,000.00; osd_amount = ₱2,000,000 × 0.40 = **₱800,000.00**; nti_path_b = ₱2,000,000 − ₱800,000 = **₱1,200,000.00**

**PL-08 (Path A):** nti_path_a = ₱5,000,000 − ₱3,000,000 − ₱200,000 = **₱1,800,000.00**; income_tax = 102,500 + (1,800,000 − 800,000) × 0.25 = 102,500 + 250,000 = **₱352,500.00** (bracket 4); pt = **₱0.00** (VAT-registered — no OPT); total_path_a = **₱352,500.00**

**PL-09 (Path B):** nti_path_b = ₱1,200,000.00; income_tax = 102,500 + (1,200,000 − 800,000) × 0.25 = 102,500 + 100,000 = **₱202,500.00** (bracket 4); pt = **₱0.00**; total_path_b = **₱202,500.00**

**PL-10 (Path C):** eligible = false; total_path_c = null; ineligibility_reasons = [INELIG_VAT_REGISTERED]

**PL-13:** recommended_path = PATH_B; savings_vs_next_best = ₱352,500 − ₱202,500 = **₱150,000.00** (vs Path A only, Path C ineligible); savings_vs_worst = **₱150,000.00** (same)

**PL-14:** balance_payable = **₱202,500.00**

**PL-15:** form = FORM_1701; form_section = PART_IV_A (VAT-registered taxpayers use Form 1701 regardless of OSD/itemized election)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: SMALL,
  taxpayer_class: TRADER,

  gross_income: 2000000.00,
  cost_of_goods_sold: 3000000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 1800000.00,
              income_tax: 352500.00, percentage_tax: 0.00, total_tax: 352500.00 },
    path_b: { eligible: true, nti: 1200000.00, osd_base: 2000000.00, osd_amount: 800000.00,
              income_tax: 202500.00, percentage_tax: 0.00, total_tax: 202500.00 },
    path_c: { eligible: false, tax_base: null, income_tax: null,
              percentage_tax: null, total_tax: null,
              ineligibility_reasons: [INELIG_VAT_REGISTERED] },
    recommended_path: PATH_B,
    savings_vs_next_best: 150000.00,
    savings_vs_worst: 150000.00
  },

  selected_path: PATH_B,
  income_tax_due: 202500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 202500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 202500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: [IN_VAT_REGISTERED_NO_PATH_C]
}
```

### Verification

- gross_income = 5,000,000 − 3,000,000 = **₱2,000,000** ✓
- Path B OSD = 2,000,000 × 0.40 = **₱800,000** ✓; NTI = **₱1,200,000** ✓
- Path B IT = 102,500 + (1,200,000 − 800,000) × 0.25 = 102,500 + 100,000 = **₱202,500** ✓
- Path A NTI = 5,000,000 − 3,000,000 − 200,000 = **₱1,800,000** ✓; IT = 102,500 + (1,800,000−800,000)×0.25 = 102,500+250,000 = **₱352,500** ✓
- PT = ₱0 for both (VAT-registered) ✓
- PATH_C ineligible (VAT registered) ✓; form = FORM_1701 ✓
- PATH_B wins: 202,500 < 352,500 ✓

**Legal basis:** NIRC Sec. 108–115 (VAT). NIRC Sec. 24(A)(2)(b) — 8% option not available when VAT-registered. NIRC Sec. 34(L) (OSD on gross income). VAT-exclusive reporting: RR 16-2005.

---

## TV-EX-G9-011: SC-B-VH-I-VAT — VAT-Registered Importer, Over ₱3M, Itemized Wins

**Scenario code:** SC-B-VH-I-VAT
**Description:** VAT-registered importer (high-end furniture) with ₱4,000,000 VAT-exclusive gross sales and ₱3,000,000 COGS (75% ratio). Operating expenses ₱600,000 (customs, warehouse, logistics) exceed 40% of gross income (40% × ₱1,000,000 = ₱400,000 < ₱600,000) — itemized wins. Path A NTI = ₱400,000 → IT ₱22,500. Path B NTI = ₱600,000 → IT ₱62,500. Itemized saves ₱40,000. Path C not available (VAT registered). No PT for either path.

### Input (fields differing from Group 9 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱4,000,000.00 | VAT-exclusive gross sales |
| `cost_of_goods_sold` | ₱3,000,000.00 | Import cost of furniture (75% COGS ratio) |
| `itemized_expenses.transportation` | ₱200,000.00 | Customs brokerage, freight, inland transport |
| `itemized_expenses.rent` | ₱180,000.00 | Showroom + warehouse rental ₱15,000/month × 12 |
| `itemized_expenses.utilities` | ₱60,000.00 | Electricity for showroom/warehouse |
| `itemized_expenses.salaries` | ₱120,000.00 | Part-time sales assistant ₱10,000/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱40,000.00 | Business permit, BIR fees, import duties (non-VAT) |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | **true** | |
| `taxpayer_tier` (derived) | SMALL | |

**Total operating expenses (excluding COGS):** ₱600,000.00
**Total itemized (COGS + OE):** ₱3,600,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱4,000,000.00; gross_income = ₱4,000,000 − ₱3,000,000 = **₱1,000,000.00**; taxpayer_class = TRADER; taxpayer_tier = SMALL

**PL-04:** path_c_eligible = **false**; ineligibility_reasons = [INELIG_VAT_REGISTERED]

**PL-05:** COGS = ₱3,000,000.00; operating expenses = ₱600,000.00; EAR cap = 0.5% × ₱4,000,000 = ₱20,000.00; NOLCO = ₱0.00

**Itemized vs OSD check:** 0.40 × GI = 0.40 × ₱1,000,000 = ₱400,000; OE = ₱600,000 > ₱400,000 → **itemized beats OSD**

**PL-06 (OSD):** osd_base = ₱1,000,000.00; osd_amount = ₱1,000,000 × 0.40 = **₱400,000.00**; nti_path_b = ₱1,000,000 − ₱400,000 = **₱600,000.00**

**PL-08 (Path A):** nti_path_a = ₱4,000,000 − ₱3,000,000 − ₱600,000 = **₱400,000.00**; income_tax = (400,000 − 250,000) × 0.15 = **₱22,500.00** (bracket 2, exactly ₱400K uses bracket 2 since condition is ≤ ₱400,000); pt = **₱0.00** (VAT); total_path_a = **₱22,500.00**

**PL-09 (Path B):** nti_path_b = ₱600,000.00; income_tax = 22,500 + (600,000 − 400,000) × 0.20 = 22,500 + 40,000 = **₱62,500.00** (bracket 3); pt = **₱0.00**; total_path_b = **₱62,500.00**

**PL-10 (Path C):** eligible = false; ineligibility_reasons = [INELIG_VAT_REGISTERED]

**PL-13:** recommended_path = PATH_A; savings_vs_next_best = ₱62,500 − ₱22,500 = **₱40,000.00**; savings_vs_worst = **₱40,000.00**

**PL-14:** balance_payable = **₱22,500.00**

**PL-15:** form = FORM_1701; form_section = PART_IV (itemized, VAT-registered)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: SMALL,
  taxpayer_class: TRADER,

  gross_income: 1000000.00,
  cost_of_goods_sold: 3000000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 400000.00,
              income_tax: 22500.00, percentage_tax: 0.00, total_tax: 22500.00 },
    path_b: { eligible: true, nti: 600000.00, osd_base: 1000000.00, osd_amount: 400000.00,
              income_tax: 62500.00, percentage_tax: 0.00, total_tax: 62500.00 },
    path_c: { eligible: false, tax_base: null, income_tax: null,
              percentage_tax: null, total_tax: null,
              ineligibility_reasons: [INELIG_VAT_REGISTERED] },
    recommended_path: PATH_A,
    savings_vs_next_best: 40000.00,
    savings_vs_worst: 40000.00
  },

  selected_path: PATH_A,
  income_tax_due: 22500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 22500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 22500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: [IN_VAT_REGISTERED_NO_PATH_C]
}
```

### Verification

- gross_income = 4,000,000 − 3,000,000 = **₱1,000,000** ✓
- OE = 600,000 > 0.40 × 1,000,000 = 400,000 → itemized beats OSD ✓
- Path A NTI = 4,000,000 − 3,000,000 − 600,000 = **₱400,000** ✓; bracket 2: (400,000−250,000)×0.15 = **₱22,500** ✓
- Path B OSD = 1,000,000 × 0.40 = **₱400,000** ✓; NTI = **₱600,000** ✓; IT = 22,500 + (600,000−400,000)×0.20 = 22,500 + 40,000 = **₱62,500** ✓
- PT = ₱0 for both paths (VAT-registered) ✓
- PATH_A wins: 22,500 < 62,500 ✓

**Legal basis:** NIRC Sec. 34(A)–(K) (itemized). NIRC Sec. 34(L) (OSD on gross income). VAT: NIRC Sec. 105. 8% ineligible when VAT-registered: NIRC Sec. 24(A)(2)(b) (gross receipts must not exceed ₱3M).

---

## GROUP 9 SUMMARY TABLE

| Vector | Scenario | Gross Sales | COGS Ratio | Winner | Total Tax | Key Insight |
|--------|---------|-------------|-----------|--------|-----------|-------------|
| TV-EX-G9-001 | SC-B-ML-8 | ₱700,000 | 7.1% | Path C | ₱36,000 | Low COGS digital goods → 8% wins like service |
| TV-EX-G9-002 | SC-B-ML-O | ₱800,000 | 50% | Path B | ₱24,000 | 50% COGS → OSD eliminates IT (NTI < ₱250K) |
| TV-EX-G9-003 | SC-B-ML-I | ₱800,000 | 75% | Path B (tie) | ₱24,000 | Very high COGS → B and A tied; Path B wins by rule |
| TV-EX-G9-004 | SC-B-MH-8 | ₱1,500,000 | 13.3% | Path C | ₱100,000 | Low COGS e-commerce → 8% saves ₱43,500 vs OSD |
| TV-EX-G9-005 | SC-B-MH-O | ₱1,500,000 | 50% | Path B | ₱77,500 | 50% COGS → OSD saves ₱22,500 vs 8% |
| TV-EX-G9-006 | SC-B-MH-I | ₱1,500,000 | 70% | Path A | ₱45,000 | OE > 40% × GI → itemized beats OSD by ₱3,000 |
| TV-EX-G9-007 | SC-B-H-8 | ₱2,500,000 | 8% | Path C | ₱180,000 | Very low COGS → 8% saves ₱142,500 vs OSD |
| TV-EX-G9-008 | SC-B-H-O | ₱2,500,000 | 55% | Path B | ₱152,500 | 55% COGS → OSD saves ₱27,500 vs 8% |
| TV-EX-G9-009 | SC-B-H-I | ₱2,500,000 | 80% | Path A | ₱75,000 | 80% COGS, high OE → itemized saves ₱7,500 vs OSD |
| TV-EX-G9-010 | SC-B-VH-O-VAT | ₱5,000,000 | 60% | Path B | ₱202,500 | VAT: no 8%; OSD saves ₱150,000 vs itemized |
| TV-EX-G9-011 | SC-B-VH-I-VAT | ₱4,000,000 | 75% | Path A | ₱22,500 | VAT: no 8%; itemized saves ₱40,000 vs OSD |

**Key insights for Group 9:**

1. **COGS ratio determines the 8% vs OSD winner for traders.** Low COGS (< ~25–30%) → 8% wins because gross_income ≈ gross_sales, so OSD and 8% give similar NTIs but 8% also eliminates PT. High COGS (> ~30%) → OSD or itemized wins because OSD is applied to the much-smaller gross_income, yielding significantly lower NTI than 8%'s gross_sales base.

2. **The critical TRADER OSD computation.** For SERVICE_PROVIDER: OSD = 40% × gross_receipts. For TRADER: OSD = 40% × (gross_sales − COGS) = 40% × gross_income. This single difference is the most common miscomputation in Philippine tax. The engine must distinguish `taxpayer_class = TRADER` (cost_of_goods_sold > 0) from SERVICE_PROVIDER and apply the correct OSD base.

3. **Itemized beats OSD for traders when OE > 40% × gross_income.** This threshold is lower than most practitioners expect. For a 70% COGS retailer with ₱1.5M sales (GI = ₱450K), even ₱180,001 in operating expenses would mean itemized beats OSD. High-COGS traders with significant warehouse, logistics, or sales expenses often benefit from itemized.

4. **Path C (8%) ignores COGS completely.** Tax base = gross_sales − ₱250,000. This is extremely expensive for traders with 50%+ COGS because it effectively taxes both cost of goods AND profit at 8%. A retailer with ₱1.5M gross, ₱750K COGS, electing 8% pays tax on ₱1.25M instead of the ₱750K gross income. This is the core education gap for trading taxpayers.

5. **VAT-registered traders: only Path A vs Path B.** When gross sales exceed ₱3M, VAT registration is mandatory. The 8% option disappears. The Path A vs Path B comparison for VAT-registered traders uses VAT-exclusive amounts for all income and COGS figures. No PT applies (VAT replaces it).

6. **Tie-breaking (TV-EX-G9-003) uses rule PATH_B > PATH_A.** When Path A and Path B produce equal total tax (both NTIs fall below ₱250K → same IT = ₱0 → same PT), the engine recommends PATH_B because OSD requires no documentation burden, unlike itemized which requires substantiated receipts. The UI should label this: "Both paths give the same tax — OSD recommended (no receipts needed)."

---

## GROUP 10: Combined Service + Trading Taxpayers (SC-COMBO)

**3 scenario codes:** SC-COMBO-ML-8, SC-COMBO-MH-O, SC-COMBO-CROSS-3M

**What distinguishes Group 10 from Groups 1 and 9:**

A COMBO taxpayer earns both service/professional income AND goods/trading income under the same TIN. The engine receives a single combined `gross_receipts` figure (service + goods) and the total `cost_of_goods_sold` for the goods portion. Because `cost_of_goods_sold > 0`, the engine sets `taxpayer_class = TRADER`, and the OSD base becomes:

```
osd_base = gross_income = gross_receipts − cost_of_goods_sold
```

For Path C (8%), COGS does NOT reduce the tax base:
```
path_c_base = net_gross_receipts − 250_000
```

This creates a key tension: high-COGS goods trading makes the 8% option increasingly expensive (because 8% is charged on gross sales before COGS), while OSD and itemized both deduct COGS from the base. Conversely, when the COMBO taxpayer's goods component is small or low-COGS, the combined gross behaves more like a pure service business and 8% remains optimal.

**OSD base comparison for combined taxpayers:**

| Taxpayer Type | OSD Base | Formula |
|--------------|----------|---------|
| Pure SERVICE_PROVIDER | gross_receipts | osd = 0.40 × gross_receipts |
| Pure TRADER | gross_income = gross_sales − COGS | osd = 0.40 × (gross_sales − COGS) |
| COMBO (service + goods) | gross_income = (service_gross + goods_gross) − COGS | osd = 0.40 × (combined_gross − COGS) |

**When 8% beats OSD for a COMBO taxpayer:**

Path C total = (combined_gross − ₱250,000) × 0.08
Path B total = graduated(0.60 × gross_income) + 0.03 × combined_gross

8% wins when Path C total < Path B total. As COGS rises, gross_income falls, OSD NTI falls, Path B total falls — eventually passing below Path C. The crossover COGS ratio depends on income level, but roughly:

- Combined gross < ₱1,000,000: 8% wins unless goods-COGS ratio on combined gross exceeds ~30–40%
- Combined gross ₱1,000,000–₱2,000,000: 8% wins unless goods-COGS ratio exceeds ~25–35%
- When goods revenue dominates combined gross AND COGS ratio is high (60%+), OSD consistently wins

**Common characteristics for all Group 10 vectors:**

- `taxpayer_type`: PURELY_SE
- `is_mixed_income`: false
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `taxable_compensation`: ₱0.00
- `compensation_cwt`: ₱0.00
- `taxpayer_class` (derived): **TRADER** (because `cost_of_goods_sold > 0`)
- `income_type` (derived): PURELY_SE
- `sales_returns_allowances`: ₱0.00
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `prior_quarterly_payments`: []
- `cwt_2307_entries`: []
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `return_type`: ORIGINAL
- `prior_payment_for_return`: ₱0.00
- `elected_regime`: null (optimizer mode)
- `filing_period`: ANNUAL
- `tax_year`: 2025

---

## TV-EX-G10-001: SC-COMBO-ML-8 — Designer + Digital Product Seller, Low COGS, 8% Optimal

**Scenario code:** SC-COMBO-ML-8
**Description:** Freelance graphic designer who earns ₱400,000 from design services AND ₱300,000 from selling digital templates/assets online. COGS (stock photo licenses, asset packs) = ₱30,000 (4.3% of combined gross). Operating expenses = ₱50,000 (software subscriptions, internet, business permit). Combined gross = ₱700,000 ≤ ₱3M → 8% eligible. Because the goods COGS is minimal (digital products have near-zero reproduction cost), gross_income (₱670,000) is close to combined gross, and the TRADER-adjusted OSD base is only slightly smaller than the service-provider OSD base. Path C (8% on combined gross) produces the lowest total tax at ₱36,000, eliminating the ₱21,000 PT component that Path B carries.

### Input (fields differing from Group 10 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱700,000.00 | ₱400,000 design service fees + ₱300,000 digital template sales (combined total) |
| `cost_of_goods_sold` | ₱30,000.00 | Stock photo licenses, vector asset packs, template source files |
| `itemized_expenses.advertising` | ₱15,000.00 | Marketplace listing promotions, social media ads |
| `itemized_expenses.communication` | ₱12,000.00 | Internet subscription ₱1,000/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | BIR registration (₱500), annual business permit (₱8,000), documentary stamp (₱1,500) |
| `itemized_expenses.supplies` | ₱8,000.00 | Adobe Creative Cloud subscription ₱3,500 + design tools ₱4,500 |
| `itemized_expenses.other_deductible` | ₱5,000.00 | Bank charges, miscellaneous office expenses |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | Combined gross ₱700,000 < ₱3,000,000 |
| `taxpayer_tier` (derived) | MICRO | Annual gross receipts < ₱3,000,000 |

**Total operating expenses (excluding COGS):** ₱50,000.00
**Total itemized (COGS + OE):** ₱80,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱700,000.00; gross_income = ₱700,000 − ₱30,000 = **₱670,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = **true**; combined gross ₱700,000 ≤ ₱3,000,000; not VAT registered; not GPP; not Sec. 117-128

**PL-05:** COGS = ₱30,000.00; operating_expenses = ₱50,000.00; EAR cap = 0.5% × ₱700,000 = **₱3,500.00** (TRADER cap: 0.5% of net sales); no entertainment expenses → no EAR warning; total_deductible_path_a = ₱30,000 + ₱50,000 = ₱80,000.00

**Itemized vs OSD check:** 0.40 × gross_income = 0.40 × ₱670,000 = ₱268,000; OE = ₱50,000 < ₱268,000 → **OSD beats itemized**; itemized still computed for comparison

**PL-06 (OSD):** osd_base = ₱670,000.00 (TRADER: gross_income); osd_amount = ₱670,000 × 0.40 = **₱268,000.00**; nti_path_b = ₱670,000 − ₱268,000 = **₱402,000.00**

**PL-08 (Path A):** nti_path_a = ₱670,000 − ₱50,000 = **₱620,000.00**; income_tax (bracket 3: ₱400K–₱800K) = ₱22,500 + (₱620,000 − ₱400,000) × 0.20 = ₱22,500 + ₱44,000 = **₱66,500.00**; pt = 3% × ₱700,000 = **₱21,000.00**; total_path_a = **₱87,500.00**

**PL-09 (Path B):** nti_path_b = ₱402,000.00; income_tax (bracket 2: ₱250K–₱400K) = (₱402,000 − ₱250,000) × 0.15 = **₱22,800.00**; pt = 3% × ₱700,000 = **₱21,000.00**; total_path_b = **₱43,800.00**

**PL-10 (Path C):** tax_base = ₱700,000 − ₱250,000 = **₱450,000.00**; income_tax = ₱450,000 × 0.08 = **₱36,000.00**; pt = **₱0.00** (8% waives OPT); total_path_c = **₱36,000.00**

**PL-13:** recommended_path = **PATH_C**; savings_vs_next_best = ₱43,800 − ₱36,000 = **₱7,800.00**; savings_vs_worst = ₱87,500 − ₱36,000 = **₱51,500.00**

**PL-14:** balance_payable = **₱36,000.00** (no CWT, no prior quarterly payments)

**PL-15:** form = FORM_1701A; form_section = PART_IV_B (8% flat rate section)

**PL-16:** total_penalties = ₱0.00 (on-time filing assumed)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 670000.00,
  cost_of_goods_sold: 30000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 620000.00,
              income_tax: 66500.00, percentage_tax: 21000.00, total_tax: 87500.00 },
    path_b: { eligible: true, nti: 402000.00, osd_base: 670000.00, osd_amount: 268000.00,
              income_tax: 22800.00, percentage_tax: 21000.00, total_tax: 43800.00 },
    path_c: { eligible: true, tax_base: 450000.00,
              income_tax: 36000.00, percentage_tax: 0.00, total_tax: 36000.00,
              ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 7800.00,
    savings_vs_worst: 51500.00
  },

  selected_path: PATH_C,
  income_tax_due: 36000.00,
  percentage_tax_due: 0.00,
  total_tax_due: 36000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 36000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

### Verification

- gross_income = 700,000 − 30,000 = **₱670,000** ✓
- taxpayer_class = TRADER because cost_of_goods_sold = ₱30,000 > ₱0 ✓
- OSD base = gross_income (TRADER rule) = ₱670,000 ✓ (not gross_receipts ₱700,000)
- Path B OSD = 670,000 × 0.40 = **₱268,000** ✓; NTI = **₱402,000** ✓
- Path B IT: (402,000 − 250,000) × 0.15 = 152,000 × 0.15 = **₱22,800** ✓ (bracket 2)
- Path B PT = 3% × 700,000 = **₱21,000** ✓; total B = 22,800 + 21,000 = **₱43,800** ✓
- Path C base = 700,000 − 250,000 = **₱450,000** ✓ (COGS NOT deducted from 8% base)
- Path C IT = 450,000 × 0.08 = **₱36,000** ✓; PT = ₱0 ✓; total C = **₱36,000** ✓
- PATH_C < PATH_B < PATH_A: 36,000 < 43,800 < 87,500 ✓
- PT for Path B/A = 3% × combined_gross ₱700,000 = **₱21,000** ✓ (PT base uses gross receipts/sales, not gross_income)
- No ₱250K deduction on 8% base for pure SE (purely_se taxpayer, no compensation) ✓

**Key insight:** Even though the OSD base is reduced by COGS (₱670K instead of ₱700K), the 8% option eliminates PT entirely, saving ₱21,000 vs Path B. Combined with the lower IT under 8% (₱36,000 vs ₱22,800), Path C still wins by ₱7,800. Low-COGS COMBO taxpayers behave like pure service providers.

**Legal basis:** NIRC Sec. 24(A)(2)(b) — 8% option, ₱250K reduction for PURELY_SE. NIRC Sec. 34(L) — OSD 40% of gross receipts/gross income. CR-003 (Path C), CR-006 (Path B TRADER), CR-032 (PT on gross). TaxpayerClass = TRADER when cost_of_goods_sold > 0 (CR-015).

---

## TV-EX-G10-002: SC-COMBO-MH-O — IT Consultant + Electronics Seller, High COGS, OSD Optimal

**Scenario code:** SC-COMBO-MH-O
**Description:** IT consultant earning ₱400,000 in professional fees who also sells electronics hardware accessories (bulk import + resell) generating ₱1,100,000 in gross sales. COGS = ₱700,000 (63.6% of goods sales; electronics/hardware has high import costs). Combined gross = ₱1,500,000. Operating expenses = ₱100,000. Although the 8% option is available (combined ₱1.5M < ₱3M), the dominant high-COGS goods component makes OSD the winner: OSD is applied to gross_income (₱800,000 after subtracting COGS), producing NTI ₱480,000 and total tax ₱83,500 — compared to 8% on combined gross producing ₱100,000. OSD saves ₱16,500 vs 8%.

**Note on scenarios.md correction:** The original scenario description in scenarios.md described SC-COMBO-MH-O with service ₱1M + goods ₱500K at COGS ₱250K (50% goods COGS ratio). Under that input set, mathematical analysis shows PATH_C (8%) actually wins (₱100,000 vs Path B ₱137,500), contradicting the "O" (OSD) suffix. The present test vector redesigns the input to use a goods-dominant COMBO profile (₱400K service + ₱1.1M goods at 63.6% COGS ratio) so that OSD correctly wins, consistent with the SC-COMBO-MH-O scenario intent.

### Input (fields differing from Group 10 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱1,500,000.00 | ₱400,000 IT consulting fees + ₱1,100,000 electronics hardware sales |
| `cost_of_goods_sold` | ₱700,000.00 | Import cost of electronics accessories (63.6% of goods sales; 46.7% of combined gross) |
| `itemized_expenses.salaries` | ₱48,000.00 | Part-time delivery staff ₱4,000/month × 12 |
| `itemized_expenses.rent` | ₱24,000.00 | Small bodega/storage unit ₱2,000/month × 12 |
| `itemized_expenses.transportation` | ₱18,000.00 | Delivery costs, freight to clients |
| `itemized_expenses.taxes_and_licenses` | ₱10,000.00 | BIR registration, business permit, import documentation |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | false | Combined gross ₱1,500,000 < ₱3,000,000 |
| `taxpayer_tier` (derived) | MICRO | Annual gross receipts < ₱3,000,000 |

**Total operating expenses (excluding COGS):** ₱100,000.00
**Total itemized (COGS + OE):** ₱800,000.00

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱1,500,000.00; gross_income = ₱1,500,000 − ₱700,000 = **₱800,000.00**; taxpayer_class = TRADER; taxpayer_tier = MICRO

**PL-04:** path_c_eligible = **true**; combined gross ₱1,500,000 ≤ ₱3,000,000; not VAT registered; not GPP; not Sec. 117-128

**PL-05:** COGS = ₱700,000.00; operating_expenses = ₱100,000.00; EAR cap = 0.5% × ₱1,500,000 = **₱7,500.00** (TRADER: 0.5% of net sales); no entertainment expenses → no EAR warning; total_deductible_path_a = ₱700,000 + ₱100,000 = ₱800,000.00

**Itemized vs OSD check:** 0.40 × gross_income = 0.40 × ₱800,000 = ₱320,000; OE = ₱100,000 < ₱320,000 → **OSD beats itemized for Path A vs Path B comparison**

**PL-06 (OSD):** osd_base = ₱800,000.00 (TRADER: gross_income after COGS); osd_amount = ₱800,000 × 0.40 = **₱320,000.00**; nti_path_b = ₱800,000 − ₱320,000 = **₱480,000.00**

**PL-08 (Path A):** nti_path_a = ₱800,000 − ₱100,000 = **₱700,000.00**; income_tax (bracket 3: ₱400K–₱800K) = ₱22,500 + (₱700,000 − ₱400,000) × 0.20 = ₱22,500 + ₱60,000 = **₱82,500.00**; pt = 3% × ₱1,500,000 = **₱45,000.00**; total_path_a = **₱127,500.00**

**PL-09 (Path B):** nti_path_b = ₱480,000.00; income_tax (bracket 3: ₱400K–₱800K) = ₱22,500 + (₱480,000 − ₱400,000) × 0.20 = ₱22,500 + ₱16,000 = **₱38,500.00**; pt = 3% × ₱1,500,000 = **₱45,000.00**; total_path_b = **₱83,500.00**

**PL-10 (Path C):** tax_base = ₱1,500,000 − ₱250,000 = **₱1,250,000.00**; income_tax = ₱1,250,000 × 0.08 = **₱100,000.00**; pt = **₱0.00**; total_path_c = **₱100,000.00**

**PL-13:** recommended_path = **PATH_B**; savings_vs_next_best = ₱100,000 − ₱83,500 = **₱16,500.00**; savings_vs_worst = ₱127,500 − ₱83,500 = **₱44,000.00**

**PL-14:** balance_payable = **₱83,500.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (graduated + OSD section)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: MICRO,
  taxpayer_class: TRADER,

  gross_income: 800000.00,
  cost_of_goods_sold: 700000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 700000.00,
              income_tax: 82500.00, percentage_tax: 45000.00, total_tax: 127500.00 },
    path_b: { eligible: true, nti: 480000.00, osd_base: 800000.00, osd_amount: 320000.00,
              income_tax: 38500.00, percentage_tax: 45000.00, total_tax: 83500.00 },
    path_c: { eligible: true, tax_base: 1250000.00,
              income_tax: 100000.00, percentage_tax: 0.00, total_tax: 100000.00,
              ineligibility_reasons: [] },
    recommended_path: PATH_B,
    savings_vs_next_best: 16500.00,
    savings_vs_worst: 44000.00
  },

  selected_path: PATH_B,
  income_tax_due: 38500.00,
  percentage_tax_due: 45000.00,
  total_tax_due: 83500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 83500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

### Verification

- gross_income = 1,500,000 − 700,000 = **₱800,000** ✓
- OSD base = gross_income (TRADER) = **₱800,000** ✓ (not combined gross ₱1,500,000)
- Path B OSD = 800,000 × 0.40 = **₱320,000** ✓; NTI = 800,000 − 320,000 = **₱480,000** ✓
- Path B IT: bracket 3 — ₱22,500 + (480,000 − 400,000) × 0.20 = 22,500 + 16,000 = **₱38,500** ✓
- Path B PT = 3% × 1,500,000 = **₱45,000** ✓; total B = 38,500 + 45,000 = **₱83,500** ✓
- Path C base = 1,500,000 − 250,000 = **₱1,250,000** ✓ (8% ignores COGS)
- Path C IT = 1,250,000 × 0.08 = **₱100,000** ✓; PT = ₱0 ✓; total C = **₱100,000** ✓
- Path A NTI = 800,000 − 100,000 = **₱700,000** ✓; IT = 22,500 + (700,000−400,000)×0.20 = **₱82,500** ✓
- PATH_B < PATH_C < PATH_A: 83,500 < 100,000 < 127,500 ✓
- Why OSD beats 8%: 8% charges tax on ₱1,250,000 (gross minus ₱250K), while OSD charges graduated IT on only ₱480,000 (COGS of ₱700K dramatically reduces the NTI base) — the PT saved by 8% (₱45,000) does NOT compensate for the ₱61,500 higher income tax under Path C ✓
- Check: 8% IT − Path B IT = 100,000 − 83,500 = ₱16,500 (PT eliminated = ₱45,000; but 8% IT exceeds OSD IT by ₱100,000 − ₱38,500 = ₱61,500; net effect: OSD saves ₱61,500 − ₱45,000 = ₱16,500) ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b) — 8% option. NIRC Sec. 34(L) — OSD 40% of gross income (for traders: gross_income = gross_sales − COGS). NIRC Sec. 116 — PT at 3%. CR-006 (TRADER OSD base computation). CR-032 (PT quarterly/annual).

---

## TV-EX-G10-003: SC-COMBO-CROSS-3M — IT Consultant + Online Store, Combined > ₱3M, VAT-Registered, OSD Optimal

**Scenario code:** SC-COMBO-CROSS-3M
**Description:** IT consultant earning ₱2,000,000 in professional fees who also runs an online product store generating ₱1,200,000 in gross sales, with COGS of ₱400,000 (33.3% of goods sales). Combined VAT-exclusive gross = ₱3,200,000, exceeding the ₱3M threshold — 8% option is not available and VAT registration is mandatory. Operating expenses = ₱500,000 (subcontractors, staff, rent, transport, utilities). With OSD applied to combined gross_income (₱2,800,000), Path B yields NTI ₱1,680,000 → IT ₱322,500 (no PT for VAT-registered). Itemized would yield NTI ₱2,300,000 → IT ₱492,500. OSD saves ₱170,000 versus itemized. Path C is unavailable on two grounds: combined gross > ₱3M AND VAT-registered.

### Input (fields differing from Group 10 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `gross_receipts` | ₱3,200,000.00 | ₱2,000,000 IT consulting (VAT-exclusive) + ₱1,200,000 goods sales (VAT-exclusive) |
| `cost_of_goods_sold` | ₱400,000.00 | Product purchase cost (33.3% of goods sales; 12.5% of combined gross) |
| `itemized_expenses.professional_fees` | ₱120,000.00 | Subcontractors for consulting projects |
| `itemized_expenses.salaries` | ₱180,000.00 | Part-time staff ₱15,000/month × 12 |
| `itemized_expenses.rent` | ₱84,000.00 | Office + small warehouse ₱7,000/month × 12 |
| `itemized_expenses.transportation` | ₱60,000.00 | Client visits, delivery logistics ₱5,000/month × 12 |
| `itemized_expenses.utilities` | ₱36,000.00 | Electricity, internet ₱3,000/month × 12 |
| `itemized_expenses.taxes_and_licenses` | ₱20,000.00 | BIR registration, business permit renewal, import fees |
| All other itemized expense fields | ₱0.00 | |
| `is_vat_registered` | **true** | Gross > ₱3,000,000; mandatory VAT registration |
| `taxpayer_tier` (derived) | SMALL | Annual gross receipts ₱3,200,000 ≥ ₱3,000,000 |

**Total operating expenses (excluding COGS):** ₱500,000.00
**Total itemized (COGS + OE):** ₱900,000.00
**Note:** All gross and COGS figures are VAT-exclusive (12% output VAT filed separately on Form 2550Q).

### Expected Intermediate Values

**PL-02:** net_gross_receipts = ₱3,200,000.00; gross_income = ₱3,200,000 − ₱400,000 = **₱2,800,000.00**; taxpayer_class = TRADER; taxpayer_tier = SMALL

**PL-04:** path_c_eligible = **false**; ineligibility_reasons = [INELIG_GROSS_EXCEEDS_3M, INELIG_VAT_REGISTERED]

**PL-05:** COGS = ₱400,000.00; operating_expenses = ₱500,000.00; EAR cap = 0.5% × ₱3,200,000 = **₱16,000.00** (TRADER: 0.5% of net sales); no entertainment expenses → no EAR warning; total_deductible_path_a = ₱400,000 + ₱500,000 = ₱900,000.00

**Itemized vs OSD check:** 0.40 × gross_income = 0.40 × ₱2,800,000 = ₱1,120,000; OE = ₱500,000 < ₱1,120,000 → **OSD beats itemized**; itemized NTI (₱2,300,000) > OSD NTI (₱1,680,000)

**PL-06 (OSD):** osd_base = ₱2,800,000.00 (TRADER: gross_income); osd_amount = ₱2,800,000 × 0.40 = **₱1,120,000.00**; nti_path_b = ₱2,800,000 − ₱1,120,000 = **₱1,680,000.00**

**PL-08 (Path A):** nti_path_a = ₱2,800,000 − ₱500,000 = **₱2,300,000.00**; income_tax (bracket 5: ₱2M–₱8M) = ₱402,500 + (₱2,300,000 − ₱2,000,000) × 0.30 = ₱402,500 + ₱90,000 = **₱492,500.00**; pt = **₱0.00** (VAT-registered; OPT does not apply); total_path_a = **₱492,500.00**

**PL-09 (Path B):** nti_path_b = ₱1,680,000.00; income_tax (bracket 4: ₱800K–₱2M) = ₱102,500 + (₱1,680,000 − ₱800,000) × 0.25 = ₱102,500 + ₱220,000 = **₱322,500.00**; pt = **₱0.00** (VAT-registered); total_path_b = **₱322,500.00**

**PL-10 (Path C):** eligible = false; ineligibility_reasons = [INELIG_GROSS_EXCEEDS_3M, INELIG_VAT_REGISTERED]

**PL-13:** recommended_path = **PATH_B**; savings_vs_next_best = ₱492,500 − ₱322,500 = **₱170,000.00**; savings_vs_worst = **₱170,000.00** (only 2 paths eligible — worst = only other eligible path)

**PL-14:** balance_payable = **₱322,500.00**

**PL-15:** form = FORM_1701A; form_section = PART_IV_A (graduated + OSD; PURELY_SE, no breach)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: PURELY_SE,  taxpayer_tier: SMALL,
  taxpayer_class: TRADER,

  gross_income: 2800000.00,
  cost_of_goods_sold: 400000.00,

  regime_comparison: {
    path_a: { eligible: true, nti: 2300000.00,
              income_tax: 492500.00, percentage_tax: 0.00, total_tax: 492500.00 },
    path_b: { eligible: true, nti: 1680000.00, osd_base: 2800000.00, osd_amount: 1120000.00,
              income_tax: 322500.00, percentage_tax: 0.00, total_tax: 322500.00 },
    path_c: { eligible: false, tax_base: null, income_tax: null,
              percentage_tax: null, total_tax: null,
              ineligibility_reasons: [INELIG_GROSS_EXCEEDS_3M, INELIG_VAT_REGISTERED] },
    recommended_path: PATH_B,
    savings_vs_next_best: 170000.00,
    savings_vs_worst: 170000.00
  },

  selected_path: PATH_B,
  income_tax_due: 322500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 322500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 322500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701A,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [],
  manual_review_flags: [],
  ineligibility_notifications: [IN_GROSS_EXCEEDS_3M_NO_PATH_C, IN_VAT_REGISTERED_NO_PATH_C]
}
```

### Verification

- gross_income = 3,200,000 − 400,000 = **₱2,800,000** ✓
- OSD base = gross_income (TRADER) = **₱2,800,000** ✓
- OSD amount = 2,800,000 × 0.40 = **₱1,120,000** ✓; NTI = **₱1,680,000** ✓
- Path B IT: bracket 4 (₱800K–₱2M) — ₱102,500 + (1,680,000 − 800,000) × 0.25 = 102,500 + 220,000 = **₱322,500** ✓
- Path B PT = ₱0 (VAT-registered; OPT replaced by VAT) ✓; total B = **₱322,500** ✓
- Path A NTI = 2,800,000 − 500,000 = **₱2,300,000** ✓; bracket 5: 402,500 + (2,300,000−2,000,000)×0.30 = 402,500 + 90,000 = **₱492,500** ✓
- Path C ineligible: gross ₱3.2M > ₱3M (INELIG_GROSS_EXCEEDS_3M) AND VAT-registered (INELIG_VAT_REGISTERED) ✓
- OSD beats itemized: OE (₱500,000) < 40% × gross_income (₱1,120,000) → OSD wins ✓
- savings_vs_next_best = 492,500 − 322,500 = **₱170,000** ✓
- scenarios.md cited Path B NTI ₱1,680,000 and IT ₱307,500 — correct NTI is confirmed ₱1,680,000 but correct IT is ₱322,500 (bracket 4: 102,500 + 880,000 × 0.25 = 322,500); scenarios.md arithmetic for IT was incorrect (likely used ₱25% on excess from ₱600K rather than ₱800K) ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b) — 8% ineligible when gross exceeds ₱3M or VAT-registered. NIRC Sec. 34(L) — OSD 40% of gross income (TRADER). NIRC Sec. 105 — VAT registration mandatory above ₱3M. NIRC Sec. 116 — OPT does not apply when VAT-registered. Graduated rates (2023+): NIRC Sec. 24(A)(1), CR-002. Form 1701A for PURELY_SE + OSD: BIR Form 1701A instructions; DT-04 branch: PURELY_SE + no breach + PATH_B → FORM_1701A.

---

## GROUP 10 SUMMARY TABLE

| Vector | Scenario | Combined Gross | COGS (combined %) | Winner | IT Due | PT Due | Total Tax | Key Insight |
|--------|---------|---------------|-------------------|--------|--------|--------|-----------|-------------|
| TV-EX-G10-001 | SC-COMBO-ML-8 | ₱700,000 | ₱30,000 (4.3%) | Path C (8%) | ₱36,000 | ₱0 | ₱36,000 | Low-COGS digital goods: 8% wins like pure service |
| TV-EX-G10-002 | SC-COMBO-MH-O | ₱1,500,000 | ₱700,000 (46.7%) | Path B (OSD) | ₱38,500 | ₱45,000 | ₱83,500 | Goods-dominant high-COGS: OSD saves ₱16,500 vs 8% |
| TV-EX-G10-003 | SC-COMBO-CROSS-3M | ₱3,200,000 | ₱400,000 (12.5%) | Path B (OSD) | ₱322,500 | ₱0 | ₱322,500 | >₱3M VAT: only Path A vs B; OSD saves ₱170,000 |

**Key insights for Group 10:**

1. **The COGS ratio on the COMBINED gross determines the winner.** A COMBO taxpayer with tiny goods COGS behaves like a pure service provider — 8% wins (TV-EX-G10-001, 4.3% combined COGS). A COMBO taxpayer whose goods are high-COGS AND goods revenue dominates the combined total will find OSD winning because the COGS dramatically shrinks the OSD base below the 8% base (TV-EX-G10-002, 46.7% combined COGS).

2. **The critical asymmetry: OSD deducts COGS, 8% does not.** Under Path B (OSD), osd_base = gross_income = gross_receipts − COGS. Under Path C (8%), tax_base = gross_receipts − ₱250,000 (COGS not deducted). As COGS rises, Path B's NTI falls rapidly while Path C's base stays high — reversing the typical "8% wins" pattern.

3. **Combined COGS-to-gross crossover is roughly 30–50% depending on income level.** For TV-EX-G10-002 at ₱1.5M combined gross, the crossover occurs near 30–35% combined COGS ratio. Below that crossover, 8% wins; above it, OSD wins. The PT savings of ₱45,000 under 8% require the combined COGS to raise OSD NTI high enough that the lower IT under OSD overcomes the lost PT waiver.

4. **Exceeding ₱3M eliminates both issues simultaneously.** Once combined gross exceeds ₱3M, 8% is unavailable AND VAT replaces PT. The comparison reduces to Path A vs Path B (TV-EX-G10-003). The breakeven is always 40% of gross_income: OE > 40% × gross_income → itemized wins; OE ≤ 40% → OSD wins.

5. **Form 1701A applies even to VAT-registered PURELY_SE taxpayers.** For income tax filing purposes, VAT-registered PURELY_SE taxpayers using OSD file Form 1701A (Part IV-A). VAT is a separate filing (Form 2550Q/2550M). DT-04: no mixed income, no mid-year breach, Path B → FORM_1701A.

6. **Scenarios.md correction acknowledged.** Two arithmetic errors were found in scenarios.md's SC-COMBO descriptions: (a) SC-COMBO-MH-O used ₱1M service + ₱500K goods at 50% goods COGS, which actually makes PATH_C win — the inputs were redesigned to make OSD win, consistent with the "O" suffix intent; (b) SC-COMBO-CROSS-3M cited IT ₱307,500 at NTI ₱1,680,000, but correct bracket-4 computation yields ₱322,500. Both corrections are applied in these test vectors.


---

## GROUP 11: Additional Mixed Income Sub-Scenarios (Extending Group 3)

**10 scenario codes:** SC-M-L-O, SC-M-L-I, SC-M-MH-O, SC-M-MH-I, SC-M-H-8, SC-M-H-O, SC-M-H-I, SC-M-MINWAGE, SC-M-GOVT, SC-M-DUAL-EMP

**Cross-reference note:**
- **SC-M-MINWAGE** is fully specified in [edge-cases.md](edge-cases.md) as **TV-EDGE-007** (minimum wage employee + business; OSD beats 8% because ₱250K deduction barred, taxable_comp ₱0, business NTI small enough OSD wins).
- This section provides the 9 remaining vectors.

**Common characteristics for all Group 11 vectors (unless stated otherwise):**
- `taxpayer_type`: MIXED_INCOME
- `is_mixed_income`: true
- `is_vat_registered`: false (all business gross < ₱3,000,000)
- `is_bmbe_registered`: false
- `subject_to_sec_117_128`: false
- `is_gpp_partner`: false
- `cost_of_goods_sold`: ₱0.00 (all are service/professional income)
- `taxpayer_class` (derived): SERVICE_PROVIDER
- `income_type` (derived): MIXED_INCOME
- `form` (always): FORM_1701 (mixed income earners ALWAYS use Form 1701; Form 1701A prohibited per MIR-01)
- `non_operating_income`: ₱0.00
- `fwt_income`: ₱0.00
- `sales_returns_allowances`: ₱0.00
- `return_type`: ORIGINAL
- `prior_year_excess_cwt`: ₱0.00
- `actual_filing_date`: null (on-time assumed)
- `filing_period`: ANNUAL
- `tax_year`: 2025
- `cwt_2307_entries`: [] (no business CWT unless otherwise specified)
- `prior_quarterly_payments`: [] (no prior quarterly business payments unless specified)
- `prior_payment_for_return`: ₱0.00
- `elected_regime`: null (optimizer mode — engine recommends)
- `path_c_eligible` (derived): true (all business gross ≤ ₱3M and not VAT-registered)
- `taxpayer_tier` (derived): MICRO (all business gross < ₱3,000,000)

**Critical mixed income rules applied in all Group 11 vectors:**

| Rule | Description | Legal Basis |
|------|-------------|-------------|
| MIR-01 | Always use Form 1701; Form 1701A is prohibited | BIR Form 1701 Instructions; RMC 50-2018 |
| MIR-03 | NO ₱250,000 deduction on 8% business income; tax base = full gross receipts | RMC 50-2018 Sec. 3; RMC 23-2018 |
| MIR-04 | Paths A and B combine compensation NTI + business NTI before graduated table | NIRC Sec. 24(A)(2)(a) |
| MIR-07 | Path C applies 8% to business income only; compensation always at graduated rates | NIRC Sec. 24(A)(2)(b); RMC 50-2018 |
| MIR-08 | ₱3M threshold uses business gross only; compensation income excluded | NIRC Sec. 24(A)(2)(b) |

---

## TV-EX-G11-001: SC-M-L-O — Low-Compensation Employee + Small Freelance, OSD Optimal

**Scenario code:** SC-M-L-O
**Description:** Part-time customer service agent earning ₱200,000 annual taxable compensation (below ₱250K zero-bracket; employer withholds ₱0) who earns ₱160,000 in freelance graphic design. No documented business expenses. Path B (OSD) beats Path C (8%) because: the ₱250K deduction prohibition inflates Path C business IT to ₱12,800 (= ₱160,000 × 0.08), while OSD reduces combined NTI to ₱296,000 — only ₱46,000 above the ₱250K floor — yielding IT of ₱6,900 plus PT ₱4,800 = ₱11,700 total, saving ₱1,100 vs Path C. This narrow OSD-wins window exists only when compensation is below ₱250K and business gross is small enough that OSD NTI + compensation stays near the zero-bracket boundary.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱200,000.00 | Part-time job: ₱240K gross salary − ₱40K mandatory deductions (SSS ₱24K + PhilHealth ₱9K + Pag-IBIG ₱1.2K + 13th month exempt ₱20K) ≈ ₱200K taxable |
| `compensation_cwt` (tax_withheld_by_employer) | ₱0.00 | Compensation below ₱250K zero bracket; employer correctly withheld ₱0 |
| `gross_receipts` | ₱160,000.00 | Freelance graphic design projects (logo work, social media graphics) |
| All itemized expense fields | ₱0.00 each | No receipts kept for business expenses |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-02 (Classification):**
- `net_gross_receipts` = ₱160,000.00 (business gross; compensation excluded from ₱3M threshold)
- `taxpayer_tier` = MICRO (₱160,000 < ₱3,000,000)
- `income_type` = MIXED_INCOME
- `taxpayer_class` = SERVICE_PROVIDER

**PL-04 (Eligibility):**
- `path_c_eligible` = true (business gross ₱160K ≤ ₱3M AND not VAT-registered)
- `ineligibility_reasons` = []

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱0.00
- `ear_cap` = ₱160,000 × 0.01 = ₱1,600.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱160,000 × 0.40 = ₱64,000.00
- `business_nti_path_b` = ₱160,000 − ₱64,000 = ₱96,000.00

**PL-07 (CWT):** `total_cwt_business` = ₱0.00

**PL-08 (Path A — Mixed Income, Itemized = ₱0):**
- `business_nti_path_a` = ₱160,000.00 (no deductions)
- `combined_nti_path_a` = ₱200,000 (comp) + ₱160,000 (biz) = ₱360,000.00
- `income_tax_path_a` = graduated_tax_2023(₱360,000)
  = (₱360,000 − ₱250,000) × 0.15
  = **₱16,500.00** (bracket 2)
- `percentage_tax_path_a` = ₱160,000 × 0.03 = **₱4,800.00**
- `total_tax_path_a` = **₱21,300.00**

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱96,000.00
- `combined_nti_path_b` = ₱200,000 (comp) + ₱96,000 (biz) = ₱296,000.00
- `income_tax_path_b` = graduated_tax_2023(₱296,000)
  = (₱296,000 − ₱250,000) × 0.15
  = **₱6,900.00** (bracket 2)
- `percentage_tax_path_b` = ₱160,000 × 0.03 = **₱4,800.00**
- `total_tax_path_b` = **₱11,700.00**

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱200,000) = **₱0.00** (below ₱250K zero bracket)
- `income_tax_business_path_c` = ₱160,000 × 0.08 = **₱12,800.00** (NO ₱250K deduction per RMC 50-2018)
- `percentage_tax_path_c` = **₱0.00** (PT waived under 8%)
- `total_tax_path_c` = ₱0 + ₱12,800 = **₱12,800.00**

**PL-13 (Compare):**
- Path A: ₱21,300.00
- Path B: ₱11,700.00 ← MINIMUM
- Path C: ₱12,800.00
- `recommended_path` = PATH_B (₱11,700 < ₱12,800; tie-break not triggered)
- `savings_vs_next_best` = ₱12,800 − ₱11,700 = **₱1,100.00** (Path B vs Path C)
- `savings_vs_worst` = ₱21,300 − ₱11,700 = **₱9,600.00** (Path B vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱11,700.00
- `percentage_tax_due` = ₱4,800.00
- `compensation_tax_withheld` = ₱0.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱11,700.00 (income tax, to be paid at annual filing)
- Note: PT ₱4,800 is a separate liability paid via Form 2551Q quarterly; at annual Form 1701, only income tax balance is settled

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = PART_IV_A (graduated + OSD schedule within Form 1701)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,
  taxpayer_class: SERVICE_PROVIDER,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 160000.00,
      compensation_nti: 200000.00,
      combined_nti: 360000.00,
      income_tax: 16500.00,
      percentage_tax: 4800.00,
      total_tax: 21300.00
    },
    path_b: {
      eligible: true,
      osd_amount: 64000.00,
      business_nti_osd: 96000.00,
      compensation_nti: 200000.00,
      combined_nti: 296000.00,
      income_tax: 6900.00,
      percentage_tax: 4800.00,
      total_tax: 11700.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 12800.00,
      income_tax_compensation: 0.00,
      total_income_tax: 12800.00,
      percentage_tax: 0.00,
      total_tax: 12800.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_B,
    savings_vs_next_best: 1100.00,
    savings_vs_worst: 9600.00
  },

  selected_path: PATH_B,
  income_tax_due: 11700.00,
  percentage_tax_due: 4800.00,
  total_tax_due: 16500.00,
  compensation_tax_withheld: 0.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 11700.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: PART_IV_A,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003, WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_B and no business CWT entries provided.
**WARN-004** fires: total_itemized / gross_receipts = 0 / 160,000 = 0% < 5% threshold.

### Verification

- **Path B combined NTI:** 200,000 + 96,000 = 296,000; bracket 2: (296,000 − 250,000) × 0.15 = **₱6,900** ✓
- **Path B PT:** 160,000 × 0.03 = **₱4,800** ✓; total B = 6,900 + 4,800 = **₱11,700** ✓
- **Path C biz IT:** 160,000 × 0.08 = **₱12,800** ✓ (no ₱250K deduction — key)
- **Path C comp IT:** graduated(200,000) = **₱0** (200K ≤ 250K zero bracket) ✓
- **Path B beats Path C:** ₱11,700 < ₱12,800; margin = ₱1,100. ✓
- **Why OSD wins:** The ₱250K prohibition on Path C raises the biz IT base from ₱0 effective (would be ₱0 if ₱250K deducted: 160K − 250K < 0) to ₱160K (full gross). Meanwhile OSD keeps combined NTI at ₱296K — only ₱46K above the ₱250K floor — so Path B's 15% marginal rate applies to just ₱46K = ₱6,900 IT. Even adding ₱4,800 PT, total B = ₱11,700 < Path C ₱12,800. ✓
- **Balance payable** = ₱11,700 (income tax only; PT is separate obligation filed quarterly via 2551Q) ✓

**Legal basis:** OSD (40%): NIRC Sec. 34(L). No ₱250K deduction for mixed income: RMC 50-2018 Sec. 3; RMC 23-2018. Compensation below ₱250K: ₱0 income tax per NIRC Sec. 24(A)(2)(a). PT (3%): NIRC Sec. 116. PT waived under 8%: NIRC Sec. 24(A)(2)(b) "in lieu of" percentage tax. Form 1701 mandatory: BIR Form 1701 Instructions; MIR-01.

---

## TV-EX-G11-002: SC-M-L-I — Moderate-Compensation Employee + Small Freelance, Itemized Wins

**Scenario code:** SC-M-L-I
**Description:** Employed marketing coordinator earning ₱360,000 annual taxable compensation (bracket 2, 15% marginal) who runs a small freelance web development business with ₱450,000 gross receipts and ₱360,000 in documented expenses (80% expense ratio — heavy subcontractor payments). Path A (Itemized) wins at ₱46,000 total tax, saving ₱6,500 vs Path C (₱52,500) and ₱36,000 vs Path B (₱82,000). Itemized wins here because the 80% expense ratio reduces business NTI to ₱90,000, keeping combined NTI at ₱450,000 (bracket 3; 20% marginal) — a lower total than Path C's prohibited ₱250K deduction forcing 8% on the full ₱450K gross. The breakeven expense ratio for this profile (₱360K comp + ₱450K biz) is approximately 73%: at 80% (> 73%), Itemized wins.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱360,000.00 | ₱30,000/month after SSS ₱1,440, PhilHealth ₱900, Pag-IBIG ₱100, 13th month ₱30K exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱16,500.00 | Employer withheld: (₱360,000 − ₱250,000) × 0.15 = ₱16,500 |
| `gross_receipts` | ₱450,000.00 | Freelance web development project fees |
| `itemized_expenses.salaries_wages` | ₱300,000.00 | Subcontracted developers and designers (project basis; BIR-registered, 2% EWT remitted) |
| `itemized_expenses.supplies` | ₱20,000.00 | Software licenses, development tools, domain registrations |
| `itemized_expenses.communication` | ₱15,000.00 | Internet (apportioned: 50% business × ₱2,500/month × 12) |
| `itemized_expenses.other_allowable_deductions` | ₱25,000.00 | Cloud hosting, project management tools, professional development courses |
| All other itemized expense fields | ₱0.00 each | |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱300,000 + ₱20,000 + ₱15,000 + ₱25,000 = **₱360,000.00** (80.00% of gross receipts)

### Expected Intermediate Values

**PL-05 (Itemized Deductions):**
- `total_itemized_deductions` = ₱360,000.00
- `ear_cap` = ₱450,000 × 0.01 = ₱4,500.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱450,000 × 0.40 = ₱180,000.00
- `business_nti_path_b` = ₱270,000.00

**PL-08 (Path A — Mixed Income, Itemized):**
- `business_nti_path_a` = ₱450,000 − ₱360,000 = ₱90,000.00
- `combined_nti_path_a` = ₱360,000 (comp) + ₱90,000 (biz) = ₱450,000.00
- `income_tax_path_a` = graduated_tax_2023(₱450,000)
  = ₱22,500 + (₱450,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱10,000.00
  = **₱32,500.00** (bracket 3)
- `percentage_tax_path_a` = ₱450,000 × 0.03 = **₱13,500.00**
- `total_tax_path_a` = **₱46,000.00**

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱270,000.00
- `combined_nti_path_b` = ₱360,000 (comp) + ₱270,000 (biz) = ₱630,000.00
- `income_tax_path_b` = graduated_tax_2023(₱630,000)
  = ₱22,500 + (₱630,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱46,000.00
  = **₱68,500.00** (bracket 3)
- `percentage_tax_path_b` = **₱13,500.00**
- `total_tax_path_b` = **₱82,000.00**

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱360,000)
  = (₱360,000 − ₱250,000) × 0.15
  = **₱16,500.00** (bracket 2)
- `income_tax_business_path_c` = ₱450,000 × 0.08 = **₱36,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱16,500 + ₱36,000 = **₱52,500.00**

**PL-13 (Compare):**
- Path A: ₱46,000.00 ← MINIMUM
- Path B: ₱82,000.00
- Path C: ₱52,500.00
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱52,500 − ₱46,000 = **₱6,500.00** (Path A vs Path C)
- `savings_vs_worst` = ₱82,000 − ₱46,000 = **₱36,000.00** (Path A vs Path B)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱46,000.00
- `compensation_tax_withheld` = ₱16,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱46,000 − ₱16,500 = **₱29,500.00**

**PL-15 (Form Selection):**
- `form` = FORM_1701
- `form_section` = SCHEDULE_1_ITEMIZED (itemized deduction schedule within Form 1701)

**PL-16 (Penalties):** ₱0.00 (on-time)

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,
  taxpayer_class: SERVICE_PROVIDER,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 90000.00,
      compensation_nti: 360000.00,
      combined_nti: 450000.00,
      income_tax: 32500.00,
      percentage_tax: 13500.00,
      total_tax: 46000.00
    },
    path_b: {
      eligible: true,
      osd_amount: 180000.00,
      business_nti_osd: 270000.00,
      compensation_nti: 360000.00,
      combined_nti: 630000.00,
      income_tax: 68500.00,
      percentage_tax: 13500.00,
      total_tax: 82000.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 36000.00,
      income_tax_compensation: 16500.00,
      total_income_tax: 52500.00,
      percentage_tax: 0.00,
      total_tax: 52500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 6500.00,
    savings_vs_worst: 36000.00
  },

  selected_path: PATH_A,
  income_tax_due: 46000.00,
  percentage_tax_due: 13500.00,
  total_tax_due: 59500.00,
  compensation_tax_withheld: 16500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 29500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_1_ITEMIZED,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_A and no business CWT entries provided. Subcontractor payments of ₱300,000 may have had 2% EWT withheld on payments made by clients; if the taxpayer received Form 2307s for professional income from corporate clients, those should be entered.

### Verification

- **Itemized total:** 300,000 + 20,000 + 15,000 + 25,000 = **₱360,000** ✓; expense ratio = 360/450 = **80.00%** ✓
- **Path A biz NTI:** 450,000 − 360,000 = **₱90,000** ✓
- **Path A combined NTI:** 360,000 + 90,000 = **₱450,000** ✓; bracket 3: 22,500 + (450,000 − 400,000) × 0.20 = 22,500 + 10,000 = **₱32,500** ✓
- **Path A PT:** 450,000 × 0.03 = **₱13,500** ✓; total A = 32,500 + 13,500 = **₱46,000** ✓
- **Path B combined NTI:** 360,000 + 270,000 = **₱630,000** ✓; bracket 3: 22,500 + (630,000 − 400,000) × 0.20 = **₱68,500** ✓; total B = **₱82,000** ✓
- **Path C comp IT:** (360,000 − 250,000) × 0.15 = **₱16,500** ✓; biz IT = 450,000 × 0.08 = **₱36,000** ✓; total C = **₱52,500** ✓
- **Breakeven derivation:** Path A = Path C when: graduated(360K + 450K − E) + 13,500 = 16,500 + 36,000; graduated(810K − E) = 39,000; solve bracket 3: 22,500 + (NTI − 400K) × 0.20 = 39,000 → NTI = 482,500; 810K − E = 482,500 → E = 327,500; breakeven ratio = 327,500 / 450,000 = **72.8%**. At 80% > 72.8% → Path A wins ✓
- **Balance:** 46,000 − 16,500 = **₱29,500** ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)–(K). Subcontractor payments as ordinary/necessary business expenses: Sec. 34(A)(1). No ₱250K deduction: RMC 50-2018 Sec. 3. PT (3%): NIRC Sec. 116. Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-003: SC-M-MH-O — Moderate-Compensation Employee + Medium Business (₱1M–₱2M), OSD Path Exercised (Path C Wins)

**Scenario code:** SC-M-MH-O
**Description:** Operations manager earning ₱600,000 annual taxable compensation (bracket 3, 20% marginal) with a freelance IT consulting business earning ₱1,500,000. No documented business expenses. Path C (8% on business, graduated on comp) wins decisively at ₱182,500 total tax. Path B (OSD) yields ₱322,500 and Path A yields ₱477,500. This vector exercises the OSD computation path for the medium-business mixed income range and demonstrates that 8% is highly advantageous at this income level: the ₱250K deduction prohibition costs ₱120,000 vs a pure SE equivalent, but 8% on ₱1.5M biz still saves ₱140,000 over OSD. Employer withheld ₱62,500 on compensation; balance payable = ₱120,000 (business income IT only, since comp IT = employer withheld).

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱600,000.00 | ₱50,000/month after mandatory deductions; 13th month (₱50K) exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱62,500.00 | Employer withheld: 22,500 + (₱600,000 − ₱400,000) × 0.20 = ₱62,500 |
| `gross_receipts` | ₱1,500,000.00 | Freelance IT consulting and project management fees |
| All itemized expense fields | ₱0.00 each | No business expense receipts maintained |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-05:** total_itemized_deductions = ₱0.00; ear_cap = ₱1,500,000 × 0.01 = ₱15,000.00; nolco_applied = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱1,500,000 × 0.40 = ₱600,000.00
- `business_nti_path_b` = ₱900,000.00

**PL-08 (Path A — Mixed Income, Itemized = ₱0):**
- `business_nti_path_a` = ₱1,500,000.00
- `combined_nti_path_a` = ₱600,000 + ₱1,500,000 = ₱2,100,000.00
- `income_tax_path_a` = graduated_tax_2023(₱2,100,000)
  = ₱402,500 + (₱2,100,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱30,000
  = **₱432,500.00** (bracket 5)
- `percentage_tax_path_a` = ₱1,500,000 × 0.03 = **₱45,000.00**
- `total_tax_path_a` = **₱477,500.00**

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱900,000.00
- `combined_nti_path_b` = ₱600,000 + ₱900,000 = ₱1,500,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,500,000)
  = ₱102,500 + (₱1,500,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱175,000
  = **₱277,500.00** (bracket 4)
- `percentage_tax_path_b` = **₱45,000.00**
- `total_tax_path_b` = **₱322,500.00**

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱600,000)
  = ₱22,500 + (₱600,000 − ₱400,000) × 0.20
  = **₱62,500.00** (bracket 3)
- `income_tax_business_path_c` = ₱1,500,000 × 0.08 = **₱120,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱62,500 + ₱120,000 = **₱182,500.00**

**PL-13 (Compare):**
- Path A: ₱477,500.00
- Path B: ₱322,500.00
- Path C: ₱182,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱322,500 − ₱182,500 = **₱140,000.00** (Path C vs Path B)
- `savings_vs_worst` = ₱477,500 − ₱182,500 = **₱295,000.00** (Path C vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱182,500.00
- `compensation_tax_withheld` = ₱62,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱182,500 − ₱62,500 = **₱120,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_3B (8% income tax schedule for mixed income earners)

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,
  taxpayer_class: SERVICE_PROVIDER,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 1500000.00,
      compensation_nti: 600000.00,
      combined_nti: 2100000.00,
      income_tax: 432500.00,
      percentage_tax: 45000.00,
      total_tax: 477500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 600000.00,
      business_nti_osd: 900000.00,
      compensation_nti: 600000.00,
      combined_nti: 1500000.00,
      income_tax: 277500.00,
      percentage_tax: 45000.00,
      total_tax: 322500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 120000.00,
      income_tax_compensation: 62500.00,
      total_income_tax: 182500.00,
      percentage_tax: 0.00,
      total_tax: 182500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 140000.00,
    savings_vs_worst: 295000.00
  },

  selected_path: PATH_C,
  income_tax_due: 182500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 182500.00,
  compensation_tax_withheld: 62500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 120000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0 / 1,500,000 = 0% < 5% threshold.

### Verification

- **Path B combined NTI:** 600,000 + 900,000 = **₱1,500,000** ✓; bracket 4: 102,500 + (1,500,000 − 800,000) × 0.25 = 102,500 + 175,000 = **₱277,500** ✓; total B = **₱322,500** ✓
- **Path A combined NTI:** 600,000 + 1,500,000 = **₱2,100,000** ✓; bracket 5: 402,500 + (2,100,000 − 2,000,000) × 0.30 = **₱432,500** ✓; total A = **₱477,500** ✓
- **Path C comp IT:** 22,500 + (600,000 − 400,000) × 0.20 = **₱62,500** ✓; biz IT = 1,500,000 × 0.08 = **₱120,000** ✓; total C = **₱182,500** ✓
- **Savings:** 322,500 − 182,500 = **₱140,000** vs Path B ✓; 477,500 − 182,500 = **₱295,000** vs Path A ✓
- **Balance:** 182,500 − 62,500 = **₱120,000** ✓ (comp IT fully covered by employer withholding; balance is pure business IT)

**Legal basis:** 8% option: NIRC Sec. 24(A)(2)(b). No ₱250K deduction: RMC 50-2018 Sec. 3. OSD (40%): NIRC Sec. 34(L). Graduated rates: NIRC Sec. 24(A)(1), CR-002. PT (3%): NIRC Sec. 116. PT waived under 8%: NIRC Sec. 24(A)(2)(b). Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-004: SC-M-MH-I — Mid-Compensation Employee + Medium Business (₱1M–₱2M), Itemized Wins (Very High Expenses)

**Scenario code:** SC-M-MH-I
**Description:** Employed engineer earning ₱400,000 annual taxable compensation (exactly at bracket boundary — 15% rate ends here) running a consulting firm with ₱1,500,000 gross receipts and ₱1,275,000 in documented expenses (85% expense ratio — primarily subcontractor and operating costs). Path A (Itemized) wins at ₱112,500, saving ₱30,000 vs Path C (₱142,500) and ₱160,000 vs Path B (₱272,500). At 85% expenses, business NTI = ₱225,000, keeping combined NTI at ₱625,000 (bracket 3, 20% marginal). Path C's 8% on ₱1.5M full gross (₱120,000) exceeds the marginal graduated IT on ₱225K business NTI (₱45,000 × 20%) when combined with PT (₱45,000). The breakeven expense ratio for this profile is approximately 82%: at 85% (> 82%), Itemized wins.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱400,000.00 | ₱33,333/month gross; after mandatory deductions taxable = ₱400K (bracket 2 top boundary) |
| `compensation_cwt` (tax_withheld_by_employer) | ₱22,500.00 | Employer withheld: (₱400,000 − ₱250,000) × 0.15 = ₱22,500 |
| `gross_receipts` | ₱1,500,000.00 | Engineering consulting and project oversight fees |
| `itemized_expenses.salaries_wages` | ₱900,000.00 | Subcontracted engineers and drafters (project basis; properly invoiced) |
| `itemized_expenses.rent` | ₱120,000.00 | Dedicated office space: ₱10,000/month × 12 |
| `itemized_expenses.utilities` | ₱60,000.00 | Electricity, internet, water for office: ₱5,000/month × 12 |
| `itemized_expenses.supplies` | ₱80,000.00 | CAD software, drafting equipment, safety gear, office supplies |
| `itemized_expenses.communication` | ₱60,000.00 | Mobile, broadband, project communication tools |
| `itemized_expenses.other_allowable_deductions` | ₱55,000.00 | Professional development, CPD units, engineering association dues |
| All other itemized expense fields | ₱0.00 each | |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱900,000 + ₱120,000 + ₱60,000 + ₱80,000 + ₱60,000 + ₱55,000 = **₱1,275,000.00** (85.00% of gross receipts)

### Expected Intermediate Values

**PL-05:**
- `total_itemized_deductions` = ₱1,275,000.00
- `ear_cap` = ₱1,500,000 × 0.01 = ₱15,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱1,500,000 × 0.40 = ₱600,000.00
- `business_nti_path_b` = ₱900,000.00

**PL-08 (Path A — Mixed Income, Itemized):**
- `business_nti_path_a` = ₱1,500,000 − ₱1,275,000 = ₱225,000.00
- `combined_nti_path_a` = ₱400,000 + ₱225,000 = ₱625,000.00
- `income_tax_path_a` = graduated_tax_2023(₱625,000)
  = ₱22,500 + (₱625,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱45,000
  = **₱67,500.00** (bracket 3)
- `percentage_tax_path_a` = ₱1,500,000 × 0.03 = **₱45,000.00**
- `total_tax_path_a` = **₱112,500.00**

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱900,000.00
- `combined_nti_path_b` = ₱400,000 + ₱900,000 = ₱1,300,000.00
- `income_tax_path_b` = graduated_tax_2023(₱1,300,000)
  = ₱102,500 + (₱1,300,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱125,000
  = **₱227,500.00** (bracket 4)
- `percentage_tax_path_b` = **₱45,000.00**
- `total_tax_path_b` = **₱272,500.00**

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱400,000)
  = (₱400,000 − ₱250,000) × 0.15
  = **₱22,500.00** (bracket 2 top)
- `income_tax_business_path_c` = ₱1,500,000 × 0.08 = **₱120,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱22,500 + ₱120,000 = **₱142,500.00**

**PL-13 (Compare):**
- Path A: ₱112,500.00 ← MINIMUM
- Path B: ₱272,500.00
- Path C: ₱142,500.00
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱142,500 − ₱112,500 = **₱30,000.00** (Path A vs Path C)
- `savings_vs_worst` = ₱272,500 − ₱112,500 = **₱160,000.00** (Path A vs Path B)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱112,500.00
- `compensation_tax_withheld` = ₱22,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱112,500 − ₱22,500 = **₱90,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_1_ITEMIZED

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,
  taxpayer_class: SERVICE_PROVIDER,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 225000.00,
      compensation_nti: 400000.00,
      combined_nti: 625000.00,
      income_tax: 67500.00,
      percentage_tax: 45000.00,
      total_tax: 112500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 600000.00,
      business_nti_osd: 900000.00,
      compensation_nti: 400000.00,
      combined_nti: 1300000.00,
      income_tax: 227500.00,
      percentage_tax: 45000.00,
      total_tax: 272500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 120000.00,
      income_tax_compensation: 22500.00,
      total_income_tax: 142500.00,
      percentage_tax: 0.00,
      total_tax: 142500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_A,
    savings_vs_next_best: 30000.00,
    savings_vs_worst: 160000.00
  },

  selected_path: PATH_A,
  income_tax_due: 112500.00,
  percentage_tax_due: 45000.00,
  total_tax_due: 157500.00,
  compensation_tax_withheld: 22500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 90000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_1_ITEMIZED,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_A and no business CWT entries provided.

### Verification

- **Itemized total:** 900,000 + 120,000 + 60,000 + 80,000 + 60,000 + 55,000 = **₱1,275,000** ✓; ratio = 1,275/1,500 = **85.00%** ✓
- **Path A biz NTI:** 1,500,000 − 1,275,000 = **₱225,000** ✓; combined = **₱625,000** ✓; bracket 3: 22,500 + 225,000 × 0.20 = **₱67,500** ✓; total A = 67,500 + 45,000 = **₱112,500** ✓
- **Path B combined NTI:** 400,000 + 900,000 = **₱1,300,000** ✓; bracket 4: 102,500 + (1,300,000 − 800,000) × 0.25 = **₱227,500** ✓; total B = **₱272,500** ✓
- **Path C comp IT:** (400,000 − 250,000) × 0.15 = **₱22,500** ✓; biz IT = 1,500,000 × 0.08 = **₱120,000** ✓; total C = **₱142,500** ✓
- **Breakeven:** Path A = Path C when: graduated(400K + 1.5M − E) + 45K = 22,500 + 120,000 = 142,500; graduated(1.9M − E) = 97,500; bracket 4 (if ≥ 800K): 102,500 + (NTI − 800K) × 0.25 = 97,500 → NTI < 800K → try bracket 3: 22,500 + (NTI − 400K) × 0.20 = 97,500 → NTI = 775,000; 1.9M − E = 775,000 → E = 1,125,000; breakeven ratio = 1,125,000 / 1,500,000 = **75.0%**. Wait — let me re-derive at 85%: Path A combined NTI = 400K + 225K = 625K which is bracket 3. Path C = 142,500. At breakeven: 22,500 + (400K + NTI_biz − 400K) × 0.20 + 45K = 142,500 where NTI_biz = 1.5M − E → (1.5M − E) × 0.20 + 67,500 = 142,500 → (1.5M − E) = 375,000 → E = 1,125,000 → breakeven ratio = 75.0%. At E = ₱1,275,000 (85%) > 75.0% breakeven → Path A wins ✓
- **Balance:** 112,500 − 22,500 = **₱90,000** ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)–(K). No ₱250K deduction: RMC 50-2018. PT (3%): NIRC Sec. 116. Graduated rates: NIRC Sec. 24(A)(1). Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-005: SC-M-H-8 — Mid-Compensation Employee + Large Business (₱2M–₱3M), 8% Optimal (No ₱250K Deduction)

**Scenario code:** SC-M-H-8
**Description:** Employed marketing director earning ₱500,000 annual taxable compensation (bracket 3, 20% marginal) running a high-revenue IT consulting practice with ₱2,500,000 gross receipts and no documented business expenses. Path C (8% on business, separated from comp) wins decisively at ₱242,500 total tax — saving ₱235,000 vs Path B (₱477,500) and ₱535,000 vs Path A (₱777,500). Despite the ₱250K prohibition (Path C biz IT = ₱200,000 vs a hypothetical pure-SE equivalent of ₱180,000), 8% still produces enormous savings because Paths A/B push the combined NTI into the 30% bracket (₱2,500,000+ combined NTI). Employer withheld ₱42,500; balance payable = ₱200,000 (pure business IT; comp IT = employer withheld).

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱500,000.00 | ₱41,667/month after mandatory deductions; 13th month (₱41,667) exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱42,500.00 | Employer withheld: 22,500 + (₱500,000 − ₱400,000) × 0.20 = ₱42,500 |
| `gross_receipts` | ₱2,500,000.00 | IT consulting project fees; below ₱3M threshold → 8% eligible |
| All itemized expense fields | ₱0.00 each | No business expense receipts |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-04 (Eligibility):** path_c_eligible = true (₱2,500,000 ≤ ₱3,000,000 AND not VAT-registered); taxpayer_tier = MICRO

**PL-06 (OSD):**
- `osd_amount` = ₱2,500,000 × 0.40 = ₱1,000,000.00
- `business_nti_path_b` = ₱1,500,000.00

**PL-08 (Path A — Mixed Income, Itemized = ₱0):**
- `business_nti_path_a` = ₱2,500,000.00
- `combined_nti_path_a` = ₱500,000 + ₱2,500,000 = ₱3,000,000.00
- `income_tax_path_a` = graduated_tax_2023(₱3,000,000)
  = ₱402,500 + (₱3,000,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱300,000
  = **₱702,500.00** (bracket 5)
- `percentage_tax_path_a` = ₱2,500,000 × 0.03 = **₱75,000.00**
- `total_tax_path_a` = **₱777,500.00**

**PL-09 (Path B — Mixed Income, OSD):**
- `business_nti_path_b` = ₱1,500,000.00
- `combined_nti_path_b` = ₱500,000 + ₱1,500,000 = ₱2,000,000.00
- `income_tax_path_b` = graduated_tax_2023(₱2,000,000)
  = ₱402,500 + (₱2,000,000 − ₱2,000,000) × 0.30
  = **₱402,500.00** (exactly at bracket 5 lower boundary)
- `percentage_tax_path_b` = **₱75,000.00**
- `total_tax_path_b` = **₱477,500.00**

**PL-10 (Path C — Mixed Income, 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱500,000)
  = ₱22,500 + (₱500,000 − ₱400,000) × 0.20
  = **₱42,500.00** (bracket 3)
- `income_tax_business_path_c` = ₱2,500,000 × 0.08 = **₱200,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱42,500 + ₱200,000 = **₱242,500.00**

**PL-13 (Compare):**
- Path A: ₱777,500.00
- Path B: ₱477,500.00
- Path C: ₱242,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱477,500 − ₱242,500 = **₱235,000.00** (Path C vs Path B)
- `savings_vs_worst` = ₱777,500 − ₱242,500 = **₱535,000.00** (Path C vs Path A)

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱242,500.00
- `compensation_tax_withheld` = ₱42,500.00
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱242,500 − ₱42,500 = **₱200,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_3B

**PL-16:** total_penalties = ₱0.00

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,
  taxpayer_class: SERVICE_PROVIDER,

  regime_comparison: {
    path_a: {
      eligible: true,
      business_nti: 2500000.00,
      compensation_nti: 500000.00,
      combined_nti: 3000000.00,
      income_tax: 702500.00,
      percentage_tax: 75000.00,
      total_tax: 777500.00
    },
    path_b: {
      eligible: true,
      osd_amount: 1000000.00,
      business_nti_osd: 1500000.00,
      compensation_nti: 500000.00,
      combined_nti: 2000000.00,
      income_tax: 402500.00,
      percentage_tax: 75000.00,
      total_tax: 477500.00
    },
    path_c: {
      eligible: true,
      income_tax_business: 200000.00,
      income_tax_compensation: 42500.00,
      total_income_tax: 242500.00,
      percentage_tax: 0.00,
      total_tax: 242500.00,
      combined_nti: null,
      note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
      ineligibility_reasons: []
    },
    recommended_path: PATH_C,
    savings_vs_next_best: 235000.00,
    savings_vs_worst: 535000.00
  },

  selected_path: PATH_C,
  income_tax_due: 242500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 242500.00,
  compensation_tax_withheld: 42500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 200000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0 / 2,500,000 = 0% < 5% threshold.

### Verification

- **Path B combined NTI:** 500,000 + 1,500,000 = **₱2,000,000** ✓; bracket 5 lower boundary: 402,500 + 0 = **₱402,500** ✓; total B = 402,500 + 75,000 = **₱477,500** ✓
- **Path A combined NTI:** 500,000 + 2,500,000 = **₱3,000,000** ✓; bracket 5: 402,500 + (3,000,000 − 2,000,000) × 0.30 = **₱702,500** ✓; total A = **₱777,500** ✓
- **Path C comp IT:** 22,500 + (500,000 − 400,000) × 0.20 = **₱42,500** ✓; biz IT = 2,500,000 × 0.08 = **₱200,000** ✓; total C = **₱242,500** ✓
- **Savings:** 477,500 − 242,500 = **₱235,000** ✓; 777,500 − 242,500 = **₱535,000** ✓
- **Balance:** 242,500 − 42,500 = **₱200,000** ✓
- **Bracket boundary note:** Path B combined NTI lands exactly at ₱2,000,000 — the bracket 5 boundary. graduated_tax_2023(2,000,000) = 402,500 + (2,000,000 − 2,000,000) × 0.30 = 402,500 + 0 = **₱402,500**. The OSD NTI of ₱1,500,000 plus ₱500K comp equals exactly ₱2M. This is coincidental but verifiable: 2,500,000 × 0.60 = 1,500,000; 1,500,000 + 500,000 = 2,000,000 ✓

**Legal basis:** 8% option: NIRC Sec. 24(A)(2)(b). No ₱250K deduction: RMC 50-2018 Sec. 3. OSD (40%): NIRC Sec. 34(L). Graduated rates: NIRC Sec. 24(A)(1). PT waived under 8%: NIRC Sec. 24(A)(2)(b). Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-006: SC-M-H-O — High-Compensation Employee + Large Business (₱2M–₱3M), OSD Path Exercised (Path C Wins)

**Scenario code:** SC-M-H-O
**Description:** Senior bank officer earning ₱800,000 annual taxable compensation (exactly at bracket 4 lower boundary, 25% marginal rate starts) with a freelance financial advisory practice earning ₱2,800,000. No documented business expenses. Path C wins at ₱326,500, saving ₱304,000 vs Path B (₱630,500) and ₱640,000 vs Path A (₱966,500). This vector exercises the OSD computation for the high-income mixed earner range: OSD NTI of ₱1,680,000 plus ₱800K comp = ₱2,480,000 combined NTI (bracket 5, 30%), yielding IT of ₱546,500 — nearly triple the Path C total. Employer withheld ₱102,500; balance payable = ₱224,000 (business IT only; comp IT = employer withheld).

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱800,000.00 | Senior officer salary after mandatory deductions; 13th month (₱66,667) within ₱90K exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱102,500.00 | Employer withheld: 102,500 + (₱800,000 − ₱800,000) × 0.25 = ₱102,500 (at bracket 4 boundary: graduated_tax_2023(800,000) = 102,500) |
| `gross_receipts` | ₱2,800,000.00 | Financial advisory, investment consulting, estate planning fees |
| All itemized expense fields | ₱0.00 each | No documented business expenses |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-04:** path_c_eligible = true (₱2,800,000 ≤ ₱3,000,000 AND not VAT-registered); taxpayer_tier = MICRO

**PL-06 (OSD):**
- `osd_amount` = ₱2,800,000 × 0.40 = ₱1,120,000.00
- `business_nti_path_b` = ₱1,680,000.00

**PL-08 (Path A — Itemized = ₱0):**
- `business_nti_path_a` = ₱2,800,000.00
- `combined_nti_path_a` = ₱800,000 + ₱2,800,000 = ₱3,600,000.00
- `income_tax_path_a` = graduated_tax_2023(₱3,600,000)
  = ₱402,500 + (₱3,600,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱480,000
  = **₱882,500.00** (bracket 5)
- `percentage_tax_path_a` = ₱2,800,000 × 0.03 = **₱84,000.00**
- `total_tax_path_a` = **₱966,500.00**

**PL-09 (Path B — OSD):**
- `business_nti_path_b` = ₱1,680,000.00
- `combined_nti_path_b` = ₱800,000 + ₱1,680,000 = ₱2,480,000.00
- `income_tax_path_b` = graduated_tax_2023(₱2,480,000)
  = ₱402,500 + (₱2,480,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱144,000
  = **₱546,500.00** (bracket 5)
- `percentage_tax_path_b` = **₱84,000.00**
- `total_tax_path_b` = **₱630,500.00**

**PL-10 (Path C — 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱800,000)
  = **₱102,500.00** (bracket 4 boundary: 102,500 + 0 × 0.25)
- `income_tax_business_path_c` = ₱2,800,000 × 0.08 = **₱224,000.00**
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱102,500 + ₱224,000 = **₱326,500.00**

**PL-13 (Compare):**
- Path A: ₱966,500.00
- Path B: ₱630,500.00
- Path C: ₱326,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱630,500 − ₱326,500 = **₱304,000.00**
- `savings_vs_worst` = ₱966,500 − ₱326,500 = **₱640,000.00**

**PL-14:** income_tax_due = ₱326,500; compensation_tax_withheld = ₱102,500; balance_payable = **₱224,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_3B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, business_nti: 2800000.00, compensation_nti: 800000.00,
              combined_nti: 3600000.00, income_tax: 882500.00,
              percentage_tax: 84000.00, total_tax: 966500.00 },
    path_b: { eligible: true, osd_amount: 1120000.00, business_nti_osd: 1680000.00,
              compensation_nti: 800000.00, combined_nti: 2480000.00,
              income_tax: 546500.00, percentage_tax: 84000.00, total_tax: 630500.00 },
    path_c: { eligible: true, income_tax_business: 224000.00,
              income_tax_compensation: 102500.00, total_income_tax: 326500.00,
              percentage_tax: 0.00, total_tax: 326500.00, combined_nti: null,
              note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
              ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 304000.00,
    savings_vs_worst: 640000.00
  },

  selected_path: PATH_C,
  income_tax_due: 326500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 326500.00,
  compensation_tax_withheld: 102500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 224000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

### Verification

- **Path B combined NTI:** 800,000 + 1,680,000 = **₱2,480,000** ✓; bracket 5: 402,500 + (2,480,000 − 2,000,000) × 0.30 = 402,500 + 144,000 = **₱546,500** ✓; total B = **₱630,500** ✓
- **Path A combined NTI:** 800,000 + 2,800,000 = **₱3,600,000** ✓; bracket 5: 402,500 + (3,600,000 − 2,000,000) × 0.30 = **₱882,500** ✓; total A = **₱966,500** ✓
- **Path C comp IT:** graduated_tax_2023(800,000) = 102,500 + (800,000 − 800,000) × 0.25 = **₱102,500** ✓; biz IT = 2,800,000 × 0.08 = **₱224,000** ✓; total C = **₱326,500** ✓
- **Balance:** 326,500 − 102,500 = **₱224,000** ✓

**Legal basis:** 8% option: NIRC Sec. 24(A)(2)(b). No ₱250K deduction: RMC 50-2018. OSD (40%): NIRC Sec. 34(L). Graduated rates: NIRC Sec. 24(A)(1). Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-007: SC-M-H-I — Mid-High-Compensation Employee + Large Business (₱2M–₱3M), Itemized Wins

**Scenario code:** SC-M-H-I
**Description:** Employed architect earning ₱600,000 annual taxable compensation (bracket 3, 20% marginal) running a large architecture practice with ₱2,400,000 gross receipts and ₱2,000,000 in documented expenses (83.33% expense ratio — staff salaries dominate). Path A (Itemized) wins at ₱224,500, saving ₱30,000 vs Path C (₱254,500) and ₱262,000 vs Path B (₱486,500). At 83.33% expenses, business NTI = ₱400,000, keeping combined NTI at ₱1,000,000 (bracket 4, 25% marginal). Path C's 8% on ₱2.4M full gross (₱192,000) exceeds itemized's combined IT of ₱152,500, even after adding PT ₱72,000 to Path A's total. The breakeven expense ratio for this profile (₱600K comp + ₱2.4M biz) is approximately 81%: at 83.33% (> 81%), Itemized wins.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱600,000.00 | ₱50,000/month after mandatory deductions; 13th month (₱50K) exempt |
| `compensation_cwt` (tax_withheld_by_employer) | ₱62,500.00 | Employer withheld: 22,500 + (₱600,000 − ₱400,000) × 0.20 = ₱62,500 |
| `gross_receipts` | ₱2,400,000.00 | Architecture design fees, project management, structural consultation |
| `itemized_expenses.salaries_wages` | ₱1,400,000.00 | Junior architects, drafters, administrative staff (full-time employees; BIR-registered payroll) |
| `itemized_expenses.rent` | ₱240,000.00 | Office lease: ₱20,000/month × 12 |
| `itemized_expenses.utilities` | ₱96,000.00 | Electricity, internet, water: ₱8,000/month × 12 |
| `itemized_expenses.supplies` | ₱120,000.00 | CAD software, drafting materials, architectural models |
| `itemized_expenses.communication` | ₱60,000.00 | Mobile, broadband, project collaboration tools |
| `itemized_expenses.depreciation` | ₱84,000.00 | Office furniture (₱240K cost, 5-yr SL = ₱48K/yr) + workstations (₱180K cost, 5-yr SL = ₱36K/yr) = ₱84K total |
| All other itemized expense fields | ₱0.00 each | |
| `number_of_form_2316s` | 1 | Single employer |

**Total itemized business expenses:** ₱1,400,000 + ₱240,000 + ₱96,000 + ₱120,000 + ₱60,000 + ₱84,000 = **₱2,000,000.00** (83.33% of gross receipts)

### Expected Intermediate Values

**PL-05:**
- `total_itemized_deductions` = ₱2,000,000.00
- `ear_cap` = ₱2,400,000 × 0.01 = ₱24,000.00; no EAR expense claimed
- `nolco_applied` = ₱0.00

**PL-06 (OSD):**
- `osd_amount` = ₱2,400,000 × 0.40 = ₱960,000.00
- `business_nti_path_b` = ₱1,440,000.00

**PL-08 (Path A — Itemized):**
- `business_nti_path_a` = ₱2,400,000 − ₱2,000,000 = ₱400,000.00
- `combined_nti_path_a` = ₱600,000 + ₱400,000 = ₱1,000,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,000,000)
  = ₱102,500 + (₱1,000,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱50,000
  = **₱152,500.00** (bracket 4)
- `percentage_tax_path_a` = ₱2,400,000 × 0.03 = **₱72,000.00**
- `total_tax_path_a` = **₱224,500.00**

**PL-09 (Path B — OSD):**
- `business_nti_path_b` = ₱1,440,000.00
- `combined_nti_path_b` = ₱600,000 + ₱1,440,000 = ₱2,040,000.00
- `income_tax_path_b` = graduated_tax_2023(₱2,040,000)
  = ₱402,500 + (₱2,040,000 − ₱2,000,000) × 0.30
  = ₱402,500 + ₱12,000
  = **₱414,500.00** (bracket 5)
- `percentage_tax_path_b` = **₱72,000.00**
- `total_tax_path_b` = **₱486,500.00**

**PL-10 (Path C — 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱600,000)
  = ₱22,500 + (₱600,000 − ₱400,000) × 0.20
  = **₱62,500.00** (bracket 3)
- `income_tax_business_path_c` = ₱2,400,000 × 0.08 = **₱192,000.00**
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱62,500 + ₱192,000 = **₱254,500.00**

**PL-13 (Compare):**
- Path A: ₱224,500.00 ← MINIMUM
- Path B: ₱486,500.00
- Path C: ₱254,500.00
- `recommended_path` = PATH_A
- `savings_vs_next_best` = ₱254,500 − ₱224,500 = **₱30,000.00** (Path A vs Path C)
- `savings_vs_worst` = ₱486,500 − ₱224,500 = **₱262,000.00** (Path A vs Path B)

**PL-14:** income_tax_due = ₱224,500; compensation_tax_withheld = ₱62,500; balance_payable = **₱162,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_1_ITEMIZED

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, business_nti: 400000.00, compensation_nti: 600000.00,
              combined_nti: 1000000.00, income_tax: 152500.00,
              percentage_tax: 72000.00, total_tax: 224500.00 },
    path_b: { eligible: true, osd_amount: 960000.00, business_nti_osd: 1440000.00,
              compensation_nti: 600000.00, combined_nti: 2040000.00,
              income_tax: 414500.00, percentage_tax: 72000.00, total_tax: 486500.00 },
    path_c: { eligible: true, income_tax_business: 192000.00,
              income_tax_compensation: 62500.00, total_income_tax: 254500.00,
              percentage_tax: 0.00, total_tax: 254500.00, combined_nti: null,
              note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
              ineligibility_reasons: [] },
    recommended_path: PATH_A,
    savings_vs_next_best: 30000.00,
    savings_vs_worst: 262000.00
  },

  selected_path: PATH_A,
  income_tax_due: 224500.00,
  percentage_tax_due: 72000.00,
  total_tax_due: 296500.00,
  compensation_tax_withheld: 62500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 162000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_1_ITEMIZED,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-003],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-003** fires: recommended path is PATH_A and no business CWT entries provided.

### Verification

- **Itemized total:** 1,400,000 + 240,000 + 96,000 + 120,000 + 60,000 + 84,000 = **₱2,000,000** ✓; ratio = 2,000/2,400 = **83.33%** ✓
- **Path A biz NTI:** 2,400,000 − 2,000,000 = **₱400,000** ✓; combined = **₱1,000,000** ✓; bracket 4: 102,500 + 200,000 × 0.25 = **₱152,500** ✓; total A = 152,500 + 72,000 = **₱224,500** ✓
- **Path B combined NTI:** 600,000 + 1,440,000 = **₱2,040,000** ✓; bracket 5: 402,500 + 40,000 × 0.30 = **₱414,500** ✓; total B = **₱486,500** ✓
- **Path C comp IT:** 22,500 + 200,000 × 0.20 = **₱62,500** ✓; biz IT = 2,400,000 × 0.08 = **₱192,000** ✓; total C = **₱254,500** ✓
- **Balance:** 224,500 − 62,500 = **₱162,000** ✓

**Legal basis:** Itemized deductions: NIRC Sec. 34(A)–(K). Staff salaries as business expenses: Sec. 34(A)(1). Depreciation: Sec. 34(F). No ₱250K deduction: RMC 50-2018. Graduated rates: NIRC Sec. 24(A)(1). Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-008: SC-M-GOVT — Government Employee + Business (GSIS Contributor)

**Scenario code:** SC-M-GOVT
**Description:** Government school teacher (Teacher III, DepEd) earning ₱420,000 annual taxable compensation with a side tutoring and online course business earning ₱600,000 gross receipts. No documented business expenses. Path C wins at ₱74,500, saving ₱42,000 vs Path B (₱116,500) and ₱101,000 vs Path A (₱175,500). Key distinction from private employment: GSIS contributions instead of SSS (9% employee share of ₱24,996 base salary vs SSS ₱1,440/month cap), but the income tax treatment is identical — GSIS contributions are non-taxable exclusions per NIRC Sec. 32(B)(7)(f), treated the same as SSS for purposes of taxable compensation computation. Government employer (DepEd central office or school division) issues BIR Form 2316 and withholds income tax on compensation via BIR withholding agent designation.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱420,000.00 | Teacher III gross salary ₱504,000 (₱42K/month) − GSIS 9% (₱45,360) − PhilHealth (₱12,600) − Pag-IBIG (₱1,200) − 13th month ₱42K (exempt within ₱90K ceiling) − other non-taxable allowances ₱(remainder) ≈ ₱420K taxable |
| `compensation_cwt` (tax_withheld_by_employer) | ₱26,500.00 | DepEd/government agency withheld: 22,500 + (₱420,000 − ₱400,000) × 0.20 = 22,500 + 4,000 = ₱26,500 |
| `gross_receipts` | ₱600,000.00 | Private tutoring income + online course platform sales (non-employer educational income; separate BIR registration required) |
| All itemized expense fields | ₱0.00 each | No separate business expense receipts |
| `number_of_form_2316s` | 1 | Single government employer; Form 2316 issued by school/division |
| `employer_type` (informational) | GOVERNMENT | GSIS contributor; non-taxable GSIS contributions already excluded from taxable_compensation input |

**Total itemized business expenses:** ₱0.00

### Expected Intermediate Values

**PL-04:** path_c_eligible = true (₱600,000 ≤ ₱3,000,000 AND not VAT-registered); taxpayer_tier = MICRO

**PL-06 (OSD):**
- `osd_amount` = ₱600,000 × 0.40 = ₱240,000.00
- `business_nti_path_b` = ₱360,000.00

**PL-08 (Path A — Itemized = ₱0):**
- `business_nti_path_a` = ₱600,000.00
- `combined_nti_path_a` = ₱420,000 + ₱600,000 = ₱1,020,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,020,000)
  = ₱102,500 + (₱1,020,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱55,000
  = **₱157,500.00** (bracket 4)
- `percentage_tax_path_a` = ₱600,000 × 0.03 = **₱18,000.00**
- `total_tax_path_a` = **₱175,500.00**

**PL-09 (Path B — OSD):**
- `business_nti_path_b` = ₱360,000.00
- `combined_nti_path_b` = ₱420,000 + ₱360,000 = ₱780,000.00
- `income_tax_path_b` = graduated_tax_2023(₱780,000)
  = ₱22,500 + (₱780,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱76,000
  = **₱98,500.00** (bracket 3)
- `percentage_tax_path_b` = **₱18,000.00**
- `total_tax_path_b` = **₱116,500.00**

**PL-10 (Path C — 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱420,000)
  = ₱22,500 + (₱420,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱4,000
  = **₱26,500.00** (bracket 3)
- `income_tax_business_path_c` = ₱600,000 × 0.08 = **₱48,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱26,500 + ₱48,000 = **₱74,500.00**

**PL-13 (Compare):**
- Path A: ₱175,500.00
- Path B: ₱116,500.00
- Path C: ₱74,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱116,500 − ₱74,500 = **₱42,000.00**
- `savings_vs_worst` = ₱175,500 − ₱74,500 = **₱101,000.00**

**PL-14:** income_tax_due = ₱74,500; compensation_tax_withheld = ₱26,500; balance_payable = **₱48,000.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_3B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, business_nti: 600000.00, compensation_nti: 420000.00,
              combined_nti: 1020000.00, income_tax: 157500.00,
              percentage_tax: 18000.00, total_tax: 175500.00 },
    path_b: { eligible: true, osd_amount: 240000.00, business_nti_osd: 360000.00,
              compensation_nti: 420000.00, combined_nti: 780000.00,
              income_tax: 98500.00, percentage_tax: 18000.00, total_tax: 116500.00 },
    path_c: { eligible: true, income_tax_business: 48000.00,
              income_tax_compensation: 26500.00, total_income_tax: 74500.00,
              percentage_tax: 0.00, total_tax: 74500.00, combined_nti: null,
              note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
              ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 42000.00,
    savings_vs_worst: 101000.00
  },

  selected_path: PATH_C,
  income_tax_due: 74500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 74500.00,
  compensation_tax_withheld: 26500.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 48000.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0% < 5%.

### Verification

- **Path B combined NTI:** 420,000 + 360,000 = **₱780,000** ✓; bracket 3: 22,500 + (780,000 − 400,000) × 0.20 = 22,500 + 76,000 = **₱98,500** ✓; total B = 98,500 + 18,000 = **₱116,500** ✓
- **Path A combined NTI:** 420,000 + 600,000 = **₱1,020,000** ✓; bracket 4: 102,500 + 220,000 × 0.25 = **₱157,500** ✓; total A = **₱175,500** ✓
- **Path C comp IT:** 22,500 + 20,000 × 0.20 = **₱26,500** ✓; biz IT = 600,000 × 0.08 = **₱48,000** ✓; total C = **₱74,500** ✓
- **GSIS treatment:** GSIS contributions are non-taxable exclusions per NIRC Sec. 32(B)(7)(f), identical to SSS for income tax purposes. The engine does NOT distinguish between GSIS and SSS — both are handled by having the taxpayer enter the pre-computed `taxable_compensation` from Form 2316. ✓
- **Government employer withholding:** Government agencies with BIR withholding agent designation (per RR 1-2014) withhold income tax on compensation exactly as private employers. The Form 2316 format and 25th-month deadline are the same. ✓
- **Balance:** 74,500 − 26,500 = **₱48,000** ✓

**Legal basis:** GSIS non-taxable: NIRC Sec. 32(B)(7)(f); RA 8291 (GSIS Act). Compensation IT: NIRC Sec. 24(A)(1). 8% option: NIRC Sec. 24(A)(2)(b). No ₱250K deduction: RMC 50-2018. Form 1701 mandatory: MIR-01.

---

## TV-EX-G11-009: SC-M-DUAL-EMP — Two Private Employers + Business (Underwithheld Compensation)

**Scenario code:** SC-M-DUAL-EMP
**Description:** Accountant holding two private employment positions simultaneously — main job (₱350,000 taxable compensation) and a part-time position (₱200,000 taxable compensation) — plus a freelance bookkeeping business (₱500,000 gross receipts). Critical mechanic: each employer withholds income tax based on THEIR OWN payroll only, without knowledge of the other employer's compensation. Main employer withheld ₱15,000; part-time employer withheld ₱0 (₱200K < ₱250K zero bracket). Combined taxable compensation = ₱550,000 (already in bracket 3 at 20% marginal), but total employer withholding = ₱15,000 — only 19.6% of the actual compensation IT due (₱52,500). The large underwithheld compensation tax (₱37,500) plus business income tax (₱40,000 under Path C) produces a balance payable of ₱77,500 — often a surprise for taxpayers with dual employment.

### Input (fields differing from Group 11 defaults)

| Field | Value | Notes |
|-------|-------|-------|
| `taxable_compensation` | ₱550,000.00 | Aggregated from two Form 2316s: Main employer ₱350,000 + Part-time employer ₱200,000 |
| `compensation_cwt` (tax_withheld_by_employer) | ₱15,000.00 | Main employer withheld (350,000 − 250,000) × 0.15 = ₱15,000; part-time employer withheld ₱0 (200,000 < 250,000 zero bracket on their payroll alone) |
| `gross_receipts` | ₱500,000.00 | Freelance bookkeeping and accounting services |
| All itemized expense fields | ₱0.00 each | No business expense receipts |
| `number_of_form_2316s` | 2 | Two separate employers; aggregated inputs per CR-030 Section 8 |

**Total itemized business expenses:** ₱0.00

**Employer withholding breakdown (informational for UI):**

| Employer | Taxable Comp | IT Withheld | Basis |
|----------|-------------|-------------|-------|
| Main employer (full-time) | ₱350,000 | ₱15,000 | (350K − 250K) × 15% = 15,000 |
| Part-time employer | ₱200,000 | ₱0 | 200K < 250K zero bracket |
| **Total** | **₱550,000** | **₱15,000** | Underwithheld by ₱37,500 vs actual comp IT |

### Expected Intermediate Values

**PL-04:** path_c_eligible = true (₱500,000 ≤ ₱3,000,000 AND not VAT-registered); taxpayer_tier = MICRO

**PL-06 (OSD):**
- `osd_amount` = ₱500,000 × 0.40 = ₱200,000.00
- `business_nti_path_b` = ₱300,000.00

**PL-08 (Path A — Itemized = ₱0):**
- `business_nti_path_a` = ₱500,000.00
- `combined_nti_path_a` = ₱550,000 + ₱500,000 = ₱1,050,000.00
- `income_tax_path_a` = graduated_tax_2023(₱1,050,000)
  = ₱102,500 + (₱1,050,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱62,500
  = **₱165,000.00** (bracket 4)
- `percentage_tax_path_a` = ₱500,000 × 0.03 = **₱15,000.00**
- `total_tax_path_a` = **₱180,000.00**

**PL-09 (Path B — OSD):**
- `business_nti_path_b` = ₱300,000.00
- `combined_nti_path_b` = ₱550,000 + ₱300,000 = ₱850,000.00
- `income_tax_path_b` = graduated_tax_2023(₱850,000)
  = ₱102,500 + (₱850,000 − ₱800,000) × 0.25
  = ₱102,500 + ₱12,500
  = **₱115,000.00** (bracket 4)
- `percentage_tax_path_b` = **₱15,000.00**
- `total_tax_path_b` = **₱130,000.00**

**PL-10 (Path C — 8% separate; NO ₱250K deduction):**
- `income_tax_compensation_path_c` = graduated_tax_2023(₱550,000)
  = ₱22,500 + (₱550,000 − ₱400,000) × 0.20
  = ₱22,500 + ₱30,000
  = **₱52,500.00** (bracket 3)
- `income_tax_business_path_c` = ₱500,000 × 0.08 = **₱40,000.00** (NO ₱250K deduction)
- `percentage_tax_path_c` = **₱0.00**
- `total_tax_path_c` = ₱52,500 + ₱40,000 = **₱92,500.00**

**PL-13 (Compare):**
- Path A: ₱180,000.00
- Path B: ₱130,000.00
- Path C: ₱92,500.00 ← MINIMUM
- `recommended_path` = PATH_C
- `savings_vs_next_best` = ₱130,000 − ₱92,500 = **₱37,500.00**
- `savings_vs_worst` = ₱180,000 − ₱92,500 = **₱87,500.00**

**PL-14 (Balance Payable):**
- `income_tax_due` = ₱92,500.00
- `compensation_tax_withheld` = ₱15,000.00 (both employers combined)
- `total_cwt_business` = ₱0.00
- `quarterly_it_paid` = ₱0.00
- `balance_payable` = ₱92,500 − ₱15,000 = **₱77,500.00**

**PL-15:** form = FORM_1701; form_section = SCHEDULE_3B

### Expected Final Output

```
TaxComputationResult {
  tax_year: 2025,  filing_period: ANNUAL,
  taxpayer_type: MIXED_INCOME,  taxpayer_tier: MICRO,

  regime_comparison: {
    path_a: { eligible: true, business_nti: 500000.00, compensation_nti: 550000.00,
              combined_nti: 1050000.00, income_tax: 165000.00,
              percentage_tax: 15000.00, total_tax: 180000.00 },
    path_b: { eligible: true, osd_amount: 200000.00, business_nti_osd: 300000.00,
              compensation_nti: 550000.00, combined_nti: 850000.00,
              income_tax: 115000.00, percentage_tax: 15000.00, total_tax: 130000.00 },
    path_c: { eligible: true, income_tax_business: 40000.00,
              income_tax_compensation: 52500.00, total_income_tax: 92500.00,
              percentage_tax: 0.00, total_tax: 92500.00, combined_nti: null,
              note: "₱250,000 deduction does not apply: taxpayer has compensation income (RMC 50-2018)",
              ineligibility_reasons: [] },
    recommended_path: PATH_C,
    savings_vs_next_best: 37500.00,
    savings_vs_worst: 87500.00
  },

  selected_path: PATH_C,
  income_tax_due: 92500.00,
  percentage_tax_due: 0.00,
  total_tax_due: 92500.00,
  compensation_tax_withheld: 15000.00,
  cwt_credits: 0.00,
  quarterly_it_paid: 0.00,
  balance_payable: 77500.00,
  overpayment: 0.00,
  overpayment_disposition: null,
  form: FORM_1701,  form_section: SCHEDULE_3B,
  penalties: { surcharge: 0.00, interest: 0.00, compromise: 0.00, total: 0.00 },
  warnings: [WARN-004],
  manual_review_flags: [],
  ineligibility_notifications: []
}
```

**WARN-004** fires: total_itemized / gross_receipts = 0% < 5%.
**Informational display (UI, not a formal warning code):** "You have entered 2 employer Form 2316s. Your second employer withheld ₱0 on their ₱200,000 payroll because they did not know about your first employer's ₱350,000 compensation. Your combined compensation of ₱550,000 results in ₱52,500 income tax on compensation, but only ₱15,000 was withheld — leaving ₱37,500 of compensation income tax to be paid on your annual return. This is a common result for taxpayers with multiple employers."

### Verification

- **Path C comp IT:** graduated_tax_2023(550,000) = 22,500 + (550,000 − 400,000) × 0.20 = 22,500 + 30,000 = **₱52,500** ✓
- **Underwithheld computation:** Actual comp IT = ₱52,500; employer withholding = ₱15,000; gap = **₱37,500** ✓
- **Path C biz IT:** 500,000 × 0.08 = **₱40,000** ✓ (no ₱250K deduction)
- **Path B combined NTI:** 550,000 + 300,000 = **₱850,000** ✓; bracket 4: 102,500 + 50,000 × 0.25 = **₱115,000** ✓; total B = **₱130,000** ✓
- **Path A combined NTI:** 550,000 + 500,000 = **₱1,050,000** ✓; bracket 4: 102,500 + 250,000 × 0.25 = **₱165,000** ✓; total A = **₱180,000** ✓
- **Balance payable:** 92,500 − 15,000 = **₱77,500** ✓
- **Why main employer withheld ₱15,000:** They computed on their own ₱350,000 payroll: (350,000 − 250,000) × 0.15 = ₱15,000. Correct from their perspective (they don't know about the ₱200,000 second job). ✓
- **Why part-time employer withheld ₱0:** Their ₱200,000 payroll is below the ₱250,000 zero bracket. Correct from their perspective. ✓
- **Dual employer aggregation per CR-030 Sec. 8:** Engine accepts total_taxable_compensation = ₱550,000 (sum) and total_compensation_tax_withheld = ₱15,000 (sum). The aggregation happens at data entry — user inputs totals from both Form 2316s. ✓

**Legal basis:** Compensation IT: NIRC Sec. 24(A)(1). Employer withholding on compensation: NIRC Sec. 79. Multiple employers: NIRC Sec. 79(E) — employee with two employers must file annual ITR. No ₱250K deduction: RMC 50-2018. Form 1701 mandatory: MIR-01.

---

## GROUP 11 SUMMARY TABLE

| Vector | Scenario | Comp | Biz GR | Biz Expenses | Expense% | Optimal Path | Total Tax | Savings vs Next | Key Insight |
|--------|---------|------|--------|-------------|---------|-------------|-----------|-----------------|-------------|
| TV-EX-G11-001 | SC-M-L-O | ₱200,000 | ₱160,000 | ₱0 | 0% | Path B (OSD) | ₱11,700 | ₱1,100 vs C | Low comp (< ₱250K) + small biz: OSD wins narrow window over 8% |
| TV-EX-G11-002 | SC-M-L-I | ₱360,000 | ₱450,000 | ₱360,000 | 80% | Path A (Itemized) | ₱46,000 | ₱6,500 vs C | 80% expense ratio (> 73% breakeven): Itemized wins over 8% |
| TV-EX-G11-003 | SC-M-MH-O | ₱600,000 | ₱1,500,000 | ₱0 | 0% | Path C (8%) | ₱182,500 | ₱140,000 vs B | OSD computed but Path C wins by ₱140K; 8% highly valuable at ₱1.5M biz |
| TV-EX-G11-004 | SC-M-MH-I | ₱400,000 | ₱1,500,000 | ₱1,275,000 | 85% | Path A (Itemized) | ₱112,500 | ₱30,000 vs C | 85% expense ratio (> 75% breakeven): Itemized wins over 8% |
| TV-EX-G11-005 | SC-M-H-8 | ₱500,000 | ₱2,500,000 | ₱0 | 0% | Path C (8%) | ₱242,500 | ₱235,000 vs B | Near-max biz income: 8% saves ₱235K vs OSD; Path B NTI lands exactly at ₱2M bracket boundary |
| TV-EX-G11-006 | SC-M-H-O | ₱800,000 | ₱2,800,000 | ₱0 | 0% | Path C (8%) | ₱326,500 | ₱304,000 vs B | OSD computed but 8% dominates; high comp pushes Path B into 30% bracket |
| TV-EX-G11-007 | SC-M-H-I | ₱600,000 | ₱2,400,000 | ₱2,000,000 | 83.33% | Path A (Itemized) | ₱224,500 | ₱30,000 vs C | 83.33% expense ratio (> 81% breakeven): Itemized wins even at ₱2.4M gross |
| TV-EX-G11-008 | SC-M-GOVT | ₱420,000 | ₱600,000 | ₱0 | 0% | Path C (8%) | ₱74,500 | ₱42,000 vs B | Government employee (GSIS): identical mechanics to private; GSIS treated same as SSS |
| TV-EX-G11-009 | SC-M-DUAL-EMP | ₱550,000 | ₱500,000 | ₱0 | 0% | Path C (8%) | ₱92,500 | ₱37,500 vs B | Dual employer: ₱37,500 comp IT underwithheld; balance payable ₱77,500 surprises taxpayer |
| (edge-cases.md) | SC-M-MINWAGE | ₱0 taxable | ₱250,000 | ₱0 | 0% | Path B (OSD) | ₱7,500 | (see TV-EDGE-007) | Min wage earner: comp ₱0 taxable; 8% barred from ₱250K deduction; OSD NTI < ₱250K → IT ₱0 |

**Key insights validated in Group 11:**

1. **OSD beats 8% for mixed income earners only when compensation is below ₱250K and business gross is small.** The only scenarios where Path B outperforms Path C are TV-EX-G11-001 (SC-M-L-O) and TV-EDGE-007 (SC-M-MINWAGE) — both have compensation below ₱250K (₱200K and ₱0 respectively). At all other compensation levels, the 8% rate dominates.

2. **Itemized deductions win at high expense ratios even for mixed income earners.** The breakeven expense ratio depends on the combined compensation + business income level: approximately 73% at ₱360K comp + ₱450K biz (TV-EX-G11-002), 75% at ₱400K comp + ₱1.5M biz (TV-EX-G11-004), and 81% at ₱600K comp + ₱2.4M biz (TV-EX-G11-007). Higher income levels require higher expense ratios for itemized to beat 8%.

3. **The ₱250K prohibition cost scales with business gross.** For pure SE, the ₱250K deduction saves 8% × ₱250K = ₱20,000 in IT. For mixed income, this cost is borne in full: ₱20,000 at ₱500K biz gross, ₱120,000 lost at ₱1.5M biz, ₱200,000 lost at ₱2.5M biz. Despite this, Path C still wins in all cases except high-expense-ratio scenarios.

4. **Government vs. private employment: identical income tax treatment.** The GSIS/SSS distinction is irrelevant at the income tax level — both are non-taxable exclusions under Sec. 32(B)(7). The engine treats SC-M-GOVT identically to an equivalent private-employer scenario (TV-EX-G11-008 results match TV-EX-G3-001's structure).

5. **Dual employment creates systematic withholding gaps.** Second employers who compute withholding on their standalone payroll will almost always underwithhold when a first employer exists (TV-EX-G11-009). The ₱37,500 gap arises because ₱200,000 is below the ₱250K zero bracket in isolation but pushes combined compensation to ₱550,000 (bracket 3 at 20%). This is a common BIR audit trigger.

6. **Path B at ₱2M combined NTI boundary (TV-EX-G11-005).** When business OSD NTI + compensation lands exactly at the ₱2,000,000 bracket 5 threshold, the bracket 5 marginal rate (30%) applies to ₱0 excess → IT = ₱402,500. This coincidental boundary contact is not an error — it is the correct bracket 4 maximum IT. The formula: 402,500 + (2,000,000 − 2,000,000) × 0.30 = 402,500 + 0 = ₱402,500.

