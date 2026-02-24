# Analysis: `will` — Will Struct

**Rust source**: `../inheritance-rust-forward/src/types.rs:362–368`
**Pipeline consumption**: `pipeline.rs:25–77`, `step3_scenario.rs:53–58`, `step6_validation.rs`

---

## Rust Definition

```rust
// types.rs:362–368
pub struct Will {
    pub institutions: Vec<InstitutionOfHeir>,
    pub legacies: Vec<Legacy>,
    pub devises: Vec<Devise>,
    pub disinheritances: Vec<Disinheritance>,
    pub date_executed: Date,  // Date = String (ISO-8601)
}
```

`Will` appears as `Option<Will>` in `EngineInput.will` (types.rs:292):
- `None` → engine treats as intestate (step3_scenario.rs:53–58)
- `Some(Will)` → engine treats as testate, runs Step 6 validation

---

## TypeScript Interface

```typescript
// Mirrors types.rs:362–368 (Will struct)
// and types.rs:292 (EngineInput.will: Option<Will>)

/** Top-level will container. When absent from EngineInput, succession is intestate. */
export interface Will {
  /** Testamentary institutions of heirs (Art. 782, 840–870). Can be empty. */
  institutions: InstitutionOfHeir[];
  /** Pecuniary/property legacies to legatees (Arts. 781, 924–959). Can be empty. */
  legacies: Legacy[];
  /** Real property devises to devisees (Arts. 781, 924–959). Can be empty. */
  devises: Devise[];
  /** Disinheritances declared in the will (Arts. 915–922). Can be empty. */
  disinheritances: Disinheritance[];
  /** Date the will was executed. ISO-8601 string: "YYYY-MM-DD". */
  date_executed: string;
}

/**
 * EngineInput.will is optional.
 * Frontend represents "no will" as null/undefined → intestate succession.
 */
export type WillOrNone = Will | null;
```

---

## Zod Schema

```typescript
import { z } from "zod";

// Defined here; sub-schemas in institution-of-heir.md, legacy.md, etc.
// Constraint origins noted per field.

export const WillSchema = z.object({
  // Constraint: Vec<InstitutionOfHeir> — can be empty (engine: no institutions → only legacies/devises)
  institutions: z.array(InstitutionOfHeirSchema),
  // Constraint: Vec<Legacy> — can be empty
  legacies: z.array(LegacySchema),
  // Constraint: Vec<Devise> — can be empty
  devises: z.array(DeviseSchema),
  // Constraint: Vec<Disinheritance> — can be empty
  disinheritances: z.array(DisinheritanceSchema),
  // Constraint: ISO-8601 date string; must be before decedent date_of_death (Art. 838 — will must
  // predate death; engine does NOT enforce this, but it is a legal requirement). Frontend validates.
  date_executed: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((d) => !isNaN(Date.parse(d)), "Must be a valid calendar date"),
});

// Additional cross-field refinement (added to EngineInputSchema):
// date_executed must be on or before decedent.date_of_death (Art. 838 — a will signed after death
// is void). Engine does NOT enforce; frontend enforces.
// .refine(
//   (input) =>
//     !input.will ||
//     input.will.date_executed <= input.decedent.date_of_death,
//   { message: "Will date must be on or before date of death", path: ["will", "date_executed"] }
// )
```

---

## Field Metadata Table

| Field | Label | Input Type | Default | Conditional Visibility | Wizard Step | Validation Error |
|-------|-------|-----------|---------|------------------------|-------------|-----------------|
| *(will toggle)* | "Decedent left a will" | toggle (bool) | `false` | Always visible on Decedent step | Step 1 (Decedent) | — |
| `date_executed` | "Date Will Was Executed" | date picker | today | Only when will toggle = true | Step 4 (Will) | "Must be a valid date on or before date of death" |
| `institutions` | "Instituted Heirs" | repeatable sub-form | `[]` | Only when will = true | Step 4 (Will) | — |
| `legacies` | "Legacies" | repeatable sub-form | `[]` | Only when will = true | Step 4 (Will) | — |
| `devises` | "Devises" | repeatable sub-form | `[]` | Only when will = true | Step 4 (Will) | — |
| `disinheritances` | "Disinheritances" | repeatable sub-form | `[]` | Only when will = true | Step 4 (Will) | — |

**Note**: The will itself is not a separate top-level wizard step field. The user first answers
"Did the decedent leave a will?" (toggle on Decedent step). If yes, Step 4 "Will & Dispositions"
becomes available and the `will` field is populated; if no, `will = null` is sent to the engine.

