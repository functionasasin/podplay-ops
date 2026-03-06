# Serde Wire Format — TaxKlaro WASM Bridge

**Wave:** 2 (Bridge Contract)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** validate-domain-spec, validate-engine-spec, wasm-export-signature

---

## Purpose

This document specifies the exact JSON serialization rules for every Rust type in the TaxKlaro engine. This is the **contract** that:

1. The Rust engine implements via serde attributes
2. TypeScript types must mirror exactly (field-for-field)
3. Zod schemas must validate strictly against

Any divergence between these three layers causes a runtime type error. This document is the single source of truth.

---

## 1. Global Conventions

### 1.1 Field Naming Convention

**Rule: All struct fields use `camelCase` in JSON.**

Rust structs use `snake_case` internally. Every struct must carry `#[serde(rename_all = "camelCase")]` at the struct level. This produces camelCase JSON keys, matching TypeScript convention.

Examples:
| Rust field | JSON key |
|-----------|---------|
| `gross_receipts` | `grossReceipts` |
| `is_vat_registered` | `isVatRegistered` |
| `path_a_eligible` | `pathAEligible` |
| `biz_nti_before_pt` | `bizNtiBeforePt` |
| `cwt_2307_entries` | `cwt2307Entries` |
| `total_it_credits` | `totalItCredits` |
| `pt_cwt_total` | `ptCwtTotal` |
| `form_1701a_output` | `form1701aOutput` |

**Special case — numeric digits in field names:** Rust `cwt_2307_entries` → JSON `cwt2307Entries` (serde camelCase handles digit sequences as non-word boundaries, keeping digits inline).

### 1.2 Enum Variant Naming Convention

**Rule: All enum variants serialize as SCREAMING_SNAKE_CASE strings.**

Every enum must carry `#[serde(rename_all = "SCREAMING_SNAKE_CASE")]`. Since all variants in the data model are already SCREAMING_SNAKE_CASE, this is a no-op rename but must be explicit.

Example:
```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TaxpayerType {
    PurelySe,       // serializes as "PURELY_SE"
    MixedIncome,    // serializes as "MIXED_INCOME"
    CompensationOnly, // serializes as "COMPENSATION_ONLY"
}
```

**Note:** Rust variant names use PascalCase internally (`PurelySe`, `MixedIncome`). The `rename_all` attribute maps them to SCREAMING_SNAKE_CASE for JSON. TypeScript will use string literal unions matching these exact strings.

### 1.3 Decimal → String Serialization

**Rule: ALL `Decimal` and `Peso` and `Rate` fields serialize as JSON strings, not numbers.**

Rationale: IEEE 754 double-precision floats cannot represent Philippine peso amounts accurately. A tax of ₱1,234,567.89 would lose centavo precision. JavaScript's `number` type has the same limitation. String representation preserves exact centavo values.

Implementation:
```rust
use rust_decimal::Decimal;
use serde::{Serialize, Deserialize};

// Option 1: serde_with crate (recommended)
#[serde_as]
#[derive(Serialize, Deserialize)]
pub struct SomeStruct {
    #[serde_as(as = "DisplayFromStr")]
    pub gross_receipts: Decimal,
}

// Option 2: custom serializer
fn serialize_decimal<S: Serializer>(value: &Decimal, serializer: S) -> Result<S::Ok, S::Error> {
    serializer.serialize_str(&value.to_string())
}
```

**Expected JSON format:** `"1234567.89"` — decimal string, always with at least 2 decimal places for peso amounts, up to full precision for rates. Never scientific notation (`1.23e6` is forbidden).

**TypeScript type:** `string` (not `number`). Zod schema: `z.string().regex(/^-?\d+(\.\d+)?$/)`.

**Important:** The frontend must parse these strings with a Decimal library (e.g., `decimal.js`) for display arithmetic. Never `parseFloat()` — it loses precision.

### 1.4 Optional Fields → null

**Rule: `Option<T>` in Rust serializes as `null` in JSON, never as absent key.**

