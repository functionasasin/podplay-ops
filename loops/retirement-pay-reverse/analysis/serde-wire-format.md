# Analysis: Serde Wire Format — RA 7641 Retirement Pay Engine

**Wave:** 4 — Bridge Contract
**Aspect:** serde-wire-format
**Date:** 2026-03-06
**Sources:** data-model.md, wasm-export-signature.md, algorithms.md

---

## Overview

This document specifies the exact JSON wire format for all data crossing the WASM boundary.
Every field name, value encoding, null/absent distinction, and enum variant string is defined
here. The TypeScript types and Zod schemas in Wave 5 must match this document exactly.

---

## 1. Global Serde Rules

All structs and enums in the engine apply these rules uniformly:

```rust
// Applied to ALL input/output structs:
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]

// Applied to ALL enums (unit variants serialize as strings by default):
#[serde(rename_all = "camelCase")]
```

### 1.1 Field Naming

Rust `snake_case` → JSON `camelCase` via `rename_all = "camelCase"`.

| Rust field | JSON key |
|------------|----------|
| `basic_salary_centavos` | `"basicSalaryCentavos"` |
| `hire_date` | `"hireDate"` |
| `credited_years` | `"creditedYears"` |
| `is_tax_exempt` | `"isTaxExempt"` |
| `company_plan_amount_centavos` | `"companyPlanAmountCentavos"` |

**No exceptions.** Every field follows this rule. No manual `#[serde(rename = "...")]` overrides
are used in the wire-facing types.

### 1.2 Unknown Fields

`deny_unknown_fields` is applied to ALL input structs. Sending an unrecognized field causes a
parse error returned as `{"Err":{"code":"parse_error","message":"unknown field `xyz`..."}}`.

This is intentional: it prevents silent data loss and catches frontend bugs early.

### 1.3 Deny Unknown Fields on Output (for Zod)

Although `deny_unknown_fields` is a Rust deserialization attribute (not serialization), the
TypeScript side enforces the equivalent via Zod strict mode: `.strict()` on all output schemas.
Any field in the JSON response not present in the Zod schema causes a validation error.

---

## 2. Primitive Type Encodings

### 2.1 Money: `i64` Centavos → JSON Integer

All monetary values are `i64` centavos in Rust. They serialize as JSON integers (no decimal
point, no quotes).

```rust
pub basic_salary_centavos: i64,  // e.g., 6000000 = ₱60,000.00
```

```json
{ "basicSalaryCentavos": 6000000 }
```

**Rationale:** JSON numbers are IEEE 754 doubles, which can represent integers up to 2^53
exactly. ₱2^53 centavos ≈ ₱90 trillion — far beyond any realistic salary. No precision loss.

**Display conversion (frontend):** `₱60,000.00` = `(6000000 / 100).toFixed(2)` with
comma formatting. Never divide in Rust.

**Zero:** Represented as `0`, never `null`.

**Negative:** Allowed only for gap values (company plan excess over statutory minimum, which
can be negative if company plan is better). Most values are non-negative by invariant.

### 2.2 Dates: `chrono::NaiveDate` → ISO 8601 String

```rust
pub hire_date: NaiveDate,
pub retirement_date: NaiveDate,
```

Serializes to `"YYYY-MM-DD"` format via chrono's serde feature:

```json
{ "hireDate": "2000-01-15", "retirementDate": "2025-01-15" }
```

**Parsing rules:**
- Exactly 10 characters: `YYYY-MM-DD`
- Month 01–12, Day 01–31 (validated by chrono)
- No timezone suffix (NaiveDate has no timezone concept)
- Invalid dates (e.g., `"2024-02-30"`) cause a parse error

### 2.3 Booleans: `bool` → JSON `true`/`false`

```rust
pub has_bir_approved_plan: bool,
pub is_first_retirement: bool,
```

```json
{ "hasBirApprovedPlan": true, "isFirstRetirement": false }
```

