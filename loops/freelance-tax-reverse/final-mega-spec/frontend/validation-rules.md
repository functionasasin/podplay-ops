# Frontend Validation Rules — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Wizard step definitions: [frontend/wizard-steps.md](wizard-steps.md)
- Engine error states: [engine/error-states.md](../engine/error-states.md)
- Engine data model: [engine/data-model.md](../engine/data-model.md)
- Results views: [frontend/results-views.md](results-views.md)
- User journeys: [frontend/user-journeys.md](user-journeys.md)

---

## Table of Contents

1. [Validation Architecture](#1-validation-architecture)
2. [Error Display Rules](#2-error-display-rules)
3. [Validation Timing Model](#3-validation-timing-model)
4. [Step-Level Validation Rules](#4-step-level-validation-rules)
   - [WS-00 Mode Selection](#ws-00-mode-selection)
   - [WS-01 Taxpayer Profile](#ws-01-taxpayer-profile)
   - [WS-02 Business Type](#ws-02-business-type)
   - [WS-03 Tax Year and Filing Period](#ws-03-tax-year-and-filing-period)
   - [WS-04 Gross Receipts](#ws-04-gross-receipts)
   - [WS-05 Compensation Income](#ws-05-compensation-income)
   - [WS-06 Expense Method Selection](#ws-06-expense-method-selection)
   - [WS-07A Itemized Expenses — General](#ws-07a-itemized-expenses--general)
   - [WS-07B Itemized Expenses — Financial](#ws-07b-itemized-expenses--financial)
   - [WS-07C Itemized Expenses — Depreciation](#ws-07c-itemized-expenses--depreciation)
   - [WS-07D NOLCO Carry-Over](#ws-07d-nolco-carry-over)
   - [WS-08 Creditable Withholding Tax](#ws-08-creditable-withholding-tax)
   - [WS-09 Prior Quarterly Payments](#ws-09-prior-quarterly-payments)
   - [WS-10 Registration and VAT Status](#ws-10-registration-and-vat-status)
   - [WS-11 Regime Election](#ws-11-regime-election)
   - [WS-12 Filing Details](#ws-12-filing-details)
   - [WS-13 Prior Year Carry-Over Credits](#ws-13-prior-year-carry-over-credits)
5. [Cross-Field Validation Rules (GV-Series)](#5-cross-field-validation-rules-gv-series)
6. [Pre-Submission Validation Checklist](#6-pre-submission-validation-checklist)
7. [Dynamic Advisory Rules (DA-Series)](#7-dynamic-advisory-rules-da-series)
8. [Repeatable Entry Validation](#8-repeatable-entry-validation)
9. [Client-Side vs Server-Side Validation Boundary](#9-client-side-vs-server-side-validation-boundary)
10. [Validation State Machine](#10-validation-state-machine)
11. [Peso Field Validation (Universal)](#11-peso-field-validation-universal)
12. [Date Field Validation (Universal)](#12-date-field-validation-universal)
13. [Text Field Validation (Universal)](#13-text-field-validation-universal)
14. [Pre-Submission Warning Accumulation](#14-pre-submission-warning-accumulation)

---

## 1. Validation Architecture

### 1.1 Two-Layer Validation Model

The application uses two layers of validation that run independently:

**Layer 1 — Client-Side (Frontend)**
- Runs in the browser, no API call needed.
- Handles: required field checks, numeric range checks, format checks (TIN, date), cross-field checks within a step, cross-field checks across steps at submission time.
- Result: prevents submission if any hard error exists; displays advisory messages for soft warnings.

**Layer 2 — Server-Side (Engine)**
- Runs during the `/api/v1/compute` POST after the wizard form is submitted.
- Handles: all domain-specific business rule validations (engine error states ERR_001 through ERR_028, WARN_001 through WARN_017).
- Result: HTTP 422 if validation fails, with per-field error array; HTTP 200 with warnings array if warnings present.

### 1.2 Validation Categories

| Category | Code Prefix | Scope | Blocking? |
|----------|-------------|-------|-----------|
| Hard field error | VERR-* | Single field | Yes — blocks "Continue" |
| Cross-field hard error | GV-* | Multiple fields | Yes — blocks "See My Results" |
| Soft advisory (non-blocking) | DA-* | Single or multiple fields | No — shows inline card |
| Pre-submission warning | PSW-* | Multiple fields across steps | No — shows modal summary; user must acknowledge |
| Engine validation error | ERR-* | Engine domain rules | Yes — blocks results display |
| Engine soft warning | WARN-* | Engine domain rules | No — shows in results view |

### 1.3 Error Collection Mode

**On "Continue" click:** collect-all mode — the wizard runs ALL validation rules for the current step and collects every error before displaying them. It does NOT stop at the first error.

**On "See My Results" click:** collect-all mode — the wizard runs ALL cross-field (GV-*) rules and accumulates every error. All errors are displayed simultaneously in a scrollable error summary before blocking.

**On field blur:** single-field mode — only that field's rules run. Error is displayed below the field immediately.

**On keystroke with debounce:** advisory-only mode — DA-series advisories update with 300ms debounce. No hard error messages are shown while the user types (only on blur).

### 1.4 COMPENSATION_ONLY Handling

When `taxpayer_type == COMPENSATION_ONLY`, the wizard continues in a limited mode after the user acknowledges the modal overlay. In this mode:
- Most steps run normally but the engine receives `taxpayer_type = COMPENSATION_ONLY`.
- The engine returns a `COMPENSATION_ONLY` result (no regime comparison; `recommended_regime = null`; all regime rows show `N/A`).
- Validation rules for `PURELY_SE`-only fields are suppressed.
- GV-04 does not apply (compensation-only taxpayers have `taxable_compensation > 0` and `gross_receipts = 0`).

---

## 2. Error Display Rules

### 2.1 Hard Errors (blocking)

- Displayed immediately below the field that triggered them.
- Field border color changes to `#DC2626` (red-600).
- Field label color changes to `#DC2626`.
- Error message text: font-size 13px; color `#DC2626`; prefixed with a warning icon (⚠).
- The field retains its error state until the user corrects the value (re-evaluated on blur or on next keystroke if a timer-based re-evaluation is running).
- If multiple fields on the same step have errors, all errors are shown simultaneously (no sequential disclosure).

### 2.2 Cross-Field Errors (GV-series, shown at submission)

- Displayed in a red error summary panel at the top of the current step OR as a modal overlay.
- Panel title: "Please fix the following before continuing:"
- Errors listed as a bulleted list, each with a link that scrolls to and highlights the offending field.
- User must correct each error and click "See My Results" again.

### 2.3 Advisory Cards (non-blocking)

Advisory cards are colored inline cards shown below a field or section. They never block form progress.

| Advisory Type | Background | Border | Icon | When to use |
|--------------|-----------|--------|------|-------------|
| Amber (warning) | `#FEF3C7` | `#F59E0B` | ⚠ | Important but non-blocking issue the user should know about |
| Orange (strong warning) | `#FED7AA` | `#EA580C` | ⚠ | Tax compliance risk, eligibility lost |
| Blue (info) | `#DBEAFE` | `#3B82F6` | ℹ | Helpful context, neutral information |
| Green (positive) | `#DCFCE7` | `#16A34A` | ✓ | Good news, eligibility confirmed |
| Red (blocking advisory) | `#FEE2E2` | `#DC2626` | ✗ | Same as hard error but styled as card, used for modals |

### 2.4 Pre-Submission Warning Modal

Before the final "See My Results" submission is accepted, if any DA-series advisory is active that the user has not explicitly acknowledged, a modal appears:

- Title: "A few things to confirm before we compute"
- Lists all active high-priority advisories (those with type Orange or Amber that were triggered during the wizard).
- Each advisory shown with a checkbox: "I understand and want to proceed."
- User must check all boxes to enable the "Compute My Tax" button inside the modal.
- Low-priority (Blue, Green) advisories do not appear in this modal.

### 2.5 Real-Time Regime Preview

After `gross_receipts` is entered in WS-04 and throughout the remainder of the wizard, a persistent sidebar or bottom bar (on desktop: right sidebar; on mobile: collapsible bottom bar) shows a live preview:

```
┌─────────────────────────────────────────────────────┐
│  Live Estimate (updates as you type)                │
│                                                     │
│  Path A — Graduated + Itemized:  ₱XX,XXX.XX        │
│  Path B — Graduated + OSD:       ₱XX,XXX.XX        │
│  Path C — 8% Flat Rate:          ₱XX,XXX.XX        │
│  ────────────────────────────────────────────────   │
│  Best estimate:  ₱XX,XXX.XX  (Path C — 8%)  ★      │
└─────────────────────────────────────────────────────┘
```

- Values update with a 500ms debounce after any income or expense field changes.
- If Path C is ineligible (gross > ₱3M, VAT-registered, GPP), its row shows "Not eligible".
- If a path requires itemized expenses not yet entered, its value shows a dash (`—`) until expenses are entered.
- Labeled as "estimate" — final values appear on the Results screen after engine computation.
- If the user is on the COMPENSATION_ONLY path, the preview bar is hidden.

---

## 3. Validation Timing Model

| Event | Rules Triggered |
|-------|----------------|
| Page load / step mount | No validation runs. Fields are empty/default. |
| Field receives focus | No validation. |
| Field loses focus (blur) | Single-field validation rules for that field run. Errors displayed if any. Advisories for that field update. |
| User types (300ms debounce) | DA-series advisories that depend on this field update. No hard errors shown while typing (only on blur). Real-time regime preview updates (500ms debounce). |
| "Continue" button clicked | All validation rules for the current step run (collect-all). All errors displayed. If zero errors: advance to next step. |
| User corrects a field after error | Re-run that field's validation rules immediately on next blur. Clear error if resolved. |
| "See My Results" button clicked (final step) | (1) All remaining single-field rules for the final step. (2) All GV-series cross-field rules. (3) If any errors: show error summary, block submission. (4) If warnings only: show pre-submission warning modal for user acknowledgment. (5) If acknowledged: submit to API. |
| API returns 422 error | Display per-field errors from engine error response on the relevant steps/fields. User must go back and correct. |

---

## 4. Step-Level Validation Rules

### WS-00 Mode Selection

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `mode_selection` | VERR-WS00-01 | Must not be null or unselected. | "Please select what you'd like to compute." | Hard |

### WS-01 Taxpayer Profile

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `taxpayer_type` | VERR-WS01-01 | Must not be null or unselected. | "Please tell us which best describes you." | Hard |

**Conditional flow — COMPENSATION_ONLY:** Upon selecting `COMPENSATION_ONLY`, a modal overlay is displayed before allowing the wizard to advance. See wizard-steps.md §3 for the exact modal text. If user dismisses ("I understand"): continue in limited mode. If user selects "I have business income too": clear selection.

### WS-02 Business Type

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `business_category` | VERR-WS02-01 | Must not be null or `NOT_SURE`. User must select one of the first four options. | "Please select your business type. If unsure, expand the helper guide below." | Hard |
| `is_gpp_partner` | VERR-WS02-02 | Required when `business_category == REGULATED_PROFESSIONAL`. Must be `true` or `false` (not null). | "Please indicate whether you practice through a General Professional Partnership." | Hard |
| `cost_of_goods_sold` | VERR-WS02-03 | Must be ≥ ₱0 (when visible: `business_category == TRADER` or `MIXED_BUSINESS`). | "Cost of goods sold cannot be negative." | Hard |
| `cost_of_goods_sold` | VERR-WS02-04 | Must be ≤ `gross_receipts` (cross-step check; only evaluated when `gross_receipts` is available from WS-04). | "Cost of goods sold cannot exceed your gross receipts. If your COGS exceeded your revenue, you have a gross loss — verify your numbers." | Hard |

**Note on VERR-WS02-04:** This is a cross-step check. It cannot be fully evaluated on the WS-02 step itself because `gross_receipts` is collected in WS-04. This rule is therefore evaluated during pre-submission (GV-02) rather than inline on WS-02. At the WS-02 step, only VERR-WS02-03 (non-negative) is evaluated.

### WS-03 Tax Year and Filing Period

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `tax_year` | VERR-WS03-01 | Must be an integer between 2018 and 2030 (inclusive). | "Please select a valid tax year between 2018 and 2030." | Hard |
| `tax_year` | VERR-WS03-02 | If `mode_selection == ANNUAL`: `tax_year` must be ≤ current calendar year minus 1. (In 2026: `tax_year` ≤ 2025.) Cannot file an Annual ITR for a year still in progress. | "You cannot file an Annual ITR for a year that has not yet ended. For quarterly returns in progress, select 'Quarterly Income Tax Return' mode." | Hard |
| `tax_year` | VERR-WS03-03 | If `mode_selection == QUARTERLY`: `tax_year` must be ≤ current calendar year. (In 2026: `tax_year` ≤ 2026.) | "You cannot file a quarterly return for a future year." | Hard |
| `filing_period` | VERR-WS03-04 | Must not be null. Must be one of the options available for the selected `mode_selection`. | "Please select the filing period." | Hard |
| `filing_period` | VERR-WS03-05 | If `mode_selection == QUARTERLY`: value must be `Q1`, `Q2`, or `Q3`. Value `Q4` is never valid for quarterly income tax. | "Q4 is not a valid quarterly filing period for income tax. Select Annual Return to compute your full-year balance." | Hard |

**Advisory: `tax_year == 2023`** (Amber): "For 2023, there are two rate tables. The OLD TRAIN rates apply to January–December 2022 only. The NEW (lower) TRAIN rates apply to 2023 onwards. This tool applies the 2023+ rate table for Tax Year 2023, which is correct per BIR."

**Advisory: `tax_year <= 2022`** (Blue): "You are computing tax for {tax_year}. The 2018–2022 graduated rate table applies, with higher brackets than the 2023+ table. Verify your rates with BIR issuances for older years."

### WS-04 Gross Receipts

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `gross_receipts` | VERR-WS04-01 | Required — cannot be left empty. | "Please enter your gross receipts. Enter ₱0 if you had no income this period." | Hard |
| `gross_receipts` | VERR-WS04-02 | Must be ≥ ₱0. | "Gross receipts cannot be negative." | Hard |
| `gross_receipts` | VERR-WS04-03 | Must be ≥ `sales_returns_allowances` (cross-field within step). | "Gross receipts cannot be less than your sales returns and allowances." | Hard |
| `gross_receipts` | VERR-WS04-04 | Must be ≤ ₱9,999,999,999.99. | "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us." | Hard |
| `gross_receipts` | VERR-WS04-05 | If `filing_period == Q1` AND `gross_receipts == 0`: non-blocking advisory shown (not a hard error). | Advisory shown (see DA-series). | Advisory |
| `sales_returns_allowances` | VERR-WS04-06 | Must be ≥ ₱0. | "Sales returns and allowances cannot be negative." | Hard |
| `sales_returns_allowances` | VERR-WS04-07 | Must be ≤ `gross_receipts`. | "Returns and allowances cannot exceed your gross receipts." | Hard |
| `non_operating_income` | VERR-WS04-08 | Must be ≥ ₱0. | "Income cannot be negative." | Hard |
| `fwt_income` | VERR-WS04-09 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |

**Real-time advisories on `gross_receipts` change (300ms debounce):**

| Condition | Advisory Type | Text |
|-----------|--------------|------|
| `0 < gross_receipts <= 250000` | Amber | "Your income is ₱250,000 or below. Under the 8% flat rate option, your income tax would be ₱0 — the ₱250,000 is fully exempt. You still need to file a return with BIR." |
| `250000 < gross_receipts <= 3000000` | Green | "You may be eligible for the 8% flat rate option. The optimizer will compare all available methods and recommend the one that saves you the most." |
| `gross_receipts > 3000000` | Orange | "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions." |
| `gross_receipts > 3000000 AND !is_vat_registered` | Orange (appended) | "At this income level, you may be required to register for VAT. See Registration Details in a later step." |
| `gross_receipts == 0` | Amber | "You have entered ₱0 for gross receipts. If you had no income this period, you are still required to file a 'no-income' return with BIR by the deadline." |

### WS-05 Compensation Income

*Step visible when `taxpayer_type == MIXED_INCOME` only.*

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `taxable_compensation` | VERR-WS05-01 | Required (when WS-05 is visible). Cannot be left empty. | "Please enter your taxable compensation. Use ₱0 if your compensation was fully excluded." | Hard |
| `taxable_compensation` | VERR-WS05-02 | Must be ≥ ₱0. | "Taxable compensation cannot be negative." | Hard |
| `taxable_compensation` | VERR-WS05-03 | If `taxpayer_type == MIXED_INCOME` AND `taxable_compensation == 0`: non-blocking advisory. | Advisory: "You entered ₱0 for compensation. If you truly have no salary income, consider selecting 'Purely Self-Employed' instead. If your compensation was below the non-taxable threshold, ₱0 is correct." | Advisory |
| `number_of_employers` | VERR-WS05-04 | Must be one of: `1`, `2`, `3`. No free-text entry. | "Please select the number of employers." | Hard |
| `compensation_cwt` | VERR-WS05-05 | Required (when WS-05 is visible). | "Please enter the total tax withheld from your salary." | Hard |
| `compensation_cwt` | VERR-WS05-06 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `compensation_cwt` | VERR-WS05-07 | Soft check: `compensation_cwt > taxable_compensation × 0.35`. Non-blocking amber advisory. | Advisory: "The tax withheld (₱{compensation_cwt}) appears high relative to your compensation (₱{taxable_compensation}). The maximum income tax rate is 35%. Please double-check your Form 2316 figures." | Advisory |

**Advisory when `number_of_employers > 1`** (Amber): "With multiple employers, your total tax withheld may exceed what a single employer would withhold. The engine will reconcile this at the annual level. Make sure you combine all Form 2316 amounts."

### WS-06 Expense Method Selection

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `expense_input_method` | VERR-WS06-01 | Must not be null or unselected. Must be one of: `ITEMIZED`, `OSD`, `NO_EXPENSES`. | "Please select how you'll enter your expenses." | Hard |

**Conditional behavior on selection:**
- `ITEMIZED` selected → Steps WS-07A, WS-07B, WS-07C, WS-07D are added to the wizard routing.
- `OSD` selected → Steps WS-07A, WS-07B, WS-07C, WS-07D are skipped. Engine receives `ItemizedExpenseInput` with all expense fields = ₱0.
- `NO_EXPENSES` selected → Same as `OSD` for routing. Engine receives `ItemizedExpenseInput` with all expense fields = ₱0.

**Preview advisory when `OSD` or `NO_EXPENSES` selected and `gross_receipts > 0`** (Blue):
"Estimated OSD deduction: ₱{gross_receipts × 0.40 — formatted}. This is 40% of your gross receipts. Taxable income under OSD would be approximately ₱{(gross_receipts - sales_returns_allowances) × 0.60 — formatted}."

### WS-07A Itemized Expenses — General

*All fields in this step are type Peso with default ₱0. All share the same validation rules unless noted.*

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `itemized_expenses.salaries_and_wages` | VERR-WS07A-01 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.sss_philhealth_pagibig_employer_share` | VERR-WS07A-02 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.rent` | VERR-WS07A-03 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.utilities` | VERR-WS07A-04 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.communication` | VERR-WS07A-05 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.office_supplies` | VERR-WS07A-06 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.professional_fees_paid` | VERR-WS07A-07 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.travel_transportation` | VERR-WS07A-08 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.insurance_premiums` | VERR-WS07A-09 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.taxes_and_licenses` | VERR-WS07A-10 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.entertainment_representation` | VERR-WS07A-11 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.home_office_expense` | VERR-WS07A-12 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.home_office_exclusive_use` | VERR-WS07A-13 | Required when `home_office_expense > 0`. Must be answered (true or false). | "Please indicate whether the space is used exclusively for business." | Hard |

**Dynamic advisory on `entertainment_representation > 0`** (Blue): "The BIR caps entertainment deductions at 1% of net revenue for service providers. Your estimated cap is ₱{(gross_receipts - sales_returns_allowances) × 0.01 — formatted}. If you entered more than this, the engine will automatically reduce your deductible amount to the cap."

**Advisory on `home_office_exclusive_use == false` AND `home_office_expense > 0`** (Amber): "Since the space is not exclusively used for business, the BIR home office deduction does NOT apply. Your home office expense of ₱{home_office_expense} will NOT be deducted. To claim a home office deduction, the space must be used only for business activities."

**Advisory on `expense_input_method == ITEMIZED` and running total < `gross_receipts × 0.40`** (Blue, DA-06): "Your itemized expenses total ₱{total_itemized}. This is less than the 40% OSD (₱{osd_amount}). Unless your receipts include more expenses not yet entered, the OSD method may save you more."

**Advisory on `expense_input_method == ITEMIZED` and running total > `gross_receipts × 0.40`** (Green, DA-07): "Your itemized expenses total ₱{total_itemized}, which exceeds the 40% OSD (₱{osd_amount}). Itemized deductions may give you a better result if you have documentation."

### WS-07B Itemized Expenses — Financial

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `itemized_expenses.interest_expense` | VERR-WS07B-01 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.final_taxed_interest_income` | VERR-WS07B-02 | Must be ≥ ₱0 (when visible: `interest_expense > 0`). | "Amount cannot be negative." | Hard |
| `itemized_expenses.casualty_theft_losses` | VERR-WS07B-03 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.is_accrual_basis` | VERR-WS07B-04 | Required — must be explicitly set (true or false). Default is `false` but user must confirm. | "Please indicate whether you use accrual accounting." | Hard |
| `itemized_expenses.bad_debts` | VERR-WS07B-05 | Must be ≥ ₱0 (when visible: `is_accrual_basis == true`). | "Amount cannot be negative." | Hard |
| `itemized_expenses.bad_debts` | VERR-WS07B-06 | If `bad_debts > 0` AND `is_accrual_basis == false`: hard error (field should be hidden in this state, but if somehow shown). | "Bad debts deduction is only available to accrual-basis taxpayers. You indicated you use cash basis accounting. Please correct your accounting method selection or remove this amount." | Hard |
| `itemized_expenses.charitable_contributions` | VERR-WS07B-07 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |
| `itemized_expenses.charitable_accredited` | VERR-WS07B-08 | Required when `charitable_contributions > 0`. Must be answered (true or false). | "Please indicate whether the charitable organization is BIR-accredited." | Hard |
| `itemized_expenses.research_development` | VERR-WS07B-09 | Must be ≥ ₱0. | "Amount cannot be negative." | Hard |

**Dynamic advisory on `interest_expense > 0` AND `final_taxed_interest_income > 0`** (Blue): "BIR requires a reduction to your interest expense deduction: 33% × ₱{final_taxed_interest_income} = ₱{final_taxed_interest_income × 0.33 — formatted} will be subtracted from the gross interest expense. Net deductible interest: ₱{max(0, interest_expense - (final_taxed_interest_income × 0.33)) — formatted}."

**Advisory on `charitable_accredited == false` AND `charitable_contributions > 0`** (Amber): "Donations to non-accredited organizations are NOT deductible under NIRC Sec. 34(H). Your charitable contribution of ₱{charitable_contributions} will be excluded from your deductions. If you have an accreditation certificate from the organization, change your answer to 'Yes'."

**Advisory on `bad_debts > 0` AND `is_accrual_basis == true`** (Blue): "Bad debts claimed: ₱{bad_debts}. The BIR requires documentation showing: (1) the receivable was previously recognized as income, (2) you made collection efforts, and (3) the debt is genuinely uncollectible. Keep your written-off receivable ledger entries and collection attempt records."

### WS-07C Itemized Expenses — Depreciation

*Fields apply to each asset entry N (0-indexed). Validation runs on all entries.*

| Field ID (per entry N) | Rule ID | Rule | Error Message | Error Type |
|------------------------|---------|------|--------------|------------|
| `depreciation_entries[N].asset_name` | VERR-WS07C-01 | Required when the asset entry exists and is not being deleted. Must be non-empty string. | "Please describe this asset." | Hard |
| `depreciation_entries[N].asset_name` | VERR-WS07C-02 | Minimum 2 characters. | "Please enter at least 2 characters." | Hard |
| `depreciation_entries[N].asset_name` | VERR-WS07C-03 | Maximum 100 characters. | "Asset description must be 100 characters or fewer." | Hard |
| `depreciation_entries[N].asset_cost` | VERR-WS07C-04 | Required. | "Please enter the purchase price." | Hard |
| `depreciation_entries[N].asset_cost` | VERR-WS07C-05 | Must be > ₱0. | "Purchase price must be greater than ₱0." | Hard |
| `depreciation_entries[N].salvage_value` | VERR-WS07C-06 | Must be ≥ ₱0. | "Salvage value cannot be negative." | Hard |
| `depreciation_entries[N].salvage_value` | VERR-WS07C-07 | Must be < `asset_cost`. | "Salvage value must be less than the original purchase price." | Hard |
| `depreciation_entries[N].useful_life_years` | VERR-WS07C-08 | Required. Must be an integer between 1 and 50 (inclusive). | "Please select the useful life." | Hard |
| `depreciation_entries[N].acquisition_date` | VERR-WS07C-09 | Required. Must be a valid calendar date. | "Please enter the date this asset was placed in service." | Hard |
| `depreciation_entries[N].acquisition_date` | VERR-WS07C-10 | Must be ≥ 1970-01-01. | "Please enter a valid date in YYYY-MM-DD format." | Hard |
| `depreciation_entries[N].acquisition_date` | VERR-WS07C-11 | Must not be after December 31 of `tax_year`. | "The acquisition date cannot be in the future relative to the tax year being filed." | Hard |
| `depreciation_entries[N].method` | VERR-WS07C-12 | Required. Must be one of: `STRAIGHT_LINE`, `DECLINING_BALANCE`. | "Please select a depreciation method." | Hard |
| `depreciation_entries[N].prior_accumulated_depreciation` | VERR-WS07C-13 | Must be ≥ ₱0 (when visible: `acquisition_date.year < tax_year`). | "Prior depreciation cannot be negative." | Hard |
| `depreciation_entries[N].prior_accumulated_depreciation` | VERR-WS07C-14 | Must be < `asset_cost`. | "Prior accumulated depreciation cannot equal or exceed the original cost of the asset." | Hard |

**Dynamic advisory for vehicles** (`asset_name` case-insensitive contains "car", "van", "vehicle", "truck", "suv", "sedan", "motorcycle", "motorbike"):
- If `asset_cost > 2400000` (Amber): "Vehicle cost exceeds the BIR's ₱2,400,000 ceiling (RR 12-2012). The engine will cap the depreciation base at ₱2,400,000. The excess ₱{asset_cost - 2400000 — formatted} is non-deductible."
- If `asset_cost <= 2400000` AND `asset_cost > 0`: No advisory.

**Entry limit advisory** — if user attempts to add more than 20 entries (Blue): "You have entered 20 depreciation assets. This is the maximum for the online tool. If you have more assets, group similar small assets (e.g., multiple monitors into 'Computer monitors — batch') into a single entry."

**Maximum entry limit — hard cap at 20 entries.** "Add another asset" button is disabled when 20 entries exist.

### WS-07D NOLCO Carry-Over

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `has_nolco` | VERR-WS07D-01 | Required. Must be answered (true or false). Default is false. | "Please indicate whether you have prior-year losses to carry over." | Hard |
| `nolco_entries[N].loss_year` | VERR-WS07D-02 | Required when entry N exists and `has_nolco == true`. | "Please select the year the loss was incurred." | Hard |
| `nolco_entries[N].loss_year` | VERR-WS07D-03 | Must be between `tax_year - 3` and `tax_year - 1` (inclusive). Expired losses cannot be claimed. | "NOLCO can only be carried over for 3 years. Loss from {loss_year} has expired and cannot be claimed in {tax_year}." | Hard |
| `nolco_entries[N].loss_year` | VERR-WS07D-04 | No two entries may share the same `loss_year`. | "You already entered a NOLCO entry for {loss_year}. Each loss year can only appear once." | Hard |
| `nolco_entries[N].original_loss` | VERR-WS07D-05 | Required. Must be > ₱0. | "Please enter the original loss amount." | Hard |
| `nolco_entries[N].original_loss` | VERR-WS07D-06 | Must be > ₱0 (strictly positive; ₱0 loss entries are not meaningful). | "The original net operating loss must be greater than ₱0." | Hard |
| `nolco_entries[N].remaining_balance` | VERR-WS07D-07 | Required. | "Please enter the remaining undeducted balance." | Hard |
| `nolco_entries[N].remaining_balance` | VERR-WS07D-08 | Must be ≥ ₱0. | "Remaining balance cannot be negative." | Hard |
| `nolco_entries[N].remaining_balance` | VERR-WS07D-09 | Must be ≤ `original_loss` for the same entry. | "Remaining balance cannot exceed the original loss amount." | Hard |

**Entry limit:** Maximum 3 NOLCO entries (matching the 3-year carry-over period). "Add another loss year" button is disabled when 3 entries exist.

**Default behavior:** `remaining_balance` auto-populates with the value of `original_loss` when `original_loss` is entered and `remaining_balance` is still ₱0. This is overrideable by the user.

### WS-08 Creditable Withholding Tax

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `has_2307` | VERR-WS08-01 | Required. Must be answered (true or false). | "Please indicate whether you received Form 2307 certificates." | Hard |
| `cwt_2307_entries[N].payor_name` | VERR-WS08-02 | Required when entry N exists. Non-empty, ≥ 2 characters. | "Please enter the name of the client who withheld this tax." | Hard |
| `cwt_2307_entries[N].payor_name` | VERR-WS08-03 | Maximum 200 characters. | "Name must be 200 characters or fewer." | Hard |
| `cwt_2307_entries[N].payor_tin` | VERR-WS08-04 | Optional. If provided: must match pattern `\d{3}-\d{3}-\d{3}(-\d{3})?`. After stripping dashes: 9 or 12 digits total. | "Please enter the TIN in the format XXX-XXX-XXX or XXX-XXX-XXX-XXX (e.g., 123-456-789-000)." | Hard (if entered) |
| `cwt_2307_entries[N].atc_code` | VERR-WS08-05 | Required. Must be one of the listed ATC codes OR "OTHER" with a non-empty free-text value. | "Please select an ATC code." | Hard |
| `cwt_2307_entries[N].atc_code` | VERR-WS08-06 | If "OTHER" selected: the free-text field must be non-empty. Pattern `[A-Z]{2}\d{3,4}` is validated as advisory (not hard-blocked, since unlisted codes are possible). | "Please enter the ATC code." | Hard |
| `cwt_2307_entries[N].income_payment` | VERR-WS08-07 | Required. Must be > ₱0. | "Please enter the income amount." | Hard |
| `cwt_2307_entries[N].income_payment` | VERR-WS08-08 | Must be > ₱0. | "Income payment must be greater than ₱0." | Hard |
| `cwt_2307_entries[N].income_payment` | VERR-WS08-09 | Must be ≥ `tax_withheld` for the same entry. | "The income payment cannot be less than the tax withheld." | Hard |
| `cwt_2307_entries[N].tax_withheld` | VERR-WS08-10 | Required. | "Please enter the amount withheld." | Hard |
| `cwt_2307_entries[N].tax_withheld` | VERR-WS08-11 | Must be ≥ ₱0. | "Tax withheld cannot be negative." | Hard |
| `cwt_2307_entries[N].tax_withheld` | VERR-WS08-12 | Must be ≤ `income_payment`. | "Tax withheld cannot exceed the income payment amount." | Hard |
| `cwt_2307_entries[N].period_from` | VERR-WS08-13 | Required. Must be a valid date. | "Please enter the period start date." | Hard |
| `cwt_2307_entries[N].period_from` | VERR-WS08-14 | Must be within `tax_year` (between January 1 and December 31 of `tax_year`). | "The period dates must fall within tax year {tax_year}." | Hard |
| `cwt_2307_entries[N].period_to` | VERR-WS08-15 | Required. Must be a valid date. | "Please enter the period end date." | Hard |
| `cwt_2307_entries[N].period_to` | VERR-WS08-16 | Must be within `tax_year`. | "The period dates must fall within tax year {tax_year}." | Hard |
| `cwt_2307_entries[N].period_from` + `period_to` | VERR-WS08-17 | `period_from` must be ≤ `period_to`. | "Period start date cannot be after period end date." | Hard |

**Entry limit advisory** — if more than 50 entries are attempted (Hard error at submission): "You have entered more than 50 Form 2307 entries. Please combine multiple forms from the same payor into a single entry."

**ATC classification preview** (shown immediately below the ATC dropdown when a value is selected):

| ATC Selected | Preview Text | Color |
|-------------|-------------|-------|
| WI010, WI011, WI157, WI160, WC010, WI760, WC760 | "This credit will apply to your **income tax** due." | Green |
| PT010 | "This credit applies to your **percentage tax** (2551Q), NOT your income tax. It does not reduce your Form 1701/1701A balance." | Amber |
| OTHER with unrecognized code | "Unrecognized ATC code — this will require manual review. The credit will be flagged and NOT automatically applied until the code is confirmed." | Amber |

**Auto-hint on `income_payment > 0` and known `atc_code`** (Blue, shown below `tax_withheld` field):

| ATC Code | Auto-Hint Text |
|----------|---------------|
| WI010 | "At 5%: ₱{income_payment × 0.05 — formatted} \| At 10%: ₱{income_payment × 0.10 — formatted}" |
| WI011 | "At 5%: ₱{income_payment × 0.05 — formatted} \| At 10%: ₱{income_payment × 0.10 — formatted}" |
| WI157 | "At 15%: ₱{income_payment × 0.15 — formatted}" |
| WI160 | "At 10%: ₱{income_payment × 0.10 — formatted}" |
| WI760 | "At 1% (on ½ remittance): ₱{income_payment × 0.005 — formatted} (0.5% effective rate per RR 16-2023)" |
| WC010 | "At 5%: ₱{income_payment × 0.05 — formatted} \| At 10%: ₱{income_payment × 0.10 — formatted}" |
| WC760 | "At 1% (on ½ remittance): ₱{income_payment × 0.005 — formatted}" |
| PT010 | "At 3%: ₱{income_payment × 0.03 — formatted}" |

**Advisory when `has_2307 == false`** (Blue): "If you worked through platforms like Upwork or Fiverr, check whether your payment processor (e.g., Payoneer, PayPal, GCash) issued you a Form 2307 under BIR RR 16-2023. These may withhold 1% (WI760) on remittances."

### WS-09 Prior Quarterly Payments

*Step visible when `filing_period == ANNUAL` OR `filing_period == Q2` OR `filing_period == Q3`.*

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `has_prior_payments` | VERR-WS09-01 | Required. Must be answered (true or false). | "Please indicate whether you made quarterly tax payments this year." | Hard |
| `prior_quarterly_payments[Q1].amount_paid` | VERR-WS09-02 | Must be ≥ ₱0 (when visible). | "Payment amount cannot be negative." | Hard |
| `prior_quarterly_payments[Q1].date_paid` | VERR-WS09-03 | If entered: must be a valid date between 2018-01-01 and today's date. | "Please enter a valid date." | Hard |
| `prior_quarterly_payments[Q2].amount_paid` | VERR-WS09-04 | Must be ≥ ₱0 (when visible: `filing_period == ANNUAL` OR `filing_period == Q3`). | "Payment amount cannot be negative." | Hard |
| `prior_quarterly_payments[Q2].date_paid` | VERR-WS09-05 | If entered: must be a valid date between 2018-01-01 and today's date. | "Please enter a valid date." | Hard |
| `prior_quarterly_payments[Q3].amount_paid` | VERR-WS09-06 | Must be ≥ ₱0 (when visible: `filing_period == ANNUAL` only). | "Payment amount cannot be negative." | Hard |
| `prior_quarterly_payments[Q3].date_paid` | VERR-WS09-07 | If entered: must be a valid date between 2018-01-01 and today's date. | "Please enter a valid date." | Hard |

**Maximum entry count:** 3 (Q1, Q2, Q3). Enforced by UI — only three entry slots are shown. GV-19 confirms at submission.

### WS-10 Registration and VAT Status

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `is_bir_registered` | VERR-WS10-01 | Required. Must be `YES` or `PLANNING`. | "Please indicate your BIR registration status." | Hard |
| `is_vat_registered` | VERR-WS10-02 | Required. Must be `NO` or `YES`. | "Please indicate whether you are VAT-registered." | Hard |
| `is_bmbe_registered` | VERR-WS10-03 | Required (toggle must be explicitly set). Default is `false`. | "Please indicate whether you are BMBE-registered." | Hard |
| `subject_to_sec_117_128` | VERR-WS10-04 | Required (toggle must be explicitly set). Default is `false`. | "Please indicate whether your business is subject to special percentage taxes." | Hard |

**Advisory when `is_vat_registered == YES`** (Orange): "VAT-registered taxpayers cannot use the 8% flat rate option. The optimizer will compare only Graduated + OSD (Path B) vs Graduated + Itemized Deductions (Path A)."

**Advisory when `is_vat_registered == NO` AND `gross_receipts > 3000000`** (Orange): "Your gross receipts of ₱{gross_receipts} exceed ₱3,000,000. You may be required to register for VAT. Operating above the VAT threshold without VAT registration may result in BIR penalties. Consider consulting a CPA about VAT registration."

**Advisory when `is_bmbe_registered == YES`** (Green): "BMBE-registered businesses are exempt from income tax under RA 9178. The engine will return ₱0 income tax for all paths. You still have percentage tax obligations (3%) if non-VAT registered."

**Advisory when `subject_to_sec_117_128 == YES`** (Amber): "Industry-specific percentage taxes (Sec. 117–128) disqualify you from the 8% flat rate option. The engine will compute Paths A and B only."

**Advisory when `is_bir_registered == PLANNING`** (Amber): "BIR registration is required if your annual income from business or profession exceeds ₱250,000. This tool can still estimate your taxes. Note that you may be subject to penalties for late registration if you are already earning above the threshold."

### WS-11 Regime Election

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `elected_regime` | VERR-WS11-01 | Required. Must be one of: `null` (optimizer), `ELECT_EIGHT_PCT`, `ELECT_OSD`, `ELECT_ITEMIZED`. | "Please select your regime election status." | Hard |
| `elected_regime` | VERR-WS11-02 | If `ELECT_EIGHT_PCT` AND `is_vat_registered == true`: blocking error. | "You indicated you are VAT-registered. The 8% flat rate is NOT available to VAT-registered taxpayers. Please change your election to Graduated + OSD or Graduated + Itemized, or go back and correct your VAT registration status." | Hard (blocking) |
| `elected_regime` | VERR-WS11-03 | If `ELECT_EIGHT_PCT` AND `gross_receipts > 3000000`: blocking error. | "Your gross receipts exceed ₱3,000,000. The 8% flat rate option is only available to taxpayers with gross receipts at or below ₱3,000,000. Please change your election." | Hard (blocking) |
| `elected_regime` | VERR-WS11-04 | If `ELECT_EIGHT_PCT` AND `is_gpp_partner == true`: blocking error. | "GPP partners cannot elect the 8% flat rate. Please change your election." | Hard (blocking) |
| `elected_regime` | VERR-WS11-05 | If `ELECT_EIGHT_PCT` AND `subject_to_sec_117_128 == true`: blocking error. | "Taxpayers subject to special percentage taxes under Sec. 117–128 cannot use the 8% flat rate. Please change your election." | Hard (blocking) |

**Advisory when `elected_regime == null`** (Blue): "The optimizer will compute all eligible methods and present a three-way comparison. The recommended method will be highlighted. You are not locked into the recommendation — it's for planning only."

### WS-12 Filing Details

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `return_type` | VERR-WS12-01 | Required. Must be `ORIGINAL` or `AMENDED`. | "Please indicate whether this is an original or amended return." | Hard |
| `prior_payment_for_return` | VERR-WS12-02 | Must be ≥ ₱0 (when visible: `return_type == AMENDED`). | "Prior payment cannot be negative." | Hard |
| `is_late_filing` | VERR-WS12-03 | Required (toggle). Must be explicitly answered. | "Please indicate whether you are filing after the deadline." | Hard |
| `actual_filing_date` | VERR-WS12-04 | Required when `is_late_filing == true`. Must be a valid date. | "Please enter the filing date." | Hard |
| `actual_filing_date` | VERR-WS12-05 | Must be a valid calendar date (not malformed). | "Please enter a valid date." | Hard |
| `actual_filing_date` | VERR-WS12-06 | Must be strictly after the deadline for the selected `filing_period` and `tax_year`. Deadlines by period: ANNUAL → April 15 of `tax_year + 1`; Q1 → May 15 of `tax_year`; Q2 → August 15 of `tax_year`; Q3 → November 15 of `tax_year`. | "The date you entered is on or before the deadline for this return. If you are filing on time, select 'No' for late filing." | Hard |

**Advisory when `return_type == AMENDED`** (Amber): "Amended returns must be filed within 3 years of the original due date. For tax year {tax_year}, the last date to amend is April 15, {tax_year + 4}. Verify that this deadline has not passed."

**Advisory when `is_late_filing == true`** (Orange, DA-12): "Late filing penalties will be computed and shown in your results. Penalties include: surcharge ({surcharge_rate}), interest (6% or 12% per annum depending on your taxpayer tier), and a compromise penalty."

Note: `surcharge_rate` in the DA-12 advisory text is dynamically computed based on taxpayer tier:
- MICRO tier (gross receipts < ₱3,000,000): 10% surcharge under EOPT
- SMALL tier (₱3,000,000 ≤ gross receipts < ₱20,000,000): 10% surcharge under EOPT
- MEDIUM tier (₱20,000,000 ≤ gross receipts < ₱1,000,000,000): 25% surcharge (standard)
- LARGE tier (gross receipts ≥ ₱1,000,000,000): 25% surcharge (standard)

For most freelancers (below ₱3M), the surcharge rate displayed is "10% (EOPT reduced rate)".

### WS-13 Prior Year Carry-Over Credits

*Step visible when `filing_period == ANNUAL` only.*

| Field ID | Rule ID | Rule | Error Message | Error Type |
|----------|---------|------|--------------|------------|
| `has_prior_year_carryover` | VERR-WS13-01 | Required. Must be answered (true or false). | "Please indicate whether you have a prior year carry-over credit." | Hard |
| `prior_year_excess_cwt` | VERR-WS13-02 | Required when `has_prior_year_carryover == true`. | "Please enter the carry-over credit amount." | Hard |
| `prior_year_excess_cwt` | VERR-WS13-03 | Must be ≥ ₱0 (when visible). | "Credit amount cannot be negative." | Hard |

---

## 5. Cross-Field Validation Rules (GV-Series)

These rules are evaluated during pre-submission (when "See My Results" is clicked). All GV-* rules run in collect-all mode. Errors are displayed in a summary panel at the top of the page before blocking submission.

| GV ID | Rule | Error Message (exact) | Blocking? |
|-------|------|-----------------------|-----------|
| GV-01 | `gross_receipts >= sales_returns_allowances` | "Sales returns (₱{sales_returns_allowances}) cannot exceed gross receipts (₱{gross_receipts}). Please correct your income figures." | Yes |
| GV-02 | `cost_of_goods_sold <= gross_receipts` | "Cost of goods sold (₱{cost_of_goods_sold}) cannot exceed your gross receipts (₱{gross_receipts}). If your costs exceeded revenue, you have a gross loss — verify your numbers." | Yes |
| GV-03 | If `taxpayer_type == MIXED_INCOME`: `taxable_compensation >= 0` (and the step WS-05 was shown: field must not be empty). The advisory about ₱0 compensation is a warning, not a hard block. | "Mixed-income earners must have a compensation income value entered. If you truly have no salary, change your taxpayer type to 'Purely Self-Employed'." | Yes (if field was left empty) |
| GV-04 | If `taxpayer_type == PURELY_SE`: `taxable_compensation == 0` (WS-05 should have been hidden; if for any reason it was accessed, compensation must be ₱0). | "Purely self-employed taxpayers should have ₱0 compensation income. If you have a salary, change your taxpayer type to 'Mixed Income'." | Yes |
| GV-05 | `compensation_cwt <= taxable_compensation` (soft check — amber warning, non-blocking). | Advisory: "Tax withheld (₱{compensation_cwt}) exceeds your taxable compensation (₱{taxable_compensation}). Verify your Form 2316 figures." | No (advisory only) |
| GV-06 | Each `DepreciationEntry`: `salvage_value < asset_cost`. | "For asset '{asset_name}': salvage value (₱{salvage_value}) must be less than purchase price (₱{asset_cost})." | Yes |
| GV-07 | Each `DepreciationEntry`: `prior_accumulated_depreciation < asset_cost`. | "For asset '{asset_name}': prior depreciation (₱{prior_accumulated_depreciation}) cannot equal or exceed the purchase price." | Yes |
| GV-08 | Each `Form2307Entry`: `tax_withheld <= income_payment`. | "For Form 2307 from {payor_name}: tax withheld (₱{tax_withheld}) cannot exceed income payment (₱{income_payment})." | Yes |
| GV-09 | Each `Form2307Entry`: `period_from <= period_to`. | "For Form 2307 from {payor_name}: period start date cannot be after period end date." | Yes |
| GV-10 | Each `NolcoEntry`: `remaining_balance <= original_loss`. | "For NOLCO from {loss_year}: remaining balance (₱{remaining_balance}) cannot exceed the original loss (₱{original_loss})." | Yes |
| GV-11 | If `elected_regime == ELECT_EIGHT_PCT` AND `is_vat_registered == true`. | "You elected the 8% flat rate but you are VAT-registered. The 8% option is not available to VAT-registered taxpayers. Please change your election." | Yes |
| GV-12 | If `elected_regime == ELECT_EIGHT_PCT` AND `gross_receipts > 3000000`. | "You elected the 8% flat rate but your gross receipts exceed ₱3,000,000. The 8% option is only available at or below the ₱3,000,000 threshold." | Yes |
| GV-13 | If `is_late_filing == true` AND `actual_filing_date` is not strictly after the deadline for the selected period and tax year. | "The filing date you entered ({actual_filing_date}) is on or before the deadline for this return. Change 'Are you filing late?' to 'No' or enter a later date." | Yes |
| GV-14 | Each `NolcoEntry`: no duplicate `loss_year` values across all entries. | "You have two NOLCO entries for {loss_year}. Each loss year can only appear once." | Yes |
| GV-15 | Each `QuarterlyPayment`: `amount_paid >= 0`. | "Quarterly payment amounts cannot be negative." | Yes |
| GV-16 | `prior_year_excess_cwt >= 0`. | "Prior year carry-over credit cannot be negative." | Yes |
| GV-17 | If `itemized_expenses.bad_debts > 0` AND `is_accrual_basis == false`. | "Bad debts deduction requires accrual-basis accounting. You indicated you use cash basis. Please correct your accounting method or remove the bad debts amount." | Yes |
| GV-18 | If `itemized_expenses.home_office_expense > 0` AND `home_office_exclusive_use == false`. Advisory (non-blocking): engine sets home office deduction to ₱0. | "Home office deduction requires exclusive business use of the space. Since you indicated mixed use, the engine will set the home office deduction to ₱0. If you have a dedicated business-only room, go back and change the exclusive-use answer." | No (advisory) |
| GV-19 | `prior_quarterly_payments` array length ≤ 3. | "Cannot enter more than 3 quarterly payment entries (Q1, Q2, Q3)." | Yes |
| GV-20 | `cwt_2307_entries` array length ≤ 50. | "Maximum 50 Form 2307 entries allowed. Please combine multiple forms from the same payor into a single entry." | Yes |

---

## 6. Pre-Submission Validation Checklist

When the user clicks "See My Results" on the final step, the frontend runs this sequence before submitting to the API:

**Phase 1 — Re-run all step-level validations.**
For each wizard step that was shown (per the routing matrix), re-run all VERR-* rules for every field on that step. Collect all errors.

**Phase 2 — Run all GV-* cross-field rules.**
Evaluate GV-01 through GV-20. Collect all blocking errors and non-blocking advisories.

**Phase 3 — Display errors if any.**
If any blocking errors exist: show the error summary panel. Stop. Do not submit to API.

**Phase 4 — Collect active high-priority advisories.**
If no blocking errors, collect all currently active non-blocking advisories of type Orange or Amber that the user has not yet acknowledged. These are the DA-series advisories and GV non-blocking warnings.

**Phase 5 — Display pre-submission warning modal.**
If any unacknowledged Orange/Amber advisories exist: show the Pre-Submission Warning Modal with a checkbox per advisory. User must check all boxes to proceed.

**Phase 6 — Submit to API.**
After user acknowledges all warnings (or if there are none), construct the `ComputeRequest` payload from wizard state and submit to `POST /api/v1/compute`.

**Phase 7 — Handle API response.**
- HTTP 200 with warnings: render results view; show engine WARN-* messages as amber advisory cards on the results page.
- HTTP 422 with errors: parse the error array; map each error code to its source field; display field-level errors on the relevant steps; show a summary modal with a "Go back and fix" button.
- HTTP 500: show a generic error message: "Something went wrong on our end. Please try again. If the problem persists, contact support."

---

## 7. Dynamic Advisory Rules (DA-Series)

These advisories are computed client-side from current field values. They update in real-time (300ms debounce on field changes). They do not block form submission.

| DA ID | Trigger Condition | Advisory Type | Advisory Text |
|-------|------------------|---------------|---------------|
| DA-01 | `gross_receipts > 0` AND `gross_receipts <= 250000` | Amber | "Your income is at or below ₱250,000. Under the 8% flat rate, your income tax is ₱0 — you are fully covered by the ₱250,000 exemption. You still need to file a return with BIR." |
| DA-02 | `gross_receipts > 3000000` AND `is_vat_registered == false` | Orange | "Gross receipts exceed ₱3,000,000. The 8% flat rate is unavailable. Consider speaking with a CPA about VAT registration obligations." |
| DA-03 | `is_vat_registered == true` | Orange | "VAT-registered taxpayers cannot use the 8% flat rate. Only Paths A and B will be computed." |
| DA-04 | `is_bmbe_registered == true` | Green | "BMBE-registered businesses are exempt from income tax. All paths will show ₱0 income tax due." |
| DA-05 | `is_gpp_partner == true` | Amber | "GPP partners cannot use the 8% flat rate. The computation will be limited to Paths A and B, with certain items flagged for manual review." |
| DA-06 | `expense_input_method == ITEMIZED` AND `total_itemized < gross_receipts × 0.40` | Blue | "Your itemized expenses total ₱{total_itemized}. This is less than the 40% OSD (₱{gross_receipts × 0.40}). Unless your receipts include more expenses not yet entered, the OSD method may save you more." |
| DA-07 | `expense_input_method == ITEMIZED` AND `total_itemized > gross_receipts × 0.40` | Green | "Your itemized expenses total ₱{total_itemized}, which exceeds the 40% OSD (₱{gross_receipts × 0.40}). Itemized deductions may give you a better result if you have documentation." |
| DA-08 | Sum of all `cwt_2307_entries.tax_withheld` (WI/WC series only) > estimated income tax under best live-estimated path | Blue | "Your CWT credits (₱{total_cwt}) may exceed your estimated income tax due. You may have an overpayment. The results screen will show your options: carry over, refund, or TCC." |
| DA-09 | `return_type == AMENDED` | Amber | "Amended returns must be filed within 3 years of the original due date. For tax year {tax_year}, the last date to amend is April 15, {tax_year + 4}. Verify that this deadline has not passed." |
| DA-10 | `filing_period == ANNUAL` AND `prior_quarterly_payments` array is empty (all amounts ₱0 or not entered) | Blue | "You have not entered any quarterly tax payments. If you filed quarterly returns (1701Q) for Q1, Q2, or Q3, those payments reduce your annual balance. Go back to add them if applicable." |
| DA-11 | Any `cwt_2307_entries[N].atc_code == PT010` | Amber | "Form 2307 with ATC PT010 is a percentage tax credit — it applies to your 2551Q percentage tax, NOT your income tax. This will be shown separately in your results." |
| DA-12 | `is_late_filing == true` | Orange | "Late filing penalties will be computed and shown in your results. Penalties include: surcharge ({surcharge_rate}), interest (6% or 12% per annum depending on your tier), and a compromise penalty." |
| DA-13 | `tax_year <= 2022` | Blue | "You are computing for tax year {tax_year}. Older rate tables apply. Verify your results against BIR issuances for that year." |
| DA-14 | All `cwt_2307_entries` have `atc_code == WI760` (and at least one entry exists) | Blue | "All your Form 2307 entries use WI760 (RR 16-2023 platform withholding). This is correct for Upwork/Fiverr payments via Payoneer or GCash. The 1% rate applies on half the remittance amount (0.5% effective rate)." |

**total_itemized** computation (for DA-06/DA-07):
```
total_itemized =
  salaries_and_wages
  + sss_philhealth_pagibig_employer_share
  + rent
  + utilities
  + communication
  + office_supplies
  + professional_fees_paid
  + travel_transportation
  + insurance_premiums
  + taxes_and_licenses
  + min(entertainment_representation, (gross_receipts - sales_returns_allowances) × 0.01)
  + home_office_expense (if home_office_exclusive_use == true, else 0)
  + interest_expense - (final_taxed_interest_income × 0.33) [floor at 0]
  + casualty_theft_losses
  + bad_debts (if is_accrual_basis == true, else 0)
  + charitable_contributions (if charitable_accredited == true, else 0)
  + research_development
  + sum(each DepreciationEntry: estimated_annual_deduction)
  + sum(each NolcoEntry: remaining_balance)
```

For the live preview, `estimated_annual_deduction` per depreciation entry is computed as:
- STRAIGHT_LINE: `(asset_cost - salvage_value) / useful_life_years`
  - Prorated in the acquisition year: `× (months_from_acquisition_month_to_December / 12)`, where `months_from_acquisition_month_to_December = 13 - acquisition_month` (January = 1).
  - For prior years (`acquisition_date.year < tax_year`): no proration; full year deduction = `(asset_cost - salvage_value) / useful_life_years`.
  - Remaining book value check: deduction ≤ `(asset_cost - salvage_value) - prior_accumulated_depreciation`.
- DECLINING_BALANCE: `(book_value × (2 / useful_life_years))` where `book_value = asset_cost - prior_accumulated_depreciation`. Result floored at ₱0.

---

## 8. Repeatable Entry Validation

### 8.1 Validation Scope for Repeatable Lists

For all repeatable entry types (depreciation entries, Form 2307 entries, NOLCO entries, quarterly payments), validation runs on EACH entry independently. An error in entry N does not suppress errors in entry M.

### 8.2 Empty Entry Handling

- An entry that was added (form shown) but left entirely blank is treated as: user abandoned entry. Behavior: if all fields are at their default values (empty string or ₱0), the "Continue" click shows an error if required fields are empty. However, if the user explicitly clicks "Remove this asset" or equivalent delete button, the entry is deleted and no validation runs for it.
- An entry that has ANY non-default value filled in is treated as a started entry: all required fields for that entry must be completed.

### 8.3 Add/Remove Button Behavior

| Entry Type | Add Button Label | Remove Button Label | Confirmation Required |
|-----------|-----------------|--------------------|-----------------------|
| Depreciation asset | "+ Add another asset" | "Remove this asset" | No |
| Form 2307 certificate | "+ Add another Form 2307" | "Remove this Form 2307" | No |
| NOLCO loss year | "+ Add another loss year" | "Remove this loss year" | No |

### 8.4 Maximum Entry Counts (hard UI limits)

| Entry Type | Maximum Count | Over-limit behavior |
|-----------|--------------|---------------------|
| Depreciation entries | 20 | "Add another asset" button disabled at 20 entries. |
| Form 2307 entries | 50 | "Add another Form 2307" button disabled at 50 entries. |
| NOLCO entries | 3 | "Add another loss year" button disabled at 3 entries. |
| Quarterly payment periods | 3 (Q1, Q2, Q3) | Fixed number of slots shown; no add button. |

### 8.5 Minimum Entry Counts

| Entry Type | Minimum when shown | Behavior at minimum |
|-----------|-------------------|---------------------|
| Depreciation entries | 0 (user may click "Skip depreciation") | If skip clicked: `depreciation_entries = []` |
| Form 2307 entries | 1 (required when `has_2307 == true`) | Cannot advance from WS-08 with `has_2307 == true` and zero entries |
| NOLCO entries | 1 (required when `has_nolco == true`) | Cannot advance from WS-07D with `has_nolco == true` and zero entries |
| Quarterly payment periods | 0 (all amounts may be ₱0 or empty) | All ₱0 is valid; means no prior payments were made |

---

## 9. Client-Side vs Server-Side Validation Boundary

### 9.1 Client-Side Only (no API call required)

The following validations are entirely client-side and must be implemented in the frontend:

| Validation Type | Why client-side |
|----------------|----------------|
| Required field checks (VERR-* rules) | Instant feedback; no domain knowledge needed |
| Numeric range checks (≥ 0, max value) | Simple arithmetic |
| Cross-field comparisons within a step (e.g., VERR-WS04-03: gross_receipts ≥ sales_returns) | Both values available in client state |
| Date format validation | Simple regex/date parse |
| Date range validation (within tax_year, not future) | Arithmetic with known tax_year |
| TIN format validation (regex) | Pattern matching |
| Text length checks (2–200 chars) | Character counting |
| ATC code classification (known ATC → credit type) | Lookup table hard-coded in frontend |
| GV-01 through GV-20 cross-field rules | All values available in client form state |
| DA-series advisories | Arithmetic on client-side field values |
| Mode-selection routing (which steps show) | State machine; no domain knowledge needed |
| Peso field behavior (commas, prefix, paste stripping) | UI behavior |
| Real-time live estimate preview | Simplified arithmetic |

### 9.2 Server-Side Only (API required)

The following validations are performed only by the engine on the server:

| Validation Type | Engine Error Code | Why server-side |
|----------------|-----------------|----------------|
| Confirmed 8% eligibility computation | ERR_ELECTED_INELIGIBLE_PATH_C_* | Requires full engine pipeline |
| EAR cap computation | WARN-013 (engine warns) | Requires NTI computed first |
| NOLCO suspension check (current-year NTI negative) | ERR-NOLCO-ENTRY-INVALID / WARN-010 | Requires NTI computation |
| Breakeven verification (is the recommended regime truly optimal) | — (engine always computes all paths) | Requires full tax computation |
| Penalty computation (exact surcharge + interest + compromise) | — | Requires tax_due and filing dates |
| MRF flag generation | MRF-001 through MRF-025 | Domain knowledge in engine |
| Percentage tax computation (quarterly 2551Q) | — | Domain computation |
| VAT vs percentage tax determination | — | Domain threshold check |
| Form 1701 / 1701A field mapping | — | Engine output structure |
| EOPT taxpayer tier classification | — | Engine classification logic |

### 9.3 Validation Overlap (both layers check independently)

Some rules are checked on both client AND server for defense in depth:

| Rule | Client Rule | Server Rule |
|------|------------|------------|
| 8% ineligibility if VAT-registered | GV-11 / VERR-WS11-02 | ERR_ELECTED_INELIGIBLE_PATH_C_VAT_REGISTERED |
| 8% ineligibility if gross > ₱3M | GV-12 / VERR-WS11-03 | ERR_ELECTED_INELIGIBLE_PATH_C_GROSS_EXCEEDS_THRESHOLD |
| GPP 8% ineligibility | VERR-WS11-04 | ERR_ELECTED_INELIGIBLE_PATH_C_GPP_PARTNER |
| Bad debts requires accrual | GV-17 / VERR-WS07B-06 | ERR_ASSERT (engine behavior) |
| Negative amounts | All VERR-*-01 to *-09 negative checks | ERR_NEGATIVE_GROSS, ERR_NEGATIVE_EXPENSES, etc. |
| Cross-entry integrity (2307: tax ≤ income) | GV-08 | ERR_2307_TAX_EXCEEDS_INCOME |

---

## 10. Validation State Machine

The wizard step state machine has these states per step:

| State | Description | Visual Indicator |
|-------|-------------|-----------------|
| `PENDING` | Step not yet reached. | Step number in progress bar: gray, unfilled. |
| `ACTIVE` | Current step being filled. | Step number: blue, active indicator. |
| `VALID` | Step completed, all rules passed. | Step number: green checkmark. |
| `INVALID` | Step has been "continued past" but has a pending error (can occur if user goes back and introduces an error). | Step number: red exclamation mark. |
| `SKIPPED` | Step not applicable to this user's path per routing matrix. | Step does not appear in progress bar. |

**Step completion:** A step transitions from `ACTIVE` to `VALID` when "Continue" is clicked and all VERR-* rules for that step pass.

**Backward navigation:** User may click any previously completed step in the progress bar to return to it. Editing a prior step may invalidate cross-field checks; these are not re-evaluated until "See My Results" is clicked.

**Dirty state tracking:** When the user edits any field, the "See My Results" button on the final step shows a "Recalculate" indicator if results were previously computed and the form has since been modified.

---

## 11. Peso Field Validation (Universal)

All fields with type "peso" apply these rules universally, in addition to any field-specific rules:

| Rule ID | Rule | Error Message |
|---------|------|--------------|
| PESO-01 | Input must be numeric (digits, at most one decimal point, at most two decimal places). Non-numeric characters are stripped on paste; typing non-numeric characters is silently ignored. | (No error message — invalid chars are rejected silently) |
| PESO-02 | Value must be ≥ 0 (unless field-specific rules allow negative — none do in this application). | "Amount cannot be negative." |
| PESO-03 | Value must be ≤ 9,999,999,999.99. | "Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us." |
| PESO-04 | Empty field treatment: if field is `Required = No`: empty is treated as ₱0 (valid). If field is `Required = Yes`: empty triggers the field-specific required error. | Field-specific error message. |
| PESO-05 | On blur: format number with comma thousands separators and two decimal places. Example: "1200000" → displays as "1,200,000.00". | (Formatting, not validation) |
| PESO-06 | "₱" prefix is a non-editable display element. It is prepended as a left adornment. It is not part of the field's raw value. | (Display rule) |
| PESO-07 | On paste: strip all characters except digits and a single decimal point. Strip leading zeros. | (Sanitization, not validation) |

---

## 12. Date Field Validation (Universal)

All fields with type "date" or "date picker" apply these rules:

| Rule ID | Rule | Error Message |
|---------|------|--------------|
| DATE-01 | Must be a valid calendar date. Invalid dates (e.g., February 30, month 13) are rejected. | "Please enter a valid date." |
| DATE-02 | Must use format YYYY-MM-DD in storage (HTML `type="date"` inputs). Display format: "MMM DD, YYYY" (e.g., "Jan 15, 2025"). | "Please enter a valid date." |
| DATE-03 | Minimum date: 1970-01-01 (reasonable bound for all date fields in this application). | "Please enter a valid date." |
| DATE-04 | Maximum date: varies by field. See field-specific rules. For most fields, max is December 31 of `tax_year + 1`. | Field-specific error. |

---

## 13. Text Field Validation (Universal)

All fields with type "text" apply these rules:

| Rule ID | Rule | Error Message |
|---------|------|--------------|
| TEXT-01 | Leading and trailing whitespace is trimmed before validation. | (Sanitization) |
| TEXT-02 | Empty string after trimming is treated as "no value entered" — triggers required error if field is Required. | Field-specific required error. |
| TEXT-03 | HTML special characters (`<`, `>`, `"`, `'`, `&`) are HTML-escaped before storage and display. No raw HTML is accepted. | (Security sanitization, silent) |
| TEXT-04 | Maximum lengths vary by field. Defaults: 200 characters unless field specifies otherwise. | "Please shorten your input to {max_length} characters or fewer." |

---

## 14. Pre-Submission Warning Accumulation

The following table lists every DA-series or GV-series non-blocking advisory that can appear in the Pre-Submission Warning Modal (the modal that requires user acknowledgment before final submission). Only Orange and Amber type advisories require acknowledgment.

| Advisory | Type | Requires Modal Acknowledgment? |
|----------|------|-------------------------------|
| DA-01 (income ≤ ₱250K, 8% = ₱0) | Amber | Yes |
| DA-02 (gross > ₱3M, 8% unavailable, VAT risk) | Orange | Yes |
| DA-03 (VAT-registered, 8% unavailable) | Orange | Yes |
| DA-04 (BMBE exempt) | Green | No |
| DA-05 (GPP partner, limited paths) | Amber | Yes |
| DA-06 (itemized total < OSD, OSD may be better) | Blue | No |
| DA-07 (itemized total > OSD, itemized may be better) | Green | No |
| DA-08 (CWT may exceed tax, overpayment) | Blue | No |
| DA-09 (amended return, deadline check) | Amber | Yes |
| DA-10 (no quarterly payments entered) | Blue | No |
| DA-11 (PT010 credit applies to 2551Q, not income tax) | Amber | Yes |
| DA-12 (late filing, penalties incoming) | Orange | Yes |
| DA-13 (old tax year, older rate table) | Blue | No |
| DA-14 (all WI760, platform withholding) | Blue | No |
| GV-05 (comp CWT > compensation — advisory) | Amber | Yes |
| GV-18 (home office non-exclusive, deduction zeroed) | Advisory (Amber) | Yes |

**Modal display order:** Orange advisories are listed before Amber advisories. Within each type, they appear in DA-number order. Each advisory is shown with its full text as shown in the DA-series table above.

**Modal title:** "A few things to confirm before we compute"

**Modal body:** One checkbox per advisory listed, with label text matching the advisory text.

**Modal footer:**
- "Compute My Tax" button: enabled only when all checkboxes are checked.
- "Go Back and Review" button: closes modal, returns user to wizard step (no change to form state).

---

## Appendix A: Validation Rule Index

Complete sorted list of all VERR-* rules, GV-* rules, and advisory rules with their governing fields:

| Rule ID | Field | Type | Step |
|---------|-------|------|------|
| VERR-WS00-01 | mode_selection | Hard | WS-00 |
| VERR-WS01-01 | taxpayer_type | Hard | WS-01 |
| VERR-WS02-01 | business_category | Hard | WS-02 |
| VERR-WS02-02 | is_gpp_partner | Hard | WS-02 |
| VERR-WS02-03 | cost_of_goods_sold | Hard | WS-02 |
| VERR-WS02-04 | cost_of_goods_sold | Hard | Pre-submission (GV-02) |
| VERR-WS03-01 | tax_year | Hard | WS-03 |
| VERR-WS03-02 | tax_year | Hard | WS-03 |
| VERR-WS03-03 | tax_year | Hard | WS-03 |
| VERR-WS03-04 | filing_period | Hard | WS-03 |
| VERR-WS03-05 | filing_period | Hard | WS-03 |
| VERR-WS04-01 | gross_receipts | Hard | WS-04 |
| VERR-WS04-02 | gross_receipts | Hard | WS-04 |
| VERR-WS04-03 | gross_receipts | Hard | WS-04 |
| VERR-WS04-04 | gross_receipts | Hard | WS-04 |
| VERR-WS04-05 | gross_receipts | Advisory | WS-04 |
| VERR-WS04-06 | sales_returns_allowances | Hard | WS-04 |
| VERR-WS04-07 | sales_returns_allowances | Hard | WS-04 |
| VERR-WS04-08 | non_operating_income | Hard | WS-04 |
| VERR-WS04-09 | fwt_income | Hard | WS-04 |
| VERR-WS05-01 | taxable_compensation | Hard | WS-05 |
| VERR-WS05-02 | taxable_compensation | Hard | WS-05 |
| VERR-WS05-03 | taxable_compensation | Advisory | WS-05 |
| VERR-WS05-04 | number_of_employers | Hard | WS-05 |
| VERR-WS05-05 | compensation_cwt | Hard | WS-05 |
| VERR-WS05-06 | compensation_cwt | Hard | WS-05 |
| VERR-WS05-07 | compensation_cwt | Advisory | WS-05 |
| VERR-WS06-01 | expense_input_method | Hard | WS-06 |
| VERR-WS07A-01 through VERR-WS07A-13 | itemized_expenses (general) | Hard/Advisory | WS-07A |
| VERR-WS07B-01 through VERR-WS07B-09 | itemized_expenses (financial) | Hard/Advisory | WS-07B |
| VERR-WS07C-01 through VERR-WS07C-14 | depreciation_entries (per entry) | Hard/Advisory | WS-07C |
| VERR-WS07D-01 through VERR-WS07D-09 | nolco_entries / has_nolco | Hard | WS-07D |
| VERR-WS08-01 through VERR-WS08-17 | cwt_2307_entries / has_2307 | Hard/Advisory | WS-08 |
| VERR-WS09-01 through VERR-WS09-07 | prior_quarterly_payments | Hard | WS-09 |
| VERR-WS10-01 through VERR-WS10-04 | registration fields | Hard/Advisory | WS-10 |
| VERR-WS11-01 through VERR-WS11-05 | elected_regime | Hard | WS-11 |
| VERR-WS12-01 through VERR-WS12-06 | return_type, is_late_filing, actual_filing_date | Hard/Advisory | WS-12 |
| VERR-WS13-01 through VERR-WS13-03 | prior_year_excess_cwt | Hard | WS-13 |
| GV-01 through GV-20 | Cross-field | Hard/Advisory | Pre-submission |
| DA-01 through DA-14 | Various | Advisory | Real-time |
| PESO-01 through PESO-07 | All peso fields | Universal | All |
| DATE-01 through DATE-04 | All date fields | Universal | All |
| TEXT-01 through TEXT-04 | All text fields | Universal | All |
