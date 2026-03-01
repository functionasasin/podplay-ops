# Engine Data Model — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-01
**Cross-references:**
- Pipeline steps: [engine/pipeline.md](pipeline.md)
- Computation rules: [domain/computation-rules.md](../domain/computation-rules.md)
- BIR Form 1701 fields: [domain/bir-form-1701-field-mapping.md](../domain/bir-form-1701-field-mapping.md)
- BIR Form 1701A fields: [domain/bir-form-1701a-field-mapping.md](../domain/bir-form-1701a-field-mapping.md)
- Invariants: [engine/invariants.md](invariants.md)
- Error states: [engine/error-states.md](error-states.md)

---

## Table of Contents

1. [Primitive Types and Type Aliases](#1-primitive-types-and-type-aliases)
2. [Enumerations](#2-enumerations)
3. [Input Types](#3-input-types)
4. [Pipeline Step Intermediate Types](#4-pipeline-step-intermediate-types)
5. [Form Output Types](#5-form-output-types)
6. [Final Output Type](#6-final-output-type)
7. [Supporting / Helper Types](#7-supporting--helper-types)
8. [Type Cross-Reference Table](#8-type-cross-reference-table)

---

## 1. Primitive Types and Type Aliases

All monetary values in the engine use `Decimal` (arbitrary precision, not floating-point) to avoid centavo rounding errors during intermediate computation. Percentages are stored as decimals (e.g., 0.08 for 8%, never 8).

| Alias | Base Type | Description |
|-------|-----------|-------------|
| `Decimal` | Arbitrary-precision decimal number | All monetary values (PHP peso amounts). Never float or double. |
| `Peso` | `Decimal` | Alias for clarity when a field specifically represents a peso amount. |
| `Rate` | `Decimal` | A percentage expressed as a decimal (0.0 to 1.0). E.g., 0.08 = 8%. |
| `TaxYear` | `int` | Calendar year for which tax is being computed. Valid range: 2018–2030. |
| `Date` | ISO 8601 date | Calendar date in YYYY-MM-DD format. |
| `Quarter` | `int` | 1, 2, or 3. (Q4 is never filed as 1701Q; only as annual ITR.) |

**Decimal precision rules:**
- All intermediate computations: full precision (no intermediate rounding).
- Final IT due, OSD deduction, PT due, penalties: round to nearest centavo (2 decimal places) — `round(x, 2)`.
- BIR form display fields: truncate to whole peso (floor to integer). Internal engine retains centavos.
- Division: maintain at least 10 decimal places before final rounding.

---

## 2. Enumerations

### 2.1 TaxpayerType

Classification of the taxpayer's income composition. Set by user input and validated in PL-01/PL-02.

| Variant | Description |
|---------|-------------|
| `PURELY_SE` | Individual with ONLY self-employment / business / professional income. No compensation income from any employer. Eligible for ₱250,000 deduction under Path C. Files Form 1701A or 1701. |
| `MIXED_INCOME` | Individual who has BOTH compensation income (from employment) AND self-employment / business income. ₱250,000 deduction does NOT apply to business income under Path C per RMC 50-2018. Always files Form 1701. |
| `COMPENSATION_ONLY` | Individual with ONLY compensation income from employer(s). No self-employment income. Not subject to income tax optimization — always taxed at graduated rates via employer withholding. Engine returns N/A for all three paths. Included for completeness/validation. |

### 2.2 TaxpayerTier

EOPT Act (RA 11976) classification based on annual gross sales. Determines penalty rates and some filing procedures. Per RR 8-2024.

| Variant | Annual Gross Sales | Surcharge Rate | Interest Rate per Annum | Description |
|---------|-------------------|----------------|------------------------|-------------|
| `MICRO` | Less than ₱3,000,000 | 10% | 6% | Most freelancers and small professionals. Reduced EOPT penalties. |
| `SMALL` | ₱3,000,000 to less than ₱20,000,000 | 10% | 6% | Established professionals, small businesses. |
| `MEDIUM` | ₱20,000,000 to less than ₱1,000,000,000 | 25% | 12% | Mid-size businesses. Standard penalty rates. |
| `LARGE` | ₱1,000,000,000 and above | 25% | 12% | Large corporations. Standard penalty rates. |

**Boundary note:** At exactly ₱3,000,000 gross sales → `SMALL` tier. At exactly ₱20,000,000 → `MEDIUM`. Boundaries are strict: "less than" not "not exceeding."

### 2.3 FilingPeriod

The period covered by this computation.

| Variant | Description | Form Used |
|---------|-------------|-----------|
| `Q1` | January 1 through March 31 (cumulative since year start). Deadline: May 15. | Form 1701Q |
| `Q2` | January 1 through June 30 (cumulative). Deadline: August 15. | Form 1701Q |
| `Q3` | January 1 through September 30 (cumulative). Deadline: November 15. | Form 1701Q |
| `ANNUAL` | Full taxable year (January 1 through December 31). Deadline: April 15 of following year. | Form 1701 or 1701A |

**Note:** Q4 is NOT a separate filing period for income tax. The annual ITR covers Q4. Q4 data is included in the annual return.

### 2.4 IncomeType

Derived from input analysis (PL-02). More granular than TaxpayerType — reflects what income sources are present in this specific computation.

| Variant | Condition | Description |
|---------|-----------|-------------|
| `PURELY_SE` | `gross_receipts > 0` AND `taxable_compensation == 0` | Only self-employment income present. |
| `MIXED_INCOME` | `gross_receipts > 0` AND `taxable_compensation > 0` | Both business and compensation income. |
| `COMPENSATION_ONLY` | `gross_receipts == 0` AND `taxable_compensation > 0` | Only compensation income. |
| `ZERO_INCOME` | `gross_receipts == 0` AND `taxable_compensation == 0` | All zero inputs. Valid but generates WARN-006. |

### 2.5 TaxpayerClass

The type of business the taxpayer operates. Determines OSD base and other rules.

| Variant | Description | OSD Base |
|---------|-------------|----------|
| `SERVICE_PROVIDER` | Provides services or professional work; no inventory or cost of goods. | 40% × net_gross_receipts (NIRC Sec. 34L interpretation for service providers) |
| `TRADER` | Buys and sells goods; has cost of goods sold (COGS). | 40% × (net_gross_receipts − cost_of_goods_sold) = 40% × gross_income |

**Determination rule:** `cost_of_goods_sold > 0` → `TRADER`; otherwise `SERVICE_PROVIDER`.

### 2.6 RegimePath

The three tax computation paths available to self-employed taxpayers.

| Variant | Description | Form Section |
|---------|-------------|-------------|
| `PATH_A` | Graduated rates + Itemized Deductions. Requires documentation of actual expenses. | Form 1701 Schedule 3A + Schedule 4 |
| `PATH_B` | Graduated rates + Optional Standard Deduction (40%). No expense documentation. | Form 1701A Part IV-A or Form 1701 Schedule 3A + OSD box |
| `PATH_C` | 8% flat rate on gross receipts minus ₱250,000 (PURELY_SE only). Waives OPT. | Form 1701A Part IV-B or Form 1701 Schedule 3B |

### 2.7 RegimeElection

The user's explicit election of a regime, if provided. Distinct from `RegimePath` — this is the input election, which may be null (optimizer mode).

| Variant | Description |
|---------|-------------|
| `ELECT_EIGHT_PCT` | User explicitly elected 8% flat rate (Path C). Engine verifies eligibility; if ineligible, returns error. |
| `ELECT_OSD` | User explicitly chose OSD (Path B). Engine computes Path B only. |
| `ELECT_ITEMIZED` | User explicitly chose Itemized Deductions (Path A). Engine computes Path A only. |
| `null` | No election — optimizer mode. Engine computes all eligible paths and recommends the lowest. |

### 2.8 DeductionMethod

Which deduction approach was used in this computation.

| Variant | Description |
|---------|-------------|
| `ITEMIZED` | All expenses itemized and documented under NIRC Sec. 34(A)-(K). Used in Path A. |
| `OSD` | Optional Standard Deduction: 40% of gross income. Used in Path B. |
| `NONE` | No deduction applied. Used in Path C (8% flat rate — no deduction from gross receipts). |

### 2.9 BalanceDisposition

The result of subtracting credits from income tax due.

| Variant | Condition | Action |
|---------|-----------|--------|
| `BALANCE_PAYABLE` | `income_tax_due > total_credits` | Taxpayer owes BIR the balance. May split into two installments if > ₱2,000 and annual filing. |
| `ZERO_BALANCE` | `income_tax_due == total_credits` | Exactly even. No payment due, no refund. |
| `OVERPAYMENT` | `income_tax_due < total_credits` | Taxpayer overpaid. May claim refund, TCC, or carry over to next year. |

### 2.10 ReturnType

Whether this is an original or amended return.

| Variant | Description |
|---------|-------------|
| `ORIGINAL` | First filing for this period. No prior payment to credit for this return. |
| `AMENDED` | Correction of a previously filed return. `prior_payment_for_return` credits against new computation. |

### 2.11 FormType

Which BIR ITR form applies to this filing.

| Variant | Description | When Used |
|---------|-------------|-----------|
| `FORM_1701` | Annual ITR — Individuals (with business income). 4 pages with multiple schedules. | Mixed income; OR Path A (itemized); OR gross > ₱3M VAT-registered. |
| `FORM_1701A` | Annual ITR — Individuals Earning Purely from Business/Profession. Simplified 2-page form. | PURELY_SE using OSD (Path B) or 8% (Path C). |
| `FORM_1701Q` | Quarterly ITR. Filed for Q1, Q2, Q3. | Any self-employed with quarterly IT obligation. |

### 2.12 CwtClassification

How a Form 2307 entry should be classified for crediting purposes.

| Variant | ATC Pattern | Credit Applied To |
|---------|-------------|------------------|
| `INCOME_TAX_CWT` | WI-series (WI010, WI011, WI157, WI160, WI760, etc.) or WC-series (WC010, WC760, etc.) | Income tax due (Form 1701Q Item 57 or Form 1701/1701A tax credits section) |
| `PERCENTAGE_TAX_CWT` | PT010 only | Percentage tax due on Form 2551Q (Item 15 of 2551Q). NOT income tax. |
| `UNKNOWN` | Any other ATC code | Triggers MRF-021 flag. Tax withheld is NOT credited until ATC is confirmed. |

### 2.13 DepreciationMethod

How to compute annual depreciation for business assets.

| Variant | Description | Formula |
|---------|-------------|---------|
| `STRAIGHT_LINE` | Equal depreciation each year. Most common. | `(cost - salvage_value) / useful_life_years` per year |
| `DECLINING_BALANCE` | Higher depreciation in early years. Applied to adjusted book value. | `book_value × (1 / useful_life_years) × 2` per year (double-declining) |

### 2.14 OverpaymentDisposition

How the taxpayer wishes to handle an overpayment at annual filing.

| Variant | Description | Process |
|---------|-------------|---------|
| `CARRY_OVER` | Apply excess credit to the following year's income tax. Default recommendation for overpayments ≤ ₱50,000. | Mark Item 29 on 1701/1701A; retain Form 2307 copies. |
| `REFUND` | Request cash refund from BIR. For overpayments > ₱50,000. Slow process (90–120 days). | File BIR Form 1914; attach original 2307s; requires Revenue District Officer approval. |
| `TCC` | Tax Credit Certificate — BIR-issued certificate usable against future taxes. | File Form 1926; issued by BIR; transferable to other taxpayers. |

---

## 3. Input Types

### 3.1 TaxpayerInput

Top-level input struct. This is the complete set of information provided by the user or API caller before computation begins. All fields except nullables are required.

```
struct TaxpayerInput {
  // --- Identity / Classification ---
  taxpayer_type: TaxpayerType          // Required. PURELY_SE | MIXED_INCOME | COMPENSATION_ONLY
  tax_year: TaxYear                    // Required. Integer 2018–2030. Determines rate table (2023+ vs 2018-2022).
  filing_period: FilingPeriod          // Required. ANNUAL | Q1 | Q2 | Q3
  is_mixed_income: bool                // Required. True iff taxpayer_type == MIXED_INCOME. Redundant but explicit.

  // --- Registration Status ---
  is_vat_registered: bool              // Required. If true: Path C ineligible; OPT does not apply.
  is_bmbe_registered: bool             // Required. Barangay Micro Business Enterprise registration. If true: income tax exempt; all paths return ₱0 IT.
  subject_to_sec_117_128: bool         // Required. True if subject to industry-specific % taxes (telecom, transport, etc.) — NOT general Sec. 116 OPT. Disqualifies Path C.
  is_gpp_partner: bool                 // Required. True if computing tax on GPP distributive share. Disqualifies Path C; triggers MRF-025.

  // --- Business Income ---
  gross_receipts: Decimal              // Required. ₱0 or greater. Gross business receipts/revenues for the period. Cumulative for quarterly filings.
  sales_returns_allowances: Decimal    // Required. ₱0 or greater. Must be ≤ gross_receipts. Reduces threshold base and 8% computation base.
  non_operating_income: Decimal        // Required. ₱0 or greater. Business-related passive income NOT subjected to final withholding tax (e.g., rental income, royalties not FWT-subjected).
  fwt_income: Decimal                  // Required. ₱0 or greater. Income already subjected to final withholding tax (e.g., interest on bank deposits, PCSO winnings). Excluded from income tax base entirely.
  cost_of_goods_sold: Decimal          // Required. ₱0 or greater. For traders/merchants only. Zero for pure service providers. Reduces gross income for OSD base.

  // --- Compensation Income (mixed income only) ---
  taxable_compensation: Decimal        // Required. ₱0 or greater. Net compensation income after all non-taxable exclusions (SSS, PhilHealth, Pag-IBIG, 13th month pay ≤ ₱90,000, de minimis benefits). Zero for PURELY_SE taxpayers.
  compensation_cwt: Decimal            // Required. ₱0 or greater. Total tax withheld from compensation per all Form 2316s received from employers. Zero for PURELY_SE. Applied as IT credit.

  // --- Itemized Expenses (Path A only) ---
  itemized_expenses: ItemizedExpenseInput   // Required (use zero-filled struct if not applicable). Detailed expense breakdown for Path A computation. Engine uses this only for Path A.

  // --- Regime Election ---
  elected_regime: RegimeElection | null    // Optional. null = optimizer mode (engine recommends best path). Non-null = locked mode (engine verifies eligibility of elected path).
  osd_elected: bool | null                 // Optional. Explicit OSD election flag. null = let engine recommend. true = elect OSD (Path B). false = do not elect OSD. Overridden by elected_regime if both set.

  // --- Prior Period Data ---
  prior_quarterly_payments: List<QuarterlyPayment>   // Required for ANNUAL filing (may be empty list if no 1701Qs filed). Max 3 entries (Q1, Q2, Q3). For quarterly filings: prior quarters in same year.
  cwt_2307_entries: List<Form2307Entry>               // Required (may be empty list). All Form 2307 certificates received for the period. Cumulative for annual filing.
  prior_year_excess_cwt: Decimal                      // Required. ₱0 or greater. Carry-over credit from prior year's annual ITR overpayment election. Applied as IT credit.

  // --- Penalty Computation Inputs ---
  actual_filing_date: Date | null         // Optional. null = assume on-time filing; skip PL-16 entirely. Non-null = compute penalties if past deadline.
  return_type: ReturnType                 // Required. ORIGINAL | AMENDED.
  prior_payment_for_return: Decimal       // Required. ₱0 or greater. For AMENDED returns: amount already paid on original return. Credited against new balance. Zero for ORIGINAL returns.
}
```

**Field constraints summary:**

| Field | Constraint |
|-------|-----------|
| `tax_year` | 2018 ≤ value ≤ 2030 |
| `gross_receipts` | ≥ ₱0 |
| `sales_returns_allowances` | ≥ ₱0 AND ≤ gross_receipts |
| `non_operating_income` | ≥ ₱0 |
| `fwt_income` | ≥ ₱0 |
| `cost_of_goods_sold` | ≥ ₱0 |
| `taxable_compensation` | ≥ ₱0 |
| `compensation_cwt` | ≥ ₱0 |
| `prior_year_excess_cwt` | ≥ ₱0 |
| `prior_payment_for_return` | ≥ ₱0 |
| `prior_quarterly_payments` length | 0–3 entries for ANNUAL; 0–(quarter−1) entries for quarterly |
| If PURELY_SE | `taxable_compensation == 0` (VAL-008) |
| If COMPENSATION_ONLY | `gross_receipts == 0` (VAL-007) |
| If MIXED_INCOME | `taxable_compensation > 0` AND `gross_receipts > 0` |

---

### 3.2 ItemizedExpenseInput

All expense inputs for Path A (Itemized Deductions). Used only in PL-05. If Path A is not relevant, all fields default to ₱0.

```
struct ItemizedExpenseInput {
  // NIRC Sec. 34(A): Ordinary and Necessary Business Expenses
  salaries_and_wages: Decimal           // Gross salaries/wages paid to employees. ≥ ₱0. No cap.
  sss_philhealth_pagibig_employer_share: Decimal  // Employer's MANDATORY share only. Employee deductions from salary are NOT deductible here. ≥ ₱0.
  rent: Decimal                         // Office rent, co-working space. ≥ ₱0. Must be for business use.
  utilities: Decimal                    // Electricity, water, internet (business portion). ≥ ₱0.
  communication: Decimal                // Phone, internet subscriptions (business portion). ≥ ₱0.
  office_supplies: Decimal              // Stationery, ink, paper, small equipment. ≥ ₱0.
  professional_fees_paid: Decimal       // Fees paid to other professionals (not self). ≥ ₱0. E.g., lawyer's fee paid by a freelance accountant.
  travel_transportation: Decimal        // Business travel within Philippines. ≥ ₱0.
  insurance_premiums: Decimal           // Business insurance (not life insurance unless death benefit goes to employer). ≥ ₱0.

  // NIRC Sec. 34(B): Interest Expense
  interest_expense: Decimal             // Gross interest on business loans. ≥ ₱0. Subject to 33% arbitrage reduction.
  final_taxed_interest_income: Decimal  // Interest income on deposits subject to final withholding tax. Used to compute arbitrage reduction = 0.33 × final_taxed_interest_income. ≥ ₱0.

  // NIRC Sec. 34(C): Taxes and Licenses
  taxes_and_licenses: Decimal           // Business taxes (local business tax, professional tax, documentary stamp, etc.) EXCLUDING income tax. ≥ ₱0. Note: 3% OPT is computed separately by engine and deducted in PL-08, NOT here.

  // NIRC Sec. 34(D): Losses
  casualty_theft_losses: Decimal        // Losses from fire, theft, earthquake NOT compensated by insurance. ≥ ₱0.

  // NIRC Sec. 34(E): Bad Debts
  bad_debts: Decimal                    // Receivables written off as uncollectible. ≥ ₱0. Only for accrual-basis taxpayers (is_accrual_basis must be true).
  is_accrual_basis: bool                // True = taxpayer uses accrual accounting. False = cash basis. Bad debts only deductible if true.

  // NIRC Sec. 34(F): Depreciation
  depreciation_entries: List<DepreciationEntry>  // One entry per depreciable asset. May be empty list. Engine computes annual deduction per asset.

  // NIRC Sec. 34(H): Charitable Contributions
  charitable_contributions: Decimal     // Donations to accredited NGOs/institutions. ≥ ₱0. Capped at 10% of taxable income before this deduction.
  charitable_accredited: bool           // True = donee is BIR-accredited NGO/institution (deductible up to 10% cap). False = not accredited (NOT deductible; engine sets this to ₱0).

  // NIRC Sec. 34(I): Research and Development
  research_development: Decimal         // R&D expenditures directly connected to business. ≥ ₱0.

  // NIRC Sec. 34(A): Entertainment, Amusement, and Recreation (EAR)
  entertainment_representation: Decimal  // Meals, entertainment, client gifts. ≥ ₱0. Subject to EAR cap: 1% of net revenue (service) or 0.5% of net sales (goods). Engine computes cap and limits deduction.

  // Home Office (NIRC Sec. 34(A) — ordinary and necessary)
  home_office_expense: Decimal          // Monthly rent or mortgage interest/depreciation attributable to home office space. ≥ ₱0.
  home_office_exclusive_use: bool       // True = the space is used EXCLUSIVELY for business. False = mixed-use (NOT deductible; engine sets to ₱0). Guest rooms, dining tables, bedrooms = false.

  // NOLCO (Net Operating Loss Carry-Over) — NIRC Sec. 34(D)(3)
  nolco_entries: List<NolcoEntry>       // Prior-year operating losses eligible for carry-over. Max 3-year FIFO. Available ONLY under Path A (not OSD, not 8%).
}
```

**Derived field (not stored in struct, but referenced in validation):**

| Field | Derivation |
|-------|-----------|
| `total_claimed` | Sum of all Decimal fields above. Computed by engine, NOT user input. Used for VAL-019 (each sub-component ≥ 0). |

---

### 3.3 Form2307Entry

A single Certificate of Creditable Withholding Tax (BIR Form 2307) received from a client or platform. The taxpayer collects one or more of these per quarter.

```
struct Form2307Entry {
  payor_name: string                    // Business name or individual name of the withholding agent (client who withheld). Non-empty string.
  payor_tin: string                     // Tax Identification Number of the withholding agent. Format: "XXX-XXX-XXX-XXXX" or "XXX-XXX-XXX" (9 or 12 digits with dashes).
  atc_code: string                      // Alphanumeric Tax Code (ATC) for the type of income. Examples: WI010, WI011, WI160, WI760, WC010, PT010. Determines classification (CwtClassification).
  income_payment: Decimal               // Gross income payment on which tax was withheld. ≥ ₱0.
  tax_withheld: Decimal                 // Amount of tax actually withheld. ≥ ₱0 AND ≤ income_payment.
  period_from: Date                     // Start date of the period this 2307 covers. ISO 8601.
  period_to: Date                       // End date of the period this 2307 covers. ISO 8601. period_to ≥ period_from.
  quarter_of_credit: Quarter | null     // Which quarter's 1701Q to credit this against. null = annual filing (credit on final return). 1, 2, or 3 for quarterly filings.
}
```

**ATC code classification (see [lookup-tables/cwt-ewt-rates.md](../domain/lookup-tables/cwt-ewt-rates.md) for full table):**

| ATC | Type | Rate | Description |
|-----|------|------|-------------|
| WI010 | INCOME_TAX_CWT | 5% or 10% | Professional fee — individual (≤ or > ₱3M prior-year GR) |
| WI011 | INCOME_TAX_CWT | 5% or 10% | Rentals — individual |
| WI157 | INCOME_TAX_CWT | 15% | Fees of lawyers/accountants > ₱720K |
| WI160 | INCOME_TAX_CWT | 10% | Additional fees — individual |
| WI760 | INCOME_TAX_CWT | 1% (on ½ gross = 0.5% effective) | RR 16-2023 e-marketplace / DFSP remittance — individual |
| WC010 | INCOME_TAX_CWT | 5% or 10% | Professional fee — non-individual (corporation) |
| WC760 | INCOME_TAX_CWT | 1% (on ½ gross) | RR 16-2023 e-marketplace — non-individual |
| PT010 | PERCENTAGE_TAX_CWT | 3% | Percentage tax withheld on gross remittances by government agencies. Credits 2551Q Item 15. NOT income tax. |

---

### 3.4 QuarterlyPayment

Records a single prior quarterly income tax payment made via BIR Form 1701Q. Used in PL-12 to aggregate credits against annual IT.

```
struct QuarterlyPayment {
  quarter: Quarter        // 1, 2, or 3. (No Q4 quarterly return exists for income tax.)
  amount_paid: Decimal    // Amount actually remitted to BIR for this quarter. ≥ ₱0. This is the NET amount paid (after crediting prior-quarter payments and CWT on the 1701Q itself). NOT the cumulative tax due.
  date_paid: Date         // Date payment was made (for reference). May be null if user doesn't know exact date.
  form_1701q_period: FilingPeriod  // Q1 | Q2 | Q3 — must match `quarter`.
}
```

---

### 3.5 DepreciationEntry

A single depreciable business asset entered by the user for Path A computation.

```
struct DepreciationEntry {
  asset_name: string              // Descriptive name (e.g., "MacBook Pro 2023", "Delivery van", "Office desk"). Non-empty.
  asset_cost: Decimal             // Original acquisition cost. ≥ ₱0. For vehicles: capped at ₱2,400,000 per RR 12-2012 (engine applies cap automatically).
  salvage_value: Decimal          // Estimated residual value at end of useful life. ≥ ₱0 AND ≤ asset_cost. Default ₱0 if unknown.
  useful_life_years: int          // BIR-prescribed or reasonable useful life in years. Must be ≥ 1 and ≤ 50.
  acquisition_date: Date          // Date the asset was placed in service. Used to compute partial-year depreciation for the year of acquisition.
  method: DepreciationMethod      // STRAIGHT_LINE (default) | DECLINING_BALANCE.
  prior_accumulated_depreciation: Decimal  // Total depreciation already taken in prior tax years. ≥ ₱0. Used to compute remaining book value. For first-year assets: ₱0.
}
```

**BIR-prescribed useful lives (see [lookup-tables/itemized-deductions.md](../domain/lookup-tables/itemized-deductions.md) Part 6 for full table):**

| Asset Type | Useful Life |
|-----------|------------|
| Computer, laptop, tablet | 5 years |
| Office furniture and fixtures | 5–10 years |
| Office equipment (printer, scanner) | 5 years |
| Delivery motorcycle | 5 years |
| Delivery van / light vehicle | 5 years |
| Heavy equipment (trucks) | 10 years |
| Building improvements (leasehold) | Lease term or 5 years, whichever shorter |
| Software licenses (perpetual) | 3 years |
| Camera / video equipment | 5 years |
| Air conditioning unit | 5–10 years |
| Generator set | 10 years |
| Mobile phone | 3 years |

**Vehicle cost ceiling rule:** If `asset_name` indicates a vehicle (identified by category, not auto-detected) AND `asset_cost > 2,400,000`, engine uses `effective_cost = 2,400,000` for depreciation computation. Excess cost is non-deductible per RR 12-2012.

---

### 3.6 NolcoEntry

A prior-year net operating loss available for carry-over deduction under Path A. NOLCO is only available to taxpayers using Itemized Deductions (Path A). Not available to OSD or 8% users.

```
struct NolcoEntry {
  loss_year: TaxYear         // The year in which the operating loss was incurred. E.g., 2022.
  original_loss: Decimal     // The full net operating loss as originally reported. > ₱0.
  remaining_balance: Decimal // How much of the original loss has not yet been deducted. ≥ ₱0 AND ≤ original_loss. Engine deducts from this and returns updated balance.
  expiry_year: TaxYear       // Year after which the loss can no longer be deducted. = loss_year + 3. E.g., 2022 loss expires after 2025 (final year to claim: TY2025).
}
```

**NOLCO rules:**
- Applied in FIFO order (oldest loss first).
- Each entry's `remaining_balance` is reduced by the amount deducted.
- Entries with `remaining_balance == 0` or `tax_year > expiry_year` are skipped.
- NOLCO is NOT available under OSD (Path B) or 8% (Path C).
- After PL-05 runs, the engine returns `nolco_remaining` — an updated list of NolcoEntry with reduced balances.

---

## 4. Pipeline Step Intermediate Types

These types are produced by each pipeline step and passed to subsequent steps. They are internal to the engine and not directly exposed to the API caller (though relevant fields are included in `TaxComputationResult` for display).

### 4.1 ValidationWarning

A non-fatal issue detected during PL-01 input validation.

```
struct ValidationWarning {
  code: string       // Warning code (WARN-001 through WARN-006). See PL-01 for full list.
  message: string    // User-facing warning text (in English). Shown prominently in UI.
  severity: string   // "WARNING" (user should review) or "INFO" (informational, low priority).
}
```

**Warning codes:**

| Code | Condition | Message (exact) | Severity |
|------|-----------|-----------------|---------|
| WARN-001 | gross_receipts > ₱2,700,000 AND not VAT-registered | "Gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If you expect to exceed ₱3,000,000 this year, you must register for VAT." | WARNING |
| WARN-002 | gross_receipts > ₱3,000,000 AND not VAT-registered | "Gross receipts exceed the ₱3,000,000 VAT registration threshold. You are required to register for VAT. The 8% option is no longer available." | WARNING |
| WARN-003 | cwt_2307_entries is empty AND gross_receipts > 0 AND taxpayer NOT on 8% | "No CWT certificates (Form 2307) were entered. If you have clients who withheld tax, add their 2307 entries to reduce your balance payable." | INFO |
| WARN-004 | itemized_expenses.total_claimed / gross_receipts < 0.05 AND taxpayer_type == PURELY_SE | "Declared expenses are very low. Ensure all legitimate business expenses are included for the most accurate comparison." | INFO |
| WARN-005 | non_operating_income > 0 AND fwt_income == 0 | "Non-operating income detected. Verify whether this income was already subjected to final withholding tax (e.g., bank interest). FWT income should be entered in the FWT Income field instead." | INFO |
| WARN-006 | elected_regime == ELECT_EIGHT_PCT AND filing_period != Q1 AND filing_period != ANNUAL | "8% election can only be made on the Q1 return. If Q1 was already filed under a different regime, the 8% option is no longer available for this tax year. This computation assumes you validly elected 8% on Q1." | WARNING |

---

### 4.2 ValidatedInput

Output of PL-01. Identical structure to `TaxpayerInput`, plus the validation warnings list. All fields guaranteed to pass the 20 hard validation rules.

```
struct ValidatedInput extends TaxpayerInput {
  validation_warnings: List<ValidationWarning>   // May be empty. Soft warnings shown to user.
}
```

---

### 4.3 ClassifiedTaxpayer

Output of PL-02. Extends `ValidatedInput` with computed classification fields.

```
struct ClassifiedTaxpayer extends ValidatedInput {
  tier: TaxpayerTier                  // MICRO | SMALL | MEDIUM | LARGE (per RR 8-2024 / CR-015)
  income_type: IncomeType             // Derived from actual income field values (PURELY_SE | MIXED_INCOME | COMPENSATION_ONLY | ZERO_INCOME)
  net_gross_receipts: Decimal         // gross_receipts − sales_returns_allowances. ≥ ₱0.
  classification_flags: List<ManualReviewFlag>   // MRF flags generated during classification (e.g., MRF-028 for gross > ₱3M but not VAT-registered).
}
```

---

### 4.4 GrossAggregates

Output of PL-03. All gross income aggregates needed downstream. Every field is `Decimal ≥ ₱0`.

```
struct GrossAggregates {
  net_gross_receipts: Decimal       // gross_receipts − sales_returns_allowances. Base for 8% threshold check and PT computation.
  gross_income: Decimal             // For SERVICE_PROVIDER: = net_gross_receipts. For TRADER: = net_gross_receipts − cost_of_goods_sold. Base for OSD (Path B).
  threshold_base: Decimal           // net_gross_receipts + non_operating_income. Used to check 8% eligibility threshold (≤ ₱3M required for Path C).
  eight_pct_base: Decimal           // net_gross_receipts + non_operating_income. The ₱250,000 exemption is subtracted FROM this in PL-10 (not stored here).
  graduated_income_base: Decimal    // net_gross_receipts + non_operating_income. Starting point for NTI computation under Paths A and B before deductions.
  pt_quarterly_base: Decimal        // Gross sales (accrual basis per EOPT Act, effective Oct 27, 2024). For periods before Oct 27, 2024: gross receipts (cash basis). Used by PL-11 for Form 2551Q.
  taxpayer_class: TaxpayerClass     // SERVICE_PROVIDER | TRADER. Determines OSD base and EAR cap.
}
```

---

### 4.5 EligibilityResult

Output of PL-04. Flags which paths are legally available for this taxpayer.

```
struct EligibilityResult {
  path_a_eligible: bool                         // Always true for PURELY_SE and MIXED_INCOME. False for COMPENSATION_ONLY.
  path_b_eligible: bool                         // Always true for PURELY_SE and MIXED_INCOME. False for COMPENSATION_ONLY.
  path_c_eligible: bool                         // True only if all 8 conditions in DT-01 are met.
  path_c_ineligible_reasons: List<string>       // Non-empty if path_c_eligible == false. Each string references the ineligibility trigger code (e.g., "IN-01: VAT-registered").
  locked_regime: RegimeElection | null          // User's explicit election. null = optimizer mode.
  optimizer_mode: bool                          // true if locked_regime == null; engine will recommend best path.
  eligibility_warnings: List<ValidationWarning>  // Warnings generated during eligibility check (e.g., WARN-006 for late 8% election attempt).
}
```

---

### 4.6 ItemizedDeductionResult

Output of PL-05. Contains the computed Path A deductions and net taxable income before PT deduction.

```
struct ItemizedDeductionResult {
  total_deductions: Decimal             // Sum of all 19 deduction categories below after caps and adjustments. ≥ ₱0.
  deduction_breakdown: DeductionBreakdown  // Itemized amounts by category.
  biz_nti_before_pt: Decimal            // Business NTI before percentage tax deduction = max(0, graduated_income_base − total_deductions). PT deduction is applied in PL-08.
  nolco_remaining: List<NolcoEntry>     // Updated NOLCO schedule after deducting this year's NOLCO. Each NolcoEntry has reduced remaining_balance.
  ear_cap_applied: Decimal              // The EAR cap that was actually used (min of 1%/0.5% cap and claimed amount). For display.
  interest_arbitrage_reduction: Decimal // The 33% arbitrage reduction applied to interest expense. = 0.33 × final_taxed_interest_income. ≥ ₱0.
}
```

---

### 4.7 DeductionBreakdown

All 19 itemized deduction line items as actually allowed by the engine (after caps and disallowances).

```
struct DeductionBreakdown {
  salaries: Decimal                    // Sec. 34(A): salaries and wages paid to employees.
  employee_benefits: Decimal           // Sec. 34(A): employer's mandatory SSS/PhilHealth/Pag-IBIG contributions.
  rent: Decimal                        // Sec. 34(A): office rent.
  utilities: Decimal                   // Sec. 34(A): business utilities.
  communication: Decimal               // Sec. 34(A): phone and internet.
  office_supplies: Decimal             // Sec. 34(A): stationery, small office supplies.
  professional_fees: Decimal           // Sec. 34(A): fees paid to other professionals.
  travel_transportation: Decimal       // Sec. 34(A): local business travel.
  insurance: Decimal                   // Sec. 34(A): business insurance premiums.
  interest: Decimal                    // Sec. 34(B): interest expense after arbitrage reduction.
  taxes_licenses: Decimal              // Sec. 34(C): business taxes and licenses (not income tax, not separately-computed OPT).
  losses: Decimal                      // Sec. 34(D): casualty/theft losses not covered by insurance.
  bad_debts: Decimal                   // Sec. 34(E): written-off receivables (accrual basis only).
  depreciation: Decimal                // Sec. 34(F): annual depreciation on all DepreciationEntry items (after vehicle ceiling).
  charitable: Decimal                  // Sec. 34(H): accredited charitable donations (after 10% cap).
  research_development: Decimal        // Sec. 34(I): R&D expenses.
  entertainment_representation: Decimal  // Sec. 34(A) EAR: entertainment after cap application.
  home_office: Decimal                 // Sec. 34(A): home office expense (exclusive use only).
  nolco: Decimal                       // Sec. 34(D)(3): Net Operating Loss Carry-Over from prior years.
}
```

---

### 4.8 OsdResult

Output of PL-06.

```
struct OsdResult {
  osd_base: Decimal       // The amount the 40% OSD rate is applied to. SERVICE_PROVIDER: net_gross_receipts + non_operating_income. TRADER: gross_income + non_operating_income.
  osd_deduction: Decimal  // osd_base × 0.40. Rounded to nearest centavo.
  biz_nti_path_b: Decimal // osd_base × 0.60. The taxable business NTI for Path B.
}
```

---

### 4.9 CwtCreditResult

Output of PL-07. Contains aggregated CWT credits split by type.

```
struct CwtCreditResult {
  it_cwt_total: Decimal                        // Total income tax CWT. Sum of all WI/WC-series ATC entries + compensation_cwt + prior_year_excess_cwt. Credits against income tax due.
  pt_cwt_total: Decimal                        // Total percentage tax CWT (PT010 only). Credits against Form 2551Q Item 15. NOT against income tax.
  entries_detail: List<ClassifiedForm2307Entry>  // Each 2307 entry with its CwtClassification assigned.
  prior_year_excess_applied: Decimal           // The prior_year_excess_cwt amount from TaxpayerInput. ₱0 if none.
  compensation_cwt_applied: Decimal            // The compensation_cwt amount from TaxpayerInput. ₱0 if PURELY_SE.
  unrecognized_atc_entries: List<Form2307Entry>  // Entries with unknown ATC codes. Not credited. Each triggers MRF-021.
}
```

---

### 4.10 ClassifiedForm2307Entry

A Form 2307 entry annotated with its tax classification.

```
struct ClassifiedForm2307Entry extends Form2307Entry {
  classification: CwtClassification   // INCOME_TAX_CWT | PERCENTAGE_TAX_CWT | UNKNOWN
  ewt_rate_implied: Rate              // Inferred rate = tax_withheld / income_payment. Used for verification display.
}
```

---

### 4.11 PathAResult

Output of PL-08. Path A computation: Graduated rates + Itemized Deductions.

```
struct PathAResult {
  eligible: bool                        // false if taxpayer_type == COMPENSATION_ONLY.
  pt_deduction_applied: Decimal         // Annual PT (from PL-11) deducted from business NTI. ₱0 if VAT-registered or Path C (no PT).
  biz_nti: Decimal                      // Business NTI after itemized deductions and PT deduction. max(0, biz_nti_before_pt − pt_deduction). ≥ ₱0.
  total_nti: Decimal                    // PURELY_SE: = biz_nti. MIXED_INCOME: = taxable_compensation + biz_nti.
  income_tax_due: Decimal               // graduated_tax(total_nti) per tax year rate table. ≥ ₱0.
  deduction_method: DeductionMethod     // Always ITEMIZED.
  path_label: string                    // "Path A — Graduated + Itemized Deductions"
}
```

---

### 4.12 PathBResult

Output of PL-09. Path B computation: Graduated rates + OSD.

```
struct PathBResult {
  eligible: bool                        // false if taxpayer_type == COMPENSATION_ONLY.
  biz_nti: Decimal                      // = osd_result.biz_nti_path_b. Business NTI after OSD.
  total_nti: Decimal                    // PURELY_SE: = biz_nti. MIXED_INCOME: = taxable_compensation + biz_nti.
  income_tax_due: Decimal               // graduated_tax(total_nti). ≥ ₱0.
  osd_amount: Decimal                   // The OSD deduction applied (= osd_result.osd_deduction).
  deduction_method: DeductionMethod     // Always OSD.
  path_label: string                    // "Path B — Graduated + OSD (40%)"
}
```

---

### 4.13 PathCResult

Output of PL-10. Path C computation: 8% flat rate.

```
struct PathCResult {
  eligible: bool                        // false if any of 18 ineligibility conditions are met (DT-01).
  ineligible_reasons: List<string>      // Non-empty if eligible == false. Each string is an IN-XX code + reason.
  exempt_amount: Decimal                // ₱250,000 for PURELY_SE; ₱0 for MIXED_INCOME (per RMC 50-2018).
  taxable_base: Decimal                 // max(0, eight_pct_base − exempt_amount). The base to which 8% is applied.
  income_tax_due: Decimal               // taxable_base × 0.08. Business income portion only.
  compensation_it: Decimal              // For MIXED_INCOME: graduated_tax(taxable_compensation). For PURELY_SE: ₱0.
  total_income_tax: Decimal             // income_tax_due + compensation_it.
  pt_waived: bool                       // Always true when eligible == true. 8% is "in lieu of" Sec. 116 OPT.
  deduction_method: DeductionMethod     // Always NONE.
  path_label: string                    // "Path C — 8% Flat Rate"
}
```

---

### 4.14 PercentageTaxResult

Output of PL-11. Percentage tax obligation (Form 2551Q).

```
struct PercentageTaxResult {
  pt_applies: bool               // false for 8% filers, VAT-registered, compensation-only taxpayers.
  pt_rate: Rate                  // 0.03 for most periods; 0.01 for Jul 1, 2020 – Jun 30, 2023.
  pt_base: Decimal               // Gross sales (accrual, post-EOPT) or gross receipts (pre-EOPT). ₱0 if pt_applies == false.
  pt_due: Decimal                // pt_base × pt_rate, rounded to nearest centavo. ₱0 if pt_applies == false.
  form_2551q_required: bool      // true if pt_applies == true.
  filing_deadline: Date | null   // Specific date this 2551Q is due. null if form not required.
  reason: string                 // Human-readable explanation. E.g., "Sec. 116 OPT at 3% of gross sales" or "8% flat rate elected: percentage tax waived."
}
```

---

### 4.15 QuarterlyAggregates

Output of PL-12. Aggregated quarterly payments and CWT credits.

```
struct QuarterlyAggregates {
  q1_paid: Decimal                  // Amount paid on Q1 Form 1701Q. ₱0 if not filed.
  q2_paid: Decimal                  // Amount paid on Q2 Form 1701Q. ₱0 if not filed.
  q3_paid: Decimal                  // Amount paid on Q3 Form 1701Q. ₱0 if not filed.
  total_quarterly_it_paid: Decimal  // q1_paid + q2_paid + q3_paid.
  total_it_credits: Decimal         // total_quarterly_it_paid + cwt.it_cwt_total (includes compensation CWT and prior-year carry-over).
  pt_cwt_credits: Decimal           // cwt.pt_cwt_total. Credits against Form 2551Q (not income tax).
}
```

---

### 4.16 RegimeOption

A single regime's result in the comparison list.

```
struct RegimeOption {
  path: RegimePath                    // PATH_A | PATH_B | PATH_C
  income_tax_due: Decimal             // Income tax due under this path. ≥ ₱0.
  percentage_tax_due: Decimal         // Percentage tax due under this path. ≥ ₱0. ₱0 for PATH_C (waived).
  total_tax_burden: Decimal           // income_tax_due + percentage_tax_due. The primary comparison metric.
  label: string                       // Human-readable path name. E.g., "Graduated + Itemized Deductions"
  requires_documentation: bool        // true for PATH_A (must keep receipts). false for PATH_B and PATH_C.
  requires_oas: bool                   // Whether OSD election must be signified (always false for all paths in this context — election is a user input action, not an output flag).
  effective_rate: Rate                 // total_tax_burden / gross_receipts. For display: shows percentage of gross paid as tax.
}
```

---

### 4.17 RegimeComparisonResult

Output of PL-13.

```
struct RegimeComparisonResult {
  comparisons: List<RegimeOption>       // All eligible paths sorted by total_tax_burden ascending. Length 1–3.
  recommended_path: RegimePath          // Path with lowest total_tax_burden after tie-break (C > B > A on tie).
  locked_path: RegimePath               // Equals recommended_path if optimizer_mode == true; equals user's elected path if locked.
  using_locked_regime: bool             // true if user explicitly chose a regime (non-optimizer mode).
  savings_vs_worst: Decimal             // comparisons.last().total_tax_burden − comparisons.first().total_tax_burden. The maximum potential savings by choosing the recommended path over the worst path.
  savings_vs_next_best: Decimal         // comparisons[1].total_tax_burden − comparisons[0].total_tax_burden. Savings vs the second-best option. ₱0 if only one path is available.
}
```

---

### 4.18 BalanceResult

Output of PL-14.

```
struct BalanceResult {
  income_tax_due: Decimal               // IT due from selected/recommended path.
  total_it_credits: Decimal             // Sum of all IT credits: quarterly payments + CWT + prior-year excess.
  balance: Decimal                      // max(0, income_tax_due − total_it_credits). Amount to pay. ₱0 if overpayment.
  disposition: BalanceDisposition       // BALANCE_PAYABLE | ZERO_BALANCE | OVERPAYMENT
  overpayment: Decimal                  // max(0, total_it_credits − income_tax_due). ₱0 if balance is payable.
  installment_eligible: bool            // true if: filing_period == ANNUAL AND balance > ₱2,000.
  installment_first: Decimal            // First installment amount (= balance / 2, rounded up to centavo). ₱0 if installment_eligible == false. Due April 15.
  installment_second: Decimal           // Second installment amount (= balance − installment_first). ₱0 if installment_eligible == false. Due July 15.
}
```

---

### 4.19 FormMappingResult

Output of PL-15.

```
struct FormMappingResult {
  form_type: FormType                                          // FORM_1701 | FORM_1701A | FORM_1701Q
  form_output: Form1701Output | Form1701AOutput | Form1701QOutput  // Fully populated form struct (union type)
  pt_form_output: Form2551QOutput | null                       // Populated 2551Q struct; null if 8% or VAT-registered.
  required_attachments: List<string>                           // List of required attachments. Each string is a document name (e.g., "SAWT", "Photocopies of Form 2307", "Audited Financial Statements (if GR ≥ ₱3M)").
}
```

---

### 4.20 PenaltyStack

A breakdown of late-filing penalties for a single return (IT or PT).

```
struct PenaltyStack {
  surcharge: Decimal       // Late-filing surcharge: 10% for MICRO/SMALL; 25% for MEDIUM/LARGE. Applied once on the tax due (not cumulative). ₱0 if on-time.
  interest: Decimal        // Delinquency interest: 6% p.a. (MICRO/SMALL) or 12% p.a. (MEDIUM/LARGE) × tax due × (months_late / 12). ₱0 if on-time.
  compromise: Decimal      // Compromise penalty from lookup table (CR-020). Based on tax due bracket. ₱0 if on-time.
  total: Decimal           // tax_due + surcharge + interest + compromise. The full amount due including penalties.
}
```

---

### 4.21 PenaltyResult

Output of PL-16.

```
struct PenaltyResult {
  applies: bool                  // false if actual_filing_date is null or on-time.
  days_late: int                 // Calendar days past the filing deadline. 0 if applies == false.
  months_late: int               // ceil(days_late / 30). Used for interest computation. 0 if applies == false.
  it_penalties: PenaltyStack     // Penalty breakdown on the income tax balance.
  pt_penalties: PenaltyStack     // Penalty breakdown on the percentage tax due (if applicable).
  total_penalties: Decimal       // it_penalties.total + pt_penalties.total − (2 × tax_due component if already in stack, i.e., add only incremental penalties). Actually: it_penalties.surcharge + it_penalties.interest + it_penalties.compromise + pt_penalties.surcharge + pt_penalties.interest + pt_penalties.compromise.
}
```

**Clarification on `total_penalties`:** The `PenaltyStack.total` includes the base tax for convenience in display. But the net penalty ADDITION to the base is: `surcharge + interest + compromise` only. `total_penalties` in `PenaltyResult` = sum of surcharges + interests + compromises across both stacks (NOT double-counting base taxes).

---

## 5. Form Output Types

These types mirror the structure of BIR forms for generating pre-populated form views. Every field corresponds to a specific numbered item on the BIR form.

### 5.1 Form1701AOutput

Fully populated BIR Form 1701A (January 2018 ENCS). 2-page simplified annual ITR for purely self-employed taxpayers using OSD or 8% only. See [bir-form-1701a-field-mapping.md](../domain/bir-form-1701a-field-mapping.md) for full field-by-field source mapping.

```
struct Form1701AOutput {
  // === Header ===
  tax_year_covered: TaxYear              // Item: top of form. E.g., 2025.
  amended_return: bool                   // Item: checkbox. true if return_type == AMENDED.
  short_period_return: bool              // Item: checkbox. true for first-year registrants with partial year.
  fiscal_year_end: Date | null           // Item: fiscal year end date. null for calendar-year taxpayers (Dec 31).

  // === Part I: Background Information ===
  tin: string                            // Item 1: Taxpayer Identification Number. Format: "XXX-XXX-XXX-XXXX".
  rdo_code: string                       // Item 2: Revenue District Office code (3 digits).
  taxpayer_name_last: string             // Item 3: Last name.
  taxpayer_name_first: string            // Item 4: First name.
  taxpayer_name_middle: string           // Item 5: Middle name. Empty string if none.
  citizenship: string                    // Item 6: E.g., "Filipino".
  civil_status: string                   // Item 7: "Single" | "Married" | "Widow/Widower" | "Legally Separated"
  registered_address: string             // Item 8: Complete registered address.
  zip_code: string                       // Item 9: 4-digit Philippine postal code.
  contact_number: string                 // Item 10: Mobile or landline.
  email_address: string                  // Item 11: Email address.
  business_name: string                  // Item 12: Trade/business name. Empty string if none.
  psic_code: string                      // Item 13: Philippine Standard Industry Classification code (4–6 digits).
  method_of_deduction: string            // Item 14: "OSD" or "8% FLAT RATE" (mutually exclusive, matches active path).
  type_of_taxpayer: string               // Item 15: "Individual" (always for 1701A).
  birthday: Date                         // Item 16: Taxpayer's date of birth.
  atc_code: string                       // Item 17: Alphanumeric Tax Code. "II012" (OSD-graduated, ≤₱3M) | "II014" (OSD-graduated, >₱3M) | "II015" (8%, ≤₱3M) | "II017" (8%, >₱3M, N/A per eligibility rules but included for completeness).
  is_availing_osd: bool                  // Item 18: "YES" if OSD elected, "NO" if 8% elected.
  is_availing_8pct: bool                 // Item 19: "YES" if 8% elected, "NO" if OSD elected.

  // === Part II: Tax Payable ===
  income_tax_due: Decimal                // Item 20: Income tax due (from Part IV-A or Part IV-B, whichever applies).
  less_tax_relief: Decimal               // Item 21: Tax treaty relief. ₱0 for most taxpayers.
  income_tax_due_net_of_relief: Decimal  // Item 22: = Item 20 − Item 21.
  add_penalties_surcharge: Decimal       // Item 23: Surcharge. ₱0 if on-time.
  add_penalties_interest: Decimal        // Item 24: Interest. ₱0 if on-time.
  add_penalties_compromise: Decimal      // Item 25: Compromise penalty. ₱0 if on-time.
  total_tax_payable: Decimal             // Item 26: = Item 22 + Items 23–25.
  less_tax_credits: Decimal              // Item 27: Total credits (= Item 64 from Tax Credits section).
  net_tax_payable: Decimal               // Item 28: = max(0, Item 26 − Item 27). Amount due.
  overpayment: Decimal                   // Item 29: = max(0, Item 27 − Item 26). If > 0.
  overpayment_to_be_refunded: bool       // Item 29a: true if claiming refund.
  overpayment_to_be_issued_tcc: bool     // Item 29b: true if requesting TCC.
  overpayment_to_carry_over: bool        // Item 29c: true if carrying over to next year.

  // === Part III: Declaration ===
  // (Taxpayer and CPA signature data — populated from user profile, not computed)
  cpa_tin: string | null                 // CPA/agent TIN if filed through accredited tax agent.
  cpa_name: string | null                // CPA name.
  cpa_accreditation_number: string | null  // BIR accreditation number.

  // === Part IV-A: OSD / Graduated Path (only if method == OSD) ===
  iva_gross_sales_services: Decimal      // Item 36: Total gross sales/receipts from business.
  iva_sales_returns_allowances: Decimal  // Item 37: Sales returns and allowances.
  iva_net_sales: Decimal                 // Item 38: = Item 36 − Item 37.
  iva_cost_of_sales: Decimal             // Item 39: COGS. ₱0 for service providers.
  iva_total_gross_income: Decimal        // Item 40: = Item 38 − Item 39 + non-operating income (Items 41A–41E sum).
  iva_non_op_income_interest: Decimal    // Item 41A: Non-operating interest income.
  iva_non_op_income_rental: Decimal      // Item 41B: Rental income (not FWT-subjected).
  iva_non_op_income_royalty: Decimal     // Item 41C: Royalty income.
  iva_non_op_income_dividend: Decimal    // Item 41D: Dividend income (not FWT-subjected).
  iva_non_op_income_others: Decimal      // Item 41E: Other non-operating income.
  iva_osd_amount: Decimal                // Item 42: OSD = Item 40 × 0.40.
  iva_net_taxable_income: Decimal        // Item 43: = Item 40 × 0.60.
  iva_graduated_tax_table1: Decimal      // Item 44 (Table 1): Tax per 2018–2022 rate table. ₱0 if tax_year ≥ 2023.
  iva_graduated_tax_table2: Decimal      // Item 45 (Table 2): Tax per 2023+ rate table. ₱0 if tax_year < 2023.
  iva_income_tax_due: Decimal            // Item 46: = Item 44 (if 2018–2022) or Item 45 (if 2023+). Flows to Item 20.

  // === Part IV-B: 8% Rate Path (only if method == 8% FLAT RATE) ===
  ivb_gross_sales_services: Decimal      // Item 47: Total gross sales/receipts.
  ivb_sales_returns_allowances: Decimal  // Item 48: Sales returns/allowances.
  ivb_net_sales: Decimal                 // Item 49: = Item 47 − Item 48.
  ivb_non_op_income_interest: Decimal    // Item 50A: Non-operating interest income.
  ivb_non_op_income_rental: Decimal      // Item 50B: Rental income.
  ivb_non_op_income_royalty: Decimal     // Item 50C: Royalty income.
  ivb_non_op_income_dividend: Decimal    // Item 50D: Dividend income.
  ivb_non_op_income_others: Decimal      // Item 50E: Other non-operating income.
  ivb_total_gross: Decimal               // Item 51: = Item 49 + sum(Items 50A–50E). Total gross income including non-operating.
  ivb_less_250k: Decimal                 // Item 52: Fixed ₱250,000 for PURELY_SE. ₱0 for MIXED_INCOME. Per NIRC Sec. 24(A)(2)(b).
  ivb_taxable_income: Decimal            // Item 53: = max(0, Item 51 − Item 52).
  ivb_income_tax_due: Decimal            // Item 54: = Item 53 × 0.08. Flows to Item 20.

  // === Tax Credits Section ===
  tc_prior_year_excess: Decimal          // Item 57: Overpayment carry-over from prior year's annual ITR.
  tc_quarterly_1701q_payments: Decimal   // Item 58: Total 1701Q payments for Q1 + Q2 + Q3.
  tc_cwt_q1_q2_q3: Decimal              // Item 59: CWT from Form 2307 (Q1 through Q3 income).
  tc_cwt_q4: Decimal                     // Item 60: CWT from Form 2307 (Q4 income only).
  tc_prior_filing_payment: Decimal       // Item 61: Amount paid on prior (original) return if this is amended. ₱0 for original returns.
  tc_foreign_tax_credits: Decimal        // Item 62: Foreign tax credits. ₱0 for most taxpayers; triggers MRF-017 if > ₱0.
  tc_other_credits: Decimal              // Item 63: Other BIR-approved credits not listed above.
  tc_total_credits: Decimal              // Item 64: Sum of Items 57–63.
}
```

---

### 5.2 Form1701Output

Fully populated BIR Form 1701 (January 2018 ENCS). 4-page annual ITR for individuals with business income — used for mixed income earners, itemized deduction filers, or any taxpayer ineligible for Form 1701A. See [bir-form-1701-field-mapping.md](../domain/bir-form-1701-field-mapping.md) for full source mapping.

```
struct Form1701Output {
  // === Header ===
  tax_year_covered: TaxYear
  amended_return: bool
  short_period_return: bool

  // === Part I: Background Information ===
  // (Items 1–21A — same structure as Form 1701A Items 1–19 with additions for mixed income)
  tin: string
  rdo_code: string
  taxpayer_name_last: string
  taxpayer_name_first: string
  taxpayer_name_middle: string
  citizenship: string
  civil_status: string
  registered_address: string
  zip_code: string
  contact_number: string
  email_address: string
  business_name: string
  psic_code: string
  method_of_deduction: string          // "ITEMIZED" | "OSD"
  type_of_taxpayer: string             // "Individual"
  birthday: Date
  atc_code: string                     // II010 | II011 | II012 | II013 | II014 | II015 | II016 (see BIR form mapping doc)
  with_business_income: bool           // Item 18: always true for 1701 filers
  with_compensation_income: bool       // Item 19: true for mixed income earners

  // === Part II: Tax Payable (Items 22–32) ===
  income_tax_due: Decimal              // Item 22
  less_tax_relief: Decimal             // Item 23
  net_tax_due: Decimal                 // Item 24
  surcharge: Decimal                   // Item 25
  interest: Decimal                    // Item 26
  compromise: Decimal                  // Item 27
  total_payable: Decimal               // Item 28
  less_tax_credits_total: Decimal      // Item 29 (= Item VI-12)
  net_payable: Decimal                 // Item 30
  overpayment_amount: Decimal          // Item 31
  overpayment_refund: bool             // Item 31a
  overpayment_tcc: bool                // Item 31b
  overpayment_carry_over: bool         // Item 31c
  second_installment_amount: Decimal   // Item 32: for installment payers (due July 15)

  // === Schedule 2: Compensation Income (Items 1–4B) ===
  sched2_gross_compensation: Decimal   // Schedule 2 Item 1
  sched2_non_taxable_exclusions: Decimal  // Schedule 2 Item 2
  sched2_taxable_compensation: Decimal  // Schedule 2 Item 3

  // === Schedule 3A: Graduated Rates (Paths A or B) — Items 1–24 ===
  sched3a_gross_receipts: Decimal
  sched3a_less_returns: Decimal
  sched3a_net_receipts: Decimal
  sched3a_less_cogs: Decimal
  sched3a_gross_income_from_ops: Decimal
  sched3a_non_op_income: Decimal
  sched3a_total_gross_income: Decimal
  sched3a_deduction_method: string     // "OSD" or "ITEMIZED"
  sched3a_total_deductions: Decimal    // OSD amount OR total itemized
  sched3a_comp_nti: Decimal            // Compensation NTI from Schedule 2
  sched3a_biz_nti: Decimal             // Business NTI after deductions
  sched3a_total_nti: Decimal           // = comp_nti + biz_nti
  sched3a_tax_table1: Decimal          // 2018–2022 rate table result
  sched3a_tax_table2: Decimal          // 2023+ rate table result
  sched3a_income_tax_due: Decimal      // Applicable table result

  // === Schedule 3B: 8% Rate (Path C) — Items 25–30 ===
  sched3b_gross_receipts: Decimal
  sched3b_less_returns: Decimal
  sched3b_net_receipts: Decimal
  sched3b_non_op_income: Decimal
  sched3b_total_gross: Decimal
  sched3b_less_250k: Decimal
  sched3b_taxable_income: Decimal
  sched3b_income_tax_due: Decimal      // taxable × 0.08

  // === Schedule 4: Itemized Deductions (Lines 1–17f) ===
  sched4_compensation_deductions: Decimal  // Line 1: Compensation/salaries
  sched4_sss_gsis_philhealth: Decimal      // Line 2: Employer's contributions
  sched4_rent: Decimal                     // Line 3
  sched4_interest: Decimal                 // Line 4 (net of arbitrage reduction)
  sched4_utilities: Decimal                // Line 5
  sched4_ear: Decimal                      // Line 6 (after EAR cap)
  sched4_communication: Decimal            // Line 7
  sched4_depreciation: Decimal             // Line 8
  sched4_taxes_licenses: Decimal           // Line 9
  sched4_insurance: Decimal                // Line 10
  sched4_professional_fees: Decimal        // Line 11
  sched4_travel: Decimal                   // Line 12
  sched4_supplies: Decimal                 // Line 13
  sched4_charitable: Decimal               // Line 14
  sched4_bad_debts: Decimal                // Line 15
  sched4_research_development: Decimal     // Line 16
  sched4_others: Decimal                   // Line 17 (home office + casualty losses)
  sched4_total_ordinary_deductions: Decimal  // Line 17f: Sum

  // === Schedule 5: Special Deductions (Lines 1–5) ===
  sched5_pension_trust: Decimal        // Line 1
  sched5_premium_health_hospitalization: Decimal  // Line 2 (individuals only, max ₱2,400/year)
  sched5_nolco: Decimal                // Line 3 (from Schedule 6)
  sched5_fringe_benefits: Decimal      // Line 4
  sched5_total: Decimal                // Line 5

  // === Schedule 6: NOLCO ===
  sched6_entries: List<NolcoScheduleRow>  // One row per NOLCO year entry

  // === Part V: Tax Due (Items V-1 to V-5) ===
  v1_tax_on_comp: Decimal              // Compensation IT (for Path C mixed income)
  v2_tax_from_sched3a_or_3b: Decimal   // Business IT from active schedule
  v3_less_special_deductions: Decimal  // ₱0 for most taxpayers (BMBE would be non-zero)
  v4_total_tax: Decimal                // = V1 + V2 − V3
  v5_income_tax_due: Decimal           // = V4 (identical to Item 22)

  // === Part VI: Tax Credits (Items VI-1 to VI-12) ===
  vi1_prior_year_excess: Decimal
  vi2_q1_payment: Decimal
  vi3_q2_payment: Decimal
  vi4_q3_payment: Decimal
  vi5_cwt_q1_q2_q3: Decimal
  vi6_cwt_q4: Decimal
  vi7_comp_cwt: Decimal               // Tax withheld on compensation (Form 2316)
  vi8_prior_amended_payment: Decimal
  vi9_foreign_tax_credit: Decimal
  vi10_other_credits: Decimal
  vi11_total_credits: Decimal         // Sum VI-1 to VI-10
  vi12_net_tax_payable: Decimal       // max(0, V5 − VI-11)
}
```

---

### 5.3 Form1701QOutput

Fully populated BIR Form 1701Q (Quarterly ITR). See CR-042/CR-043/CR-044 for computation logic.

```
struct Form1701QOutput {
  // === Header ===
  tax_year: TaxYear
  quarter: Quarter          // 1, 2, or 3
  return_period_from: Date
  return_period_to: Date
  amended_return: bool

  // === Part I: Background ===
  tin: string
  rdo_code: string
  taxpayer_name: string
  business_name: string

  // === Schedule I: Graduated Method (OSD or Itemized) ===
  si_gross_receipts: Decimal                   // Item 36: CUMULATIVE gross receipts Q1–this quarter.
  si_less_returns: Decimal                     // Item 37: Returns and allowances.
  si_net_receipts: Decimal                     // Item 38
  si_less_cogs: Decimal                        // Item 39
  si_gross_income: Decimal                     // Item 40
  si_non_op_income: Decimal                    // Item 41
  si_total_gross_income: Decimal               // Item 42: = 40 + 41
  si_deductions: Decimal                       // Item 43: OSD amount or itemized total (cumulative)
  si_prior_qtr_nti: Decimal                    // Item 44: NTI from prior quarterly return (for Q2/Q3 carryforward)
  si_total_nti: Decimal                        // Item 45: = max(0, Item 42 − Item 43) + Item 44
  si_income_tax_due_table1: Decimal            // Item 46 (2018–2022)
  si_income_tax_due_table2: Decimal            // Item 47 (2023+)
  si_income_tax_due: Decimal                   // Item 48: applicable table

  // === Schedule II: 8% Flat Rate Method ===
  sii_current_qtr_gross: Decimal               // Item 49: CURRENT quarter gross only.
  sii_returns_allowances: Decimal              // Item 50
  sii_net_current: Decimal                     // Item 51
  sii_prior_qtr_cumulative_8pct: Decimal       // Item 52: Cumulative gross from Item 55 of prior 1701Q.
  sii_total_cumulative_gross: Decimal          // Item 53: = 51 + 52
  sii_less_250k: Decimal                       // Item 54: ₱250,000 (PURELY_SE) or ₱0 (MIXED_INCOME). Applied once at Q1; included at every subsequent quarter.
  sii_taxable_cumulative: Decimal              // Item 55: = max(0, 53 − 54). Carries forward as Item 52 next quarter.
  sii_tax_due_8pct: Decimal                    // Item 56: = Item 55 × 0.08

  // === Schedule III: Tax Credits ===
  siii_cwt_current_quarter: Decimal            // Item 57: CWT from 2307s for THIS quarter.
  siii_prior_qtr_cwt_already_claimed: Decimal  // Item 58: CWT already claimed on prior quarterly returns. Prevents double-counting.
  siii_net_cwt_this_qtr: Decimal               // Item 59: = 57 − 58 (additional CWT credit this quarter only)
  siii_prior_qtr_1701q_payments: Decimal       // Item 60: Total 1701Q payments paid in prior quarters this year.
  siii_prior_year_excess: Decimal              // Item 61: Prior year carry-over credit (claimed on Q1 only; ₱0 for Q2/Q3).
  siii_total_credits: Decimal                  // Item 62: = 59 + 60 + 61
  siii_net_payable: Decimal                    // Item 63: = max(0, Schedule I or II tax due − 62). The amount to pay.

  // === Schedule IV: Penalties ===
  siv_surcharge: Decimal
  siv_interest: Decimal
  siv_compromise: Decimal
  siv_total_penalties: Decimal                  // Item 68: sum
}
```

---

### 5.4 Form2551QOutput

Fully populated BIR Form 2551Q (Quarterly Percentage Tax Return). Generated by PL-11 when PT applies. See CR-034 for computation logic.

```
struct Form2551QOutput {
  // === Header ===
  tax_year: TaxYear
  quarter: Quarter          // 1, 2, 3, or 4 (2551Q IS filed for Q4 unlike 1701Q)
  return_period_from: Date
  return_period_to: Date
  amended_return: bool
  nil_return: bool          // true if pt_due == ₱0 for this quarter.

  // === Part I: Background ===
  tin: string
  rdo_code: string
  taxpayer_name: string
  business_name: string

  // === Part II: Tax Payable ===
  atc_code: string                          // Item 1: PT010 (standard) or other PT ATC per Schedule 1.
  gross_taxable_sales_receipts: Decimal     // Item 2: pt_base for this quarter.
  percentage_tax_rate: Rate                 // Item 3: 0.03 (or 0.01 for Jul 2020 – Jun 2023 returns).
  percentage_tax_due: Decimal               // Item 4: Item 2 × Item 3.
  less_pt_cwt_credits: Decimal              // Item 5: PT CWT from government agencies (PT010 on Form 2307).
  net_pt_payable: Decimal                   // Item 6: = max(0, Item 4 − Item 5).
  add_surcharge: Decimal                    // Item 7
  add_interest: Decimal                     // Item 8
  add_compromise: Decimal                   // Item 9
  total_amount_payable: Decimal             // Item 10: = 6 + 7 + 8 + 9

  // === Schedule 1 ===
  schedule1_rows: List<PT2551QScheduleRow>  // Detailed breakdown by ATC. Usually 1 row (PT010).
}
```

---

### 5.5 PT2551QScheduleRow

One row in the 2551Q Schedule 1.

```
struct PT2551QScheduleRow {
  atc_code: string          // PT010 for standard percentage tax.
  tax_base: Decimal         // Gross taxable sales/receipts for this ATC.
  rate: Rate                // Tax rate.
  tax_due: Decimal          // tax_base × rate.
  description: string       // E.g., "Percentage tax on gross sales — non-VAT registered"
}
```

---

### 5.6 NolcoScheduleRow

One row in Form 1701 Schedule 6 (NOLCO tracking).

```
struct NolcoScheduleRow {
  col_a_year_incurred: TaxYear        // Year the loss was incurred.
  col_b_original_loss: Decimal        // Original net operating loss amount.
  col_c_applied_prior_years: Decimal  // Total deducted in prior tax years.
  col_d_balance_beginning: Decimal    // original_loss − applied_prior_years.
  col_e_applied_current_year: Decimal // Amount deducted this tax year.
  col_f_balance_end: Decimal          // col_d − col_e. Remaining carry-over.
  expiry_year: TaxYear                // = year_incurred + 3.
  expired: bool                       // true if tax_year > expiry_year (no longer deductible).
}
```

---

## 6. Final Output Type

### 6.1 TaxComputationResult

The complete output of the engine's `compute_tax()` function. This is what the API returns to the frontend.

```
struct TaxComputationResult {
  // === Input Summary ===
  input_summary: InputSummary          // Key inputs echoed back for display.

  // === Regime Comparison (all eligible paths) ===
  comparison: List<RegimeOption>       // All eligible paths sorted by total_tax_burden.
  recommended_regime: RegimePath       // Best path (or locked path if user elected one).
  using_locked_regime: bool            // true if user explicitly locked a regime.
  savings_vs_worst: Decimal            // Maximum potential savings from optimal choice.
  savings_vs_next_best: Decimal        // Savings vs second-best option.

  // === Selected Regime Details ===
  selected_path: RegimePath            // The path the balance is computed on.
  selected_income_tax_due: Decimal     // IT due under selected path.
  selected_percentage_tax_due: Decimal  // PT due (₱0 for Path C).
  selected_total_tax: Decimal          // IT + PT under selected path.

  // === Deduction Details (for display) ===
  path_a_details: PathAResult | null   // Full Path A result. null if path_a_eligible == false.
  path_b_details: PathBResult | null   // Full Path B result. null if path_b_eligible == false.
  path_c_details: PathCResult | null   // Full Path C result. null if path_c_eligible == false.

  // === Gross Aggregates (for display) ===
  gross_aggregates: GrossAggregates    // All computed gross figures (threshold_base, graduated_income_base, etc.)

  // === Credits ===
  total_it_credits: Decimal            // Sum of all IT credits.
  cwt_credits: Decimal                 // CWT from 2307 entries (WI/WC series).
  quarterly_payments: Decimal          // Sum of 1701Q payments for Q1+Q2+Q3.
  prior_year_excess: Decimal           // Prior year carry-over credit applied.
  compensation_cwt: Decimal            // Tax withheld on compensation.

  // === Balance ===
  balance: Decimal                     // Amount payable (₱0 if overpayment).
  disposition: BalanceDisposition      // BALANCE_PAYABLE | ZERO_BALANCE | OVERPAYMENT
  overpayment: Decimal                 // Refundable amount (₱0 if balance payable).
  installment_eligible: bool
  installment_first_due: Decimal       // Due April 15.
  installment_second_due: Decimal      // Due July 15.

  // === Percentage Tax ===
  pt_result: PercentageTaxResult       // Full PT computation result.

  // === Form Output ===
  form_type: FormType                  // Which form to generate.
  form_output: Form1701Output | Form1701AOutput | Form1701QOutput  // Populated form struct.
  pt_form_output: Form2551QOutput | null  // Populated 2551Q. null if PT not applicable.
  required_attachments: List<string>   // Documents the taxpayer must attach.

  // === Penalties ===
  penalties: PenaltyResult | null      // null if on-time filing (actual_filing_date is null).

  // === Manual Review Flags ===
  manual_review_flags: List<ManualReviewFlag>  // Items requiring human judgment. See manual-review-flags.md.

  // === Warnings ===
  warnings: List<ValidationWarning>    // All soft warnings generated across all pipeline steps.

  // === Metadata ===
  engine_version: string               // Engine version string. E.g., "1.0.0".
  computed_at: Date                    // Timestamp of computation (for audit logs).
}
```

---

### 6.2 InputSummary

Key inputs echoed in the result for display and audit purposes.

```
struct InputSummary {
  tax_year: TaxYear
  filing_period: FilingPeriod
  taxpayer_type: TaxpayerType
  taxpayer_tier: TaxpayerTier
  gross_receipts: Decimal              // net_gross_receipts (after returns/allowances)
  is_vat_registered: bool
  income_type: IncomeType
}
```

---

## 7. Supporting / Helper Types

### 7.1 ManualReviewFlag

An item that the engine cannot definitively resolve and must flag for human judgment. See [domain/manual-review-flags.md](../domain/manual-review-flags.md) for the full list of MRF codes.

```
struct ManualReviewFlag {
  code: string          // MRF code (e.g., "MRF-010"). See manual-review-flags.md.
  title: string         // Short title (e.g., "Home Office Documentation").
  message: string       // Full description of what requires review. User-facing.
  field_affected: string  // Which input field triggered this flag (e.g., "home_office_expense").
  engine_action: string   // What the engine did in lieu of manual judgment (e.g., "Set to ₱0. Add manually if you can document exclusive use.").
}
```

---

### 7.2 FilingDeadlineInfo

Used internally to compute deadline and penalty contexts.

```
struct FilingDeadlineInfo {
  period: FilingPeriod
  form: FormType
  deadline: Date              // Adjusted for holidays and weekends per CR-041 holiday rule.
  next_banking_day: Date      // The actual deadline if the base date falls on weekend/holiday.
}
```

---

### 7.3 PenaltyComputation (internal helper)

Used by PL-16 to pass penalty parameters to `compute_penalty_stack()`.

```
struct PenaltyComputation {
  tax_due: Decimal
  filing_deadline: Date
  actual_filing_date: Date
  tier: TaxpayerTier
  is_nil_return: bool         // true if tax_due == ₱0. Nil returns have different penalty rules: compromise-only.
  offense_count: int          // 1, 2, 3, or 4+ for nil return repeated offenses.
}
```

---

## 8. Type Cross-Reference Table

This table maps every type to the pipeline step(s) that produce or consume it.

| Type | Produced By | Consumed By | In Final Output |
|------|------------|------------|----------------|
| `TaxpayerInput` | API caller | PL-01 | Echo via InputSummary |
| `ItemizedExpenseInput` | (part of TaxpayerInput) | PL-05 | No (breakdown is in PathAResult/DeductionBreakdown) |
| `Form2307Entry` | (part of TaxpayerInput) | PL-07 | Yes (via CwtCreditResult.entries_detail) |
| `QuarterlyPayment` | (part of TaxpayerInput) | PL-12 | Yes (via QuarterlyAggregates) |
| `DepreciationEntry` | (part of ItemizedExpenseInput) | PL-05 | Yes (via DeductionBreakdown.depreciation) |
| `NolcoEntry` | (part of ItemizedExpenseInput) | PL-05 | Yes (via ItemizedDeductionResult.nolco_remaining) |
| `ValidatedInput` | PL-01 | PL-02, PL-05, PL-07, PL-12 | No |
| `ValidationWarning` | PL-01, PL-04 | PL-17 | Yes (via TaxComputationResult.warnings) |
| `ClassifiedTaxpayer` | PL-02 | PL-03, PL-04, PL-08, PL-09, PL-10, PL-11, PL-14, PL-15, PL-16 | Yes (via InputSummary) |
| `GrossAggregates` | PL-03 | PL-04, PL-05, PL-06, PL-08, PL-09, PL-10, PL-11 | Yes (via TaxComputationResult.gross_aggregates) |
| `EligibilityResult` | PL-04 | PL-08, PL-09, PL-10, PL-13 | Partially (via path_c_details.ineligible_reasons) |
| `ItemizedDeductionResult` | PL-05 | PL-08 | Yes (via path_a_details) |
| `DeductionBreakdown` | PL-05 | PL-08 | Yes (via path_a_details.deduction_breakdown) |
| `OsdResult` | PL-06 | PL-09 | Yes (via path_b_details.osd_amount) |
| `CwtCreditResult` | PL-07 | PL-12 | Yes (via cwt_credits, compensation_cwt) |
| `ClassifiedForm2307Entry` | PL-07 | PL-12 | Yes (via CwtCreditResult.entries_detail) |
| `PathAResult` | PL-08 | PL-13 | Yes (via path_a_details) |
| `PathBResult` | PL-09 | PL-13 | Yes (via path_b_details) |
| `PathCResult` | PL-10 | PL-11, PL-13 | Yes (via path_c_details) |
| `PercentageTaxResult` | PL-11 | PL-08 (pt_deduction), PL-13, PL-14, PL-15, PL-16 | Yes (via pt_result) |
| `QuarterlyAggregates` | PL-12 | PL-14 | Yes (via quarterly_payments, pt_cwt_credits) |
| `RegimeOption` | PL-13 | PL-14, PL-17 | Yes (via comparison) |
| `RegimeComparisonResult` | PL-13 | PL-14, PL-15 | Yes (via comparison, recommended_regime) |
| `BalanceResult` | PL-14 | PL-15, PL-16, PL-17 | Yes (via balance, disposition, installment_*) |
| `FormMappingResult` | PL-15 | PL-17 | Yes (via form_type, form_output, pt_form_output) |
| `PenaltyStack` | PL-16 | PL-16 (aggregation), PL-17 | Yes (via penalties) |
| `PenaltyResult` | PL-16 | PL-17 | Yes (via penalties) |
| `TaxComputationResult` | PL-17 | API response | This IS the final output |
| `Form1701Output` | PL-15 | PL-17 | Yes (via form_output) |
| `Form1701AOutput` | PL-15 | PL-17 | Yes (via form_output) |
| `Form1701QOutput` | PL-15 | PL-17 | Yes (via form_output) |
| `Form2551QOutput` | PL-15 | PL-17 | Yes (via pt_form_output) |
| `ManualReviewFlag` | PL-02, PL-05, PL-07, PL-10 | PL-17 | Yes (via manual_review_flags) |

---

## Design Notes

1. **No floating-point arithmetic.** All `Decimal` fields must use arbitrary-precision decimal types (e.g., Python's `decimal.Decimal`, Java's `BigDecimal`, JavaScript's `decimal.js`). Using IEEE-754 float will introduce centavo-level rounding errors that invalidate test vectors.

2. **Immutability.** All intermediate structs are immutable. Each pipeline step returns a new struct; it does not modify the input.

3. **Null handling.** `null` is only permitted for explicitly nullable fields (e.g., `elected_regime: RegimeElection | null`, `actual_filing_date: Date | null`). All other fields must have a value; use ₱0.00 for optional monetary fields that are inapplicable.

4. **Decimal constraints.** All Decimal fields representing monetary amounts must satisfy `value >= 0` unless the field is a balance result computed as `income_tax_due − credits` (where a negative intermediate means overpayment, resolved by the BalanceDisposition enum).

5. **Form output is display-only.** The form output structs (`Form1701Output`, etc.) are for generating the pre-populated form view. They are not stored as authoritative data. The authoritative computation is in `PathAResult`, `PathBResult`, `PathCResult`, `BalanceResult`, and `PercentageTaxResult`.

6. **Engine version.** The `engine_version` field in `TaxComputationResult` allows the database to record which engine produced a given result. This is critical when tax rules change and historical computations need to be recomputed.