**Never:** `"true"` (string), `1` (integer), `"yes"`, `null`. If the frontend needs to send
an unknown/unset boolean, it must be represented as a separate `Option<bool>` field (which
serializes to `null` — see Section 2.4).

### 2.4 Optional Fields: `Option<T>` → JSON `null` or Absent

```rust
pub company_plan_name: Option<String>,
pub company_plan_amount_centavos: Option<i64>,
```

**Rule:** `Option<T>` serializes with `#[serde(skip_serializing_if = "Option::is_none")]`
on INPUT structs and `#[serde(default)]` on... wait — the rule varies by direction:

#### Input Structs (frontend → Rust)

For required fields with optional semantics (i.e., the frontend may omit them):

```rust
#[serde(skip_serializing_if = "Option::is_none")]
pub company_plan_name: Option<String>,
```

Frontend may send either:
- `"companyPlanName": null` — explicitly absent
- Omit the key entirely — also absent (because `deny_unknown_fields` is NOT violated by absent
  keys; missing keys are filled with `None` for `Option` fields)

**Critical:** `deny_unknown_fields` only rejects EXTRA fields, not missing ones. Missing
`Option<T>` fields default to `None`.

#### Output Structs (Rust → frontend)

Output structs always serialize `null` for `None` values (no skipping). The frontend Zod
schemas use `z.nullable()` to accept `null` and `z.optional()` is NOT used for wire fields.

```json
{ "companyPlanName": null, "companyPlanAmountCentavos": null }
```

**Reasoning:** Explicit `null` in output is better than absent keys because it makes the shape
predictable. Frontend code can use `output.companyPlanName ?? "N/A"` reliably.

### 2.5 Strings: Rust `String` → JSON `"string"`

Plain UTF-8 strings. Employee names, company names, plan names. No length limit enforced in
Rust (length validation is in the frontend Zod schema).

```json
{ "employeeName": "Juan dela Cruz", "companyName": "Manila Textiles Inc." }
```

### 2.6 Integers (Non-Money): `u32`, `i32`

Used for credited years (as rational numerator/denominator) and month counts.

```rust
pub credited_years_whole: u32,    // whole years portion, e.g., 25
pub credited_years_months: u32,   // months after whole years, 0–11
```

```json
{ "creditedYearsWhole": 25, "creditedYearsMonths": 6 }
```

### 2.7 Rational Numbers: Stored as Numerator + Denominator Integers

The 22.5-day multiplier is represented in output as integers to avoid float imprecision:

```rust
pub daily_rate_numerator: i64,     // e.g., 200000000 (₱2000.00 * 100 centavos)
pub daily_rate_denominator: u32,   // e.g., 1 (always 1 for daily rate output)
```

In practice, the `RetirementOutput` exposes pre-computed centavo values rather than fractions.
The 22.5-day multiplication is done as:
- `retirement_pay = daily_rate_centavos * 225 * credited_years / 10`
- All integer arithmetic (see algorithms.md)
- Output is the final `i64` centavo value, not the fraction

---

## 3. Enum Wire Serializations

All unit-variant enums serialize as camelCase strings:

### 3.1 `WorkerCategory`

```rust
pub enum WorkerCategory {
    General,            // → "general"
    UndergroundMine,    // → "undergroundMine"
    Racehorse,         // → "racehorse"
}
```

```json
{ "workerCategory": "general" }
{ "workerCategory": "undergroundMine" }
{ "workerCategory": "racehorse" }
```

### 3.2 `RetirementType`

```rust
pub enum RetirementType {
    Optional,           // → "optional"
    Compulsory,         // → "compulsory"
    Death,              // → "death"
}
```

```json
{ "retirementType": "optional" }
```

### 3.3 `EligibilityStatus`

```rust
pub enum EligibilityStatus {
    Eligible,                  // → "eligible"
    Ineligible,                // → "ineligible"
    EligibleWithWarnings,      // → "eligibleWithWarnings"
}
```

