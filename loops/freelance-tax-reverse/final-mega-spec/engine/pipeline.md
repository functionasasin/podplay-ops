# Computation Engine Pipeline — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-01
**Cross-references:**
- All computation rules: [domain/computation-rules.md](../domain/computation-rules.md)
- All decision trees: [domain/decision-trees.md](../domain/decision-trees.md)
- Data model: [engine/data-model.md](data-model.md)
- Error states: [engine/error-states.md](error-states.md)
- Invariants: [engine/invariants.md](invariants.md)

---

## Overview

The engine takes a `TaxpayerInput` struct and returns a `TaxComputationResult` struct. All computation is purely deterministic — no external calls, no randomness, no AI inference. The engine is a pure function: same inputs always produce same outputs.

The pipeline has **16 sequential steps**, each independently testable. Each step receives typed inputs, performs a bounded computation, and returns typed outputs. No step has side effects. Steps are numbered PL-01 through PL-16.

**Top-level entry function:**
```
function compute_tax(input: TaxpayerInput) -> TaxComputationResult:
  step01 = validate_inputs(input)                    # PL-01
  step02 = classify_taxpayer(step01)                 # PL-02
  step03 = aggregate_gross_receipts(step02)          # PL-03
  step04 = check_eligibility(step03)                 # PL-04
  step05 = compute_itemized_deductions(step04)       # PL-05
  step06 = compute_osd(step05)                       # PL-06
  step07 = compute_cwt_credits(step06)               # PL-07
  step08 = compute_path_a(step07)                    # PL-08
  step09 = compute_path_b(step08)                    # PL-09
  step10 = compute_path_c(step09)                    # PL-10
  step11 = compute_percentage_tax(step10)            # PL-11
  step12 = aggregate_quarterly_payments(step11)      # PL-12
  step13 = compare_regimes(step12)                   # PL-13
  step14 = compute_balance(step13)                   # PL-14
  step15 = select_form_and_map_fields(step14)        # PL-15
  step16 = compute_penalties(step15)                 # PL-16
  return assemble_result(step16)                     # PL-17
```

---

## PL-01: Input Validation

**Purpose:** Reject structurally invalid or logically inconsistent inputs before any computation begins.

**Inputs:**
```
input: TaxpayerInput {
  // Identity
  taxpayer_type: TaxpayerType           # PURELY_SE | MIXED_INCOME | COMPENSATION_ONLY
  tax_year: int                          # 2018..2030
  filing_period: FilingPeriod            # ANNUAL | Q1 | Q2 | Q3
  is_mixed_income: bool                  # true = has both compensation + business income

  // Registration Status
  is_vat_registered: bool
  is_bmbe_registered: bool
  taxpayer_tier: TaxpayerTier            # MICRO | SMALL | MEDIUM | LARGE (optional; computed in PL-02 if omitted)
  subject_to_sec_117_128: bool           # subject to industry-specific % taxes (not Sec. 116)
  is_gpp_partner: bool                   # computing on GPP distributive share

  // Business Income
  gross_receipts: Decimal                # ₱0..₱999,999,999 — total business gross receipts for period
  sales_returns_allowances: Decimal      # ₱0..gross_receipts — reduces gross for threshold + 8% base
  non_operating_income: Decimal          # ₱0..₱999,999,999 — interest, rent, dividends not FWT-subjected
  fwt_income: Decimal                    # ₱0..₱999,999,999 — income already subjected to final withholding tax (excluded from IT base)
  cost_of_goods_sold: Decimal            # ₱0..₱999,999,999 — for traders only; ₱0 for pure service providers

  // Compensation Income (mixed income only)
  taxable_compensation: Decimal          # ₱0..₱999,999,999 — compensation after non-taxable deductions
  compensation_cwt: Decimal             # ₱0..₱999,999,999 — tax withheld from compensation (Form 2316)

  // Expenses (Path A only)
  itemized_expenses: ItemizedExpenseInput  # detailed breakdown; see PL-05

  // Regime election (can be null = engine recommends)
  elected_regime: RegimeElection | null    # null = optimizer mode; non-null = locked mode
  osd_elected: bool | null                 # null = let engine recommend; true/false = user explicitly elected

  // Prior-period data
  prior_quarterly_payments: List<QuarterlyPayment>  # Form 1701Q amounts paid in prior quarters
  cwt_2307_entries: List<Form2307Entry>              # all CWT certificates for the period
  prior_year_excess_cwt: Decimal                    # carry-over from prior annual return

  // Penalty computation inputs (optional)
  actual_filing_date: Date | null          # null = assume on-time filing
  return_type: ReturnType                  # ORIGINAL | AMENDED
  prior_payment_for_return: Decimal        # if amended: amount already paid on original return
}
```

**Validation rules applied:**

| Code | Check | Error if violated |
|------|-------|------------------|
| VAL-001 | `tax_year` is in range 2018..2030 | ERR_INVALID_TAX_YEAR |
| VAL-002 | `gross_receipts` >= 0 | ERR_NEGATIVE_GROSS |
| VAL-003 | `sales_returns_allowances` <= `gross_receipts` | ERR_RETURNS_EXCEED_GROSS |
| VAL-004 | `cost_of_goods_sold` >= 0 | ERR_NEGATIVE_COGS |
| VAL-005 | `taxable_compensation` >= 0 | ERR_NEGATIVE_COMPENSATION |
| VAL-006 | `prior_year_excess_cwt` >= 0 | ERR_NEGATIVE_EXCESS_CWT |
| VAL-007 | If `taxpayer_type == COMPENSATION_ONLY` then `gross_receipts == 0` | ERR_COMP_ONLY_WITH_GROSS |
| VAL-008 | If `taxpayer_type == PURELY_SE` then `taxable_compensation == 0` | ERR_SE_WITH_COMPENSATION |
| VAL-009 | If `is_mixed_income` then `taxpayer_type == MIXED_INCOME` | ERR_INCONSISTENT_MIXED_FLAG |
| VAL-010 | Each `Form2307Entry.income_payment` >= 0 | ERR_NEGATIVE_2307_PAYMENT |
| VAL-011 | Each `Form2307Entry.tax_withheld` >= 0 | ERR_NEGATIVE_2307_WITHHELD |
| VAL-012 | Each `Form2307Entry.tax_withheld` <= `Form2307Entry.income_payment` | ERR_2307_WITHHELD_EXCEEDS_PAYMENT |
| VAL-013 | Each `QuarterlyPayment.amount_paid` >= 0 | ERR_NEGATIVE_QUARTERLY_PAYMENT |
| VAL-014 | `non_operating_income` >= 0 | ERR_NEGATIVE_NON_OP_INCOME |
| VAL-015 | `fwt_income` >= 0 | ERR_NEGATIVE_FWT_INCOME |
| VAL-016 | `filing_period` is valid given `tax_year` (no future periods) | ERR_FUTURE_FILING_PERIOD |
| VAL-017 | If `filing_period == ANNUAL` and `prior_quarterly_payments` has >3 entries: error | ERR_TOO_MANY_QUARTERLY_PAYMENTS |
| VAL-018 | `prior_payment_for_return` >= 0 | ERR_NEGATIVE_PRIOR_PAYMENT |
| VAL-019 | `itemized_expenses.total_claimed` >= 0 (each sub-component >= 0) | ERR_NEGATIVE_EXPENSE_ITEM |
| VAL-020 | `compensation_cwt` >= 0 | ERR_NEGATIVE_COMP_CWT |