Do NOT add `#[serde(skip_serializing_if = "Option::is_none")]` to any field. All optional fields must appear in the JSON with value `null` when absent. This makes TypeScript types `T | null` (not `T | undefined`), which is safer to check.

```rust
// CORRECT
pub elected_regime: Option<RegimeElection>,  // serializes as null when None

// WRONG — omits the key entirely, breaks TypeScript exhaustiveness
#[serde(skip_serializing_if = "Option::is_none")]
pub elected_regime: Option<RegimeElection>,
```

TypeScript consequence: `electeRegime: RegimeElection | null` (not `RegimeElection | undefined`).
Zod consequence: `.nullable()` (not `.optional()`).

### 1.5 Boolean Serialization

**Rule: Booleans serialize as JSON `true`/`false` — no coercion.**

Serde handles this automatically. TypeScript type: `boolean`. Zod: `z.boolean()` (not `z.coerce.boolean()`).

The frontend must never submit string `"true"` or `"false"` — must be JSON booleans.

### 1.6 Integer Types → number

**Rule: `int`, `TaxYear`, `Quarter` serialize as JSON numbers (not strings).**

These are small integers with no precision risk. JavaScript's safe integer range (`Number.MAX_SAFE_INTEGER = 2^53 - 1`) easily covers all values:
- `TaxYear`: 2018–2030 (safe)
- `Quarter`: 1, 2, 3 (safe)
- `days_late`, `months_late`, `useful_life_years`, `offense_count`: small integers (safe)

TypeScript type: `number`. Zod: `z.number().int()`.

### 1.7 Date → ISO 8601 String

**Rule: All `Date` fields serialize as `"YYYY-MM-DD"` strings.**

No timezone component — all BIR dates are Philippine local dates (no time component needed).

Implementation:
```rust
use chrono::NaiveDate;

#[serde_as]
pub struct SomeStruct {
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub actual_filing_date: Option<NaiveDate>,  // serializes as "2025-04-15" or null
}
```

TypeScript type: `string` (ISO date string). Zod: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`.

### 1.8 List/Vec → JSON Array

**Rule: `Vec<T>` / `List<T>` serializes as JSON array `[]`. Empty list = `[]`, never `null`.**

All list fields must have `Vec<T>` in Rust (not `Option<Vec<T>>`). An empty list is `[]`.

TypeScript type: `T[]`. Zod: `z.array(T_schema)`.

### 1.9 Unknown Fields Policy

**Rule: Input types use `deny_unknown_fields`. Output types do not.**

- Input types (`TaxpayerInput`, `ItemizedExpenseInput`, `Form2307Entry`, `QuarterlyPayment`, `DepreciationEntry`, `NolcoEntry`): add `#[serde(deny_unknown_fields)]`. Unknown fields in user-submitted JSON = parse error (prevents silent data loss from typos).
- Output types (`TaxComputationResult`, `PathAResult`, etc.): NO `deny_unknown_fields`. Allows engine to add new output fields in future versions without breaking old frontends.

---

## 2. Enum Serialization Table

Every enum, its variants, and their exact JSON string values:

### TaxpayerType
```
"PURELY_SE" | "MIXED_INCOME" | "COMPENSATION_ONLY"
```

### TaxpayerTier
```
"MICRO" | "SMALL" | "MEDIUM" | "LARGE"
```

### FilingPeriod
```
"Q1" | "Q2" | "Q3" | "ANNUAL"
```

### IncomeType
```
"PURELY_SE" | "MIXED_INCOME" | "COMPENSATION_ONLY" | "ZERO_INCOME"
```

### TaxpayerClass
```
"SERVICE_PROVIDER" | "TRADER"
```

### RegimePath
```
"PATH_A" | "PATH_B" | "PATH_C"
```

### RegimeElection (nullable in input)
```
"ELECT_EIGHT_PCT" | "ELECT_OSD" | "ELECT_ITEMIZED"
null — for optimizer mode
```

### DeductionMethod
```
"ITEMIZED" | "OSD" | "NONE"
```

### BalanceDisposition
```
"BALANCE_PAYABLE" | "ZERO_BALANCE" | "OVERPAYMENT"
```

