# Zod Schemas — Philippine Inheritance Engine v2

**Aspect**: zod-schemas
**Wave**: 5b (Frontend Data Model)
**Depends On**: typescript-types, serde-wire-format, rust-types

---

## Overview

Strict Zod v3 schemas for every type that crosses the WASM boundary. These schemas are the
runtime enforcement layer for the type system defined in `typescript-types.md` and the wire
contract defined in `serde-wire-format.md`.

### Global Rules

| Rule | Spec |
|------|------|
| Unknown fields on input | `z.object({}).strict()` — throws on unknown keys |
| Unknown fields on output | `z.object({})` (no `.strict()`) — forward-compatible |
| Booleans | `z.boolean()` — NOT `z.coerce.boolean()` |
| Numbers | `z.number()` — NOT `z.coerce.number()` |
| Option\<T\> in serde | `z.nullable(T_schema)` — NOT `z.optional()` |
| Enum variants | `z.enum([...])` with PascalCase string literals |
| Arrays (Vec\<T\>) | `z.array(T_schema)` |
| Dates | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` |
| Fractions | `z.string().regex(/^-?\d+\/[1-9]\d*$/)` |
| IDs | `z.string()` |

**Why `z.nullable()` not `z.optional()`**: The serde-wire-format mandates that every
`Option<T>` field is always present in JSON as `null` (never absent). `z.optional()` accepts
an absent key (maps to `undefined`). `z.nullable()` accepts `null` but rejects `undefined`.
Using `z.optional()` here would allow undefined to pass through, masking wire format bugs.

**Why `.strict()` on input schemas only**: Input types carry `#[serde(deny_unknown_fields)]`
in Rust. The Zod `.strict()` mirrors this at the JavaScript layer — it catches typos and
stale fields before they reach the WASM boundary. Output types do NOT use `.strict()` to
allow the engine to add new output fields in future without breaking the frontend.

---

## §1. Primitive Schemas

```typescript
import { z } from "zod";

// ── Semantic wrappers ──────────────────────────────────────────────────────────

/** ISO-8601 date string: "YYYY-MM-DD" */
export const DateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  "Must be ISO-8601 date (YYYY-MM-DD)"
);

/** Rational fraction: "numer/denom" reduced to lowest terms, denom > 0 */
export const FractionStringSchema = z.string().regex(
  /^-?\d+\/[1-9]\d*$/,
  'Must be fraction string "numer/denom" with positive denominator'
);

/** Opaque ID string (64 char limit recommended) */
export const IdSchema = z.string().min(1).max(64);

// ── Money ──────────────────────────────────────────────────────────────────────

/**
 * InputMoney: centavos accepts number OR string (BigInt support for large estates).
 * Uses .strict() because Money is an input struct with deny_unknown_fields.
 */
export const InputMoneySchema = z.object({
  centavos: z.union([z.number().int(), z.string().regex(/^-?\d+$/, "centavos string must be integer")]),
}).strict();

/**
 * OutputMoney: centavos is always a number on output.
 * No .strict() — output types are forward-compatible.
 */
export const OutputMoneySchema = z.object({
  centavos: z.number().int(),
});
```

---

## §2. Input Enum Schemas

All enum schemas use `z.enum([...])` with the exact PascalCase wire values.

```typescript
// ── HeirType ───────────────────────────────────────────────────────────────────
export const HeirTypeSchema = z.enum([
  "LegitimateChild",
  "LegitimatedChild",
  "AdoptedChild",
  "IllegitimateChild",
  "LegitimateAscendant",
  "Spouse",
  "Sibling",
  "NieceNephew",
  "OtherCollateral",
]);

// ── LegalSeparationStatus ──────────────────────────────────────────────────────
export const LegalSeparationStatusSchema = z.enum([
  "NotApplicable",
  "InnocentSpouse",
  "GuiltySpouse",
]);

// ── DisinheritanceGround (22 grounds) ─────────────────────────────────────────
export const DisinheritanceGroundSchema = z.enum([
  // Art. 919 — against children/descendants
  "Art919_1", "Art919_2", "Art919_3", "Art919_4",
  "Art919_5", "Art919_6", "Art919_7", "Art919_8",
  // Art. 920 — against parents/ascendants
  "Art920_1", "Art920_2", "Art920_3", "Art920_4",
  "Art920_5", "Art920_6", "Art920_7", "Art920_8",
  // Art. 921 — against surviving spouse
  "Art921_1", "Art921_2", "Art921_3", "Art921_4",
  "Art921_5", "Art921_6",
]);

// ── SubstitutionType ──────────────────────────────────────────────────────────
export const SubstitutionTypeSchema = z.enum([
  "Simple",
  "Fideicommissary",
  "Reciprocal",
]);
```

