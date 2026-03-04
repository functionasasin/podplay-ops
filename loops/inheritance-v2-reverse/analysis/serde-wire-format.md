# Serde Wire Format — JSON Serialization Rules

**Aspect**: serde-wire-format
**Wave**: 4 (Bridge Contract)
**Depends On**: rust-types, wasm-export

---

## Overview

This document defines the **exact JSON serialization rules** for every field of every type
that crosses the WASM boundary. A TypeScript developer must be able to build a compliant
request JSON from this document alone, and must be able to consume the response JSON
without surprise. These rules are authoritative for both the Rust serde attributes and
the Zod/TypeScript implementations in Wave 5.

---

## §1. Top-Level Conventions

### §1.1 Struct Fields — `snake_case`

All struct fields serialize/deserialize as `snake_case` JSON keys:

```rust
#[serde(rename_all = "snake_case")]
pub struct ComputationInput { ... }
```

Examples:
- Rust `net_estate` → JSON `"net_estate"`
- Rust `heir_type` → JSON `"heir_type"`
- Rust `date_of_birth` → JSON `"date_of_birth"`
- Rust `legal_separation_status` → JSON `"legal_separation_status"`

### §1.2 Enum Variants — `PascalCase`

All enum variants serialize/deserialize as `PascalCase` strings:

```rust
#[serde(rename_all = "PascalCase")]
pub enum HeirType { LegitimateChild, IllegitimateChild, ... }
```

Examples:
- `HeirType::LegitimateChild` → `"LegitimateChild"`
- `HeirType::IllegitimateChild` → `"IllegitimateChild"`
- `ScenarioCode::T1` → `"T1"` (short codes pass through unchanged by PascalCase)
- `ScenarioCode::I12` → `"I12"`
- `DisinheritanceGround::Art919_1` → `"Art919_1"`

### §1.3 Unknown Fields — Rejected on Input, Allowed on Output

Input types carry `#[serde(deny_unknown_fields)]`. Any unknown JSON key on input causes:
```json
{
  "error_type": "InputValidation",
  "message": "unknown field `foo`, expected one of ...",
  "field_path": "foo"
}
```

Output types do NOT carry `deny_unknown_fields`. This allows the engine to add new output
fields in future versions without breaking existing frontend consumers.

### §1.4 Option Fields — Always `null`, Never Absent

All `Option<T>` fields serialize as `null` when absent. They are NEVER omitted from the
JSON object. This rule applies to both input and output types.

```rust
// Rust attribute required on each Option field:
#[serde(serialize_with = "serialize_option_as_null")]
// OR via a global serialize that emits null:
// The serde default for Option is to skip the key entirely — we override this.
```

Correct input JSON:
```json
{ "will": null, "donations": null }
```

INCORRECT (must not use):
```json
{ }   // missing keys
```

**Why**: TypeScript's strict null checks and Zod's `z.nullable()` both expect the key to
be present with a `null` value. Absent keys map to `undefined` in TypeScript, which is a
different type than `null`. Enforcing `null`-not-absent at the wire level prevents
undefined-vs-null bugs at the TypeScript layer.

**Implementation note**: Use `#[serde(default, serialize_with = "...")]` on each `Option`
field, or configure a global serializer. Alternatively, use a newtype wrapper
`NullableOption<T>` that implements Serialize to always emit null.

---

## §2. Primitive Type Rules

### §2.1 Money / Centavos — Number or String

The `Money` struct has a single field `centavos: i64`. On the wire:

- **Deserializes from**: JSON `number` OR JSON `string`
  - `123456` → `i64` 123456
  - `"123456"` → `i64` 123456 (parsed as string)
  - `"123456789012345"` → i64 (large amount safe for JavaScript BigInt use case)
- **Serializes as**: JSON `number` (i64)

```json
// Input: both forms accepted
{ "net_estate": { "centavos": 100000000 } }
{ "net_estate": { "centavos": "100000000" } }

// Output: always number
{ "net_estate": { "centavos": 100000000 } }
```