```json
{ "status": "eligible" }
{ "status": "ineligible" }
{ "status": "eligibleWithWarnings" }
```

### 3.4 `IneligibilityReason`

```rust
pub enum IneligibilityReason {
    AgeTooYoung,               // → "ageTooYoung"
    ServiceTooShort,           // → "serviceTooShort"
    EmployerTooSmall,          // → "employerTooSmall"
    AlreadyReceivedBenefit,    // → "alreadyReceivedBenefit"
}
```

```json
{ "reason": "ageTooYoung" }
{ "reason": "serviceTooShort" }
```

### 3.5 `TaxTreatment`

```rust
pub enum TaxTreatment {
    FullyExempt,     // → "fullyExempt"
    PartiallyExempt, // → "partiallyExempt"
    FullyTaxable,    // → "fullyTaxable"
}
```

```json
{ "taxTreatment": "fullyExempt" }
```

### 3.6 `SeparationPayBasis`

```rust
pub enum SeparationPayBasis {
    AuthorizedCause,    // → "authorizedCause"
    Retrenchment,       // → "retrenchment"
    Redundancy,         // → "redundancy"
    Closure,            // → "closure"
    Disease,            // → "disease"
    NotApplicable,      // → "notApplicable"
}
```

```json
{ "separationPayBasis": "authorizedCause" }
{ "separationPayBasis": "notApplicable" }
```

### 3.7 `CompanyPlanType`

```rust
pub enum CompanyPlanType {
    DefinedBenefit,     // → "definedBenefit"
    DefinedContribution, // → "definedContribution"
    None,               // → "none"
}
```

```json
{ "companyPlanType": "definedBenefit" }
{ "companyPlanType": "none" }
```

### 3.8 `CsvErrorKind`

```rust
pub enum CsvErrorKind {
    MissingColumn,      // → "missingColumn"
    InvalidDate,        // → "invalidDate"
    InvalidNumber,      // → "invalidNumber"
    NegativeValue,      // → "negativeValue"
    EmptyRequired,      // → "emptyRequired"
    InvalidEnum,        // → "invalidEnum"
}
```

---

## 4. Complete Wire Format: `RetirementInput`

The exact JSON shape sent from frontend to `compute_single_json` and `generate_nlrc_json`:

```json
{
  "employeeName": "Maria Santos",
  "companyName": "Metro Pacific Investments Corp.",
  "employerSize": 500,
  "workerCategory": "general",
  "hireDate": "2000-03-15",
  "retirementDate": "2025-03-15",
  "retirementType": "optional",
  "basicSalaryCentavos": 12000000,
  "silDaysPerYear": 5,
  "hasThirteenthMonth": true,
  "monthlyAllowanceCentavos": 0,
  "hasCompanyPlan": false,
  "companyPlanType": "none",
  "companyPlanAmountCentavos": null,
  "companyPlanName": null,
  "hasBirApprovedPlan": false,
  "isFirstRetirement": true,
  "age": 60,
  "separationPayBasis": "notApplicable"
}
```

### Required vs Optional Fields in `RetirementInput`

| Field | Rust Type | Required | Default if absent |
|-------|-----------|----------|-------------------|
| `employeeName` | `String` | Yes | — parse error |
| `companyName` | `String` | Yes | — parse error |
| `employerSize` | `u32` | Yes | — parse error |
| `workerCategory` | `WorkerCategory` | Yes | — parse error |
| `hireDate` | `NaiveDate` | Yes | — parse error |
| `retirementDate` | `NaiveDate` | Yes | — parse error |
| `retirementType` | `RetirementType` | Yes | — parse error |
| `basicSalaryCentavos` | `i64` | Yes | — parse error |
| `silDaysPerYear` | `u32` | Yes | — parse error |
| `hasThirteenthMonth` | `bool` | Yes | — parse error |
| `monthlyAllowanceCentavos` | `i64` | Yes | — parse error |
| `hasCompanyPlan` | `bool` | Yes | — parse error |
| `companyPlanType` | `CompanyPlanType` | Yes | — parse error |
| `companyPlanAmountCentavos` | `Option<i64>` | No | `null` / `None` |
| `companyPlanName` | `Option<String>` | No | `null` / `None` |
| `hasBirApprovedPlan` | `bool` | Yes | — parse error |
| `isFirstRetirement` | `bool` | Yes | — parse error |
| `age` | `u32` | Yes | — parse error |
| `separationPayBasis` | `SeparationPayBasis` | Yes | — parse error |

