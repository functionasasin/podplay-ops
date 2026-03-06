# Error Contract — TaxKlaro WASM Engine

**Wave:** 2 (Bridge Contract)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** wasm-export-signature, serde-wire-format

---

## Summary

The TaxKlaro engine produces six categories of error/warning output. This document specifies the exact Rust types, serde attributes, JSON wire format, TypeScript interfaces, and frontend handling contract for every category. The `wasm-export-signature` analysis defined the `WasmResult` envelope; this document fills in every field of every error type and specifies exactly how the frontend classifies and displays each category.

---

## 1. Error Taxonomy

| Category | Codes | Computation outcome | Frontend treatment |
|----------|-------|--------------------|--------------------|
| Hard Validation Errors | `ERR_*` (VAL-001–028) | Abort at PL-01, return `WasmResult::Error` | Show red error banner, highlight field, block compute |
| Ineligibility Errors | `ERR_ELECTED_INELIGIBLE_*` | Abort at PL-04, return `WasmResult::Error` | Show red error explaining why regime is unavailable |
| Engine Assertion Errors | `ERR_ASSERT_*` | Abort, return `WasmResult::Error` | Log to Sentry, show generic "unexpected error" toast |
| Soft Warnings | `WARN_*` | Computation continues, attached to result | Show amber/blue advisory banners alongside results |
| Ineligibility Notifications | `IN-*` | Path C skipped, computation continues | Show info note: "8% not available because..." |
| Manual Review Flags | `MRF-*` | Computation continues with conservative assumption | Show yellow advisory: "Review with CPA before filing" |

---

## 2. Rust Types with Serde Attributes

### 2.1 ErrorSeverity

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorSeverity {
    HardError,       // serializes as "HARD_ERROR"
    AssertionError,  // serializes as "ASSERTION_ERROR"
}
```

### 2.2 WarningSeverity

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WarningSeverity {
    Informational,  // serializes as "INFORMATIONAL"
    Advisory,       // serializes as "ADVISORY"
}
```

### 2.3 MrfCategory

```rust
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MrfCategory {
    ExpenseClassification,  // "EXPENSE_CLASSIFICATION"
    Timing,                 // "TIMING"
    Registration,           // "REGISTRATION"
    Foreign,                // "FOREIGN"
    Substantiation,         // "SUBSTANTIATION"
    AtcCode,                // "ATC_CODE"
}
```

### 2.4 EngineError

Returned when computation must abort. Used as the `Error` variant of `WasmResult`.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineError {
    pub code: String,                      // e.g. "ERR_INVALID_TAX_YEAR"
    pub message: String,                   // developer-facing prose (for logs)
    pub user_message: String,              // user-facing plain language
    pub field: Option<String>,             // camelCase field name, null if cross-field
    pub validation_code: Option<String>,   // "VAL-001" etc., null for assertion errors
    pub severity: ErrorSeverity,           // "HARD_ERROR" or "ASSERTION_ERROR"
}
```

**Wire example (hard validation error):**
```json
{
  "code": "ERR_INVALID_TAX_YEAR",
  "message": "Tax year 2031 is outside the supported range [2018, 2030]",
  "userMessage": "The tax year must be between 2018 and 2030. The TRAIN Law graduated rate table (which this tool uses) took effect in 2018. Years after 2030 are not yet supported.",
  "field": "taxYear",
  "validationCode": "VAL-001",
  "severity": "HARD_ERROR"
}
```

**Wire example (assertion error):**
```json
{
  "code": "ERR_ASSERT_NEGATIVE_IT_DUE",
  "message": "Invariant INV-PA-01 violated: income_tax_due is -125.00 on PathA",
  "userMessage": "An unexpected error occurred during tax computation (error code: ERR_ASSERT_NEGATIVE_IT_DUE). This is a software issue, not a problem with your inputs. Please try again. If the error persists, contact support at support@taxklaro.ph.",
  "field": null,
  "validationCode": null,
  "severity": "ASSERTION_ERROR"
}
```

### 2.5 ValidationWarning

Attached to `TaxComputationResult.validationWarnings`. Does NOT abort computation.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationWarning {
    pub code: String,               // e.g. "WARN_NEAR_VAT_THRESHOLD"
    pub message: String,            // developer-facing prose
    pub user_message: String,       // user-facing explanation
    pub field: Option<String>,      // relevant input field, null if general
    pub severity: WarningSeverity,  // "INFORMATIONAL" or "ADVISORY"
}
```