**Rationale**: JavaScript's `Number` type can represent integers up to 2^53 safely
(~9 quadrillion centavos = ~90 trillion pesos). For extremely large estates, callers may
pass as string to avoid precision loss before parsing. The engine always outputs as number.

### §2.2 Booleans — `true`/`false` Only

Boolean fields must be JSON booleans. NOT strings `"true"/"false"`. NOT numbers `1/0`.

```json
// Correct
{ "has_will": true, "is_legitimate": false }

// WRONG — rejects with InputValidation error
{ "has_will": "true" }
{ "has_will": 1 }
```

All boolean fields in the input model:
| Struct | Field | Type |
|--------|-------|------|
| `DecedentInput` | `has_will` | `bool` |
| `DecedentInput` | `has_legitimate_children` | `bool` |
| `DecedentInput` | `has_illegitimate_children` | `bool` |
| `HeirInput` | `is_adopted` | `bool` |
| `HeirInput` | `adoption_rescinded` | `bool` |
| `HeirInput` | `cause_proven` | `bool` |
| `HeirInput` | `reconciled` | `bool` |
| `HeirInput` | `is_alive` | `bool` |
| `DonationInput` | `is_collatable` | `bool` |
| `DonationInput` | `donor_expressly_exempted` | `bool` |
| `DonationInput` | `heir_renounced` | `bool` |

### §2.3 Strings — UTF-8

All string fields are UTF-8 JSON strings. IDs are opaque strings assigned by the frontend.
No length limit is enforced by the engine, but frontend should keep IDs under 64 characters.

### §2.4 Integers — JSON Numbers (No Fractions, No Overflow)

Fields typed `u32` (e.g., `degree`) and `i64` (e.g., `centavos`) serialize as JSON numbers
without decimal point. JavaScript can represent i64 up to 2^53 safely; the `centavos`
string fallback handles the rest.

### §2.5 Dates — ISO-8601 Strings

All date fields serialize/deserialize as ISO-8601 date strings `"YYYY-MM-DD"`:

```json
{ "date_of_death": "2024-03-15" }
{ "date_of_birth": "1945-08-12" }
```

Date fields that are `Option<String>`:
- `DecedentInput.date_of_death` — required for collation timing; `null` if unknown
- `HeirInput.date_of_birth` — optional
- `HeirInput.date_of_death` — `null` if heir is alive
- `HeirInput.adoption_date` — `null` if not adopted
- `HeirInput.adoption_rescission_date` — `null` if adoption not rescinded

The engine does NOT parse dates into `chrono::NaiveDate` internally; date strings are used
only for comparison and are validated to be parseable as `YYYY-MM-DD`.

### §2.6 Fractions — `"numer/denom"` String

Rational fraction fields in the **output** are serialized as `"numer/denom"` strings:

```json
// Output fields using fraction strings:
{ "per_stirpes_fraction": "1/3" }
{ "per_heir_fraction": "7/24" }
{ "fractional_remainder": "1/6" }
{ "fraction": "1/2" }
```

Rules:
- Always reduced to lowest terms (GCD applied)
- Denominator is always positive
- Integer results: `"1/1"` (not just `"1"`)
- Zero: `"0/1"`

Fraction fields on input (`InstitutionInput.fraction`):
- Optional: `null` if amount_centavos is used instead
- Format when present: `"numer/denom"` (same format as output)
- Engine parses using `num_rational::BigRational::from_str`

---

## §3. Type-Specific Wire Formats

### §3.1 ComputationInput

