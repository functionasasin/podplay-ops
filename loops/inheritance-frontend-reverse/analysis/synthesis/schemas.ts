/**
 * Complete Zod validation schemas for the Philippine Inheritance
 * Distribution Engine frontend.
 *
 * Assembled from Wave 1 analysis of the Rust engine source at
 * ../inheritance-rust-forward/src/types.rs and related pipeline files.
 *
 * Every schema field carries a constraint-origin comment indicating the
 * Rust source file/function or Philippine legal article that enforces it.
 *
 * Dependencies: zod ^3.x
 *
 * Import alongside types.ts — do NOT import types.ts from here; both files
 * are co-generated from the same source analysis and share no runtime deps.
 *
 * Key serialization conventions enforced by these schemas:
 * - Money: { centavos: number | string }  (types.rs:22-85)
 * - Frac:  "numer/denom" string           (fraction.rs:241-264)
 * - Enums: PascalCase strings             (serde derive)
 * - Dates: "YYYY-MM-DD" ISO-8601 strings  (types.rs:18)
 * - Vecs:  T[] arrays, can be []          (serde)
 * - Option<T>: T | null                  (serde)
 */

import { z } from "zod";

// ============================================================================
// Section 1: Primitive Helpers
// ============================================================================

/**
 * ISO-8601 date string: "YYYY-MM-DD".
 * Type alias Date = String in Rust (types.rs:18).
 * Used in Decedent, Adoption, Donation, Will.
 */
// Constraint origin: semantic requirement (dates in these fields must be
// calendar-valid; engine does no date format validation beyond serde string).
export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
  .refine((d) => !isNaN(Date.parse(d)), { message: "Must be a valid calendar date" });

/**
 * Frac serialized as "numer/denom" string.
 * Custom serde at fraction.rs:241-264.
 * Used in ShareSpec::Fraction and DeviseSpec::FractionalInterest.
 *
 * Constraint origin: fraction.rs:247-264 — deserializer parses "n/d",
 * rejects denom=0. Positive fraction enforced by frontend.
 */
export const FracSchema = z
  .string()
  .regex(/^\d+\/\d+$/, { message: 'Fraction must be in "n/d" format, e.g. "1/2"' })
  .refine(
    (s) => {
      const parts = s.split("/");
      return parts[1] !== "0";
    },
    { message: "Denominator cannot be zero" }
  )
  .refine(
    (s) => {
      const [n, d] = s.split("/").map(Number);
      return n >= 0 && d > 0;
    },
    { message: "Fraction must be non-negative (numerator ≥ 0, denominator > 0)" }
  );

/**
 * Frac for fractional interest in a devise property (≤ 1 enforced).
 * Constraint origin: semantic — cannot devise more than 100% of an asset.
 */
export const FractionalInterestFracSchema = FracSchema.refine(
  (s) => {
    const [n, d] = s.split("/").map(Number);
    return n <= d;
  },
  { message: "Fractional interest cannot exceed 100% of the property" }
);

// ============================================================================
// Section 2: Money Schema
// ============================================================================

/**
 * Centavos value — accepts non-negative integer or numeric string.
 * Constraint origin: types.rs:47-70 — custom Deserialize accepts i64 or string.
 * Non-negative enforced by frontend (engine accepts any BigInt, but
 * negative values are nonsensical for estate/donation amounts).
 */
export const CentavosValueSchema = z.union([
  z
    .number()
    .int({ message: "Centavos must be a whole number" })
    .nonnegative({ message: "Amount cannot be negative" }),
  z
    .string()
    .regex(/^\d+$/, { message: "Centavos string must contain only digits" })
    .refine((s) => BigInt(s) >= 0n, { message: "Amount cannot be negative" }),
]);

/**
 * Money: { centavos: number | string }.
 * Constraint origin: types.rs:22-29, custom serde at types.rs:31-70.
 * Frontend displays as pesos (÷100) with ₱ prefix; serializes centavos.
 */
// Mirrors: types.rs:22-29
export const MoneySchema = z.object({
  centavos: CentavosValueSchema,
});

export type MoneyInput = z.input<typeof MoneySchema>;
export type Money = z.infer<typeof MoneySchema>;

// ============================================================================
// Section 3: Enum Schemas
// ============================================================================

/**
 * Relationship enum — 11 variants.
 * Constraint origin: types.rs:95-108.
 * Serializes as PascalCase string (serde derive).
 */
// Mirrors: types.rs:95-108
export const RelationshipSchema = z.enum([
  "LegitimateChild",
  "LegitimatedChild",
  "AdoptedChild",
  "IllegitimateChild",
  "SurvivingSpouse",
  "LegitimateParent",
  "LegitimateAscendant",
  "Sibling",
  "NephewNiece",
  "OtherCollateral",
  "Stranger",
]);
export type Relationship = z.infer<typeof RelationshipSchema>;

/**
 * FiliationProof enum — 6 variants.
 * Constraint origin: types.rs:110-118.
 * Informational — engine checks filiation_proved bool only
 * (step1_classify.rs:178). Type used by step10_finalize.rs for narratives.
 */
// Mirrors: types.rs:110-118
export const FiliationProofSchema = z.enum([
  "BirthCertificate",
  "FinalJudgment",
  "PublicDocumentAdmission",
  "PrivateHandwrittenAdmission",
  "OpenContinuousPossession",
  "OtherEvidence",
]);
export type FiliationProof = z.infer<typeof FiliationProofSchema>;

/**
 * AdoptionRegime enum — 2 variants.
 * Constraint origin: types.rs:121-124.
 * Exact PascalCase serialization: "Ra8552" (not "RA8552").
 */
// Mirrors: types.rs:121-124
export const AdoptionRegimeSchema = z.enum(["Ra8552", "Ra11642"]);
export type AdoptionRegime = z.infer<typeof AdoptionRegimeSchema>;

/**
 * LineOfDescent enum — 2 variants.
 * Constraint origin: types.rs:127-130 (inferred from step5_legitimes.rs:488-493).
 * Required for LegitimateParent and LegitimateAscendant.
 */
// Mirrors: types.rs:127-130
export const LineOfDescentSchema = z.enum(["Paternal", "Maternal"]);
export type LineOfDescent = z.infer<typeof LineOfDescentSchema>;

/**
 * BloodType enum — 2 variants.
 * Constraint origin: types.rs:166-170.
 * Used in step7_distribute.rs:817 for collateral distribution (Art. 1006).
 * CRITICAL: Sibling with null blood_type silently excluded (step7:820).
 */
// Mirrors: types.rs:166-170
export const BloodTypeSchema = z.enum(["Full", "Half"]);
export type BloodType = z.infer<typeof BloodTypeSchema>;

/**
 * ConditionType enum — 3 variants.
 * Constraint origin: types.rs:181-185.
 * Not consumed by condition-stripping logic — all conditions stripped equally
 * (step6_validation.rs:741-745 maps ALL conditions regardless of type).
 */
// Mirrors: types.rs:181-185
export const ConditionTypeSchema = z.enum(["Suspensive", "Resolutory", "Modal"]);
export type ConditionType = z.infer<typeof ConditionTypeSchema>;

/**
 * ConditionStatus enum — 4 variants.
 * Constraint origin: types.rs:188-193.
 * Informational — not consumed by condition-stripping (step6_validation.rs:741).
 */
// Mirrors: types.rs:188-193
export const ConditionStatusSchema = z.enum([
  "Pending",
  "Fulfilled",
  "Failed",
  "NotApplicable",
]);
export type ConditionStatus = z.infer<typeof ConditionStatusSchema>;