**Outputs:** `ValidatedInput` — same shape as `TaxpayerInput` but guaranteed to pass all validations. Carries a `validation_warnings: List<ValidationWarning>` for soft warnings (not errors).

**Soft warnings generated (not errors, shown to user):**
| Code | Condition | Warning message |
|------|-----------|----------------|
| WARN-001 | `gross_receipts` > ₱2,700,000 and `is_vat_registered == false` | "Gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If you expect to exceed ₱3,000,000 this year, you must register for VAT." |
| WARN-002 | `gross_receipts` > ₱3,000,000 and `is_vat_registered == false` | "Gross receipts exceed the ₱3,000,000 VAT registration threshold. You are required to register for VAT. The 8% option is no longer available." |
| WARN-003 | All `cwt_2307_entries` are empty but `gross_receipts` > 0 and taxpayer is not on 8% | "No CWT certificates (Form 2307) were entered. If you have clients who withheld tax, add their 2307 entries to reduce your balance payable." |
| WARN-004 | `itemized_expenses.total_claimed` / `gross_receipts` < 0.05 and `taxpayer_type == PURELY_SE` | "Declared expenses are very low. Ensure all legitimate business expenses are included for the most accurate comparison." |
| WARN-005 | `non_operating_income` > 0 and `fwt_income` == 0 | "Non-operating income detected. Verify whether this income was already subjected to final withholding tax (e.g., bank interest). FWT income should be entered in the FWT Income field instead." |

**Legal basis:** General validation logic; VAL-001 through VAL-020 are engine rules, not statutory.

---

## PL-02: Taxpayer Classification

**Purpose:** Determine taxpayer tier (MICRO/SMALL/MEDIUM/LARGE) and validate/confirm registration-based flags.

**Inputs:** `ValidatedInput` from PL-01

**Computation:**

```
function classify_taxpayer(input: ValidatedInput) -> ClassifiedTaxpayer:
  # Step 1: Compute net gross receipts for classification
  net_gross = input.gross_receipts - input.sales_returns_allowances

  # Step 2: Determine EOPT taxpayer tier (RR 8-2024)
  # Per CR-015: tier is based on annual gross sales of the TAXABLE YEAR
  # For quarterly filings, annualize if partial year (use actual period gross; do not project)
  tier = classify_tier(net_gross)

  # Step 3: Validate VAT registration consistency
  if net_gross > 3_000_000 and not input.is_vat_registered:
    add_flag(MRF_FLAG, "MRF-028: Gross > ₱3M but not VAT-registered. VAT registration required per NIRC Sec. 236(G).")

  # Step 4: Confirm income type
  income_type = determine_income_type(input)

  return ClassifiedTaxpayer {
    ...input,
    tier: tier,
    income_type: income_type,
    net_gross_receipts: net_gross,
  }

function classify_tier(net_gross: Decimal) -> TaxpayerTier:
  # Per CR-015, RR 8-2024: tier boundaries for individuals
  if net_gross < 3_000_000:          # strict less-than
    return MICRO
  elif net_gross < 20_000_000:       # ₱3M to ₱19,999,999.99
    return SMALL
  elif net_gross < 1_000_000_000:    # ₱20M to ₱999,999,999.99
    return MEDIUM
  else:
    return LARGE

function determine_income_type(input: ValidatedInput) -> IncomeType:
  has_business = input.gross_receipts > 0 or input.non_operating_income > 0
  has_comp = input.taxable_compensation > 0

  if has_business and has_comp:
    return MIXED_INCOME
  elif has_business and not has_comp:
    return PURELY_SE
  elif not has_business and has_comp:
    return COMPENSATION_ONLY
  else:
    return ZERO_INCOME  # all inputs are zero; valid but generates warning
```

**Outputs:** `ClassifiedTaxpayer` (extends `ValidatedInput`) with fields:
- `tier: TaxpayerTier`
- `income_type: IncomeType`
- `net_gross_receipts: Decimal` — gross_receipts minus sales_returns_allowances

**Legal basis:** CR-015; RR 8-2024; NIRC Sec. 236(G) for VAT threshold.

---

## PL-03: Gross Receipts Aggregation

**Purpose:** Compute all gross receipt aggregates used downstream by eligibility checks, path computations, and percentage tax.

**Inputs:** `ClassifiedTaxpayer` from PL-02

**Computation:**

```
function aggregate_gross_receipts(ct: ClassifiedTaxpayer) -> GrossAggregates:
  # Net gross receipts: base for 8% threshold check and 8% tax base
  net_gross = ct.gross_receipts - ct.sales_returns_allowances

  # Gross income for service providers (OSD base = gross receipts; no COGS)
  # Gross income for traders (OSD base = gross receipts - COGS per Sec. 34L)
  if ct.cost_of_goods_sold > 0:
    gross_income = net_gross - ct.cost_of_goods_sold
    taxpayer_class = TRADER
  else:
    gross_income = net_gross
    taxpayer_class = SERVICE_PROVIDER

  # Total income base for 8% threshold test (per CR-025)
  # = net gross receipts + non-operating income (NOT including FWT income)
  threshold_base = net_gross + ct.non_operating_income

  # 8% computation base (identical to threshold_base for this purpose)
  eight_pct_base = net_gross + ct.non_operating_income

  # Graduated income base (Paths A and B) = gross receipts + non-operating income
  # (FWT income excluded because it has already been taxed via final withholding)
  graduated_income_base = net_gross + ct.non_operating_income

  # PT (Form 2551Q) base for 2026+: gross SALES per EOPT Act
  # For service providers = gross receipts (no cost distinction for PT)
  # PT base excludes VAT (if VAT-registered), but CT has already verified VAT status
  pt_quarterly_base = ct.gross_receipts - ct.sales_returns_allowances
  # Note: if VAT-registered, engine does not compute PT (mutually exclusive per CR-031)

  return GrossAggregates {
    net_gross_receipts: net_gross,
    gross_income: gross_income,
    threshold_base: threshold_base,
    eight_pct_base: eight_pct_base,
    graduated_income_base: graduated_income_base,
    pt_quarterly_base: pt_quarterly_base,
    taxpayer_class: taxpayer_class,
  }
```

**Outputs:** `GrossAggregates` struct with named aggregates, all `Decimal >= 0`.

**Legal basis:** CR-025 (net gross receipts); CR-026.1 (OSD base for traders vs. service); CR-032 (PT base shift under EOPT); Sec. 34(L); Sec. 116.

---

## PL-04: Regime Eligibility Check

**Purpose:** Determine which of the three paths (A, B, C) are legally available to this taxpayer, and flag any ineligibility reasons.

**Inputs:** `ClassifiedTaxpayer` + `GrossAggregates` from prior steps

**Computation:**