---

## 5. Complete Wire Format: `RetirementOutput`

The exact JSON shape returned from `compute_single_json` on success (inside `{"Ok": ...}`):

```json
{
  "Ok": {
    "employeeName": "Maria Santos",
    "companyName": "Metro Pacific Investments Corp.",
    "eligibility": {
      "status": "eligible",
      "reasons": [],
      "warnings": []
    },
    "creditedYearsWhole": 25,
    "creditedYearsMonths": 0,
    "creditedYearsRounded": 25,
    "dailyRateCentavos": 40000,
    "fifteenDaysPayCentavos": 15000000,
    "silPayCentavos": 5000000,
    "thirteenthMonthPayCentavos": 10000000,
    "totalHalfMonthCentavos": 30000000,
    "retirementPayCentavos": 750000000,
    "taxTreatment": "fullyTaxable",
    "taxableAmountCentavos": 750000000,
    "exemptAmountCentavos": 0,
    "separationPayComparison": {
      "separationPayBasis": "notApplicable",
      "separationPayCentavos": null,
      "retirementPayIsHigher": null,
      "recommendedBenefitCentavos": null
    },
    "companyPlanComparison": {
      "companyPlanType": "none",
      "companyPlanAmountCentavos": null,
      "statutoryMinimumCentavos": 750000000,
      "gapCentavos": null,
      "companyPlanIsSufficient": null
    },
    "breakdown": {
      "step1EligibilityPassed": true,
      "step2ServiceMonths": 300,
      "step3CreditedYearsRounded": 25,
      "step4DailyRateCentavos": 40000,
      "step5HalfMonthComponents": {
        "fifteenDaysCentavos": 15000000,
        "silCentavos": 5000000,
        "thirteenthMonthCentavos": 10000000
      },
      "step6RetirementPayCentavos": 750000000,
      "step7TaxTreatment": "fullyTaxable",
      "step8SeparationPayComparison": null,
      "step9CompanyPlanGap": null
    },
    "erroneous15DayPayCentavos": 562500000,
    "correctMinusErroneousCentavos": 187500000
  }
}
```

### `RetirementOutput` Field Table

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `employeeName` | `String` | Echoed from input |
| `companyName` | `String` | Echoed from input |
| `eligibility.status` | `EligibilityStatus` | "eligible" / "ineligible" / "eligibleWithWarnings" |
| `eligibility.reasons` | `Vec<IneligibilityReason>` | Empty array if eligible |
| `eligibility.warnings` | `Vec<String>` | Human-readable warnings |
| `creditedYearsWhole` | `u32` | Whole years of service (before rounding) |
| `creditedYearsMonths` | `u32` | Remaining months after whole years (0–11) |
| `creditedYearsRounded` | `u32` | Years after 6-month rounding rule |
| `dailyRateCentavos` | `i64` | Basic salary / 26 days (centavos) |
| `fifteenDaysPayCentavos` | `i64` | 15 × dailyRate |
| `silPayCentavos` | `i64` | SIL days × dailyRate (5 × dailyRate standard) |
| `thirteenthMonthPayCentavos` | `i64` | basicSalary / 12 |
| `totalHalfMonthCentavos` | `i64` | 15-day + SIL + 13th month (= 22.5 × dailyRate) |
| `retirementPayCentavos` | `i64` | totalHalfMonth × creditedYearsRounded |
| `taxTreatment` | `TaxTreatment` | "fullyExempt" / "partiallyExempt" / "fullyTaxable" |
| `taxableAmountCentavos` | `i64` | 0 if fullyExempt |
| `exemptAmountCentavos` | `i64` | 0 if fullyTaxable |
| `separationPayComparison` | `SeparationPayComparison` | Always present; fields may be null |
| `companyPlanComparison` | `CompanyPlanComparison` | Always present; fields may be null |
| `breakdown` | `ComputationBreakdown` | Step-by-step audit trail |
| `erroneous15DayPayCentavos` | `i64` | What employer would pay using wrong 15-day formula |
| `correctMinusErroneousCentavos` | `i64` | The underpayment amount: correct − erroneous |

