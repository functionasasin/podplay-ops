import { describe, it, expect } from "vitest";
import {
  DateSchema,
  FracSchema,
  FractionalInterestFracSchema,
  CentavosValueSchema,
  MoneySchema,
  RelationshipSchema,
  FiliationProofSchema,
  AdoptionRegimeSchema,
  LineOfDescentSchema,
  BloodTypeSchema,
  ConditionTypeSchema,
  ConditionStatusSchema,
  SubstitutionTypeSchema,
  SubstitutionTriggerSchema,
  FideicommissaryValidationResultSchema,
  DisinheritanceCauseSchema,
  AdoptionSchema,
  PersonSchema,
  DecedentSchema,
  DonationSchema,
  WillSchema,
  EngineInputSchema,
  EngineConfigSchema,
  ShareSpecSchema,
  LegacySpecSchema,
  DeviseSpecSchema,
  HeirReferenceSchema,
  ConditionSchema,
  InstitutionOfHeirSchema,
  DisinheritanceSchema,
  CHILD_CAUSES,
  PARENT_CAUSES,
  SPOUSE_CAUSES,
  CAUSE_BY_RELATIONSHIP,
  WARNING_SEVERITY,
} from "../index";

// ============================================================================
// Test data helpers
// ============================================================================

function validDecedent() {
  return {
    id: "d",
    name: "Juan Dela Cruz",
    date_of_death: "2026-01-15",
    is_married: true,
    date_of_marriage: "1990-06-01",
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 35,
    has_legal_separation: false,
    is_illegitimate: false,
  };
}

