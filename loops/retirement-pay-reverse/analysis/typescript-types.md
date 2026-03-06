# Analysis: TypeScript Types — RA 7641 Retirement Pay Engine

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** typescript-types
**Date:** 2026-03-06
**Sources:** data-model.md, serde-wire-format.md, error-contract.md, wasm-export-signature.md

---

## Overview

This document maps every Rust struct and enum from the engine to exact TypeScript interfaces.
Field names are camelCase (matching `rename_all = "camelCase"` serde rule). Money values are
`number` (integer centavos). Dates are `string` in `YYYY-MM-DD` format. Optional Rust fields
(`Option<T>`) become `T | null` in TypeScript — never `T | undefined` on wire types.

The types in this file are the single source of truth for the TypeScript layer. The Zod schemas
in `zod-schemas.md` must match these types exactly.

---

## 1. Primitive Type Mappings

| Rust Type | TypeScript Type | Notes |
|-----------|-----------------|-------|
| `i64` (centavos) | `number` | Integer. Max ₱90T — within JS safe integer range |
| `u32` | `number` | Non-negative integer |
| `bool` | `boolean` | `true` / `false` only |
| `String` | `string` | UTF-8 |
| `NaiveDate` | `string` | `"YYYY-MM-DD"` format |
| `Option<T>` | `T \| null` | `null` on wire, never `undefined` |
| `Vec<T>` | `T[]` | Empty array `[]`, never `null` |
| `Result<T, E>` | `{ Ok: T } \| { Err: E }` | Top-level and per-row batch results |

---

## 2. Shared Enums

```typescript
// maps to Rust WorkerCategory (camelCase variants)
export type WorkerCategory =
  | "general"
  | "undergroundMine"
  | "racehorse";

// maps to Rust RetirementType
export type RetirementType =
  | "optional"
  | "compulsory"
  | "death";

// maps to Rust EligibilityStatus
export type EligibilityStatus =
  | "eligible"
  | "ineligible"
  | "eligibleWithWarnings";

// maps to Rust IneligibilityReason
export type IneligibilityReason =
  | "ageTooYoung"
  | "serviceTooShort"
  | "employerTooSmall"
  | "alreadyReceivedBenefit";

// maps to Rust TaxTreatment
export type TaxTreatment =
  | "fullyExempt"
  | "partiallyExempt"
  | "fullyTaxable";

// maps to Rust SeparationPayBasis
export type SeparationPayBasis =
  | "authorizedCause"
  | "retrenchment"
  | "redundancy"
  | "closure"
  | "disease"
  | "notApplicable";

// maps to Rust CompanyPlanType
export type CompanyPlanType =
  | "definedBenefit"
  | "definedContribution"
  | "none";

// maps to Rust CsvErrorKind
export type CsvErrorKind =
  | "missingColumn"
  | "invalidDate"
  | "invalidNumber"
  | "negativeValue"
  | "emptyRequired"
  | "invalidEnum";

// maps to Rust ErrorCode (top-level)
export type ErrorCode =
  | "parse_error"
  | "validation_failed"
  | "internal_error"
  | "serialization_error";
```

---

## 3. Input Types (Frontend → WASM)

### 3.1 `RetirementInput`

Maps to Rust `RetirementInput`. Sent to `compute_single_json` and `generate_nlrc_json`.

```typescript
export interface RetirementInput {
  // Employee & company identification
  employeeName: string;               // Rust: employee_name: String
  companyName: string;                // Rust: company_name: String
  employerSize: number;               // Rust: employer_size: u32  (headcount)

  // Worker classification
  workerCategory: WorkerCategory;     // Rust: worker_category: WorkerCategory
  age: number;                        // Rust: age: u32  (age at retirement date)

  // Service dates
  hireDate: string;                   // Rust: hire_date: NaiveDate  "YYYY-MM-DD"
  retirementDate: string;             // Rust: retirement_date: NaiveDate  "YYYY-MM-DD"
  retirementType: RetirementType;     // Rust: retirement_type: RetirementType

  // Salary & benefits
  basicSalaryCentavos: number;        // Rust: basic_salary_centavos: i64
  silDaysPerYear: number;             // Rust: sil_days_per_year: u32  (0, 5, 10, or 15)
  hasThirteenthMonth: boolean;        // Rust: has_thirteenth_month: bool
  monthlyAllowanceCentavos: number;   // Rust: monthly_allowance_centavos: i64 (0 if none)

  // Company retirement plan
  hasCompanyPlan: boolean;            // Rust: has_company_plan: bool
  companyPlanType: CompanyPlanType;   // Rust: company_plan_type: CompanyPlanType
  companyPlanAmountCentavos: number | null; // Rust: company_plan_amount_centavos: Option<i64>
  companyPlanName: string | null;     // Rust: company_plan_name: Option<String>

  // Tax treatment inputs
  hasBirApprovedPlan: boolean;        // Rust: has_bir_approved_plan: bool
  isFirstRetirement: boolean;         // Rust: is_first_retirement: bool

  // Separation pay context
  separationPayBasis: SeparationPayBasis; // Rust: separation_pay_basis: SeparationPayBasis
}
```