/**
 * SubstitutionType enum — 3 variants.
 * Constraint origin: types.rs:196-200.
 * Engine does NOT differentiate by type in try_substitution
 * (step9_vacancy.rs:594-601). Informational only.
 */
// Mirrors: types.rs:196-200
export const SubstitutionTypeSchema = z.enum([
  "Simple",
  "Reciprocal",
  "Fideicommissary",
]);
export type SubstitutionType = z.infer<typeof SubstitutionTypeSchema>;

/**
 * SubstitutionTrigger enum — 3 variants.
 * Constraint origin: types.rs:203-207.
 * Engine does NOT filter by trigger (step9_vacancy.rs:594-601). Informational.
 * Convention from test helper (step9_vacancy.rs:903-907): specify all three.
 */
// Mirrors: types.rs:203-207
export const SubstitutionTriggerSchema = z.enum([
  "Predecease",
  "Renunciation",
  "Incapacity",
]);
export type SubstitutionTrigger = z.infer<typeof SubstitutionTriggerSchema>;

/**
 * FideicommissaryValidationResult enum — 3 variants.
 * Constraint origin: types.rs:210-214.
 * NOT consumed by any current pipeline step. Forward-looking type.
 */
// Mirrors: types.rs:210-214
export const FideicommissaryValidationResultSchema = z.enum([
  "Valid",
  "Invalid",
  "PartialValid",
]);
export type FideicommissaryValidationResult = z.infer<
  typeof FideicommissaryValidationResultSchema
>;

/**
 * DisinheritanceCause enum — 22 variants, grouped by article.
 * Constraint origin: types.rs:217-243.
 * Art. 919 (8 causes) → children/descendants ("Child" prefix).
 * Art. 920 (8 causes) → parents/ascendants ("Parent" prefix).
 * Art. 921 (6 causes) → spouse ("Spouse" prefix).
 */
// Mirrors: types.rs:217-243
export const DisinheritanceCauseSchema = z.enum([
  // Art. 919 — Children/descendants
  "ChildAttemptOnLife",
  "ChildGroundlessAccusation",
  "ChildAdulteryWithSpouse",
  "ChildFraudUndueInfluence",
  "ChildRefusalToSupport",
  "ChildMaltreatment",
  "ChildDishonorableLife",
  "ChildCivilInterdiction",
  // Art. 920 — Parents/ascendants
  "ParentAbandonmentCorruption",
  "ParentAttemptOnLife",
  "ParentGroundlessAccusation",
  "ParentAdulteryWithSpouse",
  "ParentFraudUndueInfluence",
  "ParentLossParentalAuthority",
  "ParentRefusalToSupport",
  "ParentAttemptOnOther",
  // Art. 921 — Spouse
  "SpouseAttemptOnLife",
  "SpouseGroundlessAccusation",
  "SpouseFraudUndueInfluence",
  "SpouseCauseLegalSeparation",
  "SpouseLossParentalAuthority",
  "SpouseRefusalToSupport",
]);
export type DisinheritanceCause = z.infer<typeof DisinheritanceCauseSchema>;

// ============================================================================
// Section 4: Adoption Schema
// ============================================================================

/**
 * Adoption struct schema.
 * Constraint origin: types.rs:333-342.
 * Conditionally required on Person when relationship = "AdoptedChild".
 * Missing adoption record → ineligible (step1_classify.rs:188-189).
 * is_rescinded = true → ineligible (RA 8552 Sec. 20, step1_classify.rs:182-186).
 */
// Mirrors: types.rs:333-342
export const AdoptionSchema = z
  .object({
    // types.rs:334 — ISO-8601 Date string
    decree_date: DateSchema,

    // types.rs:335 — AdoptionRegime enum
    regime: AdoptionRegimeSchema,

    // types.rs:336 — PersonId (non-empty string; should auto-fill to decedent.id)
    adopter: z.string().min(1, { message: "Adopter ID is required" }),

    // types.rs:337 — PersonId (non-empty string; should auto-fill to Person.id)
    adoptee: z.string().min(1, { message: "Adoptee ID is required" }),

    // types.rs:338 — bool; stepparent adoption flag
    is_stepparent_adoption: z.boolean(),

    // types.rs:339 — Option<PersonId>; must reference SurvivingSpouse in family_tree
    // Constraint origin: step1_classify.rs:87-90 — engine records biological parent/spouse
    biological_parent_spouse: z.string().nullable(),

    // types.rs:340 — bool; RA 8552 Sec. 20 (step1_classify.rs:182-186)
    is_rescinded: z.boolean(),

    // types.rs:341 — Option<Date>; required when is_rescinded = true
    rescission_date: DateSchema.nullable(),
  })
  .superRefine((val, ctx) => {
    // Cross-field: biological_parent_spouse required when stepparent adoption
    // Constraint origin: step1_classify.rs:87-90 — engine uses biological_parent_spouse
    if (val.is_stepparent_adoption && !val.biological_parent_spouse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["biological_parent_spouse"],
        message: "Biological parent/spouse must be specified for stepparent adoptions",
      });
    }

    // Cross-field: rescission_date required when rescinded
    // Constraint origin: RA 8552 Sec. 20 (step1_classify.rs:182-186) — for audit trail
    if (val.is_rescinded && !val.rescission_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescission_date"],
        message: "Rescission date is required when adoption is rescinded",
      });
    }

    // Cross-field: rescission_date must be after decree_date (logical ordering)
    if (val.is_rescinded && val.rescission_date && val.decree_date) {
      if (val.rescission_date <= val.decree_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rescission_date"],
          message: "Rescission date must be after the adoption decree date",
        });
      }
    }
  });

export type Adoption = z.infer<typeof AdoptionSchema>;

// ============================================================================
// Section 5: Condition & Substitute Schemas
// ============================================================================

/**
 * Condition struct schema.
 * Constraint origin: types.rs:432-436.
 * Consumed by step6_validation.rs:708-766 (Check 5: Art. 872 condition stripping).
 * Primary consumed field is `description` — all conditions on compulsory
 * heir's legitime are stripped regardless of type/status.
 */
// Mirrors: types.rs:432-436
export const ConditionSchema = z.object({
  // types.rs:433 — ConditionType enum; all types treated equally by engine
  condition_type: ConditionTypeSchema,

  // types.rs:434 — String; PRIMARY consumed field for condition stripping
  // step6_validation.rs:741-745 maps c.description for all conditions
  description: z
    .string()
    .min(1, { message: "Condition description is required" })
    .max(500, { message: "Condition description must be 500 characters or less" }),

  // types.rs:435 — ConditionStatus; informational, not consumed by stripping
  status: ConditionStatusSchema,
});

export type Condition = z.infer<typeof ConditionSchema>;

/**
 * HeirReference struct schema.
 * Constraint origin: types.rs:391-396.
 * Shared across InstitutionOfHeir, Legacy, Devise, Disinheritance, Substitute.
 * person_id = null for strangers/charities not in family_tree.
 * is_collective = true for class designations (engine does not resolve these).
 */