```
function check_eligibility(ct: ClassifiedTaxpayer, ga: GrossAggregates) -> EligibilityResult:
  # Path C (8%) eligibility — per DT-01 and CR-028
  path_c_eligible = true
  path_c_ineligible_reasons = []

  if ct.taxpayer_type == COMPENSATION_ONLY:
    path_c_eligible = false
    path_c_ineligible_reasons.append("INV-RC-01: No self-employment income")

  if ct.is_vat_registered:
    path_c_eligible = false
    path_c_ineligible_reasons.append("IN-01: VAT-registered taxpayer; RR 8-2018 Sec. 2(A)")

  if ga.threshold_base > 3_000_000:
    path_c_eligible = false
    path_c_ineligible_reasons.append("IN-02: Gross receipts exceed ₱3,000,000 threshold; NIRC Sec. 24(A)(2)(b)")

  if ct.is_bmbe_registered:
    path_c_eligible = false
    path_c_ineligible_reasons.append("IN-03: BMBE-registered; exempt from income tax")

  if ct.is_gpp_partner:
    path_c_eligible = false
    path_c_ineligible_reasons.append("IN-04: GPP partner computing on distributive share; RMC 50-2018")

  if ct.subject_to_sec_117_128:
    path_c_eligible = false
    path_c_ineligible_reasons.append("IN-05: Subject to Sec. 117-128 percentage taxes; RR 8-2018")

  # Path A eligibility — always available for self-employed taxpayers
  # (VAT-registered may use itemized deductions)
  path_a_eligible = ct.taxpayer_type != COMPENSATION_ONLY

  # Path B eligibility — OSD, available for all SE and mixed income
  path_b_eligible = ct.taxpayer_type != COMPENSATION_ONLY

  # Regime election lock: if user explicitly elected a regime, lock it
  locked_regime = ct.elected_regime  # null means optimizer mode

  # 8% election timing check: can only elect on Q1 return
  if locked_regime == EIGHT_PCT and ct.filing_period != Q1 and ct.filing_period != ANNUAL:
    # Election window has passed; check if Q1 was already filed with 8%
    # Engine cannot verify this from inputs alone; must trust user input
    # Add soft warning (not hard error) — per CR-023
    add_warning("WARN-006: 8% election can only be made on the Q1 return. If Q1 was already filed under a different regime, the 8% option is no longer available for this tax year. This computation assumes you validly elected 8% on Q1.")

  return EligibilityResult {
    path_a_eligible: path_a_eligible,
    path_b_eligible: path_b_eligible,
    path_c_eligible: path_c_eligible,
    path_c_ineligible_reasons: path_c_ineligible_reasons,
    locked_regime: locked_regime,
    optimizer_mode: locked_regime == null,
  }
```

**Outputs:** `EligibilityResult`
- `path_a_eligible: bool`
- `path_b_eligible: bool`
- `path_c_eligible: bool`
- `path_c_ineligible_reasons: List<string>` — non-empty if `path_c_eligible == false`
- `locked_regime: RegimeElection | null`
- `optimizer_mode: bool` — true if engine should recommend best path

**Legal basis:** DT-01; CR-028; RR 8-2018; NIRC Sec. 24(A)(2)(b).

---

## PL-05: Itemized Deductions Computation (Path A)

**Purpose:** Compute the total allowable itemized deductions and net taxable income for Path A.

**Inputs:** `ValidatedInput.itemized_expenses: ItemizedExpenseInput` + `GrossAggregates`

**Computation:**

```
function compute_itemized_deductions(input: ValidatedInput, ga: GrossAggregates) -> ItemizedDeductionResult:
  exp = input.itemized_expenses

  # Salaries and wages — no cap if withholding is satisfied
  # Note: EOPT Act removed withholding prerequisite (effective Jan 1, 2024 per RMC 60-2024)
  # For tax_year < 2024: flag if withholding not substantiated (MRF-009 not applicable post-EOPT)
  deduct_salaries = max(0, exp.salaries_and_wages)

  # SSS/PhilHealth/Pag-IBIG for employees — deductible for employer's share only
  deduct_employee_benefits = max(0, exp.sss_philhealth_pagibig_employer_share)

  # Rent — straightforward, no cap
  deduct_rent = max(0, exp.rent)

  # Utilities
  deduct_utilities = max(0, exp.utilities)

  # Interest expense — with 33% arbitrage reduction per Sec. 34(B)
  # Per CR-027.3: deductible_interest = gross_interest - (0.33 × final_taxed_interest_income)
  final_taxed_interest = exp.final_taxed_interest_income  # interest on deposits subject to FWT
  deduct_interest = max(0, exp.interest_expense - (0.33 * final_taxed_interest))

  # Depreciation — per CR-027.5; cannot exceed original cost / useful_life
  # For vehicles: cost ceiling ₱2,400,000 per RR 12-2012
  deduct_depreciation = compute_depreciation(exp.depreciation_entries)

  # Professional fees paid to others (not self)
  deduct_professional_fees = max(0, exp.professional_fees_paid)

  # Representation and entertainment — cap per EAR rule (CR-027.6)
  # Service businesses: 1% of net revenue; Trading: 0.5% of net sales
  if ga.taxpayer_class == SERVICE_PROVIDER:
    ear_cap = ga.graduated_income_base * 0.01
  else:
    ear_cap = ga.net_gross_receipts * 0.005
  deduct_ear = min(exp.entertainment_representation, ear_cap)

  # Transportation and travel — for Philippine-based trips; foreign requires documentation
  deduct_travel = max(0, exp.travel_transportation)

  # Communication (phone, internet)
  deduct_communication = max(0, exp.communication)

  # Insurance premiums (not life insurance on key person unless beneficiary is estate)
  deduct_insurance = max(0, exp.insurance_premiums)

  # Office supplies
  deduct_supplies = max(0, exp.office_supplies)

  # Home office (exclusive use only — per CR-027.8)
  if exp.home_office_exclusive_use:
    deduct_home_office = max(0, exp.home_office_expense)
  else:
    deduct_home_office = 0
    # Soft flag for user: home office must be used exclusively for business

  # Taxes and licenses (not income taxes; VAT, local business tax, professional tax, etc.)
  # Note: 3% percentage tax is separately computed and deducted per CR-032 (one-pass approach)
  deduct_taxes_licenses = max(0, exp.taxes_and_licenses)

  # Charitable contributions — Sec. 34(H)
  # To accredited NGOs/institutions: up to 10% of taxable income BEFORE this deduction
  # To non-accredited: no deduction
  income_before_charitable = ga.graduated_income_base - (
    deduct_salaries + deduct_employee_benefits + deduct_rent + deduct_utilities +
    deduct_interest + deduct_depreciation + deduct_professional_fees +
    deduct_ear + deduct_travel + deduct_communication + deduct_insurance +
    deduct_supplies + deduct_home_office + deduct_taxes_licenses
  )
  charitable_cap = max(0, income_before_charitable) * 0.10
  if exp.charitable_accredited:
    deduct_charitable = min(exp.charitable_contributions, charitable_cap)
  else:
    deduct_charitable = 0

  # Bad debts — only if income was previously reported (accrual basis taxpayers)
  # Cash-basis taxpayers cannot deduct bad debts per CR-027.10
  if exp.is_accrual_basis:
    deduct_bad_debts = max(0, exp.bad_debts)
  else:
    deduct_bad_debts = 0

  # Research and development — must be directly connected to business
  deduct_rd = max(0, exp.research_development)

  # NOLCO — Net Operating Loss Carry-Over (3-year limit, FIFO)
  # Available only to Path A; NOT available to OSD or 8% users
  # Per CR-027.11: track by year of loss; oldest loss applied first
  deduct_nolco = compute_nolco_deduction(exp.nolco_entries, input.tax_year)

  # Total itemized deductions
  total_deductions = (
    deduct_salaries + deduct_employee_benefits + deduct_rent + deduct_utilities +
    deduct_interest + deduct_depreciation + deduct_professional_fees +
    deduct_ear + deduct_travel + deduct_communication + deduct_insurance +
    deduct_supplies + deduct_home_office + deduct_taxes_licenses +
    deduct_charitable + deduct_bad_debts + deduct_rd + deduct_nolco
  )

  # Net taxable income for Path A (business income only)
  # NOTE: for Paths A/B, percentage tax is deductible; PT computed separately in PL-11
  # PT deduction is handled in PL-08 (one-pass approach: PT does not depend on NTI)
  biz_nti_path_a = max(0, ga.graduated_income_base - total_deductions)

  return ItemizedDeductionResult {
    total_deductions: total_deductions,
    deduction_breakdown: {
      salaries: deduct_salaries,
      employee_benefits: deduct_employee_benefits,
      rent: deduct_rent,
      utilities: deduct_utilities,
      interest: deduct_interest,
      depreciation: deduct_depreciation,
      professional_fees: deduct_professional_fees,
      entertainment_representation: deduct_ear,
      ear_cap_applied: ear_cap,
      travel_transportation: deduct_travel,
      communication: deduct_communication,
      insurance: deduct_insurance,
      supplies: deduct_supplies,
      home_office: deduct_home_office,
      taxes_licenses: deduct_taxes_licenses,
      charitable: deduct_charitable,
      bad_debts: deduct_bad_debts,
      research_development: deduct_rd,
      nolco: deduct_nolco,
    },
    biz_nti_before_pt: biz_nti_path_a,  # PT deduction applied in PL-08
    nolco_remaining: updated_nolco_schedule,  # NOLCO schedule after this year's deduction
  }
```

