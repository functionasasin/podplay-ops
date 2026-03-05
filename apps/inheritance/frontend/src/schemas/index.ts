/**
 * Zod validation schemas for the Philippine Inheritance Distribution Engine.
 * Source of truth: ../inheritance-frontend-reverse/analysis/synthesis/schemas.ts
 */

import { z } from "zod";

// ============================================================================
// Section 1: Primitive Helpers
// ============================================================================

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" })
  .refine(
    (d) => {
      const [y, m, day] = d.split("-").map(Number) as [number, number, number];
      const date = new Date(y, m - 1, day);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === day
      );
    },
    { message: "Must be a valid calendar date" }
  );

export const FracSchema = z
  .string()
  .regex(/^\d+\/\d+$/, { message: 'Fraction must be in "n/d" format, e.g. "1/2"' })
  .refine(
    (s) => {
      const parts = s.split("/") as [string, string];
      return parts[1] !== "0";
    },
    { message: "Denominator cannot be zero" }
  )
  .refine(
    (s) => {
      const [n, d] = s.split("/").map(Number) as [number, number];
      return n >= 0 && d > 0;
    },
    { message: "Fraction must be non-negative (numerator >= 0, denominator > 0)" }
  );

export const FractionalInterestFracSchema = FracSchema.refine(
  (s) => {
    const [n, d] = s.split("/").map(Number) as [number, number];
    return n <= d;
  },
  { message: "Fractional interest cannot exceed 100% of the property" }
);

// ============================================================================
// Section 2: Money Schema
// ============================================================================

export const CentavosValueSchema = z.union([
  z
    .number()
    .int({ message: "Centavos must be a whole number" })
    .nonnegative({ message: "Amount cannot be negative" }),
  z
    .string()
    .regex(/^\d+$/, { message: "Centavos string must contain only digits" })
    .refine(
      (s) => {
        try {
          return BigInt(s) >= 0n;
        } catch {
          return false;
        }
      },
      { message: "Amount cannot be negative" }
    ),
]);

export const MoneySchema = z.object({
  centavos: CentavosValueSchema,
});

// ============================================================================
// Section 3: Enum Schemas
// ============================================================================

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

export const FiliationProofSchema = z.enum([
  "BirthCertificate",
  "FinalJudgment",
  "PublicDocumentAdmission",
  "PrivateHandwrittenAdmission",
  "OpenContinuousPossession",
  "OtherEvidence",
]);

export const AdoptionRegimeSchema = z.enum(["Ra8552", "Ra11642"]);

export const LineOfDescentSchema = z.enum(["Paternal", "Maternal"]);

export const BloodTypeSchema = z.enum(["Full", "Half"]);

export const ConditionTypeSchema = z.enum(["Suspensive", "Resolutory", "Modal"]);

export const ConditionStatusSchema = z.enum([
  "Pending",
  "Fulfilled",
  "Failed",
  "NotApplicable",
]);

export const SubstitutionTypeSchema = z.enum([
  "Simple",
  "Reciprocal",
  "Fideicommissary",
]);

export const SubstitutionTriggerSchema = z.enum([
  "Predecease",
  "Renunciation",
  "Incapacity",
]);

export const FideicommissaryValidationResultSchema = z.enum([
  "Valid",
  "Invalid",
  "PartialValid",
]);

export const DisinheritanceCauseSchema = z.enum([
  // Art. 919 - Children/descendants
  "ChildAttemptOnLife",
  "ChildGroundlessAccusation",
  "ChildAdulteryWithSpouse",
  "ChildFraudUndueInfluence",
  "ChildRefusalToSupport",
  "ChildMaltreatment",
  "ChildDishonorableLife",
  "ChildCivilInterdiction",
  // Art. 920 - Parents/ascendants
  "ParentAbandonmentCorruption",
  "ParentAttemptOnLife",
  "ParentGroundlessAccusation",
  "ParentAdulteryWithSpouse",
  "ParentFraudUndueInfluence",
  "ParentLossParentalAuthority",
  "ParentRefusalToSupport",
  "ParentAttemptOnOther",
  // Art. 921 - Spouse
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

export const AdoptionSchema = z
  .object({
    decree_date: DateSchema,
    regime: AdoptionRegimeSchema,
    adopter: z.string().min(1, { message: "Adopter ID is required" }),
    adoptee: z.string().min(1, { message: "Adoptee ID is required" }),
    is_stepparent_adoption: z.boolean(),
    biological_parent_spouse: z.string().nullable(),
    is_rescinded: z.boolean(),
    rescission_date: DateSchema.nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.is_stepparent_adoption && !val.biological_parent_spouse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["biological_parent_spouse"],
        message: "Biological parent/spouse must be specified for stepparent adoptions",
      });
    }
    if (val.is_rescinded && !val.rescission_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescission_date"],
        message: "Rescission date is required when adoption is rescinded",
      });
    }
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