**Wire example:**
```json
{
  "code": "WARN_NEAR_VAT_THRESHOLD",
  "message": "gross_receipts 2850000 is within 300000 of VAT threshold",
  "userMessage": "Your gross receipts are within ₱300,000 of the ₱3,000,000 VAT registration threshold. If your total receipts for the year exceed ₱3,000,000, you will be required to register for VAT, and the 8% option will no longer be available to you. Monitor your receipts closely and register for VAT before the threshold is crossed.",
  "field": "grossReceipts",
  "severity": "ADVISORY"
}
```

### 2.6 IneligibilityNotification

Attached to `TaxComputationResult.ineligibilityNotes`. Explains why Path C was skipped.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IneligibilityNotification {
    pub code: String,         // "IN-01" through "IN-05"
    pub reason: String,       // short reason key, e.g. "VAT_REGISTERED"
    pub user_message: String, // user-facing explanation
    pub legal_basis: String,  // statute/regulation
}
```

**Wire example:**
```json
{
  "code": "IN-01",
  "reason": "VAT_REGISTERED",
  "userMessage": "The 8% flat rate is not available because you are VAT-registered. VAT-registered taxpayers must use Path A (Itemized Deductions) or Path B (OSD).",
  "legalBasis": "NIRC Sec. 24(A)(2)(b); RR 8-2018 Sec. 2(A)"
}
```

### 2.7 ManualReviewFlag

Attached to `TaxComputationResult.manualReviewFlags`.

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManualReviewFlag {
    pub code: String,                       // "MRF-009" etc.
    pub category: MrfCategory,              // "EXPENSE_CLASSIFICATION" etc.
    pub user_message: String,               // plain-language explanation
    pub affected_field: Option<String>,     // which input/output is affected
    pub conservative_assumption: String,    // what the engine assumed
    pub action_required: String,            // what taxpayer/CPA must do
}
```

**Wire example:**
```json
{
  "code": "MRF-009",
  "category": "EXPENSE_CLASSIFICATION",
  "userMessage": "Home office expense classification requires CPA review.",
  "affectedField": "itemizedExpenses.homeOfficeExpense",
  "conservativeAssumption": "Claimed the full amount declared; BIR may challenge if space percentage is not documented.",
  "actionRequired": "Measure and document the exclusive business-use area as a percentage of total home area. Keep floor plans and utility bills."
}
```

---

## 3. WasmResult Envelope (Complete Type)

The `WasmResult` internal tag discriminant `"status"` determines which variant is present.

```rust
#[derive(Serialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum WasmResult {
    Success(TaxComputationResult),   // "status": "success"
    Error(EngineError),              // "status": "error"
}
```

**Success wire shape:**
```json
{
  "status": "success",
  "inputSummary": { ... },
  "comparison": [ ... ],
  "recommendedRegime": "PATH_B",
  "balance": "12450.00",
  "validationWarnings": [ ... ],
  "ineligibilityNotes": [ ... ],
  "manualReviewFlags": [ ... ],
  ...
}
```

**Error wire shape (all errors share this shape):**
```json
{
  "status": "error",
  "code": "ERR_NEGATIVE_GROSS",
  "message": "gross_receipts is -5000",
  "userMessage": "Gross receipts cannot be negative. Enter the total business income received during the period (₱0 if no income was received).",
  "field": "grossReceipts",
  "validationCode": "VAL-002",
  "severity": "HARD_ERROR"
}
```

---

## 4. ValidationOnlyResult