---

## 6. Complete Wire Format: `BatchInput`

```json
{
  "employees": [
    {
      "rowIndex": 0,
      "employeeName": "Juan dela Cruz",
      "companyName": "Manila Textiles Inc.",
      "employerSize": 250,
      "workerCategory": "general",
      "hireDate": "1995-06-01",
      "retirementDate": "2025-06-01",
      "retirementType": "optional",
      "basicSalaryCentavos": 5000000,
      "silDaysPerYear": 5,
      "hasThirteenthMonth": true,
      "monthlyAllowanceCentavos": 0,
      "hasCompanyPlan": false,
      "companyPlanType": "none",
      "companyPlanAmountCentavos": null,
      "companyPlanName": null,
      "hasBirApprovedPlan": false,
      "isFirstRetirement": true,
      "age": 60,
      "separationPayBasis": "notApplicable"
    }
  ],
  "batchName": "Q1 2025 Retirement Batch",
  "computationDate": "2025-03-15"
}
```

### `BatchInput` Field Table

| JSON Key | Rust Type | Required | Description |
|----------|-----------|----------|-------------|
| `employees` | `Vec<BatchEmployeeInput>` | Yes | One entry per employee |
| `batchName` | `String` | Yes | HR label for this batch |
| `computationDate` | `NaiveDate` | Yes | Date computation is run (for records) |

### `BatchEmployeeInput` = `RetirementInput` + `rowIndex`

`BatchEmployeeInput` is `RetirementInput` with one additional field prepended:

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `rowIndex` | `u32` | Zero-based CSV row number (for error reporting) |
| *(all RetirementInput fields)* | *(same)* | Identical to RetirementInput |

---

## 7. Complete Wire Format: `BatchOutput`

```json
{
  "Ok": {
    "batchName": "Q1 2025 Retirement Batch",
    "computationDate": "2025-03-15",
    "totalEmployees": 3,
    "successCount": 3,
    "errorCount": 0,
    "totalRetirementPayCentavos": 2250000000,
    "totalErroneousPayCentavos": 1687500000,
    "totalUnderpaymentCentavos": 562500000,
    "rows": [
      {
        "rowIndex": 0,
        "employeeName": "Juan dela Cruz",
        "result": {
          "Ok": { /* RetirementOutput fields */ }
        }
      },
      {
        "rowIndex": 1,
        "employeeName": "Rosa Reyes",
        "result": {
          "Err": {
            "code": "validation_failed",
            "message": "Retirement date must be after hire date",
            "fields": [
              { "field": "retirementDate", "code": "date_order", "message": "Retirement date must be after hire date" }
            ]
          }
        }
      }
    ]
  }
}
```

### `BatchOutput` Field Table

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `batchName` | `String` | Echoed from input |
| `computationDate` | `NaiveDate` | Echoed from input |
| `totalEmployees` | `u32` | Count of all rows |
| `successCount` | `u32` | Rows where result is Ok |
| `errorCount` | `u32` | Rows where result is Err |
| `totalRetirementPayCentavos` | `i64` | Sum of retirementPayCentavos for Ok rows |
| `totalErroneousPayCentavos` | `i64` | Sum of erroneous15DayPayCentavos for Ok rows |
| `totalUnderpaymentCentavos` | `i64` | totalRetirement − totalErroneous |
| `rows` | `Vec<BatchRowResult>` | Per-employee results |