---

## §3. Output Enum Schemas

```typescript
// ── SuccessionType ────────────────────────────────────────────────────────────
export const SuccessionTypeSchema = z.enum([
  "Testate",
  "Intestate",
  "Mixed",
]);

// ── ScenarioCode (30 variants) ────────────────────────────────────────────────
export const ScenarioCodeSchema = z.enum([
  "T1",  "T2",  "T3",  "T4",  "T5",
  "T6",  "T7",  "T8",  "T9",  "T10",
  "T11", "T12", "T13", "T14", "T15",
  "I1",  "I2",  "I3",  "I4",  "I5",
  "I6",  "I7",  "I8",  "I9",  "I10",
  "I11", "I12", "I13", "I14", "I15",
]);

// ── EffectiveGroup ─────────────────────────────────────────────────────────────
// Full PascalCase names as serialized by the Rust engine (not shorthand "G1"–"G4")
export const EffectiveGroupSchema = z.enum([
  "LegitimateChildGroup",
  "LegitimateAscendantGroup",
  "SurvivingSpouseGroup",
  "IllegitimateChildGroup",
  "CollateralGroup",
]);

// ── ExclusionReason ────────────────────────────────────────────────────────────
// NOTE: Uses rust-types granular variant names (not simplified serde-wire-format §4.7 names).
// Reconcile in cross-layer-consistency aspect.
export const ExclusionReasonSchema = z.enum([
  "PredeceaseNoRepresentation",
  "Unworthiness",
  "FiliationNotProved",
  "GuiltySpouseLegalSeparation",
  "AdoptionRescinded",
  "ValidDisinheritance",
  "Renounced",
  "ExcludedByGroup",
]);

// ── RepresentationTrigger ─────────────────────────────────────────────────────
// NOTE: Uses "IllegitimateTransmission" (rust-types), not "Art902IllegitimateLine"
// (serde-wire-format §4.8). Reconcile in cross-layer-consistency aspect.
export const RepresentationTriggerSchema = z.enum([
  "Predecease",
  "Disinheritance",
  "Unworthiness",
  "IllegitimateTransmission",
]);

// ── VacancyCause ──────────────────────────────────────────────────────────────
// NOTE: Uses rust-types granular variants (not simplified serde-wire-format §4.9).
export const VacancyCauseSchema = z.enum([
  "Predecease",
  "Renunciation",
  "Unworthiness",
  "Disinheritance",
  "SubstitutePredeceased",
  "SubstituteIncapacitated",
]);

// ── ShareSource ───────────────────────────────────────────────────────────────
export const ShareSourceSchema = z.enum([
  "Legitime",
  "FreePortion",
  "Intestate",
  "Devise",
  "Legacy",
]);

// ── ResolutionMethod ──────────────────────────────────────────────────────────
// NOTE: Uses rust-types granular variants (not simplified serde-wire-format §4.10).
export const ResolutionMethodSchema = z.enum([
  "Substitution",
  "Representation",
  "AccretionFreePortion",
  "AccretionIntestate",
  "OwnRightLegitime",
  "IntestateFallback",
  "NextDegreeInOwnRight",
  "Escheat",
]);
```

---

## §4. Tagged Union (Discriminated Union) Schemas

These schemas use `z.discriminatedUnion()` when the discriminant is a simple literal field.
They fall back to `z.union([z.object({...}), ...])` when variant shapes differ significantly.