**Outputs:** `ItemizedDeductionResult`
- `total_deductions: Decimal`
- `deduction_breakdown: DeductionBreakdown` — all 19 line items
- `biz_nti_before_pt: Decimal` — gross income minus deductions (PT not yet deducted; applied in PL-08)
- `nolco_remaining: List<NolcoEntry>` — remaining NOLCO after this year's usage

**Legal basis:** CR-027; NIRC Sec. 34(A)-(K); lookup-tables/itemized-deductions.md.

---

## PL-06: OSD Computation (Path B)

**Purpose:** Compute the OSD deduction and net taxable income for Path B.

**Inputs:** `GrossAggregates`

**Computation:**

```
function compute_osd(ga: GrossAggregates) -> OsdResult:
  # OSD rate: always 40% per NIRC Sec. 34(L)
  OSD_RATE = 0.40

  # OSD base: differs by taxpayer class (CR-026)
  # Service providers: 40% × gross receipts (net of returns)
  # Traders: 40% × gross income (= gross sales - COGS)
  if ga.taxpayer_class == SERVICE_PROVIDER:
    osd_base = ga.net_gross_receipts + ga.non_operating_income
    # Note: non-operating income is INCLUDED in OSD base for service providers
    # (not COGS-based, so no separate treatment needed)
  else:
    # Trader: OSD base = gross income (net_gross - COGS), then add non-operating income
    osd_base = ga.gross_income + ga.non_operating_income

  osd_deduction = osd_base * OSD_RATE
  biz_nti_path_b = max(0, osd_base - osd_deduction)
  # Simplification: biz_nti_path_b = osd_base * 0.60 (same as above)

  # Note: OSD replaces ALL deductions (A)-(K) — no mixing with itemized
  # Note: NOLCO is NOT available to OSD users
  # Note: PT (3%) is deductible under Path A but NOT separately listed under OSD
  #       because OSD is a blanket 40% deduction — it implicitly covers all business costs

  return OsdResult {
    osd_base: osd_base,
    osd_deduction: osd_deduction,
    biz_nti_path_b: biz_nti_path_b,
  }
```

**Outputs:** `OsdResult`
- `osd_base: Decimal` — the 40% is applied to this
- `osd_deduction: Decimal` — osd_base × 0.40
- `biz_nti_path_b: Decimal` — osd_base × 0.60

**Legal basis:** CR-026; NIRC Sec. 34(L); lookup-tables/osd-breakeven-table.md.

---

## PL-07: CWT Credits Aggregation

**Purpose:** Parse all Form 2307 entries, classify by ATC, sum income tax CWT and percentage tax CWT separately.

**Inputs:** `ValidatedInput.cwt_2307_entries`, `ValidatedInput.prior_year_excess_cwt`, `ValidatedInput.compensation_cwt`

**Computation:**

```
function compute_cwt_credits(input: ValidatedInput) -> CwtCreditResult:
  it_cwt_total = 0          # Income tax CWT (WI/WC series ATCs)
  pt_cwt_total = 0          # PT CWT (PT010 ATC only — goes to 2551Q, NOT income tax)
  entries_detail = []

  for entry in input.cwt_2307_entries:
    classification = classify_2307_entry(entry.atc_code)
    if classification == INCOME_TAX_CWT:
      it_cwt_total += entry.tax_withheld
      entries_detail.append({ ...entry, type: INCOME_TAX_CWT })
    elif classification == PERCENTAGE_TAX_CWT:
      pt_cwt_total += entry.tax_withheld
      entries_detail.append({ ...entry, type: PERCENTAGE_TAX_CWT })
    else:
      # Unknown ATC — flag for manual review
      add_flag(MRF_FLAG, "MRF-021: Unrecognized ATC code " + entry.atc_code + ". Tax withheld ₱" + entry.tax_withheld + " not credited until ATC is confirmed.")

  # Add compensation CWT (from Form 2316, already income tax)
  it_cwt_total += input.compensation_cwt

  # Add prior year excess CWT carry-over
  it_cwt_total += input.prior_year_excess_cwt

  # Quarterly CWT: Q1/Q2/Q3 cumulative (for annual filing, all quarters included above)
  # For quarterly filings: only CWT from forms issued for this quarter's income
  # (Prior-quarter CWT already credited on prior 1701Q returns — do not double-count)

  return CwtCreditResult {
    it_cwt_total: it_cwt_total,
    pt_cwt_total: pt_cwt_total,
    entries_detail: entries_detail,
    prior_year_excess_applied: input.prior_year_excess_cwt,
    compensation_cwt_applied: input.compensation_cwt,
  }
```

**Classification logic for ATC codes:**
- ATC starts with `WI` or `WC` → INCOME_TAX_CWT (see cwt-ewt-rates.md for full table)
- ATC `PT010` → PERCENTAGE_TAX_CWT (credits Form 2551Q, not income tax)
- ATC `WI760` or `WC760` (RR 16-2023 e-marketplace) → INCOME_TAX_CWT (1% on ½ gross)
- Any other ATC → flag MRF-021

**Outputs:** `CwtCreditResult`
- `it_cwt_total: Decimal` — total income tax CWT (credits against IT due)
- `pt_cwt_total: Decimal` — total PT CWT (credits against 2551Q, NOT IT)
- `entries_detail: List<ClassifiedForm2307Entry>`
- `prior_year_excess_applied: Decimal`
- `compensation_cwt_applied: Decimal`

**Legal basis:** CR-035 through CR-040; lookup-tables/cwt-ewt-rates.md; Sec. 57(B) (credit even if payor failed to remit); RR 16-2023.

---

## PL-08: Path A Tax Computation

**Purpose:** Compute income tax due under Path A (Graduated + Itemized Deductions).

**Inputs:** `ClassifiedTaxpayer`, `GrossAggregates`, `ItemizedDeductionResult`, annual PT from PL-11 (dependency resolved via two-pass if PURELY_SE with PT deduction)

**Computation:**

