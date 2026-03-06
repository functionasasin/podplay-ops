# Fix TypeScript Input Types — TaxKlaro Spec Section 5

**Wave:** 7.5b (Cross-Layer Fix)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** cross-layer-consistency analysis (which identified the 14 divergences)

---

## Summary

Section 5 (TypeScript Types) and Section 3 (Rust Types) in `docs/plans/freelance-tax-spec.md`
were assembled from a simplified UI-first model rather than the engine's actual data model.
This analysis documents all 14+ field-level divergences and their fixes.

The authoritative source is `analysis/typescript-types.md` (Wave 3, fully verified against
serde-wire-format and the domain spec engine/data-model.md).

---

## Changes Applied to docs/plans/freelance-tax-spec.md

### Section 3 (Rust Data Model) — Enumerations

**Removed wrong enums:**
- `FilingMode` (Annual/Quarterly) → replaced by `FilingPeriod` (Q1/Q2/Q3/Annual)
- `BusinessNature` (Professional/Trader/Both) → replaced by `TaxpayerClass` (ServiceProvider/Trader)
- `VatStatus` (VatRegistered/NonVat/ExemptFromVat) → becomes `is_vat_registered: bool`
- `BirFormVariant` (GraduatedItemized/GraduatedOsd/EightPercent) → removed (not in engine output)
- `InstallmentEligibility` (Eligible/NotEligible/NotApplicable) → becomes `installment_eligible: bool`
- `Quarter` (Q1/Q2/Q3/Q4 as string enum) → becomes `u8` (1, 2, 3)
- `ExpenseMethod` → renamed `DeductionMethod` (added `None` variant)
- `TaxRegimePath` → renamed `RegimePath`
- `BirFormType` → renamed `FormType` (variants: Form1701/Form1701a/Form1701q — no Form2551Q)
- `DepreciationMethod` variants: `DoubleDecliningBalance/SumOfYearsDigits` → single `DecliningBalance`

**Added correct enums:**
- `FilingPeriod`: Q1/Q2/Q3/Annual
- `TaxpayerClass`: ServiceProvider/Trader
- `IncomeType`: PurelySe/MixedIncome/CompensationOnly/ZeroIncome (derived, output only)
- `RegimePath`: PathA/PathB/PathC
- `DeductionMethod`: Itemized/Osd/None
- `RegimeElection`: ElectEightPct/ElectOsd/ElectItemized
- `BalanceDisposition`: BalancePayable/ZeroBalance/Overpayment
- `ReturnType`: Original/Amended
- `FormType`: Form1701/Form1701a/Form1701q
- `CwtClassification`: IncomeTaxCwt/PercentageTaxCwt/Unknown
- `DepreciationMethod`: StraightLine/DecliningBalance

### Section 3 (Rust Data Model) — TaxpayerInput Struct

**Removed wrong fields:**
| Old field | Old type | Problem |
|-----------|---------|---------|
| `business_nature: BusinessNature` | enum | Wrong type; class is derived |
| `filing_mode: FilingMode` | enum | Wrong enum type |
| `vat_status: VatStatus` | enum | Should be bool |
| `gross_receipts_amount: Decimal` | Decimal | Wrong name (missing "amount" suffix) |
| `has_compensation_income: bool` | bool | Not in domain spec |
| `compensation_income: Option<Decimal>` | Option | Replaced by taxable_compensation |
| `expense_method: Option<ExpenseMethod>` | Option | Replaced by elected_regime |
| `nolco_entries: Option<Vec<NolcoEntry>>` | Option | Moved inside ItemizedExpenseInput |
| `depreciation_entries: Option<Vec<DepreciationEntry>>` | Option | Moved inside ItemizedExpenseInput |
| `form_2307_entries: Option<Vec<Form2307Entry>>` | Option | Wrong name, should be cwt_2307_entries |
| `elected_8_percent: Option<bool>` | Option | Replaced by elected_regime |
| `has_prior_year_excess_credits: bool` | bool | Not in domain spec |
| `prior_year_excess_credits: Option<Decimal>` | Option | Wrong name |
| `bir_rdo_code: Option<String>` | Option | Profile field, not computation input |
| `registered_address: Option<String>` | Option | Profile field, not computation input |