```typescript
// ── PreteritionEffect ──────────────────────────────────────────────────────────
// Rust: #[serde(tag = "type")] #[serde(rename_all = "PascalCase")]
export const PreteritionEffectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("None") }),
  z.object({
    type: z.literal("InstitutionAnnulled"),
    preterited_heir_ids: z.array(z.string()),
  }),
]);

// ── ValidationWarning ──────────────────────────────────────────────────────────
// Rust: #[serde(tag = "code", content = "data")]
// Note: adjacently-tagged enums use z.discriminatedUnion on the tag field,
// but Zod's discriminatedUnion requires the discriminant to be on the outer object.
// The adjacently-tagged form wraps data in a separate "data" key.
export const ValidationWarningSchema = z.discriminatedUnion("code", [
  z.object({
    code: z.literal("PreteritionDetected"),
    data: z.object({ preterited_heir_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("InvalidDisinheritance"),
    data: z.object({ heir_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("ConditionStripped"),
    data: z.object({ disposition_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("Underprovision"),
    data: z.object({
      heir_id: z.string(),
      deficiency_centavos: z.number().int(),
    }),
  }),
  z.object({
    code: z.literal("InoficiousnessReduced"),
    data: z.object({ total_reduced_centavos: z.number().int() }),
  }),
  z.object({
    code: z.literal("ReconciliationVoided"),
    data: z.object({ heir_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("PosthumousHeirPossible"),
    data: z.object({}),
  }),
  z.object({
    code: z.literal("AnnuityChoiceRequired"),
    data: z.object({ devise_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("IndivisibleRealty"),
    data: z.object({ devise_ids: z.array(z.string()) }),
  }),
  z.object({
    code: z.literal("MultipleDisinheritances"),
    data: z.object({ count: z.number().int().min(2) }),
  }),
]);

// ── ManualReviewFlag ───────────────────────────────────────────────────────────
// Rust: #[serde(tag = "flag")] — internally tagged, additional fields inline
export const ManualReviewFlagSchema = z.discriminatedUnion("flag", [
  z.object({
    flag: z.literal("AllDescendantsDisinherited"),
    heir_ids: z.array(z.string()),
  }),
  z.object({
    flag: z.literal("DisinheritedWithSubstituteAndReps"),
    heir_id: z.string(),
  }),
  z.object({ flag: z.literal("PosthumousChildPossible") }),
  z.object({
    flag: z.literal("UsufructElectionRequired"),
    devise_id: z.string(),
  }),
  z.object({
    flag: z.literal("IndivisibleRealtyPartition"),
    devise_id: z.string(),
  }),
  z.object({
    flag: z.literal("ReconciliationPreWill"),
    heir_id: z.string(),
  }),
  z.object({
    flag: z.literal("LegitimationContested"),
    heir_id: z.string(),
  }),
]);

// ── ComputationError ───────────────────────────────────────────────────────────
// Rust: #[serde(tag = "error_type")] — returned as Err(String) of compute_json
export const ComputationErrorSchema = z.discriminatedUnion("error_type", [
  z.object({
    error_type: z.literal("InputValidation"),
    message: z.string(),
    field_path: z.nullable(z.string()),
  }),
  z.object({
    error_type: z.literal("DomainValidation"),
    message: z.string(),
    related_heir_ids: z.array(z.string()),
  }),
  z.object({
    error_type: z.literal("MaxRestartsExceeded"),
    restart_count: z.number().int().nonnegative(),
    last_step: z.string(),
  }),
  z.object({
    error_type: z.literal("ArithmeticError"),
    message: z.string(),
  }),
  z.object({
    error_type: z.literal("PanicRecovered"),
    message: z.string(),
  }),
]);
```

---

## §5. Input Struct Schemas

All use `.strict()` to mirror `#[serde(deny_unknown_fields)]`.