### ReturnType
```
"ORIGINAL" | "AMENDED"
```

### FormType
```
"FORM_1701" | "FORM_1701A" | "FORM_1701Q"
```

### CwtClassification
```
"INCOME_TAX_CWT" | "PERCENTAGE_TAX_CWT" | "UNKNOWN"
```

### DepreciationMethod
```
"STRAIGHT_LINE" | "DECLINING_BALANCE"
```

### OverpaymentDisposition (nullable in output)
```
"CARRY_OVER" | "REFUND" | "TCC" | "PENDING_ELECTION"
null — when disposition != OVERPAYMENT
```
**Input constraint:** `overpayment_preference` in input may only be `"CARRY_OVER"`, `"REFUND"`, `"TCC"`, or `null`. `"PENDING_ELECTION"` is an engine OUTPUT only — it is never a valid input value. The engine must reject it with a validation error if received.

---

## 3. Input Type Serde Attributes

### 3.1 TaxpayerInput (complete struct annotation)

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TaxpayerInput {
    // Identity / Classification
    pub taxpayer_type: TaxpayerType,
    pub tax_year: i32,                          // JSON: number (2018–2030)
    pub filing_period: FilingPeriod,
    pub is_mixed_income: bool,

    // Registration Status
    pub is_vat_registered: bool,
    pub is_bmbe_registered: bool,
    pub subject_to_sec_117_128: bool,
    pub is_gpp_partner: bool,

    // Business Income — all Decimal → String in JSON
    #[serde_as(as = "DisplayFromStr")]
    pub gross_receipts: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub sales_returns_allowances: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub non_operating_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub fwt_income: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub cost_of_goods_sold: Decimal,

    // Compensation Income
    #[serde_as(as = "DisplayFromStr")]
    pub taxable_compensation: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compensation_cwt: Decimal,

    // Itemized Expenses
    pub itemized_expenses: ItemizedExpenseInput,

    // Regime Election
    pub elected_regime: Option<RegimeElection>,  // JSON: string | null
    pub osd_elected: Option<bool>,               // JSON: boolean | null

    // Prior Period Data
    pub prior_quarterly_payments: Vec<QuarterlyPayment>,
    pub cwt_2307_entries: Vec<Form2307Entry>,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_year_excess_cwt: Decimal,

    // Penalty Inputs
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub actual_filing_date: Option<NaiveDate>,   // JSON: "YYYY-MM-DD" | null
    pub return_type: ReturnType,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_payment_for_return: Decimal,

    // Overpayment Preference
    pub overpayment_preference: Option<OverpaymentDisposition>,  // JSON: string | null
}
```

### 3.2 ItemizedExpenseInput

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ItemizedExpenseInput {
    // All Decimal fields → String in JSON
    pub salaries_and_wages: Decimal,
    pub sss_philhealth_pagibig_employer_share: Decimal,
    pub rent: Decimal,
    pub utilities: Decimal,
    pub communication: Decimal,
    pub office_supplies: Decimal,
    pub professional_fees_paid: Decimal,
    pub travel_transportation: Decimal,
    pub insurance_premiums: Decimal,
    pub interest_expense: Decimal,
    pub final_taxed_interest_income: Decimal,
    pub taxes_and_licenses: Decimal,
    pub casualty_theft_losses: Decimal,
    pub bad_debts: Decimal,
    pub is_accrual_basis: bool,
    pub depreciation_entries: Vec<DepreciationEntry>,
    pub charitable_contributions: Decimal,
    pub charitable_accredited: bool,
    pub research_development: Decimal,
    pub entertainment_representation: Decimal,
    pub home_office_expense: Decimal,
    pub home_office_exclusive_use: bool,
    pub nolco_entries: Vec<NolcoEntry>,
}
```

**camelCase JSON keys for long field names:**
| Rust | JSON |
|------|------|
| `sss_philhealth_pagibig_employer_share` | `sssPhilhealthPagibigEmployerShare` |
| `professional_fees_paid` | `professionalFeesPaid` |
| `final_taxed_interest_income` | `finalTaxedInterestIncome` |
| `home_office_exclusive_use` | `homeOfficeExclusiveUse` |