### 3.2 `BatchEmployeeInput`

`RetirementInput` extended with a zero-based row index for error reporting.

```typescript
export interface BatchEmployeeInput extends RetirementInput {
  rowIndex: number;   // Rust: row_index: u32  (zero-based CSV row number)
}
```

### 3.3 `BatchInput`

Sent to `compute_batch_json`.

```typescript
export interface BatchInput {
  employees: BatchEmployeeInput[];    // Rust: employees: Vec<BatchEmployeeInput>
  batchName: string;                  // Rust: batch_name: String
  computationDate: string;            // Rust: computation_date: NaiveDate  "YYYY-MM-DD"
}
```

---

## 4. Output Types (WASM → Frontend)

All output types are wrapped in `{ Ok: T } | { Err: EngineError }` at the top level.

### 4.1 `EligibilityResult`

```typescript
export interface EligibilityResult {
  status: EligibilityStatus;          // Rust: status: EligibilityStatus
  reasons: IneligibilityReason[];     // Rust: reasons: Vec<IneligibilityReason>  ([] if eligible)
  warnings: string[];                 // Rust: warnings: Vec<String>  (human-readable)
}
```

### 4.2 `SeparationPayComparison`

```typescript
export interface SeparationPayComparison {
  separationPayBasis: SeparationPayBasis;       // Rust: separation_pay_basis: SeparationPayBasis
  separationPayCentavos: number | null;          // Rust: separation_pay_centavos: Option<i64>
  retirementPayIsHigher: boolean | null;         // Rust: retirement_pay_is_higher: Option<bool>
  recommendedBenefitCentavos: number | null;     // Rust: recommended_benefit_centavos: Option<i64>
}
```

### 4.3 `CompanyPlanComparison`

```typescript
export interface CompanyPlanComparison {
  companyPlanType: CompanyPlanType;              // Rust: company_plan_type: CompanyPlanType
  companyPlanAmountCentavos: number | null;      // Rust: company_plan_amount_centavos: Option<i64>
  statutoryMinimumCentavos: number;              // Rust: statutory_minimum_centavos: i64
  gapCentavos: number | null;                    // Rust: gap_centavos: Option<i64>  (negative = company plan exceeds statutory)
  companyPlanIsSufficient: boolean | null;       // Rust: company_plan_is_sufficient: Option<bool>
}
```

### 4.4 `HalfMonthComponents`

Nested inside `ComputationBreakdown`.

```typescript
export interface HalfMonthComponents {
  fifteenDaysCentavos: number;        // Rust: fifteen_days_centavos: i64
  silCentavos: number;                // Rust: sil_centavos: i64
  thirteenthMonthCentavos: number;    // Rust: thirteenth_month_centavos: i64
}
```

### 4.5 `ComputationBreakdown`

Step-by-step audit trail of the pipeline.

```typescript
export interface ComputationBreakdown {
  step1EligibilityPassed: boolean;           // Rust: step1_eligibility_passed: bool
  step2ServiceMonths: number;                // Rust: step2_service_months: u32
  step3CreditedYearsRounded: number;         // Rust: step3_credited_years_rounded: u32
  step4DailyRateCentavos: number;            // Rust: step4_daily_rate_centavos: i64
  step5HalfMonthComponents: HalfMonthComponents; // Rust: step5_half_month_components: HalfMonthComponents
  step6RetirementPayCentavos: number;        // Rust: step6_retirement_pay_centavos: i64
  step7TaxTreatment: TaxTreatment;           // Rust: step7_tax_treatment: TaxTreatment
  step8SeparationPayComparison: SeparationPayComparison | null; // Rust: Option<SeparationPayComparison>
  step9CompanyPlanGap: CompanyPlanComparison | null;            // Rust: Option<CompanyPlanComparison>
}
```