```typescript
// ── DisinheritanceRecord ───────────────────────────────────────────────────────
export const DisinheritanceRecordSchema = z.object({
  id: z.string(),
  heir_id: z.string(),
  ground: DisinheritanceGroundSchema,
  cause_proven: z.boolean(),       // NOT z.coerce.boolean()
  reconciled: z.boolean(),         // NOT z.coerce.boolean()
  note: z.nullable(z.string()),
}).strict();

// ── SubstitutionInput ──────────────────────────────────────────────────────────
export const SubstitutionInputSchema = z.object({
  id: z.string(),
  primary_heir_id: z.string(),
  substitute_heir_id: z.string(),
  substitution_type: SubstitutionTypeSchema,
  conditions: z.array(z.unknown()),  // ConditionInput — forward-compatible
}).strict();

// ── HeirInput (recursive via z.lazy) ─────────────────────────────────────────
// Forward declaration for recursive type (children: HeirInput[])
export type HeirInputType = {
  id: string;
  name: string;
  heir_type: z.infer<typeof HeirTypeSchema>;
  is_alive: boolean;
  is_adopted: boolean;
  adoption_rescinded: boolean;
  adoption_date: string | null;
  adoption_rescission_date: string | null;
  cause_proven: boolean;
  reconciled: boolean;
  filiation_proved: boolean;
  has_renounced: boolean;
  is_unworthy: boolean;
  unworthiness_condoned: boolean;
  is_legitimated: boolean;
  paternal_line: boolean;
  degree: number | null;
  is_full_blood: boolean;
  biological_parent_is_adopter_spouse: boolean;
  date_of_birth: string | null;
  date_of_death: string | null;
  disinheritances: z.infer<typeof DisinheritanceRecordSchema>[];
  substitutions: z.infer<typeof SubstitutionInputSchema>[];
  children: HeirInputType[];
  donations_received: string[];
  legal_separation_status: z.infer<typeof LegalSeparationStatusSchema>;
};

export const HeirInputSchema: z.ZodType<HeirInputType> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    heir_type: HeirTypeSchema,

    // ── Eligibility Gate Flags ─────────────────────────────────────────────
    is_alive: z.boolean(),
    is_adopted: z.boolean(),
    adoption_rescinded: z.boolean(),
    adoption_date: z.nullable(DateStringSchema),
    adoption_rescission_date: z.nullable(DateStringSchema),
    cause_proven: z.boolean(),
    reconciled: z.boolean(),
    filiation_proved: z.boolean(),
    has_renounced: z.boolean(),
    is_unworthy: z.boolean(),
    unworthiness_condoned: z.boolean(),

    // ── Classification Metadata ───────────────────────────────────────────
    is_legitimated: z.boolean(),
    paternal_line: z.boolean(),
    degree: z.nullable(z.number().int().min(2).max(5)),
    is_full_blood: z.boolean(),
    biological_parent_is_adopter_spouse: z.boolean(),

    // ── Date Fields ───────────────────────────────────────────────────────
    date_of_birth: z.nullable(DateStringSchema),
    date_of_death: z.nullable(DateStringSchema),

    // ── Disposition Records ───────────────────────────────────────────────
    disinheritances: z.array(DisinheritanceRecordSchema),
    substitutions: z.array(SubstitutionInputSchema),

    // ── Family Tree (recursive) ───────────────────────────────────────────
    children: z.array(z.lazy(() => HeirInputSchema)),

    // ── Collation Linkage ─────────────────────────────────────────────────
    donations_received: z.array(z.string()),

    // ── Legal Separation ──────────────────────────────────────────────────
    legal_separation_status: LegalSeparationStatusSchema,
  }).strict()
);

// ── InstitutionInput ──────────────────────────────────────────────────────────
export const InstitutionInputSchema = z.object({
  id: z.string(),
  heir_id: z.string(),
  fraction: z.nullable(FractionStringSchema),
  amount_centavos: z.nullable(z.number().int()),
  description: z.nullable(z.string()),
}).strict();

// ── DeviseInput ───────────────────────────────────────────────────────────────
export const DeviseInputSchema = z.object({
  id: z.string(),
  description: z.string(),
  value: InputMoneySchema,
  beneficiary_heir_id: z.nullable(z.string()),
  conditions: z.array(z.unknown()),  // ConditionInput — forward-compatible
}).strict();

// ── LegacyInput (same shape as DeviseInput) ───────────────────────────────────
export const LegacyInputSchema = z.object({
  id: z.string(),
  description: z.string(),
  value: InputMoneySchema,
  beneficiary_heir_id: z.nullable(z.string()),
  conditions: z.array(z.unknown()),
}).strict();

// ── WillInput ─────────────────────────────────────────────────────────────────
export const WillInputSchema = z.object({
  id: z.string(),
  date_executed: z.nullable(DateStringSchema),
  institutions: z.array(InstitutionInputSchema),
  devises: z.array(DeviseInputSchema),
  legacies: z.array(LegacyInputSchema),
  substitutions: z.array(SubstitutionInputSchema),
}).strict();

// ── DonationInput ─────────────────────────────────────────────────────────────
export const DonationInputSchema = z.object({
  id: z.string(),
  donor_id: z.nullable(z.string()),
  recipient_heir_id: z.nullable(z.string()),
  amount: InputMoneySchema,
  date: z.nullable(DateStringSchema),
  is_collatable: z.boolean(),
  donor_expressly_exempted: z.boolean(),
  heir_renounced: z.boolean(),
  type: z.string(),                     // Free text or DonationType enum label
  description: z.nullable(z.string()),
  professional_expense_imputed_savings_centavos: z.nullable(z.number().int()),
}).strict();

// ── EstateInput ───────────────────────────────────────────────────────────────
export const EstateInputSchema = z.object({
  net_estate: InputMoneySchema,
  gross_estate: z.nullable(InputMoneySchema),
  obligations: z.nullable(InputMoneySchema),
  description: z.nullable(z.string()),
}).strict();

// ── DecedentInput ─────────────────────────────────────────────────────────────
export const DecedentInputSchema = z.object({
  name: z.string().min(1),
  date_of_death: z.nullable(DateStringSchema),
  has_will: z.boolean(),
  has_legitimate_children: z.boolean(),
  has_illegitimate_children: z.boolean(),
  legal_separation_status: LegalSeparationStatusSchema,
  is_illegitimate: z.boolean(),
  articulo_mortis: z.boolean(),
  cohabitation_years: z.number().int().min(0),
  domicile: z.nullable(z.string()),
  nationality: z.nullable(z.string()),
}).strict();

// ── ComputationInput (root input schema) ─────────────────────────────────────
export const ComputationInputSchema = z.object({
  decedent: DecedentInputSchema,
  estate: EstateInputSchema,
  heirs: z.array(HeirInputSchema),
  will: z.nullable(WillInputSchema),
  donations: z.nullable(z.array(DonationInputSchema)),
}).strict();
```