```
function compute_path_a(ct: ClassifiedTaxpayer, ga: GrossAggregates, idr: ItemizedDeductionResult, pt_annual: Decimal) -> PathAResult:
  if not eligibility.path_a_eligible:
    return PathAResult { eligible: false }

  # For PURELY_SE taxpayers: PT (3%) is deductible under Sec. 34(C)(1)
  # PT base = gross sales (fixed, does not depend on NTI), so no circular dependency
  # One-pass: subtract annual PT deduction from NTI
  if ct.taxpayer_type == PURELY_SE and not ct.is_vat_registered:
    pt_deduction = pt_annual  # computed in PL-11 using gross sales only
  else:
    pt_deduction = 0  # VAT-registered: no OPT; 8% users: no OPT

  biz_nti = max(0, idr.biz_nti_before_pt - pt_deduction)

  # For mixed income: combine compensation NTI + business NTI per CR-029
  if ct.income_type == MIXED_INCOME:
    total_nti = ct.taxable_compensation + biz_nti
  else:
    total_nti = biz_nti

  # Apply graduated rate table based on tax year
  it_on_nti = apply_graduated_rate(total_nti, ct.tax_year)

  # For mixed income: no ₱250K deduction in Path A (not applicable — NTI uses full graduated rates)

  return PathAResult {
    eligible: true,
    pt_deduction_applied: pt_deduction,
    biz_nti: biz_nti,
    total_nti: total_nti,
    income_tax_due: it_on_nti,
    deduction_method: ITEMIZED,
    path_label: "Path A — Graduated + Itemized Deductions",
  }
```

**Helper: graduated rate dispatcher**
```
function apply_graduated_rate(nti: Decimal, tax_year: int) -> Decimal:
  if tax_year >= 2023:
    return graduated_tax_2023(nti)  # CR-002
  else:
    return graduated_tax_2018(nti)  # CR-003
```

**Outputs:** `PathAResult`
- `eligible: bool`
- `pt_deduction_applied: Decimal`
- `biz_nti: Decimal`
- `total_nti: Decimal`
- `income_tax_due: Decimal`
- `deduction_method: DeductionMethod = ITEMIZED`

**Legal basis:** CR-004; CR-027; CR-029; NIRC Sec. 24(A)(2)(a); Sec. 34(A)-(K).

---

## PL-09: Path B Tax Computation

**Purpose:** Compute income tax due under Path B (Graduated + OSD).

**Inputs:** `ClassifiedTaxpayer`, `OsdResult`, annual PT from PL-11

**Computation:**

```
function compute_path_b(ct: ClassifiedTaxpayer, osr: OsdResult, pt_annual: Decimal) -> PathBResult:
  if not eligibility.path_b_eligible:
    return PathBResult { eligible: false }

  # OSD is a 40% blanket deduction — PT is implicitly covered within OSD
  # OSD does NOT allow separate PT deduction (OSD replaces all itemized deductions)
  # Engine does NOT add PT deduction on top of OSD
  biz_nti = osr.biz_nti_path_b

  # For mixed income: combine compensation NTI + business NTI per CR-029
  if ct.income_type == MIXED_INCOME:
    total_nti = ct.taxable_compensation + biz_nti
  else:
    total_nti = biz_nti

  it_on_nti = apply_graduated_rate(total_nti, ct.tax_year)

  return PathBResult {
    eligible: true,
    biz_nti: biz_nti,
    total_nti: total_nti,
    income_tax_due: it_on_nti,
    osd_amount: osr.osd_deduction,
    deduction_method: OSD,
    path_label: "Path B — Graduated + OSD (40%)",
  }
```

**Outputs:** `PathBResult`
- `eligible: bool`
- `biz_nti: Decimal`
- `total_nti: Decimal`
- `income_tax_due: Decimal`
- `osd_amount: Decimal`
- `deduction_method: DeductionMethod = OSD`

**Legal basis:** CR-005; CR-026; NIRC Sec. 34(L).

---

## PL-10: Path C Tax Computation

**Purpose:** Compute income tax due under Path C (8% Flat Rate). Only executed if `path_c_eligible == true`.

**Inputs:** `ClassifiedTaxpayer`, `GrossAggregates`, `EligibilityResult`

**Computation:**

```
function compute_path_c(ct: ClassifiedTaxpayer, ga: GrossAggregates, er: EligibilityResult) -> PathCResult:
  if not er.path_c_eligible:
    return PathCResult {
      eligible: false,
      ineligible_reasons: er.path_c_ineligible_reasons,
    }

  EIGHT_PCT_RATE = 0.08
  EIGHT_PCT_EXEMPTION = 250_000  # ₱250,000 per NIRC Sec. 24(A)(2)(b)

  # ₱250K exemption: only for PURELY_SE (not mixed income per RMC 50-2018)
  if ct.income_type == PURELY_SE:
    exempt_amount = EIGHT_PCT_EXEMPTION
  else:
    # Mixed income: NO ₱250K deduction
    exempt_amount = 0

  # 8% taxable base = net gross receipts + non-operating income - exempt amount
  taxable_base = max(0, ga.eight_pct_base - exempt_amount)
  income_tax_due = taxable_base * EIGHT_PCT_RATE

  # Rounding: round to nearest centavo
  income_tax_due = round(income_tax_due, 2)

  # For mixed income: graduated IT on compensation is SEPARATE, computed with Path A/B
  # Path C only covers the business income portion at 8%
  if ct.income_type == MIXED_INCOME:
    comp_it = apply_graduated_rate(ct.taxable_compensation, ct.tax_year)
    total_tax = income_tax_due + comp_it
  else:
    comp_it = 0
    total_tax = income_tax_due

  # Path C waives the obligation to file Form 2551Q (percentage tax)
  # Engine records this so PL-11 can skip PT computation for Path C users
  pt_waived = true

  return PathCResult {
    eligible: true,
    exempt_amount: exempt_amount,
    taxable_base: taxable_base,
    income_tax_due: income_tax_due,
    compensation_it: comp_it,
    total_income_tax: total_tax,
    pt_waived: pt_waived,
    deduction_method: NONE,
    path_label: "Path C — 8% Flat Rate",
    ineligible_reasons: [],
  }
```

**Outputs:** `PathCResult`
- `eligible: bool`
- `exempt_amount: Decimal` — ₱250,000 or ₱0 depending on income type
- `taxable_base: Decimal`
- `income_tax_due: Decimal` — business income portion only
- `compensation_it: Decimal` — graduated IT on comp (mixed income only)
- `total_income_tax: Decimal` — business IT + comp IT
- `pt_waived: bool` — always `true` if eligible
- `ineligible_reasons: List<string>`

**Legal basis:** CR-006; NIRC Sec. 24(A)(2)(b); RMC 50-2018; eight-percent-option-rules.md.

---

## PL-11: Percentage Tax Computation

**Purpose:** Compute the 3% percentage tax obligation under Form 2551Q (for non-8%, non-VAT taxpayers). Returns ₱0 for Path C and VAT-registered taxpayers.

**Inputs:** `ClassifiedTaxpayer`, `GrossAggregates`, `PathCResult`, `FilingPeriod`

**Computation:**