### 4.6 `RetirementOutput`

The main computation result. Wrapped in `{ Ok: RetirementOutput }`.

```typescript
export interface RetirementOutput {
  // Identification (echoed from input)
  employeeName: string;               // Rust: employee_name: String
  companyName: string;                // Rust: company_name: String

  // Eligibility
  eligibility: EligibilityResult;    // Rust: eligibility: EligibilityResult

  // Credited service
  creditedYearsWhole: number;         // Rust: credited_years_whole: u32  (before rounding)
  creditedYearsMonths: number;        // Rust: credited_years_months: u32  (0–11 remainder months)
  creditedYearsRounded: number;       // Rust: credited_years_rounded: u32  (after 6-month rule)

  // Rate computation
  dailyRateCentavos: number;          // Rust: daily_rate_centavos: i64  (basicSalary / 26)

  // Half-month salary components
  fifteenDaysPayCentavos: number;     // Rust: fifteen_days_pay_centavos: i64  (15 × dailyRate)
  silPayCentavos: number;             // Rust: sil_pay_centavos: i64  (silDays × dailyRate)
  thirteenthMonthPayCentavos: number; // Rust: thirteenth_month_pay_centavos: i64  (basicSalary / 12)
  totalHalfMonthCentavos: number;     // Rust: total_half_month_centavos: i64  (sum = 22.5-day equiv)

  // Final retirement pay
  retirementPayCentavos: number;      // Rust: retirement_pay_centavos: i64  (totalHalfMonth × creditedYears)

  // Tax treatment
  taxTreatment: TaxTreatment;         // Rust: tax_treatment: TaxTreatment
  taxableAmountCentavos: number;      // Rust: taxable_amount_centavos: i64  (0 if fullyExempt)
  exemptAmountCentavos: number;       // Rust: exempt_amount_centavos: i64  (0 if fullyTaxable)

  // Comparisons
  separationPayComparison: SeparationPayComparison; // Rust: separation_pay_comparison: SeparationPayComparison
  companyPlanComparison: CompanyPlanComparison;     // Rust: company_plan_comparison: CompanyPlanComparison

  // Audit trail
  breakdown: ComputationBreakdown;    // Rust: breakdown: ComputationBreakdown

  // 15-day error comparison (the core product value prop)
  erroneous15DayPayCentavos: number;  // Rust: erroneous_15_day_pay_centavos: i64
  correctMinusErroneousCentavos: number; // Rust: correct_minus_erroneous_centavos: i64  (underpayment amount)
}
```

### 4.7 `BatchRowResult`

One element of `BatchOutput.rows`.

```typescript
export interface BatchRowResult {
  rowIndex: number;                          // Rust: row_index: u32
  employeeName: string;                      // Rust: employee_name: String
  result: { Ok: RetirementOutput } | { Err: EngineError }; // Rust: result: Result<RetirementOutput, EngineError>
}
```

### 4.8 `BatchOutput`

Returned from `compute_batch_json`. Wrapped in `{ Ok: BatchOutput }`.

```typescript
export interface BatchOutput {
  batchName: string;                         // Rust: batch_name: String
  computationDate: string;                   // Rust: computation_date: NaiveDate  "YYYY-MM-DD"
  totalEmployees: number;                    // Rust: total_employees: u32
  successCount: number;                      // Rust: success_count: u32
  errorCount: number;                        // Rust: error_count: u32
  totalRetirementPayCentavos: number;        // Rust: total_retirement_pay_centavos: i64
  totalErroneousPayCentavos: number;         // Rust: total_erroneous_pay_centavos: i64
  totalUnderpaymentCentavos: number;         // Rust: total_underpayment_centavos: i64
  rows: BatchRowResult[];                    // Rust: rows: Vec<BatchRowResult>
}
```

---

## 5. NLRC Worksheet Types

### 5.1 `HalfMonthBreakdown`

Human-readable labels and formatted amounts for the NLRC exhibit table.