// ============================================================================
// Section 5: Condition & Substitute Schemas
// ============================================================================

export const ConditionSchema = z.object({
  condition_type: ConditionTypeSchema,
  description: z
    .string()
    .min(1, { message: "Condition description is required" })
    .max(500, { message: "Condition description must be 500 characters or less" }),
  status: ConditionStatusSchema,
});

export const HeirReferenceSchema = z
  .object({
    person_id: z.string().nullable(),
    name: z.string().min(1, { message: "Heir name is required" }),
    is_collective: z.boolean(),
    class_designation: z.string().nullable(),
  })
  .refine(
    (ref) => !ref.is_collective || (ref.class_designation?.trim().length ?? 0) > 0,
    {
      message: "Class designation is required for collective institutions",
      path: ["class_designation"],
    }
  )
  .refine(
    (ref) => !ref.is_collective || ref.person_id === null,
    {
      message: "Collective institutions reference a class, not an individual person",
      path: ["person_id"],
    }
  );

export const SubstituteSchema = z.object({
  substitution_type: SubstitutionTypeSchema,
  substitute_heir: HeirReferenceSchema,
  triggers: z
    .array(SubstitutionTriggerSchema)
    .min(1, { message: "At least one substitution trigger must be selected" }),
});

export const FideicommissarySubstitutionSchema = z
  .object({
    fiduciary: HeirReferenceSchema,
    fideicommissary: HeirReferenceSchema,
    property_scope: z.lazy(() => ShareSpecSchema),
    is_express: z.boolean(),
    is_valid: z.boolean(),
    invalidity_reason: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
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

// ============================================================================
// Section 6: ShareSpec Schema
// ============================================================================

export const ShareSpecSchema = z.union([
  z.object({ Fraction: FracSchema }),
  z.literal("EqualWithOthers"),
  z.literal("EntireEstate"),
  z.literal("EntireFreePort"),
  z.literal("Unspecified"),
  z.literal("Residuary"),
]);

// ============================================================================
// Section 7: LegacySpec & DeviseSpec Schemas
// ============================================================================

export const LegacySpecSchema = z.union([
  z
    .object({ FixedAmount: MoneySchema })
    .refine(
      (v) => BigInt(v.FixedAmount.centavos.toString()) > 0n,
      {
        message: "Legacy amount must be greater than zero",
        path: ["FixedAmount"],
      }
    ),
  z.object({
    SpecificAsset: z
      .string()
      .min(1, { message: "Asset ID is required for SpecificAsset legacy" }),
  }),
  z.object({
    GenericClass: z
      .tuple([
        z.string().min(1, { message: "Generic class description is required" }),
        MoneySchema,
      ])
      .refine(
        ([, money]) => BigInt(money.centavos.toString()) > 0n,
        { message: "Estimated value must be greater than zero" }
      ),
  }),
]);

export const DeviseSpecSchema = z.union([
  z.object({
    SpecificProperty: z.string().min(1, { message: "Asset ID is required" }),
  }),
  z.object({
    FractionalInterest: z.tuple([
      z.string().min(1, { message: "Asset ID is required" }),
      FractionalInterestFracSchema,
    ]),
  }),
]);

// ============================================================================
// Section 8: Will Dispositions
// ============================================================================

export const InstitutionOfHeirSchema = z.object({
  id: z.string().min(1, { message: "Institution ID is required" }),
  heir: HeirReferenceSchema,
  share: ShareSpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_residuary: z.boolean().default(false),
});

export const LegacySchema = z.object({
  id: z.string().min(1, { message: "Legacy ID is required" }),
  legatee: HeirReferenceSchema,
  property: LegacySpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_preferred: z.boolean().default(false),
});

export const DeviseSchema = z.object({
  id: z.string().min(1, { message: "Devise ID is required" }),
  devisee: HeirReferenceSchema,
  property: DeviseSpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_preferred: z.boolean().default(false),
});

export const DisinheritanceSchema = z.object({
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
  cause_code: DisinheritanceCauseSchema,
  cause_specified_in_will: z.boolean(),
  cause_proven: z.boolean(),
  reconciliation_occurred: z.boolean(),
});

// ============================================================================
// Section 9: Will Schema
// ============================================================================

export const WillSchema = z.object({
  institutions: z.array(InstitutionOfHeirSchema),
  legacies: z.array(LegacySchema),
  devises: z.array(DeviseSchema),
  disinheritances: z.array(DisinheritanceSchema),
  date_executed: DateSchema,
});

// ============================================================================
// Section 10: Donation Schema
// ============================================================================

export const DonationSchema = z
  .object({
    id: z.string().min(1, { message: "Donation ID is required" }),
    recipient_heir_id: z.string().nullable(),
    recipient_is_stranger: z.boolean().default(false),
    value_at_time_of_donation: MoneySchema.refine(
      (m) => BigInt(m.centavos.toString()) > 0n,
      { message: "Donation value must be greater than zero" }
    ),
    date: DateSchema,
    description: z.string().default(""),
    is_expressly_exempt: z.boolean().default(false),
    is_support_education_medical: z.boolean().default(false),
    is_customary_gift: z.boolean().default(false),
    is_professional_expense: z.boolean().default(false),
    professional_expense_parent_required: z.boolean().default(false),
    professional_expense_imputed_savings: MoneySchema.nullable().default(null),
    is_joint_from_both_parents: z.boolean().default(false),
    is_to_child_spouse_only: z.boolean().default(false),
    is_joint_to_child_and_spouse: z.boolean().default(false),
    is_wedding_gift: z.boolean().default(false),
    is_debt_payment_for_child: z.boolean().default(false),
    is_election_expense: z.boolean().default(false),
    is_fine_payment: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
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

// ============================================================================
// Section 11: Person Schema
// ============================================================================

export const PersonSchema = z
  .object({
    id: z
      .string()
      .min(1, { message: "Person ID is required" })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Person ID must be alphanumeric with hyphens/underscores",
      }),
    name: z
      .string()
      .min(1, { message: "Person name is required" })
      .max(200, { message: "Person name too long" }),
    is_alive_at_succession: z.boolean(),
    relationship_to_decedent: RelationshipSchema,
    degree: z
      .number()
      .int({ message: "Degree must be a whole number" })
      .min(1, { message: "Degree must be at least 1" })
      .max(5, {
        message: "Collaterals beyond 5th degree cannot inherit (Art. 1010)",
      }),
    line: LineOfDescentSchema.nullable(),
    children: z.array(z.string().min(1, { message: "Child ID must not be empty" })),
    filiation_proved: z.boolean(),
    filiation_proof_type: FiliationProofSchema.nullable(),
    is_guilty_party_in_legal_separation: z.boolean(),
    adoption: AdoptionSchema.nullable(),
    is_unworthy: z.boolean(),
    unworthiness_condoned: z.boolean(),
    has_renounced: z.boolean(),
    blood_type: BloodTypeSchema.nullable(),
  })
  .superRefine((person, ctx) => {
    // Rule 1: IllegitimateChild without filiation proof
    if (
      person.relationship_to_decedent === "IllegitimateChild" &&
      !person.filiation_proved
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Illegitimate child without filiation proof will be ineligible (Art. 887)",
        path: ["filiation_proved"],
      });
    }

    // Rule 2: IllegitimateChild with proof should have proof type
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
    if (!person.is_unworthy && person.unworthiness_condoned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot condone unworthiness if person is not unworthy",
        path: ["unworthiness_condoned"],
      });
    }

    // Rule 7: is_guilty_party only for SurvivingSpouse
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