```
function compute_percentage_tax(ct: ClassifiedTaxpayer, ga: GrossAggregates, pcr: PathCResult, period: FilingPeriod) -> PercentageTaxResult:
  # Path C elected: PT is waived
  if pcr.eligible and pcr.pt_waived:
    return PercentageTaxResult {
      pt_applies: false,
      pt_due: 0,
      form_2551q_required: false,
      reason: "8% flat rate elected: percentage tax waived in lieu thereof",
    }

  # VAT-registered: PT does not apply (VAT replaces PT)
  if ct.is_vat_registered:
    return PercentageTaxResult {
      pt_applies: false,
      pt_due: 0,
      form_2551q_required: false,
      reason: "VAT-registered taxpayer: percentage tax does not apply",
    }

  # No self-employment income: PT does not apply
  if ct.income_type == COMPENSATION_ONLY:
    return PercentageTaxResult {
      pt_applies: false,
      pt_due: 0,
      form_2551q_required: false,
      reason: "Compensation-only taxpayer: percentage tax does not apply",
    }

  # Determine applicable PT rate per period
  PT_RATE = get_pt_rate(period.end_date)
  # Per lookup-tables/percentage-tax-rates.md:
  #   Before Jul 1, 2020: 3%
  #   Jul 1, 2020 – Jun 30, 2023: 1% (CREATE Act RA 11534)
  #   Jul 1, 2023 onwards: 3%

  # PT base: gross SALES (EOPT Act, effective Oct 27, 2024)
  # Pre-EOPT (before Oct 27, 2024): gross RECEIPTS
  if period.end_date >= date(2024, 10, 27):
    pt_base = ga.pt_quarterly_base  # gross sales (already computed in PL-03)
  else:
    pt_base = ga.net_gross_receipts  # gross receipts (cash basis)

  pt_due = round(pt_base * PT_RATE, 2)

  # Annual PT = sum of four quarterly PT amounts
  # For annual computation: use full-year gross sales
  # For quarterly: use that quarter's gross only

  return PercentageTaxResult {
    pt_applies: true,
    pt_rate: PT_RATE,
    pt_base: pt_base,
    pt_due: pt_due,
    form_2551q_required: true,
    filing_deadline: get_2551q_deadline(period),
    reason: "Sec. 116 OPT at " + (PT_RATE * 100) + "% of gross sales",
  }
```

**Outputs:** `PercentageTaxResult`
- `pt_applies: bool`
- `pt_rate: Decimal` — 0.03 or 0.01 depending on period
- `pt_base: Decimal`
- `pt_due: Decimal`
- `form_2551q_required: bool`
- `filing_deadline: Date | null`
- `reason: string`

**Legal basis:** CR-031; CR-032; CR-034; NIRC Sec. 116; RA 11534; RA 11976 (EOPT); percentage-tax-rates.md.

---

## PL-12: Quarterly Payments Aggregation

**Purpose:** Aggregate prior quarterly income tax payments and CWT credits for use in balance computation.

**Inputs:** `ValidatedInput.prior_quarterly_payments`, `CwtCreditResult`

**Computation:**

```
function aggregate_quarterly_payments(input: ValidatedInput, cwt: CwtCreditResult) -> QuarterlyAggregates:
  # Sum up Form 1701Q amounts actually PAID (not just computed) in Q1, Q2, Q3
  total_quarterly_it_paid = 0
  q1_paid = 0
  q2_paid = 0
  q3_paid = 0

  for payment in input.prior_quarterly_payments:
    if payment.quarter == Q1:
      q1_paid = payment.amount_paid
    elif payment.quarter == Q2:
      q2_paid = payment.amount_paid
    elif payment.quarter == Q3:
      q3_paid = payment.amount_paid
    # Q4 is not filed as 1701Q; included in annual 1701/1701A

  total_quarterly_it_paid = q1_paid + q2_paid + q3_paid

  # Total IT credits = quarterly 1701Q payments + CWT credits
  total_it_credits = total_quarterly_it_paid + cwt.it_cwt_total

  return QuarterlyAggregates {
    q1_paid: q1_paid,
    q2_paid: q2_paid,
    q3_paid: q3_paid,
    total_quarterly_it_paid: total_quarterly_it_paid,
    total_it_credits: total_it_credits,
    # Note: PT credits (cwt.pt_cwt_total) are for 2551Q, not IT; stored separately
    pt_cwt_credits: cwt.pt_cwt_total,
  }
```

**Outputs:** `QuarterlyAggregates`
- `q1_paid`, `q2_paid`, `q3_paid`: each `Decimal`
- `total_quarterly_it_paid: Decimal`
- `total_it_credits: Decimal`
- `pt_cwt_credits: Decimal`

**Legal basis:** CR-041 through CR-048; Sec. 74-77 (quarterly filing); Sec. 57(B) (CWT credit).

---

## PL-13: Regime Comparison and Recommendation

**Purpose:** Compare all eligible paths on total tax burden (IT + PT), select the lowest, and produce a ranked comparison for the UI.

**Inputs:** `PathAResult`, `PathBResult`, `PathCResult`, `PercentageTaxResult`, `EligibilityResult`

**Computation:**

```
function compare_regimes(pa: PathAResult, pb: PathBResult, pc: PathCResult, ptr: PercentageTaxResult) -> RegimeComparisonResult:
  comparisons = []

  # Path A: total burden = income_tax + PT (PT is deductible but still a cash outflow)
  if pa.eligible:
    path_a_total_tax = pa.income_tax_due + (ptr.pt_applies ? ptr.pt_due : 0)
    comparisons.append(RegimeOption {
      path: PATH_A,
      income_tax_due: pa.income_tax_due,
      percentage_tax_due: ptr.pt_applies ? ptr.pt_due : 0,
      total_tax_burden: path_a_total_tax,
      label: "Graduated + Itemized Deductions",
      requires_documentation: true,
      requires_oas: false,
    })

  # Path B: total burden = income_tax + PT
  if pb.eligible:
    path_b_total_tax = pb.income_tax_due + (ptr.pt_applies ? ptr.pt_due : 0)
    comparisons.append(RegimeOption {
      path: PATH_B,
      income_tax_due: pb.income_tax_due,
      percentage_tax_due: ptr.pt_applies ? ptr.pt_due : 0,
      total_tax_burden: path_b_total_tax,
      label: "Graduated + OSD (40%)",
      requires_documentation: false,
      requires_oas: false,
    })

  # Path C: total burden = IT only (PT waived in lieu of 8%)
  if pc.eligible:
    comparisons.append(RegimeOption {
      path: PATH_C,
      income_tax_due: pc.total_income_tax,
      percentage_tax_due: 0,  # waived
      total_tax_burden: pc.total_income_tax,
      label: "8% Flat Rate",
      requires_documentation: false,
      requires_oas: false,
    })

  # Sort by total_tax_burden ascending
  comparisons.sort(key: (x) -> x.total_tax_burden)

  # Tie-breaking: if two paths have equal total_tax_burden, prefer C > B > A
  # (Simpler returns preferred; C > B > A in simplicity order)
  # Per INV-RC-01 in regime-comparison-logic.md
  for i in range(1, len(comparisons)):
    if comparisons[i].total_tax_burden == comparisons[0].total_tax_burden:
      if path_preference(comparisons[i].path) > path_preference(comparisons[0].path):
        comparisons[0], comparisons[i] = comparisons[i], comparisons[0]

  recommended = comparisons[0]
  savings_vs_worst = comparisons[-1].total_tax_burden - comparisons[0].total_tax_burden

  # If optimizer mode and locked_regime is set: override recommendation with locked
  final_regime = locked_regime != null ? get_path(locked_regime) : recommended

  return RegimeComparisonResult {
    comparisons: comparisons,
    recommended_path: recommended.path,
    locked_path: final_regime.path,
    using_locked_regime: locked_regime != null,
    savings_vs_worst: savings_vs_worst,
    savings_vs_next_best: (len(comparisons) >= 2) ? comparisons[1].total_tax_burden - comparisons[0].total_tax_burden : 0,
  }
```