// Mirrors: types.rs:391-396
export const HeirReferenceSchema = z
  .object({
    // types.rs:392 — Option<PersonId>; null for strangers/charities
    person_id: z.string().nullable(),

    // types.rs:393 — String; required for output narratives (step10_finalize.rs)
    name: z.string().min(1, { message: "Heir name is required" }),

    // types.rs:394 — bool; true for class designations ("all my legitimate children")
    is_collective: z.boolean(),

    // types.rs:395 — Option<String>; required when is_collective = true
    class_designation: z.string().nullable(),
  })
  .refine(
    // Constraint origin: logical — class designation required for collective institutions
    (ref) => !ref.is_collective || (ref.class_designation?.trim().length ?? 0) > 0,
    {
      message: "Class designation is required for collective institutions",
      path: ["class_designation"],
    }
  )
  .refine(
    // Constraint origin: logical — collective institutions reference a class, not a person
    (ref) => !ref.is_collective || ref.person_id === null,
    {
      message: "Collective institutions reference a class, not an individual person",
      path: ["person_id"],
    }
  );

export type HeirReference = z.infer<typeof HeirReferenceSchema>;

/**
 * Substitute struct schema.
 * Constraint origin: types.rs:439-443.
 * Consumed by step9_vacancy.rs:568-652 (try_substitution, Art. 859).
 * Engine checks ONLY that substitute_heir.person_id maps to an alive+eligible
 * heir — does NOT check triggers or substitution_type.
 */
// Mirrors: types.rs:439-443
export const SubstituteSchema = z.object({
  // types.rs:440 — SubstitutionType; informational (engine ignores in step9)
  substitution_type: SubstitutionTypeSchema,

  // types.rs:441 — HeirReference; person_id MUST be set for engine resolution
  // (step9_vacancy.rs:595: `if let Some(sub_person_id)` — null silently skipped)
  substitute_heir: HeirReferenceSchema,

  // types.rs:442 — Vec<SubstitutionTrigger>; informational (engine ignores in step9)
  // Convention from step9_vacancy.rs:903-907: specify all three triggers
  triggers: z
    .array(SubstitutionTriggerSchema)
    .min(1, { message: "At least one substitution trigger must be selected" }),
});

export type Substitute = z.infer<typeof SubstituteSchema>;

/**
 * FideicommissarySubstitution struct schema.
 * Constraint origin: types.rs:446-453.
 * NOT consumed by any current pipeline step. Forward-looking type for Arts. 863-870.
 */
// Mirrors: types.rs:446-453
export const FideicommissarySubstitutionSchema = z
  .object({
    fiduciary: HeirReferenceSchema,
    fideicommissary: HeirReferenceSchema,
    // Constraint origin: ShareSpec from types.rs:381-388 (defined below — imported lazily)
    property_scope: z.lazy(() => ShareSpecSchema),
    // Art. 863: fideicommissary substitution must be expressly stated in the will
    is_express: z.boolean(),
    is_valid: z.boolean(),
    invalidity_reason: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    // Art. 863: fiduciary and fideicommissary must be different persons
    if (
      data.fiduciary.person_id &&
      data.fideicommissary.person_id &&
      data.fiduciary.person_id === data.fideicommissary.person_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Fiduciary and fideicommissary must be different persons (Art. 863)",
        path: ["fideicommissary", "person_id"],
      });
    }
  });

export type FideicommissarySubstitution = z.infer<
  typeof FideicommissarySubstitutionSchema
>;

// ============================================================================
// Section 6: ShareSpec Schema
// ============================================================================

/**
 * ShareSpec enum schema — how much of the estate an instituted heir receives.
 * Constraint origin: types.rs:381-388.
 *
 * Serde external tagging:
 * - Unit variants → plain strings: "EqualWithOthers", "EntireEstate",
 *   "EntireFreePort", "Unspecified", "Residuary"
 * - Fraction(Frac) → { "Fraction": "n/d" }
 *   (Frac is "numer/denom" string, NOT {numer, denom} object)
 *
 * Step 7 resolution (step7_distribute.rs:143-151):
 * - Fraction(f) → estate_base × f
 * - EntireEstate → estate_base
 * - EntireFreePort → fp_disposable
 * - EqualWithOthers / Unspecified / Residuary → Frac::zero()
 */
// Mirrors: types.rs:381-388
export const ShareSpecSchema = z.union([
  // Fraction(Frac) variant — externally tagged object
  z.object({ Fraction: FracSchema }),
  z.literal("EqualWithOthers"),
  z.literal("EntireEstate"),
  z.literal("EntireFreePort"),
  z.literal("Unspecified"),
  z.literal("Residuary"),
]);

export type ShareSpec = z.infer<typeof ShareSpecSchema>;

// ============================================================================
// Section 7: LegacySpec & DeviseSpec Schemas
// ============================================================================

/**
 * LegacySpec enum schema — what a legacy comprises.
 * Constraint origin: types.rs:408-413.
 *
 * Serde external tagging:
 * - FixedAmount(Money)  → { "FixedAmount": { centavos: n } }
 * - SpecificAsset(AssetId) → { "SpecificAsset": "asset-id" }
 * - GenericClass(String, Money) → { "GenericClass": ["desc", { centavos: n }] }
 *   NOTE: GenericClass is a TUPLE variant — serializes as 2-element JSON array.
 *
 * Monetary constraints:
 * - FixedAmount: centavos > 0 (step6_validation.rs:resolve_legacy_amount —
 *   zero-value legacies have no effect; warn user)
 * - GenericClass estimated value: centavos > 0 (same origin)
 * - SpecificAsset: resolves to Frac::zero() (step7_distribute.rs:164) —
 *   engine cannot compute monetary value; warn user about appraisal gap
 */
// Mirrors: types.rs:408-413
export const LegacySpecSchema = z.union([
  z
    .object({ FixedAmount: MoneySchema })
    .refine(
      (v) => BigInt(v.FixedAmount.centavos.toString()) > 0n,
      {
        message: "Legacy amount must be greater than ₱0.00",
        path: ["FixedAmount"],
      }
    ),
  z.object({
    SpecificAsset: z
      .string()
      .min(1, { message: "Asset ID is required for SpecificAsset legacy" }),
    // NOTE: engine treats SpecificAsset as Frac::zero (step7:164) — no monetary impact
  }),
  z
    .object({
      GenericClass: z
        .tuple([
          z.string().min(1, { message: "Generic class description is required" }),
          MoneySchema,
        ])
        .refine(
          ([, money]) => BigInt(money.centavos.toString()) > 0n,
          { message: "Estimated value must be greater than ₱0.00" }
        ),
    }),
]);

export type LegacySpec = z.infer<typeof LegacySpecSchema>;

/**
 * DeviseSpec enum schema — what real property a devise comprises.
 * Constraint origin: types.rs:425-429.
 *
 * Serde external tagging:
 * - SpecificProperty(AssetId) → { "SpecificProperty": "asset-id" }
 * - FractionalInterest(AssetId, Frac) → { "FractionalInterest": ["asset-id", "n/d"] }
 *   NOTE: FractionalInterest is a TUPLE variant — serializes as 2-element JSON array.
 *
 * KEY: Both variants resolve to Frac::zero() in engine computation
 * (step7_distribute.rs:164-168, step6_validation.rs:586).
 * Devises have NO monetary impact in the current engine.
 */
// Mirrors: types.rs:425-429
export const DeviseSpecSchema = z.union([
  z.object({
    SpecificProperty: z.string().min(1, { message: "Asset ID is required" }),
  }),
  z.object({
    FractionalInterest: z.tuple([
      z.string().min(1, { message: "Asset ID is required" }),
      // Fractional interest must be ≤ 1 (cannot devise more than 100% of an asset)
      FractionalInterestFracSchema,
    ]),
  }),
]);

