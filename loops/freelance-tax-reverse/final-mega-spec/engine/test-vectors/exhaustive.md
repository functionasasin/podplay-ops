# Exhaustive Test Vectors — Philippine Freelance Tax Optimizer

**Status:** PARTIAL — Group 1 complete (12 vectors). Groups 2–14 pending.
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
