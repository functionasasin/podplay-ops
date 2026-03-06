# Edge-Case Test Vectors — Philippine Freelance Tax Optimizer

**Status:** COMPLETE — 16 edge-case test vectors (TV-EDGE-001 through TV-EDGE-016)
**Last updated:** 2026-03-01
**Cross-references:**
- Basic test vectors: [engine/test-vectors/basic.md](basic.md)
- Computation rules: [domain/computation-rules.md](../../domain/computation-rules.md)
- Edge cases domain: [domain/edge-cases.md](../../domain/edge-cases.md)
- Scenario codes: [domain/scenarios.md](../../domain/scenarios.md)
- Data model: [engine/data-model.md](../data-model.md)
- Pipeline: [engine/pipeline.md](../pipeline.md)
- Invariants: [engine/invariants.md](../invariants.md)

---

## How to Read These Vectors

Each vector specifies:
1. **Scenario code** — References a code in scenarios.md and an edge case in edge-cases.md
2. **Edge case being tested** — The specific edge condition
3. **Full input** — Every `TaxpayerInput` field, no fields omitted
4. **Expected intermediate values** — Key outputs of each pipeline step, for debugging
5. **Expected final output** — Every field of `TaxComputationResult`, exact values
6. **Verification** — The mathematical derivation confirming each value

Monetary values in Philippine Pesos (₱). All tax amounts use 2-decimal centavo precision unless stated as whole peso (BIR form display). Rates as decimals (0.08 = 8%).

---

## TV-EDGE-001: SC-AT-3M — Exactly ₱3,000,000 Boundary

**Scenario code:** SC-AT-3M
**Edge case:** EC-T09 — At exactly ₱3M: SMALL tier, but 8% still available (≤ not strict <), VAT NOT required
**Description:** A professional IT consultant earns exactly ₱3,000,000 gross receipts with no business expenses. This boundary is the most critical in the entire engine: three separate rules use different boundary expressions (MICRO = "less than ₱3M" strict; 8% = "not exceeding ₱3M" inclusive; VAT = "exceeding ₱3M" strict). All three must resolve correctly simultaneously.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | No compensation income |
| `taxpayer_class` | `SERVICE_PROVIDER` | Professional services, no COGS |
| `taxpayer_tier` | `SMALL` | ₱3,000,000 = SMALL (not MICRO; MICRO is "less than ₱3M") |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `3_000_000.00` | Exactly ₱3,000,000 |
| `cost_of_goods_sold` | `0.00` | Service provider — no COGS |
| `gross_other_income` | `0.00` | No other income |
| `taxable_compensation` | `0.00` | Purely self-employed |
| `compensation_cwt` | `0.00` | No employer withholding |
| `itemized_deductions` | `0.00` | No documented expenses |
| `is_vat_registered` | `false` | ₱3M does NOT exceed threshold; VAT not required |
| `elected_regime` | `null` | Optimizer mode — compare all paths |
| `prior_quarter_payments` | `0.00` | Annual only (no prior 1701Q payments for simplicity) |
| `cwt_credits_income_tax` | `0.00` | No 2307 withholding |
| `cwt_credits_percentage_tax` | `0.00` | No CWT against PT |
| `filing_date` | `2026-04-15` | Filed on time |
| `is_first_year_registrant` | `false` | Established taxpayer |
| `registration_quarter` | `null` | Not first year |
| `nolco_carryover` | `0.00` | No prior year losses |

### Expected Intermediate Values

**PL-01 Validation:** PASS — all fields valid; gross_receipts = ₱3,000,000 is within valid range

**PL-02 Classification:**
- `income_type = PURELY_SE` (gross_receipts > 0, taxable_compensation = 0)
- `taxpayer_class = SERVICE_PROVIDER` (cost_of_goods_sold = 0)
- `taxpayer_tier = SMALL` (₱3,000,000 is NOT less than ₱3,000,000 → MICRO threshold not met; ₱3,000,000 < ₱20,000,000 → SMALL)
- `is_eight_pct_eligible = true` (₱3,000,000 ≤ ₱3,000,000 → inclusive boundary met)
- `vat_registration_required = false` (₱3,000,000 does NOT exceed ₱3,000,000 → strict inequality NOT met)
- `pct_tax_applicable = true` (not VAT-registered, not on 8% for Paths A/B)

**PL-03 Path C (8% Flat Rate):**
- `eight_pct_base = gross_receipts − 250_000 = 3_000_000 − 250_000 = 2_750_000`
- `income_tax_path_c = 2_750_000 × 0.08 = 220_000.00`
- `pct_tax_path_c = 0.00` (8% waives PT)
- `total_tax_path_c = 220_000.00`

**PL-03 Path B (Graduated + OSD):**
- `gross_income_b = 3_000_000`
- `osd_deduction = 3_000_000 × 0.40 = 1_200_000`
- `nti_path_b = 3_000_000 × 0.60 = 1_800_000`
- `income_tax_path_b = graduated_tax(1_800_000) = 102_500 + (1_800_000 − 800_000) × 0.25 = 102_500 + 250_000 = 352_500.00`
- `pct_tax_path_b = 3_000_000 × 0.03 = 90_000.00`
- `total_tax_path_b = 352_500 + 90_000 = 442_500.00`

**PL-03 Path A (Graduated + Itemized):**
- `gross_income_a = 3_000_000` (service provider; gross_income = gross_receipts)
- `itemized_deductions_allowed = 0.00` (user entered ₱0)
- `nti_path_a = 3_000_000 − 0 = 3_000_000`
- `income_tax_path_a = graduated_tax(3_000_000) = 402_500 + (3_000_000 − 2_000_000) × 0.30 = 402_500 + 300_000 = 702_500.00`
- `pct_tax_path_a = 3_000_000 × 0.03 = 90_000.00`
- `total_tax_path_a = 702_500 + 90_000 = 792_500.00`

**PL-04 Regime Comparison:**
- `min(220_000, 442_500, 792_500) = 220_000` → **Path C recommended**
- `savings_vs_next_best = 442_500 − 220_000 = 222_500`

**PL-05 Annual Credits:**
- `total_cwt_credits = 0.00`
- `balance_payable = 220_000 − 0 = 220_000.00`
- `balance_disposition = BALANCE_PAYABLE`

**Warnings fired:**
- `WARN-001` ("Your gross receipts are at exactly ₱3,000,000 — the maximum for 8% eligibility. If your actual receipts for the year exceed this at any point, you would be required to switch to graduated rates and register for VAT. Review your receipts carefully before filing.")

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `tax_year` | `2025` |
| `filing_period` | `ANNUAL` |
| `taxpayer_type` | `PURELY_SE` |
| `taxpayer_tier` | `SMALL` |
| `is_vat_registered` | `false` |
| `is_eight_pct_eligible` | `true` |
| **Path A (Graduated + Itemized):** | |
| `path_a.nti` | `3_000_000.00` |
| `path_a.income_tax` | `702_500.00` |
| `path_a.percentage_tax` | `90_000.00` |
| `path_a.total_tax` | `792_500.00` |
| `path_a.available` | `true` |
| **Path B (Graduated + OSD):** | |
| `path_b.osd_deduction` | `1_200_000.00` |
| `path_b.nti` | `1_800_000.00` |
| `path_b.income_tax` | `352_500.00` |
| `path_b.percentage_tax` | `90_000.00` |
| `path_b.total_tax` | `442_500.00` |
| `path_b.available` | `true` |
| **Path C (8% Flat Rate):** | |
| `path_c.eight_pct_base` | `2_750_000.00` |
| `path_c.income_tax` | `220_000.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `220_000.00` |
| `path_c.available` | `true` |
| `path_c.ineligibility_reasons` | `[]` |
| **Recommendation:** | |
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `222_500.00` |
| `next_best_path` | `PATH_B` |
| **Annual Credits:** | |
| `total_cwt_credits` | `0.00` |
| `quarterly_payments_credited` | `0.00` |
| `income_tax_due` | `220_000.00` |
| `balance_payable` | `220_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `overpayment_amount` | `0.00` |
| **Filing:** | |
| `recommended_form` | `Form 1701A Part IV-B` |
| `payment_deadline` | `2026-04-15` |
| `installment_option_available` | `true` (> ₱2,000; annual filing) |
| `installment_first_payment` | `110_000.00` |
| `installment_second_deadline` | `2026-07-15` |
| **Warnings:** | `[WARN-001]` |
| **Manual Review Flags:** | `[]` |

### Verification

**Critical boundary logic (must all be true simultaneously):**
```
gross = 3_000_000

MICRO boundary:  gross <  3_000_000  →  False  →  tier = SMALL  ✓
8% eligibility:  gross <= 3_000_000  →  True   →  Path C available  ✓
VAT required:    gross >  3_000_000  →  False  →  no VAT  ✓
PT applicable:   gross <= 3_000_000  →  True   →  PT applies to Paths A/B  ✓
EWT rate:        gross <= 3_000_000  →  5% from clients  ✓
```

**Path C computation:**
- 8% base: 3,000,000 − 250,000 = 2,750,000
- IT: 2,750,000 × 0.08 = **₱220,000.00** ✓

**Path B computation:**
- OSD: 3,000,000 × 0.40 = 1,200,000
- NTI: 1,800,000
- IT: 102,500 + (1,800,000 − 800,000) × 0.25 = 102,500 + 250,000 = **₱352,500** ✓
- PT: 3,000,000 × 0.03 = **₱90,000** ✓
- Total: ₱442,500 ✓

**Savings:** 442,500 − 220,000 = **₱222,500** ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b) ("not exceeding ₱3,000,000" for 8% eligibility); NIRC Sec. 236(G) ("exceeds ₱3,000,000" for VAT); RR 8-2024 ("less than ₱3,000,000" for MICRO tier)

---

## TV-EDGE-002: SC-BE-OSD-WINS — OSD Beats 8% in the Narrow ₱400K–₱437.5K Window

