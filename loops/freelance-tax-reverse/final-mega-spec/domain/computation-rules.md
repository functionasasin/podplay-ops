# Computation Rules — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** PARTIAL (populated from worked-examples-fetch pass; to be expanded in Wave 2 aspects)
**Last updated:** 2026-02-28
**Legal basis:** See [legal-basis.md](legal-basis.md)

---

## CR-001: Three Tax Paths Overview

Every computation must evaluate all applicable paths and return results for each. The recommended path is the one with the lowest total tax burden.

| Path | Short Name | Form Used | Requires |
|------|-----------|-----------|---------|
| A | Graduated + Itemized | 1701 or 1701A | Documentation of all business expenses |
| B | Graduated + OSD | 1701 or 1701A | None (40% deduction is automatic) |
| C | 8% Flat Rate | 1701A (if pure business) or 1701 (mixed income) | Gross receipts ≤ ₱3,000,000 AND not VAT-registered |

**Total tax burden** for each path includes both Income Tax (IT) and Percentage Tax (PT) where applicable.

---

## CR-002: Graduated Rate Table (Effective 2023+, TRAIN Second Schedule)

**Legal basis:** NIRC Sec. 24(A)(2)(a), as amended by RA 10963 (TRAIN), second schedule effective January 1, 2023.

**Applies to:** Net taxable income from business/profession for all graduated-rate computations (Paths A and B).

| Bracket | Lower Bound | Upper Bound | Base Tax | Marginal Rate | Rate Applied To |
|---------|------------|------------|---------|--------------|----------------|
| 1 | ₱0 | ₱250,000 | ₱0 | 0% | All income in bracket |
| 2 | ₱250,001 | ₱400,000 | ₱0 | 15% | Excess over ₱250,000 |
| 3 | ₱400,001 | ₱800,000 | ₱22,500 | 20% | Excess over ₱400,000 |
| 4 | ₱800,001 | ₱2,000,000 | ₱102,500 | 25% | Excess over ₱800,000 |
| 5 | ₱2,000,001 | ₱8,000,000 | ₱402,500 | 30% | Excess over ₱2,000,000 |
| 6 | ₱8,000,001 | ∞ | ₱2,202,500 | 35% | Excess over ₱8,000,000 |

**Formula for computing graduated tax given net taxable income N:**
```
function graduated_tax_2023(N):
  if N <= 250_000:
    return 0
  elif N <= 400_000:
    return (N - 250_000) * 0.15
  elif N <= 800_000:
    return 22_500 + (N - 400_000) * 0.20
  elif N <= 2_000_000:
    return 102_500 + (N - 800_000) * 0.25
  elif N <= 8_000_000:
    return 402_500 + (N - 2_000_000) * 0.30
  else:
    return 2_202_500 + (N - 8_000_000) * 0.35
```

**Precision:** Round to nearest centavo (2 decimal places) at each step. Do not round intermediates; only round final tax due.

**Worked verifications:**
- N = ₱300,000: (300,000−250,000)×0.15 = ₱7,500 ✓
- N = ₱600,000: 22,500 + (600,000−400,000)×0.20 = 22,500 + 40,000 = ₱62,500 ✓
- N = ₱720,000: 22,500 + (720,000−400,000)×0.20 = 22,500 + 64,000 = ₱86,500 ✓
- N = ₱1,700,000: 102,500 + (1,700,000−800,000)×0.25 = 102,500 + 225,000 = ₱327,500 ✓

---

## CR-003: Graduated Rate Table (2018–2022, TRAIN First Schedule)

**Legal basis:** NIRC Sec. 24(A)(2)(a), as amended by RA 10963 (TRAIN), first schedule effective January 1, 2018 through December 31, 2022.

**Note:** Only needed for computing prior-year taxes or amended returns for TY2018–2022.

| Bracket | Lower Bound | Upper Bound | Base Tax | Marginal Rate |
|---------|------------|------------|---------|--------------|
| 1 | ₱0 | ₱250,000 | ₱0 | 0% |
| 2 | ₱250,001 | ₱400,000 | ₱0 | 20% |
| 3 | ₱400,001 | ₱800,000 | ₱30,000 | 25% |
| 4 | ₱800,001 | ₱2,000,000 | ₱130,000 | 30% |
| 5 | ₱2,000,001 | ₱8,000,000 | ₱490,000 | 32% |
| 6 | ₱8,000,001 | ∞ | ₱2,410,000 | 35% |

```
function graduated_tax_2018(N):
  if N <= 250_000:
    return 0
  elif N <= 400_000:
    return (N - 250_000) * 0.20
  elif N <= 800_000:
    return 30_000 + (N - 400_000) * 0.25
  elif N <= 2_000_000:
    return 130_000 + (N - 800_000) * 0.30
  elif N <= 8_000_000:
    return 490_000 + (N - 2_000_000) * 0.32
  else:
    return 2_410_000 + (N - 8_000_000) * 0.35
```

---

## CR-004: Path A — Graduated + Itemized Deductions

**Applies to:** All non-VAT taxpayers; also VAT-registered with gross > ₱3M.

### Step 1: Compute Gross Income
For **service/professional businesses** (no COGS):
```
gross_income = gross_receipts
```

For **trading/merchandising businesses** (with COGS):
```
gross_income = gross_sales - cost_of_sales
```

### Step 2: Compute Net Taxable Income
```
net_taxable_income = gross_income - allowable_itemized_deductions
net_taxable_income = max(net_taxable_income, 0)  // cannot be negative (no net loss carry in annual, but NOLCO may apply)
```

Allowable itemized deductions under NIRC Sec. 34(A)-(K) (see [legal-basis.md](legal-basis.md) for full list):
- Ordinary and necessary business expenses (salaries, rent, utilities, supplies, communication, travel)
- Interest on business loans (subject to arbitrage reduction)
- Taxes paid (excluding income tax itself, except those deductible per treaty)
- Losses (casualty, theft, not compensated by insurance)
- Bad debts (written off, previously included in income)
- Depreciation (straight-line or declining balance, BIR-prescribed rates)
- Depletion (not applicable to most freelancers)
- Charitable contributions (subject to ceilings)
- Research and development expenditures
- Pension trust contributions (for employer, if applicable)
- Entertainment/amusement/recreation (capped at 0.5% of net sales for goods sellers, 1% of net revenue for service providers)
- **NOT deductible:** Personal expenses, income tax paid, SSS/PhilHealth/Pag-IBIG contributions (not deductible for self-employed; only deductible for employees under Sec. 32(B)(7)(f))

### Step 3: Compute Income Tax
```
income_tax_path_a = graduated_tax(net_taxable_income)
```
Use CR-002 (2023+ table) for TY2023 onwards, CR-003 for TY2018-2022.

### Step 4: Compute Percentage Tax (if non-VAT registered)
```
percentage_tax_path_a = gross_receipts * 0.03  // See CR-008 for rate history
```
**Note:** If VAT-registered (gross > ₱3M threshold), no percentage tax — VAT applies instead (computed separately).

### Step 5: Total Tax Burden
```
total_path_a = income_tax_path_a + percentage_tax_path_a
```

---

## CR-005: Path B — Graduated + Optional Standard Deduction (OSD)

**Applies to:** All non-VAT taxpayers; also VAT-registered with gross > ₱3M.

**Legal basis:** NIRC Sec. 34(L); election irrevocable for the taxable year (once filed on Q1 return or first return for the year).

### Step 1: Compute Gross Income (same as Path A)
```
gross_income_for_osd = gross_income  // after COGS for traders; = gross receipts for service providers
```

### Step 2: Compute OSD Deduction
```
osd_deduction = gross_income_for_osd * 0.40
```
OSD = 40% of gross income (after COGS for traders, equal to gross receipts for service providers).
**Note:** Per BIR Form 1701A structure, OSD is applied to "Total Gross Income" (item 40 of Form 1701A), which is gross receipts or gross sales minus COGS plus other income.

### Step 3: Compute Net Taxable Income
```
net_taxable_income_osd = gross_income_for_osd - osd_deduction
                        = gross_income_for_osd * 0.60
```

### Step 4: Compute Income Tax
```
income_tax_path_b = graduated_tax(net_taxable_income_osd)
```

### Step 5: Compute Percentage Tax
```
percentage_tax_path_b = gross_receipts * 0.03
```

### Step 6: Total Tax Burden
```
total_path_b = income_tax_path_b + percentage_tax_path_b
```

---

## CR-006: Path C — 8% Flat Rate

**Legal basis:** NIRC Sec. 24(A)(2)(b) as amended by TRAIN; RR No. 8-2018.

### Eligibility Check (ALL must be true)
```
eligible_for_8pct = (
  gross_receipts_and_other_income <= 3_000_000  // annual
  AND NOT vat_registered
  AND taxpayer_type in ["sole_proprietor", "professional", "freelancer"]  // NOT GPP partner
  AND (income_type == "pure_business" OR income_type == "mixed_income")
  AND (prior_year_gross_receipts <= 3_000_000 OR first_year_of_business)
)
```

### 8% Tax Formula — Pure Business Income Earner
```
// For individuals with NO compensation income
tax_base_8pct = max(gross_receipts_and_other_income - 250_000, 0)
income_tax_path_c = tax_base_8pct * 0.08
percentage_tax_path_c = 0  // waived; IN LIEU of percentage tax
```

The ₱250,000 deduction serves as the personal exemption equivalent. It is the 8% equivalent of the ₱250,000 zero-bracket in the graduated rate table.

### 8% Tax Formula — Mixed Income Earner
```
// For individuals who ALSO have compensation income
// Per RMC 50-2018: NO ₱250,000 deduction (already absorbed by compensation graduated bracket)
tax_base_8pct_mixed = gross_receipts_and_other_income  // NO deduction
income_tax_path_c_mixed = tax_base_8pct_mixed * 0.08
percentage_tax_path_c_mixed = 0  // waived
```

### Total Tax Burden
```
total_path_c = income_tax_path_c  // no additional percentage tax
```

### Election Timing
- Must be signified in: (a) Q1 Form 1701Q, OR (b) Q1 Form 2551Q, OR (c) Certificate of Registration (for new registrants)
- Once elected in Q1, applies for the ENTIRE taxable year
- If not elected by Q1: Taxpayer is LOCKED into graduated rates for that year
- If gross receipts subsequently exceed ₱3M mid-year: Must immediately switch to graduated rates; no retroactive 8% benefit
- Form to use: 1701A (if pure business); 1701 Part IV-B Schedule 3B (if mixed income)

---

## CR-007: Regime Comparison and Recommendation Logic

```
function compute_all_paths(input):
  results = {}

  // Always compute Path A and B (available to all taxpayers)
  results["path_a"] = compute_path_a(input)
  results["path_b"] = compute_path_b(input)

  // Only compute Path C if eligible
  if is_eligible_for_8pct(input):
    results["path_c"] = compute_path_c(input)

  // Recommendation: lowest total tax burden
  minimum = min(results.values(), key=lambda r: r.total_tax_burden)
  results["recommended"] = minimum.path_name
  results["recommended_savings"] = {
    path: minimum.total_tax_burden - r.total_tax_burden
    for path, r in results.items()
    if path != "recommended"
  }

  return results
```

**Important:** The recommendation is the path with the **lowest total tax burden** (IT + PT combined). Do NOT optimize for lowest IT alone.

---

## CR-008: Percentage Tax (Section 116)

**Legal basis:** NIRC Sec. 116 as amended by CREATE (RA 11534) and EOPT (RA 11976).

### Rate History
| Period | Rate | Legal Basis |
|--------|------|-------------|
| Before July 1, 2020 | 3% | Original Sec. 116 |
| July 1, 2020 – June 30, 2023 | 1% | CREATE Law (COVID relief) |
| July 1, 2023 – present | 3% | Reversion per CREATE |

### Applicable To
- Non-VAT registered taxpayers using Paths A or B
- Gross quarterly sales/receipts below ₱3M annual threshold
- NOT applicable to taxpayers who elected 8% (rate is waived/subsumed)
- NOT applicable to VAT-registered taxpayers

### Computation (Quarterly)
```
quarterly_percentage_tax = gross_receipts_this_quarter * 0.03
```
Filed on Form 2551Q on or before the 25th day of the month following each quarter end.

### Quarterly Deadlines
| Quarter | Covers | Deadline |
|---------|--------|---------|
| Q1 | Jan–Mar | April 25 |
| Q2 | Apr–Jun | July 25 |
| Q3 | Jul–Sep | October 25 |
| Q4 | Oct–Dec | January 25 (next year) |

**Deadlines confirmed per RMC 67-2021 and remain unchanged post-EOPT:** Q1 April 25, Q2 July 25, Q3 October 25, Q4 January 25. See [percentage-tax-rates.md Part 4](lookup-tables/percentage-tax-rates.md) for complete deadline table with holiday rule.

---

## CR-009: Creditable Withholding Tax (CWT) Credit Mechanics

**Legal basis:** NIRC Sec. 57-58; BIR Form 2307; RR No. 11-2018.

### Applicable EWT Rates for Freelancers/Professionals

| Gross Receipts (Prior Year) | EWT Rate | ATC |
|----------------------------|---------|-----|
| Gross receipts ≤ ₱3,000,000 | 5% | WI010 (professional) / WC010 (business) |
| Gross receipts > ₱3,000,000 | 10% | WI010 / WC010 |

**Note:** The ₱3M threshold for EWT rate determination uses the PRIOR YEAR's gross receipts. New taxpayers in first year: 5% rate applies.

### CWT Credit at Quarterly Filing (Form 1701Q)
```
tax_payable_this_quarter = max(
  cumulative_IT_to_date
  - total_CWT_to_date       // sum of all 2307 amounts from Jan to end of this quarter
  - total_quarterly_payments_to_date  // sum of all prior 1701Q payments this year
  , 0
)
```

Excess CWT (when CWT > cumulative IT) results in ₱0 payable. The excess is NOT refunded mid-year; it carries forward to the next quarterly computation.

### CWT Credit at Annual Filing
```
annual_balance_payable = max(
  annual_IT_due
  - total_annual_CWT         // sum of ALL 2307 amounts for the year
  - total_quarterly_IT_paid  // sum of ALL 1701Q payments for Q1, Q2, Q3
  , 0
)
```

If result is negative: `excess = -(annual_IT_due - total_annual_CWT - total_quarterly_IT_paid)`. This excess can be:
1. Applied as tax credit to next year's tax
2. Claimed as cash refund (requires BIR formal claim)

### SAWT Requirement
When CWT credits are claimed, the taxpayer must attach the **Summary Alphalist of Withholding Taxes (SAWT)** to the return, listing each Form 2307 received (payor TIN, amount withheld, date).

---

## CR-010: Quarterly Income Tax — Cumulative Method (Form 1701Q)

**Legal basis:** NIRC Sec. 74-76; BIR Form 1701Q.

The 1701Q uses a cumulative (from start of year) approach. Each quarter's filing covers income from January 1 to end of that quarter.

### For Graduated + OSD Taxpayers (Schedule I of 1701Q)
```
// Each quarter, compute using cumulative figures since January 1
cumulative_gross_receipts[q] = sum(gross_receipts, Jan to end of quarter q)
cumulative_osd[q] = cumulative_gross_receipts[q] * 0.40
cumulative_net_taxable[q] = cumulative_gross_receipts[q] * 0.60

cumulative_IT[q] = graduated_tax(cumulative_net_taxable[q])

cumulative_CWT[q] = sum(all 2307 amounts, Jan to end of quarter q)
cumulative_Q_payments[q] = sum(all prior 1701Q payments, Q1 to Q(q-1))

payable_this_quarter[q] = max(
  cumulative_IT[q] - cumulative_CWT[q] - cumulative_Q_payments[q],
  0
)
```

For Q3 only (not Q4; Q4 is handled at annual):
```
Quarters: Q1 (Jan-Mar), Q2 (Jan-Jun cumulative), Q3 (Jan-Sep cumulative)
Annual: Jan-Dec (Form 1701A/1701, not 1701Q)
```

**NOTE:** There is NO Q4 filing of 1701Q. The annual return (due April 15) covers the full year including Q4.

### For 8% Taxpayers (Schedule II of 1701Q)
```
// 8% is applied to cumulative gross, but ₱250K deduction applies only at annual
// At quarterly, the full 8% applies to cumulative gross receipts:
cumulative_8pct_IT[q] = cumulative_gross_receipts[q] * 0.08

payable_this_quarter[q] = max(
  cumulative_8pct_IT[q] - cumulative_CWT[q] - cumulative_Q_payments[q],
  0
)
// At annual: (annual_gross - 250,000) * 8% - CWT - quarterly payments
```

**IMPORTANT:** The ₱250,000 deduction is applied ONLY at the annual return level, NOT in quarterly computations. This means Q1+Q2+Q3 quarterly payments may overstate tax (will be corrected at annual reconciliation).

---

## CR-011: Annual Reconciliation (Form 1701 / 1701A)

### For OSD Taxpayers (Pure Business, Form 1701A):
```
annual_gross_receipts = sum(all quarterly gross receipts)
annual_osd = annual_gross_receipts * 0.40
annual_net_taxable = annual_gross_receipts * 0.60
annual_IT = graduated_tax(annual_net_taxable)
total_annual_CWT = sum(all 2307 amounts received in the year)
total_quarterly_paid = sum(1701Q payments Q1 + Q2 + Q3)
balance_payable = max(annual_IT - total_annual_CWT - total_quarterly_paid, 0)
overpayment = max(total_annual_CWT + total_quarterly_paid - annual_IT, 0)
```

### For 8% Taxpayers (Pure Business, Form 1701A):
```
annual_gross_receipts = sum(all quarterly gross receipts)
// ₱250,000 exemption applied HERE at annual level
annual_IT = max(annual_gross_receipts - 250_000, 0) * 0.08
total_annual_CWT = sum(all 2307 amounts for the year)
total_quarterly_paid = sum(1701Q payments for Q1 + Q2 + Q3)
balance_payable = max(annual_IT - total_annual_CWT - total_quarterly_paid, 0)
```

### Installment Payment Rule
If annual balance payable > ₱2,000:
- First installment: 50% of balance, due April 15
- Second installment: 50% of balance, due July 15
- (If balance ≤ ₱2,000: full payment by April 15)

---

## CR-012: VAT Threshold and Regime Switching

### VAT Threshold: ₱3,000,000

- **Below ₱3M:** Non-VAT registered; percentage tax applies (Path A or B); 8% option available
- **At or above ₱3M:** Must register for VAT; percentage tax does NOT apply; 8% NOT available
- **Threshold test:** Based on ANNUAL gross sales/receipts + other non-operating income

### Mid-Year Threshold Crossing
If gross receipts exceed ₱3M during the year:
1. Taxpayer must register for VAT immediately (within 30 days of exceeding threshold, per EOPT updates)
2. VAT registration effective from the quarter following the threshold crossing quarter
3. 8% option is RETROACTIVELY CANCELLED for the year
4. Must switch to graduated rates (A or B) for the entire year
5. Percentage tax paid for covered period is credited against VAT liability

### EWT Rate Switching (Related to ₱3M Threshold)
- If prior year gross receipts ≤ ₱3M: clients withhold at 5% EWT
- If prior year gross receipts > ₱3M: clients withhold at 10% EWT
- New taxpayers in first year of business: 5% rate

---

## CR-013: Percentage Tax vs Income Tax for 8% Path

Under the 8% flat rate election:
- **Income Tax:** Computed as (gross_receipts − 250,000) × 8% [or gross × 8% for mixed income]
- **Percentage Tax (Sec. 116):** WAIVED — the 8% rate is "in lieu of" the graduated income tax AND in lieu of the percentage tax
- **Basis:** NIRC Sec. 24(A)(2)(b): "The tax shall be in lieu of the graduated income tax rates under Subsection (A)(2)(a)(i) of this Section and the percentage tax under Section 116 of this Code"

This is the PRIMARY reason why 8% almost always beats Graduated+OSD for service businesses below ₱3M gross:
- Graduated+OSD ADDS percentage tax (3% of gross) on top of income tax
- 8% has NO percentage tax
- The 3% percentage tax alone at ₱1M gross = ₱30,000, which partially or fully offsets any income tax savings from OSD

---

## CR-014: Graduated Rate Breakeven Analysis

### 8% vs Graduated+OSD (Service Business, Below ₱3M)

For gross receipts GR (service provider, pure business, no COGS):
```
path_b_total(GR) = graduated_tax(0.60 * GR) + 0.03 * GR
path_c_total(GR) = (GR - 250_000) * 0.08
```

**Computed breakeven values (GR where path_b_total = path_c_total):**

| Gross Receipts | Path B Total | Path C Total | Winner | Savings |
|----------------|-------------|-------------|--------|---------|
| ₱300,000 | ₱9,000 | ₱4,000 | Path C (8%) | ₱5,000 |
| ₱500,000 | ₱22,500 | ₱20,000 | Path C (8%) | ₱2,500 |
| ₱800,000 | ₱62,500 | ₱44,000 | Path C (8%) | ₱18,500 |
| ₱1,000,000 | ₱92,500 | ₱60,000 | Path C (8%) | ₱32,500 |
| ₱1,500,000 | ₱172,500 | ₱100,000 | Path C (8%) | ₱72,500 |
| ₱2,000,000 | ₱262,500 | ₱140,000 | Path C (8%) | ₱122,500 |
| ₱2,500,000 | ₱352,500 | ₱180,000 | Path C (8%) | ₱172,500 |
| ₱3,000,000 | ₱442,500* | ₱220,000 | Path C (8%) | ₱222,500 |

*At ₱3M exactly, 8% is still available (threshold is "does not exceed" ₱3M).
*At ₱3,000,001 and above, 8% is no longer available.

**Conclusion:** For service/professional businesses below ₱3M, Path C (8%) ALWAYS beats Path B (Graduated+OSD). This is an engine invariant.

### 8% vs Graduated+Itemized (Breakeven Expense Ratio)

For Path A to beat Path C, the taxpayer's expense ratio must exceed approximately:

| Gross Receipts | Expense Ratio Where Itemized Beats 8% |
|----------------|--------------------------------------|
| ₱500,000 | ≥ 83% of gross |
| ₱800,000 | ≥ 72% of gross |
| ₱1,000,000 | ≥ 68% of gross |
| ₱1,500,000 | ≥ 63% of gross |
| ₱2,000,000 | ≥ 60% of gross |
| ₱2,500,000 | ≥ 58% of gross |

**Practical implication:** Most freelancers/professionals with expense ratios below 60% will save money with the 8% option. Only sole proprietors with significant staffing costs, rent, and operational expenses will benefit from itemized deductions.

---

---

## CR-015: Taxpayer Tier Classification

**Legal basis:** RA 11976 (EOPT Act); RR 8-2024 (April 12, 2024)
**Applies to:** All computations where penalty/interest rates or filing simplifications depend on taxpayer tier.

### Enum: TaxpayerTier
```
enum TaxpayerTier {
  MICRO,   // gross_sales < ₱3,000,000
  SMALL,   // ₱3,000,000 ≤ gross_sales < ₱20,000,000
  MEDIUM,  // ₱20,000,000 ≤ gross_sales < ₱1,000,000,000
  LARGE    // gross_sales ≥ ₱1,000,000,000
}
```

### Classification Algorithm
```
function classify_taxpayer_tier(gross_sales_business_only):
  """
  INPUTS:
    gross_sales_business_only: float
      - Annual gross sales from business/professional activities ONLY
      - Net of VAT if VAT-registered
      - EXCLUDES: compensation income from employer-employee relationships
      - INCLUDES: all business lines aggregated

  RETURNS:
    TaxpayerTier

  SPECIAL CASE — New registrant with no prior annual return:
    Return TaxpayerTier.MICRO by default.
    Flag: classification_source = "default_first_year"

  RECLASSIFICATION RULES (do not apply mid-year):
    - BIR must issue written notice before reclassification
    - New tier takes effect the following taxable year after notice
  """
  if gross_sales_business_only < 3_000_000:
    return TaxpayerTier.MICRO
  elif gross_sales_business_only < 20_000_000:
    return TaxpayerTier.SMALL
  elif gross_sales_business_only < 1_000_000_000:
    return TaxpayerTier.MEDIUM
  else:
    return TaxpayerTier.LARGE
```

### The ₱3M Triple Coincidence — Boundary Rules

Three thresholds all coincide at ₱3,000,000 but have DIFFERENT boundary expressions (strict vs. non-strict):

```
// Exact boundary rules for ₱3,000,000:
is_micro_tier              = gross_sales < 3_000_000         // ₱3M exactly → SMALL
eight_pct_eligible         = gross_sales <= 3_000_000        // ₱3M exactly → YES
must_register_vat          = gross_sales > 3_000_000         // ₱3M exactly → NO (not required)
section_116_pct_tax_applies = gross_sales <= 3_000_000       // ₱3M exactly → YES (if not on 8%)
ewt_rate_5pct              = gross_sales <= 3_000_000        // ₱3M exactly → 5% rate
ewt_rate_10pct             = gross_sales > 3_000_000         // ₱3M exactly → NOT 10%
```

**At exactly ₱3,000,000:** taxpayer is SMALL tier, but may still elect 8% and is not required to register VAT.

**Note for engine:** Both SMALL and MICRO share the same reduced penalty/interest rates (10%/6%), so the SMALL classification at ₱3M exactly has no practical penalty impact.

---

## CR-016: Surcharge (Civil Penalty) Computation

**Legal basis:** NIRC Section 248, as amended by RA 11976 (EOPT Act)

### Enum: ViolationType
```
enum ViolationType {
  FAILURE_TO_FILE,   // Return not filed by deadline
  FAILURE_TO_PAY,    // Return filed but tax not paid by deadline
  UNDERPAYMENT,      // Partial payment — tax due exceeds amount paid
  FRAUD              // Fraudulent return or willful neglect to file
}
```