---

## Wizard Step Placement

| Aspect | Wizard Step |
|--------|-------------|
| Will toggle ("left a will?") | Step 1 — Decedent |
| `date_executed` | Step 4 — Will & Dispositions |
| All four sub-lists | Step 4 — Will & Dispositions (tabbed: Institutions / Legacies / Devises / Disinheritances) |

Step 4 is gated: only visible when `hasWill = true`. The step itself is split into four tabs,
one per Vec field.

---

## Serialization Behavior

### Will = null (intestate)

```json
{
  "will": null
}
```

The engine receives `Option<Will> = None` → Step 3 sets `SuccessionType::Intestate`.

### Will = present (testate)

```json
{
  "will": {
    "institutions": [...],
    "legacies": [...],
    "devises": [...],
    "disinheritances": [...],
    "date_executed": "2025-06-01"
  }
}
```

All four Vec fields are required (not optional) even if empty.

### Minimal will (just a date)

```json
{
  "will": {
    "institutions": [],
    "legacies": [],
    "devises": [],
    "disinheritances": [],
    "date_executed": "2025-06-01"
  }
}
```

Engine accepts this. Step 3 → Testate. Step 6 runs but finds no dispositions.

---

## Sub-type Serialization Notes

The following sub-types are analyzed in their own files (see respective `analysis/` docs), but
their JSON serialization quirks are documented here for the Will container's context:

### `ShareSpec` (types.rs:381–388)

Serde default externally-tagged enum. Unit variants serialize as plain strings; tuple variant
`Fraction(Frac)` serializes as `{"Fraction": "n/d"}` where Frac is a string.

```json
"share": "EntireFreePort"           // unit variant
"share": "EqualWithOthers"          // unit variant
"share": "EntireEstate"             // unit variant
"share": "Unspecified"              // unit variant
"share": "Residuary"                // unit variant
"share": {"Fraction": "1/3"}        // Fraction(Frac) — note: Frac serializes as "n/d" STRING
```

**Critical**: Frac is NOT `{"numer":1,"denom":3}` — it is the STRING `"1/3"`.
See `fraction.rs:239–245` (serialize as `format!("{}/{}", numer, denom)`).

### `LegacySpec` (types.rs:409–413)

```json
{"FixedAmount": {"centavos": 200000000}}
{"SpecificAsset": "asset-id-string"}
{"GenericClass": ["class-description", {"centavos": 500000000}]}
```

GenericClass is a 2-tuple `(String, Money)` → serializes as JSON array `[string, {centavos}]`.

### `DeviseSpec` (types.rs:426–429)

```json
{"SpecificProperty": "asset-id-string"}
{"FractionalInterest": ["asset-id-string", "1/2"]}
```

FractionalInterest is a 2-tuple `(AssetId, Frac)` → serializes as `[string, "n/d-string"]`.

### `HeirReference` (types.rs:391–396)

```json
{"person_id": null, "name": "Red Cross PH", "is_collective": false, "class_designation": null}
{"person_id": "c1", "name": "Cesar", "is_collective": false, "class_designation": null}
{"person_id": null, "name": "Legitimate Children", "is_collective": true, "class_designation": "LegitimateChild"}
```

`person_id = null` for strangers (charities, non-family legatees).
`is_collective = true` for class designations (e.g., "to all my legitimate children").

---

## Pipeline Logic (Read-Only Reference)

| Pipeline Step | What It Does With `will` |
|--------------|--------------------------|
| `pipeline.rs:25` | `input.will.is_some()` → passes `has_will: true` to Step 3 |
| `step3_scenario.rs:55–58` | `has_will=true` → `SuccessionType::Testate`; `false` → `Intestate` |
| `pipeline.rs:75–90` | If `will.is_some()`, calls `step6_validate_will(will, heirs, ...)` |
| `step6_validation.rs:294` | `check_preterition(will, heirs)` — if compulsory heir fully omitted from `institutions` → all institutions annulled (Art. 854) |
| `step6_validation.rs:497–570` | Inofficiousness check sums `will.legacies + will.devises + will.institutions` vs. free portion |
| `step6_validation.rs:564–650` | Three-phase reduction (Art. 911): Phase 1a non-preferred L/D, Phase 1b preferred L/D, Phase 2 voluntary institutions |
| `step7_distribute.rs:283` | `inst.is_residuary=true` → captures leftover free portion after other dispositions |
| `step7_distribute.rs:974–1043` | Will coverage analysis for mixed succession detection |