**Scenario code:** SC-BE-OSD-WINS
**Edge case:** Regime comparison — OSD (Path B) produces lower total tax than 8% (Path C) in the narrow window between the two crossover points (₱400K and ₱437.5K)
**Description:** A freelance writer earns ₱420,000 gross receipts with zero documented expenses. At this gross, Path B (OSD + PT) totals ₱12,900 while Path C (8%) totals ₱13,600. OSD wins by ₱700. This is the only gross-receipts range where a purely service-based freelancer with no expenses should prefer OSD over 8%.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | No compensation income |
| `taxpayer_class` | `SERVICE_PROVIDER` | No COGS |
| `taxpayer_tier` | `MICRO` | ₱420,000 < ₱3,000,000 |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `420_000.00` | ₱420,000 — within the OSD-wins window |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | Zero documented expenses |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | On time |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = 420_000 − 250_000 = 170_000`
- `income_tax_path_c = 170_000 × 0.08 = 13_600.00`
- `pct_tax_path_c = 0.00`
- `total_tax_path_c = 13_600.00`

**PL-03 Path B:**
- `nti_path_b = 420_000 × 0.60 = 252_000`
- `income_tax_path_b = graduated_tax(252_000) = (252_000 − 250_000) × 0.15 = 2_000 × 0.15 = 300.00`
- `pct_tax_path_b = 420_000 × 0.03 = 12_600.00`
- `total_tax_path_b = 300 + 12_600 = 12_900.00`

**PL-03 Path A:**
- `nti_path_a = 420_000 − 0 = 420_000`
- `income_tax_path_a = graduated_tax(420_000) = 22_500 + (420_000 − 400_000) × 0.20 = 22_500 + 4_000 = 26_500.00`
- `pct_tax_path_a = 420_000 × 0.03 = 12_600.00`
- `total_tax_path_a = 26_500 + 12_600 = 39_100.00`

**PL-04 Comparison:**
- Totals: A=39,100 | B=12,900 | C=13,600
- `min(12_900, 13_600, 39_100) = 12_900` → **Path B recommended** (OSD wins!)
- `savings_vs_next_best = 13_600 − 12_900 = 700`
- `next_best_path = PATH_C`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_B` |
| `savings_vs_next_best` | `700.00` |
| `next_best_path` | `PATH_C` |
| `path_c.total_tax` | `13_600.00` |
| `path_b.total_tax` | `12_900.00` |
| `path_b.income_tax` | `300.00` |
| `path_b.percentage_tax` | `12_600.00` |
| `path_b.nti` | `252_000.00` |
| `path_a.total_tax` | `39_100.00` |
| `income_tax_due` | `300.00` |
| `balance_payable` | `300.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-A` |
| `pct_tax_due` | `12_600.00` |
| `recommended_pct_form` | `Form 2551Q (quarterly)` |

### Verification

The OSD-wins window exists because in the ₱250K-₱400K NTI range, the graduated rate is only 15%, making IT very small. PT at 3% of gross receipts is the dominant cost in Path B. Since 8% (Path C) applies to gross minus ₱250K, while Path B applies PT to the full gross, the crossover occurs where PT-advantage of eliminating PT (by using Path C) is less than the IT saved by the very low graduated rate on the small NTI above ₱250K.

**Window bounds derivation:**
- Lower bound: 8% base = gross − 250K; Path C total = (gross − 250K) × 0.08; Path B total = (gross × 0.60 − 250K) × 0.15 + gross × 0.03. At gross = 400K: C = 150K × 0.08 = 12,000; B = (240K − 250K) × 0.15 + 12,000 = 0 + 12,000 = 12,000. Tie → Path C wins (tie-break: 8% > OSD). See TV-EDGE-003.
- Upper bound: At gross = 437,500: C = 187,500 × 0.08 = 15,000; B = (262,500 − 250K) × 0.15 + 437,500 × 0.03 = 1,875 + 13,125 = 15,000. Tie → Path C wins (tie-break).
- Within window (₱400,001–₱437,499): Path B < Path C. At ₱420K: C = 13,600; B = 12,900; B wins by ₱700 ✓

**Legal basis:** CR-014 breakeven table (regime-comparison-logic.md); CR-005 (Path B); CR-006 (Path C)

---

## TV-EDGE-003: SC-BE-OSD-8-LO — Exact Tie at ₱400,000 — Path C Wins Tie-Break

**Scenario code:** SC-BE-OSD-8-LO
**Edge case:** Exact mathematical tie between Path B and Path C at ₱400,000 gross receipts; tie-break rule: Path C (8%) preferred over Path B (OSD) on equal total tax
**Description:** A freelance programmer earns exactly ₱400,000. Path B and Path C produce exactly equal total tax (₱12,000 each). Engine must apply tie-break rule: Path C wins.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `400_000.00` | Exact tie boundary |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = 400_000 − 250_000 = 150_000`
- `income_tax_path_c = 150_000 × 0.08 = 12_000.00`
- `total_tax_path_c = 12_000.00`

**PL-03 Path B:**
- `nti_path_b = 400_000 × 0.60 = 240_000`
- `income_tax_path_b = graduated_tax(240_000) = 0.00` (below ₱250K threshold)
- `pct_tax_path_b = 400_000 × 0.03 = 12_000.00`
- `total_tax_path_b = 0 + 12_000 = 12_000.00`

**PL-03 Path A:**
- `nti_path_a = 400_000` (no expenses)
- `income_tax_path_a = graduated_tax(400_000) = (400_000 − 250_000) × 0.15 = 150_000 × 0.15 = 22_500.00`
- `pct_tax_path_a = 400_000 × 0.03 = 12_000.00`
- `total_tax_path_a = 22_500 + 12_000 = 34_500.00`

**PL-04 Tie-Break:**
- Path C total = ₱12,000; Path B total = ₱12,000 → TIE between C and B
- Tie-break rule (invariant INV-RC-05): Path C > Path B > Path A on equal total tax
- **Path C wins the tie**
- `savings_vs_next_best = 0.00` (they are equal)
- `tie_exists = true`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `0.00` |
| `next_best_path` | `PATH_B` |
| `tie_exists` | `true` |
| `path_c.income_tax` | `12_000.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `12_000.00` |
| `path_b.income_tax` | `0.00` |
| `path_b.percentage_tax` | `12_000.00` |
| `path_b.total_tax` | `12_000.00` |
| `path_a.total_tax` | `34_500.00` |
| `income_tax_due` | `12_000.00` |
| `balance_payable` | `12_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-B` |

### Verification

**Path C:** (400,000 − 250,000) × 0.08 = 150,000 × 0.08 = **₱12,000** ✓
**Path B:** NTI = 400,000 × 0.60 = 240,000 < 250,000 → IT = ₱0; PT = 400,000 × 0.03 = **₱12,000**; Total = **₱12,000** ✓
**Tie confirmed:** ₱12,000 = ₱12,000 ✓
**Tie-break:** Path C preferred per invariant INV-RC-05 ✓

Note: The note displayed in the UI must say "Path 8% and OSD produce equal total tax of ₱12,000. The 8% option was selected because it requires no percentage tax filing and is simpler to administer." This educates the taxpayer that even when the amounts are the same, 8% eliminates the separate 2551Q obligation.

---

## TV-EDGE-004: SC-BE-8-ITEMIZED-500K — Exact Tie: 8% = Itemized at 43.33% Expense Ratio

**Scenario code:** SC-BE-8-ITEMIZED-500K
**Edge case:** Exact mathematical breakeven between Path C (8%) and Path A (Itemized) at ₱500,000 gross and 43.33% expense ratio (₱216,667 expenses)
**Description:** A freelance graphic designer earns ₱500,000 and has exactly ₱216,667 in documented expenses (office rental, equipment, software subscriptions). This is the exact 43.33% expense ratio where Path A total tax equals Path C total tax. Tie-break: Path C wins.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `500_000.00` | |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `216_667.00` | 43.33% of gross — exact breakeven |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = 500_000 − 250_000 = 250_000`
- `income_tax_path_c = 250_000 × 0.08 = 20_000.00`
- `total_tax_path_c = 20_000.00`

**PL-03 Path B:**
- `nti_path_b = 500_000 × 0.60 = 300_000`
- `income_tax_path_b = graduated_tax(300_000) = (300_000 − 250_000) × 0.15 = 7_500.00`
- `pct_tax_path_b = 500_000 × 0.03 = 15_000.00`
- `total_tax_path_b = 7_500 + 15_000 = 22_500.00`

**PL-03 Path A:**
- `gross_income_a = 500_000` (service provider)
- `nti_path_a = 500_000 − 216_667 = 283_333`
- `income_tax_path_a = graduated_tax(283_333) = (283_333 − 250_000) × 0.15 = 33_333 × 0.15 = 4_999.95` → rounded = `5_000.00`
- `pct_tax_path_a = 500_000 × 0.03 = 15_000.00`
- `total_tax_path_a = 5_000 + 15_000 = 20_000.00`

**PL-04 Comparison:**
- Totals: A=20,000 | B=22,500 | C=20,000
- Path C and Path A tie at ₱20,000; both beat Path B
- Tie-break between C and A: Path C preferred (8% > Itemized per INV-RC-05)
- **Path C recommended**
- `savings_vs_path_b = 22_500 − 20_000 = 2_500`
- Note displayed: "Path 8% and Itemized Deductions produce equal total tax of ₱20,000. The 8% option was selected because it doesn't require expense documentation and eliminates the separate percentage tax filing."

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `0.00` |
| `next_best_path` | `PATH_A` |
| `tie_exists` | `true` |
| `path_c.total_tax` | `20_000.00` |
| `path_a.total_tax` | `20_000.00` |
| `path_b.total_tax` | `22_500.00` |
| `path_a.nti` | `283_333.00` |
| `path_a.income_tax` | `5_000.00` |
| `path_a.percentage_tax` | `15_000.00` |
| `income_tax_due` | `20_000.00` |
| `balance_payable` | `20_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |

### Verification

**Breakeven derivation:**
Path C total = (G − 250K) × 0.08 where G = 500,000
= 250,000 × 0.08 = **₱20,000** ✓

Path A total = (G − E) × 0.15 + G × 0.03 where E = itemized expenses
= (500,000 − 216,667) × 0.15 + 15,000
= 283,333 × 0.15 + 15,000
= 4,999.95 + 15,000 = **₱19,999.95 ≈ ₱20,000** (rounds to ₱20,000 at centavo precision) ✓

At exactly E = ₱216,666.67 (precise): Path A = ₱20,000.00 exactly (tie). The test uses ₱216,667 (rounding the fractional peso to the nearest peso) which produces a ₱0.05 difference that rounds away → same result.

---

## TV-EDGE-005: SC-BELOW-250K — Zero Income Tax, Path C Still Wins