### 3.3 Form2307Entry

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Form2307Entry {
    pub payor_name: String,              // JSON: string (non-empty)
    pub payor_tin: String,               // JSON: string, format "XXX-XXX-XXX" or "XXX-XXX-XXX-XXXX"
    pub atc_code: String,                // JSON: string (e.g., "WI010")
    #[serde_as(as = "DisplayFromStr")]
    pub income_payment: Decimal,         // JSON: string
    #[serde_as(as = "DisplayFromStr")]
    pub tax_withheld: Decimal,           // JSON: string
    #[serde_as(as = "DisplayFromStr")]
    pub period_from: NaiveDate,          // JSON: "YYYY-MM-DD"
    #[serde_as(as = "DisplayFromStr")]
    pub period_to: NaiveDate,            // JSON: "YYYY-MM-DD"
    pub quarter_of_credit: Option<i32>,  // JSON: 1 | 2 | 3 | null
}
```

### 3.4 QuarterlyPayment

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct QuarterlyPayment {
    pub quarter: i32,                    // JSON: 1 | 2 | 3
    #[serde_as(as = "DisplayFromStr")]
    pub amount_paid: Decimal,            // JSON: string
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub date_paid: Option<NaiveDate>,    // JSON: "YYYY-MM-DD" | null
    pub form_1701q_period: FilingPeriod, // JSON: "Q1" | "Q2" | "Q3"
}
```

### 3.5 DepreciationEntry

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DepreciationEntry {
    pub asset_name: String,
    #[serde_as(as = "DisplayFromStr")]
    pub asset_cost: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub salvage_value: Decimal,
    pub useful_life_years: i32,          // JSON: number (1–50)
    #[serde_as(as = "DisplayFromStr")]
    pub acquisition_date: NaiveDate,     // JSON: "YYYY-MM-DD"
    pub method: DepreciationMethod,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_accumulated_depreciation: Decimal,
}
```

### 3.6 NolcoEntry

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NolcoEntry {
    pub loss_year: i32,
    #[serde_as(as = "DisplayFromStr")]
    pub original_loss: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub remaining_balance: Decimal,
    pub expiry_year: i32,
}
```

---

## 4. Output Type Serde Attributes

Output types use `rename_all = "camelCase"` but NO `deny_unknown_fields` (forward compatibility).

### 4.1 TaxComputationResult

```rust
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TaxComputationResult {
    pub input_summary: InputSummary,
    pub comparison: Vec<RegimeOption>,
    pub recommended_regime: RegimePath,
    pub using_locked_regime: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub savings_vs_worst: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub savings_vs_next_best: Decimal,
    pub selected_path: RegimePath,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_income_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_percentage_tax_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub selected_total_tax: Decimal,
    pub path_a_details: Option<PathAResult>,      // null if COMPENSATION_ONLY
    pub path_b_details: Option<PathBResult>,      // null if COMPENSATION_ONLY
    pub path_c_details: Option<PathCResult>,      // null if ineligible
    pub gross_aggregates: GrossAggregates,
    #[serde_as(as = "DisplayFromStr")]
    pub total_it_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub cwt_credits: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub quarterly_payments: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub prior_year_excess: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub compensation_cwt: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub balance: Decimal,
    pub disposition: BalanceDisposition,
    #[serde_as(as = "DisplayFromStr")]
    pub overpayment: Decimal,
    pub overpayment_disposition: Option<OverpaymentDisposition>,
    pub installment_eligible: bool,
    #[serde_as(as = "DisplayFromStr")]
    pub installment_first_due: Decimal,
    #[serde_as(as = "DisplayFromStr")]
    pub installment_second_due: Decimal,
    pub pt_result: PercentageTaxResult,
    pub form_type: FormType,
    pub form_output: FormOutputUnion,             // see Section 5
    pub pt_form_output: Option<Form2551QOutput>,  // null if PT not applicable
    pub required_attachments: Vec<String>,
    pub penalties: Option<PenaltyResult>,         // null if on-time
    pub manual_review_flags: Vec<ManualReviewFlag>,
    pub warnings: Vec<ValidationWarning>,
    pub engine_version: String,
    pub computed_at: String,                      // "YYYY-MM-DD" date string
}
```