### `BatchRowResult` Field Table

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `rowIndex` | `u32` | Matches input rowIndex |
| `employeeName` | `String` | Echoed from input |
| `result` | `Result<RetirementOutput, EngineError>` | `{"Ok":{...}}` or `{"Err":{...}}` |

---

## 8. Complete Wire Format: `NlrcWorksheet`

```json
{
  "Ok": {
    "caseCaption": "JUAN DELA CRUZ vs. MANILA TEXTILES INC.",
    "claimantName": "Juan dela Cruz",
    "respondentName": "Manila Textiles Inc.",
    "dateOfBirth": null,
    "dateOfHire": "1995-06-01",
    "dateOfRetirement": "2025-06-01",
    "yearsOfService": "30 years, 0 months",
    "creditedYears": 30,
    "monthlyBasicSalary": "₱50,000.00",
    "dailyRate": "₱1,923.08",
    "halfMonthSalaryBreakdown": {
      "fifteenDaysLabel": "15 days × ₱1,923.08/day",
      "fifteenDaysAmount": "₱28,846.15",
      "silLabel": "5 days SIL × ₱1,923.08/day",
      "silAmount": "₱9,615.38",
      "thirteenthMonthLabel": "1/12 × ₱50,000.00 monthly salary",
      "thirteenthMonthAmount": "₱4,166.67",
      "totalLabel": "Total: 22.5 days equivalent",
      "totalAmount": "₱42,628.20"
    },
    "computationTable": [
      {
        "description": "Basic Monthly Salary",
        "amount": "₱50,000.00",
        "amountCentavos": 5000000
      },
      {
        "description": "Daily Rate (Monthly Salary ÷ 26)",
        "amount": "₱1,923.08",
        "amountCentavos": 192308
      },
      {
        "description": "15 Days Salary (15 × Daily Rate)",
        "amount": "₱28,846.15",
        "amountCentavos": 2884615
      },
      {
        "description": "5 Days SIL (5 × Daily Rate)",
        "amount": "₱9,615.38",
        "amountCentavos": 961538
      },
      {
        "description": "1/12 of 13th Month Pay",
        "amount": "₱4,166.67",
        "amountCentavos": 416667
      },
      {
        "description": "Total 1/2 Month Salary (22.5 days equivalent)",
        "amount": "₱42,628.20",
        "amountCentavos": 4262820
      },
      {
        "description": "× Years of Service",
        "amount": "× 30 years",
        "amountCentavos": null
      },
      {
        "description": "TOTAL RETIREMENT PAY",
        "amount": "₱1,278,846.00",
        "amountCentavos": 127884600
      }
    ],
    "legalBasisStatements": [
      "Retirement pay computed pursuant to Republic Act No. 7641 (Retirement Pay Law) and the Labor Code of the Philippines, as amended.",
      "The \"one-half month salary\" for every year of service is defined to include: (1) fifteen (15) days salary based on the latest salary rate; (2) the cash equivalent of five (5) days of service incentive leave; and (3) one-twelfth (1/12) of the thirteenth-month pay within the twelve-month period immediately preceding the retirement of the employee.",
      "Authority: Sec. 5, Republic Act 7641; Art. 302, Labor Code; Implementing Rules, DOLE.",
      "Case authority: Elegir v. Philippine Airlines, Inc., G.R. No. 181995 (July 16, 2012) — confirming 22.5-day formula."
    ],
    "exhibitLabel": "ANNEX \"A\" — COMPUTATION OF RETIREMENT PAY",
    "preparedBy": null,
    "preparedDate": "2025-03-15",
    "comparisonNote": "NOTE: The correct retirement pay of ₱1,278,846.00 is ₱319,711.50 higher than what would be computed using only 15 days (₱959,134.50). The difference represents the SIL and 13th month components legally mandated by RA 7641.",
    "rawCentavos": {
      "retirementPayCentavos": 127884600,
      "erroneous15DayPayCentavos": 95913450,
      "correctMinusErroneousCentavos": 31971150
    }
  }
}
```