Returned by `validate_json` (PL-01 + PL-04 only). Does NOT contain a full computation result.

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationOnlyResult {
    pub valid: bool,
    pub errors: Vec<EngineError>,
    pub eligibility_warnings: Vec<ValidationWarning>,
    pub path_c_eligible: bool,
    pub path_c_ineligible_reasons: Vec<String>,
}
```

**Wire example (invalid input):**
```json
{
  "valid": false,
  "errors": [
    {
      "code": "ERR_NEGATIVE_GROSS",
      "message": "gross_receipts is -5000",
      "userMessage": "Gross receipts cannot be negative...",
      "field": "grossReceipts",
      "validationCode": "VAL-002",
      "severity": "HARD_ERROR"
    }
  ],
  "eligibilityWarnings": [],
  "pathCEligible": false,
  "pathCIneligibleReasons": []
}
```

**Wire example (valid input, warnings present):**
```json
{
  "valid": true,
  "errors": [],
  "eligibilityWarnings": [
    {
      "code": "WARN_NEAR_VAT_THRESHOLD",
      "message": "...",
      "userMessage": "...",
      "field": "grossReceipts",
      "severity": "ADVISORY"
    }
  ],
  "pathCEligible": true,
  "pathCIneligibleReasons": []
}
```

---

## 5. TypeScript Interfaces

These MUST match the serde wire format exactly. Note: serde `rename_all = "camelCase"` means all field names are camelCase in JSON.

```typescript
// src/types/engine-errors.ts

export type ErrorSeverity = "HARD_ERROR" | "ASSERTION_ERROR";
export type WarningSeverity = "INFORMATIONAL" | "ADVISORY";
export type MrfCategory =
  | "EXPENSE_CLASSIFICATION"
  | "TIMING"
  | "REGISTRATION"
  | "FOREIGN"
  | "SUBSTANTIATION"
  | "ATC_CODE";

export interface EngineError {
  code: string;
  message: string;
  userMessage: string;
  field: string | null;
  validationCode: string | null;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  code: string;
  message: string;
  userMessage: string;
  field: string | null;
  severity: WarningSeverity;
}

export interface IneligibilityNotification {
  code: string;           // "IN-01" through "IN-05"
  reason: string;
  userMessage: string;
  legalBasis: string;
}

export interface ManualReviewFlag {
  code: string;                    // "MRF-NNN"
  category: MrfCategory;
  userMessage: string;
  affectedField: string | null;
  conservativeAssumption: string;
  actionRequired: string;
}

export interface ValidationOnlyResult {
  valid: boolean;
  errors: EngineError[];
  eligibilityWarnings: ValidationWarning[];
  pathCEligible: boolean;
  pathCIneligibleReasons: string[];
}

// Discriminated union for WasmResult
export type WasmResult = WasmSuccess | WasmError;

export interface WasmSuccess extends TaxComputationResult {
  status: "success";
}

export interface WasmError extends EngineError {
  status: "error";
}
```

---

## 6. Frontend Error Handling Contract

### 6.1 Classification Rules

The frontend MUST classify every `EngineError` into one of three handling buckets:

| Condition | Bucket | Action |
|-----------|--------|--------|
| `result.status === "error" && result.severity === "HARD_ERROR"` | USER_ERROR | Throw `ValidationError`, display to user, highlight field |
| `result.status === "error" && result.severity === "ASSERTION_ERROR"` | INTERNAL_BUG | Log to Sentry with full input context, throw `ComputeError("INTERNAL")`, show generic toast |
| WASM throws (JSON parse fail, serde fail) | PARSE_ERROR | Log to Sentry, throw `ComputeError("PARSE")`, show generic toast |

### 6.2 bridge.ts Error Handling (complete)

```typescript
// src/wasm/bridge.ts

export class ValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly field: string | null,
    public readonly validationCode: string | null
  ) {
    super(userMessage);
    this.name = "ValidationError";
  }
}

export class ComputeError extends Error {
  constructor(
    public readonly type: "INTERNAL" | "PARSE",
    message: string
  ) {
    super(message);
    this.name = "ComputeError";
  }
}