**Scenario code:** SC-BELOW-250K
**Edge case:** Gross receipts below ₱250,000 — Path C produces ₱0 income tax (floor applied); Paths A and B also produce ₱0 IT but still owe PT; Path C wins by eliminating PT
**Description:** A part-time online tutor earns ₱180,000 gross receipts with no expenses. All three paths yield ₱0 income tax (NTI below ₱250K exemption). But Paths A and B still owe 3% percentage tax (₱5,400), while Path C (8% elected) waives PT. Path C total = ₱0 vs Path B/A = ₱5,400.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `180_000.00` | Below ₱250K — zero IT for all paths |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = max(180_000 − 250_000, 0) = max(-70_000, 0) = 0`
- `income_tax_path_c = 0 × 0.08 = 0.00`
- `pct_tax_path_c = 0.00` (8% waives PT even when base is zero)
- `total_tax_path_c = 0.00`

**PL-03 Path B:**
- `nti_path_b = 180_000 × 0.60 = 108_000`
- `income_tax_path_b = graduated_tax(108_000) = 0.00` (below ₱250K)
- `pct_tax_path_b = 180_000 × 0.03 = 5_400.00`
- `total_tax_path_b = 5_400.00`

**PL-03 Path A:**
- `nti_path_a = 180_000` (no expenses)
- `income_tax_path_a = 0.00` (below ₱250K)
- `pct_tax_path_a = 180_000 × 0.03 = 5_400.00`
- `total_tax_path_a = 5_400.00`

**PL-04 Comparison:**
- Totals: A=5,400 | B=5,400 | C=0
- **Path C recommended** by wide margin
- `savings_vs_next_best = 5_400 − 0 = 5_400`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `5_400.00` |
| `next_best_path` | `PATH_B` |
| `path_c.eight_pct_base` | `0.00` |
| `path_c.income_tax` | `0.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `0.00` |
| `path_b.total_tax` | `5_400.00` |
| `path_a.total_tax` | `5_400.00` |
| `income_tax_due` | `0.00` |
| `pct_tax_due` | `0.00` |
| `balance_payable` | `0.00` |
| `balance_disposition` | `ZERO_BALANCE` |
| `recommended_form` | `Form 1701A Part IV-B` |
| **Warnings:** | `[WARN-006]` (low income; 8% election still valid) |

### Verification

**Key rule:** The 8% flat rate on (gross − ₱250K) floors at ₱0 when gross < ₱250K. The taxpayer still benefits by electing 8% because it simultaneously waives the 3% percentage tax obligation that would arise under Paths A and B.

**Path C:** (180,000 − 250,000) → base < 0 → floor at 0 → IT = 0; PT waived = **₱0 total** ✓
**Path B:** NTI = 108,000 < 250,000 → IT = 0; PT = 180,000 × 0.03 = **₱5,400** ✓
**Savings:** ₱5,400 ✓

**Legal basis:** NIRC Sec. 24(A)(2)(b) — 8% waives OPT obligation (NIRC Sec. 116); zero base is floored, not negative

---

## TV-EDGE-006: SC-CROSS-3M — 8% Election Retroactively Cancelled at Annual

**Scenario code:** SC-CROSS-3M
**Edge case:** EC-T02 — taxpayer elected 8% at Q1 but annual gross exceeds ₱3M; 8% retroactively cancelled; all quarterly payments reclassified as advance payments toward graduated-rate annual tax
**Description:** A freelance consultant earns ₱3,200,000 total for 2025 (quarterly breakdown: Q1=₱700K, Q2=₱800K, Q3=₱900K, Q4=₱800K). Elected 8% at Q1, filed Q1-Q3 quarterly returns under 8%, made cumulative payments. When Q4 gross pushes total over ₱3M, the engine retroactively cancels 8% at annual reconciliation. All Q1-Q3 payments (₱172,000) become advance payments toward the graduated-rate annual tax.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `SMALL` | ₱3,200,000 ≥ ₱3,000,000 → SMALL |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `3_200_000.00` | Annual total — exceeds ₱3M threshold |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | No documented expenses |
| `is_vat_registered` | `false` | Not yet VAT-registered (crossed mid-year) |
| `elected_regime` | `ELECT_EIGHT_PCT` | User elected 8% at Q1 — engine must detect conflict |
| `prior_quarter_payments` | `172_000.00` | Q1=₱36K + Q2=₱64K + Q3=₱72K; paid under 8% |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-01 Validation — Ineligibility detection:**
- `gross_receipts (3_200_000) > 3_000_000` → Path C ineligible
- `elected_regime = ELECT_EIGHT_PCT` but Path C ineligible
- Error raised: `ERR_ELECTED_INELIGIBLE_PATH_C_GROSS` — "You elected 8% but your gross receipts of ₱3,200,000 exceed the ₱3,000,000 limit. The 8% option has been retroactively cancelled. Your annual tax has been computed using graduated rates. Quarterly payments of ₱172,000 made under the 8% election are treated as advance payments toward your graduated-rate tax."
- Engine does NOT reject computation; it overrides to optimizer mode for Paths A and B only
- `path_c.available = false`
- `path_c.ineligibility_reasons = [IN_02]` (gross > ₱3M)

**PL-03 Path B (OSD — computed as primary option):**
- `nti_path_b = 3_200_000 × 0.60 = 1_920_000`
- `income_tax_path_b = graduated_tax(1_920_000) = 102_500 + (1_920_000 − 800_000) × 0.25 = 102_500 + 280_000 = 382_500.00`
- `pct_tax_path_b = 3_200_000 × 0.03 = 96_000.00`
- `total_tax_path_b = 382_500 + 96_000 = 478_500.00`

**PL-03 Path A (no expenses):**
- `nti_path_a = 3_200_000`
- `income_tax_path_a = graduated_tax(3_200_000) = 402_500 + (3_200_000 − 2_000_000) × 0.30 = 402_500 + 360_000 = 762_500.00`
- `pct_tax_path_a = 96_000.00`
- `total_tax_path_a = 762_500 + 96_000 = 858_500.00`

**PL-04 Recommendation:**
- `min(478_500, 858_500) = 478_500` → **Path B recommended**
- `savings_vs_next_best = 858_500 − 478_500 = 380_000`

**PL-05 Annual Credits:**
- `income_tax_due = 382_500`
- `pct_tax_due = 96_000` (all 4 quarters combined; quarterly 2551Q was not filed — flagged)
- `quarterly_payments_credited = 172_000` (all reclassified from 8% payments)
- `balance_payable_income_tax = 382_500 − 172_000 = 210_500` (after crediting quarterly payments)
- Note: PT of ₱96,000 is separately owed on Forms 2551Q (Q1-Q3 are retroactively late, Q4 due Jan 25, 2026)

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_B` |
| `savings_vs_next_best` | `380_000.00` |
| `next_best_path` | `PATH_A` |
| `path_c.available` | `false` |
| `path_c.ineligibility_reasons` | `[IN_02]` |
| `path_b.nti` | `1_920_000.00` |
| `path_b.income_tax` | `382_500.00` |
| `path_b.percentage_tax` | `96_000.00` |
| `path_b.total_tax` | `478_500.00` |
| `path_a.income_tax` | `762_500.00` |
| `path_a.total_tax` | `858_500.00` |
| `income_tax_due` | `382_500.00` |
| `pct_tax_due` | `96_000.00` |
| `quarterly_payments_credited` | `172_000.00` |
| `balance_payable_income_tax` | `210_500.00` |
| `balance_payable_pct_tax` | `96_000.00` |
| `total_balance_payable` | `306_500.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701 (graduated, Path B)` |
| **Warnings:** | `[WARN_CROSS_3M_RETROACTIVE_CANCEL, WARN_PT_RETROACTIVE_DUE, WARN-005]` |
| **Manual Review Flags:** | `[MRF-019 (VAT transition — must register for VAT for 2026)]` |

### Verification

**Retroactive cancellation math:**
- Q1 actual payment: (700,000 − 250,000) × 0.08 = **₱36,000** ✓
- Q2 actual payment: (1,500,000 − 250,000) × 0.08 − 36,000 = 100,000 − 36,000 = **₱64,000** ✓
- Q3 actual payment: (2,400,000 − 250,000) × 0.08 − 100,000 = 172,000 − 100,000 = **₱72,000** ✓
- Total quarterly: 36,000 + 64,000 + 72,000 = **₱172,000** ✓

**Annual Path B:**
- NTI: 3,200,000 × 0.60 = 1,920,000
- IT: 102,500 + (1,920,000 − 800,000) × 0.25 = 102,500 + 280,000 = **₱382,500** ✓
- PT: 3,200,000 × 0.03 = **₱96,000** ✓
- Total: **₱478,500** ✓

**Balance payable:** 382,500 − 172,000 = **₱210,500** (income tax balance); **₱96,000** (PT all owed) ✓

**VAT obligation note:** Because gross exceeded ₱3M in 2025, the taxpayer must register for VAT by the 30th day of the month following the quarter of breach. This is a compliance obligation flagged by the engine but not computed (VAT is out of scope).

---

## TV-EDGE-007: SC-M-MINWAGE — Minimum Wage Employee + Business Income; OSD Beats 8%

**Scenario code:** SC-M-MINWAGE
**Edge case:** EC-M07 — mixed income earner where compensation is minimum wage (₱0 taxable); the ₱250K deduction is BARRED for Path C per RMC 50-2018 even though taxable_compensation = ₱0; OSD produces lower total tax than 8% for the business income
**Description:** A minimum wage employee (₱18,000/month gross salary, fully exempt from income tax under Sec. 24(A)(2)(a)) also earns ₱600,000 from a small catering business. Path C applies 8% to the full ₱600,000 (no ₱250K deduction) = ₱48,000 IT. Path B applies OSD: combined NTI = ₱360,000 → only ₱16,500 IT + ₱18,000 PT = ₱34,500 total. OSD wins by ₱13,500. This demonstrates why the "8% always wins for low earners" heuristic fails for mixed-income taxpayers.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `MIXED_INCOME` | Has both compensation and business income |
| `taxpayer_class` | `SERVICE_PROVIDER` | Catering/cooking services — treated as service for this example |
| `taxpayer_tier` | `MICRO` | Business gross ₱600,000 < ₱3,000,000 |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | Form 1701 always for mixed income |
| `gross_receipts` | `600_000.00` | Business income only |
| `cost_of_goods_sold` | `0.00` | Simplified (service) |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | Minimum wage is income-tax-exempt per Sec. 24(A)(2)(a) |
| `gross_compensation` | `216_000.00` | ₱18,000/month × 12 months (for display; not taxed) |
| `compensation_cwt` | `0.00` | Employer withheld ₱0 (correctly, minimum wage exempt) |
| `itemized_deductions` | `0.00` | No business expense documentation |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-02 Classification:**
- `income_type = MIXED_INCOME` (gross_receipts > 0 AND taxpayer_type = MIXED_INCOME)
- Even though `taxable_compensation = 0`, there IS compensation income → ₱250K deduction BARRED for Path C
- `eight_pct_deduction_barred = true` (RMC 50-2018: any compensation income, even if fully exempt, bars ₱250K deduction)

**PL-03 Path C (8% — mixed income rules):**
- Business portion: `eight_pct_base = gross_receipts = 600_000` (NO ₱250K deduction)
- `income_tax_path_c_business = 600_000 × 0.08 = 48_000.00`
- Compensation portion: `income_tax_path_c_comp = graduated_tax(0) = 0.00`
- `pct_tax_path_c = 0.00` (8% waives PT for business portion)
- `total_tax_path_c = 48_000 + 0 = 48_000.00`

**PL-03 Path B (OSD — mixed income: COMBINED NTI):**
- `osd_business = 600_000 × 0.40 = 240_000`
- `nti_business_osd = 600_000 − 240_000 = 360_000`
- `combined_nti = taxable_compensation + nti_business_osd = 0 + 360_000 = 360_000`
- `income_tax_path_b = graduated_tax(360_000) = (360_000 − 250_000) × 0.15 = 110_000 × 0.15 = 16_500.00`
- `pct_tax_path_b = 600_000 × 0.03 = 18_000.00`
- `total_tax_path_b = 16_500 + 18_000 = 34_500.00`

**PL-03 Path A (Itemized — mixed income: COMBINED NTI):**
- `nti_business_itemized = 600_000 − 0 = 600_000` (no expenses)
- `combined_nti = 0 + 600_000 = 600_000`
- `income_tax_path_a = graduated_tax(600_000) = 22_500 + (600_000 − 400_000) × 0.20 = 22_500 + 40_000 = 62_500.00`
- `pct_tax_path_a = 600_000 × 0.03 = 18_000.00`
- `total_tax_path_a = 62_500 + 18_000 = 80_500.00`

**PL-04 Comparison:**
- Totals: A=80,500 | B=34,500 | C=48,000
- **Path B recommended** (OSD wins!)
- `savings_vs_path_c = 48_000 − 34_500 = 13_500`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `taxpayer_type` | `MIXED_INCOME` |
| `recommended_path` | `PATH_B` |
| `savings_vs_next_best` | `13_500.00` |
| `next_best_path` | `PATH_C` |
| `path_c.income_tax` | `48_000.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `48_000.00` |
| `path_c.eight_pct_no_250k_deduction` | `true` |
| `path_c.deduction_basis_note` | `"No ₱250,000 deduction applied — you have compensation income (RMC 50-2018)"` |
| `path_b.combined_nti` | `360_000.00` |
| `path_b.income_tax` | `16_500.00` |
| `path_b.percentage_tax` | `18_000.00` |
| `path_b.total_tax` | `34_500.00` |
| `path_a.combined_nti` | `600_000.00` |
| `path_a.income_tax` | `62_500.00` |
| `path_a.total_tax` | `80_500.00` |
| `income_tax_due` | `16_500.00` |
| `pct_tax_due` | `18_000.00` |
| `balance_payable` | `34_500.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701 (mixed income — always 1701, never 1701A)` |
| **Warnings:** | `[WARN-011]` (250K deduction barred; OSD comparison shows significant savings vs 8%) |