### `NlrcWorksheet` Field Table

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `caseCaption` | `String` | "CLAIMANT vs. RESPONDENT" all caps |
| `claimantName` | `String` | Employee name |
| `respondentName` | `String` | Company name |
| `dateOfBirth` | `Option<NaiveDate>` | null if not provided |
| `dateOfHire` | `NaiveDate` | ISO 8601 |
| `dateOfRetirement` | `NaiveDate` | ISO 8601 |
| `yearsOfService` | `String` | Human label e.g. "25 years, 6 months" |
| `creditedYears` | `u32` | After rounding |
| `monthlyBasicSalary` | `String` | Formatted: "₱60,000.00" |
| `dailyRate` | `String` | Formatted: "₱2,307.69" |
| `halfMonthSalaryBreakdown` | `HalfMonthBreakdown` | Human-readable labels + amounts |
| `computationTable` | `Vec<ComputationRow>` | Ordered rows for exhibit table |
| `legalBasisStatements` | `Vec<String>` | Statutory citations |
| `exhibitLabel` | `String` | e.g. "ANNEX \"A\" — COMPUTATION OF RETIREMENT PAY" |
| `preparedBy` | `Option<String>` | null if not provided |
| `preparedDate` | `NaiveDate` | Date of generation |
| `comparisonNote` | `String` | The 15-day vs 22.5-day difference note |
| `rawCentavos` | `NlrcRawCentavos` | Machine-readable centavo values |

### `ComputationRow` Field Table

| JSON Key | Rust Type | Description |
|----------|-----------|-------------|
| `description` | `String` | Row label |
| `amount` | `String` | Formatted amount string |
| `amountCentavos` | `Option<i64>` | null for non-monetary rows (e.g. "× 30 years") |

---

## 9. Complete Wire Format: `EngineError` (Error Cases)

Used in both top-level `Err` and per-row batch `Err`:

```json
{
  "Err": {
    "code": "validation_failed",
    "message": "Employee age does not meet minimum for optional retirement (60 years required for general workers)",
    "fields": [
      {
        "field": "age",
        "code": "age_too_young",
        "message": "Age 55 is below the minimum of 60 for optional retirement under RA 7641"
      }
    ]
  }
}
```

### Error Code Catalog

| `code` | Trigger |
|--------|---------|
| `"parse_error"` | JSON is malformed or has unknown fields |
| `"validation_failed"` | Fields are syntactically valid but semantically invalid |
| `"internal_error"` | Should never occur; indicates a bug in the engine |
| `"serialization_error"` | Should never occur; fallback if output cannot be serialized |

### Field Error Codes

| `fields[].code` | Meaning |
|-----------------|---------|
| `"age_too_young"` | age < minimum for retirement type |
| `"service_too_short"` | service < 5 years |
| `"date_order"` | retirementDate <= hireDate |
| `"date_in_future"` | retirementDate is after today |
| `"negative_salary"` | basicSalaryCentavos <= 0 |
| `"invalid_sil_days"` | silDaysPerYear not in {0, 5, 10, 15} |
| `"employer_size_zero"` | employerSize = 0 |

---

## 10. Serde Attribute Reference (Per-Type Summary)

### Input Types

```rust
// All input structs:
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
#[serde(deny_unknown_fields)]
pub struct RetirementInput { ... }

// Optional fields on input:
#[serde(default)]  // fills None if key absent
pub company_plan_amount_centavos: Option<i64>,
```

### Output Types

```rust
// All output structs:
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RetirementOutput { ... }

// Optional fields on output (null serialized explicitly):
// NO skip_serializing_if on output — always emit null
pub company_plan_amount_centavos: Option<i64>,
```

### Enums

