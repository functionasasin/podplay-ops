# FiliationProof — Frontend Spec

> Rust source: `types.rs:111–118` (enum FiliationProof)
> Consumed by: `step1_classify.rs:78–79` (copied to Heir), `step10_finalize.rs:191–213` (narrative generation)
> Legal basis: Family Code Art. 172, Art. 176

## TypeScript Type

```typescript
/**
 * Type of proof used to establish filiation of an illegitimate child.
 * Maps 1:1 to Rust `FiliationProof` enum (types.rs:111–118).
 *
 * Relevant only for `IllegitimateChild` heirs. The engine uses the
 * `filiation_proved: boolean` flag (not this value) to gate eligibility
 * (step1_classify.rs:178). This field is informational — it drives the
 * output narrative (step10_finalize.rs:191–213) and is carried through
 * to the Heir record.
 *
 * JSON serialization: PascalCase string matching Rust variant names.
 */
export type FiliationProof =
  | "BirthCertificate"
  | "FinalJudgment"
  | "PublicDocumentAdmission"
  | "PrivateHandwrittenAdmission"
  | "OpenContinuousPossession"
  | "OtherEvidence";
```

## Zod Schema

```typescript
import { z } from "zod";

/**
 * Zod schema for the FiliationProof enum.
 *
 * Validation constraints:
 * - Values must match exact Rust variant names (PascalCase).
 *   Origin: serde Serialize/Deserialize derives on enum (types.rs:110)
 * - Used as `filiation_proof_type: FiliationProofSchema.nullable()` on PersonSchema.
 * - Required (non-null) when `relationship === "IllegitimateChild"` AND
 *   `filiation_proved === true` — enforced via PersonSchema superRefine,
 *   not here. Engine only checks the boolean, but frontend requires a
 *   selection for UI completeness.
 */
export const FiliationProofSchema = z.enum([
  "BirthCertificate",
  "FinalJudgment",
  "PublicDocumentAdmission",
  "PrivateHandwrittenAdmission",
  "OpenContinuousPossession",
  "OtherEvidence",
]);
// Origin: types.rs:111–118 — FC Art. 172, FC Art. 176
```

## Variant Reference Table

| Variant (JSON string) | UI Label | FC Article | Description from Engine |
|---|---|---|---|
| `"BirthCertificate"` | Record of Birth (Civil Register) | Art. 172(1) | "record of birth in the civil register (Art. 172(1), FC)" |
| `"FinalJudgment"` | Final Court Judgment | Art. 172(1) | "final judgment establishing filiation (Art. 172(1), FC)" |
| `"PublicDocumentAdmission"` | Admission in Public Document | Art. 172(2) | "admission of filiation in a public document (Art. 172(2), FC)" |
| `"PrivateHandwrittenAdmission"` | Private Handwritten Admission | Art. 172(2) | "private handwritten instrument signed by the parent (Art. 172(2), FC)" |
| `"OpenContinuousPossession"` | Open & Continuous Possession of Status | Art. 172(3) | "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)" |
| `"OtherEvidence"` | Other Evidence (Rules of Court) | Art. 172(4) | "evidence as provided by the Rules of Court (Art. 172(4), FC)" |

Source: `step10_finalize.rs:191–213` (`filiation_description()` function).

## Field Metadata

This enum appears as `filiation_proof_type` on the `Person` sub-form within the Family Tree
wizard step.

| Property | Value |
|----------|-------|
| **Field name** | `filiation_proof_type` |
| **Label** | Type of Filiation Proof |
| **Input type** | `select` (single-value, 6 options) |
| **Default** | `null` |
| **Wizard step** | Family Tree (per-person sub-form) |
| **Conditional visibility** | Show **only when** `relationship_to_decedent === "IllegitimateChild"` AND `filiation_proved === true` |
| **Required** | Yes (UI-enforced when visible; engine only checks the boolean) |
| **Validation error** | "Please select the type of filiation proof" |
| **Legal source** | FC Art. 172 (proofs of filiation), FC Art. 176 (illegitimate filiation) |

## Select Options (ordered for UI)

Ordered from strongest/most common to weakest/most exceptional:

```typescript
export const FILIATION_PROOF_OPTIONS: Array<{
  value: FiliationProof;
  label: string;
  description: string;
  article: string;
}> = [
  {
    value: "BirthCertificate",
    label: "Record of Birth (Civil Register)",
    description: "Birth certificate or civil registry record",
    article: "FC Art. 172(1)",
  },
  {
    value: "FinalJudgment",
    label: "Final Court Judgment",
    description: "Judicial decision establishing filiation",
    article: "FC Art. 172(1)",
  },
  {
    value: "PublicDocumentAdmission",
    label: "Admission in Public Document",
    description: "Parent's admission in a notarized or public document",
    article: "FC Art. 172(2)",
  },
  {
    value: "PrivateHandwrittenAdmission",
    label: "Private Handwritten Instrument",
    description: "Handwritten document signed by the parent acknowledging the child",
    article: "FC Art. 172(2)",
  },
  {
    value: "OpenContinuousPossession",
    label: "Open & Continuous Possession of Status",
    description: "Child publicly treated as illegitimate child by the parent",
    article: "FC Art. 172(3)",
  },
  {
    value: "OtherEvidence",
    label: "Other Evidence (Rules of Court)",
    description: "Any other means allowed by the Rules of Court",
    article: "FC Art. 172(4)",
  },
];
```