export type DeviseSpec = z.infer<typeof DeviseSpecSchema>;

// ============================================================================
// Section 8: Will Dispositions — InstitutionOfHeir, Legacy, Devise, Disinheritance
// ============================================================================

/**
 * InstitutionOfHeir struct schema — primary testamentary disposition.
 * Constraint origin: types.rs:371-378.
 * Pipeline: step6_validation.rs (preterition + Art. 911 reduction),
 * step7_distribute.rs:143-151 (share computation).
 *
 * NOTE: is_residuary = true is the actual residuary trigger (step7:987),
 * NOT ShareSpec::Residuary. Frontend should enforce their coupling.
 * NOTE: At most one institution should have is_residuary = true
 * (enforced at the Will level, not per-institution).
 */
// Mirrors: types.rs:371-378
export const InstitutionOfHeirSchema = z.object({
  // types.rs:372 — DispositionId (= String); wizard-generated, e.g. "inst-1"
  id: z.string().min(1, { message: "Institution ID is required" }),

  // types.rs:373 — HeirReference
  heir: HeirReferenceSchema,

  // types.rs:374 — ShareSpec
  share: ShareSpecSchema,

  // types.rs:375 — Vec<Condition>; can be empty
  conditions: z.array(ConditionSchema).default([]),

  // types.rs:376 — Vec<Substitute>; can be empty
  substitutes: z.array(SubstituteSchema).default([]),

  // types.rs:377 — bool; actual residuary trigger (step7_distribute.rs:987)
  is_residuary: z.boolean().default(false),
});

export type InstitutionOfHeir = z.infer<typeof InstitutionOfHeirSchema>;

/**
 * Legacy struct schema — testamentary gift of personal property or money.
 * Constraint origin: types.rs:399-406.
 * Pipeline: step6_validation.rs (inofficiousness, Art. 911 reduction order),
 * step7_distribute.rs:328-351 (paid from FP after institutions).
 *
 * is_preferred = true → reduced LAST in Art. 911 reduction (Phase 1b).
 * Non-preferred legacies reduced first (Phase 1a) pro rata.
 * (step6_validation.rs:574-632)
 */
// Mirrors: types.rs:399-406
export const LegacySchema = z.object({
  // types.rs:400 — DispositionId; wizard-generated, e.g. "legacy-1"
  id: z.string().min(1, { message: "Legacy ID is required" }),

  // types.rs:401 — HeirReference (legatee)
  legatee: HeirReferenceSchema,

  // types.rs:402 — LegacySpec
  property: LegacySpecSchema,

  // types.rs:403 — Vec<Condition>; can be empty
  conditions: z.array(ConditionSchema).default([]),

  // types.rs:404 — Vec<Substitute>; can be empty
  substitutes: z.array(SubstituteSchema).default([]),

  // types.rs:405 — bool; Art. 911 ¶2 preferred reduction (step6_validation.rs:580)
  is_preferred: z.boolean().default(false),
});

export type Legacy = z.infer<typeof LegacySchema>;

/**
 * Devise struct schema — testamentary gift of real property.
 * Constraint origin: types.rs:416-423.
 * Both DeviseSpec variants resolve to Frac::zero() in engine computation
 * (step7_distribute.rs:164-168). Devises affect preterition check
 * (step6_validation.rs:841-843) but not monetary calculations.
 */
// Mirrors: types.rs:416-423
export const DeviseSchema = z.object({
  // types.rs:417 — DispositionId; wizard-generated, e.g. "dev-1"
  id: z.string().min(1, { message: "Devise ID is required" }),

  // types.rs:418 — HeirReference (devisee)
  devisee: HeirReferenceSchema,

  // types.rs:419 — DeviseSpec
  property: DeviseSpecSchema,

  // types.rs:420 — Vec<Condition>; can be empty
  conditions: z.array(ConditionSchema).default([]),

  // types.rs:421 — Vec<Substitute>; can be empty
  substitutes: z.array(SubstituteSchema).default([]),

  // types.rs:422 — bool; is_preferred stored but has no current effect (step7:164-168)
  is_preferred: z.boolean().default(false),
});

export type Devise = z.infer<typeof DeviseSchema>;

/**
 * Disinheritance struct schema.
 * Constraint origin: types.rs:456-462.
 * Validity: cause_specified_in_will && cause_proven && !reconciliation_occurred
 * (step1_classify.rs:207-210).
 * Even invalid disinheritances defeat preterition (step6_validation.rs:847-852).
 * Disinheritance enables representation for descendants (step2_lines.rs:176-178).
 */
// Mirrors: types.rs:456-462
export const DisinheritanceSchema = z.object({
  // types.rs:457 — HeirReference; person_id required (cannot disinherit strangers)
  // Constraint origin: step1_classify.rs:53-55 matches on person_id
  heir_reference: HeirReferenceSchema.refine(
    (ref) =>
      ref.person_id !== null &&
      ref.person_id !== undefined &&
      ref.person_id !== "",
    {
      message: "Disinherited heir must reference a person in the family tree",
      path: ["person_id"],
    }
  ),

  // types.rs:458 — DisinheritanceCause; must match heir relationship group
  // (Art. 919 for children, Art. 920 for parents, Art. 921 for spouse)
  // Constraint origin: types.rs:217-243; cross-validation frontend-only
  cause_code: DisinheritanceCauseSchema,

  // types.rs:459 — bool; Art. 916: cause must be specified in the will
  // step6_validation.rs:383
  cause_specified_in_will: z.boolean(),

  // types.rs:460 — bool; Art. 917: cause must be proven if contested
  // step6_validation.rs:385
  cause_proven: z.boolean(),

  // types.rs:461 — bool; Art. 922: reconciliation nullifies disinheritance
  // step6_validation.rs:387
  reconciliation_occurred: z.boolean(),
});

export type Disinheritance = z.infer<typeof DisinheritanceSchema>;

// ============================================================================
// Section 9: Will Schema
// ============================================================================

/**
 * Will struct schema.
 * Constraint origin: types.rs:362-368.
 * In EngineInput: will is Will | null (Option<Will>).
 * - null → intestate succession (step3_scenario.rs:53-58)
 * - present → testate succession, Step 6 validation runs
 *
 * All four Vec fields are required in JSON (even when []).
 * date_executed cross-validation against decedent.date_of_death is
 * enforced at EngineInput level (see EngineInputSchema superRefine).
 */
// Mirrors: types.rs:362-368
export const WillSchema = z.object({
  // types.rs:363 — Vec<InstitutionOfHeir>; can be []
  institutions: z.array(InstitutionOfHeirSchema),

  // types.rs:364 — Vec<Legacy>; can be []
  legacies: z.array(LegacySchema),

  // types.rs:365 — Vec<Devise>; can be []
  devises: z.array(DeviseSchema),

  // types.rs:366 — Vec<Disinheritance>; can be []
  disinheritances: z.array(DisinheritanceSchema),

  // types.rs:367 — Date (ISO-8601); Art. 838: will must predate death
  // Engine does NOT validate date_executed vs date_of_death.
  // Frontend cross-validates in EngineInputSchema.superRefine below.
  date_executed: DateSchema,
});

export type Will = z.infer<typeof WillSchema>;

// ============================================================================
// Section 10: Donation Schema
// ============================================================================