```rust
// Unit-variant enums:
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum WorkerCategory { General, UndergroundMine, Racehorse }
// Serializes to: "general", "undergroundMine", "racehorse"

// Result<T, E> (not a custom enum — standard Rust Result):
// Serializes to: {"Ok": <T>} or {"Err": <E>}
```

---

## 11. JSON Strictness Contract

### What the Rust Engine Guarantees on Output

1. All JSON keys are camelCase (no snake_case on the wire)
2. All monetary values are integers (no decimal points)
3. All dates are ISO 8601 strings (`"YYYY-MM-DD"`)
4. All enums are camelCase strings
5. Optional values that are absent are serialized as `null` (never omitted) in output
6. `Vec<T>` fields that are empty serialize as `[]` (never `null`)
7. `Result<T,E>` wraps every top-level response as `{"Ok":...}` or `{"Err":...}`
8. Per-row batch results also use `{"Ok":...}` or `{"Err":...}` inside `rows[].result`

### What the Rust Engine Rejects on Input

1. Unknown fields → `parse_error`
2. Missing required fields → `parse_error` (serde treats missing non-Option fields as errors)
3. Wrong type (e.g., string where integer expected) → `parse_error`
4. Unknown enum variant strings → `parse_error`
5. Invalid date strings (e.g., `"2024-13-01"`) → `parse_error`

### What the Frontend MUST Guarantee When Sending Input

1. All required fields present (see Section 4 table)
2. Money values are integers (centavos), never floats or strings
3. Dates are `"YYYY-MM-DD"` strings
4. Enum fields use exact camelCase strings from Section 3
5. Optional fields: send `null` or omit — do NOT send `undefined` (JSON.stringify drops `undefined` keys, which is acceptable since engine treats missing Option fields as None)

---

## 12. TypeScript Serialization Notes

### `JSON.stringify` behavior with the wire format

```typescript
// CORRECT: centavos as integer
const input = { basicSalaryCentavos: 6000000 }; // ✓

// WRONG: float (avoid)
const input = { basicSalaryCentavos: 60000.00 }; // ✗ — still works (JS truncates) but wrong intent

// CORRECT: date as string
const input = { hireDate: "2000-01-15" }; // ✓

// WRONG: date as Date object (JSON.stringify produces ISO 8601 with timezone)
const input = { hireDate: new Date("2000-01-15") }; // ✗ — becomes "2000-01-15T00:00:00.000Z"
```

The frontend Zod schemas enforce `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` for date fields to
catch this mistake early.

### `undefined` vs `null` for Optional Fields

```typescript
// CORRECT: send null
const input = { companyPlanAmountCentavos: null }; // ✓ — engine receives null → None

// ALSO CORRECT: omit the key
const input = {}; // companyPlanAmountCentavos absent → engine treats as None

// WRONG: send undefined (JSON.stringify drops it — equivalent to omit, so functionally OK)
// but: Zod schema should use z.nullable() not z.optional() to enforce intent

// WRONG on output: frontend MUST handle null (never undefined) from engine output
const pay = output.companyPlanAmountCentavos ?? 0; // ✓ null coalescing
const pay = output.companyPlanAmountCentavos || 0; // ✗ falsy coalesces 0 too
```

---

## Summary

| Concern | Rule |
|---------|------|
| Field naming | `snake_case` → `camelCase` (rename_all) |
| Unknown fields | Rejected with `parse_error` (deny_unknown_fields) |
| Money | `i64` centavos → JSON integer |
| Dates | `NaiveDate` → `"YYYY-MM-DD"` string |
| Booleans | `bool` → `true`/`false` |
| Enums | Unit variants → camelCase strings |
| Options (output) | `None` → `null` (always emitted) |
| Options (input) | `null` or absent → `None` |
| Arrays | `Vec<T>` → JSON array, empty → `[]` not `null` |
| Top-level result | `Result<T,E>` → `{"Ok":T}` or `{"Err":E}` |
| Batch row result | Per-row `Result<T,E>` → same shape inside `rows[].result` |