---

## §6. Output Struct Schemas

Output schemas do NOT use `.strict()`. They use `z.object({})` only.

```typescript
// ── RepresentationChain ────────────────────────────────────────────────────────
export const RepresentationChainSchema = z.object({
  representative_heir_id: z.string(),
  represented_heir_id: z.string(),
  trigger: RepresentationTriggerSchema,
  per_stirpes_fraction: z.nullable(FractionStringSchema),
  depth: z.number().int().nonnegative(),
});

// ── RoundingAdjustment ─────────────────────────────────────────────────────────
export const RoundingAdjustmentSchema = z.object({
  heir_id: z.string(),
  adjustment_centavos: z.number().int(),
  reason: z.string(),
  fractional_remainder: FractionStringSchema,
});

// ── HeirDistribution ──────────────────────────────────────────────────────────
export const HeirDistributionSchema = z.object({
  heir_id: z.string(),
  heir_name: z.string(),
  heir_type: HeirTypeSchema,
  effective_group: z.nullable(EffectiveGroupSchema),
  is_excluded: z.boolean(),
  exclusion_reason: z.nullable(ExclusionReasonSchema),
  legitime_centavos: z.number().int().nonnegative(),
  free_portion_centavos: z.number().int().nonnegative(),
  total_centavos: z.number().int().nonnegative(),
  share_source: ShareSourceSchema,
  per_stirpes_fraction: z.nullable(FractionStringSchema),
  representation: z.nullable(RepresentationChainSchema),
  per_heir_fraction: z.nullable(FractionStringSchema),
  partition_notes: z.nullable(z.string()),
});

// ── LegitimeEntry ─────────────────────────────────────────────────────────────
export const LegitimeEntrySchema = z.object({
  heir_id: z.string(),
  heir_type: HeirTypeSchema,
  legitime_centavos: z.number().int().nonnegative(),
  fraction: FractionStringSchema,
  collation_charged_centavos: z.number().int().nonnegative(),
  net_legitime_centavos: z.number().int().nonnegative(),
});

// ── LegitimeResult ────────────────────────────────────────────────────────────
export const LegitimeResultSchema = z.object({
  scenario_code: ScenarioCodeSchema,
  total_legitime_centavos: z.number().int().nonnegative(),
  free_portion_gross_centavos: z.number().int().nonnegative(),
  free_portion_disposable_centavos: z.number().int().nonnegative(),
  entries: z.array(LegitimeEntrySchema),
  art895_cap_applied: z.boolean(),
  art895_ic_cap_centavos: z.nullable(z.number().int().nonnegative()),
});

// ── TestateValidationResult ───────────────────────────────────────────────────
export const TestateValidationResultSchema = z.object({
  preterition_effect: PreteritionEffectSchema,
  valid_disinheritances: z.array(z.string()),
  invalid_disinheritances: z.array(z.string()),
  inofficiousness_reduced_centavos: z.number().int().nonnegative(),
  underprovisions: z.array(z.object({
    heir_id: z.string(),
    deficiency_centavos: z.number().int().nonnegative(),
  })),
  requires_restart: z.boolean(),
});

// ── ImputationResult ──────────────────────────────────────────────────────────
export const ImputationResultSchema = z.object({
  donation_id: z.string(),
  heir_id: z.string(),
  charged_to_legitime_centavos: z.number().int().nonnegative(),
  charged_to_free_portion_centavos: z.number().int().nonnegative(),
  collation_value_centavos: z.number().int().nonnegative(),
});

// ── DonationReduction ─────────────────────────────────────────────────────────
export const DonationReductionSchema = z.object({
  donation_id: z.string(),
  original_centavos: z.number().int().nonnegative(),
  reduced_by_centavos: z.number().int().nonnegative(),
  final_centavos: z.number().int().nonnegative(),
  reason: z.string(),
});

// ── CollationResult ───────────────────────────────────────────────────────────
export const CollationResultSchema = z.object({
  adjusted_estate_centavos: z.number().int().nonnegative(),
  collatable_sum_centavos: z.number().int().nonnegative(),
  imputations: z.array(ImputationResultSchema),
  art911_reductions: z.array(DonationReductionSchema),
});

// ── VacancyResolution ─────────────────────────────────────────────────────────
export const VacancyResolutionSchema = z.object({
  vacant_heir_id: z.string(),
  vacancy_cause: VacancyCauseSchema,
  share_source: ShareSourceSchema,
  vacant_centavos: z.number().int().nonnegative(),
  resolution_method: ResolutionMethodSchema,
  beneficiary_heir_ids: z.array(z.string()),
  triggers_restart: z.boolean(),
});

// ── ComputationLogEntry ───────────────────────────────────────────────────────
export const ComputationLogEntrySchema = z.object({
  step: z.string(),
  description: z.string(),
  restart_count: z.number().int().nonnegative(),
  timestamp_ms: z.number().int().nonnegative(),
  details: z.nullable(z.unknown()),
});

// ── ComputationOutput (root output schema) ────────────────────────────────────
export const ComputationOutputSchema = z.object({
  scenario_code: ScenarioCodeSchema,
  succession_type: SuccessionTypeSchema,
  net_distributable_estate: OutputMoneySchema,
  adjusted_estate: OutputMoneySchema,
  free_portion_gross: OutputMoneySchema,
  free_portion_disposable: OutputMoneySchema,
  distributions: z.array(HeirDistributionSchema),
  rounding_adjustments: z.array(RoundingAdjustmentSchema),
  warnings: z.array(ValidationWarningSchema),
  manual_review_flags: z.array(ManualReviewFlagSchema),
  testate_validation: z.nullable(TestateValidationResultSchema),
  collation: z.nullable(CollationResultSchema),
  vacancy_resolutions: z.array(VacancyResolutionSchema),
  computation_log: z.array(ComputationLogEntrySchema),
});
```