### Verification

**Critical RMC 50-2018 rule:** Any compensation income — even minimum wage (₱0 taxable) — bars the ₱250,000 deduction for Path C. The taxpayer has compensation income (even if ₱0 taxable), so the 8% base is the full ₱600,000.

**Path C:** 600,000 × 0.08 = **₱48,000** (NO ₱250K deduction) ✓
**Path B:** NTI = 600,000 × 0.60 = 360,000; IT = (360,000 − 250,000) × 0.15 = **₱16,500**; PT = 600,000 × 0.03 = **₱18,000**; Total = **₱34,500** ✓
**Path B wins over Path C by:** 48,000 − 34,500 = **₱13,500** ✓

This demonstrates why naive "8% always wins for low earners" advice is wrong for mixed-income taxpayers. The combination of (a) losing the ₱250K deduction and (b) OSD reducing NTI below ₱250K (hence ₱0 IT) creates a scenario where graduated-rate OSD outperforms the flat 8%.

---

## TV-EDGE-008: SC-LATE-1701 — Late Annual Filing Penalty (76 Days Late, SMALL Tier)

**Scenario code:** SC-LATE-1701
**Edge case:** EC-P01 (penalty computation) — taxpayer filed annual 1701A on June 30, 2025 (76 days past April 15 deadline); SMALL tier; tax due ₱85,000; computing three-component penalty
**Description:** A freelance software developer (SMALL tier, prior year gross ₱1,200,000) owes ₱85,000 annual income tax (already computed via Path C). Failed to file by April 15, 2025 deadline. No installment election was made. Filing on June 30, 2025 (76 calendar days late). Three-component penalty: surcharge + interest + compromise.

**Tax year:** 2024
**Filing period:** ANNUAL (penalty computation mode)

### Input (TaxpayerInput — penalty fields)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_tier` | `SMALL` | Prior year gross ₱1,200,000 → SMALL (₱3M ≤ gross < ₱20M — wait, ₱1.2M < ₱3M, so this is MICRO) |