**Added correct fields:**
| New field | Type | Source |
|-----------|------|--------|
| `filing_period: FilingPeriod` | enum | Correct replacement for filing_mode |
| `is_mixed_income: bool` | bool | Explicit redundant flag per domain spec |
| `is_vat_registered: bool` | bool | Replaces vat_status enum |
| `is_bmbe_registered: bool` | bool | New (BMBE registration exemption) |
| `subject_to_sec_117_128: bool` | bool | New (industry-specific tax) |
| `is_gpp_partner: bool` | bool | New (GPP partnership) |
| `gross_receipts: Decimal` | Decimal | Correct name (no "amount" suffix) |
| `sales_returns_allowances: Decimal` | Decimal | New (reduces threshold base) |
| `non_operating_income: Decimal` | Decimal | New (passive income) |
| `fwt_income: Decimal` | Decimal | New (final withholding tax income) |
| `cost_of_goods_sold: Decimal` | Decimal | New (for TRADER classification) |
| `taxable_compensation: Decimal` | Decimal | Replaces compensation_income |
| `compensation_cwt: Decimal` | Decimal | New (CWT on compensation) |
| `itemized_expenses: ItemizedExpenseInput` | struct | Now always required (zero-filled if N/A) |
| `elected_regime: Option<RegimeElection>` | Option | Replaces elected_8_percent + expense_method |
| `osd_elected: Option<bool>` | Option | Explicit OSD election flag |
| `cwt_2307_entries: Vec<Form2307Entry>` | Vec | Correct name (cwt_ prefix) |
| `prior_year_excess_cwt: Decimal` | Decimal | Correct name |
| `return_type: ReturnType` | enum | New (original vs amended) |
| `prior_payment_for_return: Decimal` | Decimal | New (for amended returns) |
| `overpayment_preference: Option<OverpaymentDisposition>` | Option | Renamed from prior_year_excess_credits |

### Section 3 — ItemizedExpenseInput Struct

Old spec had **11 fields**; domain spec requires **23 fields**.

Added fields:
- `sss_philhealth_pagibig_employer_share` (was `sss_gsis_contributions`)
- `professional_fees_paid` (was `professional_fees`)
- `travel_transportation` (was `transportation`)
- `insurance_premiums` (was absent)
- `final_taxed_interest_income` (new — for arbitrage reduction)
- `taxes_and_licenses` (was `taxes_and_licenses` mapped to different concept)
- `casualty_theft_losses` (new)
- `bad_debts` (new)
- `is_accrual_basis: bool` (new)
- `depreciation_entries: Vec<DepreciationEntry>` (moved from TaxpayerInput)
- `charitable_contributions` (kept)
- `charitable_accredited: bool` (new)
- `research_development` (new)
- `entertainment_representation` (was `representation_expenses`)
- `home_office_expense` (new)
- `home_office_exclusive_use: bool` (new)
- `nolco_entries: Vec<NolcoEntry>` (moved from TaxpayerInput)

Removed: `rental_expense` (renamed to `rent`), `miscellaneous` (no such category in NIRC)

### Section 3 — Form2307Entry Struct

**Old wrong fields:**
- `withholding_agent_name: String` → `payor_name: String`
- `tin: String` → `payor_tin: String`
- `quarter: Quarter` → `quarter_of_credit: Option<u8>`
- `amount_of_income_payment: Decimal` → `income_payment: Decimal`
- (kept) `tax_withheld: Decimal`

**Added missing fields:**
- `atc_code: String` (critical for CWT classification)
- `period_from: String` (ISO date)
- `period_to: String` (ISO date)

### Section 3 — TaxComputationResult Output Struct

The old struct used `path_a/path_b/path_c` as top-level optional fields and simplified output.
The correct struct matches analysis/typescript-types.md TaxComputationResult with:
- `input_summary: InputSummary` (echoed input)
- `comparison: Vec<RegimeOption>` (3-way comparison)
- `recommended_regime: RegimePath` (not `recommended_path`)
- `selected_path: RegimePath`, `selected_income_tax_due`, etc.
- `path_a_details: Option<PathAResult>`, etc. (correct naming)
- `gross_aggregates: GrossAggregates`
- `total_it_credits`, `cwt_credits`, `quarterly_payments`, `prior_year_excess`, `compensation_cwt`
- `balance: Decimal`, `disposition: BalanceDisposition`, `overpayment: Decimal`
- `installment_eligible: bool` (not InstallmentEligibility enum)
- `pt_result: PercentageTaxResult`
- `form_type: FormType`, `form_output: FormOutputUnion`
- Removed: `bir_form_variant`, `total_cwt_credits`, `total_quarterly_paid`, `ineligibility_notifications`