// ============================================================================
// Section 12: Decedent Schema
// ============================================================================

export const DecedentSchema = z
  .object({
    id: z.string().min(1, { message: "Decedent ID is required" }),
    name: z.string().min(1, { message: "Decedent name is required" }),
    date_of_death: DateSchema,
    is_married: z.boolean(),
    date_of_marriage: DateSchema.nullable(),
    marriage_solemnized_in_articulo_mortis: z.boolean(),
    was_ill_at_marriage: z.boolean(),
    illness_caused_death: z.boolean(),
    years_of_cohabitation: z
      .number()
      .int({ message: "Years of cohabitation must be a whole number" })
      .nonnegative({ message: "Years of cohabitation cannot be negative" }),
    has_legal_separation: z.boolean(),
    is_illegitimate: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.is_married && data.date_of_marriage === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_of_marriage"],
        message: "Date of marriage is required when decedent was married",
      });
    }
  });

// ============================================================================
// Section 13: EngineConfig Schema
// ============================================================================

export const EngineConfigSchema = z.object({
  retroactive_ra_11642: z.boolean().default(false),
  max_pipeline_restarts: z
    .number()
    .int()
    .min(1, { message: "Must allow at least 1 pipeline restart" })
    .max(100, { message: "Unreasonably high restart limit" })
    .default(10),
});