Wait — correcting the tier. ₱1,200,000 < ₱3,000,000 → MICRO tier, NOT SMALL. Let me use a taxpayer with ₱5,000,000 gross to be in SMALL tier, but then the IT due changes. Or alternatively, let me use a SMALL-tier taxpayer who has IT due ₱85,000. Let me just change the prior year gross to ₱4,000,000 (SMALL tier).

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_tier` | `SMALL` | Prior year gross ₱4,000,000 → SMALL (₱3M ≤ gross < ₱20M) |
| `income_tax_due_before_penalty` | `85_000.00` | Computed annual IT — this is the base for penalty |
| `filing_deadline` | `2025-04-15` | Annual 1701A deadline |
| `actual_filing_date` | `2025-06-30` | Actual date filed |
| `days_late` | `76` | June 30 − April 15 = 76 calendar days |
| `installment_elected` | `false` | No installment option chosen |
| `prior_payments` | `0.00` | No quarterly payments, no partial payment |

### Expected Intermediate Values

**Penalty Step 1 — Surcharge:**
- Taxpayer tier: SMALL → surcharge rate = **10%** (EOPT reduced rate, same as MICRO for SMALL)
- Surcharge = 85,000 × 0.10 = **₱8,500.00**

**Penalty Step 2 — Interest:**
- Taxpayer tier: SMALL → interest rate = **6% per annum** (EOPT reduced rate)
- Days late: 76
- Interest = 85,000 × 0.06 × (76 / 365)
- = 85,000 × 0.06 × 0.20821917808...
- = 85,000 × 0.01249315...
- = 1,061.92 → rounded to centavo = **₱1,061.92**

**Penalty Step 3 — Compromise Penalty:**
- Tax due bracket: ₱85,000 falls in "Over ₱50,000 – ₱100,000" (RMO 7-2015 Annex A Table, Section 255)
- Compromise penalty = **₱15,000** (standard schedule; no automatic 50% EOPT reduction for Sec. 255 late filing)

**Total Penalty:**
- Surcharge: ₱8,500.00
- Interest: ₱1,061.92
- Compromise: ₱15,000.00
- Total penalties: **₱24,561.92**

**Total Amount Due:**
- Basic tax: ₱85,000.00
- Total penalties: ₱24,561.92
- Total payable: **₱109,561.92**

### Expected Final Output (PenaltyComputationResult)

| Field | Value |
|-------|-------|
| `return_type` | `FORM_1701A_ANNUAL` |
| `taxpayer_tier` | `SMALL` |
| `days_late` | `76` |
| `basic_tax_due` | `85_000.00` |
| `surcharge_rate` | `0.10` |
| `surcharge_amount` | `8_500.00` |
| `interest_rate_per_annum` | `0.06` |
| `interest_days` | `76` |
| `interest_amount` | `1_061.92` |
| `compromise_penalty_bracket` | `"Over ₱50,000 to ₱100,000"` |
| `compromise_penalty_amount` | `15_000.00` |
| `total_penalties` | `24_561.92` |
| `total_amount_due` | `109_561.92` |
| `prescribed` | `false` (within 3-year ordinary prescriptive period) |
| **Abatement note:** | `"If late filing was due to force majeure (typhoon, BIR system downtime, etc.), apply for penalty abatement via BIR Form 2105 under NIRC Section 204(B)."` |

### Verification

**Surcharge:** 85,000 × 0.10 = **₱8,500** ✓
**Interest:** 85,000 × 0.06 × (76/365) = 5,100 × 0.208219 = 1,061.917... → **₱1,061.92** (rounded to centavo) ✓
**Compromise:** Tax due ₱85,000 is in "Over ₱50,000 – ₱100,000" bracket → standard table = **₱15,000** ✓
**Total penalties:** 8,500 + 1,061.92 + 15,000 = **₱24,561.92** ✓
**Total amount due:** 85,000 + 24,561.92 = **₱109,561.92** ✓

**Legal basis:** NIRC Sec. 248(A)(1) surcharge; Sec. 249 interest; RMO 7-2015 Annex A compromise table; RA 11976 EOPT (Sec. 248 EOPT 10%/6% for SMALL)

---

## TV-EDGE-009: SC-FIRST-MID-Q2 — Mid-Year Registrant, First Return in Q2

**Scenario code:** SC-FIRST-MID-Q2
**Edge case:** First-year registrant who registers in Q2 (April–June 2025); no Q1 return required; Q2 is the first and election quarter; 8% elected; annual reconciliation shows balance
**Description:** A newly registered freelance translator registered with BIR on April 20, 2025 (Q2). Their first quarterly return is Q2 1701Q (due August 15, 2025). They elect 8% on this first return. Total 2025 gross: ₱850,000 (earned from April 20 onward). Annual reconciliation shows ₱20,000 balance payable after Q2 and Q3 quarterly payments.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput — Annual)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | First year — default MICRO |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `850_000.00` | April 20 – December 31, 2025 |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `ELECT_EIGHT_PCT` | Elected 8% on Q2 1701Q |
| `prior_quarter_payments` | `28_000.00` | Q2 payment ₱2,400 + Q3 payment ₱25,600 |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | Annual 1701A due |
| `is_first_year_registrant` | `true` | First year |
| `registration_quarter` | `2` | Registered in Q2 (April–June) |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-02 Classification:**
- `is_first_year_registrant = true`
- `registration_quarter = 2` → first return was Q2 1701Q (no Q1 return required)
- `tier = MICRO` (default first year)
- `eight_pct_eligible = true` (₱850,000 ≤ ₱3M, 8% elected)

**PL-03 Path C (8% — elected, annual):**
- `eight_pct_base = 850_000 − 250_000 = 600_000`
- `income_tax_path_c = 600_000 × 0.08 = 48_000.00`
- `total_tax_path_c = 48_000.00`

**PL-04 Regime (elected):**
- Path C elected; Path B and A shown as comparison only
- Path B: NTI = 510,000; IT = 22,500 + (510,000 − 400,000) × 0.20 = 22,500 + 22,000 = 44,500; PT = 25,500; Total = ₱70,000
- Path A (no expenses): IT = 22,500 + 22,000 = ₱44,500; PT = ₱25,500; Total = ₱70,000
- Path C wins (₱48,000 < ₱70,000); election was optimal

**PL-05 Annual Credits:**
- `quarterly_payments_credited = 28_000`
- `income_tax_due = 48_000`
- `balance_payable = 48_000 − 28_000 = 20_000.00`

### Quarterly Computation (Supplementary — for traceability)

**Q2 1701Q (first return — election made here):**
- Cumulative gross (Q2 = Apr 20 through Jun 30): ₱280,000
- 8% base: 280,000 − 250,000 = 30,000
- IT: 30,000 × 0.08 = ₱2,400
- CWT credits: ₱0
- Q2 payment: **₱2,400**

**Q3 1701Q:**
- Cumulative gross (Q2+Q3): ₱280,000 + ₱320,000 = ₱600,000
- 8% base: 600,000 − 250,000 = 350,000
- IT cumulative: 350,000 × 0.08 = 28,000
- Less prior payments: 2,400
- Q3 payment: **₱25,600**

**Total quarterly payments:** 2,400 + 25,600 = **₱28,000** ✓

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `taxpayer_type` | `PURELY_SE` |
| `taxpayer_tier` | `MICRO` |
| `is_first_year_registrant` | `true` |
| `registration_quarter` | `2` |
| `elected_regime` | `ELECT_EIGHT_PCT` |
| `path_c.income_tax` | `48_000.00` |
| `path_c.total_tax` | `48_000.00` |
| `path_b.total_tax` | `70_000.00` |
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `22_000.00` |
| `quarterly_payments_credited` | `28_000.00` |
| `income_tax_due` | `48_000.00` |
| `balance_payable` | `20_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-B` |
| `no_q1_return_required` | `true` |
| `first_filing_was` | `Q2 1701Q (August 15, 2025)` |

### Verification

**Annual IT (Path C):** (850,000 − 250,000) × 0.08 = 600,000 × 0.08 = **₱48,000** ✓
**Q2 payment:** (280,000 − 250,000) × 0.08 = 30,000 × 0.08 = **₱2,400** ✓
**Q3 cumulative IT:** (600,000 − 250,000) × 0.08 = **₱28,000**; less Q2 = **₱25,600** ✓
**Balance:** 48,000 − 28,000 = **₱20,000** ✓

**Note on Q1:** No Q1 return was required because the taxpayer was not registered during Q1. The first quarter for filing purposes begins with the quarter of registration (Q2 in this case). The engine must NOT flag a missing Q1 return for this taxpayer.

---

## TV-EDGE-010: SC-QC-OVERPY-Q3 — Q3 CWT Accumulation Exceeds IT Due; Zero Q3 Payment; Annual Overpayment

**Scenario code:** SC-QC-OVERPY-Q3
**Edge case:** Creditable withholding tax accumulated over Q1+Q2+Q3 exceeds the cumulative income tax due at Q3; Q3 balance payable = ₱0; annual shows large CWT overpayment requiring refund/carryover election
**Description:** A professional architect earns ₱800,000 annually (uniform ₱200K/quarter) and is subject to 15% EWT from a Top Withholding Agent client (₱30,000/quarter). The cumulative CWT surpasses the cumulative IT under OSD (already elected at Q1) by Q3. Q3 shows ₱0 balance payable. The annual overpayment of ₱81,500 triggers the refund/carryover election.

**Tax year:** 2025
**Filing period:** ANNUAL
**Elected regime:** OSD (elected at Q1 1701Q, irrevocable for the year)

### Input (TaxpayerInput — Annual)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | ₱800K < ₱3M |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `800_000.00` | ₱200K/quarter × 4 |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | OSD elected — itemized irrelevant |
| `is_vat_registered` | `false` | |
| `elected_regime` | `ELECT_OSD` | Elected OSD at Q1 — locked for year |
| `prior_quarter_payments` | `0.00` | All quarters showed ₱0 balance payable (CWT absorbed IT) |
| `cwt_credits_income_tax` | `120_000.00` | ₱30,000/quarter × 4 quarters; ATC WI011 (15% TWA EWT) |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Quarterly Computation (Supplementary)

**Q1 1701Q:**
- Cumulative gross: ₱200,000
- OSD NTI: 200,000 × 0.60 = 120,000
- IT: graduated_tax(120,000) = ₱0 (< ₱250K)
- CWT Q1: ₱30,000
- Balance payable: max(0, 0 − 30,000) = **₱0** (Q1 payment = ₱0)
- CWT absorbed: ₱0 out of ₱30,000 applied against ₱0 IT

**Q2 1701Q:**
- Cumulative gross: ₱400,000
- OSD NTI: 400,000 × 0.60 = 240,000
- IT: graduated_tax(240,000) = ₱0 (< ₱250K)
- CWT Q1+Q2: ₱60,000
- Balance payable: max(0, 0 − 0 (prior payments) − 60,000) = **₱0**

**Q3 1701Q:**
- Cumulative gross: ₱600,000
- OSD NTI: 600,000 × 0.60 = 360,000
- IT cumulative: graduated_tax(360,000) = (360,000 − 250,000) × 0.15 = ₱16,500
- Prior payments: ₱0 (Q1 and Q2 both ₱0)
- CWT Q1+Q2+Q3: ₱90,000
- Balance: 16,500 − 0 − 90,000 = −₱73,500 → floor at **₱0** (Q3 payment = ₱0)
- Note: Q3 Form 1701Q Item 63 shows a negative/zero balance; taxpayer pays nothing in Q3

### Expected Intermediate Values (Annual)

**PL-03 Path B (OSD — elected):**
- `nti = 800_000 × 0.60 = 480_000`
- `income_tax = graduated_tax(480_000) = 22_500 + (480_000 − 400_000) × 0.20 = 22_500 + 16_000 = 38_500.00`
- `pct_tax = 800_000 × 0.03 = 24_000.00`
- `total_tax = 38_500 + 24_000 = 62_500.00`

**PL-05 Annual Credits:**
- `income_tax_due = 38_500`
- `total_cwt_credits = 120_000`
- `quarterly_payments_credited = 0` (all zero)
- `it_balance = 38_500 − 0 − 120_000 = −81_500` → overpayment
- `overpayment_amount = 81_500.00`
- `balance_disposition = OVERPAYMENT`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `taxpayer_type` | `PURELY_SE` |
| `taxpayer_tier` | `MICRO` |
| `elected_regime` | `ELECT_OSD` |
| `path_b.nti` | `480_000.00` |
| `path_b.income_tax` | `38_500.00` |
| `path_b.percentage_tax` | `24_000.00` |
| `path_b.total_tax` | `62_500.00` |
| `income_tax_due` | `38_500.00` |
| `pct_tax_due` | `24_000.00` |
| `total_cwt_credits` | `120_000.00` |
| `quarterly_payments_credited` | `0.00` |
| `overpayment_amount` | `81_500.00` |
| `balance_disposition` | `OVERPAYMENT` |
| `overpayment_options` | `["Carry over to TY2026 as tax credit", "Apply for cash refund (BIR Form 1914)", "Apply as tax credit certificate (TCC)"]` |
| `recommended_form` | `Form 1701A Part IV-A` |
| **Warnings:** | `[WARN-016]` (large CWT overpayment; advise quarterly CWT review) |

### Verification

**Annual IT (Path B):** NTI = 480,000; IT = 22,500 + (480,000 − 400,000) × 0.20 = 22,500 + 16,000 = **₱38,500** ✓
**Total CWT:** 30,000 × 4 = **₱120,000** ✓
**Overpayment:** 38,500 − 0 − 120,000 = **−₱81,500** → overpayment = **₱81,500** ✓

**Q3 quarterly balance validation:**
- Q3 cumulative IT: graduated_tax(360,000) = **₱16,500** ✓
- Q3 cumulative CWT: ₱90,000
- Q3 balance: 16,500 − 90,000 = **−₱73,500 → ₱0 (floored)** ✓

**Key invariant (INV-006):** `balance_payable >= 0` — quarterly balance is never negative (floor at zero). Excess CWT flows to annual reconciliation only. ✓

---

## TV-EDGE-011: SC-PLAT-UPWORK-8 — Upwork/Payoneer Platform Withholding (WI760 CWT)

**Scenario code:** SC-PLAT-UPWORK-8
**Edge case:** Platform freelancer (Upwork → Payoneer) subject to RR 16-2023 e-marketplace withholding at effective 0.5% of gross remittance (ATC WI760); CWT credits against 8% income tax
**Description:** A freelance software developer earns ₱900,000 via Upwork, remitted through Payoneer. Combined platform remittances exceed ₱500,000 threshold (no Sworn Declaration submitted) → Payoneer withholds 1% on half the gross remittance = effective 0.5% of total remittance. Payoneer issues BIR Form 2307 with ATC WI760. The 8% election is optimal; WI760 CWT of ₱4,500 offsets the annual IT.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | ₱900K < ₱3M |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `900_000.00` | All via Upwork/Payoneer |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | No quarterly 1701Q filed (simplified) |
| `cwt_credits_income_tax` | `4_500.00` | WI760: 900,000 × 0.005 = ₱4,500 (Payoneer 1% on 50% of remittance per RR 16-2023) |
| `cwt_atc_breakdown` | `[{atc: "WI760", amount: 4_500.00, payor: "Payoneer Philippines Inc."}]` | ATC detail for 2307 |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C (8%):**
- `eight_pct_base = 900_000 − 250_000 = 650_000`
- `income_tax_path_c = 650_000 × 0.08 = 52_000.00`
- `pct_tax_path_c = 0.00`
- `total_tax_path_c = 52_000.00`

**PL-03 Path B (OSD):**
- `nti = 900_000 × 0.60 = 540_000`
- `income_tax = graduated_tax(540_000) = 22_500 + (540_000 − 400_000) × 0.20 = 22_500 + 28_000 = 50_500.00`
- `pct_tax = 900_000 × 0.03 = 27_000.00`
- `total_tax = 77_500.00`

**PL-03 Path A (no expenses):**
- `nti = 900_000`
- `income_tax = graduated_tax(900_000) = 102_500 + (900_000 − 800_000) × 0.25 = 102_500 + 25_000 = 127_500.00`
- `pct_tax = 27_000.00`
- `total_tax = 154_500.00`

**PL-04 Comparison:**
- Totals: A=154,500 | B=77,500 | C=52,000
- **Path C recommended**; savings vs B = ₱25,500

**PL-05 CWT credits (WI760 classification):**
- ATC WI760: classified as INCOME_TAX_CWT (not PT_CWT) — offsets income tax
- `total_cwt_credits = 4_500`
- `income_tax_due = 52_000`
- `balance_payable = 52_000 − 4_500 = 47_500.00`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `25_500.00` |
| `next_best_path` | `PATH_B` |
| `path_c.income_tax` | `52_000.00` |
| `path_c.total_tax` | `52_000.00` |
| `path_b.total_tax` | `77_500.00` |
| `path_a.total_tax` | `154_500.00` |
| `total_cwt_credits` | `4_500.00` |
| `cwt_atc_breakdown` | `[{atc: "WI760", amount: 4_500.00}]` |
| `income_tax_due` | `52_000.00` |
| `balance_payable` | `47_500.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-B` |

### Verification

**WI760 CWT computation (RR 16-2023):**
- Gross remittance: ₱900,000
- RR 16-2023 withholding base: 50% of gross remittance = ₱450,000
- Withholding rate: 1% on the base
- CWT withheld: ₱450,000 × 0.01 = ₱4,500 (effective 0.5% of gross) ✓

**Path C:** (900,000 − 250,000) × 0.08 = 650,000 × 0.08 = **₱52,000** ✓
**Balance payable:** 52,000 − 4,500 = **₱47,500** ✓

**ATC classification note:** WI760 is an income tax withheld at source. It offsets the annual income tax due (Form 1701A Item 62), NOT the percentage tax. Unlike WI010/WI011 (professional fee EWT), WI760 applies to e-marketplace remittances and is not tied to the existence of a formal professional relationship.

---

## TV-EDGE-012: SC-B-ML-O — Business/Trading: OSD Beats 8% When COGS is High (50%)

**Scenario code:** SC-B-ML-O
**Edge case:** Trading business with 50% COGS ratio; Path C applies 8% to gross SALES (not income), making it expensive; Path B applies OSD to gross INCOME (gross sales − COGS), producing NTI below ₱250K → ₱0 IT; OSD total = ₱24,000 vs 8% total = ₱44,000
**Description:** A small online retailer (sells physical merchandise) has gross sales of ₱800,000 and COGS of ₱400,000. Path C (8%) applies to full gross sales (₱800K − ₱250K) × 8% = ₱44,000. Path B OSD applies to gross income (₱800K − ₱400K COGS = ₱400K gross income) × 40% OSD → NTI ₱240K → ₱0 IT; only PT ₱24,000 owed. Path B wins by ₱20,000.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `TRADER` | Buys and sells physical goods — COGS present |
| `taxpayer_tier` | `MICRO` | ₱800K < ₱3M |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `800_000.00` | Gross sales from merchandise |
| `cost_of_goods_sold` | `400_000.00` | 50% of gross sales |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | No operating expenses beyond COGS (simplified) |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-02 Classification:**
- `taxpayer_class = TRADER` (cost_of_goods_sold > 0)
- `gross_income = gross_receipts − cost_of_goods_sold = 800_000 − 400_000 = 400_000`

**PL-03 Path C (8% — TRADER: base = gross SALES not gross income):**
- `eight_pct_base = gross_receipts − 250_000 = 800_000 − 250_000 = 550_000`
- `income_tax_path_c = 550_000 × 0.08 = 44_000.00`
- `pct_tax_path_c = 0.00`
- `total_tax_path_c = 44_000.00`

**PL-03 Path B (OSD — TRADER: OSD applied to gross INCOME = gross sales − COGS):**
- `gross_income_b = 400_000`
- `osd_deduction = 400_000 × 0.40 = 160_000`
- `nti_path_b = 400_000 − 160_000 = 240_000`
- `income_tax_path_b = graduated_tax(240_000) = 0.00` (below ₱250K)
- `pct_tax_path_b = gross_receipts × 0.03 = 800_000 × 0.03 = 24_000.00`
- `total_tax_path_b = 0 + 24_000 = 24_000.00`

**PL-03 Path A (Itemized — TRADER: COGS NOT re-deducted; gross_income is already after COGS):**
- `gross_income_a = 400_000` (gross sales − COGS already applied)
- `itemized_deductions_allowed = 0.00` (no operating expenses other than COGS)
- `nti_path_a = 400_000 − 0 = 400_000`
- `income_tax_path_a = graduated_tax(400_000) = (400_000 − 250_000) × 0.15 = 22_500.00`
- `pct_tax_path_a = 24_000.00`
- `total_tax_path_a = 22_500 + 24_000 = 46_500.00`

**PL-04 Comparison:**
- Totals: A=46,500 | B=24,000 | C=44,000
- **Path B recommended**
- `savings_vs_path_c = 44_000 − 24_000 = 20_000`
- `savings_vs_path_a = 46_500 − 24_000 = 22_500`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `taxpayer_class` | `TRADER` |
| `gross_income` | `400_000.00` |
| `recommended_path` | `PATH_B` |
| `savings_vs_next_best` | `20_000.00` |
| `next_best_path` | `PATH_C` |
| `path_c.eight_pct_base` | `550_000.00` |
| `path_c.income_tax` | `44_000.00` |
| `path_c.total_tax` | `44_000.00` |
| `path_b.gross_income` | `400_000.00` |
| `path_b.osd_deduction` | `160_000.00` |
| `path_b.nti` | `240_000.00` |
| `path_b.income_tax` | `0.00` |
| `path_b.percentage_tax` | `24_000.00` |
| `path_b.total_tax` | `24_000.00` |
| `path_a.nti` | `400_000.00` |
| `path_a.income_tax` | `22_500.00` |
| `path_a.total_tax` | `46_500.00` |
| `income_tax_due` | `0.00` |
| `pct_tax_due` | `24_000.00` |
| `balance_payable` | `24_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-A` |

### Verification

**Key TRADER distinction:** Path C uses gross SALES as base (₱800K − ₱250K); Path B uses gross INCOME (= gross sales − COGS = ₱400K) as base for OSD. This is why COGS matters for OSD but not for 8%.

**Path C:** (800,000 − 250,000) × 0.08 = 550,000 × 0.08 = **₱44,000** ✓
**Path B OSD base:** gross_income = 800,000 − 400,000 = **₱400,000** ✓
**Path B NTI:** 400,000 × 0.60 = **₱240,000** (below ₱250K → ₱0 IT) ✓
**Path B PT:** 800,000 × 0.03 = **₱24,000** ✓
**Path B total:** 0 + 24,000 = **₱24,000** ✓
**Savings vs 8%:** 44,000 − 24,000 = **₱20,000** ✓

**Critical architecture note:** For TRADER taxpayers, the engine must compute `gross_income = gross_receipts − cost_of_goods_sold` BEFORE applying OSD. The 8% Path C base remains gross sales (not gross income). This difference is the entire reason OSD can dominate for traders — the OSD reduces a smaller base (gross income, after COGS) while 8% applies to the full gross sales amount.

**Legal basis:** NIRC Sec. 34(L) — OSD = 40% of "gross income" (which for trading businesses = gross sales − COGS per Sec. 32(A)); CR-005 (Path B) and CR-006 (Path C) in computation-rules.md

---

## TV-EDGE-013: SC-AT-250K-EXACT — Exactly ₱250,000 Gross; 8% Base Floored to Zero

**Scenario code:** SC-AT-250K-EXACT
**Edge case:** A service provider's gross receipts are exactly ₱250,000. The 8% base = gross − ₱250,000 = ₱0. Path C income tax = ₱0 × 0.08 = ₱0. The 8% election simultaneously waives the 3% percentage tax obligation. Paths A and B also produce ₱0 income tax (NTI < ₱250K threshold), but still owe ₱7,500 PT. Path C wins with ₱0 total tax.
**Description:** An online English tutor earns exactly ₱250,000 gross receipts with no expenses. This is the minimum gross where Path C's superiority over Paths A/B is maximized (PT savings = ₱7,500, the largest possible PT savings because the 8% IT is simultaneously ₱0).

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | No compensation income |
| `taxpayer_class` | `SERVICE_PROVIDER` | Pure service, no COGS |
| `taxpayer_tier` | `MICRO` | ₱250,000 < ₱3,000,000 |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `250_000.00` | Exactly ₱250,000 |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | No documented expenses |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | On time |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = max(250_000 − 250_000, 0) = max(0, 0) = 0`
- `income_tax_path_c = 0 × 0.08 = 0.00`
- `pct_tax_path_c = 0.00` (8% election waives PT obligation even when base = ₱0)
- `total_tax_path_c = 0.00`