export async function computeTax(input: TaxpayerInput): Promise<TaxComputationResult> {
  await ensureWasmInitialized();
  let rawJson: string;
  try {
    rawJson = compute_json(JSON.stringify(input));
  } catch (e) {
    // WASM threw: JSON parse failure OR internal serde failure
    const message = e instanceof Error ? e.message : String(e);
    Sentry.captureException(new Error(`WASM compute_json threw: ${message}`), {
      extra: { inputKeys: Object.keys(input) },
    });
    throw new ComputeError("PARSE", "Failed to process computation input. Please try again.");
  }

  const result: WasmResult = JSON.parse(rawJson);

  if (result.status === "error") {
    if (result.severity === "ASSERTION_ERROR") {
      Sentry.captureException(new Error(`Engine assertion: ${result.code}`), {
        extra: { code: result.code, message: result.message },
      });
      throw new ComputeError(
        "INTERNAL",
        result.userMessage
      );
    } else {
      // HARD_ERROR: user input problem, user can fix it
      throw new ValidationError(
        result.code,
        result.userMessage,
        result.field,
        result.validationCode
      );
    }
  }

  return result as WasmSuccess;
}

export async function validateInput(
  input: Partial<TaxpayerInput>
): Promise<ValidationOnlyResult> {
  await ensureWasmInitialized();
  let rawJson: string;
  try {
    rawJson = validate_json(JSON.stringify(input));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    Sentry.captureException(new Error(`WASM validate_json threw: ${message}`));
    throw new ComputeError("PARSE", "Validation failed unexpectedly.");
  }
  return JSON.parse(rawJson) as ValidationOnlyResult;
}
```

### 6.3 useTaxBridge Hook Error Handling

```typescript
// src/hooks/useTaxBridge.ts

interface UseTaxBridgeState {
  result: TaxComputationResult | null;
  error: ValidationError | ComputeError | null;
  isComputing: boolean;
}

