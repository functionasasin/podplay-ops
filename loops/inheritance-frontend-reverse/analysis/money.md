# money — Money Struct Analysis

> **Rust source:** `../inheritance-rust-forward/src/types.rs:22-85`
> **Serialization:** Custom `Serialize`/`Deserialize` impl at `types.rs:31-70`
> **Pipeline conversion:** `fraction.rs:89-93` — `Frac::from_money_centavos()`, used at `pipeline.rs:21`
> **Rounding back to Money:** `fraction.rs:95-101` — `to_centavos_rounded()` (banker's rounding)
> **Display format:** `step10_finalize.rs:215-226` — `format_peso()`

## Rust Definition

```rust
// types.rs:22-29
/// Monetary value in centavos (₱1.00 = 100 centavos).
/// Only used for input and final output — all intermediate computation uses Frac.
///
/// JSON format: `{"centavos": 100000000}` (plain integer or string for large values).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Money {
    pub centavos: BigInt,
}
```

### Custom Serialization (types.rs:31-70)

The engine uses a custom serde implementation with dual-format support:

**Serialization** (types.rs:31-45):
- If `centavos` fits in `i64`, serialized as a JSON number: `{"centavos": 100000000}`
- If `centavos` exceeds `i64::MAX` (~9.2×10¹⁸, or ~₱92 quadrillion), serialized as a JSON string: `{"centavos": "99999999999999999999"}`

**Deserialization** (types.rs:47-70):
- Accepts either a JSON number or a JSON string for the `centavos` field
- String values are parsed via `BigInt::parse()` — invalid strings produce a serde error

### Constructors (types.rs:72-85)

```rust
Money::new(centavos: i64)       // Direct centavos value
Money::from_pesos(pesos: i64)   // Multiplies by 100
```

## TypeScript Interface

```typescript
// Mirrors: ../inheritance-rust-forward/src/types.rs:22-29
// Custom serde at types.rs:31-70

/**
 * Monetary value in centavos (₱1.00 = 100 centavos).
 *
 * JSON wire format: `{"centavos": <number|string>}`
 * - Small values: `{"centavos": 100000000}` (₱1,000,000)
 * - Large values: `{"centavos": "99999999999999999999"}` (exceeds Number.MAX_SAFE_INTEGER)
 *
 * The frontend should:
 * - Display values in pesos (centavos / 100) with ₱ prefix
 * - Accept user input in pesos, convert to centavos for JSON
 * - Use string serialization for values > Number.MAX_SAFE_INTEGER (9,007,199,254,740,991)
 */
export interface Money {
  /** Value in centavos. Number for safe integers, string for large values. */
  centavos: number | string;
}
```

## Zod Schema

```typescript
import { z } from "zod";

// Constraint origin: types.rs:47-70 — custom Deserialize impl accepts i64 or string
// Constraint origin: types.rs:56-58 — CentavosValue enum: Int(i64) | Str(String)
// Frontend addition: must be non-negative (engine has no explicit check, but negative
// estate values are nonsensical — the net distributable estate is always ≥ 0)

/**
 * Zod schema for Money.
 *
 * Accepts:
 * - A non-negative integer (centavos) — for values within JS safe integer range
 * - A numeric string (centavos) — for values exceeding Number.MAX_SAFE_INTEGER
 *
 * The engine's Rust BigInt handles arbitrarily large values. For practical Philippine
 * inheritance scenarios, estates rarely exceed ₱10 billion (1_000_000_000_00 centavos),
 * well within JS safe integer range. String format is supported for completeness.
 */
export const CentavosValueSchema = z.union([
  z.number()
    .int({ message: "Centavos must be a whole number" })
    .nonnegative({ message: "Amount cannot be negative" }),
  z.string()
    .regex(/^\d+$/, { message: "Centavos string must contain only digits" })
    .refine(
      (s) => BigInt(s) >= 0n,
      { message: "Amount cannot be negative" }
    ),
]);

// Mirrors: ../inheritance-rust-forward/src/types.rs:22-29
// Validation: Custom serde at types.rs:47-70
export const MoneySchema = z.object({
  centavos: CentavosValueSchema,
});

export type Money = z.infer<typeof MoneySchema>;
```

## Field Metadata Table

Money is not a standalone wizard step — it appears as a sub-field in multiple contexts:

| Context | Field Path | Label | Input Type | Required | Default | Validation Error | Wizard Step |
|---------|-----------|-------|-----------|----------|---------|------------------|-------------|
| `EngineInput` | `net_distributable_estate` | Net Distributable Estate | MoneyInput (pesos) | Yes | — | "Net distributable estate is required" / "Amount cannot be negative" | 1: Estate |
| `Donation` | `value_at_time_of_donation` | Donation Value | MoneyInput (pesos) | Yes | — | "Donation value is required" / "Amount must be greater than zero" | 5: Donations |
| `Donation` | `professional_expense_imputed_savings` | Imputed Savings | MoneyInput (pesos) | Conditional | `null` | "Imputed savings amount is required when professional expense is marked" | 5: Donations |
| `LegacySpec` | `FixedAmount` | Legacy Amount | MoneyInput (pesos) | When variant=FixedAmount | — | "Legacy amount is required" | 4: Will > Legacies |
| `LegacySpec` | `GenericClass` (2nd element) | Estimated Value | MoneyInput (pesos) | When variant=GenericClass | — | "Estimated value is required" | 4: Will > Legacies |

## MoneyInput Component Spec

The frontend needs a reusable `MoneyInput` component:

### Behavior

1. **User enters pesos** — display a `₱` prefix, allow decimal input up to 2 decimal places
2. **Internal storage in centavos** — multiply pesos by 100, store as integer
3. **JSON serialization** — emit `{"centavos": <number>}` for values ≤ `Number.MAX_SAFE_INTEGER`, `{"centavos": "<string>"}` for larger values
4. **Display formatting** — follow engine's `format_peso()` convention:
   - `₱` prefix
   - Comma-separated thousands: `₱1,000,000`
   - Show centavos only when non-zero: `₱1,000,000` vs `₱1,000,000.50`
   - Two decimal places when centavos present: `₱999.99`

### Formatting Examples (from step10_finalize.rs:636-680)

| Centavos | Pesos Display | JSON |
|----------|--------------|------|
| `0` | `₱0` | `{"centavos": 0}` |
| `1` | `₱0.01` | `{"centavos": 1}` |
| `100` | `₱1` | `{"centavos": 100}` |
| `99999` | `₱999.99` | `{"centavos": 99999}` |
| `100000000` | `₱1,000,000` | `{"centavos": 100000000}` |
| `166666667` | `₱1,666,666.67` | `{"centavos": 166666667}` |
| `5000000000` | `₱50,000,000` | `{"centavos": 5000000000}` |

### Conversion Functions

```typescript
/**
 * Convert pesos (user input) to centavos (wire format).
 * Rounds to nearest centavo to handle floating-point imprecision.
 *
 * Origin: Mirrors Money::from_pesos() at types.rs:80-84
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

/**
 * Convert centavos (wire format) to pesos (display).
 *
 * Origin: Inverse of Money::from_pesos() at types.rs:80-84
 */
export function centavosToPesos(centavos: number | string): number {
  const c = typeof centavos === "string" ? Number(centavos) : centavos;
  return c / 100;
}

/**
 * Format centavos as a peso string following engine conventions.
 *
 * Origin: step10_finalize.rs:215-226 — format_peso()
 * - ₱ prefix
 * - Comma-separated thousands
 * - Centavos shown only when non-zero, always 2 digits
 */
export function formatPeso(centavos: number | string): string {
  const c = typeof centavos === "string" ? BigInt(centavos) : BigInt(centavos);
  const pesos = c / 100n;
  const cents = c % 100n;

  const pesosStr = pesos.toLocaleString("en-US");
  if (cents === 0n) {
    return `₱${pesosStr}`;
  }
  return `₱${pesosStr}.${cents.toString().padStart(2, "0")}`;
}

/**
 * Serialize a centavos value for JSON.
 * Uses number for safe integers, string for large values.
 *
 * Origin: types.rs:31-45 — custom Serialize impl
 */
export function serializeCentavos(centavos: number | bigint): number | string {
  if (typeof centavos === "bigint") {
    return centavos <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(centavos)
      : centavos.toString();
  }
  return centavos;
}
```

## Edge Cases & Gotchas

### 1. BigInt / Large Values

The Rust engine uses `num_bigint::BigInt` for unlimited precision. JavaScript's `number` type is safe only up to `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991 centavos = ₱90,071,992,547,409.91 — about ₱90 trillion).

**Practical impact:** Philippine inheritance estates virtually never exceed this limit. However, the engine supports string serialization for completeness. The frontend should:
- Use `number` for typical cases (the vast majority)
- Fall back to `BigInt` or string for edge cases
- The Zod schema accepts both formats

### 2. Floating-Point Precision on Input

Users enter pesos as decimals (e.g., `1000000.50`). Converting to centavos via `* 100` can produce floating-point errors (e.g., `0.1 * 100 = 10.000000000000002`). Always use `Math.round(pesos * 100)` for the conversion.

### 3. Zero Is Valid

`{"centavos": 0}` is a valid Money value. The engine accepts it. However, a zero `net_distributable_estate` is unusual — the frontend should show a warning (not an error) when the estate value is zero.

### 4. Negative Values — Engine Does Not Validate

The Rust `BigInt` allows negative values, and there's no explicit validation in the engine rejecting negative centavos. However, negative estate values or donation values are nonsensical. The frontend should enforce non-negative at the Zod schema level (which it does above).

### 5. Centavos-Only Field — No Pesos Field in JSON

The JSON wire format is always `{"centavos": <value>}`. There is no `"pesos"` field. The frontend must always convert user-entered peso amounts to centavos before serialization.

### 6. Money Used in Output (Read-Only)

In `EngineOutput.per_heir_shares` (types.rs:536-551), seven fields are `Money`:
- `from_legitime`, `from_free_portion`, `from_intestate`, `total`
- `donations_imputed`, `gross_entitlement`, `net_from_estate`

These are output-only — the frontend displays them using `formatPeso()` but never sends them back. The results view should use the same formatting convention.

### 7. Test Case Estate Values Observed

From the 20 example case files, observed `net_distributable_estate` values:

| Case | Centavos | Pesos |
|------|----------|-------|
| 01-single-lc | 100,000,000 | ₱1,000,000 |
| 02-married-3lc | (standard) | — |
| 07-5lc-large | 5,000,000,000 | ₱50,000,000 |
| 13-small-estate | 1,000,000 | ₱10,000 |
| 14-testate-legacy | 2,000,000,000 | ₱20,000,000 |
| 20-collation | 800,000,000 | ₱8,000,000 |

All values are multiples of 100 (whole pesos) in input test cases. Centavo-level precision appears only in computed output.

Donation values observed: `200,000,000` (₱2,000,000) in case 20-collation.
Legacy values observed: `200,000,000` (₱2,000,000) in case 14-testate-legacy as `FixedAmount`.

### 8. Frac Serialization vs Money Serialization

These are distinct types with different JSON formats — do not confuse:
- **Money**: `{"centavos": 100000000}` — object with single field
- **Frac**: `"1/2"` — bare string in "numer/denom" format

Money appears in input/output. Frac appears in `ShareSpec::Fraction`, `DeviseSpec::FractionalInterest`, and output's `legitime_fraction`.

## Rust→TS Mapping Notes

| Rust | TypeScript | Notes |
|------|-----------|-------|
| `BigInt` (num_bigint) | `number \| string` | Use `number` for values ≤ `MAX_SAFE_INTEGER`, `string` otherwise |
| `Money { centavos: BigInt }` | `{ centavos: number \| string }` | Single-field object, exact same JSON shape |
| `Money::new(100)` | `{ centavos: 100 }` | Direct construction |
| `Money::from_pesos(1000)` | `{ centavos: 100000 }` | Frontend helper: `pesosToCentavos(1000)` |
| `format_peso(&money)` | `formatPeso(money.centavos)` | Same formatting rules: ₱, commas, conditional centavos |
| `money_to_frac(centavos)` | N/A (engine-internal) | Frontend never does Money→Frac; engine handles all computation |
| Custom serde (int or string) | Zod union (number or string) | Both support dual-format deserialization |