/**
 * Donation struct schema.
 * Constraint origin: types.rs:467-487.
 * Pipeline: step4_estate_base.rs:156-301 (collatability 11-flag decision tree),
 * step6_validation.rs:674-697 (Phase 3 reverse-chronological reduction),
 * step8_collation.rs:106-218 (imputation against heir entitlement).
 *
 * Money values in centavos. Art. 1071: valued at TIME OF DONATION, not death.
 * 11 exemption flags control collatability — mutual exclusion enforced below.
 */
// Mirrors: types.rs:467-487
export const DonationSchema = z
  .object({
    // types.rs:468 — DonationId (= String); auto-generated by frontend
    id: z.string().min(1, { message: "Donation ID is required" }),

    // types.rs:469 — Option<HeirId>; null when recipient_is_stranger = true
    // Cross-validated below: null ↔ stranger, non-null ↔ family member
    recipient_heir_id: z.string().nullable(),

    // types.rs:470 — bool; stranger donations ALWAYS collatable, charged to FP
    // Art. 909 ¶2, step4_estate_base.rs:81-92
    recipient_is_stranger: z.boolean().default(false),

    // types.rs:471 — Money; must be > 0; Art. 1071: valued at time of donation
    value_at_time_of_donation: MoneySchema.refine(
      (m) => BigInt(m.centavos.toString()) > 0n,
      { message: "Donation value must be greater than zero" }
    ),

    // types.rs:472 — Date; used for Phase 3 reverse-chronological reduction
    // step6_validation.rs:680 — sorted by date descending (most recent reduced first)
    // Cross-validated against decedent.date_of_death in EngineInputSchema
    date: DateSchema,

    // types.rs:473 — String; informational only, not consumed by pipeline
    description: z.string().default(""),

    // ── Exemption / Special-Category Flags ────────────────────────────────
    // Engine checks these in priority order (step4_estate_base.rs:156-301).
    // First match wins. Frontend enforces mutual exclusion via superRefine.

    // Art. 1062 (step4:265-268): expressly exempt from collation but still
    // checked for inofficiousness (still_check_inofficiousness = true).
    is_expressly_exempt: z.boolean().default(false),

    // Art. 1067 (step4:196-198): support/education/medical — fully exempt
    is_support_education_medical: z.boolean().default(false),

    // Art. 1067 (step4:196-198): customary/ordinary gift — fully exempt
    is_customary_gift: z.boolean().default(false),

    // Art. 1068 (step4:234-257): professional/vocational education
    // Conditionally collatable (see professional_expense_parent_required)
    is_professional_expense: z.boolean().default(false),

    // Art. 1068 (step4:235-237): parent was legally required to provide
    // Only relevant when is_professional_expense = true
    professional_expense_parent_required: z.boolean().default(false),

    // Art. 1068 (step4:239-247): imputed savings deducted from collatable amount
    // collatable = value - imputed_savings
    // Only relevant when is_professional_expense AND parent_required = true
    professional_expense_imputed_savings: MoneySchema.nullable().default(null),

    // Art. 1072 (step4:220-231): joint donation from both parents — half collatable
    is_joint_from_both_parents: z.boolean().default(false),

    // Art. 1066 (step4:201-203): given to child's spouse only — fully exempt
    is_to_child_spouse_only: z.boolean().default(false),

    // Art. 1066 ¶2 (step4:206-217): joint gift to child + spouse — half collatable
    is_joint_to_child_and_spouse: z.boolean().default(false),

    // Art. 1070 (step4:261-263): wedding gift — exempt but inofficiousness checked
    is_wedding_gift: z.boolean().default(false),

    // Art. 1069 (step4:276-289): payment of child's debt — ALWAYS collatable
    is_debt_payment_for_child: z.boolean().default(false),

    // Art. 1069 (step4:276-289): election campaign expense — ALWAYS collatable
    is_election_expense: z.boolean().default(false),

    // Art. 1069 (step4:276-289): payment of child's fine — ALWAYS collatable
    is_fine_payment: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Cross-field: recipient_is_stranger ↔ recipient_heir_id mutual exclusion
    // Constraint origin: step4_estate_base.rs:81-126 (three-way branch)
    if (data.recipient_is_stranger && data.recipient_heir_id !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stranger donation cannot have a recipient heir ID",
        path: ["recipient_heir_id"],
      });
    }
    if (!data.recipient_is_stranger && data.recipient_heir_id === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non-stranger donation must specify a recipient heir",
        path: ["recipient_heir_id"],
      });
    }

    // Cross-field: professional_expense sub-fields only relevant when
    // is_professional_expense = true (step4:234-257)
    if (!data.is_professional_expense) {
      if (data.professional_expense_parent_required) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Parent-required flag only applies to professional expenses",
          path: ["professional_expense_parent_required"],
        });
      }
      if (data.professional_expense_imputed_savings !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Imputed savings only applies to professional expenses",
          path: ["professional_expense_imputed_savings"],
        });
      }
    }

    // Cross-field: imputed_savings only relevant when parent_required = true
    // (step4:239-247)
    if (
      data.is_professional_expense &&
      !data.professional_expense_parent_required &&
      data.professional_expense_imputed_savings !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Imputed savings only applies when parent was required to provide education",
        path: ["professional_expense_imputed_savings"],
      });
    }

    // Mutual exclusion: only one special category flag should be active at a time
    // Constraint origin: step4_estate_base.rs:156-301 — first-match-wins priority;
    // multiple active flags produce technically valid but ambiguous results
    const specialFlags = [
      data.is_support_education_medical,
      data.is_customary_gift,
      data.is_professional_expense,
      data.is_to_child_spouse_only,
      data.is_joint_to_child_and_spouse,
      data.is_joint_from_both_parents,
      data.is_wedding_gift,
      data.is_debt_payment_for_child,
      data.is_election_expense,
      data.is_fine_payment,
    ].filter(Boolean).length;

    if (specialFlags > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one donation category flag should be active at a time",
        path: ["is_support_education_medical"],
      });
    }
  });

export type Donation = z.infer<typeof DonationSchema>;

// ============================================================================
// Section 11: Person Schema
// ============================================================================

/**
 * Person struct schema — core family tree entity.
 * Constraint origin: types.rs:312-330.
 * Classified by step1_classify.rs:42-102 into an Heir.
 * Stranger relationship → no Heir produced (step1_classify.rs:46).
 * Dead persons still classified; step2_lines.rs builds representation lines.
 */