## Eligibility Logic (Engine Behavior)

```
// step1_classify.rs:176–205 — check_eligibility()
//
// Art. 887 ¶3: illegitimate child must have filiation duly proved.
//
// Engine ONLY checks filiation_proved: bool.
// filiation_proof_type is NOT validated by the engine for eligibility.
//
// Result:
//   IllegitimateChild + filiation_proved: false  →  is_eligible = false
//   IllegitimateChild + filiation_proved: true   →  is_eligible = true (assuming other gates pass)
//   All other relationships                       →  filiation_proved is irrelevant
```

The `filiation_proof_type` is carried through to the internal `Heir` struct
(`step1_classify.rs:79`) and used exclusively in Step 10 to generate
per-heir narrative text.

## Conditional Visibility Logic

```typescript
// In the Person sub-form within the Family Tree step:

const showFiliationFields =
  person.relationship_to_decedent === "IllegitimateChild";

const showFiliationProofType =
  showFiliationFields && person.filiation_proved === true;

// UI layout:
// [IllegitimateChild selected]
//   → show: filiation_proved toggle (label: "Filiation proven?")
//     [filiation_proved = true]
//       → show: filiation_proof_type select (label: "Type of Filiation Proof")
```

## Relation to filiation_proved Boolean

The `Person` struct has two separate fields that work in tandem:

```typescript
// On Person:
filiation_proved: boolean;         // gates eligibility (engine checks this)
filiation_proof_type: FiliationProof | null;  // drives narrative (informational)
```

| `filiation_proved` | `filiation_proof_type` | Meaning | Engine result |
|---|---|---|---|
| `true` | `"BirthCertificate"` | Strongest proof | Eligible |
| `true` | `"OtherEvidence"` | Weakest proof | Eligible |
| `true` | `null` | Proof asserted but type unknown | Eligible (but no narrative detail) |
| `false` | `null` | No proof | **Ineligible** (Art. 887 ¶3) |
| `false` | `"BirthCertificate"` | Contradictory — UI should prevent | Ineligible (engine checks bool) |

Frontend should prevent the last case by clearing `filiation_proof_type` when
`filiation_proved` is set to `false`.

## Test Case Evidence

From `examples/cases/09-ic-only.json` (3 illegitimate children):
```json
{"id":"ic1","filiation_proved":true,"filiation_proof_type":"BirthCertificate",...}
{"id":"ic2","filiation_proved":true,"filiation_proof_type":"FinalJudgment",...}
{"id":"ic3","filiation_proved":true,"filiation_proof_type":"BirthCertificate",...}
```

From `examples/cases/03-2lc-1ic.json` (mixed LC + IC):
```json
{"id":"ic1","filiation_proved":true,"filiation_proof_type":"BirthCertificate",...}
```

From `examples/cases/18-ic-spouse.json` (IC + spouse):
```json
{"id":"ic1","filiation_proved":true,"filiation_proof_type":"BirthCertificate",...}
```

Pattern: legitimate children always have `filiation_proof_type: null`; illegitimate
children always have an explicit proof type in practice.

## Rust → TS Mapping Notes

| Rust | TypeScript | JSON | Notes |
|------|-----------|------|-------|
| `FiliationProof::BirthCertificate` | `"BirthCertificate"` | `"BirthCertificate"` | PascalCase, matches Rust variant name |
| `FiliationProof::FinalJudgment` | `"FinalJudgment"` | `"FinalJudgment"` | |
| `FiliationProof::PublicDocumentAdmission` | `"PublicDocumentAdmission"` | `"PublicDocumentAdmission"` | |
| `FiliationProof::PrivateHandwrittenAdmission` | `"PrivateHandwrittenAdmission"` | `"PrivateHandwrittenAdmission"` | |
| `FiliationProof::OpenContinuousPossession` | `"OpenContinuousPossession"` | `"OpenContinuousPossession"` | |
| `FiliationProof::OtherEvidence` | `"OtherEvidence"` | `"OtherEvidence"` | |
| `Option<FiliationProof>` | `FiliationProof \| null` | `null` or string | null for non-IC heirs |

Serialization: Rust `#[derive(Serialize, Deserialize)]` with no `serde(rename_all)` attribute
produces PascalCase variant names verbatim (types.rs:110).