---

## §7. Compute Result Schema (WASM Bridge Response)

```typescript
/**
 * ComputeResult — the full discriminated union returned by the useWasmCompute hook.
 * The WASM compute_json function returns Ok(json_string) or Err(json_string).
 * The bridge parses both branches.
 */
export const ComputeResultSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: ComputationOutputSchema,
  }),
  z.object({
    ok: z.literal(false),
    error: ComputationErrorSchema,
  }),
]);

export type ComputeResult = z.infer<typeof ComputeResultSchema>;
```

---

## §8. Inferred TypeScript Types from Schemas

Zod inference gives us runtime-backed types. These supplement (do not replace) the hand-authored
types in `typescript-types.md`. The inferred types will exactly match what the schemas accept.

```typescript
// Input types
export type ComputationInput     = z.infer<typeof ComputationInputSchema>;
export type DecedentInput        = z.infer<typeof DecedentInputSchema>;
export type EstateInput          = z.infer<typeof EstateInputSchema>;
export type HeirInput            = HeirInputType;  // recursive, manually declared above
export type DisinheritanceRecord = z.infer<typeof DisinheritanceRecordSchema>;
export type WillInput            = z.infer<typeof WillInputSchema>;
export type InstitutionInput     = z.infer<typeof InstitutionInputSchema>;
export type DeviseInput          = z.infer<typeof DeviseInputSchema>;
export type LegacyInput          = z.infer<typeof LegacyInputSchema>;
export type SubstitutionInput    = z.infer<typeof SubstitutionInputSchema>;
export type DonationInput        = z.infer<typeof DonationInputSchema>;
export type InputMoney           = z.infer<typeof InputMoneySchema>;

// Enum types
export type HeirType              = z.infer<typeof HeirTypeSchema>;
export type DisinheritanceGround  = z.infer<typeof DisinheritanceGroundSchema>;
export type LegalSeparationStatus = z.infer<typeof LegalSeparationStatusSchema>;
export type SubstitutionType      = z.infer<typeof SubstitutionTypeSchema>;
export type ScenarioCode          = z.infer<typeof ScenarioCodeSchema>;
export type SuccessionType        = z.infer<typeof SuccessionTypeSchema>;
export type EffectiveGroup        = z.infer<typeof EffectiveGroupSchema>;
export type ExclusionReason       = z.infer<typeof ExclusionReasonSchema>;
export type RepresentationTrigger = z.infer<typeof RepresentationTriggerSchema>;
export type VacancyCause          = z.infer<typeof VacancyCauseSchema>;
export type ShareSource           = z.infer<typeof ShareSourceSchema>;
export type ResolutionMethod      = z.infer<typeof ResolutionMethodSchema>;

// Output types
export type ComputationOutput     = z.infer<typeof ComputationOutputSchema>;
export type HeirDistribution      = z.infer<typeof HeirDistributionSchema>;
export type LegitimeResult        = z.infer<typeof LegitimeResultSchema>;
export type CollationResult       = z.infer<typeof CollationResultSchema>;
export type VacancyResolution     = z.infer<typeof VacancyResolutionSchema>;
export type ComputationLogEntry   = z.infer<typeof ComputationLogEntrySchema>;
export type RoundingAdjustment    = z.infer<typeof RoundingAdjustmentSchema>;
export type ComputationError      = z.infer<typeof ComputationErrorSchema>;
export type ValidationWarning     = z.infer<typeof ValidationWarningSchema>;
export type ManualReviewFlag      = z.infer<typeof ManualReviewFlagSchema>;
export type PreteritionEffect     = z.infer<typeof PreteritionEffectSchema>;
```

