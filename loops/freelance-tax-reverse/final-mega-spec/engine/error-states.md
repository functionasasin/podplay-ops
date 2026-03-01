# Engine Error States — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-01
**Cross-references:**
- Pipeline steps: [engine/pipeline.md](pipeline.md)
- Data model (types used here): [engine/data-model.md](data-model.md)
- Invariants: [engine/invariants.md](invariants.md)
- Manual review flags: [domain/manual-review-flags.md](../domain/manual-review-flags.md)
- API error responses: [api/endpoints.md](../api/endpoints.md)

---

## Table of Contents

1. [Error Architecture Overview](#1-error-architecture-overview)
2. [Error and Warning Return Types](#2-error-and-warning-return-types)
3. [Hard Validation Errors (ERR_*)](#3-hard-validation-errors)
4. [Ineligibility Errors (ERR_ELECTED_INELIGIBLE_*)](#4-ineligibility-errors)
5. [Engine Assertion Errors (ERR_ASSERT_*)](#5-engine-assertion-errors)
6. [Soft Warnings (WARN_*)](#6-soft-warnings)
7. [Ineligibility Notification Codes (IN-*)](#7-ineligibility-notification-codes)
8. [Manual Review Flags (MRF_*)](#8-manual-review-flags)
9. [Complete Error Code Registry](#9-complete-error-code-registry)
10. [Error Handling per Pipeline Step](#10-error-handling-per-pipeline-step)
11. [API HTTP Error Mapping](#11-api-http-error-mapping)
12. [UI Display Rules](#12-ui-display-rules)

---

## 1. Error Architecture Overview

The engine uses a **structured error taxonomy** with four distinct categories:

| Category | Codes | Behavior | User Impact |
|----------|-------|----------|-------------|
| **Hard Validation Errors** | `ERR_*` | Computation aborts immediately at PL-01. Returns `EngineError` — no partial result. | User sees an error banner. Must fix the input before any result is shown. |
| **Ineligibility Errors** | `ERR_ELECTED_INELIGIBLE_*` | Computation aborts at PL-04. User explicitly elected a regime they cannot legally use. | User sees an error explaining why the elected regime is not available. |
| **Engine Assertion Errors** | `ERR_ASSERT_*` | Internal invariant violation — indicates a software bug, not a user error. Should never occur in production. | Computation aborts. Generic "unexpected error" shown to user. Error is logged with full context for developer review. |
| **Soft Warnings** | `WARN_*` | Computation continues. Warnings are attached to the result as `validation_warnings`. | User sees amber warning banners alongside the result. Input may be legally valid but suspicious. |
| **Ineligibility Notifications** | `IN-*` | Path C is skipped. Comparison shows only applicable paths. | User sees an informational note explaining why the 8% option is not available. |
| **Manual Review Flags** | `MRF_*` | Computation continues with a conservative estimate or the engine skips the ambiguous component. Flags are attached to the result. | User sees a yellow advisory: "Review this item with a CPA before filing." |

### Computation vs. Abort

The top-level `compute_tax` function returns one of two types:

```
union ComputeResult:
  | Success(result: TaxComputationResult, warnings: List<ValidationWarning>, flags: List<ManualReviewFlag>)
  | Failure(error: EngineError)
```

Only `ERR_*` and `ERR_ASSERT_*` codes produce `Failure`. All other conditions (soft warnings, ineligibility notifications, MRF flags) produce `Success` with the relevant items attached.

---

## 2. Error and Warning Return Types

### 2.1 EngineError

Returned when computation cannot proceed due to a hard validation error or internal assertion failure.

```
struct EngineError {
  code: string                 // Error code string, e.g., "ERR_INVALID_TAX_YEAR"
  message: string              // English prose description of the error (for developer logs)
  user_message: string         // User-facing explanation of what to fix (plain language, no jargon)
  field: string | null         // Which input field caused the error. null for structural/cross-field errors.
  validation_code: string | null  // The VAL-NNN code if this originates from a PL-01 check. null for assertion errors.
  severity: ErrorSeverity      // HARD_ERROR | ASSERTION_ERROR
}

enum ErrorSeverity {
  HARD_ERROR        // User input problem; user can fix it
  ASSERTION_ERROR   // Software bug; user cannot fix it
}
```

### 2.2 ValidationWarning

Attached to `TaxComputationResult.validation_warnings` when computation succeeds but the engine has a soft concern about the inputs.

```
struct ValidationWarning {
  code: string                 // Warning code string, e.g., "WARN_NEAR_VAT_THRESHOLD"
  message: string              // English prose (for developer logs)
  user_message: string         // User-facing warning text; explains what to check
  field: string | null         // Relevant input field, if applicable
  severity: WarningSeverity    // INFORMATIONAL | ADVISORY
}

enum WarningSeverity {
  INFORMATIONAL   // User should be aware; no action required. Shown as blue info box.
  ADVISORY        // User should verify this. Shown as amber warning box.
}
```

### 2.3 IneligibilityNotification

Attached to `TaxComputationResult.ineligibility_notes` to explain why Path C was skipped.

```
struct IneligibilityNotification {
  code: string                 // IN-01 through IN-05
  reason: string               // Short reason code string
  user_message: string         // User-facing explanation of why 8% is not available
  legal_basis: string          // Statute or regulation that creates the restriction
}
```

### 2.4 ManualReviewFlag

Attached to `TaxComputationResult.manual_review_flags` when the engine cannot make a fully deterministic decision.

```
struct ManualReviewFlag {
  code: string                 // MRF-NNN code, e.g., "MRF-009"
  category: MrfCategory        // EXPENSE_CLASSIFICATION | TIMING | REGISTRATION | FOREIGN | SUBSTANTIATION
  user_message: string         // Plain-language explanation of what the user must verify manually
  affected_field: string | null  // Which input or output is affected
  conservative_assumption: string  // What the engine assumed in the absence of certainty
  action_required: string      // What the taxpayer or CPA must do to resolve this flag
}

enum MrfCategory {
  EXPENSE_CLASSIFICATION  // Engine cannot determine if an expense is deductible
  TIMING                  // Applies to a different period or filing
  REGISTRATION            // Taxpayer's registration status creates ambiguity
  FOREIGN                 // Foreign income or foreign-employer scenarios
  SUBSTANTIATION          // Documentation requirements cannot be verified by engine
  ATC_CODE                // Unrecognized CWT ATC code
}
```

---

## 3. Hard Validation Errors

All `ERR_*` codes are produced in **PL-01: Input Validation**. If any of these fire, the engine returns `Failure(EngineError)` immediately. No intermediate computations are performed.

Each error has:
- **Code**: the `EngineError.code` string
- **VAL code**: the internal validation check that triggers it
- **Condition**: the exact boolean predicate that is `true` when the error fires
- **Field**: the `TaxpayerInput` field name that is invalid
- **User-facing message**: exactly what to show the user in the UI
- **Resolution**: what the user must do to fix the error

---

### ERR_INVALID_TAX_YEAR

| Attribute | Value |
|-----------|-------|
| Code | `ERR_INVALID_TAX_YEAR` |
| VAL code | VAL-001 |
| Condition | `tax_year < 2018 OR tax_year > 2030` |
| Field | `tax_year` |
| Severity | HARD_ERROR |
| User-facing message | "The tax year must be between 2018 and 2030. The TRAIN Law graduated rate table (which this tool uses) took effect in 2018. Years after 2030 are not yet supported." |
| Resolution | Enter a tax year between 2018 and 2030. |
| HTTP status | 422 |

**Technical note:** Tax year 2017 and earlier used the pre-TRAIN rate tables which are not implemented. Tax year 2031+ is not supported because BIR may amend the law before then. The valid range will be updated when Congress amends the TRAIN rates.

---

### ERR_NEGATIVE_GROSS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_GROSS` |
| VAL code | VAL-002 |
| Condition | `gross_receipts < 0` |
| Field | `gross_receipts` |
| Severity | HARD_ERROR |
| User-facing message | "Gross receipts cannot be negative. Enter the total business income received during the period (₱0 if no income was received)." |
| Resolution | Enter ₱0 or a positive amount for gross receipts. |
| HTTP status | 422 |

---

### ERR_RETURNS_EXCEED_GROSS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_RETURNS_EXCEED_GROSS` |
| VAL code | VAL-003 |
| Condition | `sales_returns_allowances > gross_receipts` |
| Field | `sales_returns_allowances` |
| Severity | HARD_ERROR |
| User-facing message | "Sales returns and allowances (₱{sales_returns_allowances}) cannot be greater than gross receipts (₱{gross_receipts}). Reduce the returns/allowances amount or increase gross receipts." |
| Resolution | Ensure sales_returns_allowances ≤ gross_receipts. The net cannot be negative. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_RETURNS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_RETURNS` |
| VAL code | VAL-003 (implied) |
| Condition | `sales_returns_allowances < 0` |
| Field | `sales_returns_allowances` |
| Severity | HARD_ERROR |
| User-facing message | "Sales returns and allowances cannot be negative. Enter ₱0 if you have no returns or allowances." |
| Resolution | Enter ₱0 or a positive amount for sales returns and allowances. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_COGS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_COGS` |
| VAL code | VAL-004 |
| Condition | `cost_of_goods_sold < 0` |
| Field | `cost_of_goods_sold` |
| Severity | HARD_ERROR |
| User-facing message | "Cost of goods sold cannot be negative. Enter ₱0 if you are a service provider or if you have no cost of goods sold." |
| Resolution | Enter ₱0 or a positive amount. Service providers should enter ₱0. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_COMPENSATION

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_COMPENSATION` |
| VAL code | VAL-005 |
| Condition | `taxable_compensation < 0` |
| Field | `taxable_compensation` |
| Severity | HARD_ERROR |
| User-facing message | "Taxable compensation income cannot be negative. Enter ₱0 if you have no employment income." |
| Resolution | Enter ₱0 or a positive amount for taxable compensation. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_EXCESS_CWT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_EXCESS_CWT` |
| VAL code | VAL-006 |
| Condition | `prior_year_excess_cwt < 0` |
| Field | `prior_year_excess_cwt` |
| Severity | HARD_ERROR |
| User-facing message | "Prior year excess CWT cannot be negative. Enter ₱0 if you have no carry-over credit from last year's annual return." |
| Resolution | Enter ₱0 or the positive carry-over amount from your prior year Form 1701 or 1701A. |
| HTTP status | 422 |

---

### ERR_COMP_ONLY_WITH_GROSS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_COMP_ONLY_WITH_GROSS` |
| VAL code | VAL-007 |
| Condition | `taxpayer_type == COMPENSATION_ONLY AND gross_receipts > 0` |
| Field | `gross_receipts` |
| Severity | HARD_ERROR |
| User-facing message | "You selected 'Compensation Income Only' but entered a gross receipts amount of ₱{gross_receipts}. If you have business or professional income, select 'Purely Self-Employed' or 'Mixed Income' instead." |
| Resolution | Either set gross_receipts to ₱0, or change taxpayer_type to PURELY_SE or MIXED_INCOME. |
| HTTP status | 422 |

---

### ERR_SE_WITH_COMPENSATION

| Attribute | Value |
|-----------|-------|
| Code | `ERR_SE_WITH_COMPENSATION` |
| VAL code | VAL-008 |
| Condition | `taxpayer_type == PURELY_SE AND taxable_compensation > 0` |
| Field | `taxable_compensation` |
| Severity | HARD_ERROR |
| User-facing message | "You selected 'Purely Self-Employed' but entered a compensation income of ₱{taxable_compensation}. If you also have employment income, select 'Mixed Income (Employee + Business)' instead." |
| Resolution | Either set taxable_compensation to ₱0, or change taxpayer_type to MIXED_INCOME. |
| HTTP status | 422 |

---

### ERR_INCONSISTENT_MIXED_FLAG

| Attribute | Value |
|-----------|-------|
| Code | `ERR_INCONSISTENT_MIXED_FLAG` |
| VAL code | VAL-009 |
| Condition | `is_mixed_income == true AND taxpayer_type != MIXED_INCOME` |
| Field | `is_mixed_income` |
| Severity | HARD_ERROR |
| User-facing message | "There is a conflict: the 'mixed income' flag is set to true but the taxpayer type is not 'Mixed Income'. Please ensure both fields are consistent." |
| Resolution | Set is_mixed_income = false, or set taxpayer_type = MIXED_INCOME. |
| HTTP status | 422 |

**Technical note:** This error should never be reachable from the wizard UI (the wizard derives `is_mixed_income` automatically from `taxpayer_type`). It is a defense-in-depth check for direct API callers that might send inconsistent payloads.

---

### ERR_NEGATIVE_2307_PAYMENT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_2307_PAYMENT` |
| VAL code | VAL-010 |
| Condition | Any `Form2307Entry.income_payment < 0` in `cwt_2307_entries` |
| Field | `cwt_2307_entries[i].income_payment` |
| Severity | HARD_ERROR |
| User-facing message | "The income payment amount for a Form 2307 entry (from {payor_name}) cannot be negative. Enter ₱0 or a positive amount." |
| Resolution | Fix the negative income_payment value in the flagged 2307 entry. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_2307_WITHHELD

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_2307_WITHHELD` |
| VAL code | VAL-011 |
| Condition | Any `Form2307Entry.tax_withheld < 0` in `cwt_2307_entries` |
| Field | `cwt_2307_entries[i].tax_withheld` |
| Severity | HARD_ERROR |
| User-facing message | "The tax withheld amount for a Form 2307 entry (from {payor_name}) cannot be negative. Enter ₱0 or a positive amount." |
| Resolution | Fix the negative tax_withheld value in the flagged 2307 entry. |
| HTTP status | 422 |

---

### ERR_2307_WITHHELD_EXCEEDS_PAYMENT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_2307_WITHHELD_EXCEEDS_PAYMENT` |
| VAL code | VAL-012 |
| Condition | Any `Form2307Entry.tax_withheld > Form2307Entry.income_payment` |
| Field | `cwt_2307_entries[i].tax_withheld` |
| Severity | HARD_ERROR |
| User-facing message | "For the Form 2307 entry from {payor_name}: the tax withheld (₱{tax_withheld}) exceeds the income payment (₱{income_payment}). A withholding agent can never withhold more than the gross payment." |
| Resolution | The tax_withheld amount must be ≤ income_payment. Verify the 2307 certificate amounts. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_QUARTERLY_PAYMENT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_QUARTERLY_PAYMENT` |
| VAL code | VAL-013 |
| Condition | Any `QuarterlyPayment.amount_paid < 0` in `prior_quarterly_payments` |
| Field | `prior_quarterly_payments[i].amount_paid` |
| Severity | HARD_ERROR |
| User-facing message | "The quarterly payment amount for Q{quarter} cannot be negative. Enter ₱0 if no payment was made for that quarter." |
| Resolution | Fix the negative amount_paid value for the flagged quarterly payment. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_NON_OP_INCOME

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_NON_OP_INCOME` |
| VAL code | VAL-014 |
| Condition | `non_operating_income < 0` |
| Field | `non_operating_income` |
| Severity | HARD_ERROR |
| User-facing message | "Non-operating income cannot be negative. Enter ₱0 if you have no non-operating income, or enter a positive amount (e.g., rental income, royalties not subject to final withholding tax)." |
| Resolution | Enter ₱0 or a positive amount. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_FWT_INCOME

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_FWT_INCOME` |
| VAL code | VAL-015 |
| Condition | `fwt_income < 0` |
| Field | `fwt_income` |
| Severity | HARD_ERROR |
| User-facing message | "Final withholding tax income cannot be negative. Enter ₱0 if you have no income that was already subjected to final withholding tax (e.g., bank interest, PCSO prizes)." |
| Resolution | Enter ₱0 or a positive amount. |
| HTTP status | 422 |

---

### ERR_FUTURE_FILING_PERIOD

| Attribute | Value |
|-----------|-------|
| Code | `ERR_FUTURE_FILING_PERIOD` |
| VAL code | VAL-016 |
| Condition | The `filing_period` end date is in the future relative to the current date AND the current date is before the filing deadline for that period. More specifically: for FilingPeriod = Q1, end date = March 31, {tax_year}; Q2 end = June 30; Q3 end = September 30; ANNUAL end = December 31. The period is "future" if the period end date > today's date. |
| Field | `filing_period` |
| Severity | HARD_ERROR |
| User-facing message | "The filing period you selected ({period_label} {tax_year}) has not ended yet. You can only compute tax for completed periods. For example, you can compute Q1 after March 31." |
| Resolution | Select a completed filing period or use the current year's most recently completed period. |
| HTTP status | 422 |

**Exception:** The engine allows computation for the current period if the user explicitly sets `allow_current_period = true` in the input (a future pro feature for real-time tax tracking). This flag is not available in the wizard UI.

---

### ERR_TOO_MANY_QUARTERLY_PAYMENTS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_TOO_MANY_QUARTERLY_PAYMENTS` |
| VAL code | VAL-017 |
| Condition | `filing_period == ANNUAL AND len(prior_quarterly_payments) > 3` |
| Field | `prior_quarterly_payments` |
| Severity | HARD_ERROR |
| User-facing message | "An annual return can only have at most 3 prior quarterly payments (Q1, Q2, Q3). You entered {count} entries. Remove the extra entries." |
| Resolution | Reduce prior_quarterly_payments to at most 3 entries, one per quarter (Q1, Q2, Q3). |
| HTTP status | 422 |

---

### ERR_NEGATIVE_PRIOR_PAYMENT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_PRIOR_PAYMENT` |
| VAL code | VAL-018 |
| Condition | `prior_payment_for_return < 0` |
| Field | `prior_payment_for_return` |
| Severity | HARD_ERROR |
| User-facing message | "Prior payment for return cannot be negative. Enter ₱0 if this is an original return, or enter the positive amount already paid on the original return if this is an amended return." |
| Resolution | Enter ₱0 for original returns. For amended returns, enter the amount actually paid on the original filing. |
| HTTP status | 422 |

---

### ERR_NEGATIVE_EXPENSE_ITEM

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_EXPENSE_ITEM` |
| VAL code | VAL-019 |
| Condition | Any sub-component of `itemized_expenses` is negative (e.g., `salaries_and_wages < 0`, `rent < 0`, etc.) |
| Field | `itemized_expenses.{sub_field_name}` |
| Severity | HARD_ERROR |
| User-facing message | "The expense amount for '{expense_label}' cannot be negative. Enter ₱0 if you have no such expense." |
| Resolution | Fix the negative expense sub-field. |
| HTTP status | 422 |

**Sub-fields that trigger this error:** `salaries_and_wages`, `sss_philhealth_pagibig_employer_share`, `rent`, `utilities`, `communication`, `office_supplies`, `professional_fees_paid`, `travel_transportation`, `insurance_premiums`, `interest_expense`, `final_taxed_interest_income`, `taxes_and_licenses`, `casualty_theft_losses`, `bad_debts`, `entertainment_representation`, `home_office_expense`, `research_development`, `charitable_contributions`.

---

### ERR_NEGATIVE_COMP_CWT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NEGATIVE_COMP_CWT` |
| VAL code | VAL-020 |
| Condition | `compensation_cwt < 0` |
| Field | `compensation_cwt` |
| Severity | HARD_ERROR |
| User-facing message | "Tax withheld from compensation (Form 2316) cannot be negative. Enter ₱0 if no tax was withheld from your salary, or enter the total amount from your BIR Form 2316." |
| Resolution | Enter ₱0 or the positive amount from your employer's Form 2316. |
| HTTP status | 422 |

---

### ERR_DUPLICATE_QUARTERLY_PERIOD

| Attribute | Value |
|-----------|-------|
| Code | `ERR_DUPLICATE_QUARTERLY_PERIOD` |
| VAL code | VAL-021 |
| Condition | `prior_quarterly_payments` contains two or more entries with the same `quarter` value |
| Field | `prior_quarterly_payments` |
| Severity | HARD_ERROR |
| User-facing message | "Duplicate quarterly payment entries found for Q{quarter}. Each quarter (Q1, Q2, Q3) may appear at most once in the quarterly payments list." |
| Resolution | Remove duplicate entries, keeping only one entry per quarter. |
| HTTP status | 422 |

---

### ERR_QUARTERLY_PAYMENT_WRONG_PERIOD

| Attribute | Value |
|-----------|-------|
| Code | `ERR_QUARTERLY_PAYMENT_WRONG_PERIOD` |
| VAL code | VAL-022 |
| Condition | A `QuarterlyPayment.quarter` value is not 1, 2, or 3 (e.g., if someone enters 4) |
| Field | `prior_quarterly_payments[i].quarter` |
| Severity | HARD_ERROR |
| User-facing message | "Quarterly payments can only reference Q1, Q2, or Q3. Q4 income tax is always filed as part of the annual ITR (Form 1701/1701A), not a separate quarterly return." |
| Resolution | Remove any Q4 entry. Q4 data belongs in the annual return computation. |
| HTTP status | 422 |

---

### ERR_MIXED_INCOME_NO_COMPENSATION

| Attribute | Value |
|-----------|-------|
| Code | `ERR_MIXED_INCOME_NO_COMPENSATION` |
| VAL code | VAL-023 |
| Condition | `taxpayer_type == MIXED_INCOME AND taxable_compensation == 0` |
| Field | `taxable_compensation` |
| Severity | HARD_ERROR |
| User-facing message | "You selected 'Mixed Income (Employee + Business)' but entered ₱0 for taxable compensation income. If you have no employment income, select 'Purely Self-Employed' instead." |
| Resolution | Either enter a positive compensation amount, or change taxpayer_type to PURELY_SE. |
| HTTP status | 422 |

---

### ERR_MIXED_INCOME_NO_BUSINESS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_MIXED_INCOME_NO_BUSINESS` |
| VAL code | VAL-024 |
| Condition | `taxpayer_type == MIXED_INCOME AND gross_receipts == 0 AND non_operating_income == 0` |
| Field | `gross_receipts` |
| Severity | HARD_ERROR |
| User-facing message | "You selected 'Mixed Income (Employee + Business)' but entered ₱0 for both gross receipts and non-operating income. If you have no business income, select 'Compensation Income Only' instead." |
| Resolution | Either enter a positive business income amount, or change taxpayer_type to COMPENSATION_ONLY. |
| HTTP status | 422 |

---

### ERR_2307_PERIOD_INVALID

| Attribute | Value |
|-----------|-------|
| Code | `ERR_2307_PERIOD_INVALID` |
| VAL code | VAL-025 |
| Condition | Any `Form2307Entry` has `period_to < period_from` |
| Field | `cwt_2307_entries[i].period_to` |
| Severity | HARD_ERROR |
| User-facing message | "For the Form 2307 entry from {payor_name}: the 'period to' date ({period_to}) is before the 'period from' date ({period_from}). Please check the dates on the certificate." |
| Resolution | Ensure period_to ≥ period_from for all 2307 entries. |
| HTTP status | 422 |

---

### ERR_DEPRECIATION_INVALID

| Attribute | Value |
|-----------|-------|
| Code | `ERR_DEPRECIATION_INVALID` |
| VAL code | VAL-026 |
| Condition | Any `DepreciationEntry` has: `cost <= 0`, OR `useful_life_years <= 0`, OR `salvage_value < 0`, OR `salvage_value >= cost`, OR `acquisition_year < 2010 OR acquisition_year > tax_year + 1`, OR `accumulated_depreciation < 0` |
| Field | `itemized_expenses.depreciation_entries[i]` |
| Severity | HARD_ERROR |
| User-facing message | "Depreciation entry for '{asset_description}' has invalid values: [specific violation]. Please check the asset cost, useful life, salvage value, and acquisition year." |
| Resolution | Fix the invalid depreciation entry fields. Valid ranges: cost > ₱0; useful_life_years ≥ 1; salvage_value ≥ 0 and < cost; acquisition_year between 2010 and current tax year. |
| HTTP status | 422 |

---

### ERR_NOLCO_ENTRY_INVALID

| Attribute | Value |
|-----------|-------|
| Code | `ERR_NOLCO_ENTRY_INVALID` |
| VAL code | VAL-027 |
| Condition | Any `NolcoEntry` has: `loss_year < tax_year - 3`, OR `loss_year >= tax_year`, OR `loss_amount <= 0`, OR `amount_applied < 0`, OR `amount_applied > loss_amount` |
| Field | `itemized_expenses.nolco_entries[i]` |
| Severity | HARD_ERROR |
| User-facing message | "NOLCO entry for year {loss_year} is invalid: [specific violation]. NOLCO can only be applied from losses incurred within the past 3 years (loss years {min_year} through {max_year}). Loss amounts must be positive." |
| Resolution | Remove entries older than 3 years. Fix negative or zero loss amounts. Ensure amount_applied ≤ loss_amount. |
| HTTP status | 422 |

---

### ERR_COMPENSATION_ONLY_NO_OPTIMIZER

| Attribute | Value |
|-----------|-------|
| Code | `ERR_COMPENSATION_ONLY_NO_OPTIMIZER` |
| VAL code | VAL-028 |
| Condition | `taxpayer_type == COMPENSATION_ONLY` |
| Field | `taxpayer_type` |
| Severity | HARD_ERROR |
| User-facing message | "This tool optimizes tax for self-employed individuals and freelancers. You selected 'Compensation Income Only', which means you have no business or professional income to optimize. Your employer handles your income tax withholding automatically. If you also have business income, select 'Mixed Income (Employee + Business)' instead." |
| Resolution | This tool is not applicable for purely salaried employees. Select PURELY_SE or MIXED_INCOME if applicable. |
| HTTP status | 422 |

**Note:** The wizard UI should prevent a user from reaching the compute step with `COMPENSATION_ONLY`. This error exists as an API-level guard.

---

## 4. Ineligibility Errors

These errors fire at **PL-04** when the user has explicitly elected a specific regime (via `elected_regime`) that they are legally ineligible to use.

### ERR_ELECTED_INELIGIBLE_PATH_C_VAT

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ELECTED_INELIGIBLE_PATH_C_VAT` |
| Pipeline step | PL-04 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND is_vat_registered == true` |
| User-facing message | "You selected the 8% flat rate, but you are registered for VAT. VAT-registered taxpayers cannot use the 8% option. You must use Path A (Itemized Deductions) or Path B (OSD) instead. Consider de-registering from VAT if your gross receipts consistently remain below ₱3,000,000." |
| Legal basis | NIRC Sec. 24(A)(2)(b); RR 8-2018 Sec. 2(A): "an individual whose gross sales or receipts and other non-operating income do not exceed the VAT threshold" — VAT registration disqualifies the taxpayer from this threshold category. |
| Resolution | Change elected_regime to ELECT_OSD or ELECT_ITEMIZED, or set to null (optimizer mode). |
| HTTP status | 422 |

---

### ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD` |
| Pipeline step | PL-04 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND threshold_base > 3_000_000` |
| User-facing message | "You selected the 8% flat rate, but your gross receipts (₱{threshold_base}) exceed the ₱3,000,000 threshold. The 8% option is only available if total gross receipts plus other non-operating income does not exceed ₱3,000,000. You must use Path A (Itemized Deductions) or Path B (OSD)." |
| Legal basis | NIRC Sec. 24(A)(2)(b): "...individuals whose gross sales or gross receipts and other non-operating income for the year do not exceed the threshold under Section 51(A)(2)(a) of this Code, as amended, otherwise known as the VAT threshold, whose income is derived purely from the conduct of trade, business, or practice of profession..." The VAT threshold is ₱3,000,000. |
| Resolution | Change elected_regime to ELECT_OSD or ELECT_ITEMIZED, or set to null. |
| HTTP status | 422 |

---

### ERR_ELECTED_INELIGIBLE_PATH_C_GPP

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ELECTED_INELIGIBLE_PATH_C_GPP` |
| Pipeline step | PL-04 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND is_gpp_partner == true` |
| User-facing message | "You selected the 8% flat rate, but you indicated you are a General Professional Partnership (GPP) partner computing tax on your distributive share. GPP partners are not eligible for the 8% option per RMC 50-2018. You must use Path A or Path B." |
| Legal basis | RMC 50-2018: GPP partners may not elect the 8% option on their distributive shares. |
| Resolution | Change elected_regime to ELECT_OSD or ELECT_ITEMIZED, or set to null. |
| HTTP status | 422 |

---

### ERR_ELECTED_INELIGIBLE_PATH_C_SEC117

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ELECTED_INELIGIBLE_PATH_C_SEC117` |
| Pipeline step | PL-04 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND subject_to_sec_117_128 == true` |
| User-facing message | "You selected the 8% flat rate, but you indicated your business is subject to industry-specific percentage taxes (NIRC Sections 117–128, such as telecommunications, transport, or utilities). These taxpayers are excluded from the 8% income tax option per RR 8-2018. You must use Path A or Path B." |
| Legal basis | RR 8-2018 Sec. 2(A): excludes taxpayers subject to other percentage tax under Sections 117–128 of the NIRC. |
| Resolution | Change elected_regime to ELECT_OSD or ELECT_ITEMIZED, or set to null. |
| HTTP status | 422 |

---

### ERR_ELECTED_INELIGIBLE_PATH_C_BMBE

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ELECTED_INELIGIBLE_PATH_C_BMBE` |
| Pipeline step | PL-04 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND is_bmbe_registered == true` |
| User-facing message | "You selected the 8% flat rate, but you indicated you are registered as a Barangay Micro Business Enterprise (BMBE). BMBE-registered businesses are exempt from income tax entirely, which makes the 8% rate irrelevant. Your income tax is ₱0 under all paths." |
| Legal basis | RA 9178 (BMBE Law); BMBE registration confers income tax exemption. |
| Resolution | No regime election needed — engine returns ₱0 for all paths. Remove the elected_regime or set to null. |
| HTTP status | 422 |

---

## 5. Engine Assertion Errors

These errors indicate a **software defect** in the engine — an invariant was violated during computation. They should never occur in production if the engine is correctly implemented. When they do occur, the engine logs the full input context for debugging.

### ERR_ASSERT_NEGATIVE_IT_DUE

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_NEGATIVE_IT_DUE` |
| Invariant violated | INV-PA-01, INV-PB-01, INV-PC-05 |
| Condition | Any `PathResult.income_tax_due < 0` after computation |
| User-facing message | "An unexpected error occurred during tax computation (error code: ERR_ASSERT_NEGATIVE_IT_DUE). This is a software issue, not a problem with your inputs. Please try again. If the error persists, contact support at support@taxoptimize.ph." |
| Developer action | Log full TaxpayerInput and the intermediate result that produced the negative value. File a bug. |
| HTTP status | 500 |

---

### ERR_ASSERT_NO_ELIGIBLE_PATHS

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_NO_ELIGIBLE_PATHS` |
| Invariant violated | INV-EL-11 |
| Condition | After PL-04, all of path_a_eligible, path_b_eligible, and path_c_eligible are false for a PURELY_SE or MIXED_INCOME taxpayer |
| User-facing message | "An unexpected error occurred: no tax computation paths were found to be available for your inputs. This should not happen. Please contact support at support@taxoptimize.ph." |
| Developer action | This invariant is violated only if the BMBE path was not short-circuited before PL-04. Check BMBE handling in PL-04. Log full inputs. |
| HTTP status | 500 |

---

### ERR_ASSERT_RECOMMENDATION_INVALID

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_RECOMMENDATION_INVALID` |
| Invariant violated | INV-RC-05 |
| Condition | After PL-13, the `recommended_path` is not the path with the minimum `total_tax_burden` among eligible paths (tie-breaking rules notwithstanding). |
| User-facing message | "An unexpected error occurred during regime comparison (error code: ERR_ASSERT_RECOMMENDATION_INVALID). Please contact support at support@taxoptimize.ph." |
| Developer action | Log full RegimeComparisonResult. Check sort logic and tie-breaking in PL-13. |
| HTTP status | 500 |

---

### ERR_ASSERT_SAVINGS_NEGATIVE

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_SAVINGS_NEGATIVE` |
| Invariant violated | INV-RC-08 |
| Condition | `savings_vs_worst < 0` in RegimeComparisonResult |
| User-facing message | "An unexpected error occurred during tax savings computation (error code: ERR_ASSERT_SAVINGS_NEGATIVE). Please contact support at support@taxoptimize.ph." |
| Developer action | Log full RegimeComparisonResult. The worst-path total burden must always be ≥ recommended path burden. |
| HTTP status | 500 |

---

### ERR_ASSERT_OSD_RATIO_INVALID

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_OSD_RATIO_INVALID` |
| Invariant violated | INV-PB-03 (biz_nti_path_b == osd_base × 0.60) |
| Condition | `abs(biz_nti_path_b - osd_base * 0.60) > 0.01` (more than 1 centavo deviation from expected ratio) |
| User-facing message | "An unexpected error occurred during OSD computation (error code: ERR_ASSERT_OSD_RATIO_INVALID). Please contact support at support@taxoptimize.ph." |
| Developer action | Log OsdResult. Check decimal arithmetic in PL-06. Verify no floating-point operations were used. |
| HTTP status | 500 |

---

### ERR_ASSERT_BALANCE_ARITHMETIC

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_BALANCE_ARITHMETIC` |
| Invariant violated | INV-BAL-01 (balance == it_due - total_it_credits) |
| Condition | `abs(balance - (it_due - total_it_credits)) > 0.01` |
| User-facing message | "An unexpected error occurred during balance computation (error code: ERR_ASSERT_BALANCE_ARITHMETIC). Please contact support at support@taxoptimize.ph." |
| Developer action | Log BalanceResult, it_due, and total_it_credits. Check PL-14 arithmetic. |
| HTTP status | 500 |

---

### ERR_ASSERT_INSTALLMENT_ARITHMETIC

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_INSTALLMENT_ARITHMETIC` |
| Invariant violated | INV-BAL-08 (installment_first + installment_second == balance) |
| Condition | `abs((installment_first + installment_second) - balance) > 0.01` |
| User-facing message | "An unexpected error occurred during installment computation (error code: ERR_ASSERT_INSTALLMENT_ARITHMETIC). Please contact support at support@taxoptimize.ph." |
| Developer action | Log installment_first, installment_second, and balance from PL-14. Check rounding in the installment split. |
| HTTP status | 500 |

---

### ERR_ASSERT_PT_AND_VAT_BOTH_APPLIED

| Attribute | Value |
|-----------|-------|
| Code | `ERR_ASSERT_PT_AND_VAT_BOTH_APPLIED` |
| Invariant violated | INV-PT-03 |
| Condition | `pt_result.pt_applies == true AND is_vat_registered == true` |
| User-facing message | "An unexpected error occurred: both percentage tax and VAT were flagged as applicable for the same taxpayer. Please contact support at support@taxoptimize.ph." |
| Developer action | PT and VAT are mutually exclusive per NIRC. Check PL-11 short-circuit logic for VAT-registered taxpayers. |
| HTTP status | 500 |

---

## 6. Soft Warnings

Soft warnings do NOT abort computation. They are attached to `TaxComputationResult.validation_warnings` and displayed to the user alongside the result.

### WARN_NEAR_VAT_THRESHOLD

| Attribute | Value |
|-----------|-------|
| Code | `WARN_NEAR_VAT_THRESHOLD` |
| Original code | WARN-001 |
| Condition | `gross_receipts > 2_700_000 AND gross_receipts <= 3_000_000 AND is_vat_registered == false` |
| Severity | ADVISORY |
| User-facing message | "Your gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If your total receipts for the year exceed ₱3,000,000, you will be required to register for VAT, and the 8% option will no longer be available to you. Monitor your receipts closely and register for VAT before the threshold is crossed." |
| Field | `gross_receipts` |
| Action required by user | Monitor gross receipts. Register for VAT with BIR if the ₱3,000,000 threshold will be reached. |

---

### WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED

| Attribute | Value |
|-----------|-------|
| Code | `WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED` |
| Original code | WARN-002 |
| Condition | `gross_receipts > 3_000_000 AND is_vat_registered == false` |
| Severity | ADVISORY |
| User-facing message | "Your gross receipts exceed the ₱3,000,000 VAT registration threshold. You are required to register for VAT (BIR Form 1907). Once VAT-registered, the 8% income tax option is no longer available, and your percentage tax obligation converts to a 12% VAT obligation. This computation assumes you are not yet VAT-registered; please update your status after registration." |
| Field | `gross_receipts` |
| Action required by user | Register for VAT immediately using BIR Form 1907. Begin charging 12% VAT on sales/services. |

---

### WARN_NO_2307_ENTRIES

| Attribute | Value |
|-----------|-------|
| Code | `WARN_NO_2307_ENTRIES` |
| Original code | WARN-003 |
| Condition | `len(cwt_2307_entries) == 0 AND gross_receipts > 0 AND elected_regime != ELECT_EIGHT_PCT` |
| Severity | ADVISORY |
| User-facing message | "You have not entered any Form 2307 (CWT) certificates. If your clients withheld tax on their payments to you, add those certificates to reduce your tax balance payable. Clients paying professional fees of ₱10,000 or more are typically required to withhold 5% or 10% from their payments to you." |
| Field | `cwt_2307_entries` |
| Action required by user | Collect all Form 2307s received from clients. Add each certificate to the computation. |

---

### WARN_VERY_LOW_EXPENSES

| Attribute | Value |
|-----------|-------|
| Code | `WARN_VERY_LOW_EXPENSES` |
| Original code | WARN-004 |
| Condition | `itemized_expenses.total_claimed / gross_receipts < 0.05 AND taxpayer_type == PURELY_SE AND gross_receipts > 0` |
| Severity | ADVISORY |
| User-facing message | "Your declared business expenses are less than 5% of gross receipts. While low expenses are valid, ensure all legitimate business costs are included to achieve the most accurate comparison across tax regimes. Common deductible expenses: office rent, internet, equipment depreciation, software subscriptions, professional fees paid to subcontractors." |
| Field | `itemized_expenses` |
| Action required by user | Review whether all eligible expenses have been entered. No action required if expenses are genuinely low. |

---

### WARN_NON_OP_INCOME_POSSIBLY_FWT

| Attribute | Value |
|-----------|-------|
| Code | `WARN_NON_OP_INCOME_POSSIBLY_FWT` |
| Original code | WARN-005 |
| Condition | `non_operating_income > 0 AND fwt_income == 0` |
| Severity | ADVISORY |
| User-facing message | "You entered non-operating income of ₱{non_operating_income} but no final withholding tax income. Some non-operating income (such as bank interest on Philippine peso deposits) is subject to final withholding tax (FWT) and should be entered in the 'FWT Income' field instead — it is excluded from income tax computation entirely. Verify with your bank whether interest income was already taxed at source." |
| Field | `non_operating_income` |
| Action required by user | Verify bank statements and 1099 equivalents. Move any FWT-subjected income to the fwt_income field. |

---

### WARN_8PCT_ELECTION_TIMING

| Attribute | Value |
|-----------|-------|
| Code | `WARN_8PCT_ELECTION_TIMING` |
| Original code | WARN-006 |
| Condition | `elected_regime == ELECT_EIGHT_PCT AND filing_period != Q1 AND filing_period != ANNUAL` |
| Severity | ADVISORY |
| User-facing message | "The 8% flat rate election must be made on the first quarterly return (Q1, Form 1701Q). If you are filing for Q2 or Q3 and the Q1 return was filed under a different method, you cannot switch to 8% for this tax year. This computation assumes you validly elected 8% on your Q1 return. If you did not, use Path A (Itemized) or Path B (OSD) instead." |
| Field | `elected_regime` |
| Action required by user | Verify that the 8% election was properly made on the Q1 return. If not, change the elected_regime. |

---

### WARN_BMBE_EXEMPT_ALL_PATHS_ZERO

| Attribute | Value |
|-----------|-------|
| Code | `WARN_BMBE_EXEMPT_ALL_PATHS_ZERO` |
| Original code | WARN-007 |
| Condition | `is_bmbe_registered == true` |
| Severity | INFORMATIONAL |
| User-facing message | "You are registered as a Barangay Micro Business Enterprise (BMBE). BMBE-registered businesses are exempt from income tax under RA 9178. Your income tax due is ₱0 under all computation paths. Note: BMBE registration must be renewed annually with your local government unit." |
| Field | `is_bmbe_registered` |
| Action required by user | Renew BMBE registration annually at the local government unit. No income tax filing is required for BMBE income. |

---

### WARN_GPP_PARTNER_MANUAL_REVIEW

| Attribute | Value |
|-----------|-------|
| Code | `WARN_GPP_PARTNER_MANUAL_REVIEW` |
| Original code | WARN-008 |
| Condition | `is_gpp_partner == true` |
| Severity | ADVISORY |
| User-facing message | "You indicated you are a General Professional Partnership (GPP) partner computing tax on your distributive share. GPP rules are complex: the partnership itself is not taxable; only the individual partners pay tax on their distributive share. The 8% option is not available. This tool computes your income tax under Paths A and B only. Consult a CPA to ensure the distributive share is computed correctly from the GPP's books." |
| Field | `is_gpp_partner` |
| Action required by user | Confirm the distributive share amount with the partnership's CPA. Ensure Form 1701 is filed (not 1701A). |

---

### WARN_CWT_EXCEEDS_IT_DUE

| Attribute | Value |
|-----------|-------|
| Code | `WARN_CWT_EXCEEDS_IT_DUE` |
| Original code | WARN-009 |
| Condition | `it_cwt_total > income_tax_due` (overpayment scenario) |
| Severity | INFORMATIONAL |
| User-facing message | "Your total CWT credits (₱{it_cwt_total}) exceed your income tax due (₱{income_tax_due}). You have an overpayment of ₱{overpayment}. You may: (1) carry this over as a credit to next year's income tax (recommended for amounts ≤ ₱50,000 — mark Item 29 of Form 1701/1701A), (2) apply for a cash refund (BIR Form 1914 — slow process, 90–120 days), or (3) request a Tax Credit Certificate (Form 1926). Retain all original Form 2307s — BIR will require them." |
| Field | `cwt_2307_entries` |
| Action required by user | Decide on overpayment disposition (carry-over, refund, or TCC). Retain all Form 2307 originals. |

---

### WARN_ZERO_INCOME

| Attribute | Value |
|-----------|-------|
| Code | `WARN_ZERO_INCOME` |
| Original code | WARN-010 |
| Condition | `gross_receipts == 0 AND taxable_compensation == 0 AND non_operating_income == 0` |
| Severity | INFORMATIONAL |
| User-facing message | "All income fields are ₱0. If you had zero income for this period, you may still be required to file a 'nil' return (Form 1701Q with zero income). Check with your Revenue District Office regarding the nil return requirement for your registration status." |
| Field | Multiple |
| Action required by user | Verify whether a nil return is required. If so, file the appropriate form with ₱0 amounts. |

---

### WARN_NOLCO_UNDER_PATH_A_ONLY

| Attribute | Value |
|-----------|-------|
| Code | `WARN_NOLCO_UNDER_PATH_A_ONLY` |
| Original code | WARN-011 |
| Condition | `len(itemized_expenses.nolco_entries) > 0 AND (recommended_path == PATH_B OR recommended_path == PATH_C)` |
| Severity | ADVISORY |
| User-facing message | "You have NOLCO (Net Operating Loss Carry-Over) entries totaling ₱{nolco_total}. NOLCO can only be deducted under Path A (Itemized Deductions). The engine's recommended path is {recommended_path_label}, which does not allow NOLCO deduction. Consider whether switching to Path A to utilize the NOLCO deduction would further reduce your tax." |
| Field | `itemized_expenses.nolco_entries` |
| Action required by user | Evaluate whether Path A with NOLCO produces a lower total tax. The results table shows all three paths for comparison. |

---

### WARN_HOME_OFFICE_NOT_EXCLUSIVE

| Attribute | Value |
|-----------|-------|
| Code | `WARN_HOME_OFFICE_NOT_EXCLUSIVE` |
| Original code | WARN-012 |
| Condition | `itemized_expenses.home_office_expense > 0 AND itemized_expenses.home_office_exclusive_use == false` |
| Severity | ADVISORY |
| User-facing message | "You entered a home office expense of ₱{home_office_expense} but indicated the space is not used exclusively for business. The BIR requires exclusive and regular use for the home office deduction. This expense has been set to ₱0 in the computation. If part of your home is used exclusively for business (e.g., a dedicated room with no personal use), mark it as exclusive use." |
| Field | `itemized_expenses.home_office_exclusive_use` |
| Action required by user | Verify whether the home office space qualifies for exclusive use. Update the flag if it does. |

---

### WARN_CHARITABLE_NOT_ACCREDITED

| Attribute | Value |
|-----------|-------|
| Code | `WARN_CHARITABLE_NOT_ACCREDITED` |
| Original code | WARN-013 |
| Condition | `itemized_expenses.charitable_contributions > 0 AND itemized_expenses.charitable_accredited == false` |
| Severity | ADVISORY |
| User-facing message | "You entered a charitable contribution of ₱{charitable_contributions} but indicated the organization is not BIR-accredited. Contributions to non-accredited organizations are not deductible under NIRC Sec. 34(H). This amount has been set to ₱0 in the computation. To deduct charitable contributions, the donee must be accredited by the BIR (RDO-issued accreditation certificate required)." |
| Field | `itemized_expenses.charitable_accredited` |
| Action required by user | Verify the organization's BIR accreditation status. If accredited, change the flag to true. If not, no deduction is available. |

---

### WARN_BAD_DEBTS_CASH_BASIS

| Attribute | Value |
|-----------|-------|
| Code | `WARN_BAD_DEBTS_CASH_BASIS` |
| Original code | WARN-014 |
| Condition | `itemized_expenses.bad_debts > 0 AND itemized_expenses.is_accrual_basis == false` |
| Severity | ADVISORY |
| User-facing message | "You entered bad debts of ₱{bad_debts} but indicated you use cash-basis accounting. Bad debt deductions are only available to accrual-basis taxpayers under NIRC Sec. 34(E) — the income must have been previously recognized (reported) for the deduction to apply. This amount has been set to ₱0. If you are on accrual basis, update the accounting method flag." |
| Field | `itemized_expenses.is_accrual_basis` |
| Action required by user | Verify your accounting method. If accrual basis, change the flag and ensure proper documentation of prior recognition. |

---

### WARN_EAR_CAP_APPLIED

| Attribute | Value |
|-----------|-------|
| Code | `WARN_EAR_CAP_APPLIED` |
| Original code | WARN-015 |
| Condition | `itemized_expenses.entertainment_representation > ear_cap` (after EAR cap computation in PL-05) |
| Severity | INFORMATIONAL |
| User-facing message | "Your entertainment and representation expenses (₱{entertainment_representation}) exceed the allowable cap of ₱{ear_cap} ({cap_rate}% of {cap_base_label}). The deductible amount has been capped at ₱{ear_cap} per NIRC Sec. 34(A)(1)(iv). The excess ₱{excess} is not deductible." |
| Field | `itemized_expenses.entertainment_representation` |
| Action required by user | No action required. This is an informational cap applied by the engine per the tax code. |

---

### WARN_VEHICLE_DEPRECIATION_CAPPED

| Attribute | Value |
|-----------|-------|
| Code | `WARN_VEHICLE_DEPRECIATION_CAPPED` |
| Original code | WARN-016 |
| Condition | Any `DepreciationEntry` with `asset_type == MOTOR_VEHICLE AND cost > 2_400_000` |
| Severity | INFORMATIONAL |
| User-facing message | "The cost basis for vehicle '{asset_description}' (₱{cost}) exceeds the ₱2,400,000 ceiling for vehicle depreciation per RR 12-2012. Depreciation has been computed on the ₱2,400,000 ceiling, not on the actual cost. The excess acquisition cost (₱{excess}) is not deductible." |
| Field | `itemized_expenses.depreciation_entries[i].cost` |
| Action required by user | No action required. The engine applies the cap automatically. |

---

### WARN_UNKNOWN_ATC_CODE

| Attribute | Value |
|-----------|-------|
| Code | `WARN_UNKNOWN_ATC_CODE` |
| Original code | WARN-017 |
| Condition | Any `Form2307Entry.atc_code` is not in the recognized ATC code list (see lookup-tables/cwt-ewt-rates.md) |
| Severity | ADVISORY |
| User-facing message | "Form 2307 entry from {payor_name} has an unrecognized ATC code '{atc_code}'. The ₱{tax_withheld} withheld amount has NOT been credited in this computation. Look up the ATC code on the face of your Form 2307 certificate and correct it. Common codes: WI010 (professional fee, individual), WC010 (professional fee, corporate), WI760 (e-marketplace). Contact support if your ATC code is not in the supported list." |
| Field | `cwt_2307_entries[i].atc_code` |
| Action required by user | Verify the ATC code on the physical Form 2307. Update the entry with the correct code. |

---

## 7. Ineligibility Notification Codes (IN-*)

These are not errors — they are informational messages attached to `TaxComputationResult.ineligibility_notes` explaining why Path C (8%) was skipped. The computation continues with Paths A and B.

| Code | Reason | User-facing message | Legal basis |
|------|--------|---------------------|-------------|
| IN-01 | VAT-registered | "The 8% flat rate is not available because you are registered for VAT. VAT-registered taxpayers must use Path A (Itemized) or Path B (OSD)." | NIRC Sec. 24(A)(2)(b); RR 8-2018 Sec. 2(A) |
| IN-02 | Gross receipts exceed ₱3,000,000 | "The 8% flat rate is not available because your gross receipts and other non-operating income (₱{threshold_base}) exceed the ₱3,000,000 threshold. Only taxpayers with total gross receipts and other income not exceeding ₱3,000,000 may use this option." | NIRC Sec. 24(A)(2)(b) — "not exceeding the VAT threshold of ₱3,000,000" |
| IN-03 | BMBE-registered | "The 8% flat rate is not applicable because you are registered as a BMBE (Barangay Micro Business Enterprise), which exempts you from income tax entirely. All paths show ₱0 income tax due." | RA 9178 (BMBE Law) |
| IN-04 | GPP partner | "The 8% flat rate is not available to General Professional Partnership (GPP) partners computing tax on their distributive share, per RMC 50-2018." | RMC 50-2018 |
| IN-05 | Subject to Sec. 117-128 | "The 8% flat rate is not available to taxpayers whose income is subject to industry-specific percentage taxes under NIRC Sections 117–128 (e.g., telecommunications, transport, certain utilities). Per RR 8-2018, these taxpayers must use Path A or Path B." | RR 8-2018 Sec. 2(A) |

---

## 8. Manual Review Flags (MRF_*)

Manual review flags are attached to `TaxComputationResult.manual_review_flags`. The engine continues computation with a conservative assumption, but the flagged item must be verified by the taxpayer or their CPA before filing.

The complete MRF flag definitions are in [domain/manual-review-flags.md](../domain/manual-review-flags.md). The table below provides the conservative assumption the engine uses for each flag when producing its computation output.

| Code | Category | Conservative assumption used by engine | Affected output |
|------|----------|-----------------------------------------|-----------------|
| MRF-009 | EXPENSE_CLASSIFICATION | Travel/transportation deduction claimed as entered (benefit of the doubt given to taxpayer) | Path A deductions |
| MRF-010 | EXPENSE_CLASSIFICATION | Home office deduction set to ₱0 if `home_office_exclusive_use == false` | Path A deductions |
| MRF-011 | EXPENSE_CLASSIFICATION | Equipment apportioned: 100% deductible if `business_use_pct` not given; flag triggers advisory | Path A deductions |
| MRF-012 | EXPENSE_CLASSIFICATION | NOLCO from tax-exempt year excluded from carry-over (conservatively, not applied) | Path A NOLCO |
| MRF-013 | EXPENSE_CLASSIFICATION | Loan treated as capital if purpose ambiguous; interest deduction set to ₱0 | Path A interest |
| MRF-014 | EXPENSE_CLASSIFICATION | Bad debt deducted as entered if `is_accrual_basis == true`; requires documentation | Path A bad debts |
| MRF-015 | EXPENSE_CLASSIFICATION | R&D deducted as entered; user must document connection to business | Path A R&D |
| MRF-016 | FOREIGN | Foreign employer compensation included in gross income at face value (no foreign tax credit applied) | Graduated IT due |
| MRF-017 | FOREIGN | Foreign tax credit treated as ₱0 (engine does not compute foreign tax credit — out of scope) | Balance payable |
| MRF-018 | EXPENSE_CLASSIFICATION | NOLCO applied in FIFO order up to available carry-over per CR-027.11 | Path A NTI |
| MRF-019 | TIMING | VAT transition quarter: PT and VAT both shown; user must split period manually | PT / VAT basis |
| MRF-021 | ATC_CODE | Unrecognized ATC: withheld amount not credited (conservative — user must resolve ATC code) | IT credits |
| MRF-025 | REGISTRATION | GPP partner: distributive share taken at face value from input; partnership books not verified | Gross income |
| MRF-028 | REGISTRATION | Gross > ₱3M but not VAT-registered: computation proceeds on PATHS A/B only without VAT impact | Path C eligibility |

**How MRF flags are displayed in the UI:** Each MRF flag generates an amber advisory card in the results view, positioned below the tax comparison table. The card shows: (1) the flag code, (2) the user_message explaining what needs review, (3) the conservative_assumption the engine used, and (4) the action_required. See [frontend/results-views.md](../frontend/results-views.md) for layout.

---

## 9. Complete Error Code Registry

### 9.1 Hard Validation Errors

| Code | VAL code | Field | HTTP | Short description |
|------|----------|-------|------|-------------------|
| `ERR_INVALID_TAX_YEAR` | VAL-001 | `tax_year` | 422 | Year outside 2018–2030 |
| `ERR_NEGATIVE_GROSS` | VAL-002 | `gross_receipts` | 422 | Gross receipts is negative |
| `ERR_RETURNS_EXCEED_GROSS` | VAL-003 | `sales_returns_allowances` | 422 | Returns exceed gross |
| `ERR_NEGATIVE_RETURNS` | VAL-003 | `sales_returns_allowances` | 422 | Returns is negative |
| `ERR_NEGATIVE_COGS` | VAL-004 | `cost_of_goods_sold` | 422 | COGS is negative |
| `ERR_NEGATIVE_COMPENSATION` | VAL-005 | `taxable_compensation` | 422 | Compensation is negative |
| `ERR_NEGATIVE_EXCESS_CWT` | VAL-006 | `prior_year_excess_cwt` | 422 | Prior year excess CWT is negative |
| `ERR_COMP_ONLY_WITH_GROSS` | VAL-007 | `gross_receipts` | 422 | Comp-only type but has gross receipts |
| `ERR_SE_WITH_COMPENSATION` | VAL-008 | `taxable_compensation` | 422 | Purely SE type but has compensation |
| `ERR_INCONSISTENT_MIXED_FLAG` | VAL-009 | `is_mixed_income` | 422 | Mixed flag and type mismatch |
| `ERR_NEGATIVE_2307_PAYMENT` | VAL-010 | `cwt_2307_entries[i].income_payment` | 422 | 2307 income payment is negative |
| `ERR_NEGATIVE_2307_WITHHELD` | VAL-011 | `cwt_2307_entries[i].tax_withheld` | 422 | 2307 withheld is negative |
| `ERR_2307_WITHHELD_EXCEEDS_PAYMENT` | VAL-012 | `cwt_2307_entries[i].tax_withheld` | 422 | 2307 withheld > payment |
| `ERR_NEGATIVE_QUARTERLY_PAYMENT` | VAL-013 | `prior_quarterly_payments[i].amount_paid` | 422 | Quarterly payment is negative |
| `ERR_NEGATIVE_NON_OP_INCOME` | VAL-014 | `non_operating_income` | 422 | Non-op income is negative |
| `ERR_NEGATIVE_FWT_INCOME` | VAL-015 | `fwt_income` | 422 | FWT income is negative |
| `ERR_FUTURE_FILING_PERIOD` | VAL-016 | `filing_period` | 422 | Period end date is in the future |
| `ERR_TOO_MANY_QUARTERLY_PAYMENTS` | VAL-017 | `prior_quarterly_payments` | 422 | More than 3 quarterly payment entries |
| `ERR_NEGATIVE_PRIOR_PAYMENT` | VAL-018 | `prior_payment_for_return` | 422 | Prior payment for amended return is negative |
| `ERR_NEGATIVE_EXPENSE_ITEM` | VAL-019 | `itemized_expenses.{sub}` | 422 | Any expense sub-field is negative |
| `ERR_NEGATIVE_COMP_CWT` | VAL-020 | `compensation_cwt` | 422 | Compensation CWT is negative |
| `ERR_DUPLICATE_QUARTERLY_PERIOD` | VAL-021 | `prior_quarterly_payments` | 422 | Two entries for same quarter |
| `ERR_QUARTERLY_PAYMENT_WRONG_PERIOD` | VAL-022 | `prior_quarterly_payments[i].quarter` | 422 | Q4 entered (not valid) |
| `ERR_MIXED_INCOME_NO_COMPENSATION` | VAL-023 | `taxable_compensation` | 422 | Mixed type but zero compensation |
| `ERR_MIXED_INCOME_NO_BUSINESS` | VAL-024 | `gross_receipts` | 422 | Mixed type but zero business income |
| `ERR_2307_PERIOD_INVALID` | VAL-025 | `cwt_2307_entries[i].period_to` | 422 | 2307 period_to < period_from |
| `ERR_DEPRECIATION_INVALID` | VAL-026 | `itemized_expenses.depreciation_entries[i]` | 422 | Invalid depreciation entry fields |
| `ERR_NOLCO_ENTRY_INVALID` | VAL-027 | `itemized_expenses.nolco_entries[i]` | 422 | NOLCO entry has invalid values |
| `ERR_COMPENSATION_ONLY_NO_OPTIMIZER` | VAL-028 | `taxpayer_type` | 422 | Tool does not apply to salaried-only taxpayers |

### 9.2 Ineligibility Errors

| Code | Condition | HTTP |
|------|-----------|------|
| `ERR_ELECTED_INELIGIBLE_PATH_C_VAT` | Elected 8% but VAT-registered | 422 |
| `ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD` | Elected 8% but gross > ₱3M | 422 |
| `ERR_ELECTED_INELIGIBLE_PATH_C_GPP` | Elected 8% but is GPP partner | 422 |
| `ERR_ELECTED_INELIGIBLE_PATH_C_SEC117` | Elected 8% but subject to Sec. 117-128 | 422 |
| `ERR_ELECTED_INELIGIBLE_PATH_C_BMBE` | Elected 8% but BMBE-registered | 422 |

### 9.3 Engine Assertion Errors

| Code | Invariant | HTTP |
|------|-----------|------|
| `ERR_ASSERT_NEGATIVE_IT_DUE` | INV-PA-01 / INV-PB-01 / INV-PC-05 | 500 |
| `ERR_ASSERT_NO_ELIGIBLE_PATHS` | INV-EL-11 | 500 |
| `ERR_ASSERT_RECOMMENDATION_INVALID` | INV-RC-05 | 500 |
| `ERR_ASSERT_SAVINGS_NEGATIVE` | INV-RC-08 | 500 |
| `ERR_ASSERT_OSD_RATIO_INVALID` | INV-PB-03 | 500 |
| `ERR_ASSERT_BALANCE_ARITHMETIC` | INV-BAL-01 | 500 |
| `ERR_ASSERT_INSTALLMENT_ARITHMETIC` | INV-BAL-08 | 500 |
| `ERR_ASSERT_PT_AND_VAT_BOTH_APPLIED` | INV-PT-03 | 500 |

### 9.4 Soft Warnings

| Code | Original | Severity | Short description |
|------|----------|----------|-------------------|
| `WARN_NEAR_VAT_THRESHOLD` | WARN-001 | ADVISORY | Gross within ₱300K of ₱3M VAT limit |
| `WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED` | WARN-002 | ADVISORY | Gross > ₱3M but not VAT-registered |
| `WARN_NO_2307_ENTRIES` | WARN-003 | ADVISORY | No CWT certificates entered |
| `WARN_VERY_LOW_EXPENSES` | WARN-004 | ADVISORY | Expenses < 5% of gross |
| `WARN_NON_OP_INCOME_POSSIBLY_FWT` | WARN-005 | ADVISORY | Non-op income entered but no FWT income |
| `WARN_8PCT_ELECTION_TIMING` | WARN-006 | ADVISORY | 8% elected on Q2/Q3 (must elect on Q1) |
| `WARN_BMBE_EXEMPT_ALL_PATHS_ZERO` | WARN-007 | INFORMATIONAL | BMBE: all paths show ₱0 IT |
| `WARN_GPP_PARTNER_MANUAL_REVIEW` | WARN-008 | ADVISORY | GPP partner complexity |
| `WARN_CWT_EXCEEDS_IT_DUE` | WARN-009 | INFORMATIONAL | Overpayment detected |
| `WARN_ZERO_INCOME` | WARN-010 | INFORMATIONAL | All income fields are ₱0 |
| `WARN_NOLCO_UNDER_PATH_A_ONLY` | WARN-011 | ADVISORY | NOLCO only applies to Path A |
| `WARN_HOME_OFFICE_NOT_EXCLUSIVE` | WARN-012 | ADVISORY | Home office deducted at ₱0 |
| `WARN_CHARITABLE_NOT_ACCREDITED` | WARN-013 | ADVISORY | Charitable deducted at ₱0 |
| `WARN_BAD_DEBTS_CASH_BASIS` | WARN-014 | ADVISORY | Bad debts require accrual basis |
| `WARN_EAR_CAP_APPLIED` | WARN-015 | INFORMATIONAL | EAR capped per Sec. 34(A) |
| `WARN_VEHICLE_DEPRECIATION_CAPPED` | WARN-016 | INFORMATIONAL | Vehicle depreciation capped at ₱2.4M |
| `WARN_UNKNOWN_ATC_CODE` | WARN-017 | ADVISORY | Unknown ATC code, credit not applied |

---

## 10. Error Handling per Pipeline Step

The following table shows which errors each pipeline step can produce and what the step does if the error condition is detected.

| Pipeline step | Errors produced | Warnings produced | Behavior on error |
|--------------|-----------------|-------------------|--------------------|
| PL-01: Input Validation | ERR_INVALID_TAX_YEAR, ERR_NEGATIVE_GROSS, ERR_RETURNS_EXCEED_GROSS, ERR_NEGATIVE_RETURNS, ERR_NEGATIVE_COGS, ERR_NEGATIVE_COMPENSATION, ERR_NEGATIVE_EXCESS_CWT, ERR_COMP_ONLY_WITH_GROSS, ERR_SE_WITH_COMPENSATION, ERR_INCONSISTENT_MIXED_FLAG, ERR_NEGATIVE_2307_PAYMENT, ERR_NEGATIVE_2307_WITHHELD, ERR_2307_WITHHELD_EXCEEDS_PAYMENT, ERR_NEGATIVE_QUARTERLY_PAYMENT, ERR_NEGATIVE_NON_OP_INCOME, ERR_NEGATIVE_FWT_INCOME, ERR_FUTURE_FILING_PERIOD, ERR_TOO_MANY_QUARTERLY_PAYMENTS, ERR_NEGATIVE_PRIOR_PAYMENT, ERR_NEGATIVE_EXPENSE_ITEM, ERR_NEGATIVE_COMP_CWT, ERR_DUPLICATE_QUARTERLY_PERIOD, ERR_QUARTERLY_PAYMENT_WRONG_PERIOD, ERR_MIXED_INCOME_NO_COMPENSATION, ERR_MIXED_INCOME_NO_BUSINESS, ERR_2307_PERIOD_INVALID, ERR_DEPRECIATION_INVALID, ERR_NOLCO_ENTRY_INVALID, ERR_COMPENSATION_ONLY_NO_OPTIMIZER | WARN_NEAR_VAT_THRESHOLD, WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED, WARN_NO_2307_ENTRIES, WARN_VERY_LOW_EXPENSES, WARN_NON_OP_INCOME_POSSIBLY_FWT, WARN_ZERO_INCOME | First ERR encountered aborts computation immediately; all subsequent checks are skipped. All WARN conditions are still evaluated and collected even after a hard error is found, so the API response lists all errors found in one pass (not just the first). |
| PL-02: Taxpayer Classification | None (cannot fail; all inputs validated) | WARN_BMBE_EXEMPT_ALL_PATHS_ZERO, WARN_GPP_PARTNER_MANUAL_REVIEW | No abort. |
| PL-03: Gross Receipts Aggregation | ERR_ASSERT_* possible if arithmetic produces negative aggregates (defensive) | None | Assertion error aborts; logged for developer review. |
| PL-04: Regime Eligibility Check | ERR_ELECTED_INELIGIBLE_PATH_C_VAT, ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD, ERR_ELECTED_INELIGIBLE_PATH_C_GPP, ERR_ELECTED_INELIGIBLE_PATH_C_SEC117, ERR_ELECTED_INELIGIBLE_PATH_C_BMBE | WARN_8PCT_ELECTION_TIMING | If user explicitly elected an ineligible regime: abort. Otherwise: mark path ineligible, attach IN-0N code, continue with eligible paths. |
| PL-05: Itemized Deductions | None (all negative checks in PL-01) | WARN_HOME_OFFICE_NOT_EXCLUSIVE, WARN_CHARITABLE_NOT_ACCREDITED, WARN_BAD_DEBTS_CASH_BASIS, WARN_EAR_CAP_APPLIED, WARN_VEHICLE_DEPRECIATION_CAPPED, WARN_NOLCO_UNDER_PATH_A_ONLY | Warnings only; computation continues. |
| PL-06: OSD | ERR_ASSERT_OSD_RATIO_INVALID | None | Assertion aborts. |
| PL-07: CWT Credits | None | WARN_UNKNOWN_ATC_CODE, WARN_CWT_EXCEEDS_IT_DUE (post PL-14) | Unknown ATC: credit excluded, MRF-021 attached. |
| PL-08: Path A | ERR_ASSERT_NEGATIVE_IT_DUE | None | Assertion aborts. |
| PL-09: Path B | ERR_ASSERT_NEGATIVE_IT_DUE | None | Assertion aborts. |
| PL-10: Path C | ERR_ASSERT_NEGATIVE_IT_DUE | None | Assertion aborts. |
| PL-11: Percentage Tax | ERR_ASSERT_PT_AND_VAT_BOTH_APPLIED | None | Assertion aborts. |
| PL-12: Quarterly Aggregation | None | None | Cannot fail. |
| PL-13: Regime Comparison | ERR_ASSERT_NO_ELIGIBLE_PATHS, ERR_ASSERT_RECOMMENDATION_INVALID, ERR_ASSERT_SAVINGS_NEGATIVE | None | Assertion aborts. |
| PL-14: Balance Computation | ERR_ASSERT_BALANCE_ARITHMETIC, ERR_ASSERT_INSTALLMENT_ARITHMETIC | WARN_CWT_EXCEEDS_IT_DUE | Assertion aborts; warning attached to result. |
| PL-15: Form Field Mapping | None | None | Cannot fail; all field mappings are deterministic from prior steps. |
| PL-16: Penalty Computation | None | None | If penalty computation produces unexpected results, engine logs but does not abort — penalty is informational only. |

---

## 11. API HTTP Error Mapping

The API layer maps engine error codes to HTTP status codes and JSON error response bodies. See [api/endpoints.md](../api/endpoints.md) for the full endpoint contract.

### 11.1 Hard Validation Error Response (HTTP 422)

```json
{
  "success": false,
  "error": {
    "code": "ERR_RETURNS_EXCEED_GROSS",
    "message": "Sales returns and allowances (₱50000) cannot be greater than gross receipts (₱30000).",
    "field": "sales_returns_allowances",
    "validation_code": "VAL-003",
    "severity": "HARD_ERROR"
  },
  "warnings": [],
  "request_id": "req_2026_03_01_abc123"
}
```

**Note on multi-error responses:** When PL-01 is run in "collect all" mode (default for wizard UI), multiple errors may be returned in a single response:

```json
{
  "success": false,
  "errors": [
    {
      "code": "ERR_RETURNS_EXCEED_GROSS",
      "field": "sales_returns_allowances",
      "user_message": "Sales returns and allowances cannot be greater than gross receipts."
    },
    {
      "code": "ERR_NEGATIVE_COMP_CWT",
      "field": "compensation_cwt",
      "user_message": "Tax withheld from compensation cannot be negative."
    }
  ],
  "request_id": "req_2026_03_01_abc123"
}
```

The API collects ALL VAL-* errors in a single pass (not just the first). This allows the frontend to highlight all invalid fields simultaneously.

### 11.2 Ineligibility Error Response (HTTP 422)

```json
{
  "success": false,
  "error": {
    "code": "ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD",
    "message": "Taxpayer elected 8% but threshold_base (₱3500000) exceeds ₱3000000.",
    "user_message": "You selected the 8% flat rate, but your gross receipts (₱3,500,000) exceed the ₱3,000,000 threshold...",
    "field": "elected_regime",
    "severity": "HARD_ERROR"
  },
  "request_id": "req_2026_03_01_def456"
}
```

### 11.3 Engine Assertion Error Response (HTTP 500)

```json
{
  "success": false,
  "error": {
    "code": "ERR_ASSERT_BALANCE_ARITHMETIC",
    "user_message": "An unexpected error occurred during tax computation. Please try again. If the error persists, contact support at support@taxoptimize.ph.",
    "severity": "ASSERTION_ERROR",
    "support_reference": "req_2026_03_01_xyz789"
  },
  "request_id": "req_2026_03_01_xyz789"
}
```

**Security note:** Assertion errors MUST NOT expose internal computation values, stack traces, or input data in the response body. The `support_reference` is the request_id which maps to the server-side log entry containing full diagnostic data.

### 11.4 Success Response with Warnings (HTTP 200)

When computation succeeds but has warnings, the response includes the full result plus warnings:

```json
{
  "success": true,
  "result": {
    "recommended_path": "PATH_C",
    "...": "..."
  },
  "warnings": [
    {
      "code": "WARN_NEAR_VAT_THRESHOLD",
      "severity": "ADVISORY",
      "user_message": "Your gross receipts are within ₱300,000 of the ₱3,000,000 VAT threshold...",
      "field": "gross_receipts"
    }
  ],
  "ineligibility_notes": [],
  "manual_review_flags": [],
  "request_id": "req_2026_03_01_ghi012"
}
```

---

## 12. UI Display Rules

This section defines exactly how each error/warning category is rendered in the frontend. See [frontend/validation-rules.md](../frontend/validation-rules.md) for the comprehensive validation rules, and [frontend/wizard-steps.md](../frontend/wizard-steps.md) for field-level error placement.

### 12.1 Hard Validation Errors in the Wizard

- **Trigger:** Field loses focus (`onBlur`) or user attempts to advance to the next wizard step.
- **Placement:** Immediately below the input field. Red text (color: #DC2626). Font size: 13px. Icon: red circle with exclamation.
- **Field border:** Changes to red border (#DC2626) with red focus ring.
- **Submit button:** Disabled if any hard error is present on the current or any prior step.
- **Multiple errors:** All field errors shown simultaneously. No stacking limit.
- **Example rendering:**
  ```
  ┌─────────────────────────────────────────────────────────┐
  │ Gross Receipts (₱)                                       │
  │ ┌──────────────────────────────────────────────────────┐ │
  │ │ -50,000                                              │ │ ← red border
  │ └──────────────────────────────────────────────────────┘ │
  │ ⚠ Gross receipts cannot be negative. Enter ₱0 or a      │ ← red text, 13px
  │   positive amount.                                        │
  └─────────────────────────────────────────────────────────┘
  ```

### 12.2 Cross-Field Validation Errors

- **Trigger:** When the error spans two or more fields (e.g., ERR_RETURNS_EXCEED_GROSS involves both `gross_receipts` and `sales_returns_allowances`).
- **Placement:** Red inline error shown below the **second** (dependent) field. An orange highlight is also added to the **first** (source) field to indicate it is involved.
- **Also:** A summary error banner appears at the top of the current wizard step with the full user_message.

### 12.3 Ineligibility Errors (Elected Regime Errors)

- **Location:** Results screen — shown instead of the results panel if an ineligibility error fires.
- **Rendering:** Amber/orange alert box (background: #FEF3C7, border: #F59E0B). Heading: "Selected Tax Option Not Available". Body: the user_message. CTA button: "Use Recommended Option Instead" (sets elected_regime to null and recomputes). Secondary link: "Learn More" linking to the 8% option education article.
- **Does not show a partial result** — the entire results panel is replaced by the error.

### 12.4 Engine Assertion Errors

- **Location:** Results screen — shown instead of the results panel.
- **Rendering:** Red error box (background: #FEF2F2, border: #DC2626). Heading: "Something Went Wrong". Body: the user_message (generic, no technical details). CTA: "Try Again" (retries the request). Secondary: "Contact Support" (opens mailto:support@taxoptimize.ph with the request_id pre-filled in the subject).
- **No partial result is shown.**

### 12.5 Soft Warnings (Advisory)

- **Location:** Results screen — appear as amber advisory cards below the main results comparison table, in a "Things to Check" section.
- **Rendering:** Amber card (background: #FFFBEB, border-left: 4px solid #F59E0B). Icon: ⚠ (amber triangle). Heading: short advisory title derived from the warning code (see table below). Body: the user_message. Expandable if user_message > 2 lines ("Show more").
- **Dismissible:** User can dismiss each warning with an ✕ button. Dismissed warnings are remembered in localStorage for 7 days.

**Advisory warning card titles by code:**

| Warning code | Card title |
|-------------|------------|
| `WARN_NEAR_VAT_THRESHOLD` | "Approaching VAT Threshold" |
| `WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED` | "VAT Registration Required" |
| `WARN_NO_2307_ENTRIES` | "Missing Withholding Tax Certificates" |
| `WARN_VERY_LOW_EXPENSES` | "Low Business Expenses Declared" |
| `WARN_NON_OP_INCOME_POSSIBLY_FWT` | "Check Non-Operating Income Classification" |
| `WARN_8PCT_ELECTION_TIMING` | "8% Election Timing Verification Needed" |
| `WARN_GPP_PARTNER_MANUAL_REVIEW` | "GPP Partner — CPA Review Recommended" |
| `WARN_NOLCO_UNDER_PATH_A_ONLY` | "NOLCO Available Only Under Path A" |
| `WARN_HOME_OFFICE_NOT_EXCLUSIVE` | "Home Office Deduction Not Applied" |
| `WARN_CHARITABLE_NOT_ACCREDITED` | "Charitable Contribution Not Deductible" |
| `WARN_BAD_DEBTS_CASH_BASIS` | "Bad Debts Not Deductible on Cash Basis" |
| `WARN_UNKNOWN_ATC_CODE` | "Unrecognized CWT Certificate Code" |

### 12.6 Informational Warnings

- **Rendering:** Blue informational card (background: #EFF6FF, border-left: 4px solid #3B82F6). Icon: ℹ (blue circle). Same placement and dismissal behavior as advisory warnings.

**Informational warning card titles by code:**

| Warning code | Card title |
|-------------|------------|
| `WARN_BMBE_EXEMPT_ALL_PATHS_ZERO` | "BMBE — Income Tax Exempt" |
| `WARN_CWT_EXCEEDS_IT_DUE` | "Overpayment — You May Be Due a Refund" |
| `WARN_ZERO_INCOME` | "Zero Income Entered" |
| `WARN_EAR_CAP_APPLIED` | "Entertainment Expense Capped" |
| `WARN_VEHICLE_DEPRECIATION_CAPPED` | "Vehicle Depreciation Ceiling Applied" |

### 12.7 Manual Review Flags

- **Location:** Results screen — displayed in a distinct "Requires CPA Review" section, separate from the advisory warnings section.
- **Rendering:** Yellow advisory card (background: #FEFCE8, border-left: 4px solid #CA8A04). Icon: 📋 (clipboard). Heading: "Manual Review Required". Sub-heading: the flag code (e.g., "MRF-021"). Body text: the flag's `user_message` and `conservative_assumption` (2 sentences). Footer: "Action: {action_required}" in bold.
- **Not dismissible:** MRF flags remain visible until the user resolves the underlying issue and recomputes.

### 12.8 Ineligibility Notifications (IN-* codes)

- **Location:** Inside the results table, in the Path C row.
- **Rendering:** Path C row shows a strikethrough style with the reason code linked to a tooltip. Example:
  ```
  ┌───────────────────┬──────────────────────────────────────────┐
  │ Path C — 8% Flat  │  Not available ⓘ                         │
  │ Rate              │  [hover: IN-01: VAT-registered taxpayers  │
  │                   │   cannot use the 8% option]               │
  └───────────────────┴──────────────────────────────────────────┘
  ```
- If ALL reasons are IN-01 or IN-02 (i.e., only VAT/threshold-based), a CTA is shown below: "How to become eligible for the 8% option →" (links to the education article on the 8% threshold).
