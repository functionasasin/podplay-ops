# Analysis: Error Contract — RA 7641 Retirement Pay Engine

**Wave:** 4 — Bridge Contract
**Aspect:** error-contract
**Date:** 2026-03-06
**Sources:** serde-wire-format.md, wasm-export-signature.md, data-model.md

---

## Overview

This document defines the complete error contract for the WASM bridge. Every error that can
emerge from `compute_single_json`, `compute_batch_json`, or `generate_nlrc_json` is cataloged
here with its exact JSON shape, Rust type definition, error code, trigger condition, and
expected frontend handling.

---

## 1. Rust `EngineError` Type

The top-level error type returned as `{"Err": <EngineError>}`:

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    /// Top-level error category. One of the codes in Section 3.
    pub code: ErrorCode,

    /// Human-readable error message. Suitable for display to the user.
    pub message: String,

    /// Per-field validation errors. Empty for parse/internal errors.
    /// Populated for `validation_failed` errors.
    pub fields: Vec<FieldError>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorCode {
    ParseError,         // → "parseError"
    ValidationFailed,   // → "validationFailed"
    InternalError,      // → "internalError"
    SerializationError, // → "serializationError"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldError {
    /// The camelCase JSON field name that caused the error.
    /// E.g., "basicSalaryCentavos", "retirementDate", "age".
    pub field: String,

    /// Machine-readable error code for this field. One of the codes in Section 4.
    pub code: FieldErrorCode,

    /// Human-readable message for this specific field error.
    pub message: String,

    /// Severity: whether the issue blocks computation or is a warning.
    pub severity: ErrorSeverity,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ErrorSeverity {
    Error,   // → "error"   — blocks computation
    Warning, // → "warning" — computation proceeds, user is informed
    Info,    // → "info"    — informational, no action needed
}
```

### 1.1 Serde Serialization

`ErrorCode` and `FieldErrorCode` are unit-variant enums with `#[serde(rename_all = "camelCase")]`.
The camelCase names are the wire representations.

`EngineError` uses `#[serde(rename_all = "camelCase")]`. Field names on the wire:
- `code` → `"code"`
- `message` → `"message"`
- `fields` → `"fields"`
- `FieldError.field` → `"field"`
- `FieldError.code` → `"code"`
- `FieldError.message` → `"message"`
- `FieldError.severity` → `"severity"`

---

## 2. Top-Level Error JSON Shape

### 2.1 Parse Error

Triggered when the input JSON is malformed, has unknown fields, has wrong types, or has
invalid enum variants.

```json
{
  "Err": {
    "code": "parseError",
    "message": "JSON parse failed: unknown field `retirementAGe`, expected one of `employeeName`, `companyName`, ...",
    "fields": []
  }
}
```

**fields is always empty for parseError.** The message string from `serde_json` is surfaced
directly. Frontend displays this as a generic "Invalid input format" toast with the message
in the details.

### 2.2 Validation Failed — Single Field

```json
{
  "Err": {
    "code": "validationFailed",
    "message": "Input validation failed: 1 error(s)",
    "fields": [
      {
        "field": "age",
        "code": "ageTooYoung",
        "message": "Age 55 is below the minimum of 60 for optional retirement under RA 7641 for general workers",
        "severity": "error"
      }
    ]
  }
}
```

### 2.3 Validation Failed — Multiple Fields

```json
{
  "Err": {
    "code": "validationFailed",
    "message": "Input validation failed: 3 error(s)",
    "fields": [
      {
        "field": "retirementDate",
        "code": "dateOrder",
        "message": "Retirement date 1999-01-01 is not after hire date 2000-01-01",
        "severity": "error"
      },
      {
        "field": "basicSalaryCentavos",
        "code": "negativeSalary",
        "message": "Basic salary must be greater than zero",
        "severity": "error"
      },
      {
        "field": "silDaysPerYear",
        "code": "invalidSilDays",
        "message": "SIL days must be 0, 5, 10, or 15; received 7",
        "severity": "error"
      }
    ]
  }
}
```

### 2.4 Validation Warning (Non-Blocking)

Some conditions produce `severity: "warning"` — the computation still succeeds (returned as
`{"Ok": ...}`), but warnings appear in the output's `eligibility.warnings` array. Warnings
are NOT returned as `Err`.

**Design rule:** Warnings surface in `RetirementOutput.eligibility.warnings` (array of
human-readable strings), not as `FieldError`. `FieldError.severity = "warning"` is reserved
for future use in batch row validation where a single row may have warnings that don't block
its computation.

### 2.5 Internal Error (Should Never Occur)

```json
{
  "Err": {
    "code": "internalError",
    "message": "Arithmetic overflow in credited years calculation: service_months overflowed i64",
    "fields": []
  }
}
```

This code is a safety net. It fires only if an invariant is violated in production (e.g.,
arithmetic overflow from absurdly large inputs that passed validation). Frontend shows:
"An unexpected error occurred. Please try again or contact support."

### 2.6 Serialization Error (Should Never Occur)

The fallback error, hardcoded as a raw string (not JSON-encoded through serde, to prevent
infinite loops):

```
{"Err":{"code":"serializationError","message":"Output serialization failed","fields":[]}}
```

This is returned via the `.unwrap_or_else()` fallback on `serde_json::to_string`. Frontend
parses it as JSON and shows the same "unexpected error" message.

---

## 3. Top-Level Error Code Catalog

| `code` (wire) | Trigger | `fields` populated? | Recovery |
|---------------|---------|---------------------|----------|
| `"parseError"` | Malformed JSON, unknown field, wrong type, invalid enum variant | No (empty array) | Fix the input before retrying |
| `"validationFailed"` | Semantically invalid field values (e.g., age too young, date order wrong) | Yes — one entry per invalid field | Highlight affected form fields and show field messages |
| `"internalError"` | Bug in the engine; arithmetic overflow on valid-looking input | No (empty array) | Show generic error; log to monitoring |
| `"serializationError"` | Output cannot be serialized (should never happen) | No (empty array) | Show generic error; log to monitoring |

### 3.1 `parseError` Triggers (Exhaustive)

All triggered by `serde_json::from_str` returning an error:

| Condition | Example |
|-----------|---------|
| Malformed JSON syntax | `{employeeName: "x"}` (unquoted key) |
| Unknown field (deny_unknown_fields active) | `{"unknownField": true}` |
| Wrong type for field | `{"age": "sixty"}` instead of integer |
| Missing required field | Omitting `"employeeName"` entirely |
| Invalid enum variant string | `{"workerCategory": "GENERAL"}` (wrong case) |
| Invalid date string | `{"hireDate": "15/01/2000"}` (wrong format) |
| Out-of-range date | `{"hireDate": "2024-02-30"}` (non-existent date) |
| Null on required non-Option field | `{"age": null}` |

### 3.2 `validationFailed` Triggers (Exhaustive)

Triggered by the `validate_input()` function after successful parsing:

| Condition | Field | FieldError code |
|-----------|-------|-----------------|
| `age < 50` for underground mine worker (optional retirement) | `age` | `ageTooYoung` |
| `age < 60` for general/racehorse worker (optional retirement) | `age` | `ageTooYoung` |
| `age < 55` for underground mine worker (compulsory) | `age` | `ageTooYoung` |
| `age < 65` for general/racehorse worker (compulsory) | `age` | `ageTooYoung` |
| `retirementDate <= hireDate` | `retirementDate` | `dateOrder` |
| `retirementDate` > today + 1 day | `retirementDate` | `dateInFuture` |
| `basicSalaryCentavos <= 0` | `basicSalaryCentavos` | `negativeSalary` |
| `silDaysPerYear` not in {0, 5, 10, 15} | `silDaysPerYear` | `invalidSilDays` |
| `employerSize == 0` | `employerSize` | `employerSizeZero` |
| `hasCompanyPlan == true` AND `companyPlanAmountCentavos == null` | `companyPlanAmountCentavos` | `missingCompanyPlanAmount` |
| `hasCompanyPlan == true` AND `companyPlanType == "none"` | `companyPlanType` | `inconsistentCompanyPlan` |
| `companyPlanAmountCentavos < 0` | `companyPlanAmountCentavos` | `negativeCompanyPlan` |
| `monthlyAllowanceCentavos < 0` | `monthlyAllowanceCentavos` | `negativeAllowance` |
| `retirementType == "death"` AND `retirementDate` > today | `retirementDate` | `deathDateInFuture` |
| Service months < 60 (5 years) for any retirement type except death | computed | `serviceTooShort` |

Note on `serviceTooShort`: For `retirementType == "death"`, the 5-year minimum does NOT apply
(RA 7641 Sec. 5 — heirs are entitled regardless of service length). For all other retirement
types, service < 60 months is a `validationFailed` error because RA 7641 requires at least
5 years of service. This is an error (not ineligibility) because the frontend Zod schema should
catch it before the engine, but the engine enforces it as a second line of defense.

**Edge case: `retirementType == "optional"` with service >= 5 years but age < threshold:**
This returns `validationFailed` with `ageTooYoung`. The employee is legally ineligible.

**Edge case: `employerSize <= 10` with service >= 5 years and age >= threshold:**
This does NOT produce an error. Instead, `RetirementOutput.eligibility.status = "ineligible"`
with `reasons: ["employerTooSmall"]`. The employer-size exemption is an ineligibility outcome,
not a validation error, because the computation is still valid — it just shows ₱0.

---

## 4. Field Error Code Catalog (`FieldErrorCode` enum)

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FieldErrorCode {
    AgeTooYoung,               // → "ageTooYoung"
    ServiceTooShort,           // → "serviceTooShort"
    DateOrder,                 // → "dateOrder"
    DateInFuture,              // → "dateInFuture"
    DeathDateInFuture,         // → "deathDateInFuture"
    NegativeSalary,            // → "negativeSalary"
    InvalidSilDays,            // → "invalidSilDays"
    EmployerSizeZero,          // → "employerSizeZero"
    MissingCompanyPlanAmount,  // → "missingCompanyPlanAmount"
    InconsistentCompanyPlan,   // → "inconsistentCompanyPlan"
    NegativeCompanyPlan,       // → "negativeCompanyPlan"
    NegativeAllowance,         // → "negativeAllowance"
}
```

### 4.1 Per-Code Human-Readable Message Templates

The `message` in `FieldError` is a complete English sentence generated by the engine.
These are the exact templates:

| `code` | Message template |
|--------|-----------------|
| `ageTooYoung` | `"Age {age} is below the minimum of {min} for {retirement_type} retirement under RA 7641 for {worker_category} workers"` |
| `serviceTooShort` | `"Total service of {months} months ({years} years, {remaining_months} months) is below the 5-year minimum required by RA 7641"` |
| `dateOrder` | `"Retirement date {retirement_date} must be after hire date {hire_date}"` |
| `dateInFuture` | `"Retirement date {retirement_date} cannot be in the future for a completed retirement"` |
| `deathDateInFuture` | `"Date of death (retirement date) {retirement_date} cannot be in the future"` |
| `negativeSalary` | `"Basic salary must be greater than zero; received ₱{amount}"` |
| `invalidSilDays` | `"SIL days per year must be 0, 5, 10, or 15; received {value}"` |
| `employerSizeZero` | `"Employer size must be at least 1"` |
| `missingCompanyPlanAmount` | `"Company plan amount is required when hasCompanyPlan is true"` |
| `inconsistentCompanyPlan` | `"Company plan type cannot be 'none' when hasCompanyPlan is true"` |
| `negativeCompanyPlan` | `"Company plan amount cannot be negative"` |
| `negativeAllowance` | `"Monthly allowance cannot be negative"` |

Placeholders in `{braces}` are substituted at runtime with actual values from the input.
E.g., `"Age 55 is below the minimum of 60 for optional retirement under RA 7641 for general workers"`.

---

## 5. Batch Error Contract

In `compute_batch_json`, errors are handled at two levels:

### 5.1 Top-Level Batch Error (Envelope Parse Failure)

If the `BatchInput` JSON envelope fails to parse, the entire function returns `Err`:

```json
{
  "Err": {
    "code": "parseError",
    "message": "Batch JSON parse failed: missing field `batchName` at line 1 column 2",
    "fields": []
  }
}
```

### 5.2 Per-Row Error (Row-Level Validation Failure)

Individual row failures do NOT propagate to the top level. Each row's result is either `Ok`
or `Err` inside `rows[].result`:

```json
{
  "Ok": {
    "batchName": "Q1 2025 Batch",
    "computationDate": "2025-03-15",
    "totalEmployees": 3,
    "successCount": 2,
    "errorCount": 1,
    "totalRetirementPayCentavos": 1500000000,
    "totalErroneousPayCentavos": 1125000000,
    "totalUnderpaymentCentavos": 375000000,
    "rows": [
      {
        "rowIndex": 0,
        "employeeName": "Juan dela Cruz",
        "result": {
          "Ok": { "retirementPayCentavos": 750000000 }
        }
      },
      {
        "rowIndex": 1,
        "employeeName": "Rosa Reyes",
        "result": {
          "Err": {
            "code": "validationFailed",
            "message": "Input validation failed: 1 error(s)",
            "fields": [
              {
                "field": "retirementDate",
                "code": "dateOrder",
                "message": "Retirement date 1999-06-01 must be after hire date 2000-06-01",
                "severity": "error"
              }
            ]
          }
        }
      },
      {
        "rowIndex": 2,
        "employeeName": "Pedro Gonzales",
        "result": {
          "Ok": { "retirementPayCentavos": 750000000 }
        }
      }
    ]
  }
}
```

**Key point:** The top-level `BatchOutput` is always `Ok` once the envelope parses. Per-row
`Err` entries are included in `errorCount`. The aggregation totals (`totalRetirementPayCentavos`
etc.) only count `Ok` rows.

---

## 6. `generate_nlrc_json` Error Contract

`generate_nlrc_json` runs `compute_single()` internally. Any error from computation returns
as a top-level `Err` — same shape as `compute_single_json`:

```json
{
  "Err": {
    "code": "validationFailed",
    "message": "Input validation failed: 1 error(s)",
    "fields": [
      {
        "field": "age",
        "code": "ageTooYoung",
        "message": "Age 55 is below the minimum of 60 for optional retirement under RA 7641 for general workers",
        "severity": "error"
      }
    ]
  }
}
```

There is no NLRC-worksheet-specific error code. All errors come from the underlying computation.

---

## 7. Ineligibility vs Error: Critical Distinction

**Ineligibility is NOT an error.** It is a valid computation result.

| Scenario | Return Shape | Reason |
|----------|-------------|--------|
| Employee age 55, optional retirement, general worker | `{"Err": {"code": "validationFailed", ...}}` | RA 7641 bars this — it's an invalid input |
| Employer with 8 employees, age 60, 10 years service | `{"Ok": {"eligibility": {"status": "ineligible", "reasons": ["employerTooSmall"]}, "retirementPayCentavos": 0, ...}}` | Legal ineligibility — employer is exempt from RA 7641; computation completes with ₱0 result |
| Employee with 3 years service, age 60, general worker | `{"Err": {"code": "validationFailed", ...}}` | RA 7641 requires 5 years minimum — invalid input |

The `retirementPayCentavos: 0` in the `employerTooSmall` case is intentional. The computation
completes successfully; the employee is simply not entitled under RA 7641. The frontend displays
the ineligibility reason prominently.

---

## 8. Frontend Error Handling Patterns

### 8.1 `unwrapWasmResult<T>()` (already defined in wasm-export-signature.md)

```typescript
// src/wasm/helpers.ts

export type ErrorCode = "parseError" | "validationFailed" | "internalError" | "serializationError";
export type FieldErrorCode =
  | "ageTooYoung"
  | "serviceTooShort"
  | "dateOrder"
  | "dateInFuture"
  | "deathDateInFuture"
  | "negativeSalary"
  | "invalidSilDays"
  | "employerSizeZero"
  | "missingCompanyPlanAmount"
  | "inconsistentCompanyPlan"
  | "negativeCompanyPlan"
  | "negativeAllowance";
export type ErrorSeverity = "error" | "warning" | "info";

export interface FieldError {
  field: string;
  code: FieldErrorCode;
  message: string;
  severity: ErrorSeverity;
}

export interface EngineError {
  code: ErrorCode;
  message: string;
  fields: FieldError[];
}

export interface WasmResult<T> {
  Ok?: T;
  Err?: EngineError;
}

// Throws WasmEngineError on Err; returns T on Ok
export function unwrapWasmResult<T>(json: string, fnName: string): T {
  let parsed: WasmResult<T>;
  try {
    parsed = JSON.parse(json) as WasmResult<T>;
  } catch {
    throw new WasmEngineError({
      code: "parseError",
      message: `[wasm/${fnName}] JSON parse of engine response failed: ${json.slice(0, 200)}`,
      fields: [],
    });
  }
  if (parsed.Err !== undefined) {
    throw new WasmEngineError(parsed.Err);
  }
  if (parsed.Ok === undefined) {
    throw new WasmEngineError({
      code: "internalError",
      message: `[wasm/${fnName}] Neither Ok nor Err in response`,
      fields: [],
    });
  }
  return parsed.Ok;
}

export class WasmEngineError extends Error {
  readonly engineError: EngineError;
  constructor(engineError: EngineError) {
    super(engineError.message);
    this.name = "WasmEngineError";
    this.engineError = engineError;
  }
}
```

### 8.2 React Hook Error Handling Pattern

```typescript
// src/hooks/useCompute.ts
import { computeSingle } from '../wasm/api';
import { WasmEngineError } from '../wasm/helpers';
import type { FieldError } from '../wasm/helpers';
import type { RetirementInput } from '../types/engine';

interface UseComputeReturn {
  compute: (input: RetirementInput) => void;
  isLoading: boolean;
  fieldErrors: Record<string, FieldError>;  // keyed by field name
  globalError: string | null;               // for parseError / internalError
}

export function useCompute(): UseComputeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldError>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const compute = useCallback((input: RetirementInput) => {
    setIsLoading(true);
    setFieldErrors({});
    setGlobalError(null);
    try {
      const output = computeSingle(input);  // throws WasmEngineError on Err
      // handle success...
    } catch (e) {
      if (e instanceof WasmEngineError) {
        if (e.engineError.code === "validationFailed" && e.engineError.fields.length > 0) {
          // Map field errors to the form: { "age": FieldError, "retirementDate": FieldError }
          const fieldMap: Record<string, FieldError> = {};
          for (const fe of e.engineError.fields) {
            fieldMap[fe.field] = fe;
          }
          setFieldErrors(fieldMap);
        } else {
          // parseError, internalError, serializationError — show global message
          setGlobalError(e.engineError.message);
        }
      } else {
        setGlobalError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { compute, isLoading, fieldErrors, globalError };
}
```

### 8.3 Field Error Display Pattern (React Hook Form integration)

```typescript
// In wizard step components:
const { fieldErrors } = useCompute();

// Usage in a form field:
<FormField
  name="age"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Age at Retirement</FormLabel>
      <FormControl>
        <Input type="number" {...field} />
      </FormControl>
      {fieldErrors.age && (
        <FormMessage>{fieldErrors.age.message}</FormMessage>
      )}
    </FormItem>
  )}
/>
```

The `fieldErrors` object maps camelCase field names (matching the WASM wire format) directly
to form field names. Since both use camelCase, no renaming is needed.

---

## 9. Toast Messages for Errors

Per the toast-catalog aspect (Wave 5), these are the toast messages for engine errors:

| Error scenario | Toast variant | Title | Description |
|----------------|---------------|-------|-------------|
| `validationFailed` with field errors | `"destructive"` | "Please fix the errors below" | "Check the highlighted fields and try again." |
| `parseError` (should not reach production UI) | `"destructive"` | "Invalid input format" | `engineError.message` (truncated to 200 chars) |
| `internalError` | `"destructive"` | "Computation error" | "An unexpected error occurred. Please try again or contact support." |
| `serializationError` | `"destructive"` | "Computation error" | "An unexpected error occurred. Please try again or contact support." |
| Batch top-level `parseError` | `"destructive"` | "Batch upload failed" | "The uploaded CSV could not be processed. Check the format and try again." |
| Batch with per-row errors (partial success) | `"default"` | "Batch complete with errors" | `"{errorCount} of {totalEmployees} employees could not be computed. See error details below."` |

---

## 10. Validation Order in the Engine

The Rust `validate_input()` function checks fields in this order. The order matters because
earlier checks prevent later checks from running on invalid state:

1. `employerSize > 0` → `employerSizeZero`
2. `basicSalaryCentavos > 0` → `negativeSalary`
3. `monthlyAllowanceCentavos >= 0` → `negativeAllowance`
4. `retirementDate > hireDate` → `dateOrder`
5. `retirementDate <= today` (for non-death types) → `dateInFuture`
6. `retirementDate <= today` (for death type) → `deathDateInFuture`
7. `silDaysPerYear in {0, 5, 10, 15}` → `invalidSilDays`
8. Service months >= 60 (for non-death types) → `serviceTooShort`
9. Age >= threshold for retirement type + worker category → `ageTooYoung`
10. Company plan consistency checks → `missingCompanyPlanAmount`, `inconsistentCompanyPlan`, `negativeCompanyPlan`

**All validation errors are collected before returning.** The engine does NOT short-circuit
on the first error. All 10 checks run, and all `FieldError` entries are accumulated in the
`fields` array. This gives the user a complete picture of all problems at once.

---

## 11. Zod Schema for Error (Frontend)

```typescript
// src/types/engine.ts

import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  "parseError",
  "validationFailed",
  "internalError",
  "serializationError",
]);

