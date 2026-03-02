# Exhaustive Test Vectors — Philippine Freelance Tax Optimizer

**Status:** PARTIAL — Groups 1–3 complete (19 vectors). Groups 4–14 pending.
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