**PL-03 Path B:**
- `nti_path_b = 250_000 × 0.60 = 150_000`
- `income_tax_path_b = graduated_tax(150_000) = 0.00` (below ₱250,000 threshold)
- `pct_tax_path_b = 250_000 × 0.03 = 7_500.00`
- `total_tax_path_b = 0 + 7_500 = 7_500.00`

**PL-03 Path A:**
- `nti_path_a = 250_000 − 0 = 250_000`
- `income_tax_path_a = graduated_tax(250_000) = 0.00` (₱250,000 is the floor of the 15% bracket; income AT exactly ₱250,000 → tax = (250,000 − 250,000) × 0.15 = ₱0)
- `pct_tax_path_a = 250_000 × 0.03 = 7_500.00`
- `total_tax_path_a = 0 + 7_500 = 7_500.00`

**PL-04 Comparison:**
- Totals: A=7,500 | B=7,500 | C=0
- **Path C recommended** — only path with ₱0 total tax obligation
- `savings_vs_next_best = 7_500 − 0 = 7_500`
- `next_best_path = PATH_B` (tie-break: PATH_B > PATH_A per INV-RC-05)

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `7_500.00` |
| `next_best_path` | `PATH_B` |
| `path_c.eight_pct_base` | `0.00` |
| `path_c.income_tax` | `0.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `0.00` |
| `path_b.nti` | `150_000.00` |
| `path_b.income_tax` | `0.00` |
| `path_b.percentage_tax` | `7_500.00` |
| `path_b.total_tax` | `7_500.00` |
| `path_a.nti` | `250_000.00` |
| `path_a.income_tax` | `0.00` |
| `path_a.percentage_tax` | `7_500.00` |
| `path_a.total_tax` | `7_500.00` |
| `income_tax_due` | `0.00` |
| `pct_tax_due` | `0.00` |
| `balance_payable` | `0.00` |
| `balance_disposition` | `ZERO_BALANCE` |
| `recommended_form` | `Form 1701A Part IV-B` |
| **Warnings:** | `[WARN-006]` (low income; noting 8% yields ₱0 total tax obligation) |

### Verification

**Key rule:** The graduated bracket table starts at ₱250,001; at exactly ₱250,000 the taxable income equals the floor of the first taxable bracket — income tax = (250,000 − 250,000) × 0.15 = **₱0**. This is NOT below the floor; the floor IS ₱250,000.

**Path C:** max(250,000 − 250,000, 0) = 0; IT = 0 × 0.08 = **₱0**; PT waived = **₱0 total** ✓
**Path B:** NTI = 150,000 < 250,000 → IT = ₱0; PT = 250,000 × 0.03 = **₱7,500** ✓
**Path A:** NTI = 250,000 → IT = ₱0 (at bracket floor); PT = **₱7,500** ✓
**Path C savings:** 7,500 − 0 = **₱7,500** ✓

**Critical implementation note:** The engine must handle `eight_pct_base = max(gross_receipts − 250_000, 0)` with the floor at ₱0. A negative result must be clamped to ₱0; the computed IT is then ₱0 × 0.08 = ₱0. The 8% ELECTION is still valid and still waives the PT obligation even when the resulting IT is ₱0.

**Legal basis:** NIRC Sec. 24(A)(2)(b); NIRC Sec. 24(A)(1) graduated bracket table — ₱250,000 floor is the threshold, not a ₱0.01 trigger

---

## TV-EDGE-014: SC-BE-OSD-8-HI — Exact Tie at ₱437,500 — Upper Boundary of OSD-Wins Window

**Scenario code:** SC-BE-OSD-8-HI
**Edge case:** At exactly ₱437,500 gross receipts, Path C (8%) and Path B (OSD + PT) produce exactly equal total tax of ₱15,000. This is the UPPER boundary of the OSD-wins window (₱400,001–₱437,499). At this exact amount, the two paths re-converge and the tie-break rule applies (Path C preferred).
**Description:** A freelance content writer earns exactly ₱437,500. Path C: (437,500 − 250,000) × 0.08 = ₱15,000. Path B: NTI = 262,500; IT = (262,500 − 250,000) × 0.15 = ₱1,875; PT = 437,500 × 0.03 = ₱13,125; total = ₱15,000. TIE → Path C wins.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `437_500.00` | Upper tie boundary |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-03 Path C:**
- `eight_pct_base = 437_500 − 250_000 = 187_500`
- `income_tax_path_c = 187_500 × 0.08 = 15_000.00`
- `pct_tax_path_c = 0.00`
- `total_tax_path_c = 15_000.00`

**PL-03 Path B:**
- `nti_path_b = 437_500 × 0.60 = 262_500`
- `income_tax_path_b = graduated_tax(262_500) = (262_500 − 250_000) × 0.15 = 12_500 × 0.15 = 1_875.00`
- `pct_tax_path_b = 437_500 × 0.03 = 13_125.00`
- `total_tax_path_b = 1_875 + 13_125 = 15_000.00`

**PL-03 Path A:**
- `nti_path_a = 437_500` (no expenses)
- `income_tax_path_a = graduated_tax(437_500) = (437_500 − 250_000) × 0.15 = 187_500 × 0.15 = 28_125.00`
- `pct_tax_path_a = 437_500 × 0.03 = 13_125.00`
- `total_tax_path_a = 28_125 + 13_125 = 41_250.00`

**PL-04 Tie-Break:**
- Path C total = ₱15,000; Path B total = ₱15,000 → TIE between C and B
- Tie-break rule (INV-RC-05): Path C preferred over Path B
- `recommended_path = PATH_C`
- `savings_vs_next_best = 0.00`
- `tie_exists = true`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `0.00` |
| `next_best_path` | `PATH_B` |
| `tie_exists` | `true` |
| `path_c.eight_pct_base` | `187_500.00` |
| `path_c.income_tax` | `15_000.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `15_000.00` |
| `path_b.nti` | `262_500.00` |
| `path_b.income_tax` | `1_875.00` |
| `path_b.percentage_tax` | `13_125.00` |
| `path_b.total_tax` | `15_000.00` |
| `path_a.total_tax` | `41_250.00` |
| `income_tax_due` | `15_000.00` |
| `balance_payable` | `15_000.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701A Part IV-B` |