```typescript
export interface HalfMonthBreakdown {
  fifteenDaysLabel: string;           // e.g. "15 days × ₱1,923.08/day"
  fifteenDaysAmount: string;          // e.g. "₱28,846.15"
  silLabel: string;                   // e.g. "5 days SIL × ₱1,923.08/day"
  silAmount: string;                  // e.g. "₱9,615.38"
  thirteenthMonthLabel: string;       // e.g. "1/12 × ₱50,000.00 monthly salary"
  thirteenthMonthAmount: string;      // e.g. "₱4,166.67"
  totalLabel: string;                 // e.g. "Total: 22.5 days equivalent"
  totalAmount: string;                // e.g. "₱42,628.20"
}
```

### 5.2 `ComputationRow`

One row in the NLRC exhibit computation table.

```typescript
export interface ComputationRow {
  description: string;                // Row label
  amount: string;                     // Formatted amount string (e.g. "₱50,000.00" or "× 30 years")
  amountCentavos: number | null;      // null for non-monetary rows (e.g. "× 30 years" multiplier row)
}
```

### 5.3 `NlrcRawCentavos`

Machine-readable centavo values embedded in the NLRC worksheet.

```typescript
export interface NlrcRawCentavos {
  retirementPayCentavos: number;           // Rust: retirement_pay_centavos: i64
  erroneous15DayPayCentavos: number;       // Rust: erroneous_15_day_pay_centavos: i64
  correctMinusErroneousCentavos: number;   // Rust: correct_minus_erroneous_centavos: i64
}
```

### 5.4 `NlrcWorksheet`

The full NLRC money claim worksheet. Wrapped in `{ Ok: NlrcWorksheet }`.

```typescript
export interface NlrcWorksheet {
  caseCaption: string;                // e.g. "JUAN DELA CRUZ vs. MANILA TEXTILES INC."
  claimantName: string;               // Employee name
  respondentName: string;             // Company name
  dateOfBirth: string | null;         // "YYYY-MM-DD" or null if not provided
  dateOfHire: string;                 // "YYYY-MM-DD"
  dateOfRetirement: string;           // "YYYY-MM-DD"
  yearsOfService: string;             // Human label: "25 years, 6 months"
  creditedYears: number;              // After 6-month rounding
  monthlyBasicSalary: string;         // Formatted: "₱60,000.00"
  dailyRate: string;                  // Formatted: "₱2,307.69"
  halfMonthSalaryBreakdown: HalfMonthBreakdown;
  computationTable: ComputationRow[];
  legalBasisStatements: string[];     // Statutory citations (array of paragraph strings)
  exhibitLabel: string;               // e.g. "ANNEX \"A\" — COMPUTATION OF RETIREMENT PAY"
  preparedBy: string | null;          // null if not provided
  preparedDate: string;               // "YYYY-MM-DD"
  comparisonNote: string;             // The 15-day vs 22.5-day difference explanation
  rawCentavos: NlrcRawCentavos;       // Machine-readable values
}
```

---

## 6. Error Types

### 6.1 `FieldError`

A per-field validation error inside `EngineError.fields`.

```typescript
export interface FieldError {
  field: string;    // camelCase field name: "age", "retirementDate", "basicSalaryCentavos"
  code: string;     // e.g. "age_too_young", "date_order", "negative_salary"
  message: string;  // Human-readable explanation
}
```

### 6.2 `EngineError`

The error shape for both top-level and per-row batch errors.

```typescript
export interface EngineError {
  code: ErrorCode;          // Top-level error category
  message: string;          // Human-readable summary
  fields: FieldError[];     // Per-field errors (empty array if not field-specific)
}
```

### 6.3 `EngineResult<T>`

Generic result wrapper matching `Result<T, EngineError>` serialization.

```typescript
export type EngineResult<T> = { Ok: T } | { Err: EngineError };
```

**Usage:**

```typescript
// Narrowing pattern (type guard)
function isOk<T>(result: EngineResult<T>): result is { Ok: T } {
  return "Ok" in result;
}

// Usage in compute call:
const raw = computeSingleJson(JSON.stringify(input));
const result: EngineResult<RetirementOutput> = JSON.parse(raw);
if (isOk(result)) {
  // result.Ok is RetirementOutput
} else {
  // result.Err is EngineError
}
```

---

## 7. Bridge Types

### 7.1 `WasmModule`

The shape of the loaded WASM module (from `wasm-export-signature.md`).