---

## 5. Union Type: FormOutputUnion

The `form_output` field in `TaxComputationResult` holds one of three form structs depending on `form_type`. In Rust, this is modeled as an enum with `#[serde(tag = "formVariant", content = "fields")]` (adjacently tagged):

```rust
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "formVariant", content = "fields", rename_all = "camelCase")]
pub enum FormOutputUnion {
    Form1701(Box<Form1701Output>),
    Form1701a(Box<Form1701AOutput>),
    Form1701q(Box<Form1701QOutput>),
}
```

**JSON shape:**
```json
{
  "formVariant": "Form1701a",
  "fields": {
    "taxYearCovered": 2025,
    "amendedReturn": false,
    ...
  }
}
```

**TypeScript discriminated union:**
```typescript
type FormOutputUnion =
  | { formVariant: "Form1701"; fields: Form1701Output }
  | { formVariant: "Form1701a"; fields: Form1701AOutput }
  | { formVariant: "Form1701q"; fields: Form1701QOutput };
```

**Note:** The `formType` field (`"FORM_1701"`, `"FORM_1701A"`, `"FORM_1701Q"`) in `TaxComputationResult` is already present as a separate top-level field. The `formVariant` discriminant inside `FormOutputUnion` uses the shorter PascalCase tag (`"Form1701a"` not `"FORM_1701A"`) to match Rust enum variant naming convention. The TypeScript layer must use `formType` for routing/display logic and `formVariant` only for type narrowing.

---

## 6. WasmResult Envelope

All WASM exports wrap their return in a `WasmResult` discriminated union:

```rust
#[derive(Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum WasmResult<T: Serialize> {
    #[serde(rename = "ok")]
    Ok { data: T },
    #[serde(rename = "error")]
    Error { errors: Vec<EngineError> },
}
```

**Success JSON:**
```json
{
  "status": "ok",
  "data": { ... TaxComputationResult ... }
}
```

**Error JSON:**
```json
{
  "status": "error",
  "errors": [
    {
      "code": "VAL-001",
      "message": "tax_year must be between 2018 and 2030",
      "field": "taxYear",
      "severity": "ERROR"
    }
  ]
}
```

---

## 7. Key Field-by-Field Quick Reference

Critical fields that are commonly mistyped or mismatched:

| Field | Rust Type | JSON Key | JSON Type | Notes |
|-------|-----------|----------|-----------|-------|
| `taxpayer_type` | `TaxpayerType` | `taxpayerType` | `string` | Enum: "PURELY_SE" etc |
| `tax_year` | `i32` | `taxYear` | `number` | 2018–2030 |
| `filing_period` | `FilingPeriod` | `filingPeriod` | `string` | "Q1"/"Q2"/"Q3"/"ANNUAL" |
| `gross_receipts` | `Decimal` | `grossReceipts` | `string` | Decimal string "0.00" |
| `elected_regime` | `Option<RegimeElection>` | `electedRegime` | `string\|null` | null = optimizer mode |
| `osd_elected` | `Option<bool>` | `osdElected` | `boolean\|null` | null = let engine decide |
| `actual_filing_date` | `Option<NaiveDate>` | `actualFilingDate` | `string\|null` | "YYYY-MM-DD" or null |
| `prior_quarterly_payments` | `Vec<QuarterlyPayment>` | `priorQuarterlyPayments` | `array` | `[]` for no prior payments |
| `cwt_2307_entries` | `Vec<Form2307Entry>` | `cwt2307Entries` | `array` | `[]` if no CWT certs |
| `overpayment_preference` | `Option<OverpaymentDisposition>` | `overpaymentPreference` | `string\|null` | NOT "PENDING_ELECTION" |
| `quarter_of_credit` | `Option<i32>` | `quarterOfCredit` | `number\|null` | 1/2/3 or null |
| `balance` | `Decimal` | `balance` | `string` | Output: "1234.50" |
| `disposition` | `BalanceDisposition` | `disposition` | `string` | "BALANCE_PAYABLE" etc |
| `overpayment_disposition` | `Option<OverpaymentDisposition>` | `overpaymentDisposition` | `string\|null` | null if not overpaid |
| `form_output` | `FormOutputUnion` | `formOutput` | `object` | Tagged union with formVariant |
| `pt_form_output` | `Option<Form2551QOutput>` | `ptFormOutput` | `object\|null` | null for 8% filers |
| `penalties` | `Option<PenaltyResult>` | `penalties` | `object\|null` | null = on-time |
| `path_a_details` | `Option<PathAResult>` | `pathADetails` | `object\|null` | null if COMPENSATION_ONLY |
| `path_b_details` | `Option<PathBResult>` | `pathBDetails` | `object\|null` | null if COMPENSATION_ONLY |
| `path_c_details` | `Option<PathCResult>` | `pathCDetails` | `object\|null` | null if all ineligible |
| `nolco_entries` | `Vec<NolcoEntry>` | `nolcoEntries` | `array` | `[]` if no NOLCO |

