import { describe, it, expect } from "vitest";
import {
  // Enum arrays
  RELATIONSHIPS,
  FILIATION_PROOFS,
  ADOPTION_REGIMES,
  LINES_OF_DESCENT,
  EFFECTIVE_CATEGORIES,
  INHERITANCE_MODES,
  BLOOD_TYPES,
  SUCCESSION_TYPES,
  SCENARIO_CODES,
  CONDITION_TYPES,
  CONDITION_STATUSES,
  SUBSTITUTION_TYPES,
  SUBSTITUTION_TRIGGERS,
  FIDEICOMMISSARY_VALIDATION_RESULTS,
  DISINHERITANCE_CAUSES,
  // Utility functions
  pesosToCentavos,
  centavosToPesos,
  formatPeso,
  serializeCentavos,
  fracToString,
  stringToFrac,
  // Display constants
  EFFECTIVE_CATEGORY_LABELS,
  SUCCESSION_TYPE_LABELS,
  WARNING_SEVERITY,
} from "../index";
import type {
  EngineInput,
  Person,
  Decedent,
  Money,
  Adoption,
  Will,
  Donation,
  EngineConfig,
  EngineOutput,
  InheritanceShare,
  HeirNarrative,
  Relationship,
  DisinheritanceCause,
} from "../index";

// ============================================================================
// Enum variant tests
// ============================================================================

