# Error Contract — Validation Errors, Computation Errors, Panic Recovery

**Aspect**: error-contract
**Wave**: 4 (Bridge Contract)
**Depends On**: wasm-export, serde-wire-format, rust-types

---

## Overview

The error contract defines every possible failure mode of `compute_json`, the exact JSON
shape for each, when each is produced, and how the frontend should display or recover from
each. This document is authoritative for the TypeScript `ComputationError` union, Zod
validation schema, and React UI error presentation.

---

## §1. Error Taxonomy

There are **5 error variants**, organized into 3 categories:

| Category | Variant | When Produced |
|----------|---------|---------------|
| **Input errors** | `InputValidation` | JSON parse failure (serde) |
| **Input errors** | `DomainValidation` | Logic check before pipeline starts |
| **Pipeline errors** | `MaxRestartsExceeded` | Pipeline restart guard triggered |
| **Internal errors** | `ArithmeticError` | Output serialization failure (should never occur) |
| **Internal errors** | `PanicRecovered` | Unexpected panic caught by `catch_unwind` |

The frontend MUST handle all 5. Input errors are actionable (user can fix). Pipeline and
internal errors require a "Contact support" fallback.

---

## §2. Rust Enum Definition

From `rust-types.md §12`:

```rust
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "PascalCase")]
#[serde(tag = "error_type")]
pub enum ComputationError {
    InputValidation {
        message: String,
        field_path: Option<String>,
    },
    DomainValidation {
        message: String,
        related_heir_ids: Vec<HeirId>,  // Vec<String> — may be empty
    },
    MaxRestartsExceeded {
        restart_count: u32,
        last_step: String,
    },
    ArithmeticError {
        message: String,
    },
    PanicRecovered {
        message: String,
    },
}
```

---

## §3. Variant Specifications

### §3.1 InputValidation

**Produced by**: `serde_json::from_str::<ComputationInput>(input)` failure in `inner_compute`.

**When it occurs**:
- Unknown field in JSON (denied by `#[serde(deny_unknown_fields)]`)
- Wrong JSON type (e.g., string where boolean expected)
- Missing required field (no `#[serde(default)]`)
- Malformed JSON syntax (unclosed bracket, trailing comma, etc.)
- Invalid enum variant string (e.g., `"legitimateChild"` instead of `"LegitimateChild"`)
- Money centavos string that cannot be parsed as i64

**JSON shape**:
```json
{
  "error_type": "InputValidation",
  "message": "unknown field `foo`, expected one of `decedent`, `estate`, `heirs`, `will`, `donations`",
  "field_path": "foo"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `error_type` | `"InputValidation"` | Discriminant tag |
| `message` | string | Raw serde_json error message |
| `field_path` | string \| null | Best-effort field name extraction; null if not extractable |

**`field_path` extraction rules** (from `wasm-export.md §1`):
- If message contains `unknown field \`foo\``: extracts `"foo"`
- Wrong type messages (e.g., `"invalid type: string, expected bool at line 1 column 42"`): `field_path` = null
- Missing field messages: `field_path` = null
- The frontend must display `message` when `field_path` is null

**Frontend display**: Map `field_path` to a form field highlight. If `field_path` is known
(matches a wizard field name), scroll to that field and show an inline error. If unknown,
show a top-level toast: "Invalid input: {message}".

**Example messages by cause**:

| Cause | Example `message` |
|-------|-------------------|
| Unknown field | `"unknown field \`foo\`, expected one of \`decedent\`, \`estate\`, \`heirs\`, \`will\`, \`donations\`"` |
| Wrong bool type | `"invalid type: string \"true\", expected a boolean at line 3 column 20"` |
| Missing required field | `"missing field \`estate\` at line 1 column 2"` |
| Invalid enum | `"unknown variant \`legitimateChild\`, expected one of \`LegitimateChild\`, \`LegitimatedChild\`, ..."` |
| Bad JSON syntax | `"expected value at line 1 column 1"` |
| Centavos string parse | `"invalid value: string \"abc\", expected integer or integer string"` |

---

### §3.2 DomainValidation

**Produced by**: Step 1 (`step1_validate_input`) domain logic checks, BEFORE the pipeline
begins distributing shares. These are semantic errors that serde cannot catch.

**When it occurs**:

| Check | Example trigger |
|-------|----------------|
| Duplicate heir IDs | Two `HeirInput` with same `id` |
| Self-referential children | `HeirInput.children` contains an ID that equals parent's ID |
| Dangling heir reference | `InstitutionInput.heir_id` references unknown `HeirInput.id` |
| Dangling disinheritance reference | `DisinheritanceRecord.heir_id` not in heirs list |
| Empty heir required | `heirs: []` when `has_will: false` (no intestate heirs) |
| Multiple Spouse heirs | More than one `HeirType::Spouse` in heirs list |
| Net estate negative | `estate.net_estate.centavos < 0` |
| Donation references unknown heir | `DonationInput.recipient_heir_id` not in heirs list |
| Both fraction and amount_centavos null | `InstitutionInput.fraction == null && amount_centavos == null` |
| Date parse failure | `date_of_death` string not parseable as `YYYY-MM-DD` |

**JSON shape**:
```json
{
  "error_type": "DomainValidation",
  "message": "Heir ID 'heir_001' appears more than once in the heirs array",
  "related_heir_ids": ["heir_001"]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `error_type` | `"DomainValidation"` | Discriminant tag |
| `message` | string | Human-readable description |
| `related_heir_ids` | string[] | IDs of involved heirs; `[]` if not heir-specific |

**`related_heir_ids` population rules**:
- Duplicate heir: contains the duplicate ID
- Self-referential child: contains the heir ID
- Dangling reference: contains the referenced (missing) ID
- Net estate negative: `[]`
- Multiple spouses: contains all spouse heir IDs

**Frontend display**: If `related_heir_ids` is non-empty, highlight those heirs in the
Family Tree wizard step with an error indicator. Always show the `message` in a top-level
error banner at the top of the current wizard step.

**Step 1 validation order** (process all checks, collect all errors, return as a single
`DomainValidation` with concatenated messages if multiple errors found):

```
Note: The engine returns the FIRST domain validation error found, not all at once.
A multi-error approach (accumulating all errors) would require a Vec<DomainValidation>
return type which complicates the bridge. The frontend must re-call compute_json after
fixing each error to discover subsequent errors. This is acceptable given typical form
submission patterns.
```

**Concrete step1 checks in dependency order**:
1. Heir ID uniqueness (O(n log n) sort check)
2. Children ID uniqueness within each heir's subtree (recursive)
3. All `heir_id` references in `disinheritances`, `institutions`, `devises`, `legacies`,
   `substitutions`, `donations` resolve to a known `HeirInput.id`
4. Net estate ≥ 0
5. Gross estate ≥ net estate (if gross_estate present)
6. At most one `HeirType::Spouse` heir
7. Date strings parseable as `YYYY-MM-DD` (check `date_of_death`, `date_of_birth`,
   `date_of_death` for all heirs, `adoption_date`, `adoption_rescission_date`,
   `will.date_executed`, all `donation.date` fields)
8. `InstitutionInput` has at least one of `fraction` or `amount_centavos` non-null
9. `DeviseInput.value.centavos ≥ 0`

---

### §3.3 MaxRestartsExceeded

**Produced by**: Pipeline restart guard in `pipeline/mod.rs` when `restart_count > MAX_RESTARTS`.

`MAX_RESTARTS = 10` (from `pipeline-design.md`).

**When it occurs**:
In theory, should never occur for valid inputs. Can occur if:
- A bug creates a restart cycle (e.g., preterition detection and re-validation loop)
- Extremely pathological input with many nested vacancy chains
- All-excluded scenarios that cycle through multiple fallback levels

**JSON shape**:
```json
{
  "error_type": "MaxRestartsExceeded",
  "restart_count": 10,
  "last_step": "step7_validate_testate"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `error_type` | `"MaxRestartsExceeded"` | Discriminant tag |
| `restart_count` | number (u32) | Always = MAX_RESTARTS = 10 |
| `last_step` | string | Name of the step that triggered the last restart |

**`last_step` possible values**:
- `"step7_validate_testate"` — restarted from testate validation (preterition/disinheritance)
- `"step10_resolve_vacancies"` — restarted from vacancy resolution (Art. 1021 ¶2)

**Frontend display**: Show a non-actionable error banner:
> "This estate computation requires manual review. The distribution involves a complex
> interaction of rules that the engine could not resolve automatically. Please consult an
> estate planning attorney. (Technical: MaxRestartsExceeded after 10 iterations at
> {last_step})"

Include a "Copy error details" button that copies the JSON error to clipboard for support.

---

### §3.4 ArithmeticError

**Produced by**: `serde_json::to_string(&output)` failure in `inner_compute`, after the
pipeline has successfully completed.

**When it occurs**: Should never occur in practice. `ComputationOutput` contains only
serializable primitives (String, i64, Vec, Option, bool). If it does occur, it indicates
a bug in the output type definition (e.g., a non-serializable type slipped in).

**JSON shape**:
```json
{
  "error_type": "ArithmeticError",
  "message": "Output serialization failed: the trait `Serialize` is not implemented for..."
}
```

| Field | Type | Notes |
|-------|------|-------|
| `error_type` | `"ArithmeticError"` | Discriminant tag |
| `message` | string | Raw serialization error message |

**Note**: The name `ArithmeticError` is somewhat misleading — it was named for the case
where BigRational arithmetic produces an unrepresentable result. In v2, BigRational internal
arithmetic always succeeds (no division by zero in the pipeline); the only remaining trigger
is output serialization failure.

**Frontend display**: Same as `MaxRestartsExceeded` — non-actionable error with support
contact and copy-to-clipboard.

---

### §3.5 PanicRecovered

**Produced by**: `std::panic::catch_unwind` in the WASM `compute_json` outer wrapper,
catching a panic that escaped the pipeline.

**When it occurs**:
- Debug assertion (`debug_assert!`) triggered in test mode
- Array index out of bounds
- Unwrap on None where logic guaranteed Some
- Stack overflow (deeply recursive representation chain > ~10,000 levels)
- Integer overflow (not possible in Rust by default in release mode)

**JSON shape**:
```json
{
  "error_type": "PanicRecovered",
  "message": "attempt to subtract with overflow"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `error_type` | `"PanicRecovered"` | Discriminant tag |
| `message` | string | Panic message; "Unknown panic" if payload is not `&str`/`String` |

**Fallback serialization**: If `serde_json::to_string(&ComputationError::PanicRecovered{...})`
itself fails (impossible but defended against):
```rust
r#"{"error_type":"PanicRecovered","message":"Unknown panic"}"#
```

**Frontend display**: Same as `MaxRestartsExceeded` — non-actionable error.

---

## §4. Fallback Error JSON Strings

Two hardcoded fallback strings are used in `wasm.rs` when serde itself fails to serialize
a `ComputationError`. These are raw `&'static str` constants:

```rust
const FALLBACK_ARITHMETIC_ERROR: &str =
    r#"{"error_type":"ArithmeticError","message":"Failed to serialize error"}"#;

const FALLBACK_PANIC_ERROR: &str =
    r#"{"error_type":"PanicRecovered","message":"Unknown panic"}"#;
```

These are used in the two `.unwrap_or_else(|_| ...)` calls in `compute_json`:

```rust
// ArithmeticError fallback:
let err_json = serde_json::to_string(&err)
    .unwrap_or_else(|_| FALLBACK_ARITHMETIC_ERROR.to_string());

// PanicRecovered fallback:
let err_json = serde_json::to_string(&err)
    .unwrap_or_else(|_| FALLBACK_PANIC_ERROR.to_string());
```

These fallback strings MUST remain valid JSON parseable as `ComputationError` on the
frontend. TypeScript tests must assert that `JSON.parse(FALLBACK_ARITHMETIC_ERROR)` and
`JSON.parse(FALLBACK_PANIC_ERROR)` produce valid `ComputationError` objects.

---

## §5. TypeScript Error Type

The TypeScript union type corresponding to `ComputationError`:

```typescript
// From §14 of spec — matches serde `#[serde(tag = "error_type")]` exactly.

export type ComputationError =
  | {
      error_type: "InputValidation";
      message: string;
      field_path: string | null;
    }
  | {
      error_type: "DomainValidation";
      message: string;
      related_heir_ids: string[];
    }
  | {
      error_type: "MaxRestartsExceeded";
      restart_count: number;
      last_step: string;
    }
  | {
      error_type: "ArithmeticError";
      message: string;
    }
  | {
      error_type: "PanicRecovered";
      message: string;
    };
```

**Key TypeScript contract rules**:
- `field_path` is `string | null` (NOT `string | undefined`) — matches serde null-not-absent
- `related_heir_ids` is `string[]` (NOT `string[] | null`) — always present, may be empty
- `restart_count` is `number` (NOT `bigint`) — u32 fits in JS number safely
- `error_type` discriminant must be checked before accessing variant-specific fields

---

## §6. Zod Schema for ComputationError

```typescript
import { z } from "zod";

const InputValidationErrorSchema = z.object({
  error_type: z.literal("InputValidation"),
  message: z.string(),
  field_path: z.string().nullable(),
}).strict();

const DomainValidationErrorSchema = z.object({
  error_type: z.literal("DomainValidation"),
  message: z.string(),
  related_heir_ids: z.array(z.string()),
}).strict();

const MaxRestartsExceededErrorSchema = z.object({
  error_type: z.literal("MaxRestartsExceeded"),
  restart_count: z.number().int().nonnegative(),
  last_step: z.string(),
}).strict();

const ArithmeticErrorSchema = z.object({
  error_type: z.literal("ArithmeticError"),
  message: z.string(),
}).strict();

const PanicRecoveredErrorSchema = z.object({
  error_type: z.literal("PanicRecovered"),
  message: z.string(),
}).strict();

export const ComputationErrorSchema = z.discriminatedUnion("error_type", [
  InputValidationErrorSchema,
  DomainValidationErrorSchema,
  MaxRestartsExceededErrorSchema,
  ArithmeticErrorSchema,
  PanicRecoveredErrorSchema,
]);

export type ComputationError = z.infer<typeof ComputationErrorSchema>;
```

**Notes**:
- `z.discriminatedUnion("error_type", [...])` is the correct Zod v3 API for tagged unions
- Each member schema uses `.strict()` to reject unknown fields
- `related_heir_ids` uses `z.array(z.string())` not `.nullable()` — empty array, not null
- `field_path` uses `.nullable()` not `.optional()` — present as null, never absent
- `restart_count` uses `z.number().int().nonnegative()` — u32 range

---

## §7. Frontend Bridge Usage Pattern

### §7.1 WASM Bridge Call Site

```typescript
import { compute_json } from "../wasm/pkg/inheritance_engine";

export function runComputation(input: ComputationInput): ComputationOutput {
  let resultStr: string;
  try {
    resultStr = compute_json(JSON.stringify(input));
  } catch (e: unknown) {
    // `e` is thrown by wasm-bindgen as the JsValue from Err(JsValue).
    // The JsValue is always a JSON string representing ComputationError.
    const errorStr = typeof e === "string" ? e : String(e);
    const parsed = ComputationErrorSchema.parse(JSON.parse(errorStr));
    throw new ComputationEngineError(parsed);
  }
  return ComputationOutputSchema.parse(JSON.parse(resultStr));
}
```

### §7.2 Custom Error Class

```typescript
export class ComputationEngineError extends Error {
  public readonly engineError: ComputationError;

  constructor(error: ComputationError) {
    super(error.message ?? `Engine error: ${error.error_type}`);
    this.name = "ComputationEngineError";
    this.engineError = error;
  }
}
```

**Why a custom class?** The `ComputationEngineError` wrapper:
1. Retains a JS `Error` stack trace for debugging
2. Carries the typed `ComputationError` object for display logic
3. Allows `catch (e)` blocks to distinguish engine errors from JS/WASM loading errors

### §7.3 React Error Boundary Usage

```typescript
// In the results-view component:
try {
  const output = runComputation(wizardState);
  setResult({ status: "success", output });
} catch (e) {
  if (e instanceof ComputationEngineError) {
    setResult({ status: "error", error: e.engineError });
  } else {
    // WASM loading failure, network error, etc. — not a ComputationError
    setResult({ status: "fatal", message: String(e) });
  }
}
```

---

## §8. Error Display Logic (React UI)

### §8.1 InputValidation Display

| Condition | UI Action |
|-----------|-----------|
| `field_path` is non-null and matches a known wizard field | Scroll to wizard step containing that field; show inline red error beneath that field |
| `field_path` is non-null but not a known field | Show error banner: "Invalid input field '{field_path}': {message}" |
| `field_path` is null | Show error banner: "Invalid input: {message}" |

**Known wizard field → step mapping** (for step navigation on error):
```typescript
const FIELD_TO_STEP: Record<string, WizardStep> = {
  "decedent": "estate",
  "estate": "estate",
  "heirs": "family_tree",
  "will": "will",
  "donations": "donations",
  // ... heir sub-fields resolved to family_tree step
};
```

### §8.2 DomainValidation Display

1. If `related_heir_ids.length > 0`:
   - Navigate to Family Tree wizard step
   - Highlight each heir card with `related_heir_ids[i]` in red
   - Show inline message on first highlighted heir card
2. Show error banner at top of current step: "{message}"

### §8.3 MaxRestartsExceeded / ArithmeticError / PanicRecovered Display

Show a modal dialog with:
- Title: "Computation Error"
- Body: "This estate could not be automatically computed due to a complex rule interaction.
  Please consult a Philippine estate planning attorney."
- Error details (collapsed by default, expandable):
  - `error_type`
  - `message` (if present)
  - `restart_count` / `last_step` (if MaxRestartsExceeded)
- Two buttons: "Close" and "Copy Error Details"

"Copy Error Details" copies:
```
Philippine Inheritance Engine v2
Error: {error_type}
{message or "No message"}
restart_count: {N} (if applicable)
last_step: {step} (if applicable)
Computation input: {JSON.stringify(input, null, 2)}
```

---

## §9. Error Handling in Tests (vitest)

### §9.1 Expected Error Assertions

```typescript
import { describe, it, expect } from "vitest";
import { runComputation } from "../bridge";
import { ComputationEngineError } from "../errors";

describe("error contract", () => {
  it("returns InputValidation for unknown field", () => {
    expect(() =>
      runComputation({ ...validInput, unknownField: "foo" } as any)
    ).toThrow(ComputationEngineError);

    try {
      runComputation({ ...validInput, unknownField: "foo" } as any);
    } catch (e) {
      expect(e).toBeInstanceOf(ComputationEngineError);
      const err = (e as ComputationEngineError).engineError;
      expect(err.error_type).toBe("InputValidation");
      expect(err.field_path).toBe("unknownField");
    }
  });

  it("returns InputValidation for boolean-as-string", () => {
    const badInput = { ...validInput };
    (badInput.decedent as any).has_will = "true";
    expect(() => runComputation(badInput)).toThrow(ComputationEngineError);
    try {
      runComputation(badInput);
    } catch (e) {
      const err = (e as ComputationEngineError).engineError;
      expect(err.error_type).toBe("InputValidation");
      // field_path may be null for type mismatch errors
    }
  });

  it("returns DomainValidation for duplicate heir ID", () => {
    const input = { ...validInput, heirs: [heir1, { ...heir1, name: "Duplicate" }] };
    try {
      runComputation(input);
    } catch (e) {
      const err = (e as ComputationEngineError).engineError;
      expect(err.error_type).toBe("DomainValidation");
      expect(err.related_heir_ids).toContain(heir1.id);
    }
  });

  it("fallback error strings are valid ComputationError JSON", () => {
    const fallback1 = JSON.parse(
      '{"error_type":"ArithmeticError","message":"Failed to serialize error"}'
    );
    const fallback2 = JSON.parse(
      '{"error_type":"PanicRecovered","message":"Unknown panic"}'
    );
    expect(ComputationErrorSchema.parse(fallback1).error_type).toBe("ArithmeticError");
    expect(ComputationErrorSchema.parse(fallback2).error_type).toBe("PanicRecovered");
  });
});
```

---

## §10. Error Contract Summary Table

| Variant | error_type string | Actionable? | Fields | When |
|---------|-------------------|-------------|--------|------|
| InputValidation | `"InputValidation"` | ✅ Yes (fix input) | `message`, `field_path` (nullable) | serde parse failure |
| DomainValidation | `"DomainValidation"` | ✅ Yes (fix heirs/estate) | `message`, `related_heir_ids` (array) | step1 logic checks |
| MaxRestartsExceeded | `"MaxRestartsExceeded"` | ❌ No (contact support) | `restart_count` (u32), `last_step` | restart loop > MAX_RESTARTS (10) |
| ArithmeticError | `"ArithmeticError"` | ❌ No (contact support) | `message` | output serialization failure |
| PanicRecovered | `"PanicRecovered"` | ❌ No (contact support) | `message` | unexpected panic caught by catch_unwind |

---

## §11. V1 → V2 Changes

| Item | V1 | V2 |
|------|----|----|
| Error format | Plain string | Structured JSON `ComputationError` |
| TypeScript type | `string` | Discriminated union |
| Zod schema | None | `z.discriminatedUnion("error_type", [...])` |
| `field_path` on InputValidation | Not provided | Best-effort extraction |
| `related_heir_ids` on DomainValidation | Not provided | Vec of involved heir IDs |
| PanicRecovered | Panic = unrecoverable WASM crash | Caught by `catch_unwind`, returned as structured error |
| ArithmeticError | Not named separately | Named variant for output serialization failure |
| Fallback strings | Not specified | Two hardcoded JSON fallback strings in wasm.rs |