### Section 5 (TypeScript Types)

- **5.1 `common.ts`**: Replaced with authoritative types from analysis/typescript-types.md
  - `Quarter = 1 | 2 | 3` (number, not string)
  - Removed: `FilingMode`, `BusinessNature`, `VatStatus`, `BirFormVariant`, `InstallmentEligibility`
  - Added: `FilingPeriod`, `TaxpayerClass`, `IncomeType`, `DeductionMethod`, `RegimeElection`, `BalanceDisposition`, `ReturnType`, `CwtClassification`, as-const arrays
  - Fixed: `TaxRegimePath` → `RegimePath`, `BirFormType` → `FormType`, `ExpenseMethod` → `DeductionMethod`
  - Added: `WasmOk<T>`, `WasmError`, `ValidationWarning`, `ManualReviewFlag` with correct field names
  - Added: `OverpaymentPreferenceInput` (input-only, excludes PENDING_ELECTION)

- **5.2 `engine-input.ts`**: Complete replacement
  - `TaxpayerInput`: 15→25 fields with correct names
  - `ItemizedExpenseInput`: 11→23 fields
  - `Form2307Entry`: correct fields (payorName, payorTin, atcCode, incomePayment, taxWithheld, periodFrom, periodTo, quarterOfCredit)
  - `QuarterlyPayment`: updated (form1701qPeriod added)
  - `DepreciationEntry`: updated (assetName, assetCost, acquisitionDate, priorAccumulatedDepreciation)
  - `NolcoEntry`: updated (lossYear, originalLoss, remainingBalance, expiryYear)
  - `createDefaultTaxpayerInput()` factory: all correct fields/values

- **5.3 `engine-output.ts`**: Complete replacement with full output type tree from analysis/typescript-types.md

### Section 6 (Zod Schemas)

- `FilingModeSchema` → `FilingPeriodSchema`
- `BusinessNatureSchema` → `TaxpayerClassSchema` (or removed from input schema)
- `VatStatusSchema` → removed (replaced by `isVatRegistered: z.boolean()`)
- `ExpenseMethodSchema` → `DeductionMethodSchema`
- `QuarterSchema` → `z.union([z.literal(1), z.literal(2), z.literal(3)])` (number not string)
- `TaxpayerInputSchema` fields: all field renames applied
- Per-step schemas: `grossReceiptsAmount` → `grossReceipts` in WS-04

### Section 7 (Frontend Architecture)

- `WizardFormData`: Updated to mirror `TaxpayerInput` correct fields
- `computeActiveSteps()`: Fixed field references (`grossReceipts` not `grossReceiptsAmount`)

### Section 18 (Cross-Layer Consistency Table)

- Updated 18.1 field alignment table with correct field names
- Updated 18.2 enum values (PURELY_SE not PURELY_SELF_EMPLOYED, etc.)

### Section 19 (Critical Traps)

- Items 1,2 updated to use correct field names

---

## Field Name Reference Table (Before → After)

| Wrong (old spec) | Correct (authoritative) | Layer affected |
|-----------------|------------------------|----------------|
| `grossReceiptsAmount` | `grossReceipts` | Rust, TS, Zod, UI, tests |
| `form2307Entries` | `cwt2307Entries` | Rust, TS, Zod, UI |
| `withholdingAgentName` | `payorName` | Rust, TS, Zod |
| `tin` (in Form2307Entry) | `payorTin` | Rust, TS, Zod |
| `amountOfIncomePayment` | `incomePayment` | Rust, TS, Zod |
| `priorYearExcessCredits` | `priorYearExcessCwt` | Rust, TS, Zod |
| `isVatRegistered` (was VatStatus enum) | `isVatRegistered: boolean` | Rust, TS, Zod |
| `isBmbeRegistered` | added (was missing) | Rust, TS, Zod |
| `subjectToSec117128` | added (was missing) | Rust, TS, Zod |
| `nonOperatingIncome` | added (was missing) | Rust, TS, Zod |
| `ItemizedExpenseInput` (11 fields) | 23 fields | Rust, TS, Zod |
| `atcCode` in Form2307Entry | added (was missing) | Rust, TS, Zod |
| `periodFrom`/`periodTo` | added (was missing) | Rust, TS, Zod |
| `filingMode: FilingMode` | `filingPeriod: FilingPeriod` | Rust, TS, Zod |