describe("types", () => {
  describe("Relationship enum", () => {
    it("has exactly 11 variants", () => {
      expect(RELATIONSHIPS).toHaveLength(11);
    });

    it("contains all expected PascalCase variants", () => {
      const expected: Relationship[] = [
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
      ];
      for (const variant of expected) {
        expect(RELATIONSHIPS).toContain(variant);
      }
    });
  });

  describe("FiliationProof enum", () => {
    it("has exactly 6 variants", () => {
      expect(FILIATION_PROOFS).toHaveLength(6);
    });

    it("contains all expected variants", () => {
      expect(FILIATION_PROOFS).toContain("BirthCertificate");
      expect(FILIATION_PROOFS).toContain("FinalJudgment");
      expect(FILIATION_PROOFS).toContain("PublicDocumentAdmission");
      expect(FILIATION_PROOFS).toContain("PrivateHandwrittenAdmission");
      expect(FILIATION_PROOFS).toContain("OpenContinuousPossession");
      expect(FILIATION_PROOFS).toContain("OtherEvidence");
    });
  });

  describe("AdoptionRegime enum", () => {
    it("has exactly 2 variants", () => {
      expect(ADOPTION_REGIMES).toHaveLength(2);
    });

    it("contains Ra8552 and Ra11642", () => {
      expect(ADOPTION_REGIMES).toContain("Ra8552");
      expect(ADOPTION_REGIMES).toContain("Ra11642");
    });
  });

  describe("LineOfDescent enum", () => {
    it("has exactly 2 variants", () => {
      expect(LINES_OF_DESCENT).toHaveLength(2);
    });

    it("contains Paternal and Maternal", () => {
      expect(LINES_OF_DESCENT).toContain("Paternal");
      expect(LINES_OF_DESCENT).toContain("Maternal");
    });
  });

  describe("EffectiveCategory enum", () => {
    it("has exactly 5 variants", () => {
      expect(EFFECTIVE_CATEGORIES).toHaveLength(5);
    });

    it("contains all group variants", () => {
      expect(EFFECTIVE_CATEGORIES).toContain("LegitimateChildGroup");
      expect(EFFECTIVE_CATEGORIES).toContain("IllegitimateChildGroup");
      expect(EFFECTIVE_CATEGORIES).toContain("SurvivingSpouseGroup");
      expect(EFFECTIVE_CATEGORIES).toContain("LegitimateAscendantGroup");
      expect(EFFECTIVE_CATEGORIES).toContain("CollateralGroup");
    });
  });

  describe("InheritanceMode enum", () => {
    it("has exactly 2 variants", () => {
      expect(INHERITANCE_MODES).toHaveLength(2);
    });

    it("contains OwnRight and Representation", () => {
      expect(INHERITANCE_MODES).toContain("OwnRight");
      expect(INHERITANCE_MODES).toContain("Representation");
    });
  });

  describe("BloodType enum", () => {
    it("has exactly 2 variants", () => {
      expect(BLOOD_TYPES).toHaveLength(2);
    });

    it("contains Full and Half", () => {
      expect(BLOOD_TYPES).toContain("Full");
      expect(BLOOD_TYPES).toContain("Half");
    });
  });

  describe("SuccessionType enum", () => {
    it("has exactly 4 variants", () => {
      expect(SUCCESSION_TYPES).toHaveLength(4);
    });

    it("contains all succession types", () => {
      expect(SUCCESSION_TYPES).toContain("Testate");
      expect(SUCCESSION_TYPES).toContain("Intestate");
      expect(SUCCESSION_TYPES).toContain("Mixed");
      expect(SUCCESSION_TYPES).toContain("IntestateByPreterition");
    });
  });

  describe("ScenarioCode enum", () => {
    it("has exactly 30 variants (15 testate + 15 intestate)", () => {
      expect(SCENARIO_CODES).toHaveLength(30);
    });

    it("contains all T-codes", () => {
      const tCodes = ["T1", "T2", "T3", "T4", "T5a", "T5b", "T6", "T7", "T8",
        "T9", "T10", "T11", "T12", "T13", "T14", "T15"];
      for (const code of tCodes) {
        expect(SCENARIO_CODES).toContain(code);
      }
    });

    it("contains all I-codes", () => {
      const iCodes = ["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8",
        "I9", "I10", "I11", "I12", "I13", "I14", "I15"];
      for (const code of iCodes) {
        expect(SCENARIO_CODES).toContain(code);
      }
    });

    it("T5a and T5b have lowercase suffixes", () => {
      expect(SCENARIO_CODES).toContain("T5a");
      expect(SCENARIO_CODES).toContain("T5b");
      expect(SCENARIO_CODES).not.toContain("T5A");
      expect(SCENARIO_CODES).not.toContain("T5B");
    });
  });

  describe("ConditionType enum", () => {
    it("has exactly 3 variants", () => {
      expect(CONDITION_TYPES).toHaveLength(3);
    });

    it("contains Suspensive, Resolutory, Modal", () => {
      expect(CONDITION_TYPES).toContain("Suspensive");
      expect(CONDITION_TYPES).toContain("Resolutory");
      expect(CONDITION_TYPES).toContain("Modal");
    });
  });

  describe("ConditionStatus enum", () => {
    it("has exactly 4 variants", () => {
      expect(CONDITION_STATUSES).toHaveLength(4);
    });

    it("contains all statuses", () => {
      expect(CONDITION_STATUSES).toContain("Pending");
      expect(CONDITION_STATUSES).toContain("Fulfilled");
      expect(CONDITION_STATUSES).toContain("Failed");
      expect(CONDITION_STATUSES).toContain("NotApplicable");
    });
  });

  describe("SubstitutionType enum", () => {
    it("has exactly 3 variants", () => {
      expect(SUBSTITUTION_TYPES).toHaveLength(3);
    });

    it("contains Simple, Reciprocal, Fideicommissary", () => {
      expect(SUBSTITUTION_TYPES).toContain("Simple");
      expect(SUBSTITUTION_TYPES).toContain("Reciprocal");
      expect(SUBSTITUTION_TYPES).toContain("Fideicommissary");
    });
  });

  describe("SubstitutionTrigger enum", () => {
    it("has exactly 3 variants", () => {
      expect(SUBSTITUTION_TRIGGERS).toHaveLength(3);
    });

    it("contains Predecease, Renunciation, Incapacity", () => {
      expect(SUBSTITUTION_TRIGGERS).toContain("Predecease");
      expect(SUBSTITUTION_TRIGGERS).toContain("Renunciation");
      expect(SUBSTITUTION_TRIGGERS).toContain("Incapacity");
    });
  });

  describe("FideicommissaryValidationResult enum", () => {
    it("has exactly 3 variants", () => {
      expect(FIDEICOMMISSARY_VALIDATION_RESULTS).toHaveLength(3);
    });

    it("contains Valid, Invalid, PartialValid", () => {
      expect(FIDEICOMMISSARY_VALIDATION_RESULTS).toContain("Valid");
      expect(FIDEICOMMISSARY_VALIDATION_RESULTS).toContain("Invalid");
      expect(FIDEICOMMISSARY_VALIDATION_RESULTS).toContain("PartialValid");
    });
  });

  describe("DisinheritanceCause enum", () => {
    it("has exactly 22 variants (8 Child + 8 Parent + 6 Spouse)", () => {
      expect(DISINHERITANCE_CAUSES).toHaveLength(22);
    });

    it("has 8 Child causes (Art. 919)", () => {
      const childCauses: DisinheritanceCause[] = [
        "ChildAttemptOnLife",
        "ChildGroundlessAccusation",
        "ChildAdulteryWithSpouse",
        "ChildFraudUndueInfluence",
        "ChildRefusalToSupport",
        "ChildMaltreatment",
        "ChildDishonorableLife",
        "ChildCivilInterdiction",
      ];
      for (const cause of childCauses) {
        expect(DISINHERITANCE_CAUSES).toContain(cause);
      }
      expect(childCauses).toHaveLength(8);
    });

    it("has 8 Parent causes (Art. 920)", () => {
      const parentCauses: DisinheritanceCause[] = [
        "ParentAbandonmentCorruption",
        "ParentAttemptOnLife",
        "ParentGroundlessAccusation",
        "ParentAdulteryWithSpouse",
        "ParentFraudUndueInfluence",
        "ParentLossParentalAuthority",
        "ParentRefusalToSupport",
        "ParentAttemptOnOther",
      ];
      for (const cause of parentCauses) {
        expect(DISINHERITANCE_CAUSES).toContain(cause);
      }
      expect(parentCauses).toHaveLength(8);
    });

    it("has 6 Spouse causes (Art. 921)", () => {
      const spouseCauses: DisinheritanceCause[] = [
        "SpouseAttemptOnLife",
        "SpouseGroundlessAccusation",
        "SpouseFraudUndueInfluence",
        "SpouseCauseLegalSeparation",
        "SpouseLossParentalAuthority",
        "SpouseRefusalToSupport",
      ];
      for (const cause of spouseCauses) {
        expect(DISINHERITANCE_CAUSES).toContain(cause);
      }
      expect(spouseCauses).toHaveLength(6);
    });

    it("all variants use PascalCase", () => {
      for (const cause of DISINHERITANCE_CAUSES) {
        expect(cause).toMatch(/^[A-Z][a-zA-Z]+$/);
      }
    });
  });

  // ============================================================================
  // Utility function tests
  // ============================================================================

  describe("pesosToCentavos", () => {
    it("converts 500 pesos to 50000 centavos", () => {
      expect(pesosToCentavos(500)).toBe(50000);
    });

    it("converts 0 pesos to 0 centavos", () => {
      expect(pesosToCentavos(0)).toBe(0);
    });

    it("converts 1 peso to 100 centavos", () => {
      expect(pesosToCentavos(1)).toBe(100);
    });

    it("handles decimal pesos (500.25 -> 50025)", () => {
      expect(pesosToCentavos(500.25)).toBe(50025);
    });

    it("rounds to nearest centavo for floating-point imprecision", () => {
      // 19.99 * 100 = 1998.9999... in IEEE 754
      expect(pesosToCentavos(19.99)).toBe(1999);
    });

    it("handles large amounts", () => {
      expect(pesosToCentavos(1000000)).toBe(100000000);
    });
  });

  describe("centavosToPesos", () => {
    it("converts 50025 centavos to 500.25 pesos", () => {
      expect(centavosToPesos(50025)).toBe(500.25);
    });

    it("converts 0 centavos to 0 pesos", () => {
      expect(centavosToPesos(0)).toBe(0);
    });

    it("converts 100 centavos to 1 peso", () => {
      expect(centavosToPesos(100)).toBe(1);
    });

    it("accepts string centavos", () => {
      expect(centavosToPesos("50025")).toBe(500.25);
    });

    it("converts 100000000 centavos to 1000000 pesos", () => {
      expect(centavosToPesos(100000000)).toBe(1000000);
    });
  });

  describe("formatPeso", () => {
    it("formats 500000000 centavos as ₱5,000,000", () => {
      expect(formatPeso(500000000)).toBe("₱5,000,000");
    });

    it("formats 50025 centavos as ₱500.25", () => {
      expect(formatPeso(50025)).toBe("₱500.25");
    });

    it("formats 0 centavos as ₱0", () => {
      expect(formatPeso(0)).toBe("₱0");
    });

    it("formats 100 centavos as ₱1", () => {
      expect(formatPeso(100)).toBe("₱1");
    });

    it("omits centavos when they are zero", () => {
      expect(formatPeso(100000)).toBe("₱1,000");
    });

    it("always shows 2 digits for non-zero centavos", () => {
      expect(formatPeso(105)).toBe("₱1.05");
    });

    it("uses comma-separated thousands", () => {
      expect(formatPeso(100000000)).toBe("₱1,000,000");
    });

    it("includes ₱ prefix", () => {
      expect(formatPeso(100)).toMatch(/^₱/);
    });

    it("accepts string centavos for large values", () => {
      expect(formatPeso("99999999999999999999")).toMatch(/^₱/);
    });

    it("handles BigInt-safe boundary correctly", () => {
      // Number.MAX_SAFE_INTEGER = 9007199254740991
      // formatPeso should handle this via BigInt internally
      expect(formatPeso(9007199254740991)).toMatch(/^₱/);
    });
  });

  describe("serializeCentavos", () => {
    it("returns number for safe integers", () => {
      expect(serializeCentavos(50000)).toBe(50000);
    });

    it("returns number for zero", () => {
      expect(serializeCentavos(0)).toBe(0);
    });

    it("returns string for BigInt exceeding MAX_SAFE_INTEGER", () => {
      const big = BigInt("99999999999999999999");
      expect(typeof serializeCentavos(big)).toBe("string");
      expect(serializeCentavos(big)).toBe("99999999999999999999");
    });

    it("returns number for BigInt within safe range", () => {
      const small = BigInt(50000);
      expect(serializeCentavos(small)).toBe(50000);
    });
  });

  describe("fracToString", () => {
    it("converts 1/2 to '1/2'", () => {
      expect(fracToString(1, 2)).toBe("1/2");
    });

    it("converts 1/4 to '1/4'", () => {
      expect(fracToString(1, 4)).toBe("1/4");
    });

    it("converts 3/8 to '3/8'", () => {
      expect(fracToString(3, 8)).toBe("3/8");
    });

    it("handles 0 numerator", () => {
      expect(fracToString(0, 1)).toBe("0/1");
    });
  });

  describe("stringToFrac", () => {
    it("parses '1/2' to {numer: 1, denom: 2}", () => {
      expect(stringToFrac("1/2")).toEqual({ numer: 1, denom: 2 });
    });

    it("parses '1/4' to {numer: 1, denom: 4}", () => {
      expect(stringToFrac("1/4")).toEqual({ numer: 1, denom: 4 });
    });

    it("parses '3/8' to {numer: 3, denom: 8}", () => {
      expect(stringToFrac("3/8")).toEqual({ numer: 3, denom: 8 });
    });

    it("roundtrips with fracToString", () => {
      const str = fracToString(7, 16);
      const parsed = stringToFrac(str);
      expect(parsed).toEqual({ numer: 7, denom: 16 });
    });
  });

  // ============================================================================
  // Display constants tests
  // ============================================================================

  describe("EFFECTIVE_CATEGORY_LABELS", () => {
    it("has a label for every EffectiveCategory", () => {
      const categories = [
        "LegitimateChildGroup",
        "IllegitimateChildGroup",
        "SurvivingSpouseGroup",
        "LegitimateAscendantGroup",
        "CollateralGroup",
      ] as const;
      for (const cat of categories) {
        expect(EFFECTIVE_CATEGORY_LABELS[cat]).toBeDefined();
        expect(typeof EFFECTIVE_CATEGORY_LABELS[cat]).toBe("string");
        expect(EFFECTIVE_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
      }
    });

    it("maps LegitimateChildGroup to 'Legitimate Child'", () => {
      expect(EFFECTIVE_CATEGORY_LABELS.LegitimateChildGroup).toBe("Legitimate Child");
    });

    it("maps SurvivingSpouseGroup to 'Surviving Spouse'", () => {
      expect(EFFECTIVE_CATEGORY_LABELS.SurvivingSpouseGroup).toBe("Surviving Spouse");
    });
  });

  describe("SUCCESSION_TYPE_LABELS", () => {
    it("has a label for every SuccessionType", () => {
      const types = ["Testate", "Intestate", "Mixed", "IntestateByPreterition"] as const;
      for (const t of types) {
        expect(SUCCESSION_TYPE_LABELS[t]).toBeDefined();
        expect(typeof SUCCESSION_TYPE_LABELS[t]).toBe("string");
      }
    });

    it("maps Intestate to 'Intestate Succession'", () => {
      expect(SUCCESSION_TYPE_LABELS.Intestate).toBe("Intestate Succession");
    });
  });

  describe("WARNING_SEVERITY", () => {
    it("maps preterition to error", () => {
      expect(WARNING_SEVERITY.preterition).toBe("error");
    });

    it("maps inofficiousness to warning", () => {
      expect(WARNING_SEVERITY.inofficiousness).toBe("warning");
    });

    it("maps unknown_donee to info", () => {
      expect(WARNING_SEVERITY.unknown_donee).toBe("info");
    });

    it("maps max_restarts to error", () => {
      expect(WARNING_SEVERITY.max_restarts).toBe("error");
    });
  });

  // ============================================================================
  // Type structure tests (compile-time + runtime shape verification)
  // ============================================================================

  describe("EngineInput structure", () => {
    it("requires all 6 top-level fields", () => {
      const input: EngineInput = {
        net_distributable_estate: { centavos: 100000 },
        decedent: {
          id: "d",
          name: "Juan dela Cruz",
          date_of_death: "2026-01-15",
          is_married: true,
          date_of_marriage: "2000-06-15",
          marriage_solemnized_in_articulo_mortis: false,
          was_ill_at_marriage: false,
          illness_caused_death: false,
          years_of_cohabitation: 25,
          has_legal_separation: false,
          is_illegitimate: false,
        },
        family_tree: [],
        will: null,
        donations: [],
        config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
      };

      expect(input.net_distributable_estate).toBeDefined();
      expect(input.decedent).toBeDefined();
      expect(input.family_tree).toBeDefined();
      expect(input.will).toBeNull();
      expect(input.donations).toBeDefined();
      expect(input.config).toBeDefined();
    });

    it("accepts will: null for intestate succession", () => {
      const input: EngineInput = {
        net_distributable_estate: { centavos: 0 },
        decedent: {
          id: "d", name: "Test", date_of_death: "2026-01-01",
          is_married: false, date_of_marriage: null,
          marriage_solemnized_in_articulo_mortis: false,
          was_ill_at_marriage: false, illness_caused_death: false,
          years_of_cohabitation: 0, has_legal_separation: false,
          is_illegitimate: false,
        },
        family_tree: [],
        will: null,
        donations: [],
        config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
      };
      expect(input.will).toBeNull();
    });

    it("accepts a Will object for testate succession", () => {
      const will: Will = {
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [],
        date_executed: "2025-01-01",
      };
      expect(will.institutions).toEqual([]);
      expect(will.date_executed).toBe("2025-01-01");
    });
  });

  describe("Person structure", () => {
    it("requires id, name, and relationship_to_decedent", () => {
      const person: Person = {
        id: "lc1",
        name: "Maria",
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
      };

      expect(person.id).toBe("lc1");
      expect(person.name).toBe("Maria");
      expect(person.relationship_to_decedent).toBe("LegitimateChild");
    });

    it("has 15 fields", () => {
      const person: Person = {
        id: "sp",
        name: "Ana",
        is_alive_at_succession: true,
        relationship_to_decedent: "SurvivingSpouse",
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
      };
      expect(Object.keys(person)).toHaveLength(15);
    });

    it("accepts adoption record for AdoptedChild", () => {
      const adoption: Adoption = {
        decree_date: "2010-05-20",
        regime: "Ra8552",
        adopter: "d",
        adoptee: "ac1",
        is_stepparent_adoption: false,
        biological_parent_spouse: null,
        is_rescinded: false,
        rescission_date: null,
      };
      const person: Person = {
        id: "ac1",
        name: "Pedro",
        is_alive_at_succession: true,
        relationship_to_decedent: "AdoptedChild",
        degree: 1,
        line: null,
        children: [],
        filiation_proved: false,
        filiation_proof_type: null,
        is_guilty_party_in_legal_separation: false,
        adoption,
        is_unworthy: false,
        unworthiness_condoned: false,
        has_renounced: false,
        blood_type: null,
      };
      expect(person.adoption).toBeDefined();
      expect(person.adoption!.regime).toBe("Ra8552");
    });
  });

  describe("Decedent structure", () => {
    it("has 11 fields", () => {
      const decedent: Decedent = {
        id: "d",
        name: "Juan",
        date_of_death: "2026-01-15",
        is_married: true,
        date_of_marriage: "2000-06-15",
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
        years_of_cohabitation: 25,
        has_legal_separation: false,
        is_illegitimate: false,
      };
      expect(Object.keys(decedent)).toHaveLength(11);
    });

    it("accepts null date_of_marriage when not married", () => {
      const decedent: Decedent = {
        id: "d",
        name: "Juan",
        date_of_death: "2026-01-15",
        is_married: false,
        date_of_marriage: null,
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
        years_of_cohabitation: 0,
        has_legal_separation: false,
        is_illegitimate: false,
      };
      expect(decedent.date_of_marriage).toBeNull();
    });
  });

  describe("Money structure", () => {
    it("accepts number centavos", () => {
      const money: Money = { centavos: 50000 };
      expect(money.centavos).toBe(50000);
    });

    it("accepts string centavos for large values", () => {
      const money: Money = { centavos: "99999999999999999999" };
      expect(money.centavos).toBe("99999999999999999999");
    });
  });

  describe("Donation structure", () => {
    it("has 11 exemption flags", () => {
      const donation: Donation = {
        id: "don1",
        recipient_heir_id: "lc1",
        recipient_is_stranger: false,
        value_at_time_of_donation: { centavos: 100000 },
        date: "2020-01-01",
        description: "Gift",
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
      };
      // Count the boolean exemption flags (is_* and professional_expense_parent_required)
      const exemptionFlags = [
        donation.is_expressly_exempt,
        donation.is_support_education_medical,
        donation.is_customary_gift,
        donation.is_professional_expense,
        donation.is_joint_from_both_parents,
        donation.is_to_child_spouse_only,
        donation.is_joint_to_child_and_spouse,
        donation.is_wedding_gift,
        donation.is_debt_payment_for_child,
        donation.is_election_expense,
        donation.is_fine_payment,
      ];
      expect(exemptionFlags).toHaveLength(11);
    });
  });

  describe("EngineOutput structure", () => {
    it("has all required fields", () => {
      const output: EngineOutput = {
        per_heir_shares: [],
        narratives: [],
        computation_log: { steps: [], total_restarts: 0, final_scenario: "I1" },
        warnings: [],
        succession_type: "Intestate",
        scenario_code: "I1",
      };
      expect(output.per_heir_shares).toBeDefined();
      expect(output.narratives).toBeDefined();
      expect(output.computation_log).toBeDefined();
      expect(output.warnings).toBeDefined();
      expect(output.succession_type).toBe("Intestate");
      expect(output.scenario_code).toBe("I1");
    });
  });

  describe("InheritanceShare structure", () => {
    it("has all money fields as Money type", () => {
      const share: InheritanceShare = {
        heir_id: "lc1",
        heir_name: "Maria",
        heir_category: "LegitimateChildGroup",
        inherits_by: "OwnRight",
        represents: null,
        from_legitime: { centavos: 0 },
        from_free_portion: { centavos: 0 },
        from_intestate: { centavos: 50000 },
        total: { centavos: 50000 },
        legitime_fraction: "1/2",
        legal_basis: ["Art. 888"],
        donations_imputed: { centavos: 0 },
        gross_entitlement: { centavos: 50000 },
        net_from_estate: { centavos: 50000 },
      };
      expect(share.from_legitime.centavos).toBe(0);
      expect(share.net_from_estate.centavos).toBe(50000);
    });
  });

  describe("HeirNarrative structure", () => {
    it("has required fields", () => {
      const narrative: HeirNarrative = {
        heir_id: "lc1",
        heir_name: "Maria",
        heir_category_label: "legitimate child",
        text: "**Maria (legitimate child)** inherits ₱50,000 under Art. 888.",
      };
      expect(narrative.heir_id).toBe("lc1");
      expect(narrative.text).toContain("**Maria");
    });
  });

  // ============================================================================
  // Serialization format tests
  // ============================================================================

  describe("Serialization formats", () => {
    it("Money uses centavos field", () => {
      const money: Money = { centavos: 50000 };
      const json = JSON.stringify(money);
      expect(json).toBe('{"centavos":50000}');
    });

    it("ShareSpec unit variant serializes as bare string", () => {
      const share: ShareSpec = "EntireFreePort";
      expect(JSON.stringify(share)).toBe('"EntireFreePort"');
    });

    it("ShareSpec Fraction serializes as tagged object with string frac", () => {
      const share: ShareSpec = { Fraction: "1/2" };
      expect(JSON.stringify(share)).toBe('{"Fraction":"1/2"}');
    });

    it("LegacySpec GenericClass serializes as 2-tuple", () => {
      const spec: LegacySpec = { GenericClass: ["Books", { centavos: 50000 }] };
      const json = JSON.parse(JSON.stringify(spec));
      expect(json.GenericClass).toBeInstanceOf(Array);
      expect(json.GenericClass).toHaveLength(2);
      expect(json.GenericClass[0]).toBe("Books");
      expect(json.GenericClass[1]).toEqual({ centavos: 50000 });
    });

    it("DeviseSpec FractionalInterest serializes as 2-tuple", () => {
      const spec: DeviseSpec = { FractionalInterest: ["asset-1", "1/2"] };
      const json = JSON.parse(JSON.stringify(spec));
      expect(json.FractionalInterest).toBeInstanceOf(Array);
      expect(json.FractionalInterest).toHaveLength(2);
      expect(json.FractionalInterest[0]).toBe("asset-1");
      expect(json.FractionalInterest[1]).toBe("1/2");
    });

    it("will field is null for intestate", () => {
      const input: EngineInput = {
        net_distributable_estate: { centavos: 100000 },
        decedent: {
          id: "d", name: "Test", date_of_death: "2026-01-01",
          is_married: false, date_of_marriage: null,
          marriage_solemnized_in_articulo_mortis: false,
          was_ill_at_marriage: false, illness_caused_death: false,
          years_of_cohabitation: 0, has_legal_separation: false,
          is_illegitimate: false,
        },
        family_tree: [],
        will: null,
        donations: [],
        config: { retroactive_ra_11642: false, max_pipeline_restarts: 10 },
      };
      const json = JSON.parse(JSON.stringify(input));
      expect(json.will).toBeNull();
    });

    it("enums serialize as PascalCase strings", () => {
      const relationship: Relationship = "LegitimateChild";
      expect(JSON.stringify(relationship)).toBe('"LegitimateChild"');
    });
  });
});