export function useTaxBridge(): UseTaxBridgeReturn {
  const [state, setState] = useState<UseTaxBridgeState>({
    result: null,
    error: null,
    isComputing: false,
  });

  const compute = useCallback(async (input: TaxpayerInput) => {
    setState((s) => ({ ...s, isComputing: true, error: null }));
    try {
      const result = await computeTax(input);
      setState({ result, error: null, isComputing: false });
    } catch (e) {
      if (e instanceof ValidationError || e instanceof ComputeError) {
        setState({ result: null, error: e, isComputing: false });
      } else {
        // Unknown error — should not happen
        Sentry.captureException(e);
        setState({
          result: null,
          error: new ComputeError("INTERNAL", "An unexpected error occurred."),
          isComputing: false,
        });
      }
    }
  }, []);

  // ...validate, clear, return
}
```

### 6.4 UI Rendering of Each Category

**ValidationError (HARD_ERROR):**
- Show a red Alert component at the top of the wizard step containing `error.userMessage`
- If `error.field` is non-null, highlight the corresponding form field with a red border
- Block the "Compute" button until the error is resolved
- On wizard step change: re-run `validateInput()` to check if the error is resolved

**ComputeError (INTERNAL / PARSE):**
- Show a Sonner toast with variant `error`:
  - Title: "Computation Error"
  - Message: The `error.message` from `ComputeError` (which is already the user-friendly `userMessage` from the engine for ASSERTION errors)
- Do NOT show a field highlight (no field is at fault)
- Log to Sentry (already done in bridge.ts)

**ValidationWarning (WARN_*):**
- Show amber Alert components below the results section
- `ADVISORY` severity: amber/orange Alert with TriangleAlert icon
- `INFORMATIONAL` severity: blue Alert with Info icon
- Display `warning.userMessage` verbatim

**IneligibilityNotification (IN-*):**
- Show as a gray/muted info note within the regime comparison table
- Displayed in Path C's column: "Not available — [reason]"
- Full `userMessage` in a tooltip on hover

**ManualReviewFlag (MRF-*):**
- Show yellow Alert components in a dedicated "Items for CPA Review" section in results
- Each flag shows: `flag.userMessage` + collapsible detail with `flag.conservativeAssumption` and `flag.actionRequired`
- Count of flags shown as a Badge in the results tab header

---

## 7. Complete Error Code Registry

### 7.1 Hard Validation Errors (ERR_* / HARD_ERROR)

All produced at PL-01. All have `severity: "HARD_ERROR"`.

| Code | VAL code | Field (camelCase) | Condition |
|------|----------|-------------------|-----------|
| `ERR_INVALID_TAX_YEAR` | VAL-001 | `taxYear` | `taxYear < 2018 OR taxYear > 2030` |
| `ERR_NEGATIVE_GROSS` | VAL-002 | `grossReceipts` | `grossReceipts < 0` |
| `ERR_RETURNS_EXCEED_GROSS` | VAL-003 | `salesReturnsAllowances` | `salesReturnsAllowances > grossReceipts` |
| `ERR_NEGATIVE_RETURNS` | VAL-003 | `salesReturnsAllowances` | `salesReturnsAllowances < 0` |
| `ERR_NEGATIVE_COGS` | VAL-004 | `costOfGoodsSold` | `costOfGoodsSold < 0` |
| `ERR_NEGATIVE_COMPENSATION` | VAL-005 | `taxableCompensation` | `taxableCompensation < 0` |
| `ERR_NEGATIVE_EXCESS_CWT` | VAL-006 | `priorYearExcessCwt` | `priorYearExcessCwt < 0` |
| `ERR_COMP_ONLY_WITH_GROSS` | VAL-007 | `grossReceipts` | `taxpayerType == COMPENSATION_ONLY AND grossReceipts > 0` |
| `ERR_SE_WITH_COMPENSATION` | VAL-008 | `taxableCompensation` | `taxpayerType == PURELY_SE AND taxableCompensation > 0` |
| `ERR_INCONSISTENT_MIXED_FLAG` | VAL-009 | `isMixedIncome` | `isMixedIncome == true AND taxpayerType != MIXED_INCOME` |
| `ERR_NEGATIVE_2307_PAYMENT` | VAL-010 | `cwt2307Entries[i].incomePayment` | Any entry `incomePayment < 0` |
| `ERR_NEGATIVE_2307_WITHHELD` | VAL-011 | `cwt2307Entries[i].taxWithheld` | Any entry `taxWithheld < 0` |
| `ERR_2307_WITHHELD_EXCEEDS_PAYMENT` | VAL-012 | `cwt2307Entries[i].taxWithheld` | `taxWithheld > incomePayment` |
| `ERR_NEGATIVE_QUARTERLY_PAYMENT` | VAL-013 | `priorQuarterlyPayments[i].amountPaid` | Any entry `amountPaid < 0` |
| `ERR_NEGATIVE_NON_OP_INCOME` | VAL-014 | `nonOperatingIncome` | `nonOperatingIncome < 0` |
| `ERR_NEGATIVE_FWT_INCOME` | VAL-015 | `fwtIncome` | `fwtIncome < 0` |
| `ERR_FUTURE_FILING_PERIOD` | VAL-016 | `filingPeriod` | Period end date > today AND no `allowCurrentPeriod` flag |
| `ERR_TOO_MANY_QUARTERLY_PAYMENTS` | VAL-017 | `priorQuarterlyPayments` | `filingPeriod == ANNUAL AND count > 3` |
| `ERR_NEGATIVE_PRIOR_PAYMENT` | VAL-018 | `priorPaymentForReturn` | `priorPaymentForReturn < 0` |
| `ERR_NEGATIVE_EXPENSE_ITEM` | VAL-019 | `itemizedExpenses.{subField}` | Any itemized expense sub-field < 0 |
| `ERR_NEGATIVE_COMP_CWT` | VAL-020 | `compensationCwt` | `compensationCwt < 0` |
| `ERR_DUPLICATE_QUARTERLY_PERIOD` | VAL-021 | `priorQuarterlyPayments` | Two entries with same `quarter` value |
| `ERR_QUARTERLY_PAYMENT_WRONG_PERIOD` | VAL-022 | `priorQuarterlyPayments[i].quarter` | `quarter` not in {1, 2, 3} |
| `ERR_MIXED_INCOME_NO_COMPENSATION` | VAL-023 | `taxableCompensation` | `taxpayerType == MIXED_INCOME AND taxableCompensation == 0` |
| `ERR_MIXED_INCOME_NO_BUSINESS` | VAL-024 | `grossReceipts` | `taxpayerType == MIXED_INCOME AND grossReceipts == 0 AND nonOperatingIncome == 0` |
| `ERR_2307_PERIOD_INVALID` | VAL-025 | `cwt2307Entries[i].periodTo` | `periodTo < periodFrom` |
| `ERR_DEPRECIATION_INVALID` | VAL-026 | `itemizedExpenses.depreciationEntries[i]` | Invalid cost/useful_life/salvage/year |
| `ERR_NOLCO_ENTRY_INVALID` | VAL-027 | `itemizedExpenses.nolcoEntries[i]` | Invalid loss_year/loss_amount/amount_applied |
| `ERR_COMPENSATION_ONLY_NO_OPTIMIZER` | VAL-028 | `taxpayerType` | `taxpayerType == COMPENSATION_ONLY` |

**Note on field names:** The `field` property in the JSON uses camelCase matching TypeScript interface field names, NOT Rust snake_case. This is enforced by the `rename_all = "camelCase"` on `EngineError`.

### 7.2 Ineligibility Errors (ERR_ELECTED_INELIGIBLE_* / HARD_ERROR)

Produced at PL-04 when user explicitly elected an ineligible regime.

| Code | Field | Condition |
|------|-------|-----------|
| `ERR_ELECTED_INELIGIBLE_PATH_C_VAT` | `electedRegime` | `electedRegime == ELECT_EIGHT_PCT AND isVatRegistered == true` |
| `ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD` | `electedRegime` | `electedRegime == ELECT_EIGHT_PCT AND thresholdBase > 3000000` |
| `ERR_ELECTED_INELIGIBLE_PATH_C_GPP` | `electedRegime` | `electedRegime == ELECT_EIGHT_PCT AND isGppPartner == true` |
| `ERR_ELECTED_INELIGIBLE_PATH_C_SEC117` | `electedRegime` | `electedRegime == ELECT_EIGHT_PCT AND subjectToSec117128 == true` |
| `ERR_ELECTED_INELIGIBLE_PATH_C_BMBE` | `electedRegime` | `electedRegime == ELECT_EIGHT_PCT AND isBmbeRegistered == true` |

### 7.3 Engine Assertion Errors (ERR_ASSERT_* / ASSERTION_ERROR)

Software bugs that should never occur. All have `field: null`, `validationCode: null`.

| Code | Invariant | Condition |
|------|-----------|-----------|
| `ERR_ASSERT_NEGATIVE_IT_DUE` | INV-PA-01, INV-PB-01, INV-PC-05 | Any `PathResult.incomeTaxDue < 0` |
| `ERR_ASSERT_NO_ELIGIBLE_PATHS` | INV-EL-11 | All three paths ineligible for SE/mixed taxpayer |
| `ERR_ASSERT_RECOMMENDATION_INVALID` | INV-RC-05 | `recommendedPath` is not minimum-burden path |
| `ERR_ASSERT_SAVINGS_NEGATIVE` | INV-RC-08 | `savingsVsWorst < 0` |
| `ERR_ASSERT_OSD_RATIO_INVALID` | INV-PB-03 | OSD != base × 0.60 by more than ₱0.01 |
| `ERR_ASSERT_BALANCE_ARITHMETIC` | INV-BAL-01 | `abs(balance - (itDue - totalItCredits)) > 0.01` |
| `ERR_ASSERT_INSTALLMENT_ARITHMETIC` | INV-BAL-08 | `abs((installmentFirst + installmentSecond) - balance) > 0.01` |
| `ERR_ASSERT_PT_AND_VAT_BOTH_APPLIED` | INV-PT-03 | PT and VAT both flagged as applicable |

### 7.4 Soft Warnings (WARN_*)

| Code | Severity | Trigger condition |
|------|----------|-------------------|
| `WARN_NEAR_VAT_THRESHOLD` | ADVISORY | `grossReceipts` in (2_700_000, 3_000_000] and not VAT-registered |
| `WARN_EXCEEDS_VAT_THRESHOLD_UNREGISTERED` | ADVISORY | `grossReceipts > 3_000_000 AND isVatRegistered == false` |
| `WARN_NO_2307_ENTRIES` | ADVISORY | No 2307 entries, `grossReceipts > 0`, not 8% elected |
| `WARN_VERY_LOW_EXPENSES` | ADVISORY | Itemized total < 5% of `grossReceipts` for PURELY_SE |
| `WARN_NON_OP_INCOME_POSSIBLY_FWT` | ADVISORY | `nonOperatingIncome > 0 AND fwtIncome == 0` |
| `WARN_8PCT_ELECTION_TIMING` | ADVISORY | `electedRegime == ELECT_EIGHT_PCT AND filingPeriod NOT IN (Q1, ANNUAL)` |
| `WARN_BMBE_EXEMPT_ALL_PATHS_ZERO` | INFORMATIONAL | `isBmbeRegistered == true` |
| `WARN_GPP_PARTNER_MANUAL_REVIEW` | ADVISORY | `isGppPartner == true` |
| `WARN_CWT_EXCEEDS_IT_DUE` | ADVISORY | `totalCwtCredits > incomeTaxDue` (overpayment situation) |

### 7.5 Ineligibility Notifications (IN-*)

| Code | Reason | Trigger |
|------|--------|---------|
| `IN-01` | `VAT_REGISTERED` | `isVatRegistered == true` |
| `IN-02` | `EXCEEDS_THRESHOLD` | `thresholdBase > 3_000_000` |
| `IN-03` | `GPP_PARTNER` | `isGppPartner == true` |
| `IN-04` | `SUBJECT_SEC117_128` | `subjectToSec117128 == true` |
| `IN-05` | `BMBE_EXEMPT` | `isBmbeRegistered == true` |

---

## 8. Zod Schemas for Error Types

```typescript
// src/schemas/engine-errors.ts