```json
{
  "decedent": { ... },
  "estate": { ... },
  "heirs": [ ... ],
  "will": null,
  "donations": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `decedent` | object | Required, `DecedentInput` shape |
| `estate` | object | Required, `EstateInput` shape |
| `heirs` | array | Required, may be empty array `[]` |
| `will` | object \| null | `null` if intestate succession |
| `donations` | array \| null | `null` or `[]` if no inter vivos donations |

### §3.2 DecedentInput

```json
{
  "name": "Juan dela Cruz",
  "date_of_death": "2024-01-15",
  "has_will": false,
  "has_legitimate_children": true,
  "has_illegitimate_children": false,
  "legal_separation_status": "NotApplicable",
  "domicile": null,
  "nationality": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `name` | string | Display only |
| `date_of_death` | string \| null | ISO-8601 `YYYY-MM-DD`; `null` if unknown |
| `has_will` | boolean | Drives `SuccessionType` determination |
| `has_legitimate_children` | boolean | Derived hint; engine also checks heirs |
| `has_illegitimate_children` | boolean | Derived hint |
| `legal_separation_status` | `"NotApplicable"` \| `"InnocentSpouse"` \| `"GuiltySpouse"` | Applies to decedent's legal separation from spouse |
| `domicile` | string \| null | Free text |
| `nationality` | string \| null | Free text |

### §3.3 EstateInput

```json
{
  "net_estate": { "centavos": 500000000 },
  "gross_estate": { "centavos": 600000000 },
  "obligations": { "centavos": 100000000 },
  "description": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `net_estate` | `Money` object | `{ "centavos": number }` |
| `gross_estate` | `Money` object \| null | Optional; for collation base if provided |
| `obligations` | `Money` object \| null | Optional; for audit trail |
| `description` | string \| null | Optional label |

### §3.4 HeirInput

```json
{
  "id": "heir_001",
  "name": "Maria dela Cruz",
  "heir_type": "LegitimateChild",
  "is_alive": true,
  "is_adopted": false,
  "adoption_rescinded": false,
  "adoption_date": null,
  "adoption_rescission_date": null,
  "cause_proven": false,
  "reconciled": false,
  "date_of_birth": null,
  "date_of_death": null,
  "degree": null,
  "legal_separation_status": "NotApplicable",
  "disinheritances": [],
  "substitutions": [],
  "children": [],
  "donations_received": []
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | Unique within this computation |
| `name` | string | Display only |
| `heir_type` | HeirType enum string | See §4.1 |
| `is_alive` | boolean | `false` if predeceased |
| `is_adopted` | boolean | Triggers RA 8552 / RA 11642 rules |
| `adoption_rescinded` | boolean | Reverts to biological status |
| `adoption_date` | string \| null | ISO-8601 |
| `adoption_rescission_date` | string \| null | ISO-8601; only if rescinded |
| `cause_proven` | boolean | For `DisinheritanceRecord.cause_proven` field |
| `reconciled` | boolean | Nullifies disinheritance if true (Art. 922) |
| `date_of_birth` | string \| null | ISO-8601; used for age checks |
| `date_of_death` | string \| null | ISO-8601; triggers representation if predeceased |
| `degree` | number \| null | Collateral degree; null for direct-line heirs |
| `legal_separation_status` | enum string | Applies to spouse heirs only |
| `disinheritances` | array | `DisinheritanceRecord[]`; `[]` if none |
| `substitutions` | array | `SubstitutionInput[]`; `[]` if none |
| `children` | array | `HeirInput[]` (recursive); grandchildren for representation |
| `donations_received` | array | `DonationId[]` (references to top-level donations) |

### §3.5 DisinheritanceRecord

```json
{
  "id": "dis_001",
  "heir_id": "heir_003",
  "ground": "Art919_1",
  "cause_proven": true,
  "reconciled": false,
  "note": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | Unique |
| `heir_id` | string | References `HeirInput.id` |
| `ground` | DisinheritanceGround enum string | See §4.2 |
| `cause_proven` | boolean | Engine uses this; false = invalid disinheritance |
| `reconciled` | boolean | Art. 922; true = disinheritance nullified |
| `note` | string \| null | Optional free text |

### §3.6 WillInput

```json
{
  "id": "will_001",
  "date_executed": "2023-05-01",
  "institutions": [],
  "devises": [],
  "legacies": [],
  "substitutions": []
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | Unique |
| `date_executed` | string \| null | ISO-8601 |
| `institutions` | array | `InstitutionInput[]` |
| `devises` | array | `DeviseInput[]` |
| `legacies` | array | `LegacyInput[]` |
| `substitutions` | array | `SubstitutionInput[]` |

### §3.7 InstitutionInput

```json
{
  "id": "inst_001",
  "heir_id": "heir_001",
  "fraction": "1/2",
  "amount_centavos": null,
  "description": null
}
```

Exactly one of `fraction` or `amount_centavos` should be non-null. If both are provided,
`fraction` takes precedence. If both are null, the institution is invalid.

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | |
| `heir_id` | string | References HeirInput.id |
| `fraction` | string \| null | `"numer/denom"` format |
| `amount_centavos` | number \| null | Specific amount in centavos |
| `description` | string \| null | |

### §3.8 DeviseInput / LegacyInput

```json
{
  "id": "devise_001",
  "description": "Quezon City property",
  "value": { "centavos": 20000000 },
  "beneficiary_heir_id": "heir_002",
  "conditions": []
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | |
| `description` | string | Property description |
| `value` | `Money` object | Market value in centavos |
| `beneficiary_heir_id` | string \| null | `null` for charitable devises |
| `conditions` | array | `ConditionInput[]`; `[]` if none |

### §3.9 SubstitutionInput

```json
{
  "id": "sub_001",
  "primary_heir_id": "heir_001",
  "substitute_heir_id": "heir_005",
  "substitution_type": "Simple",
  "conditions": []
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | |
| `primary_heir_id` | string | Heir being substituted |
| `substitute_heir_id` | string | Heir taking over |
| `substitution_type` | SubstitutionType enum string | `"Simple"` \| `"Fideicommissary"` \| `"Reciprocal"` |
| `conditions` | array | `[]` if none |

### §3.10 DonationInput

```json
{
  "id": "donation_001",
  "donor_id": null,
  "recipient_heir_id": "heir_002",
  "amount": { "centavos": 5000000 },
  "date": "2020-03-10",
  "is_collatable": true,
  "donor_expressly_exempted": false,
  "heir_renounced": false,
  "type": "CashGift",
  "description": null,
  "professional_expense_imputed_savings_centavos": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `id` | string | |
| `donor_id` | string \| null | If donation by someone other than decedent |
| `recipient_heir_id` | string \| null | `null` for third-party donees |
| `amount` | `Money` object | |
| `date` | string \| null | ISO-8601 |
| `is_collatable` | boolean | Drives collation eligibility |
| `donor_expressly_exempted` | boolean | Art. 1062 exemption |
| `heir_renounced` | boolean | Art. 1062 exemption via renunciation |
| `type` | string | Donation category label (free text or enum) |
| `description` | string \| null | |
| `professional_expense_imputed_savings_centavos` | number \| null | Art. 1068 |

---

## §4. Enum Wire Formats

### §4.1 HeirType

| Rust Variant | JSON string |
|---|---|
| `LegitimateChild` | `"LegitimateChild"` |
| `LegitimatedChild` | `"LegitimatedChild"` |
| `AdoptedChild` | `"AdoptedChild"` |
| `IllegitimateChild` | `"IllegitimateChild"` |
| `LegitimateAscendant` | `"LegitimateAscendant"` |
| `Spouse` | `"Spouse"` |
| `Sibling` | `"Sibling"` |
| `NieceNephew` | `"NieceNephew"` |
| `OtherCollateral` | `"OtherCollateral"` |

### §4.2 DisinheritanceGround (22 grounds)

| Rust Variant | JSON String | Civil Code Article |
|---|---|---|
| `Art919_1` | `"Art919_1"` | Art. 919(1) — abandonment (children) |
| `Art919_2` | `"Art919_2"` | Art. 919(2) — conviction of crime against parent |
| `Art919_3` | `"Art919_3"` | Art. 919(3) — conviction of adultery/concubinage |
| `Art919_4` | `"Art919_4"` | Art. 919(4) — attempt against life |
| `Art919_5` | `"Art919_5"` | Art. 919(5) — accusation of crime (children) |
| `Art919_6` | `"Art919_6"` | Art. 919(6) — fraud/coercion as to will |
| `Art919_7` | `"Art919_7"` | Art. 919(7) — refusal to support |
| `Art919_8` | `"Art919_8"` | Art. 919(8) — leads a dishonorable life |
| `Art920_1` | `"Art920_1"` | Art. 920(1) — attempt against life (parents) |
| `Art920_2` | `"Art920_2"` | Art. 920(2) — accusation of crime (parents) |
| `Art920_3` | `"Art920_3"` | Art. 920(3) — conviction of crime against child |
| `Art920_4` | `"Art920_4"` | Art. 920(4) — fraud/coercion (parents) |
| `Art920_5` | `"Art920_5"` | Art. 920(5) — refusal to support (parents) |
| `Art920_6` | `"Art920_6"` | Art. 920(6) — attempt on decency (parents) |
| `Art920_7` | `"Art920_7"` | Art. 920(7) — leads a dishonorable/criminal life |
| `Art920_8` | `"Art920_8"` | Art. 920(8) — conviction of attempt on child's life |
| `Art921_1` | `"Art921_1"` | Art. 921(1) — attempt against life (spouse) |
| `Art921_2` | `"Art921_2"` | Art. 921(2) — accusation of crime (spouse) |
| `Art921_3` | `"Art921_3"` | Art. 921(3) — conviction (spouse) |
| `Art921_4` | `"Art921_4"` | Art. 921(4) — fraud/coercion (spouse) |
| `Art921_5` | `"Art921_5"` | Art. 921(5) — attempt indecency against children |
| `Art921_6` | `"Art921_6"` | Art. 921(6) — leads a dishonorable life (spouse) |

### §4.3 SubstitutionType

| Rust Variant | JSON String |
|---|---|
| `Simple` | `"Simple"` |
| `Fideicommissary` | `"Fideicommissary"` |
| `Reciprocal` | `"Reciprocal"` |

### §4.4 LegalSeparationStatus

| Rust Variant | JSON String |
|---|---|
| `NotApplicable` | `"NotApplicable"` |
| `InnocentSpouse` | `"InnocentSpouse"` |
| `GuiltySpouse` | `"GuiltySpouse"` |

### §4.5 ScenarioCode (30 variants)

All scenario codes pass through PascalCase rename unchanged since they are already
PascalCase-like uppercase identifiers:

| Testate | Intestate |
|---------|-----------|
| `"T1"` through `"T15"` | `"I1"` through `"I15"` |

Full mapping: T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15,
I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15.

### §4.6 SuccessionType (output only)

| Rust Variant | JSON String |
|---|---|
| `Testate` | `"Testate"` |
| `Intestate` | `"Intestate"` |
| `Mixed` | `"Mixed"` |

### §4.7 ExclusionReason (output only)

| Rust Variant | JSON String |
|---|---|
| `Predeceased` | `"Predeceased"` |
| `Incapacity` | `"Incapacity"` |
| `Unworthiness` | `"Unworthiness"` |
| `Renunciation` | `"Renunciation"` |
| `IronCurtain` | `"IronCurtain"` |
| `NotCalled` | `"NotCalled"` |
| `ValidDisinheritance` | `"ValidDisinheritance"` |
| `InvalidDisinheritance` | `"InvalidDisinheritance"` |

### §4.8 RepresentationTrigger (output only)

| Rust Variant | JSON String |
|---|---|
| `Predecease` | `"Predecease"` |
| `Disinheritance` | `"Disinheritance"` |
| `Incapacity` | `"Incapacity"` |
| `Art902IllegitimateLine` | `"Art902IllegitimateLine"` |

### §4.9 VacancyCause (output only)

| Rust Variant | JSON String |
|---|---|
| `Predecease` | `"Predecease"` |
| `Incapacity` | `"Incapacity"` |
| `Renunciation` | `"Renunciation"` |
| `DisinheritanceInvalid` | `"DisinheritanceInvalid"` |
| `ConditionFailed` | `"ConditionFailed"` |
| `LegitimacyVacancy` | `"LegitimacyVacancy"` |

### §4.10 ResolutionMethod (output only)

| Rust Variant | JSON String |
|---|---|
| `Substitution` | `"Substitution"` |
| `Representation` | `"Representation"` |
| `Accretion` | `"Accretion"` |
| `IntestateFallback` | `"IntestateFallback"` |
| `Escheat` | `"Escheat"` |

### §4.11 Tagged Enums (discriminated unions)

Some enums use serde's **internally-tagged** or **adjacently-tagged** representation:

#### PreteritionEffect — internally tagged with `"type"` key
```rust
#[serde(tag = "type")]
#[serde(rename_all = "PascalCase")]
pub enum PreteritionEffect { ... }
```
```json
{ "type": "AnnulsAll" }
{ "type": "AnnulsInstitutions", "affected_institution_ids": ["inst_001"] }
```

#### ValidationWarning — internally tagged with `"code"` key + `"data"` content
```rust
#[serde(tag = "code", content = "data")]
#[serde(rename_all = "PascalCase")]
pub enum ValidationWarning { ... }
```
```json
{ "code": "CollationDebt", "data": { "heir_id": "heir_002", "excess_centavos": 500000 } }
{ "code": "ManualReviewRequired", "data": { "flag": "AllGrandparentsExcluded" } }
```

#### ManualReviewFlag — internally tagged with `"flag"` key
```rust
#[serde(tag = "flag")]
#[serde(rename_all = "PascalCase")]
pub enum ManualReviewFlag { ... }
```
```json
{ "flag": "AllGrandparentsExcluded" }
{ "flag": "CollateralDegreeAmbiguous", "degree": 5 }
```

#### ComputationError — internally tagged with `"error_type"` key
```rust
#[serde(tag = "error_type")]
#[serde(rename_all = "PascalCase")]
pub enum ComputationError { ... }
```
```json
{ "error_type": "InputValidation", "message": "...", "field_path": "foo" }
{ "error_type": "DomainValidation", "message": "...", "related_heir_ids": ["h1"] }
{ "error_type": "MaxRestartsExceeded", "restart_count": 10, "last_step": "step7_validate_testate" }
{ "error_type": "ArithmeticError", "message": "..." }
{ "error_type": "PanicRecovered", "message": "..." }
```

---

## §5. Output Wire Format

### §5.1 ComputationOutput

```json
{
  "scenario_code": "T3",
  "succession_type": "Testate",
  "net_distributable_estate": { "centavos": 500000000 },
  "adjusted_estate": { "centavos": 520000000 },
  "free_portion_gross": { "centavos": 250000000 },
  "free_portion_disposable": { "centavos": 230000000 },
  "distributions": [ ... ],
  "rounding_adjustments": [ ... ],
  "warnings": [],
  "manual_review_flags": [],
  "testate_validation": null,
  "collation": null,
  "vacancy_resolutions": [],
  "computation_log": [ ... ]
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `scenario_code` | string | ScenarioCode enum |
| `succession_type` | string | SuccessionType enum |
| `net_distributable_estate` | Money | After obligations and collation adjustment |
| `adjusted_estate` | Money | E_adj = net_estate + collatable_donations |
| `free_portion_gross` | Money | Before dispositions |
| `free_portion_disposable` | Money | After dispositions |
| `distributions` | array | `HeirDistribution[]` |
| `rounding_adjustments` | array | `RoundingAdjustment[]` |
| `warnings` | array | `ValidationWarning[]`; `[]` if none |
| `manual_review_flags` | array | `ManualReviewFlag[]`; `[]` if none |
| `testate_validation` | object \| null | `null` for intestate |
| `collation` | object \| null | `null` if no collatable donations |
| `vacancy_resolutions` | array | `VacancyResolution[]`; `[]` if none |
| `computation_log` | array | `ComputationLogEntry[]` |

### §5.2 HeirDistribution

```json
{
  "heir_id": "heir_001",
  "heir_name": "Maria dela Cruz",
  "heir_type": "LegitimateChild",
  "effective_group": "G1",
  "is_excluded": false,
  "exclusion_reason": null,
  "legitime_centavos": 125000000,
  "free_portion_centavos": 0,
  "total_centavos": 125000000,
  "share_source": "Legitime",
  "per_stirpes_fraction": null,
  "representation": null,
  "per_heir_fraction": "1/4",
  "partition_notes": null
}
```

| Field | JSON Type | Notes |
|-------|-----------|-------|
| `heir_id` | string | |
| `heir_name` | string | |
| `heir_type` | string | HeirType enum |
| `effective_group` | string \| null | `"G1"` through `"G4"` or null for excluded |
| `is_excluded` | boolean | |
| `exclusion_reason` | string \| null | ExclusionReason enum or null |
| `legitime_centavos` | number | i64 |
| `free_portion_centavos` | number | i64 |
| `total_centavos` | number | i64 |
| `share_source` | string | ShareSource enum |
| `per_stirpes_fraction` | string \| null | `"numer/denom"` or null |
| `representation` | object \| null | RepresentationChain or null |
| `per_heir_fraction` | string \| null | `"numer/denom"` or null |
| `partition_notes` | string \| null | |

### §5.3 RoundingAdjustment

```json
{
  "heir_id": "heir_003",
  "adjustment_centavos": 1,
  "reason": "Hare-Niemeyer rounding bonus",
  "fractional_remainder": "2/3"
}
```

---

## §6. Null Serialization Implementation Pattern

The `deny_unknown_fields` + null-not-absent requirement creates a subtle Rust challenge.
Serde's default `Option<T>` serialization skips absent keys. To enforce null:

### Option A: Per-field attribute (recommended for clarity)
```rust
use serde::{Serialize, Deserialize};

fn serialize_null<S: serde::Serializer>(v: &Option<impl Serialize>, s: S) -> Result<S::Ok, S::Error> {
    match v {
        Some(inner) => inner.serialize(s),
        None => s.serialize_none(),
    }
}
// Actually the default serialize_none already emits null.
// The issue is #[serde(skip_serializing_if = "Option::is_none")] — do NOT use this.
```

### Option B: Global rule — never use `skip_serializing_if`
Do NOT add `#[serde(skip_serializing_if = "Option::is_none")]` to any field. The default
serde behavior for `Option<T>` WITHOUT `skip_serializing_if` is to serialize as `null`.

### Summary
- ✅ `pub will: Option<WillInput>` — serializes as `null` by default (no attribute needed)
- ❌ `#[serde(skip_serializing_if = "Option::is_none")] pub will: Option<WillInput>` — omits key (DO NOT USE)

The engine must also accept input where optional fields are present with `null` value
(required) and accept input where optional fields are absent (via `#[serde(default)]`).
Use `#[serde(default)]` on all `Option<T>` input fields so that absent keys deserialize
as `None` (matching the TypeScript `undefined → null` coercion at the Zod layer).

---

## §7. Complete Serde Attribute Table

The following table summarizes the authoritative serde attributes per type category:

| Category | `deny_unknown_fields` | `rename_all` | Tag style | Notes |
|----------|----------------------|--------------|-----------|-------|
| All input structs | ✅ yes | `snake_case` | n/a | ComputationInput, DecedentInput, EstateInput, HeirInput, WillInput, InstitutionInput, DeviseInput, LegacyInput, DisinheritanceRecord, SubstitutionInput, DonationInput |
| All output structs | ❌ no | `snake_case` | n/a | ComputationOutput, HeirDistribution, RoundingAdjustment, CollationResult, etc. |
| Domain enums | n/a | `PascalCase` | none (plain string) | HeirType, DisinheritanceGround, ScenarioCode, SubstitutionType, LegalSeparationStatus, SuccessionType, ExclusionReason, RepresentationTrigger, VacancyCause, ResolutionMethod |
| Tagged output enums | n/a | `PascalCase` | `#[serde(tag = "...")]` | PreteritionEffect (tag="type"), ValidationWarning (tag="code", content="data"), ManualReviewFlag (tag="flag") |
| Error enum | n/a | `PascalCase` | `#[serde(tag = "error_type")]` | ComputationError |
| Money | ❌ no | `snake_case` | n/a | Custom centavos deserializer (number OR string); serializes as number |
| Option fields | — | — | — | Never use `skip_serializing_if`; always emit `null` |
| Fractions | — | — | — | `"numer/denom"` string in all output fields |
| Dates | — | — | — | `"YYYY-MM-DD"` ISO-8601 strings in all date fields |
| Booleans | — | — | — | JSON `true`/`false` only; never string or number |

---

## §8. Full Input JSON Example (Testate, Scenario T3)

```json
{
  "decedent": {
    "name": "Carlos Reyes",
    "date_of_death": "2024-06-01",
    "has_will": true,
    "has_legitimate_children": true,
    "has_illegitimate_children": true,
    "legal_separation_status": "NotApplicable",
    "domicile": null,
    "nationality": null
  },
  "estate": {
    "net_estate": { "centavos": 100000000 },
    "gross_estate": null,
    "obligations": null,
    "description": null
  },
  "heirs": [
    {
      "id": "h1",
      "name": "Ana Reyes",
      "heir_type": "LegitimateChild",
      "is_alive": true,
      "is_adopted": false,
      "adoption_rescinded": false,
      "adoption_date": null,
      "adoption_rescission_date": null,
      "cause_proven": false,
      "reconciled": false,
      "date_of_birth": null,
      "date_of_death": null,
      "degree": null,
      "legal_separation_status": "NotApplicable",
      "disinheritances": [],
      "substitutions": [],
      "children": [],
      "donations_received": []
    },
    {
      "id": "h2",
      "name": "Ben Reyes (IC)",
      "heir_type": "IllegitimateChild",
      "is_alive": true,
      "is_adopted": false,
      "adoption_rescinded": false,
      "adoption_date": null,
      "adoption_rescission_date": null,
      "cause_proven": false,
      "reconciled": false,
      "date_of_birth": null,
      "date_of_death": null,
      "degree": null,
      "legal_separation_status": "NotApplicable",
      "disinheritances": [],
      "substitutions": [],
      "children": [],
      "donations_received": []
    }
  ],
  "will": {
    "id": "w1",
    "date_executed": "2023-01-15",
    "institutions": [
      {
        "id": "inst_1",
        "heir_id": "h1",
        "fraction": "1/2",
        "amount_centavos": null,
        "description": null
      }
    ],
    "devises": [],
    "legacies": [],
    "substitutions": []
  },
  "donations": null
}
```

---

## §9. Key Decisions vs V1

| Decision | V1 | V2 | Rationale |
|----------|----|----|-----------|
| Money wire format | number only | number OR string | BigInt support for large estates |
| Option serialization | skip if none (key absent) | always emit null | Strict TypeScript null checking |
| Enum variant case | PascalCase (same) | PascalCase (same) | No change |
| Fraction format | `"numer/denom"` (same) | `"numer/denom"` (same) | No change |
| Unknown field handling | deny_unknown_fields (same) | deny_unknown_fields (same) | No change |
| Error shape | plain string | structured JSON `ComputationError` | Frontend typed error handling |
| Tag field for errors | none | `error_type` | Discriminated union in TypeScript |
| Date format | ISO-8601 strings (same) | ISO-8601 strings (same) | No change |