export const FieldErrorCodeSchema = z.enum([
  "ageTooYoung",
  "serviceTooShort",
  "dateOrder",
  "dateInFuture",
  "deathDateInFuture",
  "negativeSalary",
  "invalidSilDays",
  "employerSizeZero",
  "missingCompanyPlanAmount",
  "inconsistentCompanyPlan",
  "negativeCompanyPlan",
  "negativeAllowance",
]);

export const ErrorSeveritySchema = z.enum(["error", "warning", "info"]);

export const FieldErrorSchema = z.object({
  field: z.string(),
  code: FieldErrorCodeSchema,
  message: z.string(),
  severity: ErrorSeveritySchema,
}).strict();

export const EngineErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  fields: z.array(FieldErrorSchema),
}).strict();
```

The `WasmResult<T>` Zod schema is generic and constructed at call site:

```typescript
function wasmResultSchema<T>(okSchema: z.ZodType<T>) {
  return z.union([
    z.object({ Ok: okSchema }).strict(),
    z.object({ Err: EngineErrorSchema }).strict(),
  ]);
}
```

---

## 12. Error Contract Summary

| Layer | Error representation |
|-------|---------------------|
| Rust engine | `EngineError { code: ErrorCode, message: String, fields: Vec<FieldError> }` |
| WASM wire | `{"Err": {"code": "...", "message": "...", "fields": [...]}}` |
| TypeScript bridge | `WasmEngineError extends Error` with `.engineError: EngineError` property |
| React form | `fieldErrors: Record<string, FieldError>` for per-field display; `globalError: string` for fatal errors |
| Toast | Variant `"destructive"` with title + description per error category |
| Batch | Top-level `Err` for envelope parse failure; per-row `result.Err` for row-level failures |

**The `fields` array is always present** (never null, empty array for non-validation errors).
**The `severity` field is always present** on each `FieldError`.
**Error codes are camelCase strings** on the wire, matching the TypeScript `ErrorCode` union type exactly.