// Mirrors: types.rs:312-330
export const PersonSchema = z
  .object({
    // types.rs:313 — PersonId (= String); unique within case
    id: z
      .string()
      .min(1, { message: "Person ID is required" })
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        { message: "Person ID must be alphanumeric with hyphens/underscores" }
      ),

    // types.rs:314 — String; required, displayed in output narratives
    name: z
      .string()
      .min(1, { message: "Person name is required" })
      .max(200, { message: "Person name too long" }),

    // types.rs:315 — bool; copied to Heir.is_alive (step1_classify.rs:76)
    is_alive_at_succession: z.boolean(),

    // types.rs:316 — Relationship; determines HeirCategory classification
    relationship_to_decedent: RelationshipSchema,

    // types.rs:317 — i32; 1-5 range
    // Art. 1010: collaterals beyond 5th degree cannot inherit (step7:957)
    degree: z
      .number()
      .int({ message: "Degree must be a whole number" })
      .min(1, { message: "Degree must be at least 1" })
      .max(5, {
        message: "Collaterals beyond 5th degree cannot inherit (Art. 1010)",
      }),

    // types.rs:318 — Option<LineOfDescent>; required for parent/ascendant
    // step5_legitimes.rs:488-493 uses for paternal/maternal split
    line: LineOfDescentSchema.nullable(),

    // types.rs:319 — Vec<PersonId>; IDs of children in family_tree
    // step2_lines.rs:235 uses for representation line-building
    children: z.array(z.string().min(1, { message: "Child ID must not be empty" })),

    // types.rs:320 — bool; CRITICAL gate for IllegitimateChild eligibility
    // step1_classify.rs:178, Art. 887 ¶3: false → INELIGIBLE
    filiation_proved: z.boolean(),

    // types.rs:321 — Option<FiliationProof>; informational
    // Engine checks filiation_proved bool only (step1_classify.rs:178)
    filiation_proof_type: FiliationProofSchema.nullable(),

    // types.rs:322 — bool; SurvivingSpouse guilt exclusion
    // step1_classify.rs:195, Art. 1002: true → INELIGIBLE for SurvivingSpouse
    is_guilty_party_in_legal_separation: z.boolean(),

    // types.rs:323 — Option<Adoption>; REQUIRED when relationship = "AdoptedChild"
    // step1_classify.rs:188-189: null → INELIGIBLE
    adoption: AdoptionSchema.nullable(),

    // types.rs:324 — bool; Art. 1032: declared unworthy
    // step1_classify.rs:200: true AND !condoned → INELIGIBLE
    is_unworthy: z.boolean(),

    // types.rs:325 — bool; Art. 1033: condonation restores eligibility
    unworthiness_condoned: z.boolean(),

    // types.rs:326 — bool; Art. 977: renunciation NOT a representation trigger
    has_renounced: z.boolean(),

    // types.rs:327 — Option<BloodType>; siblings only
    // step7_distribute.rs:820: null blood_type → SILENTLY EXCLUDED from distribution
    // Art. 1006: Full = 2 units, Half = 1 unit
    blood_type: BloodTypeSchema.nullable(),
  })
  .superRefine((person, ctx) => {
    // Rule 1: IllegitimateChild without filiation proof → ineligible
    // Constraint origin: step1_classify.rs:178, Art. 887 ¶3
    if (
      person.relationship_to_decedent === "IllegitimateChild" &&
      !person.filiation_proved
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Illegitimate child without filiation proof will be ineligible (Art. 887 ¶3)",
        path: ["filiation_proved"],
      });
    }

    // Rule 2: IllegitimateChild with proof should have proof type selected
    if (
      person.relationship_to_decedent === "IllegitimateChild" &&
      person.filiation_proved &&
      person.filiation_proof_type === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select the type of filiation proof",
        path: ["filiation_proof_type"],
      });
    }

    // Rule 3: AdoptedChild requires adoption record
    // Constraint origin: step1_classify.rs:188-189 — null adoption → INELIGIBLE
    if (
      person.relationship_to_decedent === "AdoptedChild" &&
      person.adoption === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adopted child requires an adoption record",
        path: ["adoption"],
      });
    }

    // Rule 4: Sibling must have blood_type
    // Constraint origin: step7_distribute.rs:820 — null → SILENTLY EXCLUDED
    // Art. 1006: full-blood inherits double the share of half-blood
    if (
      person.relationship_to_decedent === "Sibling" &&
      person.blood_type === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Siblings must specify Full or Half blood type (Art. 1006)",
        path: ["blood_type"],
      });
    }

    // Rule 5: LegitimateParent / LegitimateAscendant requires line
    // Constraint origin: step5_legitimes.rs:488-493 — paternal/maternal split
    if (
      (person.relationship_to_decedent === "LegitimateParent" ||
        person.relationship_to_decedent === "LegitimateAscendant") &&
      person.line === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ascendants must specify Paternal or Maternal line",
        path: ["line"],
      });
    }

    // Rule 6: unworthiness_condoned only meaningful when is_unworthy = true
    // Constraint origin: step1_classify.rs:200 (Art. 1033)
    if (!person.is_unworthy && person.unworthiness_condoned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot condone unworthiness if person is not unworthy",
        path: ["unworthiness_condoned"],
      });
    }

    // Rule 7: is_guilty_party_in_legal_separation only for SurvivingSpouse
    // Constraint origin: step1_classify.rs:195 (Art. 1002)
    if (
      person.relationship_to_decedent !== "SurvivingSpouse" &&
      person.is_guilty_party_in_legal_separation
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Legal separation guilt is only applicable to the surviving spouse",
        path: ["is_guilty_party_in_legal_separation"],
      });
    }

    // Rule 8: SurvivingSpouse and LegitimateParent must be degree 1
    // Constraint origin: Civil Code — spouse and parents are 1st-degree relatives
    if (
      (person.relationship_to_decedent === "SurvivingSpouse" ||
        person.relationship_to_decedent === "LegitimateParent") &&
      person.degree !== 1
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${person.relationship_to_decedent} must have degree 1`,
        path: ["degree"],
      });
    }
  });

export type Person = z.infer<typeof PersonSchema>;

// ============================================================================
// Section 12: Decedent Schema
// ============================================================================

/**
 * Decedent struct schema.
 * Constraint origin: types.rs:297-310.
 * Most fields are informational or gate UI visibility.
 * Computation-active fields:
 * - is_illegitimate: step3_scenario.rs:133 → T14/T15 selection (Art. 903)
 * - 4 articulo mortis fields: step1_classify.rs:226-231, step5_legitimes.rs:431-436
 *   → spouse legitime reduced E/2→E/3 in T12 (Art. 900) when ALL 4 hold
 */
// Mirrors: types.rs:297-310
export const DecedentSchema = z
  .object({
    // types.rs:299 — PersonId; always "d" in test cases (auto-generated by frontend)
    id: z.string().min(1, { message: "Decedent ID is required" }),

    // types.rs:300 — String; required for narratives
    name: z.string().min(1, { message: "Decedent name is required" }),

    // types.rs:301 — Date; informational, not consumed by pipeline computation
    date_of_death: DateSchema,

    // types.rs:302 — bool; NOT consumed by pipeline (spouse presence from family_tree)
    // Gates marriage sub-section visibility in wizard
    is_married: z.boolean(),

    // types.rs:303 — Option<Date>; required when is_married = true (frontend only)
    // Engine does not validate this cross-field constraint
    date_of_marriage: DateSchema.nullable(),

    // types.rs:304-307 — 4 articulo mortis fields (Art. 900)
    // All four consumed by is_articulo_mortis() at:
    //   step1_classify.rs:226-231 and step5_legitimes.rs:431-436
    marriage_solemnized_in_articulo_mortis: z.boolean(),
    was_ill_at_marriage: z.boolean(),
    illness_caused_death: z.boolean(),

    // types.rs:307 — i32; threshold < 5 years for articulo mortis reduction
    years_of_cohabitation: z
      .number()
      .int({ message: "Years of cohabitation must be a whole number" })
      .nonnegative({ message: "Years of cohabitation cannot be negative" }),

    // types.rs:308 — bool; NOT consumed by pipeline (exclusion via Person.is_guilty_party)
    // Gates guilty-party question on spouse Person in wizard
    has_legal_separation: z.boolean(),

    // types.rs:309 — bool; step3_scenario.rs:133 → selects T14/T15 (Art. 903)
    is_illegitimate: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Cross-field: date_of_marriage required when married
    // Constraint origin: frontend semantic validation (engine allows null even when married)
    if (data.is_married && data.date_of_marriage === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_of_marriage"],
        message: "Date of marriage is required when decedent was married",
      });
    }
  });

export type Decedent = z.infer<typeof DecedentSchema>;

// ============================================================================
// Section 13: EngineConfig Schema
// ============================================================================

/**
 * EngineConfig struct schema.
 * Constraint origin: types.rs:344-348, Default impl at types.rs:350-357.
 * NOTE: Despite Default impl, serde has no #[serde(default)] on EngineInput —
 * both fields are REQUIRED in the JSON payload.
 *
 * retroactive_ra_11642: NOT consumed by any pipeline step (forward-looking flag).
 * max_pipeline_restarts: consumed at pipeline.rs:131,237 → step9_vacancy.rs:148.
 */
// Mirrors: types.rs:344-348
export const EngineConfigSchema = z.object({
  // types.rs:346 — bool; NOT consumed by current pipeline (forward-looking)
  // Default: false (types.rs:352)
  retroactive_ra_11642: z
    .boolean()
    .default(false)
    .describe("Apply RA 11642 retroactively to RA 8552 adoptions"),

  // types.rs:347 — i32; consumed by step9_vacancy.rs:148 (`restart_count < max_restarts`)
  // Default: 10 (types.rs:353). Must be >= 1 for pipeline to allow any restart.
  // Constraint origin: step9_vacancy.rs:148 — 0 would disable all restarts
  max_pipeline_restarts: z
    .number()
    .int()
    .min(1, { message: "Must allow at least 1 pipeline restart" })
    .max(100, { message: "Unreasonably high restart limit" })
    .default(10)
    .describe("Maximum pipeline restart iterations"),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema>;

// ============================================================================
// Section 14: EngineInput Schema (Top-Level)
// ============================================================================

/**
 * EngineInput struct schema — the complete JSON payload sent to the engine.
 * Constraint origin: types.rs:287-295.
 * All fields required in JSON (no #[serde(default)] on EngineInput).
 *
 * Testate/Intestate determination: will === null → intestate (step3:55-58)
 * Family tree can be [] (escheat scenario).
 * Config must always be present (use defaults if not modified by user).
 */
// Mirrors: types.rs:287-295
export const EngineInputSchema = z
  .object({
    // types.rs:288 — Money; net distributable estate in centavos
    net_distributable_estate: MoneySchema,

    // types.rs:289 — Decedent struct
    decedent: DecedentSchema,

    // types.rs:290 — Vec<Person>; can be []
    family_tree: z.array(PersonSchema),

    // types.rs:291 — Option<Will>; null = intestate
    will: WillSchema.nullable(),

    // types.rs:292 — Vec<Donation>; can be []
    donations: z.array(DonationSchema),

    // types.rs:293 — EngineConfig; required in JSON (no serde default)
    config: EngineConfigSchema,
  })
  .superRefine((input, ctx) => {
    // Cross-field: will.date_executed must be ≤ decedent.date_of_death
    // Constraint origin: Art. 838 Civil Code (will signed after death is void)
    // Engine does NOT enforce this — frontend must.
    if (
      input.will &&
      input.decedent.date_of_death &&
      input.will.date_executed > input.decedent.date_of_death
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["will", "date_executed"],
        message:
          "Will execution date must be on or before date of death (Art. 838)",
      });
    }

    // Cross-field: donation dates should be ≤ decedent.date_of_death
    // Constraint origin: step6_validation.rs:674-697 uses donation dates for
    // Phase 3 reduction ordering; donations after death are invalid
    if (input.decedent.date_of_death) {
      input.donations.forEach((donation, i) => {
        if (donation.date > input.decedent.date_of_death) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["donations", i, "date"],
            message: "Donation date must be on or before date of death",
          });
        }
      });
    }

    // Cross-field: max one SurvivingSpouse in family_tree
    // Constraint origin: Civil Code — bigamy is illegal; only one valid spouse
    const spouseCount = input.family_tree.filter(
      (p) => p.relationship_to_decedent === "SurvivingSpouse"
    ).length;
    if (spouseCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["family_tree"],
        message: "At most one surviving spouse may be in the family tree",
      });
    }

    // Cross-field: InstitutionOfHeir.heir.person_id should reference family_tree
    // Constraint origin: step7_distribute.rs — person_id links to classified heir;
    // unknown person_id → institution not linked to any heir (stranger treatment)
    if (input.will) {
      const personIds = new Set(input.family_tree.map((p) => p.id));
      input.will.institutions.forEach((inst, i) => {
        if (
          inst.heir.person_id !== null &&
          !personIds.has(inst.heir.person_id)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["will", "institutions", i, "heir", "person_id"],
            message: "Institution person_id must reference a person in the family tree",
          });
        }
      });

      // Cross-field: at most one residuary institution
      // Constraint origin: step7_distribute.rs:987 — engine takes first/last found;
      // multiple residuaries produce undefined behavior
      const residuaryCount = input.will.institutions.filter(
        (i) => i.is_residuary
      ).length;
      if (residuaryCount > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["will", "institutions"],
          message: "At most one institution should be marked as residuary",
        });
      }

      // Cross-field: Disinheritance person_id must reference family_tree
      // Constraint origin: step1_classify.rs:53-55 — matches on person_id
      input.will.disinheritances.forEach((d, i) => {
        if (
          d.heir_reference.person_id !== null &&
          !personIds.has(d.heir_reference.person_id)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [
              "will",
              "disinheritances",
              i,
              "heir_reference",
              "person_id",
            ],
            message:
              "Disinherited heir must reference a person in the family tree",
          });
        }
      });
    }

    // Cross-field: Donation.recipient_heir_id should reference family_tree
    // Constraint origin: step4_estate_base.rs:97-113 — unknown_donee warning
    const personIds = new Set(input.family_tree.map((p) => p.id));
    input.donations.forEach((donation, i) => {
      if (
        !donation.recipient_is_stranger &&
        donation.recipient_heir_id !== null &&
        !personIds.has(donation.recipient_heir_id)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["donations", i, "recipient_heir_id"],
          message:
            "Donation recipient must reference a person in the family tree (or mark as stranger)",
        });
      }
    });
  });

export type EngineInput = z.infer<typeof EngineInputSchema>;

// ============================================================================
// Section 15: Engine Output Schemas (for type safety on received data)
// ============================================================================

// Output types are received from the engine — these schemas validate that the
// engine response matches the expected shape before the frontend renders it.
// Constraint origin: types.rs:525-580, step10_finalize.rs:452-623.

/**
 * EffectiveCategory enum schema.
 * Constraint origin: types.rs:142-149.
 * The heir-group category after Step 1 classification normalization.
 */
// Mirrors: types.rs:142-149
export const EffectiveCategorySchema = z.enum([
  "LegitimateChildGroup",
  "IllegitimateChildGroup",
  "SurvivingSpouseGroup",
  "LegitimateAscendantGroup",
  "CollateralGroup",
]);
export type EffectiveCategory = z.infer<typeof EffectiveCategorySchema>;

/**
 * InheritanceMode enum schema.
 * Constraint origin: types.rs:151-155.
 */
// Mirrors: types.rs:151-155
export const InheritanceModeSchema = z.enum(["OwnRight", "Representation"]);
export type InheritanceMode = z.infer<typeof InheritanceModeSchema>;

/**
 * SuccessionType enum schema.
 * Constraint origin: types.rs:173-178.
 */
// Mirrors: types.rs:173-178
export const SuccessionTypeSchema = z.enum([
  "Testate",
  "Intestate",
  "Mixed",
  "IntestateByPreterition",
]);
export type SuccessionType = z.infer<typeof SuccessionTypeSchema>;

/**
 * ScenarioCode enum schema.
 * Constraint origin: types.rs:248-283.
 * Note: T5a and T5b have lowercase letter suffixes.
 */
// Mirrors: types.rs:248-283
export const ScenarioCodeSchema = z.enum([
  "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
  "T9", "T10", "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
  "I9", "I10", "I11", "I12", "I13", "I14", "I15",
]);
export type ScenarioCode = z.infer<typeof ScenarioCodeSchema>;

/**
 * InheritanceShare struct schema — per-heir distribution breakdown.
 * Constraint origin: types.rs:535-551.
 *
 * Key money relationships (step10_finalize.rs):
 * - gross_entitlement = net_from_estate + donations_imputed
 * - PRIMARY display: net_from_estate (actual payout from estate)
 * - from_legitime / from_free_portion / from_intestate currently always 0
 *   (engine TODO in step10_finalize.rs:538-540)
 */
// Mirrors: types.rs:535-551
export const InheritanceShareSchema = z.object({
  heir_id: z.string(),
  heir_name: z.string(),
  heir_category: EffectiveCategorySchema,
  inherits_by: InheritanceModeSchema,
  represents: z.string().nullable(),
  from_legitime: MoneySchema,         // Currently always 0 (engine TODO)
  from_free_portion: MoneySchema,     // Currently always 0 (engine TODO)
  from_intestate: MoneySchema,        // Currently always 0 (engine TODO)
  total: MoneySchema,
  legitime_fraction: z.string(),      // Currently empty string (engine TODO)
  legal_basis: z.array(z.string()),
  donations_imputed: MoneySchema,
  gross_entitlement: MoneySchema,
  net_from_estate: MoneySchema,       // PRIMARY display value
});

export type InheritanceShare = z.infer<typeof InheritanceShareSchema>;

/**
 * HeirNarrative struct schema — plain-English narrative for one heir.
 * Constraint origin: types.rs:553-559.
 * Generated by step10_finalize.rs:358-448.
 * Text may contain Markdown bold markers (**name (category)**).
 */
// Mirrors: types.rs:553-559
export const HeirNarrativeSchema = z.object({
  heir_id: z.string(),
  heir_name: z.string(),
  heir_category_label: z.string(),
  text: z.string(),
});

export type HeirNarrative = z.infer<typeof HeirNarrativeSchema>;

/**
 * StepLog struct schema — a single pipeline step's log entry.
 * Constraint origin: types.rs:568-573.
 */
// Mirrors: types.rs:568-573
export const StepLogSchema = z.object({
  step_number: z.number().int(),
  step_name: z.string(),
  description: z.string(),
});

export type StepLog = z.infer<typeof StepLogSchema>;

/**
 * ComputationLog struct schema — pipeline execution metadata.
 * Constraint origin: types.rs:561-566.
 * Currently only Step 10 is logged (step10_finalize.rs:452-623).
 */
// Mirrors: types.rs:561-566
export const ComputationLogSchema = z.object({
  steps: z.array(StepLogSchema),
  total_restarts: z.number().int(),
  final_scenario: z.string(),
});

export type ComputationLog = z.infer<typeof ComputationLogSchema>;

/**
 * ManualFlag struct schema — warning or manual review flag.
 * Constraint origin: types.rs:575-580.
 * Currently always [] in engine output (step10_finalize.rs:619).
 * Known categories: "unknown_donee", "preterition", "disinheritance",
 * "inofficiousness", "max_restarts", "vacancy_unresolved".
 */
// Mirrors: types.rs:575-580
export const ManualFlagSchema = z.object({
  category: z.string(),
  description: z.string(),
  related_heir_id: z.string().nullable(),
});

export type ManualFlag = z.infer<typeof ManualFlagSchema>;

/**
 * EngineOutput struct schema — complete engine response.
 * Constraint origin: types.rs:525-533.
 * Constructed by step10_finalize.rs:452-623.
 */
// Mirrors: types.rs:525-533
export const EngineOutputSchema = z.object({
  per_heir_shares: z.array(InheritanceShareSchema),
  narratives: z.array(HeirNarrativeSchema),
  computation_log: ComputationLogSchema,
  warnings: z.array(ManualFlagSchema),
  succession_type: SuccessionTypeSchema,
  scenario_code: ScenarioCodeSchema,
});

export type EngineOutput = z.infer<typeof EngineOutputSchema>;

// ============================================================================
// Section 16: Disinheritance Cause Lookup Constants
// ============================================================================

/**
 * Cause codes grouped by heir relationship category.
 * Frontend uses to filter available causes when selecting a disinheritance reason.
 * Constraint origin: types.rs:217-243 (Civil Code article groupings).
 */
export const CHILD_CAUSES = [
  "ChildAttemptOnLife",
  "ChildGroundlessAccusation",
  "ChildAdulteryWithSpouse",
  "ChildFraudUndueInfluence",
  "ChildRefusalToSupport",
  "ChildMaltreatment",
  "ChildDishonorableLife",
  "ChildCivilInterdiction",
] as const satisfies readonly DisinheritanceCause[];

export const PARENT_CAUSES = [
  "ParentAbandonmentCorruption",
  "ParentAttemptOnLife",
  "ParentGroundlessAccusation",
  "ParentAdulteryWithSpouse",
  "ParentFraudUndueInfluence",
  "ParentLossParentalAuthority",
  "ParentRefusalToSupport",
  "ParentAttemptOnOther",
] as const satisfies readonly DisinheritanceCause[];

export const SPOUSE_CAUSES = [
  "SpouseAttemptOnLife",
  "SpouseGroundlessAccusation",
  "SpouseFraudUndueInfluence",
  "SpouseCauseLegalSeparation",
  "SpouseLossParentalAuthority",
  "SpouseRefusalToSupport",
] as const satisfies readonly DisinheritanceCause[];

/**
 * Map from Relationship → allowed DisinheritanceCause array.
 * Engine does NOT cross-validate cause vs relationship — this is frontend-only.
 * Collaterals and strangers have no legitime and cannot be disinherited.
 */
export const CAUSE_BY_RELATIONSHIP: Partial<
  Record<Relationship, readonly DisinheritanceCause[]>
> = {
  LegitimateChild: CHILD_CAUSES,
  LegitimatedChild: CHILD_CAUSES,
  AdoptedChild: CHILD_CAUSES,
  IllegitimateChild: CHILD_CAUSES,
  LegitimateParent: PARENT_CAUSES,
  LegitimateAscendant: PARENT_CAUSES,
  SurvivingSpouse: SPOUSE_CAUSES,
  // Sibling, NephewNiece, OtherCollateral, Stranger → not disinheritable
};

// ============================================================================
// Section 17: Warning Severity Map
// ============================================================================

/**
 * Severity levels for ManualFlag categories in the results view.
 * Maps engine-generated warning categories to UI severity.
 * "error" → red; "warning" → yellow; "info" → blue
 */
export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",           // Art. 854: institutions annulled
  inofficiousness: "warning",     // Arts. 908-912: FP exceeded
  disinheritance: "warning",      // Invalid disinheritance (heir reinstated)
  max_restarts: "error",          // step9_vacancy.rs restart guard hit
  vacancy_unresolved: "warning",  // vacant share could not be resolved
  unknown_donee: "info",          // step4: donation recipient not found
};