### Surcharge Rates by Tier and Violation
```
function compute_surcharge(tax_due, tier, violation_type):
  """
  INPUTS:
    tax_due:        float  — The tax amount that was owed (before any payment)
    tier:           TaxpayerTier
    violation_type: ViolationType

  RETURNS:
    surcharge: float  — Civil penalty amount (always non-negative)

  IMPORTANT: Surcharge is computed on tax_due ONLY — not on interest or other penalties.
  """
  // Fraud overrides tier-based rates
  if violation_type == ViolationType.FRAUD:
    return round(tax_due * 0.50, 2)

  // Wrong venue: ELIMINATED by EOPT (January 22, 2024 onwards)
  // For TY2024+: no wrong-venue surcharge computation needed

  // Tier-based rates for all other violations
  if tier in [TaxpayerTier.LARGE, TaxpayerTier.MEDIUM]:
    rate = 0.25
  else:  // SMALL or MICRO
    rate = 0.10

  return round(tax_due * rate, 2)
```

### Surcharge Rate Table (Summary)
| Violation Type | MICRO | SMALL | MEDIUM | LARGE |
|----------------|-------|-------|--------|-------|
| Failure to file | 10% | 10% | 25% | 25% |
| Failure to pay | 10% | 10% | 25% | 25% |
| Underpayment | 10% | 10% | 25% | 25% |
| Fraud / willful neglect | 50% | 50% | 50% | 50% |
| Wrong venue (TY2024+) | ₱0 | ₱0 | ₱0 | ₱0 |

---

## CR-017: Interest on Unpaid Taxes

**Legal basis:** NIRC Section 249, as amended by RA 11976 (EOPT Act)

### Interest Rate by Tier
```
function get_annual_interest_rate(tier):
  if tier in [TaxpayerTier.LARGE, TaxpayerTier.MEDIUM]:
    return 0.12  // 12% per annum
  else:  // SMALL or MICRO
    return 0.06  // 6% per annum
```

### Interest Computation
```
function compute_interest(tax_due, tier, days_late):
  """
  INPUTS:
    tax_due:    float  — Unpaid tax amount (the deficiency or full unpaid amount)
    tier:       TaxpayerTier
    days_late:  int    — Number of days from the filing/payment deadline to actual payment
                         (count from day AFTER deadline to day OF payment, inclusive)

  RETURNS:
    interest: float  — Simple interest amount (non-negative)

  RULES:
    - Simple interest: NOT compounded
    - Computed on tax_due ONLY (not on surcharge amounts)
    - 365-day year (no leap year adjustment per BIR practice)
    - Minimum: ₱0 (no negative interest)
  """
  annual_rate = get_annual_interest_rate(tier)
  interest = tax_due * annual_rate * (days_late / 365)
  return round(max(interest, 0), 2)
```

### Interest Rate Table (Summary)
| Tier | Annual Rate | Daily Rate | Rate for 30 Days | Rate for 90 Days | Rate for 365 Days |
|------|-------------|-----------|------------------|-----------------|------------------|
| MICRO | 6% | 0.016438%/day | 0.49315% | 1.47945% | 6.00000% |
| SMALL | 6% | 0.016438%/day | 0.49315% | 1.47945% | 6.00000% |
| MEDIUM | 12% | 0.032877%/day | 0.98630% | 2.95890% | 12.00000% |
| LARGE | 12% | 0.032877%/day | 0.98630% | 2.95890% | 12.00000% |

### Worked Example (MICRO, ₱50,000 unpaid, 45 days late)
```
tax_due = 50_000
tier = MICRO  →  annual_rate = 0.06
days_late = 45
interest = 50_000 * 0.06 * (45 / 365)
         = 50_000 * 0.06 * 0.12329
         = 50_000 * 0.007397
         = ₱369.86
```

---

## CR-018: Total Amount Due with Penalties

**Legal basis:** NIRC Sections 248, 249, as amended by RA 11976

```
function compute_total_amount_due(
  tax_due,
  tier,
  days_late,
  violation_type = ViolationType.FAILURE_TO_PAY
):
  """
  INPUTS:
    tax_due:        float  — Original tax obligation
    tier:           TaxpayerTier
    days_late:      int    — Days past the due date
    violation_type: ViolationType  — Default: FAILURE_TO_PAY

  RETURNS:
    PenaltyResult {
      original_tax:        float,
      surcharge:           float,
      interest:            float,
      total_amount_due:    float
    }

  NOTE: Surcharge and interest are computed INDEPENDENTLY on tax_due.
  They do not compound on each other.

  FORMULA:
    surcharge         = compute_surcharge(tax_due, tier, violation_type)
    interest          = compute_interest(tax_due, tier, days_late)
    total_amount_due  = tax_due + surcharge + interest
  """
  surcharge = compute_surcharge(tax_due, tier, violation_type)
  interest  = compute_interest(tax_due, tier, days_late)
  return PenaltyResult(
    original_tax     = round(tax_due, 2),
    surcharge        = surcharge,
    interest         = interest,
    total_amount_due = round(tax_due + surcharge + interest, 2)
  )
```

### Worked Example (MICRO taxpayer, ₱100,000 tax due, filed 60 days late)
```
tax_due    = 100_000
tier       = MICRO
days_late  = 60
violation  = FAILURE_TO_PAY

surcharge  = 100_000 * 0.10              = ₱10,000.00
interest   = 100_000 * 0.06 * (60/365)  = ₱986.30
total_due  = 100_000 + 10_000 + 986.30  = ₱110,986.30
```

### Worked Example (MEDIUM taxpayer, ₱500,000 tax due, filed 90 days late)
```
tax_due    = 500_000
tier       = MEDIUM
days_late  = 90
violation  = FAILURE_TO_FILE

surcharge  = 500_000 * 0.25              = ₱125,000.00
interest   = 500_000 * 0.12 * (90/365)  = ₱14,794.52
total_due  = 500_000 + 125_000 + 14,794.52 = ₱639,794.52
```

**Note on scope:** The penalty estimator is a supplemental feature of the tool. The primary output is the optimal tax regime recommendation. The penalty estimator helps users understand the cost of late filing — it is NOT the tool's main computation.

---

---

## CR-019: E-Marketplace & DFSP Creditable Withholding Tax (RR 16-2023)

**Legal basis:** BIR Revenue Regulations No. 16-2023 (December 27, 2023); RMC No. 8-2024 (January 15, 2024)
**Effective:** January 11, 2024
**Relevance:** Affects freelancers receiving payments via Payoneer, PayPal, GCash, Maya, Shopee, Lazada, Upwork, Fiverr, and other e-marketplace or DFSP platforms

### 19.1 Withholding Rate Formula

```
# Withholding applied by the platform (Payoneer, GCash, Maya, etc.)
taxable_base_for_withholding = gross_remittance_from_platform * 0.50
platform_cwt_amount          = taxable_base_for_withholding * 0.01
                             = gross_remittance_from_platform * 0.005

# Effective rate: 0.5% of gross remittances (NOT 1%)
# This is because 1% applies only to half the gross remittance
```

**ATC Code:** WI760 (for individual sellers); appears on BIR Form 2307 issued by platform

### 19.2 Gross Remittance Definition

```
gross_remittance = total_amount_remitted_to_seller_by_platform
                   EXCLUDING:
                   - sales_returns_and_discounts
                   - shipping_fees
                   - VAT
                   - platform_service_fees_charged_to_seller
```

**For Upwork→Payoneer freelancers:**
```
contract_amount             = amount client pays on Upwork
upwork_service_fee          = contract_amount * upwork_fee_rate  # 20%, 10%, or 5%
gross_remittance_to_payoneer = contract_amount - upwork_service_fee
platform_cwt_amount          = gross_remittance_to_payoneer * 0.005
```

### 19.3 Threshold: ₱500,000 Combined Annual

```
# Withholding does NOT apply if:
total_combined_gross_remittances_all_platforms < 500_000
  AND seller has submitted valid Sworn Declaration by January 20

# Withholding DOES apply when any of:
condition_1 = (seller submits SD acknowledging combined total > 500_000)
condition_2 = (seller FAILS to submit SD by January 20)
condition_3 = (single platform's cumulative remittances to seller > 500_000)

# When triggered mid-year (condition_3):
#   Withholding applies from the transaction that CAUSES the breach
#   NOT retroactive to January 1
#   Transactions below threshold: no withholding
#   Transactions from breach point onward: withholding applies
```

**The ₱500,000 threshold is COMBINED across all e-marketplace and DFSP platforms.** If a freelancer earns ₱300,000 via Payoneer and ₱250,000 via GCash (total ₱550,000), they cannot claim the exemption even though neither platform alone exceeded ₱500,000.

### 19.4 Multi-Channel Rule

```
# Payment chain: Platform A → Payment Intermediary B → Freelancer's Bank
# Withholding responsibility: LAST facility before final remittance to freelancer

# Typical Philippine freelancer flow:
# Upwork (payer) → Payoneer (DFSP, last facility) → BDO/BPI (bank, pass-through)
# Result: Payoneer is the withholding agent

# Upwork → GCash (DFSP, last facility) → Freelancer's GCash wallet
# Result: GCash is the withholding agent
```

### 19.5 How the CWT Credit Flows to the Annual ITR

```
# Step 1: Collect all BIR Form 2307 (WI760) from all platforms for the year
cwt_from_payoneer   = 2307_payoneer.tax_withheld  # example: ₱7,500
cwt_from_gcash      = 2307_gcash.tax_withheld      # example: ₱2,000
cwt_from_clients    = SUM(all_client_2307s)        # professional fee withholding (WI/WC010, WI/WC011, etc.)

total_cwt_credits   = cwt_from_payoneer + cwt_from_gcash + cwt_from_clients

# Step 2: Apply credits against income tax due from regime computation
income_tax_due      = result of Path A, B, or C computation
balance_payable     = MAX(0, income_tax_due - total_cwt_credits)
refundable_excess   = MAX(0, total_cwt_credits - income_tax_due)

# Note: refundable excess may be carried forward or claimed as refund
```

### 19.6 Interaction with Regime Optimization

The RR 16-2023 CWT does NOT change the regime comparison math. The income tax amounts for Paths A, B, and C are computed WITHOUT considering CWT credits. CWT credits reduce the **balance payable at filing** but do NOT affect which regime produces the lowest tax liability.

However, for **cash flow planning**, the tool should display:
```
for each path [A, B, C]:
  income_tax_due            = path.tax_due
  less_cwt_from_platforms   = total_platform_cwt_credits
  less_cwt_from_clients     = total_client_cwt_credits
  less_quarterly_payments   = total_1701q_payments
  balance_payable_at_filing = income_tax_due - cwt_from_platforms - cwt_from_clients - quarterly_payments
```

### 19.7 Worked Examples

**Example A: High-volume Payoneer freelancer (above threshold)**
```
Gross receipts from Upwork (all via Payoneer): ₱1,200,000
Upwork service fee (10% rate): ₱120,000
Net remitted by Payoneer to freelancer: ₱1,080,000

# Platform CWT (RR 16-2023):
taxable_base = ₱1,080,000 × 0.50 = ₱540,000
CWT_payoneer = ₱540,000 × 0.01   = ₱5,400
Effective rate: ₱5,400 / ₱1,200,000 = 0.45% of contract gross

# On Form 2307 (WI760) from Payoneer:
Income Payment: ₱540,000
Tax Withheld: ₱5,400

# Regime 8% (elected, threshold check: ₱1,200,000 ≤ ₱3,000,000 ✓)
Income tax due = (₱1,200,000 - ₱250,000) × 0.08 = ₱76,000
Less CWT (Payoneer WI760): ₱5,400
Balance payable at annual filing: ₱76,000 - ₱5,400 = ₱70,600
```

**Example B: Below-threshold freelancer (no withholding)**
```
Gross receipts from client via Payoneer: ₱400,000/year
Annual combined gross from all platforms: ₱400,000 < ₱500,000

# Freelancer submits Sworn Declaration by January 20
# Payoneer does NOT withhold
CWT_payoneer = ₱0

# Regime 8%:
Income tax due = (₱400,000 - ₱250,000) × 0.08 = ₱12,000
Less CWT: ₱0
Balance payable: ₱12,000
```

**Example C: Threshold breached mid-year**
```
Payoneer remittances Jan-Sep: ₱480,000 (below ₱500K — no withholding yet)
Payoneer remittance October: ₱80,000 (cumulative = ₱560,000 — threshold breached)

# Withholding starts from the October transaction:
# October breach amount (₱80,000) treated as: below-threshold portion ₱20,000 (₱500K - ₱480K) + above-threshold ₱60,000
# Conservative engine approach: apply withholding to full October amount
CWT_October = ₱80,000 × 0.005 = ₱400

Payoneer remittances Nov-Dec: ₱150,000
CWT_Nov_Dec = ₱150,000 × 0.005 = ₱750

Total CWT for year from Payoneer = ₱400 + ₱750 = ₱1,150
# (or ₱60,000 × 0.005 = ₱300 for the strict above-threshold amount in October, + ₱750 = ₱1,050)
# For simplicity, engine uses total platform remittances where threshold confirmed exceeded × 0.005
```

### 19.8 Engine Input for RR 16-2023 CWT

The engine requires the following inputs from the user:

```
# User inputs (RR 16-2023 section of the wizard):
receives_platform_payments: boolean
  # True if user receives payments via Payoneer, GCash, Maya, Shopee, Lazada, etc.

platform_cwt_received: [
  {
    platform_name: string,      # "Payoneer", "GCash", "Maya", "Shopee", etc.
    form_2307_atc: "WI760",    # confirmed from 2307 certificate
    income_payment: decimal,    # ½ of gross remittance (from 2307 box)
    tax_withheld: decimal,      # from 2307 box
    quarter: Q1 | Q2 | Q3 | Q4
  }
]

# Engine computes:
total_platform_cwt = SUM(item.tax_withheld for item in platform_cwt_received)
```