### Verification

**OSD-wins window derivation:** Between ₱400,000 (lower boundary) and ₱437,500 (upper boundary), Path B total tax < Path C total tax. At both exact boundary values, the totals are equal (₱12,000 at lower, ₱15,000 at upper). At ₱437,501 (one peso above), Path C becomes cheaper again and Path B no longer wins.

**Path C:** (437,500 − 250,000) × 0.08 = 187,500 × 0.08 = **₱15,000** ✓
**Path B:** NTI = 437,500 × 0.60 = 262,500; IT = (262,500 − 250,000) × 0.15 = **₱1,875**; PT = 437,500 × 0.03 = **₱13,125**; total = **₱15,000** ✓
**Tie confirmed:** ₱15,000 = ₱15,000 ✓
**Tie-break:** Path C wins per INV-RC-05 ✓

**Paired test:** This vector must be tested together with TV-EDGE-002 (gross = ₱420,000, where Path B wins) and TV-EDGE-003 (gross = ₱400,000, lower boundary). The three vectors together prove the OSD-wins window is exactly ₱400,001–₱437,499, with ties at both boundaries resolving to Path C.

**Legal basis:** CR-014 breakeven table (regime-comparison-logic.md); CR-005 (Path B); CR-006 (Path C); INV-RC-05 (tie-break ordering)

---

## TV-EDGE-015: SC-NOLCO — NOLCO Carryover Makes Itemized Path Win Over 8%

**Scenario code:** SC-NOLCO
**Edge case:** A sole proprietor with a prior year Net Operating Loss Carry-Over (NOLCO) under itemized deductions (Path A only). NOLCO is NOT available under OSD (Path B) or 8% flat rate (Path C). The NOLCO deduction is large enough to make Path A produce lower total tax than Path C, reversing the typical recommendation.
**Description:** An architect earns ₱1,500,000 gross receipts in TY2025, with ₱800,000 in documented business expenses. They have a ₱200,000 NOLCO carryover from TY2024 (within the 3-year window, not yet expired). Under Path A (itemized): NTI = 1,500,000 − 800,000 − 200,000 = ₱500,000; IT = ₱42,500; PT = ₱45,000; total = **₱87,500**. Under Path C (8%): no NOLCO available; IT = (1,500,000 − 250,000) × 0.08 = ₱100,000; total = **₱100,000**. Path A wins by ₱12,500 — NOLCO makes the difference.

**Tax year:** 2025
**Filing period:** ANNUAL

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | Architectural professional services |
| `taxpayer_tier` | `MICRO` | ₱1.5M < ₱3M |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `1_500_000.00` | Professional fees received |
| `cost_of_goods_sold` | `0.00` | Service provider — no COGS |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `800_000.00` | Office rent ₱360K + salary/benefits ₱240K + utilities ₱80K + depreciation ₱120K |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode |
| `prior_quarter_payments` | `0.00` | Simplified: no quarterly payments |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | |
| `is_first_year_registrant` | `false` | |
| `registration_quarter` | `null` | |
| `nolco_carryover` | `200_000.00` | TY2024 net operating loss; expires TY2027; fully applied this year |

### Expected Intermediate Values

**PL-02 Classification:**
- `income_type = PURELY_SE`
- `taxpayer_class = SERVICE_PROVIDER`
- `nolco_available = true` (nolco_carryover = ₱200,000 > ₱0)
- `nolco_deductible_under_path_a = true`
- `nolco_deductible_under_path_b = false` (OSD replaces all deductions; NOLCO not applicable)
- `nolco_deductible_under_path_c = false` (8% flat rate; no deductions of any kind)

**PL-03 Path A (Itemized + NOLCO):**
- `gross_income_a = 1_500_000` (service provider; gross_income = gross_receipts)
- `itemized_deductions_allowed = 800_000`
- `nolco_applied = 200_000` (full carryover applied, remaining NOLCO = ₱0 after this year)
- `nti_path_a = 1_500_000 − 800_000 − 200_000 = 500_000`
- `income_tax_path_a = graduated_tax(500_000) = 22_500 + (500_000 − 400_000) × 0.20 = 22_500 + 20_000 = 42_500.00`
- `pct_tax_path_a = 1_500_000 × 0.03 = 45_000.00`
- `total_tax_path_a = 42_500 + 45_000 = 87_500.00`

**PL-03 Path B (OSD — NOLCO NOT available):**
- `nti_path_b = 1_500_000 × 0.60 = 900_000`
- `income_tax_path_b = graduated_tax(900_000) = 102_500 + (900_000 − 800_000) × 0.25 = 102_500 + 25_000 = 127_500.00`
- `pct_tax_path_b = 45_000.00`
- `total_tax_path_b = 127_500 + 45_000 = 172_500.00`

**PL-03 Path C (8% — NOLCO NOT available):**
- `eight_pct_base = 1_500_000 − 250_000 = 1_250_000`
- `income_tax_path_c = 1_250_000 × 0.08 = 100_000.00`
- `pct_tax_path_c = 0.00`
- `total_tax_path_c = 100_000.00`

**PL-04 Comparison:**
- Totals: A=87,500 | B=172,500 | C=100,000
- `min(87_500, 172_500, 100_000) = 87_500` → **Path A recommended**
- `savings_vs_next_best = 100_000 − 87_500 = 12_500` (vs Path C, the next-best)