import { z } from "zod";

export const ErrorSeveritySchema = z.enum(["HARD_ERROR", "ASSERTION_ERROR"]);
export const WarningSeveritySchema = z.enum(["INFORMATIONAL", "ADVISORY"]);
export const MrfCategorySchema = z.enum([
  "EXPENSE_CLASSIFICATION",
  "TIMING",
  "REGISTRATION",
  "FOREIGN",
  "SUBSTANTIATION",
  "ATC_CODE",
]);

export const EngineErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  userMessage: z.string(),
  field: z.string().nullable(),
  validationCode: z.string().nullable(),
  severity: ErrorSeveritySchema,
});

export const ValidationWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  userMessage: z.string(),
  field: z.string().nullable(),
  severity: WarningSeveritySchema,
});

export const IneligibilityNotificationSchema = z.object({
  code: z.string(),
  reason: z.string(),
  userMessage: z.string(),
  legalBasis: z.string(),
});

export const ManualReviewFlagSchema = z.object({
  code: z.string(),
  category: MrfCategorySchema,
  userMessage: z.string(),
  affectedField: z.string().nullable(),
  conservativeAssumption: z.string(),
  actionRequired: z.string(),
});

export const ValidationOnlyResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(EngineErrorSchema),
  eligibilityWarnings: z.array(ValidationWarningSchema),
  pathCEligible: z.boolean(),
  pathCIneligibleReasons: z.array(z.string()),
});
```

**Note:** `WasmResult` is NOT validated through Zod at runtime (too expensive for every computation). Instead, it is typed with TypeScript interfaces. Zod parsing is reserved for:
1. `ValidationOnlyResult` from `validate_json` (wizard step validation, called frequently)
2. Database-retrieved input/output JSON when loading saved computations (untrusted data source)

---

## 9. Error Codes That Include Dynamic Values in userMessage

Some user-facing messages contain interpolated values from the input. In Rust, these are formatted with `format!()`. The TypeScript interface receives the already-interpolated string.

| Code | Dynamic values in message |
|------|--------------------------|
| `ERR_RETURNS_EXCEED_GROSS` | `{salesReturnsAllowances}`, `{grossReceipts}` (formatted as peso amounts) |
| `ERR_COMP_ONLY_WITH_GROSS` | `{grossReceipts}` |
| `ERR_SE_WITH_COMPENSATION` | `{taxableCompensation}` |
| `ERR_NEGATIVE_2307_PAYMENT` | `{payorName}` from the entry |
| `ERR_NEGATIVE_2307_WITHHELD` | `{payorName}` from the entry |
| `ERR_2307_WITHHELD_EXCEEDS_PAYMENT` | `{payorName}`, `{taxWithheld}`, `{incomePayment}` |
| `ERR_NEGATIVE_QUARTERLY_PAYMENT` | `{quarter}` (1, 2, or 3) |
| `ERR_TOO_MANY_QUARTERLY_PAYMENTS` | `{count}` |
| `ERR_NEGATIVE_EXPENSE_ITEM` | `{expenseLabel}` (human-readable label for the sub-field) |
| `ERR_DEPRECIATION_INVALID` | `{assetDescription}`, specific violation description |
| `ERR_NOLCO_ENTRY_INVALID` | `{lossYear}`, `{minYear}`, `{maxYear}`, specific violation |
| `ERR_FUTURE_FILING_PERIOD` | `{periodLabel}` (e.g., "Q1"), `{taxYear}` |
| `ERR_ELECTED_INELIGIBLE_PATH_C_THRESHOLD` | `{thresholdBase}` formatted as peso |

The frontend does NOT need to re-interpolate these. The engine returns the fully formatted string.

---

## 10. Field Name Mapping: Rust snake_case → JSON camelCase

The serde `rename_all = "camelCase"` on `EngineError` affects the `field` property. The `field` value in the JSON error will always be in camelCase matching the TypeScript interface field names.

| Rust field (input struct) | JSON `field` value in EngineError |
|--------------------------|-----------------------------------|
| `tax_year` | `"taxYear"` |
| `gross_receipts` | `"grossReceipts"` |
| `sales_returns_allowances` | `"salesReturnsAllowances"` |
| `cost_of_goods_sold` | `"costOfGoodsSold"` |
| `taxable_compensation` | `"taxableCompensation"` |
| `prior_year_excess_cwt` | `"priorYearExcessCwt"` |
| `cwt_2307_entries[i].income_payment` | `"cwt2307Entries[i].incomePayment"` (index notation) |
| `cwt_2307_entries[i].tax_withheld` | `"cwt2307Entries[i].taxWithheld"` |
| `prior_quarterly_payments[i].amount_paid` | `"priorQuarterlyPayments[i].amountPaid"` |
| `non_operating_income` | `"nonOperatingIncome"` |
| `fwt_income` | `"fwtIncome"` |
| `filing_period` | `"filingPeriod"` |
| `prior_payment_for_return` | `"priorPaymentForReturn"` |
| `itemized_expenses.{sub}` | `"itemizedExpenses.{subCamel}"` |
| `compensation_cwt` | `"compensationCwt"` |
| `is_mixed_income` | `"isMixedIncome"` |
| `elected_regime` | `"electedRegime"` |

**Implementation note:** The `field` value for array-indexed fields (e.g., `cwt2307Entries[i].taxWithheld`) is a dot-notation path string. The frontend form must parse this path to identify and highlight the correct array entry. A utility `parseFieldPath(field: string)` function should handle `"cwt2307Entries[2].taxWithheld"` → `{ array: "cwt2307Entries", index: 2, subField: "taxWithheld" }`.

---

## 11. Action Items for Subsequent Waves

| Wave | Aspect | Item |
|------|--------|------|
| Wave 3 | typescript-types | Add `EngineError`, `ValidationWarning`, `IneligibilityNotification`, `ManualReviewFlag`, `ValidationOnlyResult` to `types/engine-errors.ts` |
| Wave 3 | zod-schemas | Add Zod schemas from Section 8; use `ValidationOnlyResultSchema` in wizard step validation |
| Wave 3 | frontend-state-management | `useTaxBridge` hook must handle `ValidationError` (field highlighting) vs `ComputeError` (toast) separately |
| Wave 5 | visual-verification-checklist | Results view needs: WARN_* → amber Alert, INFO_* → blue Alert, MRF_* → yellow Alert, each with correct icon |
| Wave 5 | component-wiring-map | `ManualReviewFlagsSection` component: parent is ResultsView, triggered when `manualReviewFlags.length > 0` |
| Wave 6 | migration-verification | No DB implications for errors — all error handling is client-side |