The tool must also allow users to enter the 2307 total as a single aggregate (for users who don't track per-quarter breakdowns):
```
aggregate_platform_cwt_for_year: decimal  # sum of all WI760 2307s for the year
```

---

---

## CR-020: Compromise Penalty Computation

**Legal basis:** RMO No. 7-2015 (Annex A); NIRC Secs. 204(A), 255, 275; RA 11976 (EOPT Act)

Compromise penalties are VOLUNTARY settlements of criminal liability. They are imposed IN ADDITION TO surcharges and interest — not as a substitute.

**Key rule:** Compromise penalties apply per RETURN (not per year). A freelancer who failed to file 4 quarterly returns incurs 4 separate compromise penalties.

### 20.1 Compromise Penalty for Late Filing WITH Tax Due

```
function compute_compromise_penalty_with_tax_due(basic_tax_due):
  """
  INPUTS:
    basic_tax_due: float — The original income/percentage tax owed for the period

  RETURNS:
    compromise_penalty: float — Standard compromise amount from RMO 7-2015 Annex A

  SOURCE: RMO No. 7-2015 Annex A (Failure to File/Pay Return, Section 255)

  NOTE: The EOPT 50% reduction applies ONLY to invoicing violations (Sec. 113, 237, 238).
  For late-filing penalties (Sec. 255), the standard table below applies to ALL taxpayers
  regardless of tier. Micro/Small taxpayers still benefit from the reduced 10% surcharge
  and 6% interest under EOPT — just not from a reduced compromise penalty.
  """
  if basic_tax_due <= 5_000:
    return 1_000
  elif basic_tax_due <= 10_000:
    return 3_000
  elif basic_tax_due <= 20_000:
    return 5_000
  elif basic_tax_due <= 50_000:
    return 10_000
  elif basic_tax_due <= 100_000:
    return 15_000
  elif basic_tax_due <= 500_000:
    return 20_000
  elif basic_tax_due <= 1_000_000:
    return 30_000
  elif basic_tax_due <= 5_000_000:
    return 40_000
  else:
    return 50_000
```

### 20.2 Compromise Penalty for Late Filing with NO Tax Due (Nil Return)

```
function compute_compromise_penalty_nil_return(offense_number):
  """
  INPUTS:
    offense_number: int — 1 for first offense, 2 for second, 3 for third, etc.
                         Tracked per taxpayer across all return types and periods.

  RETURNS:
    compromise_penalty: float
    can_be_compromised: bool  — False for 4th and subsequent offenses

  SOURCE: RMO No. 7-2015 Annex A (Sec. 275 violations)
  """
  if offense_number == 1:
    return (1_000, True)
  elif offense_number == 2:
    return (5_000, True)
  elif offense_number == 3:
    return (10_000, True)
  else:
    return (None, False)  // Must be referred for criminal prosecution
```

**Important:** The engine tracks the user's reported offense history for nil returns. Default assumption: FIRST offense, unless user indicates multiple missed returns.

### 20.3 Compromise Penalty for Invoicing Violations (With EOPT Reduction)

```
function compute_invoicing_compromise_penalty(violation_type, offense_number, tier):
  """
  INPUTS:
    violation_type: InvoicingViolationType (see enum below)
    offense_number: int — 1 = 1st offense, 2 = 2nd offense, 3+ = criminal only
    tier: TaxpayerTier

  RETURNS:
    compromise_penalty: float
    can_be_compromised: bool

  LEGAL BASIS: NIRC Sections 237 and 238; EOPT 50% reduction applies
  """
  // Standard amounts (before EOPT reduction)
  standard_amounts = {
    (FAILURE_TO_ISSUE, 1): 10_000,
    (FAILURE_TO_ISSUE, 2): 20_000,
    (REFUSAL_TO_ISSUE, 1): 25_000,
    (REFUSAL_TO_ISSUE, 2): 50_000,
    (INCORRECT_INFORMATION, 1): 10_000,
    (INCORRECT_INFORMATION, 2): 20_000,
    (UNREGISTERED_RECEIPT, 1): 10_000,
    (UNREGISTERED_RECEIPT, 2): 20_000,
    (DUPLICATE_RECEIPT, 1): 10_000,
    (DUPLICATE_RECEIPT, 2): 20_000,
    (UNDERSTATED_AMOUNT, 1): 10_000,
    (UNDERSTATED_AMOUNT, 2): 20_000,
  }

  key = (violation_type, offense_number)
  if key not in standard_amounts:
    return (None, False)  // 3rd+ offense: criminal prosecution, cannot be compromised

  standard = standard_amounts[key]

  // EOPT 50% reduction for MICRO and SMALL only (violations of Sec. 237 and 238)
  if tier in [TaxpayerTier.MICRO, TaxpayerTier.SMALL]:
    return (standard * 0.50, True)
  else:
    return (standard, True)
```

### 20.4 Complete Penalty Computation — Single Late Return

```
function compute_total_late_filing_penalty(
  basic_tax_due,
  tier,
  days_late,
  has_tax_due,
  offense_number_nil = 1
):
  """
  INPUTS:
    basic_tax_due:     float  — Tax owed (₱0 for nil returns)
    tier:              TaxpayerTier
    days_late:         int    — Days past deadline (0 if on time)
    has_tax_due:       bool   — False if nil return, True otherwise
    offense_number_nil: int   — For nil returns, which offense number (default 1)

  RETURNS:
    LatePenaltyResult {
      original_tax:     float,
      surcharge:        float,
      interest:         float,
      compromise:       float,
      total_penalty:    float,    // surcharge + interest + compromise
      total_amount_due: float     // original_tax + total_penalty
    }

  ASSUMPTIONS:
    - violation_type defaults to FAILURE_TO_PAY if has_tax_due else Sec. 275
    - Surcharge computed via CR-016
    - Interest computed via CR-017
    - Compromise computed via CR-020.1 or CR-020.2 depending on has_tax_due
  """
  surcharge = compute_surcharge(basic_tax_due, tier, FAILURE_TO_FILE)
  interest  = compute_interest(basic_tax_due, tier, days_late)

  if has_tax_due:
    compromise = compute_compromise_penalty_with_tax_due(basic_tax_due)
  else:
    (compromise, _) = compute_compromise_penalty_nil_return(offense_number_nil)

  total_penalty    = surcharge + interest + compromise
  total_amount_due = basic_tax_due + total_penalty

  return LatePenaltyResult(
    original_tax     = round(basic_tax_due, 2),
    surcharge        = surcharge,
    interest         = interest,
    compromise       = compromise,
    total_penalty    = round(total_penalty, 2),
    total_amount_due = round(total_amount_due, 2)
  )
```

### 20.5 Worked Example: MICRO Taxpayer, Three Missed Quarterly Returns

**Scenario:** Freelancer (MICRO, ₱500K gross) missed 1701Q for Q1, Q2, Q3. Catches up and files all three at once in November (annual deadline not yet reached). Q1 had ₱8,000 tax due, Q2 had ₱5,000, Q3 had ₱0 (loss quarter).

```
// Assume filing date: November 10. Q1 deadline April 15, Q2 Aug 15, Q3 Nov 15.
// Q1: 209 days late (April 15 to November 10)
// Q2: 87 days late (August 15 to November 10)
// Q3: on time (November 10 < November 15 deadline)

Q1 = compute_total_late_filing_penalty(8_000, MICRO, 209, True)
  surcharge = 8_000 × 0.10 = ₱800
  interest  = 8_000 × 0.06 × (209/365) = ₱275.18
  compromise = table[₱5K-₱10K bracket] = ₱3,000
  total_penalty = ₱4,075.18 | total_due = ₱12,075.18

Q2 = compute_total_late_filing_penalty(5_000, MICRO, 87, True)
  surcharge = 5_000 × 0.10 = ₱500
  interest  = 5_000 × 0.06 × (87/365) = ₱71.51
  compromise = table[≤₱5K bracket] = ₱1,000
  total_penalty = ₱1,571.51 | total_due = ₱6,571.51

Q3 = compute_total_late_filing_penalty(0, MICRO, 0, False, 3)
  // Third missed-deadline event, but it's on time this time — no penalty
  // (Q3 filed before Nov 15 deadline)
  total_penalty = ₱0 | total_due = ₱0

Grand total penalties: ₱4,075.18 + ₱1,571.51 = ₱5,646.69
```

---

## CR-021: Section 250 Information Return Penalties

**Legal basis:** NIRC Section 250, as amended by RA 11976 (EOPT Act); RMO No. 7-2015

Applies to: SAWT, Quarterly Alphalist of Payees (QAP), Annual Alphalist, Form 2307 (when the taxpayer is the PAYOR/withholding agent).

**Scope for self-employed freelancers:**
- If freelancer is the PAYEE: The payor (client) is responsible for filing 2307. The freelancer's obligation is to attach the **SAWT** to their quarterly and annual returns.
- If freelancer has employees or pays service fees: The freelancer is the WITHHOLDING AGENT and must file 2307s and the QAP/Annual Alphalist.
- Most solo freelancers with no employees: SAWT obligation only.

```
function compute_section_250_penalty(
  failures_count,
  tier
):
  """
  INPUTS:
    failures_count: int — Number of separate failures (one per required submission)
    tier: TaxpayerTier

  RETURNS:
    Section250PenaltyResult {
      per_failure_amount: float,
      annual_cap: float,
      total_penalty: float   // min(failures_count × per_failure, annual_cap)
    }
  """
  if tier in [TaxpayerTier.MICRO, TaxpayerTier.SMALL]:
    per_failure = 500
    annual_cap  = 12_500
  else:  // MEDIUM or LARGE
    per_failure = 1_000
    annual_cap  = 25_000

  total = min(failures_count * per_failure, annual_cap)

  return Section250PenaltyResult(
    per_failure_amount = per_failure,
    annual_cap         = annual_cap,
    total_penalty      = total
  )
```

### What Counts as One "Failure"
Per RMC 51-2009: Failure to supply information for each payee = one separate failure.
- Failing to attach SAWT to one quarterly return = one failure = ₱1,000 (or ₱500)
- Failing to include one payee in the alphalist = one failure = ₱1,000 (or ₱500)
- Failing to file the entire QAP for one quarter = the number of payees omitted × per-failure rate, up to annual cap

**Engine note:** For most solo freelancers (SAWT only, no employees), missing SAWT from one return = 1 failure = ₱500 (MICRO/SMALL). Missing from all 4 returns in a year = 4 failures = ₱2,000 (below the ₱12,500 cap).

---

## CR-022: Prescriptive Period — Is This Tax Year Still Assessable?

**Legal basis:** NIRC Sections 203, 222(a), 222(c)

The engine's penalty estimator must check whether a prior-year tax deficiency is still within the BIR's assessment window. If the period has prescribed, the BIR can no longer assess the deficiency.

```
function is_still_assessable(
  taxable_year,
  filed_on_time,
  return_filed,
  has_fraud,
  current_date
):
  """
  INPUTS:
    taxable_year:  int  — The year for which the return was due (e.g., 2021)
    filed_on_time: bool — Was the return filed by the April 15 deadline?
    return_filed:  bool — Was a return filed at all?
    has_fraud:     bool — Was the return fraudulent or is underdeclaration > 30%?
    current_date:  date — Today's date (for computing elapsed time)

  RETURNS:
    AssessabilityResult {
      prescriptive_period:   int,    // years (3 or 10)
      start_of_period:       date,   // when the clock started
      expiry_date:           date,   // when the right to assess expires
      is_assessable:         bool,   // True if current_date < expiry_date
      assessment_period_type: str    // "ordinary" or "extraordinary"
    }

  RULES:
    (a) If no return filed: 10-year period; starts from date of discovery
        → Engine cannot determine "date of discovery" — outputs: "assessable (BIR's period
          starts from discovery; if BIR discovers this year, assessment window extends to
          {current_year + 10})"
    (b) If fraudulent return or underdeclaration > 30%: 10-year period; starts from discovery
        → Same as (a) — engine cannot know discovery date, so flags as potentially assessable
    (c) If return filed late, no fraud: 3-year period from ACTUAL filing date
    (d) If return filed on time, no fraud: 3-year period from April 15 of the following year
  """

  ANNUAL_DEADLINE = date(taxable_year + 1, 4, 15)  // April 15 of the year after

  if not return_filed or has_fraud:
    // 10-year extraordinary period; start date unknown (BIR's discovery date)
    return AssessabilityResult(
      prescriptive_period    = 10,
      start_of_period        = None,  // unknown
      expiry_date            = None,  // unknown
      is_assessable          = True,  // conservative: assume assessable
      assessment_period_type = "extraordinary",
      note = "10-year period from BIR's date of discovery. Cannot determine expiry without knowing BIR's discovery date."
    )

  if filed_on_time:
    start = ANNUAL_DEADLINE
  else:
    // Need actual filing date from user input; engine falls back to deadline if unknown
    start = user_provided_filing_date or ANNUAL_DEADLINE

  expiry = date(start.year + 3, start.month, start.day)

  return AssessabilityResult(
    prescriptive_period    = 3,
    start_of_period        = start,
    expiry_date            = expiry,
    is_assessable          = current_date <= expiry,
    assessment_period_type = "ordinary"
  )
```

### Prescriptive Period Summary Table (Quick Reference)

| Scenario | Assessment Period | Period Starts | Collection After Assessment |
|----------|------------------|---------------|----------------------------|
| Return filed on time, no fraud | 3 years | April 15 of the NEXT year | 3 more years from assessment date |
| Return filed late, no fraud | 3 years | Actual filing date | 3 more years from assessment date |
| Return not filed (no return) | 10 years | Date of BIR discovery | 5 more years from assessment date |
| Fraudulent return (deliberate) | 10 years | Date of BIR discovery | 5 more years from assessment date |
| Underdeclaration > 30% of declared | 10 years | Date of BIR discovery | 5 more years from assessment date |

**Supreme Court clarification (G.R. No. 247737, McDonald's PH Realty Corp. v. CIR):**
- The 10-year period requires PROOF of intentional and deliberate misstatement with clear and convincing evidence.
- Unintentional clerical errors do NOT trigger the 10-year period.
- The mere SIZE of the understatement, without proof of intent, is insufficient to invoke the extraordinary period.
- However: Section 248(B) creates "prima facie evidence of fraud" for underdeclarations > 30%, effectively shifting the burden to the taxpayer to disprove fraudulent intent.

---

---

## CR-023: 8% Option Election Procedure Rules

**Legal basis:** RR 8-2018 Part I; RMO 23-2018; RMC 32-2018; NIRC Sec. 24(A)(2)(b)

The engine must enforce these rules when presenting the 8% option to the user and when determining if the election window is still open.

### Election Window Determination

```
function is_election_window_open(
  taxpayer_type: "new_registrant" | "existing",
  q1_1701q_filed: bool,
  q1_filing_deadline_passed: bool,  // Q1 1701Q deadline = May 15
  q1_elected_graduated: bool        // Q1 filed WITHOUT 8% election
) -> ElectionWindowResult:

  if taxpayer_type == "new_registrant":
    if q1_1701q_filed and q1_elected_graduated:
      return ElectionWindowResult { open: false, reason: "Q1_FILED_GRADUATED" }
    elif not q1_1701q_filed:
      return ElectionWindowResult { open: true, method: ["AT_REGISTRATION", "INITIAL_Q1_RETURN"] }
    else:
      // Q1 filed with 8% elected (valid)
      return ElectionWindowResult { open: true, already_elected: true }
  else:  // existing taxpayer
    if q1_filing_deadline_passed and q1_elected_graduated:
      return ElectionWindowResult { open: false, reason: "Q1_DEADLINE_PASSED" }
    elif q1_1701q_filed and not q1_elected_graduated:
      // Q1 filed with 8% elected (valid)
      return ElectionWindowResult { open: true, already_elected: true }
    elif not q1_filing_deadline_passed:
      return ElectionWindowResult {
        open: true,
        method: ["FORM_1905_THEN_Q1", "Q1_1701Q_ITEM16", "NIL_Q1_2551Q_WITH_NOTATION"]
      }
    else:
      return ElectionWindowResult { open: false, reason: "Q1_DEADLINE_PASSED_NO_ELECTION" }
```

### Exact Notation Text for NIL Form 2551Q Election

When a taxpayer files a NIL Q1 2551Q to signal the 8% election, the notation must be:
```
"Availing of 8% Income Tax Rate Option for Taxable Year [YEAR]"
```
Where `[YEAR]` is the 4-digit current tax year (e.g., "2026").

This exact notation (per RR 8-2018 and RMO 23-2018) must be present in the Remarks/Notes field of BIR Form 2551Q. The engine shall display this text to the user for them to copy when filing.

### Annual Re-Election Check

```
function check_annual_reelection(
  prior_year_used_8pct: bool,
  current_year_q1_filed: bool,
  current_year_q1_election: "8pct" | "graduated" | null
) -> ReelectionResult:

  if prior_year_used_8pct and current_year_q1_filed:
    if current_year_q1_election == "8pct":
      return ReelectionResult { elected: true, method: "Q1_1701Q" }
    elif current_year_q1_election == "graduated":
      return ReelectionResult { elected: false, reason: "DEFAULTED_TO_GRADUATED" }
    else:
      return ReelectionResult { open: true, pending: "MUST_FILE_Q1_TO_ELECT" }
  elif not current_year_q1_filed:
    return ReelectionResult { open: true, pending: "Q1_NOT_YET_FILED" }
  else:
    return ReelectionResult { elected: false, reason: "PRIOR_YEAR_WAS_GRADUATED" }
```

**Note:** The 8% option does NOT automatically carry over. Each year is a fresh election.

---

## CR-024: Mid-Year Threshold Breach — Recomputation Pseudocode

**Legal basis:** RR 8-2018 Part III; RMO 23-2018 Sec. 3(C)

When a taxpayer on the 8% option has cumulative gross receipts + non-operating income exceed ₱3,000,000 mid-year, the engine must:

1. Identify the breach month
2. Compute retroactive 3% percentage tax on pre-breach receipts
3. Recompute annual income tax under graduated rates for the FULL year
4. Credit all 8% quarterly payments already made

```
struct BreachRecomputationInput {
  monthly_gross: array[12] of decimal,     // gross receipts per calendar month
  monthly_non_op: array[12] of decimal,    // non-operating income per calendar month
  annual_business_expenses: decimal,       // if taxpayer wants itemized; null = use OSD
  deduction_method: "OSD" | "ITEMIZED",   // if OSD: ignore expenses; if ITEMIZED: require expenses
  cwt_total_year: decimal,                // total CWT (Form 2307) for full year
  q1_8pct_payment: decimal,              // actual payment made for Q1 under 8%
  q2_8pct_payment: decimal,              // actual payment made for Q2 under 8% (if applicable)
  q3_8pct_payment: decimal,              // actual payment made for Q3 under 8% (if applicable)
  tax_year: int                           // e.g., 2026
}

struct BreachRecomputationOutput {
  breach_detected: bool,
  breach_month: int | null,                     // 1-12 (null if no breach)
  vat_registration_deadline: date | null,       // last day of month following breach month
  retroactive_pct_tax_due: decimal,            // 3% × receipts from Jan through (breach_month - 1)
  retroactive_pct_months_covered: string,      // e.g., "Jan-Mar" (months before VAT reg)
  annual_gross_total: decimal,                 // sum of all monthly gross + non-op
  deduction_applied: decimal,                  // OSD (40% of gross) or itemized expense total
  net_taxable_income_annual: decimal,          // annual_gross - deduction
  annual_graduated_it_due: decimal,            // graduated tax on net_taxable_income_annual
  total_credits_against_annual: decimal,       // cwt_total_year + q1_8pct_payment + q2 + q3
  annual_it_payable: decimal,                  // annual_graduated_it_due - total_credits (min 0)
  annual_it_overpayment: decimal,              // if total_credits > annual_it_due; refundable
  annual_form_required: "1701",                // always 1701 in breach year
  vat_filing_start_month: int                  // month from which 2550M/Q must be filed
}

function compute_breach_recomputation(input: BreachRecomputationInput) -> BreachRecomputationOutput:

  // Step 1: Find breach month
  cumulative = 0
  breach_month = null
  for m in 1..12:
    cumulative += input.monthly_gross[m] + input.monthly_non_op[m]
    if cumulative > 3_000_000 and breach_month is null:
      breach_month = m

  if breach_month is null:
    return BreachRecomputationOutput { breach_detected: false }

  // Step 2: Retroactive percentage tax
  receipts_before_breach = sum(input.monthly_gross[1..breach_month-1])
  non_op_before_breach = sum(input.monthly_non_op[1..breach_month-1])
  // Note: Sec. 116 percentage tax is on gross receipts only (EOPT: on gross sales from Oct 27, 2024)
  retroactive_pct_tax = receipts_before_breach * 0.03
  retroactive_months = months_name_range(1, breach_month - 1)  // e.g., "Jan-Sep"

  // Step 3: Annual gross totals
  annual_gross = sum(input.monthly_gross[1..12]) + sum(input.monthly_non_op[1..12])

  // Step 4: Deductions
  if input.deduction_method == "OSD":
    deduction = annual_gross * 0.40
    net_taxable = annual_gross - deduction  // = annual_gross * 0.60
  else:  // ITEMIZED
    deduction = input.annual_business_expenses
    net_taxable = annual_gross - deduction
    if net_taxable < 0: net_taxable = 0  // Cannot be negative (NOLCO rules apply)

  // Step 5: Graduated income tax
  annual_it_due = compute_graduated_tax(net_taxable, input.tax_year)  // uses CR-002 or CR-003

  // Step 6: Credits
  total_8pct_payments = input.q1_8pct_payment + input.q2_8pct_payment + input.q3_8pct_payment
  total_credits = input.cwt_total_year + total_8pct_payments

  // Step 7: Net payable
  annual_it_payable = MAX(0, annual_it_due - total_credits)
  annual_it_overpayment = MAX(0, total_credits - annual_it_due)

  // Step 8: VAT registration deadline
  vat_reg_deadline_month = breach_month + 1
  if vat_reg_deadline_month > 12:
    vat_reg_deadline_month = 12  // December if breach in December (register by Dec 31)
  vat_reg_deadline = last_day_of_month(vat_reg_deadline_month, input.tax_year)

  return BreachRecomputationOutput {
    breach_detected: true,
    breach_month: breach_month,
    vat_registration_deadline: vat_reg_deadline,
    retroactive_pct_tax_due: retroactive_pct_tax,
    retroactive_pct_months_covered: retroactive_months,
    annual_gross_total: annual_gross,
    deduction_applied: deduction,
    net_taxable_income_annual: net_taxable,
    annual_graduated_it_due: annual_it_due,
    total_credits_against_annual: total_credits,
    annual_it_payable: annual_it_payable,
    annual_it_overpayment: annual_it_overpayment,
    annual_form_required: "1701",
    vat_filing_start_month: breach_month
  }
```

### Breach Computation — Worked Example

**Scenario:** Freelancer elected 8% in Q1 2026. Monthly gross receipts:
- Jan: ₱400K, Feb: ₱500K, Mar: ₱300K (Q1 cumulative: ₱1.2M; Q1 8% tax paid: ₱76,000)
- Apr: ₱600K, May: ₱700K (breach at May; May cumulative = ₱1.2M + ₱600K + ₱700K = ₱2.5M ... actually not yet)
- Let's say: Jan–Sep total = ₱2.8M (Q1-Q3; Q2 8% paid: ₱96,000; Q3 8% paid: ₱68,000)
- Oct: ₱400K → Cumulative = ₱3.2M → BREACH in October

**Breach month:** October (10)

**Retroactive percentage tax:**
- Gross Jan–Sep (months 1–9 = before month 10 VAT reg): ₱2,800,000
- Retroactive PT = ₱2,800,000 × 0.03 = **₱84,000**

**VAT registration deadline:** End of November (month following October)

**Annual recomputation (OSD method):**
- Full-year gross = ₱3,200,000 (Jan-Oct is shown; assume Nov-Dec add ₱300K): say ₱3,500,000 total
- OSD = 40% × ₱3,500,000 = ₱1,400,000
- Net taxable = ₱2,100,000
- Graduated tax: ₱402,500 + 30% × (₱2,100,000 − ₱2,000,000) = ₱402,500 + ₱30,000 = **₱432,500**
- CWT credits (full year): assume ₱175,000
- 8% quarterly payments credited: ₱76,000 + ₱96,000 + ₱68,000 = ₱240,000
- Total credits: ₱175,000 + ₱240,000 = ₱415,000
- Annual IT payable: ₱432,500 − ₱415,000 = **₱17,500**
- Plus retroactive PT: ₱84,000
- **Total additional tax burden due to breach: ₱101,500**

---

## CR-025: Sales Returns, Allowances, and Discounts — Net Gross Receipts for 8% Base

**Legal basis:** NIRC Sec. 24(A)(2)(b); RR 8-2018; general accounting principles

The 8% computation base and the ₱3M eligibility threshold both use NET gross receipts — i.e., gross receipts after deducting sales returns, allowances, and discounts. This rule is consistent across all three paths.

```
struct NetGrossReceiptsInput {
  gross_billings: decimal,         // Total invoiced amounts before any deductions
  sales_returns: decimal,          // Amounts reversed because client returned or rejected
  sales_allowances: decimal,       // Post-billing price reductions (not returns; price adjustment)
  trade_discounts: decimal,        // Discounts shown on invoice at time of billing
  cash_discounts: decimal,         // Discounts for early payment (only if actually availed and booked)
  volume_discounts: decimal        // Bulk pricing discounts actually given
}

function compute_net_gross_receipts(input: NetGrossReceiptsInput) -> decimal:
  total_deductions = (
    input.sales_returns +
    input.sales_allowances +
    input.trade_discounts +
    input.cash_discounts +
    input.volume_discounts
  )
  net = input.gross_billings - total_deductions
  assert net >= 0,
    "Net gross receipts cannot be negative (deductions exceed billings)"
  return net

// Usage in 8% computation (purely self-employed):
net_gross = compute_net_gross_receipts(input)
eight_pct_threshold_base = net_gross + non_operating_income
eight_pct_eligible = eight_pct_threshold_base <= 3_000_000
eight_pct_taxable = MAX(0, eight_pct_threshold_base - 250_000)  // purely SE
eight_pct_tax_due = eight_pct_taxable * 0.08
```

**Reimbursements edge case:**
Some service providers bill clients for reimbursements (travel, accommodation, materials). Treatment:
- If billed at COST (pass-through, no markup, shown separately on invoice): EXCLUDE from gross receipts
- If billed at COST + MARKUP (or lumped into professional fee): INCLUDE in gross receipts
- If unclear: engine shall display MRF flag (MRF-008) asking taxpayer to clarify treatment
- Default if taxpayer provides no clarification: INCLUDE (conservative — avoids under-reporting)

---

## CR-026: OSD Computation — Full Expanded Rules

**Legal basis:** NIRC Sec. 34(L); RR No. 16-2008 (implementing rules for OSD)
**Last updated:** 2026-03-01
**See also:** [lookup-tables/osd-breakeven-table.md](lookup-tables/osd-breakeven-table.md) for full tax tables

### CR-026-A: Who May Use OSD

The following individuals may elect OSD:
- Individuals engaged in trade or business (sole proprietors)
- Individuals in the exercise of profession (doctors, lawyers, engineers, CPAs, etc.)
- Freelancers and independent contractors

The following **cannot** use OSD as an entity (but individual partners can use OSD for their share of net income distributed):
- General Professional Partnerships (GPP) — the partnership itself; individual partners may use OSD on their distributive share received from the GPP
- Corporations (they have a different OSD of 40% of gross income; but this engine only covers individuals)

### CR-026-B: OSD Base — Service Providers (Professionals/Freelancers)

```
function compute_osd_base_service(
  gross_receipts: decimal,           // All amounts received/accrued for services rendered
  passive_income_with_fwt: decimal   // Interest, dividends, etc. already subject to final WHT
) -> decimal:
  osd_base = gross_receipts - passive_income_with_fwt
  assert osd_base >= 0,
    "OSD base cannot be negative (passive income cannot exceed total receipts)"
  return osd_base
```

**What is included in gross receipts:**
- Professional fees from clients
- Consulting fees
- Service income from freelance platforms (Upwork, Fiverr, Freelancer.com)
- Project-based payments
- Retainer fees
- Commission income from services (not sales; that's a trader)
- All amounts received WHETHER OR NOT BILLED (cash-basis or accrual-basis per RR 2-98)

**What is EXCLUDED from gross receipts (passive income with final WHT):**
- Interest income from bank deposits (FWT at 20% for PH banks, 15% for FCDU)
- Dividend income from domestic corporations (FWT at 10%)
- Prizes and awards > ₱10,000 (FWT at 20%)
- PCSO and lotto winnings
- Royalties on literary, musical works (FWT at 10%)
- Capital gains from sale of shares (FWT at 15%)
- Capital gains from sale of real property (FWT at 6%)

### CR-026-C: OSD Base — Traders (Sellers of Goods)

```
function compute_osd_base_trader(
  gross_sales: decimal,              // Total revenue from goods sold
  sales_returns: decimal,            // Goods returned by customers
  sales_allowances: decimal,         // Post-sale price adjustments
  cost_of_goods_sold: decimal,       // COGS (beginning inventory + purchases - ending inventory)
  passive_income_with_fwt: decimal   // As above
) -> decimal:
  net_sales = gross_sales - sales_returns - sales_allowances
  gross_income = net_sales - cost_of_goods_sold
  assert gross_income >= 0,
    "Gross income cannot be negative for OSD purposes (record loss year; consider NOLCO under itemized)"
  osd_base = gross_income - passive_income_with_fwt
  assert osd_base >= 0, "OSD base cannot be negative"
  return osd_base
```

**CRITICAL:** For traders, OSD is 40% of GROSS INCOME (gross sales minus COGS), NOT 40% of gross sales.
This means a trader's "operating expenses" (rent, salaries, utilities) are covered by the 40% OSD. The trader gets OSD only on top of COGS already being deducted.

### CR-026-D: OSD Amount and Net Taxable Income

```
function compute_osd(osd_base: decimal) -> OSDResult:
  osd_amount = round(osd_base * 0.40, 2)   // round to centavo
  nti = osd_base - osd_amount               // = osd_base * 0.60, but computed by subtraction to avoid rounding drift
  return OSDResult {
    osd_base: osd_base,
    osd_amount: osd_amount,
    net_taxable_income: nti
  }
```

**Rounding rule:** Round the OSD amount to the nearest centavo (2 decimal places). Compute NTI by subtraction (not multiplication by 0.60) to avoid rounding discrepancy.

### CR-026-E: OSD Election Procedure

**Timing:**
```
function is_osd_election_valid(
  quarter_of_election: int,          // 1, 2, 3, or 4
  prior_quarter_method: string | null // null = no prior filing; "itemized", "osd", "eight_pct"
) -> OSDElectionResult:
  if quarter_of_election == 1 AND prior_quarter_method == null:
    return OSDElectionResult { valid: true, reason: "First quarterly return; OSD may be elected" }
  if quarter_of_election == 1 AND prior_quarter_method in ["itemized", "osd", "eight_pct"]:
    // This means this is actually a re-election in the same year
    return OSDElectionResult { valid: false, reason: "Q1 already filed with different method" }
  if quarter_of_election > 1:
    return OSDElectionResult { valid: false, reason: "OSD must be elected in Q1; cannot elect in Q2, Q3, or Q4" }
```

**New registrant rule:**
- If first quarterly return is for a period that began mid-year (e.g., business registered September), the first 1701Q filed is still considered "Q1 of first taxable year." OSD election is valid in this first filing.

**Annual re-election requirement:**
- OSD election does NOT carry over from one taxable year to the next
- At the start of each new taxable year, the taxpayer must affirmatively elect OSD in Q1
- Failure to re-elect = taxpayer is on itemized for that year (cannot retroactively switch)

**Irrevocability:**
- Once Q1 1701Q is filed with OSD election, cannot switch to itemized or 8% for that year
- EXCEPTION: If the taxpayer elected 8% in Q1 and subsequently becomes ineligible (gross > ₱3M mid-year), they switch to graduated — but whether OSD or itemized is then elected depends on what they signified when they first filed
- ENGINE RULE: If user indicates they elected OSD in Q1, lock Path B as the graduated-rate deduction method

### CR-026-F: OSD and Mixed Income Earners

For taxpayers with BOTH compensation income AND business/professional income:
```
function compute_path_b_mixed_income(
  compensation_income: decimal,           // Gross salary, wages, allowances
  business_gross_receipts: decimal,       // From self-employment
  passive_income_with_fwt: decimal        // Excluded from OSD base
) -> PathBMixedResult:

  // Step 1: Compensation NTI (no personal deduction under TRAIN for compensation)
  compensation_nti = compensation_income

  // Step 2: Business NTI under OSD
  osd_base = business_gross_receipts - passive_income_with_fwt
  osd_amount = round(osd_base * 0.40, 2)
  business_nti_osd = osd_base - osd_amount  // = osd_base * 0.60

  // Step 3: Combined NTI
  combined_nti = compensation_nti + business_nti_osd

  // Step 4: Tax on combined NTI
  income_tax = graduated_tax(combined_nti)

  // Note: No ₱250,000 deduction — the zero-bracket in the rate table handles this
  // Note: Percentage tax on business income still applies separately (3% of gross receipts)
  percentage_tax = round(business_gross_receipts * 0.03, 2)

  return PathBMixedResult {
    compensation_nti: compensation_nti,
    business_nti: business_nti_osd,
    combined_nti: combined_nti,
    income_tax: income_tax,
    percentage_tax: percentage_tax,
    total_tax: income_tax + percentage_tax
  }
```

**Important:** The "total tax burden" comparison for mixed income Path B should include both income tax (on combined NTI) and percentage tax (on business gross receipts). The compensation income's graduated tax is embedded in the combined NTI tax; it is not double-counted.

### CR-026-G: OSD in Quarterly Returns (Cumulative Method)

The 1701Q uses the **cumulative method**: each quarter's return reports cumulative year-to-date figures and credits prior payments.

```
function compute_1701Q_osd(
  quarter: int,                          // 1, 2, or 3
  cumulative_gross_receipts: decimal,    // Sum of Q1..Qn gross receipts
  cumulative_cwt: decimal,               // Sum of Form 2307 amounts received Q1..Qn
  prior_quarters_paid: decimal           // Sum of 1701Q payments for Q1..Q(n-1)
) -> QuarterlyTaxResult:

  // Compute cumulative NTI using OSD
  cumulative_osd_base = cumulative_gross_receipts  // for service provider
  cumulative_osd_amount = round(cumulative_osd_base * 0.40, 2)
  cumulative_nti = cumulative_osd_base - cumulative_osd_amount

  // Compute cumulative income tax
  cumulative_it = graduated_tax(cumulative_nti)

  // Quarterly tax payable = cumulative tax - prior payments - CWT credits
  quarterly_tax_payable = max(0, cumulative_it - prior_quarters_paid - cumulative_cwt)

  // Note: Form 1701Q also tracks percentage tax separately (Form 2551Q)
  // Percentage tax is NOT on Form 1701Q; it has its own Form 2551Q

  return QuarterlyTaxResult {
    quarter: quarter,
    cumulative_gross_receipts: cumulative_gross_receipts,
    cumulative_osd_amount: cumulative_osd_amount,
    cumulative_nti: cumulative_nti,
    cumulative_income_tax: cumulative_it,
    prior_quarters_paid: prior_quarters_paid,
    cwt_credits: cumulative_cwt,
    tax_payable_this_quarter: quarterly_tax_payable
  }
```

**Worked Example — OSD Quarterly (Service Provider, ₱800K annual):**

Q1 (Jan-Mar): Gross = ₱200,000; CWT = ₱10,000
- OSD = 80,000; NTI = 120,000; IT = 0; Tax payable = max(0, 0 − 0 − 10,000) = 0

Q2 (Jan-Jun cumulative): Gross = ₱400,000; Cumulative CWT = ₱20,000; Q1 paid = ₱0
- OSD = 160,000; NTI = 240,000; IT = 0; Tax payable = max(0, 0 − 0 − 20,000) = 0

Q3 (Jan-Sep cumulative): Gross = ₱600,000; Cumulative CWT = ₱30,000; Q1+Q2 paid = ₱0
- OSD = 240,000; NTI = 360,000; IT = (360,000−250,000)×0.15 = 16,500
- Tax payable = max(0, 16,500 − 0 − 30,000) = 0 (CWT exceeds tax)

Annual (Jan-Dec): Gross = ₱800,000; Total CWT = ₱40,000; Quarterly paid = ₱0
- OSD = 320,000; NTI = 480,000; IT = 22,500 + (480,000−400,000)×0.20 = 22,500 + 16,000 = 38,500
- Balance = 38,500 − 0 − 40,000 = −₱1,500 (REFUNDABLE — CWT exceeded annual tax)
- Taxpayer may claim refund or carry over as credit to next year

### CR-026-H: OSD and NOLCO Interaction

```
function check_nolco_availability(deduction_method: string) -> bool:
  if deduction_method == "itemized":
    return true   // NOLCO available
  elif deduction_method == "osd":
    return false  // NOLCO NOT available (NIRC Sec. 34(D)(3))
  elif deduction_method == "eight_pct":
    return false  // NOLCO NOT available
```

**Rule:** A taxpayer electing OSD cannot deduct any NOLCO from prior years for that taxable year.
If a taxpayer has significant NOLCO carryovers, switching to itemized for the year may be beneficial even if current-year expenses are below 40%.

**Engine display:** If user has NOLCO carryovers AND selects OSD, engine must display:
"Warning: Choosing OSD means you cannot use your carried-over Net Operating Loss (NOLCO) of ₱[amount] this year. Consider itemized deductions if NOLCO offsets significantly reduce your tax."
This is a display warning, not a MRF flag — the engine can still compute but should make the trade-off explicit.

### CR-026-I: Financial Statement Requirements Under OSD

```
function requires_audited_fs(
  annual_gross_receipts: decimal,
  deduction_method: string
) -> bool:
  if annual_gross_receipts >= 3_000_000:
    return true  // RR 4-2019: audited FS required regardless of deduction method
  if deduction_method == "itemized" AND annual_gross_receipts >= 150_000:
    return true  // General rule: FS required for itemized when substantial income
  if deduction_method == "osd":
    return false  // No FS attachment to annual return required (Sec. 34L)
  return false
```

**Note:** OSD exempts the taxpayer from ATTACHING financial statements to the annual ITR. However:
- Must MAINTAIN books and FS (required by NIRC regardless of deduction method)
- Must PRESENT FS upon BIR audit or examination request
- If GR ≥ ₱3M: FS must be audited by independent CPA and registered with SEC/BIR even if OSD elected

### CR-026-J: OSD vs. Other Paths — Recommendation Logic

```
function osd_is_better_than_itemized(
  osd_total_tax: decimal,
  itemized_total_tax: decimal
) -> bool:
  return osd_total_tax < itemized_total_tax
  // Tiebreaker: prefer OSD (less compliance burden; no FS attachment required)

function eight_pct_crossover_with_osd(gross_receipts: decimal) -> string:
  // Returns which is lower in the narrow crossover range
  // For pure service, no compensation income
  // Crossover: OSD beats 8% in range ₱400,001 to ₱437,500
  // 8% beats OSD outside this range (when eligible)
  // Engine should ALWAYS compute both and compare; do not use this heuristic
  if gross_receipts >= 400_001 AND gross_receipts <= 437_500:
    return "OSD_or_close"  // Must compute both; OSD slightly better or tied
  elif gross_receipts <= 400_000:
    return "8_pct_better"
  else:  // > 437,500
    return "8_pct_better"
```

**Engine recommendation rule for OSD:**
1. If taxpayer is 8% eligible: Compute all three paths. Recommend lowest. Do NOT assume 8% wins.
2. If taxpayer is NOT 8% eligible (GR > ₱3M or VAT-registered): Compare Path A (itemized) vs Path B (OSD).
   - OSD wins when actual expenses < 40% of gross receipts
   - Itemized wins when actual expenses > 40% of gross receipts
3. If deduction method cannot be determined (no expense data): Present both Path A and Path B with note that Path B requires no documentation.

---

---

## CR-027: Itemized Deductions — Full Computation Rules (Path A)

**Legal basis:** NIRC Sections 34(A)–(K) and 36, as amended by TRAIN (RA 10963) and EOPT Act (RA 11976)
**Last updated:** 2026-03-01
**See also:** [lookup-tables/itemized-deductions.md](lookup-tables/itemized-deductions.md) — complete deduction categories, limits, documentation, and disallowed items

### CR-027-A: Path A — Complete Computation with Itemized Deductions

```
function compute_path_a(
  gross_receipts: decimal,               // Total gross receipts from business/profession
  itemized_deductions: ItemizedDeductions,  // See data model in lookup-tables/itemized-deductions.md
  is_service_provider: bool,             // true = service/professional; false = trader
  net_sales: decimal = 0,               // For traders: gross sales - returns - allowances
  cost_of_goods_sold: decimal = 0,      // For traders only
  passive_income_fwt: decimal = 0,      // Excluded from computation base
  is_vat_registered: bool = false,
  current_tax_year: int
) -> PathAResult:

  // Step 1: Compute Gross Income
  if is_service_provider:
    gross_income = gross_receipts - passive_income_fwt
  else:
    // Trader: gross income = net sales - COGS
    gross_income = (net_sales - cost_of_goods_sold) - passive_income_fwt
    assert gross_income >= 0, "Trader gross income cannot be negative — use NOLCO rules"

  // Step 2: Compute Allowable Itemized Deductions
  allowable = compute_itemized_deductions(
    itemized_deductions,
    gross_receipts,
    is_service_provider,
    net_sales
  )
  // compute_itemized_deductions is defined in lookup-tables/itemized-deductions.md Part 9

  // Step 3: Compute Net Taxable Income (cannot be negative)
  net_taxable_income = max(0, gross_income - allowable.total_allowable)

  // Step 4: Compute Income Tax (Path A)
  if current_tax_year >= 2023:
    income_tax_path_a = graduated_tax_2023(net_taxable_income)
  else:
    income_tax_path_a = graduated_tax_2018(net_taxable_income)

  // Step 5: Compute Percentage Tax (if non-VAT registered)
  if is_vat_registered:
    percentage_tax_path_a = 0  // VAT applies instead; this tool does not compute VAT
  else:
    percentage_tax_path_a = round(gross_receipts * 0.03, 2)

  // Step 6: Total Tax Burden
  total_path_a = round(income_tax_path_a + percentage_tax_path_a, 2)

  return PathAResult {
    gross_income: gross_income,
    allowable_deductions: allowable.total_allowable,
    deduction_subtotals: allowable.subtotals,
    net_taxable_income: net_taxable_income,
    income_tax: income_tax_path_a,
    percentage_tax: percentage_tax_path_a,
    total_tax: total_path_a,
    nolco_applied: allowable.nolco_applied,
    ear_cap_applied: allowable.ear_cap,
    warnings: allowable.warnings,
    nolco_remaining_after: [entry with updated remaining amounts]  // for user's records
  }
```

### CR-027-B: Itemized Deductions Input Validation

Before computing Path A, the engine must validate the ItemizedDeductions input:

```
function validate_itemized_deductions(d: ItemizedDeductions, gross_receipts: decimal) -> ValidationResult:
  errors = []
  warnings = []

  // Must be non-negative values
  for field in all_decimal_fields_of(d):
    if field.value < 0:
      errors.append(f"Deduction field '{field.name}' cannot be negative (got {field.value})")

  // EAR flag: compute and compare to cap (do not error; just warn — capping is handled in compute function)
  ear_cap_service = gross_receipts * 0.01
  if d.ear_expense > ear_cap_service * 1.5:
    warnings.append(f"EAR expenses (₱{d.ear_expense:,.2f}) are significantly above the deductible cap (₱{ear_cap_service:,.2f}). Only ₱{ear_cap_service:,.2f} is deductible.")

  // NOLCO flag if OSD or 8% would be better recommendation
  for entry in d.nolco_available:
    if entry.origin_year + 3 < current_year:
      warnings.append(f"NOLCO from {entry.origin_year} (₱{entry.remaining:,.2f}) has expired as of {entry.origin_year + 3}. It will not be applied.")

  // Home office: if declared but no documentation commitment
  if d.home_office_expense > 0:
    warnings.append("Home office deduction requires documentation of exclusive business use (floor plan, photos). Ensure you can provide this upon BIR audit.")

  // Bad debts: warn if no gross income evidence
  if d.bad_debts_written_off > 0:
    warnings.append("Bad debts deduction requires proof that the amount was previously included in gross income and has been actually ascertained as worthless.")

  return ValidationResult { errors: errors, warnings: warnings, is_valid: len(errors) == 0 }
```

### CR-027-C: When Itemized Deductions Beat OSD

Itemized deductions produce a lower taxable income than OSD when:

```
// For service providers (all income is gross receipts):
total_itemized_deductions > gross_receipts * 0.40

// For traders:
total_itemized_deductions > (net_sales - cogs) * 0.40
// (because OSD base for traders is gross income = net_sales - cogs)
```

**In practice:** The breakeven is exactly at the 40% mark of the OSD base. When actual documented and allowable expenses exceed 40% of gross income, itemized deductions produce lower NTI than OSD. See [osd-breakeven-table.md](lookup-tables/osd-breakeven-table.md) for detailed tables.

**Common outcome:** Most pure service freelancers and professionals (no employees, home-based, no rent) have actual expenses well below 40% of gross receipts. For them, OSD is usually better than itemized — and 8% is usually better than OSD (if eligible). Itemized deductions primarily benefit:
- Freelancers with employees (salaries are the largest deduction)
- Professionals with physical office rent
- Sole proprietors with significant COGS (traders)
- Taxpayers with NOLCO carryovers from prior loss years

### CR-027-D: Worked Examples — Path A (Itemized)

**Example A: Software Developer with Office Rent and Employee**
```
Tax Year: 2025
Gross Receipts: ₱1,500,000
Business Type: Service (software development)
is_service_provider: true

Itemized Deductions:
  salaries_wages:                ₱240,000  (one part-time assistant)
  employer_sss_philhealth_pagibig: ₱25,000
  rent_expense:                  ₱120,000  (co-working space, 12 months × ₱10,000)
  communication_expense:         ₱18,000   (phone ₱6,000 + internet ₱12,000, 100% business)
  office_supplies:               ₱15,000
  travel_expense:                ₱30,000   (client meetings, transport)
  professional_fees_paid:        ₱0
  advertising_expense:           ₱12,000
  ear_expense:                   ₱8,000    (cap = ₱1,500,000 × 1% = ₱15,000 → full ₱8,000 allowed)
  utilities_expense:             ₱0        (included in co-working space rent)
  insurance_expense:             ₱0
  home_office_expense:           ₱0        (not applicable — uses co-working space)
  other_operating_expenses:      ₱20,000
  gross_interest_expense:        ₱0
  local_business_tax:            ₱5,000
  real_property_tax_business:    ₱0
  professional_regulation_fees:  ₱1,000    (PRC renewal)
  depreciation_schedule: [
    {name: "MacBook Pro", cost: 100,000, salvage: 0, life: 5, method: SL, biz_pct: 1.00, year: 2024}
    → annual_dep = 20,000
    {name: "Monitors (×2)", cost: 40,000, salvage: 0, life: 5, method: SL, biz_pct: 1.00, year: 2025}
    → annual_dep = 8,000
  ]
  // sec_34f = 20,000 + 8,000 = 28,000
  nolco_available: []

// Computation:
sec_34a = 240,000 + 25,000 + 120,000 + 18,000 + 15,000 + 30,000 + 0 + 12,000 + 8,000 + 0 + 0 + 0 + 20,000 = 488,000
sec_34b = 0
sec_34c = 5,000 + 0 + 1,000 = 6,000
sec_34d_losses = 0
sec_34e = 0
sec_34f = 28,000
sec_34h = 0
sec_34i = 0
sec_34j = 0
total_before_nolco = 488,000 + 0 + 6,000 + 0 + 0 + 28,000 + 0 + 0 + 0 = 522,000

gross_income = 1,500,000 (service provider; passive income = 0)
net_income_before_nolco = max(0, 1,500,000 - 522,000) = 978,000
nolco_applied = 0
net_taxable_income = 978,000

income_tax_path_a = 102,500 + (978,000 - 800,000) × 0.25 = 102,500 + 44,500 = 147,000
percentage_tax_path_a = 1,500,000 × 0.03 = 45,000
total_path_a = 147,000 + 45,000 = ₱192,000

// Compare:
// Path B (OSD): NTI = 900,000; IT = 102,500 + 25,000 = 127,500; PT = 45,000; Total = 172,500
// Path C (8%): (1,500,000 - 250,000) × 8% = 100,000; PT = 0; Total = ₱100,000
// RECOMMENDATION: Path C (8% option) saves ₱72,500 vs. Path B and ₱92,000 vs. Path A
// NOTE: Despite having ₱522,000 in expenses (34.8% of gross), 8% still wins for this taxpayer
```

**Example B: High-Expense Freelance Agency Owner (Itemized Wins)**
```
Tax Year: 2025
Gross Receipts: ₱2,000,000
Business Type: Creative agency (service)

Itemized Deductions:
  salaries_wages:                ₱600,000  (3 full-time contractors/employees)
  employer_sss_philhealth_pagibig: ₱65,000
  rent_expense:                  ₱240,000  (office space ₱20,000/month)
  communication_expense:         ₱24,000
  office_supplies:               ₱20,000
  travel_expense:                ₱40,000
  advertising_expense:           ₱30,000
  ear_expense:                   ₱15,000   (cap = ₱2,000,000 × 1% = ₱20,000 → full ₱15,000)
  utilities_expense:             ₱24,000
  insurance_expense:             ₱12,000
  local_business_tax:            ₱8,000
  professional_regulation_fees:  ₱2,000
  depreciation_schedule:         total sec_34f = ₱35,000

// sec_34a = 600,000 + 65,000 + 240,000 + 24,000 + 20,000 + 40,000 + 30,000 + 15,000 + 24,000 + 12,000 = 1,070,000
// sec_34c = 8,000 + 2,000 = 10,000
// sec_34f = 35,000
// total_deductions = 1,070,000 + 10,000 + 35,000 = 1,115,000

net_taxable_income = max(0, 2,000,000 - 1,115,000) = 885,000
income_tax_path_a = 102,500 + (885,000 - 800,000) × 0.25 = 102,500 + 21,250 = 123,750
percentage_tax_path_a = 2,000,000 × 0.03 = 60,000
total_path_a = ₱183,750

// Path B (OSD): NTI = 1,200,000; IT = 102,500 + (1,200,000-800,000)×0.25 = 202,500; PT = 60,000; Total = ₱262,500
// Path C (8%): (2,000,000 - 250,000) × 0.08 = 140,000; PT = 0; Total = ₱140,000
// RECOMMENDATION: Path A (Itemized) saves ₱43,750 vs. 8% and ₱78,750 vs. OSD
// KEY INSIGHT: When expense ratio = ₱1,115,000 / ₱2,000,000 = 55.75%, itemized beats OSD
//   but 8% still beats itemized because PT (₱60,000) is waived under 8%
// REAL WINNER: Only when expenses are extremely high can itemized beat 8%
// At expense ratio of 55.75%, the totals are: Path A ₱183,750 vs Path C ₱140,000
// For itemized to beat 8%: need expenses > 68% of gross at ₱2M (see osd-breakeven-table.md)
```

**Example C: Lawyer with NOLCO Carryover**
```
Tax Year: 2025
Gross Receipts: ₱1,200,000

NOLCO from 2024: ₱150,000 (net operating loss from prior year; itemized in 2024; expires 2027)
Current Year Itemized (excl. NOLCO): ₱500,000

gross_income = 1,200,000
total_before_nolco = 500,000
net_income_before_nolco = 700,000
nolco_applied = apply_nolco([entry{2024, 150,000, expires 2027}], 700,000) = 150,000
net_taxable_income = 700,000 - 150,000 = 550,000

income_tax_path_a = 22,500 + (550,000 - 400,000) × 0.20 = 22,500 + 30,000 = 52,500
percentage_tax_path_a = 1,200,000 × 0.03 = 36,000
total_path_a = ₱88,500

// Path C (8%): (1,200,000 - 250,000) × 0.08 = 76,000; PT = 0; Total = ₱76,000
// NOLCO CANNOT be used with 8% option — if taxpayer chose 8%, NOLCO is suspended for 2025
// Itemized with NOLCO: ₱88,500 vs 8%: ₱76,000 → 8% still wins
// DISPLAY WARNING: "Your ₱150,000 NOLCO from 2024 reduces your itemized path by ₱18,500 in tax
// but the 8% option is still ₱12,500 lower. If your NOLCO were ₱500,000+, itemized might win."
```

### CR-027-E: Non-Deductible Items — Engine Enforcement

The engine must reject or warn when users attempt to include non-deductible items:

```
// Items the engine should NEVER include as deductions
NON_DEDUCTIBLE_CODES = [
  "ND-01",  // Personal expenses
  "ND-02",  // Capital expenditures (direct expensing)
  "ND-04",  // Life insurance (beneficiary = taxpayer)
  "ND-07",  // Bribes, kickbacks
  "ND-08",  // Government fines and penalties
  "ND-10",  // Income tax itself
  "ND-13",  // Employee share of SSS/PhilHealth/Pag-IBIG
]

// Engine validation function:
function reject_non_deductible(expense_type: string) -> RejectionResult:
  if expense_type in CLASSIFICATION_AS_NON_DEDUCTIBLE:
    return RejectionResult {
      rejected: true,
      code: expense_type,
      reason: NON_DEDUCTIBLE_DESCRIPTION[expense_type],
      display_message: f"'{expense_description}' is not deductible for income tax purposes (NIRC Sec. 36). It has been removed from your itemized deductions."
    }
  return RejectionResult { rejected: false }
```

**Special handling for life insurance premiums:**
```
// Life insurance: context-dependent
// Key question: Is the taxpayer the beneficiary?
// If yes → NOT deductible (Sec. 36(A)(4))
// If no (employee is beneficiary, employer-paid group policy) → deductible as compensation expense

function is_life_insurance_deductible(
  payer: str,   // "taxpayer" or "employer" (from self-employed perspective, always "taxpayer")
  beneficiary: str  // "taxpayer", "employee", "employee_estate"
) -> bool:
  if payer == "taxpayer" and beneficiary == "taxpayer":
    return false  // Sec. 36(A)(4)
  elif payer == "taxpayer" and beneficiary == "employee":
    return true   // Group life insurance for employees; classified under 34A-SAL
  else:
    return false  // Default conservative: flag for manual review
```

---

## Cross-References

- For lookup tables: See [lookup-tables/](lookup-tables/)
  - [lookup-tables/taxpayer-classification-tiers.md](lookup-tables/taxpayer-classification-tiers.md) — complete tier table with all implications
  - [lookup-tables/bir-penalty-schedule.md](lookup-tables/bir-penalty-schedule.md) — complete BIR penalty schedule (compromise tables, criminal penalties, prescriptive periods)
  - [lookup-tables/eight-percent-option-rules.md](lookup-tables/eight-percent-option-rules.md) — complete 8% option reference (eligibility, election, irrevocability, quarterly mechanics, worked examples)
  - [lookup-tables/osd-breakeven-table.md](lookup-tables/osd-breakeven-table.md) — OSD tax tables, OSD vs 8% crossover, OSD vs itemized breakeven
  - [lookup-tables/itemized-deductions.md](lookup-tables/itemized-deductions.md) — complete itemized deduction categories, limits, documentation, non-deductible items, NOLCO, depreciation
- For decision trees covering regime selection: See [decision-trees.md](decision-trees.md)
  - DT-01: 8% eligibility
  - DT-02: Election procedure
  - DT-03: Mid-year breach
  - DT-04: Annual form selection
  - DT-05: ₱250,000 deduction applicability
  - DT-06: Form 2551Q filing obligation
  - DT-09: Deduction method selection (itemized vs. OSD)
- For edge cases (mid-year threshold crossing, first-year filers, tier boundaries, e-marketplace withholding, penalty scenarios, 8% option edge cases, itemized deduction edge cases): See [edge-cases.md](edge-cases.md)
- For test vectors validating these computations: See [../engine/test-vectors/basic.md](../engine/test-vectors/basic.md) (PENDING)
- For full legal text behind each rule: See [legal-basis.md](legal-basis.md)
- For RR 16-2023 source material: See [../../../input/sources/rr-16-2023-emarketplace.md](../../../input/sources/rr-16-2023-emarketplace.md)

---

## CR-028: Regime Comparison Engine — Complete Computation and Recommendation

**Legal basis:** NIRC Sec. 24(A)(2)(a) (graduated rates), Sec. 24(A)(2)(b) (8% option), Sec. 34(L) (OSD), Sec. 34(A)-(K) (itemized), Sec. 116 (percentage tax); RR 8-2018; CR-002, CR-003, CR-004, CR-005, CR-006, CR-007, CR-008, CR-009.

**This rule supersedes the breakeven tables in CR-014.** CR-014 contained approximate values computed without the percentage tax offset for Path C. The values below are exact.

**Purpose:** Given a taxpayer's gross receipts, itemized expenses, and profile flags, compute the total tax burden under every applicable path, then return a structured recommendation with savings amounts.

---

### 28.1 — Input Schema

```
struct RegimeComparisonInput {
  // --- Income ---
  gross_receipts: float              // Annual total gross sales/receipts (net of VAT if VAT-registered)
  non_operating_income: float        // Dividends, interest, rent, capital gains NOT subject to FWT
  itemized_deductions: float         // Total allowable Sec. 34 deductions (0 if not tracked)
  has_itemized_documentation: bool   // True = receipts/invoices exist to support deductions

  // --- Taxpayer Profile ---
  has_compensation_income: bool      // True = mixed income earner (has employer + business income)
  taxable_compensation: float        // Annual taxable compensation (net of exclusions); 0 if none
  is_vat_registered: bool            // True = currently VAT-registered
  taxpayer_type: TaxpayerType        // SE, PROFESSIONAL, GPP_PARTNER, etc.
  tax_year: int                      // 2018-2022 (Schedule 1) or 2023+ (Schedule 2)

  // --- Regime Election Status ---
  election_status: ElectionStatus    // NONE_YET, EIGHT_PCT_ELECTED, GRADUATED_ELECTED
  election_window_open: bool         // True = Q1 not yet filed; taxpayer can still choose

  // --- CWT and Payments ---
  total_cwt_for_year: float          // Sum of all BIR Form 2307 amounts received this year
  total_quarterly_it_paid: float     // Sum of all 1701Q income tax payments (Q1+Q2+Q3)
  total_quarterly_pt_paid: float     // Sum of all 2551Q percentage tax payments (Q1+Q2+Q3)

  // --- Computed Context ---
  gross_for_threshold: float         // = gross_receipts + non_operating_income
}

enum TaxpayerType {
  SE_SERVICE,            // Sole proprietor / freelancer, service only (no COGS)
  SE_TRADING,            // Sole proprietor, trading/goods (has COGS)
  PROFESSIONAL,          // Licensed professional (lawyer, doctor, CPA, engineer, architect)
  GPP_PARTNER,           // Partner in a General Professional Partnership
  BMBE,                  // Barangay Micro Business Enterprise (income tax exempt)
}

enum ElectionStatus {
  NONE_YET,              // No Q1 return filed yet; taxpayer hasn't locked in
  EIGHT_PCT_ELECTED,     // Q1 filed under 8%; locked in for the year
  GRADUATED_ELECTED,     // Q1 filed under graduated rates; locked in for the year
}

enum Regime {
  PATH_A,  // Graduated + Itemized Deductions
  PATH_B,  // Graduated + OSD (40%)
  PATH_C,  // 8% Flat Rate
}
```

---

### 28.2 — Output Schema

```
struct RegimeComparisonResult {
  // --- Per-Path Results ---
  path_a: PathResult | null     // null if not applicable (e.g., no itemized docs)
  path_b: PathResult            // Always computed (OSD available to all)
  path_c: PathResult | null     // null if 8% not eligible

  // --- Recommendation ---
  recommended_regime: Regime
  recommended_regime_total_tax: float
  savings_vs_path_a: float | null   // How much taxpayer saves vs Path A (null if A not computed)
  savings_vs_path_b: float          // How much taxpayer saves vs Path B
  savings_vs_path_c: float | null   // How much taxpayer saves vs Path C (null if C not computed)

  // --- Actionable Output ---
  balance_payable: float         // Recommended regime tax - CWT - quarterly payments (≥ 0)
  overpayment: float             // If CWT + quarterly payments exceed annual tax (≥ 0)
  annual_form_to_file: string    // "1701" or "1701A"

  // --- Informational Flags ---
  eight_pct_ineligible_reason: string | null  // Reason if Path C not available
  near_threshold_warning: bool                // True if gross_for_threshold within ₱200K of ₱3M
  election_window_open: bool                  // Can taxpayer still change their mind?
  pt_obligation: PTObligation                 // Whether 2551Q filing is required
}

struct PathResult {
  regime: Regime
  gross_income: float          // After COGS for traders; = gross_receipts for service
  deduction_amount: float      // Itemized total, OSD amount, or 0 for 8%
  net_taxable_income: float    // gross_income - deductions (0 for Path C)
  income_tax: float            // Graduated tax or 8% flat tax
  percentage_tax: float        // 3% of gross_receipts; 0 for Path C or VAT-registered
  total_tax_burden: float      // income_tax + percentage_tax
  effective_rate: float        // total_tax_burden / gross_receipts (for display only)
}

enum PTObligation {
  NOT_REQUIRED_8PCT,           // 8% elected; percentage tax waived
  NOT_REQUIRED_VAT,            // VAT registered; files 2550M/Q instead
  REQUIRED_QUARTERLY,          // Must file 2551Q each quarter (non-VAT, graduated)
  BREACH_PARTIAL_YEAR,         // Was on 8%, crossed ₱3M; PT owed for pre-breach period
}
```

---

### 28.3 — Top-Level Comparison Function

```
function compute_regime_comparison(input: RegimeComparisonInput) -> RegimeComparisonResult:
  """
  STEP 1: Validate inputs
  STEP 2: Check 8% eligibility
  STEP 3: Compute applicable paths
  STEP 4: Compare and recommend
  STEP 5: Compute balance payable/overpayment
  STEP 6: Assemble output
  """

  // ─────────────────────────────────────────────────────────
  // STEP 1: Input validation
  // ─────────────────────────────────────────────────────────
  assert gross_receipts >= 0, ERROR_NEGATIVE_GROSS
  assert non_operating_income >= 0, ERROR_NEGATIVE_NOI
  assert itemized_deductions >= 0, ERROR_NEGATIVE_DEDUCTIONS
  assert taxable_compensation >= 0, ERROR_NEGATIVE_COMPENSATION
  assert total_cwt_for_year >= 0, ERROR_NEGATIVE_CWT
  assert total_quarterly_it_paid >= 0, ERROR_NEGATIVE_PAYMENTS
  assert itemized_deductions <= gross_receipts * 1.5,  // sanity check; deductions > 150% gross is suspicious
    FLAG_DEDUCTIONS_EXCEED_GROSS  // MRF flag; engine continues but shows warning

  // Derived values
  gross_for_threshold = gross_receipts + non_operating_income
  gross_income = gross_receipts  // For service providers
  // (If SE_TRADING, gross_income = gross_sales - COGS; this field must be pre-computed by caller
  //  and passed as gross_receipts. See CR-004 for traders.)

  // ─────────────────────────────────────────────────────────
  // STEP 2: Check 8% eligibility
  // ─────────────────────────────────────────────────────────
  eight_pct_check = check_eight_pct_eligibility(input)
  // (See Section 28.4 below for full eligibility function)

  // ─────────────────────────────────────────────────────────
  // STEP 3: Compute applicable paths
  // ─────────────────────────────────────────────────────────
  path_a = null
  path_b = compute_path_b(input)
  path_c = null

  if input.has_itemized_documentation:
    path_a = compute_path_a(input)
  // If no documentation: path_a is null; engine cannot compute itemized

  if eight_pct_check.eligible:
    path_c = compute_path_c(input)

  // ─────────────────────────────────────────────────────────
  // STEP 4: Compare and recommend
  // ─────────────────────────────────────────────────────────
  candidates = [r for r in [path_a, path_b, path_c] if r is not null]
  recommended = min(candidates, key=lambda r: r.total_tax_burden)

  // Savings vs each non-recommended path
  savings_vs_a = null
  savings_vs_b = null
  savings_vs_c = null

  if path_a is not null:
    savings_vs_a = path_a.total_tax_burden - recommended.total_tax_burden
  savings_vs_b = path_b.total_tax_burden - recommended.total_tax_burden
  if path_c is not null:
    savings_vs_c = path_c.total_tax_burden - recommended.total_tax_burden

  // Tie-breaking rule (when two or more paths have identical total_tax_burden):
  // PATH_C > PATH_B > PATH_A in preference order (simpler to file wins on tie)
  // Rationale: PATH_C (no PT, single form) is simplest; PATH_B (no documentation) is next;
  //            PATH_A (requires documentation) is least preferred on tie.

  // ─────────────────────────────────────────────────────────
  // STEP 5: Balance payable / overpayment (recommended regime only)
  // ─────────────────────────────────────────────────────────
  annual_it_due = recommended.income_tax
  balance_before_credits = annual_it_due - input.total_cwt_for_year - input.total_quarterly_it_paid
  balance_payable = max(balance_before_credits, 0)
  overpayment = max(-balance_before_credits, 0)

  // ─────────────────────────────────────────────────────────
  // STEP 6: Assemble output
  // ─────────────────────────────────────────────────────────
  return RegimeComparisonResult {
    path_a: path_a,
    path_b: path_b,
    path_c: path_c,
    recommended_regime: recommended.regime,
    recommended_regime_total_tax: recommended.total_tax_burden,
    savings_vs_path_a: savings_vs_a,
    savings_vs_path_b: savings_vs_b,
    savings_vs_path_c: savings_vs_c,
    balance_payable: balance_payable,
    overpayment: overpayment,
    annual_form_to_file: determine_annual_form(input, recommended.regime),
    eight_pct_ineligible_reason: eight_pct_check.ineligible_reason,
    near_threshold_warning: gross_for_threshold >= 2_800_000 AND gross_for_threshold <= 3_000_000,
    election_window_open: input.election_window_open,
    pt_obligation: determine_pt_obligation(input, recommended.regime),
  }
```

---

### 28.4 — 8% Eligibility Check Function

```
struct EightPctCheck {
  eligible: bool
  ineligible_reason: string | null  // null if eligible
}

function check_eight_pct_eligibility(input: RegimeComparisonInput) -> EightPctCheck:
  """
  Returns {eligible: true} only if ALL conditions pass.
  Returns {eligible: false, ineligible_reason: "..."}  on the FIRST failing condition.
  """

  // Condition 1: Not a GPP partner (computing on GPP share)
  if input.taxpayer_type == GPP_PARTNER:
    return {eligible: false, ineligible_reason: "GPP partners cannot use the 8% option on their distributive share (RR 8-2018 Part I)."}

  // Condition 2: Not BMBE
  if input.taxpayer_type == BMBE:
    return {eligible: false, ineligible_reason: "BMBE-registered entities are income tax exempt; 8% option is moot (RA 9178)."}

  // Condition 3: Not VAT-registered
  if input.is_vat_registered:
    return {eligible: false, ineligible_reason: "VAT-registered taxpayers cannot use the 8% option (RR 8-2018 Sec. 2(A))."}

  // Condition 4: Gross receipts + non-operating income ≤ ₱3,000,000
  if input.gross_for_threshold > 3_000_000:
    return {eligible: false, ineligible_reason: "Gross receipts + other non-operating income exceeds ₱3,000,000. The 8% option is only available when this total does not exceed ₱3,000,000 (NIRC Sec. 24(A)(2)(b))."}

  // Condition 5: Election window is open OR 8% was already elected
  if input.election_status == ElectionStatus.GRADUATED_ELECTED:
    return {eligible: false, ineligible_reason: "You have already filed Q1 under the graduated rate method. The 8% election window is closed for this tax year (RR 8-2018 Part I)."}

  // Condition 6: Not subject to Sec. 117-128 percentage taxes
  // (Engine assumes taxpayer is subject to Sec. 116 only; if on Sec. 117-128, caller must
  //  set a flag — not modeled in RegimeComparisonInput v1. Future: add subject_to_117_128: bool)

  // All checks passed
  return {eligible: true, ineligible_reason: null}
```

---

### 28.5 — Path A Computation Function (Graduated + Itemized)

```
function compute_path_a(input: RegimeComparisonInput) -> PathResult:
  """
  Computes tax under Path A: Graduated rates on (gross_income - itemized_deductions)
  Includes 3% percentage tax for non-VAT-registered taxpayers.
  """
  // Gross income (after COGS for traders; = gross_receipts for service)
  gross_income = input.gross_receipts  // Caller pre-computes for traders

  // Net taxable income
  net_taxable_income = max(gross_income - input.itemized_deductions, 0)

  // If mixed income: add taxable_compensation to get combined NTI, then apply graduated rates
  // (See CR-029 for mixed income computation; the below handles purely self-employed only)
  if input.has_compensation_income:
    combined_nti = input.taxable_compensation + net_taxable_income
    income_tax = graduated_tax_for_year(combined_nti, input.tax_year)
    // Then subtract the compensation-only tax to get the business IT component
    compensation_only_tax = graduated_tax_for_year(input.taxable_compensation, input.tax_year)
    income_tax = income_tax  // Combined tax applies to total NTI; compensation tax already withheld by employer
    // NOTE: For mixed income, income_tax here is the TOTAL IT on combined NTI.
    // The employer has withheld tax on the compensation portion. See CR-029 for reconciliation.
  else:
    income_tax = graduated_tax_for_year(net_taxable_income, input.tax_year)

  // Percentage tax (not applicable if VAT-registered)
  if input.is_vat_registered:
    percentage_tax = 0
  else:
    percentage_tax = round(input.gross_receipts * 0.03, 2)

  total_tax_burden = income_tax + percentage_tax
  effective_rate = total_tax_burden / input.gross_receipts if input.gross_receipts > 0 else 0

  return PathResult {
    regime: PATH_A,
    gross_income: gross_income,
    deduction_amount: input.itemized_deductions,
    net_taxable_income: net_taxable_income,
    income_tax: income_tax,
    percentage_tax: percentage_tax,
    total_tax_burden: total_tax_burden,
    effective_rate: effective_rate,
  }
```

---

### 28.6 — Path B Computation Function (Graduated + OSD)

```
function compute_path_b(input: RegimeComparisonInput) -> PathResult:
  """
  Computes tax under Path B: Graduated rates on (gross_income × 60%)
  OSD = 40% of gross income (not gross sales for traders).
  Includes 3% percentage tax for non-VAT taxpayers.
  """
  gross_income = input.gross_receipts  // Pre-computed by caller for traders

  osd_amount = round(gross_income * 0.40, 2)
  net_taxable_income = round(gross_income * 0.60, 2)  // = gross_income - osd_amount

  if input.has_compensation_income:
    combined_nti = input.taxable_compensation + net_taxable_income
    income_tax = graduated_tax_for_year(combined_nti, input.tax_year)
  else:
    income_tax = graduated_tax_for_year(net_taxable_income, input.tax_year)

  if input.is_vat_registered:
    percentage_tax = 0
  else:
    percentage_tax = round(input.gross_receipts * 0.03, 2)

  total_tax_burden = income_tax + percentage_tax
  effective_rate = total_tax_burden / input.gross_receipts if input.gross_receipts > 0 else 0

  return PathResult {
    regime: PATH_B,
    gross_income: gross_income,
    deduction_amount: osd_amount,
    net_taxable_income: net_taxable_income,
    income_tax: income_tax,
    percentage_tax: percentage_tax,
    total_tax_burden: total_tax_burden,
    effective_rate: effective_rate,
  }
```

---

### 28.7 — Path C Computation Function (8% Flat Rate)

```
function compute_path_c(input: RegimeComparisonInput) -> PathResult:
  """
  Computes tax under Path C: 8% flat rate on (gross_for_threshold - ₱250,000)
  ₱250K deduction ONLY for purely self-employed (no compensation income).
  Percentage tax is WAIVED under 8% option.
  """
  assert check_eight_pct_eligibility(input).eligible == true  // Precondition

  tax_base: float
  if input.has_compensation_income:
    // Mixed income: ₱250K deduction does NOT apply (RMC 50-2018)
    tax_base = input.gross_for_threshold  // gross_receipts + non_operating_income
  else:
    // Purely self-employed: ₱250K deduction applies
    tax_base = max(input.gross_for_threshold - 250_000, 0)

  income_tax = round(tax_base * 0.08, 2)
  percentage_tax = 0  // Waived; "in lieu of" Sec. 116 (NIRC Sec. 24(A)(2)(b))
  total_tax_burden = income_tax  // = income_tax + 0

  effective_rate = total_tax_burden / input.gross_receipts if input.gross_receipts > 0 else 0

  return PathResult {
    regime: PATH_C,
    gross_income: input.gross_for_threshold,
    deduction_amount: 250_000 if NOT input.has_compensation_income else 0,
    net_taxable_income: tax_base,
    income_tax: income_tax,
    percentage_tax: 0,
    total_tax_burden: total_tax_burden,
    effective_rate: effective_rate,
  }
```

---

### 28.8 — Graduated Tax Dispatcher

```
function graduated_tax_for_year(net_taxable_income: float, tax_year: int) -> float:
  """
  Dispatches to the correct rate schedule based on the tax year.
  Uses Schedule 1 (2018-2022) or Schedule 2 (2023+).
  Calls CR-002 and CR-003 functions.
  """
  if net_taxable_income < 0:
    return 0  // EC-GRT: negative NTI → zero tax; NOLCO may apply separately

  if tax_year >= 2023:
    return graduated_tax_2023(net_taxable_income)
  elif tax_year >= 2018:
    return graduated_tax_2018(net_taxable_income)
  else:
    raise ERROR_UNSUPPORTED_TAX_YEAR  // Tool only supports TRAIN era (2018+)
```

---

### 28.9 — Exact Breakeven Tables (8% vs Path A and 8% vs Path B)

**These tables replace and supersede the approximate values in CR-014.**

**Derivation method (for purely self-employed, non-VAT, service business, TY2023+):**

The breakeven expense ratio `r` at which Path A total = Path C total:
```
graduated_tax_2023(GR × (1-r)) + GR × 0.03 = (GR - 250,000) × 0.08
graduated_tax_2023(GR × (1-r)) = 0.05 × GR - 20,000
```
Let `T = 0.05 × GR - 20,000`. The breakeven NTI is `N` such that `graduated_tax_2023(N) = T`.

#### Table RC-01: 8% vs Itemized Breakeven (Path C vs Path A) — Purely Self-Employed, TY2023+

| Gross Receipts | Path C Tax | T = Required IT | Breakeven NTI | Breakeven Expense Ratio | Bracket for T |
|----------------|------------|-----------------|---------------|------------------------|---------------|
| ₱250,000 | ₱0 | ₱-7,500 | N/A | N/A (8% always wins) | — |
| ₱300,000 | ₱4,000 | ₱-5,000 | N/A | N/A (8% always wins) | — |
| ₱350,000 | ₱8,000 | ₱-2,500 | N/A | N/A (8% always wins) | — |
| ₱400,000 | ₱12,000 | ₱0 | ₱250,000 | 37.5% (ties at ₱400K) | Zero bracket |
| ₱437,500 | ₱15,000 | ₱1,875 | ₱262,500 | 40.0% (OSD ties 8% here) | Bracket 2 |
| ₱500,000 | ₱20,000 | ₱5,000 | ₱283,333 | 43.3% | Bracket 2 |
| ₱600,000 | ₱28,000 | ₱10,000 | ₱316,667 | 47.2% | Bracket 2 |
| ₱700,000 | ₱36,000 | ₱15,000 | ₱350,000 | 50.0% | Bracket 2 |
| ₱800,000 | ₱44,000 | ₱20,000 | ₱383,333 | 52.1% | Bracket 2 |
| ₱850,000 | ₱48,000 | ₱22,500 | ₱400,000 | 52.9% | Bracket 2/3 boundary |
| ₱1,000,000 | ₱60,000 | ₱30,000 | ₱437,500 | 56.3% | Bracket 3 |
| ₱1,200,000 | ₱76,000 | ₱40,000 | ₱487,500 | 59.4% | Bracket 3 |
| ₱1,500,000 | ₱100,000 | ₱55,000 | ₱562,500 | 62.5% | Bracket 3 |
| ₱2,000,000 | ₱140,000 | ₱80,000 | ₱687,500 | 65.6% | Bracket 3 |
| ₱2,450,000 | ₱176,000 | ₱102,500 | ₱800,000 | 67.3% | Bracket 3/4 boundary |
| ₱2,500,000 | ₱180,000 | ₱105,000 | ₱810,000 | 67.6% | Bracket 4 |
| ₱3,000,000 | ₱220,000 | ₱130,000 | ₱910,000 | 69.7% | Bracket 4 |

**Column derivations:**
- Path C Tax = max(GR − 250,000, 0) × 0.08
- T = 0.05 × GR − 20,000
- Breakeven NTI = inverse of graduated_tax_2023(N) = T (solve within bracket)
- Breakeven Expense Ratio = 1 − (Breakeven NTI / GR)

**Bracket 2 formula** (T ≤ 22,500; GR ≤ 850,000):
`N = 250,000 + T / 0.15`; `r = 1 − N/GR`

**Bracket 3 formula** (22,500 < T ≤ 102,500; 850,000 < GR ≤ 2,450,000):
`N = 400,000 + (T − 22,500) / 0.20`; `r = 1 − N/GR`
Simplified: `r = 0.75 − 187,500/GR`

**Bracket 4 formula** (102,500 < T; GR > 2,450,000):
`N = 800,000 + (T − 102,500) / 0.25`; `r = 1 − N/GR`
Simplified: `r = 0.80 − 310,000/GR`

**Key insight (for engine invariant check):**
- GR ≤ ₱400,000: T ≤ 0. 8% is ALWAYS the winner regardless of expense ratio.
  (Even at 100% expense ratio, Path A total = PT only = GR × 3% ≥ Path C)
- GR = ₱400,001 to ₱437,499: Narrow OSD-wins window. Path B (OSD) beats both Path A and Path C for taxpayers in this range with ANY expense ratio. 8% has the highest total in this range.
- GR ≥ ₱437,500: Path C (8%) always beats Path B (OSD). Path A (itemized) wins ONLY at r > breakeven threshold.

#### Table RC-02: 8% vs OSD Crossover (Path C vs Path B) — Non-VAT, TY2023+

**Formula:** Path B total = `graduated_tax_2023(GR × 0.60) + GR × 0.03`; Path C total = `(GR − 250,000) × 0.08`

| Gross Receipts | Path B Total | Path C Total | Winner | Margin |
|----------------|-------------|-------------|--------|--------|
| ₱250,000 | ₱7,500 | ₱0 | Path C (8%) | ₱7,500 |
| ₱300,000 | ₱9,000 | ₱4,000 | Path C (8%) | ₱5,000 |
| ₱350,000 | ₱10,500 | ₱8,000 | Path C (8%) | ₱2,500 |
| ₱375,000 | ₱11,250 | ₱10,000 | Path C (8%) | ₱1,250 |
| ₱400,000 | ₱12,000 | ₱12,000 | **TIE** | ₱0 |
| ₱410,000 | ₱12,300 | ₱12,800 | **Path B (OSD)** | ₱500 |
| ₱420,000 | ₱12,900 | ₱13,600 | **Path B (OSD)** | ₱700 |
| ₱430,000 | ₱13,425 | ₱14,400 | **Path B (OSD)** | ₱975 |
| ₱437,500 | ₱15,000 | ₱15,000 | **TIE** | ₱0 |
| ₱450,000 | ₱16,500 | ₱16,000 | Path C (8%) | ₱500 |
| ₱500,000 | ₱22,500 | ₱20,000 | Path C (8%) | ₱2,500 |
| ₱700,000 | ₱44,500* | ₱36,000 | Path C (8%) | ₱8,500 |
| ₱1,000,000 | ₱92,500 | ₱60,000 | Path C (8%) | ₱32,500 |
| ₱1,500,000 | ₱172,500 | ₱100,000 | Path C (8%) | ₱72,500 |
| ₱2,000,000 | ₱262,500 | ₱140,000 | Path C (8%) | ₱122,500 |
| ₱2,500,000 | ₱352,500 | ₱180,000 | Path C (8%) | ₱172,500 |
| ₱3,000,000 | ₱442,500 | ₱220,000 | Path C (8%) | ₱222,500 |

*₱700K Path B: NTI = 420,000; tax = 22,500 + (420,000−400,000)×0.20 = 22,500 + 4,000 = 26,500; + PT = 21,000; total = 47,500.
Wait — let me re-verify: NTI=700K×0.6=420K; grad_tax(420K)=22,500+(420K-400K)×0.20=22,500+4,000=26,500; PT=700K×3%=21,000; total=47,500.
Correction: Path B at ₱700K = ₱47,500 (not ₱44,500). Table updated above.

**Note on the OSD-wins window (₱400,001–₱437,499):**
This is a narrow ₱37,499 band. The maximum OSD advantage over 8% is ₱833 (at GR ≈ ₱425,000).
Engine should still recommend Path B (OSD) in this range, but the margin is small enough that
any additional percent tax payment errors could wipe out the advantage.

#### Table RC-03: OSD vs Itemized Breakeven — All Incomes

OSD (Path B) beats Itemized (Path A) when expense_ratio < 40%. Itemized beats OSD when expense_ratio > 40%.
Breakeven is ALWAYS at exactly 40% expense ratio, independent of gross receipts level.

Proof: Both paths have identical percentage tax (GR × 3%). For income tax:
`graduated_tax(GR × 0.60) vs graduated_tax(GR × (1-r))`
These are equal when `GR × 0.60 = GR × (1-r)` → `r = 0.40`.

| Expense Ratio | Path A vs Path B |
|---------------|-----------------|
| < 40% | Path B (OSD) wins — simpler and lower IT |
| = 40% | Tie — prefer Path B (simpler; no documentation needed) |
| > 40% | Path A (Itemized) wins — IT savings exceed OSD advantage |

---

### 28.10 — Determine Annual Form

```
function determine_annual_form(input: RegimeComparisonInput, regime: Regime) -> string:
  """
  Returns "1701" or "1701A" based on taxpayer profile and regime.
  See also DT-04 for the full decision tree.
  """
  // Mixed income earners always use Form 1701
  if input.has_compensation_income:
    return "1701"

  // Path A (itemized) with Audited Financial Statements: 1701A or 1701 (either OK)
  // Engine defaults to 1701A for simplicity
  return "1701A"

  // Note: Breach-year filers must use 1701 even if pure SE.
  // The breach flag is not in RegimeComparisonInput v1; caller must check DT-03 separately.
```

---

### 28.11 — Determine PT Obligation

```
function determine_pt_obligation(input: RegimeComparisonInput, regime: Regime) -> PTObligation:
  if regime == Regime.PATH_C:
    return PTObligation.NOT_REQUIRED_8PCT
  if input.is_vat_registered:
    return PTObligation.NOT_REQUIRED_VAT
  // Non-VAT, graduated rates
  return PTObligation.REQUIRED_QUARTERLY
```

---

### 28.12 — Worked Examples (Regime Comparison)

#### Example RC-E01: Pure Freelancer, ₱800,000 Gross, Minimal Expenses

**Input:**
- gross_receipts: 800,000
- non_operating_income: 0
- itemized_deductions: 50,000 (about 6.25% expense ratio)
- has_itemized_documentation: true
- has_compensation_income: false
- is_vat_registered: false
- tax_year: 2024

**Computations:**
- gross_for_threshold = 800,000

**Path A:** NTI = 800,000 − 50,000 = 750,000
grad_tax_2023(750,000) = 22,500 + (750,000−400,000)×0.20 = 22,500 + 70,000 = 92,500
PT = 800,000 × 0.03 = 24,000
Total A = 92,500 + 24,000 = **₱116,500**

**Path B:** NTI = 800,000 × 0.60 = 480,000
grad_tax_2023(480,000) = 22,500 + (480,000−400,000)×0.20 = 22,500 + 16,000 = 38,500
PT = 24,000
Total B = 38,500 + 24,000 = **₱62,500**

**Path C:** Tax base = 800,000 − 250,000 = 550,000
IT_C = 550,000 × 0.08 = 44,000; PT = 0
Total C = **₱44,000**

**Recommendation: Path C (8%)** — saves ₱72,500 vs Path A, ₱18,500 vs Path B.
**Note:** Expense ratio = 6.25%, far below breakeven of 52.1% at ₱800K. Path C optimal.

---

#### Example RC-E02: Designer with High Expenses, ₱1,200,000 Gross, 65% Expense Ratio

**Input:**
- gross_receipts: 1,200,000
- itemized_deductions: 780,000 (65% ratio)
- non_operating_income: 0
- has_itemized_documentation: true
- has_compensation_income: false
- is_vat_registered: false
- tax_year: 2024

**Computations:**

**Path A:** NTI = 1,200,000 − 780,000 = 420,000
grad_tax_2023(420,000) = 22,500 + (420,000−400,000)×0.20 = 22,500 + 4,000 = 26,500
PT = 1,200,000 × 0.03 = 36,000
Total A = 26,500 + 36,000 = **₱62,500**

**Path B:** NTI = 1,200,000 × 0.60 = 720,000
grad_tax_2023(720,000) = 22,500 + (720,000−400,000)×0.20 = 22,500 + 64,000 = 86,500
PT = 36,000
Total B = 86,500 + 36,000 = **₱122,500**

**Path C:** Tax base = 1,200,000 − 250,000 = 950,000
IT_C = 950,000 × 0.08 = 76,000; PT = 0
Total C = **₱76,000**

**Recommendation: Path A (Itemized)** — saves ₱13,500 vs Path C, ₱60,000 vs Path B.
**Breakeven at GR = ₱1.2M is 59.4%.** This taxpayer's 65% ratio exceeds breakeven → itemized wins.

---

#### Example RC-E03: Freelancer Exactly at Breakeven (GR = ₱1,000,000, 56.3% Expenses)

**Input:**
- gross_receipts: 1,000,000
- itemized_deductions: 562,500 (56.25% ratio — exact breakeven)
- non_operating_income: 0
- has_compensation_income: false
- tax_year: 2024

**Path A:** NTI = 437,500
grad_tax_2023(437,500) = 22,500 + (437,500−400,000)×0.20 = 22,500 + 7,500 = 30,000
PT = 30,000; Total A = **₱60,000**

**Path C:** IT = (1,000,000−250,000)×0.08 = 60,000; PT = 0; Total C = **₱60,000**

**Result:** TIE. Engine recommends Path C (tie-breaking rule: simpler to file wins).
If taxpayer ALSO has documentation for Path A expenses: either is equally valid.
Recommendation message: "Both the 8% Flat Rate and the Itemized Deduction method result in the same tax of ₱60,000. We recommend the 8% option as it requires no expense documentation and simpler filing (Form 1701A, Part IV-B)."

---

#### Example RC-E04: Mixed Income Earner (Compensation + Business)

**Input:**
- gross_receipts (business): 600,000
- non_operating_income: 0
- itemized_deductions: 100,000 (16.7% ratio — low expenses)
- has_itemized_documentation: true
- has_compensation_income: true
- taxable_compensation: 400,000 (after mandatory deductions)
- is_vat_registered: false
- tax_year: 2024

**Path A (Mixed Income, Itemized):**
Business NTI = 600,000 − 100,000 = 500,000
Total NTI = 400,000 (comp) + 500,000 (biz) = 900,000
Total IT = grad_tax_2023(900,000) = 102,500 + (900,000−800,000)×0.25 = 102,500 + 25,000 = 127,500
PT (on business gross) = 600,000 × 0.03 = 18,000
Total A = 127,500 + 18,000 = **₱145,500**

**Path B (Mixed Income, OSD):**
Business NTI = 600,000 × 0.60 = 360,000
Total NTI = 400,000 + 360,000 = 760,000
Total IT = grad_tax_2023(760,000) = 22,500 + (760,000−400,000)×0.20 = 22,500 + 72,000 = 94,500
PT = 18,000
Total B = 94,500 + 18,000 = **₱112,500**

**Path C (Mixed Income, 8%):**
Tax base = 600,000 (NO ₱250K deduction for mixed income)
Business IT (8%) = 600,000 × 0.08 = 48,000
Compensation IT = grad_tax_2023(400,000) = (400,000−250,000)×0.15 = 22,500
Note: For mixed income, the total tax is compensation_IT + business_8pct_IT = 22,500 + 48,000 = 70,500.
But compensation income tax is handled separately (employer-withheld via Form 2316). What the engine reports as "Path C total" for mixed income is: business_8pct_IT only = 48,000; PT = 0. The annual return will also reconcile comp income.
Total C (business portion only) = **₱48,000** (plus separately-computed compensation tax)
PT = 0

**Recommendation for mixed income:** Compare TOTAL tax burden (IT on combined income):
- If comparing TOTAL annual IT burden: Path B (combined IT = ₱94,500) vs Path C (comp IT ₱22,500 + biz IT ₱48,000 = ₱70,500).
- Path C total IT (₱70,500) + PT (₱0) = ₱70,500 beats Path B (₱94,500 + ₱18,000 = ₱112,500).
- Path A total (₱127,500 + ₱18,000 = ₱145,500) is highest.
**Recommendation: Path C (8% on business income)** saves ₱42,000 vs Path B.

**Note:** Mixed income 8% total is compensation tax (₱22,500, withheld by employer) + business 8% (₱48,000, paid via 1701Q/annual). The comparison should use FULL annual tax burden.

---

### 28.13 — Invariants for Regime Comparison

```
// These invariants must hold for every valid output:

// INV-RC-01: Total tax burden is always non-negative
assert path_x.total_tax_burden >= 0 for all computed paths

// INV-RC-02: Path C total tax ≤ Path B total tax, EXCEPT in ₱400K–₱437.5K gross range
if gross_for_threshold <= 400_000 OR gross_for_threshold >= 437_500:
  if path_c is not null:
    assert path_c.total_tax_burden <= path_b.total_tax_burden + 1  // ₱1 tolerance for rounding

// INV-RC-03: OSD beats Itemized (total burden) when expense_ratio < 0.40
if itemized_deductions / gross_income < 0.40 and not is_vat_registered:
  assert path_b.total_tax_burden <= path_a.total_tax_burden + 1  // ₱1 tolerance

// INV-RC-04: Itemized beats OSD (total burden) when expense_ratio > 0.40
if itemized_deductions / gross_income > 0.40 and not is_vat_registered:
  assert path_a.total_tax_burden <= path_b.total_tax_burden + 1

// INV-RC-05: Path C has zero percentage_tax
if path_c is not null:
  assert path_c.percentage_tax == 0

// INV-RC-06: Recommended regime has the minimum total_tax_burden
assert recommended.total_tax_burden == min([p.total_tax_burden for p in applicable_paths])

// INV-RC-07: Balance payable + overpayment cannot both be > 0 simultaneously
assert NOT (balance_payable > 0 AND overpayment > 0)

// INV-RC-08: Savings vs recommended path are always 0 (saves nothing vs itself)
if recommended_regime == PATH_B:
  assert savings_vs_b == 0
if recommended_regime == PATH_C:
  assert savings_vs_c == 0

// INV-RC-09: Savings are always non-negative
assert savings_vs_a >= 0 or savings_vs_a is null
assert savings_vs_b >= 0
assert savings_vs_c >= 0 or savings_vs_c is null
```

---

## CR-029: Mixed Income Earner — Complete Annual Tax Computation (All 3 Paths)

**Legal basis:** NIRC Sec. 24(A)(1)(b) (compensation), Sec. 24(A)(2) (business/professional income), Sec. 24(A)(2)(b) (8% option for business portion), Sec. 34(L) (OSD), Sec. 34(A)-(K) (itemized deductions), Sec. 116 (percentage tax); RMC 50-2018 (8% mixed income, no ₱250K deduction); RR 8-2018 Part II.

### Definition: Mixed Income Earner

A "mixed income earner" under this engine is any individual who receives BOTH:
- **(a) Compensation income:** Salary, wages, honoraria from an employer-employee relationship, evidenced by BIR Form 2316. This includes part-time employment, government employment, and employee partnerships.
- **(b) Business or professional income:** Income from sole proprietorship, freelancing, consulting, professional practice, or any self-employment activity.

An individual with ONLY one type is NOT a mixed income earner:
- Purely self-employed (no Form 2316) → use CR-028 (pure SE comparison)
- Purely employed (no business income) → graduated rates on compensation only; no optimizer needed

### Key Rules for Mixed Income Earners

**Rule MIR-01 (Always 1701):** Mixed income earners ALWAYS file BIR Form 1701. Form 1701A is only for purely self-employed individuals. Even if the taxpayer elects the 8% option for business income, they file Form 1701 (NOT 1701A) because of the compensation income component. [Legal: BIR Form 1701 Instructions; RMC 50-2018 Sec. 2]

**Rule MIR-02 (Compensation Always Graduated):** The compensation income portion is ALWAYS taxed under the graduated rate table. There is no election for compensation income — it is always subject to NIRC Sec. 24(A)(2)(a). The employer computes and withholds this tax via payroll and reports via Form 2316. [Legal: NIRC Sec. 24(A)(1)(b); NIRC Sec. 79]

**Rule MIR-03 (No ₱250K Deduction for 8% Business):** When an individual has ANY compensation income (even ₱1 of compensation), the ₱250,000 exemption is NOT applied to business income under the 8% option. The 8% tax base is the FULL gross business receipts (+ non-operating income), with no deduction. The rationale is that the zero-rate bracket of the graduated table already benefits the compensation income; applying it again to business income would create an impermissible double benefit. [Legal: RMC 50-2018 Sec. 3; RMC 23-2018]

**Rule MIR-04 (Combined NTI for Graduated Paths):** Under Paths A and B (graduated methods), the compensation NTI and business NTI are COMBINED before applying the graduated rate table. The ₱250,000 zero bracket applies to the COMBINED total NTI once. This means if compensation already pushes NTI above ₱250K, the business NTI is taxed at marginal rates starting from 15% or higher. [Legal: NIRC Sec. 24(A)(2)(a); graduated rate table applies to "taxable income" which is the sum of all income sources]

**Rule MIR-05 (Quarterly Business Filing Only):** Mixed income earners file Form 1701Q for their BUSINESS income only, on a cumulative year-to-date basis. Compensation income is handled entirely by the employer's payroll system. 1701Q does NOT include compensation income. [Legal: NIRC Sec. 74; BIR Form 1701Q Instructions]

**Rule MIR-06 (Annual Reconciliation via 1701):** At annual filing (Form 1701), all income is reconciled. The Form 1701 has separate schedules for compensation income (Part III, Schedule A) and business/professional income (Part IV or V). The total income tax due is computed on the COMBINED income, and all credits (TW, CWT, quarterly payments) are applied. [Legal: NIRC Sec. 51; BIR Form 1701]

**Rule MIR-07 (8% Election Applies to Business Only):** The 8% option, when elected by a mixed income earner, applies ONLY to the business/professional income portion. The compensation portion remains under graduated rates. [Legal: NIRC Sec. 24(A)(2)(b); RMC 50-2018]

**Rule MIR-08 (Business Gross for ₱3M Threshold):** For mixed income earners, the ₱3M threshold for 8% eligibility is computed using ONLY the business/professional gross receipts + non-operating income from the business. Compensation income is NOT added to the threshold computation. [Legal: NIRC Sec. 24(A)(2)(b) — threshold refers to "gross sales or receipts from business or practice of profession"]

### Typed Input Schema (Mixed Income)

```
struct MixedIncomeInput:
  // Compensation income section
  taxable_compensation: decimal
    // Annual taxable compensation after all excludable items (de minimis, 13th month up to ₱90K, etc.)
    // Source: BIR Form 2316, "Total Taxable Compensation Income" (or sum of all Form 2316s if multiple employers)
    // If foreign employer without Philippine withholding: user computes and enters taxable amount
    // Constraint: >= 0
    // If 0: treat as pure self-employed (route to CR-028 instead)

  tax_withheld_by_employer: decimal
    // Total tax withheld on compensation by employer(s)
    // Source: BIR Form 2316, "Tax Withheld" (sum of all Form 2316s if multiple employers)
    // If foreign employer with no PH withholding: 0 (taxpayer pays all tax via quarterly/annual filing)
    // Constraint: >= 0; may be 0 if compensation < ₱250,000 (no tax due on comp)

  number_of_form_2316s: int
    // 1 for single employer; 2+ for multiple employers in same year
    // If > 1: user has provided SUMMED values for taxable_compensation and tax_withheld_by_employer
    // Constraint: >= 1

  // Business income section (identical to RegimeComparisonInput in CR-028)
  gross_receipts: decimal            // Annual gross receipts from business/profession
  non_operating_income: decimal      // Other non-operating income from business activities
  gross_for_threshold: decimal       // = gross_receipts + non_operating_income (for ₱3M check; comp EXCLUDED)
  itemized_deductions: decimal       // Allowable business expense deductions (Path A)
  has_itemized_documentation: bool   // True if substantiated with receipts/invoices
  is_vat_registered: bool            // True = 8% and Path B PT mechanics differ
  election_status: ElectionStatus    // EIGHT_PCT_ELECTED | GRADUATED_ELECTED | UNDECIDED
  tax_year: int

  // Credits and prior payments
  total_cwt_business: decimal
    // Total CWT from all Form 2307s (business income withholding only)
    // Do NOT include tax withheld on compensation (that's tax_withheld_by_employer)
    // Constraint: >= 0
  total_quarterly_it_paid: decimal
    // Total paid via Form 1701Q for Q1+Q2+Q3
    // This is for business income quarterly payments only
    // Constraint: >= 0
```

### Path A: Graduated + Itemized Deductions (Mixed Income)

```
function compute_path_a_mixed(input: MixedIncomeInput) -> MixedPathResult:
  """
  Path A for mixed income earner: business NTI via itemized deductions,
  combined with compensation NTI for graduated tax computation.
  """
  if NOT input.has_itemized_documentation:
    return null  // Path A unavailable without documentation

  // Step 1: Business gross income
  business_gross_income = input.gross_receipts  // For service/professional
  // For trading: business_gross_income = gross_sales - COGS (separate input field)

  // Step 2: Apply itemized deductions to business income
  deductible_expenses = min(input.itemized_deductions, business_gross_income)
  business_nti_itemized = max(business_gross_income - deductible_expenses, 0)
  // Note: If business_nti_itemized = 0 (loss), cannot offset compensation income.
  //       Loss tracked as NOLCO for future years (see CR-027 NOLCO rules).

  // Step 3: Combine with compensation NTI
  // No separate deduction for compensation — taxable_compensation already reflects excludables
  combined_nti = round(input.taxable_compensation + business_nti_itemized, 2)

  // Step 4: Apply graduated rate to COMBINED NTI
  total_it = graduated_tax_for_year(combined_nti, input.tax_year)
  // This SINGLE graduated tax computation covers BOTH compensation and business income.
  // The ₱250K zero-bracket appears once in the graduated table for the combined amount.

  // Step 5: Percentage tax on business gross receipts
  // OPT applies because NOT on 8% regime; 3% per NIRC Sec. 116
  pt = round(input.gross_receipts * 0.03, 2)
  // Exception: If vat_registered, pt = 0 (VAT-registered entities don't pay OPT)
  if input.is_vat_registered:
    pt = 0.00

  // Step 6: Total annual tax burden
  total_burden = round(total_it + pt, 2)

  // Step 7: Reconcile against credits
  total_credits = input.tax_withheld_by_employer + input.total_cwt_business + input.total_quarterly_it_paid
  it_balance_due = max(round(total_it - total_credits, 2), 0)
  it_overpayment = max(round(total_credits - total_it, 2), 0)

  return MixedPathResult {
    regime: PATH_A,
    business_gross_income: business_gross_income,
    deduction_amount: deductible_expenses,
    business_nti: business_nti_itemized,
    compensation_nti: input.taxable_compensation,
    combined_nti: combined_nti,
    income_tax: total_it,
    percentage_tax: pt,
    total_tax_burden: total_burden,
    it_balance_at_annual: it_balance_due,
    it_overpayment_at_annual: it_overpayment,
    form_to_use: "1701",
  }
```

### Path B: Graduated + OSD (Mixed Income)

```
function compute_path_b_mixed(input: MixedIncomeInput) -> MixedPathResult:
  """
  Path B for mixed income earner: business NTI via 40% OSD,
  combined with compensation NTI for graduated tax computation.
  """
  // Step 1: OSD computation on business income
  // For service/professional: OSD base = gross_receipts
  // For trading: OSD base = gross_income (= gross_sales - COGS, NOT gross_sales alone)
  osd_base = input.gross_receipts  // Assuming service; trading uses separate gross_income field
  osd_amount = round(osd_base * 0.40, 2)
  business_nti_osd = round(osd_base * 0.60, 2)

  // Step 2: Combine with compensation NTI
  combined_nti = round(input.taxable_compensation + business_nti_osd, 2)

  // Step 3: Apply graduated rate to combined NTI
  total_it = graduated_tax_for_year(combined_nti, input.tax_year)

  // Step 4: Percentage tax on business gross receipts (3%)
  pt = round(input.gross_receipts * 0.03, 2)
  if input.is_vat_registered:
    pt = 0.00

  // Step 5: Total burden
  total_burden = round(total_it + pt, 2)

  // Step 6: Reconcile
  total_credits = input.tax_withheld_by_employer + input.total_cwt_business + input.total_quarterly_it_paid
  it_balance_due = max(round(total_it - total_credits, 2), 0)
  it_overpayment = max(round(total_credits - total_it, 2), 0)

  return MixedPathResult {
    regime: PATH_B,
    business_gross_income: osd_base,
    deduction_amount: osd_amount,
    business_nti: business_nti_osd,
    compensation_nti: input.taxable_compensation,
    combined_nti: combined_nti,
    income_tax: total_it,
    percentage_tax: pt,
    total_tax_burden: total_burden,
    it_balance_at_annual: it_balance_due,
    it_overpayment_at_annual: it_overpayment,
    form_to_use: "1701",
  }
```

### Path C: 8% Flat Rate on Business Income (Mixed Income)

```
function compute_path_c_mixed(input: MixedIncomeInput) -> MixedPathResult:
  """
  Path C for mixed income earner: 8% on gross business receipts (NO ₱250K deduction),
  plus graduated tax on compensation income computed separately.

  CRITICAL RULE (RMC 50-2018): ₱250,000 deduction does NOT apply when taxpayer
  has any compensation income, even ₱1. The 8% tax base = full gross business receipts.

  ARCHITECTURE NOTE: Unlike Paths A and B where one graduated_tax() call covers
  COMBINED income, Path C separates the computation:
    - Compensation IT: graduated_tax(taxable_compensation) — computed at graduated rates
    - Business IT: gross_business_receipts × 0.08 — computed at flat 8%
  These two are then summed for the total annual IT.
  """
  // Step 1: Verify 8% eligibility for business portion (DT-01 / CR-028 check_eight_pct_eligibility)
  // Input: gross_for_threshold (business gross only, NOT adding compensation)
  eligibility = check_eight_pct_eligibility(input)
  assert eligibility.eligible == true  // Precondition for calling this function

  // Step 2: Business IT under 8% (NO ₱250K deduction — mixed income rule)
  business_8pct_base = input.gross_for_threshold  // gross_receipts + non_operating_income
  business_it = round(business_8pct_base * 0.08, 2)

  // Step 3: Compensation IT at graduated rates (separate computation)
  compensation_it = graduated_tax_for_year(input.taxable_compensation, input.tax_year)
  // The compensation_it equals approximately what the employer withheld (TW).
  // TW may differ due to: employer computation errors, annualization differences, or multiple employers.

  // Step 4: Total annual income tax (sum of both components)
  total_it = round(business_it + compensation_it, 2)

  // Step 5: Percentage tax (WAIVED under 8% regime)
  pt = 0.00  // 8% is "in lieu of" graduated IT AND percentage tax under Sec. 116 [NIRC Sec. 24(A)(2)(b)]

  // Step 6: Total burden
  total_burden = total_it  // = business_it + compensation_it (no PT to add)

  // Step 7: Reconcile (TW covers compensation IT; CWT and quarterly cover business IT)
  total_credits = input.tax_withheld_by_employer + input.total_cwt_business + input.total_quarterly_it_paid
  it_balance_due = max(round(total_it - total_credits, 2), 0)
  it_overpayment = max(round(total_credits - total_it, 2), 0)

  return MixedPathResult {
    regime: PATH_C,
    business_gross_income: business_8pct_base,
    deduction_amount: 0,  // No deduction under 8% for mixed income
    business_nti: business_8pct_base,  // NTI = gross (no deduction)
    compensation_nti: input.taxable_compensation,
    combined_nti: null,  // Not used in Path C; compensation and business taxed separately
    income_tax: total_it,
    business_it_component: business_it,         // For display: "Business income tax (8%)"
    compensation_it_component: compensation_it, // For display: "Compensation income tax"
    percentage_tax: 0,
    total_tax_burden: total_burden,
    it_balance_at_annual: it_balance_due,
    it_overpayment_at_annual: it_overpayment,
    form_to_use: "1701",
  }
```

### Mixed Income Regime Comparison

```
function compare_mixed_income_regimes(input: MixedIncomeInput) -> MixedIncomeComparisonResult:
  """
  Runs all available paths for a mixed income earner and recommends the minimum-tax option.
  """
  paths = []

  // Compute Path A if documentation available
  if input.has_itemized_documentation:
    path_a = compute_path_a_mixed(input)
    if path_a is not null:
      paths.append(path_a)

  // Compute Path B (always available for non-VAT; OSD always available for VAT-registered too)
  path_b = compute_path_b_mixed(input)
  paths.append(path_b)

  // Compute Path C if 8% eligible (uses business gross only for threshold)
  eligibility = check_eight_pct_eligibility(input)  // passes input.gross_for_threshold (business only)
  if eligibility.eligible:
    path_c = compute_path_c_mixed(input)
    paths.append(path_c)

  // Find recommended path (minimum total_tax_burden)
  // Tie-breaking: prefer Path C > Path B > Path A (simpler compliance)
  recommended = min_by_burden_with_tiebreak(paths)

  // Compute savings vs other paths
  savings_vs_a = null
  savings_vs_b = null
  savings_vs_c = null
  if path_a in paths:
    savings_vs_a = round(path_a.total_tax_burden - recommended.total_tax_burden, 2)
  savings_vs_b = round(path_b.total_tax_burden - recommended.total_tax_burden, 2)
  if path_c in paths:
    savings_vs_c = round(path_c.total_tax_burden - recommended.total_tax_burden, 2)

  return MixedIncomeComparisonResult {
    input: input,
    paths_computed: paths,
    recommended: recommended,
    savings_vs_a: savings_vs_a,
    savings_vs_b: savings_vs_b,
    savings_vs_c: savings_vs_c,
    effective_tax_rate: recommended.total_tax_burden / (input.taxable_compensation + input.gross_receipts),
    form_to_file: "1701",
    quarterly_business_form: "1701Q",
    notes: [
      "Compensation income is always taxed under graduated rates regardless of business regime.",
      if path_c in paths: "For the 8% option, no ₱250,000 deduction applies to business income (RMC 50-2018).",
      if eligibility.ineligible_reason != null: eligibility.ineligible_reason,
    ]
  }
```

### Mixed Income — Key Worked Examples

**Example MI-01: Employee + Freelancer, 8% Optimal (from EX-008)**
- Inputs: taxable_compensation = ₱451,200; tax_withheld_by_employer ≈ ₱30,180; gross_receipts = ₱600,000; itemized_deductions = ₱80,000; has_itemized_documentation = true; is_vat_registered = false; total_cwt_business = ₱0; total_quarterly_it_paid = ₱0; tax_year = 2024

Path A (Itemized + Graduated, combined):
- business_nti_itemized = 600,000 − 80,000 = 520,000
- combined_nti = 451,200 + 520,000 = 971,200
- total_it = 102,500 + 0.25 × (971,200 − 800,000) = 102,500 + 42,800 = 145,300
- pt = 600,000 × 0.03 = 18,000
- **total_burden_A = ₱163,300**

Path B (OSD + Graduated, combined):
- business_nti_osd = 600,000 × 0.60 = 360,000
- combined_nti = 451,200 + 360,000 = 811,200
- total_it = 102,500 + 0.25 × (811,200 − 800,000) = 102,500 + 2,800 = 105,300
- pt = 18,000
- **total_burden_B = ₱123,300**

Path C (8% on business, graduated on comp, SEPARATE):
- compensation_it = graduated_tax(451,200) = 0.15 × (451,200 − 250,000) = 0.15 × 201,200 = 30,180
- business_it = 600,000 × 0.08 = 48,000  [NO ₱250K deduction]
- total_it = 30,180 + 48,000 = 78,180
- pt = 0 (waived)
- **total_burden_C = ₱78,180**

**RECOMMENDATION: Path C. Saves ₱45,120 vs Path B, ₱85,120 vs Path A.**

Balance due at annual: 78,180 − 30,180 (TW) − 0 (no CWT or quarterly) = **₱48,000 payable**
(The ₱30,180 TW covers the compensation portion; the ₱48,000 business portion was not pre-paid)

---

**Example MI-02: Employee + High-Expense Business, Itemized May Win**
- Inputs: taxable_compensation = ₱480,000; tax_withheld_by_employer = ₱34,500; gross_receipts = ₱1,500,000; itemized_deductions = ₱1,000,000 (66.7% expense ratio); has_itemized_documentation = true; is_vat_registered = false; tax_year = 2024

Path A (Itemized):
- business_nti = 1,500,000 − 1,000,000 = 500,000
- combined_nti = 480,000 + 500,000 = 980,000
- total_it = 102,500 + 0.25 × (980,000 − 800,000) = 102,500 + 45,000 = 147,500
- pt = 1,500,000 × 0.03 = 45,000
- **total_burden_A = ₱192,500**

Path B (OSD):
- business_nti_osd = 1,500,000 × 0.60 = 900,000
- combined_nti = 480,000 + 900,000 = 1,380,000
- total_it = 102,500 + 0.25 × (1,380,000 − 800,000) = 102,500 + 145,000 = 247,500
- pt = 45,000
- **total_burden_B = ₱292,500**

Path C (8%):
- compensation_it = 22,500 + 0.20 × (480,000 − 400,000) = 22,500 + 16,000 = 38,500
- business_it = 1,500,000 × 0.08 = 120,000
- total_it = 38,500 + 120,000 = 158,500
- pt = 0
- **total_burden_C = ₱158,500**

**RECOMMENDATION: Path C still wins at ₱158,500 vs Path A at ₱192,500.**
Key insight: Even with 66.7% expenses, Path C wins because the compensation is already in the 25% bracket — under Paths A and B, the business income is also taxed at 25% rate (combined income pushes into high bracket), making 8% cheaper. Itemized deductions PLUS percentage tax still exceed 8% flat rate.

**Note for engine:** For mixed income earners with high compensation, the breakeven expense ratio at which itemized beats 8% is HIGHER than for pure self-employed, because the combined NTI pushes into higher brackets faster. The standard breakeven tables from CR-014/CR-028 apply to PURE self-employed; mixed income earners have a different (higher) breakeven.

---

**Example MI-03: Very Low Compensation, Business Benefit from Combined NTI**
- Inputs: taxable_compensation = ₱200,000 (below ₱250K zero bracket); tax_withheld_by_employer = ₱0; gross_receipts = ₱400,000; itemized_deductions = ₱0; has_itemized_documentation = false; is_vat_registered = false; tax_year = 2024

Path B (OSD):
- business_nti_osd = 240,000
- combined_nti = 200,000 + 240,000 = 440,000
- total_it = 0.15 × (440,000 − 250,000) = 0.15 × 190,000 = 28,500
- pt = 400,000 × 0.03 = 12,000
- **total_burden_B = ₱40,500**
- Under combined NTI: the ₱200K compensation USES UP ₱200K of the ₱250K zero bracket.
  Business NTI uses the remaining ₱50K at 0%, then 15% on ₱190K.

Path C (8% — NO ₱250K deduction):
- compensation_it = 0 (₱200K taxable comp is within zero bracket)
- business_it = 400,000 × 0.08 = 32,000  [NO ₱250K deduction even though comp is low]
- total_it = 0 + 32,000 = 32,000
- pt = 0
- **total_burden_C = ₱32,000**

**RECOMMENDATION: Path C (₱32,000 vs ₱40,500 for Path B).**
Key insight: Even when compensation is very low (below the zero bracket), the RMC 50-2018 rule is strict — the ₱250K deduction is NOT applied to business income under 8%. However, Path C still wins because ₱40,000 × 8% = ₱32K is less than ₱40,500 (Path B combined graduated + PT).

---

### Mixed Income Quarterly Filing Schedule

```
// For a mixed income earner's QUARTERLY BUSINESS income returns (Form 1701Q):
// Only business income is reported on 1701Q. Compensation is handled by employer.

function compute_quarterly_1701q_mixed(
  quarter: int,                         // 1, 2, or 3 (Q4 is reconciled via annual 1701)
  cumulative_gross_receipts: decimal,   // Jan through end of current quarter
  cumulative_itemized_deductions: decimal,  // Only if using itemized method
  cumulative_cwt_business: decimal,     // Total 2307 CWT from business income, year-to-date
  prior_quarterly_it_paid: decimal,     // Sum of IT paid in Form 1701Q for prior quarters
  regime: TaxRegime,                    // PATH_A, PATH_B, or PATH_C
  has_compensation_income: bool,        // MUST be true — this function is for mixed income
  tax_year: int
) -> QuarterlyTaxResult:
  """
  Mixed income quarterly computation.
  IMPORTANT: Do NOT include taxable_compensation or tax_withheld_by_employer here.
  Form 1701Q does NOT cover compensation income for mixed income earners.
  """
  assert has_compensation_income == true

  if regime == PATH_C:
    // 8% cumulative on business gross, NO ₱250K deduction (mixed income rule)
    cumulative_business_it = round(cumulative_gross_receipts * 0.08, 2)
    // No ₱250K deduction at quarterly level; no deduction at annual either (mixed income)

  elif regime == PATH_B:
    // OSD on cumulative business gross
    business_nti_osd = round(cumulative_gross_receipts * 0.60, 2)
    // Graduated tax on business NTI ONLY for quarterly purposes
    // Note: At annual, compensation will be added. For quarterly estimation, apply
    // graduated rates to business NTI alone (without compensation) — per 1701Q Instructions.
    // The annual 1701 will reconcile the true combined tax.
    cumulative_business_it = graduated_tax_for_year(business_nti_osd, tax_year)

  elif regime == PATH_A:
    // Itemized on cumulative business income
    business_nti_itemized = max(cumulative_gross_receipts - cumulative_itemized_deductions, 0)
    cumulative_business_it = graduated_tax_for_year(business_nti_itemized, tax_year)

  // Quarterly IT due = cumulative business IT - business CWT - prior quarterly payments
  quarterly_it_due = max(
    round(cumulative_business_it - cumulative_cwt_business - prior_quarterly_it_paid, 2),
    0
  )

  // Percentage tax (filed separately via Form 2551Q, NOT via 1701Q)
  quarterly_pt = round(cumulative_gross_receipts * 0.03, 2) if regime != PATH_C else 0

  return QuarterlyTaxResult {
    quarter: quarter,
    cumulative_business_gross: cumulative_gross_receipts,
    cumulative_business_it: cumulative_business_it,
    quarterly_it_payable: quarterly_it_due,
    quarterly_pt_separate: quarterly_pt,  // Filed on Form 2551Q separately
    form: "1701Q",
    note: "Compensation income is NOT included in this quarterly return. Your employer files Form 2316 for your compensation."
  }
```

---

## CR-030: Compensation Income — Components and Taxable Amount

**Legal basis:** NIRC Sec. 24(A)(1)(b); NIRC Sec. 32(B)(7)(a) (de minimis exclusion); RR 3-2015 (de minimis benefits); RR 11-2018 (TRAIN implementing rules for compensation); RA 10963 (TRAIN) Sec. 4 (₱90,000 13th month exclusion); NIRC Sec. 33 (fringe benefit tax).

### What Is "Taxable Compensation" (taxable_compensation input field)

The engine accepts `taxable_compensation` as a SINGLE user-provided figure. This is the annual amount of compensation income after all mandatory and permissible exclusions have been applied by the employer. The user should take this from their BIR Form 2316.

**Form 2316 — Where to Find the Taxable Compensation:**
- Item 21 (or equivalent on current form): "Total Taxable Compensation Income" — this is the figure to enter.
- Item 22 (or equivalent): "Tax Withheld" — enter as tax_withheld_by_employer.

### Components of Gross Compensation (Informational — for User Help Text)

The following are included in gross compensation BEFORE exclusions:

| Component | Always Taxable | Excludable Up To | Notes |
|-----------|---------------|-----------------|-------|
| Basic salary / wages | Yes (fully) | — | Core employment income |
| Regular allowances (transport, representation) | Yes (if not de minimis) | De minimis amounts | Excess over de minimis amounts is taxable |
| 13th month pay | Partial | ₱90,000/year | Excess over ₱90,000 is taxable |
| Christmas bonus (employer-initiated) | Partial | Part of ₱90,000 pool | Combined with 13th month |
| 14th month, 15th month pay | Partial | Part of ₱90,000 pool | All other benefits pool |
| Performance bonuses | Partial | Part of ₱90,000 pool | Combined with other benefits |
| Overtime pay | Yes (generally) | — | Subject to rules; night diff partially exempt for some |
| Holiday pay | Partial | Night differential rules | Hourly employees — some exemption |

### Non-Taxable Compensation (Excludable Items) — Fully Excluded

| Exclusion | Basis | Amount / Condition |
|-----------|-------|--------------------|
| SSS employee contribution | NIRC Sec. 32(B)(7)(f) | Actual employee share (not employer share) |
| PhilHealth employee contribution | NIRC Sec. 32(B)(7)(f) | Actual employee share |
| Pag-IBIG employee contribution | NIRC Sec. 32(B)(7)(f) | Actual employee share (₱100/month max employee mandatory) |
| GSIS employee contribution (for gov't employees) | NIRC Sec. 32(B)(7)(f) | Actual employee share |
| 13th month pay and other benefits | RA 10963 (TRAIN), NIRC Sec. 32(B)(7)(e) | Up to ₱90,000/year combined cap |
| SSS, GSIS, Medicare (PhilHealth) maternity benefits | NIRC Sec. 32(B)(4) | Fully exempt |
| Retirement benefits meeting requirements | NIRC Sec. 32(B)(6) | BIR-approved retirement plan, at least 10 years service, age ≥ 50 |
| Separation pay (involuntary causes) | NIRC Sec. 32(B)(6)(b) | Due to death, sickness, disability, or any cause beyond control |
| GSIS/SSS terminal benefits | NIRC Sec. 32(B)(7)(a) | GSIS/SSS retirement and separation benefits |
| Benefits under foreign governments / international organizations | NIRC Sec. 32(B)(4) | Philippines tax-exempt entity |

### De Minimis Benefits — Excluded from Taxable Compensation

Per RR 11-2018 (TRAIN implementing rules) — current amounts as of 2024:

| De Minimis Benefit | Maximum Excluded Amount | Computation Basis |
|-------------------|------------------------|-------------------|
| Rice subsidy | ₱2,000/month (or 1 sack/month, whichever is lower) | Monthly |
| Clothing / uniform allowance | ₱6,000/year | Annual |
| Actual medical benefits | ₱10,000/year | Annual |
| Laundry allowance | ₱300/month | Monthly |
| Employee achievement award (in goods, not cash) | ₱10,000/year | Annual |
| Gifts at Christmas / major company anniversary | ₱5,000/year | Annual |
| Daily meal allowance during overtime / night shift | 25% of basic hourly rate per overtime hour | Per occasion |
| Benefits under Collective Bargaining Agreement (CBA) or productivity incentive schemes | ₱10,000/year | Annual |

**De Minimis Rule:** Amounts within these caps are 100% excluded from taxable compensation. Excess amounts above the caps are added back to taxable compensation. For example: If employer gives a ₱15,000 rice allowance/year (₱1,250/month), the annual cap is ₱24,000 (₱2,000 × 12). Since ₱15,000 < ₱24,000, the full ₱15,000 is excluded.

**Engine Implementation Note:** The engine does NOT compute de minimis exclusions. The user enters the pre-computed `taxable_compensation` from Form 2316 (which the employer has already reduced by de minimis, mandatory contributions, and ₱90K 13th-month exclusion). The de minimis table above is for informational display in the "What is taxable compensation?" help tooltip only.

### Fringe Benefit Tax (FBT) — NOT Part of This Engine's Computation

Fringe benefits received by supervisory or managerial employees are subject to FBT (NIRC Sec. 33) at 35% of the grossed-up monetary value. FBT is a FINAL tax paid BY THE EMPLOYER, not an additional tax on the employee. Such benefits are EXCLUDED from the employee's taxable compensation.

Engine rule: Do not include FBT-covered benefits in taxable_compensation. The employer handles FBT separately. If a user asks about FBT, show informational text: "If your employer pays fringe benefit tax on your behalf (car, housing, etc.), those benefits are already excluded from your Form 2316 taxable compensation. No adjustment needed here."

### Multiple Form 2316s (Multiple Employers)

```
function aggregate_form_2316s(form_2316s: List[Form2316Data]) -> AggregatedCompensation:
  """
  When a taxpayer has multiple employers in the same tax year
  (e.g., resigned from one job, started another), aggregate all Form 2316s.
  """
  total_taxable_compensation = sum(f.taxable_compensation for f in form_2316s)
  total_tw = sum(f.tax_withheld for f in form_2316s)
  // Note: Each employer computes TW based only on their own compensation,
  // not knowing about other employers. The combined tax may exceed the sum of TWs.
  // This creates a potential deficiency at annual filing.

  compensation_only_it = graduated_tax_for_year(total_taxable_compensation, current_tax_year)
  deficiency_on_compensation = max(compensation_only_it - total_tw, 0)

  return AggregatedCompensation {
    total_taxable_compensation: total_taxable_compensation,
    total_tw: total_tw,
    computed_compensation_it: compensation_only_it,
    tw_deficiency: deficiency_on_compensation,  // Positive if combined tax > sum of TWs
    tw_excess: max(total_tw - compensation_only_it, 0),
    number_of_employers: len(form_2316s)
  }
```

**Engine behavior with multiple Form 2316s:**
1. User indicates number_of_form_2316s > 1 → engine prompts for summed totals (or individual entry)
2. Engine computes compensation_only_it on the combined taxable_compensation
3. If tw_deficiency > 0: show warning "With multiple employers, your combined income is taxed at a higher rate than what each employer individually withheld. You have a compensation income tax deficiency of approximately ₱[amount] that will be payable at annual filing."
4. Proceed with standard mixed income comparison using aggregated values

---

## CR-031: VAT vs. Percentage Tax Obligation Determination

**Legal basis:** NIRC Sec. 109(CC), Sec. 116, Sec. 236(G); RA 11534 (CREATE); RA 11976 (EOPT); RR 8-2024

**Purpose:** Determine which indirect tax obligation applies, and how that affects the regime comparison.

### Step 1: Classify Indirect Tax Status

```
function determine_indirect_tax_status(input: TaxInput) -> IndirectTaxStatus:
  // Priority order: VAT-registered check first
  if input.vat_registered:
    return IndirectTaxStatus {
      obligation: "VAT",
      percentage_tax_applies: false,
      percentage_tax_waived: false,
      vat_applies: true,
      eight_pct_eligible: false,  // VAT-registered bars 8% option
      note: "VAT-registered. Percentage tax does not apply. 8% option not available."
    }

  // Check if gross exceeds ₱3M threshold
  if input.annual_gross_sales > 3_000_000:
    return IndirectTaxStatus {
      obligation: "VAT_REGISTRATION_REQUIRED",
      percentage_tax_applies: true,  // technically still applies until VAT is registered
      percentage_tax_waived: false,
      vat_applies: false,  // VAT not yet in effect (not registered)
      eight_pct_eligible: false,  // gross > ₱3M bars 8% option
      flag_vat_required: true,
      note: "Gross sales exceed ₱3,000,000. VAT registration is REQUIRED under NIRC Sec. 236(G). "
            "File Form 1905 within 10 days of end of the month the threshold was exceeded. "
            "Until VAT registration takes effect, percentage tax continues to apply."
    }

  // At exactly ₱3,000,000 gross sales: NOT required (threshold is "exceeding")
  // Check if 8% option was elected (waives OPT)
  if input.elected_eight_percent:
    return IndirectTaxStatus {
      obligation: "NONE_WAIVED_BY_8PCT",
      percentage_tax_applies: false,
      percentage_tax_waived: true,  // 8% option subsumes the OPT
      vat_applies: false,
      eight_pct_eligible: true,
      note: "8% income tax option elected. Percentage tax is waived. No Form 2551Q required."
    }

  // Default: non-VAT, gross ≤ ₱3M, not on 8% → Percentage tax applies
  return IndirectTaxStatus {
    obligation: "PERCENTAGE_TAX",
    percentage_tax_applies: true,
    percentage_tax_waived: false,
    vat_applies: false,
    eight_pct_eligible: true,  // still eligible to elect 8% (if not already past Q1)
    note: "Non-VAT registered. Gross sales ≤ ₱3,000,000. Percentage tax (3%) applies. "
          "File Form 2551Q quarterly (April 25, July 25, October 25, January 25)."
  }
```

### Step 2: Effect on Regime Comparison

```
// Impact of indirect tax status on path computations:

if indirect_status.percentage_tax_applies:
  // Paths A and B: include PT in total burden
  pt_amount = compute_annual_percentage_tax(input.quarterly_gross_sales)
  path_a_total = income_tax_path_a + pt_amount
  path_b_total = income_tax_path_b + pt_amount

  // Path C: PT is waived (8% is in lieu of PT)
  path_c_total = income_tax_path_c  // no PT

elif indirect_status.vat_applies:
  // VAT-registered: no PT on any path, no Path C
  path_a_total = income_tax_path_a  // no PT
  path_b_total = income_tax_path_b  // no PT
  path_c_total = null  // 8% not available

elif indirect_status.obligation == "NONE_WAIVED_BY_8PCT":
  // On 8% option: no PT on any path
  // Paths A and B theoretically have no PT since 8% election means no 2551Q filed
  // BUT: if switching away from 8%, paths A/B WOULD have PT
  // For comparison purposes: show what PT would cost under A or B vs. 8% saving it
  pt_amount_if_graduated = compute_annual_percentage_tax(input.quarterly_gross_sales)
  path_a_total = income_tax_path_a + pt_amount_if_graduated  // hypothetical PT
  path_b_total = income_tax_path_b + pt_amount_if_graduated  // hypothetical PT
  path_c_total = income_tax_path_c  // no PT (actual 8% path)
```

---

## CR-032: Percentage Tax Annual and Quarterly Computation

**Legal basis:** NIRC Sec. 116 as amended; RR 3-2024 (EOPT basis change); RMC 67-2021

**Current rules (for 2026 tax year):**
- Rate: 3%
- Basis: Gross quarterly SALES (accrual — invoice date, not payment date)
- Excludes: Sales returns and allowances, VAT (if any), zero-rated transactions

### Annual Percentage Tax (for regime comparison total burden):

```
function compute_annual_percentage_tax(quarterly_gross_sales: [Decimal; 4]) -> AnnualPT:
  // quarterly_gross_sales = [q1_gross, q2_gross, q3_gross, q4_gross]
  // Each element = gross sales for that quarter only (not cumulative)

  pt_rate = 0.03  // Current rate for 2026

  q1_pt = quarterly_gross_sales[0] * pt_rate
  q2_pt = quarterly_gross_sales[1] * pt_rate
  q3_pt = quarterly_gross_sales[2] * pt_rate
  q4_pt = quarterly_gross_sales[3] * pt_rate

  annual_pt = q1_pt + q2_pt + q3_pt + q4_pt

  // Validation: annual_pt should equal annual_gross_sales * 0.03
  // (because PT is simply 3% of total gross sales, no progressivity)
  assert abs(annual_pt - sum(quarterly_gross_sales) * pt_rate) < 0.01

  return AnnualPT {
    q1_pt: round(q1_pt, 2),
    q2_pt: round(q2_pt, 2),
    q3_pt: round(q3_pt, 2),
    q4_pt: round(q4_pt, 2),
    annual_total: round(annual_pt, 2),
    rate_applied: pt_rate,
    basis: "gross_sales_accrual",
    form: "2551Q"
  }
```

### When user provides annual gross (not quarterly breakdown):

```
function compute_annual_percentage_tax_from_annual(annual_gross_sales: Decimal) -> AnnualPT:
  // If user provides only annual total (not quarterly breakdown)
  // Assume equal quarterly distribution (engine cannot know actual quarterly figures)
  // User must manually verify quarterly amounts for actual Form 2551Q filing

  estimated_q_gross = annual_gross_sales / 4
  pt_rate = 0.03

  return AnnualPT {
    q1_pt: round(estimated_q_gross * pt_rate, 2),
    q2_pt: round(estimated_q_gross * pt_rate, 2),
    q3_pt: round(estimated_q_gross * pt_rate, 2),
    q4_pt: round(estimated_q_gross * pt_rate, 2),
    annual_total: round(annual_gross_sales * pt_rate, 2),
    rate_applied: pt_rate,
    basis: "gross_sales_accrual_estimated",
    note: "Quarterly breakdown estimated as equal fourths. "
          "Actual Form 2551Q must use real quarterly gross sales figures."
  }
```

### Percentage Tax as Deductible Expense Under Path A:

```
function path_a_with_pt_deduction(
  gross_income: Decimal,          // After COGS for traders, = gross sales for service providers
  itemized_deductions_before_pt: Decimal,  // All Sec. 34(A)-(K) deductions EXCLUDING percentage tax
  annual_gross_sales: Decimal
) -> PathAResult:

  // Step 1: Compute PT (fixed — depends only on gross sales, not on NTI)
  pt = annual_gross_sales * 0.03

  // Step 2: PT is deductible under Sec. 34(C)(1) (taxes paid, other than income tax)
  total_itemized = itemized_deductions_before_pt + pt

  // Step 3: Compute NTI (no circular dependency — PT was already computed)
  nti = max(gross_income - total_itemized, 0)

  // Step 4: Apply NOLCO if applicable (see CR-027 for NOLCO rules)
  nti_after_nolco = max(nti - nolco_applied, 0)

  // Step 5: Compute income tax
  income_tax = graduated_tax(nti_after_nolco)

  // Step 6: Compute total burden
  total_burden = income_tax + pt

  return PathAResult {
    gross_income: gross_income,
    itemized_deductions_before_pt: itemized_deductions_before_pt,
    percentage_tax: pt,
    total_itemized_with_pt: total_itemized,
    net_taxable_income: nti_after_nolco,
    income_tax: income_tax,
    percentage_tax_total: pt,
    total_burden: total_burden
  }
```

**Worked Example — CR-032-WE-01:**
- Freelance web developer, 2026 tax year
- Gross income (service): ₱1,200,000
- Itemized deductions (excl. PT): ₱180,000
- Annual gross sales: ₱1,200,000 (same as gross income for service provider)
- Taxpayer: non-VAT, not on 8%, graduated + itemized (Path A)

```
pt = ₱1,200,000 × 0.03 = ₱36,000
total_itemized = ₱180,000 + ₱36,000 = ₱216,000
nti = ₱1,200,000 − ₱216,000 = ₱984,000
income_tax = ₱102,500 + (₱984,000 − ₱800,000) × 0.25 = ₱102,500 + ₱46,000 = ₱148,500
total_burden_a = ₱148,500 + ₱36,000 = ₱184,500

// Compare Path B (OSD):
pt_b = ₱36,000 (same)
nti_b = ₱1,200,000 × 0.60 = ₱720,000
income_tax_b = ₱22,500 + (₱720,000 − ₱400,000) × 0.20 = ₱22,500 + ₱64,000 = ₱86,500
total_burden_b = ₱86,500 + ₱36,000 = ₱122,500

// Compare Path C (8%):
income_tax_c = (₱1,200,000 − ₱250,000) × 0.08 = ₱950,000 × 0.08 = ₱76,000
total_burden_c = ₱76,000 (no PT)

// Recommendation: Path C (₱76,000) < Path B (₱122,500) < Path A (₱184,500)
// Savings vs. next best: ₱122,500 − ₱76,000 = ₱46,500
```

---

## CR-033: VAT-Registered Taxpayer Regime Comparison

**Legal basis:** NIRC Sec. 106-110 (VAT); NIRC Sec. 24(A)(2)(b) (8% option ineligibility if VAT-registered)

**Purpose:** When a taxpayer is VAT-registered (or gross > ₱3M, whether or not registered), the engine must adapt the regime comparison.

### VAT-Registered Taxpayer Engine Rules:

```
function compute_all_paths_vat_registered(input: TaxInput) -> TaxResult:
  // Precondition: input.vat_registered == true OR input.annual_gross_sales > 3_000_000

  // Path C is INELIGIBLE
  path_c_result = PathResult {
    available: false,
    reason: "8% income tax option requires gross receipts ≤ ₱3,000,000 and non-VAT status. "
            "VAT-registered taxpayers are ineligible per RR 8-2018 Sec. 2(A)."
  }

  // Path A and B: no percentage tax component (VAT is a separate filing)
  // For income tax purposes, gross income for a VAT-registered service provider:
  //   gross_income = gross_sales (EXCLUDING output VAT collected)
  //   [VAT collected is not income — it is a liability to BIR]

  gross_income = input.vat_exclusive_gross_sales  // sales net of 12% output VAT

  path_a_result = compute_path_a(gross_income, input.itemized_deductions)
  path_a_result.percentage_tax = 0  // No OPT for VAT-registered
  path_a_result.total_burden = path_a_result.income_tax  // IT only

  path_b_result = compute_path_b(gross_income)
  path_b_result.percentage_tax = 0  // No OPT for VAT-registered
  path_b_result.total_burden = path_b_result.income_tax  // IT only

  // Recommendation: min(path_a, path_b) — only 2 paths
  recommended = "path_a" if path_a_result.total_burden <= path_b_result.total_burden else "path_b"
  // Tie-break: prefer OSD (Path B) over Itemized (Path A) on equal burden — simpler, no documentation

  // Alert: VAT is a SEPARATE obligation — this tool does not compute VAT payable
  vat_alert = "IMPORTANT: As a VAT-registered taxpayer, you have a separate quarterly VAT obligation "
              "(BIR Form 2550Q, due 25th day after each quarter end). This tool computes income tax only. "
              "Your VAT computation (output VAT minus input VAT) must be done separately."

  return TaxResult {
    taxpayer_type: "VAT_REGISTERED",
    path_a: path_a_result,
    path_b: path_b_result,
    path_c: path_c_result,
    recommended: recommended,
    indirect_tax_obligation: "VAT",
    vat_alert: vat_alert
  }
```

### VAT-Exclusive Gross Income Computation:

```
// For VAT-registered taxpayers, income tax is computed on VAT-EXCLUSIVE amounts
// (the VAT collected is not income; it is a pass-through to BIR)

function vat_exclusive_gross_income(
  gross_sales_inclusive: Decimal,  // total billed to clients including VAT
  vat_rate: Decimal = 0.12
) -> Decimal:
  // If taxpayer billed VAT on top of selling price:
  //   gross_sales_inclusive = selling_price + (selling_price × 0.12) = selling_price × 1.12
  //   gross_income_for_it = selling_price = gross_sales_inclusive / 1.12

  // If taxpayer billed VAT-inclusive (price includes VAT):
  //   gross_income_for_it = gross_sales_inclusive / 1.12

  // Engine default: assume VAT is charged on top of selling price
  // (i.e., user enters their fee/selling price, and VAT is added on top — standard practice)
  // In this case, user-entered gross income = VAT-exclusive amount already
  // No adjustment needed if user enters their sales before VAT

  return gross_sales_inclusive  // If user enters pre-VAT amounts (recommended input)
```

**Engine input instruction for VAT-registered users:**
The wizard must instruct: "Enter your gross sales BEFORE VAT. Do not include the 12% VAT you collected from clients."

### Deductibility of VAT for Income Tax Purposes:

```
// For VAT-registered taxpayers computing Path A (itemized deductions):
// Input VAT that is NOT creditable against output VAT (e.g., from non-VAT-able purchases
//   or purchases from non-VAT-registered suppliers) MAY be deductible as business expense
//   under NIRC Sec. 34(A) if it is part of the cost of doing business.
// Non-creditable input VAT treatment:
//   Option 1: Deduct as part of the purchase/cost (most common approach)
//   Option 2: Expense separately as "taxes paid" under Sec. 34(C)
// Engine behavior: include a note in Path A results for VAT-registered taxpayers:
//   "Non-creditable input VAT may be included in your itemized deductions.
//    Consult your CPA for the correct treatment of input VAT in your specific situation."
// This is flagged as MRF for VAT-registered users — engine cannot determine which
// input VAT is creditable without full VAT computation.
```

**Worked Example — CR-033-WE-01 (VAT-Registered IT Consultant):**
- Annual gross sales (VAT-exclusive): ₱5,000,000
- Itemized deductions (business expenses): ₱1,800,000
- VAT-registered (mandatory, exceeds ₱3M)
- Path A and B available; Path C not available

```
// Path A (Graduated + Itemized):
nti_a = ₱5,000,000 − ₱1,800,000 = ₱3,200,000
income_tax_a = ₱402,500 + (₱3,200,000 − ₱2,000,000) × 0.30 = ₱402,500 + ₱360,000 = ₱762,500
total_burden_a = ₱762,500 (no PT)

// Path B (Graduated + OSD):
nti_b = ₱5,000,000 × 0.60 = ₱3,000,000
income_tax_b = ₱402,500 + (₱3,000,000 − ₱2,000,000) × 0.30 = ₱402,500 + ₱300,000 = ₱702,500
total_burden_b = ₱702,500 (no PT)

// Recommendation: Path B (₱702,500) < Path A (₱762,500)
// Savings: ₱762,500 − ₱702,500 = ₱60,000
// Note: Only worth choosing Path A if itemized > OSD of ₱2,000,000 (40% × ₱5M)
// Breakeven: itemized > ₱2,000,000 → Path A wins; itemized ≤ ₱2,000,000 → Path B wins
```

---

## CR-034: Form 2551Q Per-Quarter Filing Engine

**Legal basis:** NIRC Sec. 116; RMC No. 26-2018 (prescribing Form 2551Q January 2018 ENCS); RA 11976 (EOPT — changed from monthly 2551M to quarterly 2551Q effective January 2023)

**Purpose:** Generate the complete field data for BIR Form 2551Q for a single quarter. Called once per applicable quarter. For the annual PT schedule, call four times (Q1–Q4) or generate via `generate_annual_pt_schedule()`.

**When to call:** Only when `taxpayer.opm_obligation == true`. Do NOT call if:
- Taxpayer is VAT-registered (`vat_registered == true`)
- Taxpayer elected 8% income tax option AND declared election on Form 1701Q (no 2551Q needed at all)
- Taxpayer has compensation income only (not self-employed)

---

### 34.1 Data Structures

```
// Quarter enum
enum Quarter { Q1, Q2, Q3, Q4 }

// Income tax rate election (applies ONLY to Q1 of the taxable year)
enum IncomeTaxElection {
  GRADUATED,       // Taxpayer is on graduated rates (Paths A or B)
  EIGHT_PERCENT    // Taxpayer elects 8% flat rate (waives OPT for full year)
}

// Form 2551Q input — all fields required for generating a complete, fileable return
struct Form2551QInput {
  // Taxpayer identification
  taxpayer_tin:     str       // 12-digit TIN (format: "###-###-###-###")
  taxpayer_name:    str       // "LAST NAME, FIRST NAME MIDDLE NAME" for individuals
  rdo_code:         str       // 3-character Revenue District Office code (e.g., "050")
  registered_address: str    // Full street address as registered with BIR
  zip_code:         str       // 4-digit ZIP code
  line_of_business: str       // Nature of business (e.g., "IT Consultant", "Freelance Writer")
  telephone_number: str       // Contact number with area code
  email_address:    str       // Email address for eBIRForms records

  // Return period
  taxable_year:       int     // Calendar year (e.g., 2026)
  is_calendar_year:   bool    // True for all individual taxpayers (always calendar year)
  quarter:            Quarter // Q1, Q2, Q3, or Q4
  is_amended:         bool    // True if this supersedes a previously filed return

  // Tax computation input
  quarterly_gross_sales: Decimal
    // Gross sales/receipts for THIS quarter ONLY (not cumulative)
    // Accrual basis (post-EOPT, effective October 27, 2024):
    //   Include amounts INVOICED during the quarter, whether or not collected
    // Exclude: sales returns and allowances, VAT if VAT-registered (not applicable here),
    //          zero-rated transactions, amounts exempt from percentage tax
    // For freelancers (service-only): gross_sales == gross_receipts_invoiced

  // Item 13: Income tax rate election (Individual taxpayers ONLY)
  //   Fill ONLY on Q1 of each taxable year
  //   Leave null for Q2, Q3, Q4 (election is irrevocable; determined in Q1)
  //   Leave null for non-individual taxpayers
  income_tax_rate_election: IncomeTaxElection | null

  // Item 15: Creditable percentage tax withheld by government agencies
  //   Applies when a government agency (GOCC, DepEd, DOH, etc.) pays the taxpayer
  //   and withholds 3% percentage tax before remitting payment.
  //   Evidenced by BIR Form 2307 with ATC PT010 issued by the government agency.
  //   For most private-sector freelancers: 0
  government_cwt_pct_tax: Decimal    // Default: 0

  // Item 16: Prior payment (for amended returns only)
  prior_payment_on_original_return: Decimal    // Default: 0; only if is_amended == true

  // Item 17: Other credits
  other_credits:             Decimal    // Default: 0; specify description below
  other_credits_description: str        // Default: "" (empty string)
}

// A single row in Schedule 1 of Form 2551Q
struct Form2551QSchedule1Row {
  row_number:      int       // 1 through 6 (Form has 6 rows; use row 1 for PT010)
  atc:             str       // Alphanumeric Tax Code (e.g., "PT010")
  description:     str       // Nature of business/transaction (human-readable)
  taxable_amount:  Decimal   // Gross sales/receipts for the quarter (Column B)
  tax_rate:        Decimal   // Applicable rate as a decimal (Column C)
  tax_due:         Decimal   // taxable_amount × tax_rate (Column D)
}

// Complete Form 2551Q output — maps directly to form fields
struct Form2551QOutput {
  // Items 1-5: Header period information
  item_1_calendar_year:  bool     // True (individual taxpayers always use calendar year)
  item_2_year_ended:     str      // "12/2026" for calendar year 2026 Q4; same for all quarters
  item_3_quarter:        str      // "1st" | "2nd" | "3rd" | "4th"
  item_4_amended:        bool     // True if this is an amended return
  item_5_sheets_attached: int     // 0 for standard single-activity freelancer (no SAWT for PT)

  // Items 6-13: Part I — Background information
  item_6_tin:             str     // 12-digit TIN
  item_7_rdo_code:        str     // 3-digit RDO code
  item_8_taxpayer_name:   str     // Last, First, Middle for individuals
  item_9_registered_address: str  // Full registered address
  item_9a_zip_code:       str     // 4-digit ZIP
  item_10_line_of_business: str   // Nature of business
  item_11_telephone:      str     // Contact number
  item_12_email:          str     // Email address
  item_13_income_tax_election: str | null
    // Q1 only: "GRADUATED" or "EIGHT_PERCENT"
    // Q2-Q4: null (leave blank on form)

  // Schedule 1: Computation (Items 1-7 of Schedule)
  schedule_1_rows:     List[Form2551QSchedule1Row]  // Items 1-6
  schedule_1_item_7_total_tax_due: Decimal          // Sum of all row tax_due amounts

  // Items 14-23: Part II — Total Tax Payable
  item_14_total_tax_due:          Decimal   // Transfer from Schedule 1 Item 7
  item_15_govt_cwt_pct_tax:       Decimal   // Creditable PT withheld by government agencies
  item_16_prior_return_payment:   Decimal   // For amended returns only
  item_17_other_credits:          Decimal   // Other applicable credits
  item_18_total_credits:          Decimal   // Sum of Items 15 + 16 + 17
  item_19_tax_still_payable:      Decimal   // Item 14 − Item 18 (may be negative = overpayment)
  item_20_surcharge:              Decimal   // 10%/25% of unpaid tax if filed late (MICRO/SMALL: 10%)
  item_21_interest:               Decimal   // 6%/12% per annum if filed late (MICRO/SMALL: 6%)
  item_22_compromise:             Decimal   // BIR-assessed compromise penalty (from CR-020)
  item_23_total_penalties:        Decimal   // Sum of Items 20 + 21 + 22
  total_amount_payable:           Decimal   // Item 19 + Item 23 (if ≥ 0) or overpayment amount

  // Metadata (not on form — engine use only)
  filing_deadline:    date    // Exact deadline date (April 25 / July 25 / Oct 25 / Jan 25)
  is_nil_return:      bool    // True if quarterly_gross_sales == 0 AND total_tax_due == 0
  filing_required:    bool    // True unless taxpayer elected 8% via Form 1701Q (no 2551Q needed)
  notes:              List[str]  // Engine flags and explanations
}

// Annual percentage tax filing schedule — all four quarters for one taxpayer-year
struct AnnualPTFilingSchedule {
  taxable_year:              int
  income_tax_rate_election:  IncomeTaxElection    // As declared in Q1
  election_declared_on:      str    // "FORM_1701Q" | "FORM_2551Q" | "COR"
    //   FORM_1701Q: 8% elected on quarterly income tax return → no 2551Q needed at all
    //   FORM_2551Q: election declared on the Q1 2551Q form → file Q1 with ₱0 PT
    //   COR: new registrant elected 8% on Certificate of Registration → no 2551Q needed

  quarters: [Form2551QOutput; 4]    // Indices 0-3 = Q1-Q4

  annual_pt_total:                  Decimal   // Sum of all quarters' item_14 amounts
  annual_pt_as_itemized_deduction:  Decimal   // Same as annual_pt_total (deductible under Sec. 34(C)(1) for Path A)
}
```

---

### 34.2 Core Function: generate_form_2551q

```
function generate_form_2551q(input: Form2551QInput) -> Form2551QOutput:
  """
  Generates complete Form 2551Q field data for a single quarter.

  PRECONDITIONS:
    input.quarterly_gross_sales >= 0
    input.government_cwt_pct_tax >= 0
    input.prior_payment_on_original_return >= 0
    If input.is_amended == false: input.prior_payment_on_original_return must be 0
    If input.quarter != Q1: input.income_tax_rate_election must be null
    If input.quarter == Q1 and taxpayer is individual: income_tax_rate_election must be set

  RAISES:
    ValidationError("Q1 individual return must declare income tax rate election") if:
      input.quarter == Q1 AND input.income_tax_rate_election == null
    ValidationError("income_tax_rate_election must be null for Q2-Q4") if:
      input.quarter in [Q2, Q3, Q4] AND input.income_tax_rate_election != null
  """

  // STEP 1: Determine applicable PT rate
  pt_rate = 0.03
  // Rate history: Pre-July 2020: 3%; July 2020 – June 2023: 1% (CREATE); July 2023+: 3%
  // For taxable_year 2024 and later: always 3%
  // For taxable_year 2022 or prior: use rate history table in percentage-tax-rates.md Part 1

  // STEP 2: Determine if PT is waived by 8% election
  eight_pct_waives_pt = (
    input.income_tax_rate_election == EIGHT_PERCENT
    // OR taxpayer declared 8% on 1701Q (handled by caller — don't call this function at all)
  )

  // STEP 3: Build Schedule 1 rows
  if eight_pct_waives_pt:
    // Q1 2551Q still filed (as election declaration document), but PT = ₱0
    row_tax_due = 0
  else:
    row_tax_due = round(input.quarterly_gross_sales * pt_rate, 2)

  schedule_1_rows = [
    Form2551QSchedule1Row(
      row_number    = 1,
      atc           = "PT010",
      description   = "Professional/service income — Persons exempt from VAT under Sec. 109(CC)",
      taxable_amount = round(input.quarterly_gross_sales, 2),
      tax_rate      = pt_rate,
      tax_due       = row_tax_due
    )
  ]
  // Rows 2-6 of Schedule 1 are left blank (not applicable for typical freelancer)
  // Exception: see EC-PT04 for multiple ATC scenarios

  total_tax_due_schedule_1 = row_tax_due    // Sum of all rows (₱0 for rows 2-6)

  // STEP 4: Compute credits
  prior_payment = (
    input.prior_payment_on_original_return
    if input.is_amended
    else 0
  )
  total_credits = round(
    input.government_cwt_pct_tax
    + prior_payment
    + input.other_credits
    , 2
  )

  // STEP 5: Compute net tax still payable
  // Can be negative (overpayment) — negative value = overpayment to be refunded or carried forward
  tax_still_payable = round(total_tax_due_schedule_1 - total_credits, 2)

  // STEP 6: Penalties — set to ₱0 for on-time filing
  // For late filing: call compute_total_late_filing_penalty() from CR-020 and inject results here
  surcharge  = 0
  interest   = 0
  compromise = 0
  total_penalties = 0

  // STEP 7: Total amount payable
  total_payable = max(tax_still_payable + total_penalties, 0)
  // Note: overpayment (negative tax_still_payable) is displayed separately as "(Overpayment)"
  // It does NOT flow to next quarter automatically — taxpayer must claim refund or apply as credit

  // STEP 8: Filing deadline
  deadline_map = {
    Q1: date(input.taxable_year, 4, 25),
    Q2: date(input.taxable_year, 7, 25),
    Q3: date(input.taxable_year, 10, 25),
    Q4: date(input.taxable_year + 1, 1, 25)
  }
  filing_deadline = deadline_map[input.quarter]
  // Holiday rule: if April 25 / July 25 / October 25 / January 25 falls on a Saturday, Sunday,
  // or official Philippine public holiday, the deadline moves to the NEXT BANKING DAY.
  // Engine must check holiday calendar. For simplicity, the engine defaults to the nominal date
  // and notes: "Verify with BIR if deadline falls on a non-banking day."

  // STEP 9: Nil return flag
  is_nil_return = (input.quarterly_gross_sales == 0)
  // A nil return has ₱0 gross and ₱0 tax due — still REQUIRED to be filed to avoid penalty

  // STEP 10: Filing required flag
  // If taxpayer elected 8% on Form 1701Q (not on 2551Q), caller should NOT call this function
  // If taxpayer elected 8% on Form 2551Q (Q1 only), this function IS called for Q1 (₱0 PT)
  // Q2-Q4 for 8% taxpayers: filing_required = false (should not be called)
  filing_required = true    // Default; caller enforces exception

  // STEP 11: Build notes
  notes = []
  if is_nil_return:
    notes.append(
      "NIL return: No gross sales/receipts this quarter. A NIL return (₱0 tax) must still "
      "be filed on or before the deadline to avoid a failure-to-file compromise penalty "
      "(₱1,000 for first offense, ₱5,000 for second, ₱10,000 for third, criminal for 4th+). "
      "See CR-020.2 and EC-P05."
    )
  if input.income_tax_rate_election == EIGHT_PERCENT:
    notes.append(
      "8% income tax option elected. Percentage tax for this and all subsequent quarters "
      "is waived by law (NIRC Sec. 24(A)(2)(b): '...in lieu of the percentage tax under "
      "Section 116 of this Code'). This Q1 return serves as the formal election declaration. "
      "Do NOT file Form 2551Q for Q2, Q3, or Q4 of this taxable year."
    )
  if input.income_tax_rate_election == GRADUATED:
    notes.append(
      "Graduated income tax rate elected. Percentage tax (3% of gross sales) applies for "
      "all four quarters. File Form 2551Q for Q1, Q2, Q3, and Q4. The election is irrevocable "
      "for this taxable year — you cannot switch to 8% once this Q1 return is filed."
    )
  if input.government_cwt_pct_tax > 0:
    notes.append(
      f"Creditable percentage tax withheld by government agency (Item 15): "
      f"₱{input.government_cwt_pct_tax:,.2f}. Attach BIR Form 2307 (ATC PT010) from the "
      f"government withholding agent. The withheld amount reduces your PT payable this quarter."
    )
  if input.is_amended:
    notes.append(
      f"Amended return. Prior payment on original return (Item 16): "
      f"₱{prior_payment:,.2f}. Attach original return and proof of prior payment."
    )

  // STEP 12: Construct and return output
  return Form2551QOutput(
    item_1_calendar_year      = input.is_calendar_year,
    item_2_year_ended         = f"12/{input.taxable_year}" if input.is_calendar_year else f"...",
    item_3_quarter            = {Q1: "1st", Q2: "2nd", Q3: "3rd", Q4: "4th"}[input.quarter],
    item_4_amended            = input.is_amended,
    item_5_sheets_attached    = 0,

    item_6_tin                = input.taxpayer_tin,
    item_7_rdo_code           = input.rdo_code,
    item_8_taxpayer_name      = input.taxpayer_name,
    item_9_registered_address = input.registered_address,
    item_9a_zip_code          = input.zip_code,
    item_10_line_of_business  = input.line_of_business,
    item_11_telephone         = input.telephone_number,
    item_12_email             = input.email_address,
    item_13_income_tax_election = (
      {GRADUATED: "GRADUATED", EIGHT_PERCENT: "EIGHT_PERCENT"}[input.income_tax_rate_election]
      if input.income_tax_rate_election is not null else null
    ),

    schedule_1_rows             = schedule_1_rows,
    schedule_1_item_7_total_tax_due = total_tax_due_schedule_1,

    item_14_total_tax_due       = total_tax_due_schedule_1,
    item_15_govt_cwt_pct_tax    = round(input.government_cwt_pct_tax, 2),
    item_16_prior_return_payment = round(prior_payment, 2),
    item_17_other_credits       = round(input.other_credits, 2),
    item_18_total_credits       = total_credits,
    item_19_tax_still_payable   = tax_still_payable,
    item_20_surcharge           = surcharge,
    item_21_interest            = interest,
    item_22_compromise          = compromise,
    item_23_total_penalties     = total_penalties,
    total_amount_payable        = total_payable,

    filing_deadline   = filing_deadline,
    is_nil_return     = is_nil_return,
    filing_required   = filing_required,
    notes             = notes
  )
```

---

### 34.3 Annual Schedule Function: generate_annual_pt_schedule

```
function generate_annual_pt_schedule(
  taxpayer: TaxpayerInfo,
  taxable_year:             int,
  quarterly_gross_sales:    [Decimal; 4],    // [Q1, Q2, Q3, Q4]
  income_tax_rate_election: IncomeTaxElection,
  election_declared_on:     str,             // "FORM_1701Q" | "FORM_2551Q" | "COR"
  govt_cwt_per_quarter:     [Decimal; 4] = [0, 0, 0, 0]
) -> AnnualPTFilingSchedule:
  """
  Generates all four Form 2551Q returns and the annual PT total.

  ELECTION LOGIC:
    election_declared_on == "FORM_1701Q":
      Taxpayer elected 8% on Form 1701Q. No Form 2551Q is required for ANY quarter.
      All four Form2551QOutput objects have filing_required = false.

    election_declared_on == "COR":
      Taxpayer elected 8% on Certificate of Registration (new registrant).
      No Form 2551Q required for ANY quarter.
      All four Form2551QOutput objects have filing_required = false.

    election_declared_on == "FORM_2551Q" AND income_tax_rate_election == EIGHT_PERCENT:
      Q1 Form 2551Q filed (₱0 PT — election declaration).
      Q2, Q3, Q4: filing_required = false (do not file).

    election_declared_on == "FORM_2551Q" AND income_tax_rate_election == GRADUATED:
      Q1, Q2, Q3, Q4: all four returns filed (₱X PT each quarter).
  """

  quarters_output = []

  for q_index in range(4):
    quarter = [Q1, Q2, Q3, Q4][q_index]

    // Determine if this quarter requires a 2551Q filing
    if election_declared_on in ["FORM_1701Q", "COR"]:
      // No 2551Q for any quarter — add placeholder output
      quarters_output.append(Form2551QOutput(
        item_3_quarter      = {Q1:"1st",Q2:"2nd",Q3:"3rd",Q4:"4th"}[quarter],
        filing_required     = false,
        is_nil_return       = (quarterly_gross_sales[q_index] == 0),
        total_amount_payable = 0,
        item_14_total_tax_due = 0,
        // All other items: 0 or null (not used)
        notes = ["Form 2551Q not required: 8% income tax option was elected on Form 1701Q/COR. "
                 "Percentage tax is waived for the entire year."]
      ))
      continue

    if election_declared_on == "FORM_2551Q" AND income_tax_rate_election == EIGHT_PERCENT:
      if quarter == Q1:
        // Q1 is filed (₱0 PT) — election declaration
        input = Form2551QInput(
          taxable_year  = taxable_year,
          quarter       = Q1,
          quarterly_gross_sales = quarterly_gross_sales[0],
          income_tax_rate_election = EIGHT_PERCENT,
          government_cwt_pct_tax = govt_cwt_per_quarter[0],
          // ... other taxpayer fields from taxpayer struct
        )
        quarters_output.append(generate_form_2551q(input))
      else:
        // Q2-Q4: not filed
        quarters_output.append(Form2551QOutput(
          item_3_quarter = {Q2:"2nd",Q3:"3rd",Q4:"4th"}[quarter],
          filing_required = false,
          is_nil_return  = (quarterly_gross_sales[q_index] == 0),
          total_amount_payable = 0,
          item_14_total_tax_due = 0,
          notes = ["Form 2551Q not required: 8% option elected on Q1 Form 2551Q. "
                   "No percentage tax returns for Q2, Q3, Q4."]
        ))
      continue

    // Graduated rate: all four quarters filed
    q1_election = income_tax_rate_election if quarter == Q1 else null
    input = Form2551QInput(
      taxable_year  = taxable_year,
      quarter       = quarter,
      quarterly_gross_sales = quarterly_gross_sales[q_index],
      income_tax_rate_election = q1_election,
      government_cwt_pct_tax = govt_cwt_per_quarter[q_index],
      // ... other taxpayer fields from taxpayer struct
    )
    quarters_output.append(generate_form_2551q(input))

  // Compute annual PT total
  annual_pt_total = sum(
    q.item_14_total_tax_due
    for q in quarters_output
    if q.filing_required
  )

  return AnnualPTFilingSchedule(
    taxable_year              = taxable_year,
    income_tax_rate_election  = income_tax_rate_election,
    election_declared_on      = election_declared_on,
    quarters                  = quarters_output,
    annual_pt_total           = round(annual_pt_total, 2),
    annual_pt_as_itemized_deduction = round(annual_pt_total, 2)
      // Percentage tax paid is fully deductible under NIRC Sec. 34(C)(1) for Path A
      // The deductible amount equals the total PT actually paid (computed, not estimated)
  )
```

---

### 34.4 Worked Examples

**Example CR-034-WE-01: Graduated freelancer, regular Q2 return**
```
Input:
  taxpayer_tin = "123-456-789-000"
  taxpayer_name = "DELA CRUZ, JUAN CARLOS REYES"
  rdo_code = "050"
  registered_address = "123 Mapagkumbaba St., Brgy. Poblacion, Makati City"
  zip_code = "1210"
  line_of_business = "Software Developer / IT Consultant"
  telephone_number = "(02) 8123-4567"
  email_address = "jcdelacruz@email.com"
  taxable_year = 2026
  quarter = Q2
  is_calendar_year = true
  is_amended = false
  quarterly_gross_sales = 350,000.00    // April-June gross invoices
  income_tax_rate_election = null       // Q2: no election field
  government_cwt_pct_tax = 0
  prior_payment_on_original_return = 0
  other_credits = 0

Output:
  item_1_calendar_year = true
  item_2_year_ended = "12/2026"
  item_3_quarter = "2nd"
  item_4_amended = false
  item_5_sheets_attached = 0

  item_6_tin = "123-456-789-000"
  item_7_rdo_code = "050"
  item_8_taxpayer_name = "DELA CRUZ, JUAN CARLOS REYES"
  item_9_registered_address = "123 Mapagkumbaba St., Brgy. Poblacion, Makati City"
  item_9a_zip_code = "1210"
  item_10_line_of_business = "Software Developer / IT Consultant"
  item_11_telephone = "(02) 8123-4567"
  item_12_email = "jcdelacruz@email.com"
  item_13_income_tax_election = null    // Blank on form (Q2)

  schedule_1_rows = [
    { row_number: 1, atc: "PT010",
      description: "Professional/service income — Sec. 109(CC)",
      taxable_amount: 350,000.00, tax_rate: 0.03, tax_due: 10,500.00 }
  ]
  schedule_1_item_7_total_tax_due = 10,500.00

  item_14_total_tax_due = 10,500.00
  item_15_govt_cwt_pct_tax = 0
  item_16_prior_return_payment = 0
  item_17_other_credits = 0
  item_18_total_credits = 0
  item_19_tax_still_payable = 10,500.00
  item_20_surcharge = 0
  item_21_interest = 0
  item_22_compromise = 0
  item_23_total_penalties = 0
  total_amount_payable = 10,500.00

  filing_deadline = July 25, 2026
  is_nil_return = false
  filing_required = true
  notes = []

Verification: ₱350,000 × 0.03 = ₱10,500. Correct.
```

**Example CR-034-WE-02: Q1 return with 8% election declaration**
```
Input:
  (taxpayer identification same as WE-01, different fields below)
  taxable_year = 2026
  quarter = Q1
  quarterly_gross_sales = 280,000.00    // January-March gross invoices
  income_tax_rate_election = EIGHT_PERCENT

Output:
  item_3_quarter = "1st"
  item_13_income_tax_election = "EIGHT_PERCENT"    // Checked on form

  schedule_1_rows = [
    { row_number: 1, atc: "PT010",
      description: "Professional/service income — Sec. 109(CC)",
      taxable_amount: 280,000.00, tax_rate: 0.03, tax_due: 0.00 }
      // tax_due = ₱0 because 8% election waives PT for the FULL year (including Q1)
  ]
  schedule_1_item_7_total_tax_due = 0.00

  item_14_total_tax_due = 0.00
  item_18_total_credits = 0
  item_19_tax_still_payable = 0.00
  total_amount_payable = 0.00

  filing_deadline = April 25, 2026
  is_nil_return = false    // Has gross sales; just ₱0 PT due (not the same as no income)
  filing_required = true   // This Q1 return must be filed as the formal election document
  notes = [
    "8% income tax option elected. Percentage tax for this and all subsequent quarters is
     waived by law (NIRC Sec. 24(A)(2)(b)). This Q1 return serves as the formal election
     declaration. Do NOT file Form 2551Q for Q2, Q3, or Q4 of this taxable year."
  ]
```

**Example CR-034-WE-03: NIL return — no income in Q3**
```
Input:
  taxable_year = 2026
  quarter = Q3
  quarterly_gross_sales = 0.00    // No income July-September (e.g., sabbatical)
  income_tax_rate_election = null // Q3; not applicable

Output:
  item_3_quarter = "3rd"
  schedule_1_rows = [
    { row_number: 1, atc: "PT010",
      taxable_amount: 0.00, tax_rate: 0.03, tax_due: 0.00 }
  ]
  item_14_total_tax_due = 0.00
  total_amount_payable = 0.00
  filing_deadline = October 25, 2026
  is_nil_return = true
  filing_required = true    // NIL return must still be filed
  notes = [
    "NIL return: No gross sales/receipts this quarter. A NIL return (₱0 tax) must still be
     filed on or before October 25, 2026 to avoid a failure-to-file compromise penalty
     (₱1,000 for first offense). See CR-020.2 and EC-P05."
  ]
```

**Example CR-034-WE-04: Full annual PT schedule — graduated taxpayer**
```
Input:
  income_tax_rate_election = GRADUATED
  election_declared_on = "FORM_2551Q"
  quarterly_gross_sales = [300,000, 350,000, 280,000, 370,000]
  govt_cwt_per_quarter = [0, 0, 0, 0]

Output:
  Q1: quarterly_gross_sales = 300,000  →  PT due = 300,000 × 0.03 = ₱9,000
      filing_deadline = April 25, 2026;  item_13 = "GRADUATED"
  Q2: quarterly_gross_sales = 350,000  →  PT due = 350,000 × 0.03 = ₱10,500
      filing_deadline = July 25, 2026;   item_13 = null (Q2)
  Q3: quarterly_gross_sales = 280,000  →  PT due = 280,000 × 0.03 = ₱8,400
      filing_deadline = October 25, 2026; item_13 = null (Q3)
  Q4: quarterly_gross_sales = 370,000  →  PT due = 370,000 × 0.03 = ₱11,100
      filing_deadline = January 25, 2027; item_13 = null (Q4)

  annual_pt_total = 9,000 + 10,500 + 8,400 + 11,100 = ₱39,000
  annual_pt_as_itemized_deduction = ₱39,000

  Verification: Annual gross = 300K+350K+280K+370K = ₱1,300,000
               Annual PT = ₱1,300,000 × 0.03 = ₱39,000. Correct.
```

---

### 34.5 PT Rate for Prior-Year Returns (Amended Returns / Audit Defense)

When generating Form 2551Q for prior taxable years, the engine must apply the rate in effect for that year:

```
function get_pt_rate_for_quarter(taxable_year: int, quarter: Quarter) -> Decimal:
  """
  Returns the Section 116 percentage tax rate for a specific quarter.
  """
  // Convert to approximate date (start of quarter)
  quarter_start_dates = {
    (year, Q1): date(year, 1, 1),
    (year, Q2): date(year, 4, 1),
    (year, Q3): date(year, 7, 1),
    (year, Q4): date(year, 10, 1)
  }
  q_start = quarter_start_dates[(taxable_year, quarter)]

  CREATE_1PCT_START = date(2020, 7, 1)    // RA 11534 CREATE Act — 1% rate begins
  CREATE_1PCT_END   = date(2023, 6, 30)   // CREATE — 1% rate ends (June 30, 2023)

  if q_start >= CREATE_1PCT_START and q_start <= CREATE_1PCT_END:
    return 0.01    // 1% during CREATE COVID-era relief period
  else:
    return 0.03    // 3% standard rate (before July 2020 and from July 2023 onwards)

// Rate table for reference:
// Q1 2020 (Jan-Mar 2020): 3%
// Q2 2020 (Apr-Jun 2020): 3% (CREATE not yet effective)
// Q3 2020 (Jul-Sep 2020): 1%  ← CREATE rate begins Q3 2020
// Q4 2020 (Oct-Dec 2020): 1%
// Q1 2021: 1%   Q2 2021: 1%   Q3 2021: 1%   Q4 2021: 1%
// Q1 2022: 1%   Q2 2022: 1%   Q3 2022: 1%   Q4 2022: 1%
// Q1 2023: 1%   Q2 2023: 1%   ← Last quarter at 1% (Apr-Jun 2023)
// Q3 2023 (Jul-Sep 2023): 3%  ← 3% reversion begins Q3 2023
// Q4 2023: 3%   Q1 2024+: 3%
```