**MRF flags raised:**
- `MRF-NOLCO-001` — "NOLCO carryover of ₱200,000 applied. Retain TY2024 ITR and financial statements showing the net operating loss as supporting documentation. NOLCO is deductible only under the Itemized Deduction method."

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `recommended_path` | `PATH_A` |
| `savings_vs_next_best` | `12_500.00` |
| `next_best_path` | `PATH_C` |
| `path_a.nti` | `500_000.00` |
| `path_a.itemized_deductions_used` | `800_000.00` |
| `path_a.nolco_applied` | `200_000.00` |
| `path_a.income_tax` | `42_500.00` |
| `path_a.percentage_tax` | `45_000.00` |
| `path_a.total_tax` | `87_500.00` |
| `path_b.nti` | `900_000.00` |
| `path_b.income_tax` | `127_500.00` |
| `path_b.total_tax` | `172_500.00` |
| `path_c.eight_pct_base` | `1_250_000.00` |
| `path_c.income_tax` | `100_000.00` |
| `path_c.total_tax` | `100_000.00` |
| `path_c.note` | `"NOLCO carryover not applicable under 8% option"` |
| `income_tax_due` | `42_500.00` |
| `pct_tax_due` | `45_000.00` |
| `balance_payable` | `87_500.00` |
| `balance_disposition` | `BALANCE_PAYABLE` |
| `recommended_form` | `Form 1701 (Path A requires 1701, not 1701A)` |
| **Warnings:** | `[WARN-003]` (Path A requires receipt/documentation; NOLCO documentation required) |
| **Manual Review Flags:** | `[MRF-NOLCO-001]` (NOLCO carryover documentation required) |

### Verification

**NOLCO deduction impact:**
- Without NOLCO: Path A NTI = 1,500,000 − 800,000 = 700,000; IT = (700,000 − 400,000) × 0.20 + 22,500 = 60,000 + 22,500 = **₱82,500**; PT = **₱45,000**; Total Path A (no NOLCO) = **₱127,500**
- With NOLCO (₱200,000 carryover): NTI reduced by ₱200,000 → 500,000; IT = **₱42,500**; Total Path A (with NOLCO) = **₱87,500**
- NOLCO benefit = ₱127,500 − ₱87,500 = **₱40,000 tax reduction**
- Path C total (no NOLCO available): (1,500,000 − 250,000) × 0.08 = **₱100,000**
- Path A with NOLCO (**₱87,500**) beats Path C (**₱100,000**) by **₱12,500** ✓

**Key NOLCO rule confirmed:** NOLCO is deductible ONLY under itemized deductions (Path A). It does NOT apply under OSD (Path B) or the 8% option (Path C). This means a taxpayer with a NOLCO carryover might prefer Path A even when, absent NOLCO, Path C would be the better choice.

**NOLCO expiry:** TY2024 NOLCO expires in TY2027 (3-year carryover period per NIRC Sec. 34(D)(3)). If not used by TY2027, the ₱200,000 is forfeited.

**Legal basis:** NIRC Sec. 34(D)(3) — NOLCO; NIRC Sec. 34(L) — OSD replaces all itemized deductions including NOLCO; RR No. 14-2001 — NOLCO computation and carry-over rules; CR-027 (Path A pseudocode in computation-rules.md)

---

## TV-EDGE-016: SC-FIRST-MID-Q4 — Registered in Q4; No Quarterly Returns; Annual is First Filing

**Scenario code:** SC-FIRST-MID-Q4
**Edge case:** A taxpayer who registered with BIR in Q4 (October–December 2025). Since there are no quarterly income tax return obligations until Q1 of the following year (for 8% election) or until the first quarter of registration, the taxpayer has no Q1, Q2, or Q3 quarterly 1701Q returns for TY2025. The annual 1701A (or 1701) due April 15, 2026 is their FIRST and ONLY income tax filing for TY2025. The 8% election is made on the annual return (or on the first quarterly return in the following year if they want quarterly filing — but for the first tax year, the election is on the annual).
**Description:** A freelance web developer registered with BIR on November 3, 2025 (Q4). They earned ₱220,000 from November 3 to December 31, 2025. Since gross < ₱250,000, Path C yields ₱0 income tax. Path B and A also yield ₱0 income tax (NTI below threshold). But Paths B and A owe ₱6,600 percentage tax. Path C (8% election at annual) wins with ₱0 total tax. No quarterly 1701Q was required for TY2025.

**Tax year:** 2025
**Filing period:** ANNUAL
**Important note:** For a Q4 registrant under 8%, the election is signified on the annual 1701A itself (not on a 1701Q, since no quarterly return was due). For subsequent years, the election is signified on the Q1 1701Q.

### Input (TaxpayerInput)

| Field | Value | Notes |
|-------|-------|-------|
| `taxpayer_type` | `PURELY_SE` | |
| `taxpayer_class` | `SERVICE_PROVIDER` | |
| `taxpayer_tier` | `MICRO` | First year — default MICRO |
| `tax_year` | `2025` | |
| `filing_period` | `ANNUAL` | |
| `gross_receipts` | `220_000.00` | November 3 – December 31, 2025 |
| `cost_of_goods_sold` | `0.00` | |
| `gross_other_income` | `0.00` | |
| `taxable_compensation` | `0.00` | |
| `compensation_cwt` | `0.00` | |
| `itemized_deductions` | `0.00` | |
| `is_vat_registered` | `false` | |
| `elected_regime` | `null` | Optimizer mode; election signified on annual 1701A |
| `prior_quarter_payments` | `0.00` | No quarterly 1701Q was filed or due for TY2025 |
| `cwt_credits_income_tax` | `0.00` | |
| `cwt_credits_percentage_tax` | `0.00` | |
| `filing_date` | `2026-04-15` | Annual 1701A due |
| `is_first_year_registrant` | `true` | First year |
| `registration_quarter` | `4` | Registered in Q4 (October–December) |
| `nolco_carryover` | `0.00` | |

### Expected Intermediate Values

**PL-02 Classification:**
- `is_first_year_registrant = true`
- `registration_quarter = 4` → no quarterly 1701Q required for TY2025; no Q1/Q2/Q3 returns; annual is the only required IT return
- `tier = MICRO` (default first year)
- `eight_pct_eligible = true` (₱220,000 ≤ ₱3M)
- Note output field: `no_quarterly_returns_required = true` (Q4 registrant for TY2025)
- Note output field: `election_on_annual_return = true` (8% election signified on annual 1701A, not on a quarterly 1701Q)

**PL-03 Path C:**
- `eight_pct_base = max(220_000 − 250_000, 0) = max(−30_000, 0) = 0`
- `income_tax_path_c = 0 × 0.08 = 0.00`
- `pct_tax_path_c = 0.00` (8% election waives PT)
- `total_tax_path_c = 0.00`

**PL-03 Path B:**
- `nti_path_b = 220_000 × 0.60 = 132_000`
- `income_tax_path_b = graduated_tax(132_000) = 0.00` (< ₱250K)
- `pct_tax_path_b = 220_000 × 0.03 = 6_600.00`
- `total_tax_path_b = 0 + 6_600 = 6_600.00`

**PL-03 Path A:**
- `nti_path_a = 220_000`
- `income_tax_path_a = graduated_tax(220_000) = 0.00` (< ₱250K)
- `pct_tax_path_a = 6_600.00`
- `total_tax_path_a = 6_600.00`

**PL-04 Comparison:**
- Totals: A=6,600 | B=6,600 | C=0
- **Path C recommended** — only path with ₱0 total tax obligation
- `savings_vs_next_best = 6_600`

**PL-05 Annual Credits:**
- `quarterly_payments_credited = 0.00` (no quarterly 1701Q filed)
- `income_tax_due = 0.00`
- `balance_payable = 0.00`
- `balance_disposition = ZERO_BALANCE`

### Expected Final Output (TaxComputationResult)

| Field | Value |
|-------|-------|
| `taxpayer_type` | `PURELY_SE` |
| `taxpayer_tier` | `MICRO` |
| `is_first_year_registrant` | `true` |
| `registration_quarter` | `4` |
| `no_quarterly_returns_required_ty` | `true` |
| `election_on_annual_return` | `true` |
| `recommended_path` | `PATH_C` |
| `savings_vs_next_best` | `6_600.00` |
| `next_best_path` | `PATH_B` |
| `path_c.eight_pct_base` | `0.00` |
| `path_c.income_tax` | `0.00` |
| `path_c.percentage_tax` | `0.00` |
| `path_c.total_tax` | `0.00` |
| `path_b.total_tax` | `6_600.00` |
| `path_a.total_tax` | `6_600.00` |
| `income_tax_due` | `0.00` |
| `pct_tax_due` | `0.00` |
| `quarterly_payments_credited` | `0.00` |
| `balance_payable` | `0.00` |
| `balance_disposition` | `ZERO_BALANCE` |
| `recommended_form` | `Form 1701A Part IV-B` |
| **Warnings:** | `[WARN-006]` (low gross income; 8% election yields ₱0 total tax) |
| **Notes:** | `"No quarterly 1701Q was required for TY2025 (Q4 registrant). The 8% election is made on this annual 1701A. For TY2026, if continuing on 8%, signify election on Q1 1701Q (due May 15, 2026)."` |

### Verification

**Q4 registrant rule:** Under NIRC Sec. 74 and RR 8-2018, quarterly 1701Q returns are due 60 days after each quarter end. A Q4 registrant (October–December) would have their first quarterly obligation for Q1 of the FOLLOWING year (January–March 2026, due May 15, 2026). No quarterly return is required for TY2025 itself.

**Path C with sub-₱250K gross:** (220,000 − 250,000) → negative → floored at **₱0**; IT = **₱0**; PT waived = **₱0 total** ✓
**Path B:** NTI = 132,000 < 250,000 → IT = ₱0; PT = 220,000 × 0.03 = **₱6,600** ✓
**Savings:** 6,600 − 0 = **₱6,600** ✓

**Critical sequence for following year:** In TY2026, if this taxpayer wants to continue on 8%, they must signify the election on the Q1 TY2026 Form 1701Q (due May 15, 2026). The engine must note this in the output when `registration_quarter = 4` and `elected_regime = PATH_C`.

**Legal basis:** NIRC Sec. 74 (quarterly returns); NIRC Sec. 24(A)(2)(b) (8% option); RR 8-2018 Sec. 3 (election procedure — first return of the taxable year); RR 8-2024 (EOPT tier classification for new registrants)