**Path preference for tie-breaking:**
```
function path_preference(path: RegimePath) -> int:
  if path == PATH_C: return 3
  if path == PATH_B: return 2
  if path == PATH_A: return 1
  return 0
```

**Outputs:** `RegimeComparisonResult`
- `comparisons: List<RegimeOption>` — all eligible paths sorted by total burden
- `recommended_path: RegimePath`
- `locked_path: RegimePath` — same as recommended if no lock
- `using_locked_regime: bool`
- `savings_vs_worst: Decimal`
- `savings_vs_next_best: Decimal`

**Legal basis:** CR-028; DT-07; DT-16; regime-comparison-logic.md.

---

## PL-14: Balance Computation

**Purpose:** Compute the final income tax balance payable or refundable for the filing period.

**Inputs:** `RegimeComparisonResult`, `QuarterlyAggregates`, `ClassifiedTaxpayer`

**Computation:**

```
function compute_balance(rcr: RegimeComparisonResult, qa: QuarterlyAggregates, ct: ClassifiedTaxpayer) -> BalanceResult:
  selected = get_selected_path_result(rcr)
  it_due = selected.income_tax_due

  # Balance = IT due - all credits
  it_credits = qa.total_it_credits
  balance = it_due - it_credits

  # Determine disposition
  if balance > 0:
    disposition = BALANCE_PAYABLE
    # Check installment eligibility: annual returns only, balance > ₱2,000
    if ct.filing_period == ANNUAL and balance > 2_000:
      installment_first = round(balance / 2, 2)
      installment_second = balance - installment_first
      installment_eligible = true
    else:
      installment_first = balance
      installment_second = 0
      installment_eligible = false
    overpayment = 0
  elif balance == 0:
    disposition = ZERO_BALANCE
    overpayment = 0
    installment_first = 0
    installment_second = 0
    installment_eligible = false
  else:  # balance < 0
    disposition = OVERPAYMENT
    overpayment = abs(balance)
    balance = 0  # form shows ₱0 as balance payable when overpayment
    installment_first = 0
    installment_second = 0
    installment_eligible = false

  return BalanceResult {
    income_tax_due: it_due,
    total_it_credits: it_credits,
    balance: balance,
    disposition: disposition,
    overpayment: overpayment,
    installment_eligible: installment_eligible,
    installment_first: installment_first,    # due April 15
    installment_second: installment_second,  # due July 15
  }
```

**Installment deadline table:**
| Installment | Due Date | Legal Basis |
|-------------|----------|------------|
| First installment | April 15 of filing year | NIRC Sec. 56(B); RR 8-2018 Sec. 2(C) |
| Second installment | July 15 of filing year | NIRC Sec. 56(B); RR 8-2018 Sec. 2(C) |

**Outputs:** `BalanceResult`
- `income_tax_due: Decimal`
- `total_it_credits: Decimal`
- `balance: Decimal` — amount to pay (0 if overpayment)
- `disposition: BalanceDisposition` — BALANCE_PAYABLE | ZERO_BALANCE | OVERPAYMENT
- `overpayment: Decimal` — 0 if no overpayment
- `installment_eligible: bool`
- `installment_first: Decimal`
- `installment_second: Decimal`

**Legal basis:** CR-053; CR-054; Sec. 56(B); annual-reconciliation edge cases EC-AR01 through EC-AR14.

---

## PL-15: Form Selection and Field Mapping

**Purpose:** Determine which BIR form to generate (1701 vs. 1701A vs. 1701Q) and populate all form fields from engine computation results.

**Inputs:** All prior step results

**Computation:**

```
function select_form_and_map_fields(all_results) -> FormMappingResult:
  # Form selection per DT-04
  if all_results.ct.filing_period != ANNUAL:
    form_type = FORM_1701Q
  elif all_results.ct.income_type == MIXED_INCOME:
    form_type = FORM_1701  # always 1701 for mixed income
  elif all_results.rcr.locked_path == PATH_A:
    form_type = FORM_1701  # itemized requires 1701
  elif all_results.rcr.locked_path == PATH_B or all_results.rcr.locked_path == PATH_C:
    form_type = FORM_1701A  # OSD or 8% can use simplified 1701A

  # Populate form fields based on form type
  if form_type == FORM_1701A:
    form_output = populate_form_1701a(all_results)
  elif form_type == FORM_1701:
    form_output = populate_form_1701(all_results)
  else:
    form_output = populate_form_1701q(all_results)

  # PT form selection
  if all_results.ptr.form_2551q_required:
    pt_form_output = populate_form_2551q(all_results)
  else:
    pt_form_output = null

  return FormMappingResult {
    form_type: form_type,
    form_output: form_output,
    pt_form_output: pt_form_output,
  }
```

**Form population helpers** (per domain/bir-form-1701-field-mapping.md and domain/bir-form-1701a-field-mapping.md):
- `populate_form_1701a()` — maps engine results to Form 1701A items 1–65 + Part IV-A or IV-B
- `populate_form_1701()` — maps engine results to Form 1701 items across all pages and schedules
- `populate_form_1701q()` — maps engine results to Form 1701Q Schedules I/II/III/IV

**Outputs:** `FormMappingResult`
- `form_type: FormType` — FORM_1701 | FORM_1701A | FORM_1701Q
- `form_output: Form1701Output | Form1701AOutput | Form1701QOutput` — fully populated form struct
- `pt_form_output: Form2551QOutput | null`

**Legal basis:** DT-04; bir-form-1701-field-mapping.md; bir-form-1701a-field-mapping.md; Sec. 74-77.

---

## PL-16: Penalty Computation (Optional)

**Purpose:** Compute penalties if `actual_filing_date` is provided and is past the deadline. Returns zero penalties if filing is on time or `actual_filing_date` is null.

**Inputs:** `ClassifiedTaxpayer`, `BalanceResult`, `PercentageTaxResult`, `ValidatedInput.actual_filing_date`, filing period deadline from lookup table

**Computation:**

```
function compute_penalties(ct: ClassifiedTaxpayer, br: BalanceResult, ptr: PercentageTaxResult, input: ValidatedInput) -> PenaltyResult:
  if input.actual_filing_date == null:
    return PenaltyResult { applies: false, total_penalties: 0 }

  # Get filing deadline for this period and form
  deadline = get_filing_deadline(ct.filing_period, ct.tax_year, form_type)

  if input.actual_filing_date <= deadline:
    return PenaltyResult { applies: false, total_penalties: 0 }

  # Late filing: compute penalty stack
  days_late = (input.actual_filing_date - deadline).days
  months_late = ceil(days_late / 30)  # interest accrues monthly

  # IT penalties (on balance payable)
  if br.balance > 0:
    it_penalties = compute_penalty_stack(br.balance, months_late, ct.tier)
  else:
    # NIL return or zero-balance: compromise penalty only (no surcharge/interest)
    it_penalties = compute_nil_return_penalty(return_number)

  # PT penalties (on PT balance payable)
  if ptr.pt_applies and ptr.pt_due > 0:
    pt_penalties = compute_penalty_stack(ptr.pt_due, months_late, ct.tier)
  else:
    pt_penalties = PenaltyStack { surcharge: 0, interest: 0, compromise: 0, total: 0 }

  return PenaltyResult {
    applies: true,
    days_late: days_late,
    it_penalties: it_penalties,
    pt_penalties: pt_penalties,
    total_penalties: it_penalties.total + pt_penalties.total,
  }
```