```typescript
export interface WasmModule {
  compute_single_json(inputJson: string): string;
  compute_batch_json(inputJson: string): string;
  generate_nlrc_json(inputJson: string): string;
}
```

### 7.2 `BridgeState`

Internal state of the `bridge.ts` module.

```typescript
// Not exported — internal to bridge.ts
interface BridgeState {
  module: WasmModule | null;
  initPromise: Promise<WasmModule> | null;
}
```

---

## 8. UI Helper Types

These types are not on the wire but are used by the frontend for form state and display.

### 8.1 `MoneyInputValue`

Form state for a money input field (editing in pesos, storing centavos).

```typescript
export interface MoneyInputValue {
  displayPesos: string;       // What the user typed: "60,000" or "60000.50"
  centavos: number | null;    // Parsed centavo value, null if invalid/empty
}
```

### 8.2 `WizardFormState`

The accumulated form state across all wizard steps. Used before submission to WASM.

```typescript
export interface WizardFormState {
  // Step 1: Employee Info
  employeeName: string;
  companyName: string;
  employerSize: string;           // String for form input, parsed to number on submit
  workerCategory: WorkerCategory | "";
  age: string;

  // Step 2: Employment Dates
  hireDate: string;               // "YYYY-MM-DD" from date picker
  retirementDate: string;
  retirementType: RetirementType | "";

  // Step 3: Salary & Benefits
  basicSalaryPesos: string;       // User types pesos; converted to centavos on submit
  silDaysPerYear: "0" | "5" | "10" | "15";
  hasThirteenthMonth: boolean;
  monthlyAllowancePesos: string;  // Pesos string

  // Step 4: Retirement Details
  hasBirApprovedPlan: boolean;
  isFirstRetirement: boolean;
  separationPayBasis: SeparationPayBasis | "";

  // Step 5: Company Plan (optional)
  hasCompanyPlan: boolean;
  companyPlanType: CompanyPlanType | "";
  companyPlanAmountPesos: string;
  companyPlanName: string;
}
```

### 8.3 `CsvParsePreview`

Preview of a CSV file before sending to WASM batch.

```typescript
export interface CsvParsePreview {
  filename: string;
  rowCount: number;
  columnHeaders: string[];
  previewRows: string[][];        // First 5 rows as raw strings
  errors: CsvPreviewError[];
}

export interface CsvPreviewError {
  row: number;                    // 1-based row number
  column: string;                 // Column header name
  kind: CsvErrorKind;
  message: string;
}
```

### 8.4 `ComputationRecord`

A saved computation stored in Supabase. Used in computation list views.

```typescript
export interface ComputationRecord {
  id: string;                     // UUID
  userId: string;                 // UUID
  organizationId: string | null;  // UUID or null
  name: string;                   // User-given label
  mode: "single" | "batch";
  status: "draft" | "computed" | "shared";
  input: RetirementInput | BatchInput;
  output: RetirementOutput | BatchOutput | null;
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;
}
```

### 8.5 `SharedLink`

A token-based read-only share. Matches the `shared_links` Supabase table.

```typescript
export interface SharedLink {
  id: string;                 // UUID
  computationId: string;      // UUID (foreign key)
  token: string;              // UUID used in /share/$token URL
  createdAt: string;          // ISO 8601
  expiresAt: string | null;   // null = never expires
}
```

---

## 9. Cross-Reference: Rust → TypeScript Field Map

Complete field-level mapping for every wire-facing type.

### `RetirementInput`

| Rust Field | Rust Type | JSON Key | TS Type |
|------------|-----------|----------|---------|
| `employee_name` | `String` | `employeeName` | `string` |
| `company_name` | `String` | `companyName` | `string` |
| `employer_size` | `u32` | `employerSize` | `number` |
| `worker_category` | `WorkerCategory` | `workerCategory` | `WorkerCategory` |
| `age` | `u32` | `age` | `number` |
| `hire_date` | `NaiveDate` | `hireDate` | `string` |
| `retirement_date` | `NaiveDate` | `retirementDate` | `string` |
| `retirement_type` | `RetirementType` | `retirementType` | `RetirementType` |
| `basic_salary_centavos` | `i64` | `basicSalaryCentavos` | `number` |
| `sil_days_per_year` | `u32` | `silDaysPerYear` | `number` |
| `has_thirteenth_month` | `bool` | `hasThirteenthMonth` | `boolean` |
| `monthly_allowance_centavos` | `i64` | `monthlyAllowanceCentavos` | `number` |
| `has_company_plan` | `bool` | `hasCompanyPlan` | `boolean` |
| `company_plan_type` | `CompanyPlanType` | `companyPlanType` | `CompanyPlanType` |
| `company_plan_amount_centavos` | `Option<i64>` | `companyPlanAmountCentavos` | `number \| null` |
| `company_plan_name` | `Option<String>` | `companyPlanName` | `string \| null` |
| `has_bir_approved_plan` | `bool` | `hasBirApprovedPlan` | `boolean` |
| `is_first_retirement` | `bool` | `isFirstRetirement` | `boolean` |
| `separation_pay_basis` | `SeparationPayBasis` | `separationPayBasis` | `SeparationPayBasis` |