// ============================================================================
// Section 14: EngineInput Schema (Top-Level)
// ============================================================================

export const EngineInputSchema = z
  .object({
    net_distributable_estate: MoneySchema,
    decedent: DecedentSchema,
    family_tree: z.array(PersonSchema),
    will: WillSchema.nullable(),
    donations: z.array(DonationSchema),
    config: EngineConfigSchema,
  })
  .superRefine((input, ctx) => {
    // will.date_executed must be <= decedent.date_of_death
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

    // Donation dates should be <= decedent.date_of_death
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

    // Max one SurvivingSpouse in family_tree
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

    // Duplicate person IDs
    const seenIds = new Set<string>();
    input.family_tree.forEach((p, i) => {
      if (seenIds.has(p.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["family_tree", i, "id"],
          message: "Duplicate person ID in family tree",
        });
      }
      seenIds.add(p.id);
    });

    // Will cross-validations
    const personIds = new Set(input.family_tree.map((p) => p.id));

    if (input.will) {
      // Institution person_id must reference family_tree
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

      // At most one residuary institution
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

      // Disinheritance person_id must reference family_tree
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

    // Donation recipient_heir_id should reference family_tree
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

// ============================================================================
// Section 15: Output Schemas
// ============================================================================

export const EffectiveCategorySchema = z.enum([
  "LegitimateChildGroup",
  "IllegitimateChildGroup",
  "SurvivingSpouseGroup",
  "LegitimateAscendantGroup",
  "CollateralGroup",
]);

export const InheritanceModeSchema = z.enum(["OwnRight", "Representation"]);

export const SuccessionTypeSchema = z.enum([
  "Testate",
  "Intestate",
  "Mixed",
  "IntestateByPreterition",
]);

export const ScenarioCodeSchema = z.enum([
  "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
  "T9", "T10", "T11", "T12", "T13", "T14", "T15",
  "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
  "I9", "I10", "I11", "I12", "I13", "I14", "I15",
]);

export const InheritanceShareSchema = z.object({
  heir_id: z.string(),
  heir_name: z.string(),
  heir_category: EffectiveCategorySchema,
  inherits_by: InheritanceModeSchema,
  represents: z.string().nullable(),
  from_legitime: MoneySchema,
  from_free_portion: MoneySchema,
  from_intestate: MoneySchema,
  total: MoneySchema,
  legitime_fraction: z.string(),
  legal_basis: z.array(z.string()),
  donations_imputed: MoneySchema,
  gross_entitlement: MoneySchema,
  net_from_estate: MoneySchema,
});

export const HeirNarrativeSchema = z.object({
  heir_id: z.string(),
  heir_name: z.string(),
  heir_category_label: z.string(),
  text: z.string(),
});

export const StepLogSchema = z.object({
  step_number: z.number().int(),
  step_name: z.string(),
  description: z.string(),
});

export const ComputationLogSchema = z.object({
  steps: z.array(StepLogSchema),
  total_restarts: z.number().int(),
  final_scenario: z.string(),
});

export const ManualFlagSchema = z.object({
  category: z.string(),
  description: z.string(),
  related_heir_id: z.string().nullable(),
});

export const EngineOutputSchema = z.object({
  per_heir_shares: z.array(InheritanceShareSchema),
  narratives: z.array(HeirNarrativeSchema),
  computation_log: ComputationLogSchema,
  warnings: z.array(ManualFlagSchema),
  succession_type: SuccessionTypeSchema,
  scenario_code: ScenarioCodeSchema,
});

// ============================================================================
// Section 16: Disinheritance Cause Lookup Constants
// ============================================================================

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
};

// ============================================================================
// Section 17: Warning Severity Map
// ============================================================================

export const WARNING_SEVERITY: Record<string, "error" | "warning" | "info"> = {
  preterition: "error",
  inofficiousness: "warning",
  disinheritance: "warning",
  max_restarts: "error",
  vacancy_unresolved: "warning",
  unknown_donee: "info",
};