**Penalty stack computation per CR-020:**
```
function compute_penalty_stack(tax_due: Decimal, months_late: int, tier: TaxpayerTier) -> PenaltyStack:
  # Surcharge: 25% (standard) or 10% (MICRO/SMALL per EOPT)
  if tier == MICRO or tier == SMALL:
    surcharge_rate = 0.10
    interest_rate = 0.06  # per annum = 0.005 per month
  else:
    surcharge_rate = 0.25
    interest_rate = 0.12  # per annum = 0.01 per month

  surcharge = tax_due * surcharge_rate
  interest = tax_due * (interest_rate / 12) * months_late
  compromise = get_compromise_penalty(tax_due, tier)  # lookup table from bir-penalty-schedule.md
  total = tax_due + surcharge + interest + compromise

  return PenaltyStack {
    surcharge: surcharge,
    interest: interest,
    compromise: compromise,
    total: total,
  }
```

**Outputs:** `PenaltyResult`
- `applies: bool`
- `days_late: int`
- `it_penalties: PenaltyStack`
- `pt_penalties: PenaltyStack`
- `total_penalties: Decimal`

**Legal basis:** CR-020; CR-021; lookup-tables/bir-penalty-schedule.md; RA 11976 (EOPT) penalty reductions.

---

## PL-17: Result Assembly

**Purpose:** Assemble all step results into a single `TaxComputationResult` struct.

**Inputs:** All prior step results

**Computation:**

```
function assemble_result(steps) -> TaxComputationResult:
  return TaxComputationResult {
    # Input summary
    input_summary: InputSummary {
      tax_year: steps.ct.tax_year,
      filing_period: steps.ct.filing_period,
      taxpayer_type: steps.ct.taxpayer_type,
      taxpayer_tier: steps.ct.tier,
      gross_receipts: steps.ga.net_gross_receipts,
      is_vat_registered: steps.ct.is_vat_registered,
    },

    # Regime comparison
    comparison: steps.rcr.comparisons,
    recommended_regime: steps.rcr.recommended_path,
    using_locked_regime: steps.rcr.using_locked_regime,
    savings_vs_worst: steps.rcr.savings_vs_worst,
    savings_vs_next_best: steps.rcr.savings_vs_next_best,

    # Selected regime details
    selected_path: steps.rcr.locked_path,
    selected_income_tax_due: steps.br.income_tax_due,
    selected_percentage_tax_due: steps.ptr.pt_due,
    selected_total_tax: steps.br.income_tax_due + steps.ptr.pt_due,
    selected_total_burden: steps.br.income_tax_due + steps.ptr.pt_due,  # same as above in most cases

    # Credits
    total_it_credits: steps.br.total_it_credits,
    cwt_credits: steps.cwt.it_cwt_total,
    quarterly_payments: steps.qa.total_quarterly_it_paid,
    prior_year_excess: steps.cwt.prior_year_excess_applied,

    # Balance
    balance: steps.br.balance,
    disposition: steps.br.disposition,
    overpayment: steps.br.overpayment,
    installment_eligible: steps.br.installment_eligible,
    installment_first_due: steps.br.installment_first,
    installment_second_due: steps.br.installment_second,

    # PT
    pt_result: steps.ptr,

    # Forms
    form_type: steps.fm.form_type,
    form_output: steps.fm.form_output,
    pt_form_output: steps.fm.pt_form_output,

    # Penalties (null if no late filing)
    penalties: steps.pen.applies ? steps.pen : null,

    # Manual review flags
    manual_review_flags: collect_all_flags(steps),

    # Warnings
    warnings: collect_all_warnings(steps),
  }
```

**Outputs:** `TaxComputationResult` — the complete, self-contained result for the frontend to render.

---

## Pipeline Dependency Graph

```
TaxpayerInput
    │
    PL-01 (Validate)
    │
    PL-02 (Classify)
    │
    PL-03 (Aggregate Gross)
    │
    PL-04 (Eligibility)
    │
    ├── PL-05 (Itemized Deductions) ─────────────────────┐
    ├── PL-06 (OSD) ──────────────────────────────────────┤
    ├── PL-07 (CWT Credits) ───────────────────────────────┤
    └── PL-11 (Percentage Tax) ───── PT rate → PL-08 A ───┤
                                                          │
    PL-08 (Path A) ◄──── PL-05 + PL-11.pt_annual ────────┤
    PL-09 (Path B) ◄──── PL-06 ──────────────────────────┤
    PL-10 (Path C) ◄──── PL-03 ─────────────────────────┘
                                                          │
    PL-12 (Quarterly Aggregation) ◄──── PL-07 ───────────┘
                │
    PL-13 (Regime Comparison) ◄── PL-08 + PL-09 + PL-10 + PL-11
                │
    PL-14 (Balance) ◄──── PL-13 + PL-12
                │
    PL-15 (Form Mapping) ◄──── all steps
                │
    PL-16 (Penalties) ◄──── PL-14 + PL-11
                │
    PL-17 (Assemble Result)
                │
    TaxComputationResult
```

**Key two-pass dependency:** PL-08 (Path A) requires PT from PL-11, but PL-11 can be computed before PL-08 because PT depends only on `gross_receipts` (from PL-03), not on NTI. This avoids any circular computation. Execute PL-11 before PL-08.

---

## Notes on Quarterly vs. Annual Filing

The same pipeline handles both quarterly (Form 1701Q) and annual (Form 1701/1701A) filings. The key differences:

| Aspect | Quarterly (Q1/Q2/Q3) | Annual |
|--------|---------------------|--------|
| PL-03 gross | Current quarter only | Full year |
| PL-11 PT | Current quarter gross | Full year gross (for Path A deduction) |
| PL-12 credits | Prior quarters' 1701Q payments carried | All quarterly + CWT credits |
| PL-14 balance | Cumulative IT due minus prior payments | Annual IT due minus all credits |
| PL-15 form | Form 1701Q | Form 1701 or 1701A |
| ₱250K exemption | Applied cumulatively (MAX(0, cum_base - 250K) × 8%) | Fixed ₱250K once |

For quarterly computations, `gross_receipts` in the input represents the **cumulative** gross receipts from Q1 through the current quarter. The quarterly balance is then: `cumulative_IT_due - prior_quarterly_payments - current_quarter_CWT`.

---

## Precision and Rounding Rules

All monetary values throughout the pipeline follow these rules:

| Rule | Description |
|------|-------------|
| R-01 | All intermediate computations use full decimal precision (no intermediate rounding) |
| R-02 | Final IT due: round to nearest centavo (2 decimal places) — `round(x, 2)` |
| R-03 | OSD deduction: round to nearest centavo at the deduction level, not at NTI level |
| R-04 | BIR form display: truncate to whole peso (floor to integer) for form display only; retain centavos internally |
| R-05 | PT due: round to nearest centavo |
| R-06 | Penalty interest: compute at full precision; round total penalty to nearest centavo |
| R-07 | Division operations: maintain at least 10 decimal places before final rounding |
| R-08 | Percentage rates: store as decimals (0.08, 0.40, 0.03) never as integers |

**Legal basis:** GRT-R1 through GRT-R5 (graduated-rate-table.md); BIR form instructions for peso truncation.