---

## §9. Usage Patterns

### 9.1 Validating WASM input before calling compute_json

```typescript
import { ComputationInputSchema, ComputationErrorSchema, ComputationOutputSchema } from "./schemas";
import { ensureWasmInitialized, getWasmModule } from "./wasm/bridge";

export async function compute(raw: unknown): Promise<ComputeResult> {
  // 1. Validate input — throws ZodError with field-level messages on failure
  const input = ComputationInputSchema.parse(raw);

  // 2. Ensure WASM is loaded
  await ensureWasmInitialized();
  const wasm = getWasmModule();

  // 3. Call engine
  const resultJson = wasm.compute_json(JSON.stringify(input));

  // 4. Parse result — the engine returns JSON-encoded Ok or Err
  const parsed = JSON.parse(resultJson);

  // 5. Discriminate on the ok field set by the bridge wrapper
  if (parsed.ok === true) {
    return { ok: true, data: ComputationOutputSchema.parse(parsed.data) };
  } else {
    return { ok: false, error: ComputationErrorSchema.parse(parsed.error) };
  }
}
```

### 9.2 Safe parse with user-facing error messages

```typescript
import { z } from "zod";
import { ComputationInputSchema } from "./schemas";

export function validateComputationInput(raw: unknown): {
  success: true; data: ComputationInput
} | {
  success: false; errors: { path: string; message: string }[]
} {
  const result = ComputationInputSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map(issue => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
```

### 9.3 Default value helpers for form initialization

```typescript
/** Build a default HeirInput with all required fields set to safe defaults */
export function makeDefaultHeirInput(overrides: Partial<HeirInput> = {}): HeirInput {
  return HeirInputSchema.parse({
    id: crypto.randomUUID(),
    name: "",
    heir_type: "LegitimateChild",
    is_alive: true,
    is_adopted: false,
    adoption_rescinded: false,
    adoption_date: null,
    adoption_rescission_date: null,
    cause_proven: false,
    reconciled: false,
    filiation_proved: false,
    has_renounced: false,
    is_unworthy: false,
    unworthiness_condoned: false,
    is_legitimated: false,
    paternal_line: false,
    degree: null,
    is_full_blood: false,
    biological_parent_is_adopter_spouse: false,
    date_of_birth: null,
    date_of_death: null,
    disinheritances: [],
    substitutions: [],
    children: [],
    donations_received: [],
    legal_separation_status: "NotApplicable",
    ...overrides,
  });
}

/** Build a default ComputationInput */
export function makeDefaultComputationInput(): ComputationInput {
  return ComputationInputSchema.parse({
    decedent: {
      name: "",
      date_of_death: null,
      has_will: false,
      has_legitimate_children: false,
      has_illegitimate_children: false,
      legal_separation_status: "NotApplicable",
      is_illegitimate: false,
      articulo_mortis: false,
      cohabitation_years: 0,
      domicile: null,
      nationality: null,
    },
    estate: {
      net_estate: { centavos: 0 },
      gross_estate: null,
      obligations: null,
      description: null,
    },
    heirs: [],
    will: null,
    donations: null,
  });
}
```

---

## §10. Validation Error Messages (per field)

These messages are surfaced directly to the wizard user. Each field carries a custom message
for the most common validation failure.