### `RetirementOutput`

| Rust Field | Rust Type | JSON Key | TS Type |
|------------|-----------|----------|---------|
| `employee_name` | `String` | `employeeName` | `string` |
| `company_name` | `String` | `companyName` | `string` |
| `eligibility` | `EligibilityResult` | `eligibility` | `EligibilityResult` |
| `credited_years_whole` | `u32` | `creditedYearsWhole` | `number` |
| `credited_years_months` | `u32` | `creditedYearsMonths` | `number` |
| `credited_years_rounded` | `u32` | `creditedYearsRounded` | `number` |
| `daily_rate_centavos` | `i64` | `dailyRateCentavos` | `number` |
| `fifteen_days_pay_centavos` | `i64` | `fifteenDaysPayCentavos` | `number` |
| `sil_pay_centavos` | `i64` | `silPayCentavos` | `number` |
| `thirteenth_month_pay_centavos` | `i64` | `thirteenthMonthPayCentavos` | `number` |
| `total_half_month_centavos` | `i64` | `totalHalfMonthCentavos` | `number` |
| `retirement_pay_centavos` | `i64` | `retirementPayCentavos` | `number` |
| `tax_treatment` | `TaxTreatment` | `taxTreatment` | `TaxTreatment` |
| `taxable_amount_centavos` | `i64` | `taxableAmountCentavos` | `number` |
| `exempt_amount_centavos` | `i64` | `exemptAmountCentavos` | `number` |
| `separation_pay_comparison` | `SeparationPayComparison` | `separationPayComparison` | `SeparationPayComparison` |
| `company_plan_comparison` | `CompanyPlanComparison` | `companyPlanComparison` | `CompanyPlanComparison` |
| `breakdown` | `ComputationBreakdown` | `breakdown` | `ComputationBreakdown` |
| `erroneous_15_day_pay_centavos` | `i64` | `erroneous15DayPayCentavos` | `number` |
| `correct_minus_erroneous_centavos` | `i64` | `correctMinusErroneousCentavos` | `number` |

### `BatchOutput`

| Rust Field | Rust Type | JSON Key | TS Type |
|------------|-----------|----------|---------|
| `batch_name` | `String` | `batchName` | `string` |
| `computation_date` | `NaiveDate` | `computationDate` | `string` |
| `total_employees` | `u32` | `totalEmployees` | `number` |
| `success_count` | `u32` | `successCount` | `number` |
| `error_count` | `u32` | `errorCount` | `number` |
| `total_retirement_pay_centavos` | `i64` | `totalRetirementPayCentavos` | `number` |
| `total_erroneous_pay_centavos` | `i64` | `totalErroneousPayCentavos` | `number` |
| `total_underpayment_centavos` | `i64` | `totalUnderpaymentCentavos` | `number` |
| `rows` | `Vec<BatchRowResult>` | `rows` | `BatchRowResult[]` |

### `NlrcWorksheet`