---

## 8. Cargo.toml Dependencies

The Rust engine requires these crates for serde implementation:

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
serde_with = { version = "3", features = ["macros"] }
rust_decimal = { version = "1", features = ["serde-with-str"] }
chrono = { version = "0.4", features = ["serde"] }
wasm-bindgen = "0.2"
```

**Key notes:**
- `rust_decimal` with `serde-with-str` feature enables `DisplayFromStr` serialization of `Decimal`
- `serde_with` provides the `#[serde_as]` macro and `DisplayFromStr` serializer
- `chrono::NaiveDate` + `DisplayFromStr` produces ISO 8601 `"YYYY-MM-DD"` strings
- Do NOT use `rust_decimal/serde-float` — that would serialize as JSON float, losing precision

---

## 9. Validation Rules for serde_json Parsing

The engine's input parsing must enforce:

1. **Missing required fields** → parse error (serde returns `Err` for missing non-Option fields)
2. **Wrong type** (e.g., `grossReceipts: 1234` as number instead of string) → parse error
3. **Unknown fields** (denied on input types) → parse error
4. **null for required field** (e.g., `grossReceipts: null`) → parse error (non-Option field)
5. **`"PENDING_ELECTION"` in `overpaymentPreference`** → validated and rejected in PL-01 (engine-level check after successful parse)
6. **`filing_period == "Q4"`** → no such variant, parse error before engine runs

These parse errors become `WasmResult::Error` with code `"PARSE_ERROR"` and the serde error message, before the engine pipeline runs.

---

## 10. Wire Format Examples

### Minimal Valid Input (PURELY_SE, Annual, Optimizer Mode)

```json
{
  "taxpayerType": "PURELY_SE",
  "taxYear": 2025,
  "filingPeriod": "ANNUAL",
  "isMixedIncome": false,
  "isVatRegistered": false,
  "isBmbeRegistered": false,
  "subjectToSec117128": false,
  "isGppPartner": false,
  "grossReceipts": "1200000.00",
  "salesReturnsAllowances": "0.00",
  "nonOperatingIncome": "0.00",
  "fwtIncome": "0.00",
  "costOfGoodsSold": "0.00",
  "taxableCompensation": "0.00",
  "compensationCwt": "0.00",
  "itemizedExpenses": {
    "salariesAndWages": "0.00",
    "sssPhilhealthPagibigEmployerShare": "0.00",
    "rent": "0.00",
    "utilities": "0.00",
    "communication": "0.00",
    "officeSupplies": "0.00",
    "professionalFeesPaid": "0.00",
    "travelTransportation": "0.00",
    "insurancePremiums": "0.00",
    "interestExpense": "0.00",
    "finalTaxedInterestIncome": "0.00",
    "taxesAndLicenses": "0.00",
    "casualtyTheftLosses": "0.00",
    "badDebts": "0.00",
    "isAccrualBasis": false,
    "depreciationEntries": [],
    "charitableContributions": "0.00",
    "charitableAccredited": false,
    "researchDevelopment": "0.00",
    "entertainmentRepresentation": "0.00",
    "homeOfficeExpense": "0.00",
    "homeOfficeExclusiveUse": false,
    "nolcoEntries": []
  },
  "electedRegime": null,
  "osdElected": null,
  "priorQuarterlyPayments": [],
  "cwt2307Entries": [],
  "priorYearExcessCwt": "0.00",
  "actualFilingDate": null,
  "returnType": "ORIGINAL",
  "priorPaymentForReturn": "0.00",
  "overpaymentPreference": null
}
```