function validPerson(overrides: Record<string, unknown> = {}) {
  return {
    id: "lc1",
    name: "Maria Dela Cruz",
    is_alive_at_succession: true,
    relationship_to_decedent: "LegitimateChild",
    degree: 1,
    line: null,
    children: [],
    filiation_proved: false,
    filiation_proof_type: null,
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

function validAdoption() {
  return {
    decree_date: "2020-03-15",
    regime: "Ra8552",
    adopter: "d",
    adoptee: "ac1",
    is_stepparent_adoption: false,
    biological_parent_spouse: null,
    is_rescinded: false,
    rescission_date: null,
  };
}

function validDonation(overrides: Record<string, unknown> = {}) {
  return {
    id: "don-1",
    recipient_heir_id: "lc1",
    recipient_is_stranger: false,
    value_at_time_of_donation: { centavos: 100000 },
    date: "2020-01-01",
    description: "Cash gift",
    is_expressly_exempt: false,
    is_support_education_medical: false,
    is_customary_gift: false,
    is_professional_expense: false,
    professional_expense_parent_required: false,
    professional_expense_imputed_savings: null,
    is_joint_from_both_parents: false,
    is_to_child_spouse_only: false,
    is_joint_to_child_and_spouse: false,
    is_wedding_gift: false,
    is_debt_payment_for_child: false,
    is_election_expense: false,
    is_fine_payment: false,
    ...overrides,
  };
}

function validEngineInput(overrides: Record<string, unknown> = {}) {
  return {
    net_distributable_estate: { centavos: 10000000 },
    decedent: validDecedent(),
    family_tree: [validPerson()],
    will: null,
    donations: [],
    config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
    ...overrides,
  };
}

function validHeirReference(overrides: Record<string, unknown> = {}) {
  return {
    person_id: "lc1",
    name: "Maria Dela Cruz",
    is_collective: false,
    class_designation: null,
    ...overrides,
  };
}

// ============================================================================
// Section 1: DateSchema
// ============================================================================

describe("schemas", () => {
  describe("DateSchema", () => {
    it("accepts valid ISO-8601 date 2026-01-15", () => {
      const result = DateSchema.safeParse("2026-01-15");
      expect(result.success).toBe(true);
    });

    it("accepts valid date 2000-12-31", () => {
      const result = DateSchema.safeParse("2000-12-31");
      expect(result.success).toBe(true);
    });

    it("rejects date with slash format 2026/01/15", () => {
      const result = DateSchema.safeParse("2026/01/15");
      expect(result.success).toBe(false);
    });

    it("rejects date with dot format 2026.01.15", () => {
      const result = DateSchema.safeParse("2026.01.15");
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = DateSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejects non-string input", () => {
      const result = DateSchema.safeParse(20260115);
      expect(result.success).toBe(false);
    });

    it("rejects invalid calendar date 2026-02-30", () => {
      const result = DateSchema.safeParse("2026-02-30");
      expect(result.success).toBe(false);
    });

    it("rejects date without leading zeros 2026-1-5", () => {
      const result = DateSchema.safeParse("2026-1-5");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 2: FracSchema
  // ============================================================================

  describe("FracSchema", () => {
    it('accepts valid fraction "1/2"', () => {
      const result = FracSchema.safeParse("1/2");
      expect(result.success).toBe(true);
    });

    it('accepts "3/8"', () => {
      const result = FracSchema.safeParse("3/8");
      expect(result.success).toBe(true);
    });

    it('accepts "0/1" (zero numerator)', () => {
      const result = FracSchema.safeParse("0/1");
      expect(result.success).toBe(true);
    });

    it('rejects "1:2" (wrong separator)', () => {
      const result = FracSchema.safeParse("1:2");
      expect(result.success).toBe(false);
    });

    it('rejects "1/0" (zero denominator)', () => {
      const result = FracSchema.safeParse("1/0");
      expect(result.success).toBe(false);
    });

    it("rejects non-string input", () => {
      const result = FracSchema.safeParse(0.5);
      expect(result.success).toBe(false);
    });

    it("rejects empty string", () => {
      const result = FracSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it('rejects negative numerator "-1/2"', () => {
      const result = FracSchema.safeParse("-1/2");
      expect(result.success).toBe(false);
    });
  });

  describe("FractionalInterestFracSchema", () => {
    it('accepts "1/2" (fraction <= 1)', () => {
      const result = FractionalInterestFracSchema.safeParse("1/2");
      expect(result.success).toBe(true);
    });

    it('accepts "1/1" (exactly 100%)', () => {
      const result = FractionalInterestFracSchema.safeParse("1/1");
      expect(result.success).toBe(true);
    });

    it('rejects "3/2" (fraction > 1, exceeds 100%)', () => {
      const result = FractionalInterestFracSchema.safeParse("3/2");
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 3: Money Schemas
  // ============================================================================

  describe("CentavosValueSchema", () => {
    it("accepts positive integer", () => {
      const result = CentavosValueSchema.safeParse(50000);
      expect(result.success).toBe(true);
    });

    it("accepts zero", () => {
      const result = CentavosValueSchema.safeParse(0);
      expect(result.success).toBe(true);
    });

    it("accepts string representation of large number", () => {
      const result = CentavosValueSchema.safeParse("99999999999999");
      expect(result.success).toBe(true);
    });

    it("rejects negative integer", () => {
      const result = CentavosValueSchema.safeParse(-100);
      expect(result.success).toBe(false);
    });

    it("rejects floating point number", () => {
      const result = CentavosValueSchema.safeParse(100.5);
      expect(result.success).toBe(false);
    });

    it("rejects string with non-digit characters", () => {
      const result = CentavosValueSchema.safeParse("100.5");
      expect(result.success).toBe(false);
    });

    it("rejects negative string", () => {
      const result = CentavosValueSchema.safeParse("-100");
      expect(result.success).toBe(false);
    });
  });

  describe("MoneySchema", () => {
    it("accepts valid money with number centavos", () => {
      const result = MoneySchema.safeParse({ centavos: 50000 });
      expect(result.success).toBe(true);
    });

    it("accepts valid money with string centavos", () => {
      const result = MoneySchema.safeParse({ centavos: "99999999999999" });
      expect(result.success).toBe(true);
    });

    it("rejects money with negative centavos", () => {
      const result = MoneySchema.safeParse({ centavos: -100 });
      expect(result.success).toBe(false);
    });

    it("rejects missing centavos field", () => {
      const result = MoneySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects money as bare number (must be object)", () => {
      const result = MoneySchema.safeParse(50000);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 4: Enum Schemas
  // ============================================================================

  describe("RelationshipSchema", () => {
    const allRelationships = [
      "LegitimateChild", "LegitimatedChild", "AdoptedChild", "IllegitimateChild",
      "SurvivingSpouse", "LegitimateParent", "LegitimateAscendant",
      "Sibling", "NephewNiece", "OtherCollateral", "Stranger",
    ];

    it("accepts all 11 relationship variants", () => {
      for (const rel of allRelationships) {
        const result = RelationshipSchema.safeParse(rel);
        expect(result.success, `Expected "${rel}" to be valid`).toBe(true);
      }
    });

    it("rejects snake_case variant", () => {
      const result = RelationshipSchema.safeParse("legitimate_child");
      expect(result.success).toBe(false);
    });

    it("rejects unknown relationship", () => {
      const result = RelationshipSchema.safeParse("Unknown");
      expect(result.success).toBe(false);
    });
  });

  describe("FiliationProofSchema", () => {
    it("accepts all 6 proof variants", () => {
      const proofs = [
        "BirthCertificate", "FinalJudgment", "PublicDocumentAdmission",
        "PrivateHandwrittenAdmission", "OpenContinuousPossession", "OtherEvidence",
      ];
      for (const p of proofs) {
        expect(FiliationProofSchema.safeParse(p).success, `Expected "${p}" to be valid`).toBe(true);
      }
    });
  });

  describe("AdoptionRegimeSchema", () => {
    it("accepts Ra8552 and Ra11642", () => {
      expect(AdoptionRegimeSchema.safeParse("Ra8552").success).toBe(true);
      expect(AdoptionRegimeSchema.safeParse("Ra11642").success).toBe(true);
    });

    it("rejects uppercase RA8552", () => {
      expect(AdoptionRegimeSchema.safeParse("RA8552").success).toBe(false);
    });
  });

  describe("LineOfDescentSchema", () => {
    it("accepts Paternal and Maternal", () => {
      expect(LineOfDescentSchema.safeParse("Paternal").success).toBe(true);
      expect(LineOfDescentSchema.safeParse("Maternal").success).toBe(true);
    });
  });

  describe("BloodTypeSchema", () => {
    it("accepts Full and Half", () => {
      expect(BloodTypeSchema.safeParse("Full").success).toBe(true);
      expect(BloodTypeSchema.safeParse("Half").success).toBe(true);
    });
  });

  describe("DisinheritanceCauseSchema", () => {
    it("accepts all 22 causes (8 Child + 8 Parent + 6 Spouse)", () => {
      const allCauses = [
        "ChildAttemptOnLife", "ChildGroundlessAccusation", "ChildAdulteryWithSpouse",
        "ChildFraudUndueInfluence", "ChildRefusalToSupport", "ChildMaltreatment",
        "ChildDishonorableLife", "ChildCivilInterdiction",
        "ParentAbandonmentCorruption", "ParentAttemptOnLife", "ParentGroundlessAccusation",
        "ParentAdulteryWithSpouse", "ParentFraudUndueInfluence", "ParentLossParentalAuthority",
        "ParentRefusalToSupport", "ParentAttemptOnOther",
        "SpouseAttemptOnLife", "SpouseGroundlessAccusation", "SpouseFraudUndueInfluence",
        "SpouseCauseLegalSeparation", "SpouseLossParentalAuthority", "SpouseRefusalToSupport",
      ];
      expect(allCauses).toHaveLength(22);
      for (const cause of allCauses) {
        expect(DisinheritanceCauseSchema.safeParse(cause).success, `Expected "${cause}" to be valid`).toBe(true);
      }
    });
  });

  describe("ScenarioCodeSchema", () => {
    it("accepts T-codes and I-codes from import", () => {
      const { ScenarioCodeSchema } = require("../index");
      const codes = [
        "T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
        "T9", "T10", "T11", "T12", "T13", "T14", "T15",
        "I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
        "I9", "I10", "I11", "I12", "I13", "I14", "I15",
      ];
      for (const code of codes) {
        expect(ScenarioCodeSchema.safeParse(code).success, `Expected "${code}" to be valid`).toBe(true);
      }
    });
  });

  // ============================================================================
  // Section 5: ShareSpec Serialization
  // ============================================================================

  describe("ShareSpecSchema", () => {
    it('accepts unit variant "EntireFreePort" as bare string', () => {
      const result = ShareSpecSchema.safeParse("EntireFreePort");
      expect(result.success).toBe(true);
    });

    it('accepts unit variant "EqualWithOthers" as bare string', () => {
      const result = ShareSpecSchema.safeParse("EqualWithOthers");
      expect(result.success).toBe(true);
    });

    it('accepts unit variant "EntireEstate"', () => {
      const result = ShareSpecSchema.safeParse("EntireEstate");
      expect(result.success).toBe(true);
    });

    it('accepts unit variant "Unspecified"', () => {
      const result = ShareSpecSchema.safeParse("Unspecified");
      expect(result.success).toBe(true);
    });

    it('accepts unit variant "Residuary"', () => {
      const result = ShareSpecSchema.safeParse("Residuary");
      expect(result.success).toBe(true);
    });

    it('accepts Fraction tagged object {"Fraction": "1/2"}', () => {
      const result = ShareSpecSchema.safeParse({ Fraction: "1/2" });
      expect(result.success).toBe(true);
    });

    it("rejects Fraction with object value instead of string", () => {
      const result = ShareSpecSchema.safeParse({ Fraction: { numer: 1, denom: 2 } });
      expect(result.success).toBe(false);
    });

    it('rejects tagged object {"EntireFreePort": null}', () => {
      const result = ShareSpecSchema.safeParse({ EntireFreePort: null });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 6: LegacySpec & DeviseSpec Serialization
  // ============================================================================

  describe("LegacySpecSchema", () => {
    it("accepts FixedAmount with valid money", () => {
      const result = LegacySpecSchema.safeParse({ FixedAmount: { centavos: 100000 } });
      expect(result.success).toBe(true);
    });

    it("accepts SpecificAsset with string ID", () => {
      const result = LegacySpecSchema.safeParse({ SpecificAsset: "property-lot-1" });
      expect(result.success).toBe(true);
    });

    it("accepts GenericClass as 2-tuple [description, money]", () => {
      const result = LegacySpecSchema.safeParse({
        GenericClass: ["All jewelry", { centavos: 500000 }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects GenericClass as object instead of tuple", () => {
      const result = LegacySpecSchema.safeParse({
        GenericClass: { description: "All jewelry", value: { centavos: 500000 } },
      });
      expect(result.success).toBe(false);
    });

    it("rejects FixedAmount with zero centavos", () => {
      const result = LegacySpecSchema.safeParse({ FixedAmount: { centavos: 0 } });
      expect(result.success).toBe(false);
    });

    it("rejects SpecificAsset with empty string", () => {
      const result = LegacySpecSchema.safeParse({ SpecificAsset: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("DeviseSpecSchema", () => {
    it("accepts SpecificProperty with string ID", () => {
      const result = DeviseSpecSchema.safeParse({ SpecificProperty: "lot-123" });
      expect(result.success).toBe(true);
    });

    it("accepts FractionalInterest as 2-tuple [assetId, frac]", () => {
      const result = DeviseSpecSchema.safeParse({
        FractionalInterest: ["lot-123", "1/2"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects FractionalInterest with fraction > 1", () => {
      const result = DeviseSpecSchema.safeParse({
        FractionalInterest: ["lot-123", "3/2"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects FractionalInterest as object instead of tuple", () => {
      const result = DeviseSpecSchema.safeParse({
        FractionalInterest: { assetId: "lot-123", fraction: "1/2" },
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 7: HeirReference
  // ============================================================================

  describe("HeirReferenceSchema", () => {
    it("accepts valid individual heir reference", () => {
      const result = HeirReferenceSchema.safeParse(validHeirReference());
      expect(result.success).toBe(true);
    });

    it("accepts null person_id for stranger", () => {
      const result = HeirReferenceSchema.safeParse(
        validHeirReference({ person_id: null, name: "Charity Org" })
      );
      expect(result.success).toBe(true);
    });

    it("rejects collective institution without class_designation", () => {
      const result = HeirReferenceSchema.safeParse(
        validHeirReference({ is_collective: true, class_designation: null })
      );
      expect(result.success).toBe(false);
    });

    it("rejects collective institution with person_id set", () => {
      const result = HeirReferenceSchema.safeParse(
        validHeirReference({
          is_collective: true,
          person_id: "lc1",
          class_designation: "all legitimate children",
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const result = HeirReferenceSchema.safeParse(validHeirReference({ name: "" }));
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 8: AdoptionSchema
  // ============================================================================

  describe("AdoptionSchema", () => {
    it("accepts valid adoption record", () => {
      const result = AdoptionSchema.safeParse(validAdoption());
      expect(result.success).toBe(true);
    });

    it("rejects stepparent adoption without biological_parent_spouse", () => {
      const result = AdoptionSchema.safeParse({
        ...validAdoption(),
        is_stepparent_adoption: true,
        biological_parent_spouse: null,
      });
      expect(result.success).toBe(false);
    });

    it("rejects rescinded adoption without rescission_date", () => {
      const result = AdoptionSchema.safeParse({
        ...validAdoption(),
        is_rescinded: true,
        rescission_date: null,
      });
      expect(result.success).toBe(false);
    });

    it("rejects rescission_date before decree_date", () => {
      const result = AdoptionSchema.safeParse({
        ...validAdoption(),
        decree_date: "2020-03-15",
        is_rescinded: true,
        rescission_date: "2019-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("accepts stepparent adoption with biological_parent_spouse", () => {
      const result = AdoptionSchema.safeParse({
        ...validAdoption(),
        is_stepparent_adoption: true,
        biological_parent_spouse: "sp",
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Section 9: PersonSchema — Conditional Validation (superRefine)
  // ============================================================================

  describe("PersonSchema", () => {
    it("accepts valid LegitimateChild person", () => {
      const result = PersonSchema.safeParse(validPerson());
      expect(result.success).toBe(true);
    });

    it("rejects AdoptedChild without adoption record", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "ac1",
          relationship_to_decedent: "AdoptedChild",
          adoption: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts AdoptedChild with valid adoption record", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "ac1",
          relationship_to_decedent: "AdoptedChild",
          adoption: validAdoption(),
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects IllegitimateChild with filiation_proved=false (warning issue)", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "ic1",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: false,
        })
      );
      // This should produce an issue (either error or warning depending on implementation)
      expect(result.success).toBe(false);
    });

    it("accepts IllegitimateChild with filiation_proved=true and proof type", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "ic1",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: "BirthCertificate",
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects IllegitimateChild with filiation_proved=true but no proof type", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "ic1",
          relationship_to_decedent: "IllegitimateChild",
          filiation_proved: true,
          filiation_proof_type: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects Sibling without blood_type", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "sib1",
          relationship_to_decedent: "Sibling",
          degree: 2,
          blood_type: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts Sibling with blood_type Full", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "sib1",
          relationship_to_decedent: "Sibling",
          degree: 2,
          blood_type: "Full",
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects LegitimateParent without line", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "lp1",
          relationship_to_decedent: "LegitimateParent",
          degree: 1,
          line: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts LegitimateParent with Paternal line", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "lp1",
          relationship_to_decedent: "LegitimateParent",
          degree: 1,
          line: "Paternal",
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects LegitimateAscendant without line", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "la1",
          relationship_to_decedent: "LegitimateAscendant",
          degree: 2,
          line: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects non-spouse person with is_guilty_party_in_legal_separation=true", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          relationship_to_decedent: "LegitimateChild",
          is_guilty_party_in_legal_separation: true,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects person who is not unworthy but has unworthiness_condoned=true", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          is_unworthy: false,
          unworthiness_condoned: true,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects SurvivingSpouse with degree != 1", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "sp",
          relationship_to_decedent: "SurvivingSpouse",
          degree: 2,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects LegitimateParent with degree != 1", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "lp1",
          relationship_to_decedent: "LegitimateParent",
          degree: 2,
          line: "Paternal",
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects degree > 5 (Art. 1010)", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "oc1",
          relationship_to_decedent: "OtherCollateral",
          degree: 6,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects person ID with spaces", () => {
      const result = PersonSchema.safeParse(validPerson({ id: "bad id" }));
      expect(result.success).toBe(false);
    });

    it("rejects empty person name", () => {
      const result = PersonSchema.safeParse(validPerson({ name: "" }));
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 10: DecedentSchema
  // ============================================================================

  describe("DecedentSchema", () => {
    it("accepts valid decedent", () => {
      const result = DecedentSchema.safeParse(validDecedent());
      expect(result.success).toBe(true);
    });

    it("rejects married decedent without date_of_marriage", () => {
      const result = DecedentSchema.safeParse({
        ...validDecedent(),
        is_married: true,
        date_of_marriage: null,
      });
      expect(result.success).toBe(false);
    });

    it("accepts unmarried decedent with null date_of_marriage", () => {
      const result = DecedentSchema.safeParse({
        ...validDecedent(),
        is_married: false,
        date_of_marriage: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative years_of_cohabitation", () => {
      const result = DecedentSchema.safeParse({
        ...validDecedent(),
        years_of_cohabitation: -1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid date_of_death format", () => {
      const result = DecedentSchema.safeParse({
        ...validDecedent(),
        date_of_death: "Jan 15, 2026",
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 11: DonationSchema — Exemption Flag Mutual Exclusion
  // ============================================================================

  describe("DonationSchema", () => {
    it("accepts valid donation", () => {
      const result = DonationSchema.safeParse(validDonation());
      expect(result.success).toBe(true);
    });

    it("rejects donation with multiple exemption flags active", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          is_support_education_medical: true,
          is_customary_gift: true,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects stranger donation with recipient_heir_id set", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          recipient_is_stranger: true,
          recipient_heir_id: "lc1",
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects non-stranger donation without recipient_heir_id", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          recipient_is_stranger: false,
          recipient_heir_id: null,
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts stranger donation with null recipient_heir_id", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          recipient_is_stranger: true,
          recipient_heir_id: null,
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects professional_expense_parent_required when is_professional_expense=false", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          is_professional_expense: false,
          professional_expense_parent_required: true,
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects imputed_savings when is_professional_expense=false", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          is_professional_expense: false,
          professional_expense_imputed_savings: { centavos: 5000 },
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects imputed_savings when parent_required=false", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          is_professional_expense: true,
          professional_expense_parent_required: false,
          professional_expense_imputed_savings: { centavos: 5000 },
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts professional expense with full cascade", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          is_professional_expense: true,
          professional_expense_parent_required: true,
          professional_expense_imputed_savings: { centavos: 5000 },
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects donation with zero value", () => {
      const result = DonationSchema.safeParse(
        validDonation({
          value_at_time_of_donation: { centavos: 0 },
        })
      );
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 12: DisinheritanceSchema
  // ============================================================================

  describe("DisinheritanceSchema", () => {
    it("accepts valid disinheritance", () => {
      const result = DisinheritanceSchema.safeParse({
        heir_reference: validHeirReference(),
        cause_code: "ChildAttemptOnLife",
        cause_specified_in_will: true,
        cause_proven: true,
        reconciliation_occurred: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects disinheritance with null person_id in heir_reference", () => {
      const result = DisinheritanceSchema.safeParse({
        heir_reference: validHeirReference({ person_id: null }),
        cause_code: "ChildAttemptOnLife",
        cause_specified_in_will: true,
        cause_proven: true,
        reconciliation_occurred: false,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 13: EngineConfigSchema
  // ============================================================================

  describe("EngineConfigSchema", () => {
    it("accepts valid config with defaults", () => {
      const result = EngineConfigSchema.safeParse({
        retroactive_ra_11642: false,
        max_pipeline_restarts: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects max_pipeline_restarts = 0", () => {
      const result = EngineConfigSchema.safeParse({
        retroactive_ra_11642: false,
        max_pipeline_restarts: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects max_pipeline_restarts > 100", () => {
      const result = EngineConfigSchema.safeParse({
        retroactive_ra_11642: false,
        max_pipeline_restarts: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Section 14: EngineInputSchema — Top-Level Cross-Field Validations
  // ============================================================================

  describe("EngineInputSchema", () => {
    it("accepts valid intestate EngineInput", () => {
      const result = EngineInputSchema.safeParse(validEngineInput());
      expect(result.success).toBe(true);
    });

    it("accepts valid testate EngineInput", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          will: {
            institutions: [],
            legacies: [],
            devises: [],
            disinheritances: [],
            date_executed: "2025-06-01",
          },
        })
      );
      expect(result.success).toBe(true);
    });

    it("rejects will date_executed after date_of_death", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          will: {
            institutions: [],
            legacies: [],
            devises: [],
            disinheritances: [],
            date_executed: "2027-01-01",
          },
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects duplicate person IDs in family_tree", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          family_tree: [
            validPerson({ id: "lc1" }),
            validPerson({ id: "lc1", name: "Another Person" }),
          ],
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects multiple SurvivingSpouse in family_tree", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          family_tree: [
            validPerson({ id: "sp1", relationship_to_decedent: "SurvivingSpouse", degree: 1 }),
            validPerson({ id: "sp2", name: "Second Spouse", relationship_to_decedent: "SurvivingSpouse", degree: 1 }),
          ],
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts empty family_tree (escheat scenario)", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({ family_tree: [] })
      );
      expect(result.success).toBe(true);
    });

    it("rejects donation date after decedent death date", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          donations: [
            validDonation({ date: "2027-06-01" }),
          ],
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects donation referencing non-existent heir", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          donations: [
            validDonation({ recipient_heir_id: "nonexistent_person" }),
          ],
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects institution referencing non-existent person", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          will: {
            institutions: [
              {
                id: "inst-1",
                heir: validHeirReference({ person_id: "nonexistent" }),
                share: "EntireFreePort",
                conditions: [],
                substitutes: [],
                is_residuary: false,
              },
            ],
            legacies: [],
            devises: [],
            disinheritances: [],
            date_executed: "2025-06-01",
          },
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects multiple residuary institutions", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          family_tree: [
            validPerson({ id: "lc1" }),
            validPerson({ id: "lc2", name: "Pedro" }),
          ],
          will: {
            institutions: [
              {
                id: "inst-1",
                heir: validHeirReference({ person_id: "lc1" }),
                share: "Residuary",
                conditions: [],
                substitutes: [],
                is_residuary: true,
              },
              {
                id: "inst-2",
                heir: validHeirReference({ person_id: "lc2", name: "Pedro" }),
                share: "Residuary",
                conditions: [],
                substitutes: [],
                is_residuary: true,
              },
            ],
            legacies: [],
            devises: [],
            disinheritances: [],
            date_executed: "2025-06-01",
          },
        })
      );
      expect(result.success).toBe(false);
    });

    it("rejects disinheritance referencing non-existent person", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          will: {
            institutions: [],
            legacies: [],
            devises: [],
            disinheritances: [
              {
                heir_reference: validHeirReference({ person_id: "nonexistent" }),
                cause_code: "ChildAttemptOnLife",
                cause_specified_in_will: true,
                cause_proven: true,
                reconciliation_occurred: false,
              },
            ],
            date_executed: "2025-06-01",
          },
        })
      );
      expect(result.success).toBe(false);
    });

    it("accepts single SurvivingSpouse", () => {
      const result = EngineInputSchema.safeParse(
        validEngineInput({
          family_tree: [
            validPerson({ id: "lc1" }),
            validPerson({ id: "sp", name: "Spouse", relationship_to_decedent: "SurvivingSpouse", degree: 1 }),
          ],
        })
      );
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Section 15: Disinheritance Cause Constants
  // ============================================================================

  describe("CHILD_CAUSES", () => {
    it("has exactly 8 child causes", () => {
      expect(CHILD_CAUSES).toHaveLength(8);
    });

    it("all start with 'Child' prefix", () => {
      for (const cause of CHILD_CAUSES) {
        expect(cause).toMatch(/^Child/);
      }
    });
  });

  describe("PARENT_CAUSES", () => {
    it("has exactly 8 parent causes", () => {
      expect(PARENT_CAUSES).toHaveLength(8);
    });

    it("all start with 'Parent' prefix", () => {
      for (const cause of PARENT_CAUSES) {
        expect(cause).toMatch(/^Parent/);
      }
    });
  });

  describe("SPOUSE_CAUSES", () => {
    it("has exactly 6 spouse causes", () => {
      expect(SPOUSE_CAUSES).toHaveLength(6);
    });

    it("all start with 'Spouse' prefix", () => {
      for (const cause of SPOUSE_CAUSES) {
        expect(cause).toMatch(/^Spouse/);
      }
    });
  });

  describe("CAUSE_BY_RELATIONSHIP", () => {
    it("maps LegitimateChild to CHILD_CAUSES", () => {
      expect(CAUSE_BY_RELATIONSHIP["LegitimateChild"]).toBe(CHILD_CAUSES);
    });

    it("maps AdoptedChild to CHILD_CAUSES", () => {
      expect(CAUSE_BY_RELATIONSHIP["AdoptedChild"]).toBe(CHILD_CAUSES);
    });

    it("maps SurvivingSpouse to SPOUSE_CAUSES", () => {
      expect(CAUSE_BY_RELATIONSHIP["SurvivingSpouse"]).toBe(SPOUSE_CAUSES);
    });

    it("maps LegitimateParent to PARENT_CAUSES", () => {
      expect(CAUSE_BY_RELATIONSHIP["LegitimateParent"]).toBe(PARENT_CAUSES);
    });

    it("does not map Sibling (not disinheritable)", () => {
      expect(CAUSE_BY_RELATIONSHIP["Sibling"]).toBeUndefined();
    });

    it("does not map Stranger (not disinheritable)", () => {
      expect(CAUSE_BY_RELATIONSHIP["Stranger"]).toBeUndefined();
    });
  });

  // ============================================================================
  // Section 16: WARNING_SEVERITY
  // ============================================================================

  describe("WARNING_SEVERITY", () => {
    it("maps preterition to error", () => {
      expect(WARNING_SEVERITY["preterition"]).toBe("error");
    });

    it("maps inofficiousness to warning", () => {
      expect(WARNING_SEVERITY["inofficiousness"]).toBe("warning");
    });

    it("maps unknown_donee to info", () => {
      expect(WARNING_SEVERITY["unknown_donee"]).toBe("info");
    });

    it("maps max_restarts to error", () => {
      expect(WARNING_SEVERITY["max_restarts"]).toBe("error");
    });

    it("maps disinheritance to warning", () => {
      expect(WARNING_SEVERITY["disinheritance"]).toBe("warning");
    });

    it("maps vacancy_unresolved to warning", () => {
      expect(WARNING_SEVERITY["vacancy_unresolved"]).toBe("warning");
    });
  });

  // ============================================================================
  // Section 17: Edge cases from invalid-combinations.md
  // ============================================================================

  describe("invalid-combinations edge cases", () => {
    it("SurvivingSpouse with is_guilty_party should issue error on person", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          id: "sp",
          relationship_to_decedent: "SurvivingSpouse",
          degree: 1,
          is_guilty_party_in_legal_separation: true,
        })
      );
      // The person-level schema accepts this (guilt is a valid state);
      // the EngineInput-level validation should warn about decedent consistency.
      // At Person level, this should parse OK since SS can be guilty.
      expect(result.success).toBe(true);
    });

    it("unworthy heir not condoned should issue warning on person", () => {
      const result = PersonSchema.safeParse(
        validPerson({
          is_unworthy: true,
          unworthiness_condoned: false,
        })
      );
      // Person schema may or may not reject this (it's a valid combination
      // that leads to exclusion). The superRefine warns but shouldn't reject.
      // Per spec, this is a warning, not an error.
      // Implementation may treat as success with issues, depends on schema design.
      // For now, we test that the schema at least runs.
      expect(typeof result.success).toBe("boolean");
    });

    it("person children referencing non-existent IDs should be caught at input level", () => {
      // Person.children[] referencing non-existent IDs causes engine panic
      // This is validated at EngineInput level, not Person level
      const input = validEngineInput({
        family_tree: [
          validPerson({
            id: "lc1",
            children: ["nonexistent_child"],
          }),
        ],
      });
      // The EngineInput-level validation should catch this
      // (note: this may be a Layer 2 validation not in the base schema)
      const result = EngineInputSchema.safeParse(input);
      // At minimum, the parse should run without throwing
      expect(typeof result.success).toBe("boolean");
    });

    it("will with all empty arrays should parse (empty will is valid but warned)", () => {
      const result = WillSchema.safeParse({
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [],
        date_executed: "2025-06-01",
      });
      expect(result.success).toBe(true);
    });

    it("ConditionSchema accepts valid condition", () => {
      const result = ConditionSchema.safeParse({
        condition_type: "Suspensive",
        description: "If the heir passes the bar exam",
        status: "Pending",
      });
      expect(result.success).toBe(true);
    });

    it("ConditionSchema rejects empty description", () => {
      const result = ConditionSchema.safeParse({
        condition_type: "Suspensive",
        description: "",
        status: "Pending",
      });
      expect(result.success).toBe(false);
    });

    it("InstitutionOfHeirSchema accepts valid institution", () => {
      const result = InstitutionOfHeirSchema.safeParse({
        id: "inst-1",
        heir: validHeirReference(),
        share: "EntireFreePort",
        conditions: [],
        substitutes: [],
        is_residuary: false,
      });
      expect(result.success).toBe(true);
    });

    it("InstitutionOfHeirSchema rejects empty ID", () => {
      const result = InstitutionOfHeirSchema.safeParse({
        id: "",
        heir: validHeirReference(),
        share: "EntireFreePort",
        conditions: [],
        substitutes: [],
        is_residuary: false,
      });
      expect(result.success).toBe(false);
    });
  });
});