---

## Edge Cases

### 1. Empty Will (will present, no dispositions)

```json
{"institutions":[],"legacies":[],"devises":[],"disinheritances":[],"date_executed":"2025-01-01"}
```

Engine processes as Testate. Step 6 skips preterition (no institutions to annul, step6:298–303).
Step 7 distributes intestate share rules. This is an unusual but valid input.

**Frontend behavior**: Allow but show warning: "A will with no dispositions will result in
intestate-equivalent distribution."

### 2. `is_residuary = true` on institution

When an institution has `is_residuary=true`, it captures whatever free portion remains after all
other specific dispositions. Only one residuary institution should be present. Engine checks:
`will.institutions.iter().any(|inst| inst.is_residuary)` (step7:987).

**Frontend**: Radio-style toggle on each institution item; selecting residuary deselects others.

### 3. `is_preferred = true` on legacy/devise

Preferred legacies/devises are reduced last (Phase 1b) under Art. 911. Non-preferred reduced first
(Phase 1a) pro rata.

**Frontend**: Toggle on each legacy/devise; no mutual exclusion (multiple preferred allowed).

### 4. `date_executed` not validated by engine

The engine never checks that `date_executed <= date_of_death`. A will executed after death is
legally void (Art. 838 Civil Code) but the engine accepts it. **Frontend must enforce** this
cross-field validation at form submission.

### 5. Will with only disinheritances (no institutions/legacies/devises)

Legally valid — a will can purely disinherit without affirmatively disposing of property.
Step 6 handles preterition check (finds empty institutions → no annulment needed, step6:298–303).
Step 7 distributes remaining estate per intestate rules to non-disinherited heirs.

### 6. Stranger references (charity, person outside family_tree)

`HeirReference.person_id = null` with `name = "Red Cross PH"`. The engine creates a synthetic
heir entry for the stranger in step7 using the `person_id = ""` fallback. Frontend must allow
free-text name entry for non-family-tree legatees/devisees/institutees.

---

## Rust → TypeScript Mapping Summary

| Rust Type | TypeScript Type | Serialization |
|-----------|-----------------|---------------|
| `Option<Will>` | `Will \| null` | JSON `null` or `{institutions,legacies,devises,disinheritances,date_executed}` |
| `Vec<InstitutionOfHeir>` | `InstitutionOfHeir[]` | JSON array (can be `[]`) |
| `Vec<Legacy>` | `Legacy[]` | JSON array (can be `[]`) |
| `Vec<Devise>` | `Devise[]` | JSON array (can be `[]`) |
| `Vec<Disinheritance>` | `Disinheritance[]` | JSON array (can be `[]`) |
| `Date` (`String`) | `string` | ISO-8601 `"YYYY-MM-DD"` |
| `ShareSpec::Fraction(Frac)` | `{ Fraction: string }` | `{"Fraction": "1/3"}` — Frac is string |
| `ShareSpec::EqualWithOthers` | `"EqualWithOthers"` | plain string |
| `LegacySpec::FixedAmount(Money)` | `{ FixedAmount: { centavos: number \| string } }` | externally-tagged |
| `LegacySpec::GenericClass(String, Money)` | `{ GenericClass: [string, { centavos: number \| string }] }` | 2-tuple array |
| `DeviseSpec::FractionalInterest(AssetId, Frac)` | `{ FractionalInterest: [string, string] }` | 2-tuple, Frac as "n/d" string |

---

## Test Case Coverage

| Test Case | Will Present | Institutions | Legacies | Devises | Disinheritances | Notes |
|-----------|-------------|-------------|---------|---------|-----------------|-------|
| `06-testate-charity.json` | Yes | 1 (EntireFreePort to Red Cross) | 0 | 0 | 0 | Stranger as heir |
| `14-testate-legacy.json` | Yes | 0 | 1 (FixedAmount to Church) | 0 | 0 | Legacy only, no institutions |
| All other cases | No | — | — | — | — | Intestate |

**Gap**: No test cases exercise `ShareSpec::Fraction`, `ShareSpec::EqualWithOthers`,
`DeviseSpec`, `Disinheritance`, `Condition`, or `Substitute`. These sub-types
are exercised only in unit tests within `step6_validation.rs` and `step7_distribute.rs`.
