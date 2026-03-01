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

**Note:** As of EOPT Act (RA 11976, effective 2024), filing deadlines and procedures may have been updated. Forward loop should confirm current deadlines from BIR website.

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

## Cross-References

- For lookup tables: See [lookup-tables/](lookup-tables/)
  - [lookup-tables/taxpayer-classification-tiers.md](lookup-tables/taxpayer-classification-tiers.md) — complete tier table with all implications
  - [lookup-tables/bir-penalty-schedule.md](lookup-tables/bir-penalty-schedule.md) — complete BIR penalty schedule (compromise tables, criminal penalties, prescriptive periods)
- For decision trees covering regime selection: See [decision-trees.md](decision-trees.md) (PENDING)
- For edge cases (mid-year threshold crossing, first-year filers, tier boundaries, e-marketplace withholding, penalty scenarios): See [edge-cases.md](edge-cases.md)
- For test vectors validating these computations: See [../engine/test-vectors/basic.md](../engine/test-vectors/basic.md) (PENDING)
- For full legal text behind each rule: See [legal-basis.md](legal-basis.md)
- For RR 16-2023 source material: See [../../../input/sources/rr-16-2023-emarketplace.md](../../../input/sources/rr-16-2023-emarketplace.md)