| Schema | Field | Error Condition | Message |
|--------|-------|-----------------|---------|
| `DecedentInputSchema` | `name` | Empty string | "Decedent name is required" |
| `DecedentInputSchema` | `date_of_death` | Invalid date format | "Date must be YYYY-MM-DD (e.g., 2024-06-15)" |
| `DecedentInputSchema` | `cohabitation_years` | Negative | "Years must be 0 or greater" |
| `HeirInputSchema` | `id` | Empty | "Heir ID must not be empty" |
| `HeirInputSchema` | `degree` | Outside 2–5 | "Collateral degree must be between 2 (sibling) and 5" |
| `HeirInputSchema` | `heir_type` | Unknown variant | "Invalid heir type" |
| `HeirInputSchema` | `adoption_rescission_date` | Non-null when `adoption_rescinded=false` | "Rescission date should only be set if adoption was rescinded" (validated at form level, not Zod) |
| `InputMoneySchema` | `centavos` | Non-integer | "Amount must be a whole number of centavos" |
| `InputMoneySchema` | `centavos` | Non-numeric string | "Amount must be numeric (centavos)" |
| `InstitutionInputSchema` | `fraction` | Invalid format | "Fraction must be 'numer/denom' (e.g., '1/3')" |
| `DisinheritanceRecordSchema` | `ground` | Unknown variant | "Invalid disinheritance ground code" |
| `DateStringSchema` | any date | Pattern mismatch | "Date must be in YYYY-MM-DD format" |
| `FractionStringSchema` | any fraction | Pattern mismatch | "Fraction must be 'numer/denom' with positive denominator" |

**Implementation note**: Use `z.string().min(1, "Decedent name is required")` and similar
chained `.refine()` calls to customize messages at the point of schema definition.

---

## §11. Cross-Layer Discrepancy Notes (for cross-layer-consistency)

The following discrepancies between `serde-wire-format` and `rust-types`/`typescript-types`
need resolution in the `cross-layer-consistency` aspect. The Zod schemas above follow the
`rust-types` analysis as the implementation source of truth for granular output enums.

| Enum | serde-wire-format §4.x | rust-types / typescript-types | Resolution Needed |
|------|------------------------|-------------------------------|-------------------|
| `EffectiveGroup` | `"G1"` through `"G4"` shorthand | Full names `"LegitimateChildGroup"` etc. | Confirm Rust enum variant names → choose canonical wire value |
| `ExclusionReason` | `"Predeceased"`, `"IronCurtain"`, `"NotCalled"` (simplified 8) | Granular 8-variant set | Confirm all 8 are correct; add missing variants to serde-wire-format |
| `RepresentationTrigger` | `"Art902IllegitimateLine"` | `"IllegitimateTransmission"` | Choose one canonical string; update Rust `#[serde(rename)]` or rename variant |
| `VacancyCause` | 6-variant simplified set | `"SubstitutePredeceased"`, `"SubstituteIncapacitated"` (more granular) | Add to serde-wire-format; confirm Rust variants exist |
| `ResolutionMethod` | 5 variants | 8 variants (more granular) | Add granular variants to serde-wire-format table |

Until these are resolved, the Zod schemas above use the `rust-types` / `typescript-types`
variant names, which are the most complete and correct set.

---

## §12. File Layout

```
src/
├── schemas/
│   ├── index.ts          — re-exports all schemas and inferred types
│   ├── primitives.ts     — DateStringSchema, FractionStringSchema, InputMoneySchema, OutputMoneySchema
│   ├── enums.ts          — all enum schemas (HeirTypeSchema, ScenarioCodeSchema, etc.)
│   ├── tagged-unions.ts  — discriminated union schemas (ValidationWarning, ComputationError, etc.)
│   ├── input.ts          — all input struct schemas (ComputationInput and sub-types)
│   ├── output.ts         — all output struct schemas (ComputationOutput and sub-types)
│   └── defaults.ts       — makeDefaultHeirInput(), makeDefaultComputationInput()
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| `.strict()` on input | Yes | Mirrors `#[serde(deny_unknown_fields)]`; catches typos at JS boundary |
| `.strict()` on output | No | Forward-compatible; engine may add new output fields in future |
| `z.nullable()` vs `z.optional()` | `z.nullable()` | Option\<T\> is always `null` in wire, never absent; `optional()` allows undefined |
| `z.boolean()` vs `z.coerce.boolean()` | `z.boolean()` | Strict; no string-to-bool coercion (matches serde rule) |
| `z.number()` vs `z.coerce.number()` | `z.number()` | Strict; no string-to-number coercion for non-centavos fields |
| InputMoney centavos | `z.union([z.number().int(), z.string()])` | Matches serde custom deserializer accepting both forms |
| Recursive HeirInput | `z.lazy()` | Required for self-referential `children: HeirInput[]` |
| Tagged union discriminator | `z.discriminatedUnion()` | Better error messages than `z.union()` |
| Fraction validation | Regex `/^-?\d+\/[1-9]\d*$/` | Ensures `numer/denom` format; rejects `1/0`, `"1"`, `""` |
| Date validation | Regex `/^\d{4}-\d{2}-\d{2}$/` | ISO-8601 format only; calendar validity checked at form level |