### Minimal Valid Output (success envelope)

```json
{
  "status": "ok",
  "data": {
    "inputSummary": {
      "taxYear": 2025,
      "filingPeriod": "ANNUAL",
      "taxpayerType": "PURELY_SE",
      "taxpayerTier": "MICRO",
      "grossReceipts": "1200000.00",
      "isVatRegistered": false,
      "incomeType": "PURELY_SE"
    },
    "comparison": [
      {
        "path": "PATH_C",
        "incomeTaxDue": "76000.00",
        "percentageTaxDue": "0.00",
        "totalTaxBurden": "76000.00",
        "label": "Path C — 8% Flat Rate",
        "requiresDocumentation": false,
        "requiresOas": false,
        "effectiveRate": "0.063333"
      }
    ],
    "recommendedRegime": "PATH_C",
    "usingLockedRegime": false,
    "savingsVsWorst": "0.00",
    "savingsVsNextBest": "0.00",
    "selectedPath": "PATH_C",
    "selectedIncomeTaxDue": "76000.00",
    "selectedPercentageTaxDue": "0.00",
    "selectedTotalTax": "76000.00",
    "pathADetails": { ... },
    "pathBDetails": { ... },
    "pathCDetails": {
      "eligible": true,
      "ineligibleReasons": [],
      "exemptAmount": "250000.00",
      "taxableBase": "950000.00",
      "incomeTaxDue": "76000.00",
      "compensationIt": "0.00",
      "totalIncomeTax": "76000.00",
      "ptWaived": true,
      "deductionMethod": "NONE",
      "pathLabel": "Path C — 8% Flat Rate"
    },
    "balance": "76000.00",
    "disposition": "BALANCE_PAYABLE",
    "overpayment": "0.00",
    "overpaymentDisposition": null,
    "penalties": null,
    "formType": "FORM_1701A",
    "formOutput": {
      "formVariant": "Form1701a",
      "fields": { ... }
    },
    "ptFormOutput": null,
    "engineVersion": "1.0.0",
    "computedAt": "2026-03-06"
  }
}
```

### Error Output Example

```json
{
  "status": "error",
  "errors": [
    {
      "code": "VAL-001",
      "message": "taxYear must be between 2018 and 2030. Got: 2017",
      "field": "taxYear",
      "severity": "ERROR"
    }
  ]
}
```

---

## 11. Cross-Layer Consistency Checklist

Before marking this aspect complete, verify:

- [x] All Decimal/Peso/Rate fields listed as string in JSON
- [x] All Option<T> fields will serialize as null (no skip_serializing_if)
- [x] All enums have SCREAMING_SNAKE_CASE variants specified
- [x] All Date fields serialize as "YYYY-MM-DD" string
- [x] FormOutputUnion uses adjacently tagged enum (not untagged, not externally tagged)
- [x] WasmResult envelope uses "ok"/"error" tag
- [x] Input types have deny_unknown_fields
- [x] Output types do NOT have deny_unknown_fields
- [x] PENDING_ELECTION is output-only (rejected as input by PL-01)
- [x] Cargo.toml dependencies specified (rust_decimal serde-with-str, not serde-float)
- [x] camelCase applied to all field names (not just some)
- [x] Quarter serializes as number (1/2/3), not string
- [x] Vec<T> empty case is [] not null