| Rust Field | Rust Type | JSON Key | TS Type |
|------------|-----------|----------|---------|
| `case_caption` | `String` | `caseCaption` | `string` |
| `claimant_name` | `String` | `claimantName` | `string` |
| `respondent_name` | `String` | `respondentName` | `string` |
| `date_of_birth` | `Option<NaiveDate>` | `dateOfBirth` | `string \| null` |
| `date_of_hire` | `NaiveDate` | `dateOfHire` | `string` |
| `date_of_retirement` | `NaiveDate` | `dateOfRetirement` | `string` |
| `years_of_service` | `String` | `yearsOfService` | `string` |
| `credited_years` | `u32` | `creditedYears` | `number` |
| `monthly_basic_salary` | `String` | `monthlyBasicSalary` | `string` |
| `daily_rate` | `String` | `dailyRate` | `string` |
| `half_month_salary_breakdown` | `HalfMonthBreakdown` | `halfMonthSalaryBreakdown` | `HalfMonthBreakdown` |
| `computation_table` | `Vec<ComputationRow>` | `computationTable` | `ComputationRow[]` |
| `legal_basis_statements` | `Vec<String>` | `legalBasisStatements` | `string[]` |
| `exhibit_label` | `String` | `exhibitLabel` | `string` |
| `prepared_by` | `Option<String>` | `preparedBy` | `string \| null` |
| `prepared_date` | `NaiveDate` | `preparedDate` | `string` |
| `comparison_note` | `String` | `comparisonNote` | `string` |
| `raw_centavos` | `NlrcRawCentavos` | `rawCentavos` | `NlrcRawCentavos` |

---

## 10. Display Utility Types (Frontend Only)

Helpers for formatting centavo values and dates. Not on the wire.

```typescript
// Format centavos to peso string: 6000000 → "₱60,000.00"
export type CentavoFormatter = (centavos: number) => string;

// Format centavos to peso string without symbol: 6000000 → "60,000.00"
export type CentavoFormatterNoSymbol = (centavos: number) => string;

// Parse peso string to centavos: "60,000.00" → 6000000, "60000" → 6000000
// Returns null if unparseable
export type PesoParser = (pesos: string) => number | null;

// Format "YYYY-MM-DD" string to locale display: "2000-01-15" → "January 15, 2000"
export type DateFormatter = (isoDate: string) => string;
```

Implementation of `CentavoFormatter`:
```typescript
export function formatCentavos(centavos: number): string {
  const pesos = centavos / 100;
  return `₱${pesos.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

Implementation of `PesoParser`:
```typescript
export function parsePesosToCentavos(input: string): number | null {
  // Strip commas, peso sign, whitespace
  const cleaned = input.replace(/[₱,\s]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return null;
  const pesos = parseFloat(cleaned);
  if (isNaN(pesos) || pesos < 0) return null;
  return Math.round(pesos * 100);  // round to nearest centavo
}
```

---

## 11. Type Export File Structure

All types should be exported from a single barrel file:

```
apps/retirement-pay/frontend/src/types/
  index.ts           ← re-exports everything
  engine.ts          ← RetirementInput, RetirementOutput, BatchInput, BatchOutput, NlrcWorksheet, all enums, EngineResult, EngineError
  ui.ts              ← WizardFormState, MoneyInputValue, CsvParsePreview, CsvPreviewError, ComputationRecord, SharedLink
  display.ts         ← CentavoFormatter, PesoParser, DateFormatter, formatCentavos(), parsePesosToCentavos()
```

`engine.ts` contains only wire-facing types. `ui.ts` contains only frontend-internal types.
`display.ts` contains formatting utilities. This separation prevents accidentally sending
UI form state to the WASM bridge.

---

## Summary

| Category | Count | Notes |
|----------|-------|-------|
| Shared enums | 8 | WorkerCategory, RetirementType, EligibilityStatus, IneligibilityReason, TaxTreatment, SeparationPayBasis, CompanyPlanType, CsvErrorKind |
| Input types | 3 | RetirementInput, BatchEmployeeInput, BatchInput |
| Output types | 8 | RetirementOutput, BatchOutput, BatchRowResult, EligibilityResult, SeparationPayComparison, CompanyPlanComparison, HalfMonthComponents, ComputationBreakdown |
| NLRC types | 4 | NlrcWorksheet, HalfMonthBreakdown, ComputationRow, NlrcRawCentavos |
| Error types | 3 | EngineError, FieldError, EngineResult<T> |
| Bridge types | 2 | WasmModule, BridgeState |
| UI helper types | 5 | WizardFormState, MoneyInputValue, CsvParsePreview, CsvPreviewError, ComputationRecord, SharedLink |
| Display utilities | 4 | CentavoFormatter + impl, PesoParser + impl, DateFormatter |

Zero floating-point money anywhere. All optional fields are `T | null`, never `T | undefined`
on wire types. Every Rust field name maps to exactly one TypeScript field name via camelCase.
